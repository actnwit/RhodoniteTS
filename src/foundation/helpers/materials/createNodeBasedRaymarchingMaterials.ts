import type { NodeJSON } from '../../../types';
import type { ShaderNodeJson } from '../../../types/ShaderNodeJson';
import { RaymarchingShaderPart } from '../../../webgl/shaders/RaymarchingShaderPart';
import {
  RaymarchingShadowShaderPart,
  type RaymarchingShadowShaderPartKind,
} from '../../../webgl/shaders/RaymarchingShadowShaderPart';
import type { RaymarchingComponent } from '../../components/Raymarching/RaymarchingComponent';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';
import { TextureParameter } from '../../definitions';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import type { Material } from '../../materials/core/Material';
import { ShaderGraphResolver } from '../../materials/core/ShaderGraphResolver';
import { Matrix44 } from '../../math/Matrix44';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import type { Engine } from '../../system/Engine';
import { getSharedSampler } from '../../textures/Sampler';
import {
  addBackBufferTextureSemanticInfo,
  addPbrSheenSemanticInfo,
  buildTextureSemanticInfo,
  type NodeBasedMaterialResult,
  reuseOrRecreateCustomMaterial,
} from './nodeBasedMaterialCommon';

/**
 * Adds the material parameters used by the fixed PBR shading of the raymarching
 * material (base color, metallic, roughness, emissive and the specular/F0 terms).
 *
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 */
export function addRaymarchingPbrSemanticInfo(additionalShaderSemanticInfo: ShaderSemanticsInfo[]) {
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchingBaseColor',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec4,
    stage: ShaderType.PixelShader,
    initialValue: Vector4.fromCopy4(0.8, 0.8, 0.8, 1.0),
    min: 0,
    max: Number.MAX_VALUE,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchingMetallic',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(0.0),
    min: 0,
    max: 1,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchingRoughness',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(0.5),
    min: 0,
    max: 1,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchingEmissive',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec3,
    stage: ShaderType.PixelShader,
    initialValue: Vector3.fromCopy3(0.0, 0.0, 0.0),
    min: 0,
    max: Number.MAX_VALUE,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchingEmissiveStrength',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(1.0),
    min: 0,
    max: Number.MAX_VALUE,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchingIor',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(1.5),
    min: 0,
    max: Number.MAX_VALUE,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchingSpecularWeight',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Scalar,
    stage: ShaderType.PixelShader,
    initialValue: Scalar.fromCopyNumber(1.0),
    min: 0,
    max: Number.MAX_VALUE,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchingSpecularColor',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec3,
    stage: ShaderType.PixelShader,
    initialValue: Vector3.fromCopy3(1.0, 1.0, 1.0),
    min: 0,
    max: Number.MAX_VALUE,
  });
}

/**
 * Adds the IBL semantics used by the PBR shading of the raymarching material.
 *
 * Unlike the mesh material IBL semantics, these are not internal settings: the
 * raymarching full-screen draw has no mesh renderer component, so the pipeline
 * sets the environment textures and parameters on the material directly and the
 * generic per-material upload path has to see them.
 *
 * The transmission back buffer texture is intentionally omitted (unused without
 * RN_USE_TRANSMISSION).
 */
