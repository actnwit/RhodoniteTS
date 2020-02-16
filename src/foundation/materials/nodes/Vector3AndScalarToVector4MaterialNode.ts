import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import Vector3AndScalarToVector4ShaderityObject from "../../../webgl/shaderity_shaders/nodes/Vector3AndScalarToVector4.glsl"

export default class AddMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, 'vector3AndScalarToVector4', {}, Vector3AndScalarToVector4ShaderityObject, Vector3AndScalarToVector4ShaderityObject);

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        name: 'xyz',
      });
    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'w',
      });
    this.__vertexOutputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });

    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        name: 'xyz',
      });
    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'y',
      });
     this.__pixelOutputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });
  }

}

