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
import { RenderBufferTargetEnum } from '../definitions';
/**
 * A render pass is a collection of the resources which is used in rendering process.
 */
export declare class RenderPass extends RnObject {
    private readonly __renderPassUID;
    private __entities;
    private __sceneGraphDirectlyAdded;
    private __topLevelSceneGraphComponents?;
    private __meshComponents?;
    private __frameBuffer?;
    private __resolveFrameBuffer?;
    private __resolveFrameBuffer2?;
    private __viewport?;
    toClearColorBuffer: boolean;
    toClearDepthBuffer: boolean;
    toClearStencilBuffer: boolean;
    isDepthTest: boolean;
    clearColor: Vector4;
    clearDepth: number;
    clearStencil: number;
    cameraComponent?: CameraComponent;
    cullFrontFaceCCW: boolean;
    private __material?;
    private __primitiveMaterial;
    private __webglRenderingStrategy?;
    isVrRendering: boolean;
    isOutputForVr: boolean;
    /** Whether or not to draw opaque primitives contained in this render pass. */
    toRenderOpaquePrimitives: boolean;
    /** Whether or not to draw transparent primitives contained in this render pass. */
    toRenderTransparentPrimitives: boolean;
    toRenderEffekseerEffects: boolean;
    drawCount: number;
    __renderTargetColorAttachments?: RenderBufferTargetEnum[];
    private __preEachDrawFunc?;
    private __postEachRenderFunc?;
    private static __tmp_Vector4_0;
    static __mesh_uid_count: number;
    constructor();
    clone(): RenderPass;
    setPreDrawFunction(func: (drawCount: number) => void): void;
    unsetPreDrawFunction(): void;
    doPreEachDraw(drawCount: number): void;
    setPostRenderFunction(func: () => void): void;
    doPostRender(): void;
    /**
     * Add entities to draw.
     * @param entities An array of entities.
     */
    addEntities(entities: (IMeshEntity | ISceneGraphEntity)[]): void;
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
     * Get all the highest level SceneGraphComponents list of the entities on this render pass.
     * @return An array of SceneGraphComponents
     */
    get sceneTopLevelGraphComponents(): SceneGraphComponent[];
    /**
     * Sets the target framebuffer of this render pass.
     * If two or more render pass share a framebuffer, Rhodonite renders entities to the same framebuffer in those render passes.
     * @param framebuffer A framebuffer
     */
    setFramebuffer(framebuffer: FrameBuffer): void;
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
    setResolveFramebuffer(framebuffer: FrameBuffer): void;
    getResolveFramebuffer(): FrameBuffer | undefined;
    setResolveFramebuffer2(framebuffer: FrameBuffer): void;
    getResolveFramebuffer2(): FrameBuffer | undefined;
    _copyFramebufferToResolveFramebuffers(): void;
    private __copyFramebufferToResolveFramebufferInner;
    private __setupMaterial;
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
    private __setWebglRenderingStrategyIfNotYet;
    _getMaterialOf(primitive: Primitive): Material | undefined;
    private __hasMaterialOf;
    getAppropriateMaterial(primitive: Primitive): Material;
    get renderPassUID(): number;
}
