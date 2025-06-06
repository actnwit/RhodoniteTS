import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import { CommonShaderPart } from '../CommonShaderPart';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { AttributeNames } from '../../types';

export class IfStatementShader extends CommonShaderPart {
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
