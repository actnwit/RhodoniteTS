import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

window.Rn = Rn;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

let count = 0;

const shaderNodeJson = {
  nodes: [
    {
      id: '15d9a955ed427345',
      name: 'AttributePosition',
      outputs: {
        out1: { id: '9d4b7fe5001c1466', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -601.90625, y: -80.6875 },
    },
    {
      id: '429903328760db6a',
      name: 'WorldMatrix',
      outputs: {
        out1: { id: 'd28c51ea1110b230', label: 'Matrix4 Out', socket: { name: 'Matrix4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -597.65625, y: -247.85546875 },
    },
    {
      id: 'ab4ff22c1fb2f1a8',
      name: 'Transform',
      outputs: {
        out1: { id: '186f95abc1eb53df', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: 'bbed7c8863853dfa', label: 'In1 Matrix4', socket: { name: 'Matrix4' } },
        in2: { id: 'fb96b9c106e3680c', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '986752ebe67fff59', value: 'Neutral' },
      },
      position: { x: -313.69921875, y: -274.49609375 },
    },
    {
      id: '71b0d8647f96a980',
      name: 'ViewMatrix',
      outputs: {
        out1: { id: 'dae6be72bb2e9393', label: 'Matrix4 Out', socket: { name: 'Matrix4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -293.7421875, y: -453.62109375 },
    },
    {
      id: '4cb1bf4005755ba7',
      name: 'Transform',
      outputs: {
        out1: { id: '243794adad7508b6', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: 'd8edd0dffe86ee6a', label: 'In1 Matrix4', socket: { name: 'Matrix4' } },
        in2: { id: 'bb7b658bc1e262b2', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '19eafe10af1a174f', value: 'Neutral' },
      },
      position: { x: 86.20703125, y: -411.64453125 },
    },
    {
      id: '4112cce9d29d86e0',
      name: 'ProjectionMatrix',
      outputs: {
        out1: { id: '018cf2c7c4f51648', label: 'Matrix4 Out', socket: { name: 'Matrix4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: 96.62890625, y: -604.17578125 },
    },
    {
      id: 'ef501a5669e893d4',
      name: 'Transform',
      outputs: {
        out1: { id: 'acb75605c79f12af', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '9f321935d958d6d3', label: 'In1 Matrix4', socket: { name: 'Matrix4' } },
        in2: { id: '1fa3f5437a13a9bf', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '461c28029d1d8983', value: 'Neutral' },
      },
      position: { x: 458.9375, y: -571.66796875 },
    },
    {
      id: '7020bd36cedef5d4',
      name: 'OutPosition',
      outputs: {},
      inputs: { in1: { id: 'ff9394652aaf4f5c', label: 'In Vector4', socket: { name: 'Vector4' } } },
      controls: { shaderStage: null },
      position: { x: 830.61328125, y: -640.12109375 },
    },
    {
      id: '44051d341cbcc1b0',
      name: 'ConstantVector4',
      outputs: {
        out1: { id: '3207cf6520ff97b2', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {},
      controls: {
        shaderStage: null,
        in1: {
          __type: 'ClassicPreset.InputControl',
          id: '13f16cc4a6f03a5c',
          type: 'number',
          value: 1,
        },
        in2: {
          __type: 'ClassicPreset.InputControl',
          id: '0fddfb62badad962',
          type: 'number',
          value: 0,
        },
        in3: {
          __type: 'ClassicPreset.InputControl',
          id: '2951057e6d4857e0',
          type: 'number',
          value: 0,
        },
        in4: {
          __type: 'ClassicPreset.InputControl',
          id: '6035aa0acdb2413e',
          type: 'number',
          value: 1,
        },
      },
      position: { x: 1121.7493249998631, y: -408.4883304698771 },
    },
    {
      id: '5bb9f912882c0661',
      name: 'OutColor',
      outputs: {},
      inputs: { in1: { id: '72d4596e68afd89e', label: 'In Vector4', socket: { name: 'Vector4' } } },
      controls: { shaderStage: null },
      position: { x: 1702.1289209384222, y: -420.09067912227067 },
    },
    {
      id: '44ad32b556110bd9',
      name: 'AttributeNormal',
      outputs: {
        out1: { id: '96b33819ade33a12', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -688.1774895594267, y: -1038.6752029904117 },
    },
    {
      id: '75ded2dd54d36e8f',
      name: 'NormalMatrix',
      outputs: {
        out1: { id: 'cde215a3a2355a6f', label: 'Matrix3 Out', socket: { name: 'Matrix3' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -695.7829224164611, y: -1210.1679945135247 },
    },
    {
      id: '8c311b10bc9c654d',
      name: 'Transform',
      outputs: {
        out1: { id: 'c37ddbaf5ded7dc7', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: {
        in1: { id: 'ef85a5e172bed0e9', label: 'In1 Matrix3', socket: { name: 'Matrix3' } },
        in2: { id: '640f540bb6b7c145', label: 'In2 Vector3', socket: { name: 'Vector3' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: 'd081c46bb87fbd4d', value: 'Neutral' },
      },
      position: { x: -367.9474588154777, y: -1229.776890090607 },
    },
    {
      id: 'f601ab7bb18448eb',
      name: 'Normalize',
      outputs: {
        out1: { id: '623aa80df15749bf', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: { in1: { id: '28aa8dd282dd01b5', label: 'In Vector3', socket: { name: 'Vector3' } } },
      controls: {
        shaderStage: {
          __type: 'ShaderStageMenuControl',
          id: 'e1c3a0d07e5eb1ae',
          value: 'Fragment',
        },
      },
      position: { x: 73.9391245066081, y: -1236.4954274227796 },
    },
    {
      id: '9c150e161a78be5c',
      name: 'ConstantVector3',
      outputs: {
        out1: { id: '08cc662dc1ac99f6', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: {},
      controls: {
        shaderStage: null,
        in1: {
          __type: 'ClassicPreset.InputControl',
          id: 'cb8343f00448a169',
          type: 'number',
          value: 0,
        },
        in2: {
          __type: 'ClassicPreset.InputControl',
          id: 'e5b4ec00801f02b2',
          type: 'number',
          value: 1,
        },
        in3: {
          __type: 'ClassicPreset.InputControl',
          id: '7748b6ccfc4e0622',
          type: 'number',
          value: 0,
        },
      },
      position: { x: -364.52136925368274, y: -1028.7796357986315 },
    },
    {
      id: '446313fdfa73130b',
      name: 'Normalize',
      outputs: {
        out1: { id: 'c832f10837de714e', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: { in1: { id: '45f13a7fe49bc677', label: 'In Vector3', socket: { name: 'Vector3' } } },
      controls: {
        shaderStage: {
          __type: 'ShaderStageMenuControl',
          id: '098595af26200637',
          value: 'Fragment',
        },
      },
      position: { x: 93.56624396433816, y: -1043.7657403180435 },
    },
    {
      id: '2b62cd0bec65f01b',
      name: 'Dot',
      outputs: {
        out1: { id: 'c18bb34d22c7d951', label: 'Scalar Out', socket: { name: 'Scalar' } },
      },
      inputs: {
        in1: { id: '3626b34f4b6728e0', label: 'In1 Vector', socket: { name: 'Vector3' } },
        in2: { id: '5d3e7069f97faf60', label: 'In2 Vector', socket: { name: 'Vector3' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '7a190270a2f1566a', value: 'Neutral' },
      },
      position: { x: 470.63655844891855, y: -1183.4882332450782 },
    },
    {
      id: '67c6a2c76bd1e907',
      name: 'MergeVector',
      outputs: {
        outXYZW: { id: '9357b5e290c53b21', label: 'xyzw Out', socket: { name: 'Vector4' } },
        outXYZ: { id: '947e4b5dbc268aa4', label: 'xyz Out', socket: { name: 'Vector3' } },
        outXY: { id: 'b702a3c63d03a4d1', label: 'xy Out', socket: { name: 'Vector2' } },
        outZW: { id: 'bdcaa0b02373b57f', label: 'zw Out', socket: { name: 'Vector2' } },
      },
      inputs: {
        inXYZ: { id: 'afa3194d1a8f6d77', label: 'In xyz', socket: { name: 'Vector3' } },
        inXY: { id: 'cfcb1d20f3dcac60', label: 'In xy', socket: { name: 'Vector2' } },
        inZW: { id: '39972d805efe86ae', label: 'In zw', socket: { name: 'Vector2' } },
        inX: { id: '0cfc2cd1408f6e9f', label: 'In x', socket: { name: 'Scalar' } },
        inY: { id: '1e755625e0e736f6', label: 'In y', socket: { name: 'Scalar' } },
        inZ: { id: 'eb744c493725df28', label: 'In z', socket: { name: 'Scalar' } },
        inW: { id: 'c0fae47f1d8a826e', label: 'In w', socket: { name: 'Scalar' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: 'c8e220fdd44802b1', value: 'Neutral' },
      },
      position: { x: 815.4749026943422, y: -1250.6128602979775 },
    },
    {
      id: 'b3b171d7f11033da',
      name: 'ConstantScalar',
      outputs: {
        out1: { id: '910ccb4d12727c86', label: 'Scalar Out', socket: { name: 'Scalar' } },
      },
      inputs: {},
      controls: {
        shaderStage: null,
        in1: {
          __type: 'ClassicPreset.InputControl',
          id: '332a4946c8b36135',
          type: 'number',
          value: 1,
        },
      },
      position: { x: 417.4289015840911, y: -928.955292236614 },
    },
    {
      id: '1520e59aaaf4c8c7',
      name: 'Add',
      outputs: {
        out1: { id: '63f5e4e1667ee17d', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '8eb726f69b5c0444', label: 'In1 Vector4', socket: { name: 'Vector4' } },
        in2: { id: 'b2f1ff633571e8de', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '47954355d94a210d', value: 'Neutral' },
      },
      position: { x: 1427.247040651816, y: -801.5066845665546 },
    },
  ],
  connections: [
    {
      id: '5b5f90a2742135e8',
      from: { id: '429903328760db6a', portName: 'out1' },
      to: { id: 'ab4ff22c1fb2f1a8', portName: 'in1' },
    },
    {
      id: 'd5667f660e0d92dc',
      from: { id: '15d9a955ed427345', portName: 'out1' },
      to: { id: 'ab4ff22c1fb2f1a8', portName: 'in2' },
    },
    {
      id: '019e4e5820344ec7',
      from: { id: 'ab4ff22c1fb2f1a8', portName: 'out1' },
      to: { id: '4cb1bf4005755ba7', portName: 'in2' },
    },
    {
      id: '7b0c69ad112b8e28',
      from: { id: '71b0d8647f96a980', portName: 'out1' },
      to: { id: '4cb1bf4005755ba7', portName: 'in1' },
    },
    {
      id: '38d9674e2abc446b',
      from: { id: '4cb1bf4005755ba7', portName: 'out1' },
      to: { id: 'ef501a5669e893d4', portName: 'in2' },
    },
    {
      id: '72c8f820508aa5f3',
      from: { id: '4112cce9d29d86e0', portName: 'out1' },
      to: { id: 'ef501a5669e893d4', portName: 'in1' },
    },
    {
      id: '42d883e9460856ed',
      from: { id: 'ef501a5669e893d4', portName: 'out1' },
      to: { id: '7020bd36cedef5d4', portName: 'in1' },
    },
    {
      id: '080bf6a7036dd102',
      from: { id: '75ded2dd54d36e8f', portName: 'out1' },
      to: { id: '8c311b10bc9c654d', portName: 'in1' },
    },
    {
      id: '02d2be1d2fe47048',
      from: { id: '44ad32b556110bd9', portName: 'out1' },
      to: { id: '8c311b10bc9c654d', portName: 'in2' },
    },
    {
      id: '4c0780e71e5b6b4d',
      from: { id: '8c311b10bc9c654d', portName: 'out1' },
      to: { id: 'f601ab7bb18448eb', portName: 'in1' },
    },
    {
      id: '3eb94b99ca1a5c3d',
      from: { id: '9c150e161a78be5c', portName: 'out1' },
      to: { id: '446313fdfa73130b', portName: 'in1' },
    },
    {
      id: 'af839de7ced39d0e',
      from: { id: 'f601ab7bb18448eb', portName: 'out1' },
      to: { id: '2b62cd0bec65f01b', portName: 'in1' },
    },
    {
      id: '1a83773b3a26e5f9',
      from: { id: '446313fdfa73130b', portName: 'out1' },
      to: { id: '2b62cd0bec65f01b', portName: 'in2' },
    },
    {
      id: 'a5132c1e8b20709a',
      from: { id: '2b62cd0bec65f01b', portName: 'out1' },
      to: { id: '67c6a2c76bd1e907', portName: 'inX' },
    },
    {
      id: '640117c0ecf27d39',
      from: { id: '2b62cd0bec65f01b', portName: 'out1' },
      to: { id: '67c6a2c76bd1e907', portName: 'inZ' },
    },
    {
      id: 'ec587f1611c39eb1',
      from: { id: '2b62cd0bec65f01b', portName: 'out1' },
      to: { id: '67c6a2c76bd1e907', portName: 'inY' },
    },
    {
      id: '4414c81eddda9e9e',
      from: { id: 'b3b171d7f11033da', portName: 'out1' },
      to: { id: '67c6a2c76bd1e907', portName: 'inW' },
    },
    {
      id: 'f56ae98638a9bdb7',
      from: { id: '44051d341cbcc1b0', portName: 'out1' },
      to: { id: '1520e59aaaf4c8c7', portName: 'in2' },
    },
    {
      id: '76b6d3ceb0c704ba',
      from: { id: '67c6a2c76bd1e907', portName: 'outXYZW' },
      to: { id: '1520e59aaaf4c8c7', portName: 'in1' },
    },
    {
      id: '3bbb99d712cf72d0',
      from: { id: '1520e59aaaf4c8c7', portName: 'out1' },
      to: { id: '5bb9f912882c0661', portName: 'in1' },
    },
  ],
};

const result = Rn.ShaderGraphResolver.generateShaderCodeFromJson(shaderNodeJson as any);

const response = await Rn.Gltf2Importer.importFromUri(
  '../../../assets/gltf/glTF-Sample-Assets/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb'
);
//---------------------------
const rootGroup = Rn.ModelConverter.convertToRhodoniteObject(response.unwrapForce());
rootGroup.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);

applyShader(rootGroup);

// CameraComponent
const cameraEntity = Rn.createCameraControllerEntity();
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

function applyShader(entity: Rn.ISceneGraphEntity) {
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
