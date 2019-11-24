import Component from "../core/Component";
import { EntityUID, ComponentSID, ComponentTID } from "../../types/CommonTypes";
import EntityRepository from "../core/EntityRepository";
import ICameraController from "../cameras/ICameraController";
import { CameraControllerTypeEnum } from "../definitions/CameraControllerType";
export default class CameraControllerComponent extends Component {
    private __cameraComponent?;
    private __cameraController;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    set type(type: CameraControllerTypeEnum);
    $create(): void;
    $logic(): void;
    get controller(): ICameraController;
    static get componentTID(): ComponentTID;
}
