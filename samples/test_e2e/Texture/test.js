import { doTests } from '../common/testFunc';

const modes = ['datatexture', 'webgpu'];

doTests('Texture', modes, 0.03);
