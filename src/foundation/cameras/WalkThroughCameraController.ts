import Matrix44 from "../math/Matrix44";
import MathClassUtil from "../math/MathClassUtil";
import { MiscUtil } from "../misc/MiscUtil";
import ICameraController from "./ICameraController";
import MutableVector3 from "../math/MutableVector3";
import CameraComponent from "../components/CameraComponent";
import { MathUtil } from "../math/MathUtil";
import Entity from "../core/Entity";
import MutableMatrix33 from "../math/MutableMatrix33";
import MutableMatrix44 from "../math/MutableMatrix44";
import AbstractCameraController from "./AbstractCameraController";

type KeyboardEventListener = (evt: KeyboardEvent) => any;
type MouseEventListener = (evt: MouseEvent) => any;

export default class WalkThroughCameraController extends AbstractCameraController implements ICameraController {
  private _horizontalSpeed: number;
  private _verticalSpeed: number;
  private _turnSpeed: number;
  private _mouseWheelSpeedScale: number;
  private _inverseVerticalRotating: boolean;
  private _inverseHorizontalRotating: boolean;
  private _onKeydown: KeyboardEventListener;
  private _isKeyDown: boolean = false;
  private _isMouseDrag: boolean = false;
  private _lastKeyCode: number = -1;
  private _onKeyup: KeyboardEventListener;
  private _currentDir = new MutableVector3(0, 0, -1);
  private _currentPos = new MutableVector3(0, 0, 0);
  private _currentCenter = new MutableVector3(0, 0, -1);
  private _currentHorizontalDir = new MutableVector3(0, 0, -1);
  private _newDir = new MutableVector3(0, 0, -1);
  private _isMouseDown: boolean = false;
  private _clickedMouseXOnCanvas = -1;
  private _clickedMouseYOnCanvas = -1;
  private _draggedMouseXOnCanvas = -1;
  private _draggedMouseYOnCanvas = -1;
  private _deltaMouseXOnCanvas = -1;
  private _deltaMouseYOnCanvas = -1;
  private _mouseXAdjustScale = 1;
  private _mouseYAdjustScale = 1;
  private _deltaY = -1;
  private _deltaX = -1;
  private _mouseUpBind = (this._mouseUp as any).bind(this);
  private _mouseDownBind = (this._mouseDown as any).bind(this);
  private _mouseMoveBind = (this._mouseMove as any).bind(this);
  private _mouseWheelBind = (this._mouseWheel as any).bind(this);
  private _eventTargetDom?: any;
  private _needInitialize = true;
  private _targetEntity?: Entity;
  private _zFarAdjustingFactorBasedOnAABB = 150.0;
  private __scaleOfZNearAndZFar = 5000;

  private static __tmpInvMat: MutableMatrix44 = MutableMatrix44.identity();
  private static __tmpRotateMat: MutableMatrix33 = MutableMatrix33.identity();
  private static __tmp_Vec3_0: MutableVector3 = MutableVector3.zero();
  private static __tmp_Vec3_1: MutableVector3 = MutableVector3.zero();

  constructor(
    options = {
      eventTargetDom: document,
      verticalSpeed: 1,
      horizontalSpeed: 1,
      turnSpeed: 0.25,
      mouseWheelSpeedScale: 1,
      inverseVerticalRotating: false,
      inverseHorizontalRotating: false
    }
  ) {
    super();

    this._horizontalSpeed = options.horizontalSpeed;
    this._verticalSpeed = options.verticalSpeed;
    this._turnSpeed = options.turnSpeed;
    this._mouseXAdjustScale = this._turnSpeed;
    this._mouseYAdjustScale = this._turnSpeed;
    this._mouseWheelSpeedScale = options.mouseWheelSpeedScale;
    this._inverseVerticalRotating = options.inverseVerticalRotating;
    this._inverseHorizontalRotating = options.inverseHorizontalRotating;

    this.reset();

    this._onKeydown = e => {
      this._isKeyDown = true;
      this._lastKeyCode = e.keyCode;
    };

    this._onKeyup = e => {
      this._isKeyDown = false;
      this._lastKeyCode = -1;
    };

    const eventTargetDom = options.eventTargetDom;

    this.registerEventListeners(eventTargetDom);
  }

