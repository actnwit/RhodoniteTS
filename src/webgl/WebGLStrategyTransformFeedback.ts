import WebGLResourceRepository, { VertexHandles } from "./WebGLResourceRepository";
import { WebGLExtension } from "./WebGLExtension";
import MemoryManager from "../foundation/core/MemoryManager";
import Buffer from "../foundation/memory/Buffer";
import { MathUtil } from "../foundation/math/MathUtil";
import { PixelFormat } from "../foundation/definitions/PixelFormat";
import { ComponentType } from "../foundation/definitions/ComponentType";
import { TextureParameter } from "../foundation/definitions/TextureParameter";
import GLSLShader from "./shaders/GLSLShader";
import Entity from "../foundation/core/Entity";
import EntityRepository from "../foundation/core/EntityRepository";
import { BufferUse } from "../foundation/definitions/BufferUse";
import MeshComponent from "../foundation/components/MeshComponent";
import WebGLStrategy from "./WebGLStrategy";
import Primitive from "../foundation/geometry/Primitive";
import WebGLContextWrapper from "./WebGLContextWrapper";
import { CompositionType } from "../foundation/definitions/CompositionType";
import { VertexAttribute } from "../foundation/definitions/VertexAttribute";
import { PrimitiveMode } from "../foundation/definitions/PrimitiveMode";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Matrix44 from "../foundation/math/Matrix44";
import { ShaderSemantics, ShaderSemanticsInfo } from "../foundation/definitions/ShaderSemantics";
import ClassicShaderader from "./shaders/ClassicShader";
import ClassicShader from "./shaders/ClassicShader";
import Material from "../foundation/materials/Material";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import { ShaderType } from "../foundation/definitions/ShaderType";

export default class WebGLStrategyTransformFeedback implements WebGLStrategy {
  private static __instance: WebGLStrategyTransformFeedback;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __instanceDataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __vertexDataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
//  private __shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __primitiveHeaderUboUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __indexCountToSubtractUboUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __entitiesUidUboUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __primitiveUidUboUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __isVertexReady: boolean = false;
  private __vertexHandle?: VertexHandles;

  private constructor(){}

  private get __transformFeedbackShaderText() {
    const _in = ClassicShader.getInstance().glsl_vertex_in;
    const _texture = ClassicShader.getInstance().glsl_texture;

    return `
    uniform mat4 u_worldMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;
    uniform mat3 u_normalMatrix;

    mat4 getMatrix(float instanceId) {
      return u_worldMatrix;
    }

    mat4 getViewMatrix(float instanceId) {
      return u_viewMatrix;
    }

    mat4 getProjectionMatrix(float instanceId) {
      return u_projectionMatrix;
    }

    mat3 getNormalMatrix(float instanceId) {
      return u_normalMatrix;
    }

    layout (std140) uniform indexCountsToSubtract {
      ivec4 counts[256];
    } u_indexCountsToSubtract;
    layout (std140) uniform entityUids {
      ivec4 ids[256];
    } u_entityData;
    layout (std140) uniform primitiveUids {
      ivec4 ids[256];
    } u_primitiveData;
    layout (std140) uniform primitiveHeader {
      ivec4 data[256];
    } u_primitiveHeader;

    out vec4 position;
    //out vec3 colors;

    uniform sampler2D u_instanceDataTexture;
    uniform sampler2D u_vertexDataTexture;

    // void main(){
    //   int indexOfVertices = gl_VertexID + 3*gl_InstanceID;

    //   int entityUidMinusOne = 0;
    //   int primitiveUid = 0;
    //   for (int i=0; i<=indexOfVertices; i++) {
    //     for (int j=0; j<1024; j++) {
    //       int value = u_indexCountsToSubtract.counts[j/4][j%4];
    //       int result = int(step(float(value), float(i)));
    //       if (result > 0) {
    //         entityUidMinusOne = result * int(u_entityData.ids[j/4][j%4]) - 1;
    //         primitiveUid = result * u_primitiveData.ids[j/4][j%4];
    //       } else {
    //         break;
    //       }
    //     }
    //   }

    //   ivec4 indicesMeta = u_primitiveHeader.data[9*primitiveUid + 0];
    //   int primIndicesByteOffset = indicesMeta.x;
    //   int primIndicesComponentSizeInByte = indicesMeta.y;
    //   int primIndicesLength = indicesMeta.z;

    //   int idx = gl_VertexID - primIndicesByteOffset / 4 /*byte*/;

    //   // get Indices
    //   int texelLength = ${MemoryManager.bufferWidthLength};
    //   vec4 indexVec4 = texelFetch(u_vertexDataTexture, ivec2(idx%texelLength, idx/texelLength), 0);
    //   int index = int(indexVec4[idx%4]);

    //   // get Positions
    //   ivec4 indicesData = u_primitiveHeader.data[9*primitiveUid + 1];
    //   int primPositionsByteOffset = indicesData.x;
    //   idx = primPositionsByteOffset/4 + index;
    //   vec4 posVec4 = texelFetch(u_vertexDataTexture, ivec2(idx%texelLength, idx/texelLength), 0);

    //   position = posVec4;
    //}
`
  }

