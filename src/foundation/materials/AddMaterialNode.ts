import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import EndShader from "../../webgl/shaders/EndShader";
import AddShader from "../../webgl/shaders/AddShader";

export default class AddMaterialNode extends AbstractMaterialNode {
  static readonly shader: AddShader = AddShader.getInstance();

  constructor() {

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {semantic: ShaderSemantics.BoneMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float, isPlural: true, isSystem: true},
      {semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int, isPlural: false, isSystem: true},
    ];
    super(shaderSemanticsInfoArray);

    this.__pixelInputs.push(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'lhs'
    });
    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'rhs'
      });
    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'outValue'
      });
  }

  static async initDefaultTextures() {
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}
