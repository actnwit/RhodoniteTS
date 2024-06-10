import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionTypeEnum } from '../../definitions/CompositionType';

export class Socket<N extends CompositionTypeEnum, T extends ComponentTypeEnum> {
  constructor(
    public readonly name: string,
    public readonly compositionType: N,
    public readonly componentType: T
  ) {}
}
