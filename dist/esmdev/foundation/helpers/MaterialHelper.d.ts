import type { NodeJSON, Vrm0xMaterialProperty } from '../../types';
import type { Count } from '../../types/CommonTypes';
import type { ShaderNodeJson } from '../../types/ShaderNodeJson';
import type { Vrm1_Material } from '../../types/VRMC_materials_mtoon';
import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { IMeshRendererEntityMethods } from '../components/MeshRenderer/IMeshRendererEntity';
import type { ShaderSemanticsInfo } from '../definitions/ShaderSemanticsInfo';
import type { Primitive } from '../geometry/Primitive';
import type { AbstractMaterialContent } from '../materials/core/AbstractMaterialContent';
import type { Material } from '../materials/core/Material';
import type { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import type { AbstractTexture } from '../textures/AbstractTexture';
import { Sampler } from '../textures/Sampler';
import type { Texture } from '../textures/Texture';
/**
 * Creates a new material with the specified material content and maximum instances.
 *
 * @param materialContent - The material content that defines the material's properties and shaders
 * @param materialCountPerBufferView - the material count per buffer view
 * @returns A newly created Material instance
 */
declare function createMaterial(engine: Engine, materialContent: AbstractMaterialContent, materialCountPerBufferView?: Count): Material;
/**
 * Forces recreation of a material with the specified content, bypassing compatibility checks.
 * Use this when you need to ensure a completely fresh material instance.
 *
 * @param engine - The engine instance
 * @param materialContent - The material content for the new material
 * @param materialCountPerBufferView - the material count per buffer view
 * @returns A newly recreated Material instance
 */
declare function recreateMaterial(engine: Engine, materialContent: AbstractMaterialContent, materialCountPerBufferView?: Count): Material;
export type PbrUberMaterialOptions = {
    isPbr?: boolean;
    additionalShaderSemanticInfo?: ShaderSemanticsInfo[];
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    isOcclusion?: boolean;
    isEmissive?: boolean;
    isClearcoat?: boolean;
    isTransmission?: boolean;
    isVolume?: boolean;
    isSheen?: boolean;
    isSpecular?: boolean;
    isIridescence?: boolean;
    isAnisotropy?: boolean;
    isDispersion?: boolean;
    isEmissiveStrength?: boolean;
    isDiffuseTransmission?: boolean;
    isShadow?: boolean;
    useNormalTexture?: boolean;
    maxInstancesNumber?: Count;
};
/**
 * Creates a PBR (Physically Based Rendering) Uber material with extensive feature support.
 * This is a comprehensive material that supports various PBR extensions and features.
 *
 * @param options - Configuration object for the PBR material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isOcclusion - Enable ambient occlusion texture support
 * @param options.isEmissive - Enable emissive texture support
 * @param options.isClearcoat - Enable clear coat extension (KHR_materials_clearcoat)
 * @param options.isTransmission - Enable transmission extension (KHR_materials_transmission)
 * @param options.isVolume - Enable volume extension (KHR_materials_volume)
 * @param options.isSheen - Enable sheen extension (KHR_materials_sheen)
 * @param options.isSpecular - Enable specular extension (KHR_materials_specular)
 * @param options.isIridescence - Enable iridescence extension (KHR_materials_iridescence)
 * @param options.isAnisotropy - Enable anisotropy extension (KHR_materials_anisotropy)
 * @param options.isDispersion - Enable dispersion extension (KHR_materials_dispersion)
 * @param options.isEmissiveStrength - Enable emissive strength extension
 * @param options.isDiffuseTransmission - Enable diffuse transmission extension
 * @param options.isShadow - Enable shadow mapping support
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.useNormalTexture - Enable normal texture support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured PBR Uber Material instance
 */
declare function createPbrUberMaterial(engine: Engine, { additionalName, isMorphing, isSkinning, isLighting, isOcclusion, isEmissive, isClearcoat, isTransmission, isVolume, isSheen, isSpecular, isIridescence, isAnisotropy, isDispersion, isEmissiveStrength, isDiffuseTransmission, isShadow, useNormalTexture, maxInstancesNumber, }?: PbrUberMaterialOptions): Material;
/**
 * Creates a Classic Uber material for traditional non-PBR rendering.
 * This material is suitable for classic shading models and legacy content.
 *
 * @param options - Configuration object for the Classic material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isShadow - Enable shadow mapping support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Classic Uber Material instance
 */
declare function createClassicUberMaterial(engine: Engine, { additionalName, isSkinning, isLighting, isMorphing, isShadow, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
    isShadow?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for encoding depth moments in paraboloid projection.
 * This material is used for omnidirectional shadow mapping with paraboloid projections.
 *
 * @param options - Configuration object for the paraboloid depth material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isMorphing - Enable morph target animation support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Paraboloid Depth Moment Encode Material instance
 */
declare function createParaboloidDepthMomentEncodeMaterial(engine: Engine, { additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for encoding depth moments for variance shadow mapping.
 * This material generates depth and depth-squared values for soft shadow techniques.
 *
 * @param options - Configuration object for the depth moment material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isMorphing - Enable morph target animation support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Depth Moment Encode Material instance
 */
declare function createDepthMomentEncodeMaterial(engine: Engine, { additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a flat shading material with uniform color rendering.
 * This material renders objects with flat, unlit colors without lighting calculations.
 *
 * @param options - Configuration object for the flat material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isMorphing - Enable morph target animation support
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Flat Material instance
 */
declare function createFlatMaterial(engine: Engine, { additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for rendering environment constant colors.
 * This material is typically used for skyboxes or environment background rendering.
 *
 * @param options - Configuration object for the environment material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured Environment Constant Material instance
 */
declare function createEnvConstantMaterial(engine: Engine, { additionalName, maxInstancesNumber, makeOutputSrgb }?: {
    additionalName?: string | undefined;
    makeOutputSrgb?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a FXAA (Fast Approximate Anti-Aliasing) post-processing material.
 * This material applies FXAA3 quality anti-aliasing to reduce edge aliasing.
 *
 * @param options - Configuration object for the FXAA material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured FXAA3 Quality Material instance
 */
declare function createFXAA3QualityMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a furnace test material for validating material energy conservation.
 * This material is used for testing purposes to ensure materials conserve energy properly.
 *
 * @param options - Configuration object for the furnace test material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Furnace Test Material instance
 */
declare function createFurnaceTestMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for encoding depth values into color channels.
 * This material is used for depth-based effects and shadow mapping.
 *
 * @param options - Configuration object for the depth encode material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.depthPow - Power value for depth encoding (affects depth precision)
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Depth Encode Material instance
 */
declare function createDepthEncodeMaterial(engine: Engine, { additionalName, isSkinning, depthPow, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    depthPow?: number | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for decoding classic shadow maps in the rendering pipeline.
 * This material applies shadow mapping techniques to create realistic shadows.
 *
 * @param options - Configuration object for the shadow map decode material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isDebugging - Enable debugging features
 * @param options.colorAttachmentsNumber - Number of color attachments
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param depthEncodeRenderPass - The render pass that encodes depth information
 * @returns A configured Shadow Map Decode Classic Material instance
 */
declare function createShadowMapDecodeClassicSingleMaterial(engine: Engine, { additionalName, isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumber, maxInstancesNumber, }: {
    additionalName?: string | undefined;
    colorAttachmentsNumber?: number | undefined;
    isDebugging?: boolean | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}, depthEncodeRenderPass: RenderPass): Material;
/**
 * Creates a material for Gaussian blur applied to encoded depth textures.
 * This material is used for creating soft shadows by blurring depth maps.
 *
 * @param options - Configuration object for the Gaussian blur material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gaussian Blur for Encoded Depth Material instance
 */
declare function createGaussianBlurForEncodedDepthMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for decoding variance shadow maps with classic single-pass rendering.
 * This material implements variance shadow mapping for soft shadow effects.
 *
 * @param options - Configuration object for the variance shadow map material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isDebugging - Enable debugging features
 * @param options.isLighting - Enable lighting calculations
 * @param options.colorAttachmentsNumberDepth - Number of depth color attachments
 * @param options.colorAttachmentsNumberSquareDepth - Number of squared depth color attachments
 * @param options.depthCameraComponent - Camera component for depth calculations
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param encodedDepthRenderPasses - Array of render passes that encode depth information
 * @returns A configured Variance Shadow Map Decode Classic Material instance
 */
declare function createVarianceShadowMapDecodeClassicSingleMaterial(engine: Engine, { additionalName, isMorphing, isSkinning, isDebugging, isLighting, colorAttachmentsNumberDepth, colorAttachmentsNumberSquareDepth, depthCameraComponent, maxInstancesNumber, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isDebugging?: boolean;
    isLighting?: boolean;
    colorAttachmentsNumberDepth?: Count;
    colorAttachmentsNumberSquareDepth?: Count;
    depthCameraComponent?: CameraComponent;
    maxInstancesNumber?: Count;
}, encodedDepthRenderPasses: RenderPass[]): Material;
/**
 * Creates a material for detecting high luminance areas in textures.
 * This material is typically used in HDR rendering pipelines for bloom effects.
 *
 * @param options - Configuration object for the high luminance detection material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param textureToDetectHighLuminance - The texture to analyze for high luminance areas
 * @returns A configured Detect High Luminance Material instance
 */
declare function createDetectHighLuminanceMaterial(engine: Engine, { additionalName, maxInstancesNumber }: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}, textureToDetectHighLuminance: AbstractTexture): Material;
/**
 * Creates a material for Gaussian blur post-processing effects.
 * This material applies Gaussian blur for various effects like depth of field or bloom.
 *
 * @param options - Configuration object for the Gaussian blur material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gaussian Blur Material instance
 */
declare function createGaussianBlurMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for synthesizing HDR (High Dynamic Range) textures.
 * This material combines multiple textures to create HDR content for advanced lighting.
 *
 * @param options - Configuration object for the HDR synthesis material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param synthesizeTextures - Array of textures to synthesize into HDR
 * @returns A configured Synthesize HDR Material instance
 */
declare function createSynthesizeHDRMaterial(engine: Engine, { additionalName, maxInstancesNumber, }: {
    additionalName?: string;
    maxInstancesNumber?: Count;
}, synthesizeTextures: AbstractTexture[]): Material;
/**
 * Creates a material for color grading using LUT (Look-Up Table) textures.
 * This material applies color correction and grading effects using 3D LUT textures.
 *
 * @param options - Configuration object for the color grading material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.colorAttachmentsNumber - Number of color attachments
 * @param options.uri - URI path to the LUT texture
 * @param options.texture - Pre-loaded LUT texture
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param targetRenderPass - The render pass to apply color grading to
 * @returns A configured Color Grading using LUTs Material instance
 */
declare function createColorGradingUsingLUTsMaterial(engine: Engine, { additionalName, colorAttachmentsNumber, uri, texture, maxInstancesNumber, }: {
    additionalName?: string;
    colorAttachmentsNumber?: Count;
    uri?: string;
    texture?: Texture;
    maxInstancesNumber?: Count;
}, targetRenderPass: RenderPass): Material;
/**
 * Creates a material for gamma correction post-processing.
 * This material applies gamma correction to convert linear color space to sRGB.
 *
 * @param options - Configuration object for the gamma correction material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Gamma Correction Material instance
 */
declare function createGammaCorrectionMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for tone mapping HDR content to LDR display.
 * This material converts high dynamic range colors to displayable range using tone mapping algorithms.
 *
 * @param options - Configuration object for the tone mapping material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Tone Mapping Material instance
 */
declare function createToneMappingMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for generating summed area tables from textures.
 * This material is used for efficient area sampling and filtering operations.
 *
 * @param options - Configuration object for the summed area table material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Summed Area Table Material instance
 */
declare function createSummedAreaTableMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for converting panoramic textures to cube map format.
 * This material transforms equirectangular panoramic images into cube map textures.
 *
 * @param options - Configuration object for the panorama to cube material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Panorama to Cube Material instance
 */
declare function createPanoramaToCubeMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a material for prefiltering IBL (Image-Based Lighting) environment maps.
 * This material generates prefiltered mipmap levels for environment map reflections.
 *
 * @param options - Configuration object for the IBL prefilter material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Prefilter IBL Material instance
 */
declare function createPrefilterIBLMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates a Material Capture (MatCap) material for stylized lighting effects.
 * This material uses a material capture texture to simulate lighting without actual light sources.
 *
 * @param options - Configuration object for the MatCap material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.uri - URI path to the MatCap texture
 * @param options.texture - Pre-loaded MatCap texture
 * @param options.sampler - Texture sampler for the MatCap texture
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured MatCap Material instance
 */
declare function createMatCapMaterial(engine: Engine, { additionalName, isSkinning, uri, texture, sampler, maxInstancesNumber, }: {
    additionalName?: string;
    isSkinning?: boolean;
    uri?: string;
    texture?: Texture;
    sampler?: Sampler;
    maxInstancesNumber?: Count;
}): Material;
/**
 * Creates a material for outputting entity unique identifiers to render targets.
 * This material is used for object picking and selection by rendering entity IDs.
 *
 * @param options - Configuration object for the entity UID output material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Entity UID Output Material instance
 */
declare function createEntityUIDOutputMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
/**
 * Creates an MToon 0.x material for VRM character rendering with toon shading.
 * This material implements the MToon 0.x specification for anime/toon-style rendering.
 *
 * @param options - Configuration object for the MToon 0.x material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.isOutline - Enable outline rendering
 * @param options.materialProperties - MToon material property definitions
 * @param options.textures - Array of textures used by the material
 * @param options.samplers - Array of texture samplers
 * @param options.debugMode - Debug mode settings
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured MToon 0.x Material instance
 */
declare function createMToon0xMaterial(engine: Engine, { additionalName, isMorphing, isSkinning, isLighting, useTangentAttribute, isOutline, materialProperties, textures, samplers, debugMode, maxInstancesNumber, makeOutputSrgb, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    useTangentAttribute?: boolean;
    isOutline?: boolean;
    materialProperties?: Vrm0xMaterialProperty;
    textures?: any[];
    samplers?: Sampler[];
    debugMode?: any;
    maxInstancesNumber?: Count;
    makeOutputSrgb?: boolean;
}): Material;
/**
 * Creates an MToon 1.0 material for VRM 1.0 character rendering with enhanced toon shading.
 * This material implements the MToon 1.0 specification with improved features over 0.x.
 *
 * @param options - Configuration object for the MToon 1.0 material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.isOutline - Enable outline rendering
 * @param options.materialJson - MToon 1.0 material JSON definition
 * @param options.textures - Array of textures used by the material
 * @param options.samplers - Array of texture samplers
 * @param options.debugMode - Debug mode settings
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured MToon 1.0 Material instance
 */
declare function createMToon1Material(engine: Engine, { additionalName, isMorphing, isSkinning, isLighting, isOutline, materialJson, maxInstancesNumber, makeOutputSrgb, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    useTangentAttribute?: boolean;
    isOutline?: boolean;
    materialJson: Vrm1_Material;
    textures?: any[];
    samplers?: Sampler[];
    debugMode?: any;
    maxInstancesNumber?: Count;
    makeOutputSrgb?: boolean;
}): Material;
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
declare function reuseOrRecreateCustomMaterial(engine: Engine, vertexShaderStr: string, pixelShaderStr: string, options?: PbrUberMaterialOptions, currentMaterial?: Material): Material;
/**
 * Result of creating a node-based custom material
 */
interface NodeBasedMaterialResult {
    /** The created or reused material */
    material: Material;
    /** Whether the shader node graph contains a PbrShader node */
    hasPbrShaderNode: boolean;
    /** Whether the shader node graph contains a ClassicShader node */
    hasClassicShaderNode: boolean;
}
/**
 *
 * Creates a node-based raymarching custom material.
 * @param engine
 * @param shaderNodeJson
 * @returns Object containing the material and shader node flags, or null if generation fails
 */
declare function createNodeBasedRaymarchingCustomMaterial(engine: Engine, shaderNodeJson: ShaderNodeJson, currentMaterial?: Material): NodeBasedMaterialResult | undefined;
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
declare function createNodeBasedCustomMaterial(engine: Engine, shaderNodeJson: ShaderNodeJson, options?: PbrUberMaterialOptions, currentMaterial?: Material): NodeBasedMaterialResult | undefined;
declare function collectRrnJson(engine: Engine): NodeJSON;
/**
 * Changes the material assigned to a specific primitive on an entity.
 * This function updates the primitive's material and triggers necessary render state updates.
 * Translucency properties (isTranslucent, alphaMode) and backBufferTexture are preserved
 * from the old material to maintain proper rendering behavior for transmission materials.
 *
 * @param entity - The mesh renderer entity containing the primitive
 * @param primitive - The primitive to change the material for
 * @param material - The new material to assign to the primitive
 */
declare function changeMaterial(entity: IMeshRendererEntityMethods, primitive: Primitive, material: Material): void;
export declare const MaterialHelper: Readonly<{
    createMaterial: typeof createMaterial;
    recreateMaterial: typeof recreateMaterial;
    reuseOrRecreateCustomMaterial: typeof reuseOrRecreateCustomMaterial;
    createNodeBasedCustomMaterial: typeof createNodeBasedCustomMaterial;
    createNodeBasedRaymarchingCustomMaterial: typeof createNodeBasedRaymarchingCustomMaterial;
    createClassicUberMaterial: typeof createClassicUberMaterial;
    createDepthMomentEncodeMaterial: typeof createDepthMomentEncodeMaterial;
    createParaboloidDepthMomentEncodeMaterial: typeof createParaboloidDepthMomentEncodeMaterial;
    createFlatMaterial: typeof createFlatMaterial;
    createPbrUberMaterial: typeof createPbrUberMaterial;
    createEnvConstantMaterial: typeof createEnvConstantMaterial;
    createFXAA3QualityMaterial: typeof createFXAA3QualityMaterial;
    createDepthEncodeMaterial: typeof createDepthEncodeMaterial;
    createShadowMapDecodeClassicSingleMaterial: typeof createShadowMapDecodeClassicSingleMaterial;
    createGammaCorrectionMaterial: typeof createGammaCorrectionMaterial;
    createToneMappingMaterial: typeof createToneMappingMaterial;
    createPanoramaToCubeMaterial: typeof createPanoramaToCubeMaterial;
    createPrefilterIBLMaterial: typeof createPrefilterIBLMaterial;
    createSummedAreaTableMaterial: typeof createSummedAreaTableMaterial;
    createVarianceShadowMapDecodeClassicSingleMaterial: typeof createVarianceShadowMapDecodeClassicSingleMaterial;
    createEntityUIDOutputMaterial: typeof createEntityUIDOutputMaterial;
    createMToon0xMaterial: typeof createMToon0xMaterial;
    createMToon1Material: typeof createMToon1Material;
    createFurnaceTestMaterial: typeof createFurnaceTestMaterial;
    createGaussianBlurForEncodedDepthMaterial: typeof createGaussianBlurForEncodedDepthMaterial;
    createDetectHighLuminanceMaterial: typeof createDetectHighLuminanceMaterial;
    createGaussianBlurMaterial: typeof createGaussianBlurMaterial;
    createSynthesizeHDRMaterial: typeof createSynthesizeHDRMaterial;
    createColorGradingUsingLUTsMaterial: typeof createColorGradingUsingLUTsMaterial;
    createMatCapMaterial: typeof createMatCapMaterial;
    changeMaterial: typeof changeMaterial;
    collectRrnJson: typeof collectRrnJson;
}>;
export {};
