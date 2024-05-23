/// <reference path="../../../vendor/effekseer.d.ts" />
/// <reference types="node" />
import { Component } from '../foundation/core/Component';
import { EntityRepository } from '../foundation/core/EntityRepository';
import { ComponentTID, EntityUID, ComponentSID, Second } from '../types/CommonTypes';
import { IVector3 } from '../foundation/math/IVector';
import type { Unzip } from 'zlib';
import { IEntity } from '../foundation/core/Entity';
import { ComponentToComponentMethods } from '../foundation/components/ComponentTypes';
import { RenderPass } from '../foundation/renderer/RenderPass';
export declare class EffekseerComponent extends Component {
    static readonly ANIMATION_EVENT_PLAY = 0;
    static readonly ANIMATION_EVENT_PAUSE = 1;
    static readonly ANIMATION_EVENT_END = 2;
    static Unzip?: Unzip;
    uri?: string;
    arrayBuffer?: ArrayBuffer;
    type: string;
    playJustAfterLoaded: boolean;
    isLoop: boolean;
    isPause: boolean;
    static wasmModuleUri: undefined;
    randomSeed: number;
    isImageLoadWithCredential: boolean;
    private __effect?;
    private __context?;
    private __handle?;
    private __speed;
    private __timer?;
    private __isInitialized;
    private static __tmp_identityMatrix_0;
    private static __tmp_identityMatrix_1;
    private isLoadEffect;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    cancelLoop(): void;
    isPlay(): boolean;
    play(): boolean;
    continue(): void;
    pause(): void;
    stop(): void;
    set playSpeed(val: number);
    get playSpeed(): number;
    setTime(targetSec: Second): boolean;
    set translate(vec: IVector3);
    get translate(): IVector3;
    set rotate(vec: IVector3);
    get rotate(): IVector3;
    set scale(vec: IVector3);
    get scale(): IVector3;
    private __createEffekseerContext;
    $load(): void;
    $logic(): void;
    _destroy(): void;
    $render(): void;
    static sort_$render(renderPass: RenderPass): ComponentSID[];
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
export interface IEffekseerEntityMethods {
    getEffekseer(): EffekseerComponent;
}
