import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import EntityRepository from '../core/EntityRepository';
import {Plane, PlaneDescriptor} from '../geometry/Plane';
import Mesh from '../geometry/Mesh';
import {AxisDescriptor} from '../geometry/Axis';
import {Axis} from '../geometry/Axis';

const createPlane = (
  desc: PlaneDescriptor = {
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
  }
) => {
  const entity = EntityRepository.getInstance().createEntity([
    TransformComponent,
    SceneGraphComponent,
    MeshComponent,
    MeshRendererComponent,
  ]);

  const primitive = new Plane();
  primitive.generate(desc);

  const meshComponent = entity.getMesh();
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);

  return entity;
};

const createAxis = (
  desc: AxisDescriptor = {
    length: 1,
  }
) => {
  const entity = EntityRepository.getInstance().createEntity([
    TransformComponent,
    SceneGraphComponent,
    MeshComponent,
    MeshRendererComponent,
  ]);

  const primitive = new Axis();
  primitive.generate(desc);

  const meshComponent = entity.getMesh();
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);

  return entity;
};

export const MeshHelper = Object.freeze({
  createPlane,
  createAxis,
});
