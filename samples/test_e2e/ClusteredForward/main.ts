import Rn from '../../../dist/esmdev/index.js';
import { getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

// URL parameters (for comparing the results manually):
//   cluster=off  disables Clustered Forward rendering (every fragment evaluates all lights)
//   build=cpu    builds the light clusters on the CPU in WebGPU mode as well
const params = new URLSearchParams(window.location.search);
const isClusterEnabled = params.get('cluster') !== 'off';
const buildMode = params.get('build') === 'cpu' ? 'cpu' : 'auto';

const p = document.createElement('p');
document.body.appendChild(p);

const engine = await Rn.Engine.init({
  approach: getProcessApproach(Rn),
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({
    cgApiDebugConsoleOutput: true,
    logLevel: Rn.LogLevel.Info,
    isClusteredForwardEnabled: isClusterEnabled,
    clusteredForwardBuildMode: buildMode,
  }),
});
window.Rn = Rn;
window.engine = engine;

// ---- Lights ----
// Light component SIDs follow the creation order. The directional light (SID 0) and a spot light with a SID
// above Config.maxLightNumber cast shadows.

const directionalLight = Rn.createLightWithCameraEntity(engine);
directionalLight.getLight().type = Rn.LightType.Directional;
directionalLight.getLight().intensity = 0.6;
directionalLight.getLight().color = Rn.Vector3.fromCopy3(1.0, 0.95, 0.9);
directionalLight.getLight().castShadow = true;
directionalLight.localEulerAngles = Rn.Vector3.fromCopy3(-1.0, 0.6, 0);
directionalLight.localPosition = Rn.Vector3.fromCopy3(4, 10, 6);

const colors = [
  [1.0, 0.25, 0.2],
  [0.25, 1.0, 0.3],
  [0.25, 0.4, 1.0],
  [1.0, 0.85, 0.2],
  [0.9, 0.3, 1.0],
  [0.2, 0.95, 1.0],
];

// A grid of point lights with a limited range
const pointLightCount = 8;
for (let z = 0; z < pointLightCount; z++) {
  for (let x = 0; x < pointLightCount; x++) {
    const light = Rn.createLightEntity(engine);
    const color = colors[(x + z * 3) % colors.length];
    light.getLight().type = Rn.LightType.Point;
    light.getLight().color = Rn.Vector3.fromCopy3(color[0], color[1], color[2]);
    light.getLight().intensity = 0.8;
    light.getLight().range = 1.6 + ((x * 7 + z * 3) % 5) * 0.2;
    light.localPosition = Rn.Vector3.fromCopy3((x - 3.5) * 1.6, 0.35 + ((x + z) % 3) * 0.3, (z - 3.5) * 1.6);
  }
}

// Spot lights with a limited range pointing down
for (let i = 0; i < 6; i++) {
  const light = Rn.createLightEntity(engine);
  const color = colors[i % colors.length];
  light.getLight().type = Rn.LightType.Spot;
  light.getLight().color = Rn.Vector3.fromCopy3(color[0], color[1], color[2]);
  light.getLight().intensity = 6;
  light.getLight().range = 5;
  light.getLight().innerConeAngle = Rn.MathUtil.degreeToRadian(10);
  light.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(22);
  light.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);
  light.localPosition = Rn.Vector3.fromCopy3((i - 2.5) * 2.4, 3.5, -1.5 + (i % 2) * 3);
}

// A shadow casting spot light whose light component SID is above Config.maxLightNumber
const shadowSpotLight = Rn.createLightWithCameraEntity(engine);
shadowSpotLight.getLight().type = Rn.LightType.Spot;
shadowSpotLight.getLight().intensity = 10;
shadowSpotLight.getLight().color = Rn.Vector3.fromCopy3(1.0, 0.9, 0.8);
shadowSpotLight.getLight().range = 6;
shadowSpotLight.getLight().innerConeAngle = Rn.MathUtil.degreeToRadian(40);
shadowSpotLight.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(55);
shadowSpotLight.getLight().castShadow = true;
// Close to the objects between them, so that they cast clear shadows outward on the floor.
// (The variance shadow map of a perspective light separates depths well only near the light.)
shadowSpotLight.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);
shadowSpotLight.localPosition = Rn.Vector3.fromCopy3(0, 2.2, 1.3);

