import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import EntityRepository from '../core/EntityRepository';
import {Plane, PlaneDescriptor} from '../geometry/shapes/Plane';
import Mesh from '../geometry/Mesh';
import {AxisDescriptor} from '../geometry/shapes/Axis';
import {Axis} from '../geometry/shapes/Axis';
import {IAnyPrimitiveDescriptor, Primitive} from '../geometry/Primitive';

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

  const entity = EntityRepository.getInstance().createEntity([
    TransformComponent,
    SceneGraphComponent,
    MeshComponent,
    MeshRendererComponent,
  ]);
  primitive.generate(desc);

  const meshComponent = entity.getMesh();
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);

  return entity;
};

// const createAxis = (
//   desc: AxisDescriptor = {
//     length: 1,
//   }
// ) => {
//   const primitive = new Axis();
//   const entity = createMesh(primitive, desc);
//   return entity;
// };

// function createMesh(primitive: Primitive, desc: IAnyPrimitiveDescriptor) {
//   const entity = EntityRepository.getInstance().createEntity([
//     TransformComponent,
//     SceneGraphComponent,
//     MeshComponent,
//     MeshRendererComponent,
//   ]);
//   primitive.generate(desc);

//   const meshComponent = entity.getMesh();
//   const mesh = new Mesh();
//   mesh.addPrimitive(primitive);
//   meshComponent.setMesh(mesh);
//   return entity;
// }

export const MeshHelper = Object.freeze({
  createPlane,
  // createAxis,
});
