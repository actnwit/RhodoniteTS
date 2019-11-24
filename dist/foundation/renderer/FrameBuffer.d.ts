import RnObject from "../core/RnObject";
import IRenderable from "../textures/IRenderable";
import { RenderBufferTargetEnum } from "../definitions/RenderBufferTarget";
import { Index, Size, CGAPIResourceHandle } from "../../types/CommonTypes";
export default class FrameBuffer extends RnObject {
    private __entities?;
    private __colorAttachments;
    private __depthAttachment?;
    private __stencilAttachment?;
    private __depthStencilAttachment?;
    cgApiResourceUid: CGAPIResourceHandle;
    width: Size;
    height: Size;
    private __colorAttachmentMap;
    constructor();
    get colorAttachmentsRenderBufferTargets(): RenderBufferTargetEnum[];
    get colorAttachments(): IRenderable[];
    get depthAttachment(): IRenderable | undefined;
    get stencilAttachement(): IRenderable | undefined;
    get depthStancilAttachment(): IRenderable | undefined;
    create(width: Size, height: Size): number;
    get framebufferUID(): number;
    setColorAttachmentAt(index: Index, renderable: IRenderable): boolean;
    setDepthAttachment(renderable: IRenderable): boolean;
    setStencilAttachment(renderable: IRenderable): boolean;
    setDepthStencilAttachment(renderable: IRenderable): boolean;
    destroy3DAPIResources(): void;
    whichColorAttachment(renderable: IRenderable): number;
}
