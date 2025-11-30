import { AlphaMode } from '../foundation/definitions/AlphaMode';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { CompositionType } from '../foundation/definitions/CompositionType';
import { ShaderSemantics } from '../foundation/definitions/ShaderSemantics';
import { ShaderType } from '../foundation/definitions/ShaderType';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import { Scalar } from '../foundation/math/Scalar';
import { Vector3 } from '../foundation/math/Vector3';
import type { Vector4 } from '../foundation/math/Vector4';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { type Index, IndexOf16Bytes } from '../types/CommonTypes';
import type { WebXRSystem } from '../xr/WebXRSystem';
import type { RnXR } from '../xr/main';
import { WebGLResourceRepository } from './WebGLResourceRepository';
import type { WebGLStrategy } from './WebGLStrategy';

let lastIsTransparentMode: boolean;
let lastBlendEquationMode: number;
let lastBlendEquationModeAlpha: number;
let lastBlendFuncSrcFactor: number;
let lastBlendFuncDstFactor: number;
let lastBlendFuncAlphaSrcFactor: number;
let lastBlendFuncAlphaDstFactor: number;
let lastCullFace = false;
let lastFrontFaceCCW = true;
let lastCullFaceBack = true;
let lastAlphaToCoverage = false;
let lastColorWriteMask: boolean[] = [true, true, true, true];

/**
 * Sets WebGL rendering parameters for the given material.
 * This includes culling, blending, alpha-to-coverage, and color write mask settings.
 *
 * @param material - The material containing rendering parameters to apply
 * @param gl - The WebGL rendering context
 */
function setWebGLParameters(material: Material, gl: WebGLRenderingContext) {
  setCull(material, gl);
  setBlendSettings(material, gl);
  setAlphaToCoverage(material, gl);
  setColorWriteMask(material, gl);
}

/**
 * Configures face culling settings for the WebGL context based on material properties.
 * Only updates WebGL state when values differ from the last set values to optimize performance.
 *
 * @param material - The material containing culling configuration
 * @param gl - The WebGL rendering context
 */
function setCull(material: Material, gl: WebGLRenderingContext) {
  const cullFace = material.cullFace;
  const cullFrontFaceCCW = material.cullFrontFaceCCW;
  const cullFaceBack = material.cullFaceBack;
  if (lastCullFace !== cullFace) {
    if (cullFace) {
      gl.enable(gl.CULL_FACE);
    } else {
      gl.disable(gl.CULL_FACE);
    }
    lastCullFace = cullFace;
  }

  if (cullFace === true && lastFrontFaceCCW !== cullFrontFaceCCW) {
    if (cullFrontFaceCCW) {
      gl.frontFace(gl.CCW);
    } else {
      gl.frontFace(gl.CW);
    }
    lastFrontFaceCCW = cullFrontFaceCCW;
  }

  if (cullFaceBack !== lastCullFaceBack) {
    if (cullFaceBack) {
      gl.cullFace(gl.BACK);
    } else {
      gl.cullFace(gl.FRONT);
    }
    lastCullFaceBack = cullFaceBack;
  }
}

/**
 * Configures blending settings for the WebGL context based on material properties.
 * Handles enabling/disabling blending and setting blend equation and function parameters.
 *
 * @param material - The material containing blending configuration
 * @param gl - The WebGL rendering context
 */
