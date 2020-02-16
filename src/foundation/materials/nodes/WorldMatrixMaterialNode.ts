import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import WorldMatrixShaderityObject from "../../../webgl/shaderity_shaders/nodes/WorldMatrix.vert"

export default class WorldMatrixMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, 'worldMatrix', {}, WorldMatrixShaderityObject, WorldMatrixShaderityObject);

    this.__vertexOutputs.push(
      {
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });
  }

}
