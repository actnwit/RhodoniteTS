import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import SceneGraphComponent from "../components/SceneGraphComponent";

import RenderPass from "./RenderPass";

export default class Expression extends RnObject {
  private __renderPasses: RenderPass[] = [];

  constructor() {
    super();
  }

  addRenderPasses(renderPasses: RenderPass[]) {
    this.__renderPasses = this.__renderPasses.concat(renderPasses);
  }

  clearRenderPasses() {
    this.__renderPasses.length = 0;
  }

  get renderPasses(): RenderPass[] {
    return this.__renderPasses;
  }

}
