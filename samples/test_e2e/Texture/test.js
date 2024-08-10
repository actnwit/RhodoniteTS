const doTests =
  require('../common/testFunc').doTests;

const modes = ['datatexture', 'webgpu'];

doTests('Texture', modes, 0.03);
