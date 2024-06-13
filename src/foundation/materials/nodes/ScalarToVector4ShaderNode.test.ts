import { ModuleManager } from '../../system/ModuleManager';
import { MemoryManager } from '../../core/MemoryManager';
import { ConstantScalarVariableShaderNode } from './ConstantScalarVariableShaderNode';
import { ComponentType } from '../../definitions/ComponentType';
import { ScalarToVector4ShaderNode } from './ScalarToVector4ShaderNode';
import { OutPositionShaderNode } from './OutPositionShaderNode';
import { Scalar } from '../../math/Scalar';
import { ShaderGraphResolver } from '../core/ShaderGraphResolver';
import { Socket } from '../core/Socket';

test('ScalarToVector4 works correctly 1', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  // create ConstantVariable shader nodes
  const constant1 = new ConstantScalarVariableShaderNode(ComponentType.Float);
  constant1.setDefaultInputValue(Scalar.fromCopyNumber(1));
  const constant2 = new ConstantScalarVariableShaderNode(ComponentType.Float);
  constant2.setDefaultInputValue(Scalar.fromCopyNumber(2));
  const constant3 = new ConstantScalarVariableShaderNode(ComponentType.Float);
  constant3.setDefaultInputValue(Scalar.fromCopyNumber(3));
  const constant4 = new ConstantScalarVariableShaderNode(ComponentType.Float);
  constant4.setDefaultInputValue(Scalar.fromCopyNumber(4));

  // create ScalarToVector4 shader node
  const scalarToVector4MaterialNode = new ScalarToVector4ShaderNode();

  // connect ConstantVariable shader nodes to ScalarToVector4 shader node as inputs
  scalarToVector4MaterialNode.addInputConnection(
    constant1,
    constant1.getSocketOutput(),
    scalarToVector4MaterialNode.getSocketX()
  );
  scalarToVector4MaterialNode.addInputConnection(
    constant2,
    constant2.getSocketOutput(),
    scalarToVector4MaterialNode.getSocketY()
  );
  scalarToVector4MaterialNode.addInputConnection(
    constant3,
    constant3.getSocketOutput(),
    scalarToVector4MaterialNode.getSocketZ()
  );
  scalarToVector4MaterialNode.addInputConnection(
    constant4,
    constant4.getSocketOutput(),
    scalarToVector4MaterialNode.getSocketW()
  );

  const endMaterialNode = new OutPositionShaderNode();
  endMaterialNode.addInputConnection(
    scalarToVector4MaterialNode,
    scalarToVector4MaterialNode.getSocketOutput(),
    endMaterialNode.getSocketInput()
  );

  // nodes are intentionally made the order random to confirm the method sort them properly
  const retVal = ShaderGraphResolver.createVertexShaderCode(
    [endMaterialNode, scalarToVector4MaterialNode, constant1, constant2, constant3, constant4],
    false
  );

  // console.log(retVal.shaderBody);
  expect(retVal!.shaderBody.replace(/\s+/g, '')).toEqual(
    `
        void ConstantScalar_3(
          out float outValue) {
          outValue = 4.0;
        }

        void ConstantScalar_2(
          out float outValue) {
          outValue = 3.0;
        }

        void ConstantScalar_1(
          out float outValue) {
          outValue = 2.0;
        }

        void ConstantScalar_0(
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
    float outValue_0_to_4=0.0;
    float outValue_1_to_4=0.0;
    float outValue_2_to_4=0.0;
    float outValue_3_to_4=0.0;
    vec4 outValue_4_to_5=vec4(0.0,0.0,0.0,0.0);
    ConstantScalar_3(outValue_3_to_4);
    ConstantScalar_2(outValue_2_to_4);
    ConstantScalar_1(outValue_1_to_4);
    ConstantScalar_0(outValue_0_to_4);
    scalarToVector4(outValue_0_to_4, outValue_1_to_4, outValue_2_to_4, outValue_3_to_4, outValue_4_to_5);
    outPosition(outValue_4_to_5);

        }

    `.replace(/\s+/g, '')
  );
});
