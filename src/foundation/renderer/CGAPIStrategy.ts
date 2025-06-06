import { CGAPIResourceHandle, Count, Index, PrimitiveUID } from '../../types/CommonTypes';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { RenderPass } from './RenderPass';

/**
 * Strategy interface for Computer Graphics API implementations.
 * This interface defines the contract for different graphics API backends
 * (such as WebGL, WebGPU, etc.) to handle mesh loading and rendering operations.
 *
 * @interface CGAPIStrategy
 */
export interface CGAPIStrategy {
  /**
   * Loads mesh data into the graphics API backend.
   * This method is responsible for uploading vertex data, indices, and other
   * mesh-related resources to the GPU memory.
   *
   * @param meshComponent - The mesh component containing the geometry data to be loaded
   * @returns True if the mesh was successfully loaded, false otherwise
   */
  $load(meshComponent: MeshComponent): boolean;

  /**
   * Performs pre-rendering setup operations.
   * This method is called before the main rendering loop and is used to
   * set up render states, clear buffers, or perform other preparatory tasks
   * required by the specific graphics API implementation.
   */
  prerender(): void;

  /**
   * Executes the common rendering operations for a set of primitives.
   * This method handles the core rendering logic that is shared across
   * different render passes and primitive types.
   *
   * @param primitiveUids - Array of unique identifiers for the primitives to be rendered
   * @param renderPass - The render pass context containing rendering configuration
   * @param renderPassTickCount - The current tick count for the render pass, used for timing and animation
   * @returns True if the rendering operation was successful, false otherwise
   */
  common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: Count): boolean;
}
