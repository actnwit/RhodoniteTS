import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') ?? 'webgl2';

const info = document.getElementById('info') as HTMLParagraphElement;
info.textContent = `mode=${mode}`;

const canvas = document.getElementById('world') as HTMLCanvasElement;
const engine = await Rn.Engine.init({
  approach: mode === 'webgpu' ? Rn.ProcessApproach.WebGPU : Rn.ProcessApproach.WebGL2,
  canvas,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info, maxLightNumber: 6 }),
});

const forwardRenderPipeline = new Rn.ForwardRenderPipeline(engine);
await forwardRenderPipeline.setup(canvas.width, canvas.height, { isShadow: true });
forwardRenderPipeline.setDiffuseIBLContribution(0);
forwardRenderPipeline.setSpecularIBLContribution(0);

// The fixture's raymarching node graph contains a Texture2D node. Its texture assignment is
// stored in the RHODONITE_raymarching_materials root extension.
const gltfModel = await Rn.Gltf2Importer.importFromUrl(
  '../../../assets/gltf/raymarchingTexture/RaymarchingTexture.glb',
  {
    shadow: true,
    defaultMaterialHelperArgumentArray: [{ isSkinning: false, isMorphing: false }],
  }
);
await Rn.ModelConverter.convertToRhodoniteObject(engine, gltfModel);

// The application rebuilds a raymarching material per component from its graph.
// Apply the textures restored from the extension to every material that declares the
// semantic; missing semantics are skipped so a mismatch between the saved graph and
// the current node types does not break the whole scene.
const textureAssignments = await Rn.ModelConverter.createRaymarchingMaterialTextures(engine, gltfModel);
const raymarchingComponents = engine.componentRepository.getComponentsWithType(
  Rn.RaymarchingComponent
) as Rn.RaymarchingComponent[];
for (const raymarchingComponent of raymarchingComponents) {
  const result = Rn.MaterialHelper.createNodeBasedRaymarchingComponentMaterial(engine, raymarchingComponent);
  if (result == null) {
    throw new Error('Failed to create the raymarching material');
  }
  const material = result.material;
  for (const [semantic, { texture, sampler }] of textureAssignments) {
    if (material.fieldsInfoArray.some(fieldInfo => fieldInfo.semantic === semantic)) {
      material.setTextureParameter(semantic as Rn.ShaderSemanticsName, texture, sampler);
    }
  }
  forwardRenderPipeline.setRaymarchingComponentMaterial(raymarchingComponent, material);
}
window.__textureSemantics = Array.from(textureAssignments.keys());

// Camera
const cameraEntity = Rn.createCameraEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 100;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = 1;
cameraEntity.localPosition = Rn.Vector3.fromCopy3(0, 1.5, 8);
cameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(-10.6 * (Math.PI / 180), 0, 0);
Rn.CameraComponent.setCurrent(engine, cameraComponent.componentSID);

// The pipeline's raymarching pass draws the SDF and the initial expression clears the frame,
// so the main pass only supplies the camera.
const expression = new Rn.Expression();
const renderPass = new Rn.RenderPass(engine);
renderPass.toClearColorBuffer = false;
renderPass.toClearDepthBuffer = false;
renderPass.cameraComponent = cameraComponent;
expression.addRenderPasses([renderPass]);
forwardRenderPipeline.setExpressions([expression]);

let count = 0;
forwardRenderPipeline.startRenderLoop(frame => {
  if (count > 0) {
    window._rendered = true;
  }
  engine.process(frame);
  count++;
});
