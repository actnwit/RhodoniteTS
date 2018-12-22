class CGAPIResourceRepository {
}

const singleton = Symbol();
class WebGLResourceRepository extends CGAPIResourceRepository {
    constructor(enforcer) {
        super();
        this.__webglContexts = new Map();
        this.__resourceCounter = 0;
        this.__webglResources = new Map();
        if (enforcer !== WebGLResourceRepository.__singletonEnforcer || !(this instanceof WebGLResourceRepository)) {
            throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
        }
    }
    static getInstance() {
        const thisClass = WebGLResourceRepository;
        if (!thisClass[singleton]) {
            thisClass[singleton] = new WebGLResourceRepository(thisClass.__singletonEnforcer);
        }
        return thisClass[singleton];
    }
    addWebGLContext(webglContext, asCurrent) {
        this.__webglContexts.set('default', webglContext);
        if (asCurrent) {
            this.__gl = webglContext;
        }
    }
    get currentWebGLContext() {
        return this.__gl;
    }
    getResourceNumber() {
        return ++this.__resourceCounter;
    }
    getWebGLResource(WebGLResourceHandle) {
        return this.__webglResources.get(WebGLResourceHandle);
    }
    createIndexBuffer(accsessor) {
        const gl = this.__gl;
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
    createVertexBuffer(accsessor) {
        const gl = this.__gl;
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const vbo = gl.createBuffer();
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, vbo);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, accsessor.dataViewOfBufferView, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return resourceHandle;
    }
    getVAOFunc(functionName) {
        const gl = this.__gl;
        if (gl[functionName] != null) {
            return gl[functionName];
        }
        if (this.__extVAO == null) {
            this.__extVAO = gl.getExtension('OES_vertex_array_object');
            if (this.__extVAO == null) {
                throw new Error('The library does not support this environment because the OES_vertex_array_object is not available');
            }
        }
        return this.__extVAO[functionName];
    }
    createVertexArray() {
        const gl = this.__gl;
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const createVertexArray = this.getVAOFunc('createVertexArray');
        const vao = createVertexArray();
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, vao);
        return resourceHandle;
    }
    createVertexDataResources(primitive) {
        const gl = this.__gl;
        const vaoHandle = this.createVertexArray();
        let iboHandle;
        if (primitive.hasIndices) {
            const iboHandle = this.createIndexBuffer(primitive.indicesAccessor);
        }
        const vboHandles = [];
        primitive.attributeAccessors.forEach(accessor => {
            const vboHandle = this.createVertexBuffer(accessor);
            vboHandles.push(vboHandle);
        });
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return { vaoHandle, iboHandle, vboHandles };
    }
    createShaderProgram(vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics) {
        const gl = this.__gl;
        if (gl == null) {
            throw new Error("No WebGLRenderingContext set as Default.");
        }
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(vertexShader, vertexShaderStr);
        gl.shaderSource(fragmentShader, fragmentShaderStr);
        gl.compileShader(vertexShader);
        this.__checkShaderCompileStatus(vertexShader);
        gl.compileShader(fragmentShader);
        this.__checkShaderCompileStatus(fragmentShader);
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        attributeNames.forEach((attributeName, i) => {
            gl.bindAttribLocation(shaderProgram, attributeSemantics[i].index, attributeName);
        });
        gl.linkProgram(shaderProgram);
        const resourceHandle = this.getResourceNumber();
        this.__webglResources.set(resourceHandle, shaderProgram);
        this.__checkShaderProgramLinkStatus(shaderProgram);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return resourceHandle;
    }
    __checkShaderCompileStatus(shader) {
        const gl = this.__gl;
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error('An error occurred compiling the shaders:' + gl.getShaderInfoLog(shader));
        }
    }
    __checkShaderProgramLinkStatus(shaderProgram) {
        const gl = this.__gl;
        // If creating the shader program failed, alert
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        }
    }
    setVertexDataToShaderProgram({ vaoHandle, iboHandle, vboHandles }, shaderProgramHandle, primitive) {
        const gl = this.__gl;
        const vao = this.getWebGLResource(vaoHandle);
        const bindVertexArray = this.getVAOFunc('bindVertexArray');
        bindVertexArray(vao);
        if (iboHandle != null) {
            const ibo = this.getWebGLResource(iboHandle);
            if (ibo != null) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            }
            else {
                throw new Error('Nothing Element Array Buffer!');
            }
        }
        const shaderProgram = this.getWebGLResource(shaderProgramHandle);
        if (shaderProgram == null) {
            throw new Error('Nothing ShaderProgram!');
        }
        vboHandles.forEach((vboHandle, i) => {
            const vbo = this.getWebGLResource(vboHandle);
            if (vbo != null) {
                gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            }
            else {
                throw new Error('Nothing Element Array Buffer at index ' + i);
            }
            gl.enableVertexAttribArray(primitive.attributeSemantics[i].index);
            gl.vertexAttribPointer(primitive.attributeSemantics[i].index, primitive.attributeCompositionTypes[i].getNumberOfComponents(), primitive.attributeComponentTypes[i].index, false, primitive.attributeAccessors[i].byteStride, 0);
        });
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        bindVertexArray(null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}

