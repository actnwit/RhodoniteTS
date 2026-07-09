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
     * Sets the weight for a specific VRM expression.
     * This method updates the expression weight and applies it to all associated blend shape binds.
     * @param expressionName - The name of the expression to modify
     * @param weight - The weight value to apply (typically between 0 and 1)
     */
    setExpressionWeight(expressionName: VrmExpressionName, weight: number): void;
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
