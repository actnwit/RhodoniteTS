import {MeshComponent} from '../../components/Mesh/MeshComponent';
import {MeshRendererComponent} from '../../components/MeshRenderer/MeshRendererComponent';
import {ComponentRepository} from '../../core/ComponentRepository';
import {ShaderSemantics} from '../../definitions/ShaderSemantics';
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

export class ForwardRenderPipeline {
  private __oFrame: IOption<Frame> = new None();
  constructor() {}

  setup(canvasWidth: number, canvasHeight: number) {
    const sFrame = new Some(new Frame());
    this.__oFrame = sFrame;
    // create Frame Buffers
    const {
      framebufferTargetOfGammaMsaa,
      framebufferTargetOfGammaResolve,
      framebufferTargetOfGammaResolveForReference,
    } = this.createRenderTargets(canvasWidth, canvasHeight);

    this.setupInitialExpression(framebufferTargetOfGammaMsaa);

    this.setupMsaaResolveExpression(
      sFrame,
      framebufferTargetOfGammaMsaa,
      framebufferTargetOfGammaResolve,
      framebufferTargetOfGammaResolveForReference
    );
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

  setupInitialExpression(framebufferTargetOfGammaMsaa: FrameBuffer) {
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

  createRenderTargets(canvasWidth: number, canvasHeight: number) {
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

  attachIBLTextureToAllMeshComponents(
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

  setupMsaaResolveExpression(
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

    frame.get().addExpression(expressionForResolve);

    return expressionForResolve;
  }
}
