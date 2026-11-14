import { doTests } from '../common/testFunc';

const modes = ['uniform', 'datatexture', 'webgpu'];

doTests('MultiDraw', modes);
