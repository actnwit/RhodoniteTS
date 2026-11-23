import type { Size } from '../../../types';
import type { ShaderNodeJson } from '../../../types/ShaderNodeJson';
import type { WebXRSystem } from '../../../xr/WebXRSystem';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { RaymarchingComponent } from '../../components/Raymarching/RaymarchingComponent';
import { RnObject } from '../../core/RnObject';
import {
  ComponentType,
  CompositionType,
  PixelFormat,
  ToneMappingType,
  type ToneMappingTypeEnum,
} from '../../definitions';
import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { TextureFormat } from '../../definitions/TextureFormat';
import { TextureParameter } from '../../definitions/TextureParameter';
import { Bloom } from '../../helpers/BloomHelper';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { MaterialHelper } from '../../helpers/MaterialHelper';
import { RenderableHelper } from '../../helpers/RenderableHelper';
import { RenderPassHelper } from '../../helpers/RenderPassHelper';
import {
  type RaymarchingShadowPassParams,
  type RaymarchingShadowPassProvider,
  ShadowSystem,
} from '../../helpers/Shadow/ShadowSystem';
import type { Material } from '../../materials/core/Material';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { MiscUtil } from '../../misc';
import { Is } from '../../misc/Is';
import { Logger } from '../../misc/Logger';
import { Err, Ok } from '../../misc/Result';
import type { Engine } from '../../system/Engine';
import type { CubeTexture } from '../../textures/CubeTexture';
import type { RenderTargetTexture } from '../../textures/RenderTargetTexture';
import type { RenderTargetTexture2DArray } from '../../textures/RenderTargetTexture2DArray';
import { Sampler } from '../../textures/Sampler';
import { Expression } from '../Expression';
import { Frame } from '../Frame';
import type { FrameBuffer } from '../FrameBuffer';
import { RenderPass } from '../RenderPass';

type DrawFunc = (frame: Frame) => void;

/** Bounds that do not clip a ray: used when an SDF has no finite world AABB. */
const RAYMARCHING_UNBOUNDED_AABB_MIN = Object.freeze(Vector3.fromCopy3(-1e20, -1e20, -1e20));
const RAYMARCHING_UNBOUNDED_AABB_MAX = Object.freeze(Vector3.fromCopy3(1e20, 1e20, 1e20));

/** Cached world AABB of one SDF component (invalidated by version or world matrix). */
type RaymarchingAabb = {
  min: Vector3;
  max: Vector3;
};

/**
 * A forward rendering pipeline that provides advanced rendering features including shadows, bloom, tone mapping, and IBL.
 *
 * @remarks
 * ForwardRenderPipeline is a comprehensive rendering solution that handles multi-pass rendering setups
 * with features like MSAA, shadow mapping, bloom effects, and tone mapping. It supports both regular
 * rendering and WebXR multi-view rendering for VR applications.
 *
 * The pipeline automatically manages frame buffers, render targets, and expression chains to provide
 * a complete rendering solution similar to Unity's Universal Render Pipeline (URP).
 *
 * @example
 * ```typescript
 * const expressions = [...];
 * const matrix = [...];
 *
 * // Create and setup the render pipeline
 * const forwardRenderPipeline = new Rn.ForwardRenderPipeline();
 * await forwardRenderPipeline.setup(1024, 1024, {isShadow: true, isBloom: true});
 *
 * // Configure expressions and IBL
 * forwardRenderPipeline.setExpressions(expressions);
 *
 * const diffuseCubeTexture = new Rn.CubeTexture();
 * diffuseCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/diffuse/diffuse';
 * diffuseCubeTexture.isNamePosNeg = true;
 * diffuseCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * diffuseCubeTexture.mipmapLevelNumber = 1;
 *
 * const specularCubeTexture = new Rn.CubeTexture();
 * specularCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/specular/specular';
 * specularCubeTexture.isNamePosNeg = true;
 * specularCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * specularCubeTexture.mipmapLevelNumber = 10;
 *
 * forwardRenderPipeline.setIBLTextures(diffuseCubeTexture, specularCubeTexture);
 *
 * // Start the render loop
 * forwardRenderPipeline.startRenderLoop((frame) => {
 *   Rn.Engine.process(frame);
 * });
 * ```
 */
export class ForwardRenderPipeline extends RnObject {
  private __width = 0;
  private __height = 0;
  private __isShadow = false;
  private __isBloom = false;
  private __isSimple = false;
  private __shadowMapSize = 1024;
  private __frame?: Frame;
  private __frameBufferMultiView?: FrameBuffer;
  private __frameBufferMultiViewBlit?: FrameBuffer;
  private __frameBufferMultiViewBlitBackBuffer?: FrameBuffer;
  private __frameBufferMsaa?: FrameBuffer;
  private __frameBufferResolve?: FrameBuffer;
  private __frameBufferResolveForReference?: FrameBuffer;
  private __initialExpression?: Expression;

  /** main expressions */
  private __expressions: Expression[] = [];
  private __gizmoExpression: Expression = new Expression();

  private __generateMipmapsExpression?: Expression;
  private __multiViewBlitBackBufferExpression?: Expression;
  private __multiViewBlitExpression?: Expression;
  private __bloomExpression?: Expression;
  private __toneMappingExpression?: Expression;
  private __toneMappingMaterial?: Material;
  private __transparentOnlyExpressions: Expression[] = [];
  private __webXRSystem?: WebXRSystem;
  private __drawFunc?: DrawFunc;
  private __diffuseCubeTexture?: CubeTexture;
  private __specularCubeTexture?: CubeTexture;
  private __sheenCubeTexture?: CubeTexture;
  private __iblRotation = 0;
  private __diffuseIblContribution = 1.0;
  private __specularIblContribution = 1.0;
  private __raymarchingIblStates = new Map<number, string>();
  private __samplerForBackBuffer?: Sampler;
  /** Per-component raymarching materials and their buffer-less full-screen passes. */
  private __raymarchingComponentMaterials = new Map<number, Material>();
  private __raymarchingComponentPasses = new Map<number, RenderPass>();
  /** SID of the first per-component pass (it applies the per-frame shared material setup). */
  private __raymarchingFirstComponentPassSID = -1;
  /** Cached world AABBs of the SDFs, used for ray interval clipping and scissors. */
  private __raymarchingAabbCache = new Map<number, { aabbVersion: number; matrix: number[]; aabb: RaymarchingAabb }>();
  private __toneMappingType = ToneMappingType.GT_ToneMap;
  private __bloomHelper: Bloom;
  private __shadowSystem?: ShadowSystem;
  private __shadowExpressions: Expression[] = [];
  private __entitiesForShadow: ISceneGraphEntity[] = [];
  private __raymarchingExpression?: Expression;
  private __raymarchingRenderPass?: RenderPass;
  /** The merged SDF graph of the shadow-casting components. */
  private __raymarchingShadowJson?: ShaderNodeJson;
  private __raymarchingShadowRegularMaterial?: Material;
  /** Point light paraboloid shadow materials, one front/back pair per shadow slot. */
  private __raymarchingShadowPointSlots = new Map<number, { front: Material; back: Material }>();
  private __engine: Engine;

  constructor(engine: Engine) {
    super();
    this.__engine = engine;
    this.__bloomHelper = new Bloom(engine);
  }

  /**
   * Destroys all allocated 3D API resources including frame buffers and textures.
   *
   * @remarks
   * This method is called internally during resize operations and cleanup.
   * It ensures proper resource management by releasing GPU memory.
   *
   * @internal
   */
  private __destroyResources() {
    if (this.__frameBufferMultiView != null) {
      this.__frameBufferMultiView.destroy3DAPIResources();
      this.__frameBufferMultiView = undefined;
    }
    if (this.__frameBufferMultiViewBlit != null) {
      this.__frameBufferMultiViewBlit.destroy3DAPIResources();
      this.__frameBufferMultiViewBlit = undefined;
    }
    if (this.__frameBufferMsaa != null) {
      this.__frameBufferMsaa.destroy3DAPIResources();
      this.__frameBufferMsaa = undefined;
    }
    if (this.__frameBufferResolve != null) {
      this.__frameBufferResolve.destroy3DAPIResources();
      this.__frameBufferResolve = undefined;
    }
    if (this.__frameBufferResolveForReference != null) {
      this.__frameBufferResolveForReference.destroy3DAPIResources();
      this.__frameBufferResolveForReference = undefined;
    }
    this.__bloomHelper.destroy3DAPIResources();
    this.__frame = undefined;
    this.__generateMipmapsExpression = undefined;
    this.__multiViewBlitExpression = undefined;
    this.__bloomExpression = undefined;
    this.__toneMappingExpression = undefined;
    this.__raymarchingExpression = undefined;
    this.__raymarchingShadowJson = undefined;
    this.__raymarchingShadowRegularMaterial = undefined;
    this.__raymarchingShadowPointSlots.clear();
    // The passes reference the destroyed frame buffers; they are recreated on setup.
    this.__raymarchingComponentPasses.clear();
    this.__raymarchingAabbCache.clear();
    this.__raymarchingIblStates.clear();
  }

