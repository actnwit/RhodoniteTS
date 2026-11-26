import { CameraComponent } from '../../components/Camera/CameraComponent';
import { TextureFormat } from '../../definitions/TextureFormat';
import { TextureParameter } from '../../definitions/TextureParameter';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { createMotionVectorMaterial } from '../../helpers/materials/createMotionVectorMaterial';
import { createTemporalAAResolveMaterial } from '../../helpers/materials/createTemporalAAResolveMaterial';
import { RenderableHelper } from '../../helpers/RenderableHelper';
import { RenderPassHelper } from '../../helpers/RenderPassHelper';
import type { Material } from '../../materials/core/Material';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { Vector2 } from '../../math/Vector2';
import { Vector4 } from '../../math/Vector4';
import type { Engine } from '../../system/Engine';
import type { RenderTargetTexture } from '../../textures/RenderTargetTexture';
import { Sampler } from '../../textures/Sampler';
import { Expression } from '../Expression';
import type { FrameBuffer } from '../FrameBuffer';
import { RenderPass } from '../RenderPass';
import { PreviousFrameDataTracker } from './PreviousFrameDataTracker';

/** The number of jitter positions before the sequence repeats. */
const JITTER_SEQUENCE_LENGTH = 8;

/**
 * Returns the element of the Halton low-discrepancy sequence with the given index and base.
 *
 * @param index - The index (1 or greater; index 0 returns 0)
 * @param base - The base (2 and 3 for the usual 2D sequence)
 * @returns A value in [0, 1)
 * @internal
 */
export function halton(index: number, base: number): number {
  let result = 0;
  let fraction = 1 / base;
  let i = index;
  while (i > 0) {
    result += fraction * (i % base);
    i = Math.floor(i / base);
    fraction /= base;
  }
  return result;
}

/**
 * Returns the jitter of the given frame in NDC units: a Halton(2, 3) sub-pixel offset in [-0.5, 0.5) pixels.
 *
 * @param frameIndex - The frame counter
 * @param width - The width of the render target in pixels
 * @param height - The height of the render target in pixels
 * @returns The NDC offset (one pixel is 2 / width horizontally)
 * @internal
 */
export function getTemporalAAJitter(frameIndex: number, width: number, height: number): Vector2 {
  const index = (frameIndex % JITTER_SEQUENCE_LENGTH) + 1;
  const x = halton(index, 2) - 0.5;
  const y = halton(index, 3) - 0.5;
  return Vector2.fromCopy2((x * 2) / width, (y * 2) / height);
}

/**
 * Temporal anti-aliasing for the ForwardRenderPipeline.
 *
 * @remarks
 * Every frame:
 * 1. `prepareFrame` (before `Engine.process`) moves the projection of the camera by a sub-pixel jitter, and keeps
 *    the world matrices, the bone data of the skeletons and the view projection matrix of the previous frame for
 *    the motion vectors (the strategies keep the blend shape weights of the previous frame).
 * 2. The motion vector pass renders the opaque primitives with the motion vector material into an RGBA16F target
 *    (xy: the motion in texture coordinates, z: the depth).
 * 3. The resolve pass blends the current frame with the history reprojected by the motion vectors
 *    (Catmull-Rom history sampling, variance clipping in YCoCg, inverse luminance weighting), writes the result
 *    into the output target and copies it into the history target.
 *
 * The motion vectors include the motion of skinned and morphed vertices: the motion vector material deforms each
 * vertex a second time with the bone data and the blend shape weights of the previous frame.
 *
 * @internal
 */
export class TemporalAASystem {
  private __engine: Engine;
  private __width = 0;
  private __height = 0;
  private __motionVectorFramebuffer: FrameBuffer;
  private __outputFramebuffer: FrameBuffer;
  private __historyFramebuffer: FrameBuffer;
  private __motionVectorMaterial: Material;
  private __resolveMaterial: Material;
  private __linearSampler: Sampler;
  private __nearestSampler: Sampler;
  private __motionVectorRenderPass: RenderPass;
  private __resolveRenderPass: RenderPass;
  private __expression: Expression;
  private __previousFrameDataTracker = new PreviousFrameDataTracker();
  private __frameIndex = 0;
  private __isHistoryValid = false;
  private __lastCamera?: CameraComponent;
  private __previousViewProjectionMatrix = MutableMatrix44.identity();

