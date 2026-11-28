// src/webgl/WebGLResourceRepository.ts
import HDRImage from "../_deps/vendor__hdrpng.js";
import { BasisCompressionType } from "../foundation/definitions/BasisCompressionType.js";
import { ComponentType } from "../foundation/definitions/ComponentType.js";
import { CompositionType } from "../foundation/definitions/CompositionType.js";
import { HdriFormat } from "../foundation/definitions/HdriFormat.js";
import { PixelFormat } from "../foundation/definitions/PixelFormat.js";
import { ProcessApproach } from "../foundation/definitions/ProcessApproach.js";
import { RenderBufferTarget } from "../foundation/definitions/RenderBufferTarget.js";
import { TextureFormat } from "../foundation/definitions/TextureFormat.js";
import { TextureParameter } from "../foundation/definitions/TextureParameter.js";
import { VertexAttribute } from "../foundation/definitions/VertexAttribute.js";
import { MathUtil } from "../foundation/math/MathUtil.js";
import { Vector4 } from "../foundation/math/Vector4.js";
import { DataUtil } from "../foundation/misc/DataUtil.js";
import { Is } from "../foundation/misc/Is.js";
import { Logger } from "../foundation/misc/Logger.js";
import { MiscUtil } from "../foundation/misc/MiscUtil.js";
import {
  CGAPIResourceRepository
} from "../foundation/renderer/CGAPIResourceRepository.js";
import { RenderTargetTexture } from "../foundation/textures/RenderTargetTexture.js";
import { RenderTargetTexture2DArray } from "../foundation/textures/RenderTargetTexture2DArray.js";
import { Sampler } from "../foundation/textures/Sampler.js";
import { GL_TEXTURE_2D } from "../types/WebGLConstants.js";
import getRenderingStrategy from "./getRenderingStrategy.js";
import { InstanceSidTable } from "./InstanceSidTable.js";
import { MultiDrawRepository } from "./MultiDrawRepository.js";
import { WebGLContextWrapper } from "./WebGLContextWrapper.js";
import { WebGLExtension } from "./WebGLExtension.js";
import { WebGLStereoUtil } from "./WebGLStereoUtil.js";
var WebGLResourceRepository = class _WebGLResourceRepository extends CGAPIResourceRepository {
  constructor() {
    super();
    this.VD = /* @__PURE__ */ new Map();
    this.WD = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.ED = /* @__PURE__ */ new Map();
    this.ID = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.JD = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.KD = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.LD = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.MD = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.ND = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.OD = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  }
  /**
   * Gets the singleton instance of WebGLResourceRepository.
   *
   * @returns The singleton instance of WebGLResourceRepository
   */
  static init() {
    return new _WebGLResourceRepository();
  }
  /**
   * Adds an existing WebGL2 context to the repository.
   *
   * @param config - The configuration for the WebGL context
   * @param gl - The WebGL2 rendering context to add
   * @param canvas - The HTML canvas element associated with the context
   * @param asCurrent - Whether to set this context as the current active context
   */
  addWebGLContext(config, gl, canvas, asCurrent) {
    var _a;
    const glw = new WebGLContextWrapper(config, gl, canvas);
    this.VD.set("default", glw);
    if (asCurrent) {
      (_a = this.FD) == null ? void 0 : _a.invalidateAll();
      this.FD = void 0;
      this.GD = void 0;
      this.CD = glw;
    }
  }
  /**
   * Generates a new WebGL2 context for the given canvas element.
   *
   * @param config - The configuration for the WebGL context
   * @param canvas - The HTML canvas element to create the context for
   * @param asCurrent - Whether to set this context as the current active context
   * @param webglOption - Optional WebGL context attributes for context creation
   * @returns The created WebGL2 rendering context
   */
  generateWebGLContext(config, canvas, asCurrent, webglOption) {
    const gl = canvas.getContext("webgl2", webglOption);
    this.addWebGLContext(config, gl, canvas, asCurrent);
    return gl;
  }
  /**
   * Gets the current WebGL context wrapper.
   *
   * @returns The current WebGLContextWrapper instance or undefined if none is set
   */
  get currentWebGLContextWrapper() {
    return this.CD;
  }
  /**
   * Gets the engine-wide instance SID table used by multi-draw rendering.
   * The table is created lazily for the current WebGL context.
   */
  get instanceSidTable() {
    if (this.GD == null) {
      if (this.CD == null) {
        throw new Error("No WebGL context is available for the instance SID table.");
      }
      this.GD = new InstanceSidTable(this.CD);
    }
    return this.GD;
  }
  /**
   * Whether this context can use the instance SID path used by multi-draw rendering.
   * The instance tables live in the data texture (unit 0), so WebGL2 plus the
   * WEBGL_multi_draw extension are the only requirements.
   */
  get isInstanceSidTextureCapable() {
    var _a;
    return ((_a = this.CD) == null ? void 0 : _a.isWebGL2) === true && this.CD.webgl2ExtMD != null;
  }
  /**
   * Gets the engine-wide multi-draw group repository, creating it lazily.
   * @param engine - The engine that owns the WebGL context
   */
  getMultiDrawRepository(engine) {
    if (this.FD == null) {
      this.FD = new MultiDrawRepository(engine);
    }
    return this.FD;
  }
  /**
   * Generates a unique resource handle for WebGL objects.
   *
   * @returns A unique WebGL resource handle
   */
  getResourceNumber() {
    return ++this.WD;
  }
  /**
   * Registers a WebGL object and assigns it a unique handle.
   *
   * @param obj - The WebGL object to register
   * @returns The assigned resource handle
   */
  DD(obj) {
    const handle = this.getResourceNumber();
    obj._resourceUid = handle;
    this.ED.set(handle, obj);
    return handle;
  }
  /**
   * Retrieves a WebGL resource by its handle.
   *
   * @param WebGLResourceHandle - The handle of the resource to retrieve
   * @returns The WebGL resource or null if not found
   */
  getWebGLResource(WebGLResourceHandle) {
    const result = this.ED.get(WebGLResourceHandle);
    return result != null ? result : null;
  }
  /**
   * Creates an index buffer from the provided accessor data.
   *
   * @param accessor - The accessor containing index data
   * @returns The handle of the created index buffer
   * @throws Error if no WebGL context is available
   */
  createIndexBuffer(accessor) {
    const gl = this.CD.getRawContext();
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    this.CD.bindVertexArray(null);
    const ibo = gl.createBuffer();
    const resourceHandle = this.DD(ibo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
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
  updateIndexBuffer(accessor, resourceHandle) {
    const glw = this.CD;
    const gl = glw == null ? void 0 : glw.getRawContext();
    if (Is.not.exist(gl)) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    const ibo = this.ED.get(resourceHandle);
    if (Is.not.exist(ibo)) {
      throw new Error("Not found IBO.");
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
  createVertexBuffer(accessor) {
    const gl = this.CD.getRawContext();
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    this.CD.bindVertexArray(null);
    const vbo = gl.createBuffer();
    const resourceHandle = this.DD(vbo);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, accessor.getUint8Array(), gl.STATIC_DRAW);
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
  createVertexBufferFromTypedArray(typedArray) {
    const gl = this.CD.getRawContext();
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    this.CD.bindVertexArray(null);
    const vbo = gl.createBuffer();
    const resourceHandle = this.DD(vbo);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return resourceHandle;
  }
  /**
   * Creates an index buffer directly from a typed array.
   *
   * @param typedArray - The typed array containing index data
   * @returns The handle of the created index buffer
   */
  createIndexBufferFromTypedArray(typedArray) {
    const gl = this.CD.getRawContext();
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    this.CD.bindVertexArray(null);
    const ibo = gl.createBuffer();
    const resourceHandle = this.DD(ibo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return resourceHandle;
  }
  /**
   * Updates an existing vertex buffer with new data from the accessor.
   *
   * @param accessor - The accessor containing new vertex data
   * @param resourceHandle - The handle of the vertex buffer to update
   * @throws Error if no WebGL context is available or VBO not found
   */
  updateVertexBuffer(accessor, resourceHandle) {
    const glw = this.CD;
    const gl = glw == null ? void 0 : glw.getRawContext();
    if (!Is.exist(gl)) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    const vbo = this.ED.get(resourceHandle);
    if (!Is.exist(vbo)) {
      throw new Error("Not found VBO.");
    }
    glw.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, accessor.getUint8Array());
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  /**
   * Overwrites the beginning of an existing vertex buffer with the given typed array.
   *
   * The vertex array binding is left untouched: the ARRAY_BUFFER binding is not part of the VAO state,
   * so this can be called between draw calls without disturbing the bound VAO.
   *
   * @param resourceHandle - The handle of the vertex buffer to update
   * @param typedArray - The data written from the beginning of the buffer
   * @throws Error if no WebGL context is available or VBO not found
   */
  updateVertexBufferWithTypedArray(resourceHandle, typedArray) {
    var _a;
    const gl = (_a = this.CD) == null ? void 0 : _a.getRawContext();
    if (!Is.exist(gl)) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    const vbo = this.ED.get(resourceHandle);
    if (!Is.exist(vbo)) {
      throw new Error("Not found VBO.");
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, typedArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  /**
   * Creates a new vertex array object (VAO).
   *
   * @returns The handle of the created VAO or undefined if creation failed
   * @throws Error if no WebGL context is available
   */
  createVertexArray() {
    const gl = this.CD;
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    const vao = this.CD.createVertexArray();
    if (Is.not.exist(vao)) {
      return void 0;
    }
    const resourceHandle = this.DD(vao);
    return resourceHandle;
  }
  /**
   * Binds a 2D texture to the specified texture slot.
   *
   * @param textureSlotIndex - The texture slot index to bind to
   * @param textureUid - The handle of the texture to bind
   */
  bindTexture2D(textureSlotIndex, textureUid) {
    const texture = this.ED.get(textureUid);
    this.CD.bindTexture2D(textureSlotIndex, texture);
  }
  /**
   * Binds a texture sampler to the specified texture slot.
   *
   * @param textureSlotIndex - The texture slot index to bind to
   * @param samplerUid - The handle of the sampler to bind, or -1 to unbind
   */
  bindTextureSampler(textureSlotIndex, samplerUid) {
    if (samplerUid === -1) {
      this.CD.bindTextureSampler(textureSlotIndex, null);
    } else {
      const sampler = this.getWebGLResource(samplerUid);
      this.CD.bindTextureSampler(textureSlotIndex, sampler);
    }
  }
  /**
   * Binds a cube texture to the specified texture slot.
   *
   * @param textureSlotIndex - The texture slot index to bind to
   * @param textureUid - The handle of the cube texture to bind
   */
  bindTextureCube(textureSlotIndex, textureUid) {
    const texture = this.getWebGLResource(textureUid);
    this.CD.bindTextureCube(textureSlotIndex, texture);
  }
  /**
   * Binds a 2D texture array to the specified texture slot.
   *
   * @param textureSlotIndex - The texture slot index to bind to
   * @param textureUid - The handle of the 2D texture array to bind
   */
  bindTexture2DArray(textureSlotIndex, textureUid) {
    const texture = this.getWebGLResource(textureUid);
    this.CD.bindTexture2DArray(textureSlotIndex, texture);
  }
  /**
   * Creates vertex buffers and index buffers for a primitive and returns handles for them.
   * This method processes all vertex attributes of the primitive and creates corresponding VBOs.
   *
   * @param primitive - The primitive object containing vertex and index data
   * @returns VertexHandles object containing all created buffer handles and metadata
   */
  createVertexBufferAndIndexBuffer(primitive) {
    let iboHandle;
    if (primitive.hasIndices()) {
      iboHandle = this.createIndexBuffer(primitive.indicesAccessor);
    }
    const attributesFlags = [];
    for (let i = 0; i < VertexAttribute.AttributeTypeNumber; i++) {
      attributesFlags[i] = false;
    }
    const vboHandles = [];
    primitive.attributeAccessors.forEach((accessor, i) => {
      const vboHandle = this.createVertexBuffer(accessor);
      const slotIdx = VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]);
      attributesFlags[slotIdx] = true;
      vboHandles.push(vboHandle);
    });
    return {
      vaoHandle: -1,
      iboHandle,
      vboHandles,
      attributesFlags,
      setComplete: false
    };
  }
  /**
   * Updates existing vertex buffers and index buffers with new data from a primitive.
   *
   * @param primitive - The primitive object containing updated vertex and index data
   * @param vertexHandles - The handles of the buffers to update
   */
  updateVertexBufferAndIndexBuffer(primitive, vertexHandles) {
    if (vertexHandles.iboHandle) {
      this.updateIndexBuffer(primitive.indicesAccessor, vertexHandles.iboHandle);
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
   * @param params.config - Configuration for the shader program
   * @param params.engine - The engine instance
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
    config,
    engine,
    material,
    primitive,
    vertexShaderStr,
    fragmentShaderStr,
    attributeNames,
    attributeSemantics,
    onError
  }) {
    const gl = this.CD.getRawContext();
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    const isDebugMode = config.cgApiDebugConsoleOutput;
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderStr);
    gl.compileShader(vertexShader);
    if (isDebugMode) {
      const result = this.TD(
        engine,
        material.materialTypeName,
        vertexShader,
        vertexShaderStr,
        onError
      );
      if (!result) {
        return CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
    }
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderStr);
    gl.compileShader(fragmentShader);
    if (isDebugMode) {
      this.TD(engine, material.materialTypeName, fragmentShader, fragmentShaderStr, onError);
    }
    const shaderProgram = gl.createProgram();
    shaderProgram._engine = engine;
    shaderProgram._gl = gl;
    shaderProgram._materialTypeName = material.materialTypeName;
    if (isDebugMode) {
      shaderProgram._vertexShaderStr = vertexShaderStr;
      shaderProgram._fragmentShaderStr = fragmentShaderStr;
    }
    shaderProgram._shaderSemanticsInfoMap = /* @__PURE__ */ new Map();
    shaderProgram._material = new WeakRef(material);
    shaderProgram._primitive = new WeakRef(primitive);
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    const bindAttribLocation = (index, name) => {
      if (index >= 0 && index < maxVertexAttribs) {
        gl.bindAttribLocation(shaderProgram, index, name);
      }
    };
    attributeNames.forEach((attributeName, i) => {
      bindAttribLocation(attributeSemantics[i].getAttributeSlot(), attributeName);
    });
    bindAttribLocation(VertexAttribute.Instance.getAttributeSlot(), "a_instanceBase");
    bindAttribLocation(VertexAttribute.Instance.getAttributeSlot(), "a_instanceIds");
    bindAttribLocation(VertexAttribute.MaterialSid.getAttributeSlot(), "a_materialSid");
    gl.linkProgram(shaderProgram);
    if (isDebugMode) {
      const result = this.XD(
        engine,
        material.materialTypeName,
        shaderProgram,
        vertexShaderStr,
        fragmentShaderStr
      );
      if (!result) {
        return CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
    }
    shaderProgram.ZD = this.rebuildProgramBySpector.bind(shaderProgram);
    const resourceHandle = this.DD(shaderProgram);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return resourceHandle;
  }
  /**
   * Validates shader compilation status and logs errors if compilation fails.
   *
   * @param engine - The engine instance for logging
   * @param materialTypeName - The name of the material type for error context
   * @param shader - The compiled shader object to check
   * @param shaderText - The shader source code for error reporting
   * @param onError - Optional error callback function
   * @returns True if compilation succeeded, false otherwise
   */
  TD(engine, materialTypeName, shader, shaderText, onError) {
    const glw = this.CD;
    const gl = glw.getRawContext();
    if (Is.false(gl.getShaderParameter(shader, gl.COMPILE_STATUS)) && Is.false(gl.isContextLost())) {
      engine.logger.info(`MaterialTypeName: ${materialTypeName}`);
      const lineNumberedShaderText = MiscUtil.addLineNumberToCode(shaderText);
      engine.logger.info(lineNumberedShaderText);
      const log = gl.getShaderInfoLog(shader);
      if (onError === void 0) {
        engine.logger.error(`An error occurred compiling the shaders:${log}`);
        return false;
      }
      onError(log);
      return false;
    }
    return true;
  }
  /**
   * Validates shader program linking status and logs errors if linking fails.
   *
   * @param engine - The engine instance for logging
   * @param materialTypeName - The name of the material type for error context
   * @param shaderProgram - The linked shader program to check
   * @param vertexShaderText - The vertex shader source code for error reporting
   * @param fragmentShaderText - The fragment shader source code for error reporting
   * @returns True if linking succeeded, false otherwise
   */
  XD(engine, materialTypeName, shaderProgram, vertexShaderText, fragmentShaderText) {
    const glw = this.CD;
    const gl = glw.getRawContext();
    if (Is.false(gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) && Is.false(gl.isContextLost())) {
      engine.logger.info(`MaterialTypeName: ${materialTypeName}`);
      engine.logger.info(MiscUtil.addLineNumberToCode("Vertex Shader:"));
      engine.logger.info(MiscUtil.addLineNumberToCode(vertexShaderText));
      engine.logger.info(MiscUtil.addLineNumberToCode("Fragment Shader:"));
      engine.logger.info(MiscUtil.addLineNumberToCode(fragmentShaderText));
      const log = gl.getProgramInfoLog(shaderProgram);
      engine.logger.error(`Unable to initialize the shader program: ${log}`);
      return false;
    }
    return true;
  }
  /**
   * Sets up uniform locations for a shader program based on shader semantics information.
   * This method extracts uniform locations from the compiled shader program and stores them
   * for efficient access during rendering.
   *
   * @param config - Configuration for the shader program
   * @param shaderProgramUid - The handle of the shader program
   * @param infoArray - Array of shader semantics information
   * @returns The WebGL program object with configured uniform locations
   */
  setupUniformLocations(config, shaderProgramUid, infoArray) {
    const glw = this.CD;
    const gl = glw.getRawContext();
    const shaderProgram = this.getWebGLResource(shaderProgramUid);
    const infoArrayLen = infoArray.length;
    for (let i = 0; i < infoArrayLen; i++) {
      const info = infoArray[i];
      shaderProgram._shaderSemanticsInfoMap.set(info.semantic, info);
    }
    for (let i = 0; i < infoArrayLen; i++) {
      const info = infoArray[i];
      const isUniformExist = info.needUniformInDataTextureMode || CompositionType.isTexture(info.compositionType);
      if (isUniformExist) {
        const semanticSingular = info.semantic;
        const identifier = semanticSingular;
        const shaderVarName = `u_${info.semantic}`;
        const location = gl.getUniformLocation(shaderProgram, shaderVarName);
        const _shaderProgram = shaderProgram;
        _shaderProgram[identifier] = location;
        if (location == null && config.cgApiDebugConsoleOutput) {
          Logger.default.info(
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
  setupBasicUniformLocations(shaderProgramUid) {
    const shaderProgram = this.getWebGLResource(shaderProgramUid);
    const gl = this.currentWebGLContextWrapper.getRawContext();
    shaderProgram.dataTexture = gl.getUniformLocation(shaderProgram, "u_dataTexture");
    shaderProgram.currentComponentSIDs = gl.getUniformLocation(shaderProgram, "u_currentComponentSIDs");
    shaderProgram.lightClusterView = gl.getUniformLocation(shaderProgram, "u_lightClusterView");
  }
  /**
   * Sets a uniform value for texture binding and binds the texture to the appropriate slot.
   *
   * @param shaderProgram_ - The shader program to set the uniform for
   * @param semanticStr - The semantic string identifying the uniform
   * @param value - The value array containing texture slot index and texture data
   */
  setUniform1iForTexture(shaderProgram_, semanticStr, value) {
    const shaderProgram = shaderProgram_;
    const info = shaderProgram._shaderSemanticsInfoMap.get(semanticStr);
    if (info == null) {
      return;
    }
    let textureUnits = shaderProgram._textureUnitsOfSamplers;
    if (textureUnits == null) {
      textureUnits = /* @__PURE__ */ new Map();
      shaderProgram._textureUnitsOfSamplers = textureUnits;
    }
    const textureUnit = value[0];
    if (textureUnits.get(semanticStr) !== textureUnit) {
      const gl = this.CD.getRawContext();
      const loc = shaderProgram[semanticStr];
      gl.uniform1i(loc, textureUnit);
      textureUnits.set(semanticStr, textureUnit);
    }
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
  setUniformValue(shaderProgram_, semanticStr, _firstTime, value) {
    const shaderProgram = shaderProgram_;
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
      componentNumber = info.compositionType.getNumberOfComponents();
    }
    const isCompositionTypeArray = info.compositionType === CompositionType.ScalarArray || info.compositionType === CompositionType.Vec4Array || info.compositionType === CompositionType.Vec3Array || info.compositionType === CompositionType.Vec2Array;
    const isCompositionTypeTexture = CompositionType.isTexture(info.compositionType);
    const key = semanticStr;
    let updated = false;
    if (isCompositionTypeTexture) {
      updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, false, {
        x: value[0]
      });
      this.bindTexture(info, value);
    } else if (isCompositionTypeArray) {
      if (value._v == null) {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, true, {
          x: value
        });
      } else {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, true, {
          x: value._v
        });
      }
    } else if (info.compositionType === CompositionType.Scalar) {
      if (value._v == null) {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, false, {
          x: value
        });
      } else {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, true, {
          x: value._v
        });
      }
    } else {
      if (value._v == null) {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, false, value);
      } else {
        updated = this.setUniformValueInner(shaderProgram_, key, info, setAsMatrix, componentNumber, true, {
          x: value._v
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
  bindTexture(info, value) {
    var _a, _b;
    if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.Texture2DShadow) {
      this.bindTexture2D(value[0], value[1]._textureResourceUid);
      if (value[2] != null) {
        this.bindTextureSampler(value[0], value[2]._samplerResourceUid);
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
        this.bindTextureSampler(value[0], value[2]._samplerResourceUid);
      } else {
        const textureCube = value[1];
        this.bindTextureSampler(value[0], (_b = (_a = textureCube._recommendedTextureSampler) == null ? void 0 : _a._samplerResourceUid) != null ? _b : -1);
      }
    } else if (info.compositionType === CompositionType.Texture2DArray) {
      this.bindTexture2DArray(value[0], value[1]._textureResourceUid);
      if (value[2] != null) {
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
  setUniformValueInner(shaderProgram, semanticStr, info, isMatrix, componentNumber, isVector, {
    x,
    y,
    z,
    w
  }) {
    const identifier = semanticStr;
    const loc = shaderProgram[identifier];
    if (loc == null) {
      return false;
    }
    const uLocation = loc;
    const gl = this.CD.getRawContext();
    if (isMatrix) {
      if (componentNumber === 4) {
        gl.uniformMatrix4fv(uLocation, false, x);
      } else {
        gl.uniformMatrix3fv(uLocation, false, x);
      }
    } else if (isVector) {
      const componentType = info.componentType === ComponentType.Int || info.componentType === ComponentType.Short || info.componentType === ComponentType.Byte;
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
      const componentType = info.componentType === ComponentType.Int || info.componentType === ComponentType.Short || info.componentType === ComponentType.Byte;
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
  setVertexDataToPipeline({
    vaoHandle,
    iboHandle,
    vboHandles
  }, primitive, instanceIDBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid) {
    const gl = this.CD.getRawContextAsWebGL2();
    const vao = this.getWebGLResource(vaoHandle);
    this.CD.bindVertexArray(vao);
    if (iboHandle != null) {
      const ibo = this.getWebGLResource(iboHandle);
      if (ibo != null) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      } else {
        throw new Error("Nothing Element Array Buffer!");
      }
    }
    vboHandles.forEach((vboHandle, i) => {
      const vbo = this.getWebGLResource(vboHandle);
      if (vbo != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      } else {
        throw new Error(`Nothing Element Array Buffer at index ${i}`);
      }
      gl.enableVertexAttribArray(VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]));
      const isIntegerShaderAttribute = VertexAttribute.fromString(
        primitive.attributeSemantics[i].split(".")[0]
      ).isIntegerType;
      if (isIntegerShaderAttribute) {
        gl.vertexAttribIPointer(
          VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]),
          primitive.attributeCompositionTypes[i].getNumberOfComponents(),
          primitive.attributeComponentTypes[i].index,
          primitive.attributeAccessors[i].byteStride,
          0
        );
      } else {
        gl.vertexAttribPointer(
          VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]),
          primitive.attributeCompositionTypes[i].getNumberOfComponents(),
          primitive.attributeComponentTypes[i].index,
          primitive.attributeAccessors[i].normalized,
          primitive.attributeAccessors[i].byteStride,
          0
        );
      }
    });
    for (const intAttr of VertexAttribute.integerTypeAttributes) {
      const slot = intAttr.getAttributeSlot();
      const hasAttribute = primitive.attributeSemantics.some(
        (semantic) => VertexAttribute.toAttributeSlotFromJoinedString(semantic) === slot
      );
      if (!hasAttribute) {
        gl.disableVertexAttribArray(slot);
        gl.vertexAttribI4ui(slot, 0, 0, 0, 0);
      }
    }
    if (instanceIDBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const instanceIDBuffer = this.getWebGLResource(instanceIDBufferUid);
      if (instanceIDBuffer != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceIDBuffer);
      } else {
        throw new Error("Nothing Element Array Buffer at index");
      }
      gl.enableVertexAttribArray(VertexAttribute.Instance.getAttributeSlot());
      gl.vertexAttribIPointer(
        VertexAttribute.Instance.getAttributeSlot(),
        CompositionType.Vec4.getNumberOfComponents(),
        ComponentType.UnsignedInt.index,
        0,
        0
      );
      this.CD.vertexAttribDivisor(VertexAttribute.Instance.getAttributeSlot(), 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.CD.bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
  /**
   * Configures a multi-draw group's VAO with the merged vertex buffers, the merged
   * uint32 index buffer, and the per-vertex instanceBase attribute (divisor 0).
   *
   * @param group - The multi-draw group whose vertexHandles/vertices are already created
   */
  setMultiDrawVertexDataToPipeline(group, vaoHandle = ((_b) => (_b = ((_a) => (_a = group.vertexHandles) == null ? void 0 : _a.vaoHandle)()) != null ? _b : CGAPIResourceRepository.InvalidCGAPIResourceUid)(), useMaterialSidAttribute = true) {
    const handles = group.vertexHandles;
    if (handles == null) {
      return;
    }
    const gl = this.CD.getRawContextAsWebGL2();
    const vao = this.getWebGLResource(vaoHandle);
    this.CD.bindVertexArray(vao);
    if (handles.iboHandle != null) {
      const ibo = this.getWebGLResource(handles.iboHandle);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
    for (let i = 0; i < group.attributes.length; i++) {
      const attribute = group.attributes[i];
      const vbo = this.getWebGLResource(handles.vboHandles[i]);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      const slot = VertexAttribute.toAttributeSlotFromJoinedString(attribute.semantic);
      gl.enableVertexAttribArray(slot);
      if (attribute.isIntegerType) {
        gl.vertexAttribIPointer(
          slot,
          attribute.compositionType.getNumberOfComponents(),
          attribute.componentType.index,
          attribute.byteStride,
          0
        );
      } else {
        gl.vertexAttribPointer(
          slot,
          attribute.compositionType.getNumberOfComponents(),
          attribute.componentType.index,
          attribute.normalized,
          attribute.byteStride,
          0
        );
      }
    }
    for (const intAttr of VertexAttribute.integerTypeAttributes) {
      const slot = intAttr.getAttributeSlot();
      if (intAttr === VertexAttribute.Instance || intAttr === VertexAttribute.MaterialSid) {
        continue;
      }
      const hasAttribute = group.attributes.some(
        (attribute) => VertexAttribute.toAttributeSlotFromJoinedString(attribute.semantic) === slot
      );
      if (!hasAttribute) {
        gl.disableVertexAttribArray(slot);
        gl.vertexAttribI4ui(slot, 0, 0, 0, 0);
      }
    }
    const instanceBaseVbo = this.getWebGLResource(group.instanceBaseVboHandle);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBaseVbo);
    const instanceSlot = VertexAttribute.Instance.getAttributeSlot();
    gl.enableVertexAttribArray(instanceSlot);
    gl.vertexAttribIPointer(instanceSlot, 1, ComponentType.UnsignedInt.index, 4, 0);
    this.CD.vertexAttribDivisor(instanceSlot, 0);
    const materialSidSlot = VertexAttribute.MaterialSid.getAttributeSlot();
    if (useMaterialSidAttribute) {
      const materialSidVbo = this.getWebGLResource(group.materialSidVboHandle);
      gl.bindBuffer(gl.ARRAY_BUFFER, materialSidVbo);
      gl.enableVertexAttribArray(materialSidSlot);
      gl.vertexAttribIPointer(materialSidSlot, 1, ComponentType.UnsignedInt.index, 4, 0);
      this.CD.vertexAttribDivisor(materialSidSlot, 0);
    } else {
      gl.disableVertexAttribArray(materialSidSlot);
      gl.vertexAttribI4ui(materialSidSlot, 0, 0, 0, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.CD.bindVertexArray(null);
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
    height
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    this.CD.bindTexture2D(15, texture);
    gl.texStorage2D(GL_TEXTURE_2D, levels, internalFormat.index, width, height);
    const resourceHandle = this.DD(texture);
    this.CD.unbindTexture2D(15);
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
    shadowCompareMode
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    const sampler = gl.createSampler();
    const resourceHandle = this.DD(sampler);
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
      if (this.CD.webgl2ExtTFA) {
        gl.samplerParameteri(sampler, this.CD.webgl2ExtTFA.TEXTURE_MAX_ANISOTROPY_EXT, 4);
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
    if (this.ID === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.CD.getRawContextAsWebGL2();
      const sampler = gl.createSampler();
      const resourceHandle = this.DD(sampler);
      this.ID = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    }
    return this.ID;
  }
  /**
   * Creates or returns an existing texture sampler with clamp-to-edge wrapping and nearest filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the clamp-to-edge nearest sampler
   */
  createOrGetTextureSamplerClampToEdgeNearest() {
    if (this.JD === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.CD.getRawContextAsWebGL2();
      const sampler = gl.createSampler();
      const resourceHandle = this.DD(sampler);
      this.JD = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    }
    return this.JD;
  }
  /**
   * Creates or returns an existing texture sampler with repeat wrapping and nearest filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the repeat nearest sampler
   */
  createOrGetTextureSamplerRepeatNearest() {
    if (this.KD === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.CD.getRawContextAsWebGL2();
      const sampler = gl.createSampler();
      const resourceHandle = this.DD(sampler);
      this.KD = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
    }
    return this.KD;
  }
  /**
   * Creates or returns an existing texture sampler with repeat wrapping and linear filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the repeat linear sampler
   */
  createOrGetTextureSamplerRepeatLinear() {
    if (this.LD === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.CD.getRawContextAsWebGL2();
      const sampler = gl.createSampler();
      const resourceHandle = this.DD(sampler);
      this.LD = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
    }
    return this.LD;
  }
  /**
   * Creates or returns an existing texture sampler with repeat wrapping and trilinear filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the repeat trilinear sampler
   */
  createOrGetTextureSamplerRepeatTriLinear() {
    if (this.ND === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.CD.getRawContextAsWebGL2();
      const sampler = gl.createSampler();
      const resourceHandle = this.DD(sampler);
      this.ND = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
    }
    return this.ND;
  }
  /**
   * Creates or returns an existing texture sampler configured for shadow mapping.
   * This sampler uses nearest filtering and enables shadow comparison functionality.
   *
   * @returns The handle of the shadow sampler
   */
  createOrGetTextureSamplerShadow() {
    if (this.MD === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.CD.getRawContextAsWebGL2();
      const sampler = gl.createSampler();
      const resourceHandle = this.DD(sampler);
      this.MD = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.samplerParameteri(sampler, gl.TEXTURE_COMPARE_FUNC, gl.LESS);
    }
    return this.MD;
  }
  /**
   * Creates or returns an existing texture sampler with repeat wrapping, anisotropic filtering, and linear filtering.
   * This method implements a singleton pattern for commonly used sampler configurations.
   *
   * @returns The handle of the repeat anisotropy linear sampler
   */
  createOrGetTextureSamplerRepeatAnisotropyLinear() {
    if (this.OD === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const gl = this.CD.getRawContextAsWebGL2();
      const sampler = gl.createSampler();
      const resourceHandle = this.DD(sampler);
      this.OD = resourceHandle;
      gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
      gl.samplerParameteri(sampler, this.CD.webgl2ExtTFA.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    }
    return this.OD;
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
  async createTextureFromImageBitmapData(imageData, {
    internalFormat,
    width,
    height,
    format,
    type,
    generateMipmap
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    let finalImageData = imageData;
    let finalWidth = width;
    let finalHeight = height;
    if (!MathUtil.isPowerOfTwoTexture(width, height) && MiscUtil.isIOS()) {
      finalWidth = DataUtil.getNearestPowerOfTwo(width);
      finalHeight = DataUtil.getNearestPowerOfTwo(height);
      const canvas = new OffscreenCanvas(finalWidth, finalHeight);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imageData, 0, 0, finalWidth, finalHeight);
      finalImageData = await createImageBitmap(canvas);
    }
    const texture = gl.createTexture();
    const textureHandle = this.DD(texture);
    this.CD.bindTexture2D(15, texture);
    const levels = Math.floor(Math.log2(Math.max(finalWidth, finalHeight))) + 1;
    gl.texStorage2D(GL_TEXTURE_2D, levels, internalFormat.index, finalWidth, finalHeight);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, format.index, type.index, finalImageData);
    this.PD(gl, finalWidth, finalHeight, generateMipmap);
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
  PD(gl, _width, _height, _generateMipmap) {
    gl.generateMipmap(gl.TEXTURE_2D);
    this.CD.unbindTexture2D(15);
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
  async createTextureFromHTMLImageElement(imageData, {
    internalFormat,
    width,
    height,
    format,
    type,
    generateMipmap
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    let finalImageData = imageData;
    let finalWidth = width;
    let finalHeight = height;
    if (!MathUtil.isPowerOfTwoTexture(width, height) && MiscUtil.isIOS()) {
      finalWidth = DataUtil.getNearestPowerOfTwo(width);
      finalHeight = DataUtil.getNearestPowerOfTwo(height);
      const canvas = new OffscreenCanvas(finalWidth, finalHeight);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imageData, 0, 0, finalWidth, finalHeight);
      finalImageData = await createImageBitmap(canvas);
    }
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTexture2D(15, texture);
    const levels = generateMipmap ? Math.max(Math.log2(finalWidth), Math.log2(finalHeight)) : 1;
    gl.texStorage2D(GL_TEXTURE_2D, levels, internalFormat.index, finalWidth, finalHeight);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, format.index, type.index, finalImageData);
    this.PD(gl, finalWidth, finalHeight, generateMipmap);
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
  createTextureArray(width, height, arrayLength, mipLevelCount, internalFormat, format, type, imageData) {
    const gl = this.CD.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTexture2DArray(15, texture);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, mipLevelCount, internalFormat.index, width, height, arrayLength);
    for (let layer = 0; layer < arrayLength; layer++) {
      gl.texSubImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        // Mipmap Level
        0,
        // x Offset
        0,
        // y Offset
        layer,
        // z Offset
        width,
        height,
        1,
        // depth
        format.index,
        type.index,
        imageData
      );
    }
    this.CD.unbindTexture2DArray(15);
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
    mipLevelCount
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTexture2D(15, texture);
    gl.texStorage2D(GL_TEXTURE_2D, mipLevelCount, format.index, width, height);
    this.CD.unbindTexture2D(15);
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
    data
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    const texture = this.getWebGLResource(textureUid);
    const pixelFormat = TextureFormat.getPixelFormatFromTextureFormat(format);
    const compositionNum = PixelFormat.getCompositionNumFromPixelFormat(pixelFormat);
    const reducedData = new data.constructor(width * height * compositionNum);
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
    this.CD.bindTexture2D(15, texture);
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
    this.CD.unbindTexture2D(15);
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
  createTextureFromTypedArray(imageData, {
    internalFormat,
    width,
    height,
    format,
    type,
    generateMipmap
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTexture2D(15, texture);
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
      imageData
    );
    this.PD(gl, width, height, generateMipmap);
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
  async createCompressedTexture(textureDataArray, compressionTextureType) {
    const gl = this.CD.getRawContext();
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTexture2D(15, texture);
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
    this.CD.unbindTexture2D(15);
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
  createCompressedTextureFromBasis(basisFile, {
    border
  }) {
    let basisCompressionType;
    let compressionType;
    const gl = this.CD.getRawContext();
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTexture2D(15, texture);
    const s3tc = gl.getExtension("WEBGL_compressed_texture_s3tc");
    if (s3tc) {
      basisCompressionType = BasisCompressionType.BC3;
      compressionType = s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    }
    const etc1 = gl.getExtension("WEBGL_compressed_texture_etc1");
    if (etc1) {
      basisCompressionType = BasisCompressionType.ETC1;
      compressionType = etc1.COMPRESSED_RGB_ETC1_WEBGL;
    }
    const atc = gl.getExtension("WEBGL_compressed_texture_atc");
    if (atc) {
      basisCompressionType = BasisCompressionType.ATC_RGBA;
      compressionType = atc.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL;
    }
    const etc2 = gl.getExtension("WEBGL_compressed_texture_etc");
    if (etc2) {
      basisCompressionType = BasisCompressionType.ETC2;
      compressionType = etc2.COMPRESSED_RGBA8_ETC2_EAC;
    }
    const pvrtc = gl.getExtension("WEBGL_compressed_texture_pvrtc") || gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
    if (pvrtc) {
      basisCompressionType = BasisCompressionType.PVRTC1_RGBA;
      compressionType = pvrtc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
    }
    const astc = gl.getExtension("WEBGL_compressed_texture_astc");
    if (astc) {
      basisCompressionType = BasisCompressionType.ASTC;
      compressionType = astc.COMPRESSED_RGBA_ASTC_4x4_KHR;
    }
    const mipmapDepth = basisFile.getNumLevels(0);
    for (let i = 0; i < mipmapDepth; i++) {
      const width = basisFile.getImageWidth(0, i);
      const height = basisFile.getImageHeight(0, i);
      const textureSource = this.decodeBasisImage(basisFile, basisCompressionType, 0, i);
      gl.compressedTexImage2D(gl.TEXTURE_2D, i, compressionType, width, height, border, textureSource);
    }
    this.CD.unbindTexture2D(15);
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
  decodeBasisImage(basisFile, basisCompressionType, imageIndex, levelIndex) {
    const extractSize = basisFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, basisCompressionType.index);
    const textureSource = new Uint8Array(extractSize);
    if (!basisFile.transcodeImage(textureSource, imageIndex, levelIndex, basisCompressionType.index, 0, 0)) {
      Logger.default.error("failed to transcode the image.");
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
    const gl = this.CD.getRawContext();
    const fbo = gl.createFramebuffer();
    const resourceHandle = this.DD(fbo);
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
  attachColorBufferToFrameBufferObject(framebuffer, attachmentIndex, renderable) {
    const gl = this.CD.getRawContextAsWebGL2();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const renderableWebGLResource = this.getWebGLResource(renderable._textureResourceUid);
    const attachmentId = this.CD.colorAttachment(attachmentIndex);
    if (renderable instanceof RenderTargetTexture2DArray) {
      renderable._fbo = framebuffer;
      if (this.CD.webgl2ExtMLTVIEW.is_multisample) {
        this.CD.webgl2ExtMLTVIEW.framebufferTextureMultisampleMultiviewOVR(
          gl.DRAW_FRAMEBUFFER,
          attachmentId,
          renderableWebGLResource,
          0,
          4,
          // sample count
          0,
          renderable.arrayLength
        );
      } else {
        this.CD.webgl2ExtMLTVIEW.framebufferTextureMultiviewOVR(
          gl.DRAW_FRAMEBUFFER,
          attachmentId,
          renderableWebGLResource,
          0,
          0,
          renderable.arrayLength
        );
      }
    } else if (renderable instanceof RenderTargetTexture) {
      renderable._fbo = framebuffer;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentId, gl.TEXTURE_2D, renderableWebGLResource, 0);
    } else {
      renderable._fbo = framebuffer;
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        attachmentId,
        gl.RENDERBUFFER,
        renderableWebGLResource
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
  attachColorBufferLayerToFrameBufferObject(framebuffer, attachmentIndex, renderable, layerIndex, mipLevel) {
    const gl = this.CD.getRawContextAsWebGL2();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const renderableWebGLResource = this.getWebGLResource(renderable._textureResourceUid);
    const attachmentId = this.CD.colorAttachment(attachmentIndex);
    renderable._fbo = framebuffer;
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
  attachColorBufferCubeToFrameBufferObject(framebuffer, attachmentIndex, faceIndex, mipLevel, renderable) {
    const gl = this.CD.getRawContextAsWebGL2();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const renderableWebGLResource = this.getWebGLResource(renderable._textureResourceUid);
    const attachmentId = this.CD.colorAttachment(attachmentIndex);
    renderable._fbo = framebuffer;
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
  attachDepthBufferToFrameBufferObject(framebuffer, renderable) {
    this.QD(framebuffer, renderable, 36096);
  }
  /**
   * Attaches a stencil buffer to a framebuffer object.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param renderable - The stencil texture or renderbuffer to attach
   */
  attachStencilBufferToFrameBufferObject(framebuffer, renderable) {
    this.QD(framebuffer, renderable, 36128);
  }
  /**
   * Attaches a combined depth-stencil buffer to a framebuffer object.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param renderable - The depth-stencil texture or renderbuffer to attach
   */
  attachDepthStencilBufferToFrameBufferObject(framebuffer, renderable) {
    this.QD(framebuffer, renderable, 33306);
  }
  /**
   * Internal method for attaching depth or stencil buffers to framebuffers.
   * This method handles the common logic for depth, stencil, and depth-stencil attachments.
   *
   * @param framebuffer - The framebuffer to attach to
   * @param renderable - The texture or renderbuffer to attach
   * @param attachmentType - The WebGL attachment type constant
   */
  QD(framebuffer, renderable, attachmentType) {
    const gl = this.CD.getRawContextAsWebGL2();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const renderableWebGLResource = this.getWebGLResource(renderable._textureResourceUid);
    if (renderable instanceof RenderTargetTexture2DArray) {
      renderable._fbo = framebuffer;
      if (this.CD.webgl2ExtMLTVIEW.is_multisample) {
        this.CD.webgl2ExtMLTVIEW.framebufferTextureMultisampleMultiviewOVR(
          gl.DRAW_FRAMEBUFFER,
          attachmentType,
          renderableWebGLResource,
          0,
          4,
          // sample count
          0,
          renderable.arrayLength
        );
      } else {
        this.CD.webgl2ExtMLTVIEW.framebufferTextureMultiviewOVR(
          gl.DRAW_FRAMEBUFFER,
          attachmentType,
          renderableWebGLResource,
          0,
          0,
          renderable.arrayLength
        );
      }
    } else if (renderable instanceof RenderTargetTexture) {
      renderable._fbo = framebuffer;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentType, gl.TEXTURE_2D, renderableWebGLResource, 0);
    } else {
      renderable._fbo = framebuffer;
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        attachmentType,
        gl.RENDERBUFFER,
        renderableWebGLResource
      );
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  /**
   * create Renderbuffer
   */
  createRenderBuffer(width, height, internalFormat, isMSAA, sampleCountMSAA) {
    const gl = this.CD.getRawContext();
    const renderBuffer = gl.createRenderbuffer();
    const resourceHandle = this.DD(renderBuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    if (isMSAA) {
      gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        sampleCountMSAA,
        gl[internalFormat.str],
        width,
        height
      );
    } else {
      gl.renderbufferStorage(gl.RENDERBUFFER, gl[internalFormat.str], width, height);
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    return resourceHandle;
  }
  /**
   * set drawTargets
   * @param framebuffer
   */
  setDrawTargets(renderPass) {
    const framebuffer = renderPass.getFramebuffer();
    if (framebuffer) {
      const renderBufferTargetEnums = renderPass.getRenderTargetColorAttachments();
      if (Is.exist(renderBufferTargetEnums)) {
        this.CD.drawBuffers(renderBufferTargetEnums);
      } else {
        this.CD.drawBuffers(framebuffer.colorAttachmentsRenderBufferTargets);
      }
    } else {
      this.CD.drawBuffers([RenderBufferTarget.Back]);
    }
  }
  /**
   * bind Framebuffer
   * @param framebuffer
   */
  bindFramebuffer(framebuffer) {
    const gl = this.CD.getRawContext();
    if (framebuffer) {
      const fboUid = framebuffer.cgApiResourceUid;
      const fbo = this.getWebGLResource(fboUid);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }
  /**
   * unbind Framebuffer
   */
  unbindFramebuffer() {
    const gl = this.CD.getRawContext();
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
    format
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTexture2D(15, texture);
    gl.texStorage2D(gl.TEXTURE_2D, mipLevelCount, format.index, width, height);
    this.CD.unbindTexture2D(15);
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
    arrayLength
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTexture2DArray(15, texture);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, internalFormat.index, width, height, arrayLength);
    this.CD.unbindTexture2DArray(15);
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
    format
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTextureCube(15, texture);
    gl.texStorage2D(gl.TEXTURE_CUBE_MAP, mipLevelCount, format.index, width, height);
    this.CD.unbindTextureCube(15);
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
  createCubeTexture(engine, mipLevelCount, images, width, height) {
    const gl = this.CD.getRawContext();
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTextureCube(15, texture);
    const wrapS = TextureParameter.ClampToEdge;
    const wrapT = TextureParameter.ClampToEdge;
    let minFilter = TextureParameter.Linear;
    let magFilter = TextureParameter.Linear;
    if (images[0].posX.hdriFormat === HdriFormat.HDR_LINEAR && this.CD.isNotSupportWebGL1Extension(engine.config, WebGLExtension.TextureFloatLinear)) {
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
    const sampler = new Sampler(engine, { wrapS, wrapT, minFilter, magFilter });
    sampler.create();
    const loadImageToGPU = (image, cubeMapSide, i) => {
      if (image.hdriFormat === HdriFormat.HDR_LINEAR) {
        const gl2 = this.CD.getRawContextAsWebGL2();
        gl2.texImage2D(
          cubeMapSide,
          i,
          engine.config.isMobile ? gl2.RGB16F : gl2.RGB32F,
          image.width,
          image.height,
          0,
          gl2.RGB,
          gl2.FLOAT,
          image.dataFloat
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
          image
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
    this.CD.unbindTextureCube(15);
    return [resourceHandle, sampler];
  }
  /**
   * Create Cube Texture from image files.
   * @param baseUri the base uri to load images;
   * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
   * @returns the WebGLResourceHandle for the generated Cube Texture
   */
  async createCubeTextureFromFiles(engine, baseUri, mipLevelCount, isNamePosNeg, hdriFormat) {
    const gl = this.CD.getRawContext();
    const imageArgs = [];
    let width = 0;
    let height = 0;
    for (let i = 0; i < mipLevelCount; i++) {
      const loadOneLevel = () => {
        return new Promise((resolve, reject) => {
          let loadedCount = 0;
          const images2 = [];
          let extension = ".jpg";
          if (hdriFormat === HdriFormat.HDR_LINEAR) {
            extension = ".hdr";
          } else if (hdriFormat === HdriFormat.RGBE_PNG) {
            extension = ".RGBE.PNG";
          }
          let posX = "_right_";
          let negX = "_left_";
          let posY = "_top_";
          let negY = "_bottom_";
          let posZ = "_front_";
          let negZ = "_back_";
          if (isNamePosNeg) {
            posX = "_posx_";
            negX = "_negx_";
            posY = "_posy_";
            negY = "_negy_";
            posZ = "_posz_";
            negZ = "_negz_";
          }
          const faces = [
            [baseUri + posX + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_X],
            [baseUri + negX + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
            [baseUri + posY + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
            [baseUri + negY + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
            [baseUri + posZ + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
            [baseUri + negZ + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
          ];
          for (let j = 0; j < faces.length; j++) {
            const face = faces[j][1];
            let image;
            if (hdriFormat === HdriFormat.HDR_LINEAR || hdriFormat === HdriFormat.RGB9_E5_PNG) {
              image = new HDRImage();
            } else {
              image = new Image();
            }
            image.hdriFormat = hdriFormat;
            image.side = face;
            image.uri = faces[j][0];
            image.crossOrigin = "Anonymous";
            image.onload = () => {
              loadedCount++;
              images2.push(image);
              if (loadedCount === 6) {
                resolve(images2);
              }
            };
            image.onerror = () => {
              reject(image.uri);
            };
            image.src = faces[j][0];
          }
        });
      };
      let images;
      try {
        images = await loadOneLevel();
      } catch (_e) {
        try {
          images = await loadOneLevel();
        } catch (uri) {
          Logger.default.error(`failed to load ${uri}`);
        }
      }
      const imageObj = {};
      for (const image of images) {
        switch (image.side) {
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
        imageObj
      );
    }
    const [resourceHandle, sampler] = this.createCubeTexture(engine, mipLevelCount, imageArgs, width, height);
    return [resourceHandle, sampler, width, height];
  }
  createCubeTextureFromBasis(basisFile, {
    magFilter = TextureParameter.Linear,
    minFilter = TextureParameter.LinearMipmapLinear,
    wrapS = TextureParameter.Repeat,
    wrapT = TextureParameter.Repeat,
    border = 0
  }) {
    const gl = this.CD.getRawContext();
    let basisCompressionType;
    let compressionType;
    const texture = gl.createTexture();
    const resourceHandle = this.DD(texture);
    this.CD.bindTextureCube(15, texture);
    const s3tc = gl.getExtension("WEBGL_compressed_texture_s3tc");
    if (s3tc) {
      basisCompressionType = BasisCompressionType.BC3;
      compressionType = s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    }
    const etc1 = gl.getExtension("WEBGL_compressed_texture_etc1");
    if (etc1) {
      basisCompressionType = BasisCompressionType.ETC1;
      compressionType = etc1.COMPRESSED_RGB_ETC1_WEBGL;
    }
    const atc = gl.getExtension("WEBGL_compressed_texture_atc");
    if (atc) {
      basisCompressionType = BasisCompressionType.ATC_RGBA;
      compressionType = atc.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL;
    }
    const etc2 = gl.getExtension("WEBGL_compressed_texture_etc");
    if (etc2) {
      basisCompressionType = BasisCompressionType.ETC2;
      compressionType = etc2.COMPRESSED_RGBA8_ETC2_EAC;
    }
    const pvrtc = gl.getExtension("WEBGL_compressed_texture_pvrtc") || gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
    if (pvrtc) {
      basisCompressionType = BasisCompressionType.PVRTC1_RGBA;
      compressionType = pvrtc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
    }
    const astc = gl.getExtension("WEBGL_compressed_texture_astc");
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
    const baseLevelWidth = basisFile.getImageWidth(0, 0);
    const baseLevelHeight = basisFile.getImageHeight(0, 0);
    for (let i = 0; i < mipmapDepth; i++) {
      for (let j = 0; j < numImages; j++) {
        const width = basisFile.getImageWidth(j, i);
        const height = basisFile.getImageHeight(j, i);
        const textureSource = this.decodeBasisImage(basisFile, basisCompressionType, j, i);
        gl.compressedTexImage2D(
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + j,
          i,
          compressionType,
          width,
          height,
          border,
          textureSource
        );
      }
    }
    this.CD.unbindTextureCube(15);
    return { resourceHandle, width: baseLevelWidth, height: baseLevelHeight };
  }
  createDummyBlackCubeTexture(engine) {
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==";
    const arrayBuffer = this.HD(base64);
    const typedArray = new Uint8Array(arrayBuffer);
    return this.createCubeTexture(
      engine,
      1,
      [
        {
          posX: typedArray,
          negX: typedArray,
          posY: typedArray,
          negY: typedArray,
          posZ: typedArray,
          negZ: typedArray
        }
      ],
      1,
      1
    );
  }
  createDummyCubeTexture(engine, rgbaStr = "rgba(0,0,0,1)") {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);
    return this.createCubeTexture(
      engine,
      1,
      [
        {
          posX: canvas,
          negX: canvas,
          posY: canvas,
          negY: canvas,
          posZ: canvas,
          negZ: canvas
        }
      ],
      1,
      1
    );
  }
  setWebGLTextureDirectly(webGLTexture) {
    const texture = webGLTexture;
    const resourceHandle = this.DD(texture);
    return resourceHandle;
  }
  async createTextureFromDataUri(dataUri, {
    internalFormat,
    format,
    type,
    generateMipmap
  }) {
    return new Promise((resolve) => {
      const img = new Image();
      if (!dataUri.match(/^data:/)) {
        img.crossOrigin = "Anonymous";
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
          generateMipmap
        });
        resolve(texture);
      };
      img.src = dataUri;
    });
  }
  updateLevel0TextureAndGenerateMipmap(textureUid, textureData, {
    width,
    height,
    format,
    type
  }) {
    const texture = this.getWebGLResource(textureUid);
    this.CD.bindTexture2D(15, texture);
    const gl = this.CD.getRawContextAsWebGL2();
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      width,
      height,
      format.index,
      type.index,
      textureData
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    this.CD.unbindTexture2D(15);
  }
  updateTexture(textureUid, textureData, {
    level,
    offsetX,
    offsetY,
    width,
    height,
    format,
    type
  }) {
    const texture = this.getWebGLResource(textureUid);
    this.CD.bindTexture2D(15, texture);
    const gl = this.CD.getRawContextAsWebGL2();
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      level,
      offsetX,
      offsetY,
      width,
      height,
      format.index,
      type.index,
      textureData
    );
    this.CD.unbindTexture2D(15);
  }
  deleteFrameBufferObject(frameBufferObjectHandle) {
    const fbo = this.getWebGLResource(frameBufferObjectHandle);
    const gl = this.CD.getRawContext();
    if (fbo != null) {
      gl.deleteFramebuffer(fbo);
      this.ED.delete(frameBufferObjectHandle);
    }
  }
  deleteRenderBuffer(renderBufferUid) {
    const gl = this.CD.getRawContext();
    const renderBuffer = this.getWebGLResource(renderBufferUid);
    gl.deleteRenderbuffer(renderBuffer);
    this.ED.delete(renderBufferUid);
  }
  deleteTexture(textureHandle) {
    const texture = this.getWebGLResource(textureHandle);
    const gl = this.CD.getRawContext();
    if (texture != null) {
      gl.deleteTexture(texture);
      this.ED.delete(textureHandle);
      Logger.default.debug(`gl.deleteTexture called: ${textureHandle}`);
    }
  }
  createDummyTexture(rgbaStr = "rgba(255,255,255,1)") {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);
    return this.createTextureFromImageBitmapData(canvas, {
      internalFormat: TextureFormat.RGBA8,
      width: 1,
      height: 1,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      generateMipmap: false
    });
  }
  createDummyBlackTexture() {
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==";
    return this.HD(base64);
  }
  createDummyWhiteTexture() {
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5/hPwAIAgL/4d1j8wAAAABJRU5ErkJggg==";
    return this.HD(base64);
  }
  createDummyNormalTexture() {
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsr///HwAGgAL+v1RumAAAAABJRU5ErkJggg==";
    return this.HD(base64);
  }
  HD(base64) {
    const arrayBuffer = DataUtil.base64ToArrayBuffer(base64);
    return this.createTextureFromTypedArray(new Uint8Array(arrayBuffer), {
      internalFormat: TextureFormat.RGBA8,
      width: 1,
      height: 1,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      generateMipmap: false
    });
  }
  generateMipmaps2d(textureHandle, width, height) {
    if (!MathUtil.isPowerOfTwoTexture(width, height) && MiscUtil.isIOS()) {
      return;
    }
    const gl = this.CD.getRawContext();
    const texture = this.getWebGLResource(textureHandle);
    this.CD.bindTexture2D(15, texture);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.CD.unbindTexture2D(15);
  }
  generateMipmapsCube(textureHandle, _width, _height) {
    const gl = this.CD.getRawContext();
    const texture = this.getWebGLResource(textureHandle);
    this.CD.bindTextureCube(15, texture);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    this.CD.unbindTextureCube(15);
  }
  async getTexturePixelData(_textureHandle, width, height, frameBufferUid, colorAttachmentIndex) {
    const gl = this.CD.getRawContext();
    const fbo = this.getWebGLResource(frameBufferUid);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const data = new Uint8Array(width * height * 4);
    if (gl.readBuffer != null) {
      gl.readBuffer(36064 + colorAttachmentIndex);
    }
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return data;
  }
  /**
   * Reads pixel data from a specific face of a cube texture.
   * This creates a temporary framebuffer, attaches the cube face, and reads the pixels.
   * For floating-point textures (HDR), it uses a shader-based approach to sample and convert.
   *
   * @param textureHandle - Handle to the cube texture
   * @param width - Width of the face texture
   * @param height - Height of the face texture
   * @param faceIndex - Index of the cube face (0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z)
   * @returns Promise resolving to the pixel data as a Uint8Array (RGBA format)
   */
  async getCubeTexturePixelData(textureHandle, width, height, faceIndex) {
    const gl = this.CD.getRawContext();
    const texture = this.getWebGLResource(textureHandle);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const cubeFaceTarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, cubeFaceTarget, texture, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(fbo);
      return this.YD(gl, texture, width, height, faceIndex, true);
    }
    const data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    return data;
  }
  /**
   * Reads cube texture data using a shader-based approach.
   * This is used for HDR/float textures that cannot be read directly.
   *
   * @param gl - WebGL2 rendering context
   * @param cubeTexture - The cube texture to read from
   * @param width - Width of the face texture
   * @param height - Height of the face texture
   * @param faceIndex - Index of the cube face (0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z)
   * @param isHdrFormat - Whether the texture is HDR format (applies tone mapping and gamma correction if true)
   */
  YD(gl, cubeTexture, width, height, faceIndex, isHdrFormat) {
    const prevViewport = gl.getParameter(gl.VIEWPORT);
    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const prevVAO = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
    const prevArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const prevActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    const prevTextureCubeMap = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
    const prevTexture2D = gl.getParameter(gl.TEXTURE_BINDING_2D);
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragmentShaderSource = `#version 300 es
      precision highp float;
      uniform samplerCube u_cubemap;
      uniform int u_faceIndex;
      uniform int u_isHdr;
      in vec2 v_texCoord;
      out vec4 fragColor;

      vec3 getDirection(int face, vec2 uv) {
        vec2 st = uv * 2.0 - 1.0;
        if (face == 0) return vec3( 1.0, -st.y, -st.x); // +X
        if (face == 1) return vec3(-1.0, -st.y,  st.x); // -X
        if (face == 2) return vec3( st.x,  1.0,  st.y); // +Y
        if (face == 3) return vec3( st.x, -1.0, -st.y); // -Y
        if (face == 4) return vec3( st.x, -st.y,  1.0); // +Z
        return vec3(-st.x, -st.y, -1.0); // -Z
      }

      void main() {
        vec3 dir = normalize(getDirection(u_faceIndex, v_texCoord));
        vec3 color = texture(u_cubemap, dir).rgb;

        // Only apply tone mapping and gamma correction for HDR textures
        // LDR textures (e.g., RGBA8) should pass through unchanged
        if (u_isHdr != 0) {
          // Reinhard tone mapping
          color = color / (1.0 + color);

          // Gamma correction
          color = pow(color, vec3(1.0 / 2.2));
        }

        fragColor = vec4(color, 1.0);
      }
    `;
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const positionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    const renderTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, renderTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_cubemap"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_faceIndex"), faceIndex);
    gl.uniform1i(gl.getUniformLocation(program, "u_isHdr"), isHdrFormat ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(renderTexture);
    gl.deleteBuffer(quadBuffer);
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.bindVertexArray(prevVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, prevArrayBuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer);
    gl.activeTexture(prevActiveTexture);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, prevTextureCubeMap);
    gl.bindTexture(gl.TEXTURE_2D, prevTexture2D);
    gl.useProgram(prevProgram);
    gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
    return data;
  }
  createUniformBuffer() {
    const gl = this.CD.getRawContextAsWebGL2();
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    const ubo = gl.createBuffer();
    const resourceHandle = this.DD(ubo);
    return resourceHandle;
  }
  createUniformBufferWithBufferView(bufferView) {
    const gl = this.CD.getRawContextAsWebGL2();
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    const ubo = gl.createBuffer();
    const resourceHandle = this.DD(ubo);
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, bufferView, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    return resourceHandle;
  }
  updateUniformBuffer(uboUid, typedArray, offsetByte, arrayLength) {
    const gl = this.CD.getRawContextAsWebGL2();
    const ubo = this.getWebGLResource(uboUid);
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, typedArray, offsetByte, arrayLength);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }
  bindUniformBlock(shaderProgramUid, blockName, blockIndex) {
    const gl = this.CD.getRawContextAsWebGL2();
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    const shaderProgram = this.getWebGLResource(shaderProgramUid);
    const block = gl.getUniformBlockIndex(shaderProgram, blockName);
    gl.uniformBlockBinding(shaderProgram, block, blockIndex);
  }
  bindUniformBufferBase(blockIndex, uboUid) {
    const gl = this.CD.getRawContextAsWebGL2();
    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }
    const ubo = this.getWebGLResource(uboUid);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, blockIndex, ubo);
  }
  deleteUniformBuffer(uboUid) {
    const gl = this.CD.getRawContext();
    if (gl == null) {
      new Error("No WebGLRenderingContext set as Default.");
    }
    const ubo = this.getWebGLResource(uboUid);
    this.ED.delete(uboUid);
    gl.deleteBuffer(ubo);
  }
  setupUniformBufferDataArea(typedArray) {
    const gl = this.CD.getRawContextAsWebGL2();
    if (gl == null) {
      new Error("No WebGLRenderingContext set as Default.");
    }
    const ubo = gl.createBuffer();
    const resourceHandle = this.DD(ubo);
    const maxConventionBlocks = this.CD.getMaxConventionUniformBlocks();
    const alignedMaxUniformBlockSize = this.CD.getAlignedMaxUniformBlockSize();
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
  setUniformBlockBindingForMorphOffsetsAndWeights(shaderProgramUid, morphOffsetsUBOUid, morphWeightsUBOUid) {
    const gl = this.CD.getRawContextAsWebGL2();
    const shaderProgram = this.getWebGLResource(shaderProgramUid);
    const morphOffsetsUBO = this.getWebGLResource(morphOffsetsUBOUid);
    const morphWeightsUBO = this.getWebGLResource(morphWeightsUBOUid);
    const blockOfOffsets = gl.getUniformBlockIndex(shaderProgram, "UniformMorphOffsets");
    const blockOfWeights = gl.getUniformBlockIndex(shaderProgram, "UniformMorphWeights");
    gl.uniformBlockBinding(shaderProgram, blockOfOffsets, 0);
    gl.uniformBlockBinding(shaderProgram, blockOfWeights, 1);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, morphOffsetsUBO);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, morphWeightsUBO);
  }
  setUniformBlockBindingForMorphOffsetsAndWeightsWithoutShaderProgram(morphOffsetsUBOUid, morphWeightsUBOUid) {
    const gl = this.CD.getRawContextAsWebGL2();
    const morphOffsetsUBO = this.getWebGLResource(morphOffsetsUBOUid);
    const morphWeightsUBO = this.getWebGLResource(morphWeightsUBOUid);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, morphOffsetsUBO);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, morphWeightsUBO);
  }
  getGlslRenderTargetBeginString(renderTargetNumber) {
    let text = "";
    for (let i = 0; i < renderTargetNumber; i++) {
      text += `layout(location = ${i}) out vec4 rt${i};`;
    }
    return text;
  }
  getGlslDataUBODefinitionString() {
    let text = "";
    const maxConventionblocks = this.CD.getMaxConventionUniformBlocks();
    const alignedMaxUniformBlockSize = this.CD.getAlignedMaxUniformBlockSize();
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
    text += "}\n";
    return text;
  }
  getGlslDataUBOVec4SizeString() {
    const alignedMaxUniformBlockSize = this.CD.getAlignedMaxUniformBlockSize();
    return `const int dataUBOVec4Size = ${alignedMaxUniformBlockSize / 4 / 4};`;
  }
  createMultiviewFramebuffer(width, height, samples) {
    if (Is.not.exist(this.CD.webgl2ExtMLTVIEW)) {
      return [-1, -1];
    }
    const gl = this.CD.getRawContextAsWebGL2();
    const framebuffer = gl.createFramebuffer();
    const framebufferHandle = this.DD(framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
    const colorTexture = gl.createTexture();
    const colorTextureHandle = this.DD(colorTexture);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, colorTexture);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, width, height, 2);
    if (!this.CD.webgl2ExtMLTVIEW.is_multisample)
      this.CD.webgl2ExtMLTVIEW.framebufferTextureMultiviewOVR(
        gl.DRAW_FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        colorTexture,
        0,
        0,
        2
      );
    else
      this.CD.webgl2ExtMLTVIEW.framebufferTextureMultisampleMultiviewOVR(
        gl.DRAW_FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        colorTexture,
        0,
        samples,
        0,
        2
      );
    const depthStencilTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, depthStencilTex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.DEPTH32F_STENCIL8, width, height, 2);
    if (!this.CD.webgl2ExtMLTVIEW.is_multisample)
      this.CD.webgl2ExtMLTVIEW.framebufferTextureMultiviewOVR(
        gl.DRAW_FRAMEBUFFER,
        gl.DEPTH_STENCIL_ATTACHMENT,
        depthStencilTex,
        0,
        0,
        2
      );
    else
      this.CD.webgl2ExtMLTVIEW.framebufferTextureMultisampleMultiviewOVR(
        gl.DRAW_FRAMEBUFFER,
        gl.DEPTH_STENCIL_ATTACHMENT,
        depthStencilTex,
        0,
        samples,
        0,
        2
      );
    return [framebufferHandle, colorTextureHandle];
  }
  createTransformFeedback() {
    const gl = this.CD.getRawContextAsWebGL2();
    const transformFeedback = gl.createTransformFeedback();
    const resourceHandle = this.DD(transformFeedback);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
    return resourceHandle;
  }
  deleteTransformFeedback(transformFeedbackUid) {
    const gl = this.CD.getRawContextAsWebGL2();
    const transformFeedback = this.getWebGLResource(transformFeedbackUid);
    gl.deleteTransformFeedback(transformFeedback);
    this.ED.delete(transformFeedbackUid);
  }
  setViewport(engine, viewport) {
    var _a, _b;
    if (viewport) {
      (_a = this.CD) == null ? void 0 : _a.setViewportAsVector4(viewport);
      engine.engineState.viewportAspectRatio = (viewport.z - viewport.x) / (viewport.w - viewport.y);
    } else {
      (_b = this.CD) == null ? void 0 : _b.setViewport(0, 0, this.CD.width, this.CD.height);
      engine.engineState.viewportAspectRatio = this.CD.width / this.CD.height;
    }
  }
  /**
   * Applies the scissor rectangle of a render pass (a culling hint for the draw).
   *
   * The rectangle uses a top-left origin; WebGL's scissor origin is the bottom-left,
   * so the y coordinate is flipped against the render target height.
   *
   * @param renderPass - The pass whose scissor rectangle is applied, or undefined
   * to render the whole target
   */
  setScissorRect(renderPass) {
    var _a;
    const gl = this.CD.getRawContextAsWebGL2();
    const rect = renderPass == null ? void 0 : renderPass.getScissorRect();
    if (rect == null) {
      gl.disable(gl.SCISSOR_TEST);
      return;
    }
    const framebuffer = renderPass.getFramebuffer();
    const targetHeight = (_a = framebuffer == null ? void 0 : framebuffer.height) != null ? _a : this.CD.canvas.height;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(rect.x, targetHeight - (rect.y + rect.height), rect.width, rect.height);
  }
  clearFrameBuffer(engine, renderPass, _ = 0) {
    var _a, _b;
    const gl = this.CD.getRawContext();
    const isCanvasTarget = renderPass.getFramebuffer() == null && !(((_a = engine._webXRSystemIfEnabled) == null ? void 0 : _a.isWebXRMode) && renderPass.isOutputForVr) && !((_b = engine._webARSystemIfEnabled) == null ? void 0 : _b.isWebARMode);
    let bufferBit = 0;
    if (renderPass.toClearColorBuffer) {
      gl.clearColor(renderPass.clearColor.x, renderPass.clearColor.y, renderPass.clearColor.z, renderPass.clearColor.w);
      bufferBit |= gl.COLOR_BUFFER_BIT;
    }
    if (renderPass.toClearDepthBuffer && !(isCanvasTarget && !this.UD().depth)) {
      gl.clearDepth(renderPass.clearDepth);
      bufferBit |= gl.DEPTH_BUFFER_BIT;
    }
    if (renderPass.toClearStencilBuffer && !(isCanvasTarget && !this.UD().stencil)) {
      gl.clearStencil(renderPass.clearStencil);
      bufferBit |= gl.STENCIL_BUFFER_BIT;
    }
    if (bufferBit !== 0) {
      gl.clear(bufferBit);
    }
  }
  /**
   * Whether the canvas (default framebuffer) has a depth / stencil buffer. Cached because
   * getContextAttributes() allocates a new object on every call. While the context is lost the
   * attributes are unknown, so both are reported as present and nothing is skipped.
   */
  UD() {
    const glw = this.CD;
    let attributes = this.RD;
    if (attributes == null || this.SD !== glw) {
      const contextAttributes = glw.getRawContext().getContextAttributes();
      if (contextAttributes == null) {
        return { depth: true, stencil: true };
      }
      attributes = { depth: contextAttributes.depth !== false, stencil: contextAttributes.stencil === true };
      this.RD = attributes;
      this.SD = glw;
    }
    return attributes;
  }
  deleteVertexDataResources(vertexHandles) {
    const gl = this.CD.getRawContext();
    const iboHandle = vertexHandles.iboHandle;
    if (iboHandle) {
      const ibo = this.getWebGLResource(iboHandle);
      gl.deleteBuffer(ibo);
      this.ED.delete(iboHandle);
    }
    const vboHandles = vertexHandles.vboHandles;
    for (const vboHandle of vboHandles) {
      const vbo = this.getWebGLResource(vboHandle);
      gl.deleteBuffer(vbo);
      this.ED.delete(vboHandle);
    }
    const vaoHandle = vertexHandles.vaoHandle;
    const vao = this.getWebGLResource(vaoHandle);
    this.CD.deleteVertexArray(vao);
    this.ED.delete(vaoHandle);
  }
  deleteVertexArray(vaoHandle) {
    const vao = this.getWebGLResource(vaoHandle);
    this.CD.deleteVertexArray(vao);
    this.ED.delete(vaoHandle);
  }
  deleteVertexBuffer(vboUid) {
    const gl = this.CD.getRawContext();
    const vbo = this.getWebGLResource(vboUid);
    gl.deleteBuffer(vbo);
    this.ED.delete(vboUid);
  }
  resizeCanvas(width, height) {
    this.CD.width = width;
    this.CD.height = height;
    this.CD.canvas.width = width;
    this.CD.canvas.height = height;
    this.CD.setViewportAsVector4(Vector4.fromCopyArray([0, 0, width, height]));
  }
  getCanvasSize() {
    return [this.CD.canvas.width, this.CD.canvas.height];
  }
  switchDepthTest(flag) {
    const gl = this.CD.getRawContext();
    if (flag) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }
  rebuildProgramBySpector(engine, updatedVertexSourceCode, updatedFragmentSourceCode, onCompiled, onError) {
    const material = this._material.deref();
    if (Is.not.exist(material)) {
      const warn = "Material Not found";
      Logger.default.warn(warn);
      onError(warn);
      return false;
    }
    const processApproach = engine.engineState.currentProcessApproach;
    const renderingStrategy = getRenderingStrategy(this._engine, processApproach);
    const modifiedVertexSourceCode = updatedVertexSourceCode.replace(/! =/g, "!=");
    const modifiedPixelSourceCode = updatedFragmentSourceCode.replace(/! =/g, "!=");
    const programUid = renderingStrategy._reSetupShaderForMaterialBySpector(
      material,
      this._primitive.deref(),
      {
        vertex: modifiedVertexSourceCode,
        pixel: modifiedPixelSourceCode
      },
      onError
    );
    if (programUid < 0) {
      return false;
    }
    const webglResourceRepository = this._engine.webglResourceRepository;
    const program = webglResourceRepository.getWebGLResource(programUid);
    if (programUid > 0) {
      onCompiled(program);
    }
    return true;
  }
  getPixelDataFromTexture(texUid, x, y, width, height) {
    const gl = this.CD.getRawContext();
    const pixels = new Uint8Array((width - x) * (height - y) * 4);
    const texture = this.getWebGLResource(texUid);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    return pixels;
  }
  /**
   * Reads pixel data directly from a 2D texture asynchronously.
   * This is the async version of getPixelDataFromTexture for API consistency with WebGPU.
   *
   * @param texUid - Handle to the texture to read from
   * @param x - X offset to start reading from
   * @param y - Y offset to start reading from
   * @param width - Width of the region to read
   * @param height - Height of the region to read
   * @returns Promise resolving to the pixel data as a Uint8Array in RGBA format
   */
  async getPixelDataFromTextureAsync(texUid, x, y, width, height) {
    return this.getPixelDataFromTexture(texUid, x, y, width, height);
  }
  getCurrentTexture2DBindingsForEffekseer() {
    const gl = this.CD.getRawContextAsWebGL2();
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    const textureBindings = [];
    for (let i = 0; i < maxTextureUnits; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      const texture2D = gl.getParameter(gl.TEXTURE_BINDING_2D);
      const sampler = gl.getParameter(gl.SAMPLER_BINDING);
      textureBindings.push({
        texture2D,
        sampler
      });
    }
    const currentActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    const vertexArray = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
    const arrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const elementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
    const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    return {
      textureBindings,
      activeTexture: currentActiveTexture,
      vertexArray,
      arrayBuffer,
      elementArrayBuffer,
      currentProgram
    };
  }
  restoreTexture2DBindingsForEffekseer({
    textureBindings,
    activeTexture,
    vertexArray,
    arrayBuffer,
    elementArrayBuffer,
    currentProgram
  }) {
    const gl = this.CD.getRawContextAsWebGL2();
    for (let i = 0; i < textureBindings.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, textureBindings[i].texture2D);
      gl.bindSampler(i, textureBindings[i].sampler);
    }
    gl.activeTexture(activeTexture);
    gl.bindVertexArray(vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer);
    gl.useProgram(currentProgram);
    gl._D = true;
  }
  setWebGLStateToDefaultForEffekseer() {
  }
  setWebGLStateToDefault() {
    const gl = this.CD.getRawContextAsWebGL2();
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.bindBuffer(gl.COPY_READ_BUFFER, null);
    gl.bindBuffer(gl.COPY_WRITE_BUFFER, null);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.useProgram(null);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clearStencil(0);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    gl.depthRange(0, 1);
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
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    gl.blendColor(0, 0, 0, 0);
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ZERO);
    gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.KEEP);
    gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.KEEP, gl.KEEP);
    gl.stencilFuncSeparate(gl.FRONT, gl.ALWAYS, 0, 4294967295);
    gl.stencilFuncSeparate(gl.BACK, gl.ALWAYS, 0, 4294967295);
    gl.stencilMaskSeparate(gl.FRONT, 4294967295);
    gl.stencilMaskSeparate(gl.BACK, 4294967295);
    gl.colorMask(true, true, true, true);
    gl.polygonOffset(0, 0);
    gl.sampleCoverage(1, false);
    const canvas = this.CD.canvas;
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    gl.scissor(0, 0, canvas.width, canvas.height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.lineWidth(1);
    for (let i = 0; i < maxTextureUnits; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
      gl.bindTexture(gl.TEXTURE_3D, null);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
      gl.bindSampler(i, null);
    }
    gl.activeTexture(gl.TEXTURE0);
  }
  restoreWebGLStates(webGLStates) {
    const gl = this.CD.getRawContextAsWebGL2();
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
    gl.depthFunc(webGLStates.depthFunc);
    gl.depthMask(webGLStates.depthWriteMask);
    gl.clearDepth(webGLStates.depthClearValue);
    gl.depthRange(webGLStates.depthRange[0], webGLStates.depthRange[1]);
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
    gl.cullFace(webGLStates.cullFaceMode);
    gl.frontFace(webGLStates.frontFace);
    gl.polygonOffset(webGLStates.polygonOffsetFactor, webGLStates.polygonOffsetUnits);
    gl.sampleCoverage(webGLStates.sampleCoverageValue, webGLStates.sampleCoverageInvert);
    gl.scissor(
      webGLStates.scissorBox[0],
      webGLStates.scissorBox[1],
      webGLStates.scissorBox[2],
      webGLStates.scissorBox[3]
    );
    gl.viewport(webGLStates.viewport[0], webGLStates.viewport[1], webGLStates.viewport[2], webGLStates.viewport[3]);
    gl.lineWidth(webGLStates.lineWidth);
    for (let i = 0; i < webGLStates.textureBindings.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      const binding = webGLStates.textureBindings[i];
      gl.bindTexture(gl.TEXTURE_2D, binding.texture2D);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, binding.textureCubeMap);
      gl.bindTexture(gl.TEXTURE_3D, binding.texture3D);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, binding.texture2DArray);
      gl.bindSampler(i, binding.sampler);
    }
    gl.activeTexture(webGLStates.activeTexture);
    gl.bindBuffer(gl.ARRAY_BUFFER, webGLStates.arrayBufferBinding);
    gl.bindBuffer(gl.UNIFORM_BUFFER, webGLStates.uniformBufferBinding);
    gl.bindBuffer(gl.COPY_READ_BUFFER, webGLStates.copyReadBufferBinding);
    gl.bindBuffer(gl.COPY_WRITE_BUFFER, webGLStates.copyWriteBufferBinding);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, webGLStates.pixelPackBufferBinding);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, webGLStates.pixelUnpackBufferBinding);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, webGLStates.transformFeedbackBinding);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, webGLStates.readFramebufferBinding);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, webGLStates.drawFramebufferBinding);
    gl.bindRenderbuffer(gl.RENDERBUFFER, webGLStates.renderbufferBinding);
    gl.bindVertexArray(webGLStates.vertexArrayBinding);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webGLStates.elementArrayBufferBinding);
    gl.useProgram(webGLStates.currentProgram);
  }
  getCurrentWebGLStates() {
    const gl = this.CD.getRawContextAsWebGL2();
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
    const depthFunc = gl.getParameter(gl.DEPTH_FUNC);
    const depthWriteMask = gl.getParameter(gl.DEPTH_WRITEMASK);
    const depthClearValue = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
    const depthRange = gl.getParameter(gl.DEPTH_RANGE);
    const depthRangeTuple = [depthRange[0], depthRange[1]];
    const stencilFunc = gl.getParameter(gl.STENCIL_FUNC);
    const stencilValueMask = gl.getParameter(gl.STENCIL_VALUE_MASK);
    const stencilRef = gl.getParameter(gl.STENCIL_REF);
    const stencilBackFunc = gl.getParameter(gl.STENCIL_BACK_FUNC);
    const stencilBackValueMask = gl.getParameter(gl.STENCIL_BACK_VALUE_MASK);
    const stencilBackRef = gl.getParameter(gl.STENCIL_BACK_REF);
    const stencilFail = gl.getParameter(gl.STENCIL_FAIL);
    const stencilPassDepthFail = gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL);
    const stencilPassDepthPass = gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS);
    const stencilBackFail = gl.getParameter(gl.STENCIL_BACK_FAIL);
    const stencilBackPassDepthFail = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_FAIL);
    const stencilBackPassDepthPass = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_PASS);
    const stencilWriteMask = gl.getParameter(gl.STENCIL_WRITEMASK);
    const stencilBackWriteMask = gl.getParameter(gl.STENCIL_BACK_WRITEMASK);
    const stencilClearValue = gl.getParameter(gl.STENCIL_CLEAR_VALUE);
    const blendSrcRgb = gl.getParameter(gl.BLEND_SRC_RGB);
    const blendDstRgb = gl.getParameter(gl.BLEND_DST_RGB);
    const blendSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
    const blendDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);
    const blendEquationRgb = gl.getParameter(gl.BLEND_EQUATION_RGB);
    const blendEquationAlpha = gl.getParameter(gl.BLEND_EQUATION_ALPHA);
    const blendColor = gl.getParameter(gl.BLEND_COLOR);
    const blendColorTuple = [
      blendColor[0],
      blendColor[1],
      blendColor[2],
      blendColor[3]
    ];
    const colorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
    const colorClearValueTuple = [
      colorClearValue[0],
      colorClearValue[1],
      colorClearValue[2],
      colorClearValue[3]
    ];
    const colorWriteMask = gl.getParameter(gl.COLOR_WRITEMASK);
    const colorWriteMaskTuple = [
      colorWriteMask[0],
      colorWriteMask[1],
      colorWriteMask[2],
      colorWriteMask[3]
    ];
    const cullFaceMode = gl.getParameter(gl.CULL_FACE_MODE);
    const frontFace = gl.getParameter(gl.FRONT_FACE);
    const polygonOffsetFactor = gl.getParameter(gl.POLYGON_OFFSET_FACTOR);
    const polygonOffsetUnits = gl.getParameter(gl.POLYGON_OFFSET_UNITS);
    const sampleCoverageValue = gl.getParameter(gl.SAMPLE_COVERAGE_VALUE);
    const sampleCoverageInvert = gl.getParameter(gl.SAMPLE_COVERAGE_INVERT);
    const scissorBox = gl.getParameter(gl.SCISSOR_BOX);
    const scissorBoxTuple = [
      scissorBox[0],
      scissorBox[1],
      scissorBox[2],
      scissorBox[3]
    ];
    const viewport = gl.getParameter(gl.VIEWPORT);
    const viewportTuple = [viewport[0], viewport[1], viewport[2], viewport[3]];
    const lineWidth = gl.getParameter(gl.LINE_WIDTH);
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    const textureBindings = [];
    const currentActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    const activeTexture = currentActiveTexture;
    for (let i = 0; i < maxTextureUnits; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      const texture2D = gl.getParameter(gl.TEXTURE_BINDING_2D);
      const textureCubeMap = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
      const texture3D = gl.getParameter(gl.TEXTURE_BINDING_3D);
      const texture2DArray = gl.getParameter(gl.TEXTURE_BINDING_2D_ARRAY);
      const sampler = gl.getParameter(gl.SAMPLER_BINDING);
      textureBindings.push({
        texture2D,
        textureCubeMap,
        texture3D,
        texture2DArray,
        sampler
      });
    }
    gl.activeTexture(currentActiveTexture);
    const arrayBufferBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const elementArrayBufferBinding = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
    const uniformBufferBinding = gl.getParameter(gl.UNIFORM_BUFFER_BINDING);
    const transformFeedbackBinding = gl.getParameter(gl.TRANSFORM_FEEDBACK_BINDING);
    const copyReadBufferBinding = gl.getParameter(gl.COPY_READ_BUFFER_BINDING);
    const copyWriteBufferBinding = gl.getParameter(gl.COPY_WRITE_BUFFER_BINDING);
    const pixelPackBufferBinding = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING);
    const pixelUnpackBufferBinding = gl.getParameter(gl.PIXEL_UNPACK_BUFFER_BINDING);
    const readFramebufferBinding = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
    const drawFramebufferBinding = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);
    const renderbufferBinding = gl.getParameter(gl.RENDERBUFFER_BINDING);
    const vertexArrayBinding = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
    const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
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
      currentProgram
    };
  }
  unbindTextureSamplers() {
    const gl = this.CD.getRawContextAsWebGL2();
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    for (let i = 0; i < maxTextureUnits; i++) {
      gl.bindSampler(i, null);
    }
  }
  isSupportMultiViewVRRendering(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGL2) {
      return this.CD.isMultiview(engine.config);
    }
    return false;
  }
  blitToTexture2dFromTexture2dArray(srcTextureUid, dstFboUid, dstWidth, dstHeight) {
    const gl = this.CD.getRawContextAsWebGL2();
    const srcTexture = this.getWebGLResource(srcTextureUid);
    const dstFbo = this.getWebGLResource(dstFboUid);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dstFbo);
    const webStereoUtil = WebGLStereoUtil.getInstance(gl);
    webStereoUtil.blit(srcTexture, 0, 0, 1, 1, dstWidth, dstHeight);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }
  blitToTexture2dFromTexture2dArrayFake(srcTextureUid, dstFboUid, dstWidth, dstHeight) {
    const gl = this.CD.getRawContextAsWebGL2();
    const srcTexture = this.getWebGLResource(srcTextureUid);
    const dstFbo = this.getWebGLResource(dstFboUid);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dstFbo);
    const webStereoUtil = WebGLStereoUtil.getInstance(gl);
    webStereoUtil.blitFake(srcTexture, 0, 0, 1, 1, dstWidth, dstHeight);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }
  blitToTexture2dFromTexture2dArray2(srcTextureUid, dstTextureUid, dstWidth, dstHeight) {
    const gl = this.CD.getRawContextAsWebGL2();
    const srcTexture = this.getWebGLResource(srcTextureUid);
    const dstTexture = this.getWebGLResource(dstTextureUid);
    const webStereoUtil = WebGLStereoUtil.getInstance(gl);
    webStereoUtil.blit2(srcTexture, dstTexture, dstWidth, dstHeight);
  }
};
export {
  WebGLResourceRepository
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdsL1dlYkdMUmVzb3VyY2VSZXBvc2l0b3J5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgSERSSW1hZ2UgZnJvbSAnLi4vLi4vdmVuZG9yL2hkcnBuZy5qcyc7XG5pbXBvcnQgdHlwZSB7IENvbmZpZyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29yZS9Db25maWcnO1xuaW1wb3J0IHsgQmFzaXNDb21wcmVzc2lvblR5cGUsIHR5cGUgQmFzaXNDb21wcmVzc2lvblR5cGVFbnVtIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9CYXNpc0NvbXByZXNzaW9uVHlwZSc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFR5cGVFbnVtIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0NvbXBvbmVudFR5cGUnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHR5cGUgeyBDb21wcmVzc2lvblRleHR1cmVUeXBlRW51bSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcHJlc3Npb25UZXh0dXJlVHlwZSc7XG5pbXBvcnQgeyBIZHJpRm9ybWF0LCB0eXBlIEhkcmlGb3JtYXRFbnVtIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9IZHJpRm9ybWF0JztcbmltcG9ydCB7IFBpeGVsRm9ybWF0LCB0eXBlIFBpeGVsRm9ybWF0RW51bSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvUGl4ZWxGb3JtYXQnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Qcm9jZXNzQXBwcm9hY2gnO1xuaW1wb3J0IHsgUmVuZGVyQnVmZmVyVGFyZ2V0IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9SZW5kZXJCdWZmZXJUYXJnZXQnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NJbmZvIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3NJbmZvJztcbmltcG9ydCB7IFRleHR1cmVGb3JtYXQsIHR5cGUgVGV4dHVyZUZvcm1hdEVudW0gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1RleHR1cmVGb3JtYXQnO1xuaW1wb3J0IHsgVGV4dHVyZVBhcmFtZXRlciwgdHlwZSBUZXh0dXJlUGFyYW1ldGVyRW51bSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvVGV4dHVyZVBhcmFtZXRlcic7XG5pbXBvcnQgeyBWZXJ0ZXhBdHRyaWJ1dGUsIHR5cGUgVmVydGV4QXR0cmlidXRlRW51bSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB0eXBlIHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21hdGgvTWF0aFV0aWwnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB0eXBlIHsgQWNjZXNzb3IgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgeyBEYXRhVXRpbCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9EYXRhVXRpbCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Jcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB7IE1pc2NVdGlsIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9taXNjL01pc2NVdGlsJztcbmltcG9ydCB7XG4gIENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LFxuICB0eXBlIERpcmVjdFRleHR1cmVEYXRhLFxuICB0eXBlIElDR0FQSVJlc291cmNlUmVwb3NpdG9yeSxcbiAgdHlwZSBJbWFnZUJpdG1hcERhdGEsXG59IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnknO1xuaW1wb3J0IHR5cGUgeyBGcmFtZUJ1ZmZlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvRnJhbWVCdWZmZXInO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJQYXNzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9yZW5kZXJlci9SZW5kZXJQYXNzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9zeXN0ZW0vRW5naW5lLmpzJztcbmltcG9ydCB0eXBlIHsgQWJzdHJhY3RUZXh0dXJlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi90ZXh0dXJlcy9BYnN0cmFjdFRleHR1cmUnO1xuaW1wb3J0IHR5cGUgeyBDdWJlVGV4dHVyZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vdGV4dHVyZXMvQ3ViZVRleHR1cmUnO1xuaW1wb3J0IHR5cGUgeyBJUmVuZGVyYWJsZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vdGV4dHVyZXMvSVJlbmRlcmFibGUnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJCdWZmZXIgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3RleHR1cmVzL1JlbmRlckJ1ZmZlcic7XG5pbXBvcnQgeyBSZW5kZXJUYXJnZXRUZXh0dXJlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi90ZXh0dXJlcy9SZW5kZXJUYXJnZXRUZXh0dXJlJztcbmltcG9ydCB7IFJlbmRlclRhcmdldFRleHR1cmUyREFycmF5IH0gZnJvbSAnLi4vZm91bmRhdGlvbi90ZXh0dXJlcy9SZW5kZXJUYXJnZXRUZXh0dXJlMkRBcnJheSc7XG5pbXBvcnQgeyBTYW1wbGVyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi90ZXh0dXJlcy9TYW1wbGVyJztcbmltcG9ydCB0eXBlIHsgQmFzaXNGaWxlIH0gZnJvbSAnLi4vdHlwZXMvQmFzaXNUZXh0dXJlJztcbmltcG9ydCB0eXBlIHtcbiAgQXJyYXlUeXBlLFxuICBCeXRlLFxuICBDR0FQSVJlc291cmNlSGFuZGxlLFxuICBDb3VudCxcbiAgSW5kZXgsXG4gIE9mZnNldCxcbiAgU2l6ZSxcbiAgVHlwZWRBcnJheSxcbiAgV2ViR0xSZXNvdXJjZUhhbmRsZSxcbiAgV2ViR1BVUmVzb3VyY2VIYW5kbGUsXG59IGZyb20gJy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IEdMX1RFWFRVUkVfMkQgfSBmcm9tICcuLi90eXBlcy9XZWJHTENvbnN0YW50cyc7XG5pbXBvcnQgZ2V0UmVuZGVyaW5nU3RyYXRlZ3kgZnJvbSAnLi9nZXRSZW5kZXJpbmdTdHJhdGVneSc7XG5pbXBvcnQgeyBJbnN0YW5jZVNpZFRhYmxlIH0gZnJvbSAnLi9JbnN0YW5jZVNpZFRhYmxlJztcbmltcG9ydCB0eXBlIHsgTXVsdGlEcmF3R3JvdXAgfSBmcm9tICcuL011bHRpRHJhdyc7XG5pbXBvcnQgeyBNdWx0aURyYXdSZXBvc2l0b3J5IH0gZnJvbSAnLi9NdWx0aURyYXdSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgQXR0cmlidXRlTmFtZXMgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IFdlYkdMQ29udGV4dFdyYXBwZXIgfSBmcm9tICcuL1dlYkdMQ29udGV4dFdyYXBwZXInO1xuaW1wb3J0IHR5cGUgeyBSbldlYkdMUHJvZ3JhbSwgUm5XZWJHTFRleHR1cmUgfSBmcm9tICcuL1dlYkdMRXh0ZW5kZWRUeXBlcyc7XG5pbXBvcnQgeyBXZWJHTEV4dGVuc2lvbiB9IGZyb20gJy4vV2ViR0xFeHRlbnNpb24nO1xuaW1wb3J0IHsgV2ViR0xTdGVyZW9VdGlsIH0gZnJvbSAnLi9XZWJHTFN0ZXJlb1V0aWwnO1xuXG5leHBvcnQgdHlwZSBWZXJ0ZXhIYW5kbGVzID0ge1xuICB2YW9IYW5kbGU6IENHQVBJUmVzb3VyY2VIYW5kbGU7XG4gIGlib0hhbmRsZT86IENHQVBJUmVzb3VyY2VIYW5kbGU7XG4gIHZib0hhbmRsZXM6IEFycmF5PENHQVBJUmVzb3VyY2VIYW5kbGU+O1xuICBhdHRyaWJ1dGVzRmxhZ3M6IEFycmF5PGJvb2xlYW4+O1xuICBzZXRDb21wbGV0ZTogYm9vbGVhbjtcbn07XG5cbmV4cG9ydCB0eXBlIFRleHR1cmVEYXRhID0ge1xuICBsZXZlbDogQ291bnQ7XG4gIHdpZHRoOiBDb3VudDtcbiAgaGVpZ2h0OiBDb3VudDtcbiAgYnVmZmVyOiBBcnJheUJ1ZmZlclZpZXc7XG59O1xuXG5leHBvcnQgdHlwZSBXZWJHTFN0YXRlcyA9IHtcbiAgLy8gRW5hYmxlZCBzdGF0ZXMgKGdsLmlzRW5hYmxlZClcbiAgZGVwdGhUZXN0OiBib29sZWFuO1xuICBzdGVuY2lsVGVzdDogYm9vbGVhbjtcbiAgYmxlbmQ6IGJvb2xlYW47XG4gIGRpdGhlcjogYm9vbGVhbjtcbiAgc2Npc3NvclRlc3Q6IGJvb2xlYW47XG4gIHBvbHlnb25PZmZzZXRGaWxsOiBib29sZWFuO1xuICBzYW1wbGVDb3ZlcmFnZTogYm9vbGVhbjtcbiAgc2FtcGxlQWxwaGFUb0NvdmVyYWdlOiBib29sZWFuO1xuICBjdWxsRmFjZTogYm9vbGVhbjtcbiAgcmFzdGVyaXplckRpc2NhcmQ6IGJvb2xlYW47XG5cbiAgLy8gRGVwdGggc3RhdGVzXG4gIGRlcHRoRnVuYzogbnVtYmVyO1xuICBkZXB0aFdyaXRlTWFzazogYm9vbGVhbjtcbiAgZGVwdGhDbGVhclZhbHVlOiBudW1iZXI7XG4gIGRlcHRoUmFuZ2U6IFtudW1iZXIsIG51bWJlcl07XG5cbiAgLy8gU3RlbmNpbCBzdGF0ZXNcbiAgc3RlbmNpbEZ1bmM6IG51bWJlcjtcbiAgc3RlbmNpbFZhbHVlTWFzazogbnVtYmVyO1xuICBzdGVuY2lsUmVmOiBudW1iZXI7XG4gIHN0ZW5jaWxCYWNrRnVuYzogbnVtYmVyO1xuICBzdGVuY2lsQmFja1ZhbHVlTWFzazogbnVtYmVyO1xuICBzdGVuY2lsQmFja1JlZjogbnVtYmVyO1xuICBzdGVuY2lsRmFpbDogbnVtYmVyO1xuICBzdGVuY2lsUGFzc0RlcHRoRmFpbDogbnVtYmVyO1xuICBzdGVuY2lsUGFzc0RlcHRoUGFzczogbnVtYmVyO1xuICBzdGVuY2lsQmFja0ZhaWw6IG51bWJlcjtcbiAgc3RlbmNpbEJhY2tQYXNzRGVwdGhGYWlsOiBudW1iZXI7XG4gIHN0ZW5jaWxCYWNrUGFzc0RlcHRoUGFzczogbnVtYmVyO1xuICBzdGVuY2lsV3JpdGVNYXNrOiBudW1iZXI7XG4gIHN0ZW5jaWxCYWNrV3JpdGVNYXNrOiBudW1iZXI7XG4gIHN0ZW5jaWxDbGVhclZhbHVlOiBudW1iZXI7XG5cbiAgLy8gQmxlbmQgc3RhdGVzXG4gIGJsZW5kU3JjUmdiOiBudW1iZXI7XG4gIGJsZW5kRHN0UmdiOiBudW1iZXI7XG4gIGJsZW5kU3JjQWxwaGE6IG51bWJlcjtcbiAgYmxlbmREc3RBbHBoYTogbnVtYmVyO1xuICBibGVuZEVxdWF0aW9uUmdiOiBudW1iZXI7XG4gIGJsZW5kRXF1YXRpb25BbHBoYTogbnVtYmVyO1xuICBibGVuZENvbG9yOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXTtcblxuICAvLyBDb2xvciBzdGF0ZXNcbiAgY29sb3JDbGVhclZhbHVlOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXTtcbiAgY29sb3JXcml0ZU1hc2s6IFtib29sZWFuLCBib29sZWFuLCBib29sZWFuLCBib29sZWFuXTtcblxuICAvLyBDdWxsIHN0YXRlc1xuICBjdWxsRmFjZU1vZGU6IG51bWJlcjtcbiAgZnJvbnRGYWNlOiBudW1iZXI7XG5cbiAgLy8gUG9seWdvbiBvZmZzZXQgc3RhdGVzXG4gIHBvbHlnb25PZmZzZXRGYWN0b3I6IG51bWJlcjtcbiAgcG9seWdvbk9mZnNldFVuaXRzOiBudW1iZXI7XG5cbiAgLy8gU2FtcGxlIGNvdmVyYWdlIHN0YXRlc1xuICBzYW1wbGVDb3ZlcmFnZVZhbHVlOiBudW1iZXI7XG4gIHNhbXBsZUNvdmVyYWdlSW52ZXJ0OiBib29sZWFuO1xuXG4gIC8vIFNjaXNzb3Igc3RhdGVzXG4gIHNjaXNzb3JCb3g6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXJdO1xuXG4gIC8vIFZpZXdwb3J0IHN0YXRlc1xuICB2aWV3cG9ydDogW251bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG5cbiAgLy8gTGluZSB3aWR0aFxuICBsaW5lV2lkdGg6IG51bWJlcjtcblxuICAvLyBCaW5kaW5nIHN0YXRlc1xuICBhY3RpdmVUZXh0dXJlOiBudW1iZXI7XG4gIHRleHR1cmVCaW5kaW5nczogQXJyYXk8e1xuICAgIHRleHR1cmUyRDogV2ViR0xUZXh0dXJlIHwgbnVsbDtcbiAgICB0ZXh0dXJlQ3ViZU1hcDogV2ViR0xUZXh0dXJlIHwgbnVsbDtcbiAgICB0ZXh0dXJlM0Q6IFdlYkdMVGV4dHVyZSB8IG51bGw7XG4gICAgdGV4dHVyZTJEQXJyYXk6IFdlYkdMVGV4dHVyZSB8IG51bGw7XG4gICAgc2FtcGxlcjogV2ViR0xTYW1wbGVyIHwgbnVsbDtcbiAgfT47XG4gIGFycmF5QnVmZmVyQmluZGluZzogV2ViR0xCdWZmZXIgfCBudWxsO1xuICBlbGVtZW50QXJyYXlCdWZmZXJCaW5kaW5nOiBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gIHVuaWZvcm1CdWZmZXJCaW5kaW5nOiBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gIHRyYW5zZm9ybUZlZWRiYWNrQmluZGluZzogV2ViR0xUcmFuc2Zvcm1GZWVkYmFjayB8IG51bGw7XG4gIGNvcHlSZWFkQnVmZmVyQmluZGluZzogV2ViR0xCdWZmZXIgfCBudWxsO1xuICBjb3B5V3JpdGVCdWZmZXJCaW5kaW5nOiBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gIHBpeGVsUGFja0J1ZmZlckJpbmRpbmc6IFdlYkdMQnVmZmVyIHwgbnVsbDtcbiAgcGl4ZWxVbnBhY2tCdWZmZXJCaW5kaW5nOiBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gIHJlYWRGcmFtZWJ1ZmZlckJpbmRpbmc6IFdlYkdMRnJhbWVidWZmZXIgfCBudWxsO1xuICBkcmF3RnJhbWVidWZmZXJCaW5kaW5nOiBXZWJHTEZyYW1lYnVmZmVyIHwgbnVsbDtcbiAgcmVuZGVyYnVmZmVyQmluZGluZzogV2ViR0xSZW5kZXJidWZmZXIgfCBudWxsO1xuICB2ZXJ0ZXhBcnJheUJpbmRpbmc6IFdlYkdMVmVydGV4QXJyYXlPYmplY3QgfCBudWxsO1xuICBjdXJyZW50UHJvZ3JhbTogV2ViR0xQcm9ncmFtIHwgbnVsbDtcbn07XG5cbmV4cG9ydCB0eXBlIFdlYkdMUmVzb3VyY2UgPVxuICB8IFdlYkdMQnVmZmVyXG4gIHwgV2ViR0xGcmFtZWJ1ZmZlclxuICB8IFdlYkdMUHJvZ3JhbVxuICB8IFdlYkdMUmVuZGVyYnVmZmVyXG4gIHwgV2ViR0xUZXh0dXJlXG4gIHwgV2ViR0xUcmFuc2Zvcm1GZWVkYmFja1xuICB8IFdlYkdMU2FtcGxlclxuICB8IFdlYkdMVmVydGV4QXJyYXlPYmplY3Q7XG5cbi8qKlxuICogQSBjb21wcmVoZW5zaXZlIHJlcG9zaXRvcnkgZm9yIG1hbmFnaW5nIFdlYkdMIHJlc291cmNlcyBpbmNsdWRpbmcgYnVmZmVycywgdGV4dHVyZXMsIHNoYWRlcnMsIGFuZCBmcmFtZWJ1ZmZlcnMuXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGEgY2VudHJhbGl6ZWQgaW50ZXJmYWNlIGZvciBjcmVhdGluZywgbWFuYWdpbmcsIGFuZCBkaXNwb3Npbmcgb2YgV2ViR0wgcmVzb3VyY2VzXG4gKiB3aGlsZSBtYWludGFpbmluZyByZXNvdXJjZSBoYW5kbGVzIGZvciBlZmZpY2llbnQgbWVtb3J5IG1hbmFnZW1lbnQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHJlcG9zaXRvcnkgPSBXZWJHTFJlc291cmNlUmVwb3NpdG9yeS5nZXRJbnN0YW5jZSgpO1xuICogY29uc3QgdGV4dHVyZUhhbmRsZSA9IHJlcG9zaXRvcnkuY3JlYXRlVGV4dHVyZUZyb21JbWFnZUJpdG1hcERhdGEoaW1hZ2VEYXRhLCBvcHRpb25zKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgZXh0ZW5kcyBDR0FQSVJlc291cmNlUmVwb3NpdG9yeSBpbXBsZW1lbnRzIElDR0FQSVJlc291cmNlUmVwb3NpdG9yeSB7XG4gIHByaXZhdGUgX193ZWJnbENvbnRleHRzOiBNYXA8c3RyaW5nLCBXZWJHTENvbnRleHRXcmFwcGVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2dsdz86IFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gIHByaXZhdGUgX19pbnN0YW5jZVNpZFRhYmxlPzogSW5zdGFuY2VTaWRUYWJsZTtcbiAgcHJpdmF0ZSBfX211bHRpRHJhd1JlcG9zaXRvcnk/OiBNdWx0aURyYXdSZXBvc2l0b3J5O1xuICAvKiogU2VlIF9fZ2V0Q2FudmFzQ29udGV4dEF0dHJpYnV0ZXMoKS4gKi9cbiAgcHJpdmF0ZSBfX2NhbnZhc0NvbnRleHRBdHRyaWJ1dGVzPzogeyBkZXB0aDogYm9vbGVhbjsgc3RlbmNpbDogYm9vbGVhbiB9O1xuICBwcml2YXRlIF9fY2FudmFzQ29udGV4dEF0dHJpYnV0ZXNPd25lcj86IFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gIHByaXZhdGUgX19yZXNvdXJjZUNvdW50ZXI6IG51bWJlciA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fd2ViZ2xSZXNvdXJjZXM6IE1hcDxXZWJHTFJlc291cmNlSGFuZGxlLCBXZWJHTFJlc291cmNlPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX3NhbXBsZXJDbGFtcFRvRWRnZUxpbmVhclVpZDogV2ViR0xSZXNvdXJjZUhhbmRsZSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fc2FtcGxlckNsYW1wVG9FZGdlTmVhcmVzdFVpZDogV2ViR0xSZXNvdXJjZUhhbmRsZSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fc2FtcGxlclJlcGVhdE5lYXJlc3RVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgcHJpdmF0ZSBfX3NhbXBsZXJSZXBlYXRMaW5lYXJVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgcHJpdmF0ZSBfX3NhbXBsZXJTaGFkb3dVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgcHJpdmF0ZSBfX3NhbXBsZXJSZXBlYXRUcmlMaW5lYXJVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgcHJpdmF0ZSBfX3NhbXBsZXJSZXBlYXRBbmlzb3Ryb3B5TGluZWFyVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBXZWJHTFJlc291cmNlUmVwb3NpdG9yeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBXZWJHTFJlc291cmNlUmVwb3NpdG9yeVxuICAgKi9cbiAgc3RhdGljIGluaXQoKTogV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkge1xuICAgIHJldHVybiBuZXcgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIGV4aXN0aW5nIFdlYkdMMiBjb250ZXh0IHRvIHRoZSByZXBvc2l0b3J5LlxuICAgKlxuICAgKiBAcGFyYW0gY29uZmlnIC0gVGhlIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBXZWJHTCBjb250ZXh0XG4gICAqIEBwYXJhbSBnbCAtIFRoZSBXZWJHTDIgcmVuZGVyaW5nIGNvbnRleHQgdG8gYWRkXG4gICAqIEBwYXJhbSBjYW52YXMgLSBUaGUgSFRNTCBjYW52YXMgZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRleHRcbiAgICogQHBhcmFtIGFzQ3VycmVudCAtIFdoZXRoZXIgdG8gc2V0IHRoaXMgY29udGV4dCBhcyB0aGUgY3VycmVudCBhY3RpdmUgY29udGV4dFxuICAgKi9cbiAgYWRkV2ViR0xDb250ZXh0KGNvbmZpZzogQ29uZmlnLCBnbDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgYXNDdXJyZW50OiBib29sZWFuKSB7XG4gICAgY29uc3QgZ2x3ID0gbmV3IFdlYkdMQ29udGV4dFdyYXBwZXIoY29uZmlnLCBnbCwgY2FudmFzKTtcbiAgICB0aGlzLl9fd2ViZ2xDb250ZXh0cy5zZXQoJ2RlZmF1bHQnLCBnbHcpO1xuICAgIGlmIChhc0N1cnJlbnQpIHtcbiAgICAgIHRoaXMuX19tdWx0aURyYXdSZXBvc2l0b3J5Py5pbnZhbGlkYXRlQWxsKCk7XG4gICAgICB0aGlzLl9fbXVsdGlEcmF3UmVwb3NpdG9yeSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZFRhYmxlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX2dsdyA9IGdsdztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgbmV3IFdlYkdMMiBjb250ZXh0IGZvciB0aGUgZ2l2ZW4gY2FudmFzIGVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBjb25maWcgLSBUaGUgY29uZmlndXJhdGlvbiBmb3IgdGhlIFdlYkdMIGNvbnRleHRcbiAgICogQHBhcmFtIGNhbnZhcyAtIFRoZSBIVE1MIGNhbnZhcyBlbGVtZW50IHRvIGNyZWF0ZSB0aGUgY29udGV4dCBmb3JcbiAgICogQHBhcmFtIGFzQ3VycmVudCAtIFdoZXRoZXIgdG8gc2V0IHRoaXMgY29udGV4dCBhcyB0aGUgY3VycmVudCBhY3RpdmUgY29udGV4dFxuICAgKiBAcGFyYW0gd2ViZ2xPcHRpb24gLSBPcHRpb25hbCBXZWJHTCBjb250ZXh0IGF0dHJpYnV0ZXMgZm9yIGNvbnRleHQgY3JlYXRpb25cbiAgICogQHJldHVybnMgVGhlIGNyZWF0ZWQgV2ViR0wyIHJlbmRlcmluZyBjb250ZXh0XG4gICAqL1xuICBnZW5lcmF0ZVdlYkdMQ29udGV4dChcbiAgICBjb25maWc6IENvbmZpZyxcbiAgICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LFxuICAgIGFzQ3VycmVudDogYm9vbGVhbixcbiAgICB3ZWJnbE9wdGlvbj86IFdlYkdMQ29udGV4dEF0dHJpYnV0ZXNcbiAgKSB7XG4gICAgY29uc3QgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wyJywgd2ViZ2xPcHRpb24pIGFzIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQ7XG4gICAgdGhpcy5hZGRXZWJHTENvbnRleHQoY29uZmlnLCBnbCwgY2FudmFzLCBhc0N1cnJlbnQpO1xuXG4gICAgcmV0dXJuIGdsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgV2ViR0wgY29udGV4dCB3cmFwcGVyLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBXZWJHTENvbnRleHRXcmFwcGVyIGluc3RhbmNlIG9yIHVuZGVmaW5lZCBpZiBub25lIGlzIHNldFxuICAgKi9cbiAgZ2V0IGN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyKCkge1xuICAgIHJldHVybiB0aGlzLl9fZ2x3O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVuZ2luZS13aWRlIGluc3RhbmNlIFNJRCB0YWJsZSB1c2VkIGJ5IG11bHRpLWRyYXcgcmVuZGVyaW5nLlxuICAgKiBUaGUgdGFibGUgaXMgY3JlYXRlZCBsYXppbHkgZm9yIHRoZSBjdXJyZW50IFdlYkdMIGNvbnRleHQuXG4gICAqL1xuICBnZXQgaW5zdGFuY2VTaWRUYWJsZSgpOiBJbnN0YW5jZVNpZFRhYmxlIHtcbiAgICBpZiAodGhpcy5fX2luc3RhbmNlU2lkVGFibGUgPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuX19nbHcgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIFdlYkdMIGNvbnRleHQgaXMgYXZhaWxhYmxlIGZvciB0aGUgaW5zdGFuY2UgU0lEIHRhYmxlLicpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2luc3RhbmNlU2lkVGFibGUgPSBuZXcgSW5zdGFuY2VTaWRUYWJsZSh0aGlzLl9fZ2x3KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19pbnN0YW5jZVNpZFRhYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBjb250ZXh0IGNhbiB1c2UgdGhlIGluc3RhbmNlIFNJRCBwYXRoIHVzZWQgYnkgbXVsdGktZHJhdyByZW5kZXJpbmcuXG4gICAqIFRoZSBpbnN0YW5jZSB0YWJsZXMgbGl2ZSBpbiB0aGUgZGF0YSB0ZXh0dXJlICh1bml0IDApLCBzbyBXZWJHTDIgcGx1cyB0aGVcbiAgICogV0VCR0xfbXVsdGlfZHJhdyBleHRlbnNpb24gYXJlIHRoZSBvbmx5IHJlcXVpcmVtZW50cy5cbiAgICovXG4gIGdldCBpc0luc3RhbmNlU2lkVGV4dHVyZUNhcGFibGUoKTogYm9vbGVhbiB7XG4gICAgLy8gVGhlIGA9PT0gdHJ1ZWAgY29tcGFyaXNvbiBrZWVwcyB0aGUgcmV0dXJuIHR5cGUgYm9vbGVhbiAoYW4gb3B0aW9uYWwgY2hhaW4gYWxvbmVcbiAgICAvLyB5aWVsZHMgYm9vbGVhbiB8IHVuZGVmaW5lZCwgd2hpY2ggc3RyaWN0IG51bGwgY2hlY2tzIHJlamVjdCkgd2hpbGUgc3RpbGwgdXNpbmcgdGhlXG4gICAgLy8gb3B0aW9uYWwgY2hhaW4gdGhhdCB0aGUgbGludCBydWxlIHJlcXVpcmVzLlxuICAgIHJldHVybiB0aGlzLl9fZ2x3Py5pc1dlYkdMMiA9PT0gdHJ1ZSAmJiB0aGlzLl9fZ2x3LndlYmdsMkV4dE1EICE9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZW5naW5lLXdpZGUgbXVsdGktZHJhdyBncm91cCByZXBvc2l0b3J5LCBjcmVhdGluZyBpdCBsYXppbHkuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIHRoYXQgb3ducyB0aGUgV2ViR0wgY29udGV4dFxuICAgKi9cbiAgZ2V0TXVsdGlEcmF3UmVwb3NpdG9yeShlbmdpbmU6IEVuZ2luZSk6IE11bHRpRHJhd1JlcG9zaXRvcnkge1xuICAgIGlmICh0aGlzLl9fbXVsdGlEcmF3UmVwb3NpdG9yeSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9fbXVsdGlEcmF3UmVwb3NpdG9yeSA9IG5ldyBNdWx0aURyYXdSZXBvc2l0b3J5KGVuZ2luZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fbXVsdGlEcmF3UmVwb3NpdG9yeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSB1bmlxdWUgcmVzb3VyY2UgaGFuZGxlIGZvciBXZWJHTCBvYmplY3RzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHVuaXF1ZSBXZWJHTCByZXNvdXJjZSBoYW5kbGVcbiAgICovXG4gIHByaXZhdGUgZ2V0UmVzb3VyY2VOdW1iZXIoKTogV2ViR0xSZXNvdXJjZUhhbmRsZSB7XG4gICAgcmV0dXJuICsrdGhpcy5fX3Jlc291cmNlQ291bnRlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBXZWJHTCBvYmplY3QgYW5kIGFzc2lnbnMgaXQgYSB1bmlxdWUgaGFuZGxlLlxuICAgKlxuICAgKiBAcGFyYW0gb2JqIC0gVGhlIFdlYkdMIG9iamVjdCB0byByZWdpc3RlclxuICAgKiBAcmV0dXJucyBUaGUgYXNzaWduZWQgcmVzb3VyY2UgaGFuZGxlXG4gICAqL1xuICBwcml2YXRlIF9fcmVnaXN0ZXJSZXNvdXJjZShvYmo6IFdlYkdMUmVzb3VyY2UpIHtcbiAgICBjb25zdCBoYW5kbGUgPSB0aGlzLmdldFJlc291cmNlTnVtYmVyKCk7XG4gICAgKG9iaiBhcyBhbnkpLl9yZXNvdXJjZVVpZCA9IGhhbmRsZTtcbiAgICB0aGlzLl9fd2ViZ2xSZXNvdXJjZXMuc2V0KGhhbmRsZSwgb2JqKTtcbiAgICByZXR1cm4gaGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIFdlYkdMIHJlc291cmNlIGJ5IGl0cyBoYW5kbGUuXG4gICAqXG4gICAqIEBwYXJhbSBXZWJHTFJlc291cmNlSGFuZGxlIC0gVGhlIGhhbmRsZSBvZiB0aGUgcmVzb3VyY2UgdG8gcmV0cmlldmVcbiAgICogQHJldHVybnMgVGhlIFdlYkdMIHJlc291cmNlIG9yIG51bGwgaWYgbm90IGZvdW5kXG4gICAqL1xuICBnZXRXZWJHTFJlc291cmNlKFdlYkdMUmVzb3VyY2VIYW5kbGU6IFdlYkdMUmVzb3VyY2VIYW5kbGUpOiBXZWJHTFJlc291cmNlIHwgbnVsbCB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fX3dlYmdsUmVzb3VyY2VzLmdldChXZWJHTFJlc291cmNlSGFuZGxlKTtcbiAgICByZXR1cm4gcmVzdWx0ID8/IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbmRleCBidWZmZXIgZnJvbSB0aGUgcHJvdmlkZWQgYWNjZXNzb3IgZGF0YS5cbiAgICpcbiAgICogQHBhcmFtIGFjY2Vzc29yIC0gVGhlIGFjY2Vzc29yIGNvbnRhaW5pbmcgaW5kZXggZGF0YVxuICAgKiBAcmV0dXJucyBUaGUgaGFuZGxlIG9mIHRoZSBjcmVhdGVkIGluZGV4IGJ1ZmZlclxuICAgKiBAdGhyb3dzIEVycm9yIGlmIG5vIFdlYkdMIGNvbnRleHQgaXMgYXZhaWxhYmxlXG4gICAqL1xuICBjcmVhdGVJbmRleEJ1ZmZlcihhY2Nlc3NvcjogQWNjZXNzb3IpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcblxuICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCBzZXQgYXMgRGVmYXVsdC4nKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fZ2x3IS5iaW5kVmVydGV4QXJyYXkobnVsbCk7XG4gICAgY29uc3QgaWJvID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShpYm8hKTtcblxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlibyk7XG4gICAgLy8gICAgZ2wuYnVmZmVyRGF0YShnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgYWNjZXNzb3IuYnVmZmVyVmlldy5idWZmZXIuZ2V0QXJyYXlCdWZmZXIoKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGFjY2Vzc29yLmdldFR5cGVkQXJyYXkoKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuXG4gICAgcmV0dXJuIHJlc291cmNlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYW4gZXhpc3RpbmcgaW5kZXggYnVmZmVyIHdpdGggbmV3IGRhdGEgZnJvbSB0aGUgYWNjZXNzb3IuXG4gICAqXG4gICAqIEBwYXJhbSBhY2Nlc3NvciAtIFRoZSBhY2Nlc3NvciBjb250YWluaW5nIG5ldyBpbmRleCBkYXRhXG4gICAqIEBwYXJhbSByZXNvdXJjZUhhbmRsZSAtIFRoZSBoYW5kbGUgb2YgdGhlIGluZGV4IGJ1ZmZlciB0byB1cGRhdGVcbiAgICogQHRocm93cyBFcnJvciBpZiBubyBXZWJHTCBjb250ZXh0IGlzIGF2YWlsYWJsZSBvciBJQk8gbm90IGZvdW5kXG4gICAqL1xuICB1cGRhdGVJbmRleEJ1ZmZlcihhY2Nlc3NvcjogQWNjZXNzb3IsIHJlc291cmNlSGFuZGxlOiBudW1iZXIpIHtcbiAgICBjb25zdCBnbHcgPSB0aGlzLl9fZ2x3IGFzIFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gICAgY29uc3QgZ2wgPSBnbHc/LmdldFJhd0NvbnRleHQoKSBhcyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0O1xuICAgIGlmIChJcy5ub3QuZXhpc3QoZ2wpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCBzZXQgYXMgRGVmYXVsdC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBpYm8gPSB0aGlzLl9fd2ViZ2xSZXNvdXJjZXMuZ2V0KHJlc291cmNlSGFuZGxlKSBhcyBXZWJHTEJ1ZmZlcjtcbiAgICBpZiAoSXMubm90LmV4aXN0KGlibykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGZvdW5kIElCTy4nKTtcbiAgICB9XG5cbiAgICBnbHcuYmluZFZlcnRleEFycmF5KG51bGwpO1xuXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaWJvKTtcbiAgICBnbC5idWZmZXJTdWJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCAwLCBhY2Nlc3Nvci5nZXRUeXBlZEFycmF5KCkpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZXJ0ZXggYnVmZmVyIGZyb20gdGhlIHByb3ZpZGVkIGFjY2Vzc29yIGRhdGEuXG4gICAqXG4gICAqIEBwYXJhbSBhY2Nlc3NvciAtIFRoZSBhY2Nlc3NvciBjb250YWluaW5nIHZlcnRleCBkYXRhXG4gICAqIEByZXR1cm5zIFRoZSBoYW5kbGUgb2YgdGhlIGNyZWF0ZWQgdmVydGV4IGJ1ZmZlclxuICAgKiBAdGhyb3dzIEVycm9yIGlmIG5vIFdlYkdMIGNvbnRleHQgaXMgYXZhaWxhYmxlXG4gICAqL1xuICBjcmVhdGVWZXJ0ZXhCdWZmZXIoYWNjZXNzb3I6IEFjY2Vzc29yKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG5cbiAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgc2V0IGFzIERlZmF1bHQuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2dsdyEuYmluZFZlcnRleEFycmF5KG51bGwpO1xuICAgIGNvbnN0IHZibyA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGNvbnN0IHJlc291cmNlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodmJvISk7XG5cbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdmJvKTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgYWNjZXNzb3IuZ2V0VWludDhBcnJheSgpLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgLy8gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGFjY2Vzc29yLmdldFR5cGVkQXJyYXkoKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcblxuICAgIHJldHVybiByZXNvdXJjZUhhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVydGV4IGJ1ZmZlciBkaXJlY3RseSBmcm9tIGEgdHlwZWQgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlZEFycmF5IC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdmVydGV4IGRhdGFcbiAgICogQHJldHVybnMgVGhlIGhhbmRsZSBvZiB0aGUgY3JlYXRlZCB2ZXJ0ZXggYnVmZmVyXG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgbm8gV2ViR0wgY29udGV4dCBpcyBhdmFpbGFibGVcbiAgICovXG4gIGNyZWF0ZVZlcnRleEJ1ZmZlckZyb21UeXBlZEFycmF5KHR5cGVkQXJyYXk6IFR5cGVkQXJyYXkpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcblxuICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCBzZXQgYXMgRGVmYXVsdC4nKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fZ2x3IS5iaW5kVmVydGV4QXJyYXkobnVsbCk7XG4gICAgY29uc3QgdmJvID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh2Ym8hKTtcblxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2Ym8pO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0eXBlZEFycmF5LCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuXG4gICAgcmV0dXJuIHJlc291cmNlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5kZXggYnVmZmVyIGRpcmVjdGx5IGZyb20gYSB0eXBlZCBhcnJheS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGVkQXJyYXkgLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyBpbmRleCBkYXRhXG4gICAqIEByZXR1cm5zIFRoZSBoYW5kbGUgb2YgdGhlIGNyZWF0ZWQgaW5kZXggYnVmZmVyXG4gICAqL1xuICBjcmVhdGVJbmRleEJ1ZmZlckZyb21UeXBlZEFycmF5KHR5cGVkQXJyYXk6IFR5cGVkQXJyYXkpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcblxuICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCBzZXQgYXMgRGVmYXVsdC4nKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fZ2x3IS5iaW5kVmVydGV4QXJyYXkobnVsbCk7XG4gICAgY29uc3QgaWJvID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShpYm8hKTtcblxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlibyk7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdHlwZWRBcnJheSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuXG4gICAgcmV0dXJuIHJlc291cmNlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYW4gZXhpc3RpbmcgdmVydGV4IGJ1ZmZlciB3aXRoIG5ldyBkYXRhIGZyb20gdGhlIGFjY2Vzc29yLlxuICAgKlxuICAgKiBAcGFyYW0gYWNjZXNzb3IgLSBUaGUgYWNjZXNzb3IgY29udGFpbmluZyBuZXcgdmVydGV4IGRhdGFcbiAgICogQHBhcmFtIHJlc291cmNlSGFuZGxlIC0gVGhlIGhhbmRsZSBvZiB0aGUgdmVydGV4IGJ1ZmZlciB0byB1cGRhdGVcbiAgICogQHRocm93cyBFcnJvciBpZiBubyBXZWJHTCBjb250ZXh0IGlzIGF2YWlsYWJsZSBvciBWQk8gbm90IGZvdW5kXG4gICAqL1xuICB1cGRhdGVWZXJ0ZXhCdWZmZXIoYWNjZXNzb3I6IEFjY2Vzc29yLCByZXNvdXJjZUhhbmRsZTogbnVtYmVyKSB7XG4gICAgY29uc3QgZ2x3ID0gdGhpcy5fX2dsdyBhcyBXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgIGNvbnN0IGdsID0gZ2x3Py5nZXRSYXdDb250ZXh0KCkgYXMgV2ViR0xSZW5kZXJpbmdDb250ZXh0IHwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dDtcbiAgICBpZiAoIUlzLmV4aXN0KGdsKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgc2V0IGFzIERlZmF1bHQuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgdmJvID0gdGhpcy5fX3dlYmdsUmVzb3VyY2VzLmdldChyZXNvdXJjZUhhbmRsZSkgYXMgV2ViR0xCdWZmZXI7XG4gICAgaWYgKCFJcy5leGlzdCh2Ym8pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBmb3VuZCBWQk8uJyk7XG4gICAgfVxuXG4gICAgZ2x3LmJpbmRWZXJ0ZXhBcnJheShudWxsKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdmJvKTtcbiAgICAvLyBUaGUgR1BVIGJ1ZmZlciB3YXMgY3JlYXRlZCBmcm9tIHRoZSBhY2Nlc3NvcidzIGRhdGEsIG5vdCBmcm9tIHRoZSB3aG9sZSBidWZmZXIgdmlldy5cbiAgICAvLyBVc2luZyB0aGUgYnVmZmVyIHZpZXcgaGVyZSBjb3VsZCB3cml0ZSBwYXN0IHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciB3aGVuIHRoZSB2aWV3IGlzXG4gICAgLy8gc2hhcmVkIHdpdGggb3RoZXIgYWNjZXNzb3JzIChvciBpcyBvdGhlcndpc2UgbGFyZ2VyIHRoYW4gdGhlIGFjY2Vzc29yKS5cbiAgICBnbC5idWZmZXJTdWJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgMCwgYWNjZXNzb3IuZ2V0VWludDhBcnJheSgpKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgbnVsbCk7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyB0aGUgYmVnaW5uaW5nIG9mIGFuIGV4aXN0aW5nIHZlcnRleCBidWZmZXIgd2l0aCB0aGUgZ2l2ZW4gdHlwZWQgYXJyYXkuXG4gICAqXG4gICAqIFRoZSB2ZXJ0ZXggYXJyYXkgYmluZGluZyBpcyBsZWZ0IHVudG91Y2hlZDogdGhlIEFSUkFZX0JVRkZFUiBiaW5kaW5nIGlzIG5vdCBwYXJ0IG9mIHRoZSBWQU8gc3RhdGUsXG4gICAqIHNvIHRoaXMgY2FuIGJlIGNhbGxlZCBiZXR3ZWVuIGRyYXcgY2FsbHMgd2l0aG91dCBkaXN0dXJiaW5nIHRoZSBib3VuZCBWQU8uXG4gICAqXG4gICAqIEBwYXJhbSByZXNvdXJjZUhhbmRsZSAtIFRoZSBoYW5kbGUgb2YgdGhlIHZlcnRleCBidWZmZXIgdG8gdXBkYXRlXG4gICAqIEBwYXJhbSB0eXBlZEFycmF5IC0gVGhlIGRhdGEgd3JpdHRlbiBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlclxuICAgKiBAdGhyb3dzIEVycm9yIGlmIG5vIFdlYkdMIGNvbnRleHQgaXMgYXZhaWxhYmxlIG9yIFZCTyBub3QgZm91bmRcbiAgICovXG4gIHVwZGF0ZVZlcnRleEJ1ZmZlcldpdGhUeXBlZEFycmF5KHJlc291cmNlSGFuZGxlOiBXZWJHTFJlc291cmNlSGFuZGxlLCB0eXBlZEFycmF5OiBUeXBlZEFycmF5KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3Py5nZXRSYXdDb250ZXh0KCk7XG4gICAgaWYgKCFJcy5leGlzdChnbCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gV2ViR0xSZW5kZXJpbmdDb250ZXh0IHNldCBhcyBEZWZhdWx0LicpO1xuICAgIH1cblxuICAgIGNvbnN0IHZibyA9IHRoaXMuX193ZWJnbFJlc291cmNlcy5nZXQocmVzb3VyY2VIYW5kbGUpIGFzIFdlYkdMQnVmZmVyO1xuICAgIGlmICghSXMuZXhpc3QodmJvKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgZm91bmQgVkJPLicpO1xuICAgIH1cblxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2Ym8pO1xuICAgIGdsLmJ1ZmZlclN1YkRhdGEoZ2wuQVJSQVlfQlVGRkVSLCAwLCB0eXBlZEFycmF5KTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgbnVsbCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZXJ0ZXggYXJyYXkgb2JqZWN0IChWQU8pLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaGFuZGxlIG9mIHRoZSBjcmVhdGVkIFZBTyBvciB1bmRlZmluZWQgaWYgY3JlYXRpb24gZmFpbGVkXG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgbm8gV2ViR0wgY29udGV4dCBpcyBhdmFpbGFibGVcbiAgICovXG4gIGNyZWF0ZVZlcnRleEFycmF5KCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdztcblxuICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCBzZXQgYXMgRGVmYXVsdC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCB2YW8gPSB0aGlzLl9fZ2x3IS5jcmVhdGVWZXJ0ZXhBcnJheSgpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QodmFvKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCByZXNvdXJjZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKHZhbyk7XG5cbiAgICByZXR1cm4gcmVzb3VyY2VIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSAyRCB0ZXh0dXJlIHRvIHRoZSBzcGVjaWZpZWQgdGV4dHVyZSBzbG90LlxuICAgKlxuICAgKiBAcGFyYW0gdGV4dHVyZVNsb3RJbmRleCAtIFRoZSB0ZXh0dXJlIHNsb3QgaW5kZXggdG8gYmluZCB0b1xuICAgKiBAcGFyYW0gdGV4dHVyZVVpZCAtIFRoZSBoYW5kbGUgb2YgdGhlIHRleHR1cmUgdG8gYmluZFxuICAgKi9cbiAgYmluZFRleHR1cmUyRCh0ZXh0dXJlU2xvdEluZGV4OiBJbmRleCwgdGV4dHVyZVVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSkge1xuICAgIC8vIGNvbnN0IHRleHR1cmUgPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UodGV4dHVyZVVpZCkgYXMgV2ViR0xUZXh0dXJlO1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLl9fd2ViZ2xSZXNvdXJjZXMuZ2V0KHRleHR1cmVVaWQpIGFzIFdlYkdMVGV4dHVyZTtcbiAgICB0aGlzLl9fZ2x3IS5iaW5kVGV4dHVyZTJEKHRleHR1cmVTbG90SW5kZXgsIHRleHR1cmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgdGV4dHVyZSBzYW1wbGVyIHRvIHRoZSBzcGVjaWZpZWQgdGV4dHVyZSBzbG90LlxuICAgKlxuICAgKiBAcGFyYW0gdGV4dHVyZVNsb3RJbmRleCAtIFRoZSB0ZXh0dXJlIHNsb3QgaW5kZXggdG8gYmluZCB0b1xuICAgKiBAcGFyYW0gc2FtcGxlclVpZCAtIFRoZSBoYW5kbGUgb2YgdGhlIHNhbXBsZXIgdG8gYmluZCwgb3IgLTEgdG8gdW5iaW5kXG4gICAqL1xuICBiaW5kVGV4dHVyZVNhbXBsZXIodGV4dHVyZVNsb3RJbmRleDogSW5kZXgsIHNhbXBsZXJVaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBpZiAoc2FtcGxlclVpZCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlU2FtcGxlcih0ZXh0dXJlU2xvdEluZGV4LCBudWxsIGFzIGFueSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNhbXBsZXIgPSB0aGlzLmdldFdlYkdMUmVzb3VyY2Uoc2FtcGxlclVpZCkgYXMgV2ViR0xTYW1wbGVyO1xuICAgICAgdGhpcy5fX2dsdyEuYmluZFRleHR1cmVTYW1wbGVyKHRleHR1cmVTbG90SW5kZXgsIHNhbXBsZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhIGN1YmUgdGV4dHVyZSB0byB0aGUgc3BlY2lmaWVkIHRleHR1cmUgc2xvdC5cbiAgICpcbiAgICogQHBhcmFtIHRleHR1cmVTbG90SW5kZXggLSBUaGUgdGV4dHVyZSBzbG90IGluZGV4IHRvIGJpbmQgdG9cbiAgICogQHBhcmFtIHRleHR1cmVVaWQgLSBUaGUgaGFuZGxlIG9mIHRoZSBjdWJlIHRleHR1cmUgdG8gYmluZFxuICAgKi9cbiAgYmluZFRleHR1cmVDdWJlKHRleHR1cmVTbG90SW5kZXg6IEluZGV4LCB0ZXh0dXJlVWlkOiBDR0FQSVJlc291cmNlSGFuZGxlKSB7XG4gICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZSh0ZXh0dXJlVWlkKSBhcyBXZWJHTFRleHR1cmU7XG4gICAgdGhpcy5fX2dsdyEuYmluZFRleHR1cmVDdWJlKHRleHR1cmVTbG90SW5kZXgsIHRleHR1cmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgMkQgdGV4dHVyZSBhcnJheSB0byB0aGUgc3BlY2lmaWVkIHRleHR1cmUgc2xvdC5cbiAgICpcbiAgICogQHBhcmFtIHRleHR1cmVTbG90SW5kZXggLSBUaGUgdGV4dHVyZSBzbG90IGluZGV4IHRvIGJpbmQgdG9cbiAgICogQHBhcmFtIHRleHR1cmVVaWQgLSBUaGUgaGFuZGxlIG9mIHRoZSAyRCB0ZXh0dXJlIGFycmF5IHRvIGJpbmRcbiAgICovXG4gIGJpbmRUZXh0dXJlMkRBcnJheSh0ZXh0dXJlU2xvdEluZGV4OiBJbmRleCwgdGV4dHVyZVVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSkge1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UodGV4dHVyZVVpZCkgYXMgV2ViR0xUZXh0dXJlO1xuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlMkRBcnJheSh0ZXh0dXJlU2xvdEluZGV4LCB0ZXh0dXJlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHZlcnRleCBidWZmZXJzIGFuZCBpbmRleCBidWZmZXJzIGZvciBhIHByaW1pdGl2ZSBhbmQgcmV0dXJucyBoYW5kbGVzIGZvciB0aGVtLlxuICAgKiBUaGlzIG1ldGhvZCBwcm9jZXNzZXMgYWxsIHZlcnRleCBhdHRyaWJ1dGVzIG9mIHRoZSBwcmltaXRpdmUgYW5kIGNyZWF0ZXMgY29ycmVzcG9uZGluZyBWQk9zLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSBvYmplY3QgY29udGFpbmluZyB2ZXJ0ZXggYW5kIGluZGV4IGRhdGFcbiAgICogQHJldHVybnMgVmVydGV4SGFuZGxlcyBvYmplY3QgY29udGFpbmluZyBhbGwgY3JlYXRlZCBidWZmZXIgaGFuZGxlcyBhbmQgbWV0YWRhdGFcbiAgICovXG4gIGNyZWF0ZVZlcnRleEJ1ZmZlckFuZEluZGV4QnVmZmVyKHByaW1pdGl2ZTogUHJpbWl0aXZlKTogVmVydGV4SGFuZGxlcyB7XG4gICAgbGV0IGlib0hhbmRsZTogV2ViR0xSZXNvdXJjZUhhbmRsZTtcbiAgICBpZiAocHJpbWl0aXZlLmhhc0luZGljZXMoKSkge1xuICAgICAgaWJvSGFuZGxlID0gdGhpcy5jcmVhdGVJbmRleEJ1ZmZlcihwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yISk7XG4gICAgfVxuXG4gICAgY29uc3QgYXR0cmlidXRlc0ZsYWdzOiBib29sZWFuW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IFZlcnRleEF0dHJpYnV0ZS5BdHRyaWJ1dGVUeXBlTnVtYmVyOyBpKyspIHtcbiAgICAgIGF0dHJpYnV0ZXNGbGFnc1tpXSA9IGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCB2Ym9IYW5kbGVzOiBBcnJheTxXZWJHTFJlc291cmNlSGFuZGxlPiA9IFtdO1xuICAgIHByaW1pdGl2ZS5hdHRyaWJ1dGVBY2Nlc3NvcnMuZm9yRWFjaCgoYWNjZXNzb3I6IEFjY2Vzc29yLCBpOiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnN0IHZib0hhbmRsZSA9IHRoaXMuY3JlYXRlVmVydGV4QnVmZmVyKGFjY2Vzc29yKTtcbiAgICAgIGNvbnN0IHNsb3RJZHggPSBWZXJ0ZXhBdHRyaWJ1dGUudG9BdHRyaWJ1dGVTbG90RnJvbUpvaW5lZFN0cmluZyhwcmltaXRpdmUuYXR0cmlidXRlU2VtYW50aWNzW2ldKTtcbiAgICAgIGF0dHJpYnV0ZXNGbGFnc1tzbG90SWR4XSA9IHRydWU7XG4gICAgICB2Ym9IYW5kbGVzLnB1c2godmJvSGFuZGxlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICB2YW9IYW5kbGU6IC0xLFxuICAgICAgaWJvSGFuZGxlOiBpYm9IYW5kbGUhLFxuICAgICAgdmJvSGFuZGxlczogdmJvSGFuZGxlcyxcbiAgICAgIGF0dHJpYnV0ZXNGbGFnczogYXR0cmlidXRlc0ZsYWdzLFxuICAgICAgc2V0Q29tcGxldGU6IGZhbHNlLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBleGlzdGluZyB2ZXJ0ZXggYnVmZmVycyBhbmQgaW5kZXggYnVmZmVycyB3aXRoIG5ldyBkYXRhIGZyb20gYSBwcmltaXRpdmUuXG4gICAqXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIG9iamVjdCBjb250YWluaW5nIHVwZGF0ZWQgdmVydGV4IGFuZCBpbmRleCBkYXRhXG4gICAqIEBwYXJhbSB2ZXJ0ZXhIYW5kbGVzIC0gVGhlIGhhbmRsZXMgb2YgdGhlIGJ1ZmZlcnMgdG8gdXBkYXRlXG4gICAqL1xuICB1cGRhdGVWZXJ0ZXhCdWZmZXJBbmRJbmRleEJ1ZmZlcihwcmltaXRpdmU6IFByaW1pdGl2ZSwgdmVydGV4SGFuZGxlczogVmVydGV4SGFuZGxlcykge1xuICAgIGlmICh2ZXJ0ZXhIYW5kbGVzLmlib0hhbmRsZSkge1xuICAgICAgdGhpcy51cGRhdGVJbmRleEJ1ZmZlcihwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yIGFzIEFjY2Vzc29yLCB2ZXJ0ZXhIYW5kbGVzLmlib0hhbmRsZSk7XG4gICAgfVxuXG4gICAgY29uc3QgYXR0cmlidXRlQWNjZXNzb3JzID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29ycztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJpYnV0ZUFjY2Vzc29ycy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy51cGRhdGVWZXJ0ZXhCdWZmZXIoYXR0cmlidXRlQWNjZXNzb3JzW2ldLCB2ZXJ0ZXhIYW5kbGVzLnZib0hhbmRsZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBjb21waWxlcyBhIHNoYWRlciBwcm9ncmFtIGZyb20gdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXIgc291cmNlIGNvZGUuXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgc2hhZGVyIGNvbXBpbGF0aW9uLCBsaW5raW5nLCBhbmQgZXJyb3IgcmVwb3J0aW5nLlxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgZm9yIHNoYWRlciBwcm9ncmFtIGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXJhbXMuY29uZmlnIC0gQ29uZmlndXJhdGlvbiBmb3IgdGhlIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBwYXJhbXMuZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gcGFyYW1zLm1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBwYXJhbXMucHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0aGF0IHdpbGwgdXNlIHRoaXMgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIHBhcmFtcy52ZXJ0ZXhTaGFkZXJTdHIgLSBUaGUgdmVydGV4IHNoYWRlciBzb3VyY2UgY29kZVxuICAgKiBAcGFyYW0gcGFyYW1zLmZyYWdtZW50U2hhZGVyU3RyIC0gVGhlIGZyYWdtZW50IHNoYWRlciBzb3VyY2UgY29kZVxuICAgKiBAcGFyYW0gcGFyYW1zLmF0dHJpYnV0ZU5hbWVzIC0gQXJyYXkgb2YgdmVydGV4IGF0dHJpYnV0ZSBuYW1lc1xuICAgKiBAcGFyYW0gcGFyYW1zLmF0dHJpYnV0ZVNlbWFudGljcyAtIEFycmF5IG9mIHZlcnRleCBhdHRyaWJ1dGUgc2VtYW50aWNzXG4gICAqIEBwYXJhbSBwYXJhbXMub25FcnJvciAtIE9wdGlvbmFsIGVycm9yIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqIEByZXR1cm5zIFRoZSBoYW5kbGUgb2YgdGhlIGNyZWF0ZWQgc2hhZGVyIHByb2dyYW0sIG9yIEludmFsaWRDR0FQSVJlc291cmNlVWlkIG9uIGZhaWx1cmVcbiAgICogQHRocm93cyBFcnJvciBpZiBubyBXZWJHTCBjb250ZXh0IGlzIGF2YWlsYWJsZVxuICAgKi9cbiAgY3JlYXRlU2hhZGVyUHJvZ3JhbSh7XG4gICAgY29uZmlnLFxuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbCxcbiAgICBwcmltaXRpdmUsXG4gICAgdmVydGV4U2hhZGVyU3RyLFxuICAgIGZyYWdtZW50U2hhZGVyU3RyLFxuICAgIGF0dHJpYnV0ZU5hbWVzLFxuICAgIGF0dHJpYnV0ZVNlbWFudGljcyxcbiAgICBvbkVycm9yLFxuICB9OiB7XG4gICAgY29uZmlnOiBDb25maWc7XG4gICAgZW5naW5lOiBFbmdpbmU7XG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsO1xuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlO1xuICAgIHZlcnRleFNoYWRlclN0cjogc3RyaW5nO1xuICAgIGZyYWdtZW50U2hhZGVyU3RyOiBzdHJpbmc7XG4gICAgYXR0cmlidXRlTmFtZXM6IEF0dHJpYnV0ZU5hbWVzO1xuICAgIGF0dHJpYnV0ZVNlbWFudGljczogVmVydGV4QXR0cmlidXRlRW51bVtdO1xuICAgIG9uRXJyb3I/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkO1xuICB9KTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dCgpO1xuXG4gICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gV2ViR0xSZW5kZXJpbmdDb250ZXh0IHNldCBhcyBEZWZhdWx0LicpO1xuICAgIH1cbiAgICBjb25zdCBpc0RlYnVnTW9kZSA9IGNvbmZpZy5jZ0FwaURlYnVnQ29uc29sZU91dHB1dDtcblxuICAgIGNvbnN0IHZlcnRleFNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKSE7XG4gICAgZ2wuc2hhZGVyU291cmNlKHZlcnRleFNoYWRlciwgdmVydGV4U2hhZGVyU3RyKTtcbiAgICBnbC5jb21waWxlU2hhZGVyKHZlcnRleFNoYWRlcik7XG4gICAgaWYgKGlzRGVidWdNb2RlKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9fY2hlY2tTaGFkZXJDb21waWxlU3RhdHVzKFxuICAgICAgICBlbmdpbmUsXG4gICAgICAgIG1hdGVyaWFsLm1hdGVyaWFsVHlwZU5hbWUsXG4gICAgICAgIHZlcnRleFNoYWRlcixcbiAgICAgICAgdmVydGV4U2hhZGVyU3RyLFxuICAgICAgICBvbkVycm9yXG4gICAgICApO1xuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICByZXR1cm4gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZnJhZ21lbnRTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSKSE7XG4gICAgZ2wuc2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyLCBmcmFnbWVudFNoYWRlclN0cik7XG4gICAgZ2wuY29tcGlsZVNoYWRlcihmcmFnbWVudFNoYWRlcik7XG4gICAgaWYgKGlzRGVidWdNb2RlKSB7XG4gICAgICB0aGlzLl9fY2hlY2tTaGFkZXJDb21waWxlU3RhdHVzKGVuZ2luZSwgbWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZSwgZnJhZ21lbnRTaGFkZXIsIGZyYWdtZW50U2hhZGVyU3RyLCBvbkVycm9yKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaGFkZXJQcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpISBhcyBSbldlYkdMUHJvZ3JhbTtcbiAgICBzaGFkZXJQcm9ncmFtLl9lbmdpbmUgPSBlbmdpbmU7XG4gICAgc2hhZGVyUHJvZ3JhbS5fZ2wgPSBnbDtcbiAgICBzaGFkZXJQcm9ncmFtLl9tYXRlcmlhbFR5cGVOYW1lID0gbWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZTtcbiAgICBpZiAoaXNEZWJ1Z01vZGUpIHtcbiAgICAgIHNoYWRlclByb2dyYW0uX3ZlcnRleFNoYWRlclN0ciA9IHZlcnRleFNoYWRlclN0cjtcbiAgICAgIHNoYWRlclByb2dyYW0uX2ZyYWdtZW50U2hhZGVyU3RyID0gZnJhZ21lbnRTaGFkZXJTdHI7XG4gICAgfVxuICAgIHNoYWRlclByb2dyYW0uX3NoYWRlclNlbWFudGljc0luZm9NYXAgPSBuZXcgTWFwKCk7XG4gICAgc2hhZGVyUHJvZ3JhbS5fbWF0ZXJpYWwgPSBuZXcgV2Vha1JlZihtYXRlcmlhbCk7XG4gICAgc2hhZGVyUHJvZ3JhbS5fcHJpbWl0aXZlID0gbmV3IFdlYWtSZWYocHJpbWl0aXZlKTtcblxuICAgIGdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCB2ZXJ0ZXhTaGFkZXIpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCBmcmFnbWVudFNoYWRlcik7XG5cbiAgICBjb25zdCBtYXhWZXJ0ZXhBdHRyaWJzID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLk1BWF9WRVJURVhfQVRUUklCUykgYXMgbnVtYmVyO1xuICAgIGNvbnN0IGJpbmRBdHRyaWJMb2NhdGlvbiA9IChpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgIC8vIFNraXBwaW5nIGludmFsaWQgc2xvdHMgYXZvaWRzIElOVkFMSURfVkFMVUUgb24gY29udGV4dHMgd2hvc2UgTUFYX1ZFUlRFWF9BVFRSSUJTIGlzXG4gICAgICAvLyBzbWFsbGVyIHRoYW4gdGhlIGVuZ2luZSdzIGZpeGVkIHNsb3RzIChlLmcuIFdlYkdMMSBvciBjdXN0b20gY29udGV4dHMpLlxuICAgICAgaWYgKGluZGV4ID49IDAgJiYgaW5kZXggPCBtYXhWZXJ0ZXhBdHRyaWJzKSB7XG4gICAgICAgIGdsLmJpbmRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBpbmRleCwgbmFtZSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBhdHRyaWJ1dGVOYW1lcy5mb3JFYWNoKChhdHRyaWJ1dGVOYW1lOiBzdHJpbmcsIGk6IG51bWJlcikgPT4ge1xuICAgICAgYmluZEF0dHJpYkxvY2F0aW9uKGF0dHJpYnV0ZVNlbWFudGljc1tpXS5nZXRBdHRyaWJ1dGVTbG90KCksIGF0dHJpYnV0ZU5hbWUpO1xuICAgIH0pO1xuICAgIC8vIFRoZSBpbnN0YW5jZSBhdHRyaWJ1dGUgaXMgbm90IHBhcnQgb2YgdGhlIHByaW1pdGl2ZSdzIGF0dHJpYnV0ZXMsIHNvIGJpbmQgaXQgZXhwbGljaXRseS5cbiAgICAvLyBPbmx5IG9uZSBvZiB0aGUgdHdvIG5hbWVzIGV4aXN0cyBpbiBhIGdpdmVuIHNoYWRlcjsgYmluZGluZyBhbiBhYnNlbnQgbmFtZSBpcyBhIG5vLW9wLlxuICAgIGJpbmRBdHRyaWJMb2NhdGlvbihWZXJ0ZXhBdHRyaWJ1dGUuSW5zdGFuY2UuZ2V0QXR0cmlidXRlU2xvdCgpLCAnYV9pbnN0YW5jZUJhc2UnKTtcbiAgICBiaW5kQXR0cmliTG9jYXRpb24oVmVydGV4QXR0cmlidXRlLkluc3RhbmNlLmdldEF0dHJpYnV0ZVNsb3QoKSwgJ2FfaW5zdGFuY2VJZHMnKTtcbiAgICAvLyBQZXItdmVydGV4IG1hdGVyaWFsU0lEIHVzZWQgYnkgY3Jvc3MtbWF0ZXJpYWwgbXVsdGktZHJhdyBiYXRjaGluZy5cbiAgICBiaW5kQXR0cmliTG9jYXRpb24oVmVydGV4QXR0cmlidXRlLk1hdGVyaWFsU2lkLmdldEF0dHJpYnV0ZVNsb3QoKSwgJ2FfbWF0ZXJpYWxTaWQnKTtcblxuICAgIGdsLmxpbmtQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuXG4gICAgaWYgKGlzRGVidWdNb2RlKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9fY2hlY2tTaGFkZXJQcm9ncmFtTGlua1N0YXR1cyhcbiAgICAgICAgZW5naW5lLFxuICAgICAgICBtYXRlcmlhbC5tYXRlcmlhbFR5cGVOYW1lLFxuICAgICAgICBzaGFkZXJQcm9ncmFtLFxuICAgICAgICB2ZXJ0ZXhTaGFkZXJTdHIsXG4gICAgICAgIGZyYWdtZW50U2hhZGVyU3RyXG4gICAgICApO1xuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICByZXR1cm4gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2hhZGVyUHJvZ3JhbS5fX1NQRUNUT1JfcmVidWlsZFByb2dyYW0gPSB0aGlzLnJlYnVpbGRQcm9ncmFtQnlTcGVjdG9yLmJpbmQoc2hhZGVyUHJvZ3JhbSk7XG5cbiAgICBjb25zdCByZXNvdXJjZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKHNoYWRlclByb2dyYW0pO1xuXG4gICAgZ2wuZGVsZXRlU2hhZGVyKHZlcnRleFNoYWRlcik7XG4gICAgZ2wuZGVsZXRlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcblxuICAgIHJldHVybiByZXNvdXJjZUhhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZXMgc2hhZGVyIGNvbXBpbGF0aW9uIHN0YXR1cyBhbmQgbG9ncyBlcnJvcnMgaWYgY29tcGlsYXRpb24gZmFpbHMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIGZvciBsb2dnaW5nXG4gICAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1hdGVyaWFsIHR5cGUgZm9yIGVycm9yIGNvbnRleHRcbiAgICogQHBhcmFtIHNoYWRlciAtIFRoZSBjb21waWxlZCBzaGFkZXIgb2JqZWN0IHRvIGNoZWNrXG4gICAqIEBwYXJhbSBzaGFkZXJUZXh0IC0gVGhlIHNoYWRlciBzb3VyY2UgY29kZSBmb3IgZXJyb3IgcmVwb3J0aW5nXG4gICAqIEBwYXJhbSBvbkVycm9yIC0gT3B0aW9uYWwgZXJyb3IgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBjb21waWxhdGlvbiBzdWNjZWVkZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NoZWNrU2hhZGVyQ29tcGlsZVN0YXR1cyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcsXG4gICAgc2hhZGVyOiBXZWJHTFNoYWRlcixcbiAgICBzaGFkZXJUZXh0OiBzdHJpbmcsXG4gICAgb25FcnJvcj86IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbiAgKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZ2x3ID0gdGhpcy5fX2dsdyE7XG4gICAgY29uc3QgZ2wgPSBnbHchLmdldFJhd0NvbnRleHQoKTtcbiAgICBpZiAoSXMuZmFsc2UoZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpKSAmJiBJcy5mYWxzZShnbC5pc0NvbnRleHRMb3N0KCkpKSB7XG4gICAgICBlbmdpbmUubG9nZ2VyLmluZm8oYE1hdGVyaWFsVHlwZU5hbWU6ICR7bWF0ZXJpYWxUeXBlTmFtZX1gKTtcbiAgICAgIGNvbnN0IGxpbmVOdW1iZXJlZFNoYWRlclRleHQgPSBNaXNjVXRpbC5hZGRMaW5lTnVtYmVyVG9Db2RlKHNoYWRlclRleHQpO1xuICAgICAgZW5naW5lLmxvZ2dlci5pbmZvKGxpbmVOdW1iZXJlZFNoYWRlclRleHQpO1xuICAgICAgY29uc3QgbG9nID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xuICAgICAgaWYgKG9uRXJyb3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBlbmdpbmUubG9nZ2VyLmVycm9yKGBBbiBlcnJvciBvY2N1cnJlZCBjb21waWxpbmcgdGhlIHNoYWRlcnM6JHtsb2d9YCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIG9uRXJyb3IobG9nISk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlcyBzaGFkZXIgcHJvZ3JhbSBsaW5raW5nIHN0YXR1cyBhbmQgbG9ncyBlcnJvcnMgaWYgbGlua2luZyBmYWlscy5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgZm9yIGxvZ2dpbmdcbiAgICogQHBhcmFtIG1hdGVyaWFsVHlwZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWF0ZXJpYWwgdHlwZSBmb3IgZXJyb3IgY29udGV4dFxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBsaW5rZWQgc2hhZGVyIHByb2dyYW0gdG8gY2hlY2tcbiAgICogQHBhcmFtIHZlcnRleFNoYWRlclRleHQgLSBUaGUgdmVydGV4IHNoYWRlciBzb3VyY2UgY29kZSBmb3IgZXJyb3IgcmVwb3J0aW5nXG4gICAqIEBwYXJhbSBmcmFnbWVudFNoYWRlclRleHQgLSBUaGUgZnJhZ21lbnQgc2hhZGVyIHNvdXJjZSBjb2RlIGZvciBlcnJvciByZXBvcnRpbmdcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBsaW5raW5nIHN1Y2NlZWRlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwcml2YXRlIF9fY2hlY2tTaGFkZXJQcm9ncmFtTGlua1N0YXR1cyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcsXG4gICAgc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtLFxuICAgIHZlcnRleFNoYWRlclRleHQ6IHN0cmluZyxcbiAgICBmcmFnbWVudFNoYWRlclRleHQ6IHN0cmluZ1xuICApOiBib29sZWFuIHtcbiAgICBjb25zdCBnbHcgPSB0aGlzLl9fZ2x3ITtcbiAgICBjb25zdCBnbCA9IGdsdyEuZ2V0UmF3Q29udGV4dCgpO1xuXG4gICAgLy8gSWYgY3JlYXRpbmcgdGhlIHNoYWRlciBwcm9ncmFtIGZhaWxlZCwgYWxlcnRcbiAgICBpZiAoSXMuZmFsc2UoZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihzaGFkZXJQcm9ncmFtLCBnbC5MSU5LX1NUQVRVUykpICYmIElzLmZhbHNlKGdsLmlzQ29udGV4dExvc3QoKSkpIHtcbiAgICAgIGVuZ2luZS5sb2dnZXIuaW5mbyhgTWF0ZXJpYWxUeXBlTmFtZTogJHttYXRlcmlhbFR5cGVOYW1lfWApO1xuICAgICAgZW5naW5lLmxvZ2dlci5pbmZvKE1pc2NVdGlsLmFkZExpbmVOdW1iZXJUb0NvZGUoJ1ZlcnRleCBTaGFkZXI6JykpO1xuICAgICAgZW5naW5lLmxvZ2dlci5pbmZvKE1pc2NVdGlsLmFkZExpbmVOdW1iZXJUb0NvZGUodmVydGV4U2hhZGVyVGV4dCkpO1xuICAgICAgZW5naW5lLmxvZ2dlci5pbmZvKE1pc2NVdGlsLmFkZExpbmVOdW1iZXJUb0NvZGUoJ0ZyYWdtZW50IFNoYWRlcjonKSk7XG4gICAgICBlbmdpbmUubG9nZ2VyLmluZm8oTWlzY1V0aWwuYWRkTGluZU51bWJlclRvQ29kZShmcmFnbWVudFNoYWRlclRleHQpKTtcbiAgICAgIGNvbnN0IGxvZyA9IGdsLmdldFByb2dyYW1JbmZvTG9nKHNoYWRlclByb2dyYW0pO1xuICAgICAgZW5naW5lLmxvZ2dlci5lcnJvcihgVW5hYmxlIHRvIGluaXRpYWxpemUgdGhlIHNoYWRlciBwcm9ncmFtOiAke2xvZ31gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHVuaWZvcm0gbG9jYXRpb25zIGZvciBhIHNoYWRlciBwcm9ncmFtIGJhc2VkIG9uIHNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24uXG4gICAqIFRoaXMgbWV0aG9kIGV4dHJhY3RzIHVuaWZvcm0gbG9jYXRpb25zIGZyb20gdGhlIGNvbXBpbGVkIHNoYWRlciBwcm9ncmFtIGFuZCBzdG9yZXMgdGhlbVxuICAgKiBmb3IgZWZmaWNpZW50IGFjY2VzcyBkdXJpbmcgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gY29uZmlnIC0gQ29uZmlndXJhdGlvbiBmb3IgdGhlIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtVWlkIC0gVGhlIGhhbmRsZSBvZiB0aGUgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIGluZm9BcnJheSAtIEFycmF5IG9mIHNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb25cbiAgICogQHJldHVybnMgVGhlIFdlYkdMIHByb2dyYW0gb2JqZWN0IHdpdGggY29uZmlndXJlZCB1bmlmb3JtIGxvY2F0aW9uc1xuICAgKi9cbiAgc2V0dXBVbmlmb3JtTG9jYXRpb25zKFxuICAgIGNvbmZpZzogQ29uZmlnLFxuICAgIHNoYWRlclByb2dyYW1VaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUsXG4gICAgaW5mb0FycmF5OiBTaGFkZXJTZW1hbnRpY3NJbmZvW11cbiAgKTogV2ViR0xQcm9ncmFtIHtcbiAgICBjb25zdCBnbHcgPSB0aGlzLl9fZ2x3ITtcbiAgICBjb25zdCBnbCA9IGdsdy5nZXRSYXdDb250ZXh0KCk7XG4gICAgY29uc3Qgc2hhZGVyUHJvZ3JhbSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShzaGFkZXJQcm9ncmFtVWlkKSBhcyBSbldlYkdMUHJvZ3JhbTtcblxuICAgIGNvbnN0IGluZm9BcnJheUxlbiA9IGluZm9BcnJheS5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmZvQXJyYXlMZW47IGkrKykge1xuICAgICAgY29uc3QgaW5mbyA9IGluZm9BcnJheVtpXTtcbiAgICAgIHNoYWRlclByb2dyYW0uX3NoYWRlclNlbWFudGljc0luZm9NYXAuc2V0KGluZm8uc2VtYW50aWMsIGluZm8pO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5mb0FycmF5TGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGluZm8gPSBpbmZvQXJyYXlbaV07XG4gICAgICBjb25zdCBpc1VuaWZvcm1FeGlzdCA9IGluZm8ubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSB8fCBDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKTtcblxuICAgICAgaWYgKGlzVW5pZm9ybUV4aXN0KSB7XG4gICAgICAgIGNvbnN0IHNlbWFudGljU2luZ3VsYXIgPSBpbmZvLnNlbWFudGljO1xuXG4gICAgICAgIGNvbnN0IGlkZW50aWZpZXIgPSBzZW1hbnRpY1Npbmd1bGFyO1xuXG4gICAgICAgIGNvbnN0IHNoYWRlclZhck5hbWUgPSBgdV8ke2luZm8uc2VtYW50aWN9YDtcblxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBzaGFkZXJWYXJOYW1lKTtcbiAgICAgICAgY29uc3QgX3NoYWRlclByb2dyYW0gPSBzaGFkZXJQcm9ncmFtIGFzIGFueTtcbiAgICAgICAgX3NoYWRlclByb2dyYW1baWRlbnRpZmllcl0gPSBsb2NhdGlvbjtcbiAgICAgICAgaWYgKGxvY2F0aW9uID09IG51bGwgJiYgY29uZmlnLmNnQXBpRGVidWdDb25zb2xlT3V0cHV0KSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuaW5mbyhcbiAgICAgICAgICAgIGBDYW4gbm90IGdldCB0aGUgdW5pZm9ybSBsb2NhdGlvbjogJHtzaGFkZXJWYXJOYW1lfS4gVGhlIHVuaWZvcm0gbWF5IGJlIHVudXNlZCBieSBvdGhlciBjb2RlIHNvIGltcGxpY2l0bHkgcmVtb3ZlZC5gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzaGFkZXJQcm9ncmFtO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYmFzaWMgdW5pZm9ybSBsb2NhdGlvbnMgcmVxdWlyZWQgZm9yIGRhdGEgdGV4dHVyZSBvcGVyYXRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbVVpZCAtIFRoZSBoYW5kbGUgb2YgdGhlIHNoYWRlciBwcm9ncmFtIHRvIGNvbmZpZ3VyZVxuICAgKi9cbiAgc2V0dXBCYXNpY1VuaWZvcm1Mb2NhdGlvbnMoc2hhZGVyUHJvZ3JhbVVpZDogV2ViR0xSZXNvdXJjZUhhbmRsZSkge1xuICAgIGNvbnN0IHNoYWRlclByb2dyYW0gPSB0aGlzLmdldFdlYkdMUmVzb3VyY2Uoc2hhZGVyUHJvZ3JhbVVpZCkgYXMgUm5XZWJHTFByb2dyYW07XG4gICAgY29uc3QgZ2wgPSB0aGlzLmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyIS5nZXRSYXdDb250ZXh0KCk7XG4gICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5kYXRhVGV4dHVyZSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAndV9kYXRhVGV4dHVyZScpO1xuICAgIChzaGFkZXJQcm9ncmFtIGFzIGFueSkuY3VycmVudENvbXBvbmVudFNJRHMgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VfY3VycmVudENvbXBvbmVudFNJRHMnKTtcbiAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLmxpZ2h0Q2x1c3RlclZpZXcgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgJ3VfbGlnaHRDbHVzdGVyVmlldycpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSB1bmlmb3JtIHZhbHVlIGZvciB0ZXh0dXJlIGJpbmRpbmcgYW5kIGJpbmRzIHRoZSB0ZXh0dXJlIHRvIHRoZSBhcHByb3ByaWF0ZSBzbG90LlxuICAgKlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbV8gLSBUaGUgc2hhZGVyIHByb2dyYW0gdG8gc2V0IHRoZSB1bmlmb3JtIGZvclxuICAgKiBAcGFyYW0gc2VtYW50aWNTdHIgLSBUaGUgc2VtYW50aWMgc3RyaW5nIGlkZW50aWZ5aW5nIHRoZSB1bmlmb3JtXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSB2YWx1ZSBhcnJheSBjb250YWluaW5nIHRleHR1cmUgc2xvdCBpbmRleCBhbmQgdGV4dHVyZSBkYXRhXG4gICAqL1xuICBzZXRVbmlmb3JtMWlGb3JUZXh0dXJlKHNoYWRlclByb2dyYW1fOiBXZWJHTFByb2dyYW0sIHNlbWFudGljU3RyOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBjb25zdCBzaGFkZXJQcm9ncmFtID0gc2hhZGVyUHJvZ3JhbV8gYXMgUm5XZWJHTFByb2dyYW07XG4gICAgY29uc3QgaW5mbyA9IHNoYWRlclByb2dyYW0uX3NoYWRlclNlbWFudGljc0luZm9NYXAuZ2V0KHNlbWFudGljU3RyKTtcbiAgICBpZiAoaW5mbyA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFNhbXBsZXIgdW5pZm9ybXMga2VlcCB0aGVpciB2YWx1ZSBpbiB0aGUgcHJvZ3JhbSBvYmplY3QsIGFuZCBtYXRlcmlhbHMgc2hhcmluZyBhIHByb2dyYW1cbiAgICAvLyB1c3VhbGx5IHVzZSB0aGUgc2FtZSB0ZXh0dXJlIHVuaXQsIHNvIHNraXAgdGhlIEdMIGNhbGwgd2hlbiB0aGUgdW5pdCBpcyB1bmNoYW5nZWQuXG4gICAgLy8gV2l0aCB0aG91c2FuZHMgb2YgbWF0ZXJpYWxzIHRoaXMgY2FsbCB3YXMgaXNzdWVkIGZvciBldmVyeSB0ZXh0dXJlIG9mIGV2ZXJ5IG1hdGVyaWFsIHBlciBmcmFtZS5cbiAgICBsZXQgdGV4dHVyZVVuaXRzID0gc2hhZGVyUHJvZ3JhbS5fdGV4dHVyZVVuaXRzT2ZTYW1wbGVycztcbiAgICBpZiAodGV4dHVyZVVuaXRzID09IG51bGwpIHtcbiAgICAgIHRleHR1cmVVbml0cyA9IG5ldyBNYXAoKTtcbiAgICAgIHNoYWRlclByb2dyYW0uX3RleHR1cmVVbml0c09mU2FtcGxlcnMgPSB0ZXh0dXJlVW5pdHM7XG4gICAgfVxuICAgIGNvbnN0IHRleHR1cmVVbml0ID0gdmFsdWVbMF07XG4gICAgaWYgKHRleHR1cmVVbml0cy5nZXQoc2VtYW50aWNTdHIpICE9PSB0ZXh0dXJlVW5pdCkge1xuICAgICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG4gICAgICBjb25zdCBsb2M6IFdlYkdMVW5pZm9ybUxvY2F0aW9uID0gKHNoYWRlclByb2dyYW0gYXMgYW55KVtzZW1hbnRpY1N0cl07XG4gICAgICBnbC51bmlmb3JtMWkobG9jLCB0ZXh0dXJlVW5pdCk7XG4gICAgICB0ZXh0dXJlVW5pdHMuc2V0KHNlbWFudGljU3RyLCB0ZXh0dXJlVW5pdCk7XG4gICAgfVxuICAgIHRoaXMuYmluZFRleHR1cmUoaW5mbywgdmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSB1bmlmb3JtIHZhbHVlIGluIHRoZSBzaGFkZXIgcHJvZ3JhbSB3aXRoIGF1dG9tYXRpYyB0eXBlIGRldGVjdGlvbiBhbmQgY29udmVyc2lvbi5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyB2YXJpb3VzIGNvbXBvc2l0aW9uIHR5cGVzIGluY2x1ZGluZyBtYXRyaWNlcywgdmVjdG9ycywgYW5kIHRleHR1cmVzLlxuICAgKlxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbV8gLSBUaGUgc2hhZGVyIHByb2dyYW0gdG8gc2V0IHRoZSB1bmlmb3JtIGZvclxuICAgKiBAcGFyYW0gc2VtYW50aWNTdHIgLSBUaGUgc2VtYW50aWMgc3RyaW5nIGlkZW50aWZ5aW5nIHRoZSB1bmlmb3JtXG4gICAqIEBwYXJhbSBmaXJzdFRpbWUgLSBXaGV0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgc2V0dGluZyB0aGlzIHVuaWZvcm1cbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHZhbHVlIHRvIHNldCAoY2FuIGJlIHNjYWxhciwgdmVjdG9yLCBtYXRyaXgsIG9yIHRleHR1cmUgZGF0YSlcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdW5pZm9ybSB3YXMgc3VjY2Vzc2Z1bGx5IHNldCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzZXRVbmlmb3JtVmFsdWUoc2hhZGVyUHJvZ3JhbV86IFdlYkdMUHJvZ3JhbSwgc2VtYW50aWNTdHI6IHN0cmluZywgX2ZpcnN0VGltZTogYm9vbGVhbiwgdmFsdWU6IGFueSkge1xuICAgIGNvbnN0IHNoYWRlclByb2dyYW0gPSBzaGFkZXJQcm9ncmFtXyBhcyBSbldlYkdMUHJvZ3JhbTtcbiAgICBjb25zdCBpbmZvID0gc2hhZGVyUHJvZ3JhbS5fc2hhZGVyU2VtYW50aWNzSW5mb01hcC5nZXQoc2VtYW50aWNTdHIpO1xuICAgIGlmIChpbmZvID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgc2V0QXNNYXRyaXggPSBmYWxzZTtcbiAgICBsZXQgY29tcG9uZW50TnVtYmVyID0gMDtcbiAgICBpZiAoaW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5NYXQzKSB7XG4gICAgICBzZXRBc01hdHJpeCA9IHRydWU7XG4gICAgICBjb21wb25lbnROdW1iZXIgPSAzO1xuICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5NYXQ0KSB7XG4gICAgICBzZXRBc01hdHJpeCA9IHRydWU7XG4gICAgICBjb21wb25lbnROdW1iZXIgPSA0O1xuICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5NYXQzQXJyYXkpIHtcbiAgICAgIHNldEFzTWF0cml4ID0gdHJ1ZTtcbiAgICAgIGNvbXBvbmVudE51bWJlciA9IDM7XG4gICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLk1hdDRBcnJheSkge1xuICAgICAgc2V0QXNNYXRyaXggPSB0cnVlO1xuICAgICAgY29tcG9uZW50TnVtYmVyID0gNDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29tcG9uZW50TnVtYmVyID0gaW5mby5jb21wb3NpdGlvblR5cGUhLmdldE51bWJlck9mQ29tcG9uZW50cygpO1xuICAgIH1cblxuICAgIGNvbnN0IGlzQ29tcG9zaXRpb25UeXBlQXJyYXkgPVxuICAgICAgaW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5TY2FsYXJBcnJheSB8fFxuICAgICAgaW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5WZWM0QXJyYXkgfHxcbiAgICAgIGluZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjM0FycmF5IHx8XG4gICAgICBpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlZlYzJBcnJheTtcbiAgICBjb25zdCBpc0NvbXBvc2l0aW9uVHlwZVRleHR1cmUgPSBDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKTtcbiAgICBjb25zdCBrZXkgPSBzZW1hbnRpY1N0cjtcblxuICAgIGxldCB1cGRhdGVkID0gZmFsc2U7XG4gICAgaWYgKGlzQ29tcG9zaXRpb25UeXBlVGV4dHVyZSkge1xuICAgICAgdXBkYXRlZCA9IHRoaXMuc2V0VW5pZm9ybVZhbHVlSW5uZXIoc2hhZGVyUHJvZ3JhbV8sIGtleSwgaW5mbywgc2V0QXNNYXRyaXgsIGNvbXBvbmVudE51bWJlciwgZmFsc2UsIHtcbiAgICAgICAgeDogdmFsdWVbMF0sXG4gICAgICB9KTtcbiAgICAgIHRoaXMuYmluZFRleHR1cmUoaW5mbywgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoaXNDb21wb3NpdGlvblR5cGVBcnJheSkge1xuICAgICAgaWYgKHZhbHVlLl92ID09IG51bGwpIHtcbiAgICAgICAgdXBkYXRlZCA9IHRoaXMuc2V0VW5pZm9ybVZhbHVlSW5uZXIoc2hhZGVyUHJvZ3JhbV8sIGtleSwgaW5mbywgc2V0QXNNYXRyaXgsIGNvbXBvbmVudE51bWJlciwgdHJ1ZSwge1xuICAgICAgICAgIHg6IHZhbHVlLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVwZGF0ZWQgPSB0aGlzLnNldFVuaWZvcm1WYWx1ZUlubmVyKHNoYWRlclByb2dyYW1fLCBrZXksIGluZm8sIHNldEFzTWF0cml4LCBjb21wb25lbnROdW1iZXIsIHRydWUsIHtcbiAgICAgICAgICB4OiB2YWx1ZS5fdixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlNjYWxhcikge1xuICAgICAgaWYgKHZhbHVlLl92ID09IG51bGwpIHtcbiAgICAgICAgdXBkYXRlZCA9IHRoaXMuc2V0VW5pZm9ybVZhbHVlSW5uZXIoc2hhZGVyUHJvZ3JhbV8sIGtleSwgaW5mbywgc2V0QXNNYXRyaXgsIGNvbXBvbmVudE51bWJlciwgZmFsc2UsIHtcbiAgICAgICAgICB4OiB2YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cGRhdGVkID0gdGhpcy5zZXRVbmlmb3JtVmFsdWVJbm5lcihzaGFkZXJQcm9ncmFtXywga2V5LCBpbmZvLCBzZXRBc01hdHJpeCwgY29tcG9uZW50TnVtYmVyLCB0cnVlLCB7XG4gICAgICAgICAgeDogdmFsdWUuX3YsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBDb21wb3NpdGlvblR5cGUuVmVjKnxNYXQqLCB0aGVuLi4uXG4gICAgICBpZiAodmFsdWUuX3YgPT0gbnVsbCkge1xuICAgICAgICB1cGRhdGVkID0gdGhpcy5zZXRVbmlmb3JtVmFsdWVJbm5lcihzaGFkZXJQcm9ncmFtXywga2V5LCBpbmZvLCBzZXRBc01hdHJpeCwgY29tcG9uZW50TnVtYmVyLCBmYWxzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXBkYXRlZCA9IHRoaXMuc2V0VW5pZm9ybVZhbHVlSW5uZXIoc2hhZGVyUHJvZ3JhbV8sIGtleSwgaW5mbywgc2V0QXNNYXRyaXgsIGNvbXBvbmVudE51bWJlciwgdHJ1ZSwge1xuICAgICAgICAgIHg6IHZhbHVlLl92LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdXBkYXRlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyB0ZXh0dXJlcyBhbmQgc2FtcGxlcnMgYmFzZWQgb24gdGhlIGNvbXBvc2l0aW9uIHR5cGUgaW5mb3JtYXRpb24uXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgZGlmZmVyZW50IHRleHR1cmUgdHlwZXMgaW5jbHVkaW5nIDJELCBjdWJlLCBhbmQgdGV4dHVyZSBhcnJheXMuXG4gICAqXG4gICAqIEBwYXJhbSBpbmZvIC0gVGhlIHNoYWRlciBzZW1hbnRpY3MgaW5mbyBjb250YWluaW5nIGNvbXBvc2l0aW9uIHR5cGUgZGV0YWlsc1xuICAgKiBAcGFyYW0gdmFsdWUgLSBBcnJheSBjb250YWluaW5nIHRleHR1cmUgc2xvdCwgdGV4dHVyZSBvYmplY3QsIGFuZCBzYW1wbGVyXG4gICAqL1xuICBiaW5kVGV4dHVyZShpbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvLCB2YWx1ZTogW251bWJlciwgQWJzdHJhY3RUZXh0dXJlLCBTYW1wbGVyXSkge1xuICAgIGlmIChcbiAgICAgIGluZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJEIHx8XG4gICAgICBpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRFNoYWRvd1xuICAgICkge1xuICAgICAgdGhpcy5iaW5kVGV4dHVyZTJEKHZhbHVlWzBdLCB2YWx1ZVsxXS5fdGV4dHVyZVJlc291cmNlVWlkKTtcbiAgICAgIGlmICh2YWx1ZVsyXSAhPSBudWxsKSB7XG4gICAgICAgIC8vIHZhbHVlWzJdIG11c3QgYmUgU2FtcGxlciBvYmplY3RcbiAgICAgICAgdGhpcy5iaW5kVGV4dHVyZVNhbXBsZXIodmFsdWVbMF0sIHZhbHVlWzJdLl9zYW1wbGVyUmVzb3VyY2VVaWQpO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgIHRoaXMuYmluZFRleHR1cmVTYW1wbGVyKHZhbHVlWzBdLCAtMSk7XG4gICAgICAgIC8vIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRCkge1xuICAgICAgICAgIGNvbnN0IHNhbXBsZXJVaWQgPSB0aGlzLmNyZWF0ZU9yR2V0VGV4dHVyZVNhbXBsZXJDbGFtcFRvRWRnZUxpbmVhcigpO1xuICAgICAgICAgIHRoaXMuYmluZFRleHR1cmVTYW1wbGVyKHZhbHVlWzBdLCBzYW1wbGVyVWlkKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRFNoYWRvdykge1xuICAgICAgICAgIGNvbnN0IHNhbXBsZXJVaWQgPSB0aGlzLmNyZWF0ZU9yR2V0VGV4dHVyZVNhbXBsZXJTaGFkb3coKTtcbiAgICAgICAgICB0aGlzLmJpbmRUZXh0dXJlU2FtcGxlcih2YWx1ZVswXSwgc2FtcGxlclVpZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGluZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZUN1YmUpIHtcbiAgICAgIHRoaXMuYmluZFRleHR1cmVDdWJlKHZhbHVlWzBdLCB2YWx1ZVsxXS5fdGV4dHVyZVJlc291cmNlVWlkKTtcbiAgICAgIGlmICh2YWx1ZVsyXSAhPSBudWxsKSB7XG4gICAgICAgIC8vIHZhbHVlWzJdIG11c3QgYmUgU2FtcGxlciBvYmplY3RcbiAgICAgICAgdGhpcy5iaW5kVGV4dHVyZVNhbXBsZXIodmFsdWVbMF0sIHZhbHVlWzJdLl9zYW1wbGVyUmVzb3VyY2VVaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdGhpcy5iaW5kVGV4dHVyZVNhbXBsZXIodmFsdWVbMF0sIC0xKTtcbiAgICAgICAgY29uc3QgdGV4dHVyZUN1YmUgPSB2YWx1ZVsxXSBhcyBDdWJlVGV4dHVyZTtcbiAgICAgICAgLy8gY29uc3Qgc2FtcGxlclVpZCA9IHRoaXMuY3JlYXRlT3JHZXRUZXh0dXJlU2FtcGxlclJlcGVhdFRyaUxpbmVhcigpO1xuICAgICAgICB0aGlzLmJpbmRUZXh0dXJlU2FtcGxlcih2YWx1ZVswXSwgdGV4dHVyZUN1YmUuX3JlY29tbWVuZGVkVGV4dHVyZVNhbXBsZXI/Ll9zYW1wbGVyUmVzb3VyY2VVaWQgPz8gLTEpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkRBcnJheSkge1xuICAgICAgdGhpcy5iaW5kVGV4dHVyZTJEQXJyYXkodmFsdWVbMF0sIHZhbHVlWzFdLl90ZXh0dXJlUmVzb3VyY2VVaWQpO1xuICAgICAgaWYgKHZhbHVlWzJdICE9IG51bGwpIHtcbiAgICAgICAgLy8gdmFsdWVbMl0gbXVzdCBiZSBTYW1wbGVyIG9iamVjdFxuICAgICAgICB0aGlzLmJpbmRUZXh0dXJlU2FtcGxlcih2YWx1ZVswXSwgdmFsdWVbMl0uX3NhbXBsZXJSZXNvdXJjZVVpZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzYW1wbGVyVWlkID0gdGhpcy5jcmVhdGVPckdldFRleHR1cmVTYW1wbGVyQ2xhbXBUb0VkZ2VMaW5lYXIoKTtcbiAgICAgICAgdGhpcy5iaW5kVGV4dHVyZVNhbXBsZXIodmFsdWVbMF0sIHNhbXBsZXJVaWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBtZXRob2QgZm9yIHNldHRpbmcgdW5pZm9ybSB2YWx1ZXMgd2l0aCBwcm9wZXIgV2ViR0wgY2FsbHMgYmFzZWQgb24gZGF0YSB0eXBlLlxuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHRoZSBhY3R1YWwgV2ViR0wgdW5pZm9ybSogY2FsbHMgd2l0aCBhcHByb3ByaWF0ZSB0eXBlIGNvbnZlcnNpb24uXG4gICAqXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIHNoYWRlciBwcm9ncmFtIHRvIHNldCB0aGUgdW5pZm9ybSBmb3JcbiAgICogQHBhcmFtIHNlbWFudGljU3RyIC0gVGhlIHNlbWFudGljIHN0cmluZyBpZGVudGlmeWluZyB0aGUgdW5pZm9ybVxuICAgKiBAcGFyYW0gaW5mbyAtIFRoZSBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uXG4gICAqIEBwYXJhbSBpc01hdHJpeCAtIFdoZXRoZXIgdGhlIHZhbHVlIGlzIGEgbWF0cml4XG4gICAqIEBwYXJhbSBjb21wb25lbnROdW1iZXIgLSBOdW1iZXIgb2YgY29tcG9uZW50cyBpbiB0aGUgdmFsdWVcbiAgICogQHBhcmFtIGlzVmVjdG9yIC0gV2hldGhlciB0aGUgdmFsdWUgaXMgYSB2ZWN0b3IvYXJyYXlcbiAgICogQHBhcmFtIHBhcmFtNiAtIE9iamVjdCBjb250YWluaW5nIHRoZSB2YWx1ZSBjb21wb25lbnRzXG4gICAqIEBwYXJhbSBwYXJhbTYueCAtIFByaW1hcnkgdmFsdWUgY29tcG9uZW50XG4gICAqIEBwYXJhbSBwYXJhbTYueSAtIFNlY29uZCB2YWx1ZSBjb21wb25lbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gcGFyYW02LnogLSBUaGlyZCB2YWx1ZSBjb21wb25lbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gcGFyYW02LncgLSBGb3VydGggdmFsdWUgY29tcG9uZW50IChvcHRpb25hbClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdW5pZm9ybSB3YXMgc3VjY2Vzc2Z1bGx5IHNldCwgZmFsc2UgaWYgbG9jYXRpb24gbm90IGZvdW5kXG4gICAqL1xuICBzZXRVbmlmb3JtVmFsdWVJbm5lcihcbiAgICBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0sXG4gICAgc2VtYW50aWNTdHI6IHN0cmluZyxcbiAgICBpbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvLFxuICAgIGlzTWF0cml4OiBib29sZWFuLFxuICAgIGNvbXBvbmVudE51bWJlcjogbnVtYmVyLFxuICAgIGlzVmVjdG9yOiBib29sZWFuLFxuICAgIHtcbiAgICAgIHgsXG4gICAgICB5LFxuICAgICAgeixcbiAgICAgIHcsXG4gICAgfToge1xuICAgICAgeDogbnVtYmVyIHwgQXJyYXlUeXBlIHwgYm9vbGVhbjtcbiAgICAgIHk/OiBudW1iZXIgfCBib29sZWFuO1xuICAgICAgej86IG51bWJlciB8IGJvb2xlYW47XG4gICAgICB3PzogbnVtYmVyIHwgYm9vbGVhbjtcbiAgICB9XG4gICkge1xuICAgIGNvbnN0IGlkZW50aWZpZXIgPSBzZW1hbnRpY1N0cjtcbiAgICBjb25zdCBsb2M6IFdlYkdMVW5pZm9ybUxvY2F0aW9uID0gKHNoYWRlclByb2dyYW0gYXMgYW55KVtpZGVudGlmaWVyXTtcbiAgICBpZiAobG9jID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgdUxvY2F0aW9uOiBXZWJHTFVuaWZvcm1Mb2NhdGlvbiA9IGxvYztcblxuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dCgpIGFzIGFueTtcblxuICAgIGlmIChpc01hdHJpeCkge1xuICAgICAgaWYgKGNvbXBvbmVudE51bWJlciA9PT0gNCkge1xuICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2KHVMb2NhdGlvbiwgZmFsc2UsIHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDNmdih1TG9jYXRpb24sIGZhbHNlLCB4KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzVmVjdG9yKSB7XG4gICAgICBjb25zdCBjb21wb25lbnRUeXBlID1cbiAgICAgICAgaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCB8fFxuICAgICAgICBpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuU2hvcnQgfHxcbiAgICAgICAgaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJ5dGU7XG4gICAgICBpZiAoY29tcG9uZW50TnVtYmVyID09PSAxKSB7XG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTFpdih1TG9jYXRpb24sIHgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdsLnVuaWZvcm0xZnYodUxvY2F0aW9uLCB4KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjb21wb25lbnROdW1iZXIgPT09IDIpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudFR5cGUpIHtcbiAgICAgICAgICBnbC51bmlmb3JtMml2KHVMb2NhdGlvbiwgeCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTJmdih1TG9jYXRpb24sIHgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNvbXBvbmVudE51bWJlciA9PT0gMykge1xuICAgICAgICBpZiAoY29tcG9uZW50VHlwZSkge1xuICAgICAgICAgIGdsLnVuaWZvcm0zaXYodUxvY2F0aW9uLCB4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBnbC51bmlmb3JtM2Z2KHVMb2NhdGlvbiwgeCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50TnVtYmVyID09PSA0KSB7XG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTRpdih1TG9jYXRpb24sIHgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdsLnVuaWZvcm00ZnYodUxvY2F0aW9uLCB4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjb21wb25lbnRUeXBlID1cbiAgICAgICAgaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCB8fFxuICAgICAgICBpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuU2hvcnQgfHxcbiAgICAgICAgaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJ5dGU7XG4gICAgICBpZiAoY29tcG9uZW50TnVtYmVyID09PSAxKSB7XG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTFpKHVMb2NhdGlvbiwgeCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTFmKHVMb2NhdGlvbiwgeCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50TnVtYmVyID09PSAyKSB7XG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTJpKHVMb2NhdGlvbiwgeCwgeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTJmKHVMb2NhdGlvbiwgeCwgeSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50TnVtYmVyID09PSAzKSB7XG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTNpKHVMb2NhdGlvbiwgeCwgeSwgeik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTNmKHVMb2NhdGlvbiwgeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50TnVtYmVyID09PSA0KSB7XG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTRpKHVMb2NhdGlvbiwgeCwgeSwgeiwgdyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ2wudW5pZm9ybTRmKHVMb2NhdGlvbiwgeCwgeSwgeiwgdyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHZlcnRleCBkYXRhIGZvciByZW5kZXJpbmcgYnkgc2V0dGluZyB1cCBWQU8gd2l0aCBWQk9zIGFuZCBJQk8uXG4gICAqIFRoaXMgbWV0aG9kIGJpbmRzIHZlcnRleCBhcnJheXMsIGluZGV4IGJ1ZmZlcnMsIGFuZCBjb25maWd1cmVzIHZlcnRleCBhdHRyaWJ1dGUgcG9pbnRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBoYW5kbGVzIC0gT2JqZWN0IGNvbnRhaW5pbmcgVkFPLCBJQk8sIGFuZCBWQk8gaGFuZGxlc1xuICAgKiBAcGFyYW0gaGFuZGxlcy52YW9IYW5kbGUgLSBIYW5kbGUgdG8gdGhlIHZlcnRleCBhcnJheSBvYmplY3RcbiAgICogQHBhcmFtIGhhbmRsZXMuaWJvSGFuZGxlIC0gSGFuZGxlIHRvIHRoZSBpbmRleCBidWZmZXIgb2JqZWN0IChvcHRpb25hbClcbiAgICogQHBhcmFtIGhhbmRsZXMudmJvSGFuZGxlcyAtIEFycmF5IG9mIHZlcnRleCBidWZmZXIgb2JqZWN0IGhhbmRsZXNcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgb2JqZWN0IGNvbnRhaW5pbmcgdmVydGV4IGF0dHJpYnV0ZSBpbmZvcm1hdGlvblxuICAgKiBAcGFyYW0gaW5zdGFuY2VJREJ1ZmZlclVpZCAtIEhhbmRsZSB0byBpbnN0YW5jZSBJRCBidWZmZXIgZm9yIGluc3RhbmNlZCByZW5kZXJpbmcgKG9wdGlvbmFsKVxuICAgKiBAdGhyb3dzIEVycm9yIGlmIHJlcXVpcmVkIGJ1ZmZlcnMgYXJlIG5vdCBmb3VuZFxuICAgKi9cbiAgc2V0VmVydGV4RGF0YVRvUGlwZWxpbmUoXG4gICAge1xuICAgICAgdmFvSGFuZGxlLFxuICAgICAgaWJvSGFuZGxlLFxuICAgICAgdmJvSGFuZGxlcyxcbiAgICB9OiB7XG4gICAgICB2YW9IYW5kbGU6IFdlYkdMUmVzb3VyY2VIYW5kbGU7XG4gICAgICBpYm9IYW5kbGU/OiBXZWJHTFJlc291cmNlSGFuZGxlO1xuICAgICAgdmJvSGFuZGxlczogQXJyYXk8V2ViR0xSZXNvdXJjZUhhbmRsZT47XG4gICAgfSxcbiAgICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgICBpbnN0YW5jZUlEQnVmZmVyVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWRcbiAgKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcblxuICAgIGNvbnN0IHZhbyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZSh2YW9IYW5kbGUpIGFzIFdlYkdMVmVydGV4QXJyYXlPYmplY3RPRVM7XG5cbiAgICAvLyBWQU8gYmluZFxuICAgIHRoaXMuX19nbHchLmJpbmRWZXJ0ZXhBcnJheSh2YW8hKTtcblxuICAgIC8vIElCTyBiaW5kXG4gICAgaWYgKGlib0hhbmRsZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBpYm8gPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UoaWJvSGFuZGxlKSBhcyBXZWJHTEJ1ZmZlcjtcbiAgICAgIGlmIChpYm8gIT0gbnVsbCkge1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpYm8pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3RoaW5nIEVsZW1lbnQgQXJyYXkgQnVmZmVyIScpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGJpbmQgdmVydGV4IGF0dHJpYnV0ZXMgdG8gVkJPJ3NcbiAgICB2Ym9IYW5kbGVzLmZvckVhY2goKHZib0hhbmRsZSwgaSkgPT4ge1xuICAgICAgY29uc3QgdmJvID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHZib0hhbmRsZSkgYXMgV2ViR0xCdWZmZXI7XG4gICAgICBpZiAodmJvICE9IG51bGwpIHtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZibyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vdGhpbmcgRWxlbWVudCBBcnJheSBCdWZmZXIgYXQgaW5kZXggJHtpfWApO1xuICAgICAgfVxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoVmVydGV4QXR0cmlidXRlLnRvQXR0cmlidXRlU2xvdEZyb21Kb2luZWRTdHJpbmcocHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljc1tpXSkpO1xuICAgICAgLy8gVGhlIGJpbmRpbmcga2luZCBmb2xsb3dzIHRoZSBzaGFkZXIgaW5wdXQgdHlwZSwgbm90IHRoZSBhY2Nlc3NvciBzdG9yYWdlIHR5cGUuXG4gICAgICAvLyBOb3JtYWxpemVkIGludGVnZXIgYWNjZXNzb3JzIChlLmcuIENPTE9SXzAgYXMgVU5TSUdORURfQllURSBub3JtYWxpemVkKSBmZWVkIGFcbiAgICAgIC8vIGZsb2F0aW5nLXBvaW50IHNoYWRlciBpbnB1dCBhbmQgbXVzdCB1c2UgdmVydGV4QXR0cmliUG9pbnRlci5cbiAgICAgIGNvbnN0IGlzSW50ZWdlclNoYWRlckF0dHJpYnV0ZSA9IFZlcnRleEF0dHJpYnV0ZS5mcm9tU3RyaW5nKFxuICAgICAgICBwcmltaXRpdmUuYXR0cmlidXRlU2VtYW50aWNzW2ldLnNwbGl0KCcuJylbMF1cbiAgICAgICkuaXNJbnRlZ2VyVHlwZTtcbiAgICAgIGlmIChpc0ludGVnZXJTaGFkZXJBdHRyaWJ1dGUpIHtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliSVBvaW50ZXIoXG4gICAgICAgICAgVmVydGV4QXR0cmlidXRlLnRvQXR0cmlidXRlU2xvdEZyb21Kb2luZWRTdHJpbmcocHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljc1tpXSksXG4gICAgICAgICAgcHJpbWl0aXZlLmF0dHJpYnV0ZUNvbXBvc2l0aW9uVHlwZXNbaV0uZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCksXG4gICAgICAgICAgcHJpbWl0aXZlLmF0dHJpYnV0ZUNvbXBvbmVudFR5cGVzW2ldLmluZGV4LFxuICAgICAgICAgIHByaW1pdGl2ZS5hdHRyaWJ1dGVBY2Nlc3NvcnNbaV0uYnl0ZVN0cmlkZSxcbiAgICAgICAgICAwXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKFxuICAgICAgICAgIFZlcnRleEF0dHJpYnV0ZS50b0F0dHJpYnV0ZVNsb3RGcm9tSm9pbmVkU3RyaW5nKHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3NbaV0pLFxuICAgICAgICAgIHByaW1pdGl2ZS5hdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzW2ldLmdldE51bWJlck9mQ29tcG9uZW50cygpLFxuICAgICAgICAgIHByaW1pdGl2ZS5hdHRyaWJ1dGVDb21wb25lbnRUeXBlc1tpXS5pbmRleCxcbiAgICAgICAgICBwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzW2ldLm5vcm1hbGl6ZWQsXG4gICAgICAgICAgcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1tpXS5ieXRlU3RyaWRlLFxuICAgICAgICAgIDBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFNldCBkZWZhdWx0IGludGVnZXIgdmFsdWVzIGZvciBpbnRlZ2VyIGF0dHJpYnV0ZXMgbm90IHByZXNlbnQgaW4gdGhlIHByaW1pdGl2ZS5cbiAgICAvLyBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIFdlYkdMJ3MgZGVmYXVsdCBnZW5lcmljIHZlcnRleCBhdHRyaWJ1dGUgaXMgZmxvYXQgdHlwZSxcbiAgICAvLyB3aGljaCBjYXVzZXMgdHlwZSBtaXNtYXRjaCB3aXRoIGludGVnZXIgc2hhZGVyIGlucHV0cyAodXZlYzQsIGl2ZWM0KS5cbiAgICAvLyBOb3RlOiBkaXNhYmxlVmVydGV4QXR0cmliQXJyYXkgYWxvbmUgZG9lcyBub3QgYXZvaWQgdGhlIHR5cGUgY2hlY2suXG4gICAgZm9yIChjb25zdCBpbnRBdHRyIG9mIFZlcnRleEF0dHJpYnV0ZS5pbnRlZ2VyVHlwZUF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IHNsb3QgPSBpbnRBdHRyLmdldEF0dHJpYnV0ZVNsb3QoKTtcbiAgICAgIGNvbnN0IGhhc0F0dHJpYnV0ZSA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3Muc29tZShcbiAgICAgICAgc2VtYW50aWMgPT4gVmVydGV4QXR0cmlidXRlLnRvQXR0cmlidXRlU2xvdEZyb21Kb2luZWRTdHJpbmcoc2VtYW50aWMpID09PSBzbG90XG4gICAgICApO1xuICAgICAgaWYgKCFoYXNBdHRyaWJ1dGUpIHtcbiAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KHNsb3QpO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJJNHVpKHNsb3QsIDAsIDAsIDAsIDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vLyBmb3IgSW5zdGFuY2VJREJ1ZmZlclxuICAgIGlmIChpbnN0YW5jZUlEQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgY29uc3QgaW5zdGFuY2VJREJ1ZmZlciA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShpbnN0YW5jZUlEQnVmZmVyVWlkKSBhcyBXZWJHTEJ1ZmZlcjtcbiAgICAgIGlmIChpbnN0YW5jZUlEQnVmZmVyICE9IG51bGwpIHtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGluc3RhbmNlSURCdWZmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3RoaW5nIEVsZW1lbnQgQXJyYXkgQnVmZmVyIGF0IGluZGV4Jyk7XG4gICAgICB9XG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShWZXJ0ZXhBdHRyaWJ1dGUuSW5zdGFuY2UuZ2V0QXR0cmlidXRlU2xvdCgpKTtcbiAgICAgIGdsLnZlcnRleEF0dHJpYklQb2ludGVyKFxuICAgICAgICBWZXJ0ZXhBdHRyaWJ1dGUuSW5zdGFuY2UuZ2V0QXR0cmlidXRlU2xvdCgpLFxuICAgICAgICBDb21wb3NpdGlvblR5cGUuVmVjNC5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSxcbiAgICAgICAgQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludC5pbmRleCxcbiAgICAgICAgMCxcbiAgICAgICAgMFxuICAgICAgKTtcbiAgICAgIHRoaXMuX19nbHchLnZlcnRleEF0dHJpYkRpdmlzb3IoVmVydGV4QXR0cmlidXRlLkluc3RhbmNlLmdldEF0dHJpYnV0ZVNsb3QoKSwgMSk7XG4gICAgfVxuXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuICAgIHRoaXMuX19nbHchLmJpbmRWZXJ0ZXhBcnJheShudWxsKTtcblxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgYSBtdWx0aS1kcmF3IGdyb3VwJ3MgVkFPIHdpdGggdGhlIG1lcmdlZCB2ZXJ0ZXggYnVmZmVycywgdGhlIG1lcmdlZFxuICAgKiB1aW50MzIgaW5kZXggYnVmZmVyLCBhbmQgdGhlIHBlci12ZXJ0ZXggaW5zdGFuY2VCYXNlIGF0dHJpYnV0ZSAoZGl2aXNvciAwKS5cbiAgICpcbiAgICogQHBhcmFtIGdyb3VwIC0gVGhlIG11bHRpLWRyYXcgZ3JvdXAgd2hvc2UgdmVydGV4SGFuZGxlcy92ZXJ0aWNlcyBhcmUgYWxyZWFkeSBjcmVhdGVkXG4gICAqL1xuICBzZXRNdWx0aURyYXdWZXJ0ZXhEYXRhVG9QaXBlbGluZShcbiAgICBncm91cDogTXVsdGlEcmF3R3JvdXAsXG4gICAgdmFvSGFuZGxlOiBXZWJHTFJlc291cmNlSGFuZGxlID0gZ3JvdXAudmVydGV4SGFuZGxlcz8udmFvSGFuZGxlID8/IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkLFxuICAgIHVzZU1hdGVyaWFsU2lkQXR0cmlidXRlID0gdHJ1ZVxuICApOiB2b2lkIHtcbiAgICBjb25zdCBoYW5kbGVzID0gZ3JvdXAudmVydGV4SGFuZGxlcztcbiAgICBpZiAoaGFuZGxlcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3QgdmFvID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHZhb0hhbmRsZSkgYXMgV2ViR0xWZXJ0ZXhBcnJheU9iamVjdDtcbiAgICB0aGlzLl9fZ2x3IS5iaW5kVmVydGV4QXJyYXkodmFvKTtcblxuICAgIGlmIChoYW5kbGVzLmlib0hhbmRsZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBpYm8gPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UoaGFuZGxlcy5pYm9IYW5kbGUpIGFzIFdlYkdMQnVmZmVyO1xuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaWJvKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGdyb3VwLmF0dHJpYnV0ZXNbaV07XG4gICAgICBjb25zdCB2Ym8gPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UoaGFuZGxlcy52Ym9IYW5kbGVzW2ldKSBhcyBXZWJHTEJ1ZmZlcjtcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2Ym8pO1xuICAgICAgY29uc3Qgc2xvdCA9IFZlcnRleEF0dHJpYnV0ZS50b0F0dHJpYnV0ZVNsb3RGcm9tSm9pbmVkU3RyaW5nKGF0dHJpYnV0ZS5zZW1hbnRpYyk7XG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzbG90KTtcbiAgICAgIC8vIFNlZSBzZXRWZXJ0ZXhEYXRhVG9QaXBlbGluZTogdGhlIGJpbmRpbmcga2luZCBmb2xsb3dzIHRoZSBzaGFkZXIgaW5wdXQgdHlwZSBzb1xuICAgICAgLy8gbm9ybWFsaXplZCBpbnRlZ2VyIGFjY2Vzc29ycyBjYW4gZmVlZCBmbG9hdGluZy1wb2ludCBzaGFkZXIgaW5wdXRzLlxuICAgICAgaWYgKGF0dHJpYnV0ZS5pc0ludGVnZXJUeXBlKSB7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYklQb2ludGVyKFxuICAgICAgICAgIHNsb3QsXG4gICAgICAgICAgYXR0cmlidXRlLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSxcbiAgICAgICAgICBhdHRyaWJ1dGUuY29tcG9uZW50VHlwZS5pbmRleCxcbiAgICAgICAgICBhdHRyaWJ1dGUuYnl0ZVN0cmlkZSxcbiAgICAgICAgICAwXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKFxuICAgICAgICAgIHNsb3QsXG4gICAgICAgICAgYXR0cmlidXRlLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSxcbiAgICAgICAgICBhdHRyaWJ1dGUuY29tcG9uZW50VHlwZS5pbmRleCxcbiAgICAgICAgICBhdHRyaWJ1dGUubm9ybWFsaXplZCxcbiAgICAgICAgICBhdHRyaWJ1dGUuYnl0ZVN0cmlkZSxcbiAgICAgICAgICAwXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2V0IGRlZmF1bHQgaW50ZWdlciB2YWx1ZXMgZm9yIGludGVnZXIgYXR0cmlidXRlcyBub3QgcHJlc2VudCBpbiB0aGlzIGxheW91dC5cbiAgICBmb3IgKGNvbnN0IGludEF0dHIgb2YgVmVydGV4QXR0cmlidXRlLmludGVnZXJUeXBlQXR0cmlidXRlcykge1xuICAgICAgY29uc3Qgc2xvdCA9IGludEF0dHIuZ2V0QXR0cmlidXRlU2xvdCgpO1xuICAgICAgaWYgKGludEF0dHIgPT09IFZlcnRleEF0dHJpYnV0ZS5JbnN0YW5jZSB8fCBpbnRBdHRyID09PSBWZXJ0ZXhBdHRyaWJ1dGUuTWF0ZXJpYWxTaWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBoYXNBdHRyaWJ1dGUgPSBncm91cC5hdHRyaWJ1dGVzLnNvbWUoXG4gICAgICAgIGF0dHJpYnV0ZSA9PiBWZXJ0ZXhBdHRyaWJ1dGUudG9BdHRyaWJ1dGVTbG90RnJvbUpvaW5lZFN0cmluZyhhdHRyaWJ1dGUuc2VtYW50aWMpID09PSBzbG90XG4gICAgICApO1xuICAgICAgaWYgKCFoYXNBdHRyaWJ1dGUpIHtcbiAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KHNsb3QpO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJJNHVpKHNsb3QsIDAsIDAsIDAsIDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFBlci12ZXJ0ZXggaW5zdGFuY2UgYmFzZSAodWludDMyLCBkaXZpc29yIDApLlxuICAgIGNvbnN0IGluc3RhbmNlQmFzZVZibyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShncm91cC5pbnN0YW5jZUJhc2VWYm9IYW5kbGUhKSBhcyBXZWJHTEJ1ZmZlcjtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgaW5zdGFuY2VCYXNlVmJvKTtcbiAgICBjb25zdCBpbnN0YW5jZVNsb3QgPSBWZXJ0ZXhBdHRyaWJ1dGUuSW5zdGFuY2UuZ2V0QXR0cmlidXRlU2xvdCgpO1xuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGluc3RhbmNlU2xvdCk7XG4gICAgZ2wudmVydGV4QXR0cmliSVBvaW50ZXIoaW5zdGFuY2VTbG90LCAxLCBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50LmluZGV4LCA0LCAwKTtcbiAgICB0aGlzLl9fZ2x3IS52ZXJ0ZXhBdHRyaWJEaXZpc29yKGluc3RhbmNlU2xvdCwgMCk7XG5cbiAgICAvLyBQZXItdmVydGV4IG1hdGVyaWFsU0lEICh1aW50MzIsIGRpdmlzb3IgMCkgb3IgYSBkaXNhYmxlZCBnZW5lcmljIHNsb3QgZm9yXG4gICAgLy8gbWF0ZXJpYWwtb3ZlcnJpZGUgcGFzc2VzLlxuICAgIGNvbnN0IG1hdGVyaWFsU2lkU2xvdCA9IFZlcnRleEF0dHJpYnV0ZS5NYXRlcmlhbFNpZC5nZXRBdHRyaWJ1dGVTbG90KCk7XG4gICAgaWYgKHVzZU1hdGVyaWFsU2lkQXR0cmlidXRlKSB7XG4gICAgICBjb25zdCBtYXRlcmlhbFNpZFZibyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShncm91cC5tYXRlcmlhbFNpZFZib0hhbmRsZSEpIGFzIFdlYkdMQnVmZmVyO1xuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG1hdGVyaWFsU2lkVmJvKTtcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KG1hdGVyaWFsU2lkU2xvdCk7XG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJJUG9pbnRlcihtYXRlcmlhbFNpZFNsb3QsIDEsIENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQuaW5kZXgsIDQsIDApO1xuICAgICAgdGhpcy5fX2dsdyEudmVydGV4QXR0cmliRGl2aXNvcihtYXRlcmlhbFNpZFNsb3QsIDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkobWF0ZXJpYWxTaWRTbG90KTtcbiAgICAgIGdsLnZlcnRleEF0dHJpYkk0dWkobWF0ZXJpYWxTaWRTbG90LCAwLCAwLCAwLCAwKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgbnVsbCk7XG4gICAgdGhpcy5fX2dsdyEuYmluZFZlcnRleEFycmF5KG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSAyRCB0ZXh0dXJlIHdpdGggaW1tdXRhYmxlIHN0b3JhZ2UgdXNpbmcgdGV4U3RvcmFnZTJELlxuICAgKiBUaGlzIG1ldGhvZCBhbGxvY2F0ZXMgdGV4dHVyZSBzdG9yYWdlIHdpdGggdGhlIHNwZWNpZmllZCBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgZm9yIHRleHR1cmUgY3JlYXRpb25cbiAgICogQHBhcmFtIHBhcmFtcy5sZXZlbHMgLSBOdW1iZXIgb2YgbWlwbWFwIGxldmVscyB0byBhbGxvY2F0ZVxuICAgKiBAcGFyYW0gcGFyYW1zLmludGVybmFsRm9ybWF0IC0gSW50ZXJuYWwgZm9ybWF0IG9mIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBwYXJhbXMud2lkdGggLSBXaWR0aCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcGFyYW0gcGFyYW1zLmhlaWdodCAtIEhlaWdodCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcmV0dXJucyBUaGUgaGFuZGxlIG9mIHRoZSBjcmVhdGVkIHRleHR1cmVcbiAgICovXG4gIGNyZWF0ZVRleFN0b3JhZ2UyRCh7XG4gICAgbGV2ZWxzLFxuICAgIGludGVybmFsRm9ybWF0LFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgfToge1xuICAgIGxldmVsczogSW5kZXg7XG4gICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVQYXJhbWV0ZXJFbnVtIHwgUGl4ZWxGb3JtYXRFbnVtO1xuICAgIHdpZHRoOiBTaXplO1xuICAgIGhlaWdodDogU2l6ZTtcbiAgfSk6IFdlYkdMUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3QgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICB0aGlzLl9fZ2x3IS5iaW5kVGV4dHVyZTJEKDE1LCB0ZXh0dXJlISk7XG4gICAgZ2wudGV4U3RvcmFnZTJEKEdMX1RFWFRVUkVfMkQsIGxldmVscywgaW50ZXJuYWxGb3JtYXQuaW5kZXgsIHdpZHRoLCBoZWlnaHQpO1xuICAgIGNvbnN0IHJlc291cmNlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodGV4dHVyZSEpO1xuICAgIHRoaXMuX19nbHchLnVuYmluZFRleHR1cmUyRCgxNSk7XG5cbiAgICByZXR1cm4gcmVzb3VyY2VIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB0ZXh0dXJlIHNhbXBsZXIgd2l0aCB0aGUgc3BlY2lmaWVkIGZpbHRlcmluZyBhbmQgd3JhcHBpbmcgcGFyYW1ldGVycy5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciBzYW1wbGVyIGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXJhbXMubWFnRmlsdGVyIC0gTWFnbmlmaWNhdGlvbiBmaWx0ZXIgbW9kZVxuICAgKiBAcGFyYW0gcGFyYW1zLm1pbkZpbHRlciAtIE1pbmlmaWNhdGlvbiBmaWx0ZXIgbW9kZVxuICAgKiBAcGFyYW0gcGFyYW1zLndyYXBTIC0gV3JhcHBpbmcgbW9kZSBmb3IgUyBjb29yZGluYXRlXG4gICAqIEBwYXJhbSBwYXJhbXMud3JhcFQgLSBXcmFwcGluZyBtb2RlIGZvciBUIGNvb3JkaW5hdGVcbiAgICogQHBhcmFtIHBhcmFtcy53cmFwUiAtIFdyYXBwaW5nIG1vZGUgZm9yIFIgY29vcmRpbmF0ZVxuICAgKiBAcGFyYW0gcGFyYW1zLmFuaXNvdHJvcHkgLSBXaGV0aGVyIHRvIGVuYWJsZSBhbmlzb3Ryb3BpYyBmaWx0ZXJpbmdcbiAgICogQHBhcmFtIHBhcmFtcy5zaGFkb3dDb21wYXJlTW9kZSAtIFdoZXRoZXIgdG8gZW5hYmxlIHNoYWRvdyBjb21wYXJpc29uIG1vZGVcbiAgICogQHJldHVybnMgVGhlIGhhbmRsZSBvZiB0aGUgY3JlYXRlZCBzYW1wbGVyXG4gICAqL1xuICBjcmVhdGVUZXh0dXJlU2FtcGxlcih7XG4gICAgbWFnRmlsdGVyLFxuICAgIG1pbkZpbHRlcixcbiAgICB3cmFwUyxcbiAgICB3cmFwVCxcbiAgICB3cmFwUixcbiAgICBhbmlzb3Ryb3B5LFxuICAgIHNoYWRvd0NvbXBhcmVNb2RlLFxuICB9OiB7XG4gICAgbWFnRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyRW51bTtcbiAgICBtaW5GaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICAgIHdyYXBTOiBUZXh0dXJlUGFyYW1ldGVyRW51bTtcbiAgICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlckVudW07XG4gICAgd3JhcFI6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICAgIGFuaXNvdHJvcHk6IGJvb2xlYW47XG4gICAgc2hhZG93Q29tcGFyZU1vZGU6IGJvb2xlYW47XG4gIH0pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGNvbnN0IHNhbXBsZXIgPSBnbC5jcmVhdGVTYW1wbGVyKCkhO1xuICAgIGNvbnN0IHJlc291cmNlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2Uoc2FtcGxlcik7XG4gICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBtaW5GaWx0ZXIuaW5kZXgpO1xuICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgbWFnRmlsdGVyLmluZGV4KTtcbiAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX1dSQVBfUywgd3JhcFMuaW5kZXgpO1xuICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9ULCB3cmFwVC5pbmRleCk7XG4gICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9XUkFQX1IsIHdyYXBSLmluZGV4KTtcbiAgICBpZiAoc2hhZG93Q29tcGFyZU1vZGUpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfQ09NUEFSRV9NT0RFLCBnbC5DT01QQVJFX1JFRl9UT19URVhUVVJFKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfQ09NUEFSRV9GVU5DLCBnbC5MRVNTKTtcbiAgICB9XG4gICAgaWYgKGFuaXNvdHJvcHkpIHtcbiAgICAgIGlmICh0aGlzLl9fZ2x3IS53ZWJnbDJFeHRURkEpIHtcbiAgICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgdGhpcy5fX2dsdyEud2ViZ2wyRXh0VEZBIS5URVhUVVJFX01BWF9BTklTT1RST1BZX0VYVCwgNCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc291cmNlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgb3IgcmV0dXJucyBhbiBleGlzdGluZyB0ZXh0dXJlIHNhbXBsZXIgd2l0aCBjbGFtcC10by1lZGdlIHdyYXBwaW5nIGFuZCBsaW5lYXIgZmlsdGVyaW5nLlxuICAgKiBUaGlzIG1ldGhvZCBpbXBsZW1lbnRzIGEgc2luZ2xldG9uIHBhdHRlcm4gZm9yIGNvbW1vbmx5IHVzZWQgc2FtcGxlciBjb25maWd1cmF0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGhhbmRsZSBvZiB0aGUgY2xhbXAtdG8tZWRnZSBsaW5lYXIgc2FtcGxlclxuICAgKi9cbiAgY3JlYXRlT3JHZXRUZXh0dXJlU2FtcGxlckNsYW1wVG9FZGdlTGluZWFyKCkge1xuICAgIGlmICh0aGlzLl9fc2FtcGxlckNsYW1wVG9FZGdlTGluZWFyVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICAgIGNvbnN0IHNhbXBsZXIgPSBnbC5jcmVhdGVTYW1wbGVyKCkhO1xuICAgICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShzYW1wbGVyKTtcbiAgICAgIHRoaXMuX19zYW1wbGVyQ2xhbXBUb0VkZ2VMaW5lYXJVaWQgPSByZXNvdXJjZUhhbmRsZTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9SLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fX3NhbXBsZXJDbGFtcFRvRWRnZUxpbmVhclVpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIG9yIHJldHVybnMgYW4gZXhpc3RpbmcgdGV4dHVyZSBzYW1wbGVyIHdpdGggY2xhbXAtdG8tZWRnZSB3cmFwcGluZyBhbmQgbmVhcmVzdCBmaWx0ZXJpbmcuXG4gICAqIFRoaXMgbWV0aG9kIGltcGxlbWVudHMgYSBzaW5nbGV0b24gcGF0dGVybiBmb3IgY29tbW9ubHkgdXNlZCBzYW1wbGVyIGNvbmZpZ3VyYXRpb25zLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaGFuZGxlIG9mIHRoZSBjbGFtcC10by1lZGdlIG5lYXJlc3Qgc2FtcGxlclxuICAgKi9cbiAgY3JlYXRlT3JHZXRUZXh0dXJlU2FtcGxlckNsYW1wVG9FZGdlTmVhcmVzdCgpIHtcbiAgICBpZiAodGhpcy5fX3NhbXBsZXJDbGFtcFRvRWRnZU5lYXJlc3RVaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgICAgY29uc3Qgc2FtcGxlciA9IGdsLmNyZWF0ZVNhbXBsZXIoKSE7XG4gICAgICBjb25zdCByZXNvdXJjZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKHNhbXBsZXIpO1xuICAgICAgdGhpcy5fX3NhbXBsZXJDbGFtcFRvRWRnZU5lYXJlc3RVaWQgPSByZXNvdXJjZUhhbmRsZTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9XUkFQX1IsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9fc2FtcGxlckNsYW1wVG9FZGdlTmVhcmVzdFVpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIG9yIHJldHVybnMgYW4gZXhpc3RpbmcgdGV4dHVyZSBzYW1wbGVyIHdpdGggcmVwZWF0IHdyYXBwaW5nIGFuZCBuZWFyZXN0IGZpbHRlcmluZy5cbiAgICogVGhpcyBtZXRob2QgaW1wbGVtZW50cyBhIHNpbmdsZXRvbiBwYXR0ZXJuIGZvciBjb21tb25seSB1c2VkIHNhbXBsZXIgY29uZmlndXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBoYW5kbGUgb2YgdGhlIHJlcGVhdCBuZWFyZXN0IHNhbXBsZXJcbiAgICovXG4gIGNyZWF0ZU9yR2V0VGV4dHVyZVNhbXBsZXJSZXBlYXROZWFyZXN0KCkge1xuICAgIGlmICh0aGlzLl9fc2FtcGxlclJlcGVhdE5lYXJlc3RVaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgICAgY29uc3Qgc2FtcGxlciA9IGdsLmNyZWF0ZVNhbXBsZXIoKSE7XG4gICAgICBjb25zdCByZXNvdXJjZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKHNhbXBsZXIpO1xuICAgICAgdGhpcy5fX3NhbXBsZXJSZXBlYXROZWFyZXN0VWlkID0gcmVzb3VyY2VIYW5kbGU7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5SRVBFQVQpO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLlJFUEVBVCk7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX1dSQVBfUiwgZ2wuUkVQRUFUKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fX3NhbXBsZXJSZXBlYXROZWFyZXN0VWlkO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgb3IgcmV0dXJucyBhbiBleGlzdGluZyB0ZXh0dXJlIHNhbXBsZXIgd2l0aCByZXBlYXQgd3JhcHBpbmcgYW5kIGxpbmVhciBmaWx0ZXJpbmcuXG4gICAqIFRoaXMgbWV0aG9kIGltcGxlbWVudHMgYSBzaW5nbGV0b24gcGF0dGVybiBmb3IgY29tbW9ubHkgdXNlZCBzYW1wbGVyIGNvbmZpZ3VyYXRpb25zLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaGFuZGxlIG9mIHRoZSByZXBlYXQgbGluZWFyIHNhbXBsZXJcbiAgICovXG4gIGNyZWF0ZU9yR2V0VGV4dHVyZVNhbXBsZXJSZXBlYXRMaW5lYXIoKSB7XG4gICAgaWYgKHRoaXMuX19zYW1wbGVyUmVwZWF0TGluZWFyVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICAgIGNvbnN0IHNhbXBsZXIgPSBnbC5jcmVhdGVTYW1wbGVyKCkhO1xuICAgICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShzYW1wbGVyKTtcbiAgICAgIHRoaXMuX19zYW1wbGVyUmVwZWF0TGluZWFyVWlkID0gcmVzb3VyY2VIYW5kbGU7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLkxJTkVBUik7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuUkVQRUFUKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5SRVBFQVQpO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9XUkFQX1IsIGdsLlJFUEVBVCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19zYW1wbGVyUmVwZWF0TGluZWFyVWlkO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgb3IgcmV0dXJucyBhbiBleGlzdGluZyB0ZXh0dXJlIHNhbXBsZXIgd2l0aCByZXBlYXQgd3JhcHBpbmcgYW5kIHRyaWxpbmVhciBmaWx0ZXJpbmcuXG4gICAqIFRoaXMgbWV0aG9kIGltcGxlbWVudHMgYSBzaW5nbGV0b24gcGF0dGVybiBmb3IgY29tbW9ubHkgdXNlZCBzYW1wbGVyIGNvbmZpZ3VyYXRpb25zLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaGFuZGxlIG9mIHRoZSByZXBlYXQgdHJpbGluZWFyIHNhbXBsZXJcbiAgICovXG4gIGNyZWF0ZU9yR2V0VGV4dHVyZVNhbXBsZXJSZXBlYXRUcmlMaW5lYXIoKSB7XG4gICAgaWYgKHRoaXMuX19zYW1wbGVyUmVwZWF0VHJpTGluZWFyVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICAgIGNvbnN0IHNhbXBsZXIgPSBnbC5jcmVhdGVTYW1wbGVyKCkhO1xuICAgICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShzYW1wbGVyKTtcbiAgICAgIHRoaXMuX19zYW1wbGVyUmVwZWF0VHJpTGluZWFyVWlkID0gcmVzb3VyY2VIYW5kbGU7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLkxJTkVBUl9NSVBNQVBfTElORUFSKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5SRVBFQVQpO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLlJFUEVBVCk7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX1dSQVBfUiwgZ2wuUkVQRUFUKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fX3NhbXBsZXJSZXBlYXRUcmlMaW5lYXJVaWQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBvciByZXR1cm5zIGFuIGV4aXN0aW5nIHRleHR1cmUgc2FtcGxlciBjb25maWd1cmVkIGZvciBzaGFkb3cgbWFwcGluZy5cbiAgICogVGhpcyBzYW1wbGVyIHVzZXMgbmVhcmVzdCBmaWx0ZXJpbmcgYW5kIGVuYWJsZXMgc2hhZG93IGNvbXBhcmlzb24gZnVuY3Rpb25hbGl0eS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGhhbmRsZSBvZiB0aGUgc2hhZG93IHNhbXBsZXJcbiAgICovXG4gIGNyZWF0ZU9yR2V0VGV4dHVyZVNhbXBsZXJTaGFkb3coKSB7XG4gICAgaWYgKHRoaXMuX19zYW1wbGVyU2hhZG93VWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICAgIGNvbnN0IHNhbXBsZXIgPSBnbC5jcmVhdGVTYW1wbGVyKCkhO1xuICAgICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShzYW1wbGVyKTtcbiAgICAgIHRoaXMuX19zYW1wbGVyU2hhZG93VWlkID0gcmVzb3VyY2VIYW5kbGU7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfQ09NUEFSRV9NT0RFLCBnbC5DT01QQVJFX1JFRl9UT19URVhUVVJFKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfQ09NUEFSRV9GVU5DLCBnbC5MRVNTKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fX3NhbXBsZXJTaGFkb3dVaWQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBvciByZXR1cm5zIGFuIGV4aXN0aW5nIHRleHR1cmUgc2FtcGxlciB3aXRoIHJlcGVhdCB3cmFwcGluZywgYW5pc290cm9waWMgZmlsdGVyaW5nLCBhbmQgbGluZWFyIGZpbHRlcmluZy5cbiAgICogVGhpcyBtZXRob2QgaW1wbGVtZW50cyBhIHNpbmdsZXRvbiBwYXR0ZXJuIGZvciBjb21tb25seSB1c2VkIHNhbXBsZXIgY29uZmlndXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBoYW5kbGUgb2YgdGhlIHJlcGVhdCBhbmlzb3Ryb3B5IGxpbmVhciBzYW1wbGVyXG4gICAqL1xuICBjcmVhdGVPckdldFRleHR1cmVTYW1wbGVyUmVwZWF0QW5pc290cm9weUxpbmVhcigpIHtcbiAgICBpZiAodGhpcy5fX3NhbXBsZXJSZXBlYXRBbmlzb3Ryb3B5TGluZWFyVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICAgIGNvbnN0IHNhbXBsZXIgPSBnbC5jcmVhdGVTYW1wbGVyKCkhO1xuICAgICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShzYW1wbGVyKTtcbiAgICAgIHRoaXMuX19zYW1wbGVyUmVwZWF0QW5pc290cm9weUxpbmVhclVpZCA9IHJlc291cmNlSGFuZGxlO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVJfTUlQTUFQX0xJTkVBUik7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuUkVQRUFUKTtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHNhbXBsZXIsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5SRVBFQVQpO1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkoc2FtcGxlciwgZ2wuVEVYVFVSRV9XUkFQX1IsIGdsLlJFUEVBVCk7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaShzYW1wbGVyLCB0aGlzLl9fZ2x3IS53ZWJnbDJFeHRURkEhLlRFWFRVUkVfTUFYX0FOSVNPVFJPUFlfRVhULCA0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fX3NhbXBsZXJSZXBlYXRBbmlzb3Ryb3B5TGluZWFyVWlkO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSAyRCB0ZXh0dXJlIGZyb20gSW1hZ2VCaXRtYXAgZGF0YSB3aXRoIHNwZWNpZmllZCBwYXJhbWV0ZXJzLlxuICAgKiBUaGlzIG1ldGhvZCBhbGxvY2F0ZXMgdGV4dHVyZSBzdG9yYWdlIGFuZCB1cGxvYWRzIHRoZSBpbWFnZSBkYXRhIHRvIHRoZSBHUFUuXG4gICAqXG4gICAqIEBwYXJhbSBpbWFnZURhdGEgLSBUaGUgSW1hZ2VCaXRtYXAgb3IgSW1hZ2VCaXRtYXBTb3VyY2UgZGF0YSB0byB1cGxvYWRcbiAgICogQHBhcmFtIHBhcmFtcyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB0ZXh0dXJlIGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXJhbXMuaW50ZXJuYWxGb3JtYXQgLSBJbnRlcm5hbCBmb3JtYXQgb2YgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIHBhcmFtcy53aWR0aCAtIFdpZHRoIG9mIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBwYXJhbXMuaGVpZ2h0IC0gSGVpZ2h0IG9mIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBwYXJhbXMuZm9ybWF0IC0gUGl4ZWwgZm9ybWF0IG9mIHRoZSBzb3VyY2UgZGF0YVxuICAgKiBAcGFyYW0gcGFyYW1zLnR5cGUgLSBEYXRhIHR5cGUgb2YgdGhlIHNvdXJjZSBkYXRhXG4gICAqIEBwYXJhbSBwYXJhbXMuZ2VuZXJhdGVNaXBtYXAgLSBXaGV0aGVyIHRvIGdlbmVyYXRlIG1pcG1hcHMgYXV0b21hdGljYWxseVxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIGhhbmRsZSBvZiB0aGUgY3JlYXRlZCB0ZXh0dXJlXG4gICAqL1xuICBhc3luYyBjcmVhdGVUZXh0dXJlRnJvbUltYWdlQml0bWFwRGF0YShcbiAgICBpbWFnZURhdGE6IEltYWdlQml0bWFwRGF0YSxcbiAgICB7XG4gICAgICBpbnRlcm5hbEZvcm1hdCxcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgZm9ybWF0LFxuICAgICAgdHlwZSxcbiAgICAgIGdlbmVyYXRlTWlwbWFwLFxuICAgIH06IHtcbiAgICAgIGludGVybmFsRm9ybWF0OiBUZXh0dXJlRm9ybWF0RW51bTtcbiAgICAgIHdpZHRoOiBTaXplO1xuICAgICAgaGVpZ2h0OiBTaXplO1xuICAgICAgZm9ybWF0OiBQaXhlbEZvcm1hdEVudW07XG4gICAgICB0eXBlOiBDb21wb25lbnRUeXBlRW51bTtcbiAgICAgIGdlbmVyYXRlTWlwbWFwOiBib29sZWFuO1xuICAgIH1cbiAgKTogUHJvbWlzZTxXZWJHTFJlc291cmNlSGFuZGxlPiB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcblxuICAgIC8vIE5QT1RcdTMwNkVcdTU4MzRcdTU0MDhcdTMwNkZQT1RcdTMwQjVcdTMwQTRcdTMwQkFcdTMwNkJcdTU5MDlcdTYzREJcbiAgICBsZXQgZmluYWxJbWFnZURhdGE6IEltYWdlQml0bWFwRGF0YSA9IGltYWdlRGF0YTtcbiAgICBsZXQgZmluYWxXaWR0aCA9IHdpZHRoO1xuICAgIGxldCBmaW5hbEhlaWdodCA9IGhlaWdodDtcbiAgICBpZiAoIU1hdGhVdGlsLmlzUG93ZXJPZlR3b1RleHR1cmUod2lkdGgsIGhlaWdodCkgJiYgTWlzY1V0aWwuaXNJT1MoKSkge1xuICAgICAgZmluYWxXaWR0aCA9IERhdGFVdGlsLmdldE5lYXJlc3RQb3dlck9mVHdvKHdpZHRoKTtcbiAgICAgIGZpbmFsSGVpZ2h0ID0gRGF0YVV0aWwuZ2V0TmVhcmVzdFBvd2VyT2ZUd28oaGVpZ2h0KTtcbiAgICAgIGNvbnN0IGNhbnZhcyA9IG5ldyBPZmZzY3JlZW5DYW52YXMoZmluYWxXaWR0aCwgZmluYWxIZWlnaHQpO1xuICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykhO1xuICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZURhdGEsIDAsIDAsIGZpbmFsV2lkdGgsIGZpbmFsSGVpZ2h0KTtcbiAgICAgIGZpbmFsSW1hZ2VEYXRhID0gYXdhaXQgY3JlYXRlSW1hZ2VCaXRtYXAoY2FudmFzKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpIGFzIFJuV2ViR0xUZXh0dXJlO1xuICAgIGNvbnN0IHRleHR1cmVIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlKTtcblxuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlMkQoMTUsIHRleHR1cmUpO1xuICAgIGNvbnN0IGxldmVscyA9IE1hdGguZmxvb3IoTWF0aC5sb2cyKE1hdGgubWF4KGZpbmFsV2lkdGgsIGZpbmFsSGVpZ2h0KSkpICsgMTtcbiAgICBnbC50ZXhTdG9yYWdlMkQoR0xfVEVYVFVSRV8yRCwgbGV2ZWxzLCBpbnRlcm5hbEZvcm1hdC5pbmRleCwgZmluYWxXaWR0aCwgZmluYWxIZWlnaHQpO1xuICAgIGdsLnRleFN1YkltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgMCwgMCwgZm9ybWF0LmluZGV4LCB0eXBlLmluZGV4LCBmaW5hbEltYWdlRGF0YSk7XG5cbiAgICB0aGlzLl9fZ2VuZXJhdGVNaXBtYXBzQW5kVW5iaW5kKGdsLCBmaW5hbFdpZHRoLCBmaW5hbEhlaWdodCwgZ2VuZXJhdGVNaXBtYXApO1xuXG4gICAgcmV0dXJuIHRleHR1cmVIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgaGVscGVyIG1ldGhvZCBmb3IgY29tbW9uIHRleHR1cmUgc2V0dXAgb3BlcmF0aW9ucy5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyBtaXBtYXAgZ2VuZXJhdGlvbiBhbmQgdGV4dHVyZSBwYXJhbWV0ZXIgc2V0dXAuXG4gICAqXG4gICAqIEBwYXJhbSBnbCAtIFRoZSBXZWJHTDIgcmVuZGVyaW5nIGNvbnRleHRcbiAgICogQHBhcmFtIHdpZHRoIC0gV2lkdGggb2YgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIGhlaWdodCAtIEhlaWdodCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcGFyYW0gZ2VuZXJhdGVNaXBtYXAgLSBXaGV0aGVyIHRvIGdlbmVyYXRlIG1pcG1hcHNcbiAgICovXG4gIHByaXZhdGUgX19nZW5lcmF0ZU1pcG1hcHNBbmRVbmJpbmQoXG4gICAgZ2w6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsXG4gICAgX3dpZHRoOiBudW1iZXIsXG4gICAgX2hlaWdodDogbnVtYmVyLFxuICAgIF9nZW5lcmF0ZU1pcG1hcDogYm9vbGVhblxuICApIHtcbiAgICAvLyBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCB3cmFwUy5pbmRleCk7XG4gICAgLy8gZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgd3JhcFQuaW5kZXgpO1xuICAgIC8vIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBtYWdGaWx0ZXIuaW5kZXgpO1xuICAgIC8vIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBtaW5GaWx0ZXIuaW5kZXgpO1xuICAgIC8vIGlmIChpc1ByZW11bHRpcGxpZWRBbHBoYSkge1xuICAgIC8vICAgLy8gZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgLy8gZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIHRydWUpO1xuICAgIC8vIH1cbiAgICAvLyBpZiAoTWF0aFV0aWwuaXNQb3dlck9mVHdvVGV4dHVyZSh3aWR0aCwgaGVpZ2h0KSkge1xuICAgIC8vIGlmIChhbmlzb3Ryb3B5KSB7XG4gICAgLy8gICBpZiAodGhpcy5fX2dsdyEud2ViZ2wyRXh0VEZBKSB7XG4gICAgLy8gICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgdGhpcy5fX2dsdyEud2ViZ2wyRXh0VEZBIS5URVhUVVJFX01BWF9BTklTT1RST1BZX0VYVCwgNCk7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuXG4gICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV8yRCk7XG5cbiAgICB0aGlzLl9fZ2x3IS51bmJpbmRUZXh0dXJlMkQoMTUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSAyRCB0ZXh0dXJlIGZyb20gYW4gSFRNTCBpbWFnZSBlbGVtZW50IHdpdGggc3BlY2lmaWVkIHBhcmFtZXRlcnMuXG4gICAqIFRoaXMgbWV0aG9kIGFsbG9jYXRlcyB0ZXh0dXJlIHN0b3JhZ2UgYW5kIHVwbG9hZHMgdGhlIGltYWdlIGRhdGEgdG8gdGhlIEdQVS5cbiAgICpcbiAgICogQHBhcmFtIGltYWdlRGF0YSAtIFRoZSBIVE1MIGltYWdlIGVsZW1lbnQgY29udGFpbmluZyB0aGUgaW1hZ2UgZGF0YVxuICAgKiBAcGFyYW0gcGFyYW1zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgZm9yIHRleHR1cmUgY3JlYXRpb25cbiAgICogQHBhcmFtIHBhcmFtcy5pbnRlcm5hbEZvcm1hdCAtIEludGVybmFsIGZvcm1hdCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcGFyYW0gcGFyYW1zLndpZHRoIC0gV2lkdGggb2YgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIHBhcmFtcy5oZWlnaHQgLSBIZWlnaHQgb2YgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIHBhcmFtcy5mb3JtYXQgLSBQaXhlbCBmb3JtYXQgb2YgdGhlIHNvdXJjZSBkYXRhXG4gICAqIEBwYXJhbSBwYXJhbXMudHlwZSAtIERhdGEgdHlwZSBvZiB0aGUgc291cmNlIGRhdGFcbiAgICogQHBhcmFtIHBhcmFtcy5nZW5lcmF0ZU1pcG1hcCAtIFdoZXRoZXIgdG8gZ2VuZXJhdGUgbWlwbWFwcyBhdXRvbWF0aWNhbGx5XG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgaGFuZGxlIG9mIHRoZSBjcmVhdGVkIHRleHR1cmVcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVRleHR1cmVGcm9tSFRNTEltYWdlRWxlbWVudChcbiAgICBpbWFnZURhdGE6IEhUTUxJbWFnZUVsZW1lbnQsXG4gICAge1xuICAgICAgaW50ZXJuYWxGb3JtYXQsXG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIGZvcm1hdCxcbiAgICAgIHR5cGUsXG4gICAgICBnZW5lcmF0ZU1pcG1hcCxcbiAgICB9OiB7XG4gICAgICBpbnRlcm5hbEZvcm1hdDogVGV4dHVyZVBhcmFtZXRlckVudW07XG4gICAgICB3aWR0aDogU2l6ZTtcbiAgICAgIGhlaWdodDogU2l6ZTtcbiAgICAgIGZvcm1hdDogUGl4ZWxGb3JtYXRFbnVtO1xuICAgICAgdHlwZTogQ29tcG9uZW50VHlwZUVudW07XG4gICAgICBnZW5lcmF0ZU1pcG1hcDogYm9vbGVhbjtcbiAgICB9XG4gICk6IFByb21pc2U8V2ViR0xSZXNvdXJjZUhhbmRsZT4ge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG5cbiAgICAvLyBOUE9UXHUzMDZFXHU1ODM0XHU1NDA4XHUzMDZGUE9UXHUzMEI1XHUzMEE0XHUzMEJBXHUzMDZCXHU1OTA5XHU2M0RCXHVGRjA4aU9TXHU1NDExXHUzMDUxXHVGRjA5XG4gICAgbGV0IGZpbmFsSW1hZ2VEYXRhOiBJbWFnZUJpdG1hcERhdGEgPSBpbWFnZURhdGE7XG4gICAgbGV0IGZpbmFsV2lkdGggPSB3aWR0aDtcbiAgICBsZXQgZmluYWxIZWlnaHQgPSBoZWlnaHQ7XG4gICAgaWYgKCFNYXRoVXRpbC5pc1Bvd2VyT2ZUd29UZXh0dXJlKHdpZHRoLCBoZWlnaHQpICYmIE1pc2NVdGlsLmlzSU9TKCkpIHtcbiAgICAgIGZpbmFsV2lkdGggPSBEYXRhVXRpbC5nZXROZWFyZXN0UG93ZXJPZlR3byh3aWR0aCk7XG4gICAgICBmaW5hbEhlaWdodCA9IERhdGFVdGlsLmdldE5lYXJlc3RQb3dlck9mVHdvKGhlaWdodCk7XG4gICAgICBjb25zdCBjYW52YXMgPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKGZpbmFsV2lkdGgsIGZpbmFsSGVpZ2h0KTtcbiAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcbiAgICAgIGN0eC5kcmF3SW1hZ2UoaW1hZ2VEYXRhLCAwLCAwLCBmaW5hbFdpZHRoLCBmaW5hbEhlaWdodCk7XG4gICAgICBmaW5hbEltYWdlRGF0YSA9IGF3YWl0IGNyZWF0ZUltYWdlQml0bWFwKGNhbnZhcyk7XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKSBhcyBSbldlYkdMVGV4dHVyZTtcbiAgICBjb25zdCByZXNvdXJjZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKHRleHR1cmUpO1xuXG4gICAgdGhpcy5fX2dsdyEuYmluZFRleHR1cmUyRCgxNSwgdGV4dHVyZSk7XG4gICAgY29uc3QgbGV2ZWxzID0gZ2VuZXJhdGVNaXBtYXAgPyBNYXRoLm1heChNYXRoLmxvZzIoZmluYWxXaWR0aCksIE1hdGgubG9nMihmaW5hbEhlaWdodCkpIDogMTtcbiAgICBnbC50ZXhTdG9yYWdlMkQoR0xfVEVYVFVSRV8yRCwgbGV2ZWxzLCBpbnRlcm5hbEZvcm1hdC5pbmRleCwgZmluYWxXaWR0aCwgZmluYWxIZWlnaHQpO1xuICAgIGdsLnRleFN1YkltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgMCwgMCwgZm9ybWF0LmluZGV4LCB0eXBlLmluZGV4LCBmaW5hbEltYWdlRGF0YSk7XG5cbiAgICB0aGlzLl9fZ2VuZXJhdGVNaXBtYXBzQW5kVW5iaW5kKGdsLCBmaW5hbFdpZHRoLCBmaW5hbEhlaWdodCwgZ2VuZXJhdGVNaXBtYXApO1xuXG4gICAgcmV0dXJuIHJlc291cmNlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSAyRCB0ZXh0dXJlIGFycmF5IHdpdGggc3BlY2lmaWVkIGRpbWVuc2lvbnMgYW5kIGZvcm1hdC5cbiAgICogVGV4dHVyZSBhcnJheXMgYWxsb3cgc3RvcmluZyBtdWx0aXBsZSB0ZXh0dXJlIGxheWVycyBpbiBhIHNpbmdsZSB0ZXh0dXJlIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHdpZHRoIC0gV2lkdGggb2YgZWFjaCB0ZXh0dXJlIGxheWVyXG4gICAqIEBwYXJhbSBoZWlnaHQgLSBIZWlnaHQgb2YgZWFjaCB0ZXh0dXJlIGxheWVyXG4gICAqIEBwYXJhbSBhcnJheUxlbmd0aCAtIE51bWJlciBvZiB0ZXh0dXJlIGxheWVycyBpbiB0aGUgYXJyYXlcbiAgICogQHBhcmFtIG1pcExldmVsQ291bnQgLSBOdW1iZXIgb2YgbWlwbWFwIGxldmVsc1xuICAgKiBAcGFyYW0gaW50ZXJuYWxGb3JtYXQgLSBJbnRlcm5hbCBmb3JtYXQgb2YgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIGZvcm1hdCAtIFBpeGVsIGZvcm1hdCBvZiB0aGUgc291cmNlIGRhdGFcbiAgICogQHBhcmFtIHR5cGUgLSBEYXRhIHR5cGUgb2YgdGhlIHNvdXJjZSBkYXRhXG4gICAqIEBwYXJhbSBpbWFnZURhdGEgLSBUeXBlZCBhcnJheSBjb250YWluaW5nIHRoZSB0ZXh0dXJlIGRhdGFcbiAgICogQHJldHVybnMgVGhlIGhhbmRsZSBvZiB0aGUgY3JlYXRlZCB0ZXh0dXJlIGFycmF5XG4gICAqL1xuICBjcmVhdGVUZXh0dXJlQXJyYXkoXG4gICAgd2lkdGg6IFNpemUsXG4gICAgaGVpZ2h0OiBTaXplLFxuICAgIGFycmF5TGVuZ3RoOiBTaXplLFxuICAgIG1pcExldmVsQ291bnQ6IFNpemUsXG4gICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVGb3JtYXRFbnVtLFxuICAgIGZvcm1hdDogUGl4ZWxGb3JtYXRFbnVtLFxuICAgIHR5cGU6IENvbXBvbmVudFR5cGVFbnVtLFxuICAgIGltYWdlRGF0YTogVHlwZWRBcnJheVxuICApOiBDR0FQSVJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGNvbnN0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCkgYXMgUm5XZWJHTFRleHR1cmU7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlKTtcblxuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlMkRBcnJheSgxNSwgdGV4dHVyZSk7XG4gICAgZ2wudGV4U3RvcmFnZTNEKGdsLlRFWFRVUkVfMkRfQVJSQVksIG1pcExldmVsQ291bnQsIGludGVybmFsRm9ybWF0LmluZGV4LCB3aWR0aCwgaGVpZ2h0LCBhcnJheUxlbmd0aCk7XG5cbiAgICBmb3IgKGxldCBsYXllciA9IDA7IGxheWVyIDwgYXJyYXlMZW5ndGg7IGxheWVyKyspIHtcbiAgICAgIGdsLnRleFN1YkltYWdlM0QoXG4gICAgICAgIGdsLlRFWFRVUkVfMkRfQVJSQVksXG4gICAgICAgIDAsIC8vIE1pcG1hcCBMZXZlbFxuICAgICAgICAwLCAvLyB4IE9mZnNldFxuICAgICAgICAwLCAvLyB5IE9mZnNldFxuICAgICAgICBsYXllciwgLy8geiBPZmZzZXRcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgMSwgLy8gZGVwdGhcbiAgICAgICAgZm9ybWF0LmluZGV4LFxuICAgICAgICB0eXBlLmluZGV4LFxuICAgICAgICBpbWFnZURhdGFcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2dsdyEudW5iaW5kVGV4dHVyZTJEQXJyYXkoMTUpO1xuXG4gICAgcmV0dXJuIHJlc291cmNlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG9jYXRlcyB0ZXh0dXJlIHN0b3JhZ2Ugd2l0aG91dCB1cGxvYWRpbmcgYW55IGltYWdlIGRhdGEuXG4gICAqIFRoaXMgbWV0aG9kIGNyZWF0ZXMgYW4gZW1wdHkgdGV4dHVyZSB3aXRoIHRoZSBzcGVjaWZpZWQgZm9ybWF0IGFuZCBkaW1lbnNpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgZm9yIHRleHR1cmUgYWxsb2NhdGlvblxuICAgKiBAcGFyYW0gcGFyYW1zLmZvcm1hdCAtIEludGVybmFsIGZvcm1hdCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcGFyYW0gcGFyYW1zLndpZHRoIC0gV2lkdGggb2YgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIHBhcmFtcy5oZWlnaHQgLSBIZWlnaHQgb2YgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIHBhcmFtcy5taXBMZXZlbENvdW50IC0gTnVtYmVyIG9mIG1pcG1hcCBsZXZlbHMgdG8gYWxsb2NhdGVcbiAgICogQHJldHVybnMgVGhlIGhhbmRsZSBvZiB0aGUgYWxsb2NhdGVkIHRleHR1cmVcbiAgICovXG4gIGFsbG9jYXRlVGV4dHVyZSh7XG4gICAgZm9ybWF0LFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBtaXBMZXZlbENvdW50LFxuICB9OiB7XG4gICAgZm9ybWF0OiBUZXh0dXJlRm9ybWF0RW51bTtcbiAgICB3aWR0aDogU2l6ZTtcbiAgICBoZWlnaHQ6IFNpemU7XG4gICAgbWlwTGV2ZWxDb3VudDogQ291bnQ7XG4gIH0pOiBXZWJHTFJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGNvbnN0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCkgYXMgUm5XZWJHTFRleHR1cmU7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlKTtcblxuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlMkQoMTUsIHRleHR1cmUpO1xuICAgIGdsLnRleFN0b3JhZ2UyRChHTF9URVhUVVJFXzJELCBtaXBMZXZlbENvdW50LCBmb3JtYXQuaW5kZXgsIHdpZHRoLCBoZWlnaHQpO1xuICAgIHRoaXMuX19nbHchLnVuYmluZFRleHR1cmUyRCgxNSk7XG5cbiAgICByZXR1cm4gcmVzb3VyY2VIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgaW1hZ2UgZGF0YSB0byBhIHNwZWNpZmljIG1pcCBsZXZlbCBvZiBhbiBleGlzdGluZyAyRCB0ZXh0dXJlLlxuICAgKiBUaGlzIG1ldGhvZCBzdXBwb3J0cyB1cGxvYWRpbmcgZGF0YSB3aXRoIHJvdyBwYWRkaW5nLCBleHRyYWN0aW5nIG9ubHkgdGhlIHJlbGV2YW50IHBpeGVscy5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciBpbWFnZSBsb2FkaW5nXG4gICAqIEBwYXJhbSBwYXJhbXMubWlwTGV2ZWwgLSBUaGUgbWlwIGxldmVsIHRvIGxvYWQgdGhlIGltYWdlIHRvXG4gICAqIEBwYXJhbSBwYXJhbXMudGV4dHVyZVVpZCAtIFRoZSBoYW5kbGUgb2YgdGhlIHRhcmdldCB0ZXh0dXJlXG4gICAqIEBwYXJhbSBwYXJhbXMuZm9ybWF0IC0gVGhlIGZvcm1hdCBvZiB0aGUgaW1hZ2VcbiAgICogQHBhcmFtIHBhcmFtcy50eXBlIC0gVGhlIGRhdGEgdHlwZSBvZiB0aGUgaW1hZ2VcbiAgICogQHBhcmFtIHBhcmFtcy54T2Zmc2V0IC0gWCBvZmZzZXQgb2YgdGhlIGNvcHkgcmVnaW9uXG4gICAqIEBwYXJhbSBwYXJhbXMueU9mZnNldCAtIFkgb2Zmc2V0IG9mIHRoZSBjb3B5IHJlZ2lvblxuICAgKiBAcGFyYW0gcGFyYW1zLndpZHRoIC0gV2lkdGggb2YgdGhlIGltYWdlIHRvIGNvcHlcbiAgICogQHBhcmFtIHBhcmFtcy5oZWlnaHQgLSBIZWlnaHQgb2YgdGhlIGltYWdlIHRvIGNvcHlcbiAgICogQHBhcmFtIHBhcmFtcy5yb3dTaXplQnlQaXhlbCAtIFNpemUgb2YgZWFjaCByb3cgaW4gcGl4ZWxzIChpbmNsdWRpbmcgcGFkZGluZylcbiAgICogQHBhcmFtIHBhcmFtcy5kYXRhIC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIGltYWdlIGRhdGFcbiAgICovXG4gIGxvYWRJbWFnZVRvTWlwTGV2ZWxPZlRleHR1cmUyRCh7XG4gICAgbWlwTGV2ZWwsXG4gICAgdGV4dHVyZVVpZCxcbiAgICBmb3JtYXQsXG4gICAgdHlwZSxcbiAgICB4T2Zmc2V0LFxuICAgIHlPZmZzZXQsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIHJvd1NpemVCeVBpeGVsLFxuICAgIGRhdGEsXG4gIH06IHtcbiAgICBtaXBMZXZlbDogSW5kZXg7XG4gICAgdGV4dHVyZVVpZDogV2ViR0xSZXNvdXJjZUhhbmRsZTtcbiAgICBmb3JtYXQ6IFRleHR1cmVGb3JtYXRFbnVtO1xuICAgIHR5cGU6IENvbXBvbmVudFR5cGVFbnVtO1xuICAgIHhPZmZzZXQ6IG51bWJlcjtcbiAgICB5T2Zmc2V0OiBudW1iZXI7XG4gICAgd2lkdGg6IG51bWJlcjtcbiAgICBoZWlnaHQ6IG51bWJlcjtcbiAgICByb3dTaXplQnlQaXhlbDogbnVtYmVyO1xuICAgIGRhdGE6IFR5cGVkQXJyYXk7XG4gIH0pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UodGV4dHVyZVVpZCkgYXMgUm5XZWJHTFRleHR1cmU7XG4gICAgY29uc3QgcGl4ZWxGb3JtYXQgPSBUZXh0dXJlRm9ybWF0LmdldFBpeGVsRm9ybWF0RnJvbVRleHR1cmVGb3JtYXQoZm9ybWF0KTtcbiAgICBjb25zdCBjb21wb3NpdGlvbk51bSA9IFBpeGVsRm9ybWF0LmdldENvbXBvc2l0aW9uTnVtRnJvbVBpeGVsRm9ybWF0KHBpeGVsRm9ybWF0KTtcblxuICAgIGNvbnN0IHJlZHVjZWREYXRhID0gbmV3IChkYXRhLmNvbnN0cnVjdG9yIGFzIGFueSkod2lkdGggKiBoZWlnaHQgKiBjb21wb3NpdGlvbk51bSk7XG5cbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG4gICAgICBjb25zdCBzcmNPZmZzZXQgPSB5ICogcm93U2l6ZUJ5UGl4ZWwgKiBjb21wb3NpdGlvbk51bTtcbiAgICAgIGNvbnN0IGRlc3RPZmZzZXQgPSB5ICogd2lkdGggKiBjb21wb3NpdGlvbk51bTtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xuICAgICAgICByZWR1Y2VkRGF0YS5zZXQoXG4gICAgICAgICAgZGF0YS5zdWJhcnJheShzcmNPZmZzZXQgKyB4ICogY29tcG9zaXRpb25OdW0sIHNyY09mZnNldCArICh4ICsgMSkgKiBjb21wb3NpdGlvbk51bSksXG4gICAgICAgICAgZGVzdE9mZnNldCArIHggKiBjb21wb3NpdGlvbk51bVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlMkQoMTUsIHRleHR1cmUpO1xuICAgIGdsLnRleFN1YkltYWdlMkQoXG4gICAgICBnbC5URVhUVVJFXzJELFxuICAgICAgbWlwTGV2ZWwsXG4gICAgICB4T2Zmc2V0LFxuICAgICAgeU9mZnNldCxcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgcGl4ZWxGb3JtYXQuaW5kZXgsXG4gICAgICB0eXBlLmluZGV4LFxuICAgICAgcmVkdWNlZERhdGFcbiAgICApO1xuICAgIHRoaXMuX19nbHchLnVuYmluZFRleHR1cmUyRCgxNSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIDJEIHRleHR1cmUgZnJvbSBhIHR5cGVkIGFycmF5IHdpdGggc3BlY2lmaWVkIHBhcmFtZXRlcnMuXG4gICAqIFRoaXMgbWV0aG9kIGlzIHVzZWZ1bCBmb3IgY3JlYXRpbmcgdGV4dHVyZXMgZnJvbSByYXcgcGl4ZWwgZGF0YS5cbiAgICpcbiAgICogQHBhcmFtIGltYWdlRGF0YSAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBwaXhlbCBkYXRhXG4gICAqIEBwYXJhbSBwYXJhbXMgLSBDb25maWd1cmF0aW9uIG9iamVjdCBmb3IgdGV4dHVyZSBjcmVhdGlvblxuICAgKiBAcGFyYW0gcGFyYW1zLmludGVybmFsRm9ybWF0IC0gSW50ZXJuYWwgZm9ybWF0IG9mIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBwYXJhbXMud2lkdGggLSBXaWR0aCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcGFyYW0gcGFyYW1zLmhlaWdodCAtIEhlaWdodCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcGFyYW0gcGFyYW1zLmZvcm1hdCAtIFBpeGVsIGZvcm1hdCBvZiB0aGUgc291cmNlIGRhdGFcbiAgICogQHBhcmFtIHBhcmFtcy50eXBlIC0gRGF0YSB0eXBlIG9mIHRoZSBzb3VyY2UgZGF0YVxuICAgKiBAcGFyYW0gcGFyYW1zLmdlbmVyYXRlTWlwbWFwIC0gV2hldGhlciB0byBnZW5lcmF0ZSBtaXBtYXBzIGF1dG9tYXRpY2FsbHlcbiAgICogQHJldHVybnMgVGhlIGhhbmRsZSBvZiB0aGUgY3JlYXRlZCB0ZXh0dXJlXG4gICAqL1xuICBjcmVhdGVUZXh0dXJlRnJvbVR5cGVkQXJyYXkoXG4gICAgaW1hZ2VEYXRhOiBUeXBlZEFycmF5LFxuICAgIHtcbiAgICAgIGludGVybmFsRm9ybWF0LFxuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBmb3JtYXQsXG4gICAgICB0eXBlLFxuICAgICAgZ2VuZXJhdGVNaXBtYXAsXG4gICAgfToge1xuICAgICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVGb3JtYXRFbnVtO1xuICAgICAgd2lkdGg6IFNpemU7XG4gICAgICBoZWlnaHQ6IFNpemU7XG4gICAgICBmb3JtYXQ6IFBpeGVsRm9ybWF0RW51bTtcbiAgICAgIHR5cGU6IENvbXBvbmVudFR5cGVFbnVtO1xuICAgICAgZ2VuZXJhdGVNaXBtYXA6IGJvb2xlYW47XG4gICAgfVxuICApOiBXZWJHTFJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGNvbnN0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCkgYXMgUm5XZWJHTFRleHR1cmU7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlKTtcblxuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlMkQoMTUsIHRleHR1cmUpO1xuICAgIGNvbnN0IGxldmVscyA9IGdlbmVyYXRlTWlwbWFwID8gTWF0aC5tYXgoTWF0aC5sb2cyKHdpZHRoKSwgTWF0aC5sb2cyKGhlaWdodCkpIDogMTtcbiAgICBnbC50ZXhTdG9yYWdlMkQoR0xfVEVYVFVSRV8yRCwgbGV2ZWxzLCBpbnRlcm5hbEZvcm1hdC5pbmRleCwgd2lkdGgsIGhlaWdodCk7XG4gICAgZ2wudGV4U3ViSW1hZ2UyRChcbiAgICAgIGdsLlRFWFRVUkVfMkQsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIGZvcm1hdC5pbmRleCxcbiAgICAgIHR5cGUuaW5kZXgsXG4gICAgICBpbWFnZURhdGEgYXMgYW55IGFzIEFycmF5QnVmZmVyVmlld1xuICAgICk7XG5cbiAgICB0aGlzLl9fZ2VuZXJhdGVNaXBtYXBzQW5kVW5iaW5kKGdsLCB3aWR0aCwgaGVpZ2h0LCBnZW5lcmF0ZU1pcG1hcCk7XG5cbiAgICByZXR1cm4gcmVzb3VyY2VIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGNvbXByZXNzZWQgdGV4dHVyZSBmcm9tIHByZS10cmFuc2NvZGVkIHRleHR1cmUgZGF0YSBmb3IgbXVsdGlwbGUgbWlwIGxldmVscy5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyB2YXJpb3VzIGNvbXByZXNzZWQgdGV4dHVyZSBmb3JtYXRzIGFuZCB1cGxvYWRzIHRoZSBkYXRhIHRvIEdQVS5cbiAgICpcbiAgICogQHBhcmFtIHRleHR1cmVEYXRhQXJyYXkgLSBBcnJheSBvZiB0ZXh0dXJlIGRhdGEgZm9yIGVhY2ggbWlwbWFwIGxldmVsXG4gICAqIEBwYXJhbSBjb21wcmVzc2lvblRleHR1cmVUeXBlIC0gVGhlIGNvbXByZXNzaW9uIGZvcm1hdCB0eXBlIChlLmcuLCBEWFQsIEVUQywgQVNUQylcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBoYW5kbGUgb2YgdGhlIGNyZWF0ZWQgY29tcHJlc3NlZCB0ZXh0dXJlXG4gICAqL1xuICBhc3luYyBjcmVhdGVDb21wcmVzc2VkVGV4dHVyZShcbiAgICB0ZXh0dXJlRGF0YUFycmF5OiBUZXh0dXJlRGF0YVtdLFxuICAgIGNvbXByZXNzaW9uVGV4dHVyZVR5cGU6IENvbXByZXNzaW9uVGV4dHVyZVR5cGVFbnVtXG4gICk6IFByb21pc2U8V2ViR0xSZXNvdXJjZUhhbmRsZT4ge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dCgpO1xuXG4gICAgY29uc3QgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKSBhcyBSbldlYkdMVGV4dHVyZTtcbiAgICBjb25zdCByZXNvdXJjZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKHRleHR1cmUpO1xuXG4gICAgdGhpcy5fX2dsdyEuYmluZFRleHR1cmUyRCgxNSwgdGV4dHVyZSk7XG5cbiAgICBjb25zdCBpbnRlcm5hbEZvcm1hdCA9IGNvbXByZXNzaW9uVGV4dHVyZVR5cGUuaW5kZXg7XG5cbiAgICBmb3IgKGNvbnN0IHRleHR1cmVEYXRhIG9mIHRleHR1cmVEYXRhQXJyYXkpIHtcbiAgICAgIGdsLmNvbXByZXNzZWRUZXhJbWFnZTJEKFxuICAgICAgICBnbC5URVhUVVJFXzJELFxuICAgICAgICB0ZXh0dXJlRGF0YS5sZXZlbCxcbiAgICAgICAgaW50ZXJuYWxGb3JtYXQsXG4gICAgICAgIHRleHR1cmVEYXRhLndpZHRoLFxuICAgICAgICB0ZXh0dXJlRGF0YS5oZWlnaHQsXG4gICAgICAgIDAsXG4gICAgICAgIHRleHR1cmVEYXRhLmJ1ZmZlclxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fZ2x3IS51bmJpbmRUZXh0dXJlMkQoMTUpO1xuXG4gICAgcmV0dXJuIHJlc291cmNlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjb21wcmVzc2VkIHRleHR1cmUgZnJvbSBhIEJhc2lzIFVuaXZlcnNhbCBmaWxlLlxuICAgKiBUaGlzIG1ldGhvZCBhdXRvbWF0aWNhbGx5IGRldGVjdHMgdGhlIGJlc3QgY29tcHJlc3Npb24gZm9ybWF0IHN1cHBvcnRlZCBieSB0aGUgaGFyZHdhcmVcbiAgICogYW5kIHRyYW5zY29kZXMgdGhlIEJhc2lzIGZpbGUgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNpc0ZpbGUgLSBUaGUgQmFzaXMgVW5pdmVyc2FsIGZpbGUgY29udGFpbmluZyB0aGUgY29tcHJlc3NlZCB0ZXh0dXJlIGRhdGFcbiAgICogQHBhcmFtIHBhcmFtcyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB0ZXh0dXJlIGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXJhbXMuYm9yZGVyIC0gQm9yZGVyIHdpZHRoIChtdXN0IGJlIDAgaW4gV2ViR0wpXG4gICAqIEByZXR1cm5zIFRoZSBoYW5kbGUgb2YgdGhlIGNyZWF0ZWQgY29tcHJlc3NlZCB0ZXh0dXJlXG4gICAqL1xuICBjcmVhdGVDb21wcmVzc2VkVGV4dHVyZUZyb21CYXNpcyhcbiAgICBiYXNpc0ZpbGU6IEJhc2lzRmlsZSxcbiAgICB7XG4gICAgICBib3JkZXIsXG4gICAgfToge1xuICAgICAgYm9yZGVyOiBTaXplO1xuICAgIH1cbiAgKTogV2ViR0xSZXNvdXJjZUhhbmRsZSB7XG4gICAgbGV0IGJhc2lzQ29tcHJlc3Npb25UeXBlOiBCYXNpc0NvbXByZXNzaW9uVHlwZUVudW07XG4gICAgbGV0IGNvbXByZXNzaW9uVHlwZTogSW5kZXg7XG5cbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcbiAgICBjb25zdCB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpIGFzIFJuV2ViR0xUZXh0dXJlO1xuICAgIGNvbnN0IHJlc291cmNlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodGV4dHVyZSk7XG5cbiAgICB0aGlzLl9fZ2x3IS5iaW5kVGV4dHVyZTJEKDE1LCB0ZXh0dXJlKTtcblxuICAgIGNvbnN0IHMzdGMgPSBnbC5nZXRFeHRlbnNpb24oJ1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9zM3RjJyk7XG4gICAgaWYgKHMzdGMpIHtcbiAgICAgIGJhc2lzQ29tcHJlc3Npb25UeXBlID0gQmFzaXNDb21wcmVzc2lvblR5cGUuQkMzO1xuICAgICAgY29tcHJlc3Npb25UeXBlID0gczN0Yy5DT01QUkVTU0VEX1JHQkFfUzNUQ19EWFQ1X0VYVDtcbiAgICB9XG4gICAgY29uc3QgZXRjMSA9IGdsLmdldEV4dGVuc2lvbignV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2V0YzEnKTtcbiAgICBpZiAoZXRjMSkge1xuICAgICAgYmFzaXNDb21wcmVzc2lvblR5cGUgPSBCYXNpc0NvbXByZXNzaW9uVHlwZS5FVEMxO1xuICAgICAgY29tcHJlc3Npb25UeXBlID0gZXRjMS5DT01QUkVTU0VEX1JHQl9FVEMxX1dFQkdMO1xuICAgIH1cbiAgICBjb25zdCBhdGMgPSBnbC5nZXRFeHRlbnNpb24oJ1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9hdGMnKTtcbiAgICBpZiAoYXRjKSB7XG4gICAgICBiYXNpc0NvbXByZXNzaW9uVHlwZSA9IEJhc2lzQ29tcHJlc3Npb25UeXBlLkFUQ19SR0JBO1xuICAgICAgY29tcHJlc3Npb25UeXBlID0gYXRjLkNPTVBSRVNTRURfUkdCQV9BVENfSU5URVJQT0xBVEVEX0FMUEhBX1dFQkdMO1xuICAgIH1cbiAgICBjb25zdCBldGMyID0gZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfZXRjJyk7XG4gICAgaWYgKGV0YzIpIHtcbiAgICAgIGJhc2lzQ29tcHJlc3Npb25UeXBlID0gQmFzaXNDb21wcmVzc2lvblR5cGUuRVRDMjtcbiAgICAgIGNvbXByZXNzaW9uVHlwZSA9IGV0YzIuQ09NUFJFU1NFRF9SR0JBOF9FVEMyX0VBQztcbiAgICB9XG4gICAgY29uc3QgcHZydGMgPVxuICAgICAgZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfcHZydGMnKSB8fCBnbC5nZXRFeHRlbnNpb24oJ1dFQktJVF9XRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfcHZydGMnKTtcbiAgICBpZiAocHZydGMpIHtcbiAgICAgIGJhc2lzQ29tcHJlc3Npb25UeXBlID0gQmFzaXNDb21wcmVzc2lvblR5cGUuUFZSVEMxX1JHQkE7XG4gICAgICBjb21wcmVzc2lvblR5cGUgPSBwdnJ0Yy5DT01QUkVTU0VEX1JHQkFfUFZSVENfNEJQUFYxX0lNRztcbiAgICB9XG4gICAgY29uc3QgYXN0YyA9IGdsLmdldEV4dGVuc2lvbignV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2FzdGMnKTtcbiAgICBpZiAoYXN0Yykge1xuICAgICAgYmFzaXNDb21wcmVzc2lvblR5cGUgPSBCYXNpc0NvbXByZXNzaW9uVHlwZS5BU1RDO1xuICAgICAgY29tcHJlc3Npb25UeXBlID0gYXN0Yy5DT01QUkVTU0VEX1JHQkFfQVNUQ180eDRfS0hSO1xuICAgIH1cbiAgICBjb25zdCBtaXBtYXBEZXB0aCA9IGJhc2lzRmlsZS5nZXROdW1MZXZlbHMoMCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1pcG1hcERlcHRoOyBpKyspIHtcbiAgICAgIGNvbnN0IHdpZHRoID0gYmFzaXNGaWxlLmdldEltYWdlV2lkdGgoMCwgaSk7XG4gICAgICBjb25zdCBoZWlnaHQgPSBiYXNpc0ZpbGUuZ2V0SW1hZ2VIZWlnaHQoMCwgaSk7XG4gICAgICBjb25zdCB0ZXh0dXJlU291cmNlID0gdGhpcy5kZWNvZGVCYXNpc0ltYWdlKGJhc2lzRmlsZSwgYmFzaXNDb21wcmVzc2lvblR5cGUhLCAwLCBpKTtcbiAgICAgIGdsLmNvbXByZXNzZWRUZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIGksIGNvbXByZXNzaW9uVHlwZSEsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgdGV4dHVyZVNvdXJjZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2dsdyEudW5iaW5kVGV4dHVyZTJEKDE1KTtcblxuICAgIHJldHVybiByZXNvdXJjZUhhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNvZGVzIGEgc3BlY2lmaWMgaW1hZ2UgYW5kIG1pcCBsZXZlbCBmcm9tIGEgQmFzaXMgVW5pdmVyc2FsIGZpbGUgdG8gdGhlIHRhcmdldCBjb21wcmVzc2lvbiBmb3JtYXQuXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgdGhlIHRyYW5zY29kaW5nIHByb2Nlc3MgZnJvbSBCYXNpcyBmb3JtYXQgdG8gaGFyZHdhcmUtc3BlY2lmaWMgZm9ybWF0cy5cbiAgICpcbiAgICogQHBhcmFtIGJhc2lzRmlsZSAtIFRoZSBCYXNpcyBVbml2ZXJzYWwgZmlsZSBjb250YWluaW5nIHRoZSB0ZXh0dXJlIGRhdGFcbiAgICogQHBhcmFtIGJhc2lzQ29tcHJlc3Npb25UeXBlIC0gVGhlIHRhcmdldCBjb21wcmVzc2lvbiBmb3JtYXQgdG8gdHJhbnNjb2RlIHRvXG4gICAqIEBwYXJhbSBpbWFnZUluZGV4IC0gSW5kZXggb2YgdGhlIGltYWdlIHRvIGRlY29kZSAoZm9yIHRleHR1cmUgYXJyYXlzKVxuICAgKiBAcGFyYW0gbGV2ZWxJbmRleCAtIE1pcCBsZXZlbCBpbmRleCB0byBkZWNvZGVcbiAgICogQHJldHVybnMgVWludDhBcnJheSBjb250YWluaW5nIHRoZSB0cmFuc2NvZGVkIHRleHR1cmUgZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBkZWNvZGVCYXNpc0ltYWdlKFxuICAgIGJhc2lzRmlsZTogQmFzaXNGaWxlLFxuICAgIGJhc2lzQ29tcHJlc3Npb25UeXBlOiBCYXNpc0NvbXByZXNzaW9uVHlwZUVudW0sXG4gICAgaW1hZ2VJbmRleDogSW5kZXgsXG4gICAgbGV2ZWxJbmRleDogSW5kZXhcbiAgKSB7XG4gICAgY29uc3QgZXh0cmFjdFNpemUgPSBiYXNpc0ZpbGUuZ2V0SW1hZ2VUcmFuc2NvZGVkU2l6ZUluQnl0ZXMoaW1hZ2VJbmRleCwgbGV2ZWxJbmRleCwgYmFzaXNDb21wcmVzc2lvblR5cGUhLmluZGV4KTtcbiAgICBjb25zdCB0ZXh0dXJlU291cmNlID0gbmV3IFVpbnQ4QXJyYXkoZXh0cmFjdFNpemUpO1xuICAgIGlmICghYmFzaXNGaWxlLnRyYW5zY29kZUltYWdlKHRleHR1cmVTb3VyY2UsIGltYWdlSW5kZXgsIGxldmVsSW5kZXgsIGJhc2lzQ29tcHJlc3Npb25UeXBlIS5pbmRleCwgMCwgMCkpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdmYWlsZWQgdG8gdHJhbnNjb2RlIHRoZSBpbWFnZS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHR1cmVTb3VyY2U7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBmcmFtZWJ1ZmZlciBvYmplY3QgZm9yIG9mZi1zY3JlZW4gcmVuZGVyaW5nLlxuICAgKiBGcmFtZWJ1ZmZlcnMgYXJlIHVzZWQgZm9yIHJlbmRlci10by10ZXh0dXJlIG9wZXJhdGlvbnMgYW5kIHBvc3QtcHJvY2Vzc2luZyBlZmZlY3RzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaGFuZGxlIG9mIHRoZSBjcmVhdGVkIGZyYW1lYnVmZmVyIG9iamVjdFxuICAgKi9cbiAgY3JlYXRlRnJhbWVCdWZmZXJPYmplY3QoKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG4gICAgY29uc3QgZmJvID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICBjb25zdCByZXNvdXJjZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKGZibyEpO1xuXG4gICAgcmV0dXJuIHJlc291cmNlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgY29sb3IgYnVmZmVyICh0ZXh0dXJlIG9yIHJlbmRlcmJ1ZmZlcikgdG8gYSBmcmFtZWJ1ZmZlciBvYmplY3QuXG4gICAqIFRoaXMgbWV0aG9kIHN1cHBvcnRzIGJvdGggcmVndWxhciB0ZXh0dXJlcyBhbmQgbXVsdGl2aWV3IFZSIHRleHR1cmVzLlxuICAgKlxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgLSBUaGUgZnJhbWVidWZmZXIgdG8gYXR0YWNoIHRvXG4gICAqIEBwYXJhbSBhdHRhY2htZW50SW5kZXggLSBUaGUgY29sb3IgYXR0YWNobWVudCBpbmRleCAoMC1iYXNlZClcbiAgICogQHBhcmFtIHJlbmRlcmFibGUgLSBUaGUgdGV4dHVyZSBvciByZW5kZXJidWZmZXIgdG8gYXR0YWNoXG4gICAqL1xuICBhdHRhY2hDb2xvckJ1ZmZlclRvRnJhbWVCdWZmZXJPYmplY3QoZnJhbWVidWZmZXI6IEZyYW1lQnVmZmVyLCBhdHRhY2htZW50SW5kZXg6IEluZGV4LCByZW5kZXJhYmxlOiBJUmVuZGVyYWJsZSkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3QgZmJvID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKGZyYW1lYnVmZmVyLmZyYW1lYnVmZmVyVUlEKSEgYXMgV2ViR0xGcmFtZWJ1ZmZlcjtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZmJvKTtcblxuICAgIGNvbnN0IHJlbmRlcmFibGVXZWJHTFJlc291cmNlID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHJlbmRlcmFibGUuX3RleHR1cmVSZXNvdXJjZVVpZCkhIGFzIFdlYkdMVGV4dHVyZTtcbiAgICBjb25zdCBhdHRhY2htZW50SWQgPSB0aGlzLl9fZ2x3IS5jb2xvckF0dGFjaG1lbnQoYXR0YWNobWVudEluZGV4KTtcblxuICAgIGlmIChyZW5kZXJhYmxlIGluc3RhbmNlb2YgUmVuZGVyVGFyZ2V0VGV4dHVyZTJEQXJyYXkpIHtcbiAgICAgIC8vIEl0J3MgbXVzdCBiZSBUZXh0dXJlQXJyYXkgZm9yIE11bHRpVmlldyBWUiBSZW5kZXJpbmdcbiAgICAgIChyZW5kZXJhYmxlIGFzIFJlbmRlclRhcmdldFRleHR1cmUyREFycmF5KS5fZmJvID0gZnJhbWVidWZmZXI7XG4gICAgICBpZiAodGhpcy5fX2dsdyEud2ViZ2wyRXh0TUxUVklFVyEuaXNfbXVsdGlzYW1wbGUpIHtcbiAgICAgICAgdGhpcy5fX2dsdyEud2ViZ2wyRXh0TUxUVklFVyEuZnJhbWVidWZmZXJUZXh0dXJlTXVsdGlzYW1wbGVNdWx0aXZpZXdPVlIoXG4gICAgICAgICAgZ2wuRFJBV19GUkFNRUJVRkZFUixcbiAgICAgICAgICBhdHRhY2htZW50SWQsXG4gICAgICAgICAgcmVuZGVyYWJsZVdlYkdMUmVzb3VyY2UsXG4gICAgICAgICAgMCxcbiAgICAgICAgICA0LCAvLyBzYW1wbGUgY291bnRcbiAgICAgICAgICAwLFxuICAgICAgICAgIHJlbmRlcmFibGUuYXJyYXlMZW5ndGhcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX19nbHchLndlYmdsMkV4dE1MVFZJRVchLmZyYW1lYnVmZmVyVGV4dHVyZU11bHRpdmlld09WUihcbiAgICAgICAgICBnbC5EUkFXX0ZSQU1FQlVGRkVSLFxuICAgICAgICAgIGF0dGFjaG1lbnRJZCxcbiAgICAgICAgICByZW5kZXJhYmxlV2ViR0xSZXNvdXJjZSxcbiAgICAgICAgICAwLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgcmVuZGVyYWJsZS5hcnJheUxlbmd0aFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocmVuZGVyYWJsZSBpbnN0YW5jZW9mIFJlbmRlclRhcmdldFRleHR1cmUpIHtcbiAgICAgIChyZW5kZXJhYmxlIGFzIFJlbmRlclRhcmdldFRleHR1cmUpLl9mYm8gPSBmcmFtZWJ1ZmZlcjtcbiAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBhdHRhY2htZW50SWQsIGdsLlRFWFRVUkVfMkQsIHJlbmRlcmFibGVXZWJHTFJlc291cmNlLCAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSXQncyBtdXN0IGJlIFJlbmRlckJ1ZmZlclxuICAgICAgKHJlbmRlcmFibGUgYXMgUmVuZGVyQnVmZmVyKS5fZmJvID0gZnJhbWVidWZmZXI7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihcbiAgICAgICAgZ2wuRlJBTUVCVUZGRVIsXG4gICAgICAgIGF0dGFjaG1lbnRJZCxcbiAgICAgICAgZ2wuUkVOREVSQlVGRkVSLFxuICAgICAgICByZW5kZXJhYmxlV2ViR0xSZXNvdXJjZSBhcyBhbnkgYXMgV2ViR0xSZW5kZXJidWZmZXJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhIHNwZWNpZmljIGxheWVyIG9mIGEgdGV4dHVyZSBhcnJheSB0byBhIGZyYW1lYnVmZmVyIG9iamVjdC5cbiAgICogVGhpcyBtZXRob2QgaXMgdXNlZnVsIGZvciByZW5kZXJpbmcgdG8gaW5kaXZpZHVhbCBsYXllcnMgb2YgYSB0ZXh0dXJlIGFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgLSBUaGUgZnJhbWVidWZmZXIgdG8gYXR0YWNoIHRvXG4gICAqIEBwYXJhbSBhdHRhY2htZW50SW5kZXggLSBUaGUgY29sb3IgYXR0YWNobWVudCBpbmRleCAoMC1iYXNlZClcbiAgICogQHBhcmFtIHJlbmRlcmFibGUgLSBUaGUgdGV4dHVyZSBhcnJheSB0byBhdHRhY2hcbiAgICogQHBhcmFtIGxheWVySW5kZXggLSBUaGUgbGF5ZXIgaW5kZXggd2l0aGluIHRoZSB0ZXh0dXJlIGFycmF5XG4gICAqIEBwYXJhbSBtaXBMZXZlbCAtIFRoZSBtaXAgbGV2ZWwgdG8gYXR0YWNoXG4gICAqL1xuICBhdHRhY2hDb2xvckJ1ZmZlckxheWVyVG9GcmFtZUJ1ZmZlck9iamVjdChcbiAgICBmcmFtZWJ1ZmZlcjogRnJhbWVCdWZmZXIsXG4gICAgYXR0YWNobWVudEluZGV4OiBJbmRleCxcbiAgICByZW5kZXJhYmxlOiBJUmVuZGVyYWJsZSxcbiAgICBsYXllckluZGV4OiBJbmRleCxcbiAgICBtaXBMZXZlbDogSW5kZXhcbiAgKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICBjb25zdCBmYm8gPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UoZnJhbWVidWZmZXIuZnJhbWVidWZmZXJVSUQpISBhcyBXZWJHTEZyYW1lYnVmZmVyO1xuXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBmYm8pO1xuXG4gICAgY29uc3QgcmVuZGVyYWJsZVdlYkdMUmVzb3VyY2UgPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UocmVuZGVyYWJsZS5fdGV4dHVyZVJlc291cmNlVWlkKSEgYXMgV2ViR0xUZXh0dXJlO1xuICAgIGNvbnN0IGF0dGFjaG1lbnRJZCA9IHRoaXMuX19nbHchLmNvbG9yQXR0YWNobWVudChhdHRhY2htZW50SW5kZXgpO1xuXG4gICAgKHJlbmRlcmFibGUgYXMgUmVuZGVyVGFyZ2V0VGV4dHVyZSkuX2ZibyA9IGZyYW1lYnVmZmVyO1xuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZUxheWVyKGdsLkZSQU1FQlVGRkVSLCBhdHRhY2htZW50SWQsIHJlbmRlcmFibGVXZWJHTFJlc291cmNlLCBtaXBMZXZlbCwgbGF5ZXJJbmRleCk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgc3BlY2lmaWMgZmFjZSBvZiBhIGN1YmUgdGV4dHVyZSB0byBhIGZyYW1lYnVmZmVyIG9iamVjdC5cbiAgICogVGhpcyBtZXRob2QgaXMgdXNlZCBmb3IgcmVuZGVyaW5nIHRvIGluZGl2aWR1YWwgZmFjZXMgb2YgY3ViZSBtYXBzLlxuICAgKlxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgLSBUaGUgZnJhbWVidWZmZXIgdG8gYXR0YWNoIHRvXG4gICAqIEBwYXJhbSBhdHRhY2htZW50SW5kZXggLSBUaGUgY29sb3IgYXR0YWNobWVudCBpbmRleCAoMC1iYXNlZClcbiAgICogQHBhcmFtIGZhY2VJbmRleCAtIFRoZSBjdWJlIGZhY2UgaW5kZXggKDAtNTogK1gsIC1YLCArWSwgLVksICtaLCAtWilcbiAgICogQHBhcmFtIG1pcExldmVsIC0gVGhlIG1pcCBsZXZlbCB0byBhdHRhY2hcbiAgICogQHBhcmFtIHJlbmRlcmFibGUgLSBUaGUgY3ViZSB0ZXh0dXJlIHRvIGF0dGFjaFxuICAgKi9cbiAgYXR0YWNoQ29sb3JCdWZmZXJDdWJlVG9GcmFtZUJ1ZmZlck9iamVjdChcbiAgICBmcmFtZWJ1ZmZlcjogRnJhbWVCdWZmZXIsXG4gICAgYXR0YWNobWVudEluZGV4OiBJbmRleCxcbiAgICBmYWNlSW5kZXg6IEluZGV4LFxuICAgIG1pcExldmVsOiBJbmRleCxcbiAgICByZW5kZXJhYmxlOiBJUmVuZGVyYWJsZVxuICApIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGNvbnN0IGZibyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShmcmFtZWJ1ZmZlci5mcmFtZWJ1ZmZlclVJRCkhIGFzIFdlYkdMRnJhbWVidWZmZXI7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGZibyk7XG5cbiAgICBjb25zdCByZW5kZXJhYmxlV2ViR0xSZXNvdXJjZSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShyZW5kZXJhYmxlLl90ZXh0dXJlUmVzb3VyY2VVaWQpISBhcyBXZWJHTFRleHR1cmU7XG4gICAgY29uc3QgYXR0YWNobWVudElkID0gdGhpcy5fX2dsdyEuY29sb3JBdHRhY2htZW50KGF0dGFjaG1lbnRJbmRleCk7XG5cbiAgICAocmVuZGVyYWJsZSBhcyBSZW5kZXJCdWZmZXIpLl9mYm8gPSBmcmFtZWJ1ZmZlcjtcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChcbiAgICAgIGdsLkZSQU1FQlVGRkVSLFxuICAgICAgYXR0YWNobWVudElkLFxuICAgICAgZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YICsgZmFjZUluZGV4LFxuICAgICAgcmVuZGVyYWJsZVdlYkdMUmVzb3VyY2UsXG4gICAgICBtaXBMZXZlbFxuICAgICk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgZGVwdGggYnVmZmVyIHRvIGEgZnJhbWVidWZmZXIgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgLSBUaGUgZnJhbWVidWZmZXIgdG8gYXR0YWNoIHRvXG4gICAqIEBwYXJhbSByZW5kZXJhYmxlIC0gVGhlIGRlcHRoIHRleHR1cmUgb3IgcmVuZGVyYnVmZmVyIHRvIGF0dGFjaFxuICAgKi9cbiAgYXR0YWNoRGVwdGhCdWZmZXJUb0ZyYW1lQnVmZmVyT2JqZWN0KGZyYW1lYnVmZmVyOiBGcmFtZUJ1ZmZlciwgcmVuZGVyYWJsZTogSVJlbmRlcmFibGUpIHtcbiAgICB0aGlzLl9fYXR0YWNoRGVwdGhPclN0ZW5jaWxCdWZmZXJUb0ZyYW1lQnVmZmVyT2JqZWN0KGZyYW1lYnVmZmVyLCByZW5kZXJhYmxlLCAzNjA5Nik7IC8vIGdsLkRFUFRIX0FUVEFDSE1FTlRcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhIHN0ZW5jaWwgYnVmZmVyIHRvIGEgZnJhbWVidWZmZXIgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgLSBUaGUgZnJhbWVidWZmZXIgdG8gYXR0YWNoIHRvXG4gICAqIEBwYXJhbSByZW5kZXJhYmxlIC0gVGhlIHN0ZW5jaWwgdGV4dHVyZSBvciByZW5kZXJidWZmZXIgdG8gYXR0YWNoXG4gICAqL1xuICBhdHRhY2hTdGVuY2lsQnVmZmVyVG9GcmFtZUJ1ZmZlck9iamVjdChmcmFtZWJ1ZmZlcjogRnJhbWVCdWZmZXIsIHJlbmRlcmFibGU6IElSZW5kZXJhYmxlKSB7XG4gICAgdGhpcy5fX2F0dGFjaERlcHRoT3JTdGVuY2lsQnVmZmVyVG9GcmFtZUJ1ZmZlck9iamVjdChmcmFtZWJ1ZmZlciwgcmVuZGVyYWJsZSwgMzYxMjgpOyAvLyBnbC5TVEVOQ0lMX0FUVEFDSE1FTlRcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhIGNvbWJpbmVkIGRlcHRoLXN0ZW5jaWwgYnVmZmVyIHRvIGEgZnJhbWVidWZmZXIgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgLSBUaGUgZnJhbWVidWZmZXIgdG8gYXR0YWNoIHRvXG4gICAqIEBwYXJhbSByZW5kZXJhYmxlIC0gVGhlIGRlcHRoLXN0ZW5jaWwgdGV4dHVyZSBvciByZW5kZXJidWZmZXIgdG8gYXR0YWNoXG4gICAqL1xuICBhdHRhY2hEZXB0aFN0ZW5jaWxCdWZmZXJUb0ZyYW1lQnVmZmVyT2JqZWN0KGZyYW1lYnVmZmVyOiBGcmFtZUJ1ZmZlciwgcmVuZGVyYWJsZTogSVJlbmRlcmFibGUpIHtcbiAgICB0aGlzLl9fYXR0YWNoRGVwdGhPclN0ZW5jaWxCdWZmZXJUb0ZyYW1lQnVmZmVyT2JqZWN0KGZyYW1lYnVmZmVyLCByZW5kZXJhYmxlLCAzMzMwNik7IC8vIGdsLkRFUFRIX1NURU5DSUxfQVRUQUNITUVOVFxuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIG1ldGhvZCBmb3IgYXR0YWNoaW5nIGRlcHRoIG9yIHN0ZW5jaWwgYnVmZmVycyB0byBmcmFtZWJ1ZmZlcnMuXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgZGVwdGgsIHN0ZW5jaWwsIGFuZCBkZXB0aC1zdGVuY2lsIGF0dGFjaG1lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgLSBUaGUgZnJhbWVidWZmZXIgdG8gYXR0YWNoIHRvXG4gICAqIEBwYXJhbSByZW5kZXJhYmxlIC0gVGhlIHRleHR1cmUgb3IgcmVuZGVyYnVmZmVyIHRvIGF0dGFjaFxuICAgKiBAcGFyYW0gYXR0YWNobWVudFR5cGUgLSBUaGUgV2ViR0wgYXR0YWNobWVudCB0eXBlIGNvbnN0YW50XG4gICAqL1xuICBwcml2YXRlIF9fYXR0YWNoRGVwdGhPclN0ZW5jaWxCdWZmZXJUb0ZyYW1lQnVmZmVyT2JqZWN0KFxuICAgIGZyYW1lYnVmZmVyOiBGcmFtZUJ1ZmZlcixcbiAgICByZW5kZXJhYmxlOiBJUmVuZGVyYWJsZSxcbiAgICBhdHRhY2htZW50VHlwZTogbnVtYmVyXG4gICkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3QgZmJvID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKGZyYW1lYnVmZmVyLmZyYW1lYnVmZmVyVUlEKSEgYXMgV2ViR0xGcmFtZWJ1ZmZlcjtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZmJvKTtcblxuICAgIGNvbnN0IHJlbmRlcmFibGVXZWJHTFJlc291cmNlID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHJlbmRlcmFibGUuX3RleHR1cmVSZXNvdXJjZVVpZCkhIGFzIFdlYkdMVGV4dHVyZTtcblxuICAgIGlmIChyZW5kZXJhYmxlIGluc3RhbmNlb2YgUmVuZGVyVGFyZ2V0VGV4dHVyZTJEQXJyYXkpIHtcbiAgICAgIC8vIEl0J3MgbXVzdCBiZSBUZXh0dXJlQXJyYXkgZm9yIE11bHRpVmlldyBWUiBSZW5kZXJpbmdcbiAgICAgIChyZW5kZXJhYmxlIGFzIFJlbmRlclRhcmdldFRleHR1cmUyREFycmF5KS5fZmJvID0gZnJhbWVidWZmZXI7XG4gICAgICBpZiAodGhpcy5fX2dsdyEud2ViZ2wyRXh0TUxUVklFVyEuaXNfbXVsdGlzYW1wbGUpIHtcbiAgICAgICAgdGhpcy5fX2dsdyEud2ViZ2wyRXh0TUxUVklFVyEuZnJhbWVidWZmZXJUZXh0dXJlTXVsdGlzYW1wbGVNdWx0aXZpZXdPVlIoXG4gICAgICAgICAgZ2wuRFJBV19GUkFNRUJVRkZFUixcbiAgICAgICAgICBhdHRhY2htZW50VHlwZSxcbiAgICAgICAgICByZW5kZXJhYmxlV2ViR0xSZXNvdXJjZSxcbiAgICAgICAgICAwLFxuICAgICAgICAgIDQsIC8vIHNhbXBsZSBjb3VudFxuICAgICAgICAgIDAsXG4gICAgICAgICAgcmVuZGVyYWJsZS5hcnJheUxlbmd0aFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2dsdyEud2ViZ2wyRXh0TUxUVklFVyEuZnJhbWVidWZmZXJUZXh0dXJlTXVsdGl2aWV3T1ZSKFxuICAgICAgICAgIGdsLkRSQVdfRlJBTUVCVUZGRVIsXG4gICAgICAgICAgYXR0YWNobWVudFR5cGUsXG4gICAgICAgICAgcmVuZGVyYWJsZVdlYkdMUmVzb3VyY2UsXG4gICAgICAgICAgMCxcbiAgICAgICAgICAwLFxuICAgICAgICAgIHJlbmRlcmFibGUuYXJyYXlMZW5ndGhcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHJlbmRlcmFibGUgaW5zdGFuY2VvZiBSZW5kZXJUYXJnZXRUZXh0dXJlKSB7XG4gICAgICAocmVuZGVyYWJsZSBhcyBSZW5kZXJUYXJnZXRUZXh0dXJlKS5fZmJvID0gZnJhbWVidWZmZXI7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgYXR0YWNobWVudFR5cGUsIGdsLlRFWFRVUkVfMkQsIHJlbmRlcmFibGVXZWJHTFJlc291cmNlLCAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSXQncyBtdXN0IGJlIFJlbmRlckJ1ZmZlclxuICAgICAgKHJlbmRlcmFibGUgYXMgUmVuZGVyQnVmZmVyKS5fZmJvID0gZnJhbWVidWZmZXI7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihcbiAgICAgICAgZ2wuRlJBTUVCVUZGRVIsXG4gICAgICAgIGF0dGFjaG1lbnRUeXBlLFxuICAgICAgICBnbC5SRU5ERVJCVUZGRVIsXG4gICAgICAgIHJlbmRlcmFibGVXZWJHTFJlc291cmNlIGFzIGFueSBhcyBXZWJHTFJlbmRlcmJ1ZmZlclxuICAgICAgKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgLyoqXG4gICAqIGNyZWF0ZSBSZW5kZXJidWZmZXJcbiAgICovXG4gIGNyZWF0ZVJlbmRlckJ1ZmZlcihcbiAgICB3aWR0aDogU2l6ZSxcbiAgICBoZWlnaHQ6IFNpemUsXG4gICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVQYXJhbWV0ZXJFbnVtLFxuICAgIGlzTVNBQTogYm9vbGVhbixcbiAgICBzYW1wbGVDb3VudE1TQUE6IENvdW50XG4gICkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dCgpO1xuICAgIGNvbnN0IHJlbmRlckJ1ZmZlciA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICAgIGNvbnN0IHJlc291cmNlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UocmVuZGVyQnVmZmVyISk7XG5cbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgcmVuZGVyQnVmZmVyKTtcbiAgICBpZiAoaXNNU0FBKSB7XG4gICAgICAoZ2wgYXMgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCkucmVuZGVyYnVmZmVyU3RvcmFnZU11bHRpc2FtcGxlKFxuICAgICAgICBnbC5SRU5ERVJCVUZGRVIsXG4gICAgICAgIHNhbXBsZUNvdW50TVNBQSxcbiAgICAgICAgKGdsIGFzIGFueSlbaW50ZXJuYWxGb3JtYXQuc3RyXSxcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShnbC5SRU5ERVJCVUZGRVIsIChnbCBhcyBhbnkpW2ludGVybmFsRm9ybWF0LnN0cl0sIHdpZHRoLCBoZWlnaHQpO1xuICAgIH1cbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG5cbiAgICByZXR1cm4gcmVzb3VyY2VIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogc2V0IGRyYXdUYXJnZXRzXG4gICAqIEBwYXJhbSBmcmFtZWJ1ZmZlclxuICAgKi9cbiAgc2V0RHJhd1RhcmdldHMocmVuZGVyUGFzczogUmVuZGVyUGFzcykge1xuICAgIGNvbnN0IGZyYW1lYnVmZmVyID0gcmVuZGVyUGFzcy5nZXRGcmFtZWJ1ZmZlcigpO1xuICAgIGlmIChmcmFtZWJ1ZmZlcikge1xuICAgICAgY29uc3QgcmVuZGVyQnVmZmVyVGFyZ2V0RW51bXMgPSByZW5kZXJQYXNzLmdldFJlbmRlclRhcmdldENvbG9yQXR0YWNobWVudHMoKTtcbiAgICAgIGlmIChJcy5leGlzdChyZW5kZXJCdWZmZXJUYXJnZXRFbnVtcykpIHtcbiAgICAgICAgdGhpcy5fX2dsdyEuZHJhd0J1ZmZlcnMocmVuZGVyQnVmZmVyVGFyZ2V0RW51bXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2dsdyEuZHJhd0J1ZmZlcnMoZnJhbWVidWZmZXIuY29sb3JBdHRhY2htZW50c1JlbmRlckJ1ZmZlclRhcmdldHMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZ2x3IS5kcmF3QnVmZmVycyhbUmVuZGVyQnVmZmVyVGFyZ2V0LkJhY2tdKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogYmluZCBGcmFtZWJ1ZmZlclxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXJcbiAgICovXG4gIGJpbmRGcmFtZWJ1ZmZlcihmcmFtZWJ1ZmZlcj86IEZyYW1lQnVmZmVyKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG4gICAgaWYgKGZyYW1lYnVmZmVyKSB7XG4gICAgICBjb25zdCBmYm9VaWQgPSBmcmFtZWJ1ZmZlci5jZ0FwaVJlc291cmNlVWlkO1xuICAgICAgY29uc3QgZmJvID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKGZib1VpZCkgYXMgV2ViR0xGcmFtZWJ1ZmZlcjtcbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZmJvKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogdW5iaW5kIEZyYW1lYnVmZmVyXG4gICAqL1xuICB1bmJpbmRGcmFtZWJ1ZmZlcigpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgLyoqXG4gICAqIGNyZWF0ZSBhIFJlbmRlclRhcmdldFRleHR1cmVcbiAgICogQHBhcmFtIHBhcmFtMFxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgY3JlYXRlUmVuZGVyVGFyZ2V0VGV4dHVyZSh7XG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIG1pcExldmVsQ291bnQsXG4gICAgZm9ybWF0LFxuICB9OiB7XG4gICAgd2lkdGg6IFNpemU7XG4gICAgaGVpZ2h0OiBTaXplO1xuICAgIG1pcExldmVsQ291bnQ6IENvdW50O1xuICAgIGZvcm1hdDogVGV4dHVyZVBhcmFtZXRlckVudW07XG4gIH0pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuXG4gICAgY29uc3QgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKSBhcyBSbldlYkdMVGV4dHVyZTtcbiAgICBjb25zdCByZXNvdXJjZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKHRleHR1cmUpO1xuXG4gICAgdGhpcy5fX2dsdyEuYmluZFRleHR1cmUyRCgxNSwgdGV4dHVyZSk7XG5cbiAgICBnbC50ZXhTdG9yYWdlMkQoZ2wuVEVYVFVSRV8yRCwgbWlwTGV2ZWxDb3VudCwgZm9ybWF0LmluZGV4LCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgIHRoaXMuX19nbHchLnVuYmluZFRleHR1cmUyRCgxNSk7XG5cbiAgICByZXR1cm4gcmVzb3VyY2VIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogY3JlYXRlIGEgUmVuZGVyVGFyZ2V0VGV4dHVyZUFycmF5XG4gICAqIEBwYXJhbSBwYXJhbTBcbiAgICogQHJldHVybnNcbiAgICovXG4gIGNyZWF0ZVJlbmRlclRhcmdldFRleHR1cmVBcnJheSh7XG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIGludGVybmFsRm9ybWF0LFxuICAgIGFycmF5TGVuZ3RoLFxuICB9OiB7XG4gICAgd2lkdGg6IFNpemU7XG4gICAgaGVpZ2h0OiBTaXplO1xuICAgIGludGVybmFsRm9ybWF0OiBUZXh0dXJlUGFyYW1ldGVyRW51bTtcbiAgICBhcnJheUxlbmd0aDogQ291bnQ7XG4gIH0pOiBXZWJHTFJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuXG4gICAgY29uc3QgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKSBhcyBSbldlYkdMVGV4dHVyZTtcbiAgICBjb25zdCByZXNvdXJjZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKHRleHR1cmUpO1xuXG4gICAgdGhpcy5fX2dsdyEuYmluZFRleHR1cmUyREFycmF5KDE1LCB0ZXh0dXJlKTtcbiAgICBnbC50ZXhTdG9yYWdlM0QoZ2wuVEVYVFVSRV8yRF9BUlJBWSwgMSwgaW50ZXJuYWxGb3JtYXQuaW5kZXgsIHdpZHRoLCBoZWlnaHQsIGFycmF5TGVuZ3RoKTtcbiAgICB0aGlzLl9fZ2x3IS51bmJpbmRUZXh0dXJlMkRBcnJheSgxNSk7XG4gICAgcmV0dXJuIHJlc291cmNlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIGNyZWF0ZSBhIFJlbmRlclRhcmdldFRleHR1cmVDdWJlXG4gICAqIEBwYXJhbSBwYXJhbTBcbiAgICogQHJldHVybnNcbiAgICovXG4gIGNyZWF0ZVJlbmRlclRhcmdldFRleHR1cmVDdWJlKHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgbWlwTGV2ZWxDb3VudCxcbiAgICBmb3JtYXQsXG4gIH06IHtcbiAgICB3aWR0aDogU2l6ZTtcbiAgICBoZWlnaHQ6IFNpemU7XG4gICAgbWlwTGV2ZWxDb3VudDogU2l6ZTtcbiAgICBmb3JtYXQ6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICB9KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcblxuICAgIGNvbnN0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCkgYXMgUm5XZWJHTFRleHR1cmU7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlKTtcblxuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlQ3ViZSgxNSwgdGV4dHVyZSk7XG5cbiAgICBnbC50ZXhTdG9yYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUCwgbWlwTGV2ZWxDb3VudCwgZm9ybWF0LmluZGV4LCB3aWR0aCwgaGVpZ2h0KTtcblxuICAgIHRoaXMuX19nbHchLnVuYmluZFRleHR1cmVDdWJlKDE1KTtcblxuICAgIHJldHVybiByZXNvdXJjZUhhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBjcmVhdGUgYSBDdWJlVGV4dHVyZVxuICAgKlxuICAgKiBAcGFyYW0gbWlwTGV2ZWxDb3VudFxuICAgKiBAcGFyYW0gaW1hZ2VzXG4gICAqIEBwYXJhbSB3aWR0aFxuICAgKiBAcGFyYW0gaGVpZ2h0XG4gICAqIEByZXR1cm5zIHJlc291cmNlIGhhbmRsZVxuICAgKi9cbiAgY3JlYXRlQ3ViZVRleHR1cmUoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgbWlwTGV2ZWxDb3VudDogQ291bnQsXG4gICAgaW1hZ2VzOiBBcnJheTx7XG4gICAgICBwb3NYOiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgIG5lZ1g6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgcG9zWTogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICBuZWdZOiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgIHBvc1o6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgbmVnWjogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgfT4sXG4gICAgd2lkdGg6IFNpemUsXG4gICAgaGVpZ2h0OiBTaXplXG4gICk6IFtudW1iZXIsIFNhbXBsZXJdIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcblxuICAgIGNvbnN0IHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCkgYXMgUm5XZWJHTFRleHR1cmU7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlKTtcblxuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlQ3ViZSgxNSwgdGV4dHVyZSk7XG5cbiAgICBjb25zdCB3cmFwUyA9IFRleHR1cmVQYXJhbWV0ZXIuQ2xhbXBUb0VkZ2U7XG4gICAgY29uc3Qgd3JhcFQgPSBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlO1xuICAgIGxldCBtaW5GaWx0ZXIgPSBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcjtcbiAgICBsZXQgbWFnRmlsdGVyID0gVGV4dHVyZVBhcmFtZXRlci5MaW5lYXI7XG4gICAgaWYgKFxuICAgICAgKGltYWdlc1swXS5wb3NYIGFzIGFueSkuaGRyaUZvcm1hdCA9PT0gSGRyaUZvcm1hdC5IRFJfTElORUFSICYmXG4gICAgICB0aGlzLl9fZ2x3IS5pc05vdFN1cHBvcnRXZWJHTDFFeHRlbnNpb24oZW5naW5lLmNvbmZpZywgV2ViR0xFeHRlbnNpb24uVGV4dHVyZUZsb2F0TGluZWFyKVxuICAgICkge1xuICAgICAgaWYgKG1pcExldmVsQ291bnQgPj0gMikge1xuICAgICAgICBtaW5GaWx0ZXIgPSBUZXh0dXJlUGFyYW1ldGVyLk5lYXJlc3RNaXBtYXBOZWFyZXN0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWluRmlsdGVyID0gVGV4dHVyZVBhcmFtZXRlci5OZWFyZXN0O1xuICAgICAgfVxuICAgICAgbWFnRmlsdGVyID0gVGV4dHVyZVBhcmFtZXRlci5OZWFyZXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWlwTGV2ZWxDb3VudCA+PSAyKSB7XG4gICAgICAgIG1pbkZpbHRlciA9IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyTWlwbWFwTGluZWFyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWluRmlsdGVyID0gVGV4dHVyZVBhcmFtZXRlci5MaW5lYXI7XG4gICAgICB9XG4gICAgICBtYWdGaWx0ZXIgPSBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcjtcbiAgICB9XG5cbiAgICBjb25zdCBzYW1wbGVyID0gbmV3IFNhbXBsZXIoZW5naW5lLCB7IHdyYXBTLCB3cmFwVCwgbWluRmlsdGVyLCBtYWdGaWx0ZXIgfSk7XG4gICAgc2FtcGxlci5jcmVhdGUoKTtcblxuICAgIGNvbnN0IGxvYWRJbWFnZVRvR1BVID0gKGltYWdlOiBEaXJlY3RUZXh0dXJlRGF0YSwgY3ViZU1hcFNpZGU6IG51bWJlciwgaTogSW5kZXgpID0+IHtcbiAgICAgIGlmICgoaW1hZ2UgYXMgYW55KS5oZHJpRm9ybWF0ID09PSBIZHJpRm9ybWF0LkhEUl9MSU5FQVIpIHtcbiAgICAgICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICAgICAgZ2wudGV4SW1hZ2UyRChcbiAgICAgICAgICBjdWJlTWFwU2lkZSxcbiAgICAgICAgICBpLFxuICAgICAgICAgIGVuZ2luZS5jb25maWcuaXNNb2JpbGUgPyBnbC5SR0IxNkYgOiBnbC5SR0IzMkYsXG4gICAgICAgICAgKGltYWdlIGFzIGFueSkud2lkdGgsXG4gICAgICAgICAgKGltYWdlIGFzIGFueSkuaGVpZ2h0LFxuICAgICAgICAgIDAsXG4gICAgICAgICAgZ2wuUkdCLFxuICAgICAgICAgIGdsLkZMT0FULFxuICAgICAgICAgIChpbWFnZSBhcyBhbnkpLmRhdGFGbG9hdFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChpbWFnZSBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQgfHwgaW1hZ2UgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuICAgICAgICBnbC50ZXhJbWFnZTJEKGN1YmVNYXBTaWRlLCBpLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnbC50ZXhJbWFnZTJEKFxuICAgICAgICAgIGN1YmVNYXBTaWRlLFxuICAgICAgICAgIGksXG4gICAgICAgICAgZ2wuUkdCQSxcbiAgICAgICAgICB3aWR0aCAvIDIgKiogaSxcbiAgICAgICAgICBoZWlnaHQgLyAyICoqIGksXG4gICAgICAgICAgMCxcbiAgICAgICAgICBnbC5SR0JBLFxuICAgICAgICAgIGdsLlVOU0lHTkVEX0JZVEUsXG4gICAgICAgICAgaW1hZ2UgYXMgQXJyYXlCdWZmZXJWaWV3XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW1hZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbWFnZSA9IGltYWdlc1tpXTtcbiAgICAgIGxvYWRJbWFnZVRvR1BVKGltYWdlLnBvc1gsIGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCwgaSk7XG4gICAgICBsb2FkSW1hZ2VUb0dQVShpbWFnZS5uZWdYLCBnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIGkpO1xuICAgICAgbG9hZEltYWdlVG9HUFUoaW1hZ2UucG9zWSwgZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCBpKTtcbiAgICAgIGxvYWRJbWFnZVRvR1BVKGltYWdlLm5lZ1ksIGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgaSk7XG4gICAgICBsb2FkSW1hZ2VUb0dQVShpbWFnZS5wb3NaLCBnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIGkpO1xuICAgICAgbG9hZEltYWdlVG9HUFUoaW1hZ2UubmVnWiwgZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCBpKTtcbiAgICB9XG4gICAgdGhpcy5fX2dsdyEudW5iaW5kVGV4dHVyZUN1YmUoMTUpO1xuXG4gICAgcmV0dXJuIFtyZXNvdXJjZUhhbmRsZSwgc2FtcGxlcl07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIEN1YmUgVGV4dHVyZSBmcm9tIGltYWdlIGZpbGVzLlxuICAgKiBAcGFyYW0gYmFzZVVyaSB0aGUgYmFzZSB1cmkgdG8gbG9hZCBpbWFnZXM7XG4gICAqIEBwYXJhbSBtaXBMZXZlbENvdW50IHRoZSBudW1iZXIgb2YgbWlwIGxldmVscyAoaW5jbHVkZSByb290IGxldmVsKS4gaWYgbm8gbWlwbWFwLCB0aGUgdmFsdWUgc2hvdWxkIGJlIDE7XG4gICAqIEByZXR1cm5zIHRoZSBXZWJHTFJlc291cmNlSGFuZGxlIGZvciB0aGUgZ2VuZXJhdGVkIEN1YmUgVGV4dHVyZVxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ3ViZVRleHR1cmVGcm9tRmlsZXMoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgYmFzZVVyaTogc3RyaW5nLFxuICAgIG1pcExldmVsQ291bnQ6IENvdW50LFxuICAgIGlzTmFtZVBvc05lZzogYm9vbGVhbixcbiAgICBoZHJpRm9ybWF0OiBIZHJpRm9ybWF0RW51bVxuICApIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcblxuICAgIGNvbnN0IGltYWdlQXJnczogQXJyYXk8e1xuICAgICAgcG9zWDogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICBuZWdYOiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgIHBvc1k6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgbmVnWTogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICBwb3NaOiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgIG5lZ1o6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgIH0+ID0gW107XG4gICAgbGV0IHdpZHRoID0gMDtcbiAgICBsZXQgaGVpZ2h0ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1pcExldmVsQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgbG9hZE9uZUxldmVsID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SFRNTEltYWdlRWxlbWVudFtdPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgbGV0IGxvYWRlZENvdW50ID0gMDtcbiAgICAgICAgICBjb25zdCBpbWFnZXM6IEhUTUxJbWFnZUVsZW1lbnRbXSA9IFtdO1xuICAgICAgICAgIGxldCBleHRlbnNpb24gPSAnLmpwZyc7XG4gICAgICAgICAgaWYgKGhkcmlGb3JtYXQgPT09IEhkcmlGb3JtYXQuSERSX0xJTkVBUikge1xuICAgICAgICAgICAgZXh0ZW5zaW9uID0gJy5oZHInO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaGRyaUZvcm1hdCA9PT0gSGRyaUZvcm1hdC5SR0JFX1BORykge1xuICAgICAgICAgICAgZXh0ZW5zaW9uID0gJy5SR0JFLlBORyc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHBvc1ggPSAnX3JpZ2h0Xyc7XG4gICAgICAgICAgbGV0IG5lZ1ggPSAnX2xlZnRfJztcbiAgICAgICAgICBsZXQgcG9zWSA9ICdfdG9wXyc7XG4gICAgICAgICAgbGV0IG5lZ1kgPSAnX2JvdHRvbV8nO1xuICAgICAgICAgIGxldCBwb3NaID0gJ19mcm9udF8nO1xuICAgICAgICAgIGxldCBuZWdaID0gJ19iYWNrXyc7XG4gICAgICAgICAgaWYgKGlzTmFtZVBvc05lZykge1xuICAgICAgICAgICAgcG9zWCA9ICdfcG9zeF8nO1xuICAgICAgICAgICAgbmVnWCA9ICdfbmVneF8nO1xuICAgICAgICAgICAgcG9zWSA9ICdfcG9zeV8nO1xuICAgICAgICAgICAgbmVnWSA9ICdfbmVneV8nO1xuICAgICAgICAgICAgcG9zWiA9ICdfcG9zel8nO1xuICAgICAgICAgICAgbmVnWiA9ICdfbmVnel8nO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGZhY2VzID0gW1xuICAgICAgICAgICAgW2Jhc2VVcmkgKyBwb3NYICsgaSArIGV4dGVuc2lvbiwgZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YXSxcbiAgICAgICAgICAgIFtiYXNlVXJpICsgbmVnWCArIGkgKyBleHRlbnNpb24sIGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWF0sXG4gICAgICAgICAgICBbYmFzZVVyaSArIHBvc1kgKyBpICsgZXh0ZW5zaW9uLCBnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ldLFxuICAgICAgICAgICAgW2Jhc2VVcmkgKyBuZWdZICsgaSArIGV4dGVuc2lvbiwgZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZXSxcbiAgICAgICAgICAgIFtiYXNlVXJpICsgcG9zWiArIGkgKyBleHRlbnNpb24sIGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWl0sXG4gICAgICAgICAgICBbYmFzZVVyaSArIG5lZ1ogKyBpICsgZXh0ZW5zaW9uLCBnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1pdLFxuICAgICAgICAgIF07XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBmYWNlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY29uc3QgZmFjZSA9IGZhY2VzW2pdWzFdO1xuICAgICAgICAgICAgbGV0IGltYWdlOiBhbnk7XG4gICAgICAgICAgICBpZiAoaGRyaUZvcm1hdCA9PT0gSGRyaUZvcm1hdC5IRFJfTElORUFSIHx8IGhkcmlGb3JtYXQgPT09IEhkcmlGb3JtYXQuUkdCOV9FNV9QTkcpIHtcbiAgICAgICAgICAgICAgaW1hZ2UgPSBuZXcgSERSSW1hZ2UoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbWFnZS5oZHJpRm9ybWF0ID0gaGRyaUZvcm1hdDtcblxuICAgICAgICAgICAgKGltYWdlIGFzIGFueSkuc2lkZSA9IGZhY2U7XG4gICAgICAgICAgICAoaW1hZ2UgYXMgYW55KS51cmkgPSBmYWNlc1tqXVswXTtcbiAgICAgICAgICAgIGltYWdlLmNyb3NzT3JpZ2luID0gJ0Fub255bW91cyc7XG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIGxvYWRlZENvdW50Kys7XG4gICAgICAgICAgICAgIGltYWdlcy5wdXNoKGltYWdlKTtcbiAgICAgICAgICAgICAgaWYgKGxvYWRlZENvdW50ID09PSA2KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShpbWFnZXMpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1hZ2Uub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgcmVqZWN0KChpbWFnZSBhcyBhbnkpLnVyaSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1hZ2Uuc3JjID0gZmFjZXNbal1bMF07XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGxldCBpbWFnZXM6IEhUTUxJbWFnZUVsZW1lbnRbXTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGltYWdlcyA9IGF3YWl0IGxvYWRPbmVMZXZlbCgpO1xuICAgICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgICAgLy8gVHJ5IGFnYWluIG9uY2VcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpbWFnZXMgPSBhd2FpdCBsb2FkT25lTGV2ZWwoKTtcbiAgICAgICAgfSBjYXRjaCAodXJpKSB7XG4gICAgICAgICAgLy8gR2l2ZSB1cFxuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBmYWlsZWQgdG8gbG9hZCAke3VyaX1gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgaW1hZ2VPYmo6IHtcbiAgICAgICAgcG9zWD86IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICBuZWdYPzogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICAgIHBvc1k/OiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgICAgbmVnWT86IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICBwb3NaPzogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICAgIG5lZ1o/OiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgIH0gPSB7fTtcbiAgICAgIGZvciAoY29uc3QgaW1hZ2Ugb2YgaW1hZ2VzISkge1xuICAgICAgICBzd2l0Y2ggKChpbWFnZSBhcyBhbnkpLnNpZGUpIHtcbiAgICAgICAgICBjYXNlIGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWDpcbiAgICAgICAgICAgIGltYWdlT2JqLnBvc1ggPSBpbWFnZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZOlxuICAgICAgICAgICAgaW1hZ2VPYmoucG9zWSA9IGltYWdlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1o6XG4gICAgICAgICAgICBpbWFnZU9iai5wb3NaID0gaW1hZ2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWDpcbiAgICAgICAgICAgIGltYWdlT2JqLm5lZ1ggPSBpbWFnZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZOlxuICAgICAgICAgICAgaW1hZ2VPYmoubmVnWSA9IGltYWdlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1o6XG4gICAgICAgICAgICBpbWFnZU9iai5uZWdaID0gaW1hZ2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgIHdpZHRoID0gaW1hZ2Uud2lkdGg7XG4gICAgICAgICAgaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpbWFnZUFyZ3MucHVzaChcbiAgICAgICAgaW1hZ2VPYmogYXMge1xuICAgICAgICAgIHBvc1g6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIG5lZ1g6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIHBvc1k6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIG5lZ1k6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIHBvc1o6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIG5lZ1o6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IFtyZXNvdXJjZUhhbmRsZSwgc2FtcGxlcl0gPSB0aGlzLmNyZWF0ZUN1YmVUZXh0dXJlKGVuZ2luZSwgbWlwTGV2ZWxDb3VudCwgaW1hZ2VBcmdzLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICByZXR1cm4gW3Jlc291cmNlSGFuZGxlLCBzYW1wbGVyLCB3aWR0aCwgaGVpZ2h0XSBhcyBbbnVtYmVyLCBTYW1wbGVyLCBudW1iZXIsIG51bWJlcl07XG4gIH1cblxuICBjcmVhdGVDdWJlVGV4dHVyZUZyb21CYXNpcyhcbiAgICBiYXNpc0ZpbGU6IEJhc2lzRmlsZSxcbiAgICB7XG4gICAgICBtYWdGaWx0ZXIgPSBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcixcbiAgICAgIG1pbkZpbHRlciA9IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyTWlwbWFwTGluZWFyLFxuICAgICAgd3JhcFMgPSBUZXh0dXJlUGFyYW1ldGVyLlJlcGVhdCxcbiAgICAgIHdyYXBUID0gVGV4dHVyZVBhcmFtZXRlci5SZXBlYXQsXG4gICAgICBib3JkZXIgPSAwLFxuICAgIH1cbiAgKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG4gICAgbGV0IGJhc2lzQ29tcHJlc3Npb25UeXBlOiBCYXNpc0NvbXByZXNzaW9uVHlwZUVudW07XG4gICAgbGV0IGNvbXByZXNzaW9uVHlwZTogSW5kZXg7XG5cbiAgICBjb25zdCB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpIGFzIFJuV2ViR0xUZXh0dXJlO1xuICAgIGNvbnN0IHJlc291cmNlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodGV4dHVyZSk7XG5cbiAgICB0aGlzLl9fZ2x3IS5iaW5kVGV4dHVyZUN1YmUoMTUsIHRleHR1cmUpO1xuXG4gICAgY29uc3QgczN0YyA9IGdsLmdldEV4dGVuc2lvbignV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX3MzdGMnKTtcbiAgICBpZiAoczN0Yykge1xuICAgICAgYmFzaXNDb21wcmVzc2lvblR5cGUgPSBCYXNpc0NvbXByZXNzaW9uVHlwZS5CQzM7XG4gICAgICBjb21wcmVzc2lvblR5cGUgPSBzM3RjLkNPTVBSRVNTRURfUkdCQV9TM1RDX0RYVDVfRVhUO1xuICAgIH1cbiAgICBjb25zdCBldGMxID0gZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfZXRjMScpO1xuICAgIGlmIChldGMxKSB7XG4gICAgICBiYXNpc0NvbXByZXNzaW9uVHlwZSA9IEJhc2lzQ29tcHJlc3Npb25UeXBlLkVUQzE7XG4gICAgICBjb21wcmVzc2lvblR5cGUgPSBldGMxLkNPTVBSRVNTRURfUkdCX0VUQzFfV0VCR0w7XG4gICAgfVxuICAgIGNvbnN0IGF0YyA9IGdsLmdldEV4dGVuc2lvbignV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2F0YycpO1xuICAgIGlmIChhdGMpIHtcbiAgICAgIGJhc2lzQ29tcHJlc3Npb25UeXBlID0gQmFzaXNDb21wcmVzc2lvblR5cGUuQVRDX1JHQkE7XG4gICAgICBjb21wcmVzc2lvblR5cGUgPSBhdGMuQ09NUFJFU1NFRF9SR0JBX0FUQ19JTlRFUlBPTEFURURfQUxQSEFfV0VCR0w7XG4gICAgfVxuICAgIGNvbnN0IGV0YzIgPSBnbC5nZXRFeHRlbnNpb24oJ1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9ldGMnKTtcbiAgICBpZiAoZXRjMikge1xuICAgICAgYmFzaXNDb21wcmVzc2lvblR5cGUgPSBCYXNpc0NvbXByZXNzaW9uVHlwZS5FVEMyO1xuICAgICAgY29tcHJlc3Npb25UeXBlID0gZXRjMi5DT01QUkVTU0VEX1JHQkE4X0VUQzJfRUFDO1xuICAgIH1cbiAgICBjb25zdCBwdnJ0YyA9XG4gICAgICBnbC5nZXRFeHRlbnNpb24oJ1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9wdnJ0YycpIHx8IGdsLmdldEV4dGVuc2lvbignV0VCS0lUX1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9wdnJ0YycpO1xuICAgIGlmIChwdnJ0Yykge1xuICAgICAgYmFzaXNDb21wcmVzc2lvblR5cGUgPSBCYXNpc0NvbXByZXNzaW9uVHlwZS5QVlJUQzFfUkdCQTtcbiAgICAgIGNvbXByZXNzaW9uVHlwZSA9IHB2cnRjLkNPTVBSRVNTRURfUkdCQV9QVlJUQ180QlBQVjFfSU1HO1xuICAgIH1cbiAgICBjb25zdCBhc3RjID0gZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfYXN0YycpO1xuICAgIGlmIChhc3RjKSB7XG4gICAgICBiYXNpc0NvbXByZXNzaW9uVHlwZSA9IEJhc2lzQ29tcHJlc3Npb25UeXBlLkFTVEM7XG4gICAgICBjb21wcmVzc2lvblR5cGUgPSBhc3RjLkNPTVBSRVNTRURfUkdCQV9BU1RDXzR4NF9LSFI7XG4gICAgfVxuXG4gICAgY29uc3QgbnVtSW1hZ2VzID0gYmFzaXNGaWxlLmdldE51bUltYWdlcygpO1xuICAgIGNvbnN0IG1pcG1hcERlcHRoID0gYmFzaXNGaWxlLmdldE51bUxldmVscygwKTtcblxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1MsIHdyYXBTLmluZGV4KTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfV1JBUF9ULCB3cmFwVC5pbmRleCk7XG4gICAgaWYgKG1pcG1hcERlcHRoID49IDIpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBtaW5GaWx0ZXIuaW5kZXgpO1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01BR19GSUxURVIsIG1hZ0ZpbHRlci5pbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBtaW5GaWx0ZXJfID0gbWluRmlsdGVyO1xuICAgICAgaWYgKG1pbkZpbHRlciA9PT0gVGV4dHVyZVBhcmFtZXRlci5MaW5lYXJNaXBtYXBMaW5lYXIpIHtcbiAgICAgICAgbWluRmlsdGVyXyA9IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyO1xuICAgICAgfVxuICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIG1pbkZpbHRlcl8uaW5kZXgpO1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01BR19GSUxURVIsIG1hZ0ZpbHRlci5pbmRleCk7XG4gICAgfVxuXG4gICAgLy8gR2V0IGJhc2UgbGV2ZWwgKG1pcG1hcCBsZXZlbCAwKSBkaW1lbnNpb25zXG4gICAgY29uc3QgYmFzZUxldmVsV2lkdGggPSBiYXNpc0ZpbGUuZ2V0SW1hZ2VXaWR0aCgwLCAwKTtcbiAgICBjb25zdCBiYXNlTGV2ZWxIZWlnaHQgPSBiYXNpc0ZpbGUuZ2V0SW1hZ2VIZWlnaHQoMCwgMCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1pcG1hcERlcHRoOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnVtSW1hZ2VzOyBqKyspIHtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBiYXNpc0ZpbGUuZ2V0SW1hZ2VXaWR0aChqLCBpKTtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gYmFzaXNGaWxlLmdldEltYWdlSGVpZ2h0KGosIGkpO1xuICAgICAgICBjb25zdCB0ZXh0dXJlU291cmNlID0gdGhpcy5kZWNvZGVCYXNpc0ltYWdlKGJhc2lzRmlsZSwgYmFzaXNDb21wcmVzc2lvblR5cGUhLCBqLCBpKTtcbiAgICAgICAgZ2wuY29tcHJlc3NlZFRleEltYWdlMkQoXG4gICAgICAgICAgZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YICsgaixcbiAgICAgICAgICBpLFxuICAgICAgICAgIGNvbXByZXNzaW9uVHlwZSEsXG4gICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgIGJvcmRlcixcbiAgICAgICAgICB0ZXh0dXJlU291cmNlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fX2dsdyEudW5iaW5kVGV4dHVyZUN1YmUoMTUpO1xuXG4gICAgcmV0dXJuIHsgcmVzb3VyY2VIYW5kbGUsIHdpZHRoOiBiYXNlTGV2ZWxXaWR0aCwgaGVpZ2h0OiBiYXNlTGV2ZWxIZWlnaHQgfTtcbiAgfVxuXG4gIGNyZWF0ZUR1bW15QmxhY2tDdWJlVGV4dHVyZShlbmdpbmU6IEVuZ2luZSkge1xuICAgIGNvbnN0IGJhc2U2NCA9ICdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZSNDJtTmtZUGovSHdBREJ3SUFNQ2JIWVFBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuICAgIGNvbnN0IGFycmF5QnVmZmVyID0gdGhpcy5fX2NyZWF0ZUR1bW15VGV4dHVyZUlubmVyKGJhc2U2NCk7XG4gICAgY29uc3QgdHlwZWRBcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVDdWJlVGV4dHVyZShcbiAgICAgIGVuZ2luZSxcbiAgICAgIDEsXG4gICAgICBbXG4gICAgICAgIHtcbiAgICAgICAgICBwb3NYOiB0eXBlZEFycmF5LFxuICAgICAgICAgIG5lZ1g6IHR5cGVkQXJyYXksXG4gICAgICAgICAgcG9zWTogdHlwZWRBcnJheSxcbiAgICAgICAgICBuZWdZOiB0eXBlZEFycmF5LFxuICAgICAgICAgIHBvc1o6IHR5cGVkQXJyYXksXG4gICAgICAgICAgbmVnWjogdHlwZWRBcnJheSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICAxLFxuICAgICAgMVxuICAgICk7XG4gIH1cblxuICBjcmVhdGVEdW1teUN1YmVUZXh0dXJlKGVuZ2luZTogRW5naW5lLCByZ2JhU3RyID0gJ3JnYmEoMCwwLDAsMSknKSB7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY2FudmFzLndpZHRoID0gMTtcbiAgICBjYW52YXMuaGVpZ2h0ID0gMTtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XG4gICAgY3R4LmZpbGxTdHlsZSA9IHJnYmFTdHI7XG4gICAgY3R4LmZpbGxSZWN0KDAsIDAsIDEsIDEpO1xuXG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlQ3ViZVRleHR1cmUoXG4gICAgICBlbmdpbmUsXG4gICAgICAxLFxuICAgICAgW1xuICAgICAgICB7XG4gICAgICAgICAgcG9zWDogY2FudmFzLFxuICAgICAgICAgIG5lZ1g6IGNhbnZhcyxcbiAgICAgICAgICBwb3NZOiBjYW52YXMsXG4gICAgICAgICAgbmVnWTogY2FudmFzLFxuICAgICAgICAgIHBvc1o6IGNhbnZhcyxcbiAgICAgICAgICBuZWdaOiBjYW52YXMsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgMSxcbiAgICAgIDFcbiAgICApO1xuICB9XG5cbiAgc2V0V2ViR0xUZXh0dXJlRGlyZWN0bHkod2ViR0xUZXh0dXJlOiBXZWJHTFRleHR1cmUpIHtcbiAgICBjb25zdCB0ZXh0dXJlID0gd2ViR0xUZXh0dXJlO1xuICAgIGNvbnN0IHJlc291cmNlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodGV4dHVyZSk7XG5cbiAgICByZXR1cm4gcmVzb3VyY2VIYW5kbGU7XG4gIH1cblxuICBhc3luYyBjcmVhdGVUZXh0dXJlRnJvbURhdGFVcmkoXG4gICAgZGF0YVVyaTogc3RyaW5nLFxuICAgIHtcbiAgICAgIGludGVybmFsRm9ybWF0LFxuICAgICAgZm9ybWF0LFxuICAgICAgdHlwZSxcbiAgICAgIGdlbmVyYXRlTWlwbWFwLFxuICAgIH06IHtcbiAgICAgIGludGVybmFsRm9ybWF0OiBUZXh0dXJlUGFyYW1ldGVyRW51bTtcbiAgICAgIGZvcm1hdDogUGl4ZWxGb3JtYXRFbnVtO1xuICAgICAgdHlwZTogQ29tcG9uZW50VHlwZUVudW07XG4gICAgICBnZW5lcmF0ZU1pcG1hcDogYm9vbGVhbjtcbiAgICB9XG4gICk6IFByb21pc2U8V2ViR0xSZXNvdXJjZUhhbmRsZT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxXZWJHTFJlc291cmNlSGFuZGxlPihyZXNvbHZlID0+IHtcbiAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgaWYgKCFkYXRhVXJpLm1hdGNoKC9eZGF0YTovKSkge1xuICAgICAgICBpbWcuY3Jvc3NPcmlnaW4gPSAnQW5vbnltb3VzJztcbiAgICAgIH1cbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gaW1nLndpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBpbWcuaGVpZ2h0O1xuXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLmNyZWF0ZVRleHR1cmVGcm9tSFRNTEltYWdlRWxlbWVudChpbWcsIHtcbiAgICAgICAgICBpbnRlcm5hbEZvcm1hdCxcbiAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgZ2VuZXJhdGVNaXBtYXAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc29sdmUodGV4dHVyZSk7XG4gICAgICB9O1xuXG4gICAgICBpbWcuc3JjID0gZGF0YVVyaTtcbiAgICB9KTtcbiAgfVxuXG4gIHVwZGF0ZUxldmVsMFRleHR1cmVBbmRHZW5lcmF0ZU1pcG1hcChcbiAgICB0ZXh0dXJlVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlLFxuICAgIHRleHR1cmVEYXRhOiBEaXJlY3RUZXh0dXJlRGF0YSxcbiAgICB7XG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIGZvcm1hdCxcbiAgICAgIHR5cGUsXG4gICAgfToge1xuICAgICAgd2lkdGg6IFNpemU7XG4gICAgICBoZWlnaHQ6IFNpemU7XG4gICAgICBmb3JtYXQ6IFBpeGVsRm9ybWF0RW51bTtcbiAgICAgIHR5cGU6IENvbXBvbmVudFR5cGVFbnVtO1xuICAgIH1cbiAgKSB7XG4gICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZSh0ZXh0dXJlVWlkKSBhcyBXZWJHTFRleHR1cmU7XG4gICAgdGhpcy5fX2dsdyEuYmluZFRleHR1cmUyRCgxNSwgdGV4dHVyZSk7XG5cbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGdsLnRleFN1YkltYWdlMkQoXG4gICAgICBnbC5URVhUVVJFXzJELFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBmb3JtYXQuaW5kZXgsXG4gICAgICB0eXBlLmluZGV4LFxuICAgICAgdGV4dHVyZURhdGEgYXMgYW55IGFzIEFycmF5QnVmZmVyVmlld1xuICAgICk7XG4gICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV8yRCk7XG4gICAgdGhpcy5fX2dsdyEudW5iaW5kVGV4dHVyZTJEKDE1KTtcbiAgfVxuXG4gIHVwZGF0ZVRleHR1cmUoXG4gICAgdGV4dHVyZVVpZDogV2ViR0xSZXNvdXJjZUhhbmRsZSxcbiAgICB0ZXh0dXJlRGF0YTogRGlyZWN0VGV4dHVyZURhdGEsXG4gICAge1xuICAgICAgbGV2ZWwsXG4gICAgICBvZmZzZXRYLFxuICAgICAgb2Zmc2V0WSxcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgZm9ybWF0LFxuICAgICAgdHlwZSxcbiAgICB9OiB7XG4gICAgICBsZXZlbDogSW5kZXg7XG4gICAgICBvZmZzZXRYOiBPZmZzZXQ7XG4gICAgICBvZmZzZXRZOiBPZmZzZXQ7XG4gICAgICB3aWR0aDogU2l6ZTtcbiAgICAgIGhlaWdodDogU2l6ZTtcbiAgICAgIGZvcm1hdDogUGl4ZWxGb3JtYXRFbnVtO1xuICAgICAgdHlwZTogQ29tcG9uZW50VHlwZUVudW07XG4gICAgfVxuICApIHtcbiAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHRleHR1cmVVaWQpIGFzIFdlYkdMVGV4dHVyZTtcblxuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlMkQoMTUsIHRleHR1cmUpO1xuXG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICBnbC50ZXhTdWJJbWFnZTJEKFxuICAgICAgZ2wuVEVYVFVSRV8yRCxcbiAgICAgIGxldmVsLFxuICAgICAgb2Zmc2V0WCxcbiAgICAgIG9mZnNldFksXG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIGZvcm1hdC5pbmRleCxcbiAgICAgIHR5cGUuaW5kZXgsXG4gICAgICB0ZXh0dXJlRGF0YSBhcyBhbnkgYXMgQXJyYXlCdWZmZXJWaWV3XG4gICAgKTtcbiAgICB0aGlzLl9fZ2x3IS51bmJpbmRUZXh0dXJlMkQoMTUpO1xuICB9XG5cbiAgZGVsZXRlRnJhbWVCdWZmZXJPYmplY3QoZnJhbWVCdWZmZXJPYmplY3RIYW5kbGU6IFdlYkdMUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBjb25zdCBmYm8gPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UoZnJhbWVCdWZmZXJPYmplY3RIYW5kbGUpIGFzIFdlYkdMRnJhbWVidWZmZXI7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG4gICAgaWYgKGZibyAhPSBudWxsKSB7XG4gICAgICBnbC5kZWxldGVGcmFtZWJ1ZmZlcihmYm8hKTtcbiAgICAgIHRoaXMuX193ZWJnbFJlc291cmNlcy5kZWxldGUoZnJhbWVCdWZmZXJPYmplY3RIYW5kbGUpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZVJlbmRlckJ1ZmZlcihyZW5kZXJCdWZmZXJVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcblxuICAgIGNvbnN0IHJlbmRlckJ1ZmZlciA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShyZW5kZXJCdWZmZXJVaWQpISBhcyBXZWJHTFJlbmRlcmJ1ZmZlcjtcbiAgICBnbC5kZWxldGVSZW5kZXJidWZmZXIocmVuZGVyQnVmZmVyKTtcbiAgICB0aGlzLl9fd2ViZ2xSZXNvdXJjZXMuZGVsZXRlKHJlbmRlckJ1ZmZlclVpZCk7XG4gIH1cblxuICBkZWxldGVUZXh0dXJlKHRleHR1cmVIYW5kbGU6IFdlYkdMUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHRleHR1cmVIYW5kbGUpIGFzIFdlYkdMVGV4dHVyZTtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcbiAgICBpZiAodGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBnbC5kZWxldGVUZXh0dXJlKHRleHR1cmUhKTtcbiAgICAgIHRoaXMuX193ZWJnbFJlc291cmNlcy5kZWxldGUodGV4dHVyZUhhbmRsZSk7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5kZWJ1ZyhgZ2wuZGVsZXRlVGV4dHVyZSBjYWxsZWQ6ICR7dGV4dHVyZUhhbmRsZX1gKTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVEdW1teVRleHR1cmUocmdiYVN0ciA9ICdyZ2JhKDI1NSwyNTUsMjU1LDEpJykge1xuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy53aWR0aCA9IDE7XG4gICAgY2FudmFzLmhlaWdodCA9IDE7XG4gICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykhO1xuICAgIGN0eC5maWxsU3R5bGUgPSByZ2JhU3RyO1xuICAgIGN0eC5maWxsUmVjdCgwLCAwLCAxLCAxKTtcblxuICAgIHJldHVybiB0aGlzLmNyZWF0ZVRleHR1cmVGcm9tSW1hZ2VCaXRtYXBEYXRhKGNhbnZhcywge1xuICAgICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVGb3JtYXQuUkdCQTgsXG4gICAgICB3aWR0aDogMSxcbiAgICAgIGhlaWdodDogMSxcbiAgICAgIGZvcm1hdDogUGl4ZWxGb3JtYXQuUkdCQSxcbiAgICAgIHR5cGU6IENvbXBvbmVudFR5cGUuVW5zaWduZWRCeXRlLFxuICAgICAgZ2VuZXJhdGVNaXBtYXA6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlRHVtbXlCbGFja1RleHR1cmUoKSB7XG4gICAgY29uc3QgYmFzZTY0ID0gJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlI0Mm1Oa1lQai9Id0FEQndJQU1DYkhZUUFBQUFCSlJVNUVya0pnZ2c9PSc7XG4gICAgcmV0dXJuIHRoaXMuX19jcmVhdGVEdW1teVRleHR1cmVJbm5lcihiYXNlNjQpO1xuICB9XG5cbiAgY3JlYXRlRHVtbXlXaGl0ZVRleHR1cmUoKSB7XG4gICAgY29uc3QgYmFzZTY0ID0gJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlI0Mm1QOC81L2hQd0FJQWdMLzRkMWo4d0FBQUFCSlJVNUVya0pnZ2c9PSc7XG4gICAgcmV0dXJuIHRoaXMuX19jcmVhdGVEdW1teVRleHR1cmVJbm5lcihiYXNlNjQpO1xuICB9XG5cbiAgY3JlYXRlRHVtbXlOb3JtYWxUZXh0dXJlKCkge1xuICAgIGNvbnN0IGJhc2U2NCA9ICdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZSNDJtT3NyLy8vSHdBR2dBTCt2MVJ1bUFBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuICAgIHJldHVybiB0aGlzLl9fY3JlYXRlRHVtbXlUZXh0dXJlSW5uZXIoYmFzZTY0KTtcbiAgfVxuXG4gIF9fY3JlYXRlRHVtbXlUZXh0dXJlSW5uZXIoYmFzZTY0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBhcnJheUJ1ZmZlciA9IERhdGFVdGlsLmJhc2U2NFRvQXJyYXlCdWZmZXIoYmFzZTY0KTtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVUZXh0dXJlRnJvbVR5cGVkQXJyYXkobmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpLCB7XG4gICAgICBpbnRlcm5hbEZvcm1hdDogVGV4dHVyZUZvcm1hdC5SR0JBOCxcbiAgICAgIHdpZHRoOiAxLFxuICAgICAgaGVpZ2h0OiAxLFxuICAgICAgZm9ybWF0OiBQaXhlbEZvcm1hdC5SR0JBLFxuICAgICAgdHlwZTogQ29tcG9uZW50VHlwZS5VbnNpZ25lZEJ5dGUsXG4gICAgICBnZW5lcmF0ZU1pcG1hcDogZmFsc2UsXG4gICAgfSk7XG4gIH1cblxuICBnZW5lcmF0ZU1pcG1hcHMyZCh0ZXh0dXJlSGFuZGxlOiBXZWJHTFJlc291cmNlSGFuZGxlLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmICghTWF0aFV0aWwuaXNQb3dlck9mVHdvVGV4dHVyZSh3aWR0aCwgaGVpZ2h0KSAmJiBNaXNjVXRpbC5pc0lPUygpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG4gICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZSh0ZXh0dXJlSGFuZGxlKSBhcyBXZWJHTFRleHR1cmU7XG4gICAgdGhpcy5fX2dsdyEuYmluZFRleHR1cmUyRCgxNSwgdGV4dHVyZSk7XG4gICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV8yRCk7XG4gICAgdGhpcy5fX2dsdyEudW5iaW5kVGV4dHVyZTJEKDE1KTtcbiAgfVxuXG4gIGdlbmVyYXRlTWlwbWFwc0N1YmUodGV4dHVyZUhhbmRsZTogV2ViR0xSZXNvdXJjZUhhbmRsZSwgX3dpZHRoOiBudW1iZXIsIF9oZWlnaHQ6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dCgpO1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UodGV4dHVyZUhhbmRsZSkgYXMgV2ViR0xUZXh0dXJlO1xuICAgIHRoaXMuX19nbHchLmJpbmRUZXh0dXJlQ3ViZSgxNSwgdGV4dHVyZSk7XG4gICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV9DVUJFX01BUCk7XG4gICAgdGhpcy5fX2dsdyEudW5iaW5kVGV4dHVyZUN1YmUoMTUpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VGV4dHVyZVBpeGVsRGF0YShcbiAgICBfdGV4dHVyZUhhbmRsZTogV2ViR0xSZXNvdXJjZUhhbmRsZSxcbiAgICB3aWR0aDogbnVtYmVyLFxuICAgIGhlaWdodDogbnVtYmVyLFxuICAgIGZyYW1lQnVmZmVyVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlLFxuICAgIGNvbG9yQXR0YWNobWVudEluZGV4OiBudW1iZXJcbiAgKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG5cbiAgICAvLyBDcmVhdGUgYSBmcmFtZWJ1ZmZlciBiYWNrZWQgYnkgdGhlIHRleHR1cmVcbiAgICBjb25zdCBmYm8gPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UoZnJhbWVCdWZmZXJVaWQpIGFzIFdlYkdMRnJhbWVidWZmZXI7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBmYm8pO1xuXG4gICAgLy8gUmVhZCB0aGUgY29udGVudHMgb2YgdGhlIGZyYW1lYnVmZmVyIChkYXRhIHN0b3JlcyB0aGUgcGl4ZWwgZGF0YSlcbiAgICBjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkod2lkdGggKiBoZWlnaHQgKiA0KTtcbiAgICBpZiAoKGdsIGFzIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpLnJlYWRCdWZmZXIgIT0gbnVsbCkge1xuICAgICAgKGdsIGFzIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpLnJlYWRCdWZmZXIoMzYwNjQgKyBjb2xvckF0dGFjaG1lbnRJbmRleCk7IC8vIDM2MDY0IG1lYW5zIGdsLkNPTE9SX0FUVEFDSE1FTlQwXG4gICAgfVxuICAgIGdsLnJlYWRQaXhlbHMoMCwgMCwgd2lkdGgsIGhlaWdodCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgZGF0YSk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogUmVhZHMgcGl4ZWwgZGF0YSBmcm9tIGEgc3BlY2lmaWMgZmFjZSBvZiBhIGN1YmUgdGV4dHVyZS5cbiAgICogVGhpcyBjcmVhdGVzIGEgdGVtcG9yYXJ5IGZyYW1lYnVmZmVyLCBhdHRhY2hlcyB0aGUgY3ViZSBmYWNlLCBhbmQgcmVhZHMgdGhlIHBpeGVscy5cbiAgICogRm9yIGZsb2F0aW5nLXBvaW50IHRleHR1cmVzIChIRFIpLCBpdCB1c2VzIGEgc2hhZGVyLWJhc2VkIGFwcHJvYWNoIHRvIHNhbXBsZSBhbmQgY29udmVydC5cbiAgICpcbiAgICogQHBhcmFtIHRleHR1cmVIYW5kbGUgLSBIYW5kbGUgdG8gdGhlIGN1YmUgdGV4dHVyZVxuICAgKiBAcGFyYW0gd2lkdGggLSBXaWR0aCBvZiB0aGUgZmFjZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBoZWlnaHQgLSBIZWlnaHQgb2YgdGhlIGZhY2UgdGV4dHVyZVxuICAgKiBAcGFyYW0gZmFjZUluZGV4IC0gSW5kZXggb2YgdGhlIGN1YmUgZmFjZSAoMD0rWCwgMT0tWCwgMj0rWSwgMz0tWSwgND0rWiwgNT0tWilcbiAgICogQHJldHVybnMgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIHBpeGVsIGRhdGEgYXMgYSBVaW50OEFycmF5IChSR0JBIGZvcm1hdClcbiAgICovXG4gIGFzeW5jIGdldEN1YmVUZXh0dXJlUGl4ZWxEYXRhKFxuICAgIHRleHR1cmVIYW5kbGU6IFdlYkdMUmVzb3VyY2VIYW5kbGUsXG4gICAgd2lkdGg6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBmYWNlSW5kZXg6IG51bWJlclxuICApOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKSBhcyBXZWJHTDJSZW5kZXJpbmdDb250ZXh0O1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UodGV4dHVyZUhhbmRsZSkgYXMgV2ViR0xUZXh0dXJlO1xuXG4gICAgLy8gQ3JlYXRlIGEgdGVtcG9yYXJ5IGZyYW1lYnVmZmVyXG4gICAgY29uc3QgZmJvID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGZibyk7XG5cbiAgICAvLyBBdHRhY2ggdGhlIGN1YmUgZmFjZSB0byB0aGUgZnJhbWVidWZmZXJcbiAgICAvLyBmYWNlSW5kZXg6IDA9K1gsIDE9LVgsIDI9K1ksIDM9LVksIDQ9K1osIDU9LVpcbiAgICBjb25zdCBjdWJlRmFjZVRhcmdldCA9IGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCArIGZhY2VJbmRleDtcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGN1YmVGYWNlVGFyZ2V0LCB0ZXh0dXJlLCAwKTtcblxuICAgIC8vIENoZWNrIGZyYW1lYnVmZmVyIHN0YXR1c1xuICAgIGNvbnN0IHN0YXR1cyA9IGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpO1xuICAgIGlmIChzdGF0dXMgIT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgICAgZ2wuZGVsZXRlRnJhbWVidWZmZXIoZmJvKTtcblxuICAgICAgLy8gRnJhbWVidWZmZXIgaW5jb21wbGV0ZSAtIHVzZSBzaGFkZXItYmFzZWQgYXBwcm9hY2ggZm9yIEhEUiBjdWJlbWFwc1xuICAgICAgLy8gV2hlbiBmcmFtZWJ1ZmZlciBhdHRhY2htZW50IGZhaWxzLCBpdCdzIHR5cGljYWxseSBiZWNhdXNlIHRoZSB0ZXh0dXJlIGlzIGEgZmxvYXRpbmctcG9pbnQgKEhEUikgZm9ybWF0XG4gICAgICAvLyB0aGF0IGNhbm5vdCBiZSBkaXJlY3RseSBhdHRhY2hlZCBmb3IgcmVhZGluZywgc28gd2UgYXNzdW1lIGlzSGRyRm9ybWF0ID0gdHJ1ZVxuICAgICAgcmV0dXJuIHRoaXMuX19yZWFkQ3ViZVRleHR1cmVXaXRoU2hhZGVyKGdsLCB0ZXh0dXJlLCB3aWR0aCwgaGVpZ2h0LCBmYWNlSW5kZXgsIHRydWUpO1xuICAgIH1cblxuICAgIC8vIFJlYWQgdGhlIHBpeGVsIGRhdGEgZGlyZWN0bHkgKGZvciBub24tZmxvYXRpbmctcG9pbnQgdGV4dHVyZXMpXG4gICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KHdpZHRoICogaGVpZ2h0ICogNCk7XG4gICAgZ2wucmVhZFBpeGVscygwLCAwLCB3aWR0aCwgaGVpZ2h0LCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBkYXRhKTtcblxuICAgIC8vIENsZWFudXBcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKGZibyk7XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyBjdWJlIHRleHR1cmUgZGF0YSB1c2luZyBhIHNoYWRlci1iYXNlZCBhcHByb2FjaC5cbiAgICogVGhpcyBpcyB1c2VkIGZvciBIRFIvZmxvYXQgdGV4dHVyZXMgdGhhdCBjYW5ub3QgYmUgcmVhZCBkaXJlY3RseS5cbiAgICpcbiAgICogQHBhcmFtIGdsIC0gV2ViR0wyIHJlbmRlcmluZyBjb250ZXh0XG4gICAqIEBwYXJhbSBjdWJlVGV4dHVyZSAtIFRoZSBjdWJlIHRleHR1cmUgdG8gcmVhZCBmcm9tXG4gICAqIEBwYXJhbSB3aWR0aCAtIFdpZHRoIG9mIHRoZSBmYWNlIHRleHR1cmVcbiAgICogQHBhcmFtIGhlaWdodCAtIEhlaWdodCBvZiB0aGUgZmFjZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBmYWNlSW5kZXggLSBJbmRleCBvZiB0aGUgY3ViZSBmYWNlICgwPStYLCAxPS1YLCAyPStZLCAzPS1ZLCA0PStaLCA1PS1aKVxuICAgKiBAcGFyYW0gaXNIZHJGb3JtYXQgLSBXaGV0aGVyIHRoZSB0ZXh0dXJlIGlzIEhEUiBmb3JtYXQgKGFwcGxpZXMgdG9uZSBtYXBwaW5nIGFuZCBnYW1tYSBjb3JyZWN0aW9uIGlmIHRydWUpXG4gICAqL1xuICBwcml2YXRlIF9fcmVhZEN1YmVUZXh0dXJlV2l0aFNoYWRlcihcbiAgICBnbDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dCxcbiAgICBjdWJlVGV4dHVyZTogV2ViR0xUZXh0dXJlLFxuICAgIHdpZHRoOiBudW1iZXIsXG4gICAgaGVpZ2h0OiBudW1iZXIsXG4gICAgZmFjZUluZGV4OiBudW1iZXIsXG4gICAgaXNIZHJGb3JtYXQ6IGJvb2xlYW5cbiAgKTogVWludDhBcnJheSB7XG4gICAgLy8gU2F2ZSBhbGwgV2ViR0wgc3RhdGUgdGhhdCB3ZSdsbCBtb2RpZnlcbiAgICBjb25zdCBwcmV2Vmlld3BvcnQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVklFV1BPUlQpO1xuICAgIGNvbnN0IHByZXZQcm9ncmFtID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNVUlJFTlRfUFJPR1JBTSk7XG4gICAgY29uc3QgcHJldlZBTyA9IGdsLmdldFBhcmFtZXRlcihnbC5WRVJURVhfQVJSQVlfQklORElORyk7XG4gICAgY29uc3QgcHJldkFycmF5QnVmZmVyID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HKTtcbiAgICBjb25zdCBwcmV2RnJhbWVidWZmZXIgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuRlJBTUVCVUZGRVJfQklORElORyk7XG4gICAgY29uc3QgcHJldkFjdGl2ZVRleHR1cmUgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpO1xuICAgIGNvbnN0IHByZXZUZXh0dXJlQ3ViZU1hcCA9IGdsLmdldFBhcmFtZXRlcihnbC5URVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVApO1xuICAgIGNvbnN0IHByZXZUZXh0dXJlMkQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVEVYVFVSRV9CSU5ESU5HXzJEKTtcblxuICAgIC8vIENyZWF0ZSBzaGFkZXIgcHJvZ3JhbSBmb3Igc2FtcGxpbmcgY3ViZW1hcFxuICAgIGNvbnN0IHZlcnRleFNoYWRlclNvdXJjZSA9IGAjdmVyc2lvbiAzMDAgZXNcbiAgICAgIGluIHZlYzIgYV9wb3NpdGlvbjtcbiAgICAgIG91dCB2ZWMyIHZfdGV4Q29vcmQ7XG4gICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgIHZfdGV4Q29vcmQgPSBhX3Bvc2l0aW9uICogMC41ICsgMC41O1xuICAgICAgICBnbF9Qb3NpdGlvbiA9IHZlYzQoYV9wb3NpdGlvbiwgMC4wLCAxLjApO1xuICAgICAgfVxuICAgIGA7XG5cbiAgICBjb25zdCBmcmFnbWVudFNoYWRlclNvdXJjZSA9IGAjdmVyc2lvbiAzMDAgZXNcbiAgICAgIHByZWNpc2lvbiBoaWdocCBmbG9hdDtcbiAgICAgIHVuaWZvcm0gc2FtcGxlckN1YmUgdV9jdWJlbWFwO1xuICAgICAgdW5pZm9ybSBpbnQgdV9mYWNlSW5kZXg7XG4gICAgICB1bmlmb3JtIGludCB1X2lzSGRyO1xuICAgICAgaW4gdmVjMiB2X3RleENvb3JkO1xuICAgICAgb3V0IHZlYzQgZnJhZ0NvbG9yO1xuXG4gICAgICB2ZWMzIGdldERpcmVjdGlvbihpbnQgZmFjZSwgdmVjMiB1dikge1xuICAgICAgICB2ZWMyIHN0ID0gdXYgKiAyLjAgLSAxLjA7XG4gICAgICAgIGlmIChmYWNlID09IDApIHJldHVybiB2ZWMzKCAxLjAsIC1zdC55LCAtc3QueCk7IC8vICtYXG4gICAgICAgIGlmIChmYWNlID09IDEpIHJldHVybiB2ZWMzKC0xLjAsIC1zdC55LCAgc3QueCk7IC8vIC1YXG4gICAgICAgIGlmIChmYWNlID09IDIpIHJldHVybiB2ZWMzKCBzdC54LCAgMS4wLCAgc3QueSk7IC8vICtZXG4gICAgICAgIGlmIChmYWNlID09IDMpIHJldHVybiB2ZWMzKCBzdC54LCAtMS4wLCAtc3QueSk7IC8vIC1ZXG4gICAgICAgIGlmIChmYWNlID09IDQpIHJldHVybiB2ZWMzKCBzdC54LCAtc3QueSwgIDEuMCk7IC8vICtaXG4gICAgICAgIHJldHVybiB2ZWMzKC1zdC54LCAtc3QueSwgLTEuMCk7IC8vIC1aXG4gICAgICB9XG5cbiAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgdmVjMyBkaXIgPSBub3JtYWxpemUoZ2V0RGlyZWN0aW9uKHVfZmFjZUluZGV4LCB2X3RleENvb3JkKSk7XG4gICAgICAgIHZlYzMgY29sb3IgPSB0ZXh0dXJlKHVfY3ViZW1hcCwgZGlyKS5yZ2I7XG5cbiAgICAgICAgLy8gT25seSBhcHBseSB0b25lIG1hcHBpbmcgYW5kIGdhbW1hIGNvcnJlY3Rpb24gZm9yIEhEUiB0ZXh0dXJlc1xuICAgICAgICAvLyBMRFIgdGV4dHVyZXMgKGUuZy4sIFJHQkE4KSBzaG91bGQgcGFzcyB0aHJvdWdoIHVuY2hhbmdlZFxuICAgICAgICBpZiAodV9pc0hkciAhPSAwKSB7XG4gICAgICAgICAgLy8gUmVpbmhhcmQgdG9uZSBtYXBwaW5nXG4gICAgICAgICAgY29sb3IgPSBjb2xvciAvICgxLjAgKyBjb2xvcik7XG5cbiAgICAgICAgICAvLyBHYW1tYSBjb3JyZWN0aW9uXG4gICAgICAgICAgY29sb3IgPSBwb3coY29sb3IsIHZlYzMoMS4wIC8gMi4yKSk7XG4gICAgICAgIH1cblxuICAgICAgICBmcmFnQ29sb3IgPSB2ZWM0KGNvbG9yLCAxLjApO1xuICAgICAgfVxuICAgIGA7XG5cbiAgICAvLyBDb21waWxlIHNoYWRlcnNcbiAgICBjb25zdCB2ZXJ0ZXhTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUikhO1xuICAgIGdsLnNoYWRlclNvdXJjZSh2ZXJ0ZXhTaGFkZXIsIHZlcnRleFNoYWRlclNvdXJjZSk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpO1xuXG4gICAgY29uc3QgZnJhZ21lbnRTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSKSE7XG4gICAgZ2wuc2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyLCBmcmFnbWVudFNoYWRlclNvdXJjZSk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcihmcmFnbWVudFNoYWRlcik7XG5cbiAgICBjb25zdCBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpITtcbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdmVydGV4U2hhZGVyKTtcbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnJhZ21lbnRTaGFkZXIpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuXG4gICAgLy8gQ3JlYXRlIGEgZGVkaWNhdGVkIFZBTyBmb3Igb3VyIHF1YWQgcmVuZGVyaW5nXG4gICAgY29uc3QgdmFvID0gZ2wuY3JlYXRlVmVydGV4QXJyYXkoKTtcbiAgICBnbC5iaW5kVmVydGV4QXJyYXkodmFvKTtcblxuICAgIC8vIENyZWF0ZSBmdWxsc2NyZWVuIHF1YWRcbiAgICBjb25zdCBxdWFkQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHF1YWRCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KFstMSwgLTEsIDEsIC0xLCAtMSwgMSwgMSwgMV0pLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICBjb25zdCBwb3NpdGlvbkxvYyA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sICdhX3Bvc2l0aW9uJyk7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkocG9zaXRpb25Mb2MpO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocG9zaXRpb25Mb2MsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICAvLyBDcmVhdGUgcmVuZGVyIHRhcmdldFxuICAgIGNvbnN0IHJlbmRlclRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgcmVuZGVyVGV4dHVyZSk7XG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBOCwgd2lkdGgsIGhlaWdodCwgMCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgbnVsbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLkxJTkVBUik7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XG5cbiAgICBjb25zdCBmYm8gPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZmJvKTtcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHJlbmRlclRleHR1cmUsIDApO1xuXG4gICAgLy8gUmVuZGVyXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgZ2wudXNlUHJvZ3JhbShwcm9ncmFtKTtcblxuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGN1YmVUZXh0dXJlKTtcbiAgICBnbC51bmlmb3JtMWkoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sICd1X2N1YmVtYXAnKSwgMCk7XG4gICAgZ2wudW5pZm9ybTFpKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCAndV9mYWNlSW5kZXgnKSwgZmFjZUluZGV4KTtcbiAgICBnbC51bmlmb3JtMWkoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sICd1X2lzSGRyJyksIGlzSGRyRm9ybWF0ID8gMSA6IDApO1xuXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgMCwgNCk7XG5cbiAgICAvLyBSZWFkIHBpeGVsc1xuICAgIGNvbnN0IGRhdGEgPSBuZXcgVWludDhBcnJheSh3aWR0aCAqIGhlaWdodCAqIDQpO1xuICAgIGdsLnJlYWRQaXhlbHMoMCwgMCwgd2lkdGgsIGhlaWdodCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgZGF0YSk7XG5cbiAgICAvLyBDbGVhbnVwIHJlc291cmNlc1xuICAgIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKGZibyk7XG4gICAgZ2wuZGVsZXRlVGV4dHVyZShyZW5kZXJUZXh0dXJlKTtcbiAgICBnbC5kZWxldGVCdWZmZXIocXVhZEJ1ZmZlcik7XG4gICAgZ2wuZGVsZXRlVmVydGV4QXJyYXkodmFvKTtcbiAgICBnbC5kZWxldGVQcm9ncmFtKHByb2dyYW0pO1xuICAgIGdsLmRlbGV0ZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpO1xuICAgIGdsLmRlbGV0ZVNoYWRlcihmcmFnbWVudFNoYWRlcik7XG5cbiAgICAvLyBSZXN0b3JlIGFsbCBXZWJHTCBzdGF0ZVxuICAgIGdsLmJpbmRWZXJ0ZXhBcnJheShwcmV2VkFPKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcHJldkFycmF5QnVmZmVyKTtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHByZXZGcmFtZWJ1ZmZlcik7XG4gICAgZ2wuYWN0aXZlVGV4dHVyZShwcmV2QWN0aXZlVGV4dHVyZSk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgcHJldlRleHR1cmVDdWJlTWFwKTtcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBwcmV2VGV4dHVyZTJEKTtcbiAgICBnbC51c2VQcm9ncmFtKHByZXZQcm9ncmFtKTtcbiAgICBnbC52aWV3cG9ydChwcmV2Vmlld3BvcnRbMF0sIHByZXZWaWV3cG9ydFsxXSwgcHJldlZpZXdwb3J0WzJdLCBwcmV2Vmlld3BvcnRbM10pO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBjcmVhdGVVbmlmb3JtQnVmZmVyKCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG5cbiAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgc2V0IGFzIERlZmF1bHQuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgdWJvID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh1Ym8hKTtcblxuICAgIHJldHVybiByZXNvdXJjZUhhbmRsZTtcbiAgfVxuXG4gIGNyZWF0ZVVuaWZvcm1CdWZmZXJXaXRoQnVmZmVyVmlldyhidWZmZXJWaWV3OiBUeXBlZEFycmF5IHwgRGF0YVZpZXcpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuXG4gICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gV2ViR0xSZW5kZXJpbmdDb250ZXh0IHNldCBhcyBEZWZhdWx0LicpO1xuICAgIH1cblxuICAgIGNvbnN0IHVibyA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGNvbnN0IHJlc291cmNlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodWJvISk7XG5cbiAgICBnbC5iaW5kQnVmZmVyKGdsLlVOSUZPUk1fQlVGRkVSLCB1Ym8pO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuVU5JRk9STV9CVUZGRVIsIGJ1ZmZlclZpZXcsIGdsLkRZTkFNSUNfRFJBVyk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5VTklGT1JNX0JVRkZFUiwgbnVsbCk7XG5cbiAgICByZXR1cm4gcmVzb3VyY2VIYW5kbGU7XG4gIH1cblxuICB1cGRhdGVVbmlmb3JtQnVmZmVyKHVib1VpZDogV2ViR0xSZXNvdXJjZUhhbmRsZSwgdHlwZWRBcnJheTogVHlwZWRBcnJheSwgb2Zmc2V0Qnl0ZTogQnl0ZSwgYXJyYXlMZW5ndGg6IEJ5dGUpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGNvbnN0IHVibyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZSh1Ym9VaWQpIGFzIFdlYkdMQnVmZmVyO1xuXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5VTklGT1JNX0JVRkZFUiwgdWJvKTtcbiAgICBnbC5idWZmZXJTdWJEYXRhKGdsLlVOSUZPUk1fQlVGRkVSLCAwLCB0eXBlZEFycmF5LCBvZmZzZXRCeXRlLCBhcnJheUxlbmd0aCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5VTklGT1JNX0JVRkZFUiwgbnVsbCk7XG4gIH1cblxuICBiaW5kVW5pZm9ybUJsb2NrKHNoYWRlclByb2dyYW1VaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUsIGJsb2NrTmFtZTogc3RyaW5nLCBibG9ja0luZGV4OiBJbmRleCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG5cbiAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgc2V0IGFzIERlZmF1bHQuJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2hhZGVyUHJvZ3JhbSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShzaGFkZXJQcm9ncmFtVWlkKSEgYXMgV2ViR0xQcm9ncmFtO1xuXG4gICAgY29uc3QgYmxvY2sgPSBnbC5nZXRVbmlmb3JtQmxvY2tJbmRleChzaGFkZXJQcm9ncmFtLCBibG9ja05hbWUpO1xuICAgIGdsLnVuaWZvcm1CbG9ja0JpbmRpbmcoc2hhZGVyUHJvZ3JhbSwgYmxvY2ssIGJsb2NrSW5kZXgpO1xuICB9XG5cbiAgYmluZFVuaWZvcm1CdWZmZXJCYXNlKGJsb2NrSW5kZXg6IEluZGV4LCB1Ym9VaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuXG4gICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gV2ViR0xSZW5kZXJpbmdDb250ZXh0IHNldCBhcyBEZWZhdWx0LicpO1xuICAgIH1cblxuICAgIGNvbnN0IHVibyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZSh1Ym9VaWQpISBhcyBXZWJHTEJ1ZmZlcjtcblxuICAgIGdsLmJpbmRCdWZmZXJCYXNlKGdsLlVOSUZPUk1fQlVGRkVSLCBibG9ja0luZGV4LCB1Ym8pO1xuICB9XG5cbiAgZGVsZXRlVW5pZm9ybUJ1ZmZlcih1Ym9VaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHQoKTtcblxuICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICBuZXcgRXJyb3IoJ05vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCBzZXQgYXMgRGVmYXVsdC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCB1Ym8gPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UodWJvVWlkKSEgYXMgV2ViR0xCdWZmZXI7XG4gICAgdGhpcy5fX3dlYmdsUmVzb3VyY2VzLmRlbGV0ZSh1Ym9VaWQpO1xuXG4gICAgZ2wuZGVsZXRlQnVmZmVyKHVibyk7XG4gIH1cblxuICBzZXR1cFVuaWZvcm1CdWZmZXJEYXRhQXJlYSh0eXBlZEFycmF5PzogVHlwZWRBcnJheSkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG5cbiAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgbmV3IEVycm9yKCdObyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgc2V0IGFzIERlZmF1bHQuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgdWJvID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgY29uc3QgcmVzb3VyY2VIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh1Ym8hKTtcblxuICAgIGNvbnN0IG1heENvbnZlbnRpb25CbG9ja3MgPSB0aGlzLl9fZ2x3IS5nZXRNYXhDb252ZW50aW9uVW5pZm9ybUJsb2NrcygpO1xuICAgIGNvbnN0IGFsaWduZWRNYXhVbmlmb3JtQmxvY2tTaXplID0gdGhpcy5fX2dsdyEuZ2V0QWxpZ25lZE1heFVuaWZvcm1CbG9ja1NpemUoKTtcbiAgICBjb25zdCByZWFsU2l6ZSA9IGFsaWduZWRNYXhVbmlmb3JtQmxvY2tTaXplICogbWF4Q29udmVudGlvbkJsb2NrcztcbiAgICBjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkocmVhbFNpemUgLyA0KTtcbiAgICBpZiAoSXMuZXhpc3QodHlwZWRBcnJheSkpIHtcbiAgICAgIGFycmF5LnNldCh0eXBlZEFycmF5LnN1YmFycmF5KDAsIGFycmF5Lmxlbmd0aCkpO1xuICAgIH1cbiAgICBnbC5iaW5kQnVmZmVyKGdsLlVOSUZPUk1fQlVGRkVSLCB1Ym8pO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuVU5JRk9STV9CVUZGRVIsIGFycmF5LCBnbC5EWU5BTUlDX0RSQVcsIDAsIDApO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhDb252ZW50aW9uQmxvY2tzOyBpKyspIHtcbiAgICAgIGdsLmJpbmRCdWZmZXJSYW5nZShnbC5VTklGT1JNX0JVRkZFUiwgaSwgdWJvLCBhbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZSAqIGksIGFsaWduZWRNYXhVbmlmb3JtQmxvY2tTaXplKTtcbiAgICB9XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5VTklGT1JNX0JVRkZFUiwgbnVsbCk7XG5cbiAgICByZXR1cm4gcmVzb3VyY2VIYW5kbGU7XG4gIH1cblxuICBzZXRVbmlmb3JtQmxvY2tCaW5kaW5nRm9yTW9ycGhPZmZzZXRzQW5kV2VpZ2h0cyhcbiAgICBzaGFkZXJQcm9ncmFtVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlLFxuICAgIG1vcnBoT2Zmc2V0c1VCT1VpZDogV2ViR0xSZXNvdXJjZUhhbmRsZSxcbiAgICBtb3JwaFdlaWdodHNVQk9VaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGVcbiAgKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICBjb25zdCBzaGFkZXJQcm9ncmFtID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHNoYWRlclByb2dyYW1VaWQpISBhcyBXZWJHTFByb2dyYW07XG4gICAgY29uc3QgbW9ycGhPZmZzZXRzVUJPID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKG1vcnBoT2Zmc2V0c1VCT1VpZCkhIGFzIFdlYkdMQnVmZmVyO1xuICAgIGNvbnN0IG1vcnBoV2VpZ2h0c1VCTyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShtb3JwaFdlaWdodHNVQk9VaWQpISBhcyBXZWJHTEJ1ZmZlcjtcbiAgICBjb25zdCBibG9ja09mT2Zmc2V0cyA9IGdsLmdldFVuaWZvcm1CbG9ja0luZGV4KHNoYWRlclByb2dyYW0sICdVbmlmb3JtTW9ycGhPZmZzZXRzJyk7XG4gICAgY29uc3QgYmxvY2tPZldlaWdodHMgPSBnbC5nZXRVbmlmb3JtQmxvY2tJbmRleChzaGFkZXJQcm9ncmFtLCAnVW5pZm9ybU1vcnBoV2VpZ2h0cycpO1xuICAgIGdsLnVuaWZvcm1CbG9ja0JpbmRpbmcoc2hhZGVyUHJvZ3JhbSwgYmxvY2tPZk9mZnNldHMsIDApO1xuICAgIGdsLnVuaWZvcm1CbG9ja0JpbmRpbmcoc2hhZGVyUHJvZ3JhbSwgYmxvY2tPZldlaWdodHMsIDEpO1xuICAgIGdsLmJpbmRCdWZmZXJCYXNlKGdsLlVOSUZPUk1fQlVGRkVSLCAwLCBtb3JwaE9mZnNldHNVQk8pO1xuICAgIGdsLmJpbmRCdWZmZXJCYXNlKGdsLlVOSUZPUk1fQlVGRkVSLCAxLCBtb3JwaFdlaWdodHNVQk8pO1xuICB9XG5cbiAgc2V0VW5pZm9ybUJsb2NrQmluZGluZ0Zvck1vcnBoT2Zmc2V0c0FuZFdlaWdodHNXaXRob3V0U2hhZGVyUHJvZ3JhbShcbiAgICBtb3JwaE9mZnNldHNVQk9VaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUsXG4gICAgbW9ycGhXZWlnaHRzVUJPVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlXG4gICkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3QgbW9ycGhPZmZzZXRzVUJPID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKG1vcnBoT2Zmc2V0c1VCT1VpZCkhIGFzIFdlYkdMQnVmZmVyO1xuICAgIGNvbnN0IG1vcnBoV2VpZ2h0c1VCTyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShtb3JwaFdlaWdodHNVQk9VaWQpISBhcyBXZWJHTEJ1ZmZlcjtcbiAgICBnbC5iaW5kQnVmZmVyQmFzZShnbC5VTklGT1JNX0JVRkZFUiwgMCwgbW9ycGhPZmZzZXRzVUJPKTtcbiAgICBnbC5iaW5kQnVmZmVyQmFzZShnbC5VTklGT1JNX0JVRkZFUiwgMSwgbW9ycGhXZWlnaHRzVUJPKTtcbiAgfVxuXG4gIGdldEdsc2xSZW5kZXJUYXJnZXRCZWdpblN0cmluZyhyZW5kZXJUYXJnZXROdW1iZXI6IG51bWJlcikge1xuICAgIGxldCB0ZXh0ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJUYXJnZXROdW1iZXI7IGkrKykge1xuICAgICAgdGV4dCArPSBgbGF5b3V0KGxvY2F0aW9uID0gJHtpfSkgb3V0IHZlYzQgcnQke2l9O2A7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBnZXRHbHNsRGF0YVVCT0RlZmluaXRpb25TdHJpbmcoKTogc3RyaW5nIHtcbiAgICBsZXQgdGV4dCA9ICcnO1xuICAgIGNvbnN0IG1heENvbnZlbnRpb25ibG9ja3MgPSB0aGlzLl9fZ2x3IS5nZXRNYXhDb252ZW50aW9uVW5pZm9ybUJsb2NrcygpO1xuICAgIGNvbnN0IGFsaWduZWRNYXhVbmlmb3JtQmxvY2tTaXplID0gdGhpcy5fX2dsdyEuZ2V0QWxpZ25lZE1heFVuaWZvcm1CbG9ja1NpemUoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heENvbnZlbnRpb25ibG9ja3M7IGkrKykge1xuICAgICAgdGV4dCArPSBgXG5sYXlvdXQgKHN0ZDE0MCkgdW5pZm9ybSBWZWM0QmxvY2ske2l9IHtcbiAgdmVjNCB2ZWM0QmxvY2ske2l9WyR7YWxpZ25lZE1heFVuaWZvcm1CbG9ja1NpemUgLyA0IC8gNH1dO1xufTtcbmA7XG4gICAgfVxuXG4gICAgdGV4dCArPSBgXG52ZWM0IGZldGNoVmVjNEZyb21WZWM0QmxvY2soaW50IHZlYzRJZHgpIHtcbiAgaW50IHZlYzRJZHhGb3JFYWNoQmxvY2sgPSB2ZWM0SWR4ICUgZGF0YVVCT1ZlYzRTaXplO1xuICBpZiAodmVjNElkeCA8IGRhdGFVQk9WZWM0U2l6ZSkge1xuICAgIHJldHVybiB2ZWM0QmxvY2swW3ZlYzRJZHhGb3JFYWNoQmxvY2tdO1xuICB9YDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IG1heENvbnZlbnRpb25ibG9ja3M7IGkrKykge1xuICAgICAgdGV4dCArPSBgXG4gZWxzZSBpZiAodmVjNElkeCA8IGRhdGFVQk9WZWM0U2l6ZSAqICR7aSArIDF9KSB7XG4gICAgcmV0dXJuIHZlYzRCbG9jayR7aX1bdmVjNElkeEZvckVhY2hCbG9ja107XG59YDtcbiAgICB9XG4gICAgdGV4dCArPSAnfVxcbic7XG5cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIGdldEdsc2xEYXRhVUJPVmVjNFNpemVTdHJpbmcoKTogc3RyaW5nIHtcbiAgICBjb25zdCBhbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZSA9IHRoaXMuX19nbHchLmdldEFsaWduZWRNYXhVbmlmb3JtQmxvY2tTaXplKCk7XG4gICAgcmV0dXJuIGBjb25zdCBpbnQgZGF0YVVCT1ZlYzRTaXplID0gJHthbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZSAvIDQgLyA0fTtgO1xuICB9XG5cbiAgY3JlYXRlTXVsdGl2aWV3RnJhbWVidWZmZXIoXG4gICAgd2lkdGg6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBzYW1wbGVzOiBudW1iZXJcbiAgKTogW1dlYkdMUmVzb3VyY2VIYW5kbGUsIFdlYkdMUmVzb3VyY2VIYW5kbGVdIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KHRoaXMuX19nbHchLndlYmdsMkV4dE1MVFZJRVcpKSB7XG4gICAgICByZXR1cm4gWy0xLCAtMV07XG4gICAgfVxuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3QgZnJhbWVidWZmZXIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgIGNvbnN0IGZyYW1lYnVmZmVySGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UoZnJhbWVidWZmZXIhKTtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5EUkFXX0ZSQU1FQlVGRkVSLCBmcmFtZWJ1ZmZlcik7XG5cbiAgICAvLyBjb2xvciB0ZXh0dXJlIC8gYXR0YWNobWVudFxuICAgIGNvbnN0IGNvbG9yVGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKSE7XG4gICAgY29uc3QgY29sb3JUZXh0dXJlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UoY29sb3JUZXh0dXJlKTtcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJEX0FSUkFZLCBjb2xvclRleHR1cmUpO1xuICAgIGdsLnRleFN0b3JhZ2UzRChnbC5URVhUVVJFXzJEX0FSUkFZLCAxLCBnbC5SR0JBOCwgd2lkdGgsIGhlaWdodCwgMik7XG4gICAgaWYgKCF0aGlzLl9fZ2x3IS53ZWJnbDJFeHRNTFRWSUVXLmlzX211bHRpc2FtcGxlKVxuICAgICAgdGhpcy5fX2dsdyEud2ViZ2wyRXh0TUxUVklFVy5mcmFtZWJ1ZmZlclRleHR1cmVNdWx0aXZpZXdPVlIoXG4gICAgICAgIGdsLkRSQVdfRlJBTUVCVUZGRVIsXG4gICAgICAgIGdsLkNPTE9SX0FUVEFDSE1FTlQwLFxuICAgICAgICBjb2xvclRleHR1cmUhLFxuICAgICAgICAwLFxuICAgICAgICAwLFxuICAgICAgICAyXG4gICAgICApO1xuICAgIGVsc2VcbiAgICAgIHRoaXMuX19nbHchLndlYmdsMkV4dE1MVFZJRVcuZnJhbWVidWZmZXJUZXh0dXJlTXVsdGlzYW1wbGVNdWx0aXZpZXdPVlIoXG4gICAgICAgIGdsLkRSQVdfRlJBTUVCVUZGRVIsXG4gICAgICAgIGdsLkNPTE9SX0FUVEFDSE1FTlQwLFxuICAgICAgICBjb2xvclRleHR1cmUhLFxuICAgICAgICAwLFxuICAgICAgICBzYW1wbGVzLFxuICAgICAgICAwLFxuICAgICAgICAyXG4gICAgICApO1xuXG4gICAgLy8gZGVwdGggdGV4dHVyZSAvIGF0dGFjaG1lbnRcbiAgICBjb25zdCBkZXB0aFN0ZW5jaWxUZXggPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRF9BUlJBWSwgZGVwdGhTdGVuY2lsVGV4KTtcbiAgICBnbC50ZXhTdG9yYWdlM0QoZ2wuVEVYVFVSRV8yRF9BUlJBWSwgMSwgZ2wuREVQVEgzMkZfU1RFTkNJTDgsIHdpZHRoLCBoZWlnaHQsIDIpO1xuICAgIGlmICghdGhpcy5fX2dsdyEud2ViZ2wyRXh0TUxUVklFVy5pc19tdWx0aXNhbXBsZSlcbiAgICAgIHRoaXMuX19nbHchLndlYmdsMkV4dE1MVFZJRVcuZnJhbWVidWZmZXJUZXh0dXJlTXVsdGl2aWV3T1ZSKFxuICAgICAgICBnbC5EUkFXX0ZSQU1FQlVGRkVSLFxuICAgICAgICBnbC5ERVBUSF9TVEVOQ0lMX0FUVEFDSE1FTlQsXG4gICAgICAgIGRlcHRoU3RlbmNpbFRleCEsXG4gICAgICAgIDAsXG4gICAgICAgIDAsXG4gICAgICAgIDJcbiAgICAgICk7XG4gICAgZWxzZVxuICAgICAgdGhpcy5fX2dsdyEud2ViZ2wyRXh0TUxUVklFVy5mcmFtZWJ1ZmZlclRleHR1cmVNdWx0aXNhbXBsZU11bHRpdmlld09WUihcbiAgICAgICAgZ2wuRFJBV19GUkFNRUJVRkZFUixcbiAgICAgICAgZ2wuREVQVEhfU1RFTkNJTF9BVFRBQ0hNRU5ULFxuICAgICAgICBkZXB0aFN0ZW5jaWxUZXghLFxuICAgICAgICAwLFxuICAgICAgICBzYW1wbGVzLFxuICAgICAgICAwLFxuICAgICAgICAyXG4gICAgICApO1xuXG4gICAgcmV0dXJuIFtmcmFtZWJ1ZmZlckhhbmRsZSwgY29sb3JUZXh0dXJlSGFuZGxlXTtcbiAgfVxuXG4gIGNyZWF0ZVRyYW5zZm9ybUZlZWRiYWNrKCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3QgdHJhbnNmb3JtRmVlZGJhY2sgPSBnbC5jcmVhdGVUcmFuc2Zvcm1GZWVkYmFjaygpO1xuICAgIGNvbnN0IHJlc291cmNlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodHJhbnNmb3JtRmVlZGJhY2shKTtcblxuICAgIGdsLmJpbmRUcmFuc2Zvcm1GZWVkYmFjayhnbC5UUkFOU0ZPUk1fRkVFREJBQ0ssIHRyYW5zZm9ybUZlZWRiYWNrKTtcblxuICAgIHJldHVybiByZXNvdXJjZUhhbmRsZTtcbiAgfVxuXG4gIGRlbGV0ZVRyYW5zZm9ybUZlZWRiYWNrKHRyYW5zZm9ybUZlZWRiYWNrVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcblxuICAgIGNvbnN0IHRyYW5zZm9ybUZlZWRiYWNrID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHRyYW5zZm9ybUZlZWRiYWNrVWlkKSE7XG4gICAgZ2wuZGVsZXRlVHJhbnNmb3JtRmVlZGJhY2sodHJhbnNmb3JtRmVlZGJhY2sgYXMgV2ViR0xUcmFuc2Zvcm1GZWVkYmFjayk7XG4gICAgdGhpcy5fX3dlYmdsUmVzb3VyY2VzLmRlbGV0ZSh0cmFuc2Zvcm1GZWVkYmFja1VpZCk7XG4gIH1cblxuICBzZXRWaWV3cG9ydChlbmdpbmU6IEVuZ2luZSwgdmlld3BvcnQ/OiBWZWN0b3I0KSB7XG4gICAgaWYgKHZpZXdwb3J0KSB7XG4gICAgICB0aGlzLl9fZ2x3Py5zZXRWaWV3cG9ydEFzVmVjdG9yNCh2aWV3cG9ydCk7XG4gICAgICBlbmdpbmUuZW5naW5lU3RhdGUudmlld3BvcnRBc3BlY3RSYXRpbyA9ICh2aWV3cG9ydC56IC0gdmlld3BvcnQueCkgLyAodmlld3BvcnQudyAtIHZpZXdwb3J0LnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZ2x3Py5zZXRWaWV3cG9ydCgwLCAwLCB0aGlzLl9fZ2x3IS53aWR0aCwgdGhpcy5fX2dsdyEuaGVpZ2h0KTtcbiAgICAgIGVuZ2luZS5lbmdpbmVTdGF0ZS52aWV3cG9ydEFzcGVjdFJhdGlvID0gdGhpcy5fX2dsdyEud2lkdGggLyB0aGlzLl9fZ2x3IS5oZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgdGhlIHNjaXNzb3IgcmVjdGFuZ2xlIG9mIGEgcmVuZGVyIHBhc3MgKGEgY3VsbGluZyBoaW50IGZvciB0aGUgZHJhdykuXG4gICAqXG4gICAqIFRoZSByZWN0YW5nbGUgdXNlcyBhIHRvcC1sZWZ0IG9yaWdpbjsgV2ViR0wncyBzY2lzc29yIG9yaWdpbiBpcyB0aGUgYm90dG9tLWxlZnQsXG4gICAqIHNvIHRoZSB5IGNvb3JkaW5hdGUgaXMgZmxpcHBlZCBhZ2FpbnN0IHRoZSByZW5kZXIgdGFyZ2V0IGhlaWdodC5cbiAgICpcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcGFzcyB3aG9zZSBzY2lzc29yIHJlY3RhbmdsZSBpcyBhcHBsaWVkLCBvciB1bmRlZmluZWRcbiAgICogdG8gcmVuZGVyIHRoZSB3aG9sZSB0YXJnZXRcbiAgICovXG4gIHNldFNjaXNzb3JSZWN0KHJlbmRlclBhc3M/OiBSZW5kZXJQYXNzKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICBjb25zdCByZWN0ID0gcmVuZGVyUGFzcz8uZ2V0U2Npc3NvclJlY3QoKTtcbiAgICBpZiAocmVjdCA9PSBudWxsKSB7XG4gICAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGZyYW1lYnVmZmVyID0gcmVuZGVyUGFzcyEuZ2V0RnJhbWVidWZmZXIoKTtcbiAgICBjb25zdCB0YXJnZXRIZWlnaHQgPSBmcmFtZWJ1ZmZlcj8uaGVpZ2h0ID8/IHRoaXMuX19nbHchLmNhbnZhcy5oZWlnaHQ7XG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3NvcihyZWN0LngsIHRhcmdldEhlaWdodCAtIChyZWN0LnkgKyByZWN0LmhlaWdodCksIHJlY3Qud2lkdGgsIHJlY3QuaGVpZ2h0KTtcbiAgfVxuXG4gIGNsZWFyRnJhbWVCdWZmZXIoZW5naW5lOiBFbmdpbmUsIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsIF8gPSAwKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG4gICAgLy8gV2hlbiB0aGUgcmVuZGVyIHBhc3MgdGFyZ2V0cyB0aGUgY2FudmFzIChzZWUgRW5naW5lLmJpbmRGcmFtZWJ1ZmZlcldlYkdMKSBhbmQgdGhlIGNhbnZhcyB3YXNcbiAgICAvLyBjcmVhdGVkIHdpdGhvdXQgYSBkZXB0aC9zdGVuY2lsIGJ1ZmZlciwgY2xlYXJpbmcgaXQgaXMgYSBuby1vcCwgc28gdGhlIGJpdHMgYXJlIGxlZnQgb3V0LlxuICAgIGNvbnN0IGlzQ2FudmFzVGFyZ2V0ID1cbiAgICAgIHJlbmRlclBhc3MuZ2V0RnJhbWVidWZmZXIoKSA9PSBudWxsICYmXG4gICAgICAhKGVuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ/LmlzV2ViWFJNb2RlICYmIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWcikgJiZcbiAgICAgICFlbmdpbmUuX3dlYkFSU3lzdGVtSWZFbmFibGVkPy5pc1dlYkFSTW9kZTtcbiAgICBsZXQgYnVmZmVyQml0ID0gMDtcbiAgICBpZiAocmVuZGVyUGFzcy50b0NsZWFyQ29sb3JCdWZmZXIpIHtcbiAgICAgIGdsLmNsZWFyQ29sb3IocmVuZGVyUGFzcy5jbGVhckNvbG9yLngsIHJlbmRlclBhc3MuY2xlYXJDb2xvci55LCByZW5kZXJQYXNzLmNsZWFyQ29sb3IueiwgcmVuZGVyUGFzcy5jbGVhckNvbG9yLncpO1xuICAgICAgYnVmZmVyQml0IHw9IGdsLkNPTE9SX0JVRkZFUl9CSVQ7XG4gICAgfVxuICAgIGlmIChyZW5kZXJQYXNzLnRvQ2xlYXJEZXB0aEJ1ZmZlciAmJiAhKGlzQ2FudmFzVGFyZ2V0ICYmICF0aGlzLl9fZ2V0Q2FudmFzQ29udGV4dEF0dHJpYnV0ZXMoKS5kZXB0aCkpIHtcbiAgICAgIGdsLmNsZWFyRGVwdGgocmVuZGVyUGFzcy5jbGVhckRlcHRoKTtcbiAgICAgIGJ1ZmZlckJpdCB8PSBnbC5ERVBUSF9CVUZGRVJfQklUO1xuICAgIH1cbiAgICBpZiAocmVuZGVyUGFzcy50b0NsZWFyU3RlbmNpbEJ1ZmZlciAmJiAhKGlzQ2FudmFzVGFyZ2V0ICYmICF0aGlzLl9fZ2V0Q2FudmFzQ29udGV4dEF0dHJpYnV0ZXMoKS5zdGVuY2lsKSkge1xuICAgICAgZ2wuY2xlYXJTdGVuY2lsKHJlbmRlclBhc3MuY2xlYXJTdGVuY2lsKTtcbiAgICAgIGJ1ZmZlckJpdCB8PSBnbC5TVEVOQ0lMX0JVRkZFUl9CSVQ7XG4gICAgfVxuICAgIGlmIChidWZmZXJCaXQgIT09IDApIHtcbiAgICAgIGdsLmNsZWFyKGJ1ZmZlckJpdCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGNhbnZhcyAoZGVmYXVsdCBmcmFtZWJ1ZmZlcikgaGFzIGEgZGVwdGggLyBzdGVuY2lsIGJ1ZmZlci4gQ2FjaGVkIGJlY2F1c2VcbiAgICogZ2V0Q29udGV4dEF0dHJpYnV0ZXMoKSBhbGxvY2F0ZXMgYSBuZXcgb2JqZWN0IG9uIGV2ZXJ5IGNhbGwuIFdoaWxlIHRoZSBjb250ZXh0IGlzIGxvc3QgdGhlXG4gICAqIGF0dHJpYnV0ZXMgYXJlIHVua25vd24sIHNvIGJvdGggYXJlIHJlcG9ydGVkIGFzIHByZXNlbnQgYW5kIG5vdGhpbmcgaXMgc2tpcHBlZC5cbiAgICovXG4gIHByaXZhdGUgX19nZXRDYW52YXNDb250ZXh0QXR0cmlidXRlcygpOiB7IGRlcHRoOiBib29sZWFuOyBzdGVuY2lsOiBib29sZWFuIH0ge1xuICAgIGNvbnN0IGdsdyA9IHRoaXMuX19nbHchO1xuICAgIGxldCBhdHRyaWJ1dGVzID0gdGhpcy5fX2NhbnZhc0NvbnRleHRBdHRyaWJ1dGVzO1xuICAgIGlmIChhdHRyaWJ1dGVzID09IG51bGwgfHwgdGhpcy5fX2NhbnZhc0NvbnRleHRBdHRyaWJ1dGVzT3duZXIgIT09IGdsdykge1xuICAgICAgY29uc3QgY29udGV4dEF0dHJpYnV0ZXMgPSBnbHcuZ2V0UmF3Q29udGV4dCgpLmdldENvbnRleHRBdHRyaWJ1dGVzKCk7XG4gICAgICBpZiAoY29udGV4dEF0dHJpYnV0ZXMgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4geyBkZXB0aDogdHJ1ZSwgc3RlbmNpbDogdHJ1ZSB9O1xuICAgICAgfVxuICAgICAgYXR0cmlidXRlcyA9IHsgZGVwdGg6IGNvbnRleHRBdHRyaWJ1dGVzLmRlcHRoICE9PSBmYWxzZSwgc3RlbmNpbDogY29udGV4dEF0dHJpYnV0ZXMuc3RlbmNpbCA9PT0gdHJ1ZSB9O1xuICAgICAgdGhpcy5fX2NhbnZhc0NvbnRleHRBdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcbiAgICAgIHRoaXMuX19jYW52YXNDb250ZXh0QXR0cmlidXRlc093bmVyID0gZ2x3O1xuICAgIH1cbiAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgfVxuXG4gIGRlbGV0ZVZlcnRleERhdGFSZXNvdXJjZXModmVydGV4SGFuZGxlczogVmVydGV4SGFuZGxlcykge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dCgpO1xuXG4gICAgY29uc3QgaWJvSGFuZGxlID0gdmVydGV4SGFuZGxlcy5pYm9IYW5kbGU7XG4gICAgaWYgKGlib0hhbmRsZSkge1xuICAgICAgY29uc3QgaWJvID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKGlib0hhbmRsZSkgYXMgV2ViR0xCdWZmZXI7XG4gICAgICBnbC5kZWxldGVCdWZmZXIoaWJvKTtcbiAgICAgIHRoaXMuX193ZWJnbFJlc291cmNlcy5kZWxldGUoaWJvSGFuZGxlKTtcbiAgICB9XG5cbiAgICBjb25zdCB2Ym9IYW5kbGVzID0gdmVydGV4SGFuZGxlcy52Ym9IYW5kbGVzO1xuICAgIGZvciAoY29uc3QgdmJvSGFuZGxlIG9mIHZib0hhbmRsZXMpIHtcbiAgICAgIGNvbnN0IHZibyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZSh2Ym9IYW5kbGUpIGFzIFdlYkdMQnVmZmVyO1xuICAgICAgZ2wuZGVsZXRlQnVmZmVyKHZibyk7XG4gICAgICB0aGlzLl9fd2ViZ2xSZXNvdXJjZXMuZGVsZXRlKHZib0hhbmRsZSk7XG4gICAgfVxuXG4gICAgY29uc3QgdmFvSGFuZGxlID0gdmVydGV4SGFuZGxlcy52YW9IYW5kbGU7XG4gICAgY29uc3QgdmFvID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHZhb0hhbmRsZSkgYXMgV2ViR0xWZXJ0ZXhBcnJheU9iamVjdDtcbiAgICB0aGlzLl9fZ2x3IS5kZWxldGVWZXJ0ZXhBcnJheSh2YW8pO1xuICAgIHRoaXMuX193ZWJnbFJlc291cmNlcy5kZWxldGUodmFvSGFuZGxlKTtcbiAgfVxuXG4gIGRlbGV0ZVZlcnRleEFycmF5KHZhb0hhbmRsZTogV2ViR0xSZXNvdXJjZUhhbmRsZSkge1xuICAgIGNvbnN0IHZhbyA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZSh2YW9IYW5kbGUpIGFzIFdlYkdMVmVydGV4QXJyYXlPYmplY3Q7XG4gICAgdGhpcy5fX2dsdyEuZGVsZXRlVmVydGV4QXJyYXkodmFvKTtcbiAgICB0aGlzLl9fd2ViZ2xSZXNvdXJjZXMuZGVsZXRlKHZhb0hhbmRsZSk7XG4gIH1cblxuICBkZWxldGVWZXJ0ZXhCdWZmZXIodmJvVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0KCk7XG4gICAgY29uc3QgdmJvID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHZib1VpZCkgYXMgV2ViR0xCdWZmZXI7XG4gICAgZ2wuZGVsZXRlQnVmZmVyKHZibyk7XG4gICAgdGhpcy5fX3dlYmdsUmVzb3VyY2VzLmRlbGV0ZSh2Ym9VaWQpO1xuICB9XG5cbiAgcmVzaXplQ2FudmFzKHdpZHRoOiBTaXplLCBoZWlnaHQ6IFNpemUpIHtcbiAgICB0aGlzLl9fZ2x3IS53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuX19nbHchLmhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLl9fZ2x3IS5jYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLl9fZ2x3IS5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHRoaXMuX19nbHchLnNldFZpZXdwb3J0QXNWZWN0b3I0KFZlY3RvcjQuZnJvbUNvcHlBcnJheShbMCwgMCwgd2lkdGgsIGhlaWdodF0pKTtcbiAgfVxuXG4gIGdldENhbnZhc1NpemUoKTogW1NpemUsIFNpemVdIHtcbiAgICByZXR1cm4gW3RoaXMuX19nbHchLmNhbnZhcy53aWR0aCwgdGhpcy5fX2dsdyEuY2FudmFzLmhlaWdodF07XG4gIH1cblxuICBzd2l0Y2hEZXB0aFRlc3QoZmxhZzogYm9vbGVhbikge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dCgpO1xuICAgIGlmIChmbGFnKSB7XG4gICAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgfVxuICB9XG5cbiAgcmVidWlsZFByb2dyYW1CeVNwZWN0b3IoXG4gICAgdGhpczogUm5XZWJHTFByb2dyYW0sXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgdXBkYXRlZFZlcnRleFNvdXJjZUNvZGU6IHN0cmluZywgLy8gVGhlIG5ldyB2ZXJ0ZXggc2hhZGVyIHNvdXJjZVxuICAgIHVwZGF0ZWRGcmFnbWVudFNvdXJjZUNvZGU6IHN0cmluZywgLy8gVGhlIG5ldyBmcmFnbWVudCBzaGFkZXIgc291cmNlXG4gICAgb25Db21waWxlZDogKHByb2dyYW06IFdlYkdMUHJvZ3JhbSkgPT4gdm9pZCwgLy8gQ2FsbGJhY2sgdHJpZ2dlcmVkIGJ5IHlvdXIgZW5naW5lIHdoZW4gdGhlIGNvbXBpbGF0aW9uIGlzIHN1Y2Nlc3NmdWwuIEl0IG5lZWRzIHRvIHNlbmQgYmFjayB0aGUgbmV3IGxpbmtlZCBwcm9ncmFtLlxuICAgIG9uRXJyb3I6IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbiAgKTogYm9vbGVhbiB7XG4gICAgLy8gQ2FsbGJhY2sgdHJpZ2dlcmVkIGJ5IHlvdXIgZW5naW5lIGluIGNhc2Ugb2YgZXJyb3IuIEl0IG5lZWRzIHRvIHNlbmQgdGhlIFdlYkdMIGVycm9yIHRvIGFsbG93IHRoZSBlZGl0b3IgdG8gZGlzcGxheSB0aGUgZXJyb3IgaW4gdGhlIGd1dHRlci5cblxuICAgIGNvbnN0IG1hdGVyaWFsID0gdGhpcy5fbWF0ZXJpYWwuZGVyZWYoKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KG1hdGVyaWFsKSkge1xuICAgICAgY29uc3Qgd2FybiA9ICdNYXRlcmlhbCBOb3QgZm91bmQnO1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2Fybih3YXJuKTtcbiAgICAgIG9uRXJyb3Iod2Fybik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvY2Vzc0FwcHJvYWNoID0gZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2g7XG4gICAgY29uc3QgcmVuZGVyaW5nU3RyYXRlZ3kgPSBnZXRSZW5kZXJpbmdTdHJhdGVneSh0aGlzLl9lbmdpbmUsIHByb2Nlc3NBcHByb2FjaCk7XG5cbiAgICBjb25zdCBtb2RpZmllZFZlcnRleFNvdXJjZUNvZGUgPSB1cGRhdGVkVmVydGV4U291cmNlQ29kZS5yZXBsYWNlKC8hID0vZywgJyE9Jyk7XG4gICAgY29uc3QgbW9kaWZpZWRQaXhlbFNvdXJjZUNvZGUgPSB1cGRhdGVkRnJhZ21lbnRTb3VyY2VDb2RlLnJlcGxhY2UoLyEgPS9nLCAnIT0nKTtcblxuICAgIGNvbnN0IHByb2dyYW1VaWQgPSByZW5kZXJpbmdTdHJhdGVneS5fcmVTZXR1cFNoYWRlckZvck1hdGVyaWFsQnlTcGVjdG9yKFxuICAgICAgbWF0ZXJpYWwsXG4gICAgICB0aGlzLl9wcmltaXRpdmUuZGVyZWYoKSEsXG4gICAgICB7XG4gICAgICAgIHZlcnRleDogbW9kaWZpZWRWZXJ0ZXhTb3VyY2VDb2RlLFxuICAgICAgICBwaXhlbDogbW9kaWZpZWRQaXhlbFNvdXJjZUNvZGUsXG4gICAgICB9LFxuICAgICAgb25FcnJvclxuICAgICk7XG4gICAgaWYgKHByb2dyYW1VaWQgPCAwKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgcHJvZ3JhbSA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2UocHJvZ3JhbVVpZCkgYXMgUm5XZWJHTFByb2dyYW07XG5cbiAgICBpZiAocHJvZ3JhbVVpZCA+IDApIHtcbiAgICAgIG9uQ29tcGlsZWQocHJvZ3JhbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBnZXRQaXhlbERhdGFGcm9tVGV4dHVyZSh0ZXhVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUsIHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dCgpO1xuICAgIGNvbnN0IHBpeGVscyA9IG5ldyBVaW50OEFycmF5KCh3aWR0aCAtIHgpICogKGhlaWdodCAtIHkpICogNCk7XG4gICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZSh0ZXhVaWQpIGFzIFdlYkdMVGV4dHVyZTtcbiAgICBjb25zdCBmYm8gPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZmJvKTtcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHRleHR1cmUsIDApO1xuICAgIGdsLnJlYWRQaXhlbHMoeCwgeSwgd2lkdGgsIGhlaWdodCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgcGl4ZWxzKTtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKGZibyk7XG4gICAgcmV0dXJuIHBpeGVscztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyBwaXhlbCBkYXRhIGRpcmVjdGx5IGZyb20gYSAyRCB0ZXh0dXJlIGFzeW5jaHJvbm91c2x5LlxuICAgKiBUaGlzIGlzIHRoZSBhc3luYyB2ZXJzaW9uIG9mIGdldFBpeGVsRGF0YUZyb21UZXh0dXJlIGZvciBBUEkgY29uc2lzdGVuY3kgd2l0aCBXZWJHUFUuXG4gICAqXG4gICAqIEBwYXJhbSB0ZXhVaWQgLSBIYW5kbGUgdG8gdGhlIHRleHR1cmUgdG8gcmVhZCBmcm9tXG4gICAqIEBwYXJhbSB4IC0gWCBvZmZzZXQgdG8gc3RhcnQgcmVhZGluZyBmcm9tXG4gICAqIEBwYXJhbSB5IC0gWSBvZmZzZXQgdG8gc3RhcnQgcmVhZGluZyBmcm9tXG4gICAqIEBwYXJhbSB3aWR0aCAtIFdpZHRoIG9mIHRoZSByZWdpb24gdG8gcmVhZFxuICAgKiBAcGFyYW0gaGVpZ2h0IC0gSGVpZ2h0IG9mIHRoZSByZWdpb24gdG8gcmVhZFxuICAgKiBAcmV0dXJucyBQcm9taXNlIHJlc29sdmluZyB0byB0aGUgcGl4ZWwgZGF0YSBhcyBhIFVpbnQ4QXJyYXkgaW4gUkdCQSBmb3JtYXRcbiAgICovXG4gIGFzeW5jIGdldFBpeGVsRGF0YUZyb21UZXh0dXJlQXN5bmMoXG4gICAgdGV4VWlkOiBXZWJHTFJlc291cmNlSGFuZGxlLFxuICAgIHg6IG51bWJlcixcbiAgICB5OiBudW1iZXIsXG4gICAgd2lkdGg6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlclxuICApOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICAvLyBXZWJHTCByZWFkUGl4ZWxzIGlzIHN5bmNocm9ub3VzLCBzbyB3ZSBqdXN0IHdyYXAgdGhlIHN5bmMgdmVyc2lvblxuICAgIHJldHVybiB0aGlzLmdldFBpeGVsRGF0YUZyb21UZXh0dXJlKHRleFVpZCwgeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gIH1cblxuICBnZXRDdXJyZW50VGV4dHVyZTJEQmluZGluZ3NGb3JFZmZla3NlZXIoKToge1xuICAgIHRleHR1cmVCaW5kaW5nczogQXJyYXk8e1xuICAgICAgdGV4dHVyZTJEOiBXZWJHTFRleHR1cmUgfCBudWxsO1xuICAgICAgc2FtcGxlcjogV2ViR0xTYW1wbGVyIHwgbnVsbDtcbiAgICB9PjtcbiAgICBhY3RpdmVUZXh0dXJlOiBudW1iZXI7XG4gICAgdmVydGV4QXJyYXk6IFdlYkdMVmVydGV4QXJyYXlPYmplY3QgfCBudWxsO1xuICAgIGFycmF5QnVmZmVyOiBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gICAgZWxlbWVudEFycmF5QnVmZmVyOiBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gICAgY3VycmVudFByb2dyYW06IFdlYkdMUHJvZ3JhbSB8IG51bGw7XG4gIH0ge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3QgbWF4VGV4dHVyZVVuaXRzID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLk1BWF9DT01CSU5FRF9URVhUVVJFX0lNQUdFX1VOSVRTKSBhcyBudW1iZXI7XG4gICAgY29uc3QgdGV4dHVyZUJpbmRpbmdzOiBBcnJheTx7XG4gICAgICB0ZXh0dXJlMkQ6IFdlYkdMVGV4dHVyZSB8IG51bGw7XG4gICAgICBzYW1wbGVyOiBXZWJHTFNhbXBsZXIgfCBudWxsO1xuICAgIH0+ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhUZXh0dXJlVW5pdHM7IGkrKykge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGkpO1xuICAgICAgY29uc3QgdGV4dHVyZTJEID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlRFWFRVUkVfQklORElOR18yRCkgYXMgV2ViR0xUZXh0dXJlIHwgbnVsbDtcbiAgICAgIGNvbnN0IHNhbXBsZXIgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU0FNUExFUl9CSU5ESU5HKSBhcyBXZWJHTFNhbXBsZXIgfCBudWxsO1xuICAgICAgdGV4dHVyZUJpbmRpbmdzLnB1c2goe1xuICAgICAgICB0ZXh0dXJlMkQsXG4gICAgICAgIHNhbXBsZXIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50QWN0aXZlVGV4dHVyZSA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHZlcnRleEFycmF5ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlZFUlRFWF9BUlJBWV9CSU5ESU5HKSBhcyBXZWJHTFZlcnRleEFycmF5T2JqZWN0IHwgbnVsbDtcbiAgICBjb25zdCBhcnJheUJ1ZmZlciA9IGdsLmdldFBhcmFtZXRlcihnbC5BUlJBWV9CVUZGRVJfQklORElORykgYXMgV2ViR0xCdWZmZXIgfCBudWxsO1xuICAgIGNvbnN0IGVsZW1lbnRBcnJheUJ1ZmZlciA9IGdsLmdldFBhcmFtZXRlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HKSBhcyBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gICAgY29uc3QgY3VycmVudFByb2dyYW0gPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQ1VSUkVOVF9QUk9HUkFNKSBhcyBXZWJHTFByb2dyYW0gfCBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0dXJlQmluZGluZ3M6IHRleHR1cmVCaW5kaW5ncyxcbiAgICAgIGFjdGl2ZVRleHR1cmU6IGN1cnJlbnRBY3RpdmVUZXh0dXJlLFxuICAgICAgdmVydGV4QXJyYXksXG4gICAgICBhcnJheUJ1ZmZlcixcbiAgICAgIGVsZW1lbnRBcnJheUJ1ZmZlcixcbiAgICAgIGN1cnJlbnRQcm9ncmFtLFxuICAgIH07XG4gIH1cblxuICByZXN0b3JlVGV4dHVyZTJEQmluZGluZ3NGb3JFZmZla3NlZXIoe1xuICAgIHRleHR1cmVCaW5kaW5ncyxcbiAgICBhY3RpdmVUZXh0dXJlLFxuICAgIHZlcnRleEFycmF5LFxuICAgIGFycmF5QnVmZmVyLFxuICAgIGVsZW1lbnRBcnJheUJ1ZmZlcixcbiAgICBjdXJyZW50UHJvZ3JhbSxcbiAgfToge1xuICAgIHRleHR1cmVCaW5kaW5nczogQXJyYXk8e1xuICAgICAgdGV4dHVyZTJEOiBXZWJHTFRleHR1cmUgfCBudWxsO1xuICAgICAgc2FtcGxlcjogV2ViR0xTYW1wbGVyIHwgbnVsbDtcbiAgICB9PjtcbiAgICBhY3RpdmVUZXh0dXJlOiBudW1iZXI7XG4gICAgdmVydGV4QXJyYXk6IFdlYkdMVmVydGV4QXJyYXlPYmplY3QgfCBudWxsO1xuICAgIGFycmF5QnVmZmVyOiBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gICAgZWxlbWVudEFycmF5QnVmZmVyOiBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gICAgY3VycmVudFByb2dyYW06IFdlYkdMUHJvZ3JhbSB8IG51bGw7XG4gIH0pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dHVyZUJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaSk7XG4gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlQmluZGluZ3NbaV0udGV4dHVyZTJEKTtcbiAgICAgIGdsLmJpbmRTYW1wbGVyKGksIHRleHR1cmVCaW5kaW5nc1tpXS5zYW1wbGVyKTtcbiAgICB9XG4gICAgZ2wuYWN0aXZlVGV4dHVyZShhY3RpdmVUZXh0dXJlKTtcbiAgICBnbC5iaW5kVmVydGV4QXJyYXkodmVydGV4QXJyYXkpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBhcnJheUJ1ZmZlcik7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgZWxlbWVudEFycmF5QnVmZmVyKTtcbiAgICBnbC51c2VQcm9ncmFtKGN1cnJlbnRQcm9ncmFtKTtcbiAgICAoZ2wgYXMgYW55KS5fX2NoYW5nZWRQcm9ncmFtID0gdHJ1ZTtcbiAgfVxuXG4gIHNldFdlYkdMU3RhdGVUb0RlZmF1bHRGb3JFZmZla3NlZXIoKSB7XG4gICAgLy8gRG8gbm90IG11dGF0ZSByYXcgV2ViR0wgc3RhdGUgYmVmb3JlIEVmZmVrc2VlciByZW5kZXJpbmcuIEVmZmVrc2VlciBrZWVwc1xuICAgIC8vIGl0cyBvd24gR0wgc3RhdGUgY2FjaGUsIHNvIHByZS1jbGVhcmluZyBSaG9kb25pdGUgYmluZGluZ3MgY2FuIGRlc3luYyBpdC5cbiAgfVxuXG4gIHNldFdlYkdMU3RhdGVUb0RlZmF1bHQoKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcblxuICAgIC8vIFZlcnRleCBhcnJheSBiaW5kaW5nIG11c3QgYmUgcmVsZWFzZWQgZmlyc3QgdG8gYXZvaWQgdGFtcGVyaW5nIHdpdGggaXRzIHN0YXRlXG4gICAgZ2wuYmluZFZlcnRleEFycmF5KG51bGwpO1xuXG4gICAgLy8gQnVmZmVyIGJpbmRpbmdzXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuVU5JRk9STV9CVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQ09QWV9SRUFEX0JVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5DT1BZX1dSSVRFX0JVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5QSVhFTF9QQUNLX0JVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5QSVhFTF9VTlBBQ0tfQlVGRkVSLCBudWxsKTtcblxuICAgIC8vIFRyYW5zZm9ybSBmZWVkYmFjayBiaW5kaW5nXG4gICAgZ2wuYmluZFRyYW5zZm9ybUZlZWRiYWNrKGdsLlRSQU5TRk9STV9GRUVEQkFDSywgbnVsbCk7XG5cbiAgICAvLyBGcmFtZWJ1ZmZlciBiaW5kaW5nc1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5SRUFEX0ZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRFJBV19GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICAgIC8vIFJlbmRlcmJ1ZmZlciBiaW5kaW5nXG4gICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIG51bGwpO1xuXG4gICAgLy8gQ3VycmVudCBwcm9ncmFtXG4gICAgZ2wudXNlUHJvZ3JhbShudWxsKTtcblxuICAgIC8vIENsZWFyIHZhbHVlc1xuICAgIGdsLmNsZWFyQ29sb3IoMCwgMCwgMCwgMCk7XG4gICAgZ2wuY2xlYXJEZXB0aCgxKTtcbiAgICBnbC5jbGVhclN0ZW5jaWwoMCk7XG5cbiAgICAvLyBEZXB0aCBzdGF0ZXNcbiAgICBnbC5kZXB0aEZ1bmMoZ2wuTEVTUyk7XG4gICAgZ2wuZGVwdGhNYXNrKHRydWUpO1xuICAgIGdsLmRlcHRoUmFuZ2UoMCwgMSk7XG5cbiAgICAvLyBFbmFibGVkIHN0YXRlc1xuICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgZ2wuZGlzYWJsZShnbC5TVEVOQ0lMX1RFU1QpO1xuICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xuICAgIGdsLmRpc2FibGUoZ2wuRElUSEVSKTtcbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuZGlzYWJsZShnbC5QT0xZR09OX09GRlNFVF9GSUxMKTtcbiAgICBnbC5kaXNhYmxlKGdsLlNBTVBMRV9DT1ZFUkFHRSk7XG4gICAgZ2wuZGlzYWJsZShnbC5TQU1QTEVfQUxQSEFfVE9fQ09WRVJBR0UpO1xuICAgIGdsLmRpc2FibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgICBnbC5kaXNhYmxlKGdsLlJBU1RFUklaRVJfRElTQ0FSRCk7XG5cbiAgICAvLyBDdWxsIHN0YXRlc1xuICAgIGdsLmZyb250RmFjZShnbC5DQ1cpO1xuICAgIGdsLmN1bGxGYWNlKGdsLkJBQ0spO1xuXG4gICAgLy8gQmxlbmQgc3RhdGVzXG4gICAgZ2wuYmxlbmRDb2xvcigwLCAwLCAwLCAwKTtcbiAgICBnbC5ibGVuZEVxdWF0aW9uU2VwYXJhdGUoZ2wuRlVOQ19BREQsIGdsLkZVTkNfQUREKTtcbiAgICBnbC5ibGVuZEZ1bmNTZXBhcmF0ZShnbC5PTkUsIGdsLlpFUk8sIGdsLk9ORSwgZ2wuWkVSTyk7XG5cbiAgICAvLyBTdGVuY2lsIHN0YXRlc1xuICAgIGdsLnN0ZW5jaWxPcFNlcGFyYXRlKGdsLkZST05ULCBnbC5LRUVQLCBnbC5LRUVQLCBnbC5LRUVQKTtcbiAgICBnbC5zdGVuY2lsT3BTZXBhcmF0ZShnbC5CQUNLLCBnbC5LRUVQLCBnbC5LRUVQLCBnbC5LRUVQKTtcbiAgICBnbC5zdGVuY2lsRnVuY1NlcGFyYXRlKGdsLkZST05ULCBnbC5BTFdBWVMsIDAsIDB4ZmZmZmZmZmYpO1xuICAgIGdsLnN0ZW5jaWxGdW5jU2VwYXJhdGUoZ2wuQkFDSywgZ2wuQUxXQVlTLCAwLCAweGZmZmZmZmZmKTtcbiAgICBnbC5zdGVuY2lsTWFza1NlcGFyYXRlKGdsLkZST05ULCAweGZmZmZmZmZmKTtcbiAgICBnbC5zdGVuY2lsTWFza1NlcGFyYXRlKGdsLkJBQ0ssIDB4ZmZmZmZmZmYpO1xuXG4gICAgLy8gQ29sb3Igc3RhdGVzXG4gICAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuXG4gICAgLy8gUG9seWdvbiBvZmZzZXQgc3RhdGVzXG4gICAgZ2wucG9seWdvbk9mZnNldCgwLCAwKTtcblxuICAgIC8vIFNhbXBsZSBjb3ZlcmFnZSBzdGF0ZXNcbiAgICBnbC5zYW1wbGVDb3ZlcmFnZSgxLjAsIGZhbHNlKTtcblxuICAgIC8vIFNjaXNzb3Igc3RhdGVzIChkZWZhdWx0IHRvIGZ1bGwgdmlld3BvcnQgLSB3aWxsIGJlIHNldCBwcm9wZXJseSB3aGVuIHZpZXdwb3J0IGlzIGtub3duKVxuICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuX19nbHchLmNhbnZhcztcbiAgICBjb25zdCBtYXhUZXh0dXJlVW5pdHMgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuTUFYX0NPTUJJTkVEX1RFWFRVUkVfSU1BR0VfVU5JVFMpIGFzIG51bWJlcjtcbiAgICBnbC5zY2lzc29yKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cbiAgICAvLyBWaWV3cG9ydCBzdGF0ZXMgKGRlZmF1bHQgdG8gZnVsbCBjYW52YXMpXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuICAgIC8vIExpbmUgd2lkdGhcbiAgICBnbC5saW5lV2lkdGgoMS4wKTtcblxuICAgIC8vIFRleHR1cmUgYmluZGluZ3NcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heFRleHR1cmVVbml0czsgaSsrKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaSk7XG4gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcbiAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIG51bGwpO1xuICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8zRCwgbnVsbCk7XG4gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJEX0FSUkFZLCBudWxsKTtcbiAgICAgIGdsLmJpbmRTYW1wbGVyKGksIG51bGwpO1xuICAgIH1cblxuICAgIC8vIFJlc3RvcmUgYWN0aXZlIHRleHR1cmUgdG8gVEVYVFVSRTBcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcbiAgfVxuXG4gIHJlc3RvcmVXZWJHTFN0YXRlcyh3ZWJHTFN0YXRlczogV2ViR0xTdGF0ZXMpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuXG4gICAgLy8gRW5hYmxlZCBzdGF0ZXNcbiAgICBpZiAod2ViR0xTdGF0ZXMuZGVwdGhUZXN0KSB7XG4gICAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgfVxuICAgIGlmICh3ZWJHTFN0YXRlcy5zdGVuY2lsVGVzdCkge1xuICAgICAgZ2wuZW5hYmxlKGdsLlNURU5DSUxfVEVTVCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLmRpc2FibGUoZ2wuU1RFTkNJTF9URVNUKTtcbiAgICB9XG4gICAgaWYgKHdlYkdMU3RhdGVzLmJsZW5kKSB7XG4gICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC5kaXNhYmxlKGdsLkJMRU5EKTtcbiAgICB9XG4gICAgaWYgKHdlYkdMU3RhdGVzLmRpdGhlcikge1xuICAgICAgZ2wuZW5hYmxlKGdsLkRJVEhFUik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLmRpc2FibGUoZ2wuRElUSEVSKTtcbiAgICB9XG4gICAgaWYgKHdlYkdMU3RhdGVzLnNjaXNzb3JUZXN0KSB7XG4gICAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIH1cbiAgICBpZiAod2ViR0xTdGF0ZXMucG9seWdvbk9mZnNldEZpbGwpIHtcbiAgICAgIGdsLmVuYWJsZShnbC5QT0xZR09OX09GRlNFVF9GSUxMKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wuZGlzYWJsZShnbC5QT0xZR09OX09GRlNFVF9GSUxMKTtcbiAgICB9XG4gICAgaWYgKHdlYkdMU3RhdGVzLnNhbXBsZUNvdmVyYWdlKSB7XG4gICAgICBnbC5lbmFibGUoZ2wuU0FNUExFX0NPVkVSQUdFKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQU1QTEVfQ09WRVJBR0UpO1xuICAgIH1cbiAgICBpZiAod2ViR0xTdGF0ZXMuc2FtcGxlQWxwaGFUb0NvdmVyYWdlKSB7XG4gICAgICBnbC5lbmFibGUoZ2wuU0FNUExFX0FMUEhBX1RPX0NPVkVSQUdFKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQU1QTEVfQUxQSEFfVE9fQ09WRVJBR0UpO1xuICAgIH1cbiAgICBpZiAod2ViR0xTdGF0ZXMuY3VsbEZhY2UpIHtcbiAgICAgIGdsLmVuYWJsZShnbC5DVUxMX0ZBQ0UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC5kaXNhYmxlKGdsLkNVTExfRkFDRSk7XG4gICAgfVxuICAgIGlmICh3ZWJHTFN0YXRlcy5yYXN0ZXJpemVyRGlzY2FyZCkge1xuICAgICAgZ2wuZW5hYmxlKGdsLlJBU1RFUklaRVJfRElTQ0FSRCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLmRpc2FibGUoZ2wuUkFTVEVSSVpFUl9ESVNDQVJEKTtcbiAgICB9XG5cbiAgICAvLyBEZXB0aCBzdGF0ZXNcbiAgICBnbC5kZXB0aEZ1bmMod2ViR0xTdGF0ZXMuZGVwdGhGdW5jKTtcbiAgICBnbC5kZXB0aE1hc2sod2ViR0xTdGF0ZXMuZGVwdGhXcml0ZU1hc2spO1xuICAgIGdsLmNsZWFyRGVwdGgod2ViR0xTdGF0ZXMuZGVwdGhDbGVhclZhbHVlKTtcbiAgICBnbC5kZXB0aFJhbmdlKHdlYkdMU3RhdGVzLmRlcHRoUmFuZ2VbMF0sIHdlYkdMU3RhdGVzLmRlcHRoUmFuZ2VbMV0pO1xuXG4gICAgLy8gU3RlbmNpbCBzdGF0ZXNcbiAgICBnbC5zdGVuY2lsRnVuY1NlcGFyYXRlKGdsLkZST05ULCB3ZWJHTFN0YXRlcy5zdGVuY2lsRnVuYywgd2ViR0xTdGF0ZXMuc3RlbmNpbFJlZiwgd2ViR0xTdGF0ZXMuc3RlbmNpbFZhbHVlTWFzayk7XG4gICAgZ2wuc3RlbmNpbEZ1bmNTZXBhcmF0ZShcbiAgICAgIGdsLkJBQ0ssXG4gICAgICB3ZWJHTFN0YXRlcy5zdGVuY2lsQmFja0Z1bmMsXG4gICAgICB3ZWJHTFN0YXRlcy5zdGVuY2lsQmFja1JlZixcbiAgICAgIHdlYkdMU3RhdGVzLnN0ZW5jaWxCYWNrVmFsdWVNYXNrXG4gICAgKTtcbiAgICBnbC5zdGVuY2lsT3BTZXBhcmF0ZShcbiAgICAgIGdsLkZST05ULFxuICAgICAgd2ViR0xTdGF0ZXMuc3RlbmNpbEZhaWwsXG4gICAgICB3ZWJHTFN0YXRlcy5zdGVuY2lsUGFzc0RlcHRoRmFpbCxcbiAgICAgIHdlYkdMU3RhdGVzLnN0ZW5jaWxQYXNzRGVwdGhQYXNzXG4gICAgKTtcbiAgICBnbC5zdGVuY2lsT3BTZXBhcmF0ZShcbiAgICAgIGdsLkJBQ0ssXG4gICAgICB3ZWJHTFN0YXRlcy5zdGVuY2lsQmFja0ZhaWwsXG4gICAgICB3ZWJHTFN0YXRlcy5zdGVuY2lsQmFja1Bhc3NEZXB0aEZhaWwsXG4gICAgICB3ZWJHTFN0YXRlcy5zdGVuY2lsQmFja1Bhc3NEZXB0aFBhc3NcbiAgICApO1xuICAgIGdsLnN0ZW5jaWxNYXNrU2VwYXJhdGUoZ2wuRlJPTlQsIHdlYkdMU3RhdGVzLnN0ZW5jaWxXcml0ZU1hc2spO1xuICAgIGdsLnN0ZW5jaWxNYXNrU2VwYXJhdGUoZ2wuQkFDSywgd2ViR0xTdGF0ZXMuc3RlbmNpbEJhY2tXcml0ZU1hc2spO1xuICAgIGdsLmNsZWFyU3RlbmNpbCh3ZWJHTFN0YXRlcy5zdGVuY2lsQ2xlYXJWYWx1ZSk7XG5cbiAgICAvLyBCbGVuZCBzdGF0ZXNcbiAgICBnbC5ibGVuZEZ1bmNTZXBhcmF0ZShcbiAgICAgIHdlYkdMU3RhdGVzLmJsZW5kU3JjUmdiLFxuICAgICAgd2ViR0xTdGF0ZXMuYmxlbmREc3RSZ2IsXG4gICAgICB3ZWJHTFN0YXRlcy5ibGVuZFNyY0FscGhhLFxuICAgICAgd2ViR0xTdGF0ZXMuYmxlbmREc3RBbHBoYVxuICAgICk7XG4gICAgZ2wuYmxlbmRFcXVhdGlvblNlcGFyYXRlKHdlYkdMU3RhdGVzLmJsZW5kRXF1YXRpb25SZ2IsIHdlYkdMU3RhdGVzLmJsZW5kRXF1YXRpb25BbHBoYSk7XG4gICAgZ2wuYmxlbmRDb2xvcihcbiAgICAgIHdlYkdMU3RhdGVzLmJsZW5kQ29sb3JbMF0sXG4gICAgICB3ZWJHTFN0YXRlcy5ibGVuZENvbG9yWzFdLFxuICAgICAgd2ViR0xTdGF0ZXMuYmxlbmRDb2xvclsyXSxcbiAgICAgIHdlYkdMU3RhdGVzLmJsZW5kQ29sb3JbM11cbiAgICApO1xuXG4gICAgLy8gQ29sb3Igc3RhdGVzXG4gICAgZ2wuY2xlYXJDb2xvcihcbiAgICAgIHdlYkdMU3RhdGVzLmNvbG9yQ2xlYXJWYWx1ZVswXSxcbiAgICAgIHdlYkdMU3RhdGVzLmNvbG9yQ2xlYXJWYWx1ZVsxXSxcbiAgICAgIHdlYkdMU3RhdGVzLmNvbG9yQ2xlYXJWYWx1ZVsyXSxcbiAgICAgIHdlYkdMU3RhdGVzLmNvbG9yQ2xlYXJWYWx1ZVszXVxuICAgICk7XG4gICAgZ2wuY29sb3JNYXNrKFxuICAgICAgd2ViR0xTdGF0ZXMuY29sb3JXcml0ZU1hc2tbMF0sXG4gICAgICB3ZWJHTFN0YXRlcy5jb2xvcldyaXRlTWFza1sxXSxcbiAgICAgIHdlYkdMU3RhdGVzLmNvbG9yV3JpdGVNYXNrWzJdLFxuICAgICAgd2ViR0xTdGF0ZXMuY29sb3JXcml0ZU1hc2tbM11cbiAgICApO1xuXG4gICAgLy8gQ3VsbCBzdGF0ZXNcbiAgICBnbC5jdWxsRmFjZSh3ZWJHTFN0YXRlcy5jdWxsRmFjZU1vZGUpO1xuICAgIGdsLmZyb250RmFjZSh3ZWJHTFN0YXRlcy5mcm9udEZhY2UpO1xuXG4gICAgLy8gUG9seWdvbiBvZmZzZXQgc3RhdGVzXG4gICAgZ2wucG9seWdvbk9mZnNldCh3ZWJHTFN0YXRlcy5wb2x5Z29uT2Zmc2V0RmFjdG9yLCB3ZWJHTFN0YXRlcy5wb2x5Z29uT2Zmc2V0VW5pdHMpO1xuXG4gICAgLy8gU2FtcGxlIGNvdmVyYWdlIHN0YXRlc1xuICAgIGdsLnNhbXBsZUNvdmVyYWdlKHdlYkdMU3RhdGVzLnNhbXBsZUNvdmVyYWdlVmFsdWUsIHdlYkdMU3RhdGVzLnNhbXBsZUNvdmVyYWdlSW52ZXJ0KTtcblxuICAgIC8vIFNjaXNzb3Igc3RhdGVzXG4gICAgZ2wuc2Npc3NvcihcbiAgICAgIHdlYkdMU3RhdGVzLnNjaXNzb3JCb3hbMF0sXG4gICAgICB3ZWJHTFN0YXRlcy5zY2lzc29yQm94WzFdLFxuICAgICAgd2ViR0xTdGF0ZXMuc2Npc3NvckJveFsyXSxcbiAgICAgIHdlYkdMU3RhdGVzLnNjaXNzb3JCb3hbM11cbiAgICApO1xuXG4gICAgLy8gVmlld3BvcnQgc3RhdGVzXG4gICAgZ2wudmlld3BvcnQod2ViR0xTdGF0ZXMudmlld3BvcnRbMF0sIHdlYkdMU3RhdGVzLnZpZXdwb3J0WzFdLCB3ZWJHTFN0YXRlcy52aWV3cG9ydFsyXSwgd2ViR0xTdGF0ZXMudmlld3BvcnRbM10pO1xuXG4gICAgLy8gTGluZSB3aWR0aFxuICAgIGdsLmxpbmVXaWR0aCh3ZWJHTFN0YXRlcy5saW5lV2lkdGgpO1xuXG4gICAgLy8gQmluZGluZyBzdGF0ZXNcbiAgICAvLyBSZXN0b3JlIHRleHR1cmUgYmluZGluZ3NcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdlYkdMU3RhdGVzLnRleHR1cmVCaW5kaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGkpO1xuICAgICAgY29uc3QgYmluZGluZyA9IHdlYkdMU3RhdGVzLnRleHR1cmVCaW5kaW5nc1tpXTtcbiAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGJpbmRpbmcudGV4dHVyZTJEKTtcbiAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGJpbmRpbmcudGV4dHVyZUN1YmVNYXApO1xuICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8zRCwgYmluZGluZy50ZXh0dXJlM0QpO1xuICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRF9BUlJBWSwgYmluZGluZy50ZXh0dXJlMkRBcnJheSk7XG4gICAgICBnbC5iaW5kU2FtcGxlcihpLCBiaW5kaW5nLnNhbXBsZXIpO1xuICAgIH1cbiAgICAvLyBSZXN0b3JlIGFjdGl2ZSB0ZXh0dXJlXG4gICAgZ2wuYWN0aXZlVGV4dHVyZSh3ZWJHTFN0YXRlcy5hY3RpdmVUZXh0dXJlKTtcblxuICAgIC8vIFJlc3RvcmUgYnVmZmVyIGJpbmRpbmdzIChBUlJBWV9CVUZGRVIgYW5kIG90aGVyIGJ1ZmZlcnMgY2FuIGJlIGJvdW5kIGJlZm9yZSBWQU8pXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHdlYkdMU3RhdGVzLmFycmF5QnVmZmVyQmluZGluZyk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5VTklGT1JNX0JVRkZFUiwgd2ViR0xTdGF0ZXMudW5pZm9ybUJ1ZmZlckJpbmRpbmcpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQ09QWV9SRUFEX0JVRkZFUiwgd2ViR0xTdGF0ZXMuY29weVJlYWRCdWZmZXJCaW5kaW5nKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkNPUFlfV1JJVEVfQlVGRkVSLCB3ZWJHTFN0YXRlcy5jb3B5V3JpdGVCdWZmZXJCaW5kaW5nKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLlBJWEVMX1BBQ0tfQlVGRkVSLCB3ZWJHTFN0YXRlcy5waXhlbFBhY2tCdWZmZXJCaW5kaW5nKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLlBJWEVMX1VOUEFDS19CVUZGRVIsIHdlYkdMU3RhdGVzLnBpeGVsVW5wYWNrQnVmZmVyQmluZGluZyk7XG5cbiAgICAvLyBSZXN0b3JlIHRyYW5zZm9ybSBmZWVkYmFjayBiaW5kaW5nXG4gICAgZ2wuYmluZFRyYW5zZm9ybUZlZWRiYWNrKGdsLlRSQU5TRk9STV9GRUVEQkFDSywgd2ViR0xTdGF0ZXMudHJhbnNmb3JtRmVlZGJhY2tCaW5kaW5nKTtcblxuICAgIC8vIFJlc3RvcmUgZnJhbWVidWZmZXIgYmluZGluZ3NcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuUkVBRF9GUkFNRUJVRkZFUiwgd2ViR0xTdGF0ZXMucmVhZEZyYW1lYnVmZmVyQmluZGluZyk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkRSQVdfRlJBTUVCVUZGRVIsIHdlYkdMU3RhdGVzLmRyYXdGcmFtZWJ1ZmZlckJpbmRpbmcpO1xuXG4gICAgLy8gUmVzdG9yZSByZW5kZXJidWZmZXIgYmluZGluZ1xuICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCB3ZWJHTFN0YXRlcy5yZW5kZXJidWZmZXJCaW5kaW5nKTtcblxuICAgIC8vIFJlc3RvcmUgdmVydGV4IGFycmF5IGJpbmRpbmdcbiAgICAvLyBOb3RlOiBFTEVNRU5UX0FSUkFZX0JVRkZFUiBpcyBwYXJ0IG9mIFZBTyBzdGF0ZSwgc28gaXQgbXVzdCBiZSBib3VuZCBhZnRlciBWQU8gaXMgYm91bmRcbiAgICBnbC5iaW5kVmVydGV4QXJyYXkod2ViR0xTdGF0ZXMudmVydGV4QXJyYXlCaW5kaW5nKTtcblxuICAgIC8vIFJlc3RvcmUgRUxFTUVOVF9BUlJBWV9CVUZGRVIgYWZ0ZXIgVkFPIGlzIGJvdW5kXG4gICAgLy8gSWYgVkFPIGlzIG51bGwsIHRoaXMgd2lsbCBzZXQgdGhlIGdsb2JhbCBFTEVNRU5UX0FSUkFZX0JVRkZFUiBiaW5kaW5nXG4gICAgLy8gSWYgVkFPIGlzIG5vdCBudWxsLCB0aGlzIHdpbGwgdXBkYXRlIHRoZSBWQU8ncyBFTEVNRU5UX0FSUkFZX0JVRkZFUiBiaW5kaW5nXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgd2ViR0xTdGF0ZXMuZWxlbWVudEFycmF5QnVmZmVyQmluZGluZyk7XG5cbiAgICAvLyBSZXN0b3JlIGN1cnJlbnQgcHJvZ3JhbVxuICAgIGdsLnVzZVByb2dyYW0od2ViR0xTdGF0ZXMuY3VycmVudFByb2dyYW0pO1xuICB9XG5cbiAgZ2V0Q3VycmVudFdlYkdMU3RhdGVzKCk6IFdlYkdMU3RhdGVzIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuXG4gICAgLy8gRW5hYmxlZCBzdGF0ZXNcbiAgICBjb25zdCBkZXB0aFRlc3QgPSBnbC5pc0VuYWJsZWQoZ2wuREVQVEhfVEVTVCk7XG4gICAgY29uc3Qgc3RlbmNpbFRlc3QgPSBnbC5pc0VuYWJsZWQoZ2wuU1RFTkNJTF9URVNUKTtcbiAgICBjb25zdCBibGVuZCA9IGdsLmlzRW5hYmxlZChnbC5CTEVORCk7XG4gICAgY29uc3QgZGl0aGVyID0gZ2wuaXNFbmFibGVkKGdsLkRJVEhFUik7XG4gICAgY29uc3Qgc2Npc3NvclRlc3QgPSBnbC5pc0VuYWJsZWQoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBjb25zdCBwb2x5Z29uT2Zmc2V0RmlsbCA9IGdsLmlzRW5hYmxlZChnbC5QT0xZR09OX09GRlNFVF9GSUxMKTtcbiAgICBjb25zdCBzYW1wbGVDb3ZlcmFnZSA9IGdsLmlzRW5hYmxlZChnbC5TQU1QTEVfQ09WRVJBR0UpO1xuICAgIGNvbnN0IHNhbXBsZUFscGhhVG9Db3ZlcmFnZSA9IGdsLmlzRW5hYmxlZChnbC5TQU1QTEVfQUxQSEFfVE9fQ09WRVJBR0UpO1xuICAgIGNvbnN0IGN1bGxGYWNlID0gZ2wuaXNFbmFibGVkKGdsLkNVTExfRkFDRSk7XG4gICAgY29uc3QgcmFzdGVyaXplckRpc2NhcmQgPSBnbC5pc0VuYWJsZWQoZ2wuUkFTVEVSSVpFUl9ESVNDQVJEKTtcblxuICAgIC8vIERlcHRoIHN0YXRlc1xuICAgIGNvbnN0IGRlcHRoRnVuYyA9IGdsLmdldFBhcmFtZXRlcihnbC5ERVBUSF9GVU5DKSBhcyBudW1iZXI7XG4gICAgY29uc3QgZGVwdGhXcml0ZU1hc2sgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuREVQVEhfV1JJVEVNQVNLKSBhcyBib29sZWFuO1xuICAgIGNvbnN0IGRlcHRoQ2xlYXJWYWx1ZSA9IGdsLmdldFBhcmFtZXRlcihnbC5ERVBUSF9DTEVBUl9WQUxVRSkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IGRlcHRoUmFuZ2UgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuREVQVEhfUkFOR0UpIGFzIEZsb2F0MzJBcnJheTtcbiAgICBjb25zdCBkZXB0aFJhbmdlVHVwbGU6IFtudW1iZXIsIG51bWJlcl0gPSBbZGVwdGhSYW5nZVswXSwgZGVwdGhSYW5nZVsxXV07XG5cbiAgICAvLyBTdGVuY2lsIHN0YXRlc1xuICAgIGNvbnN0IHN0ZW5jaWxGdW5jID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNURU5DSUxfRlVOQykgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHN0ZW5jaWxWYWx1ZU1hc2sgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU1RFTkNJTF9WQUxVRV9NQVNLKSBhcyBudW1iZXI7XG4gICAgY29uc3Qgc3RlbmNpbFJlZiA9IGdsLmdldFBhcmFtZXRlcihnbC5TVEVOQ0lMX1JFRikgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHN0ZW5jaWxCYWNrRnVuYyA9IGdsLmdldFBhcmFtZXRlcihnbC5TVEVOQ0lMX0JBQ0tfRlVOQykgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHN0ZW5jaWxCYWNrVmFsdWVNYXNrID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNURU5DSUxfQkFDS19WQUxVRV9NQVNLKSBhcyBudW1iZXI7XG4gICAgY29uc3Qgc3RlbmNpbEJhY2tSZWYgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU1RFTkNJTF9CQUNLX1JFRikgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHN0ZW5jaWxGYWlsID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNURU5DSUxfRkFJTCkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHN0ZW5jaWxQYXNzRGVwdGhGYWlsID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNURU5DSUxfUEFTU19ERVBUSF9GQUlMKSBhcyBudW1iZXI7XG4gICAgY29uc3Qgc3RlbmNpbFBhc3NEZXB0aFBhc3MgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU1RFTkNJTF9QQVNTX0RFUFRIX1BBU1MpIGFzIG51bWJlcjtcbiAgICBjb25zdCBzdGVuY2lsQmFja0ZhaWwgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU1RFTkNJTF9CQUNLX0ZBSUwpIGFzIG51bWJlcjtcbiAgICBjb25zdCBzdGVuY2lsQmFja1Bhc3NEZXB0aEZhaWwgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU1RFTkNJTF9CQUNLX1BBU1NfREVQVEhfRkFJTCkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHN0ZW5jaWxCYWNrUGFzc0RlcHRoUGFzcyA9IGdsLmdldFBhcmFtZXRlcihnbC5TVEVOQ0lMX0JBQ0tfUEFTU19ERVBUSF9QQVNTKSBhcyBudW1iZXI7XG4gICAgY29uc3Qgc3RlbmNpbFdyaXRlTWFzayA9IGdsLmdldFBhcmFtZXRlcihnbC5TVEVOQ0lMX1dSSVRFTUFTSykgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHN0ZW5jaWxCYWNrV3JpdGVNYXNrID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNURU5DSUxfQkFDS19XUklURU1BU0spIGFzIG51bWJlcjtcbiAgICBjb25zdCBzdGVuY2lsQ2xlYXJWYWx1ZSA9IGdsLmdldFBhcmFtZXRlcihnbC5TVEVOQ0lMX0NMRUFSX1ZBTFVFKSBhcyBudW1iZXI7XG5cbiAgICAvLyBCbGVuZCBzdGF0ZXNcbiAgICBjb25zdCBibGVuZFNyY1JnYiA9IGdsLmdldFBhcmFtZXRlcihnbC5CTEVORF9TUkNfUkdCKSBhcyBudW1iZXI7XG4gICAgY29uc3QgYmxlbmREc3RSZ2IgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQkxFTkRfRFNUX1JHQikgYXMgbnVtYmVyO1xuICAgIGNvbnN0IGJsZW5kU3JjQWxwaGEgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQkxFTkRfU1JDX0FMUEhBKSBhcyBudW1iZXI7XG4gICAgY29uc3QgYmxlbmREc3RBbHBoYSA9IGdsLmdldFBhcmFtZXRlcihnbC5CTEVORF9EU1RfQUxQSEEpIGFzIG51bWJlcjtcbiAgICBjb25zdCBibGVuZEVxdWF0aW9uUmdiID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkJMRU5EX0VRVUFUSU9OX1JHQikgYXMgbnVtYmVyO1xuICAgIGNvbnN0IGJsZW5kRXF1YXRpb25BbHBoYSA9IGdsLmdldFBhcmFtZXRlcihnbC5CTEVORF9FUVVBVElPTl9BTFBIQSkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IGJsZW5kQ29sb3IgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQkxFTkRfQ09MT1IpIGFzIEZsb2F0MzJBcnJheTtcbiAgICBjb25zdCBibGVuZENvbG9yVHVwbGU6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXJdID0gW1xuICAgICAgYmxlbmRDb2xvclswXSxcbiAgICAgIGJsZW5kQ29sb3JbMV0sXG4gICAgICBibGVuZENvbG9yWzJdLFxuICAgICAgYmxlbmRDb2xvclszXSxcbiAgICBdO1xuXG4gICAgLy8gQ29sb3Igc3RhdGVzXG4gICAgY29uc3QgY29sb3JDbGVhclZhbHVlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNPTE9SX0NMRUFSX1ZBTFVFKSBhcyBGbG9hdDMyQXJyYXk7XG4gICAgY29uc3QgY29sb3JDbGVhclZhbHVlVHVwbGU6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXJdID0gW1xuICAgICAgY29sb3JDbGVhclZhbHVlWzBdLFxuICAgICAgY29sb3JDbGVhclZhbHVlWzFdLFxuICAgICAgY29sb3JDbGVhclZhbHVlWzJdLFxuICAgICAgY29sb3JDbGVhclZhbHVlWzNdLFxuICAgIF07XG4gICAgY29uc3QgY29sb3JXcml0ZU1hc2sgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQ09MT1JfV1JJVEVNQVNLKSBhcyBib29sZWFuW107XG4gICAgY29uc3QgY29sb3JXcml0ZU1hc2tUdXBsZTogW2Jvb2xlYW4sIGJvb2xlYW4sIGJvb2xlYW4sIGJvb2xlYW5dID0gW1xuICAgICAgY29sb3JXcml0ZU1hc2tbMF0sXG4gICAgICBjb2xvcldyaXRlTWFza1sxXSxcbiAgICAgIGNvbG9yV3JpdGVNYXNrWzJdLFxuICAgICAgY29sb3JXcml0ZU1hc2tbM10sXG4gICAgXTtcblxuICAgIC8vIEN1bGwgc3RhdGVzXG4gICAgY29uc3QgY3VsbEZhY2VNb2RlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNVTExfRkFDRV9NT0RFKSBhcyBudW1iZXI7XG4gICAgY29uc3QgZnJvbnRGYWNlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkZST05UX0ZBQ0UpIGFzIG51bWJlcjtcblxuICAgIC8vIFBvbHlnb24gb2Zmc2V0IHN0YXRlc1xuICAgIGNvbnN0IHBvbHlnb25PZmZzZXRGYWN0b3IgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuUE9MWUdPTl9PRkZTRVRfRkFDVE9SKSBhcyBudW1iZXI7XG4gICAgY29uc3QgcG9seWdvbk9mZnNldFVuaXRzID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlBPTFlHT05fT0ZGU0VUX1VOSVRTKSBhcyBudW1iZXI7XG5cbiAgICAvLyBTYW1wbGUgY292ZXJhZ2Ugc3RhdGVzXG4gICAgY29uc3Qgc2FtcGxlQ292ZXJhZ2VWYWx1ZSA9IGdsLmdldFBhcmFtZXRlcihnbC5TQU1QTEVfQ09WRVJBR0VfVkFMVUUpIGFzIG51bWJlcjtcbiAgICBjb25zdCBzYW1wbGVDb3ZlcmFnZUludmVydCA9IGdsLmdldFBhcmFtZXRlcihnbC5TQU1QTEVfQ09WRVJBR0VfSU5WRVJUKSBhcyBib29sZWFuO1xuXG4gICAgLy8gU2Npc3NvciBzdGF0ZXNcbiAgICBjb25zdCBzY2lzc29yQm94ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNDSVNTT1JfQk9YKSBhcyBJbnQzMkFycmF5O1xuICAgIGNvbnN0IHNjaXNzb3JCb3hUdXBsZTogW251bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gPSBbXG4gICAgICBzY2lzc29yQm94WzBdLFxuICAgICAgc2Npc3NvckJveFsxXSxcbiAgICAgIHNjaXNzb3JCb3hbMl0sXG4gICAgICBzY2lzc29yQm94WzNdLFxuICAgIF07XG5cbiAgICAvLyBWaWV3cG9ydCBzdGF0ZXNcbiAgICBjb25zdCB2aWV3cG9ydCA9IGdsLmdldFBhcmFtZXRlcihnbC5WSUVXUE9SVCkgYXMgSW50MzJBcnJheTtcbiAgICBjb25zdCB2aWV3cG9ydFR1cGxlOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXSA9IFt2aWV3cG9ydFswXSwgdmlld3BvcnRbMV0sIHZpZXdwb3J0WzJdLCB2aWV3cG9ydFszXV07XG5cbiAgICAvLyBMaW5lIHdpZHRoXG4gICAgY29uc3QgbGluZVdpZHRoID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkxJTkVfV0lEVEgpIGFzIG51bWJlcjtcblxuICAgIC8vIEJpbmRpbmcgc3RhdGVzXG4gICAgLy8gR2V0IHRleHR1cmUgYmluZGluZ3MgZm9yIGFsbCBhdmFpbGFibGUgdGV4dHVyZSB1bml0c1xuICAgIGNvbnN0IG1heFRleHR1cmVVbml0cyA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfQ09NQklORURfVEVYVFVSRV9JTUFHRV9VTklUUykgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHRleHR1cmVCaW5kaW5nczogQXJyYXk8e1xuICAgICAgdGV4dHVyZTJEOiBXZWJHTFRleHR1cmUgfCBudWxsO1xuICAgICAgdGV4dHVyZUN1YmVNYXA6IFdlYkdMVGV4dHVyZSB8IG51bGw7XG4gICAgICB0ZXh0dXJlM0Q6IFdlYkdMVGV4dHVyZSB8IG51bGw7XG4gICAgICB0ZXh0dXJlMkRBcnJheTogV2ViR0xUZXh0dXJlIHwgbnVsbDtcbiAgICAgIHNhbXBsZXI6IFdlYkdMU2FtcGxlciB8IG51bGw7XG4gICAgfT4gPSBbXTtcblxuICAgIGNvbnN0IGN1cnJlbnRBY3RpdmVUZXh0dXJlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKSBhcyBudW1iZXI7XG4gICAgY29uc3QgYWN0aXZlVGV4dHVyZSA9IGN1cnJlbnRBY3RpdmVUZXh0dXJlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4VGV4dHVyZVVuaXRzOyBpKyspIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpKTtcbiAgICAgIGNvbnN0IHRleHR1cmUyRCA9IGdsLmdldFBhcmFtZXRlcihnbC5URVhUVVJFX0JJTkRJTkdfMkQpIGFzIFdlYkdMVGV4dHVyZSB8IG51bGw7XG4gICAgICBjb25zdCB0ZXh0dXJlQ3ViZU1hcCA9IGdsLmdldFBhcmFtZXRlcihnbC5URVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVApIGFzIFdlYkdMVGV4dHVyZSB8IG51bGw7XG4gICAgICBjb25zdCB0ZXh0dXJlM0QgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVEVYVFVSRV9CSU5ESU5HXzNEKSBhcyBXZWJHTFRleHR1cmUgfCBudWxsO1xuICAgICAgY29uc3QgdGV4dHVyZTJEQXJyYXkgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVEVYVFVSRV9CSU5ESU5HXzJEX0FSUkFZKSBhcyBXZWJHTFRleHR1cmUgfCBudWxsO1xuICAgICAgY29uc3Qgc2FtcGxlciA9IGdsLmdldFBhcmFtZXRlcihnbC5TQU1QTEVSX0JJTkRJTkcpIGFzIFdlYkdMU2FtcGxlciB8IG51bGw7XG5cbiAgICAgIHRleHR1cmVCaW5kaW5ncy5wdXNoKHtcbiAgICAgICAgdGV4dHVyZTJELFxuICAgICAgICB0ZXh0dXJlQ3ViZU1hcCxcbiAgICAgICAgdGV4dHVyZTNELFxuICAgICAgICB0ZXh0dXJlMkRBcnJheSxcbiAgICAgICAgc2FtcGxlcixcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBSZXN0b3JlIHRoZSBvcmlnaW5hbCBhY3RpdmUgdGV4dHVyZVxuICAgIGdsLmFjdGl2ZVRleHR1cmUoY3VycmVudEFjdGl2ZVRleHR1cmUpO1xuXG4gICAgY29uc3QgYXJyYXlCdWZmZXJCaW5kaW5nID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HKSBhcyBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gICAgY29uc3QgZWxlbWVudEFycmF5QnVmZmVyQmluZGluZyA9IGdsLmdldFBhcmFtZXRlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HKSBhcyBXZWJHTEJ1ZmZlciB8IG51bGw7XG4gICAgY29uc3QgdW5pZm9ybUJ1ZmZlckJpbmRpbmcgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVU5JRk9STV9CVUZGRVJfQklORElORykgYXMgV2ViR0xCdWZmZXIgfCBudWxsO1xuICAgIGNvbnN0IHRyYW5zZm9ybUZlZWRiYWNrQmluZGluZyA9IGdsLmdldFBhcmFtZXRlcihnbC5UUkFOU0ZPUk1fRkVFREJBQ0tfQklORElORykgYXMgV2ViR0xUcmFuc2Zvcm1GZWVkYmFjayB8IG51bGw7XG4gICAgY29uc3QgY29weVJlYWRCdWZmZXJCaW5kaW5nID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNPUFlfUkVBRF9CVUZGRVJfQklORElORykgYXMgV2ViR0xCdWZmZXIgfCBudWxsO1xuICAgIGNvbnN0IGNvcHlXcml0ZUJ1ZmZlckJpbmRpbmcgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQ09QWV9XUklURV9CVUZGRVJfQklORElORykgYXMgV2ViR0xCdWZmZXIgfCBudWxsO1xuICAgIGNvbnN0IHBpeGVsUGFja0J1ZmZlckJpbmRpbmcgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuUElYRUxfUEFDS19CVUZGRVJfQklORElORykgYXMgV2ViR0xCdWZmZXIgfCBudWxsO1xuICAgIGNvbnN0IHBpeGVsVW5wYWNrQnVmZmVyQmluZGluZyA9IGdsLmdldFBhcmFtZXRlcihnbC5QSVhFTF9VTlBBQ0tfQlVGRkVSX0JJTkRJTkcpIGFzIFdlYkdMQnVmZmVyIHwgbnVsbDtcbiAgICBjb25zdCByZWFkRnJhbWVidWZmZXJCaW5kaW5nID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlJFQURfRlJBTUVCVUZGRVJfQklORElORykgYXMgV2ViR0xGcmFtZWJ1ZmZlciB8IG51bGw7XG4gICAgY29uc3QgZHJhd0ZyYW1lYnVmZmVyQmluZGluZyA9IGdsLmdldFBhcmFtZXRlcihnbC5EUkFXX0ZSQU1FQlVGRkVSX0JJTkRJTkcpIGFzIFdlYkdMRnJhbWVidWZmZXIgfCBudWxsO1xuICAgIGNvbnN0IHJlbmRlcmJ1ZmZlckJpbmRpbmcgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuUkVOREVSQlVGRkVSX0JJTkRJTkcpIGFzIFdlYkdMUmVuZGVyYnVmZmVyIHwgbnVsbDtcbiAgICBjb25zdCB2ZXJ0ZXhBcnJheUJpbmRpbmcgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVkVSVEVYX0FSUkFZX0JJTkRJTkcpIGFzIFdlYkdMVmVydGV4QXJyYXlPYmplY3QgfCBudWxsO1xuICAgIGNvbnN0IGN1cnJlbnRQcm9ncmFtID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNVUlJFTlRfUFJPR1JBTSkgYXMgV2ViR0xQcm9ncmFtIHwgbnVsbDtcblxuICAgIHJldHVybiB7XG4gICAgICAvLyBFbmFibGVkIHN0YXRlc1xuICAgICAgZGVwdGhUZXN0LFxuICAgICAgc3RlbmNpbFRlc3QsXG4gICAgICBibGVuZCxcbiAgICAgIGRpdGhlcixcbiAgICAgIHNjaXNzb3JUZXN0LFxuICAgICAgcG9seWdvbk9mZnNldEZpbGwsXG4gICAgICBzYW1wbGVDb3ZlcmFnZSxcbiAgICAgIHNhbXBsZUFscGhhVG9Db3ZlcmFnZSxcbiAgICAgIGN1bGxGYWNlLFxuICAgICAgcmFzdGVyaXplckRpc2NhcmQsXG5cbiAgICAgIC8vIERlcHRoIHN0YXRlc1xuICAgICAgZGVwdGhGdW5jLFxuICAgICAgZGVwdGhXcml0ZU1hc2ssXG4gICAgICBkZXB0aENsZWFyVmFsdWUsXG4gICAgICBkZXB0aFJhbmdlOiBkZXB0aFJhbmdlVHVwbGUsXG5cbiAgICAgIC8vIFN0ZW5jaWwgc3RhdGVzXG4gICAgICBzdGVuY2lsRnVuYyxcbiAgICAgIHN0ZW5jaWxWYWx1ZU1hc2ssXG4gICAgICBzdGVuY2lsUmVmLFxuICAgICAgc3RlbmNpbEJhY2tGdW5jLFxuICAgICAgc3RlbmNpbEJhY2tWYWx1ZU1hc2ssXG4gICAgICBzdGVuY2lsQmFja1JlZixcbiAgICAgIHN0ZW5jaWxGYWlsLFxuICAgICAgc3RlbmNpbFBhc3NEZXB0aEZhaWwsXG4gICAgICBzdGVuY2lsUGFzc0RlcHRoUGFzcyxcbiAgICAgIHN0ZW5jaWxCYWNrRmFpbCxcbiAgICAgIHN0ZW5jaWxCYWNrUGFzc0RlcHRoRmFpbCxcbiAgICAgIHN0ZW5jaWxCYWNrUGFzc0RlcHRoUGFzcyxcbiAgICAgIHN0ZW5jaWxXcml0ZU1hc2ssXG4gICAgICBzdGVuY2lsQmFja1dyaXRlTWFzayxcbiAgICAgIHN0ZW5jaWxDbGVhclZhbHVlLFxuXG4gICAgICAvLyBCbGVuZCBzdGF0ZXNcbiAgICAgIGJsZW5kU3JjUmdiLFxuICAgICAgYmxlbmREc3RSZ2IsXG4gICAgICBibGVuZFNyY0FscGhhLFxuICAgICAgYmxlbmREc3RBbHBoYSxcbiAgICAgIGJsZW5kRXF1YXRpb25SZ2IsXG4gICAgICBibGVuZEVxdWF0aW9uQWxwaGEsXG4gICAgICBibGVuZENvbG9yOiBibGVuZENvbG9yVHVwbGUsXG5cbiAgICAgIC8vIENvbG9yIHN0YXRlc1xuICAgICAgY29sb3JDbGVhclZhbHVlOiBjb2xvckNsZWFyVmFsdWVUdXBsZSxcbiAgICAgIGNvbG9yV3JpdGVNYXNrOiBjb2xvcldyaXRlTWFza1R1cGxlLFxuXG4gICAgICAvLyBDdWxsIHN0YXRlc1xuICAgICAgY3VsbEZhY2VNb2RlLFxuICAgICAgZnJvbnRGYWNlLFxuXG4gICAgICAvLyBQb2x5Z29uIG9mZnNldCBzdGF0ZXNcbiAgICAgIHBvbHlnb25PZmZzZXRGYWN0b3IsXG4gICAgICBwb2x5Z29uT2Zmc2V0VW5pdHMsXG5cbiAgICAgIC8vIFNhbXBsZSBjb3ZlcmFnZSBzdGF0ZXNcbiAgICAgIHNhbXBsZUNvdmVyYWdlVmFsdWUsXG4gICAgICBzYW1wbGVDb3ZlcmFnZUludmVydCxcblxuICAgICAgLy8gU2Npc3NvciBzdGF0ZXNcbiAgICAgIHNjaXNzb3JCb3g6IHNjaXNzb3JCb3hUdXBsZSxcblxuICAgICAgLy8gVmlld3BvcnQgc3RhdGVzXG4gICAgICB2aWV3cG9ydDogdmlld3BvcnRUdXBsZSxcblxuICAgICAgLy8gTGluZSB3aWR0aFxuICAgICAgbGluZVdpZHRoLFxuXG4gICAgICAvLyBCaW5kaW5nIHN0YXRlc1xuICAgICAgYWN0aXZlVGV4dHVyZSxcbiAgICAgIHRleHR1cmVCaW5kaW5ncyxcbiAgICAgIGFycmF5QnVmZmVyQmluZGluZyxcbiAgICAgIGVsZW1lbnRBcnJheUJ1ZmZlckJpbmRpbmcsXG4gICAgICB1bmlmb3JtQnVmZmVyQmluZGluZyxcbiAgICAgIHRyYW5zZm9ybUZlZWRiYWNrQmluZGluZyxcbiAgICAgIGNvcHlSZWFkQnVmZmVyQmluZGluZyxcbiAgICAgIGNvcHlXcml0ZUJ1ZmZlckJpbmRpbmcsXG4gICAgICBwaXhlbFBhY2tCdWZmZXJCaW5kaW5nLFxuICAgICAgcGl4ZWxVbnBhY2tCdWZmZXJCaW5kaW5nLFxuICAgICAgcmVhZEZyYW1lYnVmZmVyQmluZGluZyxcbiAgICAgIGRyYXdGcmFtZWJ1ZmZlckJpbmRpbmcsXG4gICAgICByZW5kZXJidWZmZXJCaW5kaW5nLFxuICAgICAgdmVydGV4QXJyYXlCaW5kaW5nLFxuICAgICAgY3VycmVudFByb2dyYW0sXG4gICAgfTtcbiAgfVxuXG4gIHVuYmluZFRleHR1cmVTYW1wbGVycygpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbHchLmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGNvbnN0IG1heFRleHR1cmVVbml0cyA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfQ09NQklORURfVEVYVFVSRV9JTUFHRV9VTklUUykgYXMgbnVtYmVyO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4VGV4dHVyZVVuaXRzOyBpKyspIHtcbiAgICAgIGdsLmJpbmRTYW1wbGVyKGksIG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIGlzU3VwcG9ydE11bHRpVmlld1ZSUmVuZGVyaW5nKGVuZ2luZTogRW5naW5lKTogYm9vbGVhbiB7XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR0wyKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2dsdyEuaXNNdWx0aXZpZXcoZW5naW5lLmNvbmZpZyk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGJsaXRUb1RleHR1cmUyZEZyb21UZXh0dXJlMmRBcnJheShcbiAgICBzcmNUZXh0dXJlVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlLFxuICAgIGRzdEZib1VpZDogV2ViR0xSZXNvdXJjZUhhbmRsZSxcbiAgICBkc3RXaWR0aDogbnVtYmVyLFxuICAgIGRzdEhlaWdodDogbnVtYmVyXG4gICkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3Qgc3JjVGV4dHVyZSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShzcmNUZXh0dXJlVWlkKSBhcyBXZWJHTFRleHR1cmU7XG4gICAgY29uc3QgZHN0RmJvID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKGRzdEZib1VpZCkgYXMgV2ViR0xGcmFtZWJ1ZmZlcjtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRFJBV19GUkFNRUJVRkZFUiwgZHN0RmJvKTtcblxuICAgIGNvbnN0IHdlYlN0ZXJlb1V0aWwgPSBXZWJHTFN0ZXJlb1V0aWwuZ2V0SW5zdGFuY2UoZ2wpO1xuICAgIHdlYlN0ZXJlb1V0aWwuYmxpdChzcmNUZXh0dXJlLCAwLCAwLCAxLCAxLCBkc3RXaWR0aCwgZHN0SGVpZ2h0KTtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5EUkFXX0ZSQU1FQlVGRkVSLCBudWxsKTtcbiAgfVxuICBibGl0VG9UZXh0dXJlMmRGcm9tVGV4dHVyZTJkQXJyYXlGYWtlKFxuICAgIHNyY1RleHR1cmVVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUsXG4gICAgZHN0RmJvVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlLFxuICAgIGRzdFdpZHRoOiBudW1iZXIsXG4gICAgZHN0SGVpZ2h0OiBudW1iZXJcbiAgKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICBjb25zdCBzcmNUZXh0dXJlID0gdGhpcy5nZXRXZWJHTFJlc291cmNlKHNyY1RleHR1cmVVaWQpIGFzIFdlYkdMVGV4dHVyZTtcbiAgICBjb25zdCBkc3RGYm8gPSB0aGlzLmdldFdlYkdMUmVzb3VyY2UoZHN0RmJvVWlkKSBhcyBXZWJHTEZyYW1lYnVmZmVyO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5EUkFXX0ZSQU1FQlVGRkVSLCBkc3RGYm8pO1xuXG4gICAgY29uc3Qgd2ViU3RlcmVvVXRpbCA9IFdlYkdMU3RlcmVvVXRpbC5nZXRJbnN0YW5jZShnbCk7XG4gICAgd2ViU3RlcmVvVXRpbC5ibGl0RmFrZShzcmNUZXh0dXJlLCAwLCAwLCAxLCAxLCBkc3RXaWR0aCwgZHN0SGVpZ2h0KTtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5EUkFXX0ZSQU1FQlVGRkVSLCBudWxsKTtcbiAgfVxuICBibGl0VG9UZXh0dXJlMmRGcm9tVGV4dHVyZTJkQXJyYXkyKFxuICAgIHNyY1RleHR1cmVVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGUsXG4gICAgZHN0VGV4dHVyZVVpZDogV2ViR0xSZXNvdXJjZUhhbmRsZSxcbiAgICBkc3RXaWR0aDogbnVtYmVyLFxuICAgIGRzdEhlaWdodDogbnVtYmVyXG4gICkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsdyEuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3Qgc3JjVGV4dHVyZSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShzcmNUZXh0dXJlVWlkKSBhcyBXZWJHTFRleHR1cmU7XG4gICAgY29uc3QgZHN0VGV4dHVyZSA9IHRoaXMuZ2V0V2ViR0xSZXNvdXJjZShkc3RUZXh0dXJlVWlkKSBhcyBXZWJHTFRleHR1cmU7XG4gICAgY29uc3Qgd2ViU3RlcmVvVXRpbCA9IFdlYkdMU3RlcmVvVXRpbC5nZXRJbnN0YW5jZShnbCk7XG4gICAgd2ViU3RlcmVvVXRpbC5ibGl0MihzcmNUZXh0dXJlLCBkc3RUZXh0dXJlLCBkc3RXaWR0aCwgZHN0SGVpZ2h0KTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLE9BQU8sY0FBYztBQUVyQixTQUFTLDRCQUEyRDtBQUVwRSxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUVoQyxTQUFTLGtCQUF1QztBQUNoRCxTQUFTLG1CQUF5QztBQUNsRCxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLDBCQUEw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Z0IsR0FBRyxrQkFBa0IsSUFBSTtBQUFBLEVBQzlDO0FBQUEsRUFDQSxzQ0FDRSxlQUNBLFdBQ0EsVUFDQSxXQUNBO0FBQ0EsVUFBTSxLQUFLLEtBQUtBLEdBQU8sc0JBQXNCO0FBQzdDLFVBQU0sYUFBYSxLQUFLLGlCQUFpQixhQUFhO0FBQ3RELFVBQU0sU0FBUyxLQUFLLGlCQUFpQixTQUFTO0FBQzlDLE9BQUcsZ0JBQWdCLEdBQUcsa0JBQWtCLE1BQU07QUFFOUMsVUFBTSxnQkFBZ0IsZ0JBQWdCLFlBQVksRUFBRTtBQUNwRCxrQkFBYyxTQUFTLFlBQVksR0FBRyxHQUFHLEdBQUcsR0FBRyxVQUFVLFNBQVM7QUFFbEUsT0FBRyxnQkFBZ0IsR0FBRyxrQkFBa0IsSUFBSTtBQUFBLEVBQzlDO0FBQUEsRUFDQSxtQ0FDRSxlQUNBLGVBQ0EsVUFDQSxXQUNBO0FBQ0EsVUFBTSxLQUFLLEtBQUtBLEdBQU8sc0JBQXNCO0FBQzdDLFVBQU0sYUFBYSxLQUFLLGlCQUFpQixhQUFhO0FBQ3RELFVBQU0sYUFBYSxLQUFLLGlCQUFpQixhQUFhO0FBQ3RELFVBQU0sZ0JBQWdCLGdCQUFnQixZQUFZLEVBQUU7QUFDcEQsa0JBQWMsTUFBTSxZQUFZLFlBQVksVUFBVSxTQUFTO0FBQUEsRUFDakU7QUFDRjsiLAogICJuYW1lcyI6IFsiX193ZWJnbENvbnRleHRzIiwgIl9fcmVzb3VyY2VDb3VudGVyIiwgIl9fd2ViZ2xSZXNvdXJjZXMiLCAiX19zYW1wbGVyQ2xhbXBUb0VkZ2VMaW5lYXJVaWQiLCAiX19zYW1wbGVyQ2xhbXBUb0VkZ2VOZWFyZXN0VWlkIiwgIl9fc2FtcGxlclJlcGVhdE5lYXJlc3RVaWQiLCAiX19zYW1wbGVyUmVwZWF0TGluZWFyVWlkIiwgIl9fc2FtcGxlclNoYWRvd1VpZCIsICJfX3NhbXBsZXJSZXBlYXRUcmlMaW5lYXJVaWQiLCAiX19zYW1wbGVyUmVwZWF0QW5pc290cm9weUxpbmVhclVpZCIsICJfX211bHRpRHJhd1JlcG9zaXRvcnkiLCAiX19pbnN0YW5jZVNpZFRhYmxlIiwgIl9fZ2x3IiwgIl9fcmVnaXN0ZXJSZXNvdXJjZSIsICJfX2NoZWNrU2hhZGVyQ29tcGlsZVN0YXR1cyIsICJfX2NoZWNrU2hhZGVyUHJvZ3JhbUxpbmtTdGF0dXMiLCAiX19TUEVDVE9SX3JlYnVpbGRQcm9ncmFtIiwgIl9fZ2VuZXJhdGVNaXBtYXBzQW5kVW5iaW5kIiwgIl9fYXR0YWNoRGVwdGhPclN0ZW5jaWxCdWZmZXJUb0ZyYW1lQnVmZmVyT2JqZWN0IiwgImdsIiwgImltYWdlcyIsICJfX2NyZWF0ZUR1bW15VGV4dHVyZUlubmVyIiwgIl9fcmVhZEN1YmVUZXh0dXJlV2l0aFNoYWRlciIsICJfX2dldENhbnZhc0NvbnRleHRBdHRyaWJ1dGVzIiwgIl9fY2FudmFzQ29udGV4dEF0dHJpYnV0ZXMiLCAiX19jYW52YXNDb250ZXh0QXR0cmlidXRlc093bmVyIiwgIl9fY2hhbmdlZFByb2dyYW0iXQp9Cg==
