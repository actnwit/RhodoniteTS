import Rn from '../../..';

test('MaterialTID are processed correctly', () => {

  Rn.ModuleManager.getInstance().loadModule('webgl');
  Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  // 0st
  Rn.Material.registerMaterial('MyMaterial0', []);
  const material0 = Rn.Material.createMaterial('MyMaterial0')!;

  // 1st
  Rn.Material.registerMaterial('MyMaterial1', []);
  const material1a = Rn.Material.createMaterial('MyMaterial1')!;
  const material1b = Rn.Material.createMaterial('MyMaterial1')!;

  expect(material1b.materialTID).toEqual(1);

});
