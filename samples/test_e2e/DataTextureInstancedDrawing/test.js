const doTests =
  require('../common/testFunc').doTests;

const modes = ['uniform', 'datatexture', 'webgpu'];

doTests('DataTextureInstancedDrawing', modes);
