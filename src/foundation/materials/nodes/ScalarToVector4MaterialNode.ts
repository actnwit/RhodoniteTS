import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import ScalarToVector4ShaerityObject from "../../../webgl/shaderity_shaders/nodes/scalarToVector4.glsl"

export default class AddMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, 'scalarToVector4', {}, ScalarToVector4ShaerityObject, ScalarToVector4ShaerityObject);

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'x',
      });
    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'y',
      });
    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'z',
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
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'x',
      });
    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'y',
      });
    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'z',
      });
    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        name: 'w',
      });
     this.__pixelOutputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });
  }

}

