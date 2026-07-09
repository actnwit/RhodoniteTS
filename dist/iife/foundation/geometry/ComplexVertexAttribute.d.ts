import type { Array1, Array2, Array3, Array4, Index } from '../../types/CommonTypes';
import type { VertexAttributeEnum } from '../definitions/VertexAttribute';
import type { IndicesAccessOption } from '../memory/Accessor';
import type { ISemanticVertexAttribute } from './ISemanticVertexAttribute';
import type { Attributes } from './Primitive';
/**
 * A complex vertex attribute that manages multiple accessors for different components (X, Y, Z, W)
 * of a vertex attribute. This class allows vertex attributes to be stored across multiple
 * data sources while providing a unified interface for accessing them.
 */
export declare class ComplexVertexAttribute implements ISemanticVertexAttribute {
    private __semantic;
    private __components;
    private __offsets;
    /**
     * Creates a new ComplexVertexAttribute instance.
     *
     * @param semanticAttribute - The semantic type of this vertex attribute (e.g., position, normal, UV)
     * @param attributes - A map of attribute names to their corresponding accessors
     */
    constructor(semanticAttribute: VertexAttributeEnum, attributes: Attributes);
    /**
     * Gets the semantic type of this vertex attribute.
     *
     * @returns The vertex attribute semantic enum
     */
    get semantic(): VertexAttributeEnum;
    /**
     * Retrieves a single scalar value as a 1-element array from the vertex attribute at the specified index.
     *
     * @param i - The vertex index to access
     * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
     * @returns A 1-element array containing the scalar value
     */
    getScalarAsArray(i: Index, option: IndicesAccessOption): Array1<number>;
    /**
     * Retrieves a 2-component vector (Vec2) as an array from the vertex attribute at the specified index.
     *
     * @param i - The vertex index to access
     * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
     * @returns A 2-element array containing the X and Y components
     */
    getVec2AsArray(i: Index, option: IndicesAccessOption): Array2<number>;
    /**
     * Retrieves a 3-component vector (Vec3) as an array from the vertex attribute at the specified index.
     *
     * @param i - The vertex index to access
     * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
     * @returns A 3-element array containing the X, Y, and Z components
     */
    getVec3AsArray(i: Index, option: IndicesAccessOption): Array3<number>;
    /**
     * Retrieves a 4-component vector (Vec4) as an array from the vertex attribute at the specified index.
     *
     * @param i - The vertex index to access
     * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
     * @returns A 4-element array containing the X, Y, Z, and W components
     */
    getVec4AsArray(i: Index, option: IndicesAccessOption): Array4<number>;
}
