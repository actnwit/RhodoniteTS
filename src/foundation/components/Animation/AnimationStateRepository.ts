import type { EntityUID } from '../../../types/CommonTypes';
import type { Engine } from '../../system/Engine';

/**
 * Repository for managing shared animation state between AnimationComponent and SkeletalComponent.
 * This module exists to break the circular dependency between these two components.
 */
export class AnimationStateRepository {
  /** Map to store globalTime per Engine instance for multi-engine support */
  private static __globalTimeMap: Map<Engine, number> = new Map();

  /** Map to store isAnimating flag per Engine instance for multi-engine support */
  private static __isAnimatingMap: Map<Engine, boolean> = new Map();

  // ============================================================================
  // AnimationComponent Early Return Optimization (moved from SkeletalComponent)
  // ============================================================================
  // These static members enable AnimationComponent to skip animation calculations
  // for joints whose skinning results are cached. This significantly improves
  // performance when multiple VRM models share the same skeleton (joint entities).

  /**
   * Joint EntityUIDs that can skip animation in the CURRENT frame.
   * Populated during SkeletalComponent.$logic when cache hits occur.
   * Excludes leader joints to ensure animation continues for at least one source.
   * Managed per Engine instance for multi-engine support.
   */
  private static __currentFrameCachedEntityUIDsMap: Map<Engine, Set<EntityUID>> = new Map();

  /**
   * Joint EntityUIDs that can skip animation - from the PREVIOUS frame.
   * AnimationComponent checks this set because it runs before SkeletalComponent.
   * Swapped from __currentFrameCachedEntityUIDs at each frame transition.
   * Managed per Engine instance for multi-engine support.
   */
  private static __previousFrameCachedEntityUIDsMap: Map<Engine, Set<EntityUID>> = new Map();

  /**
   * Tracks the last frame's global time to detect frame transitions.
   * Used to trigger the swap of current/previous cached EntityUIDs.
   * Managed per Engine instance for multi-engine support.
   */
  private static __lastCacheFrameGlobalTimeMap: Map<Engine, number> = new Map();

  /**
   * Maps each cache key to the EntityUID of its "leader" SkeletalComponent.
   * The leader is the first SkeletalComponent to compute skinning for a given cache key.
   * Used to identify which SkeletalComponent owns the cached skinning result.
   * Managed per Engine instance for multi-engine support.
   */
  private static __cacheLeadersMap: Map<Engine, Map<string, EntityUID>> = new Map();

  /**
   * Maps jointIndex to the leader's joint EntityUID.
   * Used to compare follower joints with leader joints by structure (jointIndex),
   * rather than by entityUID alone.
   * Managed per Engine instance for multi-engine support.
   */
  private static __leaderJointIndexToEntityUIDMap: Map<Engine, Map<number, EntityUID>> = new Map();

  // ============================================================================
  // Global Time Management
  // ============================================================================

  /**
   * Sets the global animation time for the specified engine.
   * @param engine - The engine instance to set the global time for
   * @param time - The global animation time in seconds
   */
  static setGlobalTime(engine: Engine, time: number) {
    this.__globalTimeMap.set(engine, time);
  }

  /**
   * Gets the global animation time for the specified engine.
   * @param engine - The engine instance to get the global time for
   * @returns The global animation time for the engine, defaults to 0 if not set
   */
  static getGlobalTime(engine: Engine): number {
    return this.__globalTimeMap.get(engine) ?? 0;
  }

  // ============================================================================
  // Animation State Management
  // ============================================================================

  /**
   * Sets the animation state for the specified engine.
   * @param engine - The engine instance to set the animation state for
   * @param flag - True to enable animation, false to disable
   */
  static setIsAnimating(engine: Engine, flag: boolean) {
    this.__isAnimatingMap.set(engine, flag);
  }

  /**
   * Gets the animation state for the specified engine.
   * @param engine - The engine instance to get the animation state for
   * @returns True if animation is enabled for the engine, defaults to true if not set
   */
  static getIsAnimating(engine: Engine): boolean {
    return this.__isAnimatingMap.get(engine) ?? true;
  }

  // ============================================================================
  // Cached Entity UIDs Management (for early return optimization)
  // ============================================================================

  static getOrCreateCurrentFrameCachedEntityUIDs(engine: Engine): Set<EntityUID> {
    let set = this.__currentFrameCachedEntityUIDsMap.get(engine);
    if (!set) {
      set = new Set();
      this.__currentFrameCachedEntityUIDsMap.set(engine, set);
    }
    return set;
  }

