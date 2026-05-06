/** WebXR + WebGPU integration (widely implemented; not yet in TS `lib.dom` typings). */
interface GPURequestAdapterOptions {
  xrCompatible?: boolean;
}

/**
 * TypeScript 6+ `lib.dom.d.ts` defines WebGPU `*Flags` types but not the spec bitmask
 * namespace objects (`GPUTextureUsage`, `GPUBufferUsage`, etc.). `@webgpu/types`
 * cannot be used alongside `lib.dom` because the declarations conflict; these
 * minimal globals match the WebGPU spec and satisfy Rhodonite's WebGPU code.
 */
declare const GPUTextureUsage: Readonly<{
  COPY_SRC: GPUTextureUsageFlags;
  COPY_DST: GPUTextureUsageFlags;
  TEXTURE_BINDING: GPUTextureUsageFlags;
  STORAGE_BINDING: GPUTextureUsageFlags;
  RENDER_ATTACHMENT: GPUTextureUsageFlags;
}>;

declare const GPUBufferUsage: Readonly<{
  MAP_READ: GPUBufferUsageFlags;
  MAP_WRITE: GPUBufferUsageFlags;
  COPY_SRC: GPUBufferUsageFlags;
  COPY_DST: GPUBufferUsageFlags;
  INDEX: GPUBufferUsageFlags;
  VERTEX: GPUBufferUsageFlags;
  UNIFORM: GPUBufferUsageFlags;
  STORAGE: GPUBufferUsageFlags;
  INDIRECT: GPUBufferUsageFlags;
  QUERY_RESOLVE: GPUBufferUsageFlags;
}>;

declare const GPUMapMode: Readonly<{
  READ: GPUMapModeFlags;
  WRITE: GPUMapModeFlags;
}>;

declare const GPUShaderStage: Readonly<{
  VERTEX: GPUShaderStageFlags;
  FRAGMENT: GPUShaderStageFlags;
  COMPUTE: GPUShaderStageFlags;
}>;
