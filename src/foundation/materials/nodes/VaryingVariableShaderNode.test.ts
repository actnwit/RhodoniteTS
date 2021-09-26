import ModuleManager from '../../system/ModuleManager';
import MemoryManager from '../../core/MemoryManager';
import ConstantVariableShaderNode from './ConstantVariableShaderNode';
import VaryingInVariableShaderNode from './VaryingInVariableShaderNode';
import VaryingOutVariableShaderNode from './VaryingOutVariableShaderNode';
import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import OutPositionShaderNode from './OutPositionShaderNode';
import OutColorShaderNode from './OutColorShaderNode';
import Vector4 from '../../math/Vector4';
import ShaderGraphResolver from '../core/ShaderGraphResolver';

test('VaryingVariable works correctly 1', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  const varyingOut1 = new VaryingOutVariableShaderNode(
    CompositionType.Vec4,
    ComponentType.Float
  );
  varyingOut1.setVaryingVariableName('v_position');
  const varyingIn1 = new VaryingInVariableShaderNode(
    CompositionType.Vec4,
    ComponentType.Float
  );
  varyingIn1.setVaryingVariableName('v_position');
  const constant1 = new ConstantVariableShaderNode(
    CompositionType.Vec4,
    ComponentType.Float
  );
  constant1.setDefaultInputValue('value', Vector4.fromCopyArray([4, 3, 2, 1]));
  const outPositionNode = new OutPositionShaderNode();
  const outColorNode = new OutColorShaderNode();

  varyingOut1.addInputConnection(constant1, 'outValue', 'value');
  outPositionNode.addInputConnection(constant1, 'outValue', 'value');
  outColorNode.addInputConnection(varyingIn1, 'outValue', 'value');

  // nodes are intentionally made the order random
  const vertexRet = ShaderGraphResolver.createVertexShaderCode([
    outPositionNode,
    varyingOut1,
    constant1,
  ]);
  const pixelRet = ShaderGraphResolver.createPixelShaderCode([
    outColorNode,
    varyingIn1,
  ]);

  // console.log(vertexRet.shaderBody + pixelRet.shaderBody);
  expect(
    (vertexRet.shaderBody + pixelRet.shaderBody).replace(/\s+/g, '')
  ).toEqual(
    `

    void constantVariable_2(
      out vec4 outValue) {
      outValue = vec4(4.0, 3.0, 2.0, 1.0);
    }

    out vec4 v_position;
    void varyingOutVariable_0(
      in vec4 value) {
      v_position = value;
    }

    void outPosition(in vec4 inPosition) {
      gl_Position = inPosition;
    }

void main() {
#ifdef RN_IS_FASTEST_MODE
  float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = int(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.LightComponentTID} */]);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.SkeletalComponentTID} */];
  #endif

#else

  float materialSID = u_materialSID;

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0.0, 0);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = float(get_skinningMode(0.0, 0));
  #endif

#endif
vec4 outValue_2_to_0 = vec4(0.0, 0.0, 0.0, 0.0);
constantVariable_2(outValue_2_to_0);
varyingOutVariable_0(outValue_2_to_0);
outPosition(outValue_2_to_0);

}

    in vec4 v_position;
    void varyingInVariable_1(
      out vec4 outValue) {
      outValue = v_position;
    }

    void outColor(in vec4 inColor) {
      vec4 rt0 = inColor;
      gl_FragColor = rt0;

    }

void main() {
#ifdef RN_IS_FASTEST_MODE
  float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = int(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.LightComponentTID} */]);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.SkeletalComponentTID} */];
  #endif

#else

  float materialSID = u_materialSID;

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0.0, 0);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = float(get_skinningMode(0.0, 0));
  #endif

#endif
vec4 outValue_1_to_4 = vec4(0.0, 0.0, 0.0, 0.0);
varyingInVariable_1(outValue_1_to_4);
outColor(outValue_1_to_4);

}


    `.replace(/\s+/g, '')
  );
});
