import { FileTypeEnum } from '../../foundation/definitions/FileType';
export declare function detectFormatByArrayBuffers(files: {
    [s: string]: ArrayBuffer;
}): FileTypeEnum;
export declare function detectFormatByUri(uri: string): string;
