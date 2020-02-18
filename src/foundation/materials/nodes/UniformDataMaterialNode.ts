import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType, CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentType, ComponentTypeEnum } from "../../definitions/ComponentType";
import UniformDataShader from "../../../webgl/shaders/nodes/UniformDataShader";

export default class UniformDataMaterialNode extends AbstractMaterialNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super(null, 'uniformData');

    this.__shaderFunctionName += '_' + this.__materialNodeUid;

    this.__shader = new UniformDataShader(this.__shaderFunctionName, compositionType, componentType);

    this.__vertexOutputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });

    this.__pixelOutputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });
  }

  setDefaultInputValue(inputName: string, value: any) {
    super.setDefaultInputValue(inputName, value);
    if (inputName === 'value') {
      (this.__shader as UniformDataShader).setDefaultValue(value);
    }
  }
  setUniformDataName(value: any) {
    (this.__shader as UniformDataShader).setVariableName(value);
  }
}
