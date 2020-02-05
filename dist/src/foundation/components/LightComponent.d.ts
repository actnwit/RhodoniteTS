import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import Vector3 from '../math/Vector3';
import { ComponentTID, EntityUID, ComponentSID } from '../../types/CommonTypes';
export default class LightComponent extends Component {
    type: import("../definitions/LightType").LightTypeEnum;
    private __intensity;
    private readonly __initialdirection;
    private __direction;
    spotExponent: number;
    spotCutoff: number;
    range: number;
    private __sceneGraphComponent?;
    private static __componentRepository;
    private static __globalDataRepository;
    private static __tmp_vec4;
    private static __lightPositions;
    private static __lightDirections;
    private static __lightIntensities;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    $create(): void;
    $load(): void;
    $logic(): void;
    get direction(): Vector3;
    set intensity(value: Vector3);
    get intensity(): Vector3;
}
