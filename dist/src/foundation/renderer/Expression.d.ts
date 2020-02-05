import RnObject from "../core/RnObject";
import RenderPass from "./RenderPass";
/**
 * Expression specifies the order of render passes on rendering process.
 */
export default class Expression extends RnObject {
    private __renderPasses;
    constructor();
    /**
     * Add render passes to the end of this expression.
     */
    addRenderPasses(renderPasses: RenderPass[]): void;
    /**
     * Clear render passes of this expression.
     */
    clearRenderPasses(): void;
    /**
     * Gets the list of render passes of this expression.
     */
    get renderPasses(): RenderPass[];
}
