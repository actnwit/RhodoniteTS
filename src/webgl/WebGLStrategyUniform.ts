import { WebGLResourceRepository } from './WebGLResourceRepository';
import { ShaderSources, WebGLStrategy } from './WebGLStrategy';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { Primitive } from '../foundation/geometry/Primitive';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { ShaderSemantics } from '../foundation/definitions/ShaderSemantics';
import { ComponentRepository } from '../foundation/core/ComponentRepository';
import { LightComponent } from '../foundation/components/Light/LightComponent';
import { Config } from '../foundation/core/Config';
import { PixelFormat } from '../foundation/definitions/PixelFormat';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { TextureParameter } from '../foundation/definitions/TextureParameter';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { CompositionType } from '../foundation/definitions/CompositionType';
import { Material } from '../foundation/materials/core/Material';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { Mesh } from '../foundation/geometry/Mesh';
import { MemoryManager } from '../foundation/core/MemoryManager';
import { ShaderType } from '../foundation/definitions/ShaderType';
import {
  CGAPIResourceHandle,
  WebGLResourceHandle,
  Index,
  Count,
  PrimitiveUID,
} from '../types/CommonTypes';
import { BufferUse } from '../foundation/definitions/BufferUse';
import { Buffer } from '../foundation/memory/Buffer';
import { GlobalDataRepository } from '../foundation/core/GlobalDataRepository';
import { MiscUtil } from '../foundation/misc/MiscUtil';
import WebGLStrategyCommonMethod, { setupShaderProgram } from './WebGLStrategyCommonMethod';
import { Is } from '../foundation/misc/Is';
import { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { isSkipDrawing, updateVBOAndVAO } from '../foundation/renderer/RenderingCommonMethods';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { RnXR } from '../xr/main';
import { WebXRSystem } from '../xr/WebXRSystem';
import { Vector2 } from '../foundation/math/Vector2';
import { AnimationComponent } from '../foundation/components/Animation/AnimationComponent';
import { Scalar } from '../foundation/math/Scalar';
import { TextureFormat } from '../foundation/definitions/TextureFormat';
import { Logger } from '../foundation/misc/Logger';

declare const spector: any;

export class WebGLStrategyUniform implements CGAPIStrategy, WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository =
    WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastShader: CGAPIResourceHandle = -1;
  private __lastMaterial?: WeakRef<Material>;
  private __lastRenderPassTickCount = -1;
  private __lightComponents?: LightComponent[];
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __webxrSystem: WebXRSystem;

  private static readonly componentMatrices: ShaderSemanticsInfo[] = [
    {
      semantic: 'vertexAttributesExistenceArray',
      compositionType: CompositionType.ScalarArray,
      componentType: ComponentType.Int,
      stage: ShaderType.VertexShader,
      min: 0,
      max: 1,
      isInternalSetting: true,
    },
    {
      semantic: 'worldMatrix',
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
    },
    {
      semantic: 'normalMatrix',
      compositionType: CompositionType.Mat3,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
    },
    {
      semantic: 'isBillboard',
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Bool,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
    },
  ];

  private constructor() {}

  private static __vertexShaderMethodDefinitions_uniform = `uniform mat4 u_worldMatrix;
uniform mat3 u_normalMatrix;
uniform bool u_isBillboard;

mat4 get_worldMatrix(float instanceId) {
  return u_worldMatrix;
}

mat3 get_normalMatrix(float instanceId) {
  return u_normalMatrix;
}

bool get_isVisible(float instanceId) {
  return true; // visibility is handled in CPU side in WebGLStrategyUniform, so this is dummy value.
}

bool get_isBillboard(float instanceId) {
  return u_isBillboard;
}

#ifdef RN_IS_VERTEX_SHADER
# ifdef RN_IS_MORPHING
  vec3 get_position(float vertexId, vec3 basePosition) {
    vec3 position = basePosition;
    int scalar_idx = 3 * int(vertexId);
    #ifdef GLSL_ES3
      int posIn4bytes = scalar_idx % 4;
    #else
      int posIn4bytes = int(mod(float(scalar_idx), 4.0));
    #endif
    for (int i=0; i<${Config.maxVertexMorphNumberInShader}; i++) {

      int basePosIn16bytes = u_dataTextureMorphOffsetPosition[i] + (scalar_idx - posIn4bytes)/4;

      vec3 addPos = vec3(0.0);
      if (posIn4bytes == 0) {
        vec4 val = fetchElement(basePosIn16bytes);
        addPos = val.xyz;
      } else if (posIn4bytes == 1) {
        vec4 val0 = fetchElement(basePosIn16bytes);
        addPos = vec3(val0.yzw);
      } else if (posIn4bytes == 2) {
        vec4 val0 = fetchElement(basePosIn16bytes);
        vec4 val1 = fetchElement(basePosIn16bytes+1);
        addPos = vec3(val0.zw, val1.x);
      } else if (posIn4bytes == 3) {
        vec4 val0 = fetchElement(basePosIn16bytes);
        vec4 val1 = fetchElement(basePosIn16bytes+1);
        addPos = vec3(val0.w, val1.xy);
      }

      // int index = u_dataTextureMorphOffsetPosition[i] + 1 * int(vertexId);
      // vec3 addPos = fetchElement(u_dataTexture, index, widthOfDataTexture, heightOfDataTexture).xyz;

      position += addPos * u_morphWeights[i];
      if (i == u_morphTargetNumber-1) {
        break;
      }
    }

    return position;
  }
# endif
#endif
  `;

  /**
   * setup shader program for the material in this WebGL strategy
   * @param material - a material to setup shader program
   */
  public setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const glw = webglResourceRepository.currentWebGLContextWrapper!;

    const [programUid, newOne] = material._createProgramWebGL(
      WebGLStrategyUniform.__vertexShaderMethodDefinitions_uniform,
      ShaderSemantics.getShaderProperty,
      primitive,
      glw.isWebGL2
    );

    if (newOne) {
      material._setupBasicUniformsLocations(primitive);

      material._setUniformLocationsOfMaterialNodes(true, primitive);

      const shaderSemanticsInfos = WebGLStrategyUniform.componentMatrices;
      const shaderSemanticsInfosPointSprite =
        WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray();

      material._setupAdditionalUniformLocations(
        shaderSemanticsInfos.concat(shaderSemanticsInfosPointSprite),
        true,
        primitive
      );

      WebGLStrategyUniform.__globalDataRepository._setUniformLocationsForUniformModeOnly(
        material.getShaderProgramUid(primitive)
      );
    }

    return programUid;
  }

  /**
   * re-setup shader program for the material in this WebGL strategy
   * @param material - a material to re-setup shader program
   * @param updatedShaderSources - updated shader sources
   * @param onError - callback function to handle error
   * @returns
   */
  public _reSetupShaderForMaterialBySpector(
    material: Material,
    primitive: Primitive,
    updatedShaderSources: ShaderSources,
    onError: (message: string) => void
  ): CGAPIResourceHandle {
    const [programUid, newOne] = material._createProgramByUpdatedSources(
      updatedShaderSources,
      primitive,
      onError
    );
    if (programUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return programUid;
    }

    if (newOne) {
      material._setupBasicUniformsLocations(primitive);

      material._setUniformLocationsOfMaterialNodes(true, primitive);

      const shaderSemanticsInfos = WebGLStrategyUniform.componentMatrices;
      const shaderSemanticsInfosPointSprite =
        WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray();

      material._setupAdditionalUniformLocations(
        shaderSemanticsInfos.concat(shaderSemanticsInfosPointSprite),
        true,
        primitive
      );
    }

    WebGLStrategyUniform.__globalDataRepository._setUniformLocationsForUniformModeOnly(
      material.getShaderProgramUid(primitive)
    );

    return programUid;
  }

  $load(meshComponent: MeshComponent) {
    const mesh = meshComponent.mesh as Mesh;
    if (!Is.exist(mesh)) {
      return false;
    }

    // setup VBO and VAO
    if (!mesh.isSetUpDone()) {
      updateVBOAndVAO(mesh);
    }

    return true;
  }

  prerender(): void {
    this.__lightComponents = ComponentRepository.getComponentsWithType(
      LightComponent
    ) as LightComponent[];

    // Setup Data Texture
    if (this.__dataTextureUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const memoryManager: MemoryManager = MemoryManager.getInstance();
      const buffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUVertexData);
      if (buffer == null) {
        return;
      }

      if (
        buffer.takenSizeInByte / MemoryManager.bufferWidthLength / 4 >
        MemoryManager.bufferHeightLength
      ) {
        Logger.warn('The buffer size exceeds the size of the data texture.');
      }
      const dataTextureByteSize =
        MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength * 4 * 4;
      const concatArrayBuffer = MiscUtil.concatArrayBuffers2({
        finalSize: dataTextureByteSize,
        srcs: [buffer.getArrayBuffer()],
        srcsCopySize: [buffer.takenSizeInByte],
        srcsOffset: [0],
      });
      const floatDataTextureBuffer = new Float32Array(concatArrayBuffer);

      this.__dataTextureUid = this.__webglResourceRepository.createTextureFromTypedArray(
        floatDataTextureBuffer,
        {
          level: 0,
          internalFormat: TextureFormat.RGBA32F,
          width: MemoryManager.bufferWidthLength,
          height: MemoryManager.bufferHeightLength,
          border: 0,
          format: PixelFormat.RGBA,
          type: ComponentType.Float,
          generateMipmap: false,
        }
      );
    }
  }

  attachGPUData(primitive: Primitive): void {}

  attachVertexData(
    i: number,
    primitive: Primitive,
    glw: WebGLContextWrapper,
    instanceIDBufferUid: WebGLResourceHandle
  ) {}

  attachVertexDataInner(
    mesh: Mesh,
    primitive: Primitive,
    primitiveUid: Index,
    glw: WebGLContextWrapper,
    instanceIDBufferUid: WebGLResourceHandle
  ) {
    const vao = this.__webglResourceRepository.getWebGLResource(
      mesh.getVaoUidsByPrimitiveUid(primitiveUid)
    ) as WebGLVertexArrayObjectOES;

    if (vao != null) {
      glw.bindVertexArray(vao);
    } else {
      const vaoHandles = primitive.vertexHandles!;
      this.__webglResourceRepository.setVertexDataToPipeline(
        vaoHandles,
        primitive,
        instanceIDBufferUid
      );
      const ibo = this.__webglResourceRepository.getWebGLResource(
        vaoHandles.iboHandle!
      ) as WebGLBuffer;
      const gl = glw.getRawContext();
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
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      WebGLStrategyUniform.__webxrSystem = webxrSystem;
    }

    return this.__instance;
  }

  common_$render(
    primitiveUids: PrimitiveUID[],
    renderPass: RenderPass,
    renderPassTickCount: Count
  ) {
    if (typeof spector !== 'undefined') {
      spector.setMarker('|  |  Uniform:$render#');
    }

    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContextAsWebGL2();

    if (renderPass.isBufferLessRenderingMode()) {
      this.__renderWithoutBuffers(gl, renderPass);
      return true;
    }

    let renderedSomething = false;

    // For opaque primitives
    if (renderPass._toRenderOpaquePrimitives) {
      if (!renderPass.depthWriteMask) {
        gl.depthMask(false);
      }
      for (let i = 0; i <= renderPass._lastOpaqueIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, glw, renderPass, renderPassTickCount);
        renderedSomething ||= rendered;
      }
    }

    // For translucent primitives
    if (renderPass._toRenderTranslucentPrimitives) {
      // Draw Translucent primitives
      for (let i = renderPass._lastOpaqueIndex + 1; i <= renderPass._lastTranslucentIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, glw, renderPass, renderPassTickCount);
        renderedSomething ||= rendered;
      }
    }

    // Draw Blend primitives with ZWrite
    if (renderPass._toRenderBlendWithZWritePrimitives) {
      for (
        let i = renderPass._lastTranslucentIndex + 1;
        i <= renderPass._lastBlendWithZWriteIndex;
        i++
      ) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, glw, renderPass, renderPassTickCount);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithoutZWritePrimitives) {
      if (!MeshRendererComponent.isDepthMaskTrueForBlendPrimitives) {
        // disable depth write for blend primitives
        gl.depthMask(false);
      }

      // Draw Blend primitives without ZWrite
      for (
        let i = renderPass._lastBlendWithZWriteIndex + 1;
        i <= renderPass._lastBlendWithoutZWriteIndex;
        i++
      ) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, glw, renderPass, renderPassTickCount);
        renderedSomething ||= rendered;
      }
    }
    gl.depthMask(true);

    // this.__webglResourceRepository.unbindTextureSamplers();

    return renderedSomething;
  }

  private __renderWithoutBuffers(gl: WebGL2RenderingContext, renderPass: RenderPass) {
    // setup shader program
    const material: Material = renderPass.material!;
    const primitive: Primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    setupShaderProgram(material, primitive, this);

    const shaderProgramUid = material.getShaderProgramUid(primitive);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(
      shaderProgramUid
    )! as WebGLProgram;
    gl.useProgram(shaderProgram);
    this.__lastShader = shaderProgramUid;

    this.bindDataTexture(gl, shaderProgram);

    WebGLStrategyCommonMethod.setWebGLParameters(material, gl);
    material._setParametersToGpuWebGLWithOutInternalSetting({
      shaderProgram,
      firstTime: true,
      isUniformMode: true,
    });

    const isVrMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);
    if ((shaderProgram as any).vrState != null && isVrMainPass) {
      const vrState = GlobalDataRepository.getInstance().getValue('vrState', 0) as Vector2;
      vrState._v[0] = isVrMainPass ? 1 : 0;
      vrState._v[1] = 0;
      (shaderProgram as any)._gl.uniform2iv((shaderProgram as any).vrState, vrState._v);
    }

    if (renderPass.depthWriteMask) {
      gl.depthMask(true);
    } else {
      gl.depthMask(false);
    }

    this.__webglResourceRepository.setViewport(renderPass.getViewport());

    gl.drawArrays(
      renderPass._primitiveModeForBufferLessRendering.index,
      0,
      renderPass._drawVertexNumberForBufferLessRendering
    );
  }

  renderInner(
    primitiveUid: PrimitiveUID,
    glw: WebGLContextWrapper,
    renderPass: RenderPass,
    renderPassTickCount: Count
  ) {
    const gl = glw.getRawContext();
    const primitive = Primitive.getPrimitive(primitiveUid);
    if (primitive == null) {
      return false;
    }
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    setupShaderProgram(material, primitive, this);

    const mesh = primitive.mesh as Mesh;
    const meshEntities = mesh.meshEntitiesInner;

    let renderedSomething = false;
    const isVrMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);
    const displayCount = WebGLStrategyCommonMethod.getDisplayCount(
      isVrMainPass,
      WebGLStrategyUniform.__webxrSystem
    );
    for (const entity of meshEntities) {
      if (entity.getSceneGraph()._isCulled) {
        continue;
      }
      const meshComponent = entity.getMesh();

      this.attachVertexDataInner(
        meshComponent.mesh!,
        primitive,
        primitiveUid,
        glw,
        CGAPIResourceRepository.InvalidCGAPIResourceUid
      );

      const shaderProgramUid = material.getShaderProgramUid(primitive);
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(
        shaderProgramUid
      )! as WebGLProgram;

      let firstTime = true;

      if (shaderProgramUid !== this.__lastShader || (gl as any).__changedProgram) {
        if (isSkipDrawing(material, primitive)) {
          return false;
        }
        firstTime = true;
        (gl as any).__changedProgram = false;

        gl.useProgram(shaderProgram);
        this.bindDataTexture(gl, shaderProgram);

        if (AnimationComponent.isAnimating) {
          const time = GlobalDataRepository.getInstance().getValue('time', 0) as Scalar;
          (shaderProgram as any)._gl.uniform1f((shaderProgram as any).time, time._v[0]);
        }

        this.__lastShader = shaderProgramUid;
      }

      if (this.__lastMaterial?.deref() !== material) {
        firstTime = true;
        this.__lastMaterial = new WeakRef(material);
      }

      for (let displayIdx = 0; displayIdx < displayCount; displayIdx++) {
        if (isVrMainPass) {
          WebGLStrategyCommonMethod.setVRViewport(renderPass, displayIdx);
        }

        const renderingArg = {
          setUniform: true,
          glw: glw,
          entity,
          primitive: primitive,
          worldMatrix: entity.getSceneGraph().matrix,
          normalMatrix: entity.getSceneGraph().normalMatrix,
          isBillboard: entity.getSceneGraph().isBillboard,
          lightComponents: this.__lightComponents!,
          renderPass: renderPass,
          diffuseCube: entity.tryToGetMeshRenderer()?.diffuseCubeMap,
          specularCube: entity.tryToGetMeshRenderer()?.specularCubeMap,
          sheenCube: entity.tryToGetMeshRenderer()?.sheenCubeMap,
          isVr: isVrMainPass,
          displayIdx,
        };
        if (firstTime) {
          WebGLStrategyCommonMethod.setWebGLParameters(material, gl);
          material._setParametersToGpuWebGL({
            material,
            shaderProgram,
            firstTime,
            args: renderingArg,
          });
        }
        material._setParametersToGpuWebGLPerPrimitive({
          material: material,
          shaderProgram: shaderProgram,
          firstTime: firstTime,
          args: renderingArg,
        });

        if ((shaderProgram as any).vrState != null && isVrMainPass) {
          const vrState = GlobalDataRepository.getInstance().getValue('vrState', 0) as Vector2;
          vrState._v[0] = isVrMainPass ? 1 : 0;
          vrState._v[1] = displayIdx;
          (shaderProgram as any)._gl.uniform2iv((shaderProgram as any).vrState, vrState._v);
        }

        if (primitive.indicesAccessor) {
          gl.drawElements(
            primitive.primitiveMode.index,
            primitive.indicesAccessor.elementCount,
            primitive.indicesAccessor.componentType.index,
            0
          );
        } else {
          gl.drawArrays(
            primitive.primitiveMode.index,
            0,
            primitive.getVertexCountAsVerticesBased()
          );
        }
      }
      renderedSomething = true;
    }

    return renderedSomething;
  }

  private bindDataTexture(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    shaderProgram: WebGLProgram
  ) {
    gl.uniform1i((shaderProgram as any).dataTexture, 7);
    this.__webglResourceRepository.bindTexture2D(7, this.__dataTextureUid);
    const samplerUid = this.__webglResourceRepository.createOrGetTextureSamplerRepeatNearest();
    this.__webglResourceRepository.bindTextureSampler(7, samplerUid);
  }

  // $render() {}
}
