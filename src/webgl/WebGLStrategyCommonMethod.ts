import { Material } from '../foundation/materials/core/Material';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { AlphaMode } from '../foundation/definitions/AlphaMode';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { Index, IndexOf16Bytes } from '../types/CommonTypes';
import { Mesh } from '../foundation/geometry/Mesh';
import { Is } from '../foundation/misc/Is';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { WebGLResourceRepository } from './WebGLResourceRepository';
import { RnXR } from '../xr/main';
import { Vector4 } from '../foundation/math/Vector4';
import { ShaderSemantics } from '../foundation/definitions/ShaderSemantics';
import { CompositionType } from '../foundation/definitions/CompositionType';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { ShaderType } from '../foundation/definitions/ShaderType';
import { Scalar } from '../foundation/math/Scalar';
import { ShaderVariableUpdateInterval } from '../foundation/definitions/ShaderVariableUpdateInterval';
import { Vector3 } from '../foundation/math/Vector3';
import { Primitive } from '../foundation/geometry/Primitive';
import { WebGLStrategy } from './WebGLStrategy';

let lastIsTransparentMode: boolean;
let lastBlendEquationMode: number;
let lastBlendEquationModeAlpha: number;
let lastBlendFuncSrcFactor: number;
let lastBlendFuncDstFactor: number;
let lastBlendFuncAlphaSrcFactor: number;
let lastBlendFuncAlphaDstFactor: number;
let lastCullFace: boolean;
let lastFrontFaceCCW: boolean;
let lastAlphaToCoverage: boolean;

function setWebGLParameters(material: Material, gl: WebGLRenderingContext) {
  setCull(material, gl);
  setBlendSettings(material, gl);
  setAlphaToCoverage(material, gl);
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
      material.blendEquationMode.index,
      material.blendEquationModeAlpha.index,
      gl
    );
    setBlendFuncSrcFactor(
      material.blendFuncSrcFactor.index,
      material.blendFuncDstFactor.index,
      material.blendFuncAlphaSrcFactor.index,
      material.blendFuncAlphaDstFactor.index,
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

function differentWithLastBlendEquation(equationMode: number, equationModeAlpha: number) {
  const result =
    lastBlendEquationMode !== equationMode || lastBlendEquationModeAlpha !== equationModeAlpha;
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
    lastBlendFuncSrcFactor !== srcFactor ||
    lastBlendFuncDstFactor !== dstFactor ||
    lastBlendFuncAlphaSrcFactor !== alphaSrcFactor ||
    lastBlendFuncAlphaDstFactor !== alphaDstFactor;
  return result;
}

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

function startDepthMasking(primitive: Primitive, gl: WebGLRenderingContext) {
  if (MeshRendererComponent.isDepthMaskTrueForTransparencies) {
    return;
  }
  if (primitive._sortkey === MeshRendererComponent._firstTransparentSortKey) {
    gl.depthMask(false);
  }
}

function endDepthMasking(primitive: Primitive, gl: WebGLRenderingContext) {
  if (primitive._sortkey === MeshRendererComponent._lastTransparentSortKey) {
    gl.depthMask(true);
  }
}

function updateVBOAndVAO(mesh: Mesh) {
  const primitiveNum = mesh.getPrimitiveNumber();
  for (let i = 0; i < primitiveNum; i++) {
    const primitive = mesh.getPrimitiveAt(i);
    if (Is.exist(primitive.vertexHandles)) {
      primitive.update3DAPIVertexData();
    } else {
      primitive.create3DAPIVertexData();
    }
  }
  mesh.updateVariationVBO();
  mesh.updateVAO();
}

function isMaterialsSetup(meshComponent: MeshComponent) {
  if (meshComponent.mesh!._variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
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

function getViewport(renderPass: RenderPass) {
  const webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  let viewport = renderPass.getViewport() as Vector4;
  if (viewport == null) {
    viewport = webglResourceRepository.currentWebGLContextWrapper!.defaultViewport;
  }
  return viewport!;
}

function setVRViewport(renderPass: RenderPass, displayIdx: Index) {
  const webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
  const webxrSystem = rnXRModule.WebXRSystem.getInstance();
  if (webxrSystem.isWebXRMode) {
    webglResourceRepository.setViewport(webxrSystem._getViewportAt(displayIdx));
  }
}

function getDisplayNumber(isVRMainPass: boolean): 1 | 2 {
  if (isVRMainPass) {
    return 2;
  } else {
    return 1;
  }
}

function isVrMainPass(renderPass: RenderPass) {
  const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
  const isVRMainPass =
    rnXRModule?.WebXRSystem.getInstance().isWebXRMode && renderPass.isVrRendering;
  return isVRMainPass;
}

function getPointSpriteShaderSemanticsInfoArray() {
  return [
    {
      semantic: ShaderSemantics.PointSize,
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(30.0),
      min: 0,
      max: Number.MAX_VALUE,
      isCustomSetting: false,
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
    },
    {
      semantic: ShaderSemantics.PointDistanceAttenuation,
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
      min: 0,
      max: 1,
      isCustomSetting: false,
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
    },
  ];
}

export function setupShaderProgramForMeshComponent(
  webglStrategy: WebGLStrategy,
  meshComponent: MeshComponent
): void {
  if (meshComponent.mesh == null) {
    MeshComponent.alertNoMeshSet(meshComponent);
    return;
  }

  const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
  for (let i = 0; i < primitiveNum; i++) {
    const primitive = meshComponent.mesh.getPrimitiveAt(i);
    const material = primitive.material;
    if (material == null || material.isEmptyMaterial()) {
      continue;
    }

    if (material.isShaderProgramReady()) {
      continue;
    }

    const repo = CGAPIResourceRepository.getCgApiResourceRepository();
    const glw = repo.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    const isPointSprite = primitive.primitiveMode.index === gl.POINTS;

    try {
      webglStrategy.setupShaderForMaterial(material);
      primitive._backupMaterial();
    } catch (e) {
      console.log(e);
      primitive._restoreMaterial();
      webglStrategy.setupShaderForMaterial(primitive._prevMaterial);
    }
  }
}

export default Object.freeze({
  setWebGLParameters,
  startDepthMasking,
  endDepthMasking,
  updateVBOAndVAO,
  isMaterialsSetup,
  setVRViewport,
  getDisplayNumber,
  isVrMainPass,
  getPointSpriteShaderSemanticsInfoArray,
});
