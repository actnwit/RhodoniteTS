import { TextureFormat } from '../definitions';
import { MathUtil } from '../math/MathUtil';
import { Vector2 } from '../math/Vector2';
import { VectorN } from '../math/VectorN';
import { Expression } from '../renderer/Expression';
import { RenderPass } from '../renderer/RenderPass';
import { AbstractTexture } from '../textures/AbstractTexture';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { MaterialHelper } from './MaterialHelper';
import { RenderableHelper } from './RenderableHelper';
import { RenderPassHelper } from './RenderPassHelper';

function createGaussianBlurExpression({
  textureToBlur,
  parameters: {
    blurPassLevel = 4,
    gaussianKernelSize = 10,
    gaussianVariance = 10,
    synthesizeCoefficient = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  },
}: {
  textureToBlur: AbstractTexture;
  parameters: {
    blurPassLevel?: number;
    gaussianKernelSize?: number;
    gaussianVariance?: number;
    synthesizeCoefficient?: [number, number, number, number, number, number];
  };
}) {
  const renderPassesBlurred = createBlurPasses(
    textureToBlur,
    blurPassLevel,
    gaussianKernelSize,
    gaussianVariance,
    textureToBlur.width,
    textureToBlur.height
  );

  // Setup SynthesizeMaterial
  const renderPassSynthesizeImage = createRenderPassSynthesizeImage(
    textureToBlur,
    renderPassesBlurred,
    synthesizeCoefficient
  );

  // Setup Expression
  const expression = new Expression();
  expression.addRenderPasses([...renderPassesBlurred, renderPassSynthesizeImage]);

  return {
    blurExpression: expression,
    blurredRenderTarget: renderPassSynthesizeImage.getFramebuffer()!
      .colorAttachments[0] as RenderTargetTexture,
  };
}

function createBlurPasses(
  frameBufferToBlur: AbstractTexture,
  blurPassLevel: number,
  gaussianKernelSize: number,
  gaussianVariance: number,
  maxResolutionWidth: number,
  maxResolutionHeight: number
) {
  const renderPasses: RenderPass[] = [];

  for (let i = 0; i < blurPassLevel; i++) {
    const resolutionWidthBlur = Math.max(maxResolutionWidth >> (i + 1), 1);
    const resolutionHeightBlur = Math.max(maxResolutionHeight >> (i + 1), 1);

    let renderPassBlurH;
    if (i === 0) {
      renderPassBlurH = createRenderPassGaussianBlur(
        frameBufferToBlur,
        gaussianKernelSize,
        gaussianVariance,
        true,
        resolutionWidthBlur,
        resolutionHeightBlur
      );
    } else {
      renderPassBlurH = createRenderPassGaussianBlur(
        renderPasses[renderPasses.length - 1]
          .getFramebuffer()!
          .getColorAttachedRenderTargetTexture(0)!,
        gaussianKernelSize,
        gaussianVariance,
        true,
        resolutionWidthBlur,
        resolutionHeightBlur
      );
    }
    renderPassBlurH.tryToSetUniqueName('renderPassBlurH_' + i, true);

    const renderPassBlurHV = createRenderPassGaussianBlur(
      renderPassBlurH.getFramebuffer()!.getColorAttachedRenderTargetTexture(0)!,
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

function createRenderPassGaussianBlur(
  textureToBlur: AbstractTexture,
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
  material.setParameter('gaussianRatio', new VectorN(new Float32Array(gaussianDistributionRatio)));
  material.setParameter(
    'framebufferSize',
    Vector2.fromCopy2(resolutionWidthBlur, resolutionHeightBlur)
  );

  if (isHorizontal === false) {
    material.setParameter('isHorizontal', false);
  }

  const renderPass = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
    material,
    textureToBlur
  );

  const framebuffer = RenderableHelper.createFrameBuffer({
    width: resolutionWidthBlur,
    height: resolutionHeightBlur,
    textureNum: 1,
    textureFormats: [TextureFormat.RGBA16F],
    createDepthBuffer: false,
  });
  renderPass.setFramebuffer(framebuffer);

  return renderPass;
}

function createRenderPassSynthesizeImage(
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
  const renderPassSynthesizeBlur = RenderPassHelper.createScreenDrawRenderPass(
    materialSynthesizeTextures
  );
  renderPassSynthesizeBlur.tryToSetUniqueName('renderPassSynthesizeBlur', true);
  const framebufferSynthesizeImages = RenderableHelper.createFrameBuffer({
    width: texture.width,
    height: texture.height,
    textureNum: 1,
    textureFormats: [TextureFormat.RGBA16F],
    createDepthBuffer: false,
  });
  renderPassSynthesizeBlur.setFramebuffer(framebufferSynthesizeImages);

  return renderPassSynthesizeBlur;
}

export const GaussianBlurHelper = Object.freeze({
  createGaussianBlurExpression,
});
