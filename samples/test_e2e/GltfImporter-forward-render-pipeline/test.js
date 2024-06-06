const doTests =
  require('../common/testFunc').doTests;

const modes = ['uniform', 'datatexture', 'webgpu'];

doTests('GltfImporter-forward-render-pipeline', modes, 0.03);
