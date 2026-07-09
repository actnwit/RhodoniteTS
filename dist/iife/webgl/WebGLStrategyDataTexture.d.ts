import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { type ShaderTypeEnum } from '../foundation/definitions/ShaderType';
import type { Mesh } from '../foundation/geometry/Mesh';
import { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import type { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine';
import type { CGAPIResourceHandle, Count, Index, PrimitiveUID, WebGLResourceHandle } from '../types/CommonTypes';
import type { WebGLContextWrapper } from './WebGLContextWrapper';
import type { ShaderSources, WebGLStrategy } from './WebGLStrategy';
/**
 * WebGL rendering strategy implementation that uses data textures for storing shader data.
 * This strategy stores uniform data in textures rather than traditional uniform variables,
 * enabling support for larger amounts of instance data and more efficient batch rendering.
 *
 * @remarks
 * This class implements both CGAPIStrategy and WebGLStrategy interfaces, providing
 * a complete rendering pipeline for WebGL with data texture optimization.
 * The strategy is particularly useful for rendering many instances with unique properties.
 */
export declare class WebGLStrategyDataTexture implements CGAPIStrategy, WebGLStrategy {
    private __engine;
    private __dataTextureUid;
    private __dataUBOUid;
    private __morphOffsetsUniformBufferUid;
    private __morphWeightsUniformBufferUid;
    private __lastShader;
    private __lastMaterial?;
    private __lastMaterialStateVersion;
    private __shaderProgram?;
    private __lastRenderPassTickCount;
    private __lightComponents?;
    private __currentComponentSIDs?;
    _totalSizeOfGPUShaderDataStorageExceptMorphData: number;
    private static __isDebugOperationToDataTextureBufferDone;
    private __uniformMorphOffsetsTypedArray?;
    private __uniformMorphWeightsTypedArray?;
    private __lastBlendShapeComponentsUpdateCountForWeights;
    private __lastMorphMaxIndex;
    private __lastMaterialsUpdateCount;
    private __lastTotalSizeOfGPUShaderDataStorageExceptMorphData;
    private __lastTransformComponentsUpdateCount;
    private __lastSceneGraphComponentsUpdateCount;
    private __lastCameraComponentsUpdateCount;
    private __lastCameraControllerComponentsUpdateCount;
    private __lastGpuInstanceDataBufferCount;
    private __lastMorphOffsetsUniformDataSize;
    private __lastMorphWeightsUniformDataSize;
    private __countOfBlendShapeComponents;
    /**
     * Private constructor to enforce singleton pattern.
     * Immediately initializes __currentComponentSIDs from the engine's GlobalDataRepository
     * to avoid null reference errors during rendering.
     */
    private constructor();
    /**
     * Initiates the dumping of the data texture buffer for debugging purposes.
     * This method flags the system to export the data texture buffer contents
     * on the next rendering cycle.
     *
     * @remarks
     * The dumped buffer will be downloaded as a binary file named 'Rhodonite_dataTextureBuffer.bin'.
     * This is useful for debugging shader data layout and content issues.
     */
    static dumpDataTextureBuffer(): void;
    /**
     * method definitions for component data access for data texture-based rendering.
     * Provides GLSL functions for accessing component data through data textures.
     * @param shaderType - The shader type (VertexShader or PixelShader)
     * @returns GLSL shader code string for the component data access method definitions
     */
    static __getComponentDataAccessMethodDefinitions_dataTexture(engine: Engine, shaderType: ShaderTypeEnum): string;
    private static __getMorphedPositionGetter;
    /**
     * Sets up a shader program for the specified material and primitive.
     * This method creates and configures the complete shader program including
     * uniform locations and data texture-specific shader definitions.
     *
     * @param material - The material that requires shader setup
     * @param primitive - The primitive geometry that will use this shader
     * @returns The resource handle of the created or retrieved shader program
     *
     * @remarks
     * This method handles:
     * - Creating the WebGL shader program with data texture method definitions
     * - Setting up basic uniform locations for the material
     * - Configuring material node uniform locations
     * - Setting up additional uniform locations for point sprites
     * - Configuring data texture-specific uniform locations
     */
    setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle;
    /**
     * Re-establishes a shader program for a material using updated shader sources.
     * This method is typically called by debugging tools like Spector.js when
     * shader sources are modified at runtime for inspection or debugging.
     *
     * @param material - The material whose shader needs to be re-setup
     * @param primitive - The primitive geometry associated with the shader
     * @param updatedShaderSources - The modified shader source code
     * @param onError - Callback function to handle compilation or linking errors
     * @returns The resource handle of the updated shader program, or InvalidCGAPIResourceUid on failure
     *
     * @remarks
     * This method performs the same setup as setupShaderForMaterial but uses
     * externally provided shader sources instead of generating them. It's primarily
     * used for debugging workflows where shaders are modified at runtime.
     */
    _reSetupShaderForMaterialBySpector(material: Material, primitive: Primitive, updatedShaderSources: ShaderSources, onError: (message: string) => void): CGAPIResourceHandle;
    /**
     * Generates GLSL shader code for accessing global properties.
     * This method creates shader functions that can fetch data from either data textures
     * or uniform variables, depending on the property type and rendering configuration.
     *
     * @param info - Detailed information about the shader semantic property
     * @returns GLSL shader code string for the property accessor function
     *
     * @remarks
     * This method handles different data types including:
     * - Scalars, vectors, and matrices of various sizes
     * - Array types with proper indexing
     * - Texture samplers
     * - Properties that require explicit uniform variables
     * The generated code optimizes data access based on the property layout in data textures.
     */
    private static __getShaderPropertyOfGlobalDataRepository;
    /**
     * Generates GLSL shader code for accessing material properties.
     * This method creates shader functions that can fetch data from either data textures
     * or uniform variables, depending on the property type and rendering configuration.
     *
     * @param info - Detailed information about the shader semantic property
     * @returns GLSL shader code string for the property accessor function
     *
     * @remarks
     * This method handles different data types including:
     * - Scalars, vectors, and matrices of various sizes
     * - Array types with proper indexing
     * - Texture samplers
     * - Properties that require explicit uniform variables
     * The generated code optimizes data access based on the property layout in data textures.
     */
    private static __getShaderPropertyOfMaterial;
    /**
     * Retrieves the offset position of a property within the shader data layout.
     * This method calculates where a specific property is located in either the
     * global data repository or material-specific data storage.
     *
     * @param isGlobalData - Whether to look in global data or material-specific data
     * @param propertyName - The semantic name of the property to locate
     * @param materialTypeName - The name of the material type (used for material-specific properties)
     * @returns The offset position of the property in the data layout, or -1 if not found
     *
     * @remarks
     * This method is essential for generating correct shader code that can access
     * properties from the data texture at the right memory locations.
     */
    private static getOffsetOfPropertyOfMaterial;
    /**
     * Retrieves the offset position of a property within the global data repository.
     * This method calculates where a specific property is located in the global data repository.
     *
     * @param propertyName - The semantic name of the property to locate
     * @returns The offset position of the property in the global data repository, or -1 if not found
     *
     * @remarks
     * This method is essential for generating correct shader code that can access
     * properties from the data texture at the right memory locations.
     */
    private static getOffsetOfPropertyOfGlobalDataRepository;
    /**
     * Loads and prepares a mesh component for rendering with the data texture strategy.
     * This method validates the mesh, updates current component SIDs, and ensures
     * the mesh's VBO and VAO are properly set up.
     *
     * @param meshComponent - The mesh component to load and prepare for rendering
     * @returns true if the mesh was successfully loaded, false if there was an error
     *
     * @remarks
     * This method performs several important tasks:
     * - Validates that the mesh component has a valid mesh
     * - Updates the current component SIDs for data texture access
     * - Triggers VBO/VAO setup if the mesh hasn't been set up yet
     * - Deletes and recreates the data texture if needed for mesh updates
     */
    $load(meshComponent: MeshComponent): boolean;
    private __updateMorphOffsetsUniformBuffersInner;
    common_$load(): void;
    private __initMorphUniformBuffers;
    private __bindMorphUniformBuffers;
    private __updateMorphOffsetsUniformBuffers;
    /**
     * Creates and updates the data texture with current shader data.
     * This is the main entry point for data texture management that handles
     * the complete update process.
     *
     * @remarks
     * This method delegates to __createAndUpdateDataTextureInner with no size limit,
     * ensuring the entire GPU instance data buffer is copied to the data texture.
     */
    private __createAndUpdateDataTexture;
    /**
     * Internal implementation for creating and updating the data texture.
     * This method handles the actual texture creation, data copying, and GPU upload.
     *
     * @param _copySizeInByte - Optional limit on how many bytes to copy from the GPU instance data buffer
     *
     * @remarks
     * This method performs several critical operations:
     * - Retrieves the GPU instance data buffer from memory manager
     * - Calculates appropriate texture size based on available data
     * - Handles both texture creation (first time) and texture updates (subsequent calls)
     * - Combines GPU instance data with morph target data for complete texture
     * - Provides debug functionality to dump texture contents
     * - Manages texture alignment and padding requirements
     */
    private __createAndUpdateDataTextureInner;
    /**
     * Deletes the current data texture and frees associated GPU resources.
     * This method should be called when the data texture needs to be recreated
     * or when cleaning up resources.
     *
     * @remarks
     * After calling this method, the data texture UID is reset to an invalid state,
     * and a new data texture will be created on the next rendering cycle.
     */
    deleteDataTexture(): void;
    /**
     * Prepares the rendering pipeline before actual rendering begins.
     * This method updates GPU storage (data texture and UBO) based on component
     * update states and manages light components for the current frame.
     *
     * @remarks
     * This method performs conditional updates based on what has changed:
     * - Full update: When animation, transforms, scene graph, or materials change
     * - Camera-only update: When only camera or camera controller data changes
     * - Also retrieves current light components for the rendering pass
     *
     * The method tracks update counts to avoid unnecessary GPU uploads and
     * provides optimal performance by updating only what has changed.
     */
    prerender(): void;
    /**
     * Updates uniform buffers containing morph target weights for blend shape animation.
     * Copies weight values from blend shape components to GPU-accessible uniform buffers.
     */
    private __updateMorphWeightsUniformBuffer;
    /**
     * Determines whether Uniform Buffer Objects (UBO) should be used for data storage.
     * UBOs are only used when both WebGL 2.0 is available and UBO usage is enabled in configuration.
     *
     * @returns true if UBOs should be used, false otherwise
     *
     * @remarks
     * UBOs provide more efficient uniform data transfer for WebGL 2.0 contexts
     * and can store larger amounts of uniform data compared to individual uniforms.
     */
    private __isUboUse;
    /**
     * Creates and updates the Uniform Buffer Object (UBO) with current shader data.
     * This method is only active when UBO usage is enabled and WebGL 2.0 is available.
     *
     * @remarks
     * The UBO stores the same data as the data texture but in a different format
     * optimized for uniform buffer access. This method handles:
     * - Initial UBO creation with proper size allocation
     * - Updating existing UBO with new data from GPU instance buffer
     * - Respecting alignment requirements for uniform buffer layouts
     */
    private __createAndUpdateUBO;
    /**
     * Attaches GPU data for a primitive (placeholder implementation).
     * This method is part of the CGAPIStrategy interface but is not used
     * in the data texture strategy since data is handled through textures.
     *
     * @param primitive - The primitive to attach GPU data for
     */
    attachGPUData(_primitive: Primitive): void;
    /**
     * Internal GPU data attachment (placeholder implementation).
     * This method is part of the interface but not actively used in data texture strategy.
     *
     * @param gl - The WebGL rendering context
     * @param shaderProgram - The shader program to attach data to
     */
    attachGPUDataInner(_gl: WebGLRenderingContext, _shaderProgram: WebGLProgram): void;
    /**
     * Attaches vertex data for a primitive (placeholder implementation).
     * This method is part of the interface but delegates to attachVertexDataInner.
     *
     * @param i - Index parameter (unused in this implementation)
     * @param primitive - The primitive to attach vertex data for
     * @param glw - The WebGL context wrapper
     * @param instanceIDBufferUid - The instance ID buffer resource handle
     */
    attachVertexData(_i: number, _primitive: Primitive, _glw: WebGLContextWrapper, _instanceIDBufferUid: WebGLResourceHandle): void;
    /**
     * Internal implementation for attaching vertex data to the rendering pipeline.
     * This method binds the appropriate Vertex Array Object (VAO) or sets up
     * vertex attribute pointers and element buffer bindings.
     *
     * @param mesh - The mesh containing the vertex data
     * @param primitive - The specific primitive within the mesh
     * @param primitiveIndex - Index of the primitive within the mesh
     * @param glw - The WebGL context wrapper for WebGL operations
     * @param instanceIDBufferUid - Resource handle for instance ID buffer
     *
     * @remarks
     * This method handles two scenarios:
     * - If a VAO exists, it simply binds the VAO (most efficient)
     * - If no VAO exists, it manually sets up vertex attributes and index buffer
     */
    attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveIndex: Index, glw: WebGLContextWrapper, _instanceIDBufferUid: WebGLResourceHandle): void;
    /**
     * Detaches vertex data after rendering to keep VAO state isolated from external renderers.
     *
     * @param glw - The WebGL context wrapper for WebGL operations
     */
    dettachVertexData(glw: WebGLContextWrapper): void;
    /**
     * Gets the singleton instance of WebGLStrategyDataTexture.
     * Creates the instance if it doesn't exist and initializes the WebXR system reference.
     *
     * @returns The singleton instance of WebGLStrategyDataTexture
     *
     * @remarks
     * This method ensures only one instance of the strategy exists throughout the application
     * and properly initializes the WebXR system for VR/AR rendering capabilities.
     */
    static init(engine: Engine): WebGLStrategyDataTexture;
    /**
     * Sets the current component SIDs for each display index in VR/non-VR rendering.
     * This method configures camera component SIDs based on the rendering mode
     * and display configuration.
     *
     * @param renderPass - The current render pass being processed
     * @param displayIdx - The display index (0 or 1 for stereo rendering)
     * @param isVRMainPass - Whether this is a VR main rendering pass
     *
     * @remarks
     * For VR rendering:
     * - Uses WebXR system to get appropriate camera component SID
     * - Handles both multiview and separate eye rendering
     * For non-VR rendering:
     * - Uses the render pass camera or falls back to current camera
     * - Sets camera component SID to -1 if no camera is available
     */
    private __setCurrentComponentSIDsForEachDisplayIdx;
    /**
     * Sets the current component SIDs for each primitive being rendered.
     * This method updates the global component SID array with material-specific information.
     *
     * @param gl - The WebGL rendering context
     * @param material - The material being used for rendering
     * @param shaderProgram - The active shader program
     *
     * @remarks
     * This method ensures the shader has access to the correct material SID
     * and initializes the component SID array if it hasn't been set up yet.
     * The material SID is stored at index 0 of the component SID array.
     */
    private __setCurrentComponentSIDsForEachPrimitive;
    /**
     * Main rendering method that processes all primitives in a render pass.
     * This method handles different primitive types (opaque, translucent, blend)
     * and manages VR/non-VR rendering modes.
     *
     * @param primitiveUids - Array of primitive UIDs to render
     * @param renderPass - The render pass configuration
     * @param renderPassTickCount - Current tick count for the render pass
     * @param displayIdx - The index of the display to render to
     * @returns true if any primitives were successfully rendered, false otherwise
     *
     * @remarks
     * This method processes primitives in the following order:
     * 1. Opaque primitives (back-to-front for depth optimization)
     * 2. Translucent primitives (front-to-back for proper blending)
     * 3. Blend primitives with Z-write enabled
     * 4. Blend primitives without Z-write
     *
     * The method also handles buffer-less rendering mode for special cases
     * and manages depth mask settings for different primitive types.
     */
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: Count, _displayIdx: Index): boolean;
    /**
     * Renders primitives without using vertex/index buffers.
     * This specialized rendering mode is used for certain types of procedural
     * or shader-generated geometry.
     *
     * @param gl - The WebGL 2.0 rendering context
     * @param renderPass - The render pass configuration
     * @param isVRMainPass - Whether this is a VR main rendering pass
     *
     * @remarks
     * This method handles buffer-less rendering by:
     * - Setting up the shader program and data texture binding
     * - Configuring component SIDs and VR state
     * - Setting material parameters directly
     * - Using drawArrays with the specified primitive mode and vertex count
     */
    private __renderWithoutBuffers;
    /**
     * Internal rendering implementation for individual primitives.
     * This method handles the complete rendering pipeline for a single primitive,
     * including shader setup, material configuration, and draw calls.
     *
     * @param primitiveUid - Unique identifier of the primitive to render
     * @param glw - The WebGL context wrapper
     * @param renderPass - The current render pass configuration
     * @param isVRMainPass - Whether this is a VR main rendering pass
     * @param displayCount - Number of displays to render to (1 for normal, 2 for stereo VR)
     * @returns true if the primitive was successfully rendered, false otherwise
     *
     * @remarks
     * This method performs the following operations:
     * - Validates the primitive and retrieves associated mesh and material
     * - Sets up shader program if needed (with caching for performance)
     * - Configures vertex data and VAO/VBO bindings
     * - Sets material parameters and uniforms
     * - Handles per-display rendering for VR stereo
     * - Executes draw calls (instanced rendering for multiple mesh entities)
     *
     * The method optimizes performance by caching shader programs and materials
     * between draw calls and only updating GPU state when necessary.
     */
    private __renderInner;
    /**
     * Binds the data texture to the WebGL context for shader access.
     * This method sets up the texture binding and sampler configuration
     * that allows shaders to access the data texture.
     *
     * @param gl - The WebGL rendering context
     * @param shaderProgram - The shader program that will access the data texture
     *
     * @remarks
     * This method performs the following operations:
     * - Sets the data texture uniform to texture unit 0
     * - Binds the data texture to texture unit 0
     * - Creates and binds a repeat/nearest sampler for optimal data texture access
     *
     * Texture unit 0 is used as a dedicated slot for data texture access.
     * Other material textures should start from texture unit 1.
     */
    private bindDataTexture;
    /**
     * Destroys all GPU resources held by this strategy.
     * Should be called when the engine is being destroyed.
     */
    destroy(): void;
}
