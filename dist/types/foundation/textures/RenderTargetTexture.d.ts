import AbstractTexture from "./AbstractTexture";
import { TextureParameterEnum } from "../definitions/TextureParameter";
import { PixelFormatEnum } from "../definitions/PixelFormat";
import IRenderable from "./IRenderable";
import { ComponentTypeEnum } from "../main";
import { Size } from "../../types/CommonTypes";
export default class RenderTargetTexture extends AbstractTexture implements IRenderable {
    private __fbo;
    constructor();
    create({ width, height, level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT }: {
        width: Size;
        height: Size;
        level: number;
        internalFormat: PixelFormatEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
    }): void;
    fbo: any;
    destroy3DAPIResources(): boolean;
}
