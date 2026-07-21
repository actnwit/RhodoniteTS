import { expect, test, vi } from 'vitest';
import type { Engine } from '../system/Engine';
import { Time } from './Time';

test('tracks process intervals independently for each Engine', () => {
  const firstEngine = {} as Engine;
  const secondEngine = {} as Engine;
  const baseTime = performance.now();
  const nowSpy = vi
    .spyOn(performance, 'now')
    .mockReturnValueOnce(baseTime - 34)
    .mockReturnValueOnce(baseTime - 33)
    .mockReturnValueOnce(baseTime - 18)
    .mockReturnValueOnce(baseTime - 17);

  try {
    Time._processBegin(firstEngine);
    expect(Time.getIntervalProcessBegin(firstEngine)).toBeCloseTo(1 / 60);

    Time._processBegin(secondEngine);
    expect(Time.getIntervalProcessBegin(secondEngine)).toBeCloseTo(1 / 60);

    Time._processBegin(firstEngine);
    expect(Time.getIntervalProcessBegin(firstEngine)).toBeCloseTo(0.016);

    Time._processBegin(secondEngine);
    expect(Time.getIntervalProcessBegin(secondEngine)).toBeCloseTo(0.016);
  } finally {
    nowSpy.mockRestore();
  }
});
