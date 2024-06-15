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
      id: 'edb30b16c226c1df',
      name: 'WorldMatrix',
      outputs: {
        out1: { id: 'bf7e4f9f975ae188', label: 'Matrix4 Out', socket: { name: 'Matrix4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -452.45703125, y: -171.1015625 },
    },
    {
      id: 'bf222f4a1ac9eec0',
      name: 'AttributePosition',
      outputs: {
        out1: { id: 'bd002920cae98aaa', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -441.609375, y: 59.42578125 },
    },
    {
      id: '8af3ef7e85e9635b',
      name: 'MultiplyMatrix4xVector4',
      outputs: {
        out1: { id: 'e323333a49b35c56', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '091fdc22b3f74491', label: 'In1 Matrix4', socket: { name: 'Matrix4' } },
        in2: { id: 'e1881684a93394eb', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: 'b9ac3e50c2e90c0b', value: 'Neutral' },
      },
      position: { x: -77.5859375, y: -89.01171875 },
    },
    {
      id: '89e6ae4ae6f8b0a5',
      name: 'ViewMatrix',
      outputs: {
        out1: { id: '72b1cb93acafff59', label: 'Matrix4 Out', socket: { name: 'Matrix4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -76.4296875, y: -372.70703125 },
    },
    {
      id: 'b211b8af7548a018',
      name: 'MultiplyMatrix4xVector4',
      outputs: {
        out1: { id: 'ecff31091ec075a1', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '1d994e9ae57a39b5', label: 'In1 Matrix4', socket: { name: 'Matrix4' } },
        in2: { id: 'a61f83e5e0bbf281', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '78983d266f225ff4', value: 'Neutral' },
      },
      position: { x: 249.3671875, y: -279.55078125 },
    },
    {
      id: 'b9aaab2046df297f',
      name: 'ProjectionMatrix',
      outputs: {
        out1: { id: 'cff6cb4fda585aeb', label: 'Matrix4 Out', socket: { name: 'Matrix4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: 263.86328125, y: -492.0234375 },
    },
    {
      id: 'ebc1c3e22f22c925',
      name: 'MultiplyMatrix4xVector4',
      outputs: {
        out1: { id: 'e0503e84d275760b', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: 'aeda3f77ed019088', label: 'In1 Matrix4', socket: { name: 'Matrix4' } },
        in2: { id: 'a76d3a79c20be09b', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '9c56b3172051c9e4', value: 'Neutral' },
      },
      position: { x: 595.54296875, y: -410.12109375 },
    },
    {
      id: '44a4b1e69714581b',
      name: 'OutPosition',
      outputs: {},
      inputs: { in1: { id: '89de51589776c393', label: 'In Vector4', socket: { name: 'Vector4' } } },
      controls: { shaderStage: null },
      position: { x: 913.5, y: -469.23828125 },
    },
    {
      id: '85a5e8502ae3dd16',
      name: 'OutColor',
      outputs: {},
      inputs: { in1: { id: 'c375c440093d57dc', label: 'In Vector4', socket: { name: 'Vector4' } } },
      controls: { shaderStage: null },
      position: { x: 1759.648580139392, y: -269.276714932914 },
    },
    {
      id: '98ed7aafc170afd7',
      name: 'AttributeNormal',
      outputs: {
        out1: { id: 'f3d178ce68ad84fd', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -339.0095460614389, y: -697.6474907401467 },
    },
    {
      id: '5e2f38a694031ca9',
      name: 'NormalMatrix',
      outputs: {
        out1: { id: 'dd6b1133a10a7e08', label: 'Matrix3 Out', socket: { name: 'Matrix3' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: -342.18156698267705, y: -883.921684839063 },
    },
    {
      id: 'c1e693156311e821',
      name: 'MultiplyMatrix3xVector3',
      outputs: {
        out1: { id: '3309080966701d0d', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: {
        in1: { id: '28b7576ff0245218', label: 'In1 Matrix3', socket: { name: 'Matrix3' } },
        in2: { id: 'ac75ae71daf12dc3', label: 'In2 Vector3', socket: { name: 'Vector3' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: 'c94aeacba721132b', value: 'Neutral' },
      },
      position: { x: -54.79161018375538, y: -934.0055860514095 },
    },
    {
      id: '91a6bc62ba0c4d71',
      name: 'ConstantVector3',
      outputs: {
        out1: { id: '24436800fa0f0a72', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: {},
      controls: {
        shaderStage: null,
        in1: {
          __type: 'ClassicPreset.InputControl',
          id: '1beaca3613278020',
          type: 'number',
          value: 0,
        },
        in2: {
          __type: 'ClassicPreset.InputControl',
          id: 'fd40aebf22e078a6',
          type: 'number',
          value: 1,
        },
        in3: {
          __type: 'ClassicPreset.InputControl',
          id: 'cfe8f40fc0e2f70e',
          type: 'number',
          value: 0,
        },
      },
      position: { x: -13.293489040702468, y: -728.6395873262925 },
    },
    {
      id: 'f7560822881bef74',
      name: 'NormalizeVector3',
      outputs: {
        out1: { id: 'ab5c0743bd60f239', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: { in1: { id: '2181fdd1aca432a7', label: 'Vector3', socket: { name: 'Vector3' } } },
      controls: {
        shaderStage: {
          __type: 'ShaderStageMenuControl',
          id: '21288782c3e4e4a5',
          value: 'Fragment',
        },
      },
      position: { x: 329.17097102602816, y: -962.4642643260265 },
    },
    {
      id: 'c2b3148b6235aeac',
      name: 'NormalizeVector3',
      outputs: {
        out1: { id: '42075874f6171f04', label: 'Vector3 Out', socket: { name: 'Vector3' } },
      },
      inputs: { in1: { id: 'e628a0496330b5ca', label: 'Vector3', socket: { name: 'Vector3' } } },
      controls: {
        shaderStage: {
          __type: 'ShaderStageMenuControl',
          id: 'c3eb3bc9188e51e1',
          value: 'Fragment',
        },
      },
      position: { x: 363.73616591315306, y: -763.983700621454 },
    },
    {
      id: 'b82a4e6b27e5b8cc',
      name: 'DotProductVector3',
      outputs: {
        out1: { id: '2f095d60499fcf28', label: 'Scalar Out', socket: { name: 'Scalar' } },
      },
      inputs: {
        in1: { id: '36dcb2792d3fa26b', label: 'In1 Vector3', socket: { name: 'Vector3' } },
        in2: { id: 'c96dd0bc4f62681a', label: 'In2 Vector3', socket: { name: 'Vector3' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '9fa4547fb9c6c5a4', value: 'Neutral' },
      },
      position: { x: 665.8957415470143, y: -924.2530683800071 },
    },
    {
      id: 'd5a68e689f969b23',
      name: 'ScalarToVector4',
      outputs: {
        out1: { id: 'a21d3fcd833014da', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '2b615121dc4b21a3', label: 'In X Scalar', socket: { name: 'Scalar' } },
        in2: { id: 'c3c16c53e5831bd0', label: 'In Y Scalar', socket: { name: 'Scalar' } },
        in3: { id: '119b01be99932c50', label: 'In Z Scalar', socket: { name: 'Scalar' } },
        in4: { id: 'acff6d67c7d66a13', label: 'In W Scalar', socket: { name: 'Scalar' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: 'e4f64f9aae954a68', value: 'Neutral' },
      },
      position: { x: 990.1688660274731, y: -950.0236667735564 },
    },
    {
      id: '759089f66bc47e18',
      name: 'ConstantScalar',
      outputs: {
        out1: { id: 'b387fe014c92081e', label: 'Scalar Out', socket: { name: 'Scalar' } },
      },
      inputs: {},
      controls: {
        shaderStage: null,
        in1: {
          __type: 'ClassicPreset.InputControl',
          id: 'a646a6130720dd58',
          type: 'number',
          value: 1,
        },
      },
      position: { x: 682.3082705560678, y: -672.2922982342877 },
    },
    {
      id: '26068084297996fe',
      name: 'AttributeColor',
      outputs: {
        out1: { id: '1f892eb4476376e9', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {},
      controls: { shaderStage: null },
      position: { x: 816.8859624463282, y: -182.1840476274047 },
    },
    {
      id: '5bb83f65beaf1b70',
      name: 'AddVector4',
      outputs: {
        out1: { id: 'aa1e6695ab19f883', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: 'c5b5ec4d91b7e0d0', label: 'In1 Vector4', socket: { name: 'Vector4' } },
        in2: { id: '52f1633377923032', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: {
          __type: 'ShaderStageMenuControl',
          id: 'ca60d38f307c55ca',
          value: 'Fragment',
        },
      },
      position: { x: 1077.30214391325, y: -275.58101864624234 },
    },
    {
      id: '614996df85db4882',
      name: 'ConstantVector4',
      outputs: {
        out1: { id: 'd61595d7e54f92ac', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {},
      controls: {
        shaderStage: null,
        in1: {
          __type: 'ClassicPreset.InputControl',
          id: '2728414cd3883c42',
          type: 'number',
          value: 1,
        },
        in2: {
          __type: 'ClassicPreset.InputControl',
          id: '5311769b5beb41ed',
          type: 'number',
          value: 0,
        },
        in3: {
          __type: 'ClassicPreset.InputControl',
          id: 'aa4daa9339d1cc7e',
          type: 'number',
          value: 0,
        },
        in4: {
          __type: 'ClassicPreset.InputControl',
          id: '58399424f3d5cb7d',
          type: 'number',
          value: 1,
        },
      },
      position: { x: 865.7920518329588, y: 3.327880686994831 },
    },
    {
      id: '2f63cd85d5eefd0f',
      name: 'AddVector4',
      outputs: {
        out1: { id: '993eb8f02d41ebda', label: 'Vector4 Out', socket: { name: 'Vector4' } },
      },
      inputs: {
        in1: { id: '9a6a91309693335e', label: 'In1 Vector4', socket: { name: 'Vector4' } },
        in2: { id: '13112f1fbe9386f6', label: 'In2 Vector4', socket: { name: 'Vector4' } },
      },
      controls: {
        shaderStage: { __type: 'ShaderStageMenuControl', id: '2b543c362d4eb1a8', value: 'Neutral' },
      },
      position: { x: 1429.4620555699016, y: -594.2675802237532 },
    },
  ],
  connections: [
    {
      id: '253f19068bd6dd3e',
      from: { id: 'edb30b16c226c1df', portName: 'out1' },
      to: { id: '8af3ef7e85e9635b', portName: 'in1' },
    },
    {
      id: 'cfb5902777dc881e',
      from: { id: 'bf222f4a1ac9eec0', portName: 'out1' },
      to: { id: '8af3ef7e85e9635b', portName: 'in2' },
    },
    {
      id: '524f7c5cd75726f4',
      from: { id: '89e6ae4ae6f8b0a5', portName: 'out1' },
      to: { id: 'b211b8af7548a018', portName: 'in1' },
    },
    {
      id: '4afae3c3eba708a9',
      from: { id: '8af3ef7e85e9635b', portName: 'out1' },
      to: { id: 'b211b8af7548a018', portName: 'in2' },
    },
    {
      id: '3cceefae283c0391',
      from: { id: 'b9aaab2046df297f', portName: 'out1' },
      to: { id: 'ebc1c3e22f22c925', portName: 'in1' },
    },
    {
      id: '43e285f506264a5c',
      from: { id: 'b211b8af7548a018', portName: 'out1' },
      to: { id: 'ebc1c3e22f22c925', portName: 'in2' },
    },
    {
      id: '755da9e61082adac',
      from: { id: 'ebc1c3e22f22c925', portName: 'out1' },
      to: { id: '44a4b1e69714581b', portName: 'in1' },
    },
    {
      id: '5fcfafac2592f94d',
      from: { id: '98ed7aafc170afd7', portName: 'out1' },
      to: { id: 'c1e693156311e821', portName: 'in2' },
    },
    {
      id: '3567031398090bf9',
      from: { id: '5e2f38a694031ca9', portName: 'out1' },
      to: { id: 'c1e693156311e821', portName: 'in1' },
    },
    {
      id: 'e263f4a4dae55d2a',
      from: { id: 'c1e693156311e821', portName: 'out1' },
      to: { id: 'f7560822881bef74', portName: 'in1' },
    },
    {
      id: '7acd0768a567e5e9',
      from: { id: '91a6bc62ba0c4d71', portName: 'out1' },
      to: { id: 'c2b3148b6235aeac', portName: 'in1' },
    },
    {
      id: 'd1f55177c5f14f71',
      from: { id: 'f7560822881bef74', portName: 'out1' },
      to: { id: 'b82a4e6b27e5b8cc', portName: 'in1' },
    },
    {
      id: 'f0cbe0431e046cf5',
      from: { id: 'c2b3148b6235aeac', portName: 'out1' },
      to: { id: 'b82a4e6b27e5b8cc', portName: 'in2' },
    },
    {
      id: 'e1824e47cad4658f',
      from: { id: 'b82a4e6b27e5b8cc', portName: 'out1' },
      to: { id: 'd5a68e689f969b23', portName: 'in1' },
    },
    {
      id: '16117c4c7c711e8d',
      from: { id: 'b82a4e6b27e5b8cc', portName: 'out1' },
      to: { id: 'd5a68e689f969b23', portName: 'in2' },
    },
    {
      id: 'ef56e9895a041db6',
      from: { id: 'b82a4e6b27e5b8cc', portName: 'out1' },
      to: { id: 'd5a68e689f969b23', portName: 'in3' },
    },
    {
      id: '297f55b8ad71d8ed',
      from: { id: '759089f66bc47e18', portName: 'out1' },
      to: { id: 'd5a68e689f969b23', portName: 'in4' },
    },
    {
      id: '2cf4bac04ae88136',
      from: { id: '26068084297996fe', portName: 'out1' },
      to: { id: '5bb83f65beaf1b70', portName: 'in1' },
    },
    {
      id: 'ce749c3b0563b2be',
      from: { id: '614996df85db4882', portName: 'out1' },
      to: { id: '5bb83f65beaf1b70', portName: 'in2' },
    },
    {
      id: 'c0d1141a40c48eb2',
      from: { id: 'd5a68e689f969b23', portName: 'out1' },
      to: { id: '2f63cd85d5eefd0f', portName: 'in1' },
    },
    {
      id: 'a618ade331b63bbf',
      from: { id: '5bb83f65beaf1b70', portName: 'out1' },
      to: { id: '2f63cd85d5eefd0f', portName: 'in2' },
    },
    {
      id: '391122cd3b009d56',
      from: { id: '2f63cd85d5eefd0f', portName: 'out1' },
      to: { id: '85a5e8502ae3dd16', portName: 'in1' },
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
