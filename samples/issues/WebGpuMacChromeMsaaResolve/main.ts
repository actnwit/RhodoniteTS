// @ts-nocheck -- standalone WebGPU issue reduction intentionally uses browser-native API shapes
const statusElement = document.querySelector('#status');

if (!navigator.gpu) {
  statusElement.textContent = 'WebGPU is unavailable in this browser.';
  throw new Error('WebGPU unavailable');
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  statusElement.textContent = 'No WebGPU adapter was returned.';
  throw new Error('No WebGPU adapter');
}

const device = await adapter.requestDevice();
const format = navigator.gpu.getPreferredCanvasFormat();
const adapterInfo = adapter.info ?? {};
const validationErrors = new Set();

device.addEventListener('uncapturederror', event => {
  validationErrors.add(event.error.message);
  updateStatus();
});

function updateStatus() {
  const info = [
    `User agent: ${navigator.userAgent}`,
    `Adapter: ${adapterInfo.vendor || 'unknown'} / ${adapterInfo.architecture || 'unknown'} / ${adapterInfo.device || 'unknown'}`,
    `Canvas format: ${format}`,
    `Validation errors: ${validationErrors.size === 0 ? 'none' : Array.from(validationErrors).join(' | ')}`,
  ];
  statusElement.textContent = info.join('\n');
}

updateStatus();

const sceneShader = device.createShaderModule({
  label: 'uniform-division texture shader',
  code: /* wgsl */ `
    struct DrawParameters {
      materialSid: u32,
    }

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
    }

    @group(0) @binding(0) var baseTexture: texture_2d<f32>;
    @group(0) @binding(1) var baseSampler: sampler;
    @group(0) @binding(2) var<uniform> drawParameters: DrawParameters;

    @vertex
    fn vs(
      @location(0) position: vec3f,
      @location(1) uv: vec2f,
    ) -> VertexOutput {
      var out: VertexOutput;
      out.position = vec4f(position.xy, 0.0, 1.0);
      out.uv = uv;
      return out;
    }

    @fragment
    fn fsImplicit(input: VertexOutput) -> @location(0) vec4f {
      let offset = f32(drawParameters.materialSid / 2u);
      let transformedUv = input.uv + vec2f(offset);
      let texel = textureSample(baseTexture, baseSampler, transformedUv);
      return vec4f(texel.rgb, 1.0);
    }

    @fragment
    fn fsExplicit(input: VertexOutput) -> @location(0) vec4f {
      let offset = f32(drawParameters.materialSid / 2u);
      let transformedUv = input.uv + vec2f(offset);
      let texel = textureSampleLevel(baseTexture, baseSampler, transformedUv, 0.0);
      return vec4f(texel.rgb, 1.0);
    }
  `,
});

function createGridVertices(columns = 8, rows = 8) {
  const floats = [];
  const vertex = (column, row) => {
    const u = column / columns;
    const v = row / rows;
    return [u * 1.6 - 0.8, v * 1.6 - 0.8, 0, u, 1 - v];
  };

  const pushVertex = values => floats.push(...values);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = vertex(column, row);
      const b = vertex(column + 1, row);
      const c = vertex(column, row + 1);
      const d = vertex(column + 1, row + 1);
      pushVertex(a);
      pushVertex(b);
      pushVertex(c);
      pushVertex(c);
      pushVertex(b);
      pushVertex(d);
    }
  }
  return new Float32Array(floats);
}

function createTwoLevelTexture() {
  const size = 256;
  const mipLevelCount = 2;
  const texture = device.createTexture({
    label: 'white LOD 0 and black LOD 1',
    size: [size, size],
    mipLevelCount,
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  for (let level = 0; level < mipLevelCount; level++) {
    const levelSize = Math.max(1, size >> level);
    const pixels = new Uint8Array(levelSize * levelSize * 4);
    const color = level === 0 ? 255 : 0;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      pixels.set([color, color, color, 255], offset);
    }
    device.queue.writeTexture({ texture, mipLevel: level }, pixels, { bytesPerRow: levelSize * 4 }, [
      levelSize,
      levelSize,
    ]);
  }
  return texture;
}

const vertices = createGridVertices();
const vertexCount = vertices.length / 5;
const vertexBuffer = device.createBuffer({
  label: '8x8 triangle grid',
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);

const twoLevelTexture = createTwoLevelTexture();
const linearSampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear', mipmapFilter: 'linear' });
const drawParametersBuffer = device.createBuffer({
  size: 16,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(drawParametersBuffer, 0, new Uint32Array(4));
const sceneBindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
  ],
});
const sceneBindGroup = device.createBindGroup({
  layout: sceneBindGroupLayout,
  entries: [
    { binding: 0, resource: twoLevelTexture.createView() },
    { binding: 1, resource: linearSampler },
    { binding: 2, resource: { buffer: drawParametersBuffer } },
  ],
});

const vertexBuffers = [
  {
    arrayStride: 20,
    attributes: [
      { shaderLocation: 0, offset: 0, format: 'float32x3' },
      { shaderLocation: 1, offset: 12, format: 'float32x2' },
    ],
  },
];

function createTarget(canvas, sampleCount, explicitLod) {
  const context = canvas.getContext('webgpu');
  context.configure({ device, format, alphaMode: 'opaque' });
  const size = [canvas.width, canvas.height];
  const msaaTexture =
    sampleCount > 1
      ? device.createTexture({
          label: `${sampleCount}x color attachment`,
          size,
          sampleCount,
          format,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        })
      : null;

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [sceneBindGroupLayout],
  });
  const meshPipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: { module: sceneShader, entryPoint: 'vs', buffers: vertexBuffers },
    fragment: {
      module: sceneShader,
      entryPoint: explicitLod ? 'fsExplicit' : 'fsImplicit',
      targets: [{ format }],
    },
    primitive: { topology: 'triangle-list', cullMode: 'back' },
    multisample: { count: sampleCount },
  });

  return {
    context,
    sampleCount,
    explicitLod,
    msaaView: msaaTexture?.createView(),
    meshPipeline,
  };
}

const targets = [
  createTarget(document.querySelector('#msaaImplicit'), 4, false),
  createTarget(document.querySelector('#msaaExplicit'), 4, true),
  createTarget(document.querySelector('#singleImplicit'), 1, false),
];

function colorAttachment(target) {
  const canvasView = target.context.getCurrentTexture().createView();
  return {
    view: target.msaaView ?? canvasView,
    resolveTarget: target.msaaView ? canvasView : undefined,
    clearValue: { r: 0.12, g: 0.09, b: 0.06, a: 1 },
    loadOp: 'clear',
    storeOp: 'store',
  };
}

function drawTarget(encoder, target) {
  const renderPass = encoder.beginRenderPass({
    label: `${target.sampleCount}x texture sample`,
    colorAttachments: [colorAttachment(target)],
  });
  renderPass.setPipeline(target.meshPipeline);
  renderPass.setBindGroup(0, sceneBindGroup);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.draw(vertexCount);
  renderPass.end();
}

function frame() {
  const encoder = device.createCommandEncoder({ label: 'MSAA comparison frame' });
  for (const target of targets) {
    drawTarget(encoder, target);
  }
  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
