import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { PhysicsStrategy } from '../../physics/PhysicsStrategy';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
export declare class PhysicsComponent extends Component {
    private __strategy?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    setStrategy(strategy: PhysicsStrategy): void;
    get strategy(): PhysicsStrategy | undefined;
    static common_$logic(): void;
    $logic(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
