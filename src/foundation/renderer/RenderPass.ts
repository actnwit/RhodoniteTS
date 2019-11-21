import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import FrameBuffer from "./FrameBuffer";
import SceneGraphComponent from "../components/SceneGraphComponent";
import MeshComponent from "../components/MeshComponent";
import Vector4 from "../math/Vector4";
import CameraComponent from "../components/CameraComponent";
import { EntityUID } from "../../types/CommonTypes";
import Material from "../materials/Material";
import { WebGLStrategy } from "../../webgl/main";
import System from "../system/System";
import ModuleManager from '../system/ModuleManager';
import Primitive from "../geometry/Primitive";

/**
 * A render pass is a collecion of the resources which is used in rendering process.
 */
export default class RenderPass extends RnObject {
  private __entities: Entity[] = [];
  private __sceneGraphDirectlyAdded: SceneGraphComponent[] = [];
  private __topLevelSceneGraphComponents?: SceneGraphComponent[] = [];
  private __meshComponents?: MeshComponent[];
  private __frameBuffer?: FrameBuffer;
  private __viewport?: Vector4;
  public toClearColorBuffer = false;
  public toClearDepthBuffer = true;
  public toClearStencilBuffer = false;
  public clearColor = new Vector4(1, 1, 1, 1);
  public clearDepth = 1;
  public clearStencil = 0;
  public cameraComponent?: CameraComponent;
  public cullface: boolean = false;
  public cullFrontFaceCCW: boolean = true;
  private __material?: Material;
  private __primitiveMaterial: Map<Primitive, Material> = new Map();
  private __webglRenderingStrategy?: WebGLStrategy;

  constructor() {
    super();
  }

  /**
   * Add entities to draw.
   * @param entities An array of entities.
   */
  addEntities(entities: Entity[]) {
    for (let entity of entities) {
      const sceneGraphComponent = entity.getSceneGraph();
      this.__sceneGraphDirectlyAdded.push(sceneGraphComponent);
      const collectedSgComponents = SceneGraphComponent.flattenHierarchy(sceneGraphComponent, false);
      const collectedEntities: Entity[] = collectedSgComponents.map((sg: SceneGraphComponent) => { return sg.entity });

      // Eliminate duplicates
      const map: Map<EntityUID, Entity> = this.__entities.concat(collectedEntities).reduce((map: Map<EntityUID, Entity>, entity: Entity) => {
        map.set(entity.entityUID, entity);
        return map;
      }, new Map());

      this.__entities = Array.from(map.values());
    }

    this.__meshComponents = void 0;
    this.__topLevelSceneGraphComponents = void 0;
    this.__collectMeshComponents();
    this.__collectTopLevelSceneGraphComponents();
  }

  /**
   * Gets the list of entities on this render pass.
   * @return An array of entities
   */
  get entities(): Entity[] {
    return this.__entities;
  }

  /**
   * Clear entities on this render pass.
   */
  clearEntities() {
    this.__meshComponents = void 0;
    this.__topLevelSceneGraphComponents = void 0;
    this.__entities = [];
  }

  private __collectTopLevelSceneGraphComponents() {
    if (this.__topLevelSceneGraphComponents == null) {
      const goToTopLevel = (sg: SceneGraphComponent) => {
        if (sg.parent) {
          goToTopLevel(sg.parent)
        }
        return sg;
      };
      this.__topLevelSceneGraphComponents = this.__sceneGraphDirectlyAdded.map((sg: SceneGraphComponent) => {
        return goToTopLevel(sg);
      });
      let set = new Set(this.__topLevelSceneGraphComponents);
      this.__topLevelSceneGraphComponents = Array.from(set);
    }
  }


  private __collectMeshComponents() {
    if (this.__meshComponents == null) {
      this.__meshComponents = [];
      this.__entities.filter((entity) => {
        const meshComponent = entity.getMesh();
        if (meshComponent) {
          this.__meshComponents!.push(meshComponent);
        }
      });
    }
  }

  /**
   * Get all the MeshComponents list of the entities on this render pass.
   * @return An array of MeshComponents
   */
  get meshComponents() {
    this.__collectMeshComponents();
    return this.__meshComponents;
  }

  /**
   * Get all the highest level SceneGraphComponents list of the entities on this render pass.
   * @return An array of SceneGraphComponents
   */
  get sceneTopLevelGraphComponents() {
    this.__collectTopLevelSceneGraphComponents();
    return this.__topLevelSceneGraphComponents;
  }

  /**
   * Sets the target framebuffer of this render pass.
   * If two or more render pass share a framebuffer, Rhodonite renders entities in render passes to same framebuffer.
   * @param framebuffer A framebuffer
   */
  setFramebuffer(framebuffer: FrameBuffer) {
    this.__frameBuffer = framebuffer;
    this.setViewport(new Vector4(0, 0, framebuffer.width, framebuffer.height));
  }

  /**
   * Gets the framebuffer if this render pass has the target framebuffer.
   * @return A framebuffer
   */
  getFramebuffer(): FrameBuffer | undefined {
    return this.__frameBuffer;
  }

  /**
   * Sets the viewport of this render pass.
   * @param vec A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
   */
  setViewport(vec: Vector4) {
    this.__viewport = vec;
  }

  /**
   * Gets the viewport if this render pass has the viewport.
   * @return A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
   */
  getViewport() {
    return this.__viewport;
  }

  private __setupMaterial(material: Material, isPointSprite: boolean = false) {
    if (material.isEmptyMaterial()) return;

    if (this.__webglRenderingStrategy == null) {
      this.__setWebglRenderingStrategy();
    }
    (this.__webglRenderingStrategy as any).setupDefaultShaderSemantics(material, isPointSprite);
  }

  /**
   * Sets a material for the primitive on this render pass.
   * If Rhodonite draw the primitive using this render pass, Rhodonite uses this material instead of the material on the primitive.
   * @param material A material attaching to the primitive
   * @param primitive A target primitive
   * @param isPointSprite Set true, if the primitive is a point sprite
   */
  setMaterialForPrimitive(material: Material, primitive: Primitive, isPointSprite: boolean = false) {
    this.__primitiveMaterial.set(primitive, material);

    this.__setupMaterial(material, isPointSprite);
  }

  /**
   * Sets a material for all the primitive on this render pass.
   * For all the primitive, Rhodonite uses this material instead of the material on the primitive.
   * Where if this render pass has a map between primitive and material by setMaterialForPrimitive, Rhodonite uses the material mapped by primitive.
   * @param material A material attaching to the primitive
   * @param isPointSprite Set true, if the primitive is a point sprite
   */
  setMaterial(material: Material, isPointSprite: boolean = false) {
    this.__material = material;

    this.__setupMaterial(material, isPointSprite);
  }

  get material() {
    return this.__material;
  }


  private __setWebglRenderingStrategy() {
    const system = System.getInstance();
    const processApproach = system.processApproach;

    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = (moduleManager.getModule(moduleName)! as any);
    this.__webglRenderingStrategy = webglModule.getRenderingStrategy(processApproach);
  }

  private __getMaterialOf(primitive: Primitive) {
    return this.__primitiveMaterial.get(primitive);
  }

  private __hasMaterialOf(primitive: Primitive) {
    return this.__primitiveMaterial.has(primitive);
  }

  getAppropriateMaterial(primitive: Primitive, defaultMaterial: Material): Material {
    let material;

    if (this.__hasMaterialOf(primitive)) {
      material = this.__getMaterialOf(primitive) as Material;
    } else if (this.material != null) {
      material = this.material;
    } else {
      material = defaultMaterial;
    }
    return material;
  }

}