  registerEventListeners(eventTargetDom: any = document) {
    this._eventTargetDom = eventTargetDom;

    if (eventTargetDom) {
      eventTargetDom.addEventListener("keydown", this._onKeydown);
      eventTargetDom.addEventListener("keyup", this._onKeyup);

      if ("ontouchend" in document) {
        document.addEventListener("touchstart", this._mouseDownBind);
        document.addEventListener("touchend", this._mouseUpBind);
        document.addEventListener("touchmove", this._mouseMoveBind);
      }
      if ("onmouseup" in document) {
        eventTargetDom.addEventListener("mousedown", this._mouseDownBind);
        eventTargetDom.addEventListener("mouseup", this._mouseUpBind);
        eventTargetDom.addEventListener("mouseleave", this._mouseUpBind);
        eventTargetDom.addEventListener("mousemove", this._mouseMoveBind);
      }
      if ("onwheel" in document) {
        eventTargetDom.addEventListener("wheel", this._mouseWheelBind);
      }
    }
  }

  unregisterEventListeners() {
    const eventTargetDom = this._eventTargetDom;

    if (eventTargetDom) {
      eventTargetDom.removeEventListener("keydown", this._onKeydown);
      eventTargetDom.removeEventListener("keyup", this._onKeyup);

      if ("ontouchend" in document) {
        document.removeEventListener("touchstart", this._mouseDownBind);
        document.removeEventListener("touchend", this._mouseUpBind);
        document.removeEventListener("touchmove", this._mouseMoveBind)
      }
      if ("onmouseup" in document) {
        eventTargetDom.removeEventListener("mousedown", this._mouseDownBind);
        eventTargetDom.removeEventListener("mouseup", this._mouseUpBind);
        eventTargetDom.removeEventListener("mouseleave", this._mouseUpBind);
        eventTargetDom.removeEventListener("mousemove", this._mouseMoveBind);
      }
      if ("onwheel" in document) {
        eventTargetDom.removeEventListener("wheel", this._mouseWheelBind);
      }
    }
  }

  _mouseWheel(e: MouseWheelEvent) {
    if (this._currentDir === null) {
      return;
    }
    const delta = -1 * Math.sign((e as any).deltaY) * this._mouseWheelSpeedScale * this._horizontalSpeed;
    const horizontalDir = WalkThroughCameraController.__tmp_Vec3_0;
    horizontalDir.setComponents(this._currentDir.x, 0, this._currentDir.z).normalize();

    const deltaVec = MutableVector3.multiplyTo(horizontalDir, delta, WalkThroughCameraController.__tmp_Vec3_1);
    this._currentPos.add(deltaVec);
    this._currentCenter.add(deltaVec);
  }

  _mouseDown(evt: MouseEvent) {
    MiscUtil.preventDefaultForDesktopOnly(evt);
    evt.stopPropagation();
    this._isMouseDown = true;

    let rect = (evt.target! as any).getBoundingClientRect();
    this._clickedMouseXOnCanvas = evt.clientX - rect.left;
    this._clickedMouseYOnCanvas = evt.clientY - rect.top;

    return false;
  }

  _mouseMove(evt: MouseEvent) {
    MiscUtil.preventDefaultForDesktopOnly(evt);
    if (!this._isMouseDown) {
      return;
    }
    evt.stopPropagation();

    let rect = (evt.target! as any).getBoundingClientRect();
    this._draggedMouseXOnCanvas = evt.clientX - rect.left;
    this._draggedMouseYOnCanvas = evt.clientY - rect.top;

    this._deltaMouseXOnCanvas =
      this._draggedMouseXOnCanvas - this._clickedMouseXOnCanvas;
    this._deltaMouseYOnCanvas =
      this._draggedMouseYOnCanvas - this._clickedMouseYOnCanvas;

    this._isMouseDrag = true;
  }

  _mouseUp(evt: MouseEvent) {
    this._isMouseDown = false;
    this._isMouseDrag = false;

    const target = evt.target as any;
    if (target?.getBoundingClientRect == null) {
      return;
    }

    const rect = target.getBoundingClientRect();
    this._clickedMouseXOnCanvas = evt.clientX - rect.left;
    this._clickedMouseYOnCanvas = evt.clientY - rect.top;
  }

  tryReset() { }

