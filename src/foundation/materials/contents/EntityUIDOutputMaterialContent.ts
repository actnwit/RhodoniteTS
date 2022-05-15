import {ShaderSemantics} from '../../definitions/ShaderSemantics';
import {AbstractMaterialContent} from '../core/AbstractMaterialContent';
import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import {Vector3} from '../../math/Vector3';
import {ShaderType} from '../../definitions/ShaderType';
import {Scalar} from '../../math/Scalar';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import {ComponentRepository} from '../../core/ComponentRepository';
import {CameraComponent} from '../../components/Camera/CameraComponent';
import {Material} from '../core/Material';
import {MutableMatrix44} from '../../math/MutableMatrix44';
import {MutableMatrix33} from '../../math/MutableMatrix33';
import entityUIDOutputSingleShaderVertex from '../../../webgl/shaderity_shaders/EntityUIDOutputSingleShader/EntityUIDOutputSingleShader.vert';
import entityUIDOutputSingleShaderFragment from '../../../webgl/shaderity_shaders/EntityUIDOutputSingleShader/EntityUIDOutputSingleShader.frag';
import {RenderingArg} from '../../../webgl/types/CommonTypes';
import {ShaderSemanticsInfo} from '../../definitions/ShaderSemanticsInfo';

export class EntityUIDOutputMaterialContent extends AbstractMaterialContent {
  constructor() {
    super(
      null,
      'entityUidOutputShading' +
        (true ? '+skinning' : '') +
        (false ? '' : '-lighting'),
      {isMorphing: false, isSkinning: true, isLighting: false},
      entityUIDOutputSingleShaderVertex,
      entityUIDOutputSingleShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.WorldMatrix,
        isComponentData: true,
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: MutableMatrix44.zero(),
      },
      {
        semantic: ShaderSemantics.NormalMatrix,
        isComponentData: true,
        compositionType: CompositionType.Mat3,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: MutableMatrix33.zero(),
      },
      // {semantic: ShaderSemantics.ViewMatrix, isComponentData: true, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isCustomSetting: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: MutableMatrix44.zero() },
      // {semantic: ShaderSemantics.ProjectionMatrix, isComponentData: true, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isCustomSetting: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: MutableMatrix44.zero() },
      // {
      //   semantic: ShaderSemantics.ViewPosition,
      //   compositionType: CompositionType.Vec3,
      //   componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader,
      //   min: -Number.MAX_VALUE,
      //   max: Number.MAX_VALUE,
      //   isCustomSetting: true,
      //   updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      //   initialValue: Vector3.fromCopyArray([0, 0, 0]),
      //   soloDatum: true
      // },
      {
        semantic: ShaderSemantics.PointSize,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: true,
        initialValue: Scalar.fromCopyNumber(30.0),
        min: 0,
        max: 100,
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
        min: 0,
        max: 1,
      },
    ];

    if (true) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

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

    /// Skinning
    const skeletalComponent = args.entity.tryToGetSkeletal();
    this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);

    // Lights
    this.setLightsInfo(
      shaderProgram,
      args.lightComponents,
      material,
      args.setUniform
    );
  }
}
