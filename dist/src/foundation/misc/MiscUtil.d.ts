export declare const MiscUtil: Readonly<{
    isMobile: () => boolean;
    preventDefaultForDesktopOnly: (e: Event) => void;
    isObject: (o: any) => boolean;
    fillTemplate: (templateString: string, templateVars: string) => any;
    isNode: () => boolean;
    concatArrayBuffers: (segments: ArrayBuffer[], sizes: number[], paddingSize: number) => ArrayBuffer | SharedArrayBuffer;
}>;
