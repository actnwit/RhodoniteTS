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
        return CGAPIResourceRepository;
    }());

    // This code idea is from https://qiita.com/junkjunctions/items/5a6d8bed8df8eb3acceb
    var EnumClass = /** @class */ (function () {
        function EnumClass(_a) {
            var index = _a.index, str = _a.str;
            this.index = index;
            this.str = str;
        }
        EnumClass.prototype.toString = function () {
            return this.str;
        };
        EnumClass.prototype.toJSON = function () {
            return this.index;
        };
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

    var VertexAttributeClass = /** @class */ (function (_super) {
        __extends(VertexAttributeClass, _super);
        function VertexAttributeClass(_a) {
            var index = _a.index, str = _a.str;
            return _super.call(this, { index: index, str: str }) || this;
        }
        return VertexAttributeClass;
    }(EnumClass));
    var Unknown = new VertexAttributeClass({ index: -1, str: 'UNKNOWN' });
    var Position = new VertexAttributeClass({ index: 0, str: 'POSITION' });
    var Normal = new VertexAttributeClass({ index: 1, str: 'NORMAL' });
    var Tangent = new VertexAttributeClass({ index: 2, str: 'TANGENT' });
    var Texcoord0 = new VertexAttributeClass({ index: 3, str: 'TEXCOORD_0' });
    var Texcoord1 = new VertexAttributeClass({ index: 4, str: 'TEXCOORD_1' });
    var Color0 = new VertexAttributeClass({ index: 5, str: 'COLOR_0' });
    var Joints0 = new VertexAttributeClass({ index: 6, str: 'JOINTS_0' });
    var Weights0 = new VertexAttributeClass({ index: 7, str: 'WEIGHTS_0' });
    var Instance = new VertexAttributeClass({ index: 4, str: 'INSTANCE' });
    var typeList = [Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, Instance];
    function from(_a) {
        var index = _a.index;
        return _from({ typeList: typeList, index: index });
    }
    var VertexAttribute = Object.freeze({
        Unknown: Unknown, Position: Position, Normal: Normal, Tangent: Tangent, Texcoord0: Texcoord0, Texcoord1: Texcoord1, Color0: Color0, Joints0: Joints0, Weights0: Weights0, Instance: Instance, from: from
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
    function from$1(_a) {
        var index = _a.index;
        return _from({ typeList: typeList$1, index: index });
    }
    var CompositionType = Object.freeze({ Unknown: Unknown$1, Scalar: Scalar, Vec2: Vec2, Vec3: Vec3, Vec4: Vec4, Mat2: Mat2, Mat3: Mat3, Mat4: Mat4, from: from$1 });

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
    function from$2(_a) {
        var index = _a.index;
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
            _this.__resourceCounter = 0;
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
        WebGLResourceRepository.prototype.createShaderProgram = function (vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics) {
            var gl = this.__glw.getRawContext();
            if (gl == null) {
                throw new Error("No WebGLRenderingContext set as Default.");
            }
            var vertexShader = gl.createShader(gl.VERTEX_SHADER);
            var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(vertexShader, vertexShaderStr);
            gl.shaderSource(fragmentShader, fragmentShaderStr);
            gl.compileShader(vertexShader);
            this.__checkShaderCompileStatus(vertexShader, vertexShaderStr);
            gl.compileShader(fragmentShader);
            this.__checkShaderCompileStatus(fragmentShader, fragmentShaderStr);
            var shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            attributeNames.forEach(function (attributeName, i) {
                gl.bindAttribLocation(shaderProgram, attributeSemantics[i].index, attributeName);
            });
            gl.linkProgram(shaderProgram);
            var resourceHandle = this.getResourceNumber();
            this.__webglResources.set(resourceHandle, shaderProgram);
            this.__checkShaderProgramLinkStatus(shaderProgram);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
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
            if (instanceIDBufferUid === void 0) { instanceIDBufferUid = 0; }
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
                gl.enableVertexAttribArray(primitive.attributeSemantics[i].index);
                gl.vertexAttribPointer(primitive.attributeSemantics[i].index, primitive.attributeCompositionTypes[i].getNumberOfComponents(), primitive.attributeComponentTypes[i].index, false, primitive.attributeAccessors[i].byteStride, 0);
            });
            /// for InstanceIDBuffer
            if (instanceIDBufferUid !== 0) {
                var instanceIDBuffer = this.getWebGLResource(instanceIDBufferUid);
                if (instanceIDBuffer != null) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, instanceIDBuffer);
                }
                else {
                    throw new Error('Nothing Element Array Buffer at index');
                }
                gl.enableVertexAttribArray(VertexAttribute.Instance.index);
                gl.vertexAttribPointer(VertexAttribute.Instance.index, CompositionType.Scalar.getNumberOfComponents(), ComponentType.Float.index, false, 0, 0);
                this.__glw.vertexAttribDivisor(VertexAttribute.Instance.index, 1);
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
        return Entity;
    }());

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
        ComponentRepository.prototype.createComponent = function (componentTid, entityUid) {
            var thisClass = ComponentRepository;
            var componentClass = thisClass.__componentClasses.get(componentTid);
            if (componentClass != null) {
                var component_sid_count = this.__component_sid_count_map.get(componentTid);
                if (!IsUtil.exist(component_sid_count)) {
                    this.__component_sid_count_map.set(componentTid, 0);
                    component_sid_count = 0;
                }
                this.__component_sid_count_map.set(componentTid, ++component_sid_count);
                var component = new componentClass(entityUid, component_sid_count);
                if (!this.__components.has(componentTid)) {
                    this.__components.set(componentTid, []);
                }
                var array = this.__components.get(componentTid);
                if (array != null) {
                    array[component.componentSID - 1] = component;
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
            this.__entity_uid_count = 0;
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
                    var component = this.__componentRepository.createComponent(componentTid, entity.entityUID);
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
        EntityRepository.getMaxEntityNumber = function () {
            return 100000;
        };
        EntityRepository.prototype._getEntities = function () {
            return this.__entities.concat();
        };
        return EntityRepository;
    }());

    var Vector3 = /** @class */ (function () {
        function Vector3(x, y, z) {
            if (ArrayBuffer.isView(x)) {
                this.v = x;
                return;
            }
            else {
                this.v = new Float32Array(3);
            }
            if (IsUtil.not.exist(x)) {
                this.x = 0;
                this.y = 0;
                this.z = 0;
            }
            else if (Array.isArray(x)) {
                this.x = x[0];
                this.y = x[1];
                this.z = x[2];
            }
            else if (typeof x.w !== 'undefined') {
                this.x = x.x;
                this.y = x.y;
                this.z = x.z;
            }
            else if (typeof x.z !== 'undefined') {
                this.x = x.x;
                this.y = x.y;
                this.z = x.z;
            }
            else if (typeof x.y !== 'undefined') {
                this.x = x.x;
                this.y = x.y;
                this.z = 0;
            }
            else {
                this.x = x;
                this.y = y;
                this.z = z;
            }
        }
        Object.defineProperty(Vector3.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        Vector3.prototype.isStrictEqual = function (vec) {
            if (this.x === vec.x && this.y === vec.y && this.z === vec.z) {
                return true;
            }
            else {
                return false;
            }
        };
        Vector3.prototype.isEqual = function (vec, delta) {
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
        Vector3.prototype.zero = function () {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            return this;
        };
        /**
         * Zero Vector
         */
        Vector3.zero = function () {
            return new Vector3(0, 0, 0);
        };
        Vector3.prototype.clone = function () {
            return new Vector3(this.x, this.y, this.z);
        };
        Vector3.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        };
        /*
         * disabled for now because Safari's Function.prototype.length is not configurable yet.
         */
        /*
        static length(vec3) {
          return Math.sqrt(vec3.x*vec3.x + vec3.y*vec3.y + vec3.z*vec3.z);
        }
        */
        /**
         * to square length
         */
        Vector3.prototype.lengthSquared = function () {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        };
        /**
         * to square length(static verison)
         */
        Vector3.lengthSquared = function (vec3) {
            return vec3.x * vec3.x + vec3.y * vec3.y + vec3.z * vec3.z;
        };
        Vector3.prototype.lengthTo = function (vec3) {
            var deltaX = vec3.x - this.x;
            var deltaY = vec3.y - this.y;
            var deltaZ = vec3.z - this.z;
            return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        };
        Vector3.lengthBtw = function (lhv, rhv) {
            var deltaX = rhv.x - lhv.x;
            var deltaY = rhv.y - lhv.y;
            var deltaZ = rhv.z - lhv.z;
            return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        };
        /**
         * dot product
         */
        Vector3.prototype.dotProduct = function (vec3) {
            return this.x * vec3.x + this.y * vec3.y + this.z * vec3.z;
        };
        /**
         * dot product(static version)
         */
        Vector3.dotProduct = function (lv, rv) {
            return lv.x * rv.x + lv.y * rv.y + lv.z * rv.z;
        };
        /**
         * cross product
         */
        Vector3.prototype.cross = function (v) {
            var x = this.y * v.z - this.z * v.y;
            var y = this.z * v.x - this.x * v.z;
            var z = this.x * v.y - this.y * v.x;
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        };
        /**
        * cross product(static version)
        */
        Vector3.cross = function (lv, rv) {
            var x = lv.y * rv.z - lv.z * rv.y;
            var y = lv.z * rv.x - lv.x * rv.z;
            var z = lv.x * rv.y - lv.y * rv.x;
            return new Vector3(x, y, z);
        };
        /**
         * normalize
         */
        Vector3.prototype.normalize = function () {
            var length = this.length();
            this.divide(length);
            return this;
        };
        /**
         * normalize(static version)
         */
        Vector3.normalize = function (vec3) {
            var length = vec3.length();
            var newVec = new Vector3(vec3.x, vec3.y, vec3.z);
            newVec.divide(length);
            return newVec;
        };
        /**
         * add value
         */
        Vector3.prototype.add = function (v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        };
        /**
         * add value（static version）
         */
        Vector3.add = function (lv, rv) {
            return new Vector3(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z);
        };
        /**
         * subtract
         */
        Vector3.prototype.subtract = function (v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            return this;
        };
        /**
         * subtract(subtract)
         */
        Vector3.subtract = function (lv, rv) {
            return new Vector3(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z);
        };
        /**
         * divide
         */
        Vector3.prototype.divide = function (val) {
            if (val !== 0) {
                this.x /= val;
                this.y /= val;
                this.z /= val;
            }
            else {
                console.warn("0 division occured!");
                this.x = Infinity;
                this.y = Infinity;
                this.z = Infinity;
            }
            return this;
        };
        /**
         * divide(static version)
         */
        Vector3.divide = function (vec3, val) {
            if (val !== 0) {
                return new Vector3(vec3.x / val, vec3.y / val, vec3.z / val);
            }
            else {
                console.warn("0 division occured!");
                return new Vector3(Infinity, Infinity, Infinity);
            }
        };
        /**
         * multiply
         */
        Vector3.prototype.multiply = function (val) {
            this.x *= val;
            this.y *= val;
            this.z *= val;
            return this;
        };
        /**
         * multiply vector
         */
        Vector3.prototype.multiplyVector = function (vec) {
            this.x *= vec.x;
            this.y *= vec.y;
            this.z *= vec.z;
            return this;
        };
        /**
         * multiply(static version)
         */
        Vector3.multiply = function (vec3, val) {
            return new Vector3(vec3.x * val, vec3.y * val, vec3.z * val);
        };
        /**
         * multiply vector(static version)
         */
        Vector3.multiplyVector = function (vec3, vec) {
            return new Vector3(vec3.x * vec.x, vec3.y * vec.y, vec3.z * vec.z);
        };
        Vector3.angleOfVectors = function (lhv, rhv) {
            var cos_sita = Vector3.dotProduct(lhv, rhv) / (lhv.length() * rhv.length());
            var sita = Math.acos(cos_sita);
            return sita;
        };
        /**
         * divide vector
         */
        Vector3.prototype.divideVector = function (vec3) {
            this.x /= vec3.x;
            this.y /= vec3.y;
            this.z /= vec3.z;
            return this;
        };
        /**
         * divide vector(static version)
         */
        Vector3.divideVector = function (lvec3, rvec3) {
            return new Vector3(lvec3.x / rvec3.x, lvec3.y / rvec3.y, lvec3.z / rvec3.z);
        };
        /**
         * change to string
         */
        Vector3.prototype.toString = function () {
            return '(' + this.x + ', ' + this.y + ', ' + this.z + ')';
        };
        Object.defineProperty(Vector3.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            set: function (z) {
                this.v[2] = z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3.prototype, "raw", {
            get: function () {
                return this.v;
            },
            enumerable: true,
            configurable: true
        });
        return Vector3;
    }());
    //GLBoost['Vector3'] = Vector3;

    //import GLBoost from '../../globals';
    var Quaternion = /** @class */ (function () {
        function Quaternion(x, y, z, w) {
            if (ArrayBuffer.isView(x)) {
                this.v = x;
                return;
            }
            else {
                this.v = new Float32Array(4);
            }
            if (!(x != null)) {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 1;
            }
            else if (Array.isArray(x)) {
                this.x = x[0];
                this.y = x[1];
                this.z = x[2];
                this.w = x[3];
            }
            else if (typeof x.w !== 'undefined') {
                this.x = x.x;
                this.y = x.y;
                this.z = x.z;
                this.w = x.w;
            }
            else if (typeof x.z !== 'undefined') {
                this.x = x.x;
                this.y = x.y;
                this.z = x.z;
                this.w = 1;
            }
            else if (typeof x.y !== 'undefined') {
                this.x = x.x;
                this.y = x.y;
                this.z = 0;
                this.w = 1;
            }
            else {
                this.x = x;
                this.y = y;
                this.z = z;
                this.w = w;
            }
        }
        Quaternion.prototype.identity = function () {
            this.x = 0;
            this.y = 0;
            this.x = 0;
            this.w = 1;
        };
        Quaternion.prototype.isEqual = function (quat) {
            if (this.x === quat.x && this.y === quat.y && this.z === quat.z && this.w === quat.w) {
                return true;
            }
            else {
                return false;
            }
        };
        Object.defineProperty(Quaternion.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        Quaternion.prototype.clone = function () {
            return new Quaternion(this.x, this.y, this.z, this.w);
        };
        Quaternion.invert = function (quat) {
            quat = new Quaternion(-quat.x, -quat.y, -quat.z, quat.w);
            var inorm2 = 1.0 / (quat.x * quat.x + quat.y * quat.y + quat.z * quat.z + quat.w * quat.w);
            quat.x *= inorm2;
            quat.y *= inorm2;
            quat.z *= inorm2;
            quat.w *= inorm2;
            return quat;
        };
        Quaternion.qlerp = function (lhq, rhq, ratio) {
            var q = new Quaternion(0, 0, 0, 1);
            var qr = lhq.w * rhq.w + lhq.x * rhq.x + lhq.y * rhq.y + lhq.z * rhq.z;
            var ss = 1.0 - qr * qr;
            if (ss === 0.0) {
                q.w = lhq.w;
                q.x = lhq.x;
                q.y = lhq.y;
                q.z = lhq.z;
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
                q.x = lhq.x * s1 + rhq.x * s2;
                q.y = lhq.y * s1 + rhq.y * s2;
                q.z = lhq.z * s1 + rhq.z * s2;
                q.w = lhq.w * s1 + rhq.w * s2;
                return q;
            }
        };
        Quaternion.prototype.axisAngle = function (axisVec3, radian) {
            var halfAngle = 0.5 * radian;
            var sin = Math.sin(halfAngle);
            var axis = Vector3.normalize(axisVec3);
            this.w = Math.cos(halfAngle);
            this.x = sin * axis.x;
            this.y = sin * axis.y;
            this.z = sin * axis.z;
            return this;
        };
        Quaternion.axisAngle = function (axisVec3, radian) {
            var halfAngle = 0.5 * radian;
            var sin = Math.sin(halfAngle);
            var axis = Vector3.normalize(axisVec3);
            return new Quaternion(sin * axis.x, sin * axis.y, sin * axis.z, Math.cos(halfAngle));
        };
        Quaternion.prototype.add = function (q) {
            this.x += q.x;
            this.y += q.y;
            this.z += q.z;
            this.w += q.w;
            return this;
        };
        Quaternion.prototype.multiply = function (q) {
            var result = new Quaternion(0, 0, 0, 1);
            result.x = q.w * this.x + q.z * this.y + q.y * this.z - q.x * this.w;
            result.y = -q.z * this.x + q.w * this.y + q.x * this.z - q.y * this.w;
            result.z = q.y * this.x + q.x * this.y + q.w * this.z - q.z * this.w;
            result.w = -q.x * this.x - q.y * this.y - q.z * this.z - q.w * this.w;
            this.x = result.x;
            this.y = result.y;
            this.z = result.z;
            this.w = result.w;
            return this;
        };
        Quaternion.multiply = function (q1, q2) {
            var result = new Quaternion(0, 0, 0, 1);
            result.x = q2.w * q1.x + q2.z * q1.y - q2.y * q1.z + q2.x * q1.w;
            result.y = -q2.z * q1.x + q2.w * q1.y + q2.x * q1.z + q2.y * q1.w;
            result.z = q2.y * q1.x - q2.x * q1.y + q2.w * q1.z + q2.z * q1.w;
            result.w = -q2.x * q1.x - q2.y * q1.y - q2.z * q1.z + q2.w * q1.w;
            return result;
        };
        Quaternion.fromMatrix = function (m) {
            var q = new Quaternion();
            var tr = m.m00 + m.m11 + m.m22;
            if (tr > 0) {
                var S = 0.5 / Math.sqrt(tr + 1.0);
                q.w = 0.25 / S;
                q.x = (m.m21 - m.m12) * S;
                q.y = (m.m02 - m.m20) * S;
                q.z = (m.m10 - m.m01) * S;
            }
            else if ((m.m00 > m.m11) && (m.m00 > m.m22)) {
                var S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
                q.w = (m.m21 - m.m12) / S;
                q.x = 0.25 * S;
                q.y = (m.m01 + m.m10) / S;
                q.z = (m.m02 + m.m20) / S;
            }
            else if (m.m11 > m.m22) {
                var S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
                q.w = (m.m02 - m.m20) / S;
                q.x = (m.m01 + m.m10) / S;
                q.y = 0.25 * S;
                q.z = (m.m12 + m.m21) / S;
            }
            else {
                var S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
                q.w = (m.m10 - m.m01) / S;
                q.x = (m.m02 + m.m20) / S;
                q.y = (m.m12 + m.m21) / S;
                q.z = 0.25 * S;
            }
            return q;
        };
        Quaternion.prototype.fromMatrix = function (m) {
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
        /*
          static fromMatrix(m) {
            let fTrace = m.m[0] + m.m[4] + m.m[8];
            let fRoot;
            let q = new Quaternion();
            if ( fTrace > 0.0 ) {
              // |w| > 1/2, may as well choose w > 1/2
              fRoot = Math.sqrt(fTrace + 1.0);  // 2w
              q.w = 0.5 * fRoot;
              fRoot = 0.5/fRoot;  // 1/(4w)
              q.x = (m.m[5]-m.m[7])*fRoot;
              q.y = (m.m[6]-m.m[2])*fRoot;
              q.z = (m.m[1]-m.m[3])*fRoot;
            } else {
              // |w| <= 1/2
              let i = 0;
              if ( m.m[4] > m.m[0] )
                i = 1;
              if ( m.m[8] > m.m[i*3+i] )
                i = 2;
              let j = (i+1)%3;
              let k = (i+2)%3;
              fRoot = Math.sqrt(m.m[i*3+i]-m.m[j*3+j]-m.m[k*3+k] + 1.0);
              
              let setValue = function(q, i, value) {
                switch (i) {
                  case 0: q.x = value; break;
                  case 1: q.y = value; break;
                  case 2: q.z = value; break;
                }
              }
        
              setValue(q, i, 0.5 * fRoot); //      q[i] = 0.5 * fRoot;
              fRoot = 0.5 / fRoot;
              q.w = (m.m[j*3+k] - m.m[k*3+j]) * fRoot;
        
              setValue(q, j, (m.m[j*3+i] + m.m[i*3+j]) * fRoot); //      q[j] = (m.m[j*3+i] + m.m[i*3+j]) * fRoot;
              setValue(q, k, (m.m[k*3+i] + m.m[i*3+k]) * fRoot); //      q[k] = (m.m[k*3+i] + m.m[i*3+k]) * fRoot;
            }
        
            return q;
          }
        */
        Quaternion.fromPosition = function (vec3) {
            var q = new Quaternion(vec3.x, vec3.y, vec3.z, 0);
            return q;
        };
        Quaternion.prototype.at = function (i) {
            switch (i % 4) {
                case 0: return this.x;
                case 1: return this.y;
                case 2: return this.z;
                case 3: return this.w;
            }
        };
        Quaternion.prototype.setAt = function (i, val) {
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
        Quaternion.prototype.normalize = function () {
            var norm = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
            this.x /= norm;
            this.y /= norm;
            this.z /= norm;
            this.w /= norm;
            return this;
        };
        Quaternion.prototype.toString = function () {
            return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
        };
        Object.defineProperty(Quaternion.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Quaternion.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Quaternion.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            set: function (z) {
                this.v[2] = z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Quaternion.prototype, "w", {
            get: function () {
                return this.v[3];
            },
            set: function (w) {
                this.v[3] = w;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Quaternion.prototype, "raw", {
            get: function () {
                return this.v;
            },
            enumerable: true,
            configurable: true
        });
        return Quaternion;
    }());
    //GLBoost["Quaternion"] = Quaternion;

    // import GLBoost from '../../globals';
    var Matrix33 = /** @class */ (function () {
        function Matrix33(m0, m1, m2, m3, m4, m5, m6, m7, m8, isColumnMajor) {
            if (isColumnMajor === void 0) { isColumnMajor = false; }
            this.m = new Float32Array(9); // Data order is column major
            var _isColumnMajor = (arguments.length === 10) ? isColumnMajor : m1;
            var m = m0;
            if (arguments.length === 9) {
                if (_isColumnMajor === true) {
                    var m_1 = arguments;
                    this.setComponents(m_1[0], m_1[3], m_1[6], m_1[1], m_1[4], m_1[7], m_1[2], m_1[5], m_1[8]);
                }
                else {
                    this.setComponents.apply(this, arguments); // arguments[0-8] must be row major values if isColumnMajor is false
                }
            }
            else if (Array.isArray(m)) {
                if (_isColumnMajor === true) {
                    this.setComponents(m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]);
                }
                else {
                    this.setComponents.apply(this, m); // 'm' must be row major array if isColumnMajor is false
                }
            }
            else if (m instanceof Float32Array) {
                if (_isColumnMajor === true) {
                    this.setComponents(m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]);
                }
                else {
                    this.setComponents.apply(this, m); // 'm' must be row major array if isColumnMajor is false
                }
            }
            else if (!!m && typeof m.m22 !== 'undefined') {
                if (_isColumnMajor === true) {
                    var _m = m;
                    this.setComponents(_m.m00, _m.m01, _m.m02, _m.m10, _m.m11, _m.m12, _m.m20, _m.m21, _m.m22);
                }
                else {
                    var _m = m;
                    this.setComponents(_m.m00, _m.m01, _m.m02, _m.m10, _m.m11, _m.m12, _m.m20, _m.m21, _m.m22); // 'm' must be row major array if isColumnMajor is false
                }
            }
            else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
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
                this.setComponents(1.0 - 2.0 * (sy + sz), 2.0 * (cz - wz), 2.0 * (cy + wy), 2.0 * (cz + wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx - wx), 2.0 * (cy - wy), 2.0 * (cx + wx), 1.0 - 2.0 * (sx + sy));
            }
            else {
                this.identity();
            }
        }
        Matrix33.prototype.setComponents = function (m00, m01, m02, m10, m11, m12, m20, m21, m22) {
            this.m[0] = m00;
            this.m[3] = m01;
            this.m[6] = m02;
            this.m[1] = m10;
            this.m[4] = m11;
            this.m[7] = m12;
            this.m[2] = m20;
            this.m[5] = m21;
            this.m[8] = m22;
            return this;
        };
        Object.defineProperty(Matrix33.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        Matrix33.prototype.identity = function () {
            this.setComponents(1, 0, 0, 0, 1, 0, 0, 0, 1);
            return this;
        };
        /**
         * Make this identity matrix（static method version）
         */
        Matrix33.identity = function () {
            return new Matrix33(1, 0, 0, 0, 1, 0, 0, 0, 1);
        };
        Matrix33.prototype.clone = function () {
            return new Matrix33(this.m[0], this.m[3], this.m[6], this.m[1], this.m[4], this.m[7], this.m[2], this.m[5], this.m[8]);
        };
        /**
         * Create X oriented Rotation Matrix
         */
        Matrix33.prototype.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(1, 0, 0, 0, cos, -sin, 0, sin, cos);
        };
        /**
         * Create X oriented Rotation Matrix
         */
        Matrix33.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new Matrix33(1, 0, 0, 0, cos, -sin, 0, sin, cos);
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        Matrix33.prototype.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            this.setComponents(cos, 0, sin, 0, 1, 0, -sin, 0, cos);
            return this;
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        Matrix33.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new Matrix33(cos, 0, sin, 0, 1, 0, -sin, 0, cos);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        Matrix33.prototype.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        Matrix33.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new Matrix33(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
        };
        Matrix33.rotateXYZ = function (x, y, z) {
            return (Matrix33.rotateZ(z).multiply(Matrix33.rotateY(y).multiply(Matrix33.rotateX(x))));
        };
        Matrix33.rotate = function (vec3) {
            return (Matrix33.rotateZ(vec3.z).multiply(Matrix33.rotateY(vec3.y).multiply(Matrix33.rotateX(vec3.x))));
        };
        Matrix33.prototype.scale = function (vec) {
            return this.setComponents(vec.x, 0, 0, 0, vec.y, 0, 0, 0, vec.z);
        };
        Matrix33.scale = function (vec) {
            return new Matrix33(vec.x, 0, 0, 0, vec.y, 0, 0, 0, vec.z);
        };
        /**
         * zero matrix
         */
        Matrix33.prototype.zero = function () {
            this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0);
            return this;
        };
        /**
         * zero matrix(static version)
         */
        Matrix33.zero = function () {
            return new Matrix33(0, 0, 0, 0, 0, 0, 0, 0, 0);
        };
        Matrix33.prototype.flatten = function () {
            return this.m;
        };
        Matrix33.prototype.flattenAsArray = function () {
            return [this.m[0], this.m[1], this.m[2],
                this.m[3], this.m[4], this.m[5],
                this.m[6], this.m[7], this.m[8]];
        };
        Matrix33.prototype._swap = function (l, r) {
            this.m[r] = [this.m[l], this.m[l] = this.m[r]][0]; // Swap
        };
        /**
         * transpose
         */
        Matrix33.prototype.transpose = function () {
            this._swap(1, 3);
            this._swap(2, 6);
            this._swap(5, 8);
            return this;
        };
        /**
         * transpose(static version)
         */
        Matrix33.transpose = function (mat) {
            var mat_t = new Matrix33(mat.m00, mat.m10, mat.m20, mat.m01, mat.m11, mat.m21, mat.m02, mat.m12, mat.m22);
            return mat_t;
        };
        Matrix33.prototype.multiplyVector = function (vec) {
            var x = this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z;
            var y = this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z;
            var z = this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z;
            return new Vector3(x, y, z);
        };
        /**
         * multiply zero matrix and zero matrix
         */
        Matrix33.prototype.multiply = function (mat) {
            var m00 = this.m00 * mat.m00 + this.m01 * mat.m10 + this.m02 * mat.m20;
            var m01 = this.m00 * mat.m01 + this.m01 * mat.m11 + this.m02 * mat.m21;
            var m02 = this.m00 * mat.m02 + this.m01 * mat.m12 + this.m02 * mat.m22;
            var m10 = this.m10 * mat.m00 + this.m11 * mat.m10 + this.m12 * mat.m20;
            var m11 = this.m10 * mat.m01 + this.m11 * mat.m11 + this.m12 * mat.m21;
            var m12 = this.m10 * mat.m02 + this.m11 * mat.m12 + this.m12 * mat.m22;
            var m20 = this.m20 * mat.m00 + this.m21 * mat.m10 + this.m22 * mat.m20;
            var m21 = this.m20 * mat.m01 + this.m21 * mat.m11 + this.m22 * mat.m21;
            var m22 = this.m20 * mat.m02 + this.m21 * mat.m12 + this.m22 * mat.m22;
            return this.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
        };
        /**
         * multiply zero matrix and zero matrix(static version)
         */
        Matrix33.multiply = function (l_m, r_m) {
            var m00 = l_m.m00 * r_m.m00 + l_m.m01 * r_m.m10 + l_m.m02 * r_m.m20;
            var m10 = l_m.m10 * r_m.m00 + l_m.m11 * r_m.m10 + l_m.m12 * r_m.m20;
            var m20 = l_m.m20 * r_m.m00 + l_m.m21 * r_m.m10 + l_m.m22 * r_m.m20;
            var m01 = l_m.m00 * r_m.m01 + l_m.m01 * r_m.m11 + l_m.m02 * r_m.m21;
            var m11 = l_m.m10 * r_m.m01 + l_m.m11 * r_m.m11 + l_m.m12 * r_m.m21;
            var m21 = l_m.m20 * r_m.m01 + l_m.m21 * r_m.m11 + l_m.m22 * r_m.m21;
            var m02 = l_m.m00 * r_m.m02 + l_m.m01 * r_m.m12 + l_m.m02 * r_m.m22;
            var m12 = l_m.m10 * r_m.m02 + l_m.m11 * r_m.m12 + l_m.m12 * r_m.m22;
            var m22 = l_m.m20 * r_m.m02 + l_m.m21 * r_m.m12 + l_m.m22 * r_m.m22;
            return new Matrix33(m00, m01, m02, m10, m11, m12, m20, m21, m22);
        };
        Matrix33.prototype.determinant = function () {
            return this.m00 * this.m11 * this.m22 + this.m10 * this.m21 * this.m02 + this.m20 * this.m01 * this.m12
                - this.m00 * this.m21 * this.m12 - this.m20 * this.m11 * this.m02 - this.m10 * this.m01 * this.m22;
        };
        Matrix33.determinant = function (mat) {
            return mat.m00 * mat.m11 * mat.m22 + mat.m10 * mat.m21 * mat.m02 + mat.m20 * mat.m01 * mat.m12
                - mat.m00 * mat.m21 * mat.m12 - mat.m20 * mat.m11 * mat.m02 - mat.m10 * mat.m01 * mat.m22;
        };
        Matrix33.prototype.invert = function () {
            var det = this.determinant();
            var m00 = (this.m11 * this.m22 - this.m12 * this.m21) / det;
            var m01 = (this.m02 * this.m21 - this.m01 * this.m22) / det;
            var m02 = (this.m01 * this.m12 - this.m02 * this.m11) / det;
            var m10 = (this.m12 * this.m20 - this.m10 * this.m22) / det;
            var m11 = (this.m00 * this.m22 - this.m02 * this.m20) / det;
            var m12 = (this.m02 * this.m10 - this.m00 * this.m12) / det;
            var m20 = (this.m10 * this.m21 - this.m11 * this.m20) / det;
            var m21 = (this.m01 * this.m20 - this.m00 * this.m21) / det;
            var m22 = (this.m00 * this.m11 - this.m01 * this.m10) / det;
            return this.setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22);
        };
        Matrix33.invert = function (mat) {
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
            return new Matrix33(m00, m01, m02, m10, m11, m12, m20, m21, m22);
        };
        Object.defineProperty(Matrix33.prototype, "m00", {
            get: function () {
                return this.m[0];
            },
            set: function (val) {
                this.m[0] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix33.prototype, "m10", {
            get: function () {
                return this.m[1];
            },
            set: function (val) {
                this.m[1] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix33.prototype, "m20", {
            get: function () {
                return this.m[2];
            },
            set: function (val) {
                this.m[2] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix33.prototype, "m01", {
            get: function () {
                return this.m[3];
            },
            set: function (val) {
                this.m[3] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix33.prototype, "m11", {
            get: function () {
                return this.m[4];
            },
            set: function (val) {
                this.m[4] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix33.prototype, "m21", {
            get: function () {
                return this.m[5];
            },
            set: function (val) {
                this.m[5] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix33.prototype, "m02", {
            get: function () {
                return this.m[6];
            },
            set: function (val) {
                this.m[6] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix33.prototype, "m12", {
            get: function () {
                return this.m[7];
            },
            set: function (val) {
                this.m[7] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix33.prototype, "m22", {
            get: function () {
                return this.m[8];
            },
            set: function (val) {
                this.m[8] = val;
            },
            enumerable: true,
            configurable: true
        });
        Matrix33.prototype.toString = function () {
            return this.m00 + ' ' + this.m01 + ' ' + this.m02 + '\n' +
                this.m10 + ' ' + this.m11 + ' ' + this.m12 + '\n' +
                this.m20 + ' ' + this.m21 + ' ' + this.m22 + '\n';
        };
        Matrix33.prototype.nearZeroToZero = function (value) {
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
        Matrix33.prototype.toStringApproximately = function () {
            return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + '\n' +
                this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' \n' +
                this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + '\n';
        };
        Matrix33.prototype.getScale = function () {
            return new Vector3(Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02), Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12), Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22));
        };
        Matrix33.prototype.addScale = function (vec) {
            this.m00 *= vec.x;
            this.m11 *= vec.y;
            this.m22 *= vec.z;
            return this;
        };
        Matrix33.prototype.isEqual = function (mat, delta) {
            if (delta === void 0) { delta = Number.EPSILON; }
            if (Math.abs(mat.m[0] - this.m[0]) < delta &&
                Math.abs(mat.m[1] - this.m[1]) < delta &&
                Math.abs(mat.m[2] - this.m[2]) < delta &&
                Math.abs(mat.m[3] - this.m[3]) < delta &&
                Math.abs(mat.m[4] - this.m[4]) < delta &&
                Math.abs(mat.m[5] - this.m[5]) < delta &&
                Math.abs(mat.m[6] - this.m[6]) < delta &&
                Math.abs(mat.m[7] - this.m[7]) < delta &&
                Math.abs(mat.m[8] - this.m[8]) < delta) {
                return true;
            }
            else {
                return false;
            }
        };
        return Matrix33;
    }());
    // GLBoost['Matrix33'] = Matrix33;

    var Vector4 = /** @class */ (function () {
        function Vector4(x, y, z, w) {
            if (ArrayBuffer.isView(x)) {
                this.v = x;
                return;
            }
            else {
                this.v = new Float32Array(4);
            }
            if (!(x != null)) {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 1;
            }
            else if (Array.isArray(x)) {
                this.x = x[0];
                this.y = x[1];
                this.z = x[2];
                this.w = x[3];
            }
            else if (typeof x.w !== 'undefined') {
                this.x = x.x;
                this.y = x.y;
                this.z = x.z;
                this.w = x.w;
            }
            else if (typeof x.z !== 'undefined') {
                this.x = x.x;
                this.y = x.y;
                this.z = x.z;
                this.w = 1;
            }
            else if (typeof x.y !== 'undefined') {
                this.x = x.x;
                this.y = x.y;
                this.z = 0;
                this.w = 1;
            }
            else {
                this.x = x;
                this.y = y;
                this.z = z;
                this.w = w;
            }
        }
        Object.defineProperty(Vector4.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        Vector4.prototype.isStrictEqual = function (vec) {
            if (this.v[0] === vec.v[0] && this.v[1] === vec.v[1] && this.v[2] === vec.v[2] && this.v[3] === vec.v[3]) {
                return true;
            }
            else {
                return false;
            }
        };
        Vector4.prototype.isEqual = function (vec, delta) {
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
        Vector4.prototype.clone = function () {
            return new Vector4(this.x, this.y, this.z, this.w);
        };
        /**
         * Zero Vector
         */
        Vector4.zero = function () {
            return new Vector4(0, 0, 0, 1);
        };
        Vector4.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        };
        Vector4.prototype.normalize = function () {
            var length = this.length();
            this.divide(length);
            return this;
        };
        Vector4.normalize = function (vec4) {
            var length = vec4.length();
            var newVec = new Vector4(vec4.x, vec4.y, vec4.z, vec4.w);
            newVec.divide(length);
            return newVec;
        };
        /**
         * add value
         */
        Vector4.prototype.add = function (v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            this.w += v.w;
            return this;
        };
        /**
         * add value（static version）
         */
        Vector4.add = function (lv, rv) {
            return new Vector4(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z + rv.z);
        };
        /**
         * add value except w component
         */
        Vector4.prototype.addWithOutW = function (v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        };
        Vector4.prototype.subtract = function (v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            this.w -= v.w;
            return this;
        };
        Vector4.subtract = function (lv, rv) {
            return new Vector4(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z, lv.w - rv.w);
        };
        /**
         * add value except w component（static version）
         */
        Vector4.addWithOutW = function (lv, rv) {
            return new Vector4(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z);
        };
        Vector4.prototype.multiply = function (val) {
            this.x *= val;
            this.y *= val;
            this.z *= val;
            this.w *= val;
            return this;
        };
        Vector4.prototype.multiplyVector = function (vec) {
            this.x *= vec.x;
            this.y *= vec.y;
            this.z *= vec.z;
            this.w *= vec.w;
            return this;
        };
        Vector4.multiply = function (vec4, val) {
            return new Vector4(vec4.x * val, vec4.y * val, vec4.z * val, vec4.w * val);
        };
        Vector4.multiplyVector = function (vec4, vec) {
            return new Vector4(vec4.x * vec.x, vec4.y * vec.y, vec4.z * vec.z, vec4.w * vec.w);
        };
        Vector4.prototype.divide = function (val) {
            if (val !== 0) {
                this.x /= val;
                this.y /= val;
                this.z /= val;
                this.w /= val;
            }
            else {
                console.warn("0 division occured!");
                this.x = Infinity;
                this.y = Infinity;
                this.z = Infinity;
                this.w = Infinity;
            }
            return this;
        };
        Vector4.divide = function (vec4, val) {
            if (val !== 0) {
                return new Vector4(vec4.x / val, vec4.y / val, vec4.z / val, vec4.w / val);
            }
            else {
                console.warn("0 division occured!");
                return new Vector4(Infinity, Infinity, Infinity, Infinity);
            }
        };
        Vector4.prototype.divideVector = function (vec4) {
            this.x /= vec4.x;
            this.y /= vec4.y;
            this.z /= vec4.z;
            this.w /= vec4.w;
            return this;
        };
        Vector4.divideVector = function (lvec4, rvec4) {
            return new Vector4(lvec4.x / rvec4.x, lvec4.y / rvec4.y, lvec4.z / rvec4.z, lvec4.w / rvec4.w);
        };
        Vector4.prototype.toString = function () {
            return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
        };
        Object.defineProperty(Vector4.prototype, "x", {
            get: function () {
                return this.v[0];
            },
            set: function (x) {
                this.v[0] = x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector4.prototype, "y", {
            get: function () {
                return this.v[1];
            },
            set: function (y) {
                this.v[1] = y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector4.prototype, "z", {
            get: function () {
                return this.v[2];
            },
            set: function (z) {
                this.v[2] = z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector4.prototype, "w", {
            get: function () {
                return this.v[3];
            },
            set: function (w) {
                this.v[3] = w;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector4.prototype, "raw", {
            get: function () {
                return this.v;
            },
            enumerable: true,
            configurable: true
        });
        return Vector4;
    }());
    // GLBoost["Vector4"] = Vector4;

    //import GLBoost from '../../globals';
    var FloatArray = Float32Array;
    var Matrix44 = /** @class */ (function () {
        function Matrix44(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, isColumnMajor, notCopyFloatArray) {
            if (isColumnMajor === void 0) { isColumnMajor = false; }
            if (notCopyFloatArray === void 0) { notCopyFloatArray = false; }
            var _isColumnMajor = (arguments.length >= 16) ? isColumnMajor : m1;
            var _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m2;
            var m = m0;
            if (arguments.length >= 16) {
                this.m = new FloatArray(16); // Data order is column major
                if (_isColumnMajor === true) {
                    var m_1 = arguments;
                    this.setComponents(m_1[0], m_1[4], m_1[8], m_1[12], m_1[1], m_1[5], m_1[9], m_1[13], m_1[2], m_1[6], m_1[10], m_1[14], m_1[3], m_1[7], m_1[11], m_1[15]);
                }
                else {
                    this.setComponents.apply(this, arguments); // arguments[0-15] must be row major values if isColumnMajor is false
                }
            }
            else if (Array.isArray(m)) {
                this.m = new FloatArray(16);
                if (_isColumnMajor === true) {
                    this.setComponents(m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14], m[3], m[7], m[11], m[15]);
                }
                else {
                    this.setComponents.apply(this, m); // 'm' must be row major array if isColumnMajor is false
                }
            }
            else if (m instanceof FloatArray) {
                if (_notCopyFloatArray) {
                    this.m = m;
                }
                else {
                    this.m = new FloatArray(16);
                    if (_isColumnMajor === true) {
                        this.setComponents(m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14], m[3], m[7], m[11], m[15]);
                    }
                    else {
                        this.setComponents.apply(this, m); // 'm' must be row major array if isColumnMajor is false
                    }
                }
            }
            else if (!!m && typeof m.m33 === 'undefined' && typeof m.m22 !== 'undefined') {
                if (_notCopyFloatArray) {
                    this.m = m.m;
                }
                else {
                    this.m = new FloatArray(16);
                    if (_isColumnMajor === true) {
                        this.setComponents(m.m00, m.m01, m.m02, 0, m.m10, m.m11, m.m12, 0, m.m20, m.m21, m.m22, 0, 0, 0, 0, 1);
                    }
                    else {
                        this.setComponents(m.m00, m.m01, m.m02, 0, m.m10, m.m11, m.m12, 0, m.m20, m.m21, m.m22, 0, 0, 0, 0, 1); // 'm' must be row major array if isColumnMajor is false
                    }
                }
            }
            else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
                this.m = new FloatArray(16);
                var sx = m.x * m.x;
                var sy = m.y * m.y;
                var sz = m.z * m.z;
                var cx = m.y * m.z;
                var cy = m.x * m.z;
                var cz = m.x * m.y;
                var wx = m.w * m.x;
                var wy = m.w * m.y;
                var wz = m.w * m.z;
                this.setComponents(1.0 - 2.0 * (sy + sz), 2.0 * (cz - wz), 2.0 * (cy + wy), 0.0, 2.0 * (cz + wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx - wx), 0.0, 2.0 * (cy - wy), 2.0 * (cx + wx), 1.0 - 2.0 * (sx + sy), 0.0, 0.0, 0.0, 0.0, 1.0);
            }
            else {
                this.m = new FloatArray(16);
                this.identity();
            }
        }
        Matrix44.prototype.setComponents = function (m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
            this.m[0] = m00;
            this.m[4] = m01;
            this.m[8] = m02;
            this.m[12] = m03;
            this.m[1] = m10;
            this.m[5] = m11;
            this.m[9] = m12;
            this.m[13] = m13;
            this.m[2] = m20;
            this.m[6] = m21;
            this.m[10] = m22;
            this.m[14] = m23;
            this.m[3] = m30;
            this.m[7] = m31;
            this.m[11] = m32;
            this.m[15] = m33;
            return this;
        };
        Matrix44.prototype.copyComponents = function (mat4) {
            //this.m.set(mat4.m);
            //this.setComponents.apply(this, mat4.m); // 'm' must be row major array if isColumnMajor is false
            var m = mat4.m;
            this.m[0] = m[0];
            this.m[1] = m[1];
            this.m[2] = m[2];
            this.m[3] = m[3];
            this.m[4] = m[4];
            this.m[5] = m[5];
            this.m[6] = m[6];
            this.m[7] = m[7];
            this.m[8] = m[8];
            this.m[9] = m[9];
            this.m[10] = m[10];
            this.m[11] = m[11];
            this.m[12] = m[12];
            this.m[13] = m[13];
            this.m[14] = m[14];
            this.m[15] = m[15];
        };
        Object.defineProperty(Matrix44.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        Matrix44.prototype.clone = function () {
            return new Matrix44(this.m[0], this.m[4], this.m[8], this.m[12], this.m[1], this.m[5], this.m[9], this.m[13], this.m[2], this.m[6], this.m[10], this.m[14], this.m[3], this.m[7], this.m[11], this.m[15]);
        };
        /**
         * to the identity matrix
         */
        Matrix44.prototype.identity = function () {
            this.setComponents(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            return this;
        };
        /**
         * to the identity matrix（static版）
         */
        Matrix44.identity = function () {
            return new Matrix44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        Matrix44.prototype.isEqual = function (mat, delta) {
            if (delta === void 0) { delta = Number.EPSILON; }
            if (Math.abs(mat.m[0] - this.m[0]) < delta &&
                Math.abs(mat.m[1] - this.m[1]) < delta &&
                Math.abs(mat.m[2] - this.m[2]) < delta &&
                Math.abs(mat.m[3] - this.m[3]) < delta &&
                Math.abs(mat.m[4] - this.m[4]) < delta &&
                Math.abs(mat.m[5] - this.m[5]) < delta &&
                Math.abs(mat.m[6] - this.m[6]) < delta &&
                Math.abs(mat.m[7] - this.m[7]) < delta &&
                Math.abs(mat.m[8] - this.m[8]) < delta &&
                Math.abs(mat.m[9] - this.m[9]) < delta &&
                Math.abs(mat.m[10] - this.m[10]) < delta &&
                Math.abs(mat.m[11] - this.m[11]) < delta &&
                Math.abs(mat.m[12] - this.m[12]) < delta &&
                Math.abs(mat.m[13] - this.m[13]) < delta &&
                Math.abs(mat.m[14] - this.m[14]) < delta &&
                Math.abs(mat.m[15] - this.m[15]) < delta) {
                return true;
            }
            else {
                return false;
            }
        };
        Matrix44.prototype.translate = function (vec) {
            return this.setComponents(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
        };
        Matrix44.prototype.putTranslate = function (vec) {
            this.m03 = vec.x;
            this.m13 = vec.y;
            this.m23 = vec.z;
        };
        Matrix44.prototype.getTranslate = function () {
            return new Vector3(this.m03, this.m13, this.m23);
        };
        Matrix44.translate = function (vec) {
            return new Matrix44(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
        };
        Matrix44.prototype.scale = function (vec) {
            return this.setComponents(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
        };
        Matrix44.scale = function (vec) {
            return new Matrix44(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
        };
        Matrix44.prototype.addScale = function (vec) {
            this.m00 *= vec.x;
            this.m11 *= vec.y;
            this.m22 *= vec.z;
            return this;
        };
        /**
         * Create X oriented Rotation Matrix
         */
        Matrix44.prototype.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create X oriented Rotation Matrix
        */
        Matrix44.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new Matrix44(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        Matrix44.prototype.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        Matrix44.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new Matrix44(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        Matrix44.prototype.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        Matrix44.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new Matrix44(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        Matrix44.prototype.rotateXYZ = function (x, y, z) {
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
            this.m[0] = zm00 * yxm00;
            this.m[4] = zm00 * yxm01 + zm01 * yxm11;
            this.m[8] = zm00 * yxm02 + zm01 * yxm12;
            this.m[12] = 0;
            this.m[1] = zm10 * yxm00;
            this.m[5] = zm10 * yxm01 + zm11 * yxm11;
            this.m[9] = zm10 * yxm02 + zm11 * yxm12;
            this.m[13] = 0;
            this.m[2] = zm22 * yxm20;
            this.m[6] = zm22 * yxm21;
            this.m[10] = zm22 * yxm22;
            this.m[14] = 0;
            this.m[3] = 0;
            this.m[7] = 0;
            this.m[11] = 0;
            this.m[15] = 1;
            return this;
        };
        /**
         * @return Euler Angles Rotation (x, y, z)
         */
        Matrix44.prototype.toEulerAngles = function () {
            var rotate = null;
            if (Math.abs(this.m20) != 1.0) {
                var y = -Math.asin(this.m20);
                var x = Math.atan2(this.m21 / Math.cos(y), this.m22 / Math.cos(y));
                var z = Math.atan2(this.m10 / Math.cos(y), this.m00 / Math.cos(y));
                rotate = new Vector3(x, y, z);
            }
            else if (this.m20 === -1.0) {
                rotate = new Vector3(Math.atan2(this.m01, this.m02), Math.PI / 2.0, 0.0);
            }
            else {
                rotate = new Vector3(Math.atan2(-this.m01, -this.m02), -Math.PI / 2.0, 0.0);
            }
            return rotate;
        };
        /**
         * zero matrix
         */
        Matrix44.prototype.zero = function () {
            this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            return this;
        };
        Matrix44.zero = function () {
            return new Matrix44(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        };
        Matrix44.prototype.flatten = function () {
            return this.m;
        };
        Matrix44.prototype.flattenAsArray = function () {
            return [this.m[0], this.m[1], this.m[2], this.m[3],
                this.m[4], this.m[5], this.m[6], this.m[7],
                this.m[8], this.m[9], this.m[10], this.m[11],
                this.m[12], this.m[13], this.m[14], this.m[15]];
        };
        Matrix44.prototype._swap = function (l, r) {
            this.m[r] = [this.m[l], this.m[l] = this.m[r]][0]; // Swap
        };
        /**
         * transpose
         */
        Matrix44.prototype.transpose = function () {
            this._swap(1, 4);
            this._swap(2, 8);
            this._swap(3, 12);
            this._swap(6, 9);
            this._swap(7, 13);
            this._swap(11, 14);
            return this;
        };
        /**
         * transpose(static version)
         */
        Matrix44.transpose = function (mat) {
            var mat_t = new Matrix44(mat.m00, mat.m10, mat.m20, mat.m30, mat.m01, mat.m11, mat.m21, mat.m31, mat.m02, mat.m12, mat.m22, mat.m32, mat.m03, mat.m13, mat.m23, mat.m33);
            return mat_t;
        };
        Matrix44.prototype.multiplyVector = function (vec) {
            var x = this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z + this.m03 * vec.w;
            var y = this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z + this.m13 * vec.w;
            var z = this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z + this.m23 * vec.w;
            var w = this.m30 * vec.x + this.m31 * vec.y + this.m32 * vec.z + this.m33 * vec.w;
            return new Vector4(x, y, z, w);
        };
        /**
         * multiply zero matrix and zero matrix
         */
        Matrix44.prototype.multiply = function (mat) {
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
        Matrix44.prototype.multiplyByLeft = function (mat) {
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
        /**
         * multiply zero matrix and zero matrix(static version)
         */
        Matrix44.multiply = function (l_m, r_m) {
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
            return new Matrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        Matrix44.prototype.determinant = function () {
            return this.m00 * this.m11 * this.m22 * this.m33 + this.m00 * this.m12 * this.m23 * this.m31 + this.m00 * this.m13 * this.m21 * this.m32 +
                this.m01 * this.m10 * this.m23 * this.m32 + this.m01 * this.m12 * this.m20 * this.m33 + this.m01 * this.m13 * this.m22 * this.m30 +
                this.m02 * this.m10 * this.m21 * this.m33 + this.m02 * this.m11 * this.m23 * this.m30 + this.m02 * this.m13 * this.m20 * this.m31 +
                this.m03 * this.m10 * this.m22 * this.m31 + this.m03 * this.m11 * this.m20 * this.m32 + this.m03 * this.m12 * this.m21 * this.m30 -
                this.m00 * this.m11 * this.m23 * this.m32 - this.m00 * this.m12 * this.m21 * this.m33 - this.m00 * this.m13 * this.m22 * this.m31 -
                this.m01 * this.m10 * this.m22 * this.m33 - this.m01 * this.m12 * this.m23 * this.m30 - this.m01 * this.m13 * this.m20 * this.m32 -
                this.m02 * this.m10 * this.m23 * this.m31 - this.m02 * this.m11 * this.m20 * this.m33 - this.m02 * this.m13 * this.m21 * this.m30 -
                this.m03 * this.m10 * this.m21 * this.m32 - this.m03 * this.m11 * this.m22 * this.m30 - this.m03 * this.m12 * this.m20 * this.m31;
        };
        Matrix44.determinant = function (mat) {
            return mat.m00 * mat.m11 * mat.m22 * mat.m33 + mat.m00 * mat.m12 * mat.m23 * mat.m31 + mat.m00 * mat.m13 * mat.m21 * mat.m32 +
                mat.m01 * mat.m10 * mat.m23 * mat.m32 + mat.m01 * mat.m12 * mat.m20 * mat.m33 + mat.m01 * mat.m13 * mat.m22 * mat.m30 +
                mat.m02 * mat.m10 * mat.m21 * mat.m33 + mat.m02 * mat.m11 * mat.m23 * mat.m30 + mat.m02 * mat.m13 * mat.m20 * mat.m31 +
                mat.m03 * mat.m10 * mat.m22 * mat.m31 + mat.m03 * mat.m11 * mat.m20 * mat.m32 + mat.m03 * mat.m12 * mat.m21 * mat.m30 -
                mat.m00 * mat.m11 * mat.m23 * mat.m32 - mat.m00 * mat.m12 * mat.m21 * mat.m33 - mat.m00 * mat.m13 * mat.m22 * mat.m31 -
                mat.m01 * mat.m10 * mat.m22 * mat.m33 - mat.m01 * mat.m12 * mat.m23 * mat.m30 - mat.m01 * mat.m13 * mat.m20 * mat.m32 -
                mat.m02 * mat.m10 * mat.m23 * mat.m31 - mat.m02 * mat.m11 * mat.m20 * mat.m33 - mat.m02 * mat.m13 * mat.m21 * mat.m30 -
                mat.m03 * mat.m10 * mat.m21 * mat.m32 - mat.m03 * mat.m11 * mat.m22 * mat.m30 - mat.m03 * mat.m12 * mat.m20 * mat.m31;
        };
        Matrix44.prototype.invert = function () {
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
        Matrix44.invert = function (mat) {
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
            return new Matrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        Object.defineProperty(Matrix44.prototype, "m00", {
            get: function () {
                return this.m[0];
            },
            set: function (val) {
                this.m[0] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m10", {
            get: function () {
                return this.m[1];
            },
            set: function (val) {
                this.m[1] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m20", {
            get: function () {
                return this.m[2];
            },
            set: function (val) {
                this.m[2] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m30", {
            get: function () {
                return this.m[3];
            },
            set: function (val) {
                this.m[3] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m01", {
            get: function () {
                return this.m[4];
            },
            set: function (val) {
                this.m[4] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m11", {
            get: function () {
                return this.m[5];
            },
            set: function (val) {
                this.m[5] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m21", {
            get: function () {
                return this.m[6];
            },
            set: function (val) {
                this.m[6] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m31", {
            get: function () {
                return this.m[7];
            },
            set: function (val) {
                this.m[7] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m02", {
            get: function () {
                return this.m[8];
            },
            set: function (val) {
                this.m[8] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m12", {
            get: function () {
                return this.m[9];
            },
            set: function (val) {
                this.m[9] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m22", {
            get: function () {
                return this.m[10];
            },
            set: function (val) {
                this.m[10] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m32", {
            get: function () {
                return this.m[11];
            },
            set: function (val) {
                this.m[11] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m03", {
            get: function () {
                return this.m[12];
            },
            set: function (val) {
                this.m[12] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m13", {
            get: function () {
                return this.m[13];
            },
            set: function (val) {
                this.m[13] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m23", {
            get: function () {
                return this.m[14];
            },
            set: function (val) {
                this.m[14] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix44.prototype, "m33", {
            get: function () {
                return this.m[15];
            },
            set: function (val) {
                this.m[15] = val;
            },
            enumerable: true,
            configurable: true
        });
        Matrix44.prototype.toString = function () {
            return this.m00 + ' ' + this.m01 + ' ' + this.m02 + ' ' + this.m03 + ' \n' +
                this.m10 + ' ' + this.m11 + ' ' + this.m12 + ' ' + this.m13 + ' \n' +
                this.m20 + ' ' + this.m21 + ' ' + this.m22 + ' ' + this.m23 + ' \n' +
                this.m30 + ' ' + this.m31 + ' ' + this.m32 + ' ' + this.m33 + ' \n';
        };
        Matrix44.prototype.nearZeroToZero = function (value) {
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
        Matrix44.prototype.toStringApproximately = function () {
            return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + ' ' + this.nearZeroToZero(this.m03) + ' \n' +
                this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' ' + this.nearZeroToZero(this.m13) + ' \n' +
                this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + ' ' + this.nearZeroToZero(this.m23) + ' \n' +
                this.nearZeroToZero(this.m30) + ' ' + this.nearZeroToZero(this.m31) + ' ' + this.nearZeroToZero(this.m32) + ' ' + this.nearZeroToZero(this.m33) + ' \n';
        };
        Matrix44.prototype.getScale = function () {
            return new Vector3(Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02), Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12), Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22));
        };
        Matrix44.prototype.getRotate = function () {
            var quat = Quaternion.fromMatrix(this);
            var rotateMat = new Matrix44(quat);
            return rotateMat;
        };
        return Matrix44;
    }());
    //GLBoost["Matrix44"] = Matrix44;

    var RnObject = /** @class */ (function () {
        function RnObject(needToManage) {
            if (needToManage === void 0) { needToManage = false; }
            this.__objectUid = 0;
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
        RnObject.currentMaxObjectCount = 0;
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

    var AccessorBase = /** @class */ (function (_super) {
        __extends(AccessorBase, _super);
        function AccessorBase(_a) {
            var bufferView = _a.bufferView, byteOffset = _a.byteOffset, byteOffsetFromBuffer = _a.byteOffsetFromBuffer, compositionType = _a.compositionType, componentType = _a.componentType, byteStride = _a.byteStride, count = _a.count, raw = _a.raw;
            var _this = _super.call(this) || this;
            _this.__compositionType = CompositionType.Unknown;
            _this.__componentType = ComponentType.Unknown;
            _this.__count = 0;
            _this.__takenCount = 0;
            _this.__byteStride = 0;
            _this.__bufferView = bufferView;
            _this.__byteOffset = byteOffsetFromBuffer + byteOffset;
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
                if (this.__byteOffset % 8 !== 0) {
                    console.info('Padding added because of byteOffset of accessor is not 8byte aligned despite of Double precision.');
                    this.__byteOffset += 8 - this.__byteOffset % 8;
                }
            }
            if (this.__bufferView.isSoA) {
                this.__dataView = new DataView(this.__raw, this.__byteOffset, this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes() * this.__count);
            }
            else {
                this.__dataView = new DataView(this.__raw, this.__byteOffset);
            }
            this.__typedArray = new typedArrayClass(this.__raw, this.__byteOffset, this.__compositionType.getNumberOfComponents() * this.__count);
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
            var stride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
            if (this.__bufferView.isAoS) {
                stride = this.__bufferView.byteStride;
            }
            var subTypedArray = new this.__typedArrayClass(arrayBufferOfBufferView, this.__byteOffset + stride * this.__takenCount, this.__compositionType.getNumberOfComponents());
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
            return new Vector3(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian));
        };
        AccessorBase.prototype.getVec4 = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return new Vector4(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian));
        };
        AccessorBase.prototype.getMat3 = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return new Matrix33(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian), this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian), this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian), this.__dataViewGetter(this.__byteStride * index + 8, endian));
        };
        AccessorBase.prototype.getMat4 = function (index, endian) {
            if (endian === void 0) { endian = true; }
            return new Matrix44(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian), this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian), this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian), this.__dataViewGetter(this.__byteStride * index + 8, endian), this.__dataViewGetter(this.__byteStride * index + 9, endian), this.__dataViewGetter(this.__byteStride * index + 10, endian), this.__dataViewGetter(this.__byteStride * index + 11, endian), this.__dataViewGetter(this.__byteStride * index + 12, endian), this.__dataViewGetter(this.__byteStride * index + 13, endian), this.__dataViewGetter(this.__byteStride * index + 14, endian), this.__dataViewGetter(this.__byteStride * index + 15, endian));
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
        return AccessorBase;
    }(RnObject));

    var FlexibleAccessor = /** @class */ (function (_super) {
        __extends(FlexibleAccessor, _super);
        function FlexibleAccessor(_a) {
            var bufferView = _a.bufferView, byteOffset = _a.byteOffset, byteOffsetFromBuffer = _a.byteOffsetFromBuffer, compositionType = _a.compositionType, componentType = _a.componentType, byteStride = _a.byteStride, count = _a.count, raw = _a.raw;
            return _super.call(this, { bufferView: bufferView, byteOffset: byteOffset, byteOffsetFromBuffer: byteOffsetFromBuffer, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: raw }) || this;
        }
        return FlexibleAccessor;
    }(AccessorBase));

    var BufferView = /** @class */ (function (_super) {
        __extends(BufferView, _super);
        function BufferView(_a) {
            var buffer = _a.buffer, byteOffset = _a.byteOffset, byteLength = _a.byteLength, raw = _a.raw, isAoS = _a.isAoS;
            var _this = _super.call(this) || this;
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
                bufferView: this, byteOffset: byteOffset, byteOffsetFromBuffer: this.__byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw
            });
            this.__accessors.push(accessor);
            return accessor;
        };
        return BufferView;
    }(RnObject));

    var Buffer = /** @class */ (function (_super) {
        __extends(Buffer, _super);
        function Buffer(_a) {
            var byteLength = _a.byteLength, arrayBuffer = _a.arrayBuffer, name = _a.name;
            var _this = _super.call(this) || this;
            _this.__byteLength = 0;
            _this.__name = '';
            _this.__takenBytesIndex = 0;
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
            this.__buffers = new Map();
            // BufferForGPUInstanceData
            {
                var arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide * MemoryManager.bufferLengthOfOneSide /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
                var buffer = new Buffer({
                    byteLength: arrayBuffer.byteLength,
                    arrayBuffer: arrayBuffer,
                    name: 'BufferForGPUInstanceData'
                });
                this.__buffers.set(buffer.objectUid, buffer);
                this.__bufferForGPUInstanceData = buffer;
            }
            // BufferForGPUVertexData
            {
                var arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide * MemoryManager.bufferLengthOfOneSide /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
                var buffer = new Buffer({
                    byteLength: arrayBuffer.byteLength,
                    arrayBuffer: arrayBuffer,
                    name: 'BufferForGPUVertexData'
                });
                this.__buffers.set(buffer.objectUid, buffer);
                this.__bufferForGPUVertexData = buffer;
            }
            // BufferForCPU
            {
                var arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide * MemoryManager.bufferLengthOfOneSide /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
                var buffer = new Buffer({
                    byteLength: arrayBuffer.byteLength,
                    arrayBuffer: arrayBuffer,
                    name: 'BufferForCPU'
                });
                this.__buffers.set(buffer.objectUid, buffer);
                this.__bufferForCPU = buffer;
            }
        }
        MemoryManager.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new MemoryManager();
            }
            return this.__instance;
        };
        MemoryManager.prototype.getBufferForGPUInstanceData = function () {
            return this.__bufferForGPUInstanceData;
        };
        MemoryManager.prototype.getBufferForGPUVertexData = function () {
            return this.__bufferForGPUVertexData;
        };
        MemoryManager.prototype.getBufferForCPU = function () {
            return this.__bufferForCPU;
        };
        Object.defineProperty(MemoryManager, "bufferLengthOfOneSide", {
            get: function () {
                return MemoryManager.__bufferLengthOfOneSide;
            },
            enumerable: true,
            configurable: true
        });
        MemoryManager.__bufferLengthOfOneSide = Math.pow(2, 10);
        return MemoryManager;
    }());

    var Component = /** @class */ (function () {
        function Component(entityUid, componentSid) {
            this.__entityUid = entityUid;
            this._component_sid = componentSid;
            this.__isAlive = true;
            this.__memoryManager = MemoryManager.getInstance();
            this.__entityRepository = EntityRepository.getInstance();
        }
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
        Object.defineProperty(Component, "byteSizeOfThisComponent", {
            get: function () {
                return 0;
            },
            enumerable: true,
            configurable: true
        });
        Component.setupBufferView = function () {
        };
        Component.prototype.registerDependency = function (component, isMust) {
        };
        return Component;
    }());

    // import AnimationComponent from './AnimationComponent';
    var TransformComponent = /** @class */ (function (_super) {
        __extends(TransformComponent, _super);
        function TransformComponent(entityUid, componentSid) {
            var _this = _super.call(this, entityUid, componentSid) || this;
            // dependencies
            _this._dependentAnimationComponentId = 0;
            var thisClass = TransformComponent;
            _this._translate = Vector3.zero();
            _this._rotate = Vector3.zero();
            _this._scale = new Vector3(1, 1, 1);
            _this._quaternion = new Quaternion(thisClass.__accesseor_quaternion.takeOne());
            _this._quaternion.identity();
            _this._matrix = new Matrix44(thisClass.__accesseor_matrix.takeOne(), false, true);
            _this._matrix.identity();
            _this._invMatrix = Matrix44.identity();
            _this._normalMatrix = Matrix33.identity();
            _this._is_translate_updated = true;
            _this._is_euler_angles_updated = true;
            _this._is_scale_updated = true;
            _this._is_quaternion_updated = true;
            _this._is_trs_matrix_updated = true;
            _this._is_inverse_trs_matrix_updated = true;
            _this._is_normal_trs_matrix_updated = true;
            _this._updateCount = 0;
            _this._dirty = true;
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
        Object.defineProperty(TransformComponent, "byteSizeOfThisComponent", {
            get: function () {
                return 160;
            },
            enumerable: true,
            configurable: true
        });
        TransformComponent.setupBufferView = function () {
            var thisClass = TransformComponent;
            var buffer = MemoryManager.getInstance().getBufferForCPU();
            var count = EntityRepository.getMaxEntityNumber();
            thisClass.__bufferView = buffer.takeBufferView({ byteLengthToNeed: thisClass.byteSizeOfThisComponent * count, byteStride: 0, isAoS: false });
            // accessors
            thisClass.__accesseor_matrix = thisClass.__bufferView.takeAccessor({ compositionType: CompositionType.Mat4, componentType: ComponentType.Double, count: count });
            thisClass.__accesseor_quaternion = thisClass.__bufferView.takeAccessor({ compositionType: CompositionType.Vec4, componentType: ComponentType.Double, count: count });
        };
        TransformComponent.prototype.$create = function () {
            // Define process dependencies with other components.
            // If circular depenencies are detected, the error will be repoated.
            //this.registerDependency(AnimationComponent.componentTID, false);
        };
        TransformComponent.prototype.$updateLogic = function () {
        };
        TransformComponent.prototype._needUpdate = function () {
            this._updateCount++;
            this._dirty = true;
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
                    this._translate.x = this._matrix.m03;
                    this._translate.y = this._matrix.m13;
                    this._translate.z = this._matrix.m23;
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
                    this._rotate = (new Matrix44(this._quaternion)).toEulerAngles();
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
                    this._scale.x = Math.sqrt(m.m00 * m.m00 + m.m01 * m.m01 + m.m02 * m.m02);
                    this._scale.y = Math.sqrt(m.m10 * m.m10 + m.m11 * m.m11 + m.m12 * m.m12);
                    this._scale.z = Math.sqrt(m.m20 * m.m20 + m.m21 * m.m21 + m.m22 * m.m22);
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
                this._matrix = mat.clone();
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
                var n11 = scale.v[1];
                var n22 = scale.v[2];
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
                var m10 = 2.0 * (cz + wz);
                var m11 = 1.0 - 2.0 * (sx + sz);
                var m12 = 2.0 * (cx - wx);
                var m20 = 2.0 * (cy - wy);
                var m21 = 2.0 * (cx + wx);
                var m22 = 1.0 - 2.0 * (sx + sy);
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
                    this._invMatrix = this.matrix.invert();
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
                    this._normalMatrix = new Matrix33(Matrix44.invert(this.matrix).transpose());
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
                this._matrix = matrix.clone();
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
                this._quaternion = quaternion.clone();
                this._is_euler_angles_updated = true;
                this._is_quaternion_updated = true;
            }
            else if (rotate != null) {
                this._rotate = rotate.clone();
                this._is_euler_angles_updated = true;
                this._is_quaternion_updated = false;
            }
            else if (quaternion != null) {
                this._quaternion = quaternion.clone();
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
            this.__updateRotation();
            this.__updateTranslate();
            this.__updateScale();
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
                this._rotate = (new Matrix44(this._quaternion)).toEulerAngles();
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
                this._translate.x = m.m03;
                this._translate.y = m.m13;
                this._translate.z = m.m23;
                this._is_translate_updated = true;
            }
        };
        TransformComponent.prototype.__updateScale = function () {
            if (!this._is_scale_updated && this._is_trs_matrix_updated) {
                var m = this._matrix;
                this._scale.x = Math.sqrt(m.m00 * m.m00 + m.m01 * m.m01 + m.m02 * m.m02);
                this._scale.y = Math.sqrt(m.m10 * m.m10 + m.m11 * m.m11 + m.m12 * m.m12);
                this._scale.z = Math.sqrt(m.m20 * m.m20 + m.m21 * m.m21 + m.m22 * m.m22);
                this._is_scale_updated = true;
            }
        };
        TransformComponent.prototype.__updateMatrix = function () {
            if (!this._is_trs_matrix_updated && this._is_translate_updated && this._is_quaternion_updated && this._is_scale_updated) {
                var rotationMatrix = new Matrix44(this._quaternion);
                var scale = this._scale;
                this._matrix = Matrix44.multiply(rotationMatrix, Matrix44.scale(scale));
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
                        this[key] = new Quaternion(json[key]);
                    }
                    else if (key === 'matrix') {
                        this[key] = new Matrix44(json[key]);
                    }
                    else {
                        this[key] = new Vector3(json[key]);
                    }
                }
            }
        };
        TransformComponent.prototype.setRotationFromNewUpAndFront = function (UpVec, FrontVec) {
            var yDir = UpVec;
            var xDir = Vector3.cross(yDir, FrontVec);
            var zDir = Vector3.cross(xDir, yDir);
            var rotateMatrix = Matrix44.identity();
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
            var fromDir = Vector3.normalize(fromVec);
            var toDir = Vector3.normalize(toVec);
            var rotationDir = Vector3.cross(fromDir, toDir);
            var cosTheta = Vector3.dotProduct(fromDir, toDir);
            var theta = Math.acos(cosTheta);
            this.quaternion = Quaternion.axisAngle(rotationDir, theta);
        };
        Object.defineProperty(TransformComponent.prototype, "rotateMatrix44", {
            get: function () {
                return new Matrix44(this.quaternion);
            },
            set: function (rotateMatrix) {
                this.quaternion.fromMatrix(rotateMatrix);
            },
            enumerable: true,
            configurable: true
        });
        TransformComponent.__tmpMat_updateRotation = Matrix44.identity();
        TransformComponent.__tmpMat_quaternionInner = Matrix44.identity();
        return TransformComponent;
    }(Component));
    ComponentRepository.registerComponentClass(TransformComponent.componentTID, TransformComponent);
    TransformComponent.setupBufferView();

    //import GLBoost from '../../globals';
    var FloatArray$1 = Float32Array;
    var RowMajarMatrix44 = /** @class */ (function () {
        function RowMajarMatrix44(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, notCopyFloatArray) {
            if (notCopyFloatArray === void 0) { notCopyFloatArray = false; }
            var _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m1;
            var m = m0;
            if (arguments.length >= 16) {
                this.m = new FloatArray$1(16); // Data order is row major
                this.setComponents.apply(this, arguments);
            }
            else if (Array.isArray(m)) {
                this.m = new FloatArray$1(16);
                this.setComponents.apply(this, m);
            }
            else if (m instanceof FloatArray$1) {
                if (_notCopyFloatArray) {
                    this.m = m;
                }
                else {
                    this.m = new FloatArray$1(16);
                    this.setComponents.apply(this, m); // 'm' must be row major array if isColumnMajor is false
                }
            }
            else if (!!m && typeof m.m33 === 'undefined' && typeof m.m22 !== 'undefined') {
                if (_notCopyFloatArray) {
                    this.m = m.m;
                }
                else {
                    this.m = new FloatArray$1(16);
                    this.setComponents(m.m00, m.m01, m.m02, 0, m.m10, m.m11, m.m12, 0, m.m20, m.m21, m.m22, 0, 0, 0, 0, 1); // 'm' must be row major array if isColumnMajor is false
                }
            }
            else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
                this.m = new FloatArray$1(16);
                var sx = m.x * m.x;
                var sy = m.y * m.y;
                var sz = m.z * m.z;
                var cx = m.y * m.z;
                var cy = m.x * m.z;
                var cz = m.x * m.y;
                var wx = m.w * m.x;
                var wy = m.w * m.y;
                var wz = m.w * m.z;
                this.setComponents(1.0 - 2.0 * (sy + sz), 2.0 * (cz - wz), 2.0 * (cy + wy), 0.0, 2.0 * (cz + wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx - wx), 0.0, 2.0 * (cy - wy), 2.0 * (cx + wx), 1.0 - 2.0 * (sx + sy), 0.0, 0.0, 0.0, 0.0, 1.0);
            }
            else {
                this.m = new FloatArray$1(16);
                this.identity();
            }
        }
        RowMajarMatrix44.prototype.setComponents = function (m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
            this.m[0] = m00;
            this.m[4] = m10;
            this.m[8] = m20;
            this.m[12] = m30;
            this.m[1] = m01;
            this.m[5] = m11;
            this.m[9] = m21;
            this.m[13] = m31;
            this.m[2] = m02;
            this.m[6] = m12;
            this.m[10] = m22;
            this.m[14] = m32;
            this.m[3] = m03;
            this.m[7] = m13;
            this.m[11] = m23;
            this.m[15] = m33;
            return this;
        };
        RowMajarMatrix44.prototype.copyComponents = function (mat4) {
            //this.m.set(mat4.m);
            //this.setComponents.apply(this, mat4.m); // 'm' must be row major array if isColumnMajor is false    
            var m = mat4;
            // this.m[0] = m[0];
            // this.m[1] = m[1];
            // this.m[2] = m[2];
            // this.m[3] = m[3];
            // this.m[4] = m[4];
            // this.m[5] = m[5];
            // this.m[6] = m[6];
            // this.m[7] = m[7];
            // this.m[8] = m[8];
            // this.m[9] = m[9];
            // this.m[10] = m[10];
            // this.m[11] = m[11];
            // this.m[12] = m[12];
            // this.m[13] = m[13];
            // this.m[14] = m[14];
            // this.m[15] = m[15];
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
        Object.defineProperty(RowMajarMatrix44.prototype, "className", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        RowMajarMatrix44.prototype.clone = function () {
            return new RowMajarMatrix44(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5], this.m[6], this.m[7], this.m[8], this.m[9], this.m[10], this.m[11], this.m[12], this.m[13], this.m[14], this.m[15]);
        };
        /**
         * to the identity matrix
         */
        RowMajarMatrix44.prototype.identity = function () {
            this.setComponents(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            return this;
        };
        /**
         * to the identity matrix（static版）
         */
        RowMajarMatrix44.identity = function () {
            return new RowMajarMatrix44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        RowMajarMatrix44.prototype.isEqual = function (mat, delta) {
            if (delta === void 0) { delta = Number.EPSILON; }
            if (Math.abs(mat.m[0] - this.m[0]) < delta &&
                Math.abs(mat.m[1] - this.m[1]) < delta &&
                Math.abs(mat.m[2] - this.m[2]) < delta &&
                Math.abs(mat.m[3] - this.m[3]) < delta &&
                Math.abs(mat.m[4] - this.m[4]) < delta &&
                Math.abs(mat.m[5] - this.m[5]) < delta &&
                Math.abs(mat.m[6] - this.m[6]) < delta &&
                Math.abs(mat.m[7] - this.m[7]) < delta &&
                Math.abs(mat.m[8] - this.m[8]) < delta &&
                Math.abs(mat.m[9] - this.m[9]) < delta &&
                Math.abs(mat.m[10] - this.m[10]) < delta &&
                Math.abs(mat.m[11] - this.m[11]) < delta &&
                Math.abs(mat.m[12] - this.m[12]) < delta &&
                Math.abs(mat.m[13] - this.m[13]) < delta &&
                Math.abs(mat.m[14] - this.m[14]) < delta &&
                Math.abs(mat.m[15] - this.m[15]) < delta) {
                return true;
            }
            else {
                return false;
            }
        };
        RowMajarMatrix44.prototype.translate = function (vec) {
            return this.setComponents(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
        };
        RowMajarMatrix44.prototype.putTranslate = function (vec) {
            this.m03 = vec.x;
            this.m13 = vec.y;
            this.m23 = vec.z;
        };
        RowMajarMatrix44.prototype.getTranslate = function () {
            return new Vector3(this.m03, this.m13, this.m23);
        };
        RowMajarMatrix44.translate = function (vec) {
            return new RowMajarMatrix44(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
        };
        RowMajarMatrix44.prototype.scale = function (vec) {
            return this.setComponents(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
        };
        RowMajarMatrix44.scale = function (vec) {
            return new RowMajarMatrix44(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
        };
        RowMajarMatrix44.prototype.addScale = function (vec) {
            this.m00 *= vec.x;
            this.m11 *= vec.y;
            this.m22 *= vec.z;
            return this;
        };
        /**
         * Create X oriented Rotation Matrix
         */
        RowMajarMatrix44.prototype.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create X oriented Rotation Matrix
        */
        RowMajarMatrix44.rotateX = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new RowMajarMatrix44(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        RowMajarMatrix44.prototype.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Y oriented Rotation Matrix
         */
        RowMajarMatrix44.rotateY = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new RowMajarMatrix44(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        RowMajarMatrix44.prototype.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.setComponents(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        /**
         * Create Z oriented Rotation Matrix
         */
        RowMajarMatrix44.rotateZ = function (radian) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return new RowMajarMatrix44(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        };
        RowMajarMatrix44.prototype.rotateXYZ = function (x, y, z) {
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
            this.m[0] = zm00 * yxm00;
            this.m[1] = zm00 * yxm01 + zm01 * yxm11;
            this.m[2] = zm00 * yxm02 + zm01 * yxm12;
            this.m[3] = 0;
            this.m[4] = zm10 * yxm00;
            this.m[5] = zm10 * yxm01 + zm11 * yxm11;
            this.m[6] = zm10 * yxm02 + zm11 * yxm12;
            this.m[7] = 0;
            this.m[8] = zm22 * yxm20;
            this.m[9] = zm22 * yxm21;
            this.m[10] = zm22 * yxm22;
            this.m[11] = 0;
            this.m[12] = 0;
            this.m[13] = 0;
            this.m[14] = 0;
            this.m[15] = 1;
            return this;
            //return new RowMajarMatrix44(Matrix33.rotateXYZ(x, y, z));
        };
        /**
         * @return Euler Angles Rotation (x, y, z)
         */
        RowMajarMatrix44.prototype.toEulerAngles = function () {
            var rotate = null;
            if (Math.abs(this.m20) != 1.0) {
                var y = -Math.asin(this.m20);
                var x = Math.atan2(this.m21 / Math.cos(y), this.m22 / Math.cos(y));
                var z = Math.atan2(this.m10 / Math.cos(y), this.m00 / Math.cos(y));
                rotate = new Vector3(x, y, z);
            }
            else if (this.m20 === -1.0) {
                rotate = new Vector3(Math.atan2(this.m01, this.m02), Math.PI / 2.0, 0.0);
            }
            else {
                rotate = new Vector3(Math.atan2(-this.m01, -this.m02), -Math.PI / 2.0, 0.0);
            }
            return rotate;
        };
        /**
         * ゼロ行列
         */
        RowMajarMatrix44.prototype.zero = function () {
            this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            return this;
        };
        RowMajarMatrix44.zero = function () {
            return new RowMajarMatrix44(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        };
        RowMajarMatrix44.prototype.flatten = function () {
            return this.m;
        };
        RowMajarMatrix44.prototype.flattenAsArray = function () {
            return [this.m[0], this.m[1], this.m[2], this.m[3],
                this.m[4], this.m[5], this.m[6], this.m[7],
                this.m[8], this.m[9], this.m[10], this.m[11],
                this.m[12], this.m[13], this.m[14], this.m[15]];
        };
        RowMajarMatrix44.prototype._swap = function (l, r) {
            this.m[r] = [this.m[l], this.m[l] = this.m[r]][0]; // Swap
        };
        /**
         * transpose
         */
        RowMajarMatrix44.prototype.transpose = function () {
            this._swap(1, 4);
            this._swap(2, 8);
            this._swap(3, 12);
            this._swap(6, 9);
            this._swap(7, 13);
            this._swap(11, 14);
            return this;
        };
        /**
         * transpose(static version)
         */
        RowMajarMatrix44.transpose = function (mat) {
            var mat_t = new RowMajarMatrix44(mat.m00, mat.m10, mat.m20, mat.m30, mat.m01, mat.m11, mat.m21, mat.m31, mat.m02, mat.m12, mat.m22, mat.m32, mat.m03, mat.m13, mat.m23, mat.m33);
            return mat_t;
        };
        RowMajarMatrix44.prototype.multiplyVector = function (vec) {
            var x = this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z + this.m03 * vec.w;
            var y = this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z + this.m13 * vec.w;
            var z = this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z + this.m23 * vec.w;
            var w = this.m30 * vec.x + this.m31 * vec.y + this.m32 * vec.z + this.m33 * vec.w;
            return new Vector4(x, y, z, w);
        };
        /**
         * multiply zero matrix and zero matrix
         */
        RowMajarMatrix44.prototype.multiply = function (mat) {
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
        RowMajarMatrix44.prototype.multiplyByLeft = function (mat) {
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
        /**
         * multiply zero matrix and zero matrix(static version)
         */
        RowMajarMatrix44.multiply = function (l_m, r_m) {
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
            return new RowMajarMatrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        RowMajarMatrix44.prototype.determinant = function () {
            return this.m00 * this.m11 * this.m22 * this.m33 + this.m00 * this.m12 * this.m23 * this.m31 + this.m00 * this.m13 * this.m21 * this.m32 +
                this.m01 * this.m10 * this.m23 * this.m32 + this.m01 * this.m12 * this.m20 * this.m33 + this.m01 * this.m13 * this.m22 * this.m30 +
                this.m02 * this.m10 * this.m21 * this.m33 + this.m02 * this.m11 * this.m23 * this.m30 + this.m02 * this.m13 * this.m20 * this.m31 +
                this.m03 * this.m10 * this.m22 * this.m31 + this.m03 * this.m11 * this.m20 * this.m32 + this.m03 * this.m12 * this.m21 * this.m30 -
                this.m00 * this.m11 * this.m23 * this.m32 - this.m00 * this.m12 * this.m21 * this.m33 - this.m00 * this.m13 * this.m22 * this.m31 -
                this.m01 * this.m10 * this.m22 * this.m33 - this.m01 * this.m12 * this.m23 * this.m30 - this.m01 * this.m13 * this.m20 * this.m32 -
                this.m02 * this.m10 * this.m23 * this.m31 - this.m02 * this.m11 * this.m20 * this.m33 - this.m02 * this.m13 * this.m21 * this.m30 -
                this.m03 * this.m10 * this.m21 * this.m32 - this.m03 * this.m11 * this.m22 * this.m30 - this.m03 * this.m12 * this.m20 * this.m31;
        };
        RowMajarMatrix44.determinant = function (mat) {
            return mat.m00 * mat.m11 * mat.m22 * mat.m33 + mat.m00 * mat.m12 * mat.m23 * mat.m31 + mat.m00 * mat.m13 * mat.m21 * mat.m32 +
                mat.m01 * mat.m10 * mat.m23 * mat.m32 + mat.m01 * mat.m12 * mat.m20 * mat.m33 + mat.m01 * mat.m13 * mat.m22 * mat.m30 +
                mat.m02 * mat.m10 * mat.m21 * mat.m33 + mat.m02 * mat.m11 * mat.m23 * mat.m30 + mat.m02 * mat.m13 * mat.m20 * mat.m31 +
                mat.m03 * mat.m10 * mat.m22 * mat.m31 + mat.m03 * mat.m11 * mat.m20 * mat.m32 + mat.m03 * mat.m12 * mat.m21 * mat.m30 -
                mat.m00 * mat.m11 * mat.m23 * mat.m32 - mat.m00 * mat.m12 * mat.m21 * mat.m33 - mat.m00 * mat.m13 * mat.m22 * mat.m31 -
                mat.m01 * mat.m10 * mat.m22 * mat.m33 - mat.m01 * mat.m12 * mat.m23 * mat.m30 - mat.m01 * mat.m13 * mat.m20 * mat.m32 -
                mat.m02 * mat.m10 * mat.m23 * mat.m31 - mat.m02 * mat.m11 * mat.m20 * mat.m33 - mat.m02 * mat.m13 * mat.m21 * mat.m30 -
                mat.m03 * mat.m10 * mat.m21 * mat.m32 - mat.m03 * mat.m11 * mat.m22 * mat.m30 - mat.m03 * mat.m12 * mat.m20 * mat.m31;
        };
        RowMajarMatrix44.prototype.invert = function () {
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
        RowMajarMatrix44.invert = function (mat) {
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
            return new RowMajarMatrix44(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
        };
        Object.defineProperty(RowMajarMatrix44.prototype, "m00", {
            get: function () {
                return this.m[0];
            },
            set: function (val) {
                this.m[0] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m01", {
            get: function () {
                return this.m[1];
            },
            set: function (val) {
                this.m[1] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m02", {
            get: function () {
                return this.m[2];
            },
            set: function (val) {
                this.m[2] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m03", {
            get: function () {
                return this.m[3];
            },
            set: function (val) {
                this.m[3] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m10", {
            get: function () {
                return this.m[4];
            },
            set: function (val) {
                this.m[4] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m11", {
            get: function () {
                return this.m[5];
            },
            set: function (val) {
                this.m[5] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m12", {
            get: function () {
                return this.m[6];
            },
            set: function (val) {
                this.m[6] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m13", {
            get: function () {
                return this.m[7];
            },
            set: function (val) {
                this.m[7] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m20", {
            get: function () {
                return this.m[8];
            },
            set: function (val) {
                this.m[8] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m21", {
            get: function () {
                return this.m[9];
            },
            set: function (val) {
                this.m[9] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m22", {
            get: function () {
                return this.m[10];
            },
            set: function (val) {
                this.m[10] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m23", {
            get: function () {
                return this.m[11];
            },
            set: function (val) {
                this.m[11] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m30", {
            get: function () {
                return this.m[12];
            },
            set: function (val) {
                this.m[12] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m31", {
            get: function () {
                return this.m[13];
            },
            set: function (val) {
                this.m[13] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m32", {
            get: function () {
                return this.m[14];
            },
            set: function (val) {
                this.m[14] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RowMajarMatrix44.prototype, "m33", {
            get: function () {
                return this.m[15];
            },
            set: function (val) {
                this.m[15] = val;
            },
            enumerable: true,
            configurable: true
        });
        RowMajarMatrix44.prototype.toString = function () {
            return this.m00 + ' ' + this.m01 + ' ' + this.m02 + ' ' + this.m03 + ' \n' +
                this.m10 + ' ' + this.m11 + ' ' + this.m12 + ' ' + this.m13 + ' \n' +
                this.m20 + ' ' + this.m21 + ' ' + this.m22 + ' ' + this.m23 + ' \n' +
                this.m30 + ' ' + this.m31 + ' ' + this.m32 + ' ' + this.m33 + ' \n';
        };
        RowMajarMatrix44.prototype.nearZeroToZero = function (value) {
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
        RowMajarMatrix44.prototype.toStringApproximately = function () {
            return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + ' ' + this.nearZeroToZero(this.m03) + ' \n' +
                this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' ' + this.nearZeroToZero(this.m13) + ' \n' +
                this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + ' ' + this.nearZeroToZero(this.m23) + ' \n' +
                this.nearZeroToZero(this.m30) + ' ' + this.nearZeroToZero(this.m31) + ' ' + this.nearZeroToZero(this.m32) + ' ' + this.nearZeroToZero(this.m33) + ' \n';
        };
        RowMajarMatrix44.prototype.getScale = function () {
            return new Vector3(Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02), Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12), Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22));
        };
        RowMajarMatrix44.prototype.getRotate = function () {
            var quat = Quaternion.fromMatrix(this);
            var rotateMat = new RowMajarMatrix44(quat);
            return rotateMat;
        };
        return RowMajarMatrix44;
    }());

    var SceneGraphComponent = /** @class */ (function (_super) {
        __extends(SceneGraphComponent, _super);
        function SceneGraphComponent(entityUid, componentSid) {
            var _this = _super.call(this, entityUid, componentSid) || this;
            var thisClass = SceneGraphComponent;
            _this.__isAbleToBeParent = false;
            _this.beAbleToBeParent(true);
            _this.__worldMatrix = new RowMajarMatrix44(thisClass.__accesseor_worldMatrix.takeOne(), true);
            _this.__worldMatrix.identity();
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
        Object.defineProperty(SceneGraphComponent, "byteSizeOfThisComponent", {
            get: function () {
                return 128;
            },
            enumerable: true,
            configurable: true
        });
        SceneGraphComponent.setupBufferView = function () {
            var thisClass = SceneGraphComponent;
            var buffer = MemoryManager.getInstance().getBufferForGPUInstanceData();
            var count = EntityRepository.getMaxEntityNumber();
            thisClass.__bufferView = buffer.takeBufferView({ byteLengthToNeed: thisClass.byteSizeOfThisComponent * count, byteStride: 0, isAoS: false });
            thisClass.__accesseor_worldMatrix = thisClass.__bufferView.takeAccessor({ compositionType: CompositionType.Mat4, componentType: ComponentType.Float, count: count });
        };
        SceneGraphComponent.getWorldMatrixAccessor = function () {
            return SceneGraphComponent.__accesseor_worldMatrix;
        };
        SceneGraphComponent.prototype.beAbleToBeParent = function (flag) {
            this.__isAbleToBeParent = flag;
            if (this.__isAbleToBeParent) {
                this.__children = [];
            }
            else {
                this.__children = void 0;
            }
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
                return this.calcWorldMatrixRecursively();
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
            this.calcWorldMatrixRecursively();
        };
        SceneGraphComponent.prototype.calcWorldMatrixRecursively = function () {
            var entity = this.__entityRepository.getEntity(this.__entityUid);
            var transform = entity.getTransform();
            if (this.__parent == null) {
                // if there is not parent
                if (transform._dirty) {
                    transform._dirty = false;
                    this.__worldMatrix.copyComponents(transform.matrixInner);
                    //        console.log('No Skip!', this.__worldMatrix.toString(), this.__entityUid);
                }
                return this.__worldMatrix;
            }
            var matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
            this.__worldMatrix.multiplyByLeft(matrixFromAncestorToParent);
            return this.__worldMatrix;
        };
        return SceneGraphComponent;
    }(Component));
    ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);
    SceneGraphComponent.setupBufferView();

    var MeshComponent = /** @class */ (function (_super) {
        __extends(MeshComponent, _super);
        function MeshComponent(entityUid, componentSid) {
            var _this = _super.call(this, entityUid, componentSid) || this;
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

    var MeshRendererComponent = /** @class */ (function (_super) {
        __extends(MeshRendererComponent, _super);
        function MeshRendererComponent(entityUid, componentSid) {
            var _this = _super.call(this, entityUid, componentSid) || this;
            _this.__webglResourceRepository = WebGLResourceRepository.getInstance();
            _this.__vertexHandles = [];
            _this.__isVAOSet = false;
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
        MeshRendererComponent.prototype.$create = function () {
            if (this.__meshComponent != null) {
                return;
            }
            this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent.componentTID);
        };
        MeshRendererComponent.prototype.$load = function () {
            if (this.__isLoaded(0)) {
                return;
            }
            var primitiveNum = this.__meshComponent.getPrimitiveNumber();
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = this.__meshComponent.getPrimitiveAt(i);
                var vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
                this.__vertexHandles[i] = vertexHandles;
                MeshRendererComponent.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles);
                // let vertexShader = GLSLShader.vertexShaderWebGL1;
                // let fragmentShader = GLSLShader.fragmentShaderWebGL1;
                // if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
                //   vertexShader = GLSLShader.vertexShaderWebGL2;
                //   fragmentShader = GLSLShader.fragmentShaderWebGL2;
                // }
                // const shaderProgramHandle = this.__webglResourceRepository.createShaderProgram(
                //   vertexShader,
                //   fragmentShader,
                //   GLSLShader.attributeNanes,
                //   GLSLShader.attributeSemantics
                // );
                // //this.__vertexShaderProgramHandles[i] = shaderProgramHandle;
                // MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.set(primitive.objectUid, shaderProgramHandle);
            }
        };
        MeshRendererComponent.prototype.$prerender = function (args) {
            if (this.__isVAOSet) {
                return;
            }
            var instanceIDBufferUid = args[0];
            var primitiveNum = this.__meshComponent.getPrimitiveNumber();
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = this.__meshComponent.getPrimitiveAt(i);
                // if (this.__isLoaded(i) && this.__isVAOSet) {
                this.__vertexHandles[i] = MeshRendererComponent.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUid);
                //this.__vertexShaderProgramHandles[i] = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
                //  continue;
                // }
                this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
            }
            this.__isVAOSet = true;
        };
        MeshRendererComponent.__vertexHandleOfPrimitiveObjectUids = new Map();
        MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids = new Map();
        return MeshRendererComponent;
    }(Component));
    ComponentRepository.registerComponentClass(MeshRendererComponent.componentTID, MeshRendererComponent);

    var Primitive = /** @class */ (function (_super) {
        __extends(Primitive, _super);
        function Primitive(attributeCompositionTypes, attributeComponentTypes, attributeAccessors, attributeSemantics, mode, material, attributesBufferView, indicesComponentType, indicesAccessor, indicesBufferView) {
            var _this = _super.call(this) || this;
            _this.__indices = indicesAccessor;
            _this.__attributeCompositionTypes = attributeCompositionTypes;
            _this.__attributeComponentTypes = attributeComponentTypes;
            _this.__attributes = attributeAccessors;
            _this.__attributeSemantics = attributeSemantics;
            _this.__material = material;
            _this.__mode = mode;
            _this.__indicesBufferView = indicesBufferView;
            _this.__attributesBufferView = attributesBufferView;
            _this.__indicesComponentType = indicesComponentType;
            return _this;
        }
        Primitive.createPrimitive = function (_a) {
            var indices = _a.indices, attributeCompositionTypes = _a.attributeCompositionTypes, attributeSemantics = _a.attributeSemantics, attributes = _a.attributes, material = _a.material, primitiveMode = _a.primitiveMode;
            var buffer = MemoryManager.getInstance().getBufferForGPUVertexData();
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
            return new Primitive(attributeCompositionTypes, attributeComponentTypes, attributeAccessors, attributeSemantics, primitiveMode, material, attributesBufferView, indicesComponentType, indicesAccessor, indicesBufferView);
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
                return this.__attributeCompositionTypes;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Primitive.prototype, "attributeComponentTypes", {
            get: function () {
                return this.__attributeComponentTypes;
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
    var Unknown$3 = new PrimitiveModeClass({ index: -1, str: 'UNKNOWN' });
    var Points = new PrimitiveModeClass({ index: 0, str: 'POINTS' });
    var Lines = new PrimitiveModeClass({ index: 1, str: 'LINES' });
    var LineLoop = new PrimitiveModeClass({ index: 2, str: 'LINE_LOOP' });
    var LineStrip = new PrimitiveModeClass({ index: 3, str: 'LINE_STRIP' });
    var Triangles = new PrimitiveModeClass({ index: 4, str: 'TRIANGLES' });
    var TriangleStrip = new PrimitiveModeClass({ index: 5, str: 'TRIANGLE_STRIP' });
    var TriangleFan = new PrimitiveModeClass({ index: 6, str: 'TRIANGLE_FAN' });
    var typeList$4 = [Unknown$3, Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan];
    function from$4(_a) {
        var index = _a.index;
        return _from({ typeList: typeList$4, index: index });
    }
    var PrimitiveMode = Object.freeze({ Unknown: Unknown$3, Points: Points, Lines: Lines, LineLoop: LineLoop, LineStrip: LineStrip, Triangles: Triangles, TriangleStrip: TriangleStrip, TriangleFan: TriangleFan, from: from$4 });

    var GLSLShader = /** @class */ (function () {
        function GLSLShader() {
        }
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
        Object.defineProperty(GLSLShader, "vertexShaderMethodDefinitions_dataTexture", {
            get: function () {
                var _texture = this.glsl_texture;
                return "\nuniform sampler2D u_dataTexture;\n/*\n * This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885\n * arg = vec2(1. / size.x, 1. / size.x / size.y);\n */\n// vec4 fetchElement(sampler2D tex, float index, vec2 arg)\n// {\n//   return " + _texture + "( tex, arg * (index + 0.5) );\n// }\n\nvec4 fetchElement(sampler2D tex, float index, vec2 invSize)\n{\n  float t = (index + 0.5) * invSize.x;\n  float x = fract(t);\n  float y = (floor(t) + 0.5) * invSize.y;\n  return " + _texture + "( tex, vec2(x, y) );\n}\n\nmat4 getMatrix(float instanceId)\n{\n  float index = instanceId - 1.0;\n  float powVal = " + MemoryManager.bufferLengthOfOneSide + ".0;\n  vec2 arg = vec2(1.0/powVal, 1.0/powVal);\n//  vec2 arg = vec2(1.0/powVal, 1.0/powVal/powVal);\n\n  vec4 col0 = fetchElement(u_dataTexture, index * 4.0 + 0.0, arg);\n vec4 col1 = fetchElement(u_dataTexture, index * 4.0 + 1.0, arg);\n vec4 col2 = fetchElement(u_dataTexture, index * 4.0 + 2.0, arg);\n\n  mat4 matrix = mat4(\n    col0.x, col1.x, col2.x, 0.0,\n    col0.y, col1.y, col2.y, 0.0,\n    col0.z, col1.z, col2.z, 0.0,\n    col0.w, col1.w, col2.w, 1.0\n    );\n\n  return matrix;\n}\n";
            },
            enumerable: true,
            configurable: true
        });
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
        Object.defineProperty(GLSLShader, "vertexShaderDataTexture", {
            get: function () {
                return GLSLShader.vertexShaderVariableDefinitions + GLSLShader.vertexShaderMethodDefinitions_dataTexture + GLSLShader.vertexShaderBody;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLSLShader, "vertexShaderUBO", {
            get: function () {
                return GLSLShader.vertexShaderVariableDefinitions + GLSLShader.vertexShaderMethodDefinitions_UBO + GLSLShader.vertexShaderBody;
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
        GLSLShader.vertexShaderMethodDefinitions_UBO = "layout (std140) uniform matrix {\n  mat4 world[1024];\n} u_matrix;\n\nmat4 getMatrix(float instanceId) {\n  float index = instanceId - 1.0;\n  return transpose(u_matrix.world[int(index)]);\n}\n  ";
        GLSLShader.vertexShaderBody = "\n\n\nvoid main ()\n{\n  mat4 matrix = getMatrix(a_instanceID);\n  //mat4 matrix = getMatrix(gl_InstanceID);\n\n  gl_Position = matrix * vec4(a_position, 1.0);\n  // gl_Position = vec4(a_position, 1.0);\n  // gl_Position.xyz /= 10.0;\n  // gl_Position.x += a_instanceID / 20.0;\n//  gl_Position.x += col0.x / 5.0;\n\n  v_color = a_color;\n}\n  ";
        GLSLShader.attributeNanes = ['a_position', 'a_color', 'a_instanceID'];
        GLSLShader.attributeSemantics = [VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Instance];
        return GLSLShader;
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
    var Unknown$4 = new ProcessStageClass({ index: -1, str: 'UNKNOWN', methodName: '$unknown' });
    var Create = new ProcessStageClass({ index: 0, str: 'CREATE', methodName: '$create' });
    var Load = new ProcessStageClass({ index: 1, str: 'LOAD', methodName: '$load' });
    var Mount = new ProcessStageClass({ index: 2, str: 'MOUNT', methodName: '$mount' });
    var Logic = new ProcessStageClass({ index: 3, str: 'LOGIC', methodName: '$logic' });
    var PreRender = new ProcessStageClass({ index: 4, str: 'PRE_RENDER', methodName: '$prerender' });
    var Render = new ProcessStageClass({ index: 5, str: 'RENDER', methodName: '$render' });
    var Unmount = new ProcessStageClass({ index: 6, str: 'UNMOUNT', methodName: '$unmount' });
    var Discard = new ProcessStageClass({ index: 7, str: 'DISCARD', methodName: '$discard' });
    var typeList$5 = [Unknown$4, Create, Load, Mount, Logic, PreRender, Render, Unmount, Discard];
    function from$5(_a) {
        var index = _a.index;
        return _from({ typeList: typeList$5, index: index });
    }
    var ProcessStage = Object.freeze({ Unknown: Unknown$4, Create: Create, Load: Load, Mount: Mount, Logic: Logic, PreRender: PreRender, Render: Render, Unmount: Unmount, Discard: Discard, from: from$5 });

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
    var ProcessApproach = Object.freeze({ None: None, UniformWebGL1: UniformWebGL1, DataTextureWebGL1: DataTextureWebGL1, DataTextureWebGL2: DataTextureWebGL2, UBOWebGL2: UBOWebGL2 });

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

    var WebGLStrategyUBO = /** @class */ (function () {
        function WebGLStrategyUBO() {
            this.__webglResourceRepository = WebGLResourceRepository.getInstance();
            this.__uboUid = 0;
            this.__shaderProgramUid = 0;
        }
        WebGLStrategyUBO.prototype.setupShaderProgram = function () {
            if (this.__shaderProgramUid !== 0) {
                return;
            }
            // Shader Setup
            var vertexShader = GLSLShader.vertexShaderUBO;
            var fragmentShader = GLSLShader.fragmentShader;
            this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram(vertexShader, fragmentShader, GLSLShader.attributeNanes, GLSLShader.attributeSemantics);
        };
        WebGLStrategyUBO.prototype.setupGPUData = function () {
            var memoryManager = MemoryManager.getInstance();
            var buffer = memoryManager.getBufferForGPUInstanceData();
            var floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
            {
                if (this.__uboUid !== 0) {
                    this.__webglResourceRepository.updateUniformBuffer(this.__uboUid, SceneGraphComponent.getWorldMatrixAccessor().dataViewOfBufferView);
                    return;
                }
                this.__uboUid = this.__webglResourceRepository.createUniformBuffer(SceneGraphComponent.getWorldMatrixAccessor().dataViewOfBufferView);
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
        WebGLStrategyUBO.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new WebGLStrategyUBO();
            }
            return this.__instance;
        };
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
    var RGB$1 = new TextureParameterClass({ index: 0x8051, str: 'RGB' });
    var RGBA$1 = new TextureParameterClass({ index: 0x8058, str: 'RGBA' });
    var RGB8 = new TextureParameterClass({ index: 0x8051, str: 'RGB8' });
    var RGBA8 = new TextureParameterClass({ index: 0x8058, str: 'RGBA8' });
    var RGB10_A2 = new TextureParameterClass({ index: 0x8059, str: 'RGB10_A2' });
    var RGB16F = new TextureParameterClass({ index: 0x881B, str: 'RGB16F' });
    var RGB32F = new TextureParameterClass({ index: 0x8815, str: 'RGB32F' });
    var RGBA16F = new TextureParameterClass({ index: 0x881A, str: 'RGBA16F' });
    var RGBA32F = new TextureParameterClass({ index: 0x8814, str: 'RGBA32F' });
    var TextureParameter = Object.freeze({ Nearest: Nearest, Linear: Linear, TextureMagFilter: TextureMagFilter, TextureMinFilter: TextureMinFilter, TextureWrapS: TextureWrapS, TextureWrapT: TextureWrapT, Texture2D: Texture2D, Texture: Texture,
        Texture0: Texture0, Texture1: Texture1, ActiveTexture: ActiveTexture, Repeat: Repeat, ClampToEdge: ClampToEdge, RGB: RGB$1, RGBA: RGBA$1, RGB8: RGB8, RGBA8: RGBA8, RGB10_A2: RGB10_A2, RGB16F: RGB16F, RGB32F: RGB32F, RGBA16F: RGBA16F, RGBA32F: RGBA32F });

    var WebGLStrategyDataTexture = /** @class */ (function () {
        function WebGLStrategyDataTexture() {
            this.__webglResourceRepository = WebGLResourceRepository.getInstance();
            this.__dataTextureUid = 0;
            this.__shaderProgramUid = 0;
        }
        WebGLStrategyDataTexture.prototype.setupShaderProgram = function () {
            if (this.__shaderProgramUid !== 0) {
                return;
            }
            // Shader Setup
            var vertexShader = GLSLShader.vertexShaderDataTexture;
            var fragmentShader = GLSLShader.fragmentShader;
            this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram(vertexShader, fragmentShader, GLSLShader.attributeNanes, GLSLShader.attributeSemantics);
        };
        WebGLStrategyDataTexture.prototype.setupGPUData = function () {
            var isHalfFloatMode = false;
            if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2 ||
                this.__webglResourceRepository.currentWebGLContextWrapper.isSupportWebGL1Extension(WebGLExtension.TextureHalfFloat)) {
                isHalfFloatMode = true;
            }
            var memoryManager = MemoryManager.getInstance();
            var buffer = memoryManager.getBufferForGPUInstanceData();
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
            if (this.__dataTextureUid !== 0) {
                if (isHalfFloatMode) {
                    if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
                            format: PixelFormat.RGBA, type: ComponentType.Float
                        });
                    }
                    else {
                        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, halfFloatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
                            format: PixelFormat.RGBA, type: ComponentType.HalfFloat
                        });
                    }
                }
                else {
                    if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
                            format: PixelFormat.RGBA, type: ComponentType.Float
                        });
                    }
                    else {
                        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
                            level: 0, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
                            format: PixelFormat.RGBA, type: ComponentType.Float
                        });
                    }
                }
                return;
            }
            if (isHalfFloatMode) {
                if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                    this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                        level: 0, internalFormat: TextureParameter.RGBA16F, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
                else {
                    this.__dataTextureUid = this.__webglResourceRepository.createTexture(halfFloatDataTextureBuffer, {
                        level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.HalfFloat, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
            }
            else {
                if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2) {
                    this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                        level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
                        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
                        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat
                    });
                }
                else {
                    this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
                        level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferLengthOfOneSide, height: MemoryManager.bufferLengthOfOneSide,
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
        WebGLStrategyDataTexture.getInstance = function () {
            if (!this.__instance) {
                this.__instance = new WebGLStrategyDataTexture();
            }
            return this.__instance;
        };
        return WebGLStrategyDataTexture;
    }());

    var WebGLRenderingPipeline = new /** @class */ (function () {
        function class_1() {
            this.__webglResourceRepository = WebGLResourceRepository.getInstance();
            this.__componentRepository = ComponentRepository.getInstance();
            this.__instanceIDBufferUid = 0;
        }
        class_1.prototype.common_$load = function (processApproach) {
            // Strategy
            if (processApproach === ProcessApproach.UBOWebGL2) {
                this.__webGLStrategy = WebGLStrategyUBO.getInstance();
            }
            else {
                this.__webGLStrategy = WebGLStrategyDataTexture.getInstance();
            }
            // Shader setup
            this.__webGLStrategy.setupShaderProgram();
        };
        class_1.prototype.common_$prerender = function () {
            var gl = this.__webglResourceRepository.currentWebGLContextWrapper;
            if (gl == null) {
                throw new Error('No WebGLRenderingContext!');
            }
            this.__webGLStrategy.setupGPUData();
            if (this.__isReady()) {
                return 0;
            }
            this.__setupInstanceIDBuffer();
            return this.__instanceIDBufferUid;
        };
        class_1.prototype.__isReady = function () {
            if (this.__instanceIDBufferUid !== 0) {
                return true;
            }
            else {
                return false;
            }
        };
        class_1.prototype.__setupInstanceIDBuffer = function () {
            var buffer = MemoryManager.getInstance().getBufferForCPU();
            var count = EntityRepository.getMaxEntityNumber();
            var bufferView = buffer.takeBufferView({ byteLengthToNeed: 4 /*byte*/ * count, byteStride: 0, isAoS: false });
            var accesseor = bufferView.takeAccessor({ compositionType: CompositionType.Scalar, componentType: ComponentType.Float, count: count });
            var meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
            for (var i = 0; i < meshComponents.length; i++) {
                accesseor.setScalar(i, meshComponents[i].entityUID);
            }
            this.__instanceIDBufferUid = this.__webglResourceRepository.createVertexBuffer(accesseor);
        };
        class_1.prototype.common_$render = function () {
            var meshRendererComponents = this.__componentRepository.getComponentsWithType(MeshRendererComponent.componentTID);
            var meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
            var meshRendererComponent = meshRendererComponents[0];
            var meshComponent = meshComponents[0];
            var primitiveNum = meshComponent.getPrimitiveNumber();
            var glw = this.__webglResourceRepository.currentWebGLContextWrapper;
            for (var i = 0; i < primitiveNum; i++) {
                var primitive = meshComponent.getPrimitiveAt(i);
                this.__attachVertexData(meshRendererComponent, i, primitive, glw);
                this.__webGLStrategy.attatchShaderProgram();
                this.__webGLStrategy.attachGPUData();
                var meshComponents_1 = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
                glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0, meshComponents_1.length);
            }
        };
        class_1.prototype.__attachVertexData = function (meshRendererComponent, i, primitive, glw) {
            var vaoHandles = meshRendererComponent.__vertexHandles[i];
            var vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
            var gl = glw.getRawContext();
            if (vao != null) {
                glw.bindVertexArray(vao);
            }
            else {
                this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, this.__instanceIDBufferUid);
                var ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
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
                var args = [];
                var instanceIDBufferUid = 0;
                var componentTids = _this.__componentRepository.getComponentTIDs();
                var commonMethod = _this.__renderingPipeline['common_' + methodName];
                if (commonMethod != null) {
                    instanceIDBufferUid = commonMethod.call(_this.__renderingPipeline, _this.__processApproach);
                }
                args.push(instanceIDBufferUid);
                componentTids.forEach(function (componentTid) {
                    var components = _this.__componentRepository.getComponentsWithType(componentTid);
                    components.forEach(function (component) {
                        var method = component[methodName];
                        if (method != null) {
                            //method.apply(component, args);
                            component[methodName](args);
                        }
                    });
                });
            });
        };
        System.prototype.setProcessApproachAndCanvas = function (approach, canvas) {
            var repo = WebGLResourceRepository.getInstance();
            var gl;
            if (approach === ProcessApproach.DataTextureWebGL2 || approach === ProcessApproach.UBOWebGL2) {
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
        Vector3: Vector3,
        Vector4: Vector4,
        Matrix33: Matrix33,
        Matrix44: Matrix44,
        ProcessApproach: ProcessApproach
    });
    window['Rn'] = Rn;

    return Rn;

})));
