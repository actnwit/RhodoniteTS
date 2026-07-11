import type { AnimationTrackName } from '../../../types/AnimationTypes';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { AnimationComponent } from '../Animation/AnimationComponent';
import { AnimationStateComponent } from '../AnimationState/AnimationStateComponent';
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

type ResolvedOptions = Required<CharacterAnimationControllerOptions>;

const defaultOptions: ResolvedOptions = {
  walkSpeedThreshold: 0.1,
  referenceWalkSpeed: 2.2,
  runSpeedThreshold: 3.0,
  referenceRunSpeed: 4.0,
  minPlaybackSpeed: 0.5,
  maxPlaybackSpeed: 1.5,
  crossFadeDuration: 0.15,
};

const defaultMapping: Record<CharacterAnimationSemantic, readonly AnimationTrackName[]> = {
  idle: ['Idle', 'idle'],
  walk: ['Walk', 'walk'],
  run: ['Run', 'run', 'Walk', 'walk'],
  jump: ['Jump', 'jump'],
  fall: ['Fall', 'fall'],
  landing: ['Landing', 'landing', 'Land', 'land'],
  slide: ['Slide', 'slide'],
};

const initialSelection: CharacterAnimationSelection = {
  semantic: 'fall',
  requestedTrack: 'Fall',
  playbackSpeed: 1,
  isFallback: false,
  hasTrack: false,
  isOneShotPlaying: false,
};

/**
 * Maps character movement state to animation tracks and controls playback transitions.
 *
 * When tracks come from external VRMA files, assign them to `animationRoot` before creating
 * this controller. `AnimationAssigner.assignCharacterAnimationsWithVrma()` returns the
 * `CharacterAnimationMapping` accepted by this constructor.
 */
export class CharacterAnimationController {
  private readonly __options: ResolvedOptions;
  private readonly __mapping: Record<CharacterAnimationSemantic, readonly AnimationTrackName[]>;
  private readonly __availableTracks: AnimationTrackName[];
  private readonly __animationState?: AnimationStateComponent;
  private __selection: CharacterAnimationSelection = initialSelection;
  private __playbackTime = 0;
  private __hasSelectedTrack = false;
  private __oneShotEndTime?: number;
  private __destroyed = false;

  constructor(
    private readonly __characterController: CharacterControllerComponent,
    private readonly __animationRoot: ISceneGraphEntity,
    mapping: CharacterAnimationMapping = {},
    options: CharacterAnimationControllerOptions = {}
  ) {
    this.__options = { ...defaultOptions, ...options };
    this.__validateOptions(this.__options);
    this.__mapping = {
      idle: mapping.idle ?? defaultMapping.idle,
      walk: mapping.walk ?? defaultMapping.walk,
      run: mapping.run ?? defaultMapping.run,
      jump: mapping.jump ?? defaultMapping.jump,
      fall: mapping.fall ?? defaultMapping.fall,
      landing: mapping.landing ?? defaultMapping.landing,
      slide: mapping.slide ?? defaultMapping.slide,
    };
    this.__availableTracks = this.__collectAnimationTracks(__animationRoot);
    if (this.__availableTracks.length > 0) {
      this.__animationState =
        __animationRoot.tryToGetAnimationState() ??
        __animationRoot.engine.entityRepository
          .addComponentToEntity(AnimationStateComponent, __animationRoot)
          .getAnimationState();
      this.__animationState.setUseGlobalTime(false);
    }
  }

  get selection(): CharacterAnimationSelection {
    return this.__selection;
  }

  get availableTracks(): readonly AnimationTrackName[] {
    return this.__availableTracks;
  }

