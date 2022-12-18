export class WebGpuDeviceWrapper {
  private __canvas: HTMLCanvasElement;
  private __gpuAdapter: GPUAdapter;
  private __gpuDevice: GPUDevice;
  constructor(canvas: HTMLCanvasElement, gpuAdapter: GPUAdapter, gpuDevice: GPUDevice) {
    this.__canvas = canvas;
    this.__gpuAdapter = gpuAdapter;
    this.__gpuDevice = gpuDevice;
  }

  get canvas(): HTMLCanvasElement {
    return this.__canvas;
  }

  get gpuAdapter(): GPUAdapter {
    return this.__gpuAdapter;
  }

  get gpuDevice(): GPUDevice {
    return this.__gpuDevice;
  }
}
