import type { Gltf2AnyObject } from './glTF2';

export interface KHRPhysicsRigidBodiesProperty {
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
}

export interface KHRPhysicsMaterial extends KHRPhysicsRigidBodiesProperty {
  name?: string;
  staticFriction?: number;
  dynamicFriction?: number;
  restitution?: number;
  frictionCombine?: 'average' | 'minimum' | 'maximum' | 'multiply';
  restitutionCombine?: 'average' | 'minimum' | 'maximum' | 'multiply';
}

export interface KHRPhysicsGeometry extends KHRPhysicsRigidBodiesProperty {
  convexHull?: boolean;
  shape?: number;
  mesh?: number;
}

export interface KHRPhysicsCollider extends KHRPhysicsRigidBodiesProperty {
  geometry: KHRPhysicsGeometry;
  physicsMaterial?: number;
  collisionFilter?: number;
}

export interface KHRPhysicsMotion extends KHRPhysicsRigidBodiesProperty {
  isKinematic?: boolean;
  mass?: number;
  centerOfMass?: number[];
  inertiaDiagonal?: number[];
  inertiaOrientation?: number[];
  linearVelocity?: number[];
  angularVelocity?: number[];
  gravityFactor?: number;
}

export interface KHRPhysicsRigidBodiesNode extends KHRPhysicsRigidBodiesProperty {
  motion?: KHRPhysicsMotion;
  collider?: KHRPhysicsCollider;
  trigger?: Gltf2AnyObject;
  joint?: Gltf2AnyObject;
}

export interface KHRPhysicsRigidBodies extends KHRPhysicsRigidBodiesProperty {
  physicsMaterials?: KHRPhysicsMaterial[];
  collisionFilters?: Gltf2AnyObject[];
  physicsJoints?: Gltf2AnyObject[];
}
