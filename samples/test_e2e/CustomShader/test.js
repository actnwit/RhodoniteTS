import { doTests } from '../common/testFunc';
const modes = ['uniform', 'datatexture', 'webgpu'];

doTests('CustomShader', modes, 0.03);
