import RnObject from "../core/RnObject";
import IRenderable from "./IRenderable";
import { TextureParameterEnum } from "../definitions/TextureParameter";
export default class RenderBuffer extends RnObject implements IRenderable {
    width: number;
    height: number;
    cgApiResourceUid: CGAPIResourceHandle;
    constructor();
    create(width: Size, height: Size, internalFormat: TextureParameterEnum): void;
    discard(): void;
}
