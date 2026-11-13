/** The part of EXT_disjoint_timer_query_webgl2 used by WebGLGpuTimer. */
type DisjointTimerQueryWebGL2 = {
  TIME_ELAPSED_EXT: GLenum;
  GPU_DISJOINT_EXT: GLenum;
};

/**
 * Up to this many measurements may wait for their results. While they are all pending, frames are not
 * measured, which keeps the number of queries bounded when the GPU falls behind.
 */
const MAX_PENDING_QUERIES = 4;

/**
 * Measures the GPU time of each frame with EXT_disjoint_timer_query_webgl2.
 *
 * Results arrive a few frames later, so `lastGpuTimeMilliseconds` reports the latest frame whose result is
 * available, not the current one. Results of a period in which the GPU reported a disjoint event (for
 * example a power state change) are discarded because they are unreliable.
 */
export class WebGLGpuTimer {
  private __gl: WebGL2RenderingContext;
  private __ext: DisjointTimerQueryWebGL2 | null;
  private __activeQuery?: WebGLQuery;
  private __pendingQueries: WebGLQuery[] = [];
  private __freeQueries: WebGLQuery[] = [];
  private __lastGpuTimeMilliseconds?: number;

  constructor(gl: WebGL2RenderingContext) {
    this.__gl = gl;
    this.__ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as DisjointTimerQueryWebGL2 | null;
  }

  /** Whether the context supports GPU timer queries. */
  get isSupported(): boolean {
    return this.__ext != null;
  }

  /** The GPU time of the latest measured frame in milliseconds, or undefined if none is available yet. */
  get lastGpuTimeMilliseconds(): number | undefined {
    return this.__lastGpuTimeMilliseconds;
  }

  /**
   * Starts measuring the GL commands issued until end().
   * Only one measurement can be active at a time; nested calls are ignored.
   */
  begin() {
    const ext = this.__ext;
    if (ext == null || this.__activeQuery != null || this.__pendingQueries.length >= MAX_PENDING_QUERIES) {
      return;
    }
    const gl = this.__gl;
    const query = this.__freeQueries.pop() ?? gl.createQuery();
    if (query == null) {
      return;
    }
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    this.__activeQuery = query;
  }

  /**
   * Ends the measurement started by begin() and collects the results that have become available.
   */
  end() {
    const ext = this.__ext;
    if (ext == null) {
      return;
    }
    const gl = this.__gl;
    if (this.__activeQuery != null) {
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      this.__pendingQueries.push(this.__activeQuery);
      this.__activeQuery = undefined;
    }
    this.__collectResults();
  }

  private __collectResults() {
    const gl = this.__gl;
    const pending = this.__pendingQueries;
    // Results become available in submission order, so nothing can be collected until the oldest is.
    if (pending.length === 0 || !gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)) {
      return;
    }
    // Reading GPU_DISJOINT_EXT also clears it, so it is read once for all the results collected here.
    // It is read only when a result is available because getParameter() may wait for the GPU process.
    const disjoint = gl.getParameter(this.__ext!.GPU_DISJOINT_EXT) as boolean;
    let collected = 0;
    while (collected < pending.length) {
      const query = pending[collected];
      // Results become available in submission order.
      if (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
        break;
      }
      if (!disjoint) {
        const nanoseconds = gl.getQueryParameter(query, gl.QUERY_RESULT) as number;
        this.__lastGpuTimeMilliseconds = nanoseconds / 1e6;
      }
      this.__freeQueries.push(query);
      collected++;
    }
    if (collected > 0) {
      pending.splice(0, collected);
    }
  }

  /** Deletes the queries. The timer must not be used afterwards. */
  destroy() {
    const gl = this.__gl;
    if (this.__activeQuery != null && this.__ext != null) {
      gl.endQuery(this.__ext.TIME_ELAPSED_EXT);
      gl.deleteQuery(this.__activeQuery);
      this.__activeQuery = undefined;
    }
    for (const query of this.__pendingQueries) {
      gl.deleteQuery(query);
    }
    for (const query of this.__freeQueries) {
      gl.deleteQuery(query);
    }
    this.__pendingQueries.length = 0;
    this.__freeQueries.length = 0;
  }
}
