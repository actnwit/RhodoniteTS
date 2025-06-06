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

/**
 * Material content class for rendering entity UID output.
 * This material is used to output unique identifiers for entities,
 * typically for picking or selection purposes.
 */
export class EntityUIDOutputMaterialContent extends AbstractMaterialContent {
  /**
   * Creates a new EntityUIDOutputMaterialContent instance.
   *
   * @param materialName - The name of the material
   */
  constructor(materialName: string) {
    super(
      materialName,
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

  /**
   * Sets internal parameters to GPU for WebGL rendering per material.
   * This method configures uniform variables and matrices required for entity UID output rendering.
   *
   * @param params - The rendering parameters
   * @param params.material - The material instance
   * @param params.shaderProgram - The WebGL shader program
   * @param params.firstTime - Whether this is the first time setting parameters
   * @param params.args - WebGL rendering arguments containing matrices, camera, and entity information
   */
  _setInternalSettingParametersToGpuWebGLPerMaterial({
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
        cameraComponent = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as CameraComponent;
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
