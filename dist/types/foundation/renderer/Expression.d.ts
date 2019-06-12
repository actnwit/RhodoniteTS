import RnObject from "../core/RnObject";
import RenderPass from "./RenderPass";
export default class Expression extends RnObject {
    private __renderPasses;
    constructor();
    addRenderPasses(renderPasses: RenderPass[]): void;
    clearRenderPasses(): void;
    readonly renderPasses: RenderPass[];
}
