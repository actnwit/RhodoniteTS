import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import FrameBuffer from "./FrameBuffer";
import SceneGraphComponent from "../components/SceneGraphComponent";
import MeshComponent from "../components/MeshComponent";
import Vector4 from "../math/Vector4";
import CameraComponent from "../components/CameraComponent";
import Material from "../materials/Material";
import Primitive from "../geometry/Primitive";
/**
 * A render pass is a collecion of the resources which is used in rendering process.
 */
export default class RenderPass extends RnObject {
    private __entities;
    private __sceneGraphDirectlyAdded;
    private __topLevelSceneGraphComponents?;
    private __meshComponents?;
    private __frameBuffer?;
    private __viewport?;
    toClearColorBuffer: boolean;
    toClearDepthBuffer: boolean;
    toClearStencilBuffer: boolean;
    clearColor: Vector4;
    clearDepth: number;
    clearStencil: number;
    cameraComponent?: CameraComponent;
    cullface: boolean;
    cullFrontFaceCCW: boolean;
    private __material?;
    private __primitiveMaterial;
    private __webglRenderingStrategy?;
    constructor();
    /**
     * Add entities to draw.
     * @param entities An array of entities.
     */
    addEntities(entities: Entity[]): void;
    /**
     * Gets the list of entities on this render pass.
     * @return An array of entities
     */
    get entities(): Entity[];
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
    get meshComponents(): MeshComponent[] | undefined;
    /**
     * Get all the highest level SceneGraphComponents list of the entities on this render pass.
     * @return An array of SceneGraphComponents
     */
    get sceneTopLevelGraphComponents(): SceneGraphComponent[] | undefined;
    /**
     * Sets the target framebuffer of this render pass.
     * If two or more render pass share a framebuffer, Rhodonite renders entities in render passes to same framebuffer.
     * @param framebuffer A framebuffer
     */
    setFramebuffer(framebuffer: FrameBuffer): void;
    /**
     * Gets the framebuffer if this render pass has the target framebuffer.
     * @return A framebuffer
     */
    getFramebuffer(): FrameBuffer | undefined;
    /**
     * Sets the viewport of this render pass.
     * @param vec A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
     */
    setViewport(vec: Vector4): void;
    /**
     * Gets the viewport if this render pass has the viewport.
     * @return A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
     */
    getViewport(): Vector4 | undefined;
    private __setupMaterial;
    /**
     * Sets a material for the primitive on this render pass.
     * If Rhodonite draw the primitive using this render pass, Rhodonite uses this material instead of the material on the primitive.
     * @param material A material attaching to the primitive
     * @param primitive A target primitive
     * @param isPointSprite Set true, if the primitive is a point sprite
     */
    setMaterialForPrimitive(material: Material, primitive: Primitive, isPointSprite?: boolean): void;
    /**
     * Sets a material for all the primitive on this render pass.
     * For all the primitive, Rhodonite uses this material instead of the material on the primitive.
     * Where if this render pass has a map between primitive and material by setMaterialForPrimitive, Rhodonite uses the material mapped by primitive.
     * @param material A material attaching to the primitive
     * @param isPointSprite Set true, if the primitive is a point sprite
     */
    setMaterial(material: Material, isPointSprite?: boolean): void;
    get material(): Material | undefined;
    private __setWebglRenderingStrategy;
    private __getMaterialOf;
    private __hasMaterialOf;
    getAppropriateMaterial(primitive: Primitive, defaultMaterial: Material): Material;
}
