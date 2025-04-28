import { doTests } from '../common/testFunc';

const modes = ['uniform', 'datatexture', 'webgpu'];

doTests('DataTextureInstancedDrawing', modes);
