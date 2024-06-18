import Rn, { ISceneGraphEntity } from '../../../dist/esmdev/index.js';

declare const window: any;

window.Rn = Rn;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

let count = 0;

const shaderNodeJson = {
  nodes: [
    {
      id: '15d9a955ed427345',
      name: 'AttributePosition',
      outputs: {
        out1: { id: 'b8c33d36f1b1b217', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -601.90625, y: -80.6875 },
    },
    {
      id: '429903328760db6a',
      name: 'WorldMatrix',
      outputs: {
        out1: { id: 'b04347c78841c4ae', label: 'Matrix4 Out', socket: { name: 'Matrix4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -597.65625, y: -247.85546875 },
    },
    {
      id: 'ab4ff22c1fb2f1a8',
      name: 'Transform',
      outputs: {
        out1: { id: '0a01a0b54b490f2a', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '47fc4100d87a2112', label: 'In1 Matrix4', socket: { name: 'Matrix4' } },
        in2: { id: 'babc2bc47700fb85', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '010fa380bd0979a3', value: 'Neutral' },
      },
      position: { x: -313.69921875, y: -274.49609375 },
    },
    {
      id: '71b0d8647f96a980',
      name: 'ViewMatrix',
      outputs: {
        out1: { id: 'be13ac643d4d47ff', label: 'Matrix4 Out', socket: { name: 'Matrix4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -293.7421875, y: -453.62109375 },
    },
    {
      id: '4cb1bf4005755ba7',
      name: 'Transform',
      outputs: {
        out1: { id: '825c67de8332d9b1', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '0fc3a814889e1470', label: 'In1 Matrix4', socket: { name: 'Matrix4' } },
        in2: { id: '99447228dbf257a9', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '04833eff5016545b', value: 'Neutral' },
      },
      position: { x: 86.20703125, y: -411.64453125 },
    },
    {
      id: '4112cce9d29d86e0',
      name: 'ProjectionMatrix',
      outputs: {
        out1: { id: '789b6c1896e10859', label: 'Matrix4 Out', socket: { name: 'Matrix4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: 96.62890625, y: -604.17578125 },
    },
    {
      id: 'ef501a5669e893d4',
      name: 'Transform',
      outputs: {
        out1: { id: 'eff7a33faf175009', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '8719b083b4b45d2b', label: 'In1 Matrix4', socket: { name: 'Matrix4' } },
        in2: { id: '36857da51007b31e', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '1a00371637486507', value: 'Neutral' },
      },
      position: { x: 458.9375, y: -571.66796875 },
    },
    {
      id: '7020bd36cedef5d4',
      name: 'OutPosition',
      outputs: {},
      inputs: { in1: { id: '7e8b1fe29568f6d3', label: 'In Vector4', socket: { name: 'Vector4' } } },
      controls: { shaderStage: null },
      position: { x: 830.61328125, y: -640.12109375 },
    },
    {
      id: '44051d341cbcc1b0',
      name: 'ConstantVector4',
      outputs: {
        out1: { id: 'b647a0f02d7e6fcf', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {},
      controls: {
        shaderStage: null,
        in1: {
          __type: 'ClassicPreset.InputControl',
          id: 'e12641c67eaf9c4f',
          type: 'number',
          value: 1,
        },
        in2: {
          __type: 'ClassicPreset.InputControl',
          id: '89ab47360594b536',
          type: 'number',
          value: 0,
        },
        in3: {
          __type: 'ClassicPreset.InputControl',
          id: 'a11225e785df7fb7',
          type: 'number',
          value: 0,
        },
        in4: {
          __type: 'ClassicPreset.InputControl',
          id: 'e08f6f544f4f755f',
          type: 'number',
          value: 1,
        },
      },
      position: { x: 1209.298996289472, y: -530.7424585573985 },
    },
    {
      id: '5bb9f912882c0661',
      name: 'OutColor',
      outputs: {},
      inputs: { in1: { id: 'c31745f045ffe427', label: 'In Vector4', socket: { name: 'Vector4' } } },
      controls: { shaderStage: null },
      position: { x: 1627.3551050494857, y: -599.7161157400174 },
    },
    {
      id: '8f86e10deeb41ea3',
      name: 'NormalMatrix',
      outputs: {
        out1: { id: '1760aa27287b5322', label: 'Matrix3 Out', socket: { name: 'Matrix3' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -686.6239552501706, y: -1148.265066909867 },
    },
    {
      id: '6b0f90864d9f0a7b',
      name: 'AttributeNormal',
      outputs: {
        out1: { id: '5ae794200b95483c', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -685.6178945304895, y: -982.9606672886732 },
    },
    {
      id: '5e8444132e8f3675',
      name: 'Transform',
      outputs: {
        out1: { id: '548bab6b10f5dfd2', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: {
        in1: { id: '9c1cd690ef08b118', label: 'In1 Matrix3', socket: { name: 'Matrix3' } },
        in2: { id: '01e0be4684abf93e', label: 'In2 Vector3', socket: { name: 'Vector3' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: 'd4f121b4464776b5', value: 'Neutral' },
      },
      position: { x: -329.7023564993249, y: -1147.4947118445114 },
    },
    {
      id: 'b1f9e02a87b1560e',
      name: 'Normalize',
      outputs: {
        out1: { id: '5a68f67fb1d4aee8', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: { in1: { id: '75d481640ebfd66f', label: 'In Vector3', socket: { name: 'Vector3' } } },
      controls: {
        shaderStage: {
          __type: 'ShaderStageMenuControl',
          id: '6595380965c50577',
          value: 'Fragment',
        },
      },
      position: { x: 69.21120075114482, y: -1152.071467705534 },
    },
    {
      id: '2e07c37a63a3648a',
      name: 'ConstantVector3',
      outputs: {
        out1: { id: 'edeac916451f76b4', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: {},
      controls: {
        shaderStage: null,
        in1: {
          __type: 'ClassicPreset.InputControl',
          id: '003ca7cb17ca7f69',
          type: 'number',
          value: 0,
        },
        in2: {
          __type: 'ClassicPreset.InputControl',
          id: '1b0ad2e73cd6236f',
          type: 'number',
          value: 1,
        },
        in3: {
          __type: 'ClassicPreset.InputControl',
          id: '51223eda093b78da',
          type: 'number',
          value: 0,
        },
      },
      position: { x: -285.0675439764348, y: -883.8781638893953 },
    },
    {
      id: 'c9e136d08600183f',
      name: 'Normalize',
      outputs: {
        out1: { id: '661f3b001be6ee9c', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: { in1: { id: 'fc622fae0e5bcf4b', label: 'In Vector3', socket: { name: 'Vector3' } } },
      controls: {
        shaderStage: {
          __type: 'ShaderStageMenuControl',
          id: '38016658fc909467',
          value: 'Fragment',
        },
      },
      position: { x: 55.41543845068463, y: -943.1617035658813 },
    },
    {
      id: 'bd569f666671278d',
      name: 'Dot',
      outputs: {
        out1: { id: 'd53d5bf06c18d518', label: 'Scalar Out', socket: { name: 'Scalar' } },
      },
      inputs: {
        in1: { id: 'd69f6a43ac82e032', label: 'In1 Vector', socket: { name: 'Vector3' } },
        in2: { id: '2b04e8e29720b4b3', label: 'In2 Vector', socket: { name: 'Vector3' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '175224c2a7f32778', value: 'Neutral' },
      },
      position: { x: 376.89875354020387, y: -1104.1304391402125 },
    },
    {
      id: 'de5a4437c6f78489',
      name: 'ScalarToVector4',
      outputs: {
        out1: { id: '02d23aad4c7338a5', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '781e241eb97afb89', label: 'In X Scalar', socket: { name: 'Scalar' } },
        in2: { id: 'e73b1227da187f59', label: 'In Y Scalar', socket: { name: 'Scalar' } },
        in3: { id: 'cbec7f2ef5a1a00b', label: 'In Z Scalar', socket: { name: 'Scalar' } },
        in4: { id: '1ffe84dfbaa957bd', label: 'In W Scalar', socket: { name: 'Scalar' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '2051a8d454a1847f', value: 'Neutral' },
      },
      position: { x: 776.1138224098921, y: -1128.7929106604392 },
    },
    {
      id: 'dad05697cec91325',
      name: 'ConstantScalar',
      outputs: {
        out1: { id: 'f28bad8a062a6022', label: 'Scalar Out', socket: { name: 'Scalar' } },
      },
      inputs: {},
      controls: {
        shaderStage: null,
        in1: {
          __type: 'ClassicPreset.InputControl',
          id: '51dcdce2e4c779a1',
          type: 'number',
          value: 1,
        },
      },
      position: { x: 405.7550500746741, y: -858.9978915120753 },
    },
    {
      id: 'b1ee3b84abd77643',
      name: 'Add',
      outputs: {
        out1: { id: '8f791da0d581ddac', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '4f68d42e02cfeb07', label: 'In1 Vector4', socket: { name: 'Vector4' } },
        in2: { id: 'c10282faba407ae1', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '7a81fc2a89b01ffa', value: 'Neutral' },
      },
      position: { x: 1434.3451031340196, y: -942.9578048911557 },
    },
  ],
  connections: [
    {
      id: 'da1b105bbd246029',
      from: { id: '429903328760db6a', portName: 'out1' },
      to: { id: 'ab4ff22c1fb2f1a8', portName: 'in1' },
    },
    {
      id: 'f0e1ca382dd55058',
      from: { id: '15d9a955ed427345', portName: 'out1' },
      to: { id: 'ab4ff22c1fb2f1a8', portName: 'in2' },
    },
    {
      id: '50a5e7446014c26d',
      from: { id: 'ab4ff22c1fb2f1a8', portName: 'out1' },
      to: { id: '4cb1bf4005755ba7', portName: 'in2' },
    },
    {
      id: '53095dea92e94a33',
      from: { id: '71b0d8647f96a980', portName: 'out1' },
      to: { id: '4cb1bf4005755ba7', portName: 'in1' },
    },
    {
      id: 'b137f9f5fa7e4452',
      from: { id: '4cb1bf4005755ba7', portName: 'out1' },
      to: { id: 'ef501a5669e893d4', portName: 'in2' },
    },
    {
      id: '6e2b869ffca33f7d',
      from: { id: '4112cce9d29d86e0', portName: 'out1' },
      to: { id: 'ef501a5669e893d4', portName: 'in1' },
    },
    {
      id: '1cf8f22fd09ebc00',
      from: { id: 'ef501a5669e893d4', portName: 'out1' },
      to: { id: '7020bd36cedef5d4', portName: 'in1' },
    },
    {
      id: '1acd1da3ba20631d',
      from: { id: '8f86e10deeb41ea3', portName: 'out1' },
      to: { id: '5e8444132e8f3675', portName: 'in1' },
    },
    {
      id: 'a1dca656f9214de2',
      from: { id: '6b0f90864d9f0a7b', portName: 'out1' },
      to: { id: '5e8444132e8f3675', portName: 'in2' },
    },
    {
      id: 'd09edf8babf351db',
      from: { id: '5e8444132e8f3675', portName: 'out1' },
      to: { id: 'b1f9e02a87b1560e', portName: 'in1' },
    },
    {
      id: '0bffb0678a4f9aad',
      from: { id: '2e07c37a63a3648a', portName: 'out1' },
      to: { id: 'c9e136d08600183f', portName: 'in1' },
    },
    {
      id: '018e0f395ebd0567',
      from: { id: 'b1f9e02a87b1560e', portName: 'out1' },
      to: { id: 'bd569f666671278d', portName: 'in1' },
    },
    {
      id: '997a381582b2b799',
      from: { id: 'c9e136d08600183f', portName: 'out1' },
      to: { id: 'bd569f666671278d', portName: 'in2' },
    },
    {
      id: '651fb3c5f1fafb62',
      from: { id: 'bd569f666671278d', portName: 'out1' },
      to: { id: 'de5a4437c6f78489', portName: 'in1' },
    },
    {
      id: '540421f6e4815f59',
      from: { id: 'bd569f666671278d', portName: 'out1' },
      to: { id: 'de5a4437c6f78489', portName: 'in2' },
    },
    {
      id: '2be38e65f60b2e58',
      from: { id: 'bd569f666671278d', portName: 'out1' },
      to: { id: 'de5a4437c6f78489', portName: 'in3' },
    },
    {
      id: '18395f1e43b785f8',
      from: { id: 'dad05697cec91325', portName: 'out1' },
      to: { id: 'de5a4437c6f78489', portName: 'in4' },
    },
    {
      id: '8a8a1e811341c72a',
      from: { id: 'de5a4437c6f78489', portName: 'out1' },
      to: { id: 'b1ee3b84abd77643', portName: 'in1' },
    },
    {
      id: 'e624760d264af607',
      from: { id: '44051d341cbcc1b0', portName: 'out1' },
      to: { id: 'b1ee3b84abd77643', portName: 'in2' },
    },
    {
      id: 'cb04fc4c84a2affb',
      from: { id: 'b1ee3b84abd77643', portName: 'out1' },
      to: { id: '5bb9f912882c0661', portName: 'in1' },
    },
  ],
};

const result = Rn.ShaderGraphResolver.generateShaderCodeFromJson(shaderNodeJson);

const response = await Rn.Gltf2Importer.importFromUri(
  '../../../assets/gltf/glTF-Sample-Assets/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb'
);
//---------------------------
const rootGroup = Rn.ModelConverter.convertToRhodoniteObject(response.unwrapForce());
rootGroup.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);

applyShader(rootGroup);

// CameraComponent
const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
// cameraComponent.type = Rn.CameraTyp]e.Orthographic;
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = 1;
cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);
const cameraControllerComponent = cameraEntity.getCameraController();
cameraControllerComponent.controller.setTarget(rootGroup);
(cameraControllerComponent.controller as Rn.OrbitCameraController).autoUpdate = false;

// renderPass
const renderPass = new Rn.RenderPass();
renderPass.clearColor = Rn.Vector4.fromCopy4(0.5, 0.5, 0.5, 1.0);
// renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities([rootGroup]);
renderPass.cameraComponent = cameraComponent;

// expression
const expressions = [];
const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);
expressions.push(expression);

let startTime = Date.now();
let startTimeForPerformanceNow = 0;
const draw = function () {
  if (count > 0) {
    window._rendered = true;
  }

  if (window.isAnimating) {
    Rn.AnimationComponent.isAnimating = true;
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
  } else {
    Rn.AnimationComponent.isAnimating = false;
  }

  //      console.log(date.getTime());
  Rn.System.process(expressions);

  const t0 = Rn.System.timeAtProcessBegin;
  const t1 = Rn.System.timeAtProcessEnd;
  const msec = t1 - t0;
  const sec = msec / 1000;
  const virtualFps = 1.0 / sec;
  const duration = t1 - startTimeForPerformanceNow;
  if (duration > 1000) {
    console.log(`draw time: ${msec} msec, virtual fps: ${virtualFps} fps`);
    startTimeForPerformanceNow = t1;
  }

  count++;
  requestAnimationFrame(draw);
};

draw();

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};

function applyShader(entity: ISceneGraphEntity) {
  const meshComponent = entity.tryToGetMesh();
  if (meshComponent != null) {
    const primitiveNumber = meshComponent.mesh!.getPrimitiveNumber();
    for (let i = 0; i < primitiveNumber; i++) {
      const primitive = meshComponent.mesh!.getPrimitiveAt(i);
      if (primitive.material != null) {
        const newMaterial = Rn.MaterialHelper.reuseOrRecreateCustomMaterial(
          primitive.material,
          result.vertexShader,
          result.pixelShader,
          {
            maxInstancesNumber: 1,
          }
        );
        primitive.material = newMaterial;
      }
    }
  }
  for (const child of entity.getSceneGraph().children) {
    applyShader(child.entity);
  }
}
