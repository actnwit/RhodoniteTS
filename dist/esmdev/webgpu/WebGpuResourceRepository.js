// src/webgpu/WebGpuResourceRepository.ts
import HDRImage from "../_deps/vendor__hdrpng.js";
import { CameraComponent } from "../foundation/components/Camera/CameraComponent.js";
import { MeshRendererComponent } from "../foundation/components/MeshRenderer/MeshRendererComponent.js";
import { EntityRepository } from "../foundation/core/EntityRepository.js";
import { AlphaMode } from "../foundation/definitions/AlphaMode.js";
import { BasisCompressionType } from "../foundation/definitions/BasisCompressionType.js";
import { ComponentType } from "../foundation/definitions/ComponentType.js";
import { CompositionType } from "../foundation/definitions/CompositionType.js";
import { HdriFormat } from "../foundation/definitions/HdriFormat.js";
import { PixelFormat } from "../foundation/definitions/PixelFormat.js";
import { ShaderSemantics } from "../foundation/definitions/ShaderSemantics.js";
import { TextureFormat } from "../foundation/definitions/TextureFormat.js";
import { TextureParameter } from "../foundation/definitions/TextureParameter.js";
import { VertexAttribute } from "../foundation/definitions/VertexAttribute.js";
import { Primitive } from "../foundation/geometry/Primitive.js";
import { Is } from "../foundation/misc/Is.js";
import { Logger } from "../foundation/misc/Logger.js";
import { MiscUtil } from "../foundation/misc/MiscUtil.js";
import {
  CGAPIResourceRepository
} from "../foundation/renderer/CGAPIResourceRepository.js";
import { subtractByteRanges } from "../foundation/renderer/lightCluster/LightClusterLayout.js";
import { CubeTexture } from "../foundation/textures/CubeTexture.js";
import { RenderTargetTexture2DArray } from "../foundation/textures/RenderTargetTexture2DArray.js";
import { RenderTargetTextureCube } from "../foundation/textures/RenderTargetTextureCube.js";
import { Sampler } from "../foundation/textures/Sampler.js";
import { TextureArray } from "../foundation/textures/TextureArray.js";
import { packRgbaRowsForUpload } from "./packRgbaRowsForUpload.js";
import { WebGpuBufferArena } from "./WebGpuBufferArena.js";
import { WebGpuGpuCulling } from "./WebGpuGpuCulling.js";
import { WebGpuGpuTimer } from "./WebGpuGpuTimer.js";
var DEFAULT_DEPTH_FORMAT = "depth32float";
var RENDER_PASS_TARGET_KIND_NONE = 0;
var RENDER_PASS_TARGET_KIND_MSAA_RESOLVE = 1;
var RENDER_PASS_TARGET_KIND_FRAMEBUFFER = 2;
var RENDER_PASS_TARGET_KIND_CANVAS = 3;
var _WebGpuResourceRepository = class _WebGpuResourceRepository extends CGAPIResourceRepository {
  constructor() {
    super();
    this.TH = /* @__PURE__ */ new Map();
    this.WD = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.eJ = "";
    /** The buffers bound by `__bindGroupStorageBuffer`, used to detect when it must be recreated. */
    this.DI = [];
    this.EI = /* @__PURE__ */ new Map();
    this.FI = /* @__PURE__ */ new Map();
    this.tI = /* @__PURE__ */ new Map();
    this.hJ = /* @__PURE__ */ new Map();
    /** Group 1 (textures), keyed by layout and bound texture views. */
    this.GI = /* @__PURE__ */ new Map();
    /** Group 2 (samplers), keyed by layout and bound samplers. */
    this.HI = /* @__PURE__ */ new Map();
    /** Group 3 (draw parameters), keyed by the parameter values. The uniform buffers are immutable. */
    this.iJ = /* @__PURE__ */ new Map();
    /**
     * Uniform buffers holding the draw parameters. Each buffer holds many entries at the uniform offset
     * alignment: the browser's GPU process and the driver track every distinct buffer referenced by a
     * frame, so one small buffer per entry costs much more than offsets into a few large buffers.
     */
    this.II = [];
    this.JI = 0;
    /** The arguments of the last setDrawParameters() call (without the deformed vertex offset). */
    this.jJ = [0, 0, 0, 0];
    /** Views created for dummy textures when a texture has no view yet, by texture and dimension. */
    this.lJ = /* @__PURE__ */ new WeakMap();
    /** Identifiers of GPU objects used to build cache keys. */
    this.mJ = /* @__PURE__ */ new WeakMap();
    this.OJ = 0;
    this.lI = {
      count: 0,
      slots: [],
      dimensions: [],
      visibilities: [],
      views: [],
      samplers: []
    };
    this.oJ = [];
    this.pJ = [];
    this.cI = /* @__PURE__ */ new Map();
    this.uI = /* @__PURE__ */ new Map();
    /** Set when the GPU culling recreated its buffers: the render bundles binding them were dropped. */
    this.PI = false;
    this.oI = -1;
    this.SI = RENDER_PASS_TARGET_KIND_NONE;
    this.TI = [];
    /** Scratch array swapped with `__renderPassEncoderTargetViews` to avoid per-pass allocations. */
    this.vI = [];
    /** Render bundles waiting to be executed in the open render pass. See __executeRenderBundle(). */
    this.uJ = [];
    /**
     * The clear of a render pass that draws nothing, not encoded yet. See clearFrameBuffer().
     * The object is reused to keep the per-frame path free of allocations.
     */
    this.dI = {
      active: false,
      engine: void 0,
      renderPass: void 0,
      displayIdx: 0,
      targetKind: RENDER_PASS_TARGET_KIND_NONE,
      targetViews: [],
      isColorClear: false,
      clearColor: { r: 0, g: 0, b: 0, a: 0 },
      isDepthClear: false,
      clearDepth: 1
    };
    this.VI = -1;
    this.wJ = -1;
    this.xJ = -1;
    this.yJ = -1;
    this.zJ = -1;
    this.AJ = -1;
    this.qI = /* @__PURE__ */ new Map();
    this.eI = /* @__PURE__ */ new Map();
    this.fI = /* @__PURE__ */ new Map();
  }
  static $H(array) {
    if (!(array.buffer instanceof ArrayBuffer)) {
      throw new Error("SharedArrayBuffer is not supported in this code path.");
    }
  }
  /**
   * Clears all cached resources including render pipelines, bind groups, and render bundles.
   * This method should be called when resources need to be recreated or when the rendering context changes.
   */
  clearCache() {
    this.EI.clear();
    this.FI.clear();
    this.GI.clear();
    this.HI.clear();
    this.PH = void 0;
    this.DI.length = 0;
    this.XH();
  }
  /**
   * Adds a WebGPU device wrapper to the repository and initializes the command encoder.
   * This must be called before using any WebGPU functionality.
   *
   * @param webGpuDeviceWrapper - The WebGPU device wrapper containing the device and context
   */
  addWebGpuDeviceWrapper(webGpuDeviceWrapper) {
    this.SH = webGpuDeviceWrapper;
    this.qJ = webGpuDeviceWrapper.gpuDevice.queue;
    this.YH = this.SH.gpuDevice.createCommandEncoder();
  }
  /**
   * Returns the WebGPU device wrapper instance.
   *
   * @returns The WebGPU device wrapper
   * @throws Error if the device wrapper has not been initialized
   */
  getWebGpuDeviceWrapper() {
    return this.SH;
  }
  /**
   * Returns the singleton instance of WebGpuResourceRepository.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton instance
   */
  static init() {
    return new _WebGpuResourceRepository();
  }
  /**
   * Generates a unique resource number for tracking WebGPU resources.
   *
   * @returns A unique resource handle number
   */
  getResourceNumber() {
    return ++this.WD;
  }
  /**
   * Registers a WebGPU resource and assigns it a unique handle.
   *
   * @param obj - The WebGPU resource to register
   * @returns The unique handle for the registered resource
   */
  DD(obj) {
    const handle = this.getResourceNumber();
    obj._resourceUid = handle;
    this.TH.set(handle, obj);
    return handle;
  }
  /**
   * Gets the current canvas size as a tuple of width and height.
   *
   * @returns A tuple containing [width, height] of the canvas
   */
  getCanvasSize() {
    const canvas = this.SH.canvas;
    return [canvas.width, canvas.height];
  }
  /**
   * Creates a WebGPU texture from ImageBitmap data with specified parameters.
   * This method handles texture creation, data upload, and optional mipmap generation.
   *
   * @param imageData - The ImageBitmap data to create the texture from
   * @param params - Configuration object containing texture parameters
   * @param params.level - Mipmap level (typically 0 for base level)
   * @param params.internalFormat - Internal format of the texture
   * @param params.width - Width of the texture in pixels
   * @param params.height - Height of the texture in pixels
   * @param params.border - Border width (must be 0 for WebGPU)
   * @param params.format - Pixel format of the source data
   * @param params.type - Component type of the source data
   * @param params.generateMipmap - Whether to generate mipmaps automatically
   * @returns Promise that resolves to the texture resource handle
   */
  async createTextureFromImageBitmapData(imageData, {
    internalFormat,
    width,
    height,
    generateMipmap
  }) {
    const textureHandle = await this.BJ(width, height, internalFormat, generateMipmap, imageData);
    return textureHandle;
  }
  /**
   * Creates a WebGPU texture from a data URI string.
   * This method loads the image from the data URI and creates a texture from it.
   *
   * @param dataUri - The data URI string containing the image data
   * @param params - Configuration object containing texture parameters
   * @param params.internalFormat - Internal format of the texture
   * @param params.generateMipmap - Whether to generate mipmaps automatically
   * @returns Promise that resolves to the texture resource handle
   */
  async createTextureFromDataUri(dataUri, {
    internalFormat,
    generateMipmap
  }) {
    return new Promise((resolve) => {
      const img = new Image();
      if (!dataUri.match(/^data:/)) {
        img.crossOrigin = "Anonymous";
      }
      img.onload = async () => {
        const width = img.width;
        const height = img.height;
        const texture = await this.createTextureFromHTMLImageElement(img, {
          internalFormat,
          width,
          height,
          generateMipmap
        });
        resolve(texture);
      };
      img.src = dataUri;
    });
  }
  /**
   * Generates mipmaps for a 2D texture using the specified dimensions.
   * This method creates all mipmap levels from the base texture.
   *
   * @param textureHandle - Handle to the texture resource
   * @param width - Width of the base texture level
   * @param height - Height of the base texture level
   */
  generateMipmaps2d(textureHandle, width, height) {
    const gpuTexture = this.TH.get(textureHandle);
    const textureDescriptor = {
      size: [width, height, 1],
      format: gpuTexture.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount: Math.floor(Math.log2(Math.max(width, height))) + 1
    };
    this.generateMipmaps(gpuTexture, textureDescriptor);
  }
  /**
   * Generates mipmaps for a cube texture using the specified dimensions.
   * This method creates all mipmap levels for all 6 faces of the cube texture.
   *
   * @param textureHandle - Handle to the cube texture resource
   * @param width - Width of the base texture level
   * @param height - Height of the base texture level
   */
  generateMipmapsCube(textureHandle, width, height) {
    const gpuTexture = this.TH.get(textureHandle);
    const textureDescriptor = {
      size: [width, height, 6],
      format: gpuTexture.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount: Math.floor(Math.log2(Math.max(width, height))) + 1
    };
    this.generateMipmaps(gpuTexture, textureDescriptor);
  }
  /**
   * Reads pixel data from a texture and returns it as a Uint8Array.
   * This method is useful for debugging or post-processing texture data.
   *
   * @param textureHandle - Handle to the texture resource
   * @param width - Width of the texture region to read
   * @param height - Height of the texture region to read
   * @param frameBufferUid - Handle to the framebuffer (if applicable)
   * @param colorAttachmentIndex - Index of the color attachment to read from
   * @returns Promise that resolves to the pixel data as Uint8Array
   */
  async getTexturePixelData(textureHandle, width, height, _frameBufferUid, _colorAttachmentIndex) {
    const gpuTexture = this.TH.get(textureHandle);
    const textureData = new Uint8Array(width * height * 4);
    const gpuDevice = this.SH.gpuDevice;
    const commandEncoder = gpuDevice.createCommandEncoder();
    const buffer = gpuDevice.createBuffer({
      size: width * height * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    commandEncoder.copyTextureToBuffer(
      { texture: gpuTexture },
      { buffer, bytesPerRow: width * 4 },
      { width, height, depthOrArrayLayers: 1 }
    );
    gpuDevice.queue.submit([commandEncoder.finish()]);
    await buffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = buffer.getMappedRange();
    textureData.set(new Uint8Array(arrayBuffer));
    buffer.unmap();
    return textureData;
  }
  /**
   * Reads pixel data directly from a 2D texture (synchronous version).
   * Note: WebGPU does not support synchronous texture readback.
   * This method throws an error - use getPixelDataFromTextureAsync instead.
   */
  getPixelDataFromTexture(_textureHandle, _x, _y, _width, _height) {
    throw new Error("WebGPU does not support synchronous texture readback. Use getPixelDataFromTextureAsync instead.");
  }
  /**
   * Reads pixel data directly from a 2D texture asynchronously.
   * This method uses a render-based approach to avoid requiring COPY_SRC usage on the source texture.
   * It renders the texture to a temporary render target with COPY_SRC, then reads from that.
   *
   * @param textureHandle - Handle to the texture to read from
   * @param x - X offset to start reading from (currently ignored, reads from 0)
   * @param y - Y offset to start reading from (currently ignored, reads from 0)
   * @param width - Width of the region to read
   * @param height - Height of the region to read
   * @returns Promise resolving to the pixel data as a Uint8Array in RGBA format
   */
  async getPixelDataFromTextureAsync(textureHandle, _x, _y, width, height) {
    const gpuTexture = this.TH.get(textureHandle);
    if (!gpuTexture) {
      return new Uint8Array(0);
    }
    const gpuDevice = this.SH.gpuDevice;
    const shaderModule = gpuDevice.createShaderModule({
      code: (
        /* wgsl */
        `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) texCoord: vec2f,
        };

        @vertex
        fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          var pos = array<vec2f, 4>(
            vec2f(-1.0, -1.0),
            vec2f( 1.0, -1.0),
            vec2f(-1.0,  1.0),
            vec2f( 1.0,  1.0)
          );

          var output: VertexOutput;
          output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
          // Flip Y for correct orientation
          output.texCoord = vec2f(pos[vertexIndex].x * 0.5 + 0.5, 0.5 - pos[vertexIndex].y * 0.5);
          return output;
        }

        @group(0) @binding(0) var inputTexture: texture_2d<f32>;
        @group(0) @binding(1) var inputSampler: sampler;

        @fragment
        fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
          return textureSample(inputTexture, inputSampler, input.texCoord);
        }
      `
      )
    });
    const pipeline = gpuDevice.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain"
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: "rgba8unorm" }]
      },
      primitive: {
        topology: "triangle-strip"
      }
    });
    const renderTexture = gpuDevice.createTexture({
      size: [width, height],
      format: "rgba8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });
    const sampler = gpuDevice.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    const textureView = gpuTexture.createView();
    const bindGroup = gpuDevice.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: textureView },
        { binding: 1, resource: sampler }
      ]
    });
    const commandEncoder = gpuDevice.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: renderTexture.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store"
        }
      ]
    });
    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(4);
    renderPass.end();
    const bytesPerRow = Math.ceil(width * 4 / 256) * 256;
    const buffer = gpuDevice.createBuffer({
      size: bytesPerRow * height,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    commandEncoder.copyTextureToBuffer({ texture: renderTexture }, { buffer, bytesPerRow }, { width, height });
    gpuDevice.queue.submit([commandEncoder.finish()]);
    await buffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = buffer.getMappedRange();
    const textureData = new Uint8Array(width * height * 4);
    const srcArray = new Uint8Array(arrayBuffer);
    for (let y = 0; y < height; y++) {
      const srcOffset = y * bytesPerRow;
      const dstOffset = y * width * 4;
      textureData.set(srcArray.slice(srcOffset, srcOffset + width * 4), dstOffset);
    }
    buffer.unmap();
    buffer.destroy();
    renderTexture.destroy();
    return textureData;
  }
  /**
   * Reads pixel data from a specific face of a cube texture.
   * Uses a shader-based approach to sample the cubemap and render to a 2D texture,
   * then copies the result to a buffer for CPU access.
   *
   * @param textureHandle - Handle to the cube texture
   * @param width - Width of the face texture
   * @param height - Height of the face texture
   * @param faceIndex - Index of the cube face (0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z)
   * @returns Promise resolving to the pixel data as a Uint8Array (RGBA format)
   */
  async getCubeTexturePixelData(textureHandle, width, height, faceIndex) {
    const gpuTexture = this.TH.get(textureHandle);
    const gpuDevice = this.SH.gpuDevice;
    const textureFormat = gpuTexture.format;
    const isHdrFormat = textureFormat.includes("float") || textureFormat === "rgb10a2unorm";
    const shaderModule = gpuDevice.createShaderModule({
      code: (
        /* wgsl */
        `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) texCoord: vec2f,
        };

        @vertex
        fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          var pos = array<vec2f, 4>(
            vec2f(-1.0, -1.0),
            vec2f( 1.0, -1.0),
            vec2f(-1.0,  1.0),
            vec2f( 1.0,  1.0)
          );

          var output: VertexOutput;
          output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
          output.texCoord = pos[vertexIndex] * 0.5 + 0.5;
          return output;
        }

        @group(0) @binding(0) var cubemapTexture: texture_cube<f32>;
        @group(0) @binding(1) var cubemapSampler: sampler;

        struct Uniforms {
          faceIndex: i32,
          isHdr: i32,
        };
        @group(0) @binding(2) var<uniform> uniforms: Uniforms;

        fn getDirection(face: i32, uv: vec2f) -> vec3f {
          var st = uv * 2.0 - 1.0;
          if (face == 0) { return vec3f( 1.0, -st.y, -st.x); } // +X
          if (face == 1) { return vec3f(-1.0, -st.y,  st.x); } // -X
          if (face == 2) { return vec3f( st.x,  1.0,  st.y); } // +Y
          if (face == 3) { return vec3f( st.x, -1.0, -st.y); } // -Y
          if (face == 4) { return vec3f( st.x, -st.y,  1.0); } // +Z
          return vec3f(-st.x, -st.y, -1.0); // -Z
        }

        @fragment
        fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
          // Flip Y coordinate to match WebGPU's top-left origin coordinate system
          var flippedTexCoord = vec2f(input.texCoord.x, 1.0 - input.texCoord.y);
          var dir = normalize(getDirection(uniforms.faceIndex, flippedTexCoord));
          var color = textureSample(cubemapTexture, cubemapSampler, dir).rgb;

          // Only apply tone mapping and gamma correction for HDR textures
          // LDR textures (e.g., rgba8unorm) should pass through unchanged
          if (uniforms.isHdr != 0) {
            // Reinhard tone mapping
            color = color / (1.0 + color);

            // Gamma correction
            color = pow(color, vec3f(1.0 / 2.2));
          }

          return vec4f(color, 1.0);
        }
      `
      )
    });
    const pipeline = gpuDevice.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain"
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: "rgba8unorm" }]
      },
      primitive: {
        topology: "triangle-strip"
      }
    });
    const renderTexture = gpuDevice.createTexture({
      size: [width, height],
      format: "rgba8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });
    const sampler = gpuDevice.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    const uniformBuffer = gpuDevice.createBuffer({
      size: 16,
      // Align to 16 bytes (2 i32 values = 8 bytes, padded to 16)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    gpuDevice.queue.writeBuffer(uniformBuffer, 0, new Int32Array([faceIndex, isHdrFormat ? 1 : 0]));
    const cubeTextureView = gpuTexture.createView({
      dimension: "cube"
    });
    const bindGroup = gpuDevice.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: cubeTextureView },
        { binding: 1, resource: sampler },
        { binding: 2, resource: { buffer: uniformBuffer } }
      ]
    });
    const commandEncoder = gpuDevice.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: renderTexture.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store"
        }
      ]
    });
    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(4);
    renderPass.end();
    const bytesPerRow = Math.ceil(width * 4 / 256) * 256;
    const buffer = gpuDevice.createBuffer({
      size: bytesPerRow * height,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    commandEncoder.copyTextureToBuffer({ texture: renderTexture }, { buffer, bytesPerRow }, { width, height });
    gpuDevice.queue.submit([commandEncoder.finish()]);
    await buffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = buffer.getMappedRange();
    const textureData = new Uint8Array(width * height * 4);
    const srcArray = new Uint8Array(arrayBuffer);
    for (let y = 0; y < height; y++) {
      const srcOffset = y * bytesPerRow;
      const dstOffset = y * width * 4;
      textureData.set(srcArray.slice(srcOffset, srcOffset + width * 4), dstOffset);
    }
    buffer.unmap();
    buffer.destroy();
    uniformBuffer.destroy();
    renderTexture.destroy();
    return textureData;
  }
  /**
   * Generates mipmaps for a texture using render passes (including CubeMap support).
   * This is an optimized method adapted from WebGPU best practices that uses
   * a custom shader to generate each mipmap level from the previous one.
   *
   * @remarks
   * Adapted from: https://toji.dev/webgpu-best-practices/img-textures#generating-mipmaps
   * @param texture - The GPU texture to generate mipmaps for
   * @param textureDescriptor - Descriptor containing texture format and dimensions
   */
  generateMipmaps(texture, textureDescriptor) {
    const gpuDevice = this.SH.gpuDevice;
    if (this.xI == null) {
      this.xI = gpuDevice.createShaderModule({
        code: (
          /* wgsl */
          `
          var<private> pos : array<vec2f, 4> = array<vec2f, 4>(
            vec2f(-1, 1), vec2f(1, 1),
            vec2f(-1, -1), vec2f(1, -1));

          struct VertexOutput {
            @builtin(position) position : vec4f,
            @location(0) texCoord : vec2f,
          };

          @vertex
          fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
            var output : VertexOutput;
            output.texCoord = pos[vertexIndex] * vec2f(0.5, -0.5) + vec2f(0.5);
            output.position = vec4f(pos[vertexIndex], 0, 1);
            return output;
          }

          @group(0) @binding(0) var imgSampler : sampler;
          @group(0) @binding(1) var img : texture_2d<f32>;

          @fragment
          fn fragmentMain(@location(0) texCoord : vec2f) -> @location(0) vec4f {
            return textureSample(img, imgSampler, texCoord);
          }
        `
        )
      });
    }
    if (this.pI != null && textureDescriptor.format !== this.vJ) {
      this.pI = void 0;
    }
    if (this.pI == null) {
      this.XI = gpuDevice.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {
              type: "filtering"
            }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {
              viewDimension: "2d"
            }
          }
        ]
      });
      const pipelineLayout = gpuDevice.createPipelineLayout({
        bindGroupLayouts: [this.XI]
      });
      this.pI = gpuDevice.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: this.xI,
          entryPoint: "vertexMain"
        },
        fragment: {
          module: this.xI,
          entryPoint: "fragmentMain",
          targets: [
            {
              format: textureDescriptor.format
            }
          ]
        },
        primitive: {
          topology: "triangle-strip",
          stripIndexFormat: "uint32"
        }
      });
      this.vJ = textureDescriptor.format;
    }
    if (this.WI == null) {
      this.WI = gpuDevice.createSampler({ minFilter: "linear" });
    }
    this.jI();
    const isCubemap = texture.dimension === "2d" && texture.depthOrArrayLayers === 6;
    const layerCount = isCubemap ? 6 : 1;
    for (let layer = 0; layer < layerCount; ++layer) {
      const srcTextureViewsMap = this.qI.get(texture);
      if (srcTextureViewsMap == null || srcTextureViewsMap[layer] == null) {
        const srcView2 = texture.createView({
          dimension: "2d",
          baseMipLevel: 0,
          mipLevelCount: 1,
          baseArrayLayer: layer,
          arrayLayerCount: 1
        });
        if (srcTextureViewsMap == null) {
          this.qI.set(texture, []);
        }
        this.qI.get(texture)[layer] = srcView2;
      }
      let srcView = this.qI.get(texture)[layer];
      for (let i = 1; i < textureDescriptor.mipLevelCount; ++i) {
        const dstTextureViewsMap = this.eI.get(texture);
        if (dstTextureViewsMap == null || dstTextureViewsMap[layer] == null || dstTextureViewsMap[layer][i] == null) {
          const dstView2 = texture.createView({
            dimension: "2d",
            baseMipLevel: i,
            mipLevelCount: 1,
            baseArrayLayer: layer,
            arrayLayerCount: 1
          });
          if (dstTextureViewsMap == null) {
            this.eI.set(texture, []);
          }
          if (this.eI.get(texture)[layer] == null) {
            this.eI.get(texture)[layer] = [];
          }
          this.eI.get(texture)[layer][i] = dstView2;
        }
        const dstView = this.eI.get(texture)[layer][i];
        const passEncoder = this.YH.beginRenderPass({
          colorAttachments: [
            {
              view: dstView,
              loadOp: "load",
              storeOp: "store"
            }
          ]
        });
        const bindGroupsMap = this.fI.get(texture);
        if (bindGroupsMap == null || bindGroupsMap[layer] == null || bindGroupsMap[layer][i] == null) {
          const bindGroup2 = gpuDevice.createBindGroup({
            layout: this.XI,
            entries: [
              {
                binding: 0,
                resource: this.WI
              },
              {
                binding: 1,
                resource: srcView
              }
            ]
          });
          if (bindGroupsMap == null) {
            this.fI.set(texture, []);
          }
          if (this.fI.get(texture)[layer] == null) {
            this.fI.get(texture)[layer] = [];
          }
          this.fI.get(texture)[layer][i] = bindGroup2;
        }
        const bindGroup = this.fI.get(texture)[layer][i];
        passEncoder.setPipeline(this.pI);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(4);
        passEncoder.end();
        srcView = dstView;
      }
    }
  }
  /**
   * Creates a texture sampler with the specified filtering and wrapping parameters.
   * The sampler defines how textures are filtered and wrapped when accessed in shaders.
   *
   * @param params - Configuration object for the sampler
   * @param params.magFilter - Magnification filter mode
   * @param params.minFilter - Minification filter mode
   * @param params.wrapS - Wrapping mode for S (U) texture coordinate
   * @param params.wrapT - Wrapping mode for T (V) texture coordinate
   * @param params.wrapR - Wrapping mode for R (W) texture coordinate
   * @param params.anisotropy - Whether to enable anisotropic filtering
   * @returns Handle to the created sampler resource
   */
  createTextureSampler({
    magFilter,
    minFilter,
    wrapS,
    wrapT,
    wrapR,
    anisotropy
  }) {
    const gpuDevice = this.SH.gpuDevice;
    const maxAnisotropy = anisotropy ? 4 : 1;
    const desc = {
      magFilter: magFilter.webgpu,
      minFilter: minFilter.webgpu,
      mipmapFilter: minFilter === TextureParameter.LinearMipmapLinear || minFilter === TextureParameter.NearestMipmapLinear ? "linear" : "nearest",
      addressModeU: wrapS.webgpu,
      addressModeV: wrapT.webgpu,
      addressModeW: wrapR.webgpu,
      // lodMinClamp: 0,
      // lodMaxClamp: 32,
      maxAnisotropy
    };
    if (desc.magFilter === "nearest" || desc.minFilter === "nearest" || desc.mipmapFilter === "nearest") {
      desc.maxAnisotropy = 1;
    }
    const sampler = gpuDevice.createSampler(desc);
    const samplerHandle = this.DD(sampler);
    return samplerHandle;
  }
  /**
   * Creates a WebGPU vertex buffer from an accessor containing vertex data.
   * The buffer is created with the appropriate size and the data is uploaded immediately.
   *
   * @param accessor - Accessor containing the vertex data to upload
   * @returns Handle to the created vertex buffer
   */
  createVertexBuffer(accessor) {
    return this.YI(accessor.getUint8Array());
  }
  /**
   * Creates a WebGPU vertex buffer from a typed array.
   * This is a more direct method when you have raw typed array data.
   *
   * @param typedArray - The typed array containing vertex data
   * @returns Handle to the created vertex buffer resource
   */
  createVertexBufferFromTypedArray(typedArray) {
    return this.YI(
      new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength)
    );
  }
  /**
   * Returns the WebGPU vertex format for an attribute accessor.
   * An accessor with the normalized flag uses a unorm/snorm format so that the GPU converts
   * its integer data to the [0, 1] / [-1, 1] range before the vertex shader reads it.
   *
   * @param accessor - Accessor of the vertex attribute
   * @returns The vertex format to declare in the pipeline layout
   */
  static CJ(accessor) {
    const componentType = accessor.componentType;
    const compositionType = accessor.compositionType;
    if (accessor.normalized) {
      let prefix = "";
      if (componentType === ComponentType.UnsignedByte) {
        prefix = "unorm8";
      } else if (componentType === ComponentType.Byte) {
        prefix = "snorm8";
      } else if (componentType === ComponentType.UnsignedShort) {
        prefix = "unorm16";
      } else if (componentType === ComponentType.Short) {
        prefix = "snorm16";
      }
      const normalizedFormat = prefix + compositionType.webgpu;
      if (prefix !== "" && _WebGpuResourceRepository.PJ.has(normalizedFormat)) {
        return normalizedFormat;
      }
    }
    return componentType.webgpu + compositionType.webgpu;
  }
  /**
   * Creates a WebGPU index buffer from an accessor containing index data.
   * Automatically converts UnsignedByte indices to UnsignedShort since WebGPU
   * doesn't support 8-bit index buffers.
   *
   * @param accessor - Accessor containing the index data to upload
   * @returns Handle to the created index buffer resource
   */
  createIndexBuffer(accessor) {
    return this.YI(_WebGpuResourceRepository.DJ(accessor));
  }
  /**
   * Returns the index data of an accessor in a format WebGPU accepts.
   * WebGPU does not support 8-bit indices, so they are widened to 16 bits.
   */
  static DJ(accessor) {
    if (accessor.componentType !== ComponentType.UnsignedByte) {
      return accessor.getUint8Array();
    }
    const typedArray = accessor.getTypedArray();
    const uint16Array = new Uint16Array(typedArray.length);
    for (let i = 0; i < typedArray.length; i++) {
      uint16Array[i] = typedArray[i];
    }
    return new Uint8Array(uint16Array.buffer);
  }
  QJ() {
    if (this.hI == null) {
      this.hI = new WebGpuBufferArena(
        this.SH.gpuDevice,
        GPUBufferUsage.VERTEX | GPUBufferUsage.INDEX
      );
    }
    return this.hI;
  }
  /**
   * Uploads vertex or index data into the shared vertex buffer arena and returns a handle to the range.
   */
  YI(data) {
    const range = this.QJ().allocate(data);
    const handle = this.getResourceNumber();
    this.cI.set(handle, range);
    return handle;
  }
  /**
   * Returns the buffer range of a vertex or index buffer handle.
   * @internal
   */
  _getVertexBufferRange(resourceHandle) {
    return this.cI.get(resourceHandle);
  }
  ZI(resourceHandle) {
    const range = this.cI.get(resourceHandle);
    if (range == null) {
      return false;
    }
    this.hI.release(range);
    this.cI.delete(resourceHandle);
    this.XH();
    return true;
  }
  /**
   * Updates the data in an existing vertex buffer with new data from an accessor.
   * The data must not be larger than the data the buffer was created with.
   *
   * @param accessor - Accessor containing the new vertex data
   * @param resourceHandle - Handle to the existing vertex buffer to update
   * @throws Error if the vertex buffer is not found
   */
  updateVertexBuffer(accessor, resourceHandle) {
    const range = this.cI.get(resourceHandle);
    if (Is.not.exist(range)) {
      throw new Error("Not found VBO.");
    }
    this.hI.write(range, accessor.getUint8Array());
  }
  /**
   * Updates the data in an existing index buffer with new data from an accessor.
   * Automatically handles conversion of UnsignedByte indices to UnsignedShort if needed.
   *
   * @param accessor - Accessor containing the new index data
   * @param resourceHandle - Handle to the existing index buffer to update
   * @throws Error if the index buffer is not found
   */
  updateIndexBuffer(accessor, resourceHandle) {
    const range = this.cI.get(resourceHandle);
    if (Is.not.exist(range)) {
      throw new Error("Not found IBO.");
    }
    this.hI.write(range, _WebGpuResourceRepository.DJ(accessor));
  }
  /**
   * Deletes a vertex buffer and releases its range of the vertex buffer arena.
   *
   * @param resourceHandle - Handle to the vertex buffer to delete
   * @throws Error if the vertex buffer is not found
   */
  deleteVertexBuffer(resourceHandle) {
    if (!this.ZI(resourceHandle)) {
      throw new Error("Not found VBO.");
    }
  }
  /**
   * Creates vertex and index buffers for a primitive and returns their handles.
   * This method processes all vertex attributes and creates appropriate buffers
   * while tracking which attributes are present.
   *
   * @param primitive - The primitive containing vertex and index data
   * @returns Object containing buffer handles and attribute flags
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
   * Updates the vertex and index buffers for a primitive with new data.
   * This method updates all existing buffers with fresh data from the primitive.
   *
   * @param primitive - The primitive containing the updated vertex and index data
   * @param vertexHandles - Object containing the handles to the buffers to update
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
   * Deletes all vertex data resources (vertex and index buffers) associated with vertex handles.
   * This method destroys both vertex buffers and index buffers to free GPU memory.
   *
   * @param vertexHandles - Object containing handles to the vertex data resources to delete
   */
  deleteVertexDataResources(vertexHandles) {
    if (Is.exist(vertexHandles.iboHandle)) {
      this.ZI(vertexHandles.iboHandle);
    }
    for (const vboHandle of vertexHandles.vboHandles) {
      this.ZI(vboHandle);
    }
  }
  /**
   * Configures vertex data layout for the rendering pipeline.
   * This method sets up vertex buffer layouts including both per-vertex and per-instance data.
   *
   * @param bufferHandles - Object containing vertex array object, index buffer, and vertex buffer handles
   * @param bufferHandles.vboHandles - Array of vertex buffer handles
   * @param primitive - The primitive containing vertex attribute information
   */
  setVertexDataToPipeline({
    vboHandles
  }, primitive) {
    const buffers = [];
    const attributes = [];
    for (let i = 0; i < vboHandles.length; i++) {
      const shaderLocation = VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]);
      const gpuVertexFormat = _WebGpuResourceRepository.CJ(primitive.attributeAccessors[i]);
      attributes.push({
        shaderLocation,
        offset: primitive.attributeAccessors[i].byteOffsetInBufferView,
        format: gpuVertexFormat
      });
    }
    buffers[0] = {
      stepMode: "vertex",
      attributes,
      arrayStride: primitive.attributeAccessors[0].byteStride
    };
    buffers[1] = {
      stepMode: "instance",
      attributes: [
        {
          shaderLocation: VertexAttribute.Instance.getAttributeSlot(),
          offset: 0,
          format: "uint32x4"
        }
      ],
      arrayStride: 4 * 4
    };
  }
  /**
   * Checks and logs shader compilation status and error messages.
   * This method provides detailed debugging information when shader compilation fails.
   *
   * @param engine - The engine instance for logging
   * @param materialTypeName - Name of the material type for debugging
   * @param shaderText - The shader source code that was compiled
   * @param info - WebGPU compilation info containing messages and errors
   * @returns True if compilation was successful, false otherwise
   */
  TD(engine, materialTypeName, shaderText, info) {
    engine.logger.info(`MaterialTypeName: ${materialTypeName}`);
    const lineNumberedShaderText = MiscUtil.addLineNumberToCode(shaderText);
    engine.logger.info(lineNumberedShaderText);
    let isOk = true;
    for (let i = 0; i < info.messages.length; i++) {
      engine.logger.info(info.messages[i].message);
      isOk = false;
    }
    return isOk;
  }
  /**
   * Creates shader modules (vertex and fragment) from shader source code.
   * This method compiles both vertex and fragment shaders and returns their handles.
   *
   * @param params - Configuration object for shader creation
   * @param params.engine - The engine instance for logging
   * @param params.material - The material that will use these shaders
   * @param params.vertexShaderStr - WGSL vertex shader source code
   * @param params.fragmentShaderStr - WGSL fragment shader source code
   * @returns Handle to the shader program containing both modules
   */
  createShaderProgram({
    config,
    engine,
    material,
    vertexShaderStr,
    fragmentShaderStr
  }) {
    const gpuDevice = this.SH.gpuDevice;
    const vsModule = gpuDevice.createShaderModule({
      code: vertexShaderStr,
      label: `${material.materialTypeName} vertex shader`
    });
    if (config.cgApiDebugConsoleOutput) {
      vsModule.getCompilationInfo().then((info) => {
        if (info.messages.length > 0) {
          this.TD(engine, material.materialTypeName, vertexShaderStr, info);
        }
      });
    }
    const fsModule = gpuDevice.createShaderModule({
      code: fragmentShaderStr,
      label: `${material.materialTypeName} fragment shader`
    });
    if (config.cgApiDebugConsoleOutput) {
      fsModule.getCompilationInfo().then((info) => {
        if (info.messages.length > 0) {
          this.TD(engine, material.materialTypeName, fragmentShaderStr, info);
        }
      });
    }
    const modules = {
      vsModule,
      fsModule
    };
    const modulesHandle = this.DD(modules);
    return modulesHandle;
  }
  /**
   * Clears the framebuffer with the specified clear values.
   * This method is executed when the render pass has no entities to render,
   * but still needs to perform clear operations.
   *
   * @param renderPass - The render pass containing clear settings and target framebuffer
   */
  clearFrameBuffer(engine, renderPass, displayIdx) {
    if (renderPass.entities.length > 0) {
      return;
    }
    if (!renderPass.toClearColorBuffer && !renderPass.toClearDepthBuffer) {
      return;
    }
    const webXRSystem = engine._webXRSystemIfEnabled;
    const isXrTarget = renderPass.getFramebuffer() == null && (webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) && renderPass.isOutputForVr;
    if (renderPass.getResolveFramebuffer() == null && !isXrTarget) {
      const targetViews = this.vI;
      const targetKind = this.EJ(engine, renderPass, targetViews);
      const pendingClear = this.dI;
      if (pendingClear.active) {
        if (targetKind !== pendingClear.targetKind || !_WebGpuResourceRepository._I(targetViews, pendingClear.targetViews)) {
          this.$I();
        }
      }
      if (!pendingClear.active) {
        pendingClear.active = true;
        pendingClear.engine = engine;
        pendingClear.renderPass = renderPass;
        pendingClear.displayIdx = displayIdx;
        pendingClear.targetKind = targetKind;
        this.vI = pendingClear.targetViews;
        pendingClear.targetViews = targetViews;
      }
      if (renderPass.toClearColorBuffer) {
        const clearColor = renderPass.clearColor;
        pendingClear.isColorClear = true;
        pendingClear.clearColor.r = clearColor.x;
        pendingClear.clearColor.g = clearColor.y;
        pendingClear.clearColor.b = clearColor.z;
        pendingClear.clearColor.a = clearColor.w;
      }
      if (renderPass.toClearDepthBuffer) {
        pendingClear.isDepthClear = true;
        pendingClear.clearDepth = renderPass.clearDepth;
      }
      return;
    }
    this.jI();
    const colorAttachments = [];
    let depthStencilAttachment;
    const webxrSystem = engine._webXRSystemIfEnabled;
    if (renderPass.toClearColorBuffer) {
      const framebuffer = renderPass.getFramebuffer();
      if (framebuffer != null) {
        for (let colorAttachment of framebuffer.colorAttachments) {
          const textureView = this.TH.get(
            colorAttachment._textureViewAsRenderTargetResourceUid
          );
          colorAttachments.push({
            view: textureView,
            clearValue: {
              r: renderPass.clearColor.x,
              g: renderPass.clearColor.y,
              b: renderPass.clearColor.z,
              a: renderPass.clearColor.w
            },
            loadOp: "clear",
            storeOp: "store"
          });
        }
      } else if ((webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) && renderPass.isOutputForVr) {
        const view = engine.engineState.xrPoseWebGPU.views[displayIdx];
        const subImage = engine.engineState.xrGpuBinding.getViewSubImage(
          engine.engineState.xrProjectionLayerWebGPU,
          view
        );
        colorAttachments.push({
          view: subImage.colorTexture.createView(subImage.getViewDescriptor()),
          clearValue: {
            r: renderPass.clearColor.x,
            g: renderPass.clearColor.y,
            b: renderPass.clearColor.z,
            a: renderPass.clearColor.w
          },
          loadOp: "clear",
          storeOp: "store"
        });
      } else {
        colorAttachments.push({
          view: this.zI(),
          clearValue: {
            r: renderPass.clearColor.x,
            g: renderPass.clearColor.y,
            b: renderPass.clearColor.z,
            a: renderPass.clearColor.w
          },
          loadOp: "clear",
          storeOp: "store"
        });
      }
    }
    if (renderPass.toClearDepthBuffer) {
      const framebuffer = renderPass.getFramebuffer();
      if (framebuffer != null && framebuffer.depthAttachment != null) {
        const depthTextureView = this.TH.get(
          framebuffer.depthAttachment._textureViewAsRenderTargetResourceUid
        );
        depthStencilAttachment = {
          view: depthTextureView,
          depthClearValue: renderPass.clearDepth,
          depthLoadOp: "clear",
          depthStoreOp: "store"
        };
      } else if ((webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) && renderPass.isOutputForVr) {
        const view = engine.engineState.xrPoseWebGPU.views[displayIdx];
        const subImage = engine.engineState.xrGpuBinding.getViewSubImage(
          engine.engineState.xrProjectionLayerWebGPU,
          view
        );
        depthStencilAttachment = {
          view: subImage.depthStencilTexture.createView(subImage.getViewDescriptor()),
          depthClearValue: renderPass.clearDepth,
          depthLoadOp: "clear",
          depthStoreOp: "store"
        };
      } else {
        depthStencilAttachment = {
          view: this.bI,
          depthClearValue: renderPass.clearDepth,
          depthLoadOp: "clear",
          depthStoreOp: "store"
        };
      }
    }
    const renderPassDescriptor = {
      colorAttachments,
      depthStencilAttachment,
      label: renderPass.uniqueName
    };
    const passEncoder = this.rI(renderPassDescriptor);
    passEncoder.end();
  }
  /**
   * Executes a draw call for rendering a primitive with the specified material and render pass.
   * This is the core rendering method that sets up the render pipeline, bind groups,
   * and executes the actual GPU draw commands.
   *
   * @param primitive - The geometric primitive to render (vertices, indices, attributes)
   * @param material - The material containing shaders and rendering properties
   * @param renderPass - The render pass defining render targets and clear operations
   * @param cameraId - Identifier for the camera used for rendering
   * @param zWrite - Whether to enable depth writing during rendering
   * @param options - `depthOnly` draws the primitive with a depth-only pipeline (the depth prepass);
   * `allowEqualDepth` lets the color pass pass the depth written by the prepass
   */
  draw(engine, primitive, material, renderPass, cameraId, zWrite, _displayIdx, options = {}) {
    var _a;
    const isBufferLessRendering = renderPass.isBufferLessRenderingMode();
    const VertexHandles = primitive._vertexHandles;
    if (!isBufferLessRendering && VertexHandles == null) {
      return;
    }
    let meshRendererComponentFingerPrint = "";
    let diffuseCubeMap;
    let specularCubeMap;
    let sheenCubeMap;
    if (!isBufferLessRendering) {
      const mesh = primitive.mesh;
      const entity = mesh.meshEntitiesInner[0];
      const meshRendererComponent = entity.getMeshRenderer();
      material._setInternalSettingParametersToGpuWebGpu({
        engine,
        material,
        args: {
          cameraComponentSid: cameraId,
          entity,
          specularCube: meshRendererComponent.specularCubeMap
        }
      });
      diffuseCubeMap = meshRendererComponent.diffuseCubeMap;
      specularCubeMap = meshRendererComponent.specularCubeMap;
      sheenCubeMap = meshRendererComponent.sheenCubeMap;
      meshRendererComponentFingerPrint = meshRendererComponent.getFingerPrint();
    } else {
      const diffuseEnvValue = material.getTextureParameter(ShaderSemantics.DiffuseEnvTexture.str);
      if (diffuseEnvValue != null) {
        diffuseCubeMap = diffuseEnvValue[1];
      }
      const specularEnvValue = material.getTextureParameter(ShaderSemantics.SpecularEnvTexture.str);
      if (specularEnvValue != null) {
        specularCubeMap = specularEnvValue[1];
      }
      const sheenEnvValue = material.getTextureParameter(ShaderSemantics.SheenEnvTexture.str);
      if (sheenEnvValue != null) {
        sheenCubeMap = sheenEnvValue[1];
      }
    }
    const renderPipelineId = `${primitive._getFingerPrint()} ${material._getFingerPrint()} ${material.Rr} ${renderPass.renderPassUID} ${meshRendererComponentFingerPrint} ${zWrite} `;
    const bindGroups = this.RJ(engine, material, diffuseCubeMap, specularCubeMap, sheenCubeMap);
    const [pipeline, _recreated] = this.getOrCreateRenderPipeline(
      renderPipelineId,
      bindGroups.pipelineLayoutKey,
      bindGroups.pipelineLayout,
      primitive,
      material,
      renderPass,
      zWrite,
      options
    );
    const renderBundleEncoder = this.WH;
    const boundBindGroups = this.oJ;
    if (boundBindGroups[0] !== bindGroups.storage) {
      renderBundleEncoder.setBindGroup(0, bindGroups.storage);
      boundBindGroups[0] = bindGroups.storage;
    }
    if (this.MI !== pipeline) {
      renderBundleEncoder.setPipeline(pipeline);
      this.MI = pipeline;
    }
    if (boundBindGroups[1] !== bindGroups.texture) {
      renderBundleEncoder.setBindGroup(1, bindGroups.texture);
      boundBindGroups[1] = bindGroups.texture;
    }
    if (boundBindGroups[2] !== bindGroups.sampler) {
      renderBundleEncoder.setBindGroup(2, bindGroups.sampler);
      boundBindGroups[2] = bindGroups.sampler;
    }
    const culledDraw = isBufferLessRendering ? void 0 : this.SJ(engine, primitive, primitive.mesh, renderPass, cameraId);
    if ((culledDraw == null ? void 0 : culledDraw.deformedVertexOffset) !== void 0) {
      this.TJ(culledDraw.deformedVertexOffset);
    }
    const drawParametersBindGroup = this.kJ;
    if (boundBindGroups[3] !== drawParametersBindGroup) {
      renderBundleEncoder.setBindGroup(3, drawParametersBindGroup);
      boundBindGroups[3] = drawParametersBindGroup;
    }
    if (isBufferLessRendering) {
      renderBundleEncoder.draw(renderPass._drawVertexNumberForBufferLessRendering);
    } else {
      const mesh = primitive.mesh;
      const vertexBufferRanges = this.cI;
      const boundVertexBuffers = this.pJ;
      const instanceBuffer = (_a = culledDraw == null ? void 0 : culledDraw.instanceVertexBuffer) != null ? _a : vertexBufferRanges.get(mesh._variationVBOUid);
      if (boundVertexBuffers[0] !== instanceBuffer) {
        renderBundleEncoder.setVertexBuffer(0, instanceBuffer.buffer, instanceBuffer.offset, instanceBuffer.size);
        boundVertexBuffers[0] = instanceBuffer;
      }
      const vboHandles = VertexHandles.vboHandles;
      for (let i = 0; i < vboHandles.length; i++) {
        const vertexBuffer = vertexBufferRanges.get(vboHandles[i]);
        if (boundVertexBuffers[i + 1] !== vertexBuffer) {
          renderBundleEncoder.setVertexBuffer(i + 1, vertexBuffer.buffer, vertexBuffer.offset, vertexBuffer.size);
          boundVertexBuffers[i + 1] = vertexBuffer;
        }
      }
      if (primitive.hasIndices()) {
        const indicesBuffer = vertexBufferRanges.get(VertexHandles.iboHandle);
        const indexBitSize = primitive.getIndexBitSize();
        if (this.NI !== indicesBuffer || this.OI !== indexBitSize) {
          renderBundleEncoder.setIndexBuffer(
            indicesBuffer.buffer,
            indexBitSize,
            indicesBuffer.offset,
            indicesBuffer.size
          );
          this.NI = indicesBuffer;
          this.OI = indexBitSize;
        }
        if (culledDraw != null) {
          renderBundleEncoder.drawIndexedIndirect(culledDraw.indirectBuffer, culledDraw.indirectOffset);
        } else {
          const indicesAccessor = primitive.indicesAccessor;
          renderBundleEncoder.drawIndexed(indicesAccessor.elementCount, mesh.meshEntitiesInner.length);
        }
      } else if (culledDraw != null) {
        renderBundleEncoder.drawIndirect(culledDraw.indirectBuffer, culledDraw.indirectOffset);
      } else {
        const vertexCount = primitive.attributeAccessors[0].elementCount;
        renderBundleEncoder.draw(vertexCount, mesh.meshEntitiesInner.length);
      }
    }
  }
  /**
   * Registers the draw of a primitive for GPU culling when it applies, so that it is recorded as an indirect draw.
   * The condition must match the one of the CPU culling (MeshRendererComponent.__cullingWithViewFrustum), which
   * keeps the primitives of such meshes in the render list regardless of their visibility.
   *
   * @returns The indirect draw, or undefined to draw every instance directly (GPU culling disabled, not applicable,
   *   or its tables are full for this frame)
   */
  SJ(engine, primitive, mesh, renderPass, cameraId) {
    const gpuCulling = this.VH;
    if (gpuCulling == null || !gpuCulling.isRecording || !mesh._isGpuCullable || !MeshRendererComponent._isGpuCullingActive(engine, renderPass)) {
      return void 0;
    }
    const elementCount = primitive.hasIndices() ? primitive.indicesAccessor.elementCount : primitive.attributeAccessors[0].elementCount;
    return gpuCulling.registerDraw(engine, mesh, primitive, cameraId, elementCount);
  }
  /**
   * Notifies the GPU culling that the GPU instance data (transforms, visibility, cameras) was uploaded, so the
   * culling runs again in this frame.
   * @internal
   */
  _markGpuCullingInputsDirty() {
    var _a;
    (_a = this.VH) == null ? void 0 : _a.markInputsDirty();
  }
  /**
   * The GPU culling of the instances, if it was created (for tests and statistics).
   * @internal
   */
  _getGpuCulling() {
    return this.VH;
  }
  /**
   * Releases the GPU culling resources. The render bundles recording culled draws are dropped with them.
   * @internal
   */
  _destroyGpuCulling() {
    if (this.VH == null) {
      return;
    }
    this.XH();
    this.VH.destroy();
    this.VH = void 0;
  }
  /**
   * Creates a render bundle encoder for efficient rendering.
   * Render bundles allow pre-recording of rendering commands for better performance.
   *
   * @param renderPass - The render pass that will use this render bundle encoder
   */
  UJ(engine, renderPass, displayIdx) {
    const framebuffer = renderPass.getFramebuffer();
    const resolveFramebuffer = renderPass.getResolveFramebuffer();
    let colorFormats = [];
    let depthStencilFormat;
    let sampleCount = 1;
    const webxrSystem = engine._webXRSystemIfEnabled;
    if (framebuffer != null) {
      for (const colorAttachment of framebuffer.colorAttachments) {
        if (colorAttachment == null) {
          continue;
        }
        const textureResourceUid = colorAttachment._textureResourceUid;
        if (textureResourceUid == null || textureResourceUid < 0) {
          continue;
        }
        const texture = this.TH.get(textureResourceUid);
        if (texture != null) {
          colorFormats.push(texture.format);
        }
      }
      if (resolveFramebuffer != null && framebuffer.colorAttachments.length > 0) {
        const msaaAttachment = framebuffer.colorAttachments[0];
        const sampledCount = msaaAttachment == null ? void 0 : msaaAttachment.sampleCount;
        if (typeof sampledCount === "number" && sampledCount > 0) {
          sampleCount = sampledCount;
        }
      }
      if (framebuffer.depthAttachment != null) {
        const depthTextureUid = framebuffer.depthAttachment._textureResourceUid;
        if (depthTextureUid != null && depthTextureUid >= 0) {
          const depthTexture = this.TH.get(depthTextureUid);
          depthStencilFormat = depthTexture == null ? void 0 : depthTexture.format;
        } else {
          depthStencilFormat = void 0;
        }
      } else {
        depthStencilFormat = void 0;
      }
    } else if ((webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) && renderPass.isOutputForVr) {
      const view = engine.engineState.xrPoseWebGPU.views[displayIdx];
      const subImage = engine.engineState.xrGpuBinding.getViewSubImage(
        engine.engineState.xrProjectionLayerWebGPU,
        view
      );
      colorFormats = [subImage.colorTexture.format];
      depthStencilFormat = subImage.depthStencilTexture.format;
    } else {
      colorFormats = [navigator.gpu.getPreferredCanvasFormat()];
      depthStencilFormat = this.iI != null ? this.iI.format : DEFAULT_DEPTH_FORMAT;
    }
    if (colorFormats.length === 0) {
      colorFormats = [navigator.gpu.getPreferredCanvasFormat()];
    }
    const descriptor = {
      colorFormats,
      depthStencilFormat,
      sampleCount
    };
    return descriptor;
  }
  getEffekseerRenderPassOptions(engine, renderPass, displayIdx = 0) {
    var _a;
    if (renderPass == null) {
      const options2 = {
        colorFormat: navigator.gpu.getPreferredCanvasFormat(),
        depthFormat: void 0
      };
      return options2;
    }
    const framebuffer = renderPass.getFramebuffer();
    const resolveFramebuffer = renderPass.getResolveFramebuffer();
    let colorFormat;
    if (resolveFramebuffer != null && resolveFramebuffer.colorAttachments.length > 0) {
      const textureResourceUid = resolveFramebuffer.colorAttachments[0]._textureResourceUid;
      const texture = textureResourceUid != null ? this.TH.get(textureResourceUid) : void 0;
      colorFormat = texture == null ? void 0 : texture.format;
    } else if (framebuffer != null && framebuffer.colorAttachments.length > 0) {
      const textureResourceUid = framebuffer.colorAttachments[0]._textureResourceUid;
      const texture = textureResourceUid != null ? this.TH.get(textureResourceUid) : void 0;
      colorFormat = texture == null ? void 0 : texture.format;
    } else if (((_a = engine._webXRSystemIfEnabled) == null ? void 0 : _a.isWebXRMode) && renderPass.isOutputForVr) {
      const view = engine.engineState.xrPoseWebGPU.views[displayIdx];
      const subImage = engine.engineState.xrGpuBinding.getViewSubImage(
        engine.engineState.xrProjectionLayerWebGPU,
        view
      );
      colorFormat = subImage.colorTexture.format;
    } else {
      colorFormat = navigator.gpu.getPreferredCanvasFormat();
    }
    const options = {
      colorFormat,
      depthFormat: void 0
    };
    return options;
  }
  getOrCreateRenderPassEncoderForEffekseerExternalRendering(engine, renderPass, displayIdx) {
    this.jI();
    if (this.WH != null) {
      this.kI();
    }
    const framebuffer = renderPass.getFramebuffer();
    const resolveFramebuffer = renderPass.getResolveFramebuffer();
    const webxrSystem = engine._webXRSystemIfEnabled;
    const colorAttachments = [];
    if (resolveFramebuffer != null) {
      for (const colorAttachment of resolveFramebuffer.colorAttachments) {
        const textureView = this.TH.get(
          colorAttachment._textureViewAsRenderTargetResourceUid
        );
        colorAttachments.push({
          view: textureView,
          loadOp: "load",
          storeOp: "store"
        });
      }
    } else if (framebuffer != null) {
      for (const colorAttachment of framebuffer.colorAttachments) {
        const textureView = this.TH.get(
          colorAttachment._textureViewAsRenderTargetResourceUid
        );
        colorAttachments.push({
          view: textureView,
          loadOp: "load",
          storeOp: "store"
        });
      }
    } else if ((webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) && renderPass.isOutputForVr) {
      const view = engine.engineState.xrPoseWebGPU.views[displayIdx];
      const subImage = engine.engineState.xrGpuBinding.getViewSubImage(
        engine.engineState.xrProjectionLayerWebGPU,
        view
      );
      colorAttachments.push({
        view: subImage.colorTexture.createView(subImage.getViewDescriptor()),
        loadOp: "load",
        storeOp: "store"
      });
    } else {
      colorAttachments.push({
        view: this.zI(),
        loadOp: "load",
        storeOp: "store"
      });
    }
    if (colorAttachments.length === 0) {
      return void 0;
    }
    const renderPassDescriptor = {
      colorAttachments,
      label: `${renderPass.uniqueName}_EffekseerExternal`
    };
    this.FJ(renderPassDescriptor);
    this.UH = this.YH.beginRenderPass(renderPassDescriptor);
    return this.UH;
  }
  createRenderBundleEncoder(engine, renderPass, displayIdx) {
    var _a, _b, _c, _d;
    const gpuDevice = this.SH.gpuDevice;
    const renderBundleDescriptor = this.UJ(engine, renderPass, displayIdx);
    const descriptorKey = JSON.stringify({
      colorFormats: renderBundleDescriptor.colorFormats,
      depthStencilFormat: (_a = renderBundleDescriptor.depthStencilFormat) != null ? _a : null,
      sampleCount: renderBundleDescriptor.sampleCount
    });
    this.UI = renderPass;
    this.VI = displayIdx;
    if (this.WH != null && this.RI === descriptorKey) {
      return;
    }
    this.WH = gpuDevice.createRenderBundleEncoder(renderBundleDescriptor);
    this.RI = descriptorKey;
    this.GJ();
    if (engine.config.isGpuCullingEnabled) {
      (_c = this[_b = "VH"]) != null ? _c : this[_b] = new WebGpuGpuCulling(gpuDevice);
    }
    (_d = this.VH) == null ? void 0 : _d.beginRecording();
  }
  /**
   * Forgets the state recorded into the render bundle encoder. A new encoder starts without any
   * pipeline, bind group or buffer set.
   */
  GJ() {
    this.MI = void 0;
    this.oJ.length = 0;
    this.pJ.length = 0;
    this.NI = void 0;
    this.OI = void 0;
  }
  /**
   * Creates a render pass encoder for immediate rendering commands.
   * This encoder is used for recording rendering commands that will be executed immediately.
   *
   * @param engine - The engine instance
   * @param renderPass - The render pass configuration including targets and clear values
   * @param displayIdx - The display index for stereo rendering (0 for left eye, 1 for right eye)
   */
  createRenderPassEncoder(engine, renderPass, displayIdx) {
    if (this.UH != null && this.nI === renderPass && this.oI === displayIdx && !this.dI.active) {
      return;
    }
    const targetViews = this.vI;
    const targetKind = this.EJ(engine, renderPass, targetViews);
    let mergePendingClear = false;
    const pendingClear = this.dI;
    if (pendingClear.active) {
      if (targetKind !== RENDER_PASS_TARGET_KIND_NONE && targetKind === pendingClear.targetKind && _WebGpuResourceRepository._I(targetViews, pendingClear.targetViews)) {
        mergePendingClear = true;
      } else {
        this.$I();
      }
    }
    if (this.UH != null) {
      if (!mergePendingClear && targetKind !== RENDER_PASS_TARGET_KIND_NONE && targetKind === this.SI && !renderPass.toClearColorBuffer && !renderPass.toClearDepthBuffer && _WebGpuResourceRepository._I(targetViews, this.TI)) {
        this.nI = renderPass;
        this.oI = displayIdx;
        return;
      }
      this.AI();
    }
    this.HJ(engine, renderPass, displayIdx, mergePendingClear);
    if (mergePendingClear) {
      this.aJ();
    }
    if (this.UH != null) {
      this.nI = renderPass;
      this.oI = displayIdx;
      this.SI = targetKind;
      this.vI = this.TI;
      this.TI = targetViews;
    }
  }
  /**
   * Collects the attachment views `__beginRenderPassEncoder` would use for the render pass.
   * Must be kept in sync with the attachment selection in `__beginRenderPassEncoder`.
   *
   * @returns The kind of the target, or `RENDER_PASS_TARGET_KIND_NONE` if the render pass must not be merged.
   */
  EJ(engine, renderPass, out) {
    var _a;
    out.length = 0;
    const framebuffer = renderPass.getFramebuffer();
    const resolveFramebuffer = renderPass.getResolveFramebuffer();
    const webGpuResources = this.TH;
    if (resolveFramebuffer != null && framebuffer != null) {
      for (let i = 0; i < resolveFramebuffer.colorAttachments.length; i++) {
        const colorAttachment = framebuffer.colorAttachments[i];
        const resolveColorAttachment = resolveFramebuffer.colorAttachments[i];
        out.push(webGpuResources.get(colorAttachment._textureViewAsRenderTargetResourceUid));
        out.push(webGpuResources.get(resolveColorAttachment._textureViewAsRenderTargetResourceUid));
      }
      let depthTextureView = this.bI;
      const depthAttachment = framebuffer.depthAttachment;
      if (depthAttachment != null && webGpuResources.get(depthAttachment._textureResourceUid) != null) {
        depthTextureView = webGpuResources.get(depthAttachment._textureViewResourceUid);
      }
      out.push(depthTextureView);
      return RENDER_PASS_TARGET_KIND_MSAA_RESOLVE;
    }
    if (framebuffer != null) {
      for (const colorAttachment of framebuffer.colorAttachments) {
        out.push(webGpuResources.get(colorAttachment._textureViewAsRenderTargetResourceUid));
      }
      let depthTextureView;
      const depthAttachment = framebuffer.depthAttachment;
      if (depthAttachment != null && webGpuResources.get(depthAttachment._textureResourceUid) != null) {
        depthTextureView = webGpuResources.get(depthAttachment._textureViewAsRenderTargetResourceUid);
      }
      out.push(depthTextureView);
      return RENDER_PASS_TARGET_KIND_FRAMEBUFFER;
    }
    if (((_a = engine._webXRSystemIfEnabled) == null ? void 0 : _a.isWebXRMode) && renderPass.isOutputForVr) {
      return RENDER_PASS_TARGET_KIND_NONE;
    }
    out.push(this.zI());
    out.push(this.bI);
    return RENDER_PASS_TARGET_KIND_CANVAS;
  }
  /**
   * Returns the attachment for the current canvas texture of this frame.
   *
   * When the browser accepts a GPUTexture where a GPUTextureView is expected (the texture's default
   * view is used), the texture itself is returned. This saves a `createView()` call per frame.
   */
  zI() {
    let view = this.yI;
    if (view == null) {
      const texture = this.SH.context.getCurrentTexture();
      view = _WebGpuResourceRepository.VJ(this.SH.gpuDevice) ? texture : texture.createView();
      this.yI = view;
    }
    return view;
  }
  /**
   * Detects once whether a GPUTexture can be passed as a render pass attachment view.
   * Browsers that do not support it throw a TypeError while converting the descriptor.
   */
  static VJ(gpuDevice) {
    let supported = _WebGpuResourceRepository.IJ;
    if (supported !== void 0) {
      return supported;
    }
    let texture;
    try {
      texture = gpuDevice.createTexture({
        size: [1, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
      const pass = gpuDevice.createCommandEncoder().beginRenderPass({
        colorAttachments: [{ view: texture, loadOp: "clear", storeOp: "store" }]
      });
      pass.end();
      supported = true;
    } catch {
      supported = false;
    } finally {
      texture == null ? void 0 : texture.destroy();
    }
    _WebGpuResourceRepository.IJ = supported;
    return supported;
  }
  /**
   * Begins a render pass on the frame's command encoder. A deferred clear of the system depth
   * texture (see flush()) is applied here to the first render pass that attaches it.
   */
  rI(renderPassDescriptor) {
    const deferredDepthClearValue = this.wI;
    if (deferredDepthClearValue !== void 0) {
      const depthStencilAttachment = renderPassDescriptor.depthStencilAttachment;
      if (depthStencilAttachment != null && depthStencilAttachment.view === this.bI) {
        if (depthStencilAttachment.depthLoadOp === "load") {
          depthStencilAttachment.depthLoadOp = "clear";
          depthStencilAttachment.depthClearValue = deferredDepthClearValue;
        }
        this.wI = void 0;
      }
    }
    this.FJ(renderPassDescriptor);
    return this.YH.beginRenderPass(renderPassDescriptor);
  }
  /** Lets the GPU timer measure the render pass while a frame is being measured. */
  FJ(renderPassDescriptor) {
    var _a;
    const gpuTimer = this.mI;
    if (gpuTimer == null || renderPassDescriptor.timestampWrites != null) {
      return;
    }
    const timestampWrites = gpuTimer.getTimestampWrites((_a = renderPassDescriptor.label) != null ? _a : "renderPass");
    if (timestampWrites != null) {
      renderPassDescriptor.timestampWrites = timestampWrites;
    }
  }
  /**
   * Returns the GPU timer, creating it on first use.
   * @internal Use Engine.gpuTimerEnabled and Engine.gpuTimeMilliseconds instead.
   */
  _getGpuTimer() {
    if (this.mI == null) {
      this.mI = new WebGpuGpuTimer(this.SH.gpuDevice);
    }
    return this.mI;
  }
  /**
   * Encodes the pending clear (see clearFrameBuffer) as a render pass of its own.
   * Anything recorded in the open render pass happened before the clear, so it is ended first.
   */
  $I() {
    var _a;
    const pendingClear = this.dI;
    if (!pendingClear.active) {
      return;
    }
    this.AI();
    this.HJ(pendingClear.engine, pendingClear.renderPass, pendingClear.displayIdx, true, false);
    this.aJ();
    (_a = this.UH) == null ? void 0 : _a.end();
    this.UH = void 0;
  }
  aJ() {
    const pendingClear = this.dI;
    pendingClear.active = false;
    pendingClear.engine = void 0;
    pendingClear.renderPass = void 0;
    pendingClear.targetViews.length = 0;
    pendingClear.isColorClear = false;
    pendingClear.isDepthClear = false;
  }
  /**
   * Ends the open render pass (if any) and encodes a pending clear, so that commands can be recorded
   * directly on the command encoder (copies, mipmap generation, external rendering, submission).
   */
  jI() {
    this.$I();
    this.AI();
  }
  /**
   * Executes a render bundle in the open render pass. Bundles are batched and executed with a
   * single executeBundles() call when the pass is ended or handed out for direct drawing.
   */
  BI(renderBundle) {
    this.uJ.push(renderBundle);
  }
  sI() {
    const pendingRenderBundles = this.uJ;
    if (pendingRenderBundles.length === 0 || this.UH == null) {
      return;
    }
    this.UH.executeBundles(pendingRenderBundles);
    pendingRenderBundles.length = 0;
  }
  static _I(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  /**
   * Ends the open render pass encoder, if any.
   *
   * A pending render bundle encoder is executed into the pass only when it was recorded for the
   * same render pass. Otherwise it belongs to a render pass that is still being recorded (the open
   * encoder is just being kept for merging) and must stay pending.
   */
  AI() {
    const renderPassEncoder = this.UH;
    if (renderPassEncoder == null) {
      return;
    }
    this.sI();
    if (this.WH != null && this.UI === this.nI && this.VI === this.oI) {
      renderPassEncoder.executeBundles([this.WH.finish()]);
      this.kI();
    }
    renderPassEncoder.end();
    this.UH = void 0;
    this.nI = void 0;
    this.oI = -1;
    this.SI = RENDER_PASS_TARGET_KIND_NONE;
  }
  kI() {
    var _a;
    (_a = this.VH) == null ? void 0 : _a.abortRecording();
    this.WH = void 0;
    this.GJ();
    this.RI = void 0;
    this.UI = void 0;
    this.VI = -1;
  }
  /**
   * Begins a new render pass encoder for the render pass. The caller must have ended any open encoder.
   */
  HJ(engine, renderPass, displayIdx, mergePendingClear, useOwnClears = true) {
    const framebuffer = renderPass.getFramebuffer();
    const resolveFramebuffer = renderPass.getResolveFramebuffer();
    const pendingClear = mergePendingClear ? this.dI : void 0;
    let clearValue;
    if (useOwnClears && renderPass.toClearColorBuffer) {
      clearValue = {
        r: renderPass.clearColor.x,
        g: renderPass.clearColor.y,
        b: renderPass.clearColor.z,
        a: renderPass.clearColor.w
      };
    } else if (pendingClear == null ? void 0 : pendingClear.isColorClear) {
      const c = pendingClear.clearColor;
      clearValue = { r: c.r, g: c.g, b: c.b, a: c.a };
    }
    let depthClearValue;
    if (useOwnClears && renderPass.toClearDepthBuffer) {
      depthClearValue = renderPass.clearDepth;
    } else if (pendingClear == null ? void 0 : pendingClear.isDepthClear) {
      depthClearValue = pendingClear.clearDepth;
    }
    const colorLoadOp = clearValue != null ? "clear" : "load";
    const depthLoadOp = depthClearValue != null ? "clear" : "load";
    const webxrSystem = engine._webXRSystemIfEnabled;
    if (resolveFramebuffer != null && framebuffer != null) {
      let depthTextureView = this.bI;
      if (framebuffer.depthAttachment != null) {
        const depthTexture = this.TH.get(framebuffer.depthAttachment._textureResourceUid);
        if (depthTexture != null) {
          depthTextureView = this.TH.get(
            framebuffer.depthAttachment._textureViewResourceUid
          );
        }
      }
      const renderPassDescriptor = {
        colorAttachments: [],
        depthStencilAttachment: {
          view: depthTextureView,
          depthClearValue,
          depthLoadOp,
          depthStoreOp: "store"
        },
        label: renderPass.uniqueName
      };
      const colorAttachments = [];
      for (let i = 0; i < resolveFramebuffer.colorAttachments.length; i++) {
        const colorAttachment = framebuffer.colorAttachments[i];
        const resolveColorAttachment = resolveFramebuffer.colorAttachments[i];
        const textureView = this.TH.get(
          colorAttachment._textureViewAsRenderTargetResourceUid
        );
        let resolveTextureView = this.TH.get(
          resolveColorAttachment._textureViewAsRenderTargetResourceUid
        );
        colorAttachments.push({
          view: textureView,
          resolveTarget: resolveTextureView,
          clearValue,
          loadOp: colorLoadOp,
          storeOp: "store"
        });
      }
      renderPassDescriptor.colorAttachments = colorAttachments;
      this.UH = this.rI(renderPassDescriptor);
    } else if (framebuffer != null) {
      let depthTextureView;
      if (framebuffer.depthAttachment != null) {
        const depthTexture = this.TH.get(framebuffer.depthAttachment._textureResourceUid);
        if (depthTexture != null) {
          depthTextureView = this.TH.get(
            framebuffer.depthAttachment._textureViewAsRenderTargetResourceUid
          );
        }
      }
      let depthStencilAttachment;
      if (depthTextureView != null) {
        depthStencilAttachment = {
          view: depthTextureView,
          depthClearValue,
          depthLoadOp,
          depthStoreOp: "store"
        };
      }
      const renderPassDescriptor = {
        colorAttachments: [],
        depthStencilAttachment,
        label: renderPass.uniqueName
      };
      const colorAttachments = [];
      for (let colorAttachment of framebuffer.colorAttachments) {
        const textureView = this.TH.get(
          colorAttachment._textureViewAsRenderTargetResourceUid
        );
        colorAttachments.push({
          view: textureView,
          clearValue,
          loadOp: colorLoadOp,
          storeOp: "store"
        });
      }
      renderPassDescriptor.colorAttachments = colorAttachments;
      this.UH = this.rI(renderPassDescriptor);
    } else if ((webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) && renderPass.isOutputForVr) {
      const colorAttachments = [];
      const view = engine.engineState.xrPoseWebGPU.views[displayIdx];
      const subImage = engine.engineState.xrGpuBinding.getViewSubImage(
        engine.engineState.xrProjectionLayerWebGPU,
        view
      );
      colorAttachments.push({
        view: subImage.colorTexture.createView(subImage.getViewDescriptor()),
        clearValue,
        loadOp: colorLoadOp,
        storeOp: "store"
      });
      const depthStencilAttachment = {
        view: subImage.depthStencilTexture.createView(subImage.getViewDescriptor()),
        depthClearValue,
        depthLoadOp,
        depthStoreOp: "store"
      };
      const renderPassDescriptor = {
        colorAttachments,
        depthStencilAttachment
      };
      this.UH = this.rI(renderPassDescriptor);
    } else {
      const renderPassDescriptor = {
        colorAttachments: [
          {
            view: this.zI(),
            clearValue,
            loadOp: colorLoadOp,
            storeOp: "store"
          }
        ],
        depthStencilAttachment: {
          view: this.bI,
          depthClearValue,
          depthLoadOp,
          depthStoreOp: "store"
        },
        label: renderPass.uniqueName
      };
      this.UH = this.rI(renderPassDescriptor);
    }
  }
  /**
   * Drops every cached render bundle. The GPU culling allocations of the dropped bundles are released after the
   * frame (a dropped bundle may already have been executed in it).
   */
  XH() {
    var _a;
    this.uI.clear();
    (_a = this.VH) == null ? void 0 : _a.retireAllBundles();
  }
  /**
   * Caches a recorded render bundle, or drops the cache when caching is disabled.
   */
  JJ(engine, renderBundleKey, renderBundle) {
    var _a, _b;
    if (engine.config.cacheWebGpuRenderBundles) {
      (_a = this.VH) == null ? void 0 : _a.finishRecording(renderBundleKey);
      this.uI.set(renderBundleKey, renderBundle);
    } else {
      (_b = this.VH) == null ? void 0 : _b.finishRecording(void 0);
      this.XH();
    }
  }
  KJ(engine) {
    if (this.PI || engine.config.isGpuCullingEnabled !== this.rJ || engine.config.isComputeSkinningEnabled !== this.sJ || MeshRendererComponent._isFrustumCullingEnabled !== this.tJ) {
      this.XH();
      engine.engineState.webgpuRenderBundleMode = false;
      this.PI = false;
      this.rJ = engine.config.isGpuCullingEnabled;
      this.sJ = engine.config.isComputeSkinningEnabled;
      this.tJ = MeshRendererComponent._isFrustumCullingEnabled;
    }
    const storageBindGroupBuffers = this.DI;
    if (this.PH != null && (storageBindGroupBuffers[0] !== this.aI || storageBindGroupBuffers[1] !== this.gI || storageBindGroupBuffers[2] !== this.ZH || storageBindGroupBuffers[3] !== this._H || storageBindGroupBuffers[4] !== this.bJ())) {
      this.XH();
      engine.engineState.webgpuRenderBundleMode = false;
    }
    if (engine.materialRepository.bindingStateVersion !== this.wJ || CameraComponent.getCurrent(engine) !== this.xJ || EntityRepository.updateCount !== this.yJ || Primitive.variantUpdateCount !== this.zJ || MeshRendererComponent.updateCount !== this.AJ) {
      this.XH();
      engine.engineState.webgpuRenderBundleMode = false;
      this.xJ = CameraComponent.getCurrent(engine);
      this.wJ = engine.materialRepository.bindingStateVersion;
      this.yJ = EntityRepository.updateCount;
      this.zJ = Primitive.variantUpdateCount;
      this.AJ = MeshRendererComponent.updateCount;
    }
  }
  renderWithRenderBundle(engine, renderPass, displayIdx) {
    this.KJ(engine);
    if (renderPass._isChangedSortRenderResult || !engine.config.cacheWebGpuRenderBundles) {
      this.XH();
    }
    const renderBundleKey = `${renderPass.renderPassUID}-${displayIdx}`;
    let renderBundle = this.uI.get(renderBundleKey);
    if (renderBundle != null) {
      this.createRenderPassEncoder(engine, renderPass, displayIdx);
      if (this.UH != null) {
        this.BI(renderBundle);
        return true;
      }
    }
    return false;
  }
  renderWithRenderBundleAndKeepRenderPass(engine, renderPass, displayIdx) {
    this.KJ(engine);
    if (renderPass._isChangedSortRenderResult || !engine.config.cacheWebGpuRenderBundles) {
      this.XH();
    }
    const renderBundleKey = `${renderPass.renderPassUID}-${displayIdx}`;
    const renderBundle = this.uI.get(renderBundleKey);
    if (renderBundle != null) {
      this.createRenderPassEncoder(engine, renderPass, displayIdx);
      if (this.UH != null) {
        this.BI(renderBundle);
        this.sI();
        this.kI();
        return this.UH;
      }
    }
    return void 0;
  }
  finishRenderBundleEncoder(engine, renderPass, displayIdx) {
    this.createRenderPassEncoder(engine, renderPass, displayIdx);
    if (this.UH != null && this.WH != null) {
      const renderBundle = this.WH.finish();
      this.JJ(engine, `${renderPass.renderPassUID}-${displayIdx}`, renderBundle);
      this.BI(renderBundle);
      this.kI();
    } else {
      console.log("renderPassEncoder is null");
    }
  }
  finishRenderBundleEncoderAndKeepRenderPass(engine, renderPass, displayIdx) {
    this.createRenderPassEncoder(engine, renderPass, displayIdx);
    if (this.UH != null && this.WH != null) {
      const renderBundle = this.WH.finish();
      this.JJ(engine, `${renderPass.renderPassUID}-${displayIdx}`, renderBundle);
      this.BI(renderBundle);
      this.kI();
    }
    this.sI();
    return this.UH;
  }
  getOrCreateRenderPassEncoderForExternalRendering(engine, renderPass, displayIdx) {
    this.createRenderPassEncoder(engine, renderPass, displayIdx);
    this.sI();
    return this.UH;
  }
  endRenderPassEncoderForExternalRendering() {
    if (this.UH == null) {
      return;
    }
    this.sI();
    if (this.WH != null) {
      this.UH.executeBundles([this.WH.finish()]);
      this.kI();
    }
    this.AI();
  }
  WJ() {
    if (this.QI == null) {
      this.QI = this.SH.gpuDevice.createShaderModule({
        label: "DepthPrepass",
        code: "@fragment\nfn main() {}\n"
      });
    }
    return this.QI;
  }
  getOrCreateRenderPipeline(renderPipelineId, pipelineLayoutKey, pipelineLayout, primitive, material, renderPass, zWrite, options = {}) {
    var _a, _b;
    const depthOnly = (_a = options.depthOnly) != null ? _a : false;
    const allowEqualDepth = (_b = options.allowEqualDepth) != null ? _b : false;
    const pipelineKey = `${renderPipelineId}|${pipelineLayoutKey}|${depthOnly ? "depthOnly" : "color"}|${allowEqualDepth ? "equal" : "less"}`;
    const cachedPipeline = this.EI.get(pipelineKey);
    if (cachedPipeline != null && this.FI.get(pipelineKey) === material.pipelineStateVersion) {
      return [cachedPipeline, false];
    }
    const gpuDevice = this.SH.gpuDevice;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    const modules = this.TH.get(material.getShaderProgramUid(primitive));
    if (modules != null) {
      new Error("Shader Modules is not found");
    }
    const gpuVertexBufferLayouts = [];
    if (!renderPass.isBufferLessRenderingMode()) {
      gpuVertexBufferLayouts.push({
        stepMode: "instance",
        attributes: [
          {
            shaderLocation: VertexAttribute.Instance.getAttributeSlot(),
            offset: 0,
            format: "uint32x4"
          }
        ],
        arrayStride: 4 * 4
      });
    }
    primitive.attributeAccessors.forEach((accessor, i) => {
      const slotIdx = VertexAttribute.toAttributeSlotFromJoinedString(primitive.attributeSemantics[i]);
      const attribute = {
        shaderLocation: slotIdx,
        offset: 0,
        format: _WebGpuResourceRepository.CJ(accessor)
      };
      gpuVertexBufferLayouts.push({
        stepMode: "vertex",
        arrayStride: primitive.attributeAccessors[i].actualByteStride,
        attributes: [attribute]
      });
    });
    let blend;
    if (material.isBlend()) {
      if (material.alphaMode === AlphaMode.Blend) {
        blend = {
          color: {
            srcFactor: material.blendFuncSrcFactor.webgpu,
            dstFactor: material.blendFuncDstFactor.webgpu,
            operation: material.blendEquationMode.webgpu
          },
          alpha: {
            srcFactor: material.blendFuncAlphaSrcFactor.webgpu,
            dstFactor: material.blendFuncAlphaDstFactor.webgpu,
            operation: material.blendEquationModeAlpha.webgpu
          }
        };
      }
    }
    const mode = renderPass.isBufferLessRenderingMode() ? renderPass._primitiveModeForBufferLessRendering : primitive.primitiveMode;
    const topology = mode.getWebGPUTypeStr();
    let stripIndexFormat;
    if (primitive.hasIndices() && (topology === "triangle-strip" || topology === "line-strip")) {
      stripIndexFormat = primitive.getIndexBitSize();
    }
    const framebuffer = renderPass.getFramebuffer();
    let targets = [
      {
        // @location(0) in fragment shader
        format: presentationFormat,
        blend
      }
    ];
    let depthStencilFormat = DEFAULT_DEPTH_FORMAT;
    if (framebuffer != null) {
      targets = [];
      for (let colorAttachment of framebuffer.colorAttachments) {
        const texture = this.TH.get(colorAttachment._textureResourceUid);
        targets.push({
          format: texture.format,
          blend,
          writeMask: this.setColorWriteMask(material)
        });
      }
      if (framebuffer.depthAttachment != null) {
        const depthTexture = this.TH.get(framebuffer.depthAttachment._textureResourceUid);
        depthStencilFormat = depthTexture.format;
      } else {
        depthStencilFormat = void 0;
      }
    }
    const pipeline = gpuDevice.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: modules.vsModule,
        entryPoint: "main",
        buffers: gpuVertexBufferLayouts
      },
      fragment: {
        module: depthOnly ? this.WJ() : modules.fsModule,
        entryPoint: "main",
        targets: depthOnly ? targets.map((target) => ({ format: target.format, writeMask: 0 })) : targets
      },
      primitive: {
        topology,
        stripIndexFormat,
        frontFace: material.cullFrontFaceCCW ? "ccw" : "cw",
        cullMode: material.cullFace ? material.cullFaceBack ? "back" : "front" : "none"
      },
      depthStencil: depthStencilFormat == null ? void 0 : {
        depthWriteEnabled: depthOnly ? true : zWrite,
        depthCompare: depthOnly || allowEqualDepth ? "less-equal" : renderPass.isDepthTest ? "less" : "always",
        format: depthStencilFormat
      },
      multisample: {
        count: renderPass.getResolveFramebuffer() != null ? renderPass.getFramebuffer().colorAttachments[0].sampleCount : 1
      }
    });
    this.EI.set(pipelineKey, pipeline);
    this.FI.set(pipelineKey, material.pipelineStateVersion);
    return [pipeline, true];
  }
  /**
   * Submits all recorded commands to the GPU queue and resets the command encoder.
   * This method must be called to execute any recorded rendering commands.
   */
  flush() {
    const gpuDevice = this.SH.gpuDevice;
    const pendingClear = this.dI;
    if (pendingClear.active && !pendingClear.isColorClear && pendingClear.targetKind === RENDER_PASS_TARGET_KIND_CANVAS && pendingClear.targetViews[pendingClear.targetViews.length - 1] === this.bI) {
      this.wI = pendingClear.clearDepth;
      this.aJ();
    }
    this.jI();
    const gpuTimer = this.mI;
    const gpuCulling = this.VH;
    const cullingCommands = gpuCulling == null ? void 0 : gpuCulling.encode(this.aI, gpuTimer, {
      blendShapeData: this.gI,
      morphOffsets: this.ZH,
      morphWeights: this._H
    });
    gpuTimer == null ? void 0 : gpuTimer.encodeResolve(this.YH);
    const commands = this.YH.finish();
    this.qJ.submit(cullingCommands != null ? [cullingCommands, commands] : [commands]);
    gpuTimer == null ? void 0 : gpuTimer.afterSubmit();
    this.YH = gpuDevice.createCommandEncoder();
    if (gpuCulling == null ? void 0 : gpuCulling.afterSubmit()) {
      this.XH();
      this.PI = true;
    }
    if (this.yI != null) {
      this.yI = void 0;
    }
  }
  setColorWriteMask(material) {
    let flags = 0;
    if (material.colorWriteMask[0]) {
      flags |= 1;
    }
    if (material.colorWriteMask[1]) {
      flags |= 2;
    }
    if (material.colorWriteMask[2]) {
      flags |= 4;
    }
    if (material.colorWriteMask[3]) {
      flags |= 8;
    }
    return flags;
  }
  /**
   * Create Cube Texture from image files.
   * @param baseUri the base uri to load images;
   * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
   * @returns the WebGLResourceHandle for the generated Cube Texture
   */
  async createCubeTextureFromFiles(engine, baseUri, mipLevelCount, isNamePosNeg, hdriFormat) {
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
            [baseUri + posX + i + extension, "posX"],
            [baseUri + negX + i + extension, "negX"],
            [baseUri + posY + i + extension, "posY"],
            [baseUri + negY + i + extension, "negY"],
            [baseUri + posZ + i + extension, "posZ"],
            [baseUri + negZ + i + extension, "negZ"]
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
      const imageBitmaps = [];
      for (const image of images) {
        if (image.hdriFormat === HdriFormat.HDR_LINEAR) {
          imageBitmaps.push(image);
        } else {
          await image.decode();
          const imageBitmap = await createImageBitmap(image);
          imageBitmaps.push(imageBitmap);
          imageBitmap.side = image.side;
        }
      }
      const imageObj = {};
      for (const imageBitmap of imageBitmaps) {
        switch (imageBitmap.side) {
          case "posX":
            imageObj.posX = imageBitmap;
            break;
          case "posY":
            imageObj.posY = imageBitmap;
            break;
          case "posZ":
            imageObj.posZ = imageBitmap;
            break;
          case "negX":
            imageObj.negX = imageBitmap;
            break;
          case "negY":
            imageObj.negY = imageBitmap;
            break;
          case "negZ":
            imageObj.negZ = imageBitmap;
            break;
        }
        if (i === 0) {
          width = imageBitmap.width;
          height = imageBitmap.height;
        }
      }
      imageArgs.push(
        imageObj
      );
    }
    const [resourceHandle, sampler] = this.createCubeTexture(engine, mipLevelCount, imageArgs, width, height);
    return [resourceHandle, sampler, width, height];
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
    var _a;
    const mipmaps = [];
    for (let i = 0; i < mipLevelCount; i++) {
      const imageBitmaps = [];
      if (images[i].posX instanceof ImageBitmap || images[0].posX instanceof HTMLCanvasElement) {
        imageBitmaps.push(images[i].posX);
        imageBitmaps.push(images[i].negX);
        imageBitmaps.push(images[i].posY);
        imageBitmaps.push(images[i].negY);
        imageBitmaps.push(images[i].posZ);
        imageBitmaps.push(images[i].negZ);
      }
      mipmaps.push(imageBitmaps);
    }
    const gpuDevice = this.SH.gpuDevice;
    const isHdrLinear = ((_a = mipmaps[0][0]) == null ? void 0 : _a.hdriFormat) === HdriFormat.HDR_LINEAR;
    const cubemapFormat = isHdrLinear ? gpuDevice.features.has("float32-filterable") ? "rgba32float" : "rgba16float" : "rgba8unorm";
    const cubemapTexture = gpuDevice.createTexture({
      dimension: "2d",
      size: [width, height, 6],
      format: cubemapFormat,
      mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });
    for (let i = 0; i < mipLevelCount; i++) {
      for (let j = 0; j < mipmaps[i].length; j++) {
        const imageBitmap = mipmaps[i][j];
        if (imageBitmap.hdriFormat === HdriFormat.HDR_LINEAR) {
          const newFloat323Array = new Float32Array(imageBitmap.width * imageBitmap.height * 4);
          const dataFloat = imageBitmap.dataFloat;
          const size = imageBitmap.width * imageBitmap.height;
          for (let k = 0; k < size; k++) {
            newFloat323Array[k * 4] = dataFloat[k * 3];
            newFloat323Array[k * 4 + 1] = dataFloat[k * 3 + 1];
            newFloat323Array[k * 4 + 2] = dataFloat[k * 3 + 2];
            newFloat323Array[k * 4 + 3] = 1;
          }
          const isFloat16 = cubemapFormat === "rgba16float";
          const packed = packRgbaRowsForUpload(newFloat323Array, imageBitmap.width, imageBitmap.height, isFloat16);
          const buffer = gpuDevice.createBuffer({
            size: packed.data.byteLength,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
          });
          if (isFloat16) {
            new Uint16Array(buffer.getMappedRange()).set(packed.data);
          } else {
            new Float32Array(buffer.getMappedRange()).set(packed.data);
          }
          buffer.unmap();
          const commandEncoder = gpuDevice.createCommandEncoder();
          commandEncoder.copyBufferToTexture(
            {
              buffer,
              bytesPerRow: packed.bytesPerRow,
              rowsPerImage: imageBitmap.height
            },
            { texture: cubemapTexture, origin: [0, 0, j], mipLevel: i },
            [imageBitmap.width, imageBitmap.height, 1]
          );
          const commandBuffer = commandEncoder.finish();
          gpuDevice.queue.submit([commandBuffer]);
        } else {
          gpuDevice.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: cubemapTexture, origin: [0, 0, j], mipLevel: i },
            [imageBitmap.width, imageBitmap.height, 1]
          );
        }
      }
    }
    const handle = this.DD(cubemapTexture);
    const wrapS = TextureParameter.Repeat;
    const wrapT = TextureParameter.Repeat;
    const minFilter = mipLevelCount === 1 ? TextureParameter.Linear : TextureParameter.LinearMipmapLinear;
    const magFilter = TextureParameter.Linear;
    const sampler = new Sampler(engine, { wrapS, wrapT, minFilter, magFilter, anisotropy: false });
    sampler.create();
    return [handle, sampler];
  }
  /**
   * create a TextureArray
   * @param width
   * @param height
   * @param arrayLength
   * @param mipLevelCount
   * @param internalFormat
   * @param format
   * @param type
   * @returns texture handle
   */
  createTextureArray(width, height, arrayLength, mipLevelCount, internalFormat, _format, _type, imageData) {
    const gpuDevice = this.SH.gpuDevice;
    const textureDescriptor = {
      size: [width, height, arrayLength],
      format: internalFormat.webgpu,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      dimension: "2d",
      mipLevelCount
    };
    const gpuTexture = gpuDevice.createTexture(textureDescriptor);
    if (!(imageData.buffer instanceof ArrayBuffer)) {
      throw new Error("SharedArrayBuffer is not supported in this code path.");
    }
    const pixelData = imageData instanceof Uint8ClampedArray ? imageData : new Uint8ClampedArray(
      imageData.buffer,
      imageData.byteOffset,
      imageData.byteLength / Uint8ClampedArray.BYTES_PER_ELEMENT
    );
    const bytesPerRow = width * 4;
    let uploadData = pixelData;
    let uploadBytesPerRow = bytesPerRow;
    if (height > 1 && bytesPerRow % 256 !== 0) {
      uploadBytesPerRow = Math.ceil(bytesPerRow / 256) * 256;
      uploadData = new Uint8ClampedArray(uploadBytesPerRow * height);
      for (let y = 0; y < height; y++) {
        uploadData.set(pixelData.subarray(y * bytesPerRow, (y + 1) * bytesPerRow), y * uploadBytesPerRow);
      }
    }
    for (let i = 0; i < arrayLength; i++) {
      gpuDevice.queue.writeTexture(
        { texture: gpuTexture, origin: [0, 0, i] },
        uploadData,
        { bytesPerRow: uploadBytesPerRow, rowsPerImage: height },
        [width, height, 1]
      );
    }
    const textureHandle = this.DD(gpuTexture);
    return textureHandle;
  }
  /**
   * Creates a storage buffer from a Float32Array and registers it as a WebGPU resource.
   * Storage buffers are used for storing large amounts of data accessible from shaders.
   *
   * @param gpuInstanceDataBuffers - The buffers containing the data to store
   * @returns Handle to the created storage buffer resource
   */
  createStorageBuffer(gpuInstanceDataBuffers) {
    const gpuDevice = this.SH.gpuDevice;
    const storageBuffer = gpuDevice.createBuffer({
      size: gpuInstanceDataBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0),
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    let offset = 0;
    for (let i = 0; i < gpuInstanceDataBuffers.length; i++) {
      const buffer = gpuInstanceDataBuffers[i];
      const inputArray = new Float32Array(buffer.getArrayBuffer());
      _WebGpuResourceRepository.$H(inputArray);
      const copySize = i === gpuInstanceDataBuffers.length - 1 ? buffer.takenSizeInByte : buffer.byteLength;
      gpuDevice.queue.writeBuffer(storageBuffer, offset, inputArray, 0, copySize / 4);
      offset += copySize;
    }
    this.aI = storageBuffer;
    const storageBufferHandle = this.DD(storageBuffer);
    return storageBufferHandle;
  }
  /**
   * Updates an existing storage buffer with new data.
   * Only updates the specified number of components to optimize data transfer.
   *
   * @param storageBufferHandle - Handle to the storage buffer to update
   * @param gpuInstanceDataBuffers - New data to write to the buffer
   */
  updateStorageBuffer(storageBufferHandle, gpuInstanceDataBuffers, excludedByteRanges = []) {
    const gpuDevice = this.SH.gpuDevice;
    const storageBuffer = this.TH.get(storageBufferHandle);
    let offset = 0;
    for (let i = 0; i < gpuInstanceDataBuffers.length; i++) {
      const buffer = gpuInstanceDataBuffers[i];
      const inputArray = new Float32Array(buffer.getArrayBuffer());
      _WebGpuResourceRepository.$H(inputArray);
      const copySize = i === gpuInstanceDataBuffers.length - 1 ? buffer.takenSizeInByte : buffer.byteLength;
      for (const [start, end] of subtractByteRanges(offset, offset + copySize, excludedByteRanges)) {
        gpuDevice.queue.writeBuffer(storageBuffer, start, inputArray, (start - offset) / 4, (end - start) / 4);
      }
      offset += buffer.byteLength;
    }
  }
  /**
   * Writes byte ranges of the GPU instance data to the storage buffer.
   *
   * @param storageBufferHandle - Handle to the storage buffer
   * @param gpuInstanceDataBuffers - The GPU instance data buffers (layers)
   * @param byteRanges - The ranges `[start, end)` in the concatenated layers. A range must not span layers.
   */
  updateStorageBufferRanges(storageBufferHandle, gpuInstanceDataBuffers, byteRanges) {
    const gpuDevice = this.SH.gpuDevice;
    const storageBuffer = this.TH.get(storageBufferHandle);
    for (const [start, end] of byteRanges) {
      let layerStart = 0;
      for (const buffer of gpuInstanceDataBuffers) {
        const layerEnd = layerStart + buffer.byteLength;
        if (start >= layerStart && end <= layerEnd) {
          const inputArray = new Float32Array(buffer.getArrayBuffer());
          gpuDevice.queue.writeBuffer(storageBuffer, start, inputArray, (start - layerStart) / 4, (end - start) / 4);
          break;
        }
        layerStart = layerEnd;
      }
    }
  }
  /**
   * The storage buffer of the GPU instance data (bound at group 0, binding 0 of the render pipelines).
   *
   * @internal
   */
  _getStorageBuffer() {
    return this.aI;
  }
  destroyStorageBuffer(storageBufferHandle) {
    const storageBuffer = this.TH.get(storageBufferHandle);
    if (storageBuffer == null) {
      return;
    }
    storageBuffer.destroy();
    this.TH.delete(storageBufferHandle);
  }
  /**
   * Updates a portion of a storage buffer with new data at a specific offset.
   * This allows for efficient partial updates of large storage buffers.
   *
   * @param storageBufferHandle - Handle to the storage buffer to update
   * @param inputArray - New data to write to the buffer
   * @param offsetOfStorageBufferInByte - Byte offset in the storage buffer where to start writing
   * @param offsetOfInputArrayInElement - Element offset in the input array where to start reading
   * @param updateComponentSize - Number of components to update
   */
  updateStorageBufferPartially(storageBufferHandle, inputArray, offsetOfStorageBufferInByte, offsetOfInputArrayInElement, updateComponentSize) {
    const gpuDevice = this.SH.gpuDevice;
    const storageBuffer = this.TH.get(storageBufferHandle);
    _WebGpuResourceRepository.$H(inputArray);
    gpuDevice.queue.writeBuffer(
      storageBuffer,
      offsetOfStorageBufferInByte,
      inputArray,
      offsetOfInputArrayInElement,
      updateComponentSize
    );
  }
  createStorageBlendShapeBuffer(inputArray) {
    const gpuDevice = this.SH.gpuDevice;
    const storageBuffer = gpuDevice.createBuffer({
      size: inputArray.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
    });
    _WebGpuResourceRepository.$H(inputArray);
    gpuDevice.queue.writeBuffer(storageBuffer, 0, inputArray);
    this.gI = storageBuffer;
    const storageBufferHandle = this.DD(storageBuffer);
    return storageBufferHandle;
  }
  deleteStorageBlendShapeBuffer(storageBufferHandle) {
    const storageBuffer = this.TH.get(storageBufferHandle);
    if (storageBuffer == null) {
      return;
    }
    storageBuffer.destroy();
    this.TH.delete(storageBufferHandle);
  }
  updateStorageBlendShapeBuffer(storageBufferHandle, inputArray, updateComponentSize) {
    const gpuDevice = this.SH.gpuDevice;
    const storageBuffer = this.TH.get(storageBufferHandle);
    _WebGpuResourceRepository.$H(inputArray);
    gpuDevice.queue.writeBuffer(storageBuffer, 0, inputArray, 0, updateComponentSize);
  }
  createBindGroupLayoutForDrawParameters() {
    const gpuDevice = this.SH.gpuDevice;
    {
      const bindGroupLayoutDesc = {
        entries: [
          {
            binding: 0,
            buffer: {
              type: "uniform"
            },
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT
          }
        ]
      };
      const bindGroupLayout = gpuDevice.createBindGroupLayout(bindGroupLayoutDesc);
      this.LI = bindGroupLayout;
    }
  }
  /**
   * Selects the draw parameters (group 3) for the next draw().
   *
   * The parameters are stored in an immutable uniform buffer shared by every draw with the same values,
   * so consecutive draws of the same material and camera keep the same bind group.
   *
   * @param materialSid - The material SID
   * @param cameraSID - The camera component SID
   * @param currentPrimitiveIdx - The index of the primitive among the primitives with morph targets
   * @param morphTargetNumber - The number of morph targets of the primitive
   * @param deformedVertexOffset - The offset of the primitive in the deformed vertices of its mesh instance (see
   *   processGeometry), for a draw of the vertices deformed by the GPU culling's compute shader
   */
  setDrawParameters(materialSid, cameraSID, currentPrimitiveIdx, morphTargetNumber, deformedVertexOffset = 0) {
    const lastDrawParameters = this.jJ;
    lastDrawParameters[0] = materialSid;
    lastDrawParameters[1] = cameraSID;
    lastDrawParameters[2] = currentPrimitiveIdx;
    lastDrawParameters[3] = morphTargetNumber;
    const key = `${materialSid},${cameraSID},${currentPrimitiveIdx},${morphTargetNumber},${deformedVertexOffset}`;
    let bindGroup = this.iJ.get(key);
    if (bindGroup == null) {
      const gpuDevice = this.SH.gpuDevice;
      const entriesPerBuffer = _WebGpuResourceRepository.MJ;
      const stride = Math.max(
        gpuDevice.limits.minUniformBufferOffsetAlignment,
        _WebGpuResourceRepository.KI
      );
      let uniformBuffer = this.II[this.II.length - 1];
      if (uniformBuffer == null || this.JI >= entriesPerBuffer) {
        uniformBuffer = gpuDevice.createBuffer({
          size: stride * entriesPerBuffer,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
        });
        this.II.push(uniformBuffer);
        this.JI = 0;
      }
      const offset = stride * this.JI++;
      const values = _WebGpuResourceRepository.NJ;
      values[0] = materialSid;
      values[1] = cameraSID;
      values[2] = currentPrimitiveIdx;
      values[3] = morphTargetNumber;
      values[4] = deformedVertexOffset;
      gpuDevice.queue.writeBuffer(uniformBuffer, offset, values);
      bindGroup = gpuDevice.createBindGroup({
        layout: this.LI,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: uniformBuffer,
              offset,
              size: _WebGpuResourceRepository.KI
            }
          }
        ]
      });
      this.iJ.set(key, bindGroup);
    }
    this.kJ = bindGroup;
  }
  /**
   * Selects the draw parameters of the last setDrawParameters() call with another deformed vertex offset.
   */
  TJ(deformedVertexOffset) {
    const p = this.jJ;
    this.setDrawParameters(p[0], p[1], p[2], p[3], deformedVertexOffset);
  }
  createUniformMorphOffsetsBuffer(sizeInByte) {
    const gpuDevice = this.SH.gpuDevice;
    const uniformBuffer = gpuDevice.createBuffer({
      size: sizeInByte,
      // STORAGE: also read by the vertex deformation compute shader (WebGpuVertexDeformer).
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM | GPUBufferUsage.STORAGE
    });
    this.ZH = uniformBuffer;
    const uniformBufferHandle = this.DD(uniformBuffer);
    return uniformBufferHandle;
  }
  updateUniformMorphOffsetsBuffer(inputArray, elementNum) {
    const gpuDevice = this.SH.gpuDevice;
    if (this.ZH == null) {
      throw new Error("Not found uniform morph buffer.");
    }
    _WebGpuResourceRepository.$H(inputArray);
    gpuDevice.queue.writeBuffer(this.ZH, 0, inputArray, 0, elementNum);
  }
  createUniformMorphWeightsBuffer(sizeInByte) {
    const gpuDevice = this.SH.gpuDevice;
    const uniformBuffer = gpuDevice.createBuffer({
      size: sizeInByte,
      // STORAGE: also read by the vertex deformation compute shader (WebGpuVertexDeformer).
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM | GPUBufferUsage.STORAGE
    });
    this._H = uniformBuffer;
    const uniformBufferHandle = this.DD(uniformBuffer);
    return uniformBufferHandle;
  }
  updateUniformMorphWeightsBuffer(inputArray, elementNum) {
    const gpuDevice = this.SH.gpuDevice;
    if (this._H == null) {
      throw new Error("Not found uniform morph buffer.");
    }
    _WebGpuResourceRepository.$H(inputArray);
    gpuDevice.queue.writeBuffer(this._H, 0, inputArray, 0, elementNum);
  }
  deleteUniformBuffer(uniformBufferHandle) {
    const uniformBuffer = this.TH.get(uniformBufferHandle);
    if (uniformBuffer == null) {
      return;
    }
    uniformBuffer.destroy();
    this.TH.delete(uniformBufferHandle);
  }
  /**
   * Returns a stable identifier of a GPU object for cache keys.
   */
  LJ(obj) {
    let id = this.mJ.get(obj);
    if (id === void 0) {
      id = ++this.OJ;
      this.mJ.set(obj, id);
    }
    return id;
  }
  /**
   * Returns the bind group layout for the given descriptor, shared by every bind group and pipeline
   * layout with the same descriptor.
   */
  cJ(key, entries) {
    let layout = this.tI.get(key);
    if (layout == null) {
      layout = this.SH.gpuDevice.createBindGroupLayout({ entries });
      this.tI.set(key, layout);
    }
    return layout;
  }
  /**
   * Returns the view of a dummy texture with the given dimension. The view is created once per texture.
   */
  XJ(gpuTexture, dimension) {
    let views = this.lJ.get(gpuTexture);
    if (views == null) {
      views = /* @__PURE__ */ new Map();
      this.lJ.set(gpuTexture, views);
    }
    let view = views.get(dimension);
    if (view == null) {
      view = dimension === "2d" ? gpuTexture.createView() : gpuTexture.createView({ dimension });
      views.set(dimension, view);
    }
    return view;
  }
  /**
   * The buffer bound at group 0, binding 4: the vertices deformed by the GPU culling, or a dummy buffer without it.
   */
  bJ() {
    var _a, _b, _c;
    const deformedVerticesBuffer = (_a = this.VH) == null ? void 0 : _a.deformedVerticesBuffer;
    if (deformedVerticesBuffer != null) {
      return deformedVerticesBuffer;
    }
    (_c = this[_b = "gJ"]) != null ? _c : this[_b] = this.SH.gpuDevice.createBuffer({
      size: 32,
      usage: GPUBufferUsage.STORAGE
    });
    return this.gJ;
  }
  /**
   * Returns the group 0 bind group (storage buffer, blend shape buffer, morph uniform buffers, deformed vertices).
   * It is recreated only when one of those buffers is replaced.
   */
  YJ() {
    var _a, _b;
    const buffers = this.DI;
    if (this.PH != null && buffers[0] === this.aI && buffers[1] === this.gI && buffers[2] === this.ZH && buffers[3] === this._H && buffers[4] === this.bJ()) {
      return this.PH;
    }
    buffers[0] = this.aI;
    buffers[1] = this.gI;
    buffers[2] = this.ZH;
    buffers[3] = this._H;
    buffers[4] = this.bJ();
    const gpuDevice = this.SH.gpuDevice;
    const visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    const entries = [];
    const layoutEntries = [];
    let layoutKey = "";
    if (this.aI != null) {
      entries.push({ binding: 0, resource: { buffer: this.aI } });
      layoutEntries.push({ binding: 0, buffer: { type: "read-only-storage" }, visibility });
      layoutKey += "s";
    }
    let blendShapeBuffer = this.gI;
    if (blendShapeBuffer == null) {
      (_b = this[_a = "fJ"]) != null ? _b : this[_a] = gpuDevice.createBuffer({
        size: 16,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
      });
      blendShapeBuffer = this.fJ;
    }
    entries.push({ binding: 1, resource: { buffer: blendShapeBuffer } });
    layoutEntries.push({ binding: 1, buffer: { type: "read-only-storage" }, visibility });
    layoutKey += "b";
    if (this.ZH != null) {
      entries.push({ binding: 2, resource: { buffer: this.ZH } });
      layoutEntries.push({ binding: 2, buffer: { type: "uniform" }, visibility });
      layoutKey += "o";
    }
    if (this._H != null) {
      entries.push({ binding: 3, resource: { buffer: this._H } });
      layoutEntries.push({ binding: 3, buffer: { type: "uniform" }, visibility });
      layoutKey += "w";
    }
    entries.push({ binding: 4, resource: { buffer: buffers[4] } });
    layoutEntries.push({ binding: 4, buffer: { type: "read-only-storage" }, visibility: GPUShaderStage.VERTEX });
    layoutKey += "d";
    layoutKey = `storage:${layoutKey}`;
    const layout = this.cJ(layoutKey, layoutEntries);
    this.PH = gpuDevice.createBindGroup({ layout, entries });
    this.dJ = layout;
    this.eJ = layoutKey;
    this.XH();
    return this.PH;
  }
  /**
   * Appends a texture binding and its sampler to `__textureSamplerBindings`.
   */
  CI(slot, dimension, visibility, view, sampler) {
    const bindings = this.lI;
    const i = bindings.count++;
    bindings.slots[i] = slot;
    bindings.dimensions[i] = dimension;
    bindings.visibilities[i] = visibility;
    bindings.views[i] = view;
    bindings.samplers[i] = sampler;
  }
  /**
   * Collects the textures and samplers bound by a material into `__textureSamplerBindings`.
   * The IBL cube maps come from the mesh renderer component, not from the material.
   */
  ZJ(engine, material, diffuseCubeMap, specularCubeMap, sheenCubeMap) {
    this.lI.count = 0;
    const resources = this.TH;
    const visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    const dummyTextures = engine.dummyTextures;
    for (const value of material._autoTextureFieldVariablesOnly.values()) {
      const info = value.info;
      if (info.semantic === "diffuseEnvTexture" || info.semantic === "specularEnvTexture" || info.semantic === "sheenEnvTexture") {
        continue;
      }
      if (!CompositionType.isTexture(info.compositionType)) {
        continue;
      }
      const slot = value.value[0];
      const texture = value.value[1];
      const sampler = value.value[2];
      let dimension = "2d";
      if (texture instanceof CubeTexture || texture instanceof RenderTargetTextureCube) {
        dimension = "cube";
      } else if (texture instanceof TextureArray || texture instanceof RenderTargetTexture2DArray) {
        dimension = "2d-array";
      }
      let gpuTextureView = resources.get(texture._textureViewResourceUid);
      if (gpuTextureView == null) {
        const dummyTexture = dimension === "cube" ? dummyTextures.dummyBlackCubeTexture : dummyTextures.dummyWhiteTexture;
        const gpuTexture = resources.get(dummyTexture._textureResourceUid);
        gpuTextureView = this.XJ(gpuTexture, dimension);
      }
      if (!sampler.created) {
        sampler.create();
      }
      const gpuSampler = resources.get(sampler._samplerResourceUid);
      this.CI(slot, dimension, visibility, gpuTextureView, gpuSampler);
    }
    const dummyCubeTexture = dummyTextures.dummyBlackCubeTexture;
    const dummyCubeTextureView = () => resources.get(dummyCubeTexture._textureViewResourceUid);
    const dummyCubeSampler = () => resources.get(dummyCubeTexture._samplerResourceUid);
    const diffuseEnvValue = material.getTextureParameter(ShaderSemantics.DiffuseEnvTexture.str);
    if (Is.exist(diffuseEnvValue)) {
      const view = resources.get(Is.exist(diffuseCubeMap) ? diffuseCubeMap._textureViewResourceUid : -1);
      const sampler = resources.get(Is.exist(diffuseCubeMap) ? diffuseCubeMap._samplerResourceUid : -1);
      this.CI(
        diffuseEnvValue[0],
        "cube",
        visibility,
        view != null ? view : dummyCubeTextureView(),
        sampler != null ? sampler : dummyCubeSampler()
      );
    }
    const specularEnvValue = material.getTextureParameter(ShaderSemantics.SpecularEnvTexture.str);
    if (Is.exist(specularEnvValue)) {
      const view = resources.get(Is.exist(specularCubeMap) ? specularCubeMap._textureViewResourceUid : -1);
      const sampler = resources.get(Is.exist(specularCubeMap) ? specularCubeMap._samplerResourceUid : -1);
      this.CI(
        specularEnvValue[0],
        "cube",
        visibility,
        view != null ? view : dummyCubeTextureView(),
        sampler != null ? sampler : dummyCubeSampler()
      );
    }
    const sheenEnvValue = material.getTextureParameter(ShaderSemantics.SheenEnvTexture.str);
    if (Is.exist(sheenEnvValue)) {
      const sheenSource = Is.exist(sheenCubeMap) ? sheenCubeMap : specularCubeMap;
      const view = Is.exist(sheenSource) ? resources.get(sheenSource._textureViewResourceUid) : void 0;
      const sampler = Is.exist(sheenSource) ? resources.get(sheenSource._samplerResourceUid) : void 0;
      this.CI(
        sheenEnvValue[0],
        "cube",
        GPUShaderStage.FRAGMENT,
        view != null ? view : dummyCubeTextureView(),
        sampler != null ? sampler : dummyCubeSampler()
      );
    }
  }
  /**
   * Returns the bind groups and the pipeline layout for drawing with a material.
   *
   * The texture (group 1) and sampler (group 2) bind groups are looked up by the resources they bind,
   * so materials binding the same textures and samplers share them. They do not depend on the render
   * pipeline, so a pipeline can be recreated without recreating bind groups and vice versa.
   */
  RJ(engine, material, diffuseCubeMap, specularCubeMap, sheenCubeMap) {
    const storage = this.YJ();
    this.ZJ(engine, material, diffuseCubeMap, specularCubeMap, sheenCubeMap);
    const bindings = this.lI;
    let textureLayoutKey = "texture:";
    let samplerLayoutKey = "sampler:";
    let textureResourceKey = "";
    let samplerResourceKey = "";
    for (let i = 0; i < bindings.count; i++) {
      textureLayoutKey += `${bindings.slots[i]}/${bindings.dimensions[i]}/${bindings.visibilities[i]},`;
      samplerLayoutKey += `${bindings.slots[i]}/${bindings.visibilities[i]},`;
      textureResourceKey += `${this.LJ(bindings.views[i])},`;
      samplerResourceKey += `${this.LJ(bindings.samplers[i])},`;
    }
    const textureBindGroupKey = `${textureLayoutKey}|${textureResourceKey}`;
    let texture = this.GI.get(textureBindGroupKey);
    const textureLayout = this._J(textureLayoutKey);
    if (texture == null) {
      const entries = [];
      for (let i = 0; i < bindings.count; i++) {
        entries.push({ binding: bindings.slots[i], resource: bindings.views[i] });
      }
      texture = this.SH.gpuDevice.createBindGroup({ layout: textureLayout, entries });
      this.GI.set(textureBindGroupKey, texture);
    }
    const samplerBindGroupKey = `${samplerLayoutKey}|${samplerResourceKey}`;
    let sampler = this.HI.get(samplerBindGroupKey);
    const samplerLayout = this.$J(samplerLayoutKey);
    if (sampler == null) {
      const entries = [];
      for (let i = 0; i < bindings.count; i++) {
        entries.push({ binding: bindings.slots[i], resource: bindings.samplers[i] });
      }
      sampler = this.SH.gpuDevice.createBindGroup({ layout: samplerLayout, entries });
      this.HI.set(samplerBindGroupKey, sampler);
    }
    const pipelineLayoutKey = `${this.eJ}#${textureLayoutKey}#${samplerLayoutKey}`;
    let pipelineLayout = this.hJ.get(pipelineLayoutKey);
    if (pipelineLayout == null) {
      pipelineLayout = this.SH.gpuDevice.createPipelineLayout({
        bindGroupLayouts: [
          this.dJ,
          textureLayout,
          samplerLayout,
          this.LI
        ]
      });
      this.hJ.set(pipelineLayoutKey, pipelineLayout);
    }
    let result = this.nJ;
    if (result == null) {
      result = { storage, texture, sampler, pipelineLayout, pipelineLayoutKey };
      this.nJ = result;
    } else {
      result.storage = storage;
      result.texture = texture;
      result.sampler = sampler;
      result.pipelineLayout = pipelineLayout;
      result.pipelineLayoutKey = pipelineLayoutKey;
    }
    return result;
  }
  _J(layoutKey) {
    const cached = this.tI.get(layoutKey);
    if (cached != null) {
      return cached;
    }
    const bindings = this.lI;
    const entries = [];
    for (let i = 0; i < bindings.count; i++) {
      entries.push({
        binding: bindings.slots[i],
        texture: { viewDimension: bindings.dimensions[i] },
        visibility: bindings.visibilities[i]
      });
    }
    return this.cJ(layoutKey, entries);
  }
  $J(layoutKey) {
    const cached = this.tI.get(layoutKey);
    if (cached != null) {
      return cached;
    }
    const bindings = this.lI;
    const entries = [];
    for (let i = 0; i < bindings.count; i++) {
      entries.push({
        binding: bindings.slots[i],
        sampler: { type: "filtering" },
        visibility: bindings.visibilities[i]
      });
    }
    return this.cJ(layoutKey, entries);
  }
  /**
   * create a Texture
   * @param imageData
   * @param param1
   * @returns
   */
  async createTextureFromHTMLImageElement(imageData, {
    internalFormat,
    width,
    height,
    generateMipmap
  }) {
    imageData.crossOrigin = "Anonymous";
    if (!imageData.complete || imageData.naturalWidth === 0) {
      await new Promise((resolve, reject) => {
        imageData.onload = () => resolve();
        imageData.onerror = () => reject(new Error("Failed to load image"));
      });
    }
    await imageData.decode();
    const imageBitmap = await createImageBitmap(imageData);
    const textureHandle = await this.BJ(width, height, internalFormat, generateMipmap, imageBitmap);
    return textureHandle;
  }
  /**
   * create CompressedTextureFromBasis
   * @param basisFile
   * @returns
   */
  createCompressedTextureFromBasis(basisFile) {
    let basisCompressionType;
    let compressionType;
    const mipmapDepth = basisFile.getNumLevels(0);
    const width = basisFile.getImageWidth(0, 0);
    const height = basisFile.getImageHeight(0, 0);
    const gpuDevice = this.SH.gpuDevice;
    const gpuAdapter = this.SH.gpuAdapter;
    const s3tc = gpuAdapter.features.has("texture-compression-bc");
    const etc2 = gpuAdapter.features.has("texture-compression-etc2");
    const astc = gpuAdapter.features.has("texture-compression-astc");
    if (s3tc) {
      basisCompressionType = BasisCompressionType.BC3;
      compressionType = "bc3-rgba-unorm";
    } else if (etc2) {
      basisCompressionType = BasisCompressionType.ETC2;
      compressionType = "etc2-rgba8unorm";
    } else if (astc) {
      basisCompressionType = BasisCompressionType.ASTC;
      compressionType = "astc-4x4-unorm";
    }
    if (!compressionType) {
      console.warn("No supported compression format found, falling back to uncompressed");
      throw new Error("No supported compression format found");
    }
    const textureDescriptor = {
      size: [width, height, 1],
      format: compressionType,
      mipLevelCount: mipmapDepth,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    };
    const gpuTexture = gpuDevice.createTexture(textureDescriptor);
    let blockInfo = { byteSize: 16, width: 4, height: 4 };
    if (compressionType === "bc1-rgba-unorm") {
      blockInfo = { byteSize: 8, width: 4, height: 4 };
    } else if (compressionType === "bc3-rgba-unorm" || compressionType === "astc-4x4-unorm") {
      blockInfo = { byteSize: 16, width: 4, height: 4 };
    } else if (compressionType === "etc2-rgba8unorm") {
      blockInfo = { byteSize: 16, width: 4, height: 4 };
    } else if (compressionType === "etc2-rgb8unorm") {
      blockInfo = { byteSize: 8, width: 4, height: 4 };
    }
    for (let i = 0; i < mipmapDepth; i++) {
      const mipWidth = basisFile.getImageWidth(0, i);
      const mipHeight = basisFile.getImageHeight(0, i);
      const textureSource = this.decodeBasisImage(basisFile, basisCompressionType, 0, i);
      const blocksWide = Math.max(1, Math.ceil(mipWidth / blockInfo.width));
      const blocksHigh = Math.max(1, Math.ceil(mipHeight / blockInfo.height));
      const unalignedBytesPerRow = blocksWide * blockInfo.byteSize;
      const bytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256;
      let compressedTextureData;
      const expectedDataSize = bytesPerRow * blocksHigh;
      if (bytesPerRow !== unalignedBytesPerRow || textureSource.length < expectedDataSize) {
        const paddedData = new Uint8Array(expectedDataSize);
        if (textureSource.length > 0) {
          const actualRowsAvailable = Math.floor(textureSource.length / unalignedBytesPerRow);
          for (let row = 0; row < Math.min(blocksHigh, actualRowsAvailable); row++) {
            const srcOffset = row * unalignedBytesPerRow;
            const dstOffset = row * bytesPerRow;
            const copyLength = Math.min(unalignedBytesPerRow, textureSource.length - srcOffset);
            if (copyLength > 0) {
              paddedData.set(textureSource.subarray(srcOffset, srcOffset + copyLength), dstOffset);
            }
          }
        }
        compressedTextureData = paddedData;
      } else {
        compressedTextureData = textureSource;
      }
      _WebGpuResourceRepository.$H(compressedTextureData);
      gpuDevice.queue.writeTexture(
        {
          texture: gpuTexture,
          mipLevel: i
        },
        compressedTextureData,
        {
          offset: 0,
          bytesPerRow,
          rowsPerImage: blocksHigh
        },
        {
          width: Math.ceil(mipWidth / blockInfo.width) * blockInfo.width,
          height: Math.ceil(mipHeight / blockInfo.height) * blockInfo.height
        }
      );
    }
    const textureHandle = this.DD(gpuTexture);
    return textureHandle;
  }
  /**
   * decode the BasisImage
   * @param basisFile
   * @param basisCompressionType
   * @param imageIndex
   * @param levelIndex
   * @returns
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
   * Create and bind compressed texture object
   * @param textureDataArray transcoded texture data for each mipmaps(levels)
   * @param compressionTextureType
   */
  async createCompressedTexture(textureDataArray, compressionTextureType) {
    const gpuDevice = this.SH.gpuDevice;
    const blockInfo = compressionTextureType.blockInfo || { byteSize: 4, width: 1, height: 1 };
    const textureDataLevel0 = textureDataArray[0];
    const textureDescriptor = {
      size: [
        Math.ceil(textureDataLevel0.width / blockInfo.width) * blockInfo.width,
        Math.ceil(textureDataLevel0.height / blockInfo.height) * blockInfo.height,
        1
      ],
      format: compressionTextureType.webgpu,
      mipLevelCount: textureDataArray.length,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    };
    const texture = gpuDevice.createTexture(textureDescriptor);
    for (let level = 0; level < textureDataArray.length; level++) {
      const textureData = textureDataArray[level];
      const mipWidth = textureData.width;
      const mipHeight = textureData.height;
      const blocksWide = Math.max(1, Math.ceil(mipWidth / blockInfo.width));
      const blocksHigh = Math.max(1, Math.ceil(mipHeight / blockInfo.height));
      const unalignedBytesPerRow = blocksWide * blockInfo.byteSize;
      const bytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256;
      const originalData = textureData.buffer instanceof Uint8Array ? textureData.buffer : new Uint8Array(textureData.buffer.buffer, textureData.buffer.byteOffset, textureData.buffer.byteLength);
      let compressedTextureData;
      const expectedDataSize = bytesPerRow * blocksHigh;
      if (bytesPerRow !== unalignedBytesPerRow || originalData.length < expectedDataSize) {
        const paddedData = new Uint8Array(expectedDataSize);
        if (originalData.length > 0) {
          const actualRowsAvailable = Math.floor(originalData.length / unalignedBytesPerRow);
          for (let row = 0; row < Math.min(blocksHigh, actualRowsAvailable); row++) {
            const srcOffset = row * unalignedBytesPerRow;
            const dstOffset = row * bytesPerRow;
            const copyLength = Math.min(unalignedBytesPerRow, originalData.length - srcOffset);
            if (copyLength > 0) {
              paddedData.set(originalData.subarray(srcOffset, srcOffset + copyLength), dstOffset);
            }
          }
        }
        compressedTextureData = paddedData;
      } else {
        compressedTextureData = originalData;
      }
      _WebGpuResourceRepository.$H(compressedTextureData);
      gpuDevice.queue.writeTexture(
        {
          texture,
          mipLevel: level
        },
        compressedTextureData,
        {
          offset: 0,
          bytesPerRow,
          rowsPerImage: blocksHigh
        },
        {
          width: Math.ceil(mipWidth / blockInfo.width) * blockInfo.width,
          height: Math.ceil(mipHeight / blockInfo.height) * blockInfo.height
        }
      );
    }
    await gpuDevice.queue.onSubmittedWorkDone();
    const textureHandle = this.DD(texture);
    return textureHandle;
  }
  /**
   * allocate a Texture
   * @param format - the format of the texture
   * @param width - the width of the texture
   * @param height - the height of the texture
   * @param mipmapCount - the number of mipmap levels
   * @returns the handle of the texture
   */
  allocateTexture({
    format,
    width,
    height,
    mipLevelCount
  }) {
    const gpuDevice = this.SH.gpuDevice;
    const textureDescriptor = {
      size: [width, height, 1],
      mipLevelCount,
      format: format.webgpu,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    };
    const gpuTexture = gpuDevice.createTexture(textureDescriptor);
    const textureHandle = this.DD(gpuTexture);
    return textureHandle;
  }
  /**
   * Load an image to a specific mip level of a texture
   * @param mipLevel - the mip level to load the image to
   * @param textureUid - the handle of the texture
   * @param format - the format of the image
   * @param type - the type of the data
   * @param xOffset - the x offset of copy region
   * @param yOffset - the y offset of copy region
   * @param width - the width of the image
   * @param height - the height of the image
   * @param data - the typedarray data of the image
   */
  async loadImageToMipLevelOfTexture2D({
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
    const gpuDevice = this.SH.gpuDevice;
    const texture = this.TH.get(textureUid);
    const pixelFormat = TextureFormat.getPixelFormatFromTextureFormat(format);
    const compositionNum = PixelFormat.getCompositionNumFromPixelFormat(pixelFormat);
    const bytesPerRow = rowSizeByPixel * compositionNum * type.getSizeInBytes();
    const paddedBytesPerRow = Math.ceil(bytesPerRow / 256) * 256;
    const paddedData = new Uint8Array(paddedBytesPerRow * height);
    for (let row = 0; row < height; row++) {
      const srcOffset = row * bytesPerRow;
      const dstOffset = row * paddedBytesPerRow;
      paddedData.set(new Uint8Array(data.buffer, srcOffset, bytesPerRow), dstOffset);
    }
    const buffer = gpuDevice.createBuffer({
      size: paddedData.byteLength,
      usage: GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true
    });
    new Uint8Array(buffer.getMappedRange()).set(paddedData);
    buffer.unmap();
    const commandEncoder = gpuDevice.createCommandEncoder();
    commandEncoder.copyBufferToTexture(
      {
        buffer,
        offset: 0,
        bytesPerRow: paddedBytesPerRow,
        rowsPerImage: height
      },
      {
        texture,
        mipLevel,
        origin: { x: xOffset, y: yOffset, z: 0 }
      },
      {
        width,
        height,
        depthOrArrayLayers: 1
      }
    );
    const commandBuffer = commandEncoder.finish();
    gpuDevice.queue.submit([commandBuffer]);
    try {
      await gpuDevice.queue.onSubmittedWorkDone();
    } catch (e) {
      Logger.default.error(e);
    }
  }
  async BJ(width, height, internalFormat, generateMipmap, imageData) {
    const gpuDevice = this.SH.gpuDevice;
    const textureDescriptor = {
      size: [width, height, 1],
      format: internalFormat.webgpu,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    };
    if (generateMipmap) {
      textureDescriptor.mipLevelCount = Math.floor(Math.log2(Math.max(width, height))) + 1;
    }
    const gpuTexture = gpuDevice.createTexture(textureDescriptor);
    gpuDevice.queue.copyExternalImageToTexture({ source: imageData }, { texture: gpuTexture }, [width, height]);
    if (generateMipmap) {
      this.generateMipmaps(gpuTexture, textureDescriptor);
    }
    await gpuDevice.queue.onSubmittedWorkDone();
    const textureHandle = this.DD(gpuTexture);
    return textureHandle;
  }
  /**
   * Creates a render target texture that can be used as a color attachment in framebuffers.
   * This texture can be rendered to and also used as a texture input in shaders.
   *
   * @param params - Configuration for the render target texture
   * @param params.width - Width of the texture in pixels
   * @param params.height - Height of the texture in pixels
   * @param params.mipLevelCount - Number of mipmap levels to create
   * @param params.format - Texture format for the render target
   * @returns Handle to the created render target texture resource
   */
  createRenderTargetTexture({
    width,
    height,
    mipLevelCount,
    format
  }) {
    const gpuDevice = this.SH.gpuDevice;
    const textureDescriptor = {
      size: [width, height, 1],
      format: format.webgpu,
      mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    };
    const gpuTexture = gpuDevice.createTexture(textureDescriptor);
    const textureHandle = this.DD(gpuTexture);
    return textureHandle;
  }
  /**
   * Creates a render target texture array that can hold multiple 2D textures.
   * Useful for techniques like shadow mapping with multiple lights or layered rendering.
   *
   * @param params - Configuration for the render target texture array
   * @param params.width - Width of each texture layer in pixels
   * @param params.height - Height of each texture layer in pixels
   * @param params.internalFormat - Internal format of the texture
   * @param params.arrayLength - Number of texture layers in the array
   * @returns Handle to the created render target texture array resource
   */
  createRenderTargetTextureArray({
    width,
    height,
    internalFormat,
    arrayLength
  }) {
    const gpuDevice = this.SH.gpuDevice;
    const textureDescriptor = {
      dimension: "2d",
      size: [width, height, arrayLength],
      format: internalFormat.webgpu,
      mipLevelCount: 1,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    };
    const gpuTexture = gpuDevice.createTexture(textureDescriptor);
    const textureHandle = this.DD(gpuTexture);
    return textureHandle;
  }
  /**
   * Creates a render target cube texture for environment mapping or omnidirectional shadow mapping.
   * This creates a cube texture with 6 faces that can be rendered to.
   *
   * @param params - Configuration for the render target cube texture
   * @param params.width - Width of each cube face in pixels
   * @param params.height - Height of each cube face in pixels
   * @param params.mipLevelCount - Number of mipmap levels to create
   * @param params.format - Texture format for the render target
   * @returns Handle to the created render target cube texture resource
   */
  createRenderTargetTextureCube({
    width,
    height,
    mipLevelCount,
    format
  }) {
    const gpuDevice = this.SH.gpuDevice;
    const textureDescriptor = {
      dimension: "2d",
      size: [width, height, 6],
      format: format.webgpu,
      mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    };
    const gpuTexture = gpuDevice.createTexture(textureDescriptor);
    const textureHandle = this.DD(gpuTexture);
    return textureHandle;
  }
  /**
   * Creates a render buffer for multisampling (MSAA) or as a render attachment.
   * Render buffers are textures that are only used for rendering and cannot be sampled in shaders.
   *
   * @param width - Width of the render buffer in pixels
   * @param height - Height of the render buffer in pixels
   * @param internalFormat - Internal format of the render buffer
   * @param isMSAA - Whether to enable multisampling
   * @param sampleCountMSAA - Number of samples for MSAA (ignored if isMSAA is false)
   * @returns Handle to the created render buffer resource
   */
  createRenderBuffer(width, height, internalFormat, isMSAA, sampleCountMSAA) {
    const gpuDevice = this.SH.gpuDevice;
    const textureDescriptor = {
      size: [width, height, 1],
      format: internalFormat.webgpu,
      sampleCount: isMSAA ? sampleCountMSAA : 1,
      usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT
    };
    const gpuTexture = gpuDevice.createTexture(textureDescriptor);
    const textureHandle = this.DD(gpuTexture);
    return textureHandle;
  }
  /**
   * delete a RenderBuffer
   * @param renderBufferUid
   */
  deleteRenderBuffer(renderBufferUid) {
    this.flush();
    this.clearCache();
    const texture = this.TH.get(renderBufferUid);
    if (texture != null) {
      texture.destroy();
      this.TH.delete(renderBufferUid);
    }
  }
  /**
   * copy Texture Data
   * @param fromTexture
   * @param toTexture
   */
  copyTextureData(fromTexture, toTexture) {
    const from = this.TH.get(fromTexture);
    const to = this.TH.get(toTexture);
    this.jI();
    this.YH.copyTextureToTexture(
      {
        texture: from
      },
      {
        texture: to
      },
      [to.width, to.height, 1]
    );
  }
  isMippmappedTexture(textureHandle) {
    const texture = this.TH.get(textureHandle);
    if (texture.mipLevelCount > 1) {
      return true;
    }
    return false;
  }
  duplicateTextureAsMipmapped(fromTexture) {
    const gpuDevice = this.SH.gpuDevice;
    const texture = this.TH.get(fromTexture);
    const textureDescriptor = {
      size: {
        width: texture.width,
        height: texture.height,
        depthOrArrayLayers: texture.depthOrArrayLayers
      },
      mipLevelCount: Math.floor(Math.log2(Math.max(texture.width, texture.height))) + 1,
      format: texture.format,
      usage: texture.usage
    };
    const newTexture = gpuDevice.createTexture(textureDescriptor);
    this.jI();
    this.YH.copyTextureToTexture(
      { texture },
      { texture: newTexture },
      { width: texture.width, height: texture.height, depthOrArrayLayers: 1 }
    );
    const textureHandle = this.DD(newTexture);
    const textureViewHandle = this.DD(newTexture.createView());
    return [textureHandle, textureViewHandle];
  }
  /**
   * attach the DepthBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a DepthBuffer
   */
  attachDepthBufferToFrameBufferObject(_framebuffer, _renderable) {
  }
  /**
   * attach the StencilBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a StencilBuffer
   */
  attachStencilBufferToFrameBufferObject(_framebuffer, _renderable) {
  }
  /**
   * attach the depthStencilBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a depthStencilBuffer
   */
  attachDepthStencilBufferToFrameBufferObject(_framebuffer, _renderable) {
  }
  /**
   * create a FrameBufferObject
   * @returns
   */
  createFrameBufferObject() {
    return -1;
  }
  /**
   * delete a FrameBufferObject
   * @param frameBufferObjectHandle
   */
  deleteFrameBufferObject(_frameBufferObjectHandle) {
  }
  /**
   * attach the ColorBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param attachmentIndex a attachment index
   * @param renderable a ColorBuffer
   */
  attachColorBufferToFrameBufferObject(_framebuffer, _attachmentIndex, _renderable) {
    return;
  }
  /**
   * attach the ColorBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param attachmentIndex a attachment index
   * @param renderable a ColorBuffer
   * @param layerIndex a layer index
   * @param mipLevel a mip level
   */
  attachColorBufferLayerToFrameBufferObject(_framebuffer, _attachmentIndex, _renderable, _layerIndex, _mipLevel) {
    return;
  }
  /**
   * attach the ColorBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param attachmentIndex a attachment index
   * @param faceIndex a face index
   * @param mipLevel a mip level
   * @param renderable a ColorBuffer
   */
  attachColorBufferCubeToFrameBufferObject(_framebuffer, _attachmentIndex, _faceIndex, _mipLevel, _renderable) {
  }
  /**
   * Creates a 2D texture view from a texture resource.
   * This view can be used for sampling the texture in shaders.
   *
   * @param textureHandle - Handle to the source texture
   * @returns Handle to the created texture view
   */
  createTextureView2d(textureHandle) {
    const texture = this.TH.get(textureHandle);
    const textureView = texture.createView();
    const textureViewHandle = this.DD(textureView);
    return textureViewHandle;
  }
  /**
   * Creates a texture view suitable for use as a render target.
   * This view targets only the base mip level and first array layer.
   *
   * @param textureHandle - Handle to the source texture
   * @returns Handle to the created render target texture view
   */
  createTextureViewAsRenderTarget(textureHandle) {
    const texture = this.TH.get(textureHandle);
    const textureView = texture.createView({
      baseMipLevel: 0,
      mipLevelCount: 1,
      arrayLayerCount: 1
    });
    const textureViewHandle = this.DD(textureView);
    return textureViewHandle;
  }
  /**
   * Creates a cube texture view from a cube texture resource.
   * This view exposes all 6 faces of the cube texture for sampling.
   *
   * @param textureHandle - Handle to the source cube texture
   * @returns Handle to the created cube texture view
   */
  createTextureViewCube(textureHandle) {
    const texture = this.TH.get(textureHandle);
    const textureView = texture.createView({ dimension: "cube" });
    const textureViewHandle = this.DD(textureView);
    return textureViewHandle;
  }
  createTextureView2dArray(textureHandle, arrayLayerCount) {
    const texture = this.TH.get(textureHandle);
    const textureView = texture.createView({
      dimension: "2d-array",
      baseArrayLayer: 0,
      arrayLayerCount
    });
    const textureViewHandle = this.DD(textureView);
    return textureViewHandle;
  }
  createTextureView2dArrayAsRenderTarget(textureHandle, arrayIdx, mipLevel) {
    const texture = this.TH.get(textureHandle);
    const textureView = texture.createView({
      dimension: "2d",
      arrayLayerCount: 1,
      baseArrayLayer: arrayIdx,
      baseMipLevel: mipLevel,
      mipLevelCount: 1,
      aspect: "all"
    });
    const textureViewHandle = this.DD(textureView);
    return textureViewHandle;
  }
  createCubeTextureViewAsRenderTarget(textureHandle, faceIdx, mipLevel) {
    const texture = this.TH.get(textureHandle);
    const textureView = texture.createView({
      dimension: "2d",
      arrayLayerCount: 1,
      baseArrayLayer: faceIdx,
      baseMipLevel: mipLevel,
      mipLevelCount: 1,
      aspect: "all"
    });
    const textureViewHandle = this.DD(textureView);
    return textureViewHandle;
  }
  deleteTexture(textureHandle) {
    this.flush();
    this.clearCache();
    const texture = this.TH.get(textureHandle);
    if (texture == null) {
      return;
    }
    this.qI.delete(texture);
    this.eI.delete(texture);
    this.fI.delete(texture);
    texture.destroy();
    this.TH.delete(textureHandle);
  }
  /**
   * Recreates the system depth texture with the current canvas dimensions.
   * This is called when the canvas is resized or initialized.
   */
  recreateSystemDepthTexture() {
    const gpuDevice = this.SH.gpuDevice;
    const canvas = this.SH.canvas;
    if (this.iI != null) {
      this.iI.destroy();
    }
    this.wI = void 0;
    if (canvas.width <= 0 || canvas.height <= 0) {
      Logger.default.warn("Skip recreating system depth texture because the canvas size is zero.");
      return;
    }
    this.iI = gpuDevice.createTexture({
      size: [canvas.width, canvas.height],
      format: DEFAULT_DEPTH_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.bI = this.iI.createView();
  }
  /**
   * Resizes the canvas and recreates the system depth texture.
   * This method should be called when the window or viewport size changes.
   *
   * @param width - New canvas width in pixels
   * @param height - New canvas height in pixels
   */
  resizeCanvas(width, height) {
    if (width <= 0 || height <= 0) {
      Logger.default.warn("Skip resizing WebGPU canvas because width or height is zero.");
      return;
    }
    const canvas = this.SH.canvas;
    canvas.width = width;
    canvas.height = height;
    this.recreateSystemDepthTexture();
  }
  /**
   * Sets the viewport for rendering (currently not implemented in WebGPU version).
   *
   * @param viewport - Optional viewport rectangle (x, y, width, height)
   */
  setViewport(_engine, _viewport) {
  }
  /**
   * Checks if the implementation supports multi-view VR rendering.
   *
   * @returns Always false for WebGPU implementation (not yet supported)
   */
  isSupportMultiViewVRRendering() {
    return false;
  }
};
_WebGpuResourceRepository.MJ = 1024;
/** The byte size of UniformDrawParameters (prerequisites.wgsl). */
_WebGpuResourceRepository.KI = 32;
_WebGpuResourceRepository.NJ = new Uint32Array(_WebGpuResourceRepository.KI / 4);
/**
 * Vertex formats that normalize integer data to floats inside the GPU.
 * WebGPU only provides these formats for two or four components.
 */
_WebGpuResourceRepository.PJ = /* @__PURE__ */ new Set([
  "unorm8x2",
  "unorm8x4",
  "snorm8x2",
  "snorm8x4",
  "unorm16x2",
  "unorm16x4",
  "snorm16x2",
  "snorm16x4"
]);
var WebGpuResourceRepository = _WebGpuResourceRepository;
export {
  WebGpuResourceRepository
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdwdS9XZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBIRFJJbWFnZSBmcm9tICcuLi8uLi92ZW5kb3IvaGRycG5nLmpzJztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB7IE1lc2hSZW5kZXJlckNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvTWVzaFJlbmRlcmVyQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQ29uZmlnIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb3JlL0NvbmZpZyc7XG5pbXBvcnQgeyBFbnRpdHlSZXBvc2l0b3J5IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb3JlL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQWxwaGFNb2RlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgQmFzaXNDb21wcmVzc2lvblR5cGUsIHR5cGUgQmFzaXNDb21wcmVzc2lvblR5cGVFbnVtIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9CYXNpc0NvbXByZXNzaW9uVHlwZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlLCB0eXBlIENvbXBvbmVudFR5cGVFbnVtIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB0eXBlIHsgQ29tcHJlc3Npb25UZXh0dXJlVHlwZUVudW0gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0NvbXByZXNzaW9uVGV4dHVyZVR5cGUnO1xuaW1wb3J0IHsgSGRyaUZvcm1hdCwgdHlwZSBIZHJpRm9ybWF0RW51bSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvSGRyaUZvcm1hdCc7XG5pbXBvcnQgeyBQaXhlbEZvcm1hdCwgdHlwZSBQaXhlbEZvcm1hdEVudW0gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1BpeGVsRm9ybWF0JztcbmltcG9ydCB7IFNoYWRlclNlbWFudGljcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzJztcbmltcG9ydCB7IFRleHR1cmVGb3JtYXQsIHR5cGUgVGV4dHVyZUZvcm1hdEVudW0gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1RleHR1cmVGb3JtYXQnO1xuaW1wb3J0IHsgVGV4dHVyZVBhcmFtZXRlciwgdHlwZSBUZXh0dXJlUGFyYW1ldGVyRW51bSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvVGV4dHVyZVBhcmFtZXRlcic7XG5pbXBvcnQgeyBWZXJ0ZXhBdHRyaWJ1dGUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgdHlwZSB7IE1lc2ggfSBmcm9tICcuLi9mb3VuZGF0aW9uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBWZWN0b3I0IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL1ZlY3RvcjQnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWVtb3J5L0FjY2Vzc29yJztcbmltcG9ydCB0eXBlIHsgQnVmZmVyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tZW1vcnkvQnVmZmVyJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9taXNjL0lzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgTWlzY1V0aWwgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21pc2MvTWlzY1V0aWwnO1xuaW1wb3J0IHtcbiAgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnksXG4gIHR5cGUgRGlyZWN0VGV4dHVyZURhdGEsXG4gIHR5cGUgSUNHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LFxuICB0eXBlIEltYWdlQml0bWFwRGF0YSxcbn0gZnJvbSAnLi4vZm91bmRhdGlvbi9yZW5kZXJlci9DR0FQSVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IEZyYW1lQnVmZmVyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9yZW5kZXJlci9GcmFtZUJ1ZmZlcic7XG5pbXBvcnQgeyBzdWJ0cmFjdEJ5dGVSYW5nZXMgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3JlbmRlcmVyL2xpZ2h0Q2x1c3Rlci9MaWdodENsdXN0ZXJMYXlvdXQnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJQYXNzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9yZW5kZXJlci9SZW5kZXJQYXNzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgQWJzdHJhY3RUZXh0dXJlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi90ZXh0dXJlcy9BYnN0cmFjdFRleHR1cmUnO1xuaW1wb3J0IHsgQ3ViZVRleHR1cmUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3RleHR1cmVzL0N1YmVUZXh0dXJlJztcbmltcG9ydCB0eXBlIHsgSVJlbmRlcmFibGUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3RleHR1cmVzL0lSZW5kZXJhYmxlJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyQnVmZmVyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi90ZXh0dXJlcy9SZW5kZXJCdWZmZXInO1xuaW1wb3J0IHsgUmVuZGVyVGFyZ2V0VGV4dHVyZTJEQXJyYXkgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3RleHR1cmVzL1JlbmRlclRhcmdldFRleHR1cmUyREFycmF5JztcbmltcG9ydCB7IFJlbmRlclRhcmdldFRleHR1cmVDdWJlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi90ZXh0dXJlcy9SZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSc7XG5pbXBvcnQgeyBTYW1wbGVyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi90ZXh0dXJlcy9TYW1wbGVyJztcbmltcG9ydCB7IFRleHR1cmVBcnJheSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vdGV4dHVyZXMvVGV4dHVyZUFycmF5JztcbmltcG9ydCB0eXBlIHsgQmFzaXNGaWxlIH0gZnJvbSAnLi4vdHlwZXMvQmFzaXNUZXh0dXJlJztcbmltcG9ydCB0eXBlIHsgQ291bnQsIEluZGV4LCBTaXplLCBUeXBlZEFycmF5LCBXZWJHTFJlc291cmNlSGFuZGxlLCBXZWJHUFVSZXNvdXJjZUhhbmRsZSB9IGZyb20gJy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgVGV4dHVyZURhdGEsIFZlcnRleEhhbmRsZXMgfSBmcm9tICcuLi93ZWJnbC9XZWJHTFJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBwYWNrUmdiYVJvd3NGb3JVcGxvYWQgfSBmcm9tICcuL3BhY2tSZ2JhUm93c0ZvclVwbG9hZCc7XG5pbXBvcnQgeyBXZWJHcHVCdWZmZXJBcmVuYSwgdHlwZSBXZWJHcHVCdWZmZXJSYW5nZSB9IGZyb20gJy4vV2ViR3B1QnVmZmVyQXJlbmEnO1xuaW1wb3J0IHR5cGUgeyBXZWJHcHVEZXZpY2VXcmFwcGVyIH0gZnJvbSAnLi9XZWJHcHVEZXZpY2VXcmFwcGVyJztcbmltcG9ydCB7IHR5cGUgR3B1Q3VsbGVkRHJhdywgV2ViR3B1R3B1Q3VsbGluZyB9IGZyb20gJy4vV2ViR3B1R3B1Q3VsbGluZyc7XG5pbXBvcnQgeyBXZWJHcHVHcHVUaW1lciB9IGZyb20gJy4vV2ViR3B1R3B1VGltZXInO1xuXG5leHBvcnQgdHlwZSBXZWJHcHVSZXNvdXJjZSA9XG4gIHwgR1BVVGV4dHVyZVxuICB8IEdQVUJ1ZmZlclxuICB8IEdQVVNhbXBsZXJcbiAgfCBHUFVUZXh0dXJlVmlld1xuICB8IEdQVUJ1ZmZlckJpbmRpbmdcbiAgfCBHUFVSZW5kZXJQaXBlbGluZVxuICB8IEdQVUNvbXB1dGVQaXBlbGluZVxuICB8IEdQVUJpbmRHcm91cExheW91dFxuICB8IEdQVUJpbmRHcm91cFxuICB8IEdQVVNoYWRlck1vZHVsZVxuICB8IEdQVUNvbW1hbmRFbmNvZGVyXG4gIHwgR1BVQ29tcHV0ZVBhc3NFbmNvZGVyXG4gIHwgR1BVUmVuZGVyUGFzc0VuY29kZXJcbiAgfCBHUFVDb21wdXRlUGlwZWxpbmVcbiAgfCBHUFVSZW5kZXJQaXBlbGluZVxuICB8IEdQVVF1ZXJ5U2V0XG4gIHwgb2JqZWN0O1xuXG50eXBlIFJlbmRlclBpcGVsaW5lSWQgPSBzdHJpbmc7XG5cbmNvbnN0IF9JQkxfRElGRlVTRV9DVUJFX1RFWFRVUkVfQklORElOR19TTE9UID0gMTY7XG5jb25zdCBfSUJMX1NQRUNVTEFSX0NVQkVfVEVYVFVSRV9CSU5ESU5HX1NMT1QgPSAxNztcbmNvbnN0IERFRkFVTFRfREVQVEhfRk9STUFUID0gJ2RlcHRoMzJmbG9hdCcgYXMgR1BVVGV4dHVyZUZvcm1hdDtcblxuLy8gS2luZHMgb2YgYXR0YWNobWVudCBzZXRzIGEgcmVuZGVyIHBhc3MgZW5jb2RlciBjYW4gdGFyZ2V0LiBSZW5kZXIgcGFzc2VzIGFyZSBtZXJnZWQgaW50byBhblxuLy8gb3BlbiBlbmNvZGVyIG9ubHkgd2hlbiBib3RoIHRoZSBraW5kIGFuZCBldmVyeSBhdHRhY2htZW50IHZpZXcgbWF0Y2guXG5jb25zdCBSRU5ERVJfUEFTU19UQVJHRVRfS0lORF9OT05FID0gMDsgLy8gbm90IG1lcmdlYWJsZSAoZS5nLiBXZWJYUiBzdWItaW1hZ2VzLCBleHRlcm5hbCByZW5kZXJpbmcpXG5jb25zdCBSRU5ERVJfUEFTU19UQVJHRVRfS0lORF9NU0FBX1JFU09MVkUgPSAxO1xuY29uc3QgUkVOREVSX1BBU1NfVEFSR0VUX0tJTkRfRlJBTUVCVUZGRVIgPSAyO1xuY29uc3QgUkVOREVSX1BBU1NfVEFSR0VUX0tJTkRfQ0FOVkFTID0gMztcblxuLyoqIEJpbmRpbmdzIGNvbGxlY3RlZCBmb3IgdGhlIHRleHR1cmUgKGdyb3VwIDEpIGFuZCBzYW1wbGVyIChncm91cCAyKSBiaW5kIGdyb3VwcyBvZiBhIGRyYXcuICovXG50eXBlIFRleHR1cmVTYW1wbGVyQmluZGluZ3MgPSB7XG4gIGNvdW50OiBudW1iZXI7XG4gIHNsb3RzOiBudW1iZXJbXTtcbiAgZGltZW5zaW9uczogR1BVVGV4dHVyZVZpZXdEaW1lbnNpb25bXTtcbiAgdmlzaWJpbGl0aWVzOiBudW1iZXJbXTtcbiAgdmlld3M6IEdQVVRleHR1cmVWaWV3W107XG4gIHNhbXBsZXJzOiBHUFVTYW1wbGVyW107XG59O1xuXG4vKiogQmluZCBncm91cHMgYW5kIHRoZWlyIGxheW91dHMgdXNlZCBieSBhIGRyYXcsIHNoYXJlZCBieSBldmVyeSBkcmF3IHdpdGggdGhlIHNhbWUgY29udGVudC4gKi9cbnR5cGUgRHJhd0JpbmRHcm91cHMgPSB7XG4gIHN0b3JhZ2U6IEdQVUJpbmRHcm91cDtcbiAgdGV4dHVyZTogR1BVQmluZEdyb3VwO1xuICBzYW1wbGVyOiBHUFVCaW5kR3JvdXA7XG4gIHBpcGVsaW5lTGF5b3V0OiBHUFVQaXBlbGluZUxheW91dDtcbiAgcGlwZWxpbmVMYXlvdXRLZXk6IHN0cmluZztcbn07XG5cbi8qKlxuICogV2ViR1BVIFJlc291cmNlIFJlcG9zaXRvcnkgdGhhdCBtYW5hZ2VzIFdlYkdQVSByZXNvdXJjZXMgYW5kIHByb3ZpZGVzIHJlbmRlcmluZyBmdW5jdGlvbmFsaXR5LlxuICogVGhpcyBjbGFzcyBzZXJ2ZXMgYXMgYSBjZW50cmFsIGh1YiBmb3IgY3JlYXRpbmcsIG1hbmFnaW5nLCBhbmQgdXRpbGl6aW5nIFdlYkdQVSByZXNvdXJjZXNcbiAqIHN1Y2ggYXMgdGV4dHVyZXMsIGJ1ZmZlcnMsIHBpcGVsaW5lcywgYW5kIHJlbmRlciBwYXNzZXMuXG4gKlxuICogQGV4dGVuZHMgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnlcbiAqIEBpbXBsZW1lbnRzIElDR0FQSVJlc291cmNlUmVwb3NpdG9yeVxuICovXG5leHBvcnQgY2xhc3MgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5IGV4dGVuZHMgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkgaW1wbGVtZW50cyBJQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkge1xuICBwcml2YXRlIF9fd2ViR3B1UmVzb3VyY2VzOiBNYXA8V2ViR0xSZXNvdXJjZUhhbmRsZSwgV2ViR3B1UmVzb3VyY2U+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fcmVzb3VyY2VDb3VudGVyOiBudW1iZXIgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgcHJpdmF0ZSBfX3dlYkdwdURldmljZVdyYXBwZXI/OiBXZWJHcHVEZXZpY2VXcmFwcGVyO1xuICBwcml2YXRlIF9fc3RvcmFnZUJ1ZmZlcj86IEdQVUJ1ZmZlcjtcbiAgcHJpdmF0ZSBfX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyPzogR1BVQnVmZmVyO1xuICAvLyBCaW5kIGdyb3VwcyBhbmQgcGlwZWxpbmVzIGFyZSBjYWNoZWQgaW5kZXBlbmRlbnRseSBvZiBlYWNoIG90aGVyOlxuICAvLyAtIEJpbmQgZ3JvdXAgbGF5b3V0cyBhbmQgcGlwZWxpbmUgbGF5b3V0cyBhcmUga2V5ZWQgYnkgdGhlaXIgZGVzY3JpcHRvcnMsIHNvIGV2ZXJ5IHBpcGVsaW5lIGFuZFxuICAvLyAgIGJpbmQgZ3JvdXAgd2l0aCB0aGUgc2FtZSBsYXlvdXQgc2hhcmVzIG9uZSBvYmplY3QuXG4gIC8vIC0gQmluZCBncm91cHMgYXJlIGtleWVkIGJ5IHRoZWlyIGxheW91dCBhbmQgdGhlIHJlc291cmNlcyB0aGV5IGJpbmQsIHNvIGRyYXdzIGJpbmRpbmcgdGhlIHNhbWVcbiAgLy8gICByZXNvdXJjZXMgc2hhcmUgb25lIGJpbmQgZ3JvdXAgcmVnYXJkbGVzcyBvZiB0aGUgcGlwZWxpbmUsIG1hdGVyaWFsIG9yIHJlbmRlciBwYXNzLiBTaGFyaW5nIGxldHNcbiAgLy8gICBkcmF3KCkgc2tpcCBhIHNldEJpbmRHcm91cCgpIHRoYXQgd291bGQgcmViaW5kIHRoZSBzYW1lIGdyb3VwLCB3aGljaCBpcyBvdGhlcndpc2UgcmVwbGF5ZWQgYnkgdGhlXG4gIC8vICAgYnJvd3NlcidzIEdQVSBwcm9jZXNzIGZvciBldmVyeSBkcmF3IG9mIGEgcmVuZGVyIGJ1bmRsZSBvbiBldmVyeSBmcmFtZS5cbiAgLy8gLSBQaXBlbGluZXMgYXJlIGtleWVkIGJ5IHRoZWlyIHJlbmRlciBzdGF0ZSBhbmQgcGlwZWxpbmUgbGF5b3V0LCBzbyByZWNyZWF0aW5nIGEgcGlwZWxpbmUgZG9lcyBub3RcbiAgLy8gICByZWNyZWF0ZSBiaW5kIGdyb3VwcyBhbmQgdmljZSB2ZXJzYS5cbiAgLyoqIEdyb3VwIDA6IHRoZSBzdG9yYWdlIGJ1ZmZlciwgdGhlIGJsZW5kIHNoYXBlIGJ1ZmZlciBhbmQgdGhlIG1vcnBoIHVuaWZvcm0gYnVmZmVycy4gKi9cbiAgcHJpdmF0ZSBfX2JpbmRHcm91cFN0b3JhZ2VCdWZmZXI/OiBHUFVCaW5kR3JvdXA7XG4gIHByaXZhdGUgX19iaW5kR3JvdXBMYXlvdXRTdG9yYWdlQnVmZmVyPzogR1BVQmluZEdyb3VwTGF5b3V0O1xuICBwcml2YXRlIF9fYmluZEdyb3VwTGF5b3V0S2V5U3RvcmFnZUJ1ZmZlciA9ICcnO1xuICAvKiogVGhlIGJ1ZmZlcnMgYm91bmQgYnkgYF9fYmluZEdyb3VwU3RvcmFnZUJ1ZmZlcmAsIHVzZWQgdG8gZGV0ZWN0IHdoZW4gaXQgbXVzdCBiZSByZWNyZWF0ZWQuICovXG4gIHByaXZhdGUgX19zdG9yYWdlQmluZEdyb3VwQnVmZmVyczogKEdQVUJ1ZmZlciB8IHVuZGVmaW5lZClbXSA9IFtdO1xuICAvKiogQm91bmQgdG8gdGhlIGJsZW5kIHNoYXBlIHNsb3Qgb2YgZ3JvdXAgMCB3aGVuIHRoZXJlIGlzIG5vIGJsZW5kIHNoYXBlIGJ1ZmZlci4gKi9cbiAgcHJpdmF0ZSBfX2R1bW15QmxlbmRTaGFwZUJ1ZmZlcj86IEdQVUJ1ZmZlcjtcbiAgLyoqIEJvdW5kIGF0IGdyb3VwIDAsIGJpbmRpbmcgNCB3aGlsZSB0aGUgR1BVIGN1bGxpbmcgKGFuZCBpdHMgZGVmb3JtZWQgdmVydGV4IGJ1ZmZlcikgZG9lcyBub3QgZXhpc3QuICovXG4gIHByaXZhdGUgX19kdW1teURlZm9ybWVkVmVydGljZXNCdWZmZXI/OiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX193ZWJHcHVSZW5kZXJQaXBlbGluZU1hcDogTWFwPFJlbmRlclBpcGVsaW5lSWQsIEdQVVJlbmRlclBpcGVsaW5lPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX21hdGVyaWFsU3RhdGVWZXJzaW9uTWFwOiBNYXA8UmVuZGVyUGlwZWxpbmVJZCwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2JpbmRHcm91cExheW91dENhY2hlOiBNYXA8c3RyaW5nLCBHUFVCaW5kR3JvdXBMYXlvdXQ+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fcGlwZWxpbmVMYXlvdXRDYWNoZTogTWFwPHN0cmluZywgR1BVUGlwZWxpbmVMYXlvdXQ+ID0gbmV3IE1hcCgpO1xuICAvKiogR3JvdXAgMSAodGV4dHVyZXMpLCBrZXllZCBieSBsYXlvdXQgYW5kIGJvdW5kIHRleHR1cmUgdmlld3MuICovXG4gIHByaXZhdGUgX190ZXh0dXJlQmluZEdyb3VwQ2FjaGU6IE1hcDxzdHJpbmcsIEdQVUJpbmRHcm91cD4gPSBuZXcgTWFwKCk7XG4gIC8qKiBHcm91cCAyIChzYW1wbGVycyksIGtleWVkIGJ5IGxheW91dCBhbmQgYm91bmQgc2FtcGxlcnMuICovXG4gIHByaXZhdGUgX19zYW1wbGVyQmluZEdyb3VwQ2FjaGU6IE1hcDxzdHJpbmcsIEdQVUJpbmRHcm91cD4gPSBuZXcgTWFwKCk7XG4gIC8qKiBHcm91cCAzIChkcmF3IHBhcmFtZXRlcnMpLCBrZXllZCBieSB0aGUgcGFyYW1ldGVyIHZhbHVlcy4gVGhlIHVuaWZvcm0gYnVmZmVycyBhcmUgaW1tdXRhYmxlLiAqL1xuICBwcml2YXRlIF9fZHJhd1BhcmFtZXRlcnNCaW5kR3JvdXBDYWNoZTogTWFwPHN0cmluZywgR1BVQmluZEdyb3VwPiA9IG5ldyBNYXAoKTtcbiAgLyoqXG4gICAqIFVuaWZvcm0gYnVmZmVycyBob2xkaW5nIHRoZSBkcmF3IHBhcmFtZXRlcnMuIEVhY2ggYnVmZmVyIGhvbGRzIG1hbnkgZW50cmllcyBhdCB0aGUgdW5pZm9ybSBvZmZzZXRcbiAgICogYWxpZ25tZW50OiB0aGUgYnJvd3NlcidzIEdQVSBwcm9jZXNzIGFuZCB0aGUgZHJpdmVyIHRyYWNrIGV2ZXJ5IGRpc3RpbmN0IGJ1ZmZlciByZWZlcmVuY2VkIGJ5IGFcbiAgICogZnJhbWUsIHNvIG9uZSBzbWFsbCBidWZmZXIgcGVyIGVudHJ5IGNvc3RzIG11Y2ggbW9yZSB0aGFuIG9mZnNldHMgaW50byBhIGZldyBsYXJnZSBidWZmZXJzLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2RyYXdQYXJhbWV0ZXJzQnVmZmVyczogR1BVQnVmZmVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2RyYXdQYXJhbWV0ZXJzRW50cnlDb3VudEluTGFzdEJ1ZmZlciA9IDA7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fZHJhd1BhcmFtZXRlcnNFbnRyaWVzUGVyQnVmZmVyID0gMTAyNDtcbiAgLyoqIFRoZSBieXRlIHNpemUgb2YgVW5pZm9ybURyYXdQYXJhbWV0ZXJzIChwcmVyZXF1aXNpdGVzLndnc2wpLiAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX2RyYXdQYXJhbWV0ZXJzQnl0ZVNpemUgPSAzMjtcbiAgcHJpdmF0ZSBzdGF0aWMgX19kcmF3UGFyYW1ldGVyc1ZhbHVlcyA9IG5ldyBVaW50MzJBcnJheShXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX19kcmF3UGFyYW1ldGVyc0J5dGVTaXplIC8gNCk7XG4gIC8qKiBUaGUgYXJndW1lbnRzIG9mIHRoZSBsYXN0IHNldERyYXdQYXJhbWV0ZXJzKCkgY2FsbCAod2l0aG91dCB0aGUgZGVmb3JtZWQgdmVydGV4IG9mZnNldCkuICovXG4gIHByaXZhdGUgX19sYXN0RHJhd1BhcmFtZXRlcnMgPSBbMCwgMCwgMCwgMF07XG4gIHByaXZhdGUgX19iaW5kR3JvdXBMYXlvdXRVbmlmb3JtRHJhd1BhcmFtZXRlcnM/OiBHUFVCaW5kR3JvdXBMYXlvdXQ7XG4gIC8qKiBUaGUgZ3JvdXAgMyBiaW5kIGdyb3VwIHNlbGVjdGVkIGJ5IHNldERyYXdQYXJhbWV0ZXJzKCkgZm9yIHRoZSBuZXh0IGRyYXcoKS4gKi9cbiAgcHJpdmF0ZSBfX2N1cnJlbnREcmF3UGFyYW1ldGVyc0JpbmRHcm91cD86IEdQVUJpbmRHcm91cDtcbiAgLyoqIFZpZXdzIGNyZWF0ZWQgZm9yIGR1bW15IHRleHR1cmVzIHdoZW4gYSB0ZXh0dXJlIGhhcyBubyB2aWV3IHlldCwgYnkgdGV4dHVyZSBhbmQgZGltZW5zaW9uLiAqL1xuICBwcml2YXRlIF9fZHVtbXlUZXh0dXJlVmlld3M6IFdlYWtNYXA8R1BVVGV4dHVyZSwgTWFwPEdQVVRleHR1cmVWaWV3RGltZW5zaW9uLCBHUFVUZXh0dXJlVmlldz4+ID0gbmV3IFdlYWtNYXAoKTtcbiAgLyoqIElkZW50aWZpZXJzIG9mIEdQVSBvYmplY3RzIHVzZWQgdG8gYnVpbGQgY2FjaGUga2V5cy4gKi9cbiAgcHJpdmF0ZSBfX2dwdU9iamVjdElkczogV2Vha01hcDxvYmplY3QsIG51bWJlcj4gPSBuZXcgV2Vha01hcCgpO1xuICBwcml2YXRlIF9fZ3B1T2JqZWN0SWRDb3VudCA9IDA7XG4gIHByaXZhdGUgX190ZXh0dXJlU2FtcGxlckJpbmRpbmdzOiBUZXh0dXJlU2FtcGxlckJpbmRpbmdzID0ge1xuICAgIGNvdW50OiAwLFxuICAgIHNsb3RzOiBbXSxcbiAgICBkaW1lbnNpb25zOiBbXSxcbiAgICB2aXNpYmlsaXRpZXM6IFtdLFxuICAgIHZpZXdzOiBbXSxcbiAgICBzYW1wbGVyczogW10sXG4gIH07XG4gIHByaXZhdGUgX19kcmF3QmluZEdyb3VwczogRHJhd0JpbmRHcm91cHMgfCB1bmRlZmluZWQ7XG4gIC8qKiBTdGF0ZSBsYXN0IHJlY29yZGVkIGludG8gdGhlIGN1cnJlbnQgcmVuZGVyIGJ1bmRsZSBlbmNvZGVyLCB1c2VkIHRvIHNraXAgcmVkdW5kYW50IGNvbW1hbmRzLiAqL1xuICBwcml2YXRlIF9fYnVuZGxlUGlwZWxpbmU/OiBHUFVSZW5kZXJQaXBlbGluZTtcbiAgcHJpdmF0ZSBfX2J1bmRsZUJpbmRHcm91cHM6IChHUFVCaW5kR3JvdXAgfCB1bmRlZmluZWQpW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2J1bmRsZVZlcnRleEJ1ZmZlcnM6ICh7IGJ1ZmZlcjogR1BVQnVmZmVyOyBvZmZzZXQ6IG51bWJlcjsgc2l6ZTogbnVtYmVyIH0gfCB1bmRlZmluZWQpW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2J1bmRsZUluZGV4QnVmZmVyPzogV2ViR3B1QnVmZmVyUmFuZ2U7XG4gIC8qKlxuICAgKiBWZXJ0ZXggYW5kIGluZGV4IGRhdGEgb2YgYWxsIHByaW1pdGl2ZXMgKGFuZCB0aGUgcGVyLW1lc2ggaW5zdGFuY2UgYnVmZmVycyksIHBhY2tlZCBpbnRvIGEgZmV3XG4gICAqIGxhcmdlIEdQVSBidWZmZXJzLiBFYWNoIGhhbmRsZSBtYXBzIHRvIGEgcmFuZ2Ugb2Ygb25lIG9mIHRoZW0uXG4gICAqL1xuICBwcml2YXRlIF9fdmVydGV4QnVmZmVyQXJlbmE/OiBXZWJHcHVCdWZmZXJBcmVuYTtcbiAgcHJpdmF0ZSBfX3ZlcnRleEJ1ZmZlclJhbmdlczogTWFwPFdlYkdQVVJlc291cmNlSGFuZGxlLCBXZWJHcHVCdWZmZXJSYW5nZT4gPSBuZXcgTWFwKCk7XG4gIC8qKiBNZWFzdXJlcyB0aGUgR1BVIHRpbWUgb2YgZnJhbWVzOyBjcmVhdGVkIG9uIGZpcnN0IHVzZSAoc2VlIEVuZ2luZS5ncHVUaW1lckVuYWJsZWQpLiAqL1xuICBwcml2YXRlIF9fZ3B1VGltZXI/OiBXZWJHcHVHcHVUaW1lcjtcbiAgcHJpdmF0ZSBfX2J1bmRsZUluZGV4Rm9ybWF0PzogR1BVSW5kZXhGb3JtYXQ7XG4gIHByaXZhdGUgX19jb21tYW5kRW5jb2Rlcj86IEdQVUNvbW1hbmRFbmNvZGVyO1xuICAvKiogQ2FjaGVkIGBncHVEZXZpY2UucXVldWVgIChbU2FtZU9iamVjdF0pLCByZWFkIG9uIGV2ZXJ5IGZyYW1lIGJ5IGZsdXNoKCkuICovXG4gIHByaXZhdGUgX19ncHVRdWV1ZT86IEdQVVF1ZXVlO1xuICBwcml2YXRlIF9fcmVuZGVyQnVuZGxlczogTWFwPHN0cmluZywgR1BVUmVuZGVyQnVuZGxlPiA9IG5ldyBNYXAoKTtcbiAgLyoqXG4gICAqIFRoZSBHUFUgZnJ1c3R1bSBjdWxsaW5nIG9mIHRoZSBpbnN0YW5jZXMgKENvbmZpZy5pc0dwdUN1bGxpbmdFbmFibGVkKSwgY3JlYXRlZCBvbiBmaXJzdCB1c2UuIEl0cyBhbGxvY2F0aW9uc1xuICAgKiBhcmUgb3duZWQgYnkgdGhlIHJlbmRlciBidW5kbGVzIGluIGBfX3JlbmRlckJ1bmRsZXNgLCBzbyBldmVyeSBjaGFuZ2Ugb2YgdGhhdCBtYXAgaXMgcmVwb3J0ZWQgdG8gaXRcbiAgICogKHNlZSBfX2NsZWFyUmVuZGVyQnVuZGxlQ2FjaGUpLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2dwdUN1bGxpbmc/OiBXZWJHcHVHcHVDdWxsaW5nO1xuICAvKiogU2V0IHdoZW4gdGhlIEdQVSBjdWxsaW5nIHJlY3JlYXRlZCBpdHMgYnVmZmVyczogdGhlIHJlbmRlciBidW5kbGVzIGJpbmRpbmcgdGhlbSB3ZXJlIGRyb3BwZWQuICovXG4gIHByaXZhdGUgX19pc0dwdUN1bGxpbmdSZXNldFBlbmRpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2xhc3RJc0dwdUN1bGxpbmdFbmFibGVkPzogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfX2xhc3RJc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQ/OiBib29sZWFuO1xuICBwcml2YXRlIF9fbGFzdElzRnJ1c3R1bUN1bGxpbmdFbmFibGVkPzogYm9vbGVhbjtcbiAgLyoqIEZyYWdtZW50IG1vZHVsZSBvZiB0aGUgZGVwdGggcHJlcGFzcyBwaXBlbGluZXMgKGl0IHdyaXRlcyBub3RoaW5nOyB0aGUgY29sb3IgdGFyZ2V0cyB1c2Ugd3JpdGVNYXNrIDApLiAqL1xuICBwcml2YXRlIF9fZGVwdGhPbmx5RnJhZ21lbnRNb2R1bGU/OiBHUFVTaGFkZXJNb2R1bGU7XG4gIHByaXZhdGUgX19yZW5kZXJCdW5kbGVFbmNvZGVyPzogR1BVUmVuZGVyQnVuZGxlRW5jb2RlcjtcbiAgcHJpdmF0ZSBfX3JlbmRlckJ1bmRsZUVuY29kZXJLZXk/OiBzdHJpbmc7XG4gIHByaXZhdGUgX19zeXN0ZW1EZXB0aFRleHR1cmU/OiBHUFVUZXh0dXJlO1xuICBwcml2YXRlIF9fc3lzdGVtRGVwdGhUZXh0dXJlVmlldz86IEdQVVRleHR1cmVWaWV3O1xuICBwcml2YXRlIF9fdW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlcj86IEdQVUJ1ZmZlcjtcbiAgcHJpdmF0ZSBfX3VuaWZvcm1Nb3JwaFdlaWdodHNCdWZmZXI/OiBHUFVCdWZmZXI7XG4gIHByaXZhdGUgX19yZW5kZXJQYXNzRW5jb2Rlcj86IEdQVVJlbmRlclBhc3NFbmNvZGVyO1xuICAvKipcbiAgICogVGhlIHJlbmRlciBwYXNzIGVuY29kZXIgaXMga2VwdCBvcGVuIGFmdGVyIGEgcmVuZGVyIHBhc3MgaGFzIGJlZW4gcmVjb3JkZWQgc28gdGhhdCBmb2xsb3dpbmdcbiAgICogcmVuZGVyIHBhc3NlcyBkcmF3aW5nIGludG8gdGhlIHNhbWUgYXR0YWNobWVudHMgKHdpdGhvdXQgY2xlYXJpbmcpIGNhbiBiZSBtZXJnZWQgaW50byBpdC5cbiAgICogRXZlcnkgYmVnaW5SZW5kZXJQYXNzL2VuZCBwYWlyIGlzIGEgY29tcGFyYXRpdmVseSBleHBlbnNpdmUgbmF0aXZlIGNhbGwsIGFuZCBvbiB0aWxlLWJhc2VkIEdQVXNcbiAgICogZWFjaCBleHRyYSBwYXNzIGFsc28gY29zdHMgYSBsb2FkL3N0b3JlIG9mIHRoZSBhdHRhY2htZW50cy5cbiAgICogVGhlc2UgZmllbGRzIGRlc2NyaWJlIHRoZSBjdXJyZW50bHkgb3BlbiBlbmNvZGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3JlbmRlclBhc3NFbmNvZGVyT3duZXI/OiBSZW5kZXJQYXNzO1xuICBwcml2YXRlIF9fcmVuZGVyUGFzc0VuY29kZXJEaXNwbGF5SWR4ID0gLTE7XG4gIHByaXZhdGUgX19yZW5kZXJQYXNzRW5jb2RlclRhcmdldEtpbmQgPSBSRU5ERVJfUEFTU19UQVJHRVRfS0lORF9OT05FO1xuICBwcml2YXRlIF9fcmVuZGVyUGFzc0VuY29kZXJUYXJnZXRWaWV3czogKEdQVVRleHR1cmVWaWV3IHwgdW5kZWZpbmVkKVtdID0gW107XG4gIC8qKiBTY3JhdGNoIGFycmF5IHN3YXBwZWQgd2l0aCBgX19yZW5kZXJQYXNzRW5jb2RlclRhcmdldFZpZXdzYCB0byBhdm9pZCBwZXItcGFzcyBhbGxvY2F0aW9ucy4gKi9cbiAgcHJpdmF0ZSBfX2NhbmRpZGF0ZVJlbmRlclBhc3NUYXJnZXRWaWV3czogKEdQVVRleHR1cmVWaWV3IHwgdW5kZWZpbmVkKVtdID0gW107XG4gIC8qKiBSZW5kZXIgYnVuZGxlcyB3YWl0aW5nIHRvIGJlIGV4ZWN1dGVkIGluIHRoZSBvcGVuIHJlbmRlciBwYXNzLiBTZWUgX19leGVjdXRlUmVuZGVyQnVuZGxlKCkuICovXG4gIHByaXZhdGUgX19wZW5kaW5nUmVuZGVyQnVuZGxlczogR1BVUmVuZGVyQnVuZGxlW10gPSBbXTtcbiAgLyoqXG4gICAqIFRoZSBjbGVhciBvZiBhIHJlbmRlciBwYXNzIHRoYXQgZHJhd3Mgbm90aGluZywgbm90IGVuY29kZWQgeWV0LiBTZWUgY2xlYXJGcmFtZUJ1ZmZlcigpLlxuICAgKiBUaGUgb2JqZWN0IGlzIHJldXNlZCB0byBrZWVwIHRoZSBwZXItZnJhbWUgcGF0aCBmcmVlIG9mIGFsbG9jYXRpb25zLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3BlbmRpbmdDbGVhciA9IHtcbiAgICBhY3RpdmU6IGZhbHNlLFxuICAgIGVuZ2luZTogdW5kZWZpbmVkIGFzIEVuZ2luZSB8IHVuZGVmaW5lZCxcbiAgICByZW5kZXJQYXNzOiB1bmRlZmluZWQgYXMgUmVuZGVyUGFzcyB8IHVuZGVmaW5lZCxcbiAgICBkaXNwbGF5SWR4OiAwLFxuICAgIHRhcmdldEtpbmQ6IFJFTkRFUl9QQVNTX1RBUkdFVF9LSU5EX05PTkUsXG4gICAgdGFyZ2V0Vmlld3M6IFtdIGFzIChHUFVUZXh0dXJlVmlldyB8IHVuZGVmaW5lZClbXSxcbiAgICBpc0NvbG9yQ2xlYXI6IGZhbHNlLFxuICAgIGNsZWFyQ29sb3I6IHsgcjogMCwgZzogMCwgYjogMCwgYTogMCB9LFxuICAgIGlzRGVwdGhDbGVhcjogZmFsc2UsXG4gICAgY2xlYXJEZXB0aDogMSxcbiAgfTtcbiAgLyoqIEEgZGVwdGggY2xlYXIgb2YgdGhlIHN5c3RlbSBkZXB0aCB0ZXh0dXJlIGRlZmVycmVkIHRvIHRoZSBuZXh0IHJlbmRlciBwYXNzIGF0dGFjaGluZyBpdC4gU2VlIGZsdXNoKCkuICovXG4gIHByaXZhdGUgX19kZWZlcnJlZFN5c3RlbURlcHRoQ2xlYXJWYWx1ZTogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAvKiogVGhlIHJlbmRlciBwYXNzIChhbmQgZGlzcGxheSkgdGhlIHBlbmRpbmcgcmVuZGVyIGJ1bmRsZSBlbmNvZGVyIGlzIHJlY29yZGluZyBmb3IuICovXG4gIHByaXZhdGUgX19yZW5kZXJCdW5kbGVFbmNvZGVyT3duZXI/OiBSZW5kZXJQYXNzO1xuICBwcml2YXRlIF9fcmVuZGVyQnVuZGxlRW5jb2RlckRpc3BsYXlJZHggPSAtMTtcbiAgcHJpdmF0ZSBfX2dlbmVyYXRlTWlwbWFwc1NoYWRlck1vZHVsZT86IEdQVVNoYWRlck1vZHVsZTtcbiAgcHJpdmF0ZSBfX2dlbmVyYXRlTWlwbWFwc1BpcGVsaW5lPzogR1BVUmVuZGVyUGlwZWxpbmU7XG4gIHByaXZhdGUgX19nZW5lcmF0ZU1pcG1hcHNGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0O1xuICBwcml2YXRlIF9fZ2VuZXJhdGVNaXBtYXBzU2FtcGxlcj86IEdQVVNhbXBsZXI7XG4gIHByaXZhdGUgX19nZW5lcmF0ZU1pcG1hcHNCaW5kR3JvdXBMYXlvdXQ/OiBHUFVCaW5kR3JvdXBMYXlvdXQ7XG4gIHByaXZhdGUgX19jb250ZXh0Q3VycmVudFRleHR1cmVWaWV3PzogR1BVVGV4dHVyZVZpZXc7XG5cbiAgcHJpdmF0ZSBfX2xhc3RCaW5kaW5nU3RhdGVWZXJzaW9uID0gLTE7XG4gIHByaXZhdGUgX19sYXN0Q3VycmVudENhbWVyYUNvbXBvbmVudFNpZCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdEVudGl0eVJlcG9zaXRvcnlVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFByaW1pdGl2ZXNNYXRlcmlhbFZhcmlhbnRVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdE1lc2hSZW5kZXJlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuXG4gIHByaXZhdGUgX19zcmNUZXh0dXJlVmlld3NGb3JHZW5lcmF0aW5nTWlwbWFwczogTWFwPEdQVVRleHR1cmUsIEFycmF5PEdQVVRleHR1cmVWaWV3Pj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX19kc3RUZXh0dXJlVmlld3NGb3JHZW5lcmF0aW5nTWlwbWFwczogTWFwPEdQVVRleHR1cmUsIEFycmF5PEFycmF5PEdQVVRleHR1cmVWaWV3Pj4+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fYmluZEdyb3Vwc0ZvckdlbmVyYXRpbmdNaXBtYXBzOiBNYXA8R1BVVGV4dHVyZSwgQXJyYXk8QXJyYXk8R1BVQmluZEdyb3VwPj4+ID0gbmV3IE1hcCgpO1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fYXNzZXJ0QXJyYXlCdWZmZXJWaWV3KFxuICAgIGFycmF5OiBUeXBlZEFycmF5XG4gICk6IGFzc2VydHMgYXJyYXkgaXMgVHlwZWRBcnJheSAmIEFycmF5QnVmZmVyVmlldzxBcnJheUJ1ZmZlcj4ge1xuICAgIGlmICghKGFycmF5LmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaGFyZWRBcnJheUJ1ZmZlciBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgY29kZSBwYXRoLicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIGNhY2hlZCByZXNvdXJjZXMgaW5jbHVkaW5nIHJlbmRlciBwaXBlbGluZXMsIGJpbmQgZ3JvdXBzLCBhbmQgcmVuZGVyIGJ1bmRsZXMuXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgd2hlbiByZXNvdXJjZXMgbmVlZCB0byBiZSByZWNyZWF0ZWQgb3Igd2hlbiB0aGUgcmVuZGVyaW5nIGNvbnRleHQgY2hhbmdlcy5cbiAgICovXG4gIGNsZWFyQ2FjaGUoKSB7XG4gICAgdGhpcy5fX3dlYkdwdVJlbmRlclBpcGVsaW5lTWFwLmNsZWFyKCk7XG4gICAgdGhpcy5fX21hdGVyaWFsU3RhdGVWZXJzaW9uTWFwLmNsZWFyKCk7XG4gICAgLy8gQ2FsbGVkIHdoZW4gdGV4dHVyZXMgYXJlIGRlbGV0ZWQsIHNvIGRyb3AgZXZlcnkgYmluZCBncm91cCB0aGF0IG1heSBiaW5kIG9uZSBvZiB0aGVtLlxuICAgIHRoaXMuX190ZXh0dXJlQmluZEdyb3VwQ2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLl9fc2FtcGxlckJpbmRHcm91cENhY2hlLmNsZWFyKCk7XG4gICAgdGhpcy5fX2JpbmRHcm91cFN0b3JhZ2VCdWZmZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3N0b3JhZ2VCaW5kR3JvdXBCdWZmZXJzLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5fX2NsZWFyUmVuZGVyQnVuZGxlQ2FjaGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgV2ViR1BVIGRldmljZSB3cmFwcGVyIHRvIHRoZSByZXBvc2l0b3J5IGFuZCBpbml0aWFsaXplcyB0aGUgY29tbWFuZCBlbmNvZGVyLlxuICAgKiBUaGlzIG11c3QgYmUgY2FsbGVkIGJlZm9yZSB1c2luZyBhbnkgV2ViR1BVIGZ1bmN0aW9uYWxpdHkuXG4gICAqXG4gICAqIEBwYXJhbSB3ZWJHcHVEZXZpY2VXcmFwcGVyIC0gVGhlIFdlYkdQVSBkZXZpY2Ugd3JhcHBlciBjb250YWluaW5nIHRoZSBkZXZpY2UgYW5kIGNvbnRleHRcbiAgICovXG4gIGFkZFdlYkdwdURldmljZVdyYXBwZXIod2ViR3B1RGV2aWNlV3JhcHBlcjogV2ViR3B1RGV2aWNlV3JhcHBlcikge1xuICAgIHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyID0gd2ViR3B1RGV2aWNlV3JhcHBlcjtcbiAgICB0aGlzLl9fZ3B1UXVldWUgPSB3ZWJHcHVEZXZpY2VXcmFwcGVyLmdwdURldmljZS5xdWV1ZTtcbiAgICB0aGlzLl9fY29tbWFuZEVuY29kZXIgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlci5ncHVEZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBXZWJHUFUgZGV2aWNlIHdyYXBwZXIgaW5zdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBXZWJHUFUgZGV2aWNlIHdyYXBwZXJcbiAgICogQHRocm93cyBFcnJvciBpZiB0aGUgZGV2aWNlIHdyYXBwZXIgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkXG4gICAqL1xuICBnZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCk6IFdlYkdwdURldmljZVdyYXBwZXIge1xuICAgIHJldHVybiB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciE7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc2luZ2xldG9uIGluc3RhbmNlIG9mIFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5cbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBpZiBvbmUgZG9lc24ndCBleGlzdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNpbmdsZXRvbiBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGluaXQoKTogV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5IHtcbiAgICByZXR1cm4gbmV3IFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHVuaXF1ZSByZXNvdXJjZSBudW1iZXIgZm9yIHRyYWNraW5nIFdlYkdQVSByZXNvdXJjZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgdW5pcXVlIHJlc291cmNlIGhhbmRsZSBudW1iZXJcbiAgICovXG4gIHByaXZhdGUgZ2V0UmVzb3VyY2VOdW1iZXIoKTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIHJldHVybiArK3RoaXMuX19yZXNvdXJjZUNvdW50ZXI7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgV2ViR1BVIHJlc291cmNlIGFuZCBhc3NpZ25zIGl0IGEgdW5pcXVlIGhhbmRsZS5cbiAgICpcbiAgICogQHBhcmFtIG9iaiAtIFRoZSBXZWJHUFUgcmVzb3VyY2UgdG8gcmVnaXN0ZXJcbiAgICogQHJldHVybnMgVGhlIHVuaXF1ZSBoYW5kbGUgZm9yIHRoZSByZWdpc3RlcmVkIHJlc291cmNlXG4gICAqL1xuICBwcml2YXRlIF9fcmVnaXN0ZXJSZXNvdXJjZShvYmo6IFdlYkdwdVJlc291cmNlKSB7XG4gICAgY29uc3QgaGFuZGxlID0gdGhpcy5nZXRSZXNvdXJjZU51bWJlcigpO1xuICAgIChvYmogYXMgYW55KS5fcmVzb3VyY2VVaWQgPSBoYW5kbGU7XG4gICAgdGhpcy5fX3dlYkdwdVJlc291cmNlcy5zZXQoaGFuZGxlLCBvYmopO1xuICAgIHJldHVybiBoYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBjYW52YXMgc2l6ZSBhcyBhIHR1cGxlIG9mIHdpZHRoIGFuZCBoZWlnaHQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgdHVwbGUgY29udGFpbmluZyBbd2lkdGgsIGhlaWdodF0gb2YgdGhlIGNhbnZhc1xuICAgKi9cbiAgZ2V0Q2FudmFzU2l6ZSgpOiBbU2l6ZSwgU2l6ZV0ge1xuICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5jYW52YXM7XG4gICAgcmV0dXJuIFtjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHRdO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBXZWJHUFUgdGV4dHVyZSBmcm9tIEltYWdlQml0bWFwIGRhdGEgd2l0aCBzcGVjaWZpZWQgcGFyYW1ldGVycy5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyB0ZXh0dXJlIGNyZWF0aW9uLCBkYXRhIHVwbG9hZCwgYW5kIG9wdGlvbmFsIG1pcG1hcCBnZW5lcmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gaW1hZ2VEYXRhIC0gVGhlIEltYWdlQml0bWFwIGRhdGEgdG8gY3JlYXRlIHRoZSB0ZXh0dXJlIGZyb21cbiAgICogQHBhcmFtIHBhcmFtcyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGNvbnRhaW5pbmcgdGV4dHVyZSBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBwYXJhbXMubGV2ZWwgLSBNaXBtYXAgbGV2ZWwgKHR5cGljYWxseSAwIGZvciBiYXNlIGxldmVsKVxuICAgKiBAcGFyYW0gcGFyYW1zLmludGVybmFsRm9ybWF0IC0gSW50ZXJuYWwgZm9ybWF0IG9mIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBwYXJhbXMud2lkdGggLSBXaWR0aCBvZiB0aGUgdGV4dHVyZSBpbiBwaXhlbHNcbiAgICogQHBhcmFtIHBhcmFtcy5oZWlnaHQgLSBIZWlnaHQgb2YgdGhlIHRleHR1cmUgaW4gcGl4ZWxzXG4gICAqIEBwYXJhbSBwYXJhbXMuYm9yZGVyIC0gQm9yZGVyIHdpZHRoIChtdXN0IGJlIDAgZm9yIFdlYkdQVSlcbiAgICogQHBhcmFtIHBhcmFtcy5mb3JtYXQgLSBQaXhlbCBmb3JtYXQgb2YgdGhlIHNvdXJjZSBkYXRhXG4gICAqIEBwYXJhbSBwYXJhbXMudHlwZSAtIENvbXBvbmVudCB0eXBlIG9mIHRoZSBzb3VyY2UgZGF0YVxuICAgKiBAcGFyYW0gcGFyYW1zLmdlbmVyYXRlTWlwbWFwIC0gV2hldGhlciB0byBnZW5lcmF0ZSBtaXBtYXBzIGF1dG9tYXRpY2FsbHlcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSB0ZXh0dXJlIHJlc291cmNlIGhhbmRsZVxuICAgKi9cbiAgcHVibGljIGFzeW5jIGNyZWF0ZVRleHR1cmVGcm9tSW1hZ2VCaXRtYXBEYXRhKFxuICAgIGltYWdlRGF0YTogSW1hZ2VCaXRtYXBEYXRhLFxuICAgIHtcbiAgICAgIGludGVybmFsRm9ybWF0LFxuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBnZW5lcmF0ZU1pcG1hcCxcbiAgICB9OiB7XG4gICAgICBpbnRlcm5hbEZvcm1hdDogVGV4dHVyZVBhcmFtZXRlckVudW07XG4gICAgICB3aWR0aDogU2l6ZTtcbiAgICAgIGhlaWdodDogU2l6ZTtcbiAgICAgIGdlbmVyYXRlTWlwbWFwOiBib29sZWFuO1xuICAgIH1cbiAgKTogUHJvbWlzZTxXZWJHUFVSZXNvdXJjZUhhbmRsZT4ge1xuICAgIGNvbnN0IHRleHR1cmVIYW5kbGUgPSBhd2FpdCB0aGlzLl9fY3JlYXRlVGV4dHVyZUlubmVyKHdpZHRoLCBoZWlnaHQsIGludGVybmFsRm9ybWF0LCBnZW5lcmF0ZU1pcG1hcCwgaW1hZ2VEYXRhKTtcblxuICAgIHJldHVybiB0ZXh0dXJlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBXZWJHUFUgdGV4dHVyZSBmcm9tIGEgZGF0YSBVUkkgc3RyaW5nLlxuICAgKiBUaGlzIG1ldGhvZCBsb2FkcyB0aGUgaW1hZ2UgZnJvbSB0aGUgZGF0YSBVUkkgYW5kIGNyZWF0ZXMgYSB0ZXh0dXJlIGZyb20gaXQuXG4gICAqXG4gICAqIEBwYXJhbSBkYXRhVXJpIC0gVGhlIGRhdGEgVVJJIHN0cmluZyBjb250YWluaW5nIHRoZSBpbWFnZSBkYXRhXG4gICAqIEBwYXJhbSBwYXJhbXMgLSBDb25maWd1cmF0aW9uIG9iamVjdCBjb250YWluaW5nIHRleHR1cmUgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gcGFyYW1zLmludGVybmFsRm9ybWF0IC0gSW50ZXJuYWwgZm9ybWF0IG9mIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBwYXJhbXMuZ2VuZXJhdGVNaXBtYXAgLSBXaGV0aGVyIHRvIGdlbmVyYXRlIG1pcG1hcHMgYXV0b21hdGljYWxseVxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHRleHR1cmUgcmVzb3VyY2UgaGFuZGxlXG4gICAqL1xuICBhc3luYyBjcmVhdGVUZXh0dXJlRnJvbURhdGFVcmkoXG4gICAgZGF0YVVyaTogc3RyaW5nLFxuICAgIHtcbiAgICAgIGludGVybmFsRm9ybWF0LFxuICAgICAgZ2VuZXJhdGVNaXBtYXAsXG4gICAgfToge1xuICAgICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICAgICAgZ2VuZXJhdGVNaXBtYXA6IGJvb2xlYW47XG4gICAgfVxuICApOiBQcm9taXNlPFdlYkdQVVJlc291cmNlSGFuZGxlPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFdlYkdQVVJlc291cmNlSGFuZGxlPihyZXNvbHZlID0+IHtcbiAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgaWYgKCFkYXRhVXJpLm1hdGNoKC9eZGF0YTovKSkge1xuICAgICAgICBpbWcuY3Jvc3NPcmlnaW4gPSAnQW5vbnltb3VzJztcbiAgICAgIH1cbiAgICAgIGltZy5vbmxvYWQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gaW1nLndpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBpbWcuaGVpZ2h0O1xuXG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSBhd2FpdCB0aGlzLmNyZWF0ZVRleHR1cmVGcm9tSFRNTEltYWdlRWxlbWVudChpbWcsIHtcbiAgICAgICAgICBpbnRlcm5hbEZvcm1hdCxcbiAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgZ2VuZXJhdGVNaXBtYXAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc29sdmUodGV4dHVyZSk7XG4gICAgICB9O1xuXG4gICAgICBpbWcuc3JjID0gZGF0YVVyaTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgbWlwbWFwcyBmb3IgYSAyRCB0ZXh0dXJlIHVzaW5nIHRoZSBzcGVjaWZpZWQgZGltZW5zaW9ucy5cbiAgICogVGhpcyBtZXRob2QgY3JlYXRlcyBhbGwgbWlwbWFwIGxldmVscyBmcm9tIHRoZSBiYXNlIHRleHR1cmUuXG4gICAqXG4gICAqIEBwYXJhbSB0ZXh0dXJlSGFuZGxlIC0gSGFuZGxlIHRvIHRoZSB0ZXh0dXJlIHJlc291cmNlXG4gICAqIEBwYXJhbSB3aWR0aCAtIFdpZHRoIG9mIHRoZSBiYXNlIHRleHR1cmUgbGV2ZWxcbiAgICogQHBhcmFtIGhlaWdodCAtIEhlaWdodCBvZiB0aGUgYmFzZSB0ZXh0dXJlIGxldmVsXG4gICAqL1xuICBnZW5lcmF0ZU1pcG1hcHMyZCh0ZXh0dXJlSGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBncHVUZXh0dXJlID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQodGV4dHVyZUhhbmRsZSkgYXMgR1BVVGV4dHVyZTtcbiAgICBjb25zdCB0ZXh0dXJlRGVzY3JpcHRvcjogR1BVVGV4dHVyZURlc2NyaXB0b3IgPSB7XG4gICAgICBzaXplOiBbd2lkdGgsIGhlaWdodCwgMV0sXG4gICAgICBmb3JtYXQ6IGdwdVRleHR1cmUuZm9ybWF0LFxuICAgICAgdXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5URVhUVVJFX0JJTkRJTkcgfCBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9EU1QgfCBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQsXG4gICAgICBtaXBMZXZlbENvdW50OiBNYXRoLmZsb29yKE1hdGgubG9nMihNYXRoLm1heCh3aWR0aCwgaGVpZ2h0KSkpICsgMSxcbiAgICB9O1xuICAgIHRoaXMuZ2VuZXJhdGVNaXBtYXBzKGdwdVRleHR1cmUsIHRleHR1cmVEZXNjcmlwdG9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgbWlwbWFwcyBmb3IgYSBjdWJlIHRleHR1cmUgdXNpbmcgdGhlIHNwZWNpZmllZCBkaW1lbnNpb25zLlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIGFsbCBtaXBtYXAgbGV2ZWxzIGZvciBhbGwgNiBmYWNlcyBvZiB0aGUgY3ViZSB0ZXh0dXJlLlxuICAgKlxuICAgKiBAcGFyYW0gdGV4dHVyZUhhbmRsZSAtIEhhbmRsZSB0byB0aGUgY3ViZSB0ZXh0dXJlIHJlc291cmNlXG4gICAqIEBwYXJhbSB3aWR0aCAtIFdpZHRoIG9mIHRoZSBiYXNlIHRleHR1cmUgbGV2ZWxcbiAgICogQHBhcmFtIGhlaWdodCAtIEhlaWdodCBvZiB0aGUgYmFzZSB0ZXh0dXJlIGxldmVsXG4gICAqL1xuICBnZW5lcmF0ZU1pcG1hcHNDdWJlKHRleHR1cmVIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGdwdVRleHR1cmUgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldCh0ZXh0dXJlSGFuZGxlKSBhcyBHUFVUZXh0dXJlO1xuICAgIGNvbnN0IHRleHR1cmVEZXNjcmlwdG9yOiBHUFVUZXh0dXJlRGVzY3JpcHRvciA9IHtcbiAgICAgIHNpemU6IFt3aWR0aCwgaGVpZ2h0LCA2XSxcbiAgICAgIGZvcm1hdDogZ3B1VGV4dHVyZS5mb3JtYXQsXG4gICAgICB1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlRFWFRVUkVfQklORElORyB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCB8IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCxcbiAgICAgIG1pcExldmVsQ291bnQ6IE1hdGguZmxvb3IoTWF0aC5sb2cyKE1hdGgubWF4KHdpZHRoLCBoZWlnaHQpKSkgKyAxLFxuICAgIH07XG4gICAgdGhpcy5nZW5lcmF0ZU1pcG1hcHMoZ3B1VGV4dHVyZSwgdGV4dHVyZURlc2NyaXB0b3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRzIHBpeGVsIGRhdGEgZnJvbSBhIHRleHR1cmUgYW5kIHJldHVybnMgaXQgYXMgYSBVaW50OEFycmF5LlxuICAgKiBUaGlzIG1ldGhvZCBpcyB1c2VmdWwgZm9yIGRlYnVnZ2luZyBvciBwb3N0LXByb2Nlc3NpbmcgdGV4dHVyZSBkYXRhLlxuICAgKlxuICAgKiBAcGFyYW0gdGV4dHVyZUhhbmRsZSAtIEhhbmRsZSB0byB0aGUgdGV4dHVyZSByZXNvdXJjZVxuICAgKiBAcGFyYW0gd2lkdGggLSBXaWR0aCBvZiB0aGUgdGV4dHVyZSByZWdpb24gdG8gcmVhZFxuICAgKiBAcGFyYW0gaGVpZ2h0IC0gSGVpZ2h0IG9mIHRoZSB0ZXh0dXJlIHJlZ2lvbiB0byByZWFkXG4gICAqIEBwYXJhbSBmcmFtZUJ1ZmZlclVpZCAtIEhhbmRsZSB0byB0aGUgZnJhbWVidWZmZXIgKGlmIGFwcGxpY2FibGUpXG4gICAqIEBwYXJhbSBjb2xvckF0dGFjaG1lbnRJbmRleCAtIEluZGV4IG9mIHRoZSBjb2xvciBhdHRhY2htZW50IHRvIHJlYWQgZnJvbVxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHBpeGVsIGRhdGEgYXMgVWludDhBcnJheVxuICAgKi9cbiAgYXN5bmMgZ2V0VGV4dHVyZVBpeGVsRGF0YShcbiAgICB0ZXh0dXJlSGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSxcbiAgICB3aWR0aDogbnVtYmVyLFxuICAgIGhlaWdodDogbnVtYmVyLFxuICAgIF9mcmFtZUJ1ZmZlclVpZDogV2ViR1BVUmVzb3VyY2VIYW5kbGUsXG4gICAgX2NvbG9yQXR0YWNobWVudEluZGV4OiBudW1iZXJcbiAgKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgY29uc3QgZ3B1VGV4dHVyZSA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KHRleHR1cmVIYW5kbGUpIGFzIEdQVVRleHR1cmU7XG4gICAgY29uc3QgdGV4dHVyZURhdGEgPSBuZXcgVWludDhBcnJheSh3aWR0aCAqIGhlaWdodCAqIDQpO1xuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgY29uc3QgY29tbWFuZEVuY29kZXIgPSBncHVEZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcbiAgICBjb25zdCBidWZmZXIgPSBncHVEZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIHNpemU6IHdpZHRoICogaGVpZ2h0ICogNCxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCB8IEdQVUJ1ZmZlclVzYWdlLk1BUF9SRUFELFxuICAgIH0pO1xuICAgIGNvbW1hbmRFbmNvZGVyLmNvcHlUZXh0dXJlVG9CdWZmZXIoXG4gICAgICB7IHRleHR1cmU6IGdwdVRleHR1cmUgfSxcbiAgICAgIHsgYnVmZmVyLCBieXRlc1BlclJvdzogd2lkdGggKiA0IH0sXG4gICAgICB7IHdpZHRoLCBoZWlnaHQsIGRlcHRoT3JBcnJheUxheWVyczogMSB9XG4gICAgKTtcbiAgICBncHVEZXZpY2UucXVldWUuc3VibWl0KFtjb21tYW5kRW5jb2Rlci5maW5pc2goKV0pO1xuICAgIGF3YWl0IGJ1ZmZlci5tYXBBc3luYyhHUFVNYXBNb2RlLlJFQUQpO1xuICAgIGNvbnN0IGFycmF5QnVmZmVyID0gYnVmZmVyLmdldE1hcHBlZFJhbmdlKCk7XG4gICAgdGV4dHVyZURhdGEuc2V0KG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKSk7XG4gICAgYnVmZmVyLnVubWFwKCk7XG4gICAgcmV0dXJuIHRleHR1cmVEYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRzIHBpeGVsIGRhdGEgZGlyZWN0bHkgZnJvbSBhIDJEIHRleHR1cmUgKHN5bmNocm9ub3VzIHZlcnNpb24pLlxuICAgKiBOb3RlOiBXZWJHUFUgZG9lcyBub3Qgc3VwcG9ydCBzeW5jaHJvbm91cyB0ZXh0dXJlIHJlYWRiYWNrLlxuICAgKiBUaGlzIG1ldGhvZCB0aHJvd3MgYW4gZXJyb3IgLSB1c2UgZ2V0UGl4ZWxEYXRhRnJvbVRleHR1cmVBc3luYyBpbnN0ZWFkLlxuICAgKi9cbiAgZ2V0UGl4ZWxEYXRhRnJvbVRleHR1cmUoXG4gICAgX3RleHR1cmVIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlLFxuICAgIF94OiBudW1iZXIsXG4gICAgX3k6IG51bWJlcixcbiAgICBfd2lkdGg6IG51bWJlcixcbiAgICBfaGVpZ2h0OiBudW1iZXJcbiAgKTogVWludDhBcnJheSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdXZWJHUFUgZG9lcyBub3Qgc3VwcG9ydCBzeW5jaHJvbm91cyB0ZXh0dXJlIHJlYWRiYWNrLiBVc2UgZ2V0UGl4ZWxEYXRhRnJvbVRleHR1cmVBc3luYyBpbnN0ZWFkLicpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRzIHBpeGVsIGRhdGEgZGlyZWN0bHkgZnJvbSBhIDJEIHRleHR1cmUgYXN5bmNocm9ub3VzbHkuXG4gICAqIFRoaXMgbWV0aG9kIHVzZXMgYSByZW5kZXItYmFzZWQgYXBwcm9hY2ggdG8gYXZvaWQgcmVxdWlyaW5nIENPUFlfU1JDIHVzYWdlIG9uIHRoZSBzb3VyY2UgdGV4dHVyZS5cbiAgICogSXQgcmVuZGVycyB0aGUgdGV4dHVyZSB0byBhIHRlbXBvcmFyeSByZW5kZXIgdGFyZ2V0IHdpdGggQ09QWV9TUkMsIHRoZW4gcmVhZHMgZnJvbSB0aGF0LlxuICAgKlxuICAgKiBAcGFyYW0gdGV4dHVyZUhhbmRsZSAtIEhhbmRsZSB0byB0aGUgdGV4dHVyZSB0byByZWFkIGZyb21cbiAgICogQHBhcmFtIHggLSBYIG9mZnNldCB0byBzdGFydCByZWFkaW5nIGZyb20gKGN1cnJlbnRseSBpZ25vcmVkLCByZWFkcyBmcm9tIDApXG4gICAqIEBwYXJhbSB5IC0gWSBvZmZzZXQgdG8gc3RhcnQgcmVhZGluZyBmcm9tIChjdXJyZW50bHkgaWdub3JlZCwgcmVhZHMgZnJvbSAwKVxuICAgKiBAcGFyYW0gd2lkdGggLSBXaWR0aCBvZiB0aGUgcmVnaW9uIHRvIHJlYWRcbiAgICogQHBhcmFtIGhlaWdodCAtIEhlaWdodCBvZiB0aGUgcmVnaW9uIHRvIHJlYWRcbiAgICogQHJldHVybnMgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIHBpeGVsIGRhdGEgYXMgYSBVaW50OEFycmF5IGluIFJHQkEgZm9ybWF0XG4gICAqL1xuICBhc3luYyBnZXRQaXhlbERhdGFGcm9tVGV4dHVyZUFzeW5jKFxuICAgIHRleHR1cmVIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlLFxuICAgIF94OiBudW1iZXIsXG4gICAgX3k6IG51bWJlcixcbiAgICB3aWR0aDogbnVtYmVyLFxuICAgIGhlaWdodDogbnVtYmVyXG4gICk6IFByb21pc2U8VWludDhBcnJheT4ge1xuICAgIGNvbnN0IGdwdVRleHR1cmUgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldCh0ZXh0dXJlSGFuZGxlKSBhcyBHUFVUZXh0dXJlO1xuICAgIGlmICghZ3B1VGV4dHVyZSkge1xuICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KDApO1xuICAgIH1cblxuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG5cbiAgICAvLyBDcmVhdGUgc2hhZGVyIG1vZHVsZSBmb3Igc2FtcGxpbmcgMkQgdGV4dHVyZVxuICAgIGNvbnN0IHNoYWRlck1vZHVsZSA9IGdwdURldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuICAgICAgY29kZTogLyogd2dzbCAqLyBgXG4gICAgICAgIHN0cnVjdCBWZXJ0ZXhPdXRwdXQge1xuICAgICAgICAgIEBidWlsdGluKHBvc2l0aW9uKSBwb3NpdGlvbjogdmVjNGYsXG4gICAgICAgICAgQGxvY2F0aW9uKDApIHRleENvb3JkOiB2ZWMyZixcbiAgICAgICAgfTtcblxuICAgICAgICBAdmVydGV4XG4gICAgICAgIGZuIHZlcnRleE1haW4oQGJ1aWx0aW4odmVydGV4X2luZGV4KSB2ZXJ0ZXhJbmRleDogdTMyKSAtPiBWZXJ0ZXhPdXRwdXQge1xuICAgICAgICAgIHZhciBwb3MgPSBhcnJheTx2ZWMyZiwgND4oXG4gICAgICAgICAgICB2ZWMyZigtMS4wLCAtMS4wKSxcbiAgICAgICAgICAgIHZlYzJmKCAxLjAsIC0xLjApLFxuICAgICAgICAgICAgdmVjMmYoLTEuMCwgIDEuMCksXG4gICAgICAgICAgICB2ZWMyZiggMS4wLCAgMS4wKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICB2YXIgb3V0cHV0OiBWZXJ0ZXhPdXRwdXQ7XG4gICAgICAgICAgb3V0cHV0LnBvc2l0aW9uID0gdmVjNGYocG9zW3ZlcnRleEluZGV4XSwgMC4wLCAxLjApO1xuICAgICAgICAgIC8vIEZsaXAgWSBmb3IgY29ycmVjdCBvcmllbnRhdGlvblxuICAgICAgICAgIG91dHB1dC50ZXhDb29yZCA9IHZlYzJmKHBvc1t2ZXJ0ZXhJbmRleF0ueCAqIDAuNSArIDAuNSwgMC41IC0gcG9zW3ZlcnRleEluZGV4XS55ICogMC41KTtcbiAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9XG5cbiAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDApIHZhciBpbnB1dFRleHR1cmU6IHRleHR1cmVfMmQ8ZjMyPjtcbiAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhciBpbnB1dFNhbXBsZXI6IHNhbXBsZXI7XG5cbiAgICAgICAgQGZyYWdtZW50XG4gICAgICAgIGZuIGZyYWdtZW50TWFpbihpbnB1dDogVmVydGV4T3V0cHV0KSAtPiBAbG9jYXRpb24oMCkgdmVjNGYge1xuICAgICAgICAgIHJldHVybiB0ZXh0dXJlU2FtcGxlKGlucHV0VGV4dHVyZSwgaW5wdXRTYW1wbGVyLCBpbnB1dC50ZXhDb29yZCk7XG4gICAgICAgIH1cbiAgICAgIGAsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgcmVuZGVyIHBpcGVsaW5lXG4gICAgY29uc3QgcGlwZWxpbmUgPSBncHVEZXZpY2UuY3JlYXRlUmVuZGVyUGlwZWxpbmUoe1xuICAgICAgbGF5b3V0OiAnYXV0bycsXG4gICAgICB2ZXJ0ZXg6IHtcbiAgICAgICAgbW9kdWxlOiBzaGFkZXJNb2R1bGUsXG4gICAgICAgIGVudHJ5UG9pbnQ6ICd2ZXJ0ZXhNYWluJyxcbiAgICAgIH0sXG4gICAgICBmcmFnbWVudDoge1xuICAgICAgICBtb2R1bGU6IHNoYWRlck1vZHVsZSxcbiAgICAgICAgZW50cnlQb2ludDogJ2ZyYWdtZW50TWFpbicsXG4gICAgICAgIHRhcmdldHM6IFt7IGZvcm1hdDogJ3JnYmE4dW5vcm0nIH1dLFxuICAgICAgfSxcbiAgICAgIHByaW1pdGl2ZToge1xuICAgICAgICB0b3BvbG9neTogJ3RyaWFuZ2xlLXN0cmlwJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgcmVuZGVyIHRhcmdldCB0ZXh0dXJlIHdpdGggQ29weVNyYyB1c2FnZVxuICAgIGNvbnN0IHJlbmRlclRleHR1cmUgPSBncHVEZXZpY2UuY3JlYXRlVGV4dHVyZSh7XG4gICAgICBzaXplOiBbd2lkdGgsIGhlaWdodF0sXG4gICAgICBmb3JtYXQ6ICdyZ2JhOHVub3JtJyxcbiAgICAgIHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQgfCBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9TUkMsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgc2FtcGxlclxuICAgIGNvbnN0IHNhbXBsZXIgPSBncHVEZXZpY2UuY3JlYXRlU2FtcGxlcih7XG4gICAgICBtYWdGaWx0ZXI6ICdsaW5lYXInLFxuICAgICAgbWluRmlsdGVyOiAnbGluZWFyJyxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSB0ZXh0dXJlIHZpZXcgZm9yIHRoZSBpbnB1dCB0ZXh0dXJlXG4gICAgY29uc3QgdGV4dHVyZVZpZXcgPSBncHVUZXh0dXJlLmNyZWF0ZVZpZXcoKTtcblxuICAgIC8vIENyZWF0ZSBiaW5kIGdyb3VwXG4gICAgY29uc3QgYmluZEdyb3VwID0gZ3B1RGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG4gICAgICBsYXlvdXQ6IHBpcGVsaW5lLmdldEJpbmRHcm91cExheW91dCgwKSxcbiAgICAgIGVudHJpZXM6IFtcbiAgICAgICAgeyBiaW5kaW5nOiAwLCByZXNvdXJjZTogdGV4dHVyZVZpZXcgfSxcbiAgICAgICAgeyBiaW5kaW5nOiAxLCByZXNvdXJjZTogc2FtcGxlciB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFJlbmRlclxuICAgIGNvbnN0IGNvbW1hbmRFbmNvZGVyID0gZ3B1RGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG4gICAgY29uc3QgcmVuZGVyUGFzcyA9IGNvbW1hbmRFbmNvZGVyLmJlZ2luUmVuZGVyUGFzcyh7XG4gICAgICBjb2xvckF0dGFjaG1lbnRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB2aWV3OiByZW5kZXJUZXh0dXJlLmNyZWF0ZVZpZXcoKSxcbiAgICAgICAgICBjbGVhclZhbHVlOiB7IHI6IDAsIGc6IDAsIGI6IDAsIGE6IDEgfSxcbiAgICAgICAgICBsb2FkT3A6ICdjbGVhcicsXG4gICAgICAgICAgc3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICByZW5kZXJQYXNzLnNldFBpcGVsaW5lKHBpcGVsaW5lKTtcbiAgICByZW5kZXJQYXNzLnNldEJpbmRHcm91cCgwLCBiaW5kR3JvdXApO1xuICAgIHJlbmRlclBhc3MuZHJhdyg0KTtcbiAgICByZW5kZXJQYXNzLmVuZCgpO1xuXG4gICAgLy8gQ29weSByZW5kZXIgdGV4dHVyZSB0byBidWZmZXJcbiAgICBjb25zdCBieXRlc1BlclJvdyA9IE1hdGguY2VpbCgod2lkdGggKiA0KSAvIDI1NikgKiAyNTY7XG4gICAgY29uc3QgYnVmZmVyID0gZ3B1RGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBzaXplOiBieXRlc1BlclJvdyAqIGhlaWdodCxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCB8IEdQVUJ1ZmZlclVzYWdlLk1BUF9SRUFELFxuICAgIH0pO1xuXG4gICAgY29tbWFuZEVuY29kZXIuY29weVRleHR1cmVUb0J1ZmZlcih7IHRleHR1cmU6IHJlbmRlclRleHR1cmUgfSwgeyBidWZmZXIsIGJ5dGVzUGVyUm93IH0sIHsgd2lkdGgsIGhlaWdodCB9KTtcblxuICAgIGdwdURldmljZS5xdWV1ZS5zdWJtaXQoW2NvbW1hbmRFbmNvZGVyLmZpbmlzaCgpXSk7XG5cbiAgICAvLyBSZWFkIGJhY2sgZGF0YVxuICAgIGF3YWl0IGJ1ZmZlci5tYXBBc3luYyhHUFVNYXBNb2RlLlJFQUQpO1xuICAgIGNvbnN0IGFycmF5QnVmZmVyID0gYnVmZmVyLmdldE1hcHBlZFJhbmdlKCk7XG5cbiAgICBjb25zdCB0ZXh0dXJlRGF0YSA9IG5ldyBVaW50OEFycmF5KHdpZHRoICogaGVpZ2h0ICogNCk7XG4gICAgY29uc3Qgc3JjQXJyYXkgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlcik7XG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xuICAgICAgY29uc3Qgc3JjT2Zmc2V0ID0geSAqIGJ5dGVzUGVyUm93O1xuICAgICAgY29uc3QgZHN0T2Zmc2V0ID0geSAqIHdpZHRoICogNDtcbiAgICAgIHRleHR1cmVEYXRhLnNldChzcmNBcnJheS5zbGljZShzcmNPZmZzZXQsIHNyY09mZnNldCArIHdpZHRoICogNCksIGRzdE9mZnNldCk7XG4gICAgfVxuXG4gICAgYnVmZmVyLnVubWFwKCk7XG5cbiAgICAvLyBDbGVhbnVwXG4gICAgYnVmZmVyLmRlc3Ryb3koKTtcbiAgICByZW5kZXJUZXh0dXJlLmRlc3Ryb3koKTtcblxuICAgIHJldHVybiB0ZXh0dXJlRGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyBwaXhlbCBkYXRhIGZyb20gYSBzcGVjaWZpYyBmYWNlIG9mIGEgY3ViZSB0ZXh0dXJlLlxuICAgKiBVc2VzIGEgc2hhZGVyLWJhc2VkIGFwcHJvYWNoIHRvIHNhbXBsZSB0aGUgY3ViZW1hcCBhbmQgcmVuZGVyIHRvIGEgMkQgdGV4dHVyZSxcbiAgICogdGhlbiBjb3BpZXMgdGhlIHJlc3VsdCB0byBhIGJ1ZmZlciBmb3IgQ1BVIGFjY2Vzcy5cbiAgICpcbiAgICogQHBhcmFtIHRleHR1cmVIYW5kbGUgLSBIYW5kbGUgdG8gdGhlIGN1YmUgdGV4dHVyZVxuICAgKiBAcGFyYW0gd2lkdGggLSBXaWR0aCBvZiB0aGUgZmFjZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSBoZWlnaHQgLSBIZWlnaHQgb2YgdGhlIGZhY2UgdGV4dHVyZVxuICAgKiBAcGFyYW0gZmFjZUluZGV4IC0gSW5kZXggb2YgdGhlIGN1YmUgZmFjZSAoMD0rWCwgMT0tWCwgMj0rWSwgMz0tWSwgND0rWiwgNT0tWilcbiAgICogQHJldHVybnMgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIHBpeGVsIGRhdGEgYXMgYSBVaW50OEFycmF5IChSR0JBIGZvcm1hdClcbiAgICovXG4gIGFzeW5jIGdldEN1YmVUZXh0dXJlUGl4ZWxEYXRhKFxuICAgIHRleHR1cmVIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlLFxuICAgIHdpZHRoOiBudW1iZXIsXG4gICAgaGVpZ2h0OiBudW1iZXIsXG4gICAgZmFjZUluZGV4OiBudW1iZXJcbiAgKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgY29uc3QgZ3B1VGV4dHVyZSA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KHRleHR1cmVIYW5kbGUpIGFzIEdQVVRleHR1cmU7XG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcblxuICAgIC8vIERldGVybWluZSBpZiB0ZXh0dXJlIGlzIEhEUiAoZmxvYXRpbmctcG9pbnQgZm9ybWF0KSBvciBMRFJcbiAgICAvLyBIRFIgdGV4dHVyZXMgbmVlZCB0b25lIG1hcHBpbmcgYW5kIGdhbW1hIGNvcnJlY3Rpb24sIExEUiB0ZXh0dXJlcyBzaG91bGQgcGFzcyB0aHJvdWdoIHVuY2hhbmdlZFxuICAgIGNvbnN0IHRleHR1cmVGb3JtYXQgPSBncHVUZXh0dXJlLmZvcm1hdDtcbiAgICAvLyBIRFIgZm9ybWF0czogZmxvYXRpbmctcG9pbnQgZm9ybWF0cyAocjE2ZmxvYXQsIHJnMTZmbG9hdCwgcmdiYTE2ZmxvYXQsIHIzMmZsb2F0LCByZzMyZmxvYXQsIHJnYmEzMmZsb2F0LCByZzExYjEwdWZsb2F0KVxuICAgIC8vIGFuZCByZ2IxMGEydW5vcm0gd2hpY2ggaGFzIGhpZ2hlciBwcmVjaXNpb24gb2Z0ZW4gdXNlZCBmb3IgSERSLlxuICAgIC8vIE5vdGU6IERvIE5PVCBtYXRjaCBpbnRlZ2VyIGZvcm1hdHMgbGlrZSByZ2JhMTZ1aW50LCByZ2JhMTZzaW50LCByZ2JhMzJ1aW50LCByZ2JhMzJzaW50XG4gICAgY29uc3QgaXNIZHJGb3JtYXQgPSB0ZXh0dXJlRm9ybWF0LmluY2x1ZGVzKCdmbG9hdCcpIHx8IHRleHR1cmVGb3JtYXQgPT09ICdyZ2IxMGEydW5vcm0nO1xuXG4gICAgLy8gQ3JlYXRlIHNoYWRlciBtb2R1bGUgZm9yIHNhbXBsaW5nIGN1YmVtYXBcbiAgICBjb25zdCBzaGFkZXJNb2R1bGUgPSBncHVEZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcbiAgICAgIGNvZGU6IC8qIHdnc2wgKi8gYFxuICAgICAgICBzdHJ1Y3QgVmVydGV4T3V0cHV0IHtcbiAgICAgICAgICBAYnVpbHRpbihwb3NpdGlvbikgcG9zaXRpb246IHZlYzRmLFxuICAgICAgICAgIEBsb2NhdGlvbigwKSB0ZXhDb29yZDogdmVjMmYsXG4gICAgICAgIH07XG5cbiAgICAgICAgQHZlcnRleFxuICAgICAgICBmbiB2ZXJ0ZXhNYWluKEBidWlsdGluKHZlcnRleF9pbmRleCkgdmVydGV4SW5kZXg6IHUzMikgLT4gVmVydGV4T3V0cHV0IHtcbiAgICAgICAgICB2YXIgcG9zID0gYXJyYXk8dmVjMmYsIDQ+KFxuICAgICAgICAgICAgdmVjMmYoLTEuMCwgLTEuMCksXG4gICAgICAgICAgICB2ZWMyZiggMS4wLCAtMS4wKSxcbiAgICAgICAgICAgIHZlYzJmKC0xLjAsICAxLjApLFxuICAgICAgICAgICAgdmVjMmYoIDEuMCwgIDEuMClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgdmFyIG91dHB1dDogVmVydGV4T3V0cHV0O1xuICAgICAgICAgIG91dHB1dC5wb3NpdGlvbiA9IHZlYzRmKHBvc1t2ZXJ0ZXhJbmRleF0sIDAuMCwgMS4wKTtcbiAgICAgICAgICBvdXRwdXQudGV4Q29vcmQgPSBwb3NbdmVydGV4SW5kZXhdICogMC41ICsgMC41O1xuICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBAZ3JvdXAoMCkgQGJpbmRpbmcoMCkgdmFyIGN1YmVtYXBUZXh0dXJlOiB0ZXh0dXJlX2N1YmU8ZjMyPjtcbiAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhciBjdWJlbWFwU2FtcGxlcjogc2FtcGxlcjtcblxuICAgICAgICBzdHJ1Y3QgVW5pZm9ybXMge1xuICAgICAgICAgIGZhY2VJbmRleDogaTMyLFxuICAgICAgICAgIGlzSGRyOiBpMzIsXG4gICAgICAgIH07XG4gICAgICAgIEBncm91cCgwKSBAYmluZGluZygyKSB2YXI8dW5pZm9ybT4gdW5pZm9ybXM6IFVuaWZvcm1zO1xuXG4gICAgICAgIGZuIGdldERpcmVjdGlvbihmYWNlOiBpMzIsIHV2OiB2ZWMyZikgLT4gdmVjM2Yge1xuICAgICAgICAgIHZhciBzdCA9IHV2ICogMi4wIC0gMS4wO1xuICAgICAgICAgIGlmIChmYWNlID09IDApIHsgcmV0dXJuIHZlYzNmKCAxLjAsIC1zdC55LCAtc3QueCk7IH0gLy8gK1hcbiAgICAgICAgICBpZiAoZmFjZSA9PSAxKSB7IHJldHVybiB2ZWMzZigtMS4wLCAtc3QueSwgIHN0LngpOyB9IC8vIC1YXG4gICAgICAgICAgaWYgKGZhY2UgPT0gMikgeyByZXR1cm4gdmVjM2YoIHN0LngsICAxLjAsICBzdC55KTsgfSAvLyArWVxuICAgICAgICAgIGlmIChmYWNlID09IDMpIHsgcmV0dXJuIHZlYzNmKCBzdC54LCAtMS4wLCAtc3QueSk7IH0gLy8gLVlcbiAgICAgICAgICBpZiAoZmFjZSA9PSA0KSB7IHJldHVybiB2ZWMzZiggc3QueCwgLXN0LnksICAxLjApOyB9IC8vICtaXG4gICAgICAgICAgcmV0dXJuIHZlYzNmKC1zdC54LCAtc3QueSwgLTEuMCk7IC8vIC1aXG4gICAgICAgIH1cblxuICAgICAgICBAZnJhZ21lbnRcbiAgICAgICAgZm4gZnJhZ21lbnRNYWluKGlucHV0OiBWZXJ0ZXhPdXRwdXQpIC0+IEBsb2NhdGlvbigwKSB2ZWM0ZiB7XG4gICAgICAgICAgLy8gRmxpcCBZIGNvb3JkaW5hdGUgdG8gbWF0Y2ggV2ViR1BVJ3MgdG9wLWxlZnQgb3JpZ2luIGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgICAgICAgdmFyIGZsaXBwZWRUZXhDb29yZCA9IHZlYzJmKGlucHV0LnRleENvb3JkLngsIDEuMCAtIGlucHV0LnRleENvb3JkLnkpO1xuICAgICAgICAgIHZhciBkaXIgPSBub3JtYWxpemUoZ2V0RGlyZWN0aW9uKHVuaWZvcm1zLmZhY2VJbmRleCwgZmxpcHBlZFRleENvb3JkKSk7XG4gICAgICAgICAgdmFyIGNvbG9yID0gdGV4dHVyZVNhbXBsZShjdWJlbWFwVGV4dHVyZSwgY3ViZW1hcFNhbXBsZXIsIGRpcikucmdiO1xuXG4gICAgICAgICAgLy8gT25seSBhcHBseSB0b25lIG1hcHBpbmcgYW5kIGdhbW1hIGNvcnJlY3Rpb24gZm9yIEhEUiB0ZXh0dXJlc1xuICAgICAgICAgIC8vIExEUiB0ZXh0dXJlcyAoZS5nLiwgcmdiYTh1bm9ybSkgc2hvdWxkIHBhc3MgdGhyb3VnaCB1bmNoYW5nZWRcbiAgICAgICAgICBpZiAodW5pZm9ybXMuaXNIZHIgIT0gMCkge1xuICAgICAgICAgICAgLy8gUmVpbmhhcmQgdG9uZSBtYXBwaW5nXG4gICAgICAgICAgICBjb2xvciA9IGNvbG9yIC8gKDEuMCArIGNvbG9yKTtcblxuICAgICAgICAgICAgLy8gR2FtbWEgY29ycmVjdGlvblxuICAgICAgICAgICAgY29sb3IgPSBwb3coY29sb3IsIHZlYzNmKDEuMCAvIDIuMikpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB2ZWM0Zihjb2xvciwgMS4wKTtcbiAgICAgICAgfVxuICAgICAgYCxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSByZW5kZXIgcGlwZWxpbmVcbiAgICBjb25zdCBwaXBlbGluZSA9IGdwdURldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG4gICAgICBsYXlvdXQ6ICdhdXRvJyxcbiAgICAgIHZlcnRleDoge1xuICAgICAgICBtb2R1bGU6IHNoYWRlck1vZHVsZSxcbiAgICAgICAgZW50cnlQb2ludDogJ3ZlcnRleE1haW4nLFxuICAgICAgfSxcbiAgICAgIGZyYWdtZW50OiB7XG4gICAgICAgIG1vZHVsZTogc2hhZGVyTW9kdWxlLFxuICAgICAgICBlbnRyeVBvaW50OiAnZnJhZ21lbnRNYWluJyxcbiAgICAgICAgdGFyZ2V0czogW3sgZm9ybWF0OiAncmdiYTh1bm9ybScgfV0sXG4gICAgICB9LFxuICAgICAgcHJpbWl0aXZlOiB7XG4gICAgICAgIHRvcG9sb2d5OiAndHJpYW5nbGUtc3RyaXAnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSByZW5kZXIgdGFyZ2V0IHRleHR1cmUgd2l0aCBDb3B5U3JjIHVzYWdlXG4gICAgY29uc3QgcmVuZGVyVGV4dHVyZSA9IGdwdURldmljZS5jcmVhdGVUZXh0dXJlKHtcbiAgICAgIHNpemU6IFt3aWR0aCwgaGVpZ2h0XSxcbiAgICAgIGZvcm1hdDogJ3JnYmE4dW5vcm0nLFxuICAgICAgdXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX1NSQyxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBzYW1wbGVyXG4gICAgY29uc3Qgc2FtcGxlciA9IGdwdURldmljZS5jcmVhdGVTYW1wbGVyKHtcbiAgICAgIG1hZ0ZpbHRlcjogJ2xpbmVhcicsXG4gICAgICBtaW5GaWx0ZXI6ICdsaW5lYXInLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHVuaWZvcm0gYnVmZmVyIGZvciBmYWNlIGluZGV4IGFuZCBIRFIgZmxhZ1xuICAgIGNvbnN0IHVuaWZvcm1CdWZmZXIgPSBncHVEZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIHNpemU6IDE2LCAvLyBBbGlnbiB0byAxNiBieXRlcyAoMiBpMzIgdmFsdWVzID0gOCBieXRlcywgcGFkZGVkIHRvIDE2KVxuICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcbiAgICB9KTtcbiAgICBncHVEZXZpY2UucXVldWUud3JpdGVCdWZmZXIodW5pZm9ybUJ1ZmZlciwgMCwgbmV3IEludDMyQXJyYXkoW2ZhY2VJbmRleCwgaXNIZHJGb3JtYXQgPyAxIDogMF0pKTtcblxuICAgIC8vIENyZWF0ZSB0ZXh0dXJlIHZpZXcgZm9yIGN1YmVtYXBcbiAgICBjb25zdCBjdWJlVGV4dHVyZVZpZXcgPSBncHVUZXh0dXJlLmNyZWF0ZVZpZXcoe1xuICAgICAgZGltZW5zaW9uOiAnY3ViZScsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYmluZCBncm91cFxuICAgIGNvbnN0IGJpbmRHcm91cCA9IGdwdURldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xuICAgICAgbGF5b3V0OiBwaXBlbGluZS5nZXRCaW5kR3JvdXBMYXlvdXQoMCksXG4gICAgICBlbnRyaWVzOiBbXG4gICAgICAgIHsgYmluZGluZzogMCwgcmVzb3VyY2U6IGN1YmVUZXh0dXJlVmlldyB9LFxuICAgICAgICB7IGJpbmRpbmc6IDEsIHJlc291cmNlOiBzYW1wbGVyIH0sXG4gICAgICAgIHsgYmluZGluZzogMiwgcmVzb3VyY2U6IHsgYnVmZmVyOiB1bmlmb3JtQnVmZmVyIH0gfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBSZW5kZXJcbiAgICBjb25zdCBjb21tYW5kRW5jb2RlciA9IGdwdURldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuICAgIGNvbnN0IHJlbmRlclBhc3MgPSBjb21tYW5kRW5jb2Rlci5iZWdpblJlbmRlclBhc3Moe1xuICAgICAgY29sb3JBdHRhY2htZW50czogW1xuICAgICAgICB7XG4gICAgICAgICAgdmlldzogcmVuZGVyVGV4dHVyZS5jcmVhdGVWaWV3KCksXG4gICAgICAgICAgY2xlYXJWYWx1ZTogeyByOiAwLCBnOiAwLCBiOiAwLCBhOiAxIH0sXG4gICAgICAgICAgbG9hZE9wOiAnY2xlYXInLFxuICAgICAgICAgIHN0b3JlT3A6ICdzdG9yZScsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgcmVuZGVyUGFzcy5zZXRQaXBlbGluZShwaXBlbGluZSk7XG4gICAgcmVuZGVyUGFzcy5zZXRCaW5kR3JvdXAoMCwgYmluZEdyb3VwKTtcbiAgICByZW5kZXJQYXNzLmRyYXcoNCk7XG4gICAgcmVuZGVyUGFzcy5lbmQoKTtcblxuICAgIC8vIENvcHkgcmVuZGVyIHRleHR1cmUgdG8gYnVmZmVyXG4gICAgY29uc3QgYnl0ZXNQZXJSb3cgPSBNYXRoLmNlaWwoKHdpZHRoICogNCkgLyAyNTYpICogMjU2O1xuICAgIGNvbnN0IGJ1ZmZlciA9IGdwdURldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgc2l6ZTogYnl0ZXNQZXJSb3cgKiBoZWlnaHQsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QgfCBHUFVCdWZmZXJVc2FnZS5NQVBfUkVBRCxcbiAgICB9KTtcblxuICAgIGNvbW1hbmRFbmNvZGVyLmNvcHlUZXh0dXJlVG9CdWZmZXIoeyB0ZXh0dXJlOiByZW5kZXJUZXh0dXJlIH0sIHsgYnVmZmVyLCBieXRlc1BlclJvdyB9LCB7IHdpZHRoLCBoZWlnaHQgfSk7XG5cbiAgICBncHVEZXZpY2UucXVldWUuc3VibWl0KFtjb21tYW5kRW5jb2Rlci5maW5pc2goKV0pO1xuXG4gICAgLy8gUmVhZCBiYWNrIGRhdGFcbiAgICBhd2FpdCBidWZmZXIubWFwQXN5bmMoR1BVTWFwTW9kZS5SRUFEKTtcbiAgICBjb25zdCBhcnJheUJ1ZmZlciA9IGJ1ZmZlci5nZXRNYXBwZWRSYW5nZSgpO1xuXG4gICAgY29uc3QgdGV4dHVyZURhdGEgPSBuZXcgVWludDhBcnJheSh3aWR0aCAqIGhlaWdodCAqIDQpO1xuICAgIGNvbnN0IHNyY0FycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpO1xuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcbiAgICAgIGNvbnN0IHNyY09mZnNldCA9IHkgKiBieXRlc1BlclJvdztcbiAgICAgIGNvbnN0IGRzdE9mZnNldCA9IHkgKiB3aWR0aCAqIDQ7XG4gICAgICB0ZXh0dXJlRGF0YS5zZXQoc3JjQXJyYXkuc2xpY2Uoc3JjT2Zmc2V0LCBzcmNPZmZzZXQgKyB3aWR0aCAqIDQpLCBkc3RPZmZzZXQpO1xuICAgIH1cblxuICAgIGJ1ZmZlci51bm1hcCgpO1xuXG4gICAgLy8gQ2xlYW51cFxuICAgIGJ1ZmZlci5kZXN0cm95KCk7XG4gICAgdW5pZm9ybUJ1ZmZlci5kZXN0cm95KCk7XG4gICAgcmVuZGVyVGV4dHVyZS5kZXN0cm95KCk7XG5cbiAgICByZXR1cm4gdGV4dHVyZURhdGE7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIG1pcG1hcHMgZm9yIGEgdGV4dHVyZSB1c2luZyByZW5kZXIgcGFzc2VzIChpbmNsdWRpbmcgQ3ViZU1hcCBzdXBwb3J0KS5cbiAgICogVGhpcyBpcyBhbiBvcHRpbWl6ZWQgbWV0aG9kIGFkYXB0ZWQgZnJvbSBXZWJHUFUgYmVzdCBwcmFjdGljZXMgdGhhdCB1c2VzXG4gICAqIGEgY3VzdG9tIHNoYWRlciB0byBnZW5lcmF0ZSBlYWNoIG1pcG1hcCBsZXZlbCBmcm9tIHRoZSBwcmV2aW91cyBvbmUuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIEFkYXB0ZWQgZnJvbTogaHR0cHM6Ly90b2ppLmRldi93ZWJncHUtYmVzdC1wcmFjdGljZXMvaW1nLXRleHR1cmVzI2dlbmVyYXRpbmctbWlwbWFwc1xuICAgKiBAcGFyYW0gdGV4dHVyZSAtIFRoZSBHUFUgdGV4dHVyZSB0byBnZW5lcmF0ZSBtaXBtYXBzIGZvclxuICAgKiBAcGFyYW0gdGV4dHVyZURlc2NyaXB0b3IgLSBEZXNjcmlwdG9yIGNvbnRhaW5pbmcgdGV4dHVyZSBmb3JtYXQgYW5kIGRpbWVuc2lvbnNcbiAgICovXG4gIGdlbmVyYXRlTWlwbWFwcyh0ZXh0dXJlOiBHUFVUZXh0dXJlLCB0ZXh0dXJlRGVzY3JpcHRvcjogR1BVVGV4dHVyZURlc2NyaXB0b3IpIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuXG4gICAgaWYgKHRoaXMuX19nZW5lcmF0ZU1pcG1hcHNTaGFkZXJNb2R1bGUgPT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2dlbmVyYXRlTWlwbWFwc1NoYWRlck1vZHVsZSA9IGdwdURldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuICAgICAgICBjb2RlOiAvKiB3Z3NsICovIGBcbiAgICAgICAgICB2YXI8cHJpdmF0ZT4gcG9zIDogYXJyYXk8dmVjMmYsIDQ+ID0gYXJyYXk8dmVjMmYsIDQ+KFxuICAgICAgICAgICAgdmVjMmYoLTEsIDEpLCB2ZWMyZigxLCAxKSxcbiAgICAgICAgICAgIHZlYzJmKC0xLCAtMSksIHZlYzJmKDEsIC0xKSk7XG5cbiAgICAgICAgICBzdHJ1Y3QgVmVydGV4T3V0cHV0IHtcbiAgICAgICAgICAgIEBidWlsdGluKHBvc2l0aW9uKSBwb3NpdGlvbiA6IHZlYzRmLFxuICAgICAgICAgICAgQGxvY2F0aW9uKDApIHRleENvb3JkIDogdmVjMmYsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIEB2ZXJ0ZXhcbiAgICAgICAgICBmbiB2ZXJ0ZXhNYWluKEBidWlsdGluKHZlcnRleF9pbmRleCkgdmVydGV4SW5kZXggOiB1MzIpIC0+IFZlcnRleE91dHB1dCB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0IDogVmVydGV4T3V0cHV0O1xuICAgICAgICAgICAgb3V0cHV0LnRleENvb3JkID0gcG9zW3ZlcnRleEluZGV4XSAqIHZlYzJmKDAuNSwgLTAuNSkgKyB2ZWMyZigwLjUpO1xuICAgICAgICAgICAgb3V0cHV0LnBvc2l0aW9uID0gdmVjNGYocG9zW3ZlcnRleEluZGV4XSwgMCwgMSk7XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIEBncm91cCgwKSBAYmluZGluZygwKSB2YXIgaW1nU2FtcGxlciA6IHNhbXBsZXI7XG4gICAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhciBpbWcgOiB0ZXh0dXJlXzJkPGYzMj47XG5cbiAgICAgICAgICBAZnJhZ21lbnRcbiAgICAgICAgICBmbiBmcmFnbWVudE1haW4oQGxvY2F0aW9uKDApIHRleENvb3JkIDogdmVjMmYpIC0+IEBsb2NhdGlvbigwKSB2ZWM0ZiB7XG4gICAgICAgICAgICByZXR1cm4gdGV4dHVyZVNhbXBsZShpbWcsIGltZ1NhbXBsZXIsIHRleENvb3JkKTtcbiAgICAgICAgICB9XG4gICAgICAgIGAsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2dlbmVyYXRlTWlwbWFwc1BpcGVsaW5lICE9IG51bGwgJiYgdGV4dHVyZURlc2NyaXB0b3IuZm9ybWF0ICE9PSB0aGlzLl9fZ2VuZXJhdGVNaXBtYXBzRm9ybWF0KSB7XG4gICAgICB0aGlzLl9fZ2VuZXJhdGVNaXBtYXBzUGlwZWxpbmUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fZ2VuZXJhdGVNaXBtYXBzUGlwZWxpbmUgPT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2dlbmVyYXRlTWlwbWFwc0JpbmRHcm91cExheW91dCA9IGdwdURldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuICAgICAgICBlbnRyaWVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYmluZGluZzogMCxcbiAgICAgICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5ULFxuICAgICAgICAgICAgc2FtcGxlcjoge1xuICAgICAgICAgICAgICB0eXBlOiAnZmlsdGVyaW5nJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBiaW5kaW5nOiAxLFxuICAgICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQsXG4gICAgICAgICAgICB0ZXh0dXJlOiB7XG4gICAgICAgICAgICAgIHZpZXdEaW1lbnNpb246ICcyZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHBpcGVsaW5lTGF5b3V0ID0gZ3B1RGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcbiAgICAgICAgYmluZEdyb3VwTGF5b3V0czogW3RoaXMuX19nZW5lcmF0ZU1pcG1hcHNCaW5kR3JvdXBMYXlvdXRdLFxuICAgICAgfSk7XG4gICAgICB0aGlzLl9fZ2VuZXJhdGVNaXBtYXBzUGlwZWxpbmUgPSBncHVEZXZpY2UuY3JlYXRlUmVuZGVyUGlwZWxpbmUoe1xuICAgICAgICBsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuICAgICAgICB2ZXJ0ZXg6IHtcbiAgICAgICAgICBtb2R1bGU6IHRoaXMuX19nZW5lcmF0ZU1pcG1hcHNTaGFkZXJNb2R1bGUsXG4gICAgICAgICAgZW50cnlQb2ludDogJ3ZlcnRleE1haW4nLFxuICAgICAgICB9LFxuICAgICAgICBmcmFnbWVudDoge1xuICAgICAgICAgIG1vZHVsZTogdGhpcy5fX2dlbmVyYXRlTWlwbWFwc1NoYWRlck1vZHVsZSxcbiAgICAgICAgICBlbnRyeVBvaW50OiAnZnJhZ21lbnRNYWluJyxcbiAgICAgICAgICB0YXJnZXRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGZvcm1hdDogdGV4dHVyZURlc2NyaXB0b3IuZm9ybWF0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBwcmltaXRpdmU6IHtcbiAgICAgICAgICB0b3BvbG9neTogJ3RyaWFuZ2xlLXN0cmlwJyxcbiAgICAgICAgICBzdHJpcEluZGV4Rm9ybWF0OiAndWludDMyJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fX2dlbmVyYXRlTWlwbWFwc0Zvcm1hdCA9IHRleHR1cmVEZXNjcmlwdG9yLmZvcm1hdDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2dlbmVyYXRlTWlwbWFwc1NhbXBsZXIgPT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2dlbmVyYXRlTWlwbWFwc1NhbXBsZXIgPSBncHVEZXZpY2UuY3JlYXRlU2FtcGxlcih7IG1pbkZpbHRlcjogJ2xpbmVhcicgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2ZsdXNoUmVuZGVyUGFzc1dvcmsoKTtcbiAgICBjb25zdCBpc0N1YmVtYXAgPSB0ZXh0dXJlLmRpbWVuc2lvbiA9PT0gJzJkJyAmJiB0ZXh0dXJlLmRlcHRoT3JBcnJheUxheWVycyA9PT0gNjtcbiAgICBjb25zdCBsYXllckNvdW50ID0gaXNDdWJlbWFwID8gNiA6IDE7XG5cbiAgICBmb3IgKGxldCBsYXllciA9IDA7IGxheWVyIDwgbGF5ZXJDb3VudDsgKytsYXllcikge1xuICAgICAgY29uc3Qgc3JjVGV4dHVyZVZpZXdzTWFwID0gdGhpcy5fX3NyY1RleHR1cmVWaWV3c0ZvckdlbmVyYXRpbmdNaXBtYXBzLmdldCh0ZXh0dXJlKTtcbiAgICAgIGlmIChzcmNUZXh0dXJlVmlld3NNYXAgPT0gbnVsbCB8fCBzcmNUZXh0dXJlVmlld3NNYXBbbGF5ZXJdID09IG51bGwpIHtcbiAgICAgICAgY29uc3Qgc3JjVmlldyA9IHRleHR1cmUuY3JlYXRlVmlldyh7XG4gICAgICAgICAgZGltZW5zaW9uOiAnMmQnLFxuICAgICAgICAgIGJhc2VNaXBMZXZlbDogMCxcbiAgICAgICAgICBtaXBMZXZlbENvdW50OiAxLFxuICAgICAgICAgIGJhc2VBcnJheUxheWVyOiBsYXllcixcbiAgICAgICAgICBhcnJheUxheWVyQ291bnQ6IDEsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoc3JjVGV4dHVyZVZpZXdzTWFwID09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLl9fc3JjVGV4dHVyZVZpZXdzRm9yR2VuZXJhdGluZ01pcG1hcHMuc2V0KHRleHR1cmUsIFtdKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9fc3JjVGV4dHVyZVZpZXdzRm9yR2VuZXJhdGluZ01pcG1hcHMuZ2V0KHRleHR1cmUpIVtsYXllcl0gPSBzcmNWaWV3O1xuICAgICAgfVxuICAgICAgbGV0IHNyY1ZpZXcgPSB0aGlzLl9fc3JjVGV4dHVyZVZpZXdzRm9yR2VuZXJhdGluZ01pcG1hcHMuZ2V0KHRleHR1cmUpIVtsYXllcl07XG5cbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGV4dHVyZURlc2NyaXB0b3IubWlwTGV2ZWxDb3VudCE7ICsraSkge1xuICAgICAgICBjb25zdCBkc3RUZXh0dXJlVmlld3NNYXAgPSB0aGlzLl9fZHN0VGV4dHVyZVZpZXdzRm9yR2VuZXJhdGluZ01pcG1hcHMuZ2V0KHRleHR1cmUpO1xuICAgICAgICBpZiAoZHN0VGV4dHVyZVZpZXdzTWFwID09IG51bGwgfHwgZHN0VGV4dHVyZVZpZXdzTWFwW2xheWVyXSA9PSBudWxsIHx8IGRzdFRleHR1cmVWaWV3c01hcFtsYXllcl1baV0gPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGRzdFZpZXcgPSB0ZXh0dXJlLmNyZWF0ZVZpZXcoe1xuICAgICAgICAgICAgZGltZW5zaW9uOiAnMmQnLFxuICAgICAgICAgICAgYmFzZU1pcExldmVsOiBpLFxuICAgICAgICAgICAgbWlwTGV2ZWxDb3VudDogMSxcbiAgICAgICAgICAgIGJhc2VBcnJheUxheWVyOiBsYXllcixcbiAgICAgICAgICAgIGFycmF5TGF5ZXJDb3VudDogMSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChkc3RUZXh0dXJlVmlld3NNYXAgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fX2RzdFRleHR1cmVWaWV3c0ZvckdlbmVyYXRpbmdNaXBtYXBzLnNldCh0ZXh0dXJlLCBbXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLl9fZHN0VGV4dHVyZVZpZXdzRm9yR2VuZXJhdGluZ01pcG1hcHMuZ2V0KHRleHR1cmUpIVtsYXllcl0gPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fX2RzdFRleHR1cmVWaWV3c0ZvckdlbmVyYXRpbmdNaXBtYXBzLmdldCh0ZXh0dXJlKSFbbGF5ZXJdID0gW107XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX19kc3RUZXh0dXJlVmlld3NGb3JHZW5lcmF0aW5nTWlwbWFwcy5nZXQodGV4dHVyZSkhW2xheWVyXVtpXSA9IGRzdFZpZXc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZHN0VmlldyA9IHRoaXMuX19kc3RUZXh0dXJlVmlld3NGb3JHZW5lcmF0aW5nTWlwbWFwcy5nZXQodGV4dHVyZSkhW2xheWVyXVtpXTtcblxuICAgICAgICBjb25zdCBwYXNzRW5jb2RlciA9IHRoaXMuX19jb21tYW5kRW5jb2RlciEuYmVnaW5SZW5kZXJQYXNzKHtcbiAgICAgICAgICBjb2xvckF0dGFjaG1lbnRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZpZXc6IGRzdFZpZXcsXG4gICAgICAgICAgICAgIGxvYWRPcDogJ2xvYWQnLFxuICAgICAgICAgICAgICBzdG9yZU9wOiAnc3RvcmUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBiaW5kR3JvdXBzTWFwID0gdGhpcy5fX2JpbmRHcm91cHNGb3JHZW5lcmF0aW5nTWlwbWFwcy5nZXQodGV4dHVyZSk7XG4gICAgICAgIGlmIChiaW5kR3JvdXBzTWFwID09IG51bGwgfHwgYmluZEdyb3Vwc01hcFtsYXllcl0gPT0gbnVsbCB8fCBiaW5kR3JvdXBzTWFwW2xheWVyXVtpXSA9PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgYmluZEdyb3VwID0gZ3B1RGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG4gICAgICAgICAgICBsYXlvdXQ6IHRoaXMuX19nZW5lcmF0ZU1pcG1hcHNCaW5kR3JvdXBMYXlvdXQhLFxuICAgICAgICAgICAgZW50cmllczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYmluZGluZzogMCxcbiAgICAgICAgICAgICAgICByZXNvdXJjZTogdGhpcy5fX2dlbmVyYXRlTWlwbWFwc1NhbXBsZXIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBiaW5kaW5nOiAxLFxuICAgICAgICAgICAgICAgIHJlc291cmNlOiBzcmNWaWV3LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChiaW5kR3JvdXBzTWFwID09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX19iaW5kR3JvdXBzRm9yR2VuZXJhdGluZ01pcG1hcHMuc2V0KHRleHR1cmUsIFtdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuX19iaW5kR3JvdXBzRm9yR2VuZXJhdGluZ01pcG1hcHMuZ2V0KHRleHR1cmUpIVtsYXllcl0gPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fX2JpbmRHcm91cHNGb3JHZW5lcmF0aW5nTWlwbWFwcy5nZXQodGV4dHVyZSkhW2xheWVyXSA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9fYmluZEdyb3Vwc0ZvckdlbmVyYXRpbmdNaXBtYXBzLmdldCh0ZXh0dXJlKSFbbGF5ZXJdW2ldID0gYmluZEdyb3VwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJpbmRHcm91cCA9IHRoaXMuX19iaW5kR3JvdXBzRm9yR2VuZXJhdGluZ01pcG1hcHMuZ2V0KHRleHR1cmUpIVtsYXllcl1baV07XG4gICAgICAgIC8vIFJlbmRlclxuICAgICAgICBwYXNzRW5jb2Rlci5zZXRQaXBlbGluZSh0aGlzLl9fZ2VuZXJhdGVNaXBtYXBzUGlwZWxpbmUpO1xuICAgICAgICBwYXNzRW5jb2Rlci5zZXRCaW5kR3JvdXAoMCwgYmluZEdyb3VwKTtcbiAgICAgICAgcGFzc0VuY29kZXIuZHJhdyg0KTtcbiAgICAgICAgcGFzc0VuY29kZXIuZW5kKCk7XG5cbiAgICAgICAgc3JjVmlldyA9IGRzdFZpZXc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB0ZXh0dXJlIHNhbXBsZXIgd2l0aCB0aGUgc3BlY2lmaWVkIGZpbHRlcmluZyBhbmQgd3JhcHBpbmcgcGFyYW1ldGVycy5cbiAgICogVGhlIHNhbXBsZXIgZGVmaW5lcyBob3cgdGV4dHVyZXMgYXJlIGZpbHRlcmVkIGFuZCB3cmFwcGVkIHdoZW4gYWNjZXNzZWQgaW4gc2hhZGVycy5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB0aGUgc2FtcGxlclxuICAgKiBAcGFyYW0gcGFyYW1zLm1hZ0ZpbHRlciAtIE1hZ25pZmljYXRpb24gZmlsdGVyIG1vZGVcbiAgICogQHBhcmFtIHBhcmFtcy5taW5GaWx0ZXIgLSBNaW5pZmljYXRpb24gZmlsdGVyIG1vZGVcbiAgICogQHBhcmFtIHBhcmFtcy53cmFwUyAtIFdyYXBwaW5nIG1vZGUgZm9yIFMgKFUpIHRleHR1cmUgY29vcmRpbmF0ZVxuICAgKiBAcGFyYW0gcGFyYW1zLndyYXBUIC0gV3JhcHBpbmcgbW9kZSBmb3IgVCAoVikgdGV4dHVyZSBjb29yZGluYXRlXG4gICAqIEBwYXJhbSBwYXJhbXMud3JhcFIgLSBXcmFwcGluZyBtb2RlIGZvciBSIChXKSB0ZXh0dXJlIGNvb3JkaW5hdGVcbiAgICogQHBhcmFtIHBhcmFtcy5hbmlzb3Ryb3B5IC0gV2hldGhlciB0byBlbmFibGUgYW5pc290cm9waWMgZmlsdGVyaW5nXG4gICAqIEByZXR1cm5zIEhhbmRsZSB0byB0aGUgY3JlYXRlZCBzYW1wbGVyIHJlc291cmNlXG4gICAqL1xuICBjcmVhdGVUZXh0dXJlU2FtcGxlcih7XG4gICAgbWFnRmlsdGVyLFxuICAgIG1pbkZpbHRlcixcbiAgICB3cmFwUyxcbiAgICB3cmFwVCxcbiAgICB3cmFwUixcbiAgICBhbmlzb3Ryb3B5LFxuICB9OiB7XG4gICAgbWFnRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyRW51bTtcbiAgICBtaW5GaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICAgIHdyYXBTOiBUZXh0dXJlUGFyYW1ldGVyRW51bTtcbiAgICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlckVudW07XG4gICAgd3JhcFI6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICAgIGFuaXNvdHJvcHk6IGJvb2xlYW47XG4gIH0pOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSB7XG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcbiAgICBjb25zdCBtYXhBbmlzb3Ryb3B5ID0gYW5pc290cm9weSA/IDQgOiAxO1xuXG4gICAgY29uc3QgZGVzYyA9IHtcbiAgICAgIG1hZ0ZpbHRlcjogbWFnRmlsdGVyLndlYmdwdSBhcyBHUFVGaWx0ZXJNb2RlLFxuICAgICAgbWluRmlsdGVyOiBtaW5GaWx0ZXIud2ViZ3B1IGFzIEdQVUZpbHRlck1vZGUsXG4gICAgICBtaXBtYXBGaWx0ZXI6XG4gICAgICAgIG1pbkZpbHRlciA9PT0gVGV4dHVyZVBhcmFtZXRlci5MaW5lYXJNaXBtYXBMaW5lYXIgfHwgbWluRmlsdGVyID09PSBUZXh0dXJlUGFyYW1ldGVyLk5lYXJlc3RNaXBtYXBMaW5lYXJcbiAgICAgICAgICA/ICdsaW5lYXInXG4gICAgICAgICAgOiAnbmVhcmVzdCcsXG4gICAgICBhZGRyZXNzTW9kZVU6IHdyYXBTLndlYmdwdSBhcyBHUFVBZGRyZXNzTW9kZSxcbiAgICAgIGFkZHJlc3NNb2RlVjogd3JhcFQud2ViZ3B1IGFzIEdQVUFkZHJlc3NNb2RlLFxuICAgICAgYWRkcmVzc01vZGVXOiB3cmFwUi53ZWJncHUgYXMgR1BVQWRkcmVzc01vZGUsXG4gICAgICAvLyBsb2RNaW5DbGFtcDogMCxcbiAgICAgIC8vIGxvZE1heENsYW1wOiAzMixcbiAgICAgIG1heEFuaXNvdHJvcHksXG4gICAgfSBhcyBHUFVTYW1wbGVyRGVzY3JpcHRvcjtcblxuICAgIGlmIChkZXNjLm1hZ0ZpbHRlciA9PT0gJ25lYXJlc3QnIHx8IGRlc2MubWluRmlsdGVyID09PSAnbmVhcmVzdCcgfHwgZGVzYy5taXBtYXBGaWx0ZXIgPT09ICduZWFyZXN0Jykge1xuICAgICAgZGVzYy5tYXhBbmlzb3Ryb3B5ID0gMTtcbiAgICB9XG5cbiAgICBjb25zdCBzYW1wbGVyID0gZ3B1RGV2aWNlLmNyZWF0ZVNhbXBsZXIoZGVzYyk7XG5cbiAgICBjb25zdCBzYW1wbGVySGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2Uoc2FtcGxlcik7XG5cbiAgICByZXR1cm4gc2FtcGxlckhhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgV2ViR1BVIHZlcnRleCBidWZmZXIgZnJvbSBhbiBhY2Nlc3NvciBjb250YWluaW5nIHZlcnRleCBkYXRhLlxuICAgKiBUaGUgYnVmZmVyIGlzIGNyZWF0ZWQgd2l0aCB0aGUgYXBwcm9wcmlhdGUgc2l6ZSBhbmQgdGhlIGRhdGEgaXMgdXBsb2FkZWQgaW1tZWRpYXRlbHkuXG4gICAqXG4gICAqIEBwYXJhbSBhY2Nlc3NvciAtIEFjY2Vzc29yIGNvbnRhaW5pbmcgdGhlIHZlcnRleCBkYXRhIHRvIHVwbG9hZFxuICAgKiBAcmV0dXJucyBIYW5kbGUgdG8gdGhlIGNyZWF0ZWQgdmVydGV4IGJ1ZmZlclxuICAgKi9cbiAgcHVibGljIGNyZWF0ZVZlcnRleEJ1ZmZlcihhY2Nlc3NvcjogQWNjZXNzb3IpOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSB7XG4gICAgcmV0dXJuIHRoaXMuX19hbGxvY2F0ZVZlcnRleEJ1ZmZlclJhbmdlKGFjY2Vzc29yLmdldFVpbnQ4QXJyYXkoKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFdlYkdQVSB2ZXJ0ZXggYnVmZmVyIGZyb20gYSB0eXBlZCBhcnJheS5cbiAgICogVGhpcyBpcyBhIG1vcmUgZGlyZWN0IG1ldGhvZCB3aGVuIHlvdSBoYXZlIHJhdyB0eXBlZCBhcnJheSBkYXRhLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZWRBcnJheSAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHZlcnRleCBkYXRhXG4gICAqIEByZXR1cm5zIEhhbmRsZSB0byB0aGUgY3JlYXRlZCB2ZXJ0ZXggYnVmZmVyIHJlc291cmNlXG4gICAqL1xuICBjcmVhdGVWZXJ0ZXhCdWZmZXJGcm9tVHlwZWRBcnJheSh0eXBlZEFycmF5OiBUeXBlZEFycmF5KTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIHJldHVybiB0aGlzLl9fYWxsb2NhdGVWZXJ0ZXhCdWZmZXJSYW5nZShcbiAgICAgIG5ldyBVaW50OEFycmF5KHR5cGVkQXJyYXkuYnVmZmVyLCB0eXBlZEFycmF5LmJ5dGVPZmZzZXQsIHR5cGVkQXJyYXkuYnl0ZUxlbmd0aClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcnRleCBmb3JtYXRzIHRoYXQgbm9ybWFsaXplIGludGVnZXIgZGF0YSB0byBmbG9hdHMgaW5zaWRlIHRoZSBHUFUuXG4gICAqIFdlYkdQVSBvbmx5IHByb3ZpZGVzIHRoZXNlIGZvcm1hdHMgZm9yIHR3byBvciBmb3VyIGNvbXBvbmVudHMuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX25vcm1hbGl6ZWRWZXJ0ZXhGb3JtYXRzID0gbmV3IFNldDxzdHJpbmc+KFtcbiAgICAndW5vcm04eDInLFxuICAgICd1bm9ybTh4NCcsXG4gICAgJ3Nub3JtOHgyJyxcbiAgICAnc25vcm04eDQnLFxuICAgICd1bm9ybTE2eDInLFxuICAgICd1bm9ybTE2eDQnLFxuICAgICdzbm9ybTE2eDInLFxuICAgICdzbm9ybTE2eDQnLFxuICBdKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgV2ViR1BVIHZlcnRleCBmb3JtYXQgZm9yIGFuIGF0dHJpYnV0ZSBhY2Nlc3Nvci5cbiAgICogQW4gYWNjZXNzb3Igd2l0aCB0aGUgbm9ybWFsaXplZCBmbGFnIHVzZXMgYSB1bm9ybS9zbm9ybSBmb3JtYXQgc28gdGhhdCB0aGUgR1BVIGNvbnZlcnRzXG4gICAqIGl0cyBpbnRlZ2VyIGRhdGEgdG8gdGhlIFswLCAxXSAvIFstMSwgMV0gcmFuZ2UgYmVmb3JlIHRoZSB2ZXJ0ZXggc2hhZGVyIHJlYWRzIGl0LlxuICAgKlxuICAgKiBAcGFyYW0gYWNjZXNzb3IgLSBBY2Nlc3NvciBvZiB0aGUgdmVydGV4IGF0dHJpYnV0ZVxuICAgKiBAcmV0dXJucyBUaGUgdmVydGV4IGZvcm1hdCB0byBkZWNsYXJlIGluIHRoZSBwaXBlbGluZSBsYXlvdXRcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0VmVydGV4Rm9ybWF0KGFjY2Vzc29yOiBBY2Nlc3Nvcik6IEdQVVZlcnRleEZvcm1hdCB7XG4gICAgY29uc3QgY29tcG9uZW50VHlwZSA9IGFjY2Vzc29yLmNvbXBvbmVudFR5cGU7XG4gICAgY29uc3QgY29tcG9zaXRpb25UeXBlID0gYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlO1xuICAgIGlmIChhY2Nlc3Nvci5ub3JtYWxpemVkKSB7XG4gICAgICBsZXQgcHJlZml4ID0gJyc7XG4gICAgICBpZiAoY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEJ5dGUpIHtcbiAgICAgICAgcHJlZml4ID0gJ3Vub3JtOCc7XG4gICAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQnl0ZSkge1xuICAgICAgICBwcmVmaXggPSAnc25vcm04JztcbiAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZFNob3J0KSB7XG4gICAgICAgIHByZWZpeCA9ICd1bm9ybTE2JztcbiAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5TaG9ydCkge1xuICAgICAgICBwcmVmaXggPSAnc25vcm0xNic7XG4gICAgICB9XG4gICAgICBjb25zdCBub3JtYWxpemVkRm9ybWF0ID0gcHJlZml4ICsgY29tcG9zaXRpb25UeXBlLndlYmdwdTtcbiAgICAgIGlmIChwcmVmaXggIT09ICcnICYmIFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fX25vcm1hbGl6ZWRWZXJ0ZXhGb3JtYXRzLmhhcyhub3JtYWxpemVkRm9ybWF0KSkge1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplZEZvcm1hdCBhcyBHUFVWZXJ0ZXhGb3JtYXQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAoY29tcG9uZW50VHlwZS53ZWJncHUgKyBjb21wb3NpdGlvblR5cGUud2ViZ3B1KSBhcyBHUFVWZXJ0ZXhGb3JtYXQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFdlYkdQVSBpbmRleCBidWZmZXIgZnJvbSBhbiBhY2Nlc3NvciBjb250YWluaW5nIGluZGV4IGRhdGEuXG4gICAqIEF1dG9tYXRpY2FsbHkgY29udmVydHMgVW5zaWduZWRCeXRlIGluZGljZXMgdG8gVW5zaWduZWRTaG9ydCBzaW5jZSBXZWJHUFVcbiAgICogZG9lc24ndCBzdXBwb3J0IDgtYml0IGluZGV4IGJ1ZmZlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBhY2Nlc3NvciAtIEFjY2Vzc29yIGNvbnRhaW5pbmcgdGhlIGluZGV4IGRhdGEgdG8gdXBsb2FkXG4gICAqIEByZXR1cm5zIEhhbmRsZSB0byB0aGUgY3JlYXRlZCBpbmRleCBidWZmZXIgcmVzb3VyY2VcbiAgICovXG4gIHB1YmxpYyBjcmVhdGVJbmRleEJ1ZmZlcihhY2Nlc3NvcjogQWNjZXNzb3IpOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSB7XG4gICAgcmV0dXJuIHRoaXMuX19hbGxvY2F0ZVZlcnRleEJ1ZmZlclJhbmdlKFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fX2dldEluZGV4RGF0YShhY2Nlc3NvcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGluZGV4IGRhdGEgb2YgYW4gYWNjZXNzb3IgaW4gYSBmb3JtYXQgV2ViR1BVIGFjY2VwdHMuXG4gICAqIFdlYkdQVSBkb2VzIG5vdCBzdXBwb3J0IDgtYml0IGluZGljZXMsIHNvIHRoZXkgYXJlIHdpZGVuZWQgdG8gMTYgYml0cy5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0SW5kZXhEYXRhKGFjY2Vzc29yOiBBY2Nlc3Nvcik6IFVpbnQ4QXJyYXkge1xuICAgIGlmIChhY2Nlc3Nvci5jb21wb25lbnRUeXBlICE9PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZSkge1xuICAgICAgcmV0dXJuIGFjY2Vzc29yLmdldFVpbnQ4QXJyYXkoKTtcbiAgICB9XG4gICAgY29uc3QgdHlwZWRBcnJheSA9IGFjY2Vzc29yLmdldFR5cGVkQXJyYXkoKTtcbiAgICBjb25zdCB1aW50MTZBcnJheSA9IG5ldyBVaW50MTZBcnJheSh0eXBlZEFycmF5Lmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlZEFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB1aW50MTZBcnJheVtpXSA9IHR5cGVkQXJyYXlbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXcgVWludDhBcnJheSh1aW50MTZBcnJheS5idWZmZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldFZlcnRleEJ1ZmZlckFyZW5hKCk6IFdlYkdwdUJ1ZmZlckFyZW5hIHtcbiAgICBpZiAodGhpcy5fX3ZlcnRleEJ1ZmZlckFyZW5hID09IG51bGwpIHtcbiAgICAgIHRoaXMuX192ZXJ0ZXhCdWZmZXJBcmVuYSA9IG5ldyBXZWJHcHVCdWZmZXJBcmVuYShcbiAgICAgICAgdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZSxcbiAgICAgICAgR1BVQnVmZmVyVXNhZ2UuVkVSVEVYIHwgR1BVQnVmZmVyVXNhZ2UuSU5ERVhcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fdmVydGV4QnVmZmVyQXJlbmE7XG4gIH1cblxuICAvKipcbiAgICogVXBsb2FkcyB2ZXJ0ZXggb3IgaW5kZXggZGF0YSBpbnRvIHRoZSBzaGFyZWQgdmVydGV4IGJ1ZmZlciBhcmVuYSBhbmQgcmV0dXJucyBhIGhhbmRsZSB0byB0aGUgcmFuZ2UuXG4gICAqL1xuICBwcml2YXRlIF9fYWxsb2NhdGVWZXJ0ZXhCdWZmZXJSYW5nZShkYXRhOiBVaW50OEFycmF5KTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5fX2dldFZlcnRleEJ1ZmZlckFyZW5hKCkuYWxsb2NhdGUoZGF0YSk7XG4gICAgY29uc3QgaGFuZGxlID0gdGhpcy5nZXRSZXNvdXJjZU51bWJlcigpO1xuICAgIHRoaXMuX192ZXJ0ZXhCdWZmZXJSYW5nZXMuc2V0KGhhbmRsZSwgcmFuZ2UpO1xuICAgIHJldHVybiBoYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJhbmdlIG9mIGEgdmVydGV4IG9yIGluZGV4IGJ1ZmZlciBoYW5kbGUuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldFZlcnRleEJ1ZmZlclJhbmdlKHJlc291cmNlSGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSk6IFdlYkdwdUJ1ZmZlclJhbmdlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3ZlcnRleEJ1ZmZlclJhbmdlcy5nZXQocmVzb3VyY2VIYW5kbGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3JlbGVhc2VWZXJ0ZXhCdWZmZXJSYW5nZShyZXNvdXJjZUhhbmRsZTogV2ViR1BVUmVzb3VyY2VIYW5kbGUpOiBib29sZWFuIHtcbiAgICBjb25zdCByYW5nZSA9IHRoaXMuX192ZXJ0ZXhCdWZmZXJSYW5nZXMuZ2V0KHJlc291cmNlSGFuZGxlKTtcbiAgICBpZiAocmFuZ2UgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLl9fdmVydGV4QnVmZmVyQXJlbmEhLnJlbGVhc2UocmFuZ2UpO1xuICAgIHRoaXMuX192ZXJ0ZXhCdWZmZXJSYW5nZXMuZGVsZXRlKHJlc291cmNlSGFuZGxlKTtcbiAgICAvLyBBIHJlbGVhc2VkIHJhbmdlIGNhbiBiZSByZXVzZWQgZm9yIG90aGVyIGRhdGEgcmlnaHQgYXdheS4gUmVjb3JkZWQgcmVuZGVyIGJ1bmRsZXMgbWF5IHN0aWxsIGJpbmRcbiAgICAvLyBpdCwgc28gZHJvcCB0aGVtOyB0aGV5IGFyZSByZS1yZWNvcmRlZCBvbiB0aGUgbmV4dCBmcmFtZS4gUmVsZWFzZXMgYXJlIHJhcmUgKG1lc2hlcyBvciBpbnN0YW5jZXNcbiAgICAvLyBiZWluZyByZXBsYWNlZCksIHNvIHRoaXMgZG9lcyBub3QgYWZmZWN0IHN0YXRpYyBzY2VuZXMuXG4gICAgdGhpcy5fX2NsZWFyUmVuZGVyQnVuZGxlQ2FjaGUoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBkYXRhIGluIGFuIGV4aXN0aW5nIHZlcnRleCBidWZmZXIgd2l0aCBuZXcgZGF0YSBmcm9tIGFuIGFjY2Vzc29yLlxuICAgKiBUaGUgZGF0YSBtdXN0IG5vdCBiZSBsYXJnZXIgdGhhbiB0aGUgZGF0YSB0aGUgYnVmZmVyIHdhcyBjcmVhdGVkIHdpdGguXG4gICAqXG4gICAqIEBwYXJhbSBhY2Nlc3NvciAtIEFjY2Vzc29yIGNvbnRhaW5pbmcgdGhlIG5ldyB2ZXJ0ZXggZGF0YVxuICAgKiBAcGFyYW0gcmVzb3VyY2VIYW5kbGUgLSBIYW5kbGUgdG8gdGhlIGV4aXN0aW5nIHZlcnRleCBidWZmZXIgdG8gdXBkYXRlXG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgdGhlIHZlcnRleCBidWZmZXIgaXMgbm90IGZvdW5kXG4gICAqL1xuICB1cGRhdGVWZXJ0ZXhCdWZmZXIoYWNjZXNzb3I6IEFjY2Vzc29yLCByZXNvdXJjZUhhbmRsZTogV2ViR1BVUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBjb25zdCByYW5nZSA9IHRoaXMuX192ZXJ0ZXhCdWZmZXJSYW5nZXMuZ2V0KHJlc291cmNlSGFuZGxlKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KHJhbmdlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgZm91bmQgVkJPLicpO1xuICAgIH1cbiAgICB0aGlzLl9fdmVydGV4QnVmZmVyQXJlbmEhLndyaXRlKHJhbmdlLCBhY2Nlc3Nvci5nZXRVaW50OEFycmF5KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGRhdGEgaW4gYW4gZXhpc3RpbmcgaW5kZXggYnVmZmVyIHdpdGggbmV3IGRhdGEgZnJvbSBhbiBhY2Nlc3Nvci5cbiAgICogQXV0b21hdGljYWxseSBoYW5kbGVzIGNvbnZlcnNpb24gb2YgVW5zaWduZWRCeXRlIGluZGljZXMgdG8gVW5zaWduZWRTaG9ydCBpZiBuZWVkZWQuXG4gICAqXG4gICAqIEBwYXJhbSBhY2Nlc3NvciAtIEFjY2Vzc29yIGNvbnRhaW5pbmcgdGhlIG5ldyBpbmRleCBkYXRhXG4gICAqIEBwYXJhbSByZXNvdXJjZUhhbmRsZSAtIEhhbmRsZSB0byB0aGUgZXhpc3RpbmcgaW5kZXggYnVmZmVyIHRvIHVwZGF0ZVxuICAgKiBAdGhyb3dzIEVycm9yIGlmIHRoZSBpbmRleCBidWZmZXIgaXMgbm90IGZvdW5kXG4gICAqL1xuICB1cGRhdGVJbmRleEJ1ZmZlcihhY2Nlc3NvcjogQWNjZXNzb3IsIHJlc291cmNlSGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSkge1xuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5fX3ZlcnRleEJ1ZmZlclJhbmdlcy5nZXQocmVzb3VyY2VIYW5kbGUpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QocmFuZ2UpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBmb3VuZCBJQk8uJyk7XG4gICAgfVxuICAgIHRoaXMuX192ZXJ0ZXhCdWZmZXJBcmVuYSEud3JpdGUocmFuZ2UsIFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fX2dldEluZGV4RGF0YShhY2Nlc3NvcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYSB2ZXJ0ZXggYnVmZmVyIGFuZCByZWxlYXNlcyBpdHMgcmFuZ2Ugb2YgdGhlIHZlcnRleCBidWZmZXIgYXJlbmEuXG4gICAqXG4gICAqIEBwYXJhbSByZXNvdXJjZUhhbmRsZSAtIEhhbmRsZSB0byB0aGUgdmVydGV4IGJ1ZmZlciB0byBkZWxldGVcbiAgICogQHRocm93cyBFcnJvciBpZiB0aGUgdmVydGV4IGJ1ZmZlciBpcyBub3QgZm91bmRcbiAgICovXG4gIGRlbGV0ZVZlcnRleEJ1ZmZlcihyZXNvdXJjZUhhbmRsZTogV2ViR1BVUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBpZiAoIXRoaXMuX19yZWxlYXNlVmVydGV4QnVmZmVyUmFuZ2UocmVzb3VyY2VIYW5kbGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBmb3VuZCBWQk8uJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdmVydGV4IGFuZCBpbmRleCBidWZmZXJzIGZvciBhIHByaW1pdGl2ZSBhbmQgcmV0dXJucyB0aGVpciBoYW5kbGVzLlxuICAgKiBUaGlzIG1ldGhvZCBwcm9jZXNzZXMgYWxsIHZlcnRleCBhdHRyaWJ1dGVzIGFuZCBjcmVhdGVzIGFwcHJvcHJpYXRlIGJ1ZmZlcnNcbiAgICogd2hpbGUgdHJhY2tpbmcgd2hpY2ggYXR0cmlidXRlcyBhcmUgcHJlc2VudC5cbiAgICpcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgY29udGFpbmluZyB2ZXJ0ZXggYW5kIGluZGV4IGRhdGFcbiAgICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgYnVmZmVyIGhhbmRsZXMgYW5kIGF0dHJpYnV0ZSBmbGFnc1xuICAgKi9cbiAgY3JlYXRlVmVydGV4QnVmZmVyQW5kSW5kZXhCdWZmZXIocHJpbWl0aXZlOiBQcmltaXRpdmUpOiBWZXJ0ZXhIYW5kbGVzIHtcbiAgICBsZXQgaWJvSGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZTtcbiAgICBpZiAocHJpbWl0aXZlLmhhc0luZGljZXMoKSkge1xuICAgICAgaWJvSGFuZGxlID0gdGhpcy5jcmVhdGVJbmRleEJ1ZmZlcihwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yISk7XG4gICAgfVxuXG4gICAgY29uc3QgYXR0cmlidXRlc0ZsYWdzOiBib29sZWFuW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IFZlcnRleEF0dHJpYnV0ZS5BdHRyaWJ1dGVUeXBlTnVtYmVyOyBpKyspIHtcbiAgICAgIGF0dHJpYnV0ZXNGbGFnc1tpXSA9IGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCB2Ym9IYW5kbGVzOiBBcnJheTxXZWJHTFJlc291cmNlSGFuZGxlPiA9IFtdO1xuICAgIHByaW1pdGl2ZS5hdHRyaWJ1dGVBY2Nlc3NvcnMuZm9yRWFjaCgoYWNjZXNzb3I6IEFjY2Vzc29yLCBpOiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnN0IHZib0hhbmRsZSA9IHRoaXMuY3JlYXRlVmVydGV4QnVmZmVyKGFjY2Vzc29yKTtcbiAgICAgIGNvbnN0IHNsb3RJZHggPSBWZXJ0ZXhBdHRyaWJ1dGUudG9BdHRyaWJ1dGVTbG90RnJvbUpvaW5lZFN0cmluZyhwcmltaXRpdmUuYXR0cmlidXRlU2VtYW50aWNzW2ldKTtcbiAgICAgIGF0dHJpYnV0ZXNGbGFnc1tzbG90SWR4XSA9IHRydWU7XG4gICAgICB2Ym9IYW5kbGVzLnB1c2godmJvSGFuZGxlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICB2YW9IYW5kbGU6IC0xLFxuICAgICAgaWJvSGFuZGxlOiBpYm9IYW5kbGUhLFxuICAgICAgdmJvSGFuZGxlczogdmJvSGFuZGxlcyxcbiAgICAgIGF0dHJpYnV0ZXNGbGFnczogYXR0cmlidXRlc0ZsYWdzLFxuICAgICAgc2V0Q29tcGxldGU6IGZhbHNlLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgdmVydGV4IGFuZCBpbmRleCBidWZmZXJzIGZvciBhIHByaW1pdGl2ZSB3aXRoIG5ldyBkYXRhLlxuICAgKiBUaGlzIG1ldGhvZCB1cGRhdGVzIGFsbCBleGlzdGluZyBidWZmZXJzIHdpdGggZnJlc2ggZGF0YSBmcm9tIHRoZSBwcmltaXRpdmUuXG4gICAqXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIGNvbnRhaW5pbmcgdGhlIHVwZGF0ZWQgdmVydGV4IGFuZCBpbmRleCBkYXRhXG4gICAqIEBwYXJhbSB2ZXJ0ZXhIYW5kbGVzIC0gT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGhhbmRsZXMgdG8gdGhlIGJ1ZmZlcnMgdG8gdXBkYXRlXG4gICAqL1xuICB1cGRhdGVWZXJ0ZXhCdWZmZXJBbmRJbmRleEJ1ZmZlcihwcmltaXRpdmU6IFByaW1pdGl2ZSwgdmVydGV4SGFuZGxlczogVmVydGV4SGFuZGxlcykge1xuICAgIGlmICh2ZXJ0ZXhIYW5kbGVzLmlib0hhbmRsZSkge1xuICAgICAgdGhpcy51cGRhdGVJbmRleEJ1ZmZlcihwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yIGFzIEFjY2Vzc29yLCB2ZXJ0ZXhIYW5kbGVzLmlib0hhbmRsZSk7XG4gICAgfVxuXG4gICAgY29uc3QgYXR0cmlidXRlQWNjZXNzb3JzID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29ycztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJpYnV0ZUFjY2Vzc29ycy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy51cGRhdGVWZXJ0ZXhCdWZmZXIoYXR0cmlidXRlQWNjZXNzb3JzW2ldLCB2ZXJ0ZXhIYW5kbGVzLnZib0hhbmRsZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGFsbCB2ZXJ0ZXggZGF0YSByZXNvdXJjZXMgKHZlcnRleCBhbmQgaW5kZXggYnVmZmVycykgYXNzb2NpYXRlZCB3aXRoIHZlcnRleCBoYW5kbGVzLlxuICAgKiBUaGlzIG1ldGhvZCBkZXN0cm95cyBib3RoIHZlcnRleCBidWZmZXJzIGFuZCBpbmRleCBidWZmZXJzIHRvIGZyZWUgR1BVIG1lbW9yeS5cbiAgICpcbiAgICogQHBhcmFtIHZlcnRleEhhbmRsZXMgLSBPYmplY3QgY29udGFpbmluZyBoYW5kbGVzIHRvIHRoZSB2ZXJ0ZXggZGF0YSByZXNvdXJjZXMgdG8gZGVsZXRlXG4gICAqL1xuICBkZWxldGVWZXJ0ZXhEYXRhUmVzb3VyY2VzKHZlcnRleEhhbmRsZXM6IFZlcnRleEhhbmRsZXMpIHtcbiAgICBpZiAoSXMuZXhpc3QodmVydGV4SGFuZGxlcy5pYm9IYW5kbGUpKSB7XG4gICAgICB0aGlzLl9fcmVsZWFzZVZlcnRleEJ1ZmZlclJhbmdlKHZlcnRleEhhbmRsZXMuaWJvSGFuZGxlKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHZib0hhbmRsZSBvZiB2ZXJ0ZXhIYW5kbGVzLnZib0hhbmRsZXMpIHtcbiAgICAgIHRoaXMuX19yZWxlYXNlVmVydGV4QnVmZmVyUmFuZ2UodmJvSGFuZGxlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyB2ZXJ0ZXggZGF0YSBsYXlvdXQgZm9yIHRoZSByZW5kZXJpbmcgcGlwZWxpbmUuXG4gICAqIFRoaXMgbWV0aG9kIHNldHMgdXAgdmVydGV4IGJ1ZmZlciBsYXlvdXRzIGluY2x1ZGluZyBib3RoIHBlci12ZXJ0ZXggYW5kIHBlci1pbnN0YW5jZSBkYXRhLlxuICAgKlxuICAgKiBAcGFyYW0gYnVmZmVySGFuZGxlcyAtIE9iamVjdCBjb250YWluaW5nIHZlcnRleCBhcnJheSBvYmplY3QsIGluZGV4IGJ1ZmZlciwgYW5kIHZlcnRleCBidWZmZXIgaGFuZGxlc1xuICAgKiBAcGFyYW0gYnVmZmVySGFuZGxlcy52Ym9IYW5kbGVzIC0gQXJyYXkgb2YgdmVydGV4IGJ1ZmZlciBoYW5kbGVzXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIGNvbnRhaW5pbmcgdmVydGV4IGF0dHJpYnV0ZSBpbmZvcm1hdGlvblxuICAgKi9cbiAgc2V0VmVydGV4RGF0YVRvUGlwZWxpbmUoXG4gICAge1xuICAgICAgdmJvSGFuZGxlcyxcbiAgICB9OiB7XG4gICAgICB2Ym9IYW5kbGVzOiBBcnJheTxXZWJHUFVSZXNvdXJjZUhhbmRsZT47XG4gICAgfSxcbiAgICBwcmltaXRpdmU6IFByaW1pdGl2ZVxuICApIHtcbiAgICBjb25zdCBidWZmZXJzOiBHUFVWZXJ0ZXhCdWZmZXJMYXlvdXRbXSA9IFtdO1xuXG4gICAgLy8gVmVydGV4IEJ1ZmZlciBTZXR0aW5nc1xuICAgIC8vLyBFYWNoIHZlcnRleCBhdHRyaWJ1dGVzXG4gICAgY29uc3QgYXR0cmlidXRlczogR1BVVmVydGV4QXR0cmlidXRlW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZib0hhbmRsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNoYWRlckxvY2F0aW9uID0gVmVydGV4QXR0cmlidXRlLnRvQXR0cmlidXRlU2xvdEZyb21Kb2luZWRTdHJpbmcocHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljc1tpXSk7XG5cbiAgICAgIGNvbnN0IGdwdVZlcnRleEZvcm1hdCA9IFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fX2dldFZlcnRleEZvcm1hdChwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzW2ldKTtcbiAgICAgIGF0dHJpYnV0ZXMucHVzaCh7XG4gICAgICAgIHNoYWRlckxvY2F0aW9uLFxuICAgICAgICBvZmZzZXQ6IHByaW1pdGl2ZS5hdHRyaWJ1dGVBY2Nlc3NvcnNbaV0uYnl0ZU9mZnNldEluQnVmZmVyVmlldyxcbiAgICAgICAgZm9ybWF0OiBncHVWZXJ0ZXhGb3JtYXQsXG4gICAgICB9KTtcbiAgICB9XG4gICAgYnVmZmVyc1swXSA9IHtcbiAgICAgIHN0ZXBNb2RlOiAndmVydGV4JyxcbiAgICAgIGF0dHJpYnV0ZXMsXG4gICAgICBhcnJheVN0cmlkZTogcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1swXS5ieXRlU3RyaWRlLFxuICAgIH07XG5cbiAgICAvLy8gSW5zdGFuY2UgQnVmZmVyXG4gICAgYnVmZmVyc1sxXSA9IHtcbiAgICAgIHN0ZXBNb2RlOiAnaW5zdGFuY2UnLFxuICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICB7XG4gICAgICAgICAgc2hhZGVyTG9jYXRpb246IFZlcnRleEF0dHJpYnV0ZS5JbnN0YW5jZS5nZXRBdHRyaWJ1dGVTbG90KCksXG4gICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgIGZvcm1hdDogJ3VpbnQzMng0JyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBhcnJheVN0cmlkZTogNCAqIDQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgYW5kIGxvZ3Mgc2hhZGVyIGNvbXBpbGF0aW9uIHN0YXR1cyBhbmQgZXJyb3IgbWVzc2FnZXMuXG4gICAqIFRoaXMgbWV0aG9kIHByb3ZpZGVzIGRldGFpbGVkIGRlYnVnZ2luZyBpbmZvcm1hdGlvbiB3aGVuIHNoYWRlciBjb21waWxhdGlvbiBmYWlscy5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgZm9yIGxvZ2dpbmdcbiAgICogQHBhcmFtIG1hdGVyaWFsVHlwZU5hbWUgLSBOYW1lIG9mIHRoZSBtYXRlcmlhbCB0eXBlIGZvciBkZWJ1Z2dpbmdcbiAgICogQHBhcmFtIHNoYWRlclRleHQgLSBUaGUgc2hhZGVyIHNvdXJjZSBjb2RlIHRoYXQgd2FzIGNvbXBpbGVkXG4gICAqIEBwYXJhbSBpbmZvIC0gV2ViR1BVIGNvbXBpbGF0aW9uIGluZm8gY29udGFpbmluZyBtZXNzYWdlcyBhbmQgZXJyb3JzXG4gICAqIEByZXR1cm5zIFRydWUgaWYgY29tcGlsYXRpb24gd2FzIHN1Y2Nlc3NmdWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NoZWNrU2hhZGVyQ29tcGlsZVN0YXR1cyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcsXG4gICAgc2hhZGVyVGV4dDogc3RyaW5nLFxuICAgIGluZm86IEdQVUNvbXBpbGF0aW9uSW5mb1xuICApOiBib29sZWFuIHtcbiAgICBlbmdpbmUubG9nZ2VyLmluZm8oYE1hdGVyaWFsVHlwZU5hbWU6ICR7bWF0ZXJpYWxUeXBlTmFtZX1gKTtcbiAgICBjb25zdCBsaW5lTnVtYmVyZWRTaGFkZXJUZXh0ID0gTWlzY1V0aWwuYWRkTGluZU51bWJlclRvQ29kZShzaGFkZXJUZXh0KTtcbiAgICBlbmdpbmUubG9nZ2VyLmluZm8obGluZU51bWJlcmVkU2hhZGVyVGV4dCk7XG4gICAgbGV0IGlzT2sgPSB0cnVlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5mby5tZXNzYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgZW5naW5lLmxvZ2dlci5pbmZvKGluZm8ubWVzc2FnZXNbaV0ubWVzc2FnZSk7XG4gICAgICBpc09rID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzT2s7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBzaGFkZXIgbW9kdWxlcyAodmVydGV4IGFuZCBmcmFnbWVudCkgZnJvbSBzaGFkZXIgc291cmNlIGNvZGUuXG4gICAqIFRoaXMgbWV0aG9kIGNvbXBpbGVzIGJvdGggdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXJzIGFuZCByZXR1cm5zIHRoZWlyIGhhbmRsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbXMgLSBDb25maWd1cmF0aW9uIG9iamVjdCBmb3Igc2hhZGVyIGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXJhbXMuZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSBmb3IgbG9nZ2luZ1xuICAgKiBAcGFyYW0gcGFyYW1zLm1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRoYXQgd2lsbCB1c2UgdGhlc2Ugc2hhZGVyc1xuICAgKiBAcGFyYW0gcGFyYW1zLnZlcnRleFNoYWRlclN0ciAtIFdHU0wgdmVydGV4IHNoYWRlciBzb3VyY2UgY29kZVxuICAgKiBAcGFyYW0gcGFyYW1zLmZyYWdtZW50U2hhZGVyU3RyIC0gV0dTTCBmcmFnbWVudCBzaGFkZXIgc291cmNlIGNvZGVcbiAgICogQHJldHVybnMgSGFuZGxlIHRvIHRoZSBzaGFkZXIgcHJvZ3JhbSBjb250YWluaW5nIGJvdGggbW9kdWxlc1xuICAgKi9cbiAgY3JlYXRlU2hhZGVyUHJvZ3JhbSh7XG4gICAgY29uZmlnLFxuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbCxcbiAgICB2ZXJ0ZXhTaGFkZXJTdHIsXG4gICAgZnJhZ21lbnRTaGFkZXJTdHIsXG4gIH06IHtcbiAgICBjb25maWc6IENvbmZpZztcbiAgICBlbmdpbmU6IEVuZ2luZTtcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWw7XG4gICAgdmVydGV4U2hhZGVyU3RyOiBzdHJpbmc7XG4gICAgZnJhZ21lbnRTaGFkZXJTdHI6IHN0cmluZztcbiAgfSkge1xuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgY29uc3QgdnNNb2R1bGUgPSBncHVEZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcbiAgICAgIGNvZGU6IHZlcnRleFNoYWRlclN0cixcbiAgICAgIGxhYmVsOiBgJHttYXRlcmlhbC5tYXRlcmlhbFR5cGVOYW1lfSB2ZXJ0ZXggc2hhZGVyYCxcbiAgICB9KTtcbiAgICBpZiAoY29uZmlnLmNnQXBpRGVidWdDb25zb2xlT3V0cHV0KSB7XG4gICAgICB2c01vZHVsZS5nZXRDb21waWxhdGlvbkluZm8oKS50aGVuKGluZm8gPT4ge1xuICAgICAgICBpZiAoaW5mby5tZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy5fX2NoZWNrU2hhZGVyQ29tcGlsZVN0YXR1cyhlbmdpbmUsIG1hdGVyaWFsLm1hdGVyaWFsVHlwZU5hbWUsIHZlcnRleFNoYWRlclN0ciwgaW5mbyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBmc01vZHVsZSA9IGdwdURldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xuICAgICAgY29kZTogZnJhZ21lbnRTaGFkZXJTdHIsXG4gICAgICBsYWJlbDogYCR7bWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZX0gZnJhZ21lbnQgc2hhZGVyYCxcbiAgICB9KTtcbiAgICBpZiAoY29uZmlnLmNnQXBpRGVidWdDb25zb2xlT3V0cHV0KSB7XG4gICAgICBmc01vZHVsZS5nZXRDb21waWxhdGlvbkluZm8oKS50aGVuKGluZm8gPT4ge1xuICAgICAgICBpZiAoaW5mby5tZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy5fX2NoZWNrU2hhZGVyQ29tcGlsZVN0YXR1cyhlbmdpbmUsIG1hdGVyaWFsLm1hdGVyaWFsVHlwZU5hbWUsIGZyYWdtZW50U2hhZGVyU3RyLCBpbmZvKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlcyA9IHtcbiAgICAgIHZzTW9kdWxlLFxuICAgICAgZnNNb2R1bGUsXG4gICAgfTtcbiAgICBjb25zdCBtb2R1bGVzSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UobW9kdWxlcyk7XG5cbiAgICByZXR1cm4gbW9kdWxlc0hhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGZyYW1lYnVmZmVyIHdpdGggdGhlIHNwZWNpZmllZCBjbGVhciB2YWx1ZXMuXG4gICAqIFRoaXMgbWV0aG9kIGlzIGV4ZWN1dGVkIHdoZW4gdGhlIHJlbmRlciBwYXNzIGhhcyBubyBlbnRpdGllcyB0byByZW5kZXIsXG4gICAqIGJ1dCBzdGlsbCBuZWVkcyB0byBwZXJmb3JtIGNsZWFyIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIHJlbmRlciBwYXNzIGNvbnRhaW5pbmcgY2xlYXIgc2V0dGluZ3MgYW5kIHRhcmdldCBmcmFtZWJ1ZmZlclxuICAgKi9cbiAgY2xlYXJGcmFtZUJ1ZmZlcihlbmdpbmU6IEVuZ2luZSwgcmVuZGVyUGFzczogUmVuZGVyUGFzcywgZGlzcGxheUlkeDogbnVtYmVyKSB7XG4gICAgaWYgKHJlbmRlclBhc3MuZW50aXRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyB0aGlzIG1ldGhvZCBpcyBleGVjdXRlZCB3aGVuIHRoZSByZW5kZXJQYXNzIGhhcyBubyBlbnRpdGllcy5cbiAgICAvLyBJZiB0aGUgcmVuZGVyUGFzcyBoYXMgZW50aXRpZXMsIHRoZSBjbGVhciBvcGVyYXRpb24gaXMgZXhlY3V0ZWQgaW4gdGhlIGNyZWF0ZVJlbmRlclBhc3NFbmNvZGVyIG1ldGhvZC5cblxuICAgIGlmICghcmVuZGVyUGFzcy50b0NsZWFyQ29sb3JCdWZmZXIgJiYgIXJlbmRlclBhc3MudG9DbGVhckRlcHRoQnVmZmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSBlbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgIGNvbnN0IGlzWHJUYXJnZXQgPSByZW5kZXJQYXNzLmdldEZyYW1lYnVmZmVyKCkgPT0gbnVsbCAmJiB3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUgJiYgcmVuZGVyUGFzcy5pc091dHB1dEZvclZyO1xuICAgIGlmIChyZW5kZXJQYXNzLmdldFJlc29sdmVGcmFtZWJ1ZmZlcigpID09IG51bGwgJiYgIWlzWHJUYXJnZXQpIHtcbiAgICAgIC8vIE5vdGhpbmcgaXMgZHJhd24gYnkgdGhpcyByZW5kZXIgcGFzcywgc28gYmVnaW5uaW5nIGEgcmVuZGVyIHBhc3Mgb25seSB0byBjbGVhciBpcyBkZWZlcnJlZC5cbiAgICAgIC8vIFRoZSBjbGVhciBpcyBmb2xkZWQgaW50byB0aGUgbG9hZCBvcHMgb2YgdGhlIG5leHQgcmVuZGVyIHBhc3Mgb24gdGhlIHNhbWUgYXR0YWNobWVudHNcbiAgICAgIC8vIChzZWUgY3JlYXRlUmVuZGVyUGFzc0VuY29kZXIpLCBvciBlbmNvZGVkIG9uIGl0cyBvd24gd2hlbiBzb21ldGhpbmcgZWxzZSBjb21lcyBmaXJzdC5cbiAgICAgIGNvbnN0IHRhcmdldFZpZXdzID0gdGhpcy5fX2NhbmRpZGF0ZVJlbmRlclBhc3NUYXJnZXRWaWV3cztcbiAgICAgIGNvbnN0IHRhcmdldEtpbmQgPSB0aGlzLl9fY29sbGVjdFJlbmRlclBhc3NUYXJnZXRWaWV3cyhlbmdpbmUsIHJlbmRlclBhc3MsIHRhcmdldFZpZXdzKTtcbiAgICAgIGNvbnN0IHBlbmRpbmdDbGVhciA9IHRoaXMuX19wZW5kaW5nQ2xlYXI7XG4gICAgICBpZiAocGVuZGluZ0NsZWFyLmFjdGl2ZSkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdGFyZ2V0S2luZCAhPT0gcGVuZGluZ0NsZWFyLnRhcmdldEtpbmQgfHxcbiAgICAgICAgICAhV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9faXNTYW1lVGFyZ2V0Vmlld3ModGFyZ2V0Vmlld3MsIHBlbmRpbmdDbGVhci50YXJnZXRWaWV3cylcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy5fX2VuY29kZVBlbmRpbmdDbGVhcigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIXBlbmRpbmdDbGVhci5hY3RpdmUpIHtcbiAgICAgICAgcGVuZGluZ0NsZWFyLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHBlbmRpbmdDbGVhci5lbmdpbmUgPSBlbmdpbmU7XG4gICAgICAgIHBlbmRpbmdDbGVhci5yZW5kZXJQYXNzID0gcmVuZGVyUGFzcztcbiAgICAgICAgcGVuZGluZ0NsZWFyLmRpc3BsYXlJZHggPSBkaXNwbGF5SWR4O1xuICAgICAgICBwZW5kaW5nQ2xlYXIudGFyZ2V0S2luZCA9IHRhcmdldEtpbmQ7XG4gICAgICAgIC8vIFN3YXAgdGhlIHNjcmF0Y2ggYXJyYXlzIGluc3RlYWQgb2YgY29weWluZyB0aGUgdmlld3MuXG4gICAgICAgIHRoaXMuX19jYW5kaWRhdGVSZW5kZXJQYXNzVGFyZ2V0Vmlld3MgPSBwZW5kaW5nQ2xlYXIudGFyZ2V0Vmlld3M7XG4gICAgICAgIHBlbmRpbmdDbGVhci50YXJnZXRWaWV3cyA9IHRhcmdldFZpZXdzO1xuICAgICAgfVxuICAgICAgLy8gQSBsYXRlciBjbGVhciBvZiB0aGUgc2FtZSBhdHRhY2htZW50IG92ZXJyaWRlcyBhbiBlYXJsaWVyIG9uZS5cbiAgICAgIGlmIChyZW5kZXJQYXNzLnRvQ2xlYXJDb2xvckJ1ZmZlcikge1xuICAgICAgICBjb25zdCBjbGVhckNvbG9yID0gcmVuZGVyUGFzcy5jbGVhckNvbG9yO1xuICAgICAgICBwZW5kaW5nQ2xlYXIuaXNDb2xvckNsZWFyID0gdHJ1ZTtcbiAgICAgICAgcGVuZGluZ0NsZWFyLmNsZWFyQ29sb3IuciA9IGNsZWFyQ29sb3IueDtcbiAgICAgICAgcGVuZGluZ0NsZWFyLmNsZWFyQ29sb3IuZyA9IGNsZWFyQ29sb3IueTtcbiAgICAgICAgcGVuZGluZ0NsZWFyLmNsZWFyQ29sb3IuYiA9IGNsZWFyQ29sb3IuejtcbiAgICAgICAgcGVuZGluZ0NsZWFyLmNsZWFyQ29sb3IuYSA9IGNsZWFyQ29sb3IudztcbiAgICAgIH1cbiAgICAgIGlmIChyZW5kZXJQYXNzLnRvQ2xlYXJEZXB0aEJ1ZmZlcikge1xuICAgICAgICBwZW5kaW5nQ2xlYXIuaXNEZXB0aENsZWFyID0gdHJ1ZTtcbiAgICAgICAgcGVuZGluZ0NsZWFyLmNsZWFyRGVwdGggPSByZW5kZXJQYXNzLmNsZWFyRGVwdGg7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIEEgTVNBQSBwYXNzIHdvdWxkIHJlc29sdmUgaW50byBpdHMgcmVzb2x2ZSB0YXJnZXQgYXQgdGhlIGVuZCBvZiB0aGUgcGFzcywgd2hpY2ggdGhlXG4gICAgLy8gc3RhbmRhbG9uZSBjbGVhciBiZWxvdyBuZXZlciBkaWQsIHNvIGl0IGlzIG5vdCBtZXJnZWQuXG4gICAgdGhpcy5fX2ZsdXNoUmVuZGVyUGFzc1dvcmsoKTtcblxuICAgIGNvbnN0IGNvbG9yQXR0YWNobWVudHM6IEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXSA9IFtdO1xuICAgIGxldCBkZXB0aFN0ZW5jaWxBdHRhY2htZW50OiBHUFVSZW5kZXJQYXNzRGVwdGhTdGVuY2lsQXR0YWNobWVudCB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB3ZWJ4clN5c3RlbSA9IGVuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gICAgaWYgKHJlbmRlclBhc3MudG9DbGVhckNvbG9yQnVmZmVyKSB7XG4gICAgICBjb25zdCBmcmFtZWJ1ZmZlciA9IHJlbmRlclBhc3MuZ2V0RnJhbWVidWZmZXIoKTtcbiAgICAgIGlmIChmcmFtZWJ1ZmZlciAhPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGNvbG9yQXR0YWNobWVudCBvZiBmcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzKSB7XG4gICAgICAgICAgY29uc3QgdGV4dHVyZVZpZXcgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChcbiAgICAgICAgICAgIGNvbG9yQXR0YWNobWVudC5fdGV4dHVyZVZpZXdBc1JlbmRlclRhcmdldFJlc291cmNlVWlkXG4gICAgICAgICAgKSBhcyBHUFVUZXh0dXJlVmlldztcbiAgICAgICAgICBjb2xvckF0dGFjaG1lbnRzLnB1c2goe1xuICAgICAgICAgICAgdmlldzogdGV4dHVyZVZpZXcsXG4gICAgICAgICAgICBjbGVhclZhbHVlOiB7XG4gICAgICAgICAgICAgIHI6IHJlbmRlclBhc3MuY2xlYXJDb2xvci54LFxuICAgICAgICAgICAgICBnOiByZW5kZXJQYXNzLmNsZWFyQ29sb3IueSxcbiAgICAgICAgICAgICAgYjogcmVuZGVyUGFzcy5jbGVhckNvbG9yLnosXG4gICAgICAgICAgICAgIGE6IHJlbmRlclBhc3MuY2xlYXJDb2xvci53LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvYWRPcDogJ2NsZWFyJyxcbiAgICAgICAgICAgIHN0b3JlT3A6ICdzdG9yZScsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAod2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlICYmIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWcikge1xuICAgICAgICBjb25zdCB2aWV3ID0gZW5naW5lLmVuZ2luZVN0YXRlLnhyUG9zZVdlYkdQVSEudmlld3NbZGlzcGxheUlkeF07XG4gICAgICAgIGNvbnN0IHN1YkltYWdlID0gZW5naW5lLmVuZ2luZVN0YXRlLnhyR3B1QmluZGluZy5nZXRWaWV3U3ViSW1hZ2UoXG4gICAgICAgICAgZW5naW5lLmVuZ2luZVN0YXRlLnhyUHJvamVjdGlvbkxheWVyV2ViR1BVISxcbiAgICAgICAgICB2aWV3XG4gICAgICAgICk7XG4gICAgICAgIGNvbG9yQXR0YWNobWVudHMucHVzaCh7XG4gICAgICAgICAgdmlldzogc3ViSW1hZ2UuY29sb3JUZXh0dXJlLmNyZWF0ZVZpZXcoc3ViSW1hZ2UuZ2V0Vmlld0Rlc2NyaXB0b3IoKSksXG4gICAgICAgICAgY2xlYXJWYWx1ZToge1xuICAgICAgICAgICAgcjogcmVuZGVyUGFzcy5jbGVhckNvbG9yLngsXG4gICAgICAgICAgICBnOiByZW5kZXJQYXNzLmNsZWFyQ29sb3IueSxcbiAgICAgICAgICAgIGI6IHJlbmRlclBhc3MuY2xlYXJDb2xvci56LFxuICAgICAgICAgICAgYTogcmVuZGVyUGFzcy5jbGVhckNvbG9yLncsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBsb2FkT3A6ICdjbGVhcicsXG4gICAgICAgICAgc3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb2xvckF0dGFjaG1lbnRzLnB1c2goe1xuICAgICAgICAgIHZpZXc6IHRoaXMuX19nZXRDb250ZXh0Q3VycmVudFRleHR1cmVWaWV3KCksXG4gICAgICAgICAgY2xlYXJWYWx1ZToge1xuICAgICAgICAgICAgcjogcmVuZGVyUGFzcy5jbGVhckNvbG9yLngsXG4gICAgICAgICAgICBnOiByZW5kZXJQYXNzLmNsZWFyQ29sb3IueSxcbiAgICAgICAgICAgIGI6IHJlbmRlclBhc3MuY2xlYXJDb2xvci56LFxuICAgICAgICAgICAgYTogcmVuZGVyUGFzcy5jbGVhckNvbG9yLncsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBsb2FkT3A6ICdjbGVhcicsXG4gICAgICAgICAgc3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZW5kZXJQYXNzLnRvQ2xlYXJEZXB0aEJ1ZmZlcikge1xuICAgICAgY29uc3QgZnJhbWVidWZmZXIgPSByZW5kZXJQYXNzLmdldEZyYW1lYnVmZmVyKCk7XG4gICAgICBpZiAoZnJhbWVidWZmZXIgIT0gbnVsbCAmJiBmcmFtZWJ1ZmZlci5kZXB0aEF0dGFjaG1lbnQgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBkZXB0aFRleHR1cmVWaWV3ID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQoXG4gICAgICAgICAgZnJhbWVidWZmZXIuZGVwdGhBdHRhY2htZW50Ll90ZXh0dXJlVmlld0FzUmVuZGVyVGFyZ2V0UmVzb3VyY2VVaWRcbiAgICAgICAgKSBhcyBHUFVUZXh0dXJlVmlldztcbiAgICAgICAgZGVwdGhTdGVuY2lsQXR0YWNobWVudCA9IHtcbiAgICAgICAgICB2aWV3OiBkZXB0aFRleHR1cmVWaWV3LFxuICAgICAgICAgIGRlcHRoQ2xlYXJWYWx1ZTogcmVuZGVyUGFzcy5jbGVhckRlcHRoLFxuICAgICAgICAgIGRlcHRoTG9hZE9wOiAnY2xlYXInLFxuICAgICAgICAgIGRlcHRoU3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSBpZiAod2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlICYmIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWcikge1xuICAgICAgICBjb25zdCB2aWV3ID0gZW5naW5lLmVuZ2luZVN0YXRlLnhyUG9zZVdlYkdQVSEudmlld3NbZGlzcGxheUlkeF07XG4gICAgICAgIGNvbnN0IHN1YkltYWdlID0gZW5naW5lLmVuZ2luZVN0YXRlLnhyR3B1QmluZGluZy5nZXRWaWV3U3ViSW1hZ2UoXG4gICAgICAgICAgZW5naW5lLmVuZ2luZVN0YXRlLnhyUHJvamVjdGlvbkxheWVyV2ViR1BVISxcbiAgICAgICAgICB2aWV3XG4gICAgICAgICk7XG4gICAgICAgIGRlcHRoU3RlbmNpbEF0dGFjaG1lbnQgPSB7XG4gICAgICAgICAgdmlldzogc3ViSW1hZ2UuZGVwdGhTdGVuY2lsVGV4dHVyZS5jcmVhdGVWaWV3KHN1YkltYWdlLmdldFZpZXdEZXNjcmlwdG9yKCkpLFxuICAgICAgICAgIGRlcHRoQ2xlYXJWYWx1ZTogcmVuZGVyUGFzcy5jbGVhckRlcHRoLFxuICAgICAgICAgIGRlcHRoTG9hZE9wOiAnY2xlYXInLFxuICAgICAgICAgIGRlcHRoU3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlcHRoU3RlbmNpbEF0dGFjaG1lbnQgPSB7XG4gICAgICAgICAgdmlldzogdGhpcy5fX3N5c3RlbURlcHRoVGV4dHVyZVZpZXchLFxuICAgICAgICAgIGRlcHRoQ2xlYXJWYWx1ZTogcmVuZGVyUGFzcy5jbGVhckRlcHRoLFxuICAgICAgICAgIGRlcHRoTG9hZE9wOiAnY2xlYXInLFxuICAgICAgICAgIGRlcHRoU3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvcjogR1BVUmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG4gICAgICBjb2xvckF0dGFjaG1lbnRzOiBjb2xvckF0dGFjaG1lbnRzLFxuICAgICAgZGVwdGhTdGVuY2lsQXR0YWNobWVudDogZGVwdGhTdGVuY2lsQXR0YWNobWVudCxcbiAgICAgIGxhYmVsOiByZW5kZXJQYXNzLnVuaXF1ZU5hbWUsXG4gICAgfTtcbiAgICBjb25zdCBwYXNzRW5jb2RlciA9IHRoaXMuX19iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuICAgIHBhc3NFbmNvZGVyLmVuZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGEgZHJhdyBjYWxsIGZvciByZW5kZXJpbmcgYSBwcmltaXRpdmUgd2l0aCB0aGUgc3BlY2lmaWVkIG1hdGVyaWFsIGFuZCByZW5kZXIgcGFzcy5cbiAgICogVGhpcyBpcyB0aGUgY29yZSByZW5kZXJpbmcgbWV0aG9kIHRoYXQgc2V0cyB1cCB0aGUgcmVuZGVyIHBpcGVsaW5lLCBiaW5kIGdyb3VwcyxcbiAgICogYW5kIGV4ZWN1dGVzIHRoZSBhY3R1YWwgR1BVIGRyYXcgY29tbWFuZHMuXG4gICAqXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgZ2VvbWV0cmljIHByaW1pdGl2ZSB0byByZW5kZXIgKHZlcnRpY2VzLCBpbmRpY2VzLCBhdHRyaWJ1dGVzKVxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgY29udGFpbmluZyBzaGFkZXJzIGFuZCByZW5kZXJpbmcgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzcyBkZWZpbmluZyByZW5kZXIgdGFyZ2V0cyBhbmQgY2xlYXIgb3BlcmF0aW9uc1xuICAgKiBAcGFyYW0gY2FtZXJhSWQgLSBJZGVudGlmaWVyIGZvciB0aGUgY2FtZXJhIHVzZWQgZm9yIHJlbmRlcmluZ1xuICAgKiBAcGFyYW0geldyaXRlIC0gV2hldGhlciB0byBlbmFibGUgZGVwdGggd3JpdGluZyBkdXJpbmcgcmVuZGVyaW5nXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gYGRlcHRoT25seWAgZHJhd3MgdGhlIHByaW1pdGl2ZSB3aXRoIGEgZGVwdGgtb25seSBwaXBlbGluZSAodGhlIGRlcHRoIHByZXBhc3MpO1xuICAgKiBgYWxsb3dFcXVhbERlcHRoYCBsZXRzIHRoZSBjb2xvciBwYXNzIHBhc3MgdGhlIGRlcHRoIHdyaXR0ZW4gYnkgdGhlIHByZXBhc3NcbiAgICovXG4gIGRyYXcoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgY2FtZXJhSWQ6IG51bWJlcixcbiAgICB6V3JpdGU6IGJvb2xlYW4sXG4gICAgX2Rpc3BsYXlJZHg6IG51bWJlcixcbiAgICBvcHRpb25zOiB7IGRlcHRoT25seT86IGJvb2xlYW47IGFsbG93RXF1YWxEZXB0aD86IGJvb2xlYW4gfSA9IHt9XG4gICkge1xuICAgIGNvbnN0IGlzQnVmZmVyTGVzc1JlbmRlcmluZyA9IHJlbmRlclBhc3MuaXNCdWZmZXJMZXNzUmVuZGVyaW5nTW9kZSgpO1xuICAgIGNvbnN0IFZlcnRleEhhbmRsZXMgPSBwcmltaXRpdmUuX3ZlcnRleEhhbmRsZXM7XG4gICAgaWYgKCFpc0J1ZmZlckxlc3NSZW5kZXJpbmcgJiYgVmVydGV4SGFuZGxlcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IG1lc2hSZW5kZXJlckNvbXBvbmVudEZpbmdlclByaW50ID0gJyc7XG4gICAgbGV0IGRpZmZ1c2VDdWJlTWFwOiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlIHwgdW5kZWZpbmVkO1xuICAgIGxldCBzcGVjdWxhckN1YmVNYXA6IEN1YmVUZXh0dXJlIHwgUmVuZGVyVGFyZ2V0VGV4dHVyZUN1YmUgfCB1bmRlZmluZWQ7XG4gICAgbGV0IHNoZWVuQ3ViZU1hcDogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIWlzQnVmZmVyTGVzc1JlbmRlcmluZykge1xuICAgICAgY29uc3QgbWVzaCA9IHByaW1pdGl2ZS5tZXNoIGFzIE1lc2g7XG4gICAgICBjb25zdCBlbnRpdHkgPSBtZXNoLm1lc2hFbnRpdGllc0lubmVyWzBdOyAvLyBnZXQgYmFzZSBtZXNoIGZvciBpbnN0YW5jaW5nIGRyYXdcbiAgICAgIGNvbnN0IG1lc2hSZW5kZXJlckNvbXBvbmVudCA9IGVudGl0eS5nZXRNZXNoUmVuZGVyZXIoKSE7XG5cbiAgICAgIG1hdGVyaWFsLl9zZXRJbnRlcm5hbFNldHRpbmdQYXJhbWV0ZXJzVG9HcHVXZWJHcHUoe1xuICAgICAgICBlbmdpbmUsXG4gICAgICAgIG1hdGVyaWFsOiBtYXRlcmlhbCxcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgIGNhbWVyYUNvbXBvbmVudFNpZDogY2FtZXJhSWQsXG4gICAgICAgICAgZW50aXR5LFxuICAgICAgICAgIHNwZWN1bGFyQ3ViZTogbWVzaFJlbmRlcmVyQ29tcG9uZW50LnNwZWN1bGFyQ3ViZU1hcCxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgZGlmZnVzZUN1YmVNYXAgPSBtZXNoUmVuZGVyZXJDb21wb25lbnQuZGlmZnVzZUN1YmVNYXA7XG4gICAgICBzcGVjdWxhckN1YmVNYXAgPSBtZXNoUmVuZGVyZXJDb21wb25lbnQuc3BlY3VsYXJDdWJlTWFwO1xuICAgICAgc2hlZW5DdWJlTWFwID0gbWVzaFJlbmRlcmVyQ29tcG9uZW50LnNoZWVuQ3ViZU1hcDtcbiAgICAgIG1lc2hSZW5kZXJlckNvbXBvbmVudEZpbmdlclByaW50ID0gbWVzaFJlbmRlcmVyQ29tcG9uZW50LmdldEZpbmdlclByaW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEEgYnVmZmVyLWxlc3MgZHJhdyAoZS5nLiB0aGUgcmF5bWFyY2hpbmcgZnVsbC1zY3JlZW4gcGFzcykgaGFzIG5vIG1lc2hcbiAgICAgIC8vIHJlbmRlcmVyIGNvbXBvbmVudCwgc28gdGFrZSB0aGUgSUJMIGVudmlyb25tZW50IGZyb20gdGhlIG1hdGVyaWFsLlxuICAgICAgY29uc3QgZGlmZnVzZUVudlZhbHVlID0gbWF0ZXJpYWwuZ2V0VGV4dHVyZVBhcmFtZXRlcihTaGFkZXJTZW1hbnRpY3MuRGlmZnVzZUVudlRleHR1cmUuc3RyKTtcbiAgICAgIGlmIChkaWZmdXNlRW52VmFsdWUgIT0gbnVsbCkge1xuICAgICAgICBkaWZmdXNlQ3ViZU1hcCA9IGRpZmZ1c2VFbnZWYWx1ZVsxXSBhcyBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3BlY3VsYXJFbnZWYWx1ZSA9IG1hdGVyaWFsLmdldFRleHR1cmVQYXJhbWV0ZXIoU2hhZGVyU2VtYW50aWNzLlNwZWN1bGFyRW52VGV4dHVyZS5zdHIpO1xuICAgICAgaWYgKHNwZWN1bGFyRW52VmFsdWUgIT0gbnVsbCkge1xuICAgICAgICBzcGVjdWxhckN1YmVNYXAgPSBzcGVjdWxhckVudlZhbHVlWzFdIGFzIEN1YmVUZXh0dXJlIHwgUmVuZGVyVGFyZ2V0VGV4dHVyZUN1YmU7XG4gICAgICB9XG4gICAgICBjb25zdCBzaGVlbkVudlZhbHVlID0gbWF0ZXJpYWwuZ2V0VGV4dHVyZVBhcmFtZXRlcihTaGFkZXJTZW1hbnRpY3MuU2hlZW5FbnZUZXh0dXJlLnN0cik7XG4gICAgICBpZiAoc2hlZW5FbnZWYWx1ZSAhPSBudWxsKSB7XG4gICAgICAgIHNoZWVuQ3ViZU1hcCA9IHNoZWVuRW52VmFsdWVbMV0gYXMgQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZW5kZXJQaXBlbGluZUlkID0gYCR7cHJpbWl0aXZlLl9nZXRGaW5nZXJQcmludCgpfSAke21hdGVyaWFsLl9nZXRGaW5nZXJQcmludCgpfSAke21hdGVyaWFsLl9fbWF0ZXJpYWxUeXBlTmFtZX0gJHtcbiAgICAgIHJlbmRlclBhc3MucmVuZGVyUGFzc1VJRFxuICAgIH0gJHttZXNoUmVuZGVyZXJDb21wb25lbnRGaW5nZXJQcmludH0gJHt6V3JpdGV9IGA7XG5cbiAgICBjb25zdCBiaW5kR3JvdXBzID0gdGhpcy5fX2dldERyYXdCaW5kR3JvdXBzKGVuZ2luZSwgbWF0ZXJpYWwsIGRpZmZ1c2VDdWJlTWFwLCBzcGVjdWxhckN1YmVNYXAsIHNoZWVuQ3ViZU1hcCk7XG5cbiAgICBjb25zdCBbcGlwZWxpbmUsIF9yZWNyZWF0ZWRdID0gdGhpcy5nZXRPckNyZWF0ZVJlbmRlclBpcGVsaW5lKFxuICAgICAgcmVuZGVyUGlwZWxpbmVJZCxcbiAgICAgIGJpbmRHcm91cHMucGlwZWxpbmVMYXlvdXRLZXksXG4gICAgICBiaW5kR3JvdXBzLnBpcGVsaW5lTGF5b3V0LFxuICAgICAgcHJpbWl0aXZlLFxuICAgICAgbWF0ZXJpYWwsXG4gICAgICByZW5kZXJQYXNzLFxuICAgICAgeldyaXRlLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG5cbiAgICAvLyBUaGUgY29tbWFuZHMgYmVsb3cgYXJlIHJlY29yZGVkIGludG8gYSByZW5kZXIgYnVuZGxlIHRoYXQgaXMgcmVwbGF5ZWQgb24gZXZlcnkgZnJhbWUsIGFuZCB0aGVcbiAgICAvLyBicm93c2VyIHByb2Nlc3NlcyBlYWNoIHJlY29yZGVkIGNvbW1hbmQgYWdhaW4gb24gZXZlcnkgcmVwbGF5LiBTa2lwIGNvbW1hbmRzIHRoYXQgd291bGQgc2V0IHRoZVxuICAgIC8vIHN0YXRlIGFscmVhZHkgc2V0IGJ5IHRoZSBwcmV2aW91cyBkcmF3IG9mIHRoZSBzYW1lIGJ1bmRsZSBlbmNvZGVyLlxuICAgIGNvbnN0IHJlbmRlckJ1bmRsZUVuY29kZXIgPSB0aGlzLl9fcmVuZGVyQnVuZGxlRW5jb2RlciE7XG4gICAgY29uc3QgYm91bmRCaW5kR3JvdXBzID0gdGhpcy5fX2J1bmRsZUJpbmRHcm91cHM7XG4gICAgaWYgKGJvdW5kQmluZEdyb3Vwc1swXSAhPT0gYmluZEdyb3Vwcy5zdG9yYWdlKSB7XG4gICAgICByZW5kZXJCdW5kbGVFbmNvZGVyLnNldEJpbmRHcm91cCgwLCBiaW5kR3JvdXBzLnN0b3JhZ2UpO1xuICAgICAgYm91bmRCaW5kR3JvdXBzWzBdID0gYmluZEdyb3Vwcy5zdG9yYWdlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2J1bmRsZVBpcGVsaW5lICE9PSBwaXBlbGluZSkge1xuICAgICAgcmVuZGVyQnVuZGxlRW5jb2Rlci5zZXRQaXBlbGluZShwaXBlbGluZSk7XG4gICAgICB0aGlzLl9fYnVuZGxlUGlwZWxpbmUgPSBwaXBlbGluZTtcbiAgICB9XG4gICAgaWYgKGJvdW5kQmluZEdyb3Vwc1sxXSAhPT0gYmluZEdyb3Vwcy50ZXh0dXJlKSB7XG4gICAgICByZW5kZXJCdW5kbGVFbmNvZGVyLnNldEJpbmRHcm91cCgxLCBiaW5kR3JvdXBzLnRleHR1cmUpO1xuICAgICAgYm91bmRCaW5kR3JvdXBzWzFdID0gYmluZEdyb3Vwcy50ZXh0dXJlO1xuICAgIH1cbiAgICBpZiAoYm91bmRCaW5kR3JvdXBzWzJdICE9PSBiaW5kR3JvdXBzLnNhbXBsZXIpIHtcbiAgICAgIHJlbmRlckJ1bmRsZUVuY29kZXIuc2V0QmluZEdyb3VwKDIsIGJpbmRHcm91cHMuc2FtcGxlcik7XG4gICAgICBib3VuZEJpbmRHcm91cHNbMl0gPSBiaW5kR3JvdXBzLnNhbXBsZXI7XG4gICAgfVxuICAgIC8vIFdpdGggR1BVIGN1bGxpbmcsIHRoZSBpbnN0YW5jZSB2ZXJ0ZXggYnVmZmVyIGlzIHRoZSByYW5nZSBvZiB0aGUgdmlzaWJsZSBpbnN0YW5jZXMgd3JpdHRlbiBieSB0aGUgY3VsbGluZ1xuICAgIC8vIGNvbXB1dGUgcGFzcyAoc2FtZSBsYXlvdXQgYXMgdGhlIHZhcmlhdGlvbiBWQk8pLCBhbmQgdGhlIGluc3RhbmNlIGNvdW50IGNvbWVzIGZyb20gYW4gaW5kaXJlY3QgYnVmZmVyLlxuICAgIGNvbnN0IGN1bGxlZERyYXcgPSBpc0J1ZmZlckxlc3NSZW5kZXJpbmdcbiAgICAgID8gdW5kZWZpbmVkXG4gICAgICA6IHRoaXMuX19yZWdpc3RlckdwdUN1bGxlZERyYXcoZW5naW5lLCBwcmltaXRpdmUsIHByaW1pdGl2ZS5tZXNoIGFzIE1lc2gsIHJlbmRlclBhc3MsIGNhbWVyYUlkKTtcbiAgICBpZiAoY3VsbGVkRHJhdz8uZGVmb3JtZWRWZXJ0ZXhPZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVGhlIHZlcnRleCBzaGFkZXIgcmVhZHMgdGhlIHZlcnRpY2VzIGRlZm9ybWVkIGJ5IHRoZSBjb21wdXRlIHNoYWRlciBhdCB0aGlzIG9mZnNldCAocHJvY2Vzc0dlb21ldHJ5KS5cbiAgICAgIHRoaXMuX19zZWxlY3REZWZvcm1lZFZlcnRleE9mZnNldChjdWxsZWREcmF3LmRlZm9ybWVkVmVydGV4T2Zmc2V0KTtcbiAgICB9XG4gICAgY29uc3QgZHJhd1BhcmFtZXRlcnNCaW5kR3JvdXAgPSB0aGlzLl9fY3VycmVudERyYXdQYXJhbWV0ZXJzQmluZEdyb3VwITtcbiAgICBpZiAoYm91bmRCaW5kR3JvdXBzWzNdICE9PSBkcmF3UGFyYW1ldGVyc0JpbmRHcm91cCkge1xuICAgICAgcmVuZGVyQnVuZGxlRW5jb2Rlci5zZXRCaW5kR3JvdXAoMywgZHJhd1BhcmFtZXRlcnNCaW5kR3JvdXApO1xuICAgICAgYm91bmRCaW5kR3JvdXBzWzNdID0gZHJhd1BhcmFtZXRlcnNCaW5kR3JvdXA7XG4gICAgfVxuICAgIGlmIChpc0J1ZmZlckxlc3NSZW5kZXJpbmcpIHtcbiAgICAgIHJlbmRlckJ1bmRsZUVuY29kZXIuZHJhdyhyZW5kZXJQYXNzLl9kcmF3VmVydGV4TnVtYmVyRm9yQnVmZmVyTGVzc1JlbmRlcmluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1lc2ggPSBwcmltaXRpdmUubWVzaCBhcyBNZXNoO1xuICAgICAgLy8gVmVydGV4IGFuZCBpbmRleCBkYXRhIGFyZSByYW5nZXMgb2YgYSBmZXcgc2hhcmVkIGJ1ZmZlcnMgKHNlZSBXZWJHcHVCdWZmZXJBcmVuYSkuXG4gICAgICBjb25zdCB2ZXJ0ZXhCdWZmZXJSYW5nZXMgPSB0aGlzLl9fdmVydGV4QnVmZmVyUmFuZ2VzO1xuICAgICAgY29uc3QgYm91bmRWZXJ0ZXhCdWZmZXJzID0gdGhpcy5fX2J1bmRsZVZlcnRleEJ1ZmZlcnM7XG4gICAgICBjb25zdCBpbnN0YW5jZUJ1ZmZlciA9IGN1bGxlZERyYXc/Lmluc3RhbmNlVmVydGV4QnVmZmVyID8/IHZlcnRleEJ1ZmZlclJhbmdlcy5nZXQobWVzaC5fdmFyaWF0aW9uVkJPVWlkKSE7XG4gICAgICBpZiAoYm91bmRWZXJ0ZXhCdWZmZXJzWzBdICE9PSBpbnN0YW5jZUJ1ZmZlcikge1xuICAgICAgICByZW5kZXJCdW5kbGVFbmNvZGVyLnNldFZlcnRleEJ1ZmZlcigwLCBpbnN0YW5jZUJ1ZmZlci5idWZmZXIsIGluc3RhbmNlQnVmZmVyLm9mZnNldCwgaW5zdGFuY2VCdWZmZXIuc2l6ZSk7XG4gICAgICAgIGJvdW5kVmVydGV4QnVmZmVyc1swXSA9IGluc3RhbmNlQnVmZmVyO1xuICAgICAgfVxuICAgICAgY29uc3QgdmJvSGFuZGxlcyA9IFZlcnRleEhhbmRsZXMhLnZib0hhbmRsZXM7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZib0hhbmRsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdmVydGV4QnVmZmVyID0gdmVydGV4QnVmZmVyUmFuZ2VzLmdldCh2Ym9IYW5kbGVzW2ldKSE7XG4gICAgICAgIGlmIChib3VuZFZlcnRleEJ1ZmZlcnNbaSArIDFdICE9PSB2ZXJ0ZXhCdWZmZXIpIHtcbiAgICAgICAgICByZW5kZXJCdW5kbGVFbmNvZGVyLnNldFZlcnRleEJ1ZmZlcihpICsgMSwgdmVydGV4QnVmZmVyLmJ1ZmZlciwgdmVydGV4QnVmZmVyLm9mZnNldCwgdmVydGV4QnVmZmVyLnNpemUpO1xuICAgICAgICAgIGJvdW5kVmVydGV4QnVmZmVyc1tpICsgMV0gPSB2ZXJ0ZXhCdWZmZXI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHByaW1pdGl2ZS5oYXNJbmRpY2VzKCkpIHtcbiAgICAgICAgY29uc3QgaW5kaWNlc0J1ZmZlciA9IHZlcnRleEJ1ZmZlclJhbmdlcy5nZXQoVmVydGV4SGFuZGxlcyEuaWJvSGFuZGxlISkhO1xuICAgICAgICBjb25zdCBpbmRleEJpdFNpemUgPSBwcmltaXRpdmUuZ2V0SW5kZXhCaXRTaXplKCk7XG4gICAgICAgIGlmICh0aGlzLl9fYnVuZGxlSW5kZXhCdWZmZXIgIT09IGluZGljZXNCdWZmZXIgfHwgdGhpcy5fX2J1bmRsZUluZGV4Rm9ybWF0ICE9PSBpbmRleEJpdFNpemUpIHtcbiAgICAgICAgICByZW5kZXJCdW5kbGVFbmNvZGVyLnNldEluZGV4QnVmZmVyKFxuICAgICAgICAgICAgaW5kaWNlc0J1ZmZlci5idWZmZXIsXG4gICAgICAgICAgICBpbmRleEJpdFNpemUsXG4gICAgICAgICAgICBpbmRpY2VzQnVmZmVyLm9mZnNldCxcbiAgICAgICAgICAgIGluZGljZXNCdWZmZXIuc2l6ZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5fX2J1bmRsZUluZGV4QnVmZmVyID0gaW5kaWNlc0J1ZmZlcjtcbiAgICAgICAgICB0aGlzLl9fYnVuZGxlSW5kZXhGb3JtYXQgPSBpbmRleEJpdFNpemU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN1bGxlZERyYXcgIT0gbnVsbCkge1xuICAgICAgICAgIHJlbmRlckJ1bmRsZUVuY29kZXIuZHJhd0luZGV4ZWRJbmRpcmVjdChjdWxsZWREcmF3LmluZGlyZWN0QnVmZmVyLCBjdWxsZWREcmF3LmluZGlyZWN0T2Zmc2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBpbmRpY2VzQWNjZXNzb3IgPSBwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yITtcbiAgICAgICAgICByZW5kZXJCdW5kbGVFbmNvZGVyLmRyYXdJbmRleGVkKGluZGljZXNBY2Nlc3Nvci5lbGVtZW50Q291bnQsIG1lc2gubWVzaEVudGl0aWVzSW5uZXIubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjdWxsZWREcmF3ICE9IG51bGwpIHtcbiAgICAgICAgcmVuZGVyQnVuZGxlRW5jb2Rlci5kcmF3SW5kaXJlY3QoY3VsbGVkRHJhdy5pbmRpcmVjdEJ1ZmZlciwgY3VsbGVkRHJhdy5pbmRpcmVjdE9mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVBY2Nlc3NvcnNbMF0uZWxlbWVudENvdW50O1xuICAgICAgICByZW5kZXJCdW5kbGVFbmNvZGVyLmRyYXcodmVydGV4Q291bnQsIG1lc2gubWVzaEVudGl0aWVzSW5uZXIubGVuZ3RoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSBkcmF3IG9mIGEgcHJpbWl0aXZlIGZvciBHUFUgY3VsbGluZyB3aGVuIGl0IGFwcGxpZXMsIHNvIHRoYXQgaXQgaXMgcmVjb3JkZWQgYXMgYW4gaW5kaXJlY3QgZHJhdy5cbiAgICogVGhlIGNvbmRpdGlvbiBtdXN0IG1hdGNoIHRoZSBvbmUgb2YgdGhlIENQVSBjdWxsaW5nIChNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jdWxsaW5nV2l0aFZpZXdGcnVzdHVtKSwgd2hpY2hcbiAgICoga2VlcHMgdGhlIHByaW1pdGl2ZXMgb2Ygc3VjaCBtZXNoZXMgaW4gdGhlIHJlbmRlciBsaXN0IHJlZ2FyZGxlc3Mgb2YgdGhlaXIgdmlzaWJpbGl0eS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGluZGlyZWN0IGRyYXcsIG9yIHVuZGVmaW5lZCB0byBkcmF3IGV2ZXJ5IGluc3RhbmNlIGRpcmVjdGx5IChHUFUgY3VsbGluZyBkaXNhYmxlZCwgbm90IGFwcGxpY2FibGUsXG4gICAqICAgb3IgaXRzIHRhYmxlcyBhcmUgZnVsbCBmb3IgdGhpcyBmcmFtZSlcbiAgICovXG4gIHByaXZhdGUgX19yZWdpc3RlckdwdUN1bGxlZERyYXcoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgbWVzaDogTWVzaCxcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIGNhbWVyYUlkOiBudW1iZXJcbiAgKTogR3B1Q3VsbGVkRHJhdyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZ3B1Q3VsbGluZyA9IHRoaXMuX19ncHVDdWxsaW5nO1xuICAgIGlmIChcbiAgICAgIGdwdUN1bGxpbmcgPT0gbnVsbCB8fFxuICAgICAgIWdwdUN1bGxpbmcuaXNSZWNvcmRpbmcgfHxcbiAgICAgICFtZXNoLl9pc0dwdUN1bGxhYmxlIHx8XG4gICAgICAhTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9pc0dwdUN1bGxpbmdBY3RpdmUoZW5naW5lLCByZW5kZXJQYXNzKVxuICAgICkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgZWxlbWVudENvdW50ID0gcHJpbWl0aXZlLmhhc0luZGljZXMoKVxuICAgICAgPyBwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yIS5lbGVtZW50Q291bnRcbiAgICAgIDogcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1swXS5lbGVtZW50Q291bnQ7XG4gICAgcmV0dXJuIGdwdUN1bGxpbmcucmVnaXN0ZXJEcmF3KGVuZ2luZSwgbWVzaCwgcHJpbWl0aXZlLCBjYW1lcmFJZCwgZWxlbWVudENvdW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB0aGUgR1BVIGN1bGxpbmcgdGhhdCB0aGUgR1BVIGluc3RhbmNlIGRhdGEgKHRyYW5zZm9ybXMsIHZpc2liaWxpdHksIGNhbWVyYXMpIHdhcyB1cGxvYWRlZCwgc28gdGhlXG4gICAqIGN1bGxpbmcgcnVucyBhZ2FpbiBpbiB0aGlzIGZyYW1lLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9tYXJrR3B1Q3VsbGluZ0lucHV0c0RpcnR5KCkge1xuICAgIHRoaXMuX19ncHVDdWxsaW5nPy5tYXJrSW5wdXRzRGlydHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgR1BVIGN1bGxpbmcgb2YgdGhlIGluc3RhbmNlcywgaWYgaXQgd2FzIGNyZWF0ZWQgKGZvciB0ZXN0cyBhbmQgc3RhdGlzdGljcykuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldEdwdUN1bGxpbmcoKTogV2ViR3B1R3B1Q3VsbGluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19ncHVDdWxsaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSBHUFUgY3VsbGluZyByZXNvdXJjZXMuIFRoZSByZW5kZXIgYnVuZGxlcyByZWNvcmRpbmcgY3VsbGVkIGRyYXdzIGFyZSBkcm9wcGVkIHdpdGggdGhlbS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZGVzdHJveUdwdUN1bGxpbmcoKSB7XG4gICAgaWYgKHRoaXMuX19ncHVDdWxsaW5nID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2NsZWFyUmVuZGVyQnVuZGxlQ2FjaGUoKTtcbiAgICB0aGlzLl9fZ3B1Q3VsbGluZy5kZXN0cm95KCk7XG4gICAgdGhpcy5fX2dwdUN1bGxpbmcgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlbmRlciBidW5kbGUgZW5jb2RlciBmb3IgZWZmaWNpZW50IHJlbmRlcmluZy5cbiAgICogUmVuZGVyIGJ1bmRsZXMgYWxsb3cgcHJlLXJlY29yZGluZyBvZiByZW5kZXJpbmcgY29tbWFuZHMgZm9yIGJldHRlciBwZXJmb3JtYW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgdGhhdCB3aWxsIHVzZSB0aGlzIHJlbmRlciBidW5kbGUgZW5jb2RlclxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldFJlbmRlckJ1bmRsZURlc2NyaXB0b3IoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgcmVuZGVyUGFzczogUmVuZGVyUGFzcyxcbiAgICBkaXNwbGF5SWR4OiBudW1iZXJcbiAgKTogR1BVUmVuZGVyQnVuZGxlRW5jb2RlckRlc2NyaXB0b3Ige1xuICAgIGNvbnN0IGZyYW1lYnVmZmVyID0gcmVuZGVyUGFzcy5nZXRGcmFtZWJ1ZmZlcigpO1xuICAgIGNvbnN0IHJlc29sdmVGcmFtZWJ1ZmZlciA9IHJlbmRlclBhc3MuZ2V0UmVzb2x2ZUZyYW1lYnVmZmVyKCk7XG4gICAgbGV0IGNvbG9yRm9ybWF0czogR1BVVGV4dHVyZUZvcm1hdFtdID0gW107XG4gICAgbGV0IGRlcHRoU3RlbmNpbEZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdCB8IHVuZGVmaW5lZDtcbiAgICBsZXQgc2FtcGxlQ291bnQgPSAxO1xuICAgIGNvbnN0IHdlYnhyU3lzdGVtID0gZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICBpZiAoZnJhbWVidWZmZXIgIT0gbnVsbCkge1xuICAgICAgZm9yIChjb25zdCBjb2xvckF0dGFjaG1lbnQgb2YgZnJhbWVidWZmZXIuY29sb3JBdHRhY2htZW50cykge1xuICAgICAgICBpZiAoY29sb3JBdHRhY2htZW50ID09IG51bGwpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0dXJlUmVzb3VyY2VVaWQgPSAoY29sb3JBdHRhY2htZW50IGFzIHsgX3RleHR1cmVSZXNvdXJjZVVpZD86IFdlYkdMUmVzb3VyY2VIYW5kbGUgfSlcbiAgICAgICAgICAuX3RleHR1cmVSZXNvdXJjZVVpZDtcbiAgICAgICAgaWYgKHRleHR1cmVSZXNvdXJjZVVpZCA9PSBudWxsIHx8IHRleHR1cmVSZXNvdXJjZVVpZCA8IDApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQodGV4dHVyZVJlc291cmNlVWlkKSBhcyBHUFVUZXh0dXJlIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICAgICAgY29sb3JGb3JtYXRzLnB1c2godGV4dHVyZS5mb3JtYXQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXNvbHZlRnJhbWVidWZmZXIgIT0gbnVsbCAmJiBmcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgbXNhYUF0dGFjaG1lbnQgPSBmcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzWzBdIGFzIFJlbmRlckJ1ZmZlciB8IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3Qgc2FtcGxlZENvdW50ID0gbXNhYUF0dGFjaG1lbnQ/LnNhbXBsZUNvdW50O1xuICAgICAgICBpZiAodHlwZW9mIHNhbXBsZWRDb3VudCA9PT0gJ251bWJlcicgJiYgc2FtcGxlZENvdW50ID4gMCkge1xuICAgICAgICAgIHNhbXBsZUNvdW50ID0gc2FtcGxlZENvdW50O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChmcmFtZWJ1ZmZlci5kZXB0aEF0dGFjaG1lbnQgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBkZXB0aFRleHR1cmVVaWQgPSAoZnJhbWVidWZmZXIuZGVwdGhBdHRhY2htZW50IGFzIHsgX3RleHR1cmVSZXNvdXJjZVVpZD86IFdlYkdMUmVzb3VyY2VIYW5kbGUgfSlcbiAgICAgICAgICAuX3RleHR1cmVSZXNvdXJjZVVpZDtcbiAgICAgICAgaWYgKGRlcHRoVGV4dHVyZVVpZCAhPSBudWxsICYmIGRlcHRoVGV4dHVyZVVpZCA+PSAwKSB7XG4gICAgICAgICAgY29uc3QgZGVwdGhUZXh0dXJlID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQoZGVwdGhUZXh0dXJlVWlkKSBhcyBHUFVUZXh0dXJlIHwgdW5kZWZpbmVkO1xuICAgICAgICAgIGRlcHRoU3RlbmNpbEZvcm1hdCA9IGRlcHRoVGV4dHVyZT8uZm9ybWF0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlcHRoU3RlbmNpbEZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVwdGhTdGVuY2lsRm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAod2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlICYmIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWcikge1xuICAgICAgY29uc3QgdmlldyA9IGVuZ2luZS5lbmdpbmVTdGF0ZS54clBvc2VXZWJHUFUhLnZpZXdzW2Rpc3BsYXlJZHhdO1xuICAgICAgY29uc3Qgc3ViSW1hZ2UgPSBlbmdpbmUuZW5naW5lU3RhdGUueHJHcHVCaW5kaW5nLmdldFZpZXdTdWJJbWFnZShcbiAgICAgICAgZW5naW5lLmVuZ2luZVN0YXRlLnhyUHJvamVjdGlvbkxheWVyV2ViR1BVISxcbiAgICAgICAgdmlld1xuICAgICAgKTtcbiAgICAgIGNvbG9yRm9ybWF0cyA9IFtzdWJJbWFnZS5jb2xvclRleHR1cmUuZm9ybWF0XTtcbiAgICAgIGRlcHRoU3RlbmNpbEZvcm1hdCA9IHN1YkltYWdlLmRlcHRoU3RlbmNpbFRleHR1cmUuZm9ybWF0O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2xvckZvcm1hdHMgPSBbbmF2aWdhdG9yLmdwdS5nZXRQcmVmZXJyZWRDYW52YXNGb3JtYXQoKV07XG4gICAgICBkZXB0aFN0ZW5jaWxGb3JtYXQgPSB0aGlzLl9fc3lzdGVtRGVwdGhUZXh0dXJlICE9IG51bGwgPyB0aGlzLl9fc3lzdGVtRGVwdGhUZXh0dXJlLmZvcm1hdCA6IERFRkFVTFRfREVQVEhfRk9STUFUO1xuICAgIH1cblxuICAgIGlmIChjb2xvckZvcm1hdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb2xvckZvcm1hdHMgPSBbbmF2aWdhdG9yLmdwdS5nZXRQcmVmZXJyZWRDYW52YXNGb3JtYXQoKV07XG4gICAgfVxuXG4gICAgY29uc3QgZGVzY3JpcHRvciA9IHtcbiAgICAgIGNvbG9yRm9ybWF0cyxcbiAgICAgIGRlcHRoU3RlbmNpbEZvcm1hdCxcbiAgICAgIHNhbXBsZUNvdW50LFxuICAgIH07XG5cbiAgICByZXR1cm4gZGVzY3JpcHRvcjtcbiAgfVxuXG4gIGdldEVmZmVrc2VlclJlbmRlclBhc3NPcHRpb25zKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHJlbmRlclBhc3M/OiBSZW5kZXJQYXNzLFxuICAgIGRpc3BsYXlJZHggPSAwXG4gICk6IHsgY29sb3JGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0OyBkZXB0aEZvcm1hdD86IEdQVVRleHR1cmVGb3JtYXQgfSB7XG4gICAgaWYgKHJlbmRlclBhc3MgPT0gbnVsbCkge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgY29sb3JGb3JtYXQ6IG5hdmlnYXRvci5ncHUuZ2V0UHJlZmVycmVkQ2FudmFzRm9ybWF0KCksXG4gICAgICAgIGRlcHRoRm9ybWF0OiB1bmRlZmluZWQsXG4gICAgICB9O1xuICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfVxuXG4gICAgY29uc3QgZnJhbWVidWZmZXIgPSByZW5kZXJQYXNzLmdldEZyYW1lYnVmZmVyKCk7XG4gICAgY29uc3QgcmVzb2x2ZUZyYW1lYnVmZmVyID0gcmVuZGVyUGFzcy5nZXRSZXNvbHZlRnJhbWVidWZmZXIoKTtcbiAgICBsZXQgY29sb3JGb3JtYXQ6IEdQVVRleHR1cmVGb3JtYXQgfCB1bmRlZmluZWQ7XG4gICAgaWYgKHJlc29sdmVGcmFtZWJ1ZmZlciAhPSBudWxsICYmIHJlc29sdmVGcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHRleHR1cmVSZXNvdXJjZVVpZCA9IChcbiAgICAgICAgcmVzb2x2ZUZyYW1lYnVmZmVyLmNvbG9yQXR0YWNobWVudHNbMF0gYXMgeyBfdGV4dHVyZVJlc291cmNlVWlkPzogV2ViR0xSZXNvdXJjZUhhbmRsZSB9XG4gICAgICApLl90ZXh0dXJlUmVzb3VyY2VVaWQ7XG4gICAgICBjb25zdCB0ZXh0dXJlID1cbiAgICAgICAgdGV4dHVyZVJlc291cmNlVWlkICE9IG51bGxcbiAgICAgICAgICA/ICh0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldCh0ZXh0dXJlUmVzb3VyY2VVaWQpIGFzIEdQVVRleHR1cmUgfCB1bmRlZmluZWQpXG4gICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICBjb2xvckZvcm1hdCA9IHRleHR1cmU/LmZvcm1hdDtcbiAgICB9IGVsc2UgaWYgKGZyYW1lYnVmZmVyICE9IG51bGwgJiYgZnJhbWVidWZmZXIuY29sb3JBdHRhY2htZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0ZXh0dXJlUmVzb3VyY2VVaWQgPSAoZnJhbWVidWZmZXIuY29sb3JBdHRhY2htZW50c1swXSBhcyB7IF90ZXh0dXJlUmVzb3VyY2VVaWQ/OiBXZWJHTFJlc291cmNlSGFuZGxlIH0pXG4gICAgICAgIC5fdGV4dHVyZVJlc291cmNlVWlkO1xuICAgICAgY29uc3QgdGV4dHVyZSA9XG4gICAgICAgIHRleHR1cmVSZXNvdXJjZVVpZCAhPSBudWxsXG4gICAgICAgICAgPyAodGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQodGV4dHVyZVJlc291cmNlVWlkKSBhcyBHUFVUZXh0dXJlIHwgdW5kZWZpbmVkKVxuICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgY29sb3JGb3JtYXQgPSB0ZXh0dXJlPy5mb3JtYXQ7XG4gICAgfSBlbHNlIGlmIChlbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkPy5pc1dlYlhSTW9kZSAmJiByZW5kZXJQYXNzLmlzT3V0cHV0Rm9yVnIpIHtcbiAgICAgIGNvbnN0IHZpZXcgPSBlbmdpbmUuZW5naW5lU3RhdGUueHJQb3NlV2ViR1BVIS52aWV3c1tkaXNwbGF5SWR4XTtcbiAgICAgIGNvbnN0IHN1YkltYWdlID0gZW5naW5lLmVuZ2luZVN0YXRlLnhyR3B1QmluZGluZy5nZXRWaWV3U3ViSW1hZ2UoXG4gICAgICAgIGVuZ2luZS5lbmdpbmVTdGF0ZS54clByb2plY3Rpb25MYXllcldlYkdQVSEsXG4gICAgICAgIHZpZXdcbiAgICAgICk7XG4gICAgICBjb2xvckZvcm1hdCA9IHN1YkltYWdlLmNvbG9yVGV4dHVyZS5mb3JtYXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbG9yRm9ybWF0ID0gbmF2aWdhdG9yLmdwdS5nZXRQcmVmZXJyZWRDYW52YXNGb3JtYXQoKTtcbiAgICB9XG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIGNvbG9yRm9ybWF0LFxuICAgICAgZGVwdGhGb3JtYXQ6IHVuZGVmaW5lZCxcbiAgICB9O1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9XG5cbiAgZ2V0T3JDcmVhdGVSZW5kZXJQYXNzRW5jb2RlckZvckVmZmVrc2VlckV4dGVybmFsUmVuZGVyaW5nKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgZGlzcGxheUlkeDogbnVtYmVyXG4gICk6IEdQVVJlbmRlclBhc3NFbmNvZGVyIHwgdW5kZWZpbmVkIHtcbiAgICAvLyBFeGVjdXRlcyBhIHBlbmRpbmcgYnVuZGxlIG9mIHRoZSBzYW1lIHJlbmRlciBwYXNzIGludG8gdGhlIG9wZW4gcGFzcywgYXMgYmVmb3JlLlxuICAgIHRoaXMuX19mbHVzaFJlbmRlclBhc3NXb3JrKCk7XG4gICAgaWYgKHRoaXMuX19yZW5kZXJCdW5kbGVFbmNvZGVyICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX19jbGVhclJlbmRlckJ1bmRsZUVuY29kZXIoKTtcbiAgICB9XG5cbiAgICBjb25zdCBmcmFtZWJ1ZmZlciA9IHJlbmRlclBhc3MuZ2V0RnJhbWVidWZmZXIoKTtcbiAgICBjb25zdCByZXNvbHZlRnJhbWVidWZmZXIgPSByZW5kZXJQYXNzLmdldFJlc29sdmVGcmFtZWJ1ZmZlcigpO1xuICAgIGNvbnN0IHdlYnhyU3lzdGVtID0gZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICBjb25zdCBjb2xvckF0dGFjaG1lbnRzOiBHUFVSZW5kZXJQYXNzQ29sb3JBdHRhY2htZW50W10gPSBbXTtcbiAgICBpZiAocmVzb2x2ZUZyYW1lYnVmZmVyICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgY29sb3JBdHRhY2htZW50IG9mIHJlc29sdmVGcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzKSB7XG4gICAgICAgIGNvbnN0IHRleHR1cmVWaWV3ID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQoXG4gICAgICAgICAgY29sb3JBdHRhY2htZW50Ll90ZXh0dXJlVmlld0FzUmVuZGVyVGFyZ2V0UmVzb3VyY2VVaWRcbiAgICAgICAgKSBhcyBHUFVUZXh0dXJlVmlldztcbiAgICAgICAgY29sb3JBdHRhY2htZW50cy5wdXNoKHtcbiAgICAgICAgICB2aWV3OiB0ZXh0dXJlVmlldyxcbiAgICAgICAgICBsb2FkT3A6ICdsb2FkJyxcbiAgICAgICAgICBzdG9yZU9wOiAnc3RvcmUnLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZyYW1lYnVmZmVyICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgY29sb3JBdHRhY2htZW50IG9mIGZyYW1lYnVmZmVyLmNvbG9yQXR0YWNobWVudHMpIHtcbiAgICAgICAgY29uc3QgdGV4dHVyZVZpZXcgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChcbiAgICAgICAgICBjb2xvckF0dGFjaG1lbnQuX3RleHR1cmVWaWV3QXNSZW5kZXJUYXJnZXRSZXNvdXJjZVVpZFxuICAgICAgICApIGFzIEdQVVRleHR1cmVWaWV3O1xuICAgICAgICBjb2xvckF0dGFjaG1lbnRzLnB1c2goe1xuICAgICAgICAgIHZpZXc6IHRleHR1cmVWaWV3LFxuICAgICAgICAgIGxvYWRPcDogJ2xvYWQnLFxuICAgICAgICAgIHN0b3JlT3A6ICdzdG9yZScsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAod2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlICYmIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWcikge1xuICAgICAgY29uc3QgdmlldyA9IGVuZ2luZS5lbmdpbmVTdGF0ZS54clBvc2VXZWJHUFUhLnZpZXdzW2Rpc3BsYXlJZHhdO1xuICAgICAgY29uc3Qgc3ViSW1hZ2UgPSBlbmdpbmUuZW5naW5lU3RhdGUueHJHcHVCaW5kaW5nLmdldFZpZXdTdWJJbWFnZShcbiAgICAgICAgZW5naW5lLmVuZ2luZVN0YXRlLnhyUHJvamVjdGlvbkxheWVyV2ViR1BVISxcbiAgICAgICAgdmlld1xuICAgICAgKTtcbiAgICAgIGNvbG9yQXR0YWNobWVudHMucHVzaCh7XG4gICAgICAgIHZpZXc6IHN1YkltYWdlLmNvbG9yVGV4dHVyZS5jcmVhdGVWaWV3KHN1YkltYWdlLmdldFZpZXdEZXNjcmlwdG9yKCkpLFxuICAgICAgICBsb2FkT3A6ICdsb2FkJyxcbiAgICAgICAgc3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2xvckF0dGFjaG1lbnRzLnB1c2goe1xuICAgICAgICB2aWV3OiB0aGlzLl9fZ2V0Q29udGV4dEN1cnJlbnRUZXh0dXJlVmlldygpLFxuICAgICAgICBsb2FkT3A6ICdsb2FkJyxcbiAgICAgICAgc3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChjb2xvckF0dGFjaG1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvcjogR1BVUmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG4gICAgICBjb2xvckF0dGFjaG1lbnRzLFxuICAgICAgbGFiZWw6IGAke3JlbmRlclBhc3MudW5pcXVlTmFtZX1fRWZmZWtzZWVyRXh0ZXJuYWxgLFxuICAgIH07XG4gICAgdGhpcy5fX2FkZFRpbWVzdGFtcFdyaXRlcyhyZW5kZXJQYXNzRGVzY3JpcHRvcik7XG4gICAgdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyID0gdGhpcy5fX2NvbW1hbmRFbmNvZGVyIS5iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuICAgIHJldHVybiB0aGlzLl9fcmVuZGVyUGFzc0VuY29kZXI7XG4gIH1cblxuICBjcmVhdGVSZW5kZXJCdW5kbGVFbmNvZGVyKGVuZ2luZTogRW5naW5lLCByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLCBkaXNwbGF5SWR4OiBudW1iZXIpIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHJlbmRlckJ1bmRsZURlc2NyaXB0b3IgPSB0aGlzLl9fZ2V0UmVuZGVyQnVuZGxlRGVzY3JpcHRvcihlbmdpbmUsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpO1xuICAgIGNvbnN0IGRlc2NyaXB0b3JLZXkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBjb2xvckZvcm1hdHM6IHJlbmRlckJ1bmRsZURlc2NyaXB0b3IuY29sb3JGb3JtYXRzLFxuICAgICAgZGVwdGhTdGVuY2lsRm9ybWF0OiByZW5kZXJCdW5kbGVEZXNjcmlwdG9yLmRlcHRoU3RlbmNpbEZvcm1hdCA/PyBudWxsLFxuICAgICAgc2FtcGxlQ291bnQ6IHJlbmRlckJ1bmRsZURlc2NyaXB0b3Iuc2FtcGxlQ291bnQsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9fcmVuZGVyQnVuZGxlRW5jb2Rlck93bmVyID0gcmVuZGVyUGFzcztcbiAgICB0aGlzLl9fcmVuZGVyQnVuZGxlRW5jb2RlckRpc3BsYXlJZHggPSBkaXNwbGF5SWR4O1xuICAgIGlmICh0aGlzLl9fcmVuZGVyQnVuZGxlRW5jb2RlciAhPSBudWxsICYmIHRoaXMuX19yZW5kZXJCdW5kbGVFbmNvZGVyS2V5ID09PSBkZXNjcmlwdG9yS2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX3JlbmRlckJ1bmRsZUVuY29kZXIgPSBncHVEZXZpY2UuY3JlYXRlUmVuZGVyQnVuZGxlRW5jb2RlcihyZW5kZXJCdW5kbGVEZXNjcmlwdG9yKTtcbiAgICB0aGlzLl9fcmVuZGVyQnVuZGxlRW5jb2RlcktleSA9IGRlc2NyaXB0b3JLZXk7XG4gICAgdGhpcy5fX3Jlc2V0QnVuZGxlRW5jb2RlclN0YXRlKCk7XG4gICAgLy8gVGhlIEdQVSBjdWxsaW5nIGFsbG9jYXRpb25zIG1hZGUgYnkgdGhlIGRyYXdzIG9mIHRoaXMgZW5jb2RlciBiZWxvbmcgdG8gdGhlIGJ1bmRsZSBpdCBwcm9kdWNlcy5cbiAgICBpZiAoZW5naW5lLmNvbmZpZy5pc0dwdUN1bGxpbmdFbmFibGVkKSB7XG4gICAgICB0aGlzLl9fZ3B1Q3VsbGluZyA/Pz0gbmV3IFdlYkdwdUdwdUN1bGxpbmcoZ3B1RGV2aWNlKTtcbiAgICB9XG4gICAgdGhpcy5fX2dwdUN1bGxpbmc/LmJlZ2luUmVjb3JkaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogRm9yZ2V0cyB0aGUgc3RhdGUgcmVjb3JkZWQgaW50byB0aGUgcmVuZGVyIGJ1bmRsZSBlbmNvZGVyLiBBIG5ldyBlbmNvZGVyIHN0YXJ0cyB3aXRob3V0IGFueVxuICAgKiBwaXBlbGluZSwgYmluZCBncm91cCBvciBidWZmZXIgc2V0LlxuICAgKi9cbiAgcHJpdmF0ZSBfX3Jlc2V0QnVuZGxlRW5jb2RlclN0YXRlKCkge1xuICAgIHRoaXMuX19idW5kbGVQaXBlbGluZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fYnVuZGxlQmluZEdyb3Vwcy5sZW5ndGggPSAwO1xuICAgIHRoaXMuX19idW5kbGVWZXJ0ZXhCdWZmZXJzLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5fX2J1bmRsZUluZGV4QnVmZmVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19idW5kbGVJbmRleEZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVuZGVyIHBhc3MgZW5jb2RlciBmb3IgaW1tZWRpYXRlIHJlbmRlcmluZyBjb21tYW5kcy5cbiAgICogVGhpcyBlbmNvZGVyIGlzIHVzZWQgZm9yIHJlY29yZGluZyByZW5kZXJpbmcgY29tbWFuZHMgdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIGltbWVkaWF0ZWx5LlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzcyBjb25maWd1cmF0aW9uIGluY2x1ZGluZyB0YXJnZXRzIGFuZCBjbGVhciB2YWx1ZXNcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBUaGUgZGlzcGxheSBpbmRleCBmb3Igc3RlcmVvIHJlbmRlcmluZyAoMCBmb3IgbGVmdCBleWUsIDEgZm9yIHJpZ2h0IGV5ZSlcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlUmVuZGVyUGFzc0VuY29kZXIoZW5naW5lOiBFbmdpbmUsIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsIGRpc3BsYXlJZHg6IG51bWJlcikge1xuICAgIGlmIChcbiAgICAgIHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlciAhPSBudWxsICYmXG4gICAgICB0aGlzLl9fcmVuZGVyUGFzc0VuY29kZXJPd25lciA9PT0gcmVuZGVyUGFzcyAmJlxuICAgICAgdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyRGlzcGxheUlkeCA9PT0gZGlzcGxheUlkeCAmJlxuICAgICAgIXRoaXMuX19wZW5kaW5nQ2xlYXIuYWN0aXZlXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRhcmdldFZpZXdzID0gdGhpcy5fX2NhbmRpZGF0ZVJlbmRlclBhc3NUYXJnZXRWaWV3cztcbiAgICBjb25zdCB0YXJnZXRLaW5kID0gdGhpcy5fX2NvbGxlY3RSZW5kZXJQYXNzVGFyZ2V0Vmlld3MoZW5naW5lLCByZW5kZXJQYXNzLCB0YXJnZXRWaWV3cyk7XG5cbiAgICBsZXQgbWVyZ2VQZW5kaW5nQ2xlYXIgPSBmYWxzZTtcbiAgICBjb25zdCBwZW5kaW5nQ2xlYXIgPSB0aGlzLl9fcGVuZGluZ0NsZWFyO1xuICAgIGlmIChwZW5kaW5nQ2xlYXIuYWN0aXZlKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRhcmdldEtpbmQgIT09IFJFTkRFUl9QQVNTX1RBUkdFVF9LSU5EX05PTkUgJiZcbiAgICAgICAgdGFyZ2V0S2luZCA9PT0gcGVuZGluZ0NsZWFyLnRhcmdldEtpbmQgJiZcbiAgICAgICAgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9faXNTYW1lVGFyZ2V0Vmlld3ModGFyZ2V0Vmlld3MsIHBlbmRpbmdDbGVhci50YXJnZXRWaWV3cylcbiAgICAgICkge1xuICAgICAgICAvLyBOb3RoaW5nIGhhcyBiZWVuIGVuY29kZWQgYmV0d2VlbiB0aGUgcGVuZGluZyBjbGVhciBhbmQgdGhpcyByZW5kZXIgcGFzcywgc28gdGhlIGNsZWFyXG4gICAgICAgIC8vIGNhbiBiZSBmb2xkZWQgaW50byB0aGUgbG9hZCBvcHMgb2YgdGhlIHJlbmRlciBwYXNzIHRoYXQgaXMgYmVndW4gYmVsb3cuXG4gICAgICAgIG1lcmdlUGVuZGluZ0NsZWFyID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX19lbmNvZGVQZW5kaW5nQ2xlYXIoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyICE9IG51bGwpIHtcbiAgICAgIGlmIChcbiAgICAgICAgIW1lcmdlUGVuZGluZ0NsZWFyICYmXG4gICAgICAgIHRhcmdldEtpbmQgIT09IFJFTkRFUl9QQVNTX1RBUkdFVF9LSU5EX05PTkUgJiZcbiAgICAgICAgdGFyZ2V0S2luZCA9PT0gdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyVGFyZ2V0S2luZCAmJlxuICAgICAgICAhcmVuZGVyUGFzcy50b0NsZWFyQ29sb3JCdWZmZXIgJiZcbiAgICAgICAgIXJlbmRlclBhc3MudG9DbGVhckRlcHRoQnVmZmVyICYmXG4gICAgICAgIFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fX2lzU2FtZVRhcmdldFZpZXdzKHRhcmdldFZpZXdzLCB0aGlzLl9fcmVuZGVyUGFzc0VuY29kZXJUYXJnZXRWaWV3cylcbiAgICAgICkge1xuICAgICAgICAvLyBTYW1lIGF0dGFjaG1lbnRzIGFuZCBub3RoaW5nIHRvIGNsZWFyOiBrZWVwIGRyYXdpbmcgaW50byB0aGUgb3BlbiByZW5kZXIgcGFzcy5cbiAgICAgICAgdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyT3duZXIgPSByZW5kZXJQYXNzO1xuICAgICAgICB0aGlzLl9fcmVuZGVyUGFzc0VuY29kZXJEaXNwbGF5SWR4ID0gZGlzcGxheUlkeDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2VuZFJlbmRlclBhc3NFbmNvZGVyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2JlZ2luUmVuZGVyUGFzc0VuY29kZXIoZW5naW5lLCByZW5kZXJQYXNzLCBkaXNwbGF5SWR4LCBtZXJnZVBlbmRpbmdDbGVhcik7XG4gICAgaWYgKG1lcmdlUGVuZGluZ0NsZWFyKSB7XG4gICAgICB0aGlzLl9fcmVzZXRQZW5kaW5nQ2xlYXIoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX19yZW5kZXJQYXNzRW5jb2Rlck93bmVyID0gcmVuZGVyUGFzcztcbiAgICAgIHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlckRpc3BsYXlJZHggPSBkaXNwbGF5SWR4O1xuICAgICAgdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyVGFyZ2V0S2luZCA9IHRhcmdldEtpbmQ7XG4gICAgICAvLyBTd2FwIHRoZSBzY3JhdGNoIGFycmF5cyBpbnN0ZWFkIG9mIGNvcHlpbmcgdGhlIHZpZXdzLlxuICAgICAgdGhpcy5fX2NhbmRpZGF0ZVJlbmRlclBhc3NUYXJnZXRWaWV3cyA9IHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlclRhcmdldFZpZXdzO1xuICAgICAgdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyVGFyZ2V0Vmlld3MgPSB0YXJnZXRWaWV3cztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdHMgdGhlIGF0dGFjaG1lbnQgdmlld3MgYF9fYmVnaW5SZW5kZXJQYXNzRW5jb2RlcmAgd291bGQgdXNlIGZvciB0aGUgcmVuZGVyIHBhc3MuXG4gICAqIE11c3QgYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGF0dGFjaG1lbnQgc2VsZWN0aW9uIGluIGBfX2JlZ2luUmVuZGVyUGFzc0VuY29kZXJgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUga2luZCBvZiB0aGUgdGFyZ2V0LCBvciBgUkVOREVSX1BBU1NfVEFSR0VUX0tJTkRfTk9ORWAgaWYgdGhlIHJlbmRlciBwYXNzIG11c3Qgbm90IGJlIG1lcmdlZC5cbiAgICovXG4gIHByaXZhdGUgX19jb2xsZWN0UmVuZGVyUGFzc1RhcmdldFZpZXdzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgb3V0OiAoR1BVVGV4dHVyZVZpZXcgfCB1bmRlZmluZWQpW11cbiAgKTogbnVtYmVyIHtcbiAgICBvdXQubGVuZ3RoID0gMDtcbiAgICBjb25zdCBmcmFtZWJ1ZmZlciA9IHJlbmRlclBhc3MuZ2V0RnJhbWVidWZmZXIoKTtcbiAgICBjb25zdCByZXNvbHZlRnJhbWVidWZmZXIgPSByZW5kZXJQYXNzLmdldFJlc29sdmVGcmFtZWJ1ZmZlcigpO1xuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlcyA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXM7XG5cbiAgICBpZiAocmVzb2x2ZUZyYW1lYnVmZmVyICE9IG51bGwgJiYgZnJhbWVidWZmZXIgIT0gbnVsbCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXNvbHZlRnJhbWVidWZmZXIuY29sb3JBdHRhY2htZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjb2xvckF0dGFjaG1lbnQgPSBmcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzW2ldIGFzIFJlbmRlckJ1ZmZlcjtcbiAgICAgICAgY29uc3QgcmVzb2x2ZUNvbG9yQXR0YWNobWVudCA9IHJlc29sdmVGcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzW2ldIGFzIFJlbmRlckJ1ZmZlcjtcbiAgICAgICAgb3V0LnB1c2god2ViR3B1UmVzb3VyY2VzLmdldChjb2xvckF0dGFjaG1lbnQuX3RleHR1cmVWaWV3QXNSZW5kZXJUYXJnZXRSZXNvdXJjZVVpZCkgYXMgR1BVVGV4dHVyZVZpZXcpO1xuICAgICAgICBvdXQucHVzaCh3ZWJHcHVSZXNvdXJjZXMuZ2V0KHJlc29sdmVDb2xvckF0dGFjaG1lbnQuX3RleHR1cmVWaWV3QXNSZW5kZXJUYXJnZXRSZXNvdXJjZVVpZCkgYXMgR1BVVGV4dHVyZVZpZXcpO1xuICAgICAgfVxuICAgICAgbGV0IGRlcHRoVGV4dHVyZVZpZXcgPSB0aGlzLl9fc3lzdGVtRGVwdGhUZXh0dXJlVmlldztcbiAgICAgIGNvbnN0IGRlcHRoQXR0YWNobWVudCA9IGZyYW1lYnVmZmVyLmRlcHRoQXR0YWNobWVudDtcbiAgICAgIGlmIChkZXB0aEF0dGFjaG1lbnQgIT0gbnVsbCAmJiB3ZWJHcHVSZXNvdXJjZXMuZ2V0KGRlcHRoQXR0YWNobWVudC5fdGV4dHVyZVJlc291cmNlVWlkKSAhPSBudWxsKSB7XG4gICAgICAgIGRlcHRoVGV4dHVyZVZpZXcgPSB3ZWJHcHVSZXNvdXJjZXMuZ2V0KGRlcHRoQXR0YWNobWVudC5fdGV4dHVyZVZpZXdSZXNvdXJjZVVpZCkgYXMgR1BVVGV4dHVyZVZpZXc7XG4gICAgICB9XG4gICAgICBvdXQucHVzaChkZXB0aFRleHR1cmVWaWV3KTtcbiAgICAgIHJldHVybiBSRU5ERVJfUEFTU19UQVJHRVRfS0lORF9NU0FBX1JFU09MVkU7XG4gICAgfVxuXG4gICAgaWYgKGZyYW1lYnVmZmVyICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgY29sb3JBdHRhY2htZW50IG9mIGZyYW1lYnVmZmVyLmNvbG9yQXR0YWNobWVudHMpIHtcbiAgICAgICAgb3V0LnB1c2god2ViR3B1UmVzb3VyY2VzLmdldChjb2xvckF0dGFjaG1lbnQuX3RleHR1cmVWaWV3QXNSZW5kZXJUYXJnZXRSZXNvdXJjZVVpZCkgYXMgR1BVVGV4dHVyZVZpZXcpO1xuICAgICAgfVxuICAgICAgbGV0IGRlcHRoVGV4dHVyZVZpZXc6IEdQVVRleHR1cmVWaWV3IHwgdW5kZWZpbmVkO1xuICAgICAgY29uc3QgZGVwdGhBdHRhY2htZW50ID0gZnJhbWVidWZmZXIuZGVwdGhBdHRhY2htZW50O1xuICAgICAgaWYgKGRlcHRoQXR0YWNobWVudCAhPSBudWxsICYmIHdlYkdwdVJlc291cmNlcy5nZXQoZGVwdGhBdHRhY2htZW50Ll90ZXh0dXJlUmVzb3VyY2VVaWQpICE9IG51bGwpIHtcbiAgICAgICAgZGVwdGhUZXh0dXJlVmlldyA9IHdlYkdwdVJlc291cmNlcy5nZXQoZGVwdGhBdHRhY2htZW50Ll90ZXh0dXJlVmlld0FzUmVuZGVyVGFyZ2V0UmVzb3VyY2VVaWQpIGFzIEdQVVRleHR1cmVWaWV3O1xuICAgICAgfVxuICAgICAgb3V0LnB1c2goZGVwdGhUZXh0dXJlVmlldyk7XG4gICAgICByZXR1cm4gUkVOREVSX1BBU1NfVEFSR0VUX0tJTkRfRlJBTUVCVUZGRVI7XG4gICAgfVxuXG4gICAgaWYgKGVuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ/LmlzV2ViWFJNb2RlICYmIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWcikge1xuICAgICAgLy8gV2ViWFIgc3ViLWltYWdlIHZpZXdzIGFyZSBjcmVhdGVkIHBlciByZW5kZXIgcGFzcywgc28gdGhleSBhcmUgbmV2ZXIgbWVyZ2VkLlxuICAgICAgcmV0dXJuIFJFTkRFUl9QQVNTX1RBUkdFVF9LSU5EX05PTkU7XG4gICAgfVxuXG4gICAgb3V0LnB1c2godGhpcy5fX2dldENvbnRleHRDdXJyZW50VGV4dHVyZVZpZXcoKSk7XG4gICAgb3V0LnB1c2godGhpcy5fX3N5c3RlbURlcHRoVGV4dHVyZVZpZXcpO1xuICAgIHJldHVybiBSRU5ERVJfUEFTU19UQVJHRVRfS0lORF9DQU5WQVM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXR0YWNobWVudCBmb3IgdGhlIGN1cnJlbnQgY2FudmFzIHRleHR1cmUgb2YgdGhpcyBmcmFtZS5cbiAgICpcbiAgICogV2hlbiB0aGUgYnJvd3NlciBhY2NlcHRzIGEgR1BVVGV4dHVyZSB3aGVyZSBhIEdQVVRleHR1cmVWaWV3IGlzIGV4cGVjdGVkICh0aGUgdGV4dHVyZSdzIGRlZmF1bHRcbiAgICogdmlldyBpcyB1c2VkKSwgdGhlIHRleHR1cmUgaXRzZWxmIGlzIHJldHVybmVkLiBUaGlzIHNhdmVzIGEgYGNyZWF0ZVZpZXcoKWAgY2FsbCBwZXIgZnJhbWUuXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0Q29udGV4dEN1cnJlbnRUZXh0dXJlVmlldygpOiBHUFVUZXh0dXJlVmlldyB7XG4gICAgbGV0IHZpZXcgPSB0aGlzLl9fY29udGV4dEN1cnJlbnRUZXh0dXJlVmlldztcbiAgICBpZiAodmlldyA9PSBudWxsKSB7XG4gICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmNvbnRleHQuZ2V0Q3VycmVudFRleHR1cmUoKTtcbiAgICAgIHZpZXcgPSBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX19pc1RleHR1cmVBc0F0dGFjaG1lbnRWaWV3U3VwcG9ydGVkKHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2UpXG4gICAgICAgID8gKHRleHR1cmUgYXMgdW5rbm93biBhcyBHUFVUZXh0dXJlVmlldylcbiAgICAgICAgOiB0ZXh0dXJlLmNyZWF0ZVZpZXcoKTtcbiAgICAgIHRoaXMuX19jb250ZXh0Q3VycmVudFRleHR1cmVWaWV3ID0gdmlldztcbiAgICB9XG4gICAgcmV0dXJuIHZpZXc7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3RleHR1cmVBc0F0dGFjaG1lbnRWaWV3U3VwcG9ydDogYm9vbGVhbiB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogRGV0ZWN0cyBvbmNlIHdoZXRoZXIgYSBHUFVUZXh0dXJlIGNhbiBiZSBwYXNzZWQgYXMgYSByZW5kZXIgcGFzcyBhdHRhY2htZW50IHZpZXcuXG4gICAqIEJyb3dzZXJzIHRoYXQgZG8gbm90IHN1cHBvcnQgaXQgdGhyb3cgYSBUeXBlRXJyb3Igd2hpbGUgY29udmVydGluZyB0aGUgZGVzY3JpcHRvci5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9faXNUZXh0dXJlQXNBdHRhY2htZW50Vmlld1N1cHBvcnRlZChncHVEZXZpY2U6IEdQVURldmljZSk6IGJvb2xlYW4ge1xuICAgIGxldCBzdXBwb3J0ZWQgPSBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX190ZXh0dXJlQXNBdHRhY2htZW50Vmlld1N1cHBvcnQ7XG4gICAgaWYgKHN1cHBvcnRlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gc3VwcG9ydGVkO1xuICAgIH1cbiAgICBsZXQgdGV4dHVyZTogR1BVVGV4dHVyZSB8IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgdGV4dHVyZSA9IGdwdURldmljZS5jcmVhdGVUZXh0dXJlKHtcbiAgICAgICAgc2l6ZTogWzEsIDFdLFxuICAgICAgICBmb3JtYXQ6ICdyZ2JhOHVub3JtJyxcbiAgICAgICAgdXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCxcbiAgICAgIH0pO1xuICAgICAgLy8gVGhlIGVuY29kZXIgaXMgbmV2ZXIgZmluaXNoZWQgb3Igc3VibWl0dGVkLCBzbyB0aGlzIGhhcyBubyBzaWRlIGVmZmVjdCBvbiB0aGUgR1BVLlxuICAgICAgY29uc3QgcGFzcyA9IGdwdURldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpLmJlZ2luUmVuZGVyUGFzcyh7XG4gICAgICAgIGNvbG9yQXR0YWNobWVudHM6IFt7IHZpZXc6IHRleHR1cmUgYXMgdW5rbm93biBhcyBHUFVUZXh0dXJlVmlldywgbG9hZE9wOiAnY2xlYXInLCBzdG9yZU9wOiAnc3RvcmUnIH1dLFxuICAgICAgfSk7XG4gICAgICBwYXNzLmVuZCgpO1xuICAgICAgc3VwcG9ydGVkID0gdHJ1ZTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHN1cHBvcnRlZCA9IGZhbHNlO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0ZXh0dXJlPy5kZXN0cm95KCk7XG4gICAgfVxuICAgIFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fX3RleHR1cmVBc0F0dGFjaG1lbnRWaWV3U3VwcG9ydCA9IHN1cHBvcnRlZDtcbiAgICByZXR1cm4gc3VwcG9ydGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEJlZ2lucyBhIHJlbmRlciBwYXNzIG9uIHRoZSBmcmFtZSdzIGNvbW1hbmQgZW5jb2Rlci4gQSBkZWZlcnJlZCBjbGVhciBvZiB0aGUgc3lzdGVtIGRlcHRoXG4gICAqIHRleHR1cmUgKHNlZSBmbHVzaCgpKSBpcyBhcHBsaWVkIGhlcmUgdG8gdGhlIGZpcnN0IHJlbmRlciBwYXNzIHRoYXQgYXR0YWNoZXMgaXQuXG4gICAqL1xuICBwcml2YXRlIF9fYmVnaW5SZW5kZXJQYXNzKHJlbmRlclBhc3NEZXNjcmlwdG9yOiBHUFVSZW5kZXJQYXNzRGVzY3JpcHRvcik6IEdQVVJlbmRlclBhc3NFbmNvZGVyIHtcbiAgICBjb25zdCBkZWZlcnJlZERlcHRoQ2xlYXJWYWx1ZSA9IHRoaXMuX19kZWZlcnJlZFN5c3RlbURlcHRoQ2xlYXJWYWx1ZTtcbiAgICBpZiAoZGVmZXJyZWREZXB0aENsZWFyVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgZGVwdGhTdGVuY2lsQXR0YWNobWVudCA9IHJlbmRlclBhc3NEZXNjcmlwdG9yLmRlcHRoU3RlbmNpbEF0dGFjaG1lbnQ7XG4gICAgICBpZiAoZGVwdGhTdGVuY2lsQXR0YWNobWVudCAhPSBudWxsICYmIGRlcHRoU3RlbmNpbEF0dGFjaG1lbnQudmlldyA9PT0gdGhpcy5fX3N5c3RlbURlcHRoVGV4dHVyZVZpZXcpIHtcbiAgICAgICAgaWYgKGRlcHRoU3RlbmNpbEF0dGFjaG1lbnQuZGVwdGhMb2FkT3AgPT09ICdsb2FkJykge1xuICAgICAgICAgIGRlcHRoU3RlbmNpbEF0dGFjaG1lbnQuZGVwdGhMb2FkT3AgPSAnY2xlYXInO1xuICAgICAgICAgIGRlcHRoU3RlbmNpbEF0dGFjaG1lbnQuZGVwdGhDbGVhclZhbHVlID0gZGVmZXJyZWREZXB0aENsZWFyVmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX2RlZmVycmVkU3lzdGVtRGVwdGhDbGVhclZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9fYWRkVGltZXN0YW1wV3JpdGVzKHJlbmRlclBhc3NEZXNjcmlwdG9yKTtcbiAgICByZXR1cm4gdGhpcy5fX2NvbW1hbmRFbmNvZGVyIS5iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuICB9XG5cbiAgLyoqIExldHMgdGhlIEdQVSB0aW1lciBtZWFzdXJlIHRoZSByZW5kZXIgcGFzcyB3aGlsZSBhIGZyYW1lIGlzIGJlaW5nIG1lYXN1cmVkLiAqL1xuICBwcml2YXRlIF9fYWRkVGltZXN0YW1wV3JpdGVzKHJlbmRlclBhc3NEZXNjcmlwdG9yOiBHUFVSZW5kZXJQYXNzRGVzY3JpcHRvcikge1xuICAgIGNvbnN0IGdwdVRpbWVyID0gdGhpcy5fX2dwdVRpbWVyO1xuICAgIGlmIChncHVUaW1lciA9PSBudWxsIHx8IHJlbmRlclBhc3NEZXNjcmlwdG9yLnRpbWVzdGFtcFdyaXRlcyAhPSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRpbWVzdGFtcFdyaXRlcyA9IGdwdVRpbWVyLmdldFRpbWVzdGFtcFdyaXRlcyhyZW5kZXJQYXNzRGVzY3JpcHRvci5sYWJlbCA/PyAncmVuZGVyUGFzcycpO1xuICAgIGlmICh0aW1lc3RhbXBXcml0ZXMgIT0gbnVsbCkge1xuICAgICAgcmVuZGVyUGFzc0Rlc2NyaXB0b3IudGltZXN0YW1wV3JpdGVzID0gdGltZXN0YW1wV3JpdGVzO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBHUFUgdGltZXIsIGNyZWF0aW5nIGl0IG9uIGZpcnN0IHVzZS5cbiAgICogQGludGVybmFsIFVzZSBFbmdpbmUuZ3B1VGltZXJFbmFibGVkIGFuZCBFbmdpbmUuZ3B1VGltZU1pbGxpc2Vjb25kcyBpbnN0ZWFkLlxuICAgKi9cbiAgX2dldEdwdVRpbWVyKCk6IFdlYkdwdUdwdVRpbWVyIHtcbiAgICBpZiAodGhpcy5fX2dwdVRpbWVyID09IG51bGwpIHtcbiAgICAgIHRoaXMuX19ncHVUaW1lciA9IG5ldyBXZWJHcHVHcHVUaW1lcih0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19ncHVUaW1lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmNvZGVzIHRoZSBwZW5kaW5nIGNsZWFyIChzZWUgY2xlYXJGcmFtZUJ1ZmZlcikgYXMgYSByZW5kZXIgcGFzcyBvZiBpdHMgb3duLlxuICAgKiBBbnl0aGluZyByZWNvcmRlZCBpbiB0aGUgb3BlbiByZW5kZXIgcGFzcyBoYXBwZW5lZCBiZWZvcmUgdGhlIGNsZWFyLCBzbyBpdCBpcyBlbmRlZCBmaXJzdC5cbiAgICovXG4gIHByaXZhdGUgX19lbmNvZGVQZW5kaW5nQ2xlYXIoKSB7XG4gICAgY29uc3QgcGVuZGluZ0NsZWFyID0gdGhpcy5fX3BlbmRpbmdDbGVhcjtcbiAgICBpZiAoIXBlbmRpbmdDbGVhci5hY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2VuZFJlbmRlclBhc3NFbmNvZGVyKCk7XG4gICAgLy8gVGhlIHBlbmRpbmcgY2xlYXIgY2FycmllcyB0aGUgKHBvc3NpYmx5IG1lcmdlZCkgY2xlYXIgb3BzLiBUaGUgcmVuZGVyIHBhc3MgaXMgb25seSB1c2VkIGZvclxuICAgIC8vIGl0cyBhdHRhY2htZW50cywgaXRzIG93biBjbGVhcnMgYXJlIGFscmVhZHkgcGFydCBvZiB0aGUgcGVuZGluZyBjbGVhci5cbiAgICB0aGlzLl9fYmVnaW5SZW5kZXJQYXNzRW5jb2RlcihwZW5kaW5nQ2xlYXIuZW5naW5lISwgcGVuZGluZ0NsZWFyLnJlbmRlclBhc3MhLCBwZW5kaW5nQ2xlYXIuZGlzcGxheUlkeCwgdHJ1ZSwgZmFsc2UpO1xuICAgIHRoaXMuX19yZXNldFBlbmRpbmdDbGVhcigpO1xuICAgIHRoaXMuX19yZW5kZXJQYXNzRW5jb2Rlcj8uZW5kKCk7XG4gICAgdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3Jlc2V0UGVuZGluZ0NsZWFyKCkge1xuICAgIGNvbnN0IHBlbmRpbmdDbGVhciA9IHRoaXMuX19wZW5kaW5nQ2xlYXI7XG4gICAgcGVuZGluZ0NsZWFyLmFjdGl2ZSA9IGZhbHNlO1xuICAgIHBlbmRpbmdDbGVhci5lbmdpbmUgPSB1bmRlZmluZWQ7XG4gICAgcGVuZGluZ0NsZWFyLnJlbmRlclBhc3MgPSB1bmRlZmluZWQ7XG4gICAgcGVuZGluZ0NsZWFyLnRhcmdldFZpZXdzLmxlbmd0aCA9IDA7XG4gICAgcGVuZGluZ0NsZWFyLmlzQ29sb3JDbGVhciA9IGZhbHNlO1xuICAgIHBlbmRpbmdDbGVhci5pc0RlcHRoQ2xlYXIgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmRzIHRoZSBvcGVuIHJlbmRlciBwYXNzIChpZiBhbnkpIGFuZCBlbmNvZGVzIGEgcGVuZGluZyBjbGVhciwgc28gdGhhdCBjb21tYW5kcyBjYW4gYmUgcmVjb3JkZWRcbiAgICogZGlyZWN0bHkgb24gdGhlIGNvbW1hbmQgZW5jb2RlciAoY29waWVzLCBtaXBtYXAgZ2VuZXJhdGlvbiwgZXh0ZXJuYWwgcmVuZGVyaW5nLCBzdWJtaXNzaW9uKS5cbiAgICovXG4gIHByaXZhdGUgX19mbHVzaFJlbmRlclBhc3NXb3JrKCkge1xuICAgIHRoaXMuX19lbmNvZGVQZW5kaW5nQ2xlYXIoKTtcbiAgICB0aGlzLl9fZW5kUmVuZGVyUGFzc0VuY29kZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBhIHJlbmRlciBidW5kbGUgaW4gdGhlIG9wZW4gcmVuZGVyIHBhc3MuIEJ1bmRsZXMgYXJlIGJhdGNoZWQgYW5kIGV4ZWN1dGVkIHdpdGggYVxuICAgKiBzaW5nbGUgZXhlY3V0ZUJ1bmRsZXMoKSBjYWxsIHdoZW4gdGhlIHBhc3MgaXMgZW5kZWQgb3IgaGFuZGVkIG91dCBmb3IgZGlyZWN0IGRyYXdpbmcuXG4gICAqL1xuICBwcml2YXRlIF9fZXhlY3V0ZVJlbmRlckJ1bmRsZShyZW5kZXJCdW5kbGU6IEdQVVJlbmRlckJ1bmRsZSkge1xuICAgIHRoaXMuX19wZW5kaW5nUmVuZGVyQnVuZGxlcy5wdXNoKHJlbmRlckJ1bmRsZSk7XG4gIH1cblxuICBwcml2YXRlIF9fZXhlY3V0ZVBlbmRpbmdSZW5kZXJCdW5kbGVzKCkge1xuICAgIGNvbnN0IHBlbmRpbmdSZW5kZXJCdW5kbGVzID0gdGhpcy5fX3BlbmRpbmdSZW5kZXJCdW5kbGVzO1xuICAgIGlmIChwZW5kaW5nUmVuZGVyQnVuZGxlcy5sZW5ndGggPT09IDAgfHwgdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyLmV4ZWN1dGVCdW5kbGVzKHBlbmRpbmdSZW5kZXJCdW5kbGVzKTtcbiAgICBwZW5kaW5nUmVuZGVyQnVuZGxlcy5sZW5ndGggPSAwO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19pc1NhbWVUYXJnZXRWaWV3cyhhOiAoR1BVVGV4dHVyZVZpZXcgfCB1bmRlZmluZWQpW10sIGI6IChHUFVUZXh0dXJlVmlldyB8IHVuZGVmaW5lZClbXSkge1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuZHMgdGhlIG9wZW4gcmVuZGVyIHBhc3MgZW5jb2RlciwgaWYgYW55LlxuICAgKlxuICAgKiBBIHBlbmRpbmcgcmVuZGVyIGJ1bmRsZSBlbmNvZGVyIGlzIGV4ZWN1dGVkIGludG8gdGhlIHBhc3Mgb25seSB3aGVuIGl0IHdhcyByZWNvcmRlZCBmb3IgdGhlXG4gICAqIHNhbWUgcmVuZGVyIHBhc3MuIE90aGVyd2lzZSBpdCBiZWxvbmdzIHRvIGEgcmVuZGVyIHBhc3MgdGhhdCBpcyBzdGlsbCBiZWluZyByZWNvcmRlZCAodGhlIG9wZW5cbiAgICogZW5jb2RlciBpcyBqdXN0IGJlaW5nIGtlcHQgZm9yIG1lcmdpbmcpIGFuZCBtdXN0IHN0YXkgcGVuZGluZy5cbiAgICovXG4gIHByaXZhdGUgX19lbmRSZW5kZXJQYXNzRW5jb2RlcigpIHtcbiAgICBjb25zdCByZW5kZXJQYXNzRW5jb2RlciA9IHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlcjtcbiAgICBpZiAocmVuZGVyUGFzc0VuY29kZXIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fZXhlY3V0ZVBlbmRpbmdSZW5kZXJCdW5kbGVzKCk7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX3JlbmRlckJ1bmRsZUVuY29kZXIgIT0gbnVsbCAmJlxuICAgICAgdGhpcy5fX3JlbmRlckJ1bmRsZUVuY29kZXJPd25lciA9PT0gdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyT3duZXIgJiZcbiAgICAgIHRoaXMuX19yZW5kZXJCdW5kbGVFbmNvZGVyRGlzcGxheUlkeCA9PT0gdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyRGlzcGxheUlkeFxuICAgICkge1xuICAgICAgcmVuZGVyUGFzc0VuY29kZXIuZXhlY3V0ZUJ1bmRsZXMoW3RoaXMuX19yZW5kZXJCdW5kbGVFbmNvZGVyLmZpbmlzaCgpXSk7XG4gICAgICB0aGlzLl9fY2xlYXJSZW5kZXJCdW5kbGVFbmNvZGVyKCk7XG4gICAgfVxuICAgIHJlbmRlclBhc3NFbmNvZGVyLmVuZCgpO1xuICAgIHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcmVuZGVyUGFzc0VuY29kZXJPd25lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcmVuZGVyUGFzc0VuY29kZXJEaXNwbGF5SWR4ID0gLTE7XG4gICAgdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyVGFyZ2V0S2luZCA9IFJFTkRFUl9QQVNTX1RBUkdFVF9LSU5EX05PTkU7XG4gIH1cblxuICBwcml2YXRlIF9fY2xlYXJSZW5kZXJCdW5kbGVFbmNvZGVyKCkge1xuICAgIC8vIFRoZSBidW5kbGUgb2YgdGhlIGVuY29kZXIgaXMgZWl0aGVyIGRyb3BwZWQgb3IgZXhlY3V0ZWQgb25jZSB3aXRob3V0IGJlaW5nIGNhY2hlZDogaW4gYm90aCBjYXNlcyB0aGUgR1BVXG4gICAgLy8gY3VsbGluZyBhbGxvY2F0aW9ucyBvZiBpdHMgZHJhd3MgYXJlIHJlbGVhc2VkIGFmdGVyIHRoZSBmcmFtZS5cbiAgICB0aGlzLl9fZ3B1Q3VsbGluZz8uYWJvcnRSZWNvcmRpbmcoKTtcbiAgICB0aGlzLl9fcmVuZGVyQnVuZGxlRW5jb2RlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcmVzZXRCdW5kbGVFbmNvZGVyU3RhdGUoKTtcbiAgICB0aGlzLl9fcmVuZGVyQnVuZGxlRW5jb2RlcktleSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcmVuZGVyQnVuZGxlRW5jb2Rlck93bmVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19yZW5kZXJCdW5kbGVFbmNvZGVyRGlzcGxheUlkeCA9IC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIEJlZ2lucyBhIG5ldyByZW5kZXIgcGFzcyBlbmNvZGVyIGZvciB0aGUgcmVuZGVyIHBhc3MuIFRoZSBjYWxsZXIgbXVzdCBoYXZlIGVuZGVkIGFueSBvcGVuIGVuY29kZXIuXG4gICAqL1xuICBwcml2YXRlIF9fYmVnaW5SZW5kZXJQYXNzRW5jb2RlcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIGRpc3BsYXlJZHg6IG51bWJlcixcbiAgICBtZXJnZVBlbmRpbmdDbGVhcjogYm9vbGVhbixcbiAgICB1c2VPd25DbGVhcnMgPSB0cnVlXG4gICkge1xuICAgIGNvbnN0IGZyYW1lYnVmZmVyID0gcmVuZGVyUGFzcy5nZXRGcmFtZWJ1ZmZlcigpO1xuICAgIGNvbnN0IHJlc29sdmVGcmFtZWJ1ZmZlciA9IHJlbmRlclBhc3MuZ2V0UmVzb2x2ZUZyYW1lYnVmZmVyKCk7XG5cbiAgICAvLyBBIHBlbmRpbmcgY2xlYXIgZm9yIHRoZSBzYW1lIGF0dGFjaG1lbnRzIChzZWUgY2xlYXJGcmFtZUJ1ZmZlcikgaXMgZm9sZGVkIGludG8gdGhlIGxvYWQgb3BzLlxuICAgIC8vIFRoZSByZW5kZXIgcGFzcycgb3duIGNsZWFycyB3aW4gYmVjYXVzZSB0aGV5IHdvdWxkIGhhdmUgYmVlbiBleGVjdXRlZCBhZnRlciB0aGUgcGVuZGluZyBvbmUuXG4gICAgY29uc3QgcGVuZGluZ0NsZWFyID0gbWVyZ2VQZW5kaW5nQ2xlYXIgPyB0aGlzLl9fcGVuZGluZ0NsZWFyIDogdW5kZWZpbmVkO1xuICAgIGxldCBjbGVhclZhbHVlOiBHUFVDb2xvckRpY3QgfCB1bmRlZmluZWQ7XG4gICAgaWYgKHVzZU93bkNsZWFycyAmJiByZW5kZXJQYXNzLnRvQ2xlYXJDb2xvckJ1ZmZlcikge1xuICAgICAgY2xlYXJWYWx1ZSA9IHtcbiAgICAgICAgcjogcmVuZGVyUGFzcy5jbGVhckNvbG9yLngsXG4gICAgICAgIGc6IHJlbmRlclBhc3MuY2xlYXJDb2xvci55LFxuICAgICAgICBiOiByZW5kZXJQYXNzLmNsZWFyQ29sb3IueixcbiAgICAgICAgYTogcmVuZGVyUGFzcy5jbGVhckNvbG9yLncsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAocGVuZGluZ0NsZWFyPy5pc0NvbG9yQ2xlYXIpIHtcbiAgICAgIGNvbnN0IGMgPSBwZW5kaW5nQ2xlYXIuY2xlYXJDb2xvcjtcbiAgICAgIGNsZWFyVmFsdWUgPSB7IHI6IGMuciwgZzogYy5nLCBiOiBjLmIsIGE6IGMuYSB9O1xuICAgIH1cbiAgICBsZXQgZGVwdGhDbGVhclZhbHVlOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgaWYgKHVzZU93bkNsZWFycyAmJiByZW5kZXJQYXNzLnRvQ2xlYXJEZXB0aEJ1ZmZlcikge1xuICAgICAgZGVwdGhDbGVhclZhbHVlID0gcmVuZGVyUGFzcy5jbGVhckRlcHRoO1xuICAgIH0gZWxzZSBpZiAocGVuZGluZ0NsZWFyPy5pc0RlcHRoQ2xlYXIpIHtcbiAgICAgIGRlcHRoQ2xlYXJWYWx1ZSA9IHBlbmRpbmdDbGVhci5jbGVhckRlcHRoO1xuICAgIH1cbiAgICBjb25zdCBjb2xvckxvYWRPcDogR1BVTG9hZE9wID0gY2xlYXJWYWx1ZSAhPSBudWxsID8gJ2NsZWFyJyA6ICdsb2FkJztcbiAgICBjb25zdCBkZXB0aExvYWRPcDogR1BVTG9hZE9wID0gZGVwdGhDbGVhclZhbHVlICE9IG51bGwgPyAnY2xlYXInIDogJ2xvYWQnO1xuXG4gICAgY29uc3Qgd2VieHJTeXN0ZW0gPSBlbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuXG4gICAgaWYgKHJlc29sdmVGcmFtZWJ1ZmZlciAhPSBudWxsICYmIGZyYW1lYnVmZmVyICE9IG51bGwpIHtcbiAgICAgIGxldCBkZXB0aFRleHR1cmVWaWV3ID0gdGhpcy5fX3N5c3RlbURlcHRoVGV4dHVyZVZpZXchO1xuICAgICAgaWYgKGZyYW1lYnVmZmVyLmRlcHRoQXR0YWNobWVudCAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGRlcHRoVGV4dHVyZSA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KGZyYW1lYnVmZmVyLmRlcHRoQXR0YWNobWVudC5fdGV4dHVyZVJlc291cmNlVWlkKSBhcyBHUFVUZXh0dXJlO1xuICAgICAgICBpZiAoZGVwdGhUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgICAgICBkZXB0aFRleHR1cmVWaWV3ID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQoXG4gICAgICAgICAgICBmcmFtZWJ1ZmZlci5kZXB0aEF0dGFjaG1lbnQuX3RleHR1cmVWaWV3UmVzb3VyY2VVaWRcbiAgICAgICAgICApIGFzIEdQVVRleHR1cmVWaWV3O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvcjogR1BVUmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG4gICAgICAgIGNvbG9yQXR0YWNobWVudHM6IFtdLFxuICAgICAgICBkZXB0aFN0ZW5jaWxBdHRhY2htZW50OiB7XG4gICAgICAgICAgdmlldzogZGVwdGhUZXh0dXJlVmlldyxcbiAgICAgICAgICBkZXB0aENsZWFyVmFsdWU6IGRlcHRoQ2xlYXJWYWx1ZSxcbiAgICAgICAgICBkZXB0aExvYWRPcDogZGVwdGhMb2FkT3AsXG4gICAgICAgICAgZGVwdGhTdG9yZU9wOiAnc3RvcmUnLFxuICAgICAgICB9LFxuICAgICAgICBsYWJlbDogcmVuZGVyUGFzcy51bmlxdWVOYW1lLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGNvbG9yQXR0YWNobWVudHM6IEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXNvbHZlRnJhbWVidWZmZXIuY29sb3JBdHRhY2htZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjb2xvckF0dGFjaG1lbnQgPSBmcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzW2ldIGFzIFJlbmRlckJ1ZmZlcjtcbiAgICAgICAgY29uc3QgcmVzb2x2ZUNvbG9yQXR0YWNobWVudCA9IHJlc29sdmVGcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzW2ldIGFzIFJlbmRlckJ1ZmZlcjtcbiAgICAgICAgY29uc3QgdGV4dHVyZVZpZXcgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChcbiAgICAgICAgICBjb2xvckF0dGFjaG1lbnQuX3RleHR1cmVWaWV3QXNSZW5kZXJUYXJnZXRSZXNvdXJjZVVpZFxuICAgICAgICApIGFzIEdQVVRleHR1cmVWaWV3O1xuICAgICAgICBsZXQgcmVzb2x2ZVRleHR1cmVWaWV3ID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQoXG4gICAgICAgICAgcmVzb2x2ZUNvbG9yQXR0YWNobWVudC5fdGV4dHVyZVZpZXdBc1JlbmRlclRhcmdldFJlc291cmNlVWlkXG4gICAgICAgICkgYXMgR1BVVGV4dHVyZVZpZXc7XG4gICAgICAgIGNvbG9yQXR0YWNobWVudHMucHVzaCh7XG4gICAgICAgICAgdmlldzogdGV4dHVyZVZpZXcsXG4gICAgICAgICAgcmVzb2x2ZVRhcmdldDogcmVzb2x2ZVRleHR1cmVWaWV3LFxuICAgICAgICAgIGNsZWFyVmFsdWU6IGNsZWFyVmFsdWUsXG4gICAgICAgICAgbG9hZE9wOiBjb2xvckxvYWRPcCxcbiAgICAgICAgICBzdG9yZU9wOiAnc3RvcmUnLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJlbmRlclBhc3NEZXNjcmlwdG9yLmNvbG9yQXR0YWNobWVudHMgPSBjb2xvckF0dGFjaG1lbnRzIGFzIEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXTtcbiAgICAgIHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlciA9IHRoaXMuX19iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuICAgIH0gZWxzZSBpZiAoZnJhbWVidWZmZXIgIT0gbnVsbCkge1xuICAgICAgbGV0IGRlcHRoVGV4dHVyZVZpZXc6IEdQVVRleHR1cmVWaWV3IHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGZyYW1lYnVmZmVyLmRlcHRoQXR0YWNobWVudCAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGRlcHRoVGV4dHVyZSA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KGZyYW1lYnVmZmVyLmRlcHRoQXR0YWNobWVudC5fdGV4dHVyZVJlc291cmNlVWlkKSBhcyBHUFVUZXh0dXJlO1xuICAgICAgICBpZiAoZGVwdGhUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgICAgICBkZXB0aFRleHR1cmVWaWV3ID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQoXG4gICAgICAgICAgICBmcmFtZWJ1ZmZlci5kZXB0aEF0dGFjaG1lbnQuX3RleHR1cmVWaWV3QXNSZW5kZXJUYXJnZXRSZXNvdXJjZVVpZFxuICAgICAgICAgICkgYXMgR1BVVGV4dHVyZVZpZXc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCBkZXB0aFN0ZW5jaWxBdHRhY2htZW50OiBHUFVSZW5kZXJQYXNzRGVwdGhTdGVuY2lsQXR0YWNobWVudCB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChkZXB0aFRleHR1cmVWaWV3ICE9IG51bGwpIHtcbiAgICAgICAgZGVwdGhTdGVuY2lsQXR0YWNobWVudCA9IHtcbiAgICAgICAgICB2aWV3OiBkZXB0aFRleHR1cmVWaWV3LFxuICAgICAgICAgIGRlcHRoQ2xlYXJWYWx1ZTogZGVwdGhDbGVhclZhbHVlLFxuICAgICAgICAgIGRlcHRoTG9hZE9wOiBkZXB0aExvYWRPcCxcbiAgICAgICAgICBkZXB0aFN0b3JlT3A6ICdzdG9yZScsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvcjogR1BVUmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG4gICAgICAgIGNvbG9yQXR0YWNobWVudHM6IFtdLFxuICAgICAgICBkZXB0aFN0ZW5jaWxBdHRhY2htZW50OiBkZXB0aFN0ZW5jaWxBdHRhY2htZW50LFxuICAgICAgICBsYWJlbDogcmVuZGVyUGFzcy51bmlxdWVOYW1lLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGNvbG9yQXR0YWNobWVudHM6IEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXSA9IFtdO1xuICAgICAgZm9yIChsZXQgY29sb3JBdHRhY2htZW50IG9mIGZyYW1lYnVmZmVyLmNvbG9yQXR0YWNobWVudHMpIHtcbiAgICAgICAgY29uc3QgdGV4dHVyZVZpZXcgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChcbiAgICAgICAgICBjb2xvckF0dGFjaG1lbnQuX3RleHR1cmVWaWV3QXNSZW5kZXJUYXJnZXRSZXNvdXJjZVVpZFxuICAgICAgICApIGFzIEdQVVRleHR1cmVWaWV3O1xuICAgICAgICBjb2xvckF0dGFjaG1lbnRzLnB1c2goe1xuICAgICAgICAgIHZpZXc6IHRleHR1cmVWaWV3LFxuICAgICAgICAgIGNsZWFyVmFsdWU6IGNsZWFyVmFsdWUsXG4gICAgICAgICAgbG9hZE9wOiBjb2xvckxvYWRPcCxcbiAgICAgICAgICBzdG9yZU9wOiAnc3RvcmUnLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJlbmRlclBhc3NEZXNjcmlwdG9yLmNvbG9yQXR0YWNobWVudHMgPSBjb2xvckF0dGFjaG1lbnRzIGFzIEdQVVJlbmRlclBhc3NDb2xvckF0dGFjaG1lbnRbXTtcbiAgICAgIHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlciA9IHRoaXMuX19iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuICAgIH0gZWxzZSBpZiAod2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlICYmIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWcikge1xuICAgICAgY29uc3QgY29sb3JBdHRhY2htZW50czogR1BVUmVuZGVyUGFzc0NvbG9yQXR0YWNobWVudFtdID0gW107XG4gICAgICBjb25zdCB2aWV3ID0gZW5naW5lLmVuZ2luZVN0YXRlLnhyUG9zZVdlYkdQVSEudmlld3NbZGlzcGxheUlkeF07XG4gICAgICBjb25zdCBzdWJJbWFnZSA9IGVuZ2luZS5lbmdpbmVTdGF0ZS54ckdwdUJpbmRpbmcuZ2V0Vmlld1N1YkltYWdlKFxuICAgICAgICBlbmdpbmUuZW5naW5lU3RhdGUueHJQcm9qZWN0aW9uTGF5ZXJXZWJHUFUhLFxuICAgICAgICB2aWV3XG4gICAgICApO1xuICAgICAgY29sb3JBdHRhY2htZW50cy5wdXNoKHtcbiAgICAgICAgdmlldzogc3ViSW1hZ2UuY29sb3JUZXh0dXJlLmNyZWF0ZVZpZXcoc3ViSW1hZ2UuZ2V0Vmlld0Rlc2NyaXB0b3IoKSksXG4gICAgICAgIGNsZWFyVmFsdWU6IGNsZWFyVmFsdWUsXG4gICAgICAgIGxvYWRPcDogY29sb3JMb2FkT3AsXG4gICAgICAgIHN0b3JlT3A6ICdzdG9yZScsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRlcHRoU3RlbmNpbEF0dGFjaG1lbnQ6IEdQVVJlbmRlclBhc3NEZXB0aFN0ZW5jaWxBdHRhY2htZW50ID0ge1xuICAgICAgICB2aWV3OiBzdWJJbWFnZS5kZXB0aFN0ZW5jaWxUZXh0dXJlLmNyZWF0ZVZpZXcoc3ViSW1hZ2UuZ2V0Vmlld0Rlc2NyaXB0b3IoKSksXG4gICAgICAgIGRlcHRoQ2xlYXJWYWx1ZTogZGVwdGhDbGVhclZhbHVlLFxuICAgICAgICBkZXB0aExvYWRPcDogZGVwdGhMb2FkT3AsXG4gICAgICAgIGRlcHRoU3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgIH07XG4gICAgICBjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvcjogR1BVUmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG4gICAgICAgIGNvbG9yQXR0YWNobWVudHM6IGNvbG9yQXR0YWNobWVudHMgYXMgR1BVUmVuZGVyUGFzc0NvbG9yQXR0YWNobWVudFtdLFxuICAgICAgICBkZXB0aFN0ZW5jaWxBdHRhY2htZW50OiBkZXB0aFN0ZW5jaWxBdHRhY2htZW50LFxuICAgICAgfTtcbiAgICAgIHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlciA9IHRoaXMuX19iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2NyaXB0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZW5kZXJQYXNzRGVzY3JpcHRvcjogR1BVUmVuZGVyUGFzc0Rlc2NyaXB0b3IgPSB7XG4gICAgICAgIGNvbG9yQXR0YWNobWVudHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2aWV3OiB0aGlzLl9fZ2V0Q29udGV4dEN1cnJlbnRUZXh0dXJlVmlldygpLFxuICAgICAgICAgICAgY2xlYXJWYWx1ZTogY2xlYXJWYWx1ZSxcbiAgICAgICAgICAgIGxvYWRPcDogY29sb3JMb2FkT3AsXG4gICAgICAgICAgICBzdG9yZU9wOiAnc3RvcmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGRlcHRoU3RlbmNpbEF0dGFjaG1lbnQ6IHtcbiAgICAgICAgICB2aWV3OiB0aGlzLl9fc3lzdGVtRGVwdGhUZXh0dXJlVmlldyEsXG4gICAgICAgICAgZGVwdGhDbGVhclZhbHVlOiBkZXB0aENsZWFyVmFsdWUsXG4gICAgICAgICAgZGVwdGhMb2FkT3A6IGRlcHRoTG9hZE9wLFxuICAgICAgICAgIGRlcHRoU3RvcmVPcDogJ3N0b3JlJyxcbiAgICAgICAgfSxcbiAgICAgICAgbGFiZWw6IHJlbmRlclBhc3MudW5pcXVlTmFtZSxcbiAgICAgIH07XG4gICAgICB0aGlzLl9fcmVuZGVyUGFzc0VuY29kZXIgPSB0aGlzLl9fYmVnaW5SZW5kZXJQYXNzKHJlbmRlclBhc3NEZXNjcmlwdG9yKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHJvcHMgZXZlcnkgY2FjaGVkIHJlbmRlciBidW5kbGUuIFRoZSBHUFUgY3VsbGluZyBhbGxvY2F0aW9ucyBvZiB0aGUgZHJvcHBlZCBidW5kbGVzIGFyZSByZWxlYXNlZCBhZnRlciB0aGVcbiAgICogZnJhbWUgKGEgZHJvcHBlZCBidW5kbGUgbWF5IGFscmVhZHkgaGF2ZSBiZWVuIGV4ZWN1dGVkIGluIGl0KS5cbiAgICovXG4gIHByaXZhdGUgX19jbGVhclJlbmRlckJ1bmRsZUNhY2hlKCkge1xuICAgIHRoaXMuX19yZW5kZXJCdW5kbGVzLmNsZWFyKCk7XG4gICAgdGhpcy5fX2dwdUN1bGxpbmc/LnJldGlyZUFsbEJ1bmRsZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWNoZXMgYSByZWNvcmRlZCByZW5kZXIgYnVuZGxlLCBvciBkcm9wcyB0aGUgY2FjaGUgd2hlbiBjYWNoaW5nIGlzIGRpc2FibGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhY2hlUmVuZGVyQnVuZGxlKGVuZ2luZTogRW5naW5lLCByZW5kZXJCdW5kbGVLZXk6IHN0cmluZywgcmVuZGVyQnVuZGxlOiBHUFVSZW5kZXJCdW5kbGUpIHtcbiAgICBpZiAoZW5naW5lLmNvbmZpZy5jYWNoZVdlYkdwdVJlbmRlckJ1bmRsZXMpIHtcbiAgICAgIHRoaXMuX19ncHVDdWxsaW5nPy5maW5pc2hSZWNvcmRpbmcocmVuZGVyQnVuZGxlS2V5KTtcbiAgICAgIHRoaXMuX19yZW5kZXJCdW5kbGVzLnNldChyZW5kZXJCdW5kbGVLZXksIHJlbmRlckJ1bmRsZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19ncHVDdWxsaW5nPy5maW5pc2hSZWNvcmRpbmcodW5kZWZpbmVkKTtcbiAgICAgIHRoaXMuX19jbGVhclJlbmRlckJ1bmRsZUNhY2hlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3RvQ2xlYXJSZW5kZXJCdW5kbGVzKGVuZ2luZTogRW5naW5lKSB7XG4gICAgLy8gVGhlIGRyYXdzIGFyZSByZWNvcmRlZCBkaWZmZXJlbnRseSB3aXRoIGFuZCB3aXRob3V0IEdQVSBjdWxsaW5nIChzZWUgZHJhdygpKSwgYW5kIHRoZSBDUFUgY3VsbGluZyByZXN1bHRcbiAgICAvLyB0aGF0IHNlbGVjdHMgdGhlIHJlY29yZGVkIHByaW1pdGl2ZXMgZGVwZW5kcyBvbiBib3RoIGZsYWdzIChNZXNoUmVuZGVyZXJDb21wb25lbnQuX2lzR3B1Q3VsbGluZ0FjdGl2ZSkuXG4gICAgaWYgKFxuICAgICAgdGhpcy5fX2lzR3B1Q3VsbGluZ1Jlc2V0UGVuZGluZyB8fFxuICAgICAgZW5naW5lLmNvbmZpZy5pc0dwdUN1bGxpbmdFbmFibGVkICE9PSB0aGlzLl9fbGFzdElzR3B1Q3VsbGluZ0VuYWJsZWQgfHxcbiAgICAgIGVuZ2luZS5jb25maWcuaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkICE9PSB0aGlzLl9fbGFzdElzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZCB8fFxuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9pc0ZydXN0dW1DdWxsaW5nRW5hYmxlZCAhPT0gdGhpcy5fX2xhc3RJc0ZydXN0dW1DdWxsaW5nRW5hYmxlZFxuICAgICkge1xuICAgICAgdGhpcy5fX2NsZWFyUmVuZGVyQnVuZGxlQ2FjaGUoKTtcbiAgICAgIGVuZ2luZS5lbmdpbmVTdGF0ZS53ZWJncHVSZW5kZXJCdW5kbGVNb2RlID0gZmFsc2U7XG4gICAgICB0aGlzLl9faXNHcHVDdWxsaW5nUmVzZXRQZW5kaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLl9fbGFzdElzR3B1Q3VsbGluZ0VuYWJsZWQgPSBlbmdpbmUuY29uZmlnLmlzR3B1Q3VsbGluZ0VuYWJsZWQ7XG4gICAgICB0aGlzLl9fbGFzdElzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZCA9IGVuZ2luZS5jb25maWcuaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkO1xuICAgICAgdGhpcy5fX2xhc3RJc0ZydXN0dW1DdWxsaW5nRW5hYmxlZCA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5faXNGcnVzdHVtQ3VsbGluZ0VuYWJsZWQ7XG4gICAgfVxuICAgIC8vIFJlY29yZGVkIGJ1bmRsZXMgYmluZCBncm91cCAwLCB3aGljaCBtdXN0IGJlIHJlYnVpbHQgd2hlbiBvbmUgb2YgaXRzIGJ1ZmZlcnMgd2FzIHJlcGxhY2VkLlxuICAgIGNvbnN0IHN0b3JhZ2VCaW5kR3JvdXBCdWZmZXJzID0gdGhpcy5fX3N0b3JhZ2VCaW5kR3JvdXBCdWZmZXJzO1xuICAgIGlmIChcbiAgICAgIHRoaXMuX19iaW5kR3JvdXBTdG9yYWdlQnVmZmVyICE9IG51bGwgJiZcbiAgICAgIChzdG9yYWdlQmluZEdyb3VwQnVmZmVyc1swXSAhPT0gdGhpcy5fX3N0b3JhZ2VCdWZmZXIgfHxcbiAgICAgICAgc3RvcmFnZUJpbmRHcm91cEJ1ZmZlcnNbMV0gIT09IHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlciB8fFxuICAgICAgICBzdG9yYWdlQmluZEdyb3VwQnVmZmVyc1syXSAhPT0gdGhpcy5fX3VuaWZvcm1Nb3JwaE9mZnNldHNCdWZmZXIgfHxcbiAgICAgICAgc3RvcmFnZUJpbmRHcm91cEJ1ZmZlcnNbM10gIT09IHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzQnVmZmVyIHx8XG4gICAgICAgIHN0b3JhZ2VCaW5kR3JvdXBCdWZmZXJzWzRdICE9PSB0aGlzLl9fZ2V0RGVmb3JtZWRWZXJ0aWNlc0J1ZmZlcigpKVxuICAgICkge1xuICAgICAgdGhpcy5fX2NsZWFyUmVuZGVyQnVuZGxlQ2FjaGUoKTtcbiAgICAgIGVuZ2luZS5lbmdpbmVTdGF0ZS53ZWJncHVSZW5kZXJCdW5kbGVNb2RlID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIGVuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuYmluZGluZ1N0YXRlVmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RCaW5kaW5nU3RhdGVWZXJzaW9uIHx8XG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudChlbmdpbmUpICE9PSB0aGlzLl9fbGFzdEN1cnJlbnRDYW1lcmFDb21wb25lbnRTaWQgfHxcbiAgICAgIEVudGl0eVJlcG9zaXRvcnkudXBkYXRlQ291bnQgIT09IHRoaXMuX19sYXN0RW50aXR5UmVwb3NpdG9yeVVwZGF0ZUNvdW50IHx8XG4gICAgICBQcmltaXRpdmUudmFyaWFudFVwZGF0ZUNvdW50ICE9PSB0aGlzLl9fbGFzdFByaW1pdGl2ZXNNYXRlcmlhbFZhcmlhbnRVcGRhdGVDb3VudCB8fFxuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50LnVwZGF0ZUNvdW50ICE9PSB0aGlzLl9fbGFzdE1lc2hSZW5kZXJlckNvbXBvbmVudHNVcGRhdGVDb3VudFxuICAgICkge1xuICAgICAgdGhpcy5fX2NsZWFyUmVuZGVyQnVuZGxlQ2FjaGUoKTtcbiAgICAgIGVuZ2luZS5lbmdpbmVTdGF0ZS53ZWJncHVSZW5kZXJCdW5kbGVNb2RlID0gZmFsc2U7XG4gICAgICB0aGlzLl9fbGFzdEN1cnJlbnRDYW1lcmFDb21wb25lbnRTaWQgPSBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudChlbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RCaW5kaW5nU3RhdGVWZXJzaW9uID0gZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5iaW5kaW5nU3RhdGVWZXJzaW9uO1xuICAgICAgdGhpcy5fX2xhc3RFbnRpdHlSZXBvc2l0b3J5VXBkYXRlQ291bnQgPSBFbnRpdHlSZXBvc2l0b3J5LnVwZGF0ZUNvdW50O1xuICAgICAgdGhpcy5fX2xhc3RQcmltaXRpdmVzTWF0ZXJpYWxWYXJpYW50VXBkYXRlQ291bnQgPSBQcmltaXRpdmUudmFyaWFudFVwZGF0ZUNvdW50O1xuICAgICAgdGhpcy5fX2xhc3RNZXNoUmVuZGVyZXJDb21wb25lbnRzVXBkYXRlQ291bnQgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQudXBkYXRlQ291bnQ7XG4gICAgfVxuICB9XG5cbiAgcmVuZGVyV2l0aFJlbmRlckJ1bmRsZShlbmdpbmU6IEVuZ2luZSwgcmVuZGVyUGFzczogUmVuZGVyUGFzcywgZGlzcGxheUlkeDogbnVtYmVyKSB7XG4gICAgdGhpcy5fX3RvQ2xlYXJSZW5kZXJCdW5kbGVzKGVuZ2luZSk7XG4gICAgaWYgKHJlbmRlclBhc3MuX2lzQ2hhbmdlZFNvcnRSZW5kZXJSZXN1bHQgfHwgIWVuZ2luZS5jb25maWcuY2FjaGVXZWJHcHVSZW5kZXJCdW5kbGVzKSB7XG4gICAgICB0aGlzLl9fY2xlYXJSZW5kZXJCdW5kbGVDYWNoZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlbmRlckJ1bmRsZUtleSA9IGAke3JlbmRlclBhc3MucmVuZGVyUGFzc1VJRH0tJHtkaXNwbGF5SWR4fWA7XG4gICAgbGV0IHJlbmRlckJ1bmRsZSA9IHRoaXMuX19yZW5kZXJCdW5kbGVzLmdldChyZW5kZXJCdW5kbGVLZXkpO1xuICAgIGlmIChyZW5kZXJCdW5kbGUgIT0gbnVsbCkge1xuICAgICAgdGhpcy5jcmVhdGVSZW5kZXJQYXNzRW5jb2RlcihlbmdpbmUsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpO1xuXG4gICAgICBpZiAodGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fX2V4ZWN1dGVSZW5kZXJCdW5kbGUocmVuZGVyQnVuZGxlKTtcbiAgICAgICAgLy8gVGhlIHBhc3MgaXMgaW50ZW50aW9uYWxseSBsZWZ0IG9wZW4gc28gdGhhdCBmb2xsb3dpbmcgcmVuZGVyIHBhc3NlcyB0YXJnZXRpbmcgdGhlIHNhbWVcbiAgICAgICAgLy8gYXR0YWNobWVudHMgY2FuIGJlIG1lcmdlZCBpbnRvIGl0LiBJdCBpcyBlbmRlZCBvbiBkZW1hbmQgb3IgaW4gZmx1c2goKS5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmVuZGVyV2l0aFJlbmRlckJ1bmRsZUFuZEtlZXBSZW5kZXJQYXNzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgZGlzcGxheUlkeDogbnVtYmVyXG4gICk6IEdQVVJlbmRlclBhc3NFbmNvZGVyIHwgdW5kZWZpbmVkIHtcbiAgICB0aGlzLl9fdG9DbGVhclJlbmRlckJ1bmRsZXMoZW5naW5lKTtcbiAgICBpZiAocmVuZGVyUGFzcy5faXNDaGFuZ2VkU29ydFJlbmRlclJlc3VsdCB8fCAhZW5naW5lLmNvbmZpZy5jYWNoZVdlYkdwdVJlbmRlckJ1bmRsZXMpIHtcbiAgICAgIHRoaXMuX19jbGVhclJlbmRlckJ1bmRsZUNhY2hlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVuZGVyQnVuZGxlS2V5ID0gYCR7cmVuZGVyUGFzcy5yZW5kZXJQYXNzVUlEfS0ke2Rpc3BsYXlJZHh9YDtcbiAgICBjb25zdCByZW5kZXJCdW5kbGUgPSB0aGlzLl9fcmVuZGVyQnVuZGxlcy5nZXQocmVuZGVyQnVuZGxlS2V5KTtcbiAgICBpZiAocmVuZGVyQnVuZGxlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuY3JlYXRlUmVuZGVyUGFzc0VuY29kZXIoZW5naW5lLCByZW5kZXJQYXNzLCBkaXNwbGF5SWR4KTtcblxuICAgICAgaWYgKHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlciAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuX19leGVjdXRlUmVuZGVyQnVuZGxlKHJlbmRlckJ1bmRsZSk7XG4gICAgICAgIC8vIFRoZSBlbmNvZGVyIGlzIGhhbmRlZCBvdXQgZm9yIGRpcmVjdCBkcmF3aW5nLCBzbyB0aGUgYmF0Y2hlZCBidW5kbGVzIG11c3QgYmUgZXhlY3V0ZWQgbm93LlxuICAgICAgICB0aGlzLl9fZXhlY3V0ZVBlbmRpbmdSZW5kZXJCdW5kbGVzKCk7XG4gICAgICAgIHRoaXMuX19jbGVhclJlbmRlckJ1bmRsZUVuY29kZXIoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgZmluaXNoUmVuZGVyQnVuZGxlRW5jb2RlcihlbmdpbmU6IEVuZ2luZSwgcmVuZGVyUGFzczogUmVuZGVyUGFzcywgZGlzcGxheUlkeDogbnVtYmVyKSB7XG4gICAgdGhpcy5jcmVhdGVSZW5kZXJQYXNzRW5jb2RlcihlbmdpbmUsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpO1xuXG4gICAgaWYgKHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlciAhPSBudWxsICYmIHRoaXMuX19yZW5kZXJCdW5kbGVFbmNvZGVyICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJlbmRlckJ1bmRsZSA9IHRoaXMuX19yZW5kZXJCdW5kbGVFbmNvZGVyLmZpbmlzaCgpO1xuICAgICAgdGhpcy5fX2NhY2hlUmVuZGVyQnVuZGxlKGVuZ2luZSwgYCR7cmVuZGVyUGFzcy5yZW5kZXJQYXNzVUlEfS0ke2Rpc3BsYXlJZHh9YCwgcmVuZGVyQnVuZGxlKTtcbiAgICAgIHRoaXMuX19leGVjdXRlUmVuZGVyQnVuZGxlKHJlbmRlckJ1bmRsZSk7XG4gICAgICAvLyBMZWZ0IG9wZW4gZm9yIG1lcmdpbmcuIFNlZSByZW5kZXJXaXRoUmVuZGVyQnVuZGxlKCkuXG4gICAgICB0aGlzLl9fY2xlYXJSZW5kZXJCdW5kbGVFbmNvZGVyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdyZW5kZXJQYXNzRW5jb2RlciBpcyBudWxsJyk7XG4gICAgfVxuICB9XG5cbiAgZmluaXNoUmVuZGVyQnVuZGxlRW5jb2RlckFuZEtlZXBSZW5kZXJQYXNzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgZGlzcGxheUlkeDogbnVtYmVyXG4gICk6IEdQVVJlbmRlclBhc3NFbmNvZGVyIHwgdW5kZWZpbmVkIHtcbiAgICB0aGlzLmNyZWF0ZVJlbmRlclBhc3NFbmNvZGVyKGVuZ2luZSwgcmVuZGVyUGFzcywgZGlzcGxheUlkeCk7XG5cbiAgICBpZiAodGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyICE9IG51bGwgJiYgdGhpcy5fX3JlbmRlckJ1bmRsZUVuY29kZXIgIT0gbnVsbCkge1xuICAgICAgY29uc3QgcmVuZGVyQnVuZGxlID0gdGhpcy5fX3JlbmRlckJ1bmRsZUVuY29kZXIuZmluaXNoKCk7XG4gICAgICB0aGlzLl9fY2FjaGVSZW5kZXJCdW5kbGUoZW5naW5lLCBgJHtyZW5kZXJQYXNzLnJlbmRlclBhc3NVSUR9LSR7ZGlzcGxheUlkeH1gLCByZW5kZXJCdW5kbGUpO1xuICAgICAgdGhpcy5fX2V4ZWN1dGVSZW5kZXJCdW5kbGUocmVuZGVyQnVuZGxlKTtcbiAgICAgIHRoaXMuX19jbGVhclJlbmRlckJ1bmRsZUVuY29kZXIoKTtcbiAgICB9XG4gICAgLy8gVGhlIGVuY29kZXIgaXMgaGFuZGVkIG91dCBmb3IgZGlyZWN0IGRyYXdpbmcsIHNvIHRoZSBiYXRjaGVkIGJ1bmRsZXMgbXVzdCBiZSBleGVjdXRlZCBub3cuXG4gICAgdGhpcy5fX2V4ZWN1dGVQZW5kaW5nUmVuZGVyQnVuZGxlcygpO1xuXG4gICAgcmV0dXJuIHRoaXMuX19yZW5kZXJQYXNzRW5jb2RlcjtcbiAgfVxuXG4gIGdldE9yQ3JlYXRlUmVuZGVyUGFzc0VuY29kZXJGb3JFeHRlcm5hbFJlbmRlcmluZyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIGRpc3BsYXlJZHg6IG51bWJlclxuICApOiBHUFVSZW5kZXJQYXNzRW5jb2RlciB8IHVuZGVmaW5lZCB7XG4gICAgdGhpcy5jcmVhdGVSZW5kZXJQYXNzRW5jb2RlcihlbmdpbmUsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpO1xuICAgIHRoaXMuX19leGVjdXRlUGVuZGluZ1JlbmRlckJ1bmRsZXMoKTtcbiAgICByZXR1cm4gdGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyO1xuICB9XG5cbiAgZW5kUmVuZGVyUGFzc0VuY29kZXJGb3JFeHRlcm5hbFJlbmRlcmluZygpIHtcbiAgICBpZiAodGhpcy5fX3JlbmRlclBhc3NFbmNvZGVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2V4ZWN1dGVQZW5kaW5nUmVuZGVyQnVuZGxlcygpO1xuICAgIGlmICh0aGlzLl9fcmVuZGVyQnVuZGxlRW5jb2RlciAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fcmVuZGVyUGFzc0VuY29kZXIuZXhlY3V0ZUJ1bmRsZXMoW3RoaXMuX19yZW5kZXJCdW5kbGVFbmNvZGVyLmZpbmlzaCgpXSk7XG4gICAgICB0aGlzLl9fY2xlYXJSZW5kZXJCdW5kbGVFbmNvZGVyKCk7XG4gICAgfVxuICAgIHRoaXMuX19lbmRSZW5kZXJQYXNzRW5jb2RlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldERlcHRoT25seUZyYWdtZW50TW9kdWxlKCk6IEdQVVNoYWRlck1vZHVsZSB7XG4gICAgaWYgKHRoaXMuX19kZXB0aE9ubHlGcmFnbWVudE1vZHVsZSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9fZGVwdGhPbmx5RnJhZ21lbnRNb2R1bGUgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG4gICAgICAgIGxhYmVsOiAnRGVwdGhQcmVwYXNzJyxcbiAgICAgICAgY29kZTogJ0BmcmFnbWVudFxcbmZuIG1haW4oKSB7fVxcbicsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19kZXB0aE9ubHlGcmFnbWVudE1vZHVsZTtcbiAgfVxuXG4gIGdldE9yQ3JlYXRlUmVuZGVyUGlwZWxpbmUoXG4gICAgcmVuZGVyUGlwZWxpbmVJZDogc3RyaW5nLFxuICAgIHBpcGVsaW5lTGF5b3V0S2V5OiBzdHJpbmcsXG4gICAgcGlwZWxpbmVMYXlvdXQ6IEdQVVBpcGVsaW5lTGF5b3V0LFxuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIHpXcml0ZTogYm9vbGVhbixcbiAgICBvcHRpb25zOiB7IGRlcHRoT25seT86IGJvb2xlYW47IGFsbG93RXF1YWxEZXB0aD86IGJvb2xlYW4gfSA9IHt9XG4gICk6IFtHUFVSZW5kZXJQaXBlbGluZSwgYm9vbGVhbl0ge1xuICAgIGNvbnN0IGRlcHRoT25seSA9IG9wdGlvbnMuZGVwdGhPbmx5ID8/IGZhbHNlO1xuICAgIGNvbnN0IGFsbG93RXF1YWxEZXB0aCA9IG9wdGlvbnMuYWxsb3dFcXVhbERlcHRoID8/IGZhbHNlO1xuICAgIC8vIFRoZSBwaXBlbGluZSBsYXlvdXQgaXMgcGFydCBvZiB0aGUga2V5OiBwaXBlbGluZXMgYXJlIGluZGVwZW5kZW50IG9mIGJpbmQgZ3JvdXAgb2JqZWN0cyBhbmQgb25seVxuICAgIC8vIGRlcGVuZCBvbiB0aGVpciBsYXlvdXRzLCB3aGljaCBhcmUgc2hhcmVkIGJ5IGV2ZXJ5IGJpbmQgZ3JvdXAgd2l0aCB0aGUgc2FtZSBsYXlvdXQuXG4gICAgY29uc3QgcGlwZWxpbmVLZXkgPSBgJHtyZW5kZXJQaXBlbGluZUlkfXwke3BpcGVsaW5lTGF5b3V0S2V5fXwke2RlcHRoT25seSA/ICdkZXB0aE9ubHknIDogJ2NvbG9yJ318JHtcbiAgICAgIGFsbG93RXF1YWxEZXB0aCA/ICdlcXVhbCcgOiAnbGVzcydcbiAgICB9YDtcbiAgICBjb25zdCBjYWNoZWRQaXBlbGluZSA9IHRoaXMuX193ZWJHcHVSZW5kZXJQaXBlbGluZU1hcC5nZXQocGlwZWxpbmVLZXkpO1xuICAgIGlmIChjYWNoZWRQaXBlbGluZSAhPSBudWxsICYmIHRoaXMuX19tYXRlcmlhbFN0YXRlVmVyc2lvbk1hcC5nZXQocGlwZWxpbmVLZXkpID09PSBtYXRlcmlhbC5waXBlbGluZVN0YXRlVmVyc2lvbikge1xuICAgICAgcmV0dXJuIFtjYWNoZWRQaXBlbGluZSwgZmFsc2VdO1xuICAgIH1cblxuICAgIC8vIGNvbnN0IHdpZHRoID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmNhbnZhcy53aWR0aDtcbiAgICAvLyBjb25zdCBoZWlnaHQgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuY2FudmFzLmhlaWdodDtcbiAgICAvLyBjb25zdCBiYWNrQnVmZmVyVGV4dHVyZVNpemUgPSBHbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRJbnN0YW5jZSgpLmdldFZhbHVlKFxuICAgIC8vICAgU2hhZGVyU2VtYW50aWNzLkJhY2tCdWZmZXJUZXh0dXJlU2l6ZSxcbiAgICAvLyAgIDBcbiAgICAvLyApIGFzIFZlY3RvcjI7XG4gICAgLy8gYmFja0J1ZmZlclRleHR1cmVTaXplLl92WzBdID0gd2lkdGg7XG4gICAgLy8gYmFja0J1ZmZlclRleHR1cmVTaXplLl92WzFdID0gaGVpZ2h0O1xuXG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcbiAgICBjb25zdCBwcmVzZW50YXRpb25Gb3JtYXQgPSBuYXZpZ2F0b3IuZ3B1LmdldFByZWZlcnJlZENhbnZhc0Zvcm1hdCgpO1xuXG4gICAgY29uc3QgbW9kdWxlcyA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KG1hdGVyaWFsLmdldFNoYWRlclByb2dyYW1VaWQocHJpbWl0aXZlKSkgYXMge1xuICAgICAgdnNNb2R1bGU6IEdQVVNoYWRlck1vZHVsZTtcbiAgICAgIGZzTW9kdWxlOiBHUFVTaGFkZXJNb2R1bGU7XG4gICAgfTtcblxuICAgIGlmIChtb2R1bGVzICE9IG51bGwpIHtcbiAgICAgIG5ldyBFcnJvcignU2hhZGVyIE1vZHVsZXMgaXMgbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgY29uc3QgZ3B1VmVydGV4QnVmZmVyTGF5b3V0czogR1BVVmVydGV4QnVmZmVyTGF5b3V0W10gPSBbXTtcbiAgICBpZiAoIXJlbmRlclBhc3MuaXNCdWZmZXJMZXNzUmVuZGVyaW5nTW9kZSgpKSB7XG4gICAgICBncHVWZXJ0ZXhCdWZmZXJMYXlvdXRzLnB1c2goe1xuICAgICAgICBzdGVwTW9kZTogJ2luc3RhbmNlJyxcbiAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNoYWRlckxvY2F0aW9uOiBWZXJ0ZXhBdHRyaWJ1dGUuSW5zdGFuY2UuZ2V0QXR0cmlidXRlU2xvdCgpLFxuICAgICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgICAgZm9ybWF0OiAndWludDMyeDQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGFycmF5U3RyaWRlOiA0ICogNCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzLmZvckVhY2goKGFjY2Vzc29yOiBBY2Nlc3NvciwgaTogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zdCBzbG90SWR4ID0gVmVydGV4QXR0cmlidXRlLnRvQXR0cmlidXRlU2xvdEZyb21Kb2luZWRTdHJpbmcocHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljc1tpXSk7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSB7XG4gICAgICAgIHNoYWRlckxvY2F0aW9uOiBzbG90SWR4LFxuICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgIGZvcm1hdDogV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fZ2V0VmVydGV4Rm9ybWF0KGFjY2Vzc29yKSxcbiAgICAgIH07XG4gICAgICBncHVWZXJ0ZXhCdWZmZXJMYXlvdXRzLnB1c2goe1xuICAgICAgICBzdGVwTW9kZTogJ3ZlcnRleCcsXG4gICAgICAgIGFycmF5U3RyaWRlOiBwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzW2ldLmFjdHVhbEJ5dGVTdHJpZGUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFthdHRyaWJ1dGVdLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBsZXQgYmxlbmQ6IEdQVUJsZW5kU3RhdGUgfCB1bmRlZmluZWQ7XG4gICAgaWYgKG1hdGVyaWFsLmlzQmxlbmQoKSkge1xuICAgICAgaWYgKG1hdGVyaWFsLmFscGhhTW9kZSA9PT0gQWxwaGFNb2RlLkJsZW5kKSB7XG4gICAgICAgIGJsZW5kID0ge1xuICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICBzcmNGYWN0b3I6IG1hdGVyaWFsLmJsZW5kRnVuY1NyY0ZhY3Rvci53ZWJncHUgYXMgR1BVQmxlbmRGYWN0b3IsXG4gICAgICAgICAgICBkc3RGYWN0b3I6IG1hdGVyaWFsLmJsZW5kRnVuY0RzdEZhY3Rvci53ZWJncHUgYXMgR1BVQmxlbmRGYWN0b3IsXG4gICAgICAgICAgICBvcGVyYXRpb246IG1hdGVyaWFsLmJsZW5kRXF1YXRpb25Nb2RlLndlYmdwdSBhcyBHUFVCbGVuZE9wZXJhdGlvbixcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFscGhhOiB7XG4gICAgICAgICAgICBzcmNGYWN0b3I6IG1hdGVyaWFsLmJsZW5kRnVuY0FscGhhU3JjRmFjdG9yLndlYmdwdSBhcyBHUFVCbGVuZEZhY3RvcixcbiAgICAgICAgICAgIGRzdEZhY3RvcjogbWF0ZXJpYWwuYmxlbmRGdW5jQWxwaGFEc3RGYWN0b3Iud2ViZ3B1IGFzIEdQVUJsZW5kRmFjdG9yLFxuICAgICAgICAgICAgb3BlcmF0aW9uOiBtYXRlcmlhbC5ibGVuZEVxdWF0aW9uTW9kZUFscGhhLndlYmdwdSBhcyBHUFVCbGVuZE9wZXJhdGlvbixcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1vZGUgPSByZW5kZXJQYXNzLmlzQnVmZmVyTGVzc1JlbmRlcmluZ01vZGUoKVxuICAgICAgPyByZW5kZXJQYXNzLl9wcmltaXRpdmVNb2RlRm9yQnVmZmVyTGVzc1JlbmRlcmluZ1xuICAgICAgOiBwcmltaXRpdmUucHJpbWl0aXZlTW9kZTtcbiAgICBjb25zdCB0b3BvbG9neSA9IG1vZGUuZ2V0V2ViR1BVVHlwZVN0cigpO1xuICAgIGxldCBzdHJpcEluZGV4Rm9ybWF0O1xuICAgIGlmIChwcmltaXRpdmUuaGFzSW5kaWNlcygpICYmICh0b3BvbG9neSA9PT0gJ3RyaWFuZ2xlLXN0cmlwJyB8fCB0b3BvbG9neSA9PT0gJ2xpbmUtc3RyaXAnKSkge1xuICAgICAgc3RyaXBJbmRleEZvcm1hdCA9IHByaW1pdGl2ZS5nZXRJbmRleEJpdFNpemUoKTtcbiAgICB9XG4gICAgY29uc3QgZnJhbWVidWZmZXIgPSByZW5kZXJQYXNzLmdldEZyYW1lYnVmZmVyKCk7XG4gICAgbGV0IHRhcmdldHM6IEdQVUNvbG9yVGFyZ2V0U3RhdGVbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgLy8gQGxvY2F0aW9uKDApIGluIGZyYWdtZW50IHNoYWRlclxuICAgICAgICBmb3JtYXQ6IHByZXNlbnRhdGlvbkZvcm1hdCxcbiAgICAgICAgYmxlbmQsXG4gICAgICB9LFxuICAgIF07XG4gICAgbGV0IGRlcHRoU3RlbmNpbEZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdCB8IHVuZGVmaW5lZCA9IERFRkFVTFRfREVQVEhfRk9STUFUO1xuICAgIGlmIChmcmFtZWJ1ZmZlciAhPSBudWxsKSB7XG4gICAgICB0YXJnZXRzID0gW107XG4gICAgICBmb3IgKGxldCBjb2xvckF0dGFjaG1lbnQgb2YgZnJhbWVidWZmZXIuY29sb3JBdHRhY2htZW50cykge1xuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQoY29sb3JBdHRhY2htZW50Ll90ZXh0dXJlUmVzb3VyY2VVaWQpIGFzIEdQVVRleHR1cmU7XG4gICAgICAgIHRhcmdldHMucHVzaCh7XG4gICAgICAgICAgZm9ybWF0OiB0ZXh0dXJlLmZvcm1hdCxcbiAgICAgICAgICBibGVuZCxcbiAgICAgICAgICB3cml0ZU1hc2s6IHRoaXMuc2V0Q29sb3JXcml0ZU1hc2sobWF0ZXJpYWwpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChmcmFtZWJ1ZmZlci5kZXB0aEF0dGFjaG1lbnQgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBkZXB0aFRleHR1cmUgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChmcmFtZWJ1ZmZlci5kZXB0aEF0dGFjaG1lbnQuX3RleHR1cmVSZXNvdXJjZVVpZCkgYXMgR1BVVGV4dHVyZTtcbiAgICAgICAgZGVwdGhTdGVuY2lsRm9ybWF0ID0gZGVwdGhUZXh0dXJlLmZvcm1hdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlcHRoU3RlbmNpbEZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwaXBlbGluZSA9IGdwdURldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG4gICAgICBsYXlvdXQ6IHBpcGVsaW5lTGF5b3V0LFxuICAgICAgdmVydGV4OiB7XG4gICAgICAgIG1vZHVsZTogbW9kdWxlcy52c01vZHVsZSxcbiAgICAgICAgZW50cnlQb2ludDogJ21haW4nLFxuICAgICAgICBidWZmZXJzOiBncHVWZXJ0ZXhCdWZmZXJMYXlvdXRzLFxuICAgICAgfSxcbiAgICAgIGZyYWdtZW50OiB7XG4gICAgICAgIG1vZHVsZTogZGVwdGhPbmx5ID8gdGhpcy5fX2dldERlcHRoT25seUZyYWdtZW50TW9kdWxlKCkgOiBtb2R1bGVzLmZzTW9kdWxlLFxuICAgICAgICBlbnRyeVBvaW50OiAnbWFpbicsXG4gICAgICAgIHRhcmdldHM6IGRlcHRoT25seSA/IHRhcmdldHMubWFwKHRhcmdldCA9PiAoeyBmb3JtYXQ6IHRhcmdldC5mb3JtYXQsIHdyaXRlTWFzazogMCB9KSkgOiB0YXJnZXRzLFxuICAgICAgfSxcbiAgICAgIHByaW1pdGl2ZToge1xuICAgICAgICB0b3BvbG9neTogdG9wb2xvZ3kgYXMgR1BVUHJpbWl0aXZlVG9wb2xvZ3ksXG4gICAgICAgIHN0cmlwSW5kZXhGb3JtYXQ6IHN0cmlwSW5kZXhGb3JtYXQsXG4gICAgICAgIGZyb250RmFjZTogbWF0ZXJpYWwuY3VsbEZyb250RmFjZUNDVyA/ICdjY3cnIDogJ2N3JyxcbiAgICAgICAgY3VsbE1vZGU6IG1hdGVyaWFsLmN1bGxGYWNlID8gKG1hdGVyaWFsLmN1bGxGYWNlQmFjayA/ICdiYWNrJyA6ICdmcm9udCcpIDogJ25vbmUnLFxuICAgICAgfSxcbiAgICAgIGRlcHRoU3RlbmNpbDpcbiAgICAgICAgZGVwdGhTdGVuY2lsRm9ybWF0ID09IG51bGxcbiAgICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICAgIDoge1xuICAgICAgICAgICAgICBkZXB0aFdyaXRlRW5hYmxlZDogZGVwdGhPbmx5ID8gdHJ1ZSA6IHpXcml0ZSxcbiAgICAgICAgICAgICAgZGVwdGhDb21wYXJlOiBkZXB0aE9ubHkgfHwgYWxsb3dFcXVhbERlcHRoID8gJ2xlc3MtZXF1YWwnIDogcmVuZGVyUGFzcy5pc0RlcHRoVGVzdCA/ICdsZXNzJyA6ICdhbHdheXMnLFxuICAgICAgICAgICAgICBmb3JtYXQ6IGRlcHRoU3RlbmNpbEZvcm1hdCxcbiAgICAgICAgICAgIH0sXG4gICAgICBtdWx0aXNhbXBsZToge1xuICAgICAgICBjb3VudDpcbiAgICAgICAgICByZW5kZXJQYXNzLmdldFJlc29sdmVGcmFtZWJ1ZmZlcigpICE9IG51bGxcbiAgICAgICAgICAgID8gKHJlbmRlclBhc3MuZ2V0RnJhbWVidWZmZXIoKSEuY29sb3JBdHRhY2htZW50c1swXSBhcyBSZW5kZXJCdWZmZXIpLnNhbXBsZUNvdW50XG4gICAgICAgICAgICA6IDEsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5fX3dlYkdwdVJlbmRlclBpcGVsaW5lTWFwLnNldChwaXBlbGluZUtleSwgcGlwZWxpbmUpO1xuICAgIHRoaXMuX19tYXRlcmlhbFN0YXRlVmVyc2lvbk1hcC5zZXQocGlwZWxpbmVLZXksIG1hdGVyaWFsLnBpcGVsaW5lU3RhdGVWZXJzaW9uKTtcblxuICAgIHJldHVybiBbcGlwZWxpbmUsIHRydWVdO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1Ym1pdHMgYWxsIHJlY29yZGVkIGNvbW1hbmRzIHRvIHRoZSBHUFUgcXVldWUgYW5kIHJlc2V0cyB0aGUgY29tbWFuZCBlbmNvZGVyLlxuICAgKiBUaGlzIG1ldGhvZCBtdXN0IGJlIGNhbGxlZCB0byBleGVjdXRlIGFueSByZWNvcmRlZCByZW5kZXJpbmcgY29tbWFuZHMuXG4gICAqL1xuICBmbHVzaCgpIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHBlbmRpbmdDbGVhciA9IHRoaXMuX19wZW5kaW5nQ2xlYXI7XG4gICAgaWYgKFxuICAgICAgcGVuZGluZ0NsZWFyLmFjdGl2ZSAmJlxuICAgICAgIXBlbmRpbmdDbGVhci5pc0NvbG9yQ2xlYXIgJiZcbiAgICAgIHBlbmRpbmdDbGVhci50YXJnZXRLaW5kID09PSBSRU5ERVJfUEFTU19UQVJHRVRfS0lORF9DQU5WQVMgJiZcbiAgICAgIHBlbmRpbmdDbGVhci50YXJnZXRWaWV3c1twZW5kaW5nQ2xlYXIudGFyZ2V0Vmlld3MubGVuZ3RoIC0gMV0gPT09IHRoaXMuX19zeXN0ZW1EZXB0aFRleHR1cmVWaWV3XG4gICAgKSB7XG4gICAgICAvLyBBIGRlcHRoLW9ubHkgY2xlYXIgb2YgdGhlIHN5c3RlbSBkZXB0aCB0ZXh0dXJlIHdpdGggbm90aGluZyBkcmF3biBhZnRlciBpdCBpbiB0aGlzIGZyYW1lLlxuICAgICAgLy8gVGhlIHRleHR1cmUgaXMgb25seSBhIHJlbmRlciBhdHRhY2htZW50LCBzbyBpdHMgY29udGVudHMgY2FuIG9ubHkgYmUgb2JzZXJ2ZWQgYnkgbGF0ZXJcbiAgICAgIC8vIHJlbmRlciBwYXNzZXM6IHRoZSBjbGVhciBpcyBkZWZlcnJlZCB0byB0aGUgbmV4dCByZW5kZXIgcGFzcyB0aGF0IGF0dGFjaGVzIGl0XG4gICAgICAvLyAoc2VlIF9fYmVnaW5SZW5kZXJQYXNzKSBpbnN0ZWFkIG9mIGVuY29kaW5nIGEgcmVuZGVyIHBhc3MganVzdCBmb3IgY2xlYXJpbmcuXG4gICAgICB0aGlzLl9fZGVmZXJyZWRTeXN0ZW1EZXB0aENsZWFyVmFsdWUgPSBwZW5kaW5nQ2xlYXIuY2xlYXJEZXB0aDtcbiAgICAgIHRoaXMuX19yZXNldFBlbmRpbmdDbGVhcigpO1xuICAgIH1cbiAgICB0aGlzLl9fZmx1c2hSZW5kZXJQYXNzV29yaygpO1xuICAgIGNvbnN0IGdwdVRpbWVyID0gdGhpcy5fX2dwdVRpbWVyO1xuICAgIGNvbnN0IGdwdUN1bGxpbmcgPSB0aGlzLl9fZ3B1Q3VsbGluZztcbiAgICAvLyBUaGUgY3VsbGluZyBpcyByZWNvcmRlZCBhZnRlciB0aGUgcmVuZGVyIGNvbW1hbmRzICh0aGVpciBkcmF3cyByZWdpc3RlciB3aGF0IHRvIGN1bGwgd2hpbGUgdGhlIGJ1bmRsZXMgYXJlXG4gICAgLy8gcmVjb3JkZWQpLCBidXQgaXQgaXMgc3VibWl0dGVkIGJlZm9yZSB0aGVtLlxuICAgIGNvbnN0IGN1bGxpbmdDb21tYW5kcyA9IGdwdUN1bGxpbmc/LmVuY29kZSh0aGlzLl9fc3RvcmFnZUJ1ZmZlciwgZ3B1VGltZXIsIHtcbiAgICAgIGJsZW5kU2hhcGVEYXRhOiB0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXIsXG4gICAgICBtb3JwaE9mZnNldHM6IHRoaXMuX191bmlmb3JtTW9ycGhPZmZzZXRzQnVmZmVyLFxuICAgICAgbW9ycGhXZWlnaHRzOiB0aGlzLl9fdW5pZm9ybU1vcnBoV2VpZ2h0c0J1ZmZlcixcbiAgICB9KTtcbiAgICBncHVUaW1lcj8uZW5jb2RlUmVzb2x2ZSh0aGlzLl9fY29tbWFuZEVuY29kZXIhKTtcbiAgICBjb25zdCBjb21tYW5kcyA9IHRoaXMuX19jb21tYW5kRW5jb2RlciEuZmluaXNoKCk7XG4gICAgdGhpcy5fX2dwdVF1ZXVlIS5zdWJtaXQoY3VsbGluZ0NvbW1hbmRzICE9IG51bGwgPyBbY3VsbGluZ0NvbW1hbmRzLCBjb21tYW5kc10gOiBbY29tbWFuZHNdKTtcbiAgICBncHVUaW1lcj8uYWZ0ZXJTdWJtaXQoKTtcbiAgICB0aGlzLl9fY29tbWFuZEVuY29kZXIgPSBncHVEZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcbiAgICBpZiAoZ3B1Q3VsbGluZz8uYWZ0ZXJTdWJtaXQoKSkge1xuICAgICAgLy8gVGhlIGN1bGxpbmcgYnVmZmVycyBib3VuZCBpbiB0aGUgYnVuZGxlcyB3ZXJlIHJlcGxhY2VkOiByZS1yZWNvcmQgZXZlcnkgYnVuZGxlIG9uIHRoZSBuZXh0IGZyYW1lLlxuICAgICAgdGhpcy5fX2NsZWFyUmVuZGVyQnVuZGxlQ2FjaGUoKTtcbiAgICAgIHRoaXMuX19pc0dwdUN1bGxpbmdSZXNldFBlbmRpbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9fY29udGV4dEN1cnJlbnRUZXh0dXJlVmlldyAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fY29udGV4dEN1cnJlbnRUZXh0dXJlVmlldyA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICBzZXRDb2xvcldyaXRlTWFzayhtYXRlcmlhbDogTWF0ZXJpYWwpOiBHUFVDb2xvcldyaXRlRmxhZ3Mge1xuICAgIGxldCBmbGFncyA9IDA7XG4gICAgaWYgKG1hdGVyaWFsLmNvbG9yV3JpdGVNYXNrWzBdKSB7XG4gICAgICBmbGFncyB8PSAweDAxO1xuICAgIH1cbiAgICBpZiAobWF0ZXJpYWwuY29sb3JXcml0ZU1hc2tbMV0pIHtcbiAgICAgIGZsYWdzIHw9IDB4MDI7XG4gICAgfVxuICAgIGlmIChtYXRlcmlhbC5jb2xvcldyaXRlTWFza1syXSkge1xuICAgICAgZmxhZ3MgfD0gMHgwNDtcbiAgICB9XG4gICAgaWYgKG1hdGVyaWFsLmNvbG9yV3JpdGVNYXNrWzNdKSB7XG4gICAgICBmbGFncyB8PSAweDA4O1xuICAgIH1cbiAgICByZXR1cm4gZmxhZ3M7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIEN1YmUgVGV4dHVyZSBmcm9tIGltYWdlIGZpbGVzLlxuICAgKiBAcGFyYW0gYmFzZVVyaSB0aGUgYmFzZSB1cmkgdG8gbG9hZCBpbWFnZXM7XG4gICAqIEBwYXJhbSBtaXBMZXZlbENvdW50IHRoZSBudW1iZXIgb2YgbWlwIGxldmVscyAoaW5jbHVkZSByb290IGxldmVsKS4gaWYgbm8gbWlwbWFwLCB0aGUgdmFsdWUgc2hvdWxkIGJlIDE7XG4gICAqIEByZXR1cm5zIHRoZSBXZWJHTFJlc291cmNlSGFuZGxlIGZvciB0aGUgZ2VuZXJhdGVkIEN1YmUgVGV4dHVyZVxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ3ViZVRleHR1cmVGcm9tRmlsZXMoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgYmFzZVVyaTogc3RyaW5nLFxuICAgIG1pcExldmVsQ291bnQ6IENvdW50LFxuICAgIGlzTmFtZVBvc05lZzogYm9vbGVhbixcbiAgICBoZHJpRm9ybWF0OiBIZHJpRm9ybWF0RW51bVxuICApIHtcbiAgICBjb25zdCBpbWFnZUFyZ3M6IEFycmF5PHtcbiAgICAgIHBvc1g6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgbmVnWDogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICBwb3NZOiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgIG5lZ1k6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgcG9zWjogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICBuZWdaOiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICB9PiA9IFtdO1xuICAgIGxldCB3aWR0aCA9IDA7XG4gICAgbGV0IGhlaWdodCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtaXBMZXZlbENvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGxvYWRPbmVMZXZlbCA9ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnRbXSB8IEhUTUxDYW52YXNFbGVtZW50W10+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBsZXQgbG9hZGVkQ291bnQgPSAwO1xuICAgICAgICAgIGNvbnN0IGltYWdlczogSFRNTEltYWdlRWxlbWVudFtdID0gW107XG4gICAgICAgICAgbGV0IGV4dGVuc2lvbiA9ICcuanBnJztcbiAgICAgICAgICBpZiAoaGRyaUZvcm1hdCA9PT0gSGRyaUZvcm1hdC5IRFJfTElORUFSKSB7XG4gICAgICAgICAgICBleHRlbnNpb24gPSAnLmhkcic7XG4gICAgICAgICAgfSBlbHNlIGlmIChoZHJpRm9ybWF0ID09PSBIZHJpRm9ybWF0LlJHQkVfUE5HKSB7XG4gICAgICAgICAgICBleHRlbnNpb24gPSAnLlJHQkUuUE5HJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgcG9zWCA9ICdfcmlnaHRfJztcbiAgICAgICAgICBsZXQgbmVnWCA9ICdfbGVmdF8nO1xuICAgICAgICAgIGxldCBwb3NZID0gJ190b3BfJztcbiAgICAgICAgICBsZXQgbmVnWSA9ICdfYm90dG9tXyc7XG4gICAgICAgICAgbGV0IHBvc1ogPSAnX2Zyb250Xyc7XG4gICAgICAgICAgbGV0IG5lZ1ogPSAnX2JhY2tfJztcbiAgICAgICAgICBpZiAoaXNOYW1lUG9zTmVnKSB7XG4gICAgICAgICAgICBwb3NYID0gJ19wb3N4Xyc7XG4gICAgICAgICAgICBuZWdYID0gJ19uZWd4Xyc7XG4gICAgICAgICAgICBwb3NZID0gJ19wb3N5Xyc7XG4gICAgICAgICAgICBuZWdZID0gJ19uZWd5Xyc7XG4gICAgICAgICAgICBwb3NaID0gJ19wb3N6Xyc7XG4gICAgICAgICAgICBuZWdaID0gJ19uZWd6Xyc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgZmFjZXMgPSBbXG4gICAgICAgICAgICBbYmFzZVVyaSArIHBvc1ggKyBpICsgZXh0ZW5zaW9uLCAncG9zWCddLFxuICAgICAgICAgICAgW2Jhc2VVcmkgKyBuZWdYICsgaSArIGV4dGVuc2lvbiwgJ25lZ1gnXSxcbiAgICAgICAgICAgIFtiYXNlVXJpICsgcG9zWSArIGkgKyBleHRlbnNpb24sICdwb3NZJ10sXG4gICAgICAgICAgICBbYmFzZVVyaSArIG5lZ1kgKyBpICsgZXh0ZW5zaW9uLCAnbmVnWSddLFxuICAgICAgICAgICAgW2Jhc2VVcmkgKyBwb3NaICsgaSArIGV4dGVuc2lvbiwgJ3Bvc1onXSxcbiAgICAgICAgICAgIFtiYXNlVXJpICsgbmVnWiArIGkgKyBleHRlbnNpb24sICduZWdaJ10sXG4gICAgICAgICAgXTtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGZhY2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBjb25zdCBmYWNlID0gZmFjZXNbal1bMV07XG4gICAgICAgICAgICBsZXQgaW1hZ2U6IGFueTtcbiAgICAgICAgICAgIGlmIChoZHJpRm9ybWF0ID09PSBIZHJpRm9ybWF0LkhEUl9MSU5FQVIgfHwgaGRyaUZvcm1hdCA9PT0gSGRyaUZvcm1hdC5SR0I5X0U1X1BORykge1xuICAgICAgICAgICAgICBpbWFnZSA9IG5ldyBIRFJJbWFnZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGltYWdlLmhkcmlGb3JtYXQgPSBoZHJpRm9ybWF0O1xuXG4gICAgICAgICAgICAoaW1hZ2UgYXMgYW55KS5zaWRlID0gZmFjZTtcbiAgICAgICAgICAgIChpbWFnZSBhcyBhbnkpLnVyaSA9IGZhY2VzW2pdWzBdO1xuICAgICAgICAgICAgaW1hZ2UuY3Jvc3NPcmlnaW4gPSAnQW5vbnltb3VzJztcbiAgICAgICAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbG9hZGVkQ291bnQrKztcbiAgICAgICAgICAgICAgaW1hZ2VzLnB1c2goaW1hZ2UpO1xuICAgICAgICAgICAgICBpZiAobG9hZGVkQ291bnQgPT09IDYpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGltYWdlcyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgICByZWplY3QoKGltYWdlIGFzIGFueSkudXJpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWFnZS5zcmMgPSBmYWNlc1tqXVswXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgbGV0IGltYWdlczogSFRNTEltYWdlRWxlbWVudFtdIHwgSFRNTENhbnZhc0VsZW1lbnRbXTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGltYWdlcyA9IGF3YWl0IGxvYWRPbmVMZXZlbCgpO1xuICAgICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgICAgLy8gVHJ5IGFnYWluIG9uY2VcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpbWFnZXMgPSBhd2FpdCBsb2FkT25lTGV2ZWwoKTtcbiAgICAgICAgfSBjYXRjaCAodXJpKSB7XG4gICAgICAgICAgLy8gR2l2ZSB1cFxuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBmYWlsZWQgdG8gbG9hZCAke3VyaX1gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgaW1hZ2VCaXRtYXBzOiBJbWFnZUJpdG1hcFtdIHwgSFRNTENhbnZhc0VsZW1lbnRbXSA9IFtdO1xuICAgICAgZm9yIChjb25zdCBpbWFnZSBvZiBpbWFnZXMhKSB7XG4gICAgICAgIGlmICgoaW1hZ2UgYXMgYW55KS5oZHJpRm9ybWF0ID09PSBIZHJpRm9ybWF0LkhEUl9MSU5FQVIpIHtcbiAgICAgICAgICBpbWFnZUJpdG1hcHMucHVzaChpbWFnZSBhcyBhbnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGF3YWl0IChpbWFnZSBhcyBhbnkpLmRlY29kZSgpO1xuICAgICAgICAgIGNvbnN0IGltYWdlQml0bWFwID0gYXdhaXQgY3JlYXRlSW1hZ2VCaXRtYXAoaW1hZ2UpO1xuICAgICAgICAgIGltYWdlQml0bWFwcy5wdXNoKGltYWdlQml0bWFwIGFzIGFueSk7XG4gICAgICAgICAgKGltYWdlQml0bWFwIGFzIGFueSkuc2lkZSA9IChpbWFnZSBhcyBhbnkpLnNpZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGltYWdlT2JqOiB7XG4gICAgICAgIHBvc1g/OiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgICAgbmVnWD86IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICBwb3NZPzogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICAgIG5lZ1k/OiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgICAgcG9zWj86IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICBuZWdaPzogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICB9ID0ge307XG4gICAgICBmb3IgKGNvbnN0IGltYWdlQml0bWFwIG9mIGltYWdlQml0bWFwcykge1xuICAgICAgICBzd2l0Y2ggKChpbWFnZUJpdG1hcCBhcyBhbnkpLnNpZGUpIHtcbiAgICAgICAgICBjYXNlICdwb3NYJzpcbiAgICAgICAgICAgIGltYWdlT2JqLnBvc1ggPSBpbWFnZUJpdG1hcDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3Bvc1knOlxuICAgICAgICAgICAgaW1hZ2VPYmoucG9zWSA9IGltYWdlQml0bWFwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncG9zWic6XG4gICAgICAgICAgICBpbWFnZU9iai5wb3NaID0gaW1hZ2VCaXRtYXA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICduZWdYJzpcbiAgICAgICAgICAgIGltYWdlT2JqLm5lZ1ggPSBpbWFnZUJpdG1hcDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ25lZ1knOlxuICAgICAgICAgICAgaW1hZ2VPYmoubmVnWSA9IGltYWdlQml0bWFwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbmVnWic6XG4gICAgICAgICAgICBpbWFnZU9iai5uZWdaID0gaW1hZ2VCaXRtYXA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgIHdpZHRoID0gaW1hZ2VCaXRtYXAud2lkdGg7XG4gICAgICAgICAgaGVpZ2h0ID0gaW1hZ2VCaXRtYXAuaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpbWFnZUFyZ3MucHVzaChcbiAgICAgICAgaW1hZ2VPYmogYXMge1xuICAgICAgICAgIHBvc1g6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIG5lZ1g6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIHBvc1k6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIG5lZ1k6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIHBvc1o6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICAgIG5lZ1o6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBbcmVzb3VyY2VIYW5kbGUsIHNhbXBsZXJdID0gdGhpcy5jcmVhdGVDdWJlVGV4dHVyZShlbmdpbmUsIG1pcExldmVsQ291bnQsIGltYWdlQXJncywgd2lkdGgsIGhlaWdodCk7XG4gICAgcmV0dXJuIFtyZXNvdXJjZUhhbmRsZSwgc2FtcGxlciwgd2lkdGgsIGhlaWdodF0gYXMgW251bWJlciwgU2FtcGxlciwgbnVtYmVyLCBudW1iZXJdO1xuICB9XG5cbiAgLyoqXG4gICAqIGNyZWF0ZSBhIEN1YmVUZXh0dXJlXG4gICAqXG4gICAqIEBwYXJhbSBtaXBMZXZlbENvdW50XG4gICAqIEBwYXJhbSBpbWFnZXNcbiAgICogQHBhcmFtIHdpZHRoXG4gICAqIEBwYXJhbSBoZWlnaHRcbiAgICogQHJldHVybnMgcmVzb3VyY2UgaGFuZGxlXG4gICAqL1xuICBjcmVhdGVDdWJlVGV4dHVyZShcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtaXBMZXZlbENvdW50OiBDb3VudCxcbiAgICBpbWFnZXM6IEFycmF5PHtcbiAgICAgIHBvc1g6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgbmVnWDogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICBwb3NZOiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICAgIG5lZ1k6IERpcmVjdFRleHR1cmVEYXRhO1xuICAgICAgcG9zWjogRGlyZWN0VGV4dHVyZURhdGE7XG4gICAgICBuZWdaOiBEaXJlY3RUZXh0dXJlRGF0YTtcbiAgICB9PixcbiAgICB3aWR0aDogU2l6ZSxcbiAgICBoZWlnaHQ6IFNpemVcbiAgKTogW251bWJlciwgU2FtcGxlcl0ge1xuICAgIGNvbnN0IG1pcG1hcHM6IChJbWFnZUJpdG1hcCB8IEhUTUxDYW52YXNFbGVtZW50KVtdW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1pcExldmVsQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgaW1hZ2VCaXRtYXBzOiAoSW1hZ2VCaXRtYXAgfCBIVE1MQ2FudmFzRWxlbWVudClbXSA9IFtdO1xuICAgICAgaWYgKGltYWdlc1tpXS5wb3NYIGluc3RhbmNlb2YgSW1hZ2VCaXRtYXAgfHwgaW1hZ2VzWzBdLnBvc1ggaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuICAgICAgICBpbWFnZUJpdG1hcHMucHVzaChpbWFnZXNbaV0ucG9zWCBhcyBhbnkpO1xuICAgICAgICBpbWFnZUJpdG1hcHMucHVzaChpbWFnZXNbaV0ubmVnWCBhcyBhbnkpO1xuICAgICAgICBpbWFnZUJpdG1hcHMucHVzaChpbWFnZXNbaV0ucG9zWSBhcyBhbnkpO1xuICAgICAgICBpbWFnZUJpdG1hcHMucHVzaChpbWFnZXNbaV0ubmVnWSBhcyBhbnkpO1xuICAgICAgICBpbWFnZUJpdG1hcHMucHVzaChpbWFnZXNbaV0ucG9zWiBhcyBhbnkpO1xuICAgICAgICBpbWFnZUJpdG1hcHMucHVzaChpbWFnZXNbaV0ubmVnWiBhcyBhbnkpO1xuICAgICAgfVxuICAgICAgbWlwbWFwcy5wdXNoKGltYWdlQml0bWFwcyk7XG4gICAgfVxuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgY29uc3QgaXNIZHJMaW5lYXIgPSAobWlwbWFwc1swXVswXSBhcyBhbnkpPy5oZHJpRm9ybWF0ID09PSBIZHJpRm9ybWF0LkhEUl9MSU5FQVI7XG4gICAgLy8gQSAzMi1iaXQgZmxvYXQgdGV4dHVyZSBpcyBvbmx5IGZpbHRlcmFibGUgd2l0aCB0aGUgb3B0aW9uYWwgZmxvYXQzMi1maWx0ZXJhYmxlIGZlYXR1cmUuIFRoZVxuICAgIC8vIHRleHR1cmUgYmluZCBncm91cCBsYXlvdXRzIHVzZSB0aGUgZGVmYXVsdCBzYW1wbGVUeXBlICdmbG9hdCcsIHNvIG9uIGRldmljZXMgd2l0aG91dCB0aGVcbiAgICAvLyBmZWF0dXJlIChpT1MgU2FmYXJpKSBiaW5kaW5nIGFuIHJnYmEzMmZsb2F0IHRleHR1cmUgaXMgYSB2YWxpZGF0aW9uIGVycm9yIGFuZCBldmVyeSBkcmF3XG4gICAgLy8gdXNpbmcgaXQgaXMgZHJvcHBlZC4gSGFsZiBmbG9hdCBmaWx0ZXJpbmcgaXMgY29yZSBXZWJHUFUsIHNvIHVzZSBpdCBhcyB0aGUgZmFsbGJhY2suXG4gICAgY29uc3QgY3ViZW1hcEZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdCA9IGlzSGRyTGluZWFyXG4gICAgICA/IGdwdURldmljZS5mZWF0dXJlcy5oYXMoJ2Zsb2F0MzItZmlsdGVyYWJsZScpXG4gICAgICAgID8gJ3JnYmEzMmZsb2F0J1xuICAgICAgICA6ICdyZ2JhMTZmbG9hdCdcbiAgICAgIDogJ3JnYmE4dW5vcm0nO1xuICAgIGNvbnN0IGN1YmVtYXBUZXh0dXJlID0gZ3B1RGV2aWNlLmNyZWF0ZVRleHR1cmUoe1xuICAgICAgZGltZW5zaW9uOiAnMmQnLFxuICAgICAgc2l6ZTogW3dpZHRoLCBoZWlnaHQsIDZdLFxuICAgICAgZm9ybWF0OiBjdWJlbWFwRm9ybWF0LFxuICAgICAgbWlwTGV2ZWxDb3VudDogbWlwTGV2ZWxDb3VudCxcbiAgICAgIHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuVEVYVFVSRV9CSU5ESU5HIHwgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNUIHwgR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtaXBMZXZlbENvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbWlwbWFwc1tpXS5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBpbWFnZUJpdG1hcCA9IG1pcG1hcHNbaV1bal07XG4gICAgICAgIGlmICgoaW1hZ2VCaXRtYXAgYXMgYW55KS5oZHJpRm9ybWF0ID09PSBIZHJpRm9ybWF0LkhEUl9MSU5FQVIpIHtcbiAgICAgICAgICAvLyBIRFIgaW1hZ2UgaXMgMyBjaGFubmVscywgc28gd2UgbmVlZCB0byBjb252ZXJ0IGl0IHRvIDQgY2hhbm5lbHNcbiAgICAgICAgICBjb25zdCBuZXdGbG9hdDMyM0FycmF5ID0gbmV3IEZsb2F0MzJBcnJheShpbWFnZUJpdG1hcC53aWR0aCAqIGltYWdlQml0bWFwLmhlaWdodCAqIDQpO1xuICAgICAgICAgIGNvbnN0IGRhdGFGbG9hdCA9IChpbWFnZUJpdG1hcCBhcyBhbnkpLmRhdGFGbG9hdDtcbiAgICAgICAgICBjb25zdCBzaXplID0gaW1hZ2VCaXRtYXAud2lkdGggKiBpbWFnZUJpdG1hcC5oZWlnaHQ7XG4gICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBzaXplOyBrKyspIHtcbiAgICAgICAgICAgIG5ld0Zsb2F0MzIzQXJyYXlbayAqIDRdID0gZGF0YUZsb2F0W2sgKiAzXTtcbiAgICAgICAgICAgIG5ld0Zsb2F0MzIzQXJyYXlbayAqIDQgKyAxXSA9IGRhdGFGbG9hdFtrICogMyArIDFdO1xuICAgICAgICAgICAgbmV3RmxvYXQzMjNBcnJheVtrICogNCArIDJdID0gZGF0YUZsb2F0W2sgKiAzICsgMl07XG4gICAgICAgICAgICBuZXdGbG9hdDMyM0FycmF5W2sgKiA0ICsgM10gPSAxLjA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgaXNGbG9hdDE2ID0gY3ViZW1hcEZvcm1hdCA9PT0gJ3JnYmExNmZsb2F0JztcbiAgICAgICAgICBjb25zdCBwYWNrZWQgPSBwYWNrUmdiYVJvd3NGb3JVcGxvYWQobmV3RmxvYXQzMjNBcnJheSwgaW1hZ2VCaXRtYXAud2lkdGgsIGltYWdlQml0bWFwLmhlaWdodCwgaXNGbG9hdDE2KTtcblxuICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGdwdURldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgICAgICAgc2l6ZTogcGFja2VkLmRhdGEuYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5DT1BZX1NSQyxcbiAgICAgICAgICAgIG1hcHBlZEF0Q3JlYXRpb246IHRydWUsXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAoaXNGbG9hdDE2KSB7XG4gICAgICAgICAgICBuZXcgVWludDE2QXJyYXkoYnVmZmVyLmdldE1hcHBlZFJhbmdlKCkpLnNldChwYWNrZWQuZGF0YSBhcyBVaW50MTZBcnJheSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLmdldE1hcHBlZFJhbmdlKCkpLnNldChwYWNrZWQuZGF0YSBhcyBGbG9hdDMyQXJyYXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBidWZmZXIudW5tYXAoKTtcblxuICAgICAgICAgIGNvbnN0IGNvbW1hbmRFbmNvZGVyID0gZ3B1RGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG5cbiAgICAgICAgICBjb21tYW5kRW5jb2Rlci5jb3B5QnVmZmVyVG9UZXh0dXJlKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBidWZmZXI6IGJ1ZmZlcixcbiAgICAgICAgICAgICAgYnl0ZXNQZXJSb3c6IHBhY2tlZC5ieXRlc1BlclJvdyxcbiAgICAgICAgICAgICAgcm93c1BlckltYWdlOiBpbWFnZUJpdG1hcC5oZWlnaHQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeyB0ZXh0dXJlOiBjdWJlbWFwVGV4dHVyZSwgb3JpZ2luOiBbMCwgMCwgal0sIG1pcExldmVsOiBpIH0sXG4gICAgICAgICAgICBbaW1hZ2VCaXRtYXAud2lkdGgsIGltYWdlQml0bWFwLmhlaWdodCwgMV1cbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3QgY29tbWFuZEJ1ZmZlciA9IGNvbW1hbmRFbmNvZGVyLmZpbmlzaCgpO1xuICAgICAgICAgIGdwdURldmljZS5xdWV1ZS5zdWJtaXQoW2NvbW1hbmRCdWZmZXJdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBncHVEZXZpY2UucXVldWUuY29weUV4dGVybmFsSW1hZ2VUb1RleHR1cmUoXG4gICAgICAgICAgICB7IHNvdXJjZTogaW1hZ2VCaXRtYXAgfSxcbiAgICAgICAgICAgIHsgdGV4dHVyZTogY3ViZW1hcFRleHR1cmUsIG9yaWdpbjogWzAsIDAsIGpdLCBtaXBMZXZlbDogaSB9LFxuICAgICAgICAgICAgW2ltYWdlQml0bWFwLndpZHRoLCBpbWFnZUJpdG1hcC5oZWlnaHQsIDFdXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKGN1YmVtYXBUZXh0dXJlKTtcbiAgICBjb25zdCB3cmFwUyA9IFRleHR1cmVQYXJhbWV0ZXIuUmVwZWF0O1xuICAgIGNvbnN0IHdyYXBUID0gVGV4dHVyZVBhcmFtZXRlci5SZXBlYXQ7XG4gICAgY29uc3QgbWluRmlsdGVyID0gbWlwTGV2ZWxDb3VudCA9PT0gMSA/IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyIDogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXJNaXBtYXBMaW5lYXI7XG4gICAgY29uc3QgbWFnRmlsdGVyID0gVGV4dHVyZVBhcmFtZXRlci5MaW5lYXI7XG5cbiAgICBjb25zdCBzYW1wbGVyID0gbmV3IFNhbXBsZXIoZW5naW5lLCB7IHdyYXBTLCB3cmFwVCwgbWluRmlsdGVyLCBtYWdGaWx0ZXIsIGFuaXNvdHJvcHk6IGZhbHNlIH0pO1xuICAgIHNhbXBsZXIuY3JlYXRlKCk7XG5cbiAgICByZXR1cm4gW2hhbmRsZSwgc2FtcGxlcl07XG4gIH1cblxuICAvKipcbiAgICogY3JlYXRlIGEgVGV4dHVyZUFycmF5XG4gICAqIEBwYXJhbSB3aWR0aFxuICAgKiBAcGFyYW0gaGVpZ2h0XG4gICAqIEBwYXJhbSBhcnJheUxlbmd0aFxuICAgKiBAcGFyYW0gbWlwTGV2ZWxDb3VudFxuICAgKiBAcGFyYW0gaW50ZXJuYWxGb3JtYXRcbiAgICogQHBhcmFtIGZvcm1hdFxuICAgKiBAcGFyYW0gdHlwZVxuICAgKiBAcmV0dXJucyB0ZXh0dXJlIGhhbmRsZVxuICAgKi9cbiAgY3JlYXRlVGV4dHVyZUFycmF5KFxuICAgIHdpZHRoOiBTaXplLFxuICAgIGhlaWdodDogU2l6ZSxcbiAgICBhcnJheUxlbmd0aDogU2l6ZSxcbiAgICBtaXBMZXZlbENvdW50OiBTaXplLFxuICAgIGludGVybmFsRm9ybWF0OiBUZXh0dXJlRm9ybWF0RW51bSxcbiAgICBfZm9ybWF0OiBQaXhlbEZvcm1hdEVudW0sXG4gICAgX3R5cGU6IENvbXBvbmVudFR5cGVFbnVtLFxuICAgIGltYWdlRGF0YTogVHlwZWRBcnJheVxuICApOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSB7XG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcbiAgICBjb25zdCB0ZXh0dXJlRGVzY3JpcHRvcjogR1BVVGV4dHVyZURlc2NyaXB0b3IgPSB7XG4gICAgICBzaXplOiBbd2lkdGgsIGhlaWdodCwgYXJyYXlMZW5ndGhdLFxuICAgICAgZm9ybWF0OiBpbnRlcm5hbEZvcm1hdC53ZWJncHUgYXMgR1BVVGV4dHVyZUZvcm1hdCxcbiAgICAgIHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuVEVYVFVSRV9CSU5ESU5HIHwgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNUIHwgR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuICAgICAgZGltZW5zaW9uOiAnMmQnLFxuICAgICAgbWlwTGV2ZWxDb3VudDogbWlwTGV2ZWxDb3VudCxcbiAgICB9O1xuXG4gICAgY29uc3QgZ3B1VGV4dHVyZSA9IGdwdURldmljZS5jcmVhdGVUZXh0dXJlKHRleHR1cmVEZXNjcmlwdG9yKTtcblxuICAgIGlmICghKGltYWdlRGF0YS5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2hhcmVkQXJyYXlCdWZmZXIgaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGNvZGUgcGF0aC4nKTtcbiAgICB9XG4gICAgY29uc3QgcGl4ZWxEYXRhID1cbiAgICAgIGltYWdlRGF0YSBpbnN0YW5jZW9mIFVpbnQ4Q2xhbXBlZEFycmF5XG4gICAgICAgID8gKGltYWdlRGF0YSBhcyBVaW50OENsYW1wZWRBcnJheTxBcnJheUJ1ZmZlcj4pXG4gICAgICAgIDogbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KFxuICAgICAgICAgICAgaW1hZ2VEYXRhLmJ1ZmZlciBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICAgIGltYWdlRGF0YS5ieXRlT2Zmc2V0LFxuICAgICAgICAgICAgaW1hZ2VEYXRhLmJ5dGVMZW5ndGggLyBVaW50OENsYW1wZWRBcnJheS5CWVRFU19QRVJfRUxFTUVOVFxuICAgICAgICAgICk7XG5cbiAgICAvLyBVcGxvYWQgdGhlIGJ5dGVzIHdpdGggd3JpdGVUZXh0dXJlIGluc3RlYWQgb2YgY29weUV4dGVybmFsSW1hZ2VUb1RleHR1cmU6IG5vdCBldmVyeSBicm93c2VyJ3NcbiAgICAvLyBXZWJHUFUgaW1wbGVtZW50YXRpb24gYWNjZXB0cyBJbWFnZURhdGEgYXMgYSBjb3B5IHNvdXJjZSAoRmlyZWZveCByZWplY3RzIGl0KS5cbiAgICBjb25zdCBieXRlc1BlclJvdyA9IHdpZHRoICogNDtcbiAgICBsZXQgdXBsb2FkRGF0YTogVWludDhDbGFtcGVkQXJyYXkgPSBwaXhlbERhdGE7XG4gICAgbGV0IHVwbG9hZEJ5dGVzUGVyUm93ID0gYnl0ZXNQZXJSb3c7XG4gICAgaWYgKGhlaWdodCA+IDEgJiYgYnl0ZXNQZXJSb3cgJSAyNTYgIT09IDApIHtcbiAgICAgIC8vIHdyaXRlVGV4dHVyZSByZXF1aXJlcyBlYWNoIHJvdyBvZiBhIG11bHRpLXJvdyBjb3B5IHRvIGJlIDI1Ni1ieXRlIGFsaWduZWQuXG4gICAgICB1cGxvYWRCeXRlc1BlclJvdyA9IE1hdGguY2VpbChieXRlc1BlclJvdyAvIDI1NikgKiAyNTY7XG4gICAgICB1cGxvYWREYXRhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHVwbG9hZEJ5dGVzUGVyUm93ICogaGVpZ2h0KTtcbiAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgdXBsb2FkRGF0YS5zZXQocGl4ZWxEYXRhLnN1YmFycmF5KHkgKiBieXRlc1BlclJvdywgKHkgKyAxKSAqIGJ5dGVzUGVyUm93KSwgeSAqIHVwbG9hZEJ5dGVzUGVyUm93KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5TGVuZ3RoOyBpKyspIHtcbiAgICAgIGdwdURldmljZS5xdWV1ZS53cml0ZVRleHR1cmUoXG4gICAgICAgIHsgdGV4dHVyZTogZ3B1VGV4dHVyZSwgb3JpZ2luOiBbMCwgMCwgaV0gfSxcbiAgICAgICAgdXBsb2FkRGF0YSxcbiAgICAgICAgeyBieXRlc1BlclJvdzogdXBsb2FkQnl0ZXNQZXJSb3csIHJvd3NQZXJJbWFnZTogaGVpZ2h0IH0sXG4gICAgICAgIFt3aWR0aCwgaGVpZ2h0LCAxXVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UoZ3B1VGV4dHVyZSk7XG4gICAgcmV0dXJuIHRleHR1cmVIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0b3JhZ2UgYnVmZmVyIGZyb20gYSBGbG9hdDMyQXJyYXkgYW5kIHJlZ2lzdGVycyBpdCBhcyBhIFdlYkdQVSByZXNvdXJjZS5cbiAgICogU3RvcmFnZSBidWZmZXJzIGFyZSB1c2VkIGZvciBzdG9yaW5nIGxhcmdlIGFtb3VudHMgb2YgZGF0YSBhY2Nlc3NpYmxlIGZyb20gc2hhZGVycy5cbiAgICpcbiAgICogQHBhcmFtIGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMgLSBUaGUgYnVmZmVycyBjb250YWluaW5nIHRoZSBkYXRhIHRvIHN0b3JlXG4gICAqIEByZXR1cm5zIEhhbmRsZSB0byB0aGUgY3JlYXRlZCBzdG9yYWdlIGJ1ZmZlciByZXNvdXJjZVxuICAgKi9cbiAgY3JlYXRlU3RvcmFnZUJ1ZmZlcihncHVJbnN0YW5jZURhdGFCdWZmZXJzOiBCdWZmZXJbXSkge1xuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgY29uc3Qgc3RvcmFnZUJ1ZmZlciA9IGdwdURldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgc2l6ZTogZ3B1SW5zdGFuY2VEYXRhQnVmZmVycy5yZWR1Y2UoKGFjYywgYnVmZmVyKSA9PiBhY2MgKyBidWZmZXIuYnl0ZUxlbmd0aCwgMCksXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QgfCBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9TUkMsXG4gICAgfSk7XG4gICAgbGV0IG9mZnNldCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncHVJbnN0YW5jZURhdGFCdWZmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBidWZmZXIgPSBncHVJbnN0YW5jZURhdGFCdWZmZXJzW2ldO1xuICAgICAgY29uc3QgaW5wdXRBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLmdldEFycmF5QnVmZmVyKCkpO1xuICAgICAgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fYXNzZXJ0QXJyYXlCdWZmZXJWaWV3KGlucHV0QXJyYXkpO1xuICAgICAgY29uc3QgY29weVNpemUgPSBpID09PSBncHVJbnN0YW5jZURhdGFCdWZmZXJzLmxlbmd0aCAtIDEgPyBidWZmZXIudGFrZW5TaXplSW5CeXRlIDogYnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgICBncHVEZXZpY2UucXVldWUud3JpdGVCdWZmZXIoc3RvcmFnZUJ1ZmZlciwgb2Zmc2V0LCBpbnB1dEFycmF5LCAwLCBjb3B5U2l6ZSAvIDQpO1xuICAgICAgb2Zmc2V0ICs9IGNvcHlTaXplO1xuICAgIH1cblxuICAgIHRoaXMuX19zdG9yYWdlQnVmZmVyID0gc3RvcmFnZUJ1ZmZlcjtcblxuICAgIGNvbnN0IHN0b3JhZ2VCdWZmZXJIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShzdG9yYWdlQnVmZmVyKTtcblxuICAgIHJldHVybiBzdG9yYWdlQnVmZmVySGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYW4gZXhpc3Rpbmcgc3RvcmFnZSBidWZmZXIgd2l0aCBuZXcgZGF0YS5cbiAgICogT25seSB1cGRhdGVzIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGNvbXBvbmVudHMgdG8gb3B0aW1pemUgZGF0YSB0cmFuc2Zlci5cbiAgICpcbiAgICogQHBhcmFtIHN0b3JhZ2VCdWZmZXJIYW5kbGUgLSBIYW5kbGUgdG8gdGhlIHN0b3JhZ2UgYnVmZmVyIHRvIHVwZGF0ZVxuICAgKiBAcGFyYW0gZ3B1SW5zdGFuY2VEYXRhQnVmZmVycyAtIE5ldyBkYXRhIHRvIHdyaXRlIHRvIHRoZSBidWZmZXJcbiAgICovXG4gIHVwZGF0ZVN0b3JhZ2VCdWZmZXIoXG4gICAgc3RvcmFnZUJ1ZmZlckhhbmRsZTogV2ViR1BVUmVzb3VyY2VIYW5kbGUsXG4gICAgZ3B1SW5zdGFuY2VEYXRhQnVmZmVyczogQnVmZmVyW10sXG4gICAgZXhjbHVkZWRCeXRlUmFuZ2VzOiByZWFkb25seSBbbnVtYmVyLCBudW1iZXJdW10gPSBbXVxuICApIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHN0b3JhZ2VCdWZmZXIgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChzdG9yYWdlQnVmZmVySGFuZGxlKSBhcyBHUFVCdWZmZXI7XG4gICAgbGV0IG9mZnNldCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncHVJbnN0YW5jZURhdGFCdWZmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBidWZmZXIgPSBncHVJbnN0YW5jZURhdGFCdWZmZXJzW2ldO1xuICAgICAgY29uc3QgaW5wdXRBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLmdldEFycmF5QnVmZmVyKCkpO1xuICAgICAgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fYXNzZXJ0QXJyYXlCdWZmZXJWaWV3KGlucHV0QXJyYXkpO1xuICAgICAgY29uc3QgY29weVNpemUgPSBpID09PSBncHVJbnN0YW5jZURhdGFCdWZmZXJzLmxlbmd0aCAtIDEgPyBidWZmZXIudGFrZW5TaXplSW5CeXRlIDogYnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgICAvLyBUaGUgZXhjbHVkZWQgcmFuZ2VzIChlLmcuIHRoZSBsaWdodCBjbHVzdGVyIGxpc3RzKSBhcmUgd3JpdHRlbiBzZXBhcmF0ZWx5LCBzbyB0aGV5IGFyZSBza2lwcGVkIGhlcmUuXG4gICAgICBmb3IgKGNvbnN0IFtzdGFydCwgZW5kXSBvZiBzdWJ0cmFjdEJ5dGVSYW5nZXMob2Zmc2V0LCBvZmZzZXQgKyBjb3B5U2l6ZSwgZXhjbHVkZWRCeXRlUmFuZ2VzKSkge1xuICAgICAgICBncHVEZXZpY2UucXVldWUud3JpdGVCdWZmZXIoc3RvcmFnZUJ1ZmZlciwgc3RhcnQsIGlucHV0QXJyYXksIChzdGFydCAtIG9mZnNldCkgLyA0LCAoZW5kIC0gc3RhcnQpIC8gNCk7XG4gICAgICB9XG4gICAgICBvZmZzZXQgKz0gYnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlcyBieXRlIHJhbmdlcyBvZiB0aGUgR1BVIGluc3RhbmNlIGRhdGEgdG8gdGhlIHN0b3JhZ2UgYnVmZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gc3RvcmFnZUJ1ZmZlckhhbmRsZSAtIEhhbmRsZSB0byB0aGUgc3RvcmFnZSBidWZmZXJcbiAgICogQHBhcmFtIGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMgLSBUaGUgR1BVIGluc3RhbmNlIGRhdGEgYnVmZmVycyAobGF5ZXJzKVxuICAgKiBAcGFyYW0gYnl0ZVJhbmdlcyAtIFRoZSByYW5nZXMgYFtzdGFydCwgZW5kKWAgaW4gdGhlIGNvbmNhdGVuYXRlZCBsYXllcnMuIEEgcmFuZ2UgbXVzdCBub3Qgc3BhbiBsYXllcnMuXG4gICAqL1xuICB1cGRhdGVTdG9yYWdlQnVmZmVyUmFuZ2VzKFxuICAgIHN0b3JhZ2VCdWZmZXJIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlLFxuICAgIGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnM6IEJ1ZmZlcltdLFxuICAgIGJ5dGVSYW5nZXM6IHJlYWRvbmx5IFtudW1iZXIsIG51bWJlcl1bXVxuICApIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHN0b3JhZ2VCdWZmZXIgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChzdG9yYWdlQnVmZmVySGFuZGxlKSBhcyBHUFVCdWZmZXI7XG4gICAgZm9yIChjb25zdCBbc3RhcnQsIGVuZF0gb2YgYnl0ZVJhbmdlcykge1xuICAgICAgbGV0IGxheWVyU3RhcnQgPSAwO1xuICAgICAgZm9yIChjb25zdCBidWZmZXIgb2YgZ3B1SW5zdGFuY2VEYXRhQnVmZmVycykge1xuICAgICAgICBjb25zdCBsYXllckVuZCA9IGxheWVyU3RhcnQgKyBidWZmZXIuYnl0ZUxlbmd0aDtcbiAgICAgICAgaWYgKHN0YXJ0ID49IGxheWVyU3RhcnQgJiYgZW5kIDw9IGxheWVyRW5kKSB7XG4gICAgICAgICAgY29uc3QgaW5wdXRBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLmdldEFycmF5QnVmZmVyKCkpO1xuICAgICAgICAgIGdwdURldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihzdG9yYWdlQnVmZmVyLCBzdGFydCwgaW5wdXRBcnJheSwgKHN0YXJ0IC0gbGF5ZXJTdGFydCkgLyA0LCAoZW5kIC0gc3RhcnQpIC8gNCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGF5ZXJTdGFydCA9IGxheWVyRW5kO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc3RvcmFnZSBidWZmZXIgb2YgdGhlIEdQVSBpbnN0YW5jZSBkYXRhIChib3VuZCBhdCBncm91cCAwLCBiaW5kaW5nIDAgb2YgdGhlIHJlbmRlciBwaXBlbGluZXMpLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRTdG9yYWdlQnVmZmVyKCk6IEdQVUJ1ZmZlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19zdG9yYWdlQnVmZmVyO1xuICB9XG5cbiAgZGVzdHJveVN0b3JhZ2VCdWZmZXIoc3RvcmFnZUJ1ZmZlckhhbmRsZTogV2ViR1BVUmVzb3VyY2VIYW5kbGUpIHtcbiAgICBjb25zdCBzdG9yYWdlQnVmZmVyID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQoc3RvcmFnZUJ1ZmZlckhhbmRsZSkgYXMgR1BVQnVmZmVyO1xuICAgIGlmIChzdG9yYWdlQnVmZmVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3RvcmFnZUJ1ZmZlci5kZXN0cm95KCk7XG4gICAgdGhpcy5fX3dlYkdwdVJlc291cmNlcy5kZWxldGUoc3RvcmFnZUJ1ZmZlckhhbmRsZSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBhIHBvcnRpb24gb2YgYSBzdG9yYWdlIGJ1ZmZlciB3aXRoIG5ldyBkYXRhIGF0IGEgc3BlY2lmaWMgb2Zmc2V0LlxuICAgKiBUaGlzIGFsbG93cyBmb3IgZWZmaWNpZW50IHBhcnRpYWwgdXBkYXRlcyBvZiBsYXJnZSBzdG9yYWdlIGJ1ZmZlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBzdG9yYWdlQnVmZmVySGFuZGxlIC0gSGFuZGxlIHRvIHRoZSBzdG9yYWdlIGJ1ZmZlciB0byB1cGRhdGVcbiAgICogQHBhcmFtIGlucHV0QXJyYXkgLSBOZXcgZGF0YSB0byB3cml0ZSB0byB0aGUgYnVmZmVyXG4gICAqIEBwYXJhbSBvZmZzZXRPZlN0b3JhZ2VCdWZmZXJJbkJ5dGUgLSBCeXRlIG9mZnNldCBpbiB0aGUgc3RvcmFnZSBidWZmZXIgd2hlcmUgdG8gc3RhcnQgd3JpdGluZ1xuICAgKiBAcGFyYW0gb2Zmc2V0T2ZJbnB1dEFycmF5SW5FbGVtZW50IC0gRWxlbWVudCBvZmZzZXQgaW4gdGhlIGlucHV0IGFycmF5IHdoZXJlIHRvIHN0YXJ0IHJlYWRpbmdcbiAgICogQHBhcmFtIHVwZGF0ZUNvbXBvbmVudFNpemUgLSBOdW1iZXIgb2YgY29tcG9uZW50cyB0byB1cGRhdGVcbiAgICovXG4gIHVwZGF0ZVN0b3JhZ2VCdWZmZXJQYXJ0aWFsbHkoXG4gICAgc3RvcmFnZUJ1ZmZlckhhbmRsZTogV2ViR1BVUmVzb3VyY2VIYW5kbGUsXG4gICAgaW5wdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIG9mZnNldE9mU3RvcmFnZUJ1ZmZlckluQnl0ZTogQ291bnQsXG4gICAgb2Zmc2V0T2ZJbnB1dEFycmF5SW5FbGVtZW50OiBDb3VudCxcbiAgICB1cGRhdGVDb21wb25lbnRTaXplOiBDb3VudFxuICApIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHN0b3JhZ2VCdWZmZXIgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChzdG9yYWdlQnVmZmVySGFuZGxlKSBhcyBHUFVCdWZmZXI7XG4gICAgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fYXNzZXJ0QXJyYXlCdWZmZXJWaWV3KGlucHV0QXJyYXkpO1xuICAgIGdwdURldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihcbiAgICAgIHN0b3JhZ2VCdWZmZXIsXG4gICAgICBvZmZzZXRPZlN0b3JhZ2VCdWZmZXJJbkJ5dGUsXG4gICAgICBpbnB1dEFycmF5LFxuICAgICAgb2Zmc2V0T2ZJbnB1dEFycmF5SW5FbGVtZW50LFxuICAgICAgdXBkYXRlQ29tcG9uZW50U2l6ZVxuICAgICk7XG4gIH1cblxuICBjcmVhdGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcihpbnB1dEFycmF5OiBGbG9hdDMyQXJyYXkpIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHN0b3JhZ2VCdWZmZXIgPSBncHVEZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIHNpemU6IGlucHV0QXJyYXkuYnl0ZUxlbmd0aCxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCB8IEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UsXG4gICAgfSk7XG4gICAgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fYXNzZXJ0QXJyYXlCdWZmZXJWaWV3KGlucHV0QXJyYXkpO1xuICAgIGdwdURldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihzdG9yYWdlQnVmZmVyLCAwLCBpbnB1dEFycmF5KTtcblxuICAgIHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlciA9IHN0b3JhZ2VCdWZmZXI7XG5cbiAgICBjb25zdCBzdG9yYWdlQnVmZmVySGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2Uoc3RvcmFnZUJ1ZmZlcik7XG5cbiAgICByZXR1cm4gc3RvcmFnZUJ1ZmZlckhhbmRsZTtcbiAgfVxuXG4gIGRlbGV0ZVN0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyKHN0b3JhZ2VCdWZmZXJIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlKSB7XG4gICAgY29uc3Qgc3RvcmFnZUJ1ZmZlciA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KHN0b3JhZ2VCdWZmZXJIYW5kbGUpIGFzIEdQVUJ1ZmZlcjtcbiAgICBpZiAoc3RvcmFnZUJ1ZmZlciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN0b3JhZ2VCdWZmZXIuZGVzdHJveSgpO1xuICAgIHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZGVsZXRlKHN0b3JhZ2VCdWZmZXJIYW5kbGUpO1xuICB9XG5cbiAgdXBkYXRlU3RvcmFnZUJsZW5kU2hhcGVCdWZmZXIoXG4gICAgc3RvcmFnZUJ1ZmZlckhhbmRsZTogV2ViR1BVUmVzb3VyY2VIYW5kbGUsXG4gICAgaW5wdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIHVwZGF0ZUNvbXBvbmVudFNpemU6IENvdW50XG4gICkge1xuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgY29uc3Qgc3RvcmFnZUJ1ZmZlciA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KHN0b3JhZ2VCdWZmZXJIYW5kbGUpIGFzIEdQVUJ1ZmZlcjtcbiAgICBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX19hc3NlcnRBcnJheUJ1ZmZlclZpZXcoaW5wdXRBcnJheSk7XG4gICAgZ3B1RGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKHN0b3JhZ2VCdWZmZXIsIDAsIGlucHV0QXJyYXksIDAsIHVwZGF0ZUNvbXBvbmVudFNpemUpO1xuICB9XG5cbiAgY3JlYXRlQmluZEdyb3VwTGF5b3V0Rm9yRHJhd1BhcmFtZXRlcnMoKSB7XG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcbiAgICB7XG4gICAgICBjb25zdCBiaW5kR3JvdXBMYXlvdXREZXNjOiBHUFVCaW5kR3JvdXBMYXlvdXREZXNjcmlwdG9yID0ge1xuICAgICAgICBlbnRyaWVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYmluZGluZzogMCxcbiAgICAgICAgICAgIGJ1ZmZlcjoge1xuICAgICAgICAgICAgICB0eXBlOiAndW5pZm9ybScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuVkVSVEVYIHwgR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH07XG4gICAgICBjb25zdCBiaW5kR3JvdXBMYXlvdXQgPSBncHVEZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KGJpbmRHcm91cExheW91dERlc2MpO1xuICAgICAgdGhpcy5fX2JpbmRHcm91cExheW91dFVuaWZvcm1EcmF3UGFyYW1ldGVycyA9IGJpbmRHcm91cExheW91dDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VsZWN0cyB0aGUgZHJhdyBwYXJhbWV0ZXJzIChncm91cCAzKSBmb3IgdGhlIG5leHQgZHJhdygpLlxuICAgKlxuICAgKiBUaGUgcGFyYW1ldGVycyBhcmUgc3RvcmVkIGluIGFuIGltbXV0YWJsZSB1bmlmb3JtIGJ1ZmZlciBzaGFyZWQgYnkgZXZlcnkgZHJhdyB3aXRoIHRoZSBzYW1lIHZhbHVlcyxcbiAgICogc28gY29uc2VjdXRpdmUgZHJhd3Mgb2YgdGhlIHNhbWUgbWF0ZXJpYWwgYW5kIGNhbWVyYSBrZWVwIHRoZSBzYW1lIGJpbmQgZ3JvdXAuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbFNpZCAtIFRoZSBtYXRlcmlhbCBTSURcbiAgICogQHBhcmFtIGNhbWVyYVNJRCAtIFRoZSBjYW1lcmEgY29tcG9uZW50IFNJRFxuICAgKiBAcGFyYW0gY3VycmVudFByaW1pdGl2ZUlkeCAtIFRoZSBpbmRleCBvZiB0aGUgcHJpbWl0aXZlIGFtb25nIHRoZSBwcmltaXRpdmVzIHdpdGggbW9ycGggdGFyZ2V0c1xuICAgKiBAcGFyYW0gbW9ycGhUYXJnZXROdW1iZXIgLSBUaGUgbnVtYmVyIG9mIG1vcnBoIHRhcmdldHMgb2YgdGhlIHByaW1pdGl2ZVxuICAgKiBAcGFyYW0gZGVmb3JtZWRWZXJ0ZXhPZmZzZXQgLSBUaGUgb2Zmc2V0IG9mIHRoZSBwcmltaXRpdmUgaW4gdGhlIGRlZm9ybWVkIHZlcnRpY2VzIG9mIGl0cyBtZXNoIGluc3RhbmNlIChzZWVcbiAgICogICBwcm9jZXNzR2VvbWV0cnkpLCBmb3IgYSBkcmF3IG9mIHRoZSB2ZXJ0aWNlcyBkZWZvcm1lZCBieSB0aGUgR1BVIGN1bGxpbmcncyBjb21wdXRlIHNoYWRlclxuICAgKi9cbiAgc2V0RHJhd1BhcmFtZXRlcnMoXG4gICAgbWF0ZXJpYWxTaWQ6IEluZGV4LFxuICAgIGNhbWVyYVNJRDogSW5kZXgsXG4gICAgY3VycmVudFByaW1pdGl2ZUlkeDogSW5kZXgsXG4gICAgbW9ycGhUYXJnZXROdW1iZXI6IENvdW50LFxuICAgIGRlZm9ybWVkVmVydGV4T2Zmc2V0OiBJbmRleCA9IDBcbiAgKSB7XG4gICAgY29uc3QgbGFzdERyYXdQYXJhbWV0ZXJzID0gdGhpcy5fX2xhc3REcmF3UGFyYW1ldGVycztcbiAgICBsYXN0RHJhd1BhcmFtZXRlcnNbMF0gPSBtYXRlcmlhbFNpZDtcbiAgICBsYXN0RHJhd1BhcmFtZXRlcnNbMV0gPSBjYW1lcmFTSUQ7XG4gICAgbGFzdERyYXdQYXJhbWV0ZXJzWzJdID0gY3VycmVudFByaW1pdGl2ZUlkeDtcbiAgICBsYXN0RHJhd1BhcmFtZXRlcnNbM10gPSBtb3JwaFRhcmdldE51bWJlcjtcbiAgICBjb25zdCBrZXkgPSBgJHttYXRlcmlhbFNpZH0sJHtjYW1lcmFTSUR9LCR7Y3VycmVudFByaW1pdGl2ZUlkeH0sJHttb3JwaFRhcmdldE51bWJlcn0sJHtkZWZvcm1lZFZlcnRleE9mZnNldH1gO1xuICAgIGxldCBiaW5kR3JvdXAgPSB0aGlzLl9fZHJhd1BhcmFtZXRlcnNCaW5kR3JvdXBDYWNoZS5nZXQoa2V5KTtcbiAgICBpZiAoYmluZEdyb3VwID09IG51bGwpIHtcbiAgICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgICBjb25zdCBlbnRyaWVzUGVyQnVmZmVyID0gV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fZHJhd1BhcmFtZXRlcnNFbnRyaWVzUGVyQnVmZmVyO1xuICAgICAgY29uc3Qgc3RyaWRlID0gTWF0aC5tYXgoXG4gICAgICAgIGdwdURldmljZS5saW1pdHMubWluVW5pZm9ybUJ1ZmZlck9mZnNldEFsaWdubWVudCxcbiAgICAgICAgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fZHJhd1BhcmFtZXRlcnNCeXRlU2l6ZVxuICAgICAgKTtcbiAgICAgIGxldCB1bmlmb3JtQnVmZmVyID0gdGhpcy5fX2RyYXdQYXJhbWV0ZXJzQnVmZmVyc1t0aGlzLl9fZHJhd1BhcmFtZXRlcnNCdWZmZXJzLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKHVuaWZvcm1CdWZmZXIgPT0gbnVsbCB8fCB0aGlzLl9fZHJhd1BhcmFtZXRlcnNFbnRyeUNvdW50SW5MYXN0QnVmZmVyID49IGVudHJpZXNQZXJCdWZmZXIpIHtcbiAgICAgICAgdW5pZm9ybUJ1ZmZlciA9IGdwdURldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgICAgIHNpemU6IHN0cmlkZSAqIGVudHJpZXNQZXJCdWZmZXIsXG4gICAgICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUIHwgR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX19kcmF3UGFyYW1ldGVyc0J1ZmZlcnMucHVzaCh1bmlmb3JtQnVmZmVyKTtcbiAgICAgICAgdGhpcy5fX2RyYXdQYXJhbWV0ZXJzRW50cnlDb3VudEluTGFzdEJ1ZmZlciA9IDA7XG4gICAgICB9XG4gICAgICBjb25zdCBvZmZzZXQgPSBzdHJpZGUgKiB0aGlzLl9fZHJhd1BhcmFtZXRlcnNFbnRyeUNvdW50SW5MYXN0QnVmZmVyKys7XG4gICAgICBjb25zdCB2YWx1ZXMgPSBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX19kcmF3UGFyYW1ldGVyc1ZhbHVlcztcbiAgICAgIHZhbHVlc1swXSA9IG1hdGVyaWFsU2lkO1xuICAgICAgdmFsdWVzWzFdID0gY2FtZXJhU0lEO1xuICAgICAgdmFsdWVzWzJdID0gY3VycmVudFByaW1pdGl2ZUlkeDtcbiAgICAgIHZhbHVlc1szXSA9IG1vcnBoVGFyZ2V0TnVtYmVyO1xuICAgICAgdmFsdWVzWzRdID0gZGVmb3JtZWRWZXJ0ZXhPZmZzZXQ7XG4gICAgICBncHVEZXZpY2UucXVldWUud3JpdGVCdWZmZXIodW5pZm9ybUJ1ZmZlciwgb2Zmc2V0LCB2YWx1ZXMpO1xuXG4gICAgICBiaW5kR3JvdXAgPSBncHVEZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcbiAgICAgICAgbGF5b3V0OiB0aGlzLl9fYmluZEdyb3VwTGF5b3V0VW5pZm9ybURyYXdQYXJhbWV0ZXJzISxcbiAgICAgICAgZW50cmllczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJpbmRpbmc6IDAsXG4gICAgICAgICAgICByZXNvdXJjZToge1xuICAgICAgICAgICAgICBidWZmZXI6IHVuaWZvcm1CdWZmZXIsXG4gICAgICAgICAgICAgIG9mZnNldCxcbiAgICAgICAgICAgICAgc2l6ZTogV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fZHJhd1BhcmFtZXRlcnNCeXRlU2l6ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fX2RyYXdQYXJhbWV0ZXJzQmluZEdyb3VwQ2FjaGUuc2V0KGtleSwgYmluZEdyb3VwKTtcbiAgICB9XG4gICAgdGhpcy5fX2N1cnJlbnREcmF3UGFyYW1ldGVyc0JpbmRHcm91cCA9IGJpbmRHcm91cDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWxlY3RzIHRoZSBkcmF3IHBhcmFtZXRlcnMgb2YgdGhlIGxhc3Qgc2V0RHJhd1BhcmFtZXRlcnMoKSBjYWxsIHdpdGggYW5vdGhlciBkZWZvcm1lZCB2ZXJ0ZXggb2Zmc2V0LlxuICAgKi9cbiAgcHJpdmF0ZSBfX3NlbGVjdERlZm9ybWVkVmVydGV4T2Zmc2V0KGRlZm9ybWVkVmVydGV4T2Zmc2V0OiBJbmRleCkge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9fbGFzdERyYXdQYXJhbWV0ZXJzO1xuICAgIHRoaXMuc2V0RHJhd1BhcmFtZXRlcnMocFswXSwgcFsxXSwgcFsyXSwgcFszXSwgZGVmb3JtZWRWZXJ0ZXhPZmZzZXQpO1xuICB9XG5cbiAgY3JlYXRlVW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlcihzaXplSW5CeXRlOiBDb3VudCkge1xuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgY29uc3QgdW5pZm9ybUJ1ZmZlciA9IGdwdURldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgc2l6ZTogc2l6ZUluQnl0ZSxcbiAgICAgIC8vIFNUT1JBR0U6IGFsc28gcmVhZCBieSB0aGUgdmVydGV4IGRlZm9ybWF0aW9uIGNvbXB1dGUgc2hhZGVyIChXZWJHcHVWZXJ0ZXhEZWZvcm1lcikuXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QgfCBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSxcbiAgICB9KTtcblxuICAgIHRoaXMuX191bmlmb3JtTW9ycGhPZmZzZXRzQnVmZmVyID0gdW5pZm9ybUJ1ZmZlcjtcblxuICAgIGNvbnN0IHVuaWZvcm1CdWZmZXJIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh1bmlmb3JtQnVmZmVyKTtcblxuICAgIHJldHVybiB1bmlmb3JtQnVmZmVySGFuZGxlO1xuICB9XG5cbiAgdXBkYXRlVW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlcihpbnB1dEFycmF5OiBVaW50MzJBcnJheSwgZWxlbWVudE51bTogQ291bnQpIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGlmICh0aGlzLl9fdW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlciA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBmb3VuZCB1bmlmb3JtIG1vcnBoIGJ1ZmZlci4nKTtcbiAgICB9XG4gICAgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fYXNzZXJ0QXJyYXlCdWZmZXJWaWV3KGlucHV0QXJyYXkpO1xuICAgIGdwdURldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcih0aGlzLl9fdW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlciwgMCwgaW5wdXRBcnJheSwgMCwgZWxlbWVudE51bSk7XG4gIH1cblxuICBjcmVhdGVVbmlmb3JtTW9ycGhXZWlnaHRzQnVmZmVyKHNpemVJbkJ5dGU6IENvdW50KSB7XG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcbiAgICBjb25zdCB1bmlmb3JtQnVmZmVyID0gZ3B1RGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBzaXplOiBzaXplSW5CeXRlLFxuICAgICAgLy8gU1RPUkFHRTogYWxzbyByZWFkIGJ5IHRoZSB2ZXJ0ZXggZGVmb3JtYXRpb24gY29tcHV0ZSBzaGFkZXIgKFdlYkdwdVZlcnRleERlZm9ybWVyKS5cbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCB8IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFLFxuICAgIH0pO1xuXG4gICAgdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNCdWZmZXIgPSB1bmlmb3JtQnVmZmVyO1xuXG4gICAgY29uc3QgdW5pZm9ybUJ1ZmZlckhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKHVuaWZvcm1CdWZmZXIpO1xuXG4gICAgcmV0dXJuIHVuaWZvcm1CdWZmZXJIYW5kbGU7XG4gIH1cblxuICB1cGRhdGVVbmlmb3JtTW9ycGhXZWlnaHRzQnVmZmVyKGlucHV0QXJyYXk6IEZsb2F0MzJBcnJheSwgZWxlbWVudE51bTogQ291bnQpIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGlmICh0aGlzLl9fdW5pZm9ybU1vcnBoV2VpZ2h0c0J1ZmZlciA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBmb3VuZCB1bmlmb3JtIG1vcnBoIGJ1ZmZlci4nKTtcbiAgICB9XG4gICAgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9fYXNzZXJ0QXJyYXlCdWZmZXJWaWV3KGlucHV0QXJyYXkpO1xuICAgIGdwdURldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcih0aGlzLl9fdW5pZm9ybU1vcnBoV2VpZ2h0c0J1ZmZlciwgMCwgaW5wdXRBcnJheSwgMCwgZWxlbWVudE51bSk7XG4gIH1cblxuICBkZWxldGVVbmlmb3JtQnVmZmVyKHVuaWZvcm1CdWZmZXJIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlKSB7XG4gICAgY29uc3QgdW5pZm9ybUJ1ZmZlciA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KHVuaWZvcm1CdWZmZXJIYW5kbGUpIGFzIEdQVUJ1ZmZlcjtcbiAgICBpZiAodW5pZm9ybUJ1ZmZlciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHVuaWZvcm1CdWZmZXIuZGVzdHJveSgpO1xuICAgIHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZGVsZXRlKHVuaWZvcm1CdWZmZXJIYW5kbGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdGFibGUgaWRlbnRpZmllciBvZiBhIEdQVSBvYmplY3QgZm9yIGNhY2hlIGtleXMuXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0R3B1T2JqZWN0SWQob2JqOiBvYmplY3QpOiBudW1iZXIge1xuICAgIGxldCBpZCA9IHRoaXMuX19ncHVPYmplY3RJZHMuZ2V0KG9iaik7XG4gICAgaWYgKGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlkID0gKyt0aGlzLl9fZ3B1T2JqZWN0SWRDb3VudDtcbiAgICAgIHRoaXMuX19ncHVPYmplY3RJZHMuc2V0KG9iaiwgaWQpO1xuICAgIH1cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYmluZCBncm91cCBsYXlvdXQgZm9yIHRoZSBnaXZlbiBkZXNjcmlwdG9yLCBzaGFyZWQgYnkgZXZlcnkgYmluZCBncm91cCBhbmQgcGlwZWxpbmVcbiAgICogbGF5b3V0IHdpdGggdGhlIHNhbWUgZGVzY3JpcHRvci5cbiAgICovXG4gIHByaXZhdGUgX19nZXRPckNyZWF0ZUJpbmRHcm91cExheW91dChrZXk6IHN0cmluZywgZW50cmllczogR1BVQmluZEdyb3VwTGF5b3V0RW50cnlbXSk6IEdQVUJpbmRHcm91cExheW91dCB7XG4gICAgbGV0IGxheW91dCA9IHRoaXMuX19iaW5kR3JvdXBMYXlvdXRDYWNoZS5nZXQoa2V5KTtcbiAgICBpZiAobGF5b3V0ID09IG51bGwpIHtcbiAgICAgIGxheW91dCA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KHsgZW50cmllcyB9KTtcbiAgICAgIHRoaXMuX19iaW5kR3JvdXBMYXlvdXRDYWNoZS5zZXQoa2V5LCBsYXlvdXQpO1xuICAgIH1cbiAgICByZXR1cm4gbGF5b3V0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZpZXcgb2YgYSBkdW1teSB0ZXh0dXJlIHdpdGggdGhlIGdpdmVuIGRpbWVuc2lvbi4gVGhlIHZpZXcgaXMgY3JlYXRlZCBvbmNlIHBlciB0ZXh0dXJlLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldER1bW15VGV4dHVyZVZpZXcoZ3B1VGV4dHVyZTogR1BVVGV4dHVyZSwgZGltZW5zaW9uOiBHUFVUZXh0dXJlVmlld0RpbWVuc2lvbik6IEdQVVRleHR1cmVWaWV3IHtcbiAgICBsZXQgdmlld3MgPSB0aGlzLl9fZHVtbXlUZXh0dXJlVmlld3MuZ2V0KGdwdVRleHR1cmUpO1xuICAgIGlmICh2aWV3cyA9PSBudWxsKSB7XG4gICAgICB2aWV3cyA9IG5ldyBNYXAoKTtcbiAgICAgIHRoaXMuX19kdW1teVRleHR1cmVWaWV3cy5zZXQoZ3B1VGV4dHVyZSwgdmlld3MpO1xuICAgIH1cbiAgICBsZXQgdmlldyA9IHZpZXdzLmdldChkaW1lbnNpb24pO1xuICAgIGlmICh2aWV3ID09IG51bGwpIHtcbiAgICAgIHZpZXcgPSBkaW1lbnNpb24gPT09ICcyZCcgPyBncHVUZXh0dXJlLmNyZWF0ZVZpZXcoKSA6IGdwdVRleHR1cmUuY3JlYXRlVmlldyh7IGRpbWVuc2lvbiB9KTtcbiAgICAgIHZpZXdzLnNldChkaW1lbnNpb24sIHZpZXcpO1xuICAgIH1cbiAgICByZXR1cm4gdmlldztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgYnVmZmVyIGJvdW5kIGF0IGdyb3VwIDAsIGJpbmRpbmcgNDogdGhlIHZlcnRpY2VzIGRlZm9ybWVkIGJ5IHRoZSBHUFUgY3VsbGluZywgb3IgYSBkdW1teSBidWZmZXIgd2l0aG91dCBpdC5cbiAgICovXG4gIHByaXZhdGUgX19nZXREZWZvcm1lZFZlcnRpY2VzQnVmZmVyKCk6IEdQVUJ1ZmZlciB7XG4gICAgY29uc3QgZGVmb3JtZWRWZXJ0aWNlc0J1ZmZlciA9IHRoaXMuX19ncHVDdWxsaW5nPy5kZWZvcm1lZFZlcnRpY2VzQnVmZmVyO1xuICAgIGlmIChkZWZvcm1lZFZlcnRpY2VzQnVmZmVyICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBkZWZvcm1lZFZlcnRpY2VzQnVmZmVyO1xuICAgIH1cbiAgICB0aGlzLl9fZHVtbXlEZWZvcm1lZFZlcnRpY2VzQnVmZmVyID8/PSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBzaXplOiAzMixcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFLFxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzLl9fZHVtbXlEZWZvcm1lZFZlcnRpY2VzQnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGdyb3VwIDAgYmluZCBncm91cCAoc3RvcmFnZSBidWZmZXIsIGJsZW5kIHNoYXBlIGJ1ZmZlciwgbW9ycGggdW5pZm9ybSBidWZmZXJzLCBkZWZvcm1lZCB2ZXJ0aWNlcykuXG4gICAqIEl0IGlzIHJlY3JlYXRlZCBvbmx5IHdoZW4gb25lIG9mIHRob3NlIGJ1ZmZlcnMgaXMgcmVwbGFjZWQuXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0U3RvcmFnZUJpbmRHcm91cCgpOiBHUFVCaW5kR3JvdXAge1xuICAgIGNvbnN0IGJ1ZmZlcnMgPSB0aGlzLl9fc3RvcmFnZUJpbmRHcm91cEJ1ZmZlcnM7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX2JpbmRHcm91cFN0b3JhZ2VCdWZmZXIgIT0gbnVsbCAmJlxuICAgICAgYnVmZmVyc1swXSA9PT0gdGhpcy5fX3N0b3JhZ2VCdWZmZXIgJiZcbiAgICAgIGJ1ZmZlcnNbMV0gPT09IHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlciAmJlxuICAgICAgYnVmZmVyc1syXSA9PT0gdGhpcy5fX3VuaWZvcm1Nb3JwaE9mZnNldHNCdWZmZXIgJiZcbiAgICAgIGJ1ZmZlcnNbM10gPT09IHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzQnVmZmVyICYmXG4gICAgICBidWZmZXJzWzRdID09PSB0aGlzLl9fZ2V0RGVmb3JtZWRWZXJ0aWNlc0J1ZmZlcigpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2JpbmRHcm91cFN0b3JhZ2VCdWZmZXI7XG4gICAgfVxuICAgIGJ1ZmZlcnNbMF0gPSB0aGlzLl9fc3RvcmFnZUJ1ZmZlcjtcbiAgICBidWZmZXJzWzFdID0gdGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyO1xuICAgIGJ1ZmZlcnNbMl0gPSB0aGlzLl9fdW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlcjtcbiAgICBidWZmZXJzWzNdID0gdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNCdWZmZXI7XG4gICAgYnVmZmVyc1s0XSA9IHRoaXMuX19nZXREZWZvcm1lZFZlcnRpY2VzQnVmZmVyKCk7XG5cbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHZpc2liaWxpdHkgPSBHUFVTaGFkZXJTdGFnZS5WRVJURVggfCBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVDtcbiAgICBjb25zdCBlbnRyaWVzOiBHUFVCaW5kR3JvdXBFbnRyeVtdID0gW107XG4gICAgY29uc3QgbGF5b3V0RW50cmllczogR1BVQmluZEdyb3VwTGF5b3V0RW50cnlbXSA9IFtdO1xuICAgIGxldCBsYXlvdXRLZXkgPSAnJztcbiAgICBpZiAodGhpcy5fX3N0b3JhZ2VCdWZmZXIgIT0gbnVsbCkge1xuICAgICAgZW50cmllcy5wdXNoKHsgYmluZGluZzogMCwgcmVzb3VyY2U6IHsgYnVmZmVyOiB0aGlzLl9fc3RvcmFnZUJ1ZmZlciB9IH0pO1xuICAgICAgbGF5b3V0RW50cmllcy5wdXNoKHsgYmluZGluZzogMCwgYnVmZmVyOiB7IHR5cGU6ICdyZWFkLW9ubHktc3RvcmFnZScgfSwgdmlzaWJpbGl0eSB9KTtcbiAgICAgIGxheW91dEtleSArPSAncyc7XG4gICAgfVxuICAgIGxldCBibGVuZFNoYXBlQnVmZmVyID0gdGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyO1xuICAgIGlmIChibGVuZFNoYXBlQnVmZmVyID09IG51bGwpIHtcbiAgICAgIHRoaXMuX19kdW1teUJsZW5kU2hhcGVCdWZmZXIgPz89IGdwdURldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgICBzaXplOiAxNixcbiAgICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUIHwgR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSxcbiAgICAgIH0pO1xuICAgICAgYmxlbmRTaGFwZUJ1ZmZlciA9IHRoaXMuX19kdW1teUJsZW5kU2hhcGVCdWZmZXI7XG4gICAgfVxuICAgIGVudHJpZXMucHVzaCh7IGJpbmRpbmc6IDEsIHJlc291cmNlOiB7IGJ1ZmZlcjogYmxlbmRTaGFwZUJ1ZmZlciB9IH0pO1xuICAgIGxheW91dEVudHJpZXMucHVzaCh7IGJpbmRpbmc6IDEsIGJ1ZmZlcjogeyB0eXBlOiAncmVhZC1vbmx5LXN0b3JhZ2UnIH0sIHZpc2liaWxpdHkgfSk7XG4gICAgbGF5b3V0S2V5ICs9ICdiJztcbiAgICBpZiAodGhpcy5fX3VuaWZvcm1Nb3JwaE9mZnNldHNCdWZmZXIgIT0gbnVsbCkge1xuICAgICAgZW50cmllcy5wdXNoKHsgYmluZGluZzogMiwgcmVzb3VyY2U6IHsgYnVmZmVyOiB0aGlzLl9fdW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlciB9IH0pO1xuICAgICAgbGF5b3V0RW50cmllcy5wdXNoKHsgYmluZGluZzogMiwgYnVmZmVyOiB7IHR5cGU6ICd1bmlmb3JtJyB9LCB2aXNpYmlsaXR5IH0pO1xuICAgICAgbGF5b3V0S2V5ICs9ICdvJztcbiAgICB9XG4gICAgaWYgKHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzQnVmZmVyICE9IG51bGwpIHtcbiAgICAgIGVudHJpZXMucHVzaCh7IGJpbmRpbmc6IDMsIHJlc291cmNlOiB7IGJ1ZmZlcjogdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNCdWZmZXIgfSB9KTtcbiAgICAgIGxheW91dEVudHJpZXMucHVzaCh7IGJpbmRpbmc6IDMsIGJ1ZmZlcjogeyB0eXBlOiAndW5pZm9ybScgfSwgdmlzaWJpbGl0eSB9KTtcbiAgICAgIGxheW91dEtleSArPSAndyc7XG4gICAgfVxuICAgIC8vIFRoZSB2ZXJ0aWNlcyBkZWZvcm1lZCBieSB0aGUgR1BVIGN1bGxpbmcncyBjb21wdXRlIHNoYWRlciAocmVhZCBieSBwcm9jZXNzR2VvbWV0cnkgaW4gdGhlIHZlcnRleCBzaGFkZXJzKS5cbiAgICBlbnRyaWVzLnB1c2goeyBiaW5kaW5nOiA0LCByZXNvdXJjZTogeyBidWZmZXI6IGJ1ZmZlcnNbNF0hIH0gfSk7XG4gICAgbGF5b3V0RW50cmllcy5wdXNoKHsgYmluZGluZzogNCwgYnVmZmVyOiB7IHR5cGU6ICdyZWFkLW9ubHktc3RvcmFnZScgfSwgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuVkVSVEVYIH0pO1xuICAgIGxheW91dEtleSArPSAnZCc7XG4gICAgbGF5b3V0S2V5ID0gYHN0b3JhZ2U6JHtsYXlvdXRLZXl9YDtcblxuICAgIGNvbnN0IGxheW91dCA9IHRoaXMuX19nZXRPckNyZWF0ZUJpbmRHcm91cExheW91dChsYXlvdXRLZXksIGxheW91dEVudHJpZXMpO1xuICAgIHRoaXMuX19iaW5kR3JvdXBTdG9yYWdlQnVmZmVyID0gZ3B1RGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7IGxheW91dCwgZW50cmllcyB9KTtcbiAgICB0aGlzLl9fYmluZEdyb3VwTGF5b3V0U3RvcmFnZUJ1ZmZlciA9IGxheW91dDtcbiAgICB0aGlzLl9fYmluZEdyb3VwTGF5b3V0S2V5U3RvcmFnZUJ1ZmZlciA9IGxheW91dEtleTtcbiAgICAvLyBSZW5kZXIgYnVuZGxlcyByZWNvcmRlZCBiZWZvcmUgYmluZCB0aGUgcHJldmlvdXMgZ3JvdXAgMCwgd2hvc2UgYnVmZmVycyBtYXkgaGF2ZSBiZWVuIGRlc3Ryb3llZC5cbiAgICB0aGlzLl9fY2xlYXJSZW5kZXJCdW5kbGVDYWNoZSgpO1xuICAgIHJldHVybiB0aGlzLl9fYmluZEdyb3VwU3RvcmFnZUJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmRzIGEgdGV4dHVyZSBiaW5kaW5nIGFuZCBpdHMgc2FtcGxlciB0byBgX190ZXh0dXJlU2FtcGxlckJpbmRpbmdzYC5cbiAgICovXG4gIHByaXZhdGUgX19wdXNoVGV4dHVyZVNhbXBsZXJCaW5kaW5nKFxuICAgIHNsb3Q6IG51bWJlcixcbiAgICBkaW1lbnNpb246IEdQVVRleHR1cmVWaWV3RGltZW5zaW9uLFxuICAgIHZpc2liaWxpdHk6IG51bWJlcixcbiAgICB2aWV3OiBHUFVUZXh0dXJlVmlldyxcbiAgICBzYW1wbGVyOiBHUFVTYW1wbGVyXG4gICkge1xuICAgIGNvbnN0IGJpbmRpbmdzID0gdGhpcy5fX3RleHR1cmVTYW1wbGVyQmluZGluZ3M7XG4gICAgY29uc3QgaSA9IGJpbmRpbmdzLmNvdW50Kys7XG4gICAgYmluZGluZ3Muc2xvdHNbaV0gPSBzbG90O1xuICAgIGJpbmRpbmdzLmRpbWVuc2lvbnNbaV0gPSBkaW1lbnNpb247XG4gICAgYmluZGluZ3MudmlzaWJpbGl0aWVzW2ldID0gdmlzaWJpbGl0eTtcbiAgICBiaW5kaW5ncy52aWV3c1tpXSA9IHZpZXc7XG4gICAgYmluZGluZ3Muc2FtcGxlcnNbaV0gPSBzYW1wbGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbGxlY3RzIHRoZSB0ZXh0dXJlcyBhbmQgc2FtcGxlcnMgYm91bmQgYnkgYSBtYXRlcmlhbCBpbnRvIGBfX3RleHR1cmVTYW1wbGVyQmluZGluZ3NgLlxuICAgKiBUaGUgSUJMIGN1YmUgbWFwcyBjb21lIGZyb20gdGhlIG1lc2ggcmVuZGVyZXIgY29tcG9uZW50LCBub3QgZnJvbSB0aGUgbWF0ZXJpYWwuXG4gICAqL1xuICBwcml2YXRlIF9fY29sbGVjdFRleHR1cmVTYW1wbGVyQmluZGluZ3MoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIGRpZmZ1c2VDdWJlTWFwPzogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSxcbiAgICBzcGVjdWxhckN1YmVNYXA/OiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlLFxuICAgIHNoZWVuQ3ViZU1hcD86IEN1YmVUZXh0dXJlIHwgUmVuZGVyVGFyZ2V0VGV4dHVyZUN1YmVcbiAgKSB7XG4gICAgdGhpcy5fX3RleHR1cmVTYW1wbGVyQmluZGluZ3MuY291bnQgPSAwO1xuICAgIGNvbnN0IHJlc291cmNlcyA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXM7XG4gICAgY29uc3QgdmlzaWJpbGl0eSA9IEdQVVNoYWRlclN0YWdlLlZFUlRFWCB8IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UO1xuICAgIGNvbnN0IGR1bW15VGV4dHVyZXMgPSBlbmdpbmUuZHVtbXlUZXh0dXJlcztcblxuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgbWF0ZXJpYWwuX2F1dG9UZXh0dXJlRmllbGRWYXJpYWJsZXNPbmx5LnZhbHVlcygpKSB7XG4gICAgICBjb25zdCBpbmZvID0gdmFsdWUuaW5mbztcbiAgICAgIGlmIChcbiAgICAgICAgaW5mby5zZW1hbnRpYyA9PT0gJ2RpZmZ1c2VFbnZUZXh0dXJlJyB8fFxuICAgICAgICBpbmZvLnNlbWFudGljID09PSAnc3BlY3VsYXJFbnZUZXh0dXJlJyB8fFxuICAgICAgICBpbmZvLnNlbWFudGljID09PSAnc2hlZW5FbnZUZXh0dXJlJ1xuICAgICAgKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKCFDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNsb3QgPSB2YWx1ZS52YWx1ZVswXTtcbiAgICAgIGNvbnN0IHRleHR1cmUgPSB2YWx1ZS52YWx1ZVsxXSBhcyBBYnN0cmFjdFRleHR1cmU7XG4gICAgICBjb25zdCBzYW1wbGVyID0gdmFsdWUudmFsdWVbMl0gYXMgU2FtcGxlcjtcblxuICAgICAgbGV0IGRpbWVuc2lvbjogR1BVVGV4dHVyZVZpZXdEaW1lbnNpb24gPSAnMmQnO1xuICAgICAgaWYgKHRleHR1cmUgaW5zdGFuY2VvZiBDdWJlVGV4dHVyZSB8fCB0ZXh0dXJlIGluc3RhbmNlb2YgUmVuZGVyVGFyZ2V0VGV4dHVyZUN1YmUpIHtcbiAgICAgICAgZGltZW5zaW9uID0gJ2N1YmUnO1xuICAgICAgfSBlbHNlIGlmICh0ZXh0dXJlIGluc3RhbmNlb2YgVGV4dHVyZUFycmF5IHx8IHRleHR1cmUgaW5zdGFuY2VvZiBSZW5kZXJUYXJnZXRUZXh0dXJlMkRBcnJheSkge1xuICAgICAgICBkaW1lbnNpb24gPSAnMmQtYXJyYXknO1xuICAgICAgfVxuXG4gICAgICBsZXQgZ3B1VGV4dHVyZVZpZXcgPSByZXNvdXJjZXMuZ2V0KHRleHR1cmUuX3RleHR1cmVWaWV3UmVzb3VyY2VVaWQpIGFzIEdQVVRleHR1cmVWaWV3IHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGdwdVRleHR1cmVWaWV3ID09IG51bGwpIHtcbiAgICAgICAgY29uc3QgZHVtbXlUZXh0dXJlID1cbiAgICAgICAgICBkaW1lbnNpb24gPT09ICdjdWJlJyA/IGR1bW15VGV4dHVyZXMuZHVtbXlCbGFja0N1YmVUZXh0dXJlIDogZHVtbXlUZXh0dXJlcy5kdW1teVdoaXRlVGV4dHVyZTtcbiAgICAgICAgY29uc3QgZ3B1VGV4dHVyZSA9IHJlc291cmNlcy5nZXQoZHVtbXlUZXh0dXJlLl90ZXh0dXJlUmVzb3VyY2VVaWQpIGFzIEdQVVRleHR1cmU7XG4gICAgICAgIGdwdVRleHR1cmVWaWV3ID0gdGhpcy5fX2dldER1bW15VGV4dHVyZVZpZXcoZ3B1VGV4dHVyZSwgZGltZW5zaW9uKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFzYW1wbGVyLmNyZWF0ZWQpIHtcbiAgICAgICAgc2FtcGxlci5jcmVhdGUoKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGdwdVNhbXBsZXIgPSByZXNvdXJjZXMuZ2V0KHNhbXBsZXIuX3NhbXBsZXJSZXNvdXJjZVVpZCkgYXMgR1BVU2FtcGxlcjtcbiAgICAgIHRoaXMuX19wdXNoVGV4dHVyZVNhbXBsZXJCaW5kaW5nKHNsb3QsIGRpbWVuc2lvbiwgdmlzaWJpbGl0eSwgZ3B1VGV4dHVyZVZpZXcsIGdwdVNhbXBsZXIpO1xuICAgIH1cblxuICAgIGNvbnN0IGR1bW15Q3ViZVRleHR1cmUgPSBkdW1teVRleHR1cmVzLmR1bW15QmxhY2tDdWJlVGV4dHVyZTtcbiAgICBjb25zdCBkdW1teUN1YmVUZXh0dXJlVmlldyA9ICgpOiBHUFVUZXh0dXJlVmlldyA9PlxuICAgICAgcmVzb3VyY2VzLmdldChkdW1teUN1YmVUZXh0dXJlLl90ZXh0dXJlVmlld1Jlc291cmNlVWlkKSBhcyBHUFVUZXh0dXJlVmlldztcbiAgICBjb25zdCBkdW1teUN1YmVTYW1wbGVyID0gKCk6IEdQVVNhbXBsZXIgPT4gcmVzb3VyY2VzLmdldChkdW1teUN1YmVUZXh0dXJlLl9zYW1wbGVyUmVzb3VyY2VVaWQpIGFzIEdQVVNhbXBsZXI7XG5cbiAgICAvLyBEaWZmdXNlIElCTFxuICAgIGNvbnN0IGRpZmZ1c2VFbnZWYWx1ZSA9IG1hdGVyaWFsLmdldFRleHR1cmVQYXJhbWV0ZXIoU2hhZGVyU2VtYW50aWNzLkRpZmZ1c2VFbnZUZXh0dXJlLnN0cik7XG4gICAgaWYgKElzLmV4aXN0KGRpZmZ1c2VFbnZWYWx1ZSkpIHtcbiAgICAgIGNvbnN0IHZpZXcgPSByZXNvdXJjZXMuZ2V0KElzLmV4aXN0KGRpZmZ1c2VDdWJlTWFwKSA/IGRpZmZ1c2VDdWJlTWFwLl90ZXh0dXJlVmlld1Jlc291cmNlVWlkIDogLTEpIGFzXG4gICAgICAgIHwgR1BVVGV4dHVyZVZpZXdcbiAgICAgICAgfCB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBzYW1wbGVyID0gcmVzb3VyY2VzLmdldChJcy5leGlzdChkaWZmdXNlQ3ViZU1hcCkgPyBkaWZmdXNlQ3ViZU1hcC5fc2FtcGxlclJlc291cmNlVWlkIDogLTEpIGFzXG4gICAgICAgIHwgR1BVU2FtcGxlclxuICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX19wdXNoVGV4dHVyZVNhbXBsZXJCaW5kaW5nKFxuICAgICAgICBkaWZmdXNlRW52VmFsdWVbMF0sXG4gICAgICAgICdjdWJlJyxcbiAgICAgICAgdmlzaWJpbGl0eSxcbiAgICAgICAgdmlldyA/PyBkdW1teUN1YmVUZXh0dXJlVmlldygpLFxuICAgICAgICBzYW1wbGVyID8/IGR1bW15Q3ViZVNhbXBsZXIoKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBTcGVjdWxhciBJQkxcbiAgICBjb25zdCBzcGVjdWxhckVudlZhbHVlID0gbWF0ZXJpYWwuZ2V0VGV4dHVyZVBhcmFtZXRlcihTaGFkZXJTZW1hbnRpY3MuU3BlY3VsYXJFbnZUZXh0dXJlLnN0cik7XG4gICAgaWYgKElzLmV4aXN0KHNwZWN1bGFyRW52VmFsdWUpKSB7XG4gICAgICBjb25zdCB2aWV3ID0gcmVzb3VyY2VzLmdldChJcy5leGlzdChzcGVjdWxhckN1YmVNYXApID8gc3BlY3VsYXJDdWJlTWFwLl90ZXh0dXJlVmlld1Jlc291cmNlVWlkIDogLTEpIGFzXG4gICAgICAgIHwgR1BVVGV4dHVyZVZpZXdcbiAgICAgICAgfCB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBzYW1wbGVyID0gcmVzb3VyY2VzLmdldChJcy5leGlzdChzcGVjdWxhckN1YmVNYXApID8gc3BlY3VsYXJDdWJlTWFwLl9zYW1wbGVyUmVzb3VyY2VVaWQgOiAtMSkgYXNcbiAgICAgICAgfCBHUFVTYW1wbGVyXG4gICAgICAgIHwgdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX3B1c2hUZXh0dXJlU2FtcGxlckJpbmRpbmcoXG4gICAgICAgIHNwZWN1bGFyRW52VmFsdWVbMF0sXG4gICAgICAgICdjdWJlJyxcbiAgICAgICAgdmlzaWJpbGl0eSxcbiAgICAgICAgdmlldyA/PyBkdW1teUN1YmVUZXh0dXJlVmlldygpLFxuICAgICAgICBzYW1wbGVyID8/IGR1bW15Q3ViZVNhbXBsZXIoKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBTaGVlbiBJQkwgKHRoZSBzcGVjdWxhciBjdWJlIG1hcCBpcyB1c2VkIHdoZW4gdGhlcmUgaXMgbm8gc2hlZW4gY3ViZSBtYXApXG4gICAgY29uc3Qgc2hlZW5FbnZWYWx1ZSA9IG1hdGVyaWFsLmdldFRleHR1cmVQYXJhbWV0ZXIoU2hhZGVyU2VtYW50aWNzLlNoZWVuRW52VGV4dHVyZS5zdHIpO1xuICAgIGlmIChJcy5leGlzdChzaGVlbkVudlZhbHVlKSkge1xuICAgICAgY29uc3Qgc2hlZW5Tb3VyY2UgPSBJcy5leGlzdChzaGVlbkN1YmVNYXApID8gc2hlZW5DdWJlTWFwIDogc3BlY3VsYXJDdWJlTWFwO1xuICAgICAgY29uc3QgdmlldyA9IElzLmV4aXN0KHNoZWVuU291cmNlKVxuICAgICAgICA/IChyZXNvdXJjZXMuZ2V0KHNoZWVuU291cmNlLl90ZXh0dXJlVmlld1Jlc291cmNlVWlkKSBhcyBHUFVUZXh0dXJlVmlldyB8IHVuZGVmaW5lZClcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBzYW1wbGVyID0gSXMuZXhpc3Qoc2hlZW5Tb3VyY2UpXG4gICAgICAgID8gKHJlc291cmNlcy5nZXQoc2hlZW5Tb3VyY2UuX3NhbXBsZXJSZXNvdXJjZVVpZCkgYXMgR1BVU2FtcGxlciB8IHVuZGVmaW5lZClcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fcHVzaFRleHR1cmVTYW1wbGVyQmluZGluZyhcbiAgICAgICAgc2hlZW5FbnZWYWx1ZVswXSxcbiAgICAgICAgJ2N1YmUnLFxuICAgICAgICBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCxcbiAgICAgICAgdmlldyA/PyBkdW1teUN1YmVUZXh0dXJlVmlldygpLFxuICAgICAgICBzYW1wbGVyID8/IGR1bW15Q3ViZVNhbXBsZXIoKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYmluZCBncm91cHMgYW5kIHRoZSBwaXBlbGluZSBsYXlvdXQgZm9yIGRyYXdpbmcgd2l0aCBhIG1hdGVyaWFsLlxuICAgKlxuICAgKiBUaGUgdGV4dHVyZSAoZ3JvdXAgMSkgYW5kIHNhbXBsZXIgKGdyb3VwIDIpIGJpbmQgZ3JvdXBzIGFyZSBsb29rZWQgdXAgYnkgdGhlIHJlc291cmNlcyB0aGV5IGJpbmQsXG4gICAqIHNvIG1hdGVyaWFscyBiaW5kaW5nIHRoZSBzYW1lIHRleHR1cmVzIGFuZCBzYW1wbGVycyBzaGFyZSB0aGVtLiBUaGV5IGRvIG5vdCBkZXBlbmQgb24gdGhlIHJlbmRlclxuICAgKiBwaXBlbGluZSwgc28gYSBwaXBlbGluZSBjYW4gYmUgcmVjcmVhdGVkIHdpdGhvdXQgcmVjcmVhdGluZyBiaW5kIGdyb3VwcyBhbmQgdmljZSB2ZXJzYS5cbiAgICovXG4gIHByaXZhdGUgX19nZXREcmF3QmluZEdyb3VwcyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgZGlmZnVzZUN1YmVNYXA/OiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlLFxuICAgIHNwZWN1bGFyQ3ViZU1hcD86IEN1YmVUZXh0dXJlIHwgUmVuZGVyVGFyZ2V0VGV4dHVyZUN1YmUsXG4gICAgc2hlZW5DdWJlTWFwPzogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZVxuICApOiBEcmF3QmluZEdyb3VwcyB7XG4gICAgY29uc3Qgc3RvcmFnZSA9IHRoaXMuX19nZXRTdG9yYWdlQmluZEdyb3VwKCk7XG4gICAgdGhpcy5fX2NvbGxlY3RUZXh0dXJlU2FtcGxlckJpbmRpbmdzKGVuZ2luZSwgbWF0ZXJpYWwsIGRpZmZ1c2VDdWJlTWFwLCBzcGVjdWxhckN1YmVNYXAsIHNoZWVuQ3ViZU1hcCk7XG5cbiAgICBjb25zdCBiaW5kaW5ncyA9IHRoaXMuX190ZXh0dXJlU2FtcGxlckJpbmRpbmdzO1xuICAgIGxldCB0ZXh0dXJlTGF5b3V0S2V5ID0gJ3RleHR1cmU6JztcbiAgICBsZXQgc2FtcGxlckxheW91dEtleSA9ICdzYW1wbGVyOic7XG4gICAgbGV0IHRleHR1cmVSZXNvdXJjZUtleSA9ICcnO1xuICAgIGxldCBzYW1wbGVyUmVzb3VyY2VLZXkgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmNvdW50OyBpKyspIHtcbiAgICAgIHRleHR1cmVMYXlvdXRLZXkgKz0gYCR7YmluZGluZ3Muc2xvdHNbaV19LyR7YmluZGluZ3MuZGltZW5zaW9uc1tpXX0vJHtiaW5kaW5ncy52aXNpYmlsaXRpZXNbaV19LGA7XG4gICAgICBzYW1wbGVyTGF5b3V0S2V5ICs9IGAke2JpbmRpbmdzLnNsb3RzW2ldfS8ke2JpbmRpbmdzLnZpc2liaWxpdGllc1tpXX0sYDtcbiAgICAgIHRleHR1cmVSZXNvdXJjZUtleSArPSBgJHt0aGlzLl9fZ2V0R3B1T2JqZWN0SWQoYmluZGluZ3Mudmlld3NbaV0pfSxgO1xuICAgICAgc2FtcGxlclJlc291cmNlS2V5ICs9IGAke3RoaXMuX19nZXRHcHVPYmplY3RJZChiaW5kaW5ncy5zYW1wbGVyc1tpXSl9LGA7XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dHVyZUJpbmRHcm91cEtleSA9IGAke3RleHR1cmVMYXlvdXRLZXl9fCR7dGV4dHVyZVJlc291cmNlS2V5fWA7XG4gICAgbGV0IHRleHR1cmUgPSB0aGlzLl9fdGV4dHVyZUJpbmRHcm91cENhY2hlLmdldCh0ZXh0dXJlQmluZEdyb3VwS2V5KTtcbiAgICBjb25zdCB0ZXh0dXJlTGF5b3V0ID0gdGhpcy5fX2dldFRleHR1cmVCaW5kR3JvdXBMYXlvdXQodGV4dHVyZUxheW91dEtleSk7XG4gICAgaWYgKHRleHR1cmUgPT0gbnVsbCkge1xuICAgICAgY29uc3QgZW50cmllczogR1BVQmluZEdyb3VwRW50cnlbXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5ncy5jb3VudDsgaSsrKSB7XG4gICAgICAgIGVudHJpZXMucHVzaCh7IGJpbmRpbmc6IGJpbmRpbmdzLnNsb3RzW2ldLCByZXNvdXJjZTogYmluZGluZ3Mudmlld3NbaV0gfSk7XG4gICAgICB9XG4gICAgICB0ZXh0dXJlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZS5jcmVhdGVCaW5kR3JvdXAoeyBsYXlvdXQ6IHRleHR1cmVMYXlvdXQsIGVudHJpZXMgfSk7XG4gICAgICB0aGlzLl9fdGV4dHVyZUJpbmRHcm91cENhY2hlLnNldCh0ZXh0dXJlQmluZEdyb3VwS2V5LCB0ZXh0dXJlKTtcbiAgICB9XG5cbiAgICBjb25zdCBzYW1wbGVyQmluZEdyb3VwS2V5ID0gYCR7c2FtcGxlckxheW91dEtleX18JHtzYW1wbGVyUmVzb3VyY2VLZXl9YDtcbiAgICBsZXQgc2FtcGxlciA9IHRoaXMuX19zYW1wbGVyQmluZEdyb3VwQ2FjaGUuZ2V0KHNhbXBsZXJCaW5kR3JvdXBLZXkpO1xuICAgIGNvbnN0IHNhbXBsZXJMYXlvdXQgPSB0aGlzLl9fZ2V0U2FtcGxlckJpbmRHcm91cExheW91dChzYW1wbGVyTGF5b3V0S2V5KTtcbiAgICBpZiAoc2FtcGxlciA9PSBudWxsKSB7XG4gICAgICBjb25zdCBlbnRyaWVzOiBHUFVCaW5kR3JvdXBFbnRyeVtdID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmNvdW50OyBpKyspIHtcbiAgICAgICAgZW50cmllcy5wdXNoKHsgYmluZGluZzogYmluZGluZ3Muc2xvdHNbaV0sIHJlc291cmNlOiBiaW5kaW5ncy5zYW1wbGVyc1tpXSB9KTtcbiAgICAgIH1cbiAgICAgIHNhbXBsZXIgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7IGxheW91dDogc2FtcGxlckxheW91dCwgZW50cmllcyB9KTtcbiAgICAgIHRoaXMuX19zYW1wbGVyQmluZEdyb3VwQ2FjaGUuc2V0KHNhbXBsZXJCaW5kR3JvdXBLZXksIHNhbXBsZXIpO1xuICAgIH1cblxuICAgIGNvbnN0IHBpcGVsaW5lTGF5b3V0S2V5ID0gYCR7dGhpcy5fX2JpbmRHcm91cExheW91dEtleVN0b3JhZ2VCdWZmZXJ9IyR7dGV4dHVyZUxheW91dEtleX0jJHtzYW1wbGVyTGF5b3V0S2V5fWA7XG4gICAgbGV0IHBpcGVsaW5lTGF5b3V0ID0gdGhpcy5fX3BpcGVsaW5lTGF5b3V0Q2FjaGUuZ2V0KHBpcGVsaW5lTGF5b3V0S2V5KTtcbiAgICBpZiAocGlwZWxpbmVMYXlvdXQgPT0gbnVsbCkge1xuICAgICAgcGlwZWxpbmVMYXlvdXQgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcbiAgICAgICAgYmluZEdyb3VwTGF5b3V0czogW1xuICAgICAgICAgIHRoaXMuX19iaW5kR3JvdXBMYXlvdXRTdG9yYWdlQnVmZmVyISxcbiAgICAgICAgICB0ZXh0dXJlTGF5b3V0LFxuICAgICAgICAgIHNhbXBsZXJMYXlvdXQsXG4gICAgICAgICAgdGhpcy5fX2JpbmRHcm91cExheW91dFVuaWZvcm1EcmF3UGFyYW1ldGVycyEsXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX19waXBlbGluZUxheW91dENhY2hlLnNldChwaXBlbGluZUxheW91dEtleSwgcGlwZWxpbmVMYXlvdXQpO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSB0aGlzLl9fZHJhd0JpbmRHcm91cHM7XG4gICAgaWYgKHJlc3VsdCA9PSBudWxsKSB7XG4gICAgICByZXN1bHQgPSB7IHN0b3JhZ2UsIHRleHR1cmUsIHNhbXBsZXIsIHBpcGVsaW5lTGF5b3V0LCBwaXBlbGluZUxheW91dEtleSB9O1xuICAgICAgdGhpcy5fX2RyYXdCaW5kR3JvdXBzID0gcmVzdWx0O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gICAgICByZXN1bHQudGV4dHVyZSA9IHRleHR1cmU7XG4gICAgICByZXN1bHQuc2FtcGxlciA9IHNhbXBsZXI7XG4gICAgICByZXN1bHQucGlwZWxpbmVMYXlvdXQgPSBwaXBlbGluZUxheW91dDtcbiAgICAgIHJlc3VsdC5waXBlbGluZUxheW91dEtleSA9IHBpcGVsaW5lTGF5b3V0S2V5O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldFRleHR1cmVCaW5kR3JvdXBMYXlvdXQobGF5b3V0S2V5OiBzdHJpbmcpOiBHUFVCaW5kR3JvdXBMYXlvdXQge1xuICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuX19iaW5kR3JvdXBMYXlvdXRDYWNoZS5nZXQobGF5b3V0S2V5KTtcbiAgICBpZiAoY2FjaGVkICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgfVxuICAgIGNvbnN0IGJpbmRpbmdzID0gdGhpcy5fX3RleHR1cmVTYW1wbGVyQmluZGluZ3M7XG4gICAgY29uc3QgZW50cmllczogR1BVQmluZEdyb3VwTGF5b3V0RW50cnlbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ3MuY291bnQ7IGkrKykge1xuICAgICAgZW50cmllcy5wdXNoKHtcbiAgICAgICAgYmluZGluZzogYmluZGluZ3Muc2xvdHNbaV0sXG4gICAgICAgIHRleHR1cmU6IHsgdmlld0RpbWVuc2lvbjogYmluZGluZ3MuZGltZW5zaW9uc1tpXSB9LFxuICAgICAgICB2aXNpYmlsaXR5OiBiaW5kaW5ncy52aXNpYmlsaXRpZXNbaV0sXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19nZXRPckNyZWF0ZUJpbmRHcm91cExheW91dChsYXlvdXRLZXksIGVudHJpZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldFNhbXBsZXJCaW5kR3JvdXBMYXlvdXQobGF5b3V0S2V5OiBzdHJpbmcpOiBHUFVCaW5kR3JvdXBMYXlvdXQge1xuICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuX19iaW5kR3JvdXBMYXlvdXRDYWNoZS5nZXQobGF5b3V0S2V5KTtcbiAgICBpZiAoY2FjaGVkICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgfVxuICAgIGNvbnN0IGJpbmRpbmdzID0gdGhpcy5fX3RleHR1cmVTYW1wbGVyQmluZGluZ3M7XG4gICAgY29uc3QgZW50cmllczogR1BVQmluZEdyb3VwTGF5b3V0RW50cnlbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ3MuY291bnQ7IGkrKykge1xuICAgICAgZW50cmllcy5wdXNoKHtcbiAgICAgICAgYmluZGluZzogYmluZGluZ3Muc2xvdHNbaV0sXG4gICAgICAgIHNhbXBsZXI6IHsgdHlwZTogJ2ZpbHRlcmluZycgfSxcbiAgICAgICAgdmlzaWJpbGl0eTogYmluZGluZ3MudmlzaWJpbGl0aWVzW2ldLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fZ2V0T3JDcmVhdGVCaW5kR3JvdXBMYXlvdXQobGF5b3V0S2V5LCBlbnRyaWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBjcmVhdGUgYSBUZXh0dXJlXG4gICAqIEBwYXJhbSBpbWFnZURhdGFcbiAgICogQHBhcmFtIHBhcmFtMVxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgYXN5bmMgY3JlYXRlVGV4dHVyZUZyb21IVE1MSW1hZ2VFbGVtZW50KFxuICAgIGltYWdlRGF0YTogSFRNTEltYWdlRWxlbWVudCxcbiAgICB7XG4gICAgICBpbnRlcm5hbEZvcm1hdCxcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgZ2VuZXJhdGVNaXBtYXAsXG4gICAgfToge1xuICAgICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICAgICAgd2lkdGg6IFNpemU7XG4gICAgICBoZWlnaHQ6IFNpemU7XG4gICAgICBnZW5lcmF0ZU1pcG1hcDogYm9vbGVhbjtcbiAgICB9XG4gICk6IFByb21pc2U8V2ViR1BVUmVzb3VyY2VIYW5kbGU+IHtcbiAgICBpbWFnZURhdGEuY3Jvc3NPcmlnaW4gPSAnQW5vbnltb3VzJztcblxuICAgIC8vIFdhaXQgZm9yIHRoZSBpbWFnZSB0byBiZSBmdWxseSBsb2FkZWQgaWYgaXQncyBub3QgYWxyZWFkeVxuICAgIGlmICghaW1hZ2VEYXRhLmNvbXBsZXRlIHx8IGltYWdlRGF0YS5uYXR1cmFsV2lkdGggPT09IDApIHtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaW1hZ2VEYXRhLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgaW1hZ2VEYXRhLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKCdGYWlsZWQgdG8gbG9hZCBpbWFnZScpKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEVuc3VyZSB0aGUgaW1hZ2UgaXMgZnVsbHkgZGVjb2RlZCBiZWZvcmUgY3JlYXRpbmcgV2ViR1BVIHRleHR1cmVcbiAgICAvLyBIVE1MSW1hZ2VFbGVtZW50IG1heSBub3QgYmUgcmVhZHkgZm9yIGNvcHlFeHRlcm5hbEltYWdlVG9UZXh0dXJlXG4gICAgYXdhaXQgaW1hZ2VEYXRhLmRlY29kZSgpO1xuXG4gICAgLy8gVXNpbmcgY3JlYXRlSW1hZ2VCaXRtYXAgZW5zdXJlcyB0aGUgaW1hZ2UgaXMgcHJvcGVybHkgcHJlcGFyZWQgZm9yIFdlYkdQVVxuICAgIGNvbnN0IGltYWdlQml0bWFwID0gYXdhaXQgY3JlYXRlSW1hZ2VCaXRtYXAoaW1hZ2VEYXRhKTtcblxuICAgIGNvbnN0IHRleHR1cmVIYW5kbGUgPSBhd2FpdCB0aGlzLl9fY3JlYXRlVGV4dHVyZUlubmVyKHdpZHRoLCBoZWlnaHQsIGludGVybmFsRm9ybWF0LCBnZW5lcmF0ZU1pcG1hcCwgaW1hZ2VCaXRtYXApO1xuXG4gICAgcmV0dXJuIHRleHR1cmVIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogY3JlYXRlIENvbXByZXNzZWRUZXh0dXJlRnJvbUJhc2lzXG4gICAqIEBwYXJhbSBiYXNpc0ZpbGVcbiAgICogQHJldHVybnNcbiAgICovXG4gIGNyZWF0ZUNvbXByZXNzZWRUZXh0dXJlRnJvbUJhc2lzKGJhc2lzRmlsZTogQmFzaXNGaWxlKTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIGxldCBiYXNpc0NvbXByZXNzaW9uVHlwZTogQmFzaXNDb21wcmVzc2lvblR5cGVFbnVtO1xuICAgIGxldCBjb21wcmVzc2lvblR5cGU6IEdQVVRleHR1cmVGb3JtYXQgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgbWlwbWFwRGVwdGggPSBiYXNpc0ZpbGUuZ2V0TnVtTGV2ZWxzKDApO1xuICAgIGNvbnN0IHdpZHRoID0gYmFzaXNGaWxlLmdldEltYWdlV2lkdGgoMCwgMCk7XG4gICAgY29uc3QgaGVpZ2h0ID0gYmFzaXNGaWxlLmdldEltYWdlSGVpZ2h0KDAsIDApO1xuXG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcbiAgICBjb25zdCBncHVBZGFwdGVyID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdUFkYXB0ZXI7XG5cbiAgICAvLyBcdTMwQzdcdTMwRDBcdTMwQzNcdTMwQjBcdTYwQzVcdTU4MzFcdUZGMUFcdTMwQjVcdTMwRERcdTMwRkNcdTMwQzhcdTMwNTVcdTMwOENcdTMwNjZcdTMwNDRcdTMwOEJcdTU3MjdcdTdFMkVcdTMwRDVcdTMwQTlcdTMwRkNcdTMwREVcdTMwQzNcdTMwQzhcdTMwOTJcdTc4QkFcdThBOERcbiAgICBjb25zdCBzM3RjID0gZ3B1QWRhcHRlci5mZWF0dXJlcy5oYXMoJ3RleHR1cmUtY29tcHJlc3Npb24tYmMnKTtcbiAgICBjb25zdCBldGMyID0gZ3B1QWRhcHRlci5mZWF0dXJlcy5oYXMoJ3RleHR1cmUtY29tcHJlc3Npb24tZXRjMicpO1xuICAgIGNvbnN0IGFzdGMgPSBncHVBZGFwdGVyLmZlYXR1cmVzLmhhcygndGV4dHVyZS1jb21wcmVzc2lvbi1hc3RjJyk7XG5cbiAgICBpZiAoczN0Yykge1xuICAgICAgYmFzaXNDb21wcmVzc2lvblR5cGUgPSBCYXNpc0NvbXByZXNzaW9uVHlwZS5CQzM7XG4gICAgICBjb21wcmVzc2lvblR5cGUgPSAnYmMzLXJnYmEtdW5vcm0nO1xuICAgIH0gZWxzZSBpZiAoZXRjMikge1xuICAgICAgYmFzaXNDb21wcmVzc2lvblR5cGUgPSBCYXNpc0NvbXByZXNzaW9uVHlwZS5FVEMyO1xuICAgICAgY29tcHJlc3Npb25UeXBlID0gJ2V0YzItcmdiYTh1bm9ybSc7XG4gICAgfSBlbHNlIGlmIChhc3RjKSB7XG4gICAgICBiYXNpc0NvbXByZXNzaW9uVHlwZSA9IEJhc2lzQ29tcHJlc3Npb25UeXBlLkFTVEM7XG4gICAgICBjb21wcmVzc2lvblR5cGUgPSAnYXN0Yy00eDQtdW5vcm0nO1xuICAgIH1cblxuICAgIGlmICghY29tcHJlc3Npb25UeXBlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ05vIHN1cHBvcnRlZCBjb21wcmVzc2lvbiBmb3JtYXQgZm91bmQsIGZhbGxpbmcgYmFjayB0byB1bmNvbXByZXNzZWQnKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gc3VwcG9ydGVkIGNvbXByZXNzaW9uIGZvcm1hdCBmb3VuZCcpO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHR1cmVEZXNjcmlwdG9yOiBHUFVUZXh0dXJlRGVzY3JpcHRvciA9IHtcbiAgICAgIHNpemU6IFt3aWR0aCwgaGVpZ2h0LCAxXSxcbiAgICAgIGZvcm1hdDogY29tcHJlc3Npb25UeXBlLFxuICAgICAgbWlwTGV2ZWxDb3VudDogbWlwbWFwRGVwdGgsXG4gICAgICB1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlRFWFRVUkVfQklORElORyB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCxcbiAgICB9O1xuXG4gICAgY29uc3QgZ3B1VGV4dHVyZSA9IGdwdURldmljZS5jcmVhdGVUZXh0dXJlKHRleHR1cmVEZXNjcmlwdG9yKTtcblxuICAgIC8vIFJldHJpZXZlIGJsb2NrIGluZm9ybWF0aW9uIGZvciB0aGUgY29tcHJlc3NlZCBmb3JtYXRcbiAgICBsZXQgYmxvY2tJbmZvID0geyBieXRlU2l6ZTogMTYsIHdpZHRoOiA0LCBoZWlnaHQ6IDQgfTsgLy8gXHUzMEM3XHUzMEQ1XHUzMEE5XHUzMEVCXHUzMEM4XHU1MDI0XG4gICAgaWYgKGNvbXByZXNzaW9uVHlwZSA9PT0gJ2JjMS1yZ2JhLXVub3JtJykge1xuICAgICAgYmxvY2tJbmZvID0geyBieXRlU2l6ZTogOCwgd2lkdGg6IDQsIGhlaWdodDogNCB9O1xuICAgIH0gZWxzZSBpZiAoY29tcHJlc3Npb25UeXBlID09PSAnYmMzLXJnYmEtdW5vcm0nIHx8IGNvbXByZXNzaW9uVHlwZSA9PT0gJ2FzdGMtNHg0LXVub3JtJykge1xuICAgICAgYmxvY2tJbmZvID0geyBieXRlU2l6ZTogMTYsIHdpZHRoOiA0LCBoZWlnaHQ6IDQgfTtcbiAgICB9IGVsc2UgaWYgKGNvbXByZXNzaW9uVHlwZSA9PT0gJ2V0YzItcmdiYTh1bm9ybScpIHtcbiAgICAgIGJsb2NrSW5mbyA9IHsgYnl0ZVNpemU6IDE2LCB3aWR0aDogNCwgaGVpZ2h0OiA0IH07XG4gICAgfSBlbHNlIGlmIChjb21wcmVzc2lvblR5cGUgPT09ICdldGMyLXJnYjh1bm9ybScpIHtcbiAgICAgIGJsb2NrSW5mbyA9IHsgYnl0ZVNpemU6IDgsIHdpZHRoOiA0LCBoZWlnaHQ6IDQgfTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1pcG1hcERlcHRoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1pcFdpZHRoID0gYmFzaXNGaWxlLmdldEltYWdlV2lkdGgoMCwgaSk7XG4gICAgICBjb25zdCBtaXBIZWlnaHQgPSBiYXNpc0ZpbGUuZ2V0SW1hZ2VIZWlnaHQoMCwgaSk7XG4gICAgICBjb25zdCB0ZXh0dXJlU291cmNlID0gdGhpcy5kZWNvZGVCYXNpc0ltYWdlKGJhc2lzRmlsZSwgYmFzaXNDb21wcmVzc2lvblR5cGUhLCAwLCBpKTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBudW1iZXIgb2YgYmxvY2tzIGZvciB0aGUgY29tcHJlc3NlZCB0ZXh0dXJlIChtaW5pbXVtIDEgYmxvY2spXG4gICAgICBjb25zdCBibG9ja3NXaWRlID0gTWF0aC5tYXgoMSwgTWF0aC5jZWlsKG1pcFdpZHRoIC8gYmxvY2tJbmZvLndpZHRoKSk7XG4gICAgICBjb25zdCBibG9ja3NIaWdoID0gTWF0aC5tYXgoMSwgTWF0aC5jZWlsKG1pcEhlaWdodCAvIGJsb2NrSW5mby5oZWlnaHQpKTtcblxuICAgICAgLy8gRm9yIGNvbXByZXNzZWQgdGV4dHVyZXMgaW4gV2ViR1BVLCBieXRlc1BlclJvdyBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMjU2IGJ5dGVzXG4gICAgICBjb25zdCB1bmFsaWduZWRCeXRlc1BlclJvdyA9IGJsb2Nrc1dpZGUgKiBibG9ja0luZm8uYnl0ZVNpemU7XG4gICAgICBjb25zdCBieXRlc1BlclJvdyA9IE1hdGguY2VpbCh1bmFsaWduZWRCeXRlc1BlclJvdyAvIDI1NikgKiAyNTY7XG5cbiAgICAgIC8vIENoZWNrIGlmIGRhdGEgbmVlZHMgdG8gYmUgcGFkZGVkXG4gICAgICBsZXQgY29tcHJlc3NlZFRleHR1cmVEYXRhOiBVaW50OEFycmF5O1xuICAgICAgY29uc3QgZXhwZWN0ZWREYXRhU2l6ZSA9IGJ5dGVzUGVyUm93ICogYmxvY2tzSGlnaDtcblxuICAgICAgaWYgKGJ5dGVzUGVyUm93ICE9PSB1bmFsaWduZWRCeXRlc1BlclJvdyB8fCB0ZXh0dXJlU291cmNlLmxlbmd0aCA8IGV4cGVjdGVkRGF0YVNpemUpIHtcbiAgICAgICAgLy8gSWYgcGFkZGluZyBpcyBuZWVkZWQgb3IgdGhlIGFjdHVhbCBkYXRhIHNpemUgaXMgc21hbGxlciB0aGFuIGV4cGVjdGVkXG4gICAgICAgIGNvbnN0IHBhZGRlZERhdGEgPSBuZXcgVWludDhBcnJheShleHBlY3RlZERhdGFTaXplKTtcblxuICAgICAgICBpZiAodGV4dHVyZVNvdXJjZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gSWYgYWN0dWFsIGRhdGEgZXhpc3RzLCBjb3B5IGl0IHJvdyBieSByb3dcbiAgICAgICAgICBjb25zdCBhY3R1YWxSb3dzQXZhaWxhYmxlID0gTWF0aC5mbG9vcih0ZXh0dXJlU291cmNlLmxlbmd0aCAvIHVuYWxpZ25lZEJ5dGVzUGVyUm93KTtcbiAgICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCBNYXRoLm1pbihibG9ja3NIaWdoLCBhY3R1YWxSb3dzQXZhaWxhYmxlKTsgcm93KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHNyY09mZnNldCA9IHJvdyAqIHVuYWxpZ25lZEJ5dGVzUGVyUm93O1xuICAgICAgICAgICAgY29uc3QgZHN0T2Zmc2V0ID0gcm93ICogYnl0ZXNQZXJSb3c7XG4gICAgICAgICAgICBjb25zdCBjb3B5TGVuZ3RoID0gTWF0aC5taW4odW5hbGlnbmVkQnl0ZXNQZXJSb3csIHRleHR1cmVTb3VyY2UubGVuZ3RoIC0gc3JjT2Zmc2V0KTtcbiAgICAgICAgICAgIGlmIChjb3B5TGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBwYWRkZWREYXRhLnNldCh0ZXh0dXJlU291cmNlLnN1YmFycmF5KHNyY09mZnNldCwgc3JjT2Zmc2V0ICsgY29weUxlbmd0aCksIGRzdE9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbXByZXNzZWRUZXh0dXJlRGF0YSA9IHBhZGRlZERhdGE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wcmVzc2VkVGV4dHVyZURhdGEgPSB0ZXh0dXJlU291cmNlO1xuICAgICAgfVxuXG4gICAgICBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX19hc3NlcnRBcnJheUJ1ZmZlclZpZXcoY29tcHJlc3NlZFRleHR1cmVEYXRhKTtcbiAgICAgIGdwdURldmljZS5xdWV1ZS53cml0ZVRleHR1cmUoXG4gICAgICAgIHtcbiAgICAgICAgICB0ZXh0dXJlOiBncHVUZXh0dXJlLFxuICAgICAgICAgIG1pcExldmVsOiBpLFxuICAgICAgICB9LFxuICAgICAgICBjb21wcmVzc2VkVGV4dHVyZURhdGEsXG4gICAgICAgIHtcbiAgICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgICAgYnl0ZXNQZXJSb3csXG4gICAgICAgICAgcm93c1BlckltYWdlOiBibG9ja3NIaWdoLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgd2lkdGg6IE1hdGguY2VpbChtaXBXaWR0aCAvIGJsb2NrSW5mby53aWR0aCkgKiBibG9ja0luZm8ud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBNYXRoLmNlaWwobWlwSGVpZ2h0IC8gYmxvY2tJbmZvLmhlaWdodCkgKiBibG9ja0luZm8uaGVpZ2h0LFxuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHR1cmVIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShncHVUZXh0dXJlKTtcbiAgICByZXR1cm4gdGV4dHVyZUhhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBkZWNvZGUgdGhlIEJhc2lzSW1hZ2VcbiAgICogQHBhcmFtIGJhc2lzRmlsZVxuICAgKiBAcGFyYW0gYmFzaXNDb21wcmVzc2lvblR5cGVcbiAgICogQHBhcmFtIGltYWdlSW5kZXhcbiAgICogQHBhcmFtIGxldmVsSW5kZXhcbiAgICogQHJldHVybnNcbiAgICovXG4gIHByaXZhdGUgZGVjb2RlQmFzaXNJbWFnZShcbiAgICBiYXNpc0ZpbGU6IEJhc2lzRmlsZSxcbiAgICBiYXNpc0NvbXByZXNzaW9uVHlwZTogQmFzaXNDb21wcmVzc2lvblR5cGVFbnVtLFxuICAgIGltYWdlSW5kZXg6IEluZGV4LFxuICAgIGxldmVsSW5kZXg6IEluZGV4XG4gICkge1xuICAgIGNvbnN0IGV4dHJhY3RTaXplID0gYmFzaXNGaWxlLmdldEltYWdlVHJhbnNjb2RlZFNpemVJbkJ5dGVzKGltYWdlSW5kZXgsIGxldmVsSW5kZXgsIGJhc2lzQ29tcHJlc3Npb25UeXBlIS5pbmRleCk7XG4gICAgY29uc3QgdGV4dHVyZVNvdXJjZSA9IG5ldyBVaW50OEFycmF5KGV4dHJhY3RTaXplKTtcbiAgICBpZiAoIWJhc2lzRmlsZS50cmFuc2NvZGVJbWFnZSh0ZXh0dXJlU291cmNlLCBpbWFnZUluZGV4LCBsZXZlbEluZGV4LCBiYXNpc0NvbXByZXNzaW9uVHlwZSEuaW5kZXgsIDAsIDApKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignZmFpbGVkIHRvIHRyYW5zY29kZSB0aGUgaW1hZ2UuJyk7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0dXJlU291cmNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbmQgYmluZCBjb21wcmVzc2VkIHRleHR1cmUgb2JqZWN0XG4gICAqIEBwYXJhbSB0ZXh0dXJlRGF0YUFycmF5IHRyYW5zY29kZWQgdGV4dHVyZSBkYXRhIGZvciBlYWNoIG1pcG1hcHMobGV2ZWxzKVxuICAgKiBAcGFyYW0gY29tcHJlc3Npb25UZXh0dXJlVHlwZVxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ29tcHJlc3NlZFRleHR1cmUoXG4gICAgdGV4dHVyZURhdGFBcnJheTogVGV4dHVyZURhdGFbXSxcbiAgICBjb21wcmVzc2lvblRleHR1cmVUeXBlOiBDb21wcmVzc2lvblRleHR1cmVUeXBlRW51bVxuICApOiBQcm9taXNlPFdlYkdQVVJlc291cmNlSGFuZGxlPiB7XG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcbiAgICBjb25zdCBibG9ja0luZm8gPSBjb21wcmVzc2lvblRleHR1cmVUeXBlLmJsb2NrSW5mbyB8fCB7IGJ5dGVTaXplOiA0LCB3aWR0aDogMSwgaGVpZ2h0OiAxIH07XG5cbiAgICBjb25zdCB0ZXh0dXJlRGF0YUxldmVsMCA9IHRleHR1cmVEYXRhQXJyYXlbMF07XG5cbiAgICBjb25zdCB0ZXh0dXJlRGVzY3JpcHRvcjogR1BVVGV4dHVyZURlc2NyaXB0b3IgPSB7XG4gICAgICBzaXplOiBbXG4gICAgICAgIE1hdGguY2VpbCh0ZXh0dXJlRGF0YUxldmVsMC53aWR0aCAvIGJsb2NrSW5mby53aWR0aCkgKiBibG9ja0luZm8ud2lkdGgsXG4gICAgICAgIE1hdGguY2VpbCh0ZXh0dXJlRGF0YUxldmVsMC5oZWlnaHQgLyBibG9ja0luZm8uaGVpZ2h0KSAqIGJsb2NrSW5mby5oZWlnaHQsXG4gICAgICAgIDEsXG4gICAgICBdLFxuICAgICAgZm9ybWF0OiBjb21wcmVzc2lvblRleHR1cmVUeXBlLndlYmdwdSBhcyBHUFVUZXh0dXJlRm9ybWF0LFxuICAgICAgbWlwTGV2ZWxDb3VudDogdGV4dHVyZURhdGFBcnJheS5sZW5ndGgsXG4gICAgICB1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlRFWFRVUkVfQklORElORyB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCxcbiAgICB9O1xuXG4gICAgY29uc3QgdGV4dHVyZSA9IGdwdURldmljZS5jcmVhdGVUZXh0dXJlKHRleHR1cmVEZXNjcmlwdG9yKTtcblxuICAgIGZvciAobGV0IGxldmVsID0gMDsgbGV2ZWwgPCB0ZXh0dXJlRGF0YUFycmF5Lmxlbmd0aDsgbGV2ZWwrKykge1xuICAgICAgY29uc3QgdGV4dHVyZURhdGEgPSB0ZXh0dXJlRGF0YUFycmF5W2xldmVsXTtcbiAgICAgIGNvbnN0IG1pcFdpZHRoID0gdGV4dHVyZURhdGEud2lkdGg7XG4gICAgICBjb25zdCBtaXBIZWlnaHQgPSB0ZXh0dXJlRGF0YS5oZWlnaHQ7XG5cbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbnVtYmVyIG9mIGJsb2NrcyBmb3IgdGhlIGNvbXByZXNzZWQgdGV4dHVyZSAobWluaW11bSAxIGJsb2NrKVxuICAgICAgY29uc3QgYmxvY2tzV2lkZSA9IE1hdGgubWF4KDEsIE1hdGguY2VpbChtaXBXaWR0aCAvIGJsb2NrSW5mby53aWR0aCkpO1xuICAgICAgY29uc3QgYmxvY2tzSGlnaCA9IE1hdGgubWF4KDEsIE1hdGguY2VpbChtaXBIZWlnaHQgLyBibG9ja0luZm8uaGVpZ2h0KSk7XG5cbiAgICAgIC8vIEZvciBjb21wcmVzc2VkIHRleHR1cmVzIGluIFdlYkdQVSwgYnl0ZXNQZXJSb3cgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDI1NiBieXRlc1xuICAgICAgY29uc3QgdW5hbGlnbmVkQnl0ZXNQZXJSb3cgPSBibG9ja3NXaWRlICogYmxvY2tJbmZvLmJ5dGVTaXplO1xuICAgICAgY29uc3QgYnl0ZXNQZXJSb3cgPSBNYXRoLmNlaWwodW5hbGlnbmVkQnl0ZXNQZXJSb3cgLyAyNTYpICogMjU2O1xuXG4gICAgICAvLyBSZXRyaWV2ZSB0aGUgYXBwcm9wcmlhdGUgVWludDhBcnJheSBmcm9tIEFycmF5QnVmZmVyVmlld1xuICAgICAgY29uc3Qgb3JpZ2luYWxEYXRhID1cbiAgICAgICAgdGV4dHVyZURhdGEuYnVmZmVyIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgICAgID8gdGV4dHVyZURhdGEuYnVmZmVyXG4gICAgICAgICAgOiBuZXcgVWludDhBcnJheSh0ZXh0dXJlRGF0YS5idWZmZXIuYnVmZmVyLCB0ZXh0dXJlRGF0YS5idWZmZXIuYnl0ZU9mZnNldCwgdGV4dHVyZURhdGEuYnVmZmVyLmJ5dGVMZW5ndGgpO1xuXG4gICAgICAvLyBJZiBieXRlc1BlclJvdyBpcyBub3QgYWxpZ25lZCwgZGF0YSBuZWVkcyB0byBiZSBwYWRkZWRcbiAgICAgIGxldCBjb21wcmVzc2VkVGV4dHVyZURhdGE6IFVpbnQ4QXJyYXk7XG4gICAgICBjb25zdCBleHBlY3RlZERhdGFTaXplID0gYnl0ZXNQZXJSb3cgKiBibG9ja3NIaWdoO1xuXG4gICAgICBpZiAoYnl0ZXNQZXJSb3cgIT09IHVuYWxpZ25lZEJ5dGVzUGVyUm93IHx8IG9yaWdpbmFsRGF0YS5sZW5ndGggPCBleHBlY3RlZERhdGFTaXplKSB7XG4gICAgICAgIC8vIFBhZGRpbmcgaXMgbmVlZGVkLCBvciB0aGUgYWN0dWFsIGRhdGEgc2l6ZSBpcyBzbWFsbGVyIHRoYW4gZXhwZWN0ZWRcbiAgICAgICAgY29uc3QgcGFkZGVkRGF0YSA9IG5ldyBVaW50OEFycmF5KGV4cGVjdGVkRGF0YVNpemUpO1xuXG4gICAgICAgIGlmIChvcmlnaW5hbERhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGFjdHVhbCBkYXRhLCBjb3B5IGl0IHJvdyBieSByb3dcbiAgICAgICAgICBjb25zdCBhY3R1YWxSb3dzQXZhaWxhYmxlID0gTWF0aC5mbG9vcihvcmlnaW5hbERhdGEubGVuZ3RoIC8gdW5hbGlnbmVkQnl0ZXNQZXJSb3cpO1xuICAgICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IE1hdGgubWluKGJsb2Nrc0hpZ2gsIGFjdHVhbFJvd3NBdmFpbGFibGUpOyByb3crKykge1xuICAgICAgICAgICAgY29uc3Qgc3JjT2Zmc2V0ID0gcm93ICogdW5hbGlnbmVkQnl0ZXNQZXJSb3c7XG4gICAgICAgICAgICBjb25zdCBkc3RPZmZzZXQgPSByb3cgKiBieXRlc1BlclJvdztcbiAgICAgICAgICAgIGNvbnN0IGNvcHlMZW5ndGggPSBNYXRoLm1pbih1bmFsaWduZWRCeXRlc1BlclJvdywgb3JpZ2luYWxEYXRhLmxlbmd0aCAtIHNyY09mZnNldCk7XG4gICAgICAgICAgICBpZiAoY29weUxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgcGFkZGVkRGF0YS5zZXQob3JpZ2luYWxEYXRhLnN1YmFycmF5KHNyY09mZnNldCwgc3JjT2Zmc2V0ICsgY29weUxlbmd0aCksIGRzdE9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbXByZXNzZWRUZXh0dXJlRGF0YSA9IHBhZGRlZERhdGE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wcmVzc2VkVGV4dHVyZURhdGEgPSBvcmlnaW5hbERhdGE7XG4gICAgICB9XG5cbiAgICAgIFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fX2Fzc2VydEFycmF5QnVmZmVyVmlldyhjb21wcmVzc2VkVGV4dHVyZURhdGEpO1xuICAgICAgZ3B1RGV2aWNlLnF1ZXVlLndyaXRlVGV4dHVyZShcbiAgICAgICAge1xuICAgICAgICAgIHRleHR1cmUsXG4gICAgICAgICAgbWlwTGV2ZWw6IGxldmVsLFxuICAgICAgICB9LFxuICAgICAgICBjb21wcmVzc2VkVGV4dHVyZURhdGEsXG4gICAgICAgIHtcbiAgICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgICAgYnl0ZXNQZXJSb3csXG4gICAgICAgICAgcm93c1BlckltYWdlOiBibG9ja3NIaWdoLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgd2lkdGg6IE1hdGguY2VpbChtaXBXaWR0aCAvIGJsb2NrSW5mby53aWR0aCkgKiBibG9ja0luZm8ud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBNYXRoLmNlaWwobWlwSGVpZ2h0IC8gYmxvY2tJbmZvLmhlaWdodCkgKiBibG9ja0luZm8uaGVpZ2h0LFxuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIGF3YWl0IGdwdURldmljZS5xdWV1ZS5vblN1Ym1pdHRlZFdvcmtEb25lKCk7XG5cbiAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodGV4dHVyZSk7XG4gICAgcmV0dXJuIHRleHR1cmVIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogYWxsb2NhdGUgYSBUZXh0dXJlXG4gICAqIEBwYXJhbSBmb3JtYXQgLSB0aGUgZm9ybWF0IG9mIHRoZSB0ZXh0dXJlXG4gICAqIEBwYXJhbSB3aWR0aCAtIHRoZSB3aWR0aCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcGFyYW0gaGVpZ2h0IC0gdGhlIGhlaWdodCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcGFyYW0gbWlwbWFwQ291bnQgLSB0aGUgbnVtYmVyIG9mIG1pcG1hcCBsZXZlbHNcbiAgICogQHJldHVybnMgdGhlIGhhbmRsZSBvZiB0aGUgdGV4dHVyZVxuICAgKi9cbiAgYWxsb2NhdGVUZXh0dXJlKHtcbiAgICBmb3JtYXQsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIG1pcExldmVsQ291bnQsXG4gIH06IHtcbiAgICBmb3JtYXQ6IFRleHR1cmVGb3JtYXRFbnVtO1xuICAgIHdpZHRoOiBTaXplO1xuICAgIGhlaWdodDogU2l6ZTtcbiAgICBtaXBMZXZlbENvdW50OiBDb3VudDtcbiAgfSk6IFdlYkdQVVJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuXG4gICAgY29uc3QgdGV4dHVyZURlc2NyaXB0b3I6IEdQVVRleHR1cmVEZXNjcmlwdG9yID0ge1xuICAgICAgc2l6ZTogW3dpZHRoLCBoZWlnaHQsIDFdLFxuICAgICAgbWlwTGV2ZWxDb3VudDogbWlwTGV2ZWxDb3VudCxcbiAgICAgIGZvcm1hdDogZm9ybWF0LndlYmdwdSBhcyBHUFVUZXh0dXJlRm9ybWF0LFxuICAgICAgdXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5URVhUVVJFX0JJTkRJTkcgfCBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9EU1QgfCBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQsXG4gICAgfTtcblxuICAgIGNvbnN0IGdwdVRleHR1cmUgPSBncHVEZXZpY2UuY3JlYXRlVGV4dHVyZSh0ZXh0dXJlRGVzY3JpcHRvcik7XG5cbiAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UoZ3B1VGV4dHVyZSk7XG4gICAgcmV0dXJuIHRleHR1cmVIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCBhbiBpbWFnZSB0byBhIHNwZWNpZmljIG1pcCBsZXZlbCBvZiBhIHRleHR1cmVcbiAgICogQHBhcmFtIG1pcExldmVsIC0gdGhlIG1pcCBsZXZlbCB0byBsb2FkIHRoZSBpbWFnZSB0b1xuICAgKiBAcGFyYW0gdGV4dHVyZVVpZCAtIHRoZSBoYW5kbGUgb2YgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIGZvcm1hdCAtIHRoZSBmb3JtYXQgb2YgdGhlIGltYWdlXG4gICAqIEBwYXJhbSB0eXBlIC0gdGhlIHR5cGUgb2YgdGhlIGRhdGFcbiAgICogQHBhcmFtIHhPZmZzZXQgLSB0aGUgeCBvZmZzZXQgb2YgY29weSByZWdpb25cbiAgICogQHBhcmFtIHlPZmZzZXQgLSB0aGUgeSBvZmZzZXQgb2YgY29weSByZWdpb25cbiAgICogQHBhcmFtIHdpZHRoIC0gdGhlIHdpZHRoIG9mIHRoZSBpbWFnZVxuICAgKiBAcGFyYW0gaGVpZ2h0IC0gdGhlIGhlaWdodCBvZiB0aGUgaW1hZ2VcbiAgICogQHBhcmFtIGRhdGEgLSB0aGUgdHlwZWRhcnJheSBkYXRhIG9mIHRoZSBpbWFnZVxuICAgKi9cbiAgYXN5bmMgbG9hZEltYWdlVG9NaXBMZXZlbE9mVGV4dHVyZTJEKHtcbiAgICBtaXBMZXZlbCxcbiAgICB0ZXh0dXJlVWlkLFxuICAgIGZvcm1hdCxcbiAgICB0eXBlLFxuICAgIHhPZmZzZXQsXG4gICAgeU9mZnNldCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgcm93U2l6ZUJ5UGl4ZWwsXG4gICAgZGF0YSxcbiAgfToge1xuICAgIG1pcExldmVsOiBJbmRleDtcbiAgICB0ZXh0dXJlVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlO1xuICAgIGZvcm1hdDogVGV4dHVyZUZvcm1hdEVudW07XG4gICAgdHlwZTogQ29tcG9uZW50VHlwZUVudW07XG4gICAgeE9mZnNldDogbnVtYmVyO1xuICAgIHlPZmZzZXQ6IG51bWJlcjtcbiAgICB3aWR0aDogbnVtYmVyO1xuICAgIGhlaWdodDogbnVtYmVyO1xuICAgIHJvd1NpemVCeVBpeGVsOiBudW1iZXI7XG4gICAgZGF0YTogVHlwZWRBcnJheTtcbiAgfSkge1xuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KHRleHR1cmVVaWQpIGFzIEdQVVRleHR1cmU7XG4gICAgY29uc3QgcGl4ZWxGb3JtYXQgPSBUZXh0dXJlRm9ybWF0LmdldFBpeGVsRm9ybWF0RnJvbVRleHR1cmVGb3JtYXQoZm9ybWF0KTtcbiAgICBjb25zdCBjb21wb3NpdGlvbk51bSA9IFBpeGVsRm9ybWF0LmdldENvbXBvc2l0aW9uTnVtRnJvbVBpeGVsRm9ybWF0KHBpeGVsRm9ybWF0KTtcblxuICAgIGNvbnN0IGJ5dGVzUGVyUm93ID0gcm93U2l6ZUJ5UGl4ZWwgKiBjb21wb3NpdGlvbk51bSAqIHR5cGUuZ2V0U2l6ZUluQnl0ZXMoKTtcblxuICAgIC8vIEFsaWduIHRoZSByb3cgZGF0YSBzaXplIHRvIG11bHRpcGxlIG9mIDI1NiBieXRlcyBkdWUgdG8gdGhlIFdlYkdQVSBzcGVjXG4gICAgY29uc3QgcGFkZGVkQnl0ZXNQZXJSb3cgPSBNYXRoLmNlaWwoYnl0ZXNQZXJSb3cgLyAyNTYpICogMjU2O1xuXG4gICAgLy8gQ29weSBkYXRhIHRvIHBhZGRlZCBidWZmZXJcbiAgICBjb25zdCBwYWRkZWREYXRhID0gbmV3IFVpbnQ4QXJyYXkocGFkZGVkQnl0ZXNQZXJSb3cgKiBoZWlnaHQpO1xuICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IGhlaWdodDsgcm93KyspIHtcbiAgICAgIGNvbnN0IHNyY09mZnNldCA9IHJvdyAqIGJ5dGVzUGVyUm93O1xuICAgICAgY29uc3QgZHN0T2Zmc2V0ID0gcm93ICogcGFkZGVkQnl0ZXNQZXJSb3c7XG4gICAgICBwYWRkZWREYXRhLnNldChuZXcgVWludDhBcnJheShkYXRhLmJ1ZmZlciwgc3JjT2Zmc2V0LCBieXRlc1BlclJvdyksIGRzdE9mZnNldCk7XG4gICAgfVxuXG4gICAgLy8gXHUzMEQwXHUzMEMzXHUzMEQ1XHUzMEExXHUzMDZFXHU0RjVDXHU2MjEwXG4gICAgY29uc3QgYnVmZmVyID0gZ3B1RGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBzaXplOiBwYWRkZWREYXRhLmJ5dGVMZW5ndGgsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuQ09QWV9TUkMsXG4gICAgICBtYXBwZWRBdENyZWF0aW9uOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLmdldE1hcHBlZFJhbmdlKCkpLnNldChwYWRkZWREYXRhKTtcbiAgICBidWZmZXIudW5tYXAoKTtcblxuICAgIGNvbnN0IGNvbW1hbmRFbmNvZGVyID0gZ3B1RGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG5cbiAgICBjb21tYW5kRW5jb2Rlci5jb3B5QnVmZmVyVG9UZXh0dXJlKFxuICAgICAge1xuICAgICAgICBidWZmZXIsXG4gICAgICAgIG9mZnNldDogMCxcbiAgICAgICAgYnl0ZXNQZXJSb3c6IHBhZGRlZEJ5dGVzUGVyUm93LFxuICAgICAgICByb3dzUGVySW1hZ2U6IGhlaWdodCxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHRleHR1cmUsXG4gICAgICAgIG1pcExldmVsLFxuICAgICAgICBvcmlnaW46IHsgeDogeE9mZnNldCwgeTogeU9mZnNldCwgejogMCB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgZGVwdGhPckFycmF5TGF5ZXJzOiAxLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCBjb21tYW5kQnVmZmVyID0gY29tbWFuZEVuY29kZXIuZmluaXNoKCk7XG4gICAgZ3B1RGV2aWNlLnF1ZXVlLnN1Ym1pdChbY29tbWFuZEJ1ZmZlcl0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGdwdURldmljZS5xdWV1ZS5vblN1Ym1pdHRlZFdvcmtEb25lKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoZSBhcyBzdHJpbmcpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX19jcmVhdGVUZXh0dXJlSW5uZXIoXG4gICAgd2lkdGg6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBpbnRlcm5hbEZvcm1hdDogVGV4dHVyZVBhcmFtZXRlckVudW0sXG4gICAgZ2VuZXJhdGVNaXBtYXA6IGJvb2xlYW4sXG4gICAgaW1hZ2VEYXRhOiBJbWFnZUJpdG1hcERhdGFcbiAgKSB7XG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcbiAgICBjb25zdCB0ZXh0dXJlRGVzY3JpcHRvcjogR1BVVGV4dHVyZURlc2NyaXB0b3IgPSB7XG4gICAgICBzaXplOiBbd2lkdGgsIGhlaWdodCwgMV0sXG4gICAgICBmb3JtYXQ6IGludGVybmFsRm9ybWF0LndlYmdwdSBhcyBHUFVUZXh0dXJlRm9ybWF0LFxuICAgICAgdXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5URVhUVVJFX0JJTkRJTkcgfCBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9EU1QgfCBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQsXG4gICAgfTtcblxuICAgIGlmIChnZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgdGV4dHVyZURlc2NyaXB0b3IubWlwTGV2ZWxDb3VudCA9IE1hdGguZmxvb3IoTWF0aC5sb2cyKE1hdGgubWF4KHdpZHRoLCBoZWlnaHQpKSkgKyAxO1xuICAgIH1cblxuICAgIGNvbnN0IGdwdVRleHR1cmUgPSBncHVEZXZpY2UuY3JlYXRlVGV4dHVyZSh0ZXh0dXJlRGVzY3JpcHRvcik7XG5cbiAgICBncHVEZXZpY2UucXVldWUuY29weUV4dGVybmFsSW1hZ2VUb1RleHR1cmUoeyBzb3VyY2U6IGltYWdlRGF0YSB9LCB7IHRleHR1cmU6IGdwdVRleHR1cmUgfSwgW3dpZHRoLCBoZWlnaHRdKTtcblxuICAgIGlmIChnZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgdGhpcy5nZW5lcmF0ZU1pcG1hcHMoZ3B1VGV4dHVyZSwgdGV4dHVyZURlc2NyaXB0b3IpO1xuICAgIH1cblxuICAgIGF3YWl0IGdwdURldmljZS5xdWV1ZS5vblN1Ym1pdHRlZFdvcmtEb25lKCk7XG5cbiAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UoZ3B1VGV4dHVyZSk7XG4gICAgcmV0dXJuIHRleHR1cmVIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlbmRlciB0YXJnZXQgdGV4dHVyZSB0aGF0IGNhbiBiZSB1c2VkIGFzIGEgY29sb3IgYXR0YWNobWVudCBpbiBmcmFtZWJ1ZmZlcnMuXG4gICAqIFRoaXMgdGV4dHVyZSBjYW4gYmUgcmVuZGVyZWQgdG8gYW5kIGFsc28gdXNlZCBhcyBhIHRleHR1cmUgaW5wdXQgaW4gc2hhZGVycy5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyAtIENvbmZpZ3VyYXRpb24gZm9yIHRoZSByZW5kZXIgdGFyZ2V0IHRleHR1cmVcbiAgICogQHBhcmFtIHBhcmFtcy53aWR0aCAtIFdpZHRoIG9mIHRoZSB0ZXh0dXJlIGluIHBpeGVsc1xuICAgKiBAcGFyYW0gcGFyYW1zLmhlaWdodCAtIEhlaWdodCBvZiB0aGUgdGV4dHVyZSBpbiBwaXhlbHNcbiAgICogQHBhcmFtIHBhcmFtcy5taXBMZXZlbENvdW50IC0gTnVtYmVyIG9mIG1pcG1hcCBsZXZlbHMgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSBwYXJhbXMuZm9ybWF0IC0gVGV4dHVyZSBmb3JtYXQgZm9yIHRoZSByZW5kZXIgdGFyZ2V0XG4gICAqIEByZXR1cm5zIEhhbmRsZSB0byB0aGUgY3JlYXRlZCByZW5kZXIgdGFyZ2V0IHRleHR1cmUgcmVzb3VyY2VcbiAgICovXG4gIGNyZWF0ZVJlbmRlclRhcmdldFRleHR1cmUoe1xuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBtaXBMZXZlbENvdW50LFxuICAgIGZvcm1hdCxcbiAgfToge1xuICAgIHdpZHRoOiBTaXplO1xuICAgIGhlaWdodDogU2l6ZTtcbiAgICBtaXBMZXZlbENvdW50OiBDb3VudDtcbiAgICBmb3JtYXQ6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICB9KTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgY29uc3QgdGV4dHVyZURlc2NyaXB0b3I6IEdQVVRleHR1cmVEZXNjcmlwdG9yID0ge1xuICAgICAgc2l6ZTogW3dpZHRoLCBoZWlnaHQsIDFdLFxuICAgICAgZm9ybWF0OiBmb3JtYXQud2ViZ3B1IGFzIEdQVVRleHR1cmVGb3JtYXQsXG4gICAgICBtaXBMZXZlbENvdW50LFxuICAgICAgdXNhZ2U6XG4gICAgICAgIEdQVVRleHR1cmVVc2FnZS5URVhUVVJFX0JJTkRJTkcgfFxuICAgICAgICBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9TUkMgfFxuICAgICAgICBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9EU1QgfFxuICAgICAgICBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQsXG4gICAgfTtcblxuICAgIGNvbnN0IGdwdVRleHR1cmUgPSBncHVEZXZpY2UuY3JlYXRlVGV4dHVyZSh0ZXh0dXJlRGVzY3JpcHRvcik7XG5cbiAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UoZ3B1VGV4dHVyZSk7XG5cbiAgICByZXR1cm4gdGV4dHVyZUhhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVuZGVyIHRhcmdldCB0ZXh0dXJlIGFycmF5IHRoYXQgY2FuIGhvbGQgbXVsdGlwbGUgMkQgdGV4dHVyZXMuXG4gICAqIFVzZWZ1bCBmb3IgdGVjaG5pcXVlcyBsaWtlIHNoYWRvdyBtYXBwaW5nIHdpdGggbXVsdGlwbGUgbGlnaHRzIG9yIGxheWVyZWQgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gQ29uZmlndXJhdGlvbiBmb3IgdGhlIHJlbmRlciB0YXJnZXQgdGV4dHVyZSBhcnJheVxuICAgKiBAcGFyYW0gcGFyYW1zLndpZHRoIC0gV2lkdGggb2YgZWFjaCB0ZXh0dXJlIGxheWVyIGluIHBpeGVsc1xuICAgKiBAcGFyYW0gcGFyYW1zLmhlaWdodCAtIEhlaWdodCBvZiBlYWNoIHRleHR1cmUgbGF5ZXIgaW4gcGl4ZWxzXG4gICAqIEBwYXJhbSBwYXJhbXMuaW50ZXJuYWxGb3JtYXQgLSBJbnRlcm5hbCBmb3JtYXQgb2YgdGhlIHRleHR1cmVcbiAgICogQHBhcmFtIHBhcmFtcy5hcnJheUxlbmd0aCAtIE51bWJlciBvZiB0ZXh0dXJlIGxheWVycyBpbiB0aGUgYXJyYXlcbiAgICogQHJldHVybnMgSGFuZGxlIHRvIHRoZSBjcmVhdGVkIHJlbmRlciB0YXJnZXQgdGV4dHVyZSBhcnJheSByZXNvdXJjZVxuICAgKi9cbiAgY3JlYXRlUmVuZGVyVGFyZ2V0VGV4dHVyZUFycmF5KHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgaW50ZXJuYWxGb3JtYXQsXG4gICAgYXJyYXlMZW5ndGgsXG4gIH06IHtcbiAgICB3aWR0aDogU2l6ZTtcbiAgICBoZWlnaHQ6IFNpemU7XG4gICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVQYXJhbWV0ZXJFbnVtO1xuICAgIGFycmF5TGVuZ3RoOiBDb3VudDtcbiAgfSk6IFdlYkdQVVJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHRleHR1cmVEZXNjcmlwdG9yOiBHUFVUZXh0dXJlRGVzY3JpcHRvciA9IHtcbiAgICAgIGRpbWVuc2lvbjogJzJkJyxcbiAgICAgIHNpemU6IFt3aWR0aCwgaGVpZ2h0LCBhcnJheUxlbmd0aF0sXG4gICAgICBmb3JtYXQ6IGludGVybmFsRm9ybWF0LndlYmdwdSBhcyBHUFVUZXh0dXJlRm9ybWF0LFxuICAgICAgbWlwTGV2ZWxDb3VudDogMSxcbiAgICAgIHVzYWdlOlxuICAgICAgICBHUFVUZXh0dXJlVXNhZ2UuVEVYVFVSRV9CSU5ESU5HIHxcbiAgICAgICAgR1BVVGV4dHVyZVVzYWdlLkNPUFlfU1JDIHxcbiAgICAgICAgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNUIHxcbiAgICAgICAgR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5ULFxuICAgIH07XG5cbiAgICBjb25zdCBncHVUZXh0dXJlID0gZ3B1RGV2aWNlLmNyZWF0ZVRleHR1cmUodGV4dHVyZURlc2NyaXB0b3IpO1xuXG4gICAgY29uc3QgdGV4dHVyZUhhbmRsZSA9IHRoaXMuX19yZWdpc3RlclJlc291cmNlKGdwdVRleHR1cmUpO1xuXG4gICAgcmV0dXJuIHRleHR1cmVIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlbmRlciB0YXJnZXQgY3ViZSB0ZXh0dXJlIGZvciBlbnZpcm9ubWVudCBtYXBwaW5nIG9yIG9tbmlkaXJlY3Rpb25hbCBzaGFkb3cgbWFwcGluZy5cbiAgICogVGhpcyBjcmVhdGVzIGEgY3ViZSB0ZXh0dXJlIHdpdGggNiBmYWNlcyB0aGF0IGNhbiBiZSByZW5kZXJlZCB0by5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyAtIENvbmZpZ3VyYXRpb24gZm9yIHRoZSByZW5kZXIgdGFyZ2V0IGN1YmUgdGV4dHVyZVxuICAgKiBAcGFyYW0gcGFyYW1zLndpZHRoIC0gV2lkdGggb2YgZWFjaCBjdWJlIGZhY2UgaW4gcGl4ZWxzXG4gICAqIEBwYXJhbSBwYXJhbXMuaGVpZ2h0IC0gSGVpZ2h0IG9mIGVhY2ggY3ViZSBmYWNlIGluIHBpeGVsc1xuICAgKiBAcGFyYW0gcGFyYW1zLm1pcExldmVsQ291bnQgLSBOdW1iZXIgb2YgbWlwbWFwIGxldmVscyB0byBjcmVhdGVcbiAgICogQHBhcmFtIHBhcmFtcy5mb3JtYXQgLSBUZXh0dXJlIGZvcm1hdCBmb3IgdGhlIHJlbmRlciB0YXJnZXRcbiAgICogQHJldHVybnMgSGFuZGxlIHRvIHRoZSBjcmVhdGVkIHJlbmRlciB0YXJnZXQgY3ViZSB0ZXh0dXJlIHJlc291cmNlXG4gICAqL1xuICBjcmVhdGVSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSh7XG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIG1pcExldmVsQ291bnQsXG4gICAgZm9ybWF0LFxuICB9OiB7XG4gICAgd2lkdGg6IFNpemU7XG4gICAgaGVpZ2h0OiBTaXplO1xuICAgIG1pcExldmVsQ291bnQ6IENvdW50O1xuICAgIGZvcm1hdDogVGV4dHVyZVBhcmFtZXRlckVudW07XG4gIH0pOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSB7XG4gICAgY29uc3QgZ3B1RGV2aWNlID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmdwdURldmljZTtcbiAgICBjb25zdCB0ZXh0dXJlRGVzY3JpcHRvcjogR1BVVGV4dHVyZURlc2NyaXB0b3IgPSB7XG4gICAgICBkaW1lbnNpb246ICcyZCcsXG4gICAgICBzaXplOiBbd2lkdGgsIGhlaWdodCwgNl0sXG4gICAgICBmb3JtYXQ6IGZvcm1hdC53ZWJncHUgYXMgR1BVVGV4dHVyZUZvcm1hdCxcbiAgICAgIG1pcExldmVsQ291bnQsXG4gICAgICB1c2FnZTpcbiAgICAgICAgR1BVVGV4dHVyZVVzYWdlLlRFWFRVUkVfQklORElORyB8XG4gICAgICAgIEdQVVRleHR1cmVVc2FnZS5DT1BZX1NSQyB8XG4gICAgICAgIEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCB8XG4gICAgICAgIEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCxcbiAgICB9O1xuXG4gICAgY29uc3QgZ3B1VGV4dHVyZSA9IGdwdURldmljZS5jcmVhdGVUZXh0dXJlKHRleHR1cmVEZXNjcmlwdG9yKTtcblxuICAgIGNvbnN0IHRleHR1cmVIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShncHVUZXh0dXJlKTtcblxuICAgIHJldHVybiB0ZXh0dXJlSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZW5kZXIgYnVmZmVyIGZvciBtdWx0aXNhbXBsaW5nIChNU0FBKSBvciBhcyBhIHJlbmRlciBhdHRhY2htZW50LlxuICAgKiBSZW5kZXIgYnVmZmVycyBhcmUgdGV4dHVyZXMgdGhhdCBhcmUgb25seSB1c2VkIGZvciByZW5kZXJpbmcgYW5kIGNhbm5vdCBiZSBzYW1wbGVkIGluIHNoYWRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSB3aWR0aCAtIFdpZHRoIG9mIHRoZSByZW5kZXIgYnVmZmVyIGluIHBpeGVsc1xuICAgKiBAcGFyYW0gaGVpZ2h0IC0gSGVpZ2h0IG9mIHRoZSByZW5kZXIgYnVmZmVyIGluIHBpeGVsc1xuICAgKiBAcGFyYW0gaW50ZXJuYWxGb3JtYXQgLSBJbnRlcm5hbCBmb3JtYXQgb2YgdGhlIHJlbmRlciBidWZmZXJcbiAgICogQHBhcmFtIGlzTVNBQSAtIFdoZXRoZXIgdG8gZW5hYmxlIG11bHRpc2FtcGxpbmdcbiAgICogQHBhcmFtIHNhbXBsZUNvdW50TVNBQSAtIE51bWJlciBvZiBzYW1wbGVzIGZvciBNU0FBIChpZ25vcmVkIGlmIGlzTVNBQSBpcyBmYWxzZSlcbiAgICogQHJldHVybnMgSGFuZGxlIHRvIHRoZSBjcmVhdGVkIHJlbmRlciBidWZmZXIgcmVzb3VyY2VcbiAgICovXG4gIGNyZWF0ZVJlbmRlckJ1ZmZlcihcbiAgICB3aWR0aDogU2l6ZSxcbiAgICBoZWlnaHQ6IFNpemUsXG4gICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVQYXJhbWV0ZXJFbnVtLFxuICAgIGlzTVNBQTogYm9vbGVhbixcbiAgICBzYW1wbGVDb3VudE1TQUE6IENvdW50XG4gICk6IFdlYkdQVVJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHRleHR1cmVEZXNjcmlwdG9yOiBHUFVUZXh0dXJlRGVzY3JpcHRvciA9IHtcbiAgICAgIHNpemU6IFt3aWR0aCwgaGVpZ2h0LCAxXSxcbiAgICAgIGZvcm1hdDogaW50ZXJuYWxGb3JtYXQud2ViZ3B1IGFzIEdQVVRleHR1cmVGb3JtYXQsXG4gICAgICBzYW1wbGVDb3VudDogaXNNU0FBID8gc2FtcGxlQ291bnRNU0FBIDogMSxcbiAgICAgIHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuQ09QWV9TUkMgfCBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQsXG4gICAgfTtcblxuICAgIGNvbnN0IGdwdVRleHR1cmUgPSBncHVEZXZpY2UuY3JlYXRlVGV4dHVyZSh0ZXh0dXJlRGVzY3JpcHRvcik7XG5cbiAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UoZ3B1VGV4dHVyZSk7XG5cbiAgICByZXR1cm4gdGV4dHVyZUhhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBkZWxldGUgYSBSZW5kZXJCdWZmZXJcbiAgICogQHBhcmFtIHJlbmRlckJ1ZmZlclVpZFxuICAgKi9cbiAgZGVsZXRlUmVuZGVyQnVmZmVyKHJlbmRlckJ1ZmZlclVpZDogV2ViR1BVUmVzb3VyY2VIYW5kbGUpIHtcbiAgICB0aGlzLmZsdXNoKCk7XG4gICAgdGhpcy5jbGVhckNhY2hlKCk7XG5cbiAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQocmVuZGVyQnVmZmVyVWlkKSBhcyBHUFVUZXh0dXJlO1xuXG4gICAgaWYgKHRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgdGV4dHVyZS5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmRlbGV0ZShyZW5kZXJCdWZmZXJVaWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBjb3B5IFRleHR1cmUgRGF0YVxuICAgKiBAcGFyYW0gZnJvbVRleHR1cmVcbiAgICogQHBhcmFtIHRvVGV4dHVyZVxuICAgKi9cbiAgY29weVRleHR1cmVEYXRhKGZyb21UZXh0dXJlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSwgdG9UZXh0dXJlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSkge1xuICAgIGNvbnN0IGZyb20gPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChmcm9tVGV4dHVyZSkgYXMgR1BVVGV4dHVyZTtcbiAgICBjb25zdCB0byA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KHRvVGV4dHVyZSkgYXMgR1BVVGV4dHVyZTtcbiAgICB0aGlzLl9fZmx1c2hSZW5kZXJQYXNzV29yaygpO1xuICAgIHRoaXMuX19jb21tYW5kRW5jb2RlciEuY29weVRleHR1cmVUb1RleHR1cmUoXG4gICAgICB7XG4gICAgICAgIHRleHR1cmU6IGZyb20sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0ZXh0dXJlOiB0byxcbiAgICAgIH0sXG4gICAgICBbdG8ud2lkdGgsIHRvLmhlaWdodCwgMV1cbiAgICApO1xuICB9XG5cbiAgaXNNaXBwbWFwcGVkVGV4dHVyZSh0ZXh0dXJlSGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldCh0ZXh0dXJlSGFuZGxlKSBhcyBHUFVUZXh0dXJlO1xuICAgIGlmICh0ZXh0dXJlLm1pcExldmVsQ291bnQgPiAxKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZHVwbGljYXRlVGV4dHVyZUFzTWlwbWFwcGVkKGZyb21UZXh0dXJlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSk6IFtXZWJHUFVSZXNvdXJjZUhhbmRsZSwgV2ViR1BVUmVzb3VyY2VIYW5kbGVdIHtcbiAgICBjb25zdCBncHVEZXZpY2UgPSB0aGlzLl9fd2ViR3B1RGV2aWNlV3JhcHBlciEuZ3B1RGV2aWNlO1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldChmcm9tVGV4dHVyZSkgYXMgR1BVVGV4dHVyZTtcblxuICAgIC8vIENyZWF0ZSBhIG5ldyB0ZXh0dXJlIHdpdGggdGhlIHNhbWUgZGVzY3JpcHRvclxuICAgIGNvbnN0IHRleHR1cmVEZXNjcmlwdG9yID0ge1xuICAgICAgc2l6ZToge1xuICAgICAgICB3aWR0aDogdGV4dHVyZS53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiB0ZXh0dXJlLmhlaWdodCxcbiAgICAgICAgZGVwdGhPckFycmF5TGF5ZXJzOiB0ZXh0dXJlLmRlcHRoT3JBcnJheUxheWVycyxcbiAgICAgIH0sXG4gICAgICBtaXBMZXZlbENvdW50OiBNYXRoLmZsb29yKE1hdGgubG9nMihNYXRoLm1heCh0ZXh0dXJlLndpZHRoLCB0ZXh0dXJlLmhlaWdodCkpKSArIDEsXG4gICAgICBmb3JtYXQ6IHRleHR1cmUuZm9ybWF0LFxuICAgICAgdXNhZ2U6IHRleHR1cmUudXNhZ2UsXG4gICAgfTtcbiAgICBjb25zdCBuZXdUZXh0dXJlID0gZ3B1RGV2aWNlLmNyZWF0ZVRleHR1cmUodGV4dHVyZURlc2NyaXB0b3IpO1xuXG4gICAgdGhpcy5fX2ZsdXNoUmVuZGVyUGFzc1dvcmsoKTtcblxuICAgIC8vIENvcHkgdGhlIHRleHR1cmUgdG8gdGhlIG5ldyB0ZXh0dXJlXG4gICAgdGhpcy5fX2NvbW1hbmRFbmNvZGVyIS5jb3B5VGV4dHVyZVRvVGV4dHVyZShcbiAgICAgIHsgdGV4dHVyZTogdGV4dHVyZSB9LFxuICAgICAgeyB0ZXh0dXJlOiBuZXdUZXh0dXJlIH0sXG4gICAgICB7IHdpZHRoOiB0ZXh0dXJlLndpZHRoLCBoZWlnaHQ6IHRleHR1cmUuaGVpZ2h0LCBkZXB0aE9yQXJyYXlMYXllcnM6IDEgfVxuICAgICk7XG5cbiAgICBjb25zdCB0ZXh0dXJlSGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UobmV3VGV4dHVyZSk7XG4gICAgY29uc3QgdGV4dHVyZVZpZXdIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZShuZXdUZXh0dXJlLmNyZWF0ZVZpZXcoKSk7XG5cbiAgICByZXR1cm4gW3RleHR1cmVIYW5kbGUsIHRleHR1cmVWaWV3SGFuZGxlXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBhdHRhY2ggdGhlIERlcHRoQnVmZmVyIHRvIHRoZSBGcmFtZUJ1ZmZlck9iamVjdFxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgYSBGcmFtZWJ1ZmZlclxuICAgKiBAcGFyYW0gcmVuZGVyYWJsZSBhIERlcHRoQnVmZmVyXG4gICAqL1xuICBhdHRhY2hEZXB0aEJ1ZmZlclRvRnJhbWVCdWZmZXJPYmplY3QoX2ZyYW1lYnVmZmVyOiBGcmFtZUJ1ZmZlciwgX3JlbmRlcmFibGU6IElSZW5kZXJhYmxlKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBhdHRhY2ggdGhlIFN0ZW5jaWxCdWZmZXIgdG8gdGhlIEZyYW1lQnVmZmVyT2JqZWN0XG4gICAqIEBwYXJhbSBmcmFtZWJ1ZmZlciBhIEZyYW1lYnVmZmVyXG4gICAqIEBwYXJhbSByZW5kZXJhYmxlIGEgU3RlbmNpbEJ1ZmZlclxuICAgKi9cbiAgYXR0YWNoU3RlbmNpbEJ1ZmZlclRvRnJhbWVCdWZmZXJPYmplY3QoX2ZyYW1lYnVmZmVyOiBGcmFtZUJ1ZmZlciwgX3JlbmRlcmFibGU6IElSZW5kZXJhYmxlKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBhdHRhY2ggdGhlIGRlcHRoU3RlbmNpbEJ1ZmZlciB0byB0aGUgRnJhbWVCdWZmZXJPYmplY3RcbiAgICogQHBhcmFtIGZyYW1lYnVmZmVyIGEgRnJhbWVidWZmZXJcbiAgICogQHBhcmFtIHJlbmRlcmFibGUgYSBkZXB0aFN0ZW5jaWxCdWZmZXJcbiAgICovXG4gIGF0dGFjaERlcHRoU3RlbmNpbEJ1ZmZlclRvRnJhbWVCdWZmZXJPYmplY3QoX2ZyYW1lYnVmZmVyOiBGcmFtZUJ1ZmZlciwgX3JlbmRlcmFibGU6IElSZW5kZXJhYmxlKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBjcmVhdGUgYSBGcmFtZUJ1ZmZlck9iamVjdFxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgY3JlYXRlRnJhbWVCdWZmZXJPYmplY3QoKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIGRlbGV0ZSBhIEZyYW1lQnVmZmVyT2JqZWN0XG4gICAqIEBwYXJhbSBmcmFtZUJ1ZmZlck9iamVjdEhhbmRsZVxuICAgKi9cbiAgZGVsZXRlRnJhbWVCdWZmZXJPYmplY3QoX2ZyYW1lQnVmZmVyT2JqZWN0SGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSk6IHZvaWQge31cblxuICAvKipcbiAgICogYXR0YWNoIHRoZSBDb2xvckJ1ZmZlciB0byB0aGUgRnJhbWVCdWZmZXJPYmplY3RcbiAgICogQHBhcmFtIGZyYW1lYnVmZmVyIGEgRnJhbWVidWZmZXJcbiAgICogQHBhcmFtIGF0dGFjaG1lbnRJbmRleCBhIGF0dGFjaG1lbnQgaW5kZXhcbiAgICogQHBhcmFtIHJlbmRlcmFibGUgYSBDb2xvckJ1ZmZlclxuICAgKi9cbiAgYXR0YWNoQ29sb3JCdWZmZXJUb0ZyYW1lQnVmZmVyT2JqZWN0KF9mcmFtZWJ1ZmZlcjogRnJhbWVCdWZmZXIsIF9hdHRhY2htZW50SW5kZXg6IEluZGV4LCBfcmVuZGVyYWJsZTogSVJlbmRlcmFibGUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvKipcbiAgICogYXR0YWNoIHRoZSBDb2xvckJ1ZmZlciB0byB0aGUgRnJhbWVCdWZmZXJPYmplY3RcbiAgICogQHBhcmFtIGZyYW1lYnVmZmVyIGEgRnJhbWVidWZmZXJcbiAgICogQHBhcmFtIGF0dGFjaG1lbnRJbmRleCBhIGF0dGFjaG1lbnQgaW5kZXhcbiAgICogQHBhcmFtIHJlbmRlcmFibGUgYSBDb2xvckJ1ZmZlclxuICAgKiBAcGFyYW0gbGF5ZXJJbmRleCBhIGxheWVyIGluZGV4XG4gICAqIEBwYXJhbSBtaXBMZXZlbCBhIG1pcCBsZXZlbFxuICAgKi9cbiAgYXR0YWNoQ29sb3JCdWZmZXJMYXllclRvRnJhbWVCdWZmZXJPYmplY3QoXG4gICAgX2ZyYW1lYnVmZmVyOiBGcmFtZUJ1ZmZlcixcbiAgICBfYXR0YWNobWVudEluZGV4OiBJbmRleCxcbiAgICBfcmVuZGVyYWJsZTogSVJlbmRlcmFibGUsXG4gICAgX2xheWVySW5kZXg6IEluZGV4LFxuICAgIF9taXBMZXZlbDogSW5kZXhcbiAgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyoqXG4gICAqIGF0dGFjaCB0aGUgQ29sb3JCdWZmZXIgdG8gdGhlIEZyYW1lQnVmZmVyT2JqZWN0XG4gICAqIEBwYXJhbSBmcmFtZWJ1ZmZlciBhIEZyYW1lYnVmZmVyXG4gICAqIEBwYXJhbSBhdHRhY2htZW50SW5kZXggYSBhdHRhY2htZW50IGluZGV4XG4gICAqIEBwYXJhbSBmYWNlSW5kZXggYSBmYWNlIGluZGV4XG4gICAqIEBwYXJhbSBtaXBMZXZlbCBhIG1pcCBsZXZlbFxuICAgKiBAcGFyYW0gcmVuZGVyYWJsZSBhIENvbG9yQnVmZmVyXG4gICAqL1xuICBhdHRhY2hDb2xvckJ1ZmZlckN1YmVUb0ZyYW1lQnVmZmVyT2JqZWN0KFxuICAgIF9mcmFtZWJ1ZmZlcjogRnJhbWVCdWZmZXIsXG4gICAgX2F0dGFjaG1lbnRJbmRleDogSW5kZXgsXG4gICAgX2ZhY2VJbmRleDogSW5kZXgsXG4gICAgX21pcExldmVsOiBJbmRleCxcbiAgICBfcmVuZGVyYWJsZTogSVJlbmRlcmFibGVcbiAgKSB7fVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgMkQgdGV4dHVyZSB2aWV3IGZyb20gYSB0ZXh0dXJlIHJlc291cmNlLlxuICAgKiBUaGlzIHZpZXcgY2FuIGJlIHVzZWQgZm9yIHNhbXBsaW5nIHRoZSB0ZXh0dXJlIGluIHNoYWRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSB0ZXh0dXJlSGFuZGxlIC0gSGFuZGxlIHRvIHRoZSBzb3VyY2UgdGV4dHVyZVxuICAgKiBAcmV0dXJucyBIYW5kbGUgdG8gdGhlIGNyZWF0ZWQgdGV4dHVyZSB2aWV3XG4gICAqL1xuICBjcmVhdGVUZXh0dXJlVmlldzJkKHRleHR1cmVIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlKTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldCh0ZXh0dXJlSGFuZGxlKSBhcyBHUFVUZXh0dXJlO1xuICAgIGNvbnN0IHRleHR1cmVWaWV3ID0gdGV4dHVyZS5jcmVhdGVWaWV3KCk7XG4gICAgY29uc3QgdGV4dHVyZVZpZXdIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlVmlldyk7XG5cbiAgICByZXR1cm4gdGV4dHVyZVZpZXdIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHRleHR1cmUgdmlldyBzdWl0YWJsZSBmb3IgdXNlIGFzIGEgcmVuZGVyIHRhcmdldC5cbiAgICogVGhpcyB2aWV3IHRhcmdldHMgb25seSB0aGUgYmFzZSBtaXAgbGV2ZWwgYW5kIGZpcnN0IGFycmF5IGxheWVyLlxuICAgKlxuICAgKiBAcGFyYW0gdGV4dHVyZUhhbmRsZSAtIEhhbmRsZSB0byB0aGUgc291cmNlIHRleHR1cmVcbiAgICogQHJldHVybnMgSGFuZGxlIHRvIHRoZSBjcmVhdGVkIHJlbmRlciB0YXJnZXQgdGV4dHVyZSB2aWV3XG4gICAqL1xuICBjcmVhdGVUZXh0dXJlVmlld0FzUmVuZGVyVGFyZ2V0KHRleHR1cmVIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlKTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldCh0ZXh0dXJlSGFuZGxlKSBhcyBHUFVUZXh0dXJlO1xuICAgIGNvbnN0IHRleHR1cmVWaWV3ID0gdGV4dHVyZS5jcmVhdGVWaWV3KHtcbiAgICAgIGJhc2VNaXBMZXZlbDogMCxcbiAgICAgIG1pcExldmVsQ291bnQ6IDEsXG4gICAgICBhcnJheUxheWVyQ291bnQ6IDEsXG4gICAgfSk7XG4gICAgY29uc3QgdGV4dHVyZVZpZXdIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlVmlldyk7XG5cbiAgICByZXR1cm4gdGV4dHVyZVZpZXdIYW5kbGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGN1YmUgdGV4dHVyZSB2aWV3IGZyb20gYSBjdWJlIHRleHR1cmUgcmVzb3VyY2UuXG4gICAqIFRoaXMgdmlldyBleHBvc2VzIGFsbCA2IGZhY2VzIG9mIHRoZSBjdWJlIHRleHR1cmUgZm9yIHNhbXBsaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gdGV4dHVyZUhhbmRsZSAtIEhhbmRsZSB0byB0aGUgc291cmNlIGN1YmUgdGV4dHVyZVxuICAgKiBAcmV0dXJucyBIYW5kbGUgdG8gdGhlIGNyZWF0ZWQgY3ViZSB0ZXh0dXJlIHZpZXdcbiAgICovXG4gIGNyZWF0ZVRleHR1cmVWaWV3Q3ViZSh0ZXh0dXJlSGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSk6IFdlYkdQVVJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQodGV4dHVyZUhhbmRsZSkgYXMgR1BVVGV4dHVyZTtcbiAgICBjb25zdCB0ZXh0dXJlVmlldyA9IHRleHR1cmUuY3JlYXRlVmlldyh7IGRpbWVuc2lvbjogJ2N1YmUnIH0pO1xuICAgIGNvbnN0IHRleHR1cmVWaWV3SGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodGV4dHVyZVZpZXcpO1xuXG4gICAgcmV0dXJuIHRleHR1cmVWaWV3SGFuZGxlO1xuICB9XG5cbiAgY3JlYXRlVGV4dHVyZVZpZXcyZEFycmF5KHRleHR1cmVIYW5kbGU6IFdlYkdQVVJlc291cmNlSGFuZGxlLCBhcnJheUxheWVyQ291bnQ6IENvdW50KTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldCh0ZXh0dXJlSGFuZGxlKSBhcyBHUFVUZXh0dXJlO1xuICAgIGNvbnN0IHRleHR1cmVWaWV3ID0gdGV4dHVyZS5jcmVhdGVWaWV3KHtcbiAgICAgIGRpbWVuc2lvbjogJzJkLWFycmF5JyxcbiAgICAgIGJhc2VBcnJheUxheWVyOiAwLFxuICAgICAgYXJyYXlMYXllckNvdW50OiBhcnJheUxheWVyQ291bnQsXG4gICAgfSk7XG4gICAgY29uc3QgdGV4dHVyZVZpZXdIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlVmlldyk7XG5cbiAgICByZXR1cm4gdGV4dHVyZVZpZXdIYW5kbGU7XG4gIH1cblxuICBjcmVhdGVUZXh0dXJlVmlldzJkQXJyYXlBc1JlbmRlclRhcmdldChcbiAgICB0ZXh0dXJlSGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSxcbiAgICBhcnJheUlkeDogSW5kZXgsXG4gICAgbWlwTGV2ZWw6IEluZGV4XG4gICk6IFdlYkdQVVJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy5fX3dlYkdwdVJlc291cmNlcy5nZXQodGV4dHVyZUhhbmRsZSkgYXMgR1BVVGV4dHVyZTtcbiAgICBjb25zdCB0ZXh0dXJlVmlldyA9IHRleHR1cmUuY3JlYXRlVmlldyh7XG4gICAgICBkaW1lbnNpb246ICcyZCcsXG4gICAgICBhcnJheUxheWVyQ291bnQ6IDEsXG4gICAgICBiYXNlQXJyYXlMYXllcjogYXJyYXlJZHgsXG4gICAgICBiYXNlTWlwTGV2ZWw6IG1pcExldmVsLFxuICAgICAgbWlwTGV2ZWxDb3VudDogMSxcbiAgICAgIGFzcGVjdDogJ2FsbCcsXG4gICAgfSk7XG4gICAgY29uc3QgdGV4dHVyZVZpZXdIYW5kbGUgPSB0aGlzLl9fcmVnaXN0ZXJSZXNvdXJjZSh0ZXh0dXJlVmlldyk7XG5cbiAgICByZXR1cm4gdGV4dHVyZVZpZXdIYW5kbGU7XG4gIH1cblxuICBjcmVhdGVDdWJlVGV4dHVyZVZpZXdBc1JlbmRlclRhcmdldChcbiAgICB0ZXh0dXJlSGFuZGxlOiBXZWJHUFVSZXNvdXJjZUhhbmRsZSxcbiAgICBmYWNlSWR4OiBJbmRleCxcbiAgICBtaXBMZXZlbDogSW5kZXhcbiAgKTogV2ViR1BVUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLl9fd2ViR3B1UmVzb3VyY2VzLmdldCh0ZXh0dXJlSGFuZGxlKSBhcyBHUFVUZXh0dXJlO1xuICAgIGNvbnN0IHRleHR1cmVWaWV3ID0gdGV4dHVyZS5jcmVhdGVWaWV3KHtcbiAgICAgIGRpbWVuc2lvbjogJzJkJyxcbiAgICAgIGFycmF5TGF5ZXJDb3VudDogMSxcbiAgICAgIGJhc2VBcnJheUxheWVyOiBmYWNlSWR4LFxuICAgICAgYmFzZU1pcExldmVsOiBtaXBMZXZlbCxcbiAgICAgIG1pcExldmVsQ291bnQ6IDEsXG4gICAgICBhc3BlY3Q6ICdhbGwnLFxuICAgIH0pO1xuICAgIGNvbnN0IHRleHR1cmVWaWV3SGFuZGxlID0gdGhpcy5fX3JlZ2lzdGVyUmVzb3VyY2UodGV4dHVyZVZpZXcpO1xuXG4gICAgcmV0dXJuIHRleHR1cmVWaWV3SGFuZGxlO1xuICB9XG5cbiAgZGVsZXRlVGV4dHVyZSh0ZXh0dXJlSGFuZGxlOiBXZWJHTFJlc291cmNlSGFuZGxlKSB7XG4gICAgdGhpcy5mbHVzaCgpO1xuICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuXG4gICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuX193ZWJHcHVSZXNvdXJjZXMuZ2V0KHRleHR1cmVIYW5kbGUpIGFzIEdQVVRleHR1cmU7XG4gICAgaWYgKHRleHR1cmUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBkZWxldGUgdGhlIHRleHR1cmUgdmlldyBmb3IgZ2VuZXJhdGluZyBtaXBtYXBzXG4gICAgdGhpcy5fX3NyY1RleHR1cmVWaWV3c0ZvckdlbmVyYXRpbmdNaXBtYXBzLmRlbGV0ZSh0ZXh0dXJlKTtcbiAgICB0aGlzLl9fZHN0VGV4dHVyZVZpZXdzRm9yR2VuZXJhdGluZ01pcG1hcHMuZGVsZXRlKHRleHR1cmUpO1xuICAgIHRoaXMuX19iaW5kR3JvdXBzRm9yR2VuZXJhdGluZ01pcG1hcHMuZGVsZXRlKHRleHR1cmUpO1xuXG4gICAgdGV4dHVyZS5kZXN0cm95KCk7XG4gICAgdGhpcy5fX3dlYkdwdVJlc291cmNlcy5kZWxldGUodGV4dHVyZUhhbmRsZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjcmVhdGVzIHRoZSBzeXN0ZW0gZGVwdGggdGV4dHVyZSB3aXRoIHRoZSBjdXJyZW50IGNhbnZhcyBkaW1lbnNpb25zLlxuICAgKiBUaGlzIGlzIGNhbGxlZCB3aGVuIHRoZSBjYW52YXMgaXMgcmVzaXplZCBvciBpbml0aWFsaXplZC5cbiAgICovXG4gIHJlY3JlYXRlU3lzdGVtRGVwdGhUZXh0dXJlKCkge1xuICAgIGNvbnN0IGdwdURldmljZSA9IHRoaXMuX193ZWJHcHVEZXZpY2VXcmFwcGVyIS5ncHVEZXZpY2U7XG4gICAgY29uc3QgY2FudmFzID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmNhbnZhcztcblxuICAgIGlmICh0aGlzLl9fc3lzdGVtRGVwdGhUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX19zeXN0ZW1EZXB0aFRleHR1cmUuZGVzdHJveSgpO1xuICAgIH1cbiAgICAvLyBBIG5ldyB0ZXh0dXJlIHN0YXJ0cyB3aXRoIGl0cyBvd24gKHplcm8pIGNvbnRlbnRzLCBhcyBpdCBkaWQgYmVmb3JlIGRlZmVycmluZyB0aGUgY2xlYXIuXG4gICAgdGhpcy5fX2RlZmVycmVkU3lzdGVtRGVwdGhDbGVhclZhbHVlID0gdW5kZWZpbmVkO1xuICAgIGlmIChjYW52YXMud2lkdGggPD0gMCB8fCBjYW52YXMuaGVpZ2h0IDw9IDApIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ1NraXAgcmVjcmVhdGluZyBzeXN0ZW0gZGVwdGggdGV4dHVyZSBiZWNhdXNlIHRoZSBjYW52YXMgc2l6ZSBpcyB6ZXJvLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fc3lzdGVtRGVwdGhUZXh0dXJlID0gZ3B1RGV2aWNlLmNyZWF0ZVRleHR1cmUoe1xuICAgICAgc2l6ZTogW2NhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodF0sXG4gICAgICBmb3JtYXQ6IERFRkFVTFRfREVQVEhfRk9STUFULFxuICAgICAgdXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCxcbiAgICB9KTtcbiAgICB0aGlzLl9fc3lzdGVtRGVwdGhUZXh0dXJlVmlldyA9IHRoaXMuX19zeXN0ZW1EZXB0aFRleHR1cmUuY3JlYXRlVmlldygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2l6ZXMgdGhlIGNhbnZhcyBhbmQgcmVjcmVhdGVzIHRoZSBzeXN0ZW0gZGVwdGggdGV4dHVyZS5cbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCB3aGVuIHRoZSB3aW5kb3cgb3Igdmlld3BvcnQgc2l6ZSBjaGFuZ2VzLlxuICAgKlxuICAgKiBAcGFyYW0gd2lkdGggLSBOZXcgY2FudmFzIHdpZHRoIGluIHBpeGVsc1xuICAgKiBAcGFyYW0gaGVpZ2h0IC0gTmV3IGNhbnZhcyBoZWlnaHQgaW4gcGl4ZWxzXG4gICAqL1xuICByZXNpemVDYW52YXMod2lkdGg6IFNpemUsIGhlaWdodDogU2l6ZSkge1xuICAgIGlmICh3aWR0aCA8PSAwIHx8IGhlaWdodCA8PSAwKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKCdTa2lwIHJlc2l6aW5nIFdlYkdQVSBjYW52YXMgYmVjYXVzZSB3aWR0aCBvciBoZWlnaHQgaXMgemVyby4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2FudmFzID0gdGhpcy5fX3dlYkdwdURldmljZVdyYXBwZXIhLmNhbnZhcztcbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHRoaXMucmVjcmVhdGVTeXN0ZW1EZXB0aFRleHR1cmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aWV3cG9ydCBmb3IgcmVuZGVyaW5nIChjdXJyZW50bHkgbm90IGltcGxlbWVudGVkIGluIFdlYkdQVSB2ZXJzaW9uKS5cbiAgICpcbiAgICogQHBhcmFtIHZpZXdwb3J0IC0gT3B0aW9uYWwgdmlld3BvcnQgcmVjdGFuZ2xlICh4LCB5LCB3aWR0aCwgaGVpZ2h0KVxuICAgKi9cbiAgc2V0Vmlld3BvcnQoX2VuZ2luZTogRW5naW5lLCBfdmlld3BvcnQ/OiBWZWN0b3I0KSB7fVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIGltcGxlbWVudGF0aW9uIHN1cHBvcnRzIG11bHRpLXZpZXcgVlIgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbHdheXMgZmFsc2UgZm9yIFdlYkdQVSBpbXBsZW1lbnRhdGlvbiAobm90IHlldCBzdXBwb3J0ZWQpXG4gICAqL1xuICBpc1N1cHBvcnRNdWx0aVZpZXdWUlJlbmRlcmluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxPQUFPLGNBQWM7QUFDckIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyw2QkFBNkI7QUFFdEMsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyw0QkFBMkQ7QUFDcEUsU0FBUyxxQkFBNkM7QUFDdEQsU0FBUyx1QkFBdUI7QUFF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QUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsYUFBYSxPQUFhLFFBQWM7QUFDdEMsUUFBSSxTQUFTLEtBQUssVUFBVSxHQUFHO0FBQzdCLGFBQU8sUUFBUSxLQUFLLDhEQUE4RDtBQUNsRjtBQUFBLElBQ0Y7QUFDQSxVQUFNLFNBQVMsS0FBS3ZDLEdBQXVCO0FBQzNDLFdBQU8sUUFBUTtBQUNmLFdBQU8sU0FBUztBQUNoQixTQUFLLDJCQUEyQjtBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsWUFBWSxTQUFpQixXQUFxQjtBQUFBLEVBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPbkQsZ0NBQXlDO0FBQ3ZDLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFweEphLDBCQTBDYXdFLEtBQW1DO0FBQUE7QUExQ2hELDBCQTRDYUMsS0FBMkI7QUE1Q3hDLDBCQTZDSUMsS0FBeUIsSUFBSSxZQUFZLDBCQUF5QkQsS0FBMkIsQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBN0NsRywwQkF5Z0NhekQsS0FBNEIsb0JBQUksSUFBWTtBQUFBLEVBQ2xFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLENBQUM7QUFsaENJLElBQU0sMkJBQU47IiwKICAibmFtZXMiOiBbIl9fd2ViR3B1UmVzb3VyY2VzIiwgIl9fcmVzb3VyY2VDb3VudGVyIiwgIl9fYmluZEdyb3VwTGF5b3V0S2V5U3RvcmFnZUJ1ZmZlciIsICJfX3N0b3JhZ2VCaW5kR3JvdXBCdWZmZXJzIiwgIl9fd2ViR3B1UmVuZGVyUGlwZWxpbmVNYXAiLCAiX19tYXRlcmlhbFN0YXRlVmVyc2lvbk1hcCIsICJfX2JpbmRHcm91cExheW91dENhY2hlIiwgIl9fcGlwZWxpbmVMYXlvdXRDYWNoZSIsICJfX3RleHR1cmVCaW5kR3JvdXBDYWNoZSIsICJfX3NhbXBsZXJCaW5kR3JvdXBDYWNoZSIsICJfX2RyYXdQYXJhbWV0ZXJzQmluZEdyb3VwQ2FjaGUiLCAiX19kcmF3UGFyYW1ldGVyc0J1ZmZlcnMiLCAiX19kcmF3UGFyYW1ldGVyc0VudHJ5Q291bnRJbkxhc3RCdWZmZXIiLCAiX19sYXN0RHJhd1BhcmFtZXRlcnMiLCAiX19kdW1teVRleHR1cmVWaWV3cyIsICJfX2dwdU9iamVjdElkcyIsICJfX2dwdU9iamVjdElkQ291bnQiLCAiX190ZXh0dXJlU2FtcGxlckJpbmRpbmdzIiwgIl9fYnVuZGxlQmluZEdyb3VwcyIsICJfX2J1bmRsZVZlcnRleEJ1ZmZlcnMiLCAiX192ZXJ0ZXhCdWZmZXJSYW5nZXMiLCAiX19yZW5kZXJCdW5kbGVzIiwgIl9faXNHcHVDdWxsaW5nUmVzZXRQZW5kaW5nIiwgIl9fcmVuZGVyUGFzc0VuY29kZXJEaXNwbGF5SWR4IiwgIl9fcmVuZGVyUGFzc0VuY29kZXJUYXJnZXRLaW5kIiwgIl9fcmVuZGVyUGFzc0VuY29kZXJUYXJnZXRWaWV3cyIsICJfX2NhbmRpZGF0ZVJlbmRlclBhc3NUYXJnZXRWaWV3cyIsICJfX3BlbmRpbmdSZW5kZXJCdW5kbGVzIiwgIl9fcGVuZGluZ0NsZWFyIiwgIl9fcmVuZGVyQnVuZGxlRW5jb2RlckRpc3BsYXlJZHgiLCAiX19sYXN0QmluZGluZ1N0YXRlVmVyc2lvbiIsICJfX2xhc3RDdXJyZW50Q2FtZXJhQ29tcG9uZW50U2lkIiwgIl9fbGFzdEVudGl0eVJlcG9zaXRvcnlVcGRhdGVDb3VudCIsICJfX2xhc3RQcmltaXRpdmVzTWF0ZXJpYWxWYXJpYW50VXBkYXRlQ291bnQiLCAiX19sYXN0TWVzaFJlbmRlcmVyQ29tcG9uZW50c1VwZGF0ZUNvdW50IiwgIl9fc3JjVGV4dHVyZVZpZXdzRm9yR2VuZXJhdGluZ01pcG1hcHMiLCAiX19kc3RUZXh0dXJlVmlld3NGb3JHZW5lcmF0aW5nTWlwbWFwcyIsICJfX2JpbmRHcm91cHNGb3JHZW5lcmF0aW5nTWlwbWFwcyIsICJfX2Fzc2VydEFycmF5QnVmZmVyVmlldyIsICJfX2JpbmRHcm91cFN0b3JhZ2VCdWZmZXIiLCAiX19jbGVhclJlbmRlckJ1bmRsZUNhY2hlIiwgIl9fd2ViR3B1RGV2aWNlV3JhcHBlciIsICJfX2dwdVF1ZXVlIiwgIl9fY29tbWFuZEVuY29kZXIiLCAiX19yZWdpc3RlclJlc291cmNlIiwgIl9fY3JlYXRlVGV4dHVyZUlubmVyIiwgIl9fZ2VuZXJhdGVNaXBtYXBzU2hhZGVyTW9kdWxlIiwgIl9fZ2VuZXJhdGVNaXBtYXBzUGlwZWxpbmUiLCAiX19nZW5lcmF0ZU1pcG1hcHNGb3JtYXQiLCAiX19nZW5lcmF0ZU1pcG1hcHNCaW5kR3JvdXBMYXlvdXQiLCAiX19nZW5lcmF0ZU1pcG1hcHNTYW1wbGVyIiwgIl9fZmx1c2hSZW5kZXJQYXNzV29yayIsICJzcmNWaWV3IiwgImRzdFZpZXciLCAiYmluZEdyb3VwIiwgIl9fYWxsb2NhdGVWZXJ0ZXhCdWZmZXJSYW5nZSIsICJfX2dldFZlcnRleEZvcm1hdCIsICJfX25vcm1hbGl6ZWRWZXJ0ZXhGb3JtYXRzIiwgIl9fZ2V0SW5kZXhEYXRhIiwgIl9fZ2V0VmVydGV4QnVmZmVyQXJlbmEiLCAiX192ZXJ0ZXhCdWZmZXJBcmVuYSIsICJfX3JlbGVhc2VWZXJ0ZXhCdWZmZXJSYW5nZSIsICJfX2NoZWNrU2hhZGVyQ29tcGlsZVN0YXR1cyIsICJfX2NvbGxlY3RSZW5kZXJQYXNzVGFyZ2V0Vmlld3MiLCAiX19pc1NhbWVUYXJnZXRWaWV3cyIsICJfX2VuY29kZVBlbmRpbmdDbGVhciIsICJfX2dldENvbnRleHRDdXJyZW50VGV4dHVyZVZpZXciLCAiX19zeXN0ZW1EZXB0aFRleHR1cmVWaWV3IiwgIl9fYmVnaW5SZW5kZXJQYXNzIiwgIl9fbWF0ZXJpYWxUeXBlTmFtZSIsICJfX2dldERyYXdCaW5kR3JvdXBzIiwgIl9fcmVuZGVyQnVuZGxlRW5jb2RlciIsICJfX2J1bmRsZVBpcGVsaW5lIiwgIl9fcmVnaXN0ZXJHcHVDdWxsZWREcmF3IiwgIl9fc2VsZWN0RGVmb3JtZWRWZXJ0ZXhPZmZzZXQiLCAiX19jdXJyZW50RHJhd1BhcmFtZXRlcnNCaW5kR3JvdXAiLCAiX19idW5kbGVJbmRleEJ1ZmZlciIsICJfX2J1bmRsZUluZGV4Rm9ybWF0IiwgIl9fZ3B1Q3VsbGluZyIsICJfX2dldFJlbmRlckJ1bmRsZURlc2NyaXB0b3IiLCAiX19zeXN0ZW1EZXB0aFRleHR1cmUiLCAib3B0aW9ucyIsICJfX2NsZWFyUmVuZGVyQnVuZGxlRW5jb2RlciIsICJfX2FkZFRpbWVzdGFtcFdyaXRlcyIsICJfX3JlbmRlclBhc3NFbmNvZGVyIiwgIl9fcmVuZGVyQnVuZGxlRW5jb2Rlck93bmVyIiwgIl9fcmVuZGVyQnVuZGxlRW5jb2RlcktleSIsICJfX3Jlc2V0QnVuZGxlRW5jb2RlclN0YXRlIiwgIl9fcmVuZGVyUGFzc0VuY29kZXJPd25lciIsICJfX2VuZFJlbmRlclBhc3NFbmNvZGVyIiwgIl9fYmVnaW5SZW5kZXJQYXNzRW5jb2RlciIsICJfX3Jlc2V0UGVuZGluZ0NsZWFyIiwgIl9fY29udGV4dEN1cnJlbnRUZXh0dXJlVmlldyIsICJfX2lzVGV4dHVyZUFzQXR0YWNobWVudFZpZXdTdXBwb3J0ZWQiLCAiX190ZXh0dXJlQXNBdHRhY2htZW50Vmlld1N1cHBvcnQiLCAiX19kZWZlcnJlZFN5c3RlbURlcHRoQ2xlYXJWYWx1ZSIsICJfX2dwdVRpbWVyIiwgIl9fZXhlY3V0ZVJlbmRlckJ1bmRsZSIsICJfX2V4ZWN1dGVQZW5kaW5nUmVuZGVyQnVuZGxlcyIsICJfX2NhY2hlUmVuZGVyQnVuZGxlIiwgIl9fdG9DbGVhclJlbmRlckJ1bmRsZXMiLCAiX19sYXN0SXNHcHVDdWxsaW5nRW5hYmxlZCIsICJfX2xhc3RJc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQiLCAiX19sYXN0SXNGcnVzdHVtQ3VsbGluZ0VuYWJsZWQiLCAiX19zdG9yYWdlQnVmZmVyIiwgIl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXIiLCAiX191bmlmb3JtTW9ycGhPZmZzZXRzQnVmZmVyIiwgIl9fdW5pZm9ybU1vcnBoV2VpZ2h0c0J1ZmZlciIsICJfX2dldERlZm9ybWVkVmVydGljZXNCdWZmZXIiLCAiX19nZXREZXB0aE9ubHlGcmFnbWVudE1vZHVsZSIsICJfX2RlcHRoT25seUZyYWdtZW50TW9kdWxlIiwgImltYWdlcyIsICJfX2JpbmRHcm91cExheW91dFVuaWZvcm1EcmF3UGFyYW1ldGVycyIsICJfX2RyYXdQYXJhbWV0ZXJzRW50cmllc1BlckJ1ZmZlciIsICJfX2RyYXdQYXJhbWV0ZXJzQnl0ZVNpemUiLCAiX19kcmF3UGFyYW1ldGVyc1ZhbHVlcyIsICJfX2dldEdwdU9iamVjdElkIiwgIl9fZ2V0T3JDcmVhdGVCaW5kR3JvdXBMYXlvdXQiLCAiX19nZXREdW1teVRleHR1cmVWaWV3IiwgIl9fZHVtbXlEZWZvcm1lZFZlcnRpY2VzQnVmZmVyIiwgIl9fZ2V0U3RvcmFnZUJpbmRHcm91cCIsICJfX2R1bW15QmxlbmRTaGFwZUJ1ZmZlciIsICJfX2JpbmRHcm91cExheW91dFN0b3JhZ2VCdWZmZXIiLCAiX19wdXNoVGV4dHVyZVNhbXBsZXJCaW5kaW5nIiwgIl9fY29sbGVjdFRleHR1cmVTYW1wbGVyQmluZGluZ3MiLCAiX19nZXRUZXh0dXJlQmluZEdyb3VwTGF5b3V0IiwgIl9fZ2V0U2FtcGxlckJpbmRHcm91cExheW91dCIsICJfX2RyYXdCaW5kR3JvdXBzIl0KfQo=
