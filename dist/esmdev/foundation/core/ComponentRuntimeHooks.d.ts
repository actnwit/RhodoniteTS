import type { Engine } from '../system/Engine';
/**
 * Per-engine lifecycle hooks registered by optional component modules.
 *
 * The Engine used to import AnimationComponent, AnimationStateRepository and CameraControllerComponent directly
 * for their cleanup, per-frame update and dirty checks. Those imports pulled the whole animation and camera
 * controller implementations into every application. Each optional component module now registers its hooks when it
 * is evaluated, so an application that never imports the component does not bundle it.
 */
export interface ComponentRuntimeHooks {
    /** Releases per-engine state when the engine is destroyed. */
    cleanup?(engine: Engine): void;
    /** Runs once for each Engine.process() call. */
    beginFrame?(engine: Engine): void;
    /** Returns true when the component has changed since the last processed frame. */
    isDirty?(engine: Engine): boolean;
    /** Records the state checked by isDirty() after a processed frame. */
    markUpdated?(engine: Engine): void;
}
/** Registers lifecycle hooks from an optional component module. */
export declare function registerComponentRuntimeHooks(hooks: ComponentRuntimeHooks): void;
/** @internal */
export declare function _getComponentRuntimeHooks(): readonly ComponentRuntimeHooks[];
