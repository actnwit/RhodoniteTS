import {
  ShaderSemanticsInfo,
  ShaderSemantics,
} from '../../definitions/ShaderSemantics';
import { AbstractMaterialNode } from '../core/AbstractMaterialNode';
import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import {ShaderType} from '../../definitions/ShaderType';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Material } from '../core/Material';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import GammaCorrectionShaderVertex from '../../../webgl/shaderity_shaders/GammaCorrectionShader/GammaCorrectionShader.vert';
import GammaCorrectionShaderFragment from '../../../webgl/shaderity_shaders/GammaCorrectionShader/GammaCorrectionShader.frag';
import { RenderingArg } from '../../../webgl/types/CommonTypes';

export class GammaCorrectionSingleMaterialNode extends AbstractMaterialNode {
  constructor() {
    super(
      null,
      'GammaCorrection',
      {},
      GammaCorrectionShaderVertex,
      GammaCorrectionShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.BaseColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, AbstractMaterialNode.__dummyWhiteTexture],
        min: 0,
        max: 10,
      },
    ];
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
