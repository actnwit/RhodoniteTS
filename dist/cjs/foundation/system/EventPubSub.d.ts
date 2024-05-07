export type EventType = string | symbol;
export type EventSubscriberIndex = number;
export type CalledSubscriberNumber = number;
export type EventHandler = (event: unknown) => void;
export interface IEventPubSub {
    subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex;
    unsubscribe(type: EventType, index: EventSubscriberIndex): void;
    unsubscribeAll(type: EventType, handler: EventHandler): void;
    publishAsync(type: EventType, event?: any): CalledSubscriberNumber;
    publishSync(type: EventType, event?: any): CalledSubscriberNumber;
}
export declare class EventPubSub implements IEventPubSub {
    private __subscriberMap;
    subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex;
    unsubscribe(type: EventType, index: EventSubscriberIndex): void;
    unsubscribeAll(type: EventType): void;
    publishAsync(type: EventType, event?: any): CalledSubscriberNumber;
    publishSync(type: EventType, event?: any): CalledSubscriberNumber;
}
