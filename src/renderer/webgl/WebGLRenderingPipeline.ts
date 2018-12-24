import RenderingPipeline from "../RenderingPipeline";
import WebGLResourceRepository from "./WebGLResourceRepository";
import Primitive from "../../geometry/Primitive";
import { WebGLExtension } from "../../definitions/WebGLExtension";
import MemoryManager from "../../core/MemoryManager";
import Buffer from "../../memory/Buffer";
import { TextureParameter } from "../../definitions/TextureParameter";
import { PixelFormat } from "../../definitions/PixelFormat";
import { ComponentType } from "../../definitions/ComponentType";
import EntityRepository from "../../core/EntityRepository";
import { CompositionType } from "../../definitions/CompositionType";

export const WebGLRenderingPipeline = new class implements RenderingPipeline {
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = 0;
  private __instanceIDBufferUid: CGAPIResourceHandle = 0;

  common_prerender():CGAPIResourceHandle {
    const gl = this.__webglResourceRepository.currentWebGLContext;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext!');
    }

    if (this.__isReady()) {
      return 0;
    }

    this.__createDataTexture();

    this.__createInstanceIDBuffer();

    return this.__instanceIDBufferUid;
  }

  private __isReady() {
    if (this.__dataTextureUid !== 0) {
      return true;
    } else {
      return false;
    }
  }

  private __createInstanceIDBuffer() {
    const buffer = MemoryManager.getInstance().getBufferForCPU();
    const count = EntityRepository.getMaxEntityNumber();
    const bufferView = buffer.takeBufferView({byteLengthToNeed: 4/*byte*/ * count, byteStride: 0, isAoS: false});
    const accesseor = bufferView.takeAccessor({compositionType: CompositionType.Scalar, componentType: ComponentType.Float, count: count});

    for (var i = 0; i < count; i++) {
      accesseor.setScalar(i, i);
    }

    this.__instanceIDBufferUid = this.__webglResourceRepository.createVertexBuffer(accesseor);
  }

  private __createDataTexture() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBufferForGPU();
    this.__dataTextureUid = this.__webglResourceRepository.createTexture(new Float32Array(buffer.getArrayBuffer()), {
    level: 0, internalFormat: PixelFormat.RGBA, width: memoryManager.bufferLengthOfOneSide, height: memoryManager.bufferLengthOfOneSide,
      border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
      wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge
    });
  }

  render(vaoHandle: CGAPIResourceHandle, shaderProgramHandle: CGAPIResourceHandle, primitive: Primitive) {
    const gl = this.__webglResourceRepository.currentWebGLContext!;
    const ext = this.__webglResourceRepository.getExtension(WebGLExtension.InstancedArrays);

    const extVAO = this.__webglResourceRepository.getExtension(WebGLExtension.VertexArrayObject);
    const vao = this.__webglResourceRepository.getWebGLResource(vaoHandle);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramHandle);
    extVAO.bindVertexArrayOES(vao);
    gl.useProgram(shaderProgram!);

    ext.drawElementsInstancedANGLE(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0, 4);
  }

}
