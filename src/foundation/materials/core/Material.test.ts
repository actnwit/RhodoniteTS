import ModuleManager from '../../system/ModuleManager';
import MemoryManager from '../../core/MemoryManager';
import Material from './Material';

test('MaterialTID are processed correctly', () => {
  ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  // 0st
  Material.registerMaterial('MyMaterial0', []);
  const material0 = Material.createMaterial('MyMaterial0')!;

  // 1st
  Material.registerMaterial('MyMaterial1', []);
  const material1a = Material.createMaterial('MyMaterial1')!;
  const material1b = Material.createMaterial('MyMaterial1')!;

  expect(material1b.materialTID).toEqual(1);
});
