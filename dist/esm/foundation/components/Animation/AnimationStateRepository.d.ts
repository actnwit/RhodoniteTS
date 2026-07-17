import type { EntityUID } from '../../../types/CommonTypes';
import type { Engine } from '../../system/Engine';
/**
 * Repository for managing shared animation state between AnimationComponent and SkeletalComponent.
 * This module exists to break the circular dependency between these two components.
 */
export declare class AnimationStateRepository {
    /** Map to store globalTime per Engine instance for multi-engine support */
    private static __globalTimeMap;
    /** Map to store isAnimating flag per Engine instance for multi-engine support */
    private static __isAnimatingMap;
    /**
     * Joint EntityUIDs that can skip animation in the CURRENT frame.
     * Populated during SkeletalComponent.$logic when cache hits occur.
     * Excludes leader joints to ensure animation continues for at least one source.
     * Managed per Engine instance for multi-engine support.
     */
    private static __currentFrameCachedEntityUIDsMap;
    /**
     * Joint EntityUIDs that can skip animation - from the PREVIOUS frame.
     * AnimationComponent checks this set because it runs before SkeletalComponent.
     * Swapped from __currentFrameCachedEntityUIDs at each frame transition.
     * Managed per Engine instance for multi-engine support.
     */
    private static __previousFrameCachedEntityUIDsMap;
    /**
     * Process-frame tokens used to scope skinning-cache work to one Engine.process() call.
     * These are intentionally separate from animation playback time: local-time animations
     * may advance while the global animation clock remains unchanged.
     */
    private static __processFrameTokenMap;
    private static __nextProcessFrameToken;
    /**
     * Tracks the last process-frame token that swapped cached EntityUID sets.
     * Managed per Engine instance for multi-engine support.
     */
    private static __lastCacheFrameTokenMap;
    /**
     * Maps each cache key to the EntityUID of its "leader" SkeletalComponent.
     * The leader is the first SkeletalComponent to compute skinning for a given cache key.
     * Used to identify which SkeletalComponent owns the cached skinning result.
     * Managed per Engine instance for multi-engine support.
     */
    private static __cacheLeadersMap;
    /**
     * Maps jointIndex to the leader's joint EntityUID.
     * Used to compare follower joints with leader joints by structure (jointIndex),
     * rather than by entityUID alone.
     * Managed per Engine instance for multi-engine support.
     */
    private static __leaderJointIndexToEntityUIDMap;
    /**
     * Sets the global animation time for the specified engine.
     * @param engine - The engine instance to set the global time for
     * @param time - The global animation time in seconds
     */
    static setGlobalTime(engine: Engine, time: number): void;
    /**
     * Gets the global animation time for the specified engine.
     * @param engine - The engine instance to get the global time for
     * @returns The global animation time for the engine, defaults to 0 if not set
     */
    static getGlobalTime(engine: Engine): number;
    /**
     * Sets the animation state for the specified engine.
     * @param engine - The engine instance to set the animation state for
     * @param flag - True to enable animation, false to disable
     */
    static setIsAnimating(engine: Engine, flag: boolean): void;
    /**
     * Gets the animation state for the specified engine.
     * @param engine - The engine instance to get the animation state for
     * @returns True if animation is enabled for the engine, defaults to true if not set
     */
    static getIsAnimating(engine: Engine): boolean;
    static getOrCreateCurrentFrameCachedEntityUIDs(engine: Engine): Set<EntityUID>;
    static getOrCreatePreviousFrameCachedEntityUIDs(engine: Engine): Set<EntityUID>;
    static setCurrentFrameCachedEntityUIDs(engine: Engine, set: Set<EntityUID>): void;
    static setPreviousFrameCachedEntityUIDs(engine: Engine, set: Set<EntityUID>): void;
    /**
     * Starts a new process frame for skinning-cache purposes.
     * The token is globally unique so the static skinning cache cannot be shared across engines.
     */
    static beginProcessFrame(engine: Engine): number;
    /**
     * Gets the current process-frame token. A lazily-created token keeps manual component
     * processing safe before the first Engine.process() call.
     */
    static getProcessFrameToken(engine: Engine): number;
    static getLastCacheFrameToken(engine: Engine): number;
    static setLastCacheFrameToken(engine: Engine, token: number): void;
    static getOrCreateCacheLeaders(engine: Engine): Map<string, EntityUID>;
    static getOrCreateLeaderJointIndexToEntityUID(engine: Engine): Map<number, EntityUID>;
    /**
     * Handles frame transition by swapping current/previous cached entity UIDs.
     * Should be called when a new Engine.process() frame starts.
     * @param engine - The engine instance
     * @param currentProcessFrameToken - The current Engine.process() frame token
     * @returns True if frame transition occurred, false otherwise
     */
    static handleFrameTransitionIfNeeded(engine: Engine, currentProcessFrameToken: number): boolean;
    /**
     * Handles frame transition and clears leader tracking.
     * Used by SkeletalComponent.isEntityCached which runs before SkeletalComponent.$logic.
     * @param engine - The engine instance
     * @param currentProcessFrameToken - The current Engine.process() frame token
     */
    static handleFrameTransitionWithLeaderClear(engine: Engine, currentProcessFrameToken: number): void;
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
    static isEntityCached(entityUID: EntityUID, engine: Engine): boolean;
    /**
     * Cleans up all static resources associated with the specified engine.
     * Should be called when an engine is being destroyed.
     * @param engine - The engine instance to clean up resources for
     */
    static _cleanupForEngine(engine: Engine): void;
}
