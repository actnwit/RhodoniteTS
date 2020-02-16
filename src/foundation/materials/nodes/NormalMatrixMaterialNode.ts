import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import NormalMatrixShaderityObject from "../../../webgl/shaderity_shaders/nodes/NormalMatrix.vert"

export default class NormalMatrixMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, 'normalMatrix', {}, NormalMatrixShaderityObject, NormalMatrixShaderityObject);

    this.__vertexOutputs.push(
      {
        compositionType: CompositionType.Mat3,
        componentType: ComponentType.Float,
        name: 'outValue',
      });
  }

}
