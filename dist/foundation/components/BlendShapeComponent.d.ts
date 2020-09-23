import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import { ComponentTID, ComponentSID, EntityUID } from '../../commontypes/CommonTypes';
export default class BlendShapeComponent extends Component {
    private __weights;
    private __targetNames;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static get componentTID(): ComponentTID;
    set weights(weights: number[]);
    get weights(): number[];
    set targetNames(names: string[]);
    get targetNames(): string[];
    $logic(): void;
}
