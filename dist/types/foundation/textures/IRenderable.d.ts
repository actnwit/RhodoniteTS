import { CGAPIResourceHandle, Size } from "../../types/CommonTypes";
import FrameBuffer from "../renderer/FrameBuffer";
export default interface IRenderable {
    width: Size;
    height: Size;
    cgApiResourceUid: CGAPIResourceHandle;
    destroy3DAPIResources(): boolean;
    fbo?: FrameBuffer;
}
