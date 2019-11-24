import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';
export default class BlendShapeComponent extends Component {
    private __weights;
    private _dummy;
    private __meshComponent?;
    private __targetNames;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static get componentTID(): ComponentTID;
    $create(): void;
    $logic(): void;
    set weights(weights: number[]);
    get weights(): number[];
    set targetNames(names: string[]);
    get targetNames(): string[];
}
