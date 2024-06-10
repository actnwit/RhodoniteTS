import { ModuleManager } from '../../system/ModuleManager';
import { MemoryManager } from '../../core/MemoryManager';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { ScalarToVector4ShaderNode } from './ScalarToVector4ShaderNode';
import { OutPositionShaderNode } from './OutPositionShaderNode';
import { Scalar } from '../../math/Scalar';
import { ShaderGraphResolver } from '../core/ShaderGraphResolver';

test.skip('ScalarToVector4 works correctly 1', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  // create ConstantVariable shader nodes
  const constant1 = new ConstantVariableShaderNode(CompositionType.Scalar, ComponentType.Float);
  constant1.setDefaultInputValue('value', Scalar.fromCopyNumber(1));
  const constant2 = new ConstantVariableShaderNode(CompositionType.Scalar, ComponentType.Float);
  constant2.setDefaultInputValue('value', Scalar.fromCopyNumber(2));
  const constant3 = new ConstantVariableShaderNode(CompositionType.Scalar, ComponentType.Float);
  constant3.setDefaultInputValue('value', Scalar.fromCopyNumber(3));
  const constant4 = new ConstantVariableShaderNode(CompositionType.Scalar, ComponentType.Float);
  constant4.setDefaultInputValue('value', Scalar.fromCopyNumber(4));

  // create ScalarToVector4 shader node
  const scalarToVector4MaterialNode = new ScalarToVector4ShaderNode();

  // connect ConstantVariable shader nodes to ScalarToVector4 shader node as inputs
  scalarToVector4MaterialNode.addInputConnection(constant1, 'outValue', 'x');
  scalarToVector4MaterialNode.addInputConnection(constant2, 'outValue', 'y');
  scalarToVector4MaterialNode.addInputConnection(constant3, 'outValue', 'z');
  scalarToVector4MaterialNode.addInputConnection(constant4, 'outValue', 'w');

  const endMaterialNode = new OutPositionShaderNode();
  endMaterialNode.addInputConnection(scalarToVector4MaterialNode, 'outValue', 'value');

  // nodes are intentionally made the order random to confirm the method sort them properly
  const retVal = ShaderGraphResolver.createVertexShaderCode([
    endMaterialNode,
    scalarToVector4MaterialNode,
    constant1,
    constant2,
    constant3,
    constant4,
  ]);

  // console.log(retVal.shaderBody);
  expect(retVal.shaderBody.replace(/\s+/g, '')).toEqual(
    `
        void constantVariable_3(
          out float outValue) {
          outValue = 4.0;
        }

        void constantVariable_2(
          out float outValue) {
          outValue = 3.0;
        }

        void constantVariable_1(
          out float outValue) {
          outValue = 2.0;
        }

        void constantVariable_0(
          out float outValue) {
          outValue = 1.0;
        }

    void scalarToVector4(in float x, in float y, in float z, in float w, out vec4 outValue) {
      outValue.x = x;
      outValue.y = y;
      outValue.z = z;
      outValue.w = w;
    }

        void outPosition(in vec4 inPosition) {
          gl_Position = inPosition;
        }

        void main() {
        #ifdef RN_IS_DATATEXTURE_MODE
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
    float outValue_0_to_4=0.0;
    float outValue_1_to_4=0.0;
    float outValue_2_to_4=0.0;
    float outValue_3_to_4=0.0;
    vec4 outValue_4_to_5=vec4(0.0,0.0,0.0,0.0);
    constantVariable_3(outValue_3_to_4);
    constantVariable_2(outValue_2_to_4);
    constantVariable_1(outValue_1_to_4);
    constantVariable_0(outValue_0_to_4);
    scalarToVector4(outValue_0_to_4, outValue_1_to_4, outValue_2_to_4, outValue_3_to_4, outValue_4_to_5);
    outPosition(outValue_4_to_5);

        }

    `.replace(/\s+/g, '')
  );
});
