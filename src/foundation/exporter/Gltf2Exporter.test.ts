import { expect, test } from 'vitest';
import { isRuntimeOnlyAnimationPath } from './Gltf2ExporterOps';

test('omits runtime VRM expression channels from regular glTF export', () => {
  expect(isRuntimeOnlyAnimationPath('vrmExpression/happy')).toBe(true);
  expect(isRuntimeOnlyAnimationPath('quaternion')).toBe(false);
});
