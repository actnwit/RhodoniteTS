import {
  ShaderSemanticsInfo,
  ShaderSemantics,
} from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import Vector3 from "../math/Vector3";
import DepthEncodeShader from "../../webgl/shaders/DepthEncodeShader";
import { ShaderType } from "../definitions/ShaderType";
import Material from "./Material";
import SkeletalComponent from "../components/SkeletalComponent";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import Scalar from "../math/Scalar";
import MutableVector4 from "../math/MutableVector4";
import VectorN from "../math/VectorN";
import ComponentRepository from "../core/ComponentRepository";
import CameraComponent from "../components/CameraComponent";

export default class DepthEncodeSingleMaterialNode extends AbstractMaterialNode {
  constructor({ isSkinning }: { isSkinning: boolean }) {
    super(DepthEncodeShader.getInstance(), 'depthEncodeShading' + (isSkinning ? '+skinning' : ''));

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.ViewPosition, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true,
        initialValue: new Vector3(0, 0, 0), min: -Number.MAX_VALUE, max: Number.MAX_VALUE
      }
    ];

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Scalar(100.0), min: 0, max: 100
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1
      }
    );

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING';

      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
          stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Scalar(0), min: 0, max: 1
        },
        {
          semantic: ShaderSemantics.BoneCompressedChank, compositionType: CompositionType.Vec4Array, componentType: ComponentType.Float,
          stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new VectorN(new Float32Array(0)), min: -Number.MAX_VALUE, max: Number.MAX_VALUE,
          maxIndex: 250,
        },
        {
          semantic: ShaderSemantics.BoneCompressedInfo, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: MutableVector4.zero(), min: -Number.MAX_VALUE, max: Number.MAX_VALUE
        },
      );
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    if (args.setUniform) {
      AbstractMaterialNode.setWorldMatrix(shaderProgram, args.worldMatrix);
      AbstractMaterialNode.setNormalMatrix(shaderProgram, args.normalMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;

    }

    AbstractMaterialNode.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
    AbstractMaterialNode.setProjection(shaderProgram, cameraComponent, material, args.setUniform);
    material.setParameter(ShaderSemantics.ViewPosition, cameraComponent.entity.getTransform().translate);

    /// Skinning
    const skeletalComponent = args.entity.getComponent(SkeletalComponent) as SkeletalComponent;
    AbstractMaterialNode.setSkinning(shaderProgram, skeletalComponent, args.setUniform);
  }
}
