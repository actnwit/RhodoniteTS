/**
 * Measures the GPU time of each frame with EXT_disjoint_timer_query_webgl2.
 *
 * Results arrive a few frames later, so `lastGpuTimeMilliseconds` reports the latest frame whose result is
 * available, not the current one. Results of a period in which the GPU reported a disjoint event (for
 * example a power state change) are discarded because they are unreliable.
 */
export declare class WebGLGpuTimer {
    private __gl;
    private __ext;
    private __activeQuery?;
    private __pendingQueries;
    private __freeQueries;
    private __lastGpuTimeMilliseconds?;
    constructor(gl: WebGL2RenderingContext);
    /** Whether the context supports GPU timer queries. */
    get isSupported(): boolean;
    /** The GPU time of the latest measured frame in milliseconds, or undefined if none is available yet. */
    get lastGpuTimeMilliseconds(): number | undefined;
    /**
     * Starts measuring the GL commands issued until end().
     * Only one measurement can be active at a time; nested calls are ignored.
     */
    begin(): void;
    /**
     * Ends the measurement started by begin() and collects the results that have become available.
     */
    end(): void;
    private __collectResults;
    /** Deletes the queries. The timer must not be used afterwards. */
    destroy(): void;
}
