
declare namespace effekseer {

    /**
    * Initialize Effekseer.js.
    * This function must be called at first if use WebAssembly
    * @param {string} path A file of webassembply
    * @param {function=} onload A function that is called at loading complete
    * @param {function=} onerror A function that is called at loading error.
    */
    export function initRuntime(path: string, onload: () => void, onerror: () => void): void;

    /**
    * Create a context to render in multiple scenes
    * @returns {EffekseerContext} context
    */
    export function createContext(): EffekseerContext;

    /**
    * Release specified context. After that, don't touch a context
    * @param {EffekseerContext} context context
    */
    export function releaseContext(context: EffekseerContext): void;

    /**
     * Set the flag whether Effekseer show logs
     * @param {boolean} flag
     */
    export function setSetLogEnabled(flag: boolean): void;

    /**
    * Set the string of cross origin for images
    * @param {string} crossOrigin
    */
    export function setImageCrossOrigin(crossOrigin: string): void;

    /**
         * Initialize graphics system.
         * @param {WebGLRenderingContext} webglContext WebGL Context
         * @param {object} settings Some settings with Effekseer initialization
         */
    export function init(webglContext: WebGLRenderingContext, settings?: object): void;

    /**
     * Advance frames.
     * @param {number=} deltaFrames number of advance frames
     */
    export function update(deltaFrames?: number): void;

    /**
     * Main rendering.
     */
    export function draw(): void;

    /**
     * Set camera projection from matrix.
     * @param matrixArray An array that is requred 16 elements
     */
    export function setProjectionMatrix(matrixArray: Float32Array): void;

    /**
     * Set camera projection from perspective parameters.
     * @param {number} fov Field of view in degree
     * @param {number} aspect Aspect ratio
     * @param {number} near Distance of near plane
     * @param {number} aspect Distance of far plane
     */
    export function setProjectionPerspective(fov: number, aspect: number, near: number, far: number): void;

    /**
     * Set camera projection from orthographic parameters.
     * @param {number} width Width coordinate of the view plane
     * @param {number} height Height coordinate of the view plane
     * @param {number} near Distance of near plane
     * @param {number} aspect Distance of far plane
     */
    export function setProjectionOrthographic(width: number, height: number, near: number, far: number): void;

    /**
     * Set camera view from matrix.
     * @param matrixArray An array that is requred 16 elements
     */
    export function setCameraMatrix(matrixArray: Float32Array): void;

    /**
     * Set camera view from lookat parameters.
     * @param {number} positionX X value of camera position
     * @param {number} positionY Y value of camera position
     * @param {number} positionZ Z value of camera position
     * @param {number} targetX X value of target position
     * @param {number} targetY Y value of target position
     * @param {number} targetZ Z value of target position
     * @param {number} upvecX X value of upper vector
     * @param {number} upvecY Y value of upper vector
     * @param {number} upvecZ Z value of upper vector
     */
    export function setCameraLookAt(
        positionX: number,
        positionY: number,
        positionZ: number,
        targetX: number,
        targetY: number,
        targetZ: number,
        upvecX: number,
        upvecY: number,
        upvecZ: number
    ): void;

    /**
     * Set camera view from lookat vector parameters.
     * @param {object} position camera position
     * @param {object} target target position
     * @param {object=} upvec upper vector
     */
    export function setCameraLookAtFromVector(position: object, target: object, upvec?: object): void;

    /**
     * Load the effect data file (and resources).
     * @param {string|ArrayBuffer} data A URL/ArrayBuffer of effect file (*.efk)
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @returns {EffekseerEffect} The effect data
     */
    export function loadEffect(path: string, scale?: number, onload?: () => void, onerror?: (reason: string, path: string) => void): EffekseerEffect;
    /**
     * Load the effect package file (resources included in the package).
     * @param {string|ArrayBuffer} data A URL/ArrayBuffer of effect file (*.efk)
     * @param {Object} Unzip An Unzip object.
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @returns {EffekseerEffect} The effect data
     */
    export function loadEffectPackage(data: string|ArrayBuffer, Unzip: Object, scale?: number, onload?: () => void, onerror?: (reason: string, path: string) => void): EffekseerEffect;
    /**
    * Release the specified effect. Don't touch the instance of effect after released.
    * @param {EffekseerEffect} effect The loaded effect
    */
    export function releaseEffect(effect: EffekseerEffect): void;

