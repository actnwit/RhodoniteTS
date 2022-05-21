import Rn from '../../../dist/esm/index.js';

let p: any;

declare const window: any;

(async () => {
  const gl = await Rn.System.init({
    approach: Rn.ProcessApproach.FastestWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // Plane
  const texture = new Rn.VideoTexture();
  texture.generateTextureFromUri('../../../assets/videos/video.mp4');
  const modelMaterial = Rn.MaterialHelper.createClassicUberMaterial();
  modelMaterial.setTextureParameter(
    Rn.ShaderSemantics.DiffuseColorTexture,
    texture
  );
  window.texture = texture;

  const planeEntity = Rn.EntityHelper.createMeshEntity();
  const planePrimitive = new Rn.Plane();
  planePrimitive.generate({
    width: 2,
    height: 2,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    flipTextureCoordinateY: true,
    material: modelMaterial,
  });
  const planeMeshComponent = planeEntity.getMesh();
  const planeMesh = new Rn.Mesh();
  planeMesh.addPrimitive(planePrimitive);
  planeMeshComponent.setMesh(planeMesh);
  planeEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    Math.PI / 2,
    0,
    0,
  ]);

  // Camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;

  cameraEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0.0, 0, 0.5,
  ]);

  // CameraComponent
  const cameraControllerComponent = (
    cameraEntity as Rn.ICameraControllerEntity
  ).getCameraController();
  const controller =
    cameraControllerComponent.controller as Rn.OrbitCameraController;
  controller.setTarget(planeEntity);

  // renderPass
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.addEntities([planeEntity]);

  // expression
  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  Rn.CameraComponent.current = 0;
  let startTime = Date.now();
  const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  const draw = function () {
    if (p == null && count > 0) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    if (window.isAnimating) {
      const date = new Date();
      const rotation = 0.001 * (date.getTime() - startTime);
      //rotationVec3._v[0] = 0.1;
      //rotationVec3._v[1] = rotation;
      //rotationVec3._v[2] = 0.1;
      const time = (date.getTime() - startTime) / 1000;
      Rn.AnimationComponent.globalTime = time;
      if (time > Rn.AnimationComponent.endInputValue) {
        startTime = date.getTime();
      }
      //console.log(time);
      //      rootGroup.getTransform().scale = rotationVec3;
      //rootGroup.getTransform().translate = rootGroup.getTransform().translate;
    }
    texture.updateTexture();
    Rn.System.process([expression]);
    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};

window.downloadFrame = function () {
  const [pixels, width, height] = window.texture.getCurrentFramePixelData();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i + 0] = pixels[i + 0];
    imageData.data[i + 1] = pixels[i + 1];
    imageData.data[i + 2] = pixels[i + 2];
    imageData.data[i + 3] = pixels[i + 3];
  }
  ctx.putImageData(imageData, 0, 0);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.download = 'frame.png';
  a.href = url;
  const e = new MouseEvent('click');
  a.dispatchEvent(e);
};
