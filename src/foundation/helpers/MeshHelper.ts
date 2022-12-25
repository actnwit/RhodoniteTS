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
  return entity;
};

const createSphere = (desc: SphereDescriptor = {}) => {
  const primitive = new Sphere();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
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
  createSphere,
  createJoint,
  createAxis,
  createShape,
});
