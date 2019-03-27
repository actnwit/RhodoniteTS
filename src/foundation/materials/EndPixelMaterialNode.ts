import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import EndShader from "../../webgl/shaders/EndShader";

export default class SkeletalMaterialNode extends AbstractMaterialNode {
  static readonly shader: EndShader = EndShader.getInstance();

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
      name: 'inColor'
    });

    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'inPosition'
      });
  }

  static async initDefaultTextures() {
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}
