import type { RnM2, RnM2Material } from '../../types/RnM2';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { type PbrUberMaterialOptions } from '../helpers/MaterialHelper';
import type { Material } from '../materials/core/Material';
import type { Engine } from '../system/Engine';
import type { Sampler } from '../textures/Sampler';
import type { Texture } from '../textures/Texture';
/**
 * Extension class for importing Rhodonite-specific features from RnM2 format files.
 * Handles billboard and Effekseer effect imports.
 */
export declare class RhodoniteImportExtension {
    /**
     * Imports billboard configuration from RnM2 format and applies it to scene graph entities.
     * Processes the RHODONITE_billboard extension to enable billboard rendering for specified nodes.
     *
     * @param gltfJson - The RnM2 format JSON data containing billboard extension information
     * @param groups - Array of scene graph entities corresponding to nodes in the RnM2 data
     */
    static importBillboard(gltfJson: RnM2, groups: ISceneGraphEntity[]): void;
    /**
     * Creates a node-based custom material from RHODONITE_materials_node extension data.
     * Uses ShaderGraphResolver to generate shader code from the loaded .rmn JSON,
     * then creates a custom material using MaterialHelper.
     *
     * @param engine - The engine instance
     * @param gltfModel - The glTF model containing textures and samplers
     * @param materialJson - The glTF material JSON containing the extension
     * @param currentMaterial - The current/fallback material to use as base
     * @param rnTextures - Array of loaded Rhodonite textures
     * @param rnSamplers - Array of loaded Rhodonite samplers
     * @returns The created custom material, or the current material if creation fails
     */
    static createNodeBasedMaterial(engine: Engine, gltfModel: RnM2, materialJson: RnM2Material, rnTextures: Texture[], rnSamplers: Sampler[], options: PbrUberMaterialOptions): Material | undefined;
    /**
     * Checks if a material has the RHODONITE_materials_node extension.
     *
     * @param materialJson - The glTF material JSON to check
     * @returns True if the extension is present, false otherwise
     */
    static hasNodeBasedMaterialExtension(materialJson?: RnM2Material): boolean;
    /**
     * Checks if a value is a texture uniform reference (has 'index' property).
     *
     * @param value - The value to check
     * @returns True if the value is a texture uniform reference
     */
    private static __isTextureUniform;
    /**
     * Applies uniform values from the extension to the material.
     *
     * @param material - The material to apply uniforms to
     * @param uniforms - The uniforms object from the extension
     * @param gltfModel - The glTF model containing texture references
     * @param rnTextures - Array of loaded Rhodonite textures
     * @param rnSamplers - Array of loaded Rhodonite samplers
     */
    private static __applyUniformsToMaterial;
    /**
     * Imports Effekseer effects from RnM2 format and creates corresponding Effekseer components.
     * Processes the RHODONITE_effekseer extension to load particle effects with their configurations.
     *
     * @param gltfJson - The RnM2 format JSON data containing Effekseer extension information
     * @param rootGroup - The root scene graph entity that contains all imported entities
     */
    static importEffect(engine: Engine, gltfJson: RnM2, rootGroup: ISceneGraphEntity): void;
}
