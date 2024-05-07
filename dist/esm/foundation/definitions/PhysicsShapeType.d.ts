import { EnumIO } from '../misc/EnumIO';
export type PhysicsShapeTypeEnum = EnumIO;
declare function from(index: number): PhysicsShapeTypeEnum;
declare function fromString(str: string): PhysicsShapeTypeEnum;
export declare const PhysicsShape: Readonly<{
    Sphere: EnumIO;
    Box: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
