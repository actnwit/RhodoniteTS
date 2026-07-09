import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { MeshComponent } from '../components/Mesh/MeshComponent';
import type { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { RnObject } from '../core/RnObject';
import { type PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import type { RenderBufferTargetEnum } from '../definitions/RenderBufferTarget';
import { Primitive } from '../geometry/Primitive';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';
import type { IVector4 } from '../math/IVector';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector4 } from '../math/Vector4';
import type { Engine } from '../system/Engine';
import type { FrameBuffer } from './FrameBuffer';
/**
 * A render pass represents a collection of rendering resources and settings used in the rendering pipeline.
 * It manages entities, materials, framebuffers, and various rendering states to control how objects are rendered.
 *
 * @example
 * ```typescript
 * const renderPass = new RenderPass();
 * renderPass.addEntities([entity1, entity2]);
 * renderPass.setFramebuffer(framebuffer);
 * renderPass.toClearColorBuffer = true;
 * renderPass.clearColor = Vector4.fromCopyArray([0.2, 0.3, 0.4, 1.0]);
 * ```
 */
export declare class RenderPass extends RnObject {
    private readonly __engine;
    private readonly __renderPassUID;
    private __entities;
    private __sceneGraphDirectlyAdded;
    private __topLevelSceneGraphComponents;
    private __meshComponents;
    private __optimizedMeshComponents;
    private __frameBuffer?;
    private __resolveFrameBuffer?;
    private __resolveFrameBuffer2?;
    private __viewport?;
    private __material?;
    private __primitiveMaterial;
    /** Whether to clear the color buffer before rendering */
    toClearColorBuffer: boolean;
    /** Whether to clear the depth buffer before rendering */
    toClearDepthBuffer: boolean;
    /** Whether to clear the stencil buffer before rendering */
    toClearStencilBuffer: boolean;
    /** Whether to enable depth testing during rendering */
    isDepthTest: boolean;
    /**
     * Depth write mask for primitives drawing.
     * When false, depth values are not written to the depth buffer, but depth clear is still performed.
     */
    depthWriteMask: boolean;
    /** The color value used to clear the color buffer (RGBA format) */
    clearColor: Vector4;
    /** The depth value used to clear the depth buffer (typically 1.0 for far plane) */
    clearDepth: number;
    /** The stencil value used to clear the stencil buffer */
    clearStencil: number;
    /** The camera component used for rendering this pass */
    cameraComponent?: CameraComponent;
    /**
     * If this value is greater than 1, buffer-less rendering is performed with the specified number of vertices.
     * In this case, registered entities are ignored and not rendered.
     */
    _drawVertexNumberForBufferLessRendering: number;
    /** The primitive mode used for buffer-less rendering */
    _primitiveModeForBufferLessRendering: PrimitiveModeEnum;
    /** A dummy primitive used for buffer-less rendering */
    _dummyPrimitiveForBufferLessRendering: Primitive;
    /** Whether VR rendering is enabled for this render pass */
    isVrRendering: boolean;
    /** Whether this render pass outputs for VR display */
    isOutputForVr: boolean;
    /** @internal Last index of opaque primitives in the render queue */
    _lastOpaqueIndex: number;
    /** @internal Last index of translucent primitives in the render queue */
    _lastTranslucentIndex: number;
    /** @internal Last index of blend with Z-write primitives in the render queue */
    _lastBlendWithZWriteIndex: number;
    /** @internal Last index of blend without Z-write primitives in the render queue */
    _lastBlendWithoutZWriteIndex: number;
    /** @internal Array of last primitive UIDs for optimization */
    _lastPrimitiveUids: number[];
    /** @internal Last transform components update count for change detection */
    _lastTransformComponentsUpdateCount: number;
    /** @internal Last camera controller components update count for change detection */
    _lastCameraControllerComponentsUpdateCount: number;
    /** @internal Last scene graph components update count for change detection */
    _lastSceneGraphComponentsUpdateCount: number;
    /** @internal Whether something was rendered in the previous frame */
    _renderedSomethingBefore: boolean;
    /** @internal Whether the sort render result has changed */
    _isChangedSortRenderResult: boolean;
    /** Whether to render opaque primitives contained in this render pass */
    _toRenderOpaquePrimitives: boolean;
    /** Whether to render translucent primitives contained in this render pass */
    _toRenderTranslucentPrimitives: boolean;
    /** Whether to render blend with Z-write primitives contained in this render pass */
    _toRenderBlendWithZWritePrimitives: boolean;
    /** Whether to render blend without Z-write primitives contained in this render pass */
    _toRenderBlendWithoutZWritePrimitives: boolean;
    /** Whether to render Effekseer effects in this render pass */
    toRenderEffekseerEffects: boolean;
    /** @internal Color attachment targets for rendering */
    __renderTargetColorAttachments?: RenderBufferTargetEnum[];
    /** @internal Function called before each render operation */
    private __preEachRenderFunc?;
    /** @internal Function called after each render operation */
    private __postEachRenderFunc?;
    /** @internal Temporary Vector4 for internal calculations */
    private static __tmp_Vector4_0;
    /** @internal Static counter for generating unique mesh UIDs */
    static __mesh_uid_count: number;
    /**
     * Creates a new RenderPass instance.
     * Automatically assigns a unique render pass UID.
     */
    constructor(engine: Engine);
    /**
     * Sets whether to render opaque primitives in this render pass.
     * @param toRender - True to render opaque primitives, false to skip them
     */
    setToRenderOpaquePrimitives(toRender: boolean): void;
    /**
     * Sets whether to render blend without Z-write primitives in this render pass.
     * @param toRender - True to render blend without Z-write primitives, false to skip them
     */
    setToRenderBlendWithoutZWritePrimitives(toRender: boolean): void;
    /**
     * Sets whether to render blend with Z-write primitives in this render pass.
     * @param toRender - True to render blend with Z-write primitives, false to skip them
     */
    setToRenderBlendWithZWritePrimitives(toRender: boolean): void;
    /**
     * Sets whether to render translucent primitives in this render pass.
     * @param toRender - True to render translucent primitives, false to skip them
     */
    setToRenderTranslucentPrimitives(toRender: boolean): void;
    /**
     * Checks if this render pass is in buffer-less rendering mode.
     * @returns True if buffer-less rendering is enabled (vertex count > 0)
     */
    isBufferLessRenderingMode(): boolean;
    /**
     * Configures this render pass for buffer-less rendering mode.
     * In buffer-less rendering, vertices are generated procedurally without vertex buffers.
     * This is useful for full-screen effects or procedural geometry.
     * When enabled, registered entities are ignored and not rendered.
     *
     * @param primitiveMode - The primitive mode to use for rendering
     * @param drawVertexNumberWithoutEntities - Number of vertices to generate and render
     * @param material - The material to use for rendering
     */
    setBufferLessRendering(primitiveMode: PrimitiveModeEnum, drawVertexNumberWithoutEntities: number, material: Material): void;
    /**
     * Configures this render pass for full-screen buffer-less rendering.
     * This is a convenience method that sets up triangle-based full-screen rendering
     * with 3 vertices, commonly used for post-processing effects.
     *
     * @param material - The material to use for full-screen rendering
     */
    setBufferLessFullScreenRendering(material: Material): void;
    /**
     * Creates a deep clone of this render pass.
     * All properties and collections are copied, creating an independent instance.
     *
     * @returns A new RenderPass instance that is a copy of this one
     */
    clone(): RenderPass;
    /**
     * Sets a function to be called before each render operation.
     * This can be used for custom setup logic before rendering begins.
     *
     * @param func - The function to call before rendering
     */
    setPreRenderFunction(func: () => void): void;
    /**
     * Sets a function to be called after each render operation.
     * This can be used for custom cleanup logic after rendering completes.
     *
     * @param func - The function to call after rendering
     */
    setPostRenderFunction(func: () => void): void;
    /**
     * Executes the pre-render function if one has been set.
     * This method is called internally by the rendering system.
     *
     * @internal
     */
    doPreRender(): void;
    /**
     * Executes the post-render function if one has been set.
     * This method is called internally by the rendering system.
     *
     * @internal
     */
    doPostRender(): void;
    /**
     * Adds entities to be rendered in this render pass.
     * The entities and their hierarchies are flattened and collected for rendering.
     * Duplicate entities are automatically eliminated.
     *
     * @param entities - An array of scene graph entities to add
     */
    addEntities(entities: ISceneGraphEntity[]): void;
    /**
     * Recalculates and updates the mesh components collections.
     * This includes both the complete list and the optimized list based on rendering flags.
     *
     * @private
     */
    private __calcMeshComponents;
    /**
     * Gets the list of all entities in this render pass.
     * @returns An array of scene graph entities
     */
    get entities(): ISceneGraphEntity[];
    /**
     * Removes all entities from this render pass and clears related collections.
     * This effectively empties the render pass of all renderable content.
     */
    clearEntities(): void;
    /**
     * Collects and organizes the top-level scene graph components.
     * This method traverses the hierarchy to find root-level components.
     *
     * @private
     */
    private __collectTopLevelSceneGraphComponents;
    /**
     * Collects mesh components from entities and creates optimized collections.
     * The optimized collection excludes components based on rendering flags.
     *
     * @private
     */
    private __collectMeshComponents;
    /**
     * Gets all mesh components from entities in this render pass.
     * This includes all mesh components regardless of rendering flags.
     *
     * @returns An array of all mesh components
     */
    get meshComponents(): MeshComponent[];
    /**
     * Gets the optimized mesh components collection for rendering.
     * This collection is filtered based on the rendering flags for different primitive types.
     *
     * @returns An array of mesh components that should be rendered
     * @internal
     */
    get _optimizedMeshComponents(): MeshComponent[];
    /**
     * Gets all top-level scene graph components in this render pass.
     * These are the root components of the scene graph hierarchies.
     *
     * @returns An array of top-level scene graph components
     */
    get sceneTopLevelGraphComponents(): SceneGraphComponent[];
    /**
     * Sets the target framebuffer for this render pass.
     * If multiple render passes share a framebuffer, they will render to the same target.
     * Setting a framebuffer automatically configures the viewport to match the framebuffer size.
     *
     * @param framebuffer - The framebuffer to render to, or undefined to render to the default framebuffer
     */
    setFramebuffer(framebuffer?: FrameBuffer): void;
    /**
     * Sets the color attachment targets for rendering.
     * This specifies which color attachments of the framebuffer should be rendered to.
     *
     * @param indeces - Array of render buffer target enums, or undefined to use default targets
     */
    setRenderTargetColorAttachments(indeces?: RenderBufferTargetEnum[]): void;
    /**
     * Gets the current render target color attachments.
     * @returns Array of render buffer target enums, or undefined if using defaults
     */
    getRenderTargetColorAttachments(): RenderBufferTargetEnum[] | undefined;
    /**
     * Gets the current framebuffer assigned to this render pass.
     * @returns The framebuffer, or undefined if rendering to the default framebuffer
     */
    getFramebuffer(): FrameBuffer | undefined;
    /**
     * Removes the current framebuffer assignment.
     * After calling this, the render pass will render to the default framebuffer.
     */
    removeFramebuffer(): void;
    /**
     * Sets the viewport for this render pass.
     * The viewport defines the rectangular area of the framebuffer that will be rendered to.
     *
     * @param vec - A Vector4 containing (x, y, width, height) of the viewport
     */
    setViewport(vec: IVector4): void;
    /**
     * Gets the current viewport settings.
     * @returns A Vector4 containing (x, y, width, height) of the viewport, or undefined if not set
     */
    getViewport(): MutableVector4 | undefined;
    /**
     * Sets the resolve framebuffer for multisampling.
     * The resolve framebuffer is used as the destination when resolving multisampled content.
     *
     * @param framebuffer - The resolve framebuffer, or undefined to disable resolving
     */
    setResolveFramebuffer(framebuffer?: FrameBuffer): void;
    /**
     * Gets the current resolve framebuffer.
     * @returns The resolve framebuffer, or undefined if not set
     */
    getResolveFramebuffer(): FrameBuffer | undefined;
    /**
     * Sets the secondary resolve framebuffer.
     * This can be used for additional resolve operations or multi-target resolving.
     *
     * @param framebuffer - The secondary resolve framebuffer, or undefined to disable
     */
    setResolveFramebuffer2(framebuffer?: FrameBuffer): void;
    /**
     * Gets the current secondary resolve framebuffer.
     * @returns The secondary resolve framebuffer, or undefined if not set
     */
    getResolveFramebuffer2(): FrameBuffer | undefined;
    /**
     * Copies the main framebuffer content to both resolve framebuffers using WebGL.
     * This method handles the blit operations for multisampling resolve.
     *
     * @internal
     */
    _copyFramebufferToResolveFramebuffersWebGL(): void;
    /**
     * Internal helper method for copying framebuffer content to a resolve framebuffer.
     *
     * @param resolveFrameBuffer - The target resolve framebuffer
     * @private
     */
    private __copyFramebufferToResolveFramebufferInner;
    /**
     * Copies texture data from the first resolve framebuffer to the second using WebGPU.
     * This method handles texture copying operations for WebGPU-based rendering.
     *
     * @internal
     */
    _copyResolve1ToResolve2WebGpu(): void;
    /**
     * Associates a specific material with a primitive for this render pass.
     * When rendering the specified primitive, the render pass will use this material
     * instead of the primitive's default material.
     *
     * @param material - The material to use for the primitive
     * @param primitive - The target primitive to override the material for
     */
    setMaterialForPrimitive(material: Material, primitive: Primitive): void;
    /**
     * Sets a default material for all primitives in this render pass.
     * This material will be used for any primitive that doesn't have a specific
     * material override set via setMaterialForPrimitive().
     *
     * @param material - The default material to use for all primitives
     */
    setMaterial(material: Material): void;
    /**
     * Gets the default material assigned to this render pass.
     * @returns The default material, or undefined if none is set
     */
    get material(): Material | undefined;
    /**
     * Gets the specific material assigned to a primitive, if any.
     *
     * @param primitive - The primitive to get the material for
     * @returns The material assigned to the primitive, or undefined if none is set
     * @internal
     */
    _getMaterialOf(primitive: Primitive): Material | undefined;
    /**
     * Determines the appropriate material to use for rendering a primitive.
     * The priority order is:
     * 1. Primitive-specific material (set via setMaterialForPrimitive)
     * 2. Render pass default material (set via setMaterial)
     * 3. Primitive's own material
     *
     * @param primitive - The primitive to get the material for
     * @returns The material that should be used for rendering the primitive
     */
    getAppropriateMaterial(primitive: Primitive): Material;
    /**
     * Gets the unique identifier for this render pass.
     * @returns The render pass UID
     */
    get renderPassUID(): number;
}
