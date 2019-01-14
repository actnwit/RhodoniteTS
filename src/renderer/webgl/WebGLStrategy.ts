import MeshComponent from "../../components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../../geometry/Primitive";
import ImmutableRowMajarMatrix44 from "../../math/ImmutableRowMajarMatrix44";

export default interface WebGLStrategy {
  $load(meshComponent: MeshComponent): void;
  $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle): void;
  $render?(primitive_i: number, primitive: Primitive, worldMatrix: ImmutableRowMajarMatrix44): void;
  common_$prerender(): void;
  common_$render(): boolean;
  attachGPUData(): void;
  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
  setupShaderProgram(): void;
  attatchShaderProgram(): void;
}

