import { RnObject } from '../core/RnObject';
import { IEntity } from '../core/Entity';
import { FrameBuffer } from './FrameBuffer';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { Vector4 } from '../math/Vector4';
import { Material } from '../materials/core/Material';
import { Primitive } from '../geometry/Primitive';
import { MutableVector4 } from '../math/MutableVector4';
import { IVector4 } from '../math/IVector';
import { ISceneGraphEntity, IMeshEntity } from '../helpers/EntityHelper';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { RenderBufferTargetEnum } from '../definitions/RenderBufferTarget';
import { PrimitiveModeEnum } from '../definitions/PrimitiveMode';
/**
 * A render pass is a collection of the resources which is used in rendering process.
 */
export declare class RenderPass extends RnObject {
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
    toClearColorBuffer: boolean;
    toClearDepthBuffer: boolean;
    toClearStencilBuffer: boolean;
    isDepthTest: boolean;
    /**
     * depth write mask for primitives drawing
     * false does not prevent depth clear.
     */
    depthWriteMask: boolean;
    clearColor: Vector4;
    clearDepth: number;
    clearStencil: number;
    cameraComponent?: CameraComponent;
    _drawVertexNumberForBufferLessRendering: number;
    _primitiveModeForBufferLessRendering: PrimitiveModeEnum;
    _dummyPrimitiveForBufferLessRendering: Primitive;
    isVrRendering: boolean;
    isOutputForVr: boolean;
    _lastOpaqueIndex: number;
    _lastTranslucentIndex: number;
    _lastBlendWithZWriteIndex: number;
    _lastBlendWithoutZWriteIndex: number;
    _lastPrimitiveUids: number[];
    _lastTransformComponentsUpdateCount: number;
    _lastCameraControllerComponentsUpdateCount: number;
    _lastSceneGraphComponentsUpdateCount: number;
    _renderedSomethingBefore: boolean;
    _isChangedSortRenderResult: boolean;
    /** Whether or not to draw opaque primitives contained in this render pass. */
    _toRenderOpaquePrimitives: boolean;
    /** Whether or not to draw translucent primitives contained in this render pass. */
    _toRenderTranslucentPrimitives: boolean;
    /** Whether or not to draw blend with ZWrite primitives contained in this render pass. */
    _toRenderBlendWithZWritePrimitives: boolean;
    /** Whether or not to draw blend without ZWrite primitives contained in this render pass. */
    _toRenderBlendWithoutZWritePrimitives: boolean;
    toRenderEffekseerEffects: boolean;
    __renderTargetColorAttachments?: RenderBufferTargetEnum[];
    private __postEachRenderFunc?;
    private static __tmp_Vector4_0;
    static __mesh_uid_count: number;
    constructor();
    setToRenderOpaquePrimitives(toRender: boolean): void;
    setToRenderBlendWithoutZWritePrimitives(toRender: boolean): void;
    setToRenderBlendWithZWritePrimitives(toRender: boolean): void;
    setToRenderTranslucentPrimitives(toRender: boolean): void;
    isBufferLessRenderingMode(): boolean;
    /**
     * @brief Set this render pass to buffer-less rendering mode.
     * When this function is called, buffer-less rendering is performed only once with the specified number of vertices.
     * This is useful for e.g. full-screen drawing.
     * In this case, even if Entities are registered using the addEntities method, they will be ignored and will not be rendered.
     * @param primitiveMode The primitive mode to be used in buffer-less rendering.
     * @param drawVertexNumberWithoutEntities The number of vertices to be rendered in buffer-less rendering.
     * @param material The material to be used in buffer-less rendering.
     */
    setBufferLessRendering(primitiveMode: PrimitiveModeEnum, drawVertexNumberWithoutEntities: number, material: Material): void;
    /**
     * @brief Set this render pass to buffer-less rendering mode.
     * When this function is called, buffer-less rendering is performed only once with the specified number of vertices.
     * This is useful for e.g. full-screen drawing.
     * In this case, even if Entities are registered using the addEntities method, they will be ignored and will not be rendered.
     * @param material The material to be used in buffer-less rendering.
     */
    setBufferLessFullScreenRendering(material: Material): void;
    clone(): RenderPass;
    setPostRenderFunction(func: () => void): void;
    doPostRender(): void;
    /**
     * Add entities to draw.
     * @param entities An array of entities.
     */
    addEntities(entities: (IMeshEntity | ISceneGraphEntity)[]): void;
    private __calcMeshComponents;
    /**
     * Gets the list of entities on this render pass.
     * @return An array of entities
     */
    get entities(): IEntity[];
    /**
     * Clear entities on this render pass.
     */
    clearEntities(): void;
    private __collectTopLevelSceneGraphComponents;
    private __collectMeshComponents;
    /**
     * Get all the MeshComponents list of the entities on this render pass.
     * @return An array of MeshComponents
     */
    get meshComponents(): MeshComponent[];
    /**
     * Get MeshComponents list to render
     * @return An array of MeshComponents
     */
    get _optimizedMeshComponents(): MeshComponent[];
    /**
     * Get all the highest level SceneGraphComponents list of the entities on this render pass.
     * @return An array of SceneGraphComponents
     */
    get sceneTopLevelGraphComponents(): SceneGraphComponent[];
    /**
     * Sets the target framebuffer of this render pass.
     * If two or more render pass share a framebuffer, Rhodonite renders entities to the same framebuffer in those render passes.
     * @param framebuffer A framebuffer
     */
    setFramebuffer(framebuffer?: FrameBuffer): void;
    setRenderTargetColorAttachments(indeces?: RenderBufferTargetEnum[]): void;
    getRenderTargetColorAttachments(): RenderBufferTargetEnum[] | undefined;
    /**
     * Gets the framebuffer if this render pass has the target framebuffer.
     * @return A framebuffer
     */
    getFramebuffer(): FrameBuffer | undefined;
    /**
     * Remove the existing framebuffer
     */
    removeFramebuffer(): void;
    /**
     * Sets the viewport of this render pass.
     * @param vec A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
     */
    setViewport(vec: IVector4): void;
    /**
     * Gets the viewport if this render pass has the viewport.
     * @return A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
     */
    getViewport(): MutableVector4 | undefined;
    setResolveFramebuffer(framebuffer?: FrameBuffer): void;
    getResolveFramebuffer(): FrameBuffer | undefined;
    setResolveFramebuffer2(framebuffer?: FrameBuffer): void;
    getResolveFramebuffer2(): FrameBuffer | undefined;
    _copyFramebufferToResolveFramebuffersWebGL(): void;
    private __copyFramebufferToResolveFramebufferInner;
    _copyResolve1ToResolve2WebGpu(): void;
    /**
     * Sets a material for the primitive on this render pass.
     * If Rhodonite draw the primitive using this render pass, Rhodonite uses this material instead of the material on the primitive.
     * @param material A material attaching to the primitive
     * @param primitive A target primitive
     */
    setMaterialForPrimitive(material: Material, primitive: Primitive): void;
    /**
     * Sets a material for all the primitive on this render pass.
     * For all the primitive, Rhodonite uses this material instead of the material on the primitive.
     * Where if this render pass has a map between primitive and material by setMaterialForPrimitive, Rhodonite uses the material mapped by primitive.
     * @param material A material attaching to the primitive
     */
    setMaterial(material: Material): void;
    get material(): Material | undefined;
    _getMaterialOf(primitive: Primitive): Material | undefined;
    private __hasMaterialOf;
    getAppropriateMaterial(primitive: Primitive): Material;
    get renderPassUID(): number;
}
