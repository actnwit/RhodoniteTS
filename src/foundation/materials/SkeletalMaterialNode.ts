import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import Vector2 from "../math/Vector2";
import { ComponentType } from "../definitions/ComponentType";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import Vector4 from "../math/Vector4";
import Vector3 from "../math/Vector3";
import PBRShader from "../../webgl/shaders/PBRShader";

export default class SkeletalMaterialNode extends AbstractMaterialNode {
  static readonly shader: PBRShader = PBRShader.getInstance();

  constructor() {

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {semantic: ShaderSemantics.BoneMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float, isPlural: true, isSystem: true},
      {semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int, isPlural: false, isSystem: true},
    ];
    super(shaderSemanticsInfoArray);
  }

  static async initDefaultTextures() {
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}
