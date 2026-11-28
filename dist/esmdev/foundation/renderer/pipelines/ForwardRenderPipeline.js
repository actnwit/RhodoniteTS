// src/foundation/renderer/pipelines/ForwardRenderPipeline.ts
import { CameraComponent } from "../../components/Camera/CameraComponent.js";
import { RaymarchingComponent } from "../../components/Raymarching/RaymarchingComponent.js";
import { RnObject } from "../../core/RnObject.js";
import {
  ComponentType,
  CompositionType,
  PixelFormat,
  ToneMappingType
} from "../../definitions/index.js";
import { ShaderSemantics } from "../../definitions/ShaderSemantics.js";
import { TextureFormat } from "../../definitions/TextureFormat.js";
import { TextureParameter } from "../../definitions/TextureParameter.js";
import { Bloom } from "../../helpers/BloomHelper.js";
import {
  collectRrnJson,
  createNodeBasedRaymarchingComponentShadowMaterial,
  createNodeBasedRaymarchingShadowMaterial,
  RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC
} from "../../helpers/materials/createNodeBasedRaymarchingMaterials.js";
import { createToneMappingMaterial } from "../../helpers/materials/createToneMappingMaterial.js";
import { RenderableHelper } from "../../helpers/RenderableHelper.js";
import { RenderPassHelper } from "../../helpers/RenderPassHelper.js";
import {
  ShadowSystem
} from "../../helpers/Shadow/ShadowSystem.js";
import { Scalar } from "../../math/Scalar.js";
import { Vector2 } from "../../math/Vector2.js";
import { Vector3 } from "../../math/Vector3.js";
import { Vector4 } from "../../math/Vector4.js";
import { MiscUtil } from "../../misc/index.js";
import { Is } from "../../misc/Is.js";
import { Logger } from "../../misc/Logger.js";
import { Err, Ok } from "../../misc/Result.js";
import { Sampler } from "../../textures/Sampler.js";
import { Expression } from "../Expression.js";
import { Frame } from "../Frame.js";
import { RenderPass } from "../RenderPass.js";
import { _getTemporalAACamera, TemporalAASystem } from "../TemporalAA/TemporalAASystem.js";
var RAYMARCHING_UNBOUNDED_AABB_MIN = Object.freeze(Vector3.fromCopy3(-1e20, -1e20, -1e20));
var RAYMARCHING_UNBOUNDED_AABB_MAX = Object.freeze(Vector3.fromCopy3(1e20, 1e20, 1e20));
var ForwardRenderPipeline = class extends RnObject {
  constructor(engine) {
    super();
    this.km = 0;
    this.iy = 0;
    this._z = false;
    this.gz = false;
    this.cz = false;
    this.Pz = false;
    this.$z = 1024;
    /** main expressions */
    this.ni = [];
    this.Cz = new Expression();
    this.sz = [];
    this.Sz = 0;
    this.Tz = 1;
    this.Uz = 1;
    this.Vz = /* @__PURE__ */ new Map();
    /** Per-component raymarching materials and their buffer-less full-screen passes. */
    this.dz = /* @__PURE__ */ new Map();
    this.tz = /* @__PURE__ */ new Map();
    /** SID of the first per-component pass (it applies the per-frame shared material setup). */
    this.Wz = -1;
    /** Cached world AABBs of the SDFs, used for ray interval clipping and scissors. */
    this.Jz = /* @__PURE__ */ new Map();
    this.cA = ToneMappingType.GT_ToneMap;
    this.Yz = [];
    this.dA = [];
    /** Point light paraboloid shadow materials, one front/back pair per shadow slot. */
    this.wz = /* @__PURE__ */ new Map();
    /** Whether the SDF shadow casters are split per component (mirrors the visible materials). */
    this.xz = false;
    /** Per-component regular (spot / directional) SDF shadow caster materials. */
    this.nz = /* @__PURE__ */ new Map();
    /** Per shadow slot, per component paraboloid front/back SDF shadow caster materials. */
    this.yz = /* @__PURE__ */ new Map();
    this.c = engine;
    this.Xz = new Bloom(engine);
  }
  /**
   * Destroys all allocated 3D API resources including frame buffers and textures.
   *
   * @remarks
   * This method is called internally during resize operations and cleanup.
   * It ensures proper resource management by releasing GPU memory.
   *
   * @internal
   */
  mA() {
    if (this.ez != null) {
      this.ez.destroy3DAPIResources();
      this.ez = void 0;
    }
    if (this.mz != null) {
      this.mz.destroy3DAPIResources();
      this.mz = void 0;
    }
    if (this.jz != null) {
      this.jz.destroy3DAPIResources();
      this.jz = void 0;
    }
    if (this.iz != null) {
      this.iz.destroy3DAPIResources();
      this.iz = void 0;
    }
    if (this.fz != null) {
      this.fz.destroy3DAPIResources();
      this.fz = void 0;
    }
    this.Xz.destroy3DAPIResources();
    if (this.bz != null) {
      this.bz.destroy3DAPIResources();
      this.bz = void 0;
    }
    this.hz = void 0;
    this.Dz = void 0;
    this.Ez = void 0;
    this.Fz = void 0;
    this.Az = void 0;
    this.rz = void 0;
    this.vz = void 0;
    this.lz = void 0;
    this.wz.clear();
    this.xz = false;
    this.nz.clear();
    this.yz.clear();
    this.tz.clear();
    this.Jz.clear();
    this.Vz.clear();
  }
  /**
   * Initializes the rendering pipeline with the specified configuration.
   *
   * @param canvasWidth - The width of the rendering canvas in pixels
   * @param canvasHeight - The height of the rendering canvas in pixels
   * @param options - Configuration options for the pipeline
   * @param options.isShadow - Whether to enable shadow mapping (default: false)
   * @param options.isBloom - Whether to enable bloom post-processing effect (default: false)
   * @param options.shadowMapSize - Size of the shadow map texture in pixels (default: 1024)
   * @param options.isSimple - Whether to use simplified rendering without post-processing (default: false)
   * @param options.isTemporalAA - Whether to enable temporal anti-aliasing (default: false). It replaces the 4x MSAA
   *   of the main render target: the camera projection is jittered by a sub-pixel offset every frame, and the frames
   *   are accumulated with motion vectors. Ignored in the simple mode and for WebXR multi-view rendering.
   *
   * @returns A Result indicating success or failure of the setup operation
   *
   * @remarks
   * This method must be called before using any other pipeline methods. It creates all necessary
   * frame buffers, render targets, and expressions based on the provided configuration.
   *
   * The method automatically detects WebXR capabilities and configures multi-view rendering
   * when appropriate for VR applications.
   *
   * @example
   * ```typescript
   * const result = await pipeline.setup(1920, 1080, {
   *   isShadow: true,
   *   isBloom: true,
   *   shadowMapSize: 2048
   * });
   *
   * if (result.isErr()) {
   *   console.error('Pipeline setup failed:', result.getErr());
   * }
   * ```
   */
  async setup(canvasWidth, canvasHeight, { isShadow = false, isBloom = false, shadowMapSize = 1024, isSimple = false, isTemporalAA = false } = {}) {
    this.km = canvasWidth;
    this.iy = canvasHeight;
    this.gz = isBloom;
    this._z = isShadow;
    this.cz = isSimple;
    this.Pz = isTemporalAA;
    this.$z = shadowMapSize;
    if (this.hz != null) {
      return new Err({
        message: "Already setup",
        error: void 0
      });
    }
    const frame = new Frame();
    this.hz = frame;
    if (!this.cz) {
      const samplerForBackBuffer = new Sampler(this.c, {
        wrapS: TextureParameter.Repeat,
        wrapT: TextureParameter.Repeat,
        minFilter: TextureParameter.LinearMipmapLinear,
        magFilter: TextureParameter.Linear
      });
      samplerForBackBuffer.create();
      this.Iz = samplerForBackBuffer;
      this.nA(canvasWidth, canvasHeight);
      if (isShadow) {
        this.kz = new ShadowSystem(this.c, shadowMapSize);
      }
      if (this.fz != null && !MiscUtil.isMobile()) {
        this.Dz = this.oA(this.fz);
      }
      if (this.ez != null) {
        this.Rz = this.pA(
          this.ez
        );
        this.Ez = this.qA(this.ez);
      }
      const mainFrameBufferResolve = this.rA();
      let toneMappingTargetRenderTargetTexture = mainFrameBufferResolve.getColorAttachedRenderTargetTexture(0);
      if (this.eA()) {
        this.bz = new TemporalAASystem(
          this.c,
          canvasWidth,
          canvasHeight,
          mainFrameBufferResolve.getColorAttachedRenderTargetTexture(0)
        );
        toneMappingTargetRenderTargetTexture = this.bz.outputTexture;
      }
      if (isBloom) {
        const textureToBloom = toneMappingTargetRenderTargetTexture;
        const { bloomExpression, bloomedRenderTarget } = this.Xz.createBloomExpression({
          textureToBloom,
          parameters: {}
        });
        this.Fz = bloomExpression;
        toneMappingTargetRenderTargetTexture = bloomedRenderTarget;
      }
      const toneMappingExpression = this.sA(toneMappingTargetRenderTargetTexture);
      this.Az = toneMappingExpression;
    }
    this.Qz = this.tA();
    if (this.ni.length > 0) {
      this.setExpressions(this.ni);
    }
    const [raymarchingExpression, raymarchingRenderPass] = this.uA();
    this.rz = raymarchingExpression;
    this.uz = raymarchingRenderPass;
    this.oz();
    return new Ok();
  }
  /**
   * Gets the main frame buffer used for back buffer operations.
   *
   * @returns The frame buffer for back buffer operations, or undefined if not available
   *
   * @internal
   */
  Zz() {
    if (this.ez != null) {
      return this.zz;
    }
    return this.fz;
  }
  /**
   * Gets the main frame buffer used for resolve operations.
   *
   * @returns The frame buffer for resolve operations, or undefined if not available
   *
   * @internal
   */
  rA() {
    if (this.ez != null) {
      return this.mz;
    }
    return this.iz;
  }
  /**
   * Gets the main frame buffer used for rendering operations.
   *
   * @returns The main frame buffer, or undefined if not available
   *
   * @internal
   */
  Bz() {
    var _a;
    if (this.ez != null) {
      return this.ez;
    }
    return (_a = this.jz) != null ? _a : this.iz;
  }
  /**
   * Whether temporal anti-aliasing is used: requested in setup, not in the simple mode, and not in WebXR mode
   * (the eye cameras are not jittered, and stereo rendering keeps MSAA).
   */
  eA() {
    var _a;
    if (!this.Pz || this.cz) {
      return false;
    }
    return !((_a = this.c._webXRSystemIfEnabled) == null ? void 0 : _a.isWebXRMode);
  }
  /**
   * Sets the expressions to be rendered by the pipeline.
   *
   * @param expressions - Array of expressions containing render passes and entities to render
   * @param options - Configuration options for expression setup
   * @param options.isTransmission - Whether to enable transmission rendering for transparent objects (default: true)
   *
   * @remarks
   * This method configures the expressions for both opaque and transparent rendering.
   * When transmission is enabled, transparent objects are rendered in a separate pass
   * to support advanced material effects like glass and water.
   *
   * The method automatically clones expressions for transparent rendering and configures
   * shadow expressions if shadow mapping is enabled.
   *
   * @example
   * ```typescript
   * const expressions = [sceneExpression, uiExpression];
   * pipeline.setExpressions(expressions, { isTransmission: true });
   * ```
   */
  setExpressions(expressions, options = {
    isTransmission: true
  }) {
    const expressionsTranslucent = expressions.map((expression) => expression.clone());
    this.vA(expressions, {
      isTransmission: options.isTransmission
    });
    if (options.isTransmission) {
      this.wA(expressionsTranslucent);
    }
    if (this.kz != null) {
      const entities = this.ni.flatMap(
        (expression) => expression.renderPasses.flatMap((renderPass) => renderPass.entities)
      );
      this.Yz = this.kz.getExpressions(
        entities,
        this.fA(),
        this.gA()
      );
    }
    this.oz();
  }
  setGizmoExpression(expression) {
    this.Cz = expression;
  }
  /**
   * Starts the main rendering loop with the provided draw function.
   *
   * @param func - Function to be called each frame for rendering operations
   * @returns A Result indicating success or failure of starting the render loop
   *
   * @remarks
   * This method begins the continuous rendering loop using the system's render loop mechanism.
   * The provided function will be called every frame with the current frame object.
   *
   * The method automatically handles shadow system updates, expression management,
   * and frame processing.
   *
   * @example
   * ```typescript
   * const result = pipeline.startRenderLoop((frame) => {
   *   // Update scene
   *   engine.process(frame);
   *
   *   // Custom per-frame logic
   *   updateAnimations();
   *   handleInput();
   * });
   *
   * if (result.isErr()) {
   *   console.error('Failed to start render loop:', result.getRnError());
   * }
   * ```
   */
  startRenderLoop(func) {
    if (this.hz == null) {
      return new Err({
        message: "not initialized.",
        error: void 0
      });
    }
    this.bA = func;
    this.oz();
    this.c.startRenderLoop(() => {
      const shadowSystem = this.kz;
      if (shadowSystem != null) {
        const entities = this.dA;
        const additionalMaterials = this.fA();
        if (shadowSystem.isLightChanged()) {
          this.Yz = shadowSystem.getExpressions(
            entities,
            additionalMaterials,
            this.gA()
          );
          this.oz();
        }
        shadowSystem.setDepthBiasPV(entities, additionalMaterials);
      }
      this.xA();
      this.hA();
      func(this.hz);
    });
    return new Ok();
  }
  /**
   * Executes a single frame render using the draw function provided to startRenderLoop.
   *
   * @remarks
   * This method allows manual control over frame rendering instead of using the automatic
   * render loop. It calls the draw function that was provided to startRenderLoop.
   *
   * @example
   * ```typescript
   * // Manual frame rendering
   * pipeline.draw();
   * ```
   */
  draw() {
    this.hA();
    this.bA(this.hz);
  }
  /**
   * Whether temporal anti-aliasing is enabled (requested in setup and supported by the current render targets).
   */
  get isTemporalAA() {
    return this.bz != null;
  }
  /**
   * Discards the accumulated history of temporal anti-aliasing, so that the next frame does not blend with the
   * previous frames. Call it when the view changes discontinuously (e.g. a camera cut).
   */
  resetTemporalAAHistory() {
    var _a;
    (_a = this.bz) == null ? void 0 : _a.resetHistory();
  }
  /**
   * The weight of the current frame in the temporal anti-aliasing blend for pixels that move by a pixel per frame
   * or more (0-1, default 0.1). Larger values react faster to changes and smooth less.
   */
  set temporalAACurrentFrameWeight(weight) {
    if (this.bz != null) {
      this.bz.currentFrameWeight = weight;
    }
  }
  get temporalAACurrentFrameWeight() {
    var _a, _b;
    return (_b = (_a = this.bz) == null ? void 0 : _a.currentFrameWeight) != null ? _b : 0.1;
  }
  /**
   * The weight of the current frame in the temporal anti-aliasing blend for pixels that do not move (0-1, default
   * 0.04). Smaller values average more frames of the jitter sequence, which steadies the edges of still images;
   * slower pixels interpolate between this weight and {@link ForwardRenderPipeline.temporalAACurrentFrameWeight}.
   */
  set temporalAAStaticFrameWeight(weight) {
    if (this.bz != null) {
      this.bz.staticFrameWeight = weight;
    }
  }
  get temporalAAStaticFrameWeight() {
    var _a, _b;
    return (_b = (_a = this.bz) == null ? void 0 : _a.staticFrameWeight) != null ? _b : 0.04;
  }
  /**
   * Sets the size of the variance clipping box of the temporal anti-aliasing history in standard deviations
   * (default 1). A large value effectively disables the clipping, which makes wrong motion vectors visible as
   * trails. For debugging.
   *
   * @internal
   */
  _setTemporalAAVarianceClipGamma(gamma) {
    if (this.bz != null) {
      this.bz.varianceClipGamma = gamma;
    }
  }
  /**
   * Jitters the camera and keeps the previous frame state for temporal anti-aliasing. Runs before Engine.process.
   */
  hA() {
    if (this.bz == null) {
      return;
    }
    const renderPasses = this.ni.flatMap((expression) => expression.renderPasses);
    this.bz.prepareFrame(_getTemporalAACamera(this.c, renderPasses));
  }
  /**
   * Requests a refresh of the shadow map expressions on the next frame.
   * This is useful when materials with shadow support have been changed or added
   * (e.g., applying a shader with ClassicShader node).
   *
   * @remarks
   * When a new material with shadow support is applied, this method should be called
   * to ensure the shadow textures are properly set on the new material.
   *
   * @example
   * ```typescript
   * // After changing a material to one with shadow support
   * pipeline.setNeedsShadowMapRefresh();
   * ```
   */
  setNeedsShadowMapRefresh() {
    var _a;
    (_a = this.kz) == null ? void 0 : _a.setNeedsRefresh();
  }
  /**
   * Resizes the rendering pipeline to match new canvas dimensions.
   *
   * @param width - New width of the rendering canvas
   * @param height - New height of the rendering canvas
   * @returns A Result indicating success or failure of the resize operation
   *
   * @remarks
   * This method handles canvas resizing by destroying existing resources and recreating
   * them with the new dimensions. It automatically handles WebXR canvas sizing when
   * in VR mode.
   *
   * The method preserves all current pipeline settings (shadow, bloom, etc.) during resize.
   *
   * @example
   * ```typescript
   * window.addEventListener('resize', () => {
   *   const result = pipeline.resize(window.innerWidth, window.innerHeight);
   *   if (result.isErr()) {
   *     console.error('Resize failed:', result.getErr());
   *   }
   * });
   * ```
   */
  resize(width, height) {
    if (this.hz == null) {
      return new Err({
        message: "not initialized.",
        error: void 0
      });
    }
    const webXRSystem = this.c._webXRSystemIfEnabled;
    if (Is.exist(webXRSystem) && (webXRSystem == null ? void 0 : webXRSystem.isWebXRMode)) {
      width = webXRSystem.getCanvasWidthForVr();
      height = webXRSystem.getCanvasHeightForVr();
    }
    if (width <= 0 || height <= 0) {
      let fallbackWidth = this.km;
      let fallbackHeight = this.iy;
      if (fallbackWidth <= 0 || fallbackHeight <= 0) {
        const [currentWidth, currentHeight] = this.c.getCanvasSize();
        fallbackWidth = currentWidth;
        fallbackHeight = currentHeight;
      }
      if (fallbackWidth <= 0 || fallbackHeight <= 0) {
        fallbackWidth = 1;
        fallbackHeight = 1;
      }
      Logger.default.warn(
        `ForwardRenderPipeline.resize received non-positive dimensions (${width}x${height}). Falling back to ${fallbackWidth}x${fallbackHeight}.`
      );
      width = fallbackWidth;
      height = fallbackHeight;
    }
    const savedRaymarchingMaterial = this.getRaymarchingMaterial();
    this.c.resizeCanvas(width, height);
    this.mA();
    this.setup(width, height, {
      isShadow: this._z,
      isBloom: this.gz,
      shadowMapSize: this.$z,
      isSimple: this.cz,
      isTemporalAA: this.Pz
    });
    if (savedRaymarchingMaterial != null) {
      this.setRaymarchingMaterial(savedRaymarchingMaterial);
    }
    return new Ok();
  }
  /**
   * Sets the IBL (Image-Based Lighting) cube textures for realistic lighting.
   *
   * @param diffuse - Diffuse IBL cube texture for ambient lighting
   * @param specular - Specular IBL cube texture for reflections
   * @param sheen - Optional sheen IBL cube texture for fabric-like materials
   *
   * @remarks
   * IBL textures provide realistic lighting by using pre-computed environment maps.
   * The diffuse texture provides ambient lighting, while the specular texture provides
   * reflections and specular highlights.
   *
   * The sheen texture is optional and used for materials with fabric-like properties.
   *
   * @example
   * ```typescript
   * const diffuseCube = new Rn.CubeTexture();
   * diffuseCube.baseUriToLoad = './assets/ibl/diffuse/diffuse';
   * diffuseCube.hdriFormat = Rn.HdriFormat.RGBE_PNG;
   *
   * const specularCube = new Rn.CubeTexture();
   * specularCube.baseUriToLoad = './assets/ibl/specular/specular';
   * specularCube.hdriFormat = Rn.HdriFormat.RGBE_PNG;
   * specularCube.mipmapLevelNumber = 10;
   *
   * pipeline.setIBLTextures(diffuseCube, specularCube);
   * ```
   */
  setIBLTextures(diffuse, specular, sheen) {
    this.Gz = diffuse;
    this.Hz = specular;
    if (Is.exist(sheen)) {
      this.qz = sheen;
    }
    this.iA();
    this.jA();
    this.pz();
    this.oz();
  }
  /**
   * Gets the initial expression used for buffer clearing and setup.
   *
   * @returns The initial expression, or undefined if not available
   *
   * @remarks
   * The initial expression is automatically created during setup and handles
   * clearing of color and depth buffers before main rendering begins.
   */
  getInitialExpression() {
    return this.Qz;
  }
  /**
   * Gets the tone mapping expression used for HDR to LDR conversion.
   *
   * @returns The tone mapping expression, or undefined if not available
   *
   * @remarks
   * The tone mapping expression is created during setup when not in simple mode.
   * It handles the conversion from high dynamic range rendering to low dynamic range
   * output suitable for display devices.
   */
  getToneMappingExpression() {
    return this.Az;
  }
  /**
   * Sets the contribution factor for diffuse IBL lighting.
   *
   * @param value - Contribution factor (0.0 to 1.0 or higher for over-exposure effects)
   *
   * @remarks
   * This method controls how much the diffuse IBL texture contributes to the final lighting.
   * A value of 0.0 disables diffuse IBL, while 1.0 provides full contribution.
   * Values greater than 1.0 can be used for artistic over-exposure effects.
   *
   * @example
   * ```typescript
   * // Reduce ambient lighting
   * pipeline.setDiffuseIBLContribution(0.5);
   *
   * // Disable diffuse IBL
   * pipeline.setDiffuseIBLContribution(0.0);
   *
   * // Over-expose for artistic effect
   * pipeline.setDiffuseIBLContribution(2.0);
   * ```
   */
  setDiffuseIBLContribution(value) {
    this.Tz = value;
    this.pz();
    for (const expression of this.ni) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.diffuseCubeMapContribution = value;
          }
        }
      }
    }
    for (const expression of this.sz) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.diffuseCubeMapContribution = value;
          }
        }
      }
    }
  }
  /**
   * Sets the contribution factor for specular IBL reflections.
   *
   * @param value - Contribution factor (0.0 to 1.0 or higher for over-exposure effects)
   *
   * @remarks
   * This method controls how much the specular IBL texture contributes to reflections
   * and specular highlights. A value of 0.0 disables specular IBL, while 1.0 provides
   * full contribution. Values greater than 1.0 can create over-exposed reflections.
   *
   * @example
   * ```typescript
   * // Subtle reflections
   * pipeline.setSpecularIBLContribution(0.3);
   *
   * // No reflections
   * pipeline.setSpecularIBLContribution(0.0);
   *
   * // Enhanced reflections
   * pipeline.setSpecularIBLContribution(1.5);
   * ```
   */
  setSpecularIBLContribution(value) {
    this.Uz = value;
    this.pz();
    for (const expression of this.ni) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.specularCubeMapContribution = value;
          }
        }
      }
    }
    for (const expression of this.sz) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.specularCubeMapContribution = value;
          }
        }
      }
    }
  }
  /**
   * Sets the rotation of the IBL environment in radians.
   *
   * @param radian - Rotation angle in radians
   *
   * @remarks
   * This method allows rotating the IBL environment to match the desired lighting
   * direction. This is useful when the IBL doesn't align with the scene's lighting
   * requirements or for artistic control over the environment lighting.
   *
   * @example
   * ```typescript
   * // Rotate IBL by 90 degrees
   * pipeline.setIBLRotation(Math.PI / 2);
   *
   * // Rotate IBL by 180 degrees
   * pipeline.setIBLRotation(Math.PI);
   *
   * // Animate IBL rotation
   * let rotation = 0;
   * setInterval(() => {
   *   rotation += 0.01;
   *   pipeline.setIBLRotation(rotation);
   * }, 16);
   * ```
   */
  setIBLRotation(radian) {
    this.Sz = radian;
    this.pz();
    for (const expression of this.ni) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.rotationOfCubeMap = radian;
          }
        }
      }
    }
  }
  /**
   * Internal method to configure expressions for opaque and blended rendering.
   *
   * @param expressions - Array of expressions to configure
   * @param options - Configuration options
   * @param options.isTransmission - Whether transmission rendering is enabled
   *
   * @internal
   */
  vA(expressions, options = {
    isTransmission: true
  }) {
    for (const expression of expressions) {
      for (const rp of expression.renderPasses) {
        rp.setToRenderOpaquePrimitives(true);
        rp.setToRenderBlendWithZWritePrimitives(true);
        rp.setToRenderBlendWithoutZWritePrimitives(true);
        if (options.isTransmission) {
          rp.setToRenderTranslucentPrimitives(false);
        } else {
          rp.setToRenderTranslucentPrimitives(true);
        }
        rp.toClearDepthBuffer = false;
        if (!this.cz) {
          const mainFrameBuffer = this.Bz();
          if (mainFrameBuffer != null) {
            rp.setFramebuffer(mainFrameBuffer);
            if (this.jz != null) {
              rp.setResolveFramebuffer(this.iz);
              rp.setResolveFramebuffer2(this.fz);
            } else if (this.ez == null) {
              rp.setResolveFramebuffer(void 0);
              rp.setResolveFramebuffer2(this.fz);
            }
          }
        }
      }
    }
    this.ni = expressions;
    this.iA();
  }
  /**
   * Internal method to configure expressions specifically for transparent object transmission.
   *
   * @param expressions - Array of expressions to configure for transmission
   *
   * @remarks
   * This method sets up expressions for rendering transparent objects with transmission
   * effects like glass and water. It configures back buffer access for refraction effects.
   *
   * @internal
   */
  wA(expressions) {
    for (const expression of expressions) {
      expression.tryToSetUniqueName("modelTransparentForTransmission", true);
      for (const rp of expression.renderPasses) {
        rp.setToRenderOpaquePrimitives(false);
        rp.setToRenderTranslucentPrimitives(true);
        rp.setToRenderBlendWithZWritePrimitives(false);
        rp.setToRenderBlendWithoutZWritePrimitives(false);
        rp.toClearDepthBuffer = false;
        rp.toClearColorBuffer = false;
        if (!this.cz) {
          rp.setFramebuffer(this.Bz());
          if (this.jz != null) {
            rp.setResolveFramebuffer(this.iz);
          } else {
            rp.setResolveFramebuffer(void 0);
          }
          for (const entity of rp.entities) {
            const meshComponent = entity.tryToGetMesh();
            if (Is.exist(meshComponent)) {
              const mesh = meshComponent.mesh;
              if (Is.exist(mesh)) {
                for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
                  const primitive = mesh.getPrimitiveAt(i);
                  primitive.material.setTextureParameter(
                    "backBufferTexture",
                    this.Zz().getColorAttachedRenderTargetTexture(0),
                    this.Iz
                  );
                }
              }
            }
          }
        }
      }
    }
    this.sz = expressions;
    this.jA();
  }
  /**
   * Refreshes the back buffer texture on all transparent materials.
   * This is useful when materials are dynamically changed and need to have
   * the back buffer texture re-applied for transmission rendering.
   *
   * Call this method after changing materials on entities that use transmission
   * to ensure the back buffer texture is properly set.
   */
  refreshBackBufferTextureOnTransparentMaterials() {
    var _a;
    if (this.cz) {
      return;
    }
    const backBufferTexture = (_a = this.Zz()) == null ? void 0 : _a.getColorAttachedRenderTargetTexture(0);
    const sampler = this.Iz;
    if (backBufferTexture == null || sampler == null) {
      return;
    }
    for (const expression of this.sz) {
      for (const rp of expression.renderPasses) {
        for (const entity of rp.entities) {
          const meshComponent = entity.tryToGetMesh();
          if (Is.exist(meshComponent)) {
            const mesh = meshComponent.mesh;
            if (Is.exist(mesh)) {
              for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
                const primitive = mesh.getPrimitiveAt(i);
                primitive.material.setTextureParameter("backBufferTexture", backBufferTexture, sampler);
              }
            }
          }
        }
      }
    }
  }
  /**
   * Creates and configures the initial expression for buffer clearing.
   *
   * @returns The configured initial expression
   *
   * @internal
   */
  tA() {
    const expression = new Expression();
    expression.tryToSetUniqueName("Initial", true);
    const initialRenderPass = new RenderPass(this.c);
    initialRenderPass.clearColor = Vector4.fromCopyArray4([0, 0, 0, 0]);
    initialRenderPass.toClearColorBuffer = true;
    initialRenderPass.toClearDepthBuffer = true;
    initialRenderPass.isOutputForVr = true;
    initialRenderPass.tryToSetUniqueName("InitialRenderPass", true);
    expression.addRenderPasses([initialRenderPass]);
    if (!this.cz) {
      const initialRenderPassForFrameBuffer = new RenderPass(this.c);
      initialRenderPassForFrameBuffer.clearColor = Vector4.fromCopyArray4([0, 0, 0, 0]);
      initialRenderPassForFrameBuffer.toClearColorBuffer = true;
      initialRenderPassForFrameBuffer.toClearDepthBuffer = true;
      initialRenderPassForFrameBuffer.setFramebuffer(this.Bz());
      initialRenderPassForFrameBuffer.tryToSetUniqueName("InitialRenderPassForFrameBuffer", true);
      expression.addRenderPasses([initialRenderPassForFrameBuffer]);
    }
    return expression;
  }
  /**
   * Creates render targets and frame buffers based on canvas dimensions and WebXR support.
   *
   * @param canvasWidth - Width of the canvas
   * @param canvasHeight - Height of the canvas
   *
   * @remarks
   * This method automatically detects WebXR multi-view support and creates appropriate
   * render targets. For VR, it creates texture arrays for multi-view rendering.
   * For regular rendering, it creates MSAA frame buffers with resolve targets.
   *
   * @internal
   */
  nA(canvasWidth, canvasHeight) {
    const webXRSystem = this.c._webXRSystemIfEnabled;
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    if (Is.exist(webXRSystem) && (webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) && cgApiResourceRepository.isSupportMultiViewVRRendering(this.c)) {
      const framebufferMultiView = RenderableHelper.createFrameBufferTextureArrayForMultiView(this.c, {
        width: canvasWidth / 2,
        height: canvasHeight,
        arrayLength: 2,
        level: 0,
        internalFormat: this.gz ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8,
        format: this.gz ? PixelFormat.RGB : PixelFormat.RGBA,
        type: this.gz ? ComponentType.Float : ComponentType.UnsignedByte
      });
      framebufferMultiView.tryToSetUniqueName("FramebufferTargetOfToneMappingMultiView", true);
      const framebufferMultiViewBlit = RenderableHelper.createFrameBuffer(this.c, {
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.gz ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: false
      });
      framebufferMultiViewBlit.tryToSetUniqueName("FramebufferTargetOfToneMappingMultiViewBlit", true);
      const framebufferMultiViewBlitBackBuffer = RenderableHelper.createFrameBuffer(this.c, {
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.gz ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: false
      });
      framebufferMultiViewBlitBackBuffer.tryToSetUniqueName(
        "FramebufferTargetOfToneMappingMultiViewBlitBackBuffer",
        true
      );
      this.ez = framebufferMultiView;
      this.mz = framebufferMultiViewBlit;
      this.zz = framebufferMultiViewBlitBackBuffer;
      this.jz = void 0;
      this.iz = void 0;
      this.fz = void 0;
    } else {
      console.log(`canvasWidth: ${canvasWidth}, canvasHeight: ${canvasHeight}`);
      let framebufferMsaa;
      if (!this.eA()) {
        framebufferMsaa = RenderableHelper.createFrameBufferMSAA(this.c, {
          width: canvasWidth,
          height: canvasHeight,
          colorBufferNum: 1,
          colorFormats: [this.gz ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
          sampleCountMSAA: 4,
          depthBufferFormat: TextureFormat.Depth32F
        });
        framebufferMsaa.tryToSetUniqueName("FramebufferTargetOfToneMappingMsaa", true);
      }
      const framebufferResolve = RenderableHelper.createFrameBuffer(this.c, {
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.gz ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: true,
        depthTextureFormat: TextureFormat.Depth32F
      });
      framebufferResolve.tryToSetUniqueName("FramebufferTargetOfToneMappingResolve", true);
      const framebufferResolveForReference = RenderableHelper.createFrameBuffer(this.c, {
        width: canvasWidth,
        height: canvasHeight,
        textureNum: 1,
        textureFormats: [this.gz ? TextureFormat.R11F_G11F_B10F : TextureFormat.RGBA8],
        createDepthBuffer: false
      });
      framebufferResolveForReference.tryToSetUniqueName("FramebufferTargetOfToneMappingResolveForReference", true);
      this.ez = void 0;
      this.mz = void 0;
      this.zz = void 0;
      this.jz = framebufferMsaa;
      this.iz = framebufferResolve;
      this.fz = framebufferResolveForReference;
    }
  }
  /**
   * Sets up an expression for generating mipmaps on resolve frame buffers.
   *
   * @param resolveFramebuffer2 - The frame buffer to generate mipmaps for
   * @returns The configured mipmap generation expression
   *
   * @internal
   */
  oA(resolveFramebuffer2) {
    const expression = new Expression();
    expression.tryToSetUniqueName("GenerateMipmaps", true);
    const renderPass = new RenderPass(this.c);
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName("GenerateMipmaps", true);
    renderPass.toClearDepthBuffer = false;
    renderPass.setPostRenderFunction(function() {
      const renderTargetTexture = resolveFramebuffer2.getColorAttachedRenderTargetTexture(0);
      renderTargetTexture.generateMipmaps();
    });
    return expression;
  }
  /**
   * Sets up an expression for blitting multi-view rendering to back buffer.
   *
   * @param multiViewFrameBuffer - The multi-view frame buffer to blit from
   * @returns The configured blit expression
   *
   * @internal
   */
  pA(multiViewFrameBuffer) {
    const expression = new Expression();
    expression.tryToSetUniqueName("MultiViewBlitBackBuffer", true);
    const renderPass = new RenderPass(this.c);
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName("MultiViewBlitBackBuffer", true);
    renderPass.toClearDepthBuffer = false;
    renderPass.setPostRenderFunction(() => {
      if (this.zz != null && !MiscUtil.isMobile()) {
        const texture = this.zz.colorAttachments[0];
        multiViewFrameBuffer.colorAttachments[0].blitToTexture2dFromTexture2dArrayFake(
          texture
        );
        texture.generateMipmaps();
      }
    });
    return expression;
  }
  /**
   * Sets up an expression for blitting multi-view rendering results.
   *
   * @param multiViewFrameBuffer - The multi-view frame buffer to blit from
   * @returns The configured blit expression
   *
   * @internal
   */
  qA(multiViewFrameBuffer) {
    const expression = new Expression();
    expression.tryToSetUniqueName("MultiViewBlit", true);
    const renderPass = new RenderPass(this.c);
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName("MultiViewBlit", true);
    renderPass.toClearDepthBuffer = false;
    renderPass.setPostRenderFunction(() => {
      if (this.mz != null) {
        const texture = this.mz.colorAttachments[0];
        multiViewFrameBuffer.colorAttachments[0].blitToTexture2dFromTexture2dArrayFake(
          texture
        );
      }
    });
    return expression;
  }
  /**
   * Sets up the tone mapping expression for HDR to LDR conversion.
   *
   * @param toneMappingTargetRenderTargetTexture - The render target texture to apply tone mapping to
   * @returns The configured tone mapping expression
   *
   * @remarks
   * This method creates both regular and VR-specific tone mapping render passes.
   * The tone mapping converts high dynamic range rendering results to low dynamic range
   * output suitable for display devices.
   *
   * @internal
   */
  sA(toneMappingTargetRenderTargetTexture) {
    const expressionToneMappingEffect = new Expression();
    const materialToneMapping = createToneMappingMaterial(this.c);
    this.aA = materialToneMapping;
    this.setToneMappingType(this.cA);
    const renderPassToneMapping = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      this.c,
      materialToneMapping,
      toneMappingTargetRenderTargetTexture
    );
    renderPassToneMapping.tryToSetUniqueName("renderPassToneMapping", true);
    renderPassToneMapping.toClearColorBuffer = false;
    renderPassToneMapping.toClearDepthBuffer = false;
    renderPassToneMapping.isDepthTest = false;
    renderPassToneMapping.clearColor = Vector4.fromCopyArray4([0, 0, 0, 0]);
    renderPassToneMapping.isVrRendering = false;
    renderPassToneMapping.isOutputForVr = false;
    const renderPassToneMappingVr = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
      this.c,
      materialToneMapping,
      toneMappingTargetRenderTargetTexture
    );
    renderPassToneMappingVr.tryToSetUniqueName("renderPassToneMappingVr", true);
    renderPassToneMappingVr.toClearColorBuffer = false;
    renderPassToneMappingVr.toClearDepthBuffer = false;
    renderPassToneMappingVr.isDepthTest = false;
    renderPassToneMappingVr.clearColor = Vector4.fromCopyArray4([0, 0, 0, 0]);
    renderPassToneMappingVr.isVrRendering = false;
    renderPassToneMappingVr.isOutputForVr = true;
    expressionToneMappingEffect.addRenderPasses([renderPassToneMapping, renderPassToneMappingVr]);
    return expressionToneMappingEffect;
  }
  /**
   * Creates a frame buffer for depth moment shadow mapping.
   *
   * @param shadowMapSize - Size of the shadow map in pixels
   * @returns The configured depth moment frame buffer
   *
   * @internal
   */
  KA(shadowMapSize) {
    return RenderableHelper.createFrameBuffer(this.c, {
      width: shadowMapSize,
      height: shadowMapSize,
      textureNum: 1,
      textureFormats: [TextureFormat.RG32F],
      createDepthBuffer: true,
      depthTextureFormat: TextureFormat.Depth32F
    });
  }
  /**
   * Internal method to apply IBL textures to all expressions.
   *
   * @internal
   */
  iA() {
    for (const expression of this.ni) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.setIBLCubeMap(
              this.Gz,
              this.Hz,
              this.qz
            );
          }
        }
      }
    }
  }
  /**
   * Internal method to apply IBL textures to transparent-only expressions.
   *
   * @internal
   */
  jA() {
    for (const expression of this.sz) {
      for (const renderPass of expression.renderPasses) {
        for (const entity of renderPass.entities) {
          const meshRendererComponent = entity.tryToGetMeshRenderer();
          if (Is.exist(meshRendererComponent)) {
            meshRendererComponent.setIBLCubeMap(
              this.Gz,
              this.Hz,
              this.qz
            );
          }
        }
      }
    }
  }
  /**
   * Sets the tone mapping algorithm used for HDR to LDR conversion.
   *
   * @param type - The tone mapping algorithm to use
   *
   * @remarks
   * Tone mapping is essential for converting high dynamic range rendering results
   * to low dynamic range output that can be displayed on standard monitors.
   *
   * Available tone mapping algorithms:
   * - KhronosPbrNeutral: Khronos PBR neutral tone mapping
   * - Reinhard: Classic Reinhard tone mapping
   * - GT_ToneMap: GT tone mapping (default)
   * - ACES_Narkowicz: ACES tone mapping by Narkowicz
   * - ACES_Hill: ACES tone mapping by Hill
   * - ACES_Hill_Exposure_Boost: ACES Hill with exposure boost
   *
   * @example
   * ```typescript
   * // Use ACES tone mapping for cinematic look
   * pipeline.setToneMappingType(Rn.ToneMappingType.ACES_Hill);
   *
   * // Use Reinhard for classic look
   * pipeline.setToneMappingType(Rn.ToneMappingType.Reinhard);
   *
   * // Use Khronos PBR neutral for accurate colors
   * pipeline.setToneMappingType(Rn.ToneMappingType.KhronosPbrNeutral);
   * ```
   */
  setToneMappingType(type) {
    const toneMappingMaterial = this.aA;
    if (toneMappingMaterial == null) {
      return;
    }
    this.cA = type;
    toneMappingMaterial.removeShaderDefine("RN_USE_KHRONOS_PBR_NEUTRAL");
    toneMappingMaterial.removeShaderDefine("RN_USE_REINHARD");
    toneMappingMaterial.removeShaderDefine("RN_USE_GT_TONEMAP");
    toneMappingMaterial.removeShaderDefine("RN_USE_ACES_NARKOWICZ");
    toneMappingMaterial.removeShaderDefine("RN_USE_ACES_HILL");
    toneMappingMaterial.removeShaderDefine("RN_USE_ACES_HILL_EXPOSURE_BOOST");
    if (type === ToneMappingType.KhronosPbrNeutral) {
      toneMappingMaterial.addShaderDefine("RN_USE_KHRONOS_PBR_NEUTRAL");
    } else if (type === ToneMappingType.Reinhard) {
      toneMappingMaterial.addShaderDefine("RN_USE_REINHARD");
    } else if (type === ToneMappingType.GT_ToneMap) {
      toneMappingMaterial.addShaderDefine("RN_USE_GT_TONEMAP");
    } else if (type === ToneMappingType.ACES_Narkowicz) {
      toneMappingMaterial.addShaderDefine("RN_USE_ACES_NARKOWICZ");
    } else if (type === ToneMappingType.ACES_Hill) {
      toneMappingMaterial.addShaderDefine("RN_USE_ACES_HILL");
    } else if (type === ToneMappingType.ACES_Hill_Exposure_Boost) {
      toneMappingMaterial.addShaderDefine("RN_USE_ACES_HILL_EXPOSURE_BOOST");
    }
  }
  uA() {
    const expression = new Expression();
    expression.tryToSetUniqueName("Raymarching", true);
    const renderPass = new RenderPass(this.c);
    renderPass.toClearDepthBuffer = false;
    renderPass.isDepthTest = true;
    this.kA(renderPass);
    renderPass.setPreRenderFunction(() => this.yA(renderPass));
    expression.addRenderPasses([renderPass]);
    renderPass.tryToSetUniqueName("Raymarching", true);
    return [expression, renderPass];
  }
  /**
   * Points a buffer-less raymarching pass at the pipeline's render targets, including
   * the MSAA resolve targets the transmission pass and mipmap generation read.
   */
  kA(renderPass) {
    var _a;
    const mainFrameBuffer = this.Bz();
    renderPass.setFramebuffer(mainFrameBuffer);
    if (mainFrameBuffer != null && this.jz != null) {
      renderPass.setResolveFramebuffer(this.iz);
      renderPass.setResolveFramebuffer2((_a = this.fz) != null ? _a : void 0);
    } else {
      renderPass.setResolveFramebuffer(void 0);
      renderPass.setResolveFramebuffer2(mainFrameBuffer != null ? this.fz : void 0);
    }
  }
  /**
   * Per-frame setup of the legacy merged raymarching pass.
   *
   * The merged material evaluates every component's graph in one distance function,
   * so the object id and world matrix uniforms are postfixed with the component SID,
   * and the march is clipped to the union of all component AABBs.
   *
   * @param renderPass - The legacy raymarching pass
   */
  yA(renderPass) {
    this.pz();
    this.Kz();
    const material = renderPass.material;
    if (material == null) {
      return;
    }
    const raymarchingComponents = this.c.componentRepository.getComponentsWithType(
      RaymarchingComponent
    );
    let unionMinX = Number.POSITIVE_INFINITY;
    let unionMinY = Number.POSITIVE_INFINITY;
    let unionMinZ = Number.POSITIVE_INFINITY;
    let unionMaxX = Number.NEGATIVE_INFINITY;
    let unionMaxY = Number.NEGATIVE_INFINITY;
    let unionMaxZ = Number.NEGATIVE_INFINITY;
    let unionable = raymarchingComponents.length > 0;
    for (const raymarchingComponent of raymarchingComponents) {
      const sceneGraph = raymarchingComponent.entity.tryToGetSceneGraph();
      if (sceneGraph != null) {
        material.setParameter(`worldMatrix_${raymarchingComponent.componentSID}`, sceneGraph.matrixInner);
        material.setParameter(
          `raymarchObjectId_${raymarchingComponent.componentSID}`,
          Scalar.fromCopyNumber(raymarchingComponent.componentSID)
        );
      }
      const aabb = this.Lz(raymarchingComponent);
      if (aabb == null) {
        unionable = false;
        continue;
      }
      unionMinX = Math.min(unionMinX, aabb.min.x);
      unionMinY = Math.min(unionMinY, aabb.min.y);
      unionMinZ = Math.min(unionMinZ, aabb.min.z);
      unionMaxX = Math.max(unionMaxX, aabb.max.x);
      unionMaxY = Math.max(unionMaxY, aabb.max.y);
      unionMaxZ = Math.max(unionMaxZ, aabb.max.z);
    }
    if (unionable) {
      material.setParameter("raymarchAabbMin", Vector3.fromCopy3(unionMinX, unionMinY, unionMinZ));
      material.setParameter("raymarchAabbMax", Vector3.fromCopy3(unionMaxX, unionMaxY, unionMaxZ));
    } else {
      material.setParameter("raymarchAabbMin", RAYMARCHING_UNBOUNDED_AABB_MIN);
      material.setParameter("raymarchAabbMax", RAYMARCHING_UNBOUNDED_AABB_MAX);
    }
  }
  /**
   * Assigns the raymarching material of a single component.
   *
   * The pipeline renders one buffer-less full-screen pass per materialized component
   * (in component SID order) with depth test and depth write enabled, so the nearest
   * SDF wins per pixel. Each material only contains that component's graph: uniforms
   * and textures are not shared or postfixed, and the texture-slot limit applies per
   * component instead of to the merged graph of every component.
   *
   * When at least one component material is assigned, the legacy merged raymarching
   * material ({@link setRaymarchingMaterial}) is ignored.
   *
   * The pass clips its march to the component's world AABB. Call
   * `component.invalidateAABB()` when the SDF's size changes through material uniform
   * values (the editor does this for its uniform controls) so the cached bounds, the
   * ray interval and the scissor rectangle stay current.
   *
   * @param component - The component the material belongs to
   * @param material - The material, typically from
   * `createNodeBasedRaymarchingComponentMaterial`
   */
  setRaymarchingComponentMaterial(component, material) {
    var _a;
    this.dz.set(component.componentSID, material);
    this.pz();
    this.Kz();
    (_a = this.kz) == null ? void 0 : _a.applyShadowParametersToMaterials([material]);
    this.refreshRaymarchingShadowMaterial();
    if (this.hz != null) {
      this.oz();
    }
  }
  /**
   * Gets the raymarching material assigned to a component.
   * @param component - The component whose material is requested
   */
  getRaymarchingComponentMaterial(component) {
    return this.dz.get(component.componentSID);
  }
  /**
   * Removes the raymarching material of a component so it stops rendering.
   * @param component - The component whose material is removed
   */
  removeRaymarchingComponentMaterial(component) {
    if (this.dz.delete(component.componentSID)) {
      this.refreshRaymarchingShadowMaterial();
      if (this.hz != null) {
        this.oz();
      }
    }
  }
  /**
   * Legacy single-material API: renders all components with one merged material.
   *
   * Ignored while per-component materials are assigned ({@link setRaymarchingComponentMaterial}).
   *
   * @param material - The material built from `collectRrnJson`
   */
  setRaymarchingMaterial(material) {
    var _a, _b;
    (_a = this.uz) == null ? void 0 : _a.setBufferLessFullScreenRendering(material);
    this.pz();
    this.Kz();
    (_b = this.kz) == null ? void 0 : _b.applyShadowParametersToMaterials([material]);
    this.refreshRaymarchingShadowMaterial();
    if (this.hz != null) {
      this.oz();
    }
  }
  /**
   * Creates or updates the buffer-less render pass of each component that owns a
   * raymarching material, in component SID order. Components without a material are
   * skipped, and stale passes are dropped.
   */
  zA() {
    const passes = [];
    const existingComponentSids = /* @__PURE__ */ new Set();
    this.Wz = -1;
    if (this.dz.size > 0) {
      for (const component of this.Mz()) {
        const componentSID = component.componentSID;
        const material = this.dz.get(componentSID);
        if (material == null) {
          continue;
        }
        existingComponentSids.add(componentSID);
        let renderPass = this.tz.get(componentSID);
        if (renderPass == null) {
          renderPass = new RenderPass(this.c);
          renderPass.toClearDepthBuffer = false;
          renderPass.isDepthTest = true;
          renderPass.setPreRenderFunction(() => this.AA(componentSID));
          renderPass.tryToSetUniqueName(`Raymarching_${componentSID}`, true);
          this.tz.set(componentSID, renderPass);
        }
        renderPass.setBufferLessFullScreenRendering(material);
        this.kA(renderPass);
        if (passes.length === 0) {
          this.Wz = componentSID;
        }
        passes.push(renderPass);
      }
    }
    for (const componentSID of [...this.tz.keys()]) {
      if (!existingComponentSids.has(componentSID)) {
        this.tz.delete(componentSID);
      }
    }
    for (const componentSID of [...this.dz.keys()]) {
      if (!existingComponentSids.has(componentSID) && this.c.componentRepository.getComponent(RaymarchingComponent, componentSID) == null) {
        this.dz.delete(componentSID);
      }
    }
    return passes;
  }
  /**
   * Per-frame setup of one component's raymarching pass: its world matrix, the world
   * AABB used for ray interval clipping, and the scissor rectangle on the screen.
   *
   * The world matrix and the AABB are sampled together so the clip interval matches
   * the transform the shader uses, including on backends that upload material values
   * one frame later.
   *
   * @param componentSID - The SID of the component rendered by the pass
   */
  AA(componentSID) {
    var _a, _b, _c;
    if (componentSID === this.Wz) {
      this.pz();
      this.Kz();
    }
    const material = this.dz.get(componentSID);
    const component = this.c.componentRepository.getComponent(RaymarchingComponent, componentSID);
    const sceneGraph = component == null ? void 0 : component.entity.tryToGetSceneGraph();
    if (material == null || component == null || sceneGraph == null) {
      return;
    }
    material.setParameter(RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC, sceneGraph.matrixInner);
    const aabb = this.Lz(component);
    material.setParameter("raymarchAabbMin", (_a = aabb == null ? void 0 : aabb.min) != null ? _a : RAYMARCHING_UNBOUNDED_AABB_MIN);
    material.setParameter("raymarchAabbMax", (_b = aabb == null ? void 0 : aabb.max) != null ? _b : RAYMARCHING_UNBOUNDED_AABB_MAX);
    (_c = this.tz.get(componentSID)) == null ? void 0 : _c.setScissorRect(this.BA(aabb));
  }
  /**
   * Returns the conservative world AABB of a component's SDF, caching it until the
   * component's AABB version or world matrix changes.
   *
   * @param component - The SDF component
   */
  Lz(component) {
    const sceneGraph = component.entity.tryToGetSceneGraph();
    if (sceneGraph == null) {
      return null;
    }
    const matrix = sceneGraph.matrixInner;
    const elements = [
      matrix.m00,
      matrix.m01,
      matrix.m02,
      matrix.m03,
      matrix.m10,
      matrix.m11,
      matrix.m12,
      matrix.m13,
      matrix.m20,
      matrix.m21,
      matrix.m22,
      matrix.m23,
      matrix.m30,
      matrix.m31,
      matrix.m32,
      matrix.m33
    ];
    const aabbVersion = RaymarchingComponent.getAABBVersion(this.c);
    const cacheKey = component.componentSID;
    const cached = this.Jz.get(cacheKey);
    if (cached != null && cached.aabbVersion === aabbVersion && cached.matrix.length === elements.length && cached.matrix.every((value, index) => value === elements[index])) {
      return cached.aabb;
    }
    const aabb = component.calcWorldAABB();
    if (aabb == null) {
      this.Jz.delete(cacheKey);
      return null;
    }
    const result = {
      min: Vector3.fromCopy3(aabb.minPoint.x, aabb.minPoint.y, aabb.minPoint.z),
      max: Vector3.fromCopy3(aabb.maxPoint.x, aabb.maxPoint.y, aabb.maxPoint.z)
    };
    this.Jz.set(cacheKey, { aabbVersion, matrix: elements, aabb: result });
    return result;
  }
  /**
   * Projects a world AABB to a screen-space scissor rectangle.
   *
   * Returns undefined (render the whole target) when the bounds are unbounded or
   * when any corner is behind the camera, where a naive projection is invalid.
   *
   * @param aabb - The world AABB of the SDF
   */
  BA(aabb) {
    if (aabb == null || this.km <= 0 || this.iy <= 0) {
      return void 0;
    }
    const camera = this.c.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.c)
    );
    if (camera == null) {
      return void 0;
    }
    const viewProjection = camera.viewProjectionMatrix;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let corner = 0; corner < 8; corner++) {
      const x2 = (corner & 1) === 0 ? aabb.min.x : aabb.max.x;
      const y2 = (corner & 2) === 0 ? aabb.min.y : aabb.max.y;
      const z = (corner & 4) === 0 ? aabb.min.z : aabb.max.z;
      const clip = viewProjection.multiplyVector(Vector4.fromCopy4(x2, y2, z, 1));
      if (clip.w <= 0) {
        return void 0;
      }
      const ndcX = clip.x / clip.w;
      const ndcY = clip.y / clip.w;
      const pixelX = (ndcX * 0.5 + 0.5) * this.km;
      const pixelY = (-ndcY * 0.5 + 0.5) * this.iy;
      minX = Math.min(minX, pixelX);
      minY = Math.min(minY, pixelY);
      maxX = Math.max(maxX, pixelX);
      maxY = Math.max(maxY, pixelY);
    }
    const margin = 2;
    const x = Math.max(0, Math.floor(minX) - margin);
    const y = Math.max(0, Math.floor(minY) - margin);
    const right = Math.min(this.km, Math.ceil(maxX) + margin);
    const bottom = Math.min(this.iy, Math.ceil(maxY) + margin);
    const width = right - x;
    const height = bottom - y;
    if (width <= 0 || height <= 0) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }
    if (x === 0 && y === 0 && width === this.km && height === this.iy) {
      return void 0;
    }
    return { x, y, width, height };
  }
  /** All raymarching materials the pipeline manages (legacy or per component). */
  Nz() {
    const materials = [];
    for (const material of this.dz.values()) {
      materials.push(material);
    }
    const legacyMaterial = this.getRaymarchingMaterial();
    if (legacyMaterial != null) {
      materials.push(legacyMaterial);
    }
    return materials;
  }
  /**
   * Builds the raymarching expression from the current materials.
   *
   * With per-component materials, the expression contains one buffer-less pass per
   * component (component SID order), composited by the depth test. Otherwise the
   * legacy merged pass is used. The expression is empty while no raymarching material
   * is assigned.
   */
  CA() {
    const expression = new Expression();
    expression.tryToSetUniqueName("Raymarching", true);
    const componentPasses = this.zA();
    if (componentPasses.length > 0) {
      expression.addRenderPasses(componentPasses);
    } else if (this.uz != null && this.uz.material != null) {
      expression.addRenderPasses([this.uz]);
    }
    return expression;
  }
  /**
   * Rebuilds the shadow caster materials from the current raymarching components
   * (only the ones with `castShadow`) and requests a shadow map refresh, so the SDF
   * objects appear in / disappear from the shadow maps.
   *
   * With per-component visible materials, the shadow casters are split per component
   * as well (their textures and uniforms are then independent in the shadow maps).
   * Otherwise the legacy merged caster materials are rebuilt from `collectRrnJson`.
   *
   * Call this when a raymarching graph or a component's `castShadow` flag changes.
   */
  refreshRaymarchingShadowMaterial() {
    const previousRegular = this.lz;
    const previousComponentRegular = new Map(this.nz);
    this.vz = void 0;
    this.lz = void 0;
    this.wz.clear();
    this.nz.clear();
    this.yz.clear();
    this.xz = this.dz.size > 0;
    if (this.kz == null || this.c.config.maxLightNumber <= 0) {
      return;
    }
    if (this.xz) {
      for (const component of this.Mz()) {
        const componentSID = component.componentSID;
        if (!component.castShadow || !this.dz.has(componentSID)) {
          continue;
        }
        const material = createNodeBasedRaymarchingComponentShadowMaterial(
          this.c,
          component,
          "regular",
          previousComponentRegular.get(componentSID)
        );
        if (material != null) {
          this.nz.set(componentSID, material);
        }
      }
    } else {
      const castShadowJson = collectRrnJson(this.c, { castShadowOnly: true });
      if (castShadowJson.nodes.length > 0) {
        const json = castShadowJson;
        this.vz = json;
        this.lz = createNodeBasedRaymarchingShadowMaterial(
          this.c,
          json,
          "regular",
          previousRegular
        );
      }
    }
    this.kz.invalidateShadowVolumeFitting();
    this.kz.setNeedsRefresh();
  }
  /**
   * The raymarching components in a deterministic (component SID) order.
   */
  Mz() {
    const components = this.c.componentRepository.getComponentsWithType(RaymarchingComponent).slice();
    components.sort((a, b) => a.componentSID - b.componentSID);
    return components;
  }
  /** The regular (spot / directional) SDF shadow caster material (for tests/debugging). */
  getRaymarchingShadowMaterial() {
    return this.lz;
  }
  /** The regular SDF shadow caster material of one component (for tests/debugging). */
  getRaymarchingComponentShadowMaterial(component) {
    return this.nz.get(component.componentSID);
  }
  /**
   * Provider of the SDF shadow caster passes handed to the ShadowSystem.
   */
  gA() {
    return {
      hasCaster: () => this.xz ? this.nz.size > 0 : this.vz != null && this.lz != null,
      createPasses: (params) => this.DA(params),
      updatePointLightFarPlane: (shadowSlot, farPlane) => this.EA(shadowSlot, farPlane)
    };
  }
  /**
   * Returns the paraboloid shadow caster material pair for a shadow slot, creating it on
   * first use. A pair per slot is needed because the light index and the far plane are
   * material parameters, which WebGPU uploads once per frame.
   */
  FA(shadowSlot, lightComponentSID, farPlane) {
    let pair = this.wz.get(shadowSlot);
    if (pair == null) {
      const json = this.vz;
      if (json == null) {
        return void 0;
      }
      const front = createNodeBasedRaymarchingShadowMaterial(this.c, json, "paraboloidFront");
      const back = createNodeBasedRaymarchingShadowMaterial(this.c, json, "paraboloidBack");
      if (front == null || back == null) {
        return void 0;
      }
      pair = { front, back };
      this.wz.set(shadowSlot, pair);
    }
    const lightIndex = Scalar.fromCopyNumber(lightComponentSID);
    pair.front.setParameter("lightIndex", lightIndex);
    pair.back.setParameter("lightIndex", lightIndex);
    this.Oz(pair, farPlane);
    return pair;
  }
  Oz(pair, farPlane) {
    const value = Scalar.fromCopyNumber(farPlane);
    pair.front.setParameter("shadowFarPlane", value);
    pair.back.setParameter("shadowFarPlane", value);
  }
  /**
   * Returns the paraboloid caster material pair of one component for a shadow slot,
   * creating it on first use.
   *
   * @param shadowSlot - The shadow slot of the point light
   * @param lightComponentSID - The light component SID stored as `lightIndex`
   * @param farPlane - The far plane of the point light shadow
   * @param component - The SDF component rendered into the shadow map
   */
  GA(shadowSlot, lightComponentSID, farPlane, component) {
    let slotPairs = this.yz.get(shadowSlot);
    if (slotPairs == null) {
      slotPairs = /* @__PURE__ */ new Map();
      this.yz.set(shadowSlot, slotPairs);
    }
    let pair = slotPairs.get(component.componentSID);
    if (pair == null) {
      const front = createNodeBasedRaymarchingComponentShadowMaterial(this.c, component, "paraboloidFront");
      const back = createNodeBasedRaymarchingComponentShadowMaterial(this.c, component, "paraboloidBack");
      if (front == null || back == null) {
        return void 0;
      }
      pair = { front, back };
      slotPairs.set(component.componentSID, pair);
    }
    const lightIndex = Scalar.fromCopyNumber(lightComponentSID);
    pair.front.setParameter("lightIndex", lightIndex);
    pair.back.setParameter("lightIndex", lightIndex);
    this.Oz(pair, farPlane);
    return pair;
  }
  EA(shadowSlot, farPlane) {
    const pair = this.wz.get(shadowSlot);
    if (pair != null) {
      this.Oz(pair, farPlane);
    }
    const componentPairs = this.yz.get(shadowSlot);
    if (componentPairs != null) {
      for (const componentPair of componentPairs.values()) {
        this.Oz(componentPair, farPlane);
      }
    }
  }
  DA(params) {
    const { lightComponent, kind, shadowSlot, farPlane } = params;
    if (this.xz) {
      const passes = [];
      for (const component of this.Mz()) {
        const componentSID = component.componentSID;
        if (!component.castShadow || !this.dz.has(componentSID)) {
          continue;
        }
        let material2;
        if (kind === "regular") {
          material2 = this.nz.get(componentSID);
        } else {
          const pair = this.GA(
            shadowSlot,
            lightComponent.componentSID,
            farPlane != null ? farPlane : 1e3,
            component
          );
          material2 = kind === "paraboloidFront" ? pair == null ? void 0 : pair.front : pair == null ? void 0 : pair.back;
        }
        if (material2 == null) {
          continue;
        }
        passes.push(this.lA(material2, params));
      }
      return passes;
    }
    let material;
    if (kind === "regular") {
      material = this.lz;
    } else {
      const pair = this.FA(shadowSlot, lightComponent.componentSID, farPlane != null ? farPlane : 1e3);
      material = kind === "paraboloidFront" ? pair == null ? void 0 : pair.front : pair == null ? void 0 : pair.back;
    }
    if (material == null) {
      return [];
    }
    return [this.lA(material, params)];
  }
  /**
   * Creates one buffer-less SDF shadow caster pass with the given material.
   *
   * @param material - The component's (or merged) shadow caster material
   * @param params - The shadow map variant request
   */
  lA(material, { lightEntity, framebuffer, kind }) {
    const renderPass = new RenderPass(this.c);
    renderPass.isVrRendering = false;
    renderPass.setBufferLessFullScreenRendering(material);
    renderPass.setFramebuffer(framebuffer);
    renderPass.toClearColorBuffer = false;
    renderPass.toClearDepthBuffer = false;
    renderPass.isDepthTest = true;
    renderPass.depthWriteMask = true;
    if (kind === "regular") {
      renderPass.cameraComponent = lightEntity.getCamera();
    }
    renderPass.tryToSetUniqueName(`RaymarchingShadow_${kind}`, true);
    return renderPass;
  }
  /**
   * Copies the graph parameters (uniform values, textures) and the current transforms
   * from the visible raymarching materials to the SDF shadow caster materials.
   *
   * With per-component visible materials, each component's caster materials are its
   * own (same semantic names, no postfixing): their uniforms/textures are copied from
   * that component's visible material and the component's world matrix is set on them.
   * Otherwise the legacy merged casters are fed from the merged visible material.
   *
   * This runs once per frame BEFORE Engine.process: WebGPU uploads material values in the
   * prerender stage, so updating them only in a render pass hook would leave the shadow
   * passes one frame behind. setParameter / setTextureParameter return early for identical
   * values, so the copy is cheap.
   */
  xA() {
    if (this.xz) {
      this.HA();
      return;
    }
    if (this.vz == null) {
      return;
    }
    const materials = [];
    if (this.lz != null) {
      materials.push(this.lz);
    }
    for (const pair of this.wz.values()) {
      materials.push(pair.front, pair.back);
    }
    const componentMaterials = this.dz;
    const legacyMaterial = this.getRaymarchingMaterial();
    const firstMaterial = componentMaterials.size > 0 ? componentMaterials.values().next().value : legacyMaterial;
    const copySharedParameter = (material, semantic, info) => {
      if (firstMaterial == null) {
        return;
      }
      if (CompositionType.isTexture(info.compositionType)) {
        const textureParameter = firstMaterial.getTextureParameter(semantic);
        if (textureParameter != null) {
          material.setTextureParameter(semantic, textureParameter[1], textureParameter[2]);
        }
      } else {
        const value = firstMaterial.getParameter(semantic);
        if (value != null) {
          material.setParameter(semantic, value);
        }
      }
    };
    const raymarchingComponents = this.c.componentRepository.getComponentsWithType(
      RaymarchingComponent
    );
    let unionMinX = Number.POSITIVE_INFINITY;
    let unionMinY = Number.POSITIVE_INFINITY;
    let unionMinZ = Number.POSITIVE_INFINITY;
    let unionMaxX = Number.NEGATIVE_INFINITY;
    let unionMaxY = Number.NEGATIVE_INFINITY;
    let unionMaxZ = Number.NEGATIVE_INFINITY;
    let unionable = false;
    for (const raymarchingComponent of raymarchingComponents) {
      if (!raymarchingComponent.castShadow) {
        continue;
      }
      unionable = true;
      const aabb = this.Lz(raymarchingComponent);
      if (aabb == null) {
        unionable = false;
        break;
      }
      unionMinX = Math.min(unionMinX, aabb.min.x);
      unionMinY = Math.min(unionMinY, aabb.min.y);
      unionMinZ = Math.min(unionMinZ, aabb.min.z);
      unionMaxX = Math.max(unionMaxX, aabb.max.x);
      unionMaxY = Math.max(unionMaxY, aabb.max.y);
      unionMaxZ = Math.max(unionMaxZ, aabb.max.z);
    }
    const shadowAabbMin = unionable ? Vector3.fromCopy3(unionMinX, unionMinY, unionMinZ) : RAYMARCHING_UNBOUNDED_AABB_MIN;
    const shadowAabbMax = unionable ? Vector3.fromCopy3(unionMaxX, unionMaxY, unionMaxZ) : RAYMARCHING_UNBOUNDED_AABB_MAX;
    for (const material of materials) {
      material.setParameter("raymarchAabbMin", shadowAabbMin);
      material.setParameter("raymarchAabbMax", shadowAabbMax);
      for (const info of material.fieldsInfoArray) {
        const semantic = info.semantic;
        if (semantic.startsWith("worldMatrix_") || semantic.startsWith("raymarchObjectId_") || semantic === "raymarchAabbMin" || semantic === "raymarchAabbMax" || semantic === "lightIndex" || semantic === "shadowFarPlane") {
          continue;
        }
        const suffixed = /^(.*)_(\d+)$/.exec(semantic);
        const componentMaterial = suffixed != null ? componentMaterials.get(Number(suffixed[2])) : void 0;
        if (componentMaterial != null) {
          const baseSemantic = suffixed[1];
          if (CompositionType.isTexture(info.compositionType)) {
            const textureParameter = componentMaterial.getTextureParameter(baseSemantic);
            if (textureParameter != null) {
              material.setTextureParameter(semantic, textureParameter[1], textureParameter[2]);
            }
          } else {
            const value = componentMaterial.getParameter(baseSemantic);
            if (value != null) {
              material.setParameter(semantic, value);
            }
          }
        } else {
          copySharedParameter(material, semantic, info);
        }
      }
      for (const raymarchingComponent of raymarchingComponents) {
        if (!raymarchingComponent.castShadow) {
          continue;
        }
        const sceneGraph = raymarchingComponent.entity.tryToGetSceneGraph();
        if (sceneGraph != null) {
          material.setParameter(`worldMatrix_${raymarchingComponent.componentSID}`, sceneGraph.matrixInner);
        }
        material.setParameter(
          `raymarchObjectId_${raymarchingComponent.componentSID}`,
          Scalar.fromCopyNumber(raymarchingComponent.componentSID)
        );
      }
    }
  }
  /**
   * Per-component variant of the shadow caster parameter sync: copies each component's
   * visible uniforms/textures to its own caster materials (their names match) and sets
   * the component's world matrix and world AABB, which the shadow shader uses for the
   * distance scale and the ray interval.
   */
  HA() {
    var _a, _b;
    for (const component of this.Mz()) {
      const componentSID = component.componentSID;
      if (!component.castShadow) {
        continue;
      }
      const visibleMaterial = this.dz.get(componentSID);
      if (visibleMaterial == null) {
        continue;
      }
      const shadowMaterials = [];
      const regular = this.nz.get(componentSID);
      if (regular != null) {
        shadowMaterials.push(regular);
      }
      for (const slotPairs of this.yz.values()) {
        const pair = slotPairs.get(componentSID);
        if (pair != null) {
          shadowMaterials.push(pair.front, pair.back);
        }
      }
      if (shadowMaterials.length === 0) {
        continue;
      }
      const sceneGraph = component.entity.tryToGetSceneGraph();
      const worldMatrix = sceneGraph == null ? void 0 : sceneGraph.matrixInner;
      const aabb = this.Lz(component);
      const aabbMin = (_a = aabb == null ? void 0 : aabb.min) != null ? _a : RAYMARCHING_UNBOUNDED_AABB_MIN;
      const aabbMax = (_b = aabb == null ? void 0 : aabb.max) != null ? _b : RAYMARCHING_UNBOUNDED_AABB_MAX;
      for (const shadowMaterial of shadowMaterials) {
        if (worldMatrix != null) {
          shadowMaterial.setParameter(RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC, worldMatrix);
        }
        shadowMaterial.setParameter("raymarchAabbMin", aabbMin);
        shadowMaterial.setParameter("raymarchAabbMax", aabbMax);
        for (const info of shadowMaterial.fieldsInfoArray) {
          const semantic = info.semantic;
          if (semantic === RAYMARCHING_COMPONENT_WORLD_MATRIX_SEMANTIC || semantic === "raymarchAabbMin" || semantic === "raymarchAabbMax" || semantic === "lightIndex" || semantic === "shadowFarPlane") {
            continue;
          }
          if (CompositionType.isTexture(info.compositionType)) {
            const textureParameter = visibleMaterial.getTextureParameter(semantic);
            if (textureParameter != null) {
              shadowMaterial.setTextureParameter(semantic, textureParameter[1], textureParameter[2]);
            }
          } else {
            const value = visibleMaterial.getParameter(semantic);
            if (value != null) {
              shadowMaterial.setParameter(semantic, value);
            }
          }
        }
      }
    }
  }
  /** Materials outside mesh primitives that still receive shadows (the raymarching materials). */
  fA() {
    return this.Nz();
  }
  getRaymarchingMaterial() {
    var _a;
    return (_a = this.uz) == null ? void 0 : _a.material;
  }
  /**
   * Applies the pipeline's IBL environment to every raymarching PBR material.
   *
   * The raymarching draw is buffer-less and has no mesh renderer component, so
   * the IBL parameters that material contents normally read from the mesh
   * renderer are set on the material here instead.
   */
  pz() {
    for (const material of this.Nz()) {
      this.IA(material);
    }
  }
  /**
   * Applies the pipeline's IBL environment to one raymarching material.
   * @param material - The raymarching material
   */
  IA(material) {
    var _a, _b, _c, _d, _e, _f;
    const diffuseEnvValue = material.getTextureParameter(ShaderSemantics.DiffuseEnvTexture.str);
    const specularEnvValue = material.getTextureParameter(ShaderSemantics.SpecularEnvTexture.str);
    if (diffuseEnvValue == null || specularEnvValue == null) {
      return;
    }
    const sheenEnvValue = material.getTextureParameter(ShaderSemantics.SheenEnvTexture.str);
    const diffuse = this.Gz;
    const specular = this.Hz;
    if (diffuse == null || specular == null) {
      return;
    }
    const state = `${diffuse.objectUID}:${diffuse.isTextureReady}:${specular.objectUID}:${specular.isTextureReady}:${(_b = (_a = this.qz) == null ? void 0 : _a.objectUID) != null ? _b : -1}:${(_d = (_c = this.qz) == null ? void 0 : _c.isTextureReady) != null ? _d : false}:${this.Sz}:${this.Tz}:${this.Uz}`;
    if (state === this.Vz.get(material.objectUID)) {
      return;
    }
    this.Vz.set(material.objectUID, state);
    const sampler = diffuseEnvValue[2];
    if (diffuse.isTextureReady) {
      material.setTextureParameter(ShaderSemantics.DiffuseEnvTexture.str, diffuse, sampler);
    }
    if (specular.isTextureReady) {
      material.setTextureParameter(ShaderSemantics.SpecularEnvTexture.str, specular, sampler);
      if (sheenEnvValue != null) {
        const sheen = ((_e = this.qz) == null ? void 0 : _e.isTextureReady) ? this.qz : specular;
        const sheenSampler = (_f = sheenEnvValue[2]) != null ? _f : sampler;
        material.setTextureParameter(ShaderSemantics.SheenEnvTexture.str, sheen, sheenSampler);
      }
    }
    material.setParameter(
      "iblParameter",
      Vector4.fromCopy4(
        specular.mipmapLevelNumber,
        this.Tz,
        this.Uz,
        this.Sz
      )
    );
    material.setParameter("hdriFormat", Vector2.fromCopy2(diffuse.hdriFormat.index, specular.hdriFormat.index));
  }
  /**
   * Whether a raymarching material shades with transmission, which means it
   * samples the scene color behind the SDF.
   *
   * Only then does the raymarching expression have to run after the opaque
   * expressions. Without transmission it keeps its legacy position before them,
   * so blended meshes that are drawn in the opaque expression (the pipeline may be
   * configured with isTransmission: false) keep blending over the SDF.
   */
  JA() {
    return this.Nz().some((material) => material.isShaderDefine("RN_USE_TRANSMISSION"));
  }
  /**
   * Binds the resolved scene color to every raymarching material for transmission.
   *
   * This is the same reference texture the transmission materials of the transparent
   * pass sample. The raymarching expression is rendered after the opaque expressions,
   * so the texture holds the current frame. Materials without the semantic ignore the
   * call, and an identical binding is a no-op, so this is safe to run every frame.
   */
  Kz() {
    var _a;
    if (this.cz) {
      return;
    }
    const backBufferTexture = (_a = this.Zz()) == null ? void 0 : _a.getColorAttachedRenderTargetTexture(0);
    const sampler = this.Iz;
    if (backBufferTexture == null || sampler == null) {
      return;
    }
    for (const material of this.Nz()) {
      material.setTextureParameter(ShaderSemantics.BackBufferTexture.str, backBufferTexture, sampler);
    }
  }
  /**
   * Internal method to set up the frame with all configured expressions.
   *
   * @remarks
   * This method is called automatically during the render loop to configure
   * the frame with all necessary expressions in the correct order:
   * 1. Initial expression (buffer clearing)
   * 2. Shadow expressions
   * 3. Main expressions (opaque rendering)
   * 4. Mipmap generation
   * 5. Multi-view blitting
   * 6. Raymarching expression for transmission materials (samples the scene color;
   *    without transmission the raymarching expression is drawn before step 3)
   * 7. Transparent expressions
   * 8. Bloom effect
   * 9. Tone mapping
   *
   * @internal
   */
  oz() {
    const frame = this.hz;
    if (frame == null) {
      console.log("Frame is not set.");
      return;
    }
    frame.clearExpressions();
    frame.addExpression(this.Qz);
    this.rz = this.CA();
    if (!this.cz) {
      for (const exp of this.Yz) {
        frame.addExpression(exp);
      }
    }
    const raymarchingUsesTransmission = this.JA();
    if (!raymarchingUsesTransmission && this.rz != null) {
      frame.addExpression(this.rz);
    }
    for (const exp of this.ni) {
      if (this.cz) {
        exp.renderPasses.forEach((renderPass) => {
          renderPass.isOutputForVr = true;
        });
      } else {
        exp.renderPasses.forEach((renderPass) => {
          renderPass.isOutputForVr = false;
        });
      }
      frame.addExpression(exp);
    }
    if (!this.cz && this.Dz != null && !MiscUtil.isMobile()) {
      frame.addExpression(this.Dz);
    }
    if (!this.cz && this.Rz != null) {
      frame.addExpression(this.Rz);
    }
    if (raymarchingUsesTransmission && this.rz != null) {
      frame.addExpression(this.rz);
    }
    for (const exp of this.sz) {
      if (this.cz) {
        exp.renderPasses.forEach((renderPass) => {
          renderPass.isOutputForVr = true;
        });
      } else {
        exp.renderPasses.forEach((renderPass) => {
          renderPass.isOutputForVr = false;
        });
      }
      frame.addExpression(exp);
    }
    if (this.Cz.renderPasses.length > 0) {
      if (!this.cz) {
        const mainFrameBuffer = this.Bz();
        if (mainFrameBuffer != null) {
          for (const rp of this.Cz.renderPasses) {
            rp.setFramebuffer(mainFrameBuffer);
            if (this.jz != null) {
              rp.setResolveFramebuffer(this.iz);
            }
          }
        }
      }
      frame.addExpression(this.Cz);
    }
    const entities = this.ni.flatMap(
      (expression) => expression.renderPasses.flatMap((renderPass) => renderPass.entities)
    );
    this.dA = entities;
    if (this.bz != null) {
      this.bz.setEntities(entities);
      frame.addExpression(this.bz.expression);
    }
    if (!this.cz && this.Ez != null) {
      frame.addExpression(this.Ez);
    }
    if (!this.cz && this.gz && this.Fz != null) {
      frame.addExpression(this.Fz);
    }
    if (!this.cz && this.Az != null) {
      frame.addExpression(this.Az);
    }
  }
};
export {
  ForwardRenderPipeline
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcmVuZGVyZXIvcGlwZWxpbmVzL0ZvcndhcmRSZW5kZXJQaXBlbGluZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBTaXplIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJOb2RlSnNvbiB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL1NoYWRlck5vZGVKc29uJztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBSYXltYXJjaGluZ0NvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvUmF5bWFyY2hpbmcvUmF5bWFyY2hpbmdDb21wb25lbnQnO1xuaW1wb3J0IHsgUm5PYmplY3QgfSBmcm9tICcuLi8uLi9jb3JlL1JuT2JqZWN0JztcbmltcG9ydCB7XG4gIENvbXBvbmVudFR5cGUsXG4gIENvbXBvc2l0aW9uVHlwZSxcbiAgUGl4ZWxGb3JtYXQsXG4gIFRvbmVNYXBwaW5nVHlwZSxcbiAgdHlwZSBUb25lTWFwcGluZ1R5cGVFbnVtLFxufSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucyc7XG5pbXBvcnQgeyBTaGFkZXJTZW1hbnRpY3MgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3MnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NJbmZvIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzSW5mbyc7XG5pbXBvcnQgeyBUZXh0dXJlRm9ybWF0IH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvVGV4dHVyZUZvcm1hdCc7XG5pbXBvcnQgeyBUZXh0dXJlUGFyYW1ldGVyIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvVGV4dHVyZVBhcmFtZXRlcic7XG5pbXBvcnQgeyBCbG9vbSB9IGZyb20gJy4uLy4uL2hlbHBlcnMvQmxvb21IZWxwZXInO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVHcmFwaEVudGl0eSB9IGZyb20gJy4uLy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7XG4gIGNvbGxlY3RScm5Kc29uLFxuICBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd01hdGVyaWFsLFxuICBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ1NoYWRvd01hdGVyaWFsLFxuICBSQVlNQVJDSElOR19DT01QT05FTlRfV09STERfTUFUUklYX1NFTUFOVElDLFxufSBmcm9tICcuLi8uLi9oZWxwZXJzL21hdGVyaWFscy9jcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ01hdGVyaWFscyc7XG5pbXBvcnQgeyBjcmVhdGVUb25lTWFwcGluZ01hdGVyaWFsIH0gZnJvbSAnLi4vLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlVG9uZU1hcHBpbmdNYXRlcmlhbCc7XG5pbXBvcnQgeyBSZW5kZXJhYmxlSGVscGVyIH0gZnJvbSAnLi4vLi4vaGVscGVycy9SZW5kZXJhYmxlSGVscGVyJztcbmltcG9ydCB7IFJlbmRlclBhc3NIZWxwZXIgfSBmcm9tICcuLi8uLi9oZWxwZXJzL1JlbmRlclBhc3NIZWxwZXInO1xuaW1wb3J0IHtcbiAgdHlwZSBSYXltYXJjaGluZ1NoYWRvd1Bhc3NQYXJhbXMsXG4gIHR5cGUgUmF5bWFyY2hpbmdTaGFkb3dQYXNzUHJvdmlkZXIsXG4gIFNoYWRvd1N5c3RlbSxcbn0gZnJvbSAnLi4vLi4vaGVscGVycy9TaGFkb3cvU2hhZG93U3lzdGVtJztcbmltcG9ydCB0eXBlIHsgTWF0ZXJpYWwgfSBmcm9tICcuLi8uLi9tYXRlcmlhbHMvY29yZS9NYXRlcmlhbCc7XG5pbXBvcnQgeyBTY2FsYXIgfSBmcm9tICcuLi8uLi9tYXRoL1NjYWxhcic7XG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IyJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBNaXNjVXRpbCB9IGZyb20gJy4uLy4uL21pc2MnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi8uLi9taXNjL0lzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uLy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB7IEVyciwgT2sgfSBmcm9tICcuLi8uLi9taXNjL1Jlc3VsdCc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHR5cGUgeyBDdWJlVGV4dHVyZSB9IGZyb20gJy4uLy4uL3RleHR1cmVzL0N1YmVUZXh0dXJlJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyVGFyZ2V0VGV4dHVyZSB9IGZyb20gJy4uLy4uL3RleHR1cmVzL1JlbmRlclRhcmdldFRleHR1cmUnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJUYXJnZXRUZXh0dXJlMkRBcnJheSB9IGZyb20gJy4uLy4uL3RleHR1cmVzL1JlbmRlclRhcmdldFRleHR1cmUyREFycmF5JztcbmltcG9ydCB7IFNhbXBsZXIgfSBmcm9tICcuLi8uLi90ZXh0dXJlcy9TYW1wbGVyJztcbmltcG9ydCB7IEV4cHJlc3Npb24gfSBmcm9tICcuLi9FeHByZXNzaW9uJztcbmltcG9ydCB7IEZyYW1lIH0gZnJvbSAnLi4vRnJhbWUnO1xuaW1wb3J0IHR5cGUgeyBGcmFtZUJ1ZmZlciB9IGZyb20gJy4uL0ZyYW1lQnVmZmVyJztcbmltcG9ydCB7IFJlbmRlclBhc3MgfSBmcm9tICcuLi9SZW5kZXJQYXNzJztcbmltcG9ydCB7IF9nZXRUZW1wb3JhbEFBQ2FtZXJhLCBUZW1wb3JhbEFBU3lzdGVtIH0gZnJvbSAnLi4vVGVtcG9yYWxBQS9UZW1wb3JhbEFBU3lzdGVtJztcblxudHlwZSBEcmF3RnVuYyA9IChmcmFtZTogRnJhbWUpID0+IHZvaWQ7XG5cbi8qKiBCb3VuZHMgdGhhdCBkbyBub3QgY2xpcCBhIHJheTogdXNlZCB3aGVuIGFuIFNERiBoYXMgbm8gZmluaXRlIHdvcmxkIEFBQkIuICovXG5jb25zdCBSQVlNQVJDSElOR19VTkJPVU5ERURfQUFCQl9NSU4gPSBPYmplY3QuZnJlZXplKFZlY3RvcjMuZnJvbUNvcHkzKC0xZTIwLCAtMWUyMCwgLTFlMjApKTtcbmNvbnN0IFJBWU1BUkNISU5HX1VOQk9VTkRFRF9BQUJCX01BWCA9IE9iamVjdC5mcmVlemUoVmVjdG9yMy5mcm9tQ29weTMoMWUyMCwgMWUyMCwgMWUyMCkpO1xuXG4vKiogQ2FjaGVkIHdvcmxkIEFBQkIgb2Ygb25lIFNERiBjb21wb25lbnQgKGludmFsaWRhdGVkIGJ5IHZlcnNpb24gb3Igd29ybGQgbWF0cml4KS4gKi9cbnR5cGUgUmF5bWFyY2hpbmdBYWJiID0ge1xuICBtaW46IFZlY3RvcjM7XG4gIG1heDogVmVjdG9yMztcbn07XG5cbi8qKlxuICogQSBmb3J3YXJkIHJlbmRlcmluZyBwaXBlbGluZSB0aGF0IHByb3ZpZGVzIGFkdmFuY2VkIHJlbmRlcmluZyBmZWF0dXJlcyBpbmNsdWRpbmcgc2hhZG93cywgYmxvb20sIHRvbmUgbWFwcGluZywgYW5kIElCTC5cbiAqXG4gKiBAcmVtYXJrc1xuICogRm9yd2FyZFJlbmRlclBpcGVsaW5lIGlzIGEgY29tcHJlaGVuc2l2ZSByZW5kZXJpbmcgc29sdXRpb24gdGhhdCBoYW5kbGVzIG11bHRpLXBhc3MgcmVuZGVyaW5nIHNldHVwc1xuICogd2l0aCBmZWF0dXJlcyBsaWtlIE1TQUEsIHNoYWRvdyBtYXBwaW5nLCBibG9vbSBlZmZlY3RzLCBhbmQgdG9uZSBtYXBwaW5nLiBJdCBzdXBwb3J0cyBib3RoIHJlZ3VsYXJcbiAqIHJlbmRlcmluZyBhbmQgV2ViWFIgbXVsdGktdmlldyByZW5kZXJpbmcgZm9yIFZSIGFwcGxpY2F0aW9ucy5cbiAqXG4gKiBUaGUgcGlwZWxpbmUgYXV0b21hdGljYWxseSBtYW5hZ2VzIGZyYW1lIGJ1ZmZlcnMsIHJlbmRlciB0YXJnZXRzLCBhbmQgZXhwcmVzc2lvbiBjaGFpbnMgdG8gcHJvdmlkZVxuICogYSBjb21wbGV0ZSByZW5kZXJpbmcgc29sdXRpb24gc2ltaWxhciB0byBVbml0eSdzIFVuaXZlcnNhbCBSZW5kZXIgUGlwZWxpbmUgKFVSUCkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGV4cHJlc3Npb25zID0gWy4uLl07XG4gKlxuICogLy8gQ3JlYXRlIGFuZCBzZXR1cCB0aGUgcmVuZGVyIHBpcGVsaW5lXG4gKiBjb25zdCBmb3J3YXJkUmVuZGVyUGlwZWxpbmUgPSBuZXcgUm4uRm9yd2FyZFJlbmRlclBpcGVsaW5lKGVuZ2luZSk7XG4gKiBhd2FpdCBmb3J3YXJkUmVuZGVyUGlwZWxpbmUuc2V0dXAoMTAyNCwgMTAyNCwge2lzU2hhZG93OiB0cnVlLCBpc0Jsb29tOiB0cnVlfSk7XG4gKlxuICogLy8gQ29uZmlndXJlIGV4cHJlc3Npb25zIGFuZCBJQkxcbiAqIGZvcndhcmRSZW5kZXJQaXBlbGluZS5zZXRFeHByZXNzaW9ucyhleHByZXNzaW9ucyk7XG4gKlxuICogY29uc3QgZGlmZnVzZUN1YmVUZXh0dXJlID0gYXdhaXQgUm4uQ3ViZVRleHR1cmUubG9hZEZyb21VcmwoZW5naW5lLCB7XG4gKiAgIGJhc2VVcmw6ICcuLy4uLy4uLy4uL2Fzc2V0cy9pYmwvcGFwZXJtaWxsL2RpZmZ1c2UvZGlmZnVzZScsXG4gKiAgIG1pcG1hcExldmVsTnVtYmVyOiAxLFxuICogICBpc05hbWVQb3NOZWc6IHRydWUsXG4gKiAgIGhkcmlGb3JtYXQ6IFJuLkhkcmlGb3JtYXQuUkdCRV9QTkcsXG4gKiB9KTtcbiAqXG4gKiBjb25zdCBzcGVjdWxhckN1YmVUZXh0dXJlID0gYXdhaXQgUm4uQ3ViZVRleHR1cmUubG9hZEZyb21VcmwoZW5naW5lLCB7XG4gKiAgIGJhc2VVcmw6ICcuLy4uLy4uLy4uL2Fzc2V0cy9pYmwvcGFwZXJtaWxsL3NwZWN1bGFyL3NwZWN1bGFyJyxcbiAqICAgbWlwbWFwTGV2ZWxOdW1iZXI6IDEwLFxuICogICBpc05hbWVQb3NOZWc6IHRydWUsXG4gKiAgIGhkcmlGb3JtYXQ6IFJuLkhkcmlGb3JtYXQuUkdCRV9QTkcsXG4gKiB9KTtcbiAqXG4gKiBmb3J3YXJkUmVuZGVyUGlwZWxpbmUuc2V0SUJMVGV4dHVyZXMoZGlmZnVzZUN1YmVUZXh0dXJlLCBzcGVjdWxhckN1YmVUZXh0dXJlKTtcbiAqXG4gKiAvLyBTdGFydCB0aGUgcmVuZGVyIGxvb3BcbiAqIGZvcndhcmRSZW5kZXJQaXBlbGluZS5zdGFydFJlbmRlckxvb3AoKGZyYW1lKSA9PiB7XG4gKiAgIGVuZ2luZS5wcm9jZXNzKGZyYW1lKTtcbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBGb3J3YXJkUmVuZGVyUGlwZWxpbmUgZXh0ZW5kcyBSbk9iamVjdCB7XG4gIHByaXZhdGUgX193aWR0aCA9IDA7XG4gIHByaXZhdGUgX19oZWlnaHQgPSAwO1xuICBwcml2YXRlIF9faXNTaGFkb3cgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2lzQmxvb20gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2lzU2ltcGxlID0gZmFsc2U7XG4gIHByaXZhdGUgX19pc1RlbXBvcmFsQUEgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3RlbXBvcmFsQUE/OiBUZW1wb3JhbEFBU3lzdGVtO1xuICBwcml2YXRlIF9fc2hhZG93TWFwU2l6ZSA9IDEwMjQ7XG4gIHByaXZhdGUgX19mcmFtZT86IEZyYW1lO1xuICBwcml2YXRlIF9fZnJhbWVCdWZmZXJNdWx0aVZpZXc/OiBGcmFtZUJ1ZmZlcjtcbiAgcHJpdmF0ZSBfX2ZyYW1lQnVmZmVyTXVsdGlWaWV3QmxpdD86IEZyYW1lQnVmZmVyO1xuICBwcml2YXRlIF9fZnJhbWVCdWZmZXJNdWx0aVZpZXdCbGl0QmFja0J1ZmZlcj86IEZyYW1lQnVmZmVyO1xuICBwcml2YXRlIF9fZnJhbWVCdWZmZXJNc2FhPzogRnJhbWVCdWZmZXI7XG4gIHByaXZhdGUgX19mcmFtZUJ1ZmZlclJlc29sdmU/OiBGcmFtZUJ1ZmZlcjtcbiAgcHJpdmF0ZSBfX2ZyYW1lQnVmZmVyUmVzb2x2ZUZvclJlZmVyZW5jZT86IEZyYW1lQnVmZmVyO1xuICBwcml2YXRlIF9faW5pdGlhbEV4cHJlc3Npb24/OiBFeHByZXNzaW9uO1xuXG4gIC8qKiBtYWluIGV4cHJlc3Npb25zICovXG4gIHByaXZhdGUgX19leHByZXNzaW9uczogRXhwcmVzc2lvbltdID0gW107XG4gIHByaXZhdGUgX19naXptb0V4cHJlc3Npb246IEV4cHJlc3Npb24gPSBuZXcgRXhwcmVzc2lvbigpO1xuXG4gIHByaXZhdGUgX19nZW5lcmF0ZU1pcG1hcHNFeHByZXNzaW9uPzogRXhwcmVzc2lvbjtcbiAgcHJpdmF0ZSBfX211bHRpVmlld0JsaXRCYWNrQnVmZmVyRXhwcmVzc2lvbj86IEV4cHJlc3Npb247XG4gIHByaXZhdGUgX19tdWx0aVZpZXdCbGl0RXhwcmVzc2lvbj86IEV4cHJlc3Npb247XG4gIHByaXZhdGUgX19ibG9vbUV4cHJlc3Npb24/OiBFeHByZXNzaW9uO1xuICBwcml2YXRlIF9fdG9uZU1hcHBpbmdFeHByZXNzaW9uPzogRXhwcmVzc2lvbjtcbiAgcHJpdmF0ZSBfX3RvbmVNYXBwaW5nTWF0ZXJpYWw/OiBNYXRlcmlhbDtcbiAgcHJpdmF0ZSBfX3RyYW5zcGFyZW50T25seUV4cHJlc3Npb25zOiBFeHByZXNzaW9uW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2RyYXdGdW5jPzogRHJhd0Z1bmM7XG4gIHByaXZhdGUgX19kaWZmdXNlQ3ViZVRleHR1cmU/OiBDdWJlVGV4dHVyZTtcbiAgcHJpdmF0ZSBfX3NwZWN1bGFyQ3ViZVRleHR1cmU/OiBDdWJlVGV4dHVyZTtcbiAgcHJpdmF0ZSBfX3NoZWVuQ3ViZVRleHR1cmU/OiBDdWJlVGV4dHVyZTtcbiAgcHJpdmF0ZSBfX2libFJvdGF0aW9uID0gMDtcbiAgcHJpdmF0ZSBfX2RpZmZ1c2VJYmxDb250cmlidXRpb24gPSAxLjA7XG4gIHByaXZhdGUgX19zcGVjdWxhcklibENvbnRyaWJ1dGlvbiA9IDEuMDtcbiAgcHJpdmF0ZSBfX3JheW1hcmNoaW5nSWJsU3RhdGVzID0gbmV3IE1hcDxudW1iZXIsIHN0cmluZz4oKTtcbiAgcHJpdmF0ZSBfX3NhbXBsZXJGb3JCYWNrQnVmZmVyPzogU2FtcGxlcjtcbiAgLyoqIFBlci1jb21wb25lbnQgcmF5bWFyY2hpbmcgbWF0ZXJpYWxzIGFuZCB0aGVpciBidWZmZXItbGVzcyBmdWxsLXNjcmVlbiBwYXNzZXMuICovXG4gIHByaXZhdGUgX19yYXltYXJjaGluZ0NvbXBvbmVudE1hdGVyaWFscyA9IG5ldyBNYXA8bnVtYmVyLCBNYXRlcmlhbD4oKTtcbiAgcHJpdmF0ZSBfX3JheW1hcmNoaW5nQ29tcG9uZW50UGFzc2VzID0gbmV3IE1hcDxudW1iZXIsIFJlbmRlclBhc3M+KCk7XG4gIC8qKiBTSUQgb2YgdGhlIGZpcnN0IHBlci1jb21wb25lbnQgcGFzcyAoaXQgYXBwbGllcyB0aGUgcGVyLWZyYW1lIHNoYXJlZCBtYXRlcmlhbCBzZXR1cCkuICovXG4gIHByaXZhdGUgX19yYXltYXJjaGluZ0ZpcnN0Q29tcG9uZW50UGFzc1NJRCA9IC0xO1xuICAvKiogQ2FjaGVkIHdvcmxkIEFBQkJzIG9mIHRoZSBTREZzLCB1c2VkIGZvciByYXkgaW50ZXJ2YWwgY2xpcHBpbmcgYW5kIHNjaXNzb3JzLiAqL1xuICBwcml2YXRlIF9fcmF5bWFyY2hpbmdBYWJiQ2FjaGUgPSBuZXcgTWFwPG51bWJlciwgeyBhYWJiVmVyc2lvbjogbnVtYmVyOyBtYXRyaXg6IG51bWJlcltdOyBhYWJiOiBSYXltYXJjaGluZ0FhYmIgfT4oKTtcbiAgcHJpdmF0ZSBfX3RvbmVNYXBwaW5nVHlwZSA9IFRvbmVNYXBwaW5nVHlwZS5HVF9Ub25lTWFwO1xuICBwcml2YXRlIF9fYmxvb21IZWxwZXI6IEJsb29tO1xuICBwcml2YXRlIF9fc2hhZG93U3lzdGVtPzogU2hhZG93U3lzdGVtO1xuICBwcml2YXRlIF9fc2hhZG93RXhwcmVzc2lvbnM6IEV4cHJlc3Npb25bXSA9IFtdO1xuICBwcml2YXRlIF9fZW50aXRpZXNGb3JTaGFkb3c6IElTY2VuZUdyYXBoRW50aXR5W10gPSBbXTtcbiAgcHJpdmF0ZSBfX3JheW1hcmNoaW5nRXhwcmVzc2lvbj86IEV4cHJlc3Npb247XG4gIHByaXZhdGUgX19yYXltYXJjaGluZ1JlbmRlclBhc3M/OiBSZW5kZXJQYXNzO1xuICAvKiogVGhlIG1lcmdlZCBTREYgZ3JhcGggb2YgdGhlIHNoYWRvdy1jYXN0aW5nIGNvbXBvbmVudHMuICovXG4gIHByaXZhdGUgX19yYXltYXJjaGluZ1NoYWRvd0pzb24/OiBTaGFkZXJOb2RlSnNvbjtcbiAgcHJpdmF0ZSBfX3JheW1hcmNoaW5nU2hhZG93UmVndWxhck1hdGVyaWFsPzogTWF0ZXJpYWw7XG4gIC8qKiBQb2ludCBsaWdodCBwYXJhYm9sb2lkIHNoYWRvdyBtYXRlcmlhbHMsIG9uZSBmcm9udC9iYWNrIHBhaXIgcGVyIHNoYWRvdyBzbG90LiAqL1xuICBwcml2YXRlIF9fcmF5bWFyY2hpbmdTaGFkb3dQb2ludFNsb3RzID0gbmV3IE1hcDxudW1iZXIsIHsgZnJvbnQ6IE1hdGVyaWFsOyBiYWNrOiBNYXRlcmlhbCB9PigpO1xuICAvKiogV2hldGhlciB0aGUgU0RGIHNoYWRvdyBjYXN0ZXJzIGFyZSBzcGxpdCBwZXIgY29tcG9uZW50IChtaXJyb3JzIHRoZSB2aXNpYmxlIG1hdGVyaWFscykuICovXG4gIHByaXZhdGUgX19pc1JheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93TW9kZSA9IGZhbHNlO1xuICAvKiogUGVyLWNvbXBvbmVudCByZWd1bGFyIChzcG90IC8gZGlyZWN0aW9uYWwpIFNERiBzaGFkb3cgY2FzdGVyIG1hdGVyaWFscy4gKi9cbiAgcHJpdmF0ZSBfX3JheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93UmVndWxhck1hdGVyaWFscyA9IG5ldyBNYXA8bnVtYmVyLCBNYXRlcmlhbD4oKTtcbiAgLyoqIFBlciBzaGFkb3cgc2xvdCwgcGVyIGNvbXBvbmVudCBwYXJhYm9sb2lkIGZyb250L2JhY2sgU0RGIHNoYWRvdyBjYXN0ZXIgbWF0ZXJpYWxzLiAqL1xuICBwcml2YXRlIF9fcmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dQb2ludFNsb3RzID0gbmV3IE1hcDxudW1iZXIsIE1hcDxudW1iZXIsIHsgZnJvbnQ6IE1hdGVyaWFsOyBiYWNrOiBNYXRlcmlhbCB9Pj4oKTtcbiAgcHJpdmF0ZSBfX2VuZ2luZTogRW5naW5lO1xuXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9fZW5naW5lID0gZW5naW5lO1xuICAgIHRoaXMuX19ibG9vbUhlbHBlciA9IG5ldyBCbG9vbShlbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFsbCBhbGxvY2F0ZWQgM0QgQVBJIHJlc291cmNlcyBpbmNsdWRpbmcgZnJhbWUgYnVmZmVycyBhbmQgdGV4dHVyZXMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBpbnRlcm5hbGx5IGR1cmluZyByZXNpemUgb3BlcmF0aW9ucyBhbmQgY2xlYW51cC5cbiAgICogSXQgZW5zdXJlcyBwcm9wZXIgcmVzb3VyY2UgbWFuYWdlbWVudCBieSByZWxlYXNpbmcgR1BVIG1lbW9yeS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fZGVzdHJveVJlc291cmNlcygpIHtcbiAgICBpZiAodGhpcy5fX2ZyYW1lQnVmZmVyTXVsdGlWaWV3ICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlldy5kZXN0cm95M0RBUElSZXNvdXJjZXMoKTtcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlldyA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlld0JsaXQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2ZyYW1lQnVmZmVyTXVsdGlWaWV3QmxpdC5kZXN0cm95M0RBUElSZXNvdXJjZXMoKTtcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlld0JsaXQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fZnJhbWVCdWZmZXJNc2FhICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlck1zYWEuZGVzdHJveTNEQVBJUmVzb3VyY2VzKCk7XG4gICAgICB0aGlzLl9fZnJhbWVCdWZmZXJNc2FhID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2ZyYW1lQnVmZmVyUmVzb2x2ZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fZnJhbWVCdWZmZXJSZXNvbHZlLmRlc3Ryb3kzREFQSVJlc291cmNlcygpO1xuICAgICAgdGhpcy5fX2ZyYW1lQnVmZmVyUmVzb2x2ZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19mcmFtZUJ1ZmZlclJlc29sdmVGb3JSZWZlcmVuY2UgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2ZyYW1lQnVmZmVyUmVzb2x2ZUZvclJlZmVyZW5jZS5kZXN0cm95M0RBUElSZXNvdXJjZXMoKTtcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlclJlc29sdmVGb3JSZWZlcmVuY2UgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMuX19ibG9vbUhlbHBlci5kZXN0cm95M0RBUElSZXNvdXJjZXMoKTtcbiAgICBpZiAodGhpcy5fX3RlbXBvcmFsQUEgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3RlbXBvcmFsQUEuZGVzdHJveTNEQVBJUmVzb3VyY2VzKCk7XG4gICAgICB0aGlzLl9fdGVtcG9yYWxBQSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy5fX2ZyYW1lID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19nZW5lcmF0ZU1pcG1hcHNFeHByZXNzaW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19tdWx0aVZpZXdCbGl0RXhwcmVzc2lvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fYmxvb21FeHByZXNzaW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX190b25lTWFwcGluZ0V4cHJlc3Npb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3JheW1hcmNoaW5nRXhwcmVzc2lvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dKc29uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19yYXltYXJjaGluZ1NoYWRvd1JlZ3VsYXJNYXRlcmlhbCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dQb2ludFNsb3RzLmNsZWFyKCk7XG4gICAgdGhpcy5fX2lzUmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dNb2RlID0gZmFsc2U7XG4gICAgdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93UmVndWxhck1hdGVyaWFscy5jbGVhcigpO1xuICAgIHRoaXMuX19yYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd1BvaW50U2xvdHMuY2xlYXIoKTtcbiAgICAvLyBUaGUgcGFzc2VzIHJlZmVyZW5jZSB0aGUgZGVzdHJveWVkIGZyYW1lIGJ1ZmZlcnM7IHRoZXkgYXJlIHJlY3JlYXRlZCBvbiBzZXR1cC5cbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRQYXNzZXMuY2xlYXIoKTtcbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdBYWJiQ2FjaGUuY2xlYXIoKTtcbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdJYmxTdGF0ZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcmVuZGVyaW5nIHBpcGVsaW5lIHdpdGggdGhlIHNwZWNpZmllZCBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gY2FudmFzV2lkdGggLSBUaGUgd2lkdGggb2YgdGhlIHJlbmRlcmluZyBjYW52YXMgaW4gcGl4ZWxzXG4gICAqIEBwYXJhbSBjYW52YXNIZWlnaHQgLSBUaGUgaGVpZ2h0IG9mIHRoZSByZW5kZXJpbmcgY2FudmFzIGluIHBpeGVsc1xuICAgKiBAcGFyYW0gb3B0aW9ucyAtIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIHBpcGVsaW5lXG4gICAqIEBwYXJhbSBvcHRpb25zLmlzU2hhZG93IC0gV2hldGhlciB0byBlbmFibGUgc2hhZG93IG1hcHBpbmcgKGRlZmF1bHQ6IGZhbHNlKVxuICAgKiBAcGFyYW0gb3B0aW9ucy5pc0Jsb29tIC0gV2hldGhlciB0byBlbmFibGUgYmxvb20gcG9zdC1wcm9jZXNzaW5nIGVmZmVjdCAoZGVmYXVsdDogZmFsc2UpXG4gICAqIEBwYXJhbSBvcHRpb25zLnNoYWRvd01hcFNpemUgLSBTaXplIG9mIHRoZSBzaGFkb3cgbWFwIHRleHR1cmUgaW4gcGl4ZWxzIChkZWZhdWx0OiAxMDI0KVxuICAgKiBAcGFyYW0gb3B0aW9ucy5pc1NpbXBsZSAtIFdoZXRoZXIgdG8gdXNlIHNpbXBsaWZpZWQgcmVuZGVyaW5nIHdpdGhvdXQgcG9zdC1wcm9jZXNzaW5nIChkZWZhdWx0OiBmYWxzZSlcbiAgICogQHBhcmFtIG9wdGlvbnMuaXNUZW1wb3JhbEFBIC0gV2hldGhlciB0byBlbmFibGUgdGVtcG9yYWwgYW50aS1hbGlhc2luZyAoZGVmYXVsdDogZmFsc2UpLiBJdCByZXBsYWNlcyB0aGUgNHggTVNBQVxuICAgKiAgIG9mIHRoZSBtYWluIHJlbmRlciB0YXJnZXQ6IHRoZSBjYW1lcmEgcHJvamVjdGlvbiBpcyBqaXR0ZXJlZCBieSBhIHN1Yi1waXhlbCBvZmZzZXQgZXZlcnkgZnJhbWUsIGFuZCB0aGUgZnJhbWVzXG4gICAqICAgYXJlIGFjY3VtdWxhdGVkIHdpdGggbW90aW9uIHZlY3RvcnMuIElnbm9yZWQgaW4gdGhlIHNpbXBsZSBtb2RlIGFuZCBmb3IgV2ViWFIgbXVsdGktdmlldyByZW5kZXJpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgUmVzdWx0IGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlIG9mIHRoZSBzZXR1cCBvcGVyYXRpb25cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgbXVzdCBiZSBjYWxsZWQgYmVmb3JlIHVzaW5nIGFueSBvdGhlciBwaXBlbGluZSBtZXRob2RzLiBJdCBjcmVhdGVzIGFsbCBuZWNlc3NhcnlcbiAgICogZnJhbWUgYnVmZmVycywgcmVuZGVyIHRhcmdldHMsIGFuZCBleHByZXNzaW9ucyBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogVGhlIG1ldGhvZCBhdXRvbWF0aWNhbGx5IGRldGVjdHMgV2ViWFIgY2FwYWJpbGl0aWVzIGFuZCBjb25maWd1cmVzIG11bHRpLXZpZXcgcmVuZGVyaW5nXG4gICAqIHdoZW4gYXBwcm9wcmlhdGUgZm9yIFZSIGFwcGxpY2F0aW9ucy5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCByZXN1bHQgPSBhd2FpdCBwaXBlbGluZS5zZXR1cCgxOTIwLCAxMDgwLCB7XG4gICAqICAgaXNTaGFkb3c6IHRydWUsXG4gICAqICAgaXNCbG9vbTogdHJ1ZSxcbiAgICogICBzaGFkb3dNYXBTaXplOiAyMDQ4XG4gICAqIH0pO1xuICAgKlxuICAgKiBpZiAocmVzdWx0LmlzRXJyKCkpIHtcbiAgICogICBjb25zb2xlLmVycm9yKCdQaXBlbGluZSBzZXR1cCBmYWlsZWQ6JywgcmVzdWx0LmdldEVycigpKTtcbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIGFzeW5jIHNldHVwKFxuICAgIGNhbnZhc1dpZHRoOiBudW1iZXIsXG4gICAgY2FudmFzSGVpZ2h0OiBudW1iZXIsXG4gICAgeyBpc1NoYWRvdyA9IGZhbHNlLCBpc0Jsb29tID0gZmFsc2UsIHNoYWRvd01hcFNpemUgPSAxMDI0LCBpc1NpbXBsZSA9IGZhbHNlLCBpc1RlbXBvcmFsQUEgPSBmYWxzZSB9ID0ge31cbiAgKSB7XG4gICAgdGhpcy5fX3dpZHRoID0gY2FudmFzV2lkdGg7XG4gICAgdGhpcy5fX2hlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICB0aGlzLl9faXNCbG9vbSA9IGlzQmxvb207XG4gICAgdGhpcy5fX2lzU2hhZG93ID0gaXNTaGFkb3c7XG4gICAgdGhpcy5fX2lzU2ltcGxlID0gaXNTaW1wbGU7XG4gICAgdGhpcy5fX2lzVGVtcG9yYWxBQSA9IGlzVGVtcG9yYWxBQTtcbiAgICB0aGlzLl9fc2hhZG93TWFwU2l6ZSA9IHNoYWRvd01hcFNpemU7XG4gICAgaWYgKHRoaXMuX19mcmFtZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gbmV3IEVycih7XG4gICAgICAgIG1lc3NhZ2U6ICdBbHJlYWR5IHNldHVwJyxcbiAgICAgICAgZXJyb3I6IHVuZGVmaW5lZCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGZyYW1lID0gbmV3IEZyYW1lKCk7XG4gICAgdGhpcy5fX2ZyYW1lID0gZnJhbWU7XG5cbiAgICBpZiAoIXRoaXMuX19pc1NpbXBsZSkge1xuICAgICAgY29uc3Qgc2FtcGxlckZvckJhY2tCdWZmZXIgPSBuZXcgU2FtcGxlcih0aGlzLl9fZW5naW5lLCB7XG4gICAgICAgIHdyYXBTOiBUZXh0dXJlUGFyYW1ldGVyLlJlcGVhdCxcbiAgICAgICAgd3JhcFQ6IFRleHR1cmVQYXJhbWV0ZXIuUmVwZWF0LFxuICAgICAgICBtaW5GaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyTWlwbWFwTGluZWFyLFxuICAgICAgICBtYWdGaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgICAgfSk7XG4gICAgICBzYW1wbGVyRm9yQmFja0J1ZmZlci5jcmVhdGUoKTtcbiAgICAgIHRoaXMuX19zYW1wbGVyRm9yQmFja0J1ZmZlciA9IHNhbXBsZXJGb3JCYWNrQnVmZmVyO1xuICAgICAgLy8gY3JlYXRlIEZyYW1lIEJ1ZmZlcnNcbiAgICAgIHRoaXMuX19jcmVhdGVSZW5kZXJUYXJnZXRzKGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQpO1xuXG4gICAgICAvLyBkZXB0aCBtb21lbnQgRnJhbWVCdWZmZXJcbiAgICAgIGlmIChpc1NoYWRvdykge1xuICAgICAgICB0aGlzLl9fc2hhZG93U3lzdGVtID0gbmV3IFNoYWRvd1N5c3RlbSh0aGlzLl9fZW5naW5lLCBzaGFkb3dNYXBTaXplKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX19mcmFtZUJ1ZmZlclJlc29sdmVGb3JSZWZlcmVuY2UgIT0gbnVsbCAmJiAhTWlzY1V0aWwuaXNNb2JpbGUoKSkge1xuICAgICAgICAvLyBnZW5lcmF0ZSBtaXBtYXBzIGZvciBwcm9jZXNzIEtIUl9tYXRlcmlhbHNfdHJhbnNtaXR0YW5jZVxuICAgICAgICB0aGlzLl9fZ2VuZXJhdGVNaXBtYXBzRXhwcmVzc2lvbiA9IHRoaXMuX19zZXR1cEdlbmVyYXRlTWlwbWFwc0V4cHJlc3Npb24odGhpcy5fX2ZyYW1lQnVmZmVyUmVzb2x2ZUZvclJlZmVyZW5jZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9fZnJhbWVCdWZmZXJNdWx0aVZpZXcgIT0gbnVsbCkge1xuICAgICAgICAvLyBNYWtlIEJsaXQgRXhwcmVzc2lvbiBpZiBWUiBNdWx0aVZpZXcgaXMgZW5hYmxlZFxuICAgICAgICB0aGlzLl9fbXVsdGlWaWV3QmxpdEJhY2tCdWZmZXJFeHByZXNzaW9uID0gdGhpcy5fX3NldHVwTXVsdGlWaWV3QmxpdEJhY2tCdWZmZXJFeHByZXNzaW9uKFxuICAgICAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlld1xuICAgICAgICApO1xuICAgICAgICB0aGlzLl9fbXVsdGlWaWV3QmxpdEV4cHJlc3Npb24gPSB0aGlzLl9fc2V0dXBNdWx0aVZpZXdCbGl0RXhwcmVzc2lvbih0aGlzLl9fZnJhbWVCdWZmZXJNdWx0aVZpZXcpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtYWluRnJhbWVCdWZmZXJSZXNvbHZlID0gdGhpcy5fX2dldE1haW5GcmFtZUJ1ZmZlclJlc29sdmUoKSE7XG4gICAgICBsZXQgdG9uZU1hcHBpbmdUYXJnZXRSZW5kZXJUYXJnZXRUZXh0dXJlOiBSZW5kZXJUYXJnZXRUZXh0dXJlID1cbiAgICAgICAgbWFpbkZyYW1lQnVmZmVyUmVzb2x2ZS5nZXRDb2xvckF0dGFjaGVkUmVuZGVyVGFyZ2V0VGV4dHVyZSgwKSE7XG5cbiAgICAgIC8vIFRlbXBvcmFsIGFudGktYWxpYXNpbmcgKG5vdCBmb3IgbXVsdGktdmlldyByZW5kZXJpbmcsIHdob3NlIHRhcmdldHMgYXJlIHRleHR1cmUgYXJyYXlzKVxuICAgICAgaWYgKHRoaXMuX19pc1RlbXBvcmFsQUFBY3RpdmUoKSkge1xuICAgICAgICB0aGlzLl9fdGVtcG9yYWxBQSA9IG5ldyBUZW1wb3JhbEFBU3lzdGVtKFxuICAgICAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICAgICAgY2FudmFzV2lkdGgsXG4gICAgICAgICAgY2FudmFzSGVpZ2h0LFxuICAgICAgICAgIG1haW5GcmFtZUJ1ZmZlclJlc29sdmUuZ2V0Q29sb3JBdHRhY2hlZFJlbmRlclRhcmdldFRleHR1cmUoMCkhXG4gICAgICAgICk7XG4gICAgICAgIHRvbmVNYXBwaW5nVGFyZ2V0UmVuZGVyVGFyZ2V0VGV4dHVyZSA9IHRoaXMuX190ZW1wb3JhbEFBLm91dHB1dFRleHR1cmU7XG4gICAgICB9XG5cbiAgICAgIC8vIEJsb29tIEV4cHJlc3Npb25cbiAgICAgIGlmIChpc0Jsb29tKSB7XG4gICAgICAgIGNvbnN0IHRleHR1cmVUb0Jsb29tID0gdG9uZU1hcHBpbmdUYXJnZXRSZW5kZXJUYXJnZXRUZXh0dXJlO1xuICAgICAgICBjb25zdCB7IGJsb29tRXhwcmVzc2lvbiwgYmxvb21lZFJlbmRlclRhcmdldCB9ID0gdGhpcy5fX2Jsb29tSGVscGVyLmNyZWF0ZUJsb29tRXhwcmVzc2lvbih7XG4gICAgICAgICAgdGV4dHVyZVRvQmxvb20sXG4gICAgICAgICAgcGFyYW1ldGVyczoge30sXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9fYmxvb21FeHByZXNzaW9uID0gYmxvb21FeHByZXNzaW9uO1xuICAgICAgICB0b25lTWFwcGluZ1RhcmdldFJlbmRlclRhcmdldFRleHR1cmUgPSBibG9vbWVkUmVuZGVyVGFyZ2V0O1xuICAgICAgfVxuXG4gICAgICAvLyBUb25lTWFwcGluZyBFeHByZXNzaW9uXG4gICAgICBjb25zdCB0b25lTWFwcGluZ0V4cHJlc3Npb24gPSB0aGlzLl9fc2V0dXBUb25lTWFwcGluZ0V4cHJlc3Npb24odG9uZU1hcHBpbmdUYXJnZXRSZW5kZXJUYXJnZXRUZXh0dXJlKTtcbiAgICAgIHRoaXMuX190b25lTWFwcGluZ0V4cHJlc3Npb24gPSB0b25lTWFwcGluZ0V4cHJlc3Npb247XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbCBFeHByZXNzaW9uXG4gICAgdGhpcy5fX2luaXRpYWxFeHByZXNzaW9uID0gdGhpcy5fX3NldHVwSW5pdGlhbEV4cHJlc3Npb24oKTtcblxuICAgIGlmICh0aGlzLl9fZXhwcmVzc2lvbnMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5zZXRFeHByZXNzaW9ucyh0aGlzLl9fZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIGNvbnN0IFtyYXltYXJjaGluZ0V4cHJlc3Npb24sIHJheW1hcmNoaW5nUmVuZGVyUGFzc10gPSB0aGlzLl9fc2V0dXBSYXltYXJjaGluZ0V4cHJlc3Npb24oKTtcbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdFeHByZXNzaW9uID0gcmF5bWFyY2hpbmdFeHByZXNzaW9uO1xuICAgIHRoaXMuX19yYXltYXJjaGluZ1JlbmRlclBhc3MgPSByYXltYXJjaGluZ1JlbmRlclBhc3M7XG5cbiAgICB0aGlzLl9fc2V0VXBFeHByZXNzaW9uc0ZvclJlbmRlcmluZygpO1xuXG4gICAgcmV0dXJuIG5ldyBPaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1haW4gZnJhbWUgYnVmZmVyIHVzZWQgZm9yIGJhY2sgYnVmZmVyIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBmcmFtZSBidWZmZXIgZm9yIGJhY2sgYnVmZmVyIG9wZXJhdGlvbnMsIG9yIHVuZGVmaW5lZCBpZiBub3QgYXZhaWxhYmxlXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldE1haW5GcmFtZUJ1ZmZlckJhY2tCdWZmZXIoKTogRnJhbWVCdWZmZXIgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9fZnJhbWVCdWZmZXJNdWx0aVZpZXcgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlld0JsaXRCYWNrQnVmZmVyO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2ZyYW1lQnVmZmVyUmVzb2x2ZUZvclJlZmVyZW5jZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYWluIGZyYW1lIGJ1ZmZlciB1c2VkIGZvciByZXNvbHZlIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBmcmFtZSBidWZmZXIgZm9yIHJlc29sdmUgb3BlcmF0aW9ucywgb3IgdW5kZWZpbmVkIGlmIG5vdCBhdmFpbGFibGVcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0TWFpbkZyYW1lQnVmZmVyUmVzb2x2ZSgpOiBGcmFtZUJ1ZmZlciB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlldyAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2ZyYW1lQnVmZmVyTXVsdGlWaWV3QmxpdDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19mcmFtZUJ1ZmZlclJlc29sdmU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWFpbiBmcmFtZSBidWZmZXIgdXNlZCBmb3IgcmVuZGVyaW5nIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBtYWluIGZyYW1lIGJ1ZmZlciwgb3IgdW5kZWZpbmVkIGlmIG5vdCBhdmFpbGFibGVcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0TWFpbkZyYW1lQnVmZmVyKCk6IEZyYW1lQnVmZmVyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5fX2ZyYW1lQnVmZmVyTXVsdGlWaWV3ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fZnJhbWVCdWZmZXJNdWx0aVZpZXc7XG4gICAgfVxuICAgIC8vIFdpdGhvdXQgTVNBQSAodGVtcG9yYWwgYW50aS1hbGlhc2luZyksIHRoZSBzY2VuZSBpcyByZW5kZXJlZCBpbnRvIHRoZSByZXNvbHZlIHRhcmdldCBkaXJlY3RseS5cbiAgICByZXR1cm4gdGhpcy5fX2ZyYW1lQnVmZmVyTXNhYSA/PyB0aGlzLl9fZnJhbWVCdWZmZXJSZXNvbHZlO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGVtcG9yYWwgYW50aS1hbGlhc2luZyBpcyB1c2VkOiByZXF1ZXN0ZWQgaW4gc2V0dXAsIG5vdCBpbiB0aGUgc2ltcGxlIG1vZGUsIGFuZCBub3QgaW4gV2ViWFIgbW9kZVxuICAgKiAodGhlIGV5ZSBjYW1lcmFzIGFyZSBub3Qgaml0dGVyZWQsIGFuZCBzdGVyZW8gcmVuZGVyaW5nIGtlZXBzIE1TQUEpLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2lzVGVtcG9yYWxBQUFjdGl2ZSgpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuX19pc1RlbXBvcmFsQUEgfHwgdGhpcy5fX2lzU2ltcGxlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIFJlYWQgb24gdXNlOiB0aGUgWFIgc3VwcG9ydCBtYXkgYmUgZW5hYmxlZCBhZnRlciB0aGUgcGlwZWxpbmUgd2FzIHNldCB1cCAocmVzaXplKCkgcnVucyBzZXR1cCBhZ2FpbikuXG4gICAgcmV0dXJuICF0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZD8uaXNXZWJYUk1vZGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZXhwcmVzc2lvbnMgdG8gYmUgcmVuZGVyZWQgYnkgdGhlIHBpcGVsaW5lLlxuICAgKlxuICAgKiBAcGFyYW0gZXhwcmVzc2lvbnMgLSBBcnJheSBvZiBleHByZXNzaW9ucyBjb250YWluaW5nIHJlbmRlciBwYXNzZXMgYW5kIGVudGl0aWVzIHRvIHJlbmRlclxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgZXhwcmVzc2lvbiBzZXR1cFxuICAgKiBAcGFyYW0gb3B0aW9ucy5pc1RyYW5zbWlzc2lvbiAtIFdoZXRoZXIgdG8gZW5hYmxlIHRyYW5zbWlzc2lvbiByZW5kZXJpbmcgZm9yIHRyYW5zcGFyZW50IG9iamVjdHMgKGRlZmF1bHQ6IHRydWUpXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGNvbmZpZ3VyZXMgdGhlIGV4cHJlc3Npb25zIGZvciBib3RoIG9wYXF1ZSBhbmQgdHJhbnNwYXJlbnQgcmVuZGVyaW5nLlxuICAgKiBXaGVuIHRyYW5zbWlzc2lvbiBpcyBlbmFibGVkLCB0cmFuc3BhcmVudCBvYmplY3RzIGFyZSByZW5kZXJlZCBpbiBhIHNlcGFyYXRlIHBhc3NcbiAgICogdG8gc3VwcG9ydCBhZHZhbmNlZCBtYXRlcmlhbCBlZmZlY3RzIGxpa2UgZ2xhc3MgYW5kIHdhdGVyLlxuICAgKlxuICAgKiBUaGUgbWV0aG9kIGF1dG9tYXRpY2FsbHkgY2xvbmVzIGV4cHJlc3Npb25zIGZvciB0cmFuc3BhcmVudCByZW5kZXJpbmcgYW5kIGNvbmZpZ3VyZXNcbiAgICogc2hhZG93IGV4cHJlc3Npb25zIGlmIHNoYWRvdyBtYXBwaW5nIGlzIGVuYWJsZWQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgZXhwcmVzc2lvbnMgPSBbc2NlbmVFeHByZXNzaW9uLCB1aUV4cHJlc3Npb25dO1xuICAgKiBwaXBlbGluZS5zZXRFeHByZXNzaW9ucyhleHByZXNzaW9ucywgeyBpc1RyYW5zbWlzc2lvbjogdHJ1ZSB9KTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgc2V0RXhwcmVzc2lvbnMoXG4gICAgZXhwcmVzc2lvbnM6IEV4cHJlc3Npb25bXSxcbiAgICBvcHRpb25zOiB7XG4gICAgICBpc1RyYW5zbWlzc2lvbjogYm9vbGVhbjtcbiAgICB9ID0ge1xuICAgICAgaXNUcmFuc21pc3Npb246IHRydWUsXG4gICAgfVxuICApIHtcbiAgICAvLyBjb25zdCBleHByZXNzaW9uc09wYXF1ZSA9IGV4cHJlc3Npb25zLm1hcCgoZXhwcmVzc2lvbikgPT4gZXhwcmVzc2lvbi5jbG9uZSgpKTtcbiAgICBjb25zdCBleHByZXNzaW9uc1RyYW5zbHVjZW50ID0gZXhwcmVzc2lvbnMubWFwKGV4cHJlc3Npb24gPT4gZXhwcmVzc2lvbi5jbG9uZSgpKTtcbiAgICB0aGlzLl9fc2V0RXhwcmVzc2lvbnNJbm5lcihleHByZXNzaW9ucywge1xuICAgICAgaXNUcmFuc21pc3Npb246IG9wdGlvbnMuaXNUcmFuc21pc3Npb24sXG4gICAgfSk7XG4gICAgaWYgKG9wdGlvbnMuaXNUcmFuc21pc3Npb24pIHtcbiAgICAgIHRoaXMuX19zZXRUcmFuc3BhcmVudEV4cHJlc3Npb25zRm9yVHJhbnNtaXNzaW9uKGV4cHJlc3Npb25zVHJhbnNsdWNlbnQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9fc2hhZG93U3lzdGVtICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IGVudGl0aWVzID0gdGhpcy5fX2V4cHJlc3Npb25zLmZsYXRNYXAoZXhwcmVzc2lvbiA9PlxuICAgICAgICBleHByZXNzaW9uLnJlbmRlclBhc3Nlcy5mbGF0TWFwKHJlbmRlclBhc3MgPT4gcmVuZGVyUGFzcy5lbnRpdGllcylcbiAgICAgICkgYXMgSVNjZW5lR3JhcGhFbnRpdHlbXTtcbiAgICAgIHRoaXMuX19zaGFkb3dFeHByZXNzaW9ucyA9IHRoaXMuX19zaGFkb3dTeXN0ZW0uZ2V0RXhwcmVzc2lvbnMoXG4gICAgICAgIGVudGl0aWVzLFxuICAgICAgICB0aGlzLl9fZ2V0QWRkaXRpb25hbFNoYWRvd01hdGVyaWFscygpLFxuICAgICAgICB0aGlzLl9fZ2V0UmF5bWFyY2hpbmdTaGFkb3dQYXNzUHJvdmlkZXIoKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fc2V0VXBFeHByZXNzaW9uc0ZvclJlbmRlcmluZygpO1xuICB9XG5cbiAgcHVibGljIHNldEdpem1vRXhwcmVzc2lvbihleHByZXNzaW9uOiBFeHByZXNzaW9uKSB7XG4gICAgdGhpcy5fX2dpem1vRXhwcmVzc2lvbiA9IGV4cHJlc3Npb247XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIHRoZSBtYWluIHJlbmRlcmluZyBsb29wIHdpdGggdGhlIHByb3ZpZGVkIGRyYXcgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBmdW5jIC0gRnVuY3Rpb24gdG8gYmUgY2FsbGVkIGVhY2ggZnJhbWUgZm9yIHJlbmRlcmluZyBvcGVyYXRpb25zXG4gICAqIEByZXR1cm5zIEEgUmVzdWx0IGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlIG9mIHN0YXJ0aW5nIHRoZSByZW5kZXIgbG9vcFxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBiZWdpbnMgdGhlIGNvbnRpbnVvdXMgcmVuZGVyaW5nIGxvb3AgdXNpbmcgdGhlIHN5c3RlbSdzIHJlbmRlciBsb29wIG1lY2hhbmlzbS5cbiAgICogVGhlIHByb3ZpZGVkIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGV2ZXJ5IGZyYW1lIHdpdGggdGhlIGN1cnJlbnQgZnJhbWUgb2JqZWN0LlxuICAgKlxuICAgKiBUaGUgbWV0aG9kIGF1dG9tYXRpY2FsbHkgaGFuZGxlcyBzaGFkb3cgc3lzdGVtIHVwZGF0ZXMsIGV4cHJlc3Npb24gbWFuYWdlbWVudCxcbiAgICogYW5kIGZyYW1lIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgcmVzdWx0ID0gcGlwZWxpbmUuc3RhcnRSZW5kZXJMb29wKChmcmFtZSkgPT4ge1xuICAgKiAgIC8vIFVwZGF0ZSBzY2VuZVxuICAgKiAgIGVuZ2luZS5wcm9jZXNzKGZyYW1lKTtcbiAgICpcbiAgICogICAvLyBDdXN0b20gcGVyLWZyYW1lIGxvZ2ljXG4gICAqICAgdXBkYXRlQW5pbWF0aW9ucygpO1xuICAgKiAgIGhhbmRsZUlucHV0KCk7XG4gICAqIH0pO1xuICAgKlxuICAgKiBpZiAocmVzdWx0LmlzRXJyKCkpIHtcbiAgICogICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc3RhcnQgcmVuZGVyIGxvb3A6JywgcmVzdWx0LmdldFJuRXJyb3IoKSk7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBzdGFydFJlbmRlckxvb3AoZnVuYzogKGZyYW1lOiBGcmFtZSkgPT4gdm9pZCkge1xuICAgIGlmICh0aGlzLl9fZnJhbWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnIoe1xuICAgICAgICBtZXNzYWdlOiAnbm90IGluaXRpYWxpemVkLicsXG4gICAgICAgIGVycm9yOiB1bmRlZmluZWQsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9fZHJhd0Z1bmMgPSBmdW5jO1xuXG4gICAgdGhpcy5fX3NldFVwRXhwcmVzc2lvbnNGb3JSZW5kZXJpbmcoKTtcblxuICAgIHRoaXMuX19lbmdpbmUuc3RhcnRSZW5kZXJMb29wKCgpID0+IHtcbiAgICAgIC8vIFJlYWQgdGhlIGZpZWxkcyBldmVyeSBmcmFtZTogcmVzaXplKCkgcmVwbGFjZXMgdGhlIGZyYW1lIGFuZCB0aGUgc2hhZG93IHN5c3RlbS5cbiAgICAgIGNvbnN0IHNoYWRvd1N5c3RlbSA9IHRoaXMuX19zaGFkb3dTeXN0ZW07XG4gICAgICBpZiAoc2hhZG93U3lzdGVtICE9IG51bGwpIHtcbiAgICAgICAgLy8gdXBkYXRlIHNoYWRvdyBleHByZXNzaW9ucyBpZiBzaGFkb3cgbWFwcGluZyBpcyBlbmFibGVkXG4gICAgICAgIGNvbnN0IGVudGl0aWVzID0gdGhpcy5fX2VudGl0aWVzRm9yU2hhZG93O1xuICAgICAgICBjb25zdCBhZGRpdGlvbmFsTWF0ZXJpYWxzID0gdGhpcy5fX2dldEFkZGl0aW9uYWxTaGFkb3dNYXRlcmlhbHMoKTtcbiAgICAgICAgaWYgKHNoYWRvd1N5c3RlbS5pc0xpZ2h0Q2hhbmdlZCgpKSB7XG4gICAgICAgICAgdGhpcy5fX3NoYWRvd0V4cHJlc3Npb25zID0gc2hhZG93U3lzdGVtLmdldEV4cHJlc3Npb25zKFxuICAgICAgICAgICAgZW50aXRpZXMsXG4gICAgICAgICAgICBhZGRpdGlvbmFsTWF0ZXJpYWxzLFxuICAgICAgICAgICAgdGhpcy5fX2dldFJheW1hcmNoaW5nU2hhZG93UGFzc1Byb3ZpZGVyKClcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuX19zZXRVcEV4cHJlc3Npb25zRm9yUmVuZGVyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2hhZG93U3lzdGVtLnNldERlcHRoQmlhc1BWKGVudGl0aWVzLCBhZGRpdGlvbmFsTWF0ZXJpYWxzKTtcbiAgICAgIH1cbiAgICAgIC8vIFdlYkdQVSB1cGxvYWRzIG1hdGVyaWFsIHZhbHVlcyBpbiB0aGUgcHJlcmVuZGVyIHN0YWdlLCBzbyB0aGUgU0RGIHNoYWRvdyBjYXN0ZXJcbiAgICAgIC8vIHBhcmFtZXRlcnMgbXVzdCBiZSBjdXJyZW50IGJlZm9yZSBFbmdpbmUucHJvY2VzcyBydW5zLlxuICAgICAgdGhpcy5fX3N5bmNSYXltYXJjaGluZ1NoYWRvd01hdGVyaWFsUGFyYW1ldGVycygpO1xuICAgICAgdGhpcy5fX3ByZXBhcmVUZW1wb3JhbEFBRnJhbWUoKTtcbiAgICAgIGZ1bmModGhpcy5fX2ZyYW1lISk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IE9rKCk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgYSBzaW5nbGUgZnJhbWUgcmVuZGVyIHVzaW5nIHRoZSBkcmF3IGZ1bmN0aW9uIHByb3ZpZGVkIHRvIHN0YXJ0UmVuZGVyTG9vcC5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgYWxsb3dzIG1hbnVhbCBjb250cm9sIG92ZXIgZnJhbWUgcmVuZGVyaW5nIGluc3RlYWQgb2YgdXNpbmcgdGhlIGF1dG9tYXRpY1xuICAgKiByZW5kZXIgbG9vcC4gSXQgY2FsbHMgdGhlIGRyYXcgZnVuY3Rpb24gdGhhdCB3YXMgcHJvdmlkZWQgdG8gc3RhcnRSZW5kZXJMb29wLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIC8vIE1hbnVhbCBmcmFtZSByZW5kZXJpbmdcbiAgICogcGlwZWxpbmUuZHJhdygpO1xuICAgKiBgYGBcbiAgICovXG4gIGRyYXcoKSB7XG4gICAgdGhpcy5fX3ByZXBhcmVUZW1wb3JhbEFBRnJhbWUoKTtcbiAgICB0aGlzLl9fZHJhd0Z1bmMhKHRoaXMuX19mcmFtZSEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGVtcG9yYWwgYW50aS1hbGlhc2luZyBpcyBlbmFibGVkIChyZXF1ZXN0ZWQgaW4gc2V0dXAgYW5kIHN1cHBvcnRlZCBieSB0aGUgY3VycmVudCByZW5kZXIgdGFyZ2V0cykuXG4gICAqL1xuICBnZXQgaXNUZW1wb3JhbEFBKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fdGVtcG9yYWxBQSAhPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2NhcmRzIHRoZSBhY2N1bXVsYXRlZCBoaXN0b3J5IG9mIHRlbXBvcmFsIGFudGktYWxpYXNpbmcsIHNvIHRoYXQgdGhlIG5leHQgZnJhbWUgZG9lcyBub3QgYmxlbmQgd2l0aCB0aGVcbiAgICogcHJldmlvdXMgZnJhbWVzLiBDYWxsIGl0IHdoZW4gdGhlIHZpZXcgY2hhbmdlcyBkaXNjb250aW51b3VzbHkgKGUuZy4gYSBjYW1lcmEgY3V0KS5cbiAgICovXG4gIHJlc2V0VGVtcG9yYWxBQUhpc3RvcnkoKSB7XG4gICAgdGhpcy5fX3RlbXBvcmFsQUE/LnJlc2V0SGlzdG9yeSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSB3ZWlnaHQgb2YgdGhlIGN1cnJlbnQgZnJhbWUgaW4gdGhlIHRlbXBvcmFsIGFudGktYWxpYXNpbmcgYmxlbmQgZm9yIHBpeGVscyB0aGF0IG1vdmUgYnkgYSBwaXhlbCBwZXIgZnJhbWVcbiAgICogb3IgbW9yZSAoMC0xLCBkZWZhdWx0IDAuMSkuIExhcmdlciB2YWx1ZXMgcmVhY3QgZmFzdGVyIHRvIGNoYW5nZXMgYW5kIHNtb290aCBsZXNzLlxuICAgKi9cbiAgc2V0IHRlbXBvcmFsQUFDdXJyZW50RnJhbWVXZWlnaHQod2VpZ2h0OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fX3RlbXBvcmFsQUEgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3RlbXBvcmFsQUEuY3VycmVudEZyYW1lV2VpZ2h0ID0gd2VpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIGdldCB0ZW1wb3JhbEFBQ3VycmVudEZyYW1lV2VpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX190ZW1wb3JhbEFBPy5jdXJyZW50RnJhbWVXZWlnaHQgPz8gMC4xO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSB3ZWlnaHQgb2YgdGhlIGN1cnJlbnQgZnJhbWUgaW4gdGhlIHRlbXBvcmFsIGFudGktYWxpYXNpbmcgYmxlbmQgZm9yIHBpeGVscyB0aGF0IGRvIG5vdCBtb3ZlICgwLTEsIGRlZmF1bHRcbiAgICogMC4wNCkuIFNtYWxsZXIgdmFsdWVzIGF2ZXJhZ2UgbW9yZSBmcmFtZXMgb2YgdGhlIGppdHRlciBzZXF1ZW5jZSwgd2hpY2ggc3RlYWRpZXMgdGhlIGVkZ2VzIG9mIHN0aWxsIGltYWdlcztcbiAgICogc2xvd2VyIHBpeGVscyBpbnRlcnBvbGF0ZSBiZXR3ZWVuIHRoaXMgd2VpZ2h0IGFuZCB7QGxpbmsgRm9yd2FyZFJlbmRlclBpcGVsaW5lLnRlbXBvcmFsQUFDdXJyZW50RnJhbWVXZWlnaHR9LlxuICAgKi9cbiAgc2V0IHRlbXBvcmFsQUFTdGF0aWNGcmFtZVdlaWdodCh3ZWlnaHQ6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9fdGVtcG9yYWxBQSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fdGVtcG9yYWxBQS5zdGF0aWNGcmFtZVdlaWdodCA9IHdlaWdodDtcbiAgICB9XG4gIH1cblxuICBnZXQgdGVtcG9yYWxBQVN0YXRpY0ZyYW1lV2VpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX190ZW1wb3JhbEFBPy5zdGF0aWNGcmFtZVdlaWdodCA/PyAwLjA0O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHNpemUgb2YgdGhlIHZhcmlhbmNlIGNsaXBwaW5nIGJveCBvZiB0aGUgdGVtcG9yYWwgYW50aS1hbGlhc2luZyBoaXN0b3J5IGluIHN0YW5kYXJkIGRldmlhdGlvbnNcbiAgICogKGRlZmF1bHQgMSkuIEEgbGFyZ2UgdmFsdWUgZWZmZWN0aXZlbHkgZGlzYWJsZXMgdGhlIGNsaXBwaW5nLCB3aGljaCBtYWtlcyB3cm9uZyBtb3Rpb24gdmVjdG9ycyB2aXNpYmxlIGFzXG4gICAqIHRyYWlscy4gRm9yIGRlYnVnZ2luZy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfc2V0VGVtcG9yYWxBQVZhcmlhbmNlQ2xpcEdhbW1hKGdhbW1hOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fX3RlbXBvcmFsQUEgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3RlbXBvcmFsQUEudmFyaWFuY2VDbGlwR2FtbWEgPSBnYW1tYTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSml0dGVycyB0aGUgY2FtZXJhIGFuZCBrZWVwcyB0aGUgcHJldmlvdXMgZnJhbWUgc3RhdGUgZm9yIHRlbXBvcmFsIGFudGktYWxpYXNpbmcuIFJ1bnMgYmVmb3JlIEVuZ2luZS5wcm9jZXNzLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3ByZXBhcmVUZW1wb3JhbEFBRnJhbWUoKSB7XG4gICAgaWYgKHRoaXMuX190ZW1wb3JhbEFBID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcmVuZGVyUGFzc2VzID0gdGhpcy5fX2V4cHJlc3Npb25zLmZsYXRNYXAoZXhwcmVzc2lvbiA9PiBleHByZXNzaW9uLnJlbmRlclBhc3Nlcyk7XG4gICAgdGhpcy5fX3RlbXBvcmFsQUEucHJlcGFyZUZyYW1lKF9nZXRUZW1wb3JhbEFBQ2FtZXJhKHRoaXMuX19lbmdpbmUsIHJlbmRlclBhc3NlcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcXVlc3RzIGEgcmVmcmVzaCBvZiB0aGUgc2hhZG93IG1hcCBleHByZXNzaW9ucyBvbiB0aGUgbmV4dCBmcmFtZS5cbiAgICogVGhpcyBpcyB1c2VmdWwgd2hlbiBtYXRlcmlhbHMgd2l0aCBzaGFkb3cgc3VwcG9ydCBoYXZlIGJlZW4gY2hhbmdlZCBvciBhZGRlZFxuICAgKiAoZS5nLiwgYXBwbHlpbmcgYSBzaGFkZXIgd2l0aCBDbGFzc2ljU2hhZGVyIG5vZGUpLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBXaGVuIGEgbmV3IG1hdGVyaWFsIHdpdGggc2hhZG93IHN1cHBvcnQgaXMgYXBwbGllZCwgdGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZFxuICAgKiB0byBlbnN1cmUgdGhlIHNoYWRvdyB0ZXh0dXJlcyBhcmUgcHJvcGVybHkgc2V0IG9uIHRoZSBuZXcgbWF0ZXJpYWwuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogLy8gQWZ0ZXIgY2hhbmdpbmcgYSBtYXRlcmlhbCB0byBvbmUgd2l0aCBzaGFkb3cgc3VwcG9ydFxuICAgKiBwaXBlbGluZS5zZXROZWVkc1NoYWRvd01hcFJlZnJlc2goKTtcbiAgICogYGBgXG4gICAqL1xuICBzZXROZWVkc1NoYWRvd01hcFJlZnJlc2goKSB7XG4gICAgdGhpcy5fX3NoYWRvd1N5c3RlbT8uc2V0TmVlZHNSZWZyZXNoKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzaXplcyB0aGUgcmVuZGVyaW5nIHBpcGVsaW5lIHRvIG1hdGNoIG5ldyBjYW52YXMgZGltZW5zaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHdpZHRoIC0gTmV3IHdpZHRoIG9mIHRoZSByZW5kZXJpbmcgY2FudmFzXG4gICAqIEBwYXJhbSBoZWlnaHQgLSBOZXcgaGVpZ2h0IG9mIHRoZSByZW5kZXJpbmcgY2FudmFzXG4gICAqIEByZXR1cm5zIEEgUmVzdWx0IGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlIG9mIHRoZSByZXNpemUgb3BlcmF0aW9uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgY2FudmFzIHJlc2l6aW5nIGJ5IGRlc3Ryb3lpbmcgZXhpc3RpbmcgcmVzb3VyY2VzIGFuZCByZWNyZWF0aW5nXG4gICAqIHRoZW0gd2l0aCB0aGUgbmV3IGRpbWVuc2lvbnMuIEl0IGF1dG9tYXRpY2FsbHkgaGFuZGxlcyBXZWJYUiBjYW52YXMgc2l6aW5nIHdoZW5cbiAgICogaW4gVlIgbW9kZS5cbiAgICpcbiAgICogVGhlIG1ldGhvZCBwcmVzZXJ2ZXMgYWxsIGN1cnJlbnQgcGlwZWxpbmUgc2V0dGluZ3MgKHNoYWRvdywgYmxvb20sIGV0Yy4pIGR1cmluZyByZXNpemUuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICogICBjb25zdCByZXN1bHQgPSBwaXBlbGluZS5yZXNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAqICAgaWYgKHJlc3VsdC5pc0VycigpKSB7XG4gICAqICAgICBjb25zb2xlLmVycm9yKCdSZXNpemUgZmFpbGVkOicsIHJlc3VsdC5nZXRFcnIoKSk7XG4gICAqICAgfVxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICByZXNpemUod2lkdGg6IFNpemUsIGhlaWdodDogU2l6ZSkge1xuICAgIGlmICh0aGlzLl9fZnJhbWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnIoe1xuICAgICAgICBtZXNzYWdlOiAnbm90IGluaXRpYWxpemVkLicsXG4gICAgICAgIGVycm9yOiB1bmRlZmluZWQsXG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gUmVhZCBvbiB1c2U6IHRoZSBYUiBzdXBwb3J0IG1heSBiZSBlbmFibGVkIGFmdGVyIHRoZSBwaXBlbGluZSB3YXMgc2V0IHVwIChlbmdpbmUuZW5hYmxlWFIoKSkuXG4gICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICBpZiAoSXMuZXhpc3Qod2ViWFJTeXN0ZW0pICYmIHdlYlhSU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgd2lkdGggPSB3ZWJYUlN5c3RlbS5nZXRDYW52YXNXaWR0aEZvclZyKCk7XG4gICAgICBoZWlnaHQgPSB3ZWJYUlN5c3RlbS5nZXRDYW52YXNIZWlnaHRGb3JWcigpO1xuICAgIH1cblxuICAgIGlmICh3aWR0aCA8PSAwIHx8IGhlaWdodCA8PSAwKSB7XG4gICAgICBsZXQgZmFsbGJhY2tXaWR0aCA9IHRoaXMuX193aWR0aDtcbiAgICAgIGxldCBmYWxsYmFja0hlaWdodCA9IHRoaXMuX19oZWlnaHQ7XG4gICAgICBpZiAoZmFsbGJhY2tXaWR0aCA8PSAwIHx8IGZhbGxiYWNrSGVpZ2h0IDw9IDApIHtcbiAgICAgICAgY29uc3QgW2N1cnJlbnRXaWR0aCwgY3VycmVudEhlaWdodF0gPSB0aGlzLl9fZW5naW5lLmdldENhbnZhc1NpemUoKTtcbiAgICAgICAgZmFsbGJhY2tXaWR0aCA9IGN1cnJlbnRXaWR0aDtcbiAgICAgICAgZmFsbGJhY2tIZWlnaHQgPSBjdXJyZW50SGVpZ2h0O1xuICAgICAgfVxuICAgICAgaWYgKGZhbGxiYWNrV2lkdGggPD0gMCB8fCBmYWxsYmFja0hlaWdodCA8PSAwKSB7XG4gICAgICAgIGZhbGxiYWNrV2lkdGggPSAxO1xuICAgICAgICBmYWxsYmFja0hlaWdodCA9IDE7XG4gICAgICB9XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICBgRm9yd2FyZFJlbmRlclBpcGVsaW5lLnJlc2l6ZSByZWNlaXZlZCBub24tcG9zaXRpdmUgZGltZW5zaW9ucyAoJHt3aWR0aH14JHtoZWlnaHR9KS4gRmFsbGluZyBiYWNrIHRvICR7ZmFsbGJhY2tXaWR0aH14JHtmYWxsYmFja0hlaWdodH0uYFxuICAgICAgKTtcbiAgICAgIHdpZHRoID0gZmFsbGJhY2tXaWR0aDtcbiAgICAgIGhlaWdodCA9IGZhbGxiYWNrSGVpZ2h0O1xuICAgIH1cblxuICAgIC8vIFByZXNlcnZlIHJheW1hcmNoaW5nIG1hdGVyaWFsIGJlZm9yZSBkZXN0cm95aW5nIHJlc291cmNlc1xuICAgIGNvbnN0IHNhdmVkUmF5bWFyY2hpbmdNYXRlcmlhbCA9IHRoaXMuZ2V0UmF5bWFyY2hpbmdNYXRlcmlhbCgpO1xuXG4gICAgdGhpcy5fX2VuZ2luZS5yZXNpemVDYW52YXMod2lkdGgsIGhlaWdodCk7XG5cbiAgICB0aGlzLl9fZGVzdHJveVJlc291cmNlcygpO1xuICAgIHRoaXMuc2V0dXAod2lkdGgsIGhlaWdodCwge1xuICAgICAgaXNTaGFkb3c6IHRoaXMuX19pc1NoYWRvdyxcbiAgICAgIGlzQmxvb206IHRoaXMuX19pc0Jsb29tLFxuICAgICAgc2hhZG93TWFwU2l6ZTogdGhpcy5fX3NoYWRvd01hcFNpemUsXG4gICAgICBpc1NpbXBsZTogdGhpcy5fX2lzU2ltcGxlLFxuICAgICAgaXNUZW1wb3JhbEFBOiB0aGlzLl9faXNUZW1wb3JhbEFBLFxuICAgIH0pO1xuXG4gICAgLy8gUmVzdG9yZSByYXltYXJjaGluZyBtYXRlcmlhbCBhZnRlciBzZXR1cFxuICAgIGlmIChzYXZlZFJheW1hcmNoaW5nTWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5zZXRSYXltYXJjaGluZ01hdGVyaWFsKHNhdmVkUmF5bWFyY2hpbmdNYXRlcmlhbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBPaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIElCTCAoSW1hZ2UtQmFzZWQgTGlnaHRpbmcpIGN1YmUgdGV4dHVyZXMgZm9yIHJlYWxpc3RpYyBsaWdodGluZy5cbiAgICpcbiAgICogQHBhcmFtIGRpZmZ1c2UgLSBEaWZmdXNlIElCTCBjdWJlIHRleHR1cmUgZm9yIGFtYmllbnQgbGlnaHRpbmdcbiAgICogQHBhcmFtIHNwZWN1bGFyIC0gU3BlY3VsYXIgSUJMIGN1YmUgdGV4dHVyZSBmb3IgcmVmbGVjdGlvbnNcbiAgICogQHBhcmFtIHNoZWVuIC0gT3B0aW9uYWwgc2hlZW4gSUJMIGN1YmUgdGV4dHVyZSBmb3IgZmFicmljLWxpa2UgbWF0ZXJpYWxzXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIElCTCB0ZXh0dXJlcyBwcm92aWRlIHJlYWxpc3RpYyBsaWdodGluZyBieSB1c2luZyBwcmUtY29tcHV0ZWQgZW52aXJvbm1lbnQgbWFwcy5cbiAgICogVGhlIGRpZmZ1c2UgdGV4dHVyZSBwcm92aWRlcyBhbWJpZW50IGxpZ2h0aW5nLCB3aGlsZSB0aGUgc3BlY3VsYXIgdGV4dHVyZSBwcm92aWRlc1xuICAgKiByZWZsZWN0aW9ucyBhbmQgc3BlY3VsYXIgaGlnaGxpZ2h0cy5cbiAgICpcbiAgICogVGhlIHNoZWVuIHRleHR1cmUgaXMgb3B0aW9uYWwgYW5kIHVzZWQgZm9yIG1hdGVyaWFscyB3aXRoIGZhYnJpYy1saWtlIHByb3BlcnRpZXMuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgZGlmZnVzZUN1YmUgPSBuZXcgUm4uQ3ViZVRleHR1cmUoKTtcbiAgICogZGlmZnVzZUN1YmUuYmFzZVVyaVRvTG9hZCA9ICcuL2Fzc2V0cy9pYmwvZGlmZnVzZS9kaWZmdXNlJztcbiAgICogZGlmZnVzZUN1YmUuaGRyaUZvcm1hdCA9IFJuLkhkcmlGb3JtYXQuUkdCRV9QTkc7XG4gICAqXG4gICAqIGNvbnN0IHNwZWN1bGFyQ3ViZSA9IG5ldyBSbi5DdWJlVGV4dHVyZSgpO1xuICAgKiBzcGVjdWxhckN1YmUuYmFzZVVyaVRvTG9hZCA9ICcuL2Fzc2V0cy9pYmwvc3BlY3VsYXIvc3BlY3VsYXInO1xuICAgKiBzcGVjdWxhckN1YmUuaGRyaUZvcm1hdCA9IFJuLkhkcmlGb3JtYXQuUkdCRV9QTkc7XG4gICAqIHNwZWN1bGFyQ3ViZS5taXBtYXBMZXZlbE51bWJlciA9IDEwO1xuICAgKlxuICAgKiBwaXBlbGluZS5zZXRJQkxUZXh0dXJlcyhkaWZmdXNlQ3ViZSwgc3BlY3VsYXJDdWJlKTtcbiAgICogYGBgXG4gICAqL1xuICBzZXRJQkxUZXh0dXJlcyhkaWZmdXNlOiBDdWJlVGV4dHVyZSwgc3BlY3VsYXI6IEN1YmVUZXh0dXJlLCBzaGVlbj86IEN1YmVUZXh0dXJlKSB7XG4gICAgdGhpcy5fX2RpZmZ1c2VDdWJlVGV4dHVyZSA9IGRpZmZ1c2U7XG4gICAgdGhpcy5fX3NwZWN1bGFyQ3ViZVRleHR1cmUgPSBzcGVjdWxhcjtcbiAgICBpZiAoSXMuZXhpc3Qoc2hlZW4pKSB7XG4gICAgICB0aGlzLl9fc2hlZW5DdWJlVGV4dHVyZSA9IHNoZWVuO1xuICAgIH1cbiAgICB0aGlzLl9fc2V0SWJsSW5uZXIoKTtcbiAgICB0aGlzLl9fc2V0SWJsSW5uZXJGb3JUcmFuc3BhcmVudE9ubHkoKTtcbiAgICB0aGlzLl9fYXBwbHlJYmxUb1JheW1hcmNoaW5nTWF0ZXJpYWwoKTtcblxuICAgIHRoaXMuX19zZXRVcEV4cHJlc3Npb25zRm9yUmVuZGVyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5pdGlhbCBleHByZXNzaW9uIHVzZWQgZm9yIGJ1ZmZlciBjbGVhcmluZyBhbmQgc2V0dXAuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbml0aWFsIGV4cHJlc3Npb24sIG9yIHVuZGVmaW5lZCBpZiBub3QgYXZhaWxhYmxlXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoZSBpbml0aWFsIGV4cHJlc3Npb24gaXMgYXV0b21hdGljYWxseSBjcmVhdGVkIGR1cmluZyBzZXR1cCBhbmQgaGFuZGxlc1xuICAgKiBjbGVhcmluZyBvZiBjb2xvciBhbmQgZGVwdGggYnVmZmVycyBiZWZvcmUgbWFpbiByZW5kZXJpbmcgYmVnaW5zLlxuICAgKi9cbiAgZ2V0SW5pdGlhbEV4cHJlc3Npb24oKTogRXhwcmVzc2lvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19pbml0aWFsRXhwcmVzc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0b25lIG1hcHBpbmcgZXhwcmVzc2lvbiB1c2VkIGZvciBIRFIgdG8gTERSIGNvbnZlcnNpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0b25lIG1hcHBpbmcgZXhwcmVzc2lvbiwgb3IgdW5kZWZpbmVkIGlmIG5vdCBhdmFpbGFibGVcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhlIHRvbmUgbWFwcGluZyBleHByZXNzaW9uIGlzIGNyZWF0ZWQgZHVyaW5nIHNldHVwIHdoZW4gbm90IGluIHNpbXBsZSBtb2RlLlxuICAgKiBJdCBoYW5kbGVzIHRoZSBjb252ZXJzaW9uIGZyb20gaGlnaCBkeW5hbWljIHJhbmdlIHJlbmRlcmluZyB0byBsb3cgZHluYW1pYyByYW5nZVxuICAgKiBvdXRwdXQgc3VpdGFibGUgZm9yIGRpc3BsYXkgZGV2aWNlcy5cbiAgICovXG4gIGdldFRvbmVNYXBwaW5nRXhwcmVzc2lvbigpOiBFeHByZXNzaW9uIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3RvbmVNYXBwaW5nRXhwcmVzc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250cmlidXRpb24gZmFjdG9yIGZvciBkaWZmdXNlIElCTCBsaWdodGluZy5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIC0gQ29udHJpYnV0aW9uIGZhY3RvciAoMC4wIHRvIDEuMCBvciBoaWdoZXIgZm9yIG92ZXItZXhwb3N1cmUgZWZmZWN0cylcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgY29udHJvbHMgaG93IG11Y2ggdGhlIGRpZmZ1c2UgSUJMIHRleHR1cmUgY29udHJpYnV0ZXMgdG8gdGhlIGZpbmFsIGxpZ2h0aW5nLlxuICAgKiBBIHZhbHVlIG9mIDAuMCBkaXNhYmxlcyBkaWZmdXNlIElCTCwgd2hpbGUgMS4wIHByb3ZpZGVzIGZ1bGwgY29udHJpYnV0aW9uLlxuICAgKiBWYWx1ZXMgZ3JlYXRlciB0aGFuIDEuMCBjYW4gYmUgdXNlZCBmb3IgYXJ0aXN0aWMgb3Zlci1leHBvc3VyZSBlZmZlY3RzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIC8vIFJlZHVjZSBhbWJpZW50IGxpZ2h0aW5nXG4gICAqIHBpcGVsaW5lLnNldERpZmZ1c2VJQkxDb250cmlidXRpb24oMC41KTtcbiAgICpcbiAgICogLy8gRGlzYWJsZSBkaWZmdXNlIElCTFxuICAgKiBwaXBlbGluZS5zZXREaWZmdXNlSUJMQ29udHJpYnV0aW9uKDAuMCk7XG4gICAqXG4gICAqIC8vIE92ZXItZXhwb3NlIGZvciBhcnRpc3RpYyBlZmZlY3RcbiAgICogcGlwZWxpbmUuc2V0RGlmZnVzZUlCTENvbnRyaWJ1dGlvbigyLjApO1xuICAgKiBgYGBcbiAgICovXG4gIHNldERpZmZ1c2VJQkxDb250cmlidXRpb24odmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX19kaWZmdXNlSWJsQ29udHJpYnV0aW9uID0gdmFsdWU7XG4gICAgdGhpcy5fX2FwcGx5SWJsVG9SYXltYXJjaGluZ01hdGVyaWFsKCk7XG4gICAgZm9yIChjb25zdCBleHByZXNzaW9uIG9mIHRoaXMuX19leHByZXNzaW9ucykge1xuICAgICAgZm9yIChjb25zdCByZW5kZXJQYXNzIG9mIGV4cHJlc3Npb24ucmVuZGVyUGFzc2VzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHJlbmRlclBhc3MuZW50aXRpZXMpIHtcbiAgICAgICAgICBjb25zdCBtZXNoUmVuZGVyZXJDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRNZXNoUmVuZGVyZXIoKTtcbiAgICAgICAgICBpZiAoSXMuZXhpc3QobWVzaFJlbmRlcmVyQ29tcG9uZW50KSkge1xuICAgICAgICAgICAgbWVzaFJlbmRlcmVyQ29tcG9uZW50LmRpZmZ1c2VDdWJlTWFwQ29udHJpYnV0aW9uID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiB0aGlzLl9fdHJhbnNwYXJlbnRPbmx5RXhwcmVzc2lvbnMpIHtcbiAgICAgIGZvciAoY29uc3QgcmVuZGVyUGFzcyBvZiBleHByZXNzaW9uLnJlbmRlclBhc3Nlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiByZW5kZXJQYXNzLmVudGl0aWVzKSB7XG4gICAgICAgICAgY29uc3QgbWVzaFJlbmRlcmVyQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0TWVzaFJlbmRlcmVyKCk7XG4gICAgICAgICAgaWYgKElzLmV4aXN0KG1lc2hSZW5kZXJlckNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIG1lc2hSZW5kZXJlckNvbXBvbmVudC5kaWZmdXNlQ3ViZU1hcENvbnRyaWJ1dGlvbiA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250cmlidXRpb24gZmFjdG9yIGZvciBzcGVjdWxhciBJQkwgcmVmbGVjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIENvbnRyaWJ1dGlvbiBmYWN0b3IgKDAuMCB0byAxLjAgb3IgaGlnaGVyIGZvciBvdmVyLWV4cG9zdXJlIGVmZmVjdHMpXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGNvbnRyb2xzIGhvdyBtdWNoIHRoZSBzcGVjdWxhciBJQkwgdGV4dHVyZSBjb250cmlidXRlcyB0byByZWZsZWN0aW9uc1xuICAgKiBhbmQgc3BlY3VsYXIgaGlnaGxpZ2h0cy4gQSB2YWx1ZSBvZiAwLjAgZGlzYWJsZXMgc3BlY3VsYXIgSUJMLCB3aGlsZSAxLjAgcHJvdmlkZXNcbiAgICogZnVsbCBjb250cmlidXRpb24uIFZhbHVlcyBncmVhdGVyIHRoYW4gMS4wIGNhbiBjcmVhdGUgb3Zlci1leHBvc2VkIHJlZmxlY3Rpb25zLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIC8vIFN1YnRsZSByZWZsZWN0aW9uc1xuICAgKiBwaXBlbGluZS5zZXRTcGVjdWxhcklCTENvbnRyaWJ1dGlvbigwLjMpO1xuICAgKlxuICAgKiAvLyBObyByZWZsZWN0aW9uc1xuICAgKiBwaXBlbGluZS5zZXRTcGVjdWxhcklCTENvbnRyaWJ1dGlvbigwLjApO1xuICAgKlxuICAgKiAvLyBFbmhhbmNlZCByZWZsZWN0aW9uc1xuICAgKiBwaXBlbGluZS5zZXRTcGVjdWxhcklCTENvbnRyaWJ1dGlvbigxLjUpO1xuICAgKiBgYGBcbiAgICovXG4gIHNldFNwZWN1bGFySUJMQ29udHJpYnV0aW9uKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fc3BlY3VsYXJJYmxDb250cmlidXRpb24gPSB2YWx1ZTtcbiAgICB0aGlzLl9fYXBwbHlJYmxUb1JheW1hcmNoaW5nTWF0ZXJpYWwoKTtcbiAgICBmb3IgKGNvbnN0IGV4cHJlc3Npb24gb2YgdGhpcy5fX2V4cHJlc3Npb25zKSB7XG4gICAgICBmb3IgKGNvbnN0IHJlbmRlclBhc3Mgb2YgZXhwcmVzc2lvbi5yZW5kZXJQYXNzZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnRpdHkgb2YgcmVuZGVyUGFzcy5lbnRpdGllcykge1xuICAgICAgICAgIGNvbnN0IG1lc2hSZW5kZXJlckNvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldE1lc2hSZW5kZXJlcigpO1xuICAgICAgICAgIGlmIChJcy5leGlzdChtZXNoUmVuZGVyZXJDb21wb25lbnQpKSB7XG4gICAgICAgICAgICBtZXNoUmVuZGVyZXJDb21wb25lbnQuc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiB0aGlzLl9fdHJhbnNwYXJlbnRPbmx5RXhwcmVzc2lvbnMpIHtcbiAgICAgIGZvciAoY29uc3QgcmVuZGVyUGFzcyBvZiBleHByZXNzaW9uLnJlbmRlclBhc3Nlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiByZW5kZXJQYXNzLmVudGl0aWVzKSB7XG4gICAgICAgICAgY29uc3QgbWVzaFJlbmRlcmVyQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0TWVzaFJlbmRlcmVyKCk7XG4gICAgICAgICAgaWYgKElzLmV4aXN0KG1lc2hSZW5kZXJlckNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIG1lc2hSZW5kZXJlckNvbXBvbmVudC5zcGVjdWxhckN1YmVNYXBDb250cmlidXRpb24gPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcm90YXRpb24gb2YgdGhlIElCTCBlbnZpcm9ubWVudCBpbiByYWRpYW5zLlxuICAgKlxuICAgKiBAcGFyYW0gcmFkaWFuIC0gUm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBhbGxvd3Mgcm90YXRpbmcgdGhlIElCTCBlbnZpcm9ubWVudCB0byBtYXRjaCB0aGUgZGVzaXJlZCBsaWdodGluZ1xuICAgKiBkaXJlY3Rpb24uIFRoaXMgaXMgdXNlZnVsIHdoZW4gdGhlIElCTCBkb2Vzbid0IGFsaWduIHdpdGggdGhlIHNjZW5lJ3MgbGlnaHRpbmdcbiAgICogcmVxdWlyZW1lbnRzIG9yIGZvciBhcnRpc3RpYyBjb250cm9sIG92ZXIgdGhlIGVudmlyb25tZW50IGxpZ2h0aW5nLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIC8vIFJvdGF0ZSBJQkwgYnkgOTAgZGVncmVlc1xuICAgKiBwaXBlbGluZS5zZXRJQkxSb3RhdGlvbihNYXRoLlBJIC8gMik7XG4gICAqXG4gICAqIC8vIFJvdGF0ZSBJQkwgYnkgMTgwIGRlZ3JlZXNcbiAgICogcGlwZWxpbmUuc2V0SUJMUm90YXRpb24oTWF0aC5QSSk7XG4gICAqXG4gICAqIC8vIEFuaW1hdGUgSUJMIHJvdGF0aW9uXG4gICAqIGxldCByb3RhdGlvbiA9IDA7XG4gICAqIHNldEludGVydmFsKCgpID0+IHtcbiAgICogICByb3RhdGlvbiArPSAwLjAxO1xuICAgKiAgIHBpcGVsaW5lLnNldElCTFJvdGF0aW9uKHJvdGF0aW9uKTtcbiAgICogfSwgMTYpO1xuICAgKiBgYGBcbiAgICovXG4gIHNldElCTFJvdGF0aW9uKHJhZGlhbjogbnVtYmVyKSB7XG4gICAgdGhpcy5fX2libFJvdGF0aW9uID0gcmFkaWFuO1xuICAgIHRoaXMuX19hcHBseUlibFRvUmF5bWFyY2hpbmdNYXRlcmlhbCgpO1xuICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiB0aGlzLl9fZXhwcmVzc2lvbnMpIHtcbiAgICAgIGZvciAoY29uc3QgcmVuZGVyUGFzcyBvZiBleHByZXNzaW9uLnJlbmRlclBhc3Nlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiByZW5kZXJQYXNzLmVudGl0aWVzKSB7XG4gICAgICAgICAgY29uc3QgbWVzaFJlbmRlcmVyQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0TWVzaFJlbmRlcmVyKCk7XG4gICAgICAgICAgaWYgKElzLmV4aXN0KG1lc2hSZW5kZXJlckNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIG1lc2hSZW5kZXJlckNvbXBvbmVudC5yb3RhdGlvbk9mQ3ViZU1hcCA9IHJhZGlhbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRvIGNvbmZpZ3VyZSBleHByZXNzaW9ucyBmb3Igb3BhcXVlIGFuZCBibGVuZGVkIHJlbmRlcmluZy5cbiAgICpcbiAgICogQHBhcmFtIGV4cHJlc3Npb25zIC0gQXJyYXkgb2YgZXhwcmVzc2lvbnMgdG8gY29uZmlndXJlXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAqIEBwYXJhbSBvcHRpb25zLmlzVHJhbnNtaXNzaW9uIC0gV2hldGhlciB0cmFuc21pc3Npb24gcmVuZGVyaW5nIGlzIGVuYWJsZWRcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fc2V0RXhwcmVzc2lvbnNJbm5lcihcbiAgICBleHByZXNzaW9uczogRXhwcmVzc2lvbltdLFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIGlzVHJhbnNtaXNzaW9uOiBib29sZWFuO1xuICAgIH0gPSB7XG4gICAgICBpc1RyYW5zbWlzc2lvbjogdHJ1ZSxcbiAgICB9XG4gICkge1xuICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiBleHByZXNzaW9ucykge1xuICAgICAgZm9yIChjb25zdCBycCBvZiBleHByZXNzaW9uLnJlbmRlclBhc3Nlcykge1xuICAgICAgICBycC5zZXRUb1JlbmRlck9wYXF1ZVByaW1pdGl2ZXModHJ1ZSk7XG4gICAgICAgIHJwLnNldFRvUmVuZGVyQmxlbmRXaXRoWldyaXRlUHJpbWl0aXZlcyh0cnVlKTtcbiAgICAgICAgcnAuc2V0VG9SZW5kZXJCbGVuZFdpdGhvdXRaV3JpdGVQcmltaXRpdmVzKHRydWUpO1xuICAgICAgICBpZiAob3B0aW9ucy5pc1RyYW5zbWlzc2lvbikge1xuICAgICAgICAgIC8vIGlmIG9wdGlvbnMuaXNUcmFuc21pc3Npb24gaXMgdHJ1ZSwgc2V0IHRvUmVuZGVyVHJhbnNwYXJlbnRQcmltaXRpdmVzIHRvIGZhbHNlLFxuICAgICAgICAgIC8vIGJlY2F1c2UgdHJhbnNwYXJlbnQgcHJpbWl0aXZlcyBhcmUgcmVuZGVyZWQgaW4gbGF0ZXIgZXhwcmVzc2lvbi5cbiAgICAgICAgICBycC5zZXRUb1JlbmRlclRyYW5zbHVjZW50UHJpbWl0aXZlcyhmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gaWYgb3B0aW9ucy5pc1RyYW5zbWlzc2lvbiBpcyBmYWxzZSwgc2V0IHRvUmVuZGVyVHJhbnNwYXJlbnRQcmltaXRpdmVzIHRvIHRydWUuXG4gICAgICAgICAgLy8gYmVjYXVzZSB0cmFuc3BhcmVudCBwcmltaXRpdmVzIGFyZSByZW5kZXJlZCBpbiB0aGlzIGV4cHJlc3Npb24gYXMgd2VsbCBhcyBvcGFxdWUgcHJpbWl0aXZlcy5cbiAgICAgICAgICBycC5zZXRUb1JlbmRlclRyYW5zbHVjZW50UHJpbWl0aXZlcyh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFyaW5nIGRlcHRoIGlzIGRvbmUgaW4gaW5pdGlhbCBleHByZXNzaW9uLiBzbyBubyBuZWVkIHRvIGNsZWFyIGRlcHRoIGluIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAgICAgIHJwLnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IGZhbHNlO1xuICAgICAgICBpZiAoIXRoaXMuX19pc1NpbXBsZSkge1xuICAgICAgICAgIGNvbnN0IG1haW5GcmFtZUJ1ZmZlciA9IHRoaXMuX19nZXRNYWluRnJhbWVCdWZmZXIoKTtcbiAgICAgICAgICBpZiAobWFpbkZyYW1lQnVmZmVyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJwLnNldEZyYW1lYnVmZmVyKG1haW5GcmFtZUJ1ZmZlcik7XG4gICAgICAgICAgICBpZiAodGhpcy5fX2ZyYW1lQnVmZmVyTXNhYSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHJwLnNldFJlc29sdmVGcmFtZWJ1ZmZlcih0aGlzLl9fZnJhbWVCdWZmZXJSZXNvbHZlISk7XG4gICAgICAgICAgICAgIHJwLnNldFJlc29sdmVGcmFtZWJ1ZmZlcjIodGhpcy5fX2ZyYW1lQnVmZmVyUmVzb2x2ZUZvclJlZmVyZW5jZSEpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9fZnJhbWVCdWZmZXJNdWx0aVZpZXcgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAvLyBObyBNU0FBICh0ZW1wb3JhbCBhbnRpLWFsaWFzaW5nKTogdGhlIHJlbmRlciB0YXJnZXQgaXMgY29waWVkIGludG8gdGhlIGJhY2sgYnVmZmVyIHRoYXQgdGhlXG4gICAgICAgICAgICAgIC8vIHRyYW5zbWlzc2lvbiBwYXNzIHNhbXBsZXMuXG4gICAgICAgICAgICAgIHJwLnNldFJlc29sdmVGcmFtZWJ1ZmZlcih1bmRlZmluZWQpO1xuICAgICAgICAgICAgICBycC5zZXRSZXNvbHZlRnJhbWVidWZmZXIyKHRoaXMuX19mcmFtZUJ1ZmZlclJlc29sdmVGb3JSZWZlcmVuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9fZXhwcmVzc2lvbnMgPSBleHByZXNzaW9ucztcbiAgICB0aGlzLl9fc2V0SWJsSW5uZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBtZXRob2QgdG8gY29uZmlndXJlIGV4cHJlc3Npb25zIHNwZWNpZmljYWxseSBmb3IgdHJhbnNwYXJlbnQgb2JqZWN0IHRyYW5zbWlzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGV4cHJlc3Npb25zIC0gQXJyYXkgb2YgZXhwcmVzc2lvbnMgdG8gY29uZmlndXJlIGZvciB0cmFuc21pc3Npb25cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2Qgc2V0cyB1cCBleHByZXNzaW9ucyBmb3IgcmVuZGVyaW5nIHRyYW5zcGFyZW50IG9iamVjdHMgd2l0aCB0cmFuc21pc3Npb25cbiAgICogZWZmZWN0cyBsaWtlIGdsYXNzIGFuZCB3YXRlci4gSXQgY29uZmlndXJlcyBiYWNrIGJ1ZmZlciBhY2Nlc3MgZm9yIHJlZnJhY3Rpb24gZWZmZWN0cy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fc2V0VHJhbnNwYXJlbnRFeHByZXNzaW9uc0ZvclRyYW5zbWlzc2lvbihleHByZXNzaW9uczogRXhwcmVzc2lvbltdKSB7XG4gICAgZm9yIChjb25zdCBleHByZXNzaW9uIG9mIGV4cHJlc3Npb25zKSB7XG4gICAgICBleHByZXNzaW9uLnRyeVRvU2V0VW5pcXVlTmFtZSgnbW9kZWxUcmFuc3BhcmVudEZvclRyYW5zbWlzc2lvbicsIHRydWUpO1xuICAgICAgZm9yIChjb25zdCBycCBvZiBleHByZXNzaW9uLnJlbmRlclBhc3Nlcykge1xuICAgICAgICBycC5zZXRUb1JlbmRlck9wYXF1ZVByaW1pdGl2ZXMoZmFsc2UpOyAvLyBub3QgdG8gcmVuZGVyIG9wYXF1ZSBwcmltaXRpdmVzIGluIHRyYW5zbWlzc2lvbiBleHByZXNzaW9uLlxuICAgICAgICBycC5zZXRUb1JlbmRlclRyYW5zbHVjZW50UHJpbWl0aXZlcyh0cnVlKTtcbiAgICAgICAgcnAuc2V0VG9SZW5kZXJCbGVuZFdpdGhaV3JpdGVQcmltaXRpdmVzKGZhbHNlKTtcbiAgICAgICAgcnAuc2V0VG9SZW5kZXJCbGVuZFdpdGhvdXRaV3JpdGVQcmltaXRpdmVzKGZhbHNlKTtcbiAgICAgICAgcnAudG9DbGVhckRlcHRoQnVmZmVyID0gZmFsc2U7XG4gICAgICAgIC8vIFRoaXMgY2xvbmUgZHJhd3MgdHJhbnNsdWNlbnQgcHJpbWl0aXZlcyBvdmVyIHRoZSBhbHJlYWR5IHJlbmRlcmVkIG1haW4gaW1hZ2UsIGFuZCBpdFxuICAgICAgICAvLyByZW5kZXJzIGludG8gdGhlIG1haW4gZnJhbWVidWZmZXIsIHNvIGNsZWFyaW5nIHRoZSBjb2xvciBidWZmZXIgaGVyZSB3b3VsZCB3aXBlIHRoZVxuICAgICAgICAvLyBtYWluIHBhc3MuIFRoZSBjbGVhciBmbGFncyBhcmUgaW5oZXJpdGVkIGZyb20gdGhlIGFwcGxpY2F0aW9uJ3MgcmVuZGVyIHBhc3MuXG4gICAgICAgIHJwLnRvQ2xlYXJDb2xvckJ1ZmZlciA9IGZhbHNlO1xuICAgICAgICAvLyBycC5pc0RlcHRoVGVzdCA9IGZhbHNlO1xuICAgICAgICAvLyBycC5kZXB0aFdyaXRlTWFzayA9IGZhbHNlO1xuICAgICAgICBpZiAoIXRoaXMuX19pc1NpbXBsZSkge1xuICAgICAgICAgIHJwLnNldEZyYW1lYnVmZmVyKHRoaXMuX19nZXRNYWluRnJhbWVCdWZmZXIoKSEpO1xuICAgICAgICAgIC8vIFdpdGhvdXQgTVNBQSwgdGhlIG1haW4gcmVuZGVyIHRhcmdldCBpcyB0aGUgcmVzb2x2ZSB0YXJnZXQgaXRzZWxmLlxuICAgICAgICAgIGlmICh0aGlzLl9fZnJhbWVCdWZmZXJNc2FhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJwLnNldFJlc29sdmVGcmFtZWJ1ZmZlcih0aGlzLl9fZnJhbWVCdWZmZXJSZXNvbHZlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcnAuc2V0UmVzb2x2ZUZyYW1lYnVmZmVyKHVuZGVmaW5lZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHJwLmVudGl0aWVzKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNoQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0TWVzaCgpO1xuICAgICAgICAgICAgaWYgKElzLmV4aXN0KG1lc2hDb21wb25lbnQpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG1lc2ggPSBtZXNoQ29tcG9uZW50Lm1lc2g7XG4gICAgICAgICAgICAgIGlmIChJcy5leGlzdChtZXNoKSkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzaC5nZXRQcmltaXRpdmVOdW1iZXIoKTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoLmdldFByaW1pdGl2ZUF0KGkpO1xuICAgICAgICAgICAgICAgICAgcHJpbWl0aXZlLm1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICAgICAgICAgICAgICdiYWNrQnVmZmVyVGV4dHVyZScsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX19nZXRNYWluRnJhbWVCdWZmZXJCYWNrQnVmZmVyKCkhLmdldENvbG9yQXR0YWNoZWRSZW5kZXJUYXJnZXRUZXh0dXJlKDApISxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX3NhbXBsZXJGb3JCYWNrQnVmZmVyIVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX3RyYW5zcGFyZW50T25seUV4cHJlc3Npb25zID0gZXhwcmVzc2lvbnM7XG4gICAgdGhpcy5fX3NldElibElubmVyRm9yVHJhbnNwYXJlbnRPbmx5KCk7XG4gIH1cblxuICAvKipcbiAgICogUmVmcmVzaGVzIHRoZSBiYWNrIGJ1ZmZlciB0ZXh0dXJlIG9uIGFsbCB0cmFuc3BhcmVudCBtYXRlcmlhbHMuXG4gICAqIFRoaXMgaXMgdXNlZnVsIHdoZW4gbWF0ZXJpYWxzIGFyZSBkeW5hbWljYWxseSBjaGFuZ2VkIGFuZCBuZWVkIHRvIGhhdmVcbiAgICogdGhlIGJhY2sgYnVmZmVyIHRleHR1cmUgcmUtYXBwbGllZCBmb3IgdHJhbnNtaXNzaW9uIHJlbmRlcmluZy5cbiAgICpcbiAgICogQ2FsbCB0aGlzIG1ldGhvZCBhZnRlciBjaGFuZ2luZyBtYXRlcmlhbHMgb24gZW50aXRpZXMgdGhhdCB1c2UgdHJhbnNtaXNzaW9uXG4gICAqIHRvIGVuc3VyZSB0aGUgYmFjayBidWZmZXIgdGV4dHVyZSBpcyBwcm9wZXJseSBzZXQuXG4gICAqL1xuICBwdWJsaWMgcmVmcmVzaEJhY2tCdWZmZXJUZXh0dXJlT25UcmFuc3BhcmVudE1hdGVyaWFscygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX2lzU2ltcGxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGJhY2tCdWZmZXJUZXh0dXJlID0gdGhpcy5fX2dldE1haW5GcmFtZUJ1ZmZlckJhY2tCdWZmZXIoKT8uZ2V0Q29sb3JBdHRhY2hlZFJlbmRlclRhcmdldFRleHR1cmUoMCk7XG4gICAgY29uc3Qgc2FtcGxlciA9IHRoaXMuX19zYW1wbGVyRm9yQmFja0J1ZmZlcjtcbiAgICBpZiAoYmFja0J1ZmZlclRleHR1cmUgPT0gbnVsbCB8fCBzYW1wbGVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb25zdCBleHByZXNzaW9uIG9mIHRoaXMuX190cmFuc3BhcmVudE9ubHlFeHByZXNzaW9ucykge1xuICAgICAgZm9yIChjb25zdCBycCBvZiBleHByZXNzaW9uLnJlbmRlclBhc3Nlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBycC5lbnRpdGllcykge1xuICAgICAgICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRNZXNoKCk7XG4gICAgICAgICAgaWYgKElzLmV4aXN0KG1lc2hDb21wb25lbnQpKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNoID0gbWVzaENvbXBvbmVudC5tZXNoO1xuICAgICAgICAgICAgaWYgKElzLmV4aXN0KG1lc2gpKSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzaC5nZXRQcmltaXRpdmVOdW1iZXIoKTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJpbWl0aXZlID0gbWVzaC5nZXRQcmltaXRpdmVBdChpKTtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmUubWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignYmFja0J1ZmZlclRleHR1cmUnLCBiYWNrQnVmZmVyVGV4dHVyZSwgc2FtcGxlcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgY29uZmlndXJlcyB0aGUgaW5pdGlhbCBleHByZXNzaW9uIGZvciBidWZmZXIgY2xlYXJpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjb25maWd1cmVkIGluaXRpYWwgZXhwcmVzc2lvblxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgX19zZXR1cEluaXRpYWxFeHByZXNzaW9uKCkge1xuICAgIGNvbnN0IGV4cHJlc3Npb24gPSBuZXcgRXhwcmVzc2lvbigpO1xuICAgIGV4cHJlc3Npb24udHJ5VG9TZXRVbmlxdWVOYW1lKCdJbml0aWFsJywgdHJ1ZSk7XG5cbiAgICAvLyByZW5kZXIgcGFzcyB0byBjbGVhciBidWZmZXJzIG9mIHJlbmRlciB0ZXh0dXJlXG4gICAgY29uc3QgaW5pdGlhbFJlbmRlclBhc3MgPSBuZXcgUmVuZGVyUGFzcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpbml0aWFsUmVuZGVyUGFzcy5jbGVhckNvbG9yID0gVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMC4wLCAwLjAsIDAuMCwgMC4wXSk7XG4gICAgaW5pdGlhbFJlbmRlclBhc3MudG9DbGVhckNvbG9yQnVmZmVyID0gdHJ1ZTtcbiAgICBpbml0aWFsUmVuZGVyUGFzcy50b0NsZWFyRGVwdGhCdWZmZXIgPSB0cnVlO1xuICAgIGluaXRpYWxSZW5kZXJQYXNzLmlzT3V0cHV0Rm9yVnIgPSB0cnVlO1xuICAgIGluaXRpYWxSZW5kZXJQYXNzLnRyeVRvU2V0VW5pcXVlTmFtZSgnSW5pdGlhbFJlbmRlclBhc3MnLCB0cnVlKTtcbiAgICBleHByZXNzaW9uLmFkZFJlbmRlclBhc3NlcyhbaW5pdGlhbFJlbmRlclBhc3NdKTtcblxuICAgIC8vIHJlbmRlciBwYXNzIHRvIGNsZWFyIGJ1ZmZlcnMgb2YgZnJhbWVidWZmZXJcbiAgICBpZiAoIXRoaXMuX19pc1NpbXBsZSkge1xuICAgICAgY29uc3QgaW5pdGlhbFJlbmRlclBhc3NGb3JGcmFtZUJ1ZmZlciA9IG5ldyBSZW5kZXJQYXNzKHRoaXMuX19lbmdpbmUpO1xuICAgICAgaW5pdGlhbFJlbmRlclBhc3NGb3JGcmFtZUJ1ZmZlci5jbGVhckNvbG9yID0gVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMC4wLCAwLjAsIDAuMCwgMC4wXSk7XG4gICAgICBpbml0aWFsUmVuZGVyUGFzc0ZvckZyYW1lQnVmZmVyLnRvQ2xlYXJDb2xvckJ1ZmZlciA9IHRydWU7XG4gICAgICBpbml0aWFsUmVuZGVyUGFzc0ZvckZyYW1lQnVmZmVyLnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IHRydWU7XG4gICAgICBpbml0aWFsUmVuZGVyUGFzc0ZvckZyYW1lQnVmZmVyLnNldEZyYW1lYnVmZmVyKHRoaXMuX19nZXRNYWluRnJhbWVCdWZmZXIoKSEpO1xuICAgICAgaW5pdGlhbFJlbmRlclBhc3NGb3JGcmFtZUJ1ZmZlci50cnlUb1NldFVuaXF1ZU5hbWUoJ0luaXRpYWxSZW5kZXJQYXNzRm9yRnJhbWVCdWZmZXInLCB0cnVlKTtcbiAgICAgIGV4cHJlc3Npb24uYWRkUmVuZGVyUGFzc2VzKFtpbml0aWFsUmVuZGVyUGFzc0ZvckZyYW1lQnVmZmVyXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4cHJlc3Npb247XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyByZW5kZXIgdGFyZ2V0cyBhbmQgZnJhbWUgYnVmZmVycyBiYXNlZCBvbiBjYW52YXMgZGltZW5zaW9ucyBhbmQgV2ViWFIgc3VwcG9ydC5cbiAgICpcbiAgICogQHBhcmFtIGNhbnZhc1dpZHRoIC0gV2lkdGggb2YgdGhlIGNhbnZhc1xuICAgKiBAcGFyYW0gY2FudmFzSGVpZ2h0IC0gSGVpZ2h0IG9mIHRoZSBjYW52YXNcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgYXV0b21hdGljYWxseSBkZXRlY3RzIFdlYlhSIG11bHRpLXZpZXcgc3VwcG9ydCBhbmQgY3JlYXRlcyBhcHByb3ByaWF0ZVxuICAgKiByZW5kZXIgdGFyZ2V0cy4gRm9yIFZSLCBpdCBjcmVhdGVzIHRleHR1cmUgYXJyYXlzIGZvciBtdWx0aS12aWV3IHJlbmRlcmluZy5cbiAgICogRm9yIHJlZ3VsYXIgcmVuZGVyaW5nLCBpdCBjcmVhdGVzIE1TQUEgZnJhbWUgYnVmZmVycyB3aXRoIHJlc29sdmUgdGFyZ2V0cy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fY3JlYXRlUmVuZGVyVGFyZ2V0cyhjYW52YXNXaWR0aDogbnVtYmVyLCBjYW52YXNIZWlnaHQ6IG51bWJlcikge1xuICAgIGNvbnN0IHdlYlhSU3lzdGVtID0gdGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGlmIChcbiAgICAgIElzLmV4aXN0KHdlYlhSU3lzdGVtKSAmJlxuICAgICAgd2ViWFJTeXN0ZW0/LmlzV2ViWFJNb2RlICYmXG4gICAgICBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5pc1N1cHBvcnRNdWx0aVZpZXdWUlJlbmRlcmluZyh0aGlzLl9fZW5naW5lKVxuICAgICkge1xuICAgICAgY29uc3QgZnJhbWVidWZmZXJNdWx0aVZpZXcgPSBSZW5kZXJhYmxlSGVscGVyLmNyZWF0ZUZyYW1lQnVmZmVyVGV4dHVyZUFycmF5Rm9yTXVsdGlWaWV3KHRoaXMuX19lbmdpbmUsIHtcbiAgICAgICAgd2lkdGg6IGNhbnZhc1dpZHRoIC8gMixcbiAgICAgICAgaGVpZ2h0OiBjYW52YXNIZWlnaHQsXG4gICAgICAgIGFycmF5TGVuZ3RoOiAyLFxuICAgICAgICBsZXZlbDogMCxcbiAgICAgICAgaW50ZXJuYWxGb3JtYXQ6IHRoaXMuX19pc0Jsb29tID8gVGV4dHVyZUZvcm1hdC5SMTFGX0cxMUZfQjEwRiA6IFRleHR1cmVGb3JtYXQuUkdCQTgsXG4gICAgICAgIGZvcm1hdDogdGhpcy5fX2lzQmxvb20gPyBQaXhlbEZvcm1hdC5SR0IgOiBQaXhlbEZvcm1hdC5SR0JBLFxuICAgICAgICB0eXBlOiB0aGlzLl9faXNCbG9vbSA/IENvbXBvbmVudFR5cGUuRmxvYXQgOiBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZSxcbiAgICAgIH0pO1xuICAgICAgZnJhbWVidWZmZXJNdWx0aVZpZXcudHJ5VG9TZXRVbmlxdWVOYW1lKCdGcmFtZWJ1ZmZlclRhcmdldE9mVG9uZU1hcHBpbmdNdWx0aVZpZXcnLCB0cnVlKTtcbiAgICAgIGNvbnN0IGZyYW1lYnVmZmVyTXVsdGlWaWV3QmxpdCA9IFJlbmRlcmFibGVIZWxwZXIuY3JlYXRlRnJhbWVCdWZmZXIodGhpcy5fX2VuZ2luZSwge1xuICAgICAgICB3aWR0aDogY2FudmFzV2lkdGgsXG4gICAgICAgIGhlaWdodDogY2FudmFzSGVpZ2h0LFxuICAgICAgICB0ZXh0dXJlTnVtOiAxLFxuICAgICAgICB0ZXh0dXJlRm9ybWF0czogW3RoaXMuX19pc0Jsb29tID8gVGV4dHVyZUZvcm1hdC5SMTFGX0cxMUZfQjEwRiA6IFRleHR1cmVGb3JtYXQuUkdCQThdLFxuICAgICAgICBjcmVhdGVEZXB0aEJ1ZmZlcjogZmFsc2UsXG4gICAgICB9KTtcblxuICAgICAgZnJhbWVidWZmZXJNdWx0aVZpZXdCbGl0LnRyeVRvU2V0VW5pcXVlTmFtZSgnRnJhbWVidWZmZXJUYXJnZXRPZlRvbmVNYXBwaW5nTXVsdGlWaWV3QmxpdCcsIHRydWUpO1xuXG4gICAgICBjb25zdCBmcmFtZWJ1ZmZlck11bHRpVmlld0JsaXRCYWNrQnVmZmVyID0gUmVuZGVyYWJsZUhlbHBlci5jcmVhdGVGcmFtZUJ1ZmZlcih0aGlzLl9fZW5naW5lLCB7XG4gICAgICAgIHdpZHRoOiBjYW52YXNXaWR0aCxcbiAgICAgICAgaGVpZ2h0OiBjYW52YXNIZWlnaHQsXG4gICAgICAgIHRleHR1cmVOdW06IDEsXG4gICAgICAgIHRleHR1cmVGb3JtYXRzOiBbdGhpcy5fX2lzQmxvb20gPyBUZXh0dXJlRm9ybWF0LlIxMUZfRzExRl9CMTBGIDogVGV4dHVyZUZvcm1hdC5SR0JBOF0sXG4gICAgICAgIGNyZWF0ZURlcHRoQnVmZmVyOiBmYWxzZSxcbiAgICAgIH0pO1xuICAgICAgZnJhbWVidWZmZXJNdWx0aVZpZXdCbGl0QmFja0J1ZmZlci50cnlUb1NldFVuaXF1ZU5hbWUoXG4gICAgICAgICdGcmFtZWJ1ZmZlclRhcmdldE9mVG9uZU1hcHBpbmdNdWx0aVZpZXdCbGl0QmFja0J1ZmZlcicsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlldyA9IGZyYW1lYnVmZmVyTXVsdGlWaWV3O1xuICAgICAgdGhpcy5fX2ZyYW1lQnVmZmVyTXVsdGlWaWV3QmxpdCA9IGZyYW1lYnVmZmVyTXVsdGlWaWV3QmxpdDtcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlld0JsaXRCYWNrQnVmZmVyID0gZnJhbWVidWZmZXJNdWx0aVZpZXdCbGl0QmFja0J1ZmZlcjtcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlck1zYWEgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fZnJhbWVCdWZmZXJSZXNvbHZlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX2ZyYW1lQnVmZmVyUmVzb2x2ZUZvclJlZmVyZW5jZSA9IHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coYGNhbnZhc1dpZHRoOiAke2NhbnZhc1dpZHRofSwgY2FudmFzSGVpZ2h0OiAke2NhbnZhc0hlaWdodH1gKTtcbiAgICAgIC8vIE1TQUEgZGVwdGguIFRlbXBvcmFsIGFudGktYWxpYXNpbmcgcmVwbGFjZXMgTVNBQTogdGhlIHNjZW5lIGlzIHJlbmRlcmVkIGludG8gdGhlIHJlc29sdmUgdGFyZ2V0IGRpcmVjdGx5LlxuICAgICAgbGV0IGZyYW1lYnVmZmVyTXNhYTogRnJhbWVCdWZmZXIgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoIXRoaXMuX19pc1RlbXBvcmFsQUFBY3RpdmUoKSkge1xuICAgICAgICBmcmFtZWJ1ZmZlck1zYWEgPSBSZW5kZXJhYmxlSGVscGVyLmNyZWF0ZUZyYW1lQnVmZmVyTVNBQSh0aGlzLl9fZW5naW5lLCB7XG4gICAgICAgICAgd2lkdGg6IGNhbnZhc1dpZHRoLFxuICAgICAgICAgIGhlaWdodDogY2FudmFzSGVpZ2h0LFxuICAgICAgICAgIGNvbG9yQnVmZmVyTnVtOiAxLFxuICAgICAgICAgIGNvbG9yRm9ybWF0czogW3RoaXMuX19pc0Jsb29tID8gVGV4dHVyZUZvcm1hdC5SMTFGX0cxMUZfQjEwRiA6IFRleHR1cmVGb3JtYXQuUkdCQThdLFxuICAgICAgICAgIHNhbXBsZUNvdW50TVNBQTogNCxcbiAgICAgICAgICBkZXB0aEJ1ZmZlckZvcm1hdDogVGV4dHVyZUZvcm1hdC5EZXB0aDMyRixcbiAgICAgICAgfSk7XG4gICAgICAgIGZyYW1lYnVmZmVyTXNhYS50cnlUb1NldFVuaXF1ZU5hbWUoJ0ZyYW1lYnVmZmVyVGFyZ2V0T2ZUb25lTWFwcGluZ01zYWEnLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVzb2x2ZSBDb2xvciAxXG4gICAgICBjb25zdCBmcmFtZWJ1ZmZlclJlc29sdmUgPSBSZW5kZXJhYmxlSGVscGVyLmNyZWF0ZUZyYW1lQnVmZmVyKHRoaXMuX19lbmdpbmUsIHtcbiAgICAgICAgd2lkdGg6IGNhbnZhc1dpZHRoLFxuICAgICAgICBoZWlnaHQ6IGNhbnZhc0hlaWdodCxcbiAgICAgICAgdGV4dHVyZU51bTogMSxcbiAgICAgICAgdGV4dHVyZUZvcm1hdHM6IFt0aGlzLl9faXNCbG9vbSA/IFRleHR1cmVGb3JtYXQuUjExRl9HMTFGX0IxMEYgOiBUZXh0dXJlRm9ybWF0LlJHQkE4XSxcbiAgICAgICAgY3JlYXRlRGVwdGhCdWZmZXI6IHRydWUsXG4gICAgICAgIGRlcHRoVGV4dHVyZUZvcm1hdDogVGV4dHVyZUZvcm1hdC5EZXB0aDMyRixcbiAgICAgIH0pO1xuICAgICAgZnJhbWVidWZmZXJSZXNvbHZlLnRyeVRvU2V0VW5pcXVlTmFtZSgnRnJhbWVidWZmZXJUYXJnZXRPZlRvbmVNYXBwaW5nUmVzb2x2ZScsIHRydWUpO1xuXG4gICAgICAvLyBSZXNvbHZlIENvbG9yIDJcbiAgICAgIGNvbnN0IGZyYW1lYnVmZmVyUmVzb2x2ZUZvclJlZmVyZW5jZSA9IFJlbmRlcmFibGVIZWxwZXIuY3JlYXRlRnJhbWVCdWZmZXIodGhpcy5fX2VuZ2luZSwge1xuICAgICAgICB3aWR0aDogY2FudmFzV2lkdGgsXG4gICAgICAgIGhlaWdodDogY2FudmFzSGVpZ2h0LFxuICAgICAgICB0ZXh0dXJlTnVtOiAxLFxuICAgICAgICB0ZXh0dXJlRm9ybWF0czogW3RoaXMuX19pc0Jsb29tID8gVGV4dHVyZUZvcm1hdC5SMTFGX0cxMUZfQjEwRiA6IFRleHR1cmVGb3JtYXQuUkdCQThdLFxuICAgICAgICBjcmVhdGVEZXB0aEJ1ZmZlcjogZmFsc2UsXG4gICAgICB9KTtcbiAgICAgIGZyYW1lYnVmZmVyUmVzb2x2ZUZvclJlZmVyZW5jZS50cnlUb1NldFVuaXF1ZU5hbWUoJ0ZyYW1lYnVmZmVyVGFyZ2V0T2ZUb25lTWFwcGluZ1Jlc29sdmVGb3JSZWZlcmVuY2UnLCB0cnVlKTtcblxuICAgICAgLy8gRnJhbWVCdWZmZXJzXG4gICAgICB0aGlzLl9fZnJhbWVCdWZmZXJNdWx0aVZpZXcgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fZnJhbWVCdWZmZXJNdWx0aVZpZXdCbGl0ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX2ZyYW1lQnVmZmVyTXVsdGlWaWV3QmxpdEJhY2tCdWZmZXIgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fZnJhbWVCdWZmZXJNc2FhID0gZnJhbWVidWZmZXJNc2FhO1xuICAgICAgdGhpcy5fX2ZyYW1lQnVmZmVyUmVzb2x2ZSA9IGZyYW1lYnVmZmVyUmVzb2x2ZTtcbiAgICAgIHRoaXMuX19mcmFtZUJ1ZmZlclJlc29sdmVGb3JSZWZlcmVuY2UgPSBmcmFtZWJ1ZmZlclJlc29sdmVGb3JSZWZlcmVuY2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYW4gZXhwcmVzc2lvbiBmb3IgZ2VuZXJhdGluZyBtaXBtYXBzIG9uIHJlc29sdmUgZnJhbWUgYnVmZmVycy5cbiAgICpcbiAgICogQHBhcmFtIHJlc29sdmVGcmFtZWJ1ZmZlcjIgLSBUaGUgZnJhbWUgYnVmZmVyIHRvIGdlbmVyYXRlIG1pcG1hcHMgZm9yXG4gICAqIEByZXR1cm5zIFRoZSBjb25maWd1cmVkIG1pcG1hcCBnZW5lcmF0aW9uIGV4cHJlc3Npb25cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fc2V0dXBHZW5lcmF0ZU1pcG1hcHNFeHByZXNzaW9uKHJlc29sdmVGcmFtZWJ1ZmZlcjI6IEZyYW1lQnVmZmVyKSB7XG4gICAgY29uc3QgZXhwcmVzc2lvbiA9IG5ldyBFeHByZXNzaW9uKCk7XG4gICAgZXhwcmVzc2lvbi50cnlUb1NldFVuaXF1ZU5hbWUoJ0dlbmVyYXRlTWlwbWFwcycsIHRydWUpO1xuICAgIGNvbnN0IHJlbmRlclBhc3MgPSBuZXcgUmVuZGVyUGFzcyh0aGlzLl9fZW5naW5lKTtcbiAgICBleHByZXNzaW9uLmFkZFJlbmRlclBhc3NlcyhbcmVuZGVyUGFzc10pO1xuICAgIHJlbmRlclBhc3MudHJ5VG9TZXRVbmlxdWVOYW1lKCdHZW5lcmF0ZU1pcG1hcHMnLCB0cnVlKTtcblxuICAgIHJlbmRlclBhc3MudG9DbGVhckRlcHRoQnVmZmVyID0gZmFsc2U7XG5cbiAgICAvLyBHZW5lcmF0ZSBNaXBtYXAgb2YgcmVzb2x2ZSBGcmFtZWJ1ZmZlciAyXG4gICAgcmVuZGVyUGFzcy5zZXRQb3N0UmVuZGVyRnVuY3Rpb24oZnVuY3Rpb24gKHRoaXM6IFJlbmRlclBhc3MpOiB2b2lkIHtcbiAgICAgIGNvbnN0IHJlbmRlclRhcmdldFRleHR1cmUgPSByZXNvbHZlRnJhbWVidWZmZXIyLmdldENvbG9yQXR0YWNoZWRSZW5kZXJUYXJnZXRUZXh0dXJlKDApITtcbiAgICAgIHJlbmRlclRhcmdldFRleHR1cmUuZ2VuZXJhdGVNaXBtYXBzKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZXhwcmVzc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGFuIGV4cHJlc3Npb24gZm9yIGJsaXR0aW5nIG11bHRpLXZpZXcgcmVuZGVyaW5nIHRvIGJhY2sgYnVmZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gbXVsdGlWaWV3RnJhbWVCdWZmZXIgLSBUaGUgbXVsdGktdmlldyBmcmFtZSBidWZmZXIgdG8gYmxpdCBmcm9tXG4gICAqIEByZXR1cm5zIFRoZSBjb25maWd1cmVkIGJsaXQgZXhwcmVzc2lvblxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgX19zZXR1cE11bHRpVmlld0JsaXRCYWNrQnVmZmVyRXhwcmVzc2lvbihtdWx0aVZpZXdGcmFtZUJ1ZmZlcjogRnJhbWVCdWZmZXIpIHtcbiAgICBjb25zdCBleHByZXNzaW9uID0gbmV3IEV4cHJlc3Npb24oKTtcbiAgICBleHByZXNzaW9uLnRyeVRvU2V0VW5pcXVlTmFtZSgnTXVsdGlWaWV3QmxpdEJhY2tCdWZmZXInLCB0cnVlKTtcbiAgICBjb25zdCByZW5kZXJQYXNzID0gbmV3IFJlbmRlclBhc3ModGhpcy5fX2VuZ2luZSk7XG4gICAgZXhwcmVzc2lvbi5hZGRSZW5kZXJQYXNzZXMoW3JlbmRlclBhc3NdKTtcbiAgICByZW5kZXJQYXNzLnRyeVRvU2V0VW5pcXVlTmFtZSgnTXVsdGlWaWV3QmxpdEJhY2tCdWZmZXInLCB0cnVlKTtcblxuICAgIHJlbmRlclBhc3MudG9DbGVhckRlcHRoQnVmZmVyID0gZmFsc2U7XG5cbiAgICAvLyBHZW5lcmF0ZSBNaXBtYXAgb2YgcmVzb2x2ZSBGcmFtZWJ1ZmZlciAyXG4gICAgcmVuZGVyUGFzcy5zZXRQb3N0UmVuZGVyRnVuY3Rpb24oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlld0JsaXRCYWNrQnVmZmVyICE9IG51bGwgJiYgIU1pc2NVdGlsLmlzTW9iaWxlKCkpIHtcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlld0JsaXRCYWNrQnVmZmVyLmNvbG9yQXR0YWNobWVudHNbMF0gYXMgUmVuZGVyVGFyZ2V0VGV4dHVyZTJEQXJyYXk7XG4gICAgICAgIChtdWx0aVZpZXdGcmFtZUJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzWzBdIGFzIFJlbmRlclRhcmdldFRleHR1cmUyREFycmF5KS5ibGl0VG9UZXh0dXJlMmRGcm9tVGV4dHVyZTJkQXJyYXlGYWtlKFxuICAgICAgICAgIHRleHR1cmVcbiAgICAgICAgKTtcbiAgICAgICAgdGV4dHVyZS5nZW5lcmF0ZU1pcG1hcHMoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBleHByZXNzaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYW4gZXhwcmVzc2lvbiBmb3IgYmxpdHRpbmcgbXVsdGktdmlldyByZW5kZXJpbmcgcmVzdWx0cy5cbiAgICpcbiAgICogQHBhcmFtIG11bHRpVmlld0ZyYW1lQnVmZmVyIC0gVGhlIG11bHRpLXZpZXcgZnJhbWUgYnVmZmVyIHRvIGJsaXQgZnJvbVxuICAgKiBAcmV0dXJucyBUaGUgY29uZmlndXJlZCBibGl0IGV4cHJlc3Npb25cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fc2V0dXBNdWx0aVZpZXdCbGl0RXhwcmVzc2lvbihtdWx0aVZpZXdGcmFtZUJ1ZmZlcjogRnJhbWVCdWZmZXIpIHtcbiAgICBjb25zdCBleHByZXNzaW9uID0gbmV3IEV4cHJlc3Npb24oKTtcbiAgICBleHByZXNzaW9uLnRyeVRvU2V0VW5pcXVlTmFtZSgnTXVsdGlWaWV3QmxpdCcsIHRydWUpO1xuICAgIGNvbnN0IHJlbmRlclBhc3MgPSBuZXcgUmVuZGVyUGFzcyh0aGlzLl9fZW5naW5lKTtcbiAgICBleHByZXNzaW9uLmFkZFJlbmRlclBhc3NlcyhbcmVuZGVyUGFzc10pO1xuICAgIHJlbmRlclBhc3MudHJ5VG9TZXRVbmlxdWVOYW1lKCdNdWx0aVZpZXdCbGl0JywgdHJ1ZSk7XG5cbiAgICByZW5kZXJQYXNzLnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IGZhbHNlO1xuXG4gICAgLy8gR2VuZXJhdGUgTWlwbWFwIG9mIHJlc29sdmUgRnJhbWVidWZmZXIgMlxuICAgIHJlbmRlclBhc3Muc2V0UG9zdFJlbmRlckZ1bmN0aW9uKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLl9fZnJhbWVCdWZmZXJNdWx0aVZpZXdCbGl0ICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMuX19mcmFtZUJ1ZmZlck11bHRpVmlld0JsaXQuY29sb3JBdHRhY2htZW50c1swXSBhcyBSZW5kZXJUYXJnZXRUZXh0dXJlMkRBcnJheTtcbiAgICAgICAgKG11bHRpVmlld0ZyYW1lQnVmZmVyLmNvbG9yQXR0YWNobWVudHNbMF0gYXMgUmVuZGVyVGFyZ2V0VGV4dHVyZTJEQXJyYXkpLmJsaXRUb1RleHR1cmUyZEZyb21UZXh0dXJlMmRBcnJheUZha2UoXG4gICAgICAgICAgdGV4dHVyZVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGV4cHJlc3Npb247XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCB0aGUgdG9uZSBtYXBwaW5nIGV4cHJlc3Npb24gZm9yIEhEUiB0byBMRFIgY29udmVyc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHRvbmVNYXBwaW5nVGFyZ2V0UmVuZGVyVGFyZ2V0VGV4dHVyZSAtIFRoZSByZW5kZXIgdGFyZ2V0IHRleHR1cmUgdG8gYXBwbHkgdG9uZSBtYXBwaW5nIHRvXG4gICAqIEByZXR1cm5zIFRoZSBjb25maWd1cmVkIHRvbmUgbWFwcGluZyBleHByZXNzaW9uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGNyZWF0ZXMgYm90aCByZWd1bGFyIGFuZCBWUi1zcGVjaWZpYyB0b25lIG1hcHBpbmcgcmVuZGVyIHBhc3Nlcy5cbiAgICogVGhlIHRvbmUgbWFwcGluZyBjb252ZXJ0cyBoaWdoIGR5bmFtaWMgcmFuZ2UgcmVuZGVyaW5nIHJlc3VsdHMgdG8gbG93IGR5bmFtaWMgcmFuZ2VcbiAgICogb3V0cHV0IHN1aXRhYmxlIGZvciBkaXNwbGF5IGRldmljZXMuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldHVwVG9uZU1hcHBpbmdFeHByZXNzaW9uKHRvbmVNYXBwaW5nVGFyZ2V0UmVuZGVyVGFyZ2V0VGV4dHVyZTogUmVuZGVyVGFyZ2V0VGV4dHVyZSkge1xuICAgIGNvbnN0IGV4cHJlc3Npb25Ub25lTWFwcGluZ0VmZmVjdCA9IG5ldyBFeHByZXNzaW9uKCk7XG4gICAgY29uc3QgbWF0ZXJpYWxUb25lTWFwcGluZyA9IGNyZWF0ZVRvbmVNYXBwaW5nTWF0ZXJpYWwodGhpcy5fX2VuZ2luZSk7XG4gICAgdGhpcy5fX3RvbmVNYXBwaW5nTWF0ZXJpYWwgPSBtYXRlcmlhbFRvbmVNYXBwaW5nO1xuICAgIHRoaXMuc2V0VG9uZU1hcHBpbmdUeXBlKHRoaXMuX190b25lTWFwcGluZ1R5cGUpO1xuXG4gICAgLy8gUmVuZGVyaW5nIGZvciBDYW52YXMgRnJhbWUgQnVmZmVyXG4gICAgY29uc3QgcmVuZGVyUGFzc1RvbmVNYXBwaW5nID0gUmVuZGVyUGFzc0hlbHBlci5jcmVhdGVTY3JlZW5EcmF3UmVuZGVyUGFzc1dpdGhCYXNlQ29sb3JUZXh0dXJlKFxuICAgICAgdGhpcy5fX2VuZ2luZSxcbiAgICAgIG1hdGVyaWFsVG9uZU1hcHBpbmcsXG4gICAgICB0b25lTWFwcGluZ1RhcmdldFJlbmRlclRhcmdldFRleHR1cmVcbiAgICApO1xuICAgIHJlbmRlclBhc3NUb25lTWFwcGluZy50cnlUb1NldFVuaXF1ZU5hbWUoJ3JlbmRlclBhc3NUb25lTWFwcGluZycsIHRydWUpO1xuICAgIHJlbmRlclBhc3NUb25lTWFwcGluZy50b0NsZWFyQ29sb3JCdWZmZXIgPSBmYWxzZTtcbiAgICByZW5kZXJQYXNzVG9uZU1hcHBpbmcudG9DbGVhckRlcHRoQnVmZmVyID0gZmFsc2U7XG4gICAgcmVuZGVyUGFzc1RvbmVNYXBwaW5nLmlzRGVwdGhUZXN0ID0gZmFsc2U7XG4gICAgcmVuZGVyUGFzc1RvbmVNYXBwaW5nLmNsZWFyQ29sb3IgPSBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFswLjAsIDAuMCwgMC4wLCAwLjBdKTtcbiAgICByZW5kZXJQYXNzVG9uZU1hcHBpbmcuaXNWclJlbmRlcmluZyA9IGZhbHNlO1xuICAgIHJlbmRlclBhc3NUb25lTWFwcGluZy5pc091dHB1dEZvclZyID0gZmFsc2U7XG5cbiAgICAvLyBSZW5kZXJpbmcgZm9yIFZSIEhlYWRTZXQgRnJhbWUgQnVmZmVyXG4gICAgY29uc3QgcmVuZGVyUGFzc1RvbmVNYXBwaW5nVnIgPSBSZW5kZXJQYXNzSGVscGVyLmNyZWF0ZVNjcmVlbkRyYXdSZW5kZXJQYXNzV2l0aEJhc2VDb2xvclRleHR1cmUoXG4gICAgICB0aGlzLl9fZW5naW5lLFxuICAgICAgbWF0ZXJpYWxUb25lTWFwcGluZyxcbiAgICAgIHRvbmVNYXBwaW5nVGFyZ2V0UmVuZGVyVGFyZ2V0VGV4dHVyZVxuICAgICk7XG4gICAgcmVuZGVyUGFzc1RvbmVNYXBwaW5nVnIudHJ5VG9TZXRVbmlxdWVOYW1lKCdyZW5kZXJQYXNzVG9uZU1hcHBpbmdWcicsIHRydWUpO1xuICAgIHJlbmRlclBhc3NUb25lTWFwcGluZ1ZyLnRvQ2xlYXJDb2xvckJ1ZmZlciA9IGZhbHNlO1xuICAgIHJlbmRlclBhc3NUb25lTWFwcGluZ1ZyLnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IGZhbHNlO1xuICAgIHJlbmRlclBhc3NUb25lTWFwcGluZ1ZyLmlzRGVwdGhUZXN0ID0gZmFsc2U7XG4gICAgcmVuZGVyUGFzc1RvbmVNYXBwaW5nVnIuY2xlYXJDb2xvciA9IFZlY3RvcjQuZnJvbUNvcHlBcnJheTQoWzAuMCwgMC4wLCAwLjAsIDAuMF0pO1xuICAgIHJlbmRlclBhc3NUb25lTWFwcGluZ1ZyLmlzVnJSZW5kZXJpbmcgPSBmYWxzZTtcbiAgICByZW5kZXJQYXNzVG9uZU1hcHBpbmdWci5pc091dHB1dEZvclZyID0gdHJ1ZTtcblxuICAgIGV4cHJlc3Npb25Ub25lTWFwcGluZ0VmZmVjdC5hZGRSZW5kZXJQYXNzZXMoW3JlbmRlclBhc3NUb25lTWFwcGluZywgcmVuZGVyUGFzc1RvbmVNYXBwaW5nVnJdKTtcblxuICAgIHJldHVybiBleHByZXNzaW9uVG9uZU1hcHBpbmdFZmZlY3Q7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZyYW1lIGJ1ZmZlciBmb3IgZGVwdGggbW9tZW50IHNoYWRvdyBtYXBwaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gc2hhZG93TWFwU2l6ZSAtIFNpemUgb2YgdGhlIHNoYWRvdyBtYXAgaW4gcGl4ZWxzXG4gICAqIEByZXR1cm5zIFRoZSBjb25maWd1cmVkIGRlcHRoIG1vbWVudCBmcmFtZSBidWZmZXJcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fc2V0dXBEZXB0aE1vbWVudEZyYW1lYnVmZmVyKHNoYWRvd01hcFNpemU6IG51bWJlcikge1xuICAgIHJldHVybiBSZW5kZXJhYmxlSGVscGVyLmNyZWF0ZUZyYW1lQnVmZmVyKHRoaXMuX19lbmdpbmUsIHtcbiAgICAgIHdpZHRoOiBzaGFkb3dNYXBTaXplLFxuICAgICAgaGVpZ2h0OiBzaGFkb3dNYXBTaXplLFxuICAgICAgdGV4dHVyZU51bTogMSxcbiAgICAgIHRleHR1cmVGb3JtYXRzOiBbVGV4dHVyZUZvcm1hdC5SRzMyRl0sXG4gICAgICBjcmVhdGVEZXB0aEJ1ZmZlcjogdHJ1ZSxcbiAgICAgIGRlcHRoVGV4dHVyZUZvcm1hdDogVGV4dHVyZUZvcm1hdC5EZXB0aDMyRixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBtZXRob2QgdG8gYXBwbHkgSUJMIHRleHR1cmVzIHRvIGFsbCBleHByZXNzaW9ucy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fc2V0SWJsSW5uZXIoKSB7XG4gICAgZm9yIChjb25zdCBleHByZXNzaW9uIG9mIHRoaXMuX19leHByZXNzaW9ucykge1xuICAgICAgZm9yIChjb25zdCByZW5kZXJQYXNzIG9mIGV4cHJlc3Npb24ucmVuZGVyUGFzc2VzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHJlbmRlclBhc3MuZW50aXRpZXMpIHtcbiAgICAgICAgICBjb25zdCBtZXNoUmVuZGVyZXJDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRNZXNoUmVuZGVyZXIoKTtcbiAgICAgICAgICBpZiAoSXMuZXhpc3QobWVzaFJlbmRlcmVyQ29tcG9uZW50KSkge1xuICAgICAgICAgICAgbWVzaFJlbmRlcmVyQ29tcG9uZW50LnNldElCTEN1YmVNYXAoXG4gICAgICAgICAgICAgIHRoaXMuX19kaWZmdXNlQ3ViZVRleHR1cmUhLFxuICAgICAgICAgICAgICB0aGlzLl9fc3BlY3VsYXJDdWJlVGV4dHVyZSEsXG4gICAgICAgICAgICAgIHRoaXMuX19zaGVlbkN1YmVUZXh0dXJlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBtZXRob2QgdG8gYXBwbHkgSUJMIHRleHR1cmVzIHRvIHRyYW5zcGFyZW50LW9ubHkgZXhwcmVzc2lvbnMuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldElibElubmVyRm9yVHJhbnNwYXJlbnRPbmx5KCkge1xuICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiB0aGlzLl9fdHJhbnNwYXJlbnRPbmx5RXhwcmVzc2lvbnMpIHtcbiAgICAgIGZvciAoY29uc3QgcmVuZGVyUGFzcyBvZiBleHByZXNzaW9uLnJlbmRlclBhc3Nlcykge1xuICAgICAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiByZW5kZXJQYXNzLmVudGl0aWVzKSB7XG4gICAgICAgICAgY29uc3QgbWVzaFJlbmRlcmVyQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0TWVzaFJlbmRlcmVyKCk7XG4gICAgICAgICAgaWYgKElzLmV4aXN0KG1lc2hSZW5kZXJlckNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIG1lc2hSZW5kZXJlckNvbXBvbmVudC5zZXRJQkxDdWJlTWFwKFxuICAgICAgICAgICAgICB0aGlzLl9fZGlmZnVzZUN1YmVUZXh0dXJlISxcbiAgICAgICAgICAgICAgdGhpcy5fX3NwZWN1bGFyQ3ViZVRleHR1cmUhLFxuICAgICAgICAgICAgICB0aGlzLl9fc2hlZW5DdWJlVGV4dHVyZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdG9uZSBtYXBwaW5nIGFsZ29yaXRobSB1c2VkIGZvciBIRFIgdG8gTERSIGNvbnZlcnNpb24uXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHRvbmUgbWFwcGluZyBhbGdvcml0aG0gdG8gdXNlXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRvbmUgbWFwcGluZyBpcyBlc3NlbnRpYWwgZm9yIGNvbnZlcnRpbmcgaGlnaCBkeW5hbWljIHJhbmdlIHJlbmRlcmluZyByZXN1bHRzXG4gICAqIHRvIGxvdyBkeW5hbWljIHJhbmdlIG91dHB1dCB0aGF0IGNhbiBiZSBkaXNwbGF5ZWQgb24gc3RhbmRhcmQgbW9uaXRvcnMuXG4gICAqXG4gICAqIEF2YWlsYWJsZSB0b25lIG1hcHBpbmcgYWxnb3JpdGhtczpcbiAgICogLSBLaHJvbm9zUGJyTmV1dHJhbDogS2hyb25vcyBQQlIgbmV1dHJhbCB0b25lIG1hcHBpbmdcbiAgICogLSBSZWluaGFyZDogQ2xhc3NpYyBSZWluaGFyZCB0b25lIG1hcHBpbmdcbiAgICogLSBHVF9Ub25lTWFwOiBHVCB0b25lIG1hcHBpbmcgKGRlZmF1bHQpXG4gICAqIC0gQUNFU19OYXJrb3dpY3o6IEFDRVMgdG9uZSBtYXBwaW5nIGJ5IE5hcmtvd2ljelxuICAgKiAtIEFDRVNfSGlsbDogQUNFUyB0b25lIG1hcHBpbmcgYnkgSGlsbFxuICAgKiAtIEFDRVNfSGlsbF9FeHBvc3VyZV9Cb29zdDogQUNFUyBIaWxsIHdpdGggZXhwb3N1cmUgYm9vc3RcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiAvLyBVc2UgQUNFUyB0b25lIG1hcHBpbmcgZm9yIGNpbmVtYXRpYyBsb29rXG4gICAqIHBpcGVsaW5lLnNldFRvbmVNYXBwaW5nVHlwZShSbi5Ub25lTWFwcGluZ1R5cGUuQUNFU19IaWxsKTtcbiAgICpcbiAgICogLy8gVXNlIFJlaW5oYXJkIGZvciBjbGFzc2ljIGxvb2tcbiAgICogcGlwZWxpbmUuc2V0VG9uZU1hcHBpbmdUeXBlKFJuLlRvbmVNYXBwaW5nVHlwZS5SZWluaGFyZCk7XG4gICAqXG4gICAqIC8vIFVzZSBLaHJvbm9zIFBCUiBuZXV0cmFsIGZvciBhY2N1cmF0ZSBjb2xvcnNcbiAgICogcGlwZWxpbmUuc2V0VG9uZU1hcHBpbmdUeXBlKFJuLlRvbmVNYXBwaW5nVHlwZS5LaHJvbm9zUGJyTmV1dHJhbCk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIHNldFRvbmVNYXBwaW5nVHlwZSh0eXBlOiBUb25lTWFwcGluZ1R5cGVFbnVtKSB7XG4gICAgY29uc3QgdG9uZU1hcHBpbmdNYXRlcmlhbCA9IHRoaXMuX190b25lTWFwcGluZ01hdGVyaWFsO1xuICAgIGlmICh0b25lTWFwcGluZ01hdGVyaWFsID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX3RvbmVNYXBwaW5nVHlwZSA9IHR5cGU7XG5cbiAgICB0b25lTWFwcGluZ01hdGVyaWFsLnJlbW92ZVNoYWRlckRlZmluZSgnUk5fVVNFX0tIUk9OT1NfUEJSX05FVVRSQUwnKTtcbiAgICB0b25lTWFwcGluZ01hdGVyaWFsLnJlbW92ZVNoYWRlckRlZmluZSgnUk5fVVNFX1JFSU5IQVJEJyk7XG4gICAgdG9uZU1hcHBpbmdNYXRlcmlhbC5yZW1vdmVTaGFkZXJEZWZpbmUoJ1JOX1VTRV9HVF9UT05FTUFQJyk7XG4gICAgdG9uZU1hcHBpbmdNYXRlcmlhbC5yZW1vdmVTaGFkZXJEZWZpbmUoJ1JOX1VTRV9BQ0VTX05BUktPV0lDWicpO1xuICAgIHRvbmVNYXBwaW5nTWF0ZXJpYWwucmVtb3ZlU2hhZGVyRGVmaW5lKCdSTl9VU0VfQUNFU19ISUxMJyk7XG4gICAgdG9uZU1hcHBpbmdNYXRlcmlhbC5yZW1vdmVTaGFkZXJEZWZpbmUoJ1JOX1VTRV9BQ0VTX0hJTExfRVhQT1NVUkVfQk9PU1QnKTtcblxuICAgIGlmICh0eXBlID09PSBUb25lTWFwcGluZ1R5cGUuS2hyb25vc1Bick5ldXRyYWwpIHtcbiAgICAgIHRvbmVNYXBwaW5nTWF0ZXJpYWwuYWRkU2hhZGVyRGVmaW5lKCdSTl9VU0VfS0hST05PU19QQlJfTkVVVFJBTCcpO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9uZU1hcHBpbmdUeXBlLlJlaW5oYXJkKSB7XG4gICAgICB0b25lTWFwcGluZ01hdGVyaWFsLmFkZFNoYWRlckRlZmluZSgnUk5fVVNFX1JFSU5IQVJEJyk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBUb25lTWFwcGluZ1R5cGUuR1RfVG9uZU1hcCkge1xuICAgICAgdG9uZU1hcHBpbmdNYXRlcmlhbC5hZGRTaGFkZXJEZWZpbmUoJ1JOX1VTRV9HVF9UT05FTUFQJyk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBUb25lTWFwcGluZ1R5cGUuQUNFU19OYXJrb3dpY3opIHtcbiAgICAgIHRvbmVNYXBwaW5nTWF0ZXJpYWwuYWRkU2hhZGVyRGVmaW5lKCdSTl9VU0VfQUNFU19OQVJLT1dJQ1onKTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFRvbmVNYXBwaW5nVHlwZS5BQ0VTX0hpbGwpIHtcbiAgICAgIHRvbmVNYXBwaW5nTWF0ZXJpYWwuYWRkU2hhZGVyRGVmaW5lKCdSTl9VU0VfQUNFU19ISUxMJyk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBUb25lTWFwcGluZ1R5cGUuQUNFU19IaWxsX0V4cG9zdXJlX0Jvb3N0KSB7XG4gICAgICB0b25lTWFwcGluZ01hdGVyaWFsLmFkZFNoYWRlckRlZmluZSgnUk5fVVNFX0FDRVNfSElMTF9FWFBPU1VSRV9CT09TVCcpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19zZXR1cFJheW1hcmNoaW5nRXhwcmVzc2lvbigpOiBbRXhwcmVzc2lvbiwgUmVuZGVyUGFzc10ge1xuICAgIGNvbnN0IGV4cHJlc3Npb24gPSBuZXcgRXhwcmVzc2lvbigpO1xuICAgIGV4cHJlc3Npb24udHJ5VG9TZXRVbmlxdWVOYW1lKCdSYXltYXJjaGluZycsIHRydWUpO1xuICAgIGNvbnN0IHJlbmRlclBhc3MgPSBuZXcgUmVuZGVyUGFzcyh0aGlzLl9fZW5naW5lKTtcbiAgICByZW5kZXJQYXNzLnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IGZhbHNlO1xuICAgIHJlbmRlclBhc3MuaXNEZXB0aFRlc3QgPSB0cnVlO1xuICAgIHRoaXMuX19jb25maWd1cmVSYXltYXJjaGluZ1Bhc3NUYXJnZXRzKHJlbmRlclBhc3MpO1xuICAgIHJlbmRlclBhc3Muc2V0UHJlUmVuZGVyRnVuY3Rpb24oKCkgPT4gdGhpcy5fX3ByZXBhcmVMZWdhY3lSYXltYXJjaGluZ1Bhc3MocmVuZGVyUGFzcykpO1xuXG4gICAgZXhwcmVzc2lvbi5hZGRSZW5kZXJQYXNzZXMoW3JlbmRlclBhc3NdKTtcbiAgICByZW5kZXJQYXNzLnRyeVRvU2V0VW5pcXVlTmFtZSgnUmF5bWFyY2hpbmcnLCB0cnVlKTtcblxuICAgIHJldHVybiBbZXhwcmVzc2lvbiwgcmVuZGVyUGFzc107XG4gIH1cblxuICAvKipcbiAgICogUG9pbnRzIGEgYnVmZmVyLWxlc3MgcmF5bWFyY2hpbmcgcGFzcyBhdCB0aGUgcGlwZWxpbmUncyByZW5kZXIgdGFyZ2V0cywgaW5jbHVkaW5nXG4gICAqIHRoZSBNU0FBIHJlc29sdmUgdGFyZ2V0cyB0aGUgdHJhbnNtaXNzaW9uIHBhc3MgYW5kIG1pcG1hcCBnZW5lcmF0aW9uIHJlYWQuXG4gICAqL1xuICBwcml2YXRlIF9fY29uZmlndXJlUmF5bWFyY2hpbmdQYXNzVGFyZ2V0cyhyZW5kZXJQYXNzOiBSZW5kZXJQYXNzKSB7XG4gICAgY29uc3QgbWFpbkZyYW1lQnVmZmVyID0gdGhpcy5fX2dldE1haW5GcmFtZUJ1ZmZlcigpO1xuICAgIHJlbmRlclBhc3Muc2V0RnJhbWVidWZmZXIobWFpbkZyYW1lQnVmZmVyKTtcbiAgICBpZiAobWFpbkZyYW1lQnVmZmVyICE9IG51bGwgJiYgdGhpcy5fX2ZyYW1lQnVmZmVyTXNhYSAhPSBudWxsKSB7XG4gICAgICByZW5kZXJQYXNzLnNldFJlc29sdmVGcmFtZWJ1ZmZlcih0aGlzLl9fZnJhbWVCdWZmZXJSZXNvbHZlISk7XG4gICAgICAvLyBUaGUgcmVmZXJlbmNlIHJlc29sdmUgdGFyZ2V0IGlzIHRoZSBiYWNrIGJ1ZmZlciB0aGUgdHJhbnNtaXNzaW9uIHBhc3Mgc2FtcGxlcy5cbiAgICAgIC8vIFJlc29sdmluZyB0aGUgcmF5bWFyY2hpbmcgcmVzdWx0IGludG8gaXQga2VlcHMgdGhlIFNERiBpbiB0aGUgc2NlbmUgY29sb3IgdGhhdFxuICAgICAgLy8gdHJhbnNwYXJlbnQgbWF0ZXJpYWxzIHJlZnJhY3QsIGFuZCBpbiB0aGUgbWlwbWFwcyBnZW5lcmF0ZWQgYWZ0ZXIgdGhpcyBwYXNzLlxuICAgICAgcmVuZGVyUGFzcy5zZXRSZXNvbHZlRnJhbWVidWZmZXIyKHRoaXMuX19mcmFtZUJ1ZmZlclJlc29sdmVGb3JSZWZlcmVuY2UgPz8gdW5kZWZpbmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVuZGVyUGFzcy5zZXRSZXNvbHZlRnJhbWVidWZmZXIodW5kZWZpbmVkKTtcbiAgICAgIC8vIFdpdGhvdXQgTVNBQSAodGVtcG9yYWwgYW50aS1hbGlhc2luZyksIHRoZSByZW5kZXIgdGFyZ2V0IGlzIGNvcGllZCBpbnRvIHRoZSBiYWNrIGJ1ZmZlciBkaXJlY3RseS5cbiAgICAgIHJlbmRlclBhc3Muc2V0UmVzb2x2ZUZyYW1lYnVmZmVyMihtYWluRnJhbWVCdWZmZXIgIT0gbnVsbCA/IHRoaXMuX19mcmFtZUJ1ZmZlclJlc29sdmVGb3JSZWZlcmVuY2UgOiB1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQZXItZnJhbWUgc2V0dXAgb2YgdGhlIGxlZ2FjeSBtZXJnZWQgcmF5bWFyY2hpbmcgcGFzcy5cbiAgICpcbiAgICogVGhlIG1lcmdlZCBtYXRlcmlhbCBldmFsdWF0ZXMgZXZlcnkgY29tcG9uZW50J3MgZ3JhcGggaW4gb25lIGRpc3RhbmNlIGZ1bmN0aW9uLFxuICAgKiBzbyB0aGUgb2JqZWN0IGlkIGFuZCB3b3JsZCBtYXRyaXggdW5pZm9ybXMgYXJlIHBvc3RmaXhlZCB3aXRoIHRoZSBjb21wb25lbnQgU0lELFxuICAgKiBhbmQgdGhlIG1hcmNoIGlzIGNsaXBwZWQgdG8gdGhlIHVuaW9uIG9mIGFsbCBjb21wb25lbnQgQUFCQnMuXG4gICAqXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIGxlZ2FjeSByYXltYXJjaGluZyBwYXNzXG4gICAqL1xuICBwcml2YXRlIF9fcHJlcGFyZUxlZ2FjeVJheW1hcmNoaW5nUGFzcyhyZW5kZXJQYXNzOiBSZW5kZXJQYXNzKSB7XG4gICAgdGhpcy5fX2FwcGx5SWJsVG9SYXltYXJjaGluZ01hdGVyaWFsKCk7XG4gICAgdGhpcy5fX2FwcGx5QmFja0J1ZmZlclRleHR1cmVUb1JheW1hcmNoaW5nTWF0ZXJpYWwoKTtcbiAgICBjb25zdCBtYXRlcmlhbCA9IHJlbmRlclBhc3MubWF0ZXJpYWw7XG4gICAgaWYgKG1hdGVyaWFsID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcmF5bWFyY2hpbmdDb21wb25lbnRzID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShcbiAgICAgIFJheW1hcmNoaW5nQ29tcG9uZW50XG4gICAgKSBhcyBSYXltYXJjaGluZ0NvbXBvbmVudFtdO1xuICAgIGxldCB1bmlvbk1pblggPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgbGV0IHVuaW9uTWluWSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICBsZXQgdW5pb25NaW5aID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGxldCB1bmlvbk1heFggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG4gICAgbGV0IHVuaW9uTWF4WSA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcbiAgICBsZXQgdW5pb25NYXhaID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuICAgIGxldCB1bmlvbmFibGUgPSByYXltYXJjaGluZ0NvbXBvbmVudHMubGVuZ3RoID4gMDtcbiAgICBmb3IgKGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50IG9mIHJheW1hcmNoaW5nQ29tcG9uZW50cykge1xuICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IHJheW1hcmNoaW5nQ29tcG9uZW50LmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKTtcbiAgICAgIGlmIChzY2VuZUdyYXBoICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKGB3b3JsZE1hdHJpeF8ke3JheW1hcmNoaW5nQ29tcG9uZW50LmNvbXBvbmVudFNJRH1gLCBzY2VuZUdyYXBoLm1hdHJpeElubmVyKTtcbiAgICAgICAgLy8gVGhlIG9iamVjdCBpZCBpcyB0aGUgc3RhYmxlIGNvbXBvbmVudCBTSUQsIG1hdGNoaW5nIHRoZSBub2RlIGlkIHByZWZpeFxuICAgICAgICAvLyB1c2VkIHdoZW4gdGhlIGdyYXBocyBhcmUgbWVyZ2VkIChjb2xsZWN0UnJuSnNvbikuXG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcihcbiAgICAgICAgICBgcmF5bWFyY2hPYmplY3RJZF8ke3JheW1hcmNoaW5nQ29tcG9uZW50LmNvbXBvbmVudFNJRH1gLFxuICAgICAgICAgIFNjYWxhci5mcm9tQ29weU51bWJlcihyYXltYXJjaGluZ0NvbXBvbmVudC5jb21wb25lbnRTSUQpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb25zdCBhYWJiID0gdGhpcy5fX2dldENhY2hlZFJheW1hcmNoaW5nQWFiYihyYXltYXJjaGluZ0NvbXBvbmVudCk7XG4gICAgICBpZiAoYWFiYiA9PSBudWxsKSB7XG4gICAgICAgIHVuaW9uYWJsZSA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHVuaW9uTWluWCA9IE1hdGgubWluKHVuaW9uTWluWCwgYWFiYi5taW4ueCk7XG4gICAgICB1bmlvbk1pblkgPSBNYXRoLm1pbih1bmlvbk1pblksIGFhYmIubWluLnkpO1xuICAgICAgdW5pb25NaW5aID0gTWF0aC5taW4odW5pb25NaW5aLCBhYWJiLm1pbi56KTtcbiAgICAgIHVuaW9uTWF4WCA9IE1hdGgubWF4KHVuaW9uTWF4WCwgYWFiYi5tYXgueCk7XG4gICAgICB1bmlvbk1heFkgPSBNYXRoLm1heCh1bmlvbk1heFksIGFhYmIubWF4LnkpO1xuICAgICAgdW5pb25NYXhaID0gTWF0aC5tYXgodW5pb25NYXhaLCBhYWJiLm1heC56KTtcbiAgICB9XG4gICAgaWYgKHVuaW9uYWJsZSkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdyYXltYXJjaEFhYmJNaW4nLCBWZWN0b3IzLmZyb21Db3B5Myh1bmlvbk1pblgsIHVuaW9uTWluWSwgdW5pb25NaW5aKSk7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3JheW1hcmNoQWFiYk1heCcsIFZlY3RvcjMuZnJvbUNvcHkzKHVuaW9uTWF4WCwgdW5pb25NYXhZLCB1bmlvbk1heFopKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdyYXltYXJjaEFhYmJNaW4nLCBSQVlNQVJDSElOR19VTkJPVU5ERURfQUFCQl9NSU4pO1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdyYXltYXJjaEFhYmJNYXgnLCBSQVlNQVJDSElOR19VTkJPVU5ERURfQUFCQl9NQVgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ25zIHRoZSByYXltYXJjaGluZyBtYXRlcmlhbCBvZiBhIHNpbmdsZSBjb21wb25lbnQuXG4gICAqXG4gICAqIFRoZSBwaXBlbGluZSByZW5kZXJzIG9uZSBidWZmZXItbGVzcyBmdWxsLXNjcmVlbiBwYXNzIHBlciBtYXRlcmlhbGl6ZWQgY29tcG9uZW50XG4gICAqIChpbiBjb21wb25lbnQgU0lEIG9yZGVyKSB3aXRoIGRlcHRoIHRlc3QgYW5kIGRlcHRoIHdyaXRlIGVuYWJsZWQsIHNvIHRoZSBuZWFyZXN0XG4gICAqIFNERiB3aW5zIHBlciBwaXhlbC4gRWFjaCBtYXRlcmlhbCBvbmx5IGNvbnRhaW5zIHRoYXQgY29tcG9uZW50J3MgZ3JhcGg6IHVuaWZvcm1zXG4gICAqIGFuZCB0ZXh0dXJlcyBhcmUgbm90IHNoYXJlZCBvciBwb3N0Zml4ZWQsIGFuZCB0aGUgdGV4dHVyZS1zbG90IGxpbWl0IGFwcGxpZXMgcGVyXG4gICAqIGNvbXBvbmVudCBpbnN0ZWFkIG9mIHRvIHRoZSBtZXJnZWQgZ3JhcGggb2YgZXZlcnkgY29tcG9uZW50LlxuICAgKlxuICAgKiBXaGVuIGF0IGxlYXN0IG9uZSBjb21wb25lbnQgbWF0ZXJpYWwgaXMgYXNzaWduZWQsIHRoZSBsZWdhY3kgbWVyZ2VkIHJheW1hcmNoaW5nXG4gICAqIG1hdGVyaWFsICh7QGxpbmsgc2V0UmF5bWFyY2hpbmdNYXRlcmlhbH0pIGlzIGlnbm9yZWQuXG4gICAqXG4gICAqIFRoZSBwYXNzIGNsaXBzIGl0cyBtYXJjaCB0byB0aGUgY29tcG9uZW50J3Mgd29ybGQgQUFCQi4gQ2FsbFxuICAgKiBgY29tcG9uZW50LmludmFsaWRhdGVBQUJCKClgIHdoZW4gdGhlIFNERidzIHNpemUgY2hhbmdlcyB0aHJvdWdoIG1hdGVyaWFsIHVuaWZvcm1cbiAgICogdmFsdWVzICh0aGUgZWRpdG9yIGRvZXMgdGhpcyBmb3IgaXRzIHVuaWZvcm0gY29udHJvbHMpIHNvIHRoZSBjYWNoZWQgYm91bmRzLCB0aGVcbiAgICogcmF5IGludGVydmFsIGFuZCB0aGUgc2Npc3NvciByZWN0YW5nbGUgc3RheSBjdXJyZW50LlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50IC0gVGhlIGNvbXBvbmVudCB0aGUgbWF0ZXJpYWwgYmVsb25ncyB0b1xuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwsIHR5cGljYWxseSBmcm9tXG4gICAqIGBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ0NvbXBvbmVudE1hdGVyaWFsYFxuICAgKi9cbiAgcHVibGljIHNldFJheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWwoY29tcG9uZW50OiBSYXltYXJjaGluZ0NvbXBvbmVudCwgbWF0ZXJpYWw6IE1hdGVyaWFsKSB7XG4gICAgdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzLnNldChjb21wb25lbnQuY29tcG9uZW50U0lELCBtYXRlcmlhbCk7XG4gICAgdGhpcy5fX2FwcGx5SWJsVG9SYXltYXJjaGluZ01hdGVyaWFsKCk7XG4gICAgdGhpcy5fX2FwcGx5QmFja0J1ZmZlclRleHR1cmVUb1JheW1hcmNoaW5nTWF0ZXJpYWwoKTtcbiAgICAvLyBUaGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgaXMgbm90IHBhcnQgb2YgYW55IG1lc2ggcHJpbWl0aXZlLCBzbyB0aGUgc2hhZG93XG4gICAgLy8gcGFyYW1ldGVycyBvZiB0aGUgbGFzdCBzaGFkb3cgcGFzcyBzZXR1cCBoYXZlIHRvIGJlIGFwcGxpZWQgZXhwbGljaXRseS5cbiAgICB0aGlzLl9fc2hhZG93U3lzdGVtPy5hcHBseVNoYWRvd1BhcmFtZXRlcnNUb01hdGVyaWFscyhbbWF0ZXJpYWxdKTtcbiAgICAvLyBUaGUgU0RGIGdyYXBoIG1heSBoYXZlIGNoYW5nZWQsIHNvIHRoZSBzaGFkb3cgY2FzdGVyIG1hdGVyaWFscyBhcmUgcmVidWlsdCBmcm9tIGl0LlxuICAgIHRoaXMucmVmcmVzaFJheW1hcmNoaW5nU2hhZG93TWF0ZXJpYWwoKTtcbiAgICBpZiAodGhpcy5fX2ZyYW1lICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX19zZXRVcEV4cHJlc3Npb25zRm9yUmVuZGVyaW5nKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJheW1hcmNoaW5nIG1hdGVyaWFsIGFzc2lnbmVkIHRvIGEgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gY29tcG9uZW50IC0gVGhlIGNvbXBvbmVudCB3aG9zZSBtYXRlcmlhbCBpcyByZXF1ZXN0ZWRcbiAgICovXG4gIHB1YmxpYyBnZXRSYXltYXJjaGluZ0NvbXBvbmVudE1hdGVyaWFsKGNvbXBvbmVudDogUmF5bWFyY2hpbmdDb21wb25lbnQpOiBNYXRlcmlhbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19yYXltYXJjaGluZ0NvbXBvbmVudE1hdGVyaWFscy5nZXQoY29tcG9uZW50LmNvbXBvbmVudFNJRCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgb2YgYSBjb21wb25lbnQgc28gaXQgc3RvcHMgcmVuZGVyaW5nLlxuICAgKiBAcGFyYW0gY29tcG9uZW50IC0gVGhlIGNvbXBvbmVudCB3aG9zZSBtYXRlcmlhbCBpcyByZW1vdmVkXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlUmF5bWFyY2hpbmdDb21wb25lbnRNYXRlcmlhbChjb21wb25lbnQ6IFJheW1hcmNoaW5nQ29tcG9uZW50KSB7XG4gICAgaWYgKHRoaXMuX19yYXltYXJjaGluZ0NvbXBvbmVudE1hdGVyaWFscy5kZWxldGUoY29tcG9uZW50LmNvbXBvbmVudFNJRCkpIHtcbiAgICAgIHRoaXMucmVmcmVzaFJheW1hcmNoaW5nU2hhZG93TWF0ZXJpYWwoKTtcbiAgICAgIGlmICh0aGlzLl9fZnJhbWUgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9fc2V0VXBFeHByZXNzaW9uc0ZvclJlbmRlcmluZygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBMZWdhY3kgc2luZ2xlLW1hdGVyaWFsIEFQSTogcmVuZGVycyBhbGwgY29tcG9uZW50cyB3aXRoIG9uZSBtZXJnZWQgbWF0ZXJpYWwuXG4gICAqXG4gICAqIElnbm9yZWQgd2hpbGUgcGVyLWNvbXBvbmVudCBtYXRlcmlhbHMgYXJlIGFzc2lnbmVkICh7QGxpbmsgc2V0UmF5bWFyY2hpbmdDb21wb25lbnRNYXRlcmlhbH0pLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgYnVpbHQgZnJvbSBgY29sbGVjdFJybkpzb25gXG4gICAqL1xuICBwdWJsaWMgc2V0UmF5bWFyY2hpbmdNYXRlcmlhbChtYXRlcmlhbDogTWF0ZXJpYWwpIHtcbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdSZW5kZXJQYXNzPy5zZXRCdWZmZXJMZXNzRnVsbFNjcmVlblJlbmRlcmluZyhtYXRlcmlhbCk7XG4gICAgdGhpcy5fX2FwcGx5SWJsVG9SYXltYXJjaGluZ01hdGVyaWFsKCk7XG4gICAgdGhpcy5fX2FwcGx5QmFja0J1ZmZlclRleHR1cmVUb1JheW1hcmNoaW5nTWF0ZXJpYWwoKTtcbiAgICAvLyBUaGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgaXMgbm90IHBhcnQgb2YgYW55IG1lc2ggcHJpbWl0aXZlLCBzbyB0aGUgc2hhZG93XG4gICAgLy8gcGFyYW1ldGVycyBvZiB0aGUgbGFzdCBzaGFkb3cgcGFzcyBzZXR1cCBoYXZlIHRvIGJlIGFwcGxpZWQgZXhwbGljaXRseS5cbiAgICB0aGlzLl9fc2hhZG93U3lzdGVtPy5hcHBseVNoYWRvd1BhcmFtZXRlcnNUb01hdGVyaWFscyhbbWF0ZXJpYWxdKTtcbiAgICAvLyBUaGUgU0RGIGdyYXBoIG1heSBoYXZlIGNoYW5nZWQsIHNvIHRoZSBzaGFkb3cgY2FzdGVyIG1hdGVyaWFscyBhcmUgcmVidWlsdCBmcm9tIGl0LlxuICAgIHRoaXMucmVmcmVzaFJheW1hcmNoaW5nU2hhZG93TWF0ZXJpYWwoKTtcbiAgICAvLyBBIHRyYW5zbWlzc2lvbiBtYXRlcmlhbCBzYW1wbGVzIHRoZSBzY2VuZSBjb2xvciBiZWhpbmQgdGhlIFNERiwgc28gdGhlIHBhc3MgaGFzXG4gICAgLy8gdG8gcnVuIGFmdGVyIHRoZSBvcGFxdWUgZXhwcmVzc2lvbnMuIFJlYnVpbGQgdGhlIGZyYW1lIGV4cHJlc3Npb24gb3JkZXIuXG4gICAgaWYgKHRoaXMuX19mcmFtZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fc2V0VXBFeHByZXNzaW9uc0ZvclJlbmRlcmluZygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIG9yIHVwZGF0ZXMgdGhlIGJ1ZmZlci1sZXNzIHJlbmRlciBwYXNzIG9mIGVhY2ggY29tcG9uZW50IHRoYXQgb3ducyBhXG4gICAqIHJheW1hcmNoaW5nIG1hdGVyaWFsLCBpbiBjb21wb25lbnQgU0lEIG9yZGVyLiBDb21wb25lbnRzIHdpdGhvdXQgYSBtYXRlcmlhbCBhcmVcbiAgICogc2tpcHBlZCwgYW5kIHN0YWxlIHBhc3NlcyBhcmUgZHJvcHBlZC5cbiAgICovXG4gIHByaXZhdGUgX19nZXRSYXltYXJjaGluZ0NvbXBvbmVudFBhc3NlcygpOiBSZW5kZXJQYXNzW10ge1xuICAgIGNvbnN0IHBhc3NlczogUmVuZGVyUGFzc1tdID0gW107XG4gICAgY29uc3QgZXhpc3RpbmdDb21wb25lbnRTaWRzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gICAgdGhpcy5fX3JheW1hcmNoaW5nRmlyc3RDb21wb25lbnRQYXNzU0lEID0gLTE7XG4gICAgaWYgKHRoaXMuX19yYXltYXJjaGluZ0NvbXBvbmVudE1hdGVyaWFscy5zaXplID4gMCkge1xuICAgICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgdGhpcy5fX2dldFNvcnRlZFJheW1hcmNoaW5nQ29tcG9uZW50cygpKSB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFNJRCA9IGNvbXBvbmVudC5jb21wb25lbnRTSUQ7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzLmdldChjb21wb25lbnRTSUQpO1xuICAgICAgICBpZiAobWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGV4aXN0aW5nQ29tcG9uZW50U2lkcy5hZGQoY29tcG9uZW50U0lEKTtcbiAgICAgICAgbGV0IHJlbmRlclBhc3MgPSB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRQYXNzZXMuZ2V0KGNvbXBvbmVudFNJRCk7XG4gICAgICAgIGlmIChyZW5kZXJQYXNzID09IG51bGwpIHtcbiAgICAgICAgICByZW5kZXJQYXNzID0gbmV3IFJlbmRlclBhc3ModGhpcy5fX2VuZ2luZSk7XG4gICAgICAgICAgcmVuZGVyUGFzcy50b0NsZWFyRGVwdGhCdWZmZXIgPSBmYWxzZTtcbiAgICAgICAgICByZW5kZXJQYXNzLmlzRGVwdGhUZXN0ID0gdHJ1ZTtcbiAgICAgICAgICByZW5kZXJQYXNzLnNldFByZVJlbmRlckZ1bmN0aW9uKCgpID0+IHRoaXMuX19wcmVwYXJlUmF5bWFyY2hpbmdDb21wb25lbnRQYXNzKGNvbXBvbmVudFNJRCkpO1xuICAgICAgICAgIHJlbmRlclBhc3MudHJ5VG9TZXRVbmlxdWVOYW1lKGBSYXltYXJjaGluZ18ke2NvbXBvbmVudFNJRH1gLCB0cnVlKTtcbiAgICAgICAgICB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRQYXNzZXMuc2V0KGNvbXBvbmVudFNJRCwgcmVuZGVyUGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyUGFzcy5zZXRCdWZmZXJMZXNzRnVsbFNjcmVlblJlbmRlcmluZyhtYXRlcmlhbCk7XG4gICAgICAgIHRoaXMuX19jb25maWd1cmVSYXltYXJjaGluZ1Bhc3NUYXJnZXRzKHJlbmRlclBhc3MpO1xuICAgICAgICBpZiAocGFzc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuX19yYXltYXJjaGluZ0ZpcnN0Q29tcG9uZW50UGFzc1NJRCA9IGNvbXBvbmVudFNJRDtcbiAgICAgICAgfVxuICAgICAgICBwYXNzZXMucHVzaChyZW5kZXJQYXNzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBjb21wb25lbnRTSUQgb2YgWy4uLnRoaXMuX19yYXltYXJjaGluZ0NvbXBvbmVudFBhc3Nlcy5rZXlzKCldKSB7XG4gICAgICBpZiAoIWV4aXN0aW5nQ29tcG9uZW50U2lkcy5oYXMoY29tcG9uZW50U0lEKSkge1xuICAgICAgICB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRQYXNzZXMuZGVsZXRlKGNvbXBvbmVudFNJRCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIERyb3AgbWF0ZXJpYWxzIHdob3NlIGNvbXBvbmVudHMgd2VyZSByZW1vdmVkIHNvIHRoZXkgbmVpdGhlciByZW5kZXIgbm9yIHJlY2VpdmVcbiAgICAvLyBwZXItZnJhbWUgdXBkYXRlcyB0aHJvdWdoIHRoZSBzaGFyZWQgbWF0ZXJpYWwgaGVscGVycy5cbiAgICBmb3IgKGNvbnN0IGNvbXBvbmVudFNJRCBvZiBbLi4udGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzLmtleXMoKV0pIHtcbiAgICAgIGlmIChcbiAgICAgICAgIWV4aXN0aW5nQ29tcG9uZW50U2lkcy5oYXMoY29tcG9uZW50U0lEKSAmJlxuICAgICAgICB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50KFJheW1hcmNoaW5nQ29tcG9uZW50LCBjb21wb25lbnRTSUQpID09IG51bGxcbiAgICAgICkge1xuICAgICAgICB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRNYXRlcmlhbHMuZGVsZXRlKGNvbXBvbmVudFNJRCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXNzZXM7XG4gIH1cblxuICAvKipcbiAgICogUGVyLWZyYW1lIHNldHVwIG9mIG9uZSBjb21wb25lbnQncyByYXltYXJjaGluZyBwYXNzOiBpdHMgd29ybGQgbWF0cml4LCB0aGUgd29ybGRcbiAgICogQUFCQiB1c2VkIGZvciByYXkgaW50ZXJ2YWwgY2xpcHBpbmcsIGFuZCB0aGUgc2Npc3NvciByZWN0YW5nbGUgb24gdGhlIHNjcmVlbi5cbiAgICpcbiAgICogVGhlIHdvcmxkIG1hdHJpeCBhbmQgdGhlIEFBQkIgYXJlIHNhbXBsZWQgdG9nZXRoZXIgc28gdGhlIGNsaXAgaW50ZXJ2YWwgbWF0Y2hlc1xuICAgKiB0aGUgdHJhbnNmb3JtIHRoZSBzaGFkZXIgdXNlcywgaW5jbHVkaW5nIG9uIGJhY2tlbmRzIHRoYXQgdXBsb2FkIG1hdGVyaWFsIHZhbHVlc1xuICAgKiBvbmUgZnJhbWUgbGF0ZXIuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRTSUQgLSBUaGUgU0lEIG9mIHRoZSBjb21wb25lbnQgcmVuZGVyZWQgYnkgdGhlIHBhc3NcbiAgICovXG4gIHByaXZhdGUgX19wcmVwYXJlUmF5bWFyY2hpbmdDb21wb25lbnRQYXNzKGNvbXBvbmVudFNJRDogbnVtYmVyKSB7XG4gICAgaWYgKGNvbXBvbmVudFNJRCA9PT0gdGhpcy5fX3JheW1hcmNoaW5nRmlyc3RDb21wb25lbnRQYXNzU0lEKSB7XG4gICAgICAvLyBUaGUgc2hhcmVkIG1hdGVyaWFsIHNldHVwIChJQkwvYmFjayBidWZmZXIgYmluZGluZ3MpIG9ubHkgaGFzIHRvIHJ1biBvbmNlIHBlclxuICAgICAgLy8gZnJhbWUsIGJlZm9yZSB0aGUgZmlyc3QgcmF5bWFyY2hpbmcgcGFzcy5cbiAgICAgIHRoaXMuX19hcHBseUlibFRvUmF5bWFyY2hpbmdNYXRlcmlhbCgpO1xuICAgICAgdGhpcy5fX2FwcGx5QmFja0J1ZmZlclRleHR1cmVUb1JheW1hcmNoaW5nTWF0ZXJpYWwoKTtcbiAgICB9XG4gICAgY29uc3QgbWF0ZXJpYWwgPSB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRNYXRlcmlhbHMuZ2V0KGNvbXBvbmVudFNJRCk7XG4gICAgY29uc3QgY29tcG9uZW50ID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChSYXltYXJjaGluZ0NvbXBvbmVudCwgY29tcG9uZW50U0lEKSBhc1xuICAgICAgfCBSYXltYXJjaGluZ0NvbXBvbmVudFxuICAgICAgfCB1bmRlZmluZWQ7XG4gICAgY29uc3Qgc2NlbmVHcmFwaCA9IGNvbXBvbmVudD8uZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmIChtYXRlcmlhbCA9PSBudWxsIHx8IGNvbXBvbmVudCA9PSBudWxsIHx8IHNjZW5lR3JhcGggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoUkFZTUFSQ0hJTkdfQ09NUE9ORU5UX1dPUkxEX01BVFJJWF9TRU1BTlRJQywgc2NlbmVHcmFwaC5tYXRyaXhJbm5lcik7XG4gICAgY29uc3QgYWFiYiA9IHRoaXMuX19nZXRDYWNoZWRSYXltYXJjaGluZ0FhYmIoY29tcG9uZW50KTtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3JheW1hcmNoQWFiYk1pbicsIGFhYmI/Lm1pbiA/PyBSQVlNQVJDSElOR19VTkJPVU5ERURfQUFCQl9NSU4pO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigncmF5bWFyY2hBYWJiTWF4JywgYWFiYj8ubWF4ID8/IFJBWU1BUkNISU5HX1VOQk9VTkRFRF9BQUJCX01BWCk7XG4gICAgdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50UGFzc2VzLmdldChjb21wb25lbnRTSUQpPy5zZXRTY2lzc29yUmVjdCh0aGlzLl9fY2FsY1JheW1hcmNoaW5nU2Npc3NvclJlY3QoYWFiYikpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbnNlcnZhdGl2ZSB3b3JsZCBBQUJCIG9mIGEgY29tcG9uZW50J3MgU0RGLCBjYWNoaW5nIGl0IHVudGlsIHRoZVxuICAgKiBjb21wb25lbnQncyBBQUJCIHZlcnNpb24gb3Igd29ybGQgbWF0cml4IGNoYW5nZXMuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnQgLSBUaGUgU0RGIGNvbXBvbmVudFxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldENhY2hlZFJheW1hcmNoaW5nQWFiYihjb21wb25lbnQ6IFJheW1hcmNoaW5nQ29tcG9uZW50KTogUmF5bWFyY2hpbmdBYWJiIHwgbnVsbCB7XG4gICAgY29uc3Qgc2NlbmVHcmFwaCA9IGNvbXBvbmVudC5lbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKHNjZW5lR3JhcGggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IG1hdHJpeCA9IHNjZW5lR3JhcGgubWF0cml4SW5uZXI7XG4gICAgY29uc3QgZWxlbWVudHMgPSBbXG4gICAgICBtYXRyaXgubTAwLFxuICAgICAgbWF0cml4Lm0wMSxcbiAgICAgIG1hdHJpeC5tMDIsXG4gICAgICBtYXRyaXgubTAzLFxuICAgICAgbWF0cml4Lm0xMCxcbiAgICAgIG1hdHJpeC5tMTEsXG4gICAgICBtYXRyaXgubTEyLFxuICAgICAgbWF0cml4Lm0xMyxcbiAgICAgIG1hdHJpeC5tMjAsXG4gICAgICBtYXRyaXgubTIxLFxuICAgICAgbWF0cml4Lm0yMixcbiAgICAgIG1hdHJpeC5tMjMsXG4gICAgICBtYXRyaXgubTMwLFxuICAgICAgbWF0cml4Lm0zMSxcbiAgICAgIG1hdHJpeC5tMzIsXG4gICAgICBtYXRyaXgubTMzLFxuICAgIF07XG4gICAgY29uc3QgYWFiYlZlcnNpb24gPSBSYXltYXJjaGluZ0NvbXBvbmVudC5nZXRBQUJCVmVyc2lvbih0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCBjYWNoZUtleSA9IGNvbXBvbmVudC5jb21wb25lbnRTSUQ7XG4gICAgY29uc3QgY2FjaGVkID0gdGhpcy5fX3JheW1hcmNoaW5nQWFiYkNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgaWYgKFxuICAgICAgY2FjaGVkICE9IG51bGwgJiZcbiAgICAgIGNhY2hlZC5hYWJiVmVyc2lvbiA9PT0gYWFiYlZlcnNpb24gJiZcbiAgICAgIGNhY2hlZC5tYXRyaXgubGVuZ3RoID09PSBlbGVtZW50cy5sZW5ndGggJiZcbiAgICAgIGNhY2hlZC5tYXRyaXguZXZlcnkoKHZhbHVlLCBpbmRleCkgPT4gdmFsdWUgPT09IGVsZW1lbnRzW2luZGV4XSlcbiAgICApIHtcbiAgICAgIHJldHVybiBjYWNoZWQuYWFiYjtcbiAgICB9XG5cbiAgICBjb25zdCBhYWJiID0gY29tcG9uZW50LmNhbGNXb3JsZEFBQkIoKTtcbiAgICBpZiAoYWFiYiA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9fcmF5bWFyY2hpbmdBYWJiQ2FjaGUuZGVsZXRlKGNhY2hlS2V5KTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICBtaW46IFZlY3RvcjMuZnJvbUNvcHkzKGFhYmIubWluUG9pbnQueCwgYWFiYi5taW5Qb2ludC55LCBhYWJiLm1pblBvaW50LnopLFxuICAgICAgbWF4OiBWZWN0b3IzLmZyb21Db3B5MyhhYWJiLm1heFBvaW50LngsIGFhYmIubWF4UG9pbnQueSwgYWFiYi5tYXhQb2ludC56KSxcbiAgICB9O1xuICAgIHRoaXMuX19yYXltYXJjaGluZ0FhYmJDYWNoZS5zZXQoY2FjaGVLZXksIHsgYWFiYlZlcnNpb24sIG1hdHJpeDogZWxlbWVudHMsIGFhYmI6IHJlc3VsdCB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2plY3RzIGEgd29ybGQgQUFCQiB0byBhIHNjcmVlbi1zcGFjZSBzY2lzc29yIHJlY3RhbmdsZS5cbiAgICpcbiAgICogUmV0dXJucyB1bmRlZmluZWQgKHJlbmRlciB0aGUgd2hvbGUgdGFyZ2V0KSB3aGVuIHRoZSBib3VuZHMgYXJlIHVuYm91bmRlZCBvclxuICAgKiB3aGVuIGFueSBjb3JuZXIgaXMgYmVoaW5kIHRoZSBjYW1lcmEsIHdoZXJlIGEgbmFpdmUgcHJvamVjdGlvbiBpcyBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0gYWFiYiAtIFRoZSB3b3JsZCBBQUJCIG9mIHRoZSBTREZcbiAgICovXG4gIHByaXZhdGUgX19jYWxjUmF5bWFyY2hpbmdTY2lzc29yUmVjdChhYWJiOiBSYXltYXJjaGluZ0FhYmIgfCBudWxsKSB7XG4gICAgaWYgKGFhYmIgPT0gbnVsbCB8fCB0aGlzLl9fd2lkdGggPD0gMCB8fCB0aGlzLl9faGVpZ2h0IDw9IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGNhbWVyYSA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICBDYW1lcmFDb21wb25lbnQsXG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudCh0aGlzLl9fZW5naW5lKVxuICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50IHwgdW5kZWZpbmVkO1xuICAgIGlmIChjYW1lcmEgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3Qgdmlld1Byb2plY3Rpb24gPSBjYW1lcmEudmlld1Byb2plY3Rpb25NYXRyaXg7XG4gICAgbGV0IG1pblggPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgbGV0IG1pblkgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgbGV0IG1heFggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG4gICAgbGV0IG1heFkgPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG4gICAgZm9yIChsZXQgY29ybmVyID0gMDsgY29ybmVyIDwgODsgY29ybmVyKyspIHtcbiAgICAgIGNvbnN0IHggPSAoY29ybmVyICYgMSkgPT09IDAgPyBhYWJiLm1pbi54IDogYWFiYi5tYXgueDtcbiAgICAgIGNvbnN0IHkgPSAoY29ybmVyICYgMikgPT09IDAgPyBhYWJiLm1pbi55IDogYWFiYi5tYXgueTtcbiAgICAgIGNvbnN0IHogPSAoY29ybmVyICYgNCkgPT09IDAgPyBhYWJiLm1pbi56IDogYWFiYi5tYXguejtcbiAgICAgIGNvbnN0IGNsaXAgPSB2aWV3UHJvamVjdGlvbi5tdWx0aXBseVZlY3RvcihWZWN0b3I0LmZyb21Db3B5NCh4LCB5LCB6LCAxKSk7XG4gICAgICBpZiAoY2xpcC53IDw9IDApIHtcbiAgICAgICAgLy8gQW55IGNvcm5lciBiZWhpbmQgdGhlIGNhbWVyYSBtYWtlcyB0aGUgc2NyZWVuIHByb2plY3Rpb24gdW5yZWxpYWJsZS5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5kY1ggPSBjbGlwLnggLyBjbGlwLnc7XG4gICAgICBjb25zdCBuZGNZID0gY2xpcC55IC8gY2xpcC53O1xuICAgICAgY29uc3QgcGl4ZWxYID0gKG5kY1ggKiAwLjUgKyAwLjUpICogdGhpcy5fX3dpZHRoO1xuICAgICAgY29uc3QgcGl4ZWxZID0gKC1uZGNZICogMC41ICsgMC41KSAqIHRoaXMuX19oZWlnaHQ7XG4gICAgICBtaW5YID0gTWF0aC5taW4obWluWCwgcGl4ZWxYKTtcbiAgICAgIG1pblkgPSBNYXRoLm1pbihtaW5ZLCBwaXhlbFkpO1xuICAgICAgbWF4WCA9IE1hdGgubWF4KG1heFgsIHBpeGVsWCk7XG4gICAgICBtYXhZID0gTWF0aC5tYXgobWF4WSwgcGl4ZWxZKTtcbiAgICB9XG4gICAgLy8gQSBzbWFsbCBtYXJnaW4gY292ZXJzIGZsb2F0aW5nIHBvaW50IGVycm9yIGF0IHRoZSBTREYncyBzaWxob3VldHRlLlxuICAgIGNvbnN0IG1hcmdpbiA9IDI7XG4gICAgY29uc3QgeCA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IobWluWCkgLSBtYXJnaW4pO1xuICAgIGNvbnN0IHkgPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKG1pblkpIC0gbWFyZ2luKTtcbiAgICBjb25zdCByaWdodCA9IE1hdGgubWluKHRoaXMuX193aWR0aCwgTWF0aC5jZWlsKG1heFgpICsgbWFyZ2luKTtcbiAgICBjb25zdCBib3R0b20gPSBNYXRoLm1pbih0aGlzLl9faGVpZ2h0LCBNYXRoLmNlaWwobWF4WSkgKyBtYXJnaW4pO1xuICAgIGNvbnN0IHdpZHRoID0gcmlnaHQgLSB4O1xuICAgIGNvbnN0IGhlaWdodCA9IGJvdHRvbSAtIHk7XG4gICAgaWYgKHdpZHRoIDw9IDAgfHwgaGVpZ2h0IDw9IDApIHtcbiAgICAgIC8vIFRoZSBTREYgaXMgb2ZmLXNjcmVlbjoga2VlcCBhIDF4MSBzY2lzc29yIHNvIHRoZSBwYXNzIHNoYWRlcyBvbmUgcGl4ZWwuXG4gICAgICByZXR1cm4geyB4OiAwLCB5OiAwLCB3aWR0aDogMSwgaGVpZ2h0OiAxIH07XG4gICAgfVxuICAgIGlmICh4ID09PSAwICYmIHkgPT09IDAgJiYgd2lkdGggPT09IHRoaXMuX193aWR0aCAmJiBoZWlnaHQgPT09IHRoaXMuX19oZWlnaHQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfTtcbiAgfVxuXG4gIC8qKiBBbGwgcmF5bWFyY2hpbmcgbWF0ZXJpYWxzIHRoZSBwaXBlbGluZSBtYW5hZ2VzIChsZWdhY3kgb3IgcGVyIGNvbXBvbmVudCkuICovXG4gIHByaXZhdGUgX19nZXRBbGxSYXltYXJjaGluZ01hdGVyaWFscygpOiBNYXRlcmlhbFtdIHtcbiAgICBjb25zdCBtYXRlcmlhbHM6IE1hdGVyaWFsW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG1hdGVyaWFsIG9mIHRoaXMuX19yYXltYXJjaGluZ0NvbXBvbmVudE1hdGVyaWFscy52YWx1ZXMoKSkge1xuICAgICAgbWF0ZXJpYWxzLnB1c2gobWF0ZXJpYWwpO1xuICAgIH1cbiAgICBjb25zdCBsZWdhY3lNYXRlcmlhbCA9IHRoaXMuZ2V0UmF5bWFyY2hpbmdNYXRlcmlhbCgpO1xuICAgIGlmIChsZWdhY3lNYXRlcmlhbCAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbHMucHVzaChsZWdhY3lNYXRlcmlhbCk7XG4gICAgfVxuICAgIHJldHVybiBtYXRlcmlhbHM7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGRzIHRoZSByYXltYXJjaGluZyBleHByZXNzaW9uIGZyb20gdGhlIGN1cnJlbnQgbWF0ZXJpYWxzLlxuICAgKlxuICAgKiBXaXRoIHBlci1jb21wb25lbnQgbWF0ZXJpYWxzLCB0aGUgZXhwcmVzc2lvbiBjb250YWlucyBvbmUgYnVmZmVyLWxlc3MgcGFzcyBwZXJcbiAgICogY29tcG9uZW50IChjb21wb25lbnQgU0lEIG9yZGVyKSwgY29tcG9zaXRlZCBieSB0aGUgZGVwdGggdGVzdC4gT3RoZXJ3aXNlIHRoZVxuICAgKiBsZWdhY3kgbWVyZ2VkIHBhc3MgaXMgdXNlZC4gVGhlIGV4cHJlc3Npb24gaXMgZW1wdHkgd2hpbGUgbm8gcmF5bWFyY2hpbmcgbWF0ZXJpYWxcbiAgICogaXMgYXNzaWduZWQuXG4gICAqL1xuICBwcml2YXRlIF9fYnVpbGRSYXltYXJjaGluZ0V4cHJlc3Npb24oKTogRXhwcmVzc2lvbiB7XG4gICAgY29uc3QgZXhwcmVzc2lvbiA9IG5ldyBFeHByZXNzaW9uKCk7XG4gICAgZXhwcmVzc2lvbi50cnlUb1NldFVuaXF1ZU5hbWUoJ1JheW1hcmNoaW5nJywgdHJ1ZSk7XG4gICAgY29uc3QgY29tcG9uZW50UGFzc2VzID0gdGhpcy5fX2dldFJheW1hcmNoaW5nQ29tcG9uZW50UGFzc2VzKCk7XG4gICAgaWYgKGNvbXBvbmVudFBhc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICBleHByZXNzaW9uLmFkZFJlbmRlclBhc3Nlcyhjb21wb25lbnRQYXNzZXMpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fX3JheW1hcmNoaW5nUmVuZGVyUGFzcyAhPSBudWxsICYmIHRoaXMuX19yYXltYXJjaGluZ1JlbmRlclBhc3MubWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgZXhwcmVzc2lvbi5hZGRSZW5kZXJQYXNzZXMoW3RoaXMuX19yYXltYXJjaGluZ1JlbmRlclBhc3NdKTtcbiAgICB9XG4gICAgcmV0dXJuIGV4cHJlc3Npb247XG4gIH1cblxuICAvKipcbiAgICogUmVidWlsZHMgdGhlIHNoYWRvdyBjYXN0ZXIgbWF0ZXJpYWxzIGZyb20gdGhlIGN1cnJlbnQgcmF5bWFyY2hpbmcgY29tcG9uZW50c1xuICAgKiAob25seSB0aGUgb25lcyB3aXRoIGBjYXN0U2hhZG93YCkgYW5kIHJlcXVlc3RzIGEgc2hhZG93IG1hcCByZWZyZXNoLCBzbyB0aGUgU0RGXG4gICAqIG9iamVjdHMgYXBwZWFyIGluIC8gZGlzYXBwZWFyIGZyb20gdGhlIHNoYWRvdyBtYXBzLlxuICAgKlxuICAgKiBXaXRoIHBlci1jb21wb25lbnQgdmlzaWJsZSBtYXRlcmlhbHMsIHRoZSBzaGFkb3cgY2FzdGVycyBhcmUgc3BsaXQgcGVyIGNvbXBvbmVudFxuICAgKiBhcyB3ZWxsICh0aGVpciB0ZXh0dXJlcyBhbmQgdW5pZm9ybXMgYXJlIHRoZW4gaW5kZXBlbmRlbnQgaW4gdGhlIHNoYWRvdyBtYXBzKS5cbiAgICogT3RoZXJ3aXNlIHRoZSBsZWdhY3kgbWVyZ2VkIGNhc3RlciBtYXRlcmlhbHMgYXJlIHJlYnVpbHQgZnJvbSBgY29sbGVjdFJybkpzb25gLlxuICAgKlxuICAgKiBDYWxsIHRoaXMgd2hlbiBhIHJheW1hcmNoaW5nIGdyYXBoIG9yIGEgY29tcG9uZW50J3MgYGNhc3RTaGFkb3dgIGZsYWcgY2hhbmdlcy5cbiAgICovXG4gIHB1YmxpYyByZWZyZXNoUmF5bWFyY2hpbmdTaGFkb3dNYXRlcmlhbCgpIHtcbiAgICBjb25zdCBwcmV2aW91c1JlZ3VsYXIgPSB0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dSZWd1bGFyTWF0ZXJpYWw7XG4gICAgY29uc3QgcHJldmlvdXNDb21wb25lbnRSZWd1bGFyID0gbmV3IE1hcCh0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dSZWd1bGFyTWF0ZXJpYWxzKTtcbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dKc29uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19yYXltYXJjaGluZ1NoYWRvd1JlZ3VsYXJNYXRlcmlhbCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dQb2ludFNsb3RzLmNsZWFyKCk7XG4gICAgdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93UmVndWxhck1hdGVyaWFscy5jbGVhcigpO1xuICAgIHRoaXMuX19yYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd1BvaW50U2xvdHMuY2xlYXIoKTtcbiAgICB0aGlzLl9faXNSYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd01vZGUgPSB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRNYXRlcmlhbHMuc2l6ZSA+IDA7XG5cbiAgICBpZiAodGhpcy5fX3NoYWRvd1N5c3RlbSA9PSBudWxsIHx8IHRoaXMuX19lbmdpbmUuY29uZmlnLm1heExpZ2h0TnVtYmVyIDw9IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2lzUmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dNb2RlKSB7XG4gICAgICAvLyBPbmUgcmVndWxhciBjYXN0ZXIgbWF0ZXJpYWwgcGVyIGNhc3RTaGFkb3cgY29tcG9uZW50IHRoYXQgaGFzIGEgdmlzaWJsZVxuICAgICAgLy8gbWF0ZXJpYWwuIFBhcmFib2xvaWQgcGFpcnMgYXJlIGNyZWF0ZWQgbGF6aWx5IHBlciBzaGFkb3cgc2xvdC5cbiAgICAgIGZvciAoY29uc3QgY29tcG9uZW50IG9mIHRoaXMuX19nZXRTb3J0ZWRSYXltYXJjaGluZ0NvbXBvbmVudHMoKSkge1xuICAgICAgICBjb25zdCBjb21wb25lbnRTSUQgPSBjb21wb25lbnQuY29tcG9uZW50U0lEO1xuICAgICAgICBpZiAoIWNvbXBvbmVudC5jYXN0U2hhZG93IHx8ICF0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRNYXRlcmlhbHMuaGFzKGNvbXBvbmVudFNJRCkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXRlcmlhbCA9IGNyZWF0ZU5vZGVCYXNlZFJheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93TWF0ZXJpYWwoXG4gICAgICAgICAgdGhpcy5fX2VuZ2luZSxcbiAgICAgICAgICBjb21wb25lbnQsXG4gICAgICAgICAgJ3JlZ3VsYXInLFxuICAgICAgICAgIHByZXZpb3VzQ29tcG9uZW50UmVndWxhci5nZXQoY29tcG9uZW50U0lEKVxuICAgICAgICApO1xuICAgICAgICBpZiAobWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuX19yYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd1JlZ3VsYXJNYXRlcmlhbHMuc2V0KGNvbXBvbmVudFNJRCwgbWF0ZXJpYWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNhc3RTaGFkb3dKc29uID0gY29sbGVjdFJybkpzb24odGhpcy5fX2VuZ2luZSwgeyBjYXN0U2hhZG93T25seTogdHJ1ZSB9KTtcbiAgICAgIGlmIChjYXN0U2hhZG93SnNvbi5ub2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGpzb24gPSBjYXN0U2hhZG93SnNvbiBhcyB1bmtub3duIGFzIFNoYWRlck5vZGVKc29uO1xuICAgICAgICB0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dKc29uID0ganNvbjtcbiAgICAgICAgdGhpcy5fX3JheW1hcmNoaW5nU2hhZG93UmVndWxhck1hdGVyaWFsID0gY3JlYXRlTm9kZUJhc2VkUmF5bWFyY2hpbmdTaGFkb3dNYXRlcmlhbChcbiAgICAgICAgICB0aGlzLl9fZW5naW5lLFxuICAgICAgICAgIGpzb24sXG4gICAgICAgICAgJ3JlZ3VsYXInLFxuICAgICAgICAgIHByZXZpb3VzUmVndWxhclxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX19zaGFkb3dTeXN0ZW0uaW52YWxpZGF0ZVNoYWRvd1ZvbHVtZUZpdHRpbmcoKTtcbiAgICB0aGlzLl9fc2hhZG93U3lzdGVtLnNldE5lZWRzUmVmcmVzaCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSByYXltYXJjaGluZyBjb21wb25lbnRzIGluIGEgZGV0ZXJtaW5pc3RpYyAoY29tcG9uZW50IFNJRCkgb3JkZXIuXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0U29ydGVkUmF5bWFyY2hpbmdDb21wb25lbnRzKCk6IFJheW1hcmNoaW5nQ29tcG9uZW50W10ge1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSAoXG4gICAgICB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKFJheW1hcmNoaW5nQ29tcG9uZW50KSBhcyBSYXltYXJjaGluZ0NvbXBvbmVudFtdXG4gICAgKS5zbGljZSgpO1xuICAgIGNvbXBvbmVudHMuc29ydCgoYSwgYikgPT4gYS5jb21wb25lbnRTSUQgLSBiLmNvbXBvbmVudFNJRCk7XG4gICAgcmV0dXJuIGNvbXBvbmVudHM7XG4gIH1cblxuICAvKiogVGhlIHJlZ3VsYXIgKHNwb3QgLyBkaXJlY3Rpb25hbCkgU0RGIHNoYWRvdyBjYXN0ZXIgbWF0ZXJpYWwgKGZvciB0ZXN0cy9kZWJ1Z2dpbmcpLiAqL1xuICBwdWJsaWMgZ2V0UmF5bWFyY2hpbmdTaGFkb3dNYXRlcmlhbCgpOiBNYXRlcmlhbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19yYXltYXJjaGluZ1NoYWRvd1JlZ3VsYXJNYXRlcmlhbDtcbiAgfVxuXG4gIC8qKiBUaGUgcmVndWxhciBTREYgc2hhZG93IGNhc3RlciBtYXRlcmlhbCBvZiBvbmUgY29tcG9uZW50IChmb3IgdGVzdHMvZGVidWdnaW5nKS4gKi9cbiAgcHVibGljIGdldFJheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93TWF0ZXJpYWwoY29tcG9uZW50OiBSYXltYXJjaGluZ0NvbXBvbmVudCk6IE1hdGVyaWFsIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93UmVndWxhck1hdGVyaWFscy5nZXQoY29tcG9uZW50LmNvbXBvbmVudFNJRCk7XG4gIH1cblxuICAvKipcbiAgICogUHJvdmlkZXIgb2YgdGhlIFNERiBzaGFkb3cgY2FzdGVyIHBhc3NlcyBoYW5kZWQgdG8gdGhlIFNoYWRvd1N5c3RlbS5cbiAgICovXG4gIHByaXZhdGUgX19nZXRSYXltYXJjaGluZ1NoYWRvd1Bhc3NQcm92aWRlcigpOiBSYXltYXJjaGluZ1NoYWRvd1Bhc3NQcm92aWRlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhhc0Nhc3RlcjogKCkgPT5cbiAgICAgICAgdGhpcy5fX2lzUmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dNb2RlXG4gICAgICAgICAgPyB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dSZWd1bGFyTWF0ZXJpYWxzLnNpemUgPiAwXG4gICAgICAgICAgOiB0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dKc29uICE9IG51bGwgJiYgdGhpcy5fX3JheW1hcmNoaW5nU2hhZG93UmVndWxhck1hdGVyaWFsICE9IG51bGwsXG4gICAgICBjcmVhdGVQYXNzZXM6IHBhcmFtcyA9PiB0aGlzLl9fY3JlYXRlUmF5bWFyY2hpbmdTaGFkb3dQYXNzZXMocGFyYW1zKSxcbiAgICAgIHVwZGF0ZVBvaW50TGlnaHRGYXJQbGFuZTogKHNoYWRvd1Nsb3QsIGZhclBsYW5lKSA9PlxuICAgICAgICB0aGlzLl9fdXBkYXRlUmF5bWFyY2hpbmdTaGFkb3dQb2ludEZhclBsYW5lKHNoYWRvd1Nsb3QsIGZhclBsYW5lKSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBhcmFib2xvaWQgc2hhZG93IGNhc3RlciBtYXRlcmlhbCBwYWlyIGZvciBhIHNoYWRvdyBzbG90LCBjcmVhdGluZyBpdCBvblxuICAgKiBmaXJzdCB1c2UuIEEgcGFpciBwZXIgc2xvdCBpcyBuZWVkZWQgYmVjYXVzZSB0aGUgbGlnaHQgaW5kZXggYW5kIHRoZSBmYXIgcGxhbmUgYXJlXG4gICAqIG1hdGVyaWFsIHBhcmFtZXRlcnMsIHdoaWNoIFdlYkdQVSB1cGxvYWRzIG9uY2UgcGVyIGZyYW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldFJheW1hcmNoaW5nU2hhZG93UG9pbnRNYXRlcmlhbHMoXG4gICAgc2hhZG93U2xvdDogbnVtYmVyLFxuICAgIGxpZ2h0Q29tcG9uZW50U0lEOiBudW1iZXIsXG4gICAgZmFyUGxhbmU6IG51bWJlclxuICApOiB7IGZyb250OiBNYXRlcmlhbDsgYmFjazogTWF0ZXJpYWwgfSB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IHBhaXIgPSB0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dQb2ludFNsb3RzLmdldChzaGFkb3dTbG90KTtcbiAgICBpZiAocGFpciA9PSBudWxsKSB7XG4gICAgICBjb25zdCBqc29uID0gdGhpcy5fX3JheW1hcmNoaW5nU2hhZG93SnNvbjtcbiAgICAgIGlmIChqc29uID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZyb250ID0gY3JlYXRlTm9kZUJhc2VkUmF5bWFyY2hpbmdTaGFkb3dNYXRlcmlhbCh0aGlzLl9fZW5naW5lLCBqc29uLCAncGFyYWJvbG9pZEZyb250Jyk7XG4gICAgICBjb25zdCBiYWNrID0gY3JlYXRlTm9kZUJhc2VkUmF5bWFyY2hpbmdTaGFkb3dNYXRlcmlhbCh0aGlzLl9fZW5naW5lLCBqc29uLCAncGFyYWJvbG9pZEJhY2snKTtcbiAgICAgIGlmIChmcm9udCA9PSBudWxsIHx8IGJhY2sgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgcGFpciA9IHsgZnJvbnQsIGJhY2sgfTtcbiAgICAgIHRoaXMuX19yYXltYXJjaGluZ1NoYWRvd1BvaW50U2xvdHMuc2V0KHNoYWRvd1Nsb3QsIHBhaXIpO1xuICAgIH1cblxuICAgIC8vIEEgc2xvdCBjYW4gYmUgcmVhc3NpZ25lZCB0byBhbm90aGVyIGxpZ2h0LCBzbyBrZWVwIHRoZSBsaWdodCBpbmRleCBjdXJyZW50LlxuICAgIGNvbnN0IGxpZ2h0SW5kZXggPSBTY2FsYXIuZnJvbUNvcHlOdW1iZXIobGlnaHRDb21wb25lbnRTSUQpO1xuICAgIHBhaXIuZnJvbnQuc2V0UGFyYW1ldGVyKCdsaWdodEluZGV4JywgbGlnaHRJbmRleCk7XG4gICAgcGFpci5iYWNrLnNldFBhcmFtZXRlcignbGlnaHRJbmRleCcsIGxpZ2h0SW5kZXgpO1xuICAgIHRoaXMuX19zZXRSYXltYXJjaGluZ1NoYWRvd1BvaW50RmFyUGxhbmUocGFpciwgZmFyUGxhbmUpO1xuICAgIHJldHVybiBwYWlyO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3NldFJheW1hcmNoaW5nU2hhZG93UG9pbnRGYXJQbGFuZShwYWlyOiB7IGZyb250OiBNYXRlcmlhbDsgYmFjazogTWF0ZXJpYWwgfSwgZmFyUGxhbmU6IG51bWJlcikge1xuICAgIGNvbnN0IHZhbHVlID0gU2NhbGFyLmZyb21Db3B5TnVtYmVyKGZhclBsYW5lKTtcbiAgICBwYWlyLmZyb250LnNldFBhcmFtZXRlcignc2hhZG93RmFyUGxhbmUnLCB2YWx1ZSk7XG4gICAgcGFpci5iYWNrLnNldFBhcmFtZXRlcignc2hhZG93RmFyUGxhbmUnLCB2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcGFyYWJvbG9pZCBjYXN0ZXIgbWF0ZXJpYWwgcGFpciBvZiBvbmUgY29tcG9uZW50IGZvciBhIHNoYWRvdyBzbG90LFxuICAgKiBjcmVhdGluZyBpdCBvbiBmaXJzdCB1c2UuXG4gICAqXG4gICAqIEBwYXJhbSBzaGFkb3dTbG90IC0gVGhlIHNoYWRvdyBzbG90IG9mIHRoZSBwb2ludCBsaWdodFxuICAgKiBAcGFyYW0gbGlnaHRDb21wb25lbnRTSUQgLSBUaGUgbGlnaHQgY29tcG9uZW50IFNJRCBzdG9yZWQgYXMgYGxpZ2h0SW5kZXhgXG4gICAqIEBwYXJhbSBmYXJQbGFuZSAtIFRoZSBmYXIgcGxhbmUgb2YgdGhlIHBvaW50IGxpZ2h0IHNoYWRvd1xuICAgKiBAcGFyYW0gY29tcG9uZW50IC0gVGhlIFNERiBjb21wb25lbnQgcmVuZGVyZWQgaW50byB0aGUgc2hhZG93IG1hcFxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldFJheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93UG9pbnRNYXRlcmlhbHMoXG4gICAgc2hhZG93U2xvdDogbnVtYmVyLFxuICAgIGxpZ2h0Q29tcG9uZW50U0lEOiBudW1iZXIsXG4gICAgZmFyUGxhbmU6IG51bWJlcixcbiAgICBjb21wb25lbnQ6IFJheW1hcmNoaW5nQ29tcG9uZW50XG4gICk6IHsgZnJvbnQ6IE1hdGVyaWFsOyBiYWNrOiBNYXRlcmlhbCB9IHwgdW5kZWZpbmVkIHtcbiAgICBsZXQgc2xvdFBhaXJzID0gdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93UG9pbnRTbG90cy5nZXQoc2hhZG93U2xvdCk7XG4gICAgaWYgKHNsb3RQYWlycyA9PSBudWxsKSB7XG4gICAgICBzbG90UGFpcnMgPSBuZXcgTWFwKCk7XG4gICAgICB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dQb2ludFNsb3RzLnNldChzaGFkb3dTbG90LCBzbG90UGFpcnMpO1xuICAgIH1cbiAgICBsZXQgcGFpciA9IHNsb3RQYWlycy5nZXQoY29tcG9uZW50LmNvbXBvbmVudFNJRCk7XG4gICAgaWYgKHBhaXIgPT0gbnVsbCkge1xuICAgICAgY29uc3QgZnJvbnQgPSBjcmVhdGVOb2RlQmFzZWRSYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd01hdGVyaWFsKHRoaXMuX19lbmdpbmUsIGNvbXBvbmVudCwgJ3BhcmFib2xvaWRGcm9udCcpO1xuICAgICAgY29uc3QgYmFjayA9IGNyZWF0ZU5vZGVCYXNlZFJheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93TWF0ZXJpYWwodGhpcy5fX2VuZ2luZSwgY29tcG9uZW50LCAncGFyYWJvbG9pZEJhY2snKTtcbiAgICAgIGlmIChmcm9udCA9PSBudWxsIHx8IGJhY2sgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgcGFpciA9IHsgZnJvbnQsIGJhY2sgfTtcbiAgICAgIHNsb3RQYWlycy5zZXQoY29tcG9uZW50LmNvbXBvbmVudFNJRCwgcGFpcik7XG4gICAgfVxuXG4gICAgLy8gQSBzbG90IGNhbiBiZSByZWFzc2lnbmVkIHRvIGFub3RoZXIgbGlnaHQsIHNvIGtlZXAgdGhlIGxpZ2h0IGluZGV4IGN1cnJlbnQuXG4gICAgY29uc3QgbGlnaHRJbmRleCA9IFNjYWxhci5mcm9tQ29weU51bWJlcihsaWdodENvbXBvbmVudFNJRCk7XG4gICAgcGFpci5mcm9udC5zZXRQYXJhbWV0ZXIoJ2xpZ2h0SW5kZXgnLCBsaWdodEluZGV4KTtcbiAgICBwYWlyLmJhY2suc2V0UGFyYW1ldGVyKCdsaWdodEluZGV4JywgbGlnaHRJbmRleCk7XG4gICAgdGhpcy5fX3NldFJheW1hcmNoaW5nU2hhZG93UG9pbnRGYXJQbGFuZShwYWlyLCBmYXJQbGFuZSk7XG4gICAgcmV0dXJuIHBhaXI7XG4gIH1cblxuICBwcml2YXRlIF9fdXBkYXRlUmF5bWFyY2hpbmdTaGFkb3dQb2ludEZhclBsYW5lKHNoYWRvd1Nsb3Q6IG51bWJlciwgZmFyUGxhbmU6IG51bWJlcikge1xuICAgIGNvbnN0IHBhaXIgPSB0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dQb2ludFNsb3RzLmdldChzaGFkb3dTbG90KTtcbiAgICBpZiAocGFpciAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fc2V0UmF5bWFyY2hpbmdTaGFkb3dQb2ludEZhclBsYW5lKHBhaXIsIGZhclBsYW5lKTtcbiAgICB9XG4gICAgY29uc3QgY29tcG9uZW50UGFpcnMgPSB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dQb2ludFNsb3RzLmdldChzaGFkb3dTbG90KTtcbiAgICBpZiAoY29tcG9uZW50UGFpcnMgIT0gbnVsbCkge1xuICAgICAgZm9yIChjb25zdCBjb21wb25lbnRQYWlyIG9mIGNvbXBvbmVudFBhaXJzLnZhbHVlcygpKSB7XG4gICAgICAgIHRoaXMuX19zZXRSYXltYXJjaGluZ1NoYWRvd1BvaW50RmFyUGxhbmUoY29tcG9uZW50UGFpciwgZmFyUGxhbmUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19jcmVhdGVSYXltYXJjaGluZ1NoYWRvd1Bhc3NlcyhwYXJhbXM6IFJheW1hcmNoaW5nU2hhZG93UGFzc1BhcmFtcyk6IFJlbmRlclBhc3NbXSB7XG4gICAgY29uc3QgeyBsaWdodENvbXBvbmVudCwga2luZCwgc2hhZG93U2xvdCwgZmFyUGxhbmUgfSA9IHBhcmFtcztcblxuICAgIGlmICh0aGlzLl9faXNSYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd01vZGUpIHtcbiAgICAgIC8vIE9uZSBkZXB0aC10ZXN0ZWQgY2FzdGVyIHBhc3MgcGVyIGNhc3RTaGFkb3cgY29tcG9uZW50OiBlYWNoIGtlZXBzIGl0cyBvd25cbiAgICAgIC8vIHRleHR1cmVzIGFuZCB1bmlmb3JtcyBpbiB0aGUgc2hhZG93IG1hcC5cbiAgICAgIGNvbnN0IHBhc3NlczogUmVuZGVyUGFzc1tdID0gW107XG4gICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiB0aGlzLl9fZ2V0U29ydGVkUmF5bWFyY2hpbmdDb21wb25lbnRzKCkpIHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50U0lEID0gY29tcG9uZW50LmNvbXBvbmVudFNJRDtcbiAgICAgICAgaWYgKCFjb21wb25lbnQuY2FzdFNoYWRvdyB8fCAhdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzLmhhcyhjb21wb25lbnRTSUQpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG1hdGVyaWFsOiBNYXRlcmlhbCB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGtpbmQgPT09ICdyZWd1bGFyJykge1xuICAgICAgICAgIG1hdGVyaWFsID0gdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93UmVndWxhck1hdGVyaWFscy5nZXQoY29tcG9uZW50U0lEKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwYWlyID0gdGhpcy5fX2dldFJheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93UG9pbnRNYXRlcmlhbHMoXG4gICAgICAgICAgICBzaGFkb3dTbG90LFxuICAgICAgICAgICAgbGlnaHRDb21wb25lbnQuY29tcG9uZW50U0lELFxuICAgICAgICAgICAgZmFyUGxhbmUgPz8gMTAwMCxcbiAgICAgICAgICAgIGNvbXBvbmVudFxuICAgICAgICAgICk7XG4gICAgICAgICAgbWF0ZXJpYWwgPSBraW5kID09PSAncGFyYWJvbG9pZEZyb250JyA/IHBhaXI/LmZyb250IDogcGFpcj8uYmFjaztcbiAgICAgICAgfVxuICAgICAgICBpZiAobWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHBhc3Nlcy5wdXNoKHRoaXMuX19jcmVhdGVSYXltYXJjaGluZ1NoYWRvd1Bhc3MobWF0ZXJpYWwsIHBhcmFtcykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhc3NlcztcbiAgICB9XG5cbiAgICBsZXQgbWF0ZXJpYWw6IE1hdGVyaWFsIHwgdW5kZWZpbmVkO1xuICAgIGlmIChraW5kID09PSAncmVndWxhcicpIHtcbiAgICAgIG1hdGVyaWFsID0gdGhpcy5fX3JheW1hcmNoaW5nU2hhZG93UmVndWxhck1hdGVyaWFsO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwYWlyID0gdGhpcy5fX2dldFJheW1hcmNoaW5nU2hhZG93UG9pbnRNYXRlcmlhbHMoc2hhZG93U2xvdCwgbGlnaHRDb21wb25lbnQuY29tcG9uZW50U0lELCBmYXJQbGFuZSA/PyAxMDAwKTtcbiAgICAgIG1hdGVyaWFsID0ga2luZCA9PT0gJ3BhcmFib2xvaWRGcm9udCcgPyBwYWlyPy5mcm9udCA6IHBhaXI/LmJhY2s7XG4gICAgfVxuICAgIGlmIChtYXRlcmlhbCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHJldHVybiBbdGhpcy5fX2NyZWF0ZVJheW1hcmNoaW5nU2hhZG93UGFzcyhtYXRlcmlhbCwgcGFyYW1zKV07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBvbmUgYnVmZmVyLWxlc3MgU0RGIHNoYWRvdyBjYXN0ZXIgcGFzcyB3aXRoIHRoZSBnaXZlbiBtYXRlcmlhbC5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIGNvbXBvbmVudCdzIChvciBtZXJnZWQpIHNoYWRvdyBjYXN0ZXIgbWF0ZXJpYWxcbiAgICogQHBhcmFtIHBhcmFtcyAtIFRoZSBzaGFkb3cgbWFwIHZhcmlhbnQgcmVxdWVzdFxuICAgKi9cbiAgcHJpdmF0ZSBfX2NyZWF0ZVJheW1hcmNoaW5nU2hhZG93UGFzcyhcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgeyBsaWdodEVudGl0eSwgZnJhbWVidWZmZXIsIGtpbmQgfTogUmF5bWFyY2hpbmdTaGFkb3dQYXNzUGFyYW1zXG4gICk6IFJlbmRlclBhc3Mge1xuICAgIGNvbnN0IHJlbmRlclBhc3MgPSBuZXcgUmVuZGVyUGFzcyh0aGlzLl9fZW5naW5lKTtcbiAgICAvLyBTaGFkb3cgcGFzc2VzIGFyZSBub3QgWFIgbWFpbiBwYXNzZXM6IHRoZXkgdXNlIHRoZSBsaWdodCBjYW1lcmEgYW5kIHJ1biBvbmNlLlxuICAgIHJlbmRlclBhc3MuaXNWclJlbmRlcmluZyA9IGZhbHNlO1xuICAgIHJlbmRlclBhc3Muc2V0QnVmZmVyTGVzc0Z1bGxTY3JlZW5SZW5kZXJpbmcobWF0ZXJpYWwpO1xuICAgIHJlbmRlclBhc3Muc2V0RnJhbWVidWZmZXIoZnJhbWVidWZmZXIpO1xuICAgIC8vIFRoZSBtZXNoIGNhc3RlciBwYXNzIG9mIHRoZSBzYW1lIGxpZ2h0IGhhcyBhbHJlYWR5IGNsZWFyZWQgdGhlIG1vbWVudCBtYXAgYW5kXG4gICAgLy8gd3JpdHRlbiBpdHMgZGVwdGgsIHNvIHRoaXMgcGFzcyBrZWVwcyBib3RoIGFuZCBvbmx5IHdyaXRlcyB3aGVyZSB0aGUgU0RGIGlzIG5lYXJlci5cbiAgICByZW5kZXJQYXNzLnRvQ2xlYXJDb2xvckJ1ZmZlciA9IGZhbHNlO1xuICAgIHJlbmRlclBhc3MudG9DbGVhckRlcHRoQnVmZmVyID0gZmFsc2U7XG4gICAgcmVuZGVyUGFzcy5pc0RlcHRoVGVzdCA9IHRydWU7XG4gICAgcmVuZGVyUGFzcy5kZXB0aFdyaXRlTWFzayA9IHRydWU7XG4gICAgaWYgKGtpbmQgPT09ICdyZWd1bGFyJykge1xuICAgICAgLy8gVGhlIHNoYWRvdyBjYW1lcmEgbXVzdCBkcml2ZSBnZXRfdmlld01hdHJpeCAvIGdldF9wcm9qZWN0aW9uTWF0cml4IGluIHRoZSBzaGFkZXIuXG4gICAgICByZW5kZXJQYXNzLmNhbWVyYUNvbXBvbmVudCA9IChsaWdodEVudGl0eSBhcyB1bmtub3duIGFzIHsgZ2V0Q2FtZXJhKCk6IENhbWVyYUNvbXBvbmVudCB9KS5nZXRDYW1lcmEoKTtcbiAgICB9XG4gICAgcmVuZGVyUGFzcy50cnlUb1NldFVuaXF1ZU5hbWUoYFJheW1hcmNoaW5nU2hhZG93XyR7a2luZH1gLCB0cnVlKTtcbiAgICByZXR1cm4gcmVuZGVyUGFzcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgdGhlIGdyYXBoIHBhcmFtZXRlcnMgKHVuaWZvcm0gdmFsdWVzLCB0ZXh0dXJlcykgYW5kIHRoZSBjdXJyZW50IHRyYW5zZm9ybXNcbiAgICogZnJvbSB0aGUgdmlzaWJsZSByYXltYXJjaGluZyBtYXRlcmlhbHMgdG8gdGhlIFNERiBzaGFkb3cgY2FzdGVyIG1hdGVyaWFscy5cbiAgICpcbiAgICogV2l0aCBwZXItY29tcG9uZW50IHZpc2libGUgbWF0ZXJpYWxzLCBlYWNoIGNvbXBvbmVudCdzIGNhc3RlciBtYXRlcmlhbHMgYXJlIGl0c1xuICAgKiBvd24gKHNhbWUgc2VtYW50aWMgbmFtZXMsIG5vIHBvc3RmaXhpbmcpOiB0aGVpciB1bmlmb3Jtcy90ZXh0dXJlcyBhcmUgY29waWVkIGZyb21cbiAgICogdGhhdCBjb21wb25lbnQncyB2aXNpYmxlIG1hdGVyaWFsIGFuZCB0aGUgY29tcG9uZW50J3Mgd29ybGQgbWF0cml4IGlzIHNldCBvbiB0aGVtLlxuICAgKiBPdGhlcndpc2UgdGhlIGxlZ2FjeSBtZXJnZWQgY2FzdGVycyBhcmUgZmVkIGZyb20gdGhlIG1lcmdlZCB2aXNpYmxlIG1hdGVyaWFsLlxuICAgKlxuICAgKiBUaGlzIHJ1bnMgb25jZSBwZXIgZnJhbWUgQkVGT1JFIEVuZ2luZS5wcm9jZXNzOiBXZWJHUFUgdXBsb2FkcyBtYXRlcmlhbCB2YWx1ZXMgaW4gdGhlXG4gICAqIHByZXJlbmRlciBzdGFnZSwgc28gdXBkYXRpbmcgdGhlbSBvbmx5IGluIGEgcmVuZGVyIHBhc3MgaG9vayB3b3VsZCBsZWF2ZSB0aGUgc2hhZG93XG4gICAqIHBhc3NlcyBvbmUgZnJhbWUgYmVoaW5kLiBzZXRQYXJhbWV0ZXIgLyBzZXRUZXh0dXJlUGFyYW1ldGVyIHJldHVybiBlYXJseSBmb3IgaWRlbnRpY2FsXG4gICAqIHZhbHVlcywgc28gdGhlIGNvcHkgaXMgY2hlYXAuXG4gICAqL1xuICBwcml2YXRlIF9fc3luY1JheW1hcmNoaW5nU2hhZG93TWF0ZXJpYWxQYXJhbWV0ZXJzKCkge1xuICAgIGlmICh0aGlzLl9faXNSYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd01vZGUpIHtcbiAgICAgIHRoaXMuX19zeW5jUmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dNYXRlcmlhbFBhcmFtZXRlcnMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19yYXltYXJjaGluZ1NoYWRvd0pzb24gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1hdGVyaWFsczogTWF0ZXJpYWxbXSA9IFtdO1xuICAgIGlmICh0aGlzLl9fcmF5bWFyY2hpbmdTaGFkb3dSZWd1bGFyTWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWxzLnB1c2godGhpcy5fX3JheW1hcmNoaW5nU2hhZG93UmVndWxhck1hdGVyaWFsKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBwYWlyIG9mIHRoaXMuX19yYXltYXJjaGluZ1NoYWRvd1BvaW50U2xvdHMudmFsdWVzKCkpIHtcbiAgICAgIG1hdGVyaWFscy5wdXNoKHBhaXIuZnJvbnQsIHBhaXIuYmFjayk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50TWF0ZXJpYWxzID0gdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzO1xuICAgIGNvbnN0IGxlZ2FjeU1hdGVyaWFsID0gdGhpcy5nZXRSYXltYXJjaGluZ01hdGVyaWFsKCk7XG4gICAgY29uc3QgZmlyc3RNYXRlcmlhbCA9XG4gICAgICBjb21wb25lbnRNYXRlcmlhbHMuc2l6ZSA+IDAgPyAoY29tcG9uZW50TWF0ZXJpYWxzLnZhbHVlcygpLm5leHQoKS52YWx1ZSBhcyBNYXRlcmlhbCkgOiBsZWdhY3lNYXRlcmlhbDtcbiAgICBjb25zdCBjb3B5U2hhcmVkUGFyYW1ldGVyID0gKG1hdGVyaWFsOiBNYXRlcmlhbCwgc2VtYW50aWM6IHN0cmluZywgaW5mbzogU2hhZGVyU2VtYW50aWNzSW5mbykgPT4ge1xuICAgICAgaWYgKGZpcnN0TWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzVGV4dHVyZShpbmZvLmNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICAgICAgY29uc3QgdGV4dHVyZVBhcmFtZXRlciA9IGZpcnN0TWF0ZXJpYWwuZ2V0VGV4dHVyZVBhcmFtZXRlcihzZW1hbnRpYyBhcyBuZXZlcik7XG4gICAgICAgIGlmICh0ZXh0dXJlUGFyYW1ldGVyICE9IG51bGwpIHtcbiAgICAgICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKHNlbWFudGljIGFzIG5ldmVyLCB0ZXh0dXJlUGFyYW1ldGVyWzFdLCB0ZXh0dXJlUGFyYW1ldGVyWzJdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBmaXJzdE1hdGVyaWFsLmdldFBhcmFtZXRlcihzZW1hbnRpYyBhcyBuZXZlcik7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKHNlbWFudGljIGFzIG5ldmVyLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50cyA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRzV2l0aFR5cGUoXG4gICAgICBSYXltYXJjaGluZ0NvbXBvbmVudFxuICAgICkgYXMgUmF5bWFyY2hpbmdDb21wb25lbnRbXTtcblxuICAgIC8vIFRoZSBtZXJnZWQgY2FzdGVyIGdyYXBoIGNvbnRhaW5zIGV2ZXJ5IGNhc3RTaGFkb3cgY29tcG9uZW50LCBzbyBpdHMgbWFyY2ggaXNcbiAgICAvLyBjbGlwcGVkIHRvIHRoZSB1bmlvbiBvZiB0aGVpciB3b3JsZCBBQUJCcy5cbiAgICBsZXQgdW5pb25NaW5YID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGxldCB1bmlvbk1pblkgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgbGV0IHVuaW9uTWluWiA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICBsZXQgdW5pb25NYXhYID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuICAgIGxldCB1bmlvbk1heFkgPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG4gICAgbGV0IHVuaW9uTWF4WiA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcbiAgICBsZXQgdW5pb25hYmxlID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCByYXltYXJjaGluZ0NvbXBvbmVudCBvZiByYXltYXJjaGluZ0NvbXBvbmVudHMpIHtcbiAgICAgIGlmICghcmF5bWFyY2hpbmdDb21wb25lbnQuY2FzdFNoYWRvdykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHVuaW9uYWJsZSA9IHRydWU7XG4gICAgICBjb25zdCBhYWJiID0gdGhpcy5fX2dldENhY2hlZFJheW1hcmNoaW5nQWFiYihyYXltYXJjaGluZ0NvbXBvbmVudCk7XG4gICAgICBpZiAoYWFiYiA9PSBudWxsKSB7XG4gICAgICAgIHVuaW9uYWJsZSA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHVuaW9uTWluWCA9IE1hdGgubWluKHVuaW9uTWluWCwgYWFiYi5taW4ueCk7XG4gICAgICB1bmlvbk1pblkgPSBNYXRoLm1pbih1bmlvbk1pblksIGFhYmIubWluLnkpO1xuICAgICAgdW5pb25NaW5aID0gTWF0aC5taW4odW5pb25NaW5aLCBhYWJiLm1pbi56KTtcbiAgICAgIHVuaW9uTWF4WCA9IE1hdGgubWF4KHVuaW9uTWF4WCwgYWFiYi5tYXgueCk7XG4gICAgICB1bmlvbk1heFkgPSBNYXRoLm1heCh1bmlvbk1heFksIGFhYmIubWF4LnkpO1xuICAgICAgdW5pb25NYXhaID0gTWF0aC5tYXgodW5pb25NYXhaLCBhYWJiLm1heC56KTtcbiAgICB9XG4gICAgY29uc3Qgc2hhZG93QWFiYk1pbiA9IHVuaW9uYWJsZVxuICAgICAgPyBWZWN0b3IzLmZyb21Db3B5Myh1bmlvbk1pblgsIHVuaW9uTWluWSwgdW5pb25NaW5aKVxuICAgICAgOiBSQVlNQVJDSElOR19VTkJPVU5ERURfQUFCQl9NSU47XG4gICAgY29uc3Qgc2hhZG93QWFiYk1heCA9IHVuaW9uYWJsZVxuICAgICAgPyBWZWN0b3IzLmZyb21Db3B5Myh1bmlvbk1heFgsIHVuaW9uTWF4WSwgdW5pb25NYXhaKVxuICAgICAgOiBSQVlNQVJDSElOR19VTkJPVU5ERURfQUFCQl9NQVg7XG5cbiAgICBmb3IgKGNvbnN0IG1hdGVyaWFsIG9mIG1hdGVyaWFscykge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdyYXltYXJjaEFhYmJNaW4nLCBzaGFkb3dBYWJiTWluKTtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigncmF5bWFyY2hBYWJiTWF4Jywgc2hhZG93QWFiYk1heCk7XG4gICAgICBmb3IgKGNvbnN0IGluZm8gb2YgbWF0ZXJpYWwuZmllbGRzSW5mb0FycmF5KSB7XG4gICAgICAgIGNvbnN0IHNlbWFudGljID0gaW5mby5zZW1hbnRpYztcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHNlbWFudGljLnN0YXJ0c1dpdGgoJ3dvcmxkTWF0cml4XycpIHx8XG4gICAgICAgICAgc2VtYW50aWMuc3RhcnRzV2l0aCgncmF5bWFyY2hPYmplY3RJZF8nKSB8fFxuICAgICAgICAgIHNlbWFudGljID09PSAncmF5bWFyY2hBYWJiTWluJyB8fFxuICAgICAgICAgIHNlbWFudGljID09PSAncmF5bWFyY2hBYWJiTWF4JyB8fFxuICAgICAgICAgIHNlbWFudGljID09PSAnbGlnaHRJbmRleCcgfHxcbiAgICAgICAgICBzZW1hbnRpYyA9PT0gJ3NoYWRvd0ZhclBsYW5lJ1xuICAgICAgICApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBQZXItY29tcG9uZW50IHVuaWZvcm0gbmFtZXMgYXJlIGBuYW1lXzxjb21wb25lbnRTSUQ+YCBpbiB0aGUgbWVyZ2VkIHNoYWRvd1xuICAgICAgICAvLyBncmFwaC4gUmVhZCB0aGUgdmFsdWUgZnJvbSB0aGF0IGNvbXBvbmVudCdzIG93biBtYXRlcmlhbC5cbiAgICAgICAgY29uc3Qgc3VmZml4ZWQgPSAvXiguKilfKFxcZCspJC8uZXhlYyhzZW1hbnRpYyk7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE1hdGVyaWFsID0gc3VmZml4ZWQgIT0gbnVsbCA/IGNvbXBvbmVudE1hdGVyaWFscy5nZXQoTnVtYmVyKHN1ZmZpeGVkWzJdKSkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChjb21wb25lbnRNYXRlcmlhbCAhPSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgYmFzZVNlbWFudGljID0gc3VmZml4ZWQhWzFdO1xuICAgICAgICAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgICAgICAgY29uc3QgdGV4dHVyZVBhcmFtZXRlciA9IGNvbXBvbmVudE1hdGVyaWFsLmdldFRleHR1cmVQYXJhbWV0ZXIoYmFzZVNlbWFudGljIGFzIG5ldmVyKTtcbiAgICAgICAgICAgIGlmICh0ZXh0dXJlUGFyYW1ldGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihzZW1hbnRpYywgdGV4dHVyZVBhcmFtZXRlclsxXSwgdGV4dHVyZVBhcmFtZXRlclsyXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gY29tcG9uZW50TWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKGJhc2VTZW1hbnRpYyBhcyBuZXZlcik7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoc2VtYW50aWMsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29weVNoYXJlZFBhcmFtZXRlcihtYXRlcmlhbCwgc2VtYW50aWMsIGluZm8pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEN1cnJlbnQgdHJhbnNmb3Jtcy9vYmplY3QgaWRzICh0aGUgdmlzaWJsZSBtYXRlcmlhbCBpcyB1cGRhdGVkIGxhdGVyIGluIHRoZSBmcmFtZSkuXG4gICAgICBmb3IgKGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50IG9mIHJheW1hcmNoaW5nQ29tcG9uZW50cykge1xuICAgICAgICBpZiAoIXJheW1hcmNoaW5nQ29tcG9uZW50LmNhc3RTaGFkb3cpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzY2VuZUdyYXBoID0gcmF5bWFyY2hpbmdDb21wb25lbnQuZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICBpZiAoc2NlbmVHcmFwaCAhPSBudWxsKSB7XG4gICAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKGB3b3JsZE1hdHJpeF8ke3JheW1hcmNoaW5nQ29tcG9uZW50LmNvbXBvbmVudFNJRH1gLCBzY2VuZUdyYXBoLm1hdHJpeElubmVyKTtcbiAgICAgICAgfVxuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoXG4gICAgICAgICAgYHJheW1hcmNoT2JqZWN0SWRfJHtyYXltYXJjaGluZ0NvbXBvbmVudC5jb21wb25lbnRTSUR9YCxcbiAgICAgICAgICBTY2FsYXIuZnJvbUNvcHlOdW1iZXIocmF5bWFyY2hpbmdDb21wb25lbnQuY29tcG9uZW50U0lEKVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQZXItY29tcG9uZW50IHZhcmlhbnQgb2YgdGhlIHNoYWRvdyBjYXN0ZXIgcGFyYW1ldGVyIHN5bmM6IGNvcGllcyBlYWNoIGNvbXBvbmVudCdzXG4gICAqIHZpc2libGUgdW5pZm9ybXMvdGV4dHVyZXMgdG8gaXRzIG93biBjYXN0ZXIgbWF0ZXJpYWxzICh0aGVpciBuYW1lcyBtYXRjaCkgYW5kIHNldHNcbiAgICogdGhlIGNvbXBvbmVudCdzIHdvcmxkIG1hdHJpeCBhbmQgd29ybGQgQUFCQiwgd2hpY2ggdGhlIHNoYWRvdyBzaGFkZXIgdXNlcyBmb3IgdGhlXG4gICAqIGRpc3RhbmNlIHNjYWxlIGFuZCB0aGUgcmF5IGludGVydmFsLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3N5bmNSYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd01hdGVyaWFsUGFyYW1ldGVycygpIHtcbiAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiB0aGlzLl9fZ2V0U29ydGVkUmF5bWFyY2hpbmdDb21wb25lbnRzKCkpIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFNJRCA9IGNvbXBvbmVudC5jb21wb25lbnRTSUQ7XG4gICAgICBpZiAoIWNvbXBvbmVudC5jYXN0U2hhZG93KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgdmlzaWJsZU1hdGVyaWFsID0gdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzLmdldChjb21wb25lbnRTSUQpO1xuICAgICAgaWYgKHZpc2libGVNYXRlcmlhbCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2hhZG93TWF0ZXJpYWxzOiBNYXRlcmlhbFtdID0gW107XG4gICAgICBjb25zdCByZWd1bGFyID0gdGhpcy5fX3JheW1hcmNoaW5nQ29tcG9uZW50U2hhZG93UmVndWxhck1hdGVyaWFscy5nZXQoY29tcG9uZW50U0lEKTtcbiAgICAgIGlmIChyZWd1bGFyICE9IG51bGwpIHtcbiAgICAgICAgc2hhZG93TWF0ZXJpYWxzLnB1c2gocmVndWxhcik7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHNsb3RQYWlycyBvZiB0aGlzLl9fcmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dQb2ludFNsb3RzLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnN0IHBhaXIgPSBzbG90UGFpcnMuZ2V0KGNvbXBvbmVudFNJRCk7XG4gICAgICAgIGlmIChwYWlyICE9IG51bGwpIHtcbiAgICAgICAgICBzaGFkb3dNYXRlcmlhbHMucHVzaChwYWlyLmZyb250LCBwYWlyLmJhY2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2hhZG93TWF0ZXJpYWxzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IGNvbXBvbmVudC5lbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCk7XG4gICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IHNjZW5lR3JhcGg/Lm1hdHJpeElubmVyO1xuICAgICAgY29uc3QgYWFiYiA9IHRoaXMuX19nZXRDYWNoZWRSYXltYXJjaGluZ0FhYmIoY29tcG9uZW50KTtcbiAgICAgIGNvbnN0IGFhYmJNaW4gPSBhYWJiPy5taW4gPz8gUkFZTUFSQ0hJTkdfVU5CT1VOREVEX0FBQkJfTUlOO1xuICAgICAgY29uc3QgYWFiYk1heCA9IGFhYmI/Lm1heCA/PyBSQVlNQVJDSElOR19VTkJPVU5ERURfQUFCQl9NQVg7XG4gICAgICBmb3IgKGNvbnN0IHNoYWRvd01hdGVyaWFsIG9mIHNoYWRvd01hdGVyaWFscykge1xuICAgICAgICBpZiAod29ybGRNYXRyaXggIT0gbnVsbCkge1xuICAgICAgICAgIHNoYWRvd01hdGVyaWFsLnNldFBhcmFtZXRlcihSQVlNQVJDSElOR19DT01QT05FTlRfV09STERfTUFUUklYX1NFTUFOVElDLCB3b3JsZE1hdHJpeCk7XG4gICAgICAgIH1cbiAgICAgICAgc2hhZG93TWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdyYXltYXJjaEFhYmJNaW4nLCBhYWJiTWluKTtcbiAgICAgICAgc2hhZG93TWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdyYXltYXJjaEFhYmJNYXgnLCBhYWJiTWF4KTtcbiAgICAgICAgZm9yIChjb25zdCBpbmZvIG9mIHNoYWRvd01hdGVyaWFsLmZpZWxkc0luZm9BcnJheSkge1xuICAgICAgICAgIGNvbnN0IHNlbWFudGljID0gaW5mby5zZW1hbnRpYztcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBzZW1hbnRpYyA9PT0gUkFZTUFSQ0hJTkdfQ09NUE9ORU5UX1dPUkxEX01BVFJJWF9TRU1BTlRJQyB8fFxuICAgICAgICAgICAgc2VtYW50aWMgPT09ICdyYXltYXJjaEFhYmJNaW4nIHx8XG4gICAgICAgICAgICBzZW1hbnRpYyA9PT0gJ3JheW1hcmNoQWFiYk1heCcgfHxcbiAgICAgICAgICAgIHNlbWFudGljID09PSAnbGlnaHRJbmRleCcgfHxcbiAgICAgICAgICAgIHNlbWFudGljID09PSAnc2hhZG93RmFyUGxhbmUnXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc1RleHR1cmUoaW5mby5jb21wb3NpdGlvblR5cGUpKSB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlUGFyYW1ldGVyID0gdmlzaWJsZU1hdGVyaWFsLmdldFRleHR1cmVQYXJhbWV0ZXIoc2VtYW50aWMpO1xuICAgICAgICAgICAgaWYgKHRleHR1cmVQYXJhbWV0ZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBzaGFkb3dNYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKHNlbWFudGljLCB0ZXh0dXJlUGFyYW1ldGVyWzFdLCB0ZXh0dXJlUGFyYW1ldGVyWzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB2aXNpYmxlTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKHNlbWFudGljKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHNoYWRvd01hdGVyaWFsLnNldFBhcmFtZXRlcihzZW1hbnRpYywgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBNYXRlcmlhbHMgb3V0c2lkZSBtZXNoIHByaW1pdGl2ZXMgdGhhdCBzdGlsbCByZWNlaXZlIHNoYWRvd3MgKHRoZSByYXltYXJjaGluZyBtYXRlcmlhbHMpLiAqL1xuICBwcml2YXRlIF9fZ2V0QWRkaXRpb25hbFNoYWRvd01hdGVyaWFscygpOiBNYXRlcmlhbFtdIHtcbiAgICByZXR1cm4gdGhpcy5fX2dldEFsbFJheW1hcmNoaW5nTWF0ZXJpYWxzKCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0UmF5bWFyY2hpbmdNYXRlcmlhbCgpOiBNYXRlcmlhbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19yYXltYXJjaGluZ1JlbmRlclBhc3M/Lm1hdGVyaWFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgdGhlIHBpcGVsaW5lJ3MgSUJMIGVudmlyb25tZW50IHRvIGV2ZXJ5IHJheW1hcmNoaW5nIFBCUiBtYXRlcmlhbC5cbiAgICpcbiAgICogVGhlIHJheW1hcmNoaW5nIGRyYXcgaXMgYnVmZmVyLWxlc3MgYW5kIGhhcyBubyBtZXNoIHJlbmRlcmVyIGNvbXBvbmVudCwgc29cbiAgICogdGhlIElCTCBwYXJhbWV0ZXJzIHRoYXQgbWF0ZXJpYWwgY29udGVudHMgbm9ybWFsbHkgcmVhZCBmcm9tIHRoZSBtZXNoXG4gICAqIHJlbmRlcmVyIGFyZSBzZXQgb24gdGhlIG1hdGVyaWFsIGhlcmUgaW5zdGVhZC5cbiAgICovXG4gIHByaXZhdGUgX19hcHBseUlibFRvUmF5bWFyY2hpbmdNYXRlcmlhbCgpIHtcbiAgICBmb3IgKGNvbnN0IG1hdGVyaWFsIG9mIHRoaXMuX19nZXRBbGxSYXltYXJjaGluZ01hdGVyaWFscygpKSB7XG4gICAgICB0aGlzLl9fYXBwbHlJYmxUb01hdGVyaWFsKG1hdGVyaWFsKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyB0aGUgcGlwZWxpbmUncyBJQkwgZW52aXJvbm1lbnQgdG8gb25lIHJheW1hcmNoaW5nIG1hdGVyaWFsLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWxcbiAgICovXG4gIHByaXZhdGUgX19hcHBseUlibFRvTWF0ZXJpYWwobWF0ZXJpYWw6IE1hdGVyaWFsKSB7XG4gICAgY29uc3QgZGlmZnVzZUVudlZhbHVlID0gbWF0ZXJpYWwuZ2V0VGV4dHVyZVBhcmFtZXRlcihTaGFkZXJTZW1hbnRpY3MuRGlmZnVzZUVudlRleHR1cmUuc3RyKTtcbiAgICBjb25zdCBzcGVjdWxhckVudlZhbHVlID0gbWF0ZXJpYWwuZ2V0VGV4dHVyZVBhcmFtZXRlcihTaGFkZXJTZW1hbnRpY3MuU3BlY3VsYXJFbnZUZXh0dXJlLnN0cik7XG4gICAgaWYgKGRpZmZ1c2VFbnZWYWx1ZSA9PSBudWxsIHx8IHNwZWN1bGFyRW52VmFsdWUgPT0gbnVsbCkge1xuICAgICAgLy8gVGhlIHJheW1hcmNoaW5nIG1hdGVyaWFsIGlzIG5vdCB1c2luZyBQQlIgc2hhZGluZy5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gUHJlc2VudCBvbmx5IHdoZW4gdGhlIHNoYWRpbmcgZ3JhcGggdXNlcyBzaGVlbi5cbiAgICBjb25zdCBzaGVlbkVudlZhbHVlID0gbWF0ZXJpYWwuZ2V0VGV4dHVyZVBhcmFtZXRlcihTaGFkZXJTZW1hbnRpY3MuU2hlZW5FbnZUZXh0dXJlLnN0cik7XG4gICAgY29uc3QgZGlmZnVzZSA9IHRoaXMuX19kaWZmdXNlQ3ViZVRleHR1cmU7XG4gICAgY29uc3Qgc3BlY3VsYXIgPSB0aGlzLl9fc3BlY3VsYXJDdWJlVGV4dHVyZTtcbiAgICBpZiAoZGlmZnVzZSA9PSBudWxsIHx8IHNwZWN1bGFyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGUgdGV4dHVyZXMgbWF5IGJlY29tZSByZWFkeSBhZnRlciB0aGlzIGlzIGNhbGxlZCwgc28gcmUtYXBwbHkgd2hlbiBhbnl0aGluZyBjaGFuZ2VkLlxuICAgIGNvbnN0IHN0YXRlID0gYCR7ZGlmZnVzZS5vYmplY3RVSUR9OiR7ZGlmZnVzZS5pc1RleHR1cmVSZWFkeX06JHtzcGVjdWxhci5vYmplY3RVSUR9OiR7XG4gICAgICBzcGVjdWxhci5pc1RleHR1cmVSZWFkeVxuICAgIH06JHt0aGlzLl9fc2hlZW5DdWJlVGV4dHVyZT8ub2JqZWN0VUlEID8/IC0xfToke3RoaXMuX19zaGVlbkN1YmVUZXh0dXJlPy5pc1RleHR1cmVSZWFkeSA/PyBmYWxzZX06JHtcbiAgICAgIHRoaXMuX19pYmxSb3RhdGlvblxuICAgIH06JHt0aGlzLl9fZGlmZnVzZUlibENvbnRyaWJ1dGlvbn06JHt0aGlzLl9fc3BlY3VsYXJJYmxDb250cmlidXRpb259YDtcbiAgICBpZiAoc3RhdGUgPT09IHRoaXMuX19yYXltYXJjaGluZ0libFN0YXRlcy5nZXQobWF0ZXJpYWwub2JqZWN0VUlEKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fcmF5bWFyY2hpbmdJYmxTdGF0ZXMuc2V0KG1hdGVyaWFsLm9iamVjdFVJRCwgc3RhdGUpO1xuXG4gICAgLy8gUmV1c2UgdGhlIHNoYXJlZCBjdWJlIHNhbXBsZXIgY3JlYXRlZCBmb3IgdGhlIG1hdGVyaWFsJ3MgZW52IHRleHR1cmUgc2VtYW50aWNzLlxuICAgIGNvbnN0IHNhbXBsZXIgPSBkaWZmdXNlRW52VmFsdWVbMl0gYXMgU2FtcGxlcjtcbiAgICBpZiAoZGlmZnVzZS5pc1RleHR1cmVSZWFkeSkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihTaGFkZXJTZW1hbnRpY3MuRGlmZnVzZUVudlRleHR1cmUuc3RyLCBkaWZmdXNlLCBzYW1wbGVyKTtcbiAgICB9XG4gICAgaWYgKHNwZWN1bGFyLmlzVGV4dHVyZVJlYWR5KSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFNoYWRlclNlbWFudGljcy5TcGVjdWxhckVudlRleHR1cmUuc3RyLCBzcGVjdWxhciwgc2FtcGxlcik7XG4gICAgICBpZiAoc2hlZW5FbnZWYWx1ZSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHNoZWVuID0gdGhpcy5fX3NoZWVuQ3ViZVRleHR1cmU/LmlzVGV4dHVyZVJlYWR5ID8gdGhpcy5fX3NoZWVuQ3ViZVRleHR1cmUgOiBzcGVjdWxhcjtcbiAgICAgICAgY29uc3Qgc2hlZW5TYW1wbGVyID0gKHNoZWVuRW52VmFsdWVbMl0gYXMgU2FtcGxlciB8IHVuZGVmaW5lZCkgPz8gc2FtcGxlcjtcbiAgICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihTaGFkZXJTZW1hbnRpY3MuU2hlZW5FbnZUZXh0dXJlLnN0ciwgc2hlZW4sIHNoZWVuU2FtcGxlcik7XG4gICAgICB9XG4gICAgfVxuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcihcbiAgICAgICdpYmxQYXJhbWV0ZXInLFxuICAgICAgVmVjdG9yNC5mcm9tQ29weTQoXG4gICAgICAgIHNwZWN1bGFyLm1pcG1hcExldmVsTnVtYmVyLFxuICAgICAgICB0aGlzLl9fZGlmZnVzZUlibENvbnRyaWJ1dGlvbixcbiAgICAgICAgdGhpcy5fX3NwZWN1bGFySWJsQ29udHJpYnV0aW9uLFxuICAgICAgICB0aGlzLl9faWJsUm90YXRpb25cbiAgICAgIClcbiAgICApO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignaGRyaUZvcm1hdCcsIFZlY3RvcjIuZnJvbUNvcHkyKGRpZmZ1c2UuaGRyaUZvcm1hdC5pbmRleCwgc3BlY3VsYXIuaGRyaUZvcm1hdC5pbmRleCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYSByYXltYXJjaGluZyBtYXRlcmlhbCBzaGFkZXMgd2l0aCB0cmFuc21pc3Npb24sIHdoaWNoIG1lYW5zIGl0XG4gICAqIHNhbXBsZXMgdGhlIHNjZW5lIGNvbG9yIGJlaGluZCB0aGUgU0RGLlxuICAgKlxuICAgKiBPbmx5IHRoZW4gZG9lcyB0aGUgcmF5bWFyY2hpbmcgZXhwcmVzc2lvbiBoYXZlIHRvIHJ1biBhZnRlciB0aGUgb3BhcXVlXG4gICAqIGV4cHJlc3Npb25zLiBXaXRob3V0IHRyYW5zbWlzc2lvbiBpdCBrZWVwcyBpdHMgbGVnYWN5IHBvc2l0aW9uIGJlZm9yZSB0aGVtLFxuICAgKiBzbyBibGVuZGVkIG1lc2hlcyB0aGF0IGFyZSBkcmF3biBpbiB0aGUgb3BhcXVlIGV4cHJlc3Npb24gKHRoZSBwaXBlbGluZSBtYXkgYmVcbiAgICogY29uZmlndXJlZCB3aXRoIGlzVHJhbnNtaXNzaW9uOiBmYWxzZSkga2VlcCBibGVuZGluZyBvdmVyIHRoZSBTREYuXG4gICAqL1xuICBwcml2YXRlIF9faXNSYXltYXJjaGluZ1RyYW5zbWlzc2lvbkVuYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19nZXRBbGxSYXltYXJjaGluZ01hdGVyaWFscygpLnNvbWUobWF0ZXJpYWwgPT4gbWF0ZXJpYWwuaXNTaGFkZXJEZWZpbmUoJ1JOX1VTRV9UUkFOU01JU1NJT04nKSk7XG4gIH1cblxuICAvKipcbiAgICogQmluZHMgdGhlIHJlc29sdmVkIHNjZW5lIGNvbG9yIHRvIGV2ZXJ5IHJheW1hcmNoaW5nIG1hdGVyaWFsIGZvciB0cmFuc21pc3Npb24uXG4gICAqXG4gICAqIFRoaXMgaXMgdGhlIHNhbWUgcmVmZXJlbmNlIHRleHR1cmUgdGhlIHRyYW5zbWlzc2lvbiBtYXRlcmlhbHMgb2YgdGhlIHRyYW5zcGFyZW50XG4gICAqIHBhc3Mgc2FtcGxlLiBUaGUgcmF5bWFyY2hpbmcgZXhwcmVzc2lvbiBpcyByZW5kZXJlZCBhZnRlciB0aGUgb3BhcXVlIGV4cHJlc3Npb25zLFxuICAgKiBzbyB0aGUgdGV4dHVyZSBob2xkcyB0aGUgY3VycmVudCBmcmFtZS4gTWF0ZXJpYWxzIHdpdGhvdXQgdGhlIHNlbWFudGljIGlnbm9yZSB0aGVcbiAgICogY2FsbCwgYW5kIGFuIGlkZW50aWNhbCBiaW5kaW5nIGlzIGEgbm8tb3AsIHNvIHRoaXMgaXMgc2FmZSB0byBydW4gZXZlcnkgZnJhbWUuXG4gICAqL1xuICBwcml2YXRlIF9fYXBwbHlCYWNrQnVmZmVyVGV4dHVyZVRvUmF5bWFyY2hpbmdNYXRlcmlhbCgpIHtcbiAgICBpZiAodGhpcy5fX2lzU2ltcGxlKSB7XG4gICAgICAvLyBTaW1wbGUgbW9kZSBoYXMgbm8gb2Zmc2NyZWVuIHJlbmRlciB0YXJnZXRzLCBzbyBubyBiYWNrIGJ1ZmZlciBleGlzdHMuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGJhY2tCdWZmZXJUZXh0dXJlID0gdGhpcy5fX2dldE1haW5GcmFtZUJ1ZmZlckJhY2tCdWZmZXIoKT8uZ2V0Q29sb3JBdHRhY2hlZFJlbmRlclRhcmdldFRleHR1cmUoMCk7XG4gICAgY29uc3Qgc2FtcGxlciA9IHRoaXMuX19zYW1wbGVyRm9yQmFja0J1ZmZlcjtcbiAgICBpZiAoYmFja0J1ZmZlclRleHR1cmUgPT0gbnVsbCB8fCBzYW1wbGVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb25zdCBtYXRlcmlhbCBvZiB0aGlzLl9fZ2V0QWxsUmF5bWFyY2hpbmdNYXRlcmlhbHMoKSkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihTaGFkZXJTZW1hbnRpY3MuQmFja0J1ZmZlclRleHR1cmUuc3RyLCBiYWNrQnVmZmVyVGV4dHVyZSwgc2FtcGxlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIG1ldGhvZCB0byBzZXQgdXAgdGhlIGZyYW1lIHdpdGggYWxsIGNvbmZpZ3VyZWQgZXhwcmVzc2lvbnMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBhdXRvbWF0aWNhbGx5IGR1cmluZyB0aGUgcmVuZGVyIGxvb3AgdG8gY29uZmlndXJlXG4gICAqIHRoZSBmcmFtZSB3aXRoIGFsbCBuZWNlc3NhcnkgZXhwcmVzc2lvbnMgaW4gdGhlIGNvcnJlY3Qgb3JkZXI6XG4gICAqIDEuIEluaXRpYWwgZXhwcmVzc2lvbiAoYnVmZmVyIGNsZWFyaW5nKVxuICAgKiAyLiBTaGFkb3cgZXhwcmVzc2lvbnNcbiAgICogMy4gTWFpbiBleHByZXNzaW9ucyAob3BhcXVlIHJlbmRlcmluZylcbiAgICogNC4gTWlwbWFwIGdlbmVyYXRpb25cbiAgICogNS4gTXVsdGktdmlldyBibGl0dGluZ1xuICAgKiA2LiBSYXltYXJjaGluZyBleHByZXNzaW9uIGZvciB0cmFuc21pc3Npb24gbWF0ZXJpYWxzIChzYW1wbGVzIHRoZSBzY2VuZSBjb2xvcjtcbiAgICogICAgd2l0aG91dCB0cmFuc21pc3Npb24gdGhlIHJheW1hcmNoaW5nIGV4cHJlc3Npb24gaXMgZHJhd24gYmVmb3JlIHN0ZXAgMylcbiAgICogNy4gVHJhbnNwYXJlbnQgZXhwcmVzc2lvbnNcbiAgICogOC4gQmxvb20gZWZmZWN0XG4gICAqIDkuIFRvbmUgbWFwcGluZ1xuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgX19zZXRVcEV4cHJlc3Npb25zRm9yUmVuZGVyaW5nKCkge1xuICAgIGNvbnN0IGZyYW1lID0gdGhpcy5fX2ZyYW1lO1xuICAgIGlmIChmcmFtZSA9PSBudWxsKSB7XG4gICAgICBjb25zb2xlLmxvZygnRnJhbWUgaXMgbm90IHNldC4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZnJhbWUuY2xlYXJFeHByZXNzaW9ucygpO1xuICAgIC8vIGluaXRpYWwgZXhwcmVzc2lvbiBmb3IgY2xlYXJpbmcgdGhlIGZyYW1lIGJ1ZmZlclxuICAgIGZyYW1lLmFkZEV4cHJlc3Npb24odGhpcy5fX2luaXRpYWxFeHByZXNzaW9uISk7XG5cbiAgICAvLyBQZXItY29tcG9uZW50IG1hdGVyaWFscyByZW5kZXIgb25lIHBhc3MgcGVyIGNvbXBvbmVudCAoU0lEIG9yZGVyKTsgb3RoZXJ3aXNlIHRoZVxuICAgIC8vIGxlZ2FjeSBtZXJnZWQgbWF0ZXJpYWwgcmVuZGVycyBldmVyeXRoaW5nIGluIGEgc2luZ2xlIHBhc3MuXG4gICAgdGhpcy5fX3JheW1hcmNoaW5nRXhwcmVzc2lvbiA9IHRoaXMuX19idWlsZFJheW1hcmNoaW5nRXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKCF0aGlzLl9faXNTaW1wbGUpIHtcbiAgICAgIC8vIGRlcHRoIG1hcCBnZW5lcmF0aW9uIGZvciBzaGFkb3cgbWFwcGluZy4gVGhpcyBydW5zIGJlZm9yZSB0aGUgcmF5bWFyY2hpbmdcbiAgICAgIC8vIHBhc3Mgc28gdGhhdCB0aGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgcmVhZHMgdGhlIHNoYWRvdyBtYXBzIG9mIHRoaXMgZnJhbWUuXG4gICAgICBmb3IgKGNvbnN0IGV4cCBvZiB0aGlzLl9fc2hhZG93RXhwcmVzc2lvbnMpIHtcbiAgICAgICAgZnJhbWUuYWRkRXhwcmVzc2lvbihleHApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHJheW1hcmNoaW5nVXNlc1RyYW5zbWlzc2lvbiA9IHRoaXMuX19pc1JheW1hcmNoaW5nVHJhbnNtaXNzaW9uRW5hYmxlZCgpO1xuICAgIGlmICghcmF5bWFyY2hpbmdVc2VzVHJhbnNtaXNzaW9uICYmIHRoaXMuX19yYXltYXJjaGluZ0V4cHJlc3Npb24gIT0gbnVsbCkge1xuICAgICAgLy8gTGVnYWN5IG9yZGVyOiB0aGUgU0RGIGlzIGRyYXduIGJlZm9yZSB0aGUgb3BhcXVlIGV4cHJlc3Npb25zIChpdHMgZGVwdGggd3JpdGVzXG4gICAgICAvLyBjdWxsIG9wYXF1ZSBtZXNoZXMgYmVoaW5kIGl0KSwgYW5kIGJsZW5kZWQgcHJpbWl0aXZlcyByZW5kZXJlZCBieSB0aG9zZVxuICAgICAgLy8gZXhwcmVzc2lvbnMgZHJhdyBvdmVyIHRoZSBTREYuXG4gICAgICBmcmFtZS5hZGRFeHByZXNzaW9uKHRoaXMuX19yYXltYXJjaGluZ0V4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIC8vIG1haW4gZXhwcmVzc2lvbnMgZm9yIG9wYXF1ZSByZW5kZXJpbmdcbiAgICBmb3IgKGNvbnN0IGV4cCBvZiB0aGlzLl9fZXhwcmVzc2lvbnMpIHtcbiAgICAgIGlmICh0aGlzLl9faXNTaW1wbGUpIHtcbiAgICAgICAgLy8gb3V0cHV0IFZSIGRpc3BsYXlcbiAgICAgICAgZXhwLnJlbmRlclBhc3Nlcy5mb3JFYWNoKHJlbmRlclBhc3MgPT4ge1xuICAgICAgICAgIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWciA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXhwLnJlbmRlclBhc3Nlcy5mb3JFYWNoKHJlbmRlclBhc3MgPT4ge1xuICAgICAgICAgIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWciA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGZyYW1lLmFkZEV4cHJlc3Npb24oZXhwKTtcbiAgICB9XG5cbiAgICAvLyBtaXBtYXAgZ2VuZXJhdGlvbiBmb3IgZ2xURiB0cmFuc21pc3Npb24gdmlzdWFsIGVmZmVjdFxuICAgIGlmICghdGhpcy5fX2lzU2ltcGxlICYmIHRoaXMuX19nZW5lcmF0ZU1pcG1hcHNFeHByZXNzaW9uICE9IG51bGwgJiYgIU1pc2NVdGlsLmlzTW9iaWxlKCkpIHtcbiAgICAgIGZyYW1lLmFkZEV4cHJlc3Npb24odGhpcy5fX2dlbmVyYXRlTWlwbWFwc0V4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIC8vIG11bHRpLXZpZXcgYmxpdHRpbmcgZm9yIFZSIHJlbmRlcmluZ1xuICAgIGlmICghdGhpcy5fX2lzU2ltcGxlICYmIHRoaXMuX19tdWx0aVZpZXdCbGl0QmFja0J1ZmZlckV4cHJlc3Npb24gIT0gbnVsbCkge1xuICAgICAgZnJhbWUuYWRkRXhwcmVzc2lvbih0aGlzLl9fbXVsdGlWaWV3QmxpdEJhY2tCdWZmZXJFeHByZXNzaW9uKTtcbiAgICB9XG5cbiAgICAvLyBSYXltYXJjaGluZyB3aXRoIHRyYW5zbWlzc2lvbiBzYW1wbGVzIHRoZSBzY2VuZSBjb2xvciBiZWhpbmQgdGhlIFNERiwgc28gaXQgcnVuc1xuICAgIC8vIGFmdGVyIHRoZSBvcGFxdWUgZXhwcmVzc2lvbnMgKGFuZCBhZnRlciB0aGUgYmFjayBidWZmZXIgYW5kIGl0cyBtaXBtYXBzIGFyZVxuICAgIC8vIHJlYWR5KS4gSXQgc3RpbGwgcnVucyBiZWZvcmUgdGhlIHRyYW5zcGFyZW50IGV4cHJlc3Npb25zLCB3aG9zZSBtYXRlcmlhbHMgcmVmcmFjdFxuICAgIC8vIHRoZSBTREYsIGFuZCBpdHMgZGVwdGggd3JpdGVzIGN1bGwgb3BhcXVlIG1lc2hlcyBiZWhpbmQgdGhlIFNERiBhcyBiZWZvcmUuXG4gICAgaWYgKHJheW1hcmNoaW5nVXNlc1RyYW5zbWlzc2lvbiAmJiB0aGlzLl9fcmF5bWFyY2hpbmdFeHByZXNzaW9uICE9IG51bGwpIHtcbiAgICAgIGZyYW1lLmFkZEV4cHJlc3Npb24odGhpcy5fX3JheW1hcmNoaW5nRXhwcmVzc2lvbik7XG4gICAgfVxuXG4gICAgLy8gdHJhbnNwYXJlbnQgZXhwcmVzc2lvbnMgZm9yIHRyYW5zcGFyZW50IHJlbmRlcmluZ1xuICAgIGZvciAoY29uc3QgZXhwIG9mIHRoaXMuX190cmFuc3BhcmVudE9ubHlFeHByZXNzaW9ucykge1xuICAgICAgaWYgKHRoaXMuX19pc1NpbXBsZSkge1xuICAgICAgICAvLyBvdXRwdXQgVlIgZGlzcGxheVxuICAgICAgICBleHAucmVuZGVyUGFzc2VzLmZvckVhY2gocmVuZGVyUGFzcyA9PiB7XG4gICAgICAgICAgcmVuZGVyUGFzcy5pc091dHB1dEZvclZyID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBleHAucmVuZGVyUGFzc2VzLmZvckVhY2gocmVuZGVyUGFzcyA9PiB7XG4gICAgICAgICAgcmVuZGVyUGFzcy5pc091dHB1dEZvclZyID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZnJhbWUuYWRkRXhwcmVzc2lvbihleHApO1xuICAgIH1cblxuICAgIC8vIGdpem1vIGV4cHJlc3Npb24gZm9yIHJlbmRlcmluZyBnaXptb3NcbiAgICAvLyBJbiBub24tc2ltcGxlIG1vZGUsIGdpem1vcyBhcmUgcmVuZGVyZWQgdG8gdGhlIG9mZnNjcmVlbiBmcmFtZWJ1ZmZlciAoYmVmb3JlIHRvbmUgbWFwcGluZylcbiAgICAvLyB0byBoYXZlIHByb3BlciBkZXB0aCB0ZXN0aW5nLiBJbiBzaW1wbGUgbW9kZSwgZ2l6bW9zIGFyZSByZW5kZXJlZCB0byB0aGUgYmFjayBidWZmZXIuXG4gICAgaWYgKHRoaXMuX19naXptb0V4cHJlc3Npb24ucmVuZGVyUGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICghdGhpcy5fX2lzU2ltcGxlKSB7XG4gICAgICAgIC8vIFNldCBmcmFtZWJ1ZmZlciBmb3IgZ2l6bW8gcmVuZGVyIHBhc3NlcyBzbyB0aGV5IHJlbmRlciB0byB0aGUgc2FtZSBGQk8gYXMgdGhlIG1haW4gc2NlbmVcbiAgICAgICAgLy8gVXNlIF9fZ2V0TWFpbkZyYW1lQnVmZmVyKCkgKE1TQUEgZnJhbWVidWZmZXIpIHRvIHNoYXJlIHRoZSBzYW1lIGRlcHRoIGJ1ZmZlciB3aXRoIHRoZSBtYWluIHNjZW5lLlxuICAgICAgICAvLyBOb3RlOiBfX2dldE1haW5GcmFtZUJ1ZmZlclJlc29sdmUoKSBkb2Vzbid0IHdvcmsgYmVjYXVzZSBkZXB0aCBpcyBub3QgcmVzb2x2ZWQgaW4gV2ViR1BVIE1TQUEgcmVzb2x2ZS5cbiAgICAgICAgY29uc3QgbWFpbkZyYW1lQnVmZmVyID0gdGhpcy5fX2dldE1haW5GcmFtZUJ1ZmZlcigpO1xuICAgICAgICBpZiAobWFpbkZyYW1lQnVmZmVyICE9IG51bGwpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IHJwIG9mIHRoaXMuX19naXptb0V4cHJlc3Npb24ucmVuZGVyUGFzc2VzKSB7XG4gICAgICAgICAgICBycC5zZXRGcmFtZWJ1ZmZlcihtYWluRnJhbWVCdWZmZXIpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX19mcmFtZUJ1ZmZlck1zYWEgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBycC5zZXRSZXNvbHZlRnJhbWVidWZmZXIodGhpcy5fX2ZyYW1lQnVmZmVyUmVzb2x2ZSEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnJhbWUuYWRkRXhwcmVzc2lvbih0aGlzLl9fZ2l6bW9FeHByZXNzaW9uKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbnRpdGllcyA9IHRoaXMuX19leHByZXNzaW9ucy5mbGF0TWFwKGV4cHJlc3Npb24gPT5cbiAgICAgIGV4cHJlc3Npb24ucmVuZGVyUGFzc2VzLmZsYXRNYXAocmVuZGVyUGFzcyA9PiByZW5kZXJQYXNzLmVudGl0aWVzKVxuICAgICkgYXMgSVNjZW5lR3JhcGhFbnRpdHlbXTtcbiAgICB0aGlzLl9fZW50aXRpZXNGb3JTaGFkb3cgPSBlbnRpdGllcztcblxuICAgIC8vIHRlbXBvcmFsIGFudGktYWxpYXNpbmc6IG1vdGlvbiB2ZWN0b3JzIGFuZCB0aGUgcmVzb2x2ZSB3aXRoIHRoZSBoaXN0b3J5XG4gICAgaWYgKHRoaXMuX190ZW1wb3JhbEFBICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX190ZW1wb3JhbEFBLnNldEVudGl0aWVzKGVudGl0aWVzKTtcbiAgICAgIGZyYW1lLmFkZEV4cHJlc3Npb24odGhpcy5fX3RlbXBvcmFsQUEuZXhwcmVzc2lvbik7XG4gICAgfVxuXG4gICAgLy8gbXVsdGktdmlldyBibGl0dGluZyBmb3IgVlIgcmVuZGVyaW5nXG4gICAgaWYgKCF0aGlzLl9faXNTaW1wbGUgJiYgdGhpcy5fX211bHRpVmlld0JsaXRFeHByZXNzaW9uICE9IG51bGwpIHtcbiAgICAgIGZyYW1lLmFkZEV4cHJlc3Npb24odGhpcy5fX211bHRpVmlld0JsaXRFeHByZXNzaW9uKTtcbiAgICB9XG5cbiAgICAvLyBibG9vbSBlZmZlY3QgZm9yIHBvc3QtcHJvY2Vzc2luZ1xuICAgIGlmICghdGhpcy5fX2lzU2ltcGxlICYmIHRoaXMuX19pc0Jsb29tICYmIHRoaXMuX19ibG9vbUV4cHJlc3Npb24gIT0gbnVsbCkge1xuICAgICAgZnJhbWUuYWRkRXhwcmVzc2lvbih0aGlzLl9fYmxvb21FeHByZXNzaW9uKTtcbiAgICB9XG5cbiAgICAvLyB0b25lIG1hcHBpbmcgZm9yIEhEUiB0byBMRFIgY29udmVyc2lvblxuICAgIGlmICghdGhpcy5fX2lzU2ltcGxlICYmIHRoaXMuX190b25lTWFwcGluZ0V4cHJlc3Npb24gIT0gbnVsbCkge1xuICAgICAgZnJhbWUuYWRkRXhwcmVzc2lvbih0aGlzLl9fdG9uZU1hcHBpbmdFeHByZXNzaW9uKTtcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLDRCQUE0QjtBQUNyQyxTQUFTLGdCQUFnQjtBQUN6QjtBQUFBLEVBQ0U7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxP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QUM1QztBQUVBLFVBQU0sV0FBVyxLQUFLRCxHQUFjO0FBQUEsTUFBUSxnQkFDMUMsV0FBVyxhQUFhLFFBQVEsZ0JBQWMsV0FBVyxRQUFRO0FBQUEsSUFDbkU7QUFDQSxTQUFLYSxLQUFzQjtBQUczQixRQUFJLEtBQUthLE1BQWdCLE1BQU07QUFDN0IsV0FBS0EsR0FBYSxZQUFZLFFBQVE7QUFDdEMsWUFBTSxjQUFjLEtBQUtBLEdBQWEsVUFBVTtBQUFBLElBQ2xEO0FBR0EsUUFBSSxDQUFDLEtBQUs3QixNQUFjLEtBQUtnQyxNQUE2QixNQUFNO0FBQzlELFlBQU0sY0FBYyxLQUFLQSxFQUF5QjtBQUFBLElBQ3BEO0FBR0EsUUFBSSxDQUFDLEtBQUtoQyxNQUFjLEtBQUtELE1BQWEsS0FBS2tDLE1BQXFCLE1BQU07QUFDeEUsWUFBTSxjQUFjLEtBQUtBLEVBQWlCO0FBQUEsSUFDNUM7QUFHQSxRQUFJLENBQUMsS0FBS2pDLE1BQWMsS0FBS2tDLE1BQTJCLE1BQU07QUFDNUQsWUFBTSxjQUFjLEtBQUtBLEVBQXVCO0FBQUEsSUFDbEQ7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fd2lkdGgiLCAiX19oZWlnaHQiLCAiX19pc1NoYWRvdyIsICJfX2lzQmxvb20iLCAiX19pc1NpbXBsZSIsICJfX2lzVGVtcG9yYWxBQSIsICJfX3NoYWRvd01hcFNpemUiLCAiX19leHByZXNzaW9ucyIsICJfX2dpem1vRXhwcmVzc2lvbiIsICJfX3RyYW5zcGFyZW50T25seUV4cHJlc3Npb25zIiwgIl9faWJsUm90YXRpb24iLCAiX19kaWZmdXNlSWJsQ29udHJpYnV0aW9uIiwgIl9fc3BlY3VsYXJJYmxDb250cmlidXRpb24iLCAiX19yYXltYXJjaGluZ0libFN0YXRlcyIsICJfX3JheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzIiwgIl9fcmF5bWFyY2hpbmdDb21wb25lbnRQYXNzZXMiLCAiX19yYXltYXJjaGluZ0ZpcnN0Q29tcG9uZW50UGFzc1NJRCIsICJfX3JheW1hcmNoaW5nQWFiYkNhY2hlIiwgIl9fdG9uZU1hcHBpbmdUeXBlIiwgIl9fc2hhZG93RXhwcmVzc2lvbnMiLCAiX19lbnRpdGllc0ZvclNoYWRvdyIsICJfX3JheW1hcmNoaW5nU2hhZG93UG9pbnRTbG90cyIsICJfX2lzUmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dNb2RlIiwgIl9fcmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dSZWd1bGFyTWF0ZXJpYWxzIiwgIl9fcmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dQb2ludFNsb3RzIiwgIl9fZW5naW5lIiwgIl9fYmxvb21IZWxwZXIiLCAiX19kZXN0cm95UmVzb3VyY2VzIiwgIl9fZnJhbWVCdWZmZXJNdWx0aVZpZXciLCAiX19mcmFtZUJ1ZmZlck11bHRpVmlld0JsaXQiLCAiX19mcmFtZUJ1ZmZlck1zYWEiLCAiX19mcmFtZUJ1ZmZlclJlc29sdmUiLCAiX19mcmFtZUJ1ZmZlclJlc29sdmVGb3JSZWZlcmVuY2UiLCAiX190ZW1wb3JhbEFBIiwgIl9fZnJhbWUiLCAiX19nZW5lcmF0ZU1pcG1hcHNFeHByZXNzaW9uIiwgIl9fbXVsdGlWaWV3QmxpdEV4cHJlc3Npb24iLCAiX19ibG9vbUV4cHJlc3Npb24iLCAiX190b25lTWFwcGluZ0V4cHJlc3Npb24iLCAiX19yYXltYXJjaGluZ0V4cHJlc3Npb24iLCAiX19yYXltYXJjaGluZ1NoYWRvd0pzb24iLCAiX19yYXltYXJjaGluZ1NoYWRvd1JlZ3VsYXJNYXRlcmlhbCIsICJfX3NhbXBsZXJGb3JCYWNrQnVmZmVyIiwgIl9fY3JlYXRlUmVuZGVyVGFyZ2V0cyIsICJfX3NoYWRvd1N5c3RlbSIsICJfX3NldHVwR2VuZXJhdGVNaXBtYXBzRXhwcmVzc2lvbiIsICJfX211bHRpVmlld0JsaXRCYWNrQnVmZmVyRXhwcmVzc2lvbiIsICJfX3NldHVwTXVsdGlWaWV3QmxpdEJhY2tCdWZmZXJFeHByZXNzaW9uIiwgIl9fc2V0dXBNdWx0aVZpZXdCbGl0RXhwcmVzc2lvbiIsICJfX2dldE1haW5GcmFtZUJ1ZmZlclJlc29sdmUiLCAiX19pc1RlbXBvcmFsQUFBY3RpdmUiLCAiX19zZXR1cFRvbmVNYXBwaW5nRXhwcmVzc2lvbiIsICJfX2luaXRpYWxFeHByZXNzaW9uIiwgIl9fc2V0dXBJbml0aWFsRXhwcmVzc2lvbiIsICJfX3NldHVwUmF5bWFyY2hpbmdFeHByZXNzaW9uIiwgIl9fcmF5bWFyY2hpbmdSZW5kZXJQYXNzIiwgIl9fc2V0VXBFeHByZXNzaW9uc0ZvclJlbmRlcmluZyIsICJfX2dldE1haW5GcmFtZUJ1ZmZlckJhY2tCdWZmZXIiLCAiX19mcmFtZUJ1ZmZlck11bHRpVmlld0JsaXRCYWNrQnVmZmVyIiwgIl9fZ2V0TWFpbkZyYW1lQnVmZmVyIiwgIl9fc2V0RXhwcmVzc2lvbnNJbm5lciIsICJfX3NldFRyYW5zcGFyZW50RXhwcmVzc2lvbnNGb3JUcmFuc21pc3Npb24iLCAiX19nZXRBZGRpdGlvbmFsU2hhZG93TWF0ZXJpYWxzIiwgIl9fZ2V0UmF5bWFyY2hpbmdTaGFkb3dQYXNzUHJvdmlkZXIiLCAiX19kcmF3RnVuYyIsICJfX3N5bmNSYXltYXJjaGluZ1NoYWRvd01hdGVyaWFsUGFyYW1ldGVycyIsICJfX3ByZXBhcmVUZW1wb3JhbEFBRnJhbWUiLCAiX19kaWZmdXNlQ3ViZVRleHR1cmUiLCAiX19zcGVjdWxhckN1YmVUZXh0dXJlIiwgIl9fc2hlZW5DdWJlVGV4dHVyZSIsICJfX3NldElibElubmVyIiwgIl9fc2V0SWJsSW5uZXJGb3JUcmFuc3BhcmVudE9ubHkiLCAiX19hcHBseUlibFRvUmF5bWFyY2hpbmdNYXRlcmlhbCIsICJfX3RvbmVNYXBwaW5nTWF0ZXJpYWwiLCAiX19zZXR1cERlcHRoTW9tZW50RnJhbWVidWZmZXIiLCAiX19jb25maWd1cmVSYXltYXJjaGluZ1Bhc3NUYXJnZXRzIiwgIl9fcHJlcGFyZUxlZ2FjeVJheW1hcmNoaW5nUGFzcyIsICJfX2FwcGx5QmFja0J1ZmZlclRleHR1cmVUb1JheW1hcmNoaW5nTWF0ZXJpYWwiLCAiX19nZXRDYWNoZWRSYXltYXJjaGluZ0FhYmIiLCAiX19nZXRSYXltYXJjaGluZ0NvbXBvbmVudFBhc3NlcyIsICJfX2dldFNvcnRlZFJheW1hcmNoaW5nQ29tcG9uZW50cyIsICJfX3ByZXBhcmVSYXltYXJjaGluZ0NvbXBvbmVudFBhc3MiLCAiX19jYWxjUmF5bWFyY2hpbmdTY2lzc29yUmVjdCIsICJ4IiwgInkiLCAiX19nZXRBbGxSYXltYXJjaGluZ01hdGVyaWFscyIsICJfX2J1aWxkUmF5bWFyY2hpbmdFeHByZXNzaW9uIiwgIl9fY3JlYXRlUmF5bWFyY2hpbmdTaGFkb3dQYXNzZXMiLCAiX191cGRhdGVSYXltYXJjaGluZ1NoYWRvd1BvaW50RmFyUGxhbmUiLCAiX19nZXRSYXltYXJjaGluZ1NoYWRvd1BvaW50TWF0ZXJpYWxzIiwgIl9fc2V0UmF5bWFyY2hpbmdTaGFkb3dQb2ludEZhclBsYW5lIiwgIl9fZ2V0UmF5bWFyY2hpbmdDb21wb25lbnRTaGFkb3dQb2ludE1hdGVyaWFscyIsICJtYXRlcmlhbCIsICJfX2NyZWF0ZVJheW1hcmNoaW5nU2hhZG93UGFzcyIsICJfX3N5bmNSYXltYXJjaGluZ0NvbXBvbmVudFNoYWRvd01hdGVyaWFsUGFyYW1ldGVycyIsICJfX2FwcGx5SWJsVG9NYXRlcmlhbCIsICJfX2lzUmF5bWFyY2hpbmdUcmFuc21pc3Npb25FbmFibGVkIl0KfQo=
