import { CameraComponent } from '../../components/Camera/CameraComponent';
import { LightComponent } from '../../components/Light/LightComponent';
import { BufferUse } from '../../definitions/BufferUse';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Logger } from '../../misc/Logger';
import type { Engine } from '../../system/Engine';
import type { Expression } from '../Expression';
import {
  buildLightClustersOnCpu,
  computeLightBoundingSphere,
  createLightClusterBuildScratch,
  type LightClusterBuildScratch,
  writeLightClusterViewHeader,
} from './LightClusterBuilder';
import {
  getLightClusterViewLayout,
  getLightListCapacity,
  LightClusterLayout,
  type LightClusterViewLayout,
  packLightEntry,
} from './LightClusterLayout';

/** A region of the GPU instance data owned by the light cluster system. */
type GpuDataRegion = {
  /** The CPU memory of the region (uploaded to the GPU with the other GPU instance data). */
  array: Float32Array;
  /** The vec4 index of the region in the GPU instance data. */
  vec4Base: number;
};

/**
 * The parameters of the light cluster build on the GPU (WebGPU compute shaders).
 *
 * @internal
 */
export type LightClusterGpuBuildParams = {
  /** The vec4 indices of the view regions to build. */
  viewVec4Bases: readonly number[];
  /** The vec4 index of the local light spheres. */
  sphereVec4Base: number;
  /** The vec4 index of the all-light list. */
  allListVec4Base: number;
  globalCount: number;
  localCount: number;
  layout: LightClusterViewLayout;
};

/** The maximum shadow slot that can be packed into a light entry exactly (entries must stay below 2^24). */
const MaxPackableShadowSlot = 254;

/**
 * Builds the light lists of Clustered Forward rendering once per frame.
 *
 * - Every enabled light is written to the all-light list of the `clusteredLightData` global property
 *   (lights that can not be culled first, then the local lights, each sorted by the component SID).
 * - For each camera used by the render passes of the frame (up to `Config.clusteredForwardMaxViewNumber`),
 *   a view region with the cluster grid is built when there are local lights, and the camera's
 *   `lightClusterViewInfo` points to it. Other cameras use the all-light list.
 *
 * The light data is read from the GPU instance data of the light components (the values the shaders see),
 * so the clusters always match the lights the shaders evaluate.
 *
 * The data lives in the GPU instance data, so it is uploaded by the rendering strategy. `dataVersion` changes
 * whenever this system writes the data, and the strategies upload the data when it changes.
 */
export class LightClusterSystem {
  private __engine: Engine;
  private __dataVersion = 0;

  private __globalData?: Float32Array;
  private __globalDataVec4Base = -1;
  private __capacity = 0;
  private __layout?: LightClusterViewLayout;
  private __scratch?: LightClusterBuildScratch;

  // The light lists of the current and the previous frame (for change detection)
  private __entries = new Float64Array(0);
  private __prevEntries = new Float64Array(0);
  private __spheres = new Float64Array(0);
  private __prevSpheres = new Float64Array(0);
  private __localEntries = new Float64Array(0);
  private __allCount = 0;
  private __globalCount = 0;
  private __localCount = 0;
  /** The number of local lights that emit light (counted for Config.clusteredForwardMinLocalLightNumber). */
  private __emittingLocalCount = 0;
  private __prevAllCount = -1;
  private __prevGlobalCount = -1;
  private __prevSphereVec4Base = -1;

  private __sphereRegion?: GpuDataRegion;
  private __viewRegions: (GpuDataRegion | undefined)[] = [];
  /** The camera component SID of each view slot (-1: free). */
  private __slotCameraSids: number[] = [];
  /** Whether each view slot holds valid clusters for its camera, the current lights and the matrices below. */
  private __slotValid: boolean[] = [];
  /** The view and projection matrices each view slot was built with. */
  private __slotMatrices = new Float32Array(0);
  /** The cameras whose `lightClusterViewInfo` currently points to a view region. */
  private __camerasWithView: Set<number> = new Set();
  private __isAllocationFailed = false;
  private __isCapacityWarned = false;
  private __isIndexOverflowWarned = false;

  private __gpuBuildViewVec4Bases: number[] = [];
  /** The data of `u_lightClusterView` of the WebGL2 shaders (7 vec4). */
  private __viewUniformData = new Float32Array(LightClusterLayout.viewHeaderVec4Count * 4 + 4);

