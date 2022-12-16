import { WebXRSystem } from './WebXRSystem';
import { WebARSystem } from './WebARSystem';

const XR = Object.freeze({
  WebXRSystem,
  WebARSystem,
});
export default XR;

export type RnXR = typeof XR;
(0, eval)('this').RnXR = XR;
