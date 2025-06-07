import type { EffekseerComponent, IEffekseerEntityMethods } from '../../effekseer/EffekseerComponent';
import type { MixinBase } from '../../types/TypeGenerators';
import type { Component } from '../core/Component';
import type { AnimationComponent } from './Animation/AnimationComponent';
import type { IAnimationEntityMethods } from './Animation/IAnimationEntity';
import type { AnimationStateComponent, IAnimationStateEntityMethods } from './AnimationState';
import type { BlendShapeComponent } from './BlendShape/BlendShapeComponent';
import type { IBlendShapeEntityMethods } from './BlendShape/IBlendShapeEntity';
import type { CameraComponent } from './Camera/CameraComponent';
import type { ICameraEntityMethods } from './Camera/ICameraEntity';
import type { CameraControllerComponent } from './CameraController/CameraControllerComponent';
import type { ICameraControllerEntityMethods } from './CameraController/ICameraControllerEntity';
import type { ConstraintComponent } from './Constraint/ConstraintComponent';
import type { IConstraintEntityMethods } from './Constraint/IConstraintEntity';
import type { ILightEntityMethods } from './Light/ILightEntity';
import type { LightComponent } from './Light/LightComponent';
import type { IMeshEntityMethods } from './Mesh/IMeshEntity';
import type { MeshComponent } from './Mesh/MeshComponent';
import type { IMeshRendererEntityMethods } from './MeshRenderer/IMeshRendererEntity';
import type { MeshRendererComponent } from './MeshRenderer/MeshRendererComponent';
import type { IPhysicsEntityMethods } from './Physics/IPhysicsEntity';
import type { PhysicsComponent } from './Physics/PhysicsComponent';
import type { ISceneGraphEntityMethods } from './SceneGraph/ISceneGraphEntity';
import type { SceneGraphComponent } from './SceneGraph/SceneGraphComponent';
import type { ISkeletalEntityMethods } from './Skeletal/ISkeletalEntity';
import type { SkeletalComponent } from './Skeletal/SkeletalComponent';
import type { ITransformEntityMethods } from './Transform/ITransformEntity';
import type { TransformComponent } from './Transform/TransformComponent';
import type { IVrmEntityMethods } from './Vrm/IVrmEntity';
import type { VrmComponent } from './Vrm/VrmComponent';

export type ComponentMixinFunction = <EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: (typeof Component)[]
) => {
  entityClass: MixinBase;
  components: (typeof Component)[];
};

type AllWellKnownComponentMethodsTypes =
  | IAnimationStateEntityMethods
  | IAnimationEntityMethods
  | ITransformEntityMethods
  | ISceneGraphEntityMethods
  | IMeshEntityMethods
  | IMeshRendererEntityMethods
  | ILightEntityMethods
  | ICameraEntityMethods
  | ICameraControllerEntityMethods
  | ISkeletalEntityMethods
  | IBlendShapeEntityMethods
  | IPhysicsEntityMethods
  | IEffekseerEntityMethods
  | IVrmEntityMethods;

type IsThisAnimationState<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof AnimationStateComponent
  ? IAnimationStateEntityMethods
  : Exclude<Possibles, IAnimationStateEntityMethods>;

type IsThisAnimation<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof AnimationComponent ? IAnimationEntityMethods : Exclude<Possibles, IAnimationEntityMethods>;

type IsThisTransform<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof TransformComponent ? ITransformEntityMethods : Exclude<Possibles, ITransformEntityMethods>;

type IsThisSceneGraph<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof SceneGraphComponent ? ISceneGraphEntityMethods : Exclude<Possibles, ISceneGraphEntityMethods>;

type IsThisMesh<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof MeshComponent ? IMeshEntityMethods : Exclude<Possibles, IMeshEntityMethods>;

type IsThisMeshRenderer<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof MeshRendererComponent
  ? IMeshRendererEntityMethods
  : Exclude<Possibles, IMeshRendererEntityMethods>;

type IsThisCameraController<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof CameraControllerComponent
  ? ICameraControllerEntityMethods
  : Exclude<Possibles, ICameraControllerEntityMethods>;

type IsThisCamera<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof CameraComponent ? ICameraEntityMethods : Exclude<Possibles, ICameraEntityMethods>;

type IsThisLight<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof LightComponent ? ILightEntityMethods : Exclude<Possibles, ILightEntityMethods>;

type IsThisSkeletal<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof SkeletalComponent ? ISkeletalEntityMethods : Exclude<Possibles, ISkeletalEntityMethods>;

type IsThisBlendShape<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof BlendShapeComponent ? IBlendShapeEntityMethods : Exclude<Possibles, IBlendShapeEntityMethods>;

type IsThisPhysics<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof PhysicsComponent ? IPhysicsEntityMethods : Exclude<Possibles, IPhysicsEntityMethods>;

type IsThisEffekseer<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof EffekseerComponent ? IEffekseerEntityMethods : Exclude<Possibles, IEffekseerEntityMethods>;

type IsThisVrm<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof VrmComponent ? IVrmEntityMethods : Exclude<Possibles, IVrmEntityMethods>;

type IsThisConstraint<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes,
> = T extends typeof ConstraintComponent ? IConstraintEntityMethods : Exclude<Possibles, IConstraintEntityMethods>;

export type ComponentToComponentMethods<T extends typeof Component> = IsThisConstraint<
  T,
  IsThisVrm<
    T,
    IsThisEffekseer<
      T,
      IsThisPhysics<
        T,
        IsThisBlendShape<
          T,
          IsThisSkeletal<
            T,
            IsThisLight<
              T,
              IsThisCamera<
                T,
                IsThisCameraController<
                  T,
                  IsThisMeshRenderer<
                    T,
                    IsThisMesh<
                      T,
                      IsThisSceneGraph<
                        T,
                        IsThisTransform<
                          T,
                          IsThisAnimation<T, IsThisAnimationState<T, AllWellKnownComponentMethodsTypes>>
                        >
                      >
                    >
                  >
                >
              >
            >
          >
        >
      >
    >
  >
>;

type _Foo = ComponentToComponentMethods<typeof TransformComponent>;
