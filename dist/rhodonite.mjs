class CGAPIResourceRepository {
}
CGAPIResourceRepository.InvalidCGAPIResourceUid = -1;

// This code idea is from https://qiita.com/junkjunctions/items/5a6d8bed8df8eb3acceb
class EnumClass {
    constructor({ index, str }) {
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
    toString() {
        return this.str;
    }
    toJSON() {
        return this.index;
    }
}
EnumClass.__indices = new Map();
EnumClass.__strings = new Map();
function _from({ typeList, index }) {
    const match = typeList.find(type => type.index === index);
    if (!match) {
        throw new Error(`Invalid PrimitiveMode index: [${index}]`);
    }
    return match;
}
function _fromString({ typeList, str }) {
    const match = typeList.find(type => type.str === str);
    if (!match) {
        throw new Error(`Invalid PrimitiveMode index: [${str}]`);
    }
    return match;
}

class VertexAttributeClass extends EnumClass {
    constructor({ index, str, attributeSlot }) {
        super({ index, str });
        this.__attributeSlot = attributeSlot;
    }
    getAttributeSlot() {
        return this.__attributeSlot;
    }
}
const Unknown = new VertexAttributeClass({ index: -1, str: 'UNKNOWN', attributeSlot: -1 });
const Position = new VertexAttributeClass({ index: 0, str: 'POSITION', attributeSlot: 0 });
const Normal = new VertexAttributeClass({ index: 1, str: 'NORMAL', attributeSlot: 1 });
const Tangent = new VertexAttributeClass({ index: 2, str: 'TANGENT', attributeSlot: 2 });
const Texcoord0 = new VertexAttributeClass({ index: 3, str: 'TEXCOORD_0', attributeSlot: 3 });
const Texcoord1 = new VertexAttributeClass({ index: 4, str: 'TEXCOORD_1', attributeSlot: 4 });
const Color0 = new VertexAttributeClass({ index: 5, str: 'COLOR_0', attributeSlot: 5 });
const Joints0 = new VertexAttributeClass({ index: 6, str: 'JOINTS_0', attributeSlot: 6 });
const Weights0 = new VertexAttributeClass({ index: 7, str: 'WEIGHTS_0', attributeSlot: 7 });
const Instance = new VertexAttributeClass({ index: 8, str: 'INSTANCE', attributeSlot: 4 });
const typeList = [Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, Instance];
function from(index) {
    return _from({ typeList, index });
}
function fromString(str) {
    return _fromString({ typeList, str });
}
const VertexAttribute = Object.freeze({
    Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, Instance, from, fromString
});

class CompositionTypeClass extends EnumClass {
    constructor({ index, str, numberOfComponents }) {
        super({ index, str });
        this.__numberOfComponents = 0;
        this.__numberOfComponents = numberOfComponents;
    }
    getNumberOfComponents() {
        return this.__numberOfComponents;
    }
}
const Unknown$1 = new CompositionTypeClass({ index: -1, str: 'UNKNOWN', numberOfComponents: 0 });
const Scalar = new CompositionTypeClass({ index: 0, str: 'SCALAR', numberOfComponents: 1 });
const Vec2 = new CompositionTypeClass({ index: 1, str: 'VEC2', numberOfComponents: 2 });
const Vec3 = new CompositionTypeClass({ index: 2, str: 'VEC3', numberOfComponents: 3 });
const Vec4 = new CompositionTypeClass({ index: 3, str: 'VEC4', numberOfComponents: 4 });
const Mat2 = new CompositionTypeClass({ index: 4, str: 'MAT2', numberOfComponents: 4 });
const Mat3 = new CompositionTypeClass({ index: 5, str: 'MAT3', numberOfComponents: 9 });
const Mat4 = new CompositionTypeClass({ index: 6, str: 'MAT4', numberOfComponents: 16 });
const typeList$1 = [Unknown$1, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4];
function from$1(index) {
    return _from({ typeList: typeList$1, index });
}
function fromString$1(str) {
    return _fromString({ typeList: typeList$1, str });
}
const CompositionType = Object.freeze({ Unknown: Unknown$1, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4, from: from$1, fromString: fromString$1 });

class ComponentTypeClass extends EnumClass {
    constructor({ index, str, sizeInBytes }) {
        super({ index, str });
        this.__sizeInBytes = sizeInBytes;
    }
    getSizeInBytes() {
        return this.__sizeInBytes;
    }
}
const Unknown$2 = new ComponentTypeClass({ index: 5119, str: 'UNKNOWN', sizeInBytes: 0 });
const Byte = new ComponentTypeClass({ index: 5120, str: 'BYTE', sizeInBytes: 1 });
const UnsignedByte = new ComponentTypeClass({ index: 5121, str: 'UNSIGNED_BYTE', sizeInBytes: 1 });
const Short = new ComponentTypeClass({ index: 5122, str: 'SHORT', sizeInBytes: 2 });
const UnsignedShort = new ComponentTypeClass({ index: 5123, str: 'UNSIGNED_SHORT', sizeInBytes: 2 });
const Int = new ComponentTypeClass({ index: 5124, str: 'INT', sizeInBytes: 4 });
const UnsingedInt = new ComponentTypeClass({ index: 5125, str: 'UNSIGNED_INT', sizeInBytes: 4 });
const Float = new ComponentTypeClass({ index: 5126, str: 'FLOAT', sizeInBytes: 4 });
const Double = new ComponentTypeClass({ index: 5127, str: 'DOUBLE', sizeInBytes: 8 });
const HalfFloat = new ComponentTypeClass({ index: 0x8D61, str: 'HALF_FLOAT_OES', sizeInBytes: 2 });
const typeList$2 = [Unknown$2, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsingedInt, Float, Double, HalfFloat];
function from$2(index) {
    return _from({ typeList: typeList$2, index });
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
const ComponentType = Object.freeze({ Unknown: Unknown$2, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsingedInt, Float, Double, HalfFloat, from: from$2, fromTypedArray });

class WebGLExtensionClass extends EnumClass {
    constructor({ index, str }) {
        super({ index, str });
    }
}
const VertexArrayObject = new WebGLExtensionClass({ index: 1, str: 'OES_vertex_array_object' });
const TextureFloat = new WebGLExtensionClass({ index: 2, str: 'OES_texture_float' });
const TextureHalfFloat = new WebGLExtensionClass({ index: 3, str: 'OES_texture_half_float' });
const TextureFloatLinear = new WebGLExtensionClass({ index: 4, str: 'OES_texture_float_linear' });
const TextureHalfFloatLinear = new WebGLExtensionClass({ index: 5, str: 'OES_texture_half_float_linear' });
const InstancedArrays = new WebGLExtensionClass({ index: 6, str: 'ANGLE_instanced_arrays' });
const WebGLExtension = Object.freeze({ VertexArrayObject, TextureFloat, TextureHalfFloat, TextureFloatLinear, TextureHalfFloatLinear, InstancedArrays });

class WebGLContextWrapper {
    constructor(gl) {
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
    getRawContext() {
        return this.__gl;
    }
    isSupportWebGL1Extension(webGLExtension) {
        if (this.__getExtension(webGLExtension)) {
            return true;
        }
        else {
            return false;
        }
    }
    get isWebGL2() {
        if (this.__webglVersion === 2) {
            return true;
        }
        else {
            return false;
        }
    }
    createVertexArray() {
        if (this.isWebGL2) {
            return this.__gl.createVertexArray();
        }
        else {
            if (this.__webgl1ExtVAO != null) {
                return this.__webgl1ExtVAO.createVertexArrayOES();
            }
        }
    }
    bindVertexArray(vao) {
        if (this.isWebGL2) {
            this.__gl.bindVertexArray(vao);
        }
        else {
            if (this.__webgl1ExtVAO != null) {
                this.__webgl1ExtVAO.bindVertexArrayOES(vao);
            }
        }
    }
    vertexAttribDivisor(index, divisor) {
        if (this.isWebGL2) {
            this.__gl.vertexAttribDivisor(index, divisor);
        }
        else {
            this.__webgl1ExtIA.vertexAttribDivisorANGLE(index, divisor);
        }
    }
    drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount) {
        if (this.isWebGL2) {
            this.__gl.drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount);
        }
        else {
            this.__webgl1ExtIA.drawElementsInstancedANGLE(primitiveMode, indexCount, type, offset, instanceCount);
        }
    }
    __getExtension(extension) {
        const gl = this.__gl;
        if (!this.__extensions.has(extension)) {
            const extObj = gl.getExtension(extension.toString());
            if (extObj == null) {
                const text = `The library does not support this environment because the ${extension.toString()} is not available`;
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
    }
}

class WebGLResourceRepository extends CGAPIResourceRepository {
    constructor() {
        super();
        this.__webglContexts = new Map();
        this.__resourceCounter = CGAPIResourceRepository.InvalidCGAPIResourceUid;
        this.__webglResources = new Map();
        this.__extensions = new Map();
    }
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new WebGLResourceRepository();
        }
        return this.__instance;
    }
    addWebGLContext(gl, asCurrent) {
        const glw = new WebGLContextWrapper(gl);
        this.__webglContexts.set('default', glw);
        if (asCurrent) {
            this.__glw = glw;
        }
    }
    get currentWebGLContextWrapper() {
        return this.__glw;
    }
    getResourceNumber() {
        return ++this.__resourceCounter;
    }
    getWebGLResource(WebGLResourceHandle) {
        return this.__webglResources.get(WebGLResourceHandle);
    }
    createIndexBuffer(accsessor) {
        const gl = this.__glw.getRawContext();
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const ibo = gl.createBuffer();
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, ibo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, accsessor.getTypedArray(), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return resourceHandle;
    }
    createVertexBuffer(accessor) {
        const gl = this.__glw.getRawContext();
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const vbo = gl.createBuffer();
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, vbo);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, accessor.getTypedArray(), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return resourceHandle;
    }
    createVertexArray() {
        const gl = this.__glw;
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const vao = this.__glw.createVertexArray();
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, vao);
        return resourceHandle;
    }
    createVertexDataResources(primitive) {
        const gl = this.__glw.getRawContext();
        const vaoHandle = this.createVertexArray();
        let iboHandle;
        if (primitive.hasIndices) {
            iboHandle = this.createIndexBuffer(primitive.indicesAccessor);
        }
        const vboHandles = [];
        primitive.attributeAccessors.forEach(accessor => {
            const vboHandle = this.createVertexBuffer(accessor);
            vboHandles.push(vboHandle);
        });
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return { vaoHandle, iboHandle, vboHandles };
    }
    createShaderProgram({ vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics }) {
        const gl = this.__glw.getRawContext();
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderStr);
        gl.compileShader(vertexShader);
        this.__checkShaderCompileStatus(vertexShader, vertexShaderStr);
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        let fragmentShader;
        if (fragmentShaderStr != null) {
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, fragmentShaderStr);
            gl.compileShader(fragmentShader);
            this.__checkShaderCompileStatus(fragmentShader, fragmentShaderStr);
            gl.attachShader(shaderProgram, fragmentShader);
        }
        attributeNames.forEach((attributeName, i) => {
            gl.bindAttribLocation(shaderProgram, attributeSemantics[i].getAttributeSlot(), attributeName);
        });
        gl.linkProgram(shaderProgram);
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, shaderProgram);
        this.__checkShaderProgramLinkStatus(shaderProgram);
        gl.deleteShader(vertexShader);
        if (fragmentShaderStr != null) {
            gl.deleteShader(fragmentShader);
        }
        return resourceHandle;
    }
    __addLineNumber(shaderString) {
        let shaderTextLines = shaderString.split(/\r\n|\r|\n/);
        let shaderTextWithLineNumber = '';
        for (let i = 0; i < shaderTextLines.length; i++) {
            let lineIndex = i + 1;
            let splitter = ' : ';
            if (lineIndex < 10) {
                splitter = '  : ';
            }
            else if (lineIndex >= 100) {
                splitter = ': ';
            }
            shaderTextWithLineNumber += lineIndex + splitter + shaderTextLines[i] + '\n';
        }
        return shaderTextWithLineNumber;
    }
    __checkShaderCompileStatus(shader, shaderText) {
        const gl = this.__glw.getRawContext();
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log(this.__addLineNumber(shaderText));
            throw new Error('An error occurred compiling the shaders:' + gl.getShaderInfoLog(shader));
        }
    }
    __checkShaderProgramLinkStatus(shaderProgram) {
        const gl = this.__glw.getRawContext();
        // If creating the shader program failed, alert
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        }
    }
    setVertexDataToPipeline({ vaoHandle, iboHandle, vboHandles }, primitive, instanceIDBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const gl = this.__glw.getRawContext();
        const vao = this.getWebGLResource(vaoHandle);
        // VAO bind
        this.__glw.bindVertexArray(vao);
        // IBO bind
        if (iboHandle != null) {
            const ibo = this.getWebGLResource(iboHandle);
            if (ibo != null) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            }
            else {
                throw new Error('Nothing Element Array Buffer!');
            }
        }
        // bind vertex attributes to VBO's
        vboHandles.forEach((vboHandle, i) => {
            const vbo = this.getWebGLResource(vboHandle);
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
            const instanceIDBuffer = this.getWebGLResource(instanceIDBufferUid);
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
    }
    createTexture(typedArray, { level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT }) {
        const gl = this.__glw.getRawContext();
        const dataTexture = gl.createTexture();
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, dataTexture);
        gl.bindTexture(gl.TEXTURE_2D, dataTexture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat.index, width, height, border, format.index, type.index, typedArray);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);
        return resourceHandle;
    }
    updateTexture(textureUid, typedArray, { level, width, height, format, type }) {
        const gl = this.__glw.getRawContext();
        const texture = this.getWebGLResource(textureUid);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texSubImage2D(gl.TEXTURE_2D, level, 0, 0, width, height, format.index, type.index, typedArray);
    }
    deleteTexture(textureHandle) {
        const texture = this.getWebGLResource(textureHandle);
        const gl = this.__glw.getRawContext();
        if (texture != null) {
            gl.deleteTexture(texture);
            this.__webglResources.delete(textureHandle);
        }
    }
    createUniformBuffer(bufferView) {
        const gl = this.__glw.getRawContext();
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const ubo = gl.createBuffer();
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, ubo);
        gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
        gl.bufferData(gl.UNIFORM_BUFFER, bufferView, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        return resourceHandle;
    }
    updateUniformBuffer(uboUid, bufferView) {
        const gl = this.__glw.getRawContext();
        const ubo = this.getWebGLResource(uboUid);
        gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
        void gl.bufferSubData(gl.UNIFORM_BUFFER, 0, bufferView, 0);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
    bindUniformBlock(shaderProgramUid, blockName, blockIndex) {
        const gl = this.__glw.getRawContext();
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const shaderProgram = this.getWebGLResource(shaderProgramUid);
        const block = gl.getUniformBlockIndex(shaderProgram, blockName);
        gl.uniformBlockBinding(shaderProgram, block, blockIndex);
    }
    bindUniformBufferBase(blockIndex, uboUid) {
        const gl = this.__glw.getRawContext();
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const ubo = this.getWebGLResource(uboUid);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, blockIndex, ubo);
    }
    deleteUniformBuffer(uboUid) {
        const gl = this.__glw.getRawContext();
        const ubo = this.getWebGLResource(uboUid);
        gl.deleteBuffer(ubo);
    }
    createTransformFeedback() {
        const gl = this.__glw.getRawContext();
        var transformFeedback = gl.createTransformFeedback();
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, transformFeedback);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
        return resourceHandle;
    }
    deleteTransformFeedback(transformFeedbackUid) {
        const gl = this.__glw.getRawContext();
        const transformFeedback = this.getWebGLResource(transformFeedbackUid);
        gl.deleteTransformFeedback(transformFeedback);
    }
}

const TransformComponentTID = 1;
const SceneGraphComponentTID = 2;
const WellKnownComponentTIDs = Object.freeze({
    TransformComponentTID,
    SceneGraphComponentTID
});

