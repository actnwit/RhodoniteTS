import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import AttributeNormalShaderityObject from "../../../webgl/shaderity_shaders/nodes/AttributeNormal.vert"

export default class AttributePositionMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, 'attributeNormal', {}, AttributeNormalShaderityObject, AttributeNormalShaderityObject);

    this.__vertexOutputs.push(
      {
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        name: 'outValue',
      });

  }

}

