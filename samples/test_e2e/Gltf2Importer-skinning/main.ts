import _Rn from '../../../dist/esm/index';
let p: any;

declare const window: any;
declare const Rn: typeof _Rn;

(async () => {
  const promises = [];
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgl'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('pbr'));

  //-------------------------------
  Promise.all(promises).then(() => {
    const importer = Rn.Gltf2Importer.getInstance();
    const system = Rn.System.getInstance();

    const gl = system.setProcessApproachAndCanvas(
      Rn.ProcessApproach.UniformWebGL1,
      document.getElementById('world') as HTMLCanvasElement
    );

    const entityRepository = Rn.EntityRepository.getInstance();

    // Camera
    const cameraEntity = entityRepository.createEntity([
      Rn.TransformComponent,
      Rn.SceneGraphComponent,
      Rn.CameraComponent,
      Rn.CameraControllerComponent,
    ]);
    const cameraComponent = cameraEntity.getCamera();
    //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
    cameraComponent.zNear = 0.1;
    cameraComponent.zFar = 1000;
    cameraComponent.setFovyAndChangeFocalLength(45);
    cameraComponent.aspect = 1;
    cameraEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
      0.0, 0, 0.5,
    ]);

    const promise = importer.import(
      '../../../assets/gltf/glTF-Sample-Models/2.0/SimpleSkin/glTF-Embedded/SimpleSkin.gltf'
    );

    promise.then(response => {
      const modelConverter = Rn.ModelConverter.getInstance();
      const rootGroup = modelConverter.convertToRhodoniteObject(response);
      //rootGroup.getTransform().translate = Rn.Vector3.fromCopyArray([1.0, 0, 0]);
      rootGroup.getTransform().rotate = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);

      // CameraComponent
      const cameraControllerComponent = cameraEntity.getCameraController();
      cameraControllerComponent.controller.setTarget(rootGroup);

      // renderPass
      const renderPass = new Rn.RenderPass();
      renderPass.toClearColorBuffer = true;
      renderPass.addEntities([rootGroup]);

      // expression
      const expression = new Rn.Expression();
      expression.addRenderPasses([renderPass]);

      Rn.CameraComponent.main = 0;
      let startTime = Date.now();
      const rotationVec3 = Rn.MutableVector3.one();
      let count = 0;
      const draw = function () {
        if (p == null && count > 0) {
          if (response != null) {
            gl.enable(gl.DEPTH_TEST);
            gl.viewport(0, 0, 600, 600);
            gl.clearColor(0.8, 0.8, 0.8, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          }

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

        system.process([expression]);
        count++;

        requestAnimationFrame(draw);
      };

      draw();
      //-----------------
    });
    //---------------------
  });
})();
window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
