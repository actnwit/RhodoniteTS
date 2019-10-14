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
  private __entityMaterial: Map<Entity, Material | undefined> = new Map();
  private __webglRenderingStrategy?: WebGLStrategy;

  constructor() {
    super();
  }

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

  get entities(): Entity[] {
    return this.__entities;
  }

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

  get meshComponents() {
    this.__collectMeshComponents();
    return this.__meshComponents;
  }

  get sceneTopLevelGraphComponents() {
    this.__collectTopLevelSceneGraphComponents();
    return this.__topLevelSceneGraphComponents;
  }

  setFramebuffer(framebuffer: FrameBuffer) {
    this.__frameBuffer = framebuffer;
    this.setViewport(new Vector4(0, 0, framebuffer.width, framebuffer.height));
  }

  getFramebuffer(): FrameBuffer | undefined {
    return this.__frameBuffer;
  }

  setViewport(vec: Vector4) {
    this.__viewport = vec;
  }

  getViewport() {
    return this.__viewport;
  }

  setMaterialForEntityInThisRenderPass(entity: Entity, material: Material | undefined, isPointSprite: boolean = false) {
    this.__entityMaterial.set(entity, material);

    this.__setupMaterial(material, isPointSprite);
  }

  setMaterialForAllEntitiesInThisRenderPass(material: Material, isPointSprite: boolean = false) {
    this.__material = material;

    this.__setupMaterial(material, isPointSprite);
  }

  private __setupMaterial(material: Material | undefined, isPointSprite: boolean = false) {
    if (material == null) return;

    if (this.__webglRenderingStrategy == null) {
      this.__setWebglRenderingStrategy();
    }
    (this.__webglRenderingStrategy as any).setupDefaultShaderSemantics(material, isPointSprite);
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

  private __getMaterialOf(entity: Entity) {
    return this.__entityMaterial.get(entity);
  }

  private __hasMaterialOf(entity: Entity) {
    return this.__entityMaterial.has(entity);
  }

  getAppropriateMaterial(entity: Entity, defaultMaterial: Material | undefined) {
    let material: Material | undefined;

    if (this.__hasMaterialOf(entity)) {
      material = this.__getMaterialOf(entity);
    } else if (this.material != null) {
      material = this.material;
    } else {
      material = defaultMaterial;
    }
    return material;
  }

}
