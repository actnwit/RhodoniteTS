import type { ComponentSID, ComponentTID, EntityUID, Index, Offset } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * The Component that manages the blend shape.
 * Blend shapes are used for morphing and deformation animations,
 * allowing smooth transitions between different geometric states.
 */
export class BlendShapeComponent extends Component {
  private __weights: number[] = [];
  /**
   * True when `__weights` is an array owned by this component.
   * Importers and the `weights` setter may hand over arrays shared with the parsed glTF data or
   * with other nodes, so mutations must clone first (see __ensureOwnWeights).
   */
  private __ownsWeights = false;
  private __targetNames: string[] = [];

  private static __updateCount = 0;
  // Keep weight lengths per componentSID so offsets stay consistent even if a slot becomes undefined
  private static __weightsLengthBySid: number[] = [];
  /** Incremented whenever the weight layout (lengths or slot count) may have changed. */
  private static __layoutVersion = 0;
  private static __offsetsCache = new WeakMap<Engine, { layoutVersion: number; offsets: Offset[] }>();

  /**
   * Creates a new BlendShapeComponent instance.
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component system identifier
   * @param entityComponent - The entity repository for component management
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityComponent, isReUse);

    BlendShapeComponent.__layoutVersion++;
    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Gets the total number of updates performed on all BlendShapeComponent instances.
   * This is useful for tracking changes and optimization purposes.
   * @returns The current update count
   */
  static get updateCount() {
    return BlendShapeComponent.__updateCount;
  }

  /**
   * Gets the component type identifier for BlendShapeComponent.
   * This is a static method that returns the component type ID.
   * @returns The component type identifier
   */
  static get componentTID() {
    return WellKnownComponentTIDs.BlendShapeComponentTID;
  }

  /**
   * Gets the component type identifier for this BlendShapeComponent instance.
   * @returns The component type identifier
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.BlendShapeComponentTID;
  }

  /**
   * Sets the blend shape weights array.
   * Each weight value should typically be between 0.0 and 1.0,
   * representing the influence of each blend shape target.
   * @param weights - Array of weight values for blend shape targets
   */
  set weights(weights: number[]) {
    if (this.__weights.length !== weights.length) {
      BlendShapeComponent.__layoutVersion++;
    }
    this.__weights = weights;
    this.__ownsWeights = false;
    BlendShapeComponent.__weightsLengthBySid[this.componentSID] = weights.length;
    BlendShapeComponent.__updateCount++;
  }

  /**
   * Gets the current blend shape weights array.
   * @returns Array of weight values for blend shape targets
   */
  get weights() {
    return this.__weights;
  }

  /**
   * Sets the names of blend shape targets.
   * These names correspond to the blend shape targets defined in the mesh.
   * @param names - Array of target names for blend shapes
   */
  set targetNames(names: string[]) {
    this.__targetNames = names;
    BlendShapeComponent.__updateCount++;
  }

  /**
   * Gets the names of blend shape targets.
   * @returns Array of target names for blend shapes
   */
  get targetNames() {
    return this.__targetNames;
  }

  /**
   * Ensures that `__weights` is an array this component owns before mutating it in place.
   * Arrays passed to the `weights` setter may be shared with the parsed glTF data or with other
   * nodes, so the first in-place write clones them.
   */
  private __ensureOwnWeights() {
    if (!this.__ownsWeights) {
      this.__weights = this.__weights.slice();
      this.__ownsWeights = true;
    }
  }

  /**
   * Copies weights from any array-like source, skipping the update when all values are unchanged.
   * This is the allocation-free path used by animation each frame.
   * @param source - Array-like source of weight values
   */
  setWeightsFromArrayLike(source: ArrayLike<number>) {
    const length = source.length;
    if (this.__weights.length !== length) {
      const next = new Array<number>(length);
      for (let i = 0; i < length; i++) {
        next[i] = source[i];
      }
      this.__weights = next;
      this.__ownsWeights = true;
      BlendShapeComponent.__weightsLengthBySid[this.componentSID] = length;
      BlendShapeComponent.__layoutVersion++;
      BlendShapeComponent.__updateCount++;
      return;
    }

    this.__ensureOwnWeights();
    let changed = false;
    for (let i = 0; i < length; i++) {
      const value = source[i];
      if (this.__weights[i] !== value) {
        this.__weights[i] = value;
        changed = true;
      }
    }
    if (changed) {
      BlendShapeComponent.__updateCount++;
    }
  }

