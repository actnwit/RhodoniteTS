import { ProcessApproachEnum } from "../definitions/ProcessApproach";

export default interface RenderingPipeline {
  common_$load(processApproach: ProcessApproachEnum): void;
  common_$prerender(): CGAPIResourceHandle;
  common_$render(): void;
}
