const doGltfTests =
  require('../common/testFunc').doGltfTests;

const modes = ['uniform', 'datatexture', 'webgpu'];
const gltfInfo = [
  {name: 'AnimatedMorphCube', format: 'glb'},
  {name: 'AnisotropyBarnLamp', format: 'glb'},
  {name: 'AnisotropyDiscTest', format: 'glb'},
];

doGltfTests('GltfImporter-forward-render-pipeline', modes, gltfInfo, 0.03);
