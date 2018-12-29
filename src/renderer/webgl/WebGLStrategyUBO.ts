import WebGLResourceRepository from "./WebGLResourceRepository";
import { WebGLExtension } from "../../definitions/WebGLExtension";
import MemoryManager from "../../core/MemoryManager";
import Buffer from "../../memory/Buffer";
import { MathUtil } from "../../math/MathUtil";
import { PixelFormat } from "../../definitions/PixelFormat";
import { ComponentType } from "../../definitions/ComponentType";
import { TextureParameter } from "../../definitions/TextureParameter";
import SceneGraphComponent from "../../components/SceneGraphComponent";
import GLSLShader from "./GLSLShader";

export default class WebGLStrategyUBO implements WebGLStrategy {
  private static __instance: WebGLStrategyUBO;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __uboUid: CGAPIResourceHandle = 0;
  private __shaderProgramUid: CGAPIResourceHandle = 0;

  private constructor(){}

  setupShaderProgram(): void {
    if (this.__shaderProgramUid !== 0) {
      return;
    }

    // Shader Setup
    let vertexShader = GLSLShader.vertexShaderUBO;
    let fragmentShader = GLSLShader.fragmentShader;
    this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram(
      vertexShader,
      fragmentShader,
      GLSLShader.attributeNanes,
      GLSLShader.attributeSemantics
    );
  }

  setupGPUData(): void {
    const isHalfFloatMode = false;
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBufferForGPUInstanceData();
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
        this.__webglResourceRepository.updateUniformBuffer(this.__uboUid, halfFloatDataTextureBuffer!);
        return;
      }

      this.__uboUid = this.__webglResourceRepository.createUniformBuffer(halfFloatDataTextureBuffer!);

    } else {
      if (this.__uboUid !== 0) {
        this.__webglResourceRepository.updateUniformBuffer(this.__uboUid, SceneGraphComponent.getWorldMatrixAccessor().dataViewOfBufferView);
        return;
      }

      this.__uboUid = this.__webglResourceRepository.createUniformBuffer(SceneGraphComponent.getWorldMatrixAccessor().dataViewOfBufferView);

    }
    this.__webglResourceRepository.bindUniformBufferBase(0, this.__uboUid);

  };

  attachGPUData(): void {
    this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'matrix', 0);
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
     this.__instance = new WebGLStrategyUBO();
    }

    return this.__instance;
  }

}

