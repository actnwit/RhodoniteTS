import Rn from '../../../dist/esmdev/index.js';

(async () => {
  // ---parameters---------------------------------------------------------------------------------------------

  const pointCloudDrcUri = './../../../assets/drc/FlightHelmet/FlightHelmet.drc';

  const pointSize = 1.0;

  // ---main algorithm-----------------------------------------------------------------------------------------

  // prepare memory
  Rn.Config.cgApiDebugConsoleOutput = true;
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas: rnCanvasElement,
  });

  // prepare entity
  const rootGroup = await createEntityPointCloud(pointCloudDrcUri);
  rootGroup.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([-Math.PI / 2, 0.0, 0.0]);
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

  async function createEntityPointCloud(pointCloudDrcUri: string): Promise<Rn.IMeshEntity> {
    const importer = Rn.DrcPointCloudImporter.getInstance();
    const r_gltf2JSON = (
      await importer.importPointCloud(pointCloudDrcUri)
    ).unwrapForce() as Rn.RnM2;

    const rootGroup = Rn.ModelConverter.convertToRhodoniteObject(r_gltf2JSON);
    return rootGroup as Rn.IMeshEntity;
  }

  // For cases where there is a single baseColorTexture and each vertex has a UV attribute.
  //
  // async function createEntityTextureAttachedPointCloud(
  //   pointCloudDrcUri: string,
  //   baseColorTextureUri: string
  // ): Promise<Entity> {
  //   const splitUri = baseColorTextureUri.match(/(.*\/)(.*?)$/);
  //   const basePathBaseColorTexture = splitUri[1];
  //   const filenameBaseColorTexture = splitUri[2];

  //   const importer = Rn.DrcPointCloudImporter.getInstance();
  //   const gltf2JSON = (await importer.importPointCloud(pointCloudDrcUri, {
  //     defaultTextures: {
  //       basePath: basePathBaseColorTexture,
  //       textureInfos: [
  //         {
  //           shaderSemantics: Rn.ShaderSemantics.BaseColorTexture,
  //           fileName: filenameBaseColorTexture,
  //         },
  //       ],
  //     },
  //   })) as glTF2;

  //   const modelConverter = Rn.ModelConverter.getInstance();
  //   const rootGroup = modelConverter.convertToRhodoniteObject(gltf2JSON);
  //   return rootGroup;
  // }

  function setPointSizeRecursively(entity: Rn.IMeshEntity, pointSize: number) {
    // set point size
    const meshComponent = entity.getMesh();
    if (meshComponent) {
      const mesh = meshComponent.mesh;
      const primitives = mesh.primitives;
      for (const primitive of primitives) {
        const material = primitive.material;
        material.setParameter('pointSize', pointSize);
      }
    }

    // set recursively
    const sceneGraphComponent = entity.getSceneGraph();
    if (sceneGraphComponent) {
      const childSceneGraphComponents = sceneGraphComponent.children;
      for (const childSceneGraphComponent of childSceneGraphComponents) {
        const childEntity = childSceneGraphComponent.entity as Rn.IMeshEntity;
        setPointSizeRecursively(childEntity, pointSize);
      }
    }
  }

  function draw(expressions: Rn.Expression[]) {
    Rn.System.process(expressions);
    requestAnimationFrame(draw.bind(null, expressions));
  }
})();
