import type { EntityUID, RenderPassUID } from '../../types/CommonTypes';
import { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { MeshComponent } from '../components/Mesh/MeshComponent';
import type { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { flattenHierarchy } from '../components/SceneGraph/SceneGraphOps';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { IEntity } from '../core/Entity';
import { RnObject } from '../core/RnObject';
import { PrimitiveMode, type PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import type { RenderBufferTargetEnum } from '../definitions/RenderBufferTarget';
import { Primitive } from '../geometry/Primitive';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';
import type { IVector4 } from '../math/IVector';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector4 } from '../math/Vector4';
import type { Engine } from '../system/Engine';
import { CGAPIResourceRepository } from './CGAPIResourceRepository';
import type { FrameBuffer } from './FrameBuffer';

type PrimitiveRnObjectUID = number;

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
export class RenderPass extends RnObject {
  private readonly __engine: Engine;
  private readonly __renderPassUID: RenderPassUID;
  private __entities: (IMeshEntity | ISceneGraphEntity)[] = [];
  private __sceneGraphDirectlyAdded: SceneGraphComponent[] = [];
  private __topLevelSceneGraphComponents: SceneGraphComponent[] = [];
  private __meshComponents: MeshComponent[] = [];
  private __optimizedMeshComponents: MeshComponent[] = [];
  private __frameBuffer?: FrameBuffer;
  private __resolveFrameBuffer?: FrameBuffer;
  private __resolveFrameBuffer2?: FrameBuffer;
  private __viewport?: MutableVector4;
  private __material?: Material;
  private __primitiveMaterial: Map<PrimitiveRnObjectUID, WeakRef<Material>> = new Map();

  // Public RenderPass Settings
  /** Whether to clear the color buffer before rendering */
  public toClearColorBuffer = false;
  /** Whether to clear the depth buffer before rendering */
  public toClearDepthBuffer = true;
  /** Whether to clear the stencil buffer before rendering */
  public toClearStencilBuffer = false;
  /** Whether to enable depth testing during rendering */
  public isDepthTest = true;

  /**
   * Depth write mask for primitives drawing.
   * When false, depth values are not written to the depth buffer, but depth clear is still performed.
   */
  public depthWriteMask = true;

  /** The color value used to clear the color buffer (RGBA format) */
  public clearColor = Vector4.fromCopyArray([1, 1, 1, 1]);
  /** The depth value used to clear the depth buffer (typically 1.0 for far plane) */
  public clearDepth = 1;
  /** The stencil value used to clear the stencil buffer */
  public clearStencil = 0;
  /** The camera component used for rendering this pass */
  public cameraComponent?: CameraComponent;

  /**
   * If this value is greater than 1, buffer-less rendering is performed with the specified number of vertices.
   * In this case, registered entities are ignored and not rendered.
   */
  public _drawVertexNumberForBufferLessRendering = 0;
  /** The primitive mode used for buffer-less rendering */
  public _primitiveModeForBufferLessRendering = PrimitiveMode.Triangles;
  /** A dummy primitive used for buffer-less rendering */
  public _dummyPrimitiveForBufferLessRendering: Primitive;

  // VR
  /** Whether VR rendering is enabled for this render pass */
  public isVrRendering = true;
  /** Whether this render pass outputs for VR display */
  public isOutputForVr = false;

  // Internal use
  /** @internal Last index of opaque primitives in the render queue */
  public _lastOpaqueIndex = -1;
  /** @internal Last index of translucent primitives in the render queue */
  public _lastTranslucentIndex = -1;
  /** @internal Last index of blend with Z-write primitives in the render queue */
  public _lastBlendWithZWriteIndex = -1;
  /** @internal Last index of blend without Z-write primitives in the render queue */
  public _lastBlendWithoutZWriteIndex = -1;
  /** @internal Array of last primitive UIDs for optimization */
  public _lastPrimitiveUids: number[] = [];
  /** @internal Last transform components update count for change detection */
  public _lastTransformComponentsUpdateCount = -1;
  /** @internal Last camera controller components update count for change detection */
  public _lastCameraControllerComponentsUpdateCount = -1;
  /** @internal Last scene graph components update count for change detection */
  public _lastSceneGraphComponentsUpdateCount = -1;
  /** @internal Whether something was rendered in the previous frame */
  public _renderedSomethingBefore = true;
  /** @internal Whether the sort render result has changed */
  public _isChangedSortRenderResult = false;

  /** Whether to render opaque primitives contained in this render pass */
  public _toRenderOpaquePrimitives = true;

  /** Whether to render translucent primitives contained in this render pass */
  public _toRenderTranslucentPrimitives = true;

  /** Whether to render blend with Z-write primitives contained in this render pass */
  public _toRenderBlendWithZWritePrimitives = true;

  /** Whether to render blend without Z-write primitives contained in this render pass */
  public _toRenderBlendWithoutZWritePrimitives = true;

  /** Whether to render Effekseer effects in this render pass */
  public toRenderEffekseerEffects = false;
  /** @internal Color attachment targets for rendering */
  public __renderTargetColorAttachments?: RenderBufferTargetEnum[];
  /** @internal Function called before each render operation */
  private __preEachRenderFunc?: () => void;
  /** @internal Function called after each render operation */
  private __postEachRenderFunc?: () => void;
  /** @internal Temporary Vector4 for internal calculations */
  private static __tmp_Vector4_0 = MutableVector4.zero();

  /** @internal Static counter for generating unique mesh UIDs */
  public static __mesh_uid_count = -1;

  /**
   * Creates a new RenderPass instance.
   * Automatically assigns a unique render pass UID.
   */
  constructor(engine: Engine) {
    super();
    this.__engine = engine;
    this._dummyPrimitiveForBufferLessRendering = new Primitive(engine);
    this.__renderPassUID = ++RenderPass.__mesh_uid_count;
  }

  /**
   * Sets whether to render opaque primitives in this render pass.
   * @param toRender - True to render opaque primitives, false to skip them
   */
  setToRenderOpaquePrimitives(toRender: boolean) {
    this._toRenderOpaquePrimitives = toRender;
    this.__calcMeshComponents();
  }

  /**
   * Sets whether to render blend without Z-write primitives in this render pass.
   * @param toRender - True to render blend without Z-write primitives, false to skip them
   */
  setToRenderBlendWithoutZWritePrimitives(toRender: boolean) {
    this._toRenderBlendWithoutZWritePrimitives = toRender;
    this.__calcMeshComponents();
  }

  /**
   * Sets whether to render blend with Z-write primitives in this render pass.
   * @param toRender - True to render blend with Z-write primitives, false to skip them
   */
  setToRenderBlendWithZWritePrimitives(toRender: boolean) {
    this._toRenderBlendWithZWritePrimitives = toRender;
    this.__calcMeshComponents();
  }

  /**
   * Sets whether to render translucent primitives in this render pass.
   * @param toRender - True to render translucent primitives, false to skip them
   */
  setToRenderTranslucentPrimitives(toRender: boolean) {
    this._toRenderTranslucentPrimitives = toRender;
    this.__calcMeshComponents();
  }

  /**
   * Checks if this render pass is in buffer-less rendering mode.
   * @returns True if buffer-less rendering is enabled (vertex count > 0)
   */
  isBufferLessRenderingMode() {
    return this._drawVertexNumberForBufferLessRendering > 0;
  }

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
  setBufferLessRendering(
    primitiveMode: PrimitiveModeEnum,
    drawVertexNumberWithoutEntities: number,
    material: Material
  ) {
    this._primitiveModeForBufferLessRendering = primitiveMode;
    this._drawVertexNumberForBufferLessRendering = drawVertexNumberWithoutEntities;
    this.__material = material;
  }

  /**
   * Configures this render pass for full-screen buffer-less rendering.
   * This is a convenience method that sets up triangle-based full-screen rendering
   * with 3 vertices, commonly used for post-processing effects.
   *
   * @param material - The material to use for full-screen rendering
   */
  setBufferLessFullScreenRendering(material: Material) {
    this._primitiveModeForBufferLessRendering = PrimitiveMode.Triangles;
    this._drawVertexNumberForBufferLessRendering = 3;
    this.__material = material;
  }

  /**
   * Creates a deep clone of this render pass.
   * All properties and collections are copied, creating an independent instance.
   *
   * @returns A new RenderPass instance that is a copy of this one
   */
  clone() {
    const renderPass = new RenderPass(this.__engine);
    renderPass.tryToSetUniqueName(`${this.uniqueName}_cloned`, true);
    renderPass.__entities = this.__entities.concat();
    renderPass.__sceneGraphDirectlyAdded = this.__sceneGraphDirectlyAdded.concat();
    renderPass.__topLevelSceneGraphComponents = this.__topLevelSceneGraphComponents.concat();
    renderPass.__meshComponents = this.__meshComponents.concat();
    renderPass.__optimizedMeshComponents = this.__optimizedMeshComponents.concat();
    renderPass.__frameBuffer = this.__frameBuffer;
    renderPass.__resolveFrameBuffer = this.__resolveFrameBuffer;
    renderPass.__resolveFrameBuffer2 = this.__resolveFrameBuffer2;
    renderPass.__viewport = this.__viewport?.clone();
    renderPass.toClearColorBuffer = this.toClearColorBuffer;
    renderPass.toClearDepthBuffer = this.toClearDepthBuffer;
    renderPass.toClearStencilBuffer = this.toClearStencilBuffer;
    renderPass.isDepthTest = this.isDepthTest;
    renderPass.clearColor = this.clearColor.clone();
    renderPass.clearDepth = this.clearDepth;
    renderPass.clearStencil = this.clearStencil;
    renderPass.cameraComponent = this.cameraComponent;
    renderPass.__material = this.__material;
    renderPass.__primitiveMaterial = new Map(this.__primitiveMaterial);
    renderPass.isVrRendering = this.isVrRendering;
    renderPass.isOutputForVr = this.isOutputForVr;
    renderPass._toRenderOpaquePrimitives = this._toRenderOpaquePrimitives;
    renderPass._toRenderTranslucentPrimitives = this._toRenderTranslucentPrimitives;
    renderPass._toRenderBlendWithoutZWritePrimitives = this._toRenderBlendWithoutZWritePrimitives;
    renderPass.__preEachRenderFunc = this.__preEachRenderFunc;
    renderPass.__postEachRenderFunc = this.__postEachRenderFunc;
    renderPass.__renderTargetColorAttachments = this.__renderTargetColorAttachments?.concat();
    renderPass._lastOpaqueIndex = this._lastOpaqueIndex;
    renderPass._lastTranslucentIndex = this._lastTranslucentIndex;
    renderPass._lastBlendWithZWriteIndex = this._lastBlendWithZWriteIndex;
    renderPass._lastBlendWithoutZWriteIndex = this._lastBlendWithoutZWriteIndex;
    renderPass._lastPrimitiveUids = this._lastPrimitiveUids.concat();
    renderPass._lastTransformComponentsUpdateCount = this._lastTransformComponentsUpdateCount;
    renderPass._lastCameraControllerComponentsUpdateCount = this._lastCameraControllerComponentsUpdateCount;
    renderPass._lastSceneGraphComponentsUpdateCount = this._lastSceneGraphComponentsUpdateCount;
    renderPass._renderedSomethingBefore = this._renderedSomethingBefore;
    renderPass._isChangedSortRenderResult = this._isChangedSortRenderResult;

    return renderPass;
  }

  /**
   * Sets a function to be called before each render operation.
   * This can be used for custom setup logic before rendering begins.
   *
   * @param func - The function to call before rendering
   */
  setPreRenderFunction(func: () => void) {
    this.__preEachRenderFunc = func;
  }

  /**
   * Sets a function to be called after each render operation.
   * This can be used for custom cleanup logic after rendering completes.
   *
   * @param func - The function to call after rendering
   */
  setPostRenderFunction(func: () => void) {
    this.__postEachRenderFunc = func;
  }

  /**
   * Executes the pre-render function if one has been set.
   * This method is called internally by the rendering system.
   *
   * @internal
   */
  doPreRender() {
    if (this.__preEachRenderFunc != null) {
      this.__preEachRenderFunc();
    }
  }

  /**
   * Executes the post-render function if one has been set.
   * This method is called internally by the rendering system.
   *
   * @internal
   */
  doPostRender() {
    if (this.__postEachRenderFunc != null) {
      this.__postEachRenderFunc();
    }
  }

  /**
   * Adds entities to be rendered in this render pass.
   * The entities and their hierarchies are flattened and collected for rendering.
   * Duplicate entities are automatically eliminated.
   *
   * @param entities - An array of scene graph entities to add
   */
  addEntities(entities: ISceneGraphEntity[]) {
    for (const entity of entities) {
      const sceneGraphComponent = entity.getSceneGraph();
      this.__sceneGraphDirectlyAdded.push(sceneGraphComponent);
      const collectedSgComponents = flattenHierarchy(sceneGraphComponent, false);
      const collectedEntities = collectedSgComponents.map((sg: SceneGraphComponent) => {
        return sg.entity;
      });

      // Eliminate duplicates
      const map: Map<EntityUID, IMeshEntity | ISceneGraphEntity> = this.__entities
        .concat(collectedEntities)
        .reduce((map: Map<EntityUID, IMeshEntity | ISceneGraphEntity>, entity: IMeshEntity | ISceneGraphEntity) => {
          map.set(entity.entityUID, entity);
          return map;
        }, new Map());

      this.__entities = Array.from(map.values());
    }

    this.__calcMeshComponents();
    this.__topLevelSceneGraphComponents = [];
    this.__collectTopLevelSceneGraphComponents();
  }

  /**
   * Recalculates and updates the mesh components collections.
   * This includes both the complete list and the optimized list based on rendering flags.
   *
   * @private
   */
  private __calcMeshComponents() {
    this.__meshComponents = [];
    this.__optimizedMeshComponents = [];
    this.__collectMeshComponents();
  }

  /**
   * Gets the list of all entities in this render pass.
   * @returns An array of scene graph entities
   */
  get entities(): ISceneGraphEntity[] {
    return this.__entities;
  }

  /**
   * Removes all entities from this render pass and clears related collections.
   * This effectively empties the render pass of all renderable content.
   */
  clearEntities() {
    this.__meshComponents = [];
    this.__optimizedMeshComponents = [];
    this.__topLevelSceneGraphComponents = [];
    this.__entities = [];
  }

  /**
   * Collects and organizes the top-level scene graph components.
   * This method traverses the hierarchy to find root-level components.
   *
   * @private
   */
  private __collectTopLevelSceneGraphComponents() {
    const goToTopLevel = (sg: SceneGraphComponent) => {
      if (sg.parent) {
        goToTopLevel(sg.parent);
      }
      return sg;
    };
    this.__topLevelSceneGraphComponents = this.__sceneGraphDirectlyAdded.map((sg: SceneGraphComponent) => {
      return goToTopLevel(sg);
    });
    const set = new Set(this.__topLevelSceneGraphComponents);
    this.__topLevelSceneGraphComponents = Array.from(set);
  }

  /**
   * Collects mesh components from entities and creates optimized collections.
   * The optimized collection excludes components based on rendering flags.
   *
   * @private
   */
  private __collectMeshComponents() {
    this.__meshComponents = [];
    this.__optimizedMeshComponents = [];
    this.__entities.filter(entity => {
      const meshComponent = entity.getComponentByComponentTID(WellKnownComponentTIDs.MeshComponentTID) as
        | MeshComponent
        | undefined;
      if (meshComponent != null && meshComponent.mesh != null) {
        this.__meshComponents!.push(meshComponent);
        if (!this._toRenderOpaquePrimitives && meshComponent.mesh.isExistOpaque()) {
          return;
        }

        if (!this._toRenderTranslucentPrimitives && meshComponent.mesh.isExistTranslucent()) {
          return;
        }
        if (!this._toRenderBlendWithZWritePrimitives && meshComponent.mesh.isExistBlendWithZWrite()) {
          return;
        }
        if (!this._toRenderBlendWithoutZWritePrimitives && meshComponent.mesh.isExistBlendWithoutZWrite()) {
          return;
        }
        this.__optimizedMeshComponents!.push(meshComponent);
      }
    });
  }

  /**
   * Gets all mesh components from entities in this render pass.
   * This includes all mesh components regardless of rendering flags.
   *
   * @returns An array of all mesh components
   */
  get meshComponents() {
    return this.__meshComponents;
  }

  /**
   * Gets the optimized mesh components collection for rendering.
   * This collection is filtered based on the rendering flags for different primitive types.
   *
   * @returns An array of mesh components that should be rendered
   * @internal
   */
  get _optimizedMeshComponents() {
    return this.__optimizedMeshComponents;
  }

  /**
   * Gets all top-level scene graph components in this render pass.
   * These are the root components of the scene graph hierarchies.
   *
   * @returns An array of top-level scene graph components
   */
  get sceneTopLevelGraphComponents(): SceneGraphComponent[] {
    return this.__topLevelSceneGraphComponents;
  }

  /**
   * Sets the target framebuffer for this render pass.
   * If multiple render passes share a framebuffer, they will render to the same target.
   * Setting a framebuffer automatically configures the viewport to match the framebuffer size.
   *
   * @param framebuffer - The framebuffer to render to, or undefined to render to the default framebuffer
   */
  setFramebuffer(framebuffer?: FrameBuffer) {
    this.__frameBuffer = framebuffer;
    if (framebuffer != null) {
      this.setViewport(Vector4.fromCopyArray([0, 0, framebuffer.width, framebuffer.height]));
    } else {
      this.__viewport = undefined;
    }
  }

  /**
   * Sets the color attachment targets for rendering.
   * This specifies which color attachments of the framebuffer should be rendered to.
   *
   * @param indeces - Array of render buffer target enums, or undefined to use default targets
   */
  setRenderTargetColorAttachments(indeces?: RenderBufferTargetEnum[]) {
    this.__renderTargetColorAttachments = indeces;
  }

  /**
   * Gets the current render target color attachments.
   * @returns Array of render buffer target enums, or undefined if using defaults
   */
  getRenderTargetColorAttachments(): RenderBufferTargetEnum[] | undefined {
    return this.__renderTargetColorAttachments;
  }

  /**
   * Gets the current framebuffer assigned to this render pass.
   * @returns The framebuffer, or undefined if rendering to the default framebuffer
   */
  getFramebuffer(): FrameBuffer | undefined {
    return this.__frameBuffer;
  }

  /**
   * Removes the current framebuffer assignment.
   * After calling this, the render pass will render to the default framebuffer.
   */
  removeFramebuffer() {
    this.__frameBuffer = undefined;
  }

  /**
   * Sets the viewport for this render pass.
   * The viewport defines the rectangular area of the framebuffer that will be rendered to.
   *
   * @param vec - A Vector4 containing (x, y, width, height) of the viewport
   */
  setViewport(vec: IVector4) {
    if (this.__viewport != null) {
      this.__viewport.copyComponents(vec);
    } else {
      this.__viewport = MutableVector4.fromCopyArray([vec.x, vec.y, vec.z, vec.w]);
    }
  }

  /**
   * Gets the current viewport settings.
   * @returns A Vector4 containing (x, y, width, height) of the viewport, or undefined if not set
   */
  getViewport() {
    let viewport = this.__viewport;
    if (viewport != null) {
      viewport = RenderPass.__tmp_Vector4_0.copyComponents(viewport);
    }

    return viewport;
  }

  /**
   * Sets the resolve framebuffer for multisampling.
   * The resolve framebuffer is used as the destination when resolving multisampled content.
   *
   * @param framebuffer - The resolve framebuffer, or undefined to disable resolving
   */
  setResolveFramebuffer(framebuffer?: FrameBuffer) {
    this.__resolveFrameBuffer = framebuffer;
  }

  /**
   * Gets the current resolve framebuffer.
   * @returns The resolve framebuffer, or undefined if not set
   */
  getResolveFramebuffer(): FrameBuffer | undefined {
    return this.__resolveFrameBuffer;
  }

  /**
   * Sets the secondary resolve framebuffer.
   * This can be used for additional resolve operations or multi-target resolving.
   *
   * @param framebuffer - The secondary resolve framebuffer, or undefined to disable
   */
  setResolveFramebuffer2(framebuffer?: FrameBuffer) {
    this.__resolveFrameBuffer2 = framebuffer;
  }

  /**
   * Gets the current secondary resolve framebuffer.
   * @returns The secondary resolve framebuffer, or undefined if not set
   */
  getResolveFramebuffer2(): FrameBuffer | undefined {
    return this.__resolveFrameBuffer2;
  }

  /**
   * Copies the main framebuffer content to both resolve framebuffers using WebGL.
   * This method handles the blit operations for multisampling resolve.
   *
   * @internal
   */
  _copyFramebufferToResolveFramebuffersWebGL() {
    this.__copyFramebufferToResolveFramebufferInner(this.__resolveFrameBuffer);
    this.__copyFramebufferToResolveFramebufferInner(this.__resolveFrameBuffer2);
  }

  /**
   * Internal helper method for copying framebuffer content to a resolve framebuffer.
   *
   * @param resolveFrameBuffer - The target resolve framebuffer
   * @private
   */
  private __copyFramebufferToResolveFramebufferInner(resolveFrameBuffer?: FrameBuffer) {
    if (resolveFrameBuffer == null) {
      return;
    }
    const repo = WebGLResourceRepository.getInstance();
    const webGLResourceFrameBuffer = repo.getWebGLResource(this.__frameBuffer!.cgApiResourceUid) as WebGLFramebuffer;
    const webGLResourceResolveFramebuffer = repo.getWebGLResource(
      resolveFrameBuffer!.cgApiResourceUid
    ) as WebGLFramebuffer;

    if (webGLResourceFrameBuffer == null || webGLResourceResolveFramebuffer == null) {
      return;
    }

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
      resolveFrameBuffer!.width,
      resolveFrameBuffer!.height,
      gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
      gl.NEAREST
    );
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }

  /**
   * Copies texture data from the first resolve framebuffer to the second using WebGPU.
   * This method handles texture copying operations for WebGPU-based rendering.
   *
   * @internal
   */
  _copyResolve1ToResolve2WebGpu() {
    if (this.__resolveFrameBuffer == null || this.__resolveFrameBuffer2 == null) {
      return;
    }
    const webGpuResourceRepository = CGAPIResourceRepository.getWebGpuResourceRepository();
    for (let i = 0; i < this.__resolveFrameBuffer.colorAttachments.length; i++) {
      if (
        this.__resolveFrameBuffer.colorAttachments[i] == null ||
        this.__resolveFrameBuffer2.colorAttachments[i] == null ||
        this.__resolveFrameBuffer.colorAttachments[i]._textureResourceUid === -1 ||
        this.__resolveFrameBuffer2.colorAttachments[i]._textureResourceUid === -1
      ) {
        continue;
      }

      // if (
      //   webGpuResourceRepository.isMippmappedTexture(
      //     this.__resolveFrameBuffer2.colorAttachments[i]._textureResourceUid
      //   )
      // ) {
      webGpuResourceRepository.copyTextureData(
        this.__resolveFrameBuffer.colorAttachments[i]._textureResourceUid,
        this.__resolveFrameBuffer2.colorAttachments[i]._textureResourceUid
      );
      // } else {
      //   webGpuResourceRepository.deleteTexture(
      //     this.__resolveFrameBuffer2.colorAttachments[i]._textureResourceUid
      //   );
      //   [
      //     this.__resolveFrameBuffer2.colorAttachments[i]._textureResourceUid,
      //     this.__resolveFrameBuffer2.colorAttachments[i]._textureViewResourceUid,
      //   ] = webGpuResourceRepository.duplicateTextureAsMipmapped(
      //     this.__resolveFrameBuffer.colorAttachments[i]._textureResourceUid
      //   );
      // }
    }
  }

  /**
   * Associates a specific material with a primitive for this render pass.
   * When rendering the specified primitive, the render pass will use this material
   * instead of the primitive's default material.
   *
   * @param material - The material to use for the primitive
   * @param primitive - The target primitive to override the material for
   */
  setMaterialForPrimitive(material: Material, primitive: Primitive) {
    this.__primitiveMaterial.set(primitive.objectUID, new WeakRef(material));

    // this.__setupMaterial(material, primitive);s
  }

  /**
   * Sets a default material for all primitives in this render pass.
   * This material will be used for any primitive that doesn't have a specific
   * material override set via setMaterialForPrimitive().
   *
   * @param material - The default material to use for all primitives
   */
  setMaterial(material: Material) {
    this.__material = material;

    // this.__setupMaterial(material);
  }

  /**
   * Gets the default material assigned to this render pass.
   * @returns The default material, or undefined if none is set
   */
  get material() {
    return this.__material;
  }

  /**
   * Gets the specific material assigned to a primitive, if any.
   *
   * @param primitive - The primitive to get the material for
   * @returns The material assigned to the primitive, or undefined if none is set
   * @internal
   */
  _getMaterialOf(primitive: Primitive) {
    return this.__primitiveMaterial.get(primitive.objectUID)?.deref();
  }

  /**
   * Checks if a specific material has been assigned to a primitive.
   *
   * @param primitive - The primitive to check
   * @returns True if the primitive has a specific material assigned
   * @private
   */
  private __hasMaterialOf(primitive: Primitive) {
    return this.__primitiveMaterial.has(primitive.objectUID);
  }

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
  getAppropriateMaterial(primitive: Primitive): Material {
    let material = this._getMaterialOf(primitive);

    if (material != null) {
    } else if (this.__material != null) {
      material = this.__material;
    } else {
      material = primitive.material;
    }
    return material;
  }

  /**
   * Gets the unique identifier for this render pass.
   * @returns The render pass UID
   */
  get renderPassUID() {
    return this.__renderPassUID;
  }
}
