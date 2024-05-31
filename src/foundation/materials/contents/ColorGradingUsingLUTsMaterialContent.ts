import { AbstractTexture } from '../../textures/AbstractTexture';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { Count } from '../../../types/CommonTypes';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { ShaderType } from '../../definitions/ShaderType';
import { Texture } from '../../textures/Texture';
import { TextureParameter } from '../../definitions/TextureParameter';
import { RenderPass } from '../../renderer/RenderPass';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import ColorGradingUsingLUTsShaderVertex from '../../../webgl/shaderity_shaders/ColorGradingUsingLUTsShader/ColorGradingUsingLUTsShader.vert';
import ColorGradingUsingLUTsShaderFragment from '../../../webgl/shaderity_shaders/ColorGradingUsingLUTsShader/ColorGradingUsingLUTsShader.frag';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { Sampler } from '../../textures/Sampler';
import { dummyBlackTexture } from '../core/DummyTextures';

export class ColorGradingUsingLUTsMaterialContent extends AbstractMaterialContent {
  static lookupTableTexture = new ShaderSemanticsClass({
    str: 'lookupTableTexture',
  });

  constructor(
    targetRenderPass: RenderPass,
    colorAttachmentsNumber: Count,
    uri?: string,
    texture?: AbstractTexture
  ) {
    super(
      null,
      'colorGradingUsingLUTsShading',
      {},
      ColorGradingUsingLUTsShaderVertex,
      ColorGradingUsingLUTsShaderFragment
    );

    let targetTexture;
    const framebuffer = targetRenderPass.getFramebuffer();
    if (framebuffer != null && framebuffer.colorAttachments[colorAttachmentsNumber] != null) {
      targetTexture = framebuffer.colorAttachments[colorAttachmentsNumber];
    } else {
      targetTexture = dummyBlackTexture;
      if (framebuffer != null) {
        console.warn(
          'renderPass does not have framebuffer.colorAttachments[' + colorAttachmentsNumber + ']'
        );
      } else {
        console.warn('renderPass does not have framebuffer');
      }
    }

    let lookupTableTexture;
    if (typeof uri === 'string') {
      lookupTableTexture = new Texture();
      (async function (uri: string) {
        lookupTableTexture.generateTextureFromUri(uri, {
          type: ComponentType.UnsignedByte,
        });
        await lookupTableTexture.loadFromUrlLazy();
      })(uri);
    } else if (texture instanceof AbstractTexture) {
      lookupTableTexture = texture;
    } else {
      console.warn('no LUT texture is specified');
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
        semantic: ShaderSemantics.BaseColorTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [0, targetTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ColorGradingUsingLUTsMaterialContent.lookupTableTexture,
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

  _setInternalSettingParametersToGpuWebGL({
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
      cameraComponent = ComponentRepository.getComponent(
        CameraComponent,
        CameraComponent.current
      ) as CameraComponent;
    }
    if (cameraComponent) {
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
    }
  }
}
