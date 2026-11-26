import { doTests } from '../common/testFunc';

const modes = ['webgl2', 'webgpu'];

doTests('TemporalAADeformation', modes, 0.03);
