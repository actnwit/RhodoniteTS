import { Plane, PlaneDescriptor } from '../geometry/shapes/Plane';
import { Mesh } from '../geometry/Mesh';
import { AxisDescriptor } from '../geometry/shapes/Axis';
import { Axis } from '../geometry/shapes/Axis';
import { IShape } from '../geometry/shapes/IShape';
import { EntityHelper } from './EntityHelper';
import { Line, LineDescriptor } from '../geometry/shapes/Line';
import { Vector3 } from '../math/Vector3';
import { Grid, GridDescriptor } from '../geometry/shapes/Grid';
import { Cube, CubeDescriptor } from '../geometry/shapes/Cube';
import { Sphere, SphereDescriptor } from '../geometry/shapes/Sphere';
import { Joint, JointDescriptor } from '../geometry/shapes/Joint';
import { Is } from '../misc';
import { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import { EntityRepository } from '../core/EntityRepository';
import { OimoPhysicsStrategy } from '../physics/Oimo/OimoPhysicsStrategy';
import { PhysicsShape } from '../definitions/PhysicsShapeType';

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

const createLine = (desc: LineDescriptor = {}) => {
  const primitive = new Line();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

const createGrid = (desc: GridDescriptor = {}) => {
  const primitive = new Grid();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

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

const createCubes = (numberToCreate: number, desc: CubeDescriptor = {}) => {
  const primitive = new Cube();
  primitive.generate(desc);
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);

  const entities = [];

  for (let i = 0; i < numberToCreate; i++) {
    const entity = EntityHelper.createMeshEntity();
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

const createSpheres = (numberToCreate: number, desc: SphereDescriptor = {}) => {
  const primitive = new Sphere();
  primitive.generate(desc);
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);

  const entities = [];

  for (let i = 0; i < numberToCreate; i++) {
    const entity = EntityHelper.createMeshEntity();
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

const createJoint = (desc: JointDescriptor = {}) => {
  const primitive = new Joint();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

const createAxis = (desc: AxisDescriptor = {}) => {
  const primitive = new Axis();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

function createShape(primitive: IShape) {
  const entity = EntityHelper.createMeshEntity();
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
  createCube,
  createCubes,
  createSphere,
  createSpheres,
  createJoint,
  createAxis,
  createShape,
});
