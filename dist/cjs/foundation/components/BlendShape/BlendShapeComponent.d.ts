import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { ComponentTID, ComponentSID, EntityUID, Index } from '../../../types/CommonTypes';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * The Component that manages the blend shape.
 */
export declare class BlendShapeComponent extends Component {
    private __weights;
    private __targetNames;
    private static __updateCount;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    static get updateCount(): number;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    set weights(weights: number[]);
    get weights(): number[];
    set targetNames(names: string[]);
    get targetNames(): string[];
    setWeightByIndex(index: Index, weight: number): void;
    $logic(): void;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
