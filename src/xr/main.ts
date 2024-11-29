import { WebXRSystem } from './WebXRSystem';
import { WebARSystem } from './WebARSystem';

const XR = Object.freeze({
  WebXRSystem,
  WebARSystem,
});
export default XR;

export type RnXR = typeof XR;
const globalObj =
  typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
(globalObj as unknown as { RnXR: RnXR }).RnXR = XR;
