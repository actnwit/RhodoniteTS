import { TextureFormat } from '../definitions/TextureFormat';
import type { Material } from '../materials/core/Material';
import { MathUtil } from '../math/MathUtil';
import { Vector2 } from '../math/Vector2';
import { VectorN } from '../math/VectorN';
import { Expression } from '../renderer/Expression';
import type { FrameBuffer } from '../renderer/FrameBuffer';
import type { RenderPass } from '../renderer/RenderPass';
import type { AbstractTexture } from '../textures/AbstractTexture';
import type { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { MaterialHelper } from './MaterialHelper';
import { RenderPassHelper } from './RenderPassHelper';
import { RenderableHelper } from './RenderableHelper';

export class Bloom {
  private __mapDetectHighLuminanceMaterial: Map<string, Material> = new Map();
  private __mapGaussianBlurMaterial: Map<string, Material> = new Map();
  private __mapSynthesizeMaterial: Map<string, Material> = new Map();
  private __mapReducedFramebuffer: Map<string, FrameBuffer> = new Map();
  private __mapDetectHighLuminanceFramebuffer: Map<string, FrameBuffer> = new Map();
  private __mapSynthesizeFramebuffer: Map<string, FrameBuffer> = new Map();

  /**
   * Creates a complete bloom effect expression with all required render passes.
   *
   * The bloom effect consists of three main stages:
   * 1. Detect high luminance areas in the input texture
   * 2. Apply multiple levels of Gaussian blur to create a glow effect
   * 3. Synthesize the original texture with the blurred high luminance areas
   *
   * @param params - Configuration object for the bloom effect
   * @param params.textureToBloom - The source texture to apply bloom effect to
   * @param params.parameters - Bloom effect parameters
   * @param params.parameters.luminanceCriterion - Threshold for detecting high luminance areas (default: 1.0)
   * @param params.parameters.gaussianBlurLevelHighLuminance - Number of blur levels to apply (default: 4)
   * @param params.parameters.gaussianKernelSize - Size of the Gaussian blur kernel (default: 10)
   * @param params.parameters.gaussianVariance - Variance of the Gaussian distribution (default: 10)
   * @param params.parameters.synthesizeCoefficient - Blend coefficients for combining blur levels (default: computed array)
   * @returns Object containing the bloom expression and the final render target texture
   */
  public createBloomExpression({
    textureToBloom,
    parameters: {
      luminanceCriterion = 1.0,
      gaussianBlurLevelHighLuminance = 4,
      gaussianKernelSize = 10,
      gaussianVariance = 10,
      synthesizeCoefficient = [
        1.0,
        1.0 / gaussianBlurLevelHighLuminance,
        1.0 / gaussianBlurLevelHighLuminance,
        1.0 / gaussianBlurLevelHighLuminance,
        1.0 / gaussianBlurLevelHighLuminance,
        1.0 / gaussianBlurLevelHighLuminance,
      ],
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
      bloomedRenderTarget: renderPassSynthesizeImage.getFramebuffer()!.colorAttachments[0] as RenderTargetTexture,
    };
  }

  /**
   * Creates a render pass that detects high luminance areas in the input texture.
   *
   * This is the first stage of the bloom effect where pixels with luminance above
   * the specified criterion are extracted for further processing.
   *
   * @param texture - The input texture to analyze for high luminance areas
   * @param luminanceCriterion - The threshold value for detecting high luminance pixels
   * @returns A render pass configured to detect high luminance areas
   * @private
   */
  private __createRenderPassDetectHighLuminance(texture: AbstractTexture, luminanceCriterion: number) {
    const materialKey = `${texture.width}_${texture.height}`;
    let materialDetectHighLuminance = this.__mapDetectHighLuminanceMaterial.get(materialKey);
    if (materialDetectHighLuminance == null) {
      materialDetectHighLuminance = MaterialHelper.createDetectHighLuminanceMaterial(
        { maxInstancesNumber: 1 },
        texture
      );
      this.__mapDetectHighLuminanceMaterial.set(materialKey, materialDetectHighLuminance);
    } else {
      materialDetectHighLuminance.setTextureParameter('baseColorTexture', texture);
    }
    materialDetectHighLuminance.setParameter('luminanceCriterion', luminanceCriterion);
    // materialDetectHighLuminance.setParameter(
    //   DetectHighLuminanceMaterialContent.LuminanceReduce,
    //   luminanceReduce
    // );

    const renderPassDetectHighLuminance = RenderPassHelper.createScreenDrawRenderPass(materialDetectHighLuminance);
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

  /**
   * Creates multiple render passes for applying Gaussian blur to high luminance areas.
   *
   * This method generates a series of blur passes with progressively reduced resolution
   * to create a multi-level bloom effect. Each level applies horizontal and vertical
   * blur passes to achieve a 2D Gaussian blur.
   *
   * @param renderPassHighLuminance - The render pass containing high luminance detection results
   * @param gaussianBlurLevelHighLuminance - Number of blur levels to generate
   * @param gaussianKernelSize - Size of the Gaussian blur kernel
   * @param gaussianVariance - Variance parameter for the Gaussian distribution
   * @param maxResolutionWidth - Maximum width for blur calculations
   * @param maxResolutionHeight - Maximum height for blur calculations
   * @returns Array of render passes for multi-level Gaussian blur
   * @private
   */
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

      let renderPassBlurH: RenderPass;
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
      renderPassBlurH.tryToSetUniqueName(`renderPassBlurH_${i}`, true);

      const renderPassBlurHV = this.__createRenderPassGaussianBlur(
        renderPassBlurH,
        gaussianKernelSize,
        gaussianVariance,
        false,
        resolutionWidthBlur,
        resolutionHeightBlur
      );
      renderPassBlurHV.tryToSetUniqueName(`renderPassBlurHV_${i}`, true);

      renderPasses.push(renderPassBlurH, renderPassBlurHV);
    }

    return renderPasses;
  }

  /**
   * Creates a single Gaussian blur render pass.
   *
   * This method creates either a horizontal or vertical blur pass using a Gaussian
   * kernel. Two passes (horizontal + vertical) are typically combined to achieve
   * a full 2D Gaussian blur effect.
   *
   * @param renderPassBlurTarget - The source render pass to blur
   * @param gaussianKernelSize - Size of the Gaussian blur kernel
   * @param gaussianVariance - Variance parameter for the Gaussian distribution
   * @param isHorizontal - Whether this is a horizontal (true) or vertical (false) blur pass
   * @param resolutionWidthBlur - Width of the blur render target
   * @param resolutionHeightBlur - Height of the blur render target
   * @returns A configured Gaussian blur render pass
   * @private
   */
  private __createRenderPassGaussianBlur(
    renderPassBlurTarget: RenderPass,
    gaussianKernelSize: number,
    gaussianVariance: number,
    isHorizontal: boolean,
    resolutionWidthBlur: number,
    resolutionHeightBlur: number
  ) {
    const materialKey = `${resolutionWidthBlur}_${resolutionHeightBlur}_${isHorizontal}`;
    let material = this.__mapGaussianBlurMaterial.get(materialKey);
    if (material == null) {
      material = MaterialHelper.createGaussianBlurMaterial();
      this.__mapGaussianBlurMaterial.set(materialKey, material);
    }

    const gaussianDistributionRatio = MathUtil.computeGaussianDistributionRatioWhoseSumIsOne({
      kernelSize: gaussianKernelSize,
      variance: gaussianVariance,
    });
    material.setParameter('gaussianKernelSize', gaussianKernelSize);
    material.setParameter('gaussianRatio', new VectorN(new Float32Array(gaussianDistributionRatio)));
    material.setParameter('framebufferSize', Vector2.fromCopy2(resolutionWidthBlur, resolutionHeightBlur));

    if (isHorizontal === false) {
      material.setParameter('isHorizontal', false);
    }

    const framebufferTarget = renderPassBlurTarget.getFramebuffer()!;
    const TextureTarget = framebufferTarget.colorAttachments[0] as RenderTargetTexture;
    const renderPass = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(material, TextureTarget);

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

  /**
   * Creates a render pass that synthesizes the original texture with blurred high luminance areas.
   *
   * This is the final stage of the bloom effect where the original image is combined
   * with multiple levels of blurred high luminance areas using specified blend coefficients.
   * The result is a bloomed image with HDR-like glow effects.
   *
   * @param texture - The original input texture
   * @param renderPassesBlurredHighLuminance - Array of render passes containing blurred luminance data
   * @param synthesizeCoefficient - Blend coefficients for combining different blur levels
   * @returns A render pass that produces the final bloomed image
   * @private
   */
  private __createRenderPassSynthesizeImage(
    texture: AbstractTexture,
    renderPassesBlurredHighLuminance: RenderPass[],
    synthesizeCoefficient: [number, number, number, number, number, number]
  ) {
    const texturesSynthesize = [texture] as AbstractTexture[]; // original texture
    for (let i = 1; i < renderPassesBlurredHighLuminance.length; i += 2) {
      texturesSynthesize.push(
        renderPassesBlurredHighLuminance[i].getFramebuffer()!.colorAttachments[0] as unknown as AbstractTexture // blurred textures
      );
    }

    const materialKey = `${texture.width}_${texture.height}_${texturesSynthesize.length}`;
    let materialSynthesizeTextures = this.__mapSynthesizeMaterial.get(materialKey);
    if (materialSynthesizeTextures == null) {
      materialSynthesizeTextures = MaterialHelper.createSynthesizeHDRMaterial(
        {
          maxInstancesNumber: 1,
        },
        texturesSynthesize
      );
      this.__mapSynthesizeMaterial.set(materialKey, materialSynthesizeTextures);
    } else {
      // Update textures in case the input render targets were recreated
      texturesSynthesize.forEach((tex, idx) => {
        materialSynthesizeTextures!.setTextureParameter(`synthesizeTexture${idx}` as any, tex);
      });
    }
    materialSynthesizeTextures.setParameter('synthesizeCoefficient', synthesizeCoefficient);
    const renderPassSynthesizeGlare = RenderPassHelper.createScreenDrawRenderPass(materialSynthesizeTextures);
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

  /**
   * Destroys all 3D API resources used by this Bloom instance.
   *
   * This method cleans up all cached framebuffers and their associated GPU resources.
   * It should be called when the Bloom instance is no longer needed to prevent
   * memory leaks and properly release graphics resources.
   *
   * @public
   */
  public destroy3DAPIResources() {
    this.__mapReducedFramebuffer.forEach(framebuffer => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapDetectHighLuminanceFramebuffer.forEach(framebuffer => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapSynthesizeFramebuffer.forEach(framebuffer => {
      framebuffer.destroy3DAPIResources();
    });
    this.__mapReducedFramebuffer.clear();
    this.__mapDetectHighLuminanceFramebuffer.clear();
    this.__mapSynthesizeFramebuffer.clear();
  }
}
