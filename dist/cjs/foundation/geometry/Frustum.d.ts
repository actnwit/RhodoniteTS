import { Matrix44 } from '../math/Matrix44';
import { MutableVector4 } from '../math/MutableVector4';
import { MeshComponent } from '../components';
import { Index } from '../../types';
/**
 * The view frustum class.
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
    constructor();
    /**
     * Updates this view frustum data from the view and projection matrices.
     * @param viewMatrix The view matrix.
     * @param projectionMatrix The projection matrix.
     */
    update(viewMatrix: Matrix44, projectionMatrix: Matrix44): void;
    /**
     * false if fully outside, true if inside or intersects
     *
     * original idea is from https://iquilezles.org/articles/frustumcorrect/
     */
    culling(meshComponent: MeshComponent): boolean;
    getPlane(i: Index): MutableVector4;
}
