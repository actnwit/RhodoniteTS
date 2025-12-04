import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types';
import { CommonShaderPart } from '../CommonShaderPart';

export class VaryingVariableShader extends CommonShaderPart {
  private __variableName = '';
  constructor(
    private __functionName: string,
    private __compositionType: CompositionTypeEnum,
    private __componentType: ComponentTypeEnum
  ) {
    super();
  }

  setVariableName(name: any) {
    this.__variableName = name;
  }

  getVertexShaderDefinitions(_engine: Engine) {
    return `
    out ${this.__compositionType.getGlslStr(this.__componentType)} ${this.__variableName};
    void ${this.__functionName}(
      in ${this.__compositionType.getGlslStr(this.__componentType)} value) {
      ${this.__variableName} = value;
    }
    `;
  }

  getPixelShaderDefinitions(_engine: Engine) {
    return `
    in ${this.__compositionType.getGlslStr(this.__componentType)} ${this.__variableName};
    void ${this.__functionName}(
      out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
      outValue = ${this.__variableName};
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
