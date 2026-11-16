import { doTests } from '../common/testFunc';

const modes = ['webgl2', 'webgpu'];

doTests('NodeBaseShader', modes, 0.03);
