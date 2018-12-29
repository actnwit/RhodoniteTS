import RenderingPipeline from "../RenderingPipeline";
import WebGLResourceRepository from "./WebGLResourceRepository";
import Primitive from "../../geometry/Primitive";
import { WebGLExtension } from "../../definitions/WebGLExtension";
import MemoryManager from "../../core/MemoryManager";
import Buffer from "../../memory/Buffer";
import { TextureParameter } from "../../definitions/TextureParameter";
import { PixelFormat } from "../../definitions/PixelFormat";
import { ComponentType } from "../../definitions/ComponentType";
import EntityRepository from "../../core/EntityRepository";
import { CompositionType } from "../../definitions/CompositionType";
import ComponentRepository from "../../core/ComponentRepository";
import MeshComponent from "../../components/MeshComponent";
import { MathUtil } from "../../math/MathUtil";
import SceneGraphComponent from "../../components/SceneGraphComponent";
import MeshRendererComponent from "../../components/MeshRendererComponent";
import GLSLShader from "./GLSLShader";
import System from "../../system/System";
import { ProcessApproach } from "../../definitions/ProcessApproach";
import WebGLStrategyUBO from "./WebGLStrategyUBO";
import WebGLStrategyDataTexture from "./WebGLStrategyDataTexture";

export const WebGLRenderingPipeline = new class implements RenderingPipeline {
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private __instanceIDBufferUid: CGAPIResourceHandle = 0;
  private __webGLStrategy?: WebGLStrategy;
  common_$load() {

    // Strategy
    if (System.getInstance().processApproach === ProcessApproach.UBOWebGL2) {
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
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.getPrimitiveAt(i);

      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();

      const vaoHandles = meshRendererComponent.__vertexHandles[i];
      const vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
      if (vao != null) {
        glw.bindVertexArray(vao);
      } else {
        this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, this.__instanceIDBufferUid);
        const ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle!);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      }

      this.__webGLStrategy!.attatchShaderProgram();
      this.__webGLStrategy!.attachGPUData();

      const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID)!;
      glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0, meshComponents.length);

    }

  }

}
