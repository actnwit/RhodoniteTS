import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import NormalizeShaderityObject from "../../../webgl/shaderity_shaders/nodes/Normalize.glsl"
import { CompositionTypeEnum, ComponentTypeEnum } from "../../../rhodonite";

export default class NormalizeMaterialNode extends AbstractMaterialNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super(null, 'normalize', {}, NormalizeShaderityObject, NormalizeShaderityObject);

    this.__vertexInputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'value',
      });
    this.__vertexOutputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });

    this.__pixelInputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'value',
      });
    this.__pixelOutputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });
  }

}

