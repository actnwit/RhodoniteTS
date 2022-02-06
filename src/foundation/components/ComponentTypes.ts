import {MixinBase} from '../../types/TypeGenerators';
import Component from '../core/Component';
import Entity from '../core/Entity';

export type ComponentMixinFunction = <EntityBaseClass extends typeof Entity>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) => {
  entityClass: MixinBase;
  components: typeof Component[];
};
