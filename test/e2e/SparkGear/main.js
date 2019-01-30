var Module = {
  // asm.jsの初期化完了タイミング
  onRuntimeInitialized: async function () {
    function generateEntity() {
      const repo = Rn.EntityRepository.getInstance();
      const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.SparkGearComponent]);
      return entity;
    }

    await Rn.ModuleManager.getInstance().loadModule('webgl');
    const system = Rn.System.getInstance();
    const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

    gl.enable(gl.DEPTH_TEST);

    gl.viewport(0, 0, 600, 600);

    // 背景描画
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    // バッファをクリアする
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);




  const entityRepository = Rn.EntityRepository.getInstance();
    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent])
    const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
    //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
    cameraComponent.parameters = new Rn.Vector4(1, 10000, 90, 1);
    cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 3);

    const importer = Rn.Gltf2Importer.getInstance();
    const modelConverter = Rn.ModelConverter.getInstance();
    const response = await importer.import('../../../assets/gltf/2.0/BrainStem/glTF/BrainStem.gltf');
//    const response = await importer.import('../../../assets/gltf/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf');
    const rootGroup = modelConverter.convertToRhodoniteObject(response);

    const entity = generateEntity();
    const sparkGearComponent = entity.getComponent(Rn.SparkGearComponent);
    sparkGearComponent.url = '../../../assets/vfxb/sample.vfxb';
    entity.getTransform().translate = new Rn.Vector3(1, 1, 0);

    let startTime = Date.now();
    let p = null;
    let count = 0;
    const draw = (time)=>{

      if (p == null && count > 1) {
        p = document.createElement('p');
        p.setAttribute("id", "rendered");
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

      system.process();

      count++;
      requestAnimationFrame(draw);
    }
    draw();
  }
};
window.Module = Module;
