import type { ComponentSID, ComponentTID, EntityUID, Index, Offset } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * The Component that manages the blend shape.
 * Blend shapes are used for morphing and deformation animations,
 * allowing smooth transitions between different geometric states.
 */
export class BlendShapeComponent extends Component {
  private __weights: number[] = [];
  private __targetNames: string[] = [];

  private static __updateCount = 0;

  /**
   * Creates a new BlendShapeComponent instance.
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component system identifier
   * @param entityComponent - The entity repository for component management
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean) {
    super(entityUid, componentSid, entityComponent, isReUse);

    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Gets the total number of updates performed on all BlendShapeComponent instances.
   * This is useful for tracking changes and optimization purposes.
   * @returns The current update count
   */
  static get updateCount() {
    return this.__updateCount;
  }

  /**
   * Gets the component type identifier for BlendShapeComponent.
   * This is a static method that returns the component type ID.
   * @returns The component type identifier
   */
  static get componentTID(): ComponentTID {
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
    this.__weights = weights;
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
   * Sets the weight value for a specific blend shape target by index.
   * @param index - The index of the blend shape target
   * @param weight - The weight value to set (typically between 0.0 and 1.0)
   */
  setWeightByIndex(index: Index, weight: number) {
    this.__weights[index] = weight;
    BlendShapeComponent.__updateCount++;
  }

  static getOffsetsInUniform(): Offset[] {
    const blendShapeComponents = ComponentRepository.getComponentsWithType(
      BlendShapeComponent
    ) as BlendShapeComponent[];
    const offsets: number[] = [0];
    for (let i = 0; i < blendShapeComponents.length; i++) {
      offsets.push(offsets[offsets.length - 1] + blendShapeComponents[i].weights.length);
    }

    return offsets;
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
