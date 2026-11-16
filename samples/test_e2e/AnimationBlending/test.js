import { doTests } from '../common/testFunc';

const modes = ['webgl2', 'webgpu'];

doTests('AnimationBlending', modes, 0.01);
