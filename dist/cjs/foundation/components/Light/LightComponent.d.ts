import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { Vector3 } from '../../math/Vector3';
import { ComponentTID, EntityUID, ComponentSID } from '../../../types/CommonTypes';
import { ILightEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * The Component that represents a light.
 *
 * @remarks
 * the light looks towards the local -Z axis in right hand coordinate system.
 */
export declare class LightComponent extends Component {
    type: import("../..").EnumIO;
    private __intensity;
    private readonly __initialDirection;
    private __direction;
    innerConeAngle: number;
    outerConeAngle: number;
    range: number;
    enable: boolean;
    shadowAreaSizeForDirectionalLight: number;
    private static __globalDataRepository;
    private static __tmp_vec4;
    private static __lightPositions;
    private static __lightDirections;
    private static __lightIntensities;
    private static __lightProperties;
    private static __lightNumber;
    private __lightGizmo?;
    private __updateCount;
    private __lastUpdateCount;
    private __lastTransformUpdateCount;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get updateCount(): number;
    get direction(): Vector3;
    set intensity(value: Vector3);
    get intensity(): Vector3;
    get _up(): Vector3;
    set isLightGizmoVisible(flg: boolean);
    get isLightGizmoVisible(): boolean;
    $load(): void;
    private __updateGizmo;
    static common_$logic(): void;
    $logic(): void;
    _destroy(): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ILightEntity;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
