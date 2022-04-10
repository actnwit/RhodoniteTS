import RnObject from '../core/RnObject';
import {IEntity} from '../core/Entity';
import FrameBuffer from './FrameBuffer';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { Vector4 } from '../math/Vector4';
import {EntityUID} from '../../types/CommonTypes';
import Material from '../materials/core/Material';
import {WebGLStrategy} from '../../webgl/main';
import { System } from '../system/System';
import { ModuleManager } from '../system/ModuleManager';
import WebGLResourceRepository from '../../webgl/WebGLResourceRepository';
import {Primitive} from '../geometry/Primitive';
import { MutableVector4 } from '../math/MutableVector4';
import {IVector4} from '../math/IVector';
import {ISceneGraphEntity, IMeshEntity} from '../helpers/EntityHelper';
import {WellKnownComponentTIDs} from '../components/WellKnownComponentTIDs';
import { CameraComponent } from '../components/Camera/CameraComponent';

/**
 * A render pass is a collection of the resources which is used in rendering process.
 */
export default class RenderPass extends RnObject {
  private __entities: (IMeshEntity | ISceneGraphEntity)[] = [];
  private __sceneGraphDirectlyAdded: SceneGraphComponent[] = [];
  private __topLevelSceneGraphComponents?: SceneGraphComponent[] = [];
  private __meshComponents?: MeshComponent[];
  private __frameBuffer?: FrameBuffer;
  private __resolveFrameBuffer?: FrameBuffer;
  private __viewport?: MutableVector4;
  public toClearColorBuffer = false;
  public toClearDepthBuffer = true;
  public toClearStencilBuffer = false;
  public isDepthTest = true;
  public clearColor = Vector4.fromCopyArray([1, 1, 1, 1]);
  public clearDepth = 1;
  public clearStencil = 0;
  public cameraComponent?: CameraComponent;
  public cullFrontFaceCCW = true;
  private __material?: Material;
  private __primitiveMaterial: Map<Primitive, Material> = new Map();
  private __webglRenderingStrategy?: WebGLStrategy;
  public isVrRendering = true;
  public isOutputForVr = false;

  private __preRenderFunc?: Function;
  private static __tmp_Vector4_0 = MutableVector4.zero();

  constructor() {
    super();
  }

  setPreRenderFunction(func: Function) {
    this.__preRenderFunc = func;
  }

  unsetPreRenderFunction() {
    this.__preRenderFunc = void 0;
  }

  doPreRender() {
    if (this.__preRenderFunc != null) {
      this.__preRenderFunc();
    }
  }

