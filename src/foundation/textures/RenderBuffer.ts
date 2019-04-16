import RnObject from "../core/RnObject";
import IRenderable from "./IRenderable";

export default class RenderBuffer extends RnObject implements IRenderable {
  width: number = 0;
  height: number = 0;

  constructor() {
    super();
  }
}
