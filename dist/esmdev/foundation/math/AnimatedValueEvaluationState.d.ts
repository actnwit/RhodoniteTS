/**
 * A memoized keyframe segment index for one animation sampler evaluation site.
 * `i = -1` means "not searched yet".
 */
export type KeyframeCursor = {
    i: number;
};
/**
 * Evaluation memo shared by the `Animated*` value classes.
 *
 * Interpolation results are reused while the effective animation time and the blending ratio
 * (only when a second sampler participates in the result) are unchanged. All invalidation points
 * that replace sampler data or rebind tracks must call {@link AnimatedValueEvaluationState.invalidate}.
 */
export declare class AnimatedValueEvaluationState {
    private __hasEvaluated;
    private __lastEffectiveTime;
    private __lastBlendingRatio;
    private __evaluationCount;
    /** Segment cursor for the first active sampler (used by keyframe search memoization). */
    readonly firstCursor: KeyframeCursor;
    /** Segment cursor for the second active sampler (used by keyframe search memoization). */
    readonly secondCursor: KeyframeCursor;
    /** Reused scratch buffers for two-track blending (double precision to match the previous math). */
    private __scratchFirst;
    private __scratchSecond;
    /**
     * Ensures the blending scratch buffers can hold `length` components.
     */
    ensureScratch(length: number): void;
    get scratchFirst(): Float64Array;
    get scratchSecond(): Float64Array;
    /**
     * Returns true when the animated value must be re-evaluated.
     * @param effectiveTime - Time after loop wrapping
     * @param blendingRatio - Current blending ratio
     * @param hasSecondSampler - Whether a second sampler contributes to the result
     */
    shouldEvaluate(effectiveTime: number, blendingRatio: number, hasSecondSampler: boolean): boolean;
    /**
     * Records a completed evaluation and increments the evaluation counter.
     */
    markEvaluated(effectiveTime: number, blendingRatio: number): void;
    /**
     * Drops the memoized result and resets the keyframe cursors.
     */
    invalidate(): void;
    /**
     * Resets the keyframe segment cursors without discarding the evaluated value.
     */
    resetCursors(): void;
    /**
     * Number of actual interpolations performed. Intended for tests and benchmarks.
     */
    get evaluationCount(): number;
}
