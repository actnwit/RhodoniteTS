import type { Byte, ComponentSID, Count, IndexOf16Bytes } from '../../types/CommonTypes';
import type { Accessor } from '../memory/Accessor';
import type { BufferView } from '../memory/BufferView';
import type { Component } from './Component';
type MemberName = string;
type IndexOfTheBufferView = number;
/**
 * A chunk of memory allocated for a variable-length array member of a component.
 */
export type VariableLengthChunk = {
    /** The buffer view which owns the memory of the chunk */
    bufferView: BufferView;
    /** The capacity of the chunk in bytes */
    byteCapacity: Byte;
    /** The location of the chunk in the GPU data (index of 16 bytes) */
    location: IndexOf16Bytes;
};
/**
 * ComponentMemoryRegistry manages memory-related data for components per Engine instance.
 *
 * This class consolidates what were previously static Maps in the Component class,
 * reducing nesting depth and making the code more maintainable.
 *
 * @remarks
 * Previously, Component had deeply nested static Maps like:
 * `Map<EngineObjectUID, Map<typeof Component, Map<MemberName, Map<IndexOfTheBufferView, Accessor>>>>`
 *
 * This class flattens the structure by:
 * 1. Being owned by Engine (removing the EngineObjectUID layer)
 * 2. Using composite string keys (reducing Map nesting from 3 levels to 1)
 */
export declare class ComponentMemoryRegistry {
    /**
     * Stores accessors using composite keys.
     * Key format: "ComponentTID:MemberName:IndexOfBufferView"
     */
    private __accessors;
    /**
     * Tracks which accessor keys exist for each component class and member name.
     * This enables efficient iteration over all buffer view indices for a given member.
     */
    private __accessorKeysByMember;
    /**
     * Stores the number of components per buffer view for each component class.
     */
    private __componentCountPerBufferView;
    /**
     * Stores byte offsets using composite keys.
     * Key format: "ComponentTID:MemberName:IndexOfBufferView"
     */
    private __byteOffsetOfAccessorInBuffer;
    /**
     * Tracks which byte offset keys exist for each component class and member name.
     */
    private __byteOffsetKeysByMember;
    /**
     * Chunks of variable-length array members, per component SID.
     * Key format: "ComponentTID:MemberName:ComponentSID"
     */
    private __variableLengthChunks;
    /**
     * Chunks of variable-length array members which are no longer used, per member.
     * Key format: "ComponentTID:MemberName"
     */
    private __freeVariableLengthChunks;
    /**
     * The state version, incremented when component memory layout changes.
     */
    private __stateVersion;
    /**
     * Gets an accessor for a specific component member and buffer view index.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the member field
     * @param indexOfBufferView - The buffer view index
     * @returns The accessor or undefined if not found
     */
    getAccessor(componentClass: typeof Component, memberName: MemberName, indexOfBufferView: IndexOfTheBufferView): Accessor | undefined;
    /**
     * Sets an accessor for a specific component member and buffer view index.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the member field
     * @param indexOfBufferView - The buffer view index
     * @param accessor - The accessor to store
     */
    setAccessor(componentClass: typeof Component, memberName: MemberName, indexOfBufferView: IndexOfTheBufferView, accessor: Accessor): void;
    /**
     * Gets all accessors for a specific component member across all buffer view indices.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the member field
     * @returns A Map of buffer view indices to accessors
     */
    getAccessorsForMember(componentClass: typeof Component, memberName: MemberName): Map<IndexOfTheBufferView, Accessor>;
    /**
     * Checks if accessors exist for a specific component class.
     *
     * @param componentClass - The component class to check
     * @returns True if accessors exist for the component class
     */
    hasAccessorsForComponent(componentClass: typeof Component): boolean;
    /**
     * Ensures accessor tracking maps are initialized for a component class.
     *
     * @param componentClass - The component class
     */
    ensureAccessorMapsForComponent(componentClass: typeof Component): void;
    /**
     * Gets the number of components per buffer view for a component class.
     *
     * @param componentClass - The component class
     * @returns The count or undefined if not set
     */
    getComponentCountPerBufferView(componentClass: typeof Component): Count | undefined;
    /**
     * Sets the number of components per buffer view for a component class.
     *
     * @param componentClass - The component class
     * @param count - The number of components per buffer view
     */
    setComponentCountPerBufferView(componentClass: typeof Component, count: Count): void;
    /**
     * Gets all component count per buffer view entries.
     *
     * @returns A copy of the component count map
     */
    getAllComponentCountPerBufferView(): Map<typeof Component, Count>;
    /**
     * Gets the byte offset for a specific component member and buffer view index.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the member field
     * @param indexOfBufferView - The buffer view index
     * @returns The byte offset or undefined if not found
     */
    getByteOffset(componentClass: typeof Component, memberName: MemberName, indexOfBufferView: IndexOfTheBufferView): Byte | undefined;
    /**
     * Sets the byte offset for a specific component member and buffer view index.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the member field
     * @param indexOfBufferView - The buffer view index
     * @param byteOffset - The byte offset to store
     */
    setByteOffset(componentClass: typeof Component, memberName: MemberName, indexOfBufferView: IndexOfTheBufferView, byteOffset: Byte): void;
    /**
     * Gets all byte offsets for a specific component member.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the member field
     * @returns A Map of buffer view indices to byte offsets
     */
    getByteOffsetsForMember(componentClass: typeof Component, memberName: MemberName): Map<IndexOfTheBufferView, Byte> | undefined;
    /**
     * Checks if byte offset data exists for a specific component class.
     *
     * @param componentClass - The component class to check
     * @returns True if byte offset data exists
     */
    hasByteOffsetsForComponent(componentClass: typeof Component): boolean;
    /**
     * Gets the chunk of a variable-length array member of a component.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the variable-length array member
     * @param componentSID - The component SID
     * @returns The chunk or undefined if not allocated yet
     */
    getVariableLengthChunk(componentClass: typeof Component, memberName: MemberName, componentSID: ComponentSID): VariableLengthChunk | undefined;
    /**
     * Sets the chunk of a variable-length array member of a component.
     * Note that this does not change the state version, since shaders read the locations of chunks at runtime.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the variable-length array member
     * @param componentSID - The component SID
     * @param chunk - The chunk to set
     */
    setVariableLengthChunk(componentClass: typeof Component, memberName: MemberName, componentSID: ComponentSID, chunk: VariableLengthChunk): void;
    /**
     * Puts a chunk which is no longer used into the free list so that it can be reused.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the variable-length array member
     * @param chunk - The chunk to release
     */
    releaseVariableLengthChunk(componentClass: typeof Component, memberName: MemberName, chunk: VariableLengthChunk): void;
    /**
     * Takes the smallest free chunk which has enough capacity.
     *
     * @param componentClass - The component class
     * @param memberName - The name of the variable-length array member
     * @param byteLength - The required byte length
     * @returns The chunk, or undefined if there is no suitable free chunk
     */
    takeFreeVariableLengthChunk(componentClass: typeof Component, memberName: MemberName, byteLength: Byte): VariableLengthChunk | undefined;
    /**
     * Gets the current state version.
     * This is incremented whenever the memory layout changes.
     *
     * @returns The current state version
     */
    getStateVersion(): number;
    /**
     * Increments and returns the new state version.
     *
     * @returns The new state version
     */
    incrementStateVersion(): number;
    /**
     * Clears all stored data and resets the registry to its initial state.
     * Should be called when the engine is being destroyed.
     */
    destroy(): void;
}
export {};
