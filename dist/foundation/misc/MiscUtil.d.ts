import { Byte } from "../../commontypes/CommonTypes";
export declare const MiscUtil: Readonly<{
    isMobile: () => boolean;
    isIOS: () => boolean;
    preventDefaultForDesktopOnly: (e: Event) => void;
    isObject: (o: any) => boolean;
    fillTemplate: (templateString: string, templateVars: string) => any;
    isNode: () => boolean;
    concatArrayBuffers: (segments: ArrayBuffer[], sizes: Byte[], paddingSize: Byte) => ArrayBufferLike;
}>;
