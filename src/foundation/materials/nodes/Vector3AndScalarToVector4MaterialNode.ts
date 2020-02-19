import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import Vector3AndScalarToVector4ShaderityObject from "../../../webgl/shaderity_shaders/nodes/Vector3AndScalarToVector4.glsl"
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class AddMaterialNode extends AbstractShaderNode {

  constructor() {
    super('vector3AndScalarToVector4', Vector3AndScalarToVector4ShaderityObject.code);

    this.__inputs.push(
      {
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        name: 'xyz',
      });
    this.__inputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'w',
      });
    this.__outputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });

  }

}

