import { IMeshEntity } from '../../../dist/esm/foundation/helpers/EntityHelper';
import _Rn, {Entity, Expression} from '../../../dist/esm/index';

declare const Rn: typeof _Rn;

(async () => {
  // ---parameters---------------------------------------------------------------------------------------------

  const pointCloudDrcUri =
    './../../../assets/drc/FlightHelmet/FlightHelmet.drc';

  const pointSize = 1.0;

  // ---main algorithm-----------------------------------------------------------------------------------------

  // load modules
  await Promise.all([
    Rn.ModuleManager.getInstance().loadModule('webgl'),
    Rn.ModuleManager.getInstance().loadModule('pbr'),
  ]);

  // prepare memory
  const system = Rn.System.getInstance();
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.UniformWebGL1,
    rnCanvasElement
  );

  // prepare entity
  const rootGroup = await createEntityPointCloud(pointCloudDrcUri);
  rootGroup.getTransform().rotate = Rn.Vector3.fromCopyArray([
    -Math.PI / 2,
    0.0,
    0.0,
  ]);
  setPointSizeRecursively(rootGroup, pointSize);

  // set camera
  const entityCamera = Rn.EntityHelper.createCameraControllerEntity();
  const cameraControllerComponent = entityCamera.getCameraController();
  cameraControllerComponent.controller.setTarget(rootGroup);

  //prepare render pass and expression
  const renderPass = new Rn.RenderPass();
  renderPass.addEntities([rootGroup]);
  renderPass.cameraComponent = entityCamera.getCamera();

  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  // draw
  draw([expression]);

  // ---functions-----------------------------------------------------------------------------------------

  async function createEntityPointCloud(
    pointCloudDrcUri: string
  ): Promise<IMeshEntity> {
    const importer = Rn.DrcPointCloudImporter.getInstance();
    const primitive = await importer.importPointCloudToPrimitive(
      pointCloudDrcUri
    );

    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);

    const entity = Rn.EntityHelper.createMeshEntity();
    const meshComponent = entity.getMesh();
    meshComponent.setMesh(mesh);

    return entity;
  }

  // For cases where there is a single baseColorTexture and each vertex has a UV attribute.
  //
  // async function createEntityTextureAttachedPointCloud(
  //   pointCloudDrcUri: string,
  //   baseColorTextureUri: string
  // ): Promise<Entity> {
  //   const importer = Rn.DrcPointCloudImporter.getInstance();
  //   const primitive = await importer.importPointCloudToPrimitive(
  //     pointCloudDrcUri
  //   );

  //   const baseColorTexture = new Rn.Texture();
  //   await baseColorTexture.generateTextureFromUri(baseColorTextureUri);
  //   primitive.material.setTextureParameter(
  //     Rn.ShaderSemantics.BaseColorTexture,
  //     baseColorTexture
  //   );

  //   const mesh = new Rn.Mesh();
  //   mesh.addPrimitive(primitive);

  //   const entityRepository = Rn.EntityRepository.getInstance();
  //   const entity = entityRepository.createEntity([
  //     Rn.TransformComponent,
  //     Rn.SceneGraphComponent,
  //     Rn.MeshComponent,
  //     Rn.MeshRendererComponent,
  //   ]);
  //   const meshComponent = entity.getMesh();
  //   meshComponent.setMesh(mesh);

  //   return entity;
  // }

  function setPointSizeRecursively(entity: IMeshEntity, pointSize: number) {
    // set point size
    const meshComponent = entity.getMesh();
    if (meshComponent) {
      const mesh = meshComponent.mesh;
      const primitives = mesh.primitives;
      for (const primitive of primitives) {
        const material = primitive.material;
        material.setParameter(Rn.ShaderSemantics.PointSize, pointSize);
      }
    }

    // set recursively
    const sceneGraphComponent = entity.getSceneGraph();
    if (sceneGraphComponent) {
      const childSceneGraphComponents = sceneGraphComponent.children;
      for (const childSceneGraphComponent of childSceneGraphComponents) {
        const childEntity = childSceneGraphComponent.entity as IMeshEntity;
        setPointSizeRecursively(childEntity, pointSize);
      }
    }
  }

  function draw(expressions: Expression[]) {
    system.process(expressions);
    requestAnimationFrame(draw.bind(null, expressions));
  }
})();
