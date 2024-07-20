import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import { TextureParameter } from '../../definitions/TextureParameter';
import { RenderableHelper } from '../../helpers/RenderableHelper';
import { Vector4 } from '../../math/Vector4';
import { assertHas, IOption, None, Some } from '../../misc/Option';
import { Is } from '../../misc/Is';
import { CubeTexture } from '../../textures/CubeTexture';
import { Expression } from '../Expression';
import { Frame } from '../Frame';
import { FrameBuffer } from '../FrameBuffer';
import { RenderPass } from '../RenderPass';
import { MaterialHelper } from '../../helpers/MaterialHelper';
import { Size } from '../../../types';
import { Err, Ok } from '../../misc/Result';
import { System } from '../../system/System';
import { RnObject } from '../../core/RnObject';
import { ModuleManager } from '../../system/ModuleManager';
import {
  ComponentType,
  HdriFormatEnum,
  PixelFormat,
  ProcessApproach,
  ToneMappingType,
  ToneMappingTypeEnum,
} from '../../definitions';
import { ExpressionHelper, RenderPassHelper } from '../../helpers';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Sampler } from '../../textures/Sampler';
import { SystemState } from '../../system';
import { RenderTargetTexture } from '../../textures';
import { CGAPIResourceRepository } from '../CGAPIResourceRepository';
import { RnXR } from '../../../xr/main';
import { Material } from '../../materials/core/Material';

type DrawFunc = (frame: Frame) => void;
type IBLCubeTextureParameter = {
  baseUri: string;
  isNamePosNeg: boolean;
  hdriFormat: HdriFormatEnum;
  mipmapLevelNumber: number;
};

