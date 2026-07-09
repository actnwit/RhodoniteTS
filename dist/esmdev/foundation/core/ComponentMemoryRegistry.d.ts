import type { Byte, Count } from '../../types/CommonTypes';
import type { Accessor } from '../memory/Accessor';
import type { Component } from './Component';
type MemberName = string;
type IndexOfTheBufferView = number;
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
