import type { ShaderNodeJson } from '../../../types/ShaderNodeJson';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import type { PbrUberMaterialOptions } from './createPbrUberMaterial';
import { type NodeBasedMaterialResult } from './nodeBasedMaterialCommon';
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
export declare function createNodeBasedCustomMaterial(engine: Engine, shaderNodeJson: ShaderNodeJson, options?: PbrUberMaterialOptions, currentMaterial?: Material): NodeBasedMaterialResult | undefined;
