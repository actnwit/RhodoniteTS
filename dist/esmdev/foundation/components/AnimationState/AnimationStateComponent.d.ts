import { AnimationTrackName } from '../../../types/AnimationTypes';
import { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import { IEntity } from '../../core/Entity';
import { EntityRepository } from '../../core/EntityRepository';
import { IAnimationStateEntity } from '../../helpers/EntityHelper';
import { ComponentToComponentMethods } from '../ComponentTypes';
export declare class AnimationStateComponent extends Component {
    private __activeAnimationTrack;
    private __interpolationStartTime;
    private __blendingDuration;
    private __isBlending;
    private __blendingRatio;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get isBlending(): boolean;
    get blendingRatio(): number;
    $logic(): void;
    setFirstActiveAnimationTrack(trackName: AnimationTrackName): void;
    forceTransitionTo(trackName: AnimationTrackName, duration: number): void;
    setActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    setUseGlobalTime(flg: boolean): void;
    setIsLoop(flg: boolean): void;
    setTime(time: number): void;
    setAnimationBlendingRatio(ratio: number): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IAnimationStateEntity;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
