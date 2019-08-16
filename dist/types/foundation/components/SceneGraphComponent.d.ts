import Component from '../core/Component';
import Matrix44 from '../math/Matrix44';
import EntityRepository from '../core/EntityRepository';
import MutableMatrix44 from '../math/MutableMatrix44';
import MutableMatrix33 from '../math/MutableMatrix33';
import Vector3 from '../math/Vector3';
import AABB from '../math/AABB';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';
export default class SceneGraphComponent extends Component {
    private __parent?;
    private static __sceneGraphs;
    isAbleToBeParent: boolean;
    private __children;
    private _worldMatrix;
    private _normalMatrix;
    private __isWorldMatrixUpToDate;
    private __isNormalMatrixUpToDate;
    private __tmpMatrix;
    private static _isAllUpdate;
    private __worldAABB;
    private __isWorldAABBDirty;
    private static __originVector3;
    private static returnVector3;
    isVisible: boolean;
    private __animationComponent?;
    isRootJoint: boolean;
    jointIndex: number;
    _inverseBindMatrix?: Matrix44;
    _bindMatrix?: Matrix44;
    _jointsOfHierarchies: SceneGraphComponent[];
    private static __bufferView;
    private static invertedMatrix44;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static getTopLevelComponents(): SceneGraphComponent[];
    isJoint(): boolean;
    static readonly componentTID: ComponentTID;
    beAbleToBeParent(flag: boolean): void;
    setWorldMatrixDirty(): void;
    addChild(sg: SceneGraphComponent): void;
    applyFunctionRecursively(func: Function, args: any[]): void;
    readonly isTopLevel: boolean;
    readonly children: SceneGraphComponent[];
    readonly parent: SceneGraphComponent | undefined;
    readonly worldMatrixInner: MutableMatrix44;
    readonly worldMatrix: Matrix44;
    readonly normalMatrixInner: MutableMatrix33;
    readonly normalMatrix: import("../math/Matrix33").default;
    $create(): void;
    $load(): void;
    $logic(): void;
    static common_$prerender(): void;
    isWorldMatrixUpToDateRecursively(): boolean;
    calcWorldMatrixRecursively(isJointMode: boolean): Matrix44 | MutableMatrix44;
    /**
     * Collects children and itself from specified sceneGraphComponent.
     * @param sceneGraphComponent collects children and itself from the sceneGraphComponent
     * @param isJointMode collects joints only
     */
    static flattenHierarchy(sceneGraphComponent: SceneGraphComponent, isJointMode: Boolean): SceneGraphComponent[];
    readonly worldPosition: Vector3;
    calcWorldAABB(): AABB;
    readonly worldAABB: AABB;
    setVisibilityRecursively(flag: boolean): void;
}
