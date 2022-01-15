import {VertexAttributeEnum} from '../../../foundation/definitions/VertexAttribute';
import GLSLShader from '../GLSLShader';
import {CompositionTypeEnum} from '../../../foundation/definitions/CompositionType';

export type AttributeNames = Array<string>;

export default class IfStatementShader extends GLSLShader {
  constructor() {
    super();
  }

  get vertexShaderDefinitions() {
    return `
    `;
  }

  get pixelShaderDefinitions() {
    return `
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
