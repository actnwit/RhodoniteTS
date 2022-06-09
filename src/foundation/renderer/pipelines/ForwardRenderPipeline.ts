import {MeshComponent} from '../../components/Mesh/MeshComponent';
import {MeshRendererComponent} from '../../components/MeshRenderer/MeshRendererComponent';
import {ComponentRepository} from '../../core/ComponentRepository';
import {ShaderSemantics, ShaderSemanticsEnum} from '../../definitions/ShaderSemantics';
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
import { MaterialHelper } from '../../helpers/MaterialHelper';
import { RenderTargetTexture } from '../../textures';

export class ForwardRenderPipeline {
  private __oFrame: IOption<Frame> = new None();
  constructor() {}

  setup(canvasWidth: number, canvasHeight: number) {
    if (this.__oFrame.has()) {
      console.log('Already setup');
      return false;
    }
    const sFrame = new Some(new Frame());
    this.__oFrame = sFrame;
    // create Frame Buffers
    const {
      framebufferTargetOfGammaMsaa,
      framebufferTargetOfGammaResolve,
      framebufferTargetOfGammaResolveForReference,
    } = this.__createRenderTargets(canvasWidth, canvasHeight);

    this.__setupInitialExpression(framebufferTargetOfGammaMsaa);

    this.__setupMsaaResolveExpression(
      sFrame,
      framebufferTargetOfGammaMsaa,
      framebufferTargetOfGammaResolve,
      framebufferTargetOfGammaResolveForReference
    );

    return true;
  }

  setOpaqueRenderPass(renderPass: RenderPass) {
    const rp = renderPass.clone();
    rp.toRenderOpaquePrimitives = true;
    rp.toRenderTransparentPrimitives = false;
  }

  setTransparentRenderPass(renderPass: RenderPass) {
    const rp = renderPass.clone();
    rp.toRenderOpaquePrimitives = false;
    rp.toRenderTransparentPrimitives = true;
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
    const framebufferTargetOfGammaMsaa =
      RenderableHelper.createTexturesForRenderTarget(
        canvasWidth,
        canvasHeight,
        0,
        {
          isMSAA: true,
          sampleCountMSAA: 4,
        }
      );
    framebufferTargetOfGammaMsaa.tryToSetUniqueName(
      'FramebufferTargetOfGammaMsaa',
      true
    );

    // Resolve Color 1
    const framebufferTargetOfGammaResolve =
      RenderableHelper.createTexturesForRenderTarget(
        canvasWidth,
        canvasHeight,
        1,
        {
          createDepthBuffer: true,
        }
      );
    framebufferTargetOfGammaResolve.tryToSetUniqueName(
      'FramebufferTargetOfGammaResolve',
      true
    );

    // Resolve Color 2
    const framebufferTargetOfGammaResolveForReference =
      RenderableHelper.createTexturesForRenderTarget(
        canvasWidth,
        canvasHeight,
        1,
        {
          createDepthBuffer: false,
          minFilter: TextureParameter.LinearMipmapLinear,
        }
      );
    framebufferTargetOfGammaResolveForReference.tryToSetUniqueName(
      'FramebufferTargetOfGammaResolveForReference',
      true
    );
    return {
      framebufferTargetOfGammaMsaa,
      framebufferTargetOfGammaResolve,
      framebufferTargetOfGammaResolveForReference,
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
    frame: Some<Frame>,
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

    frame.unwrapForce().addExpression(expressionForResolve);

    return expressionForResolve;
  }

  __createPostEffectCameraEntity() {
    const cameraEntity = EntityHelper.createCameraEntity();
    const cameraComponent = cameraEntity.getCamera();
    cameraComponent.zNearInner = 0.5;
    cameraComponent.zFarInner = 2.0;
    return cameraEntity;
  }

  __setupGammaExpression(frame: Frame, gammaTargetFramebuffer: FrameBuffer) {
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

    frame.addExpression(expressionGammaEffect);
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
}
