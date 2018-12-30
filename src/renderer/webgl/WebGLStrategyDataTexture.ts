import WebGLResourceRepository from "./WebGLResourceRepository";
import { WebGLExtension } from "../../definitions/WebGLExtension";
import MemoryManager from "../../core/MemoryManager";
import Buffer from "../../memory/Buffer";
import { MathUtil } from "../../math/MathUtil";
import { PixelFormat } from "../../definitions/PixelFormat";
import { ComponentType } from "../../definitions/ComponentType";
import { TextureParameter } from "../../definitions/TextureParameter";
import GLSLShader from "./GLSLShader";
import { BufferUse } from "../../definitions/BufferUse";

export default class WebGLStrategyDataTexture implements WebGLStrategy {
  private static __instance: WebGLStrategyDataTexture;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = 0;
  private __shaderProgramUid: CGAPIResourceHandle = 0;
  private constructor(){}

  get vertexShaderMethodDefinitions_dataTexture() {
    const _texture = GLSLShader.glsl_texture;

    return `
  uniform sampler2D u_dataTexture;
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
    float index = instanceId - 1.0;
    float powVal = ${MemoryManager.bufferLengthOfOneSide}.0;
    vec2 arg = vec2(1.0/powVal, 1.0/powVal);
  //  vec2 arg = vec2(1.0/powVal, 1.0/powVal/powVal);

    vec4 col0 = fetchElement(u_dataTexture, index * 4.0 + 0.0, arg);
   vec4 col1 = fetchElement(u_dataTexture, index * 4.0 + 1.0, arg);
   vec4 col2 = fetchElement(u_dataTexture, index * 4.0 + 2.0, arg);

    mat4 matrix = mat4(
      col0.x, col1.x, col2.x, 0.0,
      col0.y, col1.y, col2.y, 0.0,
      col0.z, col1.z, col2.z, 0.0,
      col0.w, col1.w, col2.w, 1.0
      );

    return matrix;
  }
  `;
    }

  setupShaderProgram(): void {
    if (this.__shaderProgramUid !== 0) {
      return;
    }

    // Shader Setup
    let vertexShader = GLSLShader.vertexShaderVariableDefinitions +
      this.vertexShaderMethodDefinitions_dataTexture +
      GLSLShader.vertexShaderBody
    let fragmentShader = GLSLShader.fragmentShader;
    this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram(
      vertexShader,
      fragmentShader,
      GLSLShader.attributeNanes,
      GLSLShader.attributeSemantics
    );
  }

  setupGPUData(): void {
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

    if (this.__dataTextureUid !== 0) {
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

  };

  attachGPUData(): void {
    const gl = this.__webglResourceRepository.currentWebGLContextWrapper!.getRawContext();
    const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__dataTextureUid)! as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
    var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    gl.uniform1i(uniform_dataTexture, 0);
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
     this.__instance = new WebGLStrategyDataTexture();
    }

    return this.__instance;
  }

}

