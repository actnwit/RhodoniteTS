import {
  VertexAttributeEnum,
  VertexAttribute,
} from '../../../foundation/definitions/VertexAttribute';
import { CommonShaderPart } from '../GLSLShader';
import { Config } from '../../../foundation/core/Config';
import { ShaderNode } from '../../../foundation/definitions/ShaderNode';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { MaterialNodeUID } from '../../../types/CommonTypes';
import { ComponentTypeEnum, ComponentType } from '../../../foundation/definitions/ComponentType';
import { AttributeNames } from '../../types';
import { IVector } from '../../../foundation';

export class ConstantVariableShader extends CommonShaderPart {
  private __constantValueStr = '';
  constructor(
    private __functionName: string,
    private __compositionType: CompositionTypeEnum,
    private __componentType: ComponentTypeEnum
  ) {
    super();
  }

  setConstantValue(value: IVector) {
    let constant = '';
    if (this.__componentType.isFloatingPoint()) {
      constant = value.glslStrAsFloat;
    } else if (this.__componentType.isInteger()) {
      constant = value.glslStrAsInt;
    } else if (this.__componentType === ComponentType.Bool) {
      constant = value.x ? 'true' : 'false';
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
  }

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
