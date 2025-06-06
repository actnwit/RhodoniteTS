import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { AttributeNames } from '../../types';
import { CommonShaderPart } from '../CommonShaderPart';

export class IfStatementShader extends CommonShaderPart {
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
