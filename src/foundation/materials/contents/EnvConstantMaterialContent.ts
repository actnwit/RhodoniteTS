import {
  ShaderSemantics,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import {AbstractMaterialContent} from '../core/AbstractMaterialContent';
import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import {Vector4} from '../../math/Vector4';
import {ShaderType} from '../../definitions/ShaderType';
import {Scalar} from '../../math/Scalar';
import {ComponentRepository} from '../../core/ComponentRepository';
import {CameraComponent} from '../../components/Camera/CameraComponent';
import {Material} from '../core/Material';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import EnvConstantSingleShaderVertex from '../../../webgl/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.vert';
import EnvConstantSingleShaderFragment from '../../../webgl/shaderity_shaders/EnvConstantSingleShader/EnvConstantSingleShader.frag';
import {RenderingArg} from '../../../webgl/types/CommonTypes';
import {ShaderSemanticsInfo} from '../../definitions/ShaderSemanticsInfo';

export class EnvConstantMaterialContent extends AbstractMaterialContent {
  static envRotation = new ShaderSemanticsClass({str: 'envRotation'});
  static EnvHdriFormat = new ShaderSemanticsClass({str: 'EnvHdriFormat'});

  constructor() {
    super(
      null,
      'envConstantShading',
      {},
      EnvConstantSingleShaderVertex,
      EnvConstantSingleShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: EnvConstantMaterialContent.EnvHdriFormat,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 5,
      },
      {
        semantic: EnvConstantMaterialContent.envRotation,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0),
        min: -Math.PI,
        max: Math.PI,
      },
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
        min: 0,
        max: 2,
      },
      {
        semantic: ShaderSemantics.ColorEnvTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.TextureCube,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, AbstractMaterialContent.__dummyBlackCubeTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.MakeOutputSrgb,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(1),
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
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
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
