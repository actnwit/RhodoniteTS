import type { Array1, Array2, Array3, Array4, Index } from '../../types/CommonTypes';
import type { VertexAttributeEnum } from '../definitions/VertexAttribute';
import type { Accessor, IndicesAccessOption } from '../memory/Accessor';
import type { ISemanticVertexAttribute } from './ISemanticVertexAttribute';
/**
 * A simple implementation of vertex attribute that provides access to vertex data
 * with semantic information. This class wraps an Accessor and associates it with
 * a specific vertex attribute semantic.
 */
export declare class SimpleVertexAttribute implements ISemanticVertexAttribute {
    private __semantic;
    private __accessor;
    /**
     * Creates a new SimpleVertexAttribute instance.
     * @param semanticAttribute - The semantic type of this vertex attribute (e.g., POSITION, NORMAL, TEXCOORD)
     * @param accessor - The accessor that provides access to the underlying vertex data
     */
    constructor(semanticAttribute: VertexAttributeEnum, accessor: Accessor);
    /**
     * Gets the semantic type of this vertex attribute.
     * @returns The vertex attribute semantic enum value
     */
    get semantic(): VertexAttributeEnum;
    /**
     * Retrieves a scalar value at the specified index as a single-element array.
     * @param i - The index of the vertex data to retrieve
     * @param option - Options for accessing indexed data
     * @returns A single-element array containing the scalar value
     */
    getScalarAsArray(i: Index, option: IndicesAccessOption): Array1<number>;
    /**
     * Retrieves a 2-component vector value at the specified index as an array.
     * @param i - The index of the vertex data to retrieve
     * @param option - Options for accessing indexed data
     * @returns A 2-element array containing the vector components [x, y]
     */
    getVec2AsArray(i: Index, option: IndicesAccessOption): Array2<number>;
    /**
     * Retrieves a 3-component vector value at the specified index as an array.
     * @param i - The index of the vertex data to retrieve
     * @param option - Options for accessing indexed data
     * @returns A 3-element array containing the vector components [x, y, z]
     */
    getVec3AsArray(i: Index, option: IndicesAccessOption): Array3<number>;
    /**
     * Retrieves a 4-component vector value at the specified index as an array.
     * @param i - The index of the vertex data to retrieve
     * @param option - Options for accessing indexed data
     * @returns A 4-element array containing the vector components [x, y, z, w]
     */
    getVec4AsArray(i: Index, option: IndicesAccessOption): Array4<number>;
}
