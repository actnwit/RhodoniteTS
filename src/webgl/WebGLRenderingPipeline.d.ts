import RenderingPipeline from "../foundation/renderer/RenderingPipeline";
import { ProcessApproachEnum } from "../foundation/definitions/ProcessApproach";
export default class WebGLRenderingPipeline implements RenderingPipeline {
    private static __instance;
    private __webglResourceRepository;
    private __componentRepository;
    private __instanceIDBufferUid;
    private __webGLStrategy?;
    private __instanceIdAccessor?;
    private constructor();
    static getInstance(): WebGLRenderingPipeline;
    common_$load(processApproach: ProcessApproachEnum): void;
    common_$prerender(): CGAPIResourceHandle;
    private __isReady;
    private __setupInstanceIDBuffer;
    common_$render(): void;
}
