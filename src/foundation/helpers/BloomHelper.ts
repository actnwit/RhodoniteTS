import { MaterialHelper } from './MaterialHelper';
import { DetectHighLuminanceMaterialContent } from '../materials/contents/DetectHighLuminanceMaterialContent';
import { RenderPassHelper } from './RenderPassHelper';
import { RenderableHelper } from './RenderableHelper';
import { RenderPass } from '../renderer/RenderPass';
import { MathUtil } from '../math/MathUtil';
import { ShaderSemantics } from '../definitions/ShaderSemantics';
import { Vector2 } from '../math/Vector2';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { SynthesizeHdrMaterialContent } from '../materials/contents/SynthesizeHdrMaterialContent';
import { Expression } from '../renderer/Expression';
import { AbstractTexture } from '../textures/AbstractTexture';
import { VectorN } from '../math/VectorN';
import { TextureParameter } from '../definitions/TextureParameter';
import { TextureFormat } from '../definitions/TextureFormat';
import { FrameBuffer } from '../renderer/FrameBuffer';

export class Bloom {
  private __mapReducedFramebuffer: Map<string, FrameBuffer> = new Map();
  private __mapDetectHighLuminanceFramebuffer: Map<string, FrameBuffer> = new Map();
  private __mapSynthesizeFramebuffer: Map<string, FrameBuffer> = new Map();

  constructor() {}

  /**
   * create a bloom expression
   *
   * @param textureToBloom - the texture to bloom
   * @param parameters - the parameters for the bloom
   * @returns the bloom expression and the bloomed render target
   */
  public createBloomExpression({
    textureToBloom,
    parameters: {
      luminanceCriterion = 1.0,
      gaussianBlurLevelHighLuminance = 4,
      gaussianKernelSize = 10,
      gaussianVariance = 10,
      synthesizeCoefficient = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
      // synthesizeCoefficient = [1.0 / 2, 1.0 / 4, 1.0 / 8, 1.0 / 16, 1.0 / 32, 1.0 / 64],
    },
  }: {
    textureToBloom: AbstractTexture;
    parameters: {
      luminanceCriterion?: number;
      gaussianBlurLevelHighLuminance?: number;
      gaussianKernelSize?: number;
      gaussianVariance?: number;
      synthesizeCoefficient?: [number, number, number, number, number, number];
    };
  }): {
    bloomExpression: Expression;
    bloomedRenderTarget: RenderTargetTexture;
  } {
    // Setup DetectHighLuminanceMaterial
    const renderPassDetectHighLuminance = this.__createRenderPassDetectHighLuminance(
      textureToBloom,
      luminanceCriterion
    );

    // Setup RenderPasses for GaussianBlur
    const renderPassesBlurredHighLuminance = this.__createRenderPassesBlurredHighLuminance(
      renderPassDetectHighLuminance,
      gaussianBlurLevelHighLuminance,
      gaussianKernelSize,
      gaussianVariance,
      textureToBloom.width,
      textureToBloom.height
    );

    // Setup SynthesizeMaterial
    const renderPassSynthesizeImage = this.__createRenderPassSynthesizeImage(
      textureToBloom,
      renderPassesBlurredHighLuminance,
      synthesizeCoefficient
    );

    // Setup Expression
    const expression = new Expression();
    expression.addRenderPasses([
      renderPassDetectHighLuminance,
      ...renderPassesBlurredHighLuminance,
      renderPassSynthesizeImage,
    ]);

    return {
      bloomExpression: expression,
      bloomedRenderTarget: renderPassSynthesizeImage.getFramebuffer()!
        .colorAttachments[0] as RenderTargetTexture,
    };
  }

  private __createRenderPassDetectHighLuminance(
    texture: AbstractTexture,
    luminanceCriterion: number
  ) {
    const materialDetectHighLuminance = MaterialHelper.createDetectHighLuminanceMaterial(
      { maxInstancesNumber: 1 },
      texture
    );
    materialDetectHighLuminance.setParameter('luminanceCriterion', luminanceCriterion);
    // materialDetectHighLuminance.setParameter(
    //   DetectHighLuminanceMaterialContent.LuminanceReduce,
    //   luminanceReduce
    // );

    const renderPassDetectHighLuminance = RenderPassHelper.createScreenDrawRenderPass(
      materialDetectHighLuminance
    );
    renderPassDetectHighLuminance.tryToSetUniqueName('renderPassDetectHighLuminance', true);

    const key = `${texture.width}_${texture.height}`;
    let framebufferDetectHighLuminance = this.__mapDetectHighLuminanceFramebuffer.get(key);
    if (framebufferDetectHighLuminance == null) {
      framebufferDetectHighLuminance = RenderableHelper.createFrameBuffer({
        width: texture.width,
        height: texture.height,
        textureNum: 1,
        textureFormats: [TextureFormat.RGBA8],
        createDepthBuffer: false,
      });
      this.__mapDetectHighLuminanceFramebuffer.set(key, framebufferDetectHighLuminance);
    }

    renderPassDetectHighLuminance.setFramebuffer(framebufferDetectHighLuminance);
    return renderPassDetectHighLuminance;
  }

