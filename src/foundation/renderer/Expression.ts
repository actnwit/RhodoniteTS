import RnObject from "../core/RnObject";
import Entity from "../core/Entity";
import SceneGraphComponent from "../components/SceneGraphComponent";

import RenderPass from "./RenderPass";
import Vector4 from "../math/Vector4";

export default class Expression extends RnObject {
  private __renderPasses: RenderPass[] = [];

  constructor() {
    super();
  }

  addRenderPasses(renderPasses: RenderPass[]) {
    for (let renderPass of renderPasses) {
      this.__renderPasses.push(renderPass);
    }
  }

  clearRenderPasses() {
    this.__renderPasses.length = 0;
  }

  get renderPasses(): RenderPass[] {
    return this.__renderPasses;
  }

}
