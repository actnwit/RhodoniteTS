import TransformComponent from '../components/Transform/TransformComponent';
import SceneGraphComponent from '../components/SceneGraph/SceneGraphComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import EntityRepository from '../core/EntityRepository';
import {Plane, PlaneDescriptor} from '../geometry/shapes/Plane';
import Mesh from '../geometry/Mesh';
import {AxisDescriptor} from '../geometry/shapes/Axis';
import {Axis} from '../geometry/shapes/Axis';
import {IShape} from '../geometry/shapes/IShape';

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
  const entity = EntityRepository.getInstance().createEntity([
    TransformComponent,
    SceneGraphComponent,
    MeshComponent,
    MeshRendererComponent,
  ]);

  const meshComponent = entity.getMesh()!;
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);
  return entity;
}

export const MeshHelper = Object.freeze({
  createShape,
  createPlane,
  createAxis,
});
