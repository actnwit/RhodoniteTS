import {MeshComponent} from '../../components/Mesh/MeshComponent';
import {MeshRendererComponent} from '../../components/MeshRenderer/MeshRendererComponent';
import {ComponentRepository} from '../../core/ComponentRepository';
import {
  ShaderSemantics,
  ShaderSemanticsEnum,
} from '../../definitions/ShaderSemantics';
import {TextureParameter} from '../../definitions/TextureParameter';
import {RenderableHelper} from '../../helpers/RenderableHelper';
import {MathUtil} from '../../math/MathUtil';
import {Scalar} from '../../math/Scalar';
import {Vector4} from '../../math/Vector4';
import {IOption, None, Some} from '../../misc/Option';
import {Is} from '../../misc/Is';
import {CubeTexture} from '../../textures/CubeTexture';
import {Expression} from '../Expression';
import {Frame} from '../Frame';
import {FrameBuffer} from '../FrameBuffer';
import {RenderPass} from '../RenderPass';
import {Plane} from '../../geometry/shapes/Plane';
import {Material} from '../../materials/core/Material';
import {CameraComponent} from '../../components/Camera/CameraComponent';
import {Mesh} from '../../geometry/Mesh';
import {EntityHelper, ICameraEntity, IMeshEntity, ISceneGraphEntity} from '../../helpers/EntityHelper';
import {Vector3} from '../../math/Vector3';
import {MaterialHelper} from '../../helpers/MaterialHelper';
import {RenderTargetTexture} from '../../textures';
import {Size} from '../../../types';
import {Err, Ok} from '../../misc/Result';
import {System} from '../../system/System';
import { RnObject } from '../../core/RnObject';
import { CameraType } from '../../definitions/CameraType';
import { ModuleManager } from '../../system/ModuleManager';

type DrawFunc = (frame: Frame) => void;

export class ForwardRenderPipeline extends RnObject {
  private __oFrame: IOption<Frame> = new None();
  private __oFrameBufferMsaa: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolve: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolveForReference: IOption<FrameBuffer> = new None();
  private __oInitialExpression: IOption<Expression> = new None();
  private __oMsaaResolveExpression: IOption<Expression> = new None();
  private __oGammaExpression: IOption<Expression> = new None();
  private __opaqueExpressions: Expression[] = [];
  private __transparentExpressions: Expression[] = [];
  private __oGammaBoardEntity: IOption<IMeshEntity> = new None();
  private __oGammaCameraEntity: IOption<ICameraEntity> = new None();
  private __oWebXRSystem: IOption<any> = new None();
  private __oDrawFunc: IOption<DrawFunc> = new None();

  constructor() {
    super();
  }

  async setup(
    canvasWidth: number,
    canvasHeight: number,
    opaqueExpressions: Expression[],
    transparentExpressions: Expression[]
  ) {
    if (this.__oFrame.has()) {
      return new Err({
        message: 'Already setup',
      });
    }

    this.setExpressionsInner(opaqueExpressions);
    this.setTransparentExpressionsForTransmission(transparentExpressions);

    const sFrame = new Some(new Frame());
    this.__oFrame = sFrame;

    // create Frame Buffers
    const {
      framebufferMsaa,
      framebufferResolve,
      framebufferResolveForReference,
    } = this.__createRenderTargets(canvasWidth, canvasHeight);

    // Initial Expression
    const initialExpression = this.__setupInitialExpression(framebufferMsaa);
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
    this.__oFrameBufferResolveForReference = new Some(
      framebufferResolveForReference
    );

    // gamma Expression
    const gammaExpression = this.__setupGammaExpression(
      sFrame,
      framebufferResolve,
      canvasWidth / canvasHeight
    );
    this.__oGammaExpression = new Some(gammaExpression);

    const rnXRModule = await ModuleManager.getInstance().getModule('xr')
    if (Is.exist(rnXRModule)) {
      this.__oWebXRSystem = new Some(rnXRModule.WebXRSystem.getInstance())
    }

    return new Ok();
  }

