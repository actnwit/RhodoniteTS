import Rn from '../../../../dist/esm';

test('ConstantVariable works correctly 1', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  const constant1 = new Rn.ConstantVector4VariableShaderNode(Rn.ComponentType.Float);
  constant1.setDefaultInputValue(Rn.Vector4.fromCopyArray([1, 2, 3, 4]));
  const constant2 = new Rn.ConstantVector4VariableShaderNode(Rn.ComponentType.Float);
  constant2.setDefaultInputValue(Rn.Vector4.fromCopyArray([4, 3, 2, 1]));

  const add = new Rn.AddShaderNode(Rn.CompositionType.Vec4, Rn.ComponentType.Float);
  add.addInputConnection(constant1, constant1.getSocketOutput(), add.getSocketInputLhs());
  add.addInputConnection(constant2, constant2.getSocketOutput(), add.getSocketInputRhs());

  const outPosition = new Rn.OutPositionShaderNode();
  outPosition.addInputConnection(add, add.getSocketOutput(), outPosition.getSocketInput());

  // nodes are intentionally made the order random
  const commonShaderPart = new Rn.CommonShaderPart();
  const ret = Rn.ShaderGraphResolver.createVertexShaderCode(
    engine,
    [constant1, constant2, add, outPosition],
    [],
    commonShaderPart,
    false
  );

  // console.log(ret.shaderBody, ret.shader);

  expect(ret!.replace(/\s+/g, '')).toEqual(
    `
        void ConstantVector4_0(
          out vec4 outValue) {
          outValue = vec4(1.0, 2.0, 3.0, 4.0);
        }

        void ConstantVector4_1(
          out vec4 outValue) {
          outValue = vec4(4.0, 3.0, 2.0, 1.0);
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
    v_instanceIds=a_instanceIds;
    vec4 outValue_0_to_2 = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 outValue_1_to_2 = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 outValue_2_to_3 = vec4(0.0, 0.0, 0.0, 0.0);
    ConstantVector4_0(outValue_0_to_2);
    ConstantVector4_1(outValue_1_to_2);
    add(outValue_0_to_2, outValue_1_to_2, outValue_2_to_3);
    outPosition(outValue_2_to_3);
    }
    `.replace(/\s+/g, '')
  );
});
