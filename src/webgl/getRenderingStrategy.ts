import { ProcessApproach, ProcessApproachEnum } from "../foundation/definitions/ProcessApproach";
import WebGLStrategyUBO from "./WebGLStrategyUBO";
import WebGLStrategyTransformFeedback from "./WebGLStrategyTransformFeedback";
import WebGLStrategyDataTexture from "./WebGLStrategyDataTexture";
import WebGLStrategy from "./WebGLStrategy";
import WebGLStrategyUniform from "./WebGLStrategyUniform";
import getThisModule from "./getThisModule";

const getRenderingStrategy = function (processApproach: ProcessApproachEnum): WebGLStrategy {
  // Strategy
  const thisMod = getThisModule();
  if (processApproach.index === ProcessApproach.UBOWebGL2.index) {
    return thisMod.WebGLStrategyUBO.getInstance();
  } else if (processApproach.index === ProcessApproach.TransformFeedbackWebGL2.index) {
    return thisMod.WebGLStrategyTransformFeedback.getInstance();
  } else if (processApproach.index === ProcessApproach.UniformWebGL1.index) {
    return thisMod.WebGLStrategyUniform.getInstance();
  } else {
    return thisMod.WebGLStrategyDataTexture.getInstance();
  }
}

export default getRenderingStrategy;
