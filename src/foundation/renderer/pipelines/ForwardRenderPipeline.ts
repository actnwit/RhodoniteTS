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
  ProcessApproachClass,
} from '../../definitions';
import { ISceneGraphEntity, MeshHelper, RenderPassHelper } from '../../helpers';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Sampler } from '../../textures/Sampler';
import { Vector3 } from '../../math/Vector3';
import { SystemState } from '../../system';

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
 * forwardRenderPipeline.setIBL(
 *     diffuse: {
 *     baseUri: './../../../assets/ibl/papermill/diffuse/diffuse',
 *     hdriFormat: Rn.HdriFormat.RGBE_PNG,
 *     isNamePosNeg: true,
 *     mipmapLevelNumber: 1,
 *   },
 *   specular: {
 *     baseUri: './../../../assets/ibl/papermill/specular/specular',
 *     hdriFormat: Rn.HdriFormat.RGBE_PNG,
 *     isNamePosNeg: true,
 *     mipmapLevelNumber: 10,
 *   },
 * );
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
  private __isSimple = false;
  private __shadowMapSize = 1024;
  private __oFrame: IOption<Frame> = new None();
  private __oFrameDepthMoment: IOption<FrameBuffer> = new None();
  private __oFrameBufferMsaa: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolve: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolveForReference: IOption<FrameBuffer> = new None();
  private __oInitialExpression: IOption<Expression> = new None();

  /** main expressions */
  private __expressions: Expression[] = [];

  private __oGenerateMipmapsExpression: IOption<Expression> = new None();
  private __depthMomentExpressions: Expression[] = [];
  private __oGammaExpression: IOption<Expression> = new None();
  private __transparentOnlyExpressions: Expression[] = [];
  private __oWebXRSystem: IOption<any> = new None();
  private __oDrawFunc: IOption<DrawFunc> = new None();
  private __oDiffuseCubeTexture: IOption<CubeTexture> = new None();
  private __oSpecularCubeTexture: IOption<CubeTexture> = new None();
  private __oSamplerForBackBuffer: IOption<Sampler> = new None();

  constructor() {
    super();
  }

  /**
   * Initializes the pipeline.
   * @param canvasWidth - The width of the canvas.
   * @param canvasHeight - The height of the canvas.
   */
  async setup(
    canvasWidth: number,
    canvasHeight: number,
    { isShadow = false, shadowMapSize = 1024, isSimple = false } = {}
  ) {
    this.__width = canvasWidth;
    this.__height = canvasHeight;
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
      const { framebufferMsaa, framebufferResolve, framebufferResolveForReference } =
        this.__createRenderTargets(canvasWidth, canvasHeight);

      // FrameBuffers
      this.__oFrameBufferMsaa = new Some(framebufferMsaa);
      this.__oFrameBufferResolve = new Some(framebufferResolve);
      this.__oFrameBufferResolveForReference = new Some(framebufferResolveForReference);

      // depth moment FrameBuffer
      if (isShadow) {
        this.__isShadow = true;
        this.__oFrameDepthMoment = this.__setupDepthMomentFramebuffer(shadowMapSize);
      }

      this.__oGenerateMipmapsExpression = this.__setupGenerateMipmapsExpression(
        sFrame,
        this.__oFrameBufferResolveForReference.unwrapForce()
      );

      // gamma Expression
      const gammaExpression = this.__setupGammaExpression(
        sFrame,
        this.__oFrameBufferResolve.unwrapForce(),
        canvasWidth / canvasHeight
      );
      this.__oGammaExpression = new Some(gammaExpression);
    }

    // Initial Expression
    const initialExpression = this.__setupInitialExpression(
      this.__oFrameBufferMsaa,
      this.__oFrameDepthMoment
    );
    this.__oInitialExpression = new Some(initialExpression);

    const rnXRModule = await ModuleManager.getInstance().getModule('xr');
    if (Is.exist(rnXRModule)) {
      this.__oWebXRSystem = new Some(rnXRModule.WebXRSystem.getInstance());
    }

    return new Ok();
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
    const expressionsOpaque = expressions.map((expression) => expression.clone());
    const expressionsTranslucent = expressions.map((expression) => expression.clone());
    this.__setExpressionsInner(expressionsOpaque, {
      isTransmission: options.isTransmission,
    });
    if (options.isTransmission) {
      this.__setTransparentExpressionsForTransmission(expressionsTranslucent);
    }

    if (SystemState.currentProcessApproach !== ProcessApproach.WebGPU) {
      this.__setDepthTextureToEntityMaterials();
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
    assertHas(this.__oFrame);
    const webXRSystem = this.__oWebXRSystem.unwrapOrUndefined();
    if (Is.exist(webXRSystem) && webXRSystem.isWebXRMode) {
      width = webXRSystem.getCanvasWidthForVr();
      height = webXRSystem.getCanvasHeightForVr();
    }
    System.resizeCanvas(width, height);

    this.__oFrame.get().setViewport(Vector4.fromCopy4(0, 0, width, height));

    if (this.__oFrameDepthMoment.has()) {
      this.__oFrameDepthMoment
        .get()
        .resize(
          Math.floor(this.__shadowMapSize * (this.__width / this.__height)),
          this.__shadowMapSize
        );
    }

    if (!this.__isSimple) {
      assertHas(this.__oFrameBufferMsaa);
      assertHas(this.__oFrameBufferResolve);
      assertHas(this.__oFrameBufferResolveForReference);
      assertHas(this.__oGammaExpression);
      this.__oFrameBufferMsaa.get().resize(width, height);
      this.__oFrameBufferResolve.get().resize(width, height);
      this.__oFrameBufferResolveForReference.get().resize(width, height);

      this.__oGammaExpression
        .get()
        .renderPasses[0].setViewport(Vector4.fromCopy4(0, 0, width, height));
    }

    return new Ok();
  }

  /**
   * set IBL textures from uri
   * @param arg - argument for diffuse and specular IBL
   */
  async setIBL(arg: { diffuse: IBLCubeTextureParameter; specular: IBLCubeTextureParameter }) {
    const diffuseCubeTexture = new CubeTexture();
    diffuseCubeTexture.baseUriToLoad = arg.diffuse.baseUri;
    diffuseCubeTexture.hdriFormat = arg.diffuse.hdriFormat;
    diffuseCubeTexture.isNamePosNeg = arg.diffuse.isNamePosNeg;
    diffuseCubeTexture.mipmapLevelNumber = arg.diffuse.mipmapLevelNumber;
    this.__oDiffuseCubeTexture = new Some(diffuseCubeTexture);

    const specularCubeTexture = new CubeTexture();
    specularCubeTexture.baseUriToLoad = arg.specular.baseUri;
    specularCubeTexture.isNamePosNeg = arg.specular.isNamePosNeg;
    specularCubeTexture.hdriFormat = arg.specular.hdriFormat;
    specularCubeTexture.mipmapLevelNumber = arg.specular.mipmapLevelNumber;
    this.__oSpecularCubeTexture = new Some(specularCubeTexture);

    await this.__setIblInner();
    await this.__setIblInnerForTransparentOnly();
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
   * getter of gamma expression
   */
  getGammaExpression(): Expression | undefined {
    return this.__oGammaExpression.unwrapOrUndefined();
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
          rp.setFramebuffer(this.__oFrameBufferMsaa.unwrapForce());
          rp.setResolveFramebuffer(this.__oFrameBufferResolve.unwrapForce());
          rp.setResolveFramebuffer2(this.__oFrameBufferResolveForReference.unwrapForce());
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
        if (!this.__isSimple) {
          rp.setFramebuffer(this.__oFrameBufferMsaa.unwrapForce());
          rp.setResolveFramebuffer(this.__oFrameBufferResolve.unwrapForce());

          for (const entity of rp.entities) {
            const meshComponent = entity.tryToGetMesh();
            if (Is.exist(meshComponent)) {
              const mesh = meshComponent.mesh;
              if (Is.exist(mesh)) {
                for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
                  const primitive = mesh.getPrimitiveAt(i);
                  primitive.material.setTextureParameter(
                    ShaderSemantics.BackBufferTexture,
                    this.__oFrameBufferResolveForReference
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

  private __setupInitialExpression(
    oFramebufferTargetOfGammaMsaa: IOption<FrameBuffer>,
    oFrameDepthMoment: IOption<FrameBuffer>
  ) {
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
      initialRenderPassForFrameBuffer.setFramebuffer(oFramebufferTargetOfGammaMsaa.unwrapForce());
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
    // MSAA depth
    const framebufferMsaa = RenderableHelper.createTexturesForRenderTarget(
      canvasWidth,
      canvasHeight,
      0,
      {
        isMSAA: true,
        sampleCountMSAA: 4,
      }
    );
    framebufferMsaa.tryToSetUniqueName('FramebufferTargetOfGammaMsaa', true);

    // Resolve Color 1
    const framebufferResolve = RenderableHelper.createTexturesForRenderTarget(
      canvasWidth,
      canvasHeight,
      1,
      {
        createDepthBuffer: true,
      }
    );
    framebufferResolve.tryToSetUniqueName('FramebufferTargetOfGammaResolve', true);

    // Resolve Color 2
    const framebufferResolveForReference = RenderableHelper.createTexturesForRenderTarget(
      canvasWidth,
      canvasHeight,
      1,
      {
        createDepthBuffer: false,
        // minFilter: TextureParameter.LinearMipmapLinear,
      }
    );
    framebufferResolveForReference.tryToSetUniqueName(
      'FramebufferTargetOfGammaResolveForReference',
      true
    );
    return {
      framebufferMsaa,
      framebufferResolve,
      framebufferResolveForReference,
    };
  }

  private __setupGenerateMipmapsExpression(sFrame: Some<Frame>, resolveFramebuffer2: FrameBuffer) {
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

    sFrame.unwrapForce().addExpression(expression);

    return new Some(expression);
  }

  private __setupGammaExpression(
    sFrame: Some<Frame>,
    gammaTargetFramebuffer: FrameBuffer,
    aspect: number
  ) {
    const expressionGammaEffect = new Expression();
    const materialGamma = MaterialHelper.createGammaCorrectionMaterial();

    // Rendering for Canvas Frame Buffer
    const renderPassGamma = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      materialGamma,
      gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)!
    );
    renderPassGamma.tryToSetUniqueName('renderPassGamma', true);
    renderPassGamma.toClearColorBuffer = false;
    renderPassGamma.toClearDepthBuffer = false;
    renderPassGamma.isDepthTest = false;
    renderPassGamma.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    renderPassGamma.isVrRendering = false;
    renderPassGamma.isOutputForVr = false;

    // Rendering for VR HeadSet Frame Buffer
    const renderPassGammaVr = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      materialGamma,
      gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)!
    );
    renderPassGammaVr.tryToSetUniqueName('renderPassGammaVr', true);
    renderPassGammaVr.toClearColorBuffer = false;
    renderPassGammaVr.toClearDepthBuffer = false;
    renderPassGammaVr.isDepthTest = false;
    renderPassGammaVr.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    renderPassGammaVr.isVrRendering = false;
    renderPassGammaVr.isOutputForVr = true;

    expressionGammaEffect.addRenderPasses([renderPassGamma, renderPassGammaVr]);

    return expressionGammaEffect;
  }

  private __setupSatExpression() {
    const satMaterial = MaterialHelper.createSummedAreaTableMaterial({
      noUseCameraTransform: true,
    });
    const renderPassSat = RenderPassHelper.createScreenDrawRenderPass(satMaterial);
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

    if (!this.__isSimple) {
      frame.addExpression(this.__oGenerateMipmapsExpression.unwrapForce());
    }

    for (const exp of this.__transparentOnlyExpressions) {
      frame.addExpression(exp);
    }
    if (!this.__isSimple) {
      frame.addExpression(this.getGammaExpression()!);
    }
  }
}
