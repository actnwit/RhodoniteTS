import {VertexAttributeEnum} from '../../../foundation/definitions/VertexAttribute';
import { GLSLShader } from '../GLSLShader';
import {CompositionTypeEnum} from '../../../foundation/definitions/CompositionType';
import {ComponentTypeEnum} from '../../../foundation/definitions/ComponentType';

export type AttributeNames = Array<string>;

export class VaryingVariableShader extends GLSLShader {
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

  get vertexShaderDefinitions() {
    return `
    out ${this.__compositionType.getGlslStr(this.__componentType)} ${
      this.__variableName
    };
    void ${this.__functionName}(
      in ${this.__compositionType.getGlslStr(this.__componentType)} value) {
      ${this.__variableName} = value;
    }
    `;
  }

  get pixelShaderDefinitions() {
    return `
    in ${this.__compositionType.getGlslStr(this.__componentType)} ${
      this.__variableName
    };
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
