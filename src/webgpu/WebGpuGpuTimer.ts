/** Timestamps per query set: two per render pass (beginning and end). */
const MAX_TIMESTAMPS = 512;
/** Readback buffers in flight. While all of them are mapped, frames are not measured. */
const MAX_READBACK_BUFFERS = 4;

type GpuTimerFrame = {
  sumNanoseconds: number;
  /** Readbacks of this frame that have not been read yet. */
  pendingReadbacks: number;
  ended: boolean;
  /** False when some passes of the frame could not be measured. */
  isComplete: boolean;
};

type PendingReadback = {
  buffer: GPUBuffer;
  timestampCount: number;
  frame: GpuTimerFrame;
};

/**
 * Measures the GPU time of each frame with the `timestamp-query` feature.
 *
 * Every render pass begun between beginFrame() and endFrame() writes timestamps at its beginning and end;
 * the frame's GPU time is the sum of the pass durations. The timestamps are resolved when the command
 * encoder is submitted and read back asynchronously, so `lastGpuTimeMilliseconds` reports the latest
 * frame whose results have arrived, not the current one.
 *
 * Browsers may quantize timestamps (e.g. to 100µs) unless developer features are enabled.
 */
export class WebGpuGpuTimer {
  private __device: GPUDevice;
  private __querySet?: GPUQuerySet;
  private __resolveBuffer?: GPUBuffer;
  private __freeReadbackBuffers: GPUBuffer[] = [];
  private __readbackBufferCount = 0;
  /** Timestamps written by passes recorded into the current command encoder. */
  private __timestampCount = 0;
  /** The frame the timestamps of the current command encoder belong to. */
  private __encoderFrame?: GpuTimerFrame;
  private __currentFrame?: GpuTimerFrame;
  private __readbacksToMap: PendingReadback[] = [];
  private __lastGpuTimeMilliseconds?: number;

  constructor(device: GPUDevice) {
    this.__device = device;
  }

  /** Whether the device supports timestamp queries. */
  get isSupported(): boolean {
    return this.__device.features.has('timestamp-query');
  }

  /** The GPU time of the latest measured frame in milliseconds, or undefined if none is available yet. */
  get lastGpuTimeMilliseconds(): number | undefined {
    return this.__lastGpuTimeMilliseconds;
  }

  /** Starts measuring the render passes begun from now on. */
  beginFrame() {
    if (!this.isSupported) {
      return;
    }
    this.__currentFrame = { sumNanoseconds: 0, pendingReadbacks: 0, ended: false, isComplete: true };
  }

  /** Stops measuring. The frame's time is published once all of its timestamps have been read back. */
  endFrame() {
    const frame = this.__currentFrame;
    if (frame == null) {
      return;
    }
    frame.ended = true;
    this.__currentFrame = undefined;
    this.__tryPublish(frame);
  }

  /**
   * Returns the timestamp writes to set on a render pass descriptor, or undefined when the pass is not
   * measured (outside a frame, or when the query set is full).
   */
  getTimestampWrites(): GPURenderPassTimestampWrites | undefined {
    const frame = this.__currentFrame;
    if (frame == null) {
      return undefined;
    }
    if (this.__encoderFrame != null && this.__encoderFrame !== frame) {
      // The encoder still holds passes of a previous frame; mixing frames would mix their times.
      frame.isComplete = false;
      return undefined;
    }
    if (this.__timestampCount + 2 > MAX_TIMESTAMPS) {
      frame.isComplete = false;
      return undefined;
    }
    if (this.__querySet == null) {
      this.__querySet = this.__device.createQuerySet({ type: 'timestamp', count: MAX_TIMESTAMPS });
      this.__resolveBuffer = this.__device.createBuffer({
        size: MAX_TIMESTAMPS * 8,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      });
    }
    const index = this.__timestampCount;
    this.__timestampCount += 2;
    this.__encoderFrame = frame;
    return {
      querySet: this.__querySet,
      beginningOfPassWriteIndex: index,
      endOfPassWriteIndex: index + 1,
    };
  }

  /**
   * Encodes the resolve of the timestamps written by the passes of `encoder`.
   * Call this before finishing the encoder, and call afterSubmit() after submitting it.
   */
  encodeResolve(encoder: GPUCommandEncoder) {
    const timestampCount = this.__timestampCount;
    const frame = this.__encoderFrame;
    this.__timestampCount = 0;
    this.__encoderFrame = undefined;
    if (timestampCount === 0 || frame == null) {
      return;
    }
    let buffer = this.__freeReadbackBuffers.pop();
    if (buffer == null) {
      if (this.__readbackBufferCount >= MAX_READBACK_BUFFERS) {
        frame.isComplete = false;
        return;
      }
      buffer = this.__device.createBuffer({
        size: MAX_TIMESTAMPS * 8,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      this.__readbackBufferCount++;
    }
    encoder.resolveQuerySet(this.__querySet!, 0, timestampCount, this.__resolveBuffer!, 0);
    encoder.copyBufferToBuffer(this.__resolveBuffer!, 0, buffer, 0, timestampCount * 8);
    frame.pendingReadbacks++;
    this.__readbacksToMap.push({ buffer, timestampCount, frame });
  }

  /** Starts reading back the timestamps resolved by the encoder that has just been submitted. */
  afterSubmit() {
    const readbacks = this.__readbacksToMap;
    for (let i = 0; i < readbacks.length; i++) {
      this.__readBack(readbacks[i]);
    }
    readbacks.length = 0;
  }

  private __readBack(readback: PendingReadback) {
    const { buffer, timestampCount, frame } = readback;
    const byteLength = timestampCount * 8;
    buffer
      .mapAsync(GPUMapMode.READ, 0, byteLength)
      .then(() => {
        const timestamps = new BigUint64Array(buffer.getMappedRange(0, byteLength));
        for (let i = 0; i + 1 < timestampCount; i += 2) {
          // Timestamps are nanoseconds. Numbers represent them exactly up to 2^53 ns (~104 days of uptime)
          // and within a few nanoseconds beyond, which is negligible for frame durations.
          const begin = Number(timestamps[i]);
          const end = Number(timestamps[i + 1]);
          // A timestamp that was not written resolves to 0, which would yield a meaningless duration.
          if (begin !== 0 && end > begin) {
            frame.sumNanoseconds += end - begin;
          }
        }
        buffer.unmap();
        this.__freeReadbackBuffers.push(buffer);
      })
      .catch(() => {
        // The device was lost or the buffer destroyed.
        frame.isComplete = false;
      })
      .finally(() => {
        frame.pendingReadbacks--;
        this.__tryPublish(frame);
      });
  }

  private __tryPublish(frame: GpuTimerFrame) {
    if (frame.ended && frame.pendingReadbacks === 0 && frame.isComplete) {
      this.__lastGpuTimeMilliseconds = frame.sumNanoseconds / 1e6;
    }
  }

  /** Destroys the GPU resources. The timer must not be used afterwards. */
  destroy() {
    this.__querySet?.destroy();
    this.__resolveBuffer?.destroy();
    for (const buffer of this.__freeReadbackBuffers) {
      buffer.destroy();
    }
    this.__freeReadbackBuffers.length = 0;
    this.__querySet = undefined;
    this.__resolveBuffer = undefined;
  }
}
