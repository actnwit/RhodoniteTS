import { EnumIO } from "../misc/EnumIO";
export interface RenderBufferTargetEnum extends EnumIO {
}
declare function from(index: number): RenderBufferTargetEnum;
export declare const RenderBufferTarget: Readonly<{
    None: RenderBufferTargetEnum;
    Back: RenderBufferTargetEnum;
    ColorAttachment0: RenderBufferTargetEnum;
    ColorAttachment1: RenderBufferTargetEnum;
    ColorAttachment2: RenderBufferTargetEnum;
    ColorAttachment3: RenderBufferTargetEnum;
    ColorAttachment4: RenderBufferTargetEnum;
    ColorAttachment5: RenderBufferTargetEnum;
    ColorAttachment6: RenderBufferTargetEnum;
    ColorAttachment7: RenderBufferTargetEnum;
    ColorAttachment8: RenderBufferTargetEnum;
    ColorAttachment9: RenderBufferTargetEnum;
    ColorAttachment10: RenderBufferTargetEnum;
    ColorAttachment11: RenderBufferTargetEnum;
    ColorAttachment12: RenderBufferTargetEnum;
    ColorAttachment13: RenderBufferTargetEnum;
    ColorAttachment14: RenderBufferTargetEnum;
    ColorAttachment15: RenderBufferTargetEnum;
    from: typeof from;
}>;
export {};