  constructor(engine: Engine) {
    this.__engine = engine;
  }

  /**
   * Incremented whenever this system writes to the GPU instance data.
   */
  get dataVersion() {
    return this.__dataVersion;
  }

  /**
   * Whether the cluster tables are built by WebGPU compute shaders instead of the CPU.
   */
  get isGpuBuild() {
    return (
      this.__engine.config.clusteredForwardBuildMode === 'auto' &&
      this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU
    );
  }

  /**
   * The parameters of the views to build on the GPU, or undefined when nothing has to be built on the GPU.
   *
   * @internal
   */
  _getGpuBuildParams(): LightClusterGpuBuildParams | undefined {
    if (
      !this.isGpuBuild ||
      this.__gpuBuildViewVec4Bases.length === 0 ||
      this.__sphereRegion == null ||
      this.__layout == null
    ) {
      return undefined;
    }
    return {
      viewVec4Bases: this.__gpuBuildViewVec4Bases,
      sphereVec4Base: this.__sphereRegion.vec4Base,
      allListVec4Base: this.__globalDataVec4Base + LightClusterLayout.globalHeaderVec4Count,
      globalCount: this.__globalCount,
      localCount: this.__localCount,
      layout: this.__layout,
    };
  }

  /**
   * Returns the data of the `u_lightClusterView` uniform of the WebGL2 shaders for a camera: the view header
   * (6 vec4) and (vec4 index of the view, 0, 0, 0), or a view index of -1 when the camera has no light clusters.
   * The returned array is reused.
   *
   * @internal
   */
  _getViewUniformData(cameraSid: number): Float32Array {
    const data = this.__viewUniformData;
    const headerLength = LightClusterLayout.viewHeaderVec4Count * 4;
    const slot = cameraSid >= 0 ? this.__slotCameraSids.indexOf(cameraSid) : -1;
    const region = slot >= 0 ? this.__viewRegions[slot] : undefined;
    if (region == null || !this.__camerasWithView.has(cameraSid)) {
      data.fill(0);
      data[headerLength] = -1;
      return data;
    }
    data.set(region.array.subarray(0, headerLength));
    data[headerLength] = region.vec4Base;
    return data;
  }

  /**
   * Updates the light lists for the render passes of this frame.
   * This must be called after the Logic stage (the light and camera data are final) and before the strategy
   * uploads the GPU instance data.
   *
   * @param expressions - The expressions rendered in this frame
   */
  update(expressions: readonly Expression[]) {
    if (!this.__initialize()) {
      return;
    }
    let isChanged = this.__collectLights();
    const isLightsChanged = isChanged;

    const config = this.__engine.config;
    const isGpuBuild = this.isGpuBuild;
    const maxViewNumber = Math.max(0, Math.floor(config.clusteredForwardMaxViewNumber));
    // With few lights, plain forward rendering (the all-light list) can be cheaper than the cluster lookup.
    const minLocalLightNumber = Math.max(1, Math.floor(config.clusteredForwardMinLocalLightNumber));
    const cameraSids =
      config.isClusteredForwardEnabled &&
      this.__emittingLocalCount >= minLocalLightNumber &&
      maxViewNumber > 0 &&
      !this.__isAllocationFailed
        ? this.__collectCameras(expressions)
        : [];

    // The sphere region is used by the compute shaders only.
    if (isGpuBuild && cameraSids.length > 0 && this.__sphereRegion == null) {
      this.__sphereRegion = this.__allocate(this.__capacity);
    }
    const sphereVec4Base = isGpuBuild && this.__sphereRegion != null ? this.__sphereRegion.vec4Base : -1;
    if (isLightsChanged || sphereVec4Base !== this.__prevSphereVec4Base) {
      this.__writeGlobalData(sphereVec4Base);
      if (isGpuBuild && this.__sphereRegion != null) {
        this.__sphereRegion.array.set(this.__spheres.subarray(0, this.__localCount * 4));
      }
      this.__prevSphereVec4Base = sphereVec4Base;
      isChanged = true;
    }

    isChanged = this.__assignViews(cameraSids, maxViewNumber, isLightsChanged, isGpuBuild) || isChanged;

    if (isChanged) {
      this.__dataVersion++;
    }
  }

