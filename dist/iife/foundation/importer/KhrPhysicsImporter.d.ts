import type { KHRImplicitBoxSize, KHRPhysicsMotion, RnM2 } from '../../types';
import { type ShapeDescriptor } from '../geometry/Shape';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Quaternion } from '../math/Quaternion';
import { Vector3 } from '../math/Vector3';
export interface NormalizedKhrBoxCollider {
    nodeIndex: number;
    shapeIndex: number;
    size: KHRImplicitBoxSize;
    dynamicFriction: number;
    restitution: number;
}
export interface KhrBoxColliderCollection {
    colliders: NormalizedKhrBoxCollider[];
    warnings: string[];
}
export interface NormalizedKhrCollider {
    nodeIndex: number;
    shapeIndex: number;
    descriptor: ShapeDescriptor;
    dynamicFriction: number;
    restitution: number;
    collisionGroup: number;
    collisionMask: number;
}
export interface KhrColliderCollection {
    colliders: NormalizedKhrCollider[];
    warnings: string[];
}
export interface NormalizedKhrBodyCollider extends NormalizedKhrCollider {
    localPosition: Vector3;
    localRotation: Quaternion;
    /** @internal Index used while resolving the scene-wide filter table. */
    collisionFilterIndex?: number;
    isSensor?: boolean;
    triggerNodeIndex?: number;
}
export interface NormalizedKhrRigidBodyGroup {
    bodyNodeIndex: number;
    motion?: KHRPhysicsMotion;
    colliders: NormalizedKhrBodyCollider[];
}
export interface KhrRigidBodyGroupCollection {
    groups: NormalizedKhrRigidBodyGroup[];
    warnings: string[];
}
/** Resolves collider ownership and body-relative transforms according to the KHR node hierarchy rules. */
export declare function collectKhrRigidBodyGroups(gltfModel: RnM2): KhrRigidBodyGroupCollection;
/** Resolves supported static implicit-shape colliders without mutating the glTF model. */
export declare function collectKhrStaticColliders(gltfModel: RnM2): KhrColliderCollection;
/** @deprecated Use collectKhrStaticColliders. */
export declare function collectKhrStaticBoxColliders(gltfModel: RnM2): KhrBoxColliderCollection;
/**
 * Creates Rapier fixed bodies for supported KHR_physics_rigid_bodies colliders.
 */
export declare function setupKhrStaticColliders(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]): void;
/** @deprecated Use setupKhrStaticColliders. */
export declare function setupKhrStaticBoxColliders(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]): void;
