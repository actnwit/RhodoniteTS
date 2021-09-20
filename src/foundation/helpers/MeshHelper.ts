import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import EntityRepository from '../core/EntityRepository';
import Plane, {PlaneDescripter} from '../geometry/Plane';
import Mesh from '../geometry/Mesh';

const createPlane = (
  desc: PlaneDescripter = {
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

  const planePrimitive = new Plane();
  planePrimitive.generate(desc);

  const planeMeshComponent = entity.getMesh();
  const planeMesh = new Mesh();
  planeMesh.addPrimitive(planePrimitive);
  planeMeshComponent.setMesh(planeMesh);

  return entity;
};

export const MeshHelper = Object.freeze({
  createPlane,
});