    /**
     * Play the specified effect.
     * @param {EffekseerEffect} effect The loaded effect
     * @param {number} x X value of location that is emited
     * @param {number} y Y value of location that is emited
     * @param {number} z Z value of location that is emited
     * @returns {EffekseerHandle} The effect handle
     */
    export function play(effect: EffekseerEffect, x: number, y: number, z: number): EffekseerHandle;

    /**
     * Stop the all effects.
     */
    export function stopAll(): void;

    /**
     * Set the resource loader function.
     * @param {function} loader
     */
    export function setResourceLoader(loader: (path: string, onload?: () => void, onerror?: (reason: string, path: string) => void) => void): void;

    /**
    * Get whether VAO is supported
    */
    export function isVertexArrayObjectSupported(): boolean;

    export class EffekseerContext {
        /**
             * Initialize graphics system.
             * @param {WebGLRenderingContext} webglContext WebGL Context
             * @param {object} settings Some settings with Effekseer initialization
             */
        init(webglContext: WebGLRenderingContext, settings?: object): void;

        /**
         * Advance frames.
         * @param {number=} deltaFrames number of advance frames
         */
        update(deltaFrames?: number): void;

        /**
         * Main rendering.
         */
        draw(): void;

        /**
         * Set camera projection from matrix.
         * @param matrixArray An array that is requred 16 elements
         */
        setProjectionMatrix(matrixArray: Float32Array): void;

        /**
         * Set camera projection from perspective parameters.
         * @param {number} fov Field of view in degree
         * @param {number} aspect Aspect ratio
         * @param {number} near Distance of near plane
         * @param {number} aspect Distance of far plane
         */
        setProjectionPerspective(fov: number, aspect: number, near: number, far: number): void;

        /**
         * Set camera projection from orthographic parameters.
         * @param {number} width Width coordinate of the view plane
         * @param {number} height Height coordinate of the view plane
         * @param {number} near Distance of near plane
         * @param {number} aspect Distance of far plane
         */
        setProjectionOrthographic(width: number, height: number, near: number, far: number): void;

        /**
         * Set camera view from matrix.
         * @param matrixArray An array that is requred 16 elements
         */
        setCameraMatrix(matrixArray: Float32Array): void;

        /**
         * Set camera view from lookat parameters.
         * @param {number} positionX X value of camera position
         * @param {number} positionY Y value of camera position
         * @param {number} positionZ Z value of camera position
         * @param {number} targetX X value of target position
         * @param {number} targetY Y value of target position
         * @param {number} targetZ Z value of target position
         * @param {number} upvecX X value of upper vector
         * @param {number} upvecY Y value of upper vector
         * @param {number} upvecZ Z value of upper vector
         */
        setCameraLookAt(
            positionX: number,
            positionY: number,
            positionZ: number,
            targetX: number,
            targetY: number,
            targetZ: number,
            upvecX: number,
            upvecY: number,
            upvecZ: number
        ): void;

        /**
         * Set camera view from lookat vector parameters.
         * @param {object} position camera position
         * @param {object} target target position
         * @param {object=} upvec upper vector
         */
        setCameraLookAtFromVector(position: object, target: object, upvec?: object): void;

        /**
         * Load the effect data file (and resources).
         * @param {string|ArrayBuffer} data A URL/ArrayBuffer of effect file (*.efk)
         * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
         * @param {function=} onload A function that is called at loading complete
         * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
         * @param {function=} redirect A function to redirect a path. First argument is an url and return redirected url.
         * @returns {EffekseerEffect} The effect data
         */
        loadEffect(path: string, scale?: number, onload?: () => void, onerror?: (reason: string, path: string) => void, redirect?: (path: string) => string): EffekseerEffect;

        /**
         * Load the effect package file (resources included in the package).
         * @param {string|ArrayBuffer} data A URL/ArrayBuffer of effect file (*.efk)
         * @param {Object} Unzip An Unzip object.
         * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
         * @param {function=} onload A function that is called at loading complete
         * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
         * @returns {EffekseerEffect} The effect data
         */
        loadEffectPackage(data: string|ArrayBuffer, Unzip: Object, scale?: number, onload?: () => void, onerror?: (reason: string, path: string) => void): EffekseerEffect;

