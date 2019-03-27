import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import SkeletalShader from "../../webgl/shaders/SkeletalShader";

export default class SkeletalMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(SkeletalShader.getInstance());

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {semantic: ShaderSemantics.BoneMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float, isPlural: true, isSystem: true},
      {semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int, isPlural: false, isSystem: true},
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    this.__vertexInputs.push(
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'inNormalMatrix',
      isImmediateValue: false
    });

    this.__vertexOutputs.push(
    {
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Int,
      name: 'isSkinning',
      isImmediateValue: false
    });
    this.__vertexOutputs.push({
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'outNormalMatrix',
      isImmediateValue: false
    });
  }

  static async initDefaultTextures() {
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}
