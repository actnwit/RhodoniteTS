import Component from '../core/Component';
import Matrix44 from '../math/Matrix44';
import EntityRepository from '../core/EntityRepository';
import MutableMatrix44 from '../math/MutableMatrix44';
import MutableMatrix33 from '../math/MutableMatrix33';
import Vector3 from '../math/Vector3';
import AABB from '../math/AABB';
import MeshComponent from './MeshComponent';
import { ComponentTID, ComponentSID, EntityUID } from '../../commontypes/CommonTypes';
import CameraComponent from './CameraComponent';
import Vector4 from '../math/Vector4';
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
    private static readonly __originVector3;
    private static returnVector3;
    isVisible: boolean;
    private __animationComponent?;
    private __AABBGizmo;
    private static isJointAABBShouldBeCalculated;
    isRootJoint: boolean;
    jointIndex: number;
    private static invertedMatrix44;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    set isGizmoVisible(flg: boolean);
    get isGizmoVisible(): boolean;
    static getTopLevelComponents(): SceneGraphComponent[];
    isJoint(): boolean;
    static get componentTID(): ComponentTID;
    beAbleToBeParent(flag: boolean): void;
    setWorldMatrixDirty(): void;
    setWorldMatrixDirtyRecursively(): void;
    setWorldAABBDirtyParentRecursively(): void;
    addChild(sg: SceneGraphComponent): void;
    get isTopLevel(): boolean;
    get children(): SceneGraphComponent[];
    get parent(): SceneGraphComponent | undefined;
    get worldMatrixInner(): MutableMatrix44;
    get worldMatrix(): Matrix44;
    get normalMatrixInner(): MutableMatrix33;
    get normalMatrix(): import("../math/Matrix33").default;
    $create(): void;
    $load(): void;
    $logic(): void;
    isWorldMatrixUpToDateRecursively(): boolean;
    calcWorldMatrixRecursively(isJointMode: boolean): Matrix44 | MutableMatrix44;
    /**
     * Collects children and itself from specified sceneGraphComponent.
     * @param sceneGraphComponent collects children and itself from the sceneGraphComponent
     * @param isJointMode collects joints only
     */
    static flattenHierarchy(sceneGraphComponent: SceneGraphComponent, isJointMode: Boolean): SceneGraphComponent[];
    get worldPosition(): Vector3;
    getWorldPositionOf(localPosition: Vector3): Vector3;
    getLocalPositionOf(worldPosition: Vector3): Vector3;
    calcWorldAABB(): AABB;
    get worldAABB(): AABB;
    setVisibilityRecursively(flag: boolean): void;
    castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold?: number, ignoreMeshComponents?: MeshComponent[]): {
        intersectedPosition: null;
        rayDistance: number;
        selectedMeshComponent: MeshComponent | null;
    };
    castRayFromScreen(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number, ignoreMeshComponents?: MeshComponent[]): {
        intersectedPosition: null;
        rayDistance: number;
        selectedMeshComponent: MeshComponent | null;
    };
}