function setBlendSettings(material: Material, gl: WebGLRenderingContext) {
  const isBlendMode = material.isBlend();
  if (lastIsTransparentMode !== isBlendMode) {
    if (isBlendMode) {
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }
    lastIsTransparentMode = isBlendMode;
  }

  if (material.alphaMode === AlphaMode.Blend) {
    setBlendEquationMode(material.blendEquationMode.index, material.blendEquationModeAlpha.index, gl);
    setBlendFuncSrcFactor(
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
 * @param blendEquationMode - The blend equation mode for RGB channels
 * @param blendEquationModeAlpha - The blend equation mode for alpha channel
 * @param gl - The WebGL rendering context
 */
function setBlendEquationMode(blendEquationMode: number, blendEquationModeAlpha: number, gl: WebGLRenderingContext) {
  const needUpdateBlendEquation = differentWithLastBlendEquation(blendEquationMode, blendEquationModeAlpha);
  if (needUpdateBlendEquation) {
    gl.blendEquationSeparate(blendEquationMode, blendEquationModeAlpha);
    lastBlendEquationMode = blendEquationMode;
    lastBlendEquationModeAlpha = blendEquationModeAlpha;
  }
}

/**
 * Checks if the current blend equation parameters differ from the last set values.
 *
 * @param equationMode - The blend equation mode for RGB channels
 * @param equationModeAlpha - The blend equation mode for alpha channel
 * @returns True if parameters differ from last set values, false otherwise
 */
function differentWithLastBlendEquation(equationMode: number, equationModeAlpha: number) {
  const result = lastBlendEquationMode !== equationMode || lastBlendEquationModeAlpha !== equationModeAlpha;
  return result;
}

/**
 * Sets the blend function source and destination factors for RGB and alpha channels.
 * Only updates WebGL state when values differ from previously set values.
 *
 * @param blendFuncSrcFactor - Source factor for RGB channels
 * @param blendFuncDstFactor - Destination factor for RGB channels
 * @param blendFuncAlphaSrcFactor - Source factor for alpha channel
 * @param blendFuncAlphaDstFactor - Destination factor for alpha channel
 * @param gl - The WebGL rendering context
 */
function setBlendFuncSrcFactor(
  blendFuncSrcFactor: number,
  blendFuncDstFactor: number,
  blendFuncAlphaSrcFactor: number,
  blendFuncAlphaDstFactor: number,
  gl: WebGLRenderingContext
) {
  const needUpdateBlendFunc = differentWithLastBlendFuncFactor(
    blendFuncSrcFactor,
    blendFuncDstFactor,
    blendFuncAlphaSrcFactor,
    blendFuncAlphaDstFactor
  );
  if (needUpdateBlendFunc) {
    gl.blendFuncSeparate(blendFuncSrcFactor, blendFuncDstFactor, blendFuncAlphaSrcFactor, blendFuncAlphaDstFactor!);
    lastBlendFuncSrcFactor = blendFuncSrcFactor;
    lastBlendFuncDstFactor = blendFuncDstFactor;
    lastBlendFuncAlphaSrcFactor = blendFuncAlphaSrcFactor;
    lastBlendFuncAlphaDstFactor = blendFuncAlphaDstFactor;
  }
}

/**
 * Checks if the current blend function parameters differ from the last set values.
 *
 * @param srcFactor - Source factor for RGB channels
 * @param dstFactor - Destination factor for RGB channels
 * @param alphaSrcFactor - Source factor for alpha channel
 * @param alphaDstFactor - Destination factor for alpha channel
 * @returns True if parameters differ from last set values, false otherwise
 */
function differentWithLastBlendFuncFactor(
  srcFactor: number,
  dstFactor: number,
  alphaSrcFactor: number,
  alphaDstFactor: number
): boolean {
  const result =
    lastBlendFuncSrcFactor !== srcFactor ||
    lastBlendFuncDstFactor !== dstFactor ||
    lastBlendFuncAlphaSrcFactor !== alphaSrcFactor ||
    lastBlendFuncAlphaDstFactor !== alphaDstFactor;
  return result;
}

/**
 * Configures alpha-to-coverage multisampling setting based on material properties.
 * Only updates WebGL state when the value differs from the last set value.
 *
 * @param material - The material containing alpha-to-coverage configuration
 * @param gl - The WebGL rendering context
 */
function setAlphaToCoverage(material: Material, gl: WebGLRenderingContext) {
  const alphaToCoverage = material.alphaToCoverage;
  if (alphaToCoverage !== lastAlphaToCoverage) {
    if (alphaToCoverage) {
      gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    } else {
      gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    }
    lastAlphaToCoverage = alphaToCoverage;
  }
}

/**
 * Sets the color write mask to control which color channels are written to the framebuffer.
 * Only updates WebGL state when values differ from previously set values.
 *
 * @param material - The material containing color write mask configuration
 * @param gl - The WebGL rendering context
 */
function setColorWriteMask(material: Material, gl: WebGLRenderingContext) {
  const colorWriteMask = material.colorWriteMask;
  if (
    colorWriteMask[0] !== lastColorWriteMask[0] ||
    colorWriteMask[1] !== lastColorWriteMask[1] ||
    colorWriteMask[2] !== lastColorWriteMask[2] ||
    colorWriteMask[3] !== lastColorWriteMask[3]
  ) {
    gl.colorMask(colorWriteMask[0], colorWriteMask[1], colorWriteMask[2], colorWriteMask[3]);
    lastColorWriteMask = colorWriteMask;
  }
}

/**
 * Gets the viewport configuration for the given render pass.
 * If the render pass doesn't specify a viewport, returns the default viewport from the WebGL context.
 *
 * @param renderPass - The render pass to get viewport for
 * @returns The viewport as a Vector4 containing [x, y, width, height]
 */
function getViewport(renderPass: RenderPass) {
  const webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
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
 * @param renderPass - The render pass being processed
 * @param displayIdx - The index of the display/eye (0 for left eye, 1 for right eye)
 */
function setVRViewport(engine: Engine, _renderPass: RenderPass, displayIdx: Index) {
  const webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  const webxrSystem = engine.webXRSystem;
  if (webxrSystem.isWebXRMode) {
    webglResourceRepository.setViewport(webxrSystem._getViewportAt(displayIdx));
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
