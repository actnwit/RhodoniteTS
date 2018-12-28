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
import SceneGraphComponent from "../../components/SceneGraphComponent";
import MeshRendererComponent from "../../components/MeshRendererComponent";

export const WebGLRenderingPipeline = new class implements RenderingPipeline {
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = 0;
  private __instanceIDBufferUid: CGAPIResourceHandle = 0;
  private __uboUid: CGAPIResourceHandle = 0;

  common_prerender(): CGAPIResourceHandle {
    const gl = this.__webglResourceRepository.currentWebGLContextWrapper;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext!');
    }

    if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
      this.__createUBO();
    } else {
      this.__createDataTexture();
    }

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

  private __createUBO() {
    const isHalfFloatMode = false;
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBufferForGPU();
    const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
    let halfFloatDataTextureBuffer: Uint16Array;
    if (isHalfFloatMode) {
      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        halfFloatDataTextureBuffer = new Uint16Array(floatDataTextureBuffer.length);
        let convertLength = buffer.byteSizeInUse / 4; //components
        convertLength /= 2; // bytes
        for (let i=0; i<convertLength; i++) {
          halfFloatDataTextureBuffer[i] = MathUtil.toHalfFloat(floatDataTextureBuffer[i]);
        }
      }
      if (this.__uboUid !== 0) {
        //this.__webglResourceRepository.deleteUniformBuffer(this.__uboUid);
        //this.__uboUid = 0;
        this.__webglResourceRepository.updateUniformBuffer(this.__uboUid, halfFloatDataTextureBuffer!);
        return;
      }

      this.__uboUid = this.__webglResourceRepository.createUniformBuffer(halfFloatDataTextureBuffer!);

    } else {
      if (this.__uboUid !== 0) {
        //this.__webglResourceRepository.deleteUniformBuffer(this.__uboUid);
        //this.__uboUid = 0;
        this.__webglResourceRepository.updateUniformBuffer(this.__uboUid, SceneGraphComponent.getWorldMatrixAccessor().dataViewOfBufferView);
        return;
      }

      this.__uboUid = this.__webglResourceRepository.createUniformBuffer(SceneGraphComponent.getWorldMatrixAccessor().dataViewOfBufferView);

    }
    this.__webglResourceRepository.bindUniformBufferBase(0, this.__uboUid);

  }

  private __createDataTexture() {
    const isHalfFloatMode = false;
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBufferForGPU();
    const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
    let halfFloatDataTextureBuffer: Uint16Array;
    if (isHalfFloatMode) {
      if (!this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        halfFloatDataTextureBuffer = new Uint16Array(floatDataTextureBuffer.length);
        let convertLength = buffer.byteSizeInUse / 4; //components
        convertLength /= 2; // bytes
        for (let i=0; i<convertLength; i++) {
          halfFloatDataTextureBuffer[i] = MathUtil.toHalfFloat(floatDataTextureBuffer[i]);
        }
      }
    }

    // if already
    if (this.__dataTextureUid !== 0) {
//      this.__webglResourceRepository.deleteTexture(this.__dataTextureUid);
//      this.__dataTextureUid = 0;
      if (isHalfFloatMode) {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, halfFloatDataTextureBuffer!, {
            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
              format: PixelFormat.RGBA, type: ComponentType.HalfFloat
            });
        }
      } else {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
            level:0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        }
      }
      return;
    }

    if (isHalfFloatMode) {

      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA16F, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
          });
      } else {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(halfFloatDataTextureBuffer!, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.HalfFloat, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
          });
      }

    } else {
      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
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

  }

  common_render(){
    const meshRendererComponents = this.__componentRepository.getComponentsWithType(MeshRendererComponent.componentTID)!;
    const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;

    const meshRendererComponent = meshRendererComponents[0] as MeshRendererComponent;
    const meshComponent = meshComponents[0] as MeshComponent;
    const primitiveNum = meshComponent.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.getPrimitiveAt(i);

      const shaderProgramHandle = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;//meshRendererComponent.__vertexShaderProgramHandles[i];
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramHandle)! as WebGLProgram;
      gl.useProgram(shaderProgram);

      const vaoHandles = meshRendererComponent.__vertexHandles[i];
      const vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
      if (vao != null) {
        glw.bindVertexArray(vao);
      } else {
        this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, this.__instanceIDBufferUid);
      }

      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__setUniformBuffer(gl, shaderProgramHandle)
      } else {
        this.__setDataTexture(gl, shaderProgram);
      }

      const ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle!);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;
      glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0, meshComponents.length);

    }

  }

  private __setUniformBuffer(gl: WebGLRenderingContext, shaderProgramUid: number) {
    this.__webglResourceRepository.bindUniformBlock(shaderProgramUid, 'matrix', 0);
  }

  private __setDataTexture(gl: WebGLRenderingContext, shaderProgram: WebGLProgram) {
    const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__dataTextureUid)! as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    gl.uniform1i(uniform_dataTexture, 0);
  }
}