class Entity {
    constructor(entityUID, isAlive, entityComponent) {
        this.__entity_uid = entityUID;
        this.__isAlive = isAlive;
        this.__entityRepository = entityComponent;
        this.__uniqueName = 'entity_of_uid_' + entityUID;
        Entity.__uniqueNames[entityUID] = this.__uniqueName;
    }
    get entityUID() {
        return this.__entity_uid;
    }
    getComponent(componentTid) {
        const map = this.__entityRepository._components[this.entityUID];
        if (map != null) {
            const component = map.get(componentTid);
            if (component != null) {
                return component;
            }
            else {
                return null;
            }
        }
        return null;
    }
    getTransform() {
        if (this.__transformComponent == null) {
            this.__transformComponent = this.getComponent(WellKnownComponentTIDs.TransformComponentTID);
        }
        return this.__transformComponent;
    }
    getSceneGraph() {
        if (this.__sceneGraphComponent == null) {
            this.__sceneGraphComponent = this.getComponent(WellKnownComponentTIDs.SceneGraphComponentTID);
        }
        return this.__sceneGraphComponent;
    }
    tryToSetUniqueName(name, toAddNameIfConflict) {
        if (Entity.__uniqueNames.indexOf(name) !== -1) {
            // Conflict
            if (toAddNameIfConflict) {
                const newName = name + '_(' + this.__uniqueName + ')';
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
    }
    get uniqueName() {
        return this.__uniqueName;
    }
}
Entity.invalidEntityUID = -1;
Entity.__uniqueNames = [];

class RnObject {
    constructor(needToManage = false) {
        this.__objectUid = -1;
        if (needToManage) {
            this.__objectUid = ++RnObject.currentMaxObjectCount;
        }
    }
    get objectUid() {
        return this.__objectUid;
    }
}
RnObject.currentMaxObjectCount = -1;
RnObject.InvalidObjectUID = -1;

class _Vector2 {
    constructor(typedArray, x, y) {
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
    get className() {
        return this.constructor.name;
    }
    clone() {
        return new _Vector2(this.__typedArray, this.x, this.y);
    }
    multiply(val) {
        this.x *= val;
        this.y *= val;
        return this;
    }
    isStrictEqual(vec) {
        if (this.x === vec.x && this.y === vec.y) {
            return true;
        }
        else {
            return false;
        }
    }
    isEqual(vec, delta = Number.EPSILON) {
        if (Math.abs(vec.x - this.x) < delta &&
            Math.abs(vec.y - this.y) < delta) {
            return true;
        }
        else {
            return false;
        }
    }
    static multiply(typedArray, vec2, val) {
        return new _Vector2(typedArray, vec2.x * val, vec2.y * val);
    }
    get x() {
        return this.v[0];
    }
    set x(x) {
        this.v[0] = x;
    }
    get y() {
        return this.v[1];
    }
    set y(y) {
        this.v[1] = y;
    }
    get raw() {
        return this.v;
    }
}
class Vector2_F64 extends _Vector2 {
    constructor(x, y) {
        super(Float64Array, x, y);
    }
}

const IsUtil = {
    not: {},
    all: {},
    any: {},
    _not(fn) {
        return function () {
            return !fn.apply(null, [...arguments]);
        };
    },
    _all(fn) {
        return function () {
            if (Array.isArray(arguments[0])) {
                return arguments[0].every(fn);
            }
            return [...arguments].every(fn);
        };
    },
    _any(fn) {
        return function () {
            if (Array.isArray(arguments[0])) {
                return arguments[0].some(fn);
            }
            return [...arguments].some(fn);
        };
    },
    defined(val) {
        return val !== void 0;
    },
    undefined(val) {
        return val === void 0;
    },
    null(val) {
        return val === null;
    },
    // is NOT null or undefined
    exist(val) {
        return val != null;
    },
    function(val) {
        return typeof val === 'function';
    }
};
for (let fn in IsUtil) {
    if (IsUtil.hasOwnProperty(fn)) {
        const interfaces = ['not', 'all', 'any'];
        if (fn.indexOf('_') === -1 && !interfaces.includes(fn)) {
            interfaces.forEach((itf) => {
                const op = '_' + itf;
                IsUtil[itf][fn] = IsUtil[op](IsUtil[fn]);
            });
        }
    }
}

class Vector3 {
    constructor(x, y, z) {
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
    get className() {
        return this.constructor.name;
    }
    isStrictEqual(vec) {
        if (this.x === vec.x && this.y === vec.y && this.z === vec.z) {
            return true;
        }
        else {
            return false;
        }
    }
    isEqual(vec, delta = Number.EPSILON) {
        if (Math.abs(vec.x - this.x) < delta &&
            Math.abs(vec.y - this.y) < delta &&
            Math.abs(vec.z - this.z) < delta) {
            return true;
        }
        else {
            return false;
        }
    }
    zero() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        return this;
    }
    /**
     * Zero Vector
     */
    static zero() {
        return new Vector3(0, 0, 0);
    }
    one() {
        this.x = 1;
        this.y = 1;
        this.z = 1;
        return this;
    }
    static one() {
        return new Vector3(1, 1, 1);
    }
    static dummy() {
        return new Vector3(null);
    }
    isDummy() {
        if (this.v.length === 0) {
            return true;
        }
        else {
            return false;
        }
    }
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
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
    lengthSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    /**
     * to square length(static verison)
     */
    static lengthSquared(vec3) {
        return vec3.x * vec3.x + vec3.y * vec3.y + vec3.z * vec3.z;
    }
    lengthTo(vec3) {
        var deltaX = vec3.x - this.x;
        var deltaY = vec3.y - this.y;
        var deltaZ = vec3.z - this.z;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
    }
    static lengthBtw(lhv, rhv) {
        var deltaX = rhv.x - lhv.x;
        var deltaY = rhv.y - lhv.y;
        var deltaZ = rhv.z - lhv.z;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
    }
    /**
     * dot product
     */
    dotProduct(vec3) {
        return this.x * vec3.x + this.y * vec3.y + this.z * vec3.z;
    }
    /**
     * dot product(static version)
     */
    static dotProduct(lv, rv) {
        return lv.x * rv.x + lv.y * rv.y + lv.z * rv.z;
    }
    /**
     * cross product
     */
    cross(v) {
        var x = this.y * v.z - this.z * v.y;
        var y = this.z * v.x - this.x * v.z;
        var z = this.x * v.y - this.y * v.x;
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    /**
    * cross product(static version)
    */
    static cross(lv, rv) {
        var x = lv.y * rv.z - lv.z * rv.y;
        var y = lv.z * rv.x - lv.x * rv.z;
        var z = lv.x * rv.y - lv.y * rv.x;
        return new Vector3(x, y, z);
    }
    /**
     * normalize
     */
    normalize() {
        var length = this.length();
        this.divide(length);
        return this;
    }
    /**
     * normalize(static version)
     */
    static normalize(vec3) {
        var length = vec3.length();
        var newVec = new Vector3(vec3.x, vec3.y, vec3.z);
        newVec.divide(length);
        return newVec;
    }
    /**
     * add value
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    /**
     * add value（static version）
     */
    static add(lv, rv) {
        return new Vector3(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z);
    }
    /**
     * subtract
     */
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    /**
     * subtract(subtract)
     */
    static subtract(lv, rv) {
        return new Vector3(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z);
    }
    /**
     * divide
     */
    divide(val) {
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
    }
    /**
     * divide(static version)
     */
    static divide(vec3, val) {
        if (val !== 0) {
            return new Vector3(vec3.x / val, vec3.y / val, vec3.z / val);
        }
        else {
            console.warn("0 division occured!");
            return new Vector3(Infinity, Infinity, Infinity);
        }
    }
    /**
     * multiply
     */
    multiply(val) {
        this.x *= val;
        this.y *= val;
        this.z *= val;
        return this;
    }
    /**
     * multiply vector
     */
    multiplyVector(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
        this.z *= vec.z;
        return this;
    }
    /**
     * multiply(static version)
     */
    static multiply(vec3, val) {
        return new Vector3(vec3.x * val, vec3.y * val, vec3.z * val);
    }
    /**
     * multiply vector(static version)
     */
    static multiplyVector(vec3, vec) {
        return new Vector3(vec3.x * vec.x, vec3.y * vec.y, vec3.z * vec.z);
    }
    static angleOfVectors(lhv, rhv) {
        let cos_sita = Vector3.dotProduct(lhv, rhv) / (lhv.length() * rhv.length());
        let sita = Math.acos(cos_sita);
        return sita;
    }
    /**
     * divide vector
     */
    divideVector(vec3) {
        this.x /= vec3.x;
        this.y /= vec3.y;
        this.z /= vec3.z;
        return this;
    }
    /**
     * divide vector(static version)
     */
    static divideVector(lvec3, rvec3) {
        return new Vector3(lvec3.x / rvec3.x, lvec3.y / rvec3.y, lvec3.z / rvec3.z);
    }
    /**
     * change to string
     */
    toString() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ')';
    }
    get x() {
        return this.v[0];
    }
    set x(x) {
        this.v[0] = x;
    }
    get y() {
        return this.v[1];
    }
    set y(y) {
        this.v[1] = y;
    }
    get z() {
        return this.v[2];
    }
    set z(z) {
        this.v[2] = z;
    }
    get raw() {
        return this.v;
    }
}
//GLBoost['Vector3'] = Vector3;

class Vector4 {
    constructor(x, y, z, w) {
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
    get className() {
        return this.constructor.name;
    }
    isStrictEqual(vec) {
        if (this.v[0] === vec.v[0] && this.v[1] === vec.v[1] && this.v[2] === vec.v[2] && this.v[3] === vec.v[3]) {
            return true;
        }
        else {
            return false;
        }
    }
    isEqual(vec, delta = Number.EPSILON) {
        if (Math.abs(vec.v[0] - this.v[0]) < delta &&
            Math.abs(vec.v[1] - this.v[1]) < delta &&
            Math.abs(vec.v[2] - this.v[2]) < delta &&
            Math.abs(vec.v[3] - this.v[3]) < delta) {
            return true;
        }
        else {
            return false;
        }
    }
    clone() {
        return new Vector4(this.x, this.y, this.z, this.w);
    }
    /**
     * Zero Vector
     */
    static zero() {
        return new Vector4(0, 0, 0, 1);
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }
    normalize() {
        var length = this.length();
        this.divide(length);
        return this;
    }
    static normalize(vec4) {
        var length = vec4.length();
        var newVec = new Vector4(vec4.x, vec4.y, vec4.z, vec4.w);
        newVec.divide(length);
        return newVec;
    }
    /**
     * add value
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        this.w += v.w;
        return this;
    }
    /**
     * add value（static version）
     */
    static add(lv, rv) {
        return new Vector4(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z + rv.z);
    }
    /**
     * add value except w component
     */
    addWithOutW(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        this.w -= v.w;
        return this;
    }
    static subtract(lv, rv) {
        return new Vector4(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z, lv.w - rv.w);
    }
    /**
     * add value except w component（static version）
     */
    static addWithOutW(lv, rv) {
        return new Vector4(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z);
    }
    multiply(val) {
        this.x *= val;
        this.y *= val;
        this.z *= val;
        this.w *= val;
        return this;
    }
    multiplyVector(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
        this.z *= vec.z;
        this.w *= vec.w;
        return this;
    }
    static multiply(vec4, val) {
        return new Vector4(vec4.x * val, vec4.y * val, vec4.z * val, vec4.w * val);
    }
    static multiplyVector(vec4, vec) {
        return new Vector4(vec4.x * vec.x, vec4.y * vec.y, vec4.z * vec.z, vec4.w * vec.w);
    }
    divide(val) {
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
    }
    static divide(vec4, val) {
        if (val !== 0) {
            return new Vector4(vec4.x / val, vec4.y / val, vec4.z / val, vec4.w / val);
        }
        else {
            console.warn("0 division occured!");
            return new Vector4(Infinity, Infinity, Infinity, Infinity);
        }
    }
    divideVector(vec4) {
        this.x /= vec4.x;
        this.y /= vec4.y;
        this.z /= vec4.z;
        this.w /= vec4.w;
        return this;
    }
    static divideVector(lvec4, rvec4) {
        return new Vector4(lvec4.x / rvec4.x, lvec4.y / rvec4.y, lvec4.z / rvec4.z, lvec4.w / rvec4.w);
    }
    toString() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
    }
    get x() {
        return this.v[0];
    }
    set x(x) {
        this.v[0] = x;
    }
    get y() {
        return this.v[1];
    }
    set y(y) {
        this.v[1] = y;
    }
    get z() {
        return this.v[2];
    }
    set z(z) {
        this.v[2] = z;
    }
    get w() {
        return this.v[3];
    }
    set w(w) {
        this.v[3] = w;
    }
    get raw() {
        return this.v;
    }
}
// GLBoost["Vector4"] = Vector4;

//import GLBoost from '../../globals';
class Quaternion {
    constructor(x, y, z, w) {
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
    identity() {
        this.x = 0;
        this.y = 0;
        this.x = 0;
        this.w = 1;
    }
    isEqual(quat) {
        if (this.x === quat.x && this.y === quat.y && this.z === quat.z && this.w === quat.w) {
            return true;
        }
        else {
            return false;
        }
    }
    static dummy() {
        return new Quaternion(null);
    }
    isDummy() {
        if (this.v.length === 0) {
            return true;
        }
        else {
            return false;
        }
    }
    get className() {
        return this.constructor.name;
    }
    clone() {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }
    static invert(quat) {
        quat = new Quaternion(-quat.x, -quat.y, -quat.z, quat.w);
        const inorm2 = 1.0 / (quat.x * quat.x + quat.y * quat.y + quat.z * quat.z + quat.w * quat.w);
        quat.x *= inorm2;
        quat.y *= inorm2;
        quat.z *= inorm2;
        quat.w *= inorm2;
        return quat;
    }
    static qlerp(lhq, rhq, ratio) {
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
            let ph = Math.acos(qr);
            let s2;
            if (qr < 0.0 && ph > Math.PI / 2.0) {
                qr = -lhq.w * rhq.w - lhq.x * rhq.x - lhq.y * rhq.y - lhq.z * rhq.z;
                ph = Math.acos(qr);
                s2 = -1 * Math.sin(ph * ratio) / Math.sin(ph);
            }
            else {
                s2 = Math.sin(ph * ratio) / Math.sin(ph);
            }
            let s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);
            q.x = lhq.x * s1 + rhq.x * s2;
            q.y = lhq.y * s1 + rhq.y * s2;
            q.z = lhq.z * s1 + rhq.z * s2;
            q.w = lhq.w * s1 + rhq.w * s2;
            return q;
        }
    }
    axisAngle(axisVec3, radian) {
        var halfAngle = 0.5 * radian;
        var sin = Math.sin(halfAngle);
        var axis = Vector3.normalize(axisVec3);
        this.w = Math.cos(halfAngle);
        this.x = sin * axis.x;
        this.y = sin * axis.y;
        this.z = sin * axis.z;
        return this;
    }
    static axisAngle(axisVec3, radian) {
        var halfAngle = 0.5 * radian;
        var sin = Math.sin(halfAngle);
        var axis = Vector3.normalize(axisVec3);
        return new Quaternion(sin * axis.x, sin * axis.y, sin * axis.z, Math.cos(halfAngle));
    }
    add(q) {
        this.x += q.x;
        this.y += q.y;
        this.z += q.z;
        this.w += q.w;
        return this;
    }
    multiply(q) {
        let result = new Quaternion(0, 0, 0, 1);
        result.x = q.w * this.x + q.z * this.y + q.y * this.z - q.x * this.w;
        result.y = -q.z * this.x + q.w * this.y + q.x * this.z - q.y * this.w;
        result.z = q.y * this.x + q.x * this.y + q.w * this.z - q.z * this.w;
        result.w = -q.x * this.x - q.y * this.y - q.z * this.z - q.w * this.w;
        this.x = result.x;
        this.y = result.y;
        this.z = result.z;
        this.w = result.w;
        return this;
    }
    static multiply(q1, q2) {
        let result = new Quaternion(0, 0, 0, 1);
        result.x = q2.w * q1.x + q2.z * q1.y - q2.y * q1.z + q2.x * q1.w;
        result.y = -q2.z * q1.x + q2.w * q1.y + q2.x * q1.z + q2.y * q1.w;
        result.z = q2.y * q1.x - q2.x * q1.y + q2.w * q1.z + q2.z * q1.w;
        result.w = -q2.x * q1.x - q2.y * q1.y - q2.z * q1.z + q2.w * q1.w;
        return result;
    }
    static fromMatrix(m) {
        let q = new Quaternion();
        let tr = m.m00 + m.m11 + m.m22;
        if (tr > 0) {
            let S = 0.5 / Math.sqrt(tr + 1.0);
            q.w = 0.25 / S;
            q.x = (m.m21 - m.m12) * S;
            q.y = (m.m02 - m.m20) * S;
            q.z = (m.m10 - m.m01) * S;
        }
        else if ((m.m00 > m.m11) && (m.m00 > m.m22)) {
            let S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
            q.w = (m.m21 - m.m12) / S;
            q.x = 0.25 * S;
            q.y = (m.m01 + m.m10) / S;
            q.z = (m.m02 + m.m20) / S;
        }
        else if (m.m11 > m.m22) {
            let S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
            q.w = (m.m02 - m.m20) / S;
            q.x = (m.m01 + m.m10) / S;
            q.y = 0.25 * S;
            q.z = (m.m12 + m.m21) / S;
        }
        else {
            let S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
            q.w = (m.m10 - m.m01) / S;
            q.x = (m.m02 + m.m20) / S;
            q.y = (m.m12 + m.m21) / S;
            q.z = 0.25 * S;
        }
        return q;
    }
    fromMatrix(m) {
        let tr = m.m00 + m.m11 + m.m22;
        if (tr > 0) {
            let S = 0.5 / Math.sqrt(tr + 1.0);
            this.v[0] = (m.m21 - m.m12) * S;
            this.v[1] = (m.m02 - m.m20) * S;
            this.v[2] = (m.m10 - m.m01) * S;
            this.v[3] = 0.25 / S;
        }
        else if ((m.m00 > m.m11) && (m.m00 > m.m22)) {
            let S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
            this.v[0] = 0.25 * S;
            this.v[1] = (m.m01 + m.m10) / S;
            this.v[2] = (m.m02 + m.m20) / S;
            this.v[3] = (m.m21 - m.m12) / S;
        }
        else if (m.m11 > m.m22) {
            let S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
            this.v[0] = (m.m01 + m.m10) / S;
            this.v[1] = 0.25 * S;
            this.v[2] = (m.m12 + m.m21) / S;
            this.v[3] = (m.m02 - m.m20) / S;
        }
        else {
            let S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
            this.v[0] = (m.m02 + m.m20) / S;
            this.v[1] = (m.m12 + m.m21) / S;
            this.v[2] = 0.25 * S;
            this.v[3] = (m.m10 - m.m01) / S;
        }
        return this;
    }
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
    static fromPosition(vec3) {
        let q = new Quaternion(vec3.x, vec3.y, vec3.z, 0);
        return q;
    }
    at(i) {
        switch (i % 4) {
            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            case 3: return this.w;
        }
    }
    setAt(i, val) {
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
    }
    normalize() {
        let norm = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        this.x /= norm;
        this.y /= norm;
        this.z /= norm;
        this.w /= norm;
        return this;
    }
    toString() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
    }
    get x() {
        return this.v[0];
    }
    set x(x) {
        this.v[0] = x;
    }
    get y() {
        return this.v[1];
    }
    set y(y) {
        this.v[1] = y;
    }
    get z() {
        return this.v[2];
    }
    set z(z) {
        this.v[2] = z;
    }
    get w() {
        return this.v[3];
    }
    set w(w) {
        this.v[3] = w;
    }
    get raw() {
        return this.v;
    }
}
//GLBoost["Quaternion"] = Quaternion;

//import GLBoost from '../../globals';
const FloatArray = Float32Array;
class Matrix44 {
    constructor(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, isColumnMajor = false, notCopyFloatArray = false) {
        const _isColumnMajor = (arguments.length >= 16) ? isColumnMajor : m1;
        const _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m2;
        const m = m0;
        if (m == null) {
            this.m = new FloatArray(0);
            return;
        }
        if (arguments.length >= 16) {
            this.m = new FloatArray(16); // Data order is column major
            if (_isColumnMajor === true) {
                let m = arguments;
                this.setComponents(m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14], m[3], m[7], m[11], m[15]);
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
            const sx = m.x * m.x;
            const sy = m.y * m.y;
            const sz = m.z * m.z;
            const cx = m.y * m.z;
            const cy = m.x * m.z;
            const cz = m.x * m.y;
            const wx = m.w * m.x;
            const wy = m.w * m.y;
            const wz = m.w * m.z;
            this.setComponents(1.0 - 2.0 * (sy + sz), 2.0 * (cz - wz), 2.0 * (cy + wy), 0.0, 2.0 * (cz + wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx - wx), 0.0, 2.0 * (cy - wy), 2.0 * (cx + wx), 1.0 - 2.0 * (sx + sy), 0.0, 0.0, 0.0, 0.0, 1.0);
        }
        else {
            this.m = new FloatArray(16);
            this.identity();
        }
    }
    static dummy() {
        return new Matrix44(null);
    }
    isDummy() {
        if (this.m.length === 0) {
            return true;
        }
        else {
            return false;
        }
    }
    setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
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
    }
    copyComponents(mat4) {
        //this.m.set(mat4.m);
        //this.setComponents.apply(this, mat4.m); // 'm' must be row major array if isColumnMajor is false
        const m = mat4.m;
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
    }
    get className() {
        return this.constructor.name;
    }
    clone() {
        return new Matrix44(this.m[0], this.m[4], this.m[8], this.m[12], this.m[1], this.m[5], this.m[9], this.m[13], this.m[2], this.m[6], this.m[10], this.m[14], this.m[3], this.m[7], this.m[11], this.m[15]);
    }
    /**
     * to the identity matrix
     */
    identity() {
        this.setComponents(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        return this;
    }
    /**
     * to the identity matrix（static版）
     */
    static identity() {
        return new Matrix44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }
    isEqual(mat, delta = Number.EPSILON) {
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
    }
    translate(vec) {
        return this.setComponents(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
    }
    putTranslate(vec) {
        this.m03 = vec.x;
        this.m13 = vec.y;
        this.m23 = vec.z;
    }
    getTranslate() {
        return new Vector3(this.m03, this.m13, this.m23);
    }
    static translate(vec) {
        return new Matrix44(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
    }
    scale(vec) {
        return this.setComponents(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
    }
    static scale(vec) {
        return new Matrix44(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
    }
    addScale(vec) {
        this.m00 *= vec.x;
        this.m11 *= vec.y;
        this.m22 *= vec.z;
        return this;
    }
    /**
     * Create X oriented Rotation Matrix
     */
    rotateX(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return this.setComponents(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
    }
    /**
     * Create X oriented Rotation Matrix
    */
    static rotateX(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return new Matrix44(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
    }
    /**
     * Create Y oriented Rotation Matrix
     */
    rotateY(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return this.setComponents(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
    }
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return new Matrix44(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
    }
    /**
     * Create Z oriented Rotation Matrix
     */
    rotateZ(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return this.setComponents(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return new Matrix44(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }
    rotateXYZ(x, y, z) {
        var cosX = Math.cos(x);
        var sinX = Math.sin(x);
        var cosY = Math.cos(y);
        var sinY = Math.sin(y);
        var cosZ = Math.cos(z);
        var sinZ = Math.sin(z);
        const xm00 = 1;
        //const xm01 = 0;
        //const xm02 = 0;
        //const xm10 = 0;
        const xm11 = cosX;
        const xm12 = -sinX;
        //const xm20 = 0;
        const xm21 = sinX;
        const xm22 = cosX;
        const ym00 = cosY;
        //const ym01 = 0;
        const ym02 = sinY;
        //const ym10 = 0;
        const ym11 = 1;
        //const ym12 = 0;
        const ym20 = -sinY;
        //const ym21 = 0;
        const ym22 = cosY;
        const zm00 = cosZ;
        const zm01 = -sinZ;
        //const zm02 = 0;
        const zm10 = sinZ;
        const zm11 = cosZ;
        //const zm12 = 0;
        //const zm20 = 0;
        //const zm21 = 0;
        const zm22 = 1;
        const yxm00 = ym00 * xm00;
        const yxm01 = ym02 * xm21;
        const yxm02 = ym02 * xm22;
        //const yxm10 = 0;
        const yxm11 = ym11 * xm11;
        const yxm12 = ym11 * xm12;
        const yxm20 = ym20 * xm00;
        const yxm21 = ym22 * xm21;
        const yxm22 = ym22 * xm22;
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
    }
    /**
     * @return Euler Angles Rotation (x, y, z)
     */
    toEulerAngles() {
        let rotate = null;
        if (Math.abs(this.m20) != 1.0) {
            let y = -Math.asin(this.m20);
            let x = Math.atan2(this.m21 / Math.cos(y), this.m22 / Math.cos(y));
            let z = Math.atan2(this.m10 / Math.cos(y), this.m00 / Math.cos(y));
            rotate = new Vector3(x, y, z);
        }
        else if (this.m20 === -1.0) {
            rotate = new Vector3(Math.atan2(this.m01, this.m02), Math.PI / 2.0, 0.0);
        }
        else {
            rotate = new Vector3(Math.atan2(-this.m01, -this.m02), -Math.PI / 2.0, 0.0);
        }
        return rotate;
    }
    /**
     * zero matrix
     */
    zero() {
        this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        return this;
    }
    static zero() {
        return new Matrix44(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
    flatten() {
        return this.m;
    }
    flattenAsArray() {
        return [this.m[0], this.m[1], this.m[2], this.m[3],
            this.m[4], this.m[5], this.m[6], this.m[7],
            this.m[8], this.m[9], this.m[10], this.m[11],
            this.m[12], this.m[13], this.m[14], this.m[15]];
    }
    _swap(l, r) {
        this.m[r] = [this.m[l], this.m[l] = this.m[r]][0]; // Swap
    }
    /**
     * transpose
     */
    transpose() {
        this._swap(1, 4);
        this._swap(2, 8);
        this._swap(3, 12);
        this._swap(6, 9);
        this._swap(7, 13);
        this._swap(11, 14);
        return this;
    }
    /**
     * transpose(static version)
     */
    static transpose(mat) {
        var mat_t = new Matrix44(mat.m00, mat.m10, mat.m20, mat.m30, mat.m01, mat.m11, mat.m21, mat.m31, mat.m02, mat.m12, mat.m22, mat.m32, mat.m03, mat.m13, mat.m23, mat.m33);
        return mat_t;
    }
    multiplyVector(vec) {
        var x = this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z + this.m03 * vec.w;
        var y = this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z + this.m13 * vec.w;
        var z = this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z + this.m23 * vec.w;
        var w = this.m30 * vec.x + this.m31 * vec.y + this.m32 * vec.z + this.m33 * vec.w;
        return new Vector4(x, y, z, w);
    }
    /**
     * multiply zero matrix and zero matrix
     */
    multiply(mat) {
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
    }
    multiplyByLeft(mat) {
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
    }
    /**
     * multiply zero matrix and zero matrix(static version)
     */
    static multiply(l_m, r_m) {
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
    }
    determinant() {
        return this.m00 * this.m11 * this.m22 * this.m33 + this.m00 * this.m12 * this.m23 * this.m31 + this.m00 * this.m13 * this.m21 * this.m32 +
            this.m01 * this.m10 * this.m23 * this.m32 + this.m01 * this.m12 * this.m20 * this.m33 + this.m01 * this.m13 * this.m22 * this.m30 +
            this.m02 * this.m10 * this.m21 * this.m33 + this.m02 * this.m11 * this.m23 * this.m30 + this.m02 * this.m13 * this.m20 * this.m31 +
            this.m03 * this.m10 * this.m22 * this.m31 + this.m03 * this.m11 * this.m20 * this.m32 + this.m03 * this.m12 * this.m21 * this.m30 -
            this.m00 * this.m11 * this.m23 * this.m32 - this.m00 * this.m12 * this.m21 * this.m33 - this.m00 * this.m13 * this.m22 * this.m31 -
            this.m01 * this.m10 * this.m22 * this.m33 - this.m01 * this.m12 * this.m23 * this.m30 - this.m01 * this.m13 * this.m20 * this.m32 -
            this.m02 * this.m10 * this.m23 * this.m31 - this.m02 * this.m11 * this.m20 * this.m33 - this.m02 * this.m13 * this.m21 * this.m30 -
            this.m03 * this.m10 * this.m21 * this.m32 - this.m03 * this.m11 * this.m22 * this.m30 - this.m03 * this.m12 * this.m20 * this.m31;
    }
    static determinant(mat) {
        return mat.m00 * mat.m11 * mat.m22 * mat.m33 + mat.m00 * mat.m12 * mat.m23 * mat.m31 + mat.m00 * mat.m13 * mat.m21 * mat.m32 +
            mat.m01 * mat.m10 * mat.m23 * mat.m32 + mat.m01 * mat.m12 * mat.m20 * mat.m33 + mat.m01 * mat.m13 * mat.m22 * mat.m30 +
            mat.m02 * mat.m10 * mat.m21 * mat.m33 + mat.m02 * mat.m11 * mat.m23 * mat.m30 + mat.m02 * mat.m13 * mat.m20 * mat.m31 +
            mat.m03 * mat.m10 * mat.m22 * mat.m31 + mat.m03 * mat.m11 * mat.m20 * mat.m32 + mat.m03 * mat.m12 * mat.m21 * mat.m30 -
            mat.m00 * mat.m11 * mat.m23 * mat.m32 - mat.m00 * mat.m12 * mat.m21 * mat.m33 - mat.m00 * mat.m13 * mat.m22 * mat.m31 -
            mat.m01 * mat.m10 * mat.m22 * mat.m33 - mat.m01 * mat.m12 * mat.m23 * mat.m30 - mat.m01 * mat.m13 * mat.m20 * mat.m32 -
            mat.m02 * mat.m10 * mat.m23 * mat.m31 - mat.m02 * mat.m11 * mat.m20 * mat.m33 - mat.m02 * mat.m13 * mat.m21 * mat.m30 -
            mat.m03 * mat.m10 * mat.m21 * mat.m32 - mat.m03 * mat.m11 * mat.m22 * mat.m30 - mat.m03 * mat.m12 * mat.m20 * mat.m31;
    }
    invert() {
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
    }
    static invert(mat) {
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
    }
    set m00(val) {
        this.m[0] = val;
    }
    get m00() {
        return this.m[0];
    }
    set m10(val) {
        this.m[1] = val;
    }
    get m10() {
        return this.m[1];
    }
    set m20(val) {
        this.m[2] = val;
    }
    get m20() {
        return this.m[2];
    }
    set m30(val) {
        this.m[3] = val;
    }
    get m30() {
        return this.m[3];
    }
    set m01(val) {
        this.m[4] = val;
    }
    get m01() {
        return this.m[4];
    }
    set m11(val) {
        this.m[5] = val;
    }
    get m11() {
        return this.m[5];
    }
    set m21(val) {
        this.m[6] = val;
    }
    get m21() {
        return this.m[6];
    }
    set m31(val) {
        this.m[7] = val;
    }
    get m31() {
        return this.m[7];
    }
    set m02(val) {
        this.m[8] = val;
    }
    get m02() {
        return this.m[8];
    }
    set m12(val) {
        this.m[9] = val;
    }
    get m12() {
        return this.m[9];
    }
    set m22(val) {
        this.m[10] = val;
    }
    get m22() {
        return this.m[10];
    }
    set m32(val) {
        this.m[11] = val;
    }
    get m32() {
        return this.m[11];
    }
    set m03(val) {
        this.m[12] = val;
    }
    get m03() {
        return this.m[12];
    }
    set m13(val) {
        this.m[13] = val;
    }
    get m13() {
        return this.m[13];
    }
    set m23(val) {
        this.m[14] = val;
    }
    get m23() {
        return this.m[14];
    }
    set m33(val) {
        this.m[15] = val;
    }
    get m33() {
        return this.m[15];
    }
    toString() {
        return this.m00 + ' ' + this.m01 + ' ' + this.m02 + ' ' + this.m03 + ' \n' +
            this.m10 + ' ' + this.m11 + ' ' + this.m12 + ' ' + this.m13 + ' \n' +
            this.m20 + ' ' + this.m21 + ' ' + this.m22 + ' ' + this.m23 + ' \n' +
            this.m30 + ' ' + this.m31 + ' ' + this.m32 + ' ' + this.m33 + ' \n';
    }
    nearZeroToZero(value) {
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
    }
    toStringApproximately() {
        return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + ' ' + this.nearZeroToZero(this.m03) + ' \n' +
            this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' ' + this.nearZeroToZero(this.m13) + ' \n' +
            this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + ' ' + this.nearZeroToZero(this.m23) + ' \n' +
            this.nearZeroToZero(this.m30) + ' ' + this.nearZeroToZero(this.m31) + ' ' + this.nearZeroToZero(this.m32) + ' ' + this.nearZeroToZero(this.m33) + ' \n';
    }
    getScale() {
        return new Vector3(Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02), Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12), Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22));
    }
    getRotate() {
        const quat = Quaternion.fromMatrix(this);
        const rotateMat = new Matrix44(quat);
        return rotateMat;
    }
}
//GLBoost["Matrix44"] = Matrix44;

// import GLBoost from '../../globals';
class Matrix33 {
    constructor(m0, m1, m2, m3, m4, m5, m6, m7, m8, isColumnMajor = false, notCopyFloatArray = false) {
        const _isColumnMajor = (arguments.length === 10) ? isColumnMajor : m1;
        const _notCopyFloatArray = (arguments.length === 3) ? notCopyFloatArray : false;
        const m = m0;
        if (m == null) {
            this.m = new Float32Array(0);
            return;
        }
        if (arguments.length === 9) {
            this.m = new Float32Array(9);
            if (_isColumnMajor === true) {
                let m = arguments;
                this.setComponents(m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]);
            }
            else {
                this.setComponents.apply(this, arguments); // arguments[0-8] must be row major values if isColumnMajor is false
            }
        }
        else if (Array.isArray(m)) {
            this.m = new Float32Array(9);
            if (_isColumnMajor === true) {
                this.setComponents(m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]);
            }
            else {
                this.setComponents.apply(this, m); // 'm' must be row major array if isColumnMajor is false
            }
        }
        else if (m instanceof Float32Array) {
            if (_notCopyFloatArray) {
                this.m = m;
            }
            else {
                this.m = new Float32Array(9);
                if (_isColumnMajor === true) {
                    this.setComponents(m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]);
                }
                else {
                    this.setComponents.apply(this, m); // 'm' must be row major array if isColumnMajor is false
                }
            }
        }
        else if (!!m && typeof m.m22 !== 'undefined') {
            if (_notCopyFloatArray) {
                this.m = m.m;
            }
            else {
                this.m = new Float32Array(9);
                if (_isColumnMajor === true) {
                    const _m = m;
                    this.setComponents(_m.m00, _m.m01, _m.m02, _m.m10, _m.m11, _m.m12, _m.m20, _m.m21, _m.m22);
                }
                else {
                    const _m = m;
                    this.setComponents(_m.m00, _m.m01, _m.m02, _m.m10, _m.m11, _m.m12, _m.m20, _m.m21, _m.m22); // 'm' must be row major array if isColumnMajor is false
                }
            }
        }
        else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
            this.m = new Float32Array(9);
            const q = m;
            const sx = q.x * q.x;
            const sy = q.y * q.y;
            const sz = q.z * q.z;
            const cx = q.y * q.z;
            const cy = q.x * q.z;
            const cz = q.x * q.y;
            const wx = q.w * q.x;
            const wy = q.w * q.y;
            const wz = q.w * q.z;
            this.setComponents(1.0 - 2.0 * (sy + sz), 2.0 * (cz - wz), 2.0 * (cy + wy), 2.0 * (cz + wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx - wx), 2.0 * (cy - wy), 2.0 * (cx + wx), 1.0 - 2.0 * (sx + sy));
        }
        else {
            this.m = new Float32Array(9);
            this.identity();
        }
    }
    setComponents(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
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
    }
    get className() {
        return this.constructor.name;
    }
    identity() {
        this.setComponents(1, 0, 0, 0, 1, 0, 0, 0, 1);
        return this;
    }
    /**
     * Make this identity matrix（static method version）
     */
    static identity() {
        return new Matrix33(1, 0, 0, 0, 1, 0, 0, 0, 1);
    }
    static dummy() {
        return new Matrix33(null);
    }
    isDummy() {
        if (this.m.length === 0) {
            return true;
        }
        else {
            return false;
        }
    }
    clone() {
        return new Matrix33(this.m[0], this.m[3], this.m[6], this.m[1], this.m[4], this.m[7], this.m[2], this.m[5], this.m[8]);
    }
    /**
     * Create X oriented Rotation Matrix
     */
    rotateX(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return this.setComponents(1, 0, 0, 0, cos, -sin, 0, sin, cos);
    }
    /**
     * Create X oriented Rotation Matrix
     */
    static rotateX(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return new Matrix33(1, 0, 0, 0, cos, -sin, 0, sin, cos);
    }
    /**
     * Create Y oriented Rotation Matrix
     */
    rotateY(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        this.setComponents(cos, 0, sin, 0, 1, 0, -sin, 0, cos);
        return this;
    }
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return new Matrix33(cos, 0, sin, 0, 1, 0, -sin, 0, cos);
    }
    /**
     * Create Z oriented Rotation Matrix
     */
    rotateZ(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return this.setComponents(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
    }
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return new Matrix33(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
    }
    static rotateXYZ(x, y, z) {
        return (Matrix33.rotateZ(z).multiply(Matrix33.rotateY(y).multiply(Matrix33.rotateX(x))));
    }
    static rotate(vec3) {
        return (Matrix33.rotateZ(vec3.z).multiply(Matrix33.rotateY(vec3.y).multiply(Matrix33.rotateX(vec3.x))));
    }
    scale(vec) {
        return this.setComponents(vec.x, 0, 0, 0, vec.y, 0, 0, 0, vec.z);
    }
    static scale(vec) {
        return new Matrix33(vec.x, 0, 0, 0, vec.y, 0, 0, 0, vec.z);
    }
    /**
     * zero matrix
     */
    zero() {
        this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0);
        return this;
    }
    /**
     * zero matrix(static version)
     */
    static zero() {
        return new Matrix33(0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
    flatten() {
        return this.m;
    }
    flattenAsArray() {
        return [this.m[0], this.m[1], this.m[2],
            this.m[3], this.m[4], this.m[5],
            this.m[6], this.m[7], this.m[8]];
    }
    _swap(l, r) {
        this.m[r] = [this.m[l], this.m[l] = this.m[r]][0]; // Swap
    }
    /**
     * transpose
     */
    transpose() {
        this._swap(1, 3);
        this._swap(2, 6);
        this._swap(5, 8);
        return this;
    }
    /**
     * transpose(static version)
     */
    static transpose(mat) {
        var mat_t = new Matrix33(mat.m00, mat.m10, mat.m20, mat.m01, mat.m11, mat.m21, mat.m02, mat.m12, mat.m22);
        return mat_t;
    }
    multiplyVector(vec) {
        var x = this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z;
        var y = this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z;
        var z = this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z;
        return new Vector3(x, y, z);
    }
    /**
     * multiply zero matrix and zero matrix
     */
    multiply(mat) {
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
    }
    /**
     * multiply zero matrix and zero matrix(static version)
     */
    static multiply(l_m, r_m) {
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
    }
    determinant() {
        return this.m00 * this.m11 * this.m22 + this.m10 * this.m21 * this.m02 + this.m20 * this.m01 * this.m12
            - this.m00 * this.m21 * this.m12 - this.m20 * this.m11 * this.m02 - this.m10 * this.m01 * this.m22;
    }
    static determinant(mat) {
        return mat.m00 * mat.m11 * mat.m22 + mat.m10 * mat.m21 * mat.m02 + mat.m20 * mat.m01 * mat.m12
            - mat.m00 * mat.m21 * mat.m12 - mat.m20 * mat.m11 * mat.m02 - mat.m10 * mat.m01 * mat.m22;
    }
    invert() {
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
    }
    static invert(mat) {
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
    }
    set m00(val) {
        this.m[0] = val;
    }
    get m00() {
        return this.m[0];
    }
    set m10(val) {
        this.m[1] = val;
    }
    get m10() {
        return this.m[1];
    }
    set m20(val) {
        this.m[2] = val;
    }
    get m20() {
        return this.m[2];
    }
    set m01(val) {
        this.m[3] = val;
    }
    get m01() {
        return this.m[3];
    }
    set m11(val) {
        this.m[4] = val;
    }
    get m11() {
        return this.m[4];
    }
    set m21(val) {
        this.m[5] = val;
    }
    get m21() {
        return this.m[5];
    }
    set m02(val) {
        this.m[6] = val;
    }
    get m02() {
        return this.m[6];
    }
    set m12(val) {
        this.m[7] = val;
    }
    get m12() {
        return this.m[7];
    }
    set m22(val) {
        this.m[8] = val;
    }
    get m22() {
        return this.m[8];
    }
    toString() {
        return this.m00 + ' ' + this.m01 + ' ' + this.m02 + '\n' +
            this.m10 + ' ' + this.m11 + ' ' + this.m12 + '\n' +
            this.m20 + ' ' + this.m21 + ' ' + this.m22 + '\n';
    }
    nearZeroToZero(value) {
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
    }
    toStringApproximately() {
        return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + '\n' +
            this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' \n' +
            this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + '\n';
    }
    getScale() {
        return new Vector3(Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02), Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12), Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22));
    }
    addScale(vec) {
        this.m00 *= vec.x;
        this.m11 *= vec.y;
        this.m22 *= vec.z;
        return this;
    }
    isEqual(mat, delta = Number.EPSILON) {
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
    }
}
// GLBoost['Matrix33'] = Matrix33;

class AccessorBase extends RnObject {
    constructor({ bufferView, byteOffset, compositionType, componentType, byteStride, count, raw }) {
        super(true);
        this.__compositionType = CompositionType.Unknown;
        this.__componentType = ComponentType.Unknown;
        this.__count = 0;
        this.__takenCount = 0;
        this.__byteStride = 0;
        this.__bufferView = bufferView;
        this.__byteOffsetInBuffer = bufferView.byteOffset + byteOffset;
        this.__compositionType = compositionType;
        this.__componentType = componentType;
        this.__count = count;
        this.__raw = raw.buffer;
        this.__byteStride = byteStride;
        if (this.__byteStride === 0) {
            this.__byteStride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
        }
        this.prepare();
    }
    prepare() {
        const typedArrayClass = this.getTypedArrayClass(this.__componentType);
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
    }
    getTypedArrayClass(componentType) {
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
    }
    getDataViewGetter(componentType) {
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
    }
    getDataViewSetter(componentType) {
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
    }
    takeOne() {
        const arrayBufferOfBufferView = this.__raw;
        // let stride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
        // if (this.__bufferView.isAoS) {
        //   stride = this.__bufferView.byteStride;
        // }
        const subTypedArray = new this.__typedArrayClass(arrayBufferOfBufferView, this.__byteOffsetInBuffer + this.__byteStride * this.__takenCount, this.__compositionType.getNumberOfComponents());
        this.__takenCount += 1;
        return subTypedArray;
    }
    get numberOfComponents() {
        return this.__compositionType.getNumberOfComponents();
    }
    get componentSizeInBytes() {
        return this.__componentType.getSizeInBytes();
    }
    get elementSizeInBytes() {
        return this.numberOfComponents * this.componentSizeInBytes;
    }
    get elementCount() {
        return this.__dataView.byteLength / (this.numberOfComponents * this.componentSizeInBytes);
    }
    get byteLength() {
        return this.__byteStride * this.__count;
    }
    get componentType() {
        return this.__componentType;
    }
    get compositionType() {
        return this.__compositionType;
    }
    getTypedArray() {
        if (this.__bufferView.isAoS) {
            console.warn('Be careful. this referance bufferView is AoS(Array on Structure), it means Interleaved Data. So you can not access your data properly by this TypedArray.');
        }
        return this.__typedArray;
    }
    get isAoS() {
        return this.__bufferView.isAoS;
    }
    get isSoA() {
        return this.__bufferView.isSoA;
    }
    get byteStride() {
        return this.__byteStride;
    }
    getScalar(index, endian = true) {
        return this.__dataViewGetter(this.__byteStride * index, endian);
    }
    getScalarAt(index, compositionOffset, endian = true) {
        return this.__dataViewGetter(this.__byteStride * index + compositionOffset, endian);
    }
    getVec2AsArray(index, endian = true) {
        return [this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian)];
    }
    getVec3AsArray(index, endian = true) {
        return [this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian)];
    }
    getVec4AsArray(index, endian = true) {
        return [this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian)];
    }
    getMat3AsArray(index, endian = true) {
        return [
            this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian),
            this.__dataViewGetter(this.__byteStride * index + 3, endian), this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian),
            this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian), this.__dataViewGetter(this.__byteStride * index + 8, endian),
        ];
    }
    getMat4AsArray(index, endian = true) {
        return [
            this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian),
            this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian), this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian),
            this.__dataViewGetter(this.__byteStride * index + 8, endian), this.__dataViewGetter(this.__byteStride * index + 9, endian), this.__dataViewGetter(this.__byteStride * index + 10, endian), this.__dataViewGetter(this.__byteStride * index + 11, endian),
            this.__dataViewGetter(this.__byteStride * index + 12, endian), this.__dataViewGetter(this.__byteStride * index + 13, endian), this.__dataViewGetter(this.__byteStride * index + 14, endian), this.__dataViewGetter(this.__byteStride * index + 15, endian),
        ];
    }
    getVec2(index, endian = true) {
        return new Vector2_F64(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian));
    }
    getVec3(index, endian = true) {
        return new Vector3(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian));
    }
    getVec4(index, endian = true) {
        return new Vector4(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian));
    }
    getMat3(index, endian = true) {
        return new Matrix33(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian), this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian), this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian), this.__dataViewGetter(this.__byteStride * index + 8, endian));
    }
    getMat4(index, endian = true) {
        return new Matrix44(this.__dataViewGetter(this.__byteStride * index, endian), this.__dataViewGetter(this.__byteStride * index + 1, endian), this.__dataViewGetter(this.__byteStride * index + 2, endian), this.__dataViewGetter(this.__byteStride * index + 3, endian), this.__dataViewGetter(this.__byteStride * index + 4, endian), this.__dataViewGetter(this.__byteStride * index + 5, endian), this.__dataViewGetter(this.__byteStride * index + 6, endian), this.__dataViewGetter(this.__byteStride * index + 7, endian), this.__dataViewGetter(this.__byteStride * index + 8, endian), this.__dataViewGetter(this.__byteStride * index + 9, endian), this.__dataViewGetter(this.__byteStride * index + 10, endian), this.__dataViewGetter(this.__byteStride * index + 11, endian), this.__dataViewGetter(this.__byteStride * index + 12, endian), this.__dataViewGetter(this.__byteStride * index + 13, endian), this.__dataViewGetter(this.__byteStride * index + 14, endian), this.__dataViewGetter(this.__byteStride * index + 15, endian));
    }
    setScalar(index, value, endian = true) {
        this.__dataViewSetter(this.__byteStride * index, value, endian);
    }
    setVec2(index, x, y, endian = true) {
        const sizeInBytes = this.componentSizeInBytes;
        this.__dataViewSetter(this.__byteStride * index, x, endian);
        this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, y, endian);
    }
    setVec3(index, x, y, z, endian = true) {
        const sizeInBytes = this.componentSizeInBytes;
        this.__dataViewSetter(this.__byteStride * index, x, endian);
        this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, y, endian);
        this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, z, endian);
    }
    setVec4(index, x, y, z, w, endian = true) {
        const sizeInBytes = this.componentSizeInBytes;
        this.__dataViewSetter(this.__byteStride * index, x, endian);
        this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, y, endian);
        this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, z, endian);
        this.__dataViewSetter(this.__byteStride * index + 3 * sizeInBytes, w, endian);
    }
    copyFromTypedArray(typedArray) {
        const componentN = this.numberOfComponents;
        const setter = this['setVec' + componentN];
        for (let j = 0; j < (typedArray.byteLength / this.componentSizeInBytes); j++) {
            const idx = Math.floor(j / componentN);
            const idxN = idx * componentN;
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
    }
    setScalarAt(index, conpositionOffset, value, endian = true) {
        this.__dataViewSetter(this.__byteStride * index + conpositionOffset, value, endian);
    }
    get arrayBufferOfBufferView() {
        return this.__raw;
    }
    get dataViewOfBufferView() {
        return this.__dataView;
    }
    get byteOffsetInBufferView() {
        return this.__byteOffsetInBuffer - this.__bufferView.byteOffset;
    }
    get byteOffsetInBuffer() {
        return this.__byteOffsetInBuffer;
    }
    get bufferView() {
        return this.__bufferView;
    }
}

