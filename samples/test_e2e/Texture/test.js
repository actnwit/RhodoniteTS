import { doTests } from '../common/testFunc';

const modes = ['webgl2', 'webgpu'];

doTests('Texture', modes, 0.03);