/**
 * ForwardRenderPipeline is a one of render pipelines
 *
 * @remarks
 * A render pipeline is a class of complex multi-pass setups already built in,
 * which allows users to easily benefit from advanced expressions such as refraction and MSAA.
 * (like the URP (Universal Render Pipeline) in the Unity engine).
 *
 * @example
 * ```
 * const expressions = ...;
 * const matrix = ...;
 * // Create a render pipeline
 * const forwardRenderPipeline = new Rn.ForwardRenderPipeline();
 * // Set up the render pipeline
 * forwardRenderPipeline.setup(1024, 1024, {isShadow: true});
 * // Set expressions before calling other setter methods
 * forwardRenderPipeline.setExpressions(expressions);
 * // Set IBLs
 * const diffuseCubeTexture = new Rn.CubeTexture();
 * diffuseCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/diffuse/diffuse';
 * diffuseCubeTexture.isNamePosNeg = true;
 * diffuseCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * diffuseCubeTexture.mipmapLevelNumber = 1;
 * const specularCubeTexture = new Rn.CubeTexture();
 * specularCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/specular/specular';
 * specularCubeTexture.isNamePosNeg = true;
 * specularCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * specularCubeTexture.mipmapLevelNumber = 10;
 * forwardRenderPipeline.setIBLTextures(diffuseCubeTexture, specularCubeTexture);
 * // Set BiasViewProjectionMatrix for Shadow
 * forwardRenderPipeline.setBiasViewProjectionMatrixForShadow(matrix);
 * // Start Render Loop
 * forwardRenderPipeline.startRenderLoop((frame) => {
 *   Rn.System.process(frame);
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
  private __oFrame: IOption<Frame> = new None();
  private __oFrameDepthMoment: IOption<FrameBuffer> = new None();
  private __oFrameBufferMultiView: IOption<FrameBuffer> = new None();
  private __oFrameBufferMultiViewBlit: IOption<FrameBuffer> = new None();
  private __oFrameBufferMultiViewBlitBackBuffer: IOption<FrameBuffer> = new None();
  private __oFrameBufferMsaa: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolve: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolveForReference: IOption<FrameBuffer> = new None();
  private __oInitialExpression: IOption<Expression> = new None();

  /** main expressions */
  private __expressions: Expression[] = [];

  private __oGenerateMipmapsExpression: IOption<Expression> = new None();
  private __oMultiViewBlitBackBufferExpression: IOption<Expression> = new None();
  private __oMultiViewBlitExpression: IOption<Expression> = new None();
  private __depthMomentExpressions: Expression[] = [];
  private __oBloomExpression: IOption<Expression> = new None();
  private __oToneMappingExpression: IOption<Expression> = new None();
  private __oToneMappingMaterial: IOption<Material> = new None();
  private __transparentOnlyExpressions: Expression[] = [];
  private __oWebXRSystem: IOption<any> = new None();
  private __oDrawFunc: IOption<DrawFunc> = new None();
  private __oDiffuseCubeTexture: IOption<CubeTexture> = new None();
  private __oSpecularCubeTexture: IOption<CubeTexture> = new None();
  private __oSamplerForBackBuffer: IOption<Sampler> = new None();
  private __toneMappingType = ToneMappingType.GT_ToneMap;

  constructor() {
    super();
  }

  private __destroyResources() {
    if (this.__oFrameDepthMoment.has()) {
      this.__oFrameDepthMoment.get().destroy3DAPIResources();
      this.__oFrameDepthMoment = new None();
    }
    if (this.__oFrameBufferMultiView.has()) {
      this.__oFrameBufferMultiView.get().destroy3DAPIResources();
      this.__oFrameBufferMultiView = new None();
    }
    if (this.__oFrameBufferMultiViewBlit.has()) {
      this.__oFrameBufferMultiViewBlit.get().destroy3DAPIResources();
      this.__oFrameBufferMultiViewBlit = new None();
    }
    if (this.__oFrameBufferMsaa.has()) {
      this.__oFrameBufferMsaa.get().destroy3DAPIResources();
      this.__oFrameBufferMsaa = new None();
    }
    if (this.__oFrameBufferResolve.has()) {
      this.__oFrameBufferResolve.get().destroy3DAPIResources();
      this.__oFrameBufferResolve = new None();
    }
    if (this.__oFrameBufferResolveForReference.has()) {
      this.__oFrameBufferResolveForReference.get().destroy3DAPIResources();
      this.__oFrameBufferResolveForReference = new None();
    }
    this.__oFrame = new None();
    this.__oGenerateMipmapsExpression = new None();
    this.__oMultiViewBlitExpression = new None();
    this.__oBloomExpression = new None();
    this.__oToneMappingExpression = new None();
  }

  /**
   * Initializes the pipeline.
   * @param canvasWidth - The width of the canvas.
   * @param canvasHeight - The height of the canvas.
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
    if (this.__oFrame.has()) {
      return new Err({
        message: 'Already setup',
        error: undefined,
      });
    }

    const sFrame = new Some(new Frame());
    this.__oFrame = sFrame;

    if (!this.__isSimple) {
      this.__oSamplerForBackBuffer = new Some(
        new Sampler({
          wrapS: TextureParameter.Repeat,
          wrapT: TextureParameter.Repeat,
          minFilter: TextureParameter.LinearMipmapLinear,
          magFilter: TextureParameter.Linear,
        })
      );
      this.__oSamplerForBackBuffer.unwrapForce().create();

      // create Frame Buffers
      this.__createRenderTargets(canvasWidth, canvasHeight);

      // depth moment FrameBuffer
      if (isShadow && !this.__isSimple) {
        this.__oFrameDepthMoment = this.__setupDepthMomentFramebuffer(shadowMapSize);
      }

      if (this.__oFrameBufferResolveForReference.has()) {
        // generate mipmaps for process KHR_materials_transmittance
        this.__oGenerateMipmapsExpression = this.__setupGenerateMipmapsExpression(
          this.__oFrameBufferResolveForReference.unwrapForce()
        );
      }

      if (this.__oFrameBufferMultiView.has()) {
        // Make Blit Expression if VR MultiView is enabled
        this.__oMultiViewBlitBackBufferExpression = this.__setupMultiViewBlitBackBufferExpression(
          this.__oFrameBufferMultiView.unwrapForce()
        );
        this.__oMultiViewBlitExpression = this.__setupMultiViewBlitExpression(
          this.__oFrameBufferMultiView.unwrapForce()
        );
      }

      let toneMappingTargetRenderTargetTexture: RenderTargetTexture =
        this.__getMainFrameBufferResolve().unwrapForce().getColorAttachedRenderTargetTexture(0)!;

      // Bloom Expression
      if (isBloom && !this.__isSimple) {
        const frameBufferToBloom = this.__getMainFrameBufferResolve();
        const textureToBloom = frameBufferToBloom
          .unwrapForce()
          .getColorAttachedRenderTargetTexture(0) as unknown as RenderTargetTexture;
        const { bloomExpression, bloomedRenderTarget } = ExpressionHelper.createBloomExpression({
          textureToBloom,
          parameters: {},
        });
        this.__oBloomExpression = new Some(bloomExpression);
        toneMappingTargetRenderTargetTexture = bloomedRenderTarget;
      }

      // ToneMapping Expression
      const toneMappingExpression = this.__setupToneMappingExpression(
        toneMappingTargetRenderTargetTexture
      );
      this.__oToneMappingExpression = new Some(toneMappingExpression);
    }

    // Initial Expression
    const initialExpression = this.__setupInitialExpression(this.__oFrameDepthMoment);
    this.__oInitialExpression = new Some(initialExpression);

    const rnXRModule = await ModuleManager.getInstance().getModule('xr');
    if (Is.exist(rnXRModule)) {
      this.__oWebXRSystem = new Some(rnXRModule.WebXRSystem.getInstance());
    }

    if (this.__expressions.length > 0) {
      this.setExpressions(this.__expressions);
    }

    return new Ok();
  }

  private __getMainFrameBufferBackBuffer(): IOption<FrameBuffer> {
    if (this.__oFrameBufferMultiView.has()) {
      return this.__oFrameBufferMultiViewBlitBackBuffer;
    } else {
      return this.__oFrameBufferResolveForReference;
    }
  }

  private __getMainFrameBufferResolve(): IOption<FrameBuffer> {
    if (this.__oFrameBufferMultiView.has()) {
      return this.__oFrameBufferMultiViewBlit;
    } else {
      return this.__oFrameBufferResolve;
    }
  }

  private __getMainFrameBuffer(): IOption<FrameBuffer> {
    if (this.__oFrameBufferMultiView.has()) {
      return this.__oFrameBufferMultiView;
    } else {
      return this.__oFrameBufferMsaa;
    }
  }
  /**
   * set Expressions for drawing
   * @param expressions - expressions to draw
   * @param options - option parameters
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
    const expressionsTranslucent = expressions.map((expression) => expression.clone());
    this.__setExpressionsInner(expressions, {
      isTransmission: options.isTransmission,
    });
    if (options.isTransmission) {
      this.__setTransparentExpressionsForTransmission(expressionsTranslucent);
    }

    if (SystemState.currentProcessApproach !== ProcessApproach.WebGPU) {
      if (this.__oFrameDepthMoment.has()) {
        this.__setDepthTextureToEntityMaterials();
      }
    }
  }

  private __setDepthTextureToEntityMaterials() {
    if (Is.false(this.__isShadow)) {
      return;
    }

    // copy expressions as depth moment expressions
    this.__depthMomentExpressions = [];
    for (const expression of this.__expressions) {
      this.__depthMomentExpressions.push(expression.clone());
    }

    // create depth moment encode material
    const depthMomentMaterial = MaterialHelper.createDepthMomentEncodeMaterial();

    // setup depth moment expression
    for (const expression of this.__depthMomentExpressions) {
      for (const renderPass of expression.renderPasses) {
        // Draw opaque primitives to depth moment FrameBuffer
        renderPass.setFramebuffer(this.__oFrameDepthMoment.unwrapForce());
        renderPass.toClearColorBuffer = true;
        renderPass.toClearDepthBuffer = true;
        // No need to render transparent primitives to depth buffer.
        renderPass.setToRenderTransparentPrimitives(false);

        renderPass.setMaterial(depthMomentMaterial);
      }
    }

    // set depth moment texture to entity materials in main expressions
    const sampler = new Sampler({
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
      anisotropy: false,
    });
    sampler.create();
    for (const expression of this.__expressions) {
      for (const renderPass of expression.renderPasses) {
        const entities = renderPass.entities;
        for (const entity of entities) {
          const meshComponent = entity.tryToGetMesh();
          if (Is.exist(meshComponent)) {
            const mesh = meshComponent.mesh;
            if (Is.exist(mesh)) {
              const primitives = mesh.primitives;
              for (const primitive of primitives) {
                const material = primitive.material;
                material.setTextureParameter(
                  ShaderSemantics.DepthTexture,
                  this.__oFrameDepthMoment.unwrapForce().getColorAttachedRenderTargetTexture(0)!,
                  sampler
                );
              }
            }
          }
        }
      }
    }
    // this.__setDepthMomentRenderPassesAndDepthTextureToEntityMaterials();
  }

  /**
   * Start rendering loop
   * @param func - function to be called when the frame is rendered
   * @returns RnResult
   */
  startRenderLoop(func: (frame: Frame) => void) {
    if (this.__oFrame.doesNotHave()) {
      return new Err({
        message: 'not initialized.',
        error: undefined,
      });
    }

    this.__oDrawFunc = new Some(func);

    System.startRenderLoop(() => {
      this.__setExpressions();
      func(this.__oFrame.unwrapForce());
    });

    return new Ok();
  }

  /**
   * draw with the given function in startRenderLoop method
   */
  draw() {
    this.__oDrawFunc.unwrapForce()(this.__oFrame.unwrapForce());
  }

  /**
   * Resize screen
   * @param width - width of the screen
   * @param height - height of the screen
   * @returns RnResult
   */
  resize(width: Size, height: Size) {
    if (this.__oFrame.doesNotHave()) {
      return new Err({
        message: 'not initialized.',
        error: undefined,
      });
    }
    const webXRSystem = this.__oWebXRSystem.unwrapOrUndefined();
    if (Is.exist(webXRSystem) && webXRSystem.isWebXRMode) {
      width = webXRSystem.getCanvasWidthForVr();
      height = webXRSystem.getCanvasHeightForVr();
    }
    System.resizeCanvas(width, height);

    this.__destroyResources();
    this.setup(width, height, {
      isShadow: this.__isShadow,
      isBloom: this.__isBloom,
      shadowMapSize: this.__shadowMapSize,
      isSimple: this.__isSimple,
    });

    return new Ok();
  }

  /**
   * set IBL cube textures
   * @param diffuse - diffuse IBL Cube Texture
   * @param specular - specular IBL Cube Texture
   */
  async setIBLTextures(diffuse: CubeTexture, specular: CubeTexture) {
    this.__oDiffuseCubeTexture = new Some(diffuse);
    this.__oSpecularCubeTexture = new Some(specular);
    await this.__setIblInner();
    await this.__setIblInnerForTransparentOnly();
  }

  /**
   * getter of initial expression
   */
  getInitialExpression(): Expression | undefined {
    return this.__oInitialExpression.unwrapOrUndefined();
  }

  /**
   * getter of ToneMapping expression
   */
  getToneMappingExpression(): Expression | undefined {
    return this.__oToneMappingExpression.unwrapOrUndefined();
  }

  /**
   * set diffuse IBL contribution
   * @param value - 0.0 ~ 1.0 or greater
   */
  setDiffuseIBLContribution(value: number) {
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
   * set specular IBL contribution
   * @param value - 0.0 ~ 1.0 or greater
   */
  setSpecularIBLContribution(value: number) {
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
   * set the rotation of IBL
   * @param radian - rotation in radian
   */
  setIBLRotation(radian: number) {
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

  setCameraComponentOfLight(cameraComponent: CameraComponent) {
    if (this.__isShadow) {
      for (const expression of this.__depthMomentExpressions) {
        for (const renderPass of expression.renderPasses) {
          renderPass.cameraComponent = cameraComponent;
        }
      }
      for (const expression of this.__expressions) {
        for (const renderPass of expression.renderPasses) {
          // eslint-disable-next-line prefer-arrow-callback
          renderPass.setPostRenderFunction(function (this: RenderPass) {
            const entities = renderPass.entities;
            for (const entity of entities) {
              const meshComponent = entity.tryToGetMesh();
              if (Is.exist(meshComponent)) {
                const mesh = meshComponent.mesh;
                if (Is.exist(mesh)) {
                  const primitives = mesh.primitives;
                  for (const primitive of primitives) {
                    const material = primitive.material;
                    material.setParameter(
                      ShaderSemantics.DepthBiasPV,
                      cameraComponent.biasViewProjectionMatrix
                    );
                  }
                }
              }
            }
          });
        }
      }
    }
  }

  private async __setExpressionsInner(
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
        if (options.isTransmission) {
          // if options.isTransmission is true, set toRenderTransparentPrimitives to false,
          // because transparent primitives are rendered in later expression.
          rp.setToRenderTransparentPrimitives(false);
        } else {
          // if options.isTransmission is false, set toRenderTransparentPrimitives to true.
          // because transparent primitives are rendered in this expression as well as opaque primitives.
          rp.setToRenderTransparentPrimitives(true);
        }

        // clearing depth is done in initial expression. so no need to clear depth in this render pass.
        rp.toClearDepthBuffer = false;
        if (!this.__isSimple) {
          const mainFrameBuffer = this.__getMainFrameBuffer();
          if (mainFrameBuffer.has()) {
            rp.setFramebuffer(mainFrameBuffer.get());
            if (this.__oFrameBufferMsaa.has()) {
              rp.setResolveFramebuffer(this.__oFrameBufferResolve.unwrapForce());
              rp.setResolveFramebuffer2(this.__oFrameBufferResolveForReference.unwrapForce());
            }
          }
        }
      }
    }
    this.__expressions = expressions;
    await this.__setIblInner();
  }

  private __setTransparentExpressionsForTransmission(expressions: Expression[]) {
    for (const expression of expressions) {
      expression.tryToSetUniqueName('modelTransparentForTransmission', true);
      for (const rp of expression.renderPasses) {
        rp.setToRenderOpaquePrimitives(false); // not to render opaque primitives in transmission expression.
        rp.setToRenderTransparentPrimitives(true);
        rp.toClearDepthBuffer = false;
        // rp.isDepthTest = false;
        // rp.depthWriteMask = false;
        if (!this.__isSimple) {
          rp.setFramebuffer(this.__getMainFrameBuffer().unwrapForce());
          if (this.__oFrameBufferResolve.has()) {
            rp.setResolveFramebuffer(this.__oFrameBufferResolve.unwrapForce());
          }
          for (const entity of rp.entities) {
            const meshComponent = entity.tryToGetMesh();
            if (Is.exist(meshComponent)) {
              const mesh = meshComponent.mesh;
              if (Is.exist(mesh)) {
                for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
                  const primitive = mesh.getPrimitiveAt(i);
                  primitive.material.setTextureParameter(
                    ShaderSemantics.BackBufferTexture,
                    this.__getMainFrameBufferBackBuffer()
                      .unwrapForce()
                      .getColorAttachedRenderTargetTexture(0)!,
                    this.__oSamplerForBackBuffer.unwrapForce()
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

  private __setupInitialExpression(oFrameDepthMoment: IOption<FrameBuffer>) {
    const expression = new Expression();
    expression.tryToSetUniqueName('Initial', true);

    // render pass to clear buffers of render texture
    const initialRenderPass = new RenderPass();
    initialRenderPass.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    initialRenderPass.toClearColorBuffer = true;
    initialRenderPass.toClearDepthBuffer = true;
    initialRenderPass.tryToSetUniqueName('InitialRenderPass', true);
    expression.addRenderPasses([initialRenderPass]);

    // render pass to clear buffers of framebuffer
    if (!this.__isSimple) {
      const initialRenderPassForFrameBuffer = new RenderPass();
      initialRenderPassForFrameBuffer.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
      initialRenderPassForFrameBuffer.toClearColorBuffer = true;
      initialRenderPassForFrameBuffer.toClearDepthBuffer = true;
      initialRenderPassForFrameBuffer.setFramebuffer(this.__getMainFrameBuffer().unwrapForce());
      initialRenderPassForFrameBuffer.tryToSetUniqueName('InitialRenderPassForFrameBuffer', true);
      expression.addRenderPasses([initialRenderPassForFrameBuffer]);
    }

    if (oFrameDepthMoment.has()) {
      const frameDepthMoment = oFrameDepthMoment.get();
      const initialRenderPassForDepthMoment = new RenderPass();
      initialRenderPassForDepthMoment.clearColor = Vector4.fromCopyArray4([1.0, 1.0, 1.0, 1.0]);
      initialRenderPassForDepthMoment.toClearColorBuffer = true;
      initialRenderPassForDepthMoment.toClearDepthBuffer = true;
      initialRenderPassForDepthMoment.setFramebuffer(frameDepthMoment);
      initialRenderPassForDepthMoment.tryToSetUniqueName('InitialRenderPassForDepthMoment', true);

      expression.addRenderPasses([initialRenderPassForDepthMoment]);
    }

    return expression;
  }

  private __createRenderTargets(canvasWidth: number, canvasHeight: number) {
    const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR | undefined;
    const webXRSystem = rnXRModule?.WebXRSystem.getInstance();
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    if (
      Is.exist(webXRSystem) &&
      webXRSystem.isWebXRMode &&
      cgApiResourceRepository.isSupportMultiViewVRRendering()
    ) {
      const framebufferMultiView = RenderableHelper.createTextureArrayForRenderTarget(
        canvasWidth / 2,
        canvasHeight,
        2,
        {
          level: 0,
          internalFormat: this.__isBloom ? TextureParameter.R11F_G11F_B10F : TextureParameter.RGBA8,
          format: this.__isBloom ? PixelFormat.RGB : PixelFormat.RGBA,
          type: this.__isBloom ? ComponentType.Float : ComponentType.UnsignedByte,
          createDepthBuffer: true,
          isMSAA: true,
          sampleCountMSAA: 4,
        }
      );
      framebufferMultiView.tryToSetUniqueName('FramebufferTargetOfToneMappingMultiView', true);
      const framebufferMultiViewBlit = RenderableHelper.createTexturesForRenderTarget(
        canvasWidth,
        canvasHeight,
        1,
        {
          isMSAA: false,
          internalFormat: this.__isBloom ? TextureParameter.R11F_G11F_B10F : TextureParameter.RGBA8,
          format: this.__isBloom ? PixelFormat.RGB : PixelFormat.RGBA,
          type: this.__isBloom ? ComponentType.Float : ComponentType.UnsignedByte,
          createDepthBuffer: false,
        }
      );
      framebufferMultiViewBlit.tryToSetUniqueName(
        'FramebufferTargetOfToneMappingMultiViewBlit',
        true
      );

      const framebufferMultiViewBlitBackBuffer = RenderableHelper.createTexturesForRenderTarget(
        canvasWidth,
        canvasHeight,
        1,
        {
          isMSAA: false,
          internalFormat: this.__isBloom ? TextureParameter.R11F_G11F_B10F : TextureParameter.RGBA8,
          format: this.__isBloom ? PixelFormat.RGB : PixelFormat.RGBA,
          type: this.__isBloom ? ComponentType.Float : ComponentType.UnsignedByte,
          createDepthBuffer: false,
        }
      );
      framebufferMultiViewBlit.tryToSetUniqueName(
        'FramebufferTargetOfToneMappingMultiViewBlitBackBuffer',
        true
      );

      this.__oFrameBufferMultiView = new Some(framebufferMultiView);
      this.__oFrameBufferMultiViewBlit = new Some(framebufferMultiViewBlit);
      this.__oFrameBufferMultiViewBlitBackBuffer = new Some(framebufferMultiViewBlitBackBuffer);
      this.__oFrameBufferMsaa = new None();
      this.__oFrameBufferResolve = new None();
      this.__oFrameBufferResolveForReference = new None();
    } else {
      // MSAA depth
      const framebufferMsaa = RenderableHelper.createTexturesForRenderTarget(
        canvasWidth,
        canvasHeight,
        0,
        {
          isMSAA: true,
          sampleCountMSAA: 4,
          internalFormat: this.__isBloom ? TextureParameter.R11F_G11F_B10F : TextureParameter.RGBA8,
          format: this.__isBloom ? PixelFormat.RGB : PixelFormat.RGBA,
          type: this.__isBloom ? ComponentType.Float : ComponentType.UnsignedByte,
        }
      );
      framebufferMsaa.tryToSetUniqueName('FramebufferTargetOfToneMappingMsaa', true);

      // Resolve Color 1
      const framebufferResolve = RenderableHelper.createTexturesForRenderTarget(
        canvasWidth,
        canvasHeight,
        1,
        {
          createDepthBuffer: true,
          internalFormat: this.__isBloom ? TextureParameter.R11F_G11F_B10F : TextureParameter.RGBA8,
          format: this.__isBloom ? PixelFormat.RGB : PixelFormat.RGBA,
          type: this.__isBloom ? ComponentType.Float : ComponentType.UnsignedByte,
        }
      );
      framebufferResolve.tryToSetUniqueName('FramebufferTargetOfToneMappingResolve', true);

      // Resolve Color 2
      const framebufferResolveForReference = RenderableHelper.createTexturesForRenderTarget(
        canvasWidth,
        canvasHeight,
        1,
        {
          createDepthBuffer: false,
          internalFormat: this.__isBloom ? TextureParameter.R11F_G11F_B10F : TextureParameter.RGBA8,
          format: this.__isBloom ? PixelFormat.RGB : PixelFormat.RGBA,
          type: this.__isBloom ? ComponentType.Float : ComponentType.UnsignedByte,
        }
      );
      framebufferResolveForReference.tryToSetUniqueName(
        'FramebufferTargetOfToneMappingResolveForReference',
        true
      );

      // FrameBuffers
      this.__oFrameBufferMultiView = new None();
      this.__oFrameBufferMultiViewBlit = new None();
      this.__oFrameBufferMultiViewBlitBackBuffer = new None();
      this.__oFrameBufferMsaa = new Some(framebufferMsaa);
      this.__oFrameBufferResolve = new Some(framebufferResolve);
      this.__oFrameBufferResolveForReference = new Some(framebufferResolveForReference);
    }
  }

  private __setupGenerateMipmapsExpression(resolveFramebuffer2: FrameBuffer) {
    const expression = new Expression();
    expression.tryToSetUniqueName('GenerateMipmaps', true);
    const renderPass = new RenderPass();
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('GenerateMipmaps', true);

    renderPass.toClearDepthBuffer = false;

    // Generate Mipmap of resolve Framebuffer 2
    renderPass.setPostRenderFunction(function (this: RenderPass): void {
      const renderTargetTexture = resolveFramebuffer2.getColorAttachedRenderTargetTexture(0)!;
      renderTargetTexture.generateMipmap();
    });

    return new Some(expression);
  }
  private __setupMultiViewBlitBackBufferExpression(multiViewFrameBuffer: FrameBuffer) {
    const expression = new Expression();
    expression.tryToSetUniqueName('MultiViewBlitBackBuffer', true);
    const renderPass = new RenderPass();
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('MultiViewBlitBackBuffer', true);

    renderPass.toClearDepthBuffer = false;

    // Generate Mipmap of resolve Framebuffer 2
    renderPass.setPostRenderFunction(() => {
      if (this.__oFrameBufferMultiViewBlitBackBuffer.has()) {
        const texture = this.__oFrameBufferMultiViewBlitBackBuffer.unwrapForce()
          .colorAttachments[0] as RenderTargetTexture;
        (
          multiViewFrameBuffer.colorAttachments[0] as RenderTargetTexture
        ).blitToTexture2dFromTexture2dArrayFake(texture);
        texture.generateMipmap();
      }
    });

    return new Some(expression);
  }

  private __setupMultiViewBlitExpression(multiViewFrameBuffer: FrameBuffer) {
    const expression = new Expression();
    expression.tryToSetUniqueName('MultiViewBlit', true);
    const renderPass = new RenderPass();
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('MultiViewBlit', true);

    renderPass.toClearDepthBuffer = false;

    // Generate Mipmap of resolve Framebuffer 2
    renderPass.setPostRenderFunction(() => {
      if (this.__oFrameBufferMultiViewBlit.has()) {
        const texture = this.__oFrameBufferMultiViewBlit.unwrapForce()
          .colorAttachments[0] as RenderTargetTexture;
        (
          multiViewFrameBuffer.colorAttachments[0] as RenderTargetTexture
        ).blitToTexture2dFromTexture2dArrayFake(texture);
      }
    });

    return new Some(expression);
  }

  private __setupToneMappingExpression(toneMappingTargetRenderTargetTexture: RenderTargetTexture) {
    const expressionToneMappingEffect = new Expression();
    const materialToneMapping = MaterialHelper.createToneMappingMaterial();
    this.__oToneMappingMaterial = new Some(materialToneMapping);
    this.setToneMappingType(this.__toneMappingType);

    // Rendering for Canvas Frame Buffer
    const renderPassToneMapping = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
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

  private __setupDepthMomentFramebuffer(shadowMapSize: number) {
    return new Some(
      RenderableHelper.createTexturesForRenderTarget(shadowMapSize, shadowMapSize, 1, {
        level: 0,
        internalFormat: TextureParameter.RG32F,
        format: PixelFormat.RG,
        type: ComponentType.Float,
        createDepthBuffer: true,
        isMSAA: false,
        sampleCountMSAA: 1,
      })
    );
  }

  private async __setIblInner() {
    for (const expression of this.__expressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            await meshRendererComponent.setIBLCubeMap(
              this.__oDiffuseCubeTexture.unwrapOrUndefined()!,
              this.__oSpecularCubeTexture.unwrapOrUndefined()!
            );
          }
        }
      }
    }
  }

  private async __setIblInnerForTransparentOnly() {
    for (const expression of this.__transparentOnlyExpressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            await meshRendererComponent.setIBLCubeMap(
              this.__oDiffuseCubeTexture.unwrapOrUndefined()!,
              this.__oSpecularCubeTexture.unwrapOrUndefined()!
            );
          }
        }
      }
    }
  }

  public setToneMappingType(type: ToneMappingTypeEnum) {
    if (!this.__oToneMappingMaterial.has()) {
      return;
    }
    this.__toneMappingType = type;

    this.__oToneMappingMaterial.get().removeShaderDefine('RN_USE_KHRONOS_PBR_NEUTRAL');
    this.__oToneMappingMaterial.get().removeShaderDefine('RN_USE_REINHARD');
    this.__oToneMappingMaterial.get().removeShaderDefine('RN_USE_GT_TONEMAP');
    this.__oToneMappingMaterial.get().removeShaderDefine('RN_USE_ACES_NARKOWICZ');
    this.__oToneMappingMaterial.get().removeShaderDefine('RN_USE_ACES_HILL');
    this.__oToneMappingMaterial.get().removeShaderDefine('RN_USE_ACES_HILL_EXPOSURE_BOOST');

    if (type === ToneMappingType.KhronosPbrNeutral) {
      this.__oToneMappingMaterial.get().addShaderDefine('RN_USE_KHRONOS_PBR_NEUTRAL');
    } else if (type === ToneMappingType.Reinhard) {
      this.__oToneMappingMaterial.get().addShaderDefine('RN_USE_REINHARD');
    } else if (type === ToneMappingType.GT_ToneMap) {
      this.__oToneMappingMaterial.get().addShaderDefine('RN_USE_GT_TONEMAP');
    } else if (type === ToneMappingType.ACES_Narkowicz) {
      this.__oToneMappingMaterial.get().addShaderDefine('RN_USE_ACES_NARKOWICZ');
    } else if (type === ToneMappingType.ACES_Hill) {
      this.__oToneMappingMaterial.get().addShaderDefine('RN_USE_ACES_HILL');
    } else if (type === ToneMappingType.ACES_Hill_Exposure_Boost) {
      this.__oToneMappingMaterial.get().addShaderDefine('RN_USE_ACES_HILL_EXPOSURE_BOOST');
    }
  }

  /**
   * setUp Frame
   *
   * @remarks
   * This method adds expressions to the frame.
   */
  private __setExpressions() {
    const frame = this.__oFrame.unwrapForce();
    frame.clearExpressions();
    frame.addExpression(this.getInitialExpression()!);

    if (!this.__isSimple) {
      for (const exp of this.__depthMomentExpressions) {
        frame.addExpression(exp);
      }
    }
    for (const exp of this.__expressions) {
      frame.addExpression(exp);
    }

    if (!this.__isSimple && this.__oGenerateMipmapsExpression.has()) {
      frame.addExpression(this.__oGenerateMipmapsExpression.unwrapForce());
    }
    if (!this.__isSimple && this.__oMultiViewBlitBackBufferExpression.has()) {
      frame.addExpression(this.__oMultiViewBlitBackBufferExpression.unwrapForce());
    }

    for (const exp of this.__transparentOnlyExpressions) {
      frame.addExpression(exp);
    }

    if (!this.__isSimple && this.__oMultiViewBlitExpression.has()) {
      frame.addExpression(this.__oMultiViewBlitExpression.unwrapForce());
    }

    if (!this.__isSimple && this.__isBloom) {
      frame.addExpression(this.__oBloomExpression.unwrapForce());
    }

    if (!this.__isSimple && this.__oToneMappingExpression.has()) {
      frame.addExpression(this.getToneMappingExpression()!);
    }
  }
}