class FlexibleAccessor extends AccessorBase {
    constructor({ bufferView, byteOffset, compositionType, componentType, byteStride, count, raw }) {
        super({ bufferView, byteOffset, compositionType, componentType, byteStride, count, raw });
    }
}

class BufferView extends RnObject {
    constructor({ buffer, byteOffset, byteLength, raw, isAoS }) {
        super(true);
        this.__byteStride = 0;
        this.__target = 0;
        this.__takenByteIndex = 0;
        this.__takenByteOffsetOfFirstElement = 0;
        this.__accessors = [];
        this.__buffer = buffer;
        this.__byteOffset = byteOffset;
        this.__byteLength = byteLength;
        this.__raw = raw;
        this.__isAoS = isAoS;
    }
    set byteStride(stride) {
        this.__byteStride = stride;
    }
    get byteStride() {
        return this.__byteStride;
    }
    get byteLength() {
        return this.__byteLength;
    }
    get byteOffset() {
        return this.__byteOffset;
    }
    get buffer() {
        return this.__buffer;
    }
    get isSoA() {
        return !this.__isAoS;
    }
    recheckIsSoA() {
        if (this.__accessors.length <= 1) {
            return true;
        }
        let firstStrideBytes = this.__accessors[0].byteStride;
        let secondStrideBytes = this.__accessors[1].byteStride;
        let firstElementSizeInBytes = this.__accessors[0].elementSizeInBytes;
        let secondElementSizeInBytes = this.__accessors[1].elementSizeInBytes;
        if (firstStrideBytes === secondStrideBytes &&
            (firstElementSizeInBytes + secondElementSizeInBytes) < firstElementSizeInBytes) {
            return true;
        }
    }
    get isAoS() {
        return this.__isAoS;
    }
    getUint8Array() {
        return this.__raw;
    }
    takeAccessor({ compositionType, componentType, count }) {
        const byteStride = this.byteStride;
        const accessor = this.__takeAccessorInner({ compositionType, componentType, count, byteStride, accessorClass: AccessorBase });
        return accessor;
    }
    takeFlexibleAccessor({ compositionType, componentType, count, byteStride }) {
        const accessor = this.__takeAccessorInner({ compositionType, componentType, count, byteStride, accessorClass: FlexibleAccessor });
        return accessor;
    }
    takeAccessorWithByteOffset({ compositionType, componentType, count, byteOffset }) {
        const byteStride = this.byteStride;
        const accessor = this.__takeAccessorInnerWithByteOffset({ compositionType, componentType, count, byteStride, byteOffset, accessorClass: AccessorBase });
        return accessor;
    }
    takeFlexibleAccessorWithByteOffset({ compositionType, componentType, count, byteStride, byteOffset }) {
        const accessor = this.__takeAccessorInnerWithByteOffset({ compositionType, componentType, count, byteStride, byteOffset, accessorClass: FlexibleAccessor });
        return accessor;
    }
    __takeAccessorInner({ compositionType, componentType, count, byteStride, accessorClass }) {
        let byteOffset = 0;
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
        const accessor = new accessorClass({
            bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw
        });
        this.__accessors.push(accessor);
        return accessor;
    }
    __takeAccessorInnerWithByteOffset({ compositionType, componentType, count, byteStride, byteOffset, accessorClass }) {
        if (byteOffset % 4 !== 0) {
            console.info('Padding bytes added because byteOffset is not 4byte aligned.');
            byteOffset += 4 - byteOffset % 4;
        }
        if (this.__byteOffset % 4 !== 0) {
            console.info('Padding bytes added because byteOffsetFromBuffer is not 4byte aligned.');
            this.__byteOffset += 4 - this.__byteOffset % 4;
        }
        const accessor = new accessorClass({
            bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw
        });
        this.__accessors.push(accessor);
        return accessor;
    }
}