  /**
   * Initializes the rendering pipeline with the specified configuration.
   *
   * @param canvasWidth - The width of the rendering canvas in pixels
   * @param canvasHeight - The height of the rendering canvas in pixels
   * @param options - Configuration options for the pipeline
   * @param options.isShadow - Whether to enable shadow mapping (default: false)
   * @param options.isBloom - Whether to enable bloom post-processing effect (default: false)
   * @param options.shadowMapSize - Size of the shadow map texture in pixels (default: 1024)
   * @param options.isSimple - Whether to use simplified rendering without post-processing (default: false)
   *
   * @returns A Result indicating success or failure of the setup operation
   *
   * @remarks
   * This method must be called before using any other pipeline methods. It creates all necessary
   * frame buffers, render targets, and expressions based on the provided configuration.
   *
   * The method automatically detects WebXR capabilities and configures multi-view rendering
   * when appropriate for VR applications.
   *
   * @example
   * ```typescript
   * const result = await pipeline.setup(1920, 1080, {
   *   isShadow: true,
   *   isBloom: true,
   *   shadowMapSize: 2048
   * });
   *
   * if (result.isErr()) {
   *   console.error('Pipeline setup failed:', result.getErr());
   * }
   * ```
   */
  async setup(
    canvasWidth: number,
    canvasHeight: number,
    { isShadow = false, isBloom = false, shadowMapSize = 1024, isSimple = false } = {}
  ) {
    this.__width = canvasWidth;
    this.__height = canvasHeight;
    this.__isBloom = isBloom;
    this.__isShadow = isShadow;
    this.__isSimple = isSimple;
    this.__shadowMapSize = shadowMapSize;
    if (this.__frame != null) {
      return new Err({
        message: 'Already setup',
        error: undefined,
      });
    }

    const frame = new Frame();
    this.__frame = frame;

    if (!this.__isSimple) {
      const samplerForBackBuffer = new Sampler(this.__engine, {
        wrapS: TextureParameter.Repeat,
        wrapT: TextureParameter.Repeat,
        minFilter: TextureParameter.LinearMipmapLinear,
        magFilter: TextureParameter.Linear,
      });
      samplerForBackBuffer.create();
      this.__samplerForBackBuffer = samplerForBackBuffer;
      // create Frame Buffers
      this.__createRenderTargets(canvasWidth, canvasHeight);

      // depth moment FrameBuffer
      if (isShadow) {
        this.__shadowSystem = new ShadowSystem(this.__engine, shadowMapSize);
      }

      if (this.__frameBufferResolveForReference != null && !MiscUtil.isMobile()) {
        // generate mipmaps for process KHR_materials_transmittance
        this.__generateMipmapsExpression = this.__setupGenerateMipmapsExpression(this.__frameBufferResolveForReference);
      }

      if (this.__frameBufferMultiView != null) {
        // Make Blit Expression if VR MultiView is enabled
        this.__multiViewBlitBackBufferExpression = this.__setupMultiViewBlitBackBufferExpression(
          this.__frameBufferMultiView
        );
        this.__multiViewBlitExpression = this.__setupMultiViewBlitExpression(this.__frameBufferMultiView);
      }

      const mainFrameBufferResolve = this.__getMainFrameBufferResolve()!;
      let toneMappingTargetRenderTargetTexture: RenderTargetTexture =
        mainFrameBufferResolve.getColorAttachedRenderTargetTexture(0)!;

      // Bloom Expression
      if (isBloom) {
        const textureToBloom = mainFrameBufferResolve.getColorAttachedRenderTargetTexture(
          0
        ) as unknown as RenderTargetTexture;
        const { bloomExpression, bloomedRenderTarget } = this.__bloomHelper.createBloomExpression({
          textureToBloom,
          parameters: {},
        });
        this.__bloomExpression = bloomExpression;
        toneMappingTargetRenderTargetTexture = bloomedRenderTarget;
      }

      // ToneMapping Expression
      const toneMappingExpression = this.__setupToneMappingExpression(toneMappingTargetRenderTargetTexture);
      this.__toneMappingExpression = toneMappingExpression;
    }

    // Initial Expression
    this.__initialExpression = this.__setupInitialExpression();

    this.__webXRSystem = this.__engine.webXRSystem;

    if (this.__expressions.length > 0) {
      this.setExpressions(this.__expressions);
    }

    const [raymarchingExpression, raymarchingRenderPass] = this.__setupRaymarchingExpression();
    this.__raymarchingExpression = raymarchingExpression;
    this.__raymarchingRenderPass = raymarchingRenderPass;

    this.__setUpExpressionsForRendering();

    return new Ok();
  }

  /**
   * Gets the main frame buffer used for back buffer operations.
   *
   * @returns The frame buffer for back buffer operations, or undefined if not available
   *
   * @internal
   */
  private __getMainFrameBufferBackBuffer(): FrameBuffer | undefined {
    if (this.__frameBufferMultiView != null) {
      return this.__frameBufferMultiViewBlitBackBuffer;
    }
    return this.__frameBufferResolveForReference;
  }

  /**
   * Gets the main frame buffer used for resolve operations.
   *
   * @returns The frame buffer for resolve operations, or undefined if not available
   *
   * @internal
   */
  private __getMainFrameBufferResolve(): FrameBuffer | undefined {
    if (this.__frameBufferMultiView != null) {
      return this.__frameBufferMultiViewBlit;
    }
    return this.__frameBufferResolve;
  }

  /**
   * Gets the main frame buffer used for rendering operations.
   *
   * @returns The main frame buffer, or undefined if not available
   *
   * @internal
   */
  private __getMainFrameBuffer(): FrameBuffer | undefined {
    if (this.__frameBufferMultiView != null) {
      return this.__frameBufferMultiView;
    }
    return this.__frameBufferMsaa;
  }

  /**
   * Sets the expressions to be rendered by the pipeline.
   *
   * @param expressions - Array of expressions containing render passes and entities to render
   * @param options - Configuration options for expression setup
   * @param options.isTransmission - Whether to enable transmission rendering for transparent objects (default: true)
   *
   * @remarks
   * This method configures the expressions for both opaque and transparent rendering.
   * When transmission is enabled, transparent objects are rendered in a separate pass
   * to support advanced material effects like glass and water.
   *
   * The method automatically clones expressions for transparent rendering and configures
   * shadow expressions if shadow mapping is enabled.
   *
   * @example
   * ```typescript
   * const expressions = [sceneExpression, uiExpression];
   * pipeline.setExpressions(expressions, { isTransmission: true });
   * ```
   */
  public setExpressions(
    expressions: Expression[],
    options: {
      isTransmission: boolean;
    } = {
      isTransmission: true,
    }
  ) {
    // const expressionsOpaque = expressions.map((expression) => expression.clone());
    const expressionsTranslucent = expressions.map(expression => expression.clone());
    this.__setExpressionsInner(expressions, {
      isTransmission: options.isTransmission,
    });
    if (options.isTransmission) {
      this.__setTransparentExpressionsForTransmission(expressionsTranslucent);
    }

    if (this.__shadowSystem != null) {
      const entities = this.__expressions.flatMap(expression =>
        expression.renderPasses.flatMap(renderPass => renderPass.entities)
      ) as ISceneGraphEntity[];
      this.__shadowExpressions = this.__shadowSystem.getExpressions(
        entities,
        this.__getAdditionalShadowMaterials(),
        this.__getRaymarchingShadowPassProvider()
      );
    }

    this.__setUpExpressionsForRendering();
  }

  public setGizmoExpression(expression: Expression) {
    this.__gizmoExpression = expression;
  }

  /**
   * Starts the main rendering loop with the provided draw function.
   *
   * @param func - Function to be called each frame for rendering operations
   * @returns A Result indicating success or failure of starting the render loop
   *
   * @remarks
   * This method begins the continuous rendering loop using the system's render loop mechanism.
   * The provided function will be called every frame with the current frame object.
   *
   * The method automatically handles shadow system updates, expression management,
   * and frame processing.
   *
   * @example
   * ```typescript
   * const result = pipeline.startRenderLoop((frame) => {
   *   // Update scene
   *   Rn.Engine.process(frame);
   *
   *   // Custom per-frame logic
   *   updateAnimations();
   *   handleInput();
   * });
   *
   * if (result.isErr()) {
   *   console.error('Failed to start render loop:', result.getErr());
   * }
   * ```
   */
  startRenderLoop(func: (frame: Frame) => void) {
    if (this.__frame == null) {
      return new Err({
        message: 'not initialized.',
        error: undefined,
      });
    }

    this.__drawFunc = func;

    this.__setUpExpressionsForRendering();

    this.__engine.startRenderLoop(() => {
      // Read the fields every frame: resize() replaces the frame and the shadow system.
      const shadowSystem = this.__shadowSystem;
      if (shadowSystem != null) {
        // update shadow expressions if shadow mapping is enabled
        const entities = this.__entitiesForShadow;
        const additionalMaterials = this.__getAdditionalShadowMaterials();
        if (shadowSystem.isLightChanged()) {
          this.__shadowExpressions = shadowSystem.getExpressions(
            entities,
            additionalMaterials,
            this.__getRaymarchingShadowPassProvider()
          );
          this.__setUpExpressionsForRendering();
        }
        shadowSystem.setDepthBiasPV(entities, additionalMaterials);
      }
      // WebGPU uploads material values in the prerender stage, so the SDF shadow caster
      // parameters must be current before Engine.process runs.
      this.__syncRaymarchingShadowMaterialParameters();
      func(this.__frame!);
    });

    return new Ok();
  }

  /**
   * Executes a single frame render using the draw function provided to startRenderLoop.
   *
   * @remarks
   * This method allows manual control over frame rendering instead of using the automatic
   * render loop. It calls the draw function that was provided to startRenderLoop.
   *
   * @example
   * ```typescript
   * // Manual frame rendering
   * pipeline.draw();
   * ```
   */
  draw() {
    this.__drawFunc!(this.__frame!);
  }

  /**
   * Requests a refresh of the shadow map expressions on the next frame.
   * This is useful when materials with shadow support have been changed or added
   * (e.g., applying a shader with ClassicShader node).
   *
   * @remarks
   * When a new material with shadow support is applied, this method should be called
   * to ensure the shadow textures are properly set on the new material.
   *
   * @example
   * ```typescript
   * // After changing a material to one with shadow support
   * pipeline.setNeedsShadowMapRefresh();
   * ```
   */
  setNeedsShadowMapRefresh() {
    this.__shadowSystem?.setNeedsRefresh();
  }

  /**
   * Resizes the rendering pipeline to match new canvas dimensions.
   *
   * @param width - New width of the rendering canvas
   * @param height - New height of the rendering canvas
   * @returns A Result indicating success or failure of the resize operation
   *
   * @remarks
   * This method handles canvas resizing by destroying existing resources and recreating
   * them with the new dimensions. It automatically handles WebXR canvas sizing when
   * in VR mode.
   *
   * The method preserves all current pipeline settings (shadow, bloom, etc.) during resize.
   *
   * @example
   * ```typescript
   * window.addEventListener('resize', () => {
   *   const result = pipeline.resize(window.innerWidth, window.innerHeight);
   *   if (result.isErr()) {
   *     console.error('Resize failed:', result.getErr());
   *   }
   * });
   * ```
   */
  resize(width: Size, height: Size) {
    if (this.__frame == null) {
      return new Err({
        message: 'not initialized.',
        error: undefined,
      });
    }
    const webXRSystem = this.__webXRSystem;
    if (Is.exist(webXRSystem) && webXRSystem.isWebXRMode) {
      width = webXRSystem.getCanvasWidthForVr();
      height = webXRSystem.getCanvasHeightForVr();
    }

    if (width <= 0 || height <= 0) {
      let fallbackWidth = this.__width;
      let fallbackHeight = this.__height;
      if (fallbackWidth <= 0 || fallbackHeight <= 0) {
        const [currentWidth, currentHeight] = this.__engine.getCanvasSize();
        fallbackWidth = currentWidth;
        fallbackHeight = currentHeight;
      }
      if (fallbackWidth <= 0 || fallbackHeight <= 0) {
        fallbackWidth = 1;
        fallbackHeight = 1;
      }
      Logger.default.warn(
        `ForwardRenderPipeline.resize received non-positive dimensions (${width}x${height}). Falling back to ${fallbackWidth}x${fallbackHeight}.`
      );
      width = fallbackWidth;
      height = fallbackHeight;
    }

    // Preserve raymarching material before destroying resources
    const savedRaymarchingMaterial = this.getRaymarchingMaterial();

    this.__engine.resizeCanvas(width, height);

    this.__destroyResources();
    this.setup(width, height, {
      isShadow: this.__isShadow,
      isBloom: this.__isBloom,
      shadowMapSize: this.__shadowMapSize,
      isSimple: this.__isSimple,
    });

    // Restore raymarching material after setup
    if (savedRaymarchingMaterial != null) {
      this.setRaymarchingMaterial(savedRaymarchingMaterial);
    }

    return new Ok();
  }

