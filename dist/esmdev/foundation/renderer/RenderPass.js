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
    this.Si = [];
    this.Ex = [];
    this.vx = [];
    this.xx = [];
    this.yx = [];
    this.Ax = /* @__PURE__ */ new Map();
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
    this.Hx = ++_RenderPass.il;
  }
  /**
   * Sets whether to render opaque primitives in this render pass.
   * @param toRender - True to render opaque primitives, false to skip them
   */
  setToRenderOpaquePrimitives(toRender) {
    this._toRenderOpaquePrimitives = toRender;
    this.Dx();
  }
  /**
   * Sets whether to render blend without Z-write primitives in this render pass.
   * @param toRender - True to render blend without Z-write primitives, false to skip them
   */
  setToRenderBlendWithoutZWritePrimitives(toRender) {
    this._toRenderBlendWithoutZWritePrimitives = toRender;
    this.Dx();
  }
  /**
   * Sets whether to render blend with Z-write primitives in this render pass.
   * @param toRender - True to render blend with Z-write primitives, false to skip them
   */
  setToRenderBlendWithZWritePrimitives(toRender) {
    this._toRenderBlendWithZWritePrimitives = toRender;
    this.Dx();
  }
  /**
   * Sets whether to render translucent primitives in this render pass.
   * @param toRender - True to render translucent primitives, false to skip them
   */
  setToRenderTranslucentPrimitives(toRender) {
    this._toRenderTranslucentPrimitives = toRender;
    this.Dx();
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
    this.Hl = material;
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
    this.Hl = material;
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
    renderPass.Si = this.Si.concat();
    renderPass.Ex = this.Ex.concat();
    renderPass.vx = this.vx.concat();
    renderPass.xx = this.xx.concat();
    renderPass.yx = this.yx.concat();
    renderPass.wx = this.wx;
    renderPass.tx = this.tx;
    renderPass.ux = this.ux;
    renderPass.zx = (_a = this.zx) == null ? void 0 : _a.clone();
    renderPass.toClearColorBuffer = this.toClearColorBuffer;
    renderPass.toClearDepthBuffer = this.toClearDepthBuffer;
    renderPass.toClearStencilBuffer = this.toClearStencilBuffer;
    renderPass.isDepthTest = this.isDepthTest;
    renderPass.clearColor = this.clearColor.clone();
    renderPass.clearDepth = this.clearDepth;
    renderPass.clearStencil = this.clearStencil;
    renderPass.cameraComponent = this.cameraComponent;
    renderPass.Hl = this.Hl;
    renderPass.Ax = new Map(this.Ax);
    renderPass.isVrRendering = this.isVrRendering;
    renderPass.isOutputForVr = this.isOutputForVr;
    renderPass._toRenderOpaquePrimitives = this._toRenderOpaquePrimitives;
    renderPass._toRenderTranslucentPrimitives = this._toRenderTranslucentPrimitives;
    renderPass._toRenderBlendWithoutZWritePrimitives = this._toRenderBlendWithoutZWritePrimitives;
    renderPass.Bx = this.Bx;
    renderPass.Cx = this.Cx;
    renderPass.Fx = (_b = this.Fx) == null ? void 0 : _b.concat();
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
    this.Bx = func;
  }
  /**
   * Sets a function to be called after each render operation.
   * This can be used for custom cleanup logic after rendering completes.
   *
   * @param func - The function to call after rendering
   */
  setPostRenderFunction(func) {
    this.Cx = func;
  }
  /**
   * Executes the pre-render function if one has been set.
   * This method is called internally by the rendering system.
   *
   * @internal
   */
  doPreRender() {
    if (this.Bx != null) {
      this.Bx();
    }
  }
  /**
   * Executes the post-render function if one has been set.
   * This method is called internally by the rendering system.
   *
   * @internal
   */
  doPostRender() {
    if (this.Cx != null) {
      this.Cx();
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
      this.Ex.push(sceneGraphComponent);
      const collectedSgComponents = flattenHierarchy(sceneGraphComponent, false);
      const collectedEntities = collectedSgComponents.map((sg) => sg.entity).filter((e) => e != null);
      const map = this.Si.concat(collectedEntities).reduce((map2, entity2) => {
        map2.set(entity2.entityUID, entity2);
        return map2;
      }, /* @__PURE__ */ new Map());
      this.Si = Array.from(map.values());
    }
    this.Dx();
    this.vx = [];
    this.Kx();
  }
  /**
   * Recalculates and updates the mesh components collections.
   * This includes both the complete list and the optimized list based on rendering flags.
   *
   * @private
   */
  Dx() {
    this.xx = [];
    this.yx = [];
    this.Lx();
  }
  /**
   * Gets the list of all entities in this render pass.
   * @returns An array of scene graph entities
   */
  get entities() {
    return this.Si;
  }
  /**
   * Removes all entities from this render pass and clears related collections.
   * This effectively empties the render pass of all renderable content.
   */
  clearEntities() {
    this.xx = [];
    this.yx = [];
    this.vx = [];
    this.Si = [];
  }
  /**
   * Collects and organizes the top-level scene graph components.
   * This method traverses the hierarchy to find root-level components.
   *
   * @private
   */
  Kx() {
    const goToTopLevel = (sg) => {
      if (sg.parent) {
        goToTopLevel(sg.parent);
      }
      return sg;
    };
    this.vx = this.Ex.map((sg) => {
      return goToTopLevel(sg);
    });
    const set = new Set(this.vx);
    this.vx = Array.from(set);
  }
  /**
   * Collects mesh components from entities and creates optimized collections.
   * The optimized collection excludes components based on rendering flags.
   *
   * @private
   */
  Lx() {
    this.xx = [];
    this.yx = [];
    for (const entity of this.Si) {
      const meshComponent = entity.getComponentByComponentTID(WellKnownComponentTIDs.MeshComponentTID);
      if (meshComponent != null && meshComponent.mesh != null) {
        this.xx.push(meshComponent);
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
        this.yx.push(meshComponent);
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
    return this.xx;
  }
  /**
   * Gets the optimized mesh components collection for rendering.
   * This collection is filtered based on the rendering flags for different primitive types.
   *
   * @returns An array of mesh components that should be rendered
   * @internal
   */
  get _optimizedMeshComponents() {
    return this.yx;
  }
  /**
   * Gets all top-level scene graph components in this render pass.
   * These are the root components of the scene graph hierarchies.
   *
   * @returns An array of top-level scene graph components
   */
  get sceneTopLevelGraphComponents() {
    return this.vx;
  }
  /**
   * Sets the target framebuffer for this render pass.
   * If multiple render passes share a framebuffer, they will render to the same target.
   * Setting a framebuffer automatically configures the viewport to match the framebuffer size.
   *
   * @param framebuffer - The framebuffer to render to, or undefined to render to the default framebuffer
   */
  setFramebuffer(framebuffer) {
    this.wx = framebuffer;
    if (framebuffer != null) {
      this.setViewport(Vector4.fromCopyArray([0, 0, framebuffer.width, framebuffer.height]));
    } else {
      this.zx = void 0;
    }
  }
  /**
   * Sets the color attachment targets for rendering.
   * This specifies which color attachments of the framebuffer should be rendered to.
   *
   * @param indeces - Array of render buffer target enums, or undefined to use default targets
   */
  setRenderTargetColorAttachments(indeces) {
    this.Fx = indeces;
  }
  /**
   * Gets the current render target color attachments.
   * @returns Array of render buffer target enums, or undefined if using defaults
   */
  getRenderTargetColorAttachments() {
    return this.Fx;
  }
  /**
   * Gets the current framebuffer assigned to this render pass.
   * @returns The framebuffer, or undefined if rendering to the default framebuffer
   */
  getFramebuffer() {
    return this.wx;
  }
  /**
   * Removes the current framebuffer assignment.
   * After calling this, the render pass will render to the default framebuffer.
   */
  removeFramebuffer() {
    this.wx = void 0;
  }
  /**
   * Sets the viewport for this render pass.
   * The viewport defines the rectangular area of the framebuffer that will be rendered to.
   *
   * @param vec - A Vector4 containing (x, y, width, height) of the viewport
   */
  setViewport(vec) {
    if (this.zx != null) {
      this.zx.copyComponents(vec);
    } else {
      this.zx = MutableVector4.fromCopyArray([vec.x, vec.y, vec.z, vec.w]);
    }
  }
  /**
   * Gets the current viewport settings.
   * @returns A Vector4 containing (x, y, width, height) of the viewport, or undefined if not set
   */
  getViewport() {
    let viewport = this.zx;
    if (viewport != null) {
      viewport = _RenderPass.Jx.copyComponents(viewport);
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
      this.Gx = void 0;
      return;
    }
    this.Gx = {
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
    return this.Gx;
  }
  /**
   * Sets the resolve framebuffer for multisampling.
   * The resolve framebuffer is used as the destination when resolving multisampled content.
   *
   * @param framebuffer - The resolve framebuffer, or undefined to disable resolving
   */
  setResolveFramebuffer(framebuffer) {
    this.tx = framebuffer;
  }
  /**
   * Gets the current resolve framebuffer.
   * @returns The resolve framebuffer, or undefined if not set
   */
  getResolveFramebuffer() {
    return this.tx;
  }
  /**
   * Sets the secondary resolve framebuffer.
   * This can be used for additional resolve operations or multi-target resolving.
   *
   * @param framebuffer - The secondary resolve framebuffer, or undefined to disable
   */
  setResolveFramebuffer2(framebuffer) {
    this.ux = framebuffer;
  }
  /**
   * Gets the current secondary resolve framebuffer.
   * @returns The secondary resolve framebuffer, or undefined if not set
   */
  getResolveFramebuffer2() {
    return this.ux;
  }
  /**
   * Copies the main framebuffer content to both resolve framebuffers using WebGL.
   * This method handles the blit operations for multisampling resolve.
   *
   * @internal
   */
  _copyFramebufferToResolveFramebuffersWebGL() {
    this.Ix(this.tx);
    this.Ix(this.ux);
  }
  /**
   * Internal helper method for copying framebuffer content to a resolve framebuffer.
   *
   * @param resolveFrameBuffer - The target resolve framebuffer
   * @private
   */
  Ix(resolveFrameBuffer) {
    if (resolveFrameBuffer == null) {
      return;
    }
    const repo = this.c.webglResourceRepository;
    const webGLResourceFrameBuffer = repo.getWebGLResource(this.wx.cgApiResourceUid);
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
      this.wx.width,
      this.wx.height,
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
    if (this.tx == null || this.ux == null) {
      return;
    }
    const webGpuResourceRepository = this.c.webGpuResourceRepository;
    for (let i = 0; i < this.tx.colorAttachments.length; i++) {
      if (this.tx.colorAttachments[i] == null || this.ux.colorAttachments[i] == null || this.tx.colorAttachments[i]._textureResourceUid === -1 || this.ux.colorAttachments[i]._textureResourceUid === -1) {
        continue;
      }
      webGpuResourceRepository.copyTextureData(
        this.tx.colorAttachments[i]._textureResourceUid,
        this.ux.colorAttachments[i]._textureResourceUid
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
    this.Ax.set(primitive.objectUID, new WeakRef(material));
  }
  /**
   * Sets a default material for all primitives in this render pass.
   * This material will be used for any primitive that doesn't have a specific
   * material override set via setMaterialForPrimitive().
   *
   * @param material - The default material to use for all primitives
   */
  setMaterial(material) {
    this.Hl = material;
  }
  /**
   * Gets the default material assigned to this render pass.
   * @returns The default material, or undefined if none is set
   */
  get material() {
    return this.Hl;
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
    return (_a = this.Ax.get(primitive.objectUID)) == null ? void 0 : _a.deref();
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
    let material = this.Ax.size !== 0 ? this._getMaterialOf(primitive) : void 0;
    if (material != null) {
    } else if (this.Hl != null) {
      material = this.Hl;
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
    return this.Hx;
  }
};
/** @internal Temporary Vector4 for internal calculations */
_RenderPass.Jx = MutableVector4.zero();
/** @internal Static counter for generating unique mesh UIDs */
_RenderPass.il = -1;
var RenderPass = _RenderPass;
export {
  RenderPass
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcmVuZGVyZXIvUmVuZGVyUGFzcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBFbnRpdHlVSUQsIFJlbmRlclBhc3NVSUQgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2gvTWVzaENvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL1NjZW5lR3JhcGgvU2NlbmVHcmFwaENvbXBvbmVudCc7XG5pbXBvcnQgeyBmbGF0dGVuSGllcmFyY2h5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9TY2VuZUdyYXBoL1NjZW5lR3JhcGhPcHMnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBSbk9iamVjdCB9IGZyb20gJy4uL2NvcmUvUm5PYmplY3QnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSwgdHlwZSBQcmltaXRpdmVNb2RlRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJCdWZmZXJUYXJnZXRFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvUmVuZGVyQnVmZmVyVGFyZ2V0JztcbmltcG9ydCB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgdHlwZSB7IElNZXNoRW50aXR5LCBJU2NlbmVHcmFwaEVudGl0eSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB0eXBlIHsgTWF0ZXJpYWwgfSBmcm9tICcuLi9tYXRlcmlhbHMvY29yZS9NYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9JVmVjdG9yJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlVmVjdG9yNCc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IEZyYW1lQnVmZmVyIH0gZnJvbSAnLi9GcmFtZUJ1ZmZlcic7XG5cbnR5cGUgUHJpbWl0aXZlUm5PYmplY3RVSUQgPSBudW1iZXI7XG5cbi8qKlxuICogQSBzY2lzc29yIHJlY3RhbmdsZSBpbiByZW5kZXItdGFyZ2V0IHBpeGVscy5cbiAqXG4gKiBUaGUgb3JpZ2luIGlzIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgdGhlIHJlbmRlciB0YXJnZXQgKHRoZSBzYW1lIGNvbnZlbnRpb24gYXNcbiAqIFdlYkdQVSdzIGBzZXRTY2lzc29yUmVjdGApOyB0aGUgV2ViR0wgcGF0aCBjb252ZXJ0cyBpdCB0byB0aGUgYm90dG9tLWxlZnQgb3JpZ2luLlxuICovXG5leHBvcnQgdHlwZSBSZW5kZXJQYXNzU2Npc3NvclJlY3QgPSB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbn07XG5cbi8qKlxuICogQSByZW5kZXIgcGFzcyByZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiByZW5kZXJpbmcgcmVzb3VyY2VzIGFuZCBzZXR0aW5ncyB1c2VkIGluIHRoZSByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKiBJdCBtYW5hZ2VzIGVudGl0aWVzLCBtYXRlcmlhbHMsIGZyYW1lYnVmZmVycywgYW5kIHZhcmlvdXMgcmVuZGVyaW5nIHN0YXRlcyB0byBjb250cm9sIGhvdyBvYmplY3RzIGFyZSByZW5kZXJlZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgcmVuZGVyUGFzcyA9IG5ldyBSZW5kZXJQYXNzKCk7XG4gKiByZW5kZXJQYXNzLmFkZEVudGl0aWVzKFtlbnRpdHkxLCBlbnRpdHkyXSk7XG4gKiByZW5kZXJQYXNzLnNldEZyYW1lYnVmZmVyKGZyYW1lYnVmZmVyKTtcbiAqIHJlbmRlclBhc3MudG9DbGVhckNvbG9yQnVmZmVyID0gdHJ1ZTtcbiAqIHJlbmRlclBhc3MuY2xlYXJDb2xvciA9IFZlY3RvcjQuZnJvbUNvcHlBcnJheShbMC4yLCAwLjMsIDAuNCwgMS4wXSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFJlbmRlclBhc3MgZXh0ZW5kcyBSbk9iamVjdCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX19lbmdpbmU6IEVuZ2luZTtcbiAgcHJpdmF0ZSByZWFkb25seSBfX3JlbmRlclBhc3NVSUQ6IFJlbmRlclBhc3NVSUQ7XG4gIHByaXZhdGUgX19lbnRpdGllczogKElNZXNoRW50aXR5IHwgSVNjZW5lR3JhcGhFbnRpdHkpW10gPSBbXTtcbiAgcHJpdmF0ZSBfX3NjZW5lR3JhcGhEaXJlY3RseUFkZGVkOiBTY2VuZUdyYXBoQ29tcG9uZW50W10gPSBbXTtcbiAgcHJpdmF0ZSBfX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHM6IFNjZW5lR3JhcGhDb21wb25lbnRbXSA9IFtdO1xuICBwcml2YXRlIF9fbWVzaENvbXBvbmVudHM6IE1lc2hDb21wb25lbnRbXSA9IFtdO1xuICBwcml2YXRlIF9fb3B0aW1pemVkTWVzaENvbXBvbmVudHM6IE1lc2hDb21wb25lbnRbXSA9IFtdO1xuICBwcml2YXRlIF9fZnJhbWVCdWZmZXI/OiBGcmFtZUJ1ZmZlcjtcbiAgcHJpdmF0ZSBfX3Jlc29sdmVGcmFtZUJ1ZmZlcj86IEZyYW1lQnVmZmVyO1xuICBwcml2YXRlIF9fcmVzb2x2ZUZyYW1lQnVmZmVyMj86IEZyYW1lQnVmZmVyO1xuICBwcml2YXRlIF9fdmlld3BvcnQ/OiBNdXRhYmxlVmVjdG9yNDtcbiAgcHJpdmF0ZSBfX3NjaXNzb3JSZWN0PzogUmVuZGVyUGFzc1NjaXNzb3JSZWN0O1xuICBwcml2YXRlIF9fbWF0ZXJpYWw/OiBNYXRlcmlhbDtcbiAgcHJpdmF0ZSBfX3ByaW1pdGl2ZU1hdGVyaWFsOiBNYXA8UHJpbWl0aXZlUm5PYmplY3RVSUQsIFdlYWtSZWY8TWF0ZXJpYWw+PiA9IG5ldyBNYXAoKTtcblxuICAvLyBQdWJsaWMgUmVuZGVyUGFzcyBTZXR0aW5nc1xuICAvKiogV2hldGhlciB0byBjbGVhciB0aGUgY29sb3IgYnVmZmVyIGJlZm9yZSByZW5kZXJpbmcgKi9cbiAgcHVibGljIHRvQ2xlYXJDb2xvckJ1ZmZlciA9IGZhbHNlO1xuICAvKiogV2hldGhlciB0byBjbGVhciB0aGUgZGVwdGggYnVmZmVyIGJlZm9yZSByZW5kZXJpbmcgKi9cbiAgcHVibGljIHRvQ2xlYXJEZXB0aEJ1ZmZlciA9IHRydWU7XG4gIC8qKiBXaGV0aGVyIHRvIGNsZWFyIHRoZSBzdGVuY2lsIGJ1ZmZlciBiZWZvcmUgcmVuZGVyaW5nICovXG4gIHB1YmxpYyB0b0NsZWFyU3RlbmNpbEJ1ZmZlciA9IGZhbHNlO1xuICAvKiogV2hldGhlciB0byBlbmFibGUgZGVwdGggdGVzdGluZyBkdXJpbmcgcmVuZGVyaW5nICovXG4gIHB1YmxpYyBpc0RlcHRoVGVzdCA9IHRydWU7XG5cbiAgLyoqXG4gICAqIERlcHRoIHdyaXRlIG1hc2sgZm9yIHByaW1pdGl2ZXMgZHJhd2luZy5cbiAgICogV2hlbiBmYWxzZSwgZGVwdGggdmFsdWVzIGFyZSBub3Qgd3JpdHRlbiB0byB0aGUgZGVwdGggYnVmZmVyLCBidXQgZGVwdGggY2xlYXIgaXMgc3RpbGwgcGVyZm9ybWVkLlxuICAgKi9cbiAgcHVibGljIGRlcHRoV3JpdGVNYXNrID0gdHJ1ZTtcblxuICAvKiogVGhlIGNvbG9yIHZhbHVlIHVzZWQgdG8gY2xlYXIgdGhlIGNvbG9yIGJ1ZmZlciAoUkdCQSBmb3JtYXQpICovXG4gIHB1YmxpYyBjbGVhckNvbG9yID0gVmVjdG9yNC5mcm9tQ29weUFycmF5KFsxLCAxLCAxLCAxXSk7XG4gIC8qKiBUaGUgZGVwdGggdmFsdWUgdXNlZCB0byBjbGVhciB0aGUgZGVwdGggYnVmZmVyICh0eXBpY2FsbHkgMS4wIGZvciBmYXIgcGxhbmUpICovXG4gIHB1YmxpYyBjbGVhckRlcHRoID0gMTtcbiAgLyoqIFRoZSBzdGVuY2lsIHZhbHVlIHVzZWQgdG8gY2xlYXIgdGhlIHN0ZW5jaWwgYnVmZmVyICovXG4gIHB1YmxpYyBjbGVhclN0ZW5jaWwgPSAwO1xuICAvKiogVGhlIGNhbWVyYSBjb21wb25lbnQgdXNlZCBmb3IgcmVuZGVyaW5nIHRoaXMgcGFzcyAqL1xuICBwdWJsaWMgY2FtZXJhQ29tcG9uZW50PzogQ2FtZXJhQ29tcG9uZW50O1xuXG4gIC8qKlxuICAgKiBJZiB0aGlzIHZhbHVlIGlzIGdyZWF0ZXIgdGhhbiAxLCBidWZmZXItbGVzcyByZW5kZXJpbmcgaXMgcGVyZm9ybWVkIHdpdGggdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgdmVydGljZXMuXG4gICAqIEluIHRoaXMgY2FzZSwgcmVnaXN0ZXJlZCBlbnRpdGllcyBhcmUgaWdub3JlZCBhbmQgbm90IHJlbmRlcmVkLlxuICAgKi9cbiAgcHVibGljIF9kcmF3VmVydGV4TnVtYmVyRm9yQnVmZmVyTGVzc1JlbmRlcmluZyA9IDA7XG4gIC8qKiBUaGUgcHJpbWl0aXZlIG1vZGUgdXNlZCBmb3IgYnVmZmVyLWxlc3MgcmVuZGVyaW5nICovXG4gIHB1YmxpYyBfcHJpbWl0aXZlTW9kZUZvckJ1ZmZlckxlc3NSZW5kZXJpbmcgPSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlcztcbiAgLyoqIEEgZHVtbXkgcHJpbWl0aXZlIHVzZWQgZm9yIGJ1ZmZlci1sZXNzIHJlbmRlcmluZyAqL1xuICBwdWJsaWMgX2R1bW15UHJpbWl0aXZlRm9yQnVmZmVyTGVzc1JlbmRlcmluZzogUHJpbWl0aXZlO1xuXG4gIC8vIFZSXG4gIC8qKiBXaGV0aGVyIFZSIHJlbmRlcmluZyBpcyBlbmFibGVkIGZvciB0aGlzIHJlbmRlciBwYXNzICovXG4gIHB1YmxpYyBpc1ZyUmVuZGVyaW5nID0gdHJ1ZTtcbiAgLyoqIFdoZXRoZXIgdGhpcyByZW5kZXIgcGFzcyBvdXRwdXRzIGZvciBWUiBkaXNwbGF5ICovXG4gIHB1YmxpYyBpc091dHB1dEZvclZyID0gZmFsc2U7XG5cbiAgLy8gSW50ZXJuYWwgdXNlXG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBpbmRleCBvZiBvcGFxdWUgcHJpbWl0aXZlcyBpbiB0aGUgcmVuZGVyIHF1ZXVlICovXG4gIHB1YmxpYyBfbGFzdE9wYXF1ZUluZGV4ID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBpbmRleCBvZiB0cmFuc2x1Y2VudCBwcmltaXRpdmVzIGluIHRoZSByZW5kZXIgcXVldWUgKi9cbiAgcHVibGljIF9sYXN0VHJhbnNsdWNlbnRJbmRleCA9IC0xO1xuICAvKiogQGludGVybmFsIExhc3QgaW5kZXggb2YgYmxlbmQgd2l0aCBaLXdyaXRlIHByaW1pdGl2ZXMgaW4gdGhlIHJlbmRlciBxdWV1ZSAqL1xuICBwdWJsaWMgX2xhc3RCbGVuZFdpdGhaV3JpdGVJbmRleCA9IC0xO1xuICAvKiogQGludGVybmFsIExhc3QgaW5kZXggb2YgYmxlbmQgd2l0aG91dCBaLXdyaXRlIHByaW1pdGl2ZXMgaW4gdGhlIHJlbmRlciBxdWV1ZSAqL1xuICBwdWJsaWMgX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleCA9IC0xO1xuICAvKiogQGludGVybmFsIEFycmF5IG9mIGxhc3QgcHJpbWl0aXZlIFVJRHMgZm9yIG9wdGltaXphdGlvbiAqL1xuICBwdWJsaWMgX2xhc3RQcmltaXRpdmVVaWRzOiBudW1iZXJbXSA9IFtdO1xuICAvKipcbiAgICogQGludGVybmFsIFByaW1pdGl2ZXMgaW4gdGhlIHNhbWUgb3JkZXIgYXMgYF9sYXN0UHJpbWl0aXZlVWlkc2AsIHNvIHRoZSByZW5kZXIgc3RyYXRlZ3kgY2FuXG4gICAqIGF2b2lkIGEgcGVyLXByaW1pdGl2ZSByZXBvc2l0b3J5IGxvb2t1cC4gVmFsaWQgb25seSB3aGlsZSBgX2xhc3RQcmltaXRpdmVVaWRzYCBpcyB0aGUgYXJyYXlcbiAgICogdGhlIHN0cmF0ZWd5IHdhcyBjYWxsZWQgd2l0aC5cbiAgICovXG4gIHB1YmxpYyBfbGFzdFByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdIHwgbnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCB0cmFuc2Zvcm0gY29tcG9uZW50cyB1cGRhdGUgY291bnQgZm9yIGNoYW5nZSBkZXRlY3Rpb24gKi9cbiAgcHVibGljIF9sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBjYW1lcmEgY29udHJvbGxlciBjb21wb25lbnRzIHVwZGF0ZSBjb3VudCBmb3IgY2hhbmdlIGRldGVjdGlvbiAqL1xuICBwdWJsaWMgX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBzY2VuZSBncmFwaCBjb21wb25lbnRzIHVwZGF0ZSBjb3VudCBmb3IgY2hhbmdlIGRldGVjdGlvbiAqL1xuICBwdWJsaWMgX2xhc3RTY2VuZUdyYXBoQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgTGFzdCBtdWx0aS1kcmF3IGdyb3VwIHZlcnNpb24gZm9yIGNoYW5nZSBkZXRlY3Rpb24gKi9cbiAgcHVibGljIF9sYXN0TXVsdGlEcmF3R3JvdXBWZXJzaW9uID0gLTE7XG4gIC8qKiBAaW50ZXJuYWwgV2hldGhlciBzb21ldGhpbmcgd2FzIHJlbmRlcmVkIGluIHRoZSBwcmV2aW91cyBmcmFtZSAqL1xuICBwdWJsaWMgX3JlbmRlcmVkU29tZXRoaW5nQmVmb3JlID0gdHJ1ZTtcbiAgLyoqIEBpbnRlcm5hbCBXaGV0aGVyIHRoZSBzb3J0IHJlbmRlciByZXN1bHQgaGFzIGNoYW5nZWQgKi9cbiAgcHVibGljIF9pc0NoYW5nZWRTb3J0UmVuZGVyUmVzdWx0ID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdG8gcmVuZGVyIG9wYXF1ZSBwcmltaXRpdmVzIGNvbnRhaW5lZCBpbiB0aGlzIHJlbmRlciBwYXNzICovXG4gIHB1YmxpYyBfdG9SZW5kZXJPcGFxdWVQcmltaXRpdmVzID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0byByZW5kZXIgdHJhbnNsdWNlbnQgcHJpbWl0aXZlcyBjb250YWluZWQgaW4gdGhpcyByZW5kZXIgcGFzcyAqL1xuICBwdWJsaWMgX3RvUmVuZGVyVHJhbnNsdWNlbnRQcmltaXRpdmVzID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0byByZW5kZXIgYmxlbmQgd2l0aCBaLXdyaXRlIHByaW1pdGl2ZXMgY29udGFpbmVkIGluIHRoaXMgcmVuZGVyIHBhc3MgKi9cbiAgcHVibGljIF90b1JlbmRlckJsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMgPSB0cnVlO1xuXG4gIC8qKiBXaGV0aGVyIHRvIHJlbmRlciBibGVuZCB3aXRob3V0IFotd3JpdGUgcHJpbWl0aXZlcyBjb250YWluZWQgaW4gdGhpcyByZW5kZXIgcGFzcyAqL1xuICBwdWJsaWMgX3RvUmVuZGVyQmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcyA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdG8gcmVuZGVyIEVmZmVrc2VlciBlZmZlY3RzIGluIHRoaXMgcmVuZGVyIHBhc3MgKi9cbiAgcHVibGljIHRvUmVuZGVyRWZmZWtzZWVyRWZmZWN0cyA9IGZhbHNlO1xuICAvKiogQGludGVybmFsIENvbG9yIGF0dGFjaG1lbnQgdGFyZ2V0cyBmb3IgcmVuZGVyaW5nICovXG4gIHB1YmxpYyBfX3JlbmRlclRhcmdldENvbG9yQXR0YWNobWVudHM/OiBSZW5kZXJCdWZmZXJUYXJnZXRFbnVtW107XG4gIC8qKiBAaW50ZXJuYWwgRnVuY3Rpb24gY2FsbGVkIGJlZm9yZSBlYWNoIHJlbmRlciBvcGVyYXRpb24gKi9cbiAgcHJpdmF0ZSBfX3ByZUVhY2hSZW5kZXJGdW5jPzogKCkgPT4gdm9pZDtcbiAgLyoqIEBpbnRlcm5hbCBGdW5jdGlvbiBjYWxsZWQgYWZ0ZXIgZWFjaCByZW5kZXIgb3BlcmF0aW9uICovXG4gIHByaXZhdGUgX19wb3N0RWFjaFJlbmRlckZ1bmM/OiAoKSA9PiB2b2lkO1xuICAvKiogQGludGVybmFsIFRlbXBvcmFyeSBWZWN0b3I0IGZvciBpbnRlcm5hbCBjYWxjdWxhdGlvbnMgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfVmVjdG9yNF8wID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuXG4gIC8qKiBAaW50ZXJuYWwgU3RhdGljIGNvdW50ZXIgZm9yIGdlbmVyYXRpbmcgdW5pcXVlIG1lc2ggVUlEcyAqL1xuICBwdWJsaWMgc3RhdGljIF9fbWVzaF91aWRfY291bnQgPSAtMTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBSZW5kZXJQYXNzIGluc3RhbmNlLlxuICAgKiBBdXRvbWF0aWNhbGx5IGFzc2lnbnMgYSB1bmlxdWUgcmVuZGVyIHBhc3MgVUlELlxuICAgKi9cbiAgY29uc3RydWN0b3IoZW5naW5lOiBFbmdpbmUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XG4gICAgdGhpcy5fZHVtbXlQcmltaXRpdmVGb3JCdWZmZXJMZXNzUmVuZGVyaW5nID0gbmV3IFByaW1pdGl2ZShlbmdpbmUpO1xuICAgIHRoaXMuX19yZW5kZXJQYXNzVUlEID0gKytSZW5kZXJQYXNzLl9fbWVzaF91aWRfY291bnQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRvIHJlbmRlciBvcGFxdWUgcHJpbWl0aXZlcyBpbiB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBAcGFyYW0gdG9SZW5kZXIgLSBUcnVlIHRvIHJlbmRlciBvcGFxdWUgcHJpbWl0aXZlcywgZmFsc2UgdG8gc2tpcCB0aGVtXG4gICAqL1xuICBzZXRUb1JlbmRlck9wYXF1ZVByaW1pdGl2ZXModG9SZW5kZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl90b1JlbmRlck9wYXF1ZVByaW1pdGl2ZXMgPSB0b1JlbmRlcjtcbiAgICB0aGlzLl9fY2FsY01lc2hDb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRvIHJlbmRlciBibGVuZCB3aXRob3V0IFotd3JpdGUgcHJpbWl0aXZlcyBpbiB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBAcGFyYW0gdG9SZW5kZXIgLSBUcnVlIHRvIHJlbmRlciBibGVuZCB3aXRob3V0IFotd3JpdGUgcHJpbWl0aXZlcywgZmFsc2UgdG8gc2tpcCB0aGVtXG4gICAqL1xuICBzZXRUb1JlbmRlckJsZW5kV2l0aG91dFpXcml0ZVByaW1pdGl2ZXModG9SZW5kZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl90b1JlbmRlckJsZW5kV2l0aG91dFpXcml0ZVByaW1pdGl2ZXMgPSB0b1JlbmRlcjtcbiAgICB0aGlzLl9fY2FsY01lc2hDb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRvIHJlbmRlciBibGVuZCB3aXRoIFotd3JpdGUgcHJpbWl0aXZlcyBpbiB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBAcGFyYW0gdG9SZW5kZXIgLSBUcnVlIHRvIHJlbmRlciBibGVuZCB3aXRoIFotd3JpdGUgcHJpbWl0aXZlcywgZmFsc2UgdG8gc2tpcCB0aGVtXG4gICAqL1xuICBzZXRUb1JlbmRlckJsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXModG9SZW5kZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl90b1JlbmRlckJsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMgPSB0b1JlbmRlcjtcbiAgICB0aGlzLl9fY2FsY01lc2hDb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRvIHJlbmRlciB0cmFuc2x1Y2VudCBwcmltaXRpdmVzIGluIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAqIEBwYXJhbSB0b1JlbmRlciAtIFRydWUgdG8gcmVuZGVyIHRyYW5zbHVjZW50IHByaW1pdGl2ZXMsIGZhbHNlIHRvIHNraXAgdGhlbVxuICAgKi9cbiAgc2V0VG9SZW5kZXJUcmFuc2x1Y2VudFByaW1pdGl2ZXModG9SZW5kZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl90b1JlbmRlclRyYW5zbHVjZW50UHJpbWl0aXZlcyA9IHRvUmVuZGVyO1xuICAgIHRoaXMuX19jYWxjTWVzaENvbXBvbmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyByZW5kZXIgcGFzcyBpcyBpbiBidWZmZXItbGVzcyByZW5kZXJpbmcgbW9kZS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBidWZmZXItbGVzcyByZW5kZXJpbmcgaXMgZW5hYmxlZCAodmVydGV4IGNvdW50ID4gMClcbiAgICovXG4gIGlzQnVmZmVyTGVzc1JlbmRlcmluZ01vZGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYXdWZXJ0ZXhOdW1iZXJGb3JCdWZmZXJMZXNzUmVuZGVyaW5nID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoaXMgcmVuZGVyIHBhc3MgZm9yIGJ1ZmZlci1sZXNzIHJlbmRlcmluZyBtb2RlLlxuICAgKiBJbiBidWZmZXItbGVzcyByZW5kZXJpbmcsIHZlcnRpY2VzIGFyZSBnZW5lcmF0ZWQgcHJvY2VkdXJhbGx5IHdpdGhvdXQgdmVydGV4IGJ1ZmZlcnMuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBmdWxsLXNjcmVlbiBlZmZlY3RzIG9yIHByb2NlZHVyYWwgZ2VvbWV0cnkuXG4gICAqIFdoZW4gZW5hYmxlZCwgcmVnaXN0ZXJlZCBlbnRpdGllcyBhcmUgaWdub3JlZCBhbmQgbm90IHJlbmRlcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlTW9kZSAtIFRoZSBwcmltaXRpdmUgbW9kZSB0byB1c2UgZm9yIHJlbmRlcmluZ1xuICAgKiBAcGFyYW0gZHJhd1ZlcnRleE51bWJlcldpdGhvdXRFbnRpdGllcyAtIE51bWJlciBvZiB2ZXJ0aWNlcyB0byBnZW5lcmF0ZSBhbmQgcmVuZGVyXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byB1c2UgZm9yIHJlbmRlcmluZ1xuICAgKi9cbiAgc2V0QnVmZmVyTGVzc1JlbmRlcmluZyhcbiAgICBwcmltaXRpdmVNb2RlOiBQcmltaXRpdmVNb2RlRW51bSxcbiAgICBkcmF3VmVydGV4TnVtYmVyV2l0aG91dEVudGl0aWVzOiBudW1iZXIsXG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsXG4gICkge1xuICAgIHRoaXMuX3ByaW1pdGl2ZU1vZGVGb3JCdWZmZXJMZXNzUmVuZGVyaW5nID0gcHJpbWl0aXZlTW9kZTtcbiAgICB0aGlzLl9kcmF3VmVydGV4TnVtYmVyRm9yQnVmZmVyTGVzc1JlbmRlcmluZyA9IGRyYXdWZXJ0ZXhOdW1iZXJXaXRob3V0RW50aXRpZXM7XG4gICAgdGhpcy5fX21hdGVyaWFsID0gbWF0ZXJpYWw7XG5cbiAgICAvLyBFbnN1cmUgdGhpcyByZW5kZXIgcGFzcyBpcyBwcm9jZXNzZWQgb24gdGhlIG5leHQgZnJhbWVcbiAgICAvLyBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHRoZSByZW5kZXIgcGFzcyBtYXkgaGF2ZSBiZWVuIHNraXBwZWQgcHJldmlvdXNseVxuICAgIC8vIHdoZW4gaXQgaGFkIG5vIG1hdGVyaWFsIG9yIHByaW1pdGl2ZXMgdG8gcmVuZGVyXG4gICAgdGhpcy5fcmVuZGVyZWRTb21ldGhpbmdCZWZvcmUgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhpcyByZW5kZXIgcGFzcyBmb3IgZnVsbC1zY3JlZW4gYnVmZmVyLWxlc3MgcmVuZGVyaW5nLlxuICAgKiBUaGlzIGlzIGEgY29udmVuaWVuY2UgbWV0aG9kIHRoYXQgc2V0cyB1cCB0cmlhbmdsZS1iYXNlZCBmdWxsLXNjcmVlbiByZW5kZXJpbmdcbiAgICogd2l0aCAzIHZlcnRpY2VzLCBjb21tb25seSB1c2VkIGZvciBwb3N0LXByb2Nlc3NpbmcgZWZmZWN0cy5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIHVzZSBmb3IgZnVsbC1zY3JlZW4gcmVuZGVyaW5nXG4gICAqL1xuICBzZXRCdWZmZXJMZXNzRnVsbFNjcmVlblJlbmRlcmluZyhtYXRlcmlhbDogTWF0ZXJpYWwpIHtcbiAgICB0aGlzLl9wcmltaXRpdmVNb2RlRm9yQnVmZmVyTGVzc1JlbmRlcmluZyA9IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzO1xuICAgIHRoaXMuX2RyYXdWZXJ0ZXhOdW1iZXJGb3JCdWZmZXJMZXNzUmVuZGVyaW5nID0gMztcbiAgICB0aGlzLl9fbWF0ZXJpYWwgPSBtYXRlcmlhbDtcblxuICAgIC8vIEVuc3VyZSB0aGlzIHJlbmRlciBwYXNzIGlzIHByb2Nlc3NlZCBvbiB0aGUgbmV4dCBmcmFtZVxuICAgIC8vIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlIHJlbmRlciBwYXNzIG1heSBoYXZlIGJlZW4gc2tpcHBlZCBwcmV2aW91c2x5XG4gICAgLy8gd2hlbiBpdCBoYWQgbm8gbWF0ZXJpYWwgb3IgcHJpbWl0aXZlcyB0byByZW5kZXJcbiAgICB0aGlzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY2xvbmUgb2YgdGhpcyByZW5kZXIgcGFzcy5cbiAgICogQWxsIHByb3BlcnRpZXMgYW5kIGNvbGxlY3Rpb25zIGFyZSBjb3BpZWQsIGNyZWF0aW5nIGFuIGluZGVwZW5kZW50IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBSZW5kZXJQYXNzIGluc3RhbmNlIHRoYXQgaXMgYSBjb3B5IG9mIHRoaXMgb25lXG4gICAqL1xuICBjbG9uZSgpIHtcbiAgICBjb25zdCByZW5kZXJQYXNzID0gbmV3IFJlbmRlclBhc3ModGhpcy5fX2VuZ2luZSk7XG4gICAgcmVuZGVyUGFzcy50cnlUb1NldFVuaXF1ZU5hbWUoYCR7dGhpcy51bmlxdWVOYW1lfV9jbG9uZWRgLCB0cnVlKTtcbiAgICByZW5kZXJQYXNzLl9fZW50aXRpZXMgPSB0aGlzLl9fZW50aXRpZXMuY29uY2F0KCk7XG4gICAgcmVuZGVyUGFzcy5fX3NjZW5lR3JhcGhEaXJlY3RseUFkZGVkID0gdGhpcy5fX3NjZW5lR3JhcGhEaXJlY3RseUFkZGVkLmNvbmNhdCgpO1xuICAgIHJlbmRlclBhc3MuX190b3BMZXZlbFNjZW5lR3JhcGhDb21wb25lbnRzID0gdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMuY29uY2F0KCk7XG4gICAgcmVuZGVyUGFzcy5fX21lc2hDb21wb25lbnRzID0gdGhpcy5fX21lc2hDb21wb25lbnRzLmNvbmNhdCgpO1xuICAgIHJlbmRlclBhc3MuX19vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cyA9IHRoaXMuX19vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cy5jb25jYXQoKTtcbiAgICByZW5kZXJQYXNzLl9fZnJhbWVCdWZmZXIgPSB0aGlzLl9fZnJhbWVCdWZmZXI7XG4gICAgcmVuZGVyUGFzcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlciA9IHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXI7XG4gICAgcmVuZGVyUGFzcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIgPSB0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyMjtcbiAgICByZW5kZXJQYXNzLl9fdmlld3BvcnQgPSB0aGlzLl9fdmlld3BvcnQ/LmNsb25lKCk7XG4gICAgcmVuZGVyUGFzcy50b0NsZWFyQ29sb3JCdWZmZXIgPSB0aGlzLnRvQ2xlYXJDb2xvckJ1ZmZlcjtcbiAgICByZW5kZXJQYXNzLnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IHRoaXMudG9DbGVhckRlcHRoQnVmZmVyO1xuICAgIHJlbmRlclBhc3MudG9DbGVhclN0ZW5jaWxCdWZmZXIgPSB0aGlzLnRvQ2xlYXJTdGVuY2lsQnVmZmVyO1xuICAgIHJlbmRlclBhc3MuaXNEZXB0aFRlc3QgPSB0aGlzLmlzRGVwdGhUZXN0O1xuICAgIHJlbmRlclBhc3MuY2xlYXJDb2xvciA9IHRoaXMuY2xlYXJDb2xvci5jbG9uZSgpO1xuICAgIHJlbmRlclBhc3MuY2xlYXJEZXB0aCA9IHRoaXMuY2xlYXJEZXB0aDtcbiAgICByZW5kZXJQYXNzLmNsZWFyU3RlbmNpbCA9IHRoaXMuY2xlYXJTdGVuY2lsO1xuICAgIHJlbmRlclBhc3MuY2FtZXJhQ29tcG9uZW50ID0gdGhpcy5jYW1lcmFDb21wb25lbnQ7XG4gICAgcmVuZGVyUGFzcy5fX21hdGVyaWFsID0gdGhpcy5fX21hdGVyaWFsO1xuICAgIHJlbmRlclBhc3MuX19wcmltaXRpdmVNYXRlcmlhbCA9IG5ldyBNYXAodGhpcy5fX3ByaW1pdGl2ZU1hdGVyaWFsKTtcbiAgICByZW5kZXJQYXNzLmlzVnJSZW5kZXJpbmcgPSB0aGlzLmlzVnJSZW5kZXJpbmc7XG4gICAgcmVuZGVyUGFzcy5pc091dHB1dEZvclZyID0gdGhpcy5pc091dHB1dEZvclZyO1xuICAgIHJlbmRlclBhc3MuX3RvUmVuZGVyT3BhcXVlUHJpbWl0aXZlcyA9IHRoaXMuX3RvUmVuZGVyT3BhcXVlUHJpbWl0aXZlcztcbiAgICByZW5kZXJQYXNzLl90b1JlbmRlclRyYW5zbHVjZW50UHJpbWl0aXZlcyA9IHRoaXMuX3RvUmVuZGVyVHJhbnNsdWNlbnRQcmltaXRpdmVzO1xuICAgIHJlbmRlclBhc3MuX3RvUmVuZGVyQmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcyA9IHRoaXMuX3RvUmVuZGVyQmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcztcbiAgICByZW5kZXJQYXNzLl9fcHJlRWFjaFJlbmRlckZ1bmMgPSB0aGlzLl9fcHJlRWFjaFJlbmRlckZ1bmM7XG4gICAgcmVuZGVyUGFzcy5fX3Bvc3RFYWNoUmVuZGVyRnVuYyA9IHRoaXMuX19wb3N0RWFjaFJlbmRlckZ1bmM7XG4gICAgcmVuZGVyUGFzcy5fX3JlbmRlclRhcmdldENvbG9yQXR0YWNobWVudHMgPSB0aGlzLl9fcmVuZGVyVGFyZ2V0Q29sb3JBdHRhY2htZW50cz8uY29uY2F0KCk7XG4gICAgcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4ID0gdGhpcy5fbGFzdE9wYXF1ZUluZGV4O1xuICAgIHJlbmRlclBhc3MuX2xhc3RUcmFuc2x1Y2VudEluZGV4ID0gdGhpcy5fbGFzdFRyYW5zbHVjZW50SW5kZXg7XG4gICAgcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4ID0gdGhpcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4O1xuICAgIHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleCA9IHRoaXMuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleDtcbiAgICByZW5kZXJQYXNzLl9sYXN0UHJpbWl0aXZlVWlkcyA9IHRoaXMuX2xhc3RQcmltaXRpdmVVaWRzLmNvbmNhdCgpO1xuICAgIHJlbmRlclBhc3MuX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSB0aGlzLl9sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50O1xuICAgIHJlbmRlclBhc3MuX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gdGhpcy5fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQ7XG4gICAgcmVuZGVyUGFzcy5fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQgPSB0aGlzLl9sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudDtcbiAgICByZW5kZXJQYXNzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZSA9IHRoaXMuX3JlbmRlcmVkU29tZXRoaW5nQmVmb3JlO1xuICAgIHJlbmRlclBhc3MuX2lzQ2hhbmdlZFNvcnRSZW5kZXJSZXN1bHQgPSB0aGlzLl9pc0NoYW5nZWRTb3J0UmVuZGVyUmVzdWx0O1xuXG4gICAgcmV0dXJuIHJlbmRlclBhc3M7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBiZWZvcmUgZWFjaCByZW5kZXIgb3BlcmF0aW9uLlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIGZvciBjdXN0b20gc2V0dXAgbG9naWMgYmVmb3JlIHJlbmRlcmluZyBiZWdpbnMuXG4gICAqXG4gICAqIEBwYXJhbSBmdW5jIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgYmVmb3JlIHJlbmRlcmluZ1xuICAgKi9cbiAgc2V0UHJlUmVuZGVyRnVuY3Rpb24oZnVuYzogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuX19wcmVFYWNoUmVuZGVyRnVuYyA9IGZ1bmM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhZnRlciBlYWNoIHJlbmRlciBvcGVyYXRpb24uXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgZm9yIGN1c3RvbSBjbGVhbnVwIGxvZ2ljIGFmdGVyIHJlbmRlcmluZyBjb21wbGV0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBmdW5jIC0gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgYWZ0ZXIgcmVuZGVyaW5nXG4gICAqL1xuICBzZXRQb3N0UmVuZGVyRnVuY3Rpb24oZnVuYzogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuX19wb3N0RWFjaFJlbmRlckZ1bmMgPSBmdW5jO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBwcmUtcmVuZGVyIGZ1bmN0aW9uIGlmIG9uZSBoYXMgYmVlbiBzZXQuXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBpbnRlcm5hbGx5IGJ5IHRoZSByZW5kZXJpbmcgc3lzdGVtLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGRvUHJlUmVuZGVyKCkge1xuICAgIGlmICh0aGlzLl9fcHJlRWFjaFJlbmRlckZ1bmMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3ByZUVhY2hSZW5kZXJGdW5jKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBwb3N0LXJlbmRlciBmdW5jdGlvbiBpZiBvbmUgaGFzIGJlZW4gc2V0LlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgaW50ZXJuYWxseSBieSB0aGUgcmVuZGVyaW5nIHN5c3RlbS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBkb1Bvc3RSZW5kZXIoKSB7XG4gICAgaWYgKHRoaXMuX19wb3N0RWFjaFJlbmRlckZ1bmMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3Bvc3RFYWNoUmVuZGVyRnVuYygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGVudGl0aWVzIHRvIGJlIHJlbmRlcmVkIGluIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAqIFRoZSBlbnRpdGllcyBhbmQgdGhlaXIgaGllcmFyY2hpZXMgYXJlIGZsYXR0ZW5lZCBhbmQgY29sbGVjdGVkIGZvciByZW5kZXJpbmcuXG4gICAqIER1cGxpY2F0ZSBlbnRpdGllcyBhcmUgYXV0b21hdGljYWxseSBlbGltaW5hdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZW50aXRpZXMgLSBBbiBhcnJheSBvZiBzY2VuZSBncmFwaCBlbnRpdGllcyB0byBhZGRcbiAgICovXG4gIGFkZEVudGl0aWVzKGVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdKSB7XG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgZW50aXRpZXMpIHtcbiAgICAgIC8vIERlZmVuc2l2ZTogZW50aXR5IGNhbiBiZSBtaXNzaW5nIGlmIGl0IGhhcyBiZWVuIGRlbGV0ZWQgYnV0IHN0aWxsIHJlZmVyZW5jZWQgc29tZXdoZXJlLlxuICAgICAgaWYgKGVudGl0eSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2NlbmVHcmFwaENvbXBvbmVudCA9IGVudGl0eS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICB0aGlzLl9fc2NlbmVHcmFwaERpcmVjdGx5QWRkZWQucHVzaChzY2VuZUdyYXBoQ29tcG9uZW50KTtcbiAgICAgIGNvbnN0IGNvbGxlY3RlZFNnQ29tcG9uZW50cyA9IGZsYXR0ZW5IaWVyYXJjaHkoc2NlbmVHcmFwaENvbXBvbmVudCwgZmFsc2UpO1xuICAgICAgLy8gTk9URTpcbiAgICAgIC8vIGBTY2VuZUdyYXBoQ29tcG9uZW50LmVudGl0eWAgaXMgdHlwZWQgYXMgYWx3YXlzIGV4aXN0aW5nLCBidXQgaXQgY2FuIGJlY29tZSBgdW5kZWZpbmVkYFxuICAgICAgLy8gYXQgcnVudGltZSB3aGVuIHRoZSBjb3JyZXNwb25kaW5nIGVudGl0eSBoYXMgYmVlbiBkZWxldGVkIGZyb20gYEVudGl0eVJlcG9zaXRvcnlgLlxuICAgICAgLy8gV2UgZmlsdGVyIG91dCBzdWNoIHN0YWxlIHJlZmVyZW5jZXMgdG8gYXZvaWQgY3Jhc2hpbmcgZHVyaW5nIHJlbmRlciBwYXNzIHNldHVwLlxuICAgICAgY29uc3QgY29sbGVjdGVkRW50aXRpZXMgPSBjb2xsZWN0ZWRTZ0NvbXBvbmVudHNcbiAgICAgICAgLm1hcCgoc2c6IFNjZW5lR3JhcGhDb21wb25lbnQpID0+IHNnLmVudGl0eSBhcyB1bmtub3duIGFzIElNZXNoRW50aXR5IHwgSVNjZW5lR3JhcGhFbnRpdHkgfCB1bmRlZmluZWQpXG4gICAgICAgIC5maWx0ZXIoKGUpOiBlIGlzIElNZXNoRW50aXR5IHwgSVNjZW5lR3JhcGhFbnRpdHkgPT4gZSAhPSBudWxsKTtcblxuICAgICAgLy8gRWxpbWluYXRlIGR1cGxpY2F0ZXNcbiAgICAgIGNvbnN0IG1hcDogTWFwPEVudGl0eVVJRCwgSU1lc2hFbnRpdHkgfCBJU2NlbmVHcmFwaEVudGl0eT4gPSB0aGlzLl9fZW50aXRpZXNcbiAgICAgICAgLmNvbmNhdChjb2xsZWN0ZWRFbnRpdGllcylcbiAgICAgICAgLnJlZHVjZSgobWFwOiBNYXA8RW50aXR5VUlELCBJTWVzaEVudGl0eSB8IElTY2VuZUdyYXBoRW50aXR5PiwgZW50aXR5OiBJTWVzaEVudGl0eSB8IElTY2VuZUdyYXBoRW50aXR5KSA9PiB7XG4gICAgICAgICAgbWFwLnNldChlbnRpdHkuZW50aXR5VUlELCBlbnRpdHkpO1xuICAgICAgICAgIHJldHVybiBtYXA7XG4gICAgICAgIH0sIG5ldyBNYXAoKSk7XG5cbiAgICAgIHRoaXMuX19lbnRpdGllcyA9IEFycmF5LmZyb20obWFwLnZhbHVlcygpKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fY2FsY01lc2hDb21wb25lbnRzKCk7XG4gICAgdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMgPSBbXTtcbiAgICB0aGlzLl9fY29sbGVjdFRvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNhbGN1bGF0ZXMgYW5kIHVwZGF0ZXMgdGhlIG1lc2ggY29tcG9uZW50cyBjb2xsZWN0aW9ucy5cbiAgICogVGhpcyBpbmNsdWRlcyBib3RoIHRoZSBjb21wbGV0ZSBsaXN0IGFuZCB0aGUgb3B0aW1pemVkIGxpc3QgYmFzZWQgb24gcmVuZGVyaW5nIGZsYWdzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNNZXNoQ29tcG9uZW50cygpIHtcbiAgICB0aGlzLl9fbWVzaENvbXBvbmVudHMgPSBbXTtcbiAgICB0aGlzLl9fb3B0aW1pemVkTWVzaENvbXBvbmVudHMgPSBbXTtcbiAgICB0aGlzLl9fY29sbGVjdE1lc2hDb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbGlzdCBvZiBhbGwgZW50aXRpZXMgaW4gdGhpcyByZW5kZXIgcGFzcy5cbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2Ygc2NlbmUgZ3JhcGggZW50aXRpZXNcbiAgICovXG4gIGdldCBlbnRpdGllcygpOiBJU2NlbmVHcmFwaEVudGl0eVtdIHtcbiAgICByZXR1cm4gdGhpcy5fX2VudGl0aWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGVudGl0aWVzIGZyb20gdGhpcyByZW5kZXIgcGFzcyBhbmQgY2xlYXJzIHJlbGF0ZWQgY29sbGVjdGlvbnMuXG4gICAqIFRoaXMgZWZmZWN0aXZlbHkgZW1wdGllcyB0aGUgcmVuZGVyIHBhc3Mgb2YgYWxsIHJlbmRlcmFibGUgY29udGVudC5cbiAgICovXG4gIGNsZWFyRW50aXRpZXMoKSB7XG4gICAgdGhpcy5fX21lc2hDb21wb25lbnRzID0gW107XG4gICAgdGhpcy5fX29wdGltaXplZE1lc2hDb21wb25lbnRzID0gW107XG4gICAgdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMgPSBbXTtcbiAgICB0aGlzLl9fZW50aXRpZXMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb2xsZWN0cyBhbmQgb3JnYW5pemVzIHRoZSB0b3AtbGV2ZWwgc2NlbmUgZ3JhcGggY29tcG9uZW50cy5cbiAgICogVGhpcyBtZXRob2QgdHJhdmVyc2VzIHRoZSBoaWVyYXJjaHkgdG8gZmluZCByb290LWxldmVsIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fY29sbGVjdFRvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMoKSB7XG4gICAgY29uc3QgZ29Ub1RvcExldmVsID0gKHNnOiBTY2VuZUdyYXBoQ29tcG9uZW50KSA9PiB7XG4gICAgICBpZiAoc2cucGFyZW50KSB7XG4gICAgICAgIGdvVG9Ub3BMZXZlbChzZy5wYXJlbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNnO1xuICAgIH07XG4gICAgdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMgPSB0aGlzLl9fc2NlbmVHcmFwaERpcmVjdGx5QWRkZWQubWFwKChzZzogU2NlbmVHcmFwaENvbXBvbmVudCkgPT4ge1xuICAgICAgcmV0dXJuIGdvVG9Ub3BMZXZlbChzZyk7XG4gICAgfSk7XG4gICAgY29uc3Qgc2V0ID0gbmV3IFNldCh0aGlzLl9fdG9wTGV2ZWxTY2VuZUdyYXBoQ29tcG9uZW50cyk7XG4gICAgdGhpcy5fX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMgPSBBcnJheS5mcm9tKHNldCk7XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdHMgbWVzaCBjb21wb25lbnRzIGZyb20gZW50aXRpZXMgYW5kIGNyZWF0ZXMgb3B0aW1pemVkIGNvbGxlY3Rpb25zLlxuICAgKiBUaGUgb3B0aW1pemVkIGNvbGxlY3Rpb24gZXhjbHVkZXMgY29tcG9uZW50cyBiYXNlZCBvbiByZW5kZXJpbmcgZmxhZ3MuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fY29sbGVjdE1lc2hDb21wb25lbnRzKCkge1xuICAgIHRoaXMuX19tZXNoQ29tcG9uZW50cyA9IFtdO1xuICAgIHRoaXMuX19vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cyA9IFtdO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHRoaXMuX19lbnRpdGllcykge1xuICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IGVudGl0eS5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChXZWxsS25vd25Db21wb25lbnRUSURzLk1lc2hDb21wb25lbnRUSUQpIGFzXG4gICAgICAgIHwgTWVzaENvbXBvbmVudFxuICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChtZXNoQ29tcG9uZW50ICE9IG51bGwgJiYgbWVzaENvbXBvbmVudC5tZXNoICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fX21lc2hDb21wb25lbnRzIS5wdXNoKG1lc2hDb21wb25lbnQpO1xuICAgICAgICBpZiAoIXRoaXMuX3RvUmVuZGVyT3BhcXVlUHJpbWl0aXZlcyAmJiBtZXNoQ29tcG9uZW50Lm1lc2guaXNFeGlzdE9wYXF1ZSgpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuX3RvUmVuZGVyVHJhbnNsdWNlbnRQcmltaXRpdmVzICYmIG1lc2hDb21wb25lbnQubWVzaC5pc0V4aXN0VHJhbnNsdWNlbnQoKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fdG9SZW5kZXJCbGVuZFdpdGhaV3JpdGVQcmltaXRpdmVzICYmIG1lc2hDb21wb25lbnQubWVzaC5pc0V4aXN0QmxlbmRXaXRoWldyaXRlKCkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX3RvUmVuZGVyQmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcyAmJiBtZXNoQ29tcG9uZW50Lm1lc2guaXNFeGlzdEJsZW5kV2l0aG91dFpXcml0ZSgpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX29wdGltaXplZE1lc2hDb21wb25lbnRzIS5wdXNoKG1lc2hDb21wb25lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCBtZXNoIGNvbXBvbmVudHMgZnJvbSBlbnRpdGllcyBpbiB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBUaGlzIGluY2x1ZGVzIGFsbCBtZXNoIGNvbXBvbmVudHMgcmVnYXJkbGVzcyBvZiByZW5kZXJpbmcgZmxhZ3MuXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGFsbCBtZXNoIGNvbXBvbmVudHNcbiAgICovXG4gIGdldCBtZXNoQ29tcG9uZW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5fX21lc2hDb21wb25lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9wdGltaXplZCBtZXNoIGNvbXBvbmVudHMgY29sbGVjdGlvbiBmb3IgcmVuZGVyaW5nLlxuICAgKiBUaGlzIGNvbGxlY3Rpb24gaXMgZmlsdGVyZWQgYmFzZWQgb24gdGhlIHJlbmRlcmluZyBmbGFncyBmb3IgZGlmZmVyZW50IHByaW1pdGl2ZSB0eXBlcy5cbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgbWVzaCBjb21wb25lbnRzIHRoYXQgc2hvdWxkIGJlIHJlbmRlcmVkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5fX29wdGltaXplZE1lc2hDb21wb25lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRvcC1sZXZlbCBzY2VuZSBncmFwaCBjb21wb25lbnRzIGluIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAqIFRoZXNlIGFyZSB0aGUgcm9vdCBjb21wb25lbnRzIG9mIHRoZSBzY2VuZSBncmFwaCBoaWVyYXJjaGllcy5cbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgdG9wLWxldmVsIHNjZW5lIGdyYXBoIGNvbXBvbmVudHNcbiAgICovXG4gIGdldCBzY2VuZVRvcExldmVsR3JhcGhDb21wb25lbnRzKCk6IFNjZW5lR3JhcGhDb21wb25lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX190b3BMZXZlbFNjZW5lR3JhcGhDb21wb25lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRhcmdldCBmcmFtZWJ1ZmZlciBmb3IgdGhpcyByZW5kZXIgcGFzcy5cbiAgICogSWYgbXVsdGlwbGUgcmVuZGVyIHBhc3NlcyBzaGFyZSBhIGZyYW1lYnVmZmVyLCB0aGV5IHdpbGwgcmVuZGVyIHRvIHRoZSBzYW1lIHRhcmdldC5cbiAgICogU2V0dGluZyBhIGZyYW1lYnVmZmVyIGF1dG9tYXRpY2FsbHkgY29uZmlndXJlcyB0aGUgdmlld3BvcnQgdG8gbWF0Y2ggdGhlIGZyYW1lYnVmZmVyIHNpemUuXG4gICAqXG4gICAqIEBwYXJhbSBmcmFtZWJ1ZmZlciAtIFRoZSBmcmFtZWJ1ZmZlciB0byByZW5kZXIgdG8sIG9yIHVuZGVmaW5lZCB0byByZW5kZXIgdG8gdGhlIGRlZmF1bHQgZnJhbWVidWZmZXJcbiAgICovXG4gIHNldEZyYW1lYnVmZmVyKGZyYW1lYnVmZmVyPzogRnJhbWVCdWZmZXIpIHtcbiAgICB0aGlzLl9fZnJhbWVCdWZmZXIgPSBmcmFtZWJ1ZmZlcjtcbiAgICBpZiAoZnJhbWVidWZmZXIgIT0gbnVsbCkge1xuICAgICAgdGhpcy5zZXRWaWV3cG9ydChWZWN0b3I0LmZyb21Db3B5QXJyYXkoWzAsIDAsIGZyYW1lYnVmZmVyLndpZHRoLCBmcmFtZWJ1ZmZlci5oZWlnaHRdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX192aWV3cG9ydCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29sb3IgYXR0YWNobWVudCB0YXJnZXRzIGZvciByZW5kZXJpbmcuXG4gICAqIFRoaXMgc3BlY2lmaWVzIHdoaWNoIGNvbG9yIGF0dGFjaG1lbnRzIG9mIHRoZSBmcmFtZWJ1ZmZlciBzaG91bGQgYmUgcmVuZGVyZWQgdG8uXG4gICAqXG4gICAqIEBwYXJhbSBpbmRlY2VzIC0gQXJyYXkgb2YgcmVuZGVyIGJ1ZmZlciB0YXJnZXQgZW51bXMsIG9yIHVuZGVmaW5lZCB0byB1c2UgZGVmYXVsdCB0YXJnZXRzXG4gICAqL1xuICBzZXRSZW5kZXJUYXJnZXRDb2xvckF0dGFjaG1lbnRzKGluZGVjZXM/OiBSZW5kZXJCdWZmZXJUYXJnZXRFbnVtW10pIHtcbiAgICB0aGlzLl9fcmVuZGVyVGFyZ2V0Q29sb3JBdHRhY2htZW50cyA9IGluZGVjZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCByZW5kZXIgdGFyZ2V0IGNvbG9yIGF0dGFjaG1lbnRzLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiByZW5kZXIgYnVmZmVyIHRhcmdldCBlbnVtcywgb3IgdW5kZWZpbmVkIGlmIHVzaW5nIGRlZmF1bHRzXG4gICAqL1xuICBnZXRSZW5kZXJUYXJnZXRDb2xvckF0dGFjaG1lbnRzKCk6IFJlbmRlckJ1ZmZlclRhcmdldEVudW1bXSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19yZW5kZXJUYXJnZXRDb2xvckF0dGFjaG1lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgZnJhbWVidWZmZXIgYXNzaWduZWQgdG8gdGhpcyByZW5kZXIgcGFzcy5cbiAgICogQHJldHVybnMgVGhlIGZyYW1lYnVmZmVyLCBvciB1bmRlZmluZWQgaWYgcmVuZGVyaW5nIHRvIHRoZSBkZWZhdWx0IGZyYW1lYnVmZmVyXG4gICAqL1xuICBnZXRGcmFtZWJ1ZmZlcigpOiBGcmFtZUJ1ZmZlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19mcmFtZUJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBjdXJyZW50IGZyYW1lYnVmZmVyIGFzc2lnbm1lbnQuXG4gICAqIEFmdGVyIGNhbGxpbmcgdGhpcywgdGhlIHJlbmRlciBwYXNzIHdpbGwgcmVuZGVyIHRvIHRoZSBkZWZhdWx0IGZyYW1lYnVmZmVyLlxuICAgKi9cbiAgcmVtb3ZlRnJhbWVidWZmZXIoKSB7XG4gICAgdGhpcy5fX2ZyYW1lQnVmZmVyID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpZXdwb3J0IGZvciB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBUaGUgdmlld3BvcnQgZGVmaW5lcyB0aGUgcmVjdGFuZ3VsYXIgYXJlYSBvZiB0aGUgZnJhbWVidWZmZXIgdGhhdCB3aWxsIGJlIHJlbmRlcmVkIHRvLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gQSBWZWN0b3I0IGNvbnRhaW5pbmcgKHgsIHksIHdpZHRoLCBoZWlnaHQpIG9mIHRoZSB2aWV3cG9ydFxuICAgKi9cbiAgc2V0Vmlld3BvcnQodmVjOiBJVmVjdG9yNCkge1xuICAgIGlmICh0aGlzLl9fdmlld3BvcnQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0LmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX192aWV3cG9ydCA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5QXJyYXkoW3ZlYy54LCB2ZWMueSwgdmVjLnosIHZlYy53XSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgdmlld3BvcnQgc2V0dGluZ3MuXG4gICAqIEByZXR1cm5zIEEgVmVjdG9yNCBjb250YWluaW5nICh4LCB5LCB3aWR0aCwgaGVpZ2h0KSBvZiB0aGUgdmlld3BvcnQsIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXRWaWV3cG9ydCgpIHtcbiAgICBsZXQgdmlld3BvcnQgPSB0aGlzLl9fdmlld3BvcnQ7XG4gICAgaWYgKHZpZXdwb3J0ICE9IG51bGwpIHtcbiAgICAgIHZpZXdwb3J0ID0gUmVuZGVyUGFzcy5fX3RtcF9WZWN0b3I0XzAuY29weUNvbXBvbmVudHModmlld3BvcnQpO1xuICAgIH1cblxuICAgIHJldHVybiB2aWV3cG9ydDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgc2Npc3NvciByZWN0YW5nbGUgdGhhdCBsaW1pdHMgcmVuZGVyaW5nIHRvIHRoZSBnaXZlbiBwaXhlbHMuXG4gICAqXG4gICAqIFRoZSByZWN0YW5nbGUgaXMgaW4gcmVuZGVyLXRhcmdldCBwaXhlbHMgd2l0aCBhIHRvcC1sZWZ0IG9yaWdpbi4gSXQgaXMgYVxuICAgKiBjdWxsaW5nIGhpbnQgKGZvciBleGFtcGxlLCB0aGUgc2NyZWVuIHByb2plY3Rpb24gb2YgYW4gU0RGJ3Mgd29ybGQgQUFCQiksIHNvXG4gICAqIGJhY2tlbmRzIHRoYXQgY2Fubm90IGFwcGx5IGl0IHNpbXBseSByZW5kZXIgdGhlIHdob2xlIHRhcmdldC5cbiAgICpcbiAgICogQHBhcmFtIHJlY3QgLSBUaGUgc2Npc3NvciByZWN0YW5nbGUsIG9yIHVuZGVmaW5lZCB0byByZW5kZXIgdGhlIHdob2xlIHRhcmdldFxuICAgKi9cbiAgc2V0U2Npc3NvclJlY3QocmVjdD86IFJlbmRlclBhc3NTY2lzc29yUmVjdCkge1xuICAgIGlmIChyZWN0ID09IG51bGwpIHtcbiAgICAgIHRoaXMuX19zY2lzc29yUmVjdCA9IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3NjaXNzb3JSZWN0ID0ge1xuICAgICAgeDogTWF0aC5mbG9vcihyZWN0LngpLFxuICAgICAgeTogTWF0aC5mbG9vcihyZWN0LnkpLFxuICAgICAgd2lkdGg6IE1hdGgubWF4KDAsIE1hdGguZmxvb3IocmVjdC53aWR0aCkpLFxuICAgICAgaGVpZ2h0OiBNYXRoLm1heCgwLCBNYXRoLmZsb29yKHJlY3QuaGVpZ2h0KSksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzY2lzc29yIHJlY3RhbmdsZSBvZiB0aGlzIHBhc3MuXG4gICAqIEByZXR1cm5zIFRoZSBzY2lzc29yIHJlY3RhbmdsZSwgb3IgdW5kZWZpbmVkIHdoZW4gdGhlIHdob2xlIHRhcmdldCBpcyByZW5kZXJlZFxuICAgKi9cbiAgZ2V0U2Npc3NvclJlY3QoKTogUmVuZGVyUGFzc1NjaXNzb3JSZWN0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3NjaXNzb3JSZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJlc29sdmUgZnJhbWVidWZmZXIgZm9yIG11bHRpc2FtcGxpbmcuXG4gICAqIFRoZSByZXNvbHZlIGZyYW1lYnVmZmVyIGlzIHVzZWQgYXMgdGhlIGRlc3RpbmF0aW9uIHdoZW4gcmVzb2x2aW5nIG11bHRpc2FtcGxlZCBjb250ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gZnJhbWVidWZmZXIgLSBUaGUgcmVzb2x2ZSBmcmFtZWJ1ZmZlciwgb3IgdW5kZWZpbmVkIHRvIGRpc2FibGUgcmVzb2x2aW5nXG4gICAqL1xuICBzZXRSZXNvbHZlRnJhbWVidWZmZXIoZnJhbWVidWZmZXI/OiBGcmFtZUJ1ZmZlcikge1xuICAgIHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIgPSBmcmFtZWJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHJlc29sdmUgZnJhbWVidWZmZXIuXG4gICAqIEByZXR1cm5zIFRoZSByZXNvbHZlIGZyYW1lYnVmZmVyLCBvciB1bmRlZmluZWQgaWYgbm90IHNldFxuICAgKi9cbiAgZ2V0UmVzb2x2ZUZyYW1lYnVmZmVyKCk6IEZyYW1lQnVmZmVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzZWNvbmRhcnkgcmVzb2x2ZSBmcmFtZWJ1ZmZlci5cbiAgICogVGhpcyBjYW4gYmUgdXNlZCBmb3IgYWRkaXRpb25hbCByZXNvbHZlIG9wZXJhdGlvbnMgb3IgbXVsdGktdGFyZ2V0IHJlc29sdmluZy5cbiAgICpcbiAgICogQHBhcmFtIGZyYW1lYnVmZmVyIC0gVGhlIHNlY29uZGFyeSByZXNvbHZlIGZyYW1lYnVmZmVyLCBvciB1bmRlZmluZWQgdG8gZGlzYWJsZVxuICAgKi9cbiAgc2V0UmVzb2x2ZUZyYW1lYnVmZmVyMihmcmFtZWJ1ZmZlcj86IEZyYW1lQnVmZmVyKSB7XG4gICAgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIgPSBmcmFtZWJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHNlY29uZGFyeSByZXNvbHZlIGZyYW1lYnVmZmVyLlxuICAgKiBAcmV0dXJucyBUaGUgc2Vjb25kYXJ5IHJlc29sdmUgZnJhbWVidWZmZXIsIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXRSZXNvbHZlRnJhbWVidWZmZXIyKCk6IEZyYW1lQnVmZmVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjI7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBtYWluIGZyYW1lYnVmZmVyIGNvbnRlbnQgdG8gYm90aCByZXNvbHZlIGZyYW1lYnVmZmVycyB1c2luZyBXZWJHTC5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyB0aGUgYmxpdCBvcGVyYXRpb25zIGZvciBtdWx0aXNhbXBsaW5nIHJlc29sdmUuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NvcHlGcmFtZWJ1ZmZlclRvUmVzb2x2ZUZyYW1lYnVmZmVyc1dlYkdMKCkge1xuICAgIHRoaXMuX19jb3B5RnJhbWVidWZmZXJUb1Jlc29sdmVGcmFtZWJ1ZmZlcklubmVyKHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIpO1xuICAgIHRoaXMuX19jb3B5RnJhbWVidWZmZXJUb1Jlc29sdmVGcmFtZWJ1ZmZlcklubmVyKHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBoZWxwZXIgbWV0aG9kIGZvciBjb3B5aW5nIGZyYW1lYnVmZmVyIGNvbnRlbnQgdG8gYSByZXNvbHZlIGZyYW1lYnVmZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gcmVzb2x2ZUZyYW1lQnVmZmVyIC0gVGhlIHRhcmdldCByZXNvbHZlIGZyYW1lYnVmZmVyXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fY29weUZyYW1lYnVmZmVyVG9SZXNvbHZlRnJhbWVidWZmZXJJbm5lcihyZXNvbHZlRnJhbWVCdWZmZXI/OiBGcmFtZUJ1ZmZlcikge1xuICAgIGlmIChyZXNvbHZlRnJhbWVCdWZmZXIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCByZXBvID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCB3ZWJHTFJlc291cmNlRnJhbWVCdWZmZXIgPSByZXBvLmdldFdlYkdMUmVzb3VyY2UodGhpcy5fX2ZyYW1lQnVmZmVyIS5jZ0FwaVJlc291cmNlVWlkKSBhcyBXZWJHTEZyYW1lYnVmZmVyO1xuICAgIGNvbnN0IHdlYkdMUmVzb3VyY2VSZXNvbHZlRnJhbWVidWZmZXIgPSByZXBvLmdldFdlYkdMUmVzb3VyY2UoXG4gICAgICByZXNvbHZlRnJhbWVCdWZmZXIhLmNnQXBpUmVzb3VyY2VVaWRcbiAgICApIGFzIFdlYkdMRnJhbWVidWZmZXI7XG5cbiAgICBpZiAod2ViR0xSZXNvdXJjZUZyYW1lQnVmZmVyID09IG51bGwgfHwgd2ViR0xSZXNvdXJjZVJlc29sdmVGcmFtZWJ1ZmZlciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2x3ID0gcmVwby5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlciE7XG4gICAgY29uc3QgZ2wgPSBnbHcuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLlJFQURfRlJBTUVCVUZGRVIsIHdlYkdMUmVzb3VyY2VGcmFtZUJ1ZmZlcik7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkRSQVdfRlJBTUVCVUZGRVIsIHdlYkdMUmVzb3VyY2VSZXNvbHZlRnJhbWVidWZmZXIpO1xuICAgIGdsLmJsaXRGcmFtZWJ1ZmZlcihcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgdGhpcy5fX2ZyYW1lQnVmZmVyIS53aWR0aCxcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlciEuaGVpZ2h0LFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICByZXNvbHZlRnJhbWVCdWZmZXIhLndpZHRoLFxuICAgICAgcmVzb2x2ZUZyYW1lQnVmZmVyIS5oZWlnaHQsXG4gICAgICBnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCxcbiAgICAgIGdsLk5FQVJFU1RcbiAgICApO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5SRUFEX0ZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRFJBV19GUkFNRUJVRkZFUiwgbnVsbCk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRleHR1cmUgZGF0YSBmcm9tIHRoZSBmaXJzdCByZXNvbHZlIGZyYW1lYnVmZmVyIHRvIHRoZSBzZWNvbmQgdXNpbmcgV2ViR1BVLlxuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHRleHR1cmUgY29weWluZyBvcGVyYXRpb25zIGZvciBXZWJHUFUtYmFzZWQgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb3B5UmVzb2x2ZTFUb1Jlc29sdmUyV2ViR3B1KCkge1xuICAgIGlmICh0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyID09IG51bGwgfHwgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIuY29sb3JBdHRhY2htZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyLmNvbG9yQXR0YWNobWVudHNbaV0gPT0gbnVsbCB8fFxuICAgICAgICB0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyMi5jb2xvckF0dGFjaG1lbnRzW2ldID09IG51bGwgfHxcbiAgICAgICAgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzW2ldLl90ZXh0dXJlUmVzb3VyY2VVaWQgPT09IC0xIHx8XG4gICAgICAgIHRoaXMuX19yZXNvbHZlRnJhbWVCdWZmZXIyLmNvbG9yQXR0YWNobWVudHNbaV0uX3RleHR1cmVSZXNvdXJjZVVpZCA9PT0gLTFcbiAgICAgICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gaWYgKFxuICAgICAgLy8gICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuaXNNaXBwbWFwcGVkVGV4dHVyZShcbiAgICAgIC8vICAgICB0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyMi5jb2xvckF0dGFjaG1lbnRzW2ldLl90ZXh0dXJlUmVzb3VyY2VVaWRcbiAgICAgIC8vICAgKVxuICAgICAgLy8gKSB7XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY29weVRleHR1cmVEYXRhKFxuICAgICAgICB0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyLmNvbG9yQXR0YWNobWVudHNbaV0uX3RleHR1cmVSZXNvdXJjZVVpZCxcbiAgICAgICAgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIuY29sb3JBdHRhY2htZW50c1tpXS5fdGV4dHVyZVJlc291cmNlVWlkXG4gICAgICApO1xuICAgICAgLy8gfSBlbHNlIHtcbiAgICAgIC8vICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVRleHR1cmUoXG4gICAgICAvLyAgICAgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIuY29sb3JBdHRhY2htZW50c1tpXS5fdGV4dHVyZVJlc291cmNlVWlkXG4gICAgICAvLyAgICk7XG4gICAgICAvLyAgIFtcbiAgICAgIC8vICAgICB0aGlzLl9fcmVzb2x2ZUZyYW1lQnVmZmVyMi5jb2xvckF0dGFjaG1lbnRzW2ldLl90ZXh0dXJlUmVzb3VyY2VVaWQsXG4gICAgICAvLyAgICAgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlcjIuY29sb3JBdHRhY2htZW50c1tpXS5fdGV4dHVyZVZpZXdSZXNvdXJjZVVpZCxcbiAgICAgIC8vICAgXSA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kdXBsaWNhdGVUZXh0dXJlQXNNaXBtYXBwZWQoXG4gICAgICAvLyAgICAgdGhpcy5fX3Jlc29sdmVGcmFtZUJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzW2ldLl90ZXh0dXJlUmVzb3VyY2VVaWRcbiAgICAgIC8vICAgKTtcbiAgICAgIC8vIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXNzb2NpYXRlcyBhIHNwZWNpZmljIG1hdGVyaWFsIHdpdGggYSBwcmltaXRpdmUgZm9yIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAqIFdoZW4gcmVuZGVyaW5nIHRoZSBzcGVjaWZpZWQgcHJpbWl0aXZlLCB0aGUgcmVuZGVyIHBhc3Mgd2lsbCB1c2UgdGhpcyBtYXRlcmlhbFxuICAgKiBpbnN0ZWFkIG9mIHRoZSBwcmltaXRpdmUncyBkZWZhdWx0IG1hdGVyaWFsLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gdXNlIGZvciB0aGUgcHJpbWl0aXZlXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgdGFyZ2V0IHByaW1pdGl2ZSB0byBvdmVycmlkZSB0aGUgbWF0ZXJpYWwgZm9yXG4gICAqL1xuICBzZXRNYXRlcmlhbEZvclByaW1pdGl2ZShtYXRlcmlhbDogTWF0ZXJpYWwsIHByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gICAgdGhpcy5fX3ByaW1pdGl2ZU1hdGVyaWFsLnNldChwcmltaXRpdmUub2JqZWN0VUlELCBuZXcgV2Vha1JlZihtYXRlcmlhbCkpO1xuXG4gICAgLy8gdGhpcy5fX3NldHVwTWF0ZXJpYWwobWF0ZXJpYWwsIHByaW1pdGl2ZSk7c1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBkZWZhdWx0IG1hdGVyaWFsIGZvciBhbGwgcHJpbWl0aXZlcyBpbiB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBUaGlzIG1hdGVyaWFsIHdpbGwgYmUgdXNlZCBmb3IgYW55IHByaW1pdGl2ZSB0aGF0IGRvZXNuJ3QgaGF2ZSBhIHNwZWNpZmljXG4gICAqIG1hdGVyaWFsIG92ZXJyaWRlIHNldCB2aWEgc2V0TWF0ZXJpYWxGb3JQcmltaXRpdmUoKS5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIGRlZmF1bHQgbWF0ZXJpYWwgdG8gdXNlIGZvciBhbGwgcHJpbWl0aXZlc1xuICAgKi9cbiAgc2V0TWF0ZXJpYWwobWF0ZXJpYWw6IE1hdGVyaWFsKSB7XG4gICAgdGhpcy5fX21hdGVyaWFsID0gbWF0ZXJpYWw7XG5cbiAgICAvLyB0aGlzLl9fc2V0dXBNYXRlcmlhbChtYXRlcmlhbCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCBtYXRlcmlhbCBhc3NpZ25lZCB0byB0aGlzIHJlbmRlciBwYXNzLlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCBtYXRlcmlhbCwgb3IgdW5kZWZpbmVkIGlmIG5vbmUgaXMgc2V0XG4gICAqL1xuICBnZXQgbWF0ZXJpYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXRlcmlhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzcGVjaWZpYyBtYXRlcmlhbCBhc3NpZ25lZCB0byBhIHByaW1pdGl2ZSwgaWYgYW55LlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0byBnZXQgdGhlIG1hdGVyaWFsIGZvclxuICAgKiBAcmV0dXJucyBUaGUgbWF0ZXJpYWwgYXNzaWduZWQgdG8gdGhlIHByaW1pdGl2ZSwgb3IgdW5kZWZpbmVkIGlmIG5vbmUgaXMgc2V0XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldE1hdGVyaWFsT2YocHJpbWl0aXZlOiBQcmltaXRpdmUpIHtcbiAgICByZXR1cm4gdGhpcy5fX3ByaW1pdGl2ZU1hdGVyaWFsLmdldChwcmltaXRpdmUub2JqZWN0VUlEKT8uZGVyZWYoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBhcHByb3ByaWF0ZSBtYXRlcmlhbCB0byB1c2UgZm9yIHJlbmRlcmluZyBhIHByaW1pdGl2ZS5cbiAgICogVGhlIHByaW9yaXR5IG9yZGVyIGlzOlxuICAgKiAxLiBQcmltaXRpdmUtc3BlY2lmaWMgbWF0ZXJpYWwgKHNldCB2aWEgc2V0TWF0ZXJpYWxGb3JQcmltaXRpdmUpXG4gICAqIDIuIFJlbmRlciBwYXNzIGRlZmF1bHQgbWF0ZXJpYWwgKHNldCB2aWEgc2V0TWF0ZXJpYWwpXG4gICAqIDMuIFByaW1pdGl2ZSdzIG93biBtYXRlcmlhbFxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0byBnZXQgdGhlIG1hdGVyaWFsIGZvclxuICAgKiBAcmV0dXJucyBUaGUgbWF0ZXJpYWwgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgcmVuZGVyaW5nIHRoZSBwcmltaXRpdmVcbiAgICovXG4gIGdldEFwcHJvcHJpYXRlTWF0ZXJpYWwocHJpbWl0aXZlOiBQcmltaXRpdmUpOiBNYXRlcmlhbCB7XG4gICAgLy8gTW9zdCBwYXNzZXMgaGF2ZSBubyBwZXItcHJpbWl0aXZlIG92ZXJyaWRlczsgc2tpcCB0aGUgbWFwIGxvb2t1cCBpbiB0aGF0IGNvbW1vbiBjYXNlLlxuICAgIGxldCBtYXRlcmlhbCA9IHRoaXMuX19wcmltaXRpdmVNYXRlcmlhbC5zaXplICE9PSAwID8gdGhpcy5fZ2V0TWF0ZXJpYWxPZihwcmltaXRpdmUpIDogdW5kZWZpbmVkO1xuXG4gICAgaWYgKG1hdGVyaWFsICE9IG51bGwpIHtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX19tYXRlcmlhbCAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbCA9IHRoaXMuX19tYXRlcmlhbDtcbiAgICB9IGVsc2Uge1xuICAgICAgbWF0ZXJpYWwgPSBwcmltaXRpdmUubWF0ZXJpYWw7XG4gICAgfVxuICAgIHJldHVybiBtYXRlcmlhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZW5kZXIgcGFzcy5cbiAgICogQHJldHVybnMgVGhlIHJlbmRlciBwYXNzIFVJRFxuICAgKi9cbiAgZ2V0IHJlbmRlclBhc3NVSUQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19yZW5kZXJQYXNzVUlEO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBSUEsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyw4QkFBOEI7QUFDdkMsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxxQkFBNkM7QUFFdEQsU0FBUyxpQkFBaUI7QUFJMUIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxlQUFlO0FBZ0NqQixJQUFNLGNBQU4sTUFBTSxvQkFBbUIsU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFxSHZDLFlBQVksUUFBZ0I7QUFDMUIsVUFBTTtBQW5IUixTQUFRQSxLQUFrRCxDQUFDO0FBQzNELFNBQVFD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QixVQUFvQixXQUFzQjtBQUNoRSxTQUFLUixHQUFvQixJQUFJLFVBQVUsV0FBVyxJQUFJLFFBQVEsUUFBUSxDQUFDO0FBQUEsRUFHekU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsWUFBWSxVQUFvQjtBQUM5QixTQUFLSyxLQUFhO0FBQUEsRUFHcEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxXQUFXO0FBQ2IsV0FBTyxLQUFLQTtBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsZUFBZSxXQUFzQjtBQWx4QnZDO0FBbXhCSSxZQUFPLFVBQUtMLEdBQW9CLElBQUksVUFBVSxTQUFTLE1BQWhELG1CQUFtRDtBQUFBLEVBQzVEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLHVCQUF1QixXQUFnQztBQUVyRCxRQUFJLFdBQVcsS0FBS0EsR0FBb0IsU0FBUyxJQUFJLEtBQUssZUFBZSxTQUFTLElBQUk7QUFFdEYsUUFBSSxZQUFZLE1BQU07QUFBQSxJQUN0QixXQUFXLEtBQUtLLE1BQWMsTUFBTTtBQUNsQyxpQkFBVyxLQUFLQTtBQUFBLElBQ2xCLE9BQU87QUFDTCxpQkFBVyxVQUFVO0FBQUEsSUFDdkI7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLGdCQUFnQjtBQUNsQixXQUFPLEtBQUtIO0FBQUEsRUFDZDtBQUNGO0FBQUE7QUF0d0JhLFlBNEdJZSxLQUFrQixlQUFlLEtBQUs7QUFBQTtBQTVHMUMsWUErR0dkLEtBQW1CO0FBL0c1QixJQUFNLGFBQU47IiwKICAibmFtZXMiOiBbIl9fZW50aXRpZXMiLCAiX19zY2VuZUdyYXBoRGlyZWN0bHlBZGRlZCIsICJfX3RvcExldmVsU2NlbmVHcmFwaENvbXBvbmVudHMiLCAiX19tZXNoQ29tcG9uZW50cyIsICJfX29wdGltaXplZE1lc2hDb21wb25lbnRzIiwgIl9fcHJpbWl0aXZlTWF0ZXJpYWwiLCAiX19lbmdpbmUiLCAiX19yZW5kZXJQYXNzVUlEIiwgIl9fbWVzaF91aWRfY291bnQiLCAiX19jYWxjTWVzaENvbXBvbmVudHMiLCAiX19tYXRlcmlhbCIsICJfX2ZyYW1lQnVmZmVyIiwgIl9fcmVzb2x2ZUZyYW1lQnVmZmVyIiwgIl9fcmVzb2x2ZUZyYW1lQnVmZmVyMiIsICJfX3ZpZXdwb3J0IiwgIl9fcHJlRWFjaFJlbmRlckZ1bmMiLCAiX19wb3N0RWFjaFJlbmRlckZ1bmMiLCAiX19yZW5kZXJUYXJnZXRDb2xvckF0dGFjaG1lbnRzIiwgIm1hcCIsICJlbnRpdHkiLCAiX19jb2xsZWN0VG9wTGV2ZWxTY2VuZUdyYXBoQ29tcG9uZW50cyIsICJfX2NvbGxlY3RNZXNoQ29tcG9uZW50cyIsICJfX3RtcF9WZWN0b3I0XzAiLCAiX19zY2lzc29yUmVjdCIsICJfX2NvcHlGcmFtZWJ1ZmZlclRvUmVzb2x2ZUZyYW1lYnVmZmVySW5uZXIiXQp9Cg==
