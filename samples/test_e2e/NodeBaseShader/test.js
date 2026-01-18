import { doTests } from '../common/testFunc';

const modes = ['uniform', 'datatexture', 'webgpu'];

doTests('NodeBaseShader', modes, 0.03);
