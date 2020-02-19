
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType, CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentType, ComponentTypeEnum } from "../../definitions/ComponentType";
import IfStatementShader from "../../../webgl/shaders/nodes/IfStatementShader";

export default class BlockBeginMaterialNode extends AbstractMaterialNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super(new IfStatementShader(), 'blockBegin');

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        name: 'blockStart',
      });
    this.__vertexInputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'value',
      });
    this.__vertexOutputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });

    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        name: 'blockStart',
      });
    this.__pixelInputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'value',
      });
    this.__pixelOutputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });

  }

}