class Buffer$1 extends RnObject {
    constructor({ byteLength, arrayBuffer, name }) {
        super(true);
        this.__byteLength = 0;
        this.__name = '';
        this.__takenBytesIndex = 0;
        this.__bufferViews = [];
        this.__name = name;
        this.__byteLength = byteLength;
        this.__raw = arrayBuffer;
    }
    set name(str) {
        this.__name = str;
    }
    get name() {
        return this.__name;
    }
    getArrayBuffer() {
        return this.__raw;
    }
    takeBufferView({ byteLengthToNeed, byteStride, isAoS }) {
        if (byteLengthToNeed % 4 !== 0) {
            console.info('Padding bytes added because byteLengthToNeed must be a multiple of 4.');
            byteLengthToNeed += 4 - (byteLengthToNeed % 4);
        }
        if (byteStride % 4 !== 0) {
            console.info('Padding bytes added, byteStride must be a multiple of 4.');
            byteStride += 4 - (byteStride % 4);
        }
        const array = new Uint8Array(this.__raw, this.__takenBytesIndex, byteLengthToNeed);
        const bufferView = new BufferView({ buffer: this, byteOffset: this.__takenBytesIndex, byteLength: byteLengthToNeed, raw: array, isAoS: isAoS });
        bufferView.byteStride = byteStride;
        this.__takenBytesIndex += Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed;
        this.__bufferViews.push(bufferView);
        return bufferView;
    }
    takeBufferViewWithByteOffset({ byteLengthToNeed, byteStride, byteOffset, isAoS }) {
        if (byteLengthToNeed % 4 !== 0) {
            console.info('Padding bytes added because byteLengthToNeed must be a multiple of 4.');
            byteLengthToNeed += 4 - (byteLengthToNeed % 4);
        }
        if (byteStride % 4 !== 0) {
            console.info('Padding bytes added, byteStride must be a multiple of 4.');
            byteStride += 4 - (byteStride % 4);
        }
        const array = new Uint8Array(this.__raw, byteOffset, byteLengthToNeed);
        const bufferView = new BufferView({ buffer: this, byteOffset: byteOffset, byteLength: byteLengthToNeed, raw: array, isAoS: isAoS });
        bufferView.byteStride = byteStride;
        this.__bufferViews.push(bufferView);
        return bufferView;
    }
    get byteSizeInUse() {
        return this.__byteLength;
    }
}

class BufferUseClass extends EnumClass {
    constructor({ index, str }) {
        super({ index, str });
    }
}
const GPUInstanceData = new BufferUseClass({ index: 0, str: 'GPUInstanceData' });
const GPUVertexData = new BufferUseClass({ index: 1, str: 'GPUVertexData' });
const UBOGeneric = new BufferUseClass({ index: 2, str: 'UBOGeneric' });
const CPUGeneric = new BufferUseClass({ index: 3, str: 'CPUGeneric' });
const typeList$4 = [GPUInstanceData, GPUVertexData, UBOGeneric, CPUGeneric];
function from$4(index) {
    return _from({ typeList: typeList$4, index });
}
function fromString$2(str) {
    return _fromString({ typeList: typeList$4, str });
}
const BufferUse = Object.freeze({ GPUInstanceData, GPUVertexData, UBOGeneric, CPUGeneric, from: from$4, fromString: fromString$2 });

/**
 * Usage
 * const mm = MemoryManager.getInstance();
 * this.translate = new Vector3(
 *   mm.assignMem(componentUID, propetyId, entityUID, isRendered)
 * );
 */
