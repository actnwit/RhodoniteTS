import { EnumIO } from "../misc/EnumIO";
export interface ProcessStageEnum extends EnumIO {
    getMethodName(): string;
}
declare function from(index: number): ProcessStageEnum;
export declare const ProcessStage: Readonly<{
    Unknown: ProcessStageEnum;
    Create: ProcessStageEnum;
    Load: ProcessStageEnum;
    Mount: ProcessStageEnum;
    Logic: ProcessStageEnum;
    PreRender: ProcessStageEnum;
    Render: ProcessStageEnum;
    Unmount: ProcessStageEnum;
    Discard: ProcessStageEnum;
    from: typeof from;
}>;
export {};