// ---- Scene ----

const entities: Rn.ISceneGraphEntity[] = [];

const floorMaterial = Rn.MaterialHelper.createPbrUberMaterial(engine, { isShadow: true, isLighting: true });
floorMaterial.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.8, 0.8, 0.8, 1));
floorMaterial.setParameter('metallicRoughnessFactor', Rn.Vector2.fromCopy2(0.0, 0.7));
const floor = Rn.MeshHelper.createPlane(engine, { width: 16, height: 16, uSpan: 8, vSpan: 8, material: floorMaterial });
entities.push(floor);

const nodeBasedMaterial = Rn.MaterialHelper.createNodeBasedCustomMaterial(
  engine,
  createPbrNodeGraph() as any
)!.material;
const classicMaterial = Rn.MaterialHelper.createClassicUberMaterial(engine, { isShadow: true, isLighting: true });
classicMaterial.setParameter('shadingModel', 2);
classicMaterial.setParameter('shininess', 30);

for (let z = 0; z < 4; z++) {
  for (let x = 0; x < 6; x++) {
    let material: Rn.Material;
    if (z === 1) {
      material = nodeBasedMaterial; // node-based PbrShader
    } else if (z === 3) {
      material = classicMaterial; // ClassicShader
    } else {
      material = Rn.MaterialHelper.createPbrUberMaterial(engine, { isShadow: true, isLighting: true });
      material.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.9, 0.9, 0.9, 1));
      material.setParameter('metallicRoughnessFactor', Rn.Vector2.fromCopy2(x / 5, 0.3 + z * 0.2));
    }
    const entity =
      x % 2 === 0
        ? Rn.MeshHelper.createSphere(engine, { radius: 0.55, widthSegments: 32, heightSegments: 24, material })
        : Rn.MeshHelper.createCube(engine, { widthVector: Rn.Vector3.fromCopy3(0.5, 0.5, 0.5), material });
    entity.localPosition = Rn.Vector3.fromCopy3((x - 2.5) * 2.2, 0.6, (z - 1.5) * 2.6);
    entity.localEulerAngles = Rn.Vector3.fromCopy3(0, x * 0.4, 0);
    entities.push(entity);
  }
}

// ---- Camera and rendering ----

const cameraEntity = Rn.createCameraEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 100;
cameraComponent.setFovyAndChangeFocalLength(50);
cameraComponent.aspect = 1;
cameraEntity.localPosition = Rn.Vector3.fromCopy3(0, 9, 13);
cameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(-Math.atan2(9, 13), 0, 0);

const shadowSystem = new Rn.ShadowSystem(engine, 1024);
const shadowExpressions = shadowSystem.getExpressions(entities);

const mainRenderPass = new Rn.RenderPass(engine);
mainRenderPass.clearColor = Rn.Vector4.fromCopy4(0.02, 0.02, 0.03, 1);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;
mainRenderPass.cameraComponent = cameraComponent;
mainRenderPass.addEntities(entities);
const mainExpression = new Rn.Expression();
mainExpression.addRenderPasses([mainRenderPass]);

let count = 0;
engine.startRenderLoop(() => {
  if (count > 0 && !window._rendered) {
    // doTests() waits for window._rendered
    window._rendered = true;
    p.id = 'rendered';
    p.textContent = 'Rendered.';
  }
  shadowSystem.setDepthBiasPV(entities);
  engine.process([...shadowExpressions, mainExpression]);
  count++;
});

/**
 * A node graph that shades with the PbrShader node in the fragment stage.
 */