class MemoryManager {
    constructor() {
        //__entityMaxCount: number;
        this.__buffers = {};
        // BufferForGPUInstanceData
        {
            const arrayBuffer = new ArrayBuffer(MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
            const buffer = new Buffer$1({
                byteLength: arrayBuffer.byteLength,
                arrayBuffer: arrayBuffer,
                name: BufferUse.GPUInstanceData.toString()
            });
            this.__buffers[buffer.name] = buffer;
        }
        // BufferForGPUVertexData
        {
            const arrayBuffer = new ArrayBuffer(MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
            const buffer = new Buffer$1({
                byteLength: arrayBuffer.byteLength,
                arrayBuffer: arrayBuffer,
                name: BufferUse.GPUVertexData.toString()
            });
            this.__buffers[buffer.name] = buffer;
        }
        // BufferForUBO
        {
            const arrayBuffer = new ArrayBuffer((MemoryManager.bufferWidthLength - 1) * (MemoryManager.bufferHeightLength - 1) /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
            const buffer = new Buffer$1({
                byteLength: arrayBuffer.byteLength,
                arrayBuffer: arrayBuffer,
                name: BufferUse.UBOGeneric.toString()
            });
            this.__buffers[buffer.name] = buffer;
        }
        // BufferForCP
        {
            const arrayBuffer = new ArrayBuffer(MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
            const buffer = new Buffer$1({
                byteLength: arrayBuffer.byteLength,
                arrayBuffer: arrayBuffer,
                name: BufferUse.CPUGeneric.toString()
            });
            this.__buffers[buffer.name] = buffer;
        }
    }
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new MemoryManager();
        }
        return this.__instance;
    }
    getBuffer(bufferUse) {
        return this.__buffers[bufferUse.toString()];
    }
    static get bufferWidthLength() {
        return MemoryManager.__bufferWidthLength;
    }
    static get bufferHeightLength() {
        return MemoryManager.__bufferHeightLength;
    }
}
MemoryManager.__bufferWidthLength = Math.pow(2, 8);
MemoryManager.__bufferHeightLength = Math.pow(2, 8);

//import GLBoost from '../../globals';
const FloatArray$1 = Float32Array;
class RowMajarMatrix44 {
    constructor(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, notCopyFloatArray = false) {
        const _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m1;
        const m = m0;
        if (m == null) {
            this.m = new FloatArray$1(0);
            return;
        }
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
            const sx = m.x * m.x;
            const sy = m.y * m.y;
            const sz = m.z * m.z;
            const cx = m.y * m.z;
            const cy = m.x * m.z;
            const cz = m.x * m.y;
            const wx = m.w * m.x;
            const wy = m.w * m.y;
            const wz = m.w * m.z;
            this.setComponents(1.0 - 2.0 * (sy + sz), 2.0 * (cz - wz), 2.0 * (cy + wy), 0.0, 2.0 * (cz + wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx - wx), 0.0, 2.0 * (cy - wy), 2.0 * (cx + wx), 1.0 - 2.0 * (sx + sy), 0.0, 0.0, 0.0, 0.0, 1.0);
        }
        else {
            this.m = new FloatArray$1(16);
            this.identity();
        }
    }
    static dummy() {
        return new RowMajarMatrix44(null);
    }
    isDummy() {
        if (this.m.length === 0) {
            return true;
        }
        else {
            return false;
        }
    }
    setComponents(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
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
    }
    copyComponents(mat4) {
        //this.m.set(mat4.m);
        //this.setComponents.apply(this, mat4.m); // 'm' must be row major array if isColumnMajor is false    
        const m = mat4;
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
    }
    get className() {
        return this.constructor.name;
    }
    clone() {
        return new RowMajarMatrix44(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5], this.m[6], this.m[7], this.m[8], this.m[9], this.m[10], this.m[11], this.m[12], this.m[13], this.m[14], this.m[15]);
    }
    /**
     * to the identity matrix
     */
    identity() {
        this.setComponents(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        return this;
    }
    /**
     * to the identity matrix（static版）
     */
    static identity() {
        return new RowMajarMatrix44(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }
    isEqual(mat, delta = Number.EPSILON) {
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
    }
    translate(vec) {
        return this.setComponents(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
    }
    putTranslate(vec) {
        this.m03 = vec.x;
        this.m13 = vec.y;
        this.m23 = vec.z;
    }
    getTranslate() {
        return new Vector3(this.m03, this.m13, this.m23);
    }
    static translate(vec) {
        return new RowMajarMatrix44(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0, 0, 1, vec.z, 0, 0, 0, 1);
    }
    scale(vec) {
        return this.setComponents(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
    }
    static scale(vec) {
        return new RowMajarMatrix44(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0, 0, vec.z, 0, 0, 0, 0, 1);
    }
    addScale(vec) {
        this.m00 *= vec.x;
        this.m11 *= vec.y;
        this.m22 *= vec.z;
        return this;
    }
    /**
     * Create X oriented Rotation Matrix
     */
    rotateX(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return this.setComponents(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
    }
    /**
     * Create X oriented Rotation Matrix
    */
    static rotateX(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return new RowMajarMatrix44(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
    }
    /**
     * Create Y oriented Rotation Matrix
     */
    rotateY(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return this.setComponents(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
    }
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return new RowMajarMatrix44(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
    }
    /**
     * Create Z oriented Rotation Matrix
     */
    rotateZ(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return this.setComponents(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian) {
        var cos = Math.cos(radian);
        var sin = Math.sin(radian);
        return new RowMajarMatrix44(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }
    rotateXYZ(x, y, z) {
        var cosX = Math.cos(x);
        var sinX = Math.sin(x);
        var cosY = Math.cos(y);
        var sinY = Math.sin(y);
        var cosZ = Math.cos(z);
        var sinZ = Math.sin(z);
        const xm00 = 1;
        //const xm01 = 0;
        //const xm02 = 0;
        //const xm10 = 0;
        const xm11 = cosX;
        const xm12 = -sinX;
        //const xm20 = 0;
        const xm21 = sinX;
        const xm22 = cosX;
        const ym00 = cosY;
        //const ym01 = 0;
        const ym02 = sinY;
        //const ym10 = 0;
        const ym11 = 1;
        //const ym12 = 0;
        const ym20 = -sinY;
        //const ym21 = 0;
        const ym22 = cosY;
        const zm00 = cosZ;
        const zm01 = -sinZ;
        //const zm02 = 0;
        const zm10 = sinZ;
        const zm11 = cosZ;
        //const zm12 = 0;
        //const zm20 = 0;
        //const zm21 = 0;
        const zm22 = 1;
        const yxm00 = ym00 * xm00;
        const yxm01 = ym02 * xm21;
        const yxm02 = ym02 * xm22;
        //const yxm10 = 0;
        const yxm11 = ym11 * xm11;
        const yxm12 = ym11 * xm12;
        const yxm20 = ym20 * xm00;
        const yxm21 = ym22 * xm21;
        const yxm22 = ym22 * xm22;
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
    }
    /**
     * @return Euler Angles Rotation (x, y, z)
     */
    toEulerAngles() {
        let rotate = null;
        if (Math.abs(this.m20) != 1.0) {
            let y = -Math.asin(this.m20);
            let x = Math.atan2(this.m21 / Math.cos(y), this.m22 / Math.cos(y));
            let z = Math.atan2(this.m10 / Math.cos(y), this.m00 / Math.cos(y));
            rotate = new Vector3(x, y, z);
        }
        else if (this.m20 === -1.0) {
            rotate = new Vector3(Math.atan2(this.m01, this.m02), Math.PI / 2.0, 0.0);
        }
        else {
            rotate = new Vector3(Math.atan2(-this.m01, -this.m02), -Math.PI / 2.0, 0.0);
        }
        return rotate;
    }
    /**
     * ゼロ行列
     */
    zero() {
        this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        return this;
    }
    static zero() {
        return new RowMajarMatrix44(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
    flatten() {
        return this.m;
    }
    flattenAsArray() {
        return [this.m[0], this.m[1], this.m[2], this.m[3],
            this.m[4], this.m[5], this.m[6], this.m[7],
            this.m[8], this.m[9], this.m[10], this.m[11],
            this.m[12], this.m[13], this.m[14], this.m[15]];
    }
    _swap(l, r) {
        this.m[r] = [this.m[l], this.m[l] = this.m[r]][0]; // Swap
    }
    /**
     * transpose
     */
    transpose() {
        this._swap(1, 4);
        this._swap(2, 8);
        this._swap(3, 12);
        this._swap(6, 9);
        this._swap(7, 13);
        this._swap(11, 14);
        return this;
    }
    /**
     * transpose(static version)
     */
    static transpose(mat) {
        var mat_t = new RowMajarMatrix44(mat.m00, mat.m10, mat.m20, mat.m30, mat.m01, mat.m11, mat.m21, mat.m31, mat.m02, mat.m12, mat.m22, mat.m32, mat.m03, mat.m13, mat.m23, mat.m33);
        return mat_t;
    }
    multiplyVector(vec) {
        var x = this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z + this.m03 * vec.w;
        var y = this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z + this.m13 * vec.w;
        var z = this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z + this.m23 * vec.w;
        var w = this.m30 * vec.x + this.m31 * vec.y + this.m32 * vec.z + this.m33 * vec.w;
        return new Vector4(x, y, z, w);
    }
    /**
     * multiply zero matrix and zero matrix
     */
    multiply(mat) {
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
    }
    multiplyByLeft(mat) {
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
    }
    /**
     * multiply zero matrix and zero matrix(static version)
     */
    static multiply(l_m, r_m) {
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
    }
    determinant() {
        return this.m00 * this.m11 * this.m22 * this.m33 + this.m00 * this.m12 * this.m23 * this.m31 + this.m00 * this.m13 * this.m21 * this.m32 +
            this.m01 * this.m10 * this.m23 * this.m32 + this.m01 * this.m12 * this.m20 * this.m33 + this.m01 * this.m13 * this.m22 * this.m30 +
            this.m02 * this.m10 * this.m21 * this.m33 + this.m02 * this.m11 * this.m23 * this.m30 + this.m02 * this.m13 * this.m20 * this.m31 +
            this.m03 * this.m10 * this.m22 * this.m31 + this.m03 * this.m11 * this.m20 * this.m32 + this.m03 * this.m12 * this.m21 * this.m30 -
            this.m00 * this.m11 * this.m23 * this.m32 - this.m00 * this.m12 * this.m21 * this.m33 - this.m00 * this.m13 * this.m22 * this.m31 -
            this.m01 * this.m10 * this.m22 * this.m33 - this.m01 * this.m12 * this.m23 * this.m30 - this.m01 * this.m13 * this.m20 * this.m32 -
            this.m02 * this.m10 * this.m23 * this.m31 - this.m02 * this.m11 * this.m20 * this.m33 - this.m02 * this.m13 * this.m21 * this.m30 -
            this.m03 * this.m10 * this.m21 * this.m32 - this.m03 * this.m11 * this.m22 * this.m30 - this.m03 * this.m12 * this.m20 * this.m31;
    }
    static determinant(mat) {
        return mat.m00 * mat.m11 * mat.m22 * mat.m33 + mat.m00 * mat.m12 * mat.m23 * mat.m31 + mat.m00 * mat.m13 * mat.m21 * mat.m32 +
            mat.m01 * mat.m10 * mat.m23 * mat.m32 + mat.m01 * mat.m12 * mat.m20 * mat.m33 + mat.m01 * mat.m13 * mat.m22 * mat.m30 +
            mat.m02 * mat.m10 * mat.m21 * mat.m33 + mat.m02 * mat.m11 * mat.m23 * mat.m30 + mat.m02 * mat.m13 * mat.m20 * mat.m31 +
            mat.m03 * mat.m10 * mat.m22 * mat.m31 + mat.m03 * mat.m11 * mat.m20 * mat.m32 + mat.m03 * mat.m12 * mat.m21 * mat.m30 -
            mat.m00 * mat.m11 * mat.m23 * mat.m32 - mat.m00 * mat.m12 * mat.m21 * mat.m33 - mat.m00 * mat.m13 * mat.m22 * mat.m31 -
            mat.m01 * mat.m10 * mat.m22 * mat.m33 - mat.m01 * mat.m12 * mat.m23 * mat.m30 - mat.m01 * mat.m13 * mat.m20 * mat.m32 -
            mat.m02 * mat.m10 * mat.m23 * mat.m31 - mat.m02 * mat.m11 * mat.m20 * mat.m33 - mat.m02 * mat.m13 * mat.m21 * mat.m30 -
            mat.m03 * mat.m10 * mat.m21 * mat.m32 - mat.m03 * mat.m11 * mat.m22 * mat.m30 - mat.m03 * mat.m12 * mat.m20 * mat.m31;
    }
    invert() {
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
    }
    static invert(mat) {
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
    }
    set m00(val) {
        this.m[0] = val;
    }
    get m00() {
        return this.m[0];
    }
    set m01(val) {
        this.m[1] = val;
    }
    get m01() {
        return this.m[1];
    }
    set m02(val) {
        this.m[2] = val;
    }
    get m02() {
        return this.m[2];
    }
    set m03(val) {
        this.m[3] = val;
    }
    get m03() {
        return this.m[3];
    }
    set m10(val) {
        this.m[4] = val;
    }
    get m10() {
        return this.m[4];
    }
    set m11(val) {
        this.m[5] = val;
    }
    get m11() {
        return this.m[5];
    }
    set m12(val) {
        this.m[6] = val;
    }
    get m12() {
        return this.m[6];
    }
    set m13(val) {
        this.m[7] = val;
    }
    get m13() {
        return this.m[7];
    }
    set m20(val) {
        this.m[8] = val;
    }
    get m20() {
        return this.m[8];
    }
    set m21(val) {
        this.m[9] = val;
    }
    get m21() {
        return this.m[9];
    }
    set m22(val) {
        this.m[10] = val;
    }
    get m22() {
        return this.m[10];
    }
    set m23(val) {
        this.m[11] = val;
    }
    get m23() {
        return this.m[11];
    }
    set m30(val) {
        this.m[12] = val;
    }
    get m30() {
        return this.m[12];
    }
    set m31(val) {
        this.m[13] = val;
    }
    get m31() {
        return this.m[13];
    }
    set m32(val) {
        this.m[14] = val;
    }
    get m32() {
        return this.m[14];
    }
    set m33(val) {
        this.m[15] = val;
    }
    get m33() {
        return this.m[15];
    }
    toString() {
        return this.m00 + ' ' + this.m01 + ' ' + this.m02 + ' ' + this.m03 + ' \n' +
            this.m10 + ' ' + this.m11 + ' ' + this.m12 + ' ' + this.m13 + ' \n' +
            this.m20 + ' ' + this.m21 + ' ' + this.m22 + ' ' + this.m23 + ' \n' +
            this.m30 + ' ' + this.m31 + ' ' + this.m32 + ' ' + this.m33 + ' \n';
    }
    nearZeroToZero(value) {
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
    }
    toStringApproximately() {
        return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + ' ' + this.nearZeroToZero(this.m03) + ' \n' +
            this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' ' + this.nearZeroToZero(this.m13) + ' \n' +
            this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + ' ' + this.nearZeroToZero(this.m23) + ' \n' +
            this.nearZeroToZero(this.m30) + ' ' + this.nearZeroToZero(this.m31) + ' ' + this.nearZeroToZero(this.m32) + ' ' + this.nearZeroToZero(this.m33) + ' \n';
    }
    getScale() {
        return new Vector3(Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02), Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12), Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22));
    }
    getRotate() {
        const quat = Quaternion.fromMatrix(this);
        const rotateMat = new RowMajarMatrix44(quat);
        return rotateMat;
    }
}

class ProcessStageClass extends EnumClass {
    constructor({ index, str, methodName }) {
        super({ index, str });
        this.__methodName = methodName;
    }
    getMethodName() {
        return this.__methodName;
    }
}
const Unknown$3 = new ProcessStageClass({ index: -1, str: 'UNKNOWN', methodName: '$unknown' });
const Create = new ProcessStageClass({ index: 0, str: 'CREATE', methodName: '$create' });
const Load = new ProcessStageClass({ index: 1, str: 'LOAD', methodName: '$load' });
const Mount = new ProcessStageClass({ index: 2, str: 'MOUNT', methodName: '$mount' });
const Logic = new ProcessStageClass({ index: 3, str: 'LOGIC', methodName: '$logic' });
const PreRender = new ProcessStageClass({ index: 4, str: 'PRE_RENDER', methodName: '$prerender' });
const Render = new ProcessStageClass({ index: 5, str: 'RENDER', methodName: '$render' });
const Unmount = new ProcessStageClass({ index: 6, str: 'UNMOUNT', methodName: '$unmount' });
const Discard = new ProcessStageClass({ index: 7, str: 'DISCARD', methodName: '$discard' });
const typeList$5 = [Unknown$3, Create, Load, Mount, Logic, PreRender, Render, Unmount, Discard];
function from$5(index) {
    return _from({ typeList: typeList$5, index });
}
const ProcessStage = Object.freeze({ Unknown: Unknown$3, Create, Load, Mount, Logic, PreRender, Render, Unmount, Discard, from: from$5 });

let maxEntityNumber = 5000;
var Config = Object.freeze({ maxEntityNumber });

class Component {
    constructor(entityUid, componentSid, entityRepository) {
        this.__currentProcessStage = ProcessStage.Create;
        this.__entityUid = entityUid;
        this._component_sid = componentSid;
        this.__isAlive = true;
        this.__currentProcessStage = ProcessStage.Logic;
        const stages = [
            ProcessStage.Create,
            ProcessStage.Load,
            ProcessStage.Mount,
            ProcessStage.Logic,
            ProcessStage.PreRender,
            ProcessStage.Render,
            ProcessStage.Unmount,
            ProcessStage.Discard
        ];
        stages.forEach(stage => {
            if (this.isExistProcessStageMethod(stage)) {
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
    moveStageTo(processStage) {
        Component.__dirtyOfArrayOfProcessStages.set(this.__currentProcessStage, true);
        Component.__dirtyOfArrayOfProcessStages.set(processStage, true);
        this.__currentProcessStage = processStage;
    }
    static get componentTID() {
        return 0;
    }
    get componentSID() {
        return this._component_sid;
    }
    get entityUID() {
        return this.__entityUid;
    }
    static isExistProcessStageMethod(componentTid, processStage, componentRepository) {
        const component = componentRepository.getComponent(componentTid, 0);
        if (component == null) {
            return false;
        }
        if (component[processStage.getMethodName()] == null) {
            return false;
        }
        return true;
    }
    isExistProcessStageMethod(processStage) {
        if (this[processStage.getMethodName()] == null) {
            return false;
        }
        return true;
    }
    static process({ componentTid, processStage, instanceIDBufferUid, processApproach, componentRepository }) {
        if (!Component.isExistProcessStageMethod(componentTid, processStage, componentRepository)) {
            return;
        }
        const array = this.__componentsOfProcessStages.get(processStage);
        for (let i = 0; i < array.length; ++i) {
            if (array[i] === Component.invalidComponentSID) {
                break;
            }
            const componentSid = array[i];
            const component = componentRepository.getComponent(componentTid, componentSid);
            component[processStage.getMethodName()]({
                processStage,
                instanceIDBufferUid,
                processApproach
            });
        }
    }
    static updateComponentsOfEachProcessStage(componentTid, processStage, componentRepository) {
        if (!Component.isExistProcessStageMethod(componentTid, processStage, componentRepository)) {
            return;
        }
        const component = componentRepository.getComponent(this.componentTID, 0);
        const dirty = Component.__componentsOfProcessStages.get(processStage);
        if (dirty) {
            const components = componentRepository.getComponentsWithType(componentTid);
            const array = Component.__componentsOfProcessStages.get(processStage);
            let count = 0;
            for (let i = 0; i < components.length; ++i) {
                const component = components[i];
                if (processStage === component.__currentProcessStage) {
                    array[count++] = component.componentSID;
                }
            }
            array[count] = Component.invalidComponentSID;
        }
    }
    static getByteLengthSumOfMembers(bufferUse, componentClass) {
        const byteLengthSumOfMembers = this.__byteLengthSumOfMembers.get(componentClass);
        return byteLengthSumOfMembers.get(bufferUse);
    }
    static setupBufferView() {
    }
    registerDependency(component, isMust) {
    }
    static takeBufferViewer(bufferUse, componentClass, byteLengthSumOfMembers) {
        const buffer = MemoryManager.getInstance().getBuffer(bufferUse);
        const count = Config.maxEntityNumber;
        if (!this.__bufferViews.has(componentClass)) {
            this.__bufferViews.set(componentClass, new Map());
        }
        const bufferViews = this.__bufferViews.get(componentClass);
        if (!bufferViews.has(bufferUse)) {
            bufferViews.set(bufferUse, buffer.takeBufferView({ byteLengthToNeed: byteLengthSumOfMembers * count, byteStride: 0, isAoS: false }));
        }
    }
    takeOne(memberName, dataClassType) {
        if (!this['_' + memberName].isDummy()) {
            return;
        }
        let taken = Component.__accessors.get(this.constructor).get(memberName).takeOne();
        if (dataClassType === Matrix44) {
            this['_' + memberName] = new dataClassType(taken, false, true);
        }
        else if (dataClassType === RowMajarMatrix44) {
            this['_' + memberName] = new dataClassType(taken, true);
        }
        else {
            this['_' + memberName] = new dataClassType(taken);
        }
        return null;
    }
    static getAccessor(memberName, componentClass) {
        return this.__accessors.get(componentClass).get(memberName);
    }
    static takeAccessor(bufferUse, memberName, componentClass, compositionType, componentType) {
        const count = Config.maxEntityNumber;
        if (!this.__accessors.has(componentClass)) {
            this.__accessors.set(componentClass, new Map());
        }
        const accessors = this.__accessors.get(componentClass);
        if (!accessors.has(memberName)) {
            const bufferViews = this.__bufferViews.get(componentClass);
            accessors.set(memberName, bufferViews.get(bufferUse).takeAccessor({ compositionType: compositionType, componentType, count: count }));
        }
    }
    static getByteOffsetOfThisComponentTypeInBuffer(bufferUse, componentClass) {
        return this.__bufferViews.get(componentClass).get(bufferUse).byteOffset;
    }
    static getByteOffsetOfFirstOfThisMemberInBuffer(memberName, componentClass) {
        return this.__accessors.get(componentClass).get(memberName).byteOffsetInBuffer;
    }
    static getByteOffsetOfFirstOfThisMemberInBufferView(memberName, componentClass) {
        return this.__accessors.get(componentClass).get(memberName).byteOffsetInBufferView;
    }
    static getCompositionTypeOfMember(memberName, componentClass) {
        const memberInfoArray = this.__memberInfo.get(componentClass);
        const info = memberInfoArray.find(info => {
            return info.memberName === memberName;
        });
        if (info != null) {
            return info.compositionType;
        }
        else {
            return null;
        }
    }
    static getComponentTypeOfMember(memberName, componentClass) {
        const memberInfoArray = this.__memberInfo.get(componentClass);
        const info = memberInfoArray.find(info => {
            return info.memberName === memberName;
        });
        if (info != null) {
            return info.componentType;
        }
        else {
            return null;
        }
    }
    registerMember(bufferUse, memberName, dataClassType, compositionType, componentType) {
        if (!Component.__memberInfo.has(this.constructor)) {
            Component.__memberInfo.set(this.constructor, []);
        }
        const memberInfoArray = Component.__memberInfo.get(this.constructor);
        memberInfoArray.push({ bufferUse, memberName, dataClassType, compositionType, componentType });
    }
    submitToAllocation() {
        const componentClass = this.constructor;
        const memberInfoArray = Component.__memberInfo.get(componentClass);
        if (this._component_sid <= 1) {
            if (!Component.__members.has(componentClass)) {
                Component.__members.set(componentClass, new Map());
            }
            const member = Component.__members.get(componentClass);
            memberInfoArray.forEach(info => {
                member.set(info.bufferUse, []);
            });
            memberInfoArray.forEach(info => {
                member.get(info.bufferUse).push(info);
            });
            for (let bufferUse of member.keys()) {
                const infoArray = member.get(bufferUse);
                const bufferUseName = bufferUse.toString();
                if (!Component.__byteLengthSumOfMembers.has(componentClass)) {
                    Component.__byteLengthSumOfMembers.set(componentClass, new Map());
                }
                let byteLengthSumOfMembers = Component.__byteLengthSumOfMembers.get(componentClass);
                if (!byteLengthSumOfMembers.has(bufferUse)) {
                    byteLengthSumOfMembers.set(bufferUse, 0);
                }
                infoArray.forEach(info => {
                    byteLengthSumOfMembers.set(bufferUse, byteLengthSumOfMembers.get(bufferUse) +
                        info.compositionType.getNumberOfComponents() * info.componentType.getSizeInBytes());
                });
                if (infoArray.length > 0) {
                    Component.takeBufferViewer(bufferUse, componentClass, byteLengthSumOfMembers.get(bufferUse));
                }
            }
            for (let bufferUse of member.keys()) {
                const infoArray = member.get(bufferUse);
                infoArray.forEach(info => {
                    Component.takeAccessor(info.bufferUse, info.memberName, componentClass, info.compositionType, info.componentType);
                });
            }
        }
        const member = Component.__members.get(componentClass);
        // takeOne
        for (let bufferUse of member.keys()) {
            const infoArray = member.get(bufferUse);
            infoArray.forEach(info => {
                this.takeOne(info.memberName, info.dataClassType);
            });
        }
    }
}
Component.invalidComponentSID = -1;
Component.__componentsOfProcessStages = new Map();
Component.__lengthOfArrayOfProcessStages = new Map();
Component.__dirtyOfArrayOfProcessStages = new Map();
Component.__bufferViews = new Map();
Component.__accessors = new Map();
Component.__byteLengthSumOfMembers = new Map();
Component.__memberInfo = new Map();
Component.__members = new Map();

class InitialSetting {
}
InitialSetting.maxEntityNumber = 10000;

class ComponentRepository {
    constructor() {
        this.__component_sid_count_map = new Map();
        this.__components = new Map();
    }
    static registerComponentClass(componentTID, componentClass) {
        const thisClass = ComponentRepository;
        thisClass.__componentClasses.set(componentTID, componentClass);
    }
    static unregisterComponentClass(componentTID) {
        const thisClass = ComponentRepository;
        thisClass.__componentClasses.delete(componentTID);
    }
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new ComponentRepository();
        }
        return this.__instance;
    }
    static getComponentClass(componentTid) {
        return this.__componentClasses.get(componentTid);
    }
    createComponent(componentTid, entityUid, entityRepository) {
        const thisClass = ComponentRepository;
        const componentClass = thisClass.__componentClasses.get(componentTid);
        if (componentClass != null) {
            let component_sid_count = this.__component_sid_count_map.get(componentTid);
            if (!IsUtil.exist(component_sid_count)) {
                this.__component_sid_count_map.set(componentTid, 0);
                component_sid_count = Component.invalidComponentSID;
            }
            this.__component_sid_count_map.set(componentTid, ++component_sid_count);
            const component = new componentClass(entityUid, component_sid_count, entityRepository);
            if (!this.__components.has(componentTid)) {
                this.__components.set(componentTid, []);
            }
            const array = this.__components.get(componentTid);
            if (array != null) {
                array[component.componentSID] = component;
                return component;
            }
        }
        return null;
    }
    getComponent(componentTid, componentSid) {
        const map = this.__components.get(componentTid);
        if (map != null) {
            const component = map[componentSid];
            if (component != null) {
                return map[componentSid];
            }
            else {
                return null;
            }
        }
        return null;
    }
    static getMemoryBeginIndex(componentTid) {
        let memoryBeginIndex = 0;
        for (let i = 0; i < componentTid; i++) {
            const componentClass = ComponentRepository.__componentClasses.get(i);
            if (componentClass != null) {
                const sizeOfComponent = componentClass.sizeOfThisComponent;
                const maxEntityNumber = InitialSetting.maxEntityNumber;
                memoryBeginIndex += sizeOfComponent * maxEntityNumber;
            }
        }
        return memoryBeginIndex;
    }
    getComponentsWithType(componentTid) {
        const components = this.__components.get(componentTid);
        const copyArray = components; //.concat();
        //copyArray.shift();
        return copyArray;
    }
    getComponentTIDs() {
        const indices = [];
        for (let type of this.__components.keys()) {
            indices.push(type);
        }
        return indices;
    }
}
ComponentRepository.__componentClasses = new Map();

class EntityRepository {
    constructor() {
        this.__entity_uid_count = Entity.invalidEntityUID;
        this.__entities = [];
        this._components = [];
        this.__componentRepository = ComponentRepository.getInstance();
    }
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new EntityRepository();
        }
        return this.__instance;
    }
    createEntity(componentTidArray) {
        const entity = new Entity(++this.__entity_uid_count, true, this);
        this.__entities[this.__entity_uid_count] = entity;
        for (let componentTid of componentTidArray) {
            const component = this.__componentRepository.createComponent(componentTid, entity.entityUID, this);
            let map = this._components[entity.entityUID];
            if (map == null) {
                map = new Map();
                this._components[entity.entityUID] = map;
            }
            if (component != null) {
                map.set(componentTid, component);
            }
        }
        return entity;
    }
    getEntity(entityUid) {
        return this.__entities[entityUid];
    }
    getComponentOfEntity(entityUid, componentTid) {
        const entity = this._components[entityUid];
        let component = null;
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
    }
    _getEntities() {
        return this.__entities.concat();
    }
}

class SceneGraphComponent extends Component {
    constructor(entityUid, componentSid, entityComponent) {
        super(entityUid, componentSid, entityComponent);
        this._worldMatrix = RowMajarMatrix44.dummy();
        this.__isWorldMatrixUpToDate = false;
        this.__tmpMatrix = Matrix44.identity();
        this.__currentProcessStage = ProcessStage.Logic;
        let count = Component.__lengthOfArrayOfProcessStages.get(ProcessStage.Logic);
        const array = Component.__componentsOfProcessStages.get(ProcessStage.Logic);
        array[count++] = this.componentSID;
        array[count] = Component.invalidComponentSID;
        Component.__lengthOfArrayOfProcessStages.set(ProcessStage.Logic, count);
        this.__isAbleToBeParent = false;
        this.beAbleToBeParent(true);
        this.registerMember(BufferUse.GPUInstanceData, 'worldMatrix', RowMajarMatrix44, CompositionType.Mat4, ComponentType.Float);
        this.submitToAllocation();
        this._worldMatrix.identity();
        //this.__updatedProperly = false;
    }
    static get componentTID() {
        return WellKnownComponentTIDs.SceneGraphComponentTID;
    }
    beAbleToBeParent(flag) {
        this.__isAbleToBeParent = flag;
        if (this.__isAbleToBeParent) {
            this.__children = [];
        }
        else {
            this.__children = void 0;
        }
    }
    setWorldMatrixDirty() {
        this.__isWorldMatrixUpToDate = false;
    }
    addChild(sg) {
        if (this.__children != null) {
            sg.__parent = this;
            this.__children.push(sg);
        }
        else {
            console.error('This is not allowed to have children.');
        }
    }
    get worldMatrixInner() {
        if (!this.__isWorldMatrixUpToDate) {
            //this._worldMatrix.identity();
            this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively());
            this.__isWorldMatrixUpToDate = true;
        }
        return this._worldMatrix;
    }
    get worldMatrix() {
        return this.worldMatrixInner.clone();
    }
    $logic() {
        if (!this.__isWorldMatrixUpToDate) {
            //this._worldMatrix.identity();
            this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively());
            this.__isWorldMatrixUpToDate = true;
        }
    }
    calcWorldMatrixRecursively() {
        const entity = this.__entityRepository.getEntity(this.__entityUid);
        const transform = entity.getTransform();
        if (this.__isWorldMatrixUpToDate) {
            return this._worldMatrix;
        }
        else {
            const matrix = transform.matrixInner;
            if (this.__parent == null) {
                return matrix;
            }
            this.__tmpMatrix.copyComponents(matrix);
            const matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
            this.__tmpMatrix.multiplyByLeft(matrixFromAncestorToParent);
        }
        return this.__tmpMatrix;
    }
}
ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);

// import AnimationComponent from './AnimationComponent';
class TransformComponent extends Component {
    constructor(entityUid, componentSid, entityComponent) {
        super(entityUid, componentSid, entityComponent);
        this._translate = Vector3.dummy();
        this._rotate = Vector3.dummy();
        this._scale = Vector3.dummy();
        this._quaternion = Quaternion.dummy();
        this._matrix = Matrix44.dummy();
        this._invMatrix = Matrix44.dummy();
        this._normalMatrix = Matrix33.dummy();
        this.__toUpdateAllTransform = true;
        this._updateCount = 0;
        this.__updateCountAtLastLogic = 0;
        // dependencies
        this._dependentAnimationComponentId = 0;
        this.registerMember(BufferUse.CPUGeneric, 'translate', Vector3, CompositionType.Vec3, ComponentType.Float);
        this.registerMember(BufferUse.CPUGeneric, 'rotate', Vector3, CompositionType.Vec3, ComponentType.Float);
        this.registerMember(BufferUse.CPUGeneric, 'scale', Vector3, CompositionType.Vec3, ComponentType.Float);
        this.registerMember(BufferUse.CPUGeneric, 'quaternion', Quaternion, CompositionType.Vec4, ComponentType.Float);
        this.registerMember(BufferUse.CPUGeneric, 'matrix', Matrix44, CompositionType.Mat4, ComponentType.Float);
        this.registerMember(BufferUse.CPUGeneric, 'invMatrix', Matrix44, CompositionType.Mat4, ComponentType.Float);
        this.registerMember(BufferUse.CPUGeneric, 'normalMatrix', Matrix33, CompositionType.Mat3, ComponentType.Float);
        this.submitToAllocation();
        this._quaternion.identity();
        this._matrix.identity();
        this._translate.zero();
        this._rotate.zero();
        this._scale.one();
        this._invMatrix.identity();
        this._normalMatrix.identity();
        this._is_translate_updated = true;
        this._is_euler_angles_updated = true;
        this._is_scale_updated = true;
        this._is_quaternion_updated = true;
        this._is_trs_matrix_updated = true;
        this._is_inverse_trs_matrix_updated = true;
        this._is_normal_trs_matrix_updated = true;
    }
    static get renderedPropertyCount() {
        return null;
    }
    static get componentTID() {
        return WellKnownComponentTIDs.TransformComponentTID;
    }
    $logic() {
        if (this.__updateCountAtLastLogic !== this._updateCount) {
            const sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent.componentTID);
            sceneGraphComponent.setWorldMatrixDirty();
            this.__updateCountAtLastLogic = this._updateCount;
        }
    }
    set toUpdateAllTransform(flag) {
        this.__toUpdateAllTransform = flag;
    }
    get toUpdateAllTransform() {
        return this.__toUpdateAllTransform;
    }
    _needUpdate() {
        this._updateCount++;
    }
    set translate(vec) {
        this._translate.v[0] = vec.v[0];
        this._translate.v[1] = vec.v[1];
        this._translate.v[2] = vec.v[2];
        this._is_translate_updated = true;
        this._is_trs_matrix_updated = false;
        this._is_inverse_trs_matrix_updated = false;
        this._is_normal_trs_matrix_updated = false;
        this.__updateTransform();
    }
    get translate() {
        return this.translateInner.clone();
    }
    get translateInner() {
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
    }
    set rotate(vec) {
        this._rotate.v[0] = vec.v[0];
        this._rotate.v[1] = vec.v[1];
        this._rotate.v[2] = vec.v[2];
        this._is_euler_angles_updated = true;
        this._is_quaternion_updated = false;
        this._is_trs_matrix_updated = false;
        this._is_inverse_trs_matrix_updated = false;
        this._is_normal_trs_matrix_updated = false;
        this.__updateTransform();
    }
    get rotate() {
        return this.rotateInner.clone();
    }
    get rotateInner() {
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
    }
    set scale(vec) {
        this._scale.v[0] = vec.v[0];
        this._scale.v[1] = vec.v[1];
        this._scale.v[2] = vec.v[2];
        this._is_scale_updated = true;
        this._is_trs_matrix_updated = false;
        this._is_inverse_trs_matrix_updated = false;
        this._is_normal_trs_matrix_updated = false;
        this.__updateTransform();
    }
    get scale() {
        return this.scaleInner.clone();
    }
    get scaleInner() {
        if (this._is_scale_updated) {
            return this._scale;
        }
        else if (this._is_trs_matrix_updated) {
            let m = this._matrix;
            this._scale.x = Math.sqrt(m.m00 * m.m00 + m.m01 * m.m01 + m.m02 * m.m02);
            this._scale.y = Math.sqrt(m.m10 * m.m10 + m.m11 * m.m11 + m.m12 * m.m12);
            this._scale.z = Math.sqrt(m.m20 * m.m20 + m.m21 * m.m21 + m.m22 * m.m22);
            this._is_scale_updated = true;
        }
        return this._scale;
    }
    set quaternion(quat) {
        this._quaternion.v[0] = quat.v[0];
        this._quaternion.v[1] = quat.v[1];
        this._quaternion.v[2] = quat.v[2];
        this._is_quaternion_updated = true;
        this._is_euler_angles_updated = false;
        this._is_trs_matrix_updated = false;
        this._is_inverse_trs_matrix_updated = false;
        this._is_normal_trs_matrix_updated = false;
        this.__updateTransform();
    }
    get quaternion() {
        return this.quaternionInner.clone();
    }
    get quaternionInner() {
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
    }
    set matrix(mat) {
        this._matrix = mat.clone();
        this._is_trs_matrix_updated = true;
        this._is_translate_updated = false;
        this._is_euler_angles_updated = false;
        this._is_quaternion_updated = false;
        this._is_scale_updated = false;
        this._is_inverse_trs_matrix_updated = false;
        this._is_normal_trs_matrix_updated = false;
        this.__updateTransform();
    }
    get matrix() {
        return this.matrixInner.clone();
    }
    get matrixInner() {
        if (this._is_trs_matrix_updated) {
            return this._matrix;
        }
        // Clear and set Scale
        const scale = this.scaleInner;
        const n00 = scale.v[0];
        // const n01 = 0;
        // const n02 = 0;
        // const n03 = 0;
        // const n10 = 0;
        const n11 = scale.v[1];
        // const n12 = 0;
        // const n13 = 0;
        // const n20 = 0;
        // const n21 = 0;
        const n22 = scale.v[2];
        // const n23 = 0;
        // const n30 = 0;
        // const n31 = 0;
        // const n32 = 0;
        // const n33 = 1;
        const q = this.quaternionInner;
        const sx = q.v[0] * q.v[0];
        const sy = q.v[1] * q.v[1];
        const sz = q.v[2] * q.v[2];
        const cx = q.v[1] * q.v[2];
        const cy = q.v[0] * q.v[2];
        const cz = q.v[0] * q.v[1];
        const wx = q.v[3] * q.v[0];
        const wy = q.v[3] * q.v[1];
        const wz = q.v[3] * q.v[2];
        const m00 = 1.0 - 2.0 * (sy + sz);
        const m01 = 2.0 * (cz - wz);
        const m02 = 2.0 * (cy + wy);
        // const m03 = 0.0;
        const m10 = 2.0 * (cz + wz);
        const m11 = 1.0 - 2.0 * (sx + sz);
        const m12 = 2.0 * (cx - wx);
        // const m13 = 0.0;
        const m20 = 2.0 * (cy - wy);
        const m21 = 2.0 * (cx + wx);
        const m22 = 1.0 - 2.0 * (sx + sy);
        // const m23 = 0.0;
        // const m30 = 0.0;
        // const m31 = 0.0;
        // const m32 = 0.0;
        // const m33 = 1.0;
        const translate = this.translateInner;
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
    }
    get inverseMatrix() {
        return this.inverseMatrixInner.clone();
    }
    get inverseMatrixInner() {
        if (!this._is_inverse_trs_matrix_updated) {
            this._invMatrix = this.matrix.invert();
            this._is_inverse_trs_matrix_updated = true;
        }
        return this._invMatrix;
    }
    get normalMatrix() {
        return this.normalMatrixInner.clone();
    }
    get normalMatrixInner() {
        if (!this._is_normal_trs_matrix_updated) {
            this._normalMatrix = new Matrix33(Matrix44.invert(this.matrix).transpose());
            this._is_normal_trs_matrix_updated = true;
        }
        return this._normalMatrix;
    }
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
    setTransform(translate, rotate, scale, quaternion, matrix) {
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
    }
    __updateTransform() {
        if (this.__toUpdateAllTransform) {
            this.__updateRotation();
            this.__updateTranslate();
            this.__updateScale();
        }
        //this.__updateMatrix();
        this._needUpdate();
    }
    __updateRotation() {
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
            const m = this._matrix;
            this._quaternion.fromMatrix(m);
            this._is_quaternion_updated = true;
            this._rotate = m.toEulerAngles();
            this._is_euler_angles_updated = true;
        }
    }
    __updateTranslate() {
        if (!this._is_translate_updated && this._is_trs_matrix_updated) {
            const m = this._matrix;
            this._translate.x = m.m03;
            this._translate.y = m.m13;
            this._translate.z = m.m23;
            this._is_translate_updated = true;
        }
    }
    __updateScale() {
        if (!this._is_scale_updated && this._is_trs_matrix_updated) {
            const m = this._matrix;
            this._scale.x = Math.sqrt(m.m00 * m.m00 + m.m01 * m.m01 + m.m02 * m.m02);
            this._scale.y = Math.sqrt(m.m10 * m.m10 + m.m11 * m.m11 + m.m12 * m.m12);
            this._scale.z = Math.sqrt(m.m20 * m.m20 + m.m21 * m.m21 + m.m22 * m.m22);
            this._is_scale_updated = true;
        }
    }
    __updateMatrix() {
        if (!this._is_trs_matrix_updated && this._is_translate_updated && this._is_quaternion_updated && this._is_scale_updated) {
            const rotationMatrix = new Matrix44(this._quaternion);
            let scale = this._scale;
            this._matrix = Matrix44.multiply(rotationMatrix, Matrix44.scale(scale));
            let translateVec = this._translate;
            this._matrix.m03 = translateVec.x;
            this._matrix.m13 = translateVec.y;
            this._matrix.m23 = translateVec.z;
            this._is_trs_matrix_updated = true;
        }
    }
    setPropertiesFromJson(arg) {
        let json = arg;
        if (typeof arg === "string") {
            json = JSON.parse(arg);
        }
        for (let key in json) {
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
    }
    setRotationFromNewUpAndFront(UpVec, FrontVec) {
        let yDir = UpVec;
        let xDir = Vector3.cross(yDir, FrontVec);
        let zDir = Vector3.cross(xDir, yDir);
        let rotateMatrix = Matrix44.identity();
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
    }
    headToDirection(fromVec, toVec) {
        const fromDir = Vector3.normalize(fromVec);
        const toDir = Vector3.normalize(toVec);
        const rotationDir = Vector3.cross(fromDir, toDir);
        const cosTheta = Vector3.dotProduct(fromDir, toDir);
        let theta = Math.acos(cosTheta);
        this.quaternion = Quaternion.axisAngle(rotationDir, theta);
    }
    set rotateMatrix44(rotateMatrix) {
        this.quaternion.fromMatrix(rotateMatrix);
    }
    get rotateMatrix44() {
        return new Matrix44(this.quaternion);
    }
}
TransformComponent.__tmpMat_updateRotation = Matrix44.identity();
TransformComponent.__tmpMat_quaternionInner = Matrix44.identity();
ComponentRepository.registerComponentClass(TransformComponent.componentTID, TransformComponent);

class MeshComponent extends Component {
    constructor(entityUid, componentSid, entityComponent) {
        super(entityUid, componentSid, entityComponent);
        this.__primitives = [];
    }
    static get componentTID() {
        return 3;
    }
    addPrimitive(primitive) {
        this.__primitives.push(primitive);
    }
    getPrimitiveAt(i) {
        return this.__primitives[i];
    }
    getPrimitiveNumber() {
        return this.__primitives.length;
    }
}
ComponentRepository.registerComponentClass(MeshComponent.componentTID, MeshComponent);

class ProcessApproachClass extends EnumClass {
    constructor({ index, str }) {
        super({ index, str });
    }
}
const None = new ProcessApproachClass({ index: 0, str: 'NONE' });
const UniformWebGL1 = new ProcessApproachClass({ index: 1, str: 'UNIFORM_WEBGL1' });
const DataTextureWebGL1 = new ProcessApproachClass({ index: 2, str: 'DATA_TEXTURE_WEBGL1' });
const DataTextureWebGL2 = new ProcessApproachClass({ index: 3, str: 'DATA_TEXTURE_WEBGL2' });
const UBOWebGL2 = new ProcessApproachClass({ index: 4, str: 'UBO_WEBGL2' });
const TransformFeedbackWebGL2 = new ProcessApproachClass({ index: 5, str: 'TRNASFORM_FEEDBACK_WEBGL2' });
const ProcessApproach = Object.freeze({ None, UniformWebGL1, DataTextureWebGL1, DataTextureWebGL2, UBOWebGL2, TransformFeedbackWebGL2 });

//import GLBoost from '../../globals';
function radianToDegree(rad) {
    return rad * 180 / Math.PI;
}
function degreeToRadian(deg) {
    return deg * Math.PI / 180;
}
// https://gamedev.stackexchange.com/questions/17326/conversion-of-a-number-from-single-precision-floating-point-representation-to-a/17410#17410
const toHalfFloat = (function () {
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
const MathUtil = Object.freeze({ radianToDegree, degreeToRadian, toHalfFloat });

class GLSLShader {
    static get glsl_rt0() {
        if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
            return 'layout(location = 0) out vec4 rt0;\n';
        }
        else {
            return 'vec4 rt0;\n';
        }
    }
    static get glsl_fragColor() {
        if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
            return '';
        }
        else {
            return 'gl_FragColor = rt0;\n';
        }
    }
    static get glsl_vertex_in() {
        if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
            return 'in';
        }
        else {
            return 'attribute';
        }
    }
    static get glsl_fragment_in() {
        if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
            return 'in';
        }
        else {
            return 'varying';
        }
    }
    static get glsl_vertex_out() {
        if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
            return 'out';
        }
        else {
            return 'varying';
        }
    }
    static get glsl_texture() {
        if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
            return 'texture';
        }
        else {
            return 'texture2D';
        }
    }
    static get glsl_versionText() {
        if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper.isWebGL2) {
            return '#version 300 es\n';
        }
        else {
            return '';
        }
    }
    static get vertexShaderVariableDefinitions() {
        const _version = this.glsl_versionText;
        const _in = this.glsl_vertex_in;
        const _out = this.glsl_vertex_out;
        return `${_version}
precision highp float;
${_in} vec3 a_position;
${_in} vec3 a_color;
${_in} float a_instanceID;
${_out} vec3 v_color;`;
    }
    ;
    static get fragmentShaderSimple() {
        const _version = this.glsl_versionText;
        const _in = this.glsl_fragment_in;
        const _def_rt0 = this.glsl_rt0;
        const _def_fragColor = this.glsl_fragColor;
        return `${_version}
precision highp float;
${_in} vec3 v_color;
${_def_rt0}
void main ()
{
  rt0 = vec4(v_color, 1.0);
  ${_def_fragColor}
}
`;
    }
    static get fragmentShader() {
        return GLSLShader.fragmentShaderSimple;
    }
}
GLSLShader.vertexShaderBody = `

void main ()
{
  mat4 matrix = getMatrix(a_instanceID);
  //mat4 matrix = getMatrix(gl_InstanceID);

  gl_Position = matrix * vec4(a_position, 1.0);
  // gl_Position = vec4(a_position, 1.0);
  // gl_Position.xyz /= 10.0;
  // gl_Position.x += a_instanceID / 20.0;
//  gl_Position.x += col0.x / 5.0;

  v_color = a_color;
}
  `;
