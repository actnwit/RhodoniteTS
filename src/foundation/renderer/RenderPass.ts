import { RnObject } from '../core/RnObject';
import { IEntity } from '../core/Entity';
import { FrameBuffer } from './FrameBuffer';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { Vector4 } from '../math/Vector4';
import { EntityUID, RenderPassUID } from '../../types/CommonTypes';
import { Material } from '../materials/core/Material';
import { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import { Primitive } from '../geometry/Primitive';
import { MutableVector4 } from '../math/MutableVector4';
import { IVector4 } from '../math/IVector';
import { ISceneGraphEntity, IMeshEntity } from '../helpers/EntityHelper';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { RenderBufferTargetEnum } from '../definitions/RenderBufferTarget';
import { PrimitiveMode, PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import { CGAPIResourceRepository } from './CGAPIResourceRepository';

/**
 * A render pass is a collection of the resources which is used in rendering process.
 */
export class RenderPass extends RnObject {
  private readonly __renderPassUID: RenderPassUID;
  private __entities: (IMeshEntity | ISceneGraphEntity)[] = [];
  private __sceneGraphDirectlyAdded: SceneGraphComponent[] = [];
  private __topLevelSceneGraphComponents?: SceneGraphComponent[] = [];
  private __meshComponents?: MeshComponent[];
  private __frameBuffer?: FrameBuffer;
  private __resolveFrameBuffer?: FrameBuffer;
  private __resolveFrameBuffer2?: FrameBuffer;
  private __viewport?: MutableVector4;
  private __material?: Material;
  private __primitiveMaterial: Map<Primitive, Material> = new Map();

  // Public RenderPass Settings
  public toClearColorBuffer = false;
  public toClearDepthBuffer = true;
  public toClearStencilBuffer = false;
  public isDepthTest = true;
  public clearColor = Vector4.fromCopyArray([1, 1, 1, 1]);
  public clearDepth = 1;
  public clearStencil = 0;
  public cameraComponent?: CameraComponent;

  /*＊
   * If this value is greater than 1, buffer-less rendering is performed with the specified number of vertices.
   * In this case, registered Entities are ignored and they are not rendered.
   */
  public _drawVertexNumberForBufferLessRendering = 0;
  public _primitiveModeForBufferLessRendering = PrimitiveMode.Triangles;
  public _dummyPrimitiveForBufferLessRendering: Primitive = new Primitive();

  // VR
  public isVrRendering = true;
  public isOutputForVr = false;

  // Internal use
  public _lastOpaqueIndex = -1;
  public _lastTransparentIndex = -1;
  public _firstTransparentSortKey = -1;
  public _lastTransparentSortKey = -1;
  public _lastPrimitiveUids: number[] = [];
  public _lastTransformComponentsUpdateCount = -1;
  public _lastCameraControllerComponentsUpdateCount = -1;
  public _lastSceneGraphComponentsUpdateCount = -1;
  public _renderedSomethingBefore = true;
  public _isChangedSortRenderResult = false;

  /** Whether or not to draw opaque primitives contained in this render pass. */
  public _toRenderOpaquePrimitives = true;

  /** Whether or not to draw transparent primitives contained in this render pass. */
  public _toRenderTransparentPrimitives = true;

  public toRenderEffekseerEffects = false;
  public __renderTargetColorAttachments?: RenderBufferTargetEnum[];
  private __postEachRenderFunc?: () => void;
  private static __tmp_Vector4_0 = MutableVector4.zero();

  public static __mesh_uid_count = -1;

  constructor() {
    super();
    this.__renderPassUID = ++RenderPass.__mesh_uid_count;
  }

  setToRenderOpaquePrimitives(toRender: boolean) {
    this._toRenderOpaquePrimitives = toRender;
    this.__calcMeshComponents();
  }

  setToRenderTransparentPrimitives(toRender: boolean) {
    this._toRenderTransparentPrimitives = toRender;
    this.__calcMeshComponents();
  }

  isBufferLessRenderingMode() {
    return this._drawVertexNumberForBufferLessRendering > 0;
  }

  /**
   * @brief Set this render pass to buffer-less rendering mode.
   * When this function is called, buffer-less rendering is performed only once with the specified number of vertices.
   * This is useful for e.g. full-screen drawing.
   * In this case, even if Entities are registered using the addEntities method, they will be ignored and will not be rendered.
   * @param primitiveMode The primitive mode to be used in buffer-less rendering.
   * @param drawVertexNumberWithoutEntities The number of vertices to be rendered in buffer-less rendering.
   * @param material The material to be used in buffer-less rendering.
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
   * @brief Set this render pass to buffer-less rendering mode.
   * When this function is called, buffer-less rendering is performed only once with the specified number of vertices.
   * This is useful for e.g. full-screen drawing.
   * In this case, even if Entities are registered using the addEntities method, they will be ignored and will not be rendered.
   * @param material The material to be used in buffer-less rendering.
   */
  setBufferLessFullScreenRendering(material: Material) {
    this._primitiveModeForBufferLessRendering = PrimitiveMode.Triangles;
    this._drawVertexNumberForBufferLessRendering = 3;
    this.__material = material;
  }

  clone() {
    const renderPass = new RenderPass();
    renderPass.__entities = this.__entities.concat();
    renderPass.__sceneGraphDirectlyAdded = this.__sceneGraphDirectlyAdded.concat();
    renderPass.__topLevelSceneGraphComponents = this.__topLevelSceneGraphComponents?.concat();
    renderPass.__meshComponents = this.__meshComponents?.concat();
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
    renderPass._toRenderTransparentPrimitives = this._toRenderTransparentPrimitives;
    renderPass.__postEachRenderFunc = this.__postEachRenderFunc;
    renderPass.__renderTargetColorAttachments = this.__renderTargetColorAttachments?.concat();

    return renderPass;
  }

  setPostRenderFunction(func: () => void) {
    this.__postEachRenderFunc = func;
  }

  doPostRender() {
    if (this.__postEachRenderFunc != null) {
      this.__postEachRenderFunc();
    }
  }

  /**
   * Add entities to draw.
   * @param entities An array of entities.
   */
  addEntities(entities: (IMeshEntity | ISceneGraphEntity)[]) {
    for (const entity of entities) {
      const sceneGraphComponent = entity.getSceneGraph();
      this.__sceneGraphDirectlyAdded.push(sceneGraphComponent);
      const collectedSgComponents = SceneGraphComponent.flattenHierarchy(
        sceneGraphComponent,
        false
      );
      const collectedEntities = collectedSgComponents.map((sg: SceneGraphComponent) => {
        return sg.entity;
      });

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

    this.__calcMeshComponents();
    this.__topLevelSceneGraphComponents = void 0;
    this.__collectTopLevelSceneGraphComponents();
  }

  private __calcMeshComponents() {
    this.__meshComponents = void 0;
    this.__collectMeshComponents();
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
      this.__entities.filter((entity) => {
        const meshComponent = entity.getComponentByComponentTID(
          WellKnownComponentTIDs.MeshComponentTID
        ) as MeshComponent | undefined;
        if (meshComponent != null && meshComponent.mesh != null) {
          if (!this._toRenderOpaquePrimitives && meshComponent.mesh.isOpaque()) {
            return;
          }
          if (!this._toRenderTransparentPrimitives && meshComponent.mesh.isAllBlend()) {
            return;
          }
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
    return this.__meshComponents ?? [];
  }

  /**
   * Get all the highest level SceneGraphComponents list of the entities on this render pass.
   * @return An array of SceneGraphComponents
   */
  get sceneTopLevelGraphComponents(): SceneGraphComponent[] {
    return this.__topLevelSceneGraphComponents != null ? this.__topLevelSceneGraphComponents : [];
  }

  /**
   * Sets the target framebuffer of this render pass.
   * If two or more render pass share a framebuffer, Rhodonite renders entities to the same framebuffer in those render passes.
   * @param framebuffer A framebuffer
   */
  setFramebuffer(framebuffer: FrameBuffer) {
    this.__frameBuffer = framebuffer;
    if (framebuffer != null) {
      this.setViewport(Vector4.fromCopyArray([0, 0, framebuffer.width, framebuffer.height]));
    } else {
      this.__viewport = undefined;
    }
  }

  setRenderTargetColorAttachments(indeces?: RenderBufferTargetEnum[]) {
    this.__renderTargetColorAttachments = indeces;
  }

  getRenderTargetColorAttachments(): RenderBufferTargetEnum[] | undefined {
    return this.__renderTargetColorAttachments;
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
      this.__viewport = MutableVector4.fromCopyArray([vec.x, vec.y, vec.z, vec.w]);
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
    this.__resolveFrameBuffer = framebuffer;
  }

  getResolveFramebuffer(): FrameBuffer | undefined {
    return this.__resolveFrameBuffer;
  }

  setResolveFramebuffer2(framebuffer: FrameBuffer) {
    this.__resolveFrameBuffer2 = framebuffer;
  }

  getResolveFramebuffer2(): FrameBuffer | undefined {
    return this.__resolveFrameBuffer2;
  }

  _copyFramebufferToResolveFramebuffersWebGL() {
    this.__copyFramebufferToResolveFramebufferInner(this.__resolveFrameBuffer);
    this.__copyFramebufferToResolveFramebufferInner(this.__resolveFrameBuffer2);
  }

  private __copyFramebufferToResolveFramebufferInner(resolveFrameBuffer?: FrameBuffer) {
    if (resolveFrameBuffer == null) {
      return;
    }
    const repo = WebGLResourceRepository.getInstance();
    const webGLResourceFrameBuffer = repo.getWebGLResource(
      this.__frameBuffer!.cgApiResourceUid
    ) as WebGLFramebuffer;
    const webGLResourceResolveFramebuffer = repo.getWebGLResource(
      resolveFrameBuffer!.cgApiResourceUid
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
      resolveFrameBuffer!.width,
      resolveFrameBuffer!.height,
      gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
      gl.NEAREST
    );
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }

  _copyResolve1ToResolve2WebGpu() {
    if (this.__resolveFrameBuffer == null || this.__resolveFrameBuffer2 == null) {
      return;
    }
    const webGpuResourceRepository = CGAPIResourceRepository.getWebGpuResourceRepository();
    for (let i = 0; i < this.__resolveFrameBuffer.colorAttachments.length; i++) {
      if (
        this.__resolveFrameBuffer.colorAttachments[i] == null ||
        this.__resolveFrameBuffer2.colorAttachments[i] == null
      ) {
        continue;
      }

      if (
        webGpuResourceRepository.isMippmappedTexture(
          this.__resolveFrameBuffer2.colorAttachments[i]._textureResourceUid
        )
      ) {
        webGpuResourceRepository.copyTextureData(
          this.__resolveFrameBuffer.colorAttachments[i]._textureResourceUid,
          this.__resolveFrameBuffer2.colorAttachments[i]._textureResourceUid
        );
      } else {
        webGpuResourceRepository.deleteTexture(
          this.__resolveFrameBuffer2.colorAttachments[i]._textureResourceUid
        );
        [
          this.__resolveFrameBuffer2.colorAttachments[i]._textureResourceUid,
          this.__resolveFrameBuffer2.colorAttachments[i]._textureViewResourceUid,
        ] = webGpuResourceRepository.duplicateTextureAsMipmapped(
          this.__resolveFrameBuffer.colorAttachments[i]._textureResourceUid
        );
      }
    }
  }

  /**
   * Sets a material for the primitive on this render pass.
   * If Rhodonite draw the primitive using this render pass, Rhodonite uses this material instead of the material on the primitive.
   * @param material A material attaching to the primitive
   * @param primitive A target primitive
   */
  setMaterialForPrimitive(material: Material, primitive: Primitive) {
    this.__primitiveMaterial.set(primitive, material);

    // this.__setupMaterial(material, primitive);s
  }

  /**
   * Sets a material for all the primitive on this render pass.
   * For all the primitive, Rhodonite uses this material instead of the material on the primitive.
   * Where if this render pass has a map between primitive and material by setMaterialForPrimitive, Rhodonite uses the material mapped by primitive.
   * @param material A material attaching to the primitive
   */
  setMaterial(material: Material) {
    this.__material = material;

    // this.__setupMaterial(material);
  }

  get material() {
    return this.__material;
  }

  _getMaterialOf(primitive: Primitive) {
    return this.__primitiveMaterial.get(primitive);
  }

  private __hasMaterialOf(primitive: Primitive) {
    return this.__primitiveMaterial.has(primitive);
  }

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

  get renderPassUID() {
    return this.__renderPassUID;
  }
}
