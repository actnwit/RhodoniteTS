import Vector4 from "../math/Vector4";
import Matrix44 from "../math/Matrix44";
import MutableVector4 from "../math/MutableVector4";
import Vector3 from "../math/Vector3";
import SceneGraphComponent from "../components/SceneGraphComponent";
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
    update(viewMatrix: Matrix44, projectionMatrix: Matrix44): void;
    clipping(plane: Vector4, point: Vector3, bias: number): import("../definitions/visibility").VisibilityEnum;
    culling(sg: SceneGraphComponent): import("../definitions/visibility").VisibilityEnum;
}