GLSLShader.attributeNames = ['a_position', 'a_color', 'a_instanceID'];
GLSLShader.attributeSemantics = [VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Instance];

class WebGLStrategyUBO {
    constructor() {
        this.__webglResourceRepository = WebGLResourceRepository.getInstance();
        this.__uboUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
        this.__shaderProgramUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
        this.__vertexHandles = [];
        this.__isVAOSet = false;
        this.vertexShaderMethodDefinitions_UBO = `layout (std140) uniform matrix {
    mat4 world[1024];
  } u_matrix;

  mat4 getMatrix(float instanceId) {
    float index = instanceId;
    return transpose(u_matrix.world[int(index)]);
  }
  `;
    }
    setupShaderProgram() {
        if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
            return;
        }
        // Shader Setup
        let vertexShader = GLSLShader.vertexShaderVariableDefinitions +
            this.vertexShaderMethodDefinitions_UBO +
            GLSLShader.vertexShaderBody;
        let fragmentShader = GLSLShader.fragmentShader;
        this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram({
            vertexShaderStr: vertexShader,
            fragmentShaderStr: fragmentShader,
            attributeNames: GLSLShader.attributeNames,
            attributeSemantics: GLSLShader.attributeSemantics
        });
    }
    __isLoaded(index) {
        if (this.__vertexHandles[index] != null) {
            return true;
        }
        else {
            return false;
        }
    }
    $load(meshComponent) {
        if (this.__isLoaded(0)) {
            return;
        }
        const primitiveNum = meshComponent.getPrimitiveNumber();
        for (let i = 0; i < primitiveNum; i++) {
            const primitive = meshComponent.getPrimitiveAt(i);
            const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
            this.__vertexHandles[i] = vertexHandles;
            WebGLStrategyUBO.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles);
        }
    }
    $prerender(meshComponent, instanceIDBufferUid) {
        if (this.__isVAOSet) {
            return;
        }
        const primitiveNum = meshComponent.getPrimitiveNumber();
        for (let i = 0; i < primitiveNum; i++) {
            const primitive = meshComponent.getPrimitiveAt(i);
            // if (this.__isLoaded(i) && this.__isVAOSet) {
            this.__vertexHandles[i] = WebGLStrategyUBO.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUid);
            //this.__vertexShaderProgramHandles[i] = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
            //  continue;
            // }
            this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
        }
        this.__isVAOSet = true;
    }
    common_$prerender() {
        const memoryManager = MemoryManager.getInstance();
        const buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
        const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
        {
            if (this.__uboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
                this.__webglResourceRepository.updateUniformBuffer(this.__uboUid, SceneGraphComponent.getAccessor('worldMatrix', SceneGraphComponent).dataViewOfBufferView);
                return;
            }
            this.__uboUid = this.__webglResourceRepository.createUniformBuffer(SceneGraphComponent.getAccessor('worldMatrix', SceneGraphComponent).dataViewOfBufferView);
        }
        this.__webglResourceRepository.bindUniformBufferBase(0, this.__uboUid);
    }
    ;
    attachGPUData() {
        this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'matrix', 0);
    }
    ;
    attatchShaderProgram() {
        const shaderProgramUid = this.__shaderProgramUid;
        const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
        const gl = glw.getRawContext();
        const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid);
        gl.useProgram(shaderProgram);
    }
    attachVertexData(i, primitive, glw, instanceIDBufferUid) {
        const vaoHandles = this.__vertexHandles[i];
        const vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
        const gl = glw.getRawContext();
        if (vao != null) {
            glw.bindVertexArray(vao);
        }
        else {
            this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, instanceIDBufferUid);
            const ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        }
    }
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new WebGLStrategyUBO();
        }
        return this.__instance;
    }
    common_$render() {
        return true;
    }
}
WebGLStrategyUBO.__vertexHandleOfPrimitiveObjectUids = new Map();

class PixelFormatClass extends EnumClass {
    constructor({ index, str }) {
        super({ index, str });
    }
}
const DepthComponent = new PixelFormatClass({ index: 0x1902, str: 'DEPTH_COMPONENT' });
const Alpha = new PixelFormatClass({ index: 0x1906, str: 'ALPHA' });
const RGB = new PixelFormatClass({ index: 0x1907, str: 'RGB' });
const RGBA = new PixelFormatClass({ index: 0x1908, str: 'RGBA' });
const Luminance = new PixelFormatClass({ index: 0x1909, str: 'LUMINANCE' });
const LuminanceAlpha = new PixelFormatClass({ index: 0x190A, str: 'LUMINANCE_ALPHA' });
const PixelFormat = Object.freeze({ DepthComponent, Alpha, RGB, RGBA, Luminance, LuminanceAlpha });

class TextureParameterClass extends EnumClass {
    constructor({ index, str }) {
        super({ index, str });
    }
}
const Nearest = new TextureParameterClass({ index: 0x2600, str: 'NEAREST' });
const Linear = new TextureParameterClass({ index: 0x2601, str: 'LINEAR' });
const TextureMagFilter = new TextureParameterClass({ index: 0x2800, str: 'TEXTURE_MAG_FILTER' });
const TextureMinFilter = new TextureParameterClass({ index: 0x2801, str: 'TEXTURE_MIN_FILTER' });
const TextureWrapS = new TextureParameterClass({ index: 0x2802, str: 'TEXTURE_WRAP_S' });
const TextureWrapT = new TextureParameterClass({ index: 0x2803, str: 'TEXTURE_WRAP_T' });
const Texture2D = new TextureParameterClass({ index: 0x0DE1, str: 'TEXTURE_2D' });
const Texture = new TextureParameterClass({ index: 0x1702, str: 'TEXTURE' });
const Texture0 = new TextureParameterClass({ index: 0x84C0, str: 'TEXTURE0' });
const Texture1 = new TextureParameterClass({ index: 0x84C1, str: 'TEXTURE1' });
const ActiveTexture = new TextureParameterClass({ index: 0x84E0, str: 'ACTIVE_TEXTURE' });
const Repeat = new TextureParameterClass({ index: 0x2901, str: 'REPEAT' });
const ClampToEdge = new TextureParameterClass({ index: 0x812F, str: 'CLAMP_TO_EDGE' });
const RGB8 = new TextureParameterClass({ index: 0x8051, str: 'RGB8' });
const RGBA8 = new TextureParameterClass({ index: 0x8058, str: 'RGBA8' });
const RGB10_A2 = new TextureParameterClass({ index: 0x8059, str: 'RGB10_A2' });
const RGB16F = new TextureParameterClass({ index: 0x881B, str: 'RGB16F' });
const RGB32F = new TextureParameterClass({ index: 0x8815, str: 'RGB32F' });
const RGBA16F = new TextureParameterClass({ index: 0x881A, str: 'RGBA16F' });
const RGBA32F = new TextureParameterClass({ index: 0x8814, str: 'RGBA32F' });
const TextureParameter = Object.freeze({ Nearest, Linear, TextureMagFilter, TextureMinFilter, TextureWrapS, TextureWrapT, Texture2D, Texture,
    Texture0, Texture1, ActiveTexture, Repeat, ClampToEdge, RGB8, RGBA8, RGB10_A2, RGB16F, RGB32F, RGBA16F, RGBA32F });

class Primitive extends RnObject {
    constructor(attributeAccessors, attributeSemantics, mode, material, indicesAccessor) {
        super();
        this.__primitiveUid = -1; // start ID from zero
        this.__indices = indicesAccessor;
        this.__attributes = attributeAccessors;
        this.__attributeSemantics = attributeSemantics;
        this.__material = material;
        this.__mode = mode;
        this.__primitiveUid = Primitive.__primitiveCount++;
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
            const buffer = MemoryManager.getInstance().getBuffer(BufferUse.UBOGeneric);
            const bufferView = buffer.takeBufferView({ byteLengthToNeed: ((1 * 4) + (8 * 4)) * 4 /*byte*/ * Primitive.maxPrimitiveCount, byteStride: 64, isAoS: false });
            Primitive.__headerAccessor = bufferView.takeAccessor({ compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: 9 * Primitive.maxPrimitiveCount });
        }
        const attributeNumOfPrimitive = 1 /*indices*/ + 8 /*vertexAttributes*/;
        if (this.indicesAccessor != null) {
            Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * this.__primitiveUid + 0 /* 0 means indices */, this.indicesAccessor.byteOffsetInBuffer, this.indicesAccessor.componentSizeInBytes, this.indicesAccessor.byteLength / this.indicesAccessor.componentSizeInBytes, -1);
        }
        else {
            Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * this.__primitiveUid + 0 /* 0 means indices */, -1, -1, -1, -1);
        }
        this.attributeAccessors.forEach((attributeAccessor, i) => {
            Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * this.__primitiveUid + i, attributeAccessor.byteOffsetInBuffer, attributeAccessor.byteStride, attributeAccessor.numberOfComponents, attributeAccessor.componentSizeInBytes);
        });
    }
    static get maxPrimitiveCount() {
        return 100;
    }
    static get headerAccessor() {
        return this.__headerAccessor;
    }
    static createPrimitive({ indices, attributeCompositionTypes, attributeSemantics, attributes, material, primitiveMode }) {
        const buffer = MemoryManager.getInstance().getBuffer(BufferUse.GPUVertexData);
        let indicesComponentType;
        let indicesBufferView;
        let indicesAccessor;
        if (indices != null) {
            indicesComponentType = ComponentType.fromTypedArray(indices);
            indicesBufferView = buffer.takeBufferView({ byteLengthToNeed: indices.byteLength, byteStride: 0, isAoS: false });
            indicesAccessor = indicesBufferView.takeAccessor({
                compositionType: CompositionType.Scalar,
                componentType: indicesComponentType,
                count: indices.byteLength / indicesComponentType.getSizeInBytes()
            });
            // copy indices
            for (let i = 0; i < indices.byteLength / indicesAccessor.componentSizeInBytes; i++) {
                indicesAccessor.setScalar(i, indices[i]);
            }
        }
        let sumOfAttributesByteSize = 0;
        attributes.forEach(attribute => {
            sumOfAttributesByteSize += attribute.byteLength;
        });
        const attributesBufferView = buffer.takeBufferView({ byteLengthToNeed: sumOfAttributesByteSize, byteStride: 0, isAoS: false });
        const attributeAccessors = [];
        const attributeComponentTypes = [];
        attributes.forEach((attribute, i) => {
            attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
            const accessor = attributesBufferView.takeAccessor({
                compositionType: attributeCompositionTypes[i],
                componentType: ComponentType.fromTypedArray(attributes[i]),
                count: attribute.byteLength / attributeCompositionTypes[i].getNumberOfComponents() / attributeComponentTypes[i].getSizeInBytes()
            });
            accessor.copyFromTypedArray(attribute);
            attributeAccessors.push(accessor);
        });
        return new Primitive(attributeAccessors, attributeSemantics, primitiveMode, material, indicesAccessor);
    }
    get indicesAccessor() {
        return this.__indices;
    }
    hasIndices() {
        return this.__indices != null;
    }
    get attributeAccessors() {
        return this.__attributes.concat();
    }
    get attributeSemantics() {
        return this.__attributeSemantics.concat();
    }
    get attributeCompositionTypes() {
        return this.__attributes.map(attribute => { return attribute.compositionType; });
    }
    get attributeComponentTypes() {
        return this.__attributes.map(attribute => { return attribute.componentType; });
    }
    get primitiveMode() {
        return this.__mode;
    }
    get primitiveUid() {
        return this.__primitiveUid;
    }
}
Primitive.__primitiveCount = 0;

