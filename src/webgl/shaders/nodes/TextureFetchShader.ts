import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { MaterialNodeUID } from '../../../types/CommonTypes';
import type { AttributeNames } from '../../types';
import { CommonShaderPart } from '../CommonShaderPart';

export class TextureFetchShader extends CommonShaderPart {
  static __instance: TextureFetchShader;
  private __materialNodeUid: MaterialNodeUID = 0;

  set materialNodeUid(materialNodeUid: MaterialNodeUID) {
    this.__materialNodeUid = materialNodeUid;
  }

  vertexShaderBody = `
  `;

  getPixelShaderBody() {
    return `
    `;
  }

  get vertexShaderDefinitions() {
    return '';
  }

  get pixelShaderDefinitions() {
    return '';
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
