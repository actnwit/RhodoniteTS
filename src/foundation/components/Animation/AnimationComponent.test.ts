import { afterEach, expect, test, vi } from 'vitest';
import type { AnimationPathName, AnimationSampler, AnimationTrack } from '../../../types';
import { AnimationInterpolation } from '../../definitions/AnimationInterpolation';
import { AnimatedScalar } from '../../math/AnimatedScalar';
import type { Engine } from '../../system/Engine';
import { AnimationComponent } from './AnimationComponent';

const engines: Engine[] = [];

function createSampler(input: number[]): AnimationSampler {
  return {
    input: new Float32Array(input),
    output: new Float32Array(input.length),
    outputComponentN: 1,
    interpolationMethod: AnimationInterpolation.Linear,
  };
}

function createAnimationComponentFixture() {
  const components: AnimationComponent[] = [];
  const engine = {
    componentRepository: {
      getComponentsWithType: () => components,
    },
  } as unknown as Engine;
  engines.push(engine);
  const createComponent = () => {
    const animationTrack: AnimationTrack = new Map();
    const backupTransformAsRest = vi.fn();
    const component = {
      __animationTrack: animationTrack,
      __animationTrackFeatureHashes: new Map(),
      __engine: engine,
      __isAnimating: true,
      __updateAnimationTrackFeatureHashes: vi.fn(),
      getAnimationTrackNames: AnimationComponent.prototype.getAnimationTrackNames,
      entity: {
        getTransform: () => ({ _backupTransformAsRest: backupTransformAsRest }),
      },
    } as unknown as AnimationComponent;
    components.push(component);
    return { animationTrack, backupTransformAsRest, component };
  };
  return { ...createComponent(), components, createComponent, engine };
}

afterEach(() => {
  for (const engine of engines) {
    AnimationComponent._cleanupForEngine(engine);
  }
  engines.length = 0;
});

test('keeps the full track time range when a shorter channel is added later', () => {
  const { component, engine } = createAnimationComponentFixture();
  const trackName = 'Clip';

  AnimationComponent.prototype.setAnimation.call(
    component,
    'translate' as AnimationPathName,
    new AnimatedScalar(new Map([[trackName, createSampler([-1, 0, 2])]]), trackName)
  );
  AnimationComponent.prototype.setAnimation.call(
    component,
    'vrmExpression/happy',
    new AnimatedScalar(new Map([[trackName, createSampler([0, 1])]]), trackName)
  );

  expect(AnimationComponent.getAnimationInfo(engine).get(trackName)).toEqual({
    name: trackName,
    minStartInputTime: -1,
    maxEndInputTime: 2,
  });
});

test('removes empty channels and animation info when a track is reset', () => {
  const { animationTrack, component, engine } = createAnimationComponentFixture();
  const trackName = 'Clip';

  AnimationComponent.prototype.setAnimation.call(
    component,
    'vrmExpression/happy',
    new AnimatedScalar(new Map([[trackName, createSampler([0, 1])]]), trackName)
  );
  AnimationComponent.prototype.resetAnimationTrack.call(component, trackName);

  expect(animationTrack.has('vrmExpression/happy')).toBe(false);
  expect(AnimationComponent.getAnimationInfo(engine).has(trackName)).toBe(false);
});

test('recalculates the time range when an existing sampler is replaced', () => {
  const { component, engine } = createAnimationComponentFixture();
  const trackName = 'Clip';

  AnimationComponent.prototype.setAnimation.call(
    component,
    'translate' as AnimationPathName,
    new AnimatedScalar(new Map([[trackName, createSampler([-1, 0, 2])]]), trackName)
  );
  AnimationComponent.prototype.setAnimation.call(
    component,
    'translate' as AnimationPathName,
    new AnimatedScalar(new Map([[trackName, createSampler([0, 1])]]), trackName)
  );

  expect(AnimationComponent.getAnimationInfo(engine).get(trackName)).toEqual({
    name: trackName,
    minStartInputTime: 0,
    maxEndInputTime: 1,
  });
});

test('does not back up the root transform when adding a VRM expression channel', () => {
  const { backupTransformAsRest, component } = createAnimationComponentFixture();
  const trackName = 'Face';

  AnimationComponent.prototype.setAnimation.call(
    component,
    'vrmExpression/happy',
    new AnimatedScalar(new Map([[trackName, createSampler([0, 1])]]), trackName)
  );

  expect(backupTransformAsRest).not.toHaveBeenCalled();

  AnimationComponent.prototype.setAnimation.call(
    component,
    'translate' as AnimationPathName,
    new AnimatedScalar(new Map([['Body', createSampler([0, 1])]]), 'Body')
  );
  expect(backupTransformAsRest).toHaveBeenCalledTimes(1);
});

test('does not reuse the time range of a destroyed animation component', () => {
  const { component, components, createComponent, engine } = createAnimationComponentFixture();
  const trackName = 'Clip';
  AnimationComponent.prototype.setAnimation.call(
    component,
    'translate' as AnimationPathName,
    new AnimatedScalar(new Map([[trackName, createSampler([-2, 0, 4])]]), trackName)
  );

  AnimationComponent.prototype._destroy.call(component);
  components.splice(components.indexOf(component), 1);
  const replacement = createComponent().component;
  AnimationComponent.prototype.setAnimation.call(
    replacement,
    'translate' as AnimationPathName,
    new AnimatedScalar(new Map([[trackName, createSampler([1, 2])]]), trackName)
  );

  expect(AnimationComponent.getAnimationInfo(engine).get(trackName)).toEqual({
    name: trackName,
    minStartInputTime: 1,
    maxEndInputTime: 2,
  });
});
