import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType, CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentType, ComponentTypeEnum } from "../../definitions/ComponentType";
import ConstantVariableShader from "../../../webgl/shaders/nodes/ConstantVariableShader";

export default class ConstantVariableMaterialNode extends AbstractMaterialNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super(null, 'constantVariable');

    this.__shaderFunctionName += '_' + this.__materialNodeUid;

    this.__shader = new ConstantVariableShader(this.__shaderFunctionName, compositionType, componentType);

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
      (this.__shader as ConstantVariableShader).setConstantValue(value);
    }
  }
}