  /**
   * Add entities to draw.
   * @param entities An array of entities.
   */
  addEntities(entities: (IMeshEntity | ISceneGraphEntity)[]) {
    for (const entity of entities) {
      const sceneGraphComponent = entity.getSceneGraph()!;
      this.__sceneGraphDirectlyAdded.push(sceneGraphComponent);
      const collectedSgComponents = SceneGraphComponent.flattenHierarchy(
        sceneGraphComponent,
        false
      );
      const collectedEntities = collectedSgComponents.map(
        (sg: SceneGraphComponent) => {
          return sg.entity;
        }
      );

      // Eliminate duplicates
      const map: Map<EntityUID, IMeshEntity | ISceneGraphEntity> = this.__entities
        .concat(collectedEntities)
        .reduce(
          (
            map: Map<EntityUID, IMeshEntity | ISceneGraphEntity>,
            entity: IMeshEntity | ISceneGraphEntity
          ) => {
            map.set(entity.entityUID, entity);
            return map;
          },
          new Map()
        );

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
  get entities(): IEntity[] {
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
          goToTopLevel(sg.parent);
        }
        return sg;
      };
      this.__topLevelSceneGraphComponents = this.__sceneGraphDirectlyAdded.map(
        (sg: SceneGraphComponent) => {
          return goToTopLevel(sg);
        }
      );
      const set = new Set(this.__topLevelSceneGraphComponents);
      this.__topLevelSceneGraphComponents = Array.from(set);
    }
  }

  private __collectMeshComponents() {
    if (this.__meshComponents == null) {
      this.__meshComponents = [];
      this.__entities.filter(entity => {
        const meshComponent = entity.getComponentByComponentTID(
          WellKnownComponentTIDs.MeshComponentTID
        ) as MeshComponent | undefined;
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
  get sceneTopLevelGraphComponents(): SceneGraphComponent[] {
    this.__collectTopLevelSceneGraphComponents();
    return this.__topLevelSceneGraphComponents != null
      ? this.__topLevelSceneGraphComponents
      : [];
  }

  /**
   * Sets the target framebuffer of this render pass.
   * If two or more render pass share a framebuffer, Rhodonite renders entities to the same framebuffer in those render passes.
   * @param framebuffer A framebuffer
   */
  setFramebuffer(framebuffer: FrameBuffer) {
    this.__frameBuffer = framebuffer;
    if (framebuffer != null) {
      this.setViewport(
        Vector4.fromCopyArray([0, 0, framebuffer.width, framebuffer.height])
      );
    } else {
      this.__viewport = undefined;
    }
  }

  /**
   * Gets the framebuffer if this render pass has the target framebuffer.
   * @return A framebuffer
   */
  getFramebuffer(): FrameBuffer | undefined {
    return this.__frameBuffer;
  }

  /**
   * Remove the existing framebuffer
   */
  removeFramebuffer() {
    this.__frameBuffer = undefined;
  }

  /**
   * Sets the viewport of this render pass.
   * @param vec A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
   */
  setViewport(vec: IVector4) {
    if (this.__viewport != null) {
      this.__viewport.copyComponents(vec);
    } else {
      this.__viewport = MutableVector4.fromCopyArray([
        vec.x,
        vec.y,
        vec.z,
        vec.w,
      ]);
    }
  }

  /**
   * Gets the viewport if this render pass has the viewport.
   * @return A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
   */
  getViewport() {
    let viewport = this.__viewport;
    if (viewport != null) {
      viewport = RenderPass.__tmp_Vector4_0.copyComponents(viewport);
    }

    return viewport;
  }

  setResolveFramebuffer(framebuffer: FrameBuffer) {
    const repo = WebGLResourceRepository.getInstance();
    const glw = repo.currentWebGLContextWrapper!;
    if (!glw || !glw.isWebGL2) {
      console.error('resolve framebuffer is unavailable in this webgl context');
      return;
    }
    this.__resolveFrameBuffer = framebuffer;
  }

  getResolveFramebuffer(): FrameBuffer | undefined {
    return this.__resolveFrameBuffer;
  }

  copyFramebufferToResolveFramebuffer() {
    const repo = WebGLResourceRepository.getInstance();
    const webGLResourceFrameBuffer = repo.getWebGLResource(
      this.__frameBuffer!.cgApiResourceUid
    ) as WebGLFramebuffer;
    const webGLResourceResolveFramebuffer = repo.getWebGLResource(
      this.__resolveFrameBuffer!.cgApiResourceUid
    ) as WebGLFramebuffer;

    const glw = repo.currentWebGLContextWrapper!;
    const gl = glw.getRawContextAsWebGL2();
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, webGLResourceFrameBuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, webGLResourceResolveFramebuffer);
    gl.blitFramebuffer(
      0,
      0,
      this.__frameBuffer!.width,
      this.__frameBuffer!.height,
      0,
      0,
      this.__resolveFrameBuffer!.width,
      this.__resolveFrameBuffer!.height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }

  private __setupMaterial(material: Material) {
    if (material.isEmptyMaterial()) return;

    const webglRenderingStrategy = this.__setWebglRenderingStrategyIfNotYet(
      this.__webglRenderingStrategy
    );

    webglRenderingStrategy.setupShaderForMaterial(material);
  }

  /**
   * Sets a material for the primitive on this render pass.
   * If Rhodonite draw the primitive using this render pass, Rhodonite uses this material instead of the material on the primitive.
   * @param material A material attaching to the primitive
   * @param primitive A target primitive
   */
  setMaterialForPrimitive(material: Material, primitive: Primitive) {
    this.__primitiveMaterial.set(primitive, material);

    this.__setupMaterial(material);
  }

  /**
   * Sets a material for all the primitive on this render pass.
   * For all the primitive, Rhodonite uses this material instead of the material on the primitive.
   * Where if this render pass has a map between primitive and material by setMaterialForPrimitive, Rhodonite uses the material mapped by primitive.
   * @param material A material attaching to the primitive
   */
  setMaterial(material: Material) {
    this.__material = material;

    this.__setupMaterial(material);
  }

  get material() {
    return this.__material;
  }

  private __setWebglRenderingStrategyIfNotYet(
    webglRenderingStrategy?: WebGLStrategy
  ): WebGLStrategy {
    if (webglRenderingStrategy != null) {
      return webglRenderingStrategy;
    }
    const processApproach = System.processApproach;

    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = moduleManager.getModule(moduleName)! as any;
    const newWebglRenderingStrategyRef =
      webglModule.getRenderingStrategy(processApproach);
    this.__webglRenderingStrategy = newWebglRenderingStrategyRef;

    return newWebglRenderingStrategyRef;
  }

  private __getMaterialOf(primitive: Primitive) {
    return this.__primitiveMaterial.get(primitive);
  }

  private __hasMaterialOf(primitive: Primitive) {
    return this.__primitiveMaterial.has(primitive);
  }

  getAppropriateMaterial(primitive: Primitive): Material {
    let material;

    if (this.__hasMaterialOf(primitive)) {
      material = this.__getMaterialOf(primitive) as Material;
    } else if (this.material != null) {
      material = this.material;
    } else {
      material = primitive.material;
    }
    return material;
  }
}
