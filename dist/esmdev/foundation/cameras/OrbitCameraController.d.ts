import { CameraComponent } from '../components/Camera/CameraComponent';
import { Size } from '../../types/CommonTypes';
import { ICameraController } from './ICameraController';
import { AbstractCameraController } from './AbstractCameraController';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
export declare class OrbitCameraController extends AbstractCameraController implements ICameraController {
    dollyScale: number;
    scaleOfLengthCenterToCamera: number;
    moveSpeed: number;
    followTargetAABB: boolean;
    private __fixedDolly;
    private __fixedLengthOfCenterToEye;
    private __isMouseDown;
    private __lastMouseDownTimeStamp;
    private __lastMouseUpTimeStamp;
    private __originalY;
    private __originalX;
    private __buttonNumber;
    private __mouse_translate_y;
    private __mouse_translate_x;
    private __efficiency;
    private __lengthOfCenterToEye;
    private __fovyBias;
    private __scaleOfTranslation;
    private __mouseTranslateVec;
    private __newEyeVec;
    private __newCenterVec;
    private __newUpVec;
    private __newTangentVec;
    private __isSymmetryMode;
    private __rot_bgn_x;
    private __rot_bgn_y;
    private __rot_x;
    private __rot_y;
    private __dolly;
    private __eyeVec;
    private __centerVec;
    private __upVec;
    protected __targetEntity?: ISceneGraphEntity;
    private __scaleOfZNearAndZFar;
    private __doPreventDefault;
    private __isPressingShift;
    private __isPressingCtrl;
    private __pinchInOutControl;
    private __pinchInOutOriginalDistance?;
    private __maximum_y?;
    private __minimum_y?;
    private __resetDollyTouchTime;
    private __originalTargetAABB?;
    private __mouseDownFunc;
    private __mouseUpFunc;
    private __mouseMoveFunc;
    private __touchDownFunc;
    private __touchUpFunc;
    private __touchMoveFunc;
    private __pinchInOutFunc;
    private __pinchInOutEndFunc;
    private __mouseWheelFunc;
    private __mouseDblClickFunc;
    private __contextMenuFunc;
    private __pressShiftFunc;
    private __releaseShiftFunc;
    private __pressCtrlFunc;
    private __releaseCtrlFunc;
    private __resetDollyAndPositionFunc;
    private static readonly __tmp_up;
    private static __tmpVec3_0;
    private static __tmpVec3_1;
    private static __tmpVec3_2;
    private static __tmp_rotateM_X;
    private static __tmp_rotateM_Y;
    private static __tmp_rotateM;
    private static __tmp_rotateM_Reset;
    private static __tmp_rotateM_Revert;
    private static __tmpMat44_0;
    constructor();
    resetDollyAndTranslation(): void;
    setTarget(targetEntity: ISceneGraphEntity): void;
    getTarget(): ISceneGraphEntity | undefined;
    set doPreventDefault(flag: boolean);
    get doPreventDefault(): boolean;
    __mouseDown(e: MouseEvent): void;
    __mouseMove(e: MouseEvent): void;
    __mouseUp(e: MouseEvent): void;
    __touchDown(e: TouchEvent): void;
    __touchMove(e: TouchEvent): void;
    __touchUp(e: TouchEvent): void;
    set rotX(value: number);
    get rotX(): number;
    set rotY(value: number);
    get rotY(): number;
    set maximumY(maximum_y: number);
    set minimumY(minimum_y: number);
    __rotateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size): void;
    __zoomControl(originalValue: Size, currentValue: Size): void;
    __parallelTranslateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size): void;
    __getTouchesDistance(e: TouchEvent): number;
    __pinchInOut(e: TouchEvent): void;
    __pinchInOutEnd(e: TouchEvent): void;
    private __tryToPreventDefault;
    __mouseWheel(evt: WheelEvent): void;
    __contextMenu(evt: Event): void;
    set dolly(value: number);
    get dolly(): number;
    __mouseDblClick(evt: MouseEvent): void;
    __resetDollyAndPosition(e: TouchEvent): void;
    __pressShift(e: KeyboardEvent): void;
    __releaseShift(e: KeyboardEvent): void;
    __pressCtrl(e: KeyboardEvent): void;
    __releaseCtrl(e: KeyboardEvent): void;
    registerEventListeners(): void;
    unregisterEventListeners(): void;
    __getFovyFromCamera(camera: CameraComponent): number;
    logic(cameraComponent: CameraComponent): void;
    /**
     * update center, eye and up vectors of OrbitCameraController
     * @internal
     */
    __updateTargeting(camera: CameraComponent): void;
    /**
     * calculate up, eye, center and tangent vector with controller influence
     * @internal
     */
    __calculateInfluenceOfController(): void;
    __updateCameraComponent(camera: CameraComponent): void;
    set scaleOfZNearAndZFar(value: number);
    get scaleOfZNearAndZFar(): number;
    get isMouseDown(): boolean;
    get lastMouseDownTimeStamp(): number;
    get lastMouseUpTimeStamp(): number;
    setFixedDollyTrue(lengthOfCenterToEye: number): void;
    unsetFixedDolly(): void;
}