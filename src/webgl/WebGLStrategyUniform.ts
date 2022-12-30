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
import { ShaderVariableUpdateInterval } from '../foundation/definitions/ShaderVariableUpdateInterval';
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
import WebGLStrategyCommonMethod from './WebGLStrategyCommonMethod';
import { Is } from '../foundation/misc/Is';
import { ShaderSemanticsInfo } from '../foundation';

declare const spector: any;

export class WebGLStrategyUniform implements WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository =
    WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastShader: CGAPIResourceHandle = -1;
  private __lastMaterial?: Material;
  private __lastRenderPassTickCount = -1;
  private __lightComponents?: LightComponent[];
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private __latestPrimitivePositionAccessorVersions: number[] = [];

  private static readonly componentMatrices: ShaderSemanticsInfo[] = [
    {
      semantic: ShaderSemantics.VertexAttributesExistenceArray,
      compositionType: CompositionType.ScalarArray,
      componentType: ComponentType.Int,
      stage: ShaderType.VertexShader,
      min: 0,
      max: 1,
      isCustomSetting: true,
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
    },
    {
      semantic: ShaderSemantics.WorldMatrix,
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isCustomSetting: true,
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
    },
    {
      semantic: ShaderSemantics.NormalMatrix,
      compositionType: CompositionType.Mat3,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isCustomSetting: true,
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
    },
    {
      semantic: ShaderSemantics.IsBillboard,
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Bool,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isCustomSetting: true,
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
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

  setupShaderProgram(meshComponent: MeshComponent): void {
    if (meshComponent.mesh == null) {
      return;
    }

    const primitiveNum = meshComponent!.mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent!.mesh.getPrimitiveAt(i);
      const material = primitive.material;
      if (material == null || material.isEmptyMaterial()) {
        continue;
      }

      if (material._shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        continue;
      }

      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const isPointSprite = primitive.primitiveMode.index === gl.POINTS;

      try {
        this.setupShaderForMaterial(material);
        primitive._backupMaterial();
      } catch (e) {
        console.log(e);
        primitive._restoreMaterial();
        this.setupShaderForMaterial(primitive.material);
      }
    }
  }

  /**
   * setup shader program for the material in this WebGL strategy
   * @param material - a material to setup shader program
   * @param updatedShaderSources - updated shader sources if exists
   */
  public setupShaderForMaterial(
    material: Material,
    updatedShaderSources?: ShaderSources,
    onError?: (message: string) => void
  ): CGAPIResourceHandle {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const glw = webglResourceRepository.currentWebGLContextWrapper!;

    let programUid;
    if (Is.not.exist(updatedShaderSources)) {
      programUid = material._createProgram(
        WebGLStrategyUniform.__vertexShaderMethodDefinitions_uniform,
        ShaderSemantics.getShaderProperty,
        glw.isWebGL2
      );
    } else {
      programUid = material._createProgramByUpdatedSources(updatedShaderSources, onError);
    }

    material._setupBasicUniformsLocations();

    material._setUniformLocationsOfMaterialNodes(true);

    const shaderSemanticsInfos = WebGLStrategyUniform.componentMatrices;
    const shaderSemanticsInfosPointSprite =
      WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray();

    material._setupAdditionalUniformLocations(
      shaderSemanticsInfos.concat(shaderSemanticsInfosPointSprite),
      true
    );

    WebGLStrategyUniform.__globalDataRepository._setUniformLocationsForUniformModeOnly(
      material._shaderProgramUid
    );

    return programUid;
  }

  $load(meshComponent: MeshComponent) {
    const mesh = meshComponent.mesh as Mesh;
    if (!Is.exist(mesh)) {
      return;
    }

    if (!WebGLStrategyCommonMethod.isMaterialsSetup(meshComponent)) {
      this.setupShaderProgram(meshComponent);
    }

    if (!this.isMeshSetup(mesh)) {
      WebGLStrategyCommonMethod.updateVBOAndVAO(mesh);

      const primitiveNum = mesh.getPrimitiveNumber();
      for (let i = 0; i < primitiveNum; i++) {
        const primitive = mesh.getPrimitiveAt(i);
        this.__latestPrimitivePositionAccessorVersions[primitive.primitiveUid] =
          primitive.positionAccessorVersion!;
      }
    }
  }

  isMeshSetup(mesh: Mesh) {
    if (mesh._variationVBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return false;
    }

    const primitiveNum = mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = mesh.getPrimitiveAt(i);
      if (
        Is.not.exist(primitive.vertexHandles) ||
        primitive.positionAccessorVersion !==
          this.__latestPrimitivePositionAccessorVersions[primitive.primitiveUid]
      ) {
        return false;
      }
    }

    return true;
  }

  $prerender(
    meshComponent: MeshComponent,
    meshRendererComponent: MeshRendererComponent,
    instanceIDBufferUid: WebGLResourceHandle
  ) {
    if (meshComponent.mesh == null) {
      return;
    }
  }

  common_$prerender(): void {
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
        console.warn('The buffer size exceeds the size of the data texture.');
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
          internalFormat: TextureParameter.RGBA32F,
          width: MemoryManager.bufferWidthLength,
          height: MemoryManager.bufferHeightLength,
          border: 0,
          format: PixelFormat.RGBA,
          type: ComponentType.Float,
          magFilter: TextureParameter.Nearest,
          minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat,
          wrapT: TextureParameter.Repeat,
          generateMipmap: false,
          anisotropy: false,
          isPremultipliedAlpha: true,
        }
      );
    }
  }

  attachGPUData(primitive: Primitive): void {}

  attachShaderProgram(material: Material): void {}

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
    const vaoHandles = primitive.vertexHandles!;
    const vao = this.__webglResourceRepository.getWebGLResource(
      mesh.getVaoUidsByPrimitiveUid(primitiveUid)
    ) as WebGLVertexArrayObjectOES;
    const gl = glw.getRawContext();

    if (vao != null) {
      glw.bindVertexArray(vao);
    } else {
      this.__webglResourceRepository.setVertexDataToPipeline(
        vaoHandles,
        primitive,
        instanceIDBufferUid
      );
      const ibo = this.__webglResourceRepository.getWebGLResource(
        vaoHandles.iboHandle!
      ) as WebGLBuffer;
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

  common_$render(primitiveUids: Int32Array, renderPass: RenderPass, renderPassTickCount: Count) {
    if (typeof spector !== 'undefined') {
      spector.setMarker('|  |  Uniform:$render#');
    }

    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();

    const isVrMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);
    const displayNumber = WebGLStrategyCommonMethod.getDisplayNumber(isVrMainPass);

    for (let displayIdx = 0; displayIdx < displayNumber; displayIdx++) {
      if (isVrMainPass) {
        WebGLStrategyCommonMethod.setVRViewport(renderPass, displayIdx);
      }

      for (let j = 0; j < renderPass.drawCount; j++) {
        renderPass.doPreEachDraw(j);

        // For opaque primitives
        if (renderPass.toRenderOpaquePrimitives) {
          for (let i = 0; i <= MeshRendererComponent._lastOpaqueIndex; i++) {
            const primitiveUid = primitiveUids[i];
            this.renderInner(
              primitiveUid,
              glw,
              renderPass,
              renderPassTickCount,
              isVrMainPass,
              displayIdx
            );
          }
        }

        // For translucent primitives
        if (renderPass.toRenderTransparentPrimitives) {
          if (!MeshRendererComponent.isDepthMaskTrueForTransparencies) {
            // disable depth write for transparent primitives
            gl.depthMask(false);
          }

          for (
            let i = MeshRendererComponent._lastOpaqueIndex + 1;
            i <= MeshRendererComponent._lastTransparentIndex;
            i++
          ) {
            const primitiveUid = primitiveUids[i];
            this.renderInner(
              primitiveUid,
              glw,
              renderPass,
              renderPassTickCount,
              isVrMainPass,
              displayIdx
            );
          }
          gl.depthMask(true);
        }
      }
    }

    return false;
  }

  renderInner(
    primitiveUid: PrimitiveUID,
    glw: WebGLContextWrapper,
    renderPass: RenderPass,
    renderPassTickCount: Count,
    isVRMainPass: boolean,
    displayIdx: Index
  ) {
    const gl = glw.getRawContext();
    const primitive = Primitive.getPrimitive(primitiveUid);
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    if (WebGLStrategyCommonMethod.isSkipDrawing(material)) {
      return false;
    }
    const mesh = primitive.mesh as Mesh;
    const meshEntities = mesh.meshEntitiesInner;
    for (const entity of meshEntities) {
      if (!entity.getSceneGraph().isVisible || entity.getSceneGraph()._isCulled) {
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

      const shaderProgram = this.__webglResourceRepository.getWebGLResource(
        material._shaderProgramUid
      )! as WebGLProgram;
      const shaderProgramUid = material._shaderProgramUid;

      let firstTime = renderPassTickCount !== this.__lastRenderPassTickCount;

      if (shaderProgramUid !== this.__lastShader) {
        firstTime = true;

        gl.useProgram(shaderProgram);
        gl.uniform1i((shaderProgram as any).dataTexture, 7);
        this.__webglResourceRepository.bindTexture2D(7, this.__dataTextureUid);

        this.__lastShader = shaderProgramUid;
      }

      if (this.__lastMaterial !== material) {
        firstTime = true;
        this.__lastMaterial = material;
      }

      WebGLStrategyCommonMethod.setWebGLParameters(material, gl);
      material._setParametersToGpu({
        material,
        shaderProgram,
        firstTime,
        args: {
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
          isVr: isVRMainPass,
          displayIdx,
        },
      });

      if (primitive.indicesAccessor) {
        gl.drawElements(
          primitive.primitiveMode.index,
          primitive.indicesAccessor.elementCount,
          primitive.indicesAccessor.componentType.index,
          0
        );
      } else {
        gl.drawArrays(primitive.primitiveMode.index, 0, primitive.getVertexCountAsVerticesBased());
      }
    }

    return true;
  }

  $render() {}
}