  setExpressions(expressions: Expression[], options: {
    isTransmission: boolean,
  } = {
    isTransmission: true
  }) {
    this.setExpressionsInner(expressions, {
      isTransmission: options.isTransmission
    });
    const clonedExpressions = expressions.map(expression => expression.clone());
    if (options.isTransmission) {
      this.setTransparentExpressionsForTransmission(clonedExpressions)
    }
  }

  setExpressionsInner(expressions: Expression[], options: {
    isTransmission: boolean,
  } = {
    isTransmission: true
  }) {
    for (const expression of expressions) {
      for (const rp of expression.renderPasses) {
        rp.toRenderOpaquePrimitives = true;
        if (options.isTransmission) {
          rp.toRenderTransparentPrimitives = false;
        } else {
          rp.toRenderTransparentPrimitives = true;
        }
        rp.toClearDepthBuffer = false;
        rp.setFramebuffer(this.__oFrameBufferMsaa.unwrapForce());
      }
    }
    this.__opaqueExpressions = expressions;
  }

  setTransparentExpressionsForTransmission(expressions: Expression[]) {
    for (const expression of expressions) {
      expression.tryToSetUniqueName('modelTransparentForTransmission', true);
      for (const rp of expression.renderPasses) {
        rp.toRenderOpaquePrimitives = false;
        rp.toRenderTransparentPrimitives = true;
        rp.toClearDepthBuffer = false;
        rp.setFramebuffer(this.__oFrameBufferMsaa.unwrapForce());
        // rp.setResolveFramebuffer(this.__oFrameBufferResolve.unwrapForce());

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
    this.__transparentExpressions = expressions;
  }

  __setupInitialExpression(framebufferTargetOfGammaMsaa: FrameBuffer) {
    const expression = new Expression();
    expression.tryToSetUniqueName('Initial', true);
    const initialRenderPass = new RenderPass();
    initialRenderPass.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0]);
    initialRenderPass.toClearColorBuffer = true;
    initialRenderPass.toClearDepthBuffer = true;
    const initialRenderPassForFrameBuffer = new RenderPass();
    initialRenderPassForFrameBuffer.clearColor = Vector4.fromCopyArray4([
      0.0, 0.0, 0.0, 0.0,
    ]);
    initialRenderPassForFrameBuffer.toClearColorBuffer = true;
    initialRenderPassForFrameBuffer.toClearDepthBuffer = true;
    initialRenderPassForFrameBuffer.setFramebuffer(
      framebufferTargetOfGammaMsaa
    );
    expression.addRenderPasses([
      initialRenderPass,
      initialRenderPassForFrameBuffer,
    ]);
    return expression;
  }

