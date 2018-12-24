import Primitive from "../geometry/Primitive";

export default interface RenderingPipeline {
  common_prerender(): CGAPIResourceHandle;
  render(vaoHandle: CGAPIResourceHandle, shaderProgram: CGAPIResourceHandle, primitive: Primitive):void;
}
