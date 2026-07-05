/* tslint:disable */
/* eslint-disable */
export function version(): string;
export function reserve_memory(extra_bytes_count: number): void;
export enum RawFeatureType {
  Vertex = 0,
  Edge = 1,
  Face = 2,
  Unknown = 3,
}
export enum RawJointAxis {
  LinX = 0,
  LinY = 1,
  LinZ = 2,
  AngX = 3,
  AngY = 4,
  AngZ = 5,
}
export enum RawJointType {
  Revolute = 0,
  Fixed = 1,
  Prismatic = 2,
  Rope = 3,
  Spring = 4,
  Spherical = 5,
  Generic = 6,
}
export enum RawMotorModel {
  AccelerationBased = 0,
  ForceBased = 1,
}
export enum RawRigidBodyType {
  Dynamic = 0,
  Fixed = 1,
  KinematicPositionBased = 2,
  KinematicVelocityBased = 3,
}
export enum RawShapeType {
  Ball = 0,
  Cuboid = 1,
  Capsule = 2,
  Segment = 3,
  Polyline = 4,
  Triangle = 5,
  TriMesh = 6,
  HeightField = 7,
  Compound = 8,
  ConvexPolyhedron = 9,
  Cylinder = 10,
  Cone = 11,
  RoundCuboid = 12,
  RoundTriangle = 13,
  RoundCylinder = 14,
  RoundCone = 15,
  RoundConvexPolyhedron = 16,
  HalfSpace = 17,
  Voxels = 18,
}
export class RawBroadPhase {
  free(): void;
  constructor();
  castRay(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawRayColliderHit | undefined;
  castRayAndGetNormal(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawRayColliderIntersection | undefined;
  intersectionsWithRay(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean, callback: Function, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): void;
  intersectionWithShape(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, shapePos: RawVector, shapeRot: RawRotation, shape: RawShape, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): number | undefined;
  projectPoint(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, point: RawVector, solid: boolean, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawPointColliderProjection | undefined;
  projectPointAndGetFeature(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, point: RawVector, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawPointColliderProjection | undefined;
  intersectionsWithPoint(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, point: RawVector, callback: Function, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): void;
  castShape(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, shapePos: RawVector, shapeRot: RawRotation, shapeVel: RawVector, shape: RawShape, target_distance: number, maxToi: number, stop_at_penetration: boolean, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawColliderShapeCastHit | undefined;
  intersectionsWithShape(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, shapePos: RawVector, shapeRot: RawRotation, shape: RawShape, callback: Function, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): void;
  collidersWithAabbIntersectingAabb(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, aabbCenter: RawVector, aabbHalfExtents: RawVector, callback: Function): void;
}
export class RawCCDSolver {
  free(): void;
  constructor();
}
export class RawCharacterCollision {
  free(): void;
  constructor();
  handle(): number;
  translationDeltaApplied(): RawVector;
  translationDeltaRemaining(): RawVector;
  toi(): number;
  worldWitness1(): RawVector;
  worldWitness2(): RawVector;
  worldNormal1(): RawVector;
  worldNormal2(): RawVector;
}
export class RawColliderSet {
  free(): void;
  /**
   * The world-space translation of this collider.
   */
  coTranslation(handle: number): RawVector;
  /**
   * The world-space orientation of this collider.
   */
  coRotation(handle: number): RawRotation;
  /**
   * The translation of this collider relative to its parent rigid-body.
   *
   * Returns the `None` if it doesn’t have a parent.
   */
  coTranslationWrtParent(handle: number): RawVector | undefined;
  /**
   * The orientation of this collider relative to its parent rigid-body.
   *
   * Returns the `None` if it doesn’t have a parent.
   */
  coRotationWrtParent(handle: number): RawRotation | undefined;
  /**
   * Sets the translation of this collider.
   *
   * # Parameters
   * - `x`: the world-space position of the collider along the `x` axis.
   * - `y`: the world-space position of the collider along the `y` axis.
   * - `z`: the world-space position of the collider along the `z` axis.
   * - `wakeUp`: forces the collider to wake-up so it is properly affected by forces if it
   * wasn't moving before modifying its position.
   */
  coSetTranslation(handle: number, x: number, y: number, z: number): void;
  coSetTranslationWrtParent(handle: number, x: number, y: number, z: number): void;
  /**
   * Sets the rotation quaternion of this collider.
   *
   * This does nothing if a zero quaternion is provided.
   *
   * # Parameters
   * - `x`: the first vector component of the quaternion.
   * - `y`: the second vector component of the quaternion.
   * - `z`: the third vector component of the quaternion.
   * - `w`: the scalar component of the quaternion.
   * - `wakeUp`: forces the collider to wake-up so it is properly affected by forces if it
   * wasn't moving before modifying its position.
   */
  coSetRotation(handle: number, x: number, y: number, z: number, w: number): void;
  coSetRotationWrtParent(handle: number, x: number, y: number, z: number, w: number): void;
  /**
   * Is this collider a sensor?
   */
  coIsSensor(handle: number): boolean;
  /**
   * The type of the shape of this collider.
   */
  coShapeType(handle: number): RawShapeType;
  coHalfspaceNormal(handle: number): RawVector | undefined;
  /**
   * The half-extents of this collider if it is has a cuboid shape.
   */
  coHalfExtents(handle: number): RawVector | undefined;
  /**
   * Set the half-extents of this collider if it has a cuboid shape.
   */
  coSetHalfExtents(handle: number, newHalfExtents: RawVector): void;
  /**
   * The radius of this collider if it is a ball, capsule, cylinder, or cone shape.
   */
  coRadius(handle: number): number | undefined;
  /**
   * Set the radius of this collider if it is a ball, capsule, cylinder, or cone shape.
   */
  coSetRadius(handle: number, newRadius: number): void;
  /**
   * The half height of this collider if it is a capsule, cylinder, or cone shape.
   */
  coHalfHeight(handle: number): number | undefined;
  /**
   * Set the half height of this collider if it is a capsule, cylinder, or cone shape.
   */
  coSetHalfHeight(handle: number, newHalfheight: number): void;
  /**
   * The radius of the round edges of this collider.
   */
  coRoundRadius(handle: number): number | undefined;
  /**
   * Set the radius of the round edges of this collider.
   */
  coSetRoundRadius(handle: number, newBorderRadius: number): void;
  coVoxelData(handle: number): Int32Array | undefined;
  coVoxelSize(handle: number): RawVector | undefined;
  coSetVoxel(handle: number, ix: number, iy: number, iz: number, filled: boolean): void;
  coPropagateVoxelChange(handle1: number, handle2: number, ix: number, iy: number, iz: number, shift_x: number, shift_y: number, shift_z: number): void;
  coCombineVoxelStates(handle1: number, handle2: number, shift_x: number, shift_y: number, shift_z: number): void;
  /**
   * The vertices of this triangle mesh, polyline, convex polyhedron, segment, triangle or convex polyhedron, if it is one.
   */
  coVertices(handle: number): Float32Array | undefined;
  /**
   * The indices of this triangle mesh, polyline, or convex polyhedron, if it is one.
   */
  coIndices(handle: number): Uint32Array | undefined;
  coTriMeshFlags(handle: number): number | undefined;
  coHeightFieldFlags(handle: number): number | undefined;
  /**
   * The height of this heightfield if it is one.
   */
  coHeightfieldHeights(handle: number): Float32Array | undefined;
  /**
   * The scaling factor applied of this heightfield if it is one.
   */
  coHeightfieldScale(handle: number): RawVector | undefined;
  /**
   * The number of rows on this heightfield's height matrix, if it is one.
   */
  coHeightfieldNRows(handle: number): number | undefined;
  /**
   * The number of columns on this heightfield's height matrix, if it is one.
   */
  coHeightfieldNCols(handle: number): number | undefined;
  /**
   * The unique integer identifier of the collider this collider is attached to.
   */
  coParent(handle: number): number | undefined;
  coSetEnabled(handle: number, enabled: boolean): void;
  coIsEnabled(handle: number): boolean;
  coSetContactSkin(handle: number, contact_skin: number): void;
  coContactSkin(handle: number): number;
  /**
   * The friction coefficient of this collider.
   */
  coFriction(handle: number): number;
  /**
   * The restitution coefficient of this collider.
   */
  coRestitution(handle: number): number;
  /**
   * The density of this collider.
   */
  coDensity(handle: number): number;
  /**
   * The mass of this collider.
   */
  coMass(handle: number): number;
  /**
   * The volume of this collider.
   */
  coVolume(handle: number): number;
  /**
   * The collision groups of this collider.
   */
  coCollisionGroups(handle: number): number;
  /**
   * The solver groups of this collider.
   */
  coSolverGroups(handle: number): number;
  /**
   * The physics hooks enabled for this collider.
   */
  coActiveHooks(handle: number): number;
  /**
   * The collision types enabled for this collider.
   */
  coActiveCollisionTypes(handle: number): number;
  /**
   * The events enabled for this collider.
   */
  coActiveEvents(handle: number): number;
  /**
   * The total force magnitude beyond which a contact force event can be emitted.
   */
  coContactForceEventThreshold(handle: number): number;
  coContainsPoint(handle: number, point: RawVector): boolean;
  coCastShape(handle: number, colliderVel: RawVector, shape2: RawShape, shape2Pos: RawVector, shape2Rot: RawRotation, shape2Vel: RawVector, target_distance: number, maxToi: number, stop_at_penetration: boolean): RawShapeCastHit | undefined;
  coCastCollider(handle: number, collider1Vel: RawVector, collider2handle: number, collider2Vel: RawVector, target_distance: number, max_toi: number, stop_at_penetration: boolean): RawColliderShapeCastHit | undefined;
  coIntersectsShape(handle: number, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation): boolean;
  coContactShape(handle: number, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation, prediction: number): RawShapeContact | undefined;
  coContactCollider(handle: number, collider2handle: number, prediction: number): RawShapeContact | undefined;
  coProjectPoint(handle: number, point: RawVector, solid: boolean): RawPointProjection;
  coIntersectsRay(handle: number, rayOrig: RawVector, rayDir: RawVector, maxToi: number): boolean;
  coCastRay(handle: number, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean): number;
  coCastRayAndGetNormal(handle: number, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean): RawRayIntersection | undefined;
  coSetSensor(handle: number, is_sensor: boolean): void;
  coSetRestitution(handle: number, restitution: number): void;
  coSetFriction(handle: number, friction: number): void;
  coFrictionCombineRule(handle: number): number;
  coSetFrictionCombineRule(handle: number, rule: number): void;
  coRestitutionCombineRule(handle: number): number;
  coSetRestitutionCombineRule(handle: number, rule: number): void;
  coSetCollisionGroups(handle: number, groups: number): void;
  coSetSolverGroups(handle: number, groups: number): void;
  coSetActiveHooks(handle: number, hooks: number): void;
  coSetActiveEvents(handle: number, events: number): void;
  coSetActiveCollisionTypes(handle: number, types: number): void;
  coSetShape(handle: number, shape: RawShape): void;
  coSetContactForceEventThreshold(handle: number, threshold: number): void;
  coSetDensity(handle: number, density: number): void;
  coSetMass(handle: number, mass: number): void;
  coSetMassProperties(handle: number, mass: number, centerOfMass: RawVector, principalAngularInertia: RawVector, angularInertiaFrame: RawRotation): void;
  constructor();
  len(): number;
  contains(handle: number): boolean;
  createCollider(enabled: boolean, shape: RawShape, translation: RawVector, rotation: RawRotation, massPropsMode: number, mass: number, centerOfMass: RawVector, principalAngularInertia: RawVector, angularInertiaFrame: RawRotation, density: number, friction: number, restitution: number, frictionCombineRule: number, restitutionCombineRule: number, isSensor: boolean, collisionGroups: number, solverGroups: number, activeCollisionTypes: number, activeHooks: number, activeEvents: number, contactForceEventThreshold: number, contactSkin: number, hasParent: boolean, parent: number, bodies: RawRigidBodySet): number | undefined;
  /**
   * Removes a collider from this set and wake-up the rigid-body it is attached to.
   */
  remove(handle: number, islands: RawIslandManager, bodies: RawRigidBodySet, wakeUp: boolean): void;
  /**
   * Checks if a collider with the given integer handle exists.
   */
  isHandleValid(handle: number): boolean;
  /**
   * Applies the given JavaScript function to the integer handle of each collider managed by this collider set.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each collider managed by this collider set. Called as `f(handle)`.
   */
  forEachColliderHandle(f: Function): void;
}
export class RawColliderShapeCastHit {
  private constructor();
  free(): void;
  colliderHandle(): number;
  time_of_impact(): number;
  witness1(): RawVector;
  witness2(): RawVector;
  normal1(): RawVector;
  normal2(): RawVector;
}
export class RawContactForceEvent {
  private constructor();
  free(): void;
  /**
   * The first collider involved in the contact.
   */
  collider1(): number;
  /**
   * The second collider involved in the contact.
   */
  collider2(): number;
  /**
   * The sum of all the forces between the two colliders.
   */
  total_force(): RawVector;
  /**
   * The sum of the magnitudes of each force between the two colliders.
   *
   * Note that this is **not** the same as the magnitude of `self.total_force`.
   * Here we are summing the magnitude of all the forces, instead of taking
   * the magnitude of their sum.
   */
  total_force_magnitude(): number;
  /**
   * The world-space (unit) direction of the force with strongest magnitude.
   */
  max_force_direction(): RawVector;
  /**
   * The magnitude of the largest force at a contact point of this contact pair.
   */
  max_force_magnitude(): number;
}
export class RawContactManifold {
  private constructor();
  free(): void;
  normal(): RawVector;
  local_n1(): RawVector;
  local_n2(): RawVector;
  subshape1(): number;
  subshape2(): number;
  num_contacts(): number;
  contact_local_p1(i: number): RawVector | undefined;
  contact_local_p2(i: number): RawVector | undefined;
  contact_dist(i: number): number;
  contact_fid1(i: number): number;
  contact_fid2(i: number): number;
  contact_impulse(i: number): number;
  contact_tangent_impulse_x(i: number): number;
  contact_tangent_impulse_y(i: number): number;
  num_solver_contacts(): number;
  solver_contact_point(i: number): RawVector | undefined;
  solver_contact_dist(i: number): number;
  solver_contact_friction(i: number): number;
  solver_contact_restitution(i: number): number;
  solver_contact_tangent_velocity(i: number): RawVector;
}
export class RawContactPair {
  private constructor();
  free(): void;
  collider1(): number;
  collider2(): number;
  numContactManifolds(): number;
  contactManifold(i: number): RawContactManifold | undefined;
}
export class RawDebugRenderPipeline {
  free(): void;
  constructor();
  vertices(): Float32Array;
  colors(): Float32Array;
  render(bodies: RawRigidBodySet, colliders: RawColliderSet, impulse_joints: RawImpulseJointSet, multibody_joints: RawMultibodyJointSet, narrow_phase: RawNarrowPhase, filter_flags: number, filter_predicate: Function): void;
}
export class RawDeserializedWorld {
  private constructor();
  free(): void;
  takeGravity(): RawVector | undefined;
  takeIntegrationParameters(): RawIntegrationParameters | undefined;
  takeIslandManager(): RawIslandManager | undefined;
  takeBroadPhase(): RawBroadPhase | undefined;
  takeNarrowPhase(): RawNarrowPhase | undefined;
  takeBodies(): RawRigidBodySet | undefined;
  takeColliders(): RawColliderSet | undefined;
  takeImpulseJoints(): RawImpulseJointSet | undefined;
  takeMultibodyJoints(): RawMultibodyJointSet | undefined;
}
export class RawDynamicRayCastVehicleController {
  free(): void;
  constructor(chassis: number);
  current_vehicle_speed(): number;
  chassis(): number;
  index_up_axis(): number;
  set_index_up_axis(axis: number): void;
  index_forward_axis(): number;
  set_index_forward_axis(axis: number): void;
  add_wheel(chassis_connection_cs: RawVector, direction_cs: RawVector, axle_cs: RawVector, suspension_rest_length: number, radius: number): void;
  num_wheels(): number;
  update_vehicle(dt: number, broad_phase: RawBroadPhase, narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, filter_flags: number, filter_groups: number | null | undefined, filter_predicate: Function): void;
  wheel_chassis_connection_point_cs(i: number): RawVector | undefined;
  set_wheel_chassis_connection_point_cs(i: number, value: RawVector): void;
  wheel_suspension_rest_length(i: number): number | undefined;
  set_wheel_suspension_rest_length(i: number, value: number): void;
  wheel_max_suspension_travel(i: number): number | undefined;
  set_wheel_max_suspension_travel(i: number, value: number): void;
  wheel_radius(i: number): number | undefined;
  set_wheel_radius(i: number, value: number): void;
  wheel_suspension_stiffness(i: number): number | undefined;
  set_wheel_suspension_stiffness(i: number, value: number): void;
  wheel_suspension_compression(i: number): number | undefined;
  set_wheel_suspension_compression(i: number, value: number): void;
  wheel_suspension_relaxation(i: number): number | undefined;
  set_wheel_suspension_relaxation(i: number, value: number): void;
  wheel_max_suspension_force(i: number): number | undefined;
  set_wheel_max_suspension_force(i: number, value: number): void;
  wheel_brake(i: number): number | undefined;
  set_wheel_brake(i: number, value: number): void;
  wheel_steering(i: number): number | undefined;
  set_wheel_steering(i: number, value: number): void;
  wheel_engine_force(i: number): number | undefined;
  set_wheel_engine_force(i: number, value: number): void;
  wheel_direction_cs(i: number): RawVector | undefined;
  set_wheel_direction_cs(i: number, value: RawVector): void;
  wheel_axle_cs(i: number): RawVector | undefined;
  set_wheel_axle_cs(i: number, value: RawVector): void;
  wheel_friction_slip(i: number): number | undefined;
  set_wheel_friction_slip(i: number, value: number): void;
  wheel_side_friction_stiffness(i: number): number | undefined;
  set_wheel_side_friction_stiffness(i: number, stiffness: number): void;
  wheel_rotation(i: number): number | undefined;
  wheel_forward_impulse(i: number): number | undefined;
  wheel_side_impulse(i: number): number | undefined;
  wheel_suspension_force(i: number): number | undefined;
  wheel_contact_normal_ws(i: number): RawVector | undefined;
  wheel_contact_point_ws(i: number): RawVector | undefined;
  wheel_suspension_length(i: number): number | undefined;
  wheel_hard_point_ws(i: number): RawVector | undefined;
  wheel_is_in_contact(i: number): boolean;
  wheel_ground_object(i: number): number | undefined;
}
/**
 * A structure responsible for collecting events generated
 * by the physics engine.
 */
export class RawEventQueue {
  free(): void;
  /**
   * Creates a new event collector.
   *
   * # Parameters
   * - `autoDrain`: setting this to `true` is strongly recommended. If true, the collector will
   * be automatically drained before each `world.step(collector)`. If false, the collector will
   * keep all events in memory unless it is manually drained/cleared; this may lead to unbounded use of
   * RAM if no drain is performed.
   */
  constructor(autoDrain: boolean);
  /**
   * Applies the given javascript closure on each collision event of this collector, then clear
   * the internal collision event buffer.
   *
   * # Parameters
   * - `f(handle1, handle2, started)`:  JavaScript closure applied to each collision event. The
   * closure should take three arguments: two integers representing the handles of the colliders
   * involved in the collision, and a boolean indicating if the collision started (true) or stopped
   * (false).
   */
  drainCollisionEvents(f: Function): void;
  drainContactForceEvents(f: Function): void;
  /**
   * Removes all events contained by this collector.
   */
  clear(): void;
}
export class RawGenericJoint {
  private constructor();
  free(): void;
  /**
   * Creates a new joint descriptor that builds generic joints.
   *
   * Generic joints allow arbitrary axes of freedom to be selected
   * for the joint from the available 6 degrees of freedom.
   */
  static generic(anchor1: RawVector, anchor2: RawVector, axis: RawVector, lockedAxes: number): RawGenericJoint | undefined;
  static spring(rest_length: number, stiffness: number, damping: number, anchor1: RawVector, anchor2: RawVector): RawGenericJoint;
  static rope(length: number, anchor1: RawVector, anchor2: RawVector): RawGenericJoint;
  /**
   * Create a new joint descriptor that builds spherical joints.
   *
   * A spherical joints allows three relative rotational degrees of freedom
   * by preventing any relative translation between the anchors of the
   * two attached rigid-bodies.
   */
  static spherical(anchor1: RawVector, anchor2: RawVector): RawGenericJoint;
  /**
   * Creates a new joint descriptor that builds a Prismatic joint.
   *
   * A prismatic joint removes all the degrees of freedom between the
   * affected bodies, except for the translation along one axis.
   *
   * Returns `None` if any of the provided axes cannot be normalized.
   */
  static prismatic(anchor1: RawVector, anchor2: RawVector, axis: RawVector, limitsEnabled: boolean, limitsMin: number, limitsMax: number): RawGenericJoint | undefined;
  /**
   * Creates a new joint descriptor that builds a Fixed joint.
   *
   * A fixed joint removes all the degrees of freedom between the affected bodies.
   */
  static fixed(anchor1: RawVector, axes1: RawRotation, anchor2: RawVector, axes2: RawRotation): RawGenericJoint;
  /**
   * Create a new joint descriptor that builds Revolute joints.
   *
   * A revolute joint removes all degrees of freedom between the affected
   * bodies except for the rotation along one axis.
   */
  static revolute(anchor1: RawVector, anchor2: RawVector, axis: RawVector): RawGenericJoint | undefined;
}
export class RawImpulseJointSet {
  free(): void;
  /**
   * The type of this joint.
   */
  jointType(handle: number): RawJointType;
  /**
   * The unique integer identifier of the first rigid-body this joint it attached to.
   */
  jointBodyHandle1(handle: number): number;
  /**
   * The unique integer identifier of the second rigid-body this joint is attached to.
   */
  jointBodyHandle2(handle: number): number;
  /**
   * The angular part of the joint’s local frame relative to the first rigid-body it is attached to.
   */
  jointFrameX1(handle: number): RawRotation;
  /**
   * The angular part of the joint’s local frame relative to the second rigid-body it is attached to.
   */
  jointFrameX2(handle: number): RawRotation;
  /**
   * The position of the first anchor of this joint.
   *
   * The first anchor gives the position of the points application point on the
   * local frame of the first rigid-body it is attached to.
   */
  jointAnchor1(handle: number): RawVector;
  /**
   * The position of the second anchor of this joint.
   *
   * The second anchor gives the position of the points application point on the
   * local frame of the second rigid-body it is attached to.
   */
  jointAnchor2(handle: number): RawVector;
  /**
   * Sets the position of the first local anchor
   */
  jointSetAnchor1(handle: number, newPos: RawVector): void;
  /**
   * Sets the position of the second local anchor
   */
  jointSetAnchor2(handle: number, newPos: RawVector): void;
  /**
   * Are contacts between the rigid-bodies attached by this joint enabled?
   */
  jointContactsEnabled(handle: number): boolean;
  /**
   * Sets whether contacts are enabled between the rigid-bodies attached by this joint.
   */
  jointSetContactsEnabled(handle: number, enabled: boolean): void;
  /**
   * Are the limits for this joint enabled?
   */
  jointLimitsEnabled(handle: number, axis: RawJointAxis): boolean;
  /**
   * Return the lower limit along the given joint axis.
   */
  jointLimitsMin(handle: number, axis: RawJointAxis): number;
  /**
   * If this is a prismatic joint, returns its upper limit.
   */
  jointLimitsMax(handle: number, axis: RawJointAxis): number;
  /**
   * Enables and sets the joint limits
   */
  jointSetLimits(handle: number, axis: RawJointAxis, min: number, max: number): void;
  jointConfigureMotorModel(handle: number, axis: RawJointAxis, model: RawMotorModel): void;
  jointConfigureMotorVelocity(handle: number, axis: RawJointAxis, targetVel: number, factor: number): void;
  jointConfigureMotorPosition(handle: number, axis: RawJointAxis, targetPos: number, stiffness: number, damping: number): void;
  jointConfigureMotor(handle: number, axis: RawJointAxis, targetPos: number, targetVel: number, stiffness: number, damping: number): void;
  constructor();
  createJoint(params: RawGenericJoint, parent1: number, parent2: number, wake_up: boolean): number;
  remove(handle: number, wakeUp: boolean): void;
  len(): number;
  contains(handle: number): boolean;
  /**
   * Applies the given JavaScript function to the integer handle of each joint managed by this physics world.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each joint managed by this set. Called as `f(collider)`.
   */
  forEachJointHandle(f: Function): void;
  /**
   * Applies the given JavaScript function to the integer handle of each joint attached to the given rigid-body.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each joint attached to the rigid-body. Called as `f(collider)`.
   */
  forEachJointAttachedToRigidBody(body: number, f: Function): void;
}
export class RawIntegrationParameters {
  free(): void;
  constructor();
  dt: number;
  readonly contact_erp: number;
  normalizedAllowedLinearError: number;
  normalizedPredictionDistance: number;
  numSolverIterations: number;
  numInternalPgsIterations: number;
  minIslandSize: number;
  maxCcdSubsteps: number;
  lengthUnit: number;
  set contact_natural_frequency(value: number);
}
export class RawIslandManager {
  free(): void;
  constructor();
  /**
   * Applies the given JavaScript function to the integer handle of each active rigid-body
   * managed by this island manager.
   *
   * After a short time of inactivity, a rigid-body is automatically deactivated ("asleep") by
   * the physics engine in order to save computational power. A sleeping rigid-body never moves
   * unless it is moved manually by the user.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each active rigid-body managed by this
   *   set. Called as `f(collider)`.
   */
  forEachActiveRigidBodyHandle(f: Function): void;
}
export class RawKinematicCharacterController {
  free(): void;
  constructor(offset: number);
  up(): RawVector;
  setUp(vector: RawVector): void;
  normalNudgeFactor(): number;
  setNormalNudgeFactor(value: number): void;
  offset(): number;
  setOffset(value: number): void;
  slideEnabled(): boolean;
  setSlideEnabled(enabled: boolean): void;
  autostepMaxHeight(): number | undefined;
  autostepMinWidth(): number | undefined;
  autostepIncludesDynamicBodies(): boolean | undefined;
  autostepEnabled(): boolean;
  enableAutostep(maxHeight: number, minWidth: number, includeDynamicBodies: boolean): void;
  disableAutostep(): void;
  maxSlopeClimbAngle(): number;
  setMaxSlopeClimbAngle(angle: number): void;
  minSlopeSlideAngle(): number;
  setMinSlopeSlideAngle(angle: number): void;
  snapToGroundDistance(): number | undefined;
  enableSnapToGround(distance: number): void;
  disableSnapToGround(): void;
  snapToGroundEnabled(): boolean;
  computeColliderMovement(dt: number, broad_phase: RawBroadPhase, narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, collider_handle: number, desired_translation_delta: RawVector, apply_impulses_to_dynamic_bodies: boolean, character_mass: number | null | undefined, filter_flags: number, filter_groups: number | null | undefined, filter_predicate: Function): void;
  computedMovement(): RawVector;
  computedGrounded(): boolean;
  numComputedCollisions(): number;
  computedCollision(i: number, collision: RawCharacterCollision): boolean;
}
export class RawMultibodyJointSet {
  free(): void;
  /**
   * The type of this joint.
   */
  jointType(handle: number): RawJointType;
  /**
   * The angular part of the joint’s local frame relative to the first rigid-body it is attached to.
   */
  jointFrameX1(handle: number): RawRotation;
  /**
   * The angular part of the joint’s local frame relative to the second rigid-body it is attached to.
   */
  jointFrameX2(handle: number): RawRotation;
  /**
   * The position of the first anchor of this joint.
   *
   * The first anchor gives the position of the points application point on the
   * local frame of the first rigid-body it is attached to.
   */
  jointAnchor1(handle: number): RawVector;
  /**
   * The position of the second anchor of this joint.
   *
   * The second anchor gives the position of the points application point on the
   * local frame of the second rigid-body it is attached to.
   */
  jointAnchor2(handle: number): RawVector;
  /**
   * Are contacts between the rigid-bodies attached by this joint enabled?
   */
  jointContactsEnabled(handle: number): boolean;
  /**
   * Sets whether contacts are enabled between the rigid-bodies attached by this joint.
   */
  jointSetContactsEnabled(handle: number, enabled: boolean): void;
  /**
   * Are the limits for this joint enabled?
   */
  jointLimitsEnabled(handle: number, axis: RawJointAxis): boolean;
  /**
   * Return the lower limit along the given joint axis.
   */
  jointLimitsMin(handle: number, axis: RawJointAxis): number;
  /**
   * If this is a prismatic joint, returns its upper limit.
   */
  jointLimitsMax(handle: number, axis: RawJointAxis): number;
  constructor();
  createJoint(params: RawGenericJoint, parent1: number, parent2: number, wakeUp: boolean): number;
  remove(handle: number, wakeUp: boolean): void;
  contains(handle: number): boolean;
  /**
   * Applies the given JavaScript function to the integer handle of each joint managed by this physics world.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each joint managed by this set. Called as `f(collider)`.
   */
  forEachJointHandle(f: Function): void;
  /**
   * Applies the given JavaScript function to the integer handle of each joint attached to the given rigid-body.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each joint attached to the rigid-body. Called as `f(collider)`.
   */
  forEachJointAttachedToRigidBody(body: number, f: Function): void;
}
export class RawNarrowPhase {
  free(): void;
  constructor();
  contact_pairs_with(handle1: number, f: Function): void;
  contact_pair(handle1: number, handle2: number): RawContactPair | undefined;
  intersection_pairs_with(handle1: number, f: Function): void;
  intersection_pair(handle1: number, handle2: number): boolean;
}
export class RawPhysicsPipeline {
  free(): void;
  constructor();
  set_profiler_enabled(enabled: boolean): void;
  is_profiler_enabled(): boolean;
  timing_step(): number;
  timing_collision_detection(): number;
  timing_broad_phase(): number;
  timing_narrow_phase(): number;
  timing_solver(): number;
  timing_velocity_assembly(): number;
  timing_velocity_resolution(): number;
  timing_velocity_update(): number;
  timing_velocity_writeback(): number;
  timing_ccd(): number;
  timing_ccd_toi_computation(): number;
  timing_ccd_broad_phase(): number;
  timing_ccd_narrow_phase(): number;
  timing_ccd_solver(): number;
  timing_island_construction(): number;
  timing_user_changes(): number;
  step(gravity: RawVector, integrationParameters: RawIntegrationParameters, islands: RawIslandManager, broadPhase: RawBroadPhase, narrowPhase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, joints: RawImpulseJointSet, articulations: RawMultibodyJointSet, ccd_solver: RawCCDSolver): void;
  stepWithEvents(gravity: RawVector, integrationParameters: RawIntegrationParameters, islands: RawIslandManager, broadPhase: RawBroadPhase, narrowPhase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, joints: RawImpulseJointSet, articulations: RawMultibodyJointSet, ccd_solver: RawCCDSolver, eventQueue: RawEventQueue, hookObject: object, hookFilterContactPair: Function, hookFilterIntersectionPair: Function): void;
}
export class RawPidController {
  free(): void;
  constructor(kp: number, ki: number, kd: number, axes_mask: number);
  set_kp(kp: number, axes: number): void;
  set_ki(ki: number, axes: number): void;
  set_kd(kd: number, axes: number): void;
  set_axes_mask(axes_mask: number): void;
  reset_integrals(): void;
  apply_linear_correction(dt: number, bodies: RawRigidBodySet, rb_handle: number, target_translation: RawVector, target_linvel: RawVector): void;
  apply_angular_correction(dt: number, bodies: RawRigidBodySet, rb_handle: number, target_rotation: RawRotation, target_angvel: RawVector): void;
  linear_correction(dt: number, bodies: RawRigidBodySet, rb_handle: number, target_translation: RawVector, target_linvel: RawVector): RawVector;
  angular_correction(dt: number, bodies: RawRigidBodySet, rb_handle: number, target_rotation: RawRotation, target_angvel: RawVector): RawVector;
}
export class RawPointColliderProjection {
  private constructor();
  free(): void;
  colliderHandle(): number;
  point(): RawVector;
  isInside(): boolean;
  featureType(): RawFeatureType;
  featureId(): number | undefined;
}
export class RawPointProjection {
  private constructor();
  free(): void;
  point(): RawVector;
  isInside(): boolean;
}
export class RawRayColliderHit {
  private constructor();
  free(): void;
  colliderHandle(): number;
  timeOfImpact(): number;
}
export class RawRayColliderIntersection {
  private constructor();
  free(): void;
  colliderHandle(): number;
  normal(): RawVector;
  time_of_impact(): number;
  featureType(): RawFeatureType;
  featureId(): number | undefined;
}
export class RawRayIntersection {
  private constructor();
  free(): void;
  normal(): RawVector;
  time_of_impact(): number;
  featureType(): RawFeatureType;
  featureId(): number | undefined;
}
export class RawRigidBodySet {
  free(): void;
  /**
   * The world-space translation of this rigid-body.
   */
  rbTranslation(handle: number): RawVector;
  /**
   * The world-space orientation of this rigid-body.
   */
  rbRotation(handle: number): RawRotation;
  /**
   * Put the given rigid-body to sleep.
   */
  rbSleep(handle: number): void;
  /**
   * Is this rigid-body sleeping?
   */
  rbIsSleeping(handle: number): boolean;
  /**
   * Is the velocity of this rigid-body not zero?
   */
  rbIsMoving(handle: number): boolean;
  /**
   * The world-space predicted translation of this rigid-body.
   *
   * If this rigid-body is kinematic this value is set by the `setNextKinematicTranslation`
   * method and is used for estimating the kinematic body velocity at the next timestep.
   * For non-kinematic bodies, this value is currently unspecified.
   */
  rbNextTranslation(handle: number): RawVector;
  /**
   * The world-space predicted orientation of this rigid-body.
   *
   * If this rigid-body is kinematic this value is set by the `setNextKinematicRotation`
   * method and is used for estimating the kinematic body velocity at the next timestep.
   * For non-kinematic bodies, this value is currently unspecified.
   */
  rbNextRotation(handle: number): RawRotation;
  /**
   * Sets the translation of this rigid-body.
   *
   * # Parameters
   * - `x`: the world-space position of the rigid-body along the `x` axis.
   * - `y`: the world-space position of the rigid-body along the `y` axis.
   * - `z`: the world-space position of the rigid-body along the `z` axis.
   * - `wakeUp`: forces the rigid-body to wake-up so it is properly affected by forces if it
   * wasn't moving before modifying its position.
   */
  rbSetTranslation(handle: number, x: number, y: number, z: number, wakeUp: boolean): void;
  /**
   * Sets the rotation quaternion of this rigid-body.
   *
   * This does nothing if a zero quaternion is provided.
   *
   * # Parameters
   * - `x`: the first vector component of the quaternion.
   * - `y`: the second vector component of the quaternion.
   * - `z`: the third vector component of the quaternion.
   * - `w`: the scalar component of the quaternion.
   * - `wakeUp`: forces the rigid-body to wake-up so it is properly affected by forces if it
   * wasn't moving before modifying its position.
   */
  rbSetRotation(handle: number, x: number, y: number, z: number, w: number, wakeUp: boolean): void;
  /**
   * Sets the linear velocity of this rigid-body.
   */
  rbSetLinvel(handle: number, linvel: RawVector, wakeUp: boolean): void;
  /**
   * Sets the angular velocity of this rigid-body.
   */
  rbSetAngvel(handle: number, angvel: RawVector, wakeUp: boolean): void;
  /**
   * If this rigid body is kinematic, sets its future translation after the next timestep integration.
   *
   * This should be used instead of `rigidBody.setTranslation` to make the dynamic object
   * interacting with this kinematic body behave as expected. Internally, Rapier will compute
   * an artificial velocity for this rigid-body from its current position and its next kinematic
   * position. This velocity will be used to compute forces on dynamic bodies interacting with
   * this body.
   *
   * # Parameters
   * - `x`: the world-space position of the rigid-body along the `x` axis.
   * - `y`: the world-space position of the rigid-body along the `y` axis.
   * - `z`: the world-space position of the rigid-body along the `z` axis.
   */
  rbSetNextKinematicTranslation(handle: number, x: number, y: number, z: number): void;
  /**
   * If this rigid body is kinematic, sets its future rotation after the next timestep integration.
   *
   * This should be used instead of `rigidBody.setRotation` to make the dynamic object
   * interacting with this kinematic body behave as expected. Internally, Rapier will compute
   * an artificial velocity for this rigid-body from its current position and its next kinematic
   * position. This velocity will be used to compute forces on dynamic bodies interacting with
   * this body.
   *
   * # Parameters
   * - `x`: the first vector component of the quaternion.
   * - `y`: the second vector component of the quaternion.
   * - `z`: the third vector component of the quaternion.
   * - `w`: the scalar component of the quaternion.
   */
  rbSetNextKinematicRotation(handle: number, x: number, y: number, z: number, w: number): void;
  rbRecomputeMassPropertiesFromColliders(handle: number, colliders: RawColliderSet): void;
  rbSetAdditionalMass(handle: number, mass: number, wake_up: boolean): void;
  rbSetAdditionalMassProperties(handle: number, mass: number, centerOfMass: RawVector, principalAngularInertia: RawVector, angularInertiaFrame: RawRotation, wake_up: boolean): void;
  /**
   * The linear velocity of this rigid-body.
   */
  rbLinvel(handle: number): RawVector;
  /**
   * The angular velocity of this rigid-body.
   */
  rbAngvel(handle: number): RawVector;
  /**
   * The velocity of the given world-space point on this rigid-body.
   */
  rbVelocityAtPoint(handle: number, point: RawVector): RawVector;
  rbLockTranslations(handle: number, locked: boolean, wake_up: boolean): void;
  rbSetEnabledTranslations(handle: number, allow_x: boolean, allow_y: boolean, allow_z: boolean, wake_up: boolean): void;
  rbLockRotations(handle: number, locked: boolean, wake_up: boolean): void;
  rbSetEnabledRotations(handle: number, allow_x: boolean, allow_y: boolean, allow_z: boolean, wake_up: boolean): void;
  rbDominanceGroup(handle: number): number;
  rbSetDominanceGroup(handle: number, group: number): void;
  rbEnableCcd(handle: number, enabled: boolean): void;
  rbSetSoftCcdPrediction(handle: number, prediction: number): void;
  /**
   * The mass of this rigid-body.
   */
  rbMass(handle: number): number;
  /**
   * The inverse of the mass of a rigid-body.
   *
   * If this is zero, the rigid-body is assumed to have infinite mass.
   */
  rbInvMass(handle: number): number;
  /**
   * The inverse mass taking into account translation locking.
   */
  rbEffectiveInvMass(handle: number): RawVector;
  /**
   * The center of mass of a rigid-body expressed in its local-space.
   */
  rbLocalCom(handle: number): RawVector;
  /**
   * The world-space center of mass of the rigid-body.
   */
  rbWorldCom(handle: number): RawVector;
  /**
   * The inverse of the principal angular inertia of the rigid-body.
   *
   * Components set to zero are assumed to be infinite along the corresponding principal axis.
   */
  rbInvPrincipalInertia(handle: number): RawVector;
  /**
   * The principal vectors of the local angular inertia tensor of the rigid-body.
   */
  rbPrincipalInertiaLocalFrame(handle: number): RawRotation;
  /**
   * The angular inertia along the principal inertia axes of the rigid-body.
   */
  rbPrincipalInertia(handle: number): RawVector;
  /**
   * The world-space inverse angular inertia tensor of the rigid-body,
   * taking into account rotation locking.
   */
  rbEffectiveWorldInvInertia(handle: number): RawSdpMatrix3;
  /**
   * The effective world-space angular inertia (that takes the potential rotation locking into account) of
   * this rigid-body.
   */
  rbEffectiveAngularInertia(handle: number): RawSdpMatrix3;
  /**
   * Wakes this rigid-body up.
   *
   * A dynamic rigid-body that does not move during several consecutive frames will
   * be put to sleep by the physics engine, i.e., it will stop being simulated in order
   * to avoid useless computations.
   * This method forces a sleeping rigid-body to wake-up. This is useful, e.g., before modifying
   * the position of a dynamic body so that it is properly simulated afterwards.
   */
  rbWakeUp(handle: number): void;
  /**
   * Is Continuous Collision Detection enabled for this rigid-body?
   */
  rbIsCcdEnabled(handle: number): boolean;
  rbSoftCcdPrediction(handle: number): number;
  /**
   * The number of colliders attached to this rigid-body.
   */
  rbNumColliders(handle: number): number;
  /**
   * Retrieves the `i-th` collider attached to this rigid-body.
   *
   * # Parameters
   * - `at`: The index of the collider to retrieve. Must be a number in `[0, this.numColliders()[`.
   *         This index is **not** the same as the unique identifier of the collider.
   */
  rbCollider(handle: number, at: number): number;
  /**
   * The status of this rigid-body: fixed, dynamic, or kinematic.
   */
  rbBodyType(handle: number): RawRigidBodyType;
  /**
   * Set a new status for this rigid-body: fixed, dynamic, or kinematic.
   */
  rbSetBodyType(handle: number, status: RawRigidBodyType, wake_up: boolean): void;
  /**
   * Is this rigid-body fixed?
   */
  rbIsFixed(handle: number): boolean;
  /**
   * Is this rigid-body kinematic?
   */
  rbIsKinematic(handle: number): boolean;
  /**
   * Is this rigid-body dynamic?
   */
  rbIsDynamic(handle: number): boolean;
  /**
   * The linear damping coefficient of this rigid-body.
   */
  rbLinearDamping(handle: number): number;
  /**
   * The angular damping coefficient of this rigid-body.
   */
  rbAngularDamping(handle: number): number;
  rbSetLinearDamping(handle: number, factor: number): void;
  rbSetAngularDamping(handle: number, factor: number): void;
  rbSetEnabled(handle: number, enabled: boolean): void;
  rbIsEnabled(handle: number): boolean;
  rbGravityScale(handle: number): number;
  rbSetGravityScale(handle: number, factor: number, wakeUp: boolean): void;
  /**
   * Resets to zero all user-added forces added to this rigid-body.
   */
  rbResetForces(handle: number, wakeUp: boolean): void;
  /**
   * Resets to zero all user-added torques added to this rigid-body.
   */
  rbResetTorques(handle: number, wakeUp: boolean): void;
  /**
   * Adds a force at the center-of-mass of this rigid-body.
   *
   * # Parameters
   * - `force`: the world-space force to apply on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbAddForce(handle: number, force: RawVector, wakeUp: boolean): void;
  /**
   * Applies an impulse at the center-of-mass of this rigid-body.
   *
   * # Parameters
   * - `impulse`: the world-space impulse to apply on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbApplyImpulse(handle: number, impulse: RawVector, wakeUp: boolean): void;
  /**
   * Adds a torque at the center-of-mass of this rigid-body.
   *
   * # Parameters
   * - `torque`: the world-space torque to apply on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbAddTorque(handle: number, torque: RawVector, wakeUp: boolean): void;
  /**
   * Applies an impulsive torque at the center-of-mass of this rigid-body.
   *
   * # Parameters
   * - `torque impulse`: the world-space torque impulse to apply on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbApplyTorqueImpulse(handle: number, torque_impulse: RawVector, wakeUp: boolean): void;
  /**
   * Adds a force at the given world-space point of this rigid-body.
   *
   * # Parameters
   * - `force`: the world-space force to apply on the rigid-body.
   * - `point`: the world-space point where the impulse is to be applied on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbAddForceAtPoint(handle: number, force: RawVector, point: RawVector, wakeUp: boolean): void;
  /**
   * Applies an impulse at the given world-space point of this rigid-body.
   *
   * # Parameters
   * - `impulse`: the world-space impulse to apply on the rigid-body.
   * - `point`: the world-space point where the impulse is to be applied on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbApplyImpulseAtPoint(handle: number, impulse: RawVector, point: RawVector, wakeUp: boolean): void;
  rbAdditionalSolverIterations(handle: number): number;
  rbSetAdditionalSolverIterations(handle: number, iters: number): void;
  /**
   * An arbitrary user-defined 32-bit integer
   */
  rbUserData(handle: number): number;
  /**
   * Sets the user-defined 32-bit integer of this rigid-body.
   *
   * # Parameters
   * - `data`: an arbitrary user-defined 32-bit integer.
   */
  rbSetUserData(handle: number, data: number): void;
  /**
   * Retrieves the constant force(s) the user added to this rigid-body.
   * Returns zero if the rigid-body is not dynamic.
   */
  rbUserForce(handle: number): RawVector;
  /**
   * Retrieves the constant torque(s) the user added to this rigid-body.
   * Returns zero if the rigid-body is not dynamic.
   */
  rbUserTorque(handle: number): RawVector;
  constructor();
  createRigidBody(enabled: boolean, translation: RawVector, rotation: RawRotation, gravityScale: number, mass: number, massOnly: boolean, centerOfMass: RawVector, linvel: RawVector, angvel: RawVector, principalAngularInertia: RawVector, angularInertiaFrame: RawRotation, translationEnabledX: boolean, translationEnabledY: boolean, translationEnabledZ: boolean, rotationEnabledX: boolean, rotationEnabledY: boolean, rotationEnabledZ: boolean, linearDamping: number, angularDamping: number, rb_type: RawRigidBodyType, canSleep: boolean, sleeping: boolean, softCcdPrediction: number, ccdEnabled: boolean, dominanceGroup: number, additional_solver_iterations: number): number;
  remove(handle: number, islands: RawIslandManager, colliders: RawColliderSet, joints: RawImpulseJointSet, articulations: RawMultibodyJointSet): void;
  /**
   * The number of rigid-bodies on this set.
   */
  len(): number;
  /**
   * Checks if a rigid-body with the given integer handle exists.
   */
  contains(handle: number): boolean;
  /**
   * Applies the given JavaScript function to the integer handle of each rigid-body managed by this set.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each rigid-body managed by this set. Called as `f(collider)`.
   */
  forEachRigidBodyHandle(f: Function): void;
  propagateModifiedBodyPositionsToColliders(colliders: RawColliderSet): void;
}
/**
 * A rotation quaternion.
 */
export class RawRotation {
  free(): void;
  constructor(x: number, y: number, z: number, w: number);
  /**
   * The identity quaternion.
   */
  static identity(): RawRotation;
  /**
   * The `x` component of this quaternion.
   */
  readonly x: number;
  /**
   * The `y` component of this quaternion.
   */
  readonly y: number;
  /**
   * The `z` component of this quaternion.
   */
  readonly z: number;
  /**
   * The `w` component of this quaternion.
   */
  readonly w: number;
}
export class RawSdpMatrix3 {
  private constructor();
  free(): void;
  /**
   * Row major list of the upper-triangular part of the symmetric matrix.
   */
  elements(): Float32Array;
}
export class RawSerializationPipeline {
  free(): void;
  constructor();
  serializeAll(gravity: RawVector, integrationParameters: RawIntegrationParameters, islands: RawIslandManager, broadPhase: RawBroadPhase, narrowPhase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, impulse_joints: RawImpulseJointSet, multibody_joints: RawMultibodyJointSet): Uint8Array | undefined;
  deserializeAll(data: Uint8Array): RawDeserializedWorld | undefined;
}
export class RawShape {
  private constructor();
  free(): void;
  static cuboid(hx: number, hy: number, hz: number): RawShape;
  static roundCuboid(hx: number, hy: number, hz: number, borderRadius: number): RawShape;
  static ball(radius: number): RawShape;
  static halfspace(normal: RawVector): RawShape;
  static capsule(halfHeight: number, radius: number): RawShape;
  static cylinder(halfHeight: number, radius: number): RawShape;
  static roundCylinder(halfHeight: number, radius: number, borderRadius: number): RawShape;
  static cone(halfHeight: number, radius: number): RawShape;
  static roundCone(halfHeight: number, radius: number, borderRadius: number): RawShape;
  static voxels(voxel_size: RawVector, grid_coords: Int32Array): RawShape;
  static voxelsFromPoints(voxel_size: RawVector, points: Float32Array): RawShape;
  static polyline(vertices: Float32Array, indices: Uint32Array): RawShape;
  static trimesh(vertices: Float32Array, indices: Uint32Array, flags: number): RawShape | undefined;
  static heightfield(nrows: number, ncols: number, heights: Float32Array, scale: RawVector, flags: number): RawShape;
  static segment(p1: RawVector, p2: RawVector): RawShape;
  static triangle(p1: RawVector, p2: RawVector, p3: RawVector): RawShape;
  static roundTriangle(p1: RawVector, p2: RawVector, p3: RawVector, borderRadius: number): RawShape;
  static convexHull(points: Float32Array): RawShape | undefined;
  static roundConvexHull(points: Float32Array, borderRadius: number): RawShape | undefined;
  static convexMesh(vertices: Float32Array, indices: Uint32Array): RawShape | undefined;
  static roundConvexMesh(vertices: Float32Array, indices: Uint32Array, borderRadius: number): RawShape | undefined;
  castShape(shapePos1: RawVector, shapeRot1: RawRotation, shapeVel1: RawVector, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation, shapeVel2: RawVector, target_distance: number, maxToi: number, stop_at_penetration: boolean): RawShapeCastHit | undefined;
  intersectsShape(shapePos1: RawVector, shapeRot1: RawRotation, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation): boolean;
  contactShape(shapePos1: RawVector, shapeRot1: RawRotation, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation, prediction: number): RawShapeContact | undefined;
  containsPoint(shapePos: RawVector, shapeRot: RawRotation, point: RawVector): boolean;
  projectPoint(shapePos: RawVector, shapeRot: RawRotation, point: RawVector, solid: boolean): RawPointProjection;
  intersectsRay(shapePos: RawVector, shapeRot: RawRotation, rayOrig: RawVector, rayDir: RawVector, maxToi: number): boolean;
  castRay(shapePos: RawVector, shapeRot: RawRotation, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean): number;
  castRayAndGetNormal(shapePos: RawVector, shapeRot: RawRotation, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean): RawRayIntersection | undefined;
}
export class RawShapeCastHit {
  private constructor();
  free(): void;
  time_of_impact(): number;
  witness1(): RawVector;
  witness2(): RawVector;
  normal1(): RawVector;
  normal2(): RawVector;
}
export class RawShapeContact {
  private constructor();
  free(): void;
  distance(): number;
  point1(): RawVector;
  point2(): RawVector;
  normal1(): RawVector;
  normal2(): RawVector;
}
/**
 * A vector.
 */
export class RawVector {
  free(): void;
  /**
   * Creates a new vector filled with zeros.
   */
  static zero(): RawVector;
  /**
   * Creates a new 3D vector from its two components.
   *
   * # Parameters
   * - `x`: the `x` component of this 3D vector.
   * - `y`: the `y` component of this 3D vector.
   * - `z`: the `z` component of this 3D vector.
   */
  constructor(x: number, y: number, z: number);
  /**
   * Create a new 3D vector from this vector with its components rearranged as `{x, y, z}`.
   *
   * This will effectively return a copy of `this`. This method exist for completeness with the
   * other swizzling functions.
   */
  xyz(): RawVector;
  /**
   * Create a new 3D vector from this vector with its components rearranged as `{y, x, z}`.
   */
  yxz(): RawVector;
  /**
   * Create a new 3D vector from this vector with its components rearranged as `{z, x, y}`.
   */
  zxy(): RawVector;
  /**
   * Create a new 3D vector from this vector with its components rearranged as `{x, z, y}`.
   */
  xzy(): RawVector;
  /**
   * Create a new 3D vector from this vector with its components rearranged as `{y, z, x}`.
   */
  yzx(): RawVector;
  /**
   * Create a new 3D vector from this vector with its components rearranged as `{z, y, x}`.
   */
  zyx(): RawVector;
  /**
   * The `x` component of this vector.
   */
  x: number;
  /**
   * The `y` component of this vector.
   */
  y: number;
  /**
   * The `z` component of this vector.
   */
  z: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly version: (a: number) => void;
  readonly __wbg_rawkinematiccharactercontroller_free: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_new: (a: number) => number;
  readonly rawkinematiccharactercontroller_setUp: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_normalNudgeFactor: (a: number) => number;
  readonly rawkinematiccharactercontroller_setNormalNudgeFactor: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_offset: (a: number) => number;
  readonly rawkinematiccharactercontroller_setOffset: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_slideEnabled: (a: number) => number;
  readonly rawkinematiccharactercontroller_setSlideEnabled: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_autostepMaxHeight: (a: number) => number;
  readonly rawkinematiccharactercontroller_autostepMinWidth: (a: number) => number;
  readonly rawkinematiccharactercontroller_autostepIncludesDynamicBodies: (a: number) => number;
  readonly rawkinematiccharactercontroller_autostepEnabled: (a: number) => number;
  readonly rawkinematiccharactercontroller_enableAutostep: (a: number, b: number, c: number, d: number) => void;
  readonly rawkinematiccharactercontroller_disableAutostep: (a: number) => void;
  readonly rawkinematiccharactercontroller_maxSlopeClimbAngle: (a: number) => number;
  readonly rawkinematiccharactercontroller_setMaxSlopeClimbAngle: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_minSlopeSlideAngle: (a: number) => number;
  readonly rawkinematiccharactercontroller_setMinSlopeSlideAngle: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_snapToGroundDistance: (a: number) => number;
  readonly rawkinematiccharactercontroller_enableSnapToGround: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_disableSnapToGround: (a: number) => void;
  readonly rawkinematiccharactercontroller_snapToGroundEnabled: (a: number) => number;
  readonly rawkinematiccharactercontroller_computeColliderMovement: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
  readonly rawkinematiccharactercontroller_computedMovement: (a: number) => number;
  readonly rawkinematiccharactercontroller_computedGrounded: (a: number) => number;
  readonly rawkinematiccharactercontroller_numComputedCollisions: (a: number) => number;
  readonly rawkinematiccharactercontroller_computedCollision: (a: number, b: number, c: number) => number;
  readonly __wbg_rawcharactercollision_free: (a: number, b: number) => void;
  readonly rawcharactercollision_new: () => number;
  readonly rawcharactercollision_handle: (a: number) => number;
  readonly rawcharactercollision_translationDeltaApplied: (a: number) => number;
  readonly rawcharactercollision_translationDeltaRemaining: (a: number) => number;
  readonly rawcharactercollision_toi: (a: number) => number;
  readonly rawcharactercollision_worldWitness1: (a: number) => number;
  readonly rawcharactercollision_worldWitness2: (a: number) => number;
  readonly rawcharactercollision_worldNormal1: (a: number) => number;
  readonly rawcharactercollision_worldNormal2: (a: number) => number;
  readonly __wbg_rawpidcontroller_free: (a: number, b: number) => void;
  readonly rawpidcontroller_new: (a: number, b: number, c: number, d: number) => number;
  readonly rawpidcontroller_set_kp: (a: number, b: number, c: number) => void;
  readonly rawpidcontroller_set_ki: (a: number, b: number, c: number) => void;
  readonly rawpidcontroller_set_kd: (a: number, b: number, c: number) => void;
  readonly rawpidcontroller_set_axes_mask: (a: number, b: number) => void;
  readonly rawpidcontroller_reset_integrals: (a: number) => void;
  readonly rawpidcontroller_apply_linear_correction: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawpidcontroller_apply_angular_correction: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawpidcontroller_linear_correction: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawpidcontroller_angular_correction: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly __wbg_rawdynamicraycastvehiclecontroller_free: (a: number, b: number) => void;
  readonly rawdynamicraycastvehiclecontroller_new: (a: number) => number;
  readonly rawdynamicraycastvehiclecontroller_current_vehicle_speed: (a: number) => number;
  readonly rawdynamicraycastvehiclecontroller_chassis: (a: number) => number;
  readonly rawdynamicraycastvehiclecontroller_index_up_axis: (a: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_index_up_axis: (a: number, b: number) => void;
  readonly rawdynamicraycastvehiclecontroller_index_forward_axis: (a: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_index_forward_axis: (a: number, b: number) => void;
  readonly rawdynamicraycastvehiclecontroller_add_wheel: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawdynamicraycastvehiclecontroller_num_wheels: (a: number) => number;
  readonly rawdynamicraycastvehiclecontroller_update_vehicle: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_chassis_connection_point_cs: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_chassis_connection_point_cs: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_suspension_rest_length: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_suspension_rest_length: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_max_suspension_travel: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_max_suspension_travel: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_radius: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_radius: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_suspension_stiffness: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_suspension_stiffness: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_suspension_compression: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_suspension_compression: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_suspension_relaxation: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_suspension_relaxation: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_max_suspension_force: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_max_suspension_force: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_brake: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_brake: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_steering: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_steering: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_engine_force: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_engine_force: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_direction_cs: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_direction_cs: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_axle_cs: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_axle_cs: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_friction_slip: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_friction_slip: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_side_friction_stiffness: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_set_wheel_side_friction_stiffness: (a: number, b: number, c: number) => void;
  readonly rawdynamicraycastvehiclecontroller_wheel_rotation: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_wheel_forward_impulse: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_wheel_side_impulse: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_wheel_suspension_force: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_wheel_contact_normal_ws: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_wheel_contact_point_ws: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_wheel_suspension_length: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_wheel_hard_point_ws: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_wheel_is_in_contact: (a: number, b: number) => number;
  readonly rawdynamicraycastvehiclecontroller_wheel_ground_object: (a: number, b: number, c: number) => void;
  readonly __wbg_rawccdsolver_free: (a: number, b: number) => void;
  readonly rawimpulsejointset_jointType: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointBodyHandle1: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointBodyHandle2: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointFrameX1: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointFrameX2: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointAnchor1: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointAnchor2: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointSetAnchor1: (a: number, b: number, c: number) => void;
  readonly rawimpulsejointset_jointSetAnchor2: (a: number, b: number, c: number) => void;
  readonly rawimpulsejointset_jointContactsEnabled: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointSetContactsEnabled: (a: number, b: number, c: number) => void;
  readonly rawimpulsejointset_jointLimitsEnabled: (a: number, b: number, c: number) => number;
  readonly rawimpulsejointset_jointLimitsMin: (a: number, b: number, c: number) => number;
  readonly rawimpulsejointset_jointLimitsMax: (a: number, b: number, c: number) => number;
  readonly rawimpulsejointset_jointSetLimits: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawimpulsejointset_jointConfigureMotorModel: (a: number, b: number, c: number, d: number) => void;
  readonly rawimpulsejointset_jointConfigureMotorVelocity: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawimpulsejointset_jointConfigureMotorPosition: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawimpulsejointset_jointConfigureMotor: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly __wbg_rawimpulsejointset_free: (a: number, b: number) => void;
  readonly rawimpulsejointset_new: () => number;
  readonly rawimpulsejointset_createJoint: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawimpulsejointset_remove: (a: number, b: number, c: number) => void;
  readonly rawimpulsejointset_len: (a: number) => number;
  readonly rawimpulsejointset_contains: (a: number, b: number) => number;
  readonly rawimpulsejointset_forEachJointHandle: (a: number, b: number) => void;
  readonly rawimpulsejointset_forEachJointAttachedToRigidBody: (a: number, b: number, c: number) => void;
  readonly __wbg_rawintegrationparameters_free: (a: number, b: number) => void;
  readonly rawintegrationparameters_new: () => number;
  readonly rawintegrationparameters_dt: (a: number) => number;
  readonly rawintegrationparameters_contact_erp: (a: number) => number;
  readonly rawintegrationparameters_normalizedAllowedLinearError: (a: number) => number;
  readonly rawintegrationparameters_normalizedPredictionDistance: (a: number) => number;
  readonly rawintegrationparameters_numSolverIterations: (a: number) => number;
  readonly rawintegrationparameters_minIslandSize: (a: number) => number;
  readonly rawintegrationparameters_maxCcdSubsteps: (a: number) => number;
  readonly rawintegrationparameters_set_dt: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_contact_natural_frequency: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_normalizedAllowedLinearError: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_normalizedPredictionDistance: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_numSolverIterations: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_minIslandSize: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_maxCcdSubsteps: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_lengthUnit: (a: number, b: number) => void;
  readonly __wbg_rawislandmanager_free: (a: number, b: number) => void;
  readonly rawislandmanager_new: () => number;
  readonly rawislandmanager_forEachActiveRigidBodyHandle: (a: number, b: number) => void;
  readonly __wbg_rawgenericjoint_free: (a: number, b: number) => void;
  readonly rawgenericjoint_generic: (a: number, b: number, c: number, d: number) => number;
  readonly rawgenericjoint_spring: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawgenericjoint_rope: (a: number, b: number, c: number) => number;
  readonly rawgenericjoint_spherical: (a: number, b: number) => number;
  readonly rawgenericjoint_prismatic: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawgenericjoint_fixed: (a: number, b: number, c: number, d: number) => number;
  readonly rawgenericjoint_revolute: (a: number, b: number, c: number) => number;
  readonly rawmultibodyjointset_jointType: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointFrameX1: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointFrameX2: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointAnchor1: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointAnchor2: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointContactsEnabled: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointSetContactsEnabled: (a: number, b: number, c: number) => void;
  readonly rawmultibodyjointset_jointLimitsEnabled: (a: number, b: number, c: number) => number;
  readonly rawmultibodyjointset_jointLimitsMin: (a: number, b: number, c: number) => number;
  readonly rawmultibodyjointset_jointLimitsMax: (a: number, b: number, c: number) => number;
  readonly __wbg_rawmultibodyjointset_free: (a: number, b: number) => void;
  readonly rawmultibodyjointset_new: () => number;
  readonly rawmultibodyjointset_createJoint: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawmultibodyjointset_remove: (a: number, b: number, c: number) => void;
  readonly rawmultibodyjointset_contains: (a: number, b: number) => number;
  readonly rawmultibodyjointset_forEachJointHandle: (a: number, b: number) => void;
  readonly rawmultibodyjointset_forEachJointAttachedToRigidBody: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbTranslation: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbRotation: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSleep: (a: number, b: number) => void;
  readonly rawrigidbodyset_rbIsSleeping: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsMoving: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbNextTranslation: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbNextRotation: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSetTranslation: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawrigidbodyset_rbSetRotation: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly rawrigidbodyset_rbSetLinvel: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetAngvel: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetNextKinematicTranslation: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawrigidbodyset_rbSetNextKinematicRotation: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawrigidbodyset_rbRecomputeMassPropertiesFromColliders: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetAdditionalMass: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetAdditionalMassProperties: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly rawrigidbodyset_rbLinvel: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbAngvel: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbVelocityAtPoint: (a: number, b: number, c: number) => number;
  readonly rawrigidbodyset_rbLockTranslations: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetEnabledTranslations: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawrigidbodyset_rbLockRotations: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetEnabledRotations: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawrigidbodyset_rbDominanceGroup: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSetDominanceGroup: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbEnableCcd: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetSoftCcdPrediction: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbMass: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbInvMass: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbEffectiveInvMass: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbLocalCom: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbWorldCom: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbInvPrincipalInertia: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbPrincipalInertiaLocalFrame: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbPrincipalInertia: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbEffectiveWorldInvInertia: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbEffectiveAngularInertia: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbWakeUp: (a: number, b: number) => void;
  readonly rawrigidbodyset_rbIsCcdEnabled: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSoftCcdPrediction: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbNumColliders: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbCollider: (a: number, b: number, c: number) => number;
  readonly rawrigidbodyset_rbBodyType: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSetBodyType: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbIsFixed: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsKinematic: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsDynamic: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbLinearDamping: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbAngularDamping: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSetLinearDamping: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetAngularDamping: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetEnabled: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbIsEnabled: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbGravityScale: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSetGravityScale: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbResetForces: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbResetTorques: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbAddForce: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbApplyImpulse: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbAddTorque: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbApplyTorqueImpulse: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbAddForceAtPoint: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawrigidbodyset_rbApplyImpulseAtPoint: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawrigidbodyset_rbAdditionalSolverIterations: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSetAdditionalSolverIterations: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbUserData: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSetUserData: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbUserForce: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbUserTorque: (a: number, b: number) => number;
  readonly __wbg_rawrigidbodyset_free: (a: number, b: number) => void;
  readonly rawrigidbodyset_new: () => number;
  readonly rawrigidbodyset_createRigidBody: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number, u: number, v: number, w: number, x: number, y: number, z: number, a1: number) => number;
  readonly rawrigidbodyset_remove: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawrigidbodyset_len: (a: number) => number;
  readonly rawrigidbodyset_contains: (a: number, b: number) => number;
  readonly rawrigidbodyset_forEachRigidBodyHandle: (a: number, b: number) => void;
  readonly rawrigidbodyset_propagateModifiedBodyPositionsToColliders: (a: number, b: number) => void;
  readonly __wbg_rawbroadphase_free: (a: number, b: number) => void;
  readonly rawbroadphase_new: () => number;
  readonly rawbroadphase_castRay: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => number;
  readonly rawbroadphase_castRayAndGetNormal: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => number;
  readonly rawbroadphase_intersectionsWithRay: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number) => void;
  readonly rawbroadphase_intersectionWithShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => void;
  readonly rawbroadphase_projectPoint: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => number;
  readonly rawbroadphase_projectPointAndGetFeature: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => number;
  readonly rawbroadphase_intersectionsWithPoint: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
  readonly rawbroadphase_castShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number) => number;
  readonly rawbroadphase_intersectionsWithShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => void;
  readonly rawbroadphase_collidersWithAabbIntersectingAabb: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly rawcolliderset_coTranslation: (a: number, b: number) => number;
  readonly rawcolliderset_coRotation: (a: number, b: number) => number;
  readonly rawcolliderset_coTranslationWrtParent: (a: number, b: number) => number;
  readonly rawcolliderset_coRotationWrtParent: (a: number, b: number) => number;
  readonly rawcolliderset_coSetTranslation: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawcolliderset_coSetTranslationWrtParent: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawcolliderset_coSetRotation: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawcolliderset_coSetRotationWrtParent: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawcolliderset_coIsSensor: (a: number, b: number) => number;
  readonly rawcolliderset_coShapeType: (a: number, b: number) => number;
  readonly rawcolliderset_coHalfspaceNormal: (a: number, b: number) => number;
  readonly rawcolliderset_coHalfExtents: (a: number, b: number) => number;
  readonly rawcolliderset_coSetHalfExtents: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coRadius: (a: number, b: number) => number;
  readonly rawcolliderset_coSetRadius: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coHalfHeight: (a: number, b: number) => number;
  readonly rawcolliderset_coSetHalfHeight: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coRoundRadius: (a: number, b: number) => number;
  readonly rawcolliderset_coSetRoundRadius: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coVoxelData: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coVoxelSize: (a: number, b: number) => number;
  readonly rawcolliderset_coSetVoxel: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawcolliderset_coPropagateVoxelChange: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly rawcolliderset_coCombineVoxelStates: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawcolliderset_coVertices: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coIndices: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coTriMeshFlags: (a: number, b: number) => number;
  readonly rawcolliderset_coHeightFieldFlags: (a: number, b: number) => number;
  readonly rawcolliderset_coHeightfieldHeights: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coHeightfieldScale: (a: number, b: number) => number;
  readonly rawcolliderset_coHeightfieldNRows: (a: number, b: number) => number;
  readonly rawcolliderset_coHeightfieldNCols: (a: number, b: number) => number;
  readonly rawcolliderset_coParent: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetEnabled: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coIsEnabled: (a: number, b: number) => number;
  readonly rawcolliderset_coSetContactSkin: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coContactSkin: (a: number, b: number) => number;
  readonly rawcolliderset_coFriction: (a: number, b: number) => number;
  readonly rawcolliderset_coRestitution: (a: number, b: number) => number;
  readonly rawcolliderset_coDensity: (a: number, b: number) => number;
  readonly rawcolliderset_coMass: (a: number, b: number) => number;
  readonly rawcolliderset_coVolume: (a: number, b: number) => number;
  readonly rawcolliderset_coCollisionGroups: (a: number, b: number) => number;
  readonly rawcolliderset_coSolverGroups: (a: number, b: number) => number;
  readonly rawcolliderset_coActiveHooks: (a: number, b: number) => number;
  readonly rawcolliderset_coActiveCollisionTypes: (a: number, b: number) => number;
  readonly rawcolliderset_coActiveEvents: (a: number, b: number) => number;
  readonly rawcolliderset_coContactForceEventThreshold: (a: number, b: number) => number;
  readonly rawcolliderset_coContainsPoint: (a: number, b: number, c: number) => number;
  readonly rawcolliderset_coCastShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => number;
  readonly rawcolliderset_coCastCollider: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly rawcolliderset_coIntersectsShape: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawcolliderset_coContactShape: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawcolliderset_coContactCollider: (a: number, b: number, c: number, d: number) => number;
  readonly rawcolliderset_coProjectPoint: (a: number, b: number, c: number, d: number) => number;
  readonly rawcolliderset_coIntersectsRay: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawcolliderset_coCastRay: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawcolliderset_coCastRayAndGetNormal: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawcolliderset_coSetSensor: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetRestitution: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetFriction: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coFrictionCombineRule: (a: number, b: number) => number;
  readonly rawcolliderset_coSetFrictionCombineRule: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coRestitutionCombineRule: (a: number, b: number) => number;
  readonly rawcolliderset_coSetRestitutionCombineRule: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetCollisionGroups: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetSolverGroups: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetActiveHooks: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetActiveEvents: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetActiveCollisionTypes: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetShape: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetContactForceEventThreshold: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetDensity: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetMass: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetMassProperties: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly __wbg_rawcolliderset_free: (a: number, b: number) => void;
  readonly rawcolliderset_new: () => number;
  readonly rawcolliderset_len: (a: number) => number;
  readonly rawcolliderset_contains: (a: number, b: number) => number;
  readonly rawcolliderset_createCollider: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number, u: number, v: number, w: number, x: number, y: number, z: number, a1: number) => void;
  readonly rawcolliderset_remove: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawcolliderset_forEachColliderHandle: (a: number, b: number) => void;
  readonly __wbg_rawshapecontact_free: (a: number, b: number) => void;
  readonly __wbg_rawnarrowphase_free: (a: number, b: number) => void;
  readonly rawnarrowphase_new: () => number;
  readonly rawnarrowphase_contact_pairs_with: (a: number, b: number, c: number) => void;
  readonly rawnarrowphase_contact_pair: (a: number, b: number, c: number) => number;
  readonly rawnarrowphase_intersection_pairs_with: (a: number, b: number, c: number) => void;
  readonly rawnarrowphase_intersection_pair: (a: number, b: number, c: number) => number;
  readonly __wbg_rawcontactmanifold_free: (a: number, b: number) => void;
  readonly rawcontactpair_collider1: (a: number) => number;
  readonly rawcontactpair_collider2: (a: number) => number;
  readonly rawcontactpair_numContactManifolds: (a: number) => number;
  readonly rawcontactpair_contactManifold: (a: number, b: number) => number;
  readonly rawcontactmanifold_normal: (a: number) => number;
  readonly rawcontactmanifold_local_n1: (a: number) => number;
  readonly rawcontactmanifold_local_n2: (a: number) => number;
  readonly rawcontactmanifold_subshape1: (a: number) => number;
  readonly rawcontactmanifold_subshape2: (a: number) => number;
  readonly rawcontactmanifold_num_contacts: (a: number) => number;
  readonly rawcontactmanifold_contact_local_p1: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_local_p2: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_dist: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_fid1: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_fid2: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_impulse: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_tangent_impulse_x: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_tangent_impulse_y: (a: number, b: number) => number;
  readonly rawcontactmanifold_num_solver_contacts: (a: number) => number;
  readonly rawcontactmanifold_solver_contact_point: (a: number, b: number) => number;
  readonly rawcontactmanifold_solver_contact_dist: (a: number, b: number) => number;
  readonly rawcontactmanifold_solver_contact_friction: (a: number, b: number) => number;
  readonly rawcontactmanifold_solver_contact_restitution: (a: number, b: number) => number;
  readonly rawcontactmanifold_solver_contact_tangent_velocity: (a: number, b: number) => number;
  readonly __wbg_rawpointprojection_free: (a: number, b: number) => void;
  readonly rawpointprojection_point: (a: number) => number;
  readonly rawpointprojection_isInside: (a: number) => number;
  readonly __wbg_rawpointcolliderprojection_free: (a: number, b: number) => void;
  readonly rawpointcolliderprojection_colliderHandle: (a: number) => number;
  readonly rawpointcolliderprojection_point: (a: number) => number;
  readonly rawpointcolliderprojection_isInside: (a: number) => number;
  readonly rawpointcolliderprojection_featureType: (a: number) => number;
  readonly rawpointcolliderprojection_featureId: (a: number) => number;
  readonly __wbg_rawrayintersection_free: (a: number, b: number) => void;
  readonly __wbg_rawraycolliderhit_free: (a: number, b: number) => void;
  readonly __wbg_rawshape_free: (a: number, b: number) => void;
  readonly rawshape_cuboid: (a: number, b: number, c: number) => number;
  readonly rawshape_roundCuboid: (a: number, b: number, c: number, d: number) => number;
  readonly rawshape_ball: (a: number) => number;
  readonly rawshape_halfspace: (a: number) => number;
  readonly rawshape_capsule: (a: number, b: number) => number;
  readonly rawshape_cylinder: (a: number, b: number) => number;
  readonly rawshape_roundCylinder: (a: number, b: number, c: number) => number;
  readonly rawshape_cone: (a: number, b: number) => number;
  readonly rawshape_roundCone: (a: number, b: number, c: number) => number;
  readonly rawshape_voxels: (a: number, b: number, c: number) => number;
  readonly rawshape_voxelsFromPoints: (a: number, b: number, c: number) => number;
  readonly rawshape_polyline: (a: number, b: number, c: number, d: number) => number;
  readonly rawshape_trimesh: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawshape_heightfield: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawshape_segment: (a: number, b: number) => number;
  readonly rawshape_triangle: (a: number, b: number, c: number) => number;
  readonly rawshape_roundTriangle: (a: number, b: number, c: number, d: number) => number;
  readonly rawshape_convexHull: (a: number, b: number) => number;
  readonly rawshape_roundConvexHull: (a: number, b: number, c: number) => number;
  readonly rawshape_convexMesh: (a: number, b: number, c: number, d: number) => number;
  readonly rawshape_roundConvexMesh: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawshape_castShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => number;
  readonly rawshape_intersectsShape: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawshape_contactShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly rawshape_containsPoint: (a: number, b: number, c: number, d: number) => number;
  readonly rawshape_projectPoint: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawshape_intersectsRay: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawshape_castRay: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly rawshape_castRayAndGetNormal: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly __wbg_rawshapecasthit_free: (a: number, b: number) => void;
  readonly rawshapecasthit_witness1: (a: number) => number;
  readonly rawshapecasthit_normal1: (a: number) => number;
  readonly rawshapecasthit_normal2: (a: number) => number;
  readonly __wbg_rawcollidershapecasthit_free: (a: number, b: number) => void;
  readonly rawcollidershapecasthit_time_of_impact: (a: number) => number;
  readonly rawcollidershapecasthit_witness1: (a: number) => number;
  readonly rawcollidershapecasthit_witness2: (a: number) => number;
  readonly rawrotation_new: (a: number, b: number, c: number, d: number) => number;
  readonly rawrotation_identity: () => number;
  readonly rawrotation_w: (a: number) => number;
  readonly rawvector_zero: () => number;
  readonly rawvector_new: (a: number, b: number, c: number) => number;
  readonly rawvector_set_y: (a: number, b: number) => void;
  readonly rawvector_set_z: (a: number, b: number) => void;
  readonly rawvector_xyz: (a: number) => number;
  readonly rawvector_yxz: (a: number) => number;
  readonly rawvector_zxy: (a: number) => number;
  readonly rawvector_xzy: (a: number) => number;
  readonly rawvector_yzx: (a: number) => number;
  readonly rawvector_zyx: (a: number) => number;
  readonly rawsdpmatrix3_elements: (a: number) => number;
  readonly __wbg_rawdebugrenderpipeline_free: (a: number, b: number) => void;
  readonly rawdebugrenderpipeline_new: () => number;
  readonly rawdebugrenderpipeline_vertices: (a: number) => number;
  readonly rawdebugrenderpipeline_colors: (a: number) => number;
  readonly rawdebugrenderpipeline_render: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly __wbg_raweventqueue_free: (a: number, b: number) => void;
  readonly __wbg_rawcontactforceevent_free: (a: number, b: number) => void;
  readonly rawcontactforceevent_collider2: (a: number) => number;
  readonly rawcontactforceevent_total_force: (a: number) => number;
  readonly rawcontactforceevent_total_force_magnitude: (a: number) => number;
  readonly rawcontactforceevent_max_force_direction: (a: number) => number;
  readonly rawcontactforceevent_max_force_magnitude: (a: number) => number;
  readonly raweventqueue_new: (a: number) => number;
  readonly raweventqueue_drainCollisionEvents: (a: number, b: number) => void;
  readonly raweventqueue_drainContactForceEvents: (a: number, b: number) => void;
  readonly raweventqueue_clear: (a: number) => void;
  readonly __wbg_rawphysicspipeline_free: (a: number, b: number) => void;
  readonly rawphysicspipeline_new: () => number;
  readonly rawphysicspipeline_set_profiler_enabled: (a: number, b: number) => void;
  readonly rawphysicspipeline_is_profiler_enabled: (a: number) => number;
  readonly rawphysicspipeline_timing_step: (a: number) => number;
  readonly rawphysicspipeline_timing_collision_detection: (a: number) => number;
  readonly rawphysicspipeline_timing_broad_phase: (a: number) => number;
  readonly rawphysicspipeline_timing_narrow_phase: (a: number) => number;
  readonly rawphysicspipeline_timing_solver: (a: number) => number;
  readonly rawphysicspipeline_timing_velocity_assembly: (a: number) => number;
  readonly rawphysicspipeline_timing_velocity_resolution: (a: number) => number;
  readonly rawphysicspipeline_timing_velocity_update: (a: number) => number;
  readonly rawphysicspipeline_timing_velocity_writeback: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd_toi_computation: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd_broad_phase: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd_narrow_phase: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd_solver: (a: number) => number;
  readonly rawphysicspipeline_timing_island_construction: (a: number) => number;
  readonly rawphysicspipeline_timing_user_changes: (a: number) => number;
  readonly rawphysicspipeline_step: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly rawphysicspipeline_stepWithEvents: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => void;
  readonly __wbg_rawdeserializedworld_free: (a: number, b: number) => void;
  readonly rawdeserializedworld_takeGravity: (a: number) => number;
  readonly rawdeserializedworld_takeIntegrationParameters: (a: number) => number;
  readonly rawdeserializedworld_takeIslandManager: (a: number) => number;
  readonly rawdeserializedworld_takeBroadPhase: (a: number) => number;
  readonly rawdeserializedworld_takeNarrowPhase: (a: number) => number;
  readonly rawdeserializedworld_takeBodies: (a: number) => number;
  readonly rawdeserializedworld_takeColliders: (a: number) => number;
  readonly rawdeserializedworld_takeImpulseJoints: (a: number) => number;
  readonly rawdeserializedworld_takeMultibodyJoints: (a: number) => number;
  readonly rawserializationpipeline_serializeAll: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => number;
  readonly rawserializationpipeline_deserializeAll: (a: number, b: number) => number;
  readonly rawcolliderset_isHandleValid: (a: number, b: number) => number;
  readonly rawrayintersection_featureId: (a: number) => number;
  readonly rawraycolliderintersection_featureId: (a: number) => number;
  readonly rawintegrationparameters_set_numInternalPgsIterations: (a: number, b: number) => void;
  readonly rawvector_set_x: (a: number, b: number) => void;
  readonly reserve_memory: (a: number) => void;
  readonly rawkinematiccharactercontroller_up: (a: number) => number;
  readonly rawshapecontact_normal2: (a: number) => number;
  readonly rawshapecontact_point1: (a: number) => number;
  readonly rawshapecontact_point2: (a: number) => number;
  readonly rawrayintersection_normal: (a: number) => number;
  readonly rawraycolliderintersection_normal: (a: number) => number;
  readonly rawshapecontact_normal1: (a: number) => number;
  readonly rawcollidershapecasthit_normal1: (a: number) => number;
  readonly rawcollidershapecasthit_normal2: (a: number) => number;
  readonly rawshapecasthit_witness2: (a: number) => number;
  readonly rawintegrationparameters_numInternalPgsIterations: (a: number) => number;
  readonly rawshapecontact_distance: (a: number) => number;
  readonly rawrayintersection_featureType: (a: number) => number;
  readonly rawraycolliderintersection_colliderHandle: (a: number) => number;
  readonly rawrayintersection_time_of_impact: (a: number) => number;
  readonly rawraycolliderintersection_featureType: (a: number) => number;
  readonly rawraycolliderhit_colliderHandle: (a: number) => number;
  readonly rawraycolliderintersection_time_of_impact: (a: number) => number;
  readonly rawshapecasthit_time_of_impact: (a: number) => number;
  readonly rawcollidershapecasthit_colliderHandle: (a: number) => number;
  readonly rawraycolliderhit_timeOfImpact: (a: number) => number;
  readonly rawrotation_x: (a: number) => number;
  readonly rawrotation_y: (a: number) => number;
  readonly rawrotation_z: (a: number) => number;
  readonly rawvector_x: (a: number) => number;
  readonly rawvector_y: (a: number) => number;
  readonly rawvector_z: (a: number) => number;
  readonly rawcontactforceevent_collider1: (a: number) => number;
  readonly rawintegrationparameters_lengthUnit: (a: number) => number;
  readonly __wbg_rawcontactpair_free: (a: number, b: number) => void;
  readonly __wbg_rawraycolliderintersection_free: (a: number, b: number) => void;
  readonly __wbg_rawrotation_free: (a: number, b: number) => void;
  readonly __wbg_rawvector_free: (a: number, b: number) => void;
  readonly __wbg_rawsdpmatrix3_free: (a: number, b: number) => void;
  readonly __wbg_rawserializationpipeline_free: (a: number, b: number) => void;
  readonly rawccdsolver_new: () => number;
  readonly rawserializationpipeline_new: () => number;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_1: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_2: (a: number, b: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