  /**
   * Sets the IBL (Image-Based Lighting) cube textures for realistic lighting.
   *
   * @param diffuse - Diffuse IBL cube texture for ambient lighting
   * @param specular - Specular IBL cube texture for reflections
   * @param sheen - Optional sheen IBL cube texture for fabric-like materials
   *
   * @remarks
   * IBL textures provide realistic lighting by using pre-computed environment maps.
   * The diffuse texture provides ambient lighting, while the specular texture provides
   * reflections and specular highlights.
   *
   * The sheen texture is optional and used for materials with fabric-like properties.
   *
   * @example
   * ```typescript
   * const diffuseCube = new Rn.CubeTexture();
   * diffuseCube.baseUriToLoad = './assets/ibl/diffuse/diffuse';
   * diffuseCube.hdriFormat = Rn.HdriFormat.RGBE_PNG;
   *
   * const specularCube = new Rn.CubeTexture();
   * specularCube.baseUriToLoad = './assets/ibl/specular/specular';
   * specularCube.hdriFormat = Rn.HdriFormat.RGBE_PNG;
   * specularCube.mipmapLevelNumber = 10;
   *
   * pipeline.setIBLTextures(diffuseCube, specularCube);
   * ```
   */
  setIBLTextures(diffuse: CubeTexture, specular: CubeTexture, sheen?: CubeTexture) {
    this.__diffuseCubeTexture = diffuse;
    this.__specularCubeTexture = specular;
    if (Is.exist(sheen)) {
      this.__sheenCubeTexture = sheen;
    }
    this.__setIblInner();
    this.__setIblInnerForTransparentOnly();
    this.__applyIblToRaymarchingMaterial();

    this.__setUpExpressionsForRendering();
  }

  /**
   * Gets the initial expression used for buffer clearing and setup.
   *
   * @returns The initial expression, or undefined if not available
   *
   * @remarks
   * The initial expression is automatically created during setup and handles
   * clearing of color and depth buffers before main rendering begins.
   */
  getInitialExpression(): Expression | undefined {
    return this.__initialExpression;
  }

  /**
   * Gets the tone mapping expression used for HDR to LDR conversion.
   *
   * @returns The tone mapping expression, or undefined if not available
   *
   * @remarks
   * The tone mapping expression is created during setup when not in simple mode.
   * It handles the conversion from high dynamic range rendering to low dynamic range
   * output suitable for display devices.
   */
  getToneMappingExpression(): Expression | undefined {
    return this.__toneMappingExpression;
  }

