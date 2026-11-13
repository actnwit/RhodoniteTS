/**
 * A memoized keyframe segment index for one animation sampler evaluation site.
 * `i = -1` means "not searched yet".
 */
export type KeyframeCursor = { i: number };

/**
 * Evaluation memo shared by the `Animated*` value classes.
 *
 * Interpolation results are reused while the effective animation time and the blending ratio
 * (only when a second sampler participates in the result) are unchanged. All invalidation points
 * that replace sampler data or rebind tracks must call {@link AnimatedValueEvaluationState.invalidate}.
 */
export class AnimatedValueEvaluationState {
  private __hasEvaluated = false;
  private __lastEffectiveTime = 0;
  private __lastBlendingRatio = 0;
  private __evaluationCount = 0;
  /** Segment cursor for the first active sampler (used by keyframe search memoization). */
  readonly firstCursor: KeyframeCursor = { i: -1 };
  /** Segment cursor for the second active sampler (used by keyframe search memoization). */
  readonly secondCursor: KeyframeCursor = { i: -1 };
  /** Reused scratch buffers for two-track blending (double precision to match the previous math). */
  private __scratchFirst: Float64Array = new Float64Array(0);
  private __scratchSecond: Float64Array = new Float64Array(0);

  /**
   * Ensures the blending scratch buffers can hold `length` components.
   */
  ensureScratch(length: number): void {
    if (this.__scratchFirst.length < length) {
      this.__scratchFirst = new Float64Array(length);
      this.__scratchSecond = new Float64Array(length);
    }
  }

  get scratchFirst(): Float64Array {
    return this.__scratchFirst;
  }

  get scratchSecond(): Float64Array {
    return this.__scratchSecond;
  }

  /**
   * Returns true when the animated value must be re-evaluated.
   * @param effectiveTime - Time after loop wrapping
   * @param blendingRatio - Current blending ratio
   * @param hasSecondSampler - Whether a second sampler contributes to the result
   */
  shouldEvaluate(effectiveTime: number, blendingRatio: number, hasSecondSampler: boolean): boolean {
    if (!this.__hasEvaluated) {
      return true;
    }
    if (this.__lastEffectiveTime !== effectiveTime) {
      return true;
    }
    // The ratio only affects the result when a second sampler is blended in.
    if (hasSecondSampler && this.__lastBlendingRatio !== blendingRatio) {
      return true;
    }
    return false;
  }

  /**
   * Records a completed evaluation and increments the evaluation counter.
   */
  markEvaluated(effectiveTime: number, blendingRatio: number): void {
    this.__hasEvaluated = true;
    this.__lastEffectiveTime = effectiveTime;
    this.__lastBlendingRatio = blendingRatio;
    this.__evaluationCount++;
  }

  /**
   * Drops the memoized result and resets the keyframe cursors.
   */
  invalidate(): void {
    this.__hasEvaluated = false;
    this.resetCursors();
  }

  /**
   * Resets the keyframe segment cursors without discarding the evaluated value.
   */
  resetCursors(): void {
    this.firstCursor.i = -1;
    this.secondCursor.i = -1;
  }

  /**
   * Number of actual interpolations performed. Intended for tests and benchmarks.
   */
  get evaluationCount(): number {
    return this.__evaluationCount;
  }
}
