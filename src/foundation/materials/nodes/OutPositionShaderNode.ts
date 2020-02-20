import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import EndShader from "../../../webgl/shaders/nodes/EndShader";
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class OutPositionShaderNode extends AbstractShaderNode {

  constructor() {
    super('outPosition', undefined, EndShader.getInstance());

    this.__inputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'value',
      });

  }

}
