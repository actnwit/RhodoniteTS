import { AbstractTexture } from '../../textures/AbstractTexture';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import type { Count } from '../../../types/CommonTypes';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { ShaderType } from '../../definitions/ShaderType';
import { Texture } from '../../textures/Texture';
import { TextureParameter } from '../../definitions/TextureParameter';
import type { RenderPass } from '../../renderer/RenderPass';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
import ColorGradingUsingLUTsShaderVertex from '../../../webgl/shaderity_shaders/ColorGradingUsingLUTsShader/ColorGradingUsingLUTsShader.vert';
import ColorGradingUsingLUTsShaderFragment from '../../../webgl/shaderity_shaders/ColorGradingUsingLUTsShader/ColorGradingUsingLUTsShader.frag';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { Sampler } from '../../textures/Sampler';
import { dummyBlackTexture } from '../core/DummyTextures';
import { Logger } from '../../misc/Logger';

/**
 * Material content for color grading using Look-Up Tables (LUTs).
 * This material applies color correction and grading effects to rendered images
 * using a pre-computed lookup table texture.
 */
export class ColorGradingUsingLUTsMaterialContent extends AbstractMaterialContent {
  /**
   * Shader semantic for the lookup table texture.
   * This defines the binding point for the LUT texture in the shader.
   */
  static lookupTableTexture = new ShaderSemanticsClass({
    str: 'lookupTableTexture',
  });

  /**
   * Creates a new ColorGradingUsingLUTsMaterialContent instance.
   *
   * @param materialName - The name identifier for this material
   * @param targetRenderPass - The render pass to read the source texture from
   * @param colorAttachmentsNumber - The index of the color attachment to use as source
   * @param uri - Optional URL to load the LUT texture from
   * @param texture - Optional pre-existing texture to use as LUT
   *
   * @remarks
   * Either `uri` or `texture` should be provided to specify the lookup table.
   * If neither is provided, a dummy black texture will be used and a warning logged.
   */
  constructor(
    materialName: string,
    targetRenderPass: RenderPass,
    colorAttachmentsNumber: Count,
    uri?: string,
    texture?: AbstractTexture
  ) {
    super(materialName, {}, ColorGradingUsingLUTsShaderVertex, ColorGradingUsingLUTsShaderFragment);

    let targetTexture;
    const framebuffer = targetRenderPass.getFramebuffer();
    if (framebuffer != null && framebuffer.colorAttachments[colorAttachmentsNumber] != null) {
      targetTexture = framebuffer.colorAttachments[colorAttachmentsNumber];
    } else {
      targetTexture = dummyBlackTexture;
      if (framebuffer != null) {
        Logger.warn('renderPass does not have framebuffer.colorAttachments[' + colorAttachmentsNumber + ']');
      } else {
        Logger.warn('renderPass does not have framebuffer');
      }
    }

    let lookupTableTexture;
    if (typeof uri === 'string') {
      lookupTableTexture = new Texture();
      (async (uri: string) => {
        await lookupTableTexture.generateTextureFromUrl(uri, {
          type: ComponentType.UnsignedByte,
        });
      })(uri);
    } else if (texture instanceof AbstractTexture) {
      lookupTableTexture = texture;
    } else {
      Logger.warn('no LUT texture is specified');
      lookupTableTexture = dummyBlackTexture;
    }

    const sampler = new Sampler({
      minFilter: TextureParameter.Nearest,
      magFilter: TextureParameter.Nearest,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      anisotropy: false,
    });
    sampler.create();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: 'baseColorTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [0, targetTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'lookupTableTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [1, lookupTableTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  /**
   * Sets internal GPU parameters for WebGL rendering per material.
   * This method configures world matrices, view information, and projection matrices
   * required for the color grading shader to render correctly.
   *
   * @param params - The rendering parameters object
   * @param params.material - The material instance being rendered
   * @param params.shaderProgram - The WebGL shader program to configure
   * @param params.firstTime - Whether this is the first time setting up this material
   * @param params.args - WebGL rendering arguments containing matrices and render state
   *
   * @internal
   * This method is called internally during the rendering pipeline.
   */
  _setInternalSettingParametersToGpuWebGLPerMaterial({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as CameraComponent;
    }
    if (cameraComponent) {
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
    }
  }
}
