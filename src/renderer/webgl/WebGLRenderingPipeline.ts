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
import ComponentRepository from "../../core/ComponentRepository";
import MeshComponent from "../../components/MeshComponent";
import { MathUtil } from "../../math/MathUtil";

export const WebGLRenderingPipeline = new class implements RenderingPipeline {
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = 0;
  private __instanceIDBufferUid: CGAPIResourceHandle = 0;

  common_prerender(): CGAPIResourceHandle {
    const gl = this.__webglResourceRepository.currentWebGLContextWrapper;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext!');
    }

    this.__createDataTexture();

    if (this.__isReady()) {
      return 0;
    }

    this.__createInstanceIDBuffer();

    return this.__instanceIDBufferUid;
  }

  private __isReady() {
    if (this.__instanceIDBufferUid !== 0) {
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

    const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;
    for (var i = 0; i < meshComponents.length; i++) {
      accesseor.setScalar(i, meshComponents[i].entityUID);
    }

    this.__instanceIDBufferUid = this.__webglResourceRepository.createVertexBuffer(accesseor);
  }

  private __createDataTexture() {
    if (this.__dataTextureUid !== 0) {
      this.__webglResourceRepository.deleteTexture(this.__dataTextureUid);
      this.__dataTextureUid = 0;
    }
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBufferForGPU();
    const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());

    const isHalfFloatMode = true;
    if (isHalfFloatMode) {

      const halfFloatDateTextureBuffer = new Uint16Array(floatDataTextureBuffer.length);
      let convertLength = buffer.byteSizeInUse / 4; //components
      convertLength /= 2; // bytes
      for (let i=0; i<convertLength; i++) {
        halfFloatDateTextureBuffer[i] = MathUtil.toHalfFloat(floatDataTextureBuffer[i]);
      }

      this.__dataTextureUid = this.__webglResourceRepository.createTexture(halfFloatDateTextureBuffer, {
        level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.HalfFloat, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
        });

    } else {
      this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
      level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
      });
    }

  }

  render(vaoHandle: CGAPIResourceHandle, shaderProgramHandle: CGAPIResourceHandle, primitive: Primitive) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    const vao = this.__webglResourceRepository.getWebGLResource(vaoHandle);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramHandle)!;
    glw.bindVertexArray(vao!);
    gl.useProgram(shaderProgram);

    this.__setDataTexture(gl, shaderProgram);

    const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;
    glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0, meshComponents.length);
  }


  private __setDataTexture(gl: WebGLRenderingContext, shaderProgram: WebGLObject) {
    const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__dataTextureUid)!;
    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    gl.uniform1i(uniform_dataTexture, 0);
  }
}
