import {MixinBase} from '../../types/TypeGenerators';
import { Component } from '../core/Component';
import { AnimationComponent } from './Animation/AnimationComponent';
import {IAnimationEntityMethods} from './Animation/IAnimationEntity';
import { BlendShapeComponent } from './BlendShape/BlendShapeComponent';
import {IBlendShapeEntityMethods} from './BlendShape/IBlendShapeEntity';
import {ICameraEntityMethods} from './Camera/ICameraEntity';
import { CameraControllerComponent } from './CameraController/CameraControllerComponent';
import {ICameraControllerEntityMethods} from './CameraController/ICameraControllerEntity';
import {ILightEntityMethods} from './Light/ILightEntity';
import { LightComponent } from './Light/LightComponent';
import {IMeshEntityMethods} from './Mesh/IMeshEntity';
import { MeshComponent } from './Mesh/MeshComponent';
import {IMeshRendererEntityMethods} from './MeshRenderer/IMeshRendererEntity';
import { MeshRendererComponent } from './MeshRenderer/MeshRendererComponent';
import {IPhysicsEntityMethods} from './Physics/IPhysicsEntity';
import PhysicsComponent from './Physics/PhysicsComponent';
import {ISceneGraphEntityMethods} from './SceneGraph/ISceneGraphEntity';
import { SceneGraphComponent } from './SceneGraph/SceneGraphComponent';
import {ISkeletalEntityMethods} from './Skeletal/ISkeletalEntity';
import SkeletalComponent from './Skeletal/SkeletalComponent';
import {ITransformEntityMethods} from './Transform/ITransfomEntity';
import { TransformComponent } from './Transform/TransformComponent';
import EffekseerComponent, {
  IEffekseerEntityMethods,
} from '../../effekseer/EffekseerComponent';
import SparkGearComponent, {
  ISparkGearEntityMethods,
} from '../../sparkgear/SparkGearComponent';
import { CameraComponent } from './Camera/CameraComponent';

export type ComponentMixinFunction = <EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) => {
  entityClass: MixinBase;
  components: typeof Component[];
};

// export type AllWellKnownomponents =
//   | Component
//   | AnimationComponent
//   | TransformComponent
//   | SceneGraphComponent
//   | MeshComponent
//   | MeshRendererComponent
//   | CameraComponent
//   | CameraControllerComponent
//   | LightComponent
//   | SkeletalComponent
//   | BlendShapeComponent
//   | PhysicsComponent;

type AllWellKnownComponentMethodsTypes =
  | IAnimationEntityMethods
  | ITransformEntityMethods
  | ISceneGraphEntityMethods
  | IMeshEntityMethods
  | IMeshRendererEntityMethods
  | ICameraEntityMethods
  | ICameraControllerEntityMethods
  | ILightEntityMethods
  | ISkeletalEntityMethods
  | IBlendShapeEntityMethods
  | IPhysicsEntityMethods
  | IEffekseerEntityMethods
  | ISparkGearEntityMethods;

type IsThisAnimation<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof AnimationComponent
  ? IAnimationEntityMethods
  : Exclude<Possibles, IAnimationEntityMethods>;

type IsThisTransform<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof TransformComponent
  ? ITransformEntityMethods
  : Exclude<Possibles, ITransformEntityMethods>;

type IsThisSceneGraph<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof SceneGraphComponent
  ? ISceneGraphEntityMethods
  : Exclude<Possibles, ISceneGraphEntityMethods>;

type IsThisMesh<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof MeshComponent
  ? IMeshEntityMethods
  : Exclude<Possibles, IMeshEntityMethods>;

type IsThisMeshRenderer<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof MeshRendererComponent
  ? IMeshRendererEntityMethods
  : Exclude<Possibles, IMeshRendererEntityMethods>;

type IsThisCameraController<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof CameraControllerComponent
  ? ICameraControllerEntityMethods
  : Exclude<Possibles, ICameraControllerEntityMethods>;

type IsThisCamera<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof CameraComponent
  ? ICameraEntityMethods
  : Exclude<Possibles, ICameraEntityMethods>;

type IsThisLight<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof LightComponent
  ? ILightEntityMethods
  : Exclude<Possibles, ILightEntityMethods>;

type IsThisSkeletal<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof SkeletalComponent
  ? ISkeletalEntityMethods
  : Exclude<Possibles, ISkeletalEntityMethods>;

type IsThisBlendShape<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof BlendShapeComponent
  ? IBlendShapeEntityMethods
  : Exclude<Possibles, IBlendShapeEntityMethods>;

type IsThisPhysics<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof PhysicsComponent
  ? IPhysicsEntityMethods
  : Exclude<Possibles, IPhysicsEntityMethods>;

type IsThisEffekseer<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof EffekseerComponent
  ? IEffekseerEntityMethods
  : Exclude<Possibles, IEffekseerEntityMethods>;

type IsThisSparkGear<
  T extends typeof Component,
  Possibles extends AllWellKnownComponentMethodsTypes
> = T extends typeof SparkGearComponent
  ? ISparkGearEntityMethods
  : Exclude<Possibles, ISparkGearEntityMethods>;

export type ComponentToComponentMethods<T extends typeof Component> =
  IsThisSparkGear<
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
                          IsThisAnimation<T, AllWellKnownComponentMethodsTypes>
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

type Foo = ComponentToComponentMethods<typeof TransformComponent>;
