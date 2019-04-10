
let p = null;

function generateEntity() {
  const repo = Rn.EntityRepository.getInstance();
  const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
  return entity;
}

function readyBasicVerticesData() {
  const indices = new Uint16Array([
    0, 1, 2, 2, 3, 0
  ]);

  const positions = new Float32Array([
    -1, -1, 0.0,
     1, -1, 0.0,
     1, 1, 0.0,
    -1, 1, 0.0
  ]);

  const texcoord = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
  ]);

  const primitive = Rn.Primitive.createPrimitive({
    indices: indices,
    attributeCompositionTypes: [Rn.CompositionType.Vec3, Rn.CompositionType.Vec2],
    attributeSemantics: [Rn.VertexAttribute.Position, Rn.VertexAttribute.Texcoord0],
    attributes: [positions, texcoord],
    primitiveMode: Rn.PrimitiveMode.Triangles
  });

  return primitive;
}

const load = function(time){
  const promises = [];
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgl'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('pbr'));
  Promise.all(promises).then(function(){
    const importer = Rn.Gltf2Importer.getInstance();
    const system = Rn.System.getInstance();
    const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

    const entityRepository = Rn.EntityRepository.getInstance();

    // Camera
    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent])
    const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
    cameraComponent.parameters = new Rn.Vector4(0.1, 1000, 90, 1);
    cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 0.5);


    // Lights
    const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
    lightEntity.getTransform().translate = new Rn.Vector3(1.0, 100000.0, 1.0);
    lightEntity.getComponent(Rn.LightComponent).intensity = new Rn.Vector3(1, 1, 1);

    // Plene Mesh
    const primitive = readyBasicVerticesData();
    const entity = generateEntity();
    const meshComponent = entity.getComponent(Rn.MeshComponent);
    meshComponent.addPrimitive(primitive);

    // promise.then(function(response){


      // CameraComponent
      const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
      cameraControllerComponent.setTarget(entity);

      Rn.CameraComponent.main = 0;
      let startTime = Date.now();
      let count = 0;
      const draw = function(time) {

        if (p == null && count > 0) {

          gl.enable(gl.DEPTH_TEST);
          gl.viewport(0, 0, 600, 600);
          gl.clearColor(0.8, 0.8, 0.8, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          p = document.createElement('p');
          p.setAttribute("id", "rendered");
          p.innerText = 'Rendered.';
          document.body.appendChild(p);

        }

        if (window.isAnimating) {
          const date = new Date();
          const rotation = 0.001 * (date.getTime() - startTime);
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

    });

  // });

}

document.body.onload = load;

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}
