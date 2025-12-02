import type { Byte, Count } from '../../types/CommonTypes';
import type { Accessor } from '../memory/Accessor';
import type { Component } from './Component';

type MemberName = string;
type IndexOfTheBufferView = number;

/**
 * A composite key for accessing component memory data.
 * Format: "ComponentClassName:MemberName:IndexOfBufferView"
 */
type AccessorKey = string;
type ByteOffsetKey = string;

/**
 * Creates a composite key for accessor lookup.
 */
function createAccessorKey(
  componentClass: typeof Component,
  memberName: MemberName,
  indexOfBufferView: IndexOfTheBufferView
): AccessorKey {
  return `${componentClass.componentTID}:${memberName}:${indexOfBufferView}`;
}

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
export class ComponentMemoryRegistry {
  /**
   * Stores accessors using composite keys.
   * Key format: "ComponentTID:MemberName:IndexOfBufferView"
   */
  private __accessors: Map<AccessorKey, Accessor> = new Map();

  /**
   * Tracks which accessor keys exist for each component class and member name.
   * This enables efficient iteration over all buffer view indices for a given member.
   */
  private __accessorKeysByMember: Map<typeof Component, Map<MemberName, Set<IndexOfTheBufferView>>> = new Map();

  /**
   * Stores the number of components per buffer view for each component class.
   */
  private __componentCountPerBufferView: Map<typeof Component, Count> = new Map();

  /**
   * Stores byte offsets using composite keys.
   * Key format: "ComponentTID:MemberName:IndexOfBufferView"
   */
  private __byteOffsetOfAccessorInBuffer: Map<ByteOffsetKey, Byte> = new Map();

  /**
   * Tracks which byte offset keys exist for each component class and member name.
   */
  private __byteOffsetKeysByMember: Map<typeof Component, Map<MemberName, Set<IndexOfTheBufferView>>> = new Map();

  /**
   * The state version, incremented when component memory layout changes.
   */
  private __stateVersion = 0;

  // ==================== Accessor Methods ====================

  /**
   * Gets an accessor for a specific component member and buffer view index.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @param indexOfBufferView - The buffer view index
   * @returns The accessor or undefined if not found
   */
  getAccessor(
    componentClass: typeof Component,
    memberName: MemberName,
    indexOfBufferView: IndexOfTheBufferView
  ): Accessor | undefined {
    const key = createAccessorKey(componentClass, memberName, indexOfBufferView);
    return this.__accessors.get(key);
  }

  /**
   * Sets an accessor for a specific component member and buffer view index.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @param indexOfBufferView - The buffer view index
   * @param accessor - The accessor to store
   */
  setAccessor(
    componentClass: typeof Component,
    memberName: MemberName,
    indexOfBufferView: IndexOfTheBufferView,
    accessor: Accessor
  ): void {
    const key = createAccessorKey(componentClass, memberName, indexOfBufferView);
    this.__accessors.set(key, accessor);

    // Track the key for iteration
    if (!this.__accessorKeysByMember.has(componentClass)) {
      this.__accessorKeysByMember.set(componentClass, new Map());
    }
    const memberMap = this.__accessorKeysByMember.get(componentClass)!;
    if (!memberMap.has(memberName)) {
      memberMap.set(memberName, new Set());
    }
    memberMap.get(memberName)!.add(indexOfBufferView);

    this.__stateVersion++;
  }

  /**
   * Gets all accessors for a specific component member across all buffer view indices.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @returns A Map of buffer view indices to accessors
   */
  getAccessorsForMember(componentClass: typeof Component, memberName: MemberName): Map<IndexOfTheBufferView, Accessor> {
    const result = new Map<IndexOfTheBufferView, Accessor>();
    const memberMap = this.__accessorKeysByMember.get(componentClass);
    if (memberMap == null) {
      return result;
    }
    const indices = memberMap.get(memberName);
    if (indices == null) {
      return result;
    }
    for (const index of indices) {
      const accessor = this.getAccessor(componentClass, memberName, index);
      if (accessor != null) {
        result.set(index, accessor);
      }
    }
    return result;
  }

  /**
   * Checks if accessors exist for a specific component class.
   *
   * @param componentClass - The component class to check
   * @returns True if accessors exist for the component class
   */
  hasAccessorsForComponent(componentClass: typeof Component): boolean {
    return this.__accessorKeysByMember.has(componentClass);
  }

