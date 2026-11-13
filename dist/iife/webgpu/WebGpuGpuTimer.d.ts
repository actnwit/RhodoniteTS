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
export declare class WebGpuGpuTimer {
    private __device;
    private __querySet?;
    private __resolveBuffer?;
    private __freeReadbackBuffers;
    private __readbackBufferCount;
    /** Timestamps written by passes recorded into the current command encoder. */
    private __timestampCount;
    /** The frame the timestamps of the current command encoder belong to. */
    private __encoderFrame?;
    private __currentFrame?;
    private __readbacksToMap;
    private __lastGpuTimeMilliseconds?;
    constructor(device: GPUDevice);
    /** Whether the device supports timestamp queries. */
    get isSupported(): boolean;
    /** The GPU time of the latest measured frame in milliseconds, or undefined if none is available yet. */
    get lastGpuTimeMilliseconds(): number | undefined;
    /** Starts measuring the render passes begun from now on. */
    beginFrame(): void;
    /** Stops measuring. The frame's time is published once all of its timestamps have been read back. */
    endFrame(): void;
    /**
     * Returns the timestamp writes to set on a render pass descriptor, or undefined when the pass is not
     * measured (outside a frame, or when the query set is full).
     */
    getTimestampWrites(): GPURenderPassTimestampWrites | undefined;
    /**
     * Encodes the resolve of the timestamps written by the passes of `encoder`.
     * Call this before finishing the encoder, and call afterSubmit() after submitting it.
     */
    encodeResolve(encoder: GPUCommandEncoder): void;
    /** Starts reading back the timestamps resolved by the encoder that has just been submitted. */
    afterSubmit(): void;
    private __readBack;
    private __tryPublish;
    /** Destroys the GPU resources. The timer must not be used afterwards. */
    destroy(): void;
}
