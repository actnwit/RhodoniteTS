import { RnObject } from '../core/RnObject';
import { IVector4 } from '../math/IVector';
import { RenderPass } from './RenderPass';

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
export class Expression extends RnObject {
  private __renderPasses: RenderPass[] = [];

  /**
   * Creates a new Expression instance.
   * Initializes an empty array of render passes that can be populated later.
   */
  constructor() {
    super();
  }

  /**
   * Creates a deep copy of this Expression instance.
   * All render passes are cloned individually to ensure complete independence.
   *
   * @returns A new Expression instance with cloned render passes
   */
  clone() {
    const exp = new Expression();
    exp.tryToSetUniqueName(this.uniqueName + '_cloned', true);
    const renderPasses = [];
    for (const renderPass of this.__renderPasses) {
      renderPasses.push(renderPass.clone());
    }
    exp.addRenderPasses(renderPasses);
    return exp;
  }

  /**
   * Appends multiple render passes to the end of the current render pass sequence.
   * The order of render passes determines the rendering pipeline execution order.
   *
   * @param renderPasses - Array of RenderPass instances to be added
   */
  addRenderPasses(renderPasses: RenderPass[]) {
    for (const renderPass of renderPasses) {
      this.__renderPasses.push(renderPass);
    }
  }

  /**
   * Removes all render passes from this expression.
   * This effectively resets the expression to an empty state.
   */
  clearRenderPasses() {
    this.__renderPasses.length = 0;
  }

  /**
   * Gets a read-only reference to the array of render passes in this expression.
   * The render passes are returned in the order they will be executed.
   *
   * @returns Array of RenderPass instances in execution order
   */
  get renderPasses(): RenderPass[] {
    return this.__renderPasses;
  }

  /**
   * Sets the viewport dimensions for all render passes in this expression.
   * This is a convenience method to apply the same viewport to all passes at once.
   *
   * @param viewport - Vector4 containing viewport coordinates (x, y, width, height)
   */
  setViewport(viewport: IVector4) {
    for (const renderPass of this.__renderPasses) {
      renderPass.setViewport(viewport);
    }
  }
}
