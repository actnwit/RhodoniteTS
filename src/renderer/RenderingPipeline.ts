import Primitive from "../geometry/Primitive";
import MeshRendererComponent from "../components/MeshRendererComponent";

export default interface RenderingPipeline {
  common_prerender(): CGAPIResourceHandle;
  common_render(): void;
}
