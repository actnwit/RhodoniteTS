import {VertexAttributeEnum} from '../definitions/VertexAttribute';
import {PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import {Attributes} from './Primitive';
import Accessor, {IndicesAccessOption} from '../memory/Accessor';
import {Index, Array1to4} from '../../types/CommonTypes';
import {
  Array1,
  Array2,
  Array3,
  Array4,
} from '../../../dist/esm/types/CommonTypes';
import {ISemanticVertexAttribute} from './ISemanticVertexAttribute';

export class ComplexVertexAttribute implements ISemanticVertexAttribute {
  private __semantic: PrimitiveModeEnum;
  private __components: Array1to4<Accessor> =
    [] as unknown as Array1to4<Accessor>;
  private __offsets: Array1to4<Index> = [] as unknown as Array1to4<Index>;

  constructor(semanticAttribute: VertexAttributeEnum, attributes: Attributes) {
    this.__semantic = semanticAttribute;
    this.__offsets = [] as unknown as Array1to4<Index>;
    this.__components = [] as unknown as Array1to4<Accessor>;
    for (const [joinedString, accessor] of attributes) {
      const split = joinedString.split(',');
      for (let i = 0; i < split.length; i++) {
        const attributeComponentName = split[i];
        if (attributeComponentName === semanticAttribute.X) {
          this.__offsets[0] = i;
          this.__components[0] = accessor;
        }
        if (attributeComponentName === semanticAttribute.Y) {
          this.__offsets[1] = i;
          this.__components[1] = accessor;
        }
        if (attributeComponentName === semanticAttribute.Z) {
          this.__offsets[2] = i;
          this.__components[2] = accessor;
        }
        if (attributeComponentName === semanticAttribute.W) {
          this.__offsets[3] = i;
          this.__components[3] = accessor;
        }
      }
    }
  }

  get semantic(): PrimitiveModeEnum {
    return this.__semantic;
  }

  public getScalarAsArray(
    i: Index,
    option: IndicesAccessOption
  ): Array1<number> {
    return [this.__components[0].getScalarAt(i, this.__offsets[0], option)];
  }
  public getVec2AsArray(i: Index, option: IndicesAccessOption): Array2<number> {
    return [
      this.__components[0].getScalarAt(i, this.__offsets[0], option),
      this.__components[1]!.getScalarAt(i, this.__offsets[1]!, option),
    ];
  }
  public getVec3AsArray(i: Index, option: IndicesAccessOption): Array3<number> {
    return [
      this.__components[0].getScalarAt(i, this.__offsets[0], option),
      this.__components[1]!.getScalarAt(i, this.__offsets[1]!, option),
      this.__components[2]!.getScalarAt(i, this.__offsets[2]!, option),
    ];
  }
  public getVec4AsArray(i: Index, option: IndicesAccessOption): Array4<number> {
    return [
      this.__components[0].getScalarAt(i, this.__offsets[0], option),
      this.__components[1]!.getScalarAt(i, this.__offsets[1]!, option),
      this.__components[2]!.getScalarAt(i, this.__offsets[2]!, option),
      this.__components[3]!.getScalarAt(i, this.__offsets[3]!, option),
    ];
  }
}