  /**
   * Ensures accessor tracking maps are initialized for a component class.
   *
   * @param componentClass - The component class
   */
  ensureAccessorMapsForComponent(componentClass: typeof Component): void {
    if (!this.__accessorKeysByMember.has(componentClass)) {
      this.__accessorKeysByMember.set(componentClass, new Map());
    }
  }

  // ==================== Component Count Methods ====================

  /**
   * Gets the number of components per buffer view for a component class.
   *
   * @param componentClass - The component class
   * @returns The count or undefined if not set
   */
  getComponentCountPerBufferView(componentClass: typeof Component): Count | undefined {
    return this.__componentCountPerBufferView.get(componentClass);
  }

  /**
   * Sets the number of components per buffer view for a component class.
   *
   * @param componentClass - The component class
   * @param count - The number of components per buffer view
   */
  setComponentCountPerBufferView(componentClass: typeof Component, count: Count): void {
    this.__componentCountPerBufferView.set(componentClass, count);
  }

  /**
   * Gets all component count per buffer view entries.
   *
   * @returns A copy of the component count map
   */
  getAllComponentCountPerBufferView(): Map<typeof Component, Count> {
    return new Map(this.__componentCountPerBufferView);
  }

  // ==================== Byte Offset Methods ====================

  /**
   * Gets the byte offset for a specific component member and buffer view index.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @param indexOfBufferView - The buffer view index
   * @returns The byte offset or undefined if not found
   */
  getByteOffset(
    componentClass: typeof Component,
    memberName: MemberName,
    indexOfBufferView: IndexOfTheBufferView
  ): Byte | undefined {
    const key = createAccessorKey(componentClass, memberName, indexOfBufferView);
    return this.__byteOffsetOfAccessorInBuffer.get(key);
  }

  /**
   * Sets the byte offset for a specific component member and buffer view index.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @param indexOfBufferView - The buffer view index
   * @param byteOffset - The byte offset to store
   */
  setByteOffset(
    componentClass: typeof Component,
    memberName: MemberName,
    indexOfBufferView: IndexOfTheBufferView,
    byteOffset: Byte
  ): void {
    const key = createAccessorKey(componentClass, memberName, indexOfBufferView);
    this.__byteOffsetOfAccessorInBuffer.set(key, byteOffset);

    // Track the key for iteration
    if (!this.__byteOffsetKeysByMember.has(componentClass)) {
      this.__byteOffsetKeysByMember.set(componentClass, new Map());
    }
    const memberMap = this.__byteOffsetKeysByMember.get(componentClass)!;
    if (!memberMap.has(memberName)) {
      memberMap.set(memberName, new Set());
    }
    memberMap.get(memberName)!.add(indexOfBufferView);
  }

  /**
   * Gets all byte offsets for a specific component member.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @returns A Map of buffer view indices to byte offsets
   */
  getByteOffsetsForMember(
    componentClass: typeof Component,
    memberName: MemberName
  ): Map<IndexOfTheBufferView, Byte> | undefined {
    const result = new Map<IndexOfTheBufferView, Byte>();
    const memberMap = this.__byteOffsetKeysByMember.get(componentClass);
    if (memberMap == null) {
      return undefined;
    }
    const indices = memberMap.get(memberName);
    if (indices == null) {
      return undefined;
    }
    for (const index of indices) {
      const offset = this.getByteOffset(componentClass, memberName, index);
      if (offset != null) {
        result.set(index, offset);
      }
    }
    return result;
  }

  /**
   * Checks if byte offset data exists for a specific component class.
   *
   * @param componentClass - The component class to check
   * @returns True if byte offset data exists
   */
  hasByteOffsetsForComponent(componentClass: typeof Component): boolean {
    return this.__byteOffsetKeysByMember.has(componentClass);
  }

  // ==================== State Version ====================

  /**
   * Gets the current state version.
   * This is incremented whenever the memory layout changes.
   *
   * @returns The current state version
   */
  getStateVersion(): number {
    return this.__stateVersion;
  }

  /**
   * Increments and returns the new state version.
   *
   * @returns The new state version
   */
  incrementStateVersion(): number {
    return ++this.__stateVersion;
  }
}
