import { ComponentSID, ComponentTID, EntityUID, Index } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import { IEntity } from '../../core/Entity';
import { EntityRepository } from '../../core/EntityRepository';
import { ComponentToComponentMethods } from '../ComponentTypes';
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
export declare class VrmComponent extends Component {
    private __expressions;
    private __weights;
    private __blendShapeComponent?;
    _version: string;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    setVrmExpressions(expressions: VrmExpression[]): void;
    setExpressionWeight(expressionName: VrmExpressionName, weight: number): void;
    getExpressionWeight(expressionName: VrmExpressionName): number | undefined;
    getExpressionNames(): string[];
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
