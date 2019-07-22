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
import Vector3 from "../math/Vector3";
import ClassicShader from "../../webgl/shaders/ClassicShader";
import { ShadingModel } from "../definitions/ShadingModel";
import EnvConstantShader from "../../webgl/shaders/EnvCostantShader";
import AbstractTexture from "../textures/AbstractTexture";
import { ShaderType } from "../definitions/ShaderType";
import { CGAPIResourceHandle } from "../../types/CommonTypes";
import Scalar from "../math/Scalar";
import ComponentRepository from "../core/ComponentRepository";
import CameraComponent from "../components/CameraComponent";
import Material from "./Material";

export default class EnvConstantSingleMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(EnvConstantShader.getInstance(), "envConstantShading");
    EnvConstantSingleMaterialNode.initDefaultTextures();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
        isPlural: false,
        prefix: "material.",
        isSystem: false,
        initialValue: new Vector4(1, 1, 1, 1)
      },
      {
        semantic: ShaderSemantics.ColorEnvTexture,
        compositionType: CompositionType.TextureCube,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isPlural: false,
        isSystem: false,
        initialValue: [
          0,
          AbstractMaterialNode.__dummyBlackCubeTexture
        ]
      },
      {
        semanticStr: 'envRotation',
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isPlural: false,
        isSystem: false,
        initialValue: new Scalar(0)
      },
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  static async initDefaultTextures() {
  }

  setParametersForGPU({material, shaderProgram, firstTime, args}: {material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any}) {

    if (args.setUniform) {
      AbstractMaterialNode.setWorldMatrix(shaderProgram, args.worldMatrix);
      AbstractMaterialNode.setNormalMatrix(shaderProgram, args.normalMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }
    if (cameraComponent) {
      AbstractMaterialNode.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      AbstractMaterialNode.setProjection(shaderProgram, cameraComponent, material, args.setUniform);
    }

  }
}
