import { ModuleManager } from '../../system/ModuleManager';
import { MemoryManager } from '../../core/MemoryManager';
import { MaterialRepository } from './MaterialRepository';

test('MaterialTID are processed correctly', () => {
  ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  // 0st
  MaterialRepository.registerMaterial('MyMaterial0', undefined);
  const material0 = MaterialRepository.createMaterial('MyMaterial0')!;

  // 1st
  MaterialRepository.registerMaterial('MyMaterial1', undefined);
  const material1a = MaterialRepository.createMaterial('MyMaterial1')!;
  const material1b = MaterialRepository.createMaterial('MyMaterial1')!;

  expect(material1b.materialTID).toEqual(1);
});
