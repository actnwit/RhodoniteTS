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
import { BufferUse } from "../../definitions/BufferUse";
import WebGLStrategyTransformFeedback from "./WebGLStrategyTransformFeedback";
import getRenderingStrategy from "./getRenderingStrategy";
import WebGLStrategy from "./WebGLStrategy";
import CGAPIResourceRepository from "../CGAPIResourceRepository";
import Config from "../../core/Config";
import BufferView from "../../memory/BufferView";
import Accessor from "../../memory/Accessor";

export const WebGLRenderingPipeline = new class implements RenderingPipeline {
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private __instanceIDBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __webGLStrategy?: WebGLStrategy;
  private __instanceIdAccessor?: Accessor;
  common_$load(processApproach: ProcessApproachEnum) {

    // Strategy
    this.__webGLStrategy = getRenderingStrategy(processApproach);

    // Shader setup
    this.__webGLStrategy!.setupShaderProgram();

  }

  common_$prerender(): CGAPIResourceHandle {
    const gl = this.__webglResourceRepository.currentWebGLContextWrapper;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext!');
    }

    this.__webGLStrategy!.common_$prerender();

    if (this.__isReady()) {
      return 0;
    }

    this.__instanceIDBufferUid = this.__setupInstanceIDBuffer();

    return this.__instanceIDBufferUid;
  }

  private __isReady() {
    if (this.__instanceIDBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return true;
    } else {
      return false;
    }
  }

  private __setupInstanceIDBuffer() {
    if (this.__instanceIdAccessor == null) {
      const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
      const count = Config.maxEntityNumber;
      const bufferView = buffer.takeBufferView({byteLengthToNeed: 4/*byte*/ * count, byteStride: 0, isAoS: false});
      this.__instanceIdAccessor = bufferView.takeAccessor({compositionType: CompositionType.Scalar, componentType: ComponentType.Float, count: count});
    }

    const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
    if (meshComponents == null) {
      return CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }

    for (var i = 0; i < meshComponents.length; i++) {
      this.__instanceIdAccessor.setScalar(i, meshComponents[i].entityUID);
    }

    return this.__webglResourceRepository.createVertexBuffer(this.__instanceIdAccessor);
  }

  common_$render(){
    if (!this.__webGLStrategy!.common_$render()) {
      return;
    }

    const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;

    const meshComponent = meshComponents[0] as MeshComponent;
    const primitiveNum = meshComponent.getPrimitiveNumber();
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.getPrimitiveAt(i);

      this.__webGLStrategy!.attachVertexData(i, primitive, glw, this.__instanceIDBufferUid);
      this.__webGLStrategy!.attatchShaderProgram();
      this.__webGLStrategy!.attachGPUData();

      const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;
      glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0, meshComponents.length);

    }

  }

}
