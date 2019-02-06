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
import SkeletalComponent from "../foundation/components/SkeletalComponent";
import CameraComponent from "../foundation/components/CameraComponent";
import Entity from "../foundation/core/Entity";
import SceneGraphComponent from "../foundation/components/SceneGraphComponent";
import { ShaderSemantics } from "../foundation/definitions/ShaderSemantics";
import ClassicShader from "./ClassicShader";
import EntityRepository from "../foundation/core/EntityRepository";
import ComponentRepository from "../foundation/core/ComponentRepository";
import LightComponent from "../foundation/components/LightComponent";
import Config from "../foundation/core/Config";

export default class WebGLStrategyUniform implements WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __uboUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __shaderProgram?: WebGLShader;
  //private __vertexHandles: Array<VertexHandles> = [];
  private static __vertexHandleOfPrimitiveObjectUids: Map<ObjectUID, VertexHandles> = new Map();
  private __lightComponents?: LightComponent[];
  private __dummyTextureUid?: CGAPIResourceHandle;

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
    const glslShader = ClassicShader.getInstance();
    let vertexShader = glslShader.vertexShaderVariableDefinitions +
      this.vertexShaderMethodDefinitions_uniform +
      glslShader.vertexShaderBody
    let fragmentShader = glslShader.fragmentShader;
    this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram(
      {
        vertexShaderStr: vertexShader,
        fragmentShaderStr: fragmentShader,
        attributeNames: ClassicShader.attributeNames,
        attributeSemantics: ClassicShader.attributeSemantics
      }
    );
    this.__shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid)! as WebGLShader;

    const args: any = [
      {semantic: ShaderSemantics.WorldMatrix, isPlural: false},
      {semantic: ShaderSemantics.BaseColorFactor, isPlural: false, prefix: 'material.'},
      {semantic: ShaderSemantics.ViewMatrix, isPlural: false},
      {semantic: ShaderSemantics.ProjectionMatrix, isPlural: false},
      {semantic: ShaderSemantics.NormalMatrix, isPlural: false},
      {semantic: ShaderSemantics.BaseColorTexture, isPlural: false, prefix: 'material.'},
      {semantic: ShaderSemantics.BoneMatrix, isPlural: true},
      {semantic: ShaderSemantics.LightNumber, isPlural: false},
    ];
    const lights = [];
    for (let i=0; i<Config.maxLightNumberInShader; i++) {
      lights.push({semanticStr: ShaderSemantics.LightPosition, isPlural: false, prefix: `lights[${i}].`, index: i});
      lights.push({semanticStr: ShaderSemantics.LightDirection, isPlural: false, prefix: `lights[${i}].`, index: i});
      lights.push({semanticStr: ShaderSemantics.LightIntensity, isPlural: false, prefix: `lights[${i}].`, index: i});
    }

    this.__webglResourceRepository.setupUniformLocations(this.__shaderProgramUid, args.concat(lights));

  }

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

    this.__dummyTextureUid = this.__webglResourceRepository.createDummyTexture();

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
    const componentRepository = ComponentRepository.getInstance();
    this.__lightComponents = componentRepository.getComponentsWithType(LightComponent) as LightComponent[];
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

  dettachVertexData(glw: WebGLContextWrapper) {
    const gl = glw.getRawContext();
    if (glw.bindVertexArray) {
      glw.bindVertexArray(null);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
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

    this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.ViewMatrix, true, 4, 'f', true, {x:viewMatrix.v});
    this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.ProjectionMatrix, true, 4, 'f', true, {x:projectionMatrix.v});

    return false;
  }

  $render(primitive_i:number, primitive: Primitive, worldMatrix: RowMajarMatrix44, normalMatrix: Matrix33, entity: Entity) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    this.attatchShaderProgram();
    const gl = glw.getRawContext();
    this.attachVertexData(primitive_i, primitive, glw, CGAPIResourceRepository.InvalidCGAPIResourceUid);


    // Set Uniforms
    /// Matrices
    this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.WorldMatrix, true, 4, 'f', true, {x:RowMajarMatrix44.transpose(worldMatrix).v});
    this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.NormalMatrix, true, 3, 'f', true, {x:normalMatrix.v});

    /// Material
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
    this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.BaseColorFactor, false, 4, 'f', true, {x:baseColor});
    this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.BaseColorTexture, false, 1, 'i', false, {x:0});

    // Lights
    this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.LightNumber, false, 1, 'i', false, {x:this.__lightComponents!.length});
    for (let i=0; i<this.__lightComponents!.length; i++) {
      if (i >= Config.maxLightNumberInShader) {
        break;
      }
      const lightComponent = this.__lightComponents![i];
      const sceneGraphComponent = lightComponent.entity.getSceneGraph();
      const worldLightPosition = sceneGraphComponent.worldPosition;
      const worldLightDirection = lightComponent.direction;
      const worldLightIntensity = lightComponent.intensity;
      this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.LightPosition, false, 4, 'f', false, {x:worldLightPosition.x, y:worldLightPosition.y, z:worldLightPosition.z, w: lightComponent.type.index}, i);
      this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.LightDirection, false, 4, 'f', false, {x:worldLightDirection.x, y:worldLightDirection.y, z:worldLightDirection.z, w:0}, i);
      this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.LightIntensity, false, 4, 'f', false, {x:worldLightIntensity.x, y:worldLightIntensity.y, z:worldLightIntensity.z, w:0}, i);
    }

    /// Skinning
    const skeletalComponent = entity.getComponent(SkeletalComponent) as SkeletalComponent;
    if (skeletalComponent) {
      const jointMatrices = skeletalComponent.jointMatrices;
      this.__webglResourceRepository.setUniformValue(this.__shaderProgramUid, ShaderSemantics.BoneMatrix, true, 4, 'f', true, {x:jointMatrices!});
    }

    // Bind BaseTexture
    if (material && material!.baseColorTexture) {
      const texture = this.__webglResourceRepository.getWebGLResource(material!.baseColorTexture!.texture3DAPIResourseUid);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    } else {
      const texture = this.__webglResourceRepository.getWebGLResource(this.__dummyTextureUid!);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    }

    gl.drawElements(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
    this.dettachVertexData(glw);

  }

}