  __createRenderTargets(canvasWidth: number, canvasHeight: number) {
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
    framebufferResolve.tryToSetUniqueName(
      'FramebufferTargetOfGammaResolve',
      true
    );

    // Resolve Color 2
    const framebufferResolveForReference =
      RenderableHelper.createTexturesForRenderTarget(
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

  __attachIBLTextureToAllMeshComponents(
    diffuseCubeTexture: CubeTexture,
    specularCubeTexture: CubeTexture,
    rotation: number
  ) {
    const meshRendererComponents = ComponentRepository.getComponentsWithType(
      MeshRendererComponent
    ) as MeshRendererComponent[];
    for (let i = 0; i < meshRendererComponents.length; i++) {
      const meshRendererComponent = meshRendererComponents[i];
      meshRendererComponent.specularCubeMap = specularCubeTexture;
      meshRendererComponent.diffuseCubeMap = diffuseCubeTexture;
      meshRendererComponent.rotationOfCubeMap =
        MathUtil.degreeToRadian(rotation);
    }
    const meshComponents = ComponentRepository.getComponentsWithType(
      MeshComponent
    ) as MeshComponent[];
    for (let i = 0; i < meshComponents.length; i++) {
      const meshComponent = meshComponents[i];
      const mesh = meshComponent.mesh;
      if (Is.exist(mesh)) {
        for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
          const primitive = mesh.getPrimitiveAt(i);
          primitive.material.setParameter(
            ShaderSemantics.InverseEnvironment,
            Scalar.fromCopyNumber(0)
          );
        }
      }
    }
  }

  __setupMsaaResolveExpression(
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
    renderPassForResolve.setResolveFramebuffer2(
      framebufferTargetOfGammaResolveForReference
    );

    sFrame.unwrapForce().addExpression(expressionForResolve);

    return expressionForResolve;
  }

  __createPostEffectCameraEntity() {
    const cameraEntity = EntityHelper.createCameraEntity();
    const cameraComponent = cameraEntity.getCamera();
    cameraComponent.zNearInner = 0.5;
    cameraComponent.zFarInner = 2.0;
    return cameraEntity;
  }

  __setupGammaExpression(
    sFrame: Some<Frame>,
    gammaTargetFramebuffer: FrameBuffer,
    aspect: number
  ) {
    const expressionGammaEffect = new Expression();

    const entityGamma = EntityHelper.createMeshEntity()
    entityGamma.tryToSetUniqueName('Gamma Plane', true)
    entityGamma.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    })
    entityGamma.getTransform().scale = Vector3.fromCopyArray3([aspect, 1, 1])
    entityGamma.getTransform().rotate = Vector3.fromCopyArray3([Math.PI / 2, 0, 0]);

