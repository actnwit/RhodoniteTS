import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import ScalarToVector4ShaderityObject from "../../../webgl/shaderity_shaders/nodes/ScalarToVector4.glsl"
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class ScalarToVector4ShaderNode extends AbstractShaderNode {

  constructor() {
    super('scalarToVector4', ScalarToVector4ShaderityObject.code);

    this.__inputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'x',
      });
    this.__inputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'y',
      });
    this.__inputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'z',
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

