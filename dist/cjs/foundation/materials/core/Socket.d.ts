import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
export declare class Socket<Name extends string, N extends CompositionTypeEnum, T extends ComponentTypeEnum> {
    readonly name: Name;
    readonly compositionType: N;
    readonly componentType: T;
    constructor(name: Name, compositionType: N, componentType: T);
}
