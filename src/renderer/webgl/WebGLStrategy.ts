import MeshComponent from "../../components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../../geometry/Primitive";

export default interface WebGLStrategy {
  $load(meshComponent: MeshComponent): void;
  $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle): void;
  $render?(primitive: Primitive): void;
  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
  common_$prerender(): void;
  common_$render(): boolean;
  attachGPUData(): void;
  setupShaderProgram(): void;
  attatchShaderProgram(): void;
}

