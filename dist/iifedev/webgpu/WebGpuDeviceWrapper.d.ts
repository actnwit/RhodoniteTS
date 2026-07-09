/**
 * A wrapper class for WebGPU device management and canvas context configuration.
 * This class encapsulates the WebGPU adapter, device, and canvas context,
 * providing a convenient interface for WebGPU rendering operations.
 */
export declare class WebGpuDeviceWrapper {
    private __canvas;
    private __gpuAdapter;
    private __gpuDevice;
    private __context;
    /**
     * Creates a new WebGpuDeviceWrapper instance.
     * Initializes the WebGPU context and configures the canvas with the provided device.
     *
     * @param canvas - The HTML canvas element to be used for WebGPU rendering
     * @param gpuAdapter - The WebGPU adapter for the graphics hardware
     * @param gpuDevice - The WebGPU device for executing GPU operations
     */
    constructor(canvas: HTMLCanvasElement, gpuAdapter: GPUAdapter, gpuDevice: GPUDevice);
    /**
     * Gets the HTML canvas element associated with this wrapper.
     *
     * @returns The canvas element used for WebGPU rendering
     */
    get canvas(): HTMLCanvasElement;
    /**
     * Gets the WebGPU adapter associated with this wrapper.
     *
     * @returns The WebGPU adapter representing the graphics hardware
     */
    get gpuAdapter(): GPUAdapter;
    /**
     * Gets the WebGPU device associated with this wrapper.
     *
     * @returns The WebGPU device for executing GPU operations
     */
    get gpuDevice(): GPUDevice;
    /**
     * Gets the WebGPU canvas context associated with this wrapper.
     *
     * @returns The configured WebGPU canvas context for rendering
     */
    get context(): GPUCanvasContext;
}
