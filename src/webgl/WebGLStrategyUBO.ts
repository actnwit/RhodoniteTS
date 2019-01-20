import WebGLResourceRepository, { VertexHandles } from "./WebGLResourceRepository";
import MemoryManager from "../foundation/core/MemoryManager";
import Buffer from "../foundation/memory/Buffer";
import { MathUtil } from "../foundation/math/MathUtil";
import SceneGraphComponent from "../foundation/components/SceneGraphComponent";
import GLSLShader from "./GLSLShader";
import { BufferUse } from "../foundation/definitions/BufferUse";
import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Matrix44 from "../foundation/math/Matrix44";

export default class WebGLStrategyUBO implements WebGLStrategy {
  private static __instance: WebGLStrategyUBO;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __uboUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __vertexHandles: Array<VertexHandles> = [];
  private static __vertexHandleOfPrimitiveObjectUids: Map<ObjectUID, VertexHandles> = new Map();
  private __uniformLocation_viewMatrix?: WebGLUniformLocation;
  private __uniformLocation_projectionMatrix?: WebGLUniformLocation;
  private __isVAOSet = false;

  private vertexShaderMethodDefinitions_UBO:string =
  `layout (std140) uniform matrix {
    mat4 world[1024];
  } u_matrix;

  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;

  mat4 getMatrix(float instanceId) {
    float index = instanceId;
    return transpose(u_matrix.world[int(index)]);
  }

  mat4 getViewMatrix(float instanceId) {
    return uViewMatrix;
  }

  mat4 getProjectionMatrix(float instanceId) {
    return uProjectionMatrix;
  }

  `;

  private constructor(){}

  setupShaderProgram(): void {
    if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }

    // Shader Setup
    const glslShader = GLSLShader.getInstance();
    let vertexShader = glslShader.vertexShaderVariableDefinitions +
      this.vertexShaderMethodDefinitions_UBO +
      glslShader.vertexShaderBody
    let fragmentShader = glslShader.fragmentShader;
    this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram(
      {
        vertexShaderStr: vertexShader,
        fragmentShaderStr: fragmentShader,
        attributeNames: GLSLShader.attributeNames,
        attributeSemantics: GLSLShader.attributeSemantics
      }
    );

    const shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid)! as WebGLShader;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    this.__uniformLocation_viewMatrix = gl.getUniformLocation(shaderProgram, 'uViewMatrix')!;
    this.__uniformLocation_projectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix')!;
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

    const primitiveNum = meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent!.getPrimitiveAt(i);
      const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
      this.__vertexHandles[i] = vertexHandles;
      WebGLStrategyUBO.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles);

    }
  }

  $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle) {
    if (this.__isVAOSet) {
      return;
    }
    const primitiveNum = meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent!.getPrimitiveAt(i);
     // if (this.__isLoaded(i) && this.__isVAOSet) {
      this.__vertexHandles[i] = WebGLStrategyUBO.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
        //this.__vertexShaderProgramHandles[i] = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
      //  continue;
     // }
      this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
    }
    this.__isVAOSet = true;
  }

  common_$prerender(): void {
    const isHalfFloatMode = false;
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
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
      if (this.__uboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__webglResourceRepository.updateUniformBuffer(this.__uboUid, halfFloatDataTextureBuffer!);
        return;
      }

      this.__uboUid = this.__webglResourceRepository.createUniformBuffer(halfFloatDataTextureBuffer!);

    } else {
      if (this.__uboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__webglResourceRepository.updateUniformBuffer(this.__uboUid, SceneGraphComponent.getAccessor('worldMatrix', SceneGraphComponent).dataViewOfBufferView);
        return;
      }

      this.__uboUid = this.__webglResourceRepository.createUniformBuffer(SceneGraphComponent.getAccessor('worldMatrix', SceneGraphComponent).dataViewOfBufferView);

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

  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
    const vaoHandles = this.__vertexHandles[i];
    const vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
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
     this.__instance = new WebGLStrategyUBO();
    }

    return this.__instance;
  }

  common_$render(viewMatrix: Matrix44, projectionMatrix: Matrix44) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    this.attatchShaderProgram();
    const gl = glw.getRawContext();

    gl.uniformMatrix4fv(this.__uniformLocation_viewMatrix, false, viewMatrix.v);
    gl.uniformMatrix4fv(this.__uniformLocation_projectionMatrix, false, projectionMatrix.v);

    return true;
  }
}

