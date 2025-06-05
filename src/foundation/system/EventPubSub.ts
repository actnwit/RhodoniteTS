import { Is } from '../misc/Is';
import { nullishToEmptyArray } from '../misc/MiscUtil';

/** Event type that can be either a string or symbol */
export type EventType = string | symbol;

/** Index of an event subscriber in the subscribers array */
export type EventSubscriberIndex = number;

/** Number of subscribers that were called during event publishing */
export type CalledSubscriberNumber = number;

/** Event handler function that processes events */
export type EventHandler = (event: unknown) => void;

/**
 * Interface for event publish-subscribe pattern implementation
 * Provides methods for subscribing to events, unsubscribing, and publishing events
 */
export interface IEventPubSub {
  /**
   * Subscribe to an event type with a handler function
   * @param type - The event type to subscribe to
   * @param handler - The function to call when the event is published
   * @returns The index of the subscriber for later unsubscription
   */
  subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex;

  /**
   * Unsubscribe a specific handler by its index
   * @param type - The event type to unsubscribe from
   * @param index - The index of the subscriber to remove
   */
  unsubscribe(type: EventType, index: EventSubscriberIndex): void;

  /**
   * Unsubscribe all handlers for a specific event type
   * @param type - The event type to unsubscribe all handlers from
   * @param handler - The handler function to remove (all instances)
   */
  unsubscribeAll(type: EventType, handler: EventHandler): void;

  /**
   * Publish an event asynchronously to all subscribers
   * @param type - The event type to publish
   * @param event - Optional event data to pass to handlers
   * @returns The number of subscribers that were called
   */
  publishAsync(type: EventType, event?: any): CalledSubscriberNumber;

  /**
   * Publish an event synchronously to all subscribers
   * @param type - The event type to publish
   * @param event - Optional event data to pass to handlers
   * @returns The number of subscribers that were called
   */
  publishSync(type: EventType, event?: any): CalledSubscriberNumber;
}

/**
 * Event publish-subscribe system implementation
 *
 * This class provides a centralized event system where components can subscribe to events
 * and publish events to notify subscribers. It supports both synchronous and asynchronous
 * event publishing patterns.
 *
 * @example
 * ```typescript
 * const eventSystem = new EventPubSub();
 *
 * // Subscribe to an event
 * const index = eventSystem.subscribe('user-login', (userData) => {
 *   console.log('User logged in:', userData);
 * });
 *
 * // Publish an event
 * eventSystem.publishSync('user-login', { userId: 123, name: 'John' });
 *
 * // Unsubscribe
 * eventSystem.unsubscribe('user-login', index);
 * ```
 */
export class EventPubSub implements IEventPubSub {
  /** Map storing event types and their corresponding subscriber arrays */
  private __subscriberMap: Map<EventType, EventHandler[]> = new Map();

  /**
   * Subscribe to an event type with a handler function
   *
   * @param type - The event type to subscribe to (string or symbol)
   * @param handler - The callback function to execute when the event is published
   * @returns The index of the subscriber in the array, used for unsubscription
   *
   * @example
   * ```typescript
   * const index = eventPubSub.subscribe('data-updated', (data) => {
   *   console.log('Data changed:', data);
   * });
   * ```
   */
  subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex {
    let subscribers = this.__subscriberMap.get(type);
    if (Is.not.exist(subscribers)) {
      this.__subscriberMap.set(type, []);
      subscribers = this.__subscriberMap.get(type);
    }

    return subscribers!.push(handler) - 1;
  }

  /**
   * Unsubscribe a specific handler by its index
   *
   * @param type - The event type to unsubscribe from
   * @param index - The index of the subscriber to remove (returned from subscribe)
   *
   * @example
   * ```typescript
   * const index = eventPubSub.subscribe('my-event', handler);
   * eventPubSub.unsubscribe('my-event', index);
   * ```
   */
  unsubscribe(type: EventType, index: EventSubscriberIndex): void {
    const subscribers = this.__subscriberMap.get(type);
    // eslint-disable-next-line eqeqeq
    if (subscribers == null) {
      return;
    }
    subscribers.splice(index, 1);
  }

  /**
   * Remove all subscribers for a specific event type
   *
   * @param type - The event type to clear all subscribers from
   *
   * @example
   * ```typescript
   * eventPubSub.unsubscribeAll('my-event');
   * ```
   */
  unsubscribeAll(type: EventType): void {
    this.__subscriberMap.delete(type);
  }

  /**
   * Publish an event asynchronously to all subscribers
   *
   * Each subscriber is called asynchronously using setTimeout, allowing the current
   * execution context to complete before handlers are invoked. This prevents blocking
   * the main thread and allows for better performance in scenarios with many subscribers.
   *
   * @param type - The event type to publish
   * @param event - Optional event data to pass to all handlers
   * @returns The number of subscribers that were scheduled to be called
   *
   * @example
   * ```typescript
   * const count = eventPubSub.publishAsync('user-action', { action: 'click', target: 'button' });
   * console.log(`Scheduled ${count} handlers`);
   * ```
   */
  publishAsync(type: EventType, event?: any): CalledSubscriberNumber {
    let count = 0;
    const subscribers = nullishToEmptyArray(this.__subscriberMap.get(type));
    for (const sub of subscribers) {
      setTimeout(sub.bind(this, event), 0);
      count++;
    }
    return count;
  }

  /**
   * Publish an event synchronously to all subscribers
   *
   * All subscribers are called immediately in the order they were registered.
   * This method blocks until all handlers have completed execution.
   *
   * @param type - The event type to publish
   * @param event - Optional event data to pass to all handlers
   * @returns The number of subscribers that were called
   *
   * @example
   * ```typescript
   * const count = eventPubSub.publishSync('data-changed', newData);
   * console.log(`Called ${count} handlers synchronously`);
   * ```
   */
  publishSync(type: EventType, event?: any): CalledSubscriberNumber {
    let count = 0;
    const subscribers = nullishToEmptyArray(this.__subscriberMap.get(type));
    for (const sub of subscribers) {
      // Logger.log(sub);
      sub(event);
      count++;
    }
    return count;
  }
}
