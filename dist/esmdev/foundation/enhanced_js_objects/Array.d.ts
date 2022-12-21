import { Component } from '../core/Component';
export declare const GetComponentFromEntities: unique symbol;
declare function getComponentFromEntities<T extends typeof Component>(this: EnhancedArrayMethods, ComponentClass: T): InstanceType<T>[];
export interface ArrayAsRn<T> {
    Rn: EnhancedArrayMethods & IEnhancedArrayMethods;
}
export interface IEnhancedArrayMethods {
    getComponentFromEntities: typeof getComponentFromEntities;
}
declare class EnhancedArrayMethods {
    __raw: unknown[];
    constructor(__raw: unknown[]);
}
export declare const enhanceArray: () => void;
export {};
