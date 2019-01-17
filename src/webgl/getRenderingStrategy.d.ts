import { ProcessApproachEnum } from "../foundation/definitions/ProcessApproach";
import WebGLStrategy from "./WebGLStrategy";
declare const getRenderingStrategy: (processApproach: ProcessApproachEnum) => WebGLStrategy;
export default getRenderingStrategy;
