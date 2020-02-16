import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import ViewMatrixShaderityObject from "../../../webgl/shaderity_shaders/nodes/ViewMatrix.vert"

export default class ViewMatrixMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, 'viewMatrix', {}, ViewMatrixShaderityObject, ViewMatrixShaderityObject);

    this.__vertexOutputs.push(
      {
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });
  }

}