  /**
   * Sets the weight value for a specific blend shape target by index.
   * @param index - The index of the blend shape target
   * @param weight - The weight value to set (typically between 0.0 and 1.0)
   */
  setWeightByIndex(index: Index, weight: number) {
    if (this.__weights[index] === weight) {
      return;
    }
    this.__ensureOwnWeights();
    if (index >= this.__weights.length) {
      BlendShapeComponent.__layoutVersion++;
    }
    this.__weights[index] = weight;
    BlendShapeComponent.__weightsLengthBySid[this.componentSID] = this.__weights.length;
    BlendShapeComponent.__updateCount++;
  }

  static getOffsetsInUniform(engine: Engine): Offset[] {
    const cached = BlendShapeComponent.__offsetsCache.get(engine);
    if (cached !== undefined && cached.layoutVersion === BlendShapeComponent.__layoutVersion) {
      return cached.offsets;
    }

    const blendShapeComponents = engine.componentRepository.getComponentsWithTypeWithoutFiltering(
      BlendShapeComponent
    ) as (BlendShapeComponent | undefined)[];
    const offsets: number[] = [0];
    for (let i = 0; i < blendShapeComponents.length; i++) {
      // Keep the original slot length even if the component was deleted (undefined) to avoid offset collapse
      const len =
        blendShapeComponents[i] != null
          ? blendShapeComponents[i]!.weights.length
          : (BlendShapeComponent.__weightsLengthBySid[i] ?? 0);
      offsets.push(offsets[offsets.length - 1] + len);
    }

    BlendShapeComponent.__offsetsCache.set(engine, {
      layoutVersion: BlendShapeComponent.__layoutVersion,
      offsets,
    });
    return offsets;
  }

  /**
   * The number of vec4 of the blend shape weights in the morph weights uniform buffer of the shaders.
   *
   * @remarks
   * With `Engine._isPreviousMorphWeightsEnabled` (temporal anti-aliasing), the buffer also holds the weights of the
   * previous frame after the current ones (at `getPreviousMorphWeightsOffset`), which doubles it.
   *
   * @param engine - The engine instance
   * @returns The array length (in vec4) of the morph weights uniform buffer
   * @internal
   */
  static _getMorphWeightsVec4Count(engine: Engine): number {
    const offsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const vec4Count = Math.max(Math.ceil(offsets[offsets.length - 1] / 4), 1);
    return engine._isPreviousMorphWeightsEnabled ? vec4Count * 2 : vec4Count;
  }

  /**
   * The offset (in floats) of the weights of the previous frame in the morph weights uniform buffer.
   * Only meaningful when `Engine._isPreviousMorphWeightsEnabled` is true.
   *
   * @param engine - The engine instance
   * @returns The offset in floats
   * @internal
   */
  static _getPreviousMorphWeightsOffset(engine: Engine): number {
    const offsets = BlendShapeComponent.getOffsetsInUniform(engine);
    return Math.max(Math.ceil(offsets[offsets.length - 1] / 4), 1) * 4;
  }

  /**
   * The size (in floats) of the morph weights uniform buffer allocated by the rendering strategies.
   *
   * @param engine - The engine instance
   * @returns The number of floats
   * @internal
   */
  static _getMorphWeightsUniformBufferFloatCount(engine: Engine): number {
    const offsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const floatCount = Math.max(Math.ceil(offsets[offsets.length - 1] / 4) * 4 * 4, 4);
    return engine._isPreviousMorphWeightsEnabled ? floatCount * 2 : floatCount;
  }