  private get __transformFeedbackFragmentShaderText() {
    return `#version 300 es
precision highp float;

out vec4 outColor;

void main(){
    outColor = vec4(1.0);
}
    `
  }

  setupShaderProgram(meshComponent: MeshComponent): void {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent!.mesh.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent!.mesh.getPrimitiveAt(i);
      const material = primitive.material;
      if (material) {
        if (material._shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
          return;
        }

        // Shader Setup
        material.createProgram(this.__transformFeedbackShaderText, ShaderSemantics.getShaderProperty);


        this.__webglResourceRepository.setupUniformLocations(material._shaderProgramUid,
          [
            {semantic: ShaderSemantics.ViewMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
              stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true},
            {semantic: ShaderSemantics.ProjectionMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
              stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true}
          ]);
      }
    }
  }


  $load(meshComponent: MeshComponent) {
    if (this.__isVertexReady) {
      return;
    }

    this.setupShaderProgram(meshComponent);

    const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
    const indicesBufferView = buffer.takeBufferView({byteLengthToNeed: 4*3, byteStride: 4, isAoS:false});
    const indicesAccessor = indicesBufferView.takeAccessor({compositionType: CompositionType.Scalar, componentType: ComponentType.UnsingedInt, count: 3});
    const attributeBufferView = buffer.takeBufferView({byteLengthToNeed: 16*3, byteStride: 16, isAoS:false});
    const attributeAccessor = attributeBufferView.takeAccessor({compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: 3});

    const indicesUint16Array = indicesAccessor.getTypedArray() as Uint16Array;
    indicesUint16Array[0] = 0;
    indicesUint16Array[1] = 1;
    indicesUint16Array[2] = 2;

    const primitive = Primitive.createPrimitive({
      indices: indicesUint16Array,
      attributeCompositionTypes: [attributeAccessor.compositionType],
      attributeSemantics: [VertexAttribute.Position],
      attributes: [attributeAccessor.getTypedArray()],
      primitiveMode: PrimitiveMode.Triangles,
      material: void 0
    });

    this.__vertexHandle = this.__webglResourceRepository.createVertexDataResources(primitive);

    this.__isVertexReady = true;
  }

  $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: WebGLResourceHandle) {
  }

  private __setupUBOPrimitiveHeaderData() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBuffer(BufferUse.UBOGeneric);
    const floatDataTextureBuffer = new Int32Array(buffer.getArrayBuffer());

    if (this.__primitiveHeaderUboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
//      this.__webglResourceRepository.updateUniformBuffer(this.__primitiveHeaderUboUid, floatDataTextureBuffer);
      return;
    }

    this.__primitiveHeaderUboUid = this.__webglResourceRepository.createUniformBuffer(floatDataTextureBuffer);
    this.__webglResourceRepository.bindUniformBufferBase(3, this.__primitiveHeaderUboUid);
  }

  private __setupGPUInstanceMetaData() {
    if (this.__primitiveUidUboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }

    const entities = EntityRepository.getInstance()._getEntities();
    const entityIds = new Int32Array(entities.length);
    const primitiveIds = new Int32Array(entities.length);
    const indexCountToSubtract = new Int32Array(entities.length);
    let tmpSumIndexCount = 0;
    entities.forEach((entity:Entity, i)=>{
      const meshComponent = entity.getComponent(MeshComponent) as MeshComponent;
      if (meshComponent && meshComponent.mesh) {
        primitiveIds[i] = meshComponent.mesh.getPrimitiveAt(0)!.primitiveUid;
        entityIds[i] = entity.entityUID;
        const indexCountOfPrimitive = meshComponent.mesh.getPrimitiveAt(0)!.indicesAccessor!.elementCount;
        indexCountToSubtract[i] = tmpSumIndexCount + indexCountOfPrimitive;
        tmpSumIndexCount += indexCountOfPrimitive;
      }
    });

    this.__indexCountToSubtractUboUid = this.__webglResourceRepository.createUniformBuffer(indexCountToSubtract);
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
      let convertLength = buffer.takenSizeInByte / 4; //components
      for (let i=0; i<convertLength; i++) {
        halfFloatDataTextureBuffer[i] = MathUtil.toHalfFloat(floatDataTextureBuffer[i]);
      }
    }

    if (this.__instanceDataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      if (isHalfFloatMode) {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, halfFloatDataTextureBuffer!, {
            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
              format: PixelFormat.RGBA, type: ComponentType.HalfFloat
            });
        }
      } else {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, floatDataTextureBuffer, {
            level:0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        }
      }
      return;
    }

    if (isHalfFloatMode) {

      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA16F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      } else {
        this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(halfFloatDataTextureBuffer!, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.HalfFloat, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      }

    } else {
      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      } else {
        this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      }
    }
  }

  private __setupGPUVertexData() {
    if (this.__vertexDataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }

    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
    const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());

    if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
      this.__vertexDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
        level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
        });
    } else {
      this.__vertexDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
        level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
        });
    }
  }

  common_$prerender(): void {
    this.__setupUBOPrimitiveHeaderData();
    this.__setupGPUInstanceMetaData();
    this.__setupGPUInstanceData();
    this.__setupGPUVertexData();
  };

  attachGPUData(primitive: Primitive): void {
    const material = primitive.material!;
    {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__instanceDataTextureUid)! as WebGLTexture;
      glw.bindTexture2D(0, dataTexture);
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(material._shaderProgramUid);
      var uniform_instanceDataTexture = gl.getUniformLocation(shaderProgram, 'u_instanceDataTexture');
      gl.uniform1i(uniform_instanceDataTexture, 0);
    }

    {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__vertexDataTextureUid)! as WebGLTexture;
      glw.bindTexture2D(1, dataTexture);
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(material._shaderProgramUid);
      var uniform_vertexDataTexture = gl.getUniformLocation(shaderProgram, 'u_vertexDataTexture');
      gl.uniform1i(uniform_vertexDataTexture, 1);
    }

    this.__webglResourceRepository.bindUniformBlock(material._shaderProgramUid, 'indexCountsToSubtract', 0);
    this.__webglResourceRepository.bindUniformBlock(material._shaderProgramUid, 'entityUids', 1);
    this.__webglResourceRepository.bindUniformBlock(material._shaderProgramUid, 'primitiveUids', 2);
    this.__webglResourceRepository.bindUniformBlock(material._shaderProgramUid, 'primitiveHeader', 3);
  };

  attatchShaderProgram(material: Material): void {
    const shaderProgramUid = material._shaderProgramUid;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
    gl.useProgram(shaderProgram);
  }

  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
  }

  static getInstance() {
    if (!this.__instance) {
     this.__instance = new WebGLStrategyTransformFeedback();
    }

    return this.__instance;
  }

  common_$render(primitive: Primitive, viewMatrix: Matrix44, projectionMatrix: Matrix44) {
    const material = primitive.material!;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    this.attatchShaderProgram(primitive.material!);
    const gl = glw.getRawContext();
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(material._shaderProgramUid) as WebGLProgram;

    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.ViewMatrix.str, true, viewMatrix);
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.ProjectionMatrix.str, true, projectionMatrix);

    return true;
  }

}

