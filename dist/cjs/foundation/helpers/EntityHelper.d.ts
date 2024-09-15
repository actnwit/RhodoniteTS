import { IEntity } from '../core/Entity';
import { ITransformEntityMethods } from '../components/Transform/ITransformEntity';
import { ISceneGraphEntityMethods } from '../components/SceneGraph/ISceneGraphEntity';
import { IMeshEntityMethods } from '../components/Mesh/IMeshEntity';
import { ICameraEntityMethods } from '../components/Camera/ICameraEntity';
import { ICameraControllerEntityMethods } from '../components/CameraController/ICameraControllerEntity';
import { IAnimationEntityMethods } from '../components/Animation/IAnimationEntity';
import { ILightEntityMethods } from '../components/Light/ILightEntity';
import { IMeshRendererEntityMethods } from '../components/MeshRenderer/IMeshRendererEntity';
import { ISkeletalEntityMethods } from '../components/Skeletal/ISkeletalEntity';
import { IPhysicsEntityMethods } from '../components/Physics/IPhysicsEntity';
import { IBlendShapeEntityMethods } from '../components/BlendShape/IBlendShapeEntity';
import { IConstraintEntityMethods } from '../components/Constraint/IConstraintEntity';
import { IAnimationStateEntityMethods } from '../components/AnimationState';
export type ITransformEntity = IEntity & ITransformEntityMethods;
export type ISceneGraphEntity = ITransformEntity & ISceneGraphEntityMethods;
export type IMeshEntity = ISceneGraphEntity & IMeshEntityMethods & IMeshRendererEntityMethods;
export type ICameraEntity = ISceneGraphEntity & ICameraEntityMethods;
export type ICameraControllerEntity = ICameraEntity & ICameraControllerEntityMethods;
export type ISkeletalEntity = ISceneGraphEntity & ISkeletalEntityMethods;
export type ILightEntity = ISceneGraphEntity & ILightEntityMethods;
export type IPhysicsEntity = ISceneGraphEntity & IPhysicsEntityMethods;
export type IBlendShapeEntity = IMeshEntity & IBlendShapeEntityMethods;
export type IConstraintEntity = ISceneGraphEntity & IConstraintEntityMethods;
export interface IAnimationEntity extends ISceneGraphEntity, IAnimationEntityMethods {
}
export interface IAnimationStateEntity extends ISceneGraphEntity, IAnimationStateEntityMethods {
}
export declare function createLightWithCameraEntity(): ILightEntity & ICameraEntityMethods;
