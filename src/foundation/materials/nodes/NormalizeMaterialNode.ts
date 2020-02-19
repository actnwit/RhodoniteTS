import NormalizeShaderityObject from "../../../webgl/shaderity_shaders/nodes/Normalize.glsl"
import { CompositionTypeEnum, ComponentTypeEnum } from "../../../rhodonite";
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class NormalizeMaterialNode extends AbstractShaderNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('normalize', NormalizeShaderityObject.code);

    this.__inputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'value',
      });
    this.__outputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });

    }
}

