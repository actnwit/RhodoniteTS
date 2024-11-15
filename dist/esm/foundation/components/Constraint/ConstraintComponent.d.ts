import { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { IVrmConstraint } from '../../constraints/IVrmConstraint';
import { Component } from '../../core/Component';
import { IEntity } from '../../core/Entity';
import { EntityRepository } from '../../core/EntityRepository';
import { IConstraintEntity } from '../../helpers/EntityHelper';
import { ComponentToComponentMethods } from '../ComponentTypes';
export declare class ConstraintComponent extends Component {
    private __vrmConstraint?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IConstraintEntity;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    $logic(): void;
    setConstraint(constraint: IVrmConstraint): void;
    _destroy(): void;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
