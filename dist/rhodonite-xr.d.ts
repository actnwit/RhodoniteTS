import WebVRSystem from "./xr/WebVRSystem";
declare const XR: Readonly<{
    WebVRSystem: typeof WebVRSystem;
}>;
export default XR;
export declare type RnXR = typeof XR;
