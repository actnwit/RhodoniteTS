import WebGLResourceRepository from "./WebGLResourceRepository";
import { WebGLExtension } from "../../definitions/WebGLExtension";
import MemoryManager from "../../core/MemoryManager";
import Buffer from "../../memory/Buffer";
import { MathUtil } from "../../math/MathUtil";
import { PixelFormat } from "../../definitions/PixelFormat";
import { ComponentType } from "../../definitions/ComponentType";
import { TextureParameter } from "../../definitions/TextureParameter";
import GLSLShader from "./GLSLShader";
import Entity from "../../core/Entity";
import EntityRepository from "../../core/EntityRepository";
import { BufferUse } from "../../definitions/BufferUse";
import MeshComponent from "../../components/MeshComponent";

export default class WebGLStrategyTransformFeedback implements WebGLStrategy {
  private static __instance: WebGLStrategyTransformFeedback;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __instanceDataTextureUid: CGAPIResourceHandle = 0;
  private __vertexDataTextureUid: CGAPIResourceHandle = 0;
  private __shaderProgramUid: CGAPIResourceHandle = 0;
  private __primitiveHeaderUboUid: CGAPIResourceHandle = 0;
  private __indexCountToSubtractUboUid: CGAPIResourceHandle = 0;
  private __entitiesUidUboUid: CGAPIResourceHandle = 0;
  private __primitiveUidUboUid: CGAPIResourceHandle = 0;
  private constructor(){}

  private get __transformFeedbackShaderText() {
    const _in = GLSLShader.glsl_vertex_in;
    const _texture = GLSLShader.glsl_texture;

    return `#version 300 es

    layout (std140) uniform indexCountsToSubtract {
      int counts[1024];
    } u_indexCountsToSubtract;
    layout (std140) uniform entityUids {
      int ids[1024];
    } u_entityData;
    layout (std140) uniform primitiveUids {
      int ids[1024];
    } u_primitiveData;
    layout (std140) uniform primitiveHeader {
      vec4 data[1024];
    } u_primitiveHeader;

    out vec4 position;
    //out vec3 colors;

    uniform sampler2D u_instanceDataTexture;
    uniform sampler2D u_vertexDataTexture;

    void main(){
      int indexOfVertices = gl_VertexID + 3*gl_InstanceID;

      int entityUidMinusOne = 0;
      int primitiveUid = 0;
      for (int i=0; i<=indexOfVertices; i++) {
        for (int j=0; j<1024; j++) {
          int result = int(step(float(u_indexCountsToSubtract.counts[j]), float(i)));
          if (result > 0) {
            entityUidMinusOne = result * int(u_entityData.ids[j]) - 1;
            primitiveUid = result * u_primitiveData.ids[j];
          } else {
            break;
          }
        }
      }

      vec4 indicesMeta = u_primitiveHeader.data[9*primitiveUid + 0];
      int primIndicesByteOffset = int(indicesMeta.x);
      int primIndicesComponentSizeInByte = int(indicesMeta.y);
      int primIndicesLength = int(indicesMeta.z);

      int idx = gl_VertexID - primIndicesByteOffset / 4 /*byte*/;

      // get Indices
      int texelLength = ${MemoryManager.bufferLengthOfOneSide};
      vec4 indexVec4 = texelFetch(u_vertexDataTexture, ivec2(idx%texelLength, idx/texelLength), 0);
      int index = int(indexVec4[idx%4]);

      // get Positions
      vec4 indicesData = u_primitiveHeader.data[9*primitiveUid + 1];
      int primPositionsByteOffset = int(indicesData.x);
      idx = primPositionsByteOffset/4 + index;
      vec4 posVec4 = texelFetch(u_vertexDataTexture, ivec2(idx%texelLength, idx/texelLength), 0);
      
      position = posVec4;
    }
`
  }

  setupShaderProgram(): void {
    if (this.__shaderProgramUid !== 0) {
      return;
    }

    // Shader Setup
    let vertexShader = this.__transformFeedbackShaderText;
    let fragmentShader = GLSLShader.fragmentShader;
    this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram(
      vertexShader,
      fragmentShader,
      GLSLShader.attributeNames,
      GLSLShader.attributeSemantics
    );
  }

