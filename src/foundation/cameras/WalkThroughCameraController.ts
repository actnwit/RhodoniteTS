import Vector3 from "../math/Vector3";
import Matrix33 from "../math/Matrix33";
import MathClassUtil from "../math/MathClassUtil";
import { MiscUtil } from "../misc/MiscUtil";
import ICameraController from "./ICameraController";
import { FunctionDeclaration } from "@babel/types";
import MutableVector3 from "../math/MutableVector3";
import CameraComponent from "../components/CameraComponent";

type KeyboardEventListner = (evt: KeyboardEvent) => any;
type MouseEventListner = (evt: MouseEvent) => any;

export default class WalkThroughCameraController implements ICameraController {
  private _horizontalSpeed: number;
  private _virticalSpeed: number;
  private _turnSpeed: number;
  private _mouseWheelSpeedScale: number;
  private _inverseVirticalRotating: boolean;
  private _inverseHorizontalRotating: boolean;
  private _onKeydown: KeyboardEventListner;
  private _isKeyDown: boolean = false;
  private _isMouseDrag: boolean = false;
  private _lastKeyCode: number = -1;
  private _onKeyup: KeyboardEventListner;
  private _currentDir = MutableVector3.zero();
  private _currentPos = MutableVector3.zero();
  private _currentCenter = MutableVector3.zero();
  private _newDir = MutableVector3.zero();
  private _isMouseDown: boolean = false;
  private _clickedMouseXOnCanvas = -1;
  private _clickedMouseYOnCanvas = -1;
  private _draggedMouseXOnCanvas = -1;
  private _draggedMouseYOnCanvas = -1;
  private _deltaMouseXOnCanvas = -1;
  private _deltaMouseYOnCanvas = -1;
  private _mouseXAdjustScale = -1;
  private _mouseYAdjustScale = -1;
  private _deltaY = -1;
  private _deltaX = -1;

  constructor(
    options = {
      eventTargetDom: document,
      virticalSpeed: 1,
      horizontalSpeed: 1,
      turnSpeed: 5,
      mouseWheelSpeedScale: 0.3,
      inverseVirticalRotating: false,
      inverseHorizontalRotating: false
    }
  ) {

    this._camaras = new Set();

    this._horizontalSpeed = options.horizontalSpeed;
    this._virticalSpeed = options.virticalSpeed;
    this._turnSpeed = options.turnSpeed;
    this._mouseWheelSpeedScale = options.mouseWheelSpeedScale;
    this._inverseVirticalRotating = options.inverseVirticalRotating;
    this._inverseHorizontalRotating = options.inverseHorizontalRotating;

    this.reset();

    this._onKeydown = e => {
      this._isKeyDown = true;
      this._lastKeyCode = e.keyCode;

      this.updateCamera();
    };

    this._onKeyup = e => {
      this._isKeyDown = false;
      this._lastKeyCode = -1;
    };

    const eventTargetDom = options.eventTargetDom;

    this.registerEventListeners(eventTargetDom);
  }

  updateCamera() {
    this._camaras.forEach(function(camera) {
      camera._needUpdateView(false);
      camera._needUpdateProjection();
    });
  }

  registerEventListeners(eventTargetDom = document) {
    if (eventTargetDom) {
      document.addEventListener("keydown", this._onKeydown);
      document.addEventListener("keyup", this._onKeyup);

      if ("ontouchend" in document) {
        eventTargetDom.addEventListener(
          "touchstart",
          this._mouseDown.bind(this, new MouseEvent(''))
        );
        document.addEventListener("touchend", this._mouseUp.bind(this, new MouseEvent('')));
        eventTargetDom.addEventListener(
          "touchmove",
          this._mouseMove.bind(this, new MouseEvent(''))
        );
      }
      if ("onmouseup" in document) {
        eventTargetDom.addEventListener(
          "mousedown",
          this._mouseDown.bind(this, new MouseEvent(''))
        );
        document.addEventListener("mouseup", this._mouseUp.bind(this, new MouseEvent('')));
        eventTargetDom.addEventListener(
          "mousemove",
          this._mouseMove.bind(this, new MouseEvent(''))
        );
      }
      if (window.WheelEvent) {
        eventTargetDom.addEventListener("wheel", this._mouseWheel.bind(this));
      }
    }
  }