  reset() {
    this._isKeyDown = false;
    this._lastKeyCode = -1;
    this._currentPos.zero();
    this._currentCenter.setComponents(0, 0, -1);
    this._currentDir.setComponents(0, 0, -1);
    this._currentHorizontalDir.setComponents(0, 0, -1);
    this._isMouseDown = false;
    this._isMouseDrag = false;
    this._draggedMouseXOnCanvas = -1;
    this._draggedMouseYOnCanvas = -1;
    this._deltaMouseXOnCanvas = -1;
    this._deltaMouseYOnCanvas = -1;
    this._mouseXAdjustScale = this._turnSpeed;
    this._mouseYAdjustScale = this._turnSpeed;
    this._deltaY = 0;
    this._deltaX = 0;
    this._newDir.setComponents(0, 0, -1);

  }

  logic(cameraComponent: CameraComponent) {
    this.__updateCameraComponent(cameraComponent);
  }

  private __updateCameraComponent(camera: CameraComponent) {
    const targetAABB = this._targetEntity?.getSceneGraph().worldAABB;
    if (this._needInitialize && targetAABB != null) {
      const lengthCenterToCamera =
        targetAABB.lengthCenterToCorner * (1.0 + 1.0 / Math.tan(MathUtil.degreeToRadian(camera.fovy / 2.0)));
      this._currentPos.copyComponents(targetAABB.centerPoint);
      this._currentPos.z += lengthCenterToCamera;

      this._currentCenter.copyComponents(targetAABB.centerPoint);
      this._currentDir.setComponents(0, 0, -1);

      if (camera.entity.getSceneGraph()) {
        const sg = camera.entity.getSceneGraph();
        const invMat = Matrix44.invertTo(sg.worldMatrixInner, WalkThroughCameraController.__tmpInvMat);
        invMat.multiplyVector3To(this._currentPos, this._currentPos);
        invMat.multiplyVector3To(this._currentCenter, this._currentCenter);
      }

      this._needInitialize = false;
    }

    const t = this._deltaY / 90;
    this._newDir.x = this._currentDir.x * (1 - t);
    this._newDir.y = t;
    this._newDir.z = this._currentDir.z * (1 - t);
    this._newDir.normalize();

    this._currentHorizontalDir.x = this._currentDir.x;
    this._currentHorizontalDir.y = 0;
    this._currentHorizontalDir.z = this._currentDir.z;
    this._currentHorizontalDir.normalize();

    const moveVector = WalkThroughCameraController.__tmp_Vec3_0.zero();
    switch (this._lastKeyCode) {
      case 87: // w key
      case 38: // arrow upper key
        moveVector.x = this._currentHorizontalDir.x * this._horizontalSpeed;
        moveVector.z = this._currentHorizontalDir.z * this._horizontalSpeed;
        break;
      case 65: // a key
      case 37: // arrow left key
        moveVector.x = this._currentHorizontalDir.z * this._horizontalSpeed;
        moveVector.z = -this._currentHorizontalDir.x * this._horizontalSpeed;
        break;
      case 83: // s key
      case 40: // arrow down key
        moveVector.x = -this._currentHorizontalDir.x * this._horizontalSpeed;
        moveVector.z = -this._currentHorizontalDir.z * this._horizontalSpeed;
        break;
      case 68: // d key
      case 39: // arrow right key
        moveVector.x = -this._currentHorizontalDir.z * this._horizontalSpeed;
        moveVector.z = this._currentHorizontalDir.x * this._horizontalSpeed;
        break;
      case 81: // q key
        moveVector.x = -this._newDir.x * this._horizontalSpeed;
        moveVector.y = -this._newDir.y * this._horizontalSpeed;
        moveVector.z = -this._newDir.z * this._horizontalSpeed;
        break;
      case 69: // e key
        moveVector.x = this._newDir.x * this._horizontalSpeed;
        moveVector.y = this._newDir.y * this._horizontalSpeed;
        moveVector.z = this._newDir.z * this._horizontalSpeed;
        break;
      case 82: // r key
        moveVector.y = this._verticalSpeed;
        break;
      case 70: // f key
        moveVector.y = -this._verticalSpeed;
        break;
    }
    this._currentPos.add(moveVector);
    this._currentCenter.add(moveVector);


    if (this._isMouseDrag) {
      if (this._inverseHorizontalRotating) {
        this._deltaX = this._deltaMouseXOnCanvas * this._mouseXAdjustScale;
      } else {
        this._deltaX = -this._deltaMouseXOnCanvas * this._mouseXAdjustScale;
      }
      if (this._inverseVerticalRotating) {
        this._deltaY += this._deltaMouseYOnCanvas * this._mouseYAdjustScale;
      } else {
        this._deltaY += -this._deltaMouseYOnCanvas * this._mouseYAdjustScale;
      }
      this._deltaY = Math.max(-120, Math.min(50, this._deltaY));

      const rotateMatrix = WalkThroughCameraController.__tmpRotateMat.rotateY(MathUtil.degreeToRadian(this._deltaX));
      rotateMatrix.multiplyVectorTo(this._currentDir, this._currentDir);

      const newEyeToCenter = MutableVector3.subtractTo(this._currentCenter, this._currentPos,
        WalkThroughCameraController.__tmp_Vec3_1) as MutableVector3;
      rotateMatrix.multiplyVectorTo(newEyeToCenter, newEyeToCenter);
      newEyeToCenter.x = newEyeToCenter.x * (1 - t);
      newEyeToCenter.y = t;
      newEyeToCenter.z = newEyeToCenter.z * (1 - t);
      newEyeToCenter.normalize();

      this._currentCenter.copyComponents(this._currentPos);
      this._currentCenter.add(newEyeToCenter);

      this._clickedMouseXOnCanvas = this._draggedMouseXOnCanvas;
      this._clickedMouseYOnCanvas = this._draggedMouseYOnCanvas;
      this._deltaMouseXOnCanvas = 0;
      this._deltaMouseYOnCanvas = 0;
    }

    camera.eyeInner = this._currentPos;
    camera.directionInner = this._currentCenter;
    camera.upInner = (camera as any)._up;
    camera.leftInner = camera.left;
    camera.rightInner = camera.right;
    camera.topInner = camera.top;
    camera.bottomInner = camera.bottom;
    camera.fovyInner = camera.fovy;

    if (targetAABB != null) {
      this._calcZNearInner(camera, this._currentPos, this._newDir, targetAABB);
      this._calcZFarInner(camera);
    }
  }
  getDirection() {
    return this._currentCenter !== null ? this._newDir.clone() : null;
  }

