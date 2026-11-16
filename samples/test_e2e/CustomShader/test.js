import { doTests } from '../common/testFunc';

const modes = ['webgl2', 'webgpu'];

doTests('CustomShader', modes, 0.03);
