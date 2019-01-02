import { ProcessApproach, ProcessApproachEnum } from "../../definitions/ProcessApproach";
import WebGLStrategyUBO from "./WebGLStrategyUBO";
import WebGLStrategyTransformFeedback from "./WebGLStrategyTransformFeedback";
import WebGLStrategyDataTexture from "./WebGLStrategyDataTexture";
import WebGLStrategy from "./WebGLStrategy";

const getRenderingStrategy = function (processApproach: ProcessApproachEnum): WebGLStrategy {
  // Strategy
  if (processApproach === ProcessApproach.UBOWebGL2) {
    return WebGLStrategyUBO.getInstance();
  } else if (processApproach === ProcessApproach.TransformFeedbackWebGL2) {
    return WebGLStrategyTransformFeedback.getInstance();
  } else {
    return WebGLStrategyDataTexture.getInstance();
  }
}

export default getRenderingStrategy;
