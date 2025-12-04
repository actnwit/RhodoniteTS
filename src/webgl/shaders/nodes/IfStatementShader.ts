import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types';
import { CommonShaderPart } from '../CommonShaderPart';

export class IfStatementShader extends CommonShaderPart {
  getVertexShaderDefinitions(_engine: Engine) {
    return `
    `;
  }

  getPixelShaderDefinitions(_engine: Engine) {
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
