const doTests =
  require('../common/testFunc').doTests;

const modes = ['uniform', 'datatexture', 'webgpu'];

doTests('AnimationBlending', modes, 0.01);
