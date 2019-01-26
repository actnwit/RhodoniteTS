import WebGLResourceRepository, { VertexHandles } from "./WebGLResourceRepository";
import GLSLShader from "./GLSLShader";
import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import RowMajarMatrix44 from "../foundation/math/RowMajarMatrix44";
import Matrix44 from "../foundation/math/Matrix44";
import Matrix33 from "../foundation/math/Matrix33";

export default class WebGLStrategyUniform implements WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __uboUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __shaderProgram?: WebGLShader;
  //private __vertexHandles: Array<VertexHandles> = [];
  private static __vertexHandleOfPrimitiveObjectUids: Map<ObjectUID, VertexHandles> = new Map();
  private __isVAOSet = false;

  private __uniformLocation_worldMatrix?: WebGLUniformLocation;
  private __uniformLocation_material?: WebGLUniformLocation;
  private __uniformLocation_viewMatrix?: WebGLUniformLocation;
  private __uniformLocation_projectionMatrix?: WebGLUniformLocation;
  private __uniformLocation_normalMatrix?: WebGLUniformLocation;
  private __uniformLocation_baseColorTexture?: WebGLUniformLocation;

  private vertexShaderMethodDefinitions_uniform:string =
  `
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

  `;

  private constructor(){}

  setupShaderProgram(): void {
    if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }

    // Shader Setup
    const glslShader = GLSLShader.getInstance();
    let vertexShader = glslShader.vertexShaderVariableDefinitions +
      this.vertexShaderMethodDefinitions_uniform +
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
    this.__shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid)! as WebGLShader;

    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    this.__uniformLocation_worldMatrix = gl.getUniformLocation(this.__shaderProgram, 'u_worldMatrix')!;
    this.__uniformLocation_material = gl.getUniformLocation(this.__shaderProgram, 'u_material.baseColor')!;
    this.__uniformLocation_viewMatrix = gl.getUniformLocation(this.__shaderProgram, 'u_viewMatrix')!;
    this.__uniformLocation_projectionMatrix = gl.getUniformLocation(this.__shaderProgram, 'u_projectionMatrix')!;
    this.__uniformLocation_normalMatrix = gl.getUniformLocation(this.__shaderProgram, 'u_normalMatrix')!;
    this.__uniformLocation_baseColorTexture = gl.getUniformLocation(this.__shaderProgram, 'u_material.baseColorTexture')!;
  }

  // private __isLoaded(index: Index) {
  //   if (this.__vertexHandles[index] != null) {
  //     return true;
  //   } else {
  //     return false
  //   }
  // }

  $load(meshComponent: MeshComponent) {
    // if (this.__isLoaded(0)) {
    //   return;
    // }

    const primitiveNum = meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent!.getPrimitiveAt(i);
      const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
      //this.__vertexHandles[i] = vertexHandles;
      WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.set(primitive.primitiveUid, vertexHandles);
//      this.__webglResourceRepository.setVertexDataToPipeline(vertexHandles, primitive, void 0);
    }

  }

  $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle) {
    const vertexHandles = [];
    const primitiveNum = meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {

      const primitive = meshComponent!.getPrimitiveAt(i);
      vertexHandles[i] = WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.get(primitive.primitiveUid)!;
      if (!vertexHandles[i].setComplete) {

        //continue;
      }
      this.__webglResourceRepository.setVertexDataToPipeline(vertexHandles[i], primitive, instanceIDBufferUid);
      vertexHandles[i].setComplete = true;
    }
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
    const vertexHandle = WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.get(primitive.primitiveUid)!;
    const vaoHandles = vertexHandle;
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
     this.__instance = new WebGLStrategyUniform();
    }

    return this.__instance;
  }

  common_$render(viewMatrix: Matrix44, projectionMatrix: Matrix44) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    this.attatchShaderProgram();
    const gl = glw.getRawContext();

    gl.uniformMatrix4fv(this.__uniformLocation_viewMatrix, false, viewMatrix.v);
    gl.uniformMatrix4fv(this.__uniformLocation_projectionMatrix, false, projectionMatrix.v);

    return false;
  }

  $render(primitive_i:number, primitive: Primitive, worldMatrix: RowMajarMatrix44, normalMatrix: Matrix33) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    this.attatchShaderProgram();
    const gl = glw.getRawContext();
    this.attachVertexData(primitive_i, primitive, glw, CGAPIResourceRepository.InvalidCGAPIResourceUid);

    gl.uniformMatrix4fv(this.__uniformLocation_worldMatrix, false, RowMajarMatrix44.transpose(worldMatrix).v);

//    gl.uniformMatrix4fv(this.__uniformLocation_worldMatrix, false, Matrix44.identity().v);

    gl.uniformMatrix3fv(this.__uniformLocation_normalMatrix, false, normalMatrix.v);
    const material = primitive.material;
    const baseColor = [];
    if (material) {
      baseColor[0] = material.baseColor.r;
      baseColor[1] = material.baseColor.g;
      baseColor[2] = material.baseColor.b;
      baseColor[3] = material.alpha;
    } else {
      baseColor[0] = 1;
      baseColor[1] = 1;
      baseColor[2] = 1;
      baseColor[3] = 1;
    }
    gl.uniform4fv(this.__uniformLocation_material, baseColor);
    gl.uniform1i(this.__uniformLocation_baseColorTexture, 0);

    if (material && material!.baseColorTexture) {
      const texture = this.__webglResourceRepository.getWebGLResource(material!.baseColorTexture!.texture3DAPIResourseUid);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    }

    gl.drawElements(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0);
    //gl.drawElements(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, primitive.indicesAccessor!.byteOffsetInBuffer);

  }

}

