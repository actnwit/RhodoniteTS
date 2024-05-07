import { Component } from '../../core/Component';
import { EntityUID, ComponentSID, ComponentTID } from '../../../types/CommonTypes';
import { EntityRepository } from '../../core/EntityRepository';
import { ICameraController } from '../../cameras/ICameraController';
import { CameraControllerTypeEnum } from '../../definitions/CameraControllerType';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * The Component that controls camera posture.
 */
export declare class CameraControllerComponent extends Component {
    private __cameraComponent?;
    private __cameraController;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    set type(type: CameraControllerTypeEnum);
    get type(): CameraControllerTypeEnum;
    get controller(): ICameraController;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    $create(): void;
    $logic(): void;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
