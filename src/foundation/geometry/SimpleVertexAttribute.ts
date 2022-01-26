import {VertexAttributeEnum} from '../definitions/VertexAttribute';
import {PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import Accessor from '../memory/Accessor';
import {Array1, Array2, Array3, Array4, Index} from '../../types/CommonTypes';
import {IndicesAccessOption} from '../memory/Accessor';
import {ISemanticVertexAttribute} from './ISemanticVertexAttribute';

export class SimpleVertexAttribute implements ISemanticVertexAttribute {
  private __semantic: PrimitiveModeEnum;
  private __accessor: Accessor;
  constructor(semanticAttribute: VertexAttributeEnum, accessor: Accessor) {
    this.__semantic = semanticAttribute;
    this.__accessor = accessor;
  }

  get semantic(): PrimitiveModeEnum {
    return this.__semantic;
  }

  public getScalarAsArray(
    i: Index,
    option: IndicesAccessOption
  ): Array1<number> {
    return [this.__accessor.getScalar(i, option)];
  }
  public getVec2AsArray(i: Index, option: IndicesAccessOption): Array2<number> {
    return this.__accessor.getVec2AsArray(i, option);
  }
  public getVec3AsArray(i: Index, option: IndicesAccessOption): Array3<number> {
    return this.__accessor.getVec3AsArray(i, option);
  }
  public getVec4AsArray(i: Index, option: IndicesAccessOption): Array4<number> {
    return this.__accessor.getVec4AsArray(i, option);
  }
}
