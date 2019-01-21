import RenderingPipeline from "../foundation/renderer/RenderingPipeline";
import WebGLResourceRepository from "./WebGLResourceRepository";
import MemoryManager from "../foundation/core/MemoryManager";
import { ComponentType } from "../foundation/definitions/ComponentType";
import { CompositionType } from "../foundation/definitions/CompositionType";
import ComponentRepository from "../foundation/core/ComponentRepository";
import MeshComponent from "../foundation/components/MeshComponent";
import { ProcessApproach, ProcessApproachEnum } from "../foundation/definitions/ProcessApproach";
import { BufferUse } from "../foundation/definitions/BufferUse";
import getRenderingStrategy from "./getRenderingStrategy";
import WebGLStrategy from "./WebGLStrategy";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Config from "../foundation/core/Config";
import Accessor from "../foundation/memory/Accessor";
import CameraComponent from "../foundation/components/CameraComponent";
import Matrix44 from "../foundation/math/Matrix44";

export default class WebGLRenderingPipeline implements RenderingPipeline {
  private static __instance: WebGLRenderingPipeline;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private __instanceIDBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __webGLStrategy?: WebGLStrategy;
  private __instanceIdAccessor?: Accessor;
  private __cameraComponent?: CameraComponent;
  private __tmp_indentityMatrix: Matrix44 = Matrix44.identity();

  private constructor(){

  };

  static getInstance(): WebGLRenderingPipeline {
    if (!this.__instance) {
      this.__instance = new WebGLRenderingPipeline();
    }
    return this.__instance;
  }

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
      this.__instanceIdAccessor!.setScalar(i, meshComponents[i].entityUID);
    }

    return this.__webglResourceRepository.createVertexBuffer(this.__instanceIdAccessor!);
  }

  common_$render(){
    this.__cameraComponent = this.__componentRepository.getComponent(CameraComponent.componentTID, CameraComponent.main) as CameraComponent;
    let viewMatrix = this.__tmp_indentityMatrix;
    let projectionMatrix = this.__tmp_indentityMatrix;
    if (this.__cameraComponent) {
      viewMatrix = this.__cameraComponent.viewMatrix;
      projectionMatrix = this.__cameraComponent.projectionMatrix;
    }
    if (!this.__webGLStrategy!.common_$render(viewMatrix, projectionMatrix)) {
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
