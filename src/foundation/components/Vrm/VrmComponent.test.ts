import { describe, expect, test, vi } from 'vitest';
import { AnimationComponent } from '../Animation/AnimationComponent';
import { VrmComponent, type VrmExpression } from './VrmComponent';

function createVrmComponentFixture(expression: VrmExpression) {
  const setWeightByIndex = vi.fn();
  const component = {
    __engine: {
      entityRepository: {
        getEntity: () => ({
          tryToGetBlendShape: () => ({ setWeightByIndex }),
        }),
      },
    },
    __expressions: new Map([[expression.name, expression]]),
    __weights: new Map([[expression.name, 0]]),
  };
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

    VrmComponent.prototype.setExpressionWeight.call(component as any, 'blink', 0.5);
    expect(VrmComponent.prototype.getExpressionWeight.call(component as any, 'blink')).toBe(0);
    expect(setWeightByIndex).toHaveBeenLastCalledWith(3, 0);

    VrmComponent.prototype.setExpressionWeight.call(component as any, 'blink', 0.6);
    expect(VrmComponent.prototype.getExpressionWeight.call(component as any, 'blink')).toBe(1);
    expect(setWeightByIndex).toHaveBeenLastCalledWith(3, 0.7);
  });

  test('applies VRM expression animation channels to the target VrmComponent', () => {
    const setExpressionWeight = vi.fn();
    const animationComponent = {
      entity: {
        tryToGetVrm: () => ({ setExpressionWeight }),
      },
    };
    const applyVrmExpressionAnimation = (AnimationComponent.prototype as any).__applyVrmExpressionAnimation;

    expect(
      applyVrmExpressionAnimation.call(animationComponent, 'vrmExpression/happy', {
        animatedValue: { x: 1.25 },
      })
    ).toBe(true);
    expect(setExpressionWeight).toHaveBeenCalledWith('happy', 1.25);
    expect(applyVrmExpressionAnimation.call(animationComponent, 'translate', {})).toBe(false);
  });
});
