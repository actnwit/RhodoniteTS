import { describe, expect, test } from 'vitest';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { createCameraEntity } from '../foundation/components/Camera/createCameraEntity';
import { Component } from '../foundation/core/Component';
import { ProcessApproach } from '../foundation/definitions/ProcessApproach';
import { ShaderType } from '../foundation/definitions/ShaderType';
import { Engine } from '../foundation/system/Engine';
import { WebGpuStrategyBasic } from './WebGpuStrategyBasic';

describe('WebGpuStrategyBasic', () => {
  test('declares the buffer view offset tables at module scope', async () => {
    const engine = await Engine.init({
      approach: ProcessApproach.None,
      canvas: document.createElement('canvas'),
      notToDisplayRnInfoAtInit: true,
    });
    createCameraEntity(engine, false);
    createCameraEntity(engine, false);
    createCameraEntity(engine, false);

    const cameraBufferViewCount = Component.getLocationOffsetOfMemberOfComponent(
      engine,
      CameraComponent,
      'viewMatrix'
    ).length;

    const source = WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(engine, ShaderType.VertexShader);

    // A var<function> array is initialized on every call of the accessor, so the table of the buffer view offsets
    // must be a module-scope const (one entry per camera buffer view can be large in scenes with many cameras).
    expect(source).toContain(`const rnIndices_viewMatrix: array<u32, ${cameraBufferViewCount}>`);
    expect(source).not.toContain('var<function> indices');
  });
});
