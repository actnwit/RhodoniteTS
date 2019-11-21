import RnObject from "../core/RnObject";
import RenderPass from "./RenderPass";

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
    for (let renderPass of renderPasses) {
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

}
