import Vector4 from "../math/Vector4";
import Matrix44 from "../math/Matrix44";
import MutableVector4 from "../math/MutableVector4";
import Vector3 from "../math/Vector3";
import SceneGraphComponent from "../components/SceneGraphComponent";
/**
 * The view frustum class.
 */
export default class Frustum {
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
     * Do clipping test (Inside / outside / neutral) of the plane of the view frustum.
     * @param plane The plane of the view frustum.
     * @param point The point to test.
     * @param bias The bias value.
     */
    clipping(plane: Vector4, point: Vector3, bias: number): import("../definitions/visibility").VisibilityEnum;
    /**
     * Do culling test (Inside / outside / neutral) of the entity against to the view frustum.
     * @param sg The SceneGraphComponent object of the entity.
     */
    culling(sg: SceneGraphComponent): import("../definitions/visibility").VisibilityEnum;
}
