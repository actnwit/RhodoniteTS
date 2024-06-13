import { MemoryManager } from '../../core/MemoryManager';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { AddShaderNode } from './AddShaderNode';
import { OutPositionShaderNode } from './OutPositionShaderNode';
import { Vector4 } from '../../math/Vector4';
import { ShaderGraphResolver } from '../core/ShaderGraphResolver';
import { ModuleManager } from '../../system/ModuleManager';
import { ConstantVector4VariableShaderNode } from './ConstantVector4VariableShaderNode';

test('ConstantVariable works correctly 1', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const constant1 = new ConstantVector4VariableShaderNode(ComponentType.Float);
  constant1.setDefaultInputValue(Vector4.fromCopyArray([1, 2, 3, 4]));
  const constant2 = new ConstantVector4VariableShaderNode(ComponentType.Float);
  constant2.setDefaultInputValue(Vector4.fromCopyArray([4, 3, 2, 1]));

  const add = new AddShaderNode(CompositionType.Vec4, ComponentType.Float);
  add.addInputConnection(constant1, constant1.getSocketOutput(), add.getSocketInputLhs());
  add.addInputConnection(constant2, constant2.getSocketOutput(), add.getSocketInputRhs());

  const outPosition = new OutPositionShaderNode();
  outPosition.addInputConnection(add, add.getSocketOutput(), outPosition.getSocketInput());

  // nodes are intentionally made the order random
  const ret = ShaderGraphResolver.createVertexShaderCode(
    [constant1, constant2, add, outPosition],
    false
  );

  // console.log(ret.shaderBody, ret.shader);

  expect(ret!.shaderBody.replace(/\s+/g, '')).toEqual(
    `
        void ConstantVector4_1(
          out vec4 outValue) {
          outValue = vec4(4.0, 3.0, 2.0, 1.0);
        }

        void ConstantVector4_0(
          out vec4 outValue) {
          outValue = vec4(1.0, 2.0, 3.0, 4.0);
        }

    void add(in float lfs, in float rhs, out float outValue) {
      outValue = lfs + rhs;
    }
    void add(in int lfs, in int rhs, out int outValue) {
      outValue = lfs + rhs;
    }
    void add(in vec2 lfs, in vec2 rhs, out vec2 outValue) {
      outValue = lfs + rhs;
    }
    void add(in vec3 lfs, in vec3 rhs, out vec3 outValue) {
      outValue = lfs + rhs;
    }
    void add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
      outValue = lfs + rhs;
    }

        void outPosition(in vec4 inPosition) {
          gl_Position = inPosition;
        }

        void main() {
    vec4 outValue_0_to_2=vec4(0.0,0.0,0.0,0.0);
    vec4 outValue_1_to_2=vec4(0.0,0.0,0.0,0.0);
    vec4 outValue_2_to_3=vec4(0.0,0.0,0.0,0.0);
    ConstantVector4_1(outValue_1_to_2);
    ConstantVector4_0(outValue_0_to_2);
    add(outValue_0_to_2, outValue_1_to_2, outValue_2_to_3);
    outPosition(outValue_2_to_3);

        }
    `.replace(/\s+/g, '')
  );
});