  static getOrCreatePreviousFrameCachedEntityUIDs(engine: Engine): Set<EntityUID> {
    let set = this.__previousFrameCachedEntityUIDsMap.get(engine);
    if (!set) {
      set = new Set();
      this.__previousFrameCachedEntityUIDsMap.set(engine, set);
    }
    return set;
  }

  static setCurrentFrameCachedEntityUIDs(engine: Engine, set: Set<EntityUID>) {
    this.__currentFrameCachedEntityUIDsMap.set(engine, set);
  }

  static setPreviousFrameCachedEntityUIDs(engine: Engine, set: Set<EntityUID>) {
    this.__previousFrameCachedEntityUIDsMap.set(engine, set);
  }

  static getLastCacheFrameGlobalTime(engine: Engine): number {
    return this.__lastCacheFrameGlobalTimeMap.get(engine) ?? -1;
  }

  static setLastCacheFrameGlobalTime(engine: Engine, time: number) {
    this.__lastCacheFrameGlobalTimeMap.set(engine, time);
  }

  // ============================================================================
  // Cache Leaders Management
  // ============================================================================

  static getOrCreateCacheLeaders(engine: Engine): Map<string, EntityUID> {
    let map = this.__cacheLeadersMap.get(engine);
    if (!map) {
      map = new Map();
      this.__cacheLeadersMap.set(engine, map);
    }
    return map;
  }

  static getOrCreateLeaderJointIndexToEntityUID(engine: Engine): Map<number, EntityUID> {
    let map = this.__leaderJointIndexToEntityUIDMap.get(engine);
    if (!map) {
      map = new Map();
      this.__leaderJointIndexToEntityUIDMap.set(engine, map);
    }
    return map;
  }

  // ============================================================================
  // Frame Transition Handling
  // ============================================================================

  /**
   * Handles frame transition by swapping current/previous cached entity UIDs.
   * Should be called when a new frame starts (detected by globalTime change).
   * @param engine - The engine instance
   * @param currentGlobalTime - The current global time
   * @returns True if frame transition occurred, false otherwise
   */
  static handleFrameTransitionIfNeeded(engine: Engine, currentGlobalTime: number): boolean {
    const lastCacheFrameGlobalTime = this.getLastCacheFrameGlobalTime(engine);
    if (lastCacheFrameGlobalTime !== currentGlobalTime) {
      const currentFrameSet = this.getOrCreateCurrentFrameCachedEntityUIDs(engine);
      this.setPreviousFrameCachedEntityUIDs(engine, currentFrameSet);
      this.setCurrentFrameCachedEntityUIDs(engine, new Set());
      this.setLastCacheFrameGlobalTime(engine, currentGlobalTime);
      return true;
    }
    return false;
  }

  /**
   * Handles frame transition and clears leader tracking.
   * Used by SkeletalComponent.isEntityCached which runs before SkeletalComponent.$logic.
   * @param engine - The engine instance
   * @param currentGlobalTime - The current global time
   */
  static handleFrameTransitionWithLeaderClear(engine: Engine, currentGlobalTime: number): void {
    if (this.handleFrameTransitionIfNeeded(engine, currentGlobalTime)) {
      // Clear leader tracking for the new frame
      const cacheLeaders = this.getOrCreateCacheLeaders(engine);
      const leaderJointIndexToEntityUID = this.getOrCreateLeaderJointIndexToEntityUID(engine);
      cacheLeaders.clear();
      leaderJointIndexToEntityUID.clear();
    }
  }

  /**
   * Checks if an entity's AnimationComponent can perform early return.
   *
   * This is called by AnimationComponent.$logic to determine if animation calculations
   * can be skipped. An entity is considered "cached" if:
   * 1. Its SkeletalComponent had a skinning cache hit in the previous frame
   * 2. It is NOT a "leader" joint (leaders must continue animating)
   *
   * @param entityUID - The entity UID to check (typically a joint/bone entity)
   * @param engine - The engine instance for multi-engine support
   * @returns True if the entity can skip animation calculation, false if it must animate
   */
  static isEntityCached(entityUID: EntityUID, engine: Engine): boolean {
    // Handle frame transition first
    const currentGlobalTime = this.getGlobalTime(engine);
    this.handleFrameTransitionWithLeaderClear(engine, currentGlobalTime);

    // Check if this entity was registered as "cacheable" in the previous frame.
    // Leader joints are NOT in this set, so they will return false and continue animating.
    const previousFrameCachedEntityUIDs = this.getOrCreatePreviousFrameCachedEntityUIDs(engine);
    return previousFrameCachedEntityUIDs.has(entityUID);
  }
}
