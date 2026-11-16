import { doTests } from '../common/testFunc';

const modes = ['webgl2', 'webgpu'];

doTests('IBLfromHDR', modes, 0.03);
