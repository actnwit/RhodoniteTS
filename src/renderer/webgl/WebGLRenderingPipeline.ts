import RenderingPipeline from "../RenderingPipeline";
import WebGLResourceRepository from "./WebGLResourceRepository";
import Primitive from "../../geometry/Primitive";

export const WebGLRenderingPipeline = new class implements RenderingPipeline {
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();

  render(vaoHandle: CGAPIResourceHandle, shaderProgramHandle: CGAPIResourceHandle, primitive: Primitive) {
    const gl = this.__webglResourceRepository.currentWebGLContext;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext!');
    }

    const bindVertexArray = this.__webglResourceRepository.getVAOFunc('bindVertexArray');
    bindVertexArray(vaoHandle);
    gl.useProgram(shaderProgramHandle);
    gl.drawElements(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0);
  }

}
