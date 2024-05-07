import { EnumIO } from '../misc/EnumIO';
export type VisibilityEnum = EnumIO;
declare function from(index: number): VisibilityEnum;
declare function fromString(str: string): VisibilityEnum;
export declare const Visibility: Readonly<{
    Visible: EnumIO;
    Invisible: EnumIO;
    Neutral: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
