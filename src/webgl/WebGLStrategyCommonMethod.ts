import { AlphaMode } from '../foundation/definitions/AlphaMode';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { CompositionType } from '../foundation/definitions/CompositionType';
import { ShaderType } from '../foundation/definitions/ShaderType';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import { Scalar } from '../foundation/math/Scalar';
import { Vector3 } from '../foundation/math/Vector3';
import type { Vector4 } from '../foundation/math/Vector4';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine';
import type { Index } from '../types/CommonTypes';
import type { WebXRSystem } from '../xr/WebXRSystem';
import type { WebGLStrategy } from './WebGLStrategy';

/**
 * WebGL state cache structure for each Engine instance.
 * These values are used to minimize redundant WebGL state changes.
 */
interface WebGLStateCache {
  lastIsTransparentMode?: boolean;
  lastBlendEquationMode?: number;
  lastBlendEquationModeAlpha?: number;
  lastBlendFuncSrcFactor?: number;
  lastBlendFuncDstFactor?: number;
  lastBlendFuncAlphaSrcFactor?: number;
  lastBlendFuncAlphaDstFactor?: number;
  lastCullFace?: boolean;
  lastFrontFaceCCW?: boolean;
  lastCullFaceBack?: boolean;
  lastAlphaToCoverage?: boolean;
  lastColorWriteMask?: boolean[];
}

/** WebGL state caches managed per-Engine. Key is Engine.objectUID */
const __webGLStateCachePerEngine: Map<number, WebGLStateCache> = new Map();

/**
 * Gets the WebGL state cache for a specific engine.
 * Creates a new cache with default values if it doesn't exist.
 */
function __getStateCache(engine: Engine): WebGLStateCache {
  let cache = __webGLStateCachePerEngine.get(engine.objectUID);
  if (!cache) {
    cache = {
      lastCullFace: false,
      lastFrontFaceCCW: true,
      lastCullFaceBack: true,
      lastAlphaToCoverage: false,
      lastColorWriteMask: [true, true, true, true],
    };
    __webGLStateCachePerEngine.set(engine.objectUID, cache);
  }
  return cache;
}

/**
 * Cleans up WebGL state cache for a specific Engine instance.
 * This should be called when the Engine is destroyed.
 * @param engine - The Engine instance being destroyed
 * @internal Called from Engine.destroy()
 */
export function _cleanupWebGLStatesCacheForEngine(engine: Engine): void {
  __webGLStateCachePerEngine.delete(engine.objectUID);
}

/**
 * Sets WebGL rendering parameters for the given material.
 * This includes culling, blending, alpha-to-coverage, and color write mask settings.
 *
 * @param engine - The engine instance
 * @param material - The material containing rendering parameters to apply
 * @param gl - The WebGL rendering context
 */
function setWebGLParameters(engine: Engine, material: Material, gl: WebGLRenderingContext) {
  const cache = __getStateCache(engine);
  setCull(cache, material, gl);
  setBlendSettings(cache, material, gl);
  setAlphaToCoverage(cache, material, gl);
  setColorWriteMask(cache, material, gl);
}

/**
 * Configures face culling settings for the WebGL context based on material properties.
 * Only updates WebGL state when values differ from the last set values to optimize performance.
 *
 * @param cache - The WebGL state cache for the current engine
 * @param material - The material containing culling configuration
 * @param gl - The WebGL rendering context
 */
function setCull(cache: WebGLStateCache, material: Material, gl: WebGLRenderingContext) {
  const cullFace = material.cullFace;
  const cullFrontFaceCCW = material.cullFrontFaceCCW;
  const cullFaceBack = material.cullFaceBack;
  if (cache.lastCullFace !== cullFace) {
    if (cullFace) {
      gl.enable(gl.CULL_FACE);
    } else {
      gl.disable(gl.CULL_FACE);
    }
    cache.lastCullFace = cullFace;
  }

  if (cullFace === true && cache.lastFrontFaceCCW !== cullFrontFaceCCW) {
    if (cullFrontFaceCCW) {
      gl.frontFace(gl.CCW);
    } else {
      gl.frontFace(gl.CW);
    }
    cache.lastFrontFaceCCW = cullFrontFaceCCW;
  }

  if (cullFaceBack !== cache.lastCullFaceBack) {
    if (cullFaceBack) {
      gl.cullFace(gl.BACK);
    } else {
      gl.cullFace(gl.FRONT);
    }
    cache.lastCullFaceBack = cullFaceBack;
  }
}

/**
 * Configures blending settings for the WebGL context based on material properties.
 * Handles enabling/disabling blending and setting blend equation and function parameters.
 *
 * @param cache - The WebGL state cache for the current engine
 * @param material - The material containing blending configuration
 * @param gl - The WebGL rendering context
 */
