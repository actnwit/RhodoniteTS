import { RnObject } from '../core/RnObject';
import type { IVector4 } from '../math/IVector';
import type { RenderPass } from './RenderPass';
/**
 * Expression class manages the rendering pipeline by defining the order and sequence of render passes.
 * It acts as a container that orchestrates multiple render passes to create complex rendering effects.
 *
 * @example
 * ```typescript
 * const expression = new Expression();
 * expression.addRenderPasses([shadowPass, mainPass, postProcessPass]);
 * ```
 */
export declare class Expression extends RnObject {
    private __renderPasses;
    /**
     * Creates a deep copy of this Expression instance.
     * All render passes are cloned individually to ensure complete independence.
     *
     * @returns A new Expression instance with cloned render passes
     */
    clone(): Expression;
    /**
     * Appends multiple render passes to the end of the current render pass sequence.
     * The order of render passes determines the rendering pipeline execution order.
     *
     * @param renderPasses - Array of RenderPass instances to be added
     */
    addRenderPasses(renderPasses: RenderPass[]): void;
    /**
     * Removes all render passes from this expression.
     * This effectively resets the expression to an empty state.
     */
    clearRenderPasses(): void;
    /**
     * Gets a read-only reference to the array of render passes in this expression.
     * The render passes are returned in the order they will be executed.
     *
     * @returns Array of RenderPass instances in execution order
     */
    get renderPasses(): RenderPass[];
    /**
     * Sets the viewport dimensions for all render passes in this expression.
     * This is a convenience method to apply the same viewport to all passes at once.
     *
     * @param viewport - Vector4 containing viewport coordinates (x, y, width, height)
     */
    setViewport(viewport: IVector4): void;
}