  private __initialize() {
    if (this.__globalData != null) {
      return true;
    }
    const engine = this.__engine;
    const value = engine.globalDataRepository.getValue('clusteredLightData', 0);
    if (value == null) {
      return false;
    }
    this.__globalData = value._v as Float32Array;
    this.__globalDataVec4Base = engine.globalDataRepository.getLocationOffsetOfProperty('clusteredLightData');
    const config = engine.config;
    this.__capacity = Math.min(
      getLightListCapacity(config.maxLightListLength),
      (this.__globalData.length / 4 - LightClusterLayout.globalHeaderVec4Count) * 4
    );
    this.__entries = new Float64Array(this.__capacity);
    this.__prevEntries = new Float64Array(this.__capacity);
    this.__spheres = new Float64Array(this.__capacity * 4);
    this.__prevSpheres = new Float64Array(this.__capacity * 4);
    this.__localEntries = new Float64Array(this.__capacity);
    this.__layout = getLightClusterViewLayout(
      config.clusteredForwardGridSize,
      config.clusteredForwardLightCapacityPerCluster
    );
    const maxViewNumber = Math.max(0, Math.floor(config.clusteredForwardMaxViewNumber));
    this.__slotCameraSids = new Array(maxViewNumber).fill(-1);
    this.__slotValid = new Array(maxViewNumber).fill(false);
    this.__slotMatrices = new Float32Array(maxViewNumber * 32);
    this.__viewRegions = new Array(maxViewNumber).fill(undefined);
    return true;
  }

  /**
   * Collects the enabled lights into the all-light list and the local light spheres.
   * @returns true if the lists changed since the previous frame
   */
  private __collectLights() {
    const lightComponents = this.__engine.componentRepository._getComponents(LightComponent) as
      | (LightComponent | undefined)[]
      | undefined;
    const capacity = this.__capacity;
    const entries = this.__entries;
    const spheres = this.__spheres;
    const localEntries = this.__localEntries;
    const maxShadowSlot = Math.min(this.__engine.config.maxLightNumber - 1, MaxPackableShadowSlot);
    let globalCount = 0;
    let localCount = 0;
    let emittingLocalCount = 0;
    let isCapacityExceeded = false;

    if (lightComponents != null) {
      for (let sid = 0; sid < lightComponents.length; sid++) {
        const light = lightComponents[sid];
        if (light == null || !light._isAlive) {
          continue;
        }
        const property = light._lightPropertyForGpu._v;
        const typeValue = property[0];
        if (typeValue < -0.5) {
          continue; // disabled
        }
        if (globalCount + localCount >= capacity || light.componentSID >= LightClusterLayout.entryRadix) {
          isCapacityExceeded = true;
          continue;
        }
        const shadowSlot = light._shadowSlot;
        const entry = packLightEntry(
          light.componentSID,
          shadowSlot >= 0 && shadowSlot <= maxShadowSlot ? shadowSlot : -1
        );
        const radius = computeLightBoundingSphere(
          typeValue,
          light._lightPositionForGpu._v,
          light._lightDirectionForGpu._v,
          property[1],
          property[3],
          spheres,
          localCount * 4
        );
        if (radius < 0) {
          entries[globalCount++] = entry;
        } else {
          localEntries[localCount++] = entry;
          // A light without intensity lights nothing, so it does not make clustering worthwhile.
          const intensity = light._lightIntensityForGpu._v;
          if (intensity[0] > 0 || intensity[1] > 0 || intensity[2] > 0) {
            emittingLocalCount++;
          }
        }
      }
    }
    if (isCapacityExceeded && !this.__isCapacityWarned) {
      Logger.default.warn(
        `LightClusterSystem: The number of enabled lights exceeds Config.maxLightListLength (${capacity}). The other lights are ignored.`
      );
      this.__isCapacityWarned = true;
    }
    // all-light list = [lights that can not be culled..., local lights...]
    entries.set(localEntries.subarray(0, localCount), globalCount);
    const allCount = globalCount + localCount;
    this.__allCount = allCount;
    this.__globalCount = globalCount;
    this.__localCount = localCount;
    this.__emittingLocalCount = emittingLocalCount;

    let isChanged = allCount !== this.__prevAllCount || globalCount !== this.__prevGlobalCount;
    if (!isChanged) {
      for (let i = 0; i < allCount; i++) {
        if (entries[i] !== this.__prevEntries[i]) {
          isChanged = true;
          break;
        }
      }
    }
    if (!isChanged) {
      for (let i = 0; i < localCount * 4; i++) {
        if (spheres[i] !== this.__prevSpheres[i]) {
          isChanged = true;
          break;
        }
      }
    }
    if (isChanged) {
      this.__prevEntries.set(entries.subarray(0, allCount));
      this.__prevSpheres.set(spheres.subarray(0, localCount * 4));
      this.__prevAllCount = allCount;
      this.__prevGlobalCount = globalCount;
    }
    return isChanged;
  }

