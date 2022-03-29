import RnObject from '../core/RnObject';
import { IVector4 } from '../math/IVector';
import RenderPass from './RenderPass';

/**
 * Expression specifies the order of render passes on rendering process.
 */
export default class Expression extends RnObject {
  private __renderPasses: RenderPass[] = [];

  constructor() {
    super();
  }

  /**
   * Add render passes to the end of this expression.
   */
  addRenderPasses(renderPasses: RenderPass[]) {
    for (const renderPass of renderPasses) {
      this.__renderPasses.push(renderPass);
    }
  }

  /**
   * Clear render passes of this expression.
   */
  clearRenderPasses() {
    this.__renderPasses.length = 0;
  }

  /**
   * Gets the list of render passes of this expression.
   */
  get renderPasses(): RenderPass[] {
    return this.__renderPasses;
  }

  setViewport(viewport: IVector4) {
    for (const renderPass of this.__renderPasses) {
      renderPass.setViewport(viewport);
    }
  }
}
