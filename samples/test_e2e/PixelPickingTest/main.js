"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
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
};
exports.__esModule = true;
var load = function (time) {
    return __awaiter(this, void 0, void 0, function () {
        var importer, system, gl, entityRepository, cameraEntity, cameraComponent, lightEntity2, lightComponent2, response, modelConverter, rootGroup, cameraControllerComponent, p, startTime, rotationVec3, count, draw;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Rn.ModuleManager.getInstance().loadModule('webgl')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Rn.ModuleManager.getInstance().loadModule('pbr')];
                case 2:
                    _a.sent();
                    importer = Rn.Gltf1Importer.getInstance();
                    system = Rn.System.getInstance();
                    gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));
                    entityRepository = Rn.EntityRepository.getInstance();
                    cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
                    cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
                    //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
                    cameraComponent.parameters = new Rn.Vector4(0.1, 1000, 90, 1);
                    cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 0.5);
                    lightEntity2 = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent]);
                    lightEntity2.getTransform().translate = new Rn.Vector3(0.0, 0.0, 10.0);
                    lightComponent2 = lightEntity2.getComponent(Rn.LightComponent);
                    lightComponent2.intensity = new Rn.Vector3(1, 1, 1);
                    return [4 /*yield*/, importer["import"]('../../../assets/gltf/1.0/BoxAnimated/glTF/BoxAnimated.gltf')];
                case 3:
                    response = _a.sent();
                    modelConverter = Rn.ModelConverter.getInstance();
                    rootGroup = modelConverter.convertToRhodoniteObject(response);
                    cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
                    cameraControllerComponent.setTarget(rootGroup);
                    p = null;
                    Rn.CameraComponent.main = 0;
                    startTime = Date.now();
                    rotationVec3 = Rn.MutableVector3.one();
                    count = 0;
                    draw = function (time) {
                        if (p == null && count > 0) {
                            if (response != null) {
                                gl.enable(gl.DEPTH_TEST);
                                gl.viewport(0, 0, 600, 600);
                                gl.clearColor(0.8, 0.8, 0.8, 1.0);
                                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                            }
                            p = document.createElement('p');
                            p.setAttribute("id", "rendered");
                            p.innerText = 'Rendered.';
                            document.body.appendChild(p);
                        }
                        if (window.isAnimating) {
                            var date = new Date();
                            var rotation = 0.001 * (date.getTime() - startTime);
                            //rotationVec3.v[0] = 0.1;
                            //rotationVec3.v[1] = rotation;
                            //rotationVec3.v[2] = 0.1;
                            var time_1 = (date.getTime() - startTime) / 1000;
                            Rn.AnimationComponent.globalTime = time_1;
                            if (time_1 > Rn.AnimationComponent.endInputValue) {
                                startTime = date.getTime();
                            }
                            //console.log(time);
                            //      rootGroup.getTransform().scale = rotationVec3;
                            //rootGroup.getTransform().translate = rootGroup.getTransform().translate;
                        }
                        system.process();
                        count++;
                        requestAnimationFrame(draw);
                    };
                    draw(0);
                    return [2 /*return*/];
            }
        });
    });
};
document.body.onload = load;
