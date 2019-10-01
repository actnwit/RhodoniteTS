import AbstractMaterialNode from "./AbstractMaterialNode";
import CameraComponent from "../components/CameraComponent";
import ClassicShader from "../../webgl/shaders/ClassicShader";
import ComponentRepository from "../core/ComponentRepository";
import { ComponentType } from "../definitions/ComponentType";
import { CompositionType } from "../definitions/CompositionType";
import Material from "./Material";
import Scalar from "../math/Scalar";
import SkeletalComponent from "../components/SkeletalComponent";
import { ShaderSemanticsInfo, ShaderSemantics, } from "../definitions/ShaderSemantics";
import { ShaderType } from "../definitions/ShaderType";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import { ShadingModel } from "../definitions/ShadingModel";
import Vector3 from "../math/Vector3";
import Vector4 from "../math/Vector4";

export default class ClassicShadingSingleMaterialNode extends AbstractMaterialNode {

  constructor({ isSkinning, isLighting }: { isSkinning: boolean, isLighting: boolean }) {
    super(ClassicShader.getInstance(), "classicShading"
      + (isSkinning ? '+skinning' : '')
      + (isLighting ? '' : '-lighting'), { isMorphing: false, isLighting: isLighting, isSkinning: isSkinning });

    let shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.ShadingModel, componentType: ComponentType.Int, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(ShadingModel.Constant.index), min: 0, max: 3,
      },
      {
        semantic: ShaderSemantics.Shininess, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(5), min: 0, max: Number.MAX_VALUE,
      },
      {
        semantic: ShaderSemantics.DiffuseColorFactor, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector4(1, 1, 1, 1), min: 0, max: 2,
      },
      {
        semantic: ShaderSemantics.DiffuseColorTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, AbstractMaterialNode.__dummyWhiteTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.NormalTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [1, AbstractMaterialNode.__dummyBlueTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
    );


    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(30.0), min: 0, max: 100,
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1,
      },
    );

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
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

    /// Skinning
    const skeletalComponent = args.entity.getComponent(SkeletalComponent) as SkeletalComponent;
    this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);

    // Lights
    this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);

  }
}
