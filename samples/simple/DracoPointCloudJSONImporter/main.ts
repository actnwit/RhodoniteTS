import {IMeshEntity} from '../../../dist/esm/foundation/helpers/EntityHelper';
import _Rn, {Expression} from '../../../dist/esm/index';
import {RnM2} from '../../../dist/esm/types/RnM2';

declare const Rn: typeof _Rn;

(async () => {
  // ---parameters---------------------------------------------------------------------------------------------

  const pointCloudDrcUri =
    './../../../assets/drc/FlightHelmet/FlightHelmet.drc';

  const pointSize = 1.0;

  // ---main algorithm-----------------------------------------------------------------------------------------

  // prepare memory
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas: rnCanvasElement,
  });

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
    const gltf2JSON = (await importer.importPointCloud(
      pointCloudDrcUri
    )) as RnM2;

    const modelConverter = Rn.ModelConverter.getInstance();
    const rootGroup = modelConverter.convertToRhodoniteObject(gltf2JSON);
    return rootGroup as IMeshEntity;
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
    Rn.System.process(expressions);
    requestAnimationFrame(draw.bind(null, expressions));
  }
})();
