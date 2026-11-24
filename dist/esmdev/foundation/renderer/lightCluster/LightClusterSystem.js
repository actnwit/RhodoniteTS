// src/foundation/renderer/lightCluster/LightClusterSystem.ts
import { CameraComponent } from "../../components/Camera/CameraComponent.js";
import { LightComponent } from "../../components/Light/LightComponent.js";
import { BufferUse } from "../../definitions/BufferUse.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { Logger } from "../../misc/Logger.js";
import {
  buildLightClustersOnCpu,
  computeLightBoundingSphere,
  createLightClusterBuildScratch,
  writeLightClusterViewHeader
} from "./LightClusterBuilder.js";
import {
  getLightClusterViewLayout,
  getLightListCapacity,
  LightClusterLayout,
  packLightEntry
} from "./LightClusterLayout.js";
var MaxPackableShadowSlot = 254;
var LightClusterSystem = class {
  constructor(engine) {
    this.__dataVersion = 0;
    this.__globalDataVec4Base = -1;
    this.__capacity = 0;
    // The light lists of the current and the previous frame (for change detection)
    this.__entries = new Float64Array(0);
    this.__prevEntries = new Float64Array(0);
    this.__spheres = new Float64Array(0);
    this.__prevSpheres = new Float64Array(0);
    this.__localEntries = new Float64Array(0);
    this.__allCount = 0;
    this.__globalCount = 0;
    this.__localCount = 0;
    /** The number of local lights that emit light (counted for Config.clusteredForwardMinLocalLightNumber). */
    this.__emittingLocalCount = 0;
    this.__prevAllCount = -1;
    this.__prevGlobalCount = -1;
    this.__prevSphereVec4Base = -1;
    this.__viewRegions = [];
    /** The camera component SID of each view slot (-1: free). */
    this.__slotCameraSids = [];
    /** Whether each view slot holds valid clusters for its camera, the current lights and the matrices below. */
    this.__slotValid = [];
    /** The view and projection matrices each view slot was built with. */
    this.__slotMatrices = new Float32Array(0);
    /** The cameras whose `lightClusterViewInfo` currently points to a view region. */
    this.__camerasWithView = /* @__PURE__ */ new Set();
    this.__isAllocationFailed = false;
    this.__isCapacityWarned = false;
    /** The order of the local lights of the view being built, sorted by view depth when the number of lights is large. */
    this.__sortOrder = [];
    this.__sortDepths = new Float64Array(0);
    this.__sortedSpheres = new Float64Array(0);
    this.__sortedEntries = new Float64Array(0);
    this.__sliceRanges = new Uint32Array(0);
    /** The GPU build inputs (sorted spheres, entries and slice ranges) of the views, stored per view slot. */
    this.__gpuBuildData = new Float32Array(0);
    this.__gpuBuildStride = 0;
    this.__gpuBuildViews = [];
    /** The number of local lights of the view built in each slot. */
    this.__slotLocalCounts = [];
    /**
     * The byte ranges (in the GPU instance data) of the cluster tables and light index lists of the views. They are
     * large and written by this system or the compute shaders, so the generic upload of the GPU instance data skips them.
     */
    this.__excludedByteRanges = [];
    /** The byte ranges built on the CPU since the last upload, which the rendering strategy uploads separately. */
    this.__dirtyByteRanges = [];
    /** The data of `u_lightClusterView` of the WebGL2 shaders (7 vec4). */
    this.__viewUniformData = new Float32Array(LightClusterLayout.viewHeaderVec4Count * 4 + 4);
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
    return this.__engine.config.clusteredForwardBuildMode === "auto" && this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU;
  }
  /**
   * The parameters of the views to build on the GPU, or undefined when nothing has to be built on the GPU.
   *
   * @internal
   */
  _getGpuBuildParams() {
    if (!this.isGpuBuild || this.__gpuBuildViews.length === 0 || this.__layout == null) {
      return void 0;
    }
    return {
      views: this.__gpuBuildViews,
      data: this.__gpuBuildData,
      dataStride: this.__gpuBuildStride,
      localCapacity: this.__capacity,
      layout: this.__layout
    };
  }
  /**
   * The byte ranges of the GPU instance data that the generic upload must skip, sorted by the start.
   * The ranges are uploaded by `_takeDirtyByteRanges` (CPU build) or written by the compute shaders (GPU build).
   *
   * @internal
   */
  _getExcludedByteRanges() {
    return this.__excludedByteRanges;
  }
  /**
   * Returns the byte ranges of the GPU instance data built on the CPU since the last call, and clears them.
   * The rendering strategy uploads them after the generic upload.
   *
   * @internal
   */
  _takeDirtyByteRanges() {
    const ranges = this.__dirtyByteRanges;
    this.__dirtyByteRanges = [];
    return ranges;
  }
  /**
   * Returns the data of the `u_lightClusterView` uniform of the WebGL2 shaders for a camera: the view header
   * (6 vec4) and (vec4 index of the view, 0, 0, 0), or a view index of -1 when the camera has no light clusters.
   * The returned array is reused.
   *
   * @internal
   */
  _getViewUniformData(cameraSid) {
    const data = this.__viewUniformData;
    const headerLength = LightClusterLayout.viewHeaderVec4Count * 4;
    const slot = cameraSid >= 0 ? this.__slotCameraSids.indexOf(cameraSid) : -1;
    const region = slot >= 0 ? this.__viewRegions[slot] : void 0;
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
  update(expressions) {
    if (!this.__initialize()) {
      return;
    }
    let isChanged = this.__collectLights();
    const isLightsChanged = isChanged;
    const config = this.__engine.config;
    const isGpuBuild = this.isGpuBuild;
    const maxViewNumber = Math.max(0, Math.floor(config.clusteredForwardMaxViewNumber));
    const minLocalLightNumber = Math.max(1, Math.floor(config.clusteredForwardMinLocalLightNumber));
    const cameraSids = config.isClusteredForwardEnabled && this.__emittingLocalCount >= minLocalLightNumber && maxViewNumber > 0 && !this.__isAllocationFailed ? this.__collectCameras(expressions) : [];
    if (isLightsChanged) {
      this.__writeGlobalData();
      isChanged = true;
    }
    this.__gpuBuildViews.length = 0;
    isChanged = this.__assignViews(cameraSids, maxViewNumber, isLightsChanged, isGpuBuild) || isChanged;
    if (isChanged) {
      this.__dataVersion++;
    }
  }
  __initialize() {
    if (this.__globalData != null) {
      return true;
    }
    const engine = this.__engine;
    const value = engine.globalDataRepository.getValue("clusteredLightData", 0);
    if (value == null) {
      return false;
    }
    this.__globalData = value._v;
    this.__globalDataVec4Base = engine.globalDataRepository.getLocationOffsetOfProperty("clusteredLightData");
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
    this.__sortDepths = new Float64Array(this.__capacity);
    this.__sortedSpheres = new Float64Array(this.__capacity * 4);
    this.__sortedEntries = new Float64Array(this.__capacity);
    this.__sliceRanges = new Uint32Array(this.__layout.gridZ * 2);
    const maxViewNumber = Math.max(0, Math.floor(config.clusteredForwardMaxViewNumber));
    this.__gpuBuildStride = this.__capacity * 5 + this.__layout.gridZ * 2;
    this.__gpuBuildData = new Float32Array(maxViewNumber * this.__gpuBuildStride);
    this.__slotCameraSids = new Array(maxViewNumber).fill(-1);
    this.__slotValid = new Array(maxViewNumber).fill(false);
    this.__slotLocalCounts = new Array(maxViewNumber).fill(0);
    this.__slotMatrices = new Float32Array(maxViewNumber * 32);
    this.__viewRegions = new Array(maxViewNumber).fill(void 0);
    return true;
  }
  /**
   * Collects the enabled lights into the all-light list and the local light spheres.
   * @returns true if the lists changed since the previous frame
   */
  __collectLights() {
    const lightComponents = this.__engine.componentRepository._getComponents(LightComponent);
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
          continue;
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
  /**
   * Writes the all-light list into the `clusteredLightData` global property.
   *
   * The layout is documented in LightClusterLayout.ts: (allCount, globalCount, localCount, sphereBase) followed by
   * the entries, 4 per vec4. The shaders read the counts from the header: `globalCount` is how many entries they
   * read from the all-light list, and the rest of the list of a clustered fragment comes from the view region.
   */
  __writeGlobalData() {
    const data = this.__globalData;
    data[0] = this.__allCount;
    data[1] = this.__globalCount;
    data[2] = this.__localCount;
    data[3] = -1;
    const offset = LightClusterLayout.globalHeaderVec4Count * 4;
    data.set(this.__entries.subarray(0, this.__allCount), offset);
  }
  /**
   * Lists the cameras of the render passes that may draw lit materials, in the order of the render passes.
   * The rules are the same as the camera selection of the rendering strategies.
   */
  __collectCameras(expressions) {
    const engine = this.__engine;
    const webXRSystem = engine._webXRSystemIfEnabled;
    const cameraSids = [];
    const add = (sid) => {
      if (sid >= 0 && !cameraSids.includes(sid)) {
        cameraSids.push(sid);
      }
    };
    for (const expression of expressions) {
      for (const renderPass of expression.renderPasses) {
        if (renderPass.isBufferLessRenderingMode() || renderPass.material != null) {
          continue;
        }
        if ((webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) && renderPass.isVrRendering) {
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
          );
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
  __assignViews(cameraSids, maxViewNumber, isLightsChanged, isGpuBuild) {
    var _a;
    const engine = this.__engine;
    const layout = this.__layout;
    let isChanged = false;
    const newSlotCameraSids = new Array(maxViewNumber).fill(-1);
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
    for (const sid of Array.from(this.__camerasWithView)) {
      if (!newSlotCameraSids.includes(sid)) {
        const camera = engine.componentRepository.getComponent(CameraComponent, sid);
        if (camera != null && camera._lightClusterViewInfoForGpu._v[0] !== -1) {
          camera._lightClusterViewInfoForGpu._v[0] = -1;
          isChanged = true;
        }
        this.__camerasWithView.delete(sid);
      }
    }
    for (let slot = 0; slot < maxViewNumber; slot++) {
      const sid = newSlotCameraSids[slot];
      if (sid !== this.__slotCameraSids[slot]) {
        this.__slotCameraSids[slot] = sid;
        this.__slotValid[slot] = false;
      }
      if (sid < 0) {
        continue;
      }
      const camera = engine.componentRepository.getComponent(CameraComponent, sid);
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
        const start = (region.vec4Base + LightClusterLayout.viewHeaderVec4Count) * 16;
        this.__excludedByteRanges.push([start, (region.vec4Base + layout.viewVec4Count) * 16]);
        this.__excludedByteRanges.sort((a, b) => a[0] - b[0]);
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
          layout,
          camera.zNear,
          camera.zFar
        );
        this.__prepareViewBuild(region.array, slot, isGpuBuild, layout);
        this.__slotLocalCounts[slot] = this.__localCount;
        if (!isGpuBuild) {
          (_a = this.__scratch) != null ? _a : this.__scratch = createLightClusterBuildScratch(layout);
          buildLightClustersOnCpu(
            region.array,
            0,
            layout,
            this.__sortedSpheres,
            this.__sortedEntries,
            this.__localCount,
            this.__scratch
          );
          const start = (region.vec4Base + LightClusterLayout.viewHeaderVec4Count) * 16;
          const usedVec4Count = layout.tableVec4Count + this.__scratch.usedIndexVec4Count;
          this.__dirtyByteRanges.push([start, start + usedVec4Count * 16]);
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
    }
    this.__gpuBuildViews.length = 0;
    if (isGpuBuild) {
      for (let slot = 0; slot < maxViewNumber; slot++) {
        const region = this.__viewRegions[slot];
        if (this.__slotValid[slot] && region != null && this.__slotCameraSids[slot] >= 0) {
          this.__gpuBuildViews.push({
            viewVec4Base: region.vec4Base,
            localCount: this.__slotLocalCounts[slot],
            dataOffset: slot * this.__gpuBuildStride
          });
        }
      }
    }
    return isChanged;
  }
  /**
   * Prepares the light order and the Z slice ranges of a view for the builders.
   *
   * The lights are sorted by their view depth when there are more local lights than the capacity of a cluster, so
   * that a cluster which is full keeps its nearest lights. Otherwise the light component SID order is kept (no
   * cluster can be full), which keeps the result identical to a build without a capacity.
   *
   * For the GPU build, the sorted spheres, entries and ranges are copied to the GPU build data of the view.
   */
  __prepareViewBuild(header, slot, isGpuBuild, layout) {
    const localCount = this.__localCount;
    const capacity = layout.clusterLightCapacity;
    const gridZ = layout.gridZ;
    const spheres = this.__spheres;
    const localEntries = this.__localEntries;
    const sortedSpheres = this.__sortedSpheres;
    const sortedEntries = this.__sortedEntries;
    const ranges = this.__sliceRanges;
    if (localCount <= capacity) {
      sortedSpheres.set(spheres.subarray(0, localCount * 4));
      sortedEntries.set(localEntries.subarray(0, localCount));
      for (let z = 0; z < gridZ; z++) {
        ranges[z * 2] = 0;
        ranges[z * 2 + 1] = localCount;
      }
    } else {
      const depths = this.__sortDepths;
      const order = this.__sortOrder;
      order.length = localCount;
      const dx = header[12];
      const dy = header[13];
      const dz = header[14];
      const dw = header[15];
      for (let i = 0; i < localCount; i++) {
        depths[i] = dx * spheres[i * 4] + dy * spheres[i * 4 + 1] + dz * spheres[i * 4 + 2] + dw;
        order[i] = i;
      }
      order.sort((a, b) => depths[a] - depths[b]);
      for (let k = 0; k < localCount; k++) {
        const src = order[k];
        sortedSpheres[k * 4] = spheres[src * 4];
        sortedSpheres[k * 4 + 1] = spheres[src * 4 + 1];
        sortedSpheres[k * 4 + 2] = spheres[src * 4 + 2];
        sortedSpheres[k * 4 + 3] = spheres[src * 4 + 3];
        sortedEntries[k] = localEntries[src];
      }
      const sliceScale = header[20];
      const sliceBias = header[21];
      for (let z = 0; z < gridZ; z++) {
        const sliceNear = z === 0 ? Number.NEGATIVE_INFINITY : Math.exp((z - sliceBias) / sliceScale);
        const sliceFar = z === gridZ - 1 ? Number.POSITIVE_INFINITY : Math.exp((z + 1 - sliceBias) / sliceScale);
        let start = localCount;
        let end = 0;
        for (let k = 0; k < localCount; k++) {
          const src = order[k];
          const d = depths[src];
          const r = spheres[src * 4 + 3];
          if (d + r >= sliceNear && d - r <= sliceFar) {
            if (k < start) start = k;
            if (k + 1 > end) end = k + 1;
          }
        }
        if (start >= end) {
          start = 0;
          end = 0;
        }
        ranges[z * 2] = start;
        ranges[z * 2 + 1] = end;
      }
    }
    if (isGpuBuild) {
      const dataOffset = slot * this.__gpuBuildStride;
      const localCapacity = this.__capacity;
      const data = this.__gpuBuildData;
      data.set(sortedSpheres.subarray(0, localCount * 4), dataOffset);
      data.set(sortedEntries.subarray(0, localCount), dataOffset + localCapacity * 4);
      const rangeBase = dataOffset + localCapacity * 5;
      for (let i = 0; i < gridZ * 2; i++) {
        data[rangeBase + i] = ranges[i];
      }
    }
  }
  /**
   * Allocates a region in the GPU instance data. Returns undefined (and disables the clusters) when it fails.
   *
   * The region is ordinary GPU instance data: the WebGL2 data texture / the WebGPU storage buffer. That is why the
   * shaders can read the table with the same `fetchElement` / `get_clusteredLightData` accessor as any other data,
   * and why the strategies have to skip it in the generic upload (see `_getExcludedByteRanges`).
   */
  __allocate(vec4Count) {
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
      const byteOffset = memoryManager.getByteOffsetOfExistingBuffers(BufferUse.GPUInstanceData, buffer.indexOfTheBufferUsage) + bufferView.byteOffsetInBuffer;
      const array = new Float32Array(
        buffer.getArrayBuffer(),
        bufferView.byteOffsetInRawArrayBufferOfBuffer,
        vec4Count * 4
      );
      array.fill(0);
      return { array, vec4Base: byteOffset / 16 };
    }
    Logger.default.warn("LightClusterSystem: Failed to allocate the light cluster data. All lights are evaluated.");
    this.__isAllocationFailed = true;
    return void 0;
  }
};
export {
  LightClusterSystem
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcmVuZGVyZXIvbGlnaHRDbHVzdGVyL0xpZ2h0Q2x1c3RlclN5c3RlbS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQ2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB7IExpZ2h0Q29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9MaWdodC9MaWdodENvbXBvbmVudCc7XG5pbXBvcnQgeyBCdWZmZXJVc2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9CdWZmZXJVc2UnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uLy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IEV4cHJlc3Npb24gfSBmcm9tICcuLi9FeHByZXNzaW9uJztcbmltcG9ydCB7XG4gIGJ1aWxkTGlnaHRDbHVzdGVyc09uQ3B1LFxuICBjb21wdXRlTGlnaHRCb3VuZGluZ1NwaGVyZSxcbiAgY3JlYXRlTGlnaHRDbHVzdGVyQnVpbGRTY3JhdGNoLFxuICB0eXBlIExpZ2h0Q2x1c3RlckJ1aWxkU2NyYXRjaCxcbiAgd3JpdGVMaWdodENsdXN0ZXJWaWV3SGVhZGVyLFxufSBmcm9tICcuL0xpZ2h0Q2x1c3RlckJ1aWxkZXInO1xuaW1wb3J0IHtcbiAgZ2V0TGlnaHRDbHVzdGVyVmlld0xheW91dCxcbiAgZ2V0TGlnaHRMaXN0Q2FwYWNpdHksXG4gIExpZ2h0Q2x1c3RlckxheW91dCxcbiAgdHlwZSBMaWdodENsdXN0ZXJWaWV3TGF5b3V0LFxuICBwYWNrTGlnaHRFbnRyeSxcbn0gZnJvbSAnLi9MaWdodENsdXN0ZXJMYXlvdXQnO1xuXG4vKiogQSByZWdpb24gb2YgdGhlIEdQVSBpbnN0YW5jZSBkYXRhIG93bmVkIGJ5IHRoZSBsaWdodCBjbHVzdGVyIHN5c3RlbS4gKi9cbnR5cGUgR3B1RGF0YVJlZ2lvbiA9IHtcbiAgLyoqIFRoZSBDUFUgbWVtb3J5IG9mIHRoZSByZWdpb24gKHVwbG9hZGVkIHRvIHRoZSBHUFUgd2l0aCB0aGUgb3RoZXIgR1BVIGluc3RhbmNlIGRhdGEpLiAqL1xuICBhcnJheTogRmxvYXQzMkFycmF5O1xuICAvKiogVGhlIHZlYzQgaW5kZXggb2YgdGhlIHJlZ2lvbiBpbiB0aGUgR1BVIGluc3RhbmNlIGRhdGEuICovXG4gIHZlYzRCYXNlOiBudW1iZXI7XG59O1xuXG4vKipcbiAqIFRoZSBwYXJhbWV0ZXJzIG9mIHRoZSBsaWdodCBjbHVzdGVyIGJ1aWxkIG9uIHRoZSBHUFUgKFdlYkdQVSBjb21wdXRlIHNoYWRlcnMpLlxuICpcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgdHlwZSBMaWdodENsdXN0ZXJHcHVCdWlsZFZpZXcgPSB7XG4gIC8qKiBUaGUgdmVjNCBpbmRleCBvZiB0aGUgdmlldyByZWdpb24gdG8gYnVpbGQuICovXG4gIHZpZXdWZWM0QmFzZTogbnVtYmVyO1xuICAvKiogVGhlIG51bWJlciBvZiBsb2NhbCBsaWdodHMgb2YgdGhlIHZpZXcuICovXG4gIGxvY2FsQ291bnQ6IG51bWJlcjtcbiAgLyoqIFRoZSBmbG9hdCBvZmZzZXQgb2YgdGhlIHZpZXcgaW4gYGRhdGFgLiAqL1xuICBkYXRhT2Zmc2V0OiBudW1iZXI7XG59O1xuXG5leHBvcnQgdHlwZSBMaWdodENsdXN0ZXJHcHVCdWlsZFBhcmFtcyA9IHtcbiAgdmlld3M6IHJlYWRvbmx5IExpZ2h0Q2x1c3RlckdwdUJ1aWxkVmlld1tdO1xuICAvKiogVGhlIHNvcnRlZCBsaWdodCBzcGhlcmVzLCBlbnRyaWVzIGFuZCBaIHNsaWNlIHJhbmdlcyBvZiB0aGUgdmlld3MsIGBkYXRhU3RyaWRlYCBmbG9hdHMgcGVyIHZpZXcuICovXG4gIGRhdGE6IEZsb2F0MzJBcnJheTtcbiAgZGF0YVN0cmlkZTogbnVtYmVyO1xuICAvKiogVGhlIG1heGltdW0gbnVtYmVyIG9mIGxvY2FsIGxpZ2h0cyBzdG9yZWQgaW4gdGhlIGJ1aWxkIGRhdGEgb2YgYSB2aWV3LiAqL1xuICBsb2NhbENhcGFjaXR5OiBudW1iZXI7XG4gIGxheW91dDogTGlnaHRDbHVzdGVyVmlld0xheW91dDtcbn07XG5cbi8qKiBUaGUgbWF4aW11bSBzaGFkb3cgc2xvdCB0aGF0IGNhbiBiZSBwYWNrZWQgaW50byBhIGxpZ2h0IGVudHJ5IGV4YWN0bHkgKGVudHJpZXMgbXVzdCBzdGF5IGJlbG93IDJeMjQpLiAqL1xuY29uc3QgTWF4UGFja2FibGVTaGFkb3dTbG90ID0gMjU0O1xuXG4vKipcbiAqIEJ1aWxkcyB0aGUgbGlnaHQgbGlzdHMgb2YgQ2x1c3RlcmVkIEZvcndhcmQgcmVuZGVyaW5nIG9uY2UgcGVyIGZyYW1lLlxuICpcbiAqIC0gRXZlcnkgZW5hYmxlZCBsaWdodCBpcyB3cml0dGVuIHRvIHRoZSBhbGwtbGlnaHQgbGlzdCBvZiB0aGUgYGNsdXN0ZXJlZExpZ2h0RGF0YWAgZ2xvYmFsIHByb3BlcnR5XG4gKiAgIChsaWdodHMgdGhhdCBjYW4gbm90IGJlIGN1bGxlZCBmaXJzdCwgdGhlbiB0aGUgbG9jYWwgbGlnaHRzLCBlYWNoIHNvcnRlZCBieSB0aGUgY29tcG9uZW50IFNJRCkuXG4gKiAtIEZvciBlYWNoIGNhbWVyYSB1c2VkIGJ5IHRoZSByZW5kZXIgcGFzc2VzIG9mIHRoZSBmcmFtZSAodXAgdG8gYENvbmZpZy5jbHVzdGVyZWRGb3J3YXJkTWF4Vmlld051bWJlcmApLFxuICogICBhIHZpZXcgcmVnaW9uIHdpdGggdGhlIGNsdXN0ZXIgZ3JpZCBpcyBidWlsdCB3aGVuIHRoZXJlIGFyZSBsb2NhbCBsaWdodHMsIGFuZCB0aGUgY2FtZXJhJ3NcbiAqICAgYGxpZ2h0Q2x1c3RlclZpZXdJbmZvYCBwb2ludHMgdG8gaXQuIE90aGVyIGNhbWVyYXMgdXNlIHRoZSBhbGwtbGlnaHQgbGlzdC5cbiAqXG4gKiBUaGUgbGlnaHQgZGF0YSBpcyByZWFkIGZyb20gdGhlIEdQVSBpbnN0YW5jZSBkYXRhIG9mIHRoZSBsaWdodCBjb21wb25lbnRzICh0aGUgdmFsdWVzIHRoZSBzaGFkZXJzIHNlZSksXG4gKiBzbyB0aGUgY2x1c3RlcnMgYWx3YXlzIG1hdGNoIHRoZSBsaWdodHMgdGhlIHNoYWRlcnMgZXZhbHVhdGUuXG4gKlxuICogVGhlIGRhdGEgbGl2ZXMgaW4gdGhlIEdQVSBpbnN0YW5jZSBkYXRhLCBzbyBpdCBpcyB1cGxvYWRlZCBieSB0aGUgcmVuZGVyaW5nIHN0cmF0ZWd5LiBgZGF0YVZlcnNpb25gIGNoYW5nZXNcbiAqIHdoZW5ldmVyIHRoaXMgc3lzdGVtIHdyaXRlcyB0aGUgZGF0YSwgYW5kIHRoZSBzdHJhdGVnaWVzIHVwbG9hZCB0aGUgZGF0YSB3aGVuIGl0IGNoYW5nZXMuXG4gKlxuICogIyMgUmVhZGluZyBndWlkZSAodGhlIG9yZGVyIG9mIHRoZSBjb2RlIGJlbG93KVxuICogMS4gYHVwZGF0ZSgpYCBpcyB0aGUgZnJhbWUgZW50cnkgcG9pbnQsIGNhbGxlZCBieSBgRW5naW5lYCBhZnRlciB0aGUgTG9naWMgc3RhZ2UuXG4gKiAyLiBgX19jb2xsZWN0TGlnaHRzKClgIHR1cm5zIHRoZSBsaWdodCBjb21wb25lbnRzIGludG8gdGhlIGFsbC1saWdodCBsaXN0IChgX19lbnRyaWVzYCkgYW5kIHRoZSBsaWdodCBzcGhlcmVzXG4gKiAgICAoYF9fc3BoZXJlc2ApLCBhbmQgZGV0ZWN0cyB3aGV0aGVyIGFueXRoaW5nIGNoYW5nZWQgc2luY2UgdGhlIHByZXZpb3VzIGZyYW1lLlxuICogMy4gYF9fd3JpdGVHbG9iYWxEYXRhKClgIHB1Ymxpc2hlcyB0aGUgYWxsLWxpZ2h0IGxpc3QgaW4gdGhlIGBjbHVzdGVyZWRMaWdodERhdGFgIGdsb2JhbCBwcm9wZXJ0eS5cbiAqIDQuIGBfX2NvbGxlY3RDYW1lcmFzKClgIC8gYF9fYXNzaWduVmlld3MoKWAgY2hvb3NlIHRoZSBjYW1lcmFzIHdob3NlIGZyYWdtZW50cyB1c2UgY2x1c3RlcnMsIGFsbG9jYXRlIHRoZWlyXG4gKiAgICB2aWV3IHJlZ2lvbnMgKGhlYWRlciArIGNsdXN0ZXIgdGFibGUgKyBsaWdodCBpbmRleCBsaXN0KSBhbmQgYnVpbGQgdGhlbSAoYExpZ2h0Q2x1c3RlckJ1aWxkZXIudHNgIG9uIHRoZSBDUFUsXG4gKiAgICBgV2ViR3B1TGlnaHRDbHVzdGVyQnVpbGRlci50c2Agb24gdGhlIEdQVSkuXG4gKiA1LiBUaGUgZnJhZ21lbnQgc2hhZGVycyAoYG9wdGljYWxEZWZpbml0aW9uLmdsc2xgIC8gYC53Z3NsYCwgYGdldExpZ2h0TGlzdGApIGxvb2sgdXAgdGhlIGNsdXN0ZXIgb2YgYSBmcmFnbWVudFxuICogICAgYW5kIHJlYWQgaXRzIGxpZ2h0IGxpc3QuIFRoZSBsYXlvdXQgb2YgYm90aCB0aGUgbGlzdCBhbmQgdGhlIHZpZXcgcmVnaW9uIGlzIGluIGBMaWdodENsdXN0ZXJMYXlvdXQudHNgLlxuICovXG5leHBvcnQgY2xhc3MgTGlnaHRDbHVzdGVyU3lzdGVtIHtcbiAgcHJpdmF0ZSBfX2VuZ2luZTogRW5naW5lO1xuICBwcml2YXRlIF9fZGF0YVZlcnNpb24gPSAwO1xuXG4gIHByaXZhdGUgX19nbG9iYWxEYXRhPzogRmxvYXQzMkFycmF5O1xuICBwcml2YXRlIF9fZ2xvYmFsRGF0YVZlYzRCYXNlID0gLTE7XG4gIHByaXZhdGUgX19jYXBhY2l0eSA9IDA7XG4gIHByaXZhdGUgX19sYXlvdXQ/OiBMaWdodENsdXN0ZXJWaWV3TGF5b3V0O1xuICBwcml2YXRlIF9fc2NyYXRjaD86IExpZ2h0Q2x1c3RlckJ1aWxkU2NyYXRjaDtcblxuICAvLyBUaGUgbGlnaHQgbGlzdHMgb2YgdGhlIGN1cnJlbnQgYW5kIHRoZSBwcmV2aW91cyBmcmFtZSAoZm9yIGNoYW5nZSBkZXRlY3Rpb24pXG4gIHByaXZhdGUgX19lbnRyaWVzID0gbmV3IEZsb2F0NjRBcnJheSgwKTtcbiAgcHJpdmF0ZSBfX3ByZXZFbnRyaWVzID0gbmV3IEZsb2F0NjRBcnJheSgwKTtcbiAgcHJpdmF0ZSBfX3NwaGVyZXMgPSBuZXcgRmxvYXQ2NEFycmF5KDApO1xuICBwcml2YXRlIF9fcHJldlNwaGVyZXMgPSBuZXcgRmxvYXQ2NEFycmF5KDApO1xuICBwcml2YXRlIF9fbG9jYWxFbnRyaWVzID0gbmV3IEZsb2F0NjRBcnJheSgwKTtcbiAgcHJpdmF0ZSBfX2FsbENvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX2dsb2JhbENvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX2xvY2FsQ291bnQgPSAwO1xuICAvKiogVGhlIG51bWJlciBvZiBsb2NhbCBsaWdodHMgdGhhdCBlbWl0IGxpZ2h0IChjb3VudGVkIGZvciBDb25maWcuY2x1c3RlcmVkRm9yd2FyZE1pbkxvY2FsTGlnaHROdW1iZXIpLiAqL1xuICBwcml2YXRlIF9fZW1pdHRpbmdMb2NhbENvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX3ByZXZBbGxDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fcHJldkdsb2JhbENvdW50ID0gLTE7XG4gIHByaXZhdGUgX19wcmV2U3BoZXJlVmVjNEJhc2UgPSAtMTtcblxuICBwcml2YXRlIF9fdmlld1JlZ2lvbnM6IChHcHVEYXRhUmVnaW9uIHwgdW5kZWZpbmVkKVtdID0gW107XG4gIC8qKiBUaGUgY2FtZXJhIGNvbXBvbmVudCBTSUQgb2YgZWFjaCB2aWV3IHNsb3QgKC0xOiBmcmVlKS4gKi9cbiAgcHJpdmF0ZSBfX3Nsb3RDYW1lcmFTaWRzOiBudW1iZXJbXSA9IFtdO1xuICAvKiogV2hldGhlciBlYWNoIHZpZXcgc2xvdCBob2xkcyB2YWxpZCBjbHVzdGVycyBmb3IgaXRzIGNhbWVyYSwgdGhlIGN1cnJlbnQgbGlnaHRzIGFuZCB0aGUgbWF0cmljZXMgYmVsb3cuICovXG4gIHByaXZhdGUgX19zbG90VmFsaWQ6IGJvb2xlYW5bXSA9IFtdO1xuICAvKiogVGhlIHZpZXcgYW5kIHByb2plY3Rpb24gbWF0cmljZXMgZWFjaCB2aWV3IHNsb3Qgd2FzIGJ1aWx0IHdpdGguICovXG4gIHByaXZhdGUgX19zbG90TWF0cmljZXMgPSBuZXcgRmxvYXQzMkFycmF5KDApO1xuICAvKiogVGhlIGNhbWVyYXMgd2hvc2UgYGxpZ2h0Q2x1c3RlclZpZXdJbmZvYCBjdXJyZW50bHkgcG9pbnRzIHRvIGEgdmlldyByZWdpb24uICovXG4gIHByaXZhdGUgX19jYW1lcmFzV2l0aFZpZXc6IFNldDxudW1iZXI+ID0gbmV3IFNldCgpO1xuICBwcml2YXRlIF9faXNBbGxvY2F0aW9uRmFpbGVkID0gZmFsc2U7XG4gIHByaXZhdGUgX19pc0NhcGFjaXR5V2FybmVkID0gZmFsc2U7XG5cbiAgLyoqIFRoZSBvcmRlciBvZiB0aGUgbG9jYWwgbGlnaHRzIG9mIHRoZSB2aWV3IGJlaW5nIGJ1aWx0LCBzb3J0ZWQgYnkgdmlldyBkZXB0aCB3aGVuIHRoZSBudW1iZXIgb2YgbGlnaHRzIGlzIGxhcmdlLiAqL1xuICBwcml2YXRlIF9fc29ydE9yZGVyOiBudW1iZXJbXSA9IFtdO1xuICBwcml2YXRlIF9fc29ydERlcHRocyA9IG5ldyBGbG9hdDY0QXJyYXkoMCk7XG4gIHByaXZhdGUgX19zb3J0ZWRTcGhlcmVzID0gbmV3IEZsb2F0NjRBcnJheSgwKTtcbiAgcHJpdmF0ZSBfX3NvcnRlZEVudHJpZXMgPSBuZXcgRmxvYXQ2NEFycmF5KDApO1xuICBwcml2YXRlIF9fc2xpY2VSYW5nZXMgPSBuZXcgVWludDMyQXJyYXkoMCk7XG5cbiAgLyoqIFRoZSBHUFUgYnVpbGQgaW5wdXRzIChzb3J0ZWQgc3BoZXJlcywgZW50cmllcyBhbmQgc2xpY2UgcmFuZ2VzKSBvZiB0aGUgdmlld3MsIHN0b3JlZCBwZXIgdmlldyBzbG90LiAqL1xuICBwcml2YXRlIF9fZ3B1QnVpbGREYXRhID0gbmV3IEZsb2F0MzJBcnJheSgwKTtcbiAgcHJpdmF0ZSBfX2dwdUJ1aWxkU3RyaWRlID0gMDtcbiAgcHJpdmF0ZSBfX2dwdUJ1aWxkVmlld3M6IExpZ2h0Q2x1c3RlckdwdUJ1aWxkVmlld1tdID0gW107XG4gIC8qKiBUaGUgbnVtYmVyIG9mIGxvY2FsIGxpZ2h0cyBvZiB0aGUgdmlldyBidWlsdCBpbiBlYWNoIHNsb3QuICovXG4gIHByaXZhdGUgX19zbG90TG9jYWxDb3VudHM6IG51bWJlcltdID0gW107XG4gIC8qKlxuICAgKiBUaGUgYnl0ZSByYW5nZXMgKGluIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSkgb2YgdGhlIGNsdXN0ZXIgdGFibGVzIGFuZCBsaWdodCBpbmRleCBsaXN0cyBvZiB0aGUgdmlld3MuIFRoZXkgYXJlXG4gICAqIGxhcmdlIGFuZCB3cml0dGVuIGJ5IHRoaXMgc3lzdGVtIG9yIHRoZSBjb21wdXRlIHNoYWRlcnMsIHNvIHRoZSBnZW5lcmljIHVwbG9hZCBvZiB0aGUgR1BVIGluc3RhbmNlIGRhdGEgc2tpcHMgdGhlbS5cbiAgICovXG4gIHByaXZhdGUgX19leGNsdWRlZEJ5dGVSYW5nZXM6IFtudW1iZXIsIG51bWJlcl1bXSA9IFtdO1xuICAvKiogVGhlIGJ5dGUgcmFuZ2VzIGJ1aWx0IG9uIHRoZSBDUFUgc2luY2UgdGhlIGxhc3QgdXBsb2FkLCB3aGljaCB0aGUgcmVuZGVyaW5nIHN0cmF0ZWd5IHVwbG9hZHMgc2VwYXJhdGVseS4gKi9cbiAgcHJpdmF0ZSBfX2RpcnR5Qnl0ZVJhbmdlczogW251bWJlciwgbnVtYmVyXVtdID0gW107XG4gIC8qKiBUaGUgZGF0YSBvZiBgdV9saWdodENsdXN0ZXJWaWV3YCBvZiB0aGUgV2ViR0wyIHNoYWRlcnMgKDcgdmVjNCkuICovXG4gIHByaXZhdGUgX192aWV3VW5pZm9ybURhdGEgPSBuZXcgRmxvYXQzMkFycmF5KExpZ2h0Q2x1c3RlckxheW91dC52aWV3SGVhZGVyVmVjNENvdW50ICogNCArIDQpO1xuXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lKSB7XG4gICAgdGhpcy5fX2VuZ2luZSA9IGVuZ2luZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmNyZW1lbnRlZCB3aGVuZXZlciB0aGlzIHN5c3RlbSB3cml0ZXMgdG8gdGhlIEdQVSBpbnN0YW5jZSBkYXRhLlxuICAgKi9cbiAgZ2V0IGRhdGFWZXJzaW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9fZGF0YVZlcnNpb247XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgY2x1c3RlciB0YWJsZXMgYXJlIGJ1aWx0IGJ5IFdlYkdQVSBjb21wdXRlIHNoYWRlcnMgaW5zdGVhZCBvZiB0aGUgQ1BVLlxuICAgKi9cbiAgZ2V0IGlzR3B1QnVpbGQoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX19lbmdpbmUuY29uZmlnLmNsdXN0ZXJlZEZvcndhcmRCdWlsZE1vZGUgPT09ICdhdXRvJyAmJlxuICAgICAgdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcGFyYW1ldGVycyBvZiB0aGUgdmlld3MgdG8gYnVpbGQgb24gdGhlIEdQVSwgb3IgdW5kZWZpbmVkIHdoZW4gbm90aGluZyBoYXMgdG8gYmUgYnVpbHQgb24gdGhlIEdQVS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0R3B1QnVpbGRQYXJhbXMoKTogTGlnaHRDbHVzdGVyR3B1QnVpbGRQYXJhbXMgfCB1bmRlZmluZWQge1xuICAgIGlmICghdGhpcy5pc0dwdUJ1aWxkIHx8IHRoaXMuX19ncHVCdWlsZFZpZXdzLmxlbmd0aCA9PT0gMCB8fCB0aGlzLl9fbGF5b3V0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB2aWV3czogdGhpcy5fX2dwdUJ1aWxkVmlld3MsXG4gICAgICBkYXRhOiB0aGlzLl9fZ3B1QnVpbGREYXRhLFxuICAgICAgZGF0YVN0cmlkZTogdGhpcy5fX2dwdUJ1aWxkU3RyaWRlLFxuICAgICAgbG9jYWxDYXBhY2l0eTogdGhpcy5fX2NhcGFjaXR5LFxuICAgICAgbGF5b3V0OiB0aGlzLl9fbGF5b3V0LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVGhlIGJ5dGUgcmFuZ2VzIG9mIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSB0aGF0IHRoZSBnZW5lcmljIHVwbG9hZCBtdXN0IHNraXAsIHNvcnRlZCBieSB0aGUgc3RhcnQuXG4gICAqIFRoZSByYW5nZXMgYXJlIHVwbG9hZGVkIGJ5IGBfdGFrZURpcnR5Qnl0ZVJhbmdlc2AgKENQVSBidWlsZCkgb3Igd3JpdHRlbiBieSB0aGUgY29tcHV0ZSBzaGFkZXJzIChHUFUgYnVpbGQpLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRFeGNsdWRlZEJ5dGVSYW5nZXMoKTogcmVhZG9ubHkgW251bWJlciwgbnVtYmVyXVtdIHtcbiAgICByZXR1cm4gdGhpcy5fX2V4Y2x1ZGVkQnl0ZVJhbmdlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBieXRlIHJhbmdlcyBvZiB0aGUgR1BVIGluc3RhbmNlIGRhdGEgYnVpbHQgb24gdGhlIENQVSBzaW5jZSB0aGUgbGFzdCBjYWxsLCBhbmQgY2xlYXJzIHRoZW0uXG4gICAqIFRoZSByZW5kZXJpbmcgc3RyYXRlZ3kgdXBsb2FkcyB0aGVtIGFmdGVyIHRoZSBnZW5lcmljIHVwbG9hZC5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfdGFrZURpcnR5Qnl0ZVJhbmdlcygpOiBbbnVtYmVyLCBudW1iZXJdW10ge1xuICAgIGNvbnN0IHJhbmdlcyA9IHRoaXMuX19kaXJ0eUJ5dGVSYW5nZXM7XG4gICAgdGhpcy5fX2RpcnR5Qnl0ZVJhbmdlcyA9IFtdO1xuICAgIHJldHVybiByYW5nZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZGF0YSBvZiB0aGUgYHVfbGlnaHRDbHVzdGVyVmlld2AgdW5pZm9ybSBvZiB0aGUgV2ViR0wyIHNoYWRlcnMgZm9yIGEgY2FtZXJhOiB0aGUgdmlldyBoZWFkZXJcbiAgICogKDYgdmVjNCkgYW5kICh2ZWM0IGluZGV4IG9mIHRoZSB2aWV3LCAwLCAwLCAwKSwgb3IgYSB2aWV3IGluZGV4IG9mIC0xIHdoZW4gdGhlIGNhbWVyYSBoYXMgbm8gbGlnaHQgY2x1c3RlcnMuXG4gICAqIFRoZSByZXR1cm5lZCBhcnJheSBpcyByZXVzZWQuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldFZpZXdVbmlmb3JtRGF0YShjYW1lcmFTaWQ6IG51bWJlcik6IEZsb2F0MzJBcnJheSB7XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuX192aWV3VW5pZm9ybURhdGE7XG4gICAgY29uc3QgaGVhZGVyTGVuZ3RoID0gTGlnaHRDbHVzdGVyTGF5b3V0LnZpZXdIZWFkZXJWZWM0Q291bnQgKiA0O1xuICAgIC8vIFRoZSBzbG90IGlzIHJlc29sdmVkIGZyb20gdGhlIGNhbWVyYSBTSUQsIGJlY2F1c2UgYSBzbG90IG1heSBob2xkIGFub3RoZXIgY2FtZXJhJ3MgcmVnaW9uIGFmdGVyIGEgc3dhcC5cbiAgICBjb25zdCBzbG90ID0gY2FtZXJhU2lkID49IDAgPyB0aGlzLl9fc2xvdENhbWVyYVNpZHMuaW5kZXhPZihjYW1lcmFTaWQpIDogLTE7XG4gICAgY29uc3QgcmVnaW9uID0gc2xvdCA+PSAwID8gdGhpcy5fX3ZpZXdSZWdpb25zW3Nsb3RdIDogdW5kZWZpbmVkO1xuICAgIGlmIChyZWdpb24gPT0gbnVsbCB8fCAhdGhpcy5fX2NhbWVyYXNXaXRoVmlldy5oYXMoY2FtZXJhU2lkKSkge1xuICAgICAgLy8gTm8gY2x1c3RlcnMgZm9yIHRoaXMgY2FtZXJhOiB0aGUgc2hhZGVyIHJlYWRzIHRoZSB2aWV3IGluZGV4IC0xIGFuZCB1c2VzIHRoZSBhbGwtbGlnaHQgbGlzdC5cbiAgICAgIGRhdGEuZmlsbCgwKTtcbiAgICAgIGRhdGFbaGVhZGVyTGVuZ3RoXSA9IC0xO1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIC8vIFRoZSBoZWFkZXIgaXMgY29waWVkIGZyb20gdGhlIHJlZ2lvbiAodGhlIHNoYWRlciB3b3VsZCBvdGhlcndpc2UgZmV0Y2ggNiB2ZWM0cyBmcm9tIHRoZSBkYXRhIHRleHR1cmUpLFxuICAgIC8vIGFuZCB0aGUgbGFzdCB2ZWM0IGNhcnJpZXMgdGhlIHZlYzQgaW5kZXggb2YgdGhlIHJlZ2lvbiwgd2hlcmUgdGhlIHRhYmxlIGFuZCB0aGUgaW5kZXggbGlzdCBsaXZlLlxuICAgIGRhdGEuc2V0KHJlZ2lvbi5hcnJheS5zdWJhcnJheSgwLCBoZWFkZXJMZW5ndGgpKTtcbiAgICBkYXRhW2hlYWRlckxlbmd0aF0gPSByZWdpb24udmVjNEJhc2U7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgbGlnaHQgbGlzdHMgZm9yIHRoZSByZW5kZXIgcGFzc2VzIG9mIHRoaXMgZnJhbWUuXG4gICAqIFRoaXMgbXVzdCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIExvZ2ljIHN0YWdlICh0aGUgbGlnaHQgYW5kIGNhbWVyYSBkYXRhIGFyZSBmaW5hbCkgYW5kIGJlZm9yZSB0aGUgc3RyYXRlZ3lcbiAgICogdXBsb2FkcyB0aGUgR1BVIGluc3RhbmNlIGRhdGEuXG4gICAqXG4gICAqIEBwYXJhbSBleHByZXNzaW9ucyAtIFRoZSBleHByZXNzaW9ucyByZW5kZXJlZCBpbiB0aGlzIGZyYW1lXG4gICAqL1xuICB1cGRhdGUoZXhwcmVzc2lvbnM6IHJlYWRvbmx5IEV4cHJlc3Npb25bXSkge1xuICAgIGlmICghdGhpcy5fX2luaXRpYWxpemUoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyAxLiBHYXRoZXIgdGhlIGVuYWJsZWQgbGlnaHRzIGludG8gdGhlIGFsbC1saWdodCBsaXN0IGFuZCB0aGUgbG9jYWwgbGlnaHQgc3BoZXJlcywgYW5kIGRldGVjdCB3aGV0aGVyIHRoZVxuICAgIC8vICAgIGlucHV0IGNoYW5nZWQgc2luY2UgdGhlIHByZXZpb3VzIGZyYW1lICh0aGUgcmVzdCBvZiB0aGUgdXBkYXRlIGlzIHNraXBwZWQgd2hlbiBub3RoaW5nIGNoYW5nZWQpLlxuICAgIGxldCBpc0NoYW5nZWQgPSB0aGlzLl9fY29sbGVjdExpZ2h0cygpO1xuICAgIGNvbnN0IGlzTGlnaHRzQ2hhbmdlZCA9IGlzQ2hhbmdlZDtcblxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuX19lbmdpbmUuY29uZmlnO1xuICAgIGNvbnN0IGlzR3B1QnVpbGQgPSB0aGlzLmlzR3B1QnVpbGQ7XG4gICAgY29uc3QgbWF4Vmlld051bWJlciA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IoY29uZmlnLmNsdXN0ZXJlZEZvcndhcmRNYXhWaWV3TnVtYmVyKSk7XG4gICAgLy8gMi4gRGVjaWRlIHdoZXRoZXIgY2x1c3RlcmluZyBpcyB3b3J0aHdoaWxlLiBXaXRoIGZldyBsaWdodHMsIHBsYWluIGZvcndhcmQgcmVuZGVyaW5nICh0aGUgYWxsLWxpZ2h0IGxpc3QpXG4gICAgLy8gICAgY2FuIGJlIGNoZWFwZXIgdGhhbiB0aGUgY2x1c3RlciBsb29rdXAsIHNvIHRoZSBjYW1lcmFzIGdldCBubyB2aWV3IGFuZCB0aGUgc2hhZGVycyB1c2UgdGhlIGFsbC1saWdodCBsaXN0LlxuICAgIGNvbnN0IG1pbkxvY2FsTGlnaHROdW1iZXIgPSBNYXRoLm1heCgxLCBNYXRoLmZsb29yKGNvbmZpZy5jbHVzdGVyZWRGb3J3YXJkTWluTG9jYWxMaWdodE51bWJlcikpO1xuICAgIGNvbnN0IGNhbWVyYVNpZHMgPVxuICAgICAgY29uZmlnLmlzQ2x1c3RlcmVkRm9yd2FyZEVuYWJsZWQgJiZcbiAgICAgIHRoaXMuX19lbWl0dGluZ0xvY2FsQ291bnQgPj0gbWluTG9jYWxMaWdodE51bWJlciAmJlxuICAgICAgbWF4Vmlld051bWJlciA+IDAgJiZcbiAgICAgICF0aGlzLl9faXNBbGxvY2F0aW9uRmFpbGVkXG4gICAgICAgID8gdGhpcy5fX2NvbGxlY3RDYW1lcmFzKGV4cHJlc3Npb25zKVxuICAgICAgICA6IFtdO1xuXG4gICAgLy8gMy4gUHVibGlzaCB0aGUgYWxsLWxpZ2h0IGxpc3QgaW4gdGhlIGdsb2JhbCBkYXRhICh0aGUgc2hhZGVycyByZWFkIGl0IGZvciB0aGUgY2FtZXJhcyBhbmQgZnJhZ21lbnRzIHdpdGhvdXRcbiAgICAvLyAgICBhIGNsdXN0ZXIpLlxuICAgIGlmIChpc0xpZ2h0c0NoYW5nZWQpIHtcbiAgICAgIHRoaXMuX193cml0ZUdsb2JhbERhdGEoKTtcbiAgICAgIGlzQ2hhbmdlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gVGhlIEdQVSBidWlsZCBpbnB1dHMgb2YgdGhlIHZpZXdzIGJ1aWx0IGluIHRoaXMgZnJhbWUuXG4gICAgdGhpcy5fX2dwdUJ1aWxkVmlld3MubGVuZ3RoID0gMDtcblxuICAgIC8vIDQuIEdpdmUgdGhlIGNhbWVyYXMgdmlldyBzbG90cywgcmVidWlsZCB0aGUgdmlld3Mgd2hvc2UgaW5wdXRzIGNoYW5nZWQgYW5kIHBvaW50IHRoZSBjYW1lcmFzIGF0IHRoZW0uXG4gICAgaXNDaGFuZ2VkID0gdGhpcy5fX2Fzc2lnblZpZXdzKGNhbWVyYVNpZHMsIG1heFZpZXdOdW1iZXIsIGlzTGlnaHRzQ2hhbmdlZCwgaXNHcHVCdWlsZCkgfHwgaXNDaGFuZ2VkO1xuXG4gICAgaWYgKGlzQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fX2RhdGFWZXJzaW9uKys7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2luaXRpYWxpemUoKSB7XG4gICAgaWYgKHRoaXMuX19nbG9iYWxEYXRhICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBlbmdpbmUgPSB0aGlzLl9fZW5naW5lO1xuICAgIGNvbnN0IHZhbHVlID0gZW5naW5lLmdsb2JhbERhdGFSZXBvc2l0b3J5LmdldFZhbHVlKCdjbHVzdGVyZWRMaWdodERhdGEnLCAwKTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLl9fZ2xvYmFsRGF0YSA9IHZhbHVlLl92IGFzIEZsb2F0MzJBcnJheTtcbiAgICB0aGlzLl9fZ2xvYmFsRGF0YVZlYzRCYXNlID0gZW5naW5lLmdsb2JhbERhdGFSZXBvc2l0b3J5LmdldExvY2F0aW9uT2Zmc2V0T2ZQcm9wZXJ0eSgnY2x1c3RlcmVkTGlnaHREYXRhJyk7XG4gICAgY29uc3QgY29uZmlnID0gZW5naW5lLmNvbmZpZztcbiAgICAvLyBUaGUgY2FwYWNpdHkgaXMgbGltaXRlZCBieSBib3RoIHRoZSBjb25maWd1cmVkIGxpc3QgbGVuZ3RoIGFuZCB0aGUgc2l6ZSBvZiB0aGUgZ2xvYmFsIHByb3BlcnR5LCBzbyB0aGVcbiAgICAvLyBhbGwtbGlnaHQgbGlzdCBjYW4gbmV2ZXIgd3JpdGUgb3V0c2lkZSB0aGUgcHJvcGVydHkuXG4gICAgdGhpcy5fX2NhcGFjaXR5ID0gTWF0aC5taW4oXG4gICAgICBnZXRMaWdodExpc3RDYXBhY2l0eShjb25maWcubWF4TGlnaHRMaXN0TGVuZ3RoKSxcbiAgICAgICh0aGlzLl9fZ2xvYmFsRGF0YS5sZW5ndGggLyA0IC0gTGlnaHRDbHVzdGVyTGF5b3V0Lmdsb2JhbEhlYWRlclZlYzRDb3VudCkgKiA0XG4gICAgKTtcbiAgICAvLyBUaGUgcGVyLWZyYW1lIHNjcmF0Y2guIEZsb2F0NjRBcnJheSBpcyB1c2VkIGJlY2F1c2UgdGhlc2UgYnVmZmVycyBhcmUgQ1BVLW9ubHkgd29ya2luZyBtZW1vcnk6IHRoZSB2YWx1ZXNcbiAgICAvLyB0aGF0IHJlYWNoIHRoZSBHUFUgYXJlIGNvcGllZCB0byBGbG9hdDMyQXJyYXkgc3RvcmFnZSwgYW5kIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGFib3ZlIGNvbXBhcmVzIHRoZXNlXG4gICAgLy8gYnVmZmVycyBiaXQtZXhhY3RseSwgc28gaXQgbXVzdCBub3QgbG9zZSBwcmVjaXNpb24gb2YgdGhlIHZhbHVlcyBjb21wdXRlZCBmcm9tIHRoZSBsaWdodCBwcm9wZXJ0aWVzLlxuICAgIHRoaXMuX19lbnRyaWVzID0gbmV3IEZsb2F0NjRBcnJheSh0aGlzLl9fY2FwYWNpdHkpO1xuICAgIHRoaXMuX19wcmV2RW50cmllcyA9IG5ldyBGbG9hdDY0QXJyYXkodGhpcy5fX2NhcGFjaXR5KTtcbiAgICB0aGlzLl9fc3BoZXJlcyA9IG5ldyBGbG9hdDY0QXJyYXkodGhpcy5fX2NhcGFjaXR5ICogNCk7XG4gICAgdGhpcy5fX3ByZXZTcGhlcmVzID0gbmV3IEZsb2F0NjRBcnJheSh0aGlzLl9fY2FwYWNpdHkgKiA0KTtcbiAgICB0aGlzLl9fbG9jYWxFbnRyaWVzID0gbmV3IEZsb2F0NjRBcnJheSh0aGlzLl9fY2FwYWNpdHkpO1xuICAgIHRoaXMuX19sYXlvdXQgPSBnZXRMaWdodENsdXN0ZXJWaWV3TGF5b3V0KFxuICAgICAgY29uZmlnLmNsdXN0ZXJlZEZvcndhcmRHcmlkU2l6ZSxcbiAgICAgIGNvbmZpZy5jbHVzdGVyZWRGb3J3YXJkTGlnaHRDYXBhY2l0eVBlckNsdXN0ZXJcbiAgICApO1xuICAgIHRoaXMuX19zb3J0RGVwdGhzID0gbmV3IEZsb2F0NjRBcnJheSh0aGlzLl9fY2FwYWNpdHkpO1xuICAgIHRoaXMuX19zb3J0ZWRTcGhlcmVzID0gbmV3IEZsb2F0NjRBcnJheSh0aGlzLl9fY2FwYWNpdHkgKiA0KTtcbiAgICB0aGlzLl9fc29ydGVkRW50cmllcyA9IG5ldyBGbG9hdDY0QXJyYXkodGhpcy5fX2NhcGFjaXR5KTtcbiAgICB0aGlzLl9fc2xpY2VSYW5nZXMgPSBuZXcgVWludDMyQXJyYXkodGhpcy5fX2xheW91dC5ncmlkWiAqIDIpO1xuICAgIGNvbnN0IG1heFZpZXdOdW1iZXIgPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKGNvbmZpZy5jbHVzdGVyZWRGb3J3YXJkTWF4Vmlld051bWJlcikpO1xuICAgIHRoaXMuX19ncHVCdWlsZFN0cmlkZSA9IHRoaXMuX19jYXBhY2l0eSAqIDUgKyB0aGlzLl9fbGF5b3V0LmdyaWRaICogMjtcbiAgICB0aGlzLl9fZ3B1QnVpbGREYXRhID0gbmV3IEZsb2F0MzJBcnJheShtYXhWaWV3TnVtYmVyICogdGhpcy5fX2dwdUJ1aWxkU3RyaWRlKTtcbiAgICB0aGlzLl9fc2xvdENhbWVyYVNpZHMgPSBuZXcgQXJyYXkobWF4Vmlld051bWJlcikuZmlsbCgtMSk7XG4gICAgdGhpcy5fX3Nsb3RWYWxpZCA9IG5ldyBBcnJheShtYXhWaWV3TnVtYmVyKS5maWxsKGZhbHNlKTtcbiAgICB0aGlzLl9fc2xvdExvY2FsQ291bnRzID0gbmV3IEFycmF5KG1heFZpZXdOdW1iZXIpLmZpbGwoMCk7XG4gICAgdGhpcy5fX3Nsb3RNYXRyaWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkobWF4Vmlld051bWJlciAqIDMyKTtcbiAgICB0aGlzLl9fdmlld1JlZ2lvbnMgPSBuZXcgQXJyYXkobWF4Vmlld051bWJlcikuZmlsbCh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbGxlY3RzIHRoZSBlbmFibGVkIGxpZ2h0cyBpbnRvIHRoZSBhbGwtbGlnaHQgbGlzdCBhbmQgdGhlIGxvY2FsIGxpZ2h0IHNwaGVyZXMuXG4gICAqIEByZXR1cm5zIHRydWUgaWYgdGhlIGxpc3RzIGNoYW5nZWQgc2luY2UgdGhlIHByZXZpb3VzIGZyYW1lXG4gICAqL1xuICBwcml2YXRlIF9fY29sbGVjdExpZ2h0cygpIHtcbiAgICAvLyBJdGVyYXRlIHRoZSBjb21wb25lbnRzIGJ5IFNJRDogdGhlIGxpZ2h0IGxpc3Qgb3JkZXIgKGFuZCB0aGVyZWZvcmUgdGhlIGdlbmVyYXRlZCBzaGFkZXIgbG9vcHMpIGZvbGxvd3MgdGhlXG4gICAgLy8gY29tcG9uZW50IG9yZGVyLCB3aGljaCBrZWVwcyB0aGUgYWxsLWxpZ2h0IGxpc3Qgc3RhYmxlIGFjcm9zcyBmcmFtZXMgYXMgbG9uZyBhcyB0aGUgbGlnaHRzIGRvIG5vdCBjaGFuZ2UuXG4gICAgY29uc3QgbGlnaHRDb21wb25lbnRzID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5Ll9nZXRDb21wb25lbnRzKExpZ2h0Q29tcG9uZW50KSBhc1xuICAgICAgfCAoTGlnaHRDb21wb25lbnQgfCB1bmRlZmluZWQpW11cbiAgICAgIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IGNhcGFjaXR5ID0gdGhpcy5fX2NhcGFjaXR5O1xuICAgIC8vIGVudHJpZXM6IHRoZSBhbGwtbGlnaHQgbGlzdCAoW2dsb2JhbCBsaWdodHMuLi4sIGxvY2FsIGxpZ2h0cy4uLl0pOyBsb2NhbEVudHJpZXM6IHRoZSBsb2NhbCBsaWdodHMgb25seTtcbiAgICAvLyBzcGhlcmVzOiAoY3gsIGN5LCBjeiwgcikgcGVyIGxvY2FsIGxpZ2h0LCBwYXJhbGxlbCB0byBsb2NhbEVudHJpZXMuXG4gICAgY29uc3QgZW50cmllcyA9IHRoaXMuX19lbnRyaWVzO1xuICAgIGNvbnN0IHNwaGVyZXMgPSB0aGlzLl9fc3BoZXJlcztcbiAgICBjb25zdCBsb2NhbEVudHJpZXMgPSB0aGlzLl9fbG9jYWxFbnRyaWVzO1xuICAgIC8vIEEgc2hhZG93IHNsb3QgdGhhdCBkb2VzIG5vdCBmaXQgaW50byB0aGUgcGFja2VkIGVudHJ5IChvciBpcyBhYm92ZSBDb25maWcubWF4TGlnaHROdW1iZXIpIGlzIHN0b3JlZCBhcyAtMTpcbiAgICAvLyB0aGUgbGlnaHQgaXMgdGhlbiBzaGFkZWQgd2l0aG91dCBpdHMgc2hhZG93IG1hcCByYXRoZXIgdGhhbiBjb3JydXB0aW5nIGFub3RoZXIgbGlnaHQncyBzbG90LlxuICAgIGNvbnN0IG1heFNoYWRvd1Nsb3QgPSBNYXRoLm1pbih0aGlzLl9fZW5naW5lLmNvbmZpZy5tYXhMaWdodE51bWJlciAtIDEsIE1heFBhY2thYmxlU2hhZG93U2xvdCk7XG4gICAgbGV0IGdsb2JhbENvdW50ID0gMDtcbiAgICBsZXQgbG9jYWxDb3VudCA9IDA7XG4gICAgbGV0IGVtaXR0aW5nTG9jYWxDb3VudCA9IDA7XG4gICAgbGV0IGlzQ2FwYWNpdHlFeGNlZWRlZCA9IGZhbHNlO1xuXG4gICAgaWYgKGxpZ2h0Q29tcG9uZW50cyAhPSBudWxsKSB7XG4gICAgICBmb3IgKGxldCBzaWQgPSAwOyBzaWQgPCBsaWdodENvbXBvbmVudHMubGVuZ3RoOyBzaWQrKykge1xuICAgICAgICBjb25zdCBsaWdodCA9IGxpZ2h0Q29tcG9uZW50c1tzaWRdO1xuICAgICAgICBpZiAobGlnaHQgPT0gbnVsbCB8fCAhbGlnaHQuX2lzQWxpdmUpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgdmFsdWVzIGFyZSByZWFkIGZyb20gdGhlIGRhdGEgdXBsb2FkZWQgdG8gdGhlIEdQVSwgc28gdGhlIGNsdXN0ZXJzIGFsd2F5cyBtYXRjaCB3aGF0IHRoZSBzaGFkZXJzXG4gICAgICAgIC8vIGV2YWx1YXRlIChpbmNsdWRpbmcgYW55IGNsYW1waW5nIGFwcGxpZWQgYnkgdGhlIGxpZ2h0IGNvbXBvbmVudCkuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5ID0gbGlnaHQuX2xpZ2h0UHJvcGVydHlGb3JHcHUuX3Y7XG4gICAgICAgIGNvbnN0IHR5cGVWYWx1ZSA9IHByb3BlcnR5WzBdO1xuICAgICAgICBpZiAodHlwZVZhbHVlIDwgLTAuNSkge1xuICAgICAgICAgIGNvbnRpbnVlOyAvLyBkaXNhYmxlZFxuICAgICAgICB9XG4gICAgICAgIC8vIFRoZSBlbnRyeSBwYWNraW5nIGxpbWl0cyB0aGUgU0lEIHRvIDE2IGJpdHMsIGFuZCB0aGUgbGlzdCBoYXMgYSBmaXhlZCBjYXBhY2l0eTsgdGhlIGxpZ2h0cyBiZXlvbmQgaXQgYXJlXG4gICAgICAgIC8vIGlnbm9yZWQgKGEgd2FybmluZyBpcyBsb2dnZWQgb25jZSBiZWxvdykgaW5zdGVhZCBvZiBvdmVyZmxvd2luZyB0aGUgYnVmZmVycy5cbiAgICAgICAgaWYgKGdsb2JhbENvdW50ICsgbG9jYWxDb3VudCA+PSBjYXBhY2l0eSB8fCBsaWdodC5jb21wb25lbnRTSUQgPj0gTGlnaHRDbHVzdGVyTGF5b3V0LmVudHJ5UmFkaXgpIHtcbiAgICAgICAgICBpc0NhcGFjaXR5RXhjZWVkZWQgPSB0cnVlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNoYWRvd1Nsb3QgPSBsaWdodC5fc2hhZG93U2xvdDtcbiAgICAgICAgY29uc3QgZW50cnkgPSBwYWNrTGlnaHRFbnRyeShcbiAgICAgICAgICBsaWdodC5jb21wb25lbnRTSUQsXG4gICAgICAgICAgc2hhZG93U2xvdCA+PSAwICYmIHNoYWRvd1Nsb3QgPD0gbWF4U2hhZG93U2xvdCA/IHNoYWRvd1Nsb3QgOiAtMVxuICAgICAgICApO1xuICAgICAgICBjb25zdCByYWRpdXMgPSBjb21wdXRlTGlnaHRCb3VuZGluZ1NwaGVyZShcbiAgICAgICAgICB0eXBlVmFsdWUsXG4gICAgICAgICAgbGlnaHQuX2xpZ2h0UG9zaXRpb25Gb3JHcHUuX3YsXG4gICAgICAgICAgbGlnaHQuX2xpZ2h0RGlyZWN0aW9uRm9yR3B1Ll92LFxuICAgICAgICAgIHByb3BlcnR5WzFdLFxuICAgICAgICAgIHByb3BlcnR5WzNdLFxuICAgICAgICAgIHNwaGVyZXMsXG4gICAgICAgICAgbG9jYWxDb3VudCAqIDRcbiAgICAgICAgKTtcbiAgICAgICAgLy8gcmFkaXVzIDwgMDogZGlyZWN0aW9uYWwgbGlnaHQgb3IgYSBsaWdodCB3aXRob3V0IGEgcmFuZ2UsIHdoaWNoIGNhbm5vdCBiZSBjdWxsZWQgYnkgYSBjbHVzdGVyLlxuICAgICAgICAvLyBPdGhlcndpc2UgdGhlIGxpZ2h0IGlzIGxvY2FsIGFuZCBpdHMgc3BoZXJlIHdhcyB3cml0dGVuIGF0IHNwaGVyZXNbbG9jYWxDb3VudCAqIDRdLlxuICAgICAgICBpZiAocmFkaXVzIDwgMCkge1xuICAgICAgICAgIGVudHJpZXNbZ2xvYmFsQ291bnQrK10gPSBlbnRyeTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbEVudHJpZXNbbG9jYWxDb3VudCsrXSA9IGVudHJ5O1xuICAgICAgICAgIC8vIEEgbGlnaHQgd2l0aG91dCBpbnRlbnNpdHkgbGlnaHRzIG5vdGhpbmcsIHNvIGl0IGRvZXMgbm90IG1ha2UgY2x1c3RlcmluZyB3b3J0aHdoaWxlLlxuICAgICAgICAgIGNvbnN0IGludGVuc2l0eSA9IGxpZ2h0Ll9saWdodEludGVuc2l0eUZvckdwdS5fdjtcbiAgICAgICAgICBpZiAoaW50ZW5zaXR5WzBdID4gMCB8fCBpbnRlbnNpdHlbMV0gPiAwIHx8IGludGVuc2l0eVsyXSA+IDApIHtcbiAgICAgICAgICAgIGVtaXR0aW5nTG9jYWxDb3VudCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDYXBhY2l0eUV4Y2VlZGVkICYmICF0aGlzLl9faXNDYXBhY2l0eVdhcm5lZCkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybihcbiAgICAgICAgYExpZ2h0Q2x1c3RlclN5c3RlbTogVGhlIG51bWJlciBvZiBlbmFibGVkIGxpZ2h0cyBleGNlZWRzIENvbmZpZy5tYXhMaWdodExpc3RMZW5ndGggKCR7Y2FwYWNpdHl9KS4gVGhlIG90aGVyIGxpZ2h0cyBhcmUgaWdub3JlZC5gXG4gICAgICApO1xuICAgICAgdGhpcy5fX2lzQ2FwYWNpdHlXYXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICAvLyBhbGwtbGlnaHQgbGlzdCA9IFtsaWdodHMgdGhhdCBjYW4gbm90IGJlIGN1bGxlZC4uLiwgbG9jYWwgbGlnaHRzLi4uXVxuICAgIC8vIFRoZSBsb2NhbCBlbnRyaWVzIGFyZSBjb2xsZWN0ZWQgaW4gYSBzZXBhcmF0ZSBhcnJheSBmaXJzdCwgYmVjYXVzZSB0aGV5IGdvIGludG8gYm90aCBsaXN0cy5cbiAgICBlbnRyaWVzLnNldChsb2NhbEVudHJpZXMuc3ViYXJyYXkoMCwgbG9jYWxDb3VudCksIGdsb2JhbENvdW50KTtcbiAgICBjb25zdCBhbGxDb3VudCA9IGdsb2JhbENvdW50ICsgbG9jYWxDb3VudDtcbiAgICB0aGlzLl9fYWxsQ291bnQgPSBhbGxDb3VudDtcbiAgICB0aGlzLl9fZ2xvYmFsQ291bnQgPSBnbG9iYWxDb3VudDtcbiAgICB0aGlzLl9fbG9jYWxDb3VudCA9IGxvY2FsQ291bnQ7XG4gICAgdGhpcy5fX2VtaXR0aW5nTG9jYWxDb3VudCA9IGVtaXR0aW5nTG9jYWxDb3VudDtcblxuICAgIC8vIENoYW5nZSBkZXRlY3Rpb24gYWdhaW5zdCB0aGUgcHJldmlvdXMgZnJhbWU6IGlmIG5laXRoZXIgdGhlIGVudHJpZXMgbm9yIHRoZSBzcGhlcmVzIGNoYW5nZWQsIHRoZSBjbHVzdGVyXG4gICAgLy8gdGFibGVzIGJ1aWx0IGluIHRoZSBwcmV2aW91cyBmcmFtZSBhcmUgc3RpbGwgdmFsaWQsIHNvIHRoZSBDUFUgYnVpbGQgYW5kIHRoZSBHUFUgZGlzcGF0Y2ggYXJlIHNraXBwZWQuXG4gICAgLy8gVGhlIGNvdW50cyBhcmUgY29tcGFyZWQgZmlyc3QgKGNoZWFwKSwgdGhlbiB0aGUgZWxlbWVudHMgb2YgdGhlIHVzZWQgcGFydCBvbmx5LlxuICAgIGxldCBpc0NoYW5nZWQgPSBhbGxDb3VudCAhPT0gdGhpcy5fX3ByZXZBbGxDb3VudCB8fCBnbG9iYWxDb3VudCAhPT0gdGhpcy5fX3ByZXZHbG9iYWxDb3VudDtcbiAgICBpZiAoIWlzQ2hhbmdlZCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbGxDb3VudDsgaSsrKSB7XG4gICAgICAgIGlmIChlbnRyaWVzW2ldICE9PSB0aGlzLl9fcHJldkVudHJpZXNbaV0pIHtcbiAgICAgICAgICBpc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXNDaGFuZ2VkKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsQ291bnQgKiA0OyBpKyspIHtcbiAgICAgICAgaWYgKHNwaGVyZXNbaV0gIT09IHRoaXMuX19wcmV2U3BoZXJlc1tpXSkge1xuICAgICAgICAgIGlzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fX3ByZXZFbnRyaWVzLnNldChlbnRyaWVzLnN1YmFycmF5KDAsIGFsbENvdW50KSk7XG4gICAgICB0aGlzLl9fcHJldlNwaGVyZXMuc2V0KHNwaGVyZXMuc3ViYXJyYXkoMCwgbG9jYWxDb3VudCAqIDQpKTtcbiAgICAgIHRoaXMuX19wcmV2QWxsQ291bnQgPSBhbGxDb3VudDtcbiAgICAgIHRoaXMuX19wcmV2R2xvYmFsQ291bnQgPSBnbG9iYWxDb3VudDtcbiAgICB9XG4gICAgcmV0dXJuIGlzQ2hhbmdlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZXMgdGhlIGFsbC1saWdodCBsaXN0IGludG8gdGhlIGBjbHVzdGVyZWRMaWdodERhdGFgIGdsb2JhbCBwcm9wZXJ0eS5cbiAgICpcbiAgICogVGhlIGxheW91dCBpcyBkb2N1bWVudGVkIGluIExpZ2h0Q2x1c3RlckxheW91dC50czogKGFsbENvdW50LCBnbG9iYWxDb3VudCwgbG9jYWxDb3VudCwgc3BoZXJlQmFzZSkgZm9sbG93ZWQgYnlcbiAgICogdGhlIGVudHJpZXMsIDQgcGVyIHZlYzQuIFRoZSBzaGFkZXJzIHJlYWQgdGhlIGNvdW50cyBmcm9tIHRoZSBoZWFkZXI6IGBnbG9iYWxDb3VudGAgaXMgaG93IG1hbnkgZW50cmllcyB0aGV5XG4gICAqIHJlYWQgZnJvbSB0aGUgYWxsLWxpZ2h0IGxpc3QsIGFuZCB0aGUgcmVzdCBvZiB0aGUgbGlzdCBvZiBhIGNsdXN0ZXJlZCBmcmFnbWVudCBjb21lcyBmcm9tIHRoZSB2aWV3IHJlZ2lvbi5cbiAgICovXG4gIHByaXZhdGUgX193cml0ZUdsb2JhbERhdGEoKSB7XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuX19nbG9iYWxEYXRhITtcbiAgICBkYXRhWzBdID0gdGhpcy5fX2FsbENvdW50O1xuICAgIGRhdGFbMV0gPSB0aGlzLl9fZ2xvYmFsQ291bnQ7XG4gICAgZGF0YVsyXSA9IHRoaXMuX19sb2NhbENvdW50O1xuICAgIC8vIFRoZSBzcGhlcmUgcmVnaW9uIGlzIG5vIGxvbmdlciBzdG9yZWQgaW4gdGhlIEdQVSBpbnN0YW5jZSBkYXRhICh0aGUgR1BVIGJ1aWxkIHJlY2VpdmVzIGl0cyBvd24gc29ydGVkIGlucHV0KS5cbiAgICBkYXRhWzNdID0gLTE7XG4gICAgY29uc3Qgb2Zmc2V0ID0gTGlnaHRDbHVzdGVyTGF5b3V0Lmdsb2JhbEhlYWRlclZlYzRDb3VudCAqIDQ7XG4gICAgLy8gT25seSB0aGUgdXNlZCBwYXJ0IGlzIGNvcGllZDogdGhlIHJlc3Qgb2YgdGhlIGxpc3QgaXMgbmV2ZXIgcmVhZCAodGhlIGNvdW50cyBib3VuZCB0aGUgc2hhZGVyIGxvb3BzKSwgYW5kXG4gICAgLy8gbGVhdmluZyBpdCB1bnRvdWNoZWQgYXZvaWRzIHVwbG9hZGluZyBsYXJnZSByYW5nZXMgd2hlbiB0aGUgc2NlbmUgaGFzIGZldyBsaWdodHMuXG4gICAgZGF0YS5zZXQodGhpcy5fX2VudHJpZXMuc3ViYXJyYXkoMCwgdGhpcy5fX2FsbENvdW50KSwgb2Zmc2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0cyB0aGUgY2FtZXJhcyBvZiB0aGUgcmVuZGVyIHBhc3NlcyB0aGF0IG1heSBkcmF3IGxpdCBtYXRlcmlhbHMsIGluIHRoZSBvcmRlciBvZiB0aGUgcmVuZGVyIHBhc3Nlcy5cbiAgICogVGhlIHJ1bGVzIGFyZSB0aGUgc2FtZSBhcyB0aGUgY2FtZXJhIHNlbGVjdGlvbiBvZiB0aGUgcmVuZGVyaW5nIHN0cmF0ZWdpZXMuXG4gICAqL1xuICBwcml2YXRlIF9fY29sbGVjdENhbWVyYXMoZXhwcmVzc2lvbnM6IHJlYWRvbmx5IEV4cHJlc3Npb25bXSkge1xuICAgIGNvbnN0IGVuZ2luZSA9IHRoaXMuX19lbmdpbmU7XG4gICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSBlbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgIGNvbnN0IGNhbWVyYVNpZHM6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgYWRkID0gKHNpZDogbnVtYmVyKSA9PiB7XG4gICAgICBpZiAoc2lkID49IDAgJiYgIWNhbWVyYVNpZHMuaW5jbHVkZXMoc2lkKSkge1xuICAgICAgICBjYW1lcmFTaWRzLnB1c2goc2lkKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiBleHByZXNzaW9ucykge1xuICAgICAgZm9yIChjb25zdCByZW5kZXJQYXNzIG9mIGV4cHJlc3Npb24ucmVuZGVyUGFzc2VzKSB7XG4gICAgICAgIC8vIFNjcmVlbi1zcGFjZSBwYXNzZXMgYW5kIHBhc3NlcyBvdmVycmlkaW5nIHRoZSBtYXRlcmlhbCAoc2hhZG93IG1hcHMsIGJsdXIsIC4uLikgaGF2ZSBubyBsaXQgbWF0ZXJpYWxzLlxuICAgICAgICAvLyBUaGV5IHVzZSBuZWl0aGVyIHRoZSBhbGwtbGlnaHQgbGlzdCBub3IgdGhlIGNsdXN0ZXJzLCBzbyB0aGVpciBjYW1lcmFzIGRvIG5vdCBuZWVkIGEgdmlldy5cbiAgICAgICAgaWYgKHJlbmRlclBhc3MuaXNCdWZmZXJMZXNzUmVuZGVyaW5nTW9kZSgpIHx8IHJlbmRlclBhc3MubWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUgJiYgcmVuZGVyUGFzcy5pc1ZyUmVuZGVyaW5nKSB7XG4gICAgICAgICAgLy8gV2l0aCBzZXBhcmF0ZSBwZXItZXllIHBhc3NlcywgZWFjaCBleWUgaGFzIGl0cyBvd24gY2FtZXJhIGNvbXBvbmVudCBhbmQgcGFzcywgc28gZWFjaCBleWUgZ2V0cyBpdHNcbiAgICAgICAgICAvLyBvd24gdmlldyByZWdpb24gKHR3byB2aWV3cyBpbiB0aGUgd29yc3QgY2FzZSkuXG4gICAgICAgICAgLy8gSW4gbXVsdGl2aWV3IHJlbmRlcmluZyBvbmUgcGFzcyBkcmF3cyBib3RoIGV5ZXMgYW5kIHRoZSBmcmFnbWVudCBzaGFkZXJzIGNhbiBub3QgdGVsbCB3aGljaCBleWUgdGhleVxuICAgICAgICAgIC8vIHJlbmRlciwgc28gYSBzaW5nbGUgdmlldyByZWdpb24gY291bGQgbm90IGJlIGNvcnJlY3QgZm9yIGJvdGggZXllczogbm8gdmlldyBpcyBjcmVhdGVkIGFuZCBib3RoIGV5ZXNcbiAgICAgICAgICAvLyB1c2UgdGhlIGFsbC1saWdodCBsaXN0LlxuICAgICAgICAgIGlmICghd2ViWFJTeXN0ZW0uaXNNdWx0aVZpZXcoKSkge1xuICAgICAgICAgICAgYWRkKHdlYlhSU3lzdGVtLl9nZXRDYW1lcmFDb21wb25lbnRTSURBdCgwKSk7XG4gICAgICAgICAgICBhZGQod2ViWFJTeXN0ZW0uX2dldENhbWVyYUNvbXBvbmVudFNJREF0KDEpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQSBwYXNzIHdpdGhvdXQgYSBjYW1lcmEgdXNlcyB0aGUgY3VycmVudCBjYW1lcmEsIHRoZSBzYW1lIGZhbGxiYWNrIHRoZSBzdHJhdGVnaWVzIHVzZSBmb3IgdGhlIGRyYXcuXG4gICAgICAgIGxldCBjYW1lcmFDb21wb25lbnQgPSByZW5kZXJQYXNzLmNhbWVyYUNvbXBvbmVudDtcbiAgICAgICAgaWYgKGNhbWVyYUNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICAgICAgY2FtZXJhQ29tcG9uZW50ID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50KFxuICAgICAgICAgICAgQ2FtZXJhQ29tcG9uZW50LFxuICAgICAgICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQoZW5naW5lKVxuICAgICAgICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50IHwgdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIC8vIEEgY2FtZXJhIHN5bmNlZCB0byB0aGUgc3VuIGxpZ2h0IGhhcyBubyBtZWFuaW5nZnVsIHZpZXcgb2YgdGhlIHNjZW5lIChzaGFkb3cgbWFwIGNhbWVyYXMpLlxuICAgICAgICBpZiAoY2FtZXJhQ29tcG9uZW50ID09IG51bGwgfHwgY2FtZXJhQ29tcG9uZW50LmlzU3luY1RvTGlnaHQpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBhZGQoY2FtZXJhQ29tcG9uZW50LmNvbXBvbmVudFNJRCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjYW1lcmFTaWRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2lnbnMgdGhlIHZpZXcgc2xvdHMgdG8gdGhlIGNhbWVyYXMsIGJ1aWxkcyB0aGUgdmlld3Mgd2hvc2UgaW5wdXRzIGNoYW5nZWQgYW5kIHVwZGF0ZXMgdGhlXG4gICAqIGBsaWdodENsdXN0ZXJWaWV3SW5mb2Agb2YgdGhlIGNhbWVyYXMuXG4gICAqIEByZXR1cm5zIHRydWUgaWYgYW55dGhpbmcgd2FzIHdyaXR0ZW5cbiAgICovXG4gIHByaXZhdGUgX19hc3NpZ25WaWV3cyhjYW1lcmFTaWRzOiBudW1iZXJbXSwgbWF4Vmlld051bWJlcjogbnVtYmVyLCBpc0xpZ2h0c0NoYW5nZWQ6IGJvb2xlYW4sIGlzR3B1QnVpbGQ6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBlbmdpbmUgPSB0aGlzLl9fZW5naW5lO1xuICAgIGNvbnN0IGxheW91dCA9IHRoaXMuX19sYXlvdXQhO1xuICAgIGxldCBpc0NoYW5nZWQgPSBmYWxzZTtcblxuICAgIC8vIFNsb3RzIGFyZSBzdGlja3k6IGEgY2FtZXJhIGtlZXBzIHRoZSBzbG90IGl0IGhhZCBpbiB0aGUgcHJldmlvdXMgZnJhbWUuIFRoZSByZWdpb24gbWVtb3J5LCB0aGUgZXhjbHVkZWQgYnl0ZVxuICAgIC8vIHJhbmdlcyBhbmQgdGhlIHBlci1zbG90IG1hdHJpY2VzIHRoZW4gc3RheSBhc3NvY2lhdGVkIHdpdGggdGhlIHNhbWUgY2FtZXJhLCBzbyBhIHN0YXRpYyBzY2VuZSBkb2VzIG5vdFxuICAgIC8vIHJlYnVpbGQgYW55dGhpbmcsIGFuZCB0aGUgY2FtZXJhcyB0aGF0IGFwcGVhciBsYXRlciBmaWxsIHRoZSBmcmVlIHNsb3RzIGluIHRoZSBvcmRlciBvZiB0aGUgcmVuZGVyIHBhc3Nlcy5cbiAgICAvLyBNb3JlIGNhbWVyYXMgdGhhbiBzbG90cyBpcyBhbGxvd2VkOiB0aGUgZXh0cmEgb25lcyB1c2UgdGhlIGFsbC1saWdodCBsaXN0LlxuICAgIGNvbnN0IG5ld1Nsb3RDYW1lcmFTaWRzOiBudW1iZXJbXSA9IG5ldyBBcnJheShtYXhWaWV3TnVtYmVyKS5maWxsKC0xKTtcbiAgICBmb3IgKGNvbnN0IHNpZCBvZiBjYW1lcmFTaWRzKSB7XG4gICAgICBjb25zdCBzbG90ID0gdGhpcy5fX3Nsb3RDYW1lcmFTaWRzLmluZGV4T2Yoc2lkKTtcbiAgICAgIGlmIChzbG90ID49IDApIHtcbiAgICAgICAgbmV3U2xvdENhbWVyYVNpZHNbc2xvdF0gPSBzaWQ7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qgc2lkIG9mIGNhbWVyYVNpZHMpIHtcbiAgICAgIGlmIChuZXdTbG90Q2FtZXJhU2lkcy5pbmNsdWRlcyhzaWQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2xvdCA9IG5ld1Nsb3RDYW1lcmFTaWRzLmluZGV4T2YoLTEpO1xuICAgICAgaWYgKHNsb3QgPCAwKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbmV3U2xvdENhbWVyYVNpZHNbc2xvdF0gPSBzaWQ7XG4gICAgfVxuXG4gICAgLy8gQ2FtZXJhcyB0aGF0IGxvc3QgdGhlaXIgdmlldyB1c2UgdGhlIGFsbC1saWdodCBsaXN0LlxuICAgIGZvciAoY29uc3Qgc2lkIG9mIEFycmF5LmZyb20odGhpcy5fX2NhbWVyYXNXaXRoVmlldykpIHtcbiAgICAgIGlmICghbmV3U2xvdENhbWVyYVNpZHMuaW5jbHVkZXMoc2lkKSkge1xuICAgICAgICBjb25zdCBjYW1lcmEgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoQ2FtZXJhQ29tcG9uZW50LCBzaWQpIGFzIENhbWVyYUNvbXBvbmVudCB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGNhbWVyYSAhPSBudWxsICYmIGNhbWVyYS5fbGlnaHRDbHVzdGVyVmlld0luZm9Gb3JHcHUuX3ZbMF0gIT09IC0xKSB7XG4gICAgICAgICAgY2FtZXJhLl9saWdodENsdXN0ZXJWaWV3SW5mb0ZvckdwdS5fdlswXSA9IC0xO1xuICAgICAgICAgIGlzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX2NhbWVyYXNXaXRoVmlldy5kZWxldGUoc2lkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBzbG90ID0gMDsgc2xvdCA8IG1heFZpZXdOdW1iZXI7IHNsb3QrKykge1xuICAgICAgY29uc3Qgc2lkID0gbmV3U2xvdENhbWVyYVNpZHNbc2xvdF07XG4gICAgICBpZiAoc2lkICE9PSB0aGlzLl9fc2xvdENhbWVyYVNpZHNbc2xvdF0pIHtcbiAgICAgICAgdGhpcy5fX3Nsb3RDYW1lcmFTaWRzW3Nsb3RdID0gc2lkO1xuICAgICAgICB0aGlzLl9fc2xvdFZhbGlkW3Nsb3RdID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoc2lkIDwgMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNhbWVyYSA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChDYW1lcmFDb21wb25lbnQsIHNpZCkgYXMgQ2FtZXJhQ29tcG9uZW50IHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGNhbWVyYSA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX19zbG90Q2FtZXJhU2lkc1tzbG90XSA9IC0xO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCByZWdpb24gPSB0aGlzLl9fdmlld1JlZ2lvbnNbc2xvdF07XG4gICAgICBpZiAocmVnaW9uID09IG51bGwpIHtcbiAgICAgICAgcmVnaW9uID0gdGhpcy5fX2FsbG9jYXRlKGxheW91dC52aWV3VmVjNENvdW50KTtcbiAgICAgICAgaWYgKHJlZ2lvbiA9PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5fX3Nsb3RDYW1lcmFTaWRzW3Nsb3RdID0gLTE7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX3ZpZXdSZWdpb25zW3Nsb3RdID0gcmVnaW9uO1xuICAgICAgICAvLyBFdmVyeXRoaW5nIGFmdGVyIHRoZSBoZWFkZXIgKHRoZSBjbHVzdGVyIHRhYmxlIGFuZCB0aGUgbGlnaHQgaW5kZXggbGlzdCkgaXMgdXBsb2FkZWQgc2VwYXJhdGVseS5cbiAgICAgICAgY29uc3Qgc3RhcnQgPSAocmVnaW9uLnZlYzRCYXNlICsgTGlnaHRDbHVzdGVyTGF5b3V0LnZpZXdIZWFkZXJWZWM0Q291bnQpICogMTY7XG4gICAgICAgIHRoaXMuX19leGNsdWRlZEJ5dGVSYW5nZXMucHVzaChbc3RhcnQsIChyZWdpb24udmVjNEJhc2UgKyBsYXlvdXQudmlld1ZlYzRDb3VudCkgKiAxNl0pO1xuICAgICAgICB0aGlzLl9fZXhjbHVkZWRCeXRlUmFuZ2VzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgdmlld01hdHJpeCA9IGNhbWVyYS52aWV3TWF0cml4Ll92O1xuICAgICAgY29uc3QgcHJvamVjdGlvbk1hdHJpeCA9IGNhbWVyYS5fcHJvamVjdGlvbk1hdHJpeEZvckdwdS5fdjtcbiAgICAgIGNvbnN0IG1hdHJpY2VzID0gdGhpcy5fX3Nsb3RNYXRyaWNlcztcbiAgICAgIGNvbnN0IG1hdHJpeE9mZnNldCA9IHNsb3QgKiAzMjtcbiAgICAgIC8vIFRoZSBwcmV2aW91cyBtYXRyaWNlcyBhcmUga2VwdCBwZXIgc2xvdCwgc28gYSB2aWV3IGlzIHJlYnVpbHQgb25seSB3aGVuIGl0cyBpbnB1dHMgY2hhbmdlZDogdGhlIGxpZ2h0cywgdGhlXG4gICAgICAvLyBjYW1lcmEgbWF0cmljZXMsIG9yIHRoZSBzbG90IGl0c2VsZiAoYSBuZXcgY2FtZXJhLCBvciBhIHJlYnVpbGQgZm9yY2VkIGJ5IHRoZSBHUFUgYnVpbGQpLlxuICAgICAgbGV0IGlzTWF0cml4Q2hhbmdlZCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgIGlmIChtYXRyaWNlc1ttYXRyaXhPZmZzZXQgKyBpXSAhPT0gdmlld01hdHJpeFtpXSB8fCBtYXRyaWNlc1ttYXRyaXhPZmZzZXQgKyAxNiArIGldICE9PSBwcm9qZWN0aW9uTWF0cml4W2ldKSB7XG4gICAgICAgICAgaXNNYXRyaXhDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGlzTGlnaHRzQ2hhbmdlZCB8fCBpc01hdHJpeENoYW5nZWQgfHwgIXRoaXMuX19zbG90VmFsaWRbc2xvdF0pIHtcbiAgICAgICAgbWF0cmljZXMuc2V0KHZpZXdNYXRyaXgsIG1hdHJpeE9mZnNldCk7XG4gICAgICAgIG1hdHJpY2VzLnNldChwcm9qZWN0aW9uTWF0cml4LCBtYXRyaXhPZmZzZXQgKyAxNik7XG4gICAgICAgIC8vIFRoZSBoZWFkZXIgaG9sZHMgdGhlIGNsaXAgcm93cywgdGhlIGRlcHRoIHJvdywgdGhlIGdyaWQgc2l6ZSBhbmQgdGhlIHNsaWNlIHJhbmdlIChzZWUgTGlnaHRDbHVzdGVyTGF5b3V0KS5cbiAgICAgICAgd3JpdGVMaWdodENsdXN0ZXJWaWV3SGVhZGVyKFxuICAgICAgICAgIHJlZ2lvbi5hcnJheSxcbiAgICAgICAgICAwLFxuICAgICAgICAgIHZpZXdNYXRyaXgsXG4gICAgICAgICAgcHJvamVjdGlvbk1hdHJpeCxcbiAgICAgICAgICB0aGlzLl9fc3BoZXJlcyxcbiAgICAgICAgICB0aGlzLl9fbG9jYWxDb3VudCxcbiAgICAgICAgICBsYXlvdXQsXG4gICAgICAgICAgY2FtZXJhLnpOZWFyLFxuICAgICAgICAgIGNhbWVyYS56RmFyXG4gICAgICAgICk7XG4gICAgICAgIC8vIFRoZSBsaWdodCBvcmRlciBhbmQgdGhlIHBlci1zbGljZSBsaWdodCByYW5nZXMgZm9yIHRoZSBidWlsZGVycyAoYW5kIHRoZSBHUFUgYnVpbGQgaW5wdXQgb2YgdGhlIHNsb3QpLlxuICAgICAgICB0aGlzLl9fcHJlcGFyZVZpZXdCdWlsZChyZWdpb24uYXJyYXksIHNsb3QsIGlzR3B1QnVpbGQsIGxheW91dCk7XG4gICAgICAgIHRoaXMuX19zbG90TG9jYWxDb3VudHNbc2xvdF0gPSB0aGlzLl9fbG9jYWxDb3VudDtcbiAgICAgICAgaWYgKCFpc0dwdUJ1aWxkKSB7XG4gICAgICAgICAgLy8gQ1BVIGJ1aWxkOiB3cml0ZSB0aGUgdGFibGUgYW5kIHRoZSBpbmRleCBsaXN0IGRpcmVjdGx5IGludG8gdGhlIHJlZ2lvbiBtZW1vcnkuIFRoZSBjb21wdXRlIHNoYWRlclxuICAgICAgICAgIC8vIHdyaXRlcyB0aGUgc2FtZSBieXRlcyBpbnRvIHRoZSBzYW1lIHJlZ2lvbiwgd2hpY2ggaXMgd2h5IHRoZSBzaGFkZXJzIGFuZCB0aGUgc3RyYXRlZ3kgZG8gbm90IGNhcmVcbiAgICAgICAgICAvLyB3aGljaCBiYWNrZW5kIGJ1aWx0IHRoZSB2aWV3LlxuICAgICAgICAgIHRoaXMuX19zY3JhdGNoID8/PSBjcmVhdGVMaWdodENsdXN0ZXJCdWlsZFNjcmF0Y2gobGF5b3V0KTtcbiAgICAgICAgICBidWlsZExpZ2h0Q2x1c3RlcnNPbkNwdShcbiAgICAgICAgICAgIHJlZ2lvbi5hcnJheSxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICBsYXlvdXQsXG4gICAgICAgICAgICB0aGlzLl9fc29ydGVkU3BoZXJlcyxcbiAgICAgICAgICAgIHRoaXMuX19zb3J0ZWRFbnRyaWVzLFxuICAgICAgICAgICAgdGhpcy5fX2xvY2FsQ291bnQsXG4gICAgICAgICAgICB0aGlzLl9fc2NyYXRjaFxuICAgICAgICAgICk7XG4gICAgICAgICAgLy8gT25seSB0aGUgdGFibGUgYW5kIHRoZSB1c2VkIHBhcnQgb2YgdGhlIGxpZ2h0IGluZGV4IGxpc3QgaGF2ZSB0byByZWFjaCB0aGUgR1BVLlxuICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gKHJlZ2lvbi52ZWM0QmFzZSArIExpZ2h0Q2x1c3RlckxheW91dC52aWV3SGVhZGVyVmVjNENvdW50KSAqIDE2O1xuICAgICAgICAgIGNvbnN0IHVzZWRWZWM0Q291bnQgPSBsYXlvdXQudGFibGVWZWM0Q291bnQgKyB0aGlzLl9fc2NyYXRjaC51c2VkSW5kZXhWZWM0Q291bnQ7XG4gICAgICAgICAgdGhpcy5fX2RpcnR5Qnl0ZVJhbmdlcy5wdXNoKFtzdGFydCwgc3RhcnQgKyB1c2VkVmVjNENvdW50ICogMTZdKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9fc2xvdFZhbGlkW3Nsb3RdID0gdHJ1ZTtcbiAgICAgICAgaXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gUHVibGlzaCB0aGUgcmVnaW9uIHRvIHRoZSBjYW1lcmEuIFRoZSBzaGFkZXJzIHJlYWQgdGhpcyB2YWx1ZSBhcyB0aGUgdmlldyBpbmRleCAoYHZpZXdCYXNlYCksIHNvIC0xIChzZXRcbiAgICAgIC8vIGFib3ZlIHdoZW4gdGhlIGNhbWVyYSBsb3N0IGl0cyB2aWV3KSBtYWtlcyB0aGVtIHVzZSB0aGUgYWxsLWxpZ2h0IGxpc3QuXG4gICAgICBjb25zdCB2aWV3SW5mbyA9IGNhbWVyYS5fbGlnaHRDbHVzdGVyVmlld0luZm9Gb3JHcHUuX3Y7XG4gICAgICBpZiAodmlld0luZm9bMF0gIT09IHJlZ2lvbi52ZWM0QmFzZSkge1xuICAgICAgICB2aWV3SW5mb1swXSA9IHJlZ2lvbi52ZWM0QmFzZTtcbiAgICAgICAgaXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19jYW1lcmFzV2l0aFZpZXcuYWRkKHNpZCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIEdQVSBidWlsZCBuZWVkcyB0aGUgaW5wdXQgb2YgZXZlcnkgdmFsaWQgdmlldyAodG8gcmVidWlsZCB0aGVtIGFmdGVyIHRoZSBzdG9yYWdlIGJ1ZmZlciBpcyByZWNyZWF0ZWQpLFxuICAgIC8vIGFuZCB0aGUgaW5wdXQgb2YgZWFjaCB2aWV3IGlzIGtlcHQgaW4gdGhlIGJ1aWxkIGRhdGEgb2YgaXRzIHNsb3QuXG4gICAgdGhpcy5fX2dwdUJ1aWxkVmlld3MubGVuZ3RoID0gMDtcbiAgICBpZiAoaXNHcHVCdWlsZCkge1xuICAgICAgZm9yIChsZXQgc2xvdCA9IDA7IHNsb3QgPCBtYXhWaWV3TnVtYmVyOyBzbG90KyspIHtcbiAgICAgICAgY29uc3QgcmVnaW9uID0gdGhpcy5fX3ZpZXdSZWdpb25zW3Nsb3RdO1xuICAgICAgICBpZiAodGhpcy5fX3Nsb3RWYWxpZFtzbG90XSAmJiByZWdpb24gIT0gbnVsbCAmJiB0aGlzLl9fc2xvdENhbWVyYVNpZHNbc2xvdF0gPj0gMCkge1xuICAgICAgICAgIHRoaXMuX19ncHVCdWlsZFZpZXdzLnB1c2goe1xuICAgICAgICAgICAgdmlld1ZlYzRCYXNlOiByZWdpb24udmVjNEJhc2UsXG4gICAgICAgICAgICBsb2NhbENvdW50OiB0aGlzLl9fc2xvdExvY2FsQ291bnRzW3Nsb3RdLFxuICAgICAgICAgICAgZGF0YU9mZnNldDogc2xvdCAqIHRoaXMuX19ncHVCdWlsZFN0cmlkZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaXNDaGFuZ2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmVzIHRoZSBsaWdodCBvcmRlciBhbmQgdGhlIFogc2xpY2UgcmFuZ2VzIG9mIGEgdmlldyBmb3IgdGhlIGJ1aWxkZXJzLlxuICAgKlxuICAgKiBUaGUgbGlnaHRzIGFyZSBzb3J0ZWQgYnkgdGhlaXIgdmlldyBkZXB0aCB3aGVuIHRoZXJlIGFyZSBtb3JlIGxvY2FsIGxpZ2h0cyB0aGFuIHRoZSBjYXBhY2l0eSBvZiBhIGNsdXN0ZXIsIHNvXG4gICAqIHRoYXQgYSBjbHVzdGVyIHdoaWNoIGlzIGZ1bGwga2VlcHMgaXRzIG5lYXJlc3QgbGlnaHRzLiBPdGhlcndpc2UgdGhlIGxpZ2h0IGNvbXBvbmVudCBTSUQgb3JkZXIgaXMga2VwdCAobm9cbiAgICogY2x1c3RlciBjYW4gYmUgZnVsbCksIHdoaWNoIGtlZXBzIHRoZSByZXN1bHQgaWRlbnRpY2FsIHRvIGEgYnVpbGQgd2l0aG91dCBhIGNhcGFjaXR5LlxuICAgKlxuICAgKiBGb3IgdGhlIEdQVSBidWlsZCwgdGhlIHNvcnRlZCBzcGhlcmVzLCBlbnRyaWVzIGFuZCByYW5nZXMgYXJlIGNvcGllZCB0byB0aGUgR1BVIGJ1aWxkIGRhdGEgb2YgdGhlIHZpZXcuXG4gICAqL1xuICBwcml2YXRlIF9fcHJlcGFyZVZpZXdCdWlsZChoZWFkZXI6IEZsb2F0MzJBcnJheSwgc2xvdDogbnVtYmVyLCBpc0dwdUJ1aWxkOiBib29sZWFuLCBsYXlvdXQ6IExpZ2h0Q2x1c3RlclZpZXdMYXlvdXQpIHtcbiAgICBjb25zdCBsb2NhbENvdW50ID0gdGhpcy5fX2xvY2FsQ291bnQ7XG4gICAgY29uc3QgY2FwYWNpdHkgPSBsYXlvdXQuY2x1c3RlckxpZ2h0Q2FwYWNpdHk7XG4gICAgY29uc3QgZ3JpZFogPSBsYXlvdXQuZ3JpZFo7XG4gICAgY29uc3Qgc3BoZXJlcyA9IHRoaXMuX19zcGhlcmVzO1xuICAgIGNvbnN0IGxvY2FsRW50cmllcyA9IHRoaXMuX19sb2NhbEVudHJpZXM7XG4gICAgY29uc3Qgc29ydGVkU3BoZXJlcyA9IHRoaXMuX19zb3J0ZWRTcGhlcmVzO1xuICAgIGNvbnN0IHNvcnRlZEVudHJpZXMgPSB0aGlzLl9fc29ydGVkRW50cmllcztcbiAgICBjb25zdCByYW5nZXMgPSB0aGlzLl9fc2xpY2VSYW5nZXM7XG5cbiAgICBpZiAobG9jYWxDb3VudCA8PSBjYXBhY2l0eSkge1xuICAgICAgLy8gTm8gY2x1c3RlciBjYW4gYmUgZnVsbCwgc28ga2VlcCB0aGUgU0lEIG9yZGVyIGFuZCBsZXQgZXZlcnkgc2xpY2Ugc2NhbiBhbGwgbGlnaHRzLlxuICAgICAgLy8gRXZlcnkgc2xpY2UgcmFuZ2UgaXMgdGhlIHdob2xlIGxpc3Q6IDAgPSBubyBzb3J0aW5nIHdvcmsgYW5kIGEgYnVpbGQgaWRlbnRpY2FsIHRvIHRoZSB1bnNvcnRlZCBvcmRlci5cbiAgICAgIHNvcnRlZFNwaGVyZXMuc2V0KHNwaGVyZXMuc3ViYXJyYXkoMCwgbG9jYWxDb3VudCAqIDQpKTtcbiAgICAgIHNvcnRlZEVudHJpZXMuc2V0KGxvY2FsRW50cmllcy5zdWJhcnJheSgwLCBsb2NhbENvdW50KSk7XG4gICAgICBmb3IgKGxldCB6ID0gMDsgeiA8IGdyaWRaOyB6KyspIHtcbiAgICAgICAgcmFuZ2VzW3ogKiAyXSA9IDA7XG4gICAgICAgIHJhbmdlc1t6ICogMiArIDFdID0gbG9jYWxDb3VudDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU29ydCB0aGUgbGlnaHRzIGJ5IHZpZXcgZGVwdGggKG5lYXJlc3QgZmlyc3QpLiBUaGUgZGVwdGggcm93IG9mIHRoZSB2aWV3IGhlYWRlciAoMTIuLjE1KSBpcyBhbHJlYWR5XG4gICAgICAvLyBub3JtYWxpemVkLCBzbyB0aGUgZGVwdGggaXMgYSBkaXN0YW5jZSBpbiB3b3JsZCB1bml0cyBhbmQgY2FuIGJlIGNvbXBhcmVkIGRpcmVjdGx5LlxuICAgICAgY29uc3QgZGVwdGhzID0gdGhpcy5fX3NvcnREZXB0aHM7XG4gICAgICBjb25zdCBvcmRlciA9IHRoaXMuX19zb3J0T3JkZXI7XG4gICAgICBvcmRlci5sZW5ndGggPSBsb2NhbENvdW50O1xuICAgICAgY29uc3QgZHggPSBoZWFkZXJbMTJdO1xuICAgICAgY29uc3QgZHkgPSBoZWFkZXJbMTNdO1xuICAgICAgY29uc3QgZHogPSBoZWFkZXJbMTRdO1xuICAgICAgY29uc3QgZHcgPSBoZWFkZXJbMTVdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbENvdW50OyBpKyspIHtcbiAgICAgICAgZGVwdGhzW2ldID0gZHggKiBzcGhlcmVzW2kgKiA0XSArIGR5ICogc3BoZXJlc1tpICogNCArIDFdICsgZHogKiBzcGhlcmVzW2kgKiA0ICsgMl0gKyBkdztcbiAgICAgICAgb3JkZXJbaV0gPSBpO1xuICAgICAgfVxuICAgICAgb3JkZXIuc29ydCgoYSwgYikgPT4gZGVwdGhzW2FdIC0gZGVwdGhzW2JdKTtcbiAgICAgIC8vIEFwcGx5IHRoZSBvcmRlciBvbmNlOiBib3RoIHRoZSBzcGhlcmVzIGFuZCB0aGUgZW50cmllcyBhcmUgcGFzc2VkIHRvIHRoZSBidWlsZGVycyBpbiB0aGlzIG9yZGVyLCBzbyBhXG4gICAgICAvLyBjbHVzdGVyIHRoYXQgcmVhY2hlcyBpdHMgY2FwYWNpdHkga2VlcHMgdGhlIG5lYXJlc3QgbGlnaHRzICh0aGUgYnVpbGRlcnMgc3RvcmUgdGhlIGZpcnN0IGxpZ2h0cyB0aGV5IHNlZSkuXG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGxvY2FsQ291bnQ7IGsrKykge1xuICAgICAgICBjb25zdCBzcmMgPSBvcmRlcltrXTtcbiAgICAgICAgc29ydGVkU3BoZXJlc1trICogNF0gPSBzcGhlcmVzW3NyYyAqIDRdO1xuICAgICAgICBzb3J0ZWRTcGhlcmVzW2sgKiA0ICsgMV0gPSBzcGhlcmVzW3NyYyAqIDQgKyAxXTtcbiAgICAgICAgc29ydGVkU3BoZXJlc1trICogNCArIDJdID0gc3BoZXJlc1tzcmMgKiA0ICsgMl07XG4gICAgICAgIHNvcnRlZFNwaGVyZXNbayAqIDQgKyAzXSA9IHNwaGVyZXNbc3JjICogNCArIDNdO1xuICAgICAgICBzb3J0ZWRFbnRyaWVzW2tdID0gbG9jYWxFbnRyaWVzW3NyY107XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSByYW5nZSBvZiB0aGUgc29ydGVkIGxpZ2h0cyB3aG9zZSBzcGhlcmUgb3ZlcmxhcHMgdGhlIGRlcHRoIHJhbmdlIG9mIGVhY2ggc2xpY2UuIFRoZSBHUFUgYnVpbGQgdGVzdHNcbiAgICAgIC8vIG9ubHkgdGhlIGxpZ2h0cyBvZiB0aGUgcmFuZ2Ugb2YgdGhlIGNsdXN0ZXIncyBzbGljZSBpbnN0ZWFkIG9mIGFsbCBsaWdodHMuXG4gICAgICAvLyBUaGUgcmFuZ2VzIGFyZSBjb25zZXJ2YXRpdmUgKHRoZXkgY2FuIGluY2x1ZGUgbGlnaHRzIHRoYXQgZG8gbm90IG92ZXJsYXApLCB3aGljaCBvbmx5IGNvc3RzIGEgZmV3IHRlc3RzLlxuICAgICAgLy8gVGhlIGZpcnN0IGFuZCBsYXN0IHNsaWNlcyBleHRlbmQgdG8gaW5maW5pdHksIGxpa2UgdGhlIGNsdXN0ZXJzIGF0IHRoZSBib3JkZXIgb2YgdGhlIGdyaWQuXG4gICAgICBjb25zdCBzbGljZVNjYWxlID0gaGVhZGVyWzIwXTtcbiAgICAgIGNvbnN0IHNsaWNlQmlhcyA9IGhlYWRlclsyMV07XG4gICAgICBmb3IgKGxldCB6ID0gMDsgeiA8IGdyaWRaOyB6KyspIHtcbiAgICAgICAgY29uc3Qgc2xpY2VOZWFyID0geiA9PT0gMCA/IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSA6IE1hdGguZXhwKCh6IC0gc2xpY2VCaWFzKSAvIHNsaWNlU2NhbGUpO1xuICAgICAgICBjb25zdCBzbGljZUZhciA9IHogPT09IGdyaWRaIC0gMSA/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSA6IE1hdGguZXhwKCh6ICsgMSAtIHNsaWNlQmlhcykgLyBzbGljZVNjYWxlKTtcbiAgICAgICAgbGV0IHN0YXJ0ID0gbG9jYWxDb3VudDtcbiAgICAgICAgbGV0IGVuZCA9IDA7XG4gICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgbG9jYWxDb3VudDsgaysrKSB7XG4gICAgICAgICAgY29uc3Qgc3JjID0gb3JkZXJba107XG4gICAgICAgICAgY29uc3QgZCA9IGRlcHRoc1tzcmNdO1xuICAgICAgICAgIGNvbnN0IHIgPSBzcGhlcmVzW3NyYyAqIDQgKyAzXTtcbiAgICAgICAgICBpZiAoZCArIHIgPj0gc2xpY2VOZWFyICYmIGQgLSByIDw9IHNsaWNlRmFyKSB7XG4gICAgICAgICAgICBpZiAoayA8IHN0YXJ0KSBzdGFydCA9IGs7XG4gICAgICAgICAgICBpZiAoayArIDEgPiBlbmQpIGVuZCA9IGsgKyAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICAgIGVuZCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmFuZ2VzW3ogKiAyXSA9IHN0YXJ0O1xuICAgICAgICByYW5nZXNbeiAqIDIgKyAxXSA9IGVuZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNHcHVCdWlsZCkge1xuICAgICAgLy8gQ29weSB0aGUgaW5wdXRzIGludG8gdGhlIHBlci1zbG90IGJ1aWxkIGRhdGEgb2YgV2ViR3B1TGlnaHRDbHVzdGVyQnVpbGRlci4gVGhlIHNsb3Qgc3RyaWRlIHJlc2VydmVzIHRoZVxuICAgICAgLy8gZnVsbCBjYXBhY2l0eSBmb3IgZXZlcnkgdmlldyAoc3BoZXJlcywgdGhlbiBlbnRyaWVzLCB0aGVuIHRoZSBwZXItc2xpY2UgcmFuZ2VzKSwgc28gYSB2aWV3IHdob3NlIGxpZ2h0XG4gICAgICAvLyBjb3VudCBzaHJpbmtzIGRvZXMgbm90IG1vdmUgdGhlIGRhdGEgb2YgdGhlIG90aGVyIHZpZXdzLCBhbmQgdGhlIHN0b3JhZ2UgYnVmZmVyIG9mZnNldHMgc3RheSB2YWxpZC5cbiAgICAgIGNvbnN0IGRhdGFPZmZzZXQgPSBzbG90ICogdGhpcy5fX2dwdUJ1aWxkU3RyaWRlO1xuICAgICAgY29uc3QgbG9jYWxDYXBhY2l0eSA9IHRoaXMuX19jYXBhY2l0eTtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLl9fZ3B1QnVpbGREYXRhO1xuICAgICAgZGF0YS5zZXQoc29ydGVkU3BoZXJlcy5zdWJhcnJheSgwLCBsb2NhbENvdW50ICogNCksIGRhdGFPZmZzZXQpO1xuICAgICAgZGF0YS5zZXQoc29ydGVkRW50cmllcy5zdWJhcnJheSgwLCBsb2NhbENvdW50KSwgZGF0YU9mZnNldCArIGxvY2FsQ2FwYWNpdHkgKiA0KTtcbiAgICAgIGNvbnN0IHJhbmdlQmFzZSA9IGRhdGFPZmZzZXQgKyBsb2NhbENhcGFjaXR5ICogNTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JpZFogKiAyOyBpKyspIHtcbiAgICAgICAgZGF0YVtyYW5nZUJhc2UgKyBpXSA9IHJhbmdlc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWxsb2NhdGVzIGEgcmVnaW9uIGluIHRoZSBHUFUgaW5zdGFuY2UgZGF0YS4gUmV0dXJucyB1bmRlZmluZWQgKGFuZCBkaXNhYmxlcyB0aGUgY2x1c3RlcnMpIHdoZW4gaXQgZmFpbHMuXG4gICAqXG4gICAqIFRoZSByZWdpb24gaXMgb3JkaW5hcnkgR1BVIGluc3RhbmNlIGRhdGE6IHRoZSBXZWJHTDIgZGF0YSB0ZXh0dXJlIC8gdGhlIFdlYkdQVSBzdG9yYWdlIGJ1ZmZlci4gVGhhdCBpcyB3aHkgdGhlXG4gICAqIHNoYWRlcnMgY2FuIHJlYWQgdGhlIHRhYmxlIHdpdGggdGhlIHNhbWUgYGZldGNoRWxlbWVudGAgLyBgZ2V0X2NsdXN0ZXJlZExpZ2h0RGF0YWAgYWNjZXNzb3IgYXMgYW55IG90aGVyIGRhdGEsXG4gICAqIGFuZCB3aHkgdGhlIHN0cmF0ZWdpZXMgaGF2ZSB0byBza2lwIGl0IGluIHRoZSBnZW5lcmljIHVwbG9hZCAoc2VlIGBfZ2V0RXhjbHVkZWRCeXRlUmFuZ2VzYCkuXG4gICAqL1xuICBwcml2YXRlIF9fYWxsb2NhdGUodmVjNENvdW50OiBudW1iZXIpOiBHcHVEYXRhUmVnaW9uIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZW1vcnlNYW5hZ2VyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyO1xuICAgIGNvbnN0IGJ5dGVMZW5ndGggPSB2ZWM0Q291bnQgKiAxNjtcbiAgICAvLyBUaGUgR1BVIGluc3RhbmNlIGRhdGEgY2FuIGJlIHNwbGl0IG92ZXIgc2V2ZXJhbCBidWZmZXJzIChCdWZmZXJVc2UgbGF5ZXJzKTsgdGhlIGZpcnN0IG9uZSB3aXRoIHJvb20gd2lucy5cbiAgICBjb25zdCBsYXllckNvdW50ID0gdGhpcy5fX2VuZ2luZS5jb25maWcuYnVmZmVyU2l6ZURpdmlzaW9uUmF0aW9zRm9yR1BVSW5zdGFuY2VEYXRhVXNhZ2UubGVuZ3RoO1xuICAgIGZvciAobGV0IGxheWVyID0gMDsgbGF5ZXIgPCBsYXllckNvdW50OyBsYXllcisrKSB7XG4gICAgICBjb25zdCBidWZmZXIgPSBtZW1vcnlNYW5hZ2VyLmNyZWF0ZU9yR2V0QnVmZmVyKEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsIGxheWVyKTtcbiAgICAgIGlmIChidWZmZXIuYnl0ZUxlbmd0aCAtIGJ1ZmZlci50YWtlblNpemVJbkJ5dGUgPCBieXRlTGVuZ3RoKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYnVmZmVyVmlld1Jlc3VsdCA9IGJ1ZmZlci50YWtlQnVmZmVyVmlldyh7IGJ5dGVMZW5ndGhUb05lZWQ6IGJ5dGVMZW5ndGgsIGJ5dGVTdHJpZGU6IDAgfSk7XG4gICAgICBpZiAoYnVmZmVyVmlld1Jlc3VsdC5pc0VycigpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYnVmZmVyVmlldyA9IGJ1ZmZlclZpZXdSZXN1bHQuZ2V0KCk7XG4gICAgICAvLyBUaGUgYmFzZSBvZmZzZXQgaW4gdGhlIHdob2xlIGluc3RhbmNlIGRhdGEgKGFsbCBsYXllcnMpLCBzbyBgdmVjNEJhc2VgIGlzIGRpcmVjdGx5IHVzYWJsZSBhcyBhIHNoYWRlciBpbmRleC5cbiAgICAgIGNvbnN0IGJ5dGVPZmZzZXQgPVxuICAgICAgICBtZW1vcnlNYW5hZ2VyLmdldEJ5dGVPZmZzZXRPZkV4aXN0aW5nQnVmZmVycyhCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLCBidWZmZXIuaW5kZXhPZlRoZUJ1ZmZlclVzYWdlKSArXG4gICAgICAgIGJ1ZmZlclZpZXcuYnl0ZU9mZnNldEluQnVmZmVyO1xuICAgICAgY29uc3QgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICBidWZmZXIuZ2V0QXJyYXlCdWZmZXIoKSxcbiAgICAgICAgYnVmZmVyVmlldy5ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyLFxuICAgICAgICB2ZWM0Q291bnQgKiA0XG4gICAgICApO1xuICAgICAgLy8gWmVybyB0aGUgcmVnaW9uOiBzdGFsZSBkYXRhIGZyb20gYSBwcmV2aW91cyBhbGxvY2F0aW9uIGNvdWxkIGJlIHJlYWQgYmVmb3JlIHRoZSBmaXJzdCBidWlsZCB3cml0ZXMgaXRcbiAgICAgIC8vICh0aGUgR1BVIGJ1aWxkIGFmdGVyIGEgc3RvcmFnZSBidWZmZXIgcmVjcmVhdGlvbiBpbiBwYXJ0aWN1bGFyKS5cbiAgICAgIGFycmF5LmZpbGwoMCk7XG4gICAgICByZXR1cm4geyBhcnJheSwgdmVjNEJhc2U6IGJ5dGVPZmZzZXQgLyAxNiB9O1xuICAgIH1cbiAgICBMb2dnZXIuZGVmYXVsdC53YXJuKCdMaWdodENsdXN0ZXJTeXN0ZW06IEZhaWxlZCB0byBhbGxvY2F0ZSB0aGUgbGlnaHQgY2x1c3RlciBkYXRhLiBBbGwgbGlnaHRzIGFyZSBldmFsdWF0ZWQuJyk7XG4gICAgdGhpcy5fX2lzQWxsb2NhdGlvbkZhaWxlZCA9IHRydWU7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsY0FBYztBQUd2QjtBQUFBLEVBQ0U7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxPQUNLO0FBQ1A7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsT0FDSztBQW1DUCxJQUFNLHdCQUF3QjtBQTRCdkIsSUFBTSxxQkFBTixNQUF5QjtBQUFBLEVBNEQ5QixZQUFZLFFBQWdCO0FBMUQ1QixTQUFRLGdCQUFnQjtBQUd4QixTQUFRLHVCQUF1QjtBQUMvQixTQUFRLGFBQWE7QUFLckI7QUFBQSxTQUFRLFlBQVksSUFBSSxhQUFhLENBQUM7QUFDdEMsU0FBUSxnQkFBZ0IsSUFBSSxhQUFh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
