import type { Expression } from '../Expression';
import { LightClusterLayout } from './LightClusterLayout';
import type { LightClusterGpuBuildParams } from './LightClusterSystem';

/**
 * The part of the light cluster system that Engine and the rendering strategies use.
 *
 * The real implementation (LightClusterSystem and LightClusterBuilder, about 12KB) is loaded lazily when the
 * first light is added, so applications without lights never download it.
 *
 * @internal
 */
export interface ILightClusterSystem {
  readonly dataVersion: number;
  readonly isGpuBuild: boolean;
  update(expressions: readonly Expression[]): void;
  _getGpuBuildParams(): LightClusterGpuBuildParams | undefined;
  _getExcludedByteRanges(): readonly [number, number][];
  _takeDirtyByteRanges(): [number, number][];
  _getViewUniformData(cameraSid: number): Float32Array;
}

/**
 * Stands in for LightClusterSystem until the first light is added.
 *
 * It behaves like a system whose cameras have no clusters: the view uniform points at the all-light list, no
 * byte ranges are excluded or uploaded, and there is nothing to build on the GPU.
 *
 * @internal
 */
export class LightClusterSystemStub implements ILightClusterSystem {
  private __viewUniformData = new Float32Array(LightClusterLayout.viewHeaderVec4Count * 4 + 4);

  constructor() {
    // The last vec4 carries the view index. -1 selects the all-light list, as in the real system.
    this.__viewUniformData[LightClusterLayout.viewHeaderVec4Count * 4] = -1;
  }

  get dataVersion() {
    return 0;
  }

  get isGpuBuild() {
    return false;
  }

  update(_expressions: readonly Expression[]): void {}

  _getGpuBuildParams(): LightClusterGpuBuildParams | undefined {
    return undefined;
  }

  _getExcludedByteRanges(): readonly [number, number][] {
    return [];
  }

  _takeDirtyByteRanges(): [number, number][] {
    return [];
  }

  _getViewUniformData(_cameraSid: number): Float32Array {
    return this.__viewUniformData;
  }
}
