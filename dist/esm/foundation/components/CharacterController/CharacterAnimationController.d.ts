import type { AnimationTrackName } from '../../../types/AnimationTypes';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import type { CharacterControllerComponent } from './CharacterControllerComponent';
export type CharacterAnimationSemantic = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'landing' | 'slide';
export type CharacterAnimationMapping = Partial<Record<CharacterAnimationSemantic, readonly AnimationTrackName[]>>;
export interface CharacterAnimationControllerOptions {
    walkSpeedThreshold?: number;
    referenceWalkSpeed?: number;
    runSpeedThreshold?: number;
    referenceRunSpeed?: number;
    minPlaybackSpeed?: number;
    maxPlaybackSpeed?: number;
    crossFadeDuration?: number;
}
export interface CharacterAnimationSelection {
    semantic: CharacterAnimationSemantic;
    requestedTrack?: AnimationTrackName;
    activeTrack?: AnimationTrackName;
    playbackSpeed: number;
    isFallback: boolean;
    hasTrack: boolean;
    isOneShotPlaying: boolean;
}
/**
 * Maps character movement state to animation tracks and controls playback transitions.
 *
 * When tracks come from external VRMA files, assign them to `animationRoot` before creating
 * this controller. `AnimationAssigner.assignCharacterAnimationsWithVrma()` returns the
 * `CharacterAnimationMapping` accepted by this constructor. Grounded locomotion uses the
 * requested movement speed when it is available, so collision correction on steps does not
 * repeatedly switch walk and run tracks.
 */
export declare class CharacterAnimationController {
    private readonly __characterController;
    private readonly __animationRoot;
    private readonly __options;
    private readonly __mapping;
    private readonly __availableTracks;
    private readonly __animationState?;
    private __selection;
    private __playbackTime;
    private __hasSelectedTrack;
    private __oneShotEndTime?;
    private __destroyed;
    constructor(__characterController: CharacterControllerComponent, __animationRoot: ISceneGraphEntity, mapping?: CharacterAnimationMapping, options?: CharacterAnimationControllerOptions);
    get selection(): CharacterAnimationSelection;
    get availableTracks(): readonly AnimationTrackName[];
    /**
     * Applies an initial track immediately, without blending from the rest pose.
     * Call this before the first `engine.process()` when a character should
     * appear in a known pose from its first rendered frame.
     */
    initialize(semantic?: CharacterAnimationSemantic): void;
    update(deltaTime: number): void;
    destroy(): void;
    private __resolveSemantic;
    private __resolveTrack;
    private __activateTrack;
    private __resolvePlaybackSpeed;
    private __getLocomotionSpeed;
    private __collectAnimationTracks;
    private __validateOptions;
}
