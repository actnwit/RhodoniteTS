import { describe, expect, test, vi } from 'vitest';
import { AnimationComponent } from '../Animation/AnimationComponent';
import { VrmComponent, type VrmExpression } from './VrmComponent';

function createVrmComponentFixture(expressionOrExpressions: VrmExpression | VrmExpression[]) {
  const expressions = Array.isArray(expressionOrExpressions) ? expressionOrExpressions : [expressionOrExpressions];
  const setWeightByIndex = vi.fn();
  const component = {
    __engine: {
      entityRepository: {
        getEntity: () => ({
          tryToGetBlendShape: () => ({ setWeightByIndex }),
        }),
      },
    },
    __expressions: new Map(expressions.map(expression => [expression.name, expression])),
    __weights: new Map(expressions.map(expression => [expression.name, 0])),
  };
  Object.setPrototypeOf(component, VrmComponent.prototype);
  return { component, setWeightByIndex };
}

describe('VrmComponent expressions', () => {
  test('clamps expression values and scales morph target binds', () => {
    const { component, setWeightByIndex } = createVrmComponentFixture({
      name: 'happy',
      isBinary: false,
      binds: [{ entityIdx: 1, blendShapeIdx: 2, weight: 0.4 }],
    });

    VrmComponent.prototype.setExpressionWeight.call(component as any, 'happy', 2);
    expect(VrmComponent.prototype.getExpressionWeight.call(component as any, 'happy')).toBe(1);
    expect(setWeightByIndex).toHaveBeenLastCalledWith(2, 0.4);

    VrmComponent.prototype.setExpressionWeight.call(component as any, 'happy', -1);
    expect(VrmComponent.prototype.getExpressionWeight.call(component as any, 'happy')).toBe(0);
    expect(setWeightByIndex).toHaveBeenLastCalledWith(2, 0);
  });

  test('applies binary expressions after clamping', () => {
    const { component, setWeightByIndex } = createVrmComponentFixture({
      name: 'blink',
      isBinary: true,
      binds: [{ entityIdx: 1, blendShapeIdx: 3, weight: 0.7 }],
    });

    VrmComponent.prototype.setExpressionWeight.call(component as any, 'blink', 0.49);
    expect(VrmComponent.prototype.getExpressionWeight.call(component as any, 'blink')).toBe(0);
    expect(setWeightByIndex).toHaveBeenLastCalledWith(3, 0);

    VrmComponent.prototype.setExpressionWeight.call(component as any, 'blink', 0.5);
    expect(VrmComponent.prototype.getExpressionWeight.call(component as any, 'blink')).toBe(0);
    expect(setWeightByIndex).toHaveBeenLastCalledWith(3, 0);

    VrmComponent.prototype.setExpressionWeight.call(component as any, 'blink', 0.51);
    expect(VrmComponent.prototype.getExpressionWeight.call(component as any, 'blink')).toBe(1);
    expect(setWeightByIndex).toHaveBeenLastCalledWith(3, 0.7);
  });

  test('accumulates expression contributions that bind the same morph target', () => {
    const happy: VrmExpression = {
      name: 'happy',
      isBinary: false,
      binds: [{ entityIdx: 1, blendShapeIdx: 2, weight: 0.5 }],
    };
    const relaxed: VrmExpression = {
      name: 'relaxed',
      isBinary: false,
      binds: [{ entityIdx: 1, blendShapeIdx: 2, weight: 0.5 }],
    };

    for (const expressions of [
      [happy, relaxed],
      [relaxed, happy],
    ]) {
      const { component, setWeightByIndex } = createVrmComponentFixture(expressions);
      VrmComponent.prototype.setExpressionWeight.call(component as any, 'happy', 0.5);
      VrmComponent.prototype.setExpressionWeight.call(component as any, 'relaxed', 0.25);

      expect(setWeightByIndex).toHaveBeenLastCalledWith(2, 0.375);
    }
  });

  test('applies all VRM expression animation channels in one morph target pass', () => {
    const { component: vrmComponent, setWeightByIndex } = createVrmComponentFixture([
      {
        name: 'happy',
        isBinary: false,
        binds: [{ entityIdx: 1, blendShapeIdx: 2, weight: 0.4 }],
      },
      {
        name: 'relaxed',
        isBinary: false,
        binds: [{ entityIdx: 1, blendShapeIdx: 3, weight: 0.6 }],
      },
    ]);
    const animationComponent = {
      __animationBlendingRatio: 0,
      __animationTrack: new Map([
        [
          'vrmExpression/happy',
          {
            animatedValue: { setTime: vi.fn(), blendingRatio: 0, x: 0.5 },
          },
        ],
        [
          'vrmExpression/relaxed',
          {
            animatedValue: { setTime: vi.fn(), blendingRatio: 0, x: 0.25 },
          },
        ],
      ]),
      entity: {
        getTransform: () => ({}),
        tryToGetBlendShape: () => undefined,
        tryToGetEffekseer: () => undefined,
        tryToGetVrm: () => vrmComponent,
      },
      time: 0,
      useGlobalTime: false,
    };
    Object.setPrototypeOf(animationComponent, AnimationComponent.prototype);

    (AnimationComponent.prototype as any).__applyAnimation.call(animationComponent);

    expect(setWeightByIndex).toHaveBeenCalledTimes(2);
    expect(setWeightByIndex).toHaveBeenNthCalledWith(1, 2, 0.2);
    expect(setWeightByIndex).toHaveBeenNthCalledWith(2, 3, 0.15);
  });
});
