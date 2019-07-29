import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
import Matrix44 from "../foundation/math/Matrix44";
import Matrix33 from "../foundation/math/Matrix33";
import Entity from "../foundation/core/Entity";
import CubeTexture from "../foundation/textures/CubeTexture";
import Material from "../foundation/materials/Material";
import RenderPass from "../foundation/renderer/RenderPass";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import { WebGLResourceHandle, Index, Count, ComponentSID } from "../types/CommonTypes";

export default interface WebGLStrategy {
  $load(meshComponent: MeshComponent): void;
  $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: WebGLResourceHandle): void;
  $render?(i: Index, meshComponent: MeshComponent, worldMatrix: Matrix44, normalMatrix: Matrix33, entity: Entity, renderPass: RenderPass, renderPassTickCount: Count, diffuseCube?: CubeTexture, specularCube?: CubeTexture): void;
  common_$prerender(): void;
  common_$render(meshComponentSids: Int32Array, meshComponents: MeshComponent[], viewMatrix: Matrix44, projectionMatrix: Matrix44, renderPass: RenderPass): boolean;
  attachGPUData(primitive: Primitive): void;
  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
  //setupShaderProgram(meshComponent: MeshComponent): void;
  attatchShaderProgram(material: Material): void;
}

