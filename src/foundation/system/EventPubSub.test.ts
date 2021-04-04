import {EventPubSub} from './EventPubSub';

test('Basic Usage', () => {
  const pubsub = new EventPubSub();

  const subscriber = (event: unknown) => {
    expect(event).toEqual(true);
  };
  pubsub.subscribe('init', subscriber);

  const subN = pubsub.publishAsync('init', true);
  expect(subN).toEqual(1);
});

test('Unsubscribe', () => {
  const pubsub = new EventPubSub();

  const subscriber = (event: unknown) => {
    expect(event).toEqual(true);
  };

  const index = pubsub.subscribe('init', subscriber);
  const index2 = pubsub.subscribe('init', subscriber);

  {
    const subN = pubsub.publishSync('init', true);
    expect(subN).toEqual(2);
  }

  {
    pubsub.unsubscribe('init', index);
    const subN = pubsub.publishSync('init', true);
    expect(subN).toEqual(1);
  }
});

test('UnsubscribeAll', () => {
  const pubsub = new EventPubSub();

  const subscriber = (event: unknown) => {
    expect(event).toEqual(true);
  };

  pubsub.subscribe('init', subscriber);
  pubsub.subscribe('init', subscriber);
  pubsub.subscribe('update', subscriber);
  pubsub.subscribe('init', subscriber);

  {
    const subInitN = pubsub.publishSync('init', true);
    expect(subInitN).toEqual(3);
  }

  {
    pubsub.unsubscribeAll('init');
    const subInitN = pubsub.publishSync('init', true);
    const subUpdateN = pubsub.publishSync('update', true);
    expect(subInitN).toEqual(0);
    expect(subUpdateN).toEqual(1);
  }
});
