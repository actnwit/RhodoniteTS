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
import {EntityHelper} from '../../helpers/EntityHelper';
import {Vector3} from '../../math/Vector3';
import {MaterialHelper} from '../../helpers/MaterialHelper';
import {RenderTargetTexture} from '../../textures';
import {Size} from '../../../types';
import {Err, Ok} from '../../misc/Result';
import { System } from '../../system/System';

export class ForwardRenderPipeline {
  private __oFrame: IOption<Frame> = new None();
  private __oFrameBufferMsaa: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolve: IOption<FrameBuffer> = new None();
  private __oFrameBufferResolveForReference: IOption<FrameBuffer> = new None();

  constructor() {}

  setup(
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

    this.setOpaqueExpressions(opaqueExpressions);
    this.setTransparentExpressions(transparentExpressions);

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

    // Msaa Expression
    const msaaResolveExpression = this.__setupMsaaResolveExpression(
      sFrame,
      framebufferMsaa,
      framebufferResolve,
      framebufferResolveForReference
    );
    this.__oFrameBufferMsaa = new Some(framebufferMsaa);
    this.__oFrameBufferResolve = new Some(framebufferResolve);
    this.__oFrameBufferResolveForReference = new Some(
      framebufferResolveForReference
    );

    // gamma Expression
    const gammaExpression = this.__setupGammaExpression(
      sFrame,
      framebufferResolve
    );

    sFrame.unwrapForce().addExpression(initialExpression);
    sFrame.unwrapForce().addExpression(msaaResolveExpression);
    sFrame.unwrapForce().addExpression(gammaExpression);

    return new Ok();
  }

  setOpaqueExpressions(expressions: Expression[]) {
    for (const expression of expressions) {
      for (const rp of expression.renderPasses) {
        rp.toRenderOpaquePrimitives = true;
        rp.toRenderTransparentPrimitives = false;
      }
    }
  }

  setTransparentExpressions(expressions: Expression[]) {
    for (const expression of expressions) {
      for (const rp of expression.renderPasses) {
        rp.toRenderOpaquePrimitives = false;
        rp.toRenderTransparentPrimitives = true;
      }
    }
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
    gammaTargetFramebuffer: FrameBuffer
  ) {
    const expressionGammaEffect = new Expression();

    // gamma correction (and super sampling)
    const postEffectCameraEntity = this.__createPostEffectCameraEntity();
    const postEffectCameraComponent = postEffectCameraEntity.getCamera();

    const gammaCorrectionMaterial =
      MaterialHelper.createGammaCorrectionMaterial();
    const gammaCorrectionRenderPass = this.__createGammaRenderPass(
      gammaCorrectionMaterial,
      postEffectCameraComponent
    );

    this.__setTextureParameterForMeshComponents(
      gammaCorrectionRenderPass.meshComponents!,
      ShaderSemantics.BaseColorTexture,
      gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)!
    );

    expressionGammaEffect.addRenderPasses([gammaCorrectionRenderPass]);

    return expressionGammaEffect;
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

  __createGammaRenderPass(
    material: Material,
    cameraComponent: CameraComponent
  ) {
    const boardPrimitive = new Plane();
    boardPrimitive.generate({
      width: 1,
      height: 1,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      material,
    });

    const boardMesh = new Mesh();
    boardMesh.addPrimitive(boardPrimitive);

    const boardEntity = EntityHelper.createMeshEntity();
    boardEntity.getTransform().rotate = Vector3.fromCopyArray([
      Math.PI / 2,
      0.0,
      0.0,
    ]);
    boardEntity.getTransform().translate = Vector3.fromCopyArray([
      0.0, 0.0, -0.5,
    ]);
    const boardMeshComponent = boardEntity.getMesh();
    boardMeshComponent.setMesh(boardMesh);

    const renderPass = new RenderPass();
    renderPass.toClearColorBuffer = false;
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities([boardEntity]);

    return renderPass;
  }

  resize(width: Size, height: Size) {
    if (Is.false(this.__oFrame.has())) {
      return new Err({
        message: 'not initialized.',
      });
    }

    this.__oFrameBufferMsaa.unwrapForce().resize(width, height);
    this.__oFrameBufferResolve.unwrapForce().resize(width, height);
    this.__oFrameBufferResolveForReference.unwrapForce().resize(width, height);

    return new Ok();
  }

  startRenderLoop(func: (frame: Frame) => void) {
    if (Is.false(this.__oFrame.has())) {
      return new Err({
        message: 'not initialized.',
      });
    }

    System.startRenderLoop(() => {
      func(this.__oFrame.unwrapForce());
    });

    return new Ok();
  }
}