    const primitiveGamma = new Plane()
    primitiveGamma.generate({ width: 2, height: 2, uSpan: 1, vSpan: 1, isUVRepeat: false, flipTextureCoordinateY: false })
    primitiveGamma.material = MaterialHelper.createGammaCorrectionMaterial()
    primitiveGamma.material.setTextureParameter(ShaderSemantics.BaseColorTexture, gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)!);

    const meshGamma = new Mesh()
    meshGamma.addPrimitive(primitiveGamma)
    this.__oGammaBoardEntity = new Some(entityGamma)

    const meshComponentGamma = entityGamma.getComponent(MeshComponent) as MeshComponent
    meshComponentGamma.setMesh(meshGamma)

    const cameraEntityGamma = EntityHelper.createCameraEntity()
    cameraEntityGamma.tryToSetUniqueName('Gamma Expression Camera', true)
    cameraEntityGamma.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    })
    const cameraComponentGamma = cameraEntityGamma.getComponent(CameraComponent) as CameraComponent
    cameraEntityGamma.getTransform().translate = Vector3.fromCopyArray3([0.0, 0.0, 1.0])
    cameraComponentGamma.type = CameraType.Orthographic
    cameraComponentGamma.zNear = 0.01
    cameraComponentGamma.zFar = 1000
    cameraComponentGamma.xMag = aspect
    cameraComponentGamma.yMag = 1;
    this.__oGammaCameraEntity = new Some(cameraEntityGamma);


    // Rendering for Canvas Frame Buffer
    const renderPassGamma = new RenderPass()
    renderPassGamma.tryToSetUniqueName('renderPassGamma', true)
    renderPassGamma.toClearColorBuffer = false
    renderPassGamma.toClearDepthBuffer = false
    renderPassGamma.isDepthTest = false
    renderPassGamma.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0])
    renderPassGamma.addEntities([entityGamma])
    renderPassGamma.cameraComponent = cameraComponentGamma
    renderPassGamma.isVrRendering = false
    renderPassGamma.isOutputForVr = false

    // Rendering for VR HeadSet Frame Buffer
    const renderPassGammaVr = new RenderPass()
    renderPassGammaVr.tryToSetUniqueName('renderPassGammaVr', true)
    renderPassGammaVr.toClearColorBuffer = false
    renderPassGammaVr.toClearDepthBuffer = false
    renderPassGammaVr.isDepthTest = false
    renderPassGammaVr.clearColor = Vector4.fromCopyArray4([0.0, 0.0, 0.0, 0.0])
    renderPassGammaVr.addEntities([entityGamma])
    renderPassGammaVr.cameraComponent = cameraComponentGamma
    renderPassGammaVr.isVrRendering = false
    renderPassGammaVr.isOutputForVr = true

    expressionGammaEffect.addRenderPasses([renderPassGamma, renderPassGammaVr])

    return expressionGammaEffect

  }

  __setTextureParameterForMeshComponents(
    meshComponents: MeshComponent[],
    shaderSemantic: ShaderSemanticsEnum,
    value: RenderTargetTexture
  ) {
    for (let i = 0; i < meshComponents.length; i++) {
      const mesh = meshComponents[i].mesh;
      if (!mesh) continue;

      const primitiveNumber = mesh.getPrimitiveNumber();
      for (let j = 0; j < primitiveNumber; j++) {
        const primitive = mesh.getPrimitiveAt(j);
        primitive.material.setTextureParameter(shaderSemantic, value);
      }
    }
  }

  resize(width: Size, height: Size) {
    if (Is.false(this.__oFrame.has())) {
      return new Err({
        message: 'not initialized.',
      });
    }

    const webXRSystem = this.__oWebXRSystem.unwrapOrUndefined();
    if (Is.exist(webXRSystem) && webXRSystem.isWebXRMode) {
      width = webXRSystem.getCanvasWidthForVr();
      height = webXRSystem.getCanvasHeightForVr();
    }
    System.resizeCanvas(width, height);

    this.__oFrame.unwrapForce().setViewport(Vector4.fromCopy4(0, 0, width, height))

    this.__oFrameBufferMsaa.unwrapForce().resize(width, height);
    this.__oFrameBufferResolve.unwrapForce().resize(width, height);
    this.__oFrameBufferResolveForReference.unwrapForce().resize(width, height);

    let aspect = width / height;

    this.__oGammaBoardEntity.unwrapForce().getTransform().scale = Vector3.fromCopyArray3([aspect, 1, 1])
    this.__oGammaCameraEntity.unwrapForce().getCamera().xMag = aspect;
    this.__oGammaExpression.unwrapForce().renderPasses[0].setViewport(Vector4.fromCopy4(0, 0, width, height))


    return new Ok();
  }

  __setExpressions() {
    const frame = this.__oFrame.unwrapForce();
    frame.clearExpressions();
    frame.addExpression(this.getInitialExpression()!);
    for (const exp of this.__opaqueExpressions) {
      frame.addExpression(exp);
    }
    frame.addExpression(this.getMsaaResolveExpression()!);
    for (const exp of this.__transparentExpressions) {
      frame.addExpression(exp);
    }
    frame.addExpression(this.getMsaaResolveExpression()!);
    frame.addExpression(this.getGammaExpression()!);
  }

  startRenderLoop(func: (frame: Frame) => void) {
    this.__oDrawFunc = new Some(func);

    if (Is.false(this.__oFrame.has())) {
      return new Err({
        message: 'not initialized.',
      });
    }

    System.startRenderLoop(() => {
      this.__setExpressions();
      func(this.__oFrame.unwrapForce());
    });

    return new Ok();
  }

  draw() {
    this.__oDrawFunc.unwrapForce()(this.__oFrame.unwrapForce());
  }

  getInitialExpression(): Expression | undefined {
    return this.__oInitialExpression.unwrapOrUndefined();
  }

  getMsaaResolveExpression(): Expression | undefined {
    return this.__oMsaaResolveExpression.unwrapOrUndefined();
  }

  getGammaExpression(): Expression | undefined {
    return this.__oGammaExpression.unwrapOrUndefined();
  }
}
