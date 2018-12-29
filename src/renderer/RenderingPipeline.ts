import Primitive from "../geometry/Primitive";
import MeshRendererComponent from "../components/MeshRendererComponent";

export default interface RenderingPipeline {
  common_$load(): void;
  common_$prerender(): CGAPIResourceHandle;
  common_$render(): void;
}
