import type { Index } from '../../types/CommonTypes';
import type { MeshComponent } from '../components/Mesh/MeshComponent';
import { Matrix44 } from '../math/Matrix44';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector4 } from '../math/Vector4';
/**
 * The view frustum class.
 * Represents a truncated pyramid (frustum) used for view culling in 3D graphics.
 * Contains six planes (top, bottom, left, right, near, far) and eight corner vertices.
 */
export declare class Frustum {
    top: MutableVector4;
    bottom: MutableVector4;
    right: MutableVector4;
    left: MutableVector4;
    zNear: MutableVector4;
    zFar: MutableVector4;
    private __updated;
    private __vp;
    private __invProjMat;
    private __invViewMat;
    private __tmp_vec4_0;
    private __tmp_vec4_1;
    private __tmp_vec4_array;
    private __hCorners;
    corners: Vector4[];
    /**
     * Updates this view frustum data from the view and projection matrices.
     * Calculates the six frustum planes and eight corner vertices in world space.
     * This method should be called whenever the camera's view or projection matrix changes.
     *
     * @param viewMatrix - The view matrix that transforms from world space to view space
     * @param projectionMatrix - The projection matrix that transforms from view space to clip space
     *
     * @remarks
     * The frustum planes are calculated using the combined view-projection matrix.
     * Corner vertices are computed by transforming normalized device coordinates back to world space.
     * The planes are stored as Vector4 where (x,y,z) is the normal and w is the distance from origin.
     */
    update(viewMatrix: Matrix44, projectionMatrix: Matrix44): void;
    /**
     * Performs frustum culling test against a mesh component's bounding box.
     * Uses optimized frustum-AABB intersection algorithm to determine visibility.
     *
     * @param meshComponent - The mesh component to test for culling
     * @returns `false` if the mesh is completely outside the frustum (should be culled),
     *          `true` if the mesh is inside or intersects the frustum (should be rendered)
     *
     * @remarks
     * This method uses a two-phase approach:
     * 1. Tests if the AABB is completely outside any frustum plane
     * 2. Tests if all frustum corners are outside any AABB face
     *
     * The algorithm is based on the optimized frustum culling technique described at:
     * https://iquilezles.org/articles/frustumcorrect/
     *
     * @example
     * ```typescript
     * const frustum = new Frustum();
     * frustum.update(viewMatrix, projectionMatrix);
     *
     * if (frustum.culling(meshComponent)) {
     *   // Render the mesh
     *   renderMesh(meshComponent);
     * }
     * // Otherwise, skip rendering (culled)
     * ```
     */
    culling(meshComponent: MeshComponent): boolean;
    /**
     * Retrieves a specific frustum plane by index.
     *
     * @param i - The plane index (0-5)
     *   - 0: Top plane
     *   - 1: Bottom plane
     *   - 2: Right plane
     *   - 3: Left plane
     *   - 4: Near plane
     *   - 5: Far plane
     *
     * @returns The plane as a Vector4 where (x,y,z) represents the plane normal
     *          and w represents the distance from the origin
     *
     * @throws {Error} Throws an error if the plane index is invalid (not 0-5)
     *
     * @example
     * ```typescript
     * const frustum = new Frustum();
     * const topPlane = frustum.getPlane(0);    // Get top plane
     * const nearPlane = frustum.getPlane(4);   // Get near plane
     * ```
     */
    getPlane(i: Index): MutableVector4;
}