  /**
   * Creates the render targets, the materials and the passes of temporal anti-aliasing.
   *
   * @param engine - The engine instance
   * @param width - The width of the render targets in pixels
   * @param height - The height of the render targets in pixels
   * @param currentColorTexture - The texture of the current (jittered) frame to anti-alias
   */
  constructor(engine: Engine, width: number, height: number, currentColorTexture: RenderTargetTexture) {
    this.__engine = engine;
    // The morph weights uniform buffer keeps the weights of the previous frame from now on.
    engine._enablePreviousMorphWeights();
    this.__width = width;
    this.__height = height;

    this.__motionVectorFramebuffer = RenderableHelper.createFrameBuffer(engine, {
      width,
      height,
      textureNum: 1,
      textureFormats: [TextureFormat.RGBA16F],
      mipLevelCount: 1,
      createDepthBuffer: true,
      depthTextureFormat: TextureFormat.Depth32F,
    });
    this.__motionVectorFramebuffer.tryToSetUniqueName('TemporalAAMotionVector', true);
    this.__outputFramebuffer = RenderableHelper.createFrameBuffer(engine, {
      width,
      height,
      textureNum: 1,
      textureFormats: [TextureFormat.RGBA16F],
      mipLevelCount: 1,
      createDepthBuffer: false,
    });
    this.__outputFramebuffer.tryToSetUniqueName('TemporalAAOutput', true);
    this.__historyFramebuffer = RenderableHelper.createFrameBuffer(engine, {
      width,
      height,
      textureNum: 1,
      textureFormats: [TextureFormat.RGBA16F],
      mipLevelCount: 1,
      createDepthBuffer: false,
    });
    this.__historyFramebuffer.tryToSetUniqueName('TemporalAAHistory', true);

    this.__linearSampler = new Sampler(engine, {
      magFilter: TextureParameter.Linear,
      minFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
    });
    this.__linearSampler.create();
    this.__nearestSampler = new Sampler(engine, {
      magFilter: TextureParameter.Nearest,
      minFilter: TextureParameter.Nearest,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
    });
    this.__nearestSampler.create();

    // Motion vector pass: the opaque primitives of the scene with the motion vector material.
    this.__motionVectorMaterial = createMotionVectorMaterial(engine);
    const motionVectorRenderPass = new RenderPass(engine);
    motionVectorRenderPass.tryToSetUniqueName('TemporalAAMotionVector', true);
    // z = 1: the depth of the background, so that the closest surface around a pixel wins.
    motionVectorRenderPass.clearColor = Vector4.fromCopy4(0, 0, 1, 0);
    motionVectorRenderPass.toClearColorBuffer = true;
    motionVectorRenderPass.toClearDepthBuffer = true;
    motionVectorRenderPass.isVrRendering = false;
    motionVectorRenderPass.isOutputForVr = false;
    motionVectorRenderPass.setToRenderOpaquePrimitives(true);
    motionVectorRenderPass.setToRenderBlendWithZWritePrimitives(true);
    motionVectorRenderPass.setToRenderBlendWithoutZWritePrimitives(false);
    motionVectorRenderPass.setToRenderTranslucentPrimitives(false);
    motionVectorRenderPass.setFramebuffer(this.__motionVectorFramebuffer);
    motionVectorRenderPass.setMaterial(this.__motionVectorMaterial);
    this.__motionVectorRenderPass = motionVectorRenderPass;

    // Resolve pass: writes the output and copies it into the history (the second resolve target is a copy of
    // the render target after the pass, in both backends).
    this.__resolveMaterial = createTemporalAAResolveMaterial(engine);
    this.__resolveMaterial.setParameter('framebufferSize', Vector2.fromCopy2(width, height));
    this.__resolveMaterial.setTextureParameter(
      'historyTexture',
      this.__historyFramebuffer.getColorAttachedRenderTargetTexture(0)!,
      this.__linearSampler
    );
    this.__resolveMaterial.setTextureParameter(
      'velocityTexture',
      this.__motionVectorFramebuffer.getColorAttachedRenderTargetTexture(0)!,
      this.__nearestSampler
    );
    const resolveRenderPass = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      engine,
      this.__resolveMaterial,
      currentColorTexture,
      this.__nearestSampler
    );
    resolveRenderPass.tryToSetUniqueName('TemporalAAResolve', true);
    resolveRenderPass.isVrRendering = false;
    resolveRenderPass.isOutputForVr = false;
    resolveRenderPass.setFramebuffer(this.__outputFramebuffer);
    resolveRenderPass.setResolveFramebuffer2(this.__historyFramebuffer);
    this.__resolveRenderPass = resolveRenderPass;

