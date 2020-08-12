import AbstractMaterialNode from "../core/AbstractMaterialNode";
import CameraComponent from "../../components/CameraComponent";
import ComponentRepository from "../../core/ComponentRepository";
import { ComponentType } from "../../definitions/ComponentType";
import { CompositionType } from "../../definitions/CompositionType";
import DepthEncodeShader from "../../../webgl/shaders/DepthEncodeShader";
import Material from "../core/Material";
import Scalar from "../../math/Scalar";
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import { ShaderType } from "../../definitions/ShaderType";
import { ShaderVariableUpdateInterval } from "../../definitions/ShaderVariableUpdateInterval";
import SkeletalComponent from "../../components/SkeletalComponent";
import Vector3 from "../../math/Vector3";
import MutableScalar from "../../math/MutableScalar";

export default class DepthEncodeSingleMaterialNode extends AbstractMaterialNode {
  static zNearInner = new ShaderSemanticsClass({ str: 'zNearInner' });
  static zFarInner = new ShaderSemanticsClass({ str: 'zFarInner' });
  private __zNearInner = new MutableScalar(0);
  private __zFarInner = new MutableScalar(0);

  constructor({ isSkinning }: { isSkinning: boolean }) {
    super(DepthEncodeShader.getInstance(), 'depthEncodeShading' + (isSkinning ? '+skinning' : ''), { isMorphing: false, isSkinning, isLighting: false });

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    shaderSemanticsInfoArray.push(
      {
        semantic: DepthEncodeSingleMaterialNode.zNearInner, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(0.1), min: 0.0001, max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: DepthEncodeSingleMaterialNode.zFarInner, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(10000.0), min: 0.0001, max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: ShaderSemantics.PointSize, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(30.0), min: 0, max: 100
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1
      },
    );

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING';
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    let cameraComponent = args.renderPass.cameraComponent as CameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }
    this.__zNearInner.v[0] = cameraComponent.zNearInner;
    this.__zFarInner.v[0] = cameraComponent.zFarInner;

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);

      (shaderProgram as any)._gl.uniform1fv((shaderProgram as any).zNearInner, this.__zNearInner.v);
      (shaderProgram as any)._gl.uniform1fv((shaderProgram as any).zFarInner, this.__zFarInner.v);
    } else {
      material.setParameter(DepthEncodeSingleMaterialNode.zNearInner, this.__zNearInner);
      material.setParameter(DepthEncodeSingleMaterialNode.zFarInner, this.__zFarInner);
    }


    /// Skinning
    const skeletalComponent = args.entity.getComponent(SkeletalComponent) as SkeletalComponent;
    this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);
  }
}
