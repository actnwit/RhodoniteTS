
import Material from "../foundation/materials/core/Material";
import RenderPass from "../foundation/renderer/RenderPass";
import { AlphaMode } from "../foundation/definitions/AlphaMode";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import MeshComponent from "../foundation/components/MeshComponent";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";

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
  const cullFace = material.cullFace;
  const cullFrontFaceCCW = material.cullFrontFaceCCW;

  setCull(cullFace, cullFrontFaceCCW, gl);
  setBlendSettings(material, gl);
}

function setCull(cullFace: boolean, cullFrontFaceCCW: boolean, gl: WebGLRenderingContext) {
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
}

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

  if (material.alphaMode === AlphaMode.Translucent) {
    setBlendEquationMode(material.blendEquationMode, material.blendEquationModeAlpha, gl);
    setBlendFuncSrcFactor(material.blendFuncSrcFactor, material.blendFuncDstFactor, material.blendFuncAlphaSrcFactor, material.blendFuncAlphaDstFactor, gl);
  } else if (material.alphaMode === AlphaMode.Additive) {
    setBlendEquationMode(32774, null, gl);       // gl.FUNC_ADD
    setBlendFuncSrcFactor(1, 1, null, null, gl); // gl.ONE
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
  if (MeshRendererComponent.isDepthMaskTrueForTransparencies) {
    return;
  }
  if (idx === MeshRendererComponent.firstTransparentIndex) {
    gl.depthMask(false);
  }
}

function endDepthMasking(idx: number, gl: WebGLRenderingContext, renderPass: RenderPass) {
  if (idx === MeshRendererComponent.lastTransparentIndex) {
    gl.depthMask(true);
  }
}

function isMeshSetup(meshComponent: MeshComponent) {

  if (meshComponent.mesh!.variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
    const primitiveNum = meshComponent.mesh!.getPrimitiveNumber();
    let count = 0;
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh!.getPrimitiveAt(i);
      if (primitive.vertexHandles != null) {
        count++;
      }
    }

    if (primitiveNum === count) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }

}

function isMaterialsSetup(meshComponent: MeshComponent) {

  if (meshComponent.mesh!.variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
    const primitiveNum = meshComponent.mesh!.getPrimitiveNumber();
    let count = 0;
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh!.getPrimitiveAt(i);
      if (primitive.material != null && primitive.material._shaderProgramUid !== -1) {
        count++;
      }
    }

    if (primitiveNum === count) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }

}

export default Object.freeze({ setCullAndBlendSettings, startDepthMasking, endDepthMasking, isMeshSetup, isMaterialsSetup });