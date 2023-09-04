import { Array1, Array2, Array3, Array4, Index } from '../../types/CommonTypes';
import { VertexAttributeEnum } from '../definitions';
import { IndicesAccessOption } from '../memory/Accessor';

export interface ISemanticVertexAttribute {
  semantic: VertexAttributeEnum;
  getScalarAsArray: (i: Index, option: IndicesAccessOption) => Array1<number>;
  getVec2AsArray: (i: Index, option: IndicesAccessOption) => Array2<number>;
  getVec3AsArray: (i: Index, option: IndicesAccessOption) => Array3<number>;
  getVec4AsArray: (i: Index, option: IndicesAccessOption) => Array4<number>;
}
