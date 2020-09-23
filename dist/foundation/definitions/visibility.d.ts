import { EnumIO } from "../misc/EnumIO";
export interface VisibilityEnum extends EnumIO {
}
declare function from(index: number): VisibilityEnum;
declare function fromString(str: string): VisibilityEnum;
export declare const Visibility: Readonly<{
    Visible: VisibilityEnum;
    Invisible: VisibilityEnum;
    Neutral: VisibilityEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