export function addRaymarchingPbrIblSemanticInfo(engine: Engine, additionalShaderSemanticInfo: ShaderSemanticsInfo[]) {
  const cubeSampler = getSharedSampler(engine, {
    minFilter: TextureParameter.LinearMipmapLinear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
    wrapR: TextureParameter.ClampToEdge,
  });
  const stage = ShaderType.VertexAndPixelShader;

  additionalShaderSemanticInfo.push({
    semantic: 'diffuseEnvTexture',
    componentType: ComponentType.Int,
    compositionType: CompositionType.TextureCube,
    stage,
    initialValue: [-1, engine.dummyTextures.dummyBlackCubeTexture, cubeSampler],
    min: 0,
    max: Number.MAX_VALUE,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'specularEnvTexture',
    componentType: ComponentType.Int,
    compositionType: CompositionType.TextureCube,
    stage,
    initialValue: [-1, engine.dummyTextures.dummyBlackCubeTexture, cubeSampler],
    min: 0,
    max: Number.MAX_VALUE,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'inverseEnvironment',
    componentType: ComponentType.Bool,
    compositionType: CompositionType.Scalar,
    stage,
    initialValue: Scalar.fromCopyNumber(0),
    min: 0,
    max: Number.MAX_VALUE,
  });
  // y and z are the diffuse/specular contributions. Zero by default so that the
  // IBL work is skipped until the pipeline supplies an environment.
  additionalShaderSemanticInfo.push({
    semantic: 'iblParameter',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec4,
    stage,
    initialValue: Vector4.fromCopy4(1, 0, 0, 0),
    min: 0,
    max: Number.MAX_VALUE,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'hdriFormat',
    componentType: ComponentType.Int,
    compositionType: CompositionType.Vec2,
    stage,
    initialValue: Vector2.fromCopy2(0, 0),
    min: 0,
    max: Number.MAX_VALUE,
  });
}

export function addRaymarchingComponentSemanticsInfo(shaderNodeJson: ShaderNodeJson) {
  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];
  const addedSemantics = new Set<string>();
  for (const node of shaderNodeJson.nodes) {
    if (node.name === 'SdApplyWorldMatrix' && node.controls.name.value) {
      // A per-component material normalizes every world matrix node to one semantic
      // name, so the same name can appear on several nodes of the graph.
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
        max: Number.MAX_VALUE,
      });
    }
    // Only the injected per-component id node has a name control; the shading node
    // (used in the shading section) has none.
    if (node.name === 'RaymarchObjectIdUniform' && node.controls?.name?.value) {
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
        max: Number.MAX_VALUE,
      });
    }
    // Uniform nodes become one material parameter each. A per-component material
    // keeps the authored name, so the graph's uniforms are independent; the merged
    // graph postfixes them with the component SID in collectRrnJson.
    const uniformName = node.controls?.name?.value;
    if (typeof uniformName === 'string' && uniformName.length > 0) {
      if (node.name === 'UniformScalarFloat' && !addedSemantics.has(uniformName)) {
        addedSemantics.add(uniformName);
        additionalShaderSemanticInfo.push({
          semantic: uniformName,
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.PixelShader,
          initialValue: Scalar.fromCopyNumber(node.controls?.initialValue?.value ?? 0),
          min: 0,
          max: Number.MAX_VALUE,
        });
      } else if (node.name === 'UniformVector2Float' && !addedSemantics.has(uniformName)) {
        addedSemantics.add(uniformName);
        additionalShaderSemanticInfo.push({
          semantic: uniformName,
          componentType: ComponentType.Float,
          compositionType: CompositionType.Vec2,
          stage: ShaderType.PixelShader,
          initialValue: Vector2.fromCopy2(node.controls?.initialX?.value ?? 0, node.controls?.initialY?.value ?? 0),
          min: 0,
          max: Number.MAX_VALUE,
        });
      } else if (node.name === 'UniformVector3Float' && !addedSemantics.has(uniformName)) {
        addedSemantics.add(uniformName);
        additionalShaderSemanticInfo.push({
          semantic: uniformName,
          componentType: ComponentType.Float,
          compositionType: CompositionType.Vec3,
          stage: ShaderType.PixelShader,
          initialValue: Vector3.fromCopy3(
            node.controls?.initialX?.value ?? 0,
            node.controls?.initialY?.value ?? 0,
            node.controls?.initialZ?.value ?? 0
          ),
          min: 0,
          max: Number.MAX_VALUE,
        });
      } else if (node.name === 'UniformVector4Float' && !addedSemantics.has(uniformName)) {
        addedSemantics.add(uniformName);
        additionalShaderSemanticInfo.push({
          semantic: uniformName,
          componentType: ComponentType.Float,
          compositionType: CompositionType.Vec4,
          stage: ShaderType.PixelShader,
          initialValue: Vector4.fromCopy4(
            node.controls?.initialX?.value ?? 0,
            node.controls?.initialY?.value ?? 0,
            node.controls?.initialZ?.value ?? 0,
            node.controls?.initialW?.value ?? 1
          ),
          min: 0,
          max: Number.MAX_VALUE,
        });
      }
    }
  }
  return additionalShaderSemanticInfo;
}