        /**
        * Release the specified effect. Don't touch the instance of effect after released.
        * @param {EffekseerEffect} effect The loaded effect
        */
        releaseEffect(effect: EffekseerEffect): void;

        /**
         * Play the specified effect.
         * @param {EffekseerEffect} effect The loaded effect
         * @param {number} x X value of location that is emited
         * @param {number} y Y value of location that is emited
         * @param {number} z Z value of location that is emited
         * @returns {EffekseerHandle} The effect handle
         */
        play(effect: EffekseerEffect, x: number, y: number, z: number): EffekseerHandle;

        /**
         * Stop the all effects.
         */
        stopAll(): void;

        /**
         * Set the resource loader function.
         * @param {function} loader
         */
        setResourceLoader(loader: (path: string, onload?: () => void, onerror?: (reason: string, path: string) => void) => void): void;

        /**
        * Get whether VAO is supported
        */
        isVertexArrayObjectSupported(): boolean;

        /**
         * Gets the number of remaining allocated instances.
         */
        getRestInstancesCount(): Number;

        /**
         * Gets a time when updating
         */
        getUpdateTime(): Number;

        /**
         * Gets a time when drawing
         */
        getDrawTime(): Number;

        /**
         * Set the flag whether the library restores OpenGL states 
         * if specified true, it makes slow.
         * if specified false, You need to restore OpenGL states by yourself
         * it must be called after init
         * @param {boolean} flag
         */
        setRestorationOfStatesFlag(flag: boolean): void;

        /**
         * Capture current frame buffer and set the image as a background
         * @param {number} x captured image's x offset
         * @param {number} y captured image's y offset
         * @param {number} width captured image's width
         * @param {number} height captured image's height
         */
        captureBackground(x: number, y: number, width: number, height: number): void;

        /**
         * Reset background
         */
        resetBackground(): void;
    }

    export class EffekseerEffect {
        constructor();
    }

    export class EffekseerHandle {
        constructor(native: any);

        /**
         * Stop this effect instance.
         */
        stop(): void;

        /**
         * Stop the root node of this effect instance.
         */
        stopRoot(): void;

        /**
         * if returned false, this effect is end of playing.
         */
        readonly exists: boolean;

        /**
         * Set the location of this effect instance.
         * @param {number} x X value of location
         * @param {number} y Y value of location
         * @param {number} z Z value of location
         */
        setLocation(x: number, y: number, z: number): void;
        /**
         * Set the rotation of this effect instance.
         * @param {number} x X value of euler angle
         * @param {number} y Y value of euler angle
         * @param {number} z Z value of euler angle
         */
        setRotation(x: number, y: number, z: number): void;

        /**
         * Set the scale of this effect instance.
         * @param {number} x X value of scale factor
         * @param {number} y Y value of scale factor
         * @param {number} z Z value of scale factor
         */
        setScale(x: number, y: number, z: number): void;

        /**
         * Set the model matrix of this effect instance.
         * @param {array} matrixArray An array that is requred 16 elements
         */
        setMatrix(matrixArray: Float32Array): void;

        /**
         * Set the target location of this effect instance.
         * @param {number} x X value of target location
         * @param {number} y Y value of target location
         * @param {number} z Z value of target location
         */
        setTargetLocation(x: number, y: number, z: number): void;

        /**
         * get a dynamic parameter, which changes effect parameters dynamically while playing
         * @param {number} index slot index
         * @returns {number} value
         */
        getDynamicInput(index: number): number;

        /**
         * specfiy a dynamic parameter, which changes effect parameters dynamically while playing
         * @param {number} index slot index
         * @param {number} value value
         */
        setDynamicInput(index: number, value: number): void;

        /**
         * Set the paused flag of this effect instance.
         * if specified true, this effect playing will not advance.
         * @param {boolean} paused Paused flag
         */
        setPaused(paused: boolean): void;

        /**
         * Set the shown flag of this effect instance.
         * if specified false, this effect will be invisible.
         * @param {boolean} shown Shown flag
         */
        setShown(shown: boolean): void;
        /**
         * Set playing speed of this effect.
         * @param {number} speed Speed ratio
         */
        setSpeed(speed: number): void;
        /**
         * Set random seed of this effect.
         * @param {number} seed random seed
         */
        setRandomSeed(seed: number): void;
    }
}

declare module "effekseer" {
    export = effekseer;
}
