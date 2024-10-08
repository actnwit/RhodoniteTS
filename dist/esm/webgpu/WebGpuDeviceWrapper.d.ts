export declare class WebGpuDeviceWrapper {
    private __canvas;
    private __gpuAdapter;
    private __gpuDevice;
    private __context;
    constructor(canvas: HTMLCanvasElement, gpuAdapter: GPUAdapter, gpuDevice: GPUDevice);
    get canvas(): HTMLCanvasElement;
    get gpuAdapter(): GPUAdapter;
    get gpuDevice(): GPUDevice;
    get context(): GPUCanvasContext;
}
