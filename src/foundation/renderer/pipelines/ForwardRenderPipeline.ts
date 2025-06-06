import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import { TextureParameter } from '../../definitions/TextureParameter';
import { RenderableHelper } from '../../helpers/RenderableHelper';
import { Vector4 } from '../../math/Vector4';
import { assertHas, Option, None, Some } from '../../misc/Option';
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
import { RenderPassHelper } from '../../helpers/RenderPassHelper';
import { Sampler } from '../../textures/Sampler';
import { SystemState } from '../../system/SystemState';
import { RenderTargetTexture } from '../../textures/RenderTargetTexture';
import { RenderTargetTexture2DArray } from '../../textures/RenderTargetTexture2DArray';
import { CGAPIResourceRepository } from '../CGAPIResourceRepository';
import { RnXR } from '../../../xr/main';
import { Material } from '../../materials/core/Material';
import { TextureFormat } from '../../definitions/TextureFormat';
import { Bloom } from '../../helpers/BloomHelper';
import { ShadowSystem } from '../../helpers/Shadow/ShadowSystem';
import { ISceneGraphEntity } from '../../helpers/EntityHelper';

type DrawFunc = (frame: Frame) => void;
type IBLCubeTextureParameter = {
  baseUri: string;
  isNamePosNeg: boolean;
  hdriFormat: HdriFormatEnum;
  mipmapLevelNumber: number;
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
  private __oFrame: Option<Frame> = new None();
  private __oFrameBufferMultiView: Option<FrameBuffer> = new None();
  private __oFrameBufferMultiViewBlit: Option<FrameBuffer> = new None();
  private __oFrameBufferMultiViewBlitBackBuffer: Option<FrameBuffer> = new None();
  private __oFrameBufferMsaa: Option<FrameBuffer> = new None();
  private __oFrameBufferResolve: Option<FrameBuffer> = new None();
  private __oFrameBufferResolveForReference: Option<FrameBuffer> = new None();
  private __oInitialExpression: Option<Expression> = new None();

  /** main expressions */
  private __expressions: Expression[] = [];

  private __oGenerateMipmapsExpression: Option<Expression> = new None();
  private __oMultiViewBlitBackBufferExpression: Option<Expression> = new None();
  private __oMultiViewBlitExpression: Option<Expression> = new None();
  private __oBloomExpression: Option<Expression> = new None();
  private __oToneMappingExpression: Option<Expression> = new None();
  private __oToneMappingMaterial: Option<Material> = new None();
  private __transparentOnlyExpressions: Expression[] = [];
  private __oWebXRSystem: Option<any> = new None();
  private __oDrawFunc: Option<DrawFunc> = new None();
  private __oDiffuseCubeTexture: Option<CubeTexture> = new None();
  private __oSpecularCubeTexture: Option<CubeTexture> = new None();
  private __oSheenCubeTexture: Option<CubeTexture> = new None();
  private __oSamplerForBackBuffer: Option<Sampler> = new None();
  private __toneMappingType = ToneMappingType.GT_ToneMap;
  private __bloomHelper: Bloom = new Bloom();
  private __oShadowSystem: Option<ShadowSystem> = new None();
  private __shadowExpressions: Expression[] = [];

  /**
   * Creates a new instance of ForwardRenderPipeline.
   */
  constructor() {
    super();
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
    this.__bloomHelper.destroy3DAPIResources();
    this.__oFrame = new None();
    this.__oGenerateMipmapsExpression = new None();
    this.__oMultiViewBlitExpression = new None();
    this.__oBloomExpression = new None();
    this.__oToneMappingExpression = new None();
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
    if (this.__oFrame.has()) {
      return new Err({
        message: 'Already setup',
        error: undefined,
      });
    }

    const sFrame = new Some(new Frame());
    this.__oFrame = sFrame;

    if (!this.__isSimple) {
      const oSamplerForBackBuffer = new Some(
        new Sampler({
          wrapS: TextureParameter.Repeat,
          wrapT: TextureParameter.Repeat,
          minFilter: TextureParameter.LinearMipmapLinear,
          magFilter: TextureParameter.Linear,
        })
      );
      oSamplerForBackBuffer.get().create();
      this.__oSamplerForBackBuffer = oSamplerForBackBuffer;
      // create Frame Buffers
      this.__createRenderTargets(canvasWidth, canvasHeight);

      // depth moment FrameBuffer
      if (isShadow && !this.__isSimple) {
        this.__oShadowSystem = new Some(new ShadowSystem(shadowMapSize));
      }

      if (this.__oFrameBufferResolveForReference.has()) {
        // generate mipmaps for process KHR_materials_transmittance
        this.__oGenerateMipmapsExpression = this.__setupGenerateMipmapsExpression(
          this.__oFrameBufferResolveForReference.get()
        );
      }

      if (this.__oFrameBufferMultiView.has()) {
        // Make Blit Expression if VR MultiView is enabled
        this.__oMultiViewBlitBackBufferExpression = this.__setupMultiViewBlitBackBufferExpression(
          this.__oFrameBufferMultiView.get()
        );
        this.__oMultiViewBlitExpression = this.__setupMultiViewBlitExpression(this.__oFrameBufferMultiView.get());
      }

      let toneMappingTargetRenderTargetTexture: RenderTargetTexture = this.__getMainFrameBufferResolve()
        .unwrapForce()
        .getColorAttachedRenderTargetTexture(0)!;

      // Bloom Expression
      if (isBloom && !this.__isSimple) {
        const frameBufferToBloom = this.__getMainFrameBufferResolve();
        const textureToBloom = frameBufferToBloom
          .unwrapForce()
          .getColorAttachedRenderTargetTexture(0) as unknown as RenderTargetTexture;
        const { bloomExpression, bloomedRenderTarget } = this.__bloomHelper.createBloomExpression({
          textureToBloom,
          parameters: {},
        });
        this.__oBloomExpression = new Some(bloomExpression);
        toneMappingTargetRenderTargetTexture = bloomedRenderTarget;
      }

      // ToneMapping Expression
      const toneMappingExpression = this.__setupToneMappingExpression(toneMappingTargetRenderTargetTexture);
      this.__oToneMappingExpression = new Some(toneMappingExpression);
    }

    // Initial Expression
    const initialExpression = this.__setupInitialExpression();
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

  /**
   * Gets the main frame buffer used for back buffer operations.
   *
   * @returns The frame buffer for back buffer operations, or None if not available
   *
   * @internal
   */
  private __getMainFrameBufferBackBuffer(): Option<FrameBuffer> {
    if (this.__oFrameBufferMultiView.has()) {
      return this.__oFrameBufferMultiViewBlitBackBuffer;
    } else {
      return this.__oFrameBufferResolveForReference;
    }
  }

  /**
   * Gets the main frame buffer used for resolve operations.
   *
   * @returns The frame buffer for resolve operations, or None if not available
   *
   * @internal
   */
  private __getMainFrameBufferResolve(): Option<FrameBuffer> {
    if (this.__oFrameBufferMultiView.has()) {
      return this.__oFrameBufferMultiViewBlit;
    } else {
      return this.__oFrameBufferResolve;
    }
  }

  /**
   * Gets the main frame buffer used for rendering operations.
   *
   * @returns The main frame buffer, or None if not available
   *
   * @internal
   */
  private __getMainFrameBuffer(): Option<FrameBuffer> {
    if (this.__oFrameBufferMultiView.has()) {
      return this.__oFrameBufferMultiView;
    } else {
      return this.__oFrameBufferMsaa;
    }
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

    if (this.__oShadowSystem.has()) {
      const entities = this.__expressions.flatMap(expression =>
        expression.renderPasses.flatMap(renderPass => renderPass.entities)
      ) as ISceneGraphEntity[];
      this.__shadowExpressions = this.__oShadowSystem.get().getExpressions(entities);
    }
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
   *   Rn.System.process(frame);
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
    if (this.__oFrame.doesNotHave()) {
      return new Err({
        message: 'not initialized.',
        error: undefined,
      });
    }

    this.__oDrawFunc = new Some(func);

    System.startRenderLoop(() => {
      this.__setExpressions();
      if (this.__oShadowSystem.has()) {
        const entities = this.__expressions.flatMap(expression =>
          expression.renderPasses.flatMap(renderPass => renderPass.entities)
        ) as ISceneGraphEntity[];
        if (this.__oShadowSystem.get().isLightChanged()) {
          this.__shadowExpressions = this.__oShadowSystem.get().getExpressions(entities);
        }
        this.__oShadowSystem.get().setDepthBiasPV(entities);
      }
      func(this.__oFrame.unwrapForce());
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
    this.__oDrawFunc.unwrapForce()(this.__oFrame.unwrapForce());
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
    this.__oDiffuseCubeTexture = new Some(diffuse);
    this.__oSpecularCubeTexture = new Some(specular);
    if (Is.exist(sheen)) {
      this.__oSheenCubeTexture = new Some(sheen);
    }
    this.__setIblInner();
    this.__setIblInnerForTransparentOnly();
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
    return this.__oInitialExpression.unwrapOrUndefined();
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
    return this.__oToneMappingExpression.unwrapOrUndefined();
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
                    'backBufferTexture',
                    this.__getMainFrameBufferBackBuffer().unwrapForce().getColorAttachedRenderTargetTexture(0)!,
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
    const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR | undefined;
    const webXRSystem = rnXRModule?.WebXRSystem.getInstance();
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    if (Is.exist(webXRSystem) && webXRSystem.isWebXRMode && cgApiResourceRepository.isSupportMultiViewVRRendering()) {
      const framebufferMultiView = RenderableHelper.createFrameBufferTextureArrayForMultiView({
        width: canvasWidth / 2,
        height: canvasHeight,
        arrayLength: 2,
        level: 0,
        internalFormat: this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8,
        format: this.__isBloom ? PixelFormat.RGB : PixelFormat.RGBA,
        type: this.__isBloom ? ComponentType.Float : ComponentType.UnsignedByte,
      });
      framebufferMultiView.tryToSetUniqueName('FramebufferTargetOfToneMappingMultiView', true);
      const framebufferMultiViewBlit = RenderableHelper.createFrameBuffer({
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: false,
      });

      framebufferMultiViewBlit.tryToSetUniqueName('FramebufferTargetOfToneMappingMultiViewBlit', true);

      const framebufferMultiViewBlitBackBuffer = RenderableHelper.createFrameBuffer({
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: false,
      });
      framebufferMultiViewBlit.tryToSetUniqueName('FramebufferTargetOfToneMappingMultiViewBlitBackBuffer', true);

      this.__oFrameBufferMultiView = new Some(framebufferMultiView);
      this.__oFrameBufferMultiViewBlit = new Some(framebufferMultiViewBlit);
      this.__oFrameBufferMultiViewBlitBackBuffer = new Some(framebufferMultiViewBlitBackBuffer);
      this.__oFrameBufferMsaa = new None();
      this.__oFrameBufferResolve = new None();
      this.__oFrameBufferResolveForReference = new None();
    } else {
      // MSAA depth
      const framebufferMsaa = RenderableHelper.createFrameBufferMSAA({
        width: canvasWidth,
        height: canvasHeight,
        colorBufferNum: 1,
        colorFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        sampleCountMSAA: 4,
        depthBufferFormat: TextureFormat.Depth32F,
      });
      framebufferMsaa.tryToSetUniqueName('FramebufferTargetOfToneMappingMsaa', true);

      // Resolve Color 1
      const framebufferResolve = RenderableHelper.createFrameBuffer({
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: true,
        depthTextureFormat: TextureFormat.Depth32F,
      });
      framebufferResolve.tryToSetUniqueName('FramebufferTargetOfToneMappingResolve', true);

      // Resolve Color 2
      const framebufferResolveForReference = RenderableHelper.createFrameBuffer({
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.__isBloom ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: false,
      });
      framebufferResolveForReference.tryToSetUniqueName('FramebufferTargetOfToneMappingResolveForReference', true);

      // FrameBuffers
      this.__oFrameBufferMultiView = new None();
      this.__oFrameBufferMultiViewBlit = new None();
      this.__oFrameBufferMultiViewBlitBackBuffer = new None();
      this.__oFrameBufferMsaa = new Some(framebufferMsaa);
      this.__oFrameBufferResolve = new Some(framebufferResolve);
      this.__oFrameBufferResolveForReference = new Some(framebufferResolveForReference);
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
    const renderPass = new RenderPass();
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('GenerateMipmaps', true);

    renderPass.toClearDepthBuffer = false;

    // Generate Mipmap of resolve Framebuffer 2
    renderPass.setPostRenderFunction(function (this: RenderPass): void {
      const renderTargetTexture = resolveFramebuffer2.getColorAttachedRenderTargetTexture(0)!;
      renderTargetTexture.generateMipmaps();
    });

    return new Some(expression);
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
    const renderPass = new RenderPass();
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('MultiViewBlitBackBuffer', true);

    renderPass.toClearDepthBuffer = false;

    // Generate Mipmap of resolve Framebuffer 2
    renderPass.setPostRenderFunction(() => {
      if (this.__oFrameBufferMultiViewBlitBackBuffer.has()) {
        const texture = this.__oFrameBufferMultiViewBlitBackBuffer.unwrapForce()
          .colorAttachments[0] as RenderTargetTexture2DArray;
        (multiViewFrameBuffer.colorAttachments[0] as RenderTargetTexture2DArray).blitToTexture2dFromTexture2dArrayFake(
          texture
        );
        texture.generateMipmaps();
      }
    });

    return new Some(expression);
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
    const renderPass = new RenderPass();
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName('MultiViewBlit', true);

    renderPass.toClearDepthBuffer = false;

    // Generate Mipmap of resolve Framebuffer 2
    renderPass.setPostRenderFunction(() => {
      if (this.__oFrameBufferMultiViewBlit.has()) {
        const texture = this.__oFrameBufferMultiViewBlit.unwrapForce()
          .colorAttachments[0] as RenderTargetTexture2DArray;
        (multiViewFrameBuffer.colorAttachments[0] as RenderTargetTexture2DArray).blitToTexture2dFromTexture2dArrayFake(
          texture
        );
      }
    });

    return new Some(expression);
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

  /**
   * Creates a frame buffer for depth moment shadow mapping.
   *
   * @param shadowMapSize - Size of the shadow map in pixels
   * @returns The configured depth moment frame buffer
   *
   * @internal
   */
  private __setupDepthMomentFramebuffer(shadowMapSize: number) {
    return new Some(
      RenderableHelper.createFrameBuffer({
        width: shadowMapSize,
        height: shadowMapSize,
        textureNum: 1,
        textureFormats: [TextureFormat.RG32F],
        createDepthBuffer: true,
        depthTextureFormat: TextureFormat.Depth32F,
      })
    );
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
              this.__oDiffuseCubeTexture.unwrapOrUndefined()!,
              this.__oSpecularCubeTexture.unwrapOrUndefined()!,
              this.__oSheenCubeTexture.unwrapOrUndefined()
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
              this.__oDiffuseCubeTexture.unwrapOrUndefined()!,
              this.__oSpecularCubeTexture.unwrapOrUndefined()!,
              this.__oSheenCubeTexture.unwrapOrUndefined()
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
   * 6. Transparent expressions
   * 7. Bloom effect
   * 8. Tone mapping
   *
   * @internal
   */
  private __setExpressions() {
    if (this.__oFrame.doesNotHave()) {
      console.error('Frame is not set.');
      return;
    }
    const frame = this.__oFrame.get();
    frame.clearExpressions();
    frame.addExpression(this.getInitialExpression()!);

    if (!this.__isSimple) {
      for (const exp of this.__shadowExpressions) {
        frame.addExpression(exp);
      }
    }
    for (const exp of this.__expressions) {
      frame.addExpression(exp);
    }

    if (!this.__isSimple && this.__oGenerateMipmapsExpression.has()) {
      frame.addExpression(this.__oGenerateMipmapsExpression.get());
    }
    if (!this.__isSimple && this.__oMultiViewBlitBackBufferExpression.has()) {
      frame.addExpression(this.__oMultiViewBlitBackBufferExpression.get());
    }

    for (const exp of this.__transparentOnlyExpressions) {
      frame.addExpression(exp);
    }

    if (!this.__isSimple && this.__oMultiViewBlitExpression.has()) {
      frame.addExpression(this.__oMultiViewBlitExpression.get());
    }

    if (!this.__isSimple && this.__isBloom && this.__oBloomExpression.has()) {
      frame.addExpression(this.__oBloomExpression.get());
    }

    if (!this.__isSimple && this.__oToneMappingExpression.has()) {
      frame.addExpression(this.getToneMappingExpression()!);
    }
  }
}
