import { Size, Index } from "../../types/CommonTypes";
export default class TextureDataFloat {
    private __data;
    private __channels;
    private __width;
    private __height;
    constructor(width: number, height: number, channels: number);
    resize(width: number, height: number, channels: number): void;
    setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number): void;
    get width(): number;
    get height(): number;
    get data(): Float32Array;
    getPixel(x: Index, y: Index, channelIdx: Index): number;
    getPixelAs(x: Index, y: Index, channels: Size, typeClass: any): any;
    getPixelAsArray(x: Index, y: Index): number[];
    initialize(width: number, height: number, channels: number): void;
    static transfer(source: any, length: number): ArrayBuffer;
}
