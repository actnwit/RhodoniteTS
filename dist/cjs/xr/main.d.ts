import { WebXRSystem } from './WebXRSystem';
import { WebARSystem } from './WebARSystem';
declare const XR: Readonly<{
    WebXRSystem: typeof WebXRSystem;
    WebARSystem: typeof WebARSystem;
}>;
export default XR;
export declare type RnXR = typeof XR;