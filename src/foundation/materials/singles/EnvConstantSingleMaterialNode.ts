import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import AbstractMaterialNode from '../core/AbstractMaterialNode';
import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import Vector4 from '../../math/Vector4';
import EnvConstantShader from '../../../webgl/shaders/EnvConstantShader';
import {ShaderType} from '../../definitions/ShaderType';
import Scalar from '../../math/Scalar';
import ComponentRepository from '../../core/ComponentRepository';
import CameraComponent from '../../components/CameraComponent';
import Material from '../core/Material';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';

export default class EnvConstantSingleMaterialNode extends AbstractMaterialNode {
  static envRotation = new ShaderSemanticsClass({str: 'envRotation'});
  static EnvHdriFormat = new ShaderSemanticsClass({str: 'EnvHdriFormat'});

  constructor() {
    super(EnvConstantShader.getInstance(), 'envConstantShading');

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: EnvConstantSingleMaterialNode.EnvHdriFormat,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: new Scalar(0),
        min: 0,
        max: 5,
      },
      {
        semantic: EnvConstantSingleMaterialNode.envRotation,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: new Scalar(0),
        min: -Math.PI,
        max: Math.PI,
      },
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: new Vector4(1, 1, 1, 1),
        min: 0,
        max: 2,
      },
      {
        semantic: ShaderSemantics.ColorEnvTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.TextureCube,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, AbstractMaterialNode.__dummyBlackCubeTexture],
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
    args?: any;
  }) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(
        CameraComponent,
        CameraComponent.main
      ) as CameraComponent;
    }
    if (cameraComponent) {
      this.setViewInfo(
        shaderProgram,
        cameraComponent,
        material,
        args.setUniform
      );
      this.setProjection(
        shaderProgram,
        cameraComponent,
        material,
        args.setUniform
      );
    }
  }
}
