import RenderingPipeline from "../RenderingPipeline";
import WebGLResourceRepository from "./WebGLResourceRepository";
import Primitive from "../../geometry/Primitive";
import MemoryManager from "../../core/MemoryManager";
import { ComponentType } from "../../definitions/ComponentType";
import EntityRepository from "../../core/EntityRepository";
import { CompositionType } from "../../definitions/CompositionType";
import ComponentRepository from "../../core/ComponentRepository";
import MeshComponent from "../../components/MeshComponent";
import MeshRendererComponent from "../../components/MeshRendererComponent";
import { ProcessApproach, ProcessApproachEnum } from "../../definitions/ProcessApproach";
import WebGLStrategyUBO from "./WebGLStrategyUBO";
import WebGLStrategyDataTexture from "./WebGLStrategyDataTexture";
import WebGLContextWrapper from "./WebGLContextWrapper";

export const WebGLRenderingPipeline = new class implements RenderingPipeline {
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private __instanceIDBufferUid: CGAPIResourceHandle = 0;
  private __webGLStrategy?: WebGLStrategy;
  common_$load(processApproach: ProcessApproachEnum) {

    // Strategy
    if (processApproach === ProcessApproach.UBOWebGL2) {
      this.__webGLStrategy = WebGLStrategyUBO.getInstance();
    } else {
      this.__webGLStrategy = WebGLStrategyDataTexture.getInstance();
    }

    // Shader setup
    this.__webGLStrategy!.setupShaderProgram();

  }

  common_$prerender(): CGAPIResourceHandle {
    const gl = this.__webglResourceRepository.currentWebGLContextWrapper;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext!');
    }

    this.__webGLStrategy!.setupGPUData();

    if (this.__isReady()) {
      return 0;
    }

    this.__setupInstanceIDBuffer();

    return this.__instanceIDBufferUid;
  }

  private __isReady() {
    if (this.__instanceIDBufferUid !== 0) {
      return true;
    } else {
      return false;
    }
  }

  private __setupInstanceIDBuffer() {
    const buffer = MemoryManager.getInstance().getBufferForCPU();
    const count = EntityRepository.getMaxEntityNumber();
    const bufferView = buffer.takeBufferView({byteLengthToNeed: 4/*byte*/ * count, byteStride: 0, isAoS: false});
    const accesseor = bufferView.takeAccessor({compositionType: CompositionType.Scalar, componentType: ComponentType.Float, count: count});

    const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;
    for (var i = 0; i < meshComponents.length; i++) {
      accesseor.setScalar(i, meshComponents[i].entityUID);
    }

    this.__instanceIDBufferUid = this.__webglResourceRepository.createVertexBuffer(accesseor);
  }

  common_$render(){
    const meshRendererComponents = this.__componentRepository.getComponentsWithType(MeshRendererComponent.componentTID)!;
    const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;

    const meshRendererComponent = meshRendererComponents[0] as MeshRendererComponent;
    const meshComponent = meshComponents[0] as MeshComponent;
    const primitiveNum = meshComponent.getPrimitiveNumber();
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.getPrimitiveAt(i);

      this.__attachVertexData(meshRendererComponent, i, primitive, glw);
      this.__webGLStrategy!.attatchShaderProgram();
      this.__webGLStrategy!.attachGPUData();

      const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;
      glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0, meshComponents.length);

    }

  }



  private __attachVertexData(meshRendererComponent: MeshRendererComponent, i: number, primitive: Primitive, glw: WebGLContextWrapper) {
    const vaoHandles = meshRendererComponent.__vertexHandles[i];
    const vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
    const gl = glw.getRawContext();

    if (vao != null) {
      glw.bindVertexArray(vao);
    }
    else {
      this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, this.__instanceIDBufferUid);
      const ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle!);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
  }
}
