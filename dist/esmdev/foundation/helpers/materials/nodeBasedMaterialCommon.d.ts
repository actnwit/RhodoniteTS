import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { type ShaderTypeEnum } from '../../definitions/ShaderType';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import type { PbrUberMaterialOptions } from './createPbrUberMaterial';
/**
 * Reuses an existing custom material or recreates it with new shader code.
 * This function optimizes performance by reusing materials when possible while allowing shader updates.
 *
 * @param currentMaterial - The existing material to potentially reuse
 * @param vertexShaderStr - Vertex shader source code string
 * @param pixelShaderStr - Pixel/fragment shader source code string
 * @param options - Configuration object for the custom material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isMorphing - Enable morph target animation support
 * @param options.additionalShaderSemanticInfo - Additional shader semantic info for textures etc.
 * @returns A reused or newly created Custom Material instance
 */
export declare function reuseOrRecreateCustomMaterial(engine: Engine, vertexShaderStr: string, pixelShaderStr: string, options?: PbrUberMaterialOptions, currentMaterial?: Material): Material;
/**
 * Result of creating a node-based custom material
 */
export interface NodeBasedMaterialResult {
    /** The created or reused material */
    material: Material;
    /** Whether the shader node graph contains a PbrShader node */
    hasPbrShaderNode: boolean;
    /** Whether the shader node graph contains a ClassicShader node */
    hasClassicShaderNode: boolean;
}
/**
 * Builds ShaderSemanticInfo array for textures used in the shader node graph.
 *
 * @param engine - The engine instance
 * @param textureInfos - Array of texture info objects containing name, stage, and defaultTexture
 * @returns Array of ShaderSemanticsInfo for textures
 */
export declare function buildTextureSemanticInfo(engine: Engine, textureInfos: {
    name: string;
    stage: string;
    defaultTexture: string;
}[]): ShaderSemanticsInfo[];
/**
 * Adds IBL (Image-Based Lighting) related semantic info for PBR shading.
 *
 * @param engine - The engine instance
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 */
export declare function addPbrIblSemanticInfo(engine: Engine, additionalShaderSemanticInfo: ShaderSemanticsInfo[]): void;
/**
 * Adds the transmission back buffer texture semantic.
 *
 * The texture is the resolved scene color supplied by ForwardRenderPipeline on each
 * frame (see ForwardRenderPipeline.__setupRaymarchingExpression and
 * __setTransparentExpressionsForTransmission), so this is not an internal setting:
 * the pipeline assigns it through setTextureParameter and the material auto-binds it
 * on every draw.
 *
 * @param engine - The engine instance
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 * @param stage - Shader stage that declares the texture
 */
export declare function addBackBufferTextureSemanticInfo(engine: Engine, additionalShaderSemanticInfo: ShaderSemanticsInfo[], stage: ShaderTypeEnum): void;
/**
 * Adds Sheen related semantic info for PBR shading with sheen.
 * This adds the sheenLutTexture needed for sheen BRDF calculations.
 *
 * @param engine - The engine instance
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 */
export declare function addPbrSheenSemanticInfo(engine: Engine, additionalShaderSemanticInfo: ShaderSemanticsInfo[], { sheenEnvIsInternalSetting }?: {
    sheenEnvIsInternalSetting?: boolean;
}): void;
