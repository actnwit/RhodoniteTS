// src/foundation/helpers/materials/createNodeBasedRaymarchingMaterials.ts
import { RaymarchingShaderPart } from "../../../webgl/shaders/RaymarchingShaderPart.js";
import {
  RaymarchingShadowShaderPart
} from "../../../webgl/shaders/RaymarchingShadowShaderPart.js";
import { WellKnownComponentTIDs } from "../../components/WellKnownComponentTIDs.js";
import { TextureParameter } from "../../definitions/index.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { ShaderGraphResolver } from "../../materials/core/ShaderGraphResolver.js";
import { Matrix44 } from "../../math/Matrix44.js";
import { Scalar } from "../../math/Scalar.js";
import { Vector2 } from "../../math/Vector2.js";
import { Vector3 } from "../../math/Vector3.js";
import { Vector4 } from "../../math/Vector4.js";
import { getSharedSampler } from "../../textures/Sampler.js";
import {
  addBackBufferTextureSemanticInfo,
  addPbrSheenSemanticInfo,
  buildTextureSemanticInfo,
  reuseOrRecreateCustomMaterial
} from "./nodeBasedMaterialCommon.js";
function addRaymarchingPbrSemanticInfo(additionalShaderSemanticInfo) {
  additionalShaderSemanticInfo.push({
    semantic: "raymarchingBaseColor",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec4,
    stage: ShaderType.PixelShader,
    initialValue: Vector4.fromCopy4(0.8, 0.8, 0.8, 1),
    min: 0,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "raymarchingMetallic",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(0),
    min: 0,
    max: 1
  });
  additionalShaderSemanticInfo.push({
    semantic: "raymarchingRoughness",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(0.5),
    min: 0,
    max: 1
  });
  additionalShaderSemanticInfo.push({
    semantic: "raymarchingEmissive",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec3,
    stage: ShaderType.PixelShader,
    initialValue: Vector3.fromCopy3(0, 0, 0),
    min: 0,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "raymarchingEmissiveStrength",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(1),
    min: 0,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "raymarchingIor",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(1.5),
    min: 0,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "raymarchingSpecularWeight",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(1),
    min: 0,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "raymarchingSpecularColor",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec3,
    stage: ShaderType.PixelShader,
    initialValue: Vector3.fromCopy3(1, 1, 1),
    min: 0,
    max: Number.MAX_VALUE
  });
}
function addRaymarchingPbrIblSemanticInfo(engine, additionalShaderSemanticInfo) {
  const cubeSampler = getSharedSampler(engine, {
    minFilter: TextureParameter.LinearMipmapLinear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
    wrapR: TextureParameter.ClampToEdge
  });
  const stage = ShaderType.VertexAndPixelShader;
  additionalShaderSemanticInfo.push({
    semantic: "diffuseEnvTexture",
    componentType: ComponentType.Int,
    compositionType: CompositionType.TextureCube,
    stage,
    initialValue: [-1, engine.dummyTextures.dummyBlackCubeTexture, cubeSampler],
    min: 0,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "specularEnvTexture",
    componentType: ComponentType.Int,
    compositionType: CompositionType.TextureCube,
    stage,
    initialValue: [-1, engine.dummyTextures.dummyBlackCubeTexture, cubeSampler],
    min: 0,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "inverseEnvironment",
    componentType: ComponentType.Bool,
    compositionType: CompositionType.Scalar,
    stage,
    initialValue: Scalar.fromCopyNumber(0),
    min: 0,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "iblParameter",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec4,
    stage,
    initialValue: Vector4.fromCopy4(1, 0, 0, 0),
    min: 0,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "hdriFormat",
    componentType: ComponentType.Int,
    compositionType: CompositionType.Vec2,
    stage,
    initialValue: Vector2.fromCopy2(0, 0),
    min: 0,
    max: Number.MAX_VALUE
  });
}
function addRaymarchingComponentSemanticsInfo(shaderNodeJson) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H;
  const additionalShaderSemanticInfo = [];
  const addedSemantics = /* @__PURE__ */ new Set();
  for (const node of shaderNodeJson.nodes) {
    if (node.name === "SdApplyWorldMatrix" && node.controls.name.value) {
      if (addedSemantics.has(node.controls.name.value)) {
        continue;
      }
      addedSemantics.add(node.controls.name.value);
      additionalShaderSemanticInfo.push({
        semantic: node.controls.name.value,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Mat4,
        stage: ShaderType.PixelShader,
        initialValue: Matrix44.fromCopy16RowMajor(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1),
        min: 0,
        max: Number.MAX_VALUE
      });
    }
    if (node.name === "RaymarchObjectIdUniform" && ((_b = (_a = node.controls) == null ? void 0 : _a.name) == null ? void 0 : _b.value)) {
      if (addedSemantics.has(node.controls.name.value)) {
        continue;
      }
      addedSemantics.add(node.controls.name.value);
      additionalShaderSemanticInfo.push({
        semantic: node.controls.name.value,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: Number.MAX_VALUE
      });
    }
    const uniformName = (_d = (_c = node.controls) == null ? void 0 : _c.name) == null ? void 0 : _d.value;
    if (typeof uniformName === "string" && uniformName.length > 0) {
      if (node.name === "UniformScalarFloat" && !addedSemantics.has(uniformName)) {
        addedSemantics.add(uniformName);
        additionalShaderSemanticInfo.push({
          semantic: uniformName,
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.PixelShader,
          initialValue: Scalar.fromCopyNumber((_g = (_f = (_e = node.controls) == null ? void 0 : _e.initialValue) == null ? void 0 : _f.value) != null ? _g : 0),
          min: 0,
          max: Number.MAX_VALUE
        });
      } else if (node.name === "UniformVector2Float" && !addedSemantics.has(uniformName)) {
        addedSemantics.add(uniformName);
        additionalShaderSemanticInfo.push({
          semantic: uniformName,
          componentType: ComponentType.Float,
          compositionType: CompositionType.Vec2,
          stage: ShaderType.PixelShader,
          initialValue: Vector2.fromCopy2((_j = (_i = (_h = node.controls) == null ? void 0 : _h.initialX) == null ? void 0 : _i.value) != null ? _j : 0, (_m = (_l = (_k = node.controls) == null ? void 0 : _k.initialY) == null ? void 0 : _l.value) != null ? _m : 0),
          min: 0,
          max: Number.MAX_VALUE
        });
      } else if (node.name === "UniformVector3Float" && !addedSemantics.has(uniformName)) {
        addedSemantics.add(uniformName);
        additionalShaderSemanticInfo.push({
          semantic: uniformName,
          componentType: ComponentType.Float,
          compositionType: CompositionType.Vec3,
          stage: ShaderType.PixelShader,
          initialValue: Vector3.fromCopy3(
            (_p = (_o = (_n = node.controls) == null ? void 0 : _n.initialX) == null ? void 0 : _o.value) != null ? _p : 0,
            (_s = (_r = (_q = node.controls) == null ? void 0 : _q.initialY) == null ? void 0 : _r.value) != null ? _s : 0,
            (_v = (_u = (_t = node.controls) == null ? void 0 : _t.initialZ) == null ? void 0 : _u.value) != null ? _v : 0
          ),
          min: 0,
          max: Number.MAX_VALUE
        });
      } else if (node.name === "UniformVector4Float" && !addedSemantics.has(uniformName)) {
        addedSemantics.add(uniformName);
        additionalShaderSemanticInfo.push({
          semantic: uniformName,
          componentType: ComponentType.Float,
          compositionType: CompositionType.Vec4,
          stage: ShaderType.PixelShader,
          initialValue: Vector4.fromCopy4(
            (_y = (_x = (_w = node.controls) == null ? void 0 : _w.initialX) == null ? void 0 : _x.value) != null ? _y : 0,
            (_B = (_A = (_z = node.controls) == null ? void 0 : _z.initialY) == null ? void 0 : _A.value) != null ? _B : 0,
            (_E = (_D = (_C = node.controls) == null ? void 0 : _C.initialZ) == null ? void 0 : _D.value) != null ? _E : 0,
            (_H = (_G = (_F = node.controls) == null ? void 0 : _F.initialW) == null ? void 0 : _G.value) != null ? _H : 1
          ),
          min: 0,
          max: Number.MAX_VALUE
        });
      }
    }
  }
  return additionalShaderSemanticInfo;
}
function addRaymarchingAabbSemanticInfo(additionalShaderSemanticInfo) {
  const unbounded = 1e20;
  additionalShaderSemanticInfo.push({
    semantic: "raymarchAabbMin",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec3,
    stage: ShaderType.PixelShader,
    initialValue: Vector3.fromCopy3(-unbounded, -unbounded, -unbounded),
    min: -Number.MAX_VALUE,
    max: Number.MAX_VALUE
  });
  additionalShaderSemanticInfo.push({
    semantic: "raymarchAabbMax",
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec3,
    stage: ShaderType.PixelShader,
    initialValue: Vector3.fromCopy3(unbounded, unbounded, unbounded),
    min: -Number.MAX_VALUE,
    max: Number.MAX_VALUE
  });
}
function detectRaymarchingPbrFeatures(shaderNodeJson) {
  const nodes = shaderNodeJson.nodes;
  const connections = shaderNodeJson.connections;
  if (nodes == null || connections == null) {
    return {
      useNormalTexture: false,
      isOcclusion: false,
      isClearcoat: false,
      isSheen: false,
      isIridescence: false,
      isAnisotropy: false,
      isDiffuseTransmission: false,
      isSpecular: false,
      isTransmission: false,
      isVolume: false,
      isDispersion: false
    };
  }
  const findNode = (name) => nodes.find((node) => node.name === name);
  const isConnectedTo = (targetNodeId, portName) => connections.find((connection) => connection.to.id === targetNodeId && connection.to.portName === portName);
  const pbrShaderNode = findNode("PbrShader");
  const normalPropsNode = findNode("PbrNormalProps");
  const isPropsConnected = (sourceName, portName) => {
    var _a;
    if (pbrShaderNode == null) return false;
    const connection = isConnectedTo(pbrShaderNode.id, portName);
    if (connection == null) return false;
    return ((_a = nodes.find((node) => node.id === connection.from.id)) == null ? void 0 : _a.name) === sourceName;
  };
  const useNormalTexture = (() => {
    var _a;
    if (pbrShaderNode == null || normalPropsNode == null) return false;
    const normalConnection = isConnectedTo(normalPropsNode.id, "normalTexture");
    if (normalConnection == null) return false;
    const sourceNode = nodes.find((node) => node.id === normalConnection.from.id);
    if ((sourceNode == null ? void 0 : sourceNode.name) !== "Texture2D") return false;
    return ((_a = isConnectedTo(pbrShaderNode.id, "normalInWorld")) == null ? void 0 : _a.from.id) === normalPropsNode.id;
  })();
  const isOcclusion = isPropsConnected("PbrOcclusionProps", "occlusionProps");
  const isClearcoat = isPropsConnected("PbrClearcoatProps", "clearcoatProps");
  const isSheen = isPropsConnected("PbrSheenProps", "sheenProps");
  const isIridescence = isPropsConnected("PbrIridescenceProps", "iridescenceProps");
  const isAnisotropy = isPropsConnected("PbrAnisotropyProps", "anisotropyProps");
  const isDiffuseTransmission = isPropsConnected("PbrDiffuseTransmissionProps", "diffuseTransmissionProps");
  const isSpecular = isPropsConnected("PbrSpecularProps", "specularProps");
  const isVolume = isPropsConnected("PbrVolumeProps", "volumeProps");
  const isTransmission = pbrShaderNode != null && isConnectedTo(pbrShaderNode.id, "transmission") != null;
  const isDispersion = pbrShaderNode != null && isConnectedTo(pbrShaderNode.id, "dispersion") != null;
  return {
    useNormalTexture,
    isOcclusion,
    isClearcoat,
    isSheen,
    isIridescence,
    isAnisotropy,
    isDiffuseTransmission,
    isSpecular,
    isTransmission,
    isVolume,
    isDispersion
  };
}
function createNodeBasedRaymarchingCustomMaterial(engine, shaderNodeJson, currentMaterial) {
  const raymarchingShaderPart = new RaymarchingShaderPart();
  const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(engine, shaderNodeJson, raymarchingShaderPart);
  if (!shaderCode) {
    return void 0;
  }
  const additionalShaderSemanticInfo = addRaymarchingComponentSemanticsInfo(shaderNodeJson);
  addRaymarchingAabbSemanticInfo(additionalShaderSemanticInfo);
  addRaymarchingPbrIblSemanticInfo(engine, additionalShaderSemanticInfo);
  addRaymarchingPbrSemanticInfo(additionalShaderSemanticInfo);
  additionalShaderSemanticInfo.push(...buildTextureSemanticInfo(engine, shaderCode.textureInfos));
  const pbrFeatures = detectRaymarchingPbrFeatures(shaderNodeJson);
  if (pbrFeatures.isSheen) {
    addPbrSheenSemanticInfo(engine, additionalShaderSemanticInfo, { sheenEnvIsInternalSetting: false });
  }
  if (pbrFeatures.isTransmission) {
    if (!additionalShaderSemanticInfo.some((info) => info.semantic === "backBufferTexture")) {
      addBackBufferTextureSemanticInfo(engine, additionalShaderSemanticInfo, ShaderType.PixelShader);
    }
  }
  const material = reuseOrRecreateCustomMaterial(
    engine,
    shaderCode.vertexShader,
    shaderCode.pixelShader,
    {
      isLighting: true,
      isPbr: true,
      // The raymarching material receives shadows from mesh casters. ForwardRenderPipeline
      // feeds the shadow maps/parameters to it because it is not attached to a primitive.
      isShadow: true,
      useNormalTexture: pbrFeatures.useNormalTexture,
      isOcclusion: pbrFeatures.isOcclusion,
      isClearcoat: pbrFeatures.isClearcoat,
      isSheen: pbrFeatures.isSheen,
      isIridescence: pbrFeatures.isIridescence,
      isAnisotropy: pbrFeatures.isAnisotropy,
      isDiffuseTransmission: pbrFeatures.isDiffuseTransmission,
      isSpecular: pbrFeatures.isSpecular,
      isTransmission: pbrFeatures.isTransmission,
      isVolume: pbrFeatures.isVolume,
      isDispersion: pbrFeatures.isDispersion,
      additionalShaderSemanticInfo
    },
    currentMaterial
  );
  material.shaderNodeJson = shaderNodeJson;
  return {
    material,
    hasPbrShaderNode: false,
    hasClassicShaderNode: false
  };
}
function createNodeBasedRaymarchingShadowMaterials(engine, shaderNodeJson, currentMaterials) {
  const regular = createNodeBasedRaymarchingShadowMaterial(
    engine,
    shaderNodeJson,
    "regular",
    currentMaterials == null ? void 0 : currentMaterials.regular
  );
  const paraboloidFront = createNodeBasedRaymarchingShadowMaterial(
    engine,
    shaderNodeJson,
    "paraboloidFront",
    currentMaterials == null ? void 0 : currentMaterials.paraboloidFront
  );
  const paraboloidBack = createNodeBasedRaymarchingShadowMaterial(
    engine,
    shaderNodeJson,
    "paraboloidBack",
    currentMaterials == null ? void 0 : currentMaterials.paraboloidBack
  );
  if (regular == null || paraboloidFront == null || paraboloidBack == null) {
    return void 0;
  }
  return { regular, paraboloidFront, paraboloidBack };
}
function createNodeBasedRaymarchingShadowMaterial(engine, shaderNodeJson, kind, currentMaterial) {
  const shaderPart = new RaymarchingShadowShaderPart(kind);
  const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(engine, shaderNodeJson, shaderPart, [
    "outDistance",
    "outUnion"
  ]);
  if (!shaderCode) {
    return void 0;
  }
  const additionalShaderSemanticInfo = addRaymarchingComponentSemanticsInfo(shaderNodeJson);
  addRaymarchingAabbSemanticInfo(additionalShaderSemanticInfo);
  additionalShaderSemanticInfo.push(...buildTextureSemanticInfo(engine, shaderCode.textureInfos));
  if (kind !== "regular") {
    additionalShaderSemanticInfo.push({
      semantic: "lightIndex",
      componentType: ComponentType.Int,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(0),
      min: 0,
      max: Number.MAX_VALUE
    });
    additionalShaderSemanticInfo.push({
      semantic: "shadowFarPlane",
      componentType: ComponentType.Float,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(1e3),
      min: 0,
      max: Number.MAX_VALUE
    });
  }
  const material = reuseOrRecreateCustomMaterial(
    engine,
    shaderCode.vertexShader,
    shaderCode.pixelShader,
    {
      isLighting: false,
      isPbr: false,
      isShadow: false,
      additionalShaderSemanticInfo
    },
    currentMaterial
  );
  if (kind === "paraboloidFront") {
    material.colorWriteMask = [true, true, false, false];
  } else if (kind === "paraboloidBack") {
    material.colorWriteMask = [false, false, true, true];
  } else {
    material.colorWriteMask = [true, true, false, false];
  }
  material.shaderNodeJson = shaderNodeJson;
  return material;
}
function collectRrnJson(engine, { castShadowOnly = false } = {}) {
  var _a, _b, _c, _d, _e, _f;
  const collectedRrnJson = {
    nodes: [],
    connections: []
  };
  const raymarchingComponents = engine.componentRepository.getComponentsWithTID(
    WellKnownComponentTIDs.RaymarchingComponentTID
  );
  for (const component of raymarchingComponents) {
    const raymarchingComponent = component;
    if (castShadowOnly && !raymarchingComponent.castShadow) {
      continue;
    }
    const rrnJson = raymarchingComponent.rrnJson;
    const prefix = `comp${raymarchingComponent.componentSID}_`;
    const prefixedNodes = rrnJson.nodes.map((node) => {
      const newNode = { ...node, id: `${prefix}${node.id}` };
      if (node.inputs) {
        newNode.inputs = {};
        for (const [key, input] of Object.entries(node.inputs)) {
          newNode.inputs[key] = { ...input, id: `${prefix}${input.id}` };
        }
      }
      if (node.outputs) {
        newNode.outputs = {};
        for (const [key, output] of Object.entries(node.outputs)) {
          newNode.outputs[key] = { ...output, id: `${prefix}${output.id}` };
        }
      }
      return newNode;
    });
    const uniformNodeNames = /* @__PURE__ */ new Set([
      "UniformScalarFloat",
      "UniformVector2Float",
      "UniformVector3Float",
      "UniformVector4Float"
    ]);
    for (const node of prefixedNodes) {
      if (uniformNodeNames.has(node.name)) {
        const name = (_b = (_a = node.controls) == null ? void 0 : _a.name) == null ? void 0 : _b.value;
        if (typeof name === "string" && name.length > 0) {
          node.controls = {
            ...(_c = node.controls) != null ? _c : {},
            name: { value: `${name}_${raymarchingComponent.componentSID}` }
          };
        }
      }
    }
    const prefixedConnections = rrnJson.connections.map((conn) => ({
      ...conn,
      id: `${prefix}${conn.id}`,
      from: { ...conn.from, id: `${prefix}${conn.from.id}` },
      to: { ...conn.to, id: `${prefix}${conn.to.id}` }
    }));
    const objectIdNodeId = `${prefix}__raymarchObjectId`;
    const objectIdOutputId = `${prefix}__raymarchObjectIdOut`;
    const terminalsWithoutObjectId = prefixedNodes.filter(
      (node) => (node.name === "OutUnion" || node.name === "OutDistance") && !prefixedConnections.some((connection) => connection.to.id === node.id && connection.to.portName === "objectId")
    );
    if (terminalsWithoutObjectId.length > 0) {
      prefixedNodes.push({
        id: objectIdNodeId,
        name: "RaymarchObjectIdUniform",
        outputs: {
          out1: { id: objectIdOutputId, label: "Out Object Id", socket: { name: "Scalar<float>" } }
        },
        inputs: {},
        controls: { name: { value: `raymarchObjectId_${raymarchingComponent.componentSID}` } },
        position: { x: 0, y: 0 }
      });
      for (const terminal of terminalsWithoutObjectId) {
        prefixedConnections.push({
          id: `${prefix}__raymarchObjectId_${terminal.id}`,
          from: { id: objectIdNodeId, portName: "out1" },
          to: { id: terminal.id, portName: "objectId" }
        });
      }
    }
    const worldMatrixUniformNames = [];
    for (const node of prefixedNodes) {
      if (node.name === "SdApplyWorldMatrix") {
        const name = (_e = (_d = node.controls) == null ? void 0 : _d.name) == null ? void 0 : _e.value;
        if (typeof name === "string" && name.length > 0) {
          worldMatrixUniformNames.push(name);
        }
      }
    }
    if (worldMatrixUniformNames.length > 0) {
      for (const node of prefixedNodes) {
        if (node.name !== "OutUnion" && node.name !== "OutDistance") {
          continue;
        }
        node.controls = {
          ...(_f = node.controls) != null ? _f : {},
          distanceCorrectionMatrices: { value: [...worldMatrixUniformNames] }
        };
      }
    }
    collectedRrnJson.nodes.push(...prefixedNodes);
    collectedRrnJson.connections.push(...prefixedConnections);
  }
  return collectedRrnJson;
}
var RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC = "raymarchingWorldMatrix";
function createRaymarchingComponentShaderJson(component) {
  var _a, _b;
  const json = JSON.parse(JSON.stringify(component.rrnJson));
  let usesWorldMatrix = false;
  for (const node of json.nodes) {
    if (node.name === "SdApplyWorldMatrix") {
      node.controls = {
        ...(_a = node.controls) != null ? _a : {},
        name: { value: RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC }
      };
      usesWorldMatrix = true;
    }
  }
  if (usesWorldMatrix) {
    for (const node of json.nodes) {
      if (node.name === "OutUnion" || node.name === "OutDistance") {
        node.controls = {
          ...(_b = node.controls) != null ? _b : {},
          distanceCorrectionMatrices: { value: [RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC] }
        };
      }
    }
  }
  return json;
}
function createNodeBasedRaymarchingComponentMaterial(engine, component, currentMaterial) {
  const json = createRaymarchingComponentShaderJson(component);
  return createNodeBasedRaymarchingCustomMaterial(engine, json, currentMaterial);
}
function createNodeBasedRaymarchingComponentShadowMaterial(engine, component, kind, currentMaterial) {
  const json = createRaymarchingComponentShaderJson(component);
  return createNodeBasedRaymarchingShadowMaterial(engine, json, kind, currentMaterial);
}
export {
  RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC,
  addRaymarchingAabbSemanticInfo,
  addRaymarchingComponentSemanticsInfo,
  addRaymarchingPbrIblSemanticInfo,
  addRaymarchingPbrSemanticInfo,
  collectRrnJson,
  createNodeBasedRaymarchingComponentMaterial,
  createNodeBasedRaymarchingComponentShadowMaterial,
  createNodeBasedRaymarchingCustomMaterial,
  createNodeBasedRaymarchingShadowMaterial,
  createNodeBasedRaymarchingShadowMaterials,
  createRaymarchingComponentShaderJson,
  detectRaymarchingPbrFeatures
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlTm9kZUJhc2VkUmF5bWFyY2hpbmdNYXRlcmlhbHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgTm9kZUpTT04gfSBmcm9tICcuLi8uLi8uLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IFNoYWRlck5vZGVKc29uIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvU2hhZGVyTm9kZUpzb24nO1xuaW1wb3J0IHsgUmF5bWFyY2hpbmdTaGFkZXJQYXJ0IH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvc2hhZGVycy9SYXltYXJjaGluZ1NoYWRlclBhcnQnO1xuaW1wb3J0IHtcbiAgUmF5bWFyY2hpbmdTaGFkb3dTaGFkZXJQYXJ0LFxuICB0eXBlIFJheW1hcmNoaW5nU2hhZG93U2hhZGVyUGFydEtpbmQsXG59IGZyb20gJy4uLy4uLy4uL3dlYmdsL3NoYWRlcnMvUmF5bWFyY2hpbmdTaGFkb3dTaGFkZXJQYXJ0JztcbmltcG9ydCB0eXBlIHsgUmF5bWFyY2hpbmdDb21wb25lbnQgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL1JheW1hcmNoaW5nL1JheW1hcmNoaW5nQ29tcG9uZW50JztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL1dlbGxLbm93bkNvbXBvbmVudFRJRHMnO1xuaW1wb3J0IHsgVGV4dHVyZVBhcmFtZXRlciB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgdHlwZSB7IFNoYWRlclNlbWFudGljc0luZm8gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3NJbmZvJztcbmltcG9ydCB7IFNoYWRlclR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9TaGFkZXJUeXBlJztcbmltcG9ydCB0eXBlIHsgTWF0ZXJpYWwgfSBmcm9tICcuLi8uLi9tYXRlcmlhbHMvY29yZS9NYXRlcmlhbCc7XG5pbXBvcnQgeyBTaGFkZXJHcmFwaFJlc29sdmVyIH0gZnJvbSAnLi4vLi4vbWF0ZXJpYWxzL2NvcmUvU2hhZGVyR3JhcGhSZXNvbHZlcic7XG5pbXBvcnQgeyBNYXRyaXg0NCB9IGZyb20gJy4uLy4uL21hdGgvTWF0cml4NDQnO1xuaW1wb3J0IHsgU2NhbGFyIH0gZnJvbSAnLi4vLi4vbWF0aC9TY2FsYXInO1xuaW1wb3J0IHsgVmVjdG9yMiB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yMic7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjQnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IGdldFNoYXJlZFNhbXBsZXIgfSBmcm9tICcuLi8uLi90ZXh0dXJlcy9TYW1wbGVyJztcbmltcG9ydCB7XG4gIGFkZEJhY2tCdWZmZXJUZXh0dXJlU2VtYW50aWNJbmZvLFxuICBhZGRQYnJTaGVlblNlbWFudGljSW5mbyxcbiAgYnVpbGRUZXh0dXJlU2VtYW50aWNJbmZvLFxuICB0eXBlIE5vZGVCYXNlZE1hdGVyaWFsUmVzdWx0LFxuICByZXVzZU9yUmVjcmVhdGVDdXN0b21NYXRlcmlhbCxcbn0gZnJvbSAnLi9ub2RlQmFzZWRNYXRlcmlhbENvbW1vbic7XG5cbi8qKlxuICogQWRkcyB0aGUgbWF0ZXJpYWwgcGFyYW1ldGVycyB1c2VkIGJ5IHRoZSBmaXhlZCBQQlIgc2hhZGluZyBvZiB0aGUgcmF5bWFyY2hpbmdcbiAqIG1hdGVyaWFsIChiYXNlIGNvbG9yLCBtZXRhbGxpYywgcm91Z2huZXNzLCBlbWlzc2l2ZSBhbmQgdGhlIHNwZWN1bGFyL0YwIHRlcm1zKS5cbiAqXG4gKiBAcGFyYW0gYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mbyAtIEFycmF5IHRvIGFkZCBzZW1hbnRpYyBpbmZvIHRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRSYXltYXJjaGluZ1BiclNlbWFudGljSW5mbyhhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvW10pIHtcbiAgYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mby5wdXNoKHtcbiAgICBzZW1hbnRpYzogJ3JheW1hcmNoaW5nQmFzZUNvbG9yJyxcbiAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzQsXG4gICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgaW5pdGlhbFZhbHVlOiBWZWN0b3I0LmZyb21Db3B5NCgwLjgsIDAuOCwgMC44LCAxLjApLFxuICAgIG1pbjogMCxcbiAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUsXG4gIH0pO1xuICBhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvLnB1c2goe1xuICAgIHNlbWFudGljOiAncmF5bWFyY2hpbmdNZXRhbGxpYycsXG4gICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIoMC4wKSxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICB9KTtcbiAgYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mby5wdXNoKHtcbiAgICBzZW1hbnRpYzogJ3JheW1hcmNoaW5nUm91Z2huZXNzJyxcbiAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICBpbml0aWFsVmFsdWU6IFNjYWxhci5mcm9tQ29weU51bWJlcigwLjUpLFxuICAgIG1pbjogMCxcbiAgICBtYXg6IDEsXG4gIH0pO1xuICBhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvLnB1c2goe1xuICAgIHNlbWFudGljOiAncmF5bWFyY2hpbmdFbWlzc2l2ZScsXG4gICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgIGluaXRpYWxWYWx1ZTogVmVjdG9yMy5mcm9tQ29weTMoMC4wLCAwLjAsIDAuMCksXG4gICAgbWluOiAwLFxuICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG4gIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgc2VtYW50aWM6ICdyYXltYXJjaGluZ0VtaXNzaXZlU3RyZW5ndGgnLFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDEuMCksXG4gICAgbWluOiAwLFxuICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG4gIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgc2VtYW50aWM6ICdyYXltYXJjaGluZ0lvcicsXG4gICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIoMS41KSxcbiAgICBtaW46IDAsXG4gICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxuICB9KTtcbiAgYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mby5wdXNoKHtcbiAgICBzZW1hbnRpYzogJ3JheW1hcmNoaW5nU3BlY3VsYXJXZWlnaHQnLFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDEuMCksXG4gICAgbWluOiAwLFxuICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG4gIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgc2VtYW50aWM6ICdyYXltYXJjaGluZ1NwZWN1bGFyQ29sb3InLFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICBpbml0aWFsVmFsdWU6IFZlY3RvcjMuZnJvbUNvcHkzKDEuMCwgMS4wLCAxLjApLFxuICAgIG1pbjogMCxcbiAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUsXG4gIH0pO1xufVxuXG4vKipcbiAqIEFkZHMgdGhlIElCTCBzZW1hbnRpY3MgdXNlZCBieSB0aGUgUEJSIHNoYWRpbmcgb2YgdGhlIHJheW1hcmNoaW5nIG1hdGVyaWFsLlxuICpcbiAqIFVubGlrZSB0aGUgbWVzaCBtYXRlcmlhbCBJQkwgc2VtYW50aWNzLCB0aGVzZSBhcmUgbm90IGludGVybmFsIHNldHRpbmdzOiB0aGVcbiAqIHJheW1hcmNoaW5nIGZ1bGwtc2NyZWVuIGRyYXcgaGFzIG5vIG1lc2ggcmVuZGVyZXIgY29tcG9uZW50LCBzbyB0aGUgcGlwZWxpbmVcbiAqIHNldHMgdGhlIGVudmlyb25tZW50IHRleHR1cmVzIGFuZCBwYXJhbWV0ZXJzIG9uIHRoZSBtYXRlcmlhbCBkaXJlY3RseSBhbmQgdGhlXG4gKiBnZW5lcmljIHBlci1tYXRlcmlhbCB1cGxvYWQgcGF0aCBoYXMgdG8gc2VlIHRoZW0uXG4gKlxuICogVGhlIHRyYW5zbWlzc2lvbiBiYWNrIGJ1ZmZlciB0ZXh0dXJlIGlzIGludGVudGlvbmFsbHkgb21pdHRlZCAodW51c2VkIHdpdGhvdXRcbiAqIFJOX1VTRV9UUkFOU01JU1NJT04pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUmF5bWFyY2hpbmdQYnJJYmxTZW1hbnRpY0luZm8oZW5naW5lOiBFbmdpbmUsIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm86IFNoYWRlclNlbWFudGljc0luZm9bXSkge1xuICBjb25zdCBjdWJlU2FtcGxlciA9IGdldFNoYXJlZFNhbXBsZXIoZW5naW5lLCB7XG4gICAgbWluRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhck1pcG1hcExpbmVhcixcbiAgICBtYWdGaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgIHdyYXBTOiBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlLFxuICAgIHdyYXBUOiBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlLFxuICAgIHdyYXBSOiBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlLFxuICB9KTtcbiAgY29uc3Qgc3RhZ2UgPSBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyO1xuXG4gIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgc2VtYW50aWM6ICdkaWZmdXNlRW52VGV4dHVyZScsXG4gICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5JbnQsXG4gICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVGV4dHVyZUN1YmUsXG4gICAgc3RhZ2UsXG4gICAgaW5pdGlhbFZhbHVlOiBbLTEsIGVuZ2luZS5kdW1teVRleHR1cmVzLmR1bW15QmxhY2tDdWJlVGV4dHVyZSwgY3ViZVNhbXBsZXJdLFxuICAgIG1pbjogMCxcbiAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUsXG4gIH0pO1xuICBhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvLnB1c2goe1xuICAgIHNlbWFudGljOiAnc3BlY3VsYXJFbnZUZXh0dXJlJyxcbiAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkludCxcbiAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlQ3ViZSxcbiAgICBzdGFnZSxcbiAgICBpbml0aWFsVmFsdWU6IFstMSwgZW5naW5lLmR1bW15VGV4dHVyZXMuZHVtbXlCbGFja0N1YmVUZXh0dXJlLCBjdWJlU2FtcGxlcl0sXG4gICAgbWluOiAwLFxuICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG4gIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgc2VtYW50aWM6ICdpbnZlcnNlRW52aXJvbm1lbnQnLFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuQm9vbCxcbiAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgc3RhZ2UsXG4gICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIoMCksXG4gICAgbWluOiAwLFxuICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG4gIC8vIHkgYW5kIHogYXJlIHRoZSBkaWZmdXNlL3NwZWN1bGFyIGNvbnRyaWJ1dGlvbnMuIFplcm8gYnkgZGVmYXVsdCBzbyB0aGF0IHRoZVxuICAvLyBJQkwgd29yayBpcyBza2lwcGVkIHVudGlsIHRoZSBwaXBlbGluZSBzdXBwbGllcyBhbiBlbnZpcm9ubWVudC5cbiAgYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mby5wdXNoKHtcbiAgICBzZW1hbnRpYzogJ2libFBhcmFtZXRlcicsXG4gICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgIHN0YWdlLFxuICAgIGluaXRpYWxWYWx1ZTogVmVjdG9yNC5mcm9tQ29weTQoMSwgMCwgMCwgMCksXG4gICAgbWluOiAwLFxuICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG4gIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgc2VtYW50aWM6ICdoZHJpRm9ybWF0JyxcbiAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkludCxcbiAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMyLFxuICAgIHN0YWdlLFxuICAgIGluaXRpYWxWYWx1ZTogVmVjdG9yMi5mcm9tQ29weTIoMCwgMCksXG4gICAgbWluOiAwLFxuICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRSYXltYXJjaGluZ0NvbXBvbmVudFNlbWFudGljc0luZm8oc2hhZGVyTm9kZUpzb246IFNoYWRlck5vZGVKc29uKSB7XG4gIGNvbnN0IGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm86IFNoYWRlclNlbWFudGljc0luZm9bXSA9IFtdO1xuICBjb25zdCBhZGRlZFNlbWFudGljcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IG5vZGUgb2Ygc2hhZGVyTm9kZUpzb24ubm9kZXMpIHtcbiAgICBpZiAobm9kZS5uYW1lID09PSAnU2RBcHBseVdvcmxkTWF0cml4JyAmJiBub2RlLmNvbnRyb2xzLm5hbWUudmFsdWUpIHtcbiAgICAgIC8vIEEgcGVyLWNvbXBvbmVudCBtYXRlcmlhbCBub3JtYWxpemVzIGV2ZXJ5IHdvcmxkIG1hdHJpeCBub2RlIHRvIG9uZSBzZW1hbnRpY1xuICAgICAgLy8gbmFtZSwgc28gdGhlIHNhbWUgbmFtZSBjYW4gYXBwZWFyIG9uIHNldmVyYWwgbm9kZXMgb2YgdGhlIGdyYXBoLlxuICAgICAgaWYgKGFkZGVkU2VtYW50aWNzLmhhcyhub2RlLmNvbnRyb2xzLm5hbWUudmFsdWUpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgYWRkZWRTZW1hbnRpY3MuYWRkKG5vZGUuY29udHJvbHMubmFtZS52YWx1ZSk7XG4gICAgICBhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvLnB1c2goe1xuICAgICAgICBzZW1hbnRpYzogbm9kZS5jb250cm9scy5uYW1lLnZhbHVlLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5NYXQ0LFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBNYXRyaXg0NC5mcm9tQ29weTE2Um93TWFqb3IoMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIE9ubHkgdGhlIGluamVjdGVkIHBlci1jb21wb25lbnQgaWQgbm9kZSBoYXMgYSBuYW1lIGNvbnRyb2w7IHRoZSBzaGFkaW5nIG5vZGVcbiAgICAvLyAodXNlZCBpbiB0aGUgc2hhZGluZyBzZWN0aW9uKSBoYXMgbm9uZS5cbiAgICBpZiAobm9kZS5uYW1lID09PSAnUmF5bWFyY2hPYmplY3RJZFVuaWZvcm0nICYmIG5vZGUuY29udHJvbHM/Lm5hbWU/LnZhbHVlKSB7XG4gICAgICBpZiAoYWRkZWRTZW1hbnRpY3MuaGFzKG5vZGUuY29udHJvbHMubmFtZS52YWx1ZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBhZGRlZFNlbWFudGljcy5hZGQobm9kZS5jb250cm9scy5uYW1lLnZhbHVlKTtcbiAgICAgIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgICAgIHNlbWFudGljOiBub2RlLmNvbnRyb2xzLm5hbWUudmFsdWUsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDApLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBVbmlmb3JtIG5vZGVzIGJlY29tZSBvbmUgbWF0ZXJpYWwgcGFyYW1ldGVyIGVhY2guIEEgcGVyLWNvbXBvbmVudCBtYXRlcmlhbFxuICAgIC8vIGtlZXBzIHRoZSBhdXRob3JlZCBuYW1lLCBzbyB0aGUgZ3JhcGgncyB1bmlmb3JtcyBhcmUgaW5kZXBlbmRlbnQ7IHRoZSBtZXJnZWRcbiAgICAvLyBncmFwaCBwb3N0Zml4ZXMgdGhlbSB3aXRoIHRoZSBjb21wb25lbnQgU0lEIGluIGNvbGxlY3RScm5Kc29uLlxuICAgIGNvbnN0IHVuaWZvcm1OYW1lID0gbm9kZS5jb250cm9scz8ubmFtZT8udmFsdWU7XG4gICAgaWYgKHR5cGVvZiB1bmlmb3JtTmFtZSA9PT0gJ3N0cmluZycgJiYgdW5pZm9ybU5hbWUubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKG5vZGUubmFtZSA9PT0gJ1VuaWZvcm1TY2FsYXJGbG9hdCcgJiYgIWFkZGVkU2VtYW50aWNzLmhhcyh1bmlmb3JtTmFtZSkpIHtcbiAgICAgICAgYWRkZWRTZW1hbnRpY3MuYWRkKHVuaWZvcm1OYW1lKTtcbiAgICAgICAgYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mby5wdXNoKHtcbiAgICAgICAgICBzZW1hbnRpYzogdW5pZm9ybU5hbWUsXG4gICAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIobm9kZS5jb250cm9scz8uaW5pdGlhbFZhbHVlPy52YWx1ZSA/PyAwKSxcbiAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS5uYW1lID09PSAnVW5pZm9ybVZlY3RvcjJGbG9hdCcgJiYgIWFkZGVkU2VtYW50aWNzLmhhcyh1bmlmb3JtTmFtZSkpIHtcbiAgICAgICAgYWRkZWRTZW1hbnRpY3MuYWRkKHVuaWZvcm1OYW1lKTtcbiAgICAgICAgYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mby5wdXNoKHtcbiAgICAgICAgICBzZW1hbnRpYzogdW5pZm9ybU5hbWUsXG4gICAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMyLFxuICAgICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICAgIGluaXRpYWxWYWx1ZTogVmVjdG9yMi5mcm9tQ29weTIobm9kZS5jb250cm9scz8uaW5pdGlhbFg/LnZhbHVlID8/IDAsIG5vZGUuY29udHJvbHM/LmluaXRpYWxZPy52YWx1ZSA/PyAwKSxcbiAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS5uYW1lID09PSAnVW5pZm9ybVZlY3RvcjNGbG9hdCcgJiYgIWFkZGVkU2VtYW50aWNzLmhhcyh1bmlmb3JtTmFtZSkpIHtcbiAgICAgICAgYWRkZWRTZW1hbnRpY3MuYWRkKHVuaWZvcm1OYW1lKTtcbiAgICAgICAgYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mby5wdXNoKHtcbiAgICAgICAgICBzZW1hbnRpYzogdW5pZm9ybU5hbWUsXG4gICAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICAgICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICAgIGluaXRpYWxWYWx1ZTogVmVjdG9yMy5mcm9tQ29weTMoXG4gICAgICAgICAgICBub2RlLmNvbnRyb2xzPy5pbml0aWFsWD8udmFsdWUgPz8gMCxcbiAgICAgICAgICAgIG5vZGUuY29udHJvbHM/LmluaXRpYWxZPy52YWx1ZSA/PyAwLFxuICAgICAgICAgICAgbm9kZS5jb250cm9scz8uaW5pdGlhbFo/LnZhbHVlID8/IDBcbiAgICAgICAgICApLFxuICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChub2RlLm5hbWUgPT09ICdVbmlmb3JtVmVjdG9yNEZsb2F0JyAmJiAhYWRkZWRTZW1hbnRpY3MuaGFzKHVuaWZvcm1OYW1lKSkge1xuICAgICAgICBhZGRlZFNlbWFudGljcy5hZGQodW5pZm9ybU5hbWUpO1xuICAgICAgICBhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvLnB1c2goe1xuICAgICAgICAgIHNlbWFudGljOiB1bmlmb3JtTmFtZSxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzQsXG4gICAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgICAgaW5pdGlhbFZhbHVlOiBWZWN0b3I0LmZyb21Db3B5NChcbiAgICAgICAgICAgIG5vZGUuY29udHJvbHM/LmluaXRpYWxYPy52YWx1ZSA/PyAwLFxuICAgICAgICAgICAgbm9kZS5jb250cm9scz8uaW5pdGlhbFk/LnZhbHVlID8/IDAsXG4gICAgICAgICAgICBub2RlLmNvbnRyb2xzPy5pbml0aWFsWj8udmFsdWUgPz8gMCxcbiAgICAgICAgICAgIG5vZGUuY29udHJvbHM/LmluaXRpYWxXPy52YWx1ZSA/PyAxXG4gICAgICAgICAgKSxcbiAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm87XG59XG5cbi8qKlxuICogQWRkcyB0aGUgd29ybGQtc3BhY2UgQUFCQiBvZiB0aGUgU0RGIHVzZWQgYnkgdGhlIHJheW1hcmNoIGxvb3AgYXMgYSByYXkgaW50ZXJ2YWwuXG4gKlxuICogVGhlIGJvdW5kcyBhcmUgdGhlIGNvbnNlcnZhdGl2ZSB3b3JsZCBBQUJCIG9mIHRoZSBkaXN0YW5jZSBncmFwaC4gVGhlIHBpcGVsaW5lXG4gKiByZXBsYWNlcyB0aGUgZGVmYXVsdHMgKGFuIGVmZmVjdGl2ZWx5IHVuYm91bmRlZCBib3gpIHBlciBjb21wb25lbnQ7IHRoZSBzaGFkZXJcbiAqIG9ubHkgbWFyY2hlcyBpbnNpZGUgdGhlIGludGVydmFsLCBzbyByYXlzIHRoYXQgbWlzcyB0aGUgU0RGIGV4aXQgaW1tZWRpYXRlbHkuXG4gKlxuICogQHBhcmFtIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8gLSBBcnJheSB0byBhZGQgc2VtYW50aWMgaW5mbyB0b1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUmF5bWFyY2hpbmdBYWJiU2VtYW50aWNJbmZvKGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm86IFNoYWRlclNlbWFudGljc0luZm9bXSkge1xuICBjb25zdCB1bmJvdW5kZWQgPSAxZTIwO1xuICBhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvLnB1c2goe1xuICAgIHNlbWFudGljOiAncmF5bWFyY2hBYWJiTWluJyxcbiAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgaW5pdGlhbFZhbHVlOiBWZWN0b3IzLmZyb21Db3B5MygtdW5ib3VuZGVkLCAtdW5ib3VuZGVkLCAtdW5ib3VuZGVkKSxcbiAgICBtaW46IC1OdW1iZXIuTUFYX1ZBTFVFLFxuICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG4gIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgc2VtYW50aWM6ICdyYXltYXJjaEFhYmJNYXgnLFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICBpbml0aWFsVmFsdWU6IFZlY3RvcjMuZnJvbUNvcHkzKHVuYm91bmRlZCwgdW5ib3VuZGVkLCB1bmJvdW5kZWQpLFxuICAgIG1pbjogLU51bWJlci5NQVhfVkFMVUUsXG4gICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxuICB9KTtcbn1cblxuLyoqXG4gKiBEZXRlY3RzIHRoZSBQQlIgZmVhdHVyZXMgdGhlIHJheW1hcmNoaW5nIGdyYXBoIHVzZXMgc28gdGhhdCB0aGUgbWF0ZXJpYWxcbiAqIGVuYWJsZXMgdGhlIG1hdGNoaW5nIHNoYWRlciBkZWZpbmVzLlxuICpcbiAqIE5vcm1hbCBtYXBwaW5nIGFkZGl0aW9uYWxseSByZWxpZXMgb24gdGhlIHJheW1hcmNoaW5nLXNwZWNpZmljIGdldFRCTiB2YXJpYW50XG4gKiAoUk5fUkFZTUFSQ0hJTkdfU0hBRElORyksIGJlY2F1c2UgdGhlIHNoYWRpbmcgc2VjdGlvbiBydW5zIGluIG5vbi11bmlmb3JtXG4gKiBjb250cm9sIGZsb3cgd2hlcmUgZGVyaXZhdGl2ZXMgYXJlIG5vdCBhbGxvd2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0UmF5bWFyY2hpbmdQYnJGZWF0dXJlcyhzaGFkZXJOb2RlSnNvbjogU2hhZGVyTm9kZUpzb24pIHtcbiAgY29uc3Qgbm9kZXMgPSBzaGFkZXJOb2RlSnNvbi5ub2RlcyBhcyBBcnJheTx7IGlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZyB9PiB8IHVuZGVmaW5lZDtcbiAgY29uc3QgY29ubmVjdGlvbnMgPSBzaGFkZXJOb2RlSnNvbi5jb25uZWN0aW9ucyBhc1xuICAgIHwgQXJyYXk8eyBmcm9tOiB7IGlkOiBzdHJpbmc7IHBvcnROYW1lOiBzdHJpbmcgfTsgdG86IHsgaWQ6IHN0cmluZzsgcG9ydE5hbWU6IHN0cmluZyB9IH0+XG4gICAgfCB1bmRlZmluZWQ7XG4gIGlmIChub2RlcyA9PSBudWxsIHx8IGNvbm5lY3Rpb25zID09IG51bGwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXNlTm9ybWFsVGV4dHVyZTogZmFsc2UsXG4gICAgICBpc09jY2x1c2lvbjogZmFsc2UsXG4gICAgICBpc0NsZWFyY29hdDogZmFsc2UsXG4gICAgICBpc1NoZWVuOiBmYWxzZSxcbiAgICAgIGlzSXJpZGVzY2VuY2U6IGZhbHNlLFxuICAgICAgaXNBbmlzb3Ryb3B5OiBmYWxzZSxcbiAgICAgIGlzRGlmZnVzZVRyYW5zbWlzc2lvbjogZmFsc2UsXG4gICAgICBpc1NwZWN1bGFyOiBmYWxzZSxcbiAgICAgIGlzVHJhbnNtaXNzaW9uOiBmYWxzZSxcbiAgICAgIGlzVm9sdW1lOiBmYWxzZSxcbiAgICAgIGlzRGlzcGVyc2lvbjogZmFsc2UsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGZpbmROb2RlID0gKG5hbWU6IHN0cmluZykgPT4gbm9kZXMuZmluZChub2RlID0+IG5vZGUubmFtZSA9PT0gbmFtZSk7XG4gIGNvbnN0IGlzQ29ubmVjdGVkVG8gPSAodGFyZ2V0Tm9kZUlkOiBzdHJpbmcsIHBvcnROYW1lOiBzdHJpbmcpID0+XG4gICAgY29ubmVjdGlvbnMuZmluZChjb25uZWN0aW9uID0+IGNvbm5lY3Rpb24udG8uaWQgPT09IHRhcmdldE5vZGVJZCAmJiBjb25uZWN0aW9uLnRvLnBvcnROYW1lID09PSBwb3J0TmFtZSk7XG5cbiAgY29uc3QgcGJyU2hhZGVyTm9kZSA9IGZpbmROb2RlKCdQYnJTaGFkZXInKTtcbiAgY29uc3Qgbm9ybWFsUHJvcHNOb2RlID0gZmluZE5vZGUoJ1Bick5vcm1hbFByb3BzJyk7XG5cbiAgY29uc3QgaXNQcm9wc0Nvbm5lY3RlZCA9IChzb3VyY2VOYW1lOiBzdHJpbmcsIHBvcnROYW1lOiBzdHJpbmcpID0+IHtcbiAgICBpZiAocGJyU2hhZGVyTm9kZSA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgY29ubmVjdGlvbiA9IGlzQ29ubmVjdGVkVG8ocGJyU2hhZGVyTm9kZS5pZCwgcG9ydE5hbWUpO1xuICAgIGlmIChjb25uZWN0aW9uID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gbm9kZXMuZmluZChub2RlID0+IG5vZGUuaWQgPT09IGNvbm5lY3Rpb24uZnJvbS5pZCk/Lm5hbWUgPT09IHNvdXJjZU5hbWU7XG4gIH07XG5cbiAgLy8gQSBub3JtYWwgdGV4dHVyZSBhZmZlY3RzIHNoYWRpbmcgb25seSB3aGVuIHRoZSBub3JtYWwgcHJvcHMgbm9kZSBzYW1wbGVzIGFcbiAgLy8gVGV4dHVyZTJEIGFuZCBmZWVkcyB0aGUgUEJSIHNoYWRlcidzIG5vcm1hbC5cbiAgY29uc3QgdXNlTm9ybWFsVGV4dHVyZSA9ICgoKSA9PiB7XG4gICAgaWYgKHBiclNoYWRlck5vZGUgPT0gbnVsbCB8fCBub3JtYWxQcm9wc05vZGUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IG5vcm1hbENvbm5lY3Rpb24gPSBpc0Nvbm5lY3RlZFRvKG5vcm1hbFByb3BzTm9kZS5pZCwgJ25vcm1hbFRleHR1cmUnKTtcbiAgICBpZiAobm9ybWFsQ29ubmVjdGlvbiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3Qgc291cmNlTm9kZSA9IG5vZGVzLmZpbmQobm9kZSA9PiBub2RlLmlkID09PSBub3JtYWxDb25uZWN0aW9uLmZyb20uaWQpO1xuICAgIGlmIChzb3VyY2VOb2RlPy5uYW1lICE9PSAnVGV4dHVyZTJEJykgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBpc0Nvbm5lY3RlZFRvKHBiclNoYWRlck5vZGUuaWQsICdub3JtYWxJbldvcmxkJyk/LmZyb20uaWQgPT09IG5vcm1hbFByb3BzTm9kZS5pZDtcbiAgfSkoKTtcblxuICBjb25zdCBpc09jY2x1c2lvbiA9IGlzUHJvcHNDb25uZWN0ZWQoJ1Bick9jY2x1c2lvblByb3BzJywgJ29jY2x1c2lvblByb3BzJyk7XG4gIGNvbnN0IGlzQ2xlYXJjb2F0ID0gaXNQcm9wc0Nvbm5lY3RlZCgnUGJyQ2xlYXJjb2F0UHJvcHMnLCAnY2xlYXJjb2F0UHJvcHMnKTtcbiAgY29uc3QgaXNTaGVlbiA9IGlzUHJvcHNDb25uZWN0ZWQoJ1BiclNoZWVuUHJvcHMnLCAnc2hlZW5Qcm9wcycpO1xuICBjb25zdCBpc0lyaWRlc2NlbmNlID0gaXNQcm9wc0Nvbm5lY3RlZCgnUGJySXJpZGVzY2VuY2VQcm9wcycsICdpcmlkZXNjZW5jZVByb3BzJyk7XG4gIGNvbnN0IGlzQW5pc290cm9weSA9IGlzUHJvcHNDb25uZWN0ZWQoJ1BickFuaXNvdHJvcHlQcm9wcycsICdhbmlzb3Ryb3B5UHJvcHMnKTtcbiAgY29uc3QgaXNEaWZmdXNlVHJhbnNtaXNzaW9uID0gaXNQcm9wc0Nvbm5lY3RlZCgnUGJyRGlmZnVzZVRyYW5zbWlzc2lvblByb3BzJywgJ2RpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcycpO1xuICBjb25zdCBpc1NwZWN1bGFyID0gaXNQcm9wc0Nvbm5lY3RlZCgnUGJyU3BlY3VsYXJQcm9wcycsICdzcGVjdWxhclByb3BzJyk7XG4gIGNvbnN0IGlzVm9sdW1lID0gaXNQcm9wc0Nvbm5lY3RlZCgnUGJyVm9sdW1lUHJvcHMnLCAndm9sdW1lUHJvcHMnKTtcbiAgLy8gVHJhbnNtaXNzaW9uIGFuZCBkaXNwZXJzaW9uIGFjY2VwdCBhbnkgc2NhbGFyIHNvdXJjZSAoYSBwcm9wcyBub2RlIG9yIGEgY29uc3RhbnQpLFxuICAvLyBtYXRjaGluZyB0aGUgbWVzaCBub2RlIG1hdGVyaWFsIHBhdGggKGNyZWF0ZU5vZGVCYXNlZEN1c3RvbU1hdGVyaWFsKS5cbiAgY29uc3QgaXNUcmFuc21pc3Npb24gPSBwYnJTaGFkZXJOb2RlICE9IG51bGwgJiYgaXNDb25uZWN0ZWRUbyhwYnJTaGFkZXJOb2RlLmlkLCAndHJhbnNtaXNzaW9uJykgIT0gbnVsbDtcbiAgY29uc3QgaXNEaXNwZXJzaW9uID0gcGJyU2hhZGVyTm9kZSAhPSBudWxsICYmIGlzQ29ubmVjdGVkVG8ocGJyU2hhZGVyTm9kZS5pZCwgJ2Rpc3BlcnNpb24nKSAhPSBudWxsO1xuXG4gIHJldHVybiB7XG4gICAgdXNlTm9ybWFsVGV4dHVyZSxcbiAgICBpc09jY2x1c2lvbixcbiAgICBpc0NsZWFyY29hdCxcbiAgICBpc1NoZWVuLFxuICAgIGlzSXJpZGVzY2VuY2UsXG4gICAgaXNBbmlzb3Ryb3B5LFxuICAgIGlzRGlmZnVzZVRyYW5zbWlzc2lvbixcbiAgICBpc1NwZWN1bGFyLFxuICAgIGlzVHJhbnNtaXNzaW9uLFxuICAgIGlzVm9sdW1lLFxuICAgIGlzRGlzcGVyc2lvbixcbiAgfTtcbn1cblxuLyoqXG4gKlxuICogQ3JlYXRlcyBhIG5vZGUtYmFzZWQgcmF5bWFyY2hpbmcgY3VzdG9tIG1hdGVyaWFsLlxuICogQHBhcmFtIGVuZ2luZVxuICogQHBhcmFtIHNoYWRlck5vZGVKc29uXG4gKiBAcmV0dXJucyBPYmplY3QgY29udGFpbmluZyB0aGUgbWF0ZXJpYWwgYW5kIHNoYWRlciBub2RlIGZsYWdzLCBvciBudWxsIGlmIGdlbmVyYXRpb24gZmFpbHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVCYXNlZFJheW1hcmNoaW5nQ3VzdG9tTWF0ZXJpYWwoXG4gIGVuZ2luZTogRW5naW5lLFxuICBzaGFkZXJOb2RlSnNvbjogU2hhZGVyTm9kZUpzb24sXG4gIGN1cnJlbnRNYXRlcmlhbD86IE1hdGVyaWFsXG4pOiBOb2RlQmFzZWRNYXRlcmlhbFJlc3VsdCB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHJheW1hcmNoaW5nU2hhZGVyUGFydCA9IG5ldyBSYXltYXJjaGluZ1NoYWRlclBhcnQoKTtcbiAgY29uc3Qgc2hhZGVyQ29kZSA9IFNoYWRlckdyYXBoUmVzb2x2ZXIuZ2VuZXJhdGVTaGFkZXJDb2RlRnJvbUpzb24oZW5naW5lLCBzaGFkZXJOb2RlSnNvbiwgcmF5bWFyY2hpbmdTaGFkZXJQYXJ0KTtcblxuICBpZiAoIXNoYWRlckNvZGUpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mbyA9IGFkZFJheW1hcmNoaW5nQ29tcG9uZW50U2VtYW50aWNzSW5mbyhzaGFkZXJOb2RlSnNvbik7XG4gIGFkZFJheW1hcmNoaW5nQWFiYlNlbWFudGljSW5mbyhhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvKTtcblxuICAvLyBUaGUgcmF5bWFyY2hpbmcgc2hhZGVyIHNoYWRlcyBoaXQgcG9pbnRzIHdpdGggdGhlIHNoYXJlZCBQQlIgc2hhZGVyIGZ1bmN0aW9uLFxuICAvLyBzbyB0aGUgbWF0ZXJpYWwgbmVlZHMgdGhlIGxpZ2h0aW5nL1BCUiBkZWZpbmVzIGFuZCB0aGUgSUJML1BCUiBwYXJhbWV0ZXJzLlxuICBhZGRSYXltYXJjaGluZ1BicklibFNlbWFudGljSW5mbyhlbmdpbmUsIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8pO1xuICBhZGRSYXltYXJjaGluZ1BiclNlbWFudGljSW5mbyhhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvKTtcbiAgLy8gVGV4dHVyZTJEIG5vZGVzIGluIHRoZSBncmFwaCBzYW1wbGUgdGhlc2UgbWF0ZXJpYWwgdGV4dHVyZXMuXG4gIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCguLi5idWlsZFRleHR1cmVTZW1hbnRpY0luZm8oZW5naW5lLCBzaGFkZXJDb2RlLnRleHR1cmVJbmZvcykpO1xuXG4gIGNvbnN0IHBickZlYXR1cmVzID0gZGV0ZWN0UmF5bWFyY2hpbmdQYnJGZWF0dXJlcyhzaGFkZXJOb2RlSnNvbik7XG4gIGlmIChwYnJGZWF0dXJlcy5pc1NoZWVuKSB7XG4gICAgLy8gVGhlIHNoZWVuIGVudmlyb25tZW50IHRleHR1cmUgbXVzdCBiZSBzZXR0YWJsZSBieSB0aGUgcGlwZWxpbmUgb24gdGhlXG4gICAgLy8gYnVmZmVyLWxlc3MgcmF5bWFyY2hpbmcgZHJhdywgc28gaXQgaXMgbm90IGFuIGludGVybmFsIHNldHRpbmcgaGVyZS5cbiAgICBhZGRQYnJTaGVlblNlbWFudGljSW5mbyhlbmdpbmUsIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8sIHsgc2hlZW5FbnZJc0ludGVybmFsU2V0dGluZzogZmFsc2UgfSk7XG4gIH1cbiAgaWYgKHBickZlYXR1cmVzLmlzVHJhbnNtaXNzaW9uKSB7XG4gICAgLy8gVGhlIHRyYW5zbWlzc2lvbiBzaGFkaW5nIHNhbXBsZXMgdGhlIHJlc29sdmVkIHNjZW5lIGNvbG9yLCB3aGljaCB0aGUgcGlwZWxpbmVcbiAgICAvLyBhc3NpZ25zIHRvIHRoZSBtYXRlcmlhbCBiZWZvcmUgdGhlIHJheW1hcmNoaW5nIGRyYXcuIEEgVGV4dHVyZTJEIG5vZGUgd2l0aCB0aGVcbiAgICAvLyBzYW1lIG5hbWUgYWxyZWFkeSBkZWNsYXJlcyB0aGUgc2VtYW50aWMsIHNvIGRvIG5vdCBhZGQgYSBkdXBsaWNhdGUuXG4gICAgaWYgKCFhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvLnNvbWUoaW5mbyA9PiBpbmZvLnNlbWFudGljID09PSAnYmFja0J1ZmZlclRleHR1cmUnKSkge1xuICAgICAgYWRkQmFja0J1ZmZlclRleHR1cmVTZW1hbnRpY0luZm8oZW5naW5lLCBhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvLCBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgbWF0ZXJpYWwgPSByZXVzZU9yUmVjcmVhdGVDdXN0b21NYXRlcmlhbChcbiAgICBlbmdpbmUsXG4gICAgc2hhZGVyQ29kZS52ZXJ0ZXhTaGFkZXIsXG4gICAgc2hhZGVyQ29kZS5waXhlbFNoYWRlcixcbiAgICB7XG4gICAgICBpc0xpZ2h0aW5nOiB0cnVlLFxuICAgICAgaXNQYnI6IHRydWUsXG4gICAgICAvLyBUaGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgcmVjZWl2ZXMgc2hhZG93cyBmcm9tIG1lc2ggY2FzdGVycy4gRm9yd2FyZFJlbmRlclBpcGVsaW5lXG4gICAgICAvLyBmZWVkcyB0aGUgc2hhZG93IG1hcHMvcGFyYW1ldGVycyB0byBpdCBiZWNhdXNlIGl0IGlzIG5vdCBhdHRhY2hlZCB0byBhIHByaW1pdGl2ZS5cbiAgICAgIGlzU2hhZG93OiB0cnVlLFxuICAgICAgdXNlTm9ybWFsVGV4dHVyZTogcGJyRmVhdHVyZXMudXNlTm9ybWFsVGV4dHVyZSxcbiAgICAgIGlzT2NjbHVzaW9uOiBwYnJGZWF0dXJlcy5pc09jY2x1c2lvbixcbiAgICAgIGlzQ2xlYXJjb2F0OiBwYnJGZWF0dXJlcy5pc0NsZWFyY29hdCxcbiAgICAgIGlzU2hlZW46IHBickZlYXR1cmVzLmlzU2hlZW4sXG4gICAgICBpc0lyaWRlc2NlbmNlOiBwYnJGZWF0dXJlcy5pc0lyaWRlc2NlbmNlLFxuICAgICAgaXNBbmlzb3Ryb3B5OiBwYnJGZWF0dXJlcy5pc0FuaXNvdHJvcHksXG4gICAgICBpc0RpZmZ1c2VUcmFuc21pc3Npb246IHBickZlYXR1cmVzLmlzRGlmZnVzZVRyYW5zbWlzc2lvbixcbiAgICAgIGlzU3BlY3VsYXI6IHBickZlYXR1cmVzLmlzU3BlY3VsYXIsXG4gICAgICBpc1RyYW5zbWlzc2lvbjogcGJyRmVhdHVyZXMuaXNUcmFuc21pc3Npb24sXG4gICAgICBpc1ZvbHVtZTogcGJyRmVhdHVyZXMuaXNWb2x1bWUsXG4gICAgICBpc0Rpc3BlcnNpb246IHBickZlYXR1cmVzLmlzRGlzcGVyc2lvbixcbiAgICAgIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8sXG4gICAgfSxcbiAgICBjdXJyZW50TWF0ZXJpYWxcbiAgKTtcblxuICAvLyBTdG9yZSB0aGUgc2hhZGVyIG5vZGUgSlNPTiBmb3IgbGF0ZXIgcmV0cmlldmFsIChlLmcuLCBpbiBlZGl0b3Igb3IgZXhwb3J0KVxuICBtYXRlcmlhbC5zaGFkZXJOb2RlSnNvbiA9IHNoYWRlck5vZGVKc29uO1xuXG4gIHJldHVybiB7XG4gICAgbWF0ZXJpYWwsXG4gICAgaGFzUGJyU2hhZGVyTm9kZTogZmFsc2UsXG4gICAgaGFzQ2xhc3NpY1NoYWRlck5vZGU6IGZhbHNlLFxuICB9O1xufVxuXG4vKipcbiAqIFNoYWRvdyBjYXN0ZXIgbWF0ZXJpYWxzIGJ1aWx0IGZyb20gYSBtZXJnZWQgcmF5bWFyY2hpbmcgZ3JhcGguXG4gKlxuICogYHJlZ3VsYXJgIHdyaXRlcyB0aGUgbGluZWFyIGRlcHRoIG1vbWVudHMgb2Ygc3BvdCAvIGRpcmVjdGlvbmFsIHNoYWRvdyBtYXBzLCB3aGlsZVxuICogdGhlIHBhcmFib2xvaWQgdmFyaWFudHMgd3JpdGUgdGhlIGZyb250IChyLGcpIGFuZCBiYWNrIChiLGEpIGhlbWlzcGhlcmVzIG9mIHRoZVxuICogcG9pbnQgbGlnaHQgc2hhZG93IG1hcHMuXG4gKi9cbmV4cG9ydCB0eXBlIFJheW1hcmNoaW5nU2hhZG93TWF0ZXJpYWxzID0ge1xuICByZWd1bGFyPzogTWF0ZXJpYWw7XG4gIHBhcmFib2xvaWRGcm9udD86IE1hdGVyaWFsO1xuICBwYXJhYm9sb2lkQmFjaz86IE1hdGVyaWFsO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBzaGFkb3cgY2FzdGVyIG1hdGVyaWFscyB0aGF0IHJlbmRlciB0aGUgbWVyZ2VkIFNERiBncmFwaCBpbnRvIHRoZVxuICogc2hhZG93IG1hcHMuXG4gKlxuICogVGhlIHNoYWRlciBwYXJ0IGlzIGEgUmF5bWFyY2hpbmdTaGFkb3dTaGFkZXJQYXJ0LCBzbyB0aGUgZGlzdGFuY2UgZnVuY3Rpb24gYG1hcCgpYFxuICogaXMgdGhlIHNhbWUgYXMgaW4gdGhlIHZpc2libGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgd2hpbGUgdGhlIGZyYWdtZW50IG1haW4gd3JpdGVzXG4gKiB0aGUgdmFyaWFuY2Ugc2hhZG93IG1hcCBtb21lbnRzIGFuZCB0aGUgZnJhZ21lbnQgZGVwdGguIFRoZSByZWNlaXZlciBtYXRlcmlhbCBpcyBub3RcbiAqIHBhc3NlZCBhcyBgY3VycmVudE1hdGVyaWFsYDogb25seSB0aGUgcHJldmlvdXMgc2hhZG93IG1hdGVyaWFscyBhcmUgcmV1c2VkLlxuICpcbiAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gKiBAcGFyYW0gc2hhZGVyTm9kZUpzb24gLSBUaGUgbWVyZ2VkIHJheW1hcmNoaW5nIGdyYXBoIChjYXN0U2hhZG93T25seSlcbiAqIEBwYXJhbSBjdXJyZW50TWF0ZXJpYWxzIC0gU2hhZG93IG1hdGVyaWFscyBvZiB0aGUgcHJldmlvdXMgYnVpbGQsIHJldXNlZCB3aGVuIHBvc3NpYmxlXG4gKiBAcmV0dXJucyBUaGUgdGhyZWUgc2hhZG93IG1hdGVyaWFscywgb3IgdW5kZWZpbmVkIHdoZW4gY29kZSBnZW5lcmF0aW9uIGZhaWxzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ1NoYWRvd01hdGVyaWFscyhcbiAgZW5naW5lOiBFbmdpbmUsXG4gIHNoYWRlck5vZGVKc29uOiBTaGFkZXJOb2RlSnNvbixcbiAgY3VycmVudE1hdGVyaWFscz86IFJheW1hcmNoaW5nU2hhZG93TWF0ZXJpYWxzXG4pOiBSYXltYXJjaGluZ1NoYWRvd01hdGVyaWFscyB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHJlZ3VsYXIgPSBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ1NoYWRvd01hdGVyaWFsKFxuICAgIGVuZ2luZSxcbiAgICBzaGFkZXJOb2RlSnNvbixcbiAgICAncmVndWxhcicsXG4gICAgY3VycmVudE1hdGVyaWFscz8ucmVndWxhclxuICApO1xuICBjb25zdCBwYXJhYm9sb2lkRnJvbnQgPSBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ1NoYWRvd01hdGVyaWFsKFxuICAgIGVuZ2luZSxcbiAgICBzaGFkZXJOb2RlSnNvbixcbiAgICAncGFyYWJvbG9pZEZyb250JyxcbiAgICBjdXJyZW50TWF0ZXJpYWxzPy5wYXJhYm9sb2lkRnJvbnRcbiAgKTtcbiAgY29uc3QgcGFyYWJvbG9pZEJhY2sgPSBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ1NoYWRvd01hdGVyaWFsKFxuICAgIGVuZ2luZSxcbiAgICBzaGFkZXJOb2RlSnNvbixcbiAgICAncGFyYWJvbG9pZEJhY2snLFxuICAgIGN1cnJlbnRNYXRlcmlhbHM/LnBhcmFib2xvaWRCYWNrXG4gICk7XG4gIGlmIChyZWd1bGFyID09IG51bGwgfHwgcGFyYWJvbG9pZEZyb250ID09IG51bGwgfHwgcGFyYWJvbG9pZEJhY2sgPT0gbnVsbCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIHsgcmVndWxhciwgcGFyYWJvbG9pZEZyb250LCBwYXJhYm9sb2lkQmFjayB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUJhc2VkUmF5bWFyY2hpbmdTaGFkb3dNYXRlcmlhbChcbiAgZW5naW5lOiBFbmdpbmUsXG4gIHNoYWRlck5vZGVKc29uOiBTaGFkZXJOb2RlSnNvbixcbiAga2luZDogUmF5bWFyY2hpbmdTaGFkb3dTaGFkZXJQYXJ0S2luZCxcbiAgY3VycmVudE1hdGVyaWFsPzogTWF0ZXJpYWxcbik6IE1hdGVyaWFsIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qgc2hhZGVyUGFydCA9IG5ldyBSYXltYXJjaGluZ1NoYWRvd1NoYWRlclBhcnQoa2luZCk7XG4gIGNvbnN0IHNoYWRlckNvZGUgPSBTaGFkZXJHcmFwaFJlc29sdmVyLmdlbmVyYXRlU2hhZGVyQ29kZUZyb21Kc29uKGVuZ2luZSwgc2hhZGVyTm9kZUpzb24sIHNoYWRlclBhcnQsIFtcbiAgICAnb3V0RGlzdGFuY2UnLFxuICAgICdvdXRVbmlvbicsXG4gIF0pO1xuICBpZiAoIXNoYWRlckNvZGUpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgYWRkaXRpb25hbFNoYWRlclNlbWFudGljSW5mbyA9IGFkZFJheW1hcmNoaW5nQ29tcG9uZW50U2VtYW50aWNzSW5mbyhzaGFkZXJOb2RlSnNvbik7XG4gIGFkZFJheW1hcmNoaW5nQWFiYlNlbWFudGljSW5mbyhhZGRpdGlvbmFsU2hhZGVyU2VtYW50aWNJbmZvKTtcbiAgLy8gVGV4dHVyZTJEIG5vZGVzIGluIHRoZSBkaXN0YW5jZSBmdW5jdGlvbiBzYW1wbGUgdGhlc2UgbWF0ZXJpYWwgdGV4dHVyZXMuXG4gIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCguLi5idWlsZFRleHR1cmVTZW1hbnRpY0luZm8oZW5naW5lLCBzaGFkZXJDb2RlLnRleHR1cmVJbmZvcykpO1xuICBpZiAoa2luZCAhPT0gJ3JlZ3VsYXInKSB7XG4gICAgLy8gUG9pbnQgbGlnaHQgcGFyYWJvbG9pZCBwYXNzZXM6IHRoZSBsaWdodCBpbmRleCBhbmQgdGhlIHBlci1zbG90IGZhciBwbGFuZSBhcmVcbiAgICAvLyBzZXQgYnkgdGhlIHBpcGVsaW5lIHdoZW4gdGhlIHBlci1zbG90IG1hdGVyaWFsIGlzIGNyZWF0ZWQgLyB1cGRhdGVkLlxuICAgIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgICBzZW1hbnRpYzogJ2xpZ2h0SW5kZXgnLFxuICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5JbnQsXG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDApLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxuICAgIH0pO1xuICAgIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8ucHVzaCh7XG4gICAgICBzZW1hbnRpYzogJ3NoYWRvd0ZhclBsYW5lJyxcbiAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDEwMDApLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgbWF0ZXJpYWwgPSByZXVzZU9yUmVjcmVhdGVDdXN0b21NYXRlcmlhbChcbiAgICBlbmdpbmUsXG4gICAgc2hhZGVyQ29kZS52ZXJ0ZXhTaGFkZXIsXG4gICAgc2hhZGVyQ29kZS5waXhlbFNoYWRlcixcbiAgICB7XG4gICAgICBpc0xpZ2h0aW5nOiBmYWxzZSxcbiAgICAgIGlzUGJyOiBmYWxzZSxcbiAgICAgIGlzU2hhZG93OiBmYWxzZSxcbiAgICAgIGFkZGl0aW9uYWxTaGFkZXJTZW1hbnRpY0luZm8sXG4gICAgfSxcbiAgICBjdXJyZW50TWF0ZXJpYWxcbiAgKTtcblxuICBpZiAoa2luZCA9PT0gJ3BhcmFib2xvaWRGcm9udCcpIHtcbiAgICBtYXRlcmlhbC5jb2xvcldyaXRlTWFzayA9IFt0cnVlLCB0cnVlLCBmYWxzZSwgZmFsc2VdO1xuICB9IGVsc2UgaWYgKGtpbmQgPT09ICdwYXJhYm9sb2lkQmFjaycpIHtcbiAgICBtYXRlcmlhbC5jb2xvcldyaXRlTWFzayA9IFtmYWxzZSwgZmFsc2UsIHRydWUsIHRydWVdO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSByZWd1bGFyIHNoYWRvdyB0YXJnZXQgaXMgUkcxNkYgKG1vbWVudHMgTTEgYW5kIE0yKS5cbiAgICBtYXRlcmlhbC5jb2xvcldyaXRlTWFzayA9IFt0cnVlLCB0cnVlLCBmYWxzZSwgZmFsc2VdO1xuICB9XG5cbiAgbWF0ZXJpYWwuc2hhZGVyTm9kZUpzb24gPSBzaGFkZXJOb2RlSnNvbjtcblxuICByZXR1cm4gbWF0ZXJpYWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UnJuSnNvbihcbiAgZW5naW5lOiBFbmdpbmUsXG4gIHsgY2FzdFNoYWRvd09ubHkgPSBmYWxzZSB9OiB7IGNhc3RTaGFkb3dPbmx5PzogYm9vbGVhbiB9ID0ge31cbik6IE5vZGVKU09OIHtcbiAgY29uc3QgY29sbGVjdGVkUnJuSnNvbjogTm9kZUpTT04gPSB7XG4gICAgbm9kZXM6IFtdLFxuICAgIGNvbm5lY3Rpb25zOiBbXSxcbiAgfTtcblxuICBjb25zdCByYXltYXJjaGluZ0NvbXBvbmVudHMgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRzV2l0aFRJRChcbiAgICBXZWxsS25vd25Db21wb25lbnRUSURzLlJheW1hcmNoaW5nQ29tcG9uZW50VElEXG4gICk7XG4gIGZvciAoY29uc3QgY29tcG9uZW50IG9mIHJheW1hcmNoaW5nQ29tcG9uZW50cykge1xuICAgIGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50ID0gY29tcG9uZW50IGFzIFJheW1hcmNoaW5nQ29tcG9uZW50O1xuICAgIGlmIChjYXN0U2hhZG93T25seSAmJiAhcmF5bWFyY2hpbmdDb21wb25lbnQuY2FzdFNoYWRvdykge1xuICAgICAgLy8gQSBub24tY2FzdGluZyBTREYgbXVzdCBiZSBhYnNlbnQgZnJvbSB0aGUgc2hhZG93IGdyYXBoOiBpbmNsdWRpbmcgaXQgaW4gdGhlXG4gICAgICAvLyB1bmlvbiB3b3VsZCBsZXQgaXQgb2NjbHVkZSBjYXN0aW5nIFNERnMgYmVoaW5kIGl0LlxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHJybkpzb24gPSByYXltYXJjaGluZ0NvbXBvbmVudC5ycm5Kc29uO1xuXG4gICAgLy8gUHJlZml4IG5vZGUgaWRzIHdpdGggdGhlIGNvbXBvbmVudCBTSUQgdG8gYXZvaWQgY29sbGlzaW9ucyBhbmQgdG8ga2VlcCB0aGVcbiAgICAvLyBvYmplY3QgaWQgKHVzZWQgYnkgdGhlIHBlci1jb21wb25lbnQgc2hhZGluZyBkaXNwYXRjaCkgc3RhYmxlIHdoZW4gb3RoZXJcbiAgICAvLyBjb21wb25lbnRzIGFyZSBhZGRlZCBvciByZW1vdmVkLlxuICAgIGNvbnN0IHByZWZpeCA9IGBjb21wJHtyYXltYXJjaGluZ0NvbXBvbmVudC5jb21wb25lbnRTSUR9X2A7XG5cbiAgICAvLyBDbG9uZSBhbmQgdXBkYXRlIG5vZGUgaWRzIHdpdGggcHJlZml4XG4gICAgY29uc3QgcHJlZml4ZWROb2RlcyA9IHJybkpzb24ubm9kZXMubWFwKG5vZGUgPT4ge1xuICAgICAgY29uc3QgbmV3Tm9kZSA9IHsgLi4ubm9kZSwgaWQ6IGAke3ByZWZpeH0ke25vZGUuaWR9YCB9O1xuXG4gICAgICAvLyBVcGRhdGUgaW5wdXQgaWRzXG4gICAgICBpZiAobm9kZS5pbnB1dHMpIHtcbiAgICAgICAgbmV3Tm9kZS5pbnB1dHMgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCBpbnB1dF0gb2YgT2JqZWN0LmVudHJpZXMobm9kZS5pbnB1dHMpKSB7XG4gICAgICAgICAgbmV3Tm9kZS5pbnB1dHNba2V5XSA9IHsgLi4uaW5wdXQsIGlkOiBgJHtwcmVmaXh9JHtpbnB1dC5pZH1gIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIG91dHB1dCBpZHNcbiAgICAgIGlmIChub2RlLm91dHB1dHMpIHtcbiAgICAgICAgbmV3Tm9kZS5vdXRwdXRzID0ge307XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgb3V0cHV0XSBvZiBPYmplY3QuZW50cmllcyhub2RlLm91dHB1dHMpKSB7XG4gICAgICAgICAgbmV3Tm9kZS5vdXRwdXRzW2tleV0gPSB7IC4uLm91dHB1dCwgaWQ6IGAke3ByZWZpeH0ke291dHB1dC5pZH1gIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgfSk7XG5cbiAgICAvLyBVbmlmb3JtIG5vZGVzIGFyZSBwZXIgY29tcG9uZW50OiBwb3N0Zml4IHRoZWlyIG5hbWUgd2l0aCB0aGUgY29tcG9uZW50IFNJRCBzb1xuICAgIC8vIGNvbXBvbmVudHMgdGhhdCBzaGFyZSB0aGUgc2FtZSBncmFwaCBjYW4gY2FycnkgZGlmZmVyZW50IHZhbHVlcy4gVGhlIG1lcmdlZFxuICAgIC8vIG1hdGVyaWFsIHRoZW4gaGFzIG9uZSB1bmlmb3JtIHBlciBjb21wb25lbnQgKGZvciBleGFtcGxlIFwicm91Z2huZXNzXzBcIikuXG4gICAgY29uc3QgdW5pZm9ybU5vZGVOYW1lcyA9IG5ldyBTZXQoW1xuICAgICAgJ1VuaWZvcm1TY2FsYXJGbG9hdCcsXG4gICAgICAnVW5pZm9ybVZlY3RvcjJGbG9hdCcsXG4gICAgICAnVW5pZm9ybVZlY3RvcjNGbG9hdCcsXG4gICAgICAnVW5pZm9ybVZlY3RvcjRGbG9hdCcsXG4gICAgXSk7XG4gICAgZm9yIChjb25zdCBub2RlIG9mIHByZWZpeGVkTm9kZXMpIHtcbiAgICAgIGlmICh1bmlmb3JtTm9kZU5hbWVzLmhhcyhub2RlLm5hbWUpKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBub2RlLmNvbnRyb2xzPy5uYW1lPy52YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJyAmJiBuYW1lLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBub2RlLmNvbnRyb2xzID0ge1xuICAgICAgICAgICAgLi4uKG5vZGUuY29udHJvbHMgPz8ge30pLFxuICAgICAgICAgICAgbmFtZTogeyB2YWx1ZTogYCR7bmFtZX1fJHtyYXltYXJjaGluZ0NvbXBvbmVudC5jb21wb25lbnRTSUR9YCB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDbG9uZSBhbmQgdXBkYXRlIGNvbm5lY3Rpb24gaWRzIHdpdGggcHJlZml4XG4gICAgY29uc3QgcHJlZml4ZWRDb25uZWN0aW9ucyA9IHJybkpzb24uY29ubmVjdGlvbnMubWFwKGNvbm4gPT4gKHtcbiAgICAgIC4uLmNvbm4sXG4gICAgICBpZDogYCR7cHJlZml4fSR7Y29ubi5pZH1gLFxuICAgICAgZnJvbTogeyAuLi5jb25uLmZyb20sIGlkOiBgJHtwcmVmaXh9JHtjb25uLmZyb20uaWR9YCB9LFxuICAgICAgdG86IHsgLi4uY29ubi50bywgaWQ6IGAke3ByZWZpeH0ke2Nvbm4udG8uaWR9YCB9LFxuICAgIH0pKTtcblxuICAgIC8vIFJlY29yZCB3aGljaCBjb21wb25lbnQgd2FzIGhpdDogYWRkIGFuIG9iamVjdCBpZCBub2RlIGFuZCBmZWVkIGl0IHRvIGV2ZXJ5XG4gICAgLy8gT3V0VW5pb24gb2YgdGhlIGNvbXBvbmVudC4gVW5pb25zIHRoYXQgYWxyZWFkeSBoYXZlIGFuIG9iamVjdElkIGNvbm5lY3Rpb25cbiAgICAvLyBrZWVwIHRoZSBncmFwaCB0aGUgdXNlciBhdXRob3JlZC5cbiAgICBjb25zdCBvYmplY3RJZE5vZGVJZCA9IGAke3ByZWZpeH1fX3JheW1hcmNoT2JqZWN0SWRgO1xuICAgIGNvbnN0IG9iamVjdElkT3V0cHV0SWQgPSBgJHtwcmVmaXh9X19yYXltYXJjaE9iamVjdElkT3V0YDtcbiAgICBjb25zdCB0ZXJtaW5hbHNXaXRob3V0T2JqZWN0SWQgPSBwcmVmaXhlZE5vZGVzLmZpbHRlcihcbiAgICAgIG5vZGUgPT5cbiAgICAgICAgKG5vZGUubmFtZSA9PT0gJ091dFVuaW9uJyB8fCBub2RlLm5hbWUgPT09ICdPdXREaXN0YW5jZScpICYmXG4gICAgICAgICFwcmVmaXhlZENvbm5lY3Rpb25zLnNvbWUoY29ubmVjdGlvbiA9PiBjb25uZWN0aW9uLnRvLmlkID09PSBub2RlLmlkICYmIGNvbm5lY3Rpb24udG8ucG9ydE5hbWUgPT09ICdvYmplY3RJZCcpXG4gICAgKTtcbiAgICBpZiAodGVybWluYWxzV2l0aG91dE9iamVjdElkLmxlbmd0aCA+IDApIHtcbiAgICAgIHByZWZpeGVkTm9kZXMucHVzaCh7XG4gICAgICAgIGlkOiBvYmplY3RJZE5vZGVJZCxcbiAgICAgICAgbmFtZTogJ1JheW1hcmNoT2JqZWN0SWRVbmlmb3JtJyxcbiAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgIG91dDE6IHsgaWQ6IG9iamVjdElkT3V0cHV0SWQsIGxhYmVsOiAnT3V0IE9iamVjdCBJZCcsIHNvY2tldDogeyBuYW1lOiAnU2NhbGFyPGZsb2F0PicgfSB9LFxuICAgICAgICB9LFxuICAgICAgICBpbnB1dHM6IHt9LFxuICAgICAgICBjb250cm9sczogeyBuYW1lOiB7IHZhbHVlOiBgcmF5bWFyY2hPYmplY3RJZF8ke3JheW1hcmNoaW5nQ29tcG9uZW50LmNvbXBvbmVudFNJRH1gIH0gfSxcbiAgICAgICAgcG9zaXRpb246IHsgeDogMCwgeTogMCB9LFxuICAgICAgfSk7XG4gICAgICBmb3IgKGNvbnN0IHRlcm1pbmFsIG9mIHRlcm1pbmFsc1dpdGhvdXRPYmplY3RJZCkge1xuICAgICAgICBwcmVmaXhlZENvbm5lY3Rpb25zLnB1c2goe1xuICAgICAgICAgIGlkOiBgJHtwcmVmaXh9X19yYXltYXJjaE9iamVjdElkXyR7dGVybWluYWwuaWR9YCxcbiAgICAgICAgICBmcm9tOiB7IGlkOiBvYmplY3RJZE5vZGVJZCwgcG9ydE5hbWU6ICdvdXQxJyB9LFxuICAgICAgICAgIHRvOiB7IGlkOiB0ZXJtaW5hbC5pZCwgcG9ydE5hbWU6ICdvYmplY3RJZCcgfSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCBlYWNoIGNvbXBvbmVudCdzIGxvY2FsLXNwYWNlIGRpc3RhbmNlIGludG8gYSBjb25zZXJ2YXRpdmUgd29ybGQtc3BhY2VcbiAgICAvLyBkaXN0YW5jZS4gVGhlIFNERiBncmFwaCBpcyBldmFsdWF0ZWQgaW4gdGhlIHNwYWNlIHByb2R1Y2VkIGJ5IFNkQXBwbHlXb3JsZE1hdHJpeFxuICAgIC8vICh0aGUgY29tcG9uZW50J3MgbG9jYWwgc3BhY2UpLCBzbyBzY2FsaW5nIGFuIGVudGl0eSBiZWxvdyAxIG1ha2VzIHRoZSBncmFwaCdzXG4gICAgLy8gZGlzdGFuY2UgbGFyZ2VyIHRoYW4gdGhlIHJlYWwgd29ybGQgZGlzdGFuY2UgYW5kIHNwaGVyZSB0cmFjaW5nIG92ZXJzaG9vdHMgdGhlXG4gICAgLy8gc3VyZmFjZSAocGFydHMgb2YgdGhlIHNoYXBlIGRpc2FwcGVhciwgY2FtZXJhLWRlcGVuZGVudCkuIFRoZSB0ZXJtaW5hbCBub2Rlc1xuICAgIC8vIHJlYWQgdGhlIGFscmVhZHkgZGVjbGFyZWQgcGVyLWNvbXBvbmVudCB3b3JsZCBtYXRyaXggdW5pZm9ybSBhbmQgbXVsdGlwbHkgdGhlXG4gICAgLy8gZGlzdGFuY2UgYnkgdGhlIHNtYWxsZXN0IGF4aXMgc2NhbGUsIHdoaWNoIGlzIGEgdmFsaWQgd29ybGQtc3BhY2Ugc3RlcCBib3VuZC5cbiAgICBjb25zdCB3b3JsZE1hdHJpeFVuaWZvcm1OYW1lczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2YgcHJlZml4ZWROb2Rlcykge1xuICAgICAgaWYgKG5vZGUubmFtZSA9PT0gJ1NkQXBwbHlXb3JsZE1hdHJpeCcpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5vZGUuY29udHJvbHM/Lm5hbWU/LnZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnICYmIG5hbWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHdvcmxkTWF0cml4VW5pZm9ybU5hbWVzLnB1c2gobmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdvcmxkTWF0cml4VW5pZm9ybU5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBwcmVmaXhlZE5vZGVzKSB7XG4gICAgICAgIGlmIChub2RlLm5hbWUgIT09ICdPdXRVbmlvbicgJiYgbm9kZS5uYW1lICE9PSAnT3V0RGlzdGFuY2UnKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5jb250cm9scyA9IHtcbiAgICAgICAgICAuLi4obm9kZS5jb250cm9scyA/PyB7fSksXG4gICAgICAgICAgZGlzdGFuY2VDb3JyZWN0aW9uTWF0cmljZXM6IHsgdmFsdWU6IFsuLi53b3JsZE1hdHJpeFVuaWZvcm1OYW1lc10gfSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb2xsZWN0ZWRScm5Kc29uLm5vZGVzLnB1c2goLi4ucHJlZml4ZWROb2Rlcyk7XG4gICAgY29sbGVjdGVkUnJuSnNvbi5jb25uZWN0aW9ucy5wdXNoKC4uLnByZWZpeGVkQ29ubmVjdGlvbnMpO1xuICB9XG5cbiAgcmV0dXJuIGNvbGxlY3RlZFJybkpzb247XG59XG5cbi8qKlxuICogU2VtYW50aWMgbmFtZSBvZiB0aGUgY29tcG9uZW50IHdvcmxkIG1hdHJpeCBpbnNpZGUgYSBwZXItY29tcG9uZW50IHJheW1hcmNoaW5nXG4gKiBtYXRlcmlhbC4gRXZlcnkgYFNkQXBwbHlXb3JsZE1hdHJpeGAgbm9kZSBvZiB0aGUgY29tcG9uZW50IGlzIG5vcm1hbGl6ZWQgdG8gdGhpc1xuICogbmFtZSB3aGVuIGl0cyBtYXRlcmlhbCBpcyBidWlsdCwgc28gdGhlIHBpcGVsaW5lIHNldHMgb25lIHVuaWZvcm0gcGVyIG1hdGVyaWFsLlxuICovXG5leHBvcnQgY29uc3QgUkFZTUFSQ0hJTkdfQ09NUE9ORU5UX1dPUkxEX01BVFJJWF9TRU1BTlRJQyA9ICdyYXltYXJjaGluZ1dvcmxkTWF0cml4JztcblxuLyoqXG4gKiBCdWlsZHMgdGhlIHNoYWRlciBncmFwaCBKU09OIG9mIG9uZSByYXltYXJjaGluZyBjb21wb25lbnQgZm9yIGl0cyBvd24gbWF0ZXJpYWwuXG4gKlxuICogVW5saWtlIHtAbGluayBjb2xsZWN0UnJuSnNvbn0sIHRoZSBncmFwaCBpcyBub3QgbWVyZ2VkIHdpdGggb3RoZXIgY29tcG9uZW50czpcbiAqIG5vZGUgaWRzIGFuZCB1bmlmb3JtIG5hbWVzIHN0YXkgYXMgYXV0aG9yZWQuIGBTZEFwcGx5V29ybGRNYXRyaXhgIHVuaWZvcm1zIGFyZVxuICogbm9ybWFsaXplZCB0byB7QGxpbmsgUkFZTUFSQ0hJTkdfQ09NUE9ORU5UX1dPUkxEX01BVFJJWF9TRU1BTlRJQ30sIGFuZCB0aGVcbiAqIGRpc3RhbmNlIHRlcm1pbmFscyBhcmUgc3RhbXBlZCB3aXRoIHRoYXQgc2VtYW50aWMgc28gYSBzY2FsZWQgZW50aXR5IGNvbnZlcnRzIGl0c1xuICogbG9jYWwgZGlzdGFuY2VzIHRvIHdvcmxkLXNwYWNlIHJheSBtYXJjaGluZyBzdGVwcy5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IC0gVGhlIGNvbXBvbmVudCB3aG9zZSBncmFwaCBpcyBwcmVwYXJlZFxuICogQHJldHVybnMgQSBjbG9uZWQgZ3JhcGggSlNPTiBmb3Ige0BsaW5rIGNyZWF0ZU5vZGVCYXNlZFJheW1hcmNoaW5nQ3VzdG9tTWF0ZXJpYWx9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSYXltYXJjaGluZ0NvbXBvbmVudFNoYWRlckpzb24oY29tcG9uZW50OiBSYXltYXJjaGluZ0NvbXBvbmVudCk6IE5vZGVKU09OIHtcbiAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY29tcG9uZW50LnJybkpzb24pKSBhcyBOb2RlSlNPTjtcbiAgbGV0IHVzZXNXb3JsZE1hdHJpeCA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IG5vZGUgb2YganNvbi5ub2Rlcykge1xuICAgIGlmIChub2RlLm5hbWUgPT09ICdTZEFwcGx5V29ybGRNYXRyaXgnKSB7XG4gICAgICBub2RlLmNvbnRyb2xzID0ge1xuICAgICAgICAuLi4obm9kZS5jb250cm9scyA/PyB7fSksXG4gICAgICAgIG5hbWU6IHsgdmFsdWU6IFJBWU1BUkNISU5HX0NPTVBPTkVOVF9XT1JMRF9NQVRSSVhfU0VNQU5USUMgfSxcbiAgICAgIH07XG4gICAgICB1c2VzV29ybGRNYXRyaXggPSB0cnVlO1xuICAgIH1cbiAgfVxuICBpZiAodXNlc1dvcmxkTWF0cml4KSB7XG4gICAgZm9yIChjb25zdCBub2RlIG9mIGpzb24ubm9kZXMpIHtcbiAgICAgIGlmIChub2RlLm5hbWUgPT09ICdPdXRVbmlvbicgfHwgbm9kZS5uYW1lID09PSAnT3V0RGlzdGFuY2UnKSB7XG4gICAgICAgIG5vZGUuY29udHJvbHMgPSB7XG4gICAgICAgICAgLi4uKG5vZGUuY29udHJvbHMgPz8ge30pLFxuICAgICAgICAgIGRpc3RhbmNlQ29ycmVjdGlvbk1hdHJpY2VzOiB7IHZhbHVlOiBbUkFZTUFSQ0hJTkdfQ09NUE9ORU5UX1dPUkxEX01BVFJJWF9TRU1BTlRJQ10gfSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGpzb247XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgb2YgYSBzaW5nbGUgUmF5bWFyY2hpbmdDb21wb25lbnQuXG4gKlxuICogRWFjaCBjb21wb25lbnQgb3ducyBhIG1hdGVyaWFsIGFuZCBhIGJ1ZmZlci1sZXNzIGZ1bGwtc2NyZWVuIHBhc3MgKHNlZVxuICogYEZvcndhcmRSZW5kZXJQaXBlbGluZS5zZXRSYXltYXJjaGluZ0NvbXBvbmVudE1hdGVyaWFsYCksIHNvIGl0cyB1bmlmb3JtcyBhbmRcbiAqIHRleHR1cmVzIGFyZSBpbmRlcGVuZGVudDogbmFtZXMgYXJlIG5vdCBwb3N0Zml4ZWQsIGFuZCB0aGUgdGV4dHVyZS1zbG90IGxpbWl0XG4gKiBhcHBsaWVzIHRvIHRoZSBjb21wb25lbnQncyBvd24gZ3JhcGggaW5zdGVhZCBvZiB0aGUgbWVyZ2VkIGdyYXBoIG9mIGV2ZXJ5XG4gKiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAqIEBwYXJhbSBjb21wb25lbnQgLSBUaGUgY29tcG9uZW50IHRoYXQgb3ducyB0aGUgbWF0ZXJpYWxcbiAqIEBwYXJhbSBjdXJyZW50TWF0ZXJpYWwgLSBBbiBleGlzdGluZyBtYXRlcmlhbCBvZiB0aGUgc2FtZSBjb21wb25lbnQgdGhhdCBjYW4gYmUgcmV1c2VkXG4gKiBAcmV0dXJucyBUaGUgbWF0ZXJpYWwgYW5kIGZlYXR1cmUgZmxhZ3MsIG9yIHVuZGVmaW5lZCB3aGVuIGdlbmVyYXRpb24gZmFpbHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVCYXNlZFJheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWwoXG4gIGVuZ2luZTogRW5naW5lLFxuICBjb21wb25lbnQ6IFJheW1hcmNoaW5nQ29tcG9uZW50LFxuICBjdXJyZW50TWF0ZXJpYWw/OiBNYXRlcmlhbFxuKTogTm9kZUJhc2VkTWF0ZXJpYWxSZXN1bHQgfCB1bmRlZmluZWQge1xuICBjb25zdCBqc29uID0gY3JlYXRlUmF5bWFyY2hpbmdDb21wb25lbnRTaGFkZXJKc29uKGNvbXBvbmVudCk7XG4gIHJldHVybiBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ0N1c3RvbU1hdGVyaWFsKGVuZ2luZSwganNvbiBhcyB1bmtub3duIGFzIFNoYWRlck5vZGVKc29uLCBjdXJyZW50TWF0ZXJpYWwpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIFNERiBzaGFkb3cgY2FzdGVyIG1hdGVyaWFsIG9mIGEgc2luZ2xlIFJheW1hcmNoaW5nQ29tcG9uZW50LlxuICpcbiAqIExpa2UgdGhlIHZpc2libGUgcGVyLWNvbXBvbmVudCBtYXRlcmlhbCwgdGhlIGNvbXBvbmVudCdzIGdyYXBoIGlzIHVzZWQgYXMgYXV0aG9yZWRcbiAqICh3aXRoIGl0cyB3b3JsZCBtYXRyaXggbm9ybWFsaXplZCB0byBvbmUgc2VtYW50aWMpLCBzbyBzaGFkb3cgY2FzdGVycyBhcmUgbm8gbG9uZ2VyXG4gKiBvbmUgbWVyZ2VkIG1hdGVyaWFsOiBlYWNoIGNvbXBvbmVudCBrZWVwcyBpdHMgb3duIHRleHR1cmVzIGFuZCB1bmlmb3JtcyBpbiB0aGVcbiAqIHNoYWRvdyBtYXBzIHRvbywgYW5kIHRoZSB0ZXh0dXJlLXNsb3QgbGltaXQgYXBwbGllcyBwZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gKiBAcGFyYW0gY29tcG9uZW50IC0gVGhlIGNhc3RTaGFkb3cgY29tcG9uZW50IHRoZSBtYXRlcmlhbCByZW5kZXJzXG4gKiBAcGFyYW0ga2luZCAtIFdoaWNoIHNoYWRvdyBtYXAgdmFyaWFudCB0aGUgbWF0ZXJpYWwgd3JpdGVzXG4gKiBAcGFyYW0gY3VycmVudE1hdGVyaWFsIC0gQW4gZXhpc3RpbmcgbWF0ZXJpYWwgb2YgdGhlIHNhbWUgY29tcG9uZW50IHRoYXQgY2FuIGJlIHJldXNlZFxuICogQHJldHVybnMgVGhlIHNoYWRvdyBjYXN0ZXIgbWF0ZXJpYWwsIG9yIHVuZGVmaW5lZCB3aGVuIGdlbmVyYXRpb24gZmFpbHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVCYXNlZFJheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93TWF0ZXJpYWwoXG4gIGVuZ2luZTogRW5naW5lLFxuICBjb21wb25lbnQ6IFJheW1hcmNoaW5nQ29tcG9uZW50LFxuICBraW5kOiBSYXltYXJjaGluZ1NoYWRvd1NoYWRlclBhcnRLaW5kLFxuICBjdXJyZW50TWF0ZXJpYWw/OiBNYXRlcmlhbFxuKTogTWF0ZXJpYWwgfCB1bmRlZmluZWQge1xuICBjb25zdCBqc29uID0gY3JlYXRlUmF5bWFyY2hpbmdDb21wb25lbnRTaGFkZXJKc29uKGNvbXBvbmVudCk7XG4gIHJldHVybiBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ1NoYWRvd01hdGVyaWFsKGVuZ2luZSwganNvbiBhcyB1bmtub3duIGFzIFNoYWRlck5vZGVKc29uLCBraW5kLCBjdXJyZW50TWF0ZXJpYWwpO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsNkJBQTZCO0FBQ3RDO0FBQUEsRUFDRTtBQUFBLE9BRUs7QUFFUCxTQUFTLDhCQUE4QjtBQUN2QyxTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUVoQyxTQUFTLGtCQUFrQjtBQUUzQixTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGNBQWM7QUFDdkIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGVBQWU7QUFFeEIsU0FBUyx3QkFBd0I7QUFDakM7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsT0FDSztBQVFBLFNBQVMsOEJBQThCLDhCQUFxRDtBQUNqRywrQkFBNkIsS0FBSztBQUFBLElBQ2hDLFVBQVU7QUFBQSxJQUNWLGVBQWUsY0FBYztBQUFBLElBQzdCLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUNqQyxPQUFPLFdBQVc7QUFBQSxJQUNsQixjQUFjLFFBQVEsVUFBVSxLQUFLLEtBQUssS0FBSyxDQUFHO0FBQUEsSUFDbEQsS0FBSztBQUFBLElBQ0wsS0FBSyxPQUFPO0FBQUEsRUFDZCxDQUFDO0FBQ0QsK0JBQTZCLEtBQUs7QUFBQSxJQUNoQyxVQUFVO0FBQUEsSUFDVixlQUFlLGNBQWM7QUFBQSxJQUM3QixpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDakMsT0FBTyxXQUFXO0FBQUEsSUFDbEIsY0FBYyxPQUFPLGVBQWUsQ0FBRztBQUFBLElBQ3ZDLEtBQUs7QUFBQSxJQUNMLEtBQUs7QUFBQSxFQUNQLENBQUM7QUFDRCwrQkFBNkIsS0FBSztBQUFBLElBQ2hDLFVBQVU7QUFBQSxJQUNWLGVBQWUsY0FBYztBQUFBLElBQzdCLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUNqQyxPQUFPLFdBQVc7QUFBQSxJQUNsQixjQUFjLE9BQU8sZUFBZSxHQUFHO0FBQUEsSUFDdkMsS0FBSztBQUFBLElBQ0wsS0FBSztBQUFBLEVBQ1AsQ0FBQztBQUNELCtCQUE2QixLQUFLO0FBQUEsSUFDaEMsVUFBVTtBQUFBLElBQ1YsZUFBZSxjQUFjO0FBQUEsSUFDN0IsaUJBQWlCLGdCQUFnQjtBQUFBLElBQ2pDLE9BQU8sV0FBVztBQUFBLElBQ2xCLGNBQWMsUUFBUSxVQUFVLEdBQUssR0FBSyxDQUFHO0FBQUEsSUFDN0MsS0FBSztBQUFBLElBQ0wsS0FBSyxPQUFPO0FBQUEsRUFDZCxDQUFDO0FBQ0QsK0JBQTZCLEtBQUs7QUFBQSxJQUNoQyxVQUFVO0FBQUEsSUFDVixlQUFlLGNBQWM7QUFBQSxJQUM3QixpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDakMsT0FBTyxXQUFXO0FBQUEsSUFDbEIsY0FBYyxPQUFPLGVBQWUsQ0FBRztBQUFBLElBQ3ZDLEtBQUs7QUFBQSxJQUNMLEtBQUssT0FBTztBQUFBLEVBQ2QsQ0FBQztBQUNELCtCQUE2QixLQUFLO0FBQUEsSUFDaEMsVUFBVTtBQUFBLElBQ1YsZUFBZSxjQUFjO0FBQUEsSUFDN0IsaUJBQWlCLGdCQUFnQjtBQUFBLElBQ2pDLE9BQU8sV0FBVztBQUFBLElBQ2xCLGNBQWMsT0FBTyxlQUFlLEdBQUc7QUFBQSxJQUN2QyxLQUFLO0FBQUEsSUFDTCxLQUFLLE9BQU87QUFBQSxFQUNkLENBQUM7QUFDRCwrQkFBNkIsS0FBSztBQUFBLElBQ2hDLFVBQVU7QUFBQSxJQUNWLGVBQWUsY0FBYztBQUFBLElBQzdCLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUNqQyxPQUFPLFdBQVc7QUFBQSxJQUNsQixjQUFjLE9BQU8sZUFBZSxDQUFHO0FBQUEsSUFDdkMsS0FBSztBQUFBLElBQ0wsS0FBSyxPQUFPO0FBQUEsRUFDZCxDQUFDO0FBQ0QsK0JBQTZCLEtBQUs7QUFBQSxJQUNoQyxVQUFVO0FBQUEsSUFDVixlQUFlLGNBQWM7QUFBQSxJQUM3QixpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDakMsT0FBTyxXQUFXO0FBQUEsSUFDbEIsY0FBYyxRQUFRLFVBQVUsR0FBSyxHQUFLLENBQUc7QUFBQSxJQUM3QyxLQUFLO0FBQUEsSUFDTCxLQUFLLE9BQU87QUFBQSxFQUNkLENBQUM7QUFDSDtBQWFPLFNBQVMsaUNBQWlDLFFBQWdCLDhCQUFxRDtBQUNwSCxRQUFNLGNBQWMsaUJBQWlCLFFBQVE7QUFBQSxJQUMzQyxXQUFXLGlCQUFpQjtBQUFBLElBQzVCLFdBQVcsaUJBQWlCO0FBQUEsSUFDNUIsT0FBTyxpQkFBaUI7QUFBQSxJQUN4QixPQUFPLGlCQUFpQjtBQUFBLElBQ3hCLE9BQU8saUJBQWlCO0FBQUEsRUFDMUIsQ0FBQztBQUNELFFBQU0sUUFBUSxXQUFXO0FBRXpCLCtCQUE2QixLQUFLO0FBQUEsSUFDaEMsVUFBVTtBQUFBLElBQ1YsZUFBZSxjQUFjO0FBQUEsSUFDN0IsaUJBQWlCLGdCQUFnQjtBQUFBLElBQ2pDO0FBQUEsSUFDQSxjQUFjLENBQUMsSUFBSSxPQUFPLGNBQWMsdUJBQXVCLFdBQVc7QUFBQSxJQUMxRSxLQUFLO0FBQUEsSUFDTCxLQUFLLE9BQU87QUFBQSxFQUNkLENBQUM7QUFDRCwrQkFBNkIsS0FBSztBQUFBLElBQ2hDLFVBQVU7QUFBQSxJQUNWLGVBQWUsY0FBYztBQUFBLElBQzdCLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUNqQztBQUFBLElBQ0EsY0FBYyxDQUFDLElBQUksT0FBTyxjQUFjLHVCQUF1QixXQUFXO0FBQUEsSUFDMUUsS0FBSztBQUFBLElBQ0wsS0FBSyxPQUFPO0FBQUEsRUFDZCxDQUFDO0FBQ0QsK0JBQTZCLEtBQUs7QUFBQSxJQUNoQyxVQUFVO0FBQUEsSUFDVixlQUFlLGNBQWM7QUFBQSxJQUM3QixpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDakM7QUFBQSxJQUNBLGNBQWMsT0FBTyxlQUFlLENBQUM7QUFBQSxJQUNyQyxLQUFLO0FBQUEsSUFDTCxLQUFLLE9BQU87QUFBQSxFQUNkLENBQUM7QUFHRCwrQkFBNkIsS0FBSztBQUFBLElBQ2hDLFVBQVU7QUFBQSxJQUNWLGVBQWUsY0FBYztBQUFBLElBQzdCLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUNqQztBQUFBLElBQ0EsY0FBYyxRQUFRLFVBQVUsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUFBLElBQzFDLEtBQUs7QUFBQSxJQUNMLEtBQUssT0FBTztBQUFBLEVBQ2QsQ0FBQztBQUNELCtCQUE2QixLQUFLO0FBQUEsSUFDaEMsVUFBVTtBQUFBLElBQ1YsZUFBZSxjQUFjO0FBQUEsSUFDN0IsaUJBQWlCLGdCQUFnQjtBQUFBLElBQ2pDO0FBQUEsSUFDQSxjQUFjLFFBQVEsVUFBVSxHQUFHLENBQUM7QUFBQSxJQUNwQyxLQUFLO0FBQUEsSUFDTCxLQUFLLE9BQU87QUFBQSxFQUNkLENBQUM7QUFDSDtBQUVPLFNBQVMscUNBQXFDLGdCQUFnQztBQXRMckY7QUF1TEUsUUFBTSwrQkFBc0QsQ0FBQztBQUM3RCxRQUFNLGlCQUFpQixvQkFBSSxJQUFZO0FBQ3ZDLGFBQVcsUUFBUSxlQUFlLE9BQU87QUFDdkMsUUFBSSxLQUFLLFNBQVMsd0JBQXdCLEtBQUssU0FBUyxLQUFLLE9BQU87QUFHbEUsVUFBSSxlQUFlLElBQUksS0FBSyxTQUFTLEtBQUssS0FBSyxHQUFHO0FBQ2hEO0FBQUEsTUFDRjtBQUNBLHFCQUFlLElBQUksS0FBSyxTQUFTLEtBQUssS0FBSztBQUMzQyxtQ0FBNkIsS0FBSztBQUFBLFFBQ2hDLFVBQVUsS0FBSyxTQUFTLEtBQUs7QUFBQSxRQUM3QixlQUFlLGNBQWM7QUFBQSxRQUM3QixpQkFBaUIsZ0JBQWdCO0FBQUEsUUFDakMsT0FBTyxXQUFXO0FBQUEsUUFDbEIsY0FBYyxTQUFTLG1CQUFtQixHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQUEsUUFDeEYsS0FBSztBQUFBLFFBQ0wsS0FBSyxPQUFPO0FBQUEsTUFDZCxDQUFDO0FBQUEsSUFDSDtBQUdBLFFBQUksS0FBSyxTQUFTLCtCQUE2QixnQkFBSyxhQUFMLG1CQUFlLFNBQWYsbUJBQXFCLFFBQU87QUFDekUsVUFBSSxlQUFlLElBQUksS0FBSyxTQUFTLEtBQUssS0FBSyxHQUFHO0FBQ2hEO0FBQUEsTUFDRjtBQUNBLHFCQUFlLElBQUksS0FBSyxTQUFTLEtBQUssS0FBSztBQUMzQyxtQ0FBNkIsS0FBSztBQUFBLFFBQ2hDLFVBQVUsS0FBSyxTQUFTLEtBQUs7QUFBQSxRQUM3QixlQUFlLGNBQWM7QUFBQSxRQUM3QixpQkFBaUIsZ0JBQWdCO0FBQUEsUUFDakMsT0FBTyxXQUFXO0FBQUEsUUFDbEIsY0FBYyxPQUFPLGVBQWUsQ0FBQztBQUFBLFFBQ3JDLEtBQUs7QUFBQSxRQUNMLEtBQUssT0FBTztBQUFBLE1BQ2QsQ0FBQztBQUFBLElBQ0g7QUFJQSxVQUFNLGVBQWMsZ0JBQUssYUFBTCxtQkFBZSxTQUFmLG1CQUFxQjtBQUN6QyxRQUFJLE9BQU8sZ0JBQWdCLFlBQVksWUFBWSxTQUFTLEdBQUc7QUFDN0QsVUFBSSxLQUFLLFNBQVMsd0JBQXdCLENBQUMsZUFBZSxJQUFJLFdBQVcsR0FBRztBQUMxRSx1QkFBZSxJQUFJLFdBQVc7QUFDOUIscUNBQTZCLEtBQUs7QUFBQSxVQUNoQyxVQUFVO0FBQUEsVUFDVixlQUFlLGNBQWM7QUFBQSxVQUM3QixpQkFBaUIsZ0JBQWdCO0FBQUEsVUFDakMsT0FBTyxXQUFXO0FBQUEsVUFDbEIsY0FBYyxPQUFPLGdCQUFlLHNCQUFLLGFBQUwsbUJBQWUsaUJBQWYsbUJBQTZCLFVBQTdCLFlBQXNDLENBQUM7QUFBQSxVQUMzRSxLQUFLO0FBQUEsVUFDTCxLQUFLLE9BQU87QUFBQSxRQUNkLENBQUM7QUFBQSxNQUNILFdBQVcsS0FBSyxTQUFTLHlCQUF5QixDQUFDLGVBQWUsSUFBSSxXQUFXLEdBQUc7QUFDbEYsdUJBQWUsSUFBSSxXQUFXO0FBQzlCLHFDQUE2QixLQUFLO0FBQUEsVUFDaEMsVUFBVTtBQUFBLFVBQ1YsZUFBZSxjQUFjO0FBQUEsVUFDN0IsaUJBQWlCLGdCQUFnQjtBQUFBLFVBQ2pDLE9BQU8sV0FBVztBQUFBLFVBQ2xCLGNBQWMsUUFBUSxXQUFVLHNCQUFLLGFBQUwsbUJBQWUsYUFBZixtQkFBeUIsVUFBekIsWUFBa0MsSUFBRyxzQkFBSyxhQUFMLG1CQUFlLGFBQWYsbUJBQXlCLFVBQXpCLFlBQWtDLENBQUM7QUFBQSxVQUN4RyxLQUFLO0FBQUEsVUFDTCxLQUFLLE9BQU87QUFBQSxRQUNkLENBQUM7QUFBQSxNQUNILFdBQVcsS0FBSyxTQUFTLHlCQUF5QixDQUFDLGVBQWUsSUFBSSxXQUFXLEdBQUc7QUFDbEYsdUJBQWUsSUFBSSxXQUFXO0FBQzlCLHFDQUE2QixLQUFLO0FBQUEsVUFDaEMsVUFBVTtBQUFBLFVBQ1YsZUFBZSxjQUFjO0FBQUEsVUFDN0IsaUJBQWlCLGdCQUFnQjtBQUFBLFVBQ2pDLE9BQU8sV0FBVztBQUFBLFVBQ2xCLGNBQWMsUUFBUTtBQUFBLGFBQ3BCLHNCQUFLLGFBQUwsbUJBQWUsYUFBZixtQkFBeUIsVUFBekIsWUFBa0M7QUFBQSxhQUNsQyxzQkFBSyxhQUFMLG1CQUFlLGFBQWYsbUJBQXlCLFVBQXpCLFlBQWtDO0FBQUEsYUFDbEMsc0JBQUssYUFBTCxtQkFBZSxhQUFmLG1CQUF5QixVQUF6QixZQUFrQztBQUFBLFVBQ3BDO0FBQUEsVUFDQSxLQUFLO0FBQUEsVUFDTCxLQUFLLE9BQU87QUFBQSxRQUNkLENBQUM7QUFBQSxNQUNILFdBQVcsS0FBSyxTQUFTLHlCQUF5QixDQUFDLGVBQWUsSUFBSSxXQUFXLEdBQUc7QUFDbEYsdUJBQWUsSUFBSSxXQUFXO0FBQzlCLHFDQUE2QixLQUFLO0FBQUEsVUFDaEMsVUFBVTtBQUFBLFVBQ1YsZUFBZSxjQUFjO0FBQUEsVUFDN0IsaUJBQWlCLGdCQUFnQjtBQUFBLFVBQ2pDLE9BQU8sV0FBVztBQUFBLFVBQ2xCLGNBQWMsUUFBUTtBQUFBLGFBQ3BCLHNCQUFLLGFBQUwsbUJBQWUsYUFBZixtQkFBeUIsVUFBekIsWUFBa0M7QUFBQSxhQUNsQyxzQkFBSyxhQUFMLG1CQUFlLGFBQWYsbUJBQXlCLFVBQXpCLFlBQWtDO0FBQUEsYUFDbEMsc0JBQUssYUFBTCxtQkFBZSxhQUFmLG1CQUF5QixVQUF6QixZQUFrQztBQUFBLGFBQ2xDLHNCQUFLLGFBQUwsbUJBQWUsYUFBZixtQkFBeUIsVUFBekIsWUFBa0M7QUFBQSxVQUNwQztBQUFBLFVBQ0EsS0FBSztBQUFBLFVBQ0wsS0FBSyxPQUFPO0FBQUEsUUFDZCxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0EsU0FBTztBQUNUO0FBV08sU0FBUywrQkFBK0IsOEJBQXFEO0FBQ2xHLFFBQU0sWUFBWTtBQUNsQiwrQkFBNkIsS0FBSztBQUFBLElBQ2hDLFVBQVU7QUFBQSxJQUNWLGVBQWUsY0FBYztBQUFBLElBQzdCLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUNqQyxPQUFPLFdBQVc7QUFBQSxJQUNsQixjQUFjLFFBQVEsVUFBVSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsU0FBUztBQUFBLElBQ2xFLEtBQUssQ0FBQyxPQUFPO0FBQUEsSUFDYixLQUFLLE9BQU87QUFBQSxFQUNkLENBQUM7QUFDRCwrQkFBNkIsS0FBSztBQUFBLElBQ2hDLFVBQVU7QUFBQSxJQUNWLGVBQWUsY0FBYztBQUFBLElBQzdCLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUNqQyxPQUFPLFdBQVc7QUFBQSxJQUNsQixjQUFjLFFBQVEsVUFBVSxXQUFXLFdBQVcsU0FBUztBQUFBLElBQy9ELEtBQUssQ0FBQyxPQUFPO0FBQUEsSUFDYixLQUFLLE9BQU87QUFBQSxFQUNkLENBQUM7QUFDSDtBQVVPLFNBQVMsNkJBQTZCLGdCQUFnQztBQUMzRSxRQUFNLFFBQVEsZUFBZTtBQUM3QixRQUFNLGNBQWMsZUFBZTtBQUduQyxNQUFJLFNBQVMsUUFBUSxlQUFlLE1BQU07QUFDeEMsV0FBTztBQUFBLE1BQ0wsa0JBQWtCO0FBQUEsTUFDbEIsYUFBYTtBQUFBLE1BQ2IsYUFBYTtBQUFBLE1BQ2IsU0FBUztBQUFBLE1BQ1QsZUFBZTtBQUFBLE1BQ2YsY0FBYztBQUFBLE1BQ2QsdUJBQXVCO0FBQUEsTUFDdkIsWUFBWTtBQUFBLE1BQ1osZ0JBQWdCO0FBQUEsTUFDaEIsVUFBVTtBQUFBLE1BQ1YsY0FBYztBQUFBLElBQ2hCO0FBQUEsRUFDRjtBQUVBLFFBQU0sV0FBVyxDQUFDLFNBQWlCLE1BQU0sS0FBSyxVQUFRLEtBQUssU0FBUyxJQUFJO0FBQ3hFLFFBQU0sZ0JBQWdCLENBQUMsY0FBc0IsYUFDM0MsWUFBWSxLQUFLLGdCQUFjLFdBQVcsR0FBRyxPQUFPLGdCQUFnQixXQUFXLEdBQUcsYUFBYSxRQUFRO0FBRXpHLFFBQU0sZ0JBQWdCLFNBQVMsV0FBVztBQUMxQyxRQUFNLGtCQUFrQixTQUFTLGdCQUFnQjtBQUVqRCxRQUFNLG1CQUFtQixDQUFDLFlBQW9CLGFBQXFCO0FBL1ZyRTtBQWdXSSxRQUFJLGlCQUFpQixLQUFNLFFBQU87QUFDbEMsVUFBTSxhQUFhLGNBQWMsY0FBYyxJQUFJLFFBQVE7QUFDM0QsUUFBSSxjQUFjLEtBQU0sUUFBTztBQUMvQixhQUFPLFdBQU0sS0FBSyxVQUFRLEtBQUssT0FBTyxXQUFXLEtBQUssRUFBRSxNQUFqRCxtQkFBb0QsVUFBUztBQUFBLEVBQ3RFO0FBSUEsUUFBTSxvQkFBb0IsTUFBTTtBQXhXbEM7QUF5V0ksUUFBSSxpQkFBaUIsUUFBUSxtQkFBbUIsS0FBTSxRQUFPO0FBQzdELFVBQU0sbUJBQW1CLGNBQWMsZ0JBQWdCLElBQUksZUFBZTtBQUMxRSxRQUFJLG9CQUFvQixLQUFNLFFBQU87QUFDckMsVUFBTSxhQUFhLE1BQU0sS0FBSyxVQUFRLEtBQUssT0FBTyxpQkFBaUIsS0FBSyxFQUFFO0FBQzFFLFNBQUkseUNBQVksVUFBUyxZQUFhLFFBQU87QUFDN0MsYUFBTyxtQkFBYyxjQUFjLElBQUksZUFBZSxNQUEvQyxtQkFBa0QsS0FBSyxRQUFPLGdCQUFnQjtBQUFBLEVBQ3ZGLEdBQUc7QUFFSCxRQUFNLGNBQWMsaUJBQWlCLHFCQUFxQixnQkFBZ0I7QUFDMUUsUUFBTSxjQUFjLGlCQUFpQixxQkFBcUIsZ0JBQWdCO0FBQzFFLFFBQU0sVUFBVSxpQkFBaUIsaUJBQWlCLFlBQVk7QUFDOUQsUUFBTSxnQkFBZ0IsaUJBQWlCLHVCQUF1QixrQkFBa0I7QUFDaEYsUUFBTSxlQUFlLGlCQUFpQixzQkFBc0IsaUJBQWlCO0FBQzdFLFFBQU0sd0JBQXdCLGlCQUFpQiwrQkFBK0IsMEJBQTBCO0FBQ3hHLFFBQU0sYUFBYSxpQkFBaUIsb0JBQW9CLGVBQWU7QUFDdkUsUUFBTSxXQUFXLGlCQUFpQixrQkFBa0IsYUFBYTtBQUdqRSxRQUFNLGlCQUFpQixpQkFBaUIsUUFBUSxjQUFjLGNBQWMsSUFBSSxjQUFjLEtBQUs7QUFDbkcsUUFBTSxlQUFlLGlCQUFpQixRQUFRLGNBQWMsY0FBYyxJQUFJLFlBQVksS0FBSztBQUUvRixTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQ0Y7QUFTTyxTQUFTLHlDQUNkLFFBQ0EsZ0JBQ0EsaUJBQ3FDO0FBQ3JDLFFBQU0sd0JBQXdCLElBQUksc0JBQXNCO0FBQ3hELFFBQU0sYUFBYSxvQkFBb0IsMkJBQTJCLFFBQVEsZ0JBQWdCLHFCQUFxQjtBQUUvRyxNQUFJLENBQUMsWUFBWTtBQUNmLFdBQU87QUFBQSxFQUNUO0FBRUEsUUFBTSwrQkFBK0IscUNBQXFDLGNBQWM7QUFDeEYsaUNBQStCLDRCQUE0QjtBQUkzRCxtQ0FBaUMsUUFBUSw0QkFBNEI7QUFDckUsZ0NBQThCLDRCQUE0QjtBQUUxRCwrQkFBNkIsS0FBSyxHQUFHLHlCQUF5QixRQUFRLFdBQVcsWUFBWSxDQUFDO0FBRTlGLFFBQU0sY0FBYyw2QkFBNkIsY0FBYztBQUMvRCxNQUFJLFlBQVksU0FBUztBQUd2Qiw0QkFBd0IsUUFBUSw4QkFBOEIsRUFBRSwyQkFBMkIsTUFBTSxDQUFDO0FBQUEsRUFDcEc7QUFDQSxNQUFJLFlBQVksZ0JBQWdCO0FBSTlCLFFBQUksQ0FBQyw2QkFBNkIsS0FBSyxVQUFRLEtBQUssYUFBYSxtQkFBbUIsR0FBRztBQUNyRix1Q0FBaUMsUUFBUSw4QkFBOEIsV0FBVyxXQUFXO0FBQUEsSUFDL0Y7QUFBQSxFQUNGO0FBQ0EsUUFBTSxXQUFXO0FBQUEsSUFDZjtBQUFBLElBQ0EsV0FBVztBQUFBLElBQ1gsV0FBVztBQUFBLElBQ1g7QUFBQSxNQUNFLFlBQVk7QUFBQSxNQUNaLE9BQU87QUFBQTtBQUFBO0FBQUEsTUFHUCxVQUFVO0FBQUEsTUFDVixrQkFBa0IsWUFBWTtBQUFBLE1BQzlCLGFBQWEsWUFBWTtBQUFBLE1BQ3pCLGFBQWEsWUFBWTtBQUFBLE1BQ3pCLFNBQVMsWUFBWTtBQUFBLE1BQ3JCLGVBQWUsWUFBWTtBQUFBLE1BQzNCLGNBQWMsWUFBWTtBQUFBLE1BQzFCLHVCQUF1QixZQUFZO0FBQUEsTUFDbkMsWUFBWSxZQUFZO0FBQUEsTUFDeEIsZ0JBQWdCLFlBQVk7QUFBQSxNQUM1QixVQUFVLFlBQVk7QUFBQSxNQUN0QixjQUFjLFlBQVk7QUFBQSxNQUMxQjtBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUdBLFdBQVMsaUJBQWlCO0FBRTFCLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQSxrQkFBa0I7QUFBQSxJQUNsQixzQkFBc0I7QUFBQSxFQUN4QjtBQUNGO0FBNkJPLFNBQVMsMENBQ2QsUUFDQSxnQkFDQSxrQkFDd0M7QUFDeEMsUUFBTSxVQUFVO0FBQUEsSUFDZDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxxREFBa0I7QUFBQSxFQUNwQjtBQUNBLFFBQU0sa0JBQWtCO0FBQUEsSUFDdEI7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0EscURBQWtCO0FBQUEsRUFDcEI7QUFDQSxRQUFNLGlCQUFpQjtBQUFBLElBQ3JCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBLHFEQUFrQjtBQUFBLEVBQ3BCO0FBQ0EsTUFBSSxXQUFXLFFBQVEsbUJBQW1CLFFBQVEsa0JBQWtCLE1BQU07QUFDeEUsV0FBTztBQUFBLEVBQ1Q7QUFDQSxTQUFPLEVBQUUsU0FBUyxpQkFBaUIsZUFBZTtBQUNwRDtBQUVPLFNBQVMseUNBQ2QsUUFDQSxnQkFDQSxNQUNBLGlCQUNzQjtBQUN0QixRQUFNLGFBQWEsSUFBSSw0QkFBNEIsSUFBSTtBQUN2RCxRQUFNLGFBQWEsb0JBQW9CLDJCQUEyQixRQUFRLGdCQUFnQixZQUFZO0FBQUEsSUFDcEc7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBQ0QsTUFBSSxDQUFDLFlBQVk7QUFDZixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sK0JBQStCLHFDQUFxQyxjQUFjO0FBQ3hGLGlDQUErQiw0QkFBNEI7QUFFM0QsK0JBQTZCLEtBQUssR0FBRyx5QkFBeUIsUUFBUSxXQUFXLFlBQVksQ0FBQztBQUM5RixNQUFJLFNBQVMsV0FBVztBQUd0QixpQ0FBNkIsS0FBSztBQUFBLE1BQ2hDLFVBQVU7QUFBQSxNQUNWLGVBQWUsY0FBYztBQUFBLE1BQzdCLGlCQUFpQixnQkFBZ0I7QUFBQSxNQUNqQyxPQUFPLFdBQVc7QUFBQSxNQUNsQixjQUFjLE9BQU8sZUFBZSxDQUFDO0FBQUEsTUFDckMsS0FBSztBQUFBLE1BQ0wsS0FBSyxPQUFPO0FBQUEsSUFDZCxDQUFDO0FBQ0QsaUNBQTZCLEtBQUs7QUFBQSxNQUNoQyxVQUFVO0FBQUEsTUFDVixlQUFlLGNBQWM7QUFBQSxNQUM3QixpQkFBaUIsZ0JBQWdCO0FBQUEsTUFDakMsT0FBTyxXQUFXO0FBQUEsTUFDbEIsY0FBYyxPQUFPLGVBQWUsR0FBSTtBQUFBLE1BQ3hDLEtBQUs7QUFBQSxNQUNMLEtBQUssT0FBTztBQUFBLElBQ2QsQ0FBQztBQUFBLEVBQ0g7QUFFQSxRQUFNLFdBQVc7QUFBQSxJQUNmO0FBQUEsSUFDQSxXQUFXO0FBQUEsSUFDWCxXQUFXO0FBQUEsSUFDWDtBQUFBLE1BQ0UsWUFBWTtBQUFBLE1BQ1osT0FBTztBQUFBLE1BQ1AsVUFBVTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFFQSxNQUFJLFNBQVMsbUJBQW1CO0FBQzlCLGFBQVMsaUJBQWlCLENBQUMsTUFBTSxNQUFNLE9BQU8sS0FBSztBQUFBLEVBQ3JELFdBQVcsU0FBUyxrQkFBa0I7QUFDcEMsYUFBUyxpQkFBaUIsQ0FBQyxPQUFPLE9BQU8sTUFBTSxJQUFJO0FBQUEsRUFDckQsT0FBTztBQUVMLGFBQVMsaUJBQWlCLENBQUMsTUFBTSxNQUFNLE9BQU8sS0FBSztBQUFBLEVBQ3JEO0FBRUEsV0FBUyxpQkFBaUI7QUFFMUIsU0FBTztBQUNUO0FBRU8sU0FBUyxlQUNkLFFBQ0EsRUFBRSxpQkFBaUIsTUFBTSxJQUFrQyxDQUFDLEdBQ2xEO0FBNWxCWjtBQTZsQkUsUUFBTSxtQkFBNkI7QUFBQSxJQUNqQyxPQUFPLENBQUM7QUFBQSxJQUNSLGFBQWEsQ0FBQztBQUFBLEVBQ2hCO0FBRUEsUUFBTSx3QkFBd0IsT0FBTyxvQkFBb0I7QUFBQSxJQUN2RCx1QkFBdUI7QUFBQSxFQUN6QjtBQUNBLGFBQVcsYUFBYSx1QkFBdUI7QUFDN0MsVUFBTSx1QkFBdUI7QUFDN0IsUUFBSSxrQkFBa0IsQ0FBQyxxQkFBcUIsWUFBWTtBQUd0RDtBQUFBLElBQ0Y7QUFDQSxVQUFNLFVBQVUscUJBQXFCO0FBS3JDLFVBQU0sU0FBUyxPQUFPLHFCQUFxQixZQUFZO0FBR3ZELFVBQU0sZ0JBQWdCLFFBQVEsTUFBTSxJQUFJLFVBQVE7QUFDOUMsWUFBTSxVQUFVLEVBQUUsR0FBRyxNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsS0FBSyxFQUFFLEdBQUc7QUFHckQsVUFBSSxLQUFLLFFBQVE7QUFDZixnQkFBUSxTQUFTLENBQUM7QUFDbEIsbUJBQVcsQ0FBQyxLQUFLLEtBQUssS0FBSyxPQUFPLFFBQVEsS0FBSyxNQUFNLEdBQUc7QUFDdEQsa0JBQVEsT0FBTyxHQUFHLElBQUksRUFBRSxHQUFHLE9BQU8sSUFBSSxHQUFHLE1BQU0sR0FBRyxNQUFNLEVBQUUsR0FBRztBQUFBLFFBQy9EO0FBQUEsTUFDRjtBQUdBLFVBQUksS0FBSyxTQUFTO0FBQ2hCLGdCQUFRLFVBQVUsQ0FBQztBQUNuQixtQkFBVyxDQUFDLEtBQUssTUFBTSxLQUFLLE9BQU8sUUFBUSxLQUFLLE9BQU8sR0FBRztBQUN4RCxrQkFBUSxRQUFRLEdBQUcsSUFBSSxFQUFFLEdBQUcsUUFBUSxJQUFJLEdBQUcsTUFBTSxHQUFHLE9BQU8sRUFBRSxHQUFHO0FBQUEsUUFDbEU7QUFBQSxNQUNGO0FBRUEsYUFBTztBQUFBLElBQ1QsQ0FBQztBQUtELFVBQU0sbUJBQW1CLG9CQUFJLElBQUk7QUFBQSxNQUMvQjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQztBQUNELGVBQVcsUUFBUSxlQUFlO0FBQ2hDLFVBQUksaUJBQWlCLElBQUksS0FBSyxJQUFJLEdBQUc7QUFDbkMsY0FBTSxRQUFPLGdCQUFLLGFBQUwsbUJBQWUsU0FBZixtQkFBcUI7QUFDbEMsWUFBSSxPQUFPLFNBQVMsWUFBWSxLQUFLLFNBQVMsR0FBRztBQUMvQyxlQUFLLFdBQVc7QUFBQSxZQUNkLElBQUksVUFBSyxhQUFMLFlBQWlCLENBQUM7QUFBQSxZQUN0QixNQUFNLEVBQUUsT0FBTyxHQUFHLElBQUksSUFBSSxxQkFBcUIsWUFBWSxHQUFHO0FBQUEsVUFDaEU7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFHQSxVQUFNLHNCQUFzQixRQUFRLFlBQVksSUFBSSxXQUFTO0FBQUEsTUFDM0QsR0FBRztBQUFBLE1BQ0gsSUFBSSxHQUFHLE1BQU0sR0FBRyxLQUFLLEVBQUU7QUFBQSxNQUN2QixNQUFNLEVBQUUsR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLE1BQU0sR0FBRyxLQUFLLEtBQUssRUFBRSxHQUFHO0FBQUEsTUFDckQsSUFBSSxFQUFFLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRyxNQUFNLEdBQUcsS0FBSyxHQUFHLEVBQUUsR0FBRztBQUFBLElBQ2pELEVBQUU7QUFLRixVQUFNLGlCQUFpQixHQUFHLE1BQU07QUFDaEMsVUFBTSxtQkFBbUIsR0FBRyxNQUFNO0FBQ2xDLFVBQU0sMkJBQTJCLGNBQWM7QUFBQSxNQUM3QyxXQUNHLEtBQUssU0FBUyxjQUFjLEtBQUssU0FBUyxrQkFDM0MsQ0FBQyxvQkFBb0IsS0FBSyxnQkFBYyxXQUFXLEdBQUcsT0FBTyxLQUFLLE1BQU0sV0FBVyxHQUFHLGFBQWEsVUFBVTtBQUFBLElBQ2pIO0FBQ0EsUUFBSSx5QkFBeUIsU0FBUyxHQUFHO0FBQ3ZDLG9CQUFjLEtBQUs7QUFBQSxRQUNqQixJQUFJO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixTQUFTO0FBQUEsVUFDUCxNQUFNLEVBQUUsSUFBSSxrQkFBa0IsT0FBTyxpQkFBaUIsUUFBUSxFQUFFLE1BQU0sZ0JBQWdCLEVBQUU7QUFBQSxRQUMxRjtBQUFBLFFBQ0EsUUFBUSxDQUFDO0FBQUEsUUFDVCxVQUFVLEVBQUUsTUFBTSxFQUFFLE9BQU8sb0JBQW9CLHFCQUFxQixZQUFZLEdBQUcsRUFBRTtBQUFBLFFBQ3JGLFVBQVUsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFO0FBQUEsTUFDekIsQ0FBQztBQUNELGlCQUFXLFlBQVksMEJBQTBCO0FBQy9DLDRCQUFvQixLQUFLO0FBQUEsVUFDdkIsSUFBSSxHQUFHLE1BQU0sc0JBQXNCLFNBQVMsRUFBRTtBQUFBLFVBQzlDLE1BQU0sRUFBRSxJQUFJLGdCQUFnQixVQUFVLE9BQU87QUFBQSxVQUM3QyxJQUFJLEVBQUUsSUFBSSxTQUFTLElBQUksVUFBVSxXQUFXO0FBQUEsUUFDOUMsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBU0EsVUFBTSwwQkFBb0MsQ0FBQztBQUMzQyxlQUFXLFFBQVEsZUFBZTtBQUNoQyxVQUFJLEtBQUssU0FBUyxzQkFBc0I7QUFDdEMsY0FBTSxRQUFPLGdCQUFLLGFBQUwsbUJBQWUsU0FBZixtQkFBcUI7QUFDbEMsWUFBSSxPQUFPLFNBQVMsWUFBWSxLQUFLLFNBQVMsR0FBRztBQUMvQyxrQ0FBd0IsS0FBSyxJQUFJO0FBQUEsUUFDbkM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFFBQUksd0JBQXdCLFNBQVMsR0FBRztBQUN0QyxpQkFBVyxRQUFRLGVBQWU7QUFDaEMsWUFBSSxLQUFLLFNBQVMsY0FBYyxLQUFLLFNBQVMsZUFBZTtBQUMzRDtBQUFBLFFBQ0Y7QUFDQSxhQUFLLFdBQVc7QUFBQSxVQUNkLElBQUksVUFBSyxhQUFMLFlBQWlCLENBQUM7QUFBQSxVQUN0Qiw0QkFBNEIsRUFBRSxPQUFPLENBQUMsR0FBRyx1QkFBdUIsRUFBRTtBQUFBLFFBQ3BFO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxxQkFBaUIsTUFBTSxLQUFLLEdBQUcsYUFBYTtBQUM1QyxxQkFBaUIsWUFBWSxLQUFLLEdBQUcsbUJBQW1CO0FBQUEsRUFDMUQ7QUFFQSxTQUFPO0FBQ1Q7QUFPTyxJQUFNLDhDQUE4QztBQWNwRCxTQUFTLHFDQUFxQyxXQUEyQztBQTN2QmhHO0FBNHZCRSxRQUFNLE9BQU8sS0FBSyxNQUFNLEtBQUssVUFBVSxVQUFVLE9BQU8sQ0FBQztBQUN6RCxNQUFJLGtCQUFrQjtBQUN0QixhQUFXLFFBQVEsS0FBSyxPQUFPO0FBQzdCLFFBQUksS0FBSyxTQUFTLHNCQUFzQjtBQUN0QyxXQUFLLFdBQVc7QUFBQSxRQUNkLElBQUksVUFBSyxhQUFMLFlBQWlCLENBQUM7QUFBQSxRQUN0QixNQUFNLEVBQUUsT0FBTyw0Q0FBNEM7QUFBQSxNQUM3RDtBQUNBLHdCQUFrQjtBQUFBLElBQ3BCO0FBQUEsRUFDRjtBQUNBLE1BQUksaUJBQWlCO0FBQ25CLGVBQVcsUUFBUSxLQUFLLE9BQU87QUFDN0IsVUFBSSxLQUFLLFNBQVMsY0FBYyxLQUFLLFNBQVMsZUFBZTtBQUMzRCxhQUFLLFdBQVc7QUFBQSxVQUNkLElBQUksVUFBSyxhQUFMLFlBQWlCLENBQUM7QUFBQSxVQUN0Qiw0QkFBNEIsRUFBRSxPQUFPLENBQUMsMkNBQTJDLEVBQUU7QUFBQSxRQUNyRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNBLFNBQU87QUFDVDtBQWdCTyxTQUFTLDRDQUNkLFFBQ0EsV0FDQSxpQkFDcUM7QUFDckMsUUFBTSxPQUFPLHFDQUFxQyxTQUFTO0FBQzNELFNBQU8seUNBQXlDLFFBQVEsTUFBbUMsZUFBZTtBQUM1RztBQWdCTyxTQUFTLGtEQUNkLFFBQ0EsV0FDQSxNQUNBLGlCQUNzQjtBQUN0QixRQUFNLE9BQU8scUNBQXFDLFNBQVM7QUFDM0QsU0FBTyx5Q0FBeUMsUUFBUSxNQUFtQyxNQUFNLGVBQWU7QUFDbEg7IiwKICAibmFtZXMiOiBbXQp9Cg==
