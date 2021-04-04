import {Is} from '../misc/Is';
import {nullishToEmptyArray} from '../misc/MiscUtil';

export type EventType = string | symbol;
export type EventSubscriberIndex = number;
export type CalledSubscriberNumber = number;
type EventHandler = (event: unknown) => void;

export interface IEventPubSub {
  subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex;
  unsubscribe(type: EventType, index: EventSubscriberIndex): void;
  unsubscribeAll(type: EventType, handler: EventHandler): void;
  publishAsync(type: EventType, event?: any): CalledSubscriberNumber;
  publishSync(type: EventType, event?: any): CalledSubscriberNumber;
}

export class EventPubSub implements IEventPubSub {
  private __subscriberMap: Map<EventType, EventHandler[]> = new Map();

  subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex {
    let subscribers = this.__subscriberMap.get(type);
    if (Is.not.exist(subscribers)) {
      this.__subscriberMap.set(type, []);
      subscribers = this.__subscriberMap.get(type);
    }

    return subscribers!.push(handler) - 1;
  }

  unsubscribe(type: EventType, index: EventSubscriberIndex): void {
    const subscribers = this.__subscriberMap.get(type);
    // eslint-disable-next-line eqeqeq
    if (subscribers == null) {
      return;
    }
    subscribers.splice(index, 1);
  }

  unsubscribeAll(type: EventType): void {
    this.__subscriberMap.delete(type);
  }

  publishAsync(type: EventType, event?: any): CalledSubscriberNumber {
    let count = 0;
    const subscribers = nullishToEmptyArray(this.__subscriberMap.get(type));
    for (const sub of subscribers) {
      setTimeout(sub.bind(this, event), 0);
      count++;
    }
    return count;
  }

  publishSync(type: EventType, event?: any): CalledSubscriberNumber {
    let count = 0;
    const subscribers = nullishToEmptyArray(this.__subscriberMap.get(type));
    for (const sub of subscribers) {
      console.log(sub);
      sub(event);
      count++;
    }
    return count;
  }
}
