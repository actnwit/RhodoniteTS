import { CGAPIResourceHandle, Size } from '../../types/CommonTypes';
import { FrameBuffer } from '../renderer/FrameBuffer';
export interface IRenderable {
    width: Size;
    height: Size;
    _textureResourceUid: CGAPIResourceHandle;
    _textureViewResourceUid: CGAPIResourceHandle;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
    fbo?: FrameBuffer;
}