/**
 * Adds the world-space AABB of the SDF used by the raymarch loop as a ray interval.
 *
 * The bounds are the conservative world AABB of the distance graph. The pipeline
 * replaces the defaults (an effectively unbounded box) per component; the shader
 * only marches inside the interval, so rays that miss the SDF exit immediately.
 *
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 */
export function addRaymarchingAabbSemanticInfo(additionalShaderSemanticInfo: ShaderSemanticsInfo[]) {
  const unbounded = 1e20;
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchAabbMin',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec3,
    stage: ShaderType.PixelShader,
    initialValue: Vector3.fromCopy3(-unbounded, -unbounded, -unbounded),
    min: -Number.MAX_VALUE,
    max: Number.MAX_VALUE,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'raymarchAabbMax',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec3,
    stage: ShaderType.PixelShader,
    initialValue: Vector3.fromCopy3(unbounded, unbounded, unbounded),
    min: -Number.MAX_VALUE,
    max: Number.MAX_VALUE,
  });
}

/**
 * Detects the PBR features the raymarching graph uses so that the material
 * enables the matching shader defines.
 *
 * Normal mapping additionally relies on the raymarching-specific getTBN variant
 * (RN_RAYMARCHING_SHADING), because the shading section runs in non-uniform
 * control flow where derivatives are not allowed.
 */
export function detectRaymarchingPbrFeatures(shaderNodeJson: ShaderNodeJson) {
  const nodes = shaderNodeJson.nodes as Array<{ id: string; name: string }> | undefined;
  const connections = shaderNodeJson.connections as
    | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
    | undefined;
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
      isDispersion: false,
    };
  }

  const findNode = (name: string) => nodes.find(node => node.name === name);
  const isConnectedTo = (targetNodeId: string, portName: string) =>
    connections.find(connection => connection.to.id === targetNodeId && connection.to.portName === portName);

  const pbrShaderNode = findNode('PbrShader');
  const normalPropsNode = findNode('PbrNormalProps');

  const isPropsConnected = (sourceName: string, portName: string) => {
    if (pbrShaderNode == null) return false;
    const connection = isConnectedTo(pbrShaderNode.id, portName);
    if (connection == null) return false;
    return nodes.find(node => node.id === connection.from.id)?.name === sourceName;
  };

  // A normal texture affects shading only when the normal props node samples a
  // Texture2D and feeds the PBR shader's normal.
  const useNormalTexture = (() => {
    if (pbrShaderNode == null || normalPropsNode == null) return false;
    const normalConnection = isConnectedTo(normalPropsNode.id, 'normalTexture');
    if (normalConnection == null) return false;
    const sourceNode = nodes.find(node => node.id === normalConnection.from.id);
    if (sourceNode?.name !== 'Texture2D') return false;
    return isConnectedTo(pbrShaderNode.id, 'normalInWorld')?.from.id === normalPropsNode.id;
  })();

  const isOcclusion = isPropsConnected('PbrOcclusionProps', 'occlusionProps');
  const isClearcoat = isPropsConnected('PbrClearcoatProps', 'clearcoatProps');
  const isSheen = isPropsConnected('PbrSheenProps', 'sheenProps');
  const isIridescence = isPropsConnected('PbrIridescenceProps', 'iridescenceProps');
  const isAnisotropy = isPropsConnected('PbrAnisotropyProps', 'anisotropyProps');
  const isDiffuseTransmission = isPropsConnected('PbrDiffuseTransmissionProps', 'diffuseTransmissionProps');
  const isSpecular = isPropsConnected('PbrSpecularProps', 'specularProps');
  const isVolume = isPropsConnected('PbrVolumeProps', 'volumeProps');
  // Transmission and dispersion accept any scalar source (a props node or a constant),
  // matching the mesh node material path (createNodeBasedCustomMaterial).
  const isTransmission = pbrShaderNode != null && isConnectedTo(pbrShaderNode.id, 'transmission') != null;
  const isDispersion = pbrShaderNode != null && isConnectedTo(pbrShaderNode.id, 'dispersion') != null;

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
    isDispersion,
  };
}

