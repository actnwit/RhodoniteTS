
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import IfStatementShader from "../../../webgl/shaders/nodes/IfStatementShader";
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class BlockEndMaterialNode extends AbstractShaderNode {

  constructor() {
    super('blockEnd', undefined, new IfStatementShader());

    this.__inputs.push(
      {
        compositionType: CompositionType.Unknown,
        componentType: ComponentType.Unknown,
        name: 'blockEnd',
      });

  }
}
