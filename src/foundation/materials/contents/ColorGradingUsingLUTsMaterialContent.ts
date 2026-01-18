import type { Count } from '../../../types/CommonTypes';
import ColorGradingUsingLUTsShaderFragment from '../../../webgl/shaderity_shaders/ColorGradingUsingLUTsShader/ColorGradingUsingLUTsShader.frag';
import ColorGradingUsingLUTsShaderVertex from '../../../webgl/shaderity_shaders/ColorGradingUsingLUTsShader/ColorGradingUsingLUTsShader.vert';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { TextureParameter } from '../../definitions/TextureParameter';
import { Logger } from '../../misc/Logger';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { IRenderable } from '../../textures';
import { AbstractTexture } from '../../textures/AbstractTexture';
import { Sampler } from '../../textures/Sampler';
import { Texture } from '../../textures/Texture';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';

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
    engine: Engine,
    materialName: string,
    targetRenderPass: RenderPass,
    colorAttachmentsNumber: Count,
    uri?: string,
    texture?: AbstractTexture
  ) {
    super(materialName, {}, ColorGradingUsingLUTsShaderVertex, ColorGradingUsingLUTsShaderFragment, engine);

    let targetTexture: IRenderable | Texture;
    const framebuffer = targetRenderPass.getFramebuffer();
    if (framebuffer != null && framebuffer.colorAttachments[colorAttachmentsNumber] != null) {
      targetTexture = framebuffer.colorAttachments[colorAttachmentsNumber];
    } else {
      targetTexture = engine.dummyTextures.dummyBlackTexture!;
      if (framebuffer != null) {
        Logger.default.warn(`renderPass does not have framebuffer.colorAttachments[${colorAttachmentsNumber}]`);
      } else {
        Logger.default.warn('renderPass does not have framebuffer');
      }
    }

    let lookupTableTexture: any;
    if (typeof uri === 'string') {
      lookupTableTexture = new Texture(engine);
      (async (uri: string) => {
        await lookupTableTexture.generateTextureFromUrl(uri, {
          type: ComponentType.UnsignedByte,
        });
      })(uri);
    } else if (texture instanceof AbstractTexture) {
      lookupTableTexture = texture;
    } else {
      Logger.default.warn('no LUT texture is specified');
      lookupTableTexture = engine.dummyTextures.dummyBlackTexture!;
    }

    const sampler = new Sampler(engine, {
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
        initialValue: [1, targetTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'lookupTableTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [2, lookupTableTexture, sampler],
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
    engine,
    shaderProgram,
    args,
  }: {
    engine: Engine;
    shaderProgram: WebGLProgram;
    args: RenderingArgWebGL;
  }) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(engine)
      ) as CameraComponent;
    }
    if (cameraComponent) {
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
    }
  }
}
