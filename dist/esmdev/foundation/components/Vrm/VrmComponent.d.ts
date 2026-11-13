import type { ComponentSID, ComponentTID, EntityUID, Index } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
export type VrmExpressionName = string;
export type VrmExpressionMorphBind = {
    entityIdx: Index;
    blendShapeIdx: Index;
    weight: number;
};
export type VrmExpression = {
    name: VrmExpressionName;
    isBinary: boolean;
    binds: VrmExpressionMorphBind[];
};
/**
 * VrmComponent is a component that manages VRM model expressions and their associated blend shapes.
 * This component handles the mapping between VRM expressions and the underlying blend shape components,
 * allowing for facial expressions and other morphing effects in VRM models.
 */
export declare class VrmComponent extends Component {
    private __expressions;
    private __weights;
    /** morph target key -> expressions that contribute to it (rebuilt when expressions change). */
    private __morphTargetContributors;
    /** expression name -> morph target keys it affects (rebuilt when expressions change). */
    private __expressionMorphTargetKeys;
    /** Reused scratch set of morph target keys affected by the current update. */
    private __changedMorphTargetKeys;
    /** True until all morph targets have been written once after the expression set changed. */
    private __needsFullMorphTargetUpdate;
    /**
     * BlendShapeComponent.updateCount observed after the last morph target application.
     * If the counter moved without this component writing, another writer (a weights animation
     * channel, an editor slider, ...) changed morph weights and they must be recomputed.
     */
    private __lastAppliedBlendShapeUpdateCount;
    _version: string;
    /**
     * Creates a new VrmComponent instance.
     * @param engine - The engine instance
     * @param entityUid - Unique identifier for the entity this component belongs to
     * @param componentSid - Unique identifier for this component instance
     * @param entityComponent - The entity repository managing this component
     * @param isReUse - Whether this component is being reused from a pool
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    /**
     * Gets the component type identifier for VrmComponent.
     * @returns The component type ID for VrmComponent
     */
    static get componentTID(): 14;
    /**
     * Gets the component type identifier for this VrmComponent instance.
     * @returns The component type ID for VrmComponent
     */
    get componentTID(): ComponentTID;
    /**
     * Sets the VRM expressions for this component.
     * This method initializes the expressions map and sets initial weights to 0.
     * @param expressions - Array of VRM expressions to register
     */
    setVrmExpressions(expressions: VrmExpression[]): void;
    /**
     * Builds the reverse index used for differential morph target updates.
     * Called only when the expression set changes, never per frame.
     */
    private __rebuildMorphTargetContributors;
    /**
     * Sets the weight for a specific VRM expression.
     * This method clamps the input, applies binary-expression behavior, and updates
     * all associated blend shape binds using the accumulated contribution from every expression.
     * @param expressionName - The name of the expression to modify
     * @param weight - The weight value to apply (typically between 0 and 1)
     */
    setExpressionWeight(expressionName: VrmExpressionName, weight: number): void;
    /**
     * Sets multiple VRM expression weights and updates only the morph targets whose total changed.
     * This is used when several expression animation channels are evaluated together.
     * @param expressionWeights - Expression names and their evaluated weights
     */
    setExpressionWeights(expressionWeights: ReadonlyMap<VrmExpressionName, number>): void;
    /**
     * Applies one expression weight.
     * @param expressionName - The expression to update
     * @param weight - The requested weight
     * @param changedKeys - Receives the morph target keys affected by a change
     * @returns True when the applied weight actually changed
     */
    private __setExpressionWeight;
    /**
     * Recomputes the given morph targets from all expression contributions.
     *
     * Multiple VRM expressions may bind the same morph target. Applying each expression directly
     * would make the result depend on map insertion order, so contributions are accumulated first.
     * The total is recomputed from the contributing expressions (not accumulated as a delta) to avoid
     * floating point drift.
     *
     * @param morphTargetKeys - Keys of the morph targets to recompute
     */
    private __applyMorphTargets;
    /**
     * Gets the current weight of a specific VRM expression.
     * @param expressionName - The name of the expression to query
     * @returns The current weight of the expression, or undefined if the expression doesn't exist
     */
    getExpressionWeight(expressionName: VrmExpressionName): number | undefined;
    /**
     * Gets all available expression names registered in this component.
     * @returns An array of all expression names
     */
    getExpressionNames(): string[];
    /**
     * Creates a shallow copy of this component from another VrmComponent.
     * This method copies the expressions, weights, and version information.
     * @param component - The source component to copy from
     * @protected
     */
    _shallowCopyFrom(component: Component): void;
    /**
     * Destroys this component and cleans up resources.
     * @protected
     */
    _destroy(): void;
    /**
     * Adds this VrmComponent to an entity by extending the entity with VRM-specific methods.
     * This method uses mixins to add a getVrm() method to the target entity.
     * @param base - The target entity to extend
     * @param _componentClass - The component class being added
     * @returns The extended entity with VRM functionality
     * @template EntityBase - The base entity type
     * @template SomeComponentClass - The component class type
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
