import Material from '../foundation/materials/core/Material';
import RenderPass from '../foundation/renderer/RenderPass';
import {AlphaMode} from '../foundation/definitions/AlphaMode';
import MeshRendererComponent from '../foundation/components/MeshRendererComponent';
import MeshComponent from '../foundation/components/MeshComponent';
import CGAPIResourceRepository from '../foundation/renderer/CGAPIResourceRepository';
import {Index} from '../types/CommonTypes';
import Mesh from '../foundation/geometry/Mesh';
import {Is, Is as is} from '../foundation/misc/Is';
import ModuleManager from '../foundation/system/ModuleManager';
import WebGLResourceRepository from './WebGLResourceRepository';
import {RnXR} from '../xr/main';
import Vector4 from '../foundation/math/Vector4';
import GlobalDataRepository from '../foundation/core/GlobalDataRepository';

let lastIsTransparentMode: boolean;
let lastBlendEquationMode: number;
let lastBlendEquationModeAlpha: number;
let lastBlendFuncSrcFactor: number;
let lastBlendFuncDstFactor: number;
let lastBlendFuncAlphaSrcFactor: number;
let lastBlendFuncAlphaDstFactor: number;
let lastCullFace: boolean;
let lastFrontFaceCCW: boolean;

function setWebGLParameters(material: Material, gl: WebGLRenderingContext) {
  setCull(material, gl);
  setBlendSettings(material, gl);
}

function setCull(material: Material, gl: WebGLRenderingContext) {
  const cullFace = material.cullFace;
  const cullFrontFaceCCW = material.cullFrontFaceCCW;

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
    setBlendEquationMode(
      material.blendEquationMode,
      material.blendEquationModeAlpha,
      gl
    );
    setBlendFuncSrcFactor(
      material.blendFuncSrcFactor,
      material.blendFuncDstFactor,
      material.blendFuncAlphaSrcFactor,
      material.blendFuncAlphaDstFactor,
      gl
    );
  } else if (material.alphaMode === AlphaMode.Additive) {
    setBlendEquationMode(32774, 32774, gl); // gl.FUNC_ADD
    setBlendFuncSrcFactor(1, 1, 1, 1, gl); // gl.ONE
  }
}

function setBlendEquationMode(
  blendEquationMode: number,
  blendEquationModeAlpha: number,
  gl: WebGLRenderingContext
) {
  const needUpdateBlendEquation = differentWithLastBlendEquation(
    blendEquationMode,
    blendEquationModeAlpha
  );
  if (needUpdateBlendEquation) {
    gl.blendEquationSeparate(blendEquationMode, blendEquationModeAlpha);
    lastBlendEquationMode = blendEquationMode;
    lastBlendEquationModeAlpha = blendEquationModeAlpha;
  }
}

function differentWithLastBlendEquation(
  equationMode: number,
  equationModeAlpha: number
) {
  const result =
    lastBlendEquationMode != equationMode ||
    lastBlendEquationModeAlpha != equationModeAlpha;
  return result;
}

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
    gl.blendFuncSeparate(
      blendFuncSrcFactor,
      blendFuncDstFactor,
      blendFuncAlphaSrcFactor,
      blendFuncAlphaDstFactor!
    );
    lastBlendFuncSrcFactor = blendFuncSrcFactor;
    lastBlendFuncDstFactor = blendFuncDstFactor;
    lastBlendFuncAlphaSrcFactor = blendFuncAlphaSrcFactor;
    lastBlendFuncAlphaDstFactor = blendFuncAlphaDstFactor;
  }
}

function differentWithLastBlendFuncFactor(
  srcFactor: number,
  dstFactor: number,
  alphaSrcFactor: number,
  alphaDstFactor: number
): boolean {
  const result =
    lastBlendFuncSrcFactor != srcFactor ||
    lastBlendFuncDstFactor != dstFactor ||
    lastBlendFuncAlphaSrcFactor != alphaSrcFactor ||
    lastBlendFuncAlphaDstFactor != alphaDstFactor;
  return result;
}

function startDepthMasking(idx: number, gl: WebGLRenderingContext) {
  if (MeshRendererComponent.isDepthMaskTrueForTransparencies) {
    return;
  }
  if (idx === MeshRendererComponent.firstTransparentIndex) {
    gl.depthMask(false);
  }
}

