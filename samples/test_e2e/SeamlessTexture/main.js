
(function() {
//    import Rn from '../../../dist/rhodonite.mjs';
  function generateEntity() {
    const repo = Rn.EntityRepository.getInstance();
    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    return entity;
  }
  function generateGroupEntity() {
    const repo = Rn.EntityRepository.getInstance();
    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent]);
//    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    return entity;
  }

  const promise = Rn.ModuleManager.getInstance().loadModule('webgl');
  promise.then(function(){
    const system = Rn.System.getInstance();
    const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.DataTextureWebGL1, document.getElementById('world'));


    const primitive = new Rn.Plane();
    primitive.generate({width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false});

    Rn.MeshRendererComponent.manualTransparentSids = [];

    const entities = [];
    const entityNumber = 100;
    // for (let i=0; i<entityNumber; i++) {
    //   const sqrtEntityNumber = Math.floor(Math.sqrt(entityNumber));
      const entity = generateEntity();
      // const entity1 = generateGroupEntity();
      // const entity2 = generateGroupEntity();
      // const entity3 = generateGroupEntity();
      // const entity4 = generateGroupEntity();
      // entity4.getSceneGraph().addChild(entity3.getSceneGraph());
      // entity3.getSceneGraph().addChild(entity2.getSceneGraph());
      // entity2.getSceneGraph().addChild(entity1.getSceneGraph());
      // entity1.getSceneGraph().addChild(entity.getSceneGraph());
      // entity1.getTransform().scale = new Rn.Vector3(2, 1, 1);
      entities.push(entity);

      const meshComponent = entity.getComponent(Rn.MeshComponent);
      meshComponent.addPrimitive(primitive);
      //entity.getTransform().toUpdateAllTransform = false;
      // entity.getTransform().scale = new Rn.Vector3(1/sqrtEntityNumber/2, 1/sqrtEntityNumber/2, 1/sqrtEntityNumber/2);
      // entity.getTransform().translate = new Rn.Vector3(1/sqrtEntityNumber * 2 * (i%sqrtEntityNumber) - 1.0 + 1/sqrtEntityNumber, Math.floor(i / sqrtEntityNumber)/sqrtEntityNumber*2 -1.0 + 1/sqrtEntityNumber, 0.0);
    // }
    entity.getTransform().rotate = new Rn.Vector3(-Math.PI/2, 0, 0);;

    const startTime = Date.now();
    let p = null;
    const rotationVec3 = Rn.MutableVector3.zero();
    let count = 0

    const stats = new Stats();
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.domElement );
    const draw = function(time){

      if (p == null && count > 0) {
        p = document.createElement('p');
        p.setAttribute("id", "rendered");
        p.innerText = 'Rendered.';
        document.body.appendChild(p);
      }

      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0, 0, 600, 600);
      gl.clearColor(1, 1, 1, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const date = new Date();

      if (window.isAnimating) {
        const rotation = 0.001 * (date.getTime() - startTime);
        entities.forEach(function(entity){
        rotationVec3.v[0] = rotation;
        rotationVec3.v[1] = rotation;
        rotationVec3.v[2] = rotation;
        entity.getTransform().rotate = rotationVec3;
        });
      }
      stats.begin();

  //      console.log(date.getTime());
      system.process();

      stats.end();
      count++;
      requestAnimationFrame(draw);
    }

    draw();

  });
})();

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}
