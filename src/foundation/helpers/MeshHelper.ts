import {Plane, PlaneDescriptor} from '../geometry/shapes/Plane';
import { Mesh } from '../geometry/Mesh';
import {AxisDescriptor} from '../geometry/shapes/Axis';
import {Axis} from '../geometry/shapes/Axis';
import {IShape} from '../geometry/shapes/IShape';
import {EntityHelper} from './EntityHelper';
import {Line, LineDescriptor} from '../geometry/shapes/Line';
import { Vector3 } from '../math/Vector3';
import {Grid, GridDescriptor} from '../geometry/shapes/Grid';
import { Cube, CubeDescriptor } from '../geometry/shapes/Cube';
import { Sphere, SphereDescriptor } from '../geometry/shapes/Sphere';
import { Joint, JointDescriptor } from '../geometry/shapes/Joint';

const createPlane = (
  desc: PlaneDescriptor = {
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
  }
) => {
  const primitive = new Plane();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

const createLine = (
  desc: LineDescriptor = {
    startPos: Vector3.fromCopy3(0, 0, 0),
    endPos: Vector3.fromCopy3(1, 0, 0),
    hasTerminalMark: true,
  }
) => {
  const primitive = new Line();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

const createGrid = (
  desc: GridDescriptor = {
    length: 1,
    division: 10,
    isXY: true,
    isXZ: true,
    isYZ: true,
  }
) => {
  const primitive = new Grid();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

const createCube = (
  desc: CubeDescriptor = {
    widthVector: Vector3.fromCopy3(1, 1, 1),
  }
) => {
  const primitive = new Cube();
  primitive.generate(desc);
  const entity = createShape(primitive);
  return entity;
};

const createSphere = (
  desc: SphereDescriptor = {
    radius: 1,
    widthSegments: 10,
    heightSegments: 10,
  }
) => {
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

const createAxis = (
  desc: AxisDescriptor = {
    length: 1,
  }
) => {
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
