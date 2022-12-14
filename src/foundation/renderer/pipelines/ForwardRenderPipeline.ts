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
import { EntityHelper, IMeshEntity } from '../../helpers/EntityHelper';
import { MaterialHelper } from '../../helpers/MaterialHelper';
import { Size } from '../../../types';
import { Err, Ok } from '../../misc/Result';
import { System } from '../../system/System';
import { RnObject } from '../../core/RnObject';
import { ModuleManager } from '../../system/ModuleManager';
import { ComponentType, HdriFormatEnum, PixelFormat } from '../../definitions';
import { MeshHelper, RenderPassHelper } from '../../helpers';
import { CameraComponent } from '../../components/Camera/CameraComponent';

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
  private __shadowMapSize = 1024;
  private __oFrame: IOption<Frame> = new None();
  private __oFrameDepthMoment: IOption<FrameBuffer> = new None();
  private __oFrameBufferMsaa: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolve: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolveForReference: IOption<FrameBuffer> = new None();
  private __oInitialExpression: IOption<Expression> = new None();

  /** main expressions */
  private __expressions: Expression[] = [];

  private __depthMomentExpressions: Expression[] = [];
  private __oMsaaResolveExpression: IOption<Expression> = new None();
  private __oGammaExpression: IOption<Expression> = new None();
  private __transparentOnlyExpressions: Expression[] = [];
  private __oGammaBoardEntity: IOption<IMeshEntity> = new None();
  private __oWebXRSystem: IOption<any> = new None();
  private __oDrawFunc: IOption<DrawFunc> = new None();
  private __oDiffuseCubeTexture: IOption<CubeTexture> = new None();
  private __oSpecularCubeTexture: IOption<CubeTexture> = new None();

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
    { isShadow = false, shadowMapSize = 1024 } = {}
  ) {
    this.__width = canvasWidth;
    this.__height = canvasHeight;
    this.__shadowMapSize = shadowMapSize;
    if (this.__oFrame.has()) {
      return new Err({
        message: 'Already setup',
        error: undefined,
      });
    }

    const sFrame = new Some(new Frame());
    this.__oFrame = sFrame;

    // create Frame Buffers
    const { framebufferMsaa, framebufferResolve, framebufferResolveForReference } =
      this.__createRenderTargets(canvasWidth, canvasHeight);

    // depth moment FrameBuffer
    if (isShadow) {
      this.__isShadow = true;
      this.__oFrameDepthMoment = this.__setupDepthMomentFramebuffer(shadowMapSize);
    }

    // Initial Expression
    const initialExpression = this.__setupInitialExpression(
      framebufferMsaa,
      this.__oFrameDepthMoment
    );
    this.__oInitialExpression = new Some(initialExpression);

    // Msaa Expression
    const msaaResolveExpression = this.__setupMsaaResolveExpression(
      sFrame,
      framebufferMsaa,
      framebufferResolve,
      framebufferResolveForReference
    );
    this.__oMsaaResolveExpression = new Some(msaaResolveExpression);
    this.__oFrameBufferMsaa = new Some(framebufferMsaa);
    this.__oFrameBufferResolve = new Some(framebufferResolve);
    this.__oFrameBufferResolveForReference = new Some(framebufferResolveForReference);

    // gamma Expression
    const gammaExpression = this.__setupGammaExpression(
      sFrame,
      framebufferResolve,
      canvasWidth / canvasHeight
    );
    this.__oGammaExpression = new Some(gammaExpression);

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
    this.__setExpressionsInner(expressions, {
      isTransmission: options.isTransmission,
    });
    const clonedExpressions = expressions.map((expression) => expression.clone());
    if (options.isTransmission) {
      this.__setTransparentExpressionsForTransmission(clonedExpressions);
    }

    this.__setDepthTextureToEntityMaterials();
  }

  private __setDepthTextureToEntityMaterials() {
    if (Is.false(this.__isShadow)) {
      return;
    }
    this.__depthMomentExpressions = [];
    for (const expression of this.__expressions) {
      this.__depthMomentExpressions.push(expression.clone());
    }

    const depthMomentMaterial = MaterialHelper.createDepthMomentEncodeMaterial();

    for (const expression of this.__depthMomentExpressions) {
      for (const renderPass of expression.renderPasses) {
        renderPass.setFramebuffer(this.__oFrameDepthMoment.unwrapForce());
        renderPass.toClearColorBuffer = true;
        renderPass.toClearDepthBuffer = true;
        // No need to render transparent primitives to depth buffer.
        renderPass.toRenderTransparentPrimitives = false;

        renderPass.setMaterial(depthMomentMaterial);
      }
    }

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
                  this.__oFrameDepthMoment.unwrapForce().getColorAttachedRenderTargetTexture(0)!
                );
              }
            }
          }
        }
      }
    }
    this.__setDepthMomentRenderPassesAndDepthTextureToEntityMaterials();
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
    assertHas(this.__oFrameBufferMsaa);
    assertHas(this.__oFrameBufferResolve);
    assertHas(this.__oFrameBufferResolveForReference);
    assertHas(this.__oGammaExpression);
    assertHas(this.__oGammaBoardEntity);

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
    this.__oFrameBufferMsaa.get().resize(width, height);
    this.__oFrameBufferResolve.get().resize(width, height);
    this.__oFrameBufferResolveForReference.get().resize(width, height);

    this.__oGammaExpression
      .get()
      .renderPasses[0].setViewport(Vector4.fromCopy4(0, 0, width, height));

    return new Ok();
  }

  /**
   * set IBL textures from uri
   * @param arg - argument for diffuse and specular IBL
   */
  setIBL(arg: { diffuse: IBLCubeTextureParameter; specular: IBLCubeTextureParameter }) {
    const diffuseCubeTexture = new CubeTexture();
    diffuseCubeTexture.baseUriToLoad = arg.diffuse.baseUri;
    diffuseCubeTexture.hdriFormat = arg.diffuse.hdriFormat;
    diffuseCubeTexture.isNamePosNeg = arg.diffuse.isNamePosNeg;
    diffuseCubeTexture.mipmapLevelNumber = arg.diffuse.mipmapLevelNumber;
    diffuseCubeTexture.loadTextureImagesAsync();
    this.__oDiffuseCubeTexture = new Some(diffuseCubeTexture);

    const specularCubeTexture = new CubeTexture();
    specularCubeTexture.baseUriToLoad = arg.specular.baseUri;
    specularCubeTexture.isNamePosNeg = arg.specular.isNamePosNeg;
    specularCubeTexture.hdriFormat = arg.specular.hdriFormat;
    specularCubeTexture.mipmapLevelNumber = arg.specular.mipmapLevelNumber;
    specularCubeTexture.loadTextureImagesAsync();
    this.__oSpecularCubeTexture = new Some(specularCubeTexture);

    this.__setIblInner();
    this.__setIblInnerForTransparentOnly();
  }

  /**
   * set IBL cube textures
   * @param diffuse - diffuse IBL Cube Texture
   * @param specular - specular IBL Cube Texture
   */
  setIBLTextures(diffuse: CubeTexture, specular: CubeTexture) {
    this.__oDiffuseCubeTexture = new Some(diffuse);
    this.__oSpecularCubeTexture = new Some(specular);
    this.__setIblInner();
    this.__setIblInnerForTransparentOnly();
  }

  /**
   * getter of initial expression
   */
  getInitialExpression(): Expression | undefined {
    return this.__oInitialExpression.unwrapOrUndefined();
  }

  /**
   * getter of msaa resolve expression
   */
  getMsaaResolveExpression(): Expression | undefined {
    return this.__oMsaaResolveExpression.unwrapOrUndefined();
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
        }
      }
    }
  }

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
        rp.toRenderOpaquePrimitives = true;
        if (options.isTransmission) {
          // if options.isTransmission is true, set toRenderTransparentPrimitives to false,
          // because transparent primitives are rendered in later expression.
          rp.toRenderTransparentPrimitives = false;
        } else {
          // if options.isTransmission is false, set toRenderTransparentPrimitives to true.
          // because transparent primitives are rendered in this expression as well as opaque primitives.
          rp.toRenderTransparentPrimitives = true;
        }

        // clearing depth is done in initial expression. so no need to clear depth in this render pass.
        rp.toClearDepthBuffer = false;
        rp.setFramebuffer(this.__oFrameBufferMsaa.unwrapForce());
      }
    }
    this.__expressions = expressions;
    this.__setIblInner();
  }

  private __setTransparentExpressionsForTransmission(expressions: Expression[]) {
    for (const expression of expressions) {
      expression.tryToSetUniqueName('modelTransparentForTransmission', true);
      for (const rp of expression.renderPasses) {
        rp.toRenderOpaquePrimitives = false; // not to render opaque primitives in transmission expression.
        rp.toRenderTransparentPrimitives = true;
        rp.toClearDepthBuffer = false;
        rp.setFramebuffer(this.__oFrameBufferMsaa.unwrapForce());

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
                    .getColorAttachedRenderTargetTexture(0)!
                );
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
    framebufferTargetOfGammaMsaa: FrameBuffer,
    oFrameDepthMoment: IOption<FrameBuffer>
  ) {
    const expression = new Expression();
    expression.tryToSetUniqueName('Initial', true);

    // render pass to clear buffers of render texture
    const initialRenderPass = new RenderPass();
    initialRenderPass.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    initialRenderPass.toClearColorBuffer = true;
    initialRenderPass.toClearDepthBuffer = true;

    // render pass to clear buffers of framebuffer
    const initialRenderPassForFrameBuffer = new RenderPass();
    initialRenderPassForFrameBuffer.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    initialRenderPassForFrameBuffer.toClearColorBuffer = true;
    initialRenderPassForFrameBuffer.toClearDepthBuffer = true;
    initialRenderPassForFrameBuffer.setFramebuffer(framebufferTargetOfGammaMsaa);

    expression.addRenderPasses([initialRenderPass, initialRenderPassForFrameBuffer]);

    if (oFrameDepthMoment.has()) {
      const frameDepthMoment = oFrameDepthMoment.unwrapForce();
      const initialRenderPassForDepthMoment = new RenderPass();
      initialRenderPassForDepthMoment.clearColor = Vector4.fromCopyArray4([1.0, 1.0, 1.0, 1.0]);
      initialRenderPassForDepthMoment.toClearColorBuffer = true;
      initialRenderPassForDepthMoment.toClearDepthBuffer = true;
      initialRenderPassForDepthMoment.setFramebuffer(frameDepthMoment);

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
        minFilter: TextureParameter.LinearMipmapLinear,
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

  private __setupMsaaResolveExpression(
    sFrame: Some<Frame>,
    framebufferTargetOfGammaMsaa: FrameBuffer,
    framebufferTargetOfGammaResolve: FrameBuffer,
    framebufferTargetOfGammaResolveForReference: FrameBuffer
  ) {
    const expressionForResolve = new Expression();
    expressionForResolve.tryToSetUniqueName('Resolve', true);
    const renderPassForResolve = new RenderPass();
    expressionForResolve.addRenderPasses([renderPassForResolve]);

    renderPassForResolve.toClearDepthBuffer = false;
    renderPassForResolve.setFramebuffer(framebufferTargetOfGammaMsaa);
    renderPassForResolve.setResolveFramebuffer(framebufferTargetOfGammaResolve);
    renderPassForResolve.setResolveFramebuffer2(framebufferTargetOfGammaResolveForReference);

    // Generate Mipmap of resolve Framebuffer 2
    renderPassForResolve.setPostRenderFunction(function (this: RenderPass): void {
      const renderTargetTexture =
        this.getResolveFramebuffer2()!.getColorAttachedRenderTargetTexture(0)!;
      renderTargetTexture.generateMipmap();
    });

    sFrame.unwrapForce().addExpression(expressionForResolve);

    return expressionForResolve;
  }

  private __setupGammaExpression(
    sFrame: Some<Frame>,
    gammaTargetFramebuffer: FrameBuffer,
    aspect: number
  ) {
    const expressionGammaEffect = new Expression();
    const materialGamma = MaterialHelper.createGammaCorrectionMaterial({
      noUseCameraTransform: true,
    });
    const entityGamma = MeshHelper.createPlane({
      width: 2,
      height: 2,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      flipTextureCoordinateY: false,
      direction: 'xy',
      material: materialGamma,
    });
    entityGamma.tryToSetUniqueName('Gamma Plane', true);
    entityGamma.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    });

    materialGamma.setTextureParameter(
      ShaderSemantics.BaseColorTexture,
      gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)!
    );

    this.__oGammaBoardEntity = new Some(entityGamma);

    // Rendering for Canvas Frame Buffer
    const renderPassGamma = new RenderPass();
    renderPassGamma.tryToSetUniqueName('renderPassGamma', true);
    renderPassGamma.toClearColorBuffer = false;
    renderPassGamma.toClearDepthBuffer = false;
    renderPassGamma.isDepthTest = false;
    renderPassGamma.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    renderPassGamma.addEntities([entityGamma]);
    renderPassGamma.isVrRendering = false;
    renderPassGamma.isOutputForVr = false;

    // Rendering for VR HeadSet Frame Buffer
    const renderPassGammaVr = new RenderPass();
    renderPassGammaVr.tryToSetUniqueName('renderPassGammaVr', true);
    renderPassGammaVr.toClearColorBuffer = false;
    renderPassGammaVr.toClearDepthBuffer = false;
    renderPassGammaVr.isDepthTest = false;
    renderPassGammaVr.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    renderPassGammaVr.addEntities([entityGamma]);
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
      RenderableHelper.createTexturesForRenderTarget(
        Math.floor(shadowMapSize * (this.__width / this.__height)),
        shadowMapSize,
        1,
        {
          level: 0,
          internalFormat: TextureParameter.RGBA8,
          format: PixelFormat.RGBA,
          type: ComponentType.UnsignedByte,
          magFilter: TextureParameter.Linear,
          minFilter: TextureParameter.Linear,
          wrapS: TextureParameter.ClampToEdge,
          wrapT: TextureParameter.ClampToEdge,
          createDepthBuffer: true,
          isMSAA: false,
          sampleCountMSAA: 1,
          anisotropy: false,
        }
      )
    );
  }

  private __setIblInner() {
    if (this.__expressions.length === 0) {
      console.warn(
        'No effect because there are no expressions to set IBL yet. call setExpressions before this method.'
      );
    }

    for (const expression of this.__expressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.specularCubeMap = this.__oSpecularCubeTexture.unwrapOrUndefined();
            meshRendererComponent.diffuseCubeMap = this.__oDiffuseCubeTexture.unwrapOrUndefined();
          }
        }
      }
    }
  }

  private __setIblInnerForTransparentOnly() {
    for (const expression of this.__transparentOnlyExpressions) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.specularCubeMap = this.__oSpecularCubeTexture.unwrapOrUndefined();
            meshRendererComponent.diffuseCubeMap = this.__oDiffuseCubeTexture.unwrapOrUndefined();
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
    for (const exp of this.__depthMomentExpressions) {
      frame.addExpression(exp);
    }
    for (const exp of this.__expressions) {
      frame.addExpression(exp);
    }
    frame.addExpression(this.getMsaaResolveExpression()!);
    for (const exp of this.__transparentOnlyExpressions) {
      frame.addExpression(exp);
    }
    frame.addExpression(this.getMsaaResolveExpression()!);
    frame.addExpression(this.getGammaExpression()!);
  }

  private __setDepthMomentRenderPassesAndDepthTextureToEntityMaterials() {
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

    // setup depth moment render passes
    for (const expression of this.__depthMomentExpressions) {
      for (const renderPass of expression.renderPasses) {
        renderPass.setFramebuffer(this.__oFrameDepthMoment.unwrapForce());
        renderPass.toClearColorBuffer = false;
        renderPass.toClearDepthBuffer = false;
        // No need to render transparent primitives to depth buffer.
        renderPass.toRenderTransparentPrimitives = false;

        renderPass.setMaterial(depthMomentMaterial);
      }
    }

    // set depth moment texture to entity materials
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
                  this.__oFrameDepthMoment.unwrapForce().getColorAttachedRenderTargetTexture(0)!
                );
              }
            }
          }
        }
      }
    }
  }
}