  /**
   * Writes the blend shape weights of all components into the data of the morph weights uniform buffer.
   *
   * @remarks
   * With `Engine._isPreviousMorphWeightsEnabled`, the weights written by the previous call (the weights of the
   * previous frame) are first moved to the previous weights section. For a new buffer (`isNewBuffer`), the previous
   * weights are the current ones (no motion).
   *
   * @param engine - The engine instance
   * @param array - The data of the morph weights uniform buffer
   * @param isNewBuffer - Whether the buffer was just created
   * @returns The number of floats to upload from the beginning of the array
   * @internal
   */
  static _writeMorphWeightsUniformArray(engine: Engine, array: Float32Array, isNewBuffer: boolean): number {
    const offsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const elementCount = offsets[offsets.length - 1];
    const isPreviousEnabled = engine._isPreviousMorphWeightsEnabled;
    const previousOffset = BlendShapeComponent._getPreviousMorphWeightsOffset(engine);
    if (isPreviousEnabled && !isNewBuffer) {
      array.copyWithin(previousOffset, 0, elementCount);
    }
    const blendShapeComponents = engine.componentRepository.getComponentsWithTypeWithoutFiltering(
      BlendShapeComponent
    ) as (BlendShapeComponent | undefined)[];
    for (let i = 0; i < blendShapeComponents.length; i++) {
      const blendShapeComponent = blendShapeComponents[i];
      const weights = blendShapeComponent != null ? blendShapeComponent.weights : [];
      for (let j = 0; j < weights.length; j++) {
        array[offsets[i] + j] = weights[j];
      }
    }
    if (isPreviousEnabled && isNewBuffer) {
      array.copyWithin(previousOffset, 0, elementCount);
    }
    return isPreviousEnabled ? previousOffset + elementCount : elementCount;
  }

  /**
   * Makes the previous weights section equal to the current weights, in the frame after the weights stopped
   * changing (until then, it still holds the weights of two frames ago).
   *
   * @param engine - The engine instance
   * @param array - The data of the morph weights uniform buffer
   * @returns The number of floats to upload, or 0 if nothing changed
   * @internal
   */
  static _settlePreviousMorphWeights(engine: Engine, array: Float32Array): number {
    if (!engine._isPreviousMorphWeightsEnabled) {
      return 0;
    }
    const offsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const elementCount = offsets[offsets.length - 1];
    const previousOffset = BlendShapeComponent._getPreviousMorphWeightsOffset(engine);
    let isSame = true;
    for (let i = 0; i < elementCount; i++) {
      if (array[previousOffset + i] !== array[i]) {
        isSame = false;
        break;
      }
    }
    if (isSame) {
      return 0;
    }
    array.copyWithin(previousOffset, 0, elementCount);
    return previousOffset + elementCount;
  }

  static getCountOfBlendShapeComponents(engine: Engine) {
    // Called from the per-frame prerender path, so avoid allocating a filtered
    // component array just to read its length.
    return engine.componentRepository.getComponentCount(BlendShapeComponent.componentTID);
  }

  /**
   * Logic processing method called during the logic stage.
   * Currently empty but can be overridden for custom blend shape logic.
   */
  $logic() {}

  /**
   * Destroys the component and cleans up resources.
   * Calls the parent class destroy method to ensure proper cleanup.
   * @override
   */
  _destroy(): void {
    BlendShapeComponent.__layoutVersion++;
    super._destroy();
  }

  /**
   * Adds this BlendShapeComponent to an entity by extending the entity class
   * with blend shape-specific methods.
   * This method uses mixins to dynamically add component-specific functionality
   * to the target entity.
   * @template EntityBase - The base entity type
   * @template SomeComponentClass - The component class type
   * @param base - The target entity to extend
   * @param _componentClass - The component class to add (used for type inference)
   * @returns The extended entity with BlendShapeComponent methods
   * @override
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class BlendShapeEntity extends (base.constructor as any) {
      /**
       * Gets the BlendShapeComponent attached to this entity.
       * @returns The BlendShapeComponent instance or undefined if not attached
       */
      getBlendShape() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.BlendShapeComponentTID) as BlendShapeComponent;
      }
    }
    applyMixins(base, BlendShapeEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
