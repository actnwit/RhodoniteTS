import RnObject from "../core/RnObject";
import IRenderable from "../textures/IRenderable";
import { RenderBufferTargetEnum } from "../definitions/RenderBufferTarget";
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
    readonly colorAttachmentsRenderBufferTargets: RenderBufferTargetEnum[];
    readonly colorAttachments: IRenderable[];
    readonly depthAttachment: IRenderable | undefined;
    readonly stencilAttachement: IRenderable | undefined;
    readonly depthStancilAttachment: IRenderable | undefined;
    create(width: Size, height: Size): number;
    readonly framebufferUID: number;
    discard(): void;
    setColorAttachmentAt(index: Index, renderable: IRenderable): boolean;
    setDepthAttachment(renderable: IRenderable): boolean;
    setStencilAttachment(renderable: IRenderable): boolean;
    setDepthStencilAttachment(renderable: IRenderable): boolean;
}
