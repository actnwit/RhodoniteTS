import {
  ShaderSemantics,
  ShaderSemanticsEnum,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { ShaderType } from '../../definitions/ShaderType';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Scalar } from '../../math/Scalar';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import DetectHighLuminanceAndCorrectShaderVertex from '../../../webgl/shaderity_shaders/DetectHighLuminanceAndCorrectShader/DetectHighLuminanceAndCorrectShader.vert';
import DetectHighLuminanceAndCorrectShaderFragment from '../../../webgl/shaderity_shaders/DetectHighLuminanceAndCorrectShader/DetectHighLuminanceAndCorrectShader.frag';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { AbstractTexture } from '../../textures';

export class DetectHighLuminanceMaterialContent extends AbstractMaterialContent {
  static LuminanceCriterion: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'luminanceCriterion',
  });
  static LuminanceReduce: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'luminanceReduce',
  });

  constructor(textureToDetectHighLuminance: AbstractTexture) {
    super(
      null,
      'HighLuminanceDetectShading',
      {},
      DetectHighLuminanceAndCorrectShaderVertex,
      DetectHighLuminanceAndCorrectShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: DetectHighLuminanceMaterialContent.LuminanceCriterion,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(2),
        min: 0,
        max: Number.MAX_VALUE,
      },
      {
        semantic: DetectHighLuminanceMaterialContent.LuminanceReduce,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0.25),
        min: 0,
        max: 1,
      },
      {
        semantic: ShaderSemantics.BaseColorTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [0, textureToDetectHighLuminance],
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
