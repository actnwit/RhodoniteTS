import { ModuleManager } from '../../system/ModuleManager';
import { MemoryManager } from '../../core/MemoryManager';
import { MaterialRepository } from './MaterialRepository';
import { CustomMaterialContent } from '../contents/CustomMaterialContent';

test('MaterialTID are processed correctly', () => {
  ModuleManager.getInstance().loadModule('webgl');
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

  // 0st
  MaterialRepository.registerMaterial('MyMaterial0', materialNode);
  const material0 = MaterialRepository.createMaterial('MyMaterial0', materialNode)!;

  // 1st
  MaterialRepository.registerMaterial('MyMaterial1', materialNode);
  const material1a = MaterialRepository.createMaterial('MyMaterial1', materialNode)!;
  const material1b = MaterialRepository.createMaterial('MyMaterial1', materialNode)!;

  expect(material1b.materialTID).toEqual(1);
});
