import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableMatrix33 } from '../../math/MutableMatrix33';
import { Vector3 } from '../../math/Vector3';
import { AABB } from '../../math/AABB';
import { MeshComponent } from '../Mesh/MeshComponent';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { CameraComponent } from '../Camera/CameraComponent';
import { Vector4 } from '../../math/Vector4';
import { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { RaycastResultEx2 } from '../../geometry/types/GeometryTypes';
import { IQuaternion } from '../../math';
export declare class SceneGraphComponent extends Component {
    private __parent?;
    private static __sceneGraphs;
    isAbleToBeParent: boolean;
    private __children;
    private __gizmoChildren;
    private _worldMatrix;
    private _normalMatrix;
    private __isWorldMatrixUpToDate;
    private __isNormalMatrixUpToDate;
    private __tmpMatrix;
    private __worldAABB;
    private __isWorldAABBDirty;
    private static readonly __originVector3;
    private static returnVector3;
    private _isVisible;
    private _isBillboard;
    private __aabbGizmo?;
    private __locatorGizmo?;
    private __translationGizmo?;
    private __scaleGizmo?;
    private __transformGizmoSpace;
    private static isJointAABBShouldBeCalculated;
    toMakeWorldMatrixTheSameAsLocalMatrix: boolean;
    private __latestPrimitivePositionAccessorVersion;
    isRootJoint: boolean;
    jointIndex: number;
    private static invertedMatrix44;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    set isVisible(flg: boolean);
    get isVisible(): boolean;
    setVisibilityRecursively(flag: boolean): void;
    set isBillboard(flg: boolean);
    get isBillboard(): boolean;
    setIsBillboardRecursively(flg: boolean): void;
    set isAABBGizmoVisible(flg: boolean);
    get isAABBGizmoVisible(): boolean;
    set isLocatorGizmoVisible(flg: boolean);
    get isLocatorGizmoVisible(): boolean;
    set isTranslationGizmoVisible(flg: boolean);
    get isTranslationGizmoVisible(): boolean;
    set isScaleGizmoVisible(flg: boolean);
    get isScaleGizmoVisible(): boolean;
    static getTopLevelComponents(): SceneGraphComponent[];
    isJoint(): boolean;
    static get componentTID(): ComponentTID;
    beAbleToBeParent(flag: boolean): void;
    setWorldMatrixDirty(): void;
    setWorldMatrixDirtyRecursively(): void;
    setWorldAABBDirtyParentRecursively(): void;
    /**
     * add a SceneGraph component as a child of this
     * @param sg a SceneGraph component
     */
    addChild(sg: SceneGraphComponent): void;
    /**
     * remove the child SceneGraph component from this
     * @param sg a SceneGraph component
     */
    removeChild(sg: SceneGraphComponent): void;
    /**
     * add a SceneGraph component as a child of this (But Gizmo only)
     * @param sg a SceneGraph component of Gizmo
     */
    _addGizmoChild(sg: SceneGraphComponent): void;
    get isTopLevel(): boolean;
    get children(): SceneGraphComponent[];
    get parent(): SceneGraphComponent | undefined;
    get worldMatrixInner(): MutableMatrix44;
    get worldMatrix(): MutableMatrix44;
    get normalMatrixInner(): MutableMatrix33;
    get entityWorldMatrix(): MutableMatrix44;
    get entityWorldMatrixInner(): MutableMatrix44;
    get normalMatrix(): MutableMatrix33;
    isWorldMatrixUpToDateRecursively(): boolean;
    private __calcWorldMatrixRecursively;
    getQuaternionRecursively(): IQuaternion;
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
    private get __shouldJointWorldAabbBeCalculated();
    get worldAABB(): AABB;
    /**
     * castRay Methods
     *
     * @param srcPointInWorld a source position in world space
     * @param directionInWorld a direction vector in world space
     * @param dotThreshold threshold of the intersected triangle and the ray
     * @param ignoreMeshComponents mesh components to ignore
     * @returns information of intersection in world space
     */
    castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold?: number, ignoreMeshComponents?: MeshComponent[]): RaycastResultEx2;
    /**
     * castRayFromScreen Methods
     *
     * @param x x position of screen
     * @param y y position of screen
     * @param camera a camera component
     * @param viewport a viewport vector4
     * @param dotThreshold threshold of the intersected triangle and the ray
     * @param ignoreMeshComponents mesh components to ignore
     * @returns information of intersection in world space
     */
    castRayFromScreen(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number, ignoreMeshComponents?: MeshComponent[]): RaycastResultEx2;
    $create(): void;
    $logic(): void;
    private __updateGizmos;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ISceneGraphEntity;
    setTransformGizmoSpace(space: 'local' | 'world'): void;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../../../sparkgear/SparkGearComponent").SparkGearComponent ? import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("./ISceneGraphEntity").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("./ISceneGraphEntity").ISceneGraphEntityMethods | import("..").ISkeletalEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ILightEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods, import("..").ITransformEntityMethods>, import("./ISceneGraphEntity").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods>) & EntityBase;
}
