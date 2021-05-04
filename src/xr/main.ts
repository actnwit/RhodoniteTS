import WebVRSystem from './WebVRSystem';
import WebXRSystem from './WebXRSystem';

const XR = Object.freeze({
  WebVRSystem,
  WebXRSystem,
});
export default XR;

export type RnXR = typeof XR;
(0, eval)('this').RnXR = XR;
