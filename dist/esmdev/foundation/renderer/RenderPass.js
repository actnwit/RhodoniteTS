// src/foundation/renderer/RenderPass.ts
import { flattenHierarchy } from "../components/SceneGraph/SceneGraphOps.js";
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs.js";
import { RnObject } from "../core/RnObject.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { Primitive } from "../geometry/Primitive.js";
import { MutableVector4 } from "../math/MutableVector4.js";
import { Vector4 } from "../math/Vector4.js";
var _RenderPass = class _RenderPass extends RnObject {
  /**
   * Creates a new RenderPass instance.
   * Automatically assigns a unique render pass UID.
   */
  constructor(engine) {
    super();
    this.Zi = [];
    this.Nx = [];
    this.Ex = [];
    this.Fx = [];
    this.Gx = [];
    this.Jx = /* @__PURE__ */ new Map();
    // Public RenderPass Settings
    /** Whether to clear the color buffer before rendering */
    this.toClearColorBuffer = false;
    /** Whether to clear the depth buffer before rendering */
    this.toClearDepthBuffer = true;
    /** Whether to clear the stencil buffer before rendering */
    this.toClearStencilBuffer = false;
    /** Whether to enable depth testing during rendering */
    this.isDepthTest = true;
    /**
     * Depth write mask for primitives drawing.
     * When false, depth values are not written to the depth buffer, but depth clear is still performed.
     */
    this.depthWriteMask = true;
    /** The color value used to clear the color buffer (RGBA format) */
    this.clearColor = Vector4.fromCopyArray([1, 1, 1, 1]);
    /** The depth value used to clear the depth buffer (typically 1.0 for far plane) */
    this.clearDepth = 1;
    /** The stencil value used to clear the stencil buffer */
    this.clearStencil = 0;
    /**
     * If this value is greater than 1, buffer-less rendering is performed with the specified number of vertices.
     * In this case, registered entities are ignored and not rendered.
     */
    this._drawVertexNumberForBufferLessRendering = 0;
    /** The primitive mode used for buffer-less rendering */
    this._primitiveModeForBufferLessRendering = PrimitiveMode.Triangles;
    // VR
    /** Whether VR rendering is enabled for this render pass */
    this.isVrRendering = true;
    /** Whether this render pass outputs for VR display */
    this.isOutputForVr = false;
    // Internal use
    /** @internal Last index of opaque primitives in the render queue */
    this._lastOpaqueIndex = -1;
    /** @internal Last index of translucent primitives in the render queue */
    this._lastTranslucentIndex = -1;
    /** @internal Last index of blend with Z-write primitives in the render queue */
    this._lastBlendWithZWriteIndex = -1;
    /** @internal Last index of blend without Z-write primitives in the render queue */
    this._lastBlendWithoutZWriteIndex = -1;
    /** @internal Array of last primitive UIDs for optimization */
    this._lastPrimitiveUids = [];
    /**
     * @internal Primitives in the same order as `_lastPrimitiveUids`, so the render strategy can
     * avoid a per-primitive repository lookup. Valid only while `_lastPrimitiveUids` is the array
     * the strategy was called with.
     */
    this._lastPrimitives = null;
    /** @internal Last transform components update count for change detection */
    this._lastTransformComponentsUpdateCount = -1;
    /** @internal Last camera controller components update count for change detection */
    this._lastCameraControllerComponentsUpdateCount = -1;
    /** @internal Last scene graph components update count for change detection */
    this._lastSceneGraphComponentsUpdateCount = -1;
    /** @internal Last multi-draw group version for change detection */
    this._lastMultiDrawGroupVersion = -1;
    /** @internal Whether something was rendered in the previous frame */
    this._renderedSomethingBefore = true;
    /** @internal Whether the sort render result has changed */
    this._isChangedSortRenderResult = false;
    /** Whether to render opaque primitives contained in this render pass */
    this._toRenderOpaquePrimitives = true;
    /** Whether to render translucent primitives contained in this render pass */
    this._toRenderTranslucentPrimitives = true;
    /** Whether to render blend with Z-write primitives contained in this render pass */
    this._toRenderBlendWithZWritePrimitives = true;
    /** Whether to render blend without Z-write primitives contained in this render pass */
    this._toRenderBlendWithoutZWritePrimitives = true;
    /** Whether to render Effekseer effects in this render pass */
    this.toRenderEffekseerEffects = false;
    this.c = engine;
    this._dummyPrimitiveForBufferLessRendering = new Primitive(engine);
    this.Qx = ++_RenderPass.pl;
  }
  /**
   * Sets whether to render opaque primitives in this render pass.
   * @param toRender - True to render opaque primitives, false to skip them
   */
  setToRenderOpaquePrimitives(toRender) {
    this._toRenderOpaquePrimitives = toRender;
    this.Mx();
  }
  /**
   * Sets whether to render blend without Z-write primitives in this render pass.
   * @param toRender - True to render blend without Z-write primitives, false to skip them
   */
  setToRenderBlendWithoutZWritePrimitives(toRender) {
    this._toRenderBlendWithoutZWritePrimitives = toRender;
    this.Mx();
  }
  /**
   * Sets whether to render blend with Z-write primitives in this render pass.
   * @param toRender - True to render blend with Z-write primitives, false to skip them
   */
  setToRenderBlendWithZWritePrimitives(toRender) {
    this._toRenderBlendWithZWritePrimitives = toRender;
    this.Mx();
  }
  /**
   * Sets whether to render translucent primitives in this render pass.
   * @param toRender - True to render translucent primitives, false to skip them
   */
  setToRenderTranslucentPrimitives(toRender) {
    this._toRenderTranslucentPrimitives = toRender;
    this.Mx();
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
  setBufferLessRendering(primitiveMode, drawVertexNumberWithoutEntities, material) {
    this._primitiveModeForBufferLessRendering = primitiveMode;
    this._drawVertexNumberForBufferLessRendering = drawVertexNumberWithoutEntities;
    this.Ol = material;
    this._renderedSomethingBefore = true;
  }
  /**
   * Configures this render pass for full-screen buffer-less rendering.
   * This is a convenience method that sets up triangle-based full-screen rendering
   * with 3 vertices, commonly used for post-processing effects.
   *
   * @param material - The material to use for full-screen rendering
   */
  setBufferLessFullScreenRendering(material) {
    this._primitiveModeForBufferLessRendering = PrimitiveMode.Triangles;
    this._drawVertexNumberForBufferLessRendering = 3;
    this.Ol = material;
    this._renderedSomethingBefore = true;
  }
  /**
   * Creates a deep clone of this render pass.
   * All properties and collections are copied, creating an independent instance.
   *
   * @returns A new RenderPass instance that is a copy of this one
   */
  clone() {
    var _a, _b;
    const renderPass = new _RenderPass(this.c);
    renderPass.tryToSetUniqueName(`${this.uniqueName}_cloned`, true);
    renderPass.Zi = this.Zi.concat();
    renderPass.Nx = this.Nx.concat();
    renderPass.Ex = this.Ex.concat();
    renderPass.Fx = this.Fx.concat();
    renderPass.Gx = this.Gx.concat();
    renderPass.Cx = this.Cx;
    renderPass.Ix = this.Ix;
    renderPass.Dx = this.Dx;
    renderPass.Hx = (_a = this.Hx) == null ? void 0 : _a.clone();
    renderPass.toClearColorBuffer = this.toClearColorBuffer;
    renderPass.toClearDepthBuffer = this.toClearDepthBuffer;
    renderPass.toClearStencilBuffer = this.toClearStencilBuffer;
    renderPass.isDepthTest = this.isDepthTest;
    renderPass.clearColor = this.clearColor.clone();
    renderPass.clearDepth = this.clearDepth;
    renderPass.clearStencil = this.clearStencil;
    renderPass.cameraComponent = this.cameraComponent;
    renderPass.Ol = this.Ol;
    renderPass.Jx = new Map(this.Jx);
    renderPass.isVrRendering = this.isVrRendering;
    renderPass.isOutputForVr = this.isOutputForVr;
    renderPass._toRenderOpaquePrimitives = this._toRenderOpaquePrimitives;
    renderPass._toRenderTranslucentPrimitives = this._toRenderTranslucentPrimitives;
    renderPass._toRenderBlendWithoutZWritePrimitives = this._toRenderBlendWithoutZWritePrimitives;
    renderPass.Kx = this.Kx;
    renderPass.Lx = this.Lx;
    renderPass.Ox = (_b = this.Ox) == null ? void 0 : _b.concat();
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
  setPreRenderFunction(func) {
    this.Kx = func;
  }
  /**
   * Sets a function to be called after each render operation.
   * This can be used for custom cleanup logic after rendering completes.
   *
   * @param func - The function to call after rendering
   */
  setPostRenderFunction(func) {
    this.Lx = func;
  }
  /**
   * Executes the pre-render function if one has been set.
   * This method is called internally by the rendering system.
   *
   * @internal
   */
  doPreRender() {
    if (this.Kx != null) {
      this.Kx();
    }
  }
  /**
   * Executes the post-render function if one has been set.
   * This method is called internally by the rendering system.
   *
   * @internal
   */
  doPostRender() {
    if (this.Lx != null) {
      this.Lx();
    }
  }
  /**
   * Adds entities to be rendered in this render pass.
   * The entities and their hierarchies are flattened and collected for rendering.
   * Duplicate entities are automatically eliminated.
   *
   * @param entities - An array of scene graph entities to add
   */
  addEntities(entities) {
    for (const entity of entities) {
      if (entity === void 0) {
        continue;
      }
      const sceneGraphComponent = entity.getSceneGraph();
      this.Nx.push(sceneGraphComponent);
      const collectedSgComponents = flattenHierarchy(sceneGraphComponent, false);
      const collectedEntities = collectedSgComponents.map((sg) => sg.entity).filter((e) => e != null);
      const map = this.Zi.concat(collectedEntities).reduce((map2, entity2) => {
        map2.set(entity2.entityUID, entity2);
        return map2;
      }, /* @__PURE__ */ new Map());
      this.Zi = Array.from(map.values());
    }
    this.Mx();
    this.Ex = [];
    this.Tx();
  }
  /**
   * Recalculates and updates the mesh components collections.
   * This includes both the complete list and the optimized list based on rendering flags.
   *
   * @private
   */
  Mx() {
    this.Fx = [];
    this.Gx = [];
    this.Ux();
  }
  /**
   * Gets the list of all entities in this render pass.
   * @returns An array of scene graph entities
   */
  get entities() {
    return this.Zi;
  }
  /**
   * Removes all entities from this render pass and clears related collections.
   * This effectively empties the render pass of all renderable content.
   */
  clearEntities() {
    this.Fx = [];
    this.Gx = [];
    this.Ex = [];
    this.Zi = [];
  }
  /**
   * Collects and organizes the top-level scene graph components.
   * This method traverses the hierarchy to find root-level components.
   *
   * @private
   */
  Tx() {
    const goToTopLevel = (sg) => {
      if (sg.parent) {
        goToTopLevel(sg.parent);
      }
      return sg;
    };
    this.Ex = this.Nx.map((sg) => {
      return goToTopLevel(sg);
    });
    const set = new Set(this.Ex);
    this.Ex = Array.from(set);
  }
  /**
   * Collects mesh components from entities and creates optimized collections.
   * The optimized collection excludes components based on rendering flags.
   *
   * @private
   */
  Ux() {
    this.Fx = [];
    this.Gx = [];
    for (const entity of this.Zi) {
      const meshComponent = entity.getComponentByComponentTID(WellKnownComponentTIDs.MeshComponentTID);
      if (meshComponent != null && meshComponent.mesh != null) {
        this.Fx.push(meshComponent);
        if (!this._toRenderOpaquePrimitives && meshComponent.mesh.isExistOpaque()) {
          continue;
        }
        if (!this._toRenderTranslucentPrimitives && meshComponent.mesh.isExistTranslucent()) {
          continue;
        }
        if (!this._toRenderBlendWithZWritePrimitives && meshComponent.mesh.isExistBlendWithZWrite()) {
          continue;
        }
        if (!this._toRenderBlendWithoutZWritePrimitives && meshComponent.mesh.isExistBlendWithoutZWrite()) {
          continue;
        }
        this.Gx.push(meshComponent);
      }
    }
  }
  /**
   * Gets all mesh components from entities in this render pass.
   * This includes all mesh components regardless of rendering flags.
   *
   * @returns An array of all mesh components
   */
  get meshComponents() {
    return this.Fx;
  }
  /**
   * Gets the optimized mesh components collection for rendering.
   * This collection is filtered based on the rendering flags for different primitive types.
   *
   * @returns An array of mesh components that should be rendered
   * @internal
   */
  get _optimizedMeshComponents() {
    return this.Gx;
  }
  /**
   * Gets all top-level scene graph components in this render pass.
   * These are the root components of the scene graph hierarchies.
   *
   * @returns An array of top-level scene graph components
   */
  get sceneTopLevelGraphComponents() {
    return this.Ex;
  }
  /**
   * Sets the target framebuffer for this render pass.
   * If multiple render passes share a framebuffer, they will render to the same target.
   * Setting a framebuffer automatically configures the viewport to match the framebuffer size.
   *
   * @param framebuffer - The framebuffer to render to, or undefined to render to the default framebuffer
   */
  setFramebuffer(framebuffer) {
    this.Cx = framebuffer;
    if (framebuffer != null) {
      this.setViewport(Vector4.fromCopyArray([0, 0, framebuffer.width, framebuffer.height]));
    } else {
      this.Hx = void 0;
    }
  }
  /**
   * Sets the color attachment targets for rendering.
   * This specifies which color attachments of the framebuffer should be rendered to.
   *
   * @param indeces - Array of render buffer target enums, or undefined to use default targets
   */
  setRenderTargetColorAttachments(indeces) {
    this.Ox = indeces;
  }
  /**
   * Gets the current render target color attachments.
   * @returns Array of render buffer target enums, or undefined if using defaults
   */
  getRenderTargetColorAttachments() {
    return this.Ox;
  }
  /**
   * Gets the current framebuffer assigned to this render pass.
   * @returns The framebuffer, or undefined if rendering to the default framebuffer
   */
  getFramebuffer() {
    return this.Cx;
  }
  /**
   * Removes the current framebuffer assignment.
   * After calling this, the render pass will render to the default framebuffer.
   */
  removeFramebuffer() {
    this.Cx = void 0;
  }
  /**
   * Sets the viewport for this render pass.
   * The viewport defines the rectangular area of the framebuffer that will be rendered to.
   *
   * @param vec - A Vector4 containing (x, y, width, height) of the viewport
   */
  setViewport(vec) {
    if (this.Hx != null) {
      this.Hx.copyComponents(vec);
    } else {
      this.Hx = MutableVector4.fromCopyArray([vec.x, vec.y, vec.z, vec.w]);
    }
  }
  /**
   * Gets the current viewport settings.
   * @returns A Vector4 containing (x, y, width, height) of the viewport, or undefined if not set
   */
  getViewport() {
    let viewport = this.Hx;
    if (viewport != null) {
      viewport = _RenderPass.Sx.copyComponents(viewport);
    }
    return viewport;
  }
  /**
   * Sets a scissor rectangle that limits rendering to the given pixels.
   *
   * The rectangle is in render-target pixels with a top-left origin. It is a
   * culling hint (for example, the screen projection of an SDF's world AABB), so
   * backends that cannot apply it simply render the whole target.
   *
   * @param rect - The scissor rectangle, or undefined to render the whole target
   */
  setScissorRect(rect) {
    if (rect == null) {
      this.Px = void 0;
      return;
    }
    this.Px = {
      x: Math.floor(rect.x),
      y: Math.floor(rect.y),
      width: Math.max(0, Math.floor(rect.width)),
      height: Math.max(0, Math.floor(rect.height))
    };
  }
  /**
   * Gets the scissor rectangle of this pass.
   * @returns The scissor rectangle, or undefined when the whole target is rendered
   */
  getScissorRect() {
    return this.Px;
  }
  /**
   * Sets the resolve framebuffer for multisampling.
   * The resolve framebuffer is used as the destination when resolving multisampled content.
   *
   * @param framebuffer - The resolve framebuffer, or undefined to disable resolving
   */
  setResolveFramebuffer(framebuffer) {
    this.Ix = framebuffer;
  }
  /**
   * Gets the current resolve framebuffer.
   * @returns The resolve framebuffer, or undefined if not set
   */
  getResolveFramebuffer() {
    return this.Ix;
  }
  /**
   * Sets the secondary resolve framebuffer.
   * This can be used for additional resolve operations or multi-target resolving.
   *
   * @param framebuffer - The secondary resolve framebuffer, or undefined to disable
   */
  setResolveFramebuffer2(framebuffer) {
    this.Dx = framebuffer;
  }
  /**
   * Gets the current secondary resolve framebuffer.
   * @returns The secondary resolve framebuffer, or undefined if not set
   */
  getResolveFramebuffer2() {
    return this.Dx;
  }
  /**
   * Copies the main framebuffer content to both resolve framebuffers using WebGL.
   * This method handles the blit operations for multisampling resolve.
   *
   * @internal
   */
  _copyFramebufferToResolveFramebuffersWebGL() {
    this.Rx(this.Ix);
    this.Rx(this.Dx);
  }
  /**
   * Internal helper method for copying framebuffer content to a resolve framebuffer.
   *
   * @param resolveFrameBuffer - The target resolve framebuffer
   * @private
   */
  Rx(resolveFrameBuffer) {
    if (resolveFrameBuffer == null) {
      return;
    }
    const repo = this.c.webglResourceRepository;
    const webGLResourceFrameBuffer = repo.getWebGLResource(this.Cx.cgApiResourceUid);
    const webGLResourceResolveFramebuffer = repo.getWebGLResource(
      resolveFrameBuffer.cgApiResourceUid
    );
    if (webGLResourceFrameBuffer == null || webGLResourceResolveFramebuffer == null) {
      return;
    }
    const glw = repo.currentWebGLContextWrapper;
    const gl = glw.getRawContextAsWebGL2();
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, webGLResourceFrameBuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, webGLResourceResolveFramebuffer);
    gl.blitFramebuffer(
      0,
      0,
      this.Cx.width,
      this.Cx.height,
      0,
      0,
      resolveFrameBuffer.width,
      resolveFrameBuffer.height,
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
    var _a, _b;
    const source = (_a = this.Ix) != null ? _a : this.Cx;
    if (source == null || this.Dx == null) {
      return;
    }
    const webGpuResourceRepository = this.c.webGpuResourceRepository;
    for (let i = 0; i < source.colorAttachments.length; i++) {
      if (source.colorAttachments[i] == null || this.Dx.colorAttachments[i] == null || !(source.colorAttachments[i]._textureResourceUid >= 0) || // A multisampled attachment cannot be copied (it needs a resolve target).
      ((_b = source.colorAttachments[i].sampleCount) != null ? _b : 1) > 1 || this.Dx.colorAttachments[i]._textureResourceUid === -1) {
        continue;
      }
      webGpuResourceRepository.copyTextureData(
        source.colorAttachments[i]._textureResourceUid,
        this.Dx.colorAttachments[i]._textureResourceUid
      );
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
  setMaterialForPrimitive(material, primitive) {
    this.Jx.set(primitive.objectUID, new WeakRef(material));
  }
  /**
   * Sets a default material for all primitives in this render pass.
   * This material will be used for any primitive that doesn't have a specific
   * material override set via setMaterialForPrimitive().
   *
   * @param material - The default material to use for all primitives
   */
  setMaterial(material) {
    this.Ol = material;
  }
  /**
   * Gets the default material assigned to this render pass.
   * @returns The default material, or undefined if none is set
   */
  get material() {
    return this.Ol;
  }
  /**
   * Gets the specific material assigned to a primitive, if any.
   *
   * @param primitive - The primitive to get the material for
   * @returns The material assigned to the primitive, or undefined if none is set
   * @internal
   */
  _getMaterialOf(primitive) {
    var _a;
    return (_a = this.Jx.get(primitive.objectUID)) == null ? void 0 : _a.deref();
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
  getAppropriateMaterial(primitive) {
    let material = this.Jx.size !== 0 ? this._getMaterialOf(primitive) : void 0;
    if (material != null) {
    } else if (this.Ol != null) {
      material = this.Ol;
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
    return this.Qx;
  }
};
/** @internal Temporary Vector4 for internal calculations */
_RenderPass.Sx = MutableVector4.zero();
/** @internal Static counter for generating unique mesh UIDs */
_RenderPass.pl = -1;
var RenderPass = _RenderPass;
export {
  RenderPass
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcmVuZGVyZXIvUmVuZGVyUGFzcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBFbnRpdHlVSUQsIFJlbmRlclBhc3NVSUQgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2gvTWVzaENvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL1NjZW5lR3JhcGgvU2NlbmVHcmFwaENvbXBvbmVudCc7XG5pbXBvcnQgeyBmbGF0dGVuSGllcmFyY2h5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9TY2VuZUdyYXBoL1NjZW5lR3JhcGhPcHMnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBSbk9iamVjdCB9IGZyb20gJy4uL2NvcmUvUm5PYmplY3QnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSwgdHlwZSBQcmltaXRpdmVNb2RlRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJCdWZmZXJUYXJnZXRFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvUmVuZGVyQnVmZmVyVGFyZ2V0JztcbmltcG9ydCB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgdHlwZSB7IElNZXNoRW50aXR5LCBJU2NlbmVHcmFwaEVudGl0eSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB0eXBlIHsgTWF0ZXJpYWwgfSBmcm9tICcuLi9tYXRlcmlhbHMvY29yZS9NYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9JVmVjdG9yJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlVmVjdG9yNCc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IEZyYW1lQnVmZmVyIH0gZnJvbSAnLi9GcmFtZUJ1ZmZlcic7XG5cbnR5cGUgUHJpbWl0aXZlUm5PYmplY3RVSUQgPSBudW1iZXI7XG5cbi8qKlxuICogQSBzY2lzc29yIHJlY3RhbmdsZSBpbiByZW5kZXItdGFyZ2V0IHBpeGVscy5cbiAqXG4gKiBUaGUgb3JpZ2luIGlzIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgdGhlIHJlbmRlciB0YXJnZXQgKHRoZSBzYW1lIGNvbnZlbnRpb24gYXNcbiAqIFdlYkdQVSdzIGBzZXRTY2lzc29yUmVjdGApOyB0aGUgV2ViR0wgcGF0aCBjb252ZXJ0cyBpdCB0byB0aGUgYm90dG9tLWxlZnQgb3JpZ2luLlxuICovXG5leHBvcnQgdHlwZSBSZW5kZXJQYXNzU2Npc3NvclJlY3QgPSB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbn07XG5cbi8qKlxuICogQSByZW5kZXIgcGFzcyByZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiByZW5kZXJpbmcgcmVzb3VyY2VzIGFuZCBzZXR0aW5ncyB1c2VkIGluIHRoZSByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKiBJdCBtYW5hZ2VzIGVudGl0aWVzLCBtYXRlcmlhbHMsIGZyYW1lYnVmZmVycywgYW5kIHZhcmlvdXMgcmVuZGVyaW5nIHN0YXRlcyB0byBjb250cm9sIGhvdyBvYmplY3RzIGFyZSByZW5kZXJlZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgcmVuZGVyUGFzcyA9IG5ldyBSZW5kZXJQYXNzKCk7XG4gKiByZW5kZXJQYXNzLmFkZEVudGl0aWVzKFtlbnRpdHkxLCBlbnRpdHkyXSk7XG4gKiByZW5kZXJQYXNzLnNldEZyYW1lYnVmZmVyKGZyYW1lYnVmZmVyKTtcbiAqIHJlbmRlclBhc3MudG9DbGVhckNvbG9yQnVmZmVyID0gdHJ1ZTtcbiAqIHJlbmRlclBhc3MuY2xlYXJDb2xvciA9IFZlY3RvcjQuZnJvbUNvcHlBcnJheShbMC4yLCAwLjMsIDAuNCwgMS4wXSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFJlbmRlclBhc3MgZXh0ZW5kcyBSbk9iamVjdCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX19lbmdpbmU6IEVuZ2luZTtcbiAgcHJpdmF0ZSByZWFkb25seSBfX3JlbmRlclBhc3NVSUQ6IFJlbmRlclBhc3NVSUQ7XG4gIHByaXZhdGUgX19lbnRpdGllczogKElNZXNoRW50aXR5IHwgSVNjZW5lR3JhcGhFbnRpdHkpW10gPSBbXTtcbiAgcHJpdmF0ZSBfX3NjZW5lR3JhcGhEaXJlY3RseUFkZGVkOiBTY2VuZUdyYXBoQ29tcG9uZW50W10gPSBbXTtcbiAgcHJpdmF0ZSBfX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHM6IFNjZW5lR3JhcGhDb21wb25lbnRbXSA9IFtdO1xuICBwcml2YXRlIF9fbWVzaENvbXBvbmVudHM6IE1lc2hDb21wb25lbnRbXSA9IFtdO1xuICBwcml2YXRlIF9fb3B0aW1pemVkTWVzaENvbXBvbmVudHM6IE1lc2hDb21wb25lbnRbXSA9IFtdO1xuICBwcml2YXRlIF9fZnJhbWVCdWZmZXI/OiBGcmFtZUJ1ZmZlcjtcbiAgcHJpdmF0ZSBfX3Jlc29sdmVGcmFtZUJ1ZmZlcj86IEZyYW1lQnVmZmVyO1xuICBwcml2YXRlIF9fcmVzb2x2ZUZyYW1lQnVmZmVyMj86IEZyYW1lQnVmZmVyO1xuICBwcml2YXRlIF9fdmlld3BvcnQ/OiBNdXRhYmxlVmVjdG9yNDtcbiAgcHJpdmF0ZSBfX3NjaXNzb3JSZWN0PzogUmVuZGVyUGFzc1NjaXNzb3JSZWN0O1xuICBwcml2YXRlIF9fbWF0ZXJpYWw/OiBNYXRlcmlhbDtcbiAgcHJpdmF0ZSBfX3ByaW1pdGl2ZU1hdGVyaWFsOiBNYXA8UHJpbWl0aXZlUm5PYmplY3RVSUQsIFdlYWtSZWY8TWF0ZXJpYWw+PiA9IG5ldyBNYXAoKTtcblxuICAvLyBQdWJsaWMgUmVuZGVyUGFzcyBTZXR0aW5nc1xuICAvKiogV2hldGhlciB0byBjbGVhciB0aGUgY29sb3IgYnVmZmVyIGJlZm9yZSByZW5kZXJpbmcgKi9cbiAgcHVibGljIHRvQ2xlYXJDb2xvckJ1ZmZlciA9IGZhbHNlO1xuICAvKiogV2hldGhlciB0byBjbGVhciB0aGUgZGVwdGggYnVmZmVyIGJlZm9yZSByZW5kZXJpbmcgKi9cbiAgcHVibGljIHRvQ2xlYXJEZXB0aEJ1ZmZlciA9IHRydWU7XG4gIC8qKiBXaGV0aGVyIHRvIGNsZWFyIHRoZSBzdGVuY2lsIGJ1ZmZlciBiZWZvcmUgcmVuZGVyaW5nICovXG4gIHB1YmxpYyB0b0NsZWFyU3RlbmNpbEJ1ZmZlciA9IGZhbHNlO1xuICAvKiogV2hldGhlciB0byBlbmFibGUgZGVwdGggdGVzdGluZyBkdXJpbmcgcmVuZGVyaW5nICovXG4gIHB1YmxpYyBpc0RlcHRoVGVzdCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIERlcHRoIHdyaXRlIG1hc2sgZm9yIHByaW1pdGl2ZXMgZHJhd2luZy5cbiAgICogV2hlbiBmYWxzZSwgZGVwdGggdmFsdWVzIGFyZSBub3Qgd3JpdHRlbiB0byB0aGUgZGVwdGggYnVmZmVyLCBidXQgZGVwdGggY2xlYXIgaXMgc3RpbGwgcGVyZm9ybWVkLlxuICAgKi9cbiAgcHVibGljIGRlcHRoV3JpdGVNYXNrID0gdHJ1ZTtcblxuICAvKiogVGhlIGNvbG9yIHZhbHVlIHVzZWQgdG8gY2xlYXIgdGhlIGNvbG9yIGJ1ZmZlciAoUkdCQSBmb3JtYXQpICovXG4gIHB1YmxpYyBjbGVhckNvbG9yID0gVmVjdG9yNC5mcm9tQ29weUFycmF5KFsxLCAxLCAxLCAxXSk7XG4gIC8qKiBUaGUgZGVwdGggdmFsdWUgdXNlZCB0byBjbGVhciB0aGUgZGVwdGggYnVmZmVyICh0eXBpY2FsbHkgMS4wIGZvciBmYXIgcGxhbmUpICovXG4gIHB1YmxpYyBjbGVhckRlcHRoID0gMTtcbiAgLyoqIFRoZSBzdGVuY2lsIHZhbHVlIHVzZWQgdG8gY2xlYXIgdGhlIHN0ZW5jaWwgYnVmZmVyICovXG4gIHB1YmxpYyBjbGVhclN0ZW5jaWwgPSAwO1xuICAvKiogVGhlIGNhbWVyYSBjb21wb25lbnQgdXNlZCBmb3IgcmVuZGVyaW5nIHRoaXMgcGFzcyAqL1xuICBwdWJsaWMgY2FtZXJhQ29tcG9uZW50PzogQ2FtZXJhQ29tcG9uZW50O1xuXG4gIC8qKlxuICAgKiBJZiB0aGlzIHZhbHVlIGlzIGdyZWF0ZXIgdGhhbiAxLCBidWZmZXItbGVzcyByZW5kZXJpbmcgaXMgcGVyZm9ybWVkIHdpdGggdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgdmVydGljZXMuXG4gICAqIEluIHRoaXMgY2FzZSwgcmVnaXN0ZXJlZCBlbnRpdGllcyBhcmUgaWdub3JlZCBhbmQgbm90IHJlbmRlcmVkLlxuICAgKi9cbiAgcHVibGljIF9kcmF3VmVydGV4TnVtYmVyRm9yQnVmZmVyTGVzc1JlbmRlcmluZyA9IDA7XG4gIC8qKiBUaGUgcHJpbWl0aXZlIG1vZGUgdXNlZCBmb3IgYnVmZmVyLWxlc3MgcmVuZGVyaW5nICovXG4gIHB1YmxpYyBfcHJpbWl0aXZlTW9kZUZvckJ1ZmZlckxlc3NSZW5kZXJpbmcgPSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlcztcbiAgLyoqIEEgZHVtbXkgcHJpbWl0aXZlIHVzZWQgZm9yIGJ1ZmZlci1sZXNzIHJlbmRlcmluZyAqL1xuICBwdWJsaWMgX2R1bW15UHJpbWl0aXZlRm9yQnVmZmVyTGVzc1JlbmRlcmluZzogUHJpbWl0aXZlO1xuXG4gIC8vIFZSXG4gIC8qKiBXaGV0aGVyIFZSIHJlbmRlcmluZyBpcyBlbmFibGVkIGZvciB0aGlzIHJlbmRlciBwYXNzICovXG4gIHB1YmxpYyBpc1ZyUmVuZGVyaW5nID0gdHJ1ZTtcbiAgLyoqIFdoZXRoZXIgdGhpcyByZW5kZXIgcGFzcyBvdXRwdXRzIGZvciBWUiBkaXNwbGF5ICovXG4gIHB1YmxpYyBpc091dHB1dEZvclZyID0gZmFsc2U7XG5cbiAgLy8gSW50ZXJuYWwgdXNlXG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBpbmRleCBvZiBvcGFxdWUgcHJpbWl0aXZlcyBpbiB0aGUgcmVuZGVyIHF1ZXVlICovXG4gIHB1YmxpYyBfbGFzdE9wYXF1ZUluZGV4ID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBpbmRleCBvZiB0cmFuc2x1Y2VudCBwcmltaXRpdmVzIGluIHRoZSByZW5kZXIgcXVldWUgKi9cbiAgcHVibGljIF9sYXN0VHJhbnNsdWNlbnRJbmRleCA9IC0xO1xuICAvKiogQGludGVybmFsIExhc3QgaW5kZXggb2YgYmxlbmQgd2l0aCBaLXdyaXRlIHByaW1pdGl2ZXMgaW4gdGhlIHJlbmRlciBxdWV1ZSAqL1xuICBwdWJsaWMgX2xhc3RCbGVuZFdpdGhaV3JpdGVJbmRleCA9IC0xO1xuICAvKiogQGludGVybmFsIExhc3QgaW5kZXggb2YgYmxlbmQgd2l0aG91dCBaLXdyaXRlIHByaW1pdGl2ZXMgaW4gdGhlIHJlbmRlciBxdWV1ZSAqL1xuICBwdWJsaWMgX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleCA9IC0xO1xuICAvKiogQGludGVybmFsIEFycmF5IG9mIGxhc3QgcHJpbWl0aXZlIFVJRHMgZm9yIG9wdGltaXphdGlvbiAqL1xuICBwdWJsaWMgX2xhc3RQcmltaXRpdmVVaWRzOiBudW1iZXJbXSA9IFtdO1xuICAvKipcbiAgICogQGludGVybmFsIFByaW1pdGl2ZXMgaW4gdGhlIHNhbWUgb3JkZXIgYXMgYF9sYXN0UHJpbWl0aXZlVWlkc2AsIHNvIHRoZSByZW5kZXIgc3RyYXRlZ3kgY2FuXG4gICAqIGF2b2lkIGEgcGVyLXByaW1pdGl2ZSByZXBvc2l0b3J5IGxvb2t1cC4gVmFsaWQgb25seSB3aGlsZSBgX2xhc3RQcmltaXRpdmVVaWRzYCBpcyB0aGUgYXJyYXlcbiAgICogdGhlIHN0cmF0ZWd5IHdhcyBjYWxsZWQgd2l0aC5cbiAgICovXG4gIHB1YmxpYyBfbGFzdFByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdIHwgbnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCB0cmFuc2Zvcm0gY29tcG9uZW50cyB1cGRhdGUgY291bnQgZm9yIGNoYW5nZSBkZXRlY3Rpb24gKi9cbiAgcHVibGljIF9sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBjYW1lcmEgY29udHJvbGxlciBjb21wb25lbnRzIHVwZGF0ZSBjb3VudCBmb3IgY2hhbmdlIGRldGVjdGlvbiAqL1xuICBwdWJsaWMgX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBzY2VuZSBncmFwaCBjb21wb25lbnRzIHVwZGF0ZSBjb3VudCBmb3IgY2hhbmdlIGRldGVjdGlvbiAqL1xuICBwdWJsaWMgX2xhc3RTY2VuZUdyYXBoQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBtdWx0aS1kcmF3IGdyb3VwIHZlcnNpb24gZm9yIGNoYW5nZSBkZXRlY3Rpb24gKi9cbiAgcHVibGljIF9sYXN0TXVsdGlEcmF3R3JvdXBWZXJzaW9uID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgV2hldGhlciBzb21ldGhpbmcgd2FzIHJlbmRlcmVkIGluIHRoZSBwcmV2aW91cyBmcmFtZSAqL1xuICBwdWJsaWMgX3JlbmRlcmVkU29tZXRoaW5nQmVmb3JlID0gdHJ1ZTtcbiAgLyoqIEBpbnRlcm5hbCBXaGV0aGVyIHRoZSBzb3J0IHJlbmRlciByZXN1bHQgaGFzIGNoYW5nZWQgKi9cbiAgcHVibGljIF9pc0NoYW5nZWRTb3J0UmVuZGVyUmVzdWx0ID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdG8gcmVuZGVyIG9wYXF1ZSBwcmltaXRpdmVzIGNvbnRhaW5lZCBpbiB0aGlzIHJlbmRlciBwYXNzICovXG4gIHB1YmxpYyBfdG9SZW5kZXJPcGFxdWVQcmltaXRpdmVzID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0byByZW5kZXIgdHJhbnNsdWNlbnQgcHJpbWl0aXZlcyBjb250YWluZWQgaW4gdGhpcyByZW5kZXIgcGFzcyAqL1xuICBwdWJsaWMgX3RvUmVuZGVyVHJhbnNsdWNlbnRQcmltaXRpdmVzID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0byByZW5kZXIgYmxlbmQgd2l0aCBaLXdyaXRlIHByaW1pdGl2ZXMgY29udGFpbmVkIGluIHRoaXMgcmVuZGVyIHBhc3MgKi9cbiAgcHVibGljIF90b1JlbmRlckJsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMgPSB0cnVlO1xuXG4gIC8qKiBXaGV0aGVyIHRvIHJlbmRlciBibGVuZCB3aXRob3V0IFotd3JpdGUgcHJpbWl0aXZlcyBjb250YWluZWQgaW4gdGhpcyByZW5kZXIgcGFzcyAqL1xuICBwdWJsaWMgX3RvUmVuZGVyQmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcyA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdG8gcmVuZGVyIEVmZmVrc2VlciBlZmZlY3RzIGluIHRoaXMgcmVuZGVyIHBhc3MgKi9cbiAgcHVibGljIHRvUmVuZGVyRWZmZWtzZWVyRWZmZWN0cyA9IGZhbHNlO1xuICAvKiogQGludGVybmFsIENvbG9yIGF0dGFjaG1lbnQgdGFyZ2V0cyBmb3IgcmVuZGVyaW5nICovXG4gIHB1YmxpYyBfX3JlbmRlclRhcmdldENvbG9yQXR0YWNobWVudHM/OiBSZW5kZXJCdWZmZXJUYXJnZXRFbnVtW107XG4gIC8qKiBAaW50ZXJuYWwgRnVuY3Rpb24gY2FsbGVkIGJlZm9yZSBlYWNoIHJlbmRlciBvcGVyYXRpb24gKi9cbiAgcHJpdmF0ZSBfX3ByZUVhY2hSZW5kZXJGdW5jPzogKCkgPT4gdm9pZDtcbiAgLyoqIEBpbnRlcm5hbCBGdW5jdGlvbiBjYWxsZWQgYWZ0ZXIgZWFjaCByZW5kZXIgb3BlcmF0aW9uICovXG4gIHByaXZhdGUgX19wb3N0RWFjaFJlbmRlckZ1bmM/OiAoKSA9PiB2b2lkO1xuICAvKiogQGludGVybmFsIFRlbXBvcmFyeSBWZWN0b3I0IGZvciBpbnRlcm5hbCBjYWxjdWxhdGlvbnMgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfVmVjdG9yNF8wID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuXG4gIC8qKiBAaW50ZXJuYWwgU3RhdGljIGNvdW50ZXIgZm9yIGdlbmVyYXRpbmcgdW5pcXVlIG1lc2ggVUlEcyAqL1xuICBwdWJsaWMgc3RhdGljIF9fbWVzaF91aWRfY291bnQgPSAtMTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBSZW5kZXJQYXNzIGluc3RhbmNlLlxuICAgKiBBdXRvbWF0aWNhbGx5IGFzc2lnbnMgYSB1bmlxdWUgcmVuZGVyIHBhc3MgVUlELlxuICAgKi9cbiAgY29uc3RydWN0b3IoZW5naW5lOiBFbmdpbmUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XG4gICAgdGhpcy5fZHVtbXlQcmltaXRpdmVGb3JCdWZmZXJMZXNzUmVuZGVyaW5nID0gbmV3IFByaW1pdGl2ZShlbmdpbmUpO1xuICAgIHRoaXMuX19yZW5kZXJQYXNzVUlEID0gKytSZW5kZXJQYXNzLl9fbWVzaF91aWRfY291bnQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRvIHJlbmRlciBvcGFxdWUgcHJpbWl0aXZlcyBpbiB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBAcGFyYW0gdG9SZW5kZXIgLSBUcnVlIHRvIHJlbmRlciBvcGFxdWUgcHJpbWl0aXZlcywgZmFsc2UgdG8gc2tpcCB0aGVtXG4gICAqL1xuICBzZXRUb1JlbmRlck9wYXF1ZVByaW1pdGl2ZXModG9SZW5kZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl90b1JlbmRlck9wYXF1ZVByaW1pdGl2ZXMgPSB0b1JlbmRlcjtcbiAgICB0aGlzLl9fY2FsY01lc2hDb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRvIHJlbmRlciBibGVuZCB3aXRob3V0IFotd3JpdGUgcHJpbWl0aXZlcyBpbiB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBAcGFyYW0gdG9SZW5kZXIgLSBUcnVlIHRvIHJlbmRlciBibGVuZCB3aXRob3V0IFotd3JpdGUgcHJpbWl0aXZlcywgZmFsc2UgdG8gc2tpcCB0aGVtXG4gICAqL1xuICBzZXRUb1JlbmRlckJsZW5kV2l0aG91dFpXcml0ZVByaW1pdGl2ZXModG9SZW5kZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl90b1JlbmRlckJsZW5kV2l0aG91dFpXcml0ZVByaW1pdGl2ZXMgPSB0b1JlbmRlcjtcbiAgICB0aGlzLl9fY2FsY01lc2hDb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRvIHJlbmRlciBibGVuZCB3aXRoIFotd3JpdGUgcHJpbWl0aXZlcyBpbiB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBAcGFyYW0gdG9SZW5kZXIgLSBUcnVlIHRvIHJlbmRlciBibGVuZCB3aXRoIFotd3JpdGUgcHJpbWl0aXZlcywgZmFsc2UgdG8gc2tpcCB0aGVtXG4gICAqL1xuICBzZXRUb1JlbmRlckJsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXModG9SZW5kZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl90b1JlbmRlckJsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMgPSB0b1JlbmRlcjtcbiAgICB0aGlzLl9fY2FsY01lc2hDb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRvIHJlbmRlciB0cmFuc2x1Y2VudCBwcmltaXRpdmVzIGluIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAqIEBwYXJhbSB0b1JlbmRlciAtIFRydWUgdG8gcmVuZGVyIHRyYW5zbHVjZW50IHByaW1pdGl2ZXMsIGZhbHNlIHRvIHNraXAgdGhlbVxuICAgKi9cbiAgc2V0VG9SZW5kZXJUcmFuc2x1Y2VudFByaW1pdGl2ZXModG9SZW5kZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl90b1JlbmRlclRyYW5zbHVjZW50UHJpbWl0aXZlcyA9IHRvUmVuZGVyO1xuICAgIHRoaXMuX19jYWxjTWVzaENvbXBvbmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyByZW5kZXIgcGFzcyBpcyBpbiBidWZmZXItbGVzcyByZW5kZXJpbmcgbW9kZS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBidWZmZXItbGVzcyByZW5kZXJpbmcgaXMgZW5hYmxlZCAodmVydGV4IGNvdW50ID4gMClcbiAgICovXG4gIGlzQnVmZmVyTGVzc1JlbmRlcmluZ01vZGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYXdWZXJ0ZXhOdW1iZXJGb3JCdWZmZXJMZXNzUmVuZGVyaW5nID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoaXMgcmVuZGVyIHBhc3MgZm9yIGJ1ZmZlci1sZXNzIHJlbmRlcmluZyBtb2RlLlxuICAgKiBJbiBidWZmZXItbGVzcyByZW5kZXJpbmcsIHZlcnRpY2VzIGFyZSBnZW5lcmF0ZWQgcHJvY2VkdXJhbGx5IHdpdGhvdXQgdmVydGV4IGJ1ZmZlcnMuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBmdWxsLXNjcmVlbiBlZmZlY3RzIG9yIHByb2NlZHVyYWwgZ2VvbWV0cnkuXG4gICAqIFdoZW4gZW5hYmxlZCwgcmVnaXN0ZXJlZCBlbnRpdGllcyBhcmUgaWdub3JlZCBhbmQgbm90IHJlbmRlcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlTW9kZSAtIFRoZSBwcmltaXRpdmUgbW9kZSB0byB1c2UgZm9yIHJlbmRlcmluZ1xuICAgKiBAcGFyYW0gZHJhd1ZlcnRleE51bWJlcldpdGhvdXRFbnRpdGllcyAtIE51bWJlciBvZiB2ZXJ0aWNlcyB0byBnZW5lcmF0ZSBhbmQgcmVuZGVyXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byB1c2UgZm9yIHJlbmRlcmluZ1xuICAgKi9cbiAgc2V0QnVmZmVyTGVzc1JlbmRlcmluZyhcbiAgICBwcmltaXRpdmVNb2RlOiBQcmltaXRpdmVNb2RlRW51bSxcbiAgICBkcmF3VmVydGV4TnVtYmVyV2l0aG91dEVudGl0aWVzOiBudW1iZXIsXG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsXG4gICkge1xuICAgIHRoaXMuX3ByaW1pdGl2ZU1vZGVGb3JCdWZmZXJMZXNzUmVuZGVyaW5nID0gcHJpbWl0aXZlTW9kZTtcbiAgICB0aGlzLl9kcmF3VmVydGV4TnVtYmVyRm9yQnVmZmVyTGVzc1JlbmRlcmluZyA9IGRyYXdWZXJ0ZXhOdW1iZXJXaXRob3V0RW50aXRpZXM7XG4gICAgdGhpcy5fX21hdGVyaWFsID0gbWF0ZXJpYWw7XG5cbiAgICAvLyBFbnN1cmUgdGhpcyByZW5kZXIgcGFzcyBpcyBwcm9jZXNzZWQgb24gdGhlIG5leHQgZnJhbWVcbiAgICAvLyBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHRoZSByZW5kZXIgcGFzcyBtYXkgaGF2ZSBiZWVuIHNraXBwZWQgcHJldmlvdXNseVxuICAgIC8vIHdoZW4gaXQgaGFkIG5vIG1hdGVyaWFsIG9yIHByaW1pdGl2ZXMgdG8gcmVuZGVyXG4gICAgdGhpcy5fcmVuZGVyZWRTb21ldGhpbmdCZWZvcmUgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhpcyByZW5kZXIgcGFzcyBmb3IgZnVsbC1zY3JlZW4gYnVmZmVyLWxlc3MgcmVuZGVyaW5nLlxuICAgKiBUaGlzIGlzIGEgY29udmVuaWVuY2UgbWV0aG9kIHRoYXQgc2V0cyB1cCB0cmlhbmdsZS1iYXNlZCBmdWxsLXNjcmVlbiByZW5kZXJpbmdcbiAgICogd2l0aCAzIHZlcnRpY2VzLCBjb21tb25seSB1c2VkIGZvciBwb3N0LXByb2Nlc3NpbmcgZWZmZWN0cy5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIHVzZSBmb3IgZnVsbC1zY3JlZW4gcmVuZGVyaW5nXG4gICAqL1xuICBzZXRCdWZmZXJMZXNzRnVsbFNjcmVlblJlbmRlcmluZyhtYXRlcmlhbDogTWF0ZXJpYWwpIHtcbiAgICB0aGlzLl9wcmltaXRpdmVNb2RlRm9yQnVmZmVyTGVzc1JlbmRlcmluZyA9IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzO1xuICAgIHRoaXMuX2RyYXdWZXJ0ZXhOdW1iZXJGb3JCdWZmZXJMZXNzUmVuZGVyaW5nID0gMztcbiAgICB0aGlzLl9fbWF0ZXJpYWwgPSBtYXRlcmlhbDtcblxuICAgIC8vIEVuc3VyZSB0aGlzIHJlbmRlciBwYXNzIGlzIHByb2Nlc3NlZCBvbiB0aGUgbmV4dCBmcmFtZVxuICAgIC8vIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlIHJlbmRlciBwYXNzIG1heSBoYXZlIGJlZW4gc2tpcHBlZCBwcmV2aW91c2x5XG4gICAgLy8gd2hlbiBpdCBoYWQgbm8gbWF0ZXJpYWwgb3IgcHJpbWl0aXZlcyB0byByZW5kZXJcbiAgICB0aGlzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY2xvbmUgb2YgdGhpcyByZW5kZXIgcGFzcy5cbiAgICogQWxsIHByb3BlcnRpZXMgYW5kIGNvbGxlY3Rpb25zIGFyZSBjb3BpZWQsIGNyZWF0aW5nIGFuIGluZGVwZW5kZW50IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBSZW5kZXJQYXNzIGluc3RhbmNlIHRoYXQgaXMgYSBjb3B5IG9mIHRoaXMgb25lXG4gICAqL1xuICBjbG9uZSgpIHtcbiAgICBjb25zdCByZW5kZXJQYXNzID0gbmV3IFJlbmRlclBhc3ModGhpcy5fX2VuZ2luZSk7XG4gICAgcmVuZGVyUGFzcy50cnlUb1NldFVuaXF1ZU5hbWUoYCR7dGhpcy51bmlxdWVOYW1lfV9jbG9uZWRgLCB0cnVlKTtcbiAgICByZW5kZXJQYXNzLl9fZW50aXRpZXMgPSB0aGlzLl9fZW50aXRpZXMuY29uY2F0KCk7XG4gICAgcmVuZGVyUGFzcy5fX3NjZW5lR3JhcGhEaXJlY3RseUFkZGVkID0gdGhpcy5fX3NjZW5lR3JhcGhEaXJlY3RseUFkZGVkLmNvbmNhdCgpO1xuICAgIHJlbmRlclBhc3MuX190b3BMZXZlbFNjZW5lR3JhcGhDb21wb25lbnRzID0gdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMuY29uY2F0KCk7XG4gICAgcmVuZGVyUGFzcy5fX21lc2hDb21wb25lbnRzID0gdGhpcy5fX21lc2hDb21wb25lbnRzLmNvbmNhdCgpO1xuICAgIHJlbmRlclBhc3MuX19vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cyA9IHRoaXMuX19vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cy5jb25jYXQoKTtcbiAgICByZW5kZXJQYXNzLl9fZnJhbWVCdWZmZXIgPSB0aGlzLl9fZnJhbWVCdWZmZXI7XG4gICAgcmVuZGVyUGFzcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlciA9IHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXI7XG4gICAgcmVuZGVyUGFzcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIgPSB0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyMjtcbiAgICByZW5kZXJQYXNzLl9fdmlld3BvcnQgPSB0aGlzLl9fdmlld3BvcnQ/LmNsb25lKCk7XG4gICAgcmVuZGVyUGFzcy50b0NsZWFyQ29sb3JCdWZmZXIgPSB0aGlzLnRvQ2xlYXJDb2xvckJ1ZmZlcjtcbiAgICByZW5kZXJQYXNzLnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IHRoaXMudG9DbGVhckRlcHRoQnVmZmVyO1xuICAgIHJlbmRlclBhc3MudG9DbGVhclN0ZW5jaWxCdWZmZXIgPSB0aGlzLnRvQ2xlYXJTdGVuY2lsQnVmZmVyO1xuICAgIHJlbmRlclBhc3MuaXNEZXB0aFRlc3QgPSB0aGlzLmlzRGVwdGhUZXN0O1xuICAgIHJlbmRlclBhc3MuY2xlYXJDb2xvciA9IHRoaXMuY2xlYXJDb2xvci5jbG9uZSgpO1xuICAgIHJlbmRlclBhc3MuY2xlYXJEZXB0aCA9IHRoaXMuY2xlYXJEZXB0aDtcbiAgICByZW5kZXJQYXNzLmNsZWFyU3RlbmNpbCA9IHRoaXMuY2xlYXJTdGVuY2lsO1xuICAgIHJlbmRlclBhc3MuY2FtZXJhQ29tcG9uZW50ID0gdGhpcy5jYW1lcmFDb21wb25lbnQ7XG4gICAgcmVuZGVyUGFzcy5fX21hdGVyaWFsID0gdGhpcy5fX21hdGVyaWFsO1xuICAgIHJlbmRlclBhc3MuX19wcmltaXRpdmVNYXRlcmlhbCA9IG5ldyBNYXAodGhpcy5fX3ByaW1pdGl2ZU1hdGVyaWFsKTtcbiAgICByZW5kZXJQYXNzLmlzVnJSZW5kZXJpbmcgPSB0aGlzLmlzVnJSZW5kZXJpbmc7XG4gICAgcmVuZGVyUGFzcy5pc091dHB1dEZvclZyID0gdGhpcy5pc091dHB1dEZvclZyO1xuICAgIHJlbmRlclBhc3MuX3RvUmVuZGVyT3BhcXVlUHJpbWl0aXZlcyA9IHRoaXMuX3RvUmVuZGVyT3BhcXVlUHJpbWl0aXZlcztcbiAgICByZW5kZXJQYXNzLl90b1JlbmRlclRyYW5zbHVjZW50UHJpbWl0aXZlcyA9IHRoaXMuX3RvUmVuZGVyVHJhbnNsdWNlbnRQcmltaXRpdmVzO1xuICAgIHJlbmRlclBhc3MuX3RvUmVuZGVyQmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcyA9IHRoaXMuX3RvUmVuZGVyQmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcztcbiAgICByZW5kZXJQYXNzLl9fcHJlRWFjaFJlbmRlckZ1bmMgPSB0aGlzLl9fcHJlRWFjaFJlbmRlckZ1bmM7XG4gICAgcmVuZGVyUGFzcy5fX3Bvc3RFYWNoUmVuZGVyRnVuYyA9IHRoaXMuX19wb3N0RWFjaFJlbmRlckZ1bmM7XG4gICAgcmVuZGVyUGFzcy5fX3JlbmRlclRhcmdldENvbG9yQXR0YWNobWVudHMgPSB0aGlzLl9fcmVuZGVyVGFyZ2V0Q29sb3JBdHRhY2htZW50cz8uY29uY2F0KCk7XG4gICAgcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4ID0gdGhpcy5fbGFzdE9wYXF1ZUluZGV4O1xuICAgIHJlbmRlclBhc3MuX2xhc3RUcmFuc2x1Y2VudEluZGV4ID0gdGhpcy5fbGFzdFRyYW5zbHVjZW50SW5kZXg7XG4gICAgcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4ID0gdGhpcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4O1xuICAgIHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleCA9IHRoaXMuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleDtcbiAgICByZW5kZXJQYXNzLl9sYXN0UHJpbWl0aXZlVWlkcyA9IHRoaXMuX2xhc3RQcmltaXRpdmVVaWRzLmNvbmNhdCgpO1xuICAgIHJlbmRlclBhc3MuX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSB0aGlzLl9sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50O1xuICAgIHJlbmRlclBhc3MuX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gdGhpcy5fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQ7XG4gICAgcmVuZGVyUGFzcy5fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQgPSB0aGlzLl9sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudDtcbiAgICByZW5kZXJQYXNzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZSA9IHRoaXMuX3JlbmRlcmVkU29tZXRoaW5nQmVmb3JlO1xuICAgIHJlbmRlclBhc3MuX2lzQ2hhbmdlZFNvcnRSZW5kZXJSZXN1bHQgPSB0aGlzLl9pc0NoYW5nZWRTb3J0UmVuZGVyUmVzdWx0O1xuXG4gICAgcmV0dXJuIHJlbmRlclBhc3M7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBiZWZvcmUgZWFjaCByZW5kZXIgb3BlcmF0aW9uLlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIGZvciBjdXN0b20gc2V0dXAgbG9naWMgYmVmb3JlIHJlbmRlcmluZyBiZWdpbnMuXG4gICAqXG4gICAqIEBwYXJhbSBmdW5jIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgYmVmb3JlIHJlbmRlcmluZ1xuICAgKi9cbiAgc2V0UHJlUmVuZGVyRnVuY3Rpb24oZnVuYzogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuX19wcmVFYWNoUmVuZGVyRnVuYyA9IGZ1bmM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhZnRlciBlYWNoIHJlbmRlciBvcGVyYXRpb24uXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgZm9yIGN1c3RvbSBjbGVhbnVwIGxvZ2ljIGFmdGVyIHJlbmRlcmluZyBjb21wbGV0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBmdW5jIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgYWZ0ZXIgcmVuZGVyaW5nXG4gICAqL1xuICBzZXRQb3N0UmVuZGVyRnVuY3Rpb24oZnVuYzogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuX19wb3N0RWFjaFJlbmRlckZ1bmMgPSBmdW5jO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBwcmUtcmVuZGVyIGZ1bmN0aW9uIGlmIG9uZSBoYXMgYmVlbiBzZXQuXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBpbnRlcm5hbGx5IGJ5IHRoZSByZW5kZXJpbmcgc3lzdGVtLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGRvUHJlUmVuZGVyKCkge1xuICAgIGlmICh0aGlzLl9fcHJlRWFjaFJlbmRlckZ1bmMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3ByZUVhY2hSZW5kZXJGdW5jKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBwb3N0LXJlbmRlciBmdW5jdGlvbiBpZiBvbmUgaGFzIGJlZW4gc2V0LlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgaW50ZXJuYWxseSBieSB0aGUgcmVuZGVyaW5nIHN5c3RlbS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBkb1Bvc3RSZW5kZXIoKSB7XG4gICAgaWYgKHRoaXMuX19wb3N0RWFjaFJlbmRlckZ1bmMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3Bvc3RFYWNoUmVuZGVyRnVuYygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGVudGl0aWVzIHRvIGJlIHJlbmRlcmVkIGluIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAqIFRoZSBlbnRpdGllcyBhbmQgdGhlaXIgaGllcmFyY2hpZXMgYXJlIGZsYXR0ZW5lZCBhbmQgY29sbGVjdGVkIGZvciByZW5kZXJpbmcuXG4gICAqIER1cGxpY2F0ZSBlbnRpdGllcyBhcmUgYXV0b21hdGljYWxseSBlbGltaW5hdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZW50aXRpZXMgLSBBbiBhcnJheSBvZiBzY2VuZSBncmFwaCBlbnRpdGllcyB0byBhZGRcbiAgICovXG4gIGFkZEVudGl0aWVzKGVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdKSB7XG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgZW50aXRpZXMpIHtcbiAgICAgIC8vIERlZmVuc2l2ZTogZW50aXR5IGNhbiBiZSBtaXNzaW5nIGlmIGl0IGhhcyBiZWVuIGRlbGV0ZWQgYnV0IHN0aWxsIHJlZmVyZW5jZWQgc29tZXdoZXJlLlxuICAgICAgaWYgKGVudGl0eSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2NlbmVHcmFwaENvbXBvbmVudCA9IGVudGl0eS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICB0aGlzLl9fc2NlbmVHcmFwaERpcmVjdGx5QWRkZWQucHVzaChzY2VuZUdyYXBoQ29tcG9uZW50KTtcbiAgICAgIGNvbnN0IGNvbGxlY3RlZFNnQ29tcG9uZW50cyA9IGZsYXR0ZW5IaWVyYXJjaHkoc2NlbmVHcmFwaENvbXBvbmVudCwgZmFsc2UpO1xuICAgICAgLy8gTk9URTpcbiAgICAgIC8vIGBTY2VuZUdyYXBoQ29tcG9uZW50LmVudGl0eWAgaXMgdHlwZWQgYXMgYWx3YXlzIGV4aXN0aW5nLCBidXQgaXQgY2FuIGJlY29tZSBgdW5kZWZpbmVkYFxuICAgICAgLy8gYXQgcnVudGltZSB3aGVuIHRoZSBjb3JyZXNwb25kaW5nIGVudGl0eSBoYXMgYmVlbiBkZWxldGVkIGZyb20gYEVudGl0eVJlcG9zaXRvcnlgLlxuICAgICAgLy8gV2UgZmlsdGVyIG91dCBzdWNoIHN0YWxlIHJlZmVyZW5jZXMgdG8gYXZvaWQgY3Jhc2hpbmcgZHVyaW5nIHJlbmRlciBwYXNzIHNldHVwLlxuICAgICAgY29uc3QgY29sbGVjdGVkRW50aXRpZXMgPSBjb2xsZWN0ZWRTZ0NvbXBvbmVudHNcbiAgICAgICAgLm1hcCgoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpID0+IHNnLmVudGl0eSBhcyB1bmtub3duIGFzIElNZXNoRW50aXR5IHwgSVNjZW5lR3JhcGhFbnRpdHkgfCB1bmRlZmluZWQpXG4gICAgICAgIC5maWx0ZXIoKGUpOiBlIGlzIElNZXNoRW50aXR5IHwgSVNjZW5lR3JhcGhFbnRpdHkgPT4gZSAhPSBudWxsKTtcblxuICAgICAgLy8gRWxpbWluYXRlIGR1cGxpY2F0ZXNcbiAgICAgIGNvbnN0IG1hcDogTWFwPEVudGl0eVVJRCwgSU1lc2hFbnRpdHkgfCBJU2NlbmVHcmFwaEVudGl0eT4gPSB0aGlzLl9fZW50aXRpZXNcbiAgICAgICAgLmNvbmNhdChjb2xsZWN0ZWRFbnRpdGllcylcbiAgICAgICAgLnJlZHVjZSgobWFwOiBNYXA8RW50aXR5VUlELCBJTWVzaEVudGl0eSB8IElTY2VuZUdyYXBoRW50aXR5PiwgZW50aXR5OiBJTWVzaEVudGl0eSB8IElTY2VuZUdyYXBoRW50aXR5KSA9PiB7XG4gICAgICAgICAgbWFwLnNldChlbnRpdHkuZW50aXR5VUlELCBlbnRpdHkpO1xuICAgICAgICAgIHJldHVybiBtYXA7XG4gICAgICAgIH0sIG5ldyBNYXAoKSk7XG5cbiAgICAgIHRoaXMuX19lbnRpdGllcyA9IEFycmF5LmZyb20obWFwLnZhbHVlcygpKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fY2FsY01lc2hDb21wb25lbnRzKCk7XG4gICAgdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMgPSBbXTtcbiAgICB0aGlzLl9fY29sbGVjdFRvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNhbGN1bGF0ZXMgYW5kIHVwZGF0ZXMgdGhlIG1lc2ggY29tcG9uZW50cyBjb2xsZWN0aW9ucy5cbiAgICogVGhpcyBpbmNsdWRlcyBib3RoIHRoZSBjb21wbGV0ZSBsaXN0IGFuZCB0aGUgb3B0aW1pemVkIGxpc3QgYmFzZWQgb24gcmVuZGVyaW5nIGZsYWdzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNNZXNoQ29tcG9uZW50cygpIHtcbiAgICB0aGlzLl9fbWVzaENvbXBvbmVudHMgPSBbXTtcbiAgICB0aGlzLl9fb3B0aW1pemVkTWVzaENvbXBvbmVudHMgPSBbXTtcbiAgICB0aGlzLl9fY29sbGVjdE1lc2hDb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbGlzdCBvZiBhbGwgZW50aXRpZXMgaW4gdGhpcyByZW5kZXIgcGFzcy5cbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2Ygc2NlbmUgZ3JhcGggZW50aXRpZXNcbiAgICovXG4gIGdldCBlbnRpdGllcygpOiBJU2NlbmVHcmFwaEVudGl0eVtdIHtcbiAgICByZXR1cm4gdGhpcy5fX2VudGl0aWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGVudGl0aWVzIGZyb20gdGhpcyByZW5kZXIgcGFzcyBhbmQgY2xlYXJzIHJlbGF0ZWQgY29sbGVjdGlvbnMuXG4gICAqIFRoaXMgZWZmZWN0aXZlbHkgZW1wdGllcyB0aGUgcmVuZGVyIHBhc3Mgb2YgYWxsIHJlbmRlcmFibGUgY29udGVudC5cbiAgICovXG4gIGNsZWFyRW50aXRpZXMoKSB7XG4gICAgdGhpcy5fX21lc2hDb21wb25lbnRzID0gW107XG4gICAgdGhpcy5fX29wdGltaXplZE1lc2hDb21wb25lbnRzID0gW107XG4gICAgdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMgPSBbXTtcbiAgICB0aGlzLl9fZW50aXRpZXMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb2xsZWN0cyBhbmQgb3JnYW5pemVzIHRoZSB0b3AtbGV2ZWwgc2NlbmUgZ3JhcGggY29tcG9uZW50cy5cbiAgICogVGhpcyBtZXRob2QgdHJhdmVyc2VzIHRoZSBoaWVyYXJjaHkgdG8gZmluZCByb290LWxldmVsIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fY29sbGVjdFRvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMoKSB7XG4gICAgY29uc3QgZ29Ub1RvcExldmVsID0gKHNnOiBTY2VuZUdyYXBoQ29tcG9uZW50KSA9PiB7XG4gICAgICBpZiAoc2cucGFyZW50KSB7XG4gICAgICAgIGdvVG9Ub3BMZXZlbChzZy5wYXJlbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNnO1xuICAgIH07XG4gICAgdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMgPSB0aGlzLl9fc2NlbmVHcmFwaERpcmVjdGx5QWRkZWQubWFwKChzZzogU2NlbmVHcmFwaENvbXBvbmVudCkgPT4ge1xuICAgICAgcmV0dXJuIGdvVG9Ub3BMZXZlbChzZyk7XG4gICAgfSk7XG4gICAgY29uc3Qgc2V0ID0gbmV3IFNldCh0aGlzLl9fdG9wTGV2ZWxTY2VuZUdyYXBoQ29tcG9uZW50cyk7XG4gICAgdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMgPSBBcnJheS5mcm9tKHNldCk7XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdHMgbWVzaCBjb21wb25lbnRzIGZyb20gZW50aXRpZXMgYW5kIGNyZWF0ZXMgb3B0aW1pemVkIGNvbGxlY3Rpb25zLlxuICAgKiBUaGUgb3B0aW1pemVkIGNvbGxlY3Rpb24gZXhjbHVkZXMgY29tcG9uZW50cyBiYXNlZCBvbiByZW5kZXJpbmcgZmxhZ3MuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fY29sbGVjdE1lc2hDb21wb25lbnRzKCkge1xuICAgIHRoaXMuX19tZXNoQ29tcG9uZW50cyA9IFtdO1xuICAgIHRoaXMuX19vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cyA9IFtdO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHRoaXMuX19lbnRpdGllcykge1xuICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IGVudGl0eS5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChXZWxsS25vd25Db21wb25lbnRUSURzLk1lc2hDb21wb25lbnRUSUQpIGFzXG4gICAgICAgIHwgTWVzaENvbXBvbmVudFxuICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChtZXNoQ29tcG9uZW50ICE9IG51bGwgJiYgbWVzaENvbXBvbmVudC5tZXNoICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fX21lc2hDb21wb25lbnRzIS5wdXNoKG1lc2hDb21wb25lbnQpO1xuICAgICAgICBpZiAoIXRoaXMuX3RvUmVuZGVyT3BhcXVlUHJpbWl0aXZlcyAmJiBtZXNoQ29tcG9uZW50Lm1lc2guaXNFeGlzdE9wYXF1ZSgpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuX3RvUmVuZGVyVHJhbnNsdWNlbnRQcmltaXRpdmVzICYmIG1lc2hDb21wb25lbnQubWVzaC5pc0V4aXN0VHJhbnNsdWNlbnQoKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fdG9SZW5kZXJCbGVuZFdpdGhaV3JpdGVQcmltaXRpdmVzICYmIG1lc2hDb21wb25lbnQubWVzaC5pc0V4aXN0QmxlbmRXaXRoWldyaXRlKCkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX3RvUmVuZGVyQmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcyAmJiBtZXNoQ29tcG9uZW50Lm1lc2guaXNFeGlzdEJsZW5kV2l0aG91dFpXcml0ZSgpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX29wdGltaXplZE1lc2hDb21wb25lbnRzIS5wdXNoKG1lc2hDb21wb25lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCBtZXNoIGNvbXBvbmVudHMgZnJvbSBlbnRpdGllcyBpbiB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBUaGlzIGluY2x1ZGVzIGFsbCBtZXNoIGNvbXBvbmVudHMgcmVnYXJkbGVzcyBvZiByZW5kZXJpbmcgZmxhZ3MuXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGFsbCBtZXNoIGNvbXBvbmVudHNcbiAgICovXG4gIGdldCBtZXNoQ29tcG9uZW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5fX21lc2hDb21wb25lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9wdGltaXplZCBtZXNoIGNvbXBvbmVudHMgY29sbGVjdGlvbiBmb3IgcmVuZGVyaW5nLlxuICAgKiBUaGlzIGNvbGxlY3Rpb24gaXMgZmlsdGVyZWQgYmFzZWQgb24gdGhlIHJlbmRlcmluZyBmbGFncyBmb3IgZGlmZmVyZW50IHByaW1pdGl2ZSB0eXBlcy5cbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgbWVzaCBjb21wb25lbnRzIHRoYXQgc2hvdWxkIGJlIHJlbmRlcmVkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5fX29wdGltaXplZE1lc2hDb21wb25lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRvcC1sZXZlbCBzY2VuZSBncmFwaCBjb21wb25lbnRzIGluIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAqIFRoZXNlIGFyZSB0aGUgcm9vdCBjb21wb25lbnRzIG9mIHRoZSBzY2VuZSBncmFwaCBoaWVyYXJjaGllcy5cbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgdG9wLWxldmVsIHNjZW5lIGdyYXBoIGNvbXBvbmVudHNcbiAgICovXG4gIGdldCBzY2VuZVRvcExldmVsR3JhcGhDb21wb25lbnRzKCk6IFNjZW5lR3JhcGhDb21wb25lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX190b3BMZXZlbFNjZW5lR3JhcGhDb21wb25lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRhcmdldCBmcmFtZWJ1ZmZlciBmb3IgdGhpcyByZW5kZXIgcGFzcy5cbiAgICogSWYgbXVsdGlwbGUgcmVuZGVyIHBhc3NlcyBzaGFyZSBhIGZyYW1lYnVmZmVyLCB0aGV5IHdpbGwgcmVuZGVyIHRvIHRoZSBzYW1lIHRhcmdldC5cbiAgICogU2V0dGluZyBhIGZyYW1lYnVmZmVyIGF1dG9tYXRpY2FsbHkgY29uZmlndXJlcyB0aGUgdmlld3BvcnQgdG8gbWF0Y2ggdGhlIGZyYW1lYnVmZmVyIHNpemUuXG4gICAqXG4gICAqIEBwYXJhbSBmcmFtZWJ1ZmZlciAtIFRoZSBmcmFtZWJ1ZmZlciB0byByZW5kZXIgdG8sIG9yIHVuZGVmaW5lZCB0byByZW5kZXIgdG8gdGhlIGRlZmF1bHQgZnJhbWVidWZmZXJcbiAgICovXG4gIHNldEZyYW1lYnVmZmVyKGZyYW1lYnVmZmVyPzogRnJhbWVCdWZmZXIpIHtcbiAgICB0aGlzLl9fZnJhbWVCdWZmZXIgPSBmcmFtZWJ1ZmZlcjtcbiAgICBpZiAoZnJhbWVidWZmZXIgIT0gbnVsbCkge1xuICAgICAgdGhpcy5zZXRWaWV3cG9ydChWZWN0b3I0LmZyb21Db3B5QXJyYXkoWzAsIDAsIGZyYW1lYnVmZmVyLndpZHRoLCBmcmFtZWJ1ZmZlci5oZWlnaHRdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX192aWV3cG9ydCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29sb3IgYXR0YWNobWVudCB0YXJnZXRzIGZvciByZW5kZXJpbmcuXG4gICAqIFRoaXMgc3BlY2lmaWVzIHdoaWNoIGNvbG9yIGF0dGFjaG1lbnRzIG9mIHRoZSBmcmFtZWJ1ZmZlciBzaG91bGQgYmUgcmVuZGVyZWQgdG8uXG4gICAqXG4gICAqIEBwYXJhbSBpbmRlY2VzIC0gQXJyYXkgb2YgcmVuZGVyIGJ1ZmZlciB0YXJnZXQgZW51bXMsIG9yIHVuZGVmaW5lZCB0byB1c2UgZGVmYXVsdCB0YXJnZXRzXG4gICAqL1xuICBzZXRSZW5kZXJUYXJnZXRDb2xvckF0dGFjaG1lbnRzKGluZGVjZXM/OiBSZW5kZXJCdWZmZXJUYXJnZXRFbnVtW10pIHtcbiAgICB0aGlzLl9fcmVuZGVyVGFyZ2V0Q29sb3JBdHRhY2htZW50cyA9IGluZGVjZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCByZW5kZXIgdGFyZ2V0IGNvbG9yIGF0dGFjaG1lbnRzLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiByZW5kZXIgYnVmZmVyIHRhcmdldCBlbnVtcywgb3IgdW5kZWZpbmVkIGlmIHVzaW5nIGRlZmF1bHRzXG4gICAqL1xuICBnZXRSZW5kZXJUYXJnZXRDb2xvckF0dGFjaG1lbnRzKCk6IFJlbmRlckJ1ZmZlclRhcmdldEVudW1bXSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19yZW5kZXJUYXJnZXRDb2xvckF0dGFjaG1lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgZnJhbWVidWZmZXIgYXNzaWduZWQgdG8gdGhpcyByZW5kZXIgcGFzcy5cbiAgICogQHJldHVybnMgVGhlIGZyYW1lYnVmZmVyLCBvciB1bmRlZmluZWQgaWYgcmVuZGVyaW5nIHRvIHRoZSBkZWZhdWx0IGZyYW1lYnVmZmVyXG4gICAqL1xuICBnZXRGcmFtZWJ1ZmZlcigpOiBGcmFtZUJ1ZmZlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19mcmFtZUJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBjdXJyZW50IGZyYW1lYnVmZmVyIGFzc2lnbm1lbnQuXG4gICAqIEFmdGVyIGNhbGxpbmcgdGhpcywgdGhlIHJlbmRlciBwYXNzIHdpbGwgcmVuZGVyIHRvIHRoZSBkZWZhdWx0IGZyYW1lYnVmZmVyLlxuICAgKi9cbiAgcmVtb3ZlRnJhbWVidWZmZXIoKSB7XG4gICAgdGhpcy5fX2ZyYW1lQnVmZmVyID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpZXdwb3J0IGZvciB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBUaGUgdmlld3BvcnQgZGVmaW5lcyB0aGUgcmVjdGFuZ3VsYXIgYXJlYSBvZiB0aGUgZnJhbWVidWZmZXIgdGhhdCB3aWxsIGJlIHJlbmRlcmVkIHRvLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gQSBWZWN0b3I0IGNvbnRhaW5pbmcgKHgsIHksIHdpZHRoLCBoZWlnaHQpIG9mIHRoZSB2aWV3cG9ydFxuICAgKi9cbiAgc2V0Vmlld3BvcnQodmVjOiBJVmVjdG9yNCkge1xuICAgIGlmICh0aGlzLl9fdmlld3BvcnQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0LmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX192aWV3cG9ydCA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5QXJyYXkoW3ZlYy54LCB2ZWMueSwgdmVjLnosIHZlYy53XSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgdmlld3BvcnQgc2V0dGluZ3MuXG4gICAqIEByZXR1cm5zIEEgVmVjdG9yNCBjb250YWluaW5nICh4LCB5LCB3aWR0aCwgaGVpZ2h0KSBvZiB0aGUgdmlld3BvcnQsIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXRWaWV3cG9ydCgpIHtcbiAgICBsZXQgdmlld3BvcnQgPSB0aGlzLl9fdmlld3BvcnQ7XG4gICAgaWYgKHZpZXdwb3J0ICE9IG51bGwpIHtcbiAgICAgIHZpZXdwb3J0ID0gUmVuZGVyUGFzcy5fX3RtcF9WZWN0b3I0XzAuY29weUNvbXBvbmVudHModmlld3BvcnQpO1xuICAgIH1cblxuICAgIHJldHVybiB2aWV3cG9ydDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgc2Npc3NvciByZWN0YW5nbGUgdGhhdCBsaW1pdHMgcmVuZGVyaW5nIHRvIHRoZSBnaXZlbiBwaXhlbHMuXG4gICAqXG4gICAqIFRoZSByZWN0YW5nbGUgaXMgaW4gcmVuZGVyLXRhcmdldCBwaXhlbHMgd2l0aCBhIHRvcC1sZWZ0IG9yaWdpbi4gSXQgaXMgYVxuICAgKiBjdWxsaW5nIGhpbnQgKGZvciBleGFtcGxlLCB0aGUgc2NyZWVuIHByb2plY3Rpb24gb2YgYW4gU0RGJ3Mgd29ybGQgQUFCQiksIHNvXG4gICAqIGJhY2tlbmRzIHRoYXQgY2Fubm90IGFwcGx5IGl0IHNpbXBseSByZW5kZXIgdGhlIHdob2xlIHRhcmdldC5cbiAgICpcbiAgICogQHBhcmFtIHJlY3QgLSBUaGUgc2Npc3NvciByZWN0YW5nbGUsIG9yIHVuZGVmaW5lZCB0byByZW5kZXIgdGhlIHdob2xlIHRhcmdldFxuICAgKi9cbiAgc2V0U2Npc3NvclJlY3QocmVjdD86IFJlbmRlclBhc3NTY2lzc29yUmVjdCkge1xuICAgIGlmIChyZWN0ID09IG51bGwpIHtcbiAgICAgIHRoaXMuX19zY2lzc29yUmVjdCA9IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3NjaXNzb3JSZWN0ID0ge1xuICAgICAgeDogTWF0aC5mbG9vcihyZWN0LngpLFxuICAgICAgeTogTWF0aC5mbG9vcihyZWN0LnkpLFxuICAgICAgd2lkdGg6IE1hdGgubWF4KDAsIE1hdGguZmxvb3IocmVjdC53aWR0aCkpLFxuICAgICAgaGVpZ2h0OiBNYXRoLm1heCgwLCBNYXRoLmZsb29yKHJlY3QuaGVpZ2h0KSksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzY2lzc29yIHJlY3RhbmdsZSBvZiB0aGlzIHBhc3MuXG4gICAqIEByZXR1cm5zIFRoZSBzY2lzc29yIHJlY3RhbmdsZSwgb3IgdW5kZWZpbmVkIHdoZW4gdGhlIHdob2xlIHRhcmdldCBpcyByZW5kZXJlZFxuICAgKi9cbiAgZ2V0U2Npc3NvclJlY3QoKTogUmVuZGVyUGFzc1NjaXNzb3JSZWN0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3NjaXNzb3JSZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJlc29sdmUgZnJhbWVidWZmZXIgZm9yIG11bHRpc2FtcGxpbmcuXG4gICAqIFRoZSByZXNvbHZlIGZyYW1lYnVmZmVyIGlzIHVzZWQgYXMgdGhlIGRlc3RpbmF0aW9uIHdoZW4gcmVzb2x2aW5nIG11bHRpc2FtcGxlZCBjb250ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgLSBUaGUgcmVzb2x2ZSBmcmFtZWJ1ZmZlciwgb3IgdW5kZWZpbmVkIHRvIGRpc2FibGUgcmVzb2x2aW5nXG4gICAqL1xuICBzZXRSZXNvbHZlRnJhbWVidWZmZXIoZnJhbWVidWZmZXI/OiBGcmFtZUJ1ZmZlcikge1xuICAgIHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIgPSBmcmFtZWJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHJlc29sdmUgZnJhbWVidWZmZXIuXG4gICAqIEByZXR1cm5zIFRoZSByZXNvbHZlIGZyYW1lYnVmZmVyLCBvciB1bmRlZmluZWQgaWYgbm90IHNldFxuICAgKi9cbiAgZ2V0UmVzb2x2ZUZyYW1lYnVmZmVyKCk6IEZyYW1lQnVmZmVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzZWNvbmRhcnkgcmVzb2x2ZSBmcmFtZWJ1ZmZlci5cbiAgICogVGhpcyBjYW4gYmUgdXNlZCBmb3IgYWRkaXRpb25hbCByZXNvbHZlIG9wZXJhdGlvbnMgb3IgbXVsdGktdGFyZ2V0IHJlc29sdmluZy5cbiAgICpcbiAgICogQHBhcmFtIGZyYW1lYnVmZmVyIC0gVGhlIHNlY29uZGFyeSByZXNvbHZlIGZyYW1lYnVmZmVyLCBvciB1bmRlZmluZWQgdG8gZGlzYWJsZVxuICAgKi9cbiAgc2V0UmVzb2x2ZUZyYW1lYnVmZmVyMihmcmFtZWJ1ZmZlcj86IEZyYW1lQnVmZmVyKSB7XG4gICAgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIgPSBmcmFtZWJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHNlY29uZGFyeSByZXNvbHZlIGZyYW1lYnVmZmVyLlxuICAgKiBAcmV0dXJucyBUaGUgc2Vjb25kYXJ5IHJlc29sdmUgZnJhbWVidWZmZXIsIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXRSZXNvbHZlRnJhbWVidWZmZXIyKCk6IEZyYW1lQnVmZmVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjI7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBtYWluIGZyYW1lYnVmZmVyIGNvbnRlbnQgdG8gYm90aCByZXNvbHZlIGZyYW1lYnVmZmVycyB1c2luZyBXZWJHTC5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyB0aGUgYmxpdCBvcGVyYXRpb25zIGZvciBtdWx0aXNhbXBsaW5nIHJlc29sdmUuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NvcHlGcmFtZWJ1ZmZlclRvUmVzb2x2ZUZyYW1lYnVmZmVyc1dlYkdMKCkge1xuICAgIHRoaXMuX19jb3B5RnJhbWVidWZmZXJUb1Jlc29sdmVGcmFtZWJ1ZmZlcklubmVyKHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIpO1xuICAgIHRoaXMuX19jb3B5RnJhbWVidWZmZXJUb1Jlc29sdmVGcmFtZWJ1ZmZlcklubmVyKHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBoZWxwZXIgbWV0aG9kIGZvciBjb3B5aW5nIGZyYW1lYnVmZmVyIGNvbnRlbnQgdG8gYSByZXNvbHZlIGZyYW1lYnVmZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gcmVzb2x2ZUZyYW1lQnVmZmVyIC0gVGhlIHRhcmdldCByZXNvbHZlIGZyYW1lYnVmZmVyXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fY29weUZyYW1lYnVmZmVyVG9SZXNvbHZlRnJhbWVidWZmZXJJbm5lcihyZXNvbHZlRnJhbWVCdWZmZXI/OiBGcmFtZUJ1ZmZlcikge1xuICAgIGlmIChyZXNvbHZlRnJhbWVCdWZmZXIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCByZXBvID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCB3ZWJHTFJlc291cmNlRnJhbWVCdWZmZXIgPSByZXBvLmdldFdlYkdMUmVzb3VyY2UodGhpcy5fX2ZyYW1lQnVmZmVyIS5jZ0FwaVJlc291cmNlVWlkKSBhcyBXZWJHTEZyYW1lYnVmZmVyO1xuICAgIGNvbnN0IHdlYkdMUmVzb3VyY2VSZXNvbHZlRnJhbWVidWZmZXIgPSByZXBvLmdldFdlYkdMUmVzb3VyY2UoXG4gICAgICByZXNvbHZlRnJhbWVCdWZmZXIhLmNnQXBpUmVzb3VyY2VVaWRcbiAgICApIGFzIFdlYkdMRnJhbWVidWZmZXI7XG5cbiAgICBpZiAod2ViR0xSZXNvdXJjZUZyYW1lQnVmZmVyID09IG51bGwgfHwgd2ViR0xSZXNvdXJjZVJlc29sdmVGcmFtZWJ1ZmZlciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2x3ID0gcmVwby5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlciE7XG4gICAgY29uc3QgZ2wgPSBnbHcuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLlJFQURfRlJBTUVCVUZGRVIsIHdlYkdMUmVzb3VyY2VGcmFtZUJ1ZmZlcik7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkRSQVdfRlJBTUVCVUZGRVIsIHdlYkdMUmVzb3VyY2VSZXNvbHZlRnJhbWVidWZmZXIpO1xuICAgIGdsLmJsaXRGcmFtZWJ1ZmZlcihcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgdGhpcy5fX2ZyYW1lQnVmZmVyIS53aWR0aCxcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlciEuaGVpZ2h0LFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICByZXNvbHZlRnJhbWVCdWZmZXIhLndpZHRoLFxuICAgICAgcmVzb2x2ZUZyYW1lQnVmZmVyIS5oZWlnaHQsXG4gICAgICBnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCxcbiAgICAgIGdsLk5FQVJFU1RcbiAgICApO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5SRUFEX0ZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRFJBV19GUkFNRUJVRkZFUiwgbnVsbCk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRleHR1cmUgZGF0YSBmcm9tIHRoZSBmaXJzdCByZXNvbHZlIGZyYW1lYnVmZmVyIHRvIHRoZSBzZWNvbmQgdXNpbmcgV2ViR1BVLlxuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHRleHR1cmUgY29weWluZyBvcGVyYXRpb25zIGZvciBXZWJHUFUtYmFzZWQgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb3B5UmVzb2x2ZTFUb1Jlc29sdmUyV2ViR3B1KCkge1xuICAgIC8vIFdpdGhvdXQgYSAoTVNBQSkgcmVzb2x2ZSB0YXJnZXQsIHRoZSByZW5kZXIgdGFyZ2V0IGl0c2VsZiBpcyBjb3BpZWQsIGFzIGluIFdlYkdMXG4gICAgLy8gKF9jb3B5RnJhbWVidWZmZXJUb1Jlc29sdmVGcmFtZWJ1ZmZlcnNXZWJHTCBibGl0cyB0aGUgcmVuZGVyIHRhcmdldCBpbnRvIHRoZSBzZWNvbmQgcmVzb2x2ZSB0YXJnZXQpLlxuICAgIGNvbnN0IHNvdXJjZSA9IHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIgPz8gdGhpcy5fX2ZyYW1lQnVmZmVyO1xuICAgIGlmIChzb3VyY2UgPT0gbnVsbCB8fCB0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyMiA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlLmNvbG9yQXR0YWNobWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgc291cmNlLmNvbG9yQXR0YWNobWVudHNbaV0gPT0gbnVsbCB8fFxuICAgICAgICB0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyMi5jb2xvckF0dGFjaG1lbnRzW2ldID09IG51bGwgfHxcbiAgICAgICAgIShzb3VyY2UuY29sb3JBdHRhY2htZW50c1tpXS5fdGV4dHVyZVJlc291cmNlVWlkID49IDApIHx8XG4gICAgICAgIC8vIEEgbXVsdGlzYW1wbGVkIGF0dGFjaG1lbnQgY2Fubm90IGJlIGNvcGllZCAoaXQgbmVlZHMgYSByZXNvbHZlIHRhcmdldCkuXG4gICAgICAgICgoc291cmNlLmNvbG9yQXR0YWNobWVudHNbaV0gYXMgeyBzYW1wbGVDb3VudD86IG51bWJlciB9KS5zYW1wbGVDb3VudCA/PyAxKSA+IDEgfHxcbiAgICAgICAgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIuY29sb3JBdHRhY2htZW50c1tpXS5fdGV4dHVyZVJlc291cmNlVWlkID09PSAtMVxuICAgICAgKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiAoXG4gICAgICAvLyAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5pc01pcHBtYXBwZWRUZXh0dXJlKFxuICAgICAgLy8gICAgIHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIyLmNvbG9yQXR0YWNobWVudHNbaV0uX3RleHR1cmVSZXNvdXJjZVVpZFxuICAgICAgLy8gICApXG4gICAgICAvLyApIHtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5jb3B5VGV4dHVyZURhdGEoXG4gICAgICAgIHNvdXJjZS5jb2xvckF0dGFjaG1lbnRzW2ldLl90ZXh0dXJlUmVzb3VyY2VVaWQsXG4gICAgICAgIHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIyLmNvbG9yQXR0YWNobWVudHNbaV0uX3RleHR1cmVSZXNvdXJjZVVpZFxuICAgICAgKTtcbiAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAvLyAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVUZXh0dXJlKFxuICAgICAgLy8gICAgIHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIyLmNvbG9yQXR0YWNobWVudHNbaV0uX3RleHR1cmVSZXNvdXJjZVVpZFxuICAgICAgLy8gICApO1xuICAgICAgLy8gICBbXG4gICAgICAvLyAgICAgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIuY29sb3JBdHRhY2htZW50c1tpXS5fdGV4dHVyZVJlc291cmNlVWlkLFxuICAgICAgLy8gICAgIHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIyLmNvbG9yQXR0YWNobWVudHNbaV0uX3RleHR1cmVWaWV3UmVzb3VyY2VVaWQsXG4gICAgICAvLyAgIF0gPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZHVwbGljYXRlVGV4dHVyZUFzTWlwbWFwcGVkKFxuICAgICAgLy8gICAgIHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIuY29sb3JBdHRhY2htZW50c1tpXS5fdGV4dHVyZVJlc291cmNlVWlkXG4gICAgICAvLyAgICk7XG4gICAgICAvLyB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFzc29jaWF0ZXMgYSBzcGVjaWZpYyBtYXRlcmlhbCB3aXRoIGEgcHJpbWl0aXZlIGZvciB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBXaGVuIHJlbmRlcmluZyB0aGUgc3BlY2lmaWVkIHByaW1pdGl2ZSwgdGhlIHJlbmRlciBwYXNzIHdpbGwgdXNlIHRoaXMgbWF0ZXJpYWxcbiAgICogaW5zdGVhZCBvZiB0aGUgcHJpbWl0aXZlJ3MgZGVmYXVsdCBtYXRlcmlhbC5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIHVzZSBmb3IgdGhlIHByaW1pdGl2ZVxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHRhcmdldCBwcmltaXRpdmUgdG8gb3ZlcnJpZGUgdGhlIG1hdGVyaWFsIGZvclxuICAgKi9cbiAgc2V0TWF0ZXJpYWxGb3JQcmltaXRpdmUobWF0ZXJpYWw6IE1hdGVyaWFsLCBwcmltaXRpdmU6IFByaW1pdGl2ZSkge1xuICAgIHRoaXMuX19wcmltaXRpdmVNYXRlcmlhbC5zZXQocHJpbWl0aXZlLm9iamVjdFVJRCwgbmV3IFdlYWtSZWYobWF0ZXJpYWwpKTtcblxuICAgIC8vIHRoaXMuX19zZXR1cE1hdGVyaWFsKG1hdGVyaWFsLCBwcmltaXRpdmUpO3NcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgZGVmYXVsdCBtYXRlcmlhbCBmb3IgYWxsIHByaW1pdGl2ZXMgaW4gdGhpcyByZW5kZXIgcGFzcy5cbiAgICogVGhpcyBtYXRlcmlhbCB3aWxsIGJlIHVzZWQgZm9yIGFueSBwcmltaXRpdmUgdGhhdCBkb2Vzbid0IGhhdmUgYSBzcGVjaWZpY1xuICAgKiBtYXRlcmlhbCBvdmVycmlkZSBzZXQgdmlhIHNldE1hdGVyaWFsRm9yUHJpbWl0aXZlKCkuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBkZWZhdWx0IG1hdGVyaWFsIHRvIHVzZSBmb3IgYWxsIHByaW1pdGl2ZXNcbiAgICovXG4gIHNldE1hdGVyaWFsKG1hdGVyaWFsOiBNYXRlcmlhbCkge1xuICAgIHRoaXMuX19tYXRlcmlhbCA9IG1hdGVyaWFsO1xuXG4gICAgLy8gdGhpcy5fX3NldHVwTWF0ZXJpYWwobWF0ZXJpYWwpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgbWF0ZXJpYWwgYXNzaWduZWQgdG8gdGhpcyByZW5kZXIgcGFzcy5cbiAgICogQHJldHVybnMgVGhlIGRlZmF1bHQgbWF0ZXJpYWwsIG9yIHVuZGVmaW5lZCBpZiBub25lIGlzIHNldFxuICAgKi9cbiAgZ2V0IG1hdGVyaWFsKCkge1xuICAgIHJldHVybiB0aGlzLl9fbWF0ZXJpYWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc3BlY2lmaWMgbWF0ZXJpYWwgYXNzaWduZWQgdG8gYSBwcmltaXRpdmUsIGlmIGFueS5cbiAgICpcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgdG8gZ2V0IHRoZSBtYXRlcmlhbCBmb3JcbiAgICogQHJldHVybnMgVGhlIG1hdGVyaWFsIGFzc2lnbmVkIHRvIHRoZSBwcmltaXRpdmUsIG9yIHVuZGVmaW5lZCBpZiBub25lIGlzIHNldFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRNYXRlcmlhbE9mKHByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHRoaXMuX19wcmltaXRpdmVNYXRlcmlhbC5nZXQocHJpbWl0aXZlLm9iamVjdFVJRCk/LmRlcmVmKCk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgYXBwcm9wcmlhdGUgbWF0ZXJpYWwgdG8gdXNlIGZvciByZW5kZXJpbmcgYSBwcmltaXRpdmUuXG4gICAqIFRoZSBwcmlvcml0eSBvcmRlciBpczpcbiAgICogMS4gUHJpbWl0aXZlLXNwZWNpZmljIG1hdGVyaWFsIChzZXQgdmlhIHNldE1hdGVyaWFsRm9yUHJpbWl0aXZlKVxuICAgKiAyLiBSZW5kZXIgcGFzcyBkZWZhdWx0IG1hdGVyaWFsIChzZXQgdmlhIHNldE1hdGVyaWFsKVxuICAgKiAzLiBQcmltaXRpdmUncyBvd24gbWF0ZXJpYWxcbiAgICpcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgdG8gZ2V0IHRoZSBtYXRlcmlhbCBmb3JcbiAgICogQHJldHVybnMgVGhlIG1hdGVyaWFsIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHJlbmRlcmluZyB0aGUgcHJpbWl0aXZlXG4gICAqL1xuICBnZXRBcHByb3ByaWF0ZU1hdGVyaWFsKHByaW1pdGl2ZTogUHJpbWl0aXZlKTogTWF0ZXJpYWwge1xuICAgIC8vIE1vc3QgcGFzc2VzIGhhdmUgbm8gcGVyLXByaW1pdGl2ZSBvdmVycmlkZXM7IHNraXAgdGhlIG1hcCBsb29rdXAgaW4gdGhhdCBjb21tb24gY2FzZS5cbiAgICBsZXQgbWF0ZXJpYWwgPSB0aGlzLl9fcHJpbWl0aXZlTWF0ZXJpYWwuc2l6ZSAhPT0gMCA/IHRoaXMuX2dldE1hdGVyaWFsT2YocHJpbWl0aXZlKSA6IHVuZGVmaW5lZDtcblxuICAgIGlmIChtYXRlcmlhbCAhPSBudWxsKSB7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9fbWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwgPSB0aGlzLl9fbWF0ZXJpYWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hdGVyaWFsID0gcHJpbWl0aXZlLm1hdGVyaWFsO1xuICAgIH1cbiAgICByZXR1cm4gbWF0ZXJpYWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAqIEByZXR1cm5zIFRoZSByZW5kZXIgcGFzcyBVSURcbiAgICovXG4gIGdldCByZW5kZXJQYXNzVUlEKCkge1xuICAgIHJldHVybiB0aGlzLl9fcmVuZGVyUGFzc1VJRDtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUlBLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsOEJBQThCO0FBQ3ZDLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMscUJBQTZDO0FBRXRELFNBQVMsaUJBQWlCO0FBSTFCLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsZUFBZTtBQWdDakIsSUFBTSxjQUFOLE1BQU0sb0JBQW1CLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBcUh2QyxZQUFZLFFBQWdCO0FBQzFCLFVBQU07QUFuSFIsU0FBUUEsS0FBa0QsQ0FBQztBQUMzRCxTQUFRQyxLQUFtRCxDQUFDO0FBQzVELFNBQVFDLEtBQXdELENBQUM7QUFDakUsU0FBUUMsS0FBb0MsQ0FBQztBQUM3QyxTQUFRQyxLQUE2QyxDQUFDO0FBT3RELFNBQVFDLEtBQW9FLG9CQUFJLElBQUk7QUFJcEY7QUFBQTtBQUFBLFNBQU8scUJBQXFCO0FBRTVCO0FBQUEsU0FBTyxxQkFBcUI7QUFFNUI7QUFBQSxTQUFPLHVCQUF1QjtBQUU5QjtBQUFBLFNBQU8sY0FBYztBQU1yQjtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQU8saUJBQWlCO0FBR3hCO0FBQUEsU0FBTyxhQUFhLFFBQVEsY0FBYyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUV0RDtBQUFBLFNBQU8sYUFBYTtBQUVwQjtBQUFBLFNBQU8sZUFBZTtBQVF0QjtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQU8sMENBQTBDO0FBRWpEO0FBQUEsU0FBTyx1Q0FBdUMsY0FBYztBQU01RDtBQUFBO0FBQUEsU0FBTyxnQkFBZ0I7QUFFdkI7QUFBQSxTQUFPLGdCQUFnQjtBQUl2QjtBQUFBO0FBQUEsU0FBTyxtQkFBbUI7QUFFMUI7QUFBQSxTQUFPLHdCQUF3QjtBQUUvQjtBQUFBLFNBQU8sNEJBQTRCO0FBRW5DO0FBQUEsU0FB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SUFBSTtBQUV0RixRQUFJLFlBQVksTUFBTTtBQUFBLElBQ3RCLFdBQVcsS0FBS0ssTUFBYyxNQUFNO0FBQ2xDLGlCQUFXLEtBQUtBO0FBQUEsSUFDbEIsT0FBTztBQUNMLGlCQUFXLFVBQVU7QUFBQSxJQUN2QjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksZ0JBQWdCO0FBQ2xCLFdBQU8sS0FBS0g7QUFBQSxFQUNkO0FBQ0Y7QUFBQTtBQTN3QmEsWUE0R0llLEtBQWtCLGVBQWUsS0FBSztBQUFBO0FBNUcxQyxZQStHR2QsS0FBbUI7QUEvRzVCLElBQU0sYUFBTjsiLAogICJuYW1lcyI6IFsiX19lbnRpdGllcyIsICJfX3NjZW5lR3JhcGhEaXJlY3RseUFkZGVkIiwgIl9fdG9wTGV2ZWxTY2VuZUdyYXBoQ29tcG9uZW50cyIsICJfX21lc2hDb21wb25lbnRzIiwgIl9fb3B0aW1pemVkTWVzaENvbXBvbmVudHMiLCAiX19wcmltaXRpdmVNYXRlcmlhbCIsICJfX2VuZ2luZSIsICJfX3JlbmRlclBhc3NVSUQiLCAiX19tZXNoX3VpZF9jb3VudCIsICJfX2NhbGNNZXNoQ29tcG9uZW50cyIsICJfX21hdGVyaWFsIiwgIl9fZnJhbWVCdWZmZXIiLCAiX19yZXNvbHZlRnJhbWVCdWZmZXIiLCAiX19yZXNvbHZlRnJhbWVCdWZmZXIyIiwgIl9fdmlld3BvcnQiLCAiX19wcmVFYWNoUmVuZGVyRnVuYyIsICJfX3Bvc3RFYWNoUmVuZGVyRnVuYyIsICJfX3JlbmRlclRhcmdldENvbG9yQXR0YWNobWVudHMiLCAibWFwIiwgImVudGl0eSIsICJfX2NvbGxlY3RUb3BMZXZlbFNjZW5lR3JhcGhDb21wb25lbnRzIiwgIl9fY29sbGVjdE1lc2hDb21wb25lbnRzIiwgIl9fdG1wX1ZlY3RvcjRfMCIsICJfX3NjaXNzb3JSZWN0IiwgIl9fY29weUZyYW1lYnVmZmVyVG9SZXNvbHZlRnJhbWVidWZmZXJJbm5lciJdCn0K
