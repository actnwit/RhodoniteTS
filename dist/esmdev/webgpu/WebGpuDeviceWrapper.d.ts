/// <reference types="@webgpu/types" />
export declare class WebGpuDeviceWrapper {
    private __canvas;
    private __gpuAdapter;
    private __gpuDevice;
    constructor(canvas: HTMLCanvasElement, gpuAdapter: GPUAdapter, gpuDevice: GPUDevice);
    get canvas(): HTMLCanvasElement;
    get gpuAdapter(): GPUAdapter;
    get gpuDevice(): GPUDevice;
}
