import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
export default class MeshComponent extends Component {
    private __primitives;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static readonly componentTID: ComponentTID;
    addPrimitive(primitive: Primitive): void;
    getPrimitiveAt(i: number): Primitive;
    getPrimitiveNumber(): number;
}
