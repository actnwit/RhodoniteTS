import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

const canvas = document.getElementById('world') as HTMLCanvasElement;
// Init Rhodonite
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info }),
});

const forwardRenderPipeline = new Rn.ForwardRenderPipeline(engine);
forwardRenderPipeline.setup(canvas.width, canvas.height, {
  isSimple: true,
});

function createEarth() {
  const radius = 10;
  const position = Rn.Vector3.fromCopy3(0, -10, -10);
  const sphereEntity = Rn.createRaymarchingEntity(engine);
  sphereEntity.position = position;
  sphereEntity.scale = Rn.Vector3.fromCopy3(radius, radius, radius);
  sphereEntity.getRaymarching().sdfShapeType = Rn.SdfShapeType.Sphere;

  const newEntity = engine.entityRepository.addComponentToEntity(Rn.PhysicsComponent, sphereEntity);
  const physicsComponent = newEntity.getPhysics();
  const strategy = new Rn.OimoPhysicsStrategy();
  const property = {
    type: Rn.PhysicsShape.Sphere,
    size: Rn.Vector3.fromCopy3(radius, radius, radius),
    position: position.clone(),
    rotation: Rn.Vector3.fromCopy3(0, 0, 0),
    move: false,
    density: 1,
    friction: 0.5,
    restitution: 0.2,
  };
  strategy.setShape(property, newEntity);
  physicsComponent.setStrategy(strategy);

  return sphereEntity;
}

function createSpheres() {
  const spheres: Rn.ISceneGraphEntity[] = [];
  for (let i = 0; i < 5; i++) {
    const sphereEntity = Rn.createRaymarchingEntity(engine);
    sphereEntity.position = Rn.Vector3.fromCopy3(Math.random() * 5 - 2.5, 10 + i, Math.random() * 5 - 2.5 - 5);
    sphereEntity.getRaymarching().sdfShapeType = Rn.SdfShapeType.Sphere;
    const newEntity = engine.entityRepository.addComponentToEntity(Rn.PhysicsComponent, sphereEntity);
    const physicsComponent = newEntity.getPhysics();
    const strategy = new Rn.OimoPhysicsStrategy();
    const property = {
      type: Rn.PhysicsShape.Sphere,
      size: Rn.Vector3.fromCopy3(1, 1, 1),
      position: sphereEntity.position.clone(),
      rotation: Rn.Vector3.fromCopy3(0, 0, 0),
      move: true,
      density: 1,
      friction: 0.5,
      restitution: 0.2,
    };
    strategy.setShape(property, newEntity);
    physicsComponent.setStrategy(strategy);
    spheres.push(newEntity);
  }
  return spheres;
}

createEarth();
const spheres = createSpheres();
const result = Rn.MaterialHelper.createNodeBasedRaymarchingCustomMaterial(
  engine,
  Rn.MaterialHelper.collectRrnJson(engine) as unknown as Rn.ShaderNodeJson
);
if (!result) {
  throw new Error('Failed to create node-based raymarching custom material');
}
const material = result.material;
forwardRenderPipeline.setRaymarchingMaterial(material);
// Render Loop
let count = 0;

forwardRenderPipeline.startRenderLoop(frame => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  engine.process(frame);

  for (const sphere of spheres) {
    if (sphere.position.y < -10) {
      sphere.position = Rn.Vector3.fromCopy3(Math.random() * 5 - 2.5, 10, Math.random() * 5 - 2.5 - 5);
    }
  }
  count++;
});
