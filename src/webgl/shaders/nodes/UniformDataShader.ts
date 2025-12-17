import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import { EngineState } from '../../../foundation/system/EngineState';
import type { AttributeNames } from '../../types/CommonTypes';
import { CommonShaderPart } from '../CommonShaderPart';

export class UniformDataShader extends CommonShaderPart {
  private __variableName = '';
  private __valueStr = '';
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

  setDefaultValue(value: any) {
    this.__valueStr = value.toString();
  }

  getVertexShaderDefinitions(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
// #param ${this.__variableName}: ${this.__compositionType.toWGSLType(
        this.__componentType
      )}; // initialValue=${this.__valueStr}
fn ${this.__functionName}(outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
  *outValue = get_${this.__variableName}(uniformDrawParameters.materialSid, 0u);
}
`;
    }
    return `
uniform ${this.__compositionType.getGlslStr(this.__componentType)} u_${
      this.__variableName
    }; // initialValue=${this.__valueStr}
void ${this.__functionName}(out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
  ${CommonShaderPart.getMaterialSIDForWebGL()}

  outValue = get_${this.__variableName}(materialSID, 0u);
}
`;
  }

  getPixelShaderDefinitions(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
// #param ${this.__variableName}: ${this.__compositionType.toWGSLType(
        this.__componentType
      )}; // initialValue=${this.__valueStr}
fn ${this.__functionName}(outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
  *outValue = get_${this.__variableName}(uniformDrawParameters.materialSid, 0u);
}
`;
    }
    return `
uniform ${this.__compositionType.getGlslStr(this.__componentType)} u_${
      this.__variableName
    }; // initialValue=${this.__valueStr}
void ${this.__functionName}(out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
  ${CommonShaderPart.getMaterialSIDForWebGL()}

outValue = get_${this.__variableName}(materialSID, 0u);
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
