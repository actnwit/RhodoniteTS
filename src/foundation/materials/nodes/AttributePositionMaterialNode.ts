import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import AttributePositionShaderityObject from "../../../webgl/shaderity_shaders/nodes/AttributePosition.vert"

export default class AttributePositionMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, 'attributePosition', {}, AttributePositionShaderityObject, AttributePositionShaderityObject);

    this.__vertexOutputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });

  }

}
