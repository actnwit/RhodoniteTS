import { RnObject } from '../core/RnObject';
import { IVector4 } from '../math/IVector';
import { RenderPass } from './RenderPass';
/**
 * Expression specifies the order of render passes on rendering process.
 */
export declare class Expression extends RnObject {
    private __renderPasses;
    constructor();
    clone(): Expression;
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
    setViewport(viewport: IVector4): void;
}
