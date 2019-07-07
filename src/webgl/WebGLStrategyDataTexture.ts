import WebGLResourceRepository, { VertexHandles } from "./WebGLResourceRepository";
import { WebGLExtension } from "./WebGLExtension";
import MemoryManager from "../foundation/core/MemoryManager";
import Buffer from "../foundation/memory/Buffer";
import { MathUtil } from "../foundation/math/MathUtil";
import { PixelFormat } from "../foundation/definitions/PixelFormat";
import { ComponentType } from "../foundation/definitions/ComponentType";
import { TextureParameter } from "../foundation/definitions/TextureParameter";
import GLSLShader from "./shaders/GLSLShader";
import { BufferUse } from "../foundation/definitions/BufferUse";
import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent"
import Primitive from "../foundation/geometry/Primitive";
import WebGLContextWrapper from "./WebGLContextWrapper";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Matrix44 from "../foundation/math/Matrix44";
import { ShaderSemantics } from "../foundation/definitions/ShaderSemantics";
import ClassicShader from "./shaders/ClassicShader";
import Material from "../foundation/materials/Material";
import { CompositionType } from "../foundation/definitions/CompositionType";
import Component from "../foundation/core/Component";
import SceneGraphComponent from "../foundation/components/SceneGraphComponent";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import { ShaderType } from "../foundation/definitions/ShaderType";

export default class WebGLStrategyDataTexture implements WebGLStrategy {
  private static __instance: WebGLStrategyDataTexture;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  // private __shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __meshComponent?: MeshComponent;
  private __vertexHandles: Array<VertexHandles> = [];
  private static __vertexHandleOfPrimitiveObjectUids: Map<ObjectUID, VertexHandles> = new Map();
  private __isVAOSet = false;

  private constructor(){}

  get vertexShaderMethodDefinitions_dataTexture() {
    const _texture = ClassicShader.getInstance().glsl_texture;

    return `
  uniform sampler2D u_dataTexture;
  uniform mat4 u_viewMatrix;
  uniform mat4 u_projectionMatrix;
  uniform mat3 u_normalMatrix;

  /*
   * This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
   * arg = vec2(1. / size.x, 1. / size.x / size.y);
   */
  // vec4 fetchElement(sampler2D tex, float index, vec2 arg)
  // {
  //   return ${_texture}( tex, arg * (index + 0.5) );
  // }

  vec4 fetchElement(sampler2D tex, float index, vec2 invSize)
  {
    float t = (index + 0.5) * invSize.x;
    float x = fract(t);
    float y = (floor(t) + 0.5) * invSize.y;
    return ${_texture}( tex, vec2(x, y) );
  }

  mat4 getMatrix(float instanceId)
  {
    float index = ${Component.getLocationOffsetOfMemberOfComponent(SceneGraphComponent, 'worldMatrix')}.0 + 4.0 * instanceId;
    float powWidthVal = ${MemoryManager.bufferWidthLength}.0;
    float powHeightVal = ${MemoryManager.bufferHeightLength}.0;
    vec2 arg = vec2(1.0/powWidthVal, 1.0/powHeightVal);
  //  vec2 arg = vec2(1.0/powWidthVal, 1.0/powWidthVal/powHeightVal);

    vec4 col0 = fetchElement(u_dataTexture, index + 0.0, arg);
    vec4 col1 = fetchElement(u_dataTexture, index + 1.0, arg);
    vec4 col2 = fetchElement(u_dataTexture, index + 2.0, arg);

    mat4 matrix = mat4(
      col0.x, col1.x, col2.x, 0.0,
      col0.y, col1.y, col2.y, 0.0,
      col0.z, col1.z, col2.z, 0.0,
      col0.w, col1.w, col2.w, 1.0
      );

    return matrix;
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

  `;
    }

  setupShaderProgram(meshComponent: MeshComponent): void {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      const material = primitive.material;
      if (material) {
        if (material._shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
          return;
        }

        material.createProgram(this.vertexShaderMethodDefinitions_dataTexture);
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



  private __isLoaded(index: Index) {
    if (this.__vertexHandles[index] != null) {
      return true;
    } else {
      return false
    }
  }

  $load(meshComponent: MeshComponent) {
    if (this.__isLoaded(0)) {
      return;
    }
    this.__meshComponent = meshComponent;

    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    this.setupShaderProgram(meshComponent);

    const primitiveNum = meshComponent!.mesh.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent!.mesh.getPrimitiveAt(i);
      const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
      this.__vertexHandles[i] = vertexHandles;
      WebGLStrategyDataTexture.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUID, vertexHandles);

    }
  }

  $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: WebGLResourceHandle) {
    if (this.__isVAOSet) {
      return;
    }

    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
     // if (this.__isLoaded(i) && this.__isVAOSet) {
      this.__vertexHandles[i] = WebGLStrategyDataTexture.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUID)!;
        //this.__vertexShaderProgramHandles[i] = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
      //  continue;
     // }
      this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
    }
    this.__isVAOSet = true;
  }

  common_$prerender(): void {
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

    if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      if (isHalfFloatMode) {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferWidthLength, height: buffer.takenSizeInByte/MemoryManager.bufferWidthLength/4,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, halfFloatDataTextureBuffer!, {
            level: 0, width: MemoryManager.bufferWidthLength, height: buffer.takenSizeInByte/MemoryManager.bufferWidthLength/4,
              format: PixelFormat.RGBA, type: ComponentType.HalfFloat
            });
        }
      } else {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
            level:0, width: MemoryManager.bufferWidthLength, height: buffer.takenSizeInByte/MemoryManager.bufferWidthLength/4,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferWidthLength, height:buffer.takenSizeInByte/MemoryManager.bufferWidthLength/4,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        }
      }
      return;
    }

    if (isHalfFloatMode) {

      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA16F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      } else {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(halfFloatDataTextureBuffer!, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.HalfFloat, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      }

    } else {
      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      } else {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      }
    }

  };

  attachGPUData(primitive: Primitive): void {
    const material = primitive.material!;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__dataTextureUid)! as WebGLTexture;
    glw.bindTexture2D(0, dataTexture);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(material._shaderProgramUid);
    var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    gl.uniform1i(uniform_dataTexture, 0);
  };

  attatchShaderProgram(material: Material): void {
    const shaderProgramUid = material._shaderProgramUid;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
    gl.useProgram(shaderProgram);
  }

  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
    const vaoHandles = this.__vertexHandles[i];
    const vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle) as WebGLVertexArrayObjectOES;
    const gl = glw.getRawContext();

    if (vao != null) {
      glw.bindVertexArray(vao);
    }
    else {
      this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, instanceIDBufferUid);
      const ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle!);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
  }

  static getInstance() {
    if (!this.__instance) {
     this.__instance = new (WebGLStrategyDataTexture)();
    }

    return this.__instance;
  }

  common_$render(primitive: Primitive, viewMatrix: Matrix44, projectionMatrix: Matrix44) {
    const material = primitive.material!;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    this.attatchShaderProgram(material);
    const gl = glw.getRawContext();
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(material._shaderProgramUid) as WebGLProgram;

    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.ViewMatrix.str, true, viewMatrix);
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.ProjectionMatrix.str, true, projectionMatrix);

    return true;
  }

}

