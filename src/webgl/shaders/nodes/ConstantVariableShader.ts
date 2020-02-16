import { VertexAttributeEnum, VertexAttribute } from "../../../foundation/definitions/VertexAttribute";
import GLSLShader from "../GLSLShader";
import Config from "../../../foundation/core/Config";
import { ShaderNode } from "../../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../../foundation/definitions/CompositionType";
import { MaterialNodeUID } from "../../../types/CommonTypes";
import { ComponentTypeEnum, ComponentType } from "../../../foundation/definitions/ComponentType";

export type AttributeNames = Array<string>;

export default class ConstantVariableShader extends GLSLShader {
  private __constantValueStr = '';
  constructor(
    private __functionName: string,
    private __compositionType: CompositionTypeEnum,
    private __componentType: ComponentTypeEnum) {
    super();
  }

  setConstantValue(value: any) {
    let constant = '';
    if (this.__componentType.isFloatingPoint()) {
      constant = value.glslStrAsFloat
    } else if (this.__componentType.isInteger()) {
      constant = value.glslStrAsInt
    }
    this.__constantValueStr = constant;
  }

  get vertexShaderDefinitions() {
    return `
    void ${this.__functionName}(
      out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
      outValue = ${this.__constantValueStr};
    }
    `;
  };

  get pixelShaderDefinitions() {
    return `
    void ${this.__functionName}(
      out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
      outValue = ${this.__constantValueStr};
    }
    `;
  }

  get attributeNames(): AttributeNames {
    return [];
  }

  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}

