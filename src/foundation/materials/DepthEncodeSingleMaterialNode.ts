import AbstractMaterialNode from "./AbstractMaterialNode";
import CameraComponent from "../components/CameraComponent";
import ComponentRepository from "../core/ComponentRepository";
import { ComponentType } from "../definitions/ComponentType";
import { CompositionType } from "../definitions/CompositionType";
import DepthEncodeShader from "../../webgl/shaders/DepthEncodeShader";
import Material from "./Material";
import Scalar from "../math/Scalar";
import { ShaderSemanticsInfo, ShaderSemantics } from "../definitions/ShaderSemantics";
import { ShaderType } from "../definitions/ShaderType";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import SkeletalComponent from "../components/SkeletalComponent";
import Vector3 from "../math/Vector3";

export default class DepthEncodeSingleMaterialNode extends AbstractMaterialNode {
  constructor({ isSkinning }: { isSkinning: boolean }) {
    super(DepthEncodeShader.getInstance(), 'depthEncodeShading' + (isSkinning ? '+skinning' : ''), { isMorphing: false, isSkinning, isLighting: false });

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(30.0), min: 0, max: 100
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1
      },
    );

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING';
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;

    }

    this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
    this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);
    material.setParameter(ShaderSemantics.ViewPosition, cameraComponent.entity.getTransform().translate);

    /// Skinning
    const skeletalComponent = args.entity.getComponent(SkeletalComponent) as SkeletalComponent;
    this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);
  }
}