  unregisterEventListeners(eventTargetDom = document) {
    if (eventTargetDom) {
      document.removeEventListener("keydown", this._onKeydown);
      document.removeEventListener("keyup", this._onKeyup);

      if ("ontouchend" in document) {
        eventTargetDom.removeEventListener(
          "touchstart",
          this._mouseDown.bind(this, new MouseEvent(''))
        );
        document.removeEventListener("touchend", this._mouseUp.bind(this, new MouseEvent('')));
        eventTargetDom
          .removeEventListener("touchmove", this._mouseMove
          .bind(this) as any);
      }
      if ("onmouseup" in document) {
        eventTargetDom.removeEventListener(
          "mousedown",
          this._mouseDown.bind(this)
        );
        document.removeEventListener("mouseup", this._mouseUp.bind(this));
        eventTargetDom.removeEventListener(
          "mousemove",
          this._mouseMove.bind(this)
        );
      }
      if (window.WheelEvent) {
        eventTargetDom.removeEventListener(
          "wheel",
          this._mouseWheel.bind(this)
        );
      }
    }
  }

  _mouseWheel(e: MouseWheelEvent) {
    if (this._currentDir === null) {
      return;
    }
    const delta = (e as any).wheelDelta * this._mouseWheelSpeedScale;
    const horizontalDir = new MutableVector3(
      this._currentDir.x,
      0,
      this._currentDir.z
    ).normalize();
    this._currentPos.add(Vector3.multiply(horizontalDir, delta));
    this._currentCenter.add(Vector3.multiply(horizontalDir, delta));
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
    evt.stopPropagation();
    if (!this._isMouseDown) {
      return;
    }

    let rect = (evt.target! as any).getBoundingClientRect();
    this._draggedMouseXOnCanvas = evt.clientX - rect.left;
    this._draggedMouseYOnCanvas = evt.clientY - rect.top;

    this._deltaMouseXOnCanvas =
      this._draggedMouseXOnCanvas - this._clickedMouseXOnCanvas;
    this._deltaMouseYOnCanvas =
      this._draggedMouseYOnCanvas - this._clickedMouseYOnCanvas;

    this._isMouseDrag = true;
    this.updateCamera();
  }

  _mouseUp(evt: MouseEvent) {
    this._isMouseDown = false;
    this._isMouseDrag = false;

    let rect = (evt.target! as any).getBoundingClientRect();
    this._clickedMouseXOnCanvas = evt.clientX - rect.left;
    this._clickedMouseYOnCanvas = evt.clientY - rect.top;
  }

  tryReset() {}

  reset() {
    this._isKeyDown = false;
    this._lastKeyCode = -1;
    this._currentPos = MutableVector3.zero();
    this._currentCenter = MutableVector3.zero();
    this._currentDir = MutableVector3.zero();
    this._isMouseDown = false;
    this._isMouseDrag = false;
    this._draggedMouseXOnCanvas = -1;
    this._draggedMouseYOnCanvas = -1;
    this._deltaMouseXOnCanvas = -1;
    this._deltaMouseYOnCanvas = -1;
    this._mouseXAdjustScale = 0.1;
    this._mouseYAdjustScale = 0.1;
    this._deltaY = 0;
    this._deltaX = 0;
    this._newDir = MutableVector3.zero();

  }

