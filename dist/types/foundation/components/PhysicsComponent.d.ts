import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';
import PhysicsStrategy from '../physics/PhysicsStrategy';
export default class PhysicsComponent extends Component {
    private __weights;
    private _dummy;
    private __strategy;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static readonly componentTID: ComponentTID;
    $create(): void;
    $logic(): void;
    static common_$logic(): void;
    readonly strategy: PhysicsStrategy;
}
