import { CommonShaderPart } from '../CommonShaderPart';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import { SystemState } from '../../../foundation/system/SystemState';
import { AttributeNames } from '../../types/CommonTypes';
import { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';

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

  get vertexShaderDefinitions() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
// #param ${this.__variableName}: ${this.__compositionType.toWGSLType(
        this.__componentType
      )}; // initialValue=${this.__valueStr}
fn ${this.__functionName}(outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
  *outValue = get_${this.__variableName}(uniformDrawParameters.materialSid, 0);
}
`;
    } else {
      return `
uniform ${this.__compositionType.getGlslStr(this.__componentType)} u_${
        this.__variableName
      }; // initialValue=${this.__valueStr}
void ${this.__functionName}(out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
  #ifdef RN_IS_DATATEXTURE_MODE
    float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID
  #else
    float materialSID = u_materialSID;
  #endif

  outValue = get_${this.__variableName}(materialSID, 0);
}
`;
    }
  }

  get pixelShaderDefinitions() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
// #param ${this.__variableName}: ${this.__compositionType.toWGSLType(
        this.__componentType
      )}; // initialValue=${this.__valueStr}
fn ${this.__functionName}(outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
  *outValue = get_${this.__variableName}(uniformDrawParameters.materialSid, 0);
}
`;
    } else {
      return `
uniform ${this.__compositionType.getGlslStr(this.__componentType)} u_${
        this.__variableName
      }; // initialValue=${this.__valueStr}
void ${this.__functionName}(out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
#ifdef RN_IS_DATATEXTURE_MODE
  float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID
#else
  float materialSID = u_materialSID;
#endif

outValue = get_${this.__variableName}(materialSID, 0);
    }
    `;
    }
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
