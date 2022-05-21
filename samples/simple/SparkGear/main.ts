import Rn from '../../../dist/esm/index.js';

declare const window: any;
const Module = {
  // asm.jsの初期化完了タイミング
  onRuntimeInitialized: async function () {
    const moduleManager = Rn.ModuleManager.getInstance();
    await moduleManager.loadModule('webgl');
    const sparkgearModule = await moduleManager.loadModule('sparkgear');

    const gl = await Rn.System.init({
      approach: Rn.ProcessApproach.UniformWebGL1,
      canvas: document.getElementById('world') as HTMLCanvasElement,
    });

    gl.enable(gl.DEPTH_TEST);

    gl.viewport(0, 0, 600, 600);

    // 背景描画
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    // バッファをクリアする
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const cameraEntity = Rn.EntityHelper.createCameraEntity();
    const cameraComponent = cameraEntity.getCamera();
    cameraComponent.zNear = 0.1;
    cameraComponent.zFar = 10000;
    cameraComponent.setFovyAndChangeFocalLength(90);
    cameraComponent.aspect = 1;

    cameraEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
      0.0, 0, 3,
    ]);

    const response = await Rn.Gltf2Importer.import(
      '../../../assets/gltf/glTF-Sample-Models/2.0/BrainStem/glTF/BrainStem.gltf'
    );
    //    const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf');
    const rootGroup = Rn.ModelConverter.convertToRhodoniteObject(response);

    const entity = sparkgearModule.createSparkGearEntity();
    const sparkGearComponent = entity.getComponent(
      sparkgearModule.SparkGearComponent
    );
    sparkGearComponent.url = '../../../assets/vfxb/sample.vfxb';
    entity.getTransform().translate = Rn.Vector3.fromCopyArray([1, 1, 0]);

    // renderPass
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.addEntities([rootGroup]);

    // expression
    const expression = new Rn.Expression();
    expression.addRenderPasses([renderPass]);

    let startTime = Date.now();
    let p = null;
    let count = 0;
    const draw = () => {
      if (p == null && count > 1) {
        p = document.createElement('p');
        p.setAttribute('id', 'rendered');
        p.innerText = 'Rendered.';
        document.body.appendChild(p);
      }
      const date = new Date();

      if (window.isAnimating) {
        const time = (date.getTime() - startTime) / 1000;
        Rn.AnimationComponent.globalTime = time;
        if (time > Rn.AnimationComponent.endInputValue) {
          startTime = date.getTime();
        }
      }

      Rn.System.process([expression]);

      count++;
      requestAnimationFrame(draw);
    };
    draw();
  },
};
window.Module = Module;
