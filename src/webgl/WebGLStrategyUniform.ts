import WebGLResourceRepository from './WebGLResourceRepository';
import WebGLStrategy from './WebGLStrategy';
import MeshComponent from '../foundation/components/MeshComponent';
import WebGLContextWrapper from './WebGLContextWrapper';
import Primitive from '../foundation/geometry/Primitive';
import CGAPIResourceRepository from '../foundation/renderer/CGAPIResourceRepository';
import Matrix44 from '../foundation/math/Matrix44';
import Matrix33 from '../foundation/math/Matrix33';
import Entity from '../foundation/core/Entity';
import {
  ShaderSemantics,
  ShaderSemanticsInfo,
} from '../foundation/definitions/ShaderSemantics';
import ComponentRepository from '../foundation/core/ComponentRepository';
import LightComponent from '../foundation/components/LightComponent';
import Config from '../foundation/core/Config';
import {PixelFormat} from '../foundation/definitions/PixelFormat';
import {ComponentType} from '../foundation/definitions/ComponentType';
import {TextureParameter} from '../foundation/definitions/TextureParameter';
import CubeTexture from '../foundation/textures/CubeTexture';
import MeshRendererComponent from '../foundation/components/MeshRendererComponent';
import {CompositionType} from '../foundation/definitions/CompositionType';
import Material from '../foundation/materials/core/Material';
import RenderPass from '../foundation/renderer/RenderPass';
import {
  ShaderVariableUpdateIntervalEnum,
  ShaderVariableUpdateInterval,
} from '../foundation/definitions/ShaderVariableUpdateInterval';
import Mesh from '../foundation/geometry/Mesh';
import MemoryManager from '../foundation/core/MemoryManager';
import {ShaderType} from '../foundation/definitions/ShaderType';
import {
  CGAPIResourceHandle,
  WebGLResourceHandle,
  Index,
  Count,
} from '../commontypes/CommonTypes';
import {BufferUse} from '../foundation/definitions/BufferUse';
import Buffer from '../foundation/memory/Buffer';
import GlobalDataRepository from '../foundation/core/GlobalDataRepository';
import {MiscUtil} from '../foundation/misc/MiscUtil';
import WebGLStrategyCommonMethod from './WebGLStrategyCommonMethod';
import {Is as is} from '../foundation/misc/Is';

type ShaderVariableArguments = {
  glw: WebGLContextWrapper;
  shaderProgram: WebGLProgram;
  primitive: Primitive;
  shaderProgramUid: WebGLResourceHandle;
  entity: Entity;
  worldMatrix: Matrix44;
  normalMatrix: Matrix33;
  renderPass: RenderPass;
  diffuseCube?: CubeTexture;
  specularCube?: CubeTexture;
  firstTime: boolean;
  updateInterval?: ShaderVariableUpdateIntervalEnum;
};