  convert(camera: CameraComponent, eye: Vector3, center: Vector3, up: Vector3) {
    if (this._currentPos === null) {
      this._currentPos = new MutableVector3(camera.eye.clone());
    }
    if (this._currentCenter === null) {
      this._currentCenter = new MutableVector3(camera.center.clone());
    }
    if (this._currentDir === null) {
      this._currentDir = Vector3.subtract(
        new MutableVector3(camera.center),
        camera.eye
      ).normalize();
    }

    let newEyeToCenter = null;

    const t = this._deltaY / 90;
    this._newDir.x = this._currentDir.x * (1 - t);
    this._newDir.y = t;
    this._newDir.z = this._currentDir.z * (1 - t);
    this._newDir.normalize();

    switch (this._lastKeyCode) {
      case 87: // w key
      case 38: // arrow upper key
        {
          const horizontalDir = new MutableVector3(
            this._currentDir.x,
            0,
            this._currentDir.z
          ).normalize();
          this._currentPos.add(
            Vector3.multiply(horizontalDir, this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(horizontalDir, this._horizontalSpeed)
          );
        }
        break;
      case 65: // a key
      case 37: // arrow left key
        {
          const horizontalDir = new MutableVector3(
            this._currentDir.x,
            0,
            this._currentDir.z
          ).normalize();
          const leftDir = Matrix33.rotateY(90).multiplyVector(horizontalDir);
          this._currentPos.add(
            Vector3.multiply(leftDir, this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(leftDir, this._horizontalSpeed)
          );
        }
        break;
      case 83: // s key
      case 40: // arrow down key
        {
          const horizontalDir = new MutableVector3(
            this._currentDir.x,
            0,
            this._currentDir.z
          ).normalize();
          this._currentPos.add(
            Vector3.multiply(horizontalDir, -this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(horizontalDir, -this._horizontalSpeed)
          );
        }
        break;
      case 68: // d key
      case 39: // arrow right key
        {
          const horizontalDir = new MutableVector3(
            this._currentDir.x,
            0,
            this._currentDir.z
          ).normalize();
          const rightDir = Matrix33.rotateY(-90).multiplyVector(horizontalDir);
          this._currentPos.add(
            Vector3.multiply(rightDir, this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(rightDir, this._horizontalSpeed)
          );
        }
        break;
      case 81: // q key
        {
          this._currentPos.add(
            Vector3.multiply(this._newDir, -this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(this._newDir, -this._horizontalSpeed)
          );
        }
        break;
      case 69: // e key
        {
          this._currentPos.add(
            Vector3.multiply(this._newDir, this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(this._newDir, this._horizontalSpeed)
          );
        }
        break;
      case 82: // r key
        this._currentPos.add(new Vector3(0, this._virticalSpeed, 0));
        this._currentCenter.add(new Vector3(0, this._virticalSpeed, 0));
        break;
      case 70: // f key
        this._currentPos.add(new Vector3(0, -this._virticalSpeed, 0));
        this._currentCenter.add(new Vector3(0, -this._virticalSpeed, 0));
        break;
    }

    if (this._isMouseDrag) {
      if (this._inverseHorizontalRotating) {
        this._deltaX = this._deltaMouseXOnCanvas * this._mouseXAdjustScale;
      } else {
        this._deltaX = -this._deltaMouseXOnCanvas * this._mouseXAdjustScale;
      }
      if (this._inverseVirticalRotating) {
        this._deltaY += this._deltaMouseYOnCanvas * this._mouseYAdjustScale;
      } else {
        this._deltaY += -this._deltaMouseYOnCanvas * this._mouseYAdjustScale;
      }
      this._deltaY = Math.max(-120, Math.min(50, this._deltaY));

      this._currentDir = Matrix33.rotateY(this._deltaX).multiplyVector(
        this._currentDir
      );

      newEyeToCenter = Matrix33.rotateY(this._deltaX).multiplyVector(
        Vector3.subtract(this._currentCenter, this._currentPos)
      );
      newEyeToCenter.x = newEyeToCenter.x * (1 - t);
      newEyeToCenter.y = t;
      newEyeToCenter.z = newEyeToCenter.z * (1 - t);
      newEyeToCenter.normalize();
      this._currentCenter = Vector3.add(this._currentPos, newEyeToCenter);

      this._clickedMouseXOnCanvas = this._draggedMouseXOnCanvas;
      this._clickedMouseYOnCanvas = this._draggedMouseYOnCanvas;
      this._deltaMouseXOnCanvas = 0;
      this._deltaMouseYOnCanvas = 0;
    }

    let newLeft = camera.left;
    let newRight = camera.right;
    let newTop = camera.top;
    let newBottom = camera.bottom;

    return [
      this._currentPos,
      this._currentCenter,
      camera.up.clone(),
      camera.zNear,
      camera.zFar,
      newLeft,
      newRight,
      newTop,
      newBottom
    ];
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

  set virticalSpeed(value) {
    this._virticalSpeed = value;
  }

  get virticalSpeed() {
    return this._virticalSpeed;
  }

  get allInfo() {
    const info: any = {};

    info.virticalSpeed = this.virticalSpeed;
    info.horizontalSpeed = this.horizontalSpeed;
    info._turnSpeed = this._turnSpeed;
    info.shiftCameraTo = this.shiftCameraTo;
    info.zFarAdjustingFactorBasedOnAABB = this.zFarAdjustingFactorBasedOnAABB;
    info.target = this.target;
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

