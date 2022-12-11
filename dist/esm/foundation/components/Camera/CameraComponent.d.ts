import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { CameraTypeEnum } from '../../definitions/CameraType';
import { Matrix44 } from '../../math/Matrix44';
import { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableVector3 } from '../../math/MutableVector3';
import { Frustum } from '../../geometry/Frustum';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { CameraControllerComponent } from '../CameraController/CameraControllerComponent';
import { RenderPass } from '../../renderer/RenderPass';
import { ICameraEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
/**
 * The Component that represents a camera.
 *
 * @remarks
 * The camera is defined such that the local +X axis is to the right,
 * the “lens” looks towards the local -Z axis,
 * and the top of the camera is aligned with the local +Y axis.
 */
export declare class CameraComponent extends Component {
    private static readonly _eye;
    private _eyeInner;
    private _direction;
    private _directionInner;
    private _up;
    private _upInner;
    private _filmWidth;
    private _filmHeight;
    private _focalLength;
    private primitiveMode;
    private _corner;
    private _cornerInner;
    private _parameters;
    private _parametersInner;
    private __type;
    private __sceneGraphComponent?;
    private _projectionMatrix;
    private __isProjectionMatrixUpToDate;
    private _viewMatrix;
    private __isViewMatrixUpToDate;
    private static __current;
    private static returnVector3;
    private static __globalDataRepository;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpMatrix44_0;
    private static __tmpMatrix44_1;
    private static __biasMatrix;
    _xrLeft: boolean;
    _xrRight: boolean;
    isSyncToLight: boolean;
    private __frustum;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static set current(componentSID: ComponentSID);
    static get current(): ComponentSID;
    set type(type: CameraTypeEnum);
    get type(): CameraTypeEnum;
    get eye(): Vector3;
    set eye(noUseVec: Vector3);
    get eyeInner(): Vector3;
    /**
     * @internal
     */
    set eyeInner(vec: Vector3);
    set upInner(vec: Vector3);
    set up(vec: Vector3);
    get up(): Vector3;
    get upInner(): Vector3;
    set direction(vec: Vector3);
    set directionInner(vec: Vector3);
    get direction(): Vector3;
    get directionInner(): Vector3;
    set corner(vec: Vector4);
    get corner(): Vector4;
    set left(value: number);
    set leftInner(value: number);
    get left(): number;
    set right(value: number);
    set rightInner(value: number);
    get right(): number;
    set top(value: number);
    set topInner(value: number);
    get top(): number;
    set bottom(value: number);
    set bottomInner(value: number);
    get bottom(): number;
    set cornerInner(vec: Vector4);
    get cornerInner(): Vector4;
    set parametersInner(vec: Vector4);
    get parametersInner(): Vector4;
    get parameters(): Vector4;
    set zNear(val: number);
    set zNearInner(val: number);
    get zNearInner(): number;
    get zNear(): number;
    set focalLength(val: number);
    get focalLength(): number;
    set zFar(val: number);
    set zFarInner(val: number);
    get zFarInner(): number;
    get zFar(): number;
    setFovyAndChangeFilmSize(degree: number): void;
    setFovyAndChangeFocalLength(degree: number): void;
    get fovy(): number;
    set fovyInner(val: number);
    set aspect(val: number);
    set aspectInner(val: number);
    get aspectInner(): number;
    get aspect(): number;
    set xMag(val: number);
    get xMag(): number;
    set yMag(val: number);
    get yMag(): number;
    static get componentTID(): ComponentTID;
    calcProjectionMatrix(): MutableMatrix44;
    calcViewMatrix(): MutableMatrix44;
    get viewMatrix(): Matrix44;
    set viewMatrix(viewMatrix: Matrix44);
    get projectionMatrix(): Matrix44;
    set projectionMatrix(projectionMatrix: Matrix44);
    get viewProjectionMatrix(): MutableMatrix44;
    get biasViewProjectionMatrix(): MutableMatrix44;
    setValuesToGlobalDataRepositoryOnlyMatrices(): void;
    setValuesToGlobalDataRepository(): void;
    get worldPosition(): MutableVector3;
    updateFrustum(): void;
    get frustum(): Frustum;
    $create(): void;
    $logic({ renderPass }: {
        renderPass: RenderPass;
    }): void;
    static getCurrentCameraEntity(): ICameraEntity;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ICameraEntity;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBaseClass extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBaseClass, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../../../sparkgear/SparkGearComponent").SparkGearComponent ? import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof CameraComponent ? import("./ICameraEntity").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").ILightEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("./ICameraEntity").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ISkeletalEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("./ICameraEntity").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods>) & EntityBaseClass;
}
