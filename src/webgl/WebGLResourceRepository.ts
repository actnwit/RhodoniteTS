import HDRImage from '../../vendor/hdrpng.js';
import { Config } from '../foundation/core/Config';
import { BasisCompressionType, type BasisCompressionTypeEnum } from '../foundation/definitions/BasisCompressionType';
import type { ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { CompositionType } from '../foundation/definitions/CompositionType';
import type { CompressionTextureTypeEnum } from '../foundation/definitions/CompressionTextureType';
import { HdriFormat, type HdriFormatEnum } from '../foundation/definitions/HdriFormat';
import { PixelFormat, type PixelFormatEnum } from '../foundation/definitions/PixelFormat';
import { ProcessApproach } from '../foundation/definitions/ProcessApproach';
import { RenderBufferTarget } from '../foundation/definitions/RenderBufferTarget';
import type { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { TextureFormat, type TextureFormatEnum } from '../foundation/definitions/TextureFormat';
import { TextureParameter, type TextureParameterEnum } from '../foundation/definitions/TextureParameter';
import { VertexAttribute, type VertexAttributeEnum } from '../foundation/definitions/VertexAttribute';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import { Vector4 } from '../foundation/math/Vector4';
import type { Accessor } from '../foundation/memory/Accessor';
import { DataUtil } from '../foundation/misc/DataUtil';
import { Is } from '../foundation/misc/Is';
import { Logger } from '../foundation/misc/Logger';
import { MiscUtil } from '../foundation/misc/MiscUtil';
import {
  CGAPIResourceRepository,
  type DirectTextureData,
  type ICGAPIResourceRepository,
  type ImageBitmapData,
} from '../foundation/renderer/CGAPIResourceRepository';
import type { FrameBuffer } from '../foundation/renderer/FrameBuffer';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import { SystemState } from '../foundation/system/SystemState';
import type { AbstractTexture } from '../foundation/textures/AbstractTexture';
import type { CubeTexture } from '../foundation/textures/CubeTexture';
import type { IRenderable } from '../foundation/textures/IRenderable';
import type { RenderBuffer } from '../foundation/textures/RenderBuffer';
import { RenderTargetTexture } from '../foundation/textures/RenderTargetTexture';
import { RenderTargetTexture2DArray } from '../foundation/textures/RenderTargetTexture2DArray';
import { Sampler } from '../foundation/textures/Sampler';
import { TextureArray } from '../foundation/textures/TextureArray';
import type { BasisFile } from '../types/BasisTexture';
import type {
  ArrayType,
  Byte,
  CGAPIResourceHandle,
  Count,
  Index,
  Size,
  TypedArray,
  WebGLResourceHandle,
  WebGPUResourceHandle,
} from '../types/CommonTypes';
import { GL_TEXTURE_2D } from '../types/WebGLConstants';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import type { RnWebGLProgram, RnWebGLTexture } from './WebGLExtendedTypes';
import { WebGLExtension } from './WebGLExtension';
import { WebGLStereoUtil } from './WebGLStereoUtil';
import getRenderingStrategy from './getRenderingStrategy';
import type { AttributeNames } from './types';

export type VertexHandles = {
  vaoHandle: CGAPIResourceHandle;
  iboHandle?: CGAPIResourceHandle;
  vboHandles: Array<CGAPIResourceHandle>;
  attributesFlags: Array<boolean>;
  setComplete: boolean;
};

export type TextureData = {
  level: Count;
  width: Count;
  height: Count;
  buffer: ArrayBufferView;
};

export type WebGLStates = {
  // Enabled states (gl.isEnabled)
  depthTest: boolean;
  stencilTest: boolean;
  blend: boolean;
  dither: boolean;
  scissorTest: boolean;
  polygonOffsetFill: boolean;
  sampleCoverage: boolean;
  sampleAlphaToCoverage: boolean;
  cullFace: boolean;
  rasterizerDiscard: boolean;

  // Depth states
  depthFunc: number;
  depthWriteMask: boolean;
  depthClearValue: number;
  depthRange: [number, number];

  // Stencil states
  stencilFunc: number;
  stencilValueMask: number;
  stencilRef: number;
  stencilBackFunc: number;
  stencilBackValueMask: number;
  stencilBackRef: number;
  stencilFail: number;
  stencilPassDepthFail: number;
  stencilPassDepthPass: number;
  stencilBackFail: number;
  stencilBackPassDepthFail: number;
  stencilBackPassDepthPass: number;
  stencilWriteMask: number;
  stencilBackWriteMask: number;
  stencilClearValue: number;

  // Blend states
  blendSrcRgb: number;
  blendDstRgb: number;
  blendSrcAlpha: number;
  blendDstAlpha: number;
  blendEquationRgb: number;
  blendEquationAlpha: number;
  blendColor: [number, number, number, number];

  // Color states
  colorClearValue: [number, number, number, number];
  colorWriteMask: [boolean, boolean, boolean, boolean];

  // Cull states
  cullFaceMode: number;
  frontFace: number;

  // Polygon offset states
  polygonOffsetFactor: number;
  polygonOffsetUnits: number;

  // Sample coverage states
  sampleCoverageValue: number;
  sampleCoverageInvert: boolean;

  // Scissor states
  scissorBox: [number, number, number, number];

  // Viewport states
  viewport: [number, number, number, number];

  // Line width
  lineWidth: number;

  // Binding states
  activeTexture: number;
  textureBindings: Array<{
    texture2D: WebGLTexture | null;
    textureCubeMap: WebGLTexture | null;
    texture3D: WebGLTexture | null;
    texture2DArray: WebGLTexture | null;
    sampler: WebGLSampler | null;
  }>;
  arrayBufferBinding: WebGLBuffer | null;
  elementArrayBufferBinding: WebGLBuffer | null;
  uniformBufferBinding: WebGLBuffer | null;
  transformFeedbackBinding: WebGLTransformFeedback | null;
  copyReadBufferBinding: WebGLBuffer | null;
  copyWriteBufferBinding: WebGLBuffer | null;
  pixelPackBufferBinding: WebGLBuffer | null;
  pixelUnpackBufferBinding: WebGLBuffer | null;
  readFramebufferBinding: WebGLFramebuffer | null;
  drawFramebufferBinding: WebGLFramebuffer | null;
  renderbufferBinding: WebGLRenderbuffer | null;
  vertexArrayBinding: WebGLVertexArrayObject | null;
  currentProgram: WebGLProgram | null;
};

export type WebGLResource =
  | WebGLBuffer
  | WebGLFramebuffer
  | WebGLObject
  | WebGLProgram
  | WebGLRenderbuffer
  | WebGLTexture
  | WebGLTransformFeedback;

/**
 * A comprehensive repository for managing WebGL resources including buffers, textures, shaders, and framebuffers.
 * This class provides a centralized interface for creating, managing, and disposing of WebGL resources
 * while maintaining resource handles for efficient memory management.
 *
 * @example
 * ```typescript
 * const repository = WebGLResourceRepository.getInstance();
 * const textureHandle = repository.createTextureFromImageBitmapData(imageData, options);
 * ```
 */
export class WebGLResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
  private static __instance: WebGLResourceRepository;
  private __webglContexts: Map<string, WebGLContextWrapper> = new Map();
  private __glw?: WebGLContextWrapper;
  private __resourceCounter: number = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __webglResources: Map<WebGLResourceHandle, WebGLResource> = new Map();
  private __samplerClampToEdgeLinearUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __samplerClampToEdgeNearestUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __samplerRepeatNearestUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __samplerRepeatLinearUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __samplerShadowUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __samplerRepeatTriLinearUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __samplerRepeatAnisotropyLinearUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;

  private constructor() {
    super();
  }

  /**
   * Gets the singleton instance of WebGLResourceRepository.
   *
   * @returns The singleton instance of WebGLResourceRepository
   */
  static getInstance(): WebGLResourceRepository {
    if (!this.__instance) {
      this.__instance = new WebGLResourceRepository();
    }
    return this.__instance;
  }

  /**
   * Adds an existing WebGL2 context to the repository.
   *
   * @param gl - The WebGL2 rendering context to add
   * @param canvas - The HTML canvas element associated with the context
   * @param asCurrent - Whether to set this context as the current active context
   */
  addWebGLContext(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, asCurrent: boolean) {
    const glw = new WebGLContextWrapper(gl, canvas);
    this.__webglContexts.set('default', glw);
    if (asCurrent) {
      this.__glw = glw;
    }
  }

  /**
   * Generates a new WebGL2 context for the given canvas element.
   *
   * @param canvas - The HTML canvas element to create the context for
   * @param asCurrent - Whether to set this context as the current active context
   * @param webglOption - Optional WebGL context attributes for context creation
   * @returns The created WebGL2 rendering context
   */
  generateWebGLContext(canvas: HTMLCanvasElement, asCurrent: boolean, webglOption?: WebGLContextAttributes) {
    const gl = canvas.getContext('webgl2', webglOption) as WebGL2RenderingContext;
    this.addWebGLContext(gl, canvas, asCurrent);

    if (MiscUtil.isSafari()) {
      // Safari (WebGL2 via Metal) does't support UBO properly at 2022/04/15
      Config.isUboEnabled = false;
    }

    return gl;
  }

  /**
   * Gets the current WebGL context wrapper.
   *
   * @returns The current WebGLContextWrapper instance or undefined if none is set
   */
  get currentWebGLContextWrapper() {
    return this.__glw;
  }

  /**
   * Generates a unique resource handle for WebGL objects.
   *
   * @returns A unique WebGL resource handle
   */
  private getResourceNumber(): WebGLResourceHandle {
    return ++this.__resourceCounter;
  }

  /**
   * Registers a WebGL object and assigns it a unique handle.
   *
   * @param obj - The WebGL object to register
   * @returns The assigned resource handle
   */
  private __registerResource(obj: WebGLResource) {
    const handle = this.getResourceNumber();
    (obj as any)._resourceUid = handle;
    this.__webglResources.set(handle, obj);
    return handle;
  }

  /**
   * Retrieves a WebGL resource by its handle.
   *
   * @param WebGLResourceHandle - The handle of the resource to retrieve
   * @returns The WebGL resource or null if not found
   */
  getWebGLResource(WebGLResourceHandle: WebGLResourceHandle): WebGLResource | null {
    const result = this.__webglResources.get(WebGLResourceHandle);
    return result ?? null;
  }

  /**
   * Creates an index buffer from the provided accessor data.
   *
   * @param accessor - The accessor containing index data
   * @returns The handle of the created index buffer
   * @throws Error if no WebGL context is available
   */
  createIndexBuffer(accessor: Accessor) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    this.__glw!.bindVertexArray(null);
    const ibo = gl.createBuffer();
    const resourceHandle = this.__registerResource(ibo!);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    //    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, accessor.bufferView.buffer.getArrayBuffer(), gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, accessor.getTypedArray(), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return resourceHandle;
  }

  /**
   * Updates an existing index buffer with new data from the accessor.
   *
   * @param accessor - The accessor containing new index data
   * @param resourceHandle - The handle of the index buffer to update
   * @throws Error if no WebGL context is available or IBO not found
   */
  updateIndexBuffer(accessor: Accessor, resourceHandle: number) {
    const glw = this.__glw as WebGLContextWrapper;
    const gl = glw?.getRawContext() as WebGLRenderingContext | WebGL2RenderingContext;
    if (Is.not.exist(gl)) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const ibo = this.__webglResources.get(resourceHandle) as WebGLBuffer;
    if (Is.not.exist(ibo)) {
      throw new Error('Not found IBO.');
    }

    glw.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, accessor.getTypedArray());
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  /**
   * Creates a vertex buffer from the provided accessor data.
   *
   * @param accessor - The accessor containing vertex data
   * @returns The handle of the created vertex buffer
   * @throws Error if no WebGL context is available
   */
  createVertexBuffer(accessor: Accessor) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    this.__glw!.bindVertexArray(null);
    const vbo = gl.createBuffer();
    const resourceHandle = this.__registerResource(vbo!);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, accessor.getUint8Array(), gl.STATIC_DRAW);
    //    gl.bufferData(gl.ARRAY_BUFFER, accessor.getTypedArray(), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return resourceHandle;
  }

  /**
   * Creates a vertex buffer directly from a typed array.
   *
   * @param typedArray - The typed array containing vertex data
   * @returns The handle of the created vertex buffer
   * @throws Error if no WebGL context is available
   */
  createVertexBufferFromTypedArray(typedArray: TypedArray) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    this.__glw!.bindVertexArray(null);
    const vbo = gl.createBuffer();
    const resourceHandle = this.__registerResource(vbo!);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return resourceHandle;
  }

  /**
   * Updates an existing vertex buffer with new data from the accessor.
   *
   * @param accessor - The accessor containing new vertex data
   * @param resourceHandle - The handle of the vertex buffer to update
   * @throws Error if no WebGL context is available or VBO not found
   */
  updateVertexBuffer(accessor: Accessor, resourceHandle: number) {
    const glw = this.__glw as WebGLContextWrapper;
    const gl = glw?.getRawContext() as WebGLRenderingContext | WebGL2RenderingContext;
    if (!Is.exist(gl)) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const vbo = this.__webglResources.get(resourceHandle) as WebGLBuffer;
    if (!Is.exist(vbo)) {
      throw new Error('Not found VBO.');
    }

    glw.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, accessor.bufferView.getUint8Array());
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /**
   * Creates a new vertex array object (VAO).
   *
   * @returns The handle of the created VAO or undefined if creation failed
   * @throws Error if no WebGL context is available
   */
  createVertexArray() {
    const gl = this.__glw;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const vao = this.__glw!.createVertexArray();
    if (Is.not.exist(vao)) {
      return undefined;
    }

    const resourceHandle = this.__registerResource(vao);

    return resourceHandle;
  }

  /**
   * Binds a 2D texture to the specified texture slot.
   *
   * @param textureSlotIndex - The texture slot index to bind to
   * @param textureUid - The handle of the texture to bind
   */
  bindTexture2D(textureSlotIndex: Index, textureUid: CGAPIResourceHandle) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    this.__glw!.bindTexture2D(textureSlotIndex, texture);
  }

  /**
   * Binds a texture sampler to the specified texture slot.
   *
   * @param textureSlotIndex - The texture slot index to bind to
   * @param samplerUid - The handle of the sampler to bind, or -1 to unbind
   */
  bindTextureSampler(textureSlotIndex: Index, samplerUid: CGAPIResourceHandle) {
    if (samplerUid === -1) {
      this.__glw!.bindTextureSampler(textureSlotIndex, null as any);
    } else {
      const sampler = this.getWebGLResource(samplerUid) as WebGLSampler;
      this.__glw!.bindTextureSampler(textureSlotIndex, sampler);
    }
  }

  /**
   * Binds a cube texture to the specified texture slot.
   *
   * @param textureSlotIndex - The texture slot index to bind to
   * @param textureUid - The handle of the cube texture to bind
   */
  bindTextureCube(textureSlotIndex: Index, textureUid: CGAPIResourceHandle) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    this.__glw!.bindTextureCube(textureSlotIndex, texture);
  }

  /**
   * Binds a 2D texture array to the specified texture slot.
   *
   * @param textureSlotIndex - The texture slot index to bind to
   * @param textureUid - The handle of the 2D texture array to bind
   */
  bindTexture2DArray(textureSlotIndex: Index, textureUid: CGAPIResourceHandle) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    this.__glw!.bindTexture2DArray(textureSlotIndex, texture);
  }

  /**
   * Creates vertex buffers and index buffers for a primitive and returns handles for them.
   * This method processes all vertex attributes of the primitive and creates corresponding VBOs.
   *
   * @param primitive - The primitive object containing vertex and index data
   * @returns VertexHandles object containing all created buffer handles and metadata
   */
  createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles {
    let iboHandle: WebGLResourceHandle;
    if (primitive.hasIndices()) {
      iboHandle = this.createIndexBuffer(primitive.indicesAccessor!);
    }

    const attributesFlags: boolean[] = [];
    for (let i = 0; i < VertexAttribute.AttributeTypeNumber; i++) {
      attributesFlags[i] = false;
    }
    const vboHandles: Array<WebGLResourceHandle> = [];
    primitive.attributeAccessors.forEach((accessor: Accessor, i: number) => {
      const vboHandle = this.createVertexBuffer(accessor);
      const slotIdx = VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]);
      attributesFlags[slotIdx] = true;
      vboHandles.push(vboHandle);
    });

    return {
      vaoHandle: -1,
      iboHandle: iboHandle!,
      vboHandles: vboHandles,
      attributesFlags: attributesFlags,
      setComplete: false,
    };
  }

  /**
   * Updates existing vertex buffers and index buffers with new data from a primitive.
   *
   * @param primitive - The primitive object containing updated vertex and index data
   * @param vertexHandles - The handles of the buffers to update
   */
  updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles) {
    if (vertexHandles.iboHandle) {
      this.updateIndexBuffer(primitive.indicesAccessor as Accessor, vertexHandles.iboHandle);
    }

    const attributeAccessors = primitive.attributeAccessors;
    for (let i = 0; i < attributeAccessors.length; i++) {
      this.updateVertexBuffer(attributeAccessors[i], vertexHandles.vboHandles[i]);
    }
  }

  /**
   * Creates and compiles a shader program from vertex and fragment shader source code.
   * This method handles shader compilation, linking, and error reporting.
   *
   * @param params - Configuration object for shader program creation
   * @param params.material - The material associated with this shader program
   * @param params.primitive - The primitive that will use this shader program
   * @param params.vertexShaderStr - The vertex shader source code
   * @param params.fragmentShaderStr - The fragment shader source code
   * @param params.attributeNames - Array of vertex attribute names
   * @param params.attributeSemantics - Array of vertex attribute semantics
   * @param params.onError - Optional error callback function
   * @returns The handle of the created shader program, or InvalidCGAPIResourceUid on failure
   * @throws Error if no WebGL context is available
   */
  createShaderProgram({
    material,
    primitive,
    vertexShaderStr,
    fragmentShaderStr,
    attributeNames,
    attributeSemantics,
    onError,
  }: {
    material: Material;
    primitive: Primitive;
    vertexShaderStr: string;
    fragmentShaderStr: string;
    attributeNames: AttributeNames;
    attributeSemantics: VertexAttributeEnum[];
    onError?: (message: string) => void;
  }): WebGPUResourceHandle {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }
    const isDebugMode = Config.cgApiDebugConsoleOutput;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderStr);
    gl.compileShader(vertexShader);
    if (isDebugMode) {
      const result = this.__checkShaderCompileStatus(material.materialTypeName, vertexShader, vertexShaderStr, onError);

      if (!result) {
        return CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderStr);
    gl.compileShader(fragmentShader);
    if (isDebugMode) {
      this.__checkShaderCompileStatus(material.materialTypeName, fragmentShader, fragmentShaderStr, onError);
    }

    const shaderProgram = gl.createProgram()! as RnWebGLProgram;
    shaderProgram._gl = gl;
    shaderProgram._materialTypeName = material.materialTypeName;
    if (isDebugMode) {
      shaderProgram._vertexShaderStr = vertexShaderStr;
      shaderProgram._fragmentShaderStr = fragmentShaderStr;
    }
    shaderProgram._shaderSemanticsInfoMap = new Map();
    shaderProgram._material = new WeakRef(material);
    shaderProgram._primitive = new WeakRef(primitive);

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    attributeNames.forEach((attributeName: string, i: number) => {
      gl.bindAttribLocation(shaderProgram, attributeSemantics[i].getAttributeSlot(), attributeName);
    });

    gl.linkProgram(shaderProgram);

    if (isDebugMode) {
      const result = this.__checkShaderProgramLinkStatus(
        material.materialTypeName,
        shaderProgram,
        vertexShaderStr,
        fragmentShaderStr
      );

      if (!result) {
        return CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
    }

    shaderProgram.__SPECTOR_rebuildProgram = this.rebuildProgramBySpector.bind(shaderProgram);

    const resourceHandle = this.__registerResource(shaderProgram);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return resourceHandle;
  }

  /**
   * Validates shader compilation status and logs errors if compilation fails.
   *
   * @param materialTypeName - The name of the material type for error context
   * @param shader - The compiled shader object to check
   * @param shaderText - The shader source code for error reporting
   * @param onError - Optional error callback function
   * @returns True if compilation succeeded, false otherwise
   */
  private __checkShaderCompileStatus(
    materialTypeName: string,
    shader: WebGLShader,
    shaderText: string,
    onError?: (message: string) => void
  ): boolean {
    const glw = this.__glw!;
    const gl = glw!.getRawContext();
    if (Is.false(gl.getShaderParameter(shader, gl.COMPILE_STATUS)) && Is.false(gl.isContextLost())) {
      Logger.info(`MaterialTypeName: ${materialTypeName}`);
      const lineNumberedShaderText = MiscUtil.addLineNumberToCode(shaderText);
      Logger.info(lineNumberedShaderText);
      const log = gl.getShaderInfoLog(shader);
      if (onError === undefined) {
        Logger.error(`An error occurred compiling the shaders:${log}`);
        return false;
      }
      onError(log!);
      return false;
    }
    return true;
  }

  /**
   * Validates shader program linking status and logs errors if linking fails.
   *
   * @param materialTypeName - The name of the material type for error context
   * @param shaderProgram - The linked shader program to check
   * @param vertexShaderText - The vertex shader source code for error reporting
   * @param fragmentShaderText - The fragment shader source code for error reporting
   * @returns True if linking succeeded, false otherwise
   */
  private __checkShaderProgramLinkStatus(
    materialTypeName: string,
    shaderProgram: WebGLProgram,
    vertexShaderText: string,
    fragmentShaderText: string
  ): boolean {
    const glw = this.__glw!;
    const gl = glw!.getRawContext();

    // If creating the shader program failed, alert
    if (Is.false(gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) && Is.false(gl.isContextLost())) {
      Logger.info(`MaterialTypeName: ${materialTypeName}`);
      Logger.info(MiscUtil.addLineNumberToCode('Vertex Shader:'));
      Logger.info(MiscUtil.addLineNumberToCode(vertexShaderText));
      Logger.info(MiscUtil.addLineNumberToCode('Fragment Shader:'));
      Logger.info(MiscUtil.addLineNumberToCode(fragmentShaderText));
      const log = gl.getProgramInfoLog(shaderProgram);
      Logger.error(`Unable to initialize the shader program: ${log}`);
      return false;
    }

    return true;
  }

  /**
   * Sets up uniform locations for a shader program based on shader semantics information.
   * This method extracts uniform locations from the compiled shader program and stores them
   * for efficient access during rendering.
   *
   * @param shaderProgramUid - The handle of the shader program
   * @param infoArray - Array of shader semantics information
   * @param isUniformOnlyMode - Whether to set up only uniform locations
   * @returns The WebGL program object with configured uniform locations
   */
  setupUniformLocations(
    shaderProgramUid: WebGLResourceHandle,
    infoArray: ShaderSemanticsInfo[],
    isUniformOnlyMode: boolean
  ): WebGLProgram {
    const glw = this.__glw!;
    const gl = glw.getRawContext();
    const shaderProgram = this.getWebGLResource(shaderProgramUid) as RnWebGLProgram;

    const infoArrayLen = infoArray.length;
    for (let i = 0; i < infoArrayLen; i++) {
      const info = infoArray[i];
      shaderProgram._shaderSemanticsInfoMap.set(info.semantic, info);
    }

    for (let i = 0; i < infoArrayLen; i++) {
      const info = infoArray[i];
      const isUniformExist =
        isUniformOnlyMode || info.needUniformInDataTextureMode || CompositionType.isTexture(info.compositionType);

      if (isUniformExist) {
        const semanticSingular = info.semantic;

        const identifier = semanticSingular;

        const shaderVarName = `u_${info.semantic}`;

        const location = gl.getUniformLocation(shaderProgram, shaderVarName);
        const _shaderProgram = shaderProgram as any;
        _shaderProgram[identifier] = location;
        if (location == null && Config.cgApiDebugConsoleOutput) {
          Logger.info(
            `Can not get the uniform location: ${shaderVarName}. The uniform may be unused by other code so implicitly removed.`
          );
        }
      }
    }

    return shaderProgram;
  }

  /**
   * Sets up basic uniform locations required for data texture operations.
   *
   * @param shaderProgramUid - The handle of the shader program to configure
   */
  setupBasicUniformLocations(shaderProgramUid: WebGLResourceHandle) {
    const shaderProgram = this.getWebGLResource(shaderProgramUid) as RnWebGLProgram;
    const gl = this.currentWebGLContextWrapper!.getRawContext();
    (shaderProgram as any).dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    (shaderProgram as any).currentComponentSIDs = gl.getUniformLocation(shaderProgram, 'u_currentComponentSIDs');
  }

  /**
   * Sets a uniform value for texture binding and binds the texture to the appropriate slot.
   *
   * @param shaderProgram_ - The shader program to set the uniform for
   * @param semanticStr - The semantic string identifying the uniform
   * @param value - The value array containing texture slot index and texture data
   */
  setUniform1iForTexture(shaderProgram_: WebGLProgram, semanticStr: string, value: any) {
    const shaderProgram = shaderProgram_ as RnWebGLProgram;
    const info = shaderProgram._shaderSemanticsInfoMap.get(semanticStr);
    if (info == null) {
      return;
    }
    const gl = this.__glw!.getRawContext();
    const loc: WebGLUniformLocation = (shaderProgram as any)[semanticStr];
    gl.uniform1i(loc, value[0]);
    this.bindTexture(info, value);
  }

  /**
   * Sets a uniform value in the shader program with automatic type detection and conversion.
   * This method handles various composition types including matrices, vectors, and textures.
   *
   * @param shaderProgram_ - The shader program to set the uniform for
   * @param semanticStr - The semantic string identifying the uniform
   * @param firstTime - Whether this is the first time setting this uniform
   * @param value - The value to set (can be scalar, vector, matrix, or texture data)
   * @returns True if the uniform was successfully set, false otherwise
   */
  setUniformValue(shaderProgram_: WebGLProgram, semanticStr: string, _firstTime: boolean, value: any) {
    const shaderProgram = shaderProgram_ as RnWebGLProgram;
    const info = shaderProgram._shaderSemanticsInfoMap.get(semanticStr);
    if (info == null) {
      return false;
    }

    let setAsMatrix = false;
    let componentNumber = 0;
    if (info.compositionType === CompositionType.Mat3) {
      setAsMatrix = true;
      componentNumber = 3;
    } else if (info.compositionType === CompositionType.Mat4) {
      setAsMatrix = true;
      componentNumber = 4;
    } else if (info.compositionType === CompositionType.Mat3Array) {
      setAsMatrix = true;
      componentNumber = 3;
    } else if (info.compositionType === CompositionType.Mat4Array) {
      setAsMatrix = true;
      componentNumber = 4;
    } else {
      componentNumber = info.compositionType!.getNumberOfComponents();
    }

    const isCompositionTypeArray =
      info.compositionType === CompositionType.ScalarArray ||
      info.compositionType === CompositionType.Vec4Array ||
      info.compositionType === CompositionType.Vec3Array ||
      info.compositionType === CompositionType.Vec2Array;
    const isCompositionTypeTexture = CompositionType.isTexture(info.compositionType);
    const key = semanticStr;

    let updated = false;
    if (isCompositionTypeTexture) {
      updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, false, {
        x: value[0],
      });
      this.bindTexture(info, value);
    } else if (isCompositionTypeArray) {
      if (value._v == null) {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, true, {
          x: value,
        });
      } else {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, true, {
          x: value._v,
        });
      }
    } else if (info.compositionType === CompositionType.Scalar) {
      if (value._v == null) {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, false, {
          x: value,
        });
      } else {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, true, {
          x: value._v,
        });
      }
    } else {
      // if CompositionType.Vec*|Mat*, then...
      if (value._v == null) {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, false, value);
      } else {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, true, {
          x: value._v,
        });
      }
    }

    return updated;
  }

  /**
   * Binds textures and samplers based on the composition type information.
   * This method handles different texture types including 2D, cube, and texture arrays.
   *
   * @param info - The shader semantics info containing composition type details
   * @param value - Array containing texture slot, texture object, and sampler
   */
  bindTexture(info: ShaderSemanticsInfo, value: [number, AbstractTexture, Sampler]) {
    if (
      info.compositionType === CompositionType.Texture2D ||
      info.compositionType === CompositionType.Texture2DShadow
    ) {
      this.bindTexture2D(value[0], value[1]._textureResourceUid);
      if (value[2] != null) {
        // value[2] must be Sampler object
        this.bindTextureSampler(value[0], value[2]._samplerResourceUid);
        // } else {
        //   this.bindTextureSampler(value[0], -1);
        // }
      } else {
        if (info.compositionType === CompositionType.Texture2D) {
          const samplerUid = this.createOrGetTextureSamplerClampToEdgeLinear();
          this.bindTextureSampler(value[0], samplerUid);
        } else if (info.compositionType === CompositionType.Texture2DShadow) {
          const samplerUid = this.createOrGetTextureSamplerShadow();
          this.bindTextureSampler(value[0], samplerUid);
        }
      }
    } else if (info.compositionType === CompositionType.TextureCube) {
      this.bindTextureCube(value[0], value[1]._textureResourceUid);
      if (value[2] != null) {
        // value[2] must be Sampler object
        this.bindTextureSampler(value[0], value[2]._samplerResourceUid);
      } else {
        // this.bindTextureSampler(value[0], -1);
        const textureCube = value[1] as CubeTexture;
        // const samplerUid = this.createOrGetTextureSamplerRepeatTriLinear();
        this.bindTextureSampler(value[0], textureCube._recommendedTextureSampler?._samplerResourceUid ?? -1);
      }
    } else if (info.compositionType === CompositionType.Texture2DArray) {
      this.bindTexture2DArray(value[0], value[1]._textureResourceUid);
      if (value[2] != null) {
        // value[2] must be Sampler object
        this.bindTextureSampler(value[0], value[2]._samplerResourceUid);
      } else {
        const samplerUid = this.createOrGetTextureSamplerClampToEdgeLinear();
        this.bindTextureSampler(value[0], samplerUid);
      }
    }
  }

  /**
   * Internal method for setting uniform values with proper WebGL calls based on data type.
   * This method handles the actual WebGL uniform* calls with appropriate type conversion.
   *
   * @param shaderProgram - The shader program to set the uniform for
   * @param semanticStr - The semantic string identifying the uniform
   * @param info - The shader semantics information
   * @param isMatrix - Whether the value is a matrix
   * @param componentNumber - Number of components in the value
   * @param isVector - Whether the value is a vector/array
   * @param param6 - Object containing the value components
   * @param param6.x - Primary value component
   * @param param6.y - Second value component (optional)
   * @param param6.z - Third value component (optional)
   * @param param6.w - Fourth value component (optional)
   * @returns True if the uniform was successfully set, false if location not found
   */
  setUniformValueInner(
    shaderProgram: WebGLProgram,
    semanticStr: string,
    info: ShaderSemanticsInfo,
    isMatrix: boolean,
    componentNumber: number,
    isVector: boolean,
    {
      x,
      y,
      z,
      w,
    }: {
      x: number | ArrayType | boolean;
      y?: number | boolean;
      z?: number | boolean;
      w?: number | boolean;
    }
  ) {
    const identifier = semanticStr;
    const loc: WebGLUniformLocation = (shaderProgram as any)[identifier];
    if (loc == null) {
      return false;
    }
    const uLocation: WebGLUniformLocation = loc;

    const gl = this.__glw!.getRawContext() as any;

    if (isMatrix) {
      if (componentNumber === 4) {
        gl.uniformMatrix4fv(uLocation, false, x);
      } else {
        gl.uniformMatrix3fv(uLocation, false, x);
      }
    } else if (isVector) {
      const componentType =
        info.componentType === ComponentType.Int ||
        info.componentType === ComponentType.Short ||
        info.componentType === ComponentType.Byte;
      if (componentNumber === 1) {
        if (componentType) {
          gl.uniform1iv(uLocation, x);
        } else {
          gl.uniform1fv(uLocation, x);
        }
      } else if (componentNumber === 2) {
        if (componentType) {
          gl.uniform2iv(uLocation, x);
        } else {
          gl.uniform2fv(uLocation, x);
        }
      } else if (componentNumber === 3) {
        if (componentType) {
          gl.uniform3iv(uLocation, x);
        } else {
          gl.uniform3fv(uLocation, x);
        }
      } else if (componentNumber === 4) {
        if (componentType) {
          gl.uniform4iv(uLocation, x);
        } else {
          gl.uniform4fv(uLocation, x);
        }
      }
    } else {
      const componentType =
        info.componentType === ComponentType.Int ||
        info.componentType === ComponentType.Short ||
        info.componentType === ComponentType.Byte;
      if (componentNumber === 1) {
        if (componentType) {
          gl.uniform1i(uLocation, x);
        } else {
          gl.uniform1f(uLocation, x);
        }
      } else if (componentNumber === 2) {
        if (componentType) {
          gl.uniform2i(uLocation, x, y);
        } else {
          gl.uniform2f(uLocation, x, y);
        }
      } else if (componentNumber === 3) {
        if (componentType) {
          gl.uniform3i(uLocation, x, y, z);
        } else {
          gl.uniform3f(uLocation, x, y, z);
        }
      } else if (componentNumber === 4) {
        if (componentType) {
          gl.uniform4i(uLocation, x, y, z, w);
        } else {
          gl.uniform4f(uLocation, x, y, z, w);
        }
      }
    }

    return true;
  }

  /**
   * Configures vertex data for rendering by setting up VAO with VBOs and IBO.
   * This method binds vertex arrays, index buffers, and configures vertex attribute pointers.
   *
   * @param handles - Object containing VAO, IBO, and VBO handles
   * @param handles.vaoHandle - Handle to the vertex array object
   * @param handles.iboHandle - Handle to the index buffer object (optional)
   * @param handles.vboHandles - Array of vertex buffer object handles
   * @param primitive - The primitive object containing vertex attribute information
   * @param instanceIDBufferUid - Handle to instance ID buffer for instanced rendering (optional)
   * @throws Error if required buffers are not found
   */
  setVertexDataToPipeline(
    {
      vaoHandle,
      iboHandle,
      vboHandles,
    }: {
      vaoHandle: WebGLResourceHandle;
      iboHandle?: WebGLResourceHandle;
      vboHandles: Array<WebGLResourceHandle>;
    },
    primitive: Primitive,
    instanceIDBufferUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid
  ) {
    const gl = this.__glw!.getRawContext();

    const vao = this.getWebGLResource(vaoHandle) as WebGLVertexArrayObjectOES;

    // VAO bind
    this.__glw!.bindVertexArray(vao!);

    // IBO bind
    if (iboHandle != null) {
      const ibo = this.getWebGLResource(iboHandle) as WebGLBuffer;
      if (ibo != null) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      } else {
        throw new Error('Nothing Element Array Buffer!');
      }
    }

    // bind vertex attributes to VBO's
    vboHandles.forEach((vboHandle, i) => {
      const vbo = this.getWebGLResource(vboHandle) as WebGLBuffer;
      if (vbo != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      } else {
        throw new Error(`Nothing Element Array Buffer at index ${i}`);
      }
      gl.enableVertexAttribArray(VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]));
      gl.vertexAttribPointer(
        VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]),
        primitive.attributeCompositionTypes[i].getNumberOfComponents(),
        primitive.attributeComponentTypes[i].index,
        primitive.attributeAccessors[i].normalized,
        primitive.attributeAccessors[i].byteStride,
        0
      );
    });

    /// for InstanceIDBuffer
    if (instanceIDBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const instanceIDBuffer = this.getWebGLResource(instanceIDBufferUid) as WebGLBuffer;
      if (instanceIDBuffer != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceIDBuffer);
      } else {
        throw new Error('Nothing Element Array Buffer at index');
      }
      gl.enableVertexAttribArray(VertexAttribute.Instance.getAttributeSlot());
      gl.vertexAttribPointer(
        VertexAttribute.Instance.getAttributeSlot(),
        CompositionType.Vec4.getNumberOfComponents(),
        ComponentType.Float.index,
        false,
        0,
        0
      );
      this.__glw!.vertexAttribDivisor(VertexAttribute.Instance.getAttributeSlot(), 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.__glw!.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  /**
   * Creates a 2D texture with immutable storage using texStorage2D.
   * This method allocates texture storage with the specified parameters.
   *
   * @param params - Configuration object for texture creation
   * @param params.levels - Number of mipmap levels to allocate
   * @param params.internalFormat - Internal format of the texture
   * @param params.width - Width of the texture
   * @param params.height - Height of the texture
   * @returns The handle of the created texture
   */
  createTexStorage2D({
    levels,
    internalFormat,
    width,
    height,
  }: {
    levels: Index;
    internalFormat: TextureParameterEnum | PixelFormatEnum;
    width: Size;
    height: Size;
  }): WebGLResourceHandle {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    this.__glw!.bindTexture2D(15, texture!);
    gl.texStorage2D(GL_TEXTURE_2D, levels, internalFormat.index, width, height);
    const resourceHandle = this.__registerResource(texture!);
    this.__glw!.unbindTexture2D(15);

    return resourceHandle;
  }

  /**
   * Creates a new texture sampler with the specified filtering and wrapping parameters.
   *
   * @param params - Configuration object for sampler creation
   * @param params.magFilter - Magnification filter mode
   * @param params.minFilter - Minification filter mode
   * @param params.wrapS - Wrapping mode for S coordinate
   * @param params.wrapT - Wrapping mode for T coordinate
   * @param params.wrapR - Wrapping mode for R coordinate
   * @param params.anisotropy - Whether to enable anisotropic filtering
   * @param params.shadowCompareMode - Whether to enable shadow comparison mode
   * @returns The handle of the created sampler
   */
  createTextureSampler({
    magFilter,
    minFilter,
    wrapS,
    wrapT,
    wrapR,
    anisotropy,
    shadowCompareMode,
  }: {
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    wrapR: TextureParameterEnum;
    anisotropy: boolean;
    shadowCompareMode: boolean;
  }) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const sampler = gl.createSampler()!;
    const resourceHandle = this.__registerResource(sampler);
    gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, minFilter.index);
    gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, magFilter.index);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, wrapT.index);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, wrapR.index);
    if (shadowCompareMode) {
      gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_FUNC, gl.LESS);
    }
    if (anisotropy) {
      if (this.__glw!.webgl2ExtTFA) {
        gl.samplerParameteri(sampler, this.__glw!.webgl2ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      }
    }

    return resourceHandle;
  }

  /**
   * Creates or returns an existing texture sampler with clamp-to-edge wrapping and linear filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the clamp-to-edge linear sampler
   */
  createOrGetTextureSamplerClampToEdgeLinear() {
    if (this.__samplerClampToEdgeLinearUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.__glw!.getRawContextAsWebGL2();
      const sampler = gl.createSampler()!;
      const resourceHandle = this.__registerResource(sampler);
      this.__samplerClampToEdgeLinearUid = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    }

    return this.__samplerClampToEdgeLinearUid;
  }

  /**
   * Creates or returns an existing texture sampler with clamp-to-edge wrapping and nearest filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the clamp-to-edge nearest sampler
   */
  createOrGetTextureSamplerClampToEdgeNearest() {
    if (this.__samplerClampToEdgeNearestUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.__glw!.getRawContextAsWebGL2();
      const sampler = gl.createSampler()!;
      const resourceHandle = this.__registerResource(sampler);
      this.__samplerClampToEdgeNearestUid = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    }

    return this.__samplerClampToEdgeNearestUid;
  }

  /**
   * Creates or returns an existing texture sampler with repeat wrapping and nearest filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the repeat nearest sampler
   */
  createOrGetTextureSamplerRepeatNearest() {
    if (this.__samplerRepeatNearestUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.__glw!.getRawContextAsWebGL2();
      const sampler = gl.createSampler()!;
      const resourceHandle = this.__registerResource(sampler);
      this.__samplerRepeatNearestUid = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
    }

    return this.__samplerRepeatNearestUid;
  }

  /**
   * Creates or returns an existing texture sampler with repeat wrapping and linear filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the repeat linear sampler
   */
  createOrGetTextureSamplerRepeatLinear() {
    if (this.__samplerRepeatLinearUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.__glw!.getRawContextAsWebGL2();
      const sampler = gl.createSampler()!;
      const resourceHandle = this.__registerResource(sampler);
      this.__samplerRepeatLinearUid = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
    }

    return this.__samplerRepeatLinearUid;
  }

  /**
   * Creates or returns an existing texture sampler with repeat wrapping and trilinear filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the repeat trilinear sampler
   */
  createOrGetTextureSamplerRepeatTriLinear() {
    if (this.__samplerRepeatTriLinearUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.__glw!.getRawContextAsWebGL2();
      const sampler = gl.createSampler()!;
      const resourceHandle = this.__registerResource(sampler);
      this.__samplerRepeatTriLinearUid = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
    }

    return this.__samplerRepeatTriLinearUid;
  }

  /**
   * Creates or returns an existing texture sampler configured for shadow mapping.
   * This sampler uses nearest filtering and enables shadow comparison functionality.
   *
   * @returns The handle of the shadow sampler
   */
  createOrGetTextureSamplerShadow() {
    if (this.__samplerShadowUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.__glw!.getRawContextAsWebGL2();
      const sampler = gl.createSampler()!;
      const resourceHandle = this.__registerResource(sampler);
      this.__samplerShadowUid = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_FUNC, gl.LESS);
    }

    return this.__samplerShadowUid;
  }

  /**
   * Creates or returns an existing texture sampler with repeat wrapping, anisotropic filtering, and linear filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the repeat anisotropy linear sampler
   */
  createOrGetTextureSamplerRepeatAnisotropyLinear() {
    if (this.__samplerRepeatAnisotropyLinearUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.__glw!.getRawContextAsWebGL2();
      const sampler = gl.createSampler()!;
      const resourceHandle = this.__registerResource(sampler);
      this.__samplerRepeatAnisotropyLinearUid = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
      gl.samplerParameteri(sampler, this.__glw!.webgl2ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    }

    return this.__samplerRepeatAnisotropyLinearUid;
  }

  /**
   * Creates a 2D texture from ImageBitmap data with specified parameters.
   * This method allocates texture storage and uploads the image data to the GPU.
   *
   * @param imageData - The ImageBitmap or ImageBitmapSource data to upload
   * @param params - Configuration object for texture creation
   * @param params.internalFormat - Internal format of the texture
   * @param params.width - Width of the texture
   * @param params.height - Height of the texture
   * @param params.format - Pixel format of the source data
   * @param params.type - Data type of the source data
   * @param params.generateMipmap - Whether to generate mipmaps automatically
   * @returns Promise that resolves to the handle of the created texture
   */
  async createTextureFromImageBitmapData(
    imageData: ImageBitmapData,
    {
      internalFormat,
      width,
      height,
      format,
      type,
      generateMipmap,
    }: {
      internalFormat: TextureFormatEnum;
      width: Size;
      height: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      generateMipmap: boolean;
    }
  ): Promise<WebGLResourceHandle> {
    const gl = this.__glw!.getRawContextAsWebGL2();

    const texture = gl.createTexture() as RnWebGLTexture;
    const textureHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(15, texture);
    const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
    gl.texStorage2D(GL_TEXTURE_2D, levels, internalFormat.index, width, height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, format.index, type.index, imageData);

    this.__createTextureInner(gl, width, height, generateMipmap);

    return textureHandle;
  }

  /**
   * Internal helper method for common texture setup operations.
   * This method handles mipmap generation and texture parameter setup.
   *
   * @param gl - The WebGL2 rendering context
   * @param width - Width of the texture
   * @param height - Height of the texture
   * @param generateMipmap - Whether to generate mipmaps
   */
  private __createTextureInner(gl: WebGL2RenderingContext, _width: number, _height: number, _generateMipmap: boolean) {
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
    // if (isPremultipliedAlpha) {
    //   // gl.texParameteri(gl.TEXTURE_2D, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // } else {
    //   // gl.texParameteri(gl.TEXTURE_2D, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    // }
    // if (MathUtil.isPowerOfTwoTexture(width, height)) {
    // if (anisotropy) {
    //   if (this.__glw!.webgl2ExtTFA) {
    //     gl.texParameteri(gl.TEXTURE_2D, this.__glw!.webgl2ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    //   }
    // }

    gl.generateMipmap(gl.TEXTURE_2D);

    this.__glw!.unbindTexture2D(15);
  }

  /**
   * Creates a 2D texture from an HTML image element with specified parameters.
   * This method allocates texture storage and uploads the image data to the GPU.
   *
   * @param imageData - The HTML image element containing the image data
   * @param params - Configuration object for texture creation
   * @param params.internalFormat - Internal format of the texture
   * @param params.width - Width of the texture
   * @param params.height - Height of the texture
   * @param params.format - Pixel format of the source data
   * @param params.type - Data type of the source data
   * @param params.generateMipmap - Whether to generate mipmaps automatically
   * @returns Promise that resolves to the handle of the created texture
   */
  async createTextureFromHTMLImageElement(
    imageData: HTMLImageElement,
    {
      internalFormat,
      width,
      height,
      format,
      type,
      generateMipmap,
    }: {
      internalFormat: TextureParameterEnum;
      width: Size;
      height: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      generateMipmap: boolean;
    }
  ): Promise<WebGLResourceHandle> {
    const gl = this.__glw!.getRawContextAsWebGL2();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(15, texture);
    const levels = generateMipmap ? Math.max(Math.log2(width), Math.log2(height)) : 1;
    gl.texStorage2D(GL_TEXTURE_2D, levels, internalFormat.index, width, height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, format.index, type.index, imageData);

    this.__createTextureInner(gl, width, height, generateMipmap);

    return resourceHandle;
  }

  /**
   * Creates a 2D texture array with specified dimensions and format.
   * Texture arrays allow storing multiple texture layers in a single texture object.
   *
   * @param width - Width of each texture layer
   * @param height - Height of each texture layer
   * @param arrayLength - Number of texture layers in the array
   * @param mipLevelCount - Number of mipmap levels
   * @param internalFormat - Internal format of the texture
   * @param format - Pixel format of the source data
   * @param type - Data type of the source data
   * @param imageData - Typed array containing the texture data
   * @returns The handle of the created texture array
   */
  createTextureArray(
    width: Size,
    height: Size,
    arrayLength: Size,
    mipLevelCount: Size,
    internalFormat: TextureFormatEnum,
    format: PixelFormatEnum,
    type: ComponentTypeEnum,
    imageData: TypedArray
  ): CGAPIResourceHandle {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2DArray(15, texture);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, mipLevelCount, internalFormat.index, width, height, arrayLength);

    for (let layer = 0; layer < arrayLength; layer++) {
      gl.texSubImage3D(
        gl.TEXTURE_2D_ARRAY,
        0, // Mipmap Level
        0, // x Offset
        0, // y Offset
        layer, // z Offset
        width,
        height,
        1, // depth
        format.index,
        type.index,
        imageData
      );
    }

    this.__glw!.unbindTexture2DArray(15);

    return resourceHandle;
  }

  /**
   * Allocates texture storage without uploading any image data.
   * This method creates an empty texture with the specified format and dimensions.
   *
   * @param params - Configuration object for texture allocation
   * @param params.format - Internal format of the texture
   * @param params.width - Width of the texture
   * @param params.height - Height of the texture
   * @param params.mipLevelCount - Number of mipmap levels to allocate
   * @returns The handle of the allocated texture
   */
  allocateTexture({
    format,
    width,
    height,
    mipLevelCount,
  }: {
    format: TextureFormatEnum;
    width: Size;
    height: Size;
    mipLevelCount: Count;
  }): WebGLResourceHandle {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(15, texture);
    gl.texStorage2D(GL_TEXTURE_2D, mipLevelCount, format.index, width, height);
    this.__glw!.unbindTexture2D(15);

    return resourceHandle;
  }

  /**
   * Loads image data to a specific mip level of an existing 2D texture.
   * This method supports uploading data with row padding, extracting only the relevant pixels.
   *
   * @param params - Configuration object for image loading
   * @param params.mipLevel - The mip level to load the image to
   * @param params.textureUid - The handle of the target texture
   * @param params.format - The format of the image
   * @param params.type - The data type of the image
   * @param params.xOffset - X offset of the copy region
   * @param params.yOffset - Y offset of the copy region
   * @param params.width - Width of the image to copy
   * @param params.height - Height of the image to copy
   * @param params.rowSizeByPixel - Size of each row in pixels (including padding)
   * @param params.data - The typed array containing the image data
   */
  loadImageToMipLevelOfTexture2D({
    mipLevel,
    textureUid,
    format,
    type,
    xOffset,
    yOffset,
    width,
    height,
    rowSizeByPixel,
    data,
  }: {
    mipLevel: Index;
    textureUid: WebGLResourceHandle;
    format: TextureFormatEnum;
    type: ComponentTypeEnum;
    xOffset: number;
    yOffset: number;
    width: number;
    height: number;
    rowSizeByPixel: number;
    data: TypedArray;
  }) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const texture = this.getWebGLResource(textureUid) as RnWebGLTexture;
    const pixelFormat = TextureFormat.getPixelFormatFromTextureFormat(format);
    const compositionNum = PixelFormat.getCompositionNumFromPixelFormat(pixelFormat);

    const reducedData = new (data.constructor as any)(width * height * compositionNum);

    for (let y = 0; y < height; y++) {
      const srcOffset = y * rowSizeByPixel * compositionNum;
      const destOffset = y * width * compositionNum;
      for (let x = 0; x < width; x++) {
        reducedData.set(
          data.subarray(srcOffset + x * compositionNum, srcOffset + (x + 1) * compositionNum),
          destOffset + x * compositionNum
        );
      }
    }

    this.__glw!.bindTexture2D(15, texture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      mipLevel,
      xOffset,
      yOffset,
      width,
      height,
      pixelFormat.index,
      type.index,
      reducedData
    );
    this.__glw!.unbindTexture2D(15);
  }

  /**
   * Creates a 2D texture from a typed array with specified parameters.
   * This method is useful for creating textures from raw pixel data.
   *
   * @param imageData - The typed array containing the pixel data
   * @param params - Configuration object for texture creation
   * @param params.internalFormat - Internal format of the texture
   * @param params.width - Width of the texture
   * @param params.height - Height of the texture
   * @param params.format - Pixel format of the source data
   * @param params.type - Data type of the source data
   * @param params.generateMipmap - Whether to generate mipmaps automatically
   * @returns The handle of the created texture
   */
  createTextureFromTypedArray(
    imageData: TypedArray,
    {
      internalFormat,
      width,
      height,
      format,
      type,
      generateMipmap,
    }: {
      internalFormat: TextureFormatEnum;
      width: Size;
      height: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      generateMipmap: boolean;
    }
  ): WebGLResourceHandle {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(15, texture);
    const levels = generateMipmap ? Math.max(Math.log2(width), Math.log2(height)) : 1;
    gl.texStorage2D(GL_TEXTURE_2D, levels, internalFormat.index, width, height);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      width,
      height,
      format.index,
      type.index,
      imageData as any as ArrayBufferView
    );

    this.__createTextureInner(gl, width, height, generateMipmap);

    return resourceHandle;
  }

  /**
   * Creates a compressed texture from pre-transcoded texture data for multiple mip levels.
   * This method handles various compressed texture formats and uploads the data to GPU.
   *
   * @param textureDataArray - Array of texture data for each mipmap level
   * @param compressionTextureType - The compression format type (e.g., DXT, ETC, ASTC)
   * @returns Promise that resolves to the handle of the created compressed texture
   */
  async createCompressedTexture(
    textureDataArray: TextureData[],
    compressionTextureType: CompressionTextureTypeEnum
  ): Promise<WebGLResourceHandle> {
    const gl = this.__glw!.getRawContext();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(15, texture);

    const internalFormat = compressionTextureType.index;

    for (const textureData of textureDataArray) {
      gl.compressedTexImage2D(
        gl.TEXTURE_2D,
        textureData.level,
        internalFormat,
        textureData.width,
        textureData.height,
        0,
        textureData.buffer
      );
    }

    this.__glw!.unbindTexture2D(15);

    return resourceHandle;
  }

  /**
   * Creates a compressed texture from a Basis Universal file.
   * This method automatically detects the best compression format supported by the hardware
   * and transcodes the Basis file accordingly.
   *
   * @param basisFile - The Basis Universal file containing the compressed texture data
   * @param params - Configuration object for texture creation
   * @param params.border - Border width (must be 0 in WebGL)
   * @returns The handle of the created compressed texture
   */
  createCompressedTextureFromBasis(
    basisFile: BasisFile,
    {
      border,
    }: {
      border: Size;
    }
  ): WebGLResourceHandle {
    let basisCompressionType: BasisCompressionTypeEnum;
    let compressionType: Index;

    const gl = this.__glw!.getRawContext();
    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(15, texture);

    const s3tc = gl.getExtension('WEBGL_compressed_texture_s3tc');
    if (s3tc) {
      basisCompressionType = BasisCompressionType.BC3;
      compressionType = s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    }
    const etc1 = gl.getExtension('WEBGL_compressed_texture_etc1');
    if (etc1) {
      basisCompressionType = BasisCompressionType.ETC1;
      compressionType = etc1.COMPRESSED_RGB_ETC1_WEBGL;
    }
    const atc = gl.getExtension('WEBGL_compressed_texture_atc');
    if (atc) {
      basisCompressionType = BasisCompressionType.ATC_RGBA;
      compressionType = atc.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL;
    }
    const etc2 = gl.getExtension('WEBGL_compressed_texture_etc');
    if (etc2) {
      basisCompressionType = BasisCompressionType.ETC2;
      compressionType = etc2.COMPRESSED_RGBA8_ETC2_EAC;
    }
    const pvrtc =
      gl.getExtension('WEBGL_compressed_texture_pvrtc') || gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
    if (pvrtc) {
      basisCompressionType = BasisCompressionType.PVRTC1_RGBA;
      compressionType = pvrtc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
    }
    const astc = gl.getExtension('WEBGL_compressed_texture_astc');
    if (astc) {
      basisCompressionType = BasisCompressionType.ASTC;
      compressionType = astc.COMPRESSED_RGBA_ASTC_4x4_KHR;
    }
    const mipmapDepth = basisFile.getNumLevels(0);

    for (let i = 0; i < mipmapDepth; i++) {
      const width = basisFile.getImageWidth(0, i);
      const height = basisFile.getImageHeight(0, i);
      const textureSource = this.decodeBasisImage(basisFile, basisCompressionType!, 0, i);
      gl.compressedTexImage2D(gl.TEXTURE_2D, i, compressionType!, width, height, border, textureSource);
    }

    this.__glw!.unbindTexture2D(15);

    return resourceHandle;
  }

  /**
   * Decodes a specific image and mip level from a Basis Universal file to the target compression format.
   * This method handles the transcoding process from Basis format to hardware-specific formats.
   *
   * @param basisFile - The Basis Universal file containing the texture data
   * @param basisCompressionType - The target compression format to transcode to
   * @param imageIndex - Index of the image to decode (for texture arrays)
   * @param levelIndex - Mip level index to decode
   * @returns Uint8Array containing the transcoded texture data
   */
  private decodeBasisImage(
    basisFile: BasisFile,
    basisCompressionType: BasisCompressionTypeEnum,
    imageIndex: Index,
    levelIndex: Index
  ) {
    const extractSize = basisFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, basisCompressionType!.index);
    const textureSource = new Uint8Array(extractSize);
    if (!basisFile.transcodeImage(textureSource, imageIndex, levelIndex, basisCompressionType!.index, 0, 0)) {
      Logger.error('failed to transcode the image.');
    }
    return textureSource;
  }

  /**
   * Creates a new framebuffer object for off-screen rendering.
   * Framebuffers are used for render-to-texture operations and post-processing effects.
   *
   * @returns The handle of the created framebuffer object
   */
  createFrameBufferObject() {
    const gl = this.__glw!.getRawContext();
    const fbo = gl.createFramebuffer();
    const resourceHandle = this.__registerResource(fbo!);

    return resourceHandle;
  }

  /**
   * Attaches a color buffer (texture or renderbuffer) to a framebuffer object.
   * This method supports both regular textures and multiview VR textures.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param attachmentIndex - The color attachment index (0-based)
   * @param renderable - The texture or renderbuffer to attach
   */
  attachColorBufferToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID)! as WebGLFramebuffer;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const renderableWebGLResource = this.getWebGLResource(renderable._textureResourceUid)! as WebGLTexture;
    const attachmentId = this.__glw!.colorAttachment(attachmentIndex);

    if (renderable instanceof RenderTargetTexture2DArray) {
      // It's must be TextureArray for MultiView VR Rendering
      (renderable as RenderTargetTexture2DArray)._fbo = framebuffer;
      if (this.__glw!.webgl2ExtMLTVIEW!.is_multisample) {
        this.__glw!.webgl2ExtMLTVIEW!.framebufferTextureMultisampleMultiviewOVR(
          gl.DRAW_FRAMEBUFFER,
          attachmentId,
          renderableWebGLResource,
          0,
          4, // sample count
          0,
          renderable.arrayLength
        );
      } else {
        this.__glw!.webgl2ExtMLTVIEW!.framebufferTextureMultiviewOVR(
          gl.DRAW_FRAMEBUFFER,
          attachmentId,
          renderableWebGLResource,
          0,
          0,
          renderable.arrayLength
        );
      }
    } else if (renderable instanceof RenderTargetTexture) {
      (renderable as RenderTargetTexture)._fbo = framebuffer;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentId, gl.TEXTURE_2D, renderableWebGLResource, 0);
    } else {
      // It's must be RenderBuffer
      (renderable as RenderBuffer)._fbo = framebuffer;
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        attachmentId,
        gl.RENDERBUFFER,
        renderableWebGLResource as any as WebGLRenderbuffer
      );
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * Attaches a specific layer of a texture array to a framebuffer object.
   * This method is useful for rendering to individual layers of a texture array.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param attachmentIndex - The color attachment index (0-based)
   * @param renderable - The texture array to attach
   * @param layerIndex - The layer index within the texture array
   * @param mipLevel - The mip level to attach
   */
  attachColorBufferLayerToFrameBufferObject(
    framebuffer: FrameBuffer,
    attachmentIndex: Index,
    renderable: IRenderable,
    layerIndex: Index,
    mipLevel: Index
  ) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID)! as WebGLFramebuffer;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const renderableWebGLResource = this.getWebGLResource(renderable._textureResourceUid)! as WebGLTexture;
    const attachmentId = this.__glw!.colorAttachment(attachmentIndex);

    (renderable as RenderTargetTexture)._fbo = framebuffer;
    gl.framebufferTextureLayer(gl.FRAMEBUFFER, attachmentId, renderableWebGLResource, mipLevel, layerIndex);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * Attaches a specific face of a cube texture to a framebuffer object.
   * This method is used for rendering to individual faces of cube maps.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param attachmentIndex - The color attachment index (0-based)
   * @param faceIndex - The cube face index (0-5: +X, -X, +Y, -Y, +Z, -Z)
   * @param mipLevel - The mip level to attach
   * @param renderable - The cube texture to attach
   */
  attachColorBufferCubeToFrameBufferObject(
    framebuffer: FrameBuffer,
    attachmentIndex: Index,
    faceIndex: Index,
    mipLevel: Index,
    renderable: IRenderable
  ) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID)! as WebGLFramebuffer;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const renderableWebGLResource = this.getWebGLResource(renderable._textureResourceUid)! as WebGLTexture;
    const attachmentId = this.__glw!.colorAttachment(attachmentIndex);

    (renderable as RenderBuffer)._fbo = framebuffer;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      attachmentId,
      gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex,
      renderableWebGLResource,
      mipLevel
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * Attaches a depth buffer to a framebuffer object.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param renderable - The depth texture or renderbuffer to attach
   */
  attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable) {
    this.__attachDepthOrStencilBufferToFrameBufferObject(framebuffer, renderable, 36096); // gl.DEPTH_ATTACHMENT
  }

  /**
   * Attaches a stencil buffer to a framebuffer object.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param renderable - The stencil texture or renderbuffer to attach
   */
  attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable) {
    this.__attachDepthOrStencilBufferToFrameBufferObject(framebuffer, renderable, 36128); // gl.STENCIL_ATTACHMENT
  }

  /**
   * Attaches a combined depth-stencil buffer to a framebuffer object.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param renderable - The depth-stencil texture or renderbuffer to attach
   */
  attachDepthStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable) {
    this.__attachDepthOrStencilBufferToFrameBufferObject(framebuffer, renderable, 33306); // gl.DEPTH_STENCIL_ATTACHMENT
  }

  /**
   * Internal method for attaching depth or stencil buffers to framebuffers.
   * This method handles the common logic for depth, stencil, and depth-stencil attachments.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param renderable - The texture or renderbuffer to attach
   * @param attachmentType - The WebGL attachment type constant
   */
  private __attachDepthOrStencilBufferToFrameBufferObject(
    framebuffer: FrameBuffer,
    renderable: IRenderable,
    attachmentType: number
  ) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID)! as WebGLFramebuffer;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const renderableWebGLResource = this.getWebGLResource(renderable._textureResourceUid)! as WebGLTexture;

    if (renderable instanceof RenderTargetTexture2DArray) {
      // It's must be TextureArray for MultiView VR Rendering
      (renderable as RenderTargetTexture2DArray)._fbo = framebuffer;
      if (this.__glw!.webgl2ExtMLTVIEW!.is_multisample) {
        this.__glw!.webgl2ExtMLTVIEW!.framebufferTextureMultisampleMultiviewOVR(
          gl.DRAW_FRAMEBUFFER,
          attachmentType,
          renderableWebGLResource,
          0,
          4, // sample count
          0,
          renderable.arrayLength
        );
      } else {
        this.__glw!.webgl2ExtMLTVIEW!.framebufferTextureMultiviewOVR(
          gl.DRAW_FRAMEBUFFER,
          attachmentType,
          renderableWebGLResource,
          0,
          0,
          renderable.arrayLength
        );
      }
    } else if (renderable instanceof RenderTargetTexture) {
      (renderable as RenderTargetTexture)._fbo = framebuffer;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentType, gl.TEXTURE_2D, renderableWebGLResource, 0);
    } else {
      // It's must be RenderBuffer
      (renderable as RenderBuffer)._fbo = framebuffer;
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        attachmentType,
        gl.RENDERBUFFER,
        renderableWebGLResource as any as WebGLRenderbuffer
      );
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * create Renderbuffer
   */
  createRenderBuffer(
    width: Size,
    height: Size,
    internalFormat: TextureParameterEnum,
    isMSAA: boolean,
    sampleCountMSAA: Count
  ) {
    const gl = this.__glw!.getRawContext();
    const renderBuffer = gl.createRenderbuffer();
    const resourceHandle = this.__registerResource(renderBuffer!);

    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    if (isMSAA) {
      (gl as WebGL2RenderingContext).renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        sampleCountMSAA,
        (gl as any)[internalFormat.str],
        width,
        height
      );
    } else {
      gl.renderbufferStorage(gl.RENDERBUFFER, (gl as any)[internalFormat.str], width, height);
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return resourceHandle;
  }

  /**
   * set drawTargets
   * @param framebuffer
   */
  setDrawTargets(renderPass: RenderPass) {
    const framebuffer = renderPass.getFramebuffer();
    if (framebuffer) {
      const renderBufferTargetEnums = renderPass.getRenderTargetColorAttachments();
      if (Is.exist(renderBufferTargetEnums)) {
        this.__glw!.drawBuffers(renderBufferTargetEnums);
      } else {
        this.__glw!.drawBuffers(framebuffer.colorAttachmentsRenderBufferTargets);
      }
    } else {
      this.__glw!.drawBuffers([RenderBufferTarget.Back]);
    }
  }

  /**
   * bind Framebuffer
   * @param framebuffer
   */
  bindFramebuffer(framebuffer?: FrameBuffer) {
    const gl = this.__glw!.getRawContext();
    if (framebuffer) {
      const fboUid = framebuffer.cgApiResourceUid;
      const fbo = this.getWebGLResource(fboUid) as WebGLFramebuffer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  /**
   * unbind Framebuffer
   */
  unbindFramebuffer() {
    const gl = this.__glw!.getRawContext();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * create a RenderTargetTexture
   * @param param0
   * @returns
   */
  createRenderTargetTexture({
    width,
    height,
    mipLevelCount,
    format,
  }: {
    width: Size;
    height: Size;
    mipLevelCount: Count;
    format: TextureParameterEnum;
  }) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(15, texture);

    gl.texStorage2D(gl.TEXTURE_2D, mipLevelCount, format.index, width, height);

    this.__glw!.unbindTexture2D(15);

    return resourceHandle;
  }

  /**
   * create a RenderTargetTextureArray
   * @param param0
   * @returns
   */
  createRenderTargetTextureArray({
    width,
    height,
    internalFormat,
    arrayLength,
  }: {
    width: Size;
    height: Size;
    internalFormat: TextureParameterEnum;
    arrayLength: Count;
  }): WebGLResourceHandle {
    const gl = this.__glw!.getRawContextAsWebGL2();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2DArray(15, texture);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, internalFormat.index, width, height, arrayLength);
    this.__glw!.unbindTexture2DArray(15);
    return resourceHandle;
  }

  /**
   * create a RenderTargetTextureCube
   * @param param0
   * @returns
   */
  createRenderTargetTextureCube({
    width,
    height,
    mipLevelCount,
    format,
  }: {
    width: Size;
    height: Size;
    mipLevelCount: Size;
    format: TextureParameterEnum;
  }) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTextureCube(15, texture);

    gl.texStorage2D(gl.TEXTURE_CUBE_MAP, mipLevelCount, format.index, width, height);

    this.__glw!.unbindTextureCube(15);

    return resourceHandle;
  }

  /**
   * create a CubeTexture
   *
   * @param mipLevelCount
   * @param images
   * @param width
   * @param height
   * @returns resource handle
   */
  createCubeTexture(
    mipLevelCount: Count,
    images: Array<{
      posX: DirectTextureData;
      negX: DirectTextureData;
      posY: DirectTextureData;
      negY: DirectTextureData;
      posZ: DirectTextureData;
      negZ: DirectTextureData;
    }>,
    width: Size,
    height: Size
  ): [number, Sampler] {
    const gl = this.__glw!.getRawContext();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTextureCube(15, texture);

    const wrapS = TextureParameter.ClampToEdge;
    const wrapT = TextureParameter.ClampToEdge;
    let minFilter = TextureParameter.Linear;
    let magFilter = TextureParameter.Linear;
    if (
      (images[0].posX as any).hdriFormat === HdriFormat.HDR_LINEAR &&
      this.__glw!.isNotSupportWebGL1Extension(WebGLExtension.TextureFloatLinear)
    ) {
      if (mipLevelCount >= 2) {
        minFilter = TextureParameter.NearestMipmapNearest;
      } else {
        minFilter = TextureParameter.Nearest;
      }
      magFilter = TextureParameter.Nearest;
    } else {
      if (mipLevelCount >= 2) {
        minFilter = TextureParameter.LinearMipmapLinear;
      } else {
        minFilter = TextureParameter.Linear;
      }
      magFilter = TextureParameter.Linear;
    }

    const sampler = new Sampler({ wrapS, wrapT, minFilter, magFilter });
    sampler.create();

    const loadImageToGPU = (image: DirectTextureData, cubeMapSide: number, i: Index) => {
      if ((image as any).hdriFormat === HdriFormat.HDR_LINEAR) {
        const gl = this.__glw!.getRawContextAsWebGL2();
        gl.texImage2D(
          cubeMapSide,
          i,
          Config.isMobile ? gl.RGB16F : gl.RGB32F,
          (image as any).width,
          (image as any).height,
          0,
          gl.RGB,
          gl.FLOAT,
          (image as any).dataFloat
        );
      } else if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
        gl.texImage2D(cubeMapSide, i, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      } else {
        gl.texImage2D(
          cubeMapSide,
          i,
          gl.RGBA,
          width / 2 ** i,
          height / 2 ** i,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image as ArrayBufferView
        );
      }
    };

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      loadImageToGPU(image.posX, gl.TEXTURE_CUBE_MAP_POSITIVE_X, i);
      loadImageToGPU(image.negX, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, i);
      loadImageToGPU(image.posY, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, i);
      loadImageToGPU(image.negY, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, i);
      loadImageToGPU(image.posZ, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, i);
      loadImageToGPU(image.negZ, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, i);
    }
    this.__glw!.unbindTextureCube(15);

    return [resourceHandle, sampler];
  }

  /**
   * Create Cube Texture from image files.
   * @param baseUri the base uri to load images;
   * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
   * @returns the WebGLResourceHandle for the generated Cube Texture
   */
  async createCubeTextureFromFiles(
    baseUri: string,
    mipLevelCount: Count,
    isNamePosNeg: boolean,
    hdriFormat: HdriFormatEnum
  ) {
    const gl = this.__glw!.getRawContext();

    const imageArgs: Array<{
      posX: DirectTextureData;
      negX: DirectTextureData;
      posY: DirectTextureData;
      negY: DirectTextureData;
      posZ: DirectTextureData;
      negZ: DirectTextureData;
    }> = [];
    let width = 0;
    let height = 0;
    for (let i = 0; i < mipLevelCount; i++) {
      const loadOneLevel = () => {
        return new Promise<HTMLImageElement[]>((resolve, reject) => {
          let loadedCount = 0;
          const images: HTMLImageElement[] = [];
          let extension = '.jpg';
          if (hdriFormat === HdriFormat.HDR_LINEAR) {
            extension = '.hdr';
          } else if (hdriFormat === HdriFormat.RGBE_PNG) {
            extension = '.RGBE.PNG';
          }

          let posX = '_right_';
          let negX = '_left_';
          let posY = '_top_';
          let negY = '_bottom_';
          let posZ = '_front_';
          let negZ = '_back_';
          if (isNamePosNeg) {
            posX = '_posx_';
            negX = '_negx_';
            posY = '_posy_';
            negY = '_negy_';
            posZ = '_posz_';
            negZ = '_negz_';
          }

          const faces = [
            [baseUri + posX + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_X],
            [baseUri + negX + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
            [baseUri + posY + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
            [baseUri + negY + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
            [baseUri + posZ + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
            [baseUri + negZ + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],
          ];
          for (let j = 0; j < faces.length; j++) {
            const face = faces[j][1];
            let image: any;
            if (hdriFormat === HdriFormat.HDR_LINEAR || hdriFormat === HdriFormat.RGB9_E5_PNG) {
              image = new HDRImage();
            } else {
              image = new Image();
            }
            image.hdriFormat = hdriFormat;

            (image as any).side = face;
            (image as any).uri = faces[j][0];
            image.crossOrigin = 'Anonymous';
            image.onload = () => {
              loadedCount++;
              images.push(image);
              if (loadedCount === 6) {
                resolve(images);
              }
            };
            image.onerror = () => {
              reject((image as any).uri);
            };
            image.src = faces[j][0];
          }
        });
      };

      let images: HTMLImageElement[];
      try {
        images = await loadOneLevel();
      } catch (_e) {
        // Try again once
        try {
          images = await loadOneLevel();
        } catch (uri) {
          // Give up
          Logger.error(`failed to load ${uri}`);
        }
      }
      const imageObj: {
        posX?: DirectTextureData;
        negX?: DirectTextureData;
        posY?: DirectTextureData;
        negY?: DirectTextureData;
        posZ?: DirectTextureData;
        negZ?: DirectTextureData;
      } = {};
      for (const image of images!) {
        switch ((image as any).side) {
          case gl.TEXTURE_CUBE_MAP_POSITIVE_X:
            imageObj.posX = image;
            break;
          case gl.TEXTURE_CUBE_MAP_POSITIVE_Y:
            imageObj.posY = image;
            break;
          case gl.TEXTURE_CUBE_MAP_POSITIVE_Z:
            imageObj.posZ = image;
            break;
          case gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
            imageObj.negX = image;
            break;
          case gl.TEXTURE_CUBE_MAP_NEGATIVE_Y:
            imageObj.negY = image;
            break;
          case gl.TEXTURE_CUBE_MAP_NEGATIVE_Z:
            imageObj.negZ = image;
            break;
        }
        if (i === 0) {
          width = image.width;
          height = image.height;
        }
      }
      imageArgs.push(
        imageObj as {
          posX: DirectTextureData;
          negX: DirectTextureData;
          posY: DirectTextureData;
          negY: DirectTextureData;
          posZ: DirectTextureData;
          negZ: DirectTextureData;
        }
      );
    }

    return this.createCubeTexture(mipLevelCount, imageArgs, width, height);
  }

  createCubeTextureFromBasis(
    basisFile: BasisFile,
    {
      magFilter = TextureParameter.Linear,
      minFilter = TextureParameter.LinearMipmapLinear,
      wrapS = TextureParameter.Repeat,
      wrapT = TextureParameter.Repeat,
      border = 0,
    }
  ) {
    const gl = this.__glw!.getRawContext();
    let basisCompressionType: BasisCompressionTypeEnum;
    let compressionType: Index;

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTextureCube(15, texture);

    const s3tc = gl.getExtension('WEBGL_compressed_texture_s3tc');
    if (s3tc) {
      basisCompressionType = BasisCompressionType.BC3;
      compressionType = s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    }
    const etc1 = gl.getExtension('WEBGL_compressed_texture_etc1');
    if (etc1) {
      basisCompressionType = BasisCompressionType.ETC1;
      compressionType = etc1.COMPRESSED_RGB_ETC1_WEBGL;
    }
    const atc = gl.getExtension('WEBGL_compressed_texture_atc');
    if (atc) {
      basisCompressionType = BasisCompressionType.ATC_RGBA;
      compressionType = atc.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL;
    }
    const etc2 = gl.getExtension('WEBGL_compressed_texture_etc');
    if (etc2) {
      basisCompressionType = BasisCompressionType.ETC2;
      compressionType = etc2.COMPRESSED_RGBA8_ETC2_EAC;
    }
    const pvrtc =
      gl.getExtension('WEBGL_compressed_texture_pvrtc') || gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
    if (pvrtc) {
      basisCompressionType = BasisCompressionType.PVRTC1_RGBA;
      compressionType = pvrtc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
    }
    const astc = gl.getExtension('WEBGL_compressed_texture_astc');
    if (astc) {
      basisCompressionType = BasisCompressionType.ASTC;
      compressionType = astc.COMPRESSED_RGBA_ASTC_4x4_KHR;
    }

    const numImages = basisFile.getNumImages();
    const mipmapDepth = basisFile.getNumLevels(0);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, wrapT.index);
    if (mipmapDepth >= 2) {
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, minFilter.index);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, magFilter.index);
    } else {
      let minFilter_ = minFilter;
      if (minFilter === TextureParameter.LinearMipmapLinear) {
        minFilter_ = TextureParameter.Linear;
      }
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, minFilter_.index);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, magFilter.index);
    }

    for (let i = 0; i < mipmapDepth; i++) {
      for (let j = 0; j < numImages; j++) {
        const width = basisFile.getImageWidth(j, i);
        const height = basisFile.getImageHeight(j, i);
        const textureSource = this.decodeBasisImage(basisFile, basisCompressionType!, j, i);
        gl.compressedTexImage2D(
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + j,
          i,
          compressionType!,
          width,
          height,
          border,
          textureSource
        );
      }
    }

    this.__glw!.unbindTextureCube(15);

    return resourceHandle;
  }

  createDummyBlackCubeTexture() {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';
    const arrayBuffer = this.__createDummyTextureInner(base64);
    const typedArray = new Uint8Array(arrayBuffer);
    return this.createCubeTexture(
      1,
      [
        {
          posX: typedArray,
          negX: typedArray,
          posY: typedArray,
          negY: typedArray,
          posZ: typedArray,
          negZ: typedArray,
        },
      ],
      1,
      1
    );
  }

  createDummyCubeTexture(rgbaStr = 'rgba(0,0,0,1)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);

    return this.createCubeTexture(
      1,
      [
        {
          posX: canvas,
          negX: canvas,
          posY: canvas,
          negY: canvas,
          posZ: canvas,
          negZ: canvas,
        },
      ],
      1,
      1
    );
  }

  setWebGLTextureDirectly(webGLTexture: WebGLTexture) {
    const texture = webGLTexture;
    const resourceHandle = this.__registerResource(texture);

    return resourceHandle;
  }

  async createTextureFromDataUri(
    dataUri: string,
    {
      internalFormat,
      format,
      type,
      generateMipmap,
    }: {
      internalFormat: TextureParameterEnum;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      generateMipmap: boolean;
    }
  ): Promise<WebGLResourceHandle> {
    return new Promise<WebGLResourceHandle>(resolve => {
      const img = new Image();
      if (!dataUri.match(/^data:/)) {
        img.crossOrigin = 'Anonymous';
      }
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        const texture = this.createTextureFromHTMLImageElement(img, {
          internalFormat,
          width,
          height,
          format,
          type,
          generateMipmap,
        });

        resolve(texture);
      };

      img.src = dataUri;
    });
  }

  updateLevel0TextureAndGenerateMipmap(
    textureUid: WebGLResourceHandle,
    textureData: DirectTextureData,
    {
      width,
      height,
      format,
      type,
    }: {
      width: Size;
      height: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
    }
  ) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    this.__glw!.bindTexture2D(15, texture);

    const gl = this.__glw!.getRawContextAsWebGL2();
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      width,
      height,
      format.index,
      type.index,
      textureData as any as ArrayBufferView
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    this.__glw!.unbindTexture2D(15);
  }

  updateTexture(
    textureUid: WebGLResourceHandle,
    textureData: DirectTextureData,
    {
      level,
      width,
      height,
      format,
      type,
    }: {
      level: Index;
      width: Size;
      height: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
    }
  ) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;

    this.__glw!.bindTexture2D(15, texture);

    const gl = this.__glw!.getRawContextAsWebGL2();
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      level,
      0,
      0,
      width,
      height,
      format.index,
      type.index,
      textureData as any as ArrayBufferView
    );
    this.__glw!.unbindTexture2D(15);
  }

  deleteFrameBufferObject(frameBufferObjectHandle: WebGLResourceHandle) {
    const fbo = this.getWebGLResource(frameBufferObjectHandle) as WebGLFramebuffer;
    const gl = this.__glw!.getRawContext();
    if (fbo != null) {
      gl.deleteFramebuffer(fbo!);
      this.__webglResources.delete(frameBufferObjectHandle);
    }
  }

  deleteRenderBuffer(renderBufferUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();

    const renderBuffer = this.getWebGLResource(renderBufferUid)! as WebGLRenderbuffer;
    gl.deleteRenderbuffer(renderBuffer);
    this.__webglResources.delete(renderBufferUid);
  }

  deleteTexture(textureHandle: WebGLResourceHandle) {
    const texture = this.getWebGLResource(textureHandle) as WebGLTexture;
    const gl = this.__glw!.getRawContext();
    if (texture != null) {
      gl.deleteTexture(texture!);
      this.__webglResources.delete(textureHandle);
      Logger.debug(`gl.deleteTexture called: ${textureHandle}`);
    }
  }

  createDummyTexture(rgbaStr = 'rgba(255,255,255,1)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);

    return this.createTextureFromImageBitmapData(canvas, {
      internalFormat: TextureFormat.RGBA8,
      width: 1,
      height: 1,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      generateMipmap: false,
    });
  }

  createDummyBlackTexture() {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';
    return this.__createDummyTextureInner(base64);
  }

  createDummyWhiteTexture() {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5/hPwAIAgL/4d1j8wAAAABJRU5ErkJggg==';
    return this.__createDummyTextureInner(base64);
  }

  createDummyNormalTexture() {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsr///HwAGgAL+v1RumAAAAABJRU5ErkJggg==';
    return this.__createDummyTextureInner(base64);
  }

  __createDummyTextureInner(base64: string) {
    const arrayBuffer = DataUtil.base64ToArrayBuffer(base64);
    return this.createTextureFromTypedArray(new Uint8Array(arrayBuffer), {
      internalFormat: TextureFormat.RGBA8,
      width: 1,
      height: 1,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      generateMipmap: false,
    });
  }

  generateMipmaps2d(textureHandle: WebGLResourceHandle, _width: number, _height: number): void {
    const gl = this.__glw!.getRawContext();
    const texture = this.getWebGLResource(textureHandle) as WebGLTexture;
    this.__glw!.bindTexture2D(15, texture);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.__glw!.unbindTexture2D(15);
  }

  generateMipmapsCube(textureHandle: WebGLResourceHandle, _width: number, _height: number): void {
    const gl = this.__glw!.getRawContext();
    const texture = this.getWebGLResource(textureHandle) as WebGLTexture;
    this.__glw!.bindTextureCube(15, texture);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    this.__glw!.unbindTextureCube(15);
  }

  async getTexturePixelData(
    _textureHandle: WebGLResourceHandle,
    width: number,
    height: number,
    frameBufferUid: WebGLResourceHandle,
    colorAttachmentIndex: number
  ): Promise<Uint8Array> {
    const gl = this.__glw!.getRawContext();

    // Create a framebuffer backed by the texture
    const fbo = this.getWebGLResource(frameBufferUid) as WebGLFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Read the contents of the framebuffer (data stores the pixel data)
    const data = new Uint8Array(width * height * 4);
    if ((gl as WebGL2RenderingContext).readBuffer != null) {
      (gl as WebGL2RenderingContext).readBuffer(36064 + colorAttachmentIndex); // 36064 means gl.COLOR_ATTACHMENT0
    }
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return data;
  }

  createUniformBuffer(bufferView: TypedArray | DataView) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const ubo = gl.createBuffer();
    const resourceHandle = this.__registerResource(ubo!);

    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, bufferView, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    return resourceHandle;
  }

  updateUniformBuffer(uboUid: WebGLResourceHandle, typedArray: TypedArray, offsetByte: Byte, arrayLength: Byte) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const ubo = this.getWebGLResource(uboUid) as WebGLBuffer;

    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, typedArray, offsetByte, arrayLength);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  bindUniformBlock(shaderProgramUid: WebGLResourceHandle, blockName: string, blockIndex: Index) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const shaderProgram = this.getWebGLResource(shaderProgramUid)! as WebGLProgram;

    const block = gl.getUniformBlockIndex(shaderProgram, blockName);
    gl.uniformBlockBinding(shaderProgram, block, blockIndex);
  }

  bindUniformBufferBase(blockIndex: Index, uboUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const ubo = this.getWebGLResource(uboUid)! as WebGLBuffer;

    gl.bindBufferBase(gl.UNIFORM_BUFFER, blockIndex, ubo);
  }

  deleteUniformBuffer(uboUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      new Error('No WebGLRenderingContext set as Default.');
    }

    const ubo = this.getWebGLResource(uboUid)! as WebGLBuffer;
    this.__webglResources.delete(uboUid);

    gl.deleteBuffer(ubo);
  }

  setupUniformBufferDataArea(typedArray?: TypedArray) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    if (gl == null) {
      new Error('No WebGLRenderingContext set as Default.');
    }

    const ubo = gl.createBuffer();
    const resourceHandle = this.__registerResource(ubo!);

    const maxConventionBlocks = this.__glw!.getMaxConventionUniformBlocks();
    const alignedMaxUniformBlockSize = this.__glw!.getAlignedMaxUniformBlockSize();
    const realSize = alignedMaxUniformBlockSize * maxConventionBlocks;
    const array = new Float32Array(realSize / 4);
    if (Is.exist(typedArray)) {
      array.set(typedArray.subarray(0, array.length));
    }
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, array, gl.DYNAMIC_DRAW, 0, 0);

    for (let i = 0; i < maxConventionBlocks; i++) {
      gl.bindBufferRange(gl.UNIFORM_BUFFER, i, ubo, alignedMaxUniformBlockSize * i, alignedMaxUniformBlockSize);
    }
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    return resourceHandle;
  }

  getGlslRenderTargetBeginString(renderTargetNumber: number) {
    let text = '';
    for (let i = 0; i < renderTargetNumber; i++) {
      text += `layout(location = ${i}) out vec4 rt${i};`;
    }

    return text;
  }

  getGlslDataUBODefinitionString(): string {
    let text = '';
    const maxConventionblocks = this.__glw!.getMaxConventionUniformBlocks();
    const alignedMaxUniformBlockSize = this.__glw!.getAlignedMaxUniformBlockSize();
    for (let i = 0; i < maxConventionblocks; i++) {
      text += `
layout (std140) uniform Vec4Block${i} {
  vec4 vec4Block${i}[${alignedMaxUniformBlockSize / 4 / 4}];
};
`;
    }

    text += `
vec4 fetchVec4FromVec4Block(int vec4Idx) {
  int vec4IdxForEachBlock = vec4Idx % dataUBOVec4Size;
  if (vec4Idx < dataUBOVec4Size) {
    return vec4Block0[vec4IdxForEachBlock];
  }`;
    for (let i = 1; i < maxConventionblocks; i++) {
      text += `
 else if (vec4Idx < dataUBOVec4Size * ${i + 1}) {
    return vec4Block${i}[vec4IdxForEachBlock];
}`;
    }
    text += '}\n';

    return text;
  }

  getGlslDataUBOVec4SizeString(): string {
    const alignedMaxUniformBlockSize = this.__glw!.getAlignedMaxUniformBlockSize();
    return `const int dataUBOVec4Size = ${alignedMaxUniformBlockSize / 4 / 4};`;
  }

  createMultiviewFramebuffer(
    width: number,
    height: number,
    samples: number
  ): [WebGLResourceHandle, WebGLResourceHandle] {
    if (Is.not.exist(this.__glw!.webgl2ExtMLTVIEW)) {
      return [-1, -1];
    }
    const gl = this.__glw!.getRawContextAsWebGL2();
    const framebuffer = gl.createFramebuffer();
    const framebufferHandle = this.__registerResource(framebuffer!);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);

    // color texture / attachment
    const colorTexture = gl.createTexture()!;
    const colorTextureHandle = this.__registerResource(colorTexture);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, colorTexture);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, width, height, 2);
    if (!this.__glw!.webgl2ExtMLTVIEW.is_multisample)
      this.__glw!.webgl2ExtMLTVIEW.framebufferTextureMultiviewOVR(
        gl.DRAW_FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        colorTexture!,
        0,
        0,
        2
      );
    else
      this.__glw!.webgl2ExtMLTVIEW.framebufferTextureMultisampleMultiviewOVR(
        gl.DRAW_FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        colorTexture!,
        0,
        samples,
        0,
        2
      );

    // depth texture / attachment
    const depthStencilTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, depthStencilTex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.DEPTH32F_STENCIL8, width, height, 2);
    if (!this.__glw!.webgl2ExtMLTVIEW.is_multisample)
      this.__glw!.webgl2ExtMLTVIEW.framebufferTextureMultiviewOVR(
        gl.DRAW_FRAMEBUFFER,
        gl.DEPTH_STENCIL_ATTACHMENT,
        depthStencilTex!,
        0,
        0,
        2
      );
    else
      this.__glw!.webgl2ExtMLTVIEW.framebufferTextureMultisampleMultiviewOVR(
        gl.DRAW_FRAMEBUFFER,
        gl.DEPTH_STENCIL_ATTACHMENT,
        depthStencilTex!,
        0,
        samples,
        0,
        2
      );

    return [framebufferHandle, colorTextureHandle];
  }

  createTransformFeedback() {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const transformFeedback = gl.createTransformFeedback();
    const resourceHandle = this.__registerResource(transformFeedback!);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

    return resourceHandle;
  }

  deleteTransformFeedback(transformFeedbackUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    const transformFeedback = this.getWebGLResource(transformFeedbackUid)!;
    gl.deleteTransformFeedback(transformFeedback as WebGLTransformFeedback);
    this.__webglResources.delete(transformFeedbackUid);
  }

  setViewport(viewport?: Vector4) {
    if (viewport) {
      this.__glw?.setViewportAsVector4(viewport);
      SystemState.viewportAspectRatio = (viewport.z - viewport.x) / (viewport.w - viewport.y);
    } else {
      this.__glw?.setViewport(0, 0, this.__glw!.width, this.__glw!.height);
      SystemState.viewportAspectRatio = this.__glw!.width / this.__glw!.height;
    }
  }

  clearFrameBuffer(renderPass: RenderPass, _ = 0) {
    const gl = this.__glw!.getRawContext();
    let bufferBit = 0;
    if (renderPass.toClearColorBuffer) {
      gl.clearColor(renderPass.clearColor.x, renderPass.clearColor.y, renderPass.clearColor.z, renderPass.clearColor.w);
      bufferBit |= gl.COLOR_BUFFER_BIT;
    }
    if (renderPass.toClearDepthBuffer) {
      gl.clearDepth(renderPass.clearDepth);
      bufferBit |= gl.DEPTH_BUFFER_BIT;
    }
    if (renderPass.toClearStencilBuffer) {
      gl.clearStencil(renderPass.clearStencil);
      bufferBit |= gl.STENCIL_BUFFER_BIT;
    }
    if (bufferBit !== 0) {
      gl.clear(bufferBit);
    }
  }

  deleteVertexDataResources(vertexHandles: VertexHandles) {
    const gl = this.__glw!.getRawContext();

    const iboHandle = vertexHandles.iboHandle;
    if (iboHandle) {
      const ibo = this.getWebGLResource(iboHandle) as WebGLBuffer;
      gl.deleteBuffer(ibo);
      this.__webglResources.delete(iboHandle);
    }

    const vboHandles = vertexHandles.vboHandles;
    for (const vboHandle of vboHandles) {
      const vbo = this.getWebGLResource(vboHandle) as WebGLBuffer;
      gl.deleteBuffer(vbo);
      this.__webglResources.delete(vboHandle);
    }

    const vaoHandle = vertexHandles.vaoHandle;
    const vao = this.getWebGLResource(vaoHandle) as WebGLVertexArrayObject;
    this.__glw!.deleteVertexArray(vao);
    this.__webglResources.delete(vaoHandle);
  }

  deleteVertexArray(vaoHandle: WebGLResourceHandle) {
    const vao = this.getWebGLResource(vaoHandle) as WebGLVertexArrayObject;
    this.__glw!.deleteVertexArray(vao);
    this.__webglResources.delete(vaoHandle);
  }

  deleteVertexBuffer(vboUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();
    const vbo = this.getWebGLResource(vboUid) as WebGLBuffer;
    gl.deleteBuffer(vbo);
    this.__webglResources.delete(vboUid);
  }

  resizeCanvas(width: Size, height: Size) {
    this.__glw!.width = width;
    this.__glw!.height = height;
    this.__glw!.canvas.width = width;
    this.__glw!.canvas.height = height;
    this.__glw!.setViewportAsVector4(Vector4.fromCopyArray([0, 0, width, height]));
  }

  getCanvasSize(): [Size, Size] {
    return [this.__glw!.canvas.width, this.__glw!.canvas.height];
  }

  switchDepthTest(flag: boolean) {
    const gl = this.__glw!.getRawContext();
    if (flag) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }

  rebuildProgramBySpector(
    this: RnWebGLProgram,
    updatedVertexSourceCode: string, // The new vertex shader source
    updatedFragmentSourceCode: string, // The new fragment shader source
    onCompiled: (program: WebGLProgram) => void, // Callback triggered by your engine when the compilation is successful. It needs to send back the new linked program.
    onError: (message: string) => void
  ): boolean {
    // Callback triggered by your engine in case of error. It needs to send the WebGL error to allow the editor to display the error in the gutter.

    const material = this._material.deref();
    if (Is.not.exist(material)) {
      const warn = 'Material Not found';
      Logger.warn(warn);
      onError(warn);
      return false;
    }

    const processApproach = SystemState.currentProcessApproach;
    const renderingStrategy = getRenderingStrategy(processApproach);

    const modifiedVertexSourceCode = updatedVertexSourceCode.replace(/! =/g, '!=');
    const modifiedPixelSourceCode = updatedFragmentSourceCode.replace(/! =/g, '!=');

    const programUid = renderingStrategy._reSetupShaderForMaterialBySpector(
      material,
      this._primitive.deref()!,
      {
        vertex: modifiedVertexSourceCode,
        pixel: modifiedPixelSourceCode,
      },
      onError
    );
    if (programUid < 0) {
      return false;
    }

    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const program = webglResourceRepository.getWebGLResource(programUid) as RnWebGLProgram;

    if (programUid > 0) {
      onCompiled(program);
    }

    return true;
  }

  getPixelDataFromTexture(texUid: WebGLResourceHandle, x: number, y: number, width: number, height: number) {
    const gl = this.__glw!.getRawContext();
    const pixels = new Uint8Array((width - x) * (height - y) * 4);
    const texture = this.getWebGLResource(texUid) as WebGLTexture;
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    return pixels;
  }

  setWebGLStateToDefaultForEffekseer() {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) as number;

    // Texture bindings
    for (let i = 0; i < maxTextureUnits; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, null);
      // gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
      // gl.bindTexture(gl.TEXTURE_3D, null);
      // gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
      gl.bindSampler(i, null);
    }

    // Restore active texture to TEXTURE0
    gl.activeTexture(gl.TEXTURE0);
  }

  setWebGLStateToDefault() {
    const gl = this.__glw!.getRawContextAsWebGL2();

    // Vertex array binding must be released first to avoid tampering with its state
    gl.bindVertexArray(null);

    // Buffer bindings
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.bindBuffer(gl.COPY_READ_BUFFER, null);
    gl.bindBuffer(gl.COPY_WRITE_BUFFER, null);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);

    // Transform feedback binding
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    // Framebuffer bindings
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Renderbuffer binding
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    // Current program
    gl.useProgram(null);

    // Clear values
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clearStencil(0);

    // Depth states
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    gl.depthRange(0, 1);

    // Enabled states
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.DITHER);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.disable(gl.SAMPLE_COVERAGE);
    gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.RASTERIZER_DISCARD);

    // Cull states
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    // Blend states
    gl.blendColor(0, 0, 0, 0);
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ZERO);

    // Stencil states
    gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.KEEP);
    gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.KEEP, gl.KEEP);
    gl.stencilFuncSeparate(gl.FRONT, gl.ALWAYS, 0, 0xffffffff);
    gl.stencilFuncSeparate(gl.BACK, gl.ALWAYS, 0, 0xffffffff);
    gl.stencilMaskSeparate(gl.FRONT, 0xffffffff);
    gl.stencilMaskSeparate(gl.BACK, 0xffffffff);

    // Color states
    gl.colorMask(true, true, true, true);

    // Polygon offset states
    gl.polygonOffset(0, 0);

    // Sample coverage states
    gl.sampleCoverage(1.0, false);

    // Scissor states (default to full viewport - will be set properly when viewport is known)
    const canvas = this.__glw!.canvas;
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) as number;
    gl.scissor(0, 0, canvas.width, canvas.height);

    // Viewport states (default to full canvas)
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Line width
    gl.lineWidth(1.0);

    // Texture bindings
    for (let i = 0; i < maxTextureUnits; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
      gl.bindTexture(gl.TEXTURE_3D, null);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
      gl.bindSampler(i, null);
    }

    // Restore active texture to TEXTURE0
    gl.activeTexture(gl.TEXTURE0);
  }

  restoreWebGLStates(webGLStates: WebGLStates) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    // Enabled states
    if (webGLStates.depthTest) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
    if (webGLStates.stencilTest) {
      gl.enable(gl.STENCIL_TEST);
    } else {
      gl.disable(gl.STENCIL_TEST);
    }
    if (webGLStates.blend) {
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }
    if (webGLStates.dither) {
      gl.enable(gl.DITHER);
    } else {
      gl.disable(gl.DITHER);
    }
    if (webGLStates.scissorTest) {
      gl.enable(gl.SCISSOR_TEST);
    } else {
      gl.disable(gl.SCISSOR_TEST);
    }
    if (webGLStates.polygonOffsetFill) {
      gl.enable(gl.POLYGON_OFFSET_FILL);
    } else {
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    if (webGLStates.sampleCoverage) {
      gl.enable(gl.SAMPLE_COVERAGE);
    } else {
      gl.disable(gl.SAMPLE_COVERAGE);
    }
    if (webGLStates.sampleAlphaToCoverage) {
      gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    } else {
      gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    }
    if (webGLStates.cullFace) {
      gl.enable(gl.CULL_FACE);
    } else {
      gl.disable(gl.CULL_FACE);
    }
    if (webGLStates.rasterizerDiscard) {
      gl.enable(gl.RASTERIZER_DISCARD);
    } else {
      gl.disable(gl.RASTERIZER_DISCARD);
    }

    // Depth states
    gl.depthFunc(webGLStates.depthFunc);
    gl.depthMask(webGLStates.depthWriteMask);
    gl.clearDepth(webGLStates.depthClearValue);
    gl.depthRange(webGLStates.depthRange[0], webGLStates.depthRange[1]);

    // Stencil states
    gl.stencilFuncSeparate(gl.FRONT, webGLStates.stencilFunc, webGLStates.stencilRef, webGLStates.stencilValueMask);
    gl.stencilFuncSeparate(
      gl.BACK,
      webGLStates.stencilBackFunc,
      webGLStates.stencilBackRef,
      webGLStates.stencilBackValueMask
    );
    gl.stencilOpSeparate(
      gl.FRONT,
      webGLStates.stencilFail,
      webGLStates.stencilPassDepthFail,
      webGLStates.stencilPassDepthPass
    );
    gl.stencilOpSeparate(
      gl.BACK,
      webGLStates.stencilBackFail,
      webGLStates.stencilBackPassDepthFail,
      webGLStates.stencilBackPassDepthPass
    );
    gl.stencilMaskSeparate(gl.FRONT, webGLStates.stencilWriteMask);
    gl.stencilMaskSeparate(gl.BACK, webGLStates.stencilBackWriteMask);
    gl.clearStencil(webGLStates.stencilClearValue);

    // Blend states
    gl.blendFuncSeparate(
      webGLStates.blendSrcRgb,
      webGLStates.blendDstRgb,
      webGLStates.blendSrcAlpha,
      webGLStates.blendDstAlpha
    );
    gl.blendEquationSeparate(webGLStates.blendEquationRgb, webGLStates.blendEquationAlpha);
    gl.blendColor(
      webGLStates.blendColor[0],
      webGLStates.blendColor[1],
      webGLStates.blendColor[2],
      webGLStates.blendColor[3]
    );

    // Color states
    gl.clearColor(
      webGLStates.colorClearValue[0],
      webGLStates.colorClearValue[1],
      webGLStates.colorClearValue[2],
      webGLStates.colorClearValue[3]
    );
    gl.colorMask(
      webGLStates.colorWriteMask[0],
      webGLStates.colorWriteMask[1],
      webGLStates.colorWriteMask[2],
      webGLStates.colorWriteMask[3]
    );

    // Cull states
    gl.cullFace(webGLStates.cullFaceMode);
    gl.frontFace(webGLStates.frontFace);

    // Polygon offset states
    gl.polygonOffset(webGLStates.polygonOffsetFactor, webGLStates.polygonOffsetUnits);

    // Sample coverage states
    gl.sampleCoverage(webGLStates.sampleCoverageValue, webGLStates.sampleCoverageInvert);

    // Scissor states
    gl.scissor(
      webGLStates.scissorBox[0],
      webGLStates.scissorBox[1],
      webGLStates.scissorBox[2],
      webGLStates.scissorBox[3]
    );

    // Viewport states
    gl.viewport(webGLStates.viewport[0], webGLStates.viewport[1], webGLStates.viewport[2], webGLStates.viewport[3]);

    // Line width
    gl.lineWidth(webGLStates.lineWidth);

    // Binding states
    // Restore texture bindings
    for (let i = 0; i < webGLStates.textureBindings.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      const binding = webGLStates.textureBindings[i];
      gl.bindTexture(gl.TEXTURE_2D, binding.texture2D);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, binding.textureCubeMap);
      gl.bindTexture(gl.TEXTURE_3D, binding.texture3D);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, binding.texture2DArray);
      gl.bindSampler(i, binding.sampler);
    }
    // Restore active texture
    gl.activeTexture(webGLStates.activeTexture);

    // Restore buffer bindings (ARRAY_BUFFER and other buffers can be bound before VAO)
    gl.bindBuffer(gl.ARRAY_BUFFER, webGLStates.arrayBufferBinding);
    gl.bindBuffer(gl.UNIFORM_BUFFER, webGLStates.uniformBufferBinding);
    gl.bindBuffer(gl.COPY_READ_BUFFER, webGLStates.copyReadBufferBinding);
    gl.bindBuffer(gl.COPY_WRITE_BUFFER, webGLStates.copyWriteBufferBinding);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, webGLStates.pixelPackBufferBinding);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, webGLStates.pixelUnpackBufferBinding);

    // Restore transform feedback binding
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, webGLStates.transformFeedbackBinding);

    // Restore framebuffer bindings
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, webGLStates.readFramebufferBinding);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, webGLStates.drawFramebufferBinding);

    // Restore renderbuffer binding
    gl.bindRenderbuffer(gl.RENDERBUFFER, webGLStates.renderbufferBinding);

    // Restore vertex array binding
    // Note: ELEMENT_ARRAY_BUFFER is part of VAO state, so it must be bound after VAO is bound
    gl.bindVertexArray(webGLStates.vertexArrayBinding);

    // Restore ELEMENT_ARRAY_BUFFER after VAO is bound
    // If VAO is null, this will set the global ELEMENT_ARRAY_BUFFER binding
    // If VAO is not null, this will update the VAO's ELEMENT_ARRAY_BUFFER binding
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webGLStates.elementArrayBufferBinding);

    // Restore current program
    gl.useProgram(webGLStates.currentProgram);
  }

  getCurrentWebGLStates(): WebGLStates {
    const gl = this.__glw!.getRawContextAsWebGL2();

    // Enabled states
    const depthTest = gl.isEnabled(gl.DEPTH_TEST);
    const stencilTest = gl.isEnabled(gl.STENCIL_TEST);
    const blend = gl.isEnabled(gl.BLEND);
    const dither = gl.isEnabled(gl.DITHER);
    const scissorTest = gl.isEnabled(gl.SCISSOR_TEST);
    const polygonOffsetFill = gl.isEnabled(gl.POLYGON_OFFSET_FILL);
    const sampleCoverage = gl.isEnabled(gl.SAMPLE_COVERAGE);
    const sampleAlphaToCoverage = gl.isEnabled(gl.SAMPLE_ALPHA_TO_COVERAGE);
    const cullFace = gl.isEnabled(gl.CULL_FACE);
    const rasterizerDiscard = gl.isEnabled(gl.RASTERIZER_DISCARD);

    // Depth states
    const depthFunc = gl.getParameter(gl.DEPTH_FUNC) as number;
    const depthWriteMask = gl.getParameter(gl.DEPTH_WRITEMASK) as boolean;
    const depthClearValue = gl.getParameter(gl.DEPTH_CLEAR_VALUE) as number;
    const depthRange = gl.getParameter(gl.DEPTH_RANGE) as Float32Array;
    const depthRangeTuple: [number, number] = [depthRange[0], depthRange[1]];

    // Stencil states
    const stencilFunc = gl.getParameter(gl.STENCIL_FUNC) as number;
    const stencilValueMask = gl.getParameter(gl.STENCIL_VALUE_MASK) as number;
    const stencilRef = gl.getParameter(gl.STENCIL_REF) as number;
    const stencilBackFunc = gl.getParameter(gl.STENCIL_BACK_FUNC) as number;
    const stencilBackValueMask = gl.getParameter(gl.STENCIL_BACK_VALUE_MASK) as number;
    const stencilBackRef = gl.getParameter(gl.STENCIL_BACK_REF) as number;
    const stencilFail = gl.getParameter(gl.STENCIL_FAIL) as number;
    const stencilPassDepthFail = gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL) as number;
    const stencilPassDepthPass = gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS) as number;
    const stencilBackFail = gl.getParameter(gl.STENCIL_BACK_FAIL) as number;
    const stencilBackPassDepthFail = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_FAIL) as number;
    const stencilBackPassDepthPass = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_PASS) as number;
    const stencilWriteMask = gl.getParameter(gl.STENCIL_WRITEMASK) as number;
    const stencilBackWriteMask = gl.getParameter(gl.STENCIL_BACK_WRITEMASK) as number;
    const stencilClearValue = gl.getParameter(gl.STENCIL_CLEAR_VALUE) as number;

    // Blend states
    const blendSrcRgb = gl.getParameter(gl.BLEND_SRC_RGB) as number;
    const blendDstRgb = gl.getParameter(gl.BLEND_DST_RGB) as number;
    const blendSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA) as number;
    const blendDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA) as number;
    const blendEquationRgb = gl.getParameter(gl.BLEND_EQUATION_RGB) as number;
    const blendEquationAlpha = gl.getParameter(gl.BLEND_EQUATION_ALPHA) as number;
    const blendColor = gl.getParameter(gl.BLEND_COLOR) as Float32Array;
    const blendColorTuple: [number, number, number, number] = [
      blendColor[0],
      blendColor[1],
      blendColor[2],
      blendColor[3],
    ];

    // Color states
    const colorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE) as Float32Array;
    const colorClearValueTuple: [number, number, number, number] = [
      colorClearValue[0],
      colorClearValue[1],
      colorClearValue[2],
      colorClearValue[3],
    ];
    const colorWriteMask = gl.getParameter(gl.COLOR_WRITEMASK) as boolean[];
    const colorWriteMaskTuple: [boolean, boolean, boolean, boolean] = [
      colorWriteMask[0],
      colorWriteMask[1],
      colorWriteMask[2],
      colorWriteMask[3],
    ];

    // Cull states
    const cullFaceMode = gl.getParameter(gl.CULL_FACE_MODE) as number;
    const frontFace = gl.getParameter(gl.FRONT_FACE) as number;

    // Polygon offset states
    const polygonOffsetFactor = gl.getParameter(gl.POLYGON_OFFSET_FACTOR) as number;
    const polygonOffsetUnits = gl.getParameter(gl.POLYGON_OFFSET_UNITS) as number;

    // Sample coverage states
    const sampleCoverageValue = gl.getParameter(gl.SAMPLE_COVERAGE_VALUE) as number;
    const sampleCoverageInvert = gl.getParameter(gl.SAMPLE_COVERAGE_INVERT) as boolean;

    // Scissor states
    const scissorBox = gl.getParameter(gl.SCISSOR_BOX) as Int32Array;
    const scissorBoxTuple: [number, number, number, number] = [
      scissorBox[0],
      scissorBox[1],
      scissorBox[2],
      scissorBox[3],
    ];

    // Viewport states
    const viewport = gl.getParameter(gl.VIEWPORT) as Int32Array;
    const viewportTuple: [number, number, number, number] = [viewport[0], viewport[1], viewport[2], viewport[3]];

    // Line width
    const lineWidth = gl.getParameter(gl.LINE_WIDTH) as number;

    // Binding states
    // Get texture bindings for all available texture units
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) as number;
    const textureBindings: Array<{
      texture2D: WebGLTexture | null;
      textureCubeMap: WebGLTexture | null;
      texture3D: WebGLTexture | null;
      texture2DArray: WebGLTexture | null;
      sampler: WebGLSampler | null;
    }> = [];

    const currentActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE) as number;
    const activeTexture = currentActiveTexture;
    for (let i = 0; i < maxTextureUnits; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      const texture2D = gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null;
      const textureCubeMap = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP) as WebGLTexture | null;
      const texture3D = gl.getParameter(gl.TEXTURE_BINDING_3D) as WebGLTexture | null;
      const texture2DArray = gl.getParameter(gl.TEXTURE_BINDING_2D_ARRAY) as WebGLTexture | null;
      const sampler = gl.getParameter(gl.SAMPLER_BINDING) as WebGLSampler | null;

      textureBindings.push({
        texture2D,
        textureCubeMap,
        texture3D,
        texture2DArray,
        sampler,
      });
    }
    // Restore the original active texture
    gl.activeTexture(currentActiveTexture);

    const arrayBufferBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING) as WebGLBuffer | null;
    const elementArrayBufferBinding = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING) as WebGLBuffer | null;
    const uniformBufferBinding = gl.getParameter(gl.UNIFORM_BUFFER_BINDING) as WebGLBuffer | null;
    const transformFeedbackBinding = gl.getParameter(gl.TRANSFORM_FEEDBACK_BINDING) as WebGLTransformFeedback | null;
    const copyReadBufferBinding = gl.getParameter(gl.COPY_READ_BUFFER_BINDING) as WebGLBuffer | null;
    const copyWriteBufferBinding = gl.getParameter(gl.COPY_WRITE_BUFFER_BINDING) as WebGLBuffer | null;
    const pixelPackBufferBinding = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING) as WebGLBuffer | null;
    const pixelUnpackBufferBinding = gl.getParameter(gl.PIXEL_UNPACK_BUFFER_BINDING) as WebGLBuffer | null;
    const readFramebufferBinding = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    const drawFramebufferBinding = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    const renderbufferBinding = gl.getParameter(gl.RENDERBUFFER_BINDING) as WebGLRenderbuffer | null;
    const vertexArrayBinding = gl.getParameter(gl.VERTEX_ARRAY_BINDING) as WebGLVertexArrayObject | null;
    const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null;

    return {
      // Enabled states
      depthTest,
      stencilTest,
      blend,
      dither,
      scissorTest,
      polygonOffsetFill,
      sampleCoverage,
      sampleAlphaToCoverage,
      cullFace,
      rasterizerDiscard,

      // Depth states
      depthFunc,
      depthWriteMask,
      depthClearValue,
      depthRange: depthRangeTuple,

      // Stencil states
      stencilFunc,
      stencilValueMask,
      stencilRef,
      stencilBackFunc,
      stencilBackValueMask,
      stencilBackRef,
      stencilFail,
      stencilPassDepthFail,
      stencilPassDepthPass,
      stencilBackFail,
      stencilBackPassDepthFail,
      stencilBackPassDepthPass,
      stencilWriteMask,
      stencilBackWriteMask,
      stencilClearValue,

      // Blend states
      blendSrcRgb,
      blendDstRgb,
      blendSrcAlpha,
      blendDstAlpha,
      blendEquationRgb,
      blendEquationAlpha,
      blendColor: blendColorTuple,

      // Color states
      colorClearValue: colorClearValueTuple,
      colorWriteMask: colorWriteMaskTuple,

      // Cull states
      cullFaceMode,
      frontFace,

      // Polygon offset states
      polygonOffsetFactor,
      polygonOffsetUnits,

      // Sample coverage states
      sampleCoverageValue,
      sampleCoverageInvert,

      // Scissor states
      scissorBox: scissorBoxTuple,

      // Viewport states
      viewport: viewportTuple,

      // Line width
      lineWidth,

      // Binding states
      activeTexture,
      textureBindings,
      arrayBufferBinding,
      elementArrayBufferBinding,
      uniformBufferBinding,
      transformFeedbackBinding,
      copyReadBufferBinding,
      copyWriteBufferBinding,
      pixelPackBufferBinding,
      pixelUnpackBufferBinding,
      readFramebufferBinding,
      drawFramebufferBinding,
      renderbufferBinding,
      vertexArrayBinding,
      currentProgram,
    };
  }

  unbindTextureSamplers() {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) as number;
    for (let i = 0; i < maxTextureUnits; i++) {
      gl.bindSampler(i, null);
    }
  }

  isSupportMultiViewVRRendering(): boolean {
    if (SystemState.currentProcessApproach === ProcessApproach.DataTexture) {
      return this.__glw!.isMultiview();
    }
    return false;
  }

  blitToTexture2dFromTexture2dArray(
    srcTextureUid: WebGLResourceHandle,
    dstFboUid: WebGLResourceHandle,
    dstWidth: number,
    dstHeight: number
  ) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const srcTexture = this.getWebGLResource(srcTextureUid) as WebGLTexture;
    const dstFbo = this.getWebGLResource(dstFboUid) as WebGLFramebuffer;
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dstFbo);

    const webStereoUtil = WebGLStereoUtil.getInstance(gl);
    webStereoUtil.blit(srcTexture, 0, 0, 1, 1, dstWidth, dstHeight);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }
  blitToTexture2dFromTexture2dArrayFake(
    srcTextureUid: WebGLResourceHandle,
    dstFboUid: WebGLResourceHandle,
    dstWidth: number,
    dstHeight: number
  ) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const srcTexture = this.getWebGLResource(srcTextureUid) as WebGLTexture;
    const dstFbo = this.getWebGLResource(dstFboUid) as WebGLFramebuffer;
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dstFbo);

    const webStereoUtil = WebGLStereoUtil.getInstance(gl);
    webStereoUtil.blitFake(srcTexture, 0, 0, 1, 1, dstWidth, dstHeight);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }
  blitToTexture2dFromTexture2dArray2(
    srcTextureUid: WebGLResourceHandle,
    dstTextureUid: WebGLResourceHandle,
    dstWidth: number,
    dstHeight: number
  ) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const srcTexture = this.getWebGLResource(srcTextureUid) as WebGLTexture;
    const dstTexture = this.getWebGLResource(dstTextureUid) as WebGLTexture;
    const webStereoUtil = WebGLStereoUtil.getInstance(gl);
    webStereoUtil.blit2(srcTexture, dstTexture, dstWidth, dstHeight);
  }
}