  private __setupUBOPrimitiveHeaderData() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBuffer(BufferUse.UBOGeneric);
    const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());

    if (this.__primitiveHeaderUboUid !== 0) {
//      this.__webglResourceRepository.updateUniformBuffer(this.__primitiveHeaderUboUid, floatDataTextureBuffer);
      return;
    }

    this.__primitiveHeaderUboUid = this.__webglResourceRepository.createUniformBuffer(floatDataTextureBuffer);
    this.__webglResourceRepository.bindUniformBufferBase(3, this.__primitiveHeaderUboUid);
  }

  private __setupGPUInstanceMetaData() {
    if (this.__primitiveUidUboUid !== 0) {
      return;
    }


    const entities = EntityRepository.getInstance()._getEntities();
    const entityIds = new Float32Array(entities.length);
    const primitiveIds = new Float32Array(entities.length);
    const indexCountToSubtract = new Float32Array(entities.length);
    let tmpSumIndexCount = 0;
    entities.forEach((entity:Entity, i)=>{
      const meshComponent = entity.getComponent(MeshComponent.componentTID) as MeshComponent;
      if (meshComponent) {
        primitiveIds[i] = meshComponent.getPrimitiveAt(0)!.primitiveUid;
        entityIds[i] = entity.entityUID;
        const indexCountOfPrimitive = meshComponent.getPrimitiveAt(0)!.indicesAccessor!.elementCount;
        indexCountToSubtract[i] = tmpSumIndexCount + indexCountOfPrimitive;
        tmpSumIndexCount += indexCountOfPrimitive
      }
    });

    this.__indexCountToSubtractUboUid = this.__webglResourceRepository.createUniformBuffer(entityIds);
    this.__webglResourceRepository.bindUniformBufferBase(0, this.__indexCountToSubtractUboUid);

    this.__entitiesUidUboUid = this.__webglResourceRepository.createUniformBuffer(entityIds);
    this.__webglResourceRepository.bindUniformBufferBase(1, this.__entitiesUidUboUid);

    this.__primitiveUidUboUid = this.__webglResourceRepository.createUniformBuffer(primitiveIds);
    this.__webglResourceRepository.bindUniformBufferBase(2, this.__primitiveUidUboUid);

  }

  private __setupGPUInstanceData() {
    let isHalfFloatMode = false;
    if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2 ||
      this.__webglResourceRepository.currentWebGLContextWrapper!.isSupportWebGL1Extension(WebGLExtension.TextureHalfFloat)) {
      isHalfFloatMode = true;
    }
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
    const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
    let halfFloatDataTextureBuffer: Uint16Array;
    if (isHalfFloatMode) {
      halfFloatDataTextureBuffer = new Uint16Array(floatDataTextureBuffer.length);
      let convertLength = buffer.byteSizeInUse / 4; //components
      convertLength /= 2; // bytes
      for (let i=0; i<convertLength; i++) {
        halfFloatDataTextureBuffer[i] = MathUtil.toHalfFloat(floatDataTextureBuffer[i]);
      }
    }

    if (this.__instanceDataTextureUid !== 0) {
      if (isHalfFloatMode) {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, halfFloatDataTextureBuffer!, {
            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
              format: PixelFormat.RGBA, type: ComponentType.HalfFloat
            });
        }
      } else {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, floatDataTextureBuffer, {
            level:0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        }
      }
      return;
    }

    if (isHalfFloatMode) {

      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA16F, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
          });
      } else {
        this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(halfFloatDataTextureBuffer!, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.HalfFloat, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
          });
      }

    } else {
      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
          });
      } else {
        this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
          });
      }
    }
  }

  private __setupGPUVertexData() {
    if (this.__vertexDataTextureUid !== 0) {
      return;
    }

    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
    const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());

    if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
      this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
        level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
        });
    } else {
      this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
        level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
        });
    }
  }

  setupGPUData(): void {
    this.__setupGPUInstanceData();
    this.__setupGPUVertexData();
  };

  attachGPUData(): void {
    {
      const gl = this.__webglResourceRepository.currentWebGLContextWrapper!.getRawContext();
      const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__instanceDataTextureUid)! as WebGLTexture;
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, dataTexture);
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
      var uniform_instanceDataTexture = gl.getUniformLocation(shaderProgram, 'u_instanceDataTexture');
      gl.uniform1i(uniform_instanceDataTexture, 0);
    }

    {
      const gl = this.__webglResourceRepository.currentWebGLContextWrapper!.getRawContext();
      const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__vertexDataTextureUid)! as WebGLTexture;
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, dataTexture);
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
      var uniform_vertexDataTexture = gl.getUniformLocation(shaderProgram, 'u_vertexDataTexture');
      gl.uniform1i(uniform_vertexDataTexture, 1);
    }

    this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'indexCountsToSubtract', 0);
    this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'entityUids', 1);
    this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'primitiveUids', 2);
    this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'primitiveHeader', 3);
  };

  attatchShaderProgram(): void {
    const shaderProgramUid = this.__shaderProgramUid;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
    gl.useProgram(shaderProgram);
  }

  static getInstance() {
    if (!this.__instance) {
     this.__instance = new WebGLStrategyTransformFeedback();
    }

    return this.__instance;
  }

}

