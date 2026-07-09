import type { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
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
 * WebGL rendering strategy implementation using uniform-based approach.
 * This strategy uses uniforms to pass per-object data to shaders instead of vertex attributes,
 * which is more suitable for rendering multiple objects with different properties.
 *
 * @implements {CGAPIStrategy}
 * @implements {WebGLStrategy}
 */
export declare class WebGLStrategyUniform implements CGAPIStrategy, WebGLStrategy {
    private __engine;
    private __dataTextureUid;
    private __morphOffsetsUniformBufferUid;
    private __morphWeightsUniformBufferUid;
    private __uniformMorphOffsetsTypedArray?;
    private __uniformMorphWeightsTypedArray?;
    private __lastShader;
    private __lastMaterial?;
    private __lastRenderPassTickCount;
    private __lastMorphMaxIndex;
    private __lastBlendShapeComponentsUpdateCountForWeights;
    private __lastMorphOffsetsUniformDataSize;
    private __lastMorphWeightsUniformDataSize;
    private __lightComponents?;
    private __countOfBlendShapeComponents;
    /**
     * Shader semantics information for component matrices used in uniform rendering strategy.
     * Defines world matrix, normal matrix, billboard flag, and vertex attributes existence array.
     */
    private static getComponentMatricesInfoArray;
    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor();
    /**
     * method definitions for component data access for uniform-based rendering.
     * Provides GLSL functions for accessing component data through uniforms.
     */
    private static __getComponentDataAccessMethodDefinitions_uniform;
    private static __getMorphedPositionGetter;
    /**
     * Sets up shader program for the given material and primitive in this WebGL strategy.
     * Creates a new shader program if needed and configures uniform locations for rendering.
     *
     * @param material - The material to setup shader program for
     * @param primitive - The primitive geometry to associate with the shader
     * @returns The CGAPIResourceHandle of the created or existing shader program
     */
    setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle;
    /**
     * Re-sets up shader program for the material using updated shader sources from Spector.js.
     * This method is specifically designed for shader debugging and live editing scenarios.
     *
     * @param material - The material to re-setup shader program for
     * @param primitive - The primitive geometry associated with the shader
     * @param updatedShaderSources - The updated shader source code
     * @param onError - Callback function to handle compilation errors
     * @returns The CGAPIResourceHandle of the updated shader program, or InvalidCGAPIResourceUid on failure
     */
    _reSetupShaderForMaterialBySpector(material: Material, primitive: Primitive, updatedShaderSources: ShaderSources, onError: (message: string) => void): CGAPIResourceHandle;
    /**
     * Loads and prepares mesh data for rendering.
     * Sets up VBO (Vertex Buffer Object) and VAO (Vertex Array Object) if not already done.
     *
     * @param meshComponent - The mesh component containing the mesh to load
     * @returns True if the mesh was loaded successfully, false otherwise
     */
    $load(meshComponent: MeshComponent): boolean;
    private __updateMorphOffsetsUniformBuffersInner;
    private __initMorphUniformBuffers;
    private __bindMorphUniformBuffers;
    /**
     * Updates uniform buffers containing morph target weights for blend shape animation.
     * Copies weight values from blend shape components to GPU-accessible uniform buffers.
     */
    private __updateMorphWeightsUniformBuffer;
    /**
     * Performs pre-rendering setup operations.
     * Initializes light components, sets up data texture for GPU vertex data,
     * and prepares global rendering state.
     */
    prerender(): void;
    /**
     * Deletes the current data texture and frees associated GPU resources.
     * This method should be called when the data texture needs to be recreated
     * or when cleaning up resources.
     *
     * @remarks
     * After calling this method, the data texture UID is reset to an invalid state,
     * and a new data texture will be created on the next rendering cycle.
     */
    deleteDataTexture(engine: Engine): void;
    /**
     * Attaches GPU data for the primitive.
     * This method is part of the CGAPIStrategy interface but is a no-op in uniform strategy
     * as GPU data is handled differently through data textures.
     *
     * @param primitive - The primitive to attach GPU data for
     */
    attachGPUData(_primitive: Primitive): void;
    /**
     * Attaches vertex data for rendering.
     * This method is part of the CGAPIStrategy interface but is a no-op in uniform strategy
     * as vertex data attachment is handled in attachVertexDataInner.
     *
     * @param i - Index parameter (unused in uniform strategy)
     * @param primitive - The primitive containing vertex data
     * @param glw - WebGL context wrapper
     * @param instanceIDBufferUid - Instance ID buffer handle (unused in uniform strategy)
     */
    attachVertexData(_i: number, _primitive: Primitive, _glw: WebGLContextWrapper, _instanceIDBufferUid: WebGLResourceHandle): void;
    /**
     * Internal method to attach vertex data for a specific mesh and primitive.
     * Binds the appropriate VAO or sets up vertex data pipeline for rendering.
     *
     * @param mesh - The mesh containing vertex data
     * @param primitive - The primitive geometry to render
     * @param primitiveUid - Unique identifier for the primitive
     * @param glw - WebGL context wrapper
     * @param instanceIDBufferUid - Instance ID buffer handle (unused in uniform strategy)
     */
    attachVertexDataInner(engine: Engine, mesh: Mesh, primitive: Primitive, primitiveUid: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    /**
     * Detaches vertex data and cleans up OpenGL state after rendering.
     * Unbinds VAO, element array buffer, and array buffer to prevent state leakage.
     *
     * @param glw - WebGL context wrapper used for state cleanup
     */
    dettachVertexData(glw: WebGLContextWrapper): void;
    /**
     * Gets the singleton instance of WebGLStrategyUniform.
     * Initializes the instance and WebXR system if not already created.
     *
     * @returns The singleton instance of WebGLStrategyUniform
     */
    static init(engine: Engine): WebGLStrategyUniform;
    common_$load(): void;
    private __updateMorphOffsetsUniformBuffers;
    /**
     * Common rendering method that handles the main rendering pipeline.
     * Processes primitives in different rendering phases: opaque, translucent, blend with/without Z-write.
     * Supports buffer-less rendering mode for special cases like post-processing effects.
     *
     * @param primitiveUids - Array of primitive UIDs to render, sorted by rendering order
     * @param renderPass - The render pass configuration containing rendering settings
     * @param renderPassTickCount - Current tick count for the render pass
     * @param displayIdx - The index of the display to render to
     * @returns True if any primitives were rendered, false otherwise
     */
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: Count, _displayIdx: Index): boolean;
    /**
     * Renders primitives without using vertex/index buffers.
     * Used for buffer-less rendering scenarios such as full-screen post-processing effects.
     *
     * @param gl - WebGL2 rendering context
     * @param renderPass - The render pass containing material and rendering configuration
     */
    private __renderWithoutBuffers;
    /**
     * Internal rendering method for processing individual primitives.
     * Handles shader setup, material parameters, lighting, VR rendering, and draw calls
     * for each mesh entity associated with the primitive.
     *
     * @param primitiveUid - Unique identifier of the primitive to render
     * @param glw - WebGL context wrapper
     * @param renderPass - The render pass configuration
     * @param renderPassTickCount - Current tick count for the render pass
     * @returns True if the primitive was rendered successfully, false otherwise
     */
    renderInner(primitiveUid: PrimitiveUID, glw: WebGLContextWrapper, renderPass: RenderPass, _renderPassTickCount: Count): boolean;
    /**
     * Binds the data texture containing vertex data to the shader program.
     * The data texture is used to store and access vertex data in uniform rendering strategy.
     *
     * @param gl - WebGL rendering context
     * @param shaderProgram - The shader program to bind the texture to
     */
    private bindDataTexture;
    /**
     * Destroys all GPU resources held by this strategy.
     * Should be called when the engine is being destroyed.
     */
    destroy(): void;
}
