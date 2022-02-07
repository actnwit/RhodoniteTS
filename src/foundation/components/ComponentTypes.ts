import {MixinBase} from '../../types/TypeGenerators';
import Component from '../core/Component';

export type ComponentMixinFunction = <EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) => {
  entityClass: MixinBase;
  components: typeof Component[];
};