  private __writeGlobalData(sphereVec4Base: number) {
    const data = this.__globalData!;
    data[0] = this.__allCount;
    data[1] = this.__globalCount;
    data[2] = this.__localCount;
    data[3] = sphereVec4Base;
    const offset = LightClusterLayout.globalHeaderVec4Count * 4;
    data.set(this.__entries.subarray(0, this.__allCount), offset);
  }

  /**
   * Lists the cameras of the render passes that may draw lit materials, in the order of the render passes.
   * The rules are the same as the camera selection of the rendering strategies.
   */
  private __collectCameras(expressions: readonly Expression[]) {
    const engine = this.__engine;
    const webXRSystem = engine.webXRSystem;
    const cameraSids: number[] = [];
    const add = (sid: number) => {
      if (sid >= 0 && !cameraSids.includes(sid)) {
        cameraSids.push(sid);
      }
    };
    for (const expression of expressions) {
      for (const renderPass of expression.renderPasses) {
        // Screen-space passes and passes overriding the material (shadow maps, blur, ...) have no lit materials.
        if (renderPass.isBufferLessRenderingMode() || renderPass.material != null) {
          continue;
        }
        if (webXRSystem.isWebXRMode && renderPass.isVrRendering) {
          // In multiview rendering, the fragment shaders can not tell which eye they render.
          if (!webXRSystem.isMultiView()) {
            add(webXRSystem._getCameraComponentSIDAt(0));
            add(webXRSystem._getCameraComponentSIDAt(1));
          }
          continue;
        }
        let cameraComponent = renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = engine.componentRepository.getComponent(
            CameraComponent,
            CameraComponent.getCurrent(engine)
          ) as CameraComponent | undefined;
        }
        if (cameraComponent == null || cameraComponent.isSyncToLight) {
          continue;
        }
        add(cameraComponent.componentSID);
      }
    }
    return cameraSids;
  }

  /**
   * Assigns the view slots to the cameras, builds the views whose inputs changed and updates the
   * `lightClusterViewInfo` of the cameras.
   * @returns true if anything was written
   */
  private __assignViews(cameraSids: number[], maxViewNumber: number, isLightsChanged: boolean, isGpuBuild: boolean) {
    const engine = this.__engine;
    const layout = this.__layout!;
    let isChanged = false;

    // Keep the slot of a camera that had one, then give the free slots to the other cameras.
    const newSlotCameraSids: number[] = new Array(maxViewNumber).fill(-1);
    for (const sid of cameraSids) {
      const slot = this.__slotCameraSids.indexOf(sid);
      if (slot >= 0) {
        newSlotCameraSids[slot] = sid;
      }
    }
    for (const sid of cameraSids) {
      if (newSlotCameraSids.includes(sid)) {
        continue;
      }
      const slot = newSlotCameraSids.indexOf(-1);
      if (slot < 0) {
        break;
      }
      newSlotCameraSids[slot] = sid;
    }

    // Cameras that lost their view use the all-light list.
    for (const sid of Array.from(this.__camerasWithView)) {
      if (!newSlotCameraSids.includes(sid)) {
        const camera = engine.componentRepository.getComponent(CameraComponent, sid) as CameraComponent | undefined;
        if (camera != null && camera._lightClusterViewInfoForGpu._v[0] !== -1) {
          camera._lightClusterViewInfoForGpu._v[0] = -1;
          isChanged = true;
        }
        this.__camerasWithView.delete(sid);
      }
    }

    this.__gpuBuildViewVec4Bases.length = 0;
    for (let slot = 0; slot < maxViewNumber; slot++) {
      const sid = newSlotCameraSids[slot];
      if (sid !== this.__slotCameraSids[slot]) {
        this.__slotCameraSids[slot] = sid;
        this.__slotValid[slot] = false;
      }
      if (sid < 0) {
        continue;
      }
      const camera = engine.componentRepository.getComponent(CameraComponent, sid) as CameraComponent | undefined;
      if (camera == null) {
        this.__slotCameraSids[slot] = -1;
        continue;
      }
      let region = this.__viewRegions[slot];
      if (region == null) {
        region = this.__allocate(layout.viewVec4Count);
        if (region == null) {
          this.__slotCameraSids[slot] = -1;
          continue;
        }
        this.__viewRegions[slot] = region;
      }

      const viewMatrix = camera.viewMatrix._v;
      const projectionMatrix = camera._projectionMatrixForGpu._v;
      const matrices = this.__slotMatrices;
      const matrixOffset = slot * 32;
      let isMatrixChanged = false;
      for (let i = 0; i < 16; i++) {
        if (matrices[matrixOffset + i] !== viewMatrix[i] || matrices[matrixOffset + 16 + i] !== projectionMatrix[i]) {
          isMatrixChanged = true;
          break;
        }
      }
      if (isLightsChanged || isMatrixChanged || !this.__slotValid[slot]) {
        matrices.set(viewMatrix, matrixOffset);
        matrices.set(projectionMatrix, matrixOffset + 16);
        writeLightClusterViewHeader(
          region.array,
          0,
          viewMatrix,
          projectionMatrix,
          this.__spheres,
          this.__localCount,
          layout
        );
        if (!isGpuBuild) {
          this.__scratch ??= createLightClusterBuildScratch(layout);
          const isBuilt = buildLightClustersOnCpu(
            region.array,
            0,
            layout,
            this.__spheres,
            this.__localEntries,
            this.__localCount,
            this.__scratch
          );
          if (!isBuilt && !this.__isIndexOverflowWarned) {
            Logger.default.warn(
              `LightClusterSystem: The light index list of a camera overflowed (Config.clusteredForwardLightCapacityPerCluster: ${this.__engine.config.clusteredForwardLightCapacityPerCluster}). The camera evaluates all lights until the lights fit.`
            );
            this.__isIndexOverflowWarned = true;
          }
        }
        this.__slotValid[slot] = true;
        isChanged = true;
      }

      const viewInfo = camera._lightClusterViewInfoForGpu._v;
      if (viewInfo[0] !== region.vec4Base) {
        viewInfo[0] = region.vec4Base;
        isChanged = true;
      }
      this.__camerasWithView.add(sid);
      if (isGpuBuild) {
        this.__gpuBuildViewVec4Bases.push(region.vec4Base);
      }
    }
    return isChanged;
  }

  /**
   * Allocates a region in the GPU instance data. Returns undefined (and disables the clusters) when it fails.
   */
  private __allocate(vec4Count: number): GpuDataRegion | undefined {
    const memoryManager = this.__engine.memoryManager;
    const byteLength = vec4Count * 16;
    const layerCount = this.__engine.config.bufferSizeDivisionRatiosForGPUInstanceDataUsage.length;
    for (let layer = 0; layer < layerCount; layer++) {
      const buffer = memoryManager.createOrGetBuffer(BufferUse.GPUInstanceData, layer);
      if (buffer.byteLength - buffer.takenSizeInByte < byteLength) {
        continue;
      }
      const bufferViewResult = buffer.takeBufferView({ byteLengthToNeed: byteLength, byteStride: 0 });
      if (bufferViewResult.isErr()) {
        continue;
      }
      const bufferView = bufferViewResult.get();
      const byteOffset =
        memoryManager.getByteOffsetOfExistingBuffers(BufferUse.GPUInstanceData, buffer.indexOfTheBufferUsage) +
        bufferView.byteOffsetInBuffer;
      const array = new Float32Array(
        buffer.getArrayBuffer(),
        bufferView.byteOffsetInRawArrayBufferOfBuffer,
        vec4Count * 4
      );
      array.fill(0);
      return { array, vec4Base: byteOffset / 16 };
    }
    Logger.default.warn('LightClusterSystem: Failed to allocate the light cluster data. All lights are evaluated.');
    this.__isAllocationFailed = true;
    return undefined;
  }
}
