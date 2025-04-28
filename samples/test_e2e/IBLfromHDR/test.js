import { doTests } from '../common/testFunc';

const modes = ['datatexture', 'webgpu'];

doTests('IBLfromHDR', modes, 0.03);
