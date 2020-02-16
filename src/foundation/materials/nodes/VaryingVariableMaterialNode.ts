import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType, CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentType, ComponentTypeEnum } from "../../definitions/ComponentType";
import VaryingVariableShader from "../../../webgl/shaders/nodes/VaryingVariableShader";

export default class VaryingVariableMaterialNode extends AbstractMaterialNode {

  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super(null, 'varyingVariable');

    this.__shaderFunctionName += '_' + this.__materialNodeUid;

    this.__shader = new VaryingVariableShader(this.__shaderFunctionName, compositionType, componentType);

    this.__vertexInputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'value',
        isClosed: true
      });

      this.__pixelOutputs.push(
      {
        compositionType: compositionType,
        componentType: componentType,
        name: 'outValue',
      });
  }

  setVaryingVariableName(value: any) {
    (this.__shader as VaryingVariableShader).setVariableName(value);
  }
}

