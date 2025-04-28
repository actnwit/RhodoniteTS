import { doTests } from '../common/testFunc';

const modes = ['uniform', 'datatexture', 'webgpu'];

doTests('AnimationBlending', modes, 0.01);