const TransformComponentTID = 1;
const SceneGraphComponentTID = 2;
const WellKnownComponentTIDs = Object.freeze({
    TransformComponentTID,
    SceneGraphComponentTID
});

class Entity {
    constructor(entityUID, isAlive, enforcer, entityComponent) {
        if (enforcer !== Entity._enforcer) {
            throw new Error('You cannot use this constructor. Use entiryRepository.createEntity() method insterad.');
        }
        this.__entity_uid = entityUID;
        this.__isAlive = isAlive;
        this.__entityRepository = entityComponent;
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
}
Entity._enforcer = Symbol();

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

class InitialSetting {
}
InitialSetting.maxEntityNumber = 10000;

let singleton$1 = Symbol();
class ComponentRepository {
    constructor(enforcer) {
        if (enforcer !== ComponentRepository.__singletonEnforcer || !(this instanceof ComponentRepository)) {
            throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
        }
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
        const thisClass = ComponentRepository;
        if (!thisClass[singleton$1]) {
            thisClass[singleton$1] = new ComponentRepository(ComponentRepository.__singletonEnforcer);
        }
        return thisClass[singleton$1];
    }
    createComponent(componentTID, entityUid) {
        const thisClass = ComponentRepository;
        const componentClass = thisClass.__componentClasses.get(componentTID);
        if (componentClass != null) {
            componentClass.setupBufferView();
            const component = new componentClass(entityUid);
            const componentTid = component.constructor.componentTID;
            let component_sid_count = this.__component_sid_count_map.get(componentTid);
            if (!IsUtil.exist(component_sid_count)) {
                this.__component_sid_count_map.set(componentTid, 0);
                component_sid_count = 0;
            }
            this.__component_sid_count_map.set(componentTid, component_sid_count !== undefined ? ++component_sid_count : 1);
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
        return this.__components.get(componentTid);
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
ComponentRepository.__singletonEnforcer = Symbol();

const singleton$2 = Symbol();
class EntityRepository {
    constructor(enforcer) {
        if (enforcer !== EntityRepository.__singletonEnforcer || !(this instanceof EntityRepository)) {
            throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
        }
        this.__entity_uid_count = 0;
        this.__entities = [];
        this._components = [];
        this.__componentRepository = ComponentRepository.getInstance();
    }
    static getInstance() {
        const thisClass = EntityRepository;
        if (!thisClass[singleton$2]) {
            thisClass[singleton$2] = new EntityRepository(thisClass.__singletonEnforcer);
        }
        return thisClass[singleton$2];
    }
    createEntity(componentTidArray) {
        const entity = new Entity(++this.__entity_uid_count, true, Entity._enforcer, this);
        this.__entities[this.__entity_uid_count] = entity;
        for (let componentTid of componentTidArray) {
            const component = this.__componentRepository.createComponent(componentTid, entity.entityUID);
            let map = this._components[entity.entityUID];
            if (!(map != null)) {
                map = new Map();
            }
            if (component != null) {
                map.set(componentTid, component);
            }
            this._components[entity.entityUID] = map;
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
    static getMaxEntityNumber() {
        return 10000;
    }
    _getEntities() {
        return this.__entities.concat();
    }
}
EntityRepository.__singletonEnforcer = Symbol();

class Vector3 {
    constructor(x, y, z) {
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

//import GLBoost from '../../globals';
class Quaternion {
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

// import GLBoost from '../../globals';
class Matrix33 {
    constructor(m0, m1, m2, m3, m4, m5, m6, m7, m8, isColumnMajor = false) {
        this.m = new Float32Array(9); // Data order is column major
        const _isColumnMajor = (arguments.length === 10) ? isColumnMajor : m1;
        const m = m0;
        if (arguments.length === 10) {
            if (_isColumnMajor === true) {
                let m = arguments;
                this.setComponents(m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]);
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
                const _m = m;
                this.setComponents(_m.m00, _m.m01, _m.m02, _m.m10, _m.m11, _m.m12, _m.m20, _m.m21, _m.m22);
            }
            else {
                const _m = m;
                this.setComponents(_m.m00, _m.m01, _m.m02, _m.m10, _m.m11, _m.m12, _m.m20, _m.m21, _m.m22); // 'm' must be row major array if isColumnMajor is false
            }
        }
        else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
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
const FloatArray = Float64Array;
class Matrix44 {
    constructor(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, isColumnMajor = false, notCopyFloatArray = false) {
        const _isColumnMajor = (arguments.length >= 16) ? isColumnMajor : m1;
        const _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m2;
        const m = m0;
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
        this.setComponents.apply(this, mat4.m); // 'm' must be row major array if isColumnMajor is false    
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
    static rotateXYZ(x, y, z) {
        return new Matrix44(Matrix33.rotateZ(z).multiply(Matrix33.rotateY(y).multiply(Matrix33.rotateX(x))));
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

class RnObject {
    constructor(needToManage = false) {
        this.__objectUid = 0;
        if (needToManage) {
            this.__objectUid = ++RnObject.currentMaxObjectCount;
        }
    }
    get objectUid() {
        return this.__objectUid;
    }
}
RnObject.currentMaxObjectCount = 0;

// This code idea is from https://qiita.com/junkjunctions/items/5a6d8bed8df8eb3acceb
class EnumClass {
    constructor({ index, str }) {
        this.index = index;
        this.str = str;
    }
    toString() {
        return this.str;
    }
    toJSON() {
        return this.index;
    }
}
function _from({ typeList, index }) {
    const match = typeList.find(type => type.index === index);
    if (!match) {
        throw new Error(`Invalid PrimitiveMode index: [${index}]`);
    }
    return match;
}

class ComponentTypeClass extends EnumClass {
    constructor({ index, str, sizeInBytes }) {
        super({ index, str });
        this.__sizeInBytes = sizeInBytes;
    }
    getSizeInBytes() {
        return this.__sizeInBytes;
    }
}
const Unknown = new ComponentTypeClass({ index: 5119, str: 'UNKNOWN', sizeInBytes: 0 });
const Byte = new ComponentTypeClass({ index: 5120, str: 'BYTE', sizeInBytes: 1 });
const UnsignedByte = new ComponentTypeClass({ index: 5121, str: 'UNSIGNED_BYTE', sizeInBytes: 1 });
const Short = new ComponentTypeClass({ index: 5122, str: 'SHORT', sizeInBytes: 2 });
const UnsignedShort = new ComponentTypeClass({ index: 5123, str: 'UNSIGNED_SHORT', sizeInBytes: 2 });
const Int = new ComponentTypeClass({ index: 5124, str: 'INT', sizeInBytes: 4 });
const UnsingedInt = new ComponentTypeClass({ index: 5125, str: 'UNSIGNED_INT', sizeInBytes: 4 });
const Float = new ComponentTypeClass({ index: 5126, str: 'FLOAT', sizeInBytes: 4 });
const Double = new ComponentTypeClass({ index: 5127, str: 'DOUBLE', sizeInBytes: 8 });
const typeList = [Unknown, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsingedInt, Float, Double];
function from({ index }) {
    return _from({ typeList, index });
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
    return Unknown;
}
const ComponentType = Object.freeze({ Unknown, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsingedInt, Float, Double, from, fromTypedArray });

class CompositionTypeClass extends EnumClass {
    constructor({ index, str, numberOfComponent }) {
        super({ index, str });
        this.__numberOfComponents = 0;
        this.__numberOfComponents = numberOfComponent;
    }
    getNumberOfComponents() {
        return this.__numberOfComponents;
    }
}
const Unknown$1 = new CompositionTypeClass({ index: -1, str: 'UNKNOWN', numberOfComponent: 0 });
const Scalar = new CompositionTypeClass({ index: 0, str: 'SCALAR', numberOfComponent: 1 });
const Vec2 = new CompositionTypeClass({ index: 1, str: 'VEC2', numberOfComponent: 2 });
const Vec3 = new CompositionTypeClass({ index: 2, str: 'VEC3', numberOfComponent: 3 });
const Vec4 = new CompositionTypeClass({ index: 3, str: 'VEC4', numberOfComponent: 4 });
const Mat2 = new CompositionTypeClass({ index: 4, str: 'MAT2', numberOfComponent: 4 });
const Mat3 = new CompositionTypeClass({ index: 5, str: 'MAT3', numberOfComponent: 9 });
const Mat4 = new CompositionTypeClass({ index: 6, str: 'MAT4', numberOfComponent: 16 });
const typeList$1 = [Unknown$1, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4];
function from$1({ index }) {
    return _from({ typeList: typeList$1, index });
}
const CompositionType = Object.freeze({ Unknown: Unknown$1, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4, from: from$1 });

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

class AccessorBase extends RnObject {
    constructor({ bufferView, byteOffset, compositionType, componentType, byteStride, count, raw }) {
        super();
        this.__compositionType = CompositionType.Unknown;
        this.__componentType = ComponentType.Unknown;
        this.__count = 0;
        this.__takenCount = 0;
        this.__byteStride = 0;
        this.__bufferView = bufferView;
        this.__byteOffset = byteOffset;
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
        if (this.__bufferView.isSoA) {
            this.__dataView = new DataView(this.__raw, this.__byteOffset, this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes() * this.__count);
        }
        else {
            this.__dataView = new DataView(this.__raw, this.__byteOffset);
        }
        this.__typedArray = new typedArrayClass(this.__raw, this.__byteOffset, this.__compositionType.getNumberOfComponents() * this.__count);
        this.__dataViewGetter = this.__dataView[this.getDataViewGetter(this.__componentType)].bind(this.__dataView);
        this.__dataViewSetter = this.__dataView[this.getDataViewSetter(this.__componentType)].bind(this.__dataView);
        //console.log('Test', this.__byteOffset + this.__byteStride * (count - 1), this.__bufferView.byteLength)
        if (this.__byteOffset + this.__byteStride * (this.__count - 1) > this.__bufferView.byteLength) {
            throw new Error('The range of the accessor exceeds the range of the buffer view.');
        }
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
    }
    takeOne() {
        const arrayBufferOfBufferView = this.__raw;
        let stride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
        if (this.__bufferView.isAoS) {
            stride = this.__bufferView.byteStride;
        }
        const subTypedArray = new this.__typedArrayClass(arrayBufferOfBufferView, this.__byteOffset + stride * this.__takenCount, this.__compositionType.getNumberOfComponents());
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
        this.__dataViewSetter(this.__byteStride * index, x, endian);
        this.__dataViewSetter(this.__byteStride * index + 1, y, endian);
    }
    setVec3(index, x, y, z, endian = true) {
        this.__dataViewSetter(this.__byteStride * index, x, endian);
        this.__dataViewSetter(this.__byteStride * index + 1, y, endian);
        this.__dataViewSetter(this.__byteStride * index + 2, z, endian);
    }
    setVec4(index, x, y, z, w, endian = true) {
        this.__dataViewSetter(this.__byteStride * index, x, endian);
        this.__dataViewSetter(this.__byteStride * index + 1, y, endian);
        this.__dataViewSetter(this.__byteStride * index + 2, z, endian);
        this.__dataViewSetter(this.__byteStride * index + 3, w, endian);
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
}

class FlexibleAccessor extends AccessorBase {
    constructor({ bufferView, byteOffset, compositionType, componentType, byteStride, count, raw }) {
        super({ bufferView, byteOffset, compositionType, componentType, byteStride, count, raw });
    }
}

class BufferView extends RnObject {
    constructor({ buffer, byteOffset, byteLength, raw, isAoS }) {
        super();
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
        const accessor = new accessorClass({
            bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw
        });
        this.__accessors.push(accessor);
        return accessor;
    }
}

class Buffer extends RnObject {
    constructor({ byteLength, arrayBuffer, name }) {
        super();
        this.__byteLength = 0;
        this.__name = '';
        this.__takenBytesIndex = 0;
        this.__name = this.__name;
        this.__byteLength = this.__byteLength;
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
            throw new Error('Because of memory alignment constraints, byteLengthToNeed must be a multiple of 4.');
            return null;
        }
        if (byteStride % 4 !== 0) {
            throw new Error('Because of memory alignment constraints, byteStride must be a multiple of 4.');
            return null;
        }
        const array = new Uint8Array(this.__raw, this.__takenBytesIndex, byteLengthToNeed);
        const bufferView = new BufferView({ buffer: this, byteOffset: this.__takenBytesIndex, byteLength: byteLengthToNeed, raw: array, isAoS: isAoS });
        bufferView.byteStride = byteStride;
        this.__takenBytesIndex += Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed;
        return bufferView;
    }
}

/**
 * Usage
 * const mm = MemoryManager.getInstance();
 * this.translate = new Vector3(
 *   mm.assignMem(componentUID, propetyId, entityUID, isRendered)
 * );
 */
const singleton$3 = Symbol();
class MemoryManager {
    constructor(enforcer) {
        //__entityMaxCount: number;
        this.__buffers = new Map();
        const thisClass = MemoryManager;
        if (enforcer !== thisClass.__singletonEnforcer || !(this instanceof MemoryManager)) {
            throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
        }
        // BufferForGPU
        {
            const arrayBuffer = new ArrayBuffer((Math.pow(2, 11)) * Math.pow(2, 11) /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
            const buffer = new Buffer({
                byteLength: arrayBuffer.byteLength,
                arrayBuffer: arrayBuffer,
                name: 'BufferForGPU'
            });
            this.__buffers.set(buffer.objectUid, buffer);
            this.__bufferForGPU = buffer;
        }
        // BufferForCPU
        {
            const arrayBuffer = new ArrayBuffer((Math.pow(2, 11)) * Math.pow(2, 11) /*width*height*/ * 4 /*rgba*/ * 8 /*byte*/);
            const buffer = new Buffer({
                byteLength: arrayBuffer.byteLength,
                arrayBuffer: arrayBuffer,
                name: 'BufferForCPU'
            });
            this.__buffers.set(buffer.objectUid, buffer);
            this.__bufferForCPU = buffer;
        }
    }
    static getInstance() {
        const thisClass = MemoryManager;
        if (!thisClass[singleton$3]) {
            thisClass[singleton$3] = new MemoryManager(thisClass.__singletonEnforcer);
        }
        return thisClass[singleton$3];
    }
    getBufferForGPU() {
        return this.__bufferForGPU;
    }
    getBufferForCPU() {
        return this.__bufferForCPU;
    }
}
MemoryManager.__singletonEnforcer = Symbol();

class Component {
    constructor(entityUid) {
        this.__entityUid = entityUid;
        this._component_sid = 0;
        this.__isAlive = true;
        this.__memoryManager = MemoryManager.getInstance();
        this.__entityRepository = EntityRepository.getInstance();
    }
    static get componentTID() {
        return 0;
    }
    get componentSID() {
        return this._component_sid;
    }
    static get byteSizeOfThisComponent() {
        return 0;
    }
    static setupBufferView() {
    }
    registerDependency(component, isMust) {
    }
    $create() {
        // Define process dependencies with other components.
        // If circular depenencies are detected, the error will be repoated.
        // this.registerDependency(TransformComponent);
    }
    $load() {
    }
    $mount() {
    }
    $logic() {
    }
    $prerender() {
    }
    $render() {
    }
    $unmount() {
    }
    $discard() {
    }
}

// import AnimationComponent from './AnimationComponent';
class TransformComponent extends Component {
    constructor(entityUid) {
        super(entityUid);
        // dependencies
        this._dependentAnimationComponentId = 0;
        const thisClass = TransformComponent;
        this._translate = Vector3.zero();
        this._rotate = Vector3.zero();
        this._scale = new Vector3(1, 1, 1);
        this._quaternion = new Quaternion(thisClass.__accesseor_quaternion.takeOne());
        this._quaternion.identity();
        this._matrix = new Matrix44(thisClass.__accesseor_matrix.takeOne(), false, true);
        this._matrix.identity();
        this._invMatrix = Matrix44.identity();
        this._normalMatrix = Matrix33.identity();
        this._is_translate_updated = true;
        this._is_euler_angles_updated = true;
        this._is_scale_updated = true;
        this._is_quaternion_updated = true;
        this._is_trs_matrix_updated = true;
        this._is_inverse_trs_matrix_updated = true;
        this._is_normal_trs_matrix_updated = true;
        this._updateCount = 0;
        this._dirty = true;
    }
    static get renderedPropertyCount() {
        return null;
    }
    static get maxCount() {
        return 1000000;
    }
    static get componentTID() {
        return WellKnownComponentTIDs.TransformComponentTID;
    }
    static get byteSizeOfThisComponent() {
        return 160;
    }
    static setupBufferView() {
        const thisClass = TransformComponent;
        const buffer = MemoryManager.getInstance().getBufferForCPU();
        const count = EntityRepository.getMaxEntityNumber();
        thisClass.__bufferView = buffer.takeBufferView({ byteLengthToNeed: thisClass.byteSizeOfThisComponent * count, byteStride: 0, isAoS: false });
        // accessors
        thisClass.__accesseor_matrix = thisClass.__bufferView.takeAccessor({ compositionType: CompositionType.Mat4, componentType: ComponentType.Double, count: count });
        thisClass.__accesseor_quaternion = thisClass.__bufferView.takeAccessor({ compositionType: CompositionType.Vec4, componentType: ComponentType.Double, count: count });
    }
    $create() {
        // Define process dependencies with other components.
        // If circular depenencies are detected, the error will be repoated.
        //this.registerDependency(AnimationComponent.componentTID, false);
        console.log('$create');
    }
    $updateLogic() {
    }
    _needUpdate() {
        this._updateCount++;
        this._dirty = true;
    }
    set translate(vec) {
        this._translate = vec.clone();
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
        this._rotate = vec.clone();
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
        this._scale = vec.clone();
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
        this._quaternion = quat.clone();
        this._is_quaternion_updated = true;
        this._is_euler_angles_updated = false;
        this._is_trs_matrix_updated = false;
        this._is_inverse_trs_matrix_updated = false;
        this._is_normal_trs_matrix_updated = false;
        this.__updateTransform();
    }
    get quaternion() {
        return this.guaternionInner.clone();
    }
    get guaternionInner() {
        if (this._is_quaternion_updated) {
            return this._quaternion;
        }
        else if (!this._is_quaternion_updated) {
            if (this._is_trs_matrix_updated) {
                const value = Quaternion.fromMatrix(this._matrix);
                this._is_quaternion_updated = true;
                this._quaternion = value;
                return value;
            }
            else if (this._is_euler_angles_updated) {
                const value = Quaternion.fromMatrix(Matrix44.rotateXYZ(this._rotate.x, this._rotate.y, this._rotate.z));
                this._is_quaternion_updated = true;
                this._quaternion = value;
                return value;
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
        // scale
        const scaleMatrix = Matrix44.scale(this.scale);
        // rotate
        const rotationMatrix = new Matrix44(this.quaternion);
        const matrix = Matrix44.multiply(rotationMatrix, scaleMatrix);
        // translate
        const translate = this.translate;
        this._matrix.m03 = translate.x;
        this._matrix.m13 = translate.y;
        this._matrix.m23 = translate.z;
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
        this.__updateRotation();
        this.__updateTranslate();
        this.__updateScale();
        //this.__updateMatrix();
        this._needUpdate();
    }
    __updateRotation() {
        if (this._is_euler_angles_updated && !this._is_quaternion_updated) {
            this._quaternion = Quaternion.fromMatrix(Matrix44.rotateXYZ(this._rotate.x, this._rotate.y, this._rotate.z));
            this._is_quaternion_updated = true;
        }
        else if (!this._is_euler_angles_updated && this._is_quaternion_updated) {
            this._rotate = (new Matrix44(this._quaternion)).toEulerAngles();
            this._is_euler_angles_updated = true;
        }
        else if (!this._is_euler_angles_updated && !this._is_quaternion_updated && this._is_trs_matrix_updated) {
            const m = this._matrix;
            this._quaternion = Quaternion.fromMatrix(m);
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
        this.quaternion = Quaternion.fromMatrix(rotateMatrix);
    }
    get rotateMatrix44() {
        return new Matrix44(this.quaternion);
    }
}
ComponentRepository.registerComponentClass(TransformComponent.componentTID, TransformComponent);

class SceneGraphComponent extends Component {
    constructor(entityUid) {
        super(entityUid);
        const thisClass = SceneGraphComponent;
        this.__isAbleToBeParent = false;
        this.beAbleToBeParent(true);
        this.__worldMatrix = new Matrix44(thisClass.__accesseor_worldMatrix.takeOne(), false, true);
        //this.__worldMatrix = Matrix44.identity();
        this.__worldMatrix.identity();
        //this.__updatedProperly = false;
    }
    static get maxCount() {
        return 1000000;
    }
    static get componentTID() {
        return WellKnownComponentTIDs.SceneGraphComponentTID;
    }
    static get byteSizeOfThisComponent() {
        return 128;
    }
    static setupBufferView() {
        const thisClass = SceneGraphComponent;
        const buffer = MemoryManager.getInstance().getBufferForGPU();
        const count = EntityRepository.getMaxEntityNumber();
        thisClass.__bufferView = buffer.takeBufferView({ byteLengthToNeed: thisClass.byteSizeOfThisComponent * count, byteStride: 0, isAoS: false });
        thisClass.__accesseor_worldMatrix = thisClass.__bufferView.takeAccessor({ compositionType: CompositionType.Mat4, componentType: ComponentType.Double, count: count });
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
        return this.calcWorldMatrixRecursively();
    }
    get worldMatrix() {
        return this.calcWorldMatrixRecursively().clone();
    }
    calcWorldMatrixRecursively() {
        const entity = this.__entityRepository.getEntity(this.__entityUid);
        const transform = entity.getTransform();
        if (!(this.__parent != null)) {
            // if there is not parent
            //      if (!this.__updatedProperly && entity.getTransform()._dirty) {
            if (transform._dirty) {
                //this.__updatedProperly = true;
                transform._dirty = false;
                this.__worldMatrix = transform.matrix;
                //        console.log('No Skip!', this.__worldMatrix.toString(), this.__entityUid);
            }
            return this.__worldMatrix;
        }
        const matrixFromAncestorToParent = this.__parent.calcWorldMatrixRecursively();
        //    if (!this.__updatedProperly && entity.getTransform()._dirty) {
        if (transform._dirty) {
            //this.__updatedProperly = true;
            transform._dirty = false;
            this.__worldMatrix = transform.matrix;
            //      console.log('No Skip!', this.__worldMatrix.toString(), this.__entityUid);
        }
        //console.log('return Skip!', this.__worldMatrix.toString(), this.__entityUid);
        return Matrix44.multiply(matrixFromAncestorToParent, this.__worldMatrix);
    }
}
ComponentRepository.registerComponentClass(SceneGraphComponent.componentTID, SceneGraphComponent);

class VertexAttributeClass extends EnumClass {
    constructor({ index, str }) {
        super({ index, str });
    }
}
const Unknown$2 = new VertexAttributeClass({ index: -1, str: 'UNKNOWN' });
const Position = new VertexAttributeClass({ index: 0, str: 'POSITION' });
const Normal = new VertexAttributeClass({ index: 1, str: 'NORMAL' });
const Tangent = new VertexAttributeClass({ index: 2, str: 'TANGENT' });
const Texcoord0 = new VertexAttributeClass({ index: 3, str: 'TEXCOORD_0' });
const Texcoord1 = new VertexAttributeClass({ index: 4, str: 'TEXCOORD_1' });
const Color0 = new VertexAttributeClass({ index: 5, str: 'COLOR_0' });
const Joints0 = new VertexAttributeClass({ index: 6, str: 'JOINTS_0' });
const Weights0 = new VertexAttributeClass({ index: 7, str: 'WEIGHTS_0' });
const typeList$2 = [Unknown$2, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0];
function from$2({ index }) {
    return _from({ typeList: typeList$2, index });
}
const VertexAttribute = Object.freeze({ Unknown: Unknown$2, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, from: from$2 });

class GLSLShader {
}
GLSLShader.vertexShader = `
attribute vec3 i_position;
void main ()
{
	gl_Position = vec4(i_position, 1.0);
}
  `;
GLSLShader.fragmentShader = `
  precision mediump float;
  void main ()
  {
    gl_FragColor = vec4(1.0);
  }
`;
GLSLShader.attributeNanes = ['i_position'];
GLSLShader.attributeSemantics = [VertexAttribute.Position];

const WebGLRenderingPipeline = new class {
    constructor() {
        this.__webglResourceRepository = WebGLResourceRepository.getInstance();
    }
    render(vaoHandle, shaderProgramHandle, primitive) {
        const gl = this.__webglResourceRepository.currentWebGLContext;
        if (gl == null) {
            throw new Error('No WebGLRenderingContext!');
        }
        const bindVertexArray = this.__webglResourceRepository.getVAOFunc('bindVertexArray');
        bindVertexArray(vaoHandle);
        gl.useProgram(shaderProgramHandle);
        gl.drawElements(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0);
    }
};

class MeshComponent extends Component {
    constructor(entityUid) {
        super(entityUid);
        this.__primitives = [];
        this.__vertexVaoHandles = [];
        this.__vertexShaderProgramHandles = [];
        this.__webglResourceRepository = WebGLResourceRepository.getInstance();
        this.__renderingPipeline = WebGLRenderingPipeline;
    }
    static get maxCount() {
        return 1000000;
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
    $prerender() {
        this.__primitives.forEach((primitive, i) => {
            const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
            this.__vertexVaoHandles[i] = vertexHandles.vaoHandle;
            const shaderProgramHandle = this.__webglResourceRepository.createShaderProgram(GLSLShader.vertexShader, GLSLShader.fragmentShader, GLSLShader.attributeNanes, GLSLShader.attributeSemantics);
            this.__vertexShaderProgramHandles[i] = shaderProgramHandle;
            this.__webglResourceRepository.setVertexDataToShaderProgram(vertexHandles, shaderProgramHandle, primitive);
        });
    }
    $render() {
        this.__primitives.forEach((primitive, i) => {
            this.__renderingPipeline.render(this.__vertexVaoHandles[i], this.__vertexShaderProgramHandles[i], primitive);
        });
    }
}
ComponentRepository.registerComponentClass(MeshComponent.componentTID, MeshComponent);

class Primitive extends RnObject {
    constructor(attributeCompositionTypes, attributeComponentTypes, attributeAccessors, attributeSemantics, mode, material, attributesBufferView, indicesComponentType, indicesAccessor, indicesBufferView) {
        super();
        this.__indices = indicesAccessor;
        this.__attributeCompositionTypes = attributeCompositionTypes;
        this.__attributeComponentTypes = attributeComponentTypes;
        this.__attributes = attributeAccessors;
        this.__attributeSemantics = attributeSemantics;
        this.__material = material;
        this.__mode = mode;
        this.__indicesBufferView = indicesBufferView;
        this.__attributesBufferView = attributesBufferView;
        this.__indicesComponentType = indicesComponentType;
    }
    static createPrimitive({ indices, attributeCompositionTypes, attributeSemantics, attributes, material, primitiveMode }) {
        let indicesComponentType;
        let indicesBufferView;
        let indicesAccessor;
        if (indices != null) {
            indicesComponentType = ComponentType.fromTypedArray(indices);
            const buffer = MemoryManager.getInstance().getBufferForCPU();
            indicesBufferView = buffer.takeBufferView({ byteLengthToNeed: indices.byteLength, byteStride: 0, isAoS: false });
            indicesAccessor = indicesBufferView.takeAccessor({
                compositionType: CompositionType.Scalar,
                componentType: indicesComponentType,
                count: indices.byteLength / indicesComponentType.getSizeInBytes()
            });
        }
        let sumOfAttributesByteSize = 0;
        attributes.forEach(attribute => {
            sumOfAttributesByteSize += attribute.byteLength;
        });
        const memoryManager = MemoryManager.getInstance();
        const buffer = memoryManager.getBufferForCPU();
        const attributesBufferView = buffer.takeBufferView({ byteLengthToNeed: sumOfAttributesByteSize, byteStride: 0, isAoS: false });
        const attributeAccessors = [];
        const attributeComponentTypes = [];
        let byteLength;
        if (indices != null) {
            byteLength = indices.byteLength;
        }
        else {
            byteLength = attributes[0].byteLength;
        }
        attributes.forEach((attribute, i) => {
            attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
            attributeAccessors.push(attributesBufferView.takeAccessor({
                compositionType: attributeCompositionTypes[i],
                componentType: ComponentType.fromTypedArray(attributes[i]),
                count: byteLength / attributeCompositionTypes[i].getNumberOfComponents() / attributeComponentTypes[i].getSizeInBytes()
            }));
        });
        return new Primitive(attributeCompositionTypes, attributeComponentTypes, attributeAccessors, attributeSemantics, primitiveMode, material, attributesBufferView, indicesComponentType, indicesAccessor, indicesBufferView);
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
        return this.__attributeCompositionTypes;
    }
    get attributeComponentTypes() {
        return this.__attributeComponentTypes;
    }
    get primitiveMode() {
        return this.__mode;
    }
}

class PrimitiveModeClass extends EnumClass {
    constructor({ index, str }) {
        super({ index, str });
    }
}
const Unknown$3 = new PrimitiveModeClass({ index: -1, str: 'UNKNOWN' });
const Points = new PrimitiveModeClass({ index: 0, str: 'POINTS' });
const Lines = new PrimitiveModeClass({ index: 1, str: 'LINES' });
const LineLoop = new PrimitiveModeClass({ index: 2, str: 'LINE_LOOP' });
const LineStrip = new PrimitiveModeClass({ index: 3, str: 'LINE_STRIP' });
const Triangles = new PrimitiveModeClass({ index: 4, str: 'TRIANGLES' });
const TriangleStrip = new PrimitiveModeClass({ index: 5, str: 'TRIANGLE_STRIP' });
const TriangleFan = new PrimitiveModeClass({ index: 6, str: 'TRIANGLE_FAN' });
const typeList$3 = [Unknown$3, Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan];
function from$3({ index }) {
    return _from({ typeList: typeList$3, index });
}
const PrimitiveMode = Object.freeze({ Unknown: Unknown$3, Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan, from: from$3 });

var main = Object.freeze({
    EntityRepository,
    TransformComponent,
    SceneGraphComponent,
    MeshComponent,
    Primitive,
    WebGLResourceRepository,
    CompositionType,
    ComponentType,
    VertexAttribute,
    PrimitiveMode,
});

export default main;
