import {PrimitiveModeEnum} from '../../../dist/esm/foundation/definitions/PrimitiveMode';
import {
  Array1,
  Array2,
  Array3,
  Array4,
  Index,
} from '../../../dist/esm/types/CommonTypes';
import {IndicesAccessOption} from '../memory/Accessor';

export interface ISemanticVertexAttribute {
  semantic: PrimitiveModeEnum;
  getScalarAsArray: (i: Index, option: IndicesAccessOption) => Array1<number>;
  getVec2AsArray: (i: Index, option: IndicesAccessOption) => Array2<number>;
  getVec3AsArray: (i: Index, option: IndicesAccessOption) => Array3<number>;
  getVec4AsArray: (i: Index, option: IndicesAccessOption) => Array4<number>;
}
