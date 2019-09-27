import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import FrameBuffer from "./FrameBuffer";
import SceneGraphComponent from "../components/SceneGraphComponent";
import MeshComponent from "../components/MeshComponent";
import Vector4 from "../math/Vector4";
import ColorRgb from "../math/ColorRgb";
import CameraComponent from "../components/CameraComponent";
import { EntityUID } from "../../types/CommonTypes";
import Material from "../materials/Material";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";

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
  public material?: Material;

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

}
