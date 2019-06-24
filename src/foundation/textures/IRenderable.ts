import { RenderBufferTargetEnum } from "../definitions/RenderBufferTarget";

export default interface IRenderable {
  width: Size,
  height: Size,
  cgApiResourceUid: CGAPIResourceHandle,
  destroy3DAPIResources(): boolean
}
