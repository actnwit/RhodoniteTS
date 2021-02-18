import { ShaderSemanticsInfo, ShaderSemantics, } from '../../definitions/ShaderSemantics';
import AbstractMaterialNode from '../core/AbstractMaterialNode';
import { CompositionType } from '../../definitions/CompositionType';
import Vector2 from '../../math/Vector2';
import { ComponentType } from '../../definitions/ComponentType';
import { ShaderType } from '../../definitions/ShaderType';
import ComponentRepository from '../../core/ComponentRepository';
import CameraComponent from '../../components/CameraComponent';
import Material from '../core/Material';
import { ShaderVariableUpdateInterval } from '../../definitions/ShaderVariableUpdateInterval';
import shaderVertex from '../../../webgl/shaderity_shaders/FXAA3QualityShader/FXAA3QualitySingleShader.vert';
import shaderFragment from '../../../webgl/shaderity_shaders/FXAA3QualityShader/FXAA3QualitySingleShader.frag';

export default class FXAA3QualitySingleMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, "FXAA3QualityShading",
      { isMorphing: false, isSkinning: false, isLighting: false },
      shaderVertex, shaderFragment);

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.BaseColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
        stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, AbstractMaterialNode.__dummyWhiteTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.ScreenInfo, compositionType: CompositionType.Vec2, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Vector2(0, 0), min: 0, max: Number.MAX_SAFE_INTEGER,
      },
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }
    if (cameraComponent) {
      this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);
    }
  }
}