    this.__expression = new Expression();
    this.__expression.tryToSetUniqueName('TemporalAA', true);
    this.__expression.addRenderPasses([motionVectorRenderPass, resolveRenderPass]);
  }

  /**
   * The expression that renders the motion vectors and resolves the anti-aliasing.
   * It has to run after the scene (opaque and transparent) is rendered into the current color texture.
   */
  get expression(): Expression {
    return this.__expression;
  }

  /** The anti-aliased result (RGBA16F). */
  get outputTexture(): RenderTargetTexture {
    return this.__outputFramebuffer.getColorAttachedRenderTargetTexture(0)!;
  }

  /** The motion vector texture (xy: the motion in texture coordinates, z: the depth). */
  get motionVectorTexture(): RenderTargetTexture {
    return this.__motionVectorFramebuffer.getColorAttachedRenderTargetTexture(0)!;
  }

  /** The weight of the current frame in the exponential blend (0-1, default 0.1). */
  set currentFrameWeight(weight: number) {
    this.__resolveMaterial.setParameter('currentFrameWeight', weight);
  }

  get currentFrameWeight(): number {
    return this.__resolveMaterial.getParameter('currentFrameWeight')._v[0];
  }

  /**
   * The size of the variance clipping box of the history in standard deviations (default 1). A large value
   * effectively disables the clipping, which makes wrong motion vectors visible as trails (for debugging).
   */
  set varianceClipGamma(gamma: number) {
    this.__resolveMaterial.setParameter('varianceClipGamma', gamma);
  }

  /** The number of frames prepared since the creation or the last reset of the history. */
  get frameIndex(): number {
    return this.__frameIndex;
  }

  /**
   * Sets the entities whose opaque primitives are rendered into the motion vector target.
   *
   * @param entities - The entities rendered by the main expressions of the pipeline
   */
  setEntities(entities: ISceneGraphEntity[]) {
    this.__motionVectorRenderPass.clearEntities();
    this.__motionVectorRenderPass.addEntities(entities);
    this.__previousFrameDataTracker.setEntities(entities);
  }

  /**
   * Discards the history: the next frame outputs the current frame without blending.
   * Call it when the view changes discontinuously (e.g. a camera cut).
   */
  resetHistory() {
    this.__isHistoryValid = false;
  }

  /**
   * Prepares the next frame. Call it once per frame before `Engine.process`.
   *
   * @param camera - The camera of the main render passes
   */
  prepareFrame(camera: CameraComponent | undefined) {
    if (camera == null) {
      return;
    }

    // The view projection matrix of the previous frame (the camera matrices have not been updated for this frame
    // yet). A different camera has no meaningful history.
    if (camera !== this.__lastCamera) {
      if (this.__lastCamera != null) {
        this.__lastCamera.jitterOffset = Vector2.zero();
      }
      this.__lastCamera = camera;
      this.__isHistoryValid = false;
    }
    MutableMatrix44.multiplyTo(
      camera.projectionMatrixWithoutJitter,
      camera.viewMatrix,
      this.__previousViewProjectionMatrix
    );
    this.__motionVectorMaterial.setParameter('previousViewProjectionMatrix', this.__previousViewProjectionMatrix);

    // Sub-pixel jitter of this frame.
    const jitter = getTemporalAAJitter(this.__frameIndex, this.__width, this.__height);
    camera.jitterOffset = jitter;
    this.__motionVectorMaterial.setParameter('currentJitter', jitter);
    this.__frameIndex++;

    if (this.__previousFrameDataTracker.update()) {
      this.__engine._markGpuInstanceDataDirty();
    }

    this.__resolveMaterial.setParameter('isHistoryValid', this.__isHistoryValid);
    this.__isHistoryValid = true;
  }

  /**
   * Releases the GPU resources and removes the jitter from the camera.
   */
  destroy3DAPIResources() {
    if (this.__lastCamera != null) {
      this.__lastCamera.jitterOffset = Vector2.zero();
      this.__lastCamera = undefined;
    }
    this.__motionVectorFramebuffer.destroy3DAPIResources();
    this.__outputFramebuffer.destroy3DAPIResources();
    this.__historyFramebuffer.destroy3DAPIResources();
    this.__previousFrameDataTracker.clear();
  }
}

/**
 * Returns the camera used by the given render passes: the camera of the first pass that has one, or the current
 * camera of the engine.
 *
 * @internal
 */
export function _getTemporalAACamera(engine: Engine, renderPasses: readonly RenderPass[]): CameraComponent | undefined {
  for (const renderPass of renderPasses) {
    if (renderPass.cameraComponent != null) {
      return renderPass.cameraComponent;
    }
  }
  return engine.componentRepository.getComponent(CameraComponent, CameraComponent.getCurrent(engine)) as
    | CameraComponent
    | undefined;
}
