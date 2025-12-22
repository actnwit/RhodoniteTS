import type { IEffekseerEntityMethods } from '../../effekseer/EffekseerComponent';
import type { MixinBase } from '../../types/TypeGenerators';
import type { Component } from '../core/Component';
import type { IAnimationEntityMethods } from './Animation/IAnimationEntity';
import type { IAnimationStateEntityMethods } from './AnimationState';
import type { IBlendShapeEntityMethods } from './BlendShape/IBlendShapeEntity';
import type { ICameraEntityMethods } from './Camera/ICameraEntity';
import type { ICameraControllerEntityMethods } from './CameraController/ICameraControllerEntity';
import type { IConstraintEntityMethods } from './Constraint/IConstraintEntity';
import type { ILightEntityMethods } from './Light/ILightEntity';
import type { IMeshEntityMethods } from './Mesh/IMeshEntity';
import type { IMeshRendererEntityMethods } from './MeshRenderer/IMeshRendererEntity';
import type { IPhysicsEntityMethods } from './Physics/IPhysicsEntity';
import type { IRayMarchingEntityMethods } from './Raymarching/IRaymarchingEntity';
import type { ISceneGraphEntityMethods } from './SceneGraph/ISceneGraphEntity';
import type { ISkeletalEntityMethods } from './Skeletal/ISkeletalEntity';
import type { ITransformEntityMethods } from './Transform/ITransformEntity';
import type { TransformComponent } from './Transform/TransformComponent';
import type { IVrmEntityMethods } from './Vrm/IVrmEntity';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';

export type ComponentMixinFunction = <EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: (typeof Component)[]
) => {
  entityClass: MixinBase;
  components: (typeof Component)[];
};

/**
 * Mapping from componentTID to EntityMethods interface.
 * This uses numeric literal types to distinguish between component types.
 */
interface ComponentTIDToMethodsMap {
  [WellKnownComponentTIDs.AnimationStateComponentTID]: IAnimationStateEntityMethods;
  [WellKnownComponentTIDs.AnimationComponentTID]: IAnimationEntityMethods;
  [WellKnownComponentTIDs.TransformComponentTID]: ITransformEntityMethods;
  [WellKnownComponentTIDs.SceneGraphComponentTID]: ISceneGraphEntityMethods;
  [WellKnownComponentTIDs.MeshComponentTID]: IMeshEntityMethods;
  [WellKnownComponentTIDs.MeshRendererComponentTID]: IMeshRendererEntityMethods;
  [WellKnownComponentTIDs.LightComponentTID]: ILightEntityMethods;
  [WellKnownComponentTIDs.CameraControllerComponentTID]: ICameraControllerEntityMethods;
  [WellKnownComponentTIDs.CameraComponentTID]: ICameraEntityMethods;
  [WellKnownComponentTIDs.SkeletalComponentTID]: ISkeletalEntityMethods;
  [WellKnownComponentTIDs.BlendShapeComponentTID]: IBlendShapeEntityMethods;
  [WellKnownComponentTIDs.PhysicsComponentTID]: IPhysicsEntityMethods;
  [WellKnownComponentTIDs.EffekseerComponentTID]: IEffekseerEntityMethods;
  [WellKnownComponentTIDs.VrmComponentTID]: IVrmEntityMethods;
  [WellKnownComponentTIDs.ConstraintComponentTID]: IConstraintEntityMethods;
  [WellKnownComponentTIDs.RaymarchingComponentTID]: IRayMarchingEntityMethods;
}

/**
 * Maps a Component class to its corresponding EntityMethods interface.
 * Uses componentTID to distinguish between structurally similar component classes.
 */
export type ComponentToComponentMethods<T extends typeof Component> =
  T['componentTID'] extends keyof ComponentTIDToMethodsMap ? ComponentTIDToMethodsMap[T['componentTID']] : never;

// Type test: Verify that ComponentToComponentMethods resolves correctly
// Example: ComponentToComponentMethods<typeof TransformComponent> should resolve to ITransformEntityMethods
type _Foo = ComponentToComponentMethods<typeof TransformComponent>;
