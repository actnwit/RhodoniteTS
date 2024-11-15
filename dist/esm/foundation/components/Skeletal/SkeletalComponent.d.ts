import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { Matrix44 } from '../../math/Matrix44';
import { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { MutableVector4 } from '../../math/MutableVector4';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { ComponentTID, ComponentSID, EntityUID, Index } from '../../../types/CommonTypes';
import { IMatrix44 } from '../../math/IMatrix';
import { Accessor } from '../../memory/Accessor';
import { ISkeletalEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
export declare class SkeletalComponent extends Component {
    _jointIndices: Index[];
    private __joints;
    private __inverseBindMatricesAccessor?;
    _bindShapeMatrix?: Matrix44;
    private __jointMatrices?;
    topOfJointsHierarchy?: SceneGraphComponent;
    isSkinning: boolean;
    private __qArray;
    private __tsArray;
    private __tqArray;
    private __sqArray;
    private __qtsArray;
    private __qtsInfo;
    private __matArray;
    private __worldMatrix;
    private __isWorldMatrixVanilla;
    _isCulled: boolean;
    private static __globalDataRepository;
    private static __tookGlobalDataNum;
    private static __tmpVec3_0;
    private static __tmp_mat4;
    private static __tmp_q;
    private static __identityMat;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    setInverseBindMatricesAccessor(inverseBindMatricesAccessor: Accessor): void;
    setJoints(joints: SceneGraphComponent[]): void;
    getJoints(): SceneGraphComponent[];
    get rootJointWorldMatrixInner(): MutableMatrix44 | undefined;
    get jointMatrices(): number[] | undefined;
    get jointQuaternionArray(): Float32Array;
    get jointTranslateScaleArray(): Float32Array;
    get jointTranslatePackedQuat(): Float32Array;
    get jointScalePackedQuat(): Float32Array;
    get jointMatricesArray(): Float32Array;
    get jointCompressedChunk(): Float32Array;
    get jointCompressedInfo(): MutableVector4;
    get worldMatrix(): MutableMatrix44;
    get worldMatrixInner(): MutableMatrix44;
    get isWorldMatrixUpdated(): boolean;
    $logic(): void;
    private __copyToMatArray;
    getInverseBindMatricesAccessor(): Accessor | undefined;
    _shallowCopyFrom(component_: Component): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ISkeletalEntity;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    _getInverseBindMatrices(sg: SceneGraphComponent): IMatrix44;
}