/**
 *
 * Creates a node-based raymarching custom material.
 * @param engine
 * @param shaderNodeJson
 * @returns Object containing the material and shader node flags, or null if generation fails
 */
export function createNodeBasedRaymarchingCustomMaterial(
  engine: Engine,
  shaderNodeJson: ShaderNodeJson,
  currentMaterial?: Material
): NodeBasedMaterialResult | undefined {
  const raymarchingShaderPart = new RaymarchingShaderPart();
  const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(engine, shaderNodeJson, raymarchingShaderPart);

  if (!shaderCode) {
    return undefined;
  }

  const additionalShaderSemanticInfo = addRaymarchingComponentSemanticsInfo(shaderNodeJson);
  addRaymarchingAabbSemanticInfo(additionalShaderSemanticInfo);

  // The raymarching shader shades hit points with the shared PBR shader function,
  // so the material needs the lighting/PBR defines and the IBL/PBR parameters.
  addRaymarchingPbrIblSemanticInfo(engine, additionalShaderSemanticInfo);
  addRaymarchingPbrSemanticInfo(additionalShaderSemanticInfo);
  // Texture2D nodes in the graph sample these material textures.
  additionalShaderSemanticInfo.push(...buildTextureSemanticInfo(engine, shaderCode.textureInfos));

  const pbrFeatures = detectRaymarchingPbrFeatures(shaderNodeJson);
  if (pbrFeatures.isSheen) {
    // The sheen environment texture must be settable by the pipeline on the
    // buffer-less raymarching draw, so it is not an internal setting here.
    addPbrSheenSemanticInfo(engine, additionalShaderSemanticInfo, { sheenEnvIsInternalSetting: false });
  }
  if (pbrFeatures.isTransmission) {
    // The transmission shading samples the resolved scene color, which the pipeline
    // assigns to the material before the raymarching draw. A Texture2D node with the
    // same name already declares the semantic, so do not add a duplicate.
    if (!additionalShaderSemanticInfo.some(info => info.semantic === 'backBufferTexture')) {
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
      additionalShaderSemanticInfo,
    },
    currentMaterial
  );

  // Store the shader node JSON for later retrieval (e.g., in editor or export)
  material.shaderNodeJson = shaderNodeJson;

  return {
    material,
    hasPbrShaderNode: false,
    hasClassicShaderNode: false,
  };
}

/**
 * Shadow caster materials built from a merged raymarching graph.
 *
 * `regular` writes the linear depth moments of spot / directional shadow maps, while
 * the paraboloid variants write the front (r,g) and back (b,a) hemispheres of the
 * point light shadow maps.
 */
export type RaymarchingShadowMaterials = {
  regular?: Material;
  paraboloidFront?: Material;
  paraboloidBack?: Material;
};

/**
 * Creates the shadow caster materials that render the merged SDF graph into the
 * shadow maps.
 *
 * The shader part is a RaymarchingShadowShaderPart, so the distance function `map()`
 * is the same as in the visible raymarching material while the fragment main writes
 * the variance shadow map moments and the fragment depth. The receiver material is not
 * passed as `currentMaterial`: only the previous shadow materials are reused.
 *
 * @param engine - The engine instance
 * @param shaderNodeJson - The merged raymarching graph (castShadowOnly)
 * @param currentMaterials - Shadow materials of the previous build, reused when possible
 * @returns The three shadow materials, or undefined when code generation fails
 */
