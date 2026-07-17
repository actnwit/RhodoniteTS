import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { Engine } from '../../system/Engine';
import { EventPubSub, type EventSubscriberIndex } from '../../system/EventPubSub';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export type TriggerEventType = 'enter' | 'stay' | 'exit';

export interface TriggerEvent {
  type: TriggerEventType;
  triggerComponent: TriggerComponent;
  triggerEntity: IEntity;
  otherEntity: IEntity;
  sensorBindingId: number;
  otherBindingId?: number;
}

type ActiveOverlap = {
  otherEntity: IEntity;
  pairs: Map<string, { sensorEntityUid: EntityUID; sensorBindingId: number; otherBindingId?: number }>;
  enteredThisStep: boolean;
};

/** Groups one or more physics sensors into a logical trigger volume. */
export class TriggerComponent extends Component {
  private static __sensorOwners = new Map<string, TriggerComponent>();
  private static __components = new Set<TriggerComponent>();
  private __pubsub = new EventPubSub();
  private __sensorKeys = new Set<string>();
  private __activeOverlaps = new Map<EntityUID, ActiveOverlap>();

  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.moveStageTo(ProcessStage.Logic);
    TriggerComponent.__components.add(this);
  }

  static get componentTID() {
    return WellKnownComponentTIDs.TriggerComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.TriggerComponentTID;
  }

  subscribe(type: TriggerEventType, handler: (event: TriggerEvent) => void): EventSubscriberIndex {
    return this.__pubsub.subscribe(type, handler as (event: unknown) => void);
  }

  unsubscribe(type: TriggerEventType, index: EventSubscriberIndex): void {
    this.__pubsub.unsubscribe(type, index);
  }

  get activeOverlapCount(): number {
    return this.__activeOverlaps.size;
  }

  /** @internal Associates a PhysicsComponent binding with this logical trigger. */
  _registerSensorBinding(physicsEntityUid: EntityUID, bindingId: number): void {
    const key = TriggerComponent.__sensorKey(physicsEntityUid, bindingId);
    const existing = TriggerComponent.__sensorOwners.get(key);
    if (existing != null && existing !== this) {
      throw new Error(`Physics sensor binding ${key} is already owned by another TriggerComponent.`);
    }
    TriggerComponent.__sensorOwners.set(key, this);
    this.__sensorKeys.add(key);
  }

  /** @internal Removes ownership when a sensor binding is permanently deleted. */
  static _unregisterSensorBinding(physicsEntityUid: EntityUID, sensorBindingId: number): void {
    const key = this.__sensorKey(physicsEntityUid, sensorBindingId);
    const trigger = this.__sensorOwners.get(key);
    if (trigger == null) {
      return;
    }
    this._deactivateSensorBinding(physicsEntityUid, sensorBindingId);
    this.__sensorOwners.delete(key);
    trigger.__sensorKeys.delete(key);
  }

  /** @internal Called by the Rapier event bridge. */
  static _processOverlap(
    sensorEntityUid: EntityUID,
    sensorBindingId: number,
    otherEntity: IEntity,
    otherBindingId: number | undefined,
    started: boolean
  ): void {
    const trigger = this.__sensorOwners.get(this.__sensorKey(sensorEntityUid, sensorBindingId));
    if (trigger == null || otherEntity.entityUID === trigger.entity.entityUID) {
      return;
    }
    const pairKey = `${sensorEntityUid}:${sensorBindingId}:${otherBindingId ?? 'external'}`;
    let overlap = trigger.__activeOverlaps.get(otherEntity.entityUID);
    if (started) {
      if (overlap == null) {
        overlap = { otherEntity, pairs: new Map(), enteredThisStep: true };
        trigger.__activeOverlaps.set(otherEntity.entityUID, overlap);
      }
      const wasEmpty = overlap.pairs.size === 0;
      overlap.pairs.set(pairKey, { sensorEntityUid, sensorBindingId, otherBindingId });
      if (wasEmpty) {
        trigger.__publish('enter', overlap.otherEntity, sensorBindingId, otherBindingId);
      }
    } else if (overlap != null) {
      overlap.pairs.delete(pairKey);
      if (overlap.pairs.size === 0) {
        trigger.__activeOverlaps.delete(otherEntity.entityUID);
        trigger.__publish('exit', overlap.otherEntity, sensorBindingId, otherBindingId);
      }
    }
  }

  /** @internal Emits one Stay event per active logical overlap after each physics step. */
  static _publishStayEvents(): void {
    for (const trigger of this.__components) {
      for (const overlap of trigger.__activeOverlaps.values()) {
        if (overlap.enteredThisStep) {
          overlap.enteredThisStep = false;
          continue;
        }
        const pair = overlap.pairs.values().next().value;
        if (pair != null) {
          trigger.__publish('stay', overlap.otherEntity, pair.sensorBindingId, pair.otherBindingId);
        }
      }
    }
  }

  /** @internal Ends overlaps owned by a sensor collider that is being removed or rebuilt. */
  static _deactivateSensorBinding(physicsEntityUid: EntityUID, sensorBindingId: number): void {
    const trigger = this.__sensorOwners.get(this.__sensorKey(physicsEntityUid, sensorBindingId));
    if (trigger == null) return;
    for (const [otherEntityUid, overlap] of [...trigger.__activeOverlaps]) {
      const removed = [...overlap.pairs.entries()].filter(
        ([, pair]) => pair.sensorEntityUid === physicsEntityUid && pair.sensorBindingId === sensorBindingId
      );
      for (const [pairKey] of removed) overlap.pairs.delete(pairKey);
      if (removed.length > 0 && overlap.pairs.size === 0) {
        trigger.__activeOverlaps.delete(otherEntityUid);
        const pair = removed[0][1];
        trigger.__publish('exit', overlap.otherEntity, pair.sensorBindingId, pair.otherBindingId);
      }
    }
  }

  private __publish(type: TriggerEventType, otherEntity: IEntity, sensorBindingId: number, otherBindingId?: number) {
    this.__pubsub.publishSync(type, {
      type,
      triggerComponent: this,
      triggerEntity: this.entity,
      otherEntity,
      sensorBindingId,
      otherBindingId,
    } satisfies TriggerEvent);
  }

  private static __sensorKey(entityUid: EntityUID, bindingId: number): string {
    return `${entityUid}:${bindingId}`;
  }

  _destroy(): void {
    for (const key of this.__sensorKeys) {
      TriggerComponent.__sensorOwners.delete(key);
    }
    this.__sensorKeys.clear();
    this.__activeOverlaps.clear();
    TriggerComponent.__components.delete(this);
    super._destroy();
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class TriggerEntity extends (base.constructor as any) {
      getTrigger() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.TriggerComponentTID) as TriggerComponent;
      }
    }
    applyMixins(base, TriggerEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