class PrimitiveModeClass extends EnumClass {
    constructor({ index, str }) {
        super({ index, str });
    }
}
const Unknown$4 = new PrimitiveModeClass({ index: -1, str: 'UNKNOWN' });
const Points = new PrimitiveModeClass({ index: 0, str: 'POINTS' });
const Lines = new PrimitiveModeClass({ index: 1, str: 'LINES' });
const LineLoop = new PrimitiveModeClass({ index: 2, str: 'LINE_LOOP' });
const LineStrip = new PrimitiveModeClass({ index: 3, str: 'LINE_STRIP' });
const Triangles = new PrimitiveModeClass({ index: 4, str: 'TRIANGLES' });
const TriangleStrip = new PrimitiveModeClass({ index: 5, str: 'TRIANGLE_STRIP' });
const TriangleFan = new PrimitiveModeClass({ index: 6, str: 'TRIANGLE_FAN' });
const typeList$9 = [Unknown$4, Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan];
function from$9(index) {
    return _from({ typeList: typeList$9, index });
}
const PrimitiveMode = Object.freeze({ Unknown: Unknown$4, Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan, from: from$9 });

class WebGLStrategyTransformFeedback {
    constructor() {
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
    get __transformFeedbackShaderText() {
        return `#version 300 es

    layout (std140) uniform indexCountsToSubtract {
      ivec4 counts[256];
    } u_indexCountsToSubtract;
    layout (std140) uniform entityUids {
      ivec4 ids[256];
    } u_entityData;
    layout (std140) uniform primitiveUids {
      ivec4 ids[256];
    } u_primitiveData;
    layout (std140) uniform primitiveHeader {
      ivec4 data[256];
    } u_primitiveHeader;

    out vec4 position;
    //out vec3 colors;

    uniform sampler2D u_instanceDataTexture;
    uniform sampler2D u_vertexDataTexture;

    void main(){
      int indexOfVertices = gl_VertexID + 3*gl_InstanceID;

      int entityUidMinusOne = 0;
      int primitiveUid = 0;
      for (int i=0; i<=indexOfVertices; i++) {
        for (int j=0; j<1024; j++) {
          int value = u_indexCountsToSubtract.counts[j/4][j%4];
          int result = int(step(float(value), float(i)));
          if (result > 0) {
            entityUidMinusOne = result * int(u_entityData.ids[j/4][j%4]) - 1;
            primitiveUid = result * u_primitiveData.ids[j/4][j%4];
          } else {
            break;
          }
        }
      }

      ivec4 indicesMeta = u_primitiveHeader.data[9*primitiveUid + 0];
      int primIndicesByteOffset = indicesMeta.x;
      int primIndicesComponentSizeInByte = indicesMeta.y;
      int primIndicesLength = indicesMeta.z;

      int idx = gl_VertexID - primIndicesByteOffset / 4 /*byte*/;

      // get Indices
      int texelLength = ${MemoryManager.bufferWidthLength};
      vec4 indexVec4 = texelFetch(u_vertexDataTexture, ivec2(idx%texelLength, idx/texelLength), 0);
      int index = int(indexVec4[idx%4]);

      // get Positions
      ivec4 indicesData = u_primitiveHeader.data[9*primitiveUid + 1];
      int primPositionsByteOffset = indicesData.x;
      idx = primPositionsByteOffset/4 + index;
      vec4 posVec4 = texelFetch(u_vertexDataTexture, ivec2(idx%texelLength, idx/texelLength), 0);

      position = posVec4;
    }
`;
    }
    get __transformFeedbackFragmentShaderText() {
        return `#version 300 es
precision highp float;

out vec4 outColor;

void main(){
    outColor = vec4(1.0);
}
    `;
    }
    setupShaderProgram() {
        if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
            return;
        }
        // Shader Setup
        let vertexShader = this.__transformFeedbackShaderText;
        let fragmentShader = this.__transformFeedbackFragmentShaderText;
        this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram({
            vertexShaderStr: vertexShader,
            fragmentShaderStr: fragmentShader,
            attributeNames: GLSLShader.attributeNames,
            attributeSemantics: GLSLShader.attributeSemantics
        });
    }
    $load(meshComponent) {
        if (this.__isVertexReady) {
            return;
        }
        const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
        const indicesBufferView = buffer.takeBufferView({ byteLengthToNeed: 4 * 3, byteStride: 4, isAoS: false });
        const indicesAccessor = indicesBufferView.takeAccessor({ compositionType: CompositionType.Scalar, componentType: ComponentType.UnsingedInt, count: 3 });
        const attributeBufferView = buffer.takeBufferView({ byteLengthToNeed: 16 * 3, byteStride: 16, isAoS: false });
        const attributeAccessor = attributeBufferView.takeAccessor({ compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: 3 });
        const indicesUint16Array = indicesAccessor.getTypedArray();
        indicesUint16Array[0] = 0;
        indicesUint16Array[1] = 1;
        indicesUint16Array[2] = 2;
        const primitive = Primitive.createPrimitive({
            indices: indicesUint16Array,
            attributeCompositionTypes: [attributeAccessor.compositionType],
            attributeSemantics: [VertexAttribute.Position],
            attributes: [attributeAccessor.getTypedArray()],
            primitiveMode: PrimitiveMode.Triangles,
            material: 0
        });
        this.__vertexHandle = this.__webglResourceRepository.createVertexDataResources(primitive);
        this.__isVertexReady = true;
    }
    $prerender(meshComponent, instanceIDBufferUid) {
    }
    __setupUBOPrimitiveHeaderData() {
        const memoryManager = MemoryManager.getInstance();
        const buffer = memoryManager.getBuffer(BufferUse.UBOGeneric);
        const floatDataTextureBuffer = new Int32Array(buffer.getArrayBuffer());
        if (this.__primitiveHeaderUboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
            //      this.__webglResourceRepository.updateUniformBuffer(this.__primitiveHeaderUboUid, floatDataTextureBuffer);
            return;
        }
        this.__primitiveHeaderUboUid = this.__webglResourceRepository.createUniformBuffer(floatDataTextureBuffer);
        this.__webglResourceRepository.bindUniformBufferBase(3, this.__primitiveHeaderUboUid);
    }
    __setupGPUInstanceMetaData() {
        if (this.__primitiveUidUboUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
            return;
        }
        const entities = EntityRepository.getInstance()._getEntities();
        const entityIds = new Int32Array(entities.length);
        const primitiveIds = new Int32Array(entities.length);
        const indexCountToSubtract = new Int32Array(entities.length);
        let tmpSumIndexCount = 0;
        entities.forEach((entity, i) => {
            const meshComponent = entity.getComponent(MeshComponent.componentTID);
            if (meshComponent) {
                primitiveIds[i] = meshComponent.getPrimitiveAt(0).primitiveUid;
                entityIds[i] = entity.entityUID;
                const indexCountOfPrimitive = meshComponent.getPrimitiveAt(0).indicesAccessor.elementCount;
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
    }
    __setupGPUInstanceData() {
        let isHalfFloatMode = false;
        if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2 ||
            this.__webglResourceRepository.currentWebGLContextWrapper.isSupportWebGL1Extension(WebGLExtension.TextureHalfFloat)) {
            isHalfFloatMode = true;
        }
        const memoryManager = MemoryManager.getInstance();
        const buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
        const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
        let halfFloatDataTextureBuffer;
        if (isHalfFloatMode) {
            halfFloatDataTextureBuffer = new Uint16Array(floatDataTextureBuffer.length);
            let convertLength = buffer.byteSizeInUse / 4; //components
            convertLength /= 2; // bytes
            for (let i = 0; i < convertLength; i++) {
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
    }
    __setupGPUVertexData() {
        if (this.__vertexDataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
            return;
        }
        const memoryManager = MemoryManager.getInstance();
        const buffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
        const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
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
    }
    common_$prerender() {
        this.__setupUBOPrimitiveHeaderData();
        this.__setupGPUInstanceMetaData();
        this.__setupGPUInstanceData();
        this.__setupGPUVertexData();
    }
    ;
    attachGPUData() {
        {
            const gl = this.__webglResourceRepository.currentWebGLContextWrapper.getRawContext();
            const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__instanceDataTextureUid);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, dataTexture);
            const shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
            var uniform_instanceDataTexture = gl.getUniformLocation(shaderProgram, 'u_instanceDataTexture');
            gl.uniform1i(uniform_instanceDataTexture, 0);
        }
        {
            const gl = this.__webglResourceRepository.currentWebGLContextWrapper.getRawContext();
            const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__vertexDataTextureUid);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, dataTexture);
            const shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
            var uniform_vertexDataTexture = gl.getUniformLocation(shaderProgram, 'u_vertexDataTexture');
            gl.uniform1i(uniform_vertexDataTexture, 1);
        }
        this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'indexCountsToSubtract', 0);
        this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'entityUids', 1);
        this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'primitiveUids', 2);
        this.__webglResourceRepository.bindUniformBlock(this.__shaderProgramUid, 'primitiveHeader', 3);
    }
    ;
    attatchShaderProgram() {
        const shaderProgramUid = this.__shaderProgramUid;
        const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
        const gl = glw.getRawContext();
        const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid);
        gl.useProgram(shaderProgram);
    }
    attachVertexData(i, primitive, glw, instanceIDBufferUid) {
    }
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new WebGLStrategyTransformFeedback();
        }
        return this.__instance;
    }
    common_$render() {
        return true;
    }
}

class WebGLStrategyDataTexture {
    constructor() {
        this.__webglResourceRepository = WebGLResourceRepository.getInstance();
        this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
        this.__shaderProgramUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
        this.__vertexHandles = [];
        this.__isVAOSet = false;
    }
    get vertexShaderMethodDefinitions_dataTexture() {
        const _texture = GLSLShader.glsl_texture;
        return `
  uniform sampler2D u_dataTexture;
  /*
   * This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
   * arg = vec2(1. / size.x, 1. / size.x / size.y);
   */
  // vec4 fetchElement(sampler2D tex, float index, vec2 arg)
  // {
  //   return ${_texture}( tex, arg * (index + 0.5) );
  // }

  vec4 fetchElement(sampler2D tex, float index, vec2 invSize)
  {
    float t = (index + 0.5) * invSize.x;
    float x = fract(t);
    float y = (floor(t) + 0.5) * invSize.y;
    return ${_texture}( tex, vec2(x, y) );
  }

  mat4 getMatrix(float instanceId)
  {
    float index = instanceId;
    float powWidthVal = ${MemoryManager.bufferWidthLength}.0;
    float powHeightVal = ${MemoryManager.bufferHeightLength}.0;
    vec2 arg = vec2(1.0/powWidthVal, 1.0/powHeightVal);
  //  vec2 arg = vec2(1.0/powWidthVal, 1.0/powWidthVal/powHeightVal);

    vec4 col0 = fetchElement(u_dataTexture, index * 4.0 + 0.0, arg);
   vec4 col1 = fetchElement(u_dataTexture, index * 4.0 + 1.0, arg);
   vec4 col2 = fetchElement(u_dataTexture, index * 4.0 + 2.0, arg);

    mat4 matrix = mat4(
      col0.x, col1.x, col2.x, 0.0,
      col0.y, col1.y, col2.y, 0.0,
      col0.z, col1.z, col2.z, 0.0,
      col0.w, col1.w, col2.w, 1.0
      );

    return matrix;
  }
  `;
    }
    setupShaderProgram() {
        if (this.__shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
            return;
        }
        // Shader Setup
        let vertexShader = GLSLShader.vertexShaderVariableDefinitions +
            this.vertexShaderMethodDefinitions_dataTexture +
            GLSLShader.vertexShaderBody;
        let fragmentShader = GLSLShader.fragmentShader;
        this.__shaderProgramUid = this.__webglResourceRepository.createShaderProgram({
            vertexShaderStr: vertexShader,
            fragmentShaderStr: fragmentShader,
            attributeNames: GLSLShader.attributeNames,
            attributeSemantics: GLSLShader.attributeSemantics
        });
    }
    __isLoaded(index) {
        if (this.__vertexHandles[index] != null) {
            return true;
        }
        else {
            return false;
        }
    }
    $load(meshComponent) {
        if (this.__isLoaded(0)) {
            return;
        }
        const primitiveNum = meshComponent.getPrimitiveNumber();
        for (let i = 0; i < primitiveNum; i++) {
            const primitive = meshComponent.getPrimitiveAt(i);
            const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
            this.__vertexHandles[i] = vertexHandles;
            WebGLStrategyDataTexture.__vertexHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles);
        }
    }
    $prerender(meshComponent, instanceIDBufferUid) {
        if (this.__isVAOSet) {
            return;
        }
        const primitiveNum = meshComponent.getPrimitiveNumber();
        for (let i = 0; i < primitiveNum; i++) {
            const primitive = meshComponent.getPrimitiveAt(i);
            // if (this.__isLoaded(i) && this.__isVAOSet) {
            this.__vertexHandles[i] = WebGLStrategyDataTexture.__vertexHandleOfPrimitiveObjectUids.get(primitive.objectUid);
            //this.__vertexShaderProgramHandles[i] = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
            //  continue;
            // }
            this.__webglResourceRepository.setVertexDataToPipeline(this.__vertexHandles[i], primitive, instanceIDBufferUid);
        }
        this.__isVAOSet = true;
    }
    common_$prerender() {
        let isHalfFloatMode = false;
        if (this.__webglResourceRepository.currentWebGLContextWrapper.isWebGL2 ||
            this.__webglResourceRepository.currentWebGLContextWrapper.isSupportWebGL1Extension(WebGLExtension.TextureHalfFloat)) {
            isHalfFloatMode = true;
        }
        const memoryManager = MemoryManager.getInstance();
        const buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
        const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
        let halfFloatDataTextureBuffer;
        if (isHalfFloatMode) {
            halfFloatDataTextureBuffer = new Uint16Array(floatDataTextureBuffer.length);
            let convertLength = buffer.byteSizeInUse / 4; //components
            convertLength /= 2; // bytes
            for (let i = 0; i < convertLength; i++) {
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
    }
    ;
    attachGPUData() {
        const gl = this.__webglResourceRepository.currentWebGLContextWrapper.getRawContext();
        const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__dataTextureUid);
        gl.bindTexture(gl.TEXTURE_2D, dataTexture);
        const shaderProgram = this.__webglResourceRepository.getWebGLResource(this.__shaderProgramUid);
        var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
        gl.uniform1i(uniform_dataTexture, 0);
    }
    ;
    attatchShaderProgram() {
        const shaderProgramUid = this.__shaderProgramUid;
        const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
        const gl = glw.getRawContext();
        const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid);
        gl.useProgram(shaderProgram);
    }
    attachVertexData(i, primitive, glw, instanceIDBufferUid) {
        const vaoHandles = this.__vertexHandles[i];
        const vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle);
        const gl = glw.getRawContext();
        if (vao != null) {
            glw.bindVertexArray(vao);
        }
        else {
            this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, instanceIDBufferUid);
            const ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        }
    }
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new WebGLStrategyDataTexture();
        }
        return this.__instance;
    }
    common_$render() {
        return true;
    }
}
WebGLStrategyDataTexture.__vertexHandleOfPrimitiveObjectUids = new Map();

const getRenderingStrategy = function (processApproach) {
    // Strategy
    if (processApproach === ProcessApproach.UBOWebGL2) {
        return WebGLStrategyUBO.getInstance();
    }
    else if (processApproach === ProcessApproach.TransformFeedbackWebGL2) {
        return WebGLStrategyTransformFeedback.getInstance();
    }
    else {
        return WebGLStrategyDataTexture.getInstance();
    }
};

class MeshRendererComponent extends Component {
    constructor(entityUid, componentSid, entityComponent) {
        super(entityUid, componentSid, entityComponent);
        this.__vertexHandles = [];
        this.__currentProcessStage = ProcessStage.Create;
        let count = Component.__lengthOfArrayOfProcessStages.get(ProcessStage.Create);
        const array = Component.__componentsOfProcessStages.get(ProcessStage.Create);
        array[count++] = this.componentSID;
        array[count] = Component.invalidComponentSID;
        Component.__lengthOfArrayOfProcessStages.set(ProcessStage.Create, count);
    }
    static get componentTID() {
        return 4;
    }
    __isLoaded(index) {
        if (this.__vertexHandles[index] != null) {
            return true;
        }
        else {
            return false;
        }
    }
    $create({ processApproach }) {
        if (this.__meshComponent != null) {
            return;
        }
        this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent.componentTID);
        this.__webglRenderingStrategy = getRenderingStrategy(processApproach);
        this.moveStageTo(ProcessStage.Load);
    }
    $load() {
        this.__webglRenderingStrategy.$load(this.__meshComponent);
        this.moveStageTo(ProcessStage.PreRender);
    }
    $prerender({ processApproech, instanceIDBufferUid }) {
        this.__webglRenderingStrategy.$prerender(this.__meshComponent, instanceIDBufferUid);
    }
    $render() {
        if (this.__webglRenderingStrategy.$render == null) {
            return;
        }
        const primitiveNum = this.__meshComponent.getPrimitiveNumber();
        for (let i = 0; i < primitiveNum; i++) {
            const primitive = this.__meshComponent.getPrimitiveAt(i);
            this.__webglRenderingStrategy.$render(primitive);
        }
    }
}
MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids = new Map();
ComponentRepository.registerComponentClass(MeshRendererComponent.componentTID, MeshRendererComponent);

const WebGLRenderingPipeline = new class {
    constructor() {
        this.__webglResourceRepository = WebGLResourceRepository.getInstance();
        this.__componentRepository = ComponentRepository.getInstance();
        this.__instanceIDBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    common_$load(processApproach) {
        // Strategy
        this.__webGLStrategy = getRenderingStrategy(processApproach);
        // Shader setup
        this.__webGLStrategy.setupShaderProgram();
    }
    common_$prerender() {
        const gl = this.__webglResourceRepository.currentWebGLContextWrapper;
        if (gl == null) {
            throw new Error('No WebGLRenderingContext!');
        }
        this.__webGLStrategy.common_$prerender();
        if (this.__isReady()) {
            return 0;
        }
        this.__instanceIDBufferUid = this.__setupInstanceIDBuffer();
        return this.__instanceIDBufferUid;
    }
    __isReady() {
        if (this.__instanceIDBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
            return true;
        }
        else {
            return false;
        }
    }
    __setupInstanceIDBuffer() {
        const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
        const count = Config.maxEntityNumber;
        const bufferView = buffer.takeBufferView({ byteLengthToNeed: 4 /*byte*/ * count, byteStride: 0, isAoS: false });
        const accesseor = bufferView.takeAccessor({ compositionType: CompositionType.Scalar, componentType: ComponentType.Float, count: count });
        const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
        for (var i = 0; i < meshComponents.length; i++) {
            accesseor.setScalar(i, meshComponents[i].entityUID);
        }
        return this.__webglResourceRepository.createVertexBuffer(accesseor);
    }
    common_$render() {
        if (!this.__webGLStrategy.common_$render()) {
            return;
        }
        const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
        const meshComponent = meshComponents[0];
        const primitiveNum = meshComponent.getPrimitiveNumber();
        const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
        for (let i = 0; i < primitiveNum; i++) {
            const primitive = meshComponent.getPrimitiveAt(i);
            this.__webGLStrategy.attachVertexData(i, primitive, glw, this.__instanceIDBufferUid);
            this.__webGLStrategy.attatchShaderProgram();
            this.__webGLStrategy.attachGPUData();
            const meshComponents = this.__componentRepository.getComponentsWithType(MeshComponent.componentTID);
            glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0, meshComponents.length);
        }
    }
};

