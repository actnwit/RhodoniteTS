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

export type ComponentToComponentMethods<T extends typeof Component> = T extends typeof ConstraintComponent
  ? IConstraintEntityMethods
  : T extends typeof VrmComponent
    ? IVrmEntityMethods
    : T extends typeof EffekseerComponent
      ? IEffekseerEntityMethods
      : T extends typeof PhysicsComponent
        ? IPhysicsEntityMethods
        : T extends typeof BlendShapeComponent
          ? IBlendShapeEntityMethods
          : T extends typeof SkeletalComponent
            ? ISkeletalEntityMethods
            : T extends typeof LightComponent
              ? ILightEntityMethods
              : T extends typeof CameraComponent
                ? ICameraEntityMethods
                : T extends typeof CameraControllerComponent
                  ? ICameraControllerEntityMethods
                  : T extends typeof MeshRendererComponent
                    ? IMeshRendererEntityMethods
                    : T extends typeof MeshComponent
                      ? IMeshEntityMethods
                      : T extends typeof SceneGraphComponent
                        ? ISceneGraphEntityMethods
                        : T extends typeof TransformComponent
                          ? ITransformEntityMethods
                          : T extends typeof AnimationComponent
                            ? IAnimationEntityMethods
                            : T extends typeof AnimationStateComponent
                              ? IAnimationStateEntityMethods
                              : never;

type _Foo = ComponentToComponentMethods<typeof TransformComponent>;
