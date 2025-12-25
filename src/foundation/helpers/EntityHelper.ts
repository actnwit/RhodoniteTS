import { WellKnownComponentTIDs } from '../components';
import type { IAnimationEntityMethods } from '../components/Animation/IAnimationEntity';
import type { IAnimationStateEntityMethods } from '../components/AnimationState';
import type { IBlendShapeEntityMethods } from '../components/BlendShape/IBlendShapeEntity';
import { CameraComponent } from '../components/Camera/CameraComponent';
import type { ICameraEntityMethods } from '../components/Camera/ICameraEntity';
import type { ICameraControllerEntityMethods } from '../components/CameraController/ICameraControllerEntity';
import type { IConstraintEntityMethods } from '../components/Constraint/IConstraintEntity';
import type { ILightEntityMethods } from '../components/Light/ILightEntity';
import { LightComponent } from '../components/Light/LightComponent';
import type { IMeshEntityMethods } from '../components/Mesh/IMeshEntity';
import type { IMeshRendererEntityMethods } from '../components/MeshRenderer/IMeshRendererEntity';
import type { IPhysicsEntityMethods } from '../components/Physics/IPhysicsEntity';
import type { IRaymarchingEntityMethods } from '../components/Raymarching/IRaymarchingEntity';
import type { ISceneGraphEntityMethods } from '../components/SceneGraph/ISceneGraphEntity';
import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import type { ISkeletalEntityMethods } from '../components/Skeletal/ISkeletalEntity';
import type { ITransformEntityMethods } from '../components/Transform/ITransformEntity';
import type { IEntity } from '../core/Entity';
import type { Engine } from '../system/Engine';

/**
 * An entity that has transform capabilities.
 * Combines basic entity interface with transform methods.
 */
export type ITransformEntity = IEntity & ITransformEntityMethods;

/**
 * An entity that exists in the scene graph hierarchy.
 * Extends transform entity with scene graph operations.
 */
export type ISceneGraphEntity = ITransformEntity & ISceneGraphEntityMethods;

/**
 * An entity that can render meshes.
 * Combines scene graph entity with mesh and mesh renderer capabilities.
 */
export type IMeshEntity = ISceneGraphEntity & IMeshEntityMethods & IMeshRendererEntityMethods;

/**
 * An entity that represents a camera in the scene.
 * Extends scene graph entity with camera-specific methods.
 */
export type ICameraEntity = ISceneGraphEntity & ICameraEntityMethods;

/**
 * An entity that can control camera behavior.
 * Combines camera entity with camera controller capabilities.
 */
export type ICameraControllerEntity = ICameraEntity & ICameraControllerEntityMethods;

/**
 * An entity that supports skeletal animation.
 * Extends scene graph entity with skeletal system methods.
 */
export type ISkeletalEntity = ISceneGraphEntity & ISkeletalEntityMethods;

/**
 * An entity that can emit light.
 * Extends scene graph entity with lighting capabilities.
 */
export type ILightEntity = ISceneGraphEntity & ILightEntityMethods;

/**
 * An entity that participates in physics simulation.
 * Extends scene graph entity with physics methods.
 */
export type IPhysicsEntity = ISceneGraphEntity & IPhysicsEntityMethods;

/**
 * An entity that supports blend shape animation.
 * Combines mesh entity with blend shape capabilities.
 */
export type IBlendShapeEntity = IMeshEntity & IBlendShapeEntityMethods;

/**
 * An entity that can apply constraints.
 * Extends scene graph entity with constraint methods.
 */
export type IConstraintEntity = ISceneGraphEntity & IConstraintEntityMethods;

/**
 * An entity that can play animations.
 * Extends scene graph entity with animation playback capabilities.
 */
export interface IAnimationEntity extends ISceneGraphEntity, IAnimationEntityMethods {}

/**
 * An entity that manages animation states.
 * Extends scene graph entity with animation state management.
 */
export interface IAnimationStateEntity extends ISceneGraphEntity, IAnimationStateEntityMethods {}

/**
 * An entity that can participate in raymarching.
 * Extends scene graph entity with raymarching capabilities.
 */
export interface IRaymarchingEntity extends ISceneGraphEntity, IRaymarchingEntityMethods {}

/**
 * Creates a special entity that combines both light and camera functionality.
 * The camera component is automatically synchronized with the light component,
 * meaning the camera will follow the light's position and orientation.
 * This is useful for creating shadow-casting lights or spotlight effects.
 *
 * @returns A combined light and camera entity with synchronized behavior
 *
 * @example
 * ```typescript
 * const lightCameraEntity = createLightWithCameraEntity();
 * // The camera will automatically sync to the light's transform
 * lightCameraEntity.getLight().intensity = 2.0;
 * lightCameraEntity.getCamera().fovy = Math.PI / 4;
 * ```
 */
export function createLightWithCameraEntity(engine: Engine): ILightEntity & ICameraEntityMethods {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.LightComponentTID,
    entity
  ) as ILightEntity;
  const entityAddedComponent2 = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.CameraComponentTID,
    entityAddedComponent
  ) as ILightEntity & ICameraEntityMethods;

  entityAddedComponent2.getCamera().isSyncToLight = true;

  return entityAddedComponent2;
}
