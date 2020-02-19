import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import NormalMatrixShaderityObject from "../../../webgl/shaderity_shaders/nodes/NormalMatrix.vert"
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class NormalMatrixMaterialNode extends AbstractShaderNode {

  constructor() {
    super('normalMatrix', NormalMatrixShaderityObject.code);

    this.__outputs.push(
      {
        compositionType: CompositionType.Mat3,
        componentType: ComponentType.Float,
        name: 'outValue',
      });
  }

}
