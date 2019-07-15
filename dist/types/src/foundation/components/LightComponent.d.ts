import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import Vector3 from '../math/Vector3';
export default class LightComponent extends Component {
    type: import("../definitions/LightType").LightTypeEnum;
    intensity: Vector3;
    private readonly __initialdirection;
    private __direction;
    spotExponent: number;
    spotCutoff: number;
    range: number;
    private __sceneGraphComponent?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static readonly componentTID: ComponentTID;
    $create(): void;
    $logic(): void;
    readonly direction: Vector3;
}
