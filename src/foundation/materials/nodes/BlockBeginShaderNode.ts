
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import { CompositionType, CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentType, ComponentTypeEnum } from "../../definitions/ComponentType";
import IfStatementShader from "../../../webgl/shaders/nodes/IfStatementShader";
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class BlockBeginShaderNode extends AbstractShaderNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('blockBegin', undefined, new IfStatementShader());

    this.__inputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        name: 'blockStart',
      });
    this.__inputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'value',
      });
    this.__outputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });

  }

}