  private __createRenderPassesBlurredHighLuminance(
    renderPassHighLuminance: RenderPass,
    gaussianBlurLevelHighLuminance: number,
    gaussianKernelSize: number,
    gaussianVariance: number,
    maxResolutionWidth: number,
    maxResolutionHeight: number
  ) {
    const renderPasses: RenderPass[] = [];

    for (let i = 0; i < gaussianBlurLevelHighLuminance; i++) {
      const resolutionWidthBlur = Math.max(maxResolutionWidth >> (i + 1), 1);
      const resolutionHeightBlur = Math.max(maxResolutionHeight >> (i + 1), 1);

      let renderPassBlurH;
      if (i === 0) {
        renderPassBlurH = this.__createRenderPassGaussianBlur(
          renderPassHighLuminance,
          gaussianKernelSize,
          gaussianVariance,
          true,
          resolutionWidthBlur,
          resolutionHeightBlur
        );
      } else {
        renderPassBlurH = this.__createRenderPassGaussianBlur(
          renderPasses[renderPasses.length - 1],
          gaussianKernelSize,
          gaussianVariance,
          true,
          resolutionWidthBlur,
          resolutionHeightBlur
        );
      }
      renderPassBlurH.tryToSetUniqueName('renderPassBlurH_' + i, true);

      const renderPassBlurHV = this.__createRenderPassGaussianBlur(
        renderPassBlurH,
        gaussianKernelSize,
        gaussianVariance,
        false,
        resolutionWidthBlur,
        resolutionHeightBlur
      );
      renderPassBlurHV.tryToSetUniqueName('renderPassBlurHV_' + i, true);

      renderPasses.push(renderPassBlurH, renderPassBlurHV);
    }

    return renderPasses;
  }

  private __createRenderPassGaussianBlur(
    renderPassBlurTarget: RenderPass,
    gaussianKernelSize: number,
    gaussianVariance: number,
    isHorizontal: boolean,
    resolutionWidthBlur: number,
    resolutionHeightBlur: number
  ) {
    const material = MaterialHelper.createGaussianBlurMaterial();

    const gaussianDistributionRatio = MathUtil.computeGaussianDistributionRatioWhoseSumIsOne({
      kernelSize: gaussianKernelSize,
      variance: gaussianVariance,
    });
    material.setParameter('gaussianKernelSize', gaussianKernelSize);
    material.setParameter(
      'gaussianRatio',
      new VectorN(new Float32Array(gaussianDistributionRatio))
    );
    material.setParameter(
      'framebufferSize',
      Vector2.fromCopy2(resolutionWidthBlur, resolutionHeightBlur)
    );

    if (isHorizontal === false) {
      material.setParameter('isHorizontal', false);
    }

    const framebufferTarget = renderPassBlurTarget.getFramebuffer()!;
    const TextureTarget = framebufferTarget.colorAttachments[0] as RenderTargetTexture;
    const renderPass = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      material,
      TextureTarget
    );

    const key = `${resolutionWidthBlur}_${resolutionHeightBlur}_${isHorizontal}`;
    let framebuffer = this.__mapReducedFramebuffer.get(key);
    if (framebuffer == null) {
      framebuffer = RenderableHelper.createFrameBuffer({
        width: resolutionWidthBlur,
        height: resolutionHeightBlur,
        textureNum: 1,
        textureFormats: [TextureFormat.RGBA8],
        createDepthBuffer: false,
      });
      this.__mapReducedFramebuffer.set(key, framebuffer);
    }
    renderPass.setFramebuffer(framebuffer);

    return renderPass;
  }

  private __createRenderPassSynthesizeImage(
    texture: AbstractTexture,
    renderPassesBlurredHighLuminance: RenderPass[],
    synthesizeCoefficient: [number, number, number, number, number, number]
  ) {
    const texturesSynthesize = [texture] as AbstractTexture[]; // original texture
    for (let i = 1; i < renderPassesBlurredHighLuminance.length; i += 2) {
      texturesSynthesize.push(
        renderPassesBlurredHighLuminance[i].getFramebuffer()! // blurred textures
          .colorAttachments[0] as unknown as AbstractTexture
      );
    }

    const materialSynthesizeTextures = MaterialHelper.createSynthesizeHDRMaterial(
      {
        maxInstancesNumber: 1,
      },
      texturesSynthesize
    );
    materialSynthesizeTextures.setParameter('synthesizeCoefficient', synthesizeCoefficient);
    const renderPassSynthesizeGlare = RenderPassHelper.createScreenDrawRenderPass(
      materialSynthesizeTextures
    );
    renderPassSynthesizeGlare.tryToSetUniqueName('renderPassSynthesizeGlare', true);
    const key = `${texture.width}_${texture.height}`;
    let framebufferSynthesizeImages = this.__mapSynthesizeFramebuffer.get(key);
    if (framebufferSynthesizeImages == null) {
      framebufferSynthesizeImages = RenderableHelper.createFrameBuffer({
        width: texture.width,
        height: texture.height,
        textureNum: 1,
        textureFormats: [TextureFormat.R11F_G11F_B10F],
        createDepthBuffer: false,
      });
      this.__mapSynthesizeFramebuffer.set(key, framebufferSynthesizeImages);
    }
    renderPassSynthesizeGlare.setFramebuffer(framebufferSynthesizeImages);

    return renderPassSynthesizeGlare;
  }

  public destroy3DAPIResources() {
    this.__mapReducedFramebuffer.forEach((framebuffer) => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapDetectHighLuminanceFramebuffer.forEach((framebuffer) => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapSynthesizeFramebuffer.forEach((framebuffer) => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapReducedFramebuffer.clear();
    this.__mapDetectHighLuminanceFramebuffer.clear();
    this.__mapSynthesizeFramebuffer.clear();
  }
}