export default class WebGLStrategyUniform implements WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastShader: CGAPIResourceHandle = -1;
  private __lastMaterial?: Material;
  private __lastRenderPassTickCount = -1;
  private __lightComponents?: LightComponent[];
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __vertexShaderMethodDefinitions_uniform: string;

  private constructor() {}

  setupShaderProgram(meshComponent: MeshComponent): void {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent!.mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent!.mesh.getPrimitiveAt(i);
      const material = primitive.material;
      if (material == null || material.isEmptyMaterial()) {
        continue;
      }

      if (
        material._shaderProgramUid !==
        CGAPIResourceRepository.InvalidCGAPIResourceUid
      ) {
        continue;
      }

      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const isPointSprite = primitive.primitiveMode.index === gl.POINTS;

      try {
        this.setupDefaultShaderSemantics(material, isPointSprite);
        primitive._backupMaterial();
      } catch (e) {
        console.log(e);
        primitive._restoreMaterial();
        this.setupDefaultShaderSemantics(primitive.material, isPointSprite);
      }
    }
  }

  setupDefaultShaderSemantics(material: Material, isPointSprite: boolean) {
    // Shader Setup
    const shaderSemanticsInfos: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.VertexAttributesExistenceArray,
        compositionType: CompositionType.ScalarArray,
        componentType: ComponentType.Int,
        stage: ShaderType.VertexShader,
        min: 0,
        max: 1,
        isSystem: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
      },
      {
        semantic: ShaderSemantics.WorldMatrix,
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        isSystem: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
      },
      {
        semantic: ShaderSemantics.NormalMatrix,
        compositionType: CompositionType.Mat3,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        isSystem: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
      },
    ];

    if (isPointSprite) {
      shaderSemanticsInfos.push(
        {
          semantic: ShaderSemantics.PointSize,
          compositionType: CompositionType.Scalar,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: 0,
          max: Number.MAX_VALUE,
          isSystem: true,
          updateInterval: ShaderVariableUpdateInterval.EveryTime,
        },
        {
          semantic: ShaderSemantics.PointDistanceAttenuation,
          compositionType: CompositionType.Vec3,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: 0,
          max: 1,
          isSystem: true,
          updateInterval: ShaderVariableUpdateInterval.EveryTime,
        }
      );
    }

    WebGLStrategyUniform.setupMaterial(material, shaderSemanticsInfos);
  }

  static setupMaterial(material: Material, args?: ShaderSemanticsInfo[]) {
    let infoArray: ShaderSemanticsInfo[];
    if (args != null) {
      infoArray = args;
    } else {
      infoArray = material.fieldsInfoArray;
    }

    WebGLStrategyUniform.__vertexShaderMethodDefinitions_uniform = `
uniform mat4 u_worldMatrix;
uniform mat3 u_normalMatrix;

mat4 get_worldMatrix(float instanceId) {
  return u_worldMatrix;
}

mat3 get_normalMatrix(float instanceId) {
  return u_normalMatrix;
}

#ifdef RN_IS_MORPHING
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
        vec4 val = fetchElement(u_dataTexture, basePosIn16bytes, widthOfDataTexture, heightOfDataTexture);
        addPos = val.xyz;
      } else if (posIn4bytes == 1) {
        vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, widthOfDataTexture, heightOfDataTexture);
        addPos = vec3(val0.yzw);
      } else if (posIn4bytes == 2) {
        vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, widthOfDataTexture, heightOfDataTexture);
        vec4 val1 = fetchElement(u_dataTexture, basePosIn16bytes+1, widthOfDataTexture, heightOfDataTexture);
        addPos = vec3(val0.zw, val1.x);
      } else if (posIn4bytes == 3) {
        vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, widthOfDataTexture, heightOfDataTexture);
        vec4 val1 = fetchElement(u_dataTexture, basePosIn16bytes+1, widthOfDataTexture, heightOfDataTexture);
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
#endif

  `;

    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const glw = webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    material.createProgram(
      WebGLStrategyUniform.__vertexShaderMethodDefinitions_uniform,
      ShaderSemantics.getShaderProperty,
      glw.isWebGL2
    );
    webglResourceRepository.setupUniformLocations(
      material._shaderProgramUid,
      infoArray,
      true
    );
    material.setUniformLocations(material._shaderProgramUid, true);
    WebGLStrategyUniform.__globalDataRepository.setUniformLocations(
      material._shaderProgramUid,
      true
    );

    const shaderProgram = webglResourceRepository.getWebGLResource(
      material._shaderProgramUid
    )! as WebGLProgram;
    (shaderProgram as any).dataTexture = gl.getUniformLocation(
      shaderProgram,
      'u_dataTexture'
    );
    (shaderProgram as any).currentComponentSIDs = gl.getUniformLocation(
      shaderProgram,
      'u_currentComponentSIDs'
    );
  }

  $load(meshComponent: MeshComponent) {
    const mesh = meshComponent.mesh as Mesh;
    if (!is.exist(mesh)) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    if (!WebGLStrategyCommonMethod.isMaterialsSetup(meshComponent)) {
      this.setupShaderProgram(meshComponent);
    }

    if (!WebGLStrategyCommonMethod.isMeshSetup(mesh)) {
      const primitiveNum = mesh.getPrimitiveNumber();
      for (let i = 0; i < primitiveNum; i++) {
        const primitive = mesh.getPrimitiveAt(i);
        primitive.create3DAPIVertexData();
      }
      mesh.updateVariationVBO();
      mesh.updateVAO();
    }
  }

  $prerender(
    meshComponent: MeshComponent,
    meshRendererComponent: MeshRendererComponent,
    instanceIDBufferUid: WebGLResourceHandle
  ) {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }
  }

  common_$prerender(): void {
    const componentRepository = ComponentRepository.getInstance();
    this.__lightComponents = componentRepository.getComponentsWithType(
      LightComponent
    ) as LightComponent[];

    // Setup Data Texture
    if (
      this.__dataTextureUid === CGAPIResourceRepository.InvalidCGAPIResourceUid
    ) {
      const memoryManager: MemoryManager = MemoryManager.getInstance();
      const buffer: Buffer | undefined = memoryManager.getBuffer(
        BufferUse.GPUVertexData
      );
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
        MemoryManager.bufferWidthLength *
        MemoryManager.bufferHeightLength *
        4 *
        4;
      const concatArrayBuffer = MiscUtil.concatArrayBuffers2({
        finalSize: dataTextureByteSize,
        srcs: [buffer.getArrayBuffer()],
        srcsCopySize: [buffer.takenSizeInByte],
        srcsOffset: [0],
      });
      const floatDataTextureBuffer = new Float32Array(concatArrayBuffer);

      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(
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
      } else {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(
          floatDataTextureBuffer,
          {
            level: 0,
            internalFormat: PixelFormat.RGBA,
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
    primitiveIndex: Index,
    glw: WebGLContextWrapper,
    instanceIDBufferUid: WebGLResourceHandle
  ) {
    const vaoHandles = primitive.vertexHandles!;
    const vao = this.__webglResourceRepository.getWebGLResource(
      mesh.getVaoUids(primitiveIndex)
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

  common_$render(
    meshComponentSids: Int32Array,
    meshComponents: MeshComponent[],
    viewMatrix: Matrix44,
    projectionMatrix: Matrix44,
    renderPass: RenderPass
  ) {
    return false;
  }

  $render(
    idx: Index,
    meshComponent: MeshComponent,
    worldMatrix: Matrix44,
    normalMatrix: Matrix33,
    entity: Entity,
    renderPass: RenderPass,
    renderPassTickCount: Count,
    diffuseCube?: CubeTexture,
    specularCube?: CubeTexture
  ) {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();

    WebGLStrategyCommonMethod.startDepthMasking(idx, gl, renderPass);

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      const material: Material = renderPass.getAppropriateMaterial(
        primitive,
        primitive.material!
      );
      if (WebGLStrategyCommonMethod.isSkipDrawing(material, idx)) {
        continue;
      }

      this.attachVertexDataInner(
        meshComponent.mesh,
        primitive,
        i,
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

      WebGLStrategyCommonMethod.setCullAndBlendSettings(
        material,
        renderPass,
        gl
      );
      material._setParametersForGPU({
        material,
        shaderProgram,
        firstTime,
        args: {
          setUniform: true,
          glw: glw,
          entity: entity,
          primitive: primitive,
          worldMatrix: worldMatrix,
          normalMatrix: normalMatrix,
          lightComponents: this.__lightComponents,
          renderPass: renderPass,
          diffuseCube: diffuseCube,
          specularCube: specularCube,
        },
      });

      if (primitive.indicesAccessor) {
        glw.drawElementsInstanced(
          primitive.primitiveMode.index,
          primitive.indicesAccessor.elementCount,
          primitive.indicesAccessor.componentType.index,
          0,
          1
        );
      } else {
        glw.drawArraysInstanced(
          primitive.primitiveMode.index,
          0,
          primitive.getVertexCountAsVerticesBased(),
          1
        );
      }
      // this.dettachVertexData(glw);
    }

    WebGLStrategyCommonMethod.endDepthMasking(idx, gl, renderPass);
    this.__lastRenderPassTickCount = renderPassTickCount;
  }
}