export function createNodeBasedRaymarchingShadowMaterials(
  engine: Engine,
  shaderNodeJson: ShaderNodeJson,
  currentMaterials?: RaymarchingShadowMaterials
): RaymarchingShadowMaterials | undefined {
  const regular = createNodeBasedRaymarchingShadowMaterial(
    engine,
    shaderNodeJson,
    'regular',
    currentMaterials?.regular
  );
  const paraboloidFront = createNodeBasedRaymarchingShadowMaterial(
    engine,
    shaderNodeJson,
    'paraboloidFront',
    currentMaterials?.paraboloidFront
  );
  const paraboloidBack = createNodeBasedRaymarchingShadowMaterial(
    engine,
    shaderNodeJson,
    'paraboloidBack',
    currentMaterials?.paraboloidBack
  );
  if (regular == null || paraboloidFront == null || paraboloidBack == null) {
    return undefined;
  }
  return { regular, paraboloidFront, paraboloidBack };
}

export function createNodeBasedRaymarchingShadowMaterial(
  engine: Engine,
  shaderNodeJson: ShaderNodeJson,
  kind: RaymarchingShadowShaderPartKind,
  currentMaterial?: Material
): Material | undefined {
  const shaderPart = new RaymarchingShadowShaderPart(kind);
  const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(engine, shaderNodeJson, shaderPart, [
    'outDistance',
    'outUnion',
  ]);
  if (!shaderCode) {
    return undefined;
  }

  const additionalShaderSemanticInfo = addRaymarchingComponentSemanticsInfo(shaderNodeJson);
  addRaymarchingAabbSemanticInfo(additionalShaderSemanticInfo);
  // Texture2D nodes in the distance function sample these material textures.
  additionalShaderSemanticInfo.push(...buildTextureSemanticInfo(engine, shaderCode.textureInfos));
  if (kind !== 'regular') {
    // Point light paraboloid passes: the light index and the per-slot far plane are
    // set by the pipeline when the per-slot material is created / updated.
    additionalShaderSemanticInfo.push({
      semantic: 'lightIndex',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(0),
      min: 0,
      max: Number.MAX_VALUE,
    });
    additionalShaderSemanticInfo.push({
      semantic: 'shadowFarPlane',
      componentType: ComponentType.Float,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      initialValue: Scalar.fromCopyNumber(1000),
      min: 0,
      max: Number.MAX_VALUE,
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
      additionalShaderSemanticInfo,
    },
    currentMaterial
  );

  if (kind === 'paraboloidFront') {
    material.colorWriteMask = [true, true, false, false];
  } else if (kind === 'paraboloidBack') {
    material.colorWriteMask = [false, false, true, true];
  } else {
    // The regular shadow target is RG16F (moments M1 and M2).
    material.colorWriteMask = [true, true, false, false];
  }

  material.shaderNodeJson = shaderNodeJson;

  return material;
}

export function collectRrnJson(
  engine: Engine,
  { castShadowOnly = false }: { castShadowOnly?: boolean } = {}
): NodeJSON {
  const collectedRrnJson: NodeJSON = {
    nodes: [],
    connections: [],
  };

  const raymarchingComponents = engine.componentRepository.getComponentsWithTID(
    WellKnownComponentTIDs.RaymarchingComponentTID
  );
  for (const component of raymarchingComponents) {
    const raymarchingComponent = component as RaymarchingComponent;
    if (castShadowOnly && !raymarchingComponent.castShadow) {
      // A non-casting SDF must be absent from the shadow graph: including it in the
      // union would let it occlude casting SDFs behind it.
      continue;
    }
    const rrnJson = raymarchingComponent.rrnJson;

    // Prefix node ids with the component SID to avoid collisions and to keep the
    // object id (used by the per-component shading dispatch) stable when other
    // components are added or removed.
    const prefix = `comp${raymarchingComponent.componentSID}_`;

    // Clone and update node ids with prefix
    const prefixedNodes = rrnJson.nodes.map(node => {
      const newNode = { ...node, id: `${prefix}${node.id}` };

      // Update input ids
      if (node.inputs) {
        newNode.inputs = {};
        for (const [key, input] of Object.entries(node.inputs)) {
          newNode.inputs[key] = { ...input, id: `${prefix}${input.id}` };
        }
      }

      // Update output ids
      if (node.outputs) {
        newNode.outputs = {};
        for (const [key, output] of Object.entries(node.outputs)) {
          newNode.outputs[key] = { ...output, id: `${prefix}${output.id}` };
        }
      }

      return newNode;
    });

    // Uniform nodes are per component: postfix their name with the component SID so
    // components that share the same graph can carry different values. The merged
    // material then has one uniform per component (for example "roughness_0").
    const uniformNodeNames = new Set([
      'UniformScalarFloat',
      'UniformVector2Float',
      'UniformVector3Float',
      'UniformVector4Float',
    ]);
    for (const node of prefixedNodes) {
      if (uniformNodeNames.has(node.name)) {
        const name = node.controls?.name?.value;
        if (typeof name === 'string' && name.length > 0) {
          node.controls = {
            ...(node.controls ?? {}),
            name: { value: `${name}_${raymarchingComponent.componentSID}` },
          };
        }
      }
    }

    // Clone and update connection ids with prefix
    const prefixedConnections = rrnJson.connections.map(conn => ({
      ...conn,
      id: `${prefix}${conn.id}`,
      from: { ...conn.from, id: `${prefix}${conn.from.id}` },
      to: { ...conn.to, id: `${prefix}${conn.to.id}` },
    }));

    // Record which component was hit: add an object id node and feed it to every
    // OutUnion of the component. Unions that already have an objectId connection
    // keep the graph the user authored.
    const objectIdNodeId = `${prefix}__raymarchObjectId`;
    const objectIdOutputId = `${prefix}__raymarchObjectIdOut`;
    const terminalsWithoutObjectId = prefixedNodes.filter(
      node =>
        (node.name === 'OutUnion' || node.name === 'OutDistance') &&
        !prefixedConnections.some(connection => connection.to.id === node.id && connection.to.portName === 'objectId')
    );
    if (terminalsWithoutObjectId.length > 0) {
      prefixedNodes.push({
        id: objectIdNodeId,
        name: 'RaymarchObjectIdUniform',
        outputs: {
          out1: { id: objectIdOutputId, label: 'Out Object Id', socket: { name: 'Scalar<float>' } },
        },
        inputs: {},
        controls: { name: { value: `raymarchObjectId_${raymarchingComponent.componentSID}` } },
        position: { x: 0, y: 0 },
      });
      for (const terminal of terminalsWithoutObjectId) {
        prefixedConnections.push({
          id: `${prefix}__raymarchObjectId_${terminal.id}`,
          from: { id: objectIdNodeId, portName: 'out1' },
          to: { id: terminal.id, portName: 'objectId' },
        });
      }
    }

    // Convert each component's local-space distance into a conservative world-space
    // distance. The SDF graph is evaluated in the space produced by SdApplyWorldMatrix
    // (the component's local space), so scaling an entity below 1 makes the graph's
    // distance larger than the real world distance and sphere tracing overshoots the
    // surface (parts of the shape disappear, camera-dependent). The terminal nodes
    // read the already declared per-component world matrix uniform and multiply the
    // distance by the smallest axis scale, which is a valid world-space step bound.
    const worldMatrixUniformNames: string[] = [];
    for (const node of prefixedNodes) {
      if (node.name === 'SdApplyWorldMatrix') {
        const name = node.controls?.name?.value;
        if (typeof name === 'string' && name.length > 0) {
          worldMatrixUniformNames.push(name);
        }
      }
    }
    if (worldMatrixUniformNames.length > 0) {
      for (const node of prefixedNodes) {
        if (node.name !== 'OutUnion' && node.name !== 'OutDistance') {
          continue;
        }
        node.controls = {
          ...(node.controls ?? {}),
          distanceCorrectionMatrices: { value: [...worldMatrixUniformNames] },
        };
      }
    }

    collectedRrnJson.nodes.push(...prefixedNodes);
    collectedRrnJson.connections.push(...prefixedConnections);
  }

  return collectedRrnJson;
}

/**
 * Semantic name of the component world matrix inside a per-component raymarching
 * material. Every `SdApplyWorldMatrix` node of the component is normalized to this
 * name when its material is built, so the pipeline sets one uniform per material.
 */
export const RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC = 'raymarchingWorldMatrix';

/**
 * Builds the shader graph JSON of one raymarching component for its own material.
 *
 * Unlike {@link collectRrnJson}, the graph is not merged with other components:
 * node ids and uniform names stay as authored. `SdApplyWorldMatrix` uniforms are
 * normalized to {@link RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC}, and the
 * distance terminals are stamped with that semantic so a scaled entity converts its
 * local distances to world-space ray marching steps.
 *
 * @param component - The component whose graph is prepared
 * @returns A cloned graph JSON for {@link createNodeBasedRaymarchingCustomMaterial}
 */
export function createRaymarchingComponentShaderJson(component: RaymarchingComponent): NodeJSON {
  const json = JSON.parse(JSON.stringify(component.rrnJson)) as NodeJSON;
  let usesWorldMatrix = false;
  for (const node of json.nodes) {
    if (node.name === 'SdApplyWorldMatrix') {
      node.controls = {
        ...(node.controls ?? {}),
        name: { value: RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC },
      };
      usesWorldMatrix = true;
    }
  }
  if (usesWorldMatrix) {
    for (const node of json.nodes) {
      if (node.name === 'OutUnion' || node.name === 'OutDistance') {
        node.controls = {
          ...(node.controls ?? {}),
          distanceCorrectionMatrices: { value: [RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC] },
        };
      }
    }
  }
  return json;
}

/**
 * Creates the raymarching material of a single RaymarchingComponent.
 *
 * Each component owns a material and a buffer-less full-screen pass (see
 * `ForwardRenderPipeline.setRaymarchingComponentMaterial`), so its uniforms and
 * textures are independent: names are not postfixed, and the texture-slot limit
 * applies to the component's own graph instead of the merged graph of every
 * component.
 *
 * @param engine - The engine instance
 * @param component - The component that owns the material
 * @param currentMaterial - An existing material of the same component that can be reused
 * @returns The material and feature flags, or undefined when generation fails
 */
export function createNodeBasedRaymarchingComponentMaterial(
  engine: Engine,
  component: RaymarchingComponent,
  currentMaterial?: Material
): NodeBasedMaterialResult | undefined {
  const json = createRaymarchingComponentShaderJson(component);
  return createNodeBasedRaymarchingCustomMaterial(engine, json as unknown as ShaderNodeJson, currentMaterial);
}

/**
 * Creates the SDF shadow caster material of a single RaymarchingComponent.
 *
 * Like the visible per-component material, the component's graph is used as authored
 * (with its world matrix normalized to one semantic), so shadow casters are no longer
 * one merged material: each component keeps its own textures and uniforms in the
 * shadow maps too, and the texture-slot limit applies per component.
 *
 * @param engine - The engine instance
 * @param component - The castShadow component the material renders
 * @param kind - Which shadow map variant the material writes
 * @param currentMaterial - An existing material of the same component that can be reused
 * @returns The shadow caster material, or undefined when generation fails
 */
export function createNodeBasedRaymarchingComponentShadowMaterial(
  engine: Engine,
  component: RaymarchingComponent,
  kind: RaymarchingShadowShaderPartKind,
  currentMaterial?: Material
): Material | undefined {
  const json = createRaymarchingComponentShaderJson(component);
  return createNodeBasedRaymarchingShadowMaterial(engine, json as unknown as ShaderNodeJson, kind, currentMaterial);
}
