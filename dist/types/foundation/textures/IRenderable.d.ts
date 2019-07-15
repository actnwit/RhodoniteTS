import { CGAPIResourceHandle, Size } from "../../types/CommonTypes";
export default interface IRenderable {
    width: Size;
    height: Size;
    cgApiResourceUid: CGAPIResourceHandle;
    destroy3DAPIResources(): boolean;
}
