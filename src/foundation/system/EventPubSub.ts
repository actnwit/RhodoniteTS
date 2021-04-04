import {Is} from '../misc/Is';
import {nullishToEmptyArray} from '../misc/MiscUtil';

export type EventType = string | symbol;
export type EventSubscriberIndex = number;
type EventHandler = (event: unknown) => void;

export interface IEventPubSub {
  subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex;
  unsubscribe(type: EventType, handler: EventHandler): void;
  unsubscribeAll(type: EventType, handler: EventHandler): void;
  publish(type: EventType, event?: any): void;
}

export class EventPubSub implements IEventPubSub {
  private static __subscriberMap: Map<EventType, EventHandler[]> = new Map();

  subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex {
    let subscribers = EventPubSub.__subscriberMap.get(type);
    if (Is.not.exist(subscribers)) {
      EventPubSub.__subscriberMap.set(type, []);
      subscribers = EventPubSub.__subscriberMap.get(type);
    }

    return subscribers!.push(handler) - 1;
  }

  unsubscribe(type: EventType, index: EventSubscriberIndex): void {
    const subscribers = nullishToEmptyArray(
      EventPubSub.__subscriberMap.get(type)
    );
    delete subscribers[index];
  }

  unsubscribeAll(type: EventType): void {
    EventPubSub.__subscriberMap.delete(type);
  }

  publishAsync(type: EventType, event?: any): void {
    const subscribers = nullishToEmptyArray(
      EventPubSub.__subscriberMap.get(type)
    );
    for (const sub of subscribers) {
      setTimeout(sub.bind(this, event), 0);
    }
  }

  publishSync(type: EventType, event?: any): void {
    const subscribers = nullishToEmptyArray(
      EventPubSub.__subscriberMap.get(type)
    );
    for (const sub of subscribers) {
      sub(event);
    }
  }
}
