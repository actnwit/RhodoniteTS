const doTests =
  require('../common/testFunc').doTests;

const modes = ['datatexture', 'webgpu'];

doTests('IBLfromHDR', modes, 0.03);