  /**
   * Sets the contribution factor for diffuse IBL lighting.
   *
   * @param value - Contribution factor (0.0 to 1.0 or higher for over-exposure effects)
   *
   * @remarks
   * This method controls how much the diffuse IBL texture contributes to the final lighting.
   * A value of 0.0 disables diffuse IBL, while 1.0 provides full contribution.
   * Values greater than 1.0 can be used for artistic over-exposure effects.
   *
   * @example
   * ```typescript
   * // Reduce ambient lighting
   * pipeline.setDiffuseIBLContribution(0.5);
   *
   * // Disable diffuse IBL
   * pipeline.setDiffuseIBLContribution(0.0);
   *
   * // Over-expose for artistic effect
   * pipeline.setDiffuseIBLContribution(2.0);
   * ```
   */
  setDiffuseIBLContribution(value: number) {
    this.__diffuseIblContribution = value;
    this.__applyIblToRaymarchingMaterial();
    for (const expression of this.__expressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.diffuseCubeMapContribution = value;
          }
        }
      }
    }
    for (const expression of this.__transparentOnlyExpressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.diffuseCubeMapContribution = value;
          }
        }
      }
    }
  }

  /**
   * Sets the contribution factor for specular IBL reflections.
   *
   * @param value - Contribution factor (0.0 to 1.0 or higher for over-exposure effects)
   *
   * @remarks
   * This method controls how much the specular IBL texture contributes to reflections
   * and specular highlights. A value of 0.0 disables specular IBL, while 1.0 provides
   * full contribution. Values greater than 1.0 can create over-exposed reflections.
   *
   * @example
   * ```typescript
   * // Subtle reflections
   * pipeline.setSpecularIBLContribution(0.3);
   *
   * // No reflections
   * pipeline.setSpecularIBLContribution(0.0);
   *
   * // Enhanced reflections
   * pipeline.setSpecularIBLContribution(1.5);
   * ```
   */
  setSpecularIBLContribution(value: number) {
    this.__specularIblContribution = value;
    this.__applyIblToRaymarchingMaterial();
    for (const expression of this.__expressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.specularCubeMapContribution = value;
          }
        }
      }
    }
    for (const expression of this.__transparentOnlyExpressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.specularCubeMapContribution = value;
          }
        }
      }
    }
  }

  /**
   * Sets the rotation of the IBL environment in radians.
   *
   * @param radian - Rotation angle in radians
   *
   * @remarks
   * This method allows rotating the IBL environment to match the desired lighting
   * direction. This is useful when the IBL doesn't align with the scene's lighting
   * requirements or for artistic control over the environment lighting.
   *
   * @example
   * ```typescript
   * // Rotate IBL by 90 degrees
   * pipeline.setIBLRotation(Math.PI / 2);
   *
   * // Rotate IBL by 180 degrees
   * pipeline.setIBLRotation(Math.PI);
   *
   * // Animate IBL rotation
   * let rotation = 0;
   * setInterval(() => {
   *   rotation += 0.01;
   *   pipeline.setIBLRotation(rotation);
   * }, 16);
   * ```
   */
  setIBLRotation(radian: number) {
    this.__iblRotation = radian;
    this.__applyIblToRaymarchingMaterial();
    for (const expression of this.__expressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.rotationOfCubeMap = radian;
          }
        }
      }
    }
  }

  /**
   * Internal method to configure expressions for opaque and blended rendering.
   *
   * @param expressions - Array of expressions to configure
   * @param options - Configuration options
   * @param options.isTransmission - Whether transmission rendering is enabled
   *
   * @internal
   */
  private __setExpressionsInner(
    expressions: Expression[],
    options: {
      isTransmission: boolean;
    } = {
      isTransmission: true,
    }
  ) {
    for (const expression of expressions) {
      for (const rp of expression.renderPasses) {
        rp.setToRenderOpaquePrimitives(true);
        rp.setToRenderBlendWithZWritePrimitives(true);
        rp.setToRenderBlendWithoutZWritePrimitives(true);
        if (options.isTransmission) {
          // if options.isTransmission is true, set toRenderTransparentPrimitives to false,
          // because transparent primitives are rendered in later expression.
          rp.setToRenderTranslucentPrimitives(false);
        } else {
          // if options.isTransmission is false, set toRenderTransparentPrimitives to true.
          // because transparent primitives are rendered in this expression as well as opaque primitives.
          rp.setToRenderTranslucentPrimitives(true);
        }

        // clearing depth is done in initial expression. so no need to clear depth in this render pass.
        rp.toClearDepthBuffer = false;
        if (!this.__isSimple) {
          const mainFrameBuffer = this.__getMainFrameBuffer();
          if (mainFrameBuffer != null) {
            rp.setFramebuffer(mainFrameBuffer);
            if (this.__frameBufferMsaa != null) {
              rp.setResolveFramebuffer(this.__frameBufferResolve!);
              rp.setResolveFramebuffer2(this.__frameBufferResolveForReference!);
            }
          }
        }
      }
    }
    this.__expressions = expressions;
    this.__setIblInner();
  }

  /**
   * Internal method to configure expressions specifically for transparent object transmission.
   *
   * @param expressions - Array of expressions to configure for transmission
   *
   * @remarks
   * This method sets up expressions for rendering transparent objects with transmission
   * effects like glass and water. It configures back buffer access for refraction effects.
   *
   * @internal
   */
  private __setTransparentExpressionsForTransmission(expressions: Expression[]) {
    for (const expression of expressions) {
      expression.tryToSetUniqueName('modelTransparentForTransmission', true);
      for (const rp of expression.renderPasses) {
        rp.setToRenderOpaquePrimitives(false); // not to render opaque primitives in transmission expression.
        rp.setToRenderTranslucentPrimitives(true);
        rp.setToRenderBlendWithZWritePrimitives(false);
        rp.setToRenderBlendWithoutZWritePrimitives(false);
        rp.toClearDepthBuffer = false;
        // This clone draws translucent primitives over the already rendered main image, and it
        // renders into the main framebuffer, so clearing the color buffer here would wipe the
        // main pass. The clear flags are inherited from the application's render pass.
        rp.toClearColorBuffer = false;
        // rp.isDepthTest = false;
        // rp.depthWriteMask = false;
        if (!this.__isSimple) {
          rp.setFramebuffer(this.__getMainFrameBuffer()!);
          if (this.__frameBufferResolve != null) {
            rp.setResolveFramebuffer(this.__frameBufferResolve);
          }
          for (const entity of rp.entities) {
            const meshComponent = entity.tryToGetMesh();
            if (Is.exist(meshComponent)) {
              const mesh = meshComponent.mesh;
              if (Is.exist(mesh)) {
                for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
                  const primitive = mesh.getPrimitiveAt(i);
                  primitive.material.setTextureParameter(
                    'backBufferTexture',
                    this.__getMainFrameBufferBackBuffer()!.getColorAttachedRenderTargetTexture(0)!,
                    this.__samplerForBackBuffer!
                  );
                }
              }
            }
          }
        }
      }
    }
    this.__transparentOnlyExpressions = expressions;
    this.__setIblInnerForTransparentOnly();
  }

  /**
   * Refreshes the back buffer texture on all transparent materials.
   * This is useful when materials are dynamically changed and need to have
   * the back buffer texture re-applied for transmission rendering.
   *
   * Call this method after changing materials on entities that use transmission
   * to ensure the back buffer texture is properly set.
   */
  public refreshBackBufferTextureOnTransparentMaterials(): void {
    if (this.__isSimple) {
      return;
    }
    const backBufferTexture = this.__getMainFrameBufferBackBuffer()?.getColorAttachedRenderTargetTexture(0);
    const sampler = this.__samplerForBackBuffer;
    if (backBufferTexture == null || sampler == null) {
      return;
    }
    for (const expression of this.__transparentOnlyExpressions) {
      for (const rp of expression.renderPasses) {
        for (const entity of rp.entities) {
          const meshComponent = entity.tryToGetMesh();
          if (Is.exist(meshComponent)) {
            const mesh = meshComponent.mesh;
            if (Is.exist(mesh)) {
              for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
                const primitive = mesh.getPrimitiveAt(i);
                primitive.material.setTextureParameter('backBufferTexture', backBufferTexture, sampler);
              }
            }
          }
        }
      }
    }
  }

  /**
   * Creates and configures the initial expression for buffer clearing.
   *
   * @returns The configured initial expression
   *
   * @internal
   */
  private __setupInitialExpression() {
    const expression = new Expression();
    expression.tryToSetUniqueName('Initial', true);

    // render pass to clear buffers of render texture
    const initialRenderPass = new RenderPass(this.__engine);
    initialRenderPass.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    initialRenderPass.toClearColorBuffer = true;
    initialRenderPass.toClearDepthBuffer = true;
    initialRenderPass.isOutputForVr = true;
    initialRenderPass.tryToSetUniqueName('InitialRenderPass', true);
    expression.addRenderPasses([initialRenderPass]);

    // render pass to clear buffers of framebuffer
    if (!this.__isSimple) {
      const initialRenderPassForFrameBuffer = new RenderPass(this.__engine);
      initialRenderPassForFrameBuffer.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
      initialRenderPassForFrameBuffer.toClearColorBuffer = true;
      initialRenderPassForFrameBuffer.toClearDepthBuffer = true;
      initialRenderPassForFrameBuffer.setFramebuffer(this.__getMainFrameBuffer()!);
      initialRenderPassForFrameBuffer.tryToSetUniqueName('InitialRenderPassForFrameBuffer', true);
      expression.addRenderPasses([initialRenderPassForFrameBuffer]);
    }

    return expression;
  }

  /**
   * Creates render targets and frame buffers based on canvas dimensions and WebXR support.
   *
   * @param canvasWidth - Width of the canvas
   * @param canvasHeight - Height of the canvas
   *
   * @remarks
   * This method automatically detects WebXR multi-view support and creates appropriate
   * render targets. For VR, it creates texture arrays for multi-view rendering.
   * For regular rendering, it creates MSAA frame buffers with resolve targets.
   *
   * @internal
   */
  private __createRenderTargets(canvasWidth: number, canvasHeight: number) {
    const webXRSystem = this.__engine.webXRSystem;
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    if (
      Is.exist(webXRSystem) &&
      webXRSystem.isWebXRMode &&
      cgApiResourceRepository.isSupportMultiViewVRRendering(this.__engine)
    ) {
      const framebufferMultiView = RenderableHelper.createFrameBufferTextureArrayForMultiView(this.__engine, {
        width: canvasWidth / 2,
        height: canvasHeight,
        arrayLength: 2,
        level: 0,
        internalFormat: this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8,
        format: this.__isBloom ? PixelFormat.RGB : PixelFormat.RGBA,
        type: this.__isBloom ? ComponentType.Float : ComponentType.UnsignedByte,
      });
      framebufferMultiView.tryToSetUniqueName('FramebufferTargetOfToneMappingMultiView', true);
      const framebufferMultiViewBlit = RenderableHelper.createFrameBuffer(this.__engine, {
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: false,
      });

      framebufferMultiViewBlit.tryToSetUniqueName('FramebufferTargetOfToneMappingMultiViewBlit', true);

      const framebufferMultiViewBlitBackBuffer = RenderableHelper.createFrameBuffer(this.__engine, {
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: false,
      });
      framebufferMultiViewBlitBackBuffer.tryToSetUniqueName(
        'FramebufferTargetOfToneMappingMultiViewBlitBackBuffer',
        true
      );

      this.__frameBufferMultiView = framebufferMultiView;
      this.__frameBufferMultiViewBlit = framebufferMultiViewBlit;
      this.__frameBufferMultiViewBlitBackBuffer = framebufferMultiViewBlitBackBuffer;
      this.__frameBufferMsaa = undefined;
      this.__frameBufferResolve = undefined;
      this.__frameBufferResolveForReference = undefined;
    } else {
      console.log(`canvasWidth: ${canvasWidth}, canvasHeight: ${canvasHeight}`);
      // MSAA depth
      const framebufferMsaa = RenderableHelper.createFrameBufferMSAA(this.__engine, {
        width: canvasWidth,
        height: canvasHeight,
        colorBufferNum: 1,
        colorFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        sampleCountMSAA: 4,
        depthBufferFormat: TextureFormat.Depth32F,
      });
      framebufferMsaa.tryToSetUniqueName('FramebufferTargetOfToneMappingMsaa', true);

      // Resolve Color 1
      const framebufferResolve = RenderableHelper.createFrameBuffer(this.__engine, {
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: true,
        depthTextureFormat: TextureFormat.Depth32F,
      });
      framebufferResolve.tryToSetUniqueName('FramebufferTargetOfToneMappingResolve', true);

      // Resolve Color 2
      const framebufferResolveForReference = RenderableHelper.createFrameBuffer(this.__engine, {
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: false,
      });
      framebufferResolveForReference.tryToSetUniqueName('FramebufferTargetOfToneMappingResolveForReference', true);

      // FrameBuffers
      this.__frameBufferMultiView = undefined;
      this.__frameBufferMultiViewBlit = undefined;
      this.__frameBufferMultiViewBlitBackBuffer = undefined;
      this.__frameBufferMsaa = framebufferMsaa;
      this.__frameBufferResolve = framebufferResolve;
      this.__frameBufferResolveForReference = framebufferResolveForReference;
    }
  }

  /**
   * Sets up an expression for generating mipmaps on resolve frame buffers.
   *
   * @param resolveFramebuffer2 - The frame buffer to generate mipmaps for
   * @returns The configured mipmap generation expression
   *
   * @internal
   */
  private __setupGenerateMipmapsExpression(resolveFramebuffer2: FrameBuffer) {
    const expression = new Expression();
    expression.tryToSetUniqueName('GenerateMipmaps', true);
    const renderPass = new RenderPass(this.__engine);
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('GenerateMipmaps', true);

    renderPass.toClearDepthBuffer = false;

    // Generate Mipmap of resolve Framebuffer 2
    renderPass.setPostRenderFunction(function (this: RenderPass): void {
      const renderTargetTexture = resolveFramebuffer2.getColorAttachedRenderTargetTexture(0)!;
      renderTargetTexture.generateMipmaps();
    });

    return expression;
  }

  /**
   * Sets up an expression for blitting multi-view rendering to back buffer.
   *
   * @param multiViewFrameBuffer - The multi-view frame buffer to blit from
   * @returns The configured blit expression
   *
   * @internal
   */
  private __setupMultiViewBlitBackBufferExpression(multiViewFrameBuffer: FrameBuffer) {
    const expression = new Expression();
    expression.tryToSetUniqueName('MultiViewBlitBackBuffer', true);
    const renderPass = new RenderPass(this.__engine);
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('MultiViewBlitBackBuffer', true);

    renderPass.toClearDepthBuffer = false;

    // Generate Mipmap of resolve Framebuffer 2
    renderPass.setPostRenderFunction(() => {
      if (this.__frameBufferMultiViewBlitBackBuffer != null && !MiscUtil.isMobile()) {
        const texture = this.__frameBufferMultiViewBlitBackBuffer.colorAttachments[0] as RenderTargetTexture2DArray;
        (multiViewFrameBuffer.colorAttachments[0] as RenderTargetTexture2DArray).blitToTexture2dFromTexture2dArrayFake(
          texture
        );
        texture.generateMipmaps();
      }
    });

    return expression;
  }

  /**
   * Sets up an expression for blitting multi-view rendering results.
   *
   * @param multiViewFrameBuffer - The multi-view frame buffer to blit from
   * @returns The configured blit expression
   *
   * @internal
   */
  private __setupMultiViewBlitExpression(multiViewFrameBuffer: FrameBuffer) {
    const expression = new Expression();
    expression.tryToSetUniqueName('MultiViewBlit', true);
    const renderPass = new RenderPass(this.__engine);
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('MultiViewBlit', true);

    renderPass.toClearDepthBuffer = false;

    // Generate Mipmap of resolve Framebuffer 2
    renderPass.setPostRenderFunction(() => {
      if (this.__frameBufferMultiViewBlit != null) {
        const texture = this.__frameBufferMultiViewBlit.colorAttachments[0] as RenderTargetTexture2DArray;
        (multiViewFrameBuffer.colorAttachments[0] as RenderTargetTexture2DArray).blitToTexture2dFromTexture2dArrayFake(
          texture
        );
      }
    });

    return expression;
  }

  /**
   * Sets up the tone mapping expression for HDR to LDR conversion.
   *
   * @param toneMappingTargetRenderTargetTexture - The render target texture to apply tone mapping to
   * @returns The configured tone mapping expression
   *
   * @remarks
   * This method creates both regular and VR-specific tone mapping render passes.
   * The tone mapping converts high dynamic range rendering results to low dynamic range
   * output suitable for display devices.
   *
   * @internal
   */
  private __setupToneMappingExpression(toneMappingTargetRenderTargetTexture: RenderTargetTexture) {
    const expressionToneMappingEffect = new Expression();
    const materialToneMapping = MaterialHelper.createToneMappingMaterial(this.__engine);
    this.__toneMappingMaterial = materialToneMapping;
    this.setToneMappingType(this.__toneMappingType);

    // Rendering for Canvas Frame Buffer
    const renderPassToneMapping = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      this.__engine,
      materialToneMapping,
      toneMappingTargetRenderTargetTexture
    );
    renderPassToneMapping.tryToSetUniqueName('renderPassToneMapping', true);
    renderPassToneMapping.toClearColorBuffer = false;
    renderPassToneMapping.toClearDepthBuffer = false;
    renderPassToneMapping.isDepthTest = false;
    renderPassToneMapping.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    renderPassToneMapping.isVrRendering = false;
    renderPassToneMapping.isOutputForVr = false;

    // Rendering for VR HeadSet Frame Buffer
    const renderPassToneMappingVr = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      this.__engine,
      materialToneMapping,
      toneMappingTargetRenderTargetTexture
    );
    renderPassToneMappingVr.tryToSetUniqueName('renderPassToneMappingVr', true);
    renderPassToneMappingVr.toClearColorBuffer = false;
    renderPassToneMappingVr.toClearDepthBuffer = false;
    renderPassToneMappingVr.isDepthTest = false;
    renderPassToneMappingVr.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    renderPassToneMappingVr.isVrRendering = false;
    renderPassToneMappingVr.isOutputForVr = true;

    expressionToneMappingEffect.addRenderPasses([renderPassToneMapping, renderPassToneMappingVr]);

    return expressionToneMappingEffect;
  }

  /**
   * Creates a frame buffer for depth moment shadow mapping.
   *
   * @param shadowMapSize - Size of the shadow map in pixels
   * @returns The configured depth moment frame buffer
   *
   * @internal
   */
  private __setupDepthMomentFramebuffer(shadowMapSize: number) {
    return RenderableHelper.createFrameBuffer(this.__engine, {
      width: shadowMapSize,
      height: shadowMapSize,
      textureNum: 1,
      textureFormats: [TextureFormat.RG32F],
      createDepthBuffer: true,
      depthTextureFormat: TextureFormat.Depth32F,
    });
  }

  /**
   * Internal method to apply IBL textures to all expressions.
   *
   * @internal
   */
  private __setIblInner() {
    for (const expression of this.__expressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.setIBLCubeMap(
              this.__diffuseCubeTexture!,
              this.__specularCubeTexture!,
              this.__sheenCubeTexture
            );
          }
        }
      }
    }
  }

  /**
   * Internal method to apply IBL textures to transparent-only expressions.
   *
   * @internal
   */
  private __setIblInnerForTransparentOnly() {
    for (const expression of this.__transparentOnlyExpressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.setIBLCubeMap(
              this.__diffuseCubeTexture!,
              this.__specularCubeTexture!,
              this.__sheenCubeTexture
            );
          }
        }
      }
    }
  }

  /**
   * Sets the tone mapping algorithm used for HDR to LDR conversion.
   *
   * @param type - The tone mapping algorithm to use
   *
   * @remarks
   * Tone mapping is essential for converting high dynamic range rendering results
   * to low dynamic range output that can be displayed on standard monitors.
   *
   * Available tone mapping algorithms:
   * - KhronosPbrNeutral: Khronos PBR neutral tone mapping
   * - Reinhard: Classic Reinhard tone mapping
   * - GT_ToneMap: GT tone mapping (default)
   * - ACES_Narkowicz: ACES tone mapping by Narkowicz
   * - ACES_Hill: ACES tone mapping by Hill
   * - ACES_Hill_Exposure_Boost: ACES Hill with exposure boost
   *
   * @example
   * ```typescript
   * // Use ACES tone mapping for cinematic look
   * pipeline.setToneMappingType(Rn.ToneMappingType.ACES_Hill);
   *
   * // Use Reinhard for classic look
   * pipeline.setToneMappingType(Rn.ToneMappingType.Reinhard);
   *
   * // Use Khronos PBR neutral for accurate colors
   * pipeline.setToneMappingType(Rn.ToneMappingType.KhronosPbrNeutral);
   * ```
   */
  public setToneMappingType(type: ToneMappingTypeEnum) {
    const toneMappingMaterial = this.__toneMappingMaterial;
    if (toneMappingMaterial == null) {
      return;
    }
    this.__toneMappingType = type;

    toneMappingMaterial.removeShaderDefine('RN_USE_KHRONOS_PBR_NEUTRAL');
    toneMappingMaterial.removeShaderDefine('RN_USE_REINHARD');
    toneMappingMaterial.removeShaderDefine('RN_USE_GT_TONEMAP');
    toneMappingMaterial.removeShaderDefine('RN_USE_ACES_NARKOWICZ');
    toneMappingMaterial.removeShaderDefine('RN_USE_ACES_HILL');
    toneMappingMaterial.removeShaderDefine('RN_USE_ACES_HILL_EXPOSURE_BOOST');

    if (type === ToneMappingType.KhronosPbrNeutral) {
      toneMappingMaterial.addShaderDefine('RN_USE_KHRONOS_PBR_NEUTRAL');
    } else if (type === ToneMappingType.Reinhard) {
      toneMappingMaterial.addShaderDefine('RN_USE_REINHARD');
    } else if (type === ToneMappingType.GT_ToneMap) {
      toneMappingMaterial.addShaderDefine('RN_USE_GT_TONEMAP');
    } else if (type === ToneMappingType.ACES_Narkowicz) {
      toneMappingMaterial.addShaderDefine('RN_USE_ACES_NARKOWICZ');
    } else if (type === ToneMappingType.ACES_Hill) {
      toneMappingMaterial.addShaderDefine('RN_USE_ACES_HILL');
    } else if (type === ToneMappingType.ACES_Hill_Exposure_Boost) {
      toneMappingMaterial.addShaderDefine('RN_USE_ACES_HILL_EXPOSURE_BOOST');
    }
  }

  private __setupRaymarchingExpression(): [Expression, RenderPass] {
    const expression = new Expression();
    expression.tryToSetUniqueName('Raymarching', true);
    const renderPass = new RenderPass(this.__engine);
    renderPass.toClearDepthBuffer = false;
    renderPass.isDepthTest = true;
    this.__configureRaymarchingPassTargets(renderPass);
    renderPass.setPreRenderFunction(() => this.__prepareLegacyRaymarchingPass(renderPass));

    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('Raymarching', true);

    return [expression, renderPass];
  }

  /**
   * Points a buffer-less raymarching pass at the pipeline's render targets, including
   * the MSAA resolve targets the transmission pass and mipmap generation read.
   */
  private __configureRaymarchingPassTargets(renderPass: RenderPass) {
    const mainFrameBuffer = this.__getMainFrameBuffer();
    renderPass.setFramebuffer(mainFrameBuffer);
    if (mainFrameBuffer != null && this.__frameBufferMsaa != null) {
      renderPass.setResolveFramebuffer(this.__frameBufferResolve!);
      // The reference resolve target is the back buffer the transmission pass samples.
      // Resolving the raymarching result into it keeps the SDF in the scene color that
      // transparent materials refract, and in the mipmaps generated after this pass.
      renderPass.setResolveFramebuffer2(this.__frameBufferResolveForReference ?? undefined);
    } else {
      renderPass.setResolveFramebuffer(undefined);
      renderPass.setResolveFramebuffer2(undefined);
    }
  }

  /**
   * Per-frame setup of the legacy merged raymarching pass.
   *
   * The merged material evaluates every component's graph in one distance function,
   * so the object id and world matrix uniforms are postfixed with the component SID,
   * and the march is clipped to the union of all component AABBs.
   *
   * @param renderPass - The legacy raymarching pass
   */
  private __prepareLegacyRaymarchingPass(renderPass: RenderPass) {
    this.__applyIblToRaymarchingMaterial();
    this.__applyBackBufferTextureToRaymarchingMaterial();
    const material = renderPass.material;
    if (material == null) {
      return;
    }
    const raymarchingComponents = this.__engine.componentRepository.getComponentsWithType(
      RaymarchingComponent
    ) as RaymarchingComponent[];
    let unionMinX = Number.POSITIVE_INFINITY;
    let unionMinY = Number.POSITIVE_INFINITY;
    let unionMinZ = Number.POSITIVE_INFINITY;
    let unionMaxX = Number.NEGATIVE_INFINITY;
    let unionMaxY = Number.NEGATIVE_INFINITY;
    let unionMaxZ = Number.NEGATIVE_INFINITY;
    let unionable = raymarchingComponents.length > 0;
    for (const raymarchingComponent of raymarchingComponents) {
      const sceneGraph = raymarchingComponent.entity.tryToGetSceneGraph();
      if (sceneGraph != null) {
        material.setParameter(`worldMatrix_${raymarchingComponent.componentSID}`, sceneGraph.matrixInner);
        // The object id is the stable component SID, matching the node id prefix
        // used when the graphs are merged (collectRrnJson).
        material.setParameter(
          `raymarchObjectId_${raymarchingComponent.componentSID}`,
          Scalar.fromCopyNumber(raymarchingComponent.componentSID)
        );
      }
      const aabb = this.__getCachedRaymarchingAabb(raymarchingComponent);
      if (aabb == null) {
        unionable = false;
        continue;
      }
      unionMinX = Math.min(unionMinX, aabb.min.x);
      unionMinY = Math.min(unionMinY, aabb.min.y);
      unionMinZ = Math.min(unionMinZ, aabb.min.z);
      unionMaxX = Math.max(unionMaxX, aabb.max.x);
      unionMaxY = Math.max(unionMaxY, aabb.max.y);
      unionMaxZ = Math.max(unionMaxZ, aabb.max.z);
    }
    if (unionable) {
      material.setParameter('raymarchAabbMin', Vector3.fromCopy3(unionMinX, unionMinY, unionMinZ));
      material.setParameter('raymarchAabbMax', Vector3.fromCopy3(unionMaxX, unionMaxY, unionMaxZ));
    } else {
      material.setParameter('raymarchAabbMin', RAYMARCHING_UNBOUNDED_AABB_MIN);
      material.setParameter('raymarchAabbMax', RAYMARCHING_UNBOUNDED_AABB_MAX);
    }
  }

  /**
   * Assigns the raymarching material of a single component.
   *
   * The pipeline renders one buffer-less full-screen pass per materialized component
   * (in component SID order) with depth test and depth write enabled, so the nearest
   * SDF wins per pixel. Each material only contains that component's graph: uniforms
   * and textures are not shared or postfixed, and the texture-slot limit applies per
   * component instead of to the merged graph of every component.
   *
   * When at least one component material is assigned, the legacy merged raymarching
   * material ({@link setRaymarchingMaterial}) is ignored.
   *
   * The pass clips its march to the component's world AABB. Call
   * `component.invalidateAABB()` when the SDF's size changes through material uniform
   * values (the editor does this for its uniform controls) so the cached bounds, the
   * ray interval and the scissor rectangle stay current.
   *
   * @param component - The component the material belongs to
   * @param material - The material, typically from
   * `MaterialHelper.createNodeBasedRaymarchingComponentMaterial`
   */
  public setRaymarchingComponentMaterial(component: RaymarchingComponent, material: Material) {
    this.__raymarchingComponentMaterials.set(component.componentSID, material);
    this.__applyIblToRaymarchingMaterial();
    this.__applyBackBufferTextureToRaymarchingMaterial();
    // The raymarching material is not part of any mesh primitive, so the shadow
    // parameters of the last shadow pass setup have to be applied explicitly.
    this.__shadowSystem?.applyShadowParametersToMaterials([material]);
    // The SDF graph may have changed, so the shadow caster materials are rebuilt from it.
    this.refreshRaymarchingShadowMaterial();
    if (this.__frame != null) {
      this.__setUpExpressionsForRendering();
    }
  }

  /**
   * Gets the raymarching material assigned to a component.
   * @param component - The component whose material is requested
   */
  public getRaymarchingComponentMaterial(component: RaymarchingComponent): Material | undefined {
    return this.__raymarchingComponentMaterials.get(component.componentSID);
  }

  /**
   * Removes the raymarching material of a component so it stops rendering.
   * @param component - The component whose material is removed
   */
  public removeRaymarchingComponentMaterial(component: RaymarchingComponent) {
    if (this.__raymarchingComponentMaterials.delete(component.componentSID)) {
      this.refreshRaymarchingShadowMaterial();
      if (this.__frame != null) {
        this.__setUpExpressionsForRendering();
      }
    }
  }

  /**
   * Legacy single-material API: renders all components with one merged material.
   *
   * Ignored while per-component materials are assigned ({@link setRaymarchingComponentMaterial}).
   *
   * @param material - The material built from `MaterialHelper.collectRrnJson`
   */
  public setRaymarchingMaterial(material: Material) {
    this.__raymarchingRenderPass?.setBufferLessFullScreenRendering(material);
    this.__applyIblToRaymarchingMaterial();
    this.__applyBackBufferTextureToRaymarchingMaterial();
    // The raymarching material is not part of any mesh primitive, so the shadow
    // parameters of the last shadow pass setup have to be applied explicitly.
    this.__shadowSystem?.applyShadowParametersToMaterials([material]);
    // The SDF graph may have changed, so the shadow caster materials are rebuilt from it.
    this.refreshRaymarchingShadowMaterial();
    // A transmission material samples the scene color behind the SDF, so the pass has
    // to run after the opaque expressions. Rebuild the frame expression order.
    if (this.__frame != null) {
      this.__setUpExpressionsForRendering();
    }
  }

  /**
   * Creates or updates the buffer-less render pass of each component that owns a
   * raymarching material, in component SID order. Components without a material are
   * skipped, and stale passes are dropped.
   */
  private __getRaymarchingComponentPasses(): RenderPass[] {
    const passes: RenderPass[] = [];
    const existingComponentSids = new Set<number>();
    this.__raymarchingFirstComponentPassSID = -1;
    if (this.__raymarchingComponentMaterials.size > 0) {
      const components = (
        this.__engine.componentRepository.getComponentsWithType(RaymarchingComponent) as RaymarchingComponent[]
      ).slice();
      components.sort((a, b) => a.componentSID - b.componentSID);
      for (const component of components) {
        const componentSID = component.componentSID;
        const material = this.__raymarchingComponentMaterials.get(componentSID);
        if (material == null) {
          continue;
        }
        existingComponentSids.add(componentSID);
        let renderPass = this.__raymarchingComponentPasses.get(componentSID);
        if (renderPass == null) {
          renderPass = new RenderPass(this.__engine);
          renderPass.toClearDepthBuffer = false;
          renderPass.isDepthTest = true;
          renderPass.setPreRenderFunction(() => this.__prepareRaymarchingComponentPass(componentSID));
          renderPass.tryToSetUniqueName(`Raymarching_${componentSID}`, true);
          this.__raymarchingComponentPasses.set(componentSID, renderPass);
        }
        renderPass.setBufferLessFullScreenRendering(material);
        this.__configureRaymarchingPassTargets(renderPass);
        if (passes.length === 0) {
          this.__raymarchingFirstComponentPassSID = componentSID;
        }
        passes.push(renderPass);
      }
    }
    for (const componentSID of [...this.__raymarchingComponentPasses.keys()]) {
      if (!existingComponentSids.has(componentSID)) {
        this.__raymarchingComponentPasses.delete(componentSID);
      }
    }
    // Drop materials whose components were removed so they neither render nor receive
    // per-frame updates through the shared material helpers.
    for (const componentSID of [...this.__raymarchingComponentMaterials.keys()]) {
      if (
        !existingComponentSids.has(componentSID) &&
        this.__engine.componentRepository.getComponent(RaymarchingComponent, componentSID) == null
      ) {
        this.__raymarchingComponentMaterials.delete(componentSID);
      }
    }
    return passes;
  }

  /**
   * Per-frame setup of one component's raymarching pass: its world matrix, the world
   * AABB used for ray interval clipping, and the scissor rectangle on the screen.
   *
   * The world matrix and the AABB are sampled together so the clip interval matches
   * the transform the shader uses, including on backends that upload material values
   * one frame later.
   *
   * @param componentSID - The SID of the component rendered by the pass
   */
  private __prepareRaymarchingComponentPass(componentSID: number) {
    if (componentSID === this.__raymarchingFirstComponentPassSID) {
      // The shared material setup (IBL/back buffer bindings) only has to run once per
      // frame, before the first raymarching pass.
      this.__applyIblToRaymarchingMaterial();
      this.__applyBackBufferTextureToRaymarchingMaterial();
    }
    const material = this.__raymarchingComponentMaterials.get(componentSID);
    const component = this.__engine.componentRepository.getComponent(RaymarchingComponent, componentSID) as
      | RaymarchingComponent
      | undefined;
    const sceneGraph = component?.entity.tryToGetSceneGraph();
    if (material == null || component == null || sceneGraph == null) {
      return;
    }
    material.setParameter(MaterialHelper.RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC, sceneGraph.matrixInner);
    const aabb = this.__getCachedRaymarchingAabb(component);
    material.setParameter('raymarchAabbMin', aabb?.min ?? RAYMARCHING_UNBOUNDED_AABB_MIN);
    material.setParameter('raymarchAabbMax', aabb?.max ?? RAYMARCHING_UNBOUNDED_AABB_MAX);
    this.__raymarchingComponentPasses.get(componentSID)?.setScissorRect(this.__calcRaymarchingScissorRect(aabb));
  }

  /**
   * Returns the conservative world AABB of a component's SDF, caching it until the
   * component's AABB version or world matrix changes.
   *
   * @param component - The SDF component
   */
  private __getCachedRaymarchingAabb(component: RaymarchingComponent): RaymarchingAabb | null {
    const sceneGraph = component.entity.tryToGetSceneGraph();
    if (sceneGraph == null) {
      return null;
    }
    const matrix = sceneGraph.matrixInner;
    const elements = [
      matrix.m00,
      matrix.m01,
      matrix.m02,
      matrix.m03,
      matrix.m10,
      matrix.m11,
      matrix.m12,
      matrix.m13,
      matrix.m20,
      matrix.m21,
      matrix.m22,
      matrix.m23,
      matrix.m30,
      matrix.m31,
      matrix.m32,
      matrix.m33,
    ];
    const aabbVersion = RaymarchingComponent.getAABBVersion(this.__engine);
    const cacheKey = component.componentSID;
    const cached = this.__raymarchingAabbCache.get(cacheKey);
    if (
      cached != null &&
      cached.aabbVersion === aabbVersion &&
      cached.matrix.length === elements.length &&
      cached.matrix.every((value, index) => value === elements[index])
    ) {
      return cached.aabb;
    }

    const aabb = component.calcWorldAABB();
    if (aabb == null) {
      this.__raymarchingAabbCache.delete(cacheKey);
      return null;
    }
    const result = {
      min: Vector3.fromCopy3(aabb.minPoint.x, aabb.minPoint.y, aabb.minPoint.z),
      max: Vector3.fromCopy3(aabb.maxPoint.x, aabb.maxPoint.y, aabb.maxPoint.z),
    };
    this.__raymarchingAabbCache.set(cacheKey, { aabbVersion, matrix: elements, aabb: result });
    return result;
  }

  /**
   * Projects a world AABB to a screen-space scissor rectangle.
   *
   * Returns undefined (render the whole target) when the bounds are unbounded or
   * when any corner is behind the camera, where a naive projection is invalid.
   *
   * @param aabb - The world AABB of the SDF
   */
  private __calcRaymarchingScissorRect(aabb: RaymarchingAabb | null) {
    if (aabb == null || this.__width <= 0 || this.__height <= 0) {
      return undefined;
    }
    const camera = this.__engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.__engine)
    ) as CameraComponent | undefined;
    if (camera == null) {
      return undefined;
    }
    const viewProjection = camera.viewProjectionMatrix;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let corner = 0; corner < 8; corner++) {
      const x = (corner & 1) === 0 ? aabb.min.x : aabb.max.x;
      const y = (corner & 2) === 0 ? aabb.min.y : aabb.max.y;
      const z = (corner & 4) === 0 ? aabb.min.z : aabb.max.z;
      const clip = viewProjection.multiplyVector(Vector4.fromCopy4(x, y, z, 1));
      if (clip.w <= 0) {
        // Any corner behind the camera makes the screen projection unreliable.
        return undefined;
      }
      const ndcX = clip.x / clip.w;
      const ndcY = clip.y / clip.w;
      const pixelX = (ndcX * 0.5 + 0.5) * this.__width;
      const pixelY = (-ndcY * 0.5 + 0.5) * this.__height;
      minX = Math.min(minX, pixelX);
      minY = Math.min(minY, pixelY);
      maxX = Math.max(maxX, pixelX);
      maxY = Math.max(maxY, pixelY);
    }
    // A small margin covers floating point error at the SDF's silhouette.
    const margin = 2;
    const x = Math.max(0, Math.floor(minX) - margin);
    const y = Math.max(0, Math.floor(minY) - margin);
    const right = Math.min(this.__width, Math.ceil(maxX) + margin);
    const bottom = Math.min(this.__height, Math.ceil(maxY) + margin);
    const width = right - x;
    const height = bottom - y;
    if (width <= 0 || height <= 0) {
      // The SDF is off-screen: keep a 1x1 scissor so the pass shades one pixel.
      return { x: 0, y: 0, width: 1, height: 1 };
    }
    if (x === 0 && y === 0 && width === this.__width && height === this.__height) {
      return undefined;
    }
    return { x, y, width, height };
  }

  /** All raymarching materials the pipeline manages (legacy or per component). */
  private __getAllRaymarchingMaterials(): Material[] {
    const materials: Material[] = [];
    for (const material of this.__raymarchingComponentMaterials.values()) {
      materials.push(material);
    }
    const legacyMaterial = this.getRaymarchingMaterial();
    if (legacyMaterial != null) {
      materials.push(legacyMaterial);
    }
    return materials;
  }

  /**
   * Builds the raymarching expression from the current materials.
   *
   * With per-component materials, the expression contains one buffer-less pass per
   * component (component SID order), composited by the depth test. Otherwise the
   * legacy merged pass is used. The expression is empty while no raymarching material
   * is assigned.
   */
  private __buildRaymarchingExpression(): Expression {
    const expression = new Expression();
    expression.tryToSetUniqueName('Raymarching', true);
    const componentPasses = this.__getRaymarchingComponentPasses();
    if (componentPasses.length > 0) {
      expression.addRenderPasses(componentPasses);
    } else if (this.__raymarchingRenderPass != null && this.__raymarchingRenderPass.material != null) {
      expression.addRenderPasses([this.__raymarchingRenderPass]);
    }
    return expression;
  }

  /**
   * Rebuilds the shadow caster materials from the current raymarching components
   * (only the ones with `castShadow`) and requests a shadow map refresh, so the SDF
   * objects appear in / disappear from the shadow maps.
   *
   * Call this when the raymarching graph or a component's `castShadow` flag changes.
   */
  public refreshRaymarchingShadowMaterial() {
    const previousRegular = this.__raymarchingShadowRegularMaterial;
    this.__raymarchingShadowJson = undefined;
    this.__raymarchingShadowRegularMaterial = undefined;
    this.__raymarchingShadowPointSlots.clear();

    if (this.__shadowSystem == null || this.__engine.config.maxLightNumber <= 0) {
      return;
    }

    const castShadowJson = MaterialHelper.collectRrnJson(this.__engine, { castShadowOnly: true });
    if (castShadowJson.nodes.length > 0) {
      const json = castShadowJson as unknown as ShaderNodeJson;
      this.__raymarchingShadowJson = json;
      this.__raymarchingShadowRegularMaterial = MaterialHelper.createNodeBasedRaymarchingShadowMaterial(
        this.__engine,
        json,
        'regular',
        previousRegular
      );
    }

    this.__shadowSystem.invalidateShadowVolumeFitting();
    this.__shadowSystem.setNeedsRefresh();
  }

  /** The regular (spot / directional) SDF shadow caster material (for tests/debugging). */
  public getRaymarchingShadowMaterial(): Material | undefined {
    return this.__raymarchingShadowRegularMaterial;
  }

  /**
   * Provider of the SDF shadow caster passes handed to the ShadowSystem.
   */
  private __getRaymarchingShadowPassProvider(): RaymarchingShadowPassProvider {
    return {
      hasCaster: () => this.__raymarchingShadowJson != null && this.__raymarchingShadowRegularMaterial != null,
      createPasses: params => this.__createRaymarchingShadowPasses(params),
      updatePointLightFarPlane: (shadowSlot, farPlane) =>
        this.__updateRaymarchingShadowPointFarPlane(shadowSlot, farPlane),
    };
  }

  /**
   * Returns the paraboloid shadow caster material pair for a shadow slot, creating it on
   * first use. A pair per slot is needed because the light index and the far plane are
   * material parameters, which WebGPU uploads once per frame.
   */
  private __getRaymarchingShadowPointMaterials(
    shadowSlot: number,
    lightComponentSID: number,
    farPlane: number
  ): { front: Material; back: Material } | undefined {
    let pair = this.__raymarchingShadowPointSlots.get(shadowSlot);
    if (pair == null) {
      const json = this.__raymarchingShadowJson;
      if (json == null) {
        return undefined;
      }
      const front = MaterialHelper.createNodeBasedRaymarchingShadowMaterial(this.__engine, json, 'paraboloidFront');
      const back = MaterialHelper.createNodeBasedRaymarchingShadowMaterial(this.__engine, json, 'paraboloidBack');
      if (front == null || back == null) {
        return undefined;
      }
      pair = { front, back };
      this.__raymarchingShadowPointSlots.set(shadowSlot, pair);
    }

    // A slot can be reassigned to another light, so keep the light index current.
    const lightIndex = Scalar.fromCopyNumber(lightComponentSID);
    pair.front.setParameter('lightIndex', lightIndex);
    pair.back.setParameter('lightIndex', lightIndex);
    this.__setRaymarchingShadowPointFarPlane(pair, farPlane);
    return pair;
  }

  private __setRaymarchingShadowPointFarPlane(pair: { front: Material; back: Material }, farPlane: number) {
    const value = Scalar.fromCopyNumber(farPlane);
    pair.front.setParameter('shadowFarPlane', value);
    pair.back.setParameter('shadowFarPlane', value);
  }

  private __updateRaymarchingShadowPointFarPlane(shadowSlot: number, farPlane: number) {
    const pair = this.__raymarchingShadowPointSlots.get(shadowSlot);
    if (pair != null) {
      this.__setRaymarchingShadowPointFarPlane(pair, farPlane);
    }
  }

  private __createRaymarchingShadowPasses({
    lightComponent,
    lightEntity,
    framebuffer,
    kind,
    farPlane,
    shadowSlot,
  }: RaymarchingShadowPassParams): RenderPass[] {
    let material: Material | undefined;
    if (kind === 'regular') {
      material = this.__raymarchingShadowRegularMaterial;
    } else {
      const pair = this.__getRaymarchingShadowPointMaterials(shadowSlot, lightComponent.componentSID, farPlane ?? 1000);
      material = kind === 'paraboloidFront' ? pair?.front : pair?.back;
    }
    if (material == null) {
      return [];
    }

    const renderPass = new RenderPass(this.__engine);
    // Shadow passes are not XR main passes: they use the light camera and run once.
    renderPass.isVrRendering = false;
    renderPass.setBufferLessFullScreenRendering(material);
    renderPass.setFramebuffer(framebuffer);
    // The mesh caster pass of the same light has already cleared the moment map and
    // written its depth, so this pass keeps both and only writes where the SDF is nearer.
    renderPass.toClearColorBuffer = false;
    renderPass.toClearDepthBuffer = false;
    renderPass.isDepthTest = true;
    renderPass.depthWriteMask = true;
    if (kind === 'regular') {
      // The shadow camera must drive get_viewMatrix / get_projectionMatrix in the shader.
      renderPass.cameraComponent = (lightEntity as unknown as { getCamera(): CameraComponent }).getCamera();
    }
    renderPass.tryToSetUniqueName(`RaymarchingShadow_${kind}`, true);

    return [renderPass];
  }

  /**
   * Copies the graph parameters (uniform values, textures) and the current per-component
   * transforms from the visible raymarching materials to every SDF shadow caster material.
   *
   * The SDF shadow casters are still one merged material per kind (their textures are
   * shared across components), while the visible materials may be per component. A
   * per-component uniform is exposed on the shadow material as `name_<componentSID>`,
   * and its value comes from that component's material; shared semantics are copied
   * from the first material as a best effort.
   *
   * This runs once per frame BEFORE Engine.process: WebGPU uploads material values in the
   * prerender stage, so updating them only in a render pass hook would leave the shadow
   * passes one frame behind. setParameter / setTextureParameter return early for identical
   * values, so the copy is cheap.
   */
  private __syncRaymarchingShadowMaterialParameters() {
    if (this.__raymarchingShadowJson == null) {
      return;
    }

    const materials: Material[] = [];
    if (this.__raymarchingShadowRegularMaterial != null) {
      materials.push(this.__raymarchingShadowRegularMaterial);
    }
    for (const pair of this.__raymarchingShadowPointSlots.values()) {
      materials.push(pair.front, pair.back);
    }

    const componentMaterials = this.__raymarchingComponentMaterials;
    const legacyMaterial = this.getRaymarchingMaterial();
    const firstMaterial =
      componentMaterials.size > 0 ? (componentMaterials.values().next().value as Material) : legacyMaterial;
    const copySharedParameter = (material: Material, semantic: string, info: ShaderSemanticsInfo) => {
      if (firstMaterial == null) {
        return;
      }
      if (CompositionType.isTexture(info.compositionType)) {
        const textureParameter = firstMaterial.getTextureParameter(semantic as never);
        if (textureParameter != null) {
          material.setTextureParameter(semantic as never, textureParameter[1], textureParameter[2]);
        }
      } else {
        const value = firstMaterial.getParameter(semantic as never);
        if (value != null) {
          material.setParameter(semantic as never, value);
        }
      }
    };
    const raymarchingComponents = this.__engine.componentRepository.getComponentsWithType(
      RaymarchingComponent
    ) as RaymarchingComponent[];

    for (const material of materials) {
      for (const info of material.fieldsInfoArray) {
        const semantic = info.semantic;
        if (
          semantic.startsWith('worldMatrix_') ||
          semantic.startsWith('raymarchObjectId_') ||
          semantic === 'lightIndex' ||
          semantic === 'shadowFarPlane'
        ) {
          continue;
        }
        // Per-component uniform names are `name_<componentSID>` in the merged shadow
        // graph. Read the value from that component's own material.
        const suffixed = /^(.*)_(\d+)$/.exec(semantic);
        const componentMaterial = suffixed != null ? componentMaterials.get(Number(suffixed[2])) : undefined;
        if (componentMaterial != null) {
          const baseSemantic = suffixed![1];
          if (CompositionType.isTexture(info.compositionType)) {
            const textureParameter = componentMaterial.getTextureParameter(baseSemantic as never);
            if (textureParameter != null) {
              material.setTextureParameter(semantic, textureParameter[1], textureParameter[2]);
            }
          } else {
            const value = componentMaterial.getParameter(baseSemantic as never);
            if (value != null) {
              material.setParameter(semantic, value);
            }
          }
        } else {
          copySharedParameter(material, semantic, info);
        }
      }

      // Current transforms/object ids (the visible material is updated later in the frame).
      for (const raymarchingComponent of raymarchingComponents) {
        if (!raymarchingComponent.castShadow) {
          continue;
        }
        const sceneGraph = raymarchingComponent.entity.tryToGetSceneGraph();
        if (sceneGraph != null) {
          material.setParameter(`worldMatrix_${raymarchingComponent.componentSID}`, sceneGraph.matrixInner);
        }
        material.setParameter(
          `raymarchObjectId_${raymarchingComponent.componentSID}`,
          Scalar.fromCopyNumber(raymarchingComponent.componentSID)
        );
      }
    }
  }

  /** Materials outside mesh primitives that still receive shadows (the raymarching materials). */
  private __getAdditionalShadowMaterials(): Material[] {
    return this.__getAllRaymarchingMaterials();
  }

  public getRaymarchingMaterial(): Material | undefined {
    return this.__raymarchingRenderPass?.material;
  }

  /**
   * Applies the pipeline's IBL environment to every raymarching PBR material.
   *
   * The raymarching draw is buffer-less and has no mesh renderer component, so
   * the IBL parameters that material contents normally read from the mesh
   * renderer are set on the material here instead.
   */
  private __applyIblToRaymarchingMaterial() {
    for (const material of this.__getAllRaymarchingMaterials()) {
      this.__applyIblToMaterial(material);
    }
  }

  /**
   * Applies the pipeline's IBL environment to one raymarching material.
   * @param material - The raymarching material
   */
  private __applyIblToMaterial(material: Material) {
    const diffuseEnvValue = material.getTextureParameter(ShaderSemantics.DiffuseEnvTexture.str);
    const specularEnvValue = material.getTextureParameter(ShaderSemantics.SpecularEnvTexture.str);
    if (diffuseEnvValue == null || specularEnvValue == null) {
      // The raymarching material is not using PBR shading.
      return;
    }
    // Present only when the shading graph uses sheen.
    const sheenEnvValue = material.getTextureParameter(ShaderSemantics.SheenEnvTexture.str);
    const diffuse = this.__diffuseCubeTexture;
    const specular = this.__specularCubeTexture;
    if (diffuse == null || specular == null) {
      return;
    }

    // The textures may become ready after this is called, so re-apply when anything changed.
    const state = `${diffuse.objectUID}:${diffuse.isTextureReady}:${specular.objectUID}:${
      specular.isTextureReady
    }:${this.__sheenCubeTexture?.objectUID ?? -1}:${this.__sheenCubeTexture?.isTextureReady ?? false}:${
      this.__iblRotation
    }:${this.__diffuseIblContribution}:${this.__specularIblContribution}`;
    if (state === this.__raymarchingIblStates.get(material.objectUID)) {
      return;
    }
    this.__raymarchingIblStates.set(material.objectUID, state);

    // Reuse the shared cube sampler created for the material's env texture semantics.
    const sampler = diffuseEnvValue[2] as Sampler;
    if (diffuse.isTextureReady) {
      material.setTextureParameter(ShaderSemantics.DiffuseEnvTexture.str, diffuse, sampler);
    }
    if (specular.isTextureReady) {
      material.setTextureParameter(ShaderSemantics.SpecularEnvTexture.str, specular, sampler);
      if (sheenEnvValue != null) {
        const sheen = this.__sheenCubeTexture?.isTextureReady ? this.__sheenCubeTexture : specular;
        const sheenSampler = (sheenEnvValue[2] as Sampler | undefined) ?? sampler;
        material.setTextureParameter(ShaderSemantics.SheenEnvTexture.str, sheen, sheenSampler);
      }
    }
    material.setParameter(
      'iblParameter',
      Vector4.fromCopy4(
        specular.mipmapLevelNumber,
        this.__diffuseIblContribution,
        this.__specularIblContribution,
        this.__iblRotation
      )
    );
    material.setParameter('hdriFormat', Vector2.fromCopy2(diffuse.hdriFormat.index, specular.hdriFormat.index));
  }

  /**
   * Whether a raymarching material shades with transmission, which means it
   * samples the scene color behind the SDF.
   *
   * Only then does the raymarching expression have to run after the opaque
   * expressions. Without transmission it keeps its legacy position before them,
   * so blended meshes that are drawn in the opaque expression (the pipeline may be
   * configured with isTransmission: false) keep blending over the SDF.
   */
  private __isRaymarchingTransmissionEnabled() {
    return this.__getAllRaymarchingMaterials().some(material => material.isShaderDefine('RN_USE_TRANSMISSION'));
  }

  /**
   * Binds the resolved scene color to every raymarching material for transmission.
   *
   * This is the same reference texture the transmission materials of the transparent
   * pass sample. The raymarching expression is rendered after the opaque expressions,
   * so the texture holds the current frame. Materials without the semantic ignore the
   * call, and an identical binding is a no-op, so this is safe to run every frame.
   */
  private __applyBackBufferTextureToRaymarchingMaterial() {
    if (this.__isSimple) {
      // Simple mode has no offscreen render targets, so no back buffer exists.
      return;
    }
    const backBufferTexture = this.__getMainFrameBufferBackBuffer()?.getColorAttachedRenderTargetTexture(0);
    const sampler = this.__samplerForBackBuffer;
    if (backBufferTexture == null || sampler == null) {
      return;
    }
    for (const material of this.__getAllRaymarchingMaterials()) {
      material.setTextureParameter(ShaderSemantics.BackBufferTexture.str, backBufferTexture, sampler);
    }
  }

  /**
   * Internal method to set up the frame with all configured expressions.
   *
   * @remarks
   * This method is called automatically during the render loop to configure
   * the frame with all necessary expressions in the correct order:
   * 1. Initial expression (buffer clearing)
   * 2. Shadow expressions
   * 3. Main expressions (opaque rendering)
   * 4. Mipmap generation
   * 5. Multi-view blitting
   * 6. Raymarching expression for transmission materials (samples the scene color;
   *    without transmission the raymarching expression is drawn before step 3)
   * 7. Transparent expressions
   * 8. Bloom effect
   * 9. Tone mapping
   *
   * @internal
   */
  private __setUpExpressionsForRendering() {
    const frame = this.__frame;
    if (frame == null) {
      console.log('Frame is not set.');
      return;
    }
    frame.clearExpressions();
    // initial expression for clearing the frame buffer
    frame.addExpression(this.__initialExpression!);

    // Per-component materials render one pass per component (SID order); otherwise the
    // legacy merged material renders everything in a single pass.
    this.__raymarchingExpression = this.__buildRaymarchingExpression();

    if (!this.__isSimple) {
      // depth map generation for shadow mapping. This runs before the raymarching
      // pass so that the raymarching material reads the shadow maps of this frame.
      for (const exp of this.__shadowExpressions) {
        frame.addExpression(exp);
      }
    }

    const raymarchingUsesTransmission = this.__isRaymarchingTransmissionEnabled();
    if (!raymarchingUsesTransmission && this.__raymarchingExpression != null) {
      // Legacy order: the SDF is drawn before the opaque expressions (its depth writes
      // cull opaque meshes behind it), and blended primitives rendered by those
      // expressions draw over the SDF.
      frame.addExpression(this.__raymarchingExpression);
    }

    // main expressions for opaque rendering
    for (const exp of this.__expressions) {
      if (this.__isSimple) {
        // output VR display
        exp.renderPasses.forEach(renderPass => {
          renderPass.isOutputForVr = true;
        });
      } else {
        exp.renderPasses.forEach(renderPass => {
          renderPass.isOutputForVr = false;
        });
      }
      frame.addExpression(exp);
    }

    // mipmap generation for glTF transmission visual effect
    if (!this.__isSimple && this.__generateMipmapsExpression != null && !MiscUtil.isMobile()) {
      frame.addExpression(this.__generateMipmapsExpression);
    }

    // multi-view blitting for VR rendering
    if (!this.__isSimple && this.__multiViewBlitBackBufferExpression != null) {
      frame.addExpression(this.__multiViewBlitBackBufferExpression);
    }

    // Raymarching with transmission samples the scene color behind the SDF, so it runs
    // after the opaque expressions (and after the back buffer and its mipmaps are
    // ready). It still runs before the transparent expressions, whose materials refract
    // the SDF, and its depth writes cull opaque meshes behind the SDF as before.
    if (raymarchingUsesTransmission && this.__raymarchingExpression != null) {
      frame.addExpression(this.__raymarchingExpression);
    }

    // transparent expressions for transparent rendering
    for (const exp of this.__transparentOnlyExpressions) {
      if (this.__isSimple) {
        // output VR display
        exp.renderPasses.forEach(renderPass => {
          renderPass.isOutputForVr = true;
        });
      } else {
        exp.renderPasses.forEach(renderPass => {
          renderPass.isOutputForVr = false;
        });
      }
      frame.addExpression(exp);
    }

    // gizmo expression for rendering gizmos
    // In non-simple mode, gizmos are rendered to the offscreen framebuffer (before tone mapping)
    // to have proper depth testing. In simple mode, gizmos are rendered to the back buffer.
    if (this.__gizmoExpression.renderPasses.length > 0) {
      if (!this.__isSimple) {
        // Set framebuffer for gizmo render passes so they render to the same FBO as the main scene
        // Use __getMainFrameBuffer() (MSAA framebuffer) to share the same depth buffer with the main scene.
        // Note: __getMainFrameBufferResolve() doesn't work because depth is not resolved in WebGPU MSAA resolve.
        const mainFrameBuffer = this.__getMainFrameBuffer();
        if (mainFrameBuffer != null) {
          for (const rp of this.__gizmoExpression.renderPasses) {
            rp.setFramebuffer(mainFrameBuffer);
            if (this.__frameBufferMsaa != null) {
              rp.setResolveFramebuffer(this.__frameBufferResolve!);
            }
          }
        }
      }
      frame.addExpression(this.__gizmoExpression);
    }

    // multi-view blitting for VR rendering
    if (!this.__isSimple && this.__multiViewBlitExpression != null) {
      frame.addExpression(this.__multiViewBlitExpression);
    }

    // bloom effect for post-processing
    if (!this.__isSimple && this.__isBloom && this.__bloomExpression != null) {
      frame.addExpression(this.__bloomExpression);
    }

    // tone mapping for HDR to LDR conversion
    if (!this.__isSimple && this.__toneMappingExpression != null) {
      frame.addExpression(this.__toneMappingExpression);
    }

    const entities = this.__expressions.flatMap(expression =>
      expression.renderPasses.flatMap(renderPass => renderPass.entities)
    ) as ISceneGraphEntity[];
    this.__entitiesForShadow = entities;
  }
}
