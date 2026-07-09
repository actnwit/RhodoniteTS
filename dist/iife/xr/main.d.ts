import { WebARSystem } from './WebARSystem';
import { WebXRSystem } from './WebXRSystem';
declare const XR: Readonly<{
    WebXRSystem: typeof WebXRSystem;
    WebARSystem: typeof WebARSystem;
}>;
export default XR;
export type RnXR = typeof XR;
