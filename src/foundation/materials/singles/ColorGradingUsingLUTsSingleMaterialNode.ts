import { AbstractTexture } from '../../textures/AbstractTexture';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import {CompositionType} from '../../definitions/CompositionType';
import { ComponentRepository } from '../../core/ComponentRepository';
import {ComponentType} from '../../definitions/ComponentType';
import {Count} from '../../../types/CommonTypes';
import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import {ShaderType} from '../../definitions/ShaderType';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import { Texture } from '../../textures/Texture';
import {TextureParameter} from '../../definitions/TextureParameter';
import { RenderPass } from '../../renderer/RenderPass';
import { AbstractMaterialNode } from '../core/AbstractMaterialNode';
import { Material } from '../core/Material';
import ColorGradingUsingLUTsShaderVertex from '../../../webgl/shaderity_shaders/ColorGradingUsingLUTsShader/ColorGradingUsingLUTsShader.vert';
import ColorGradingUsingLUTsShaderFragment from '../../../webgl/shaderity_shaders/ColorGradingUsingLUTsShader/ColorGradingUsingLUTsShader.frag';
import { RenderingArg } from '../../../webgl/types/CommonTypes';

export class ColorGradingUsingLUTsSingleMaterialNode extends AbstractMaterialNode {
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
    if (
      framebuffer != null &&
      framebuffer.colorAttachments[colorAttachmentsNumber] != null
    ) {
      targetTexture = framebuffer.colorAttachments[colorAttachmentsNumber];
    } else {
      targetTexture = AbstractMaterialNode.__dummyBlackTexture;
      if (framebuffer != null) {
        console.warn(
          'renderPass does not have framebuffer.colorAttachments[' +
            colorAttachmentsNumber +
            ']'
        );
      } else {
        console.warn('renderPass does not have framebuffer');
      }
    }

    let lookupTableTexture;
    if (typeof uri === 'string') {
      lookupTableTexture = new Texture();
      (async function (uri: string) {
        await lookupTableTexture.generateTextureFromUri(uri, {
          minFilter: TextureParameter.Nearest,
          magFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.ClampToEdge,
          wrapT: TextureParameter.ClampToEdge,
          type: ComponentType.UnsignedByte,
          anisotropy: false,
        });
      })(uri);
    } else if (texture instanceof AbstractTexture) {
      lookupTableTexture = texture;
    } else {
      console.warn('no LUT texture is specified');
      lookupTableTexture = AbstractMaterialNode.__dummyBlackTexture;
    }

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.BaseColorTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, targetTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ColorGradingUsingLUTsSingleMaterialNode.lookupTableTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [1, lookupTableTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArg;
  }) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(
        CameraComponent,
        CameraComponent.main
      ) as CameraComponent;
    }
    if (cameraComponent) {
      this.setViewInfo(
        shaderProgram,
        cameraComponent,
        args.isVr,
        args.displayIdx
      );
      this.setProjection(
        shaderProgram,
        cameraComponent,
        args.isVr,
        args.displayIdx
      );
    }
  }
}