  update(deltaTime: number): void {
    if (this.__destroyed) {
      return;
    }
    if (!Number.isFinite(deltaTime) || deltaTime < 0) {
      throw new Error('Character animation deltaTime must be a finite non-negative number.');
    }

    if (this.__oneShotEndTime != null) {
      this.__playbackTime += deltaTime;
      if (this.__playbackTime < this.__oneShotEndTime) {
        this.__animationState?.setTime(this.__playbackTime);
        this.__selection = { ...this.__selection, isOneShotPlaying: true };
        return;
      }
      this.__oneShotEndTime = undefined;
    }

    const semantic = this.__resolveSemantic();
    const resolved = this.__resolveTrack(semantic);
    const playbackSpeed = this.__resolvePlaybackSpeed(semantic);
    const trackChanged = resolved.activeTrack !== this.__selection.activeTrack;
    if (resolved.activeTrack != null && (trackChanged || !this.__hasSelectedTrack)) {
      const info = AnimationComponent.getAnimationInfo(this.__animationRoot.engine).get(resolved.activeTrack);
      this.__playbackTime = info?.minStartInputTime ?? 0;
      this.__animationState?.setIsLoop(semantic !== 'landing' || resolved.isFallback);
      this.__animationState?.setTime(this.__playbackTime);
      if (this.__hasSelectedTrack) {
        this.__animationState?.forceTransitionTo(resolved.activeTrack, this.__options.crossFadeDuration);
      } else {
        this.__animationState?.setFirstActiveAnimationTrack(resolved.activeTrack);
      }
      this.__hasSelectedTrack = true;
      if (semantic === 'landing' && !resolved.isFallback && info != null) {
        this.__oneShotEndTime = info.maxEndInputTime;
      }
    } else if (this.__oneShotEndTime == null) {
      this.__animationState?.setIsLoop(true);
    }

    this.__playbackTime += deltaTime * playbackSpeed;
    this.__animationState?.setTime(this.__playbackTime);
    this.__selection = {
      semantic,
      requestedTrack: this.__mapping[semantic][0],
      activeTrack: resolved.activeTrack,
      playbackSpeed,
      isFallback: resolved.isFallback,
      hasTrack: resolved.activeTrack != null,
      isOneShotPlaying: this.__oneShotEndTime != null,
    };
  }

  destroy(): void {
    this.__destroyed = true;
    this.__oneShotEndTime = undefined;
  }

  private __resolveSemantic(): CharacterAnimationSemantic {
    const motion = this.__characterController.motionState;
    switch (motion.state) {
      case 'grounded':
        if (motion.horizontalSpeed < this.__options.walkSpeedThreshold) {
          return 'idle';
        }
        return motion.horizontalSpeed >= this.__options.runSpeedThreshold ? 'run' : 'walk';
      case 'rising':
        return 'jump';
      case 'landing':
        return 'landing';
      case 'sliding':
        return 'slide';
      case 'falling':
      case 'recovering':
        return 'fall';
    }
  }

  private __resolveTrack(semantic: CharacterAnimationSemantic): {
    activeTrack?: AnimationTrackName;
    isFallback: boolean;
  } {
    const availableByLowerName = new Map(this.__availableTracks.map(track => [track.toLowerCase(), track]));
    for (const candidate of this.__mapping[semantic]) {
      const track = availableByLowerName.get(candidate.toLowerCase());
      if (track != null) {
        return { activeTrack: track, isFallback: false };
      }
    }
    for (const candidate of this.__mapping.idle) {
      const track = availableByLowerName.get(candidate.toLowerCase());
      if (track != null) {
        return { activeTrack: track, isFallback: true };
      }
    }
    return { activeTrack: this.__availableTracks[0], isFallback: this.__availableTracks.length > 0 };
  }

  private __resolvePlaybackSpeed(semantic: CharacterAnimationSemantic): number {
    if (semantic !== 'walk' && semantic !== 'run') {
      return 1;
    }
    const referenceSpeed = semantic === 'walk' ? this.__options.referenceWalkSpeed : this.__options.referenceRunSpeed;
    const ratio = this.__characterController.motionState.horizontalSpeed / referenceSpeed;
    return Math.min(this.__options.maxPlaybackSpeed, Math.max(this.__options.minPlaybackSpeed, ratio));
  }

  private __collectAnimationTracks(root: ISceneGraphEntity): AnimationTrackName[] {
    const tracks = new Set<AnimationTrackName>();
    const visit = (entity: ISceneGraphEntity) => {
      for (const track of entity.tryToGetAnimation()?.getAnimationTrackNames() ?? []) {
        tracks.add(track);
      }
      for (const child of entity.children) {
        visit(child.entity);
      }
    };
    visit(root);
    return [...tracks];
  }

  private __validateOptions(options: ResolvedOptions): void {
    const positive = [
      options.walkSpeedThreshold,
      options.referenceWalkSpeed,
      options.runSpeedThreshold,
      options.referenceRunSpeed,
      options.minPlaybackSpeed,
      options.maxPlaybackSpeed,
    ];
    if (positive.some(value => !Number.isFinite(value) || value <= 0)) {
      throw new Error('Character animation speed settings must be finite positive values.');
    }
    if (options.minPlaybackSpeed > options.maxPlaybackSpeed) {
      throw new Error('Character animation minPlaybackSpeed must not exceed maxPlaybackSpeed.');
    }
    if (options.runSpeedThreshold <= options.walkSpeedThreshold) {
      throw new Error('Character animation runSpeedThreshold must exceed walkSpeedThreshold.');
    }
    if (!Number.isFinite(options.crossFadeDuration) || options.crossFadeDuration < 0) {
      throw new Error('Character animation crossFadeDuration must be a finite non-negative value.');
    }
  }
}
