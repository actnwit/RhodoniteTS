import type { ShaderNodeJson } from '../../../types/ShaderNodeJson';
import { StandardShaderPart } from '../../../webgl/shaders/StandardShaderPart';
import type { Material } from '../../materials/core/Material';
import { ShaderGraphResolver } from '../../materials/core/ShaderGraphResolver';
import type { Engine } from '../../system/Engine';
import type { PbrUberMaterialOptions } from './createPbrUberMaterial';
import {
  addPbrIblSemanticInfo,
  addPbrSheenSemanticInfo,
  buildTextureSemanticInfo,
  type NodeBasedMaterialResult,
  reuseOrRecreateCustomMaterial,
} from './nodeBasedMaterialCommon';

/**
 * Creates or reuses a custom material from a shader node JSON graph.
 * This function handles shader code generation, texture semantics setup,
 * PBR/Classic shader detection, and IBL semantics for PBR materials.
 *
 * @param engine - The engine instance
 * @param currentMaterial - The existing material to potentially reuse
 * @param shaderNodeJson - The shader node graph JSON
 * @param options - Configuration options
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns Object containing the material and shader node flags, or null if generation fails
 */
export function createNodeBasedCustomMaterial(
  engine: Engine,
  shaderNodeJson: ShaderNodeJson,
  options: PbrUberMaterialOptions = {},
  currentMaterial?: Material
): NodeBasedMaterialResult | undefined {
  // Generate shader code from the shader node JSON
  const commonShaderPart = new StandardShaderPart();
  const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(engine, shaderNodeJson, commonShaderPart);

  if (!shaderCode) {
    return undefined;
  }

  // Build texture semantic info from the texture infos extracted during shader generation
  const additionalShaderSemanticInfo = buildTextureSemanticInfo(engine, shaderCode.textureInfos);

  // Check if ClassicShader node is present in the shader node graph
  const hasClassicShaderNode =
    (shaderNodeJson?.nodes?.some((node: { name: string }) => node.name === 'ClassicShader') as boolean) ?? false;

  // Check if PbrShader node is present in the shader node graph
  const hasPbrShaderNode =
    (shaderNodeJson?.nodes?.some((node: { name: string }) => node.name === 'PbrShader') as boolean) ?? false;

  // Check if PbrOcclusionProps node is present in the shader node graph
  const hasPbrOcclusionPropsNode =
    (shaderNodeJson?.nodes?.some((node: { name: string }) => node.name === 'PbrOcclusionProps') as boolean) ?? false;

  // Check if PbrNormalProps node has a Texture2D connected to its normalTexture input
  const hasNormalTextureConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrNormalProps node
    const pbrNormalPropsNode = nodes.find(node => node.name === 'PbrNormalProps');
    if (!pbrNormalPropsNode) return false;

    // Find connection to normalTexture input of PbrNormalProps
    const normalTextureConnection = connections.find(
      conn => conn.to.id === pbrNormalPropsNode.id && conn.to.portName === 'normalTexture'
    );
    if (!normalTextureConnection) return false;

    // Check if the source node is a Texture2D
    const sourceNode = nodes.find(node => node.id === normalTextureConnection.from.id);
    return sourceNode?.name === 'Texture2D';
  })();

  // Check if PbrSpecularProps node is connected to PbrShader's specularProps input
  const hasPbrSpecularPropsConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrShader node
    const pbrShaderNode = nodes.find(node => node.name === 'PbrShader');
    if (!pbrShaderNode) return false;

    // Find connection to specularProps input of PbrShader
    const specularPropsConnection = connections.find(
      conn => conn.to.id === pbrShaderNode.id && conn.to.portName === 'specularProps'
    );
    if (!specularPropsConnection) return false;

    // Check if the source node is a PbrSpecularProps
    const sourceNode = nodes.find(node => node.id === specularPropsConnection.from.id);
    return sourceNode?.name === 'PbrSpecularProps';
  })();

  // Check if PbrSheenProps node is connected to PbrShader's sheenProps input
  const hasPbrSheenPropsConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrShader node
    const pbrShaderNode = nodes.find(node => node.name === 'PbrShader');
    if (!pbrShaderNode) return false;

    // Find connection to sheenProps input of PbrShader
    const sheenPropsConnection = connections.find(
      conn => conn.to.id === pbrShaderNode.id && conn.to.portName === 'sheenProps'
    );
    if (!sheenPropsConnection) return false;

    // Check if the source node is a PbrSheenProps
    const sourceNode = nodes.find(node => node.id === sheenPropsConnection.from.id);
    return sourceNode?.name === 'PbrSheenProps';
  })();

  // Check if PbrIridescenceProps node is connected to PbrShader's iridescenceProps input
  const hasPbrIridescencePropsConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrShader node
    const pbrShaderNode = nodes.find(node => node.name === 'PbrShader');
    if (!pbrShaderNode) return false;

    // Find connection to iridescenceProps input of PbrShader
    const iridescencePropsConnection = connections.find(
      conn => conn.to.id === pbrShaderNode.id && conn.to.portName === 'iridescenceProps'
    );
    if (!iridescencePropsConnection) return false;

    // Check if the source node is a PbrIridescenceProps
    const sourceNode = nodes.find(node => node.id === iridescencePropsConnection.from.id);
    return sourceNode?.name === 'PbrIridescenceProps';
  })();

  // Check if PbrClearcoatProps node is connected to PbrShader's clearcoatProps input
  const hasPbrClearcoatPropsConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrShader node
    const pbrShaderNode = nodes.find(node => node.name === 'PbrShader');
    if (!pbrShaderNode) return false;

    // Find connection to clearcoatProps input of PbrShader
    const clearcoatPropsConnection = connections.find(
      conn => conn.to.id === pbrShaderNode.id && conn.to.portName === 'clearcoatProps'
    );
    if (!clearcoatPropsConnection) return false;

    // Check if the source node is a PbrClearcoatProps
    const sourceNode = nodes.find(node => node.id === clearcoatPropsConnection.from.id);
    return sourceNode?.name === 'PbrClearcoatProps';
  })();

  // Check if something is connected to PbrShader's transmission input
  const hasTransmissionConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrShader node
    const pbrShaderNode = nodes.find(node => node.name === 'PbrShader');
    if (!pbrShaderNode) return false;

    // Find connection to transmission input of PbrShader
    const transmissionConnection = connections.find(
      conn => conn.to.id === pbrShaderNode.id && conn.to.portName === 'transmission'
    );
    return transmissionConnection != null;
  })();

  // Check if PbrVolumeProps node is connected to PbrShader's volumeProps input
  const hasPbrVolumePropsConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrShader node
    const pbrShaderNode = nodes.find(node => node.name === 'PbrShader');
    if (!pbrShaderNode) return false;

    // Find connection to volumeProps input of PbrShader
    const volumePropsConnection = connections.find(
      conn => conn.to.id === pbrShaderNode.id && conn.to.portName === 'volumeProps'
    );
    if (!volumePropsConnection) return false;

    // Check if the source node is a PbrVolumeProps
    const sourceNode = nodes.find(node => node.id === volumePropsConnection.from.id);
    return sourceNode?.name === 'PbrVolumeProps';
  })();

  // Check if PbrAnisotropyProps node is connected to PbrShader's anisotropyProps input
  const hasPbrAnisotropyPropsConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrShader node
    const pbrShaderNode = nodes.find(node => node.name === 'PbrShader');
    if (!pbrShaderNode) return false;

    // Find connection to anisotropyProps input of PbrShader
    const anisotropyPropsConnection = connections.find(
      conn => conn.to.id === pbrShaderNode.id && conn.to.portName === 'anisotropyProps'
    );
    if (!anisotropyPropsConnection) return false;

    // Check if the source node is a PbrAnisotropyProps
    const sourceNode = nodes.find(node => node.id === anisotropyPropsConnection.from.id);
    return sourceNode?.name === 'PbrAnisotropyProps';
  })();

  // Check if PbrDiffuseTransmissionProps node is connected to PbrShader's diffuseTransmissionProps input
  const hasPbrDiffuseTransmissionPropsConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrShader node
    const pbrShaderNode = nodes.find(node => node.name === 'PbrShader');
    if (!pbrShaderNode) return false;

    // Find connection to diffuseTransmissionProps input of PbrShader
    const diffuseTransmissionPropsConnection = connections.find(
      conn => conn.to.id === pbrShaderNode.id && conn.to.portName === 'diffuseTransmissionProps'
    );
    if (!diffuseTransmissionPropsConnection) return false;

    // Check if the source node is a PbrDiffuseTransmissionProps
    const sourceNode = nodes.find(node => node.id === diffuseTransmissionPropsConnection.from.id);
    return sourceNode?.name === 'PbrDiffuseTransmissionProps';
  })();

  // Check if something is connected to PbrShader's dispersion input
  const hasDispersionConnected = (() => {
    const nodes = shaderNodeJson?.nodes as Array<{ id: string; name: string }> | undefined;
    const connections = shaderNodeJson?.connections as
      | Array<{ from: { id: string; portName: string }; to: { id: string; portName: string } }>
      | undefined;

    if (!nodes || !connections) return false;

    // Find PbrShader node
    const pbrShaderNode = nodes.find(node => node.name === 'PbrShader');
    if (!pbrShaderNode) return false;

    // Find connection to dispersion input of PbrShader
    const dispersionConnection = connections.find(
      conn => conn.to.id === pbrShaderNode.id && conn.to.portName === 'dispersion'
    );
    return dispersionConnection != null;
  })();

  // Add IBL-related semantic info if PBR shader is used
  if (hasPbrShaderNode) {
    addPbrIblSemanticInfo(engine, additionalShaderSemanticInfo);
  }

  // Add Sheen-related semantic info if PbrSheenProps is connected to PbrShader
  if (hasPbrSheenPropsConnected) {
    addPbrSheenSemanticInfo(engine, additionalShaderSemanticInfo);
  }

  // Create custom material using reuseOrRecreateCustomMaterial

  const basicOptions = {
    isSkinning: true,
    isLighting: true,
    isMorphing: true,
    isShadow: hasClassicShaderNode || hasPbrShaderNode,
    isPbr: hasPbrShaderNode,
    isOcclusion: hasPbrOcclusionPropsNode,
    useNormalTexture: hasNormalTextureConnected,
    isSpecular: hasPbrSpecularPropsConnected,
    isSheen: hasPbrSheenPropsConnected,
    isIridescence: hasPbrIridescencePropsConnected,
    isClearcoat: hasPbrClearcoatPropsConnected,
    isTransmission: hasTransmissionConnected,
    isVolume: hasPbrVolumePropsConnected,
    isAnisotropy: hasPbrAnisotropyPropsConnected,
    isDiffuseTransmission: hasPbrDiffuseTransmissionPropsConnected,
    isDispersion: hasDispersionConnected,
    additionalName: '',
    additionalShaderSemanticInfo,
  };
  const material = reuseOrRecreateCustomMaterial(
    engine,
    shaderCode.vertexShader,
    shaderCode.pixelShader,
    { ...basicOptions, ...options },
    currentMaterial
  );

  // Store the shader node JSON for later retrieval (e.g., in editor or export)
  material.shaderNodeJson = shaderNodeJson;

  return {
    material,
    hasPbrShaderNode,
    hasClassicShaderNode,
  };
}
