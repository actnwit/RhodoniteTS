import { type ProcessApproachEnum } from '../foundation/definitions/ProcessApproach';
import type { Engine } from '../foundation/system/Engine';
import type { WebGLStrategy } from './WebGLStrategy';
declare const getRenderingStrategy: (engine: Engine, processApproach: ProcessApproachEnum) => WebGLStrategy;
export default getRenderingStrategy;
