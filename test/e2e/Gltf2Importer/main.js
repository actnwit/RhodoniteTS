
let p = null;

const load = async function(time){
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  const importer = Rn.Gltf2Importer.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent.componentTID, Rn.SceneGraphComponent.componentTID, Rn.CameraComponent.componentTID])
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent.componentTID);
  cameraComponent.type = Rn.CameraType.Orthographic;
  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 100);

  const response = await importer.import('../../../assets/gltf/2.0/Box/glTF/Box.gltf');
  const modelConverter = Rn.ModelConverter.getInstance();
  const rootGroup = modelConverter.convertToRhodoniteObject(response);
  //rootGroup.getTransform().translate = new Rn.Vector3(1.0, 0, 0);
  rootGroup.getTransform().rotate = new Rn.Vector3(1.0, 1.0, 1.0);

  Rn.CameraComponent.main = 0;

  const draw = function(time) {

    if (p == null) {
      if (response != null) {

        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 600, 600);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

      p = document.createElement('p');
      p.setAttribute("id", "rendered");
      p.innerText = 'Rendered.';
      document.body.appendChild(p);

    }

    system.process();

    requestAnimationFrame(draw);
  }

  draw();
}

document.body.onload = load;

