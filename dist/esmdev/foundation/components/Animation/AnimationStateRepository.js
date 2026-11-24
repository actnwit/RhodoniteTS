// src/foundation/components/Animation/AnimationStateRepository.ts
var AnimationStateRepository = class {
  /**
   * Marks that animation bindings (channels, samplers or active tracks) may have changed.
   */
  static markAnimationBindingChanged() {
    this.ic++;
  }
  /**
   * Gets the current version of animation bindings.
   * @returns The version counter, which changes whenever animation bindings may have changed
   */
  static getAnimationBindingVersion() {
    return this.ic;
  }
  // ============================================================================
  // Global Time Management
  // ============================================================================
  /**
   * Sets the global animation time for the specified engine.
   * @param engine - The engine instance to set the global time for
   * @param time - The global animation time in seconds
   */
  static setGlobalTime(engine, time) {
    this.cc.set(engine, time);
  }
  /**
   * Gets the global animation time for the specified engine.
   * @param engine - The engine instance to get the global time for
   * @returns The global animation time for the engine, defaults to 0 if not set
   */
  static getGlobalTime(engine) {
    var _a;
    return (_a = this.cc.get(engine)) != null ? _a : 0;
  }
  // ============================================================================
  // Animation State Management
  // ============================================================================
  /**
   * Sets the animation state for the specified engine.
   * @param engine - The engine instance to set the animation state for
   * @param flag - True to enable animation, false to disable
   */
  static setIsAnimating(engine, flag) {
    this.dc.set(engine, flag);
  }
  /**
   * Gets the animation state for the specified engine.
   * @param engine - The engine instance to get the animation state for
   * @returns True if animation is enabled for the engine, defaults to true if not set
   */
  static getIsAnimating(engine) {
    var _a;
    return (_a = this.dc.get(engine)) != null ? _a : true;
  }
  // ============================================================================
  // Cached Entity UIDs Management (for early return optimization)
  // ============================================================================
  static getOrCreateCurrentFrameCachedEntityUIDs(engine) {
    let set = this.x.get(engine);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.x.set(engine, set);
    }
    return set;
  }
  static getOrCreatePreviousFrameCachedEntityUIDs(engine) {
    let set = this.y.get(engine);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.y.set(engine, set);
    }
    return set;
  }
  static setCurrentFrameCachedEntityUIDs(engine, set) {
    this.x.set(engine, set);
  }
  static setPreviousFrameCachedEntityUIDs(engine, set) {
    this.y.set(engine, set);
  }
  /**
   * Starts a new process frame for skinning-cache purposes.
   * The token is globally unique so the static skinning cache cannot be shared across engines.
   */
  static beginProcessFrame(engine) {
    const token = ++this.jc;
    this.ec.set(engine, token);
    return token;
  }
  /**
   * Gets the current process-frame token. A lazily-created token keeps manual component
   * processing safe before the first Engine.process() call.
   */
  static getProcessFrameToken(engine) {
    var _a;
    return (_a = this.ec.get(engine)) != null ? _a : this.beginProcessFrame(engine);
  }
  static getLastCacheFrameToken(engine) {
    var _a;
    return (_a = this.fc.get(engine)) != null ? _a : -1;
  }
  static setLastCacheFrameToken(engine, token) {
    this.fc.set(engine, token);
  }
  // ============================================================================
  // Cache Leaders Management
  // ============================================================================
  static getOrCreateCacheLeaders(engine) {
    let map = this.gc.get(engine);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      this.gc.set(engine, map);
    }
    return map;
  }
  static getOrCreateLeaderJointIndexToEntityUID(engine) {
    let map = this.hc.get(engine);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      this.hc.set(engine, map);
    }
    return map;
  }
  // ============================================================================
  // Frame Transition Handling
  // ============================================================================
  /**
   * Handles frame transition by swapping current/previous cached entity UIDs.
   * Should be called when a new Engine.process() frame starts.
   * @param engine - The engine instance
   * @param currentProcessFrameToken - The current Engine.process() frame token
   * @returns True if frame transition occurred, false otherwise
   */
  static handleFrameTransitionIfNeeded(engine, currentProcessFrameToken) {
    const lastCacheFrameToken = this.getLastCacheFrameToken(engine);
    if (lastCacheFrameToken !== currentProcessFrameToken) {
      const currentFrameSet = this.getOrCreateCurrentFrameCachedEntityUIDs(engine);
      this.kc(engine, currentFrameSet);
      this.setPreviousFrameCachedEntityUIDs(engine, currentFrameSet);
      this.setCurrentFrameCachedEntityUIDs(engine, /* @__PURE__ */ new Set());
      this.setLastCacheFrameToken(engine, currentProcessFrameToken);
      return true;
    }
    return false;
  }
  /**
   * Registers the joints of a frustum-culled SkeletalComponent as candidates for early return.
   *
   * A culled SkeletalComponent neither computes nor applies skinning, so its joints do not need to
   * be animated as long as another (visible) SkeletalComponent with the same cache key is the leader.
   * The candidates are resolved at the next frame transition, when the leaders of this frame are known:
   * joints that are the same entities as the leader's joints (e.g. a culled Face mesh sharing joints
   * with a visible Body mesh) keep animating.
   *
   * @param engine - The engine instance for multi-engine support
   * @param cacheKey - The skinning cache key of the culled SkeletalComponent
   * @param joints - The joints of the culled SkeletalComponent
   */
  static addCulledSkeletonJoints(engine, cacheKey, joints) {
    let pending = this.z.get(engine);
    if (!pending) {
      pending = [];
      this.z.set(engine, pending);
    }
    pending.push({ cacheKey, joints });
  }
  /**
   * Moves the joints of culled SkeletalComponents whose cache key had a leader in the finished frame
   * into the given cached EntityUID set, excluding the leader joints.
   */
  static kc(engine, cachedEntityUIDs) {
    const pending = this.z.get(engine);
    if (pending == null || pending.length === 0) {
      return;
    }
    const cacheLeaders = this.getOrCreateCacheLeaders(engine);
    const leaderJointIndexToEntityUID = this.getOrCreateLeaderJointIndexToEntityUID(engine);
    for (const { cacheKey, joints } of pending) {
      if (!cacheLeaders.has(cacheKey)) {
        continue;
      }
      for (const joint of joints) {
        const leaderEntityUID = leaderJointIndexToEntityUID.get(joint.jointIndex);
        if (leaderEntityUID !== void 0 && leaderEntityUID !== joint.entityUID) {
          cachedEntityUIDs.add(joint.entityUID);
        }
      }
    }
    pending.length = 0;
  }
  /**
   * Handles frame transition and clears leader tracking.
   * Used by SkeletalComponent.isEntityCached which runs before SkeletalComponent.$logic.
   * @param engine - The engine instance
   * @param currentProcessFrameToken - The current Engine.process() frame token
   */
  static handleFrameTransitionWithLeaderClear(engine, currentProcessFrameToken) {
    if (this.handleFrameTransitionIfNeeded(engine, currentProcessFrameToken)) {
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
  static isEntityCached(entityUID, engine) {
    const currentProcessFrameToken = this.getProcessFrameToken(engine);
    this.handleFrameTransitionWithLeaderClear(engine, currentProcessFrameToken);
    const previousFrameCachedEntityUIDs = this.getOrCreatePreviousFrameCachedEntityUIDs(engine);
    return previousFrameCachedEntityUIDs.has(entityUID);
  }
  // ============================================================================
  // Cleanup for Engine destruction
  // ============================================================================
  /**
   * Cleans up all static resources associated with the specified engine.
   * Should be called when an engine is being destroyed.
   * @param engine - The engine instance to clean up resources for
   */
  static _cleanupForEngine(engine) {
    this.cc.delete(engine);
    this.dc.delete(engine);
    this.ec.delete(engine);
    this.x.delete(engine);
    this.y.delete(engine);
    this.fc.delete(engine);
    this.gc.delete(engine);
    this.hc.delete(engine);
    this.z.delete(engine);
  }
};
/** Map to store globalTime per Engine instance for multi-engine support */
AnimationStateRepository.cc = /* @__PURE__ */ new Map();
/** Map to store isAnimating flag per Engine instance for multi-engine support */
AnimationStateRepository.dc = /* @__PURE__ */ new Map();
/**
 * Version counter of animation bindings (channels, samplers and active tracks).
 * Incremented whenever data that affects animation track feature hashes may change,
 * so that consumers (e.g. SkeletalComponent skin cache keys) can avoid recomputing every frame.
 */
AnimationStateRepository.ic = 0;
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
AnimationStateRepository.x = /* @__PURE__ */ new Map();
/**
 * Joint EntityUIDs that can skip animation - from the PREVIOUS frame.
 * AnimationComponent checks this set because it runs before SkeletalComponent.
 * Swapped from __currentFrameCachedEntityUIDs at each frame transition.
 * Managed per Engine instance for multi-engine support.
 */
AnimationStateRepository.y = /* @__PURE__ */ new Map();
/**
 * Process-frame tokens used to scope skinning-cache work to one Engine.process() call.
 * These are intentionally separate from animation playback time: local-time animations
 * may advance while the global animation clock remains unchanged.
 */
AnimationStateRepository.ec = /* @__PURE__ */ new Map();
AnimationStateRepository.jc = 0;
/**
 * Tracks the last process-frame token that swapped cached EntityUID sets.
 * Managed per Engine instance for multi-engine support.
 */
AnimationStateRepository.fc = /* @__PURE__ */ new Map();
/**
 * Maps each cache key to the EntityUID of its "leader" SkeletalComponent.
 * The leader is the first SkeletalComponent to compute skinning for a given cache key.
 * Used to identify which SkeletalComponent owns the cached skinning result.
 * Managed per Engine instance for multi-engine support.
 */
AnimationStateRepository.gc = /* @__PURE__ */ new Map();
/**
 * Maps jointIndex to the leader's joint EntityUID.
 * Used to compare follower joints with leader joints by structure (jointIndex),
 * rather than by entityUID alone.
 * Managed per Engine instance for multi-engine support.
 */
AnimationStateRepository.hc = /* @__PURE__ */ new Map();
/**
 * Joints of frustum-culled SkeletalComponents collected during the current frame.
 * They are resolved at the next frame transition, after the leaders of the frame are decided,
 * so that leader joints are never registered for early return.
 * Managed per Engine instance for multi-engine support.
 */
AnimationStateRepository.z = /* @__PURE__ */ new Map();
export {
  AnimationStateRepository
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9BbmltYXRpb24vQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEVudGl0eVVJRCB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5cbi8qKlxuICogUmVwb3NpdG9yeSBmb3IgbWFuYWdpbmcgc2hhcmVkIGFuaW1hdGlvbiBzdGF0ZSBiZXR3ZWVuIEFuaW1hdGlvbkNvbXBvbmVudCBhbmQgU2tlbGV0YWxDb21wb25lbnQuXG4gKiBUaGlzIG1vZHVsZSBleGlzdHMgdG8gYnJlYWsgdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kgYmV0d2VlbiB0aGVzZSB0d28gY29tcG9uZW50cy5cbiAqL1xuLyoqXG4gKiBKb2ludCBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gZGVjaWRlIHdoZXRoZXIgYSBqb2ludCBjYW4gc2tpcCBhbmltYXRpb24uXG4gKi9cbnR5cGUgSm9pbnRGb3JFYXJseVJldHVybiA9IHsgcmVhZG9ubHkgam9pbnRJbmRleDogbnVtYmVyOyByZWFkb25seSBlbnRpdHlVSUQ6IEVudGl0eVVJRCB9O1xuXG4vKipcbiAqIEpvaW50cyBvZiBhIGZydXN0dW0tY3VsbGVkIFNrZWxldGFsQ29tcG9uZW50LCB3YWl0aW5nIGZvciB0aGUgZnJhbWUncyBsZWFkZXJzIHRvIGJlIGRlY2lkZWQuXG4gKi9cbnR5cGUgQ3VsbGVkU2tlbGV0b25Kb2ludHMgPSB7IGNhY2hlS2V5OiBzdHJpbmc7IGpvaW50czogcmVhZG9ubHkgSm9pbnRGb3JFYXJseVJldHVybltdIH07XG5cbmV4cG9ydCBjbGFzcyBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkge1xuICAvKiogTWFwIHRvIHN0b3JlIGdsb2JhbFRpbWUgcGVyIEVuZ2luZSBpbnN0YW5jZSBmb3IgbXVsdGktZW5naW5lIHN1cHBvcnQgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nbG9iYWxUaW1lTWFwOiBNYXA8RW5naW5lLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKiBNYXAgdG8gc3RvcmUgaXNBbmltYXRpbmcgZmxhZyBwZXIgRW5naW5lIGluc3RhbmNlIGZvciBtdWx0aS1lbmdpbmUgc3VwcG9ydCAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2lzQW5pbWF0aW5nTWFwOiBNYXA8RW5naW5lLCBib29sZWFuPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogVmVyc2lvbiBjb3VudGVyIG9mIGFuaW1hdGlvbiBiaW5kaW5ncyAoY2hhbm5lbHMsIHNhbXBsZXJzIGFuZCBhY3RpdmUgdHJhY2tzKS5cbiAgICogSW5jcmVtZW50ZWQgd2hlbmV2ZXIgZGF0YSB0aGF0IGFmZmVjdHMgYW5pbWF0aW9uIHRyYWNrIGZlYXR1cmUgaGFzaGVzIG1heSBjaGFuZ2UsXG4gICAqIHNvIHRoYXQgY29uc3VtZXJzIChlLmcuIFNrZWxldGFsQ29tcG9uZW50IHNraW4gY2FjaGUga2V5cykgY2FuIGF2b2lkIHJlY29tcHV0aW5nIGV2ZXJ5IGZyYW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hbmltYXRpb25CaW5kaW5nVmVyc2lvbiA9IDA7XG5cbiAgLyoqXG4gICAqIE1hcmtzIHRoYXQgYW5pbWF0aW9uIGJpbmRpbmdzIChjaGFubmVscywgc2FtcGxlcnMgb3IgYWN0aXZlIHRyYWNrcykgbWF5IGhhdmUgY2hhbmdlZC5cbiAgICovXG4gIHN0YXRpYyBtYXJrQW5pbWF0aW9uQmluZGluZ0NoYW5nZWQoKTogdm9pZCB7XG4gICAgdGhpcy5fX2FuaW1hdGlvbkJpbmRpbmdWZXJzaW9uKys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCB2ZXJzaW9uIG9mIGFuaW1hdGlvbiBiaW5kaW5ncy5cbiAgICogQHJldHVybnMgVGhlIHZlcnNpb24gY291bnRlciwgd2hpY2ggY2hhbmdlcyB3aGVuZXZlciBhbmltYXRpb24gYmluZGluZ3MgbWF5IGhhdmUgY2hhbmdlZFxuICAgKi9cbiAgc3RhdGljIGdldEFuaW1hdGlvbkJpbmRpbmdWZXJzaW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19hbmltYXRpb25CaW5kaW5nVmVyc2lvbjtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gQW5pbWF0aW9uQ29tcG9uZW50IEVhcmx5IFJldHVybiBPcHRpbWl6YXRpb24gKG1vdmVkIGZyb20gU2tlbGV0YWxDb21wb25lbnQpXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gVGhlc2Ugc3RhdGljIG1lbWJlcnMgZW5hYmxlIEFuaW1hdGlvbkNvbXBvbmVudCB0byBza2lwIGFuaW1hdGlvbiBjYWxjdWxhdGlvbnNcbiAgLy8gZm9yIGpvaW50cyB3aG9zZSBza2lubmluZyByZXN1bHRzIGFyZSBjYWNoZWQuIFRoaXMgc2lnbmlmaWNhbnRseSBpbXByb3Zlc1xuICAvLyBwZXJmb3JtYW5jZSB3aGVuIG11bHRpcGxlIFZSTSBtb2RlbHMgc2hhcmUgdGhlIHNhbWUgc2tlbGV0b24gKGpvaW50IGVudGl0aWVzKS5cblxuICAvKipcbiAgICogSm9pbnQgRW50aXR5VUlEcyB0aGF0IGNhbiBza2lwIGFuaW1hdGlvbiBpbiB0aGUgQ1VSUkVOVCBmcmFtZS5cbiAgICogUG9wdWxhdGVkIGR1cmluZyBTa2VsZXRhbENvbXBvbmVudC4kbG9naWMgd2hlbiBjYWNoZSBoaXRzIG9jY3VyLlxuICAgKiBFeGNsdWRlcyBsZWFkZXIgam9pbnRzIHRvIGVuc3VyZSBhbmltYXRpb24gY29udGludWVzIGZvciBhdCBsZWFzdCBvbmUgc291cmNlLlxuICAgKiBNYW5hZ2VkIHBlciBFbmdpbmUgaW5zdGFuY2UgZm9yIG11bHRpLWVuZ2luZSBzdXBwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzTWFwOiBNYXA8RW5naW5lLCBTZXQ8RW50aXR5VUlEPj4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIEpvaW50IEVudGl0eVVJRHMgdGhhdCBjYW4gc2tpcCBhbmltYXRpb24gLSBmcm9tIHRoZSBQUkVWSU9VUyBmcmFtZS5cbiAgICogQW5pbWF0aW9uQ29tcG9uZW50IGNoZWNrcyB0aGlzIHNldCBiZWNhdXNlIGl0IHJ1bnMgYmVmb3JlIFNrZWxldGFsQ29tcG9uZW50LlxuICAgKiBTd2FwcGVkIGZyb20gX19jdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzIGF0IGVhY2ggZnJhbWUgdHJhbnNpdGlvbi5cbiAgICogTWFuYWdlZCBwZXIgRW5naW5lIGluc3RhbmNlIGZvciBtdWx0aS1lbmdpbmUgc3VwcG9ydC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fcHJldmlvdXNGcmFtZUNhY2hlZEVudGl0eVVJRHNNYXA6IE1hcDxFbmdpbmUsIFNldDxFbnRpdHlVSUQ+PiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogUHJvY2Vzcy1mcmFtZSB0b2tlbnMgdXNlZCB0byBzY29wZSBza2lubmluZy1jYWNoZSB3b3JrIHRvIG9uZSBFbmdpbmUucHJvY2VzcygpIGNhbGwuXG4gICAqIFRoZXNlIGFyZSBpbnRlbnRpb25hbGx5IHNlcGFyYXRlIGZyb20gYW5pbWF0aW9uIHBsYXliYWNrIHRpbWU6IGxvY2FsLXRpbWUgYW5pbWF0aW9uc1xuICAgKiBtYXkgYWR2YW5jZSB3aGlsZSB0aGUgZ2xvYmFsIGFuaW1hdGlvbiBjbG9jayByZW1haW5zIHVuY2hhbmdlZC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fcHJvY2Vzc0ZyYW1lVG9rZW5NYXA6IE1hcDxFbmdpbmUsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fbmV4dFByb2Nlc3NGcmFtZVRva2VuID0gMDtcblxuICAvKipcbiAgICogVHJhY2tzIHRoZSBsYXN0IHByb2Nlc3MtZnJhbWUgdG9rZW4gdGhhdCBzd2FwcGVkIGNhY2hlZCBFbnRpdHlVSUQgc2V0cy5cbiAgICogTWFuYWdlZCBwZXIgRW5naW5lIGluc3RhbmNlIGZvciBtdWx0aS1lbmdpbmUgc3VwcG9ydC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fbGFzdENhY2hlRnJhbWVUb2tlbk1hcDogTWFwPEVuZ2luZSwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogTWFwcyBlYWNoIGNhY2hlIGtleSB0byB0aGUgRW50aXR5VUlEIG9mIGl0cyBcImxlYWRlclwiIFNrZWxldGFsQ29tcG9uZW50LlxuICAgKiBUaGUgbGVhZGVyIGlzIHRoZSBmaXJzdCBTa2VsZXRhbENvbXBvbmVudCB0byBjb21wdXRlIHNraW5uaW5nIGZvciBhIGdpdmVuIGNhY2hlIGtleS5cbiAgICogVXNlZCB0byBpZGVudGlmeSB3aGljaCBTa2VsZXRhbENvbXBvbmVudCBvd25zIHRoZSBjYWNoZWQgc2tpbm5pbmcgcmVzdWx0LlxuICAgKiBNYW5hZ2VkIHBlciBFbmdpbmUgaW5zdGFuY2UgZm9yIG11bHRpLWVuZ2luZSBzdXBwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jYWNoZUxlYWRlcnNNYXA6IE1hcDxFbmdpbmUsIE1hcDxzdHJpbmcsIEVudGl0eVVJRD4+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBNYXBzIGpvaW50SW5kZXggdG8gdGhlIGxlYWRlcidzIGpvaW50IEVudGl0eVVJRC5cbiAgICogVXNlZCB0byBjb21wYXJlIGZvbGxvd2VyIGpvaW50cyB3aXRoIGxlYWRlciBqb2ludHMgYnkgc3RydWN0dXJlIChqb2ludEluZGV4KSxcbiAgICogcmF0aGVyIHRoYW4gYnkgZW50aXR5VUlEIGFsb25lLlxuICAgKiBNYW5hZ2VkIHBlciBFbmdpbmUgaW5zdGFuY2UgZm9yIG11bHRpLWVuZ2luZSBzdXBwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19sZWFkZXJKb2ludEluZGV4VG9FbnRpdHlVSURNYXA6IE1hcDxFbmdpbmUsIE1hcDxudW1iZXIsIEVudGl0eVVJRD4+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBKb2ludHMgb2YgZnJ1c3R1bS1jdWxsZWQgU2tlbGV0YWxDb21wb25lbnRzIGNvbGxlY3RlZCBkdXJpbmcgdGhlIGN1cnJlbnQgZnJhbWUuXG4gICAqIFRoZXkgYXJlIHJlc29sdmVkIGF0IHRoZSBuZXh0IGZyYW1lIHRyYW5zaXRpb24sIGFmdGVyIHRoZSBsZWFkZXJzIG9mIHRoZSBmcmFtZSBhcmUgZGVjaWRlZCxcbiAgICogc28gdGhhdCBsZWFkZXIgam9pbnRzIGFyZSBuZXZlciByZWdpc3RlcmVkIGZvciBlYXJseSByZXR1cm4uXG4gICAqIE1hbmFnZWQgcGVyIEVuZ2luZSBpbnN0YW5jZSBmb3IgbXVsdGktZW5naW5lIHN1cHBvcnQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3BlbmRpbmdDdWxsZWRTa2VsZXRvbkpvaW50c01hcDogTWFwPEVuZ2luZSwgQ3VsbGVkU2tlbGV0b25Kb2ludHNbXT4gPSBuZXcgTWFwKCk7XG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBHbG9iYWwgVGltZSBNYW5hZ2VtZW50XG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZ2xvYmFsIGFuaW1hdGlvbiB0aW1lIGZvciB0aGUgc3BlY2lmaWVkIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gc2V0IHRoZSBnbG9iYWwgdGltZSBmb3JcbiAgICogQHBhcmFtIHRpbWUgLSBUaGUgZ2xvYmFsIGFuaW1hdGlvbiB0aW1lIGluIHNlY29uZHNcbiAgICovXG4gIHN0YXRpYyBzZXRHbG9iYWxUaW1lKGVuZ2luZTogRW5naW5lLCB0aW1lOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fZ2xvYmFsVGltZU1hcC5zZXQoZW5naW5lLCB0aW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBnbG9iYWwgYW5pbWF0aW9uIHRpbWUgZm9yIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBnZXQgdGhlIGdsb2JhbCB0aW1lIGZvclxuICAgKiBAcmV0dXJucyBUaGUgZ2xvYmFsIGFuaW1hdGlvbiB0aW1lIGZvciB0aGUgZW5naW5lLCBkZWZhdWx0cyB0byAwIGlmIG5vdCBzZXRcbiAgICovXG4gIHN0YXRpYyBnZXRHbG9iYWxUaW1lKGVuZ2luZTogRW5naW5lKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX2dsb2JhbFRpbWVNYXAuZ2V0KGVuZ2luZSkgPz8gMDtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gQW5pbWF0aW9uIFN0YXRlIE1hbmFnZW1lbnRcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbmltYXRpb24gc3RhdGUgZm9yIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBzZXQgdGhlIGFuaW1hdGlvbiBzdGF0ZSBmb3JcbiAgICogQHBhcmFtIGZsYWcgLSBUcnVlIHRvIGVuYWJsZSBhbmltYXRpb24sIGZhbHNlIHRvIGRpc2FibGVcbiAgICovXG4gIHN0YXRpYyBzZXRJc0FuaW1hdGluZyhlbmdpbmU6IEVuZ2luZSwgZmxhZzogYm9vbGVhbikge1xuICAgIHRoaXMuX19pc0FuaW1hdGluZ01hcC5zZXQoZW5naW5lLCBmbGFnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbmltYXRpb24gc3RhdGUgZm9yIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBnZXQgdGhlIGFuaW1hdGlvbiBzdGF0ZSBmb3JcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbmltYXRpb24gaXMgZW5hYmxlZCBmb3IgdGhlIGVuZ2luZSwgZGVmYXVsdHMgdG8gdHJ1ZSBpZiBub3Qgc2V0XG4gICAqL1xuICBzdGF0aWMgZ2V0SXNBbmltYXRpbmcoZW5naW5lOiBFbmdpbmUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2lzQW5pbWF0aW5nTWFwLmdldChlbmdpbmUpID8/IHRydWU7XG4gIH1cblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIENhY2hlZCBFbnRpdHkgVUlEcyBNYW5hZ2VtZW50IChmb3IgZWFybHkgcmV0dXJuIG9wdGltaXphdGlvbilcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHN0YXRpYyBnZXRPckNyZWF0ZUN1cnJlbnRGcmFtZUNhY2hlZEVudGl0eVVJRHMoZW5naW5lOiBFbmdpbmUpOiBTZXQ8RW50aXR5VUlEPiB7XG4gICAgbGV0IHNldCA9IHRoaXMuX19jdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzTWFwLmdldChlbmdpbmUpO1xuICAgIGlmICghc2V0KSB7XG4gICAgICBzZXQgPSBuZXcgU2V0KCk7XG4gICAgICB0aGlzLl9fY3VycmVudEZyYW1lQ2FjaGVkRW50aXR5VUlEc01hcC5zZXQoZW5naW5lLCBzZXQpO1xuICAgIH1cbiAgICByZXR1cm4gc2V0O1xuICB9XG5cbiAgc3RhdGljIGdldE9yQ3JlYXRlUHJldmlvdXNGcmFtZUNhY2hlZEVudGl0eVVJRHMoZW5naW5lOiBFbmdpbmUpOiBTZXQ8RW50aXR5VUlEPiB7XG4gICAgbGV0IHNldCA9IHRoaXMuX19wcmV2aW91c0ZyYW1lQ2FjaGVkRW50aXR5VUlEc01hcC5nZXQoZW5naW5lKTtcbiAgICBpZiAoIXNldCkge1xuICAgICAgc2V0ID0gbmV3IFNldCgpO1xuICAgICAgdGhpcy5fX3ByZXZpb3VzRnJhbWVDYWNoZWRFbnRpdHlVSURzTWFwLnNldChlbmdpbmUsIHNldCk7XG4gICAgfVxuICAgIHJldHVybiBzZXQ7XG4gIH1cblxuICBzdGF0aWMgc2V0Q3VycmVudEZyYW1lQ2FjaGVkRW50aXR5VUlEcyhlbmdpbmU6IEVuZ2luZSwgc2V0OiBTZXQ8RW50aXR5VUlEPikge1xuICAgIHRoaXMuX19jdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzTWFwLnNldChlbmdpbmUsIHNldCk7XG4gIH1cblxuICBzdGF0aWMgc2V0UHJldmlvdXNGcmFtZUNhY2hlZEVudGl0eVVJRHMoZW5naW5lOiBFbmdpbmUsIHNldDogU2V0PEVudGl0eVVJRD4pIHtcbiAgICB0aGlzLl9fcHJldmlvdXNGcmFtZUNhY2hlZEVudGl0eVVJRHNNYXAuc2V0KGVuZ2luZSwgc2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgYSBuZXcgcHJvY2VzcyBmcmFtZSBmb3Igc2tpbm5pbmctY2FjaGUgcHVycG9zZXMuXG4gICAqIFRoZSB0b2tlbiBpcyBnbG9iYWxseSB1bmlxdWUgc28gdGhlIHN0YXRpYyBza2lubmluZyBjYWNoZSBjYW5ub3QgYmUgc2hhcmVkIGFjcm9zcyBlbmdpbmVzLlxuICAgKi9cbiAgc3RhdGljIGJlZ2luUHJvY2Vzc0ZyYW1lKGVuZ2luZTogRW5naW5lKTogbnVtYmVyIHtcbiAgICBjb25zdCB0b2tlbiA9ICsrdGhpcy5fX25leHRQcm9jZXNzRnJhbWVUb2tlbjtcbiAgICB0aGlzLl9fcHJvY2Vzc0ZyYW1lVG9rZW5NYXAuc2V0KGVuZ2luZSwgdG9rZW4pO1xuICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHByb2Nlc3MtZnJhbWUgdG9rZW4uIEEgbGF6aWx5LWNyZWF0ZWQgdG9rZW4ga2VlcHMgbWFudWFsIGNvbXBvbmVudFxuICAgKiBwcm9jZXNzaW5nIHNhZmUgYmVmb3JlIHRoZSBmaXJzdCBFbmdpbmUucHJvY2VzcygpIGNhbGwuXG4gICAqL1xuICBzdGF0aWMgZ2V0UHJvY2Vzc0ZyYW1lVG9rZW4oZW5naW5lOiBFbmdpbmUpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fcHJvY2Vzc0ZyYW1lVG9rZW5NYXAuZ2V0KGVuZ2luZSkgPz8gdGhpcy5iZWdpblByb2Nlc3NGcmFtZShlbmdpbmUpO1xuICB9XG5cbiAgc3RhdGljIGdldExhc3RDYWNoZUZyYW1lVG9rZW4oZW5naW5lOiBFbmdpbmUpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fbGFzdENhY2hlRnJhbWVUb2tlbk1hcC5nZXQoZW5naW5lKSA/PyAtMTtcbiAgfVxuXG4gIHN0YXRpYyBzZXRMYXN0Q2FjaGVGcmFtZVRva2VuKGVuZ2luZTogRW5naW5lLCB0b2tlbjogbnVtYmVyKSB7XG4gICAgdGhpcy5fX2xhc3RDYWNoZUZyYW1lVG9rZW5NYXAuc2V0KGVuZ2luZSwgdG9rZW4pO1xuICB9XG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBDYWNoZSBMZWFkZXJzIE1hbmFnZW1lbnRcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHN0YXRpYyBnZXRPckNyZWF0ZUNhY2hlTGVhZGVycyhlbmdpbmU6IEVuZ2luZSk6IE1hcDxzdHJpbmcsIEVudGl0eVVJRD4ge1xuICAgIGxldCBtYXAgPSB0aGlzLl9fY2FjaGVMZWFkZXJzTWFwLmdldChlbmdpbmUpO1xuICAgIGlmICghbWFwKSB7XG4gICAgICBtYXAgPSBuZXcgTWFwKCk7XG4gICAgICB0aGlzLl9fY2FjaGVMZWFkZXJzTWFwLnNldChlbmdpbmUsIG1hcCk7XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICBzdGF0aWMgZ2V0T3JDcmVhdGVMZWFkZXJKb2ludEluZGV4VG9FbnRpdHlVSUQoZW5naW5lOiBFbmdpbmUpOiBNYXA8bnVtYmVyLCBFbnRpdHlVSUQ+IHtcbiAgICBsZXQgbWFwID0gdGhpcy5fX2xlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRE1hcC5nZXQoZW5naW5lKTtcbiAgICBpZiAoIW1hcCkge1xuICAgICAgbWFwID0gbmV3IE1hcCgpO1xuICAgICAgdGhpcy5fX2xlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRE1hcC5zZXQoZW5naW5lLCBtYXApO1xuICAgIH1cbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBGcmFtZSBUcmFuc2l0aW9uIEhhbmRsaW5nXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAvKipcbiAgICogSGFuZGxlcyBmcmFtZSB0cmFuc2l0aW9uIGJ5IHN3YXBwaW5nIGN1cnJlbnQvcHJldmlvdXMgY2FjaGVkIGVudGl0eSBVSURzLlxuICAgKiBTaG91bGQgYmUgY2FsbGVkIHdoZW4gYSBuZXcgRW5naW5lLnByb2Nlc3MoKSBmcmFtZSBzdGFydHMuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBjdXJyZW50UHJvY2Vzc0ZyYW1lVG9rZW4gLSBUaGUgY3VycmVudCBFbmdpbmUucHJvY2VzcygpIGZyYW1lIHRva2VuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgZnJhbWUgdHJhbnNpdGlvbiBvY2N1cnJlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaGFuZGxlRnJhbWVUcmFuc2l0aW9uSWZOZWVkZWQoZW5naW5lOiBFbmdpbmUsIGN1cnJlbnRQcm9jZXNzRnJhbWVUb2tlbjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGFzdENhY2hlRnJhbWVUb2tlbiA9IHRoaXMuZ2V0TGFzdENhY2hlRnJhbWVUb2tlbihlbmdpbmUpO1xuICAgIGlmIChsYXN0Q2FjaGVGcmFtZVRva2VuICE9PSBjdXJyZW50UHJvY2Vzc0ZyYW1lVG9rZW4pIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRGcmFtZVNldCA9IHRoaXMuZ2V0T3JDcmVhdGVDdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzKGVuZ2luZSk7XG4gICAgICB0aGlzLl9fcmVzb2x2ZVBlbmRpbmdDdWxsZWRTa2VsZXRvbkpvaW50cyhlbmdpbmUsIGN1cnJlbnRGcmFtZVNldCk7XG4gICAgICB0aGlzLnNldFByZXZpb3VzRnJhbWVDYWNoZWRFbnRpdHlVSURzKGVuZ2luZSwgY3VycmVudEZyYW1lU2V0KTtcbiAgICAgIHRoaXMuc2V0Q3VycmVudEZyYW1lQ2FjaGVkRW50aXR5VUlEcyhlbmdpbmUsIG5ldyBTZXQoKSk7XG4gICAgICB0aGlzLnNldExhc3RDYWNoZUZyYW1lVG9rZW4oZW5naW5lLCBjdXJyZW50UHJvY2Vzc0ZyYW1lVG9rZW4pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIGpvaW50cyBvZiBhIGZydXN0dW0tY3VsbGVkIFNrZWxldGFsQ29tcG9uZW50IGFzIGNhbmRpZGF0ZXMgZm9yIGVhcmx5IHJldHVybi5cbiAgICpcbiAgICogQSBjdWxsZWQgU2tlbGV0YWxDb21wb25lbnQgbmVpdGhlciBjb21wdXRlcyBub3IgYXBwbGllcyBza2lubmluZywgc28gaXRzIGpvaW50cyBkbyBub3QgbmVlZCB0b1xuICAgKiBiZSBhbmltYXRlZCBhcyBsb25nIGFzIGFub3RoZXIgKHZpc2libGUpIFNrZWxldGFsQ29tcG9uZW50IHdpdGggdGhlIHNhbWUgY2FjaGUga2V5IGlzIHRoZSBsZWFkZXIuXG4gICAqIFRoZSBjYW5kaWRhdGVzIGFyZSByZXNvbHZlZCBhdCB0aGUgbmV4dCBmcmFtZSB0cmFuc2l0aW9uLCB3aGVuIHRoZSBsZWFkZXJzIG9mIHRoaXMgZnJhbWUgYXJlIGtub3duOlxuICAgKiBqb2ludHMgdGhhdCBhcmUgdGhlIHNhbWUgZW50aXRpZXMgYXMgdGhlIGxlYWRlcidzIGpvaW50cyAoZS5nLiBhIGN1bGxlZCBGYWNlIG1lc2ggc2hhcmluZyBqb2ludHNcbiAgICogd2l0aCBhIHZpc2libGUgQm9keSBtZXNoKSBrZWVwIGFuaW1hdGluZy5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgZm9yIG11bHRpLWVuZ2luZSBzdXBwb3J0XG4gICAqIEBwYXJhbSBjYWNoZUtleSAtIFRoZSBza2lubmluZyBjYWNoZSBrZXkgb2YgdGhlIGN1bGxlZCBTa2VsZXRhbENvbXBvbmVudFxuICAgKiBAcGFyYW0gam9pbnRzIC0gVGhlIGpvaW50cyBvZiB0aGUgY3VsbGVkIFNrZWxldGFsQ29tcG9uZW50XG4gICAqL1xuICBzdGF0aWMgYWRkQ3VsbGVkU2tlbGV0b25Kb2ludHMoZW5naW5lOiBFbmdpbmUsIGNhY2hlS2V5OiBzdHJpbmcsIGpvaW50czogcmVhZG9ubHkgSm9pbnRGb3JFYXJseVJldHVybltdKTogdm9pZCB7XG4gICAgbGV0IHBlbmRpbmcgPSB0aGlzLl9fcGVuZGluZ0N1bGxlZFNrZWxldG9uSm9pbnRzTWFwLmdldChlbmdpbmUpO1xuICAgIGlmICghcGVuZGluZykge1xuICAgICAgcGVuZGluZyA9IFtdO1xuICAgICAgdGhpcy5fX3BlbmRpbmdDdWxsZWRTa2VsZXRvbkpvaW50c01hcC5zZXQoZW5naW5lLCBwZW5kaW5nKTtcbiAgICB9XG4gICAgcGVuZGluZy5wdXNoKHsgY2FjaGVLZXksIGpvaW50cyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlcyB0aGUgam9pbnRzIG9mIGN1bGxlZCBTa2VsZXRhbENvbXBvbmVudHMgd2hvc2UgY2FjaGUga2V5IGhhZCBhIGxlYWRlciBpbiB0aGUgZmluaXNoZWQgZnJhbWVcbiAgICogaW50byB0aGUgZ2l2ZW4gY2FjaGVkIEVudGl0eVVJRCBzZXQsIGV4Y2x1ZGluZyB0aGUgbGVhZGVyIGpvaW50cy5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fcmVzb2x2ZVBlbmRpbmdDdWxsZWRTa2VsZXRvbkpvaW50cyhlbmdpbmU6IEVuZ2luZSwgY2FjaGVkRW50aXR5VUlEczogU2V0PEVudGl0eVVJRD4pOiB2b2lkIHtcbiAgICBjb25zdCBwZW5kaW5nID0gdGhpcy5fX3BlbmRpbmdDdWxsZWRTa2VsZXRvbkpvaW50c01hcC5nZXQoZW5naW5lKTtcbiAgICBpZiAocGVuZGluZyA9PSBudWxsIHx8IHBlbmRpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNhY2hlTGVhZGVycyA9IHRoaXMuZ2V0T3JDcmVhdGVDYWNoZUxlYWRlcnMoZW5naW5lKTtcbiAgICBjb25zdCBsZWFkZXJKb2ludEluZGV4VG9FbnRpdHlVSUQgPSB0aGlzLmdldE9yQ3JlYXRlTGVhZGVySm9pbnRJbmRleFRvRW50aXR5VUlEKGVuZ2luZSk7XG4gICAgZm9yIChjb25zdCB7IGNhY2hlS2V5LCBqb2ludHMgfSBvZiBwZW5kaW5nKSB7XG4gICAgICBpZiAoIWNhY2hlTGVhZGVycy5oYXMoY2FjaGVLZXkpKSB7XG4gICAgICAgIC8vIE5vIHZpc2libGUgU2tlbGV0YWxDb21wb25lbnQgY29tcHV0ZWQgdGhpcyBza2luOyBrZWVwIGFuaW1hdGluZyB0byBzdGF5IHNhZmUuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBqb2ludCBvZiBqb2ludHMpIHtcbiAgICAgICAgY29uc3QgbGVhZGVyRW50aXR5VUlEID0gbGVhZGVySm9pbnRJbmRleFRvRW50aXR5VUlELmdldChqb2ludC5qb2ludEluZGV4KTtcbiAgICAgICAgaWYgKGxlYWRlckVudGl0eVVJRCAhPT0gdW5kZWZpbmVkICYmIGxlYWRlckVudGl0eVVJRCAhPT0gam9pbnQuZW50aXR5VUlEKSB7XG4gICAgICAgICAgY2FjaGVkRW50aXR5VUlEcy5hZGQoam9pbnQuZW50aXR5VUlEKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBwZW5kaW5nLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBmcmFtZSB0cmFuc2l0aW9uIGFuZCBjbGVhcnMgbGVhZGVyIHRyYWNraW5nLlxuICAgKiBVc2VkIGJ5IFNrZWxldGFsQ29tcG9uZW50LmlzRW50aXR5Q2FjaGVkIHdoaWNoIHJ1bnMgYmVmb3JlIFNrZWxldGFsQ29tcG9uZW50LiRsb2dpYy5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGN1cnJlbnRQcm9jZXNzRnJhbWVUb2tlbiAtIFRoZSBjdXJyZW50IEVuZ2luZS5wcm9jZXNzKCkgZnJhbWUgdG9rZW5cbiAgICovXG4gIHN0YXRpYyBoYW5kbGVGcmFtZVRyYW5zaXRpb25XaXRoTGVhZGVyQ2xlYXIoZW5naW5lOiBFbmdpbmUsIGN1cnJlbnRQcm9jZXNzRnJhbWVUb2tlbjogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaGFuZGxlRnJhbWVUcmFuc2l0aW9uSWZOZWVkZWQoZW5naW5lLCBjdXJyZW50UHJvY2Vzc0ZyYW1lVG9rZW4pKSB7XG4gICAgICAvLyBDbGVhciBsZWFkZXIgdHJhY2tpbmcgZm9yIHRoZSBuZXcgZnJhbWVcbiAgICAgIGNvbnN0IGNhY2hlTGVhZGVycyA9IHRoaXMuZ2V0T3JDcmVhdGVDYWNoZUxlYWRlcnMoZW5naW5lKTtcbiAgICAgIGNvbnN0IGxlYWRlckpvaW50SW5kZXhUb0VudGl0eVVJRCA9IHRoaXMuZ2V0T3JDcmVhdGVMZWFkZXJKb2ludEluZGV4VG9FbnRpdHlVSUQoZW5naW5lKTtcbiAgICAgIGNhY2hlTGVhZGVycy5jbGVhcigpO1xuICAgICAgbGVhZGVySm9pbnRJbmRleFRvRW50aXR5VUlELmNsZWFyKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiBlbnRpdHkncyBBbmltYXRpb25Db21wb25lbnQgY2FuIHBlcmZvcm0gZWFybHkgcmV0dXJuLlxuICAgKlxuICAgKiBUaGlzIGlzIGNhbGxlZCBieSBBbmltYXRpb25Db21wb25lbnQuJGxvZ2ljIHRvIGRldGVybWluZSBpZiBhbmltYXRpb24gY2FsY3VsYXRpb25zXG4gICAqIGNhbiBiZSBza2lwcGVkLiBBbiBlbnRpdHkgaXMgY29uc2lkZXJlZCBcImNhY2hlZFwiIGlmOlxuICAgKiAxLiBJdHMgU2tlbGV0YWxDb21wb25lbnQgaGFkIGEgc2tpbm5pbmcgY2FjaGUgaGl0IGluIHRoZSBwcmV2aW91cyBmcmFtZVxuICAgKiAyLiBJdCBpcyBOT1QgYSBcImxlYWRlclwiIGpvaW50IChsZWFkZXJzIG11c3QgY29udGludWUgYW5pbWF0aW5nKVxuICAgKlxuICAgKiBAcGFyYW0gZW50aXR5VUlEIC0gVGhlIGVudGl0eSBVSUQgdG8gY2hlY2sgKHR5cGljYWxseSBhIGpvaW50L2JvbmUgZW50aXR5KVxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSBmb3IgbXVsdGktZW5naW5lIHN1cHBvcnRcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgZW50aXR5IGNhbiBza2lwIGFuaW1hdGlvbiBjYWxjdWxhdGlvbiwgZmFsc2UgaWYgaXQgbXVzdCBhbmltYXRlXG4gICAqL1xuICBzdGF0aWMgaXNFbnRpdHlDYWNoZWQoZW50aXR5VUlEOiBFbnRpdHlVSUQsIGVuZ2luZTogRW5naW5lKTogYm9vbGVhbiB7XG4gICAgLy8gSGFuZGxlIGZyYW1lIHRyYW5zaXRpb24gZmlyc3RcbiAgICBjb25zdCBjdXJyZW50UHJvY2Vzc0ZyYW1lVG9rZW4gPSB0aGlzLmdldFByb2Nlc3NGcmFtZVRva2VuKGVuZ2luZSk7XG4gICAgdGhpcy5oYW5kbGVGcmFtZVRyYW5zaXRpb25XaXRoTGVhZGVyQ2xlYXIoZW5naW5lLCBjdXJyZW50UHJvY2Vzc0ZyYW1lVG9rZW4pO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBlbnRpdHkgd2FzIHJlZ2lzdGVyZWQgYXMgXCJjYWNoZWFibGVcIiBpbiB0aGUgcHJldmlvdXMgZnJhbWUuXG4gICAgLy8gTGVhZGVyIGpvaW50cyBhcmUgTk9UIGluIHRoaXMgc2V0LCBzbyB0aGV5IHdpbGwgcmV0dXJuIGZhbHNlIGFuZCBjb250aW51ZSBhbmltYXRpbmcuXG4gICAgY29uc3QgcHJldmlvdXNGcmFtZUNhY2hlZEVudGl0eVVJRHMgPSB0aGlzLmdldE9yQ3JlYXRlUHJldmlvdXNGcmFtZUNhY2hlZEVudGl0eVVJRHMoZW5naW5lKTtcbiAgICByZXR1cm4gcHJldmlvdXNGcmFtZUNhY2hlZEVudGl0eVVJRHMuaGFzKGVudGl0eVVJRCk7XG4gIH1cblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIENsZWFudXAgZm9yIEVuZ2luZSBkZXN0cnVjdGlvblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCBhbGwgc3RhdGljIHJlc291cmNlcyBhc3NvY2lhdGVkIHdpdGggdGhlIHNwZWNpZmllZCBlbmdpbmUuXG4gICAqIFNob3VsZCBiZSBjYWxsZWQgd2hlbiBhbiBlbmdpbmUgaXMgYmVpbmcgZGVzdHJveWVkLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBjbGVhbiB1cCByZXNvdXJjZXMgZm9yXG4gICAqL1xuICBzdGF0aWMgX2NsZWFudXBGb3JFbmdpbmUoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICB0aGlzLl9fZ2xvYmFsVGltZU1hcC5kZWxldGUoZW5naW5lKTtcbiAgICB0aGlzLl9faXNBbmltYXRpbmdNYXAuZGVsZXRlKGVuZ2luZSk7XG4gICAgdGhpcy5fX3Byb2Nlc3NGcmFtZVRva2VuTWFwLmRlbGV0ZShlbmdpbmUpO1xuICAgIHRoaXMuX19jdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzTWFwLmRlbGV0ZShlbmdpbmUpO1xuICAgIHRoaXMuX19wcmV2aW91c0ZyYW1lQ2FjaGVkRW50aXR5VUlEc01hcC5kZWxldGUoZW5naW5lKTtcbiAgICB0aGlzLl9fbGFzdENhY2hlRnJhbWVUb2tlbk1hcC5kZWxldGUoZW5naW5lKTtcbiAgICB0aGlzLl9fY2FjaGVMZWFkZXJzTWFwLmRlbGV0ZShlbmdpbmUpO1xuICAgIHRoaXMuX19sZWFkZXJKb2ludEluZGV4VG9FbnRpdHlVSURNYXAuZGVsZXRlKGVuZ2luZSk7XG4gICAgdGhpcy5fX3BlbmRpbmdDdWxsZWRTa2VsZXRvbkpvaW50c01hcC5kZWxldGUoZW5naW5lKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQWlCTyxJQUFNLDJCQUFOLE1BQStCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFpQnBDLE9BQU8sOEJBQW9DO0FBQ3pDLFNBQUtBO0FBQUEsRUFDUDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxPQUFPLDZCQUFxQztBQUMxQyxXQUFPLEtBQUtBO0FBQUEsRUFDZDtBQUFB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QU07QUFDbkQsU0FBS0UsRUFBaUMsT0FBTyxNQUFNO0FBQUEsRUFDckQ7QUFDRjtBQUFBO0FBdlZhLHlCQUVJVixLQUF1QyxvQkFBSSxJQUFJO0FBQUE7QUFGbkQseUJBS0lDLEtBQXlDLG9CQUFJLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBTHJELHlCQVlJRixLQUE0QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVpoQyx5QkEwQ0lHLElBQWlFLG9CQUFJLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUExQzdFLHlCQWtESUMsSUFBa0Usb0JBQUksSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFsRDlFLHlCQXlESUUsS0FBOEMsb0JBQUksSUFBSTtBQXpEMUQseUJBMERJRCxLQUEwQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBMUQ5Qix5QkFnRUlFLEtBQWdELG9CQUFJLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFoRTVELHlCQXdFSUMsS0FBeUQsb0JBQUksSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQXhFckUseUJBZ0ZJQyxLQUF3RSxvQkFBSSxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBaEZwRix5QkF3RklFLElBQXdFLG9CQUFJLElBQUk7IiwKICAibmFtZXMiOiBbIl9fYW5pbWF0aW9uQmluZGluZ1ZlcnNpb24iLCAiX19nbG9iYWxUaW1lTWFwIiwgIl9faXNBbmltYXRpbmdNYXAiLCAiX19jdXJyZW50RnJhbWVDYWNoZWRFbnRpdHlVSURzTWFwIiwgIl9fcHJldmlvdXNGcmFtZUNhY2hlZEVudGl0eVVJRHNNYXAiLCAiX19uZXh0UHJvY2Vzc0ZyYW1lVG9rZW4iLCAiX19wcm9jZXNzRnJhbWVUb2tlbk1hcCIsICJfX2xhc3RDYWNoZUZyYW1lVG9rZW5NYXAiLCAiX19jYWNoZUxlYWRlcnNNYXAiLCAiX19sZWFkZXJKb2ludEluZGV4VG9FbnRpdHlVSURNYXAiLCAiX19yZXNvbHZlUGVuZGluZ0N1bGxlZFNrZWxldG9uSm9pbnRzIiwgIl9fcGVuZGluZ0N1bGxlZFNrZWxldG9uSm9pbnRzTWFwIl0KfQo=
