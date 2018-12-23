import Primitive from "../geometry/Primitive";

export default interface RenderingPipeline {
  render(vaoHandle: CGAPIResourceHandle, shaderProgram: CGAPIResourceHandle, primitive: Primitive):void;
}
