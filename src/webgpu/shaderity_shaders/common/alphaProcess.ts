import type { ShaderityObject } from 'shaderity';
import alphaProcess_wgsl from './alphaProcess.wgsl';

const alphaProcessWgsl = alphaProcess_wgsl as ShaderityObject;
export { alphaProcessWgsl };
