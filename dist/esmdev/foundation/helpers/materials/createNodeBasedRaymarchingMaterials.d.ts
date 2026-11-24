import type { NodeJSON } from '../../../types';
import type { ShaderNodeJson } from '../../../types/ShaderNodeJson';
import { type RaymarchingShadowShaderPartKind } from '../../../webgl/shaders/RaymarchingShadowShaderPart';
import type { RaymarchingComponent } from '../../components/Raymarching/RaymarchingComponent';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import { type NodeBasedMaterialResult } from './nodeBasedMaterialCommon';
/**
 * Adds the material parameters used by the fixed PBR shading of the raymarching
 * material (base color, metallic, roughness, emissive and the specular/F0 terms).
 *
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 */
export declare function addRaymarchingPbrSemanticInfo(additionalShaderSemanticInfo: ShaderSemanticsInfo[]): void;
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
export declare function addRaymarchingPbrIblSemanticInfo(engine: Engine, additionalShaderSemanticInfo: ShaderSemanticsInfo[]): void;
export declare function addRaymarchingComponentSemanticsInfo(shaderNodeJson: ShaderNodeJson): ShaderSemanticsInfo[];
/**
 * Adds the world-space AABB of the SDF used by the raymarch loop as a ray interval.
 *
 * The bounds are the conservative world AABB of the distance graph. The pipeline
 * replaces the defaults (an effectively unbounded box) per component; the shader
 * only marches inside the interval, so rays that miss the SDF exit immediately.
 *
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 */
export declare function addRaymarchingAabbSemanticInfo(additionalShaderSemanticInfo: ShaderSemanticsInfo[]): void;
/**
 * Detects the PBR features the raymarching graph uses so that the material
 * enables the matching shader defines.
 *
 * Normal mapping additionally relies on the raymarching-specific getTBN variant
 * (RN_RAYMARCHING_SHADING), because the shading section runs in non-uniform
 * control flow where derivatives are not allowed.
 */
export declare function detectRaymarchingPbrFeatures(shaderNodeJson: ShaderNodeJson): {
    useNormalTexture: boolean;
    isOcclusion: boolean;
    isClearcoat: boolean;
    isSheen: boolean;
    isIridescence: boolean;
    isAnisotropy: boolean;
    isDiffuseTransmission: boolean;
    isSpecular: boolean;
    isTransmission: boolean;
    isVolume: boolean;
    isDispersion: boolean;
};
/**
 *
 * Creates a node-based raymarching custom material.
 * @param engine
 * @param shaderNodeJson
 * @returns Object containing the material and shader node flags, or null if generation fails
 */
export declare function createNodeBasedRaymarchingCustomMaterial(engine: Engine, shaderNodeJson: ShaderNodeJson, currentMaterial?: Material): NodeBasedMaterialResult | undefined;
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
export declare function createNodeBasedRaymarchingShadowMaterials(engine: Engine, shaderNodeJson: ShaderNodeJson, currentMaterials?: RaymarchingShadowMaterials): RaymarchingShadowMaterials | undefined;
export declare function createNodeBasedRaymarchingShadowMaterial(engine: Engine, shaderNodeJson: ShaderNodeJson, kind: RaymarchingShadowShaderPartKind, currentMaterial?: Material): Material | undefined;
export declare function collectRrnJson(engine: Engine, { castShadowOnly }?: {
    castShadowOnly?: boolean;
}): NodeJSON;
/**
 * Semantic name of the component world matrix inside a per-component raymarching
 * material. Every `SdApplyWorldMatrix` node of the component is normalized to this
 * name when its material is built, so the pipeline sets one uniform per material.
 */
export declare const RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC = "raymarchingWorldMatrix";
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
export declare function createRaymarchingComponentShaderJson(component: RaymarchingComponent): NodeJSON;
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
export declare function createNodeBasedRaymarchingComponentMaterial(engine: Engine, component: RaymarchingComponent, currentMaterial?: Material): NodeBasedMaterialResult | undefined;
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
export declare function createNodeBasedRaymarchingComponentShadowMaterial(engine: Engine, component: RaymarchingComponent, kind: RaymarchingShadowShaderPartKind, currentMaterial?: Material): Material | undefined;
