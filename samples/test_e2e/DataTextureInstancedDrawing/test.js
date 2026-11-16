import { doTests } from '../common/testFunc';

const modes = ['webgl2', 'webgpu'];

doTests('DataTextureInstancedDrawing', modes);
