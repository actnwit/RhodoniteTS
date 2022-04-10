import { Component } from '../core/Component';
import { Entity } from '../core/Entity';
export const GetComponentFromEntities = Symbol();

const getComponentFromEntitiesStr = 'getComponentFromEntities';

function getComponentFromEntities<T extends typeof Component>(
  this: EnhancedArrayMethods,
  ComponentClass: T
): InstanceType<T>[] {
  const that = this.__raw as Array<Entity>;
  const components: InstanceType<T>[] = [];
  that.forEach((entity: Entity) => {
    const component = entity.getComponentByComponentTID(
      ComponentClass.componentTID
    ) as InstanceType<T>;
    if (component != null) {
      components.push(component);
    }
  });
  return components;
}

export interface ArrayAsRn<T> {
  Rn: EnhancedArrayMethods & IEnhancedArrayMethods;
}

export interface IEnhancedArrayMethods {
  getComponentFromEntities: typeof getComponentFromEntities;
}

class EnhancedArrayMethods {
  constructor(public __raw: unknown[]) {}
}

const enhanceInner = () => {
  Object.defineProperty(
    EnhancedArrayMethods.prototype,
    getComponentFromEntitiesStr,
    {
      enumerable: false,
      writable: false,
      configurable: true,
      value: getComponentFromEntities,
    }
  );
};

enhanceInner();

export const enhanceArray = () => {
  Object.defineProperty(Array.prototype, 'Rn', {
    enumerable: false,
    configurable: false,
    get<T>(): ArrayAsRn<T> {
      const ret = new EnhancedArrayMethods(this as unknown[]);
      return ret as unknown as ArrayAsRn<T>;
    },
  });
};
