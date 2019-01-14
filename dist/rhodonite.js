(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.rhodonite = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    var CGAPIResourceRepository = /** @class */ (function () {
        function CGAPIResourceRepository() {
        }
        CGAPIResourceRepository.InvalidCGAPIResourceUid = -1;
        return CGAPIResourceRepository;
    }());

    // This code idea is from https://qiita.com/junkjunctions/items/5a6d8bed8df8eb3acceb
    var EnumClass = /** @class */ (function () {
        function EnumClass(_a) {
            var index = _a.index, str = _a.str;
            if (EnumClass.__indices.get(this.constructor) == null) {
                EnumClass.__indices.set(this.constructor, []);
            }
            if (EnumClass.__strings.get(this.constructor) == null) {
                EnumClass.__strings.set(this.constructor, []);
            }
            if (EnumClass.__indices.get(this.constructor).indexOf(index) !== -1) {
                throw new Error('Dont use duplicate index.');
            }
            if (EnumClass.__strings.get(this.constructor).indexOf(str) !== -1) {
                throw new Error('Dont use duplicate str.');
            }
            this.index = index;
            this.str = str;
            EnumClass.__indices.get(this.constructor).push(index);
            EnumClass.__strings.get(this.constructor).push(str);
        }
        EnumClass.prototype.toString = function () {
            return this.str;
        };
        EnumClass.prototype.toJSON = function () {
            return this.index;
        };
        EnumClass.__indices = new Map();
        EnumClass.__strings = new Map();
        return EnumClass;
    }());
    function _from(_a) {
        var typeList = _a.typeList, index = _a.index;
        var match = typeList.find(function (type) { return type.index === index; });
        if (!match) {
            throw new Error("Invalid PrimitiveMode index: [" + index + "]");
        }
        return match;
    }
    function _fromString(_a) {
        var typeList = _a.typeList, str = _a.str;
        var match = typeList.find(function (type) { return type.str === str; });
        if (!match) {
            throw new Error("Invalid PrimitiveMode index: [" + str + "]");
        }
        return match;
    }

    var VertexAttributeClass = /** @class */ (function (_super) {
        __extends(VertexAttributeClass, _super);
        function VertexAttributeClass(_a) {
            var index = _a.index, str = _a.str, attributeSlot = _a.attributeSlot;
            var _this = _super.call(this, { index: index, str: str }) || this;
            _this.__attributeSlot = attributeSlot;
            return _this;
        }
        VertexAttributeClass.prototype.getAttributeSlot = function () {
            return this.__attributeSlot;
        };
        return VertexAttributeClass;
    }(EnumClass));
    var Unknown = new VertexAttributeClass({ index: -1, str: 'UNKNOWN', attributeSlot: -1 });
    var Position = new VertexAttributeClass({ index: 0, str: 'POSITION', attributeSlot: 0 });
    var Normal = new VertexAttributeClass({ index: 1, str: 'NORMAL', attributeSlot: 1 });
    var Tangent = new VertexAttributeClass({ index: 2, str: 'TANGENT', attributeSlot: 2 });
    var Texcoord0 = new VertexAttributeClass({ index: 3, str: 'TEXCOORD_0', attributeSlot: 3 });
    var Texcoord1 = new VertexAttributeClass({ index: 4, str: 'TEXCOORD_1', attributeSlot: 4 });
    var Color0 = new VertexAttributeClass({ index: 5, str: 'COLOR_0', attributeSlot: 5 });
    var Joints0 = new VertexAttributeClass({ index: 6, str: 'JOINTS_0', attributeSlot: 6 });
    var Weights0 = new VertexAttributeClass({ index: 7, str: 'WEIGHTS_0', attributeSlot: 7 });
    var Instance = new VertexAttributeClass({ index: 8, str: 'INSTANCE', attributeSlot: 4 });
    var typeList = [Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, Instance];
    function from(index) {
        return _from({ typeList: typeList, index: index });
    }
    function fromString(str) {
        return _fromString({ typeList: typeList, str: str });
    }
    var VertexAttribute = Object.freeze({
        Unknown: Unknown, Position: Position, Normal: Normal, Tangent: Tangent, Texcoord0: Texcoord0, Texcoord1: Texcoord1, Color0: Color0, Joints0: Joints0, Weights0: Weights0, Instance: Instance, from: from, fromString: fromString
    });

    var CompositionTypeClass = /** @class */ (function (_super) {
        __extends(CompositionTypeClass, _super);
        function CompositionTypeClass(_a) {
            var index = _a.index, str = _a.str, numberOfComponents = _a.numberOfComponents;
            var _this = _super.call(this, { index: index, str: str }) || this;
            _this.__numberOfComponents = 0;
            _this.__numberOfComponents = numberOfComponents;
            return _this;
        }
        CompositionTypeClass.prototype.getNumberOfComponents = function () {
            return this.__numberOfComponents;
        };
        return CompositionTypeClass;
    }(EnumClass));
    var Unknown$1 = new CompositionTypeClass({ index: -1, str: 'UNKNOWN', numberOfComponents: 0 });
    var Scalar = new CompositionTypeClass({ index: 0, str: 'SCALAR', numberOfComponents: 1 });
    var Vec2 = new CompositionTypeClass({ index: 1, str: 'VEC2', numberOfComponents: 2 });
    var Vec3 = new CompositionTypeClass({ index: 2, str: 'VEC3', numberOfComponents: 3 });
    var Vec4 = new CompositionTypeClass({ index: 3, str: 'VEC4', numberOfComponents: 4 });
    var Mat2 = new CompositionTypeClass({ index: 4, str: 'MAT2', numberOfComponents: 4 });
    var Mat3 = new CompositionTypeClass({ index: 5, str: 'MAT3', numberOfComponents: 9 });
    var Mat4 = new CompositionTypeClass({ index: 6, str: 'MAT4', numberOfComponents: 16 });
    var typeList$1 = [Unknown$1, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4];
    function from$1(index) {
        return _from({ typeList: typeList$1, index: index });
    }
    function fromString$1(str) {
        return _fromString({ typeList: typeList$1, str: str });
    }
    var CompositionType = Object.freeze({ Unknown: Unknown$1, Scalar: Scalar, Vec2: Vec2, Vec3: Vec3, Vec4: Vec4, Mat2: Mat2, Mat3: Mat3, Mat4: Mat4, from: from$1, fromString: fromString$1 });

    var ComponentTypeClass = /** @class */ (function (_super) {
        __extends(ComponentTypeClass, _super);
        function ComponentTypeClass(_a) {
            var index = _a.index, str = _a.str, sizeInBytes = _a.sizeInBytes;
            var _this = _super.call(this, { index: index, str: str }) || this;
            _this.__sizeInBytes = sizeInBytes;
            return _this;
        }
        ComponentTypeClass.prototype.getSizeInBytes = function () {
            return this.__sizeInBytes;
        };
        return ComponentTypeClass;
    }(EnumClass));
    var Unknown$2 = new ComponentTypeClass({ index: 5119, str: 'UNKNOWN', sizeInBytes: 0 });
    var Byte = new ComponentTypeClass({ index: 5120, str: 'BYTE', sizeInBytes: 1 });
    var UnsignedByte = new ComponentTypeClass({ index: 5121, str: 'UNSIGNED_BYTE', sizeInBytes: 1 });
    var Short = new ComponentTypeClass({ index: 5122, str: 'SHORT', sizeInBytes: 2 });
    var UnsignedShort = new ComponentTypeClass({ index: 5123, str: 'UNSIGNED_SHORT', sizeInBytes: 2 });
    var Int = new ComponentTypeClass({ index: 5124, str: 'INT', sizeInBytes: 4 });
    var UnsingedInt = new ComponentTypeClass({ index: 5125, str: 'UNSIGNED_INT', sizeInBytes: 4 });
    var Float = new ComponentTypeClass({ index: 5126, str: 'FLOAT', sizeInBytes: 4 });
    var Double = new ComponentTypeClass({ index: 5127, str: 'DOUBLE', sizeInBytes: 8 });
    var HalfFloat = new ComponentTypeClass({ index: 0x8D61, str: 'HALF_FLOAT_OES', sizeInBytes: 2 });
    var typeList$2 = [Unknown$2, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsingedInt, Float, Double, HalfFloat];
    function from$2(index) {
        return _from({ typeList: typeList$2, index: index });
    }
    function fromTypedArray(typedArray) {
        if (typedArray instanceof Int8Array) {
            return Byte;
        }
        else if (typedArray instanceof Uint8Array || typedArray instanceof Uint8ClampedArray) {
            return UnsignedByte;
        }
        else if (typedArray instanceof Int16Array) {
            return Short;
        }
        else if (typedArray instanceof Uint16Array) {
            return UnsignedShort;
        }
        else if (typedArray instanceof Int32Array) {
            return Int;
        }
        else if (typedArray instanceof Uint32Array) {
            return UnsingedInt;
        }
        else if (typedArray instanceof Float32Array) {
            return Float;
        }
        else if (typedArray instanceof Float64Array) {
            return Double;
        }
        return Unknown$2;
    }
    var ComponentType = Object.freeze({ Unknown: Unknown$2, Byte: Byte, UnsignedByte: UnsignedByte, Short: Short, UnsignedShort: UnsignedShort, Int: Int, UnsingedInt: UnsingedInt, Float: Float, Double: Double, HalfFloat: HalfFloat, from: from$2, fromTypedArray: fromTypedArray });

    var WebGLExtensionClass = /** @class */ (function (_super) {
        __extends(WebGLExtensionClass, _super);
        function WebGLExtensionClass(_a) {
            var index = _a.index, str = _a.str;
            return _super.call(this, { index: index, str: str }) || this;
        }
        return WebGLExtensionClass;
    }(EnumClass));
    var VertexArrayObject = new WebGLExtensionClass({ index: 1, str: 'OES_vertex_array_object' });
    var TextureFloat = new WebGLExtensionClass({ index: 2, str: 'OES_texture_float' });
    var TextureHalfFloat = new WebGLExtensionClass({ index: 3, str: 'OES_texture_half_float' });
    var TextureFloatLinear = new WebGLExtensionClass({ index: 4, str: 'OES_texture_float_linear' });
    var TextureHalfFloatLinear = new WebGLExtensionClass({ index: 5, str: 'OES_texture_half_float_linear' });
    var InstancedArrays = new WebGLExtensionClass({ index: 6, str: 'ANGLE_instanced_arrays' });
    var WebGLExtension = Object.freeze({ VertexArrayObject: VertexArrayObject, TextureFloat: TextureFloat, TextureHalfFloat: TextureHalfFloat, TextureFloatLinear: TextureFloatLinear, TextureHalfFloatLinear: TextureHalfFloatLinear, InstancedArrays: InstancedArrays });

    var WebGLContextWrapper = /** @class */ (function () {
        function WebGLContextWrapper(gl) {
            this.__webglVersion = 1;
            this.__extensions = new Map();
            this.__gl = gl;
            if (this.__gl.constructor.name === 'WebGL2RenderingContext') {
                this.__webglVersion = 2;
            }
            else {
                this.__webgl1ExtVAO = this.__getExtension(WebGLExtension.VertexArrayObject);
                this.__webgl1ExtIA = this.__getExtension(WebGLExtension.InstancedArrays);
                this.__webgl1ExtTF = this.__getExtension(WebGLExtension.TextureFloat);
                this.__webgl1ExtTHF = this.__getExtension(WebGLExtension.TextureHalfFloat);
                this.__webgl1ExtTFL = this.__getExtension(WebGLExtension.TextureFloatLinear);
                this.__webgl1ExtTHFL = this.__getExtension(WebGLExtension.TextureHalfFloatLinear);
            }
        }
        WebGLContextWrapper.prototype.getRawContext = function () {
            return this.__gl;
        };
        WebGLContextWrapper.prototype.isSupportWebGL1Extension = function (webGLExtension) {
            if (this.__getExtension(webGLExtension)) {
                return true;
            }
            else {
                return false;
            }
        };
        Object.defineProperty(WebGLContextWrapper.prototype, "isWebGL2", {
            get: function () {
                if (this.__webglVersion === 2) {
                    return true;
                }
                else {
                    return false;
                }
            },
            enumerable: true,
            configurable: true
        });
        WebGLContextWrapper.prototype.createVertexArray = function () {
            if (this.isWebGL2) {
                return this.__gl.createVertexArray();
            }
            else {
                if (this.__webgl1ExtVAO != null) {
                    return this.__webgl1ExtVAO.createVertexArrayOES();
                }
            }
        };
        WebGLContextWrapper.prototype.bindVertexArray = function (vao) {
            if (this.isWebGL2) {
                this.__gl.bindVertexArray(vao);
            }
            else {
                if (this.__webgl1ExtVAO != null) {
                    this.__webgl1ExtVAO.bindVertexArrayOES(vao);
                }
            }
        };
        WebGLContextWrapper.prototype.vertexAttribDivisor = function (index, divisor) {
            if (this.isWebGL2) {
                this.__gl.vertexAttribDivisor(index, divisor);
            }
            else {
                this.__webgl1ExtIA.vertexAttribDivisorANGLE(index, divisor);
            }
        };
        WebGLContextWrapper.prototype.drawElementsInstanced = function (primitiveMode, indexCount, type, offset, instanceCount) {
            if (this.isWebGL2) {
                this.__gl.drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount);
            }
            else {
                this.__webgl1ExtIA.drawElementsInstancedANGLE(primitiveMode, indexCount, type, offset, instanceCount);
            }
        };
        WebGLContextWrapper.prototype.__getExtension = function (extension) {
            var gl = this.__gl;
            if (!this.__extensions.has(extension)) {
                var extObj = gl.getExtension(extension.toString());
                if (extObj == null) {
                    var text = "The library does not support this environment because the " + extension.toString() + " is not available";
                    if (console.error != null) {
                        console.error(text);
                    }
                    else {
                        console.log(text);
                    }
                }
                this.__extensions.set(extension, extObj);
                return extObj;
            }
            return this.__extensions.get(extension);
        };
        return WebGLContextWrapper;
    }());

    var WebGLResourceRepository = /** @class */ (function (_super) {
        __extends(WebGLResourceRepository, _super);
        function WebGLResourceRepository() {
            var _this = _super.call(this) || this;
            _this.__webglContexts = new Map();
            _this.__resourceCounter = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            _this.__webglResources = new Map();
            _this.__extensions = new Map();
            return _this;
        }
        WebGLResourceRepository.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new WebGLResourceRepository();
            }
            return this.__instance;
        };
        WebGLResourceRepository.prototype.addWebGLContext = function (gl, asCurrent) {
            var glw = new WebGLContextWrapper(gl);
            this.__webglContexts.set('default', glw);
            if (asCurrent) {
                this.__glw = glw;
            }
        };
        Object.defineProperty(WebGLResourceRepository.prototype, "currentWebGLContextWrapper", {
            get: function () {
                return this.__glw;
            },
            enumerable: true,
            configurable: true
        });
        WebGLResourceRepository.prototype.getResourceNumber = function () {
            return ++this.__resourceCounter;
        };
        WebGLResourceRepository.prototype.getWebGLResource = function (WebGLResourceHandle) {
            return this.__webglResources.get(WebGLResourceHandle);
        };
        WebGLResourceRepository.prototype.createIndexBuffer = function (accsessor) {
            var gl = this.__glw.getRawContext();
            if (gl == null) {
                throw new Error("No WebGLRenderingContext set as Default.");
            }
            var ibo = gl.createBuffer();
            var resourceHandle = this.getResourceNumber();
            this.__webglResources.set(resourceHandle, ibo);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, accsessor.getTypedArray(), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return resourceHandle;
        };
        WebGLResourceRepository.prototype.createVertexBuffer = function (accessor) {
            var gl = this.__glw.getRawContext();
            if (gl == null) {
                throw new Error("No WebGLRenderingContext set as Default.");
            }
            var vbo = gl.createBuffer();
            var resourceHandle = this.getResourceNumber();
            this.__webglResources.set(resourceHandle, vbo);
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, accessor.getTypedArray(), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            return resourceHandle;
        };
        WebGLResourceRepository.prototype.createVertexArray = function () {
            var gl = this.__glw;
            if (gl == null) {
                throw new Error("No WebGLRenderingContext set as Default.");
            }
            var vao = this.__glw.createVertexArray();
            var resourceHandle = this.getResourceNumber();
            this.__webglResources.set(resourceHandle, vao);
            return resourceHandle;
        };
        WebGLResourceRepository.prototype.createVertexDataResources = function (primitive) {
            var _this = this;
            var gl = this.__glw.getRawContext();
            var vaoHandle = this.createVertexArray();
            var iboHandle;
            if (primitive.hasIndices) {
                iboHandle = this.createIndexBuffer(primitive.indicesAccessor);
            }
            var vboHandles = [];
            primitive.attributeAccessors.forEach(function (accessor) {
                var vboHandle = _this.createVertexBuffer(accessor);
                vboHandles.push(vboHandle);
            });
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return { vaoHandle: vaoHandle, iboHandle: iboHandle, vboHandles: vboHandles };
        };
        WebGLResourceRepository.prototype.createShaderProgram = function (_a) {
            var vertexShaderStr = _a.vertexShaderStr, fragmentShaderStr = _a.fragmentShaderStr, attributeNames = _a.attributeNames, attributeSemantics = _a.attributeSemantics;
            var gl = this.__glw.getRawContext();
            if (gl == null) {
                throw new Error("No WebGLRenderingContext set as Default.");
            }
            var vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vertexShaderStr);
            gl.compileShader(vertexShader);
            this.__checkShaderCompileStatus(vertexShader, vertexShaderStr);
            var shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            var fragmentShader;
            if (fragmentShaderStr != null) {
                fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(fragmentShader, fragmentShaderStr);
                gl.compileShader(fragmentShader);
                this.__checkShaderCompileStatus(fragmentShader, fragmentShaderStr);
                gl.attachShader(shaderProgram, fragmentShader);
            }
            attributeNames.forEach(function (attributeName, i) {
                gl.bindAttribLocation(shaderProgram, attributeSemantics[i].getAttributeSlot(), attributeName);
            });
            gl.linkProgram(shaderProgram);
            var resourceHandle = this.getResourceNumber();
            this.__webglResources.set(resourceHandle, shaderProgram);
            this.__checkShaderProgramLinkStatus(shaderProgram);
            gl.deleteShader(vertexShader);
            if (fragmentShaderStr != null) {
                gl.deleteShader(fragmentShader);
            }
            return resourceHandle;
        };
        WebGLResourceRepository.prototype.__addLineNumber = function (shaderString) {
            var shaderTextLines = shaderString.split(/\r\n|\r|\n/);
            var shaderTextWithLineNumber = '';
            for (var i = 0; i < shaderTextLines.length; i++) {
                var lineIndex = i + 1;
                var splitter = ' : ';
                if (lineIndex < 10) {
                    splitter = '  : ';
                }
                else if (lineIndex >= 100) {
                    splitter = ': ';
                }
                shaderTextWithLineNumber += lineIndex + splitter + shaderTextLines[i] + '\n';
            }
            return shaderTextWithLineNumber;
        };
        WebGLResourceRepository.prototype.__checkShaderCompileStatus = function (shader, shaderText) {
            var gl = this.__glw.getRawContext();
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.log(this.__addLineNumber(shaderText));
                throw new Error('An error occurred compiling the shaders:' + gl.getShaderInfoLog(shader));
            }
        };
        WebGLResourceRepository.prototype.__checkShaderProgramLinkStatus = function (shaderProgram) {
            var gl = this.__glw.getRawContext();
            // If creating the shader program failed, alert
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            }
        };
        WebGLResourceRepository.prototype.setVertexDataToPipeline = function (_a, primitive, instanceIDBufferUid) {
            var _this = this;
            var vaoHandle = _a.vaoHandle, iboHandle = _a.iboHandle, vboHandles = _a.vboHandles;
            if (instanceIDBufferUid === void 0) { instanceIDBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid; }
            var gl = this.__glw.getRawContext();
            var vao = this.getWebGLResource(vaoHandle);
            // VAO bind
            this.__glw.bindVertexArray(vao);
            // IBO bind
            if (iboHandle != null) {
                var ibo = this.getWebGLResource(iboHandle);
                if (ibo != null) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                }
                else {
                    throw new Error('Nothing Element Array Buffer!');
                }
            }
            // bind vertex attributes to VBO's
            vboHandles.forEach(function (vboHandle, i) {
                var vbo = _this.getWebGLResource(vboHandle);
                if (vbo != null) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
                }
                else {
                    throw new Error('Nothing Element Array Buffer at index ' + i);
                }
                gl.enableVertexAttribArray(primitive.attributeSemantics[i].getAttributeSlot());
                gl.vertexAttribPointer(primitive.attributeSemantics[i].getAttributeSlot(), primitive.attributeCompositionTypes[i].getNumberOfComponents(), primitive.attributeComponentTypes[i].index, false, primitive.attributeAccessors[i].byteStride, 0);
            });
            /// for InstanceIDBuffer
            if (instanceIDBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                var instanceIDBuffer = this.getWebGLResource(instanceIDBufferUid);
                if (instanceIDBuffer != null) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, instanceIDBuffer);
                }
                else {
                    throw new Error('Nothing Element Array Buffer at index');
                }
                gl.enableVertexAttribArray(VertexAttribute.Instance.getAttributeSlot());
                gl.vertexAttribPointer(VertexAttribute.Instance.getAttributeSlot(), CompositionType.Scalar.getNumberOfComponents(), ComponentType.Float.index, false, 0, 0);
                this.__glw.vertexAttribDivisor(VertexAttribute.Instance.getAttributeSlot(), 1);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this.__glw.bindVertexArray(null);
            if (vao == null) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            }
        };
        WebGLResourceRepository.prototype.createTexture = function (typedArray, _a) {
            var level = _a.level, internalFormat = _a.internalFormat, width = _a.width, height = _a.height, border = _a.border, format = _a.format, type = _a.type, magFilter = _a.magFilter, minFilter = _a.minFilter, wrapS = _a.wrapS, wrapT = _a.wrapT;
            var gl = this.__glw.getRawContext();
            var dataTexture = gl.createTexture();
            var resourceHandle = this.getResourceNumber();
            this.__webglResources.set(resourceHandle, dataTexture);
            gl.bindTexture(gl.TEXTURE_2D, dataTexture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat.index, width, height, border, format.index, type.index, typedArray);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);
            return resourceHandle;
        };
        WebGLResourceRepository.prototype.updateTexture = function (textureUid, typedArray, _a) {
            var level = _a.level, width = _a.width, height = _a.height, format = _a.format, type = _a.type;
            var gl = this.__glw.getRawContext();
            var texture = this.getWebGLResource(textureUid);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texSubImage2D(gl.TEXTURE_2D, level, 0, 0, width, height, format.index, type.index, typedArray);
        };
        WebGLResourceRepository.prototype.deleteTexture = function (textureHandle) {
            var texture = this.getWebGLResource(textureHandle);
            var gl = this.__glw.getRawContext();
            if (texture != null) {
                gl.deleteTexture(texture);
                this.__webglResources.delete(textureHandle);
            }
        };
        WebGLResourceRepository.prototype.createUniformBuffer = function (bufferView) {
            var gl = this.__glw.getRawContext();
            if (gl == null) {
                throw new Error("No WebGLRenderingContext set as Default.");
            }
            var ubo = gl.createBuffer();
            var resourceHandle = this.getResourceNumber();
            this.__webglResources.set(resourceHandle, ubo);
            gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
            gl.bufferData(gl.UNIFORM_BUFFER, bufferView, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            return resourceHandle;
        };
        WebGLResourceRepository.prototype.updateUniformBuffer = function (uboUid, bufferView) {
            var gl = this.__glw.getRawContext();
            var ubo = this.getWebGLResource(uboUid);
            gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
            void gl.bufferSubData(gl.UNIFORM_BUFFER, 0, bufferView, 0);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        };
        WebGLResourceRepository.prototype.bindUniformBlock = function (shaderProgramUid, blockName, blockIndex) {
            var gl = this.__glw.getRawContext();
            if (gl == null) {
                throw new Error("No WebGLRenderingContext set as Default.");
            }
            var shaderProgram = this.getWebGLResource(shaderProgramUid);
            var block = gl.getUniformBlockIndex(shaderProgram, blockName);
            gl.uniformBlockBinding(shaderProgram, block, blockIndex);
        };
        WebGLResourceRepository.prototype.bindUniformBufferBase = function (blockIndex, uboUid) {
            var gl = this.__glw.getRawContext();
            if (gl == null) {
                throw new Error("No WebGLRenderingContext set as Default.");
            }
            var ubo = this.getWebGLResource(uboUid);
            gl.bindBufferBase(gl.UNIFORM_BUFFER, blockIndex, ubo);
        };
        WebGLResourceRepository.prototype.deleteUniformBuffer = function (uboUid) {
            var gl = this.__glw.getRawContext();
            var ubo = this.getWebGLResource(uboUid);
            gl.deleteBuffer(ubo);
        };
        WebGLResourceRepository.prototype.createTransformFeedback = function () {
            var gl = this.__glw.getRawContext();
            var transformFeedback = gl.createTransformFeedback();
            var resourceHandle = this.getResourceNumber();
            this.__webglResources.set(resourceHandle, transformFeedback);
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
            return resourceHandle;
        };
        WebGLResourceRepository.prototype.deleteTransformFeedback = function (transformFeedbackUid) {
            var gl = this.__glw.getRawContext();
            var transformFeedback = this.getWebGLResource(transformFeedbackUid);
            gl.deleteTransformFeedback(transformFeedback);
        };
        return WebGLResourceRepository;
    }(CGAPIResourceRepository));

    var TransformComponentTID = 1;
    var SceneGraphComponentTID = 2;
    var WellKnownComponentTIDs = Object.freeze({
        TransformComponentTID: TransformComponentTID,
        SceneGraphComponentTID: SceneGraphComponentTID
    });

    var Entity = /** @class */ (function () {
        function Entity(entityUID, isAlive, entityComponent) {
            this.__entity_uid = entityUID;
            this.__isAlive = isAlive;
            this.__entityRepository = entityComponent;
            this.__uniqueName = 'entity_of_uid_' + entityUID;
            Entity.__uniqueNames[entityUID] = this.__uniqueName;
        }
        Object.defineProperty(Entity.prototype, "entityUID", {
            get: function () {
                return this.__entity_uid;
            },
            enumerable: true,
            configurable: true
        });
        Entity.prototype.getComponent = function (componentTid) {
            var map = this.__entityRepository._components[this.entityUID];
            if (map != null) {
                var component = map.get(componentTid);
                if (component != null) {
                    return component;
                }
                else {
                    return null;
                }
            }
            return null;
        };
        Entity.prototype.getTransform = function () {
            if (this.__transformComponent == null) {
                this.__transformComponent = this.getComponent(WellKnownComponentTIDs.TransformComponentTID);
            }
            return this.__transformComponent;
        };
        Entity.prototype.getSceneGraph = function () {
            if (this.__sceneGraphComponent == null) {
                this.__sceneGraphComponent = this.getComponent(WellKnownComponentTIDs.SceneGraphComponentTID);
            }
            return this.__sceneGraphComponent;
        };
        Entity.prototype.tryToSetUniqueName = function (name, toAddNameIfConflict) {
            if (Entity.__uniqueNames.indexOf(name) !== -1) {
                // Conflict
                if (toAddNameIfConflict) {
                    var newName = name + '_(' + this.__uniqueName + ')';
                    if (Entity.__uniqueNames.indexOf(newName) === -1) {
                        this.__uniqueName = newName;
                        Entity.__uniqueNames[this.__entity_uid] = this.__uniqueName;
                        return true;
                    }
                }
                return false;
            }
            else {
                this.__uniqueName = name;
                Entity.__uniqueNames[this.__entity_uid] = this.__uniqueName;
                return true;
            }
        };
        Object.defineProperty(Entity.prototype, "uniqueName", {
            get: function () {
                return this.__uniqueName;
            },
            enumerable: true,
            configurable: true
        });
        Entity.invalidEntityUID = -1;
        Entity.__uniqueNames = [];
        return Entity;
    }());

    var RnObject = /** @class */ (function () {
        function RnObject(needToManage) {
            if (needToManage === void 0) { needToManage = false; }
            this.__objectUid = -1;
            if (needToManage) {
                this.__objectUid = ++RnObject.currentMaxObjectCount;
            }
        }
        Object.defineProperty(RnObject.prototype, "objectUid", {
            get: function () {
                return this.__objectUid;
            },
            enumerable: true,
            configurable: true
        });
        RnObject.currentMaxObjectCount = -1;
        RnObject.InvalidObjectUID = -1;
        return RnObject;
    }());

    var _Vector2 = /** @class */ (function () {
        function _Vector2(typedArray, x, y) {
            this.__typedArray = typedArray;
            if (ArrayBuffer.isView(x)) {
                this.v = x;
                return;
            }
            else {
                this.v = new typedArray(2);
            }
            this.x = x;
            this.y = y;
        }
        Object.defineProperty(_Vector2.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        _Vector2.prototype.clone = function () {
            return new _Vector2(this.__typedArray, this.x, this.y);
        };
        _Vector2.prototype.multiply = function (val) {
            this.x *= val;
            this.y *= val;
            return this;
        };
        _Vector2.prototype.isStrictEqual = function (vec) {
            if (this.x === vec.x && this.y === vec.y) {
                return true;
            }
            else {
                return false;
            }
        };
        _Vector2.prototype.isEqual = function (vec, delta) {
            if (delta === void 0) { delta = Number.EPSILON; }
            if (Math.abs(vec.x - this.x) < delta &&
                Math.abs(vec.y - this.y) < delta) {
                return true;
            }
            else {
                return false;
            }
        };
        _Vector2.multiply = function (typedArray, vec2, val) {
            return new _Vector2(typedArray, vec2.x * val, vec2.y * val);
        };
        Object.defineProperty(_Vector2.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(_Vector2.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(_Vector2.prototype, "raw", {
            get: function () {
                return this.v;
            },
            enumerable: true,
            configurable: true
        });
        return _Vector2;
    }());
    var Vector2_F64 = /** @class */ (function (_super) {
        __extends(Vector2_F64, _super);
        function Vector2_F64(x, y) {
            return _super.call(this, Float64Array, x, y) || this;
        }
        return Vector2_F64;
    }(_Vector2));

    var IsUtil = {
        not: {},
        all: {},
        any: {},
        _not: function (fn) {
            return function () {
                return !fn.apply(null, __spread(arguments));
            };
        },
        _all: function (fn) {
            return function () {
                if (Array.isArray(arguments[0])) {
                    return arguments[0].every(fn);
                }
                return __spread(arguments).every(fn);
            };
        },
        _any: function (fn) {
            return function () {
                if (Array.isArray(arguments[0])) {
                    return arguments[0].some(fn);
                }
                return __spread(arguments).some(fn);
            };
        },
        defined: function (val) {
            return val !== void 0;
        },
        undefined: function (val) {
            return val === void 0;
        },
        null: function (val) {
            return val === null;
        },
        // is NOT null or undefined
        exist: function (val) {
            return val != null;
        },
        function: function (val) {
            return typeof val === 'function';
        }
    };
    var _loop_1 = function (fn) {
        if (IsUtil.hasOwnProperty(fn)) {
            var interfaces = ['not', 'all', 'any'];
            if (fn.indexOf('_') === -1 && !interfaces.includes(fn)) {
                interfaces.forEach(function (itf) {
                    var op = '_' + itf;
                    IsUtil[itf][fn] = IsUtil[op](IsUtil[fn]);
                });
            }
        }
    };
    for (var fn in IsUtil) {
        _loop_1(fn);
    }

    var ImmutableVector3 = /** @class */ (function () {
        function ImmutableVector3(x, y, z) {
            if (ArrayBuffer.isView(x)) {
                this.v = x;
                return;
            }
            else if (x == null) {
                this.v = new Float32Array(0);
                return;
            }
            else {
                this.v = new Float32Array(3);
            }
            if (IsUtil.not.exist(x)) {
                this.v[0] = 0;
                this.v[1] = 0;
                this.v[2] = 0;
            }
            else if (Array.isArray(x)) {
                this.v[0] = x[0];
                this.v[1] = x[1];
                this.v[2] = x[2];
            }
            else if (typeof x.w !== 'undefined') {
                this.v[0] = x.x;
                this.v[1] = x.y;
                this.v[2] = x.z;
            }
            else if (typeof x.z !== 'undefined') {
                this.v[0] = x.x;
                this.v[1] = x.y;
                this.v[2] = x.z;
            }
            else if (typeof x.y !== 'undefined') {
                this.v[0] = x.x;
                this.v[1] = x.y;
                this.v[2] = 0;
            }
            else {
                this.v[0] = x;
                this.v[1] = y;
                this.v[2] = z;
            }
        }
        Object.defineProperty(ImmutableVector3.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        ImmutableVector3.prototype.isStrictEqual = function (vec) {
            if (this.x === vec.x && this.y === vec.y && this.z === vec.z) {
                return true;
            }
            else {
                return false;
            }
        };
        ImmutableVector3.prototype.isEqual = function (vec, delta) {
            if (delta === void 0) { delta = Number.EPSILON; }
            if (Math.abs(vec.x - this.x) < delta &&
                Math.abs(vec.y - this.y) < delta &&
                Math.abs(vec.z - this.z) < delta) {
                return true;
            }
            else {
                return false;
            }
        };
        /**
         * Zero Vector
         */
        ImmutableVector3.zero = function () {
            return new ImmutableVector3(0, 0, 0);
        };
        ImmutableVector3.one = function () {
            return new ImmutableVector3(1, 1, 1);
        };
        ImmutableVector3.dummy = function () {
            return new ImmutableVector3(null);
        };
        ImmutableVector3.prototype.isDummy = function () {
            if (this.v.length === 0) {
                return true;
            }
            else {
                return false;
            }
        };
        ImmutableVector3.prototype.clone = function () {
            return new ImmutableVector3(this.x, this.y, this.z);
        };
        ImmutableVector3.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        };
        /**
         * to square length(static verison)
         */
        ImmutableVector3.lengthSquared = function (vec3) {
            return vec3.x * vec3.x + vec3.y * vec3.y + vec3.z * vec3.z;
        };
        ImmutableVector3.prototype.lengthTo = function (vec3) {
            var deltaX = vec3.x - this.x;
            var deltaY = vec3.y - this.y;
            var deltaZ = vec3.z - this.z;
            return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        };
        ImmutableVector3.lengthBtw = function (lhv, rhv) {
            var deltaX = rhv.x - lhv.x;
            var deltaY = rhv.y - lhv.y;
            var deltaZ = rhv.z - lhv.z;
            return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        };
        /**
         * dot product
         */
        ImmutableVector3.prototype.dotProduct = function (vec3) {
            return this.x * vec3.x + this.y * vec3.y + this.z * vec3.z;
        };
        /**
         * dot product(static version)
         */
        ImmutableVector3.dotProduct = function (lv, rv) {
            return lv.x * rv.x + lv.y * rv.y + lv.z * rv.z;
        };
        /**
        * cross product(static version)
        */
        ImmutableVector3.cross = function (lv, rv) {
            var x = lv.y * rv.z - lv.z * rv.y;
            var y = lv.z * rv.x - lv.x * rv.z;
            var z = lv.x * rv.y - lv.y * rv.x;
            return new ImmutableVector3(x, y, z);
        };
        /**
         * normalize(static version)
         */
        ImmutableVector3.normalize = function (vec3) {
            var length = vec3.length();
            var newVec = new ImmutableVector3(vec3.x, vec3.y, vec3.z);
            newVec = ImmutableVector3.divide(newVec, length);
            return newVec;
        };
        /**
         * add value（static version）
         */
        ImmutableVector3.add = function (lv, rv) {
            return new ImmutableVector3(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z);
        };
        /**
         * subtract(subtract)
         */
        ImmutableVector3.subtract = function (lv, rv) {
            return new ImmutableVector3(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z);
        };
        /**
         * divide(static version)
         */
        ImmutableVector3.divide = function (vec3, val) {
            if (val !== 0) {
                return new ImmutableVector3(vec3.x / val, vec3.y / val, vec3.z / val);
            }
            else {
                console.error("0 division occured!");
                return new ImmutableVector3(Infinity, Infinity, Infinity);
            }
        };
        /**
         * multiply(static version)
         */
        ImmutableVector3.multiply = function (vec3, val) {
            return new ImmutableVector3(vec3.x * val, vec3.y * val, vec3.z * val);
        };
        /**
         * multiply vector(static version)
         */
        ImmutableVector3.multiplyVector = function (vec3, vec) {
            return new ImmutableVector3(vec3.x * vec.x, vec3.y * vec.y, vec3.z * vec.z);
        };
        ImmutableVector3.angleOfVectors = function (lhv, rhv) {
            var cos_sita = ImmutableVector3.dotProduct(lhv, rhv) / (lhv.length() * rhv.length());
            var sita = Math.acos(cos_sita);
            return sita;
        };
        /**
         * divide vector(static version)
         */
        ImmutableVector3.divideVector = function (lvec3, rvec3) {
            return new ImmutableVector3(lvec3.x / rvec3.x, lvec3.y / rvec3.y, lvec3.z / rvec3.z);
        };
        /**
         * change to string
         */
        ImmutableVector3.prototype.toString = function () {
            return '(' + this.x + ', ' + this.y + ', ' + this.z + ')';
        };
        Object.defineProperty(ImmutableVector3.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableVector3.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableVector3.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableVector3.prototype, "raw", {
            get: function () {
                return this.v;
            },
            enumerable: true,
            configurable: true
        });
        return ImmutableVector3;
    }());
    //GLBoost['Vector3'] = Vector3;

    // import GLBoost from '../../globals';
    var ImmutableMatrix33 = /** @class */ (function () {
        function ImmutableMatrix33(m0, m1, m2, m3, m4, m5, m6, m7, m8, isColumnMajor, notCopyFloatArray) {
            if (isColumnMajor === void 0) { isColumnMajor = false; }
            if (notCopyFloatArray === void 0) { notCopyFloatArray = false; }
            var _isColumnMajor = (arguments.length === 10) ? isColumnMajor : m1;
            var _notCopyFloatArray = (arguments.length === 3) ? notCopyFloatArray : false;
            var m = m0;
            if (m == null) {
                this.v = new Float32Array(0);
                return;
            }
            if (arguments.length === 9) {
                this.v = new Float32Array(9);
                if (_isColumnMajor === true) {
                    var m_1 = arguments;
                    this.v[0] = m_1[0];
                    this.v[3] = m_1[3];
                    this.v[6] = m_1[6];
                    this.v[1] = m_1[1];
                    this.v[4] = m_1[4];
                    this.v[7] = m_1[7];
                    this.v[2] = m_1[2];
                    this.v[5] = m_1[5];
                    this.v[8] = m_1[8];
                }
                else {
                    // arguments[0-8] must be row major values if isColumnMajor is false
                    this.v[0] = m[0];
                    this.v[3] = m[1];
                    this.v[6] = m[2];
                    this.v[1] = m[3];
                    this.v[4] = m[4];
                    this.v[7] = m[5];
                    this.v[2] = m[6];
                    this.v[5] = m[7];
                    this.v[8] = m[8];
                }
            }
            else if (Array.isArray(m)) {
                this.v = new Float32Array(9);
                if (_isColumnMajor === true) {
                    this.v[0] = m[0];
                    this.v[3] = m[3];
                    this.v[6] = m[6];
                    this.v[1] = m[1];
                    this.v[4] = m[4];
                    this.v[7] = m[7];
                    this.v[2] = m[2];
                    this.v[5] = m[5];
                    this.v[8] = m[8];
                }
                else {
                    // 'm' must be row major array if isColumnMajor is false
                    this.v[0] = m[0];
                    this.v[3] = m[1];
                    this.v[6] = m[2];
                    this.v[1] = m[3];
                    this.v[4] = m[4];
                    this.v[7] = m[5];
                    this.v[2] = m[6];
                    this.v[5] = m[7];
                    this.v[8] = m[8];
                }
            }
            else if (m instanceof Float32Array) {
                if (_notCopyFloatArray) {
                    this.v = m;
                }
                else {
                    this.v = new Float32Array(9);
                    if (_isColumnMajor === true) {
                        this.v[0] = m[0];
                        this.v[3] = m[3];
                        this.v[6] = m[6];
                        this.v[1] = m[1];
                        this.v[4] = m[4];
                        this.v[7] = m[7];
                        this.v[2] = m[2];
                        this.v[5] = m[5];
                        this.v[8] = m[8];
                    }
                    else {
                        // 'm' must be row major array if isColumnMajor is false
                        this.v[0] = m[0];
                        this.v[3] = m[1];
                        this.v[6] = m[2];
                        this.v[1] = m[3];
                        this.v[4] = m[4];
                        this.v[7] = m[5];
                        this.v[2] = m[6];
                        this.v[5] = m[7];
                        this.v[8] = m[8];
                    }
                }
            }
            else if (!!m && typeof m.m22 !== 'undefined') {
                if (_notCopyFloatArray) {
                    this.v = m.v;
                }
                else {
                    this.v = new Float32Array(9);
                    if (_isColumnMajor === true) {
                        var v = m.v;
                        this.v[0] = v[0];
                        this.v[3] = v[3];
                        this.v[6] = v[6];
                        this.v[1] = v[1];
                        this.v[4] = v[4];
                        this.v[7] = v[7];
                        this.v[2] = v[2];
                        this.v[5] = v[5];
                        this.v[8] = v[8];
                    }
                    else {
                        var v = m.v;
                        // 'm' must be row major array if isColumnMajor is false
                        this.v[0] = v[0];
                        this.v[3] = v[1];
                        this.v[6] = v[2];
                        this.v[1] = v[3];
                        this.v[4] = v[4];
                        this.v[7] = v[5];
                        this.v[2] = v[6];
                        this.v[5] = v[7];
                        this.v[8] = v[8];
                    }
                }
            }
            else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
                this.v = new Float32Array(9);
                var q = m;
                var sx = q.x * q.x;
                var sy = q.y * q.y;
                var sz = q.z * q.z;
                var cx = q.y * q.z;
                var cy = q.x * q.z;
                var cz = q.x * q.y;
                var wx = q.w * q.x;
                var wy = q.w * q.y;
                var wz = q.w * q.z;
                this.v[0] = 1.0 - 2.0 * (sy + sz);
                this.v[3] = 2.0 * (cz - wz);
                this.v[6] = 2.0 * (cy + wy);
                this.v[1] = 2.0 * (cz + wz);
                this.v[4] = 1.0 - 2.0 * (sx + sz);
                this.v[7] = 2.0 * (cx - wx);
                this.v[2] = 2.0 * (cy - wy);
                this.v[5] = 2.0 * (cx + wx);
                this.v[8] = 1.0 - 2.0 * (sx + sy);
            }
            else {
                this.v = new Float32Array(9);
                this.v[0] = 1;
                this.v[3] = 0;
                this.v[6] = 0;
                this.v[1] = 0;
                this.v[4] = 1;
                this.v[7] = 0;
                this.v[2] = 0;
                this.v[5] = 0;
                this.v[8] = 1;
            }
        }
        Object.defineProperty(ImmutableMatrix33.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Make this identity matrix（static method version）
         */
        ImmutableMatrix33.identity = function () {
            return new ImmutableMatrix33(1, 0, 0, 0, 1, 0, 0, 0, 1);
        };
        ImmutableMatrix33.dummy = function () {
            return new ImmutableMatrix33(null);
        };
        ImmutableMatrix33.prototype.isDummy = function () {
            if (this.v.length === 0) {
                return true;
            }
            else {
                return false;
            }
        };
        ImmutableMatrix33.prototype.clone = function () {
            return new ImmutableMatrix33(this.v[0], this.v[3], this.v[6], this.v[1], this.v[4], this.v[7], this.v[2], this.v[5], this.v[8]);
        };
        /**
         * Create X oriented Rotation Matrix
         */
        ImmutableMatrix33.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new ImmutableMatrix33(1, 0, 0, 0, cos, -sin, 0, sin, cos);
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        ImmutableMatrix33.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new ImmutableMatrix33(cos, 0, sin, 0, 1, 0, -sin, 0, cos);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        ImmutableMatrix33.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new ImmutableMatrix33(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
        };
        ImmutableMatrix33.rotateXYZ = function (x, y, z) {
            return ImmutableMatrix33.multiply(ImmutableMatrix33.multiply(ImmutableMatrix33.rotateZ(z), ImmutableMatrix33.rotateY(y)), ImmutableMatrix33.rotateX(x));
        };
        ImmutableMatrix33.rotate = function (vec3) {
            return ImmutableMatrix33.multiply(ImmutableMatrix33.multiply(ImmutableMatrix33.rotateZ(vec3.z), ImmutableMatrix33.rotateY(vec3.y)), ImmutableMatrix33.rotateX(vec3.x));
        };
        ImmutableMatrix33.scale = function (vec) {
            return new ImmutableMatrix33(vec.x, 0, 0, 0, vec.y, 0, 0, 0, vec.z);
        };
        /**
         * zero matrix(static version)
         */
        ImmutableMatrix33.zero = function () {
            return new ImmutableMatrix33(0, 0, 0, 0, 0, 0, 0, 0, 0);
        };
        /**
         * transpose(static version)
         */
        ImmutableMatrix33.transpose = function (mat) {
            var mat_t = new ImmutableMatrix33(mat.m00, mat.m10, mat.m20, mat.m01, mat.m11, mat.m21, mat.m02, mat.m12, mat.m22);
            return mat_t;
        };
        /**
         * multiply matrixs (static version)
         */
        ImmutableMatrix33.multiply = function (l_m, r_m) {
            var m00 = l_m.m00 * r_m.m00 + l_m.m01 * r_m.m10 + l_m.m02 * r_m.m20;
            var m10 = l_m.m10 * r_m.m00 + l_m.m11 * r_m.m10 + l_m.m12 * r_m.m20;
            var m20 = l_m.m20 * r_m.m00 + l_m.m21 * r_m.m10 + l_m.m22 * r_m.m20;
            var m01 = l_m.m00 * r_m.m01 + l_m.m01 * r_m.m11 + l_m.m02 * r_m.m21;
            var m11 = l_m.m10 * r_m.m01 + l_m.m11 * r_m.m11 + l_m.m12 * r_m.m21;
            var m21 = l_m.m20 * r_m.m01 + l_m.m21 * r_m.m11 + l_m.m22 * r_m.m21;
            var m02 = l_m.m00 * r_m.m02 + l_m.m01 * r_m.m12 + l_m.m02 * r_m.m22;
            var m12 = l_m.m10 * r_m.m02 + l_m.m11 * r_m.m12 + l_m.m12 * r_m.m22;
            var m22 = l_m.m20 * r_m.m02 + l_m.m21 * r_m.m12 + l_m.m22 * r_m.m22;
            return new ImmutableMatrix33(m00, m01, m02, m10, m11, m12, m20, m21, m22);
        };
        ImmutableMatrix33.prototype.determinant = function () {
            return this.m00 * this.m11 * this.m22 + this.m10 * this.m21 * this.m02 + this.m20 * this.m01 * this.m12
                - this.m00 * this.m21 * this.m12 - this.m20 * this.m11 * this.m02 - this.m10 * this.m01 * this.m22;
        };
        ImmutableMatrix33.determinant = function (mat) {
            return mat.m00 * mat.m11 * mat.m22 + mat.m10 * mat.m21 * mat.m02 + mat.m20 * mat.m01 * mat.m12
                - mat.m00 * mat.m21 * mat.m12 - mat.m20 * mat.m11 * mat.m02 - mat.m10 * mat.m01 * mat.m22;
        };
        ImmutableMatrix33.invert = function (mat) {
            var det = mat.determinant();
            var m00 = (mat.m11 * mat.m22 - mat.m12 * mat.m21) / det;
            var m01 = (mat.m02 * mat.m21 - mat.m01 * mat.m22) / det;
            var m02 = (mat.m01 * mat.m12 - mat.m02 * mat.m11) / det;
            var m10 = (mat.m12 * mat.m20 - mat.m10 * mat.m22) / det;
            var m11 = (mat.m00 * mat.m22 - mat.m02 * mat.m20) / det;
            var m12 = (mat.m02 * mat.m10 - mat.m00 * mat.m12) / det;
            var m20 = (mat.m10 * mat.m21 - mat.m11 * mat.m20) / det;
            var m21 = (mat.m01 * mat.m20 - mat.m00 * mat.m21) / det;
            var m22 = (mat.m00 * mat.m11 - mat.m01 * mat.m10) / det;
            return new ImmutableMatrix33(m00, m01, m02, m10, m11, m12, m20, m21, m22);
        };
        Object.defineProperty(ImmutableMatrix33.prototype, "m00", {
            get: function () {
                return this.v[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix33.prototype, "m10", {
            get: function () {
                return this.v[1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix33.prototype, "m20", {
            get: function () {
                return this.v[2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix33.prototype, "m01", {
            get: function () {
                return this.v[3];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix33.prototype, "m11", {
            get: function () {
                return this.v[4];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix33.prototype, "m21", {
            get: function () {
                return this.v[5];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix33.prototype, "m02", {
            get: function () {
                return this.v[6];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix33.prototype, "m12", {
            get: function () {
                return this.v[7];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix33.prototype, "m22", {
            get: function () {
                return this.v[8];
            },
            enumerable: true,
            configurable: true
        });
        ImmutableMatrix33.prototype.toString = function () {
            return this.m00 + ' ' + this.m01 + ' ' + this.m02 + '\n' +
                this.m10 + ' ' + this.m11 + ' ' + this.m12 + '\n' +
                this.m20 + ' ' + this.m21 + ' ' + this.m22 + '\n';
        };
        ImmutableMatrix33.prototype.nearZeroToZero = function (value) {
            if (Math.abs(value) < 0.00001) {
                value = 0;
            }
            else if (0.99999 < value && value < 1.00001) {
                value = 1;
            }
            else if (-1.00001 < value && value < -0.99999) {
                value = -1;
            }
            return value;
        };
        ImmutableMatrix33.prototype.toStringApproximately = function () {
            return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + '\n' +
                this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' \n' +
                this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + '\n';
        };
        ImmutableMatrix33.prototype.getScale = function () {
            return new ImmutableVector3(Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02), Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12), Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22));
        };
        ImmutableMatrix33.prototype.isEqual = function (mat, delta) {
            if (delta === void 0) { delta = Number.EPSILON; }
            if (Math.abs(mat.v[0] - this.v[0]) < delta &&
                Math.abs(mat.v[1] - this.v[1]) < delta &&
                Math.abs(mat.v[2] - this.v[2]) < delta &&
                Math.abs(mat.v[3] - this.v[3]) < delta &&
                Math.abs(mat.v[4] - this.v[4]) < delta &&
                Math.abs(mat.v[5] - this.v[5]) < delta &&
                Math.abs(mat.v[6] - this.v[6]) < delta &&
                Math.abs(mat.v[7] - this.v[7]) < delta &&
                Math.abs(mat.v[8] - this.v[8]) < delta) {
                return true;
            }
            else {
                return false;
            }
        };
        return ImmutableMatrix33;
    }());

    var ImmutableVector4 = /** @class */ (function () {
        function ImmutableVector4(x, y, z, w) {
            if (ArrayBuffer.isView(x)) {
                this.v = x;
                return;
            }
            else {
                this.v = new Float32Array(4);
            }
            if (!(x != null)) {
                this.v[0] = 0;
                this.v[1] = 0;
                this.v[2] = 0;
                this.v[3] = 1;
            }
            else if (Array.isArray(x)) {
                this.v[0] = x[0];
                this.v[1] = x[1];
                this.v[2] = x[2];
                this.v[3] = x[3];
            }
            else if (typeof x.w !== 'undefined') {
                this.v[0] = x.x;
                this.v[1] = x.y;
                this.v[2] = x.z;
                this.v[3] = x.w;
            }
            else if (typeof x.z !== 'undefined') {
                this.v[0] = x.x;
                this.v[1] = x.y;
                this.v[2] = x.z;
                this.v[3] = 1;
            }
            else if (typeof x.y !== 'undefined') {
                this.v[0] = x.x;
                this.v[1] = x.y;
                this.v[2] = 0;
                this.v[3] = 1;
            }
            else {
                this.v[0] = x;
                this.v[1] = y;
                this.v[2] = z;
                this.v[3] = w;
            }
        }
        Object.defineProperty(ImmutableVector4.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        ImmutableVector4.prototype.isStrictEqual = function (vec) {
            if (this.v[0] === vec.v[0] && this.v[1] === vec.v[1] && this.v[2] === vec.v[2] && this.v[3] === vec.v[3]) {
                return true;
            }
            else {
                return false;
            }
        };
        ImmutableVector4.prototype.isEqual = function (vec, delta) {
            if (delta === void 0) { delta = Number.EPSILON; }
            if (Math.abs(vec.v[0] - this.v[0]) < delta &&
                Math.abs(vec.v[1] - this.v[1]) < delta &&
                Math.abs(vec.v[2] - this.v[2]) < delta &&
                Math.abs(vec.v[3] - this.v[3]) < delta) {
                return true;
            }
            else {
                return false;
            }
        };
        ImmutableVector4.prototype.clone = function () {
            return new ImmutableVector4(this.x, this.y, this.z, this.w);
        };
        /**
         * Zero Vector
         */
        ImmutableVector4.zero = function () {
            return new ImmutableVector4(0, 0, 0, 1);
        };
        ImmutableVector4.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        };
        ImmutableVector4.normalize = function (vec4) {
            var length = vec4.length();
            var newVec = new ImmutableVector4(vec4.x, vec4.y, vec4.z, vec4.w);
            newVec = ImmutableVector4.divide(newVec, length);
            return newVec;
        };
        /**
         * add value（static version）
         */
        ImmutableVector4.add = function (lv, rv) {
            return new ImmutableVector4(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z + rv.z);
        };
        ImmutableVector4.subtract = function (lv, rv) {
            return new ImmutableVector4(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z, lv.w - rv.w);
        };
        /**
         * add value except w component（static version）
         */
        ImmutableVector4.addWithOutW = function (lv, rv) {
            return new ImmutableVector4(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z);
        };
        ImmutableVector4.multiply = function (vec4, val) {
            return new ImmutableVector4(vec4.x * val, vec4.y * val, vec4.z * val, vec4.w * val);
        };
        ImmutableVector4.multiplyVector = function (vec4, vec) {
            return new ImmutableVector4(vec4.x * vec.x, vec4.y * vec.y, vec4.z * vec.z, vec4.w * vec.w);
        };
        ImmutableVector4.divide = function (vec4, val) {
            if (val !== 0) {
                return new ImmutableVector4(vec4.x / val, vec4.y / val, vec4.z / val, vec4.w / val);
            }
            else {
                console.warn("0 division occured!");
                return new ImmutableVector4(Infinity, Infinity, Infinity, Infinity);
            }
        };
        ImmutableVector4.divideVector = function (lvec4, rvec4) {
            return new ImmutableVector4(lvec4.x / rvec4.x, lvec4.y / rvec4.y, lvec4.z / rvec4.z, lvec4.w / rvec4.w);
        };
        ImmutableVector4.prototype.toString = function () {
            return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
        };
        Object.defineProperty(ImmutableVector4.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableVector4.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableVector4.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableVector4.prototype, "w", {
            get: function () {
                return this.v[3];
            },
            enumerable: true,
            configurable: true
        });
        return ImmutableVector4;
    }());
    // GLBoost["Vector4"] = Vector4;

    //import GLBoost from '../../globals';
    var ImmutableQuaternion = /** @class */ (function () {
        function ImmutableQuaternion(x, y, z, w) {
            if (ArrayBuffer.isView(x)) {
                this.v = x;
                return;
            }
            else if (x == null) {
                this.v = new Float32Array(0);
            }
            else {
                this.v = new Float32Array(4);
            }
            if (!(x != null)) {
                this.v[0] = 0;
                this.v[1] = 0;
                this.v[2] = 0;
                this.v[3] = 1;
            }
            else if (Array.isArray(x)) {
                this.v[0] = x[0];
                this.v[1] = x[1];
                this.v[2] = x[2];
                this.v[3] = x[3];
            }
            else if (typeof x.w !== 'undefined') {
                this.v[0] = x.x;
                this.v[1] = x.y;
                this.v[2] = x.z;
                this.v[3] = x.w;
            }
            else if (typeof x.z !== 'undefined') {
                this.v[0] = x.x;
                this.v[1] = x.y;
                this.v[2] = x.z;
                this.v[3] = 1;
            }
            else if (typeof x.y !== 'undefined') {
                this.v[0] = x.x;
                this.v[1] = x.y;
                this.v[2] = 0;
                this.v[3] = 1;
            }
            else {
                this.v[0] = x;
                this.v[1] = y;
                this.v[2] = z;
                this.v[3] = w;
            }
        }
        ImmutableQuaternion.prototype.isEqual = function (quat) {
            if (this.x === quat.x && this.y === quat.y && this.z === quat.z && this.w === quat.w) {
                return true;
            }
            else {
                return false;
            }
        };
        ImmutableQuaternion.dummy = function () {
            return new ImmutableQuaternion(null);
        };
        ImmutableQuaternion.prototype.isDummy = function () {
            if (this.v.length === 0) {
                return true;
            }
            else {
                return false;
            }
        };
        Object.defineProperty(ImmutableQuaternion.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        ImmutableQuaternion.prototype.clone = function () {
            return new ImmutableQuaternion(this.x, this.y, this.z, this.w);
        };
        ImmutableQuaternion.invert = function (quat) {
            quat = new ImmutableQuaternion(-quat.x, -quat.y, -quat.z, quat.w);
            var inorm2 = 1.0 / (quat.x * quat.x + quat.y * quat.y + quat.z * quat.z + quat.w * quat.w);
            quat.v[0] *= inorm2;
            quat.v[1] *= inorm2;
            quat.v[2] *= inorm2;
            quat.v[3] *= inorm2;
            return quat;
        };
        ImmutableQuaternion.qlerp = function (lhq, rhq, ratio) {
            var q = new ImmutableQuaternion(0, 0, 0, 1);
            var qr = lhq.w * rhq.w + lhq.x * rhq.x + lhq.y * rhq.y + lhq.z * rhq.z;
            var ss = 1.0 - qr * qr;
            if (ss === 0.0) {
                q.v[3] = lhq.w;
                q.v[0] = lhq.x;
                q.v[1] = lhq.y;
                q.v[2] = lhq.z;
                return q;
            }
            else {
                if (qr > 1) {
                    qr = 0.999;
                }
                else if (qr < -1) {
                    qr = -0.999;
                }
                var ph = Math.acos(qr);
                var s2 = void 0;
                if (qr < 0.0 && ph > Math.PI / 2.0) {
                    qr = -lhq.w * rhq.w - lhq.x * rhq.x - lhq.y * rhq.y - lhq.z * rhq.z;
                    ph = Math.acos(qr);
                    s2 = -1 * Math.sin(ph * ratio) / Math.sin(ph);
                }
                else {
                    s2 = Math.sin(ph * ratio) / Math.sin(ph);
                }
                var s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);
                q.v[0] = lhq.x * s1 + rhq.x * s2;
                q.v[1] = lhq.y * s1 + rhq.y * s2;
                q.v[2] = lhq.z * s1 + rhq.z * s2;
                q.v[3] = lhq.w * s1 + rhq.w * s2;
                return q;
            }
        };
        ImmutableQuaternion.axisAngle = function (axisVec3, radian) {
            var halfAngle = 0.5 * radian;
            var sin = Math.sin(halfAngle);
            var axis = ImmutableVector3.normalize(axisVec3);
            return new ImmutableQuaternion(sin * axis.x, sin * axis.y, sin * axis.z, Math.cos(halfAngle));
        };
        ImmutableQuaternion.multiply = function (q1, q2) {
            var result = new ImmutableQuaternion(0, 0, 0, 1);
            result.v[0] = q2.w * q1.x + q2.z * q1.y - q2.y * q1.z + q2.x * q1.w;
            result.v[1] = -q2.z * q1.x + q2.w * q1.y + q2.x * q1.z + q2.y * q1.w;
            result.v[2] = q2.y * q1.x - q2.x * q1.y + q2.w * q1.z + q2.z * q1.w;
            result.v[3] = -q2.x * q1.x - q2.y * q1.y - q2.z * q1.z + q2.w * q1.w;
            return result;
        };
        ImmutableQuaternion.fromMatrix = function (m) {
            var q = new ImmutableQuaternion();
            var tr = m.m00 + m.m11 + m.m22;
            if (tr > 0) {
                var S = 0.5 / Math.sqrt(tr + 1.0);
                q.v[3] = 0.25 / S;
                q.v[0] = (m.m21 - m.m12) * S;
                q.v[1] = (m.m02 - m.m20) * S;
                q.v[2] = (m.m10 - m.m01) * S;
            }
            else if ((m.m00 > m.m11) && (m.m00 > m.m22)) {
                var S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
                q.v[3] = (m.m21 - m.m12) / S;
                q.v[0] = 0.25 * S;
                q.v[1] = (m.m01 + m.m10) / S;
                q.v[2] = (m.m02 + m.m20) / S;
            }
            else if (m.m11 > m.m22) {
                var S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
                q.v[3] = (m.m02 - m.m20) / S;
                q.v[0] = (m.m01 + m.m10) / S;
                q.v[1] = 0.25 * S;
                q.v[2] = (m.m12 + m.m21) / S;
            }
            else {
                var S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
                q.v[3] = (m.m10 - m.m01) / S;
                q.v[0] = (m.m02 + m.m20) / S;
                q.v[1] = (m.m12 + m.m21) / S;
                q.v[2] = 0.25 * S;
            }
            return q;
        };
        ImmutableQuaternion.fromPosition = function (vec3) {
            var q = new ImmutableQuaternion(vec3.x, vec3.y, vec3.z, 0);
            return q;
        };
        ImmutableQuaternion.prototype.at = function (i) {
            switch (i % 4) {
                case 0: return this.x;
                case 1: return this.y;
                case 2: return this.z;
                case 3: return this.w;
            }
        };
        ImmutableQuaternion.prototype.toString = function () {
            return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
        };
        Object.defineProperty(ImmutableQuaternion.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableQuaternion.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableQuaternion.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableQuaternion.prototype, "w", {
            get: function () {
                return this.v[3];
            },
            enumerable: true,
            configurable: true
        });
        return ImmutableQuaternion;
    }());

    //import GLBoost from '../../globals';
    var FloatArray = Float32Array;
    var ImmutableMatrix44 = /** @class */ (function () {
        function ImmutableMatrix44(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, isColumnMajor, notCopyFloatArray) {
            if (isColumnMajor === void 0) { isColumnMajor = false; }
            if (notCopyFloatArray === void 0) { notCopyFloatArray = false; }
            var _isColumnMajor = (arguments.length >= 16) ? isColumnMajor : m1;
            var _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m2;
            var m = m0;
            if (m == null) {
                this.v = new FloatArray(0);
                return;
            }
            if (arguments.length >= 16 && arguments[3] != null) {
                this.v = new FloatArray(16); // Data order is column major
                var m_1 = arguments;
                if (_isColumnMajor === true) {
                    this.v[0] = m_1[0];
                    this.v[4] = m_1[4];
                    this.v[8] = m_1[8];
                    this.v[12] = m_1[12];
                    this.v[1] = m_1[1];
                    this.v[5] = m_1[5];
                    this.v[9] = m_1[9];
                    this.v[13] = m_1[13];
                    this.v[2] = m_1[2];
                    this.v[6] = m_1[6];
                    this.v[10] = m_1[10];
                    this.v[14] = m_1[14];
                    this.v[3] = m_1[3];
                    this.v[7] = m_1[7];
                    this.v[11] = m_1[11];
                    this.v[15] = m_1[15];
                }
                else {
                    // arguments[0-15] must be row major values if isColumnMajor is false
                    this.v[0] = m_1[0];
                    this.v[4] = m_1[1];
                    this.v[8] = m_1[2];
                    this.v[12] = m_1[3];
                    this.v[1] = m_1[4];
                    this.v[5] = m_1[5];
                    this.v[9] = m_1[6];
                    this.v[13] = m_1[7];
                    this.v[2] = m_1[8];
                    this.v[6] = m_1[9];
                    this.v[10] = m_1[10];
                    this.v[14] = m_1[11];
                    this.v[3] = m_1[12];
                    this.v[7] = m_1[13];
                    this.v[11] = m_1[14];
                    this.v[15] = m_1[15];
                }
            }
            else if (Array.isArray(m)) {
                this.v = new FloatArray(16);
                if (_isColumnMajor === true) {
                    this.v[0] = m[0];
                    this.v[4] = m[4];
                    this.v[8] = m[8];
                    this.v[12] = m[12];
                    this.v[1] = m[1];
                    this.v[5] = m[5];
                    this.v[9] = m[9];
                    this.v[13] = m[13];
                    this.v[2] = m[2];
                    this.v[6] = m[6];
                    this.v[10] = m[10];
                    this.v[14] = m[14];
                    this.v[3] = m[3];
                    this.v[7] = m[7];
                    this.v[11] = m[11];
                    this.v[15] = m[15];
                }
                else {
                    // 'm' must be row major values if isColumnMajor is false
                    this.v[0] = m[0];
                    this.v[4] = m[1];
                    this.v[8] = m[2];
                    this.v[12] = m[3];
                    this.v[1] = m[4];
                    this.v[5] = m[5];
                    this.v[9] = m[6];
                    this.v[13] = m[7];
                    this.v[2] = m[8];
                    this.v[6] = m[9];
                    this.v[10] = m[10];
                    this.v[14] = m[11];
                    this.v[3] = m[12];
                    this.v[7] = m[13];
                    this.v[11] = m[14];
                    this.v[15] = m[15];
                }
            }
            else if (m instanceof FloatArray) {
                if (_notCopyFloatArray) {
                    this.v = m;
                }
                else {
                    this.v = new FloatArray(16);
                    if (_isColumnMajor === true) {
                        this.v[0] = m[0];
                        this.v[4] = m[4];
                        this.v[8] = m[8];
                        this.v[12] = m[12];
                        this.v[1] = m[1];
                        this.v[5] = m[5];
                        this.v[9] = m[9];
                        this.v[13] = m[13];
                        this.v[2] = m[2];
                        this.v[6] = m[6];
                        this.v[10] = m[10];
                        this.v[14] = m[14];
                        this.v[3] = m[3];
                        this.v[7] = m[7];
                        this.v[11] = m[11];
                        this.v[15] = m[15];
                    }
                    else {
                        // 'm' must be row major values if isColumnMajor is false
                        this.v[0] = m[0];
                        this.v[4] = m[1];
                        this.v[8] = m[2];
                        this.v[12] = m[3];
                        this.v[1] = m[4];
                        this.v[5] = m[5];
                        this.v[9] = m[6];
                        this.v[13] = m[7];
                        this.v[2] = m[8];
                        this.v[6] = m[9];
                        this.v[10] = m[10];
                        this.v[14] = m[11];
                        this.v[3] = m[12];
                        this.v[7] = m[13];
                        this.v[11] = m[14];
                        this.v[15] = m[15];
                    }
                }
            }
            else if (!!m && typeof m.m33 !== 'undefined' && typeof m.m22 !== 'undefined') {
                if (_notCopyFloatArray) {
                    this.v = m.v;
                }
                else {
                    this.v = new FloatArray(16);
                    var v = m.v;
                    if (_isColumnMajor === true) {
                        this.v[0] = v[0];
                        this.v[4] = v[4];
                        this.v[8] = v[8];
                        this.v[12] = v[12];
                        this.v[1] = v[1];
                        this.v[5] = v[5];
                        this.v[9] = v[9];
                        this.v[13] = v[13];
                        this.v[2] = v[2];
                        this.v[6] = v[6];
                        this.v[10] = v[10];
                        this.v[14] = v[14];
                        this.v[3] = v[3];
                        this.v[7] = v[7];
                        this.v[11] = v[11];
                        this.v[15] = v[15];
                    }
                    else {
                        // 'm' must be row major values if isColumnMajor is false
                        this.v[0] = v[0];
                        this.v[4] = v[1];
                        this.v[8] = v[2];
                        this.v[12] = v[3];
                        this.v[1] = v[4];
                        this.v[5] = v[5];
                        this.v[9] = v[6];
                        this.v[13] = v[7];
                        this.v[2] = v[8];
                        this.v[6] = v[9];
                        this.v[10] = v[10];
                        this.v[14] = v[11];
                        this.v[3] = v[12];
                        this.v[7] = v[13];
                        this.v[11] = v[14];
                        this.v[15] = v[15];
                    }
                }
            }
            else if (!!m && typeof m.m33 === 'undefined' && typeof m.m22 !== 'undefined') {
                if (_notCopyFloatArray) {
                    this.v = m.v;
                }
                else {
                    this.v = new FloatArray(16);
                    var v = m.v;
                    if (_isColumnMajor === true) {
                        this.v[0] = v[0];
                        this.v[4] = v[3];
                        this.v[8] = v[6];
                        this.v[12] = 0;
                        this.v[1] = v[1];
                        this.v[5] = v[4];
                        this.v[9] = v[7];
                        this.v[13] = 0;
                        this.v[2] = v[2];
                        this.v[6] = v[5];
                        this.v[10] = v[8];
                        this.v[14] = 0;
                        this.v[3] = 0;
                        this.v[7] = 0;
                        this.v[11] = 0;
                        this.v[15] = 1;
                    }
                    else {
                        // 'm' must be row major values if isColumnMajor is false
                        this.v[0] = v[0];
                        this.v[4] = v[1];
                        this.v[8] = v[2];
                        this.v[12] = 0;
                        this.v[1] = v[3];
                        this.v[5] = v[4];
                        this.v[9] = v[5];
                        this.v[13] = 0;
                        this.v[2] = v[6];
                        this.v[6] = v[7];
                        this.v[10] = v[8];
                        this.v[14] = 0;
                        this.v[3] = 0;
                        this.v[7] = 0;
                        this.v[11] = 0;
                        this.v[15] = 1;
                    }
                }
            }
            else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
                this.v = new FloatArray(16);
                var sx = m.x * m.x;
                var sy = m.y * m.y;
                var sz = m.z * m.z;
                var cx = m.y * m.z;
                var cy = m.x * m.z;
                var cz = m.x * m.y;
                var wx = m.w * m.x;
                var wy = m.w * m.y;
                var wz = m.w * m.z;
                this.v[0] = 1.0 - 2.0 * (sy + sz);
                this.v[4] = 2.0 * (cz - wz);
                this.v[8] = 2.0 * (cy + wy);
                this.v[12] = 0;
                this.v[1] = 2.0 * (cz + wz);
                this.v[5] = 1.0 - 2.0 * (sx + sz);
                this.v[9] = 2.0 * (cx - wx);
                this.v[13] = 0;
                this.v[2] = 2.0 * (cy - wy);
                this.v[6] = 2.0 * (cx + wx);
                this.v[10] = 1.0 - 2.0 * (sx + sy);
                this.v[14] = 0;
                this.v[3] = 0;
                this.v[7] = 0;
                this.v[11] = 0;
                this.v[15] = 1;
            }
            else {
                this.v = new FloatArray(16);
                this.v[0] = 1;
                this.v[4] = 0;
                this.v[8] = 0;
                this.v[12] = 0;
                this.v[1] = 0;
                this.v[5] = 1;
                this.v[9] = 0;
                this.v[13] = 0;
                this.v[2] = 0;
                this.v[6] = 0;
                this.v[10] = 1;
                this.v[14] = 0;
                this.v[3] = 0;
                this.v[7] = 0;
                this.v[11] = 0;
                this.v[15] = 1;
            }
        }
        ImmutableMatrix44.dummy = function () {
            return new ImmutableMatrix44(null);
        };
        ImmutableMatrix44.prototype.isDummy = function () {
            if (this.v.length === 0) {
                return true;
            }
            else {
                return false;
            }
        };
        Object.defineProperty(ImmutableMatrix44.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        ImmutableMatrix44.prototype.clone = function () {
            return new ImmutableMatrix44(this.v[0], this.v[4], this.v[8], this.v[12], this.v[1], this.v[5], this.v[9], this.v[13], this.v[2], this.v[6], this.v[10], this.v[14], this.v[3], this.v[7], this.v[11], this.v[15]);
        };
        /**
         * to the identity matrix（static版）
         */
        ImmutableMatrix44.identity = function () {
            return new ImmutableMatrix44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        ImmutableMatrix44.prototype.isEqual = function (mat, delta) {
            if (delta === void 0) { delta = Number.EPSILON; }
            if (Math.abs(mat.v[0] - this.v[0]) < delta &&
                Math.abs(mat.v[1] - this.v[1]) < delta &&
                Math.abs(mat.v[2] - this.v[2]) < delta &&
                Math.abs(mat.v[3] - this.v[3]) < delta &&
                Math.abs(mat.v[4] - this.v[4]) < delta &&
                Math.abs(mat.v[5] - this.v[5]) < delta &&
                Math.abs(mat.v[6] - this.v[6]) < delta &&
                Math.abs(mat.v[7] - this.v[7]) < delta &&
                Math.abs(mat.v[8] - this.v[8]) < delta &&
                Math.abs(mat.v[9] - this.v[9]) < delta &&
                Math.abs(mat.v[10] - this.v[10]) < delta &&
                Math.abs(mat.v[11] - this.v[11]) < delta &&
                Math.abs(mat.v[12] - this.v[12]) < delta &&
                Math.abs(mat.v[13] - this.v[13]) < delta &&
                Math.abs(mat.v[14] - this.v[14]) < delta &&
                Math.abs(mat.v[15] - this.v[15]) < delta) {
                return true;
            }
            else {
                return false;
            }
        };
        ImmutableMatrix44.prototype.getTranslate = function () {
            return new ImmutableVector3(this.m03, this.m13, this.m23);
        };
        ImmutableMatrix44.translate = function (vec) {
            return new ImmutableMatrix44(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
        };
        ImmutableMatrix44.scale = function (vec) {
            return new ImmutableMatrix44(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
        };
        /**
         * Create X oriented Rotation Matrix
        */
        ImmutableMatrix44.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new ImmutableMatrix44(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        ImmutableMatrix44.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new ImmutableMatrix44(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        ImmutableMatrix44.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new ImmutableMatrix44(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        /**
         * @return Euler Angles Rotation (x, y, z)
         */
        ImmutableMatrix44.prototype.toEulerAngles = function () {
            var rotate = null;
            if (Math.abs(this.m20) != 1.0) {
                var y = -Math.asin(this.m20);
                var x = Math.atan2(this.m21 / Math.cos(y), this.m22 / Math.cos(y));
                var z = Math.atan2(this.m10 / Math.cos(y), this.m00 / Math.cos(y));
                rotate = new ImmutableVector3(x, y, z);
            }
            else if (this.m20 === -1.0) {
                rotate = new ImmutableVector3(Math.atan2(this.m01, this.m02), Math.PI / 2.0, 0.0);
            }
            else {
                rotate = new ImmutableVector3(Math.atan2(-this.m01, -this.m02), -Math.PI / 2.0, 0.0);
            }
            return rotate;
        };
        ImmutableMatrix44.zero = function () {
            return new ImmutableMatrix44(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        };
        ImmutableMatrix44.prototype.flattenAsArray = function () {
            return [this.v[0], this.v[1], this.v[2], this.v[3],
                this.v[4], this.v[5], this.v[6], this.v[7],
                this.v[8], this.v[9], this.v[10], this.v[11],
                this.v[12], this.v[13], this.v[14], this.v[15]];
        };
        /**
         * transpose(static version)
         */
        ImmutableMatrix44.transpose = function (mat) {
            var mat_t = new ImmutableMatrix44(mat.m00, mat.m10, mat.m20, mat.m30, mat.m01, mat.m11, mat.m21, mat.m31, mat.m02, mat.m12, mat.m22, mat.m32, mat.m03, mat.m13, mat.m23, mat.m33);
            return mat_t;
        };
        ImmutableMatrix44.prototype.multiplyVector = function (vec) {
            var x = this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z + this.m03 * vec.w;
            var y = this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z + this.m13 * vec.w;
            var z = this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z + this.m23 * vec.w;
            var w = this.m30 * vec.x + this.m31 * vec.y + this.m32 * vec.z + this.m33 * vec.w;
            return new ImmutableVector4(x, y, z, w);
        };
        /**
         * multiply zero matrix and zero matrix(static version)
         */
        ImmutableMatrix44.multiply = function (l_m, r_m) {
            var m00 = l_m.m00 * r_m.m00 + l_m.m01 * r_m.m10 + l_m.m02 * r_m.m20 + l_m.m03 * r_m.m30;
            var m10 = l_m.m10 * r_m.m00 + l_m.m11 * r_m.m10 + l_m.m12 * r_m.m20 + l_m.m13 * r_m.m30;
            var m20 = l_m.m20 * r_m.m00 + l_m.m21 * r_m.m10 + l_m.m22 * r_m.m20 + l_m.m23 * r_m.m30;
            var m30 = l_m.m30 * r_m.m00 + l_m.m31 * r_m.m10 + l_m.m32 * r_m.m20 + l_m.m33 * r_m.m30;
            var m01 = l_m.m00 * r_m.m01 + l_m.m01 * r_m.m11 + l_m.m02 * r_m.m21 + l_m.m03 * r_m.m31;
            var m11 = l_m.m10 * r_m.m01 + l_m.m11 * r_m.m11 + l_m.m12 * r_m.m21 + l_m.m13 * r_m.m31;
            var m21 = l_m.m20 * r_m.m01 + l_m.m21 * r_m.m11 + l_m.m22 * r_m.m21 + l_m.m23 * r_m.m31;
            var m31 = l_m.m30 * r_m.m01 + l_m.m31 * r_m.m11 + l_m.m32 * r_m.m21 + l_m.m33 * r_m.m31;
            var m02 = l_m.m00 * r_m.m02 + l_m.m01 * r_m.m12 + l_m.m02 * r_m.m22 + l_m.m03 * r_m.m32;
            var m12 = l_m.m10 * r_m.m02 + l_m.m11 * r_m.m12 + l_m.m12 * r_m.m22 + l_m.m13 * r_m.m32;
            var m22 = l_m.m20 * r_m.m02 + l_m.m21 * r_m.m12 + l_m.m22 * r_m.m22 + l_m.m23 * r_m.m32;
            var m32 = l_m.m30 * r_m.m02 + l_m.m31 * r_m.m12 + l_m.m32 * r_m.m22 + l_m.m33 * r_m.m32;
            var m03 = l_m.m00 * r_m.m03 + l_m.m01 * r_m.m13 + l_m.m02 * r_m.m23 + l_m.m03 * r_m.m33;
            var m13 = l_m.m10 * r_m.m03 + l_m.m11 * r_m.m13 + l_m.m12 * r_m.m23 + l_m.m13 * r_m.m33;
            var m23 = l_m.m20 * r_m.m03 + l_m.m21 * r_m.m13 + l_m.m22 * r_m.m23 + l_m.m23 * r_m.m33;
            var m33 = l_m.m30 * r_m.m03 + l_m.m31 * r_m.m13 + l_m.m32 * r_m.m23 + l_m.m33 * r_m.m33;
            return new ImmutableMatrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        ImmutableMatrix44.prototype.determinant = function () {
            return this.m00 * this.m11 * this.m22 * this.m33 + this.m00 * this.m12 * this.m23 * this.m31 + this.m00 * this.m13 * this.m21 * this.m32 +
                this.m01 * this.m10 * this.m23 * this.m32 + this.m01 * this.m12 * this.m20 * this.m33 + this.m01 * this.m13 * this.m22 * this.m30 +
                this.m02 * this.m10 * this.m21 * this.m33 + this.m02 * this.m11 * this.m23 * this.m30 + this.m02 * this.m13 * this.m20 * this.m31 +
                this.m03 * this.m10 * this.m22 * this.m31 + this.m03 * this.m11 * this.m20 * this.m32 + this.m03 * this.m12 * this.m21 * this.m30 -
                this.m00 * this.m11 * this.m23 * this.m32 - this.m00 * this.m12 * this.m21 * this.m33 - this.m00 * this.m13 * this.m22 * this.m31 -
                this.m01 * this.m10 * this.m22 * this.m33 - this.m01 * this.m12 * this.m23 * this.m30 - this.m01 * this.m13 * this.m20 * this.m32 -
                this.m02 * this.m10 * this.m23 * this.m31 - this.m02 * this.m11 * this.m20 * this.m33 - this.m02 * this.m13 * this.m21 * this.m30 -
                this.m03 * this.m10 * this.m21 * this.m32 - this.m03 * this.m11 * this.m22 * this.m30 - this.m03 * this.m12 * this.m20 * this.m31;
        };
        ImmutableMatrix44.determinant = function (mat) {
            return mat.m00 * mat.m11 * mat.m22 * mat.m33 + mat.m00 * mat.m12 * mat.m23 * mat.m31 + mat.m00 * mat.m13 * mat.m21 * mat.m32 +
                mat.m01 * mat.m10 * mat.m23 * mat.m32 + mat.m01 * mat.m12 * mat.m20 * mat.m33 + mat.m01 * mat.m13 * mat.m22 * mat.m30 +
                mat.m02 * mat.m10 * mat.m21 * mat.m33 + mat.m02 * mat.m11 * mat.m23 * mat.m30 + mat.m02 * mat.m13 * mat.m20 * mat.m31 +
                mat.m03 * mat.m10 * mat.m22 * mat.m31 + mat.m03 * mat.m11 * mat.m20 * mat.m32 + mat.m03 * mat.m12 * mat.m21 * mat.m30 -
                mat.m00 * mat.m11 * mat.m23 * mat.m32 - mat.m00 * mat.m12 * mat.m21 * mat.m33 - mat.m00 * mat.m13 * mat.m22 * mat.m31 -
                mat.m01 * mat.m10 * mat.m22 * mat.m33 - mat.m01 * mat.m12 * mat.m23 * mat.m30 - mat.m01 * mat.m13 * mat.m20 * mat.m32 -
                mat.m02 * mat.m10 * mat.m23 * mat.m31 - mat.m02 * mat.m11 * mat.m20 * mat.m33 - mat.m02 * mat.m13 * mat.m21 * mat.m30 -
                mat.m03 * mat.m10 * mat.m21 * mat.m32 - mat.m03 * mat.m11 * mat.m22 * mat.m30 - mat.m03 * mat.m12 * mat.m20 * mat.m31;
        };
        ImmutableMatrix44.invert = function (mat) {
            var det = mat.determinant();
            var m00 = (mat.m11 * mat.m22 * mat.m33 + mat.m12 * mat.m23 * mat.m31 + mat.m13 * mat.m21 * mat.m32 - mat.m11 * mat.m23 * mat.m32 - mat.m12 * mat.m21 * mat.m33 - mat.m13 * mat.m22 * mat.m31) / det;
            var m01 = (mat.m01 * mat.m23 * mat.m32 + mat.m02 * mat.m21 * mat.m33 + mat.m03 * mat.m22 * mat.m31 - mat.m01 * mat.m22 * mat.m33 - mat.m02 * mat.m23 * mat.m31 - mat.m03 * mat.m21 * mat.m32) / det;
            var m02 = (mat.m01 * mat.m12 * mat.m33 + mat.m02 * mat.m13 * mat.m31 + mat.m03 * mat.m11 * mat.m32 - mat.m01 * mat.m13 * mat.m32 - mat.m02 * mat.m11 * mat.m33 - mat.m03 * mat.m12 * mat.m31) / det;
            var m03 = (mat.m01 * mat.m13 * mat.m22 + mat.m02 * mat.m11 * mat.m23 + mat.m03 * mat.m12 * mat.m21 - mat.m01 * mat.m12 * mat.m23 - mat.m02 * mat.m13 * mat.m21 - mat.m03 * mat.m11 * mat.m22) / det;
            var m10 = (mat.m10 * mat.m23 * mat.m32 + mat.m12 * mat.m20 * mat.m33 + mat.m13 * mat.m22 * mat.m30 - mat.m10 * mat.m22 * mat.m33 - mat.m12 * mat.m23 * mat.m30 - mat.m13 * mat.m20 * mat.m32) / det;
            var m11 = (mat.m00 * mat.m22 * mat.m33 + mat.m02 * mat.m23 * mat.m30 + mat.m03 * mat.m20 * mat.m32 - mat.m00 * mat.m23 * mat.m32 - mat.m02 * mat.m20 * mat.m33 - mat.m03 * mat.m22 * mat.m30) / det;
            var m12 = (mat.m00 * mat.m13 * mat.m32 + mat.m02 * mat.m10 * mat.m33 + mat.m03 * mat.m12 * mat.m30 - mat.m00 * mat.m12 * mat.m33 - mat.m02 * mat.m13 * mat.m30 - mat.m03 * mat.m10 * mat.m32) / det;
            var m13 = (mat.m00 * mat.m12 * mat.m23 + mat.m02 * mat.m13 * mat.m20 + mat.m03 * mat.m10 * mat.m22 - mat.m00 * mat.m13 * mat.m22 - mat.m02 * mat.m10 * mat.m23 - mat.m03 * mat.m12 * mat.m20) / det;
            var m20 = (mat.m10 * mat.m21 * mat.m33 + mat.m11 * mat.m23 * mat.m30 + mat.m13 * mat.m20 * mat.m31 - mat.m10 * mat.m23 * mat.m31 - mat.m11 * mat.m20 * mat.m33 - mat.m13 * mat.m21 * mat.m30) / det;
            var m21 = (mat.m00 * mat.m23 * mat.m31 + mat.m01 * mat.m20 * mat.m33 + mat.m03 * mat.m21 * mat.m30 - mat.m00 * mat.m21 * mat.m33 - mat.m01 * mat.m23 * mat.m30 - mat.m03 * mat.m20 * mat.m31) / det;
            var m22 = (mat.m00 * mat.m11 * mat.m33 + mat.m01 * mat.m13 * mat.m30 + mat.m03 * mat.m10 * mat.m31 - mat.m00 * mat.m13 * mat.m31 - mat.m01 * mat.m10 * mat.m33 - mat.m03 * mat.m11 * mat.m30) / det;
            var m23 = (mat.m00 * mat.m13 * mat.m21 + mat.m01 * mat.m10 * mat.m23 + mat.m03 * mat.m11 * mat.m20 - mat.m00 * mat.m11 * mat.m23 - mat.m01 * mat.m13 * mat.m20 - mat.m03 * mat.m10 * mat.m21) / det;
            var m30 = (mat.m10 * mat.m22 * mat.m31 + mat.m11 * mat.m20 * mat.m32 + mat.m12 * mat.m21 * mat.m30 - mat.m10 * mat.m21 * mat.m32 - mat.m11 * mat.m22 * mat.m30 - mat.m12 * mat.m20 * mat.m31) / det;
            var m31 = (mat.m00 * mat.m21 * mat.m32 + mat.m01 * mat.m22 * mat.m30 + mat.m02 * mat.m20 * mat.m31 - mat.m00 * mat.m22 * mat.m31 - mat.m01 * mat.m20 * mat.m32 - mat.m02 * mat.m21 * mat.m30) / det;
            var m32 = (mat.m00 * mat.m12 * mat.m31 + mat.m01 * mat.m10 * mat.m32 + mat.m02 * mat.m11 * mat.m30 - mat.m00 * mat.m11 * mat.m32 - mat.m01 * mat.m12 * mat.m30 - mat.m02 * mat.m10 * mat.m31) / det;
            var m33 = (mat.m00 * mat.m11 * mat.m22 + mat.m01 * mat.m12 * mat.m20 + mat.m02 * mat.m10 * mat.m21 - mat.m00 * mat.m12 * mat.m21 - mat.m01 * mat.m10 * mat.m22 - mat.m02 * mat.m11 * mat.m20) / det;
            return new ImmutableMatrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        Object.defineProperty(ImmutableMatrix44.prototype, "m00", {
            get: function () {
                return this.v[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m10", {
            get: function () {
                return this.v[1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m20", {
            get: function () {
                return this.v[2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m30", {
            get: function () {
                return this.v[3];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m01", {
            get: function () {
                return this.v[4];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m11", {
            get: function () {
                return this.v[5];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m21", {
            get: function () {
                return this.v[6];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m31", {
            get: function () {
                return this.v[7];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m02", {
            get: function () {
                return this.v[8];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m12", {
            get: function () {
                return this.v[9];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m22", {
            get: function () {
                return this.v[10];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m32", {
            get: function () {
                return this.v[11];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m03", {
            get: function () {
                return this.v[12];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m13", {
            get: function () {
                return this.v[13];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m23", {
            get: function () {
                return this.v[14];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableMatrix44.prototype, "m33", {
            get: function () {
                return this.v[15];
            },
            enumerable: true,
            configurable: true
        });
        ImmutableMatrix44.prototype.toString = function () {
            return this.m00 + ' ' + this.m01 + ' ' + this.m02 + ' ' + this.m03 + ' \n' +
                this.m10 + ' ' + this.m11 + ' ' + this.m12 + ' ' + this.m13 + ' \n' +
                this.m20 + ' ' + this.m21 + ' ' + this.m22 + ' ' + this.m23 + ' \n' +
                this.m30 + ' ' + this.m31 + ' ' + this.m32 + ' ' + this.m33 + ' \n';
        };
        ImmutableMatrix44.prototype.nearZeroToZero = function (value) {
            if (Math.abs(value) < 0.00001) {
                value = 0;
            }
            else if (0.99999 < value && value < 1.00001) {
                value = 1;
            }
            else if (-1.00001 < value && value < -0.99999) {
                value = -1;
            }
            return value;
        };
        ImmutableMatrix44.prototype.toStringApproximately = function () {
            return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + ' ' + this.nearZeroToZero(this.m03) + ' \n' +
                this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' ' + this.nearZeroToZero(this.m13) + ' \n' +
                this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + ' ' + this.nearZeroToZero(this.m23) + ' \n' +
                this.nearZeroToZero(this.m30) + ' ' + this.nearZeroToZero(this.m31) + ' ' + this.nearZeroToZero(this.m32) + ' ' + this.nearZeroToZero(this.m33) + ' \n';
        };
        ImmutableMatrix44.prototype.getScale = function () {
            return new ImmutableVector3(Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02), Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12), Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22));
        };
        ImmutableMatrix44.prototype.getRotate = function () {
            var quat = ImmutableQuaternion.fromMatrix(this);
            var rotateMat = new ImmutableMatrix44(quat);
            return rotateMat;
        };
        return ImmutableMatrix44;
    }());

    var MutableMatrix44 = /** @class */ (function (_super) {
        __extends(MutableMatrix44, _super);
        function MutableMatrix44(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, isColumnMajor, notCopyFloatArray) {
            if (isColumnMajor === void 0) { isColumnMajor = false; }
            if (notCopyFloatArray === void 0) { notCopyFloatArray = false; }
            var _this = this;
            var _isColumnMajor = (arguments.length >= 16) ? isColumnMajor : m1;
            var _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m2;
            if (arguments.length >= 16) {
                _this = _super.call(this, m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, _isColumnMajor, _notCopyFloatArray) || this;
            }
            else {
                _this = _super.call(this, m0, _isColumnMajor, _notCopyFloatArray) || this;
            }
            return _this;
        }
        MutableMatrix44.prototype.setComponents = function (m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
            this.v[0] = m00;
            this.v[4] = m01;
            this.v[8] = m02;
            this.v[12] = m03;
            this.v[1] = m10;
            this.v[5] = m11;
            this.v[9] = m12;
            this.v[13] = m13;
            this.v[2] = m20;
            this.v[6] = m21;
            this.v[10] = m22;
            this.v[14] = m23;
            this.v[3] = m30;
            this.v[7] = m31;
            this.v[11] = m32;
            this.v[15] = m33;
            return this;
        };
        MutableMatrix44.prototype.copyComponents = function (mat4) {
            //this.setComponents.apply(this, mat4.m); // 'm' must be row major array if isColumnMajor is false
            var m = mat4.v;
            this.v[0] = m[0];
            this.v[1] = m[1];
            this.v[2] = m[2];
            this.v[3] = m[3];
            this.v[4] = m[4];
            this.v[5] = m[5];
            this.v[6] = m[6];
            this.v[7] = m[7];
            this.v[8] = m[8];
            this.v[9] = m[9];
            this.v[10] = m[10];
            this.v[11] = m[11];
            this.v[12] = m[12];
            this.v[13] = m[13];
            this.v[14] = m[14];
            this.v[15] = m[15];
        };
        MutableMatrix44.dummy = function () {
            return new MutableMatrix44(null);
        };
        /**
         * to the identity matrix（static版）
         */
        MutableMatrix44.identity = function () {
            return new MutableMatrix44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        MutableMatrix44.prototype.translate = function (vec) {
            return this.setComponents(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
        };
        MutableMatrix44.prototype.putTranslate = function (vec) {
            this.m03 = vec.x;
            this.m13 = vec.y;
            this.m23 = vec.z;
        };
        MutableMatrix44.prototype.scale = function (vec) {
            return this.setComponents(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
        };
        MutableMatrix44.prototype.addScale = function (vec) {
            this.m00 *= vec.x;
            this.m11 *= vec.y;
            this.m22 *= vec.z;
            return this;
        };
        /**
         * Create X oriented Rotation Matrix
         */
        MutableMatrix44.prototype.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        MutableMatrix44.prototype.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
        };
        /**
       * Create Z oriented Rotation Matrix
       */
        MutableMatrix44.prototype.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        MutableMatrix44.prototype.rotateXYZ = function (x, y, z) {
            var cosX = Math.cos(x);
            var sinX = Math.sin(x);
            var cosY = Math.cos(y);
            var sinY = Math.sin(y);
            var cosZ = Math.cos(z);
            var sinZ = Math.sin(z);
            var xm00 = 1;
            //const xm01 = 0;
            //const xm02 = 0;
            //const xm10 = 0;
            var xm11 = cosX;
            var xm12 = -sinX;
            //const xm20 = 0;
            var xm21 = sinX;
            var xm22 = cosX;
            var ym00 = cosY;
            //const ym01 = 0;
            var ym02 = sinY;
            //const ym10 = 0;
            var ym11 = 1;
            //const ym12 = 0;
            var ym20 = -sinY;
            //const ym21 = 0;
            var ym22 = cosY;
            var zm00 = cosZ;
            var zm01 = -sinZ;
            //const zm02 = 0;
            var zm10 = sinZ;
            var zm11 = cosZ;
            //const zm12 = 0;
            //const zm20 = 0;
            //const zm21 = 0;
            var zm22 = 1;
            var yxm00 = ym00 * xm00;
            var yxm01 = ym02 * xm21;
            var yxm02 = ym02 * xm22;
            //const yxm10 = 0;
            var yxm11 = ym11 * xm11;
            var yxm12 = ym11 * xm12;
            var yxm20 = ym20 * xm00;
            var yxm21 = ym22 * xm21;
            var yxm22 = ym22 * xm22;
            this.v[0] = zm00 * yxm00;
            this.v[4] = zm00 * yxm01 + zm01 * yxm11;
            this.v[8] = zm00 * yxm02 + zm01 * yxm12;
            this.v[12] = 0;
            this.v[1] = zm10 * yxm00;
            this.v[5] = zm10 * yxm01 + zm11 * yxm11;
            this.v[9] = zm10 * yxm02 + zm11 * yxm12;
            this.v[13] = 0;
            this.v[2] = zm22 * yxm20;
            this.v[6] = zm22 * yxm21;
            this.v[10] = zm22 * yxm22;
            this.v[14] = 0;
            this.v[3] = 0;
            this.v[7] = 0;
            this.v[11] = 0;
            this.v[15] = 1;
            return this;
        };
        /**
         * to the identity matrix
         */
        MutableMatrix44.prototype.identity = function () {
            this.setComponents(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            return this;
        };
        MutableMatrix44.prototype._swap = function (l, r) {
            this.v[r] = [this.v[l], this.v[l] = this.v[r]][0]; // Swap
        };
        /**
         * transpose
         */
        MutableMatrix44.prototype.transpose = function () {
            this._swap(1, 4);
            this._swap(2, 8);
            this._swap(3, 12);
            this._swap(6, 9);
            this._swap(7, 13);
            this._swap(11, 14);
            return this;
        };
        /**
       * multiply zero matrix and zero matrix
       */
        MutableMatrix44.prototype.multiply = function (mat) {
            var m00 = this.m00 * mat.m00 + this.m01 * mat.m10 + this.m02 * mat.m20 + this.m03 * mat.m30;
            var m01 = this.m00 * mat.m01 + this.m01 * mat.m11 + this.m02 * mat.m21 + this.m03 * mat.m31;
            var m02 = this.m00 * mat.m02 + this.m01 * mat.m12 + this.m02 * mat.m22 + this.m03 * mat.m32;
            var m03 = this.m00 * mat.m03 + this.m01 * mat.m13 + this.m02 * mat.m23 + this.m03 * mat.m33;
            var m10 = this.m10 * mat.m00 + this.m11 * mat.m10 + this.m12 * mat.m20 + this.m13 * mat.m30;
            var m11 = this.m10 * mat.m01 + this.m11 * mat.m11 + this.m12 * mat.m21 + this.m13 * mat.m31;
            var m12 = this.m10 * mat.m02 + this.m11 * mat.m12 + this.m12 * mat.m22 + this.m13 * mat.m32;
            var m13 = this.m10 * mat.m03 + this.m11 * mat.m13 + this.m12 * mat.m23 + this.m13 * mat.m33;
            var m20 = this.m20 * mat.m00 + this.m21 * mat.m10 + this.m22 * mat.m20 + this.m23 * mat.m30;
            var m21 = this.m20 * mat.m01 + this.m21 * mat.m11 + this.m22 * mat.m21 + this.m23 * mat.m31;
            var m22 = this.m20 * mat.m02 + this.m21 * mat.m12 + this.m22 * mat.m22 + this.m23 * mat.m32;
            var m23 = this.m20 * mat.m03 + this.m21 * mat.m13 + this.m22 * mat.m23 + this.m23 * mat.m33;
            var m30 = this.m30 * mat.m00 + this.m31 * mat.m10 + this.m32 * mat.m20 + this.m33 * mat.m30;
            var m31 = this.m30 * mat.m01 + this.m31 * mat.m11 + this.m32 * mat.m21 + this.m33 * mat.m31;
            var m32 = this.m30 * mat.m02 + this.m31 * mat.m12 + this.m32 * mat.m22 + this.m33 * mat.m32;
            var m33 = this.m30 * mat.m03 + this.m31 * mat.m13 + this.m32 * mat.m23 + this.m33 * mat.m33;
            return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        MutableMatrix44.prototype.multiplyByLeft = function (mat) {
            var m00 = mat.m00 * this.m00 + mat.m01 * this.m10 + mat.m02 * this.m20 + mat.m03 * this.m30;
            var m01 = mat.m00 * this.m01 + mat.m01 * this.m11 + mat.m02 * this.m21 + mat.m03 * this.m31;
            var m02 = mat.m00 * this.m02 + mat.m01 * this.m12 + mat.m02 * this.m22 + mat.m03 * this.m32;
            var m03 = mat.m00 * this.m03 + mat.m01 * this.m13 + mat.m02 * this.m23 + mat.m03 * this.m33;
            var m10 = mat.m10 * this.m00 + mat.m11 * this.m10 + mat.m12 * this.m20 + mat.m13 * this.m30;
            var m11 = mat.m10 * this.m01 + mat.m11 * this.m11 + mat.m12 * this.m21 + mat.m13 * this.m31;
            var m12 = mat.m10 * this.m02 + mat.m11 * this.m12 + mat.m12 * this.m22 + mat.m13 * this.m32;
            var m13 = mat.m10 * this.m03 + mat.m11 * this.m13 + mat.m12 * this.m23 + mat.m13 * this.m33;
            var m20 = mat.m20 * this.m00 + mat.m21 * this.m10 + mat.m22 * this.m20 + mat.m23 * this.m30;
            var m21 = mat.m20 * this.m01 + mat.m21 * this.m11 + mat.m22 * this.m21 + mat.m23 * this.m31;
            var m22 = mat.m20 * this.m02 + mat.m21 * this.m12 + mat.m22 * this.m22 + mat.m23 * this.m32;
            var m23 = mat.m20 * this.m03 + mat.m21 * this.m13 + mat.m22 * this.m23 + mat.m23 * this.m33;
            var m30 = mat.m30 * this.m00 + mat.m31 * this.m10 + mat.m32 * this.m20 + mat.m33 * this.m30;
            var m31 = mat.m30 * this.m01 + mat.m31 * this.m11 + mat.m32 * this.m21 + mat.m33 * this.m31;
            var m32 = mat.m30 * this.m02 + mat.m31 * this.m12 + mat.m32 * this.m22 + mat.m33 * this.m32;
            var m33 = mat.m30 * this.m03 + mat.m31 * this.m13 + mat.m32 * this.m23 + mat.m33 * this.m33;
            return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        MutableMatrix44.prototype.invert = function () {
            var det = this.determinant();
            var m00 = (this.m11 * this.m22 * this.m33 + this.m12 * this.m23 * this.m31 + this.m13 * this.m21 * this.m32 - this.m11 * this.m23 * this.m32 - this.m12 * this.m21 * this.m33 - this.m13 * this.m22 * this.m31) / det;
            var m01 = (this.m01 * this.m23 * this.m32 + this.m02 * this.m21 * this.m33 + this.m03 * this.m22 * this.m31 - this.m01 * this.m22 * this.m33 - this.m02 * this.m23 * this.m31 - this.m03 * this.m21 * this.m32) / det;
            var m02 = (this.m01 * this.m12 * this.m33 + this.m02 * this.m13 * this.m31 + this.m03 * this.m11 * this.m32 - this.m01 * this.m13 * this.m32 - this.m02 * this.m11 * this.m33 - this.m03 * this.m12 * this.m31) / det;
            var m03 = (this.m01 * this.m13 * this.m22 + this.m02 * this.m11 * this.m23 + this.m03 * this.m12 * this.m21 - this.m01 * this.m12 * this.m23 - this.m02 * this.m13 * this.m21 - this.m03 * this.m11 * this.m22) / det;
            var m10 = (this.m10 * this.m23 * this.m32 + this.m12 * this.m20 * this.m33 + this.m13 * this.m22 * this.m30 - this.m10 * this.m22 * this.m33 - this.m12 * this.m23 * this.m30 - this.m13 * this.m20 * this.m32) / det;
            var m11 = (this.m00 * this.m22 * this.m33 + this.m02 * this.m23 * this.m30 + this.m03 * this.m20 * this.m32 - this.m00 * this.m23 * this.m32 - this.m02 * this.m20 * this.m33 - this.m03 * this.m22 * this.m30) / det;
            var m12 = (this.m00 * this.m13 * this.m32 + this.m02 * this.m10 * this.m33 + this.m03 * this.m12 * this.m30 - this.m00 * this.m12 * this.m33 - this.m02 * this.m13 * this.m30 - this.m03 * this.m10 * this.m32) / det;
            var m13 = (this.m00 * this.m12 * this.m23 + this.m02 * this.m13 * this.m20 + this.m03 * this.m10 * this.m22 - this.m00 * this.m13 * this.m22 - this.m02 * this.m10 * this.m23 - this.m03 * this.m12 * this.m20) / det;
            var m20 = (this.m10 * this.m21 * this.m33 + this.m11 * this.m23 * this.m30 + this.m13 * this.m20 * this.m31 - this.m10 * this.m23 * this.m31 - this.m11 * this.m20 * this.m33 - this.m13 * this.m21 * this.m30) / det;
            var m21 = (this.m00 * this.m23 * this.m31 + this.m01 * this.m20 * this.m33 + this.m03 * this.m21 * this.m30 - this.m00 * this.m21 * this.m33 - this.m01 * this.m23 * this.m30 - this.m03 * this.m20 * this.m31) / det;
            var m22 = (this.m00 * this.m11 * this.m33 + this.m01 * this.m13 * this.m30 + this.m03 * this.m10 * this.m31 - this.m00 * this.m13 * this.m31 - this.m01 * this.m10 * this.m33 - this.m03 * this.m11 * this.m30) / det;
            var m23 = (this.m00 * this.m13 * this.m21 + this.m01 * this.m10 * this.m23 + this.m03 * this.m11 * this.m20 - this.m00 * this.m11 * this.m23 - this.m01 * this.m13 * this.m20 - this.m03 * this.m10 * this.m21) / det;
            var m30 = (this.m10 * this.m22 * this.m31 + this.m11 * this.m20 * this.m32 + this.m12 * this.m21 * this.m30 - this.m10 * this.m21 * this.m32 - this.m11 * this.m22 * this.m30 - this.m12 * this.m20 * this.m31) / det;
            var m31 = (this.m00 * this.m21 * this.m32 + this.m01 * this.m22 * this.m30 + this.m02 * this.m20 * this.m31 - this.m00 * this.m22 * this.m31 - this.m01 * this.m20 * this.m32 - this.m02 * this.m21 * this.m30) / det;
            var m32 = (this.m00 * this.m12 * this.m31 + this.m01 * this.m10 * this.m32 + this.m02 * this.m11 * this.m30 - this.m00 * this.m11 * this.m32 - this.m01 * this.m12 * this.m30 - this.m02 * this.m10 * this.m31) / det;
            var m33 = (this.m00 * this.m11 * this.m22 + this.m01 * this.m12 * this.m20 + this.m02 * this.m10 * this.m21 - this.m00 * this.m12 * this.m21 - this.m01 * this.m10 * this.m22 - this.m02 * this.m11 * this.m20) / det;
            return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        /**
         * multiply zero matrix and zero matrix(static version)
         */
        MutableMatrix44.multiply = function (l_m, r_m) {
            var m00 = l_m.m00 * r_m.m00 + l_m.m01 * r_m.m10 + l_m.m02 * r_m.m20 + l_m.m03 * r_m.m30;
            var m10 = l_m.m10 * r_m.m00 + l_m.m11 * r_m.m10 + l_m.m12 * r_m.m20 + l_m.m13 * r_m.m30;
            var m20 = l_m.m20 * r_m.m00 + l_m.m21 * r_m.m10 + l_m.m22 * r_m.m20 + l_m.m23 * r_m.m30;
            var m30 = l_m.m30 * r_m.m00 + l_m.m31 * r_m.m10 + l_m.m32 * r_m.m20 + l_m.m33 * r_m.m30;
            var m01 = l_m.m00 * r_m.m01 + l_m.m01 * r_m.m11 + l_m.m02 * r_m.m21 + l_m.m03 * r_m.m31;
            var m11 = l_m.m10 * r_m.m01 + l_m.m11 * r_m.m11 + l_m.m12 * r_m.m21 + l_m.m13 * r_m.m31;
            var m21 = l_m.m20 * r_m.m01 + l_m.m21 * r_m.m11 + l_m.m22 * r_m.m21 + l_m.m23 * r_m.m31;
            var m31 = l_m.m30 * r_m.m01 + l_m.m31 * r_m.m11 + l_m.m32 * r_m.m21 + l_m.m33 * r_m.m31;
            var m02 = l_m.m00 * r_m.m02 + l_m.m01 * r_m.m12 + l_m.m02 * r_m.m22 + l_m.m03 * r_m.m32;
            var m12 = l_m.m10 * r_m.m02 + l_m.m11 * r_m.m12 + l_m.m12 * r_m.m22 + l_m.m13 * r_m.m32;
            var m22 = l_m.m20 * r_m.m02 + l_m.m21 * r_m.m12 + l_m.m22 * r_m.m22 + l_m.m23 * r_m.m32;
            var m32 = l_m.m30 * r_m.m02 + l_m.m31 * r_m.m12 + l_m.m32 * r_m.m22 + l_m.m33 * r_m.m32;
            var m03 = l_m.m00 * r_m.m03 + l_m.m01 * r_m.m13 + l_m.m02 * r_m.m23 + l_m.m03 * r_m.m33;
            var m13 = l_m.m10 * r_m.m03 + l_m.m11 * r_m.m13 + l_m.m12 * r_m.m23 + l_m.m13 * r_m.m33;
            var m23 = l_m.m20 * r_m.m03 + l_m.m21 * r_m.m13 + l_m.m22 * r_m.m23 + l_m.m23 * r_m.m33;
            var m33 = l_m.m30 * r_m.m03 + l_m.m31 * r_m.m13 + l_m.m32 * r_m.m23 + l_m.m33 * r_m.m33;
            return new MutableMatrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        /**
         * zero matrix
         */
        MutableMatrix44.prototype.zero = function () {
            this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            return this;
        };
        Object.defineProperty(MutableMatrix44.prototype, "m00", {
            get: function () {
                return this.v[0];
            },
            set: function (val) {
                this.v[0] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m10", {
            get: function () {
                return this.v[1];
            },
            set: function (val) {
                this.v[1] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m20", {
            get: function () {
                return this.v[2];
            },
            set: function (val) {
                this.v[2] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m30", {
            get: function () {
                return this.v[3];
            },
            set: function (val) {
                this.v[3] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m01", {
            get: function () {
                return this.v[4];
            },
            set: function (val) {
                this.v[4] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m11", {
            get: function () {
                return this.v[5];
            },
            set: function (val) {
                this.v[5] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m21", {
            get: function () {
                return this.v[6];
            },
            set: function (val) {
                this.v[6] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m31", {
            get: function () {
                return this.v[7];
            },
            set: function (val) {
                this.v[7] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m02", {
            get: function () {
                return this.v[8];
            },
            set: function (val) {
                this.v[8] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m12", {
            get: function () {
                return this.v[9];
            },
            set: function (val) {
                this.v[9] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m22", {
            get: function () {
                return this.v[10];
            },
            set: function (val) {
                this.v[10] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m32", {
            get: function () {
                return this.v[11];
            },
            set: function (val) {
                this.v[11] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m03", {
            get: function () {
                return this.v[12];
            },
            set: function (val) {
                this.v[12] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m13", {
            get: function () {
                return this.v[13];
            },
            set: function (val) {
                this.v[13] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m23", {
            get: function () {
                return this.v[14];
            },
            set: function (val) {
                this.v[14] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableMatrix44.prototype, "m33", {
            get: function () {
                return this.v[15];
            },
            set: function (val) {
                this.v[15] = val;
            },
            enumerable: true,
            configurable: true
        });
        return MutableMatrix44;
    }(ImmutableMatrix44));

    var AccessorBase = /** @class */ (function (_super) {
        __extends(AccessorBase, _super);
        function AccessorBase(_a) {
            var bufferView = _a.bufferView, byteOffset = _a.byteOffset, compositionType = _a.compositionType, componentType = _a.componentType, byteStride = _a.byteStride, count = _a.count, raw = _a.raw;
            var _this = _super.call(this, true) || this;
            _this.__compositionType = CompositionType.Unknown;
            _this.__componentType = ComponentType.Unknown;
            _this.__count = 0;
            _this.__takenCount = 0;
            _this.__byteStride = 0;
            _this.__bufferView = bufferView;
            _this.__byteOffsetInBuffer = bufferView.byteOffset + byteOffset;
            _this.__compositionType = compositionType;
            _this.__componentType = componentType;
            _this.__count = count;
            _this.__raw = raw.buffer;
            _this.__byteStride = byteStride;
            if (_this.__byteStride === 0) {
                _this.__byteStride = _this.__compositionType.getNumberOfComponents() * _this.__componentType.getSizeInBytes();
            }
            _this.prepare();
            return _this;
        }
        AccessorBase.prototype.prepare = function () {
            var typedArrayClass = this.getTypedArrayClass(this.__componentType);
            this.__typedArrayClass = typedArrayClass;
            if (this.__componentType.getSizeInBytes() === 8) {
                if (this.__byteOffsetInBuffer % 8 !== 0) {
                    console.info('Padding added because of byteOffset of accessor is not 8byte aligned despite of Double precision.');
                    this.__byteOffsetInBuffer += 8 - this.__byteOffsetInBuffer % 8;
                }
            }
            if (this.__bufferView.isSoA) {
                this.__dataView = new DataView(this.__raw, this.__byteOffsetInBuffer, this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes() * this.__count);
            }
            else {
                this.__dataView = new DataView(this.__raw, this.__byteOffsetInBuffer);
            }
            this.__typedArray = new typedArrayClass(this.__raw, this.__byteOffsetInBuffer, this.__compositionType.getNumberOfComponents() * this.__count);
            this.__dataViewGetter = this.__dataView[this.getDataViewGetter(this.__componentType)].bind(this.__dataView);
            this.__dataViewSetter = this.__dataView[this.getDataViewSetter(this.__componentType)].bind(this.__dataView);
        };
        AccessorBase.prototype.getTypedArrayClass = function (componentType) {
            switch (componentType) {
                case ComponentType.Byte: return Int8Array;
                case ComponentType.UnsignedByte: return Uint8Array;
                case ComponentType.Short: return Int16Array;
                case ComponentType.UnsignedShort: return Uint16Array;
                case ComponentType.Int: return Int32Array;
                case ComponentType.UnsingedInt: return Uint32Array;
                case ComponentType.Float: return Float32Array;
                case ComponentType.Double: return Float64Array;
                default: console.error('Unexpected ComponentType!');
            }
        };
        AccessorBase.prototype.getDataViewGetter = function (componentType) {
            switch (componentType) {
                case ComponentType.Byte: return 'getInt8';
                case ComponentType.UnsignedByte: return 'getUint8';
                case ComponentType.Short: return 'getInt16';
                case ComponentType.UnsignedShort: return 'getUint16';
                case ComponentType.Int: return 'getInt32';
                case ComponentType.UnsingedInt: return 'getUint32';
                case ComponentType.Float: return 'getFloat32';
                case ComponentType.Double: return 'getFloat64';
                default: console.error('Unexpected ComponentType!');
            }
        };
        AccessorBase.prototype.getDataViewSetter = function (componentType) {
            switch (componentType) {
                case ComponentType.Byte: return 'setInt8';
                case ComponentType.UnsignedByte: return 'setUint8';
                case ComponentType.Short: return 'setInt16';
                case ComponentType.UnsignedShort: return 'setUint16';
                case ComponentType.Int: return 'setInt32';
                case ComponentType.UnsingedInt: return 'setUint32';
                case ComponentType.Float: return 'setFloat32';
                case ComponentType.Double: return 'setFloat64';
                default: console.error('Unexpected ComponentType!');
            }
            return undefined;
        };
        AccessorBase.prototype.takeOne = function () {
            var arrayBufferOfBufferView = this.__raw;
            // let stride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
            // if (this.__bufferView.isAoS) {
            //   stride = this.__bufferView.byteStride;
            // }
            var subTypedArray = new this.__typedArrayClass(arrayBufferOfBufferView, this.__byteOffsetInBuffer + this.__byteStride * this.__takenCount, this.__compositionType.getNumberOfComponents());
            this.__takenCount += 1;
            return subTypedArray;
        };
        Object.defineProperty(AccessorBase.prototype, "numberOfComponents", {
            get: function () {
                return this.__compositionType.getNumberOfComponents();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "componentSizeInBytes", {
            get: function () {
                return this.__componentType.getSizeInBytes();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "elementSizeInBytes", {
            get: function () {
                return this.numberOfComponents * this.componentSizeInBytes;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "elementCount", {
            get: function () {
                return this.__dataView.byteLength / (this.numberOfComponents * this.componentSizeInBytes);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "byteLength", {
            get: function () {
                return this.__byteStride * this.__count;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "componentType", {
            get: function () {
                return this.__componentType;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "compositionType", {
            get: function () {
                return this.__compositionType;
            },
            enumerable: true,
            configurable: true
        });
        AccessorBase.prototype.getTypedArray = function () {
            if (this.__bufferView.isAoS) {
                console.warn('Be careful. this referance bufferView is AoS(Array on Structure), it means Interleaved Data. So you can not access your data properly by this TypedArray.');
            }
            return this.__typedArray;
        };
        Object.defineProperty(AccessorBase.prototype, "isAoS", {
            get: function () {
                return this.__bufferView.isAoS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "isSoA", {
            get: function () {
                return this.__bufferView.isSoA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "byteStride", {
            get: function () {
                return this.__byteStride;
            },
            enumerable: true,
            configurable: true
        });
        AccessorBase.prototype.getScalar = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return this.__dataViewGetter(this.__byteStride * index, endian);
        };
        AccessorBase.prototype.getScalarAt = function (index, compositionOffset, endian) {
            if (endian === void 0) { endian = true; }
            return this.__dataViewGetter(this.__byteStride * index + compositionOffset, endian);
        };
        AccessorBase.prototype.getVec2AsArray = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return [this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian)];
        };
        AccessorBase.prototype.getVec3AsArray = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return [this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian)];
        };
        AccessorBase.prototype.getVec4AsArray = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return [this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian)];
        };
        AccessorBase.prototype.getMat3AsArray = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return [
                this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian),
                this.__dataViewGetter(this.__byteStride * index + 3, endian), this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian),
                this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian), this.__dataViewGetter(this.__byteStride * index + 8, endian),
            ];
        };
        AccessorBase.prototype.getMat4AsArray = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return [
                this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian),
                this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian), this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian),
                this.__dataViewGetter(this.__byteStride * index + 8, endian), this.__dataViewGetter(this.__byteStride * index + 9, endian), this.__dataViewGetter(this.__byteStride * index + 10, endian), this.__dataViewGetter(this.__byteStride * index + 11, endian),
                this.__dataViewGetter(this.__byteStride * index + 12, endian), this.__dataViewGetter(this.__byteStride * index + 13, endian), this.__dataViewGetter(this.__byteStride * index + 14, endian), this.__dataViewGetter(this.__byteStride * index + 15, endian),
            ];
        };
        AccessorBase.prototype.getVec2 = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return new Vector2_F64(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian));
        };
        AccessorBase.prototype.getVec3 = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return new ImmutableVector3(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian));
        };
        AccessorBase.prototype.getVec4 = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return new ImmutableVector4(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian));
        };
        AccessorBase.prototype.getMat3 = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return new ImmutableMatrix33(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian), this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian), this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian), this.__dataViewGetter(this.__byteStride * index + 8, endian));
        };
        AccessorBase.prototype.getMat4 = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return new MutableMatrix44(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian), this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian), this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian), this.__dataViewGetter(this.__byteStride * index + 8, endian), this.__dataViewGetter(this.__byteStride * index + 9, endian), this.__dataViewGetter(this.__byteStride * index + 10, endian), this.__dataViewGetter(this.__byteStride * index + 11, endian), this.__dataViewGetter(this.__byteStride * index + 12, endian), this.__dataViewGetter(this.__byteStride * index + 13, endian), this.__dataViewGetter(this.__byteStride * index + 14, endian), this.__dataViewGetter(this.__byteStride * index + 15, endian));
        };
        AccessorBase.prototype.setScalar = function (index, value, endian) {
            if (endian === void 0) { endian = true; }
            this.__dataViewSetter(this.__byteStride * index, value, endian);
        };
        AccessorBase.prototype.setVec2 = function (index, x, y, endian) {
            if (endian === void 0) { endian = true; }
            var sizeInBytes = this.componentSizeInBytes;
            this.__dataViewSetter(this.__byteStride * index, x, endian);
            this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, y, endian);
        };
        AccessorBase.prototype.setVec3 = function (index, x, y, z, endian) {
            if (endian === void 0) { endian = true; }
            var sizeInBytes = this.componentSizeInBytes;
            this.__dataViewSetter(this.__byteStride * index, x, endian);
            this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, y, endian);
            this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, z, endian);
        };
        AccessorBase.prototype.setVec4 = function (index, x, y, z, w, endian) {
            if (endian === void 0) { endian = true; }
            var sizeInBytes = this.componentSizeInBytes;
            this.__dataViewSetter(this.__byteStride * index, x, endian);
            this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, y, endian);
            this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, z, endian);
            this.__dataViewSetter(this.__byteStride * index + 3 * sizeInBytes, w, endian);
        };
        AccessorBase.prototype.copyFromTypedArray = function (typedArray) {
            var componentN = this.numberOfComponents;
            var setter = this['setVec' + componentN];
            for (var j = 0; j < (typedArray.byteLength / this.componentSizeInBytes); j++) {
                var idx = Math.floor(j / componentN);
                var idxN = idx * componentN;
                switch (componentN) {
                    case 1:
                        setter.call(this, idx, typedArray[idxN + 0]);
                        break;
                    case 2:
                        setter.call(this, idx, typedArray[idxN + 0], typedArray[idxN + 1]);
                        break;
                    case 3:
                        setter.call(this, idx, typedArray[idxN + 0], typedArray[idxN + 1], typedArray[idxN + 2]);
                        break;
                    case 4:
                        setter.call(this, idx, typedArray[idxN + 0], typedArray[idxN + 1], typedArray[idxN + 2], typedArray[idxN + 3]);
                        break;
                    default: throw new Error('Other than vectors are currently not supported.');
                }
            }
        };
        AccessorBase.prototype.setScalarAt = function (index, conpositionOffset, value, endian) {
            if (endian === void 0) { endian = true; }
            this.__dataViewSetter(this.__byteStride * index + conpositionOffset, value, endian);
        };
        Object.defineProperty(AccessorBase.prototype, "arrayBufferOfBufferView", {
            get: function () {
                return this.__raw;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "dataViewOfBufferView", {
            get: function () {
                return this.__dataView;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "byteOffsetInBufferView", {
            get: function () {
                return this.__byteOffsetInBuffer - this.__bufferView.byteOffset;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "byteOffsetInBuffer", {
            get: function () {
                return this.__byteOffsetInBuffer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessorBase.prototype, "bufferView", {
            get: function () {
                return this.__bufferView;
            },
            enumerable: true,
            configurable: true
        });
        return AccessorBase;
    }(RnObject));

    var FlexibleAccessor = /** @class */ (function (_super) {
        __extends(FlexibleAccessor, _super);
        function FlexibleAccessor(_a) {
            var bufferView = _a.bufferView, byteOffset = _a.byteOffset, compositionType = _a.compositionType, componentType = _a.componentType, byteStride = _a.byteStride, count = _a.count, raw = _a.raw;
            return _super.call(this, { bufferView: bufferView, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: raw }) || this;
        }
        return FlexibleAccessor;
    }(AccessorBase));

    var BufferView = /** @class */ (function (_super) {
        __extends(BufferView, _super);
        function BufferView(_a) {
            var buffer = _a.buffer, byteOffset = _a.byteOffset, byteLength = _a.byteLength, raw = _a.raw, isAoS = _a.isAoS;
            var _this = _super.call(this, true) || this;
            _this.__byteStride = 0;
            _this.__target = 0;
            _this.__takenByteIndex = 0;
            _this.__takenByteOffsetOfFirstElement = 0;
            _this.__accessors = [];
            _this.__buffer = buffer;
            _this.__byteOffset = byteOffset;
            _this.__byteLength = byteLength;
            _this.__raw = raw;
            _this.__isAoS = isAoS;
            return _this;
        }
        Object.defineProperty(BufferView.prototype, "byteStride", {
            get: function () {
                return this.__byteStride;
            },
            set: function (stride) {
                this.__byteStride = stride;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BufferView.prototype, "byteLength", {
            get: function () {
                return this.__byteLength;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BufferView.prototype, "byteOffset", {
            get: function () {
                return this.__byteOffset;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BufferView.prototype, "buffer", {
            get: function () {
                return this.__buffer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BufferView.prototype, "isSoA", {
            get: function () {
                return !this.__isAoS;
            },
            enumerable: true,
            configurable: true
        });
        BufferView.prototype.recheckIsSoA = function () {
            if (this.__accessors.length <= 1) {
                return true;
            }
            var firstStrideBytes = this.__accessors[0].byteStride;
            var secondStrideBytes = this.__accessors[1].byteStride;
            var firstElementSizeInBytes = this.__accessors[0].elementSizeInBytes;
            var secondElementSizeInBytes = this.__accessors[1].elementSizeInBytes;
            if (firstStrideBytes === secondStrideBytes &&
                (firstElementSizeInBytes + secondElementSizeInBytes) < firstElementSizeInBytes) {
                return true;
            }
        };
        Object.defineProperty(BufferView.prototype, "isAoS", {
            get: function () {
                return this.__isAoS;
            },
            enumerable: true,
            configurable: true
        });
        BufferView.prototype.getUint8Array = function () {
            return this.__raw;
        };
        BufferView.prototype.takeAccessor = function (_a) {
            var compositionType = _a.compositionType, componentType = _a.componentType, count = _a.count;
            var byteStride = this.byteStride;
            var accessor = this.__takeAccessorInner({ compositionType: compositionType, componentType: componentType, count: count, byteStride: byteStride, accessorClass: AccessorBase });
            return accessor;
        };
        BufferView.prototype.takeFlexibleAccessor = function (_a) {
            var compositionType = _a.compositionType, componentType = _a.componentType, count = _a.count, byteStride = _a.byteStride;
            var accessor = this.__takeAccessorInner({ compositionType: compositionType, componentType: componentType, count: count, byteStride: byteStride, accessorClass: FlexibleAccessor });
            return accessor;
        };
        BufferView.prototype.takeAccessorWithByteOffset = function (_a) {
            var compositionType = _a.compositionType, componentType = _a.componentType, count = _a.count, byteOffset = _a.byteOffset;
            var byteStride = this.byteStride;
            var accessor = this.__takeAccessorInnerWithByteOffset({ compositionType: compositionType, componentType: componentType, count: count, byteStride: byteStride, byteOffset: byteOffset, accessorClass: AccessorBase });
            return accessor;
        };
        BufferView.prototype.takeFlexibleAccessorWithByteOffset = function (_a) {
            var compositionType = _a.compositionType, componentType = _a.componentType, count = _a.count, byteStride = _a.byteStride, byteOffset = _a.byteOffset;
            var accessor = this.__takeAccessorInnerWithByteOffset({ compositionType: compositionType, componentType: componentType, count: count, byteStride: byteStride, byteOffset: byteOffset, accessorClass: FlexibleAccessor });
            return accessor;
        };
        BufferView.prototype.__takeAccessorInner = function (_a) {
            var compositionType = _a.compositionType, componentType = _a.componentType, count = _a.count, byteStride = _a.byteStride, accessorClass = _a.accessorClass;
            var byteOffset = 0;
            if (this.isSoA) {
                byteOffset = this.__takenByteIndex;
                this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * count;
            }
            else {
                byteOffset = this.__takenByteIndex;
                this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
            }
            if (byteOffset % 4 !== 0) {
                console.info('Padding bytes added because byteOffset is not 4byte aligned.');
                byteOffset += 4 - byteOffset % 4;
            }
            if (this.__byteOffset % 4 !== 0) {
                console.info('Padding bytes added because byteOffsetFromBuffer is not 4byte aligned.');
                this.__byteOffset += 4 - this.__byteOffset % 4;
            }
            var accessor = new accessorClass({
                bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw
            });
            this.__accessors.push(accessor);
            return accessor;
        };
        BufferView.prototype.__takeAccessorInnerWithByteOffset = function (_a) {
            var compositionType = _a.compositionType, componentType = _a.componentType, count = _a.count, byteStride = _a.byteStride, byteOffset = _a.byteOffset, accessorClass = _a.accessorClass;
            if (byteOffset % 4 !== 0) {
                console.info('Padding bytes added because byteOffset is not 4byte aligned.');
                byteOffset += 4 - byteOffset % 4;
            }
            if (this.__byteOffset % 4 !== 0) {
                console.info('Padding bytes added because byteOffsetFromBuffer is not 4byte aligned.');
                this.__byteOffset += 4 - this.__byteOffset % 4;
            }
            var accessor = new accessorClass({
                bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw
            });
            this.__accessors.push(accessor);
            return accessor;
        };
        return BufferView;
    }(RnObject));

    var Buffer$1 = /** @class */ (function (_super) {
        __extends(Buffer, _super);
        function Buffer(_a) {
            var byteLength = _a.byteLength, arrayBuffer = _a.arrayBuffer, name = _a.name;
            var _this = _super.call(this, true) || this;
            _this.__byteLength = 0;
            _this.__name = '';
            _this.__takenBytesIndex = 0;
            _this.__bufferViews = [];
            _this.__name = name;
            _this.__byteLength = byteLength;
            _this.__raw = arrayBuffer;
            return _this;
        }
        Object.defineProperty(Buffer.prototype, "name", {
            get: function () {
                return this.__name;
            },
            set: function (str) {
                this.__name = str;
            },
            enumerable: true,
            configurable: true
        });
        Buffer.prototype.getArrayBuffer = function () {
            return this.__raw;
        };
        Buffer.prototype.takeBufferView = function (_a) {
            var byteLengthToNeed = _a.byteLengthToNeed, byteStride = _a.byteStride, isAoS = _a.isAoS;
            if (byteLengthToNeed % 4 !== 0) {
                console.info('Padding bytes added because byteLengthToNeed must be a multiple of 4.');
                byteLengthToNeed += 4 - (byteLengthToNeed % 4);
            }
            if (byteStride % 4 !== 0) {
                console.info('Padding bytes added, byteStride must be a multiple of 4.');
                byteStride += 4 - (byteStride % 4);
            }
            var array = new Uint8Array(this.__raw, this.__takenBytesIndex, byteLengthToNeed);
            var bufferView = new BufferView({ buffer: this, byteOffset: this.__takenBytesIndex, byteLength: byteLengthToNeed, raw: array, isAoS: isAoS });
            bufferView.byteStride = byteStride;
            this.__takenBytesIndex += Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed;
            this.__bufferViews.push(bufferView);
            return bufferView;
        };
        Buffer.prototype.takeBufferViewWithByteOffset = function (_a) {
            var byteLengthToNeed = _a.byteLengthToNeed, byteStride = _a.byteStride, byteOffset = _a.byteOffset, isAoS = _a.isAoS;
            if (byteLengthToNeed % 4 !== 0) {
                console.info('Padding bytes added because byteLengthToNeed must be a multiple of 4.');
                byteLengthToNeed += 4 - (byteLengthToNeed % 4);
            }
            if (byteStride % 4 !== 0) {
                console.info('Padding bytes added, byteStride must be a multiple of 4.');
                byteStride += 4 - (byteStride % 4);
            }
            var array = new Uint8Array(this.__raw, byteOffset, byteLengthToNeed);
            var bufferView = new BufferView({ buffer: this, byteOffset: byteOffset, byteLength: byteLengthToNeed, raw: array, isAoS: isAoS });
            bufferView.byteStride = byteStride;
            this.__bufferViews.push(bufferView);
            return bufferView;
        };
        Object.defineProperty(Buffer.prototype, "byteSizeInUse", {
            get: function () {
                return this.__byteLength;
            },
            enumerable: true,
            configurable: true
        });
        return Buffer;
    }(RnObject));

    var BufferUseClass = /** @class */ (function (_super) {
        __extends(BufferUseClass, _super);
        function BufferUseClass(_a) {
            var index = _a.index, str = _a.str;
            return _super.call(this, { index: index, str: str }) || this;
        }
        return BufferUseClass;
    }(EnumClass));
    var GPUInstanceData = new BufferUseClass({ index: 0, str: 'GPUInstanceData' });
    var GPUVertexData = new BufferUseClass({ index: 1, str: 'GPUVertexData' });
    var UBOGeneric = new BufferUseClass({ index: 2, str: 'UBOGeneric' });
    var CPUGeneric = new BufferUseClass({ index: 3, str: 'CPUGeneric' });
    var typeList$4 = [GPUInstanceData, GPUVertexData, UBOGeneric, CPUGeneric];
    function from$4(index) {
        return _from({ typeList: typeList$4, index: index });
    }
    function fromString$2(str) {
        return _fromString({ typeList: typeList$4, str: str });
    }
    var BufferUse = Object.freeze({ GPUInstanceData: GPUInstanceData, GPUVertexData: GPUVertexData, UBOGeneric: UBOGeneric, CPUGeneric: CPUGeneric, from: from$4, fromString: fromString$2 });

    /**
     * Usage
     * const mm = MemoryManager.getInstance();
     * this.translate = new Vector3(
     *   mm.assignMem(componentUID, propetyId, entityUID, isRendered)
     * );
     */
    var MemoryManager = /** @class */ (function () {
        function MemoryManager() {
            //__entityMaxCount: number;
            this.__buffers = {};
            // BufferForGPUInstanceData
            {
                var arrayBuffer = new ArrayBuffer(MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
                var buffer = new Buffer$1({
                    byteLength: arrayBuffer.byteLength,
                    arrayBuffer: arrayBuffer,
                    name: BufferUse.GPUInstanceData.toString()
                });
                this.__buffers[buffer.name] = buffer;
            }
            // BufferForGPUVertexData
            {
                var arrayBuffer = new ArrayBuffer(MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
                var buffer = new Buffer$1({
                    byteLength: arrayBuffer.byteLength,
                    arrayBuffer: arrayBuffer,
                    name: BufferUse.GPUVertexData.toString()
                });
                this.__buffers[buffer.name] = buffer;
            }
            // BufferForUBO
            {
                var arrayBuffer = new ArrayBuffer((MemoryManager.bufferWidthLength - 1) * (MemoryManager.bufferHeightLength - 1) /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
                var buffer = new Buffer$1({
                    byteLength: arrayBuffer.byteLength,
                    arrayBuffer: arrayBuffer,
                    name: BufferUse.UBOGeneric.toString()
                });
                this.__buffers[buffer.name] = buffer;
            }
            // BufferForCP
            {
                var arrayBuffer = new ArrayBuffer(MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
                var buffer = new Buffer$1({
                    byteLength: arrayBuffer.byteLength,
                    arrayBuffer: arrayBuffer,
                    name: BufferUse.CPUGeneric.toString()
                });
                this.__buffers[buffer.name] = buffer;
            }
        }
        MemoryManager.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new MemoryManager();
            }
            return this.__instance;
        };
        MemoryManager.prototype.getBuffer = function (bufferUse) {
            return this.__buffers[bufferUse.toString()];
        };
        Object.defineProperty(MemoryManager, "bufferWidthLength", {
            get: function () {
                return MemoryManager.__bufferWidthLength;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MemoryManager, "bufferHeightLength", {
            get: function () {
                return MemoryManager.__bufferHeightLength;
            },
            enumerable: true,
            configurable: true
        });
        MemoryManager.__bufferWidthLength = Math.pow(2, 8);
        MemoryManager.__bufferHeightLength = Math.pow(2, 8);
        return MemoryManager;
    }());

    var FloatArray$2 = Float32Array;
    var ImmutableRowMajarMatrix44 = /** @class */ (function () {
        function ImmutableRowMajarMatrix44(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, notCopyFloatArray) {
            if (notCopyFloatArray === void 0) { notCopyFloatArray = false; }
            var _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m1;
            var m = m0;
            if (m == null) {
                this.v = new FloatArray$2(0);
                return;
            }
            if (arguments.length >= 16) {
                var m_1 = arguments;
                this.v = new FloatArray$2(16); // Data order is row major
                this.v[0] = m_1[0];
                this.v[4] = m_1[4];
                this.v[8] = m_1[8];
                this.v[12] = m_1[12];
                this.v[1] = m_1[1];
                this.v[5] = m_1[5];
                this.v[9] = m_1[9];
                this.v[13] = m_1[13];
                this.v[2] = m_1[2];
                this.v[6] = m_1[6];
                this.v[10] = m_1[10];
                this.v[14] = m_1[14];
                this.v[3] = m_1[3];
                this.v[7] = m_1[7];
                this.v[11] = m_1[11];
                this.v[15] = m_1[15];
            }
            else if (Array.isArray(m)) {
                this.v = new FloatArray$2(16);
                this.v[0] = m[0];
                this.v[4] = m[4];
                this.v[8] = m[8];
                this.v[12] = m[12];
                this.v[1] = m[1];
                this.v[5] = m[5];
                this.v[9] = m[9];
                this.v[13] = m[13];
                this.v[2] = m[2];
                this.v[6] = m[6];
                this.v[10] = m[10];
                this.v[14] = m[14];
                this.v[3] = m[3];
                this.v[7] = m[7];
                this.v[11] = m[11];
                this.v[15] = m[15];
            }
            else if (m instanceof FloatArray$2) {
                if (_notCopyFloatArray) {
                    this.v = m;
                }
                else {
                    this.v = new FloatArray$2(16);
                    this.v[0] = m[0];
                    this.v[4] = m[4];
                    this.v[8] = m[8];
                    this.v[12] = m[12];
                    this.v[1] = m[1];
                    this.v[5] = m[5];
                    this.v[9] = m[9];
                    this.v[13] = m[13];
                    this.v[2] = m[2];
                    this.v[6] = m[6];
                    this.v[10] = m[10];
                    this.v[14] = m[14];
                    this.v[3] = m[3];
                    this.v[7] = m[7];
                    this.v[11] = m[11];
                    this.v[15] = m[15];
                }
            }
            else if (!!m && typeof m.m33 !== 'undefined' && typeof m.m22 !== 'undefined') {
                if (_notCopyFloatArray) {
                    this.v = m.v;
                }
                else {
                    this.v = new FloatArray$2(16);
                    this.v[0] = m.m00;
                    this.v[4] = m.m10;
                    this.v[8] = m.m20;
                    this.v[12] = m.m30;
                    this.v[1] = m.m01;
                    this.v[5] = m.m11;
                    this.v[9] = m.m21;
                    this.v[13] = m.m31;
                    this.v[2] = m.m02;
                    this.v[6] = m.m12;
                    this.v[10] = m.m22;
                    this.v[14] = m.m32;
                    this.v[3] = m.m03;
                    this.v[7] = m.m13;
                    this.v[11] = m.m23;
                    this.v[15] = m.m33;
                }
            }
            else if (!!m && typeof m.m33 === 'undefined' && typeof m.m22 !== 'undefined') {
                if (_notCopyFloatArray) {
                    this.v = m.v;
                }
                else {
                    this.v = new FloatArray$2(16);
                    this.v[0] = m.m00;
                    this.v[4] = m.m10;
                    this.v[8] = m.m20;
                    this.v[12] = 0;
                    this.v[1] = m.m01;
                    this.v[5] = m.m11;
                    this.v[9] = m.m21;
                    this.v[13] = 0;
                    this.v[2] = m.m02;
                    this.v[6] = m.m12;
                    this.v[10] = m.m22;
                    this.v[14] = 0;
                    this.v[3] = 0;
                    this.v[7] = 0;
                    this.v[11] = 0;
                    this.v[15] = 1;
                }
            }
            else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
                this.v = new FloatArray$2(16);
                var sx = m.x * m.x;
                var sy = m.y * m.y;
                var sz = m.z * m.z;
                var cx = m.y * m.z;
                var cy = m.x * m.z;
                var cz = m.x * m.y;
                var wx = m.w * m.x;
                var wy = m.w * m.y;
                var wz = m.w * m.z;
                this.v[0] = 1.0 - 2.0 * (sy + sz);
                this.v[1] = 2.0 * (cz - wz);
                this.v[2] = 2.0 * (cy + wy);
                this.v[3] = 0;
                this.v[4] = 2.0 * (cz + wz);
                this.v[5] = 1.0 - 2.0 * (sx + sz);
                this.v[6] = 2.0 * (cx - wx);
                this.v[7] = 0;
                this.v[8] = 2.0 * (cy - wy);
                this.v[9] = 2.0 * (cx + wx);
                this.v[10] = 1.0 - 2.0 * (sx + sy);
                this.v[11] = 0;
                this.v[12] = 0;
                this.v[13] = 0;
                this.v[14] = 0;
                this.v[15] = 1;
            }
            else {
                this.v = new FloatArray$2(16);
                this.v[0] = 1;
                this.v[4] = 0;
                this.v[8] = 0;
                this.v[12] = 0;
                this.v[1] = 0;
                this.v[5] = 1;
                this.v[9] = 0;
                this.v[13] = 0;
                this.v[2] = 0;
                this.v[6] = 0;
                this.v[10] = 1;
                this.v[14] = 0;
                this.v[3] = 0;
                this.v[7] = 0;
                this.v[11] = 0;
                this.v[15] = 1;
            }
        }
        ImmutableRowMajarMatrix44.dummy = function () {
            return new ImmutableRowMajarMatrix44(null);
        };
        ImmutableRowMajarMatrix44.prototype.isDummy = function () {
            if (this.v.length === 0) {
                return true;
            }
            else {
                return false;
            }
        };
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        ImmutableRowMajarMatrix44.prototype.clone = function () {
            return new ImmutableRowMajarMatrix44(this.v[0], this.v[1], this.v[2], this.v[3], this.v[4], this.v[5], this.v[6], this.v[7], this.v[8], this.v[9], this.v[10], this.v[11], this.v[12], this.v[13], this.v[14], this.v[15]);
        };
        /**
         * to the identity matrix（static版）
         */
        ImmutableRowMajarMatrix44.identity = function () {
            return new ImmutableRowMajarMatrix44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        ImmutableRowMajarMatrix44.prototype.isEqual = function (mat, delta) {
            if (delta === void 0) { delta = Number.EPSILON; }
            if (Math.abs(mat.v[0] - this.v[0]) < delta &&
                Math.abs(mat.v[1] - this.v[1]) < delta &&
                Math.abs(mat.v[2] - this.v[2]) < delta &&
                Math.abs(mat.v[3] - this.v[3]) < delta &&
                Math.abs(mat.v[4] - this.v[4]) < delta &&
                Math.abs(mat.v[5] - this.v[5]) < delta &&
                Math.abs(mat.v[6] - this.v[6]) < delta &&
                Math.abs(mat.v[7] - this.v[7]) < delta &&
                Math.abs(mat.v[8] - this.v[8]) < delta &&
                Math.abs(mat.v[9] - this.v[9]) < delta &&
                Math.abs(mat.v[10] - this.v[10]) < delta &&
                Math.abs(mat.v[11] - this.v[11]) < delta &&
                Math.abs(mat.v[12] - this.v[12]) < delta &&
                Math.abs(mat.v[13] - this.v[13]) < delta &&
                Math.abs(mat.v[14] - this.v[14]) < delta &&
                Math.abs(mat.v[15] - this.v[15]) < delta) {
                return true;
            }
            else {
                return false;
            }
        };
        ImmutableRowMajarMatrix44.prototype.getTranslate = function () {
            return new ImmutableVector3(this.m03, this.m13, this.m23);
        };
        ImmutableRowMajarMatrix44.translate = function (vec) {
            return new ImmutableRowMajarMatrix44(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
        };
        ImmutableRowMajarMatrix44.scale = function (vec) {
            return new ImmutableRowMajarMatrix44(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
        };
        /**
         * Create X oriented Rotation Matrix
        */
        ImmutableRowMajarMatrix44.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new ImmutableRowMajarMatrix44(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        ImmutableRowMajarMatrix44.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new ImmutableRowMajarMatrix44(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        ImmutableRowMajarMatrix44.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new ImmutableRowMajarMatrix44(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        /**
         * @return Euler Angles Rotation (x, y, z)
         */
        ImmutableRowMajarMatrix44.prototype.toEulerAngles = function () {
            var rotate = null;
            if (Math.abs(this.m20) != 1.0) {
                var y = -Math.asin(this.m20);
                var x = Math.atan2(this.m21 / Math.cos(y), this.m22 / Math.cos(y));
                var z = Math.atan2(this.m10 / Math.cos(y), this.m00 / Math.cos(y));
                rotate = new ImmutableVector3(x, y, z);
            }
            else if (this.m20 === -1.0) {
                rotate = new ImmutableVector3(Math.atan2(this.m01, this.m02), Math.PI / 2.0, 0.0);
            }
            else {
                rotate = new ImmutableVector3(Math.atan2(-this.m01, -this.m02), -Math.PI / 2.0, 0.0);
            }
            return rotate;
        };
        ImmutableRowMajarMatrix44.zero = function () {
            return new ImmutableRowMajarMatrix44(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        };
        ImmutableRowMajarMatrix44.prototype.raw = function () {
            return this.v;
        };
        ImmutableRowMajarMatrix44.prototype.flattenAsArray = function () {
            return [this.v[0], this.v[1], this.v[2], this.v[3],
                this.v[4], this.v[5], this.v[6], this.v[7],
                this.v[8], this.v[9], this.v[10], this.v[11],
                this.v[12], this.v[13], this.v[14], this.v[15]];
        };
        /**
         * transpose(static version)
         */
        ImmutableRowMajarMatrix44.transpose = function (mat) {
            var mat_t = new ImmutableRowMajarMatrix44(mat.m00, mat.m10, mat.m20, mat.m30, mat.m01, mat.m11, mat.m21, mat.m31, mat.m02, mat.m12, mat.m22, mat.m32, mat.m03, mat.m13, mat.m23, mat.m33);
            return mat_t;
        };
        ImmutableRowMajarMatrix44.prototype.multiplyVector = function (vec) {
            var x = this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z + this.m03 * vec.w;
            var y = this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z + this.m13 * vec.w;
            var z = this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z + this.m23 * vec.w;
            var w = this.m30 * vec.x + this.m31 * vec.y + this.m32 * vec.z + this.m33 * vec.w;
            return new ImmutableVector4(x, y, z, w);
        };
        /**
         * multiply zero matrix and zero matrix(static version)
         */
        ImmutableRowMajarMatrix44.multiply = function (l_m, r_m) {
            var m00 = l_m.m00 * r_m.m00 + l_m.m01 * r_m.m10 + l_m.m02 * r_m.m20 + l_m.m03 * r_m.m30;
            var m10 = l_m.m10 * r_m.m00 + l_m.m11 * r_m.m10 + l_m.m12 * r_m.m20 + l_m.m13 * r_m.m30;
            var m20 = l_m.m20 * r_m.m00 + l_m.m21 * r_m.m10 + l_m.m22 * r_m.m20 + l_m.m23 * r_m.m30;
            var m30 = l_m.m30 * r_m.m00 + l_m.m31 * r_m.m10 + l_m.m32 * r_m.m20 + l_m.m33 * r_m.m30;
            var m01 = l_m.m00 * r_m.m01 + l_m.m01 * r_m.m11 + l_m.m02 * r_m.m21 + l_m.m03 * r_m.m31;
            var m11 = l_m.m10 * r_m.m01 + l_m.m11 * r_m.m11 + l_m.m12 * r_m.m21 + l_m.m13 * r_m.m31;
            var m21 = l_m.m20 * r_m.m01 + l_m.m21 * r_m.m11 + l_m.m22 * r_m.m21 + l_m.m23 * r_m.m31;
            var m31 = l_m.m30 * r_m.m01 + l_m.m31 * r_m.m11 + l_m.m32 * r_m.m21 + l_m.m33 * r_m.m31;
            var m02 = l_m.m00 * r_m.m02 + l_m.m01 * r_m.m12 + l_m.m02 * r_m.m22 + l_m.m03 * r_m.m32;
            var m12 = l_m.m10 * r_m.m02 + l_m.m11 * r_m.m12 + l_m.m12 * r_m.m22 + l_m.m13 * r_m.m32;
            var m22 = l_m.m20 * r_m.m02 + l_m.m21 * r_m.m12 + l_m.m22 * r_m.m22 + l_m.m23 * r_m.m32;
            var m32 = l_m.m30 * r_m.m02 + l_m.m31 * r_m.m12 + l_m.m32 * r_m.m22 + l_m.m33 * r_m.m32;
            var m03 = l_m.m00 * r_m.m03 + l_m.m01 * r_m.m13 + l_m.m02 * r_m.m23 + l_m.m03 * r_m.m33;
            var m13 = l_m.m10 * r_m.m03 + l_m.m11 * r_m.m13 + l_m.m12 * r_m.m23 + l_m.m13 * r_m.m33;
            var m23 = l_m.m20 * r_m.m03 + l_m.m21 * r_m.m13 + l_m.m22 * r_m.m23 + l_m.m23 * r_m.m33;
            var m33 = l_m.m30 * r_m.m03 + l_m.m31 * r_m.m13 + l_m.m32 * r_m.m23 + l_m.m33 * r_m.m33;
            return new ImmutableRowMajarMatrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        ImmutableRowMajarMatrix44.prototype.determinant = function () {
            return this.m00 * this.m11 * this.m22 * this.m33 + this.m00 * this.m12 * this.m23 * this.m31 + this.m00 * this.m13 * this.m21 * this.m32 +
                this.m01 * this.m10 * this.m23 * this.m32 + this.m01 * this.m12 * this.m20 * this.m33 + this.m01 * this.m13 * this.m22 * this.m30 +
                this.m02 * this.m10 * this.m21 * this.m33 + this.m02 * this.m11 * this.m23 * this.m30 + this.m02 * this.m13 * this.m20 * this.m31 +
                this.m03 * this.m10 * this.m22 * this.m31 + this.m03 * this.m11 * this.m20 * this.m32 + this.m03 * this.m12 * this.m21 * this.m30 -
                this.m00 * this.m11 * this.m23 * this.m32 - this.m00 * this.m12 * this.m21 * this.m33 - this.m00 * this.m13 * this.m22 * this.m31 -
                this.m01 * this.m10 * this.m22 * this.m33 - this.m01 * this.m12 * this.m23 * this.m30 - this.m01 * this.m13 * this.m20 * this.m32 -
                this.m02 * this.m10 * this.m23 * this.m31 - this.m02 * this.m11 * this.m20 * this.m33 - this.m02 * this.m13 * this.m21 * this.m30 -
                this.m03 * this.m10 * this.m21 * this.m32 - this.m03 * this.m11 * this.m22 * this.m30 - this.m03 * this.m12 * this.m20 * this.m31;
        };
        ImmutableRowMajarMatrix44.determinant = function (mat) {
            return mat.m00 * mat.m11 * mat.m22 * mat.m33 + mat.m00 * mat.m12 * mat.m23 * mat.m31 + mat.m00 * mat.m13 * mat.m21 * mat.m32 +
                mat.m01 * mat.m10 * mat.m23 * mat.m32 + mat.m01 * mat.m12 * mat.m20 * mat.m33 + mat.m01 * mat.m13 * mat.m22 * mat.m30 +
                mat.m02 * mat.m10 * mat.m21 * mat.m33 + mat.m02 * mat.m11 * mat.m23 * mat.m30 + mat.m02 * mat.m13 * mat.m20 * mat.m31 +
                mat.m03 * mat.m10 * mat.m22 * mat.m31 + mat.m03 * mat.m11 * mat.m20 * mat.m32 + mat.m03 * mat.m12 * mat.m21 * mat.m30 -
                mat.m00 * mat.m11 * mat.m23 * mat.m32 - mat.m00 * mat.m12 * mat.m21 * mat.m33 - mat.m00 * mat.m13 * mat.m22 * mat.m31 -
                mat.m01 * mat.m10 * mat.m22 * mat.m33 - mat.m01 * mat.m12 * mat.m23 * mat.m30 - mat.m01 * mat.m13 * mat.m20 * mat.m32 -
                mat.m02 * mat.m10 * mat.m23 * mat.m31 - mat.m02 * mat.m11 * mat.m20 * mat.m33 - mat.m02 * mat.m13 * mat.m21 * mat.m30 -
                mat.m03 * mat.m10 * mat.m21 * mat.m32 - mat.m03 * mat.m11 * mat.m22 * mat.m30 - mat.m03 * mat.m12 * mat.m20 * mat.m31;
        };
        ImmutableRowMajarMatrix44.invert = function (mat) {
            var det = mat.determinant();
            var m00 = (mat.m11 * mat.m22 * mat.m33 + mat.m12 * mat.m23 * mat.m31 + mat.m13 * mat.m21 * mat.m32 - mat.m11 * mat.m23 * mat.m32 - mat.m12 * mat.m21 * mat.m33 - mat.m13 * mat.m22 * mat.m31) / det;
            var m01 = (mat.m01 * mat.m23 * mat.m32 + mat.m02 * mat.m21 * mat.m33 + mat.m03 * mat.m22 * mat.m31 - mat.m01 * mat.m22 * mat.m33 - mat.m02 * mat.m23 * mat.m31 - mat.m03 * mat.m21 * mat.m32) / det;
            var m02 = (mat.m01 * mat.m12 * mat.m33 + mat.m02 * mat.m13 * mat.m31 + mat.m03 * mat.m11 * mat.m32 - mat.m01 * mat.m13 * mat.m32 - mat.m02 * mat.m11 * mat.m33 - mat.m03 * mat.m12 * mat.m31) / det;
            var m03 = (mat.m01 * mat.m13 * mat.m22 + mat.m02 * mat.m11 * mat.m23 + mat.m03 * mat.m12 * mat.m21 - mat.m01 * mat.m12 * mat.m23 - mat.m02 * mat.m13 * mat.m21 - mat.m03 * mat.m11 * mat.m22) / det;
            var m10 = (mat.m10 * mat.m23 * mat.m32 + mat.m12 * mat.m20 * mat.m33 + mat.m13 * mat.m22 * mat.m30 - mat.m10 * mat.m22 * mat.m33 - mat.m12 * mat.m23 * mat.m30 - mat.m13 * mat.m20 * mat.m32) / det;
            var m11 = (mat.m00 * mat.m22 * mat.m33 + mat.m02 * mat.m23 * mat.m30 + mat.m03 * mat.m20 * mat.m32 - mat.m00 * mat.m23 * mat.m32 - mat.m02 * mat.m20 * mat.m33 - mat.m03 * mat.m22 * mat.m30) / det;
            var m12 = (mat.m00 * mat.m13 * mat.m32 + mat.m02 * mat.m10 * mat.m33 + mat.m03 * mat.m12 * mat.m30 - mat.m00 * mat.m12 * mat.m33 - mat.m02 * mat.m13 * mat.m30 - mat.m03 * mat.m10 * mat.m32) / det;
            var m13 = (mat.m00 * mat.m12 * mat.m23 + mat.m02 * mat.m13 * mat.m20 + mat.m03 * mat.m10 * mat.m22 - mat.m00 * mat.m13 * mat.m22 - mat.m02 * mat.m10 * mat.m23 - mat.m03 * mat.m12 * mat.m20) / det;
            var m20 = (mat.m10 * mat.m21 * mat.m33 + mat.m11 * mat.m23 * mat.m30 + mat.m13 * mat.m20 * mat.m31 - mat.m10 * mat.m23 * mat.m31 - mat.m11 * mat.m20 * mat.m33 - mat.m13 * mat.m21 * mat.m30) / det;
            var m21 = (mat.m00 * mat.m23 * mat.m31 + mat.m01 * mat.m20 * mat.m33 + mat.m03 * mat.m21 * mat.m30 - mat.m00 * mat.m21 * mat.m33 - mat.m01 * mat.m23 * mat.m30 - mat.m03 * mat.m20 * mat.m31) / det;
            var m22 = (mat.m00 * mat.m11 * mat.m33 + mat.m01 * mat.m13 * mat.m30 + mat.m03 * mat.m10 * mat.m31 - mat.m00 * mat.m13 * mat.m31 - mat.m01 * mat.m10 * mat.m33 - mat.m03 * mat.m11 * mat.m30) / det;
            var m23 = (mat.m00 * mat.m13 * mat.m21 + mat.m01 * mat.m10 * mat.m23 + mat.m03 * mat.m11 * mat.m20 - mat.m00 * mat.m11 * mat.m23 - mat.m01 * mat.m13 * mat.m20 - mat.m03 * mat.m10 * mat.m21) / det;
            var m30 = (mat.m10 * mat.m22 * mat.m31 + mat.m11 * mat.m20 * mat.m32 + mat.m12 * mat.m21 * mat.m30 - mat.m10 * mat.m21 * mat.m32 - mat.m11 * mat.m22 * mat.m30 - mat.m12 * mat.m20 * mat.m31) / det;
            var m31 = (mat.m00 * mat.m21 * mat.m32 + mat.m01 * mat.m22 * mat.m30 + mat.m02 * mat.m20 * mat.m31 - mat.m00 * mat.m22 * mat.m31 - mat.m01 * mat.m20 * mat.m32 - mat.m02 * mat.m21 * mat.m30) / det;
            var m32 = (mat.m00 * mat.m12 * mat.m31 + mat.m01 * mat.m10 * mat.m32 + mat.m02 * mat.m11 * mat.m30 - mat.m00 * mat.m11 * mat.m32 - mat.m01 * mat.m12 * mat.m30 - mat.m02 * mat.m10 * mat.m31) / det;
            var m33 = (mat.m00 * mat.m11 * mat.m22 + mat.m01 * mat.m12 * mat.m20 + mat.m02 * mat.m10 * mat.m21 - mat.m00 * mat.m12 * mat.m21 - mat.m01 * mat.m10 * mat.m22 - mat.m02 * mat.m11 * mat.m20) / det;
            return new ImmutableRowMajarMatrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m00", {
            get: function () {
                return this.v[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m01", {
            get: function () {
                return this.v[1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m02", {
            get: function () {
                return this.v[2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m03", {
            get: function () {
                return this.v[3];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m10", {
            get: function () {
                return this.v[4];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m11", {
            get: function () {
                return this.v[5];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m12", {
            get: function () {
                return this.v[6];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m13", {
            get: function () {
                return this.v[7];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m20", {
            get: function () {
                return this.v[8];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m21", {
            get: function () {
                return this.v[9];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m22", {
            get: function () {
                return this.v[10];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m23", {
            get: function () {
                return this.v[11];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m30", {
            get: function () {
                return this.v[12];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m31", {
            get: function () {
                return this.v[13];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m32", {
            get: function () {
                return this.v[14];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImmutableRowMajarMatrix44.prototype, "m33", {
            get: function () {
                return this.v[15];
            },
            enumerable: true,
            configurable: true
        });
        ImmutableRowMajarMatrix44.prototype.toString = function () {
            return this.m00 + ' ' + this.m01 + ' ' + this.m02 + ' ' + this.m03 + ' \n' +
                this.m10 + ' ' + this.m11 + ' ' + this.m12 + ' ' + this.m13 + ' \n' +
                this.m20 + ' ' + this.m21 + ' ' + this.m22 + ' ' + this.m23 + ' \n' +
                this.m30 + ' ' + this.m31 + ' ' + this.m32 + ' ' + this.m33 + ' \n';
        };
        ImmutableRowMajarMatrix44.prototype.nearZeroToZero = function (value) {
            if (Math.abs(value) < 0.00001) {
                value = 0;
            }
            else if (0.99999 < value && value < 1.00001) {
                value = 1;
            }
            else if (-1.00001 < value && value < -0.99999) {
                value = -1;
            }
            return value;
        };
        ImmutableRowMajarMatrix44.prototype.toStringApproximately = function () {
            return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + ' ' + this.nearZeroToZero(this.m03) + ' \n' +
                this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' ' + this.nearZeroToZero(this.m13) + ' \n' +
                this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + ' ' + this.nearZeroToZero(this.m23) + ' \n' +
                this.nearZeroToZero(this.m30) + ' ' + this.nearZeroToZero(this.m31) + ' ' + this.nearZeroToZero(this.m32) + ' ' + this.nearZeroToZero(this.m33) + ' \n';
        };
        ImmutableRowMajarMatrix44.prototype.getScale = function () {
            return new ImmutableVector3(Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02), Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12), Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22));
        };
        ImmutableRowMajarMatrix44.prototype.getRotate = function () {
            var quat = ImmutableQuaternion.fromMatrix(this);
            var rotateMat = new ImmutableRowMajarMatrix44(quat);
            return rotateMat;
        };
        return ImmutableRowMajarMatrix44;
    }());

    var ProcessStageClass = /** @class */ (function (_super) {
        __extends(ProcessStageClass, _super);
        function ProcessStageClass(_a) {
            var index = _a.index, str = _a.str, methodName = _a.methodName;
            var _this = _super.call(this, { index: index, str: str }) || this;
            _this.__methodName = methodName;
            return _this;
        }
        ProcessStageClass.prototype.getMethodName = function () {
            return this.__methodName;
        };
        return ProcessStageClass;
    }(EnumClass));
    var Unknown$3 = new ProcessStageClass({ index: -1, str: 'UNKNOWN', methodName: '$unknown' });
    var Create = new ProcessStageClass({ index: 0, str: 'CREATE', methodName: '$create' });
    var Load = new ProcessStageClass({ index: 1, str: 'LOAD', methodName: '$load' });
    var Mount = new ProcessStageClass({ index: 2, str: 'MOUNT', methodName: '$mount' });
    var Logic = new ProcessStageClass({ index: 3, str: 'LOGIC', methodName: '$logic' });
    var PreRender = new ProcessStageClass({ index: 4, str: 'PRE_RENDER', methodName: '$prerender' });
    var Render = new ProcessStageClass({ index: 5, str: 'RENDER', methodName: '$render' });
    var Unmount = new ProcessStageClass({ index: 6, str: 'UNMOUNT', methodName: '$unmount' });
    var Discard = new ProcessStageClass({ index: 7, str: 'DISCARD', methodName: '$discard' });
    var typeList$5 = [Unknown$3, Create, Load, Mount, Logic, PreRender, Render, Unmount, Discard];
    function from$5(index) {
        return _from({ typeList: typeList$5, index: index });
    }
    var ProcessStage = Object.freeze({ Unknown: Unknown$3, Create: Create, Load: Load, Mount: Mount, Logic: Logic, PreRender: PreRender, Render: Render, Unmount: Unmount, Discard: Discard, from: from$5 });

    var maxEntityNumber = 5000;
    var Config = Object.freeze({ maxEntityNumber: maxEntityNumber });

    var MutableRowMajarMatrix44 = /** @class */ (function (_super) {
        __extends(MutableRowMajarMatrix44, _super);
        function MutableRowMajarMatrix44(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, notCopyFloatArray) {
            if (notCopyFloatArray === void 0) { notCopyFloatArray = false; }
            var _this = this;
            var _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m1;
            if (arguments.length >= 16) {
                _this = _super.call(this, m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, _notCopyFloatArray) || this;
            }
            else {
                _this = _super.call(this, m0, _notCopyFloatArray) || this;
            }
            return _this;
        }
        MutableRowMajarMatrix44.dummy = function () {
            return new MutableRowMajarMatrix44(null);
        };
        MutableRowMajarMatrix44.prototype.setComponents = function (m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
            this.v[0] = m00;
            this.v[4] = m10;
            this.v[8] = m20;
            this.v[12] = m30;
            this.v[1] = m01;
            this.v[5] = m11;
            this.v[9] = m21;
            this.v[13] = m31;
            this.v[2] = m02;
            this.v[6] = m12;
            this.v[10] = m22;
            this.v[14] = m32;
            this.v[3] = m03;
            this.v[7] = m13;
            this.v[11] = m23;
            this.v[15] = m33;
            return this;
        };
        MutableRowMajarMatrix44.prototype.copyComponents = function (mat4) {
            //this.setComponents.apply(this, mat4.m); // 'm' must be row major array if isColumnMajor is false
            var m = mat4;
            this.m00 = m.m00;
            this.m01 = m.m01;
            this.m02 = m.m02;
            this.m03 = m.m03;
            this.m10 = m.m10;
            this.m11 = m.m11;
            this.m12 = m.m12;
            this.m13 = m.m13;
            this.m20 = m.m20;
            this.m21 = m.m21;
            this.m22 = m.m22;
            this.m23 = m.m23;
            this.m30 = m.m30;
            this.m31 = m.m31;
            this.m32 = m.m32;
            this.m33 = m.m33;
        };
        /**
         * to the identity matrix
         */
        MutableRowMajarMatrix44.prototype.identity = function () {
            this.setComponents(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            return this;
        };
        MutableRowMajarMatrix44.prototype.translate = function (vec) {
            return this.setComponents(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
        };
        MutableRowMajarMatrix44.prototype.putTranslate = function (vec) {
            this.m03 = vec.x;
            this.m13 = vec.y;
            this.m23 = vec.z;
        };
        MutableRowMajarMatrix44.prototype.scale = function (vec) {
            return this.setComponents(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
        };
        MutableRowMajarMatrix44.prototype.addScale = function (vec) {
            this.m00 *= vec.x;
            this.m11 *= vec.y;
            this.m22 *= vec.z;
            return this;
        };
        /**
         * Create X oriented Rotation Matrix
         */
        MutableRowMajarMatrix44.prototype.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
        };
        /**
       * Create Y oriented Rotation Matrix
       */
        MutableRowMajarMatrix44.prototype.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        MutableRowMajarMatrix44.prototype.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        MutableRowMajarMatrix44.prototype.rotateXYZ = function (x, y, z) {
            var cosX = Math.cos(x);
            var sinX = Math.sin(x);
            var cosY = Math.cos(y);
            var sinY = Math.sin(y);
            var cosZ = Math.cos(z);
            var sinZ = Math.sin(z);
            var xm00 = 1;
            //const xm01 = 0;
            //const xm02 = 0;
            //const xm10 = 0;
            var xm11 = cosX;
            var xm12 = -sinX;
            //const xm20 = 0;
            var xm21 = sinX;
            var xm22 = cosX;
            var ym00 = cosY;
            //const ym01 = 0;
            var ym02 = sinY;
            //const ym10 = 0;
            var ym11 = 1;
            //const ym12 = 0;
            var ym20 = -sinY;
            //const ym21 = 0;
            var ym22 = cosY;
            var zm00 = cosZ;
            var zm01 = -sinZ;
            //const zm02 = 0;
            var zm10 = sinZ;
            var zm11 = cosZ;
            //const zm12 = 0;
            //const zm20 = 0;
            //const zm21 = 0;
            var zm22 = 1;
            var yxm00 = ym00 * xm00;
            var yxm01 = ym02 * xm21;
            var yxm02 = ym02 * xm22;
            //const yxm10 = 0;
            var yxm11 = ym11 * xm11;
            var yxm12 = ym11 * xm12;
            var yxm20 = ym20 * xm00;
            var yxm21 = ym22 * xm21;
            var yxm22 = ym22 * xm22;
            this.v[0] = zm00 * yxm00;
            this.v[1] = zm00 * yxm01 + zm01 * yxm11;
            this.v[2] = zm00 * yxm02 + zm01 * yxm12;
            this.v[3] = 0;
            this.v[4] = zm10 * yxm00;
            this.v[5] = zm10 * yxm01 + zm11 * yxm11;
            this.v[6] = zm10 * yxm02 + zm11 * yxm12;
            this.v[7] = 0;
            this.v[8] = zm22 * yxm20;
            this.v[9] = zm22 * yxm21;
            this.v[10] = zm22 * yxm22;
            this.v[11] = 0;
            this.v[12] = 0;
            this.v[13] = 0;
            this.v[14] = 0;
            this.v[15] = 1;
            return this;
            //return new RowMajarMatrix44(Matrix33.rotateXYZ(x, y, z));
        };
        /**
         * Zero Matrix
         */
        MutableRowMajarMatrix44.prototype.zero = function () {
            this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            return this;
        };
        MutableRowMajarMatrix44.prototype._swap = function (l, r) {
            this.v[r] = [this.v[l], this.v[l] = this.v[r]][0]; // Swap
        };
        /**
         * transpose
         */
        MutableRowMajarMatrix44.prototype.transpose = function () {
            this._swap(1, 4);
            this._swap(2, 8);
            this._swap(3, 12);
            this._swap(6, 9);
            this._swap(7, 13);
            this._swap(11, 14);
            return this;
        };
        /**
         * multiply zero matrix and zero matrix
         */
        MutableRowMajarMatrix44.prototype.multiply = function (mat) {
            var m00 = this.m00 * mat.m00 + this.m01 * mat.m10 + this.m02 * mat.m20 + this.m03 * mat.m30;
            var m01 = this.m00 * mat.m01 + this.m01 * mat.m11 + this.m02 * mat.m21 + this.m03 * mat.m31;
            var m02 = this.m00 * mat.m02 + this.m01 * mat.m12 + this.m02 * mat.m22 + this.m03 * mat.m32;
            var m03 = this.m00 * mat.m03 + this.m01 * mat.m13 + this.m02 * mat.m23 + this.m03 * mat.m33;
            var m10 = this.m10 * mat.m00 + this.m11 * mat.m10 + this.m12 * mat.m20 + this.m13 * mat.m30;
            var m11 = this.m10 * mat.m01 + this.m11 * mat.m11 + this.m12 * mat.m21 + this.m13 * mat.m31;
            var m12 = this.m10 * mat.m02 + this.m11 * mat.m12 + this.m12 * mat.m22 + this.m13 * mat.m32;
            var m13 = this.m10 * mat.m03 + this.m11 * mat.m13 + this.m12 * mat.m23 + this.m13 * mat.m33;
            var m20 = this.m20 * mat.m00 + this.m21 * mat.m10 + this.m22 * mat.m20 + this.m23 * mat.m30;
            var m21 = this.m20 * mat.m01 + this.m21 * mat.m11 + this.m22 * mat.m21 + this.m23 * mat.m31;
            var m22 = this.m20 * mat.m02 + this.m21 * mat.m12 + this.m22 * mat.m22 + this.m23 * mat.m32;
            var m23 = this.m20 * mat.m03 + this.m21 * mat.m13 + this.m22 * mat.m23 + this.m23 * mat.m33;
            var m30 = this.m30 * mat.m00 + this.m31 * mat.m10 + this.m32 * mat.m20 + this.m33 * mat.m30;
            var m31 = this.m30 * mat.m01 + this.m31 * mat.m11 + this.m32 * mat.m21 + this.m33 * mat.m31;
            var m32 = this.m30 * mat.m02 + this.m31 * mat.m12 + this.m32 * mat.m22 + this.m33 * mat.m32;
            var m33 = this.m30 * mat.m03 + this.m31 * mat.m13 + this.m32 * mat.m23 + this.m33 * mat.m33;
            return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        MutableRowMajarMatrix44.prototype.multiplyByLeft = function (mat) {
            var m00 = mat.m00 * this.m00 + mat.m01 * this.m10 + mat.m02 * this.m20 + mat.m03 * this.m30;
            var m01 = mat.m00 * this.m01 + mat.m01 * this.m11 + mat.m02 * this.m21 + mat.m03 * this.m31;
            var m02 = mat.m00 * this.m02 + mat.m01 * this.m12 + mat.m02 * this.m22 + mat.m03 * this.m32;
            var m03 = mat.m00 * this.m03 + mat.m01 * this.m13 + mat.m02 * this.m23 + mat.m03 * this.m33;
            var m10 = mat.m10 * this.m00 + mat.m11 * this.m10 + mat.m12 * this.m20 + mat.m13 * this.m30;
            var m11 = mat.m10 * this.m01 + mat.m11 * this.m11 + mat.m12 * this.m21 + mat.m13 * this.m31;
            var m12 = mat.m10 * this.m02 + mat.m11 * this.m12 + mat.m12 * this.m22 + mat.m13 * this.m32;
            var m13 = mat.m10 * this.m03 + mat.m11 * this.m13 + mat.m12 * this.m23 + mat.m13 * this.m33;
            var m20 = mat.m20 * this.m00 + mat.m21 * this.m10 + mat.m22 * this.m20 + mat.m23 * this.m30;
            var m21 = mat.m20 * this.m01 + mat.m21 * this.m11 + mat.m22 * this.m21 + mat.m23 * this.m31;
            var m22 = mat.m20 * this.m02 + mat.m21 * this.m12 + mat.m22 * this.m22 + mat.m23 * this.m32;
            var m23 = mat.m20 * this.m03 + mat.m21 * this.m13 + mat.m22 * this.m23 + mat.m23 * this.m33;
            var m30 = mat.m30 * this.m00 + mat.m31 * this.m10 + mat.m32 * this.m20 + mat.m33 * this.m30;
            var m31 = mat.m30 * this.m01 + mat.m31 * this.m11 + mat.m32 * this.m21 + mat.m33 * this.m31;
            var m32 = mat.m30 * this.m02 + mat.m31 * this.m12 + mat.m32 * this.m22 + mat.m33 * this.m32;
            var m33 = mat.m30 * this.m03 + mat.m31 * this.m13 + mat.m32 * this.m23 + mat.m33 * this.m33;
            return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        MutableRowMajarMatrix44.prototype.invert = function () {
            var det = this.determinant();
            var m00 = (this.m11 * this.m22 * this.m33 + this.m12 * this.m23 * this.m31 + this.m13 * this.m21 * this.m32 - this.m11 * this.m23 * this.m32 - this.m12 * this.m21 * this.m33 - this.m13 * this.m22 * this.m31) / det;
            var m01 = (this.m01 * this.m23 * this.m32 + this.m02 * this.m21 * this.m33 + this.m03 * this.m22 * this.m31 - this.m01 * this.m22 * this.m33 - this.m02 * this.m23 * this.m31 - this.m03 * this.m21 * this.m32) / det;
            var m02 = (this.m01 * this.m12 * this.m33 + this.m02 * this.m13 * this.m31 + this.m03 * this.m11 * this.m32 - this.m01 * this.m13 * this.m32 - this.m02 * this.m11 * this.m33 - this.m03 * this.m12 * this.m31) / det;
            var m03 = (this.m01 * this.m13 * this.m22 + this.m02 * this.m11 * this.m23 + this.m03 * this.m12 * this.m21 - this.m01 * this.m12 * this.m23 - this.m02 * this.m13 * this.m21 - this.m03 * this.m11 * this.m22) / det;
            var m10 = (this.m10 * this.m23 * this.m32 + this.m12 * this.m20 * this.m33 + this.m13 * this.m22 * this.m30 - this.m10 * this.m22 * this.m33 - this.m12 * this.m23 * this.m30 - this.m13 * this.m20 * this.m32) / det;
            var m11 = (this.m00 * this.m22 * this.m33 + this.m02 * this.m23 * this.m30 + this.m03 * this.m20 * this.m32 - this.m00 * this.m23 * this.m32 - this.m02 * this.m20 * this.m33 - this.m03 * this.m22 * this.m30) / det;
            var m12 = (this.m00 * this.m13 * this.m32 + this.m02 * this.m10 * this.m33 + this.m03 * this.m12 * this.m30 - this.m00 * this.m12 * this.m33 - this.m02 * this.m13 * this.m30 - this.m03 * this.m10 * this.m32) / det;
            var m13 = (this.m00 * this.m12 * this.m23 + this.m02 * this.m13 * this.m20 + this.m03 * this.m10 * this.m22 - this.m00 * this.m13 * this.m22 - this.m02 * this.m10 * this.m23 - this.m03 * this.m12 * this.m20) / det;
            var m20 = (this.m10 * this.m21 * this.m33 + this.m11 * this.m23 * this.m30 + this.m13 * this.m20 * this.m31 - this.m10 * this.m23 * this.m31 - this.m11 * this.m20 * this.m33 - this.m13 * this.m21 * this.m30) / det;
            var m21 = (this.m00 * this.m23 * this.m31 + this.m01 * this.m20 * this.m33 + this.m03 * this.m21 * this.m30 - this.m00 * this.m21 * this.m33 - this.m01 * this.m23 * this.m30 - this.m03 * this.m20 * this.m31) / det;
            var m22 = (this.m00 * this.m11 * this.m33 + this.m01 * this.m13 * this.m30 + this.m03 * this.m10 * this.m31 - this.m00 * this.m13 * this.m31 - this.m01 * this.m10 * this.m33 - this.m03 * this.m11 * this.m30) / det;
            var m23 = (this.m00 * this.m13 * this.m21 + this.m01 * this.m10 * this.m23 + this.m03 * this.m11 * this.m20 - this.m00 * this.m11 * this.m23 - this.m01 * this.m13 * this.m20 - this.m03 * this.m10 * this.m21) / det;
            var m30 = (this.m10 * this.m22 * this.m31 + this.m11 * this.m20 * this.m32 + this.m12 * this.m21 * this.m30 - this.m10 * this.m21 * this.m32 - this.m11 * this.m22 * this.m30 - this.m12 * this.m20 * this.m31) / det;
            var m31 = (this.m00 * this.m21 * this.m32 + this.m01 * this.m22 * this.m30 + this.m02 * this.m20 * this.m31 - this.m00 * this.m22 * this.m31 - this.m01 * this.m20 * this.m32 - this.m02 * this.m21 * this.m30) / det;
            var m32 = (this.m00 * this.m12 * this.m31 + this.m01 * this.m10 * this.m32 + this.m02 * this.m11 * this.m30 - this.m00 * this.m11 * this.m32 - this.m01 * this.m12 * this.m30 - this.m02 * this.m10 * this.m31) / det;
            var m33 = (this.m00 * this.m11 * this.m22 + this.m01 * this.m12 * this.m20 + this.m02 * this.m10 * this.m21 - this.m00 * this.m12 * this.m21 - this.m01 * this.m10 * this.m22 - this.m02 * this.m11 * this.m20) / det;
            return this.setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m00", {
            get: function () {
                return this.v[0];
            },
            set: function (val) {
                this.v[0] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m01", {
            get: function () {
                return this.v[1];
            },
            set: function (val) {
                this.v[1] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m02", {
            get: function () {
                return this.v[2];
            },
            set: function (val) {
                this.v[2] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m03", {
            get: function () {
                return this.v[3];
            },
            set: function (val) {
                this.v[3] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m10", {
            get: function () {
                return this.v[4];
            },
            set: function (val) {
                this.v[4] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m11", {
            get: function () {
                return this.v[5];
            },
            set: function (val) {
                this.v[5] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m12", {
            get: function () {
                return this.v[6];
            },
            set: function (val) {
                this.v[6] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m13", {
            get: function () {
                return this.v[7];
            },
            set: function (val) {
                this.v[7] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m20", {
            get: function () {
                return this.v[8];
            },
            set: function (val) {
                this.v[8] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m21", {
            get: function () {
                return this.v[9];
            },
            set: function (val) {
                this.v[9] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m22", {
            get: function () {
                return this.v[10];
            },
            set: function (val) {
                this.v[10] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m23", {
            get: function () {
                return this.v[11];
            },
            set: function (val) {
                this.v[11] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m30", {
            get: function () {
                return this.v[12];
            },
            set: function (val) {
                this.v[12] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m31", {
            get: function () {
                return this.v[13];
            },
            set: function (val) {
                this.v[13] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m32", {
            get: function () {
                return this.v[14];
            },
            set: function (val) {
                this.v[14] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableRowMajarMatrix44.prototype, "m33", {
            get: function () {
                return this.v[15];
            },
            set: function (val) {
                this.v[15] = val;
            },
            enumerable: true,
            configurable: true
        });
        return MutableRowMajarMatrix44;
    }(ImmutableRowMajarMatrix44));

    var Component = /** @class */ (function () {
        function Component(entityUid, componentSid, entityRepository) {
            var _this = this;
            this.__currentProcessStage = ProcessStage.Create;
            this.__entityUid = entityUid;
            this._component_sid = componentSid;
            this.__isAlive = true;
            this.__currentProcessStage = ProcessStage.Logic;
            var stages = [
                ProcessStage.Create,
                ProcessStage.Load,
                ProcessStage.Mount,
                ProcessStage.Logic,
                ProcessStage.PreRender,
                ProcessStage.Render,
                ProcessStage.Unmount,
                ProcessStage.Discard
            ];
            stages.forEach(function (stage) {
                if (_this.isExistProcessStageMethod(stage)) {
                    if (Component.__componentsOfProcessStages.get(stage) == null) {
                        Component.__componentsOfProcessStages.set(stage, new Int32Array(Config.maxEntityNumber));
                        Component.__dirtyOfArrayOfProcessStages.set(stage, false);
                        Component.__lengthOfArrayOfProcessStages.set(stage, 0);
                    }
                }
            });
            this.__memoryManager = MemoryManager.getInstance();
            this.__entityRepository = entityRepository;
        }
        Component.prototype.moveStageTo = function (processStage) {
            Component.__dirtyOfArrayOfProcessStages.set(this.__currentProcessStage, true);
            Component.__dirtyOfArrayOfProcessStages.set(processStage, true);
            this.__currentProcessStage = processStage;
        };
        Object.defineProperty(Component, "componentTID", {
            get: function () {
                return 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "componentSID", {
            get: function () {
                return this._component_sid;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "entityUID", {
            get: function () {
                return this.__entityUid;
            },
            enumerable: true,
            configurable: true
        });
        Component.isExistProcessStageMethod = function (componentTid, processStage, componentRepository) {
            var component = componentRepository.getComponent(componentTid, 0);
            if (component == null) {
                return false;
            }
            if (component[processStage.getMethodName()] == null) {
                return false;
            }
            return true;
        };
        Component.prototype.isExistProcessStageMethod = function (processStage) {
            if (this[processStage.getMethodName()] == null) {
                return false;
            }
            return true;
        };
        Component.process = function (_a) {
            var componentTid = _a.componentTid, processStage = _a.processStage, instanceIDBufferUid = _a.instanceIDBufferUid, processApproach = _a.processApproach, componentRepository = _a.componentRepository;
            if (!Component.isExistProcessStageMethod(componentTid, processStage, componentRepository)) {
                return;
            }
            var array = this.__componentsOfProcessStages.get(processStage);
            for (var i = 0; i < array.length; ++i) {
                if (array[i] === Component.invalidComponentSID) {
                    break;
                }
                var componentSid = array[i];
                var component = componentRepository.getComponent(componentTid, componentSid);
                component[processStage.getMethodName()]({
                    processStage: processStage,
                    instanceIDBufferUid: instanceIDBufferUid,
                    processApproach: processApproach
                });
            }
        };
        Component.updateComponentsOfEachProcessStage = function (componentTid, processStage, componentRepository) {
            if (!Component.isExistProcessStageMethod(componentTid, processStage, componentRepository)) {
                return;
            }
            var component = componentRepository.getComponent(this.componentTID, 0);
            var dirty = Component.__componentsOfProcessStages.get(processStage);
            if (dirty) {
                var components = componentRepository.getComponentsWithType(componentTid);
                var array = Component.__componentsOfProcessStages.get(processStage);
                var count = 0;
                for (var i = 0; i < components.length; ++i) {
                    var component_1 = components[i];
                    if (processStage === component_1.__currentProcessStage) {
                        array[count++] = component_1.componentSID;
                    }
                }
                array[count] = Component.invalidComponentSID;
            }
        };
        Component.getByteLengthSumOfMembers = function (bufferUse, componentClass) {
            var byteLengthSumOfMembers = this.__byteLengthSumOfMembers.get(componentClass);
            return byteLengthSumOfMembers.get(bufferUse);
        };
        Component.setupBufferView = function () {
        };
        Component.prototype.registerDependency = function (component, isMust) {
        };
        Component.takeBufferViewer = function (bufferUse, componentClass, byteLengthSumOfMembers) {
            var buffer = MemoryManager.getInstance().getBuffer(bufferUse);
            var count = Config.maxEntityNumber;
            if (!this.__bufferViews.has(componentClass)) {
                this.__bufferViews.set(componentClass, new Map());
            }
            var bufferViews = this.__bufferViews.get(componentClass);
            if (!bufferViews.has(bufferUse)) {
                bufferViews.set(bufferUse, buffer.takeBufferView({ byteLengthToNeed: byteLengthSumOfMembers * count, byteStride: 0, isAoS: false }));
            }
        };
        Component.prototype.takeOne = function (memberName, dataClassType, initValues) {
            if (!this['_' + memberName].isDummy()) {
                return;
            }
            var taken = Component.__accessors.get(this.constructor).get(memberName).takeOne();
            if (dataClassType === ImmutableMatrix44 || dataClassType === MutableMatrix44) {
                this['_' + memberName] = new dataClassType(taken, false, true);
            }
            else if (dataClassType === ImmutableRowMajarMatrix44 || dataClassType === MutableRowMajarMatrix44) {
                this['_' + memberName] = new dataClassType(taken, true);
            }
            else {
                this['_' + memberName] = new dataClassType(taken);
            }
            for (var i = 0; i < this['_' + memberName].v.length; ++i) {
                this['_' + memberName].v[i] = initValues[i];
            }
            return null;
        };
        Component.getAccessor = function (memberName, componentClass) {
            return this.__accessors.get(componentClass).get(memberName);
        };
        Component.takeAccessor = function (bufferUse, memberName, componentClass, compositionType, componentType) {
            var count = Config.maxEntityNumber;
            if (!this.__accessors.has(componentClass)) {
                this.__accessors.set(componentClass, new Map());
            }
            var accessors = this.__accessors.get(componentClass);
            if (!accessors.has(memberName)) {
                var bufferViews = this.__bufferViews.get(componentClass);
                accessors.set(memberName, bufferViews.get(bufferUse).takeAccessor({ compositionType: compositionType, componentType: componentType, count: count }));
            }
        };
        Component.getByteOffsetOfThisComponentTypeInBuffer = function (bufferUse, componentClass) {
            return this.__bufferViews.get(componentClass).get(bufferUse).byteOffset;
        };
        Component.getByteOffsetOfFirstOfThisMemberInBuffer = function (memberName, componentClass) {
            return this.__accessors.get(componentClass).get(memberName).byteOffsetInBuffer;
        };
        Component.getByteOffsetOfFirstOfThisMemberInBufferView = function (memberName, componentClass) {
            return this.__accessors.get(componentClass).get(memberName).byteOffsetInBufferView;
        };
        Component.getCompositionTypeOfMember = function (memberName, componentClass) {
            var memberInfoArray = this.__memberInfo.get(componentClass);
            var info = memberInfoArray.find(function (info) {
                return info.memberName === memberName;
            });
            if (info != null) {
                return info.compositionType;
            }
            else {
                return null;
            }
        };
        Component.getComponentTypeOfMember = function (memberName, componentClass) {
            var memberInfoArray = this.__memberInfo.get(componentClass);
            var info = memberInfoArray.find(function (info) {
                return info.memberName === memberName;
            });
            if (info != null) {
                return info.componentType;
            }
            else {
                return null;
            }
        };
        Component.prototype.registerMember = function (bufferUse, memberName, dataClassType, compositionType, componentType, initValues) {
            if (!Component.__memberInfo.has(this.constructor)) {
                Component.__memberInfo.set(this.constructor, []);
            }
            var memberInfoArray = Component.__memberInfo.get(this.constructor);
            memberInfoArray.push({ bufferUse: bufferUse, memberName: memberName, dataClassType: dataClassType, compositionType: compositionType, componentType: componentType, initValues: initValues });
        };
        Component.prototype.submitToAllocation = function () {
            var _this = this;
            var e_1, _a, e_2, _b, e_3, _c;
            var componentClass = this.constructor;
            var memberInfoArray = Component.__memberInfo.get(componentClass);
            if (this._component_sid <= 1) {
                if (!Component.__members.has(componentClass)) {
                    Component.__members.set(componentClass, new Map());
                }
                var member_1 = Component.__members.get(componentClass);
                memberInfoArray.forEach(function (info) {
                    member_1.set(info.bufferUse, []);
                });
                memberInfoArray.forEach(function (info) {
                    member_1.get(info.bufferUse).push(info);
                });
                var _loop_1 = function (bufferUse) {
                    var infoArray = member_1.get(bufferUse);
                    var bufferUseName = bufferUse.toString();
                    if (!Component.__byteLengthSumOfMembers.has(componentClass)) {
                        Component.__byteLengthSumOfMembers.set(componentClass, new Map());
                    }
                    var byteLengthSumOfMembers = Component.__byteLengthSumOfMembers.get(componentClass);
                    if (!byteLengthSumOfMembers.has(bufferUse)) {
                        byteLengthSumOfMembers.set(bufferUse, 0);
                    }
                    infoArray.forEach(function (info) {
                        byteLengthSumOfMembers.set(bufferUse, byteLengthSumOfMembers.get(bufferUse) +
                            info.compositionType.getNumberOfComponents() * info.componentType.getSizeInBytes());
                    });
                    if (infoArray.length > 0) {
                        Component.takeBufferViewer(bufferUse, componentClass, byteLengthSumOfMembers.get(bufferUse));
                    }
                };
                try {
                    for (var _d = __values(member_1.keys()), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var bufferUse = _e.value;
                        _loop_1(bufferUse);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                try {
                    for (var _f = __values(member_1.keys()), _g = _f.next(); !_g.done; _g = _f.next()) {
                        var bufferUse = _g.value;
                        var infoArray = member_1.get(bufferUse);
                        infoArray.forEach(function (info) {
                            Component.takeAccessor(info.bufferUse, info.memberName, componentClass, info.compositionType, info.componentType);
                        });
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            var member = Component.__members.get(componentClass);
            try {
                // takeOne
                for (var _h = __values(member.keys()), _j = _h.next(); !_j.done; _j = _h.next()) {
                    var bufferUse = _j.value;
                    var infoArray = member.get(bufferUse);
                    infoArray.forEach(function (info) {
                        _this.takeOne(info.memberName, info.dataClassType, info.initValues);
                    });
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                }
                finally { if (e_3) throw e_3.error; }
            }
        };
        Component.invalidComponentSID = -1;
        Component.__componentsOfProcessStages = new Map();
        Component.__lengthOfArrayOfProcessStages = new Map();
        Component.__dirtyOfArrayOfProcessStages = new Map();
        Component.__bufferViews = new Map();
        Component.__accessors = new Map();
        Component.__byteLengthSumOfMembers = new Map();
        Component.__memberInfo = new Map();
        Component.__members = new Map();
        return Component;
    }());

    var InitialSetting = /** @class */ (function () {
        function InitialSetting() {
        }
        InitialSetting.maxEntityNumber = 10000;
        return InitialSetting;
    }());

    var ComponentRepository = /** @class */ (function () {
        function ComponentRepository() {
            this.__component_sid_count_map = new Map();
            this.__components = new Map();
        }
        ComponentRepository.registerComponentClass = function (componentTID, componentClass) {
            var thisClass = ComponentRepository;
            thisClass.__componentClasses.set(componentTID, componentClass);
        };
        ComponentRepository.unregisterComponentClass = function (componentTID) {
            var thisClass = ComponentRepository;
            thisClass.__componentClasses.delete(componentTID);
        };
        ComponentRepository.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new ComponentRepository();
            }
            return this.__instance;
        };
        ComponentRepository.getComponentClass = function (componentTid) {
            return this.__componentClasses.get(componentTid);
        };
        ComponentRepository.prototype.createComponent = function (componentTid, entityUid, entityRepository) {
            var thisClass = ComponentRepository;
            var componentClass = thisClass.__componentClasses.get(componentTid);
            if (componentClass != null) {
                var component_sid_count = this.__component_sid_count_map.get(componentTid);
                if (!IsUtil.exist(component_sid_count)) {
                    this.__component_sid_count_map.set(componentTid, 0);
                    component_sid_count = Component.invalidComponentSID;
                }
                this.__component_sid_count_map.set(componentTid, ++component_sid_count);
                var component = new componentClass(entityUid, component_sid_count, entityRepository);
                if (!this.__components.has(componentTid)) {
                    this.__components.set(componentTid, []);
                }
                var array = this.__components.get(componentTid);
                if (array != null) {
                    array[component.componentSID] = component;
                    return component;
                }
            }
            return null;
        };
        ComponentRepository.prototype.getComponent = function (componentTid, componentSid) {
            var map = this.__components.get(componentTid);
            if (map != null) {
                var component = map[componentSid];
                if (component != null) {
                    return map[componentSid];
                }
                else {
                    return null;
                }
            }
            return null;
        };
        ComponentRepository.getMemoryBeginIndex = function (componentTid) {
            var memoryBeginIndex = 0;
            for (var i = 0; i < componentTid; i++) {
                var componentClass = ComponentRepository.__componentClasses.get(i);
                if (componentClass != null) {
                    var sizeOfComponent = componentClass.sizeOfThisComponent;
                    var maxEntityNumber = InitialSetting.maxEntityNumber;
                    memoryBeginIndex += sizeOfComponent * maxEntityNumber;
                }
            }
            return memoryBeginIndex;
        };
        ComponentRepository.prototype.getComponentsWithType = function (componentTid) {
            var components = this.__components.get(componentTid);
            var copyArray = components; //.concat();
            //copyArray.shift();
            return copyArray;
        };
        ComponentRepository.prototype.getComponentTIDs = function () {
            var e_1, _a;
            var indices = [];
            try {
                for (var _b = __values(this.__components.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var type = _c.value;
                    indices.push(type);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return indices;
        };
        ComponentRepository.__componentClasses = new Map();
        return ComponentRepository;
    }());

    var EntityRepository = /** @class */ (function () {
        function EntityRepository() {
            this.__entity_uid_count = Entity.invalidEntityUID;
            this.__entities = [];
            this._components = [];
            this.__componentRepository = ComponentRepository.getInstance();
        }
        EntityRepository.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new EntityRepository();
            }
            return this.__instance;
        };
        EntityRepository.prototype.createEntity = function (componentTidArray) {
            var e_1, _a;
            var entity = new Entity(++this.__entity_uid_count, true, this);
            this.__entities[this.__entity_uid_count] = entity;
            try {
                for (var componentTidArray_1 = __values(componentTidArray), componentTidArray_1_1 = componentTidArray_1.next(); !componentTidArray_1_1.done; componentTidArray_1_1 = componentTidArray_1.next()) {
                    var componentTid = componentTidArray_1_1.value;
                    var component = this.__componentRepository.createComponent(componentTid, entity.entityUID, this);
                    var map = this._components[entity.entityUID];
                    if (map == null) {
                        map = new Map();
                        this._components[entity.entityUID] = map;
                    }
                    if (component != null) {
                        map.set(componentTid, component);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (componentTidArray_1_1 && !componentTidArray_1_1.done && (_a = componentTidArray_1.return)) _a.call(componentTidArray_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return entity;
        };
        EntityRepository.prototype.getEntity = function (entityUid) {
            return this.__entities[entityUid];
        };
        EntityRepository.prototype.getComponentOfEntity = function (entityUid, componentTid) {
            var entity = this._components[entityUid];
            var component = null;
            if (entity != null) {
                component = entity.get(componentTid);
                if (component != null) {
                    return component;
                }
                else {
                    return null;
                }
            }
            return component;
        };
        EntityRepository.prototype._getEntities = function () {
            return this.__entities.concat();
        };
        return EntityRepository;
    }());

    var SceneGraphComponent = /** @class */ (function (_super) {
        __extends(SceneGraphComponent, _super);
        function SceneGraphComponent(entityUid, componentSid, entityComponent) {
            var _this = _super.call(this, entityUid, componentSid, entityComponent) || this;
            _this._worldMatrix = MutableRowMajarMatrix44.dummy();
            _this.__isWorldMatrixUpToDate = false;
            _this.__tmpMatrix = MutableMatrix44.identity();
            _this.__currentProcessStage = ProcessStage.Logic;
            var count = Component.__lengthOfArrayOfProcessStages.get(ProcessStage.Logic);
            var array = Component.__componentsOfProcessStages.get(ProcessStage.Logic);
            array[count++] = _this.componentSID;
            array[count] = Component.invalidComponentSID;
            Component.__lengthOfArrayOfProcessStages.set(ProcessStage.Logic, count);
            _this.__isAbleToBeParent = false;
            _this.beAbleToBeParent(true);
            _this.registerMember(BufferUse.GPUInstanceData, 'worldMatrix', MutableRowMajarMatrix44, CompositionType.Mat4, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            _this.submitToAllocation();
            return _this;
            //this.__updatedProperly = false;
        }
        Object.defineProperty(SceneGraphComponent, "componentTID", {
            get: function () {
                return WellKnownComponentTIDs.SceneGraphComponentTID;
            },
            enumerable: true,
            configurable: true
        });
        SceneGraphComponent.prototype.beAbleToBeParent = function (flag) {
            this.__isAbleToBeParent = flag;
            if (this.__isAbleToBeParent) {
                this.__children = [];
            }
            else {
                this.__children = void 0;
            }
        };
        SceneGraphComponent.prototype.setWorldMatrixDirty = function () {
            this.__isWorldMatrixUpToDate = false;
        };
        SceneGraphComponent.prototype.addChild = function (sg) {
            if (this.__children != null) {
                sg.__parent = this;
                this.__children.push(sg);
            }
            else {
                console.error('This is not allowed to have children.');
            }
        };
        Object.defineProperty(SceneGraphComponent.prototype, "worldMatrixInner", {
            get: function () {
                if (!this.__isWorldMatrixUpToDate) {
                    //this._worldMatrix.identity();
                    this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively());
                    this.__isWorldMatrixUpToDate = true;
                }
                return this._worldMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneGraphComponent.prototype, "worldMatrix", {
            get: function () {
                return this.worldMatrixInner.clone();
            },
            enumerable: true,
            configurable: true
        });
        SceneGraphComponent.prototype.$logic = function () {
            if (!this.__isWorldMatrixUpToDate) {
                //this._worldMatrix.identity();
                this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively());
                this.__isWorldMatrixUpToDate = true;
            }
        };
        SceneGraphComponent.prototype.calcWorldMatrixRecursively = function () {
            var entity = this.__entityRepository.getEntity(this.__entityUid);
            var transform = entity.getTransform();
            if (this.__isWorldMatrixUpToDate) {
                return this._worldMatrix;
            }
            else {
                var matrix = transform.matrixInner;
                if (this.__parent == null) {
                    return matrix;
                }
                this.__tmpMatrix.copyComponents(matrix);
                var matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
                this.__tmpMatrix.multiplyByLeft(matrixFromAncestorToParent);
            }
            return this.__tmpMatrix;
        };
        return SceneGraphComponent;
    }(Component));
    ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);

    var MutableQuaternion = /** @class */ (function (_super) {
        __extends(MutableQuaternion, _super);
        function MutableQuaternion(x, y, z, w) {
            return _super.call(this, x, y, z, w) || this;
        }
        MutableQuaternion.dummy = function () {
            return new MutableQuaternion(null);
        };
        MutableQuaternion.prototype.clone = function () {
            return new MutableQuaternion(this.x, this.y, this.z, this.w);
        };
        MutableQuaternion.prototype.axisAngle = function (axisVec3, radian) {
            var halfAngle = 0.5 * radian;
            var sin = Math.sin(halfAngle);
            var axis = ImmutableVector3.normalize(axisVec3);
            this.w = Math.cos(halfAngle);
            this.x = sin * axis.x;
            this.y = sin * axis.y;
            this.z = sin * axis.z;
            return this;
        };
        MutableQuaternion.prototype.add = function (q) {
            this.x += q.x;
            this.y += q.y;
            this.z += q.z;
            this.w += q.w;
            return this;
        };
        MutableQuaternion.prototype.multiply = function (q) {
            var result = new ImmutableQuaternion(0, 0, 0, 1);
            result.v[0] = q.w * this.x + q.z * this.y + q.y * this.z - q.x * this.w;
            result.v[1] = -q.z * this.x + q.w * this.y + q.x * this.z - q.y * this.w;
            result.v[2] = q.y * this.x + q.x * this.y + q.w * this.z - q.z * this.w;
            result.v[3] = -q.x * this.x - q.y * this.y - q.z * this.z - q.w * this.w;
            this.x = result.x;
            this.y = result.y;
            this.z = result.z;
            this.w = result.w;
            return this;
        };
        MutableQuaternion.prototype.fromMatrix = function (m) {
            var tr = m.m00 + m.m11 + m.m22;
            if (tr > 0) {
                var S = 0.5 / Math.sqrt(tr + 1.0);
                this.v[0] = (m.m21 - m.m12) * S;
                this.v[1] = (m.m02 - m.m20) * S;
                this.v[2] = (m.m10 - m.m01) * S;
                this.v[3] = 0.25 / S;
            }
            else if ((m.m00 > m.m11) && (m.m00 > m.m22)) {
                var S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
                this.v[0] = 0.25 * S;
                this.v[1] = (m.m01 + m.m10) / S;
                this.v[2] = (m.m02 + m.m20) / S;
                this.v[3] = (m.m21 - m.m12) / S;
            }
            else if (m.m11 > m.m22) {
                var S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
                this.v[0] = (m.m01 + m.m10) / S;
                this.v[1] = 0.25 * S;
                this.v[2] = (m.m12 + m.m21) / S;
                this.v[3] = (m.m02 - m.m20) / S;
            }
            else {
                var S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
                this.v[0] = (m.m02 + m.m20) / S;
                this.v[1] = (m.m12 + m.m21) / S;
                this.v[2] = 0.25 * S;
                this.v[3] = (m.m10 - m.m01) / S;
            }
            return this;
        };
        MutableQuaternion.prototype.setAt = function (i, val) {
            switch (i % 4) {
                case 0:
                    this.x = val;
                    break;
                case 1:
                    this.y = val;
                    break;
                case 2:
                    this.z = val;
                    break;
                case 3:
                    this.w = val;
                    break;
            }
        };
        MutableQuaternion.prototype.normalize = function () {
            var norm = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
            this.x /= norm;
            this.y /= norm;
            this.z /= norm;
            this.w /= norm;
            return this;
        };
        MutableQuaternion.prototype.identity = function () {
            this.x = 0;
            this.y = 0;
            this.x = 0;
            this.w = 1;
        };
        Object.defineProperty(MutableQuaternion.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableQuaternion.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableQuaternion.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            set: function (z) {
                this.v[2] = z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableQuaternion.prototype, "w", {
            get: function () {
                return this.v[3];
            },
            set: function (w) {
                this.v[3] = w;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableQuaternion.prototype, "raw", {
            get: function () {
                return this.v;
            },
            enumerable: true,
            configurable: true
        });
        return MutableQuaternion;
    }(ImmutableQuaternion));

    // import AnimationComponent from './AnimationComponent';
    var TransformComponent = /** @class */ (function (_super) {
        __extends(TransformComponent, _super);
        function TransformComponent(entityUid, componentSid, entityComponent) {
            var _this = _super.call(this, entityUid, componentSid, entityComponent) || this;
            _this._translate = ImmutableVector3.dummy();
            _this._rotate = ImmutableVector3.dummy();
            _this._scale = ImmutableVector3.dummy();
            _this._quaternion = MutableQuaternion.dummy();
            _this._matrix = MutableMatrix44.dummy();
            _this._invMatrix = ImmutableMatrix44.dummy();
            _this._normalMatrix = ImmutableMatrix33.dummy();
            _this.__toUpdateAllTransform = true;
            _this._updateCount = 0;
            _this.__updateCountAtLastLogic = 0;
            // dependencies
            _this._dependentAnimationComponentId = 0;
            _this.registerMember(BufferUse.CPUGeneric, 'translate', ImmutableVector3, CompositionType.Vec3, ComponentType.Float, [0, 0, 0]);
            _this.registerMember(BufferUse.CPUGeneric, 'rotate', ImmutableVector3, CompositionType.Vec3, ComponentType.Float, [0, 0, 0]);
            _this.registerMember(BufferUse.CPUGeneric, 'scale', ImmutableVector3, CompositionType.Vec3, ComponentType.Float, [1, 1, 1]);
            _this.registerMember(BufferUse.CPUGeneric, 'quaternion', MutableQuaternion, CompositionType.Vec4, ComponentType.Float, [0, 0, 0, 1]);
            _this.registerMember(BufferUse.CPUGeneric, 'matrix', MutableMatrix44, CompositionType.Mat4, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            _this.registerMember(BufferUse.CPUGeneric, 'invMatrix', MutableMatrix44, CompositionType.Mat4, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            _this.registerMember(BufferUse.CPUGeneric, 'normalMatrix', ImmutableMatrix33, CompositionType.Mat3, ComponentType.Float, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
            _this.submitToAllocation();
            _this._is_translate_updated = true;
            _this._is_euler_angles_updated = true;
            _this._is_scale_updated = true;
            _this._is_quaternion_updated = true;
            _this._is_trs_matrix_updated = true;
            _this._is_inverse_trs_matrix_updated = true;
            _this._is_normal_trs_matrix_updated = true;
            return _this;
        }
        Object.defineProperty(TransformComponent, "renderedPropertyCount", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent, "componentTID", {
            get: function () {
                return WellKnownComponentTIDs.TransformComponentTID;
            },
            enumerable: true,
            configurable: true
        });
        TransformComponent.prototype.$logic = function () {
            if (this.__updateCountAtLastLogic !== this._updateCount) {
                var sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent.componentTID);
                sceneGraphComponent.setWorldMatrixDirty();
                this.__updateCountAtLastLogic = this._updateCount;
            }
        };
        Object.defineProperty(TransformComponent.prototype, "toUpdateAllTransform", {
            get: function () {
                return this.__toUpdateAllTransform;
            },
            set: function (flag) {
                this.__toUpdateAllTransform = flag;
            },
            enumerable: true,
            configurable: true
        });
        TransformComponent.prototype._needUpdate = function () {
            this._updateCount++;
        };
        Object.defineProperty(TransformComponent.prototype, "translate", {
            get: function () {
                return this.translateInner.clone();
            },
            set: function (vec) {
                this._translate.v[0] = vec.v[0];
                this._translate.v[1] = vec.v[1];
                this._translate.v[2] = vec.v[2];
                this._is_translate_updated = true;
                this._is_trs_matrix_updated = false;
                this._is_inverse_trs_matrix_updated = false;
                this._is_normal_trs_matrix_updated = false;
                this.__updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "translateInner", {
            get: function () {
                if (this._is_translate_updated) {
                    return this._translate;
                }
                else if (this._is_trs_matrix_updated) {
                    this._translate.v[0] = this._matrix.m03;
                    this._translate.v[1] = this._matrix.m13;
                    this._translate.v[2] = this._matrix.m23;
                    this._is_translate_updated = true;
                }
                return this._translate;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "rotate", {
            get: function () {
                return this.rotateInner.clone();
            },
            set: function (vec) {
                this._rotate.v[0] = vec.v[0];
                this._rotate.v[1] = vec.v[1];
                this._rotate.v[2] = vec.v[2];
                this._is_euler_angles_updated = true;
                this._is_quaternion_updated = false;
                this._is_trs_matrix_updated = false;
                this._is_inverse_trs_matrix_updated = false;
                this._is_normal_trs_matrix_updated = false;
                this.__updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "rotateInner", {
            get: function () {
                if (this._is_euler_angles_updated) {
                    return this._rotate;
                }
                else if (this._is_trs_matrix_updated) {
                    this._rotate = this._matrix.toEulerAngles();
                }
                else if (this._is_quaternion_updated) {
                    this._rotate = (new ImmutableMatrix44(this._quaternion)).toEulerAngles();
                }
                this._is_euler_angles_updated = true;
                return this._rotate;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "scale", {
            get: function () {
                return this.scaleInner.clone();
            },
            set: function (vec) {
                this._scale.v[0] = vec.v[0];
                this._scale.v[1] = vec.v[1];
                this._scale.v[2] = vec.v[2];
                this._is_scale_updated = true;
                this._is_trs_matrix_updated = false;
                this._is_inverse_trs_matrix_updated = false;
                this._is_normal_trs_matrix_updated = false;
                this.__updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "scaleInner", {
            get: function () {
                if (this._is_scale_updated) {
                    return this._scale;
                }
                else if (this._is_trs_matrix_updated) {
                    var m = this._matrix;
                    this._scale.v[0] = Math.sqrt(m.m00 * m.m00 + m.m01 * m.m01 + m.m02 * m.m02);
                    this._scale.v[1] = Math.sqrt(m.m10 * m.m10 + m.m11 * m.m11 + m.m12 * m.m12);
                    this._scale.v[2] = Math.sqrt(m.m20 * m.m20 + m.m21 * m.m21 + m.m22 * m.m22);
                    this._is_scale_updated = true;
                }
                return this._scale;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "quaternion", {
            get: function () {
                return this.quaternionInner.clone();
            },
            set: function (quat) {
                this._quaternion.v[0] = quat.v[0];
                this._quaternion.v[1] = quat.v[1];
                this._quaternion.v[2] = quat.v[2];
                this._is_quaternion_updated = true;
                this._is_euler_angles_updated = false;
                this._is_trs_matrix_updated = false;
                this._is_inverse_trs_matrix_updated = false;
                this._is_normal_trs_matrix_updated = false;
                this.__updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "quaternionInner", {
            get: function () {
                if (this._is_quaternion_updated) {
                    return this._quaternion;
                }
                else if (!this._is_quaternion_updated) {
                    if (this._is_trs_matrix_updated) {
                        this._is_quaternion_updated = true;
                        this._quaternion.fromMatrix(this._matrix);
                        return this._quaternion;
                    }
                    else if (this._is_euler_angles_updated) {
                        TransformComponent.__tmpMat_quaternionInner.rotateXYZ(this._rotate.x, this._rotate.y, this._rotate.z);
                        this._is_quaternion_updated = true;
                        this._quaternion.fromMatrix(TransformComponent.__tmpMat_quaternionInner);
                        return this._quaternion;
                    }
                }
                return this._quaternion;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "matrix", {
            get: function () {
                return this.matrixInner.clone();
            },
            set: function (mat) {
                this._matrix = new MutableMatrix44(mat);
                this._is_trs_matrix_updated = true;
                this._is_translate_updated = false;
                this._is_euler_angles_updated = false;
                this._is_quaternion_updated = false;
                this._is_scale_updated = false;
                this._is_inverse_trs_matrix_updated = false;
                this._is_normal_trs_matrix_updated = false;
                this.__updateTransform();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "matrixInner", {
            get: function () {
                if (this._is_trs_matrix_updated) {
                    return this._matrix;
                }
                // Clear and set Scale
                var scale = this.scaleInner;
                var n00 = scale.v[0];
                // const n01 = 0;
                // const n02 = 0;
                // const n03 = 0;
                // const n10 = 0;
                var n11 = scale.v[1];
                // const n12 = 0;
                // const n13 = 0;
                // const n20 = 0;
                // const n21 = 0;
                var n22 = scale.v[2];
                // const n23 = 0;
                // const n30 = 0;
                // const n31 = 0;
                // const n32 = 0;
                // const n33 = 1;
                var q = this.quaternionInner;
                var sx = q.v[0] * q.v[0];
                var sy = q.v[1] * q.v[1];
                var sz = q.v[2] * q.v[2];
                var cx = q.v[1] * q.v[2];
                var cy = q.v[0] * q.v[2];
                var cz = q.v[0] * q.v[1];
                var wx = q.v[3] * q.v[0];
                var wy = q.v[3] * q.v[1];
                var wz = q.v[3] * q.v[2];
                var m00 = 1.0 - 2.0 * (sy + sz);
                var m01 = 2.0 * (cz - wz);
                var m02 = 2.0 * (cy + wy);
                // const m03 = 0.0;
                var m10 = 2.0 * (cz + wz);
                var m11 = 1.0 - 2.0 * (sx + sz);
                var m12 = 2.0 * (cx - wx);
                // const m13 = 0.0;
                var m20 = 2.0 * (cy - wy);
                var m21 = 2.0 * (cx + wx);
                var m22 = 1.0 - 2.0 * (sx + sy);
                // const m23 = 0.0;
                // const m30 = 0.0;
                // const m31 = 0.0;
                // const m32 = 0.0;
                // const m33 = 1.0;
                var translate = this.translateInner;
                // TranslateMatrix * RotateMatrix * ScaleMatrix
                this._matrix.m00 = m00 * n00;
                this._matrix.m01 = m01 * n11;
                this._matrix.m02 = m02 * n22;
                this._matrix.m03 = translate.v[0];
                this._matrix.m10 = m10 * n00;
                this._matrix.m11 = m11 * n11;
                this._matrix.m12 = m12 * n22;
                this._matrix.m13 = translate.v[1];
                this._matrix.m20 = m20 * n00;
                this._matrix.m21 = m21 * n11;
                this._matrix.m22 = m22 * n22;
                this._matrix.m23 = translate.v[2];
                this._matrix.m30 = 0;
                this._matrix.m31 = 0;
                this._matrix.m32 = 0;
                this._matrix.m33 = 1;
                this._is_trs_matrix_updated = true;
                return this._matrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "inverseMatrix", {
            get: function () {
                return this.inverseMatrixInner.clone();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "inverseMatrixInner", {
            get: function () {
                if (!this._is_inverse_trs_matrix_updated) {
                    this._invMatrix = MutableMatrix44.invert(this.matrixInner);
                    this._is_inverse_trs_matrix_updated = true;
                }
                return this._invMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "normalMatrix", {
            get: function () {
                return this.normalMatrixInner.clone();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TransformComponent.prototype, "normalMatrixInner", {
            get: function () {
                if (!this._is_normal_trs_matrix_updated) {
                    this._normalMatrix = new ImmutableMatrix33(ImmutableMatrix44.transpose(ImmutableMatrix44.invert(this.matrix)));
                    this._is_normal_trs_matrix_updated = true;
                }
                return this._normalMatrix;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Set multiple transform information at once. By using this method,
         * we reduce the cost of automatically updating other transform components inside this class.
         * This method may be useful for animation processing and so on.
         *
         * The transform components of these arguments must not be mutually discrepant.
         * for example. The transform components of matrix argument (translate, rotate/quaternion, scale)
         * must be equal to translate, rotate, scale, quaternion arguments.
         * And both rotate and quaternion arguments must be same rotation.
         * If there is an argument passed with null or undefined, it is interpreted as unchanged.
         *
         * @param {*} translate
         * @param {*} rotate
         * @param {*} scale
         * @param {*} quaternion
         * @param {*} matrix
         */
        TransformComponent.prototype.setTransform = function (translate, rotate, scale, quaternion, matrix) {
            this._is_trs_matrix_updated = false;
            this._is_inverse_trs_matrix_updated = false;
            this._is_normal_trs_matrix_updated = false;
            // Matrix
            if (matrix != null) {
                this._matrix = new MutableMatrix44(matrix);
                this._is_trs_matrix_updated = true;
                this._is_translate_updated = false;
                this._is_euler_angles_updated = false;
                this._is_quaternion_updated = false;
                this._is_scale_updated = false;
            }
            // Translate
            if (translate != null) {
                this._translate = translate.clone();
                this._is_translate_updated = true;
            }
            // Roatation
            if (rotate != null && quaternion != null) {
                this._rotate = rotate.clone();
                this._quaternion = new MutableQuaternion(quaternion);
                this._is_euler_angles_updated = true;
                this._is_quaternion_updated = true;
            }
            else if (rotate != null) {
                this._rotate = rotate.clone();
                this._is_euler_angles_updated = true;
                this._is_quaternion_updated = false;
            }
            else if (quaternion != null) {
                this._quaternion = new MutableQuaternion(quaternion);
                this._is_euler_angles_updated = false;
                this._is_quaternion_updated = true;
            }
            // Scale
            if (scale != null) {
                this._scale = scale.clone();
                this._is_scale_updated = true;
            }
            this.__updateTransform();
        };
        TransformComponent.prototype.__updateTransform = function () {
            if (this.__toUpdateAllTransform) {
                this.__updateRotation();
                this.__updateTranslate();
                this.__updateScale();
            }
            //this.__updateMatrix();
            this._needUpdate();
        };
        TransformComponent.prototype.__updateRotation = function () {
            if (this._is_euler_angles_updated && !this._is_quaternion_updated) {
                TransformComponent.__tmpMat_updateRotation.rotateXYZ(this._rotate.x, this._rotate.y, this._rotate.z);
                this._quaternion.fromMatrix(TransformComponent.__tmpMat_updateRotation);
                this._is_quaternion_updated = true;
            }
            else if (!this._is_euler_angles_updated && this._is_quaternion_updated) {
                this._rotate = (new ImmutableMatrix44(this._quaternion)).toEulerAngles();
                this._is_euler_angles_updated = true;
            }
            else if (!this._is_euler_angles_updated && !this._is_quaternion_updated && this._is_trs_matrix_updated) {
                var m = this._matrix;
                this._quaternion.fromMatrix(m);
                this._is_quaternion_updated = true;
                this._rotate = m.toEulerAngles();
                this._is_euler_angles_updated = true;
            }
        };
        TransformComponent.prototype.__updateTranslate = function () {
            if (!this._is_translate_updated && this._is_trs_matrix_updated) {
                var m = this._matrix;
                this._translate.v[0] = m.m03;
                this._translate.v[1] = m.m13;
                this._translate.v[2] = m.m23;
                this._is_translate_updated = true;
            }
        };
        TransformComponent.prototype.__updateScale = function () {
            if (!this._is_scale_updated && this._is_trs_matrix_updated) {
                var m = this._matrix;
                this._scale.v[0] = Math.sqrt(m.m00 * m.m00 + m.m01 * m.m01 + m.m02 * m.m02);
                this._scale.v[1] = Math.sqrt(m.m10 * m.m10 + m.m11 * m.m11 + m.m12 * m.m12);
                this._scale.v[2] = Math.sqrt(m.m20 * m.m20 + m.m21 * m.m21 + m.m22 * m.m22);
                this._is_scale_updated = true;
            }
        };
        TransformComponent.prototype.__updateMatrix = function () {
            if (!this._is_trs_matrix_updated && this._is_translate_updated && this._is_quaternion_updated && this._is_scale_updated) {
                var rotationMatrix = new ImmutableMatrix44(this._quaternion);
                var scale = this._scale;
                this._matrix = MutableMatrix44.multiply(rotationMatrix, ImmutableMatrix44.scale(scale));
                var translateVec = this._translate;
                this._matrix.m03 = translateVec.x;
                this._matrix.m13 = translateVec.y;
                this._matrix.m23 = translateVec.z;
                this._is_trs_matrix_updated = true;
            }
        };
        TransformComponent.prototype.setPropertiesFromJson = function (arg) {
            var json = arg;
            if (typeof arg === "string") {
                json = JSON.parse(arg);
            }
            for (var key in json) {
                if (json.hasOwnProperty(key) && key in this) {
                    if (key === "quaternion") {
                        this[key] = new ImmutableQuaternion(json[key]);
                    }
                    else if (key === 'matrix') {
                        this[key] = new ImmutableMatrix44(json[key]);
                    }
                    else {
                        this[key] = new ImmutableVector3(json[key]);
                    }
                }
            }
        };
        TransformComponent.prototype.setRotationFromNewUpAndFront = function (UpVec, FrontVec) {
            var yDir = UpVec;
            var xDir = ImmutableVector3.cross(yDir, FrontVec);
            var zDir = ImmutableVector3.cross(xDir, yDir);
            var rotateMatrix = MutableMatrix44.identity();
            rotateMatrix.m00 = xDir.x;
            rotateMatrix.m10 = xDir.y;
            rotateMatrix.m20 = xDir.z;
            rotateMatrix.m01 = yDir.x;
            rotateMatrix.m11 = yDir.y;
            rotateMatrix.m21 = yDir.z;
            rotateMatrix.m02 = zDir.x;
            rotateMatrix.m12 = zDir.y;
            rotateMatrix.m22 = zDir.z;
            this.rotateMatrix44 = rotateMatrix;
        };
        TransformComponent.prototype.headToDirection = function (fromVec, toVec) {
            var fromDir = ImmutableVector3.normalize(fromVec);
            var toDir = ImmutableVector3.normalize(toVec);
            var rotationDir = ImmutableVector3.cross(fromDir, toDir);
            var cosTheta = ImmutableVector3.dotProduct(fromDir, toDir);
            var theta = Math.acos(cosTheta);
            this.quaternion = MutableQuaternion.axisAngle(rotationDir, theta);
        };
        Object.defineProperty(TransformComponent.prototype, "rotateMatrix44", {
            get: function () {
                return new ImmutableMatrix44(this.quaternion);
            },
            set: function (rotateMatrix) {
                this.quaternion = MutableQuaternion.fromMatrix(rotateMatrix);
            },
            enumerable: true,
            configurable: true
        });
        TransformComponent.__tmpMat_updateRotation = MutableMatrix44.identity();
        TransformComponent.__tmpMat_quaternionInner = MutableMatrix44.identity();
        return TransformComponent;
    }(Component));
    ComponentRepository.registerComponentClass(TransformComponent.componentTID, TransformComponent);

    var MeshComponent = /** @class */ (function (_super) {
        __extends(MeshComponent, _super);
        function MeshComponent(entityUid, componentSid, entityComponent) {
            var _this = _super.call(this, entityUid, componentSid, entityComponent) || this;
            _this.__primitives = [];
            return _this;
        }
        Object.defineProperty(MeshComponent, "componentTID", {
            get: function () {
                return 3;
            },
            enumerable: true,
            configurable: true
        });
        MeshComponent.prototype.addPrimitive = function (primitive) {
            this.__primitives.push(primitive);
        };
        MeshComponent.prototype.getPrimitiveAt = function (i) {
            return this.__primitives[i];
        };
        MeshComponent.prototype.getPrimitiveNumber = function () {
            return this.__primitives.length;
        };
        return MeshComponent;
    }(Component));
    ComponentRepository.registerComponentClass(MeshComponent.componentTID, MeshComponent);

    var ProcessApproachClass = /** @class */ (function (_super) {
        __extends(ProcessApproachClass, _super);
        function ProcessApproachClass(_a) {
            var index = _a.index, str = _a.str;
            return _super.call(this, { index: index, str: str }) || this;
        }
        return ProcessApproachClass;
    }(EnumClass));
    var None = new ProcessApproachClass({ index: 0, str: 'NONE' });
    var UniformWebGL1 = new ProcessApproachClass({ index: 1, str: 'UNIFORM_WEBGL1' });
    var DataTextureWebGL1 = new ProcessApproachClass({ index: 2, str: 'DATA_TEXTURE_WEBGL1' });
    var DataTextureWebGL2 = new ProcessApproachClass({ index: 3, str: 'DATA_TEXTURE_WEBGL2' });
    var UBOWebGL2 = new ProcessApproachClass({ index: 4, str: 'UBO_WEBGL2' });
    var TransformFeedbackWebGL2 = new ProcessApproachClass({ index: 5, str: 'TRNASFORM_FEEDBACK_WEBGL2' });
    var ProcessApproach = Object.freeze({ None: None, UniformWebGL1: UniformWebGL1, DataTextureWebGL1: DataTextureWebGL1, DataTextureWebGL2: DataTextureWebGL2, UBOWebGL2: UBOWebGL2, TransformFeedbackWebGL2: TransformFeedbackWebGL2 });

    //import GLBoost from '../../globals';
    function radianToDegree(rad) {
        return rad * 180 / Math.PI;
    }
    function degreeToRadian(deg) {
        return deg * Math.PI / 180;
    }
    // https://gamedev.stackexchange.com/questions/17326/conversion-of-a-number-from-single-precision-floating-point-representation-to-a/17410#17410
    var toHalfFloat = (function () {
        var floatView = new Float32Array(1);
        var int32View = new Int32Array(floatView.buffer);
        /* This method is faster than the OpenEXR implementation (very often
          * used, eg. in Ogre), with the additional benefit of rounding, inspired
          * by James Tursa?s half-precision code. */
        return function toHalf(val) {
            floatView[0] = val;
            var x = int32View[0];
            var bits = (x >> 16) & 0x8000; /* Get the sign */
            var m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
            var e = (x >> 23) & 0xff; /* Using int is faster here */
            /* If zero, or denormal, or exponent underflows too much for a denormal
              * half, return signed zero. */
            if (e < 103) {
                return bits;
            }
            /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
            if (e > 142) {
                bits |= 0x7c00;
                /* If exponent was 0xff and one mantissa bit was set, it means NaN,
                      * not Inf, so make sure we set one mantissa bit too. */
                bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
                return bits;
            }
            /* If exponent underflows but not too much, return a denormal */
            if (e < 113) {
                m |= 0x0800;
                /* Extra rounding may overflow and set mantissa to 0 and exponent
                  * to 1, which is OK. */
                bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
                return bits;
            }
            bits |= ((e - 112) << 10) | (m >> 1);
            /* Extra rounding. An overflow will set mantissa to 0 and increment
              * the exponent, which is OK. */
            bits += m & 1;
            return bits;
        };
    }());
    var MathUtil = Object.freeze({ radianToDegree: radianToDegree, degreeToRadian: degreeToRadian, toHalfFloat: toHalfFloat });

    var GLSLShader = /** @class */ (function () {
        function GLSLShader() {
        }
        Object.defineProperty(GLSLShader, "glsl_rt0", {
            get: function () {
                if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
                    return 'layout(location = 0) out vec4 rt0;\n';
                }
                else {
                    return 'vec4 rt0;\n';
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "glsl_fragColor", {
            get: function () {
                if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
                    return '';
                }
                else {
                    return 'gl_FragColor = rt0;\n';
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "glsl_vertex_in", {
            get: function () {
                if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
                    return 'in';
                }
                else {
                    return 'attribute';
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "glsl_fragment_in", {
            get: function () {
                if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
                    return 'in';
                }
                else {
                    return 'varying';
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "glsl_vertex_out", {
            get: function () {
                if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
                    return 'out';
                }
                else {
                    return 'varying';
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "glsl_texture", {
            get: function () {
                if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
                    return 'texture';
                }
                else {
                    return 'texture2D';
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "glsl_versionText", {
            get: function () {
                if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
                    return '#version 300 es\n';
                }
                else {
                    return '';
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "vertexShaderVariableDefinitions", {
            get: function () {
                var _version = this.glsl_versionText;
                var _in = this.glsl_vertex_in;
                var _out = this.glsl_vertex_out;
                return _version + "\nprecision highp float;\n" + _in + " vec3 a_position;\n" + _in + " vec3 a_color;\n" + _in + " float a_instanceID;\n" + _out + " vec3 v_color;";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "fragmentShaderSimple", {
            get: function () {
                var _version = this.glsl_versionText;
                var _in = this.glsl_fragment_in;
                var _def_rt0 = this.glsl_rt0;
                var _def_fragColor = this.glsl_fragColor;
                return _version + "\nprecision highp float;\n" + _in + " vec3 v_color;\n" + _def_rt0 + "\nvoid main ()\n{\n  rt0 = vec4(v_color, 1.0);\n  " + _def_fragColor + "\n}\n";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "fragmentShader", {
            get: function () {
                return GLSLShader.fragmentShaderSimple;
            },
            enumerable: true,
            configurable: true
        });
        GLSLShader.vertexShaderBody = "\n\nvoid main ()\n{\n  mat4 matrix = getMatrix(a_instanceID);\n  //mat4 matrix = getMatrix(gl_InstanceID);\n\n  gl_Position = matrix * vec4(a_position, 1.0);\n  // gl_Position = vec4(a_position, 1.0);\n  // gl_Position.xyz /= 10.0;\n  // gl_Position.x += a_instanceID / 20.0;\n//  gl_Position.x += col0.x / 5.0;\n\n  v_color = a_color;\n}\n  ";
        GLSLShader.attributeNames = ['a_position', 'a_color', 'a_instanceID'];
        GLSLShader.attributeSemantics = [VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Instance];
        return GLSLShader;
    }());

    var WebGLStrategyUBO = /** @class */ (function () {
        function WebGLStrategyUBO() {
            this.__webglResourceRepository = WebGLResourceRepository.getInstance();
            this.__uboUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__shaderProgramUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__vertexHandles = [];
            this.__isVAOSet = false;
            this.vertexShaderMethodDefinitions_UBO = "layout (std140) uniform matrix {\n    mat4 world[1024];\n  } u_matrix;\n\n  mat4 getMatrix(float instanceId) {\n    float index = instanceId;\n    return transpose(u_matrix.world[int(index)]);\n  }\n  ";
        }
        WebGLStrategyUBO.prototype.setupShaderProgram = function () {
            if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                return;
            }
            // Shader Setup
            var vertexShader = GLSLShader.vertexShaderVariableDefinitions +
                this.vertexShaderMethodDefinitions_UBO +
                GLSLShader.vertexShaderBody;
            var fragmentShader = GLSLShader.fragmentShader;
            this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram({
                vertexShaderStr: vertexShader,
                fragmentShaderStr: fragmentShader,
                attributeNames: GLSLShader.attributeNames,
                attributeSemantics: GLSLShader.attributeSemantics
            });
        };
        WebGLStrategyUBO.prototype.__isLoaded = function (index) {
            if (this.__vertexHandles[index] != null) {
                return true;
            }
            else {
                return false;
            }
        };
        WebGLStrategyUBO.prototype.$load = function (meshComponent) {
            if (this.__isLoaded(0)) {
                return;
            }
            var primitiveNum = meshComponent.getPrimitiveNumber();
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = meshComponent.getPrimitiveAt(i);
                var vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
                this.__vertexHandles[i] = vertexHandles;
                WebGLStrategyUBO.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles);
            }
        };
        WebGLStrategyUBO.prototype.$prerender = function (meshComponent, instanceIDBufferUid) {
            if (this.__isVAOSet) {
                return;
            }
            var primitiveNum = meshComponent.getPrimitiveNumber();
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = meshComponent.getPrimitiveAt(i);
                // if (this.__isLoaded(i) && this.__isVAOSet) {
                this.__vertexHandles[i] = WebGLStrategyUBO.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUid);
                //this.__vertexShaderProgramHandles[i] = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
                //  continue;
                // }
                this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
            }
            this.__isVAOSet = true;
        };
        WebGLStrategyUBO.prototype.common_$prerender = function () {
            var memoryManager = MemoryManager.getInstance();
            var buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
            var floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
            {
                if (this.__uboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                    this.__webglResourceRepository.updateUniformBuffer(this.__uboUid, SceneGraphComponent.getAccessor('worldMatrix', SceneGraphComponent).dataViewOfBufferView);
                    return;
                }
                this.__uboUid = this.__webglResourceRepository.createUniformBuffer(SceneGraphComponent.getAccessor('worldMatrix', SceneGraphComponent).dataViewOfBufferView);
            }
            this.__webglResourceRepository.bindUniformBufferBase(0, this.__uboUid);
        };
        WebGLStrategyUBO.prototype.attachGPUData = function () {
            this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'matrix', 0);
        };
        WebGLStrategyUBO.prototype.attatchShaderProgram = function () {
            var shaderProgramUid = this.__shaderProgramUid;
            var glw = this.__webglResourceRepository.currentWebGLContextWrapper;
            var gl = glw.getRawContext();
            var shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid);
            gl.useProgram(shaderProgram);
        };
        WebGLStrategyUBO.prototype.attachVertexData = function (i, primitive, glw, instanceIDBufferUid) {
            var vaoHandles = this.__vertexHandles[i];
            var vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
            var gl = glw.getRawContext();
            if (vao != null) {
                glw.bindVertexArray(vao);
            }
            else {
                this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, instanceIDBufferUid);
                var ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            }
        };
        WebGLStrategyUBO.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new WebGLStrategyUBO();
            }
            return this.__instance;
        };
        WebGLStrategyUBO.prototype.common_$render = function () {
            return true;
        };
        WebGLStrategyUBO.__vertexHandleOfPrimitiveObjectUids = new Map();
        return WebGLStrategyUBO;
    }());

    var PixelFormatClass = /** @class */ (function (_super) {
        __extends(PixelFormatClass, _super);
        function PixelFormatClass(_a) {
            var index = _a.index, str = _a.str;
            return _super.call(this, { index: index, str: str }) || this;
        }
        return PixelFormatClass;
    }(EnumClass));
    var DepthComponent = new PixelFormatClass({ index: 0x1902, str: 'DEPTH_COMPONENT' });
    var Alpha = new PixelFormatClass({ index: 0x1906, str: 'ALPHA' });
    var RGB = new PixelFormatClass({ index: 0x1907, str: 'RGB' });
    var RGBA = new PixelFormatClass({ index: 0x1908, str: 'RGBA' });
    var Luminance = new PixelFormatClass({ index: 0x1909, str: 'LUMINANCE' });
    var LuminanceAlpha = new PixelFormatClass({ index: 0x190A, str: 'LUMINANCE_ALPHA' });
    var PixelFormat = Object.freeze({ DepthComponent: DepthComponent, Alpha: Alpha, RGB: RGB, RGBA: RGBA, Luminance: Luminance, LuminanceAlpha: LuminanceAlpha });

    var TextureParameterClass = /** @class */ (function (_super) {
        __extends(TextureParameterClass, _super);
        function TextureParameterClass(_a) {
            var index = _a.index, str = _a.str;
            return _super.call(this, { index: index, str: str }) || this;
        }
        return TextureParameterClass;
    }(EnumClass));
    var Nearest = new TextureParameterClass({ index: 0x2600, str: 'NEAREST' });
    var Linear = new TextureParameterClass({ index: 0x2601, str: 'LINEAR' });
    var TextureMagFilter = new TextureParameterClass({ index: 0x2800, str: 'TEXTURE_MAG_FILTER' });
    var TextureMinFilter = new TextureParameterClass({ index: 0x2801, str: 'TEXTURE_MIN_FILTER' });
    var TextureWrapS = new TextureParameterClass({ index: 0x2802, str: 'TEXTURE_WRAP_S' });
    var TextureWrapT = new TextureParameterClass({ index: 0x2803, str: 'TEXTURE_WRAP_T' });
    var Texture2D = new TextureParameterClass({ index: 0x0DE1, str: 'TEXTURE_2D' });
    var Texture = new TextureParameterClass({ index: 0x1702, str: 'TEXTURE' });
    var Texture0 = new TextureParameterClass({ index: 0x84C0, str: 'TEXTURE0' });
    var Texture1 = new TextureParameterClass({ index: 0x84C1, str: 'TEXTURE1' });
    var ActiveTexture = new TextureParameterClass({ index: 0x84E0, str: 'ACTIVE_TEXTURE' });
    var Repeat = new TextureParameterClass({ index: 0x2901, str: 'REPEAT' });
    var ClampToEdge = new TextureParameterClass({ index: 0x812F, str: 'CLAMP_TO_EDGE' });
    var RGB8 = new TextureParameterClass({ index: 0x8051, str: 'RGB8' });
    var RGBA8 = new TextureParameterClass({ index: 0x8058, str: 'RGBA8' });
    var RGB10_A2 = new TextureParameterClass({ index: 0x8059, str: 'RGB10_A2' });
    var RGB16F = new TextureParameterClass({ index: 0x881B, str: 'RGB16F' });
    var RGB32F = new TextureParameterClass({ index: 0x8815, str: 'RGB32F' });
    var RGBA16F = new TextureParameterClass({ index: 0x881A, str: 'RGBA16F' });
    var RGBA32F = new TextureParameterClass({ index: 0x8814, str: 'RGBA32F' });
    var TextureParameter = Object.freeze({ Nearest: Nearest, Linear: Linear, TextureMagFilter: TextureMagFilter, TextureMinFilter: TextureMinFilter, TextureWrapS: TextureWrapS, TextureWrapT: TextureWrapT, Texture2D: Texture2D, Texture: Texture,
        Texture0: Texture0, Texture1: Texture1, ActiveTexture: ActiveTexture, Repeat: Repeat, ClampToEdge: ClampToEdge, RGB8: RGB8, RGBA8: RGBA8, RGB10_A2: RGB10_A2, RGB16F: RGB16F, RGB32F: RGB32F, RGBA16F: RGBA16F, RGBA32F: RGBA32F });

    var Primitive = /** @class */ (function (_super) {
        __extends(Primitive, _super);
        function Primitive(attributeAccessors, attributeSemantics, mode, material, indicesAccessor) {
            var _this = _super.call(this) || this;
            _this.__primitiveUid = -1; // start ID from zero
            _this.__indices = indicesAccessor;
            _this.__attributes = attributeAccessors;
            _this.__attributeSemantics = attributeSemantics;
            _this.__material = material;
            _this.__mode = mode;
            _this.__primitiveUid = Primitive.__primitiveCount++;
            if (Primitive.__headerAccessor == null) {
                // primitive 0
                // prim0.indices.byteOffset, prim0.indices.componentSizeInByte, prim0.indices.indicesLength, null
                //   prim0.attrb0.byteOffset, prim0.attrib0.byteStride, prim0.attrib0.compopisionN, prim0.attrib0.componentSizeInByte
                //   prim0.attrb1.byteOffset, prim0.attrib1.byteStride, prim0.attrib1.compopisionN, prim0.attrib1.componentSizeInByte
                //   ...
                //   prim0.attrb7.byteOffset, prim0.attrib7.byteStride, prim0.attrib7.compopisionN, prim0.attrib7.componentSizeInByte
                // primitive 1
                // prim1.indices.byteOffset, prim1.indices.componentSizeInByte, prim0.indices.indicesLength, null
                //   prim1.attrb0.byteOffset, prim1.attrib0.byteStride, prim1.attrib0.compopisionN, prim1.attrib0.componentSizeInByte
                //   prim1.attrb1.byteOffset, prim1.attrib1.byteStride, prim1.attrib1.compopisionN, prim1.attrib1.componentSizeInByte
                //   ...
                //   prim1.attrb7.byteOffset, prim1.attrib7.byteStride, prim1.attrib7.compopisionN, prim1.attrib7.componentSizeInByte
                var buffer = MemoryManager.getInstance().getBuffer(BufferUse.UBOGeneric);
                var bufferView = buffer.takeBufferView({ byteLengthToNeed: ((1 * 4) + (8 * 4)) * 4 /*byte*/ * Primitive.maxPrimitiveCount, byteStride: 64, isAoS: false });
                Primitive.__headerAccessor = bufferView.takeAccessor({ compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: 9 * Primitive.maxPrimitiveCount });
            }
            var attributeNumOfPrimitive = 1 /*indices*/ + 8 /*vertexAttributes*/;
            if (_this.indicesAccessor != null) {
                Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * _this.__primitiveUid + 0 /* 0 means indices */, _this.indicesAccessor.byteOffsetInBuffer, _this.indicesAccessor.componentSizeInBytes, _this.indicesAccessor.byteLength / _this.indicesAccessor.componentSizeInBytes, -1);
            }
            else {
                Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * _this.__primitiveUid + 0 /* 0 means indices */, -1, -1, -1, -1);
            }
            _this.attributeAccessors.forEach(function (attributeAccessor, i) {
                Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * _this.__primitiveUid + i, attributeAccessor.byteOffsetInBuffer, attributeAccessor.byteStride, attributeAccessor.numberOfComponents, attributeAccessor.componentSizeInBytes);
            });
            return _this;
        }
        Object.defineProperty(Primitive, "maxPrimitiveCount", {
            get: function () {
                return 100;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Primitive, "headerAccessor", {
            get: function () {
                return this.__headerAccessor;
            },
            enumerable: true,
            configurable: true
        });
        Primitive.createPrimitive = function (_a) {
            var indices = _a.indices, attributeCompositionTypes = _a.attributeCompositionTypes, attributeSemantics = _a.attributeSemantics, attributes = _a.attributes, material = _a.material, primitiveMode = _a.primitiveMode;
            var buffer = MemoryManager.getInstance().getBuffer(BufferUse.GPUVertexData);
            var indicesComponentType;
            var indicesBufferView;
            var indicesAccessor;
            if (indices != null) {
                indicesComponentType = ComponentType.fromTypedArray(indices);
                indicesBufferView = buffer.takeBufferView({ byteLengthToNeed: indices.byteLength, byteStride: 0, isAoS: false });
                indicesAccessor = indicesBufferView.takeAccessor({
                    compositionType: CompositionType.Scalar,
                    componentType: indicesComponentType,
                    count: indices.byteLength / indicesComponentType.getSizeInBytes()
                });
                // copy indices
                for (var i = 0; i < indices.byteLength / indicesAccessor.componentSizeInBytes; i++) {
                    indicesAccessor.setScalar(i, indices[i]);
                }
            }
            var sumOfAttributesByteSize = 0;
            attributes.forEach(function (attribute) {
                sumOfAttributesByteSize += attribute.byteLength;
            });
            var attributesBufferView = buffer.takeBufferView({ byteLengthToNeed: sumOfAttributesByteSize, byteStride: 0, isAoS: false });
            var attributeAccessors = [];
            var attributeComponentTypes = [];
            attributes.forEach(function (attribute, i) {
                attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
                var accessor = attributesBufferView.takeAccessor({
                    compositionType: attributeCompositionTypes[i],
                    componentType: ComponentType.fromTypedArray(attributes[i]),
                    count: attribute.byteLength / attributeCompositionTypes[i].getNumberOfComponents() / attributeComponentTypes[i].getSizeInBytes()
                });
                accessor.copyFromTypedArray(attribute);
                attributeAccessors.push(accessor);
            });
            return new Primitive(attributeAccessors, attributeSemantics, primitiveMode, material, indicesAccessor);
        };
        Object.defineProperty(Primitive.prototype, "indicesAccessor", {
            get: function () {
                return this.__indices;
            },
            enumerable: true,
            configurable: true
        });
        Primitive.prototype.hasIndices = function () {
            return this.__indices != null;
        };
        Object.defineProperty(Primitive.prototype, "attributeAccessors", {
            get: function () {
                return this.__attributes.concat();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Primitive.prototype, "attributeSemantics", {
            get: function () {
                return this.__attributeSemantics.concat();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Primitive.prototype, "attributeCompositionTypes", {
            get: function () {
                return this.__attributes.map(function (attribute) { return attribute.compositionType; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Primitive.prototype, "attributeComponentTypes", {
            get: function () {
                return this.__attributes.map(function (attribute) { return attribute.componentType; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Primitive.prototype, "primitiveMode", {
            get: function () {
                return this.__mode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Primitive.prototype, "primitiveUid", {
            get: function () {
                return this.__primitiveUid;
            },
            enumerable: true,
            configurable: true
        });
        Primitive.__primitiveCount = 0;
        return Primitive;
    }(RnObject));

    var PrimitiveModeClass = /** @class */ (function (_super) {
        __extends(PrimitiveModeClass, _super);
        function PrimitiveModeClass(_a) {
            var index = _a.index, str = _a.str;
            return _super.call(this, { index: index, str: str }) || this;
        }
        return PrimitiveModeClass;
    }(EnumClass));
    var Unknown$4 = new PrimitiveModeClass({ index: -1, str: 'UNKNOWN' });
    var Points = new PrimitiveModeClass({ index: 0, str: 'POINTS' });
    var Lines = new PrimitiveModeClass({ index: 1, str: 'LINES' });
    var LineLoop = new PrimitiveModeClass({ index: 2, str: 'LINE_LOOP' });
    var LineStrip = new PrimitiveModeClass({ index: 3, str: 'LINE_STRIP' });
    var Triangles = new PrimitiveModeClass({ index: 4, str: 'TRIANGLES' });
    var TriangleStrip = new PrimitiveModeClass({ index: 5, str: 'TRIANGLE_STRIP' });
    var TriangleFan = new PrimitiveModeClass({ index: 6, str: 'TRIANGLE_FAN' });
    var typeList$9 = [Unknown$4, Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan];
    function from$9(index) {
        return _from({ typeList: typeList$9, index: index });
    }
    var PrimitiveMode = Object.freeze({ Unknown: Unknown$4, Points: Points, Lines: Lines, LineLoop: LineLoop, LineStrip: LineStrip, Triangles: Triangles, TriangleStrip: TriangleStrip, TriangleFan: TriangleFan, from: from$9 });

    var WebGLStrategyTransformFeedback = /** @class */ (function () {
        function WebGLStrategyTransformFeedback() {
            this.__webglResourceRepository = WebGLResourceRepository.getInstance();
            this.__instanceDataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__vertexDataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__shaderProgramUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__primitiveHeaderUboUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__indexCountToSubtractUboUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__entitiesUidUboUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__primitiveUidUboUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__isVertexReady = false;
        }
        Object.defineProperty(WebGLStrategyTransformFeedback.prototype, "__transformFeedbackShaderText", {
            get: function () {
                return "#version 300 es\n\n    layout (std140) uniform indexCountsToSubtract {\n      ivec4 counts[256];\n    } u_indexCountsToSubtract;\n    layout (std140) uniform entityUids {\n      ivec4 ids[256];\n    } u_entityData;\n    layout (std140) uniform primitiveUids {\n      ivec4 ids[256];\n    } u_primitiveData;\n    layout (std140) uniform primitiveHeader {\n      ivec4 data[256];\n    } u_primitiveHeader;\n\n    out vec4 position;\n    //out vec3 colors;\n\n    uniform sampler2D u_instanceDataTexture;\n    uniform sampler2D u_vertexDataTexture;\n\n    void main(){\n      int indexOfVertices = gl_VertexID + 3*gl_InstanceID;\n\n      int entityUidMinusOne = 0;\n      int primitiveUid = 0;\n      for (int i=0; i<=indexOfVertices; i++) {\n        for (int j=0; j<1024; j++) {\n          int value = u_indexCountsToSubtract.counts[j/4][j%4];\n          int result = int(step(float(value), float(i)));\n          if (result > 0) {\n            entityUidMinusOne = result * int(u_entityData.ids[j/4][j%4]) - 1;\n            primitiveUid = result * u_primitiveData.ids[j/4][j%4];\n          } else {\n            break;\n          }\n        }\n      }\n\n      ivec4 indicesMeta = u_primitiveHeader.data[9*primitiveUid + 0];\n      int primIndicesByteOffset = indicesMeta.x;\n      int primIndicesComponentSizeInByte = indicesMeta.y;\n      int primIndicesLength = indicesMeta.z;\n\n      int idx = gl_VertexID - primIndicesByteOffset / 4 /*byte*/;\n\n      // get Indices\n      int texelLength = " + MemoryManager.bufferWidthLength + ";\n      vec4 indexVec4 = texelFetch(u_vertexDataTexture, ivec2(idx%texelLength, idx/texelLength), 0);\n      int index = int(indexVec4[idx%4]);\n\n      // get Positions\n      ivec4 indicesData = u_primitiveHeader.data[9*primitiveUid + 1];\n      int primPositionsByteOffset = indicesData.x;\n      idx = primPositionsByteOffset/4 + index;\n      vec4 posVec4 = texelFetch(u_vertexDataTexture, ivec2(idx%texelLength, idx/texelLength), 0);\n\n      position = posVec4;\n    }\n";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WebGLStrategyTransformFeedback.prototype, "__transformFeedbackFragmentShaderText", {
            get: function () {
                return "#version 300 es\nprecision highp float;\n\nout vec4 outColor;\n\nvoid main(){\n    outColor = vec4(1.0);\n}\n    ";
            },
            enumerable: true,
            configurable: true
        });
        WebGLStrategyTransformFeedback.prototype.setupShaderProgram = function () {
            if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                return;
            }
            // Shader Setup
            var vertexShader = this.__transformFeedbackShaderText;
            var fragmentShader = this.__transformFeedbackFragmentShaderText;
            this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram({
                vertexShaderStr: vertexShader,
                fragmentShaderStr: fragmentShader,
                attributeNames: GLSLShader.attributeNames,
                attributeSemantics: GLSLShader.attributeSemantics
            });
        };
        WebGLStrategyTransformFeedback.prototype.$load = function (meshComponent) {
            if (this.__isVertexReady) {
                return;
            }
            var buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
            var indicesBufferView = buffer.takeBufferView({ byteLengthToNeed: 4 * 3, byteStride: 4, isAoS: false });
            var indicesAccessor = indicesBufferView.takeAccessor({ compositionType: CompositionType.Scalar, componentType: ComponentType.UnsingedInt, count: 3 });
            var attributeBufferView = buffer.takeBufferView({ byteLengthToNeed: 16 * 3, byteStride: 16, isAoS: false });
            var attributeAccessor = attributeBufferView.takeAccessor({ compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: 3 });
            var indicesUint16Array = indicesAccessor.getTypedArray();
            indicesUint16Array[0] = 0;
            indicesUint16Array[1] = 1;
            indicesUint16Array[2] = 2;
            var primitive = Primitive.createPrimitive({
                indices: indicesUint16Array,
                attributeCompositionTypes: [attributeAccessor.compositionType],
                attributeSemantics: [VertexAttribute.Position],
                attributes: [attributeAccessor.getTypedArray()],
                primitiveMode: PrimitiveMode.Triangles,
                material: 0
            });
            this.__vertexHandle = this.__webglResourceRepository.createVertexDataResources(primitive);
            this.__isVertexReady = true;
        };
        WebGLStrategyTransformFeedback.prototype.$prerender = function (meshComponent, instanceIDBufferUid) {
        };
        WebGLStrategyTransformFeedback.prototype.__setupUBOPrimitiveHeaderData = function () {
            var memoryManager = MemoryManager.getInstance();
            var buffer = memoryManager.getBuffer(BufferUse.UBOGeneric);
            var floatDataTextureBuffer = new Int32Array(buffer.getArrayBuffer());
            if (this.__primitiveHeaderUboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                //      this.__webglResourceRepository.updateUniformBuffer(this.__primitiveHeaderUboUid, floatDataTextureBuffer);
                return;
            }
            this.__primitiveHeaderUboUid = this.__webglResourceRepository.createUniformBuffer(floatDataTextureBuffer);
            this.__webglResourceRepository.bindUniformBufferBase(3, this.__primitiveHeaderUboUid);
        };
        WebGLStrategyTransformFeedback.prototype.__setupGPUInstanceMetaData = function () {
            if (this.__primitiveUidUboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                return;
            }
            var entities = EntityRepository.getInstance()._getEntities();
            var entityIds = new Int32Array(entities.length);
            var primitiveIds = new Int32Array(entities.length);
            var indexCountToSubtract = new Int32Array(entities.length);
            var tmpSumIndexCount = 0;
            entities.forEach(function (entity, i) {
                var meshComponent = entity.getComponent(MeshComponent.componentTID);
                if (meshComponent) {
                    primitiveIds[i] = meshComponent.getPrimitiveAt(0).primitiveUid;
                    entityIds[i] = entity.entityUID;
                    var indexCountOfPrimitive = meshComponent.getPrimitiveAt(0).indicesAccessor.elementCount;
                    indexCountToSubtract[i] = tmpSumIndexCount + indexCountOfPrimitive;
                    tmpSumIndexCount += indexCountOfPrimitive;
                }
            });
            this.__indexCountToSubtractUboUid = this.__webglResourceRepository.createUniformBuffer(indexCountToSubtract);
            this.__webglResourceRepository.bindUniformBufferBase(0, this.__indexCountToSubtractUboUid);
            this.__entitiesUidUboUid = this.__webglResourceRepository.createUniformBuffer(entityIds);
            this.__webglResourceRepository.bindUniformBufferBase(1, this.__entitiesUidUboUid);
            this.__primitiveUidUboUid = this.__webglResourceRepository.createUniformBuffer(primitiveIds);
            this.__webglResourceRepository.bindUniformBufferBase(2, this.__primitiveUidUboUid);
        };
        WebGLStrategyTransformFeedback.prototype.__setupGPUInstanceData = function () {
            var isHalfFloatMode = false;
            if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2 ||
                this.__webglResourceRepository.currentWebGLContextWrapper.isSupportWebGL1Extension(WebGLExtension.TextureHalfFloat)) {
                isHalfFloatMode = true;
            }
            var memoryManager = MemoryManager.getInstance();
            var buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
            var floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
            var halfFloatDataTextureBuffer;
            if (isHalfFloatMode) {
                halfFloatDataTextureBuffer = new Uint16Array(floatDataTextureBuffer.length);
                var convertLength = buffer.byteSizeInUse / 4; //components
                convertLength /= 2; // bytes
                for (var i = 0; i < convertLength; i++) {
                    halfFloatDataTextureBuffer[i] = MathUtil.toHalfFloat(floatDataTextureBuffer[i]);
                }
            }
            if (this.__instanceDataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                if (isHalfFloatMode) {
                    if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                        this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, floatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                            format: PixelFormat.RGBA, type: ComponentType.Float
                        });
                    }
                    else {
                        this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, halfFloatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                            format: PixelFormat.RGBA, type: ComponentType.HalfFloat
                        });
                    }
                }
                else {
                    if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                        this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, floatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                            format: PixelFormat.RGBA, type: ComponentType.Float
                        });
                    }
                    else {
                        this.__webglResourceRepository.updateTexture(this.__instanceDataTextureUid, floatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                            format: PixelFormat.RGBA, type: ComponentType.Float
                        });
                    }
                }
                return;
            }
            if (isHalfFloatMode) {
                if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                    this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                        level: 0, internalFormat: TextureParameter.RGBA16F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
                else {
                    this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(halfFloatDataTextureBuffer, {
                        level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.HalfFloat, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
            }
            else {
                if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                    this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                        level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
                else {
                    this.__instanceDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                        level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
            }
        };
        WebGLStrategyTransformFeedback.prototype.__setupGPUVertexData = function () {
            if (this.__vertexDataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                return;
            }
            var memoryManager = MemoryManager.getInstance();
            var buffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
            var floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
            if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                this.__vertexDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                    level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                    border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                    wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                });
            }
            else {
                this.__vertexDataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                    level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                    border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                    wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                });
            }
        };
        WebGLStrategyTransformFeedback.prototype.common_$prerender = function () {
            this.__setupUBOPrimitiveHeaderData();
            this.__setupGPUInstanceMetaData();
            this.__setupGPUInstanceData();
            this.__setupGPUVertexData();
        };
        WebGLStrategyTransformFeedback.prototype.attachGPUData = function () {
            {
                var gl = this.__webglResourceRepository.currentWebGLContextWrapper.getRawContext();
                var dataTexture = this.__webglResourceRepository.getWebGLResource(this.__instanceDataTextureUid);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, dataTexture);
                var shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
                var uniform_instanceDataTexture = gl.getUniformLocation(shaderProgram, 'u_instanceDataTexture');
                gl.uniform1i(uniform_instanceDataTexture, 0);
            }
            {
                var gl = this.__webglResourceRepository.currentWebGLContextWrapper.getRawContext();
                var dataTexture = this.__webglResourceRepository.getWebGLResource(this.__vertexDataTextureUid);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, dataTexture);
                var shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
                var uniform_vertexDataTexture = gl.getUniformLocation(shaderProgram, 'u_vertexDataTexture');
                gl.uniform1i(uniform_vertexDataTexture, 1);
            }
            this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'indexCountsToSubtract', 0);
            this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'entityUids', 1);
            this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'primitiveUids', 2);
            this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'primitiveHeader', 3);
        };
        WebGLStrategyTransformFeedback.prototype.attatchShaderProgram = function () {
            var shaderProgramUid = this.__shaderProgramUid;
            var glw = this.__webglResourceRepository.currentWebGLContextWrapper;
            var gl = glw.getRawContext();
            var shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid);
            gl.useProgram(shaderProgram);
        };
        WebGLStrategyTransformFeedback.prototype.attachVertexData = function (i, primitive, glw, instanceIDBufferUid) {
        };
        WebGLStrategyTransformFeedback.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new WebGLStrategyTransformFeedback();
            }
            return this.__instance;
        };
        WebGLStrategyTransformFeedback.prototype.common_$render = function () {
            return true;
        };
        return WebGLStrategyTransformFeedback;
    }());

    var WebGLStrategyDataTexture = /** @class */ (function () {
        function WebGLStrategyDataTexture() {
            this.__webglResourceRepository = WebGLResourceRepository.getInstance();
            this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__shaderProgramUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__vertexHandles = [];
            this.__isVAOSet = false;
        }
        Object.defineProperty(WebGLStrategyDataTexture.prototype, "vertexShaderMethodDefinitions_dataTexture", {
            get: function () {
                var _texture = GLSLShader.glsl_texture;
                return "\n  uniform sampler2D u_dataTexture;\n  /*\n   * This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885\n   * arg = vec2(1. / size.x, 1. / size.x / size.y);\n   */\n  // vec4 fetchElement(sampler2D tex, float index, vec2 arg)\n  // {\n  //   return " + _texture + "( tex, arg * (index + 0.5) );\n  // }\n\n  vec4 fetchElement(sampler2D tex, float index, vec2 invSize)\n  {\n    float t = (index + 0.5) * invSize.x;\n    float x = fract(t);\n    float y = (floor(t) + 0.5) * invSize.y;\n    return " + _texture + "( tex, vec2(x, y) );\n  }\n\n  mat4 getMatrix(float instanceId)\n  {\n    float index = instanceId;\n    float powWidthVal = " + MemoryManager.bufferWidthLength + ".0;\n    float powHeightVal = " + MemoryManager.bufferHeightLength + ".0;\n    vec2 arg = vec2(1.0/powWidthVal, 1.0/powHeightVal);\n  //  vec2 arg = vec2(1.0/powWidthVal, 1.0/powWidthVal/powHeightVal);\n\n    vec4 col0 = fetchElement(u_dataTexture, index * 4.0 + 0.0, arg);\n   vec4 col1 = fetchElement(u_dataTexture, index * 4.0 + 1.0, arg);\n   vec4 col2 = fetchElement(u_dataTexture, index * 4.0 + 2.0, arg);\n\n    mat4 matrix = mat4(\n      col0.x, col1.x, col2.x, 0.0,\n      col0.y, col1.y, col2.y, 0.0,\n      col0.z, col1.z, col2.z, 0.0,\n      col0.w, col1.w, col2.w, 1.0\n      );\n\n    return matrix;\n  }\n  ";
            },
            enumerable: true,
            configurable: true
        });
        WebGLStrategyDataTexture.prototype.setupShaderProgram = function () {
            if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                return;
            }
            // Shader Setup
            var vertexShader = GLSLShader.vertexShaderVariableDefinitions +
                this.vertexShaderMethodDefinitions_dataTexture +
                GLSLShader.vertexShaderBody;
            var fragmentShader = GLSLShader.fragmentShader;
            this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram({
                vertexShaderStr: vertexShader,
                fragmentShaderStr: fragmentShader,
                attributeNames: GLSLShader.attributeNames,
                attributeSemantics: GLSLShader.attributeSemantics
            });
        };
        WebGLStrategyDataTexture.prototype.__isLoaded = function (index) {
            if (this.__vertexHandles[index] != null) {
                return true;
            }
            else {
                return false;
            }
        };
        WebGLStrategyDataTexture.prototype.$load = function (meshComponent) {
            if (this.__isLoaded(0)) {
                return;
            }
            var primitiveNum = meshComponent.getPrimitiveNumber();
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = meshComponent.getPrimitiveAt(i);
                var vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
                this.__vertexHandles[i] = vertexHandles;
                WebGLStrategyDataTexture.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles);
            }
        };
        WebGLStrategyDataTexture.prototype.$prerender = function (meshComponent, instanceIDBufferUid) {
            if (this.__isVAOSet) {
                return;
            }
            var primitiveNum = meshComponent.getPrimitiveNumber();
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = meshComponent.getPrimitiveAt(i);
                // if (this.__isLoaded(i) && this.__isVAOSet) {
                this.__vertexHandles[i] = WebGLStrategyDataTexture.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUid);
                //this.__vertexShaderProgramHandles[i] = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
                //  continue;
                // }
                this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
            }
            this.__isVAOSet = true;
        };
        WebGLStrategyDataTexture.prototype.common_$prerender = function () {
            var isHalfFloatMode = false;
            if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2 ||
                this.__webglResourceRepository.currentWebGLContextWrapper.isSupportWebGL1Extension(WebGLExtension.TextureHalfFloat)) {
                isHalfFloatMode = true;
            }
            var memoryManager = MemoryManager.getInstance();
            var buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
            var floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
            var halfFloatDataTextureBuffer;
            if (isHalfFloatMode) {
                halfFloatDataTextureBuffer = new Uint16Array(floatDataTextureBuffer.length);
                var convertLength = buffer.byteSizeInUse / 4; //components
                convertLength /= 2; // bytes
                for (var i = 0; i < convertLength; i++) {
                    halfFloatDataTextureBuffer[i] = MathUtil.toHalfFloat(floatDataTextureBuffer[i]);
                }
            }
            if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                if (isHalfFloatMode) {
                    if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                            format: PixelFormat.RGBA, type: ComponentType.Float
                        });
                    }
                    else {
                        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, halfFloatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                            format: PixelFormat.RGBA, type: ComponentType.HalfFloat
                        });
                    }
                }
                else {
                    if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                            format: PixelFormat.RGBA, type: ComponentType.Float
                        });
                    }
                    else {
                        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                            format: PixelFormat.RGBA, type: ComponentType.Float
                        });
                    }
                }
                return;
            }
            if (isHalfFloatMode) {
                if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                    this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                        level: 0, internalFormat: TextureParameter.RGBA16F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
                else {
                    this.__dataTextureUid = this.__webglResourceRepository.createTexture(halfFloatDataTextureBuffer, {
                        level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.HalfFloat, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
            }
            else {
                if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                    this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                        level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
                else {
                    this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                        level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
            }
        };
        WebGLStrategyDataTexture.prototype.attachGPUData = function () {
            var gl = this.__webglResourceRepository.currentWebGLContextWrapper.getRawContext();
            var dataTexture = this.__webglResourceRepository.getWebGLResource(this.__dataTextureUid);
            gl.bindTexture(gl.TEXTURE_2D, dataTexture);
            var shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
            var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
            gl.uniform1i(uniform_dataTexture, 0);
        };
        WebGLStrategyDataTexture.prototype.attatchShaderProgram = function () {
            var shaderProgramUid = this.__shaderProgramUid;
            var glw = this.__webglResourceRepository.currentWebGLContextWrapper;
            var gl = glw.getRawContext();
            var shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid);
            gl.useProgram(shaderProgram);
        };
        WebGLStrategyDataTexture.prototype.attachVertexData = function (i, primitive, glw, instanceIDBufferUid) {
            var vaoHandles = this.__vertexHandles[i];
            var vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
            var gl = glw.getRawContext();
            if (vao != null) {
                glw.bindVertexArray(vao);
            }
            else {
                this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, instanceIDBufferUid);
                var ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            }
        };
        WebGLStrategyDataTexture.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new WebGLStrategyDataTexture();
            }
            return this.__instance;
        };
        WebGLStrategyDataTexture.prototype.common_$render = function () {
            return true;
        };
        WebGLStrategyDataTexture.__vertexHandleOfPrimitiveObjectUids = new Map();
        return WebGLStrategyDataTexture;
    }());

    var WebGLStrategyUniform = /** @class */ (function () {
        function WebGLStrategyUniform() {
            this.__webglResourceRepository = WebGLResourceRepository.getInstance();
            this.__uboUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__shaderProgramUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            this.__vertexHandles = [];
            this.__isVAOSet = false;
            this.vertexShaderMethodDefinitions_uniform = "\n  uniform mat4 worldMatrix;\n\n  mat4 getMatrix(float instanceId) {\n    return worldMatrix;\n  }\n  ";
        }
        WebGLStrategyUniform.prototype.setupShaderProgram = function () {
            if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                return;
            }
            // Shader Setup
            var vertexShader = GLSLShader.vertexShaderVariableDefinitions +
                this.vertexShaderMethodDefinitions_uniform +
                GLSLShader.vertexShaderBody;
            var fragmentShader = GLSLShader.fragmentShader;
            this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram({
                vertexShaderStr: vertexShader,
                fragmentShaderStr: fragmentShader,
                attributeNames: GLSLShader.attributeNames,
                attributeSemantics: GLSLShader.attributeSemantics
            });
            this.__shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
            var glw = this.__webglResourceRepository.currentWebGLContextWrapper;
            var gl = glw.getRawContext();
            this.__uniformLocation_worldMatrix = gl.getUniformLocation(this.__shaderProgram, 'worldMatrix');
        };
        WebGLStrategyUniform.prototype.__isLoaded = function (index) {
            if (this.__vertexHandles[index] != null) {
                return true;
            }
            else {
                return false;
            }
        };
        WebGLStrategyUniform.prototype.$load = function (meshComponent) {
            if (this.__isLoaded(0)) {
                return;
            }
            var primitiveNum = meshComponent.getPrimitiveNumber();
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = meshComponent.getPrimitiveAt(i);
                var vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
                this.__vertexHandles[i] = vertexHandles;
                WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles);
            }
        };
        WebGLStrategyUniform.prototype.$prerender = function (meshComponent, instanceIDBufferUid) {
            if (this.__isVAOSet) {
                return;
            }
            var primitiveNum = meshComponent.getPrimitiveNumber();
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = meshComponent.getPrimitiveAt(i);
                this.__vertexHandles[i] = WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUid);
                this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
            }
            this.__isVAOSet = true;
        };
        WebGLStrategyUniform.prototype.common_$prerender = function () {
        };
        WebGLStrategyUniform.prototype.attachGPUData = function () {
        };
        WebGLStrategyUniform.prototype.attatchShaderProgram = function () {
            var shaderProgramUid = this.__shaderProgramUid;
            var glw = this.__webglResourceRepository.currentWebGLContextWrapper;
            var gl = glw.getRawContext();
            gl.useProgram(this.__shaderProgram);
        };
        WebGLStrategyUniform.prototype.attachVertexData = function (i, primitive, glw, instanceIDBufferUid) {
            var vaoHandles = this.__vertexHandles[i];
            var vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
            var gl = glw.getRawContext();
            if (vao != null) {
                glw.bindVertexArray(vao);
            }
            else {
                this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, instanceIDBufferUid);
                var ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            }
        };
        WebGLStrategyUniform.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new WebGLStrategyUniform();
            }
            return this.__instance;
        };
        WebGLStrategyUniform.prototype.common_$render = function () {
            return false;
        };
        WebGLStrategyUniform.prototype.$render = function (primitive_i, primitive, worldMatrix) {
            var glw = this.__webglResourceRepository.currentWebGLContextWrapper;
            this.attatchShaderProgram();
            var gl = glw.getRawContext();
            this.attachVertexData(primitive_i, primitive, glw, CGAPIResourceRepository.InvalidCGAPIResourceUid);
            gl.uniformMatrix4fv(this.__uniformLocation_worldMatrix, false, ImmutableRowMajarMatrix44.transpose(worldMatrix).raw());
            //gl.uniformMatrix4fv(this.__uniformLocation_worldMatrix, false, ImmutableMatrix44.identity().v);
            glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0, 1);
        };
        WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids = new Map();
        return WebGLStrategyUniform;
    }());

    var getRenderingStrategy = function (processApproach) {
        // Strategy
        if (processApproach === ProcessApproach.UBOWebGL2) {
            return WebGLStrategyUBO.getInstance();
        }
        else if (processApproach === ProcessApproach.TransformFeedbackWebGL2) {
            return WebGLStrategyTransformFeedback.getInstance();
        }
        else if (processApproach === ProcessApproach.UniformWebGL1) {
            return WebGLStrategyUniform.getInstance();
        }
        else {
            return WebGLStrategyDataTexture.getInstance();
        }
    };

    var MeshRendererComponent = /** @class */ (function (_super) {
        __extends(MeshRendererComponent, _super);
        function MeshRendererComponent(entityUid, componentSid, entityComponent) {
            var _this = _super.call(this, entityUid, componentSid, entityComponent) || this;
            _this.__vertexHandles = [];
            _this.__currentProcessStage = ProcessStage.Create;
            var count = Component.__lengthOfArrayOfProcessStages.get(ProcessStage.Create);
            var array = Component.__componentsOfProcessStages.get(ProcessStage.Create);
            array[count++] = _this.componentSID;
            array[count] = Component.invalidComponentSID;
            Component.__lengthOfArrayOfProcessStages.set(ProcessStage.Create, count);
            return _this;
        }
        Object.defineProperty(MeshRendererComponent, "componentTID", {
            get: function () {
                return 4;
            },
            enumerable: true,
            configurable: true
        });
        MeshRendererComponent.prototype.__isLoaded = function (index) {
            if (this.__vertexHandles[index] != null) {
                return true;
            }
            else {
                return false;
            }
        };
        MeshRendererComponent.prototype.$create = function (_a) {
            var processApproach = _a.processApproach;
            if (this.__meshComponent != null) {
                return;
            }
            this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent.componentTID);
            this.__webglRenderingStrategy = getRenderingStrategy(processApproach);
            this.moveStageTo(ProcessStage.Load);
        };
        MeshRendererComponent.prototype.$load = function () {
            this.__webglRenderingStrategy.$load(this.__meshComponent);
            this.moveStageTo(ProcessStage.PreRender);
        };
        MeshRendererComponent.prototype.$prerender = function (_a) {
            var processApproech = _a.processApproech, instanceIDBufferUid = _a.instanceIDBufferUid;
            this.__webglRenderingStrategy.$prerender(this.__meshComponent, instanceIDBufferUid);
            if (this.__webglRenderingStrategy.$render != null) {
                this.moveStageTo(ProcessStage.Render);
            }
        };
        MeshRendererComponent.prototype.$render = function () {
            if (this.__webglRenderingStrategy.$render == null) {
                return;
            }
            var sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent.componentTID);
            var primitiveNum = this.__meshComponent.getPrimitiveNumber();
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = this.__meshComponent.getPrimitiveAt(i);
                this.__webglRenderingStrategy.$render(i, primitive, sceneGraphComponent.worldMatrix);
            }
        };
        MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids = new Map();
        return MeshRendererComponent;
    }(Component));
    ComponentRepository.registerComponentClass(MeshRendererComponent.componentTID, MeshRendererComponent);

    var WebGLRenderingPipeline = new /** @class */ (function () {
        function class_1() {
            this.__webglResourceRepository = WebGLResourceRepository.getInstance();
            this.__componentRepository = ComponentRepository.getInstance();
            this.__instanceIDBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
        }
        class_1.prototype.common_$load = function (processApproach) {
            // Strategy
            this.__webGLStrategy = getRenderingStrategy(processApproach);
            // Shader setup
            this.__webGLStrategy.setupShaderProgram();
        };
        class_1.prototype.common_$prerender = function () {
            var gl = this.__webglResourceRepository.currentWebGLContextWrapper;
            if (gl == null) {
                throw new Error('No WebGLRenderingContext!');
            }
            this.__webGLStrategy.common_$prerender();
            if (this.__isReady()) {
                return 0;
            }
            this.__instanceIDBufferUid = this.__setupInstanceIDBuffer();
            return this.__instanceIDBufferUid;
        };
        class_1.prototype.__isReady = function () {
            if (this.__instanceIDBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                return true;
            }
            else {
                return false;
            }
        };
        class_1.prototype.__setupInstanceIDBuffer = function () {
            if (this.__instanceIdAccessor == null) {
                var buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
                var count = Config.maxEntityNumber;
                var bufferView = buffer.takeBufferView({ byteLengthToNeed: 4 /*byte*/ * count, byteStride: 0, isAoS: false });
                this.__instanceIdAccessor = bufferView.takeAccessor({ compositionType: CompositionType.Scalar, componentType: ComponentType.Float, count: count });
            }
            var meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
            if (meshComponents == null) {
                return CGAPIResourceRepository.InvalidCGAPIResourceUid;
            }
            for (var i = 0; i < meshComponents.length; i++) {
                this.__instanceIdAccessor.setScalar(i, meshComponents[i].entityUID);
            }
            return this.__webglResourceRepository.createVertexBuffer(this.__instanceIdAccessor);
        };
        class_1.prototype.common_$render = function () {
            if (!this.__webGLStrategy.common_$render()) {
                return;
            }
            var meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
            var meshComponent = meshComponents[0];
            var primitiveNum = meshComponent.getPrimitiveNumber();
            var glw = this.__webglResourceRepository.currentWebGLContextWrapper;
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = meshComponent.getPrimitiveAt(i);
                this.__webGLStrategy.attachVertexData(i, primitive, glw, this.__instanceIDBufferUid);
                this.__webGLStrategy.attatchShaderProgram();
                this.__webGLStrategy.attachGPUData();
                var meshComponents_1 = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
                glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0, meshComponents_1.length);
            }
        };
        return class_1;
    }());

    var System = /** @class */ (function () {
        function System() {
            this.__processStages = [
                ProcessStage.Create,
                ProcessStage.Load,
                ProcessStage.Mount,
                ProcessStage.Logic,
                ProcessStage.PreRender,
                ProcessStage.Render,
                ProcessStage.Unmount,
                ProcessStage.Discard
            ];
            this.__componentRepository = ComponentRepository.getInstance();
            this.__renderingPipeline = WebGLRenderingPipeline;
            this.__processApproach = ProcessApproach.None;
        }
        System.prototype.process = function () {
            var _this = this;
            if (this.__processApproach === ProcessApproach.None) {
                throw new Error('Choose a process approach first.');
            }
            this.__processStages.forEach(function (stage) {
                var methodName = stage.getMethodName();
                var instanceIDBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
                var componentTids = _this.__componentRepository.getComponentTIDs();
                var commonMethod = _this.__renderingPipeline['common_' + methodName];
                if (commonMethod != null) {
                    instanceIDBufferUid = commonMethod.call(_this.__renderingPipeline, _this.__processApproach);
                }
                componentTids.forEach(function (componentTid) {
                    var componentClass = ComponentRepository.getComponentClass(componentTid);
                    componentClass.updateComponentsOfEachProcessStage(componentTid, stage, _this.__componentRepository);
                    componentClass.process({
                        componentTid: componentTid,
                        processStage: stage,
                        instanceIDBufferUid: instanceIDBufferUid,
                        processApproach: _this.__processApproach,
                        componentRepository: _this.__componentRepository
                    });
                });
            });
        };
        System.prototype.setProcessApproachAndCanvas = function (approach, canvas) {
            var repo = WebGLResourceRepository.getInstance();
            var gl;
            if (approach === ProcessApproach.DataTextureWebGL2 ||
                approach === ProcessApproach.UBOWebGL2 ||
                approach === ProcessApproach.TransformFeedbackWebGL2) {
                gl = canvas.getContext('webgl2');
            }
            else {
                gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            }
            repo.addWebGLContext(gl, true);
            this.__processApproach = approach;
            return gl;
        };
        Object.defineProperty(System.prototype, "processApproach", {
            get: function () {
                return this.__processApproach;
            },
            enumerable: true,
            configurable: true
        });
        System.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new System();
            }
            return this.__instance;
        };
        return System;
    }());

    var MutableVector3 = /** @class */ (function (_super) {
        __extends(MutableVector3, _super);
        function MutableVector3(x, y, z) {
            return _super.call(this, x, y, z) || this;
        }
        MutableVector3.prototype.zero = function () {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            return this;
        };
        MutableVector3.prototype.one = function () {
            this.x = 1;
            this.y = 1;
            this.z = 1;
            return this;
        };
        /**
         * to square length
         */
        MutableVector3.prototype.lengthSquared = function () {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        };
        /**
         * cross product
         */
        MutableVector3.prototype.cross = function (v) {
            var x = this.y * v.z - this.z * v.y;
            var y = this.z * v.x - this.x * v.z;
            var z = this.x * v.y - this.y * v.x;
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        };
        /**
       * normalize
       */
        MutableVector3.prototype.normalize = function () {
            var length = this.length();
            this.divide(length);
            return this;
        };
        /**
       * add value
       */
        MutableVector3.prototype.add = function (v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        };
        /**
       * subtract
       */
        MutableVector3.prototype.subtract = function (v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            return this;
        };
        /**
         * divide
         */
        MutableVector3.prototype.divide = function (val) {
            if (val !== 0) {
                this.x /= val;
                this.y /= val;
                this.z /= val;
            }
            else {
                console.error("0 division occured!");
                this.x = Infinity;
                this.y = Infinity;
                this.z = Infinity;
            }
            return this;
        };
        /**
         * multiply
         */
        MutableVector3.prototype.multiply = function (val) {
            this.x *= val;
            this.y *= val;
            this.z *= val;
            return this;
        };
        /**
         * multiply vector
         */
        MutableVector3.prototype.multiplyVector = function (vec) {
            this.x *= vec.x;
            this.y *= vec.y;
            this.z *= vec.z;
            return this;
        };
        /**
       * divide vector
       */
        MutableVector3.prototype.divideVector = function (vec3) {
            this.x /= vec3.x;
            this.y /= vec3.y;
            this.z /= vec3.z;
            return this;
        };
        Object.defineProperty(MutableVector3.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableVector3.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableVector3.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            set: function (z) {
                this.v[2] = z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableVector3.prototype, "raw", {
            get: function () {
                return this.v;
            },
            enumerable: true,
            configurable: true
        });
        return MutableVector3;
    }(ImmutableVector3));

    var MutableVector4 = /** @class */ (function (_super) {
        __extends(MutableVector4, _super);
        function MutableVector4(x, y, z, w) {
            return _super.call(this, x, y, z, w) || this;
        }
        MutableVector4.prototype.normalize = function () {
            var length = this.length();
            this.divide(length);
            return this;
        };
        /**
         * add value
         */
        MutableVector4.prototype.add = function (v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            this.w += v.w;
            return this;
        };
        /**
       * add value except w component
       */
        MutableVector4.prototype.addWithOutW = function (v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        };
        MutableVector4.prototype.subtract = function (v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            this.w -= v.w;
            return this;
        };
        MutableVector4.prototype.multiply = function (val) {
            this.x *= val;
            this.y *= val;
            this.z *= val;
            this.w *= val;
            return this;
        };
        MutableVector4.prototype.multiplyVector = function (vec) {
            this.x *= vec.x;
            this.y *= vec.y;
            this.z *= vec.z;
            this.w *= vec.w;
            return this;
        };
        MutableVector4.prototype.divide = function (val) {
            if (val !== 0) {
                this.x /= val;
                this.y /= val;
                this.z /= val;
                this.w /= val;
            }
            else {
                console.error("0 division occured!");
                this.x = Infinity;
                this.y = Infinity;
                this.z = Infinity;
                this.w = Infinity;
            }
            return this;
        };
        MutableVector4.prototype.divideVector = function (vec4) {
            this.x /= vec4.x;
            this.y /= vec4.y;
            this.z /= vec4.z;
            this.w /= vec4.w;
            return this;
        };
        Object.defineProperty(MutableVector4.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableVector4.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableVector4.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            set: function (z) {
                this.v[2] = z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableVector4.prototype, "w", {
            get: function () {
                return this.v[3];
            },
            set: function (w) {
                this.v[3] = w;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MutableVector4.prototype, "raw", {
            get: function () {
                return this.v;
            },
            enumerable: true,
            configurable: true
        });
        // set w(w:number) {
        //   this.__Error();
        // }
        // get w(): number {
        //   return this.v[3];
        // }
        // get raw(): TypedArray {
        //   this.__Error();
        //   return new Float32Array(0);
        // }
        MutableVector4.prototype.__Error = function () {
            //console.error('Not avavailabe because this Vector class is immutable.');
            throw new Error('Not avavailabe because this Vector class is immutable.');
        };
        return MutableVector4;
    }(ImmutableVector4));

    var DataUtil = /** @class */ (function () {
        function DataUtil() {
        }
        DataUtil.isNode = function () {
            var isNode = (window === void 0 && typeof process !== "undefined" && typeof require !== "undefined");
            return isNode;
        };
        DataUtil.btoa = function (str) {
            var isNode = DataUtil.isNode();
            if (isNode) {
                var buffer = void 0;
                if (Buffer.isBuffer(str)) {
                    buffer = str;
                }
                else {
                    buffer = new Buffer(str.toString(), 'binary');
                }
                return buffer.toString('base64');
            }
            else {
                return btoa(str);
            }
        };
        DataUtil.atob = function (str) {
            var isNode = DataUtil.isNode();
            if (isNode) {
                return new Buffer(str, 'base64').toString('binary');
            }
            else {
                return atob(str);
            }
        };
        DataUtil.base64ToArrayBuffer = function (dataUri) {
            var splittedDataUri = dataUri.split(',');
            var type = splittedDataUri[0].split(':')[1].split(';')[0];
            var byteString = DataUtil.atob(splittedDataUri[1]);
            var byteStringLength = byteString.length;
            var arrayBuffer = new ArrayBuffer(byteStringLength);
            var uint8Array = new Uint8Array(arrayBuffer);
            for (var i = 0; i < byteStringLength; i++) {
                uint8Array[i] = byteString.charCodeAt(i);
            }
            return arrayBuffer;
        };
        DataUtil.arrayBufferToString = function (arrayBuffer) {
            if (typeof TextDecoder !== 'undefined') {
                var textDecoder = new TextDecoder();
                return textDecoder.decode(arrayBuffer);
            }
            else {
                var bytes = new Uint8Array(arrayBuffer);
                var result = "";
                var length_1 = bytes.length;
                for (var i = 0; i < length_1; i++) {
                    result += String.fromCharCode(bytes[i]);
                }
                return result;
            }
        };
        DataUtil.stringToBase64 = function (str) {
            var b64 = null;
            b64 = DataUtil.btoa(str);
            return b64;
        };
        DataUtil.UInt8ArrayToDataURL = function (uint8array, width, height) {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");
            var imageData = ctx.createImageData(width, height);
            for (var i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i + 0] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 0];
                imageData.data[i + 1] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 1];
                imageData.data[i + 2] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 2];
                imageData.data[i + 3] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 3];
            }
            ctx.putImageData(imageData, 0, 0);
            canvas.remove();
            return canvas.toDataURL("image/png");
        };
        DataUtil.loadResourceAsync = function (resourceUri, isBinary, resolveCallback, rejectCallback) {
            return new Promise(function (resolve, reject) {
                var isNode = DataUtil.isNode();
                if (isNode) {
                    var fs = require('fs');
                    var args = [resourceUri];
                    var func = function (err, response) {
                        if (err) {
                            if (rejectCallback) {
                                rejectCallback(reject, err);
                            }
                            return;
                        }
                        if (isBinary) {
                            var buffer = new Buffer(response, 'binary');
                            var uint8Buffer = new Uint8Array(buffer);
                            response = uint8Buffer.buffer;
                        }
                        resolveCallback(resolve, response);
                    };
                    if (isBinary) {
                        args.push(func);
                    }
                    else {
                        args.push('utf8');
                        args.push(func);
                    }
                    fs.readFile.apply(fs, args);
                }
                else {
                    var xmlHttp_1 = new XMLHttpRequest();
                    if (isBinary) {
                        xmlHttp_1.responseType = "arraybuffer";
                        xmlHttp_1.onload = function (oEvent) {
                            var response = null;
                            if (isBinary) {
                                response = xmlHttp_1.response;
                            }
                            else {
                                response = xmlHttp_1.responseText;
                            }
                            resolveCallback(resolve, response);
                        };
                    }
                    else {
                        xmlHttp_1.onreadystatechange = function () {
                            if (xmlHttp_1.readyState === 4 && (Math.floor(xmlHttp_1.status / 100) === 2 || xmlHttp_1.status === 0)) {
                                var response = null;
                                if (isBinary) {
                                    response = xmlHttp_1.response;
                                }
                                else {
                                    response = xmlHttp_1.responseText;
                                }
                                resolveCallback(resolve, response);
                            }
                            else {
                                if (rejectCallback) {
                                    rejectCallback(reject, xmlHttp_1.status);
                                }
                            }
                        };
                    }
                    xmlHttp_1.open("GET", resourceUri, true);
                    xmlHttp_1.send(null);
                }
            });
        };
        return DataUtil;
    }());

    var Gltf2Importer = /** @class */ (function () {
        function Gltf2Importer() {
        }
        Gltf2Importer.prototype.import = function (uri, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(this, void 0, void 0, function () {
                var defaultOptions, response, arrayBuffer, dataView, isLittleEndian, magic, result, gotText, json;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            defaultOptions = {
                                files: {
                                //        "foo.gltf": content of file as ArrayBuffer,
                                //        "foo.bin": content of file as ArrayBuffer,
                                //        "boo.png": content of file as ArrayBuffer
                                },
                                loaderExtension: null,
                                defaultShaderClass: null,
                                statesOfElements: [
                                    {
                                        targets: [],
                                        states: {
                                            enable: [
                                            // 3042,  // BLEND
                                            ],
                                            functions: {
                                            //"blendFuncSeparate": [1, 0, 1, 0],
                                            }
                                        },
                                        isTransparent: true,
                                        opacity: 1.0,
                                        isTextureImageToLoadPreMultipliedAlpha: false,
                                    }
                                ],
                                extendedJson: null //   URI string / JSON Object / ArrayBuffer
                            };
                            return [4 /*yield*/, fetch(uri)];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, response.arrayBuffer()];
                        case 2:
                            arrayBuffer = _a.sent();
                            dataView = new DataView(arrayBuffer, 0, 20);
                            isLittleEndian = true;
                            magic = dataView.getUint32(0, isLittleEndian);
                            if (!(magic !== 0x46546C67)) return [3 /*break*/, 4];
                            gotText = DataUtil.arrayBufferToString(arrayBuffer);
                            json = JSON.parse(gotText);
                            return [4 /*yield*/, this._loadAsTextJson(json, uri, options, defaultOptions)];
                        case 3:
                            result = _a.sent();
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/, result];
                    }
                });
            });
        };
        Gltf2Importer.prototype._getOptions = function (defaultOptions, json, options) {
            if (json.asset && json.asset.extras && json.asset.extras.loadOptions) {
                for (var optionName in json.asset.extras.loadOptions) {
                    defaultOptions[optionName] = json.asset.extras.loadOptions[optionName];
                }
            }
            for (var optionName in options) {
                defaultOptions[optionName] = options[optionName];
            }
            return defaultOptions;
        };
        Gltf2Importer.prototype._loadAsTextJson = function (gltfJson, uri, options, defaultOptions) {
            return __awaiter(this, void 0, void 0, function () {
                var basePath, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (uri) {
                                //Set the location of gltf file as basePath
                                basePath = uri.substring(0, uri.lastIndexOf('/')) + '/';
                            }
                            if (gltfJson.asset.extras === undefined) {
                                gltfJson.asset.extras = {};
                            }
                            options = this._getOptions(defaultOptions, gltfJson, options);
                            this._mergeExtendedJson(gltfJson, options.extendedJson);
                            gltfJson.asset.extras.basePath = basePath;
                            return [4 /*yield*/, this._loadInner(undefined, basePath, gltfJson, options)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, result[0][0]];
                    }
                });
            });
        };
        Gltf2Importer.prototype._loadInner = function (arrayBufferBinary, basePath, gltfJson, options) {
            var _this = this;
            var promises = [];
            var resources = {
                shaders: [],
                buffers: [],
                images: []
            };
            promises.push(this._loadResources(arrayBufferBinary, basePath, gltfJson, options, resources));
            promises.push(new Promise(function (resolve, reject) {
                _this._loadJsonContent(gltfJson, options);
                resolve();
            }));
            return Promise.all(promises);
        };
        Gltf2Importer.prototype._loadJsonContent = function (gltfJson, options) {
            // Scene
            this._loadDependenciesOfScenes(gltfJson);
            // Node
            this._loadDependenciesOfNodes(gltfJson);
            // Node Transformation
            //    this._loadTransformationsOfNodes(gltfJson);
            // Mesh
            this._loadDependenciesOfMeshes(gltfJson);
            // Material
            this._loadDependenciesOfMaterials(gltfJson);
            // Texture
            this._loadDependenciesOfTextures(gltfJson);
            // Joint
            this._loadDependenciesOfJoints(gltfJson);
            // Animation
            this._loadDependenciesOfAnimations(gltfJson);
            // Accessor
            this._loadDependenciesOfAccessors(gltfJson);
            // BufferView
            this._loadDependenciesOfBufferViews(gltfJson);
            if (gltfJson.asset === void 0) {
                gltfJson.asset = {};
            }
            if (gltfJson.asset.extras === void 0) {
                gltfJson.asset.extras = {};
            }
        };
        Gltf2Importer.prototype._loadDependenciesOfScenes = function (gltfJson) {
            var e_1, _a;
            try {
                for (var _b = __values(gltfJson.scenes), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var scene = _c.value;
                    scene.nodesIndices = scene.nodes.concat();
                    for (var i in scene.nodesIndices) {
                        scene.nodes[i] = gltfJson.nodes[scene.nodes[i]];
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        Gltf2Importer.prototype._loadDependenciesOfNodes = function (gltfJson) {
            var e_2, _a;
            try {
                for (var _b = __values(gltfJson.nodes), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var node = _c.value;
                    // Hierarchy
                    if (node.children) {
                        node.childrenIndices = node.children.concat();
                        node.children = [];
                        for (var i in node.childrenIndices) {
                            node.children[i] = gltfJson.nodes[node.childrenIndices[i]];
                        }
                    }
                    // Mesh
                    if (node.mesh !== void 0 && gltfJson.meshes !== void 0) {
                        node.meshIndex = node.mesh;
                        node.mesh = gltfJson.meshes[node.meshIndex];
                    }
                    // Skin
                    if (node.skin !== void 0 && gltfJson.skins !== void 0) {
                        node.skinIndex = node.skin;
                        node.skin = gltfJson.skins[node.skinIndex];
                        if (node.mesh.extras === void 0) {
                            node.mesh.extras = {};
                        }
                        node.mesh.extras._skin = node.skin;
                    }
                    // Camera
                    if (node.camera !== void 0 && gltfJson.cameras !== void 0) {
                        node.cameraIndex = node.camera;
                        node.camera = gltfJson.cameras[node.cameraIndex];
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        };
        Gltf2Importer.prototype._loadDependenciesOfMeshes = function (gltfJson) {
            var e_3, _a, e_4, _b;
            try {
                // Mesh
                for (var _c = __values(gltfJson.meshes), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var mesh = _d.value;
                    try {
                        for (var _e = __values(mesh.primitives), _f = _e.next(); !_f.done; _f = _e.next()) {
                            var primitive = _f.value;
                            if (primitive.material !== void 0) {
                                primitive.materialIndex = primitive.material;
                                primitive.material = gltfJson.materials[primitive.materialIndex];
                            }
                            primitive.attributesindex = Object.assign({}, primitive.attributes);
                            for (var attributeName in primitive.attributesindex) {
                                if (primitive.attributesindex[attributeName] >= 0) {
                                    var accessor = gltfJson.accessors[primitive.attributesindex[attributeName]];
                                    accessor.extras = {
                                        toGetAsTypedArray: true,
                                        attributeName: attributeName
                                    };
                                    primitive.attributes[attributeName] = accessor;
                                }
                                else {
                                    primitive.attributes[attributeName] = void 0;
                                }
                            }
                            if (primitive.indices !== void 0) {
                                primitive.indicesIndex = primitive.indices;
                                primitive.indices = gltfJson.accessors[primitive.indicesIndex];
                            }
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_3) throw e_3.error; }
            }
        };
        Gltf2Importer.prototype._loadDependenciesOfMaterials = function (gltfJson) {
            var e_5, _a;
            // Material
            if (gltfJson.materials) {
                try {
                    for (var _b = __values(gltfJson.materials), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var material = _c.value;
                        if (material.pbrMetallicRoughness) {
                            var baseColorTexture = material.pbrMetallicRoughness.baseColorTexture;
                            if (baseColorTexture !== void 0) {
                                baseColorTexture.texture = gltfJson.textures[baseColorTexture.index];
                            }
                            var metallicRoughnessTexture = material.pbrMetallicRoughness.metallicRoughnessTexture;
                            if (metallicRoughnessTexture !== void 0) {
                                metallicRoughnessTexture.texture = gltfJson.textures[metallicRoughnessTexture.index];
                            }
                        }
                        var normalTexture = material.normalTexture;
                        if (normalTexture !== void 0) {
                            normalTexture.texture = gltfJson.textures[normalTexture.index];
                        }
                        var occlusionTexture = material.occlusionTexture;
                        if (occlusionTexture !== void 0) {
                            occlusionTexture.texture = gltfJson.textures[occlusionTexture.index];
                        }
                        var emissiveTexture = material.emissiveTexture;
                        if (emissiveTexture !== void 0) {
                            emissiveTexture.texture = gltfJson.textures[emissiveTexture.index];
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
            }
        };
        Gltf2Importer.prototype._loadDependenciesOfTextures = function (gltfJson) {
            var e_6, _a;
            // Texture
            if (gltfJson.textures) {
                try {
                    for (var _b = __values(gltfJson.textures), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var texture = _c.value;
                        if (texture.sampler !== void 0) {
                            texture.samplerIndex = texture.sampler;
                            texture.sampler = gltfJson.samplers[texture.samplerIndex];
                        }
                        if (texture.source !== void 0) {
                            texture.sourceIndex = texture.source;
                            texture.image = gltfJson.images[texture.sourceIndex];
                        }
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            }
        };
        Gltf2Importer.prototype._loadDependenciesOfJoints = function (gltfJson) {
            var e_7, _a, e_8, _b;
            if (gltfJson.skins) {
                try {
                    for (var _c = __values(gltfJson.skins), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var skin = _d.value;
                        skin.skeletonIndex = skin.skeleton;
                        skin.skeleton = gltfJson.nodes[skin.skeletonIndex];
                        skin.inverseBindMatricesIndex = skin.inverseBindMatrices;
                        skin.inverseBindMatrices = gltfJson.accessors[skin.inverseBindMatricesIndex];
                        skin.jointsIndices = skin.joints;
                        skin.joints = [];
                        try {
                            for (var _e = __values(skin.jointsIndices), _f = _e.next(); !_f.done; _f = _e.next()) {
                                var jointIndex = _f.value;
                                skin.joints.push(gltfJson.nodes[jointIndex]);
                            }
                        }
                        catch (e_8_1) { e_8 = { error: e_8_1 }; }
                        finally {
                            try {
                                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                            }
                            finally { if (e_8) throw e_8.error; }
                        }
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            }
        };
        Gltf2Importer.prototype._loadDependenciesOfAnimations = function (gltfJson) {
            var e_9, _a, e_10, _b, e_11, _c;
            if (gltfJson.animations) {
                try {
                    for (var _d = __values(gltfJson.animations), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var animation = _e.value;
                        try {
                            for (var _f = __values(animation.channels), _g = _f.next(); !_g.done; _g = _f.next()) {
                                var channel = _g.value;
                                channel.samplerIndex = channel.sampler;
                                channel.sampler = animation.samplers[channel.samplerIndex];
                                channel.target.nodeIndex = channel.target.node;
                                channel.target.node = gltfJson.nodes[channel.target.nodeIndex];
                            }
                        }
                        catch (e_10_1) { e_10 = { error: e_10_1 }; }
                        finally {
                            try {
                                if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                            }
                            finally { if (e_10) throw e_10.error; }
                        }
                        try {
                            for (var _h = __values(animation.channels), _j = _h.next(); !_j.done; _j = _h.next()) {
                                var channel = _j.value;
                                channel.sampler.inputIndex = channel.sampler.input;
                                channel.sampler.outputIndex = channel.sampler.output;
                                channel.sampler.input = gltfJson.accessors[channel.sampler.inputIndex];
                                channel.sampler.output = gltfJson.accessors[channel.sampler.outputIndex];
                                if (channel.target.path === 'rotation') {
                                    if (channel.sampler.output.extras === void 0) {
                                        channel.sampler.output.extras = {};
                                    }
                                    channel.sampler.output.extras.quaternionIfVec4 = true;
                                }
                            }
                        }
                        catch (e_11_1) { e_11 = { error: e_11_1 }; }
                        finally {
                            try {
                                if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                            }
                            finally { if (e_11) throw e_11.error; }
                        }
                    }
                }
                catch (e_9_1) { e_9 = { error: e_9_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                    }
                    finally { if (e_9) throw e_9.error; }
                }
            }
        };
        Gltf2Importer.prototype._loadDependenciesOfAccessors = function (gltfJson) {
            var e_12, _a;
            try {
                // Accessor
                for (var _b = __values(gltfJson.accessors), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var accessor = _c.value;
                    if (accessor.bufferView !== void 0) {
                        accessor.bufferViewIndex = accessor.bufferView;
                        accessor.bufferView = gltfJson.bufferViews[accessor.bufferViewIndex];
                    }
                }
            }
            catch (e_12_1) { e_12 = { error: e_12_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_12) throw e_12.error; }
            }
        };
        Gltf2Importer.prototype._loadDependenciesOfBufferViews = function (gltfJson) {
            var e_13, _a;
            try {
                // BufferView
                for (var _b = __values(gltfJson.bufferViews), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var bufferView = _c.value;
                    if (bufferView.buffer !== void 0) {
                        bufferView.bufferIndex = bufferView.buffer;
                        bufferView.buffer = gltfJson.buffers[bufferView.bufferIndex];
                    }
                }
            }
            catch (e_13_1) { e_13 = { error: e_13_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_13) throw e_13.error; }
            }
        };
        Gltf2Importer.prototype._mergeExtendedJson = function (gltfJson, extendedData) {
            var extendedJson = null;
            if (extendedData instanceof ArrayBuffer) {
                var extendedJsonStr = DataUtil.arrayBufferToString(extendedData);
                extendedJson = JSON.parse(extendedJsonStr);
            }
            else if (typeof extendedData === 'string') {
                extendedJson = JSON.parse(extendedData);
                extendedJson = extendedJson;
            }
            else if (typeof extendedData === 'object') {
                extendedJson = extendedData;
            }
            Object.assign(gltfJson, extendedJson);
        };
        Gltf2Importer.prototype._loadResources = function (arrayBufferBinary, basePath, gltfJson, options, resources) {
            var _this = this;
            var promisesToLoadResources = [];
            var _loop_1 = function (i) {
                var bufferInfo = gltfJson.buffers[i];
                var splitted = void 0;
                var filename;
                if (bufferInfo.uri) {
                    splitted = bufferInfo.uri.split('/');
                    filename = splitted[splitted.length - 1];
                }
                if (typeof bufferInfo.uri === 'undefined') {
                    promisesToLoadResources.push(new Promise(function (resolve, rejected) {
                        resources.buffers[i] = arrayBufferBinary;
                        bufferInfo.buffer = arrayBufferBinary;
                        resolve(gltfJson);
                    }));
                }
                else if (bufferInfo.uri.match(/^data:application\/(.*);base64,/)) {
                    promisesToLoadResources.push(new Promise(function (resolve, rejected) {
                        var arrayBuffer = DataUtil.base64ToArrayBuffer(bufferInfo.uri);
                        resources.buffers[i] = arrayBuffer;
                        bufferInfo.buffer = arrayBuffer;
                        resolve(gltfJson);
                    }));
                }
                else if (options.files && options.files[filename]) {
                    promisesToLoadResources.push(new Promise(function (resolve, rejected) {
                        var arrayBuffer = options.files[filename];
                        resources.buffers[i] = arrayBuffer;
                        bufferInfo.buffer = arrayBuffer;
                        resolve(gltfJson);
                    }));
                }
                else {
                    promisesToLoadResources.push(DataUtil.loadResourceAsync(basePath + bufferInfo.uri, true, function (resolve, response) {
                        resources.buffers[i] = response;
                        bufferInfo.buffer = response;
                        resolve(gltfJson);
                    }, function (reject, error) {
                    }));
                }
            };
            // Shaders Async load
            // for (let _i in gltfJson.shaders) {
            //   const i = _i as any as number;
            //   resources.shaders[i] = {};
            //   let shaderJson = gltfJson.shaders[i];
            //   let shaderType = shaderJson.type;
            //   if (typeof shaderJson.extensions !== 'undefined' && typeof shaderJson.extensions.KHR_binary_glTF !== 'undefined') {
            //     resources.shaders[i].shaderText = this._accessBinaryAsShader(shaderJson.extensions.KHR_binary_glTF.bufferView, gltfJson, arrayBufferBinary);
            //     resources.shaders[i].shaderType = shaderType;
            //     continue;
            //   }
            //   let shaderUri = shaderJson.uri;
            //   if (options.files) {
            //     const splitted = shaderUri.split('/');
            //     const filename = splitted[splitted.length - 1];
            //     if (options.files[filename]) {
            //       const arrayBuffer = options.files[filename];
            //       resources.shaders[i].shaderText = DataUtil.arrayBufferToString(arrayBuffer);
            //       resources.shaders[i].shaderType = shaderType;
            //       continue;
            //     }
            //   }
            //   if (shaderUri.match(/^data:/)) {
            //     promisesToLoadResources.push(
            //       new Promise((resolve, rejected) => {
            //         let arrayBuffer = DataUtil.base64ToArrayBuffer(shaderUri);
            //         resources.shaders[i].shaderText = DataUtil.arrayBufferToString(arrayBuffer);
            //         resources.shaders[i].shaderType = shaderType;
            //         resolve();
            //       })
            //     );
            //   } else {
            //     shaderUri = basePath + shaderUri;
            //     promisesToLoadResources.push(
            //       DataUtil.loadResourceAsync(shaderUri, false,
            //         (resolve:Function, response:any)=>{
            //           resources.shaders[i].shaderText = response;
            //           resources.shaders[i].shaderType = shaderType;
            //           resolve(gltfJson);
            //         },
            //         (reject:Function, error:any)=>{
            //         }
            //       )
            //     );
            //   }
            // }
            // Buffers Async load
            for (var i in gltfJson.buffers) {
                _loop_1(i);
            }
            var _loop_2 = function (_i) {
                var i = _i;
                var imageJson = gltfJson.images[i];
                //let imageJson = gltfJson.images[textureJson.source];
                //let samplerJson = gltfJson.samplers[textureJson.sampler];
                var imageUri;
                if (typeof imageJson.uri === 'undefined') {
                    imageUri = this_1._accessBinaryAsImage(imageJson.bufferView, gltfJson, arrayBufferBinary, imageJson.mimeType);
                }
                else {
                    var imageFileStr = imageJson.uri;
                    var splitted = imageFileStr.split('/');
                    var filename = splitted[splitted.length - 1];
                    if (options.files && options.files[filename]) {
                        var arrayBuffer = options.files[filename];
                        var splitted_1 = filename.split('.');
                        var fileExtension = splitted_1[splitted_1.length - 1];
                        imageUri = this_1._accessArrayBufferAsImage(arrayBuffer, fileExtension);
                    }
                    else if (imageFileStr.match(/^data:/)) {
                        imageUri = imageFileStr;
                    }
                    else {
                        imageUri = basePath + imageFileStr;
                    }
                }
                // if (options.extensionLoader && options.extensionLoader.setUVTransformToTexture) {
                //   options.extensionLoader.setUVTransformToTexture(texture, samplerJson);
                // }
                promisesToLoadResources.push(new Promise(function (resolve, reject) {
                    var img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = imageUri;
                    imageJson.image = img;
                    if (imageUri.match(/^data:/)) {
                        resolve(gltfJson);
                    }
                    else {
                        var load_1 = function (img, response) {
                            var bytes = new Uint8Array(response);
                            var binaryData = "";
                            for (var i = 0, len = bytes.byteLength; i < len; i++) {
                                binaryData += String.fromCharCode(bytes[i]);
                            }
                            var split = imageUri.split('.');
                            var ext = split[split.length - 1];
                            img.src = _this._getImageType(ext) + window.btoa(binaryData);
                            img.onload = function () {
                                resolve(gltfJson);
                            };
                        };
                        var loadBinaryImage = function () {
                            var xhr = new XMLHttpRequest();
                            xhr.onreadystatechange = (function (_img) {
                                return function () {
                                    if (xhr.readyState == 4 && xhr.status == 200) {
                                        load_1(_img, xhr.response);
                                    }
                                };
                            })(img);
                            xhr.open('GET', imageUri);
                            xhr.responseType = 'arraybuffer';
                            xhr.send();
                        };
                        loadBinaryImage();
                    }
                    resources.images[i] = img;
                }));
            };
            var this_1 = this;
            // Textures Async load
            for (var _i in gltfJson.images) {
                _loop_2(_i);
            }
            return Promise.all(promisesToLoadResources);
        };
        Gltf2Importer.prototype._accessBinaryAsImage = function (bufferViewStr, json, arrayBuffer, mimeType) {
            var arrayBufferSliced = this._sliceBufferViewToArrayBuffer(json, bufferViewStr, arrayBuffer);
            return this._accessArrayBufferAsImage(arrayBufferSliced, mimeType);
        };
        Gltf2Importer.prototype._sliceBufferViewToArrayBuffer = function (json, bufferViewStr, arrayBuffer) {
            var bufferViewJson = json.bufferViews[bufferViewStr];
            var byteOffset = (bufferViewJson.byteOffset != null) ? bufferViewJson.byteOffset : 0;
            var byteLength = bufferViewJson.byteLength;
            var arrayBufferSliced = arrayBuffer.slice(byteOffset, byteOffset + byteLength);
            return arrayBufferSliced;
        };
        Gltf2Importer.prototype._accessArrayBufferAsImage = function (arrayBuffer, imageType) {
            var bytes = new Uint8Array(arrayBuffer);
            var binaryData = '';
            for (var i = 0, len = bytes.byteLength; i < len; i++) {
                binaryData += String.fromCharCode(bytes[i]);
            }
            var imgSrc = this._getImageType(imageType);
            var dataUrl = imgSrc + DataUtil.btoa(binaryData);
            return dataUrl;
        };
        Gltf2Importer.prototype._getImageType = function (imageType) {
            var imgSrc = null;
            if (imageType === 'image/jpeg' || imageType.toLowerCase() === 'jpg' || imageType.toLowerCase() === 'jpeg') {
                imgSrc = "data:image/jpeg;base64,";
            }
            else if (imageType == 'image/png' || imageType.toLowerCase() === 'png') {
                imgSrc = "data:image/png;base64,";
            }
            else if (imageType == 'image/gif' || imageType.toLowerCase() === 'gif') {
                imgSrc = "data:image/gif;base64,";
            }
            else if (imageType == 'image/bmp' || imageType.toLowerCase() === 'bmp') {
                imgSrc = "data:image/bmp;base64,";
            }
            else {
                imgSrc = "data:image/unknown;base64,";
            }
            return imgSrc;
        };
        Gltf2Importer.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new Gltf2Importer();
            }
            return this.__instance;
        };
        return Gltf2Importer;
    }());

    /**
     * A converter class from glTF2 model to Rhodonite Native data
     */
    var ModelConverter = /** @class */ (function () {
        function ModelConverter() {
        }
        /**
         * The static method to get singleton instance of this class.
         * @return The singleton instance of ModelConverter class
         */
        ModelConverter.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new ModelConverter();
            }
            return this.__instance;
        };
        ModelConverter.prototype._getDefaultShader = function (options) {
            var defaultShader = null;
            // if (options && typeof options.defaultShaderClass !== "undefined") {
            //   if (typeof options.defaultShaderClass === "string") {
            //     defaultShader = GLBoost[options.defaultShaderClass];
            //   } else {
            //     defaultShader = options.defaultShaderClass;
            //   }
            // }
            return defaultShader;
        };
        ModelConverter.prototype.__generateGroupEntity = function () {
            var repo = EntityRepository.getInstance();
            var entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID]);
            return entity;
        };
        ModelConverter.prototype.__generateMeshEntity = function () {
            var repo = EntityRepository.getInstance();
            var entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID,
                MeshComponent.componentTID, MeshRendererComponent.componentTID]);
            return entity;
        };
        ModelConverter.prototype.convertToRhodoniteObject = function (gltfModel) {
            // load binary data
            // for (let accessor of gltfModel.accessors) {
            //   this._accessBinaryWithAccessor(accessor);
            // }
            var e_1, _a, e_2, _b;
            var rnBuffer = this.createRnBuffer(gltfModel);
            // Mesh data
            var meshEntities = this._setupMesh(gltfModel, rnBuffer);
            var groups = [];
            try {
                for (var _c = __values(gltfModel.nodes), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var node = _d.value;
                    var group = this.__generateGroupEntity();
                    group.tryToSetUniqueName(node.name, true);
                    groups.push(group);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Transfrom
            this._setupTransform(gltfModel, groups);
            // Skeleton
            //    this._setupSkeleton(gltfModel, groups, glboostMeshes);
            // Hierarchy
            this._setupHierarchy(gltfModel, groups, meshEntities);
            // Animation
            //    this._setupAnimation(gltfModel, groups);
            // Root Group
            var rootGroup = this.__generateGroupEntity();
            rootGroup.tryToSetUniqueName('FileRoot', true);
            if (gltfModel.scenes[0].nodesIndices) {
                try {
                    for (var _e = __values(gltfModel.scenes[0].nodesIndices), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var nodesIndex = _f.value;
                        rootGroup.getSceneGraph().addChild(groups[nodesIndex].getSceneGraph());
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            // Post Skeletal Proccess
            // for (let glboostMesh of glboostMeshes) {
            //   if (glboostMesh instanceof M_SkeletalMesh) {
            //     if (!glboostMesh.jointsHierarchy) {
            //       glboostMesh.jointsHierarchy = rootGroup;
            //     }
            //   }
            // }
            // let options = gltfModel.asset.extras.glboostOptions;
            // if (options.loaderExtension && options.loaderExtension.setAssetPropertiesToRootGroup) {
            //   options.loaderExtension.setAssetPropertiesToRootGroup(rootGroup, gltfModel.asset);
            // }
            // if (options && options.loaderExtension && options.loaderExtension.loadExtensionInfoAndSetToRootGroup) {
            //   options.loaderExtension.loadExtensionInfoAndSetToRootGroup(rootGroup, gltfModel, glBoostContext);
            // }
            // rootGroup.allMeshes = rootGroup.searchElementsByType(M_Mesh);
            return rootGroup;
        };
        ModelConverter.prototype.createRnBuffer = function (gltfModel) {
            var buffer = gltfModel.buffers[0];
            var rnBuffer = new Buffer$1({
                byteLength: buffer.byteLength,
                arrayBuffer: buffer.buffer,
                name: "gltf2Buffer_0_(" + buffer.uri + ")"
            });
            return rnBuffer;
        };
        ModelConverter.prototype._setupTransform = function (gltfModel, groups) {
            for (var node_i in gltfModel.nodes) {
                var group = groups[node_i];
                var nodeJson = gltfModel.nodes[node_i];
                if (nodeJson.translation) {
                    group.getTransform().translate = new ImmutableVector3(nodeJson.translation[0], nodeJson.translation[1], nodeJson.translation[2]);
                }
                if (nodeJson.scale) {
                    group.getTransform().scale = new ImmutableVector3(nodeJson.scale[0], nodeJson.scale[1], nodeJson.scale[2]);
                }
                if (nodeJson.rotation) {
                    group.getTransform().quaternion = new ImmutableQuaternion(nodeJson.rotation[0], nodeJson.rotation[1], nodeJson.rotation[2], nodeJson.rotation[3]);
                }
                if (nodeJson.matrix) {
                    group.getTransform().matrix = new ImmutableMatrix44(nodeJson.matrix, true);
                }
            }
        };
        ModelConverter.prototype._setupHierarchy = function (gltfModel, groups, meshEntities) {
            var e_3, _a;
            var groupSceneComponents = groups.map(function (group) { return group.getSceneGraph(); });
            var meshSceneComponents = meshEntities.map(function (mesh) { return mesh.getSceneGraph(); });
            for (var node_i in gltfModel.nodes) {
                var node = gltfModel.nodes[parseInt(node_i)];
                var parentGroup = groupSceneComponents[node_i];
                if (node.mesh) {
                    parentGroup.addChild(meshSceneComponents[node.meshIndex]);
                }
                if (node.childrenIndices) {
                    try {
                        for (var _b = __values(node.childrenIndices), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var childNode_i = _c.value;
                            var childGroup = groupSceneComponents[childNode_i];
                            parentGroup.addChild(childGroup);
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                }
            }
        };
        // _setupAnimation(gltfModel: glTF2, groups: Entity[]) {
        //   if (gltfModel.animations) {
        //     for (let animation of gltfModel.animations) {
        //       for (let channel of animation.channels) {
        //         let animInputArray = channel.sampler.input.extras.vertexAttributeArray;
        //         let animOutputArray = channel.sampler.output.extras.vertexAttributeArray;;
        //         let animationAttributeName = '';
        //         if (channel.target.path === 'translation') {
        //           animationAttributeName = 'translate';
        //         } else if (channel.target.path === 'rotation') {
        //           animationAttributeName = 'quaternion';
        //         } else {
        //           animationAttributeName = channel.target.path;
        //         }
        //         let group = groups[channel.target.nodeIndex];
        //         if (group) {
        //           group.setAnimationAtLine('time', animationAttributeName, animInputArray, animOutputArray);
        //           group.setActiveAnimationLine('time');
        //         }
        //       }
        //     }
        //   }
        // }
        // _setupSkeleton(gltfModel: glTF2, groups: Entity[], glboostMeshes) {
        //   for (let node_i in gltfModel.nodes) {
        //     let node = gltfModel.nodes[node_i];
        //     let group = groups[node_i];
        //     if (node.skin && node.skin.skeleton) {
        //       group._isRootJointGroup = true;
        //       if (node.mesh) {
        //         let glboostMesh = glboostMeshes[node.meshIndex];
        //         glboostMesh.jointsHierarchy = groups[node.skin.skeletonIndex];
        //       }
        //     }
        //     if (node.skin && node.skin.joints) {
        //       for (let joint_i of node.skin.jointsIndices) {
        //         let joint = node.skin.joints[joint_i];
        //         let options = gltfModel.asset.extras.glboostOptions;
        //         let glboostJoint = glBoostContext.createJoint(options.isExistJointGizmo);
        //         glboostJoint._glTFJointIndex = joint_i;
        //         let group = groups[joint_i];
        //         group.addChild(glboostJoint, true);
        //       }
        //     }
        //   }
        // }
        ModelConverter.prototype._setupMesh = function (gltfModel, rnBuffer) {
            var e_4, _a;
            var meshEntities = [];
            try {
                for (var _b = __values(gltfModel.meshes), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var mesh = _c.value;
                    var meshEntity = this.__generateMeshEntity();
                    meshEntities.push(meshEntity);
                    var rnPrimitiveMode = PrimitiveMode.from(4);
                    for (var i in mesh.primitives) {
                        var primitive = mesh.primitives[i];
                        if (primitive.mode != null) {
                            rnPrimitiveMode = PrimitiveMode.from(primitive.mode);
                        }
                        var indicesRnAccessor = this.__getRnAccessor(primitive.indices, rnBuffer);
                        var attributeRnAccessors = [];
                        var attributeSemantics = [];
                        for (var attributeName in primitive.attributes) {
                            var attributeAccessor = primitive.attributes[attributeName];
                            var attributeRnAccessor = this.__getRnAccessor(attributeAccessor, rnBuffer);
                            attributeRnAccessors.push(attributeRnAccessor);
                            attributeSemantics.push(VertexAttribute.fromString(attributeAccessor.extras.attributeName));
                        }
                        var rnPrimitive = new Primitive(attributeRnAccessors, attributeSemantics, rnPrimitiveMode, 0, indicesRnAccessor);
                        var meshComponent = meshEntity.getComponent(MeshComponent.componentTID);
                        meshComponent.addPrimitive(rnPrimitive);
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
            return meshEntities;
        };
        ModelConverter.prototype.__getRnAccessor = function (accessor, rnBuffer) {
            var bufferView = accessor.bufferView;
            var rnBufferView = rnBuffer.takeBufferViewWithByteOffset({
                byteLengthToNeed: bufferView.byteLength,
                byteStride: bufferView.byteStride,
                byteOffset: bufferView.byteOffset,
                isAoS: false
            });
            var rnAccessor = rnBufferView.takeAccessorWithByteOffset({
                compositionType: CompositionType.fromString(accessor.type),
                componentType: ComponentType.from(accessor.componentType),
                count: accessor.count,
                byteOffset: accessor.byteOffset
            });
            return rnAccessor;
        };
        return ModelConverter;
    }());

    var Rn = Object.freeze({
        EntityRepository: EntityRepository,
        TransformComponent: TransformComponent,
        SceneGraphComponent: SceneGraphComponent,
        MeshComponent: MeshComponent,
        MeshRendererComponent: MeshRendererComponent,
        Primitive: Primitive,
        WebGLResourceRepository: WebGLResourceRepository,
        CompositionType: CompositionType,
        ComponentType: ComponentType,
        VertexAttribute: VertexAttribute,
        PrimitiveMode: PrimitiveMode,
        GLSLShader: GLSLShader,
        System: System,
        ImmutableVector3: ImmutableVector3,
        ImmutableVector4: ImmutableVector4,
        MutableVector3: MutableVector3,
        MutableVector4: MutableVector4,
        ImmutableMatrix33: ImmutableMatrix33,
        ImmutableMatrix44: ImmutableMatrix44,
        MutableMatrix44: MutableMatrix44,
        ProcessApproach: ProcessApproach,
        Gltf2Importer: Gltf2Importer,
        ModelConverter: ModelConverter
    });
    window['Rn'] = Rn;

    return Rn;

})));
