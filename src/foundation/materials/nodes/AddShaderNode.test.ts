import Rn from '../../../../dist/esm/';

test.skip('AttributePosition works correctly 1', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  const materialNode = new Rn.CustomMaterialContent(engine, {
    name: 'material test',
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: {
      code: '',
      shaderStage: 'vertex',
      isFragmentShader: false,
    },
    pixelShader: {
      code: '',
      shaderStage: 'fragment',
      isFragmentShader: true,
    },
    additionalShaderSemanticInfo: [],
  });

  // Material.registerMaterial('MyMaterial', undefined);
  const _material = engine.materialRepository.createMaterial(engine, 'MyMaterial', materialNode)!;

  const a_position = new Rn.AttributePositionShaderNode();

  const outPositionNode = new Rn.OutPositionShaderNode();
  outPositionNode.addInputConnection(a_position, a_position.getSocketOutput(), outPositionNode.getSocketInput());

  // nodes are intentionally made the order random
  const commonShaderPart = new Rn.CommonShaderPart();
  const retVal = Rn.ShaderGraphResolver.createVertexShaderCode(
    engine,
    [outPositionNode, a_position],
    [],
    commonShaderPart,
    false
  );

  expect(retVal!.replace(/\s+/g, '')).toEqual(
    `

    in vec4 a_position;

    void attributePosition(out vec4 outValue) {
      outValue = a_position;
    }

        void outPosition(in vec4 inPosition) {
          gl_Position = inPosition;
        }

        void main() {
    vec4 outValue_0_to_1=vec4(0.0,0.0,0.0,0.0);
    attributePosition(outValue_0_to_1);
    outPosition(outValue_0_to_1);

        }

`.replace(/\s+/g, '')
  );
});