function setBlendSettings(cache: WebGLStateCache, material: Material, gl: WebGLRenderingContext) {
  const isBlendMode = material.isBlend();
  if (cache.lastIsTransparentMode !== isBlendMode) {
    if (isBlendMode) {
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }
    cache.lastIsTransparentMode = isBlendMode;
  }

  if (material.alphaMode === AlphaMode.Blend) {
    setBlendEquationMode(cache, material.blendEquationMode.index, material.blendEquationModeAlpha.index, gl);
    setBlendFuncSrcFactor(
      cache,
      material.blendFuncSrcFactor.index,
      material.blendFuncDstFactor.index,
      material.blendFuncAlphaSrcFactor.index,
      material.blendFuncAlphaDstFactor.index,
      gl
    );
  }
}

/**
 * Sets the blend equation mode for RGB and alpha channels separately.
 * Only updates WebGL state when values differ from previously set values.
 *
 * @param cache - The WebGL state cache for the current engine
 * @param blendEquationMode - The blend equation mode for RGB channels
 * @param blendEquationModeAlpha - The blend equation mode for alpha channel
 * @param gl - The WebGL rendering context
 */
function setBlendEquationMode(
  cache: WebGLStateCache,
  blendEquationMode: number,
  blendEquationModeAlpha: number,
  gl: WebGLRenderingContext
) {
  if (
    cache.lastBlendEquationMode !== blendEquationMode ||
    cache.lastBlendEquationModeAlpha !== blendEquationModeAlpha
  ) {
    gl.blendEquationSeparate(blendEquationMode, blendEquationModeAlpha);
    cache.lastBlendEquationMode = blendEquationMode;
    cache.lastBlendEquationModeAlpha = blendEquationModeAlpha;
  }
}

/**
 * Sets the blend function source and destination factors for RGB and alpha channels.
 * Only updates WebGL state when values differ from previously set values.
 *
 * @param cache - The WebGL state cache for the current engine
 * @param blendFuncSrcFactor - Source factor for RGB channels
 * @param blendFuncDstFactor - Destination factor for RGB channels
 * @param blendFuncAlphaSrcFactor - Source factor for alpha channel
 * @param blendFuncAlphaDstFactor - Destination factor for alpha channel
 * @param gl - The WebGL rendering context
 */
function setBlendFuncSrcFactor(
  cache: WebGLStateCache,
  blendFuncSrcFactor: number,
  blendFuncDstFactor: number,
  blendFuncAlphaSrcFactor: number,
  blendFuncAlphaDstFactor: number,
  gl: WebGLRenderingContext
) {
  if (
    cache.lastBlendFuncSrcFactor !== blendFuncSrcFactor ||
    cache.lastBlendFuncDstFactor !== blendFuncDstFactor ||
    cache.lastBlendFuncAlphaSrcFactor !== blendFuncAlphaSrcFactor ||
    cache.lastBlendFuncAlphaDstFactor !== blendFuncAlphaDstFactor
  ) {
    gl.blendFuncSeparate(blendFuncSrcFactor, blendFuncDstFactor, blendFuncAlphaSrcFactor, blendFuncAlphaDstFactor);
    cache.lastBlendFuncSrcFactor = blendFuncSrcFactor;
    cache.lastBlendFuncDstFactor = blendFuncDstFactor;
    cache.lastBlendFuncAlphaSrcFactor = blendFuncAlphaSrcFactor;
    cache.lastBlendFuncAlphaDstFactor = blendFuncAlphaDstFactor;
  }
}

/**
 * Configures alpha-to-coverage multisampling setting based on material properties.
 * Only updates WebGL state when the value differs from the last set value.
 *
 * @param cache - The WebGL state cache for the current engine
 * @param material - The material containing alpha-to-coverage configuration
 * @param gl - The WebGL rendering context
 */
function setAlphaToCoverage(cache: WebGLStateCache, material: Material, gl: WebGLRenderingContext) {
  const alphaToCoverage = material.alphaToCoverage;
  if (alphaToCoverage !== cache.lastAlphaToCoverage) {
    if (alphaToCoverage) {
      gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    } else {
      gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    }
    cache.lastAlphaToCoverage = alphaToCoverage;
  }
}

/**
 * Sets the color write mask to control which color channels are written to the framebuffer.
 * Only updates WebGL state when values differ from previously set values.
 *
 * @param cache - The WebGL state cache for the current engine
 * @param material - The material containing color write mask configuration
 * @param gl - The WebGL rendering context
 */
function setColorWriteMask(cache: WebGLStateCache, material: Material, gl: WebGLRenderingContext) {
  const colorWriteMask = material.colorWriteMask;
  if (
    cache.lastColorWriteMask == null ||
    colorWriteMask[0] !== cache.lastColorWriteMask[0] ||
    colorWriteMask[1] !== cache.lastColorWriteMask[1] ||
    colorWriteMask[2] !== cache.lastColorWriteMask[2] ||
    colorWriteMask[3] !== cache.lastColorWriteMask[3]
  ) {
    gl.colorMask(colorWriteMask[0], colorWriteMask[1], colorWriteMask[2], colorWriteMask[3]);
    cache.lastColorWriteMask = colorWriteMask;
  }
}

