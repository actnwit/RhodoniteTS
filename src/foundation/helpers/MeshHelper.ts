import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import { EntityRepository } from '../core/EntityRepository';
import { PhysicsShape } from '../definitions/PhysicsShapeType';
import { Mesh } from '../geometry/Mesh';
import type { AxisDescriptor } from '../geometry/shapes/Axis';
import { Axis } from '../geometry/shapes/Axis';
import { Cone, type ConeDescriptor } from '../geometry/shapes/Cone';
import { Cube, type CubeDescriptor } from '../geometry/shapes/Cube';
import { Grid, type GridDescriptor } from '../geometry/shapes/Grid';
import type { IShape } from '../geometry/shapes/IShape';
import { Joint, type JointDescriptor } from '../geometry/shapes/Joint';
import { Line, type LineDescriptor } from '../geometry/shapes/Line';
import { Plane, type PlaneDescriptor } from '../geometry/shapes/Plane';
import { Ring, type RingDescriptor } from '../geometry/shapes/Ring';
import { Sphere, type SphereDescriptor } from '../geometry/shapes/Sphere';
import { Capsule, type CapsuleDescriptor } from '../geometry/shapes/Capsule';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc';
import { OimoPhysicsStrategy } from '../physics/Oimo/OimoPhysicsStrategy';

/**
 * Creates a plane mesh entity with configurable orientation.
 *
 * @param desc - Configuration object for the plane
 * @param desc.direction - The orientation of the plane ('xz', 'xy', or 'yz'). Defaults to 'xz'
 * @returns A mesh entity representing the plane
 *
 * @example
 * ```typescript
 * // Create a horizontal plane (default)
 * const horizontalPlane = createPlane();
 *
 * // Create a vertical plane facing forward
 * const verticalPlane = createPlane({ direction: 'xy' });
 * ```
 */
const createPlane = (
  desc: PlaneDescriptor & {
    direction?: 'xz' | 'xy' | 'yz';
  } = {}
) => {
  const primitive = new Plane();
  primitive.generate(desc);
  const entity = createShape(primitive);

  if (Is.not.exist(desc.direction)) {
    desc.direction = 'xz';
  }

  if (desc.direction === 'xy') {
    entity.localEulerAngles = Vector3.fromCopy3(Math.PI / 2, 0, 0);
  } else if (desc.direction === 'yz') {
    entity.localEulerAngles = Vector3.fromCopy3(0, 0, Math.PI / 2);
  }
  return entity;
};

/**
 * Creates a line mesh entity.
 *
 * @param desc - Configuration object for the line geometry
 * @returns A mesh entity representing the line
 *
 * @example
 * ```typescript
 * const line = createLine({
 *   startPoint: Vector3.fromCopy3(0, 0, 0),
 *   endPoint: Vector3.fromCopy3(1, 1, 1)
 * });
 * ```
 */
