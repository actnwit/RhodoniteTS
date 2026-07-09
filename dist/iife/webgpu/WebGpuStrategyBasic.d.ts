import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import type { getShaderPropertyFuncOfGlobalDataRepository, getShaderPropertyFuncOfMaterial } from '../foundation/definitions/ShaderSemantics';
import { type ShaderTypeEnum } from '../foundation/definitions/ShaderType';
import { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import type { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine';
import type { Count, Index, PrimitiveUID } from '../types/CommonTypes';
/**
 * Basic WebGPU rendering strategy implementation that handles mesh rendering,
 * storage buffer management, and shader program setup for WebGPU-based rendering pipeline.
 *
 * This class provides a complete rendering solution using WebGPU API, including:
 * - Storage buffer management for efficient GPU data transfer
 * - Shader program compilation and setup
 * - Morph target and blend shape handling
 * - Camera and transform matrix updates
 * - Render pass execution with proper primitive sorting
 *
 * @example
 * ```typescript
 * const strategy = WebGpuStrategyBasic.getInstance();
 * strategy.prerender();
 * strategy.common_$render(primitiveUids, renderPass, tickCount);
 * ```
 */
export declare class WebGpuStrategyBasic implements CGAPIStrategy {
    private __engine;
    private __storageBufferUid;
    private __storageBlendShapeBufferUid;
    private __uniformMorphOffsetsTypedArray?;
    private __uniformMorphWeightsTypedArray?;
    private __lastMaterialsUpdateCount;
    private __lastTransformComponentsUpdateCount;
    private __lastSceneGraphComponentsUpdateCount;
    private __lastCameraComponentsUpdateCount;
    private __lastCameraControllerComponentsUpdateCount;
    private __lastBlendShapeComponentsUpdateCountForWeights;
    private __lastMorphMaxIndex;
    private __lastGpuInstanceDataBufferCount;
    private __lastMorphOffsetsUniformDataSize;
    private __lastMorphWeightsUniformDataSize;
    private __morphOffsetsUniformBufferUid;
    private __morphWeightsUniformBufferUid;
    private __storageBlendShapeBufferByteLength;
    private __countOfBlendShapeComponents;
    private constructor();
    /**
     * Gets the singleton instance of WebGpuStrategyBasic.
     * Creates a new instance if none exists.
     *
     * @returns The singleton instance of WebGpuStrategyBasic
     */
    static init(engine: Engine): WebGpuStrategyBasic;
    /**
     * Generates vertex shader method definitions for storage buffer access.
     * These methods provide standardized access to transform matrices, visibility flags,
     * and morphing functionality in vertex shaders.
     *
     * @returns WGSL shader code containing helper functions for storage buffer access
     */
    static getVertexShaderMethodDefinitions_storageBuffer(engine: Engine, shaderType: ShaderTypeEnum): string;
    private static __getMorphedPositionGetter;
    /**
     * Generates shader property accessor functions for global data.
     * Creates WGSL functions that can fetch property values from storage buffers
     * based on shader semantics information.
     *
     * @param info - Shader semantics information containing type and binding details
     * @returns WGSL shader code for the property accessor function
     */
    private static __getShaderPropertyOfGlobalDataRepository;
    /**
     * Generates shader property accessor functions for materials.
     * Creates WGSL functions that can fetch property values from storage buffers
     * based on shader semantics information.
     *
     * @param materialTypeName - The name of the material type
     * @param info - Shader semantics information containing type and binding details
     * @returns WGSL shader code for the property accessor function
     */
    private static __getShaderPropertyOfMaterial;
    /**
     * Calculates the memory offset of a shader property within storage buffers.
     *
     * @param engine - The engine instance
     * @param isGlobalData - Whether to look in global data repository or material repository
     * @param propertyName - The semantic name of the property
     * @param materialTypeName - The material type name for material-specific properties
     * @returns The byte offset of the property in the storage buffer, or -1 if not found
     */
    private static getOffsetOfPropertyOfMaterial;
    private static getOffsetOfPropertyOfGlobalDataRepository;
    /**
     * Loads and prepares a mesh component for rendering.
     * Sets up vertex buffer objects (VBO) and vertex array objects (VAO) if not already done.
     *
     * @param meshComponent - The mesh component to load
     * @returns True if the mesh was successfully loaded, false if the mesh is null
     */
    $load(meshComponent: MeshComponent): boolean;
    /**
     * Performs common loading operations required for the WebGPU strategy.
     * Initializes morph target arrays and updates blend shape storage buffers when needed.
     */
    common_$load(): void;
    private __initMorphUniformBuffers;
    /**
     * Sets up shader programs for all primitives in the given mesh component.
     * Iterates through all primitives and ensures their materials have proper shader programs.
     *
     * @param meshComponent - The mesh component containing primitives to setup
     */
    private __setupShaderProgramForMeshComponent;
    /**
     * Sets up a shader program for a specific material and primitive combination.
     * Handles shader compilation errors by falling back to backup materials when necessary.
     *
     * @param material - The material to setup the shader for
     * @param primitive - The primitive that will use this material
     */
    private _setupShaderProgram;
    /**
     * Sets up shader programs for materials using the WebGPU rendering strategy.
     * This method orchestrates the shader compilation process by providing the necessary
     * method definitions and property setters.
     *
     * @param material - The material to create shader programs for
     * @param primitive - The primitive geometry that will use this material
     * @param vertexShaderMethodDefinitionsForVertexShader - WGSL code containing vertex shader helper methods
     * @param vertexShaderMethodDefinitionsForPixelShader - WGSL code containing pixel shader helper methods
     * @param propertySetter - Function to generate property accessor methods
     */
    setupShaderForMaterial(material: Material, primitive: Primitive, vertexShaderMethodDefinitionsForVertexShader: string, vertexShaderMethodDefinitionsForPixelShader: string, propertySetterOfGlobalDataRepository: getShaderPropertyFuncOfGlobalDataRepository, propertySetterOfMaterial: getShaderPropertyFuncOfMaterial, morphedPositionGetter: string): void;
    /**
     * Performs pre-rendering operations required before drawing.
     * Updates storage buffers when components have been modified and handles morph target updates.
     * This method should be called once per frame before any rendering operations.
     */
    prerender(): void;
    /**
     * Main rendering method that draws all primitives in the specified render pass.
     * Handles different primitive types (opaque, translucent, blend) with appropriate depth writing settings.
     *
     * @param primitiveUids - Array of primitive UIDs to render, sorted by rendering order
     * @param renderPass - The render pass configuration containing rendering settings
     * @param renderPassTickCount - Current tick count for animation and timing purposes
     * @param displayIdx - The index of the display to render to
     * @returns True if any primitives were successfully rendered
     */
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, _renderPassTickCount: Count, displayIdx: Index): boolean;
    /**
     * Renders primitives without using vertex/index buffers.
     * This is used for special rendering modes like full-screen effects or procedural geometry.
     *
     * @param renderPass - The render pass containing the material and rendering configuration
     */
    private __renderWithoutBuffers;
    /**
     * Renders a single primitive with the specified material and render settings.
     * Handles shader setup, uniform buffer updates, and the actual draw call.
     *
     * @param primitiveUid - Unique identifier of the primitive to render
     * @param renderPass - Render pass containing rendering configuration
     * @param zWrite - Whether to enable depth buffer writing
     * @param displayIdx - The index of the display to render to
     * @returns True if the primitive was successfully rendered
     */
    renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, zWrite: boolean, displayIdx: Index): boolean;
    /**
     * Creates or updates the main storage buffer containing all GPU instance data.
     * This buffer holds transform matrices, material properties, and other per-instance data
     * required for rendering all objects in the scene.
     */
    private __createAndUpdateStorageBuffer;
    /**
     * Creates or updates the storage buffer containing blend shape vertex data.
     * This buffer holds morph target positions and other vertex attributes needed for blend shape animation.
     */
    private __createOrUpdateStorageBlendShapeBuffer;
    private __updateMorphOffsetsUniformBuffer;
    /**
     * Updates uniform buffers containing morph target weights for blend shape animation.
     * Copies weight values from blend shape components to GPU-accessible uniform buffers.
     */
    private __updateMorphWeightsUniformBuffer;
    /**
     * Determines the appropriate camera component SID for the current rendering context.
     * Handles both VR and non-VR rendering scenarios, including multi-view stereo rendering.
     *
     * @param renderPass - The current render pass
     * @param displayIdx - Display index for stereo rendering (0 for left eye, 1 for right eye)
     * @param isVRMainPass - Whether this is a VR main rendering pass
     * @returns The component SID of the appropriate camera, or -1 if no camera is available
     */
    private __getAppropriateCameraComponentSID;
    /**
     * Destroys all GPU resources held by this strategy.
     * Should be called when the engine is being destroyed.
     */
    destroy(): void;
}
