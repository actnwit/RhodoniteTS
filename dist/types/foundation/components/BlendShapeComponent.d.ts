import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';
export default class BlendShapeComponent extends Component {
    private __weights;
    private _dummy;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static readonly componentTID: ComponentTID;
    $logic(): void;
    weights: number[];
}