function endDepthMasking(idx: number, gl: WebGLRenderingContext) {
  if (idx === MeshRendererComponent.lastTransparentIndex) {
    gl.depthMask(true);
  }
}

function updateVBOAndVAO(mesh: Mesh) {
  const primitiveNum = mesh.getPrimitiveNumber();
  for (let i = 0; i < primitiveNum; i++) {
    const primitive = mesh.getPrimitiveAt(i);
    if (is.exist(primitive.vertexHandles)) {
      primitive.update3DAPIVertexData();
    } else {
      primitive.create3DAPIVertexData();
    }
  }
  mesh.updateVariationVBO();
  mesh.updateVAO();
}

function isMeshSetup(mesh: Mesh) {
  if (
    mesh.variationVBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid
  ) {
    return false;
  }

  const primitiveNum = mesh.getPrimitiveNumber();
  for (let i = 0; i < primitiveNum; i++) {
    const primitive = mesh.getPrimitiveAt(i);
    if (
      !is.exist(primitive.vertexHandles) ||
      primitive.isPositionAccessorUpdated
    ) {
      return false;
    }
  }

  return true;
}

function isMaterialsSetup(meshComponent: MeshComponent) {
  if (
    meshComponent.mesh!.variationVBOUid !==
    CGAPIResourceRepository.InvalidCGAPIResourceUid
  ) {
    const primitiveNum = meshComponent.mesh!.getPrimitiveNumber();
    let count = 0;
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh!.getPrimitiveAt(i);
      if (primitive.material._shaderProgramUid !== -1) {
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

function isSkipDrawing(material: Material, idx: Index) {
  if (
    material.isEmptyMaterial() ||
    material._shaderProgramUid === -1 ||
    (idx < MeshRendererComponent.firstTransparentIndex && material.isBlend()) ||
    (idx >= MeshRendererComponent.firstTransparentIndex && !material.isBlend())
  ) {
    return true;
  } else {
    return false;
  }
}

function getViewport(renderPass: RenderPass) {
  const webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  let viewport = renderPass.getViewport() as Vector4;
  if (viewport == null) {
    viewport = webglResourceRepository.currentWebGLContextWrapper!
      .defaultViewport;
  }
  return viewport!;
}

function setVRViewport(renderPass: RenderPass, displayIdx: Index) {
  const webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
  const webxrSystem = rnXRModule.WebXRSystem.getInstance();
  if (webxrSystem.isWebXRMode) {
    webglResourceRepository.setViewport(webxrSystem._getViewportAt(displayIdx));
  } else {
    const webvrSystem = rnXRModule.WebVRSystem.getInstance();
    if (webvrSystem.isWebVRMode) {
      webglResourceRepository.setViewport(
        webvrSystem.getViewportAt(getViewport(renderPass), displayIdx)
      );
    }
  }
}

function getDisplayNumber(isVRMainPass: boolean) {
  if (isVRMainPass) {
    return 2;
  } else {
    return 1;
  }
}

function isVrMainPass(renderPass: RenderPass) {
  const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
  const isVRMainPass =
    (rnXRModule?.WebXRSystem.getInstance().isWebXRMode ||
      rnXRModule?.WebVRSystem.getInstance().isWebVRMode) &&
    renderPass.isVrRendering;
  return isVRMainPass;
}

function getLocationOffsetOfProperty(
  propertyIndex: Index,
  materialTypeName?: string
) {
  if (Is.exist(materialTypeName)) {
    const dataBeginPos = Material.getLocationOffsetOfMemberOfMaterial(
      materialTypeName,
      propertyIndex
    );
    return dataBeginPos;
  } else {
    const globalDataRepository = GlobalDataRepository.getInstance();
    const dataBeginPos =
      globalDataRepository.getLocationOffsetOfProperty(propertyIndex);
    return dataBeginPos;
  }
}

export default Object.freeze({
  setWebGLParameters,
  startDepthMasking,
  endDepthMasking,
  updateVBOAndVAO,
  isMeshSetup,
  isMaterialsSetup,
  isSkipDrawing,
  setVRViewport,
  getDisplayNumber,
  isVrMainPass,
  getLocationOffsetOfProperty,
});