/**
 * Gets the viewport configuration for the given render pass.
 * If the render pass doesn't specify a viewport, returns the default viewport from the WebGL context.
 *
 * @param engine - The engine instance
 * @param renderPass - The render pass to get viewport for
 * @returns The viewport as a Vector4 containing [x, y, width, height]
 */
function getViewport(engine: Engine, renderPass: RenderPass) {
  const webglResourceRepository = engine.webglResourceRepository;
  let viewport = renderPass.getViewport() as Vector4;
  if (viewport == null) {
    viewport = webglResourceRepository.currentWebGLContextWrapper!.defaultViewport;
  }
  return viewport!;
}

/**
 * Sets the viewport for VR rendering based on the specified display index.
 * Only applies viewport changes when in WebXR mode.
 *
 * @param engine - The engine instance
 * @param renderPass - The render pass being processed
 * @param displayIdx - The index of the display/eye (0 for left eye, 1 for right eye)
 */
function setVRViewport(engine: Engine, _renderPass: RenderPass, displayIdx: Index) {
  const webglResourceRepository = engine.webglResourceRepository;
  const webxrSystem = engine.webXRSystem;
  if (webxrSystem.isWebXRMode) {
    webglResourceRepository.setViewport(engine, webxrSystem._getViewportAt(displayIdx));
  }
}

/**
 * Determines the number of displays/eyes to render for based on VR mode and configuration.
 * Returns 1 for non-VR mode, multiview VR, or non-main VR passes.
 * Returns 2 for standard stereo VR rendering on main passes.
 *
 * @param isVRMainPass - Whether this is a main VR rendering pass
 * @param webxrSystem - The WebXR system instance
 * @returns 1 or 2 depending on the rendering configuration
 */
function getDisplayCount(isVRMainPass: boolean, webxrSystem: WebXRSystem): 1 | 2 {
  if (webxrSystem.isWebXRMode) {
    if (webxrSystem.isMultiView()) {
      return 1;
    }
    if (isVRMainPass) {
      return 2;
    }
    return 1;
  }
  return 1;
}

/**
 * Determines if the given render pass is a VR main rendering pass.
 * A VR main pass is one that renders to VR displays when WebXR mode is active.
 *
 * @param renderPass - The render pass to check
 * @returns True if this is a VR main pass, false otherwise
 */
function isVrMainPass(engine: Engine, renderPass: RenderPass) {
  const webxrSystem = engine.webXRSystem;
  const isVRMainPass = webxrSystem.isWebXRMode && renderPass.isVrRendering;
  return isVRMainPass;
}

/**
 * Returns shader semantics information for point sprite rendering.
 * Provides configuration for point size and distance attenuation parameters.
 *
 * @returns Array of shader semantic information objects for point sprites
 */
function getPointSpriteShaderSemanticsInfoArray() {
  return [
    {
      semantic: 'pointSize',
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(30.0),
      min: 0,
      max: Number.MAX_VALUE,
      isInternalSetting: false,
    },
    {
      semantic: 'pointDistanceAttenuation',
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
      min: 0,
      max: 1,
      isInternalSetting: false,
    },
  ];
}

/**
 * Sets up and compiles shader programs for the given material and primitive.
 * Handles shader compilation errors by backing up and restoring valid materials.
 * If shader compilation fails, attempts to restore from a backup and retry.
 *
 * @param material - The material requiring shader setup
 * @param primitive - The primitive that will use the material
 * @param webglStrategy - The WebGL strategy for shader compilation
 */
export function setupShaderProgram(material: Material, primitive: Primitive, webglStrategy: WebGLStrategy): void {
  if (material == null) {
    return;
  }

  if (material.isShaderProgramReady(primitive)) {
    return;
  }

  try {
    primitive?._backupMaterial();
    webglStrategy.setupShaderForMaterial(material, primitive);
  } catch (e) {
    // It is possible that a shader compilation error may occur, for example, in the middle of shader editing.
    // In this case, restore the shaders from a backup of the valid material.
    console.log(e);
    primitive?._restoreMaterial();
    webglStrategy.setupShaderForMaterial(material, primitive);
  }
}

/**
 * Common WebGL strategy methods for rendering operations.
 * Provides utilities for WebGL parameter management, VR rendering support,
 * and shader semantics configuration.
 */
export default Object.freeze({
  setWebGLParameters,
  setVRViewport,
  getViewport,
  getDisplayCount,
  isVrMainPass,
  getPointSpriteShaderSemanticsInfoArray,
});
