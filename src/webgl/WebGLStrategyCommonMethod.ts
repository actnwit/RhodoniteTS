
import Material from "../foundation/materials/Material";
import RenderPass from "../foundation/renderer/RenderPass";
import { AlphaMode } from "../foundation/definitions/AlphaMode";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";

let lastIsTransparentMode: boolean;
let lastBlendEquationMode: number;
let lastBlendEquationModeAlpha: number | null;
let lastBlendFuncSrcFactor: number;
let lastBlendFuncDstFactor: number;
let lastBlendFuncAlphaSrcFactor: number | null;
let lastBlendFuncAlphaDstFactor: number | null;
let lastCullFace: boolean;
let lastFrontFaceCCW: boolean;

function setCullAndBlendSettings(material: Material, renderPass: RenderPass, gl: WebGLRenderingContext) {
  let cullface, cullFrontFaceCCW;
  if (material.cullface != null) {
    cullface = material.cullface;
    cullFrontFaceCCW = material.cullFrontFaceCCW;
  } else {
    cullface = renderPass.cullface;
    cullFrontFaceCCW = renderPass.cullFrontFaceCCW;
  }

  setCull(cullface, cullFrontFaceCCW, gl);
  setBlendSettings(material, gl);
}

function setCull(cullface: boolean, cullFrontFaceCCW: boolean, gl: WebGLRenderingContext) {
  if (lastCullFace !== cullface) {
    if (!cullface) {
      gl.disable(gl.CULL_FACE);
    } else {
      gl.enable(gl.CULL_FACE);
    }
    lastCullFace = cullface;
  }

  if (cullface === true && lastFrontFaceCCW !== cullFrontFaceCCW) {
    if (cullFrontFaceCCW) {
      gl.frontFace(gl.CCW);
    } else {
      gl.frontFace(gl.CW);
    }
    lastFrontFaceCCW = cullFrontFaceCCW;
  }
}

function setBlendSettings(material: Material, gl: WebGLRenderingContext) {
  const isTransparentMode = material.alphaMode === AlphaMode.Blend;
  if (lastIsTransparentMode !== isTransparentMode) {
    if (isTransparentMode) {
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }
    lastIsTransparentMode = isTransparentMode;
  }

  if (isTransparentMode) {
    setBlendEquationMode(material.blendEquationMode, material.blendEquationModeAlpha, gl);
    setBlendFuncSrcFactor(material.blendFuncSrcFactor, material.blendFuncDstFactor, material.blendFuncAlphaSrcFactor, material.blendFuncAlphaDstFactor, gl);
  }
}

function setBlendEquationMode(blendEquationMode: number, blendEquationModeAlpha: number | null, gl: WebGLRenderingContext) {
  const needUpdateBlendEquation = differentWithLastBlendEquation(blendEquationMode, blendEquationModeAlpha);
  if (needUpdateBlendEquation) {
    if (blendEquationModeAlpha != null) {
      gl.blendEquationSeparate(blendEquationMode, blendEquationModeAlpha);
    } else {
      gl.blendEquation(blendEquationMode);
    }
    lastBlendEquationMode = blendEquationMode;
    lastBlendEquationModeAlpha = blendEquationModeAlpha;
  }
}

function differentWithLastBlendEquation(equationMode: number, equationModeAlpha: number | null) {
  const result = (
    lastBlendEquationMode != equationMode ||
    lastBlendEquationModeAlpha != equationModeAlpha
  );
  return result;
}

function setBlendFuncSrcFactor(blendFuncSrcFactor: number, blendFuncDstFactor: number, blendFuncAlphaSrcFactor: number | null, blendFuncAlphaDstFactor: number | null, gl: WebGLRenderingContext) {
  const needUpdateBlendFunc = differentWithLastBlendFuncFactor(blendFuncSrcFactor, blendFuncDstFactor, blendFuncAlphaSrcFactor, blendFuncAlphaDstFactor);
  if (needUpdateBlendFunc) {
    if (blendFuncAlphaSrcFactor != null) {
      gl.blendFuncSeparate(blendFuncSrcFactor, blendFuncDstFactor, blendFuncAlphaSrcFactor, blendFuncAlphaDstFactor!);
    } else {
      gl.blendFunc(blendFuncSrcFactor, blendFuncDstFactor);
    }
    lastBlendFuncSrcFactor = blendFuncSrcFactor;
    lastBlendFuncDstFactor = blendFuncDstFactor;
    lastBlendFuncAlphaSrcFactor = blendFuncAlphaSrcFactor;
    lastBlendFuncAlphaDstFactor = blendFuncAlphaDstFactor;
  }
}

function differentWithLastBlendFuncFactor(srcFactor: number, dstFactor: number, alphaSrcFactor: number | null, alphaDstFactor: number | null): boolean {
  const result = (
    lastBlendFuncSrcFactor != srcFactor ||
    lastBlendFuncDstFactor != dstFactor ||
    lastBlendFuncAlphaSrcFactor != alphaSrcFactor ||
    lastBlendFuncAlphaDstFactor != alphaDstFactor
  );
  return result;
}

function startDepthMasking(idx: number, gl: WebGLRenderingContext, renderPass: RenderPass) {
  if (idx === MeshRendererComponent.firstTranparentIndex) {
    gl.depthMask(false);
  }
}

function endDepthMasking(idx: number, gl: WebGLRenderingContext, renderPass: RenderPass) {
  if (idx === MeshRendererComponent.lastTransparentIndex) {
    gl.depthMask(true);
  }
}

export default Object.freeze({ setCullAndBlendSettings, startDepthMasking, endDepthMasking });