import WebVRSystem from "./xr/WebVRSystem";

const XR = Object.freeze({
  WebVRSystem
});
export default XR;

if (typeof exports !== 'undefined') {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = XR;
}

export type RnXR = typeof XR;
(0, eval)('this').RnXR = XR;
