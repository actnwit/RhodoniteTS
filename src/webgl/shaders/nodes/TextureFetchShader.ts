import {VertexAttributeEnum} from '../../../foundation/definitions/VertexAttribute';
import {GLSLShader} from '../GLSLShader';
import {CompositionTypeEnum} from '../../../foundation/definitions/CompositionType';
import {MaterialNodeUID} from '../../../types/CommonTypes';
import { AttributeNames } from '../../types';

export class TextureFetchShader extends GLSLShader {
  static __instance: TextureFetchShader;
  private __materialNodeUid: MaterialNodeUID = 0;
  constructor() {
    super();
  }

  set materialNodeUid(materialNodeUid: MaterialNodeUID) {
    this.__materialNodeUid = materialNodeUid;
  }

  vertexShaderBody = `
  `;

  getPixelShaderBody() {
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
