import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { Vector3 } from '../../math/Vector3';
import { ShaderType } from '../../definitions/ShaderType';
import { Scalar } from '../../math/Scalar';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Material } from '../core/Material';
import entityUIDOutputSingleShaderVertex from '../../../webgl/shaderity_shaders/EntityUIDOutputSingleShader/EntityUIDOutputSingleShader.vert';
import entityUIDOutputSingleShaderFragment from '../../../webgl/shaderity_shaders/EntityUIDOutputSingleShader/EntityUIDOutputSingleShader.frag';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';

export class EntityUIDOutputMaterialContent extends AbstractMaterialContent {
  constructor() {
    super(
      null,
      'entityUidOutputShading' + (true ? '+skinning' : '') + (false ? '' : '-lighting'),
      { isMorphing: false, isSkinning: true, isLighting: false },
      entityUIDOutputSingleShaderVertex,
      entityUIDOutputSingleShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      // {semantic: ShaderSemantics.ViewMatrix, isComponentData: true, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isInternalSetting: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: MutableMatrix44.zero() },
      // {semantic: ShaderSemantics.ProjectionMatrix, isComponentData: true, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isInternalSetting: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: MutableMatrix44.zero() },
      // {
      //   semantic: ShaderSemantics.ViewPosition,
      //   compositionType: CompositionType.Vec3,
      //   componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader,
      //   min: -Number.MAX_VALUE,
      //   max: Number.MAX_VALUE,
      //   isInternalSetting: true,
      //   updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      //   initialValue: Vector3.fromCopyArray([0, 0, 0]),
      //   soloDatum: true
      // },
      {
        semantic: 'pointSize',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader,
        soloDatum: true,
        initialValue: Scalar.fromCopyNumber(30.0),
        min: 0,
        max: 100,
      },
      {
        semantic: 'pointDistanceAttenuation',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
        min: 0,
        max: 1,
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
      this.setNormalMatrix(shaderProgram, args.normalMatrix);

      /// Matrices
      let cameraComponent = args.renderPass.cameraComponent;
      if (cameraComponent == null) {
        cameraComponent = ComponentRepository.getComponent(
          CameraComponent,
          CameraComponent.current
        ) as CameraComponent;
      }
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);

      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);

      // Lights
      this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
    }
  }
}
