const doGltfTests =
  require('../common/testFunc').doGltfTests;

const modes = ['uniform', 'datatexture', 'webgpu'];
const gltfInfo = [
  {name: 'IridescentDishWithOlives', format: 'glb'},
  {name: 'ABeautifulGame', format: 'gltf'},
  {name: 'AlphaBlendModeTest', format: 'glb'},
  {name: 'AnimatedMorphCube', format: 'glb'},
  {name: 'AnisotropyBarnLamp', format: 'glb'},
  {name: 'AnisotropyDiscTest', format: 'glb'},
];

doGltfTests('GltfImporter-forward-render-pipeline', modes, gltfInfo, 0.03);