class System {
    constructor() {
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
    process() {
        if (this.__processApproach === ProcessApproach.None) {
            throw new Error('Choose a process approach first.');
        }
        this.__processStages.forEach(stage => {
            const methodName = stage.getMethodName();
            let instanceIDBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
            const componentTids = this.__componentRepository.getComponentTIDs();
            const commonMethod = this.__renderingPipeline['common_' + methodName];
            if (commonMethod != null) {
                instanceIDBufferUid = commonMethod.call(this.__renderingPipeline, this.__processApproach);
            }
            componentTids.forEach(componentTid => {
                const componentClass = ComponentRepository.getComponentClass(componentTid);
                componentClass.updateComponentsOfEachProcessStage(componentTid, stage, this.__componentRepository);
                componentClass.process({
                    componentTid: componentTid,
                    processStage: stage,
                    instanceIDBufferUid: instanceIDBufferUid,
                    processApproach: this.__processApproach,
                    componentRepository: this.__componentRepository
                });
            });
        });
    }
    setProcessApproachAndCanvas(approach, canvas) {
        const repo = WebGLResourceRepository.getInstance();
        let gl;
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
    }
    get processApproach() {
        return this.__processApproach;
    }
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new System();
        }
        return this.__instance;
    }
}

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

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class DataUtil {
    static isNode() {
        let isNode = (window === void 0 && typeof process !== "undefined" && typeof require !== "undefined");
        return isNode;
    }
    static btoa(str) {
        let isNode = DataUtil.isNode();
        if (isNode) {
            let buffer;
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
    }
    static atob(str) {
        let isNode = DataUtil.isNode();
        if (isNode) {
            return new Buffer(str, 'base64').toString('binary');
        }
        else {
            return atob(str);
        }
    }
    static base64ToArrayBuffer(dataUri) {
        let splittedDataUri = dataUri.split(',');
        let type = splittedDataUri[0].split(':')[1].split(';')[0];
        let byteString = DataUtil.atob(splittedDataUri[1]);
        let byteStringLength = byteString.length;
        let arrayBuffer = new ArrayBuffer(byteStringLength);
        let uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteStringLength; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }
        return arrayBuffer;
    }
    static arrayBufferToString(arrayBuffer) {
        if (typeof TextDecoder !== 'undefined') {
            let textDecoder = new TextDecoder();
            return textDecoder.decode(arrayBuffer);
        }
        else {
            let bytes = new Uint8Array(arrayBuffer);
            let result = "";
            let length = bytes.length;
            for (let i = 0; i < length; i++) {
                result += String.fromCharCode(bytes[i]);
            }
            return result;
        }
    }
    static stringToBase64(str) {
        let b64 = null;
        b64 = DataUtil.btoa(str);
        return b64;
    }
    static UInt8ArrayToDataURL(uint8array, width, height) {
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext("2d");
        let imageData = ctx.createImageData(width, height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i + 0] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 0];
            imageData.data[i + 1] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 1];
            imageData.data[i + 2] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 2];
            imageData.data[i + 3] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 3];
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.remove();
        return canvas.toDataURL("image/png");
    }
    static loadResourceAsync(resourceUri, isBinary, resolveCallback, rejectCallback) {
        return new Promise((resolve, reject) => {
            let isNode = DataUtil.isNode();
            if (isNode) {
                let fs = require('fs');
                let args = [resourceUri];
                let func = (err, response) => {
                    if (err) {
                        if (rejectCallback) {
                            rejectCallback(reject, err);
                        }
                        return;
                    }
                    if (isBinary) {
                        let buffer = new Buffer(response, 'binary');
                        let uint8Buffer = new Uint8Array(buffer);
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
                let xmlHttp = new XMLHttpRequest();
                if (isBinary) {
                    xmlHttp.responseType = "arraybuffer";
                    xmlHttp.onload = (oEvent) => {
                        let response = null;
                        if (isBinary) {
                            response = xmlHttp.response;
                        }
                        else {
                            response = xmlHttp.responseText;
                        }
                        resolveCallback(resolve, response);
                    };
                }
                else {
                    xmlHttp.onreadystatechange = () => {
                        if (xmlHttp.readyState === 4 && (Math.floor(xmlHttp.status / 100) === 2 || xmlHttp.status === 0)) {
                            let response = null;
                            if (isBinary) {
                                response = xmlHttp.response;
                            }
                            else {
                                response = xmlHttp.responseText;
                            }
                            resolveCallback(resolve, response);
                        }
                        else {
                            if (rejectCallback) {
                                rejectCallback(reject, xmlHttp.status);
                            }
                        }
                    };
                }
                xmlHttp.open("GET", resourceUri, true);
                xmlHttp.send(null);
            }
        });
    }
}

class Gltf2Importer {
    constructor() {
    }
    import(uri, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let defaultOptions = {
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
            const response = yield fetch(uri);
            const arrayBuffer = yield response.arrayBuffer();
            const dataView = new DataView(arrayBuffer, 0, 20);
            const isLittleEndian = true;
            // Magic field
            const magic = dataView.getUint32(0, isLittleEndian);
            let result;
            // 0x46546C67 is 'glTF' in ASCII codes.
            if (magic !== 0x46546C67) {
                //const json = await response.json();
                const gotText = DataUtil.arrayBufferToString(arrayBuffer);
                const json = JSON.parse(gotText);
                result = yield this._loadAsTextJson(json, uri, options, defaultOptions);
            }
            return result;
        });
    }
    _getOptions(defaultOptions, json, options) {
        if (json.asset && json.asset.extras && json.asset.extras.loadOptions) {
            for (let optionName in json.asset.extras.loadOptions) {
                defaultOptions[optionName] = json.asset.extras.loadOptions[optionName];
            }
        }
        for (let optionName in options) {
            defaultOptions[optionName] = options[optionName];
        }
        return defaultOptions;
    }
    _loadAsTextJson(gltfJson, uri, options, defaultOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let basePath;
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
            const result = yield this._loadInner(undefined, basePath, gltfJson, options);
            return result[0][0];
        });
    }
    _loadInner(arrayBufferBinary, basePath, gltfJson, options) {
        let promises = [];
        let resources = {
            shaders: [],
            buffers: [],
            images: []
        };
        promises.push(this._loadResources(arrayBufferBinary, basePath, gltfJson, options, resources));
        promises.push(new Promise((resolve, reject) => {
            this._loadJsonContent(gltfJson, options);
            resolve();
        }));
        return Promise.all(promises);
    }
    _loadJsonContent(gltfJson, options) {
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
    }
    _loadDependenciesOfScenes(gltfJson) {
        for (let scene of gltfJson.scenes) {
            scene.nodesIndices = scene.nodes.concat();
            for (let i in scene.nodesIndices) {
                scene.nodes[i] = gltfJson.nodes[scene.nodes[i]];
            }
        }
    }
    _loadDependenciesOfNodes(gltfJson) {
        for (let node of gltfJson.nodes) {
            // Hierarchy
            if (node.children) {
                node.childrenIndices = node.children.concat();
                node.children = [];
                for (let i in node.childrenIndices) {
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
    _loadDependenciesOfMeshes(gltfJson) {
        // Mesh
        for (let mesh of gltfJson.meshes) {
            for (let primitive of mesh.primitives) {
                if (primitive.material !== void 0) {
                    primitive.materialIndex = primitive.material;
                    primitive.material = gltfJson.materials[primitive.materialIndex];
                }
                primitive.attributesindex = Object.assign({}, primitive.attributes);
                for (let attributeName in primitive.attributesindex) {
                    if (primitive.attributesindex[attributeName] >= 0) {
                        let accessor = gltfJson.accessors[primitive.attributesindex[attributeName]];
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
    }
    _loadDependenciesOfMaterials(gltfJson) {
        // Material
        if (gltfJson.materials) {
            for (let material of gltfJson.materials) {
                if (material.pbrMetallicRoughness) {
                    let baseColorTexture = material.pbrMetallicRoughness.baseColorTexture;
                    if (baseColorTexture !== void 0) {
                        baseColorTexture.texture = gltfJson.textures[baseColorTexture.index];
                    }
                    let metallicRoughnessTexture = material.pbrMetallicRoughness.metallicRoughnessTexture;
                    if (metallicRoughnessTexture !== void 0) {
                        metallicRoughnessTexture.texture = gltfJson.textures[metallicRoughnessTexture.index];
                    }
                }
                let normalTexture = material.normalTexture;
                if (normalTexture !== void 0) {
                    normalTexture.texture = gltfJson.textures[normalTexture.index];
                }
                const occlusionTexture = material.occlusionTexture;
                if (occlusionTexture !== void 0) {
                    occlusionTexture.texture = gltfJson.textures[occlusionTexture.index];
                }
                const emissiveTexture = material.emissiveTexture;
                if (emissiveTexture !== void 0) {
                    emissiveTexture.texture = gltfJson.textures[emissiveTexture.index];
                }
            }
        }
    }
    _loadDependenciesOfTextures(gltfJson) {
        // Texture
        if (gltfJson.textures) {
            for (let texture of gltfJson.textures) {
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
    }
    _loadDependenciesOfJoints(gltfJson) {
        if (gltfJson.skins) {
            for (let skin of gltfJson.skins) {
                skin.skeletonIndex = skin.skeleton;
                skin.skeleton = gltfJson.nodes[skin.skeletonIndex];
                skin.inverseBindMatricesIndex = skin.inverseBindMatrices;
                skin.inverseBindMatrices = gltfJson.accessors[skin.inverseBindMatricesIndex];
                skin.jointsIndices = skin.joints;
                skin.joints = [];
                for (let jointIndex of skin.jointsIndices) {
                    skin.joints.push(gltfJson.nodes[jointIndex]);
                }
            }
        }
    }
    _loadDependenciesOfAnimations(gltfJson) {
        if (gltfJson.animations) {
            for (let animation of gltfJson.animations) {
                for (let channel of animation.channels) {
                    channel.samplerIndex = channel.sampler;
                    channel.sampler = animation.samplers[channel.samplerIndex];
                    channel.target.nodeIndex = channel.target.node;
                    channel.target.node = gltfJson.nodes[channel.target.nodeIndex];
                }
                for (let channel of animation.channels) {
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
        }
    }
    _loadDependenciesOfAccessors(gltfJson) {
        // Accessor
        for (let accessor of gltfJson.accessors) {
            if (accessor.bufferView !== void 0) {
                accessor.bufferViewIndex = accessor.bufferView;
                accessor.bufferView = gltfJson.bufferViews[accessor.bufferViewIndex];
            }
        }
    }
    _loadDependenciesOfBufferViews(gltfJson) {
        // BufferView
        for (let bufferView of gltfJson.bufferViews) {
            if (bufferView.buffer !== void 0) {
                bufferView.bufferIndex = bufferView.buffer;
                bufferView.buffer = gltfJson.buffers[bufferView.bufferIndex];
            }
        }
    }
    _mergeExtendedJson(gltfJson, extendedData) {
        let extendedJson = null;
        if (extendedData instanceof ArrayBuffer) {
            const extendedJsonStr = DataUtil.arrayBufferToString(extendedData);
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
    }
    _loadResources(arrayBufferBinary, basePath, gltfJson, options, resources) {
        let promisesToLoadResources = [];
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
        for (let i in gltfJson.buffers) {
            let bufferInfo = gltfJson.buffers[i];
            let splitted;
            let filename;
            if (bufferInfo.uri) {
                splitted = bufferInfo.uri.split('/');
                filename = splitted[splitted.length - 1];
            }
            if (typeof bufferInfo.uri === 'undefined') {
                promisesToLoadResources.push(new Promise((resolve, rejected) => {
                    resources.buffers[i] = arrayBufferBinary;
                    bufferInfo.buffer = arrayBufferBinary;
                    resolve(gltfJson);
                }));
            }
            else if (bufferInfo.uri.match(/^data:application\/(.*);base64,/)) {
                promisesToLoadResources.push(new Promise((resolve, rejected) => {
                    let arrayBuffer = DataUtil.base64ToArrayBuffer(bufferInfo.uri);
                    resources.buffers[i] = arrayBuffer;
                    bufferInfo.buffer = arrayBuffer;
                    resolve(gltfJson);
                }));
            }
            else if (options.files && options.files[filename]) {
                promisesToLoadResources.push(new Promise((resolve, rejected) => {
                    const arrayBuffer = options.files[filename];
                    resources.buffers[i] = arrayBuffer;
                    bufferInfo.buffer = arrayBuffer;
                    resolve(gltfJson);
                }));
            }
            else {
                promisesToLoadResources.push(DataUtil.loadResourceAsync(basePath + bufferInfo.uri, true, (resolve, response) => {
                    resources.buffers[i] = response;
                    bufferInfo.buffer = response;
                    resolve(gltfJson);
                }, (reject, error) => {
                }));
            }
        }
        // Textures Async load
        for (let _i in gltfJson.images) {
            const i = _i;
            let imageJson = gltfJson.images[i];
            //let imageJson = gltfJson.images[textureJson.source];
            //let samplerJson = gltfJson.samplers[textureJson.sampler];
            let imageUri;
            if (typeof imageJson.uri === 'undefined') {
                imageUri = this._accessBinaryAsImage(imageJson.bufferView, gltfJson, arrayBufferBinary, imageJson.mimeType);
            }
            else {
                let imageFileStr = imageJson.uri;
                const splitted = imageFileStr.split('/');
                const filename = splitted[splitted.length - 1];
                if (options.files && options.files[filename]) {
                    const arrayBuffer = options.files[filename];
                    const splitted = filename.split('.');
                    const fileExtension = splitted[splitted.length - 1];
                    imageUri = this._accessArrayBufferAsImage(arrayBuffer, fileExtension);
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
            promisesToLoadResources.push(new Promise((resolve, reject) => {
                let img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = imageUri;
                imageJson.image = img;
                if (imageUri.match(/^data:/)) {
                    resolve(gltfJson);
                }
                else {
                    const load = (img, response) => {
                        var bytes = new Uint8Array(response);
                        var binaryData = "";
                        for (var i = 0, len = bytes.byteLength; i < len; i++) {
                            binaryData += String.fromCharCode(bytes[i]);
                        }
                        const split = imageUri.split('.');
                        let ext = split[split.length - 1];
                        img.src = this._getImageType(ext) + window.btoa(binaryData);
                        img.onload = () => {
                            resolve(gltfJson);
                        };
                    };
                    const loadBinaryImage = () => {
                        var xhr = new XMLHttpRequest();
                        xhr.onreadystatechange = (function (_img) {
                            return function () {
                                if (xhr.readyState == 4 && xhr.status == 200) {
                                    load(_img, xhr.response);
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
        }
        return Promise.all(promisesToLoadResources);
    }
    _accessBinaryAsImage(bufferViewStr, json, arrayBuffer, mimeType) {
        let arrayBufferSliced = this._sliceBufferViewToArrayBuffer(json, bufferViewStr, arrayBuffer);
        return this._accessArrayBufferAsImage(arrayBufferSliced, mimeType);
    }
    _sliceBufferViewToArrayBuffer(json, bufferViewStr, arrayBuffer) {
        let bufferViewJson = json.bufferViews[bufferViewStr];
        let byteOffset = (bufferViewJson.byteOffset != null) ? bufferViewJson.byteOffset : 0;
        let byteLength = bufferViewJson.byteLength;
        let arrayBufferSliced = arrayBuffer.slice(byteOffset, byteOffset + byteLength);
        return arrayBufferSliced;
    }
    _accessArrayBufferAsImage(arrayBuffer, imageType) {
        let bytes = new Uint8Array(arrayBuffer);
        let binaryData = '';
        for (let i = 0, len = bytes.byteLength; i < len; i++) {
            binaryData += String.fromCharCode(bytes[i]);
        }
        let imgSrc = this._getImageType(imageType);
        let dataUrl = imgSrc + DataUtil.btoa(binaryData);
        return dataUrl;
    }
    _getImageType(imageType) {
        let imgSrc = null;
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
    }
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new Gltf2Importer();
        }
        return this.__instance;
    }
}

/**
 * A converter class from glTF2 model to Rhodonite Native data
 */
class ModelConverter {
    constructor() {
    }
    /**
     * The static method to get singleton instance of this class.
     * @return The singleton instance of ModelConverter class
     */
    static getInstance() {
        if (!this.__instance) {
            this.__instance = new ModelConverter();
        }
        return this.__instance;
    }
    _getDefaultShader(options) {
        let defaultShader = null;
        // if (options && typeof options.defaultShaderClass !== "undefined") {
        //   if (typeof options.defaultShaderClass === "string") {
        //     defaultShader = GLBoost[options.defaultShaderClass];
        //   } else {
        //     defaultShader = options.defaultShaderClass;
        //   }
        // }
        return defaultShader;
    }
    __generateGroupEntity() {
        const repo = EntityRepository.getInstance();
        const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID]);
        return entity;
    }
    __generateMeshEntity() {
        const repo = EntityRepository.getInstance();
        const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID,
            MeshComponent.componentTID, MeshRendererComponent.componentTID]);
        return entity;
    }
    convertToRhodoniteObject(gltfModel) {
        // load binary data
        // for (let accessor of gltfModel.accessors) {
        //   this._accessBinaryWithAccessor(accessor);
        // }
        const rnBuffer = this.createRnBuffer(gltfModel);
        // Mesh data
        const meshEntities = this._setupMesh(gltfModel, rnBuffer);
        let groups = [];
        for (let node of gltfModel.nodes) {
            const group = this.__generateGroupEntity();
            group.tryToSetUniqueName(node.name, true);
            groups.push(group);
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
        const rootGroup = this.__generateGroupEntity();
        rootGroup.tryToSetUniqueName('FileRoot', true);
        if (gltfModel.scenes[0].nodesIndices) {
            for (let nodesIndex of gltfModel.scenes[0].nodesIndices) {
                rootGroup.getSceneGraph().addChild(groups[nodesIndex].getSceneGraph());
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
    }
    createRnBuffer(gltfModel) {
        const buffer = gltfModel.buffers[0];
        const rnBuffer = new Buffer$1({
            byteLength: buffer.byteLength,
            arrayBuffer: buffer.buffer,
            name: `gltf2Buffer_0_(${buffer.uri})`
        });
        return rnBuffer;
    }
    _setupTransform(gltfModel, groups) {
        for (let node_i in gltfModel.nodes) {
            let group = groups[node_i];
            let nodeJson = gltfModel.nodes[node_i];
            if (nodeJson.translation) {
                group.getTransform().translate = new Vector3(nodeJson.translation[0], nodeJson.translation[1], nodeJson.translation[2]);
            }
            if (nodeJson.scale) {
                group.getTransform().scale = new Vector3(nodeJson.scale[0], nodeJson.scale[1], nodeJson.scale[2]);
            }
            if (nodeJson.rotation) {
                group.getTransform().quaternion = new Quaternion(nodeJson.rotation[0], nodeJson.rotation[1], nodeJson.rotation[2], nodeJson.rotation[3]);
            }
            if (nodeJson.matrix) {
                group.getTransform().matrix = new Matrix44(nodeJson.matrix, true);
            }
        }
    }
    _setupHierarchy(gltfModel, groups, meshEntities) {
        const groupSceneComponents = groups.map(group => { return group.getSceneGraph(); });
        const meshSceneComponents = meshEntities.map(mesh => { return mesh.getSceneGraph(); });
        for (let node_i in gltfModel.nodes) {
            let node = gltfModel.nodes[parseInt(node_i)];
            let parentGroup = groupSceneComponents[node_i];
            if (node.mesh) {
                parentGroup.addChild(meshSceneComponents[node.meshIndex]);
            }
            if (node.childrenIndices) {
                for (let childNode_i of node.childrenIndices) {
                    let childGroup = groupSceneComponents[childNode_i];
                    parentGroup.addChild(childGroup);
                }
            }
        }
    }
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
    _setupMesh(gltfModel, rnBuffer) {
        const meshEntities = [];
        for (let mesh of gltfModel.meshes) {
            const meshEntity = this.__generateMeshEntity();
            meshEntities.push(meshEntity);
            let rnPrimitiveMode = PrimitiveMode.from(4);
            for (let i in mesh.primitives) {
                let primitive = mesh.primitives[i];
                if (primitive.mode != null) {
                    rnPrimitiveMode = PrimitiveMode.from(primitive.mode);
                }
                const indicesRnAccessor = this.__getRnAccessor(primitive.indices, rnBuffer);
                const attributeRnAccessors = [];
                const attributeSemantics = [];
                for (let attributeName in primitive.attributes) {
                    let attributeAccessor = primitive.attributes[attributeName];
                    const attributeRnAccessor = this.__getRnAccessor(attributeAccessor, rnBuffer);
                    attributeRnAccessors.push(attributeRnAccessor);
                    attributeSemantics.push(VertexAttribute.fromString(attributeAccessor.extras.attributeName));
                }
                const rnPrimitive = new Primitive(attributeRnAccessors, attributeSemantics, rnPrimitiveMode, 0, indicesRnAccessor);
                const meshComponent = meshEntity.getComponent(MeshComponent.componentTID);
                meshComponent.addPrimitive(rnPrimitive);
            }
        }
        return meshEntities;
    }
    __getRnAccessor(accessor, rnBuffer) {
        const bufferView = accessor.bufferView;
        const rnBufferView = rnBuffer.takeBufferViewWithByteOffset({
            byteLengthToNeed: bufferView.byteLength,
            byteStride: bufferView.byteStride,
            byteOffset: bufferView.byteOffset,
            isAoS: false
        });
        const rnAccessor = rnBufferView.takeAccessorWithByteOffset({
            compositionType: CompositionType.fromString(accessor.type),
            componentType: ComponentType.from(accessor.componentType),
            count: accessor.count,
            byteOffset: accessor.byteOffset
        });
        return rnAccessor;
    }
}

const Rn = Object.freeze({
    EntityRepository,
    TransformComponent,
    SceneGraphComponent,
    MeshComponent,
    MeshRendererComponent,
    Primitive,
    WebGLResourceRepository,
    CompositionType,
    ComponentType,
    VertexAttribute,
    PrimitiveMode,
    GLSLShader,
    System,
    Vector3,
    Vector4,
    Matrix33,
    Matrix44,
    ProcessApproach,
    Gltf2Importer,
    ModelConverter
});
window['Rn'] = Rn;

export default Rn;
