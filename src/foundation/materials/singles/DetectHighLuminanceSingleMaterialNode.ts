import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsEnum,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import {ShaderType} from '../../definitions/ShaderType';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Scalar } from '../../math/Scalar';
import { RenderPass } from '../../renderer/RenderPass';
import {Count} from '../../../types/CommonTypes';
import { AbstractMaterialNode } from '../core/AbstractMaterialNode';
import { Material } from '../core/Material';
import DetectHighLuminanceAndCorrectShaderVertex from '../../../webgl/shaderity_shaders/DetectHighLuminanceAndCorrectShader/DetectHighLuminanceAndCorrectShader.vert';
import DetectHighLuminanceAndCorrectShaderFragment from '../../../webgl/shaderity_shaders/DetectHighLuminanceAndCorrectShader/DetectHighLuminanceAndCorrectShader.frag';
import { RenderingArg } from '../../../webgl/types/CommonTypes';

export class DetectHighLuminanceSingleMaterialNode extends AbstractMaterialNode {
  static LuminanceCriterion: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'luminanceCriterion',
  });
  static LuminanceReduce: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'luminanceReduce',
  });
  static FramebufferWidth: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'framebufferWidth',
  });

  constructor(HDRRenderPass: RenderPass, colorAttachmentsNumber: Count) {
    super(
      null,
      'HighLuminanceDetectShading',
      {},
      DetectHighLuminanceAndCorrectShaderVertex,
      DetectHighLuminanceAndCorrectShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: DetectHighLuminanceSingleMaterialNode.LuminanceCriterion,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(2),
        min: 0,
        max: Number.MAX_VALUE,
      },
      {
        semantic: DetectHighLuminanceSingleMaterialNode.LuminanceReduce,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0.25),
        min: 0,
        max: 1,
      },
    ];

    let targetTexture;
    let framebufferWidth;

    const framebuffer = HDRRenderPass.getFramebuffer();
    if (
      framebuffer != null &&
      framebuffer.colorAttachments[colorAttachmentsNumber] != null
    ) {
      targetTexture = framebuffer.colorAttachments[colorAttachmentsNumber];
      framebufferWidth = framebuffer.width;
    } else {
      targetTexture = AbstractMaterialNode.__dummyBlackTexture;
      framebufferWidth = 1;

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

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.FramebufferWidth,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(framebufferWidth),
        min: 0,
        max: Number.MAX_VALUE,
      },
      {
        semantic: ShaderSemantics.BaseColorTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, targetTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      }
    );

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setCustomSettingParametersToGpu({
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
