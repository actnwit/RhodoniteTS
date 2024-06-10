import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionTypeEnum } from '../../definitions/CompositionType';

export class Socket<
  Name extends string,
  N extends CompositionTypeEnum,
  T extends ComponentTypeEnum
> {
  constructor(
    public readonly name: Name,
    public readonly compositionType: N,
    public readonly componentType: T
  ) {}
}
