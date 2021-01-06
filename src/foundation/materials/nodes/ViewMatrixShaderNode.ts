import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import ViewMatrixShaderityObject from "../../../webgl/shaderity_shaders/nodes/ViewMatrix.vert"
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class ViewMatrixShaderNode extends AbstractShaderNode {

  constructor() {
    super('viewMatrix', ViewMatrixShaderityObject.code);

    this.__outputs.push(
      {
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });
  }

}
