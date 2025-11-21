import { MemoryManager } from '../../core/MemoryManager';
import { ModuleManager } from '../../system/ModuleManager';
import { CustomMaterialContent } from '../contents/CustomMaterialContent';
import { MaterialRepository } from './MaterialRepository';

test('MaterialTID are processed correctly', () => {
  ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated(1024 * 1024 * 4 /* rgba */ * 4 /* byte */);

  const materialNode = new CustomMaterialContent({
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

  // 0st
  MaterialRepository.registerMaterial('MyMaterial0', materialNode);
  const _material0 = MaterialRepository.createMaterial('MyMaterial0', materialNode)!;

  // 1st
  MaterialRepository.registerMaterial('MyMaterial1', materialNode);
  const _material1a = MaterialRepository.createMaterial('MyMaterial1', materialNode)!;
  const material1b = MaterialRepository.createMaterial('MyMaterial1', materialNode)!;

  expect(material1b.materialTID).toEqual(1);
});
