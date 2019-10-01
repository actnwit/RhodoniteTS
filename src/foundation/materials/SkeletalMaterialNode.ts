import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import SkeletalShader from "../../webgl/shaders/SkeletalShader";
import { ShaderType } from "../definitions/ShaderType";

export default class SkeletalMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(SkeletalShader.getInstance(), 'skinning');

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.BoneMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true
      },
      {
        semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
        stage: ShaderType.VertexShader, min: 0, max: 1, isSystem: true
      },
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

}