const createLine = (desc: LineDescriptor = {}) => {
  const primitive = new Line();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

/**
 * Creates a grid mesh entity for visual reference.
 *
 * @param desc - Configuration object for the grid geometry
 * @returns A mesh entity representing the grid
 *
 * @example
 * ```typescript
 * const grid = createGrid({
 *   size: 10,
 *   divisions: 20
 * });
 * ```
 */
const createGrid = (desc: GridDescriptor = {}) => {
  const primitive = new Grid();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

/**
 * Creates a cone mesh entity.
 *
 * @param desc - Configuration object for the cone geometry
 * @returns A mesh entity representing the cone
 *
 * @example
 * ```typescript
 * const cone = createCone({
 *   radius: 0.2,
 *   height: 0.5,
 *   includeBase: false,
 * });
 * ```
 */
const createCone = (desc: ConeDescriptor = {}) => {
  const primitive = new Cone();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

/**
 * Creates a cube mesh entity with optional physics simulation.
 *
 * @param desc - Configuration object for the cube geometry and physics properties
 * @returns A mesh entity representing the cube, with physics component if specified
 *
 * @example
 * ```typescript
 * // Create a simple cube
 * const cube = createCube({ widthVector: Vector3.fromCopy3(2, 2, 2) });
 *
 * // Create a cube with physics
 * const physicsCube = createCube({
 *   widthVector: Vector3.fromCopy3(1, 1, 1),
 *   physics: {
 *     use: true,
 *     move: true,
 *     density: 1.0,
 *     friction: 0.5,
 *     restitution: 0.3
 *   }
 * });
 * ```
 */
const createCube = (desc: CubeDescriptor = {}) => {
  const primitive = new Cube();
  primitive.generate(desc);
  const entity = createShape(primitive);

  if (Is.exist(desc.physics) && desc.physics.use) {
    const newEntity = EntityRepository.addComponentToEntity(PhysicsComponent, entity);
    const physicsComponent = newEntity.getPhysics();
    const strategy = new OimoPhysicsStrategy();
    const property = {
      type: PhysicsShape.Box,
      size: desc.widthVector ?? Vector3.fromCopy3(1, 1, 1),
      position: Vector3.fromCopy3(0, 0, 0),
      rotation: Vector3.fromCopy3(0, 0, 0),
      move: desc.physics.move,
      density: desc.physics.density,
      friction: desc.physics.friction,
      restitution: desc.physics.restitution,
    };
    strategy.setShape(property, newEntity);
    physicsComponent.setStrategy(strategy);
  }

  return entity;
};

/**
 * Creates multiple cube mesh entities efficiently by sharing the same mesh geometry.
 * This is more performance-friendly than creating individual cubes when you need many instances.
 *
 * @param numberToCreate - The number of cube entities to create
 * @param desc - Configuration object for the cube geometry and physics properties
 * @returns An array of mesh entities representing the cubes
 *
 * @example
 * ```typescript
 * // Create 100 cubes for instancing
 * const cubes = createCubes(100, {
 *   widthVector: Vector3.fromCopy3(0.5, 0.5, 0.5),
 *   physics: { use: true, move: true }
 * });
 *
 * // Position them individually
 * cubes.forEach((cube, index) => {
 *   cube.localPosition = Vector3.fromCopy3(index % 10, 0, Math.floor(index / 10));
 * });
 * ```
 */
const createCubes = (numberToCreate: number, desc: CubeDescriptor = {}) => {
  const primitive = new Cube();
  primitive.generate(desc);
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);

  const entities = [];

  for (let i = 0; i < numberToCreate; i++) {
    const entity = createMeshEntity();
    const meshComponent = entity.getMesh();
    meshComponent.setMesh(mesh);

    if (Is.exist(desc.physics) && desc.physics.use) {
      const newEntity = EntityRepository.addComponentToEntity(PhysicsComponent, entity);
      const physicsComponent = newEntity.getPhysics();
      const strategy = new OimoPhysicsStrategy();
      const property = {
        type: PhysicsShape.Box,
        size: desc.widthVector ?? Vector3.fromCopy3(1, 1, 1),
        position: Vector3.fromCopy3(0, 0, 0),
        rotation: Vector3.fromCopy3(0, 0, 0),
        move: desc.physics.move,
        density: desc.physics.density,
        friction: desc.physics.friction,
        restitution: desc.physics.restitution,
      };
      strategy.setShape(property, newEntity);
      physicsComponent.setStrategy(strategy);
    }
    entities.push(entity);
  }

  return entities;
};

/**
 * Creates a sphere mesh entity with optional physics simulation.
 *
 * @param desc - Configuration object for the sphere geometry and physics properties
 * @returns A mesh entity representing the sphere, with physics component if specified
 *
 * @example
 * ```typescript
 * // Create a simple sphere
 * const sphere = createSphere({ radius: 2.0 });
 *
 * // Create a sphere with physics
 * const physicsSphere = createSphere({
 *   radius: 1.0,
 *   physics: {
 *     use: true,
 *     move: true,
 *     density: 0.8,
 *     friction: 0.4,
 *     restitution: 0.9
 *   }
 * });
 * ```
 */
const createSphere = (desc: SphereDescriptor = {}) => {
  const primitive = new Sphere();
  primitive.generate(desc);
  const entity = createShape(primitive);

  if (Is.exist(desc.physics) && desc.physics.use) {
    const newEntity = EntityRepository.addComponentToEntity(PhysicsComponent, entity);
    const physicsComponent = newEntity.getPhysics();
    const strategy = new OimoPhysicsStrategy();
    const property = {
      type: PhysicsShape.Sphere,
      size: Is.exist(desc.radius)
        ? Vector3.fromCopy3(desc.radius, desc.radius, desc.radius)
        : Vector3.fromCopy3(1, 1, 1),
      position: Vector3.fromCopy3(0, 0, 0),
      rotation: Vector3.fromCopy3(0, 0, 0),
      move: desc.physics.move,
      density: desc.physics.density,
      friction: desc.physics.friction,
      restitution: desc.physics.restitution,
    };
    strategy.setShape(property, newEntity);
    physicsComponent.setStrategy(strategy);
  }

  return entity;
};

/**
 * Creates multiple sphere mesh entities efficiently by sharing the same mesh geometry.
 * This is more performance-friendly than creating individual spheres when you need many instances.
 *
 * @param numberToCreate - The number of sphere entities to create
 * @param desc - Configuration object for the sphere geometry and physics properties
 * @returns An array of mesh entities representing the spheres
 *
 * @example
 * ```typescript
 * // Create 50 spheres for a particle system
 * const spheres = createSpheres(50, {
 *   radius: 0.2,
 *   physics: { use: true, move: true, density: 0.5 }
 * });
 *
 * // Scatter them randomly
 * spheres.forEach(sphere => {
 *   sphere.localPosition = Vector3.fromCopy3(
 *     Math.random() * 10 - 5,
 *     Math.random() * 10,
 *     Math.random() * 10 - 5
 *   );
 * });
 * ```
 */
const createSpheres = (numberToCreate: number, desc: SphereDescriptor = {}) => {
  const primitive = new Sphere();
  primitive.generate(desc);
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);

  const entities = [];

  for (let i = 0; i < numberToCreate; i++) {
    const entity = createMeshEntity();
    const meshComponent = entity.getMesh();
    meshComponent.setMesh(mesh);

    if (Is.exist(desc.physics) && desc.physics.use) {
      const newEntity = EntityRepository.addComponentToEntity(PhysicsComponent, entity);
      const physicsComponent = newEntity.getPhysics();
      const strategy = new OimoPhysicsStrategy();
      const property = {
        type: PhysicsShape.Sphere,
        size: Is.exist(desc.radius)
          ? Vector3.fromCopy3(desc.radius, desc.radius, desc.radius)
          : Vector3.fromCopy3(1, 1, 1),
        position: Vector3.fromCopy3(0, 0, 0),
        rotation: Vector3.fromCopy3(0, 0, 0),
        move: desc.physics.move,
        density: desc.physics.density,
        friction: desc.physics.friction,
        restitution: desc.physics.restitution,
      };
      strategy.setShape(property, newEntity);
      physicsComponent.setStrategy(strategy);
    }
    entities.push(entity);
  }

  return entities;
};

/**
 * Creates a joint mesh entity for skeletal animation or mechanical connections.
 *
 * @param desc - Configuration object for the joint geometry
 * @returns A mesh entity representing the joint
 *
 * @example
 * ```typescript
 * const joint = createJoint({
 *   radius: 0.1,
 *   length: 2.0
 * });
 * ```
 */
const createJoint = (desc: JointDescriptor = {}) => {
  const primitive = new Joint();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

/**
 * Creates an axis mesh entity for coordinate system visualization.
 * Typically displays X, Y, and Z axes with different colors.
 *
 * @param desc - Configuration object for the axis geometry
 * @returns A mesh entity representing the coordinate axes
 *
 * @example
 * ```typescript
 * const worldAxis = createAxis({
 *   length: 5.0,
 *   thickness: 0.1
 * });
 * ```
 */
const createAxis = (desc: AxisDescriptor = {}) => {
  const primitive = new Axis();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

/**
 * Creates a ring (annulus) mesh entity.
 *
 * @param desc - Configuration object for the ring geometry
 * @param desc.radius - The radius of the ring (center to middle of band). Defaults to 1
 * @param desc.thickness - The thickness of the ring band. Defaults to 0.1
 * @param desc.segments - Number of segments forming the circumference. Defaults to 64
 * @param desc.axis - The axis perpendicular to the ring plane ('x', 'y', or 'z'). Defaults to 'y'
 * @returns A mesh entity representing the ring
 *
 * @example
 * ```typescript
 * // Create a horizontal ring (default, in XZ plane)
 * const ring = createRing({ radius: 2, thickness: 0.2 });
 *
 * // Create a vertical ring in YZ plane
 * const verticalRing = createRing({
 *   radius: 1.5,
 *   thickness: 0.1,
 *   segments: 32,
 *   axis: 'x'
 * });
 * ```
 */
const createRing = (desc: RingDescriptor = {}) => {
  const primitive = new Ring();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

/**
 * Creates a capsule mesh entity.
 * A capsule is a cylinder with hemispherical caps at both ends.
 *
 * @param desc - Configuration object for the capsule geometry
 * @param desc.radius - The radius of the capsule (hemispheres and cylinder). Defaults to 0.5
 * @param desc.height - The height of the cylinder part (distance between hemisphere centers). Defaults to 1
 * @param desc.widthSegments - Number of horizontal segments. Defaults to 16
 * @param desc.heightSegments - Number of vertical segments for each hemisphere. Defaults to 8
 * @returns A mesh entity representing the capsule
 *
 * @example
 * ```typescript
 * // Create a simple capsule
 * const capsule = createCapsule({ radius: 0.5, height: 2.0 });
 *
 * // Create a detailed capsule
 * const detailedCapsule = createCapsule({
 *   radius: 0.3,
 *   height: 1.5,
 *   widthSegments: 24,
 *   heightSegments: 12
 * });
 * ```
 */
const createCapsule = (desc: CapsuleDescriptor = {}) => {
  const primitive = new Capsule();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

/**
 * Creates a mesh entity from a primitive shape.
 * This is a utility function used internally by other creation methods.
 *
 * @param primitive - The primitive shape to convert into a mesh entity
 * @returns A mesh entity containing the primitive shape
 *
 * @example
 * ```typescript
 * const customPrimitive = new CustomShape();
 * customPrimitive.generate(config);
 * const entity = createShape(customPrimitive);
 * ```
 */
function createShape(primitive: IShape) {
  const entity = createMeshEntity();
  const meshComponent = entity.getMesh();
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);
  return entity;
}

export const MeshHelper = Object.freeze({
  createPlane,
  createLine,
  createGrid,
  createCone,
  createCube,
  createCubes,
  createSphere,
  createSpheres,
  createCapsule,
  createJoint,
  createAxis,
  createRing,
  createShape,
});
