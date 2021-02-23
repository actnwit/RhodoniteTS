import {
  VertexAttributeEnum,
  VertexAttribute,
} from '../../../foundation/definitions/VertexAttribute';
import GLSLShader from '../GLSLShader';
import Config from '../../../foundation/core/Config';
import {ShaderNode} from '../../../foundation/definitions/ShaderNode';
import {CompositionTypeEnum} from '../../../foundation/definitions/CompositionType';
import {MaterialNodeUID} from '../../../commontypes/CommonTypes';
import {
  ComponentTypeEnum,
  ComponentType,
} from '../../../foundation/definitions/ComponentType';

export type AttributeNames = Array<string>;

export default class UniformDataShader extends GLSLShader {
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
    return `
    uniform ${this.__compositionType.getGlslStr(this.__componentType)} u_${
      this.__variableName
    }; // initialValue=${this.__valueStr}
    void ${this.__functionName}(out ${this.__compositionType.getGlslStr(
      this.__componentType
    )} outValue) {
#ifdef RN_IS_FASTEST_MODE
  float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID
#else
  float materialSID = u_materialSID;
#endif

outValue = get_${this.__variableName}(materialSID, 0);
    }
    `;
  }

  get pixelShaderDefinitions() {
    return `
    uniform ${this.__compositionType.getGlslStr(this.__componentType)} u_${
      this.__variableName
    }; // initialValue=${this.__valueStr}
    void ${this.__functionName}(out ${this.__compositionType.getGlslStr(
      this.__componentType
    )} outValue) {
#ifdef RN_IS_FASTEST_MODE
  float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID
#else
  float materialSID = u_materialSID;
#endif

outValue = get_${this.__variableName}(materialSID, 0);
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
