import type { ComponentSID, ComponentTID, EntityUID, Index, Offset } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * The Component that manages the blend shape.
 * Blend shapes are used for morphing and deformation animations,
 * allowing smooth transitions between different geometric states.
 */
export declare class BlendShapeComponent extends Component {
    private __weights;
    private __targetNames;
    private static __updateCount;
    private static __weightsLengthBySid;
    /**
     * Creates a new BlendShapeComponent instance.
     * @param engine - The engine instance
     * @param entityUid - The unique identifier of the entity this component belongs to
     * @param componentSid - The component system identifier
     * @param entityComponent - The entity repository for component management
     * @param isReUse - Whether this component is being reused from a pool
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    /**
     * Gets the total number of updates performed on all BlendShapeComponent instances.
     * This is useful for tracking changes and optimization purposes.
     * @returns The current update count
     */
    static get updateCount(): number;
    /**
     * Gets the component type identifier for BlendShapeComponent.
     * This is a static method that returns the component type ID.
     * @returns The component type identifier
     */
    static get componentTID(): 11;
    /**
     * Gets the component type identifier for this BlendShapeComponent instance.
     * @returns The component type identifier
     */
    get componentTID(): ComponentTID;
    /**
     * Sets the blend shape weights array.
     * Each weight value should typically be between 0.0 and 1.0,
     * representing the influence of each blend shape target.
     * @param weights - Array of weight values for blend shape targets
     */
    set weights(weights: number[]);
    /**
     * Gets the current blend shape weights array.
     * @returns Array of weight values for blend shape targets
     */
    get weights(): number[];
    /**
     * Sets the names of blend shape targets.
     * These names correspond to the blend shape targets defined in the mesh.
     * @param names - Array of target names for blend shapes
     */
    set targetNames(names: string[]);
    /**
     * Gets the names of blend shape targets.
     * @returns Array of target names for blend shapes
     */
    get targetNames(): string[];
    /**
     * Sets the weight value for a specific blend shape target by index.
     * @param index - The index of the blend shape target
     * @param weight - The weight value to set (typically between 0.0 and 1.0)
     */
    setWeightByIndex(index: Index, weight: number): void;
    static getOffsetsInUniform(engine: Engine): Offset[];
    static getCountOfBlendShapeComponents(engine: Engine): number;
    /**
     * Logic processing method called during the logic stage.
     * Currently empty but can be overridden for custom blend shape logic.
     */
    $logic(): void;
    /**
     * Destroys the component and cleans up resources.
     * Calls the parent class destroy method to ensure proper cleanup.
     * @override
     */
    _destroy(): void;
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
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
