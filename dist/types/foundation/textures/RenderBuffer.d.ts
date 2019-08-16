import RnObject from "../core/RnObject";
import IRenderable from "./IRenderable";
import { TextureParameterEnum } from "../definitions/TextureParameter";
import { Size, CGAPIResourceHandle } from "../../types/CommonTypes";
import FrameBuffer from "../renderer/FrameBuffer";
export default class RenderBuffer extends RnObject implements IRenderable {
    width: number;
    height: number;
    cgApiResourceUid: CGAPIResourceHandle;
    private __fbo?;
    constructor();
    _fbo: FrameBuffer;
    readonly fbo: FrameBuffer | undefined;
    create(width: Size, height: Size, internalFormat: TextureParameterEnum): void;
    destroy3DAPIResources(): boolean;
}
