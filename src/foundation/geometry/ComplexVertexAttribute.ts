import type { VertexAttributeEnum } from '../definitions/VertexAttribute';
import { PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import type { Attributes } from './Primitive';
import type { IndicesAccessOption, Accessor } from '../memory/Accessor';
import type { Index, Array1to4 } from '../../types/CommonTypes';
import type { Array1, Array2, Array3, Array4 } from '../../types/CommonTypes';
import type { ISemanticVertexAttribute } from './ISemanticVertexAttribute';

/**
 * A complex vertex attribute that manages multiple accessors for different components (X, Y, Z, W)
 * of a vertex attribute. This class allows vertex attributes to be stored across multiple
 * data sources while providing a unified interface for accessing them.
 */
export class ComplexVertexAttribute implements ISemanticVertexAttribute {
  private __semantic: VertexAttributeEnum;
  private __components: Array1to4<Accessor> = [] as unknown as Array1to4<Accessor>;
  private __offsets: Array1to4<Index> = [] as unknown as Array1to4<Index>;

  /**
   * Creates a new ComplexVertexAttribute instance.
   *
   * @param semanticAttribute - The semantic type of this vertex attribute (e.g., position, normal, UV)
   * @param attributes - A map of attribute names to their corresponding accessors
   */
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

  /**
   * Gets the semantic type of this vertex attribute.
   *
   * @returns The vertex attribute semantic enum
   */
  get semantic(): VertexAttributeEnum {
    return this.__semantic;
  }

  /**
   * Retrieves a single scalar value as a 1-element array from the vertex attribute at the specified index.
   *
   * @param i - The vertex index to access
   * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
   * @returns A 1-element array containing the scalar value
   */
  public getScalarAsArray(i: Index, option: IndicesAccessOption): Array1<number> {
    return [this.__components[0].getScalarAt(i, this.__offsets[0], option)];
  }

  /**
   * Retrieves a 2-component vector (Vec2) as an array from the vertex attribute at the specified index.
   *
   * @param i - The vertex index to access
   * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
   * @returns A 2-element array containing the X and Y components
   */
  public getVec2AsArray(i: Index, option: IndicesAccessOption): Array2<number> {
    return [
      this.__components[0].getScalarAt(i, this.__offsets[0], option),
      this.__components[1]!.getScalarAt(i, this.__offsets[1]!, option),
    ];
  }

  /**
   * Retrieves a 3-component vector (Vec3) as an array from the vertex attribute at the specified index.
   *
   * @param i - The vertex index to access
   * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
   * @returns A 3-element array containing the X, Y, and Z components
   */
  public getVec3AsArray(i: Index, option: IndicesAccessOption): Array3<number> {
    return [
      this.__components[0].getScalarAt(i, this.__offsets[0], option),
      this.__components[1]!.getScalarAt(i, this.__offsets[1]!, option),
      this.__components[2]!.getScalarAt(i, this.__offsets[2]!, option),
    ];
  }

  /**
   * Retrieves a 4-component vector (Vec4) as an array from the vertex attribute at the specified index.
   *
   * @param i - The vertex index to access
   * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
   * @returns A 4-element array containing the X, Y, Z, and W components
   */
  public getVec4AsArray(i: Index, option: IndicesAccessOption): Array4<number> {
    return [
      this.__components[0].getScalarAt(i, this.__offsets[0], option),
      this.__components[1]!.getScalarAt(i, this.__offsets[1]!, option),
      this.__components[2]!.getScalarAt(i, this.__offsets[2]!, option),
      this.__components[3]!.getScalarAt(i, this.__offsets[3]!, option),
    ];
  }
}
