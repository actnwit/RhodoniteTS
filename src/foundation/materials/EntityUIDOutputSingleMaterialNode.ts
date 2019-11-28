import RnObject from "../core/RnObject";
import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsEnum
} from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import MutableColorRgb from "../math/MutableColorRgb";
import Vector2 from "../math/Vector2";
import { ComponentType } from "../definitions/ComponentType";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import ModuleManager from "../system/ModuleManager";
import { PixelFormat } from "../definitions/PixelFormat";
import { TextureParameter } from "../definitions/TextureParameter";
import Vector4 from "../math/Vector4";
import MutableVector4 from "../math/MutableVector4";
import Vector3 from "../math/Vector3";
import { ShadingModel } from "../definitions/ShadingModel";
import AbstractTexture from "../textures/AbstractTexture";
import { ShaderType } from "../definitions/ShaderType";
import Scalar from "../math/Scalar";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import Config from "../core/Config";
import ComponentRepository from "../core/ComponentRepository";
import CameraComponent from "../components/CameraComponent";
import { CGAPIResourceHandle } from "../../types/CommonTypes";
import Material from "./Material";
import SkeletalComponent from "../components/SkeletalComponent";
import MeshRendererComponent from "../components/MeshRendererComponent";
import { HdriFormat } from "../definitions/HdriFormat";
import VectorN from "../math/VectorN";
import EntityUIDOutputShader from "../../webgl/shaders/EntityUIDOutputSingleShader";
import MutableMatrix44 from "../math/MutableMatrix44";
import MutableMatrix33 from "../math/MutableMatrix33";
import entityUIDOutputSingleShaderVertex from "../../webgl/shaderity_shaders/EntityUIDOutputSingleShader/EntityUIDOutputSingleShader.vert";
import entityUIDOutputSingleShaderFragment from "../../webgl/shaderity_shaders/EntityUIDOutputSingleShader/EntityUIDOutputSingleShader.frag";

export default class EntityUIDOutputSingleMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, "entityUidOutputShading"
      + (true ? '+skinning' : '')
      + (false ? '' : '-lighting'),
      { isMorphing: false, isSkinning: true, isLighting: false },
      entityUIDOutputSingleShaderVertex, entityUIDOutputSingleShaderFragment
    );
    EntityUIDOutputSingleMaterialNode.initDefaultTextures();

    let shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.WorldMatrix, isComponentData: true, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, initialValue: MutableMatrix44.zero()
      },
      {
        semantic: ShaderSemantics.NormalMatrix, isComponentData: true, compositionType: CompositionType.Mat3, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, initialValue: MutableMatrix33.zero()
      },
      // {semantic: ShaderSemantics.ViewMatrix, isComponentData: true, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: MutableMatrix44.zero() },
      // {semantic: ShaderSemantics.ProjectionMatrix, isComponentData: true, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: MutableMatrix44.zero() },
      // {
      //   semantic: ShaderSemantics.ViewPosition,
      //   compositionType: CompositionType.Vec3,
      //   componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader,
      //   min: -Number.MAX_VALUE,
      //   max: Number.MAX_VALUE,
      //   isSystem: true,
      //   updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      //   initialValue: new Vector3(0, 0, 0),
      //   soloDatum: true
      // },
      {
        semantic: ShaderSemantics.PointSize, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Scalar(30.0), min: 0, max: 100,
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1,
      },
    ];


    if (true) {
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
