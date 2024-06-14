import { ModuleManager } from '../../system/ModuleManager';
import { MemoryManager } from '../../core/MemoryManager';
import { OutPositionShaderNode } from './OutPositionShaderNode';
import { AttributePositionShaderNode } from './AttributePositionShaderNode';
import { ShaderGraphResolver } from '../core/ShaderGraphResolver';
import { MaterialRepository } from '../core/MaterialRepository';
import { CustomMaterialContent } from '../contents/CustomMaterialContent';

test.skip('AttributePosition works correctly 1', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const materialNode = new CustomMaterialContent({
    name: 'material test',
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    useTangentAttribute: false,
    useNormalTexture: true,
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
    noUseCameraTransform: false,
    additionalShaderSemanticInfo: [],
  });

  // Material.registerMaterial('MyMaterial', undefined);
  const material = MaterialRepository.createMaterial('MyMaterial', materialNode)!;

  const a_position = new AttributePositionShaderNode();

  const outPositionNode = new OutPositionShaderNode();
  outPositionNode.addInputConnection(
    a_position,
    a_position.getSocketOutput(),
    outPositionNode.getSocketInput()
  );

  // nodes are intentionally made the order random
  const retVal = ShaderGraphResolver.createVertexShaderCode(
    [outPositionNode, a_position],
    [],
    false
  );

  expect(retVal!.shaderBody.replace(/\s+/g, '')).toEqual(
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