  set horizontalSpeed(value) {
    this._horizontalSpeed = value;
  }

  get horizontalSpeed() {
    return this._horizontalSpeed;
  }

  set verticalSpeed(value) {
    this._verticalSpeed = value;
  }

  get verticalSpeed() {
    return this._verticalSpeed;
  }

  set mouseWheelSpeed(value) {
    this._mouseWheelSpeedScale = value;
  }

  get mouseWheelSpeed() {
    return this._mouseWheelSpeedScale;
  }

  setTarget(targetEntity: Entity) {
    const speed = targetEntity.getSceneGraph().worldAABB.lengthCenterToCorner / 10;
    this.verticalSpeed = speed;
    this.horizontalSpeed = speed;

    this._targetEntity = targetEntity;
    this._needInitialize = true;
  }

  getTarget(): Entity | undefined {
    return this._targetEntity;
  }

  set zFarAdjustingFactorBasedOnAABB(value: number) {
    this._zFarAdjustingFactorBasedOnAABB = value;
  }

  get zFarAdjustingFactorBasedOnAABB() {
    return this._zFarAdjustingFactorBasedOnAABB;
  }

  set scaleOfZNearAndZFar(value: number) {
    this.__scaleOfZNearAndZFar = value;
  }

  get scaleOfZNearAndZFar() {
    return this.__scaleOfZNearAndZFar;
  }

  get allInfo() {
    const info: any = {};

    info.verticalSpeed = this.verticalSpeed;
    info.horizontalSpeed = this.horizontalSpeed;
    info._turnSpeed = this._turnSpeed;
    if (this._currentPos) {
      info._currentPos = this._currentPos.clone();
    }
    if (this._currentCenter) {
      info._currentCenter = this._currentCenter.clone();
    }
    if (this._currentDir) {
      info._currentDir = this._currentDir.clone();
    }
    info._deltaY = this._deltaY;
    info._newDir = this._newDir.clone();

    return info;
  }

  set allInfo(arg) {
    let json = arg;
    if (typeof arg === "string") {
      json = JSON.parse(arg);
    }
    for (let key in json) {
      if (json.hasOwnProperty(key) && key in this) {
        if (key === "quaternion") {
          (this as any)[key] = MathClassUtil.cloneOfMathObjects(
            MathClassUtil.arrayToQuaternion(json[key])
          );
        } else {
          (this as any)[key] = MathClassUtil.cloneOfMathObjects(
            MathClassUtil.arrayToVectorOrMatrix(json[key])
          );
        }
      }
    }
  }
}