function createPbrNodeGraph() {
  // Some nodes (e.g. Transform) choose their types from the socket name of `out1`.
  const output = (id: string, socketName = 'Vector4') => ({
    out1: { id: `${id}-out1`, label: 'Out', socket: { name: socketName } },
  });
  const node = (
    id: string,
    name: string,
    inputs: string[],
    outputs: Record<string, unknown>,
    controls: Record<string, unknown> = { shaderStage: null }
  ) => ({
    id,
    name,
    inputs: Object.fromEntries(inputs.map(n => [n, { id: `${id}-${n}`, label: n, socket: { name: 'Vector4' } }])),
    outputs,
    controls,
    position: { x: 0, y: 0 },
  });
  const neutral = { shaderStage: { __type: 'ShaderStageMenuControl', id: 'stage', value: 'Neutral' } };
  const connect = (from: string, fromPort: string, to: string, toPort: string) => ({
    id: `${from}.${fromPort}->${to}.${toPort}`,
    from: { id: from, portName: fromPort },
    to: { id: to, portName: toPort },
  });

  return {
    nodes: [
      node('position', 'AttributePosition', [], output('position')),
      node('normal', 'AttributeNormal', [], output('normal')),
      node('joint', 'AttributeJoint', [], output('joint')),
      node('weight', 'AttributeWeight', [], output('weight')),
      node('worldMatrix', 'WorldMatrix', [], output('worldMatrix')),
      node('normalMatrix', 'NormalMatrix', [], output('normalMatrix')),
      node('viewMatrix', 'ViewMatrix', [], output('viewMatrix')),
      node('projectionMatrix', 'ProjectionMatrix', [], output('projectionMatrix')),
      node(
        'geometry',
        'ProcessGeometry',
        ['worldMatrix', 'normalMatrix', 'viewMatrix', 'position', 'normal', 'joint', 'weight'],
        {
          outNormalMatrix: { id: 'geometry-outNormalMatrix', label: 'Out', socket: { name: 'Matrix3' } },
          outPositionInWorld: { id: 'geometry-outPositionInWorld', label: 'Out', socket: { name: 'Vector4' } },
          outNormalInWorld: { id: 'geometry-outNormalInWorld', label: 'Out', socket: { name: 'Vector3' } },
        },
        {}
      ),
      node('viewTransform', 'Transform', ['in1', 'in2'], output('viewTransform'), neutral),
      node('projectionTransform', 'Transform', ['in1', 'in2'], output('projectionTransform'), neutral),
      node('outPosition', 'OutPosition', ['in1'], {}),
      node('baseColor', 'ConstantVector4Float', [], output('baseColor'), {
        shaderStage: null,
        in1: { value: 0.95 },
        in2: { value: 0.75 },
        in3: { value: 0.55 },
        in4: { value: 1.0 },
      }),
      node(
        'pbr',
        'PbrShader',
        ['positionInWorld', 'normalInWorld', 'geomNormalInWorld', 'baseColor'],
        { outColor: { id: 'pbr-outColor', label: 'Out', socket: { name: 'Vector4' } } },
        { shaderStage: { __type: 'ShaderStageMenuControl', id: 'pbr-stage', value: 'Fragment' } }
      ),
      node('outColor', 'OutColor', ['value'], {}),
    ],
    connections: [
      connect('worldMatrix', 'out1', 'geometry', 'worldMatrix'),
      connect('normalMatrix', 'out1', 'geometry', 'normalMatrix'),
      connect('viewMatrix', 'out1', 'geometry', 'viewMatrix'),
      connect('position', 'out1', 'geometry', 'position'),
      connect('normal', 'out1', 'geometry', 'normal'),
      connect('joint', 'out1', 'geometry', 'joint'),
      connect('weight', 'out1', 'geometry', 'weight'),
      connect('viewMatrix', 'out1', 'viewTransform', 'in1'),
      connect('geometry', 'outPositionInWorld', 'viewTransform', 'in2'),
      connect('projectionMatrix', 'out1', 'projectionTransform', 'in1'),
      connect('viewTransform', 'out1', 'projectionTransform', 'in2'),
      connect('projectionTransform', 'out1', 'outPosition', 'in1'),
      connect('geometry', 'outPositionInWorld', 'pbr', 'positionInWorld'),
      connect('geometry', 'outNormalInWorld', 'pbr', 'normalInWorld'),
      connect('geometry', 'outNormalInWorld', 'pbr', 'geomNormalInWorld'),
      connect('baseColor', 'out1', 'pbr', 'baseColor'),
      connect('pbr', 'outColor', 'outColor', 'value'),
    ],
  };
}
