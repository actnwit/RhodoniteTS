import WebGLResourceRepository, { VertexHandles } from "./WebGLResourceRepository";
import MemoryManager from "../../core/MemoryManager";
import Buffer from "../../memory/Buffer";
import { MathUtil } from "../../math/MathUtil";
import SceneGraphComponent from "../../components/SceneGraphComponent";
import GLSLShader from "./GLSLShader";
import { BufferUse } from "../../definitions/BufferUse";
import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../../components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../../geometry/Primitive";
import CGAPIResourceRepository from "../CGAPIResourceRepository";
import RowMajarMatrix44 from "../../math/RowMajarMatrix44";
import ImmutableMatrix44 from "../../math/ImmutableMatrix44";

export default class WebGLStrategyUniform implements WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __uboUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __shaderProgram?: WebGLShader;
  private __vertexHandles: Array<VertexHandles> = [];
  private static __vertexHandleOfPrimitiveObjectUids: Map<ObjectUID, VertexHandles> = new Map();
  private __isVAOSet = false;
  private __uniformLocation_worldMatrix?: WebGLUniformLocation;

  private vertexShaderMethodDefinitions_uniform:string =
  `
  uniform mat4 worldMatrix;

  mat4 getMatrix(float instanceId) {
    return worldMatrix;
  }
  `;

  private constructor(){}

  setupShaderProgram(): void {
    if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }

    // Shader Setup
    let vertexShader = GLSLShader.vertexShaderVariableDefinitions +
      this.vertexShaderMethodDefinitions_uniform +
      GLSLShader.vertexShaderBody
    let fragmentShader = GLSLShader.fragmentShader;
    this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram(
      {
        vertexShaderStr: vertexShader,
        fragmentShaderStr: fragmentShader,
        attributeNames: GLSLShader.attributeNames,
        attributeSemantics: GLSLShader.attributeSemantics
      }
    );
    this.__shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid)! as WebGLShader;

    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    this.__uniformLocation_worldMatrix = gl.getUniformLocation(this.__shaderProgram, 'worldMatrix')!;
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
      WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles);

    }
  }

  $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle) {
    if (this.__isVAOSet) {
      return;
    }
    const primitiveNum = meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent!.getPrimitiveAt(i);
      this.__vertexHandles[i] = WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
      this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
    }
    this.__isVAOSet = true;
  }

  common_$prerender(): void {
  };

  attachGPUData(): void {
  };

  attatchShaderProgram(): void {
    const shaderProgramUid = this.__shaderProgramUid;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    gl.useProgram(this.__shaderProgram);
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
     this.__instance = new WebGLStrategyUniform();
    }

    return this.__instance;
  }

  common_$render() {
    return false;
  }

  $render(primitive_i:number, primitive: Primitive, worldMatrix: RowMajarMatrix44) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    this.attatchShaderProgram();
    const gl = glw.getRawContext();
    this.attachVertexData(primitive_i, primitive, glw, CGAPIResourceRepository.InvalidCGAPIResourceUid);

    gl.uniformMatrix4fv(this.__uniformLocation_worldMatrix, false, RowMajarMatrix44.transpose(worldMatrix).raw());
    //gl.uniformMatrix4fv(this.__uniformLocation_worldMatrix, false, worldMatrix.raw());

    glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0, 1);
  }

}

