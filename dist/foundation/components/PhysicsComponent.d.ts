import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import { ComponentTID, ComponentSID, EntityUID } from '../../commontypes/CommonTypes';
import PhysicsStrategy from '../physics/PhysicsStrategy';
export default class PhysicsComponent extends Component {
    private __strategy;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static get componentTID(): ComponentTID;
    get strategy(): PhysicsStrategy;
    static common_$logic(): void;
    $logic(): void;
}
