import { WebARSystem } from './WebARSystem';
import { WebXRSystem } from './WebXRSystem';

const XR = Object.freeze({
  WebXRSystem,
  WebARSystem,
});
export default XR;

export type RnXR = typeof XR;
(globalThis as unknown as { RnXR: RnXR }).RnXR = XR;
