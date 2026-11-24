import {
  __commonJS
} from "./chunk-MHR6JRBZ.js";

// node_modules/.pnpm/shaderity@0.2.23/node_modules/shaderity/dist/esm/index.js
var require_esm = __commonJS({
  "node_modules/.pnpm/shaderity@0.2.23/node_modules/shaderity/dist/esm/index.js"(exports, module) {
    (() => {
      "use strict";
      var __webpack_modules__ = {
        /***/
        "./src/index.ts": (
          /*!**********************!*\
            !*** ./src/index.ts ***!
            \**********************/
          /***/
          (function(__unused_webpack_module, exports2, __webpack_require__2) {
            var __importDefault = this && this.__importDefault || function(mod) {
              return mod && mod.__esModule ? mod : { "default": mod };
            };
            Object.defineProperty(exports2, "__esModule", { value: true });
            const Shaderity_1 = __importDefault(__webpack_require__2(
              /*! ./main/Shaderity */
              "./src/main/Shaderity.ts"
            ));
            exports2["default"] = Shaderity_1.default;
          })
        ),
        /***/
        "./src/main/PreProcessor.ts": (
          /*!**********************************!*\
            !*** ./src/main/PreProcessor.ts ***!
            \**********************************/
          /***/
          ((__unused_webpack_module, exports2) => {
            Object.defineProperty(exports2, "__esModule", { value: true });
            class PreProcessor {
              static evaluateCondition(condition) {
                const numericComparison = /(\w+)\s*(==|!=|>|<|>=|<=)\s*(\d+)/g;
                const definedCheck = /defined\s*\(\s*(\w+)\s*\)/g;
                const notDefinedCheck = /!\s*defined\s*\(\s*(\w+)\s*\)/g;
                let evaluatableCondition = condition;
                evaluatableCondition = evaluatableCondition.replace(definedCheck, (_, name) => {
                  return this.definitions.has(name) ? "true" : "false";
                });
                evaluatableCondition = evaluatableCondition.replace(notDefinedCheck, (_, name) => {
                  return this.definitions.has(name) ? "false" : "true";
                });
                evaluatableCondition = evaluatableCondition.replace(numericComparison, (match, varName, operator, valueStr) => {
                  const definedValue = this.definitions.get(varName);
                  if (definedValue === void 0)
                    return "false";
                  const value1 = parseInt(definedValue);
                  const value2 = parseInt(valueStr);
                  switch (operator) {
                    case "==":
                      return value1 === value2 ? "true" : "false";
                    case "!=":
                      return value1 !== value2 ? "true" : "false";
                    case ">":
                      return value1 > value2 ? "true" : "false";
                    case "<":
                      return value1 < value2 ? "true" : "false";
                    case ">=":
                      return value1 >= value2 ? "true" : "false";
                    case "<=":
                      return value1 <= value2 ? "true" : "false";
                    default:
                      return "false";
                  }
                });
                try {
                  if (!/^[a-zA-Z0-9\s\(\)!&|]+$/.test(evaluatableCondition)) {
                    throw new Error("Invalid condition");
                  }
                  evaluatableCondition = evaluatableCondition.replace(/&&/g, " && ").replace(/\|\|/g, " || ").replace(/!/g, " ! ").replace(/\s+/g, " ").trim();
                  return Function(`return ${evaluatableCondition}`)();
                } catch (error) {
                  console.error("Error evaluating condition:", error);
                  return false;
                }
              }
              static process(splittedLines, remainDefine, definitions = [], startLineStr, endLineStr) {
                const define = /#define[\t ]+(\w+)(?:[\t ]+(\S+))?/;
                const ifdef = /#ifdef[\t ]+(\w+)/;
                const ifndef = /#ifndef[\t ]+(\w+)/;
                const _if = /#if(?:\s+|(?=\())(.*)/;
                const elif = /#elif(?:\s+|(?=\())(.*)/;
                const _else = /#else/;
                const endif = /#endif/;
                const previousOutputStates = [];
                let outputFlg = true;
                const ifdefs = [];
                const ifdefMatched = [];
                const outputLines = [];
                this.definitions.clear();
                for (const definition of definitions) {
                  this.definitions.set(definition, "1");
                }
                let startLine = 0;
                let endLine = splittedLines.length;
                if (startLineStr) {
                  startLine = splittedLines.findIndex((line) => line.includes(startLineStr));
                  if (startLine === -1) {
                    return splittedLines;
                  }
                }
                if (endLineStr) {
                  endLine = splittedLines.findIndex((line) => line.includes(endLineStr));
                  if (endLine === -1) {
                    return splittedLines;
                  }
                }
                for (let i = 0; i < startLine; i++) {
                  const line = splittedLines[i];
                  outputLines.push(line);
                }
                for (let i = startLine; i < endLine; i++) {
                  const line = splittedLines[i];
                  let isPragma = false;
                  {
                    const re = line.match(define);
                    if (re != null) {
                      if (outputFlg) {
                        const [_, name, value = "1"] = re;
                        this.definitions.set(name, value);
                      }
                      if (!remainDefine) {
                        isPragma = true;
                      }
                    }
                  }
                  {
                    const reIfdef = line.match(ifdef);
                    const reIfndef = line.match(ifndef);
                    const reIf = line.match(_if);
                    if (reIfdef || reIfndef || reIf) {
                      previousOutputStates.push(outputFlg);
                      let condition = "";
                      if (reIfdef) {
                        condition = `defined(${reIfdef[1]})`;
                      } else if (reIfndef) {
                        condition = `!defined(${reIfndef[1]})`;
                      } else if (reIf) {
                        condition = reIf[1];
                      }
                      ifdefs.push([condition]);
                      if (outputFlg) {
                        outputFlg = this.evaluateCondition(condition);
                        ifdefMatched.push(outputFlg);
                      } else {
                        ifdefMatched.push(false);
                      }
                      isPragma = true;
                    }
                  }
                  {
                    const re = line.match(elif);
                    if (re != null) {
                      const condition = re[1];
                      const currentIfdefs = ifdefs[ifdefs.length - 1];
                      if (previousOutputStates[previousOutputStates.length - 1] && !ifdefMatched[ifdefMatched.length - 1]) {
                        outputFlg = this.evaluateCondition(condition);
                        if (outputFlg) {
                          ifdefMatched[ifdefMatched.length - 1] = true;
                        }
                      } else {
                        outputFlg = false;
                      }
                      currentIfdefs.push(condition);
                      isPragma = true;
                    }
                  }
                  {
                    const re = line.match(_else);
                    if (re != null) {
                      if (previousOutputStates[previousOutputStates.length - 1]) {
                        outputFlg = !ifdefMatched[ifdefMatched.length - 1];
                      } else {
                        outputFlg = false;
                      }
                      isPragma = true;
                    }
                  }
                  {
                    const re = line.match(endif);
                    if (re != null) {
                      outputFlg = previousOutputStates[previousOutputStates.length - 1];
                      isPragma = true;
                      ifdefs.pop();
                      ifdefMatched.pop();
                      previousOutputStates.pop();
                    }
                  }
                  if (outputFlg && !isPragma) {
                    outputLines.push(line);
                  }
                }
                for (let i = endLine; i < splittedLines.length; i++) {
                  const line = splittedLines[i];
                  outputLines.push(line);
                }
                return outputLines;
              }
            }
            PreProcessor.definitions = /* @__PURE__ */ new Map();
            exports2["default"] = PreProcessor;
          })
        ),
        /***/
        "./src/main/Reflection.ts": (
          /*!********************************!*\
            !*** ./src/main/Reflection.ts ***!
            \********************************/
          /***/
          ((__unused_webpack_module, exports2) => {
            Object.defineProperty(exports2, "__esModule", { value: true });
            class Reflection {
              constructor(splittedShaderityShaderCode, shaderStage) {
                this.__attributeSemanticsMap = /* @__PURE__ */ new Map();
                this.__uniformSemanticsMap = /* @__PURE__ */ new Map();
                this.__attributes = [];
                this.__varyings = [];
                this.__uniforms = [];
                this.__splittedShaderCode = splittedShaderityShaderCode;
                this.__shaderStage = shaderStage;
                this.__setDefaultAttributeAndUniformSemanticsMap();
              }
              /**
               * Gets all attribute variable information in the shader code.
               * Before calling this method, you need to call the reflect method of this instance.
               * @returns Array of ReflectionAttribute object
               */
              get attributes() {
                return this.__attributes;
              }
              /**
               * Gets all varying variable information in the shader code.
               * Before calling this method, you need to call the reflect method of this instance.
               * @returns Array of ReflectionVarying object
               */
              get varyings() {
                return this.__varyings;
              }
              /**
               * Gets all uniform variable information in the shader code.
               * Before calling this method, you need to call the reflect method of this instance.
               * @returns Array of ReflectionUniform object
               */
              get uniforms() {
                return this.__uniforms;
              }
              /**
               * Get the names of all attributes included in the shader.
               * Before calling this method, you need to call the reflect method of this instance.
               * @returns Array of string
               */
              get attributesNames() {
                return this.__attributes.map((attribute) => {
                  return attribute.name;
                });
              }
              /**
               * Get the attribute semantic (e.g. 'POSITION') of all attributes included in the shader.
               * Before calling this method, you need to call the reflect method of this instance.
               * @returns Array of AttributeSemantics object
               */
              get attributesSemantics() {
                return this.__attributes.map((attribute) => {
                  return attribute.semantic;
                });
              }
              /**
               * Get the variable type (e.g. 'vec4') of all attributes included in the shader.
               * Before calling this method, you need to call the reflect method of this instance.
               * @returns Array of VarType object
               */
              get attributesTypes() {
                return this.__attributes.map((attribute) => {
                  return attribute.type;
                });
              }
              /**
               * Add an attributeSemantics.
               * The attributeSemantics is used in the ReflectionAttribute.semantics
               * (See reflect method of this class)
               */
              addAttributeSemanticsMap(map) {
                this.__attributeSemanticsMap = new Map([...this.__attributeSemanticsMap, ...map]);
              }
              /**
               * Add a uniformSemantics.
               * The attributeSemantics is used in the ReflectionAttribute.semantics
               * (See reflect method of this class)
               */
              addUniformSemanticsMap(map) {
                this.__uniformSemanticsMap = new Map([...this.__uniformSemanticsMap, ...map]);
              }
              /**
               * Add an attributeSemantics.
               * The attributeSemantics is used in the ReflectionAttribute.semantics
               * (See reflect method of this class)
               */
              addAttributeSemantics(key, value) {
                this.__attributeSemanticsMap.set(key, value);
              }
              /**
               * Add a uniformSemantics.
               * The attributeSemantics is used in the ReflectionAttribute.semantics
               * (See reflect method of this class)
               */
              addUniformSemantics(key, value) {
                this.__uniformSemanticsMap.set(key, value);
              }
              /**
               * Initialize attributeSemantics
               */
              resetAttributeSemantics() {
                this.__attributeSemanticsMap = /* @__PURE__ */ new Map();
              }
              /**
               * Initialize uniformSemantics
               */
              resetUniformSemantics() {
                this.__uniformSemanticsMap = /* @__PURE__ */ new Map();
              }
              /**
               * Analyze shader code of the shaderity and get information of attribute, varying and uniform.
               * The information can be retrieved from the get method of this instance.
               *
               * The semantic property of the ReflectionAttribute is assigned to the value of the semantic if
               * it is specified in the attribute line of the shader code. If not, the AttributeSemanticsMap
               * is searched for matching semantics, or UNKNOWN. The same applies to the semantic property of
               * ReflectionUniform.
               */
              reflect() {
                const splittedShaderCode = this.__splittedShaderCode;
                const shaderStage = this.__shaderStage;
                for (const shaderCodeLine of splittedShaderCode) {
                  const isAttributeLine = this.__matchAttribute(shaderCodeLine, shaderStage);
                  if (isAttributeLine) {
                    this.__addAttribute(shaderCodeLine);
                    continue;
                  }
                  const isVaryingLine = this.__matchVarying(shaderCodeLine, shaderStage);
                  if (isVaryingLine) {
                    this.__addVarying(shaderCodeLine, shaderStage);
                    continue;
                  }
                  const isUniformLine = shaderCodeLine.match(/^(?![\/])[\t ]*uniform[\t ]+/);
                  if (isUniformLine) {
                    this.__addUniform(shaderCodeLine);
                    continue;
                  }
                }
              }
              __setDefaultAttributeAndUniformSemanticsMap() {
                this.__attributeSemanticsMap.set("position", "POSITION");
                this.__attributeSemanticsMap.set("color$", "COLOR_0");
                this.__attributeSemanticsMap.set("color_?0", "COLOR_0");
                this.__attributeSemanticsMap.set("texcoord$", "TEXCOORD_0");
                this.__attributeSemanticsMap.set("texcoord_?0", "TEXCOORD_0");
                this.__attributeSemanticsMap.set("texcoord_?1", "TEXCOORD_1");
                this.__attributeSemanticsMap.set("texcoord_?2", "TEXCOORD_2");
                this.__attributeSemanticsMap.set("normal", "NORMAL");
                this.__attributeSemanticsMap.set("tangent", "TANGENT");
                this.__attributeSemanticsMap.set("joint$", "JOINTS_0");
                this.__attributeSemanticsMap.set("bone$", "JOINTS_0");
                this.__attributeSemanticsMap.set("joint_?0", "JOINTS_0");
                this.__attributeSemanticsMap.set("bone_?0", "JOINTS_0");
                this.__attributeSemanticsMap.set("weight$", "WEIGHTS_0");
                this.__attributeSemanticsMap.set("weight_?0", "WEIGHTS_0");
                this.__uniformSemanticsMap.set("worldmatrix", "WorldMatrix");
                this.__uniformSemanticsMap.set("normalmatrix", "NormalMatrix");
                this.__uniformSemanticsMap.set("viewmatrix", "ViewMatrix");
                this.__uniformSemanticsMap.set("projectionmatrix", "ProjectionMatrix");
                this.__uniformSemanticsMap.set("modelviewmatrix", "ModelViewMatrix");
              }
              __matchAttribute(shaderCodeLine, shaderStage) {
                if (shaderStage !== "vertex") {
                  return false;
                }
                return shaderCodeLine.match(/^(?![\/])[\t ]*(attribute|in)[\t ]+.+;/);
              }
              __addAttribute(shaderCodeLine) {
                const reflectionAttribute = {
                  name: "",
                  type: "float",
                  semantic: "UNKNOWN"
                };
                const matchType = shaderCodeLine.match(Reflection.attributeAndVaryingTypeRegExp);
                if (matchType) {
                  const type = matchType[1];
                  reflectionAttribute.type = type;
                  const name = matchType[2];
                  reflectionAttribute.name = name;
                  const matchSemantic = shaderCodeLine.match(Reflection.semanticRegExp);
                  if (matchSemantic) {
                    reflectionAttribute.semantic = matchSemantic[1];
                  } else {
                    for (let [key, value] of this.__attributeSemanticsMap) {
                      if (name.match(new RegExp(key, "i"))) {
                        reflectionAttribute.semantic = value;
                      }
                    }
                  }
                }
                this.__attributes.push(reflectionAttribute);
              }
              __matchVarying(shaderCodeLine, shaderStage) {
                if (shaderStage === "vertex") {
                  return shaderCodeLine.match(/^(?![\/])[\t ]*(varying|out)[\t ]+.+;/);
                } else {
                  return shaderCodeLine.match(/^(?![\/])[\t ]*(varying|in)[\t ]+.+;/);
                }
              }
              __addVarying(shaderCodeLine, shaderStage) {
                const reflectionVarying = {
                  name: "",
                  type: "float",
                  inout: "in"
                };
                const matchType = shaderCodeLine.match(Reflection.attributeAndVaryingTypeRegExp);
                if (matchType) {
                  const type = matchType[1];
                  reflectionVarying.type = type;
                  const name = matchType[2];
                  reflectionVarying.name = name;
                  reflectionVarying.inout = shaderStage === "vertex" ? "out" : "in";
                }
                this.__varyings.push(reflectionVarying);
              }
              __addUniform(shaderCodeLine) {
                const reflectionUniform = {
                  name: "",
                  type: "float",
                  semantic: "UNKNOWN"
                };
                const matchType = shaderCodeLine.match(Reflection.uniformTypeRegExp);
                if (matchType) {
                  const type = matchType[1];
                  reflectionUniform.type = type;
                  const name = matchType[2];
                  reflectionUniform.name = name;
                  const matchSemantics = shaderCodeLine.match(Reflection.semanticRegExp);
                  if (matchSemantics) {
                    reflectionUniform.semantic = matchSemantics[1];
                  } else {
                    for (let [key, value] of this.__uniformSemanticsMap) {
                      if (name.match(new RegExp(key, "i"))) {
                        reflectionUniform.semantic = value;
                      }
                    }
                  }
                }
                this.__uniforms.push(reflectionUniform);
              }
            }
            Reflection.attributeAndVaryingTypeRegExp = /[\t ]+(float|int|uint|vec2|vec3|vec4|mat2|mat3|mat4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4)[\t ]+(\w+);/;
            Reflection.uniformTypeRegExp = /[\t ]+(float|int|uint|vec2|vec3|vec4|mat2|mat3|mat4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4|sampler2D|samplerCube|sampler3D)[\t ]+(\w+);/;
            Reflection.semanticRegExp = /<.*semantic[\t ]*=[\t ]*(\w+).*>/;
            exports2["default"] = Reflection;
            ;
          })
        ),
        /***/
        "./src/main/ShaderEditor.ts": (
          /*!**********************************!*\
            !*** ./src/main/ShaderEditor.ts ***!
            \**********************************/
          /***/
          ((__unused_webpack_module, exports2) => {
            Object.defineProperty(exports2, "__esModule", { value: true });
            class ShaderEditor {
              static _insertDefinition(splittedShaderCode, definition) {
                const defStr = definition.replace(/#define[\t ]+/, "");
                splittedShaderCode.unshift(`#define ${defStr}`);
              }
              static _fillTemplate(shaderCode, templateObject) {
                const templateString = shaderCode.replace(/\/\*[\t ]*shaderity:[\t ]*(@{[\t ]*)(\S+)([\t ]*})[\t ]*\*\//g, "${this.$2}");
                const resultCode = new Function("return `" + templateString + "`;").call(templateObject);
                return resultCode;
              }
            }
            exports2["default"] = ShaderEditor;
          })
        ),
        /***/
        "./src/main/ShaderTransformer.ts": (
          /*!***************************************!*\
            !*** ./src/main/ShaderTransformer.ts ***!
            \***************************************/
          /***/
          ((__unused_webpack_module, exports2) => {
            Object.defineProperty(exports2, "__esModule", { value: true });
            class ShaderTransformer {
              /**
               * @private
               * Translate a GLSL ES3 shader code to a GLSL ES1 shader code
               */
              static _transformToGLSLES1(splittedShaderCode, isFragmentShader, embedErrorsInOutput) {
                this.__convertOrInsertVersionGLSLES1(splittedShaderCode);
                this.__removeES3Qualifier(splittedShaderCode, embedErrorsInOutput);
                this.__convertIn(splittedShaderCode, isFragmentShader);
                this.__convertOut(splittedShaderCode, isFragmentShader, embedErrorsInOutput);
                this.__removePrecisionForES3(splittedShaderCode);
                this.__convertTextureFunctionToES1(splittedShaderCode, isFragmentShader, embedErrorsInOutput);
                const transformedSplittedShaderCode = splittedShaderCode;
                return transformedSplittedShaderCode;
              }
              /**
               * @private
               * Translate a GLSL ES1 shader code to a GLSL ES3 shader code
               */
              static _transformToGLSLES3(splittedShaderCode, isFragmentShader) {
                this.__convertOrInsertVersionGLSLES3(splittedShaderCode);
                this.__convertAttribute(splittedShaderCode, isFragmentShader);
                this.__convertVarying(splittedShaderCode, isFragmentShader);
                this.__convertTextureCube(splittedShaderCode);
                this.__convertTexture2D(splittedShaderCode);
                this.__convertTexture2DProd(splittedShaderCode);
                this.__convertTexture3D(splittedShaderCode);
                this.__convertTexture3DProd(splittedShaderCode);
                const transformedSplittedShaderCode = splittedShaderCode;
                return transformedSplittedShaderCode;
              }
              /**
               * @private
               * Translate a GLSL shader code to a shader code of specified GLSL version
               */
              static _transformTo(version, splittedShaderCode, isFragmentShader, embedErrorsInOutput) {
                if (version.match(/webgl2|es3/i)) {
                  return this._transformToGLSLES3(splittedShaderCode, isFragmentShader);
                } else if (version.match(/webgl1|es1/i)) {
                  return this._transformToGLSLES1(splittedShaderCode, isFragmentShader, embedErrorsInOutput);
                } else {
                  console.error("Invalid Version");
                  return splittedShaderCode;
                }
              }
              /**
               * @private
               * If the first line contains version information, overwrite the first line with '#version 100'.
               * If not, add '#version 100' to the first line.
               *
               * Note: If the first line is commented out and the version information is written in the second or later line,
               * the appropriate version information will be added to the first line and the user-defined version information
               * in the second or later line will be removed.
               */
              static __convertOrInsertVersionGLSLES1(splittedShaderCode) {
                const reg = /^(?![\/])[\t ]*#[\t ]*version[\t ]+.*/;
                this.__removeFirstMatchingLine(splittedShaderCode, reg);
                splittedShaderCode.unshift("#version 100");
              }
              /**
               * @private
               * If the first line contains version information, overwrite the first line with '#version 300 es'.
               * If not, add '#version 300 es' to the first line.
               * In both cases, '#define GLSL_ES3' will be inserted in the second line.
               * Use the '#define GLSL_ES3' directive if you want to write a shader code that will only run in the case of webgl2.
               *
               * Note: If the first line is commented out and the version information is written in the second or later line,
               * the appropriate version information will be added to the first line and the user-defined version information
               * in the second or later line will be removed.
               */
              static __convertOrInsertVersionGLSLES3(splittedShaderCode) {
                const reg = /^(?![\/])[\t ]*#[\t ]*version[\t ]+.*/;
                this.__removeFirstMatchingLine(splittedShaderCode, reg);
                splittedShaderCode.unshift("#define GLSL_ES3");
                splittedShaderCode.unshift("#version 300 es");
              }
              /**
               * @private
               * Find the 'in' qualifier in the shader code and replace it with the GLSL ES1 qualifier('attribute' or 'varying')
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertIn(splittedShaderCode, isFragmentShader) {
                const reg = /^(?![\/])[\t ]*in[\t ]+((highp|mediump|lowp|)[\t ]*\w+[\t ]*\w+[\t ]*;)/;
                let replaceFunc;
                if (isFragmentShader) {
                  replaceFunc = function(match, p1) {
                    return "varying " + p1;
                  };
                } else {
                  replaceFunc = function(match, p1) {
                    return "attribute " + p1;
                  };
                }
                this.__replaceLine(splittedShaderCode, reg, replaceFunc);
              }
              /**
               * @private
               * Find the "out" qualifier in the shader code and modify the shader code.
               * If the shader stage is vertex, the "out" qualifiers will be replaced by "varying" qualifier.
               * If the shader stage is fragment and the shader has "out" qualifiers, the "out" qualifiers will
               * be deleted and the variable is used to assign a value to gl_FragColor.
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertOut(splittedShaderCode, isFragmentShader, embedErrorsInOutput) {
                if (isFragmentShader) {
                  const variableName = this.__removeOutQualifier(splittedShaderCode, embedErrorsInOutput);
                  if (variableName == null) {
                    return;
                  }
                  this.__addGLFragColor(variableName, splittedShaderCode, embedErrorsInOutput);
                } else {
                  const reg = /^(?![\/])[\t ]*out[\t ]+((highp|mediump|lowp|)[\t ]*\w+[\t ]*\w+[\t ]*;)/;
                  const replaceFunc = function(match, p1) {
                    return "varying " + p1;
                  };
                  this.__replaceLine(splittedShaderCode, reg, replaceFunc);
                }
              }
              /**
               * @private
               * This method is a part of __convertOut method.
               * This method deletes the "out" qualifiers and adds the line for assigning to gl_FragColor.
               * If the shader does not have the "out" qualifiers, this method does nothing.
               */
              static __removeOutQualifier(splittedShaderCode, embedErrorsInOutput) {
                const reg = /^(?![\/])[\t ]*out[\t ]+((highp|mediump|lowp|)[\t ]*\w+[\t ]*(\w+)[\t ]*;)/;
                let variableName;
                for (let i = 0; i < splittedShaderCode.length; i++) {
                  const match = splittedShaderCode[i].match(reg);
                  if (match) {
                    splittedShaderCode[i] = match[1];
                    variableName = match[3];
                    break;
                  }
                }
                return variableName;
              }
              static __addGLFragColor(variableName, splittedShaderCode, embedErrorsInOutput) {
                const closeBracketReg = /(.*)\}[\n\t ]*$/;
                const returnReg = /[\n\t ]*return[\n\t ]*;/;
                const mainFuncStartReg = /(^|^(?![\/])[\t\n ]+)void[\t\n ]+main([\t\n ]|\(|$)/;
                const fragColorCode = `  gl_FragColor = ${variableName};`;
                let setGlFragColorInLastLine = false;
                for (let i = splittedShaderCode.length - 1; i >= 0; i--) {
                  const line = splittedShaderCode[i];
                  if (!setGlFragColorInLastLine && line.match(closeBracketReg)) {
                    splittedShaderCode[i] = line.replace(closeBracketReg, `$1
${fragColorCode}
}
`);
                    setGlFragColorInLastLine = true;
                  }
                  if (line.match(returnReg)) {
                    splittedShaderCode.splice(i, 0, fragColorCode);
                  }
                  if (line.match(mainFuncStartReg)) {
                    break;
                  }
                }
                if (!setGlFragColorInLastLine) {
                  const errorMessage = "__removeOutQualifier: Not found the closing brackets for the main function";
                  this.__outError(splittedShaderCode, splittedShaderCode.length, errorMessage, embedErrorsInOutput);
                }
              }
              /**
               * @private
               * Find the qualifier for es3 only in the shader code and remove it
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __removeES3Qualifier(splittedShaderCode, embedErrorsInOutput) {
                this.__removeVaryingQualifier(splittedShaderCode, embedErrorsInOutput);
                this.__removeLayout(splittedShaderCode);
              }
              /**
               * @private
               * Find the "flat" and "smooth" qualifier in the shader code and remove it
               */
              static __removeVaryingQualifier(splittedShaderCode, embedErrorsInOutput) {
                const reg = /^(?![\/])[\t ]*(flat|smooth)[\t ]*((in|out)[\t ]+.*)/;
                const errorMessage = "__removeVaryingQualifier: glsl es1 does not support flat qualifier";
                for (let i = 0; i < splittedShaderCode.length; i++) {
                  splittedShaderCode[i] = splittedShaderCode[i].replace(reg, (match, p1, p2) => {
                    if (p1 === "flat") {
                      this.__outError(splittedShaderCode, i + 1, errorMessage, embedErrorsInOutput);
                      return match;
                    }
                    return p2;
                  });
                }
              }
              /**
               * @private
               * Find the "layout" qualifier in the shader code and remove it
               */
              static __removeLayout(splittedShaderCode) {
                const reg = /^(?![\/])[\t ]*layout[\t ]*\([\t ]*location[\t ]*\=[\t ]*\d[\t ]*\)[\t ]+/g;
                this.__replaceLine(splittedShaderCode, reg, "");
              }
              /**
               * @private
               * Find the "precision" qualifier in the shader code and remove it if the "precision" qualifier is valid for only GLSL ES3
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __removePrecisionForES3(splittedShaderCode) {
                const reg = /^(?![\/])[\t ]*precision[\t ]+(highp|mediump|lowp)[\t ]+(\w+)[\t ]*;/;
                for (let i = 0; i < splittedShaderCode.length; i++) {
                  const match = splittedShaderCode[i].match(reg);
                  if (match != null) {
                    if (match[2] === "int" || match[2] === "float" || match[2] === "sampler2D" || match[2] === "samplerCube") {
                      continue;
                    } else {
                      splittedShaderCode.splice(i--, 1);
                    }
                  }
                }
              }
              /**
               * @private
               * Find the "texture" and "textureProj" method in the shader code and
               * replace it with the GLSL ES1 method('texture2D', 'texture2D', and so on)
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertTextureFunctionToES1(splittedShaderCode, isFragmentShader, embedErrorsInOutput) {
                var _a, _b;
                const sbl = this.__regSymbols();
                const regTextureProj = new RegExp(`(${sbl}+)textureProj(Lod|)(${sbl}+)`, "g");
                const regTexture = new RegExp(`(${sbl}+)texture(Lod|)(${sbl}+)`, "g");
                let argumentSamplerMap;
                const uniformSamplerMap = this.__createUniformSamplerMap(splittedShaderCode, embedErrorsInOutput);
                for (let i = 0; i < splittedShaderCode.length; i++) {
                  const line = splittedShaderCode[i];
                  const matchTextureProj = line.match(/textureProj(Lod|)[\t ]*\([\t ]*(\w+),/);
                  if (matchTextureProj) {
                    argumentSamplerMap = argumentSamplerMap !== null && argumentSamplerMap !== void 0 ? argumentSamplerMap : this.__createArgumentSamplerMap(splittedShaderCode, i, embedErrorsInOutput);
                    const isLodMethod = matchTextureProj[1] === "Lod";
                    const extensionStr = isFragmentShader && isLodMethod ? `EXT` : ``;
                    const variableName = matchTextureProj[2];
                    const samplerType = (_a = argumentSamplerMap === null || argumentSamplerMap === void 0 ? void 0 : argumentSamplerMap.get(variableName)) !== null && _a !== void 0 ? _a : uniformSamplerMap.get(variableName);
                    if (samplerType != null) {
                      if (samplerType === "sampler2D") {
                        splittedShaderCode[i] = splittedShaderCode[i].replace(regTextureProj, `$1texture2DProj$2${extensionStr}$3`);
                      } else {
                        const errorMessage = "__convertTextureFunctionToES1: do not support " + samplerType + " type";
                        this.__outError(splittedShaderCode, i, errorMessage, embedErrorsInOutput);
                      }
                    }
                    continue;
                  }
                  const matchTexture = line.match(/texture(Lod|)[\t ]*\([\t ]*(\w+),/);
                  if (matchTexture) {
                    argumentSamplerMap = argumentSamplerMap !== null && argumentSamplerMap !== void 0 ? argumentSamplerMap : this.__createArgumentSamplerMap(splittedShaderCode, i, embedErrorsInOutput);
                    const isLodMethod = matchTexture[1] === "Lod";
                    const extensionStr = isFragmentShader && isLodMethod ? `EXT` : ``;
                    const variableName = matchTexture[2];
                    const samplerType = (_b = argumentSamplerMap === null || argumentSamplerMap === void 0 ? void 0 : argumentSamplerMap.get(variableName)) !== null && _b !== void 0 ? _b : uniformSamplerMap.get(variableName);
                    if (samplerType != null) {
                      let textureFunc;
                      if (samplerType === "sampler2D") {
                        textureFunc = "texture2D";
                      } else if (samplerType === "samplerCube") {
                        textureFunc = "textureCube";
                      } else {
                        textureFunc = "";
                        const errorMessage = "__convertTextureFunctionToES1: do not support " + samplerType + " type";
                        this.__outError(splittedShaderCode, i, errorMessage, embedErrorsInOutput);
                      }
                      if (textureFunc !== "") {
                        splittedShaderCode[i] = splittedShaderCode[i].replace(regTexture, `$1${textureFunc}$2${extensionStr}$3`);
                      }
                    }
                    continue;
                  }
                  const isBlockEnd = !!line.match(/\}/);
                  if (isBlockEnd) {
                    argumentSamplerMap = void 0;
                  }
                }
              }
              /**
               * @private
               * This method finds uniform declarations of sampler types in the shader and
               * creates a map with variable names as keys and types as values.
               */
              static __createUniformSamplerMap(splittedShaderCode, embedErrorsInOutput) {
                const uniformSamplerMap = /* @__PURE__ */ new Map();
                for (let i = 0; i < splittedShaderCode.length; i++) {
                  const line = splittedShaderCode[i];
                  const match = line.match(/^(?![\/])[\t ]*uniform*[\t ]*(highp|mediump|lowp|)[\t ]*(sampler\w+)[\t ]+(\w+)/);
                  if (match) {
                    const samplerType = match[2];
                    const name = match[3];
                    if (uniformSamplerMap.get(name)) {
                      const errorMessage = "__createUniformSamplerMap: duplicate variable name";
                      this.__outError(splittedShaderCode, i, errorMessage, embedErrorsInOutput);
                    }
                    uniformSamplerMap.set(name, samplerType);
                  }
                }
                return uniformSamplerMap;
              }
              /**
               * @private
               * This method finds sampler types from the function arguments and
               * creates a map with variable names as keys and types as values.
               */
              static __createArgumentSamplerMap(splittedShaderCode, lineIndex, embedErrorsInOutput) {
                var _a, _b;
                const argumentSamplerMap = /* @__PURE__ */ new Map();
                for (let i = lineIndex; i >= 0; i--) {
                  const line = splittedShaderCode[i];
                  const isBlockStartLine = !!line.match(/\{/);
                  if (!isBlockStartLine) {
                    continue;
                  }
                  const bracketSectionCode = this.__getBracketSection(splittedShaderCode, i);
                  const innerBracketSectionCode = (_a = bracketSectionCode.match(/.*\((.*)\)/)) === null || _a === void 0 ? void 0 : _a[1];
                  if (innerBracketSectionCode == null) {
                    return;
                  }
                  const variableCandidates = innerBracketSectionCode.split(",");
                  const samplerTypeDefinitionReg = /[\n\t ]*(highp|mediump|lowp|)[\n\t ]*(sampler\w+)[\n\t ]*(\w+)[\n\t ]*/;
                  const isFunctionBracket = !!((_b = variableCandidates[0].match(samplerTypeDefinitionReg)) !== null && _b !== void 0 ? _b : variableCandidates[0].match(/^[\n\t ]*$/));
                  if (!isFunctionBracket) {
                    continue;
                  }
                  for (const variableCandidate of variableCandidates) {
                    const samplerVariableMatch = variableCandidate.match(samplerTypeDefinitionReg);
                    if (samplerVariableMatch == null) {
                      continue;
                    }
                    const samplerType = samplerVariableMatch[2];
                    const name = samplerVariableMatch[3];
                    if (argumentSamplerMap.get(name)) {
                      const errorMessage = "__createArgumentSamplerMap: duplicate variable name";
                      this.__outError(splittedShaderCode, i, errorMessage, embedErrorsInOutput);
                    }
                    argumentSamplerMap.set(name, samplerType);
                  }
                  break;
                }
                return argumentSamplerMap;
              }
              /**
               * @private
               * This method returns the part enclosed in brackets(= '()').
               * For example, you can get lines that contain function arguments, conditional expressions for if statements, etc.
               */
              static __getBracketSection(splittedShaderCode, bracketEndIndex) {
                let bracketStartIndex = 0;
                for (let j = bracketEndIndex; j >= 0; j--) {
                  const line = splittedShaderCode[j];
                  const isBracketStartMatch = !!line.match(/\(/);
                  if (isBracketStartMatch) {
                    bracketStartIndex = j;
                    break;
                  }
                }
                let containBracketCode = "";
                for (let j = bracketStartIndex; j <= bracketEndIndex; j++) {
                  containBracketCode += splittedShaderCode[j];
                }
                return containBracketCode;
              }
              /**
               * @private
               * Find the 'attribute' qualifier in the vertex shader code and replace it with the GLSL ES3 qualifier('in')
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertAttribute(splittedShaderCode, isFragmentShader) {
                if (isFragmentShader) {
                  return;
                }
                const reg = /^(?![\/])[\t ]*attribute[\t ]+/g;
                const replaceStr = "in ";
                this.__replaceLine(splittedShaderCode, reg, replaceStr);
              }
              /**
               * @private
               * Find the 'varying' qualifier in the shader code and replace it with the GLSL ES3 qualifier('in' or 'out')
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertVarying(splittedShaderCode, isFragmentShader) {
                const reg = /^(?![\/])[\t ]*varying[\t ]+/g;
                const replaceStr = isFragmentShader ? "in " : "out ";
                this.__replaceLine(splittedShaderCode, reg, replaceStr);
              }
              /**
               * @private
               * Find the 'textureCube' method in the shader code and replace it with the GLSL ES3 method('texture')
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertTextureCube(splittedShaderCode) {
                const sbl = this.__regSymbols();
                const reg = new RegExp(`(${sbl}+)(textureCube)(${sbl}+)`, "g");
                const replaceStr = "texture";
                this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
              }
              /**
               * @private
               * Find the 'texture2D' method in the shader code and replace it with the GLSL ES3 method('texture')
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertTexture2D(splittedShaderCode) {
                const sbl = this.__regSymbols();
                const reg = new RegExp(`(${sbl}+)(texture2D)(${sbl}+)`, "g");
                const replaceStr = "texture";
                this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
              }
              /**
               * @private
               * Find the 'texture2DProj' method in the shader code and replace it with the GLSL ES3 method('textureProj')
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertTexture2DProd(splittedShaderCode) {
                const sbl = this.__regSymbols();
                const reg = new RegExp(`(${sbl}+)(texture2DProj)(${sbl}+)`, "g");
                const replaceStr = "textureProj";
                this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
              }
              /**
               * @private
               * Find the 'texture3D' method in the shader code and replace it with the GLSL ES3 method('texture')
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertTexture3D(splittedShaderCode) {
                const sbl = this.__regSymbols();
                const reg = new RegExp(`(${sbl}+)(texture3D)(${sbl}+)`, "g");
                const replaceStr = "texture";
                this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
              }
              /**
               * @private
               * Find the 'texture3DProj' method in the shader code and replace it with the GLSL ES3 method('textureProj')
               * This method directly replace the elements of the splittedShaderCode variable.
               */
              static __convertTexture3DProd(splittedShaderCode) {
                const sbl = this.__regSymbols();
                const reg = new RegExp(`(${sbl}+)(texture3DProj)(${sbl}+)`, "g");
                const replaceStr = "textureProj";
                this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
              }
              static __regSymbols() {
                return `[!"#$%&'()*+-.,/:;<=>?@[\\]^\`{|}~	
 ]`;
              }
              static __replaceLine(splittedShaderCode, reg, replacement) {
                for (let i = 0; i < splittedShaderCode.length; i++) {
                  splittedShaderCode[i] = splittedShaderCode[i].replace(reg, replacement);
                }
              }
              static __removeFirstMatchingLine(splittedShaderCode, reg) {
                for (let i = 0; i < splittedShaderCode.length; i++) {
                  if (splittedShaderCode[i].match(reg)) {
                    splittedShaderCode.splice(i, 1);
                    break;
                  }
                }
              }
              static __outError(splittedShaderCode, lineIndex, errorMessage, embedErrorsInOutput) {
                if (embedErrorsInOutput) {
                  const shaderOutputMessage = `// line ${lineIndex}: ${errorMessage}
`;
                  const closeBracketReg = /(.*)\}[\n\t ]*$/;
                  for (let i = splittedShaderCode.length - 1; i >= 0; i--) {
                    const line = splittedShaderCode[i];
                    if (line.match(closeBracketReg)) {
                      break;
                    }
                    if (splittedShaderCode[i] === shaderOutputMessage) {
                      return;
                    }
                  }
                  console.error(errorMessage);
                  splittedShaderCode.push(shaderOutputMessage);
                } else {
                  throw new Error(errorMessage);
                }
              }
            }
            exports2["default"] = ShaderTransformer;
          })
        ),
        /***/
        "./src/main/Shaderity.ts": (
          /*!*******************************!*\
            !*** ./src/main/Shaderity.ts ***!
            \*******************************/
          /***/
          (function(__unused_webpack_module, exports2, __webpack_require__2) {
            var __importDefault = this && this.__importDefault || function(mod) {
              return mod && mod.__esModule ? mod : { "default": mod };
            };
            Object.defineProperty(exports2, "__esModule", { value: true });
            const Reflection_1 = __importDefault(__webpack_require__2(
              /*! ./Reflection */
              "./src/main/Reflection.ts"
            ));
            const ShaderTransformer_1 = __importDefault(__webpack_require__2(
              /*! ./ShaderTransformer */
              "./src/main/ShaderTransformer.ts"
            ));
            const ShaderEditor_1 = __importDefault(__webpack_require__2(
              /*! ./ShaderEditor */
              "./src/main/ShaderEditor.ts"
            ));
            const Utility_1 = __importDefault(__webpack_require__2(
              /*! ./Utility */
              "./src/main/Utility.ts"
            ));
            const ShaderityObjectCreator_1 = __importDefault(__webpack_require__2(
              /*! ./ShaderityObjectCreator */
              "./src/main/ShaderityObjectCreator.ts"
            ));
            const PreProcessor_1 = __importDefault(__webpack_require__2(
              /*! ./PreProcessor */
              "./src/main/PreProcessor.ts"
            ));
            class Shaderity {
              // =========================================================================================================
              // shader transformation functions
              // =========================================================================================================
              /**
               * Translate a GLSL ES3 shader code to a GLSL ES1 shader code
               * @param obj Shaderity object to translate to glsl es1
               * @param embedErrorsInOutput If true, when there is an error in the conversion,
               *    the error and the number of lines are output at the bottom of the return
               *    value ShaderityObject.code. If false, throw an error.
               * @returns ShaderityObject whose code property is the shader code for GLSL ES1
               */
              static transformToGLSLES1(obj, embedErrorsInOutput = false) {
                const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                const transformedSplittedShaderCode = ShaderTransformer_1.default._transformToGLSLES1(splittedShaderCode, obj.isFragmentShader, embedErrorsInOutput);
                const resultCode = Utility_1.default._joinSplittedLine(transformedSplittedShaderCode);
                const resultObj = {
                  code: resultCode,
                  shaderStage: obj.shaderStage,
                  isFragmentShader: obj.isFragmentShader
                };
                return resultObj;
              }
              /**
               * Translate a GLSL ES1 shader code to a GLSL ES3 shader code
               */
              static transformToGLSLES3(obj) {
                const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                const transformedSplittedShaderCode = ShaderTransformer_1.default._transformToGLSLES3(splittedShaderCode, obj.isFragmentShader);
                const resultCode = Utility_1.default._joinSplittedLine(transformedSplittedShaderCode);
                const resultObj = {
                  code: resultCode,
                  shaderStage: obj.shaderStage,
                  isFragmentShader: obj.isFragmentShader
                };
                return resultObj;
              }
              /**
               * Translate a GLSL shader code to a shader code of specified GLSL version
               */
              static transformTo(version, obj, embedErrorsInOutput = false) {
                const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                const transformedSplittedShaderCode = ShaderTransformer_1.default._transformTo(version, splittedShaderCode, obj.isFragmentShader, embedErrorsInOutput);
                const resultCode = Utility_1.default._joinSplittedLine(transformedSplittedShaderCode);
                const resultObj = {
                  code: resultCode,
                  shaderStage: obj.shaderStage,
                  isFragmentShader: obj.isFragmentShader
                };
                return resultObj;
              }
              static processPragma(obj, remainDefine, definitions = [], startLineStr, endLineStr) {
                const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                const transformedSplittedShaderCode = PreProcessor_1.default.process(splittedShaderCode, remainDefine, definitions, startLineStr, endLineStr);
                const resultCode = Utility_1.default._joinSplittedLine(transformedSplittedShaderCode);
                const resultObj = {
                  code: resultCode,
                  shaderStage: obj.shaderStage,
                  isFragmentShader: obj.isFragmentShader
                };
                return resultObj;
              }
              // =========================================================================================================
              // shaderity object creation functions
              // =========================================================================================================
              /**
               * Create an instance to create shaderity object.
               */
              static createShaderityObjectCreator(shaderStage) {
                return new ShaderityObjectCreator_1.default(shaderStage);
              }
              // =========================================================================================================
              // shader edit functions
              // =========================================================================================================
              /**
               * Find the following template pattern in the shader code and replace key to value
               * @param templateObject An object that represents the string before and after the replacement
               * The key can be a string or an object. If an object is used as the key,
               * the key in the pattern of shaderCode must also match the object.
               * For example, if templateObject is
                  {
                      sample {
                          sampleA: 0
                      }
                  }
               * then the key in a shader code is sample.sampleA.
               */
              // The template pattern is	/* shaderity: @{key} */
              static fillTemplate(obj, arg) {
                const copy = this.__copyShaderityObject(obj);
                copy.code = ShaderEditor_1.default._fillTemplate(copy.code, arg);
                return copy;
              }
              /**
               * Insert define directive
               */
              static insertDefinition(obj, definition) {
                const copy = this.__copyShaderityObject(obj);
                const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                ShaderEditor_1.default._insertDefinition(splittedShaderCode, definition);
                copy.code = Utility_1.default._joinSplittedLine(splittedShaderCode);
                return copy;
              }
              // =========================================================================================================
              // reflection functions
              // =========================================================================================================
              /**
               * Create an instance to get the attribute, varying, and uniform information from a shader code of the shaderity.
               * To get these information, you need to call reflection.reflect method.
               */
              static createReflectionObject(obj) {
                const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                const reflection = new Reflection_1.default(splittedShaderCode, obj.shaderStage);
                return reflection;
              }
              // =========================================================================================================
              // private functions
              // =========================================================================================================
              static __copyShaderityObject(obj) {
                const copiedObj = {
                  code: obj.code,
                  shaderStage: obj.shaderStage,
                  isFragmentShader: obj.isFragmentShader
                };
                return copiedObj;
              }
            }
            exports2["default"] = Shaderity;
          })
        ),
        /***/
        "./src/main/ShaderityObjectCreator.ts": (
          /*!********************************************!*\
            !*** ./src/main/ShaderityObjectCreator.ts ***!
            \********************************************/
          /***/
          (function(__unused_webpack_module, exports2, __webpack_require__2) {
            var __importDefault = this && this.__importDefault || function(mod) {
              return mod && mod.__esModule ? mod : { "default": mod };
            };
            Object.defineProperty(exports2, "__esModule", { value: true });
            const Utility_1 = __importDefault(__webpack_require__2(
              /*! ./Utility */
              "./src/main/Utility.ts"
            ));
            class ShaderityObjectCreator {
              constructor(shaderStage) {
                this.__functionIdCount = 0;
                this.__defineDirectiveNames = [];
                this.__extensions = [];
                this.__globalPrecision = {
                  int: "highp",
                  float: "highp",
                  sampler2D: "highp",
                  samplerCube: "highp",
                  sampler3D: "highp",
                  sampler2DArray: "highp",
                  isampler2D: "highp",
                  isamplerCube: "highp",
                  isampler3D: "highp",
                  isampler2DArray: "highp",
                  usampler2D: "highp",
                  usamplerCube: "highp",
                  usampler3D: "highp",
                  usampler2DArray: "highp",
                  sampler2DShadow: "highp",
                  samplerCubeShadow: "highp",
                  sampler2DArrayShadow: "highp"
                };
                this.__structDefinitions = [];
                this.__globalConstantValues = [];
                this.__globalConstantStructValues = [];
                this.__attributes = [];
                this.__varyings = [];
                this.__uniforms = [];
                this.__uniformStructs = [];
                this.__uniformBufferObjects = [];
                this.__functions = [];
                this.__mainFunctionCode = "void main() {}";
                this.__outputColorVariableName = "renderTarget0";
                this.__shaderStage = shaderStage;
              }
              // =========================================================================================================
              // add parameters functions
              // =========================================================================================================
              addDefineDirective(defineDirectiveName) {
                const isDuplicate = this.__defineDirectiveNames.some((name) => name === defineDirectiveName);
                if (isDuplicate) {
                  console.warn("addDefineDirective: this define directive is already set");
                  return;
                }
                this.__defineDirectiveNames.push(defineDirectiveName);
              }
              addExtension(extensionName, behavior = "enable") {
                const isDuplicate = this.__extensions.some((extension) => extension.extensionName === extensionName);
                if (isDuplicate) {
                  console.warn("addExtension: this extension is already set");
                  return;
                }
                this.__extensions.push({
                  extensionName,
                  behavior
                });
              }
              // only define types
              addStructDefinition(structName, memberObjects) {
                const isDuplicate = this.__structDefinitions.some((structDefinition) => structDefinition.structName === structName);
                if (isDuplicate) {
                  console.error(`addStructDefinition: duplicate struct type name ${structName}`);
                  return;
                }
                this.__structDefinitions.push({
                  structName,
                  memberObjects
                });
              }
              addGlobalConstantValue(variableName, type, values) {
                const isDuplicate = this.__globalConstantValues.some((globalConstantValue) => globalConstantValue.variableName === variableName);
                if (isDuplicate) {
                  console.error(`addGlobalConstantValue: duplicate variable name ${variableName}`);
                  return;
                }
                const isValidComponentNumber = Utility_1.default._isValidComponentCount(type, values);
                if (!isValidComponentNumber) {
                  console.error(`addGlobalConstantValue: the component count of ${variableName} is invalid`);
                  return;
                }
                const isIntType = Utility_1.default._isIntType(type);
                if (isIntType) {
                  const existNonIntegerValue = ShaderityObjectCreator.__existNonIntegerValue(values);
                  if (existNonIntegerValue) {
                    console.warn(`addGlobalConstantValue: non-integer value is set to ${variableName}`);
                  }
                }
                this.__globalConstantValues.push({
                  variableName,
                  type,
                  values
                });
              }
              // need to define struct by the addStructDefinition method
              // validate that the corresponding structure is defined by the __createGlobalConstantStructValueShaderCode method
              addGlobalConstantStructValue(structName, variableName, values) {
                const isDuplicate = this.__globalConstantStructValues.some((structValue) => structValue.variableName === variableName);
                if (isDuplicate) {
                  console.error(`addGlobalConstantStructValue: duplicate variable name ${variableName}`);
                  return;
                }
                this.__globalConstantStructValues.push({
                  variableName,
                  structName,
                  values
                });
              }
              addAttributeDeclaration(variableName, type, options) {
                if (this.__shaderStage !== "vertex") {
                  console.error("addAttribute: this method is for vertex shader only");
                  return;
                }
                const isDuplicate = this.__attributes.some((attribute) => attribute.variableName === variableName);
                if (isDuplicate) {
                  console.error(`addAttribute: duplicate variable name ${variableName}`);
                  return;
                }
                this.__attributes.push({
                  variableName,
                  type,
                  precision: options === null || options === void 0 ? void 0 : options.precision,
                  location: options === null || options === void 0 ? void 0 : options.location
                });
              }
              addVaryingDeclaration(variableName, type, options) {
                const isDuplicate = this.__varyings.some((varying) => varying.variableName === variableName);
                if (isDuplicate) {
                  console.error(`addVarying: duplicate variable name ${variableName}`);
                  return;
                }
                const isIntType = Utility_1.default._isIntType(type);
                let interpolationType = options === null || options === void 0 ? void 0 : options.interpolationType;
                if (isIntType && interpolationType !== "flat") {
                  if (interpolationType != null) {
                    console.error(`addVarying: the interpolationType must be flat for integer types`);
                    return;
                  } else {
                    console.warn(`addVarying: set the interpolationType of integer types to flat to avoid compilation error`);
                    interpolationType = "flat";
                  }
                }
                this.__varyings.push({
                  variableName,
                  type,
                  precision: options === null || options === void 0 ? void 0 : options.precision,
                  interpolationType
                });
              }
              addUniformDeclaration(variableName, type, options) {
                const isDuplicate = this.__uniforms.some((uniform) => uniform.variableName === variableName);
                if (isDuplicate) {
                  console.error(`addUniform: duplicate variable name ${variableName}`);
                  return;
                }
                if (type === "bool" && (options === null || options === void 0 ? void 0 : options.precision) != null) {
                  console.warn(`addUniform: remove the specification of precision for bool type to avoid compilation error`);
                  options.precision = void 0;
                }
                this.__uniforms.push({
                  variableName,
                  type,
                  precision: options === null || options === void 0 ? void 0 : options.precision
                });
              }
              // need to define struct by the addStructDefinition method
              addUniformStructDeclaration(structName, variableName) {
                const isDuplicate = this.__uniformStructs.some((uniformStruct) => uniformStruct.variableName === variableName);
                if (isDuplicate) {
                  console.error(`addUniformStructDeclaration: duplicate variable name ${variableName}`);
                  return;
                }
                this.__uniformStructs.push({
                  variableName,
                  structName
                });
              }
              // for es3
              addUniformBufferObjectDeclaration(blockName, variableObjects, options) {
                const isDuplicateBlockName = this.__uniformBufferObjects.some((ubo) => ubo.blockName === blockName);
                if (isDuplicateBlockName) {
                  console.error(`addUniformBufferObjectDeclaration: duplicate block name ${blockName}`);
                  return;
                }
                for (const ubo of this.__uniformBufferObjects) {
                  for (const uboVariableObject of ubo.variableObjects) {
                    for (const variableObject of variableObjects) {
                      if (uboVariableObject.variableName === variableObject.variableName) {
                        console.error(`addUniformBufferObjectDeclaration: duplicate variable name ${variableObject.variableName}`);
                        return;
                      }
                    }
                  }
                }
                this.__uniformBufferObjects.push({
                  blockName,
                  variableObjects,
                  instanceName: options === null || options === void 0 ? void 0 : options.instanceName
                });
              }
              // the return value Id is a value to delete the function
              // the main function is defined (updated) by the updateMainFunction method
              addFunctionDefinition(functionCode, options) {
                var _a, _b;
                const functionId = this.__functionIdCount++;
                const dependencyLevel = (_a = options === null || options === void 0 ? void 0 : options.dependencyLevel) !== null && _a !== void 0 ? _a : 0;
                this.__functions[dependencyLevel] = (_b = this.__functions[dependencyLevel]) !== null && _b !== void 0 ? _b : [];
                this.__functions[dependencyLevel].push({
                  functionCode,
                  functionId
                });
                return functionId;
              }
              // =========================================================================================================
              // update parameters functions
              // =========================================================================================================
              updateGlobalPrecision(precision) {
                Object.assign(this.__globalPrecision, precision);
              }
              updateStructDefinition(structName, memberObjects) {
                const matchedIndex = this.__structDefinitions.findIndex((structDefinition) => structDefinition.structName === structName);
                if (matchedIndex === -1) {
                  console.error(`updateStructDefinition: the struct type name ${structName} is not exist`);
                  return;
                }
                this.__structDefinitions[matchedIndex].memberObjects = memberObjects;
              }
              updateGlobalConstantValue(variableName, values) {
                const matchedIndex = this.__globalConstantValues.findIndex((globalConstantValue) => globalConstantValue.variableName === variableName);
                if (matchedIndex === -1) {
                  console.warn(`updateGlobalConstantValue: the variable name ${variableName} is not exist`);
                  return;
                }
                const type = this.__globalConstantValues[matchedIndex].type;
                const isValidComponentNumber = Utility_1.default._isValidComponentCount(type, values);
                if (!isValidComponentNumber) {
                  console.error("updateGlobalConstantValue: the component count is invalid");
                  return;
                }
                const isIntType = Utility_1.default._isIntType(type);
                if (isIntType) {
                  const existNonIntegerValue = ShaderityObjectCreator.__existNonIntegerValue(values);
                  if (existNonIntegerValue) {
                    console.warn(`updateGlobalConstantValue: the ${variableName} has a non-integer value.`);
                  }
                }
                this.__globalConstantValues[matchedIndex].values = values;
              }
              updateGlobalConstantStructValue(variableName, values) {
                const matchedIndex = this.__globalConstantStructValues.findIndex((structValue) => structValue.variableName === variableName);
                if (matchedIndex === -1) {
                  console.error(`updateGlobalConstantStructValue:  the variable name ${variableName} is not exist`);
                  return;
                }
                this.__globalConstantStructValues[matchedIndex].values = values;
              }
              updateMainFunction(mainFunctionCodeInner) {
                this.__mainFunctionCode = mainFunctionCodeInner;
              }
              // specify the name of the output color variable from the main function in the fragment shader.
              // users have to assign the result of fragment shader calculation to this variable.
              updateOutputColorVariableName(outputColorVariableName) {
                if (this.__shaderStage !== "fragment") {
                  console.error("updateOutputColorVariableName: this method is for fragment shader only");
                  return;
                }
                if (outputColorVariableName.length === 0) {
                  console.error("updateOutputColorVariableName: invalid outColorVariableName");
                  return;
                }
                this.__outputColorVariableName = outputColorVariableName;
              }
              // =========================================================================================================
              // remove parameters functions
              // =========================================================================================================
              removeDefineDirective(defineDirectiveName) {
                const matchedIndex = this.__defineDirectiveNames.indexOf(defineDirectiveName);
                if (matchedIndex === -1) {
                  console.warn("removedDefineDirective: this define directive is not exist");
                  return;
                }
                this.__defineDirectiveNames.splice(matchedIndex, 1);
              }
              removeExtension(extensionName) {
                const matchedIndex = this.__extensions.findIndex((extension) => extension.extensionName === extensionName);
                if (matchedIndex === -1) {
                  console.warn("removeExtension: this extension is not exist");
                  return;
                }
                this.__extensions.splice(matchedIndex, 1);
              }
              removeStructDefinition(structName) {
                const matchedIndex = this.__structDefinitions.findIndex((structDefinition) => structDefinition.structName === structName);
                if (matchedIndex === -1) {
                  console.error(`removeStructDefinition: the struct type name ${structName} is not exist`);
                  return;
                }
                this.__structDefinitions.splice(matchedIndex, 1);
              }
              removeGlobalConstantValue(variableName) {
                const matchedIndex = this.__globalConstantValues.findIndex((globalConstantValue) => globalConstantValue.variableName === variableName);
                if (matchedIndex === -1) {
                  console.warn(`removeGlobalConstantValue: the variable name ${variableName} is not exist`);
                  return;
                }
                this.__globalConstantValues.splice(matchedIndex, 1);
              }
              removeGlobalConstantStructValue(variableName) {
                const matchedIndex = this.__globalConstantStructValues.findIndex((structValue) => structValue.variableName === variableName);
                if (matchedIndex === -1) {
                  console.error(`updateGlobalConstantStructValue:  the variable name ${variableName} is not exist`);
                  return;
                }
                this.__globalConstantStructValues.splice(matchedIndex, 1);
              }
              removeAttributeDeclaration(variableName) {
                const matchedIndex = this.__attributes.findIndex((attribute) => attribute.variableName === variableName);
                if (matchedIndex === -1) {
                  console.warn(`removeAttribute: the variable name ${variableName} is not exist`);
                  return;
                }
                this.__attributes.splice(matchedIndex, 1);
              }
              removeVaryingDeclaration(variableName) {
                const matchedIndex = this.__varyings.findIndex((varying) => varying.variableName === variableName);
                if (matchedIndex === -1) {
                  console.warn(`removeVarying: the variable name ${variableName} is not exist`);
                  return;
                }
                this.__varyings.splice(matchedIndex, 1);
              }
              removeUniformDeclaration(variableName) {
                const matchedIndex = this.__uniforms.findIndex((uniform) => uniform.variableName === variableName);
                if (matchedIndex === -1) {
                  console.warn(`removeUniform: the variable name ${variableName} is not exist`);
                  return;
                }
                this.__uniforms.splice(matchedIndex, 1);
              }
              removeUniformStructDeclaration(variableName) {
                const matchedIndex = this.__uniformStructs.findIndex((uniformStruct) => uniformStruct.variableName === variableName);
                if (matchedIndex === -1) {
                  console.warn(`removeUniformStructDeclaration: the variable name ${variableName} is not exist`);
                  return;
                }
                this.__uniformStructs.splice(matchedIndex, 1);
              }
              removeUniformBufferObjectDeclaration(blockName) {
                const matchedIndex = this.__uniformBufferObjects.findIndex((ubo) => ubo.blockName === blockName);
                if (matchedIndex === -1) {
                  console.warn(`removeUniformStructDeclaration: the variable name ${blockName} is not exist`);
                  return;
                }
                this.__uniformBufferObjects.splice(matchedIndex, 1);
              }
              removeFunctionDefinition(functionId) {
                this.__fillEmptyFunctions();
                if (functionId < 0 || functionId >= this.__functionIdCount) {
                  console.warn("removeFunctionDefinition: invalid function id");
                }
                for (const functionObjects of this.__functions) {
                  const matchedIndex = functionObjects.findIndex((functionObject) => functionObject.functionId === functionId);
                  if (matchedIndex !== -1) {
                    functionObjects.splice(matchedIndex, 1);
                    return;
                  }
                }
                console.warn(`removeFunctionDefinition: not found the function of functionId ${functionId}`);
              }
              // =========================================================================================================
              // create shaderity object function
              // =========================================================================================================
              createShaderityObject() {
                const shaderityObj = {
                  code: this.__createShaderCode(),
                  shaderStage: this.__shaderStage,
                  isFragmentShader: this.__shaderStage === "fragment"
                };
                return shaderityObj;
              }
              // =========================================================================================================
              // private methods
              // =========================================================================================================
              static __existNonIntegerValue(values) {
                for (const value of values) {
                  if (!Number.isInteger(value)) {
                    return true;
                  }
                }
                return false;
              }
              // TODO: implement shader code import feature (low priority)
              // public importShaderCode(code: string) {}
              // need to apply Shaderity.transformToGLSLES1, transformToGLSLES3 or transformTo method
              __createShaderCode() {
                this.__fillEmptyFunctions();
                const code = `#version 300 es

` + this.__createDefineDirectiveShaderCode() + this.__createExtensionShaderCode() + this.__createGlobalPrecisionShaderCode() + this.__createStructDefinitionShaderCode() + this.__createGlobalConstantValueShaderCode() + this.__createGlobalConstantStructValueShaderCode() + this.__createAttributeDeclarationShaderCode() + this.__createVaryingDeclarationShaderCode() + this.__createOutputColorDeclarationShaderCode() + this.__createUniformDeclarationShaderCode() + this.__createUniformStructDeclarationShaderCode() + this.__createUniformBufferObjectShaderCode() + this.__createFunctionDefinitionShaderCode() + this.__createMainFunctionDefinitionShaderCode();
                return code;
              }
              __fillEmptyFunctions() {
                var _a;
                for (let i = 0; i < this.__functions.length; i++) {
                  this.__functions[i] = (_a = this.__functions[i]) !== null && _a !== void 0 ? _a : [];
                }
              }
              __createDefineDirectiveShaderCode() {
                let shaderCode = "";
                for (const defineDirectiveName of this.__defineDirectiveNames) {
                  shaderCode += `#define ${defineDirectiveName}
`;
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createExtensionShaderCode() {
                let shaderCode = "";
                for (const extension of this.__extensions) {
                  shaderCode += `#extension ${extension.extensionName}: ${extension.behavior}
`;
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              //TODO: remove needless precisions
              __createGlobalPrecisionShaderCode() {
                let shaderCode = "";
                for (const type in this.__globalPrecision) {
                  const precisionType = type;
                  const precisionQualifier = this.__globalPrecision[precisionType];
                  shaderCode += `precision ${precisionQualifier} ${precisionType};
`;
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createStructDefinitionShaderCode() {
                let shaderCode = "";
                for (const structDefinition of this.__structDefinitions) {
                  shaderCode += `struct ${structDefinition.structName} {
`;
                  for (let i = 0; i < structDefinition.memberObjects.length; i++) {
                    const variable = structDefinition.memberObjects[i];
                    shaderCode += `  `;
                    if (variable.precision != null) {
                      shaderCode += `${variable.precision} `;
                    }
                    shaderCode += `${variable.type} ${variable.memberName};
`;
                  }
                  shaderCode += `};
`;
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createGlobalConstantValueShaderCode() {
                let shaderCode = "";
                for (const globalConstantValue of this.__globalConstantValues) {
                  const type = globalConstantValue.type;
                  const variableName = globalConstantValue.variableName;
                  const value = globalConstantValue.values;
                  shaderCode += `const ${type} ${variableName} = ${type}(`;
                  for (let i = 0; i < value.length; i++) {
                    shaderCode += value[i] + ", ";
                  }
                  shaderCode = shaderCode.replace(/,\s$/, ");\n");
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createGlobalConstantStructValueShaderCode() {
                let shaderCode = "";
                for (const structValue of this.__globalConstantStructValues) {
                  const matchedIndex = this.__structDefinitions.findIndex((definition) => definition.structName === structValue.structName);
                  if (matchedIndex === -1) {
                    console.error(`__createGlobalConstantStructValueShaderCode: the struct type ${structValue.structName} is not defined`);
                    continue;
                  }
                  shaderCode += `const ${structValue.structName} ${structValue.variableName} = ${structValue.structName} (
`;
                  const structDefinition = this.__structDefinitions[matchedIndex];
                  if (structDefinition.memberObjects.length !== Object.keys(structValue.values).length) {
                    console.error(`__createGlobalConstantStructValueShaderCode: Invalid number of variables that ${structValue.variableName} has`);
                    continue;
                  }
                  const hasSamplerType = structDefinition.memberObjects.some((memberObject) => Utility_1.default._isSamplerType(memberObject.type));
                  if (hasSamplerType) {
                    console.error(`__createGlobalConstantStructValueShaderCode: ConstantStructValue (${structValue.variableName}) cannot have sampler type parameter`);
                    continue;
                  }
                  for (let i = 0; i < structDefinition.memberObjects.length; i++) {
                    const variableName = structDefinition.memberObjects[i].memberName;
                    const value = structValue.values[variableName];
                    if (value == null) {
                      console.error(`__createGlobalConstantStructValueShaderCode: ${structValue.variableName} does not have the value of ${variableName}`);
                      continue;
                    }
                    const type = structDefinition.memberObjects[i].type;
                    const isValidComponentNumber = Utility_1.default._isValidComponentCount(type, value);
                    if (!isValidComponentNumber) {
                      console.error(`__createGlobalConstantStructValueShaderCode: the component count of ${variableName} in ${structValue.variableName} is invalid`);
                      continue;
                    }
                    shaderCode += `  ${type}(`;
                    for (let i2 = 0; i2 < value.length; i2++) {
                      shaderCode += value[i2] + ", ";
                    }
                    shaderCode = shaderCode.replace(/,\s$/, "),\n");
                  }
                  shaderCode = shaderCode.replace(/,\n$/, "\n);\n");
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createAttributeDeclarationShaderCode() {
                let shaderCode = "";
                for (const attribute of this.__attributes) {
                  if (attribute.location != null) {
                    shaderCode += `layout (location = ${attribute.location}) `;
                  }
                  shaderCode += `in `;
                  if (attribute.precision != null) {
                    shaderCode += `${attribute.precision} `;
                  }
                  shaderCode += `${attribute.type} ${attribute.variableName};
`;
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createVaryingDeclarationShaderCode() {
                let shaderCode = "";
                for (const varying of this.__varyings) {
                  if (varying.interpolationType != null) {
                    shaderCode += `${varying.interpolationType} `;
                  }
                  shaderCode += this.__shaderStage == "vertex" ? `out ` : `in `;
                  if (varying.precision != null) {
                    shaderCode += `${varying.precision} `;
                  }
                  shaderCode += `${varying.type} ${varying.variableName};
`;
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              //TODO: translate when glsl es1
              __createOutputColorDeclarationShaderCode() {
                if (this.__shaderStage !== "fragment") {
                  return "";
                }
                return `layout(location = 0) out vec4 ${this.__outputColorVariableName};

`;
              }
              __createUniformDeclarationShaderCode() {
                let shaderCode = "";
                for (const uniform of this.__uniforms) {
                  shaderCode += `uniform `;
                  if (uniform.precision != null) {
                    shaderCode += `${uniform.precision} `;
                  }
                  shaderCode += `${uniform.type} ${uniform.variableName};
`;
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createUniformStructDeclarationShaderCode() {
                let shaderCode = "";
                for (const uniformStruct of this.__uniformStructs) {
                  const structName = uniformStruct.structName;
                  const existStructDefinition = this.__structDefinitions.some((definition) => definition.structName === structName);
                  if (!existStructDefinition) {
                    console.error(`__createUniformStructDeclarationShaderCode: the struct type ${structName} is not defined`);
                    continue;
                  }
                  shaderCode += `uniform ${structName} ${uniformStruct.variableName};
`;
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createUniformBufferObjectShaderCode() {
                let shaderCode = "";
                for (const ubo of this.__uniformBufferObjects) {
                  shaderCode += `layout (std140) uniform ${ubo.blockName} {
`;
                  for (let i = 0; i < ubo.variableObjects.length; i++) {
                    const variableObj = ubo.variableObjects[i];
                    shaderCode += `  ${variableObj.type} ${variableObj.variableName};
`;
                  }
                  if (ubo.instanceName != null) {
                    shaderCode += `} ${ubo.instanceName};
`;
                  } else {
                    shaderCode += `};
`;
                  }
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createFunctionDefinitionShaderCode() {
                let shaderCode = "";
                for (let i = 0; i < this.__functions.length; i++) {
                  const functionObjects = this.__functions[i];
                  for (let j = 0; j < functionObjects.length; j++) {
                    shaderCode += functionObjects[j].functionCode + `
`;
                  }
                }
                return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
              }
              __createMainFunctionDefinitionShaderCode() {
                return this.__mainFunctionCode + `
`;
              }
            }
            exports2["default"] = ShaderityObjectCreator;
          })
        ),
        /***/
        "./src/main/Utility.ts": (
          /*!*****************************!*\
            !*** ./src/main/Utility.ts ***!
            \*****************************/
          /***/
          ((__unused_webpack_module, exports2) => {
            Object.defineProperty(exports2, "__esModule", { value: true });
            class Utility {
              static _splitByLineFeedCode(source) {
                return source.split(/\r\n|\n/);
              }
              static _joinSplittedLine(splittedLine) {
                return splittedLine.join("\n");
              }
              static _addLineFeedCodeIfNotNullString(source) {
                return source === "" ? source : source + "\n";
              }
              static _componentNumber(type) {
                let componentNumber;
                if (type === "float" || type === "int" || type === "bool" || type === "uint" || type === "sampler2D" || type === "samplerCube" || type === "sampler3D" || type === "sampler2DArray" || type === "isampler2D" || type === "isamplerCube" || type === "isampler3D" || type === "isampler2DArray" || type === "usampler2D" || type === "usamplerCube" || type === "usampler3D" || type === "usampler2DArray" || type === "sampler2DShadow" || type === "samplerCubeShadow" || type === "sampler2DArrayShadow") {
                  componentNumber = 1;
                } else if (type === "vec2" || type === "ivec2" || type === "bvec2" || type === "uvec2") {
                  componentNumber = 2;
                } else if (type === "vec3" || type === "ivec3" || type === "bvec3" || type === "uvec3") {
                  componentNumber = 3;
                } else if (type === "vec4" || type === "ivec4" || type === "bvec4" || type === "uvec4" || type === "mat2" || type === "mat2x2") {
                  componentNumber = 4;
                } else if (type === "mat2x3" || type === "mat3x2") {
                  componentNumber = 6;
                } else if (type === "mat2x4" || type === "mat4x2") {
                  componentNumber = 8;
                } else if (type === "mat3" || type === "mat3x3") {
                  componentNumber = 9;
                } else if (type === "mat3x4" || type === "mat4x3") {
                  componentNumber = 12;
                } else if (type === "mat4" || type === "mat4x4") {
                  componentNumber = 16;
                } else {
                  componentNumber = 0;
                  console.error("Utility._componentNumber: detect unknown type");
                }
                return componentNumber;
              }
              static _isIntType(type) {
                if (type === "int" || type === "ivec2" || type === "ivec3" || type === "ivec4" || type === "uint" || type === "uvec2" || type === "uvec3" || type === "uvec4") {
                  return true;
                } else {
                  return false;
                }
              }
              static _isValidComponentCount(type, values) {
                const validComponentCount = Utility._componentNumber(type);
                if (validComponentCount === values.length) {
                  return true;
                }
                return false;
              }
              static _isSamplerType(type) {
                if (type === "sampler2D" || type === "samplerCube" || type === "sampler3D" || type === "sampler2DArray" || type === "isampler2D" || type === "isamplerCube" || type === "isampler3D" || type === "isampler2DArray" || type === "usampler2D" || type === "usamplerCube" || type === "usampler3D" || type === "usampler2DArray" || type === "sampler2DShadow" || type === "samplerCubeShadow" || type === "sampler2DArrayShadow") {
                  return true;
                } else {
                  return false;
                }
              }
            }
            exports2["default"] = Utility;
          })
        )
        /******/
      };
      var __webpack_module_cache__ = {};
      function __webpack_require__(moduleId) {
        var cachedModule = __webpack_module_cache__[moduleId];
        if (cachedModule !== void 0) {
          return cachedModule.exports;
        }
        var module2 = __webpack_module_cache__[moduleId] = {
          /******/
          // no module.id needed
          /******/
          // no module.loaded needed
          /******/
          exports: {}
          /******/
        };
        __webpack_modules__[moduleId].call(module2.exports, module2, module2.exports, __webpack_require__);
        return module2.exports;
      }
      var __webpack_exports__ = __webpack_require__("./src/index.ts");
      module.exports = __webpack_exports__;
    })();
  }
});
export default require_esm();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsid2VicGFjazovL3NoYWRlcml0eS9zcmMvaW5kZXgudHMiLCAid2VicGFjazovL3NoYWRlcml0eS9zcmMvbWFpbi9QcmVQcm9jZXNzb3IudHMiLCAid2VicGFjazovL3NoYWRlcml0eS9zcmMvbWFpbi9SZWZsZWN0aW9uLnRzIiwgIndlYnBhY2s6Ly9zaGFkZXJpdHkvc3JjL21haW4vU2hhZGVyRWRpdG9yLnRzIiwgIndlYnBhY2s6Ly9zaGFkZXJpdHkvc3JjL21haW4vU2hhZGVyVHJhbnNmb3JtZXIudHMiLCAid2VicGFjazovL3NoYWRlcml0eS9zcmMvbWFpbi9TaGFkZXJpdHkudHMiLCAid2VicGFjazovL3NoYWRlcml0eS9zcmMvbWFpbi9TaGFkZXJpdHlPYmplY3RDcmVhdG9yLnRzIiwgIndlYnBhY2s6Ly9zaGFkZXJpdHkvc3JjL21haW4vVXRpbGl0eS50cyIsICJ3ZWJwYWNrOi8vc2hhZGVyaXR5L3dlYnBhY2svYm9vdHN0cmFwIiwgIndlYnBhY2s6Ly9zaGFkZXJpdHkvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsICJ3ZWJwYWNrOi8vc2hhZGVyaXR5L3dlYnBhY2svc3RhcnR1cCIsICJ3ZWJwYWNrOi8vc2hhZGVyaXR5L3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IFNoYWRlcml0eSBmcm9tICcuL21haW4vU2hhZGVyaXR5JztcclxuaW1wb3J0IF9TaGFkZXJpdHlPYmplY3RDcmVhdG9yIGZyb20gJy4vbWFpbi9TaGFkZXJpdHlPYmplY3RDcmVhdG9yJztcclxuaW1wb3J0IF9SZWZsZWN0aW9uIGZyb20gJy4vbWFpbi9SZWZsZWN0aW9uJztcclxuXHJcbmltcG9ydCB7XHJcbiAgQXR0cmlidXRlU2VtYW50aWNzIGFzIF9BdHRyaWJ1dGVTZW1hbnRpY3MsXHJcbiAgUmVmbGVjdGlvbkF0dHJpYnV0ZSBhcyBfUmVmbGVjdGlvbkF0dHJpYnV0ZSxcclxuICBSZWZsZWN0aW9uVW5pZm9ybSBhcyBfUmVmbGVjdGlvblVuaWZvcm0sXHJcbiAgUmVmbGVjdGlvblZhcnlpbmcgYXMgX1JlZmxlY3Rpb25WYXJ5aW5nLFxyXG4gIFNoYWRlcml0eU9iamVjdCBhcyBfU2hhZGVyaXR5T2JqZWN0LFxyXG4gIFNoYWRlckV4dGVuc2lvbkJlaGF2aW9yIGFzIF9TaGFkZXJFeHRlbnNpb25CZWhhdmlvcixcclxuICBTaGFkZXJDb25zdGFudFZhbHVlVmFyVHlwZUVTMyBhcyBfU2hhZGVyQ29uc3RhbnRWYWx1ZVZhclR5cGVFUzMsXHJcbiAgU2hhZGVyUHJlY2lzaW9uT2JqZWN0IGFzIF9TaGFkZXJQcmVjaXNpb25PYmplY3QsXHJcbiAgU2hhZGVyU3RhZ2VTdHIgYXMgX1NoYWRlclN0YWdlU3RyLFxyXG4gIFNoYWRlclByZWNpc2lvblR5cGUgYXMgX1NoYWRlclByZWNpc2lvblR5cGUsXHJcbiAgU2hhZGVyQXR0cmlidXRlVmFyVHlwZSBhcyBfU2hhZGVyQXR0cmlidXRlVmFyVHlwZSxcclxuICBTaGFkZXJWYXJ5aW5nSW50ZXJwb2xhdGlvblR5cGUgYXMgX1NoYWRlclZhcnlpbmdJbnRlcnBvbGF0aW9uVHlwZSxcclxuICBTaGFkZXJWYXJ5aW5nVmFyVHlwZSBhcyBfU2hhZGVyVmFyeWluZ1ZhclR5cGUsXHJcbiAgU2hhZGVyVW5pZm9ybVZhclR5cGVFUzMgYXMgX1NoYWRlclVuaWZvcm1WYXJUeXBlRVMzLFxyXG4gIFNoYWRlclN0cnVjdE1lbWJlck9iamVjdCBhcyBfU2hhZGVyU3RydWN0TWVtYmVyT2JqZWN0LFxyXG4gIFNoYWRlclVCT1ZhcmlhYmxlT2JqZWN0IGFzIF9TaGFkZXJVQk9WYXJpYWJsZU9iamVjdCxcclxuICBTaGFkZXJBdHRyaWJ1dGVPYmplY3QgYXMgX1NoYWRlckF0dHJpYnV0ZU9iamVjdCxcclxuICBTaGFkZXJDb25zdGFudFN0cnVjdFZhbHVlT2JqZWN0IGFzIF9TaGFkZXJDb25zdGFudFN0cnVjdFZhbHVlT2JqZWN0LFxyXG4gIFNoYWRlckNvbnN0YW50VmFsdWVPYmplY3QgYXMgX1NoYWRlckNvbnN0YW50VmFsdWVPYmplY3QsXHJcbiAgU2hhZGVyRXh0ZW5zaW9uT2JqZWN0IGFzIF9TaGFkZXJFeHRlbnNpb25PYmplY3QsXHJcbiAgU2hhZGVyU3RydWN0RGVmaW5pdGlvbk9iamVjdCBhcyBfU2hhZGVyU3RydWN0RGVmaW5pdGlvbk9iamVjdCxcclxuICBTaGFkZXJVbmlmb3JtQnVmZmVyT2JqZWN0IGFzIF9TaGFkZXJVbmlmb3JtQnVmZmVyT2JqZWN0LFxyXG4gIFNoYWRlclVuaWZvcm1PYmplY3QgYXMgX1NoYWRlclVuaWZvcm1PYmplY3QsXHJcbiAgU2hhZGVyVW5pZm9ybVN0cnVjdE9iamVjdCBhcyBfU2hhZGVyVW5pZm9ybVN0cnVjdE9iamVjdCxcclxuICBTaGFkZXJWYXJ5aW5nT2JqZWN0IGFzIF9TaGFkZXJWYXJ5aW5nT2JqZWN0LFxyXG4gIFNoYWRlclZlcnNpb24gYXMgX1NoYWRlclZlcnNpb24sXHJcbiAgVGVtcGxhdGVPYmplY3QgYXMgX1RlbXBsYXRlT2JqZWN0LFxyXG4gIFVuaWZvcm1TZW1hbnRpY3MgYXMgX1VuaWZvcm1TZW1hbnRpY3MsXHJcbiAgVmFyVHlwZSBhcyBfVmFyVHlwZSxcclxufSBmcm9tICcuL3R5cGVzL3R5cGUnO1xyXG5cclxuZXhwb3J0IHtcclxuICBTaGFkZXJpdHlPYmplY3RDcmVhdG9yIGFzIF9TaGFkZXJpdHlPYmplY3RDcmVhdG9yLFxyXG4gIFJlZmxlY3Rpb24gYXMgX1JlZmxlY3Rpb24sXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIEF0dHJpYnV0ZVNlbWFudGljcyA9IF9BdHRyaWJ1dGVTZW1hbnRpY3M7XHJcbmV4cG9ydCB0eXBlIFJlZmxlY3Rpb25BdHRyaWJ1dGUgPSBfUmVmbGVjdGlvbkF0dHJpYnV0ZTtcclxuZXhwb3J0IHR5cGUgUmVmbGVjdGlvblVuaWZvcm0gPSBfUmVmbGVjdGlvblVuaWZvcm07XHJcbmV4cG9ydCB0eXBlIFJlZmxlY3Rpb25WYXJ5aW5nID0gX1JlZmxlY3Rpb25WYXJ5aW5nO1xyXG5leHBvcnQgdHlwZSBTaGFkZXJpdHlPYmplY3QgPSBfU2hhZGVyaXR5T2JqZWN0O1xyXG5leHBvcnQgdHlwZSBTaGFkZXJFeHRlbnNpb25CZWhhdmlvciA9IF9TaGFkZXJFeHRlbnNpb25CZWhhdmlvcjtcclxuZXhwb3J0IHR5cGUgU2hhZGVyQ29uc3RhbnRWYWx1ZVZhclR5cGVFUzMgPSBfU2hhZGVyQ29uc3RhbnRWYWx1ZVZhclR5cGVFUzM7XHJcbmV4cG9ydCB0eXBlIFNoYWRlclByZWNpc2lvbk9iamVjdCA9IF9TaGFkZXJQcmVjaXNpb25PYmplY3Q7XHJcbmV4cG9ydCB0eXBlIFNoYWRlclN0YWdlU3RyID0gX1NoYWRlclN0YWdlU3RyO1xyXG5leHBvcnQgdHlwZSBTaGFkZXJQcmVjaXNpb25UeXBlID0gX1NoYWRlclByZWNpc2lvblR5cGU7XHJcbmV4cG9ydCB0eXBlIFNoYWRlckF0dHJpYnV0ZVZhclR5cGUgPSBfU2hhZGVyQXR0cmlidXRlVmFyVHlwZTtcclxuZXhwb3J0IHR5cGUgU2hhZGVyVmFyeWluZ0ludGVycG9sYXRpb25UeXBlID0gX1NoYWRlclZhcnlpbmdJbnRlcnBvbGF0aW9uVHlwZTtcclxuZXhwb3J0IHR5cGUgU2hhZGVyVmFyeWluZ1ZhclR5cGUgPSBfU2hhZGVyVmFyeWluZ1ZhclR5cGU7XHJcbmV4cG9ydCB0eXBlIFNoYWRlclVuaWZvcm1WYXJUeXBlRVMzID0gX1NoYWRlclVuaWZvcm1WYXJUeXBlRVMzO1xyXG5leHBvcnQgdHlwZSBTaGFkZXJTdHJ1Y3RNZW1iZXJPYmplY3QgPSBfU2hhZGVyU3RydWN0TWVtYmVyT2JqZWN0O1xyXG5leHBvcnQgdHlwZSBTaGFkZXJVQk9WYXJpYWJsZU9iamVjdCA9IF9TaGFkZXJVQk9WYXJpYWJsZU9iamVjdDtcclxuZXhwb3J0IHR5cGUgU2hhZGVyQXR0cmlidXRlT2JqZWN0ID0gX1NoYWRlckF0dHJpYnV0ZU9iamVjdDtcclxuZXhwb3J0IHR5cGUgU2hhZGVyQ29uc3RhbnRTdHJ1Y3RWYWx1ZU9iamVjdCA9IF9TaGFkZXJDb25zdGFudFN0cnVjdFZhbHVlT2JqZWN0O1xyXG5leHBvcnQgdHlwZSBTaGFkZXJDb25zdGFudFZhbHVlT2JqZWN0ID0gX1NoYWRlckNvbnN0YW50VmFsdWVPYmplY3Q7XHJcbmV4cG9ydCB0eXBlIFNoYWRlckV4dGVuc2lvbk9iamVjdCA9IF9TaGFkZXJFeHRlbnNpb25PYmplY3Q7XHJcbmV4cG9ydCB0eXBlIFNoYWRlclN0cnVjdERlZmluaXRpb25PYmplY3QgPSBfU2hhZGVyU3RydWN0RGVmaW5pdGlvbk9iamVjdDtcclxuZXhwb3J0IHR5cGUgU2hhZGVyVW5pZm9ybUJ1ZmZlck9iamVjdCA9IF9TaGFkZXJVbmlmb3JtQnVmZmVyT2JqZWN0O1xyXG5leHBvcnQgdHlwZSBTaGFkZXJVbmlmb3JtT2JqZWN0ID0gX1NoYWRlclVuaWZvcm1PYmplY3Q7XHJcbmV4cG9ydCB0eXBlIFNoYWRlclVuaWZvcm1TdHJ1Y3RPYmplY3QgPSBfU2hhZGVyVW5pZm9ybVN0cnVjdE9iamVjdDtcclxuZXhwb3J0IHR5cGUgU2hhZGVyVmFyeWluZ09iamVjdCA9IF9TaGFkZXJWYXJ5aW5nT2JqZWN0O1xyXG5leHBvcnQgdHlwZSBTaGFkZXJWZXJzaW9uID0gX1NoYWRlclZlcnNpb247XHJcbmV4cG9ydCB0eXBlIFRlbXBsYXRlT2JqZWN0ID0gX1RlbXBsYXRlT2JqZWN0O1xyXG5leHBvcnQgdHlwZSBVbmlmb3JtU2VtYW50aWNzID0gX1VuaWZvcm1TZW1hbnRpY3M7XHJcbmV4cG9ydCB0eXBlIFZhclR5cGUgPSBfVmFyVHlwZTtcclxuZXhwb3J0IHR5cGUgU2hhZGVyaXR5T2JqZWN0Q3JlYXRvciA9IF9TaGFkZXJpdHlPYmplY3RDcmVhdG9yO1xyXG5leHBvcnQgdHlwZSBSZWZsZWN0aW9uID0gX1JlZmxlY3Rpb247XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTaGFkZXJpdHlcclxuIiwgImV4cG9ydCBkZWZhdWx0IGNsYXNzIFByZVByb2Nlc3NvciB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgZGVmaW5pdGlvbnM6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG5cbiAgICBwcml2YXRlIHN0YXRpYyBldmFsdWF0ZUNvbmRpdGlvbihjb25kaXRpb246IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAvLyDmlbDlgKTmr5TovIPjga7mraPopo/ooajnj75cbiAgICAgICAgY29uc3QgbnVtZXJpY0NvbXBhcmlzb24gPSAvKFxcdyspXFxzKig9PXwhPXw+fDx8Pj18PD0pXFxzKihcXGQrKS9nO1xuICAgICAgICAvLyBkZWZpbmVkKCnjg4Hjgqfjg4Pjgq/jga7mraPopo/ooajnj75cbiAgICAgICAgY29uc3QgZGVmaW5lZENoZWNrID0gL2RlZmluZWRcXHMqXFwoXFxzKihcXHcrKVxccypcXCkvZztcbiAgICAgICAgLy8gIWRlZmluZWQoKeODgeOCp+ODg+OCr+OBruato+imj+ihqOePvlxuICAgICAgICBjb25zdCBub3REZWZpbmVkQ2hlY2sgPSAvIVxccypkZWZpbmVkXFxzKlxcKFxccyooXFx3KylcXHMqXFwpL2c7XG5cbiAgICAgICAgLy8g5p2h5Lu25byP44KS6KmV5L6h5Y+v6IO944Gq5b2i5byP44Gr5aSJ5o+bXG4gICAgICAgIGxldCBldmFsdWF0YWJsZUNvbmRpdGlvbiA9IGNvbmRpdGlvbjtcblxuICAgICAgICAvLyBkZWZpbmVkKCnjga7oqZXkvqFcbiAgICAgICAgZXZhbHVhdGFibGVDb25kaXRpb24gPSBldmFsdWF0YWJsZUNvbmRpdGlvbi5yZXBsYWNlKGRlZmluZWRDaGVjaywgKF8sIG5hbWUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlZmluaXRpb25zLmhhcyhuYW1lKSA/ICd0cnVlJyA6ICdmYWxzZSc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vICFkZWZpbmVkKCnjga7oqZXkvqFcbiAgICAgICAgZXZhbHVhdGFibGVDb25kaXRpb24gPSBldmFsdWF0YWJsZUNvbmRpdGlvbi5yZXBsYWNlKG5vdERlZmluZWRDaGVjaywgKF8sIG5hbWUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlZmluaXRpb25zLmhhcyhuYW1lKSA/ICdmYWxzZScgOiAndHJ1ZSc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOaVsOWApOavlOi8g+OBruipleS+oVxuICAgICAgICBldmFsdWF0YWJsZUNvbmRpdGlvbiA9IGV2YWx1YXRhYmxlQ29uZGl0aW9uLnJlcGxhY2UobnVtZXJpY0NvbXBhcmlzb24sIChtYXRjaCwgdmFyTmFtZSwgb3BlcmF0b3IsIHZhbHVlU3RyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkZWZpbmVkVmFsdWUgPSB0aGlzLmRlZmluaXRpb25zLmdldCh2YXJOYW1lKTtcbiAgICAgICAgICAgIGlmIChkZWZpbmVkVmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuICdmYWxzZSc7XG5cbiAgICAgICAgICAgIGNvbnN0IHZhbHVlMSA9IHBhcnNlSW50KGRlZmluZWRWYWx1ZSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZTIgPSBwYXJzZUludCh2YWx1ZVN0cik7XG5cbiAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICBjYXNlICc9PSc6IHJldHVybiB2YWx1ZTEgPT09IHZhbHVlMiA/ICd0cnVlJyA6ICdmYWxzZSc7XG4gICAgICAgICAgICAgICAgY2FzZSAnIT0nOiByZXR1cm4gdmFsdWUxICE9PSB2YWx1ZTIgPyAndHJ1ZScgOiAnZmFsc2UnO1xuICAgICAgICAgICAgICAgIGNhc2UgJz4nOiByZXR1cm4gdmFsdWUxID4gdmFsdWUyID8gJ3RydWUnIDogJ2ZhbHNlJztcbiAgICAgICAgICAgICAgICBjYXNlICc8JzogcmV0dXJuIHZhbHVlMSA8IHZhbHVlMiA/ICd0cnVlJyA6ICdmYWxzZSc7XG4gICAgICAgICAgICAgICAgY2FzZSAnPj0nOiByZXR1cm4gdmFsdWUxID49IHZhbHVlMiA/ICd0cnVlJyA6ICdmYWxzZSc7XG4gICAgICAgICAgICAgICAgY2FzZSAnPD0nOiByZXR1cm4gdmFsdWUxIDw9IHZhbHVlMiA/ICd0cnVlJyA6ICdmYWxzZSc7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuICdmYWxzZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOirlueQhua8lOeul+WtkOOBruipleS+oVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5a6J5YWo44Gq6KmV5L6h44Gu44Gf44KB44CB5p2h5Lu25byP44KS5qSc6Ki8XG4gICAgICAgICAgICBpZiAoIS9eW2EtekEtWjAtOVxcc1xcKFxcKSEmfF0rJC8udGVzdChldmFsdWF0YWJsZUNvbmRpdGlvbikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29uZGl0aW9uJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOirlueQhua8lOeul+WtkOOBruWJjeW+jOOBq+OCueODmuODvOOCueOCkui/veWKoFxuICAgICAgICAgICAgZXZhbHVhdGFibGVDb25kaXRpb24gPSBldmFsdWF0YWJsZUNvbmRpdGlvblxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mJi9nLCAnICYmICcpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcfFxcfC9nLCAnIHx8ICcpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyEvZywgJyAhICcpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgJyAnKVxuICAgICAgICAgICAgICAgIC50cmltKCk7XG5cbiAgICAgICAgICAgIC8vIEphdmFTY3JpcHTjga7oq5bnkIblvI/jgajjgZfjgaboqZXkvqFcbiAgICAgICAgICAgIHJldHVybiBGdW5jdGlvbihgcmV0dXJuICR7ZXZhbHVhdGFibGVDb25kaXRpb259YCkoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGV2YWx1YXRpbmcgY29uZGl0aW9uOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgcHJvY2VzcyhzcGxpdHRlZExpbmVzOiBzdHJpbmdbXSwgcmVtYWluRGVmaW5lOiBib29sZWFuLCBkZWZpbml0aW9uczogc3RyaW5nW10gPSBbXSwgc3RhcnRMaW5lU3RyPzogc3RyaW5nLCBlbmRMaW5lU3RyPzogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgICAgICBjb25zdCBkZWZpbmUgPSAvI2RlZmluZVtcXHQgXSsoXFx3KykoPzpbXFx0IF0rKFxcUyspKT8vO1xuICAgICAgICBjb25zdCBpZmRlZiA9IC8jaWZkZWZbXFx0IF0rKFxcdyspLztcbiAgICAgICAgY29uc3QgaWZuZGVmID0gLyNpZm5kZWZbXFx0IF0rKFxcdyspLztcbiAgICAgICAgY29uc3QgX2lmID0gLyNpZig/Olxccyt8KD89XFwoKSkoLiopLztcbiAgICAgICAgY29uc3QgZWxpZiA9IC8jZWxpZig/Olxccyt8KD89XFwoKSkoLiopLztcbiAgICAgICAgY29uc3QgX2Vsc2UgPSAvI2Vsc2UvO1xuICAgICAgICBjb25zdCBlbmRpZiA9IC8jZW5kaWYvO1xuICAgICAgICBjb25zdCBwcmV2aW91c091dHB1dFN0YXRlczogYm9vbGVhbltdID0gW107XG4gICAgICAgIGxldCBvdXRwdXRGbGcgPSB0cnVlO1xuICAgICAgICBjb25zdCBpZmRlZnM6IHN0cmluZ1tdW10gPSBbXTtcbiAgICAgICAgY29uc3QgaWZkZWZNYXRjaGVkOiBib29sZWFuW10gPSBbXTtcbiAgICAgICAgY29uc3Qgb3V0cHV0TGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgdGhpcy5kZWZpbml0aW9ucy5jbGVhcigpO1xuICAgICAgICBmb3IgKGNvbnN0IGRlZmluaXRpb24gb2YgZGVmaW5pdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbnMuc2V0KGRlZmluaXRpb24sIFwiMVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzdGFydExpbmUgPSAwO1xuICAgICAgICBsZXQgZW5kTGluZSA9IHNwbGl0dGVkTGluZXMubGVuZ3RoO1xuICAgICAgICBpZiAoc3RhcnRMaW5lU3RyKSB7XG4gICAgICAgICAgICBzdGFydExpbmUgPSBzcGxpdHRlZExpbmVzLmZpbmRJbmRleChsaW5lID0+IGxpbmUuaW5jbHVkZXMoc3RhcnRMaW5lU3RyKSk7XG4gICAgICAgICAgICBpZiAoc3RhcnRMaW5lID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzcGxpdHRlZExpbmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChlbmRMaW5lU3RyKSB7XG4gICAgICAgICAgICBlbmRMaW5lID0gc3BsaXR0ZWRMaW5lcy5maW5kSW5kZXgobGluZSA9PiBsaW5lLmluY2x1ZGVzKGVuZExpbmVTdHIpKTtcbiAgICAgICAgICAgIGlmIChlbmRMaW5lID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzcGxpdHRlZExpbmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RhcnRMaW5lOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmUgPSBzcGxpdHRlZExpbmVzW2ldO1xuICAgICAgICAgICAgb3V0cHV0TGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gc3RhcnRMaW5lOyBpIDwgZW5kTGluZTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBsaW5lID0gc3BsaXR0ZWRMaW5lc1tpXTtcbiAgICAgICAgICAgIGxldCBpc1ByYWdtYSA9IGZhbHNlO1xuXG4gICAgICAgICAgICB7IC8vICNkZWZpbmVcbiAgICAgICAgICAgICAgICBjb25zdCByZSA9IGxpbmUubWF0Y2goZGVmaW5lKTtcbiAgICAgICAgICAgICAgICBpZiAocmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0RmxnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBbXywgbmFtZSwgdmFsdWUgPSBcIjFcIl0gPSByZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVmaW5pdGlvbnMuc2V0KG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlbWFpbkRlZmluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNQcmFnbWEgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB7IC8vICNpZmRlZiwgI2lmbmRlZiwgI2lmXG4gICAgICAgICAgICAgICAgY29uc3QgcmVJZmRlZiA9IGxpbmUubWF0Y2goaWZkZWYpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlSWZuZGVmID0gbGluZS5tYXRjaChpZm5kZWYpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlSWYgPSBsaW5lLm1hdGNoKF9pZik7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVJZmRlZiB8fCByZUlmbmRlZiB8fCByZUlmKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3V0cHV0U3RhdGVzLnB1c2gob3V0cHV0RmxnKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNvbmRpdGlvbiA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlSWZkZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbiA9IGBkZWZpbmVkKCR7cmVJZmRlZlsxXX0pYDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZUlmbmRlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uID0gYCFkZWZpbmVkKCR7cmVJZm5kZWZbMV19KWA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVJZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uID0gcmVJZlsxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmZGVmcy5wdXNoKFtjb25kaXRpb25dKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXRGbGcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dEZsZyA9IHRoaXMuZXZhbHVhdGVDb25kaXRpb24oY29uZGl0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmZGVmTWF0Y2hlZC5wdXNoKG91dHB1dEZsZyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZmRlZk1hdGNoZWQucHVzaChmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaXNQcmFnbWEgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgeyAvLyAjZWxpZlxuICAgICAgICAgICAgICAgIGNvbnN0IHJlID0gbGluZS5tYXRjaChlbGlmKTtcbiAgICAgICAgICAgICAgICBpZiAocmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb25kaXRpb24gPSByZVsxXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudElmZGVmcyA9IGlmZGVmc1tpZmRlZnMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAocHJldmlvdXNPdXRwdXRTdGF0ZXNbcHJldmlvdXNPdXRwdXRTdGF0ZXMubGVuZ3RoIC0gMV0gJiYgIWlmZGVmTWF0Y2hlZFtpZmRlZk1hdGNoZWQubGVuZ3RoIC0gMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dEZsZyA9IHRoaXMuZXZhbHVhdGVDb25kaXRpb24oY29uZGl0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXRGbGcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZmRlZk1hdGNoZWRbaWZkZWZNYXRjaGVkLmxlbmd0aCAtIDFdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dEZsZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJZmRlZnMucHVzaChjb25kaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBpc1ByYWdtYSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB7IC8vICNlbHNlXG4gICAgICAgICAgICAgICAgY29uc3QgcmUgPSBsaW5lLm1hdGNoKF9lbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAocmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldmlvdXNPdXRwdXRTdGF0ZXNbcHJldmlvdXNPdXRwdXRTdGF0ZXMubGVuZ3RoIC0gMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dEZsZyA9ICFpZmRlZk1hdGNoZWRbaWZkZWZNYXRjaGVkLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0RmxnID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaXNQcmFnbWEgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgeyAvLyAjZW5kaWZcbiAgICAgICAgICAgICAgICBjb25zdCByZSA9IGxpbmUubWF0Y2goZW5kaWYpO1xuICAgICAgICAgICAgICAgIGlmIChyZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dEZsZyA9IHByZXZpb3VzT3V0cHV0U3RhdGVzW3ByZXZpb3VzT3V0cHV0U3RhdGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBpc1ByYWdtYSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmZGVmcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgaWZkZWZNYXRjaGVkLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c091dHB1dFN0YXRlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvdXRwdXRGbGcgJiYgIWlzUHJhZ21hKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0TGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gZW5kTGluZTsgaSA8IHNwbGl0dGVkTGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmUgPSBzcGxpdHRlZExpbmVzW2ldO1xuICAgICAgICAgICAgb3V0cHV0TGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0TGluZXM7XG4gICAgfVxufVxuXG4iLCAiaW1wb3J0IHtcblx0QXR0cmlidXRlU2VtYW50aWNzLFxuXHRSZWZsZWN0aW9uQXR0cmlidXRlLFxuXHRSZWZsZWN0aW9uVW5pZm9ybSxcblx0UmVmbGVjdGlvblZhcnlpbmcsXG5cdFNoYWRlclN0YWdlU3RyLFxuXHRVbmlmb3JtU2VtYW50aWNzLFxuXHRWYXJUeXBlLFxufSBmcm9tICcuLi90eXBlcy90eXBlJztcblxuLyoqXG4gKiBUaGlzIGNsYXNzIGdldHMgdGhlIGF0dHJpYnV0ZSwgdmFyeWluZywgYW5kIHVuaWZvcm0gaW5mb3JtYXRpb24gZnJvbSB0aGUgY29kZSBwcm9wZXJ0eSBvZiBhIHNoYWRlcml0eSBvYmplY3QuXG4gKiBUaGUgbWV0aG9kcyBvZiB0aGUgU2hhZGVyaXR5IGluc3RhbmNlIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzLlxuICpcbiAqIEJlZm9yZSBnZXR0aW5nIHRoZSBpbmZvcm1hdGlvbiBvZiB0aGUgYXR0cmlidXRlLCB2YXJ5aW5nLCBhbmQgdW5pZm9ybSwgeW91IG5lZWQgdG8gY2FsbCB0aGUgcmVmbGVjdCBtZXRob2Qgb2YgdGhpcyBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVmbGVjdGlvbiB7XG5cdHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IGF0dHJpYnV0ZUFuZFZhcnlpbmdUeXBlUmVnRXhwXG5cdFx0PSAvW1xcdCBdKyhmbG9hdHxpbnR8dWludHx2ZWMyfHZlYzN8dmVjNHxtYXQyfG1hdDN8bWF0NHxpdmVjMnxpdmVjM3xpdmVjNHx1dmVjMnx1dmVjM3x1dmVjNClbXFx0IF0rKFxcdyspOy87XG5cdHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IHVuaWZvcm1UeXBlUmVnRXhwXG5cdFx0PSAvW1xcdCBdKyhmbG9hdHxpbnR8dWludHx2ZWMyfHZlYzN8dmVjNHxtYXQyfG1hdDN8bWF0NHxpdmVjMnxpdmVjM3xpdmVjNHx1dmVjMnx1dmVjM3x1dmVjNHxzYW1wbGVyMkR8c2FtcGxlckN1YmV8c2FtcGxlcjNEKVtcXHQgXSsoXFx3Kyk7Lztcblx0cHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgc2VtYW50aWNSZWdFeHAgPSAvPC4qc2VtYW50aWNbXFx0IF0qPVtcXHQgXSooXFx3KykuKj4vO1xuXG5cdHByaXZhdGUgX19hdHRyaWJ1dGVTZW1hbnRpY3NNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXHRwcml2YXRlIF9fdW5pZm9ybVNlbWFudGljc01hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cdHByaXZhdGUgX19hdHRyaWJ1dGVzOiBSZWZsZWN0aW9uQXR0cmlidXRlW10gPSBbXTtcblx0cHJpdmF0ZSBfX3ZhcnlpbmdzOiBSZWZsZWN0aW9uVmFyeWluZ1tdID0gW107XG5cdHByaXZhdGUgX191bmlmb3JtczogUmVmbGVjdGlvblVuaWZvcm1bXSA9IFtdO1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgX19zcGxpdHRlZFNoYWRlckNvZGU6IHN0cmluZ1tdO1xuXHRwcml2YXRlIHJlYWRvbmx5IF9fc2hhZGVyU3RhZ2U6IFNoYWRlclN0YWdlU3RyO1xuXG5cdGNvbnN0cnVjdG9yKHNwbGl0dGVkU2hhZGVyaXR5U2hhZGVyQ29kZTogc3RyaW5nW10sIHNoYWRlclN0YWdlOiBTaGFkZXJTdGFnZVN0cikge1xuXHRcdHRoaXMuX19zcGxpdHRlZFNoYWRlckNvZGUgPSBzcGxpdHRlZFNoYWRlcml0eVNoYWRlckNvZGU7XG5cdFx0dGhpcy5fX3NoYWRlclN0YWdlID0gc2hhZGVyU3RhZ2U7XG5cdFx0dGhpcy5fX3NldERlZmF1bHRBdHRyaWJ1dGVBbmRVbmlmb3JtU2VtYW50aWNzTWFwKCk7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyBhbGwgYXR0cmlidXRlIHZhcmlhYmxlIGluZm9ybWF0aW9uIGluIHRoZSBzaGFkZXIgY29kZS5cblx0ICogQmVmb3JlIGNhbGxpbmcgdGhpcyBtZXRob2QsIHlvdSBuZWVkIHRvIGNhbGwgdGhlIHJlZmxlY3QgbWV0aG9kIG9mIHRoaXMgaW5zdGFuY2UuXG5cdCAqIEByZXR1cm5zIEFycmF5IG9mIFJlZmxlY3Rpb25BdHRyaWJ1dGUgb2JqZWN0XG5cdCAqL1xuXHRwdWJsaWMgZ2V0IGF0dHJpYnV0ZXMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX19hdHRyaWJ1dGVzO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldHMgYWxsIHZhcnlpbmcgdmFyaWFibGUgaW5mb3JtYXRpb24gaW4gdGhlIHNoYWRlciBjb2RlLlxuXHQgKiBCZWZvcmUgY2FsbGluZyB0aGlzIG1ldGhvZCwgeW91IG5lZWQgdG8gY2FsbCB0aGUgcmVmbGVjdCBtZXRob2Qgb2YgdGhpcyBpbnN0YW5jZS5cblx0ICogQHJldHVybnMgQXJyYXkgb2YgUmVmbGVjdGlvblZhcnlpbmcgb2JqZWN0XG5cdCAqL1xuXHRwdWJsaWMgZ2V0IHZhcnlpbmdzKCkge1xuXHRcdHJldHVybiB0aGlzLl9fdmFyeWluZ3M7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyBhbGwgdW5pZm9ybSB2YXJpYWJsZSBpbmZvcm1hdGlvbiBpbiB0aGUgc2hhZGVyIGNvZGUuXG5cdCAqIEJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kLCB5b3UgbmVlZCB0byBjYWxsIHRoZSByZWZsZWN0IG1ldGhvZCBvZiB0aGlzIGluc3RhbmNlLlxuXHQgKiBAcmV0dXJucyBBcnJheSBvZiBSZWZsZWN0aW9uVW5pZm9ybSBvYmplY3Rcblx0ICovXG5cdHB1YmxpYyBnZXQgdW5pZm9ybXMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX191bmlmb3Jtcztcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgdGhlIG5hbWVzIG9mIGFsbCBhdHRyaWJ1dGVzIGluY2x1ZGVkIGluIHRoZSBzaGFkZXIuXG5cdCAqIEJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kLCB5b3UgbmVlZCB0byBjYWxsIHRoZSByZWZsZWN0IG1ldGhvZCBvZiB0aGlzIGluc3RhbmNlLlxuXHQgKiBAcmV0dXJucyBBcnJheSBvZiBzdHJpbmdcblx0ICovXG5cdHB1YmxpYyBnZXQgYXR0cmlidXRlc05hbWVzKCkge1xuXHRcdHJldHVybiB0aGlzLl9fYXR0cmlidXRlcy5tYXAoKGF0dHJpYnV0ZSkgPT4ge3JldHVybiBhdHRyaWJ1dGUubmFtZX0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB0aGUgYXR0cmlidXRlIHNlbWFudGljIChlLmcuICdQT1NJVElPTicpIG9mIGFsbCBhdHRyaWJ1dGVzIGluY2x1ZGVkIGluIHRoZSBzaGFkZXIuXG5cdCAqIEJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kLCB5b3UgbmVlZCB0byBjYWxsIHRoZSByZWZsZWN0IG1ldGhvZCBvZiB0aGlzIGluc3RhbmNlLlxuXHQgKiBAcmV0dXJucyBBcnJheSBvZiBBdHRyaWJ1dGVTZW1hbnRpY3Mgb2JqZWN0XG5cdCAqL1xuXHRwdWJsaWMgZ2V0IGF0dHJpYnV0ZXNTZW1hbnRpY3MoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX19hdHRyaWJ1dGVzLm1hcCgoYXR0cmlidXRlKSA9PiB7cmV0dXJuIGF0dHJpYnV0ZS5zZW1hbnRpY30pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB0aGUgdmFyaWFibGUgdHlwZSAoZS5nLiAndmVjNCcpIG9mIGFsbCBhdHRyaWJ1dGVzIGluY2x1ZGVkIGluIHRoZSBzaGFkZXIuXG5cdCAqIEJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kLCB5b3UgbmVlZCB0byBjYWxsIHRoZSByZWZsZWN0IG1ldGhvZCBvZiB0aGlzIGluc3RhbmNlLlxuXHQgKiBAcmV0dXJucyBBcnJheSBvZiBWYXJUeXBlIG9iamVjdFxuXHQgKi9cblx0cHVibGljIGdldCBhdHRyaWJ1dGVzVHlwZXMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX19hdHRyaWJ1dGVzLm1hcCgoYXR0cmlidXRlKSA9PiB7cmV0dXJuIGF0dHJpYnV0ZS50eXBlfSk7XG5cdH1cblxuXHQvKipcblx0ICogQWRkIGFuIGF0dHJpYnV0ZVNlbWFudGljcy5cblx0ICogVGhlIGF0dHJpYnV0ZVNlbWFudGljcyBpcyB1c2VkIGluIHRoZSBSZWZsZWN0aW9uQXR0cmlidXRlLnNlbWFudGljc1xuXHQgKiAoU2VlIHJlZmxlY3QgbWV0aG9kIG9mIHRoaXMgY2xhc3MpXG5cdCAqL1xuXHRwdWJsaWMgYWRkQXR0cmlidXRlU2VtYW50aWNzTWFwKG1hcDogTWFwPHN0cmluZywgc3RyaW5nPikge1xuXHRcdHRoaXMuX19hdHRyaWJ1dGVTZW1hbnRpY3NNYXAgPSBuZXcgTWFwKFsuLi50aGlzLl9fYXR0cmlidXRlU2VtYW50aWNzTWFwLCAuLi5tYXBdKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBZGQgYSB1bmlmb3JtU2VtYW50aWNzLlxuXHQgKiBUaGUgYXR0cmlidXRlU2VtYW50aWNzIGlzIHVzZWQgaW4gdGhlIFJlZmxlY3Rpb25BdHRyaWJ1dGUuc2VtYW50aWNzXG5cdCAqIChTZWUgcmVmbGVjdCBtZXRob2Qgb2YgdGhpcyBjbGFzcylcblx0ICovXG5cdHB1YmxpYyBhZGRVbmlmb3JtU2VtYW50aWNzTWFwKG1hcDogTWFwPHN0cmluZywgc3RyaW5nPikge1xuXHRcdHRoaXMuX191bmlmb3JtU2VtYW50aWNzTWFwID0gbmV3IE1hcChbLi4udGhpcy5fX3VuaWZvcm1TZW1hbnRpY3NNYXAsIC4uLm1hcF0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBhbiBhdHRyaWJ1dGVTZW1hbnRpY3MuXG5cdCAqIFRoZSBhdHRyaWJ1dGVTZW1hbnRpY3MgaXMgdXNlZCBpbiB0aGUgUmVmbGVjdGlvbkF0dHJpYnV0ZS5zZW1hbnRpY3Ncblx0ICogKFNlZSByZWZsZWN0IG1ldGhvZCBvZiB0aGlzIGNsYXNzKVxuXHQgKi9cblx0cHVibGljIGFkZEF0dHJpYnV0ZVNlbWFudGljcyhrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuXHRcdHRoaXMuX19hdHRyaWJ1dGVTZW1hbnRpY3NNYXAuc2V0KGtleSwgdmFsdWUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBhIHVuaWZvcm1TZW1hbnRpY3MuXG5cdCAqIFRoZSBhdHRyaWJ1dGVTZW1hbnRpY3MgaXMgdXNlZCBpbiB0aGUgUmVmbGVjdGlvbkF0dHJpYnV0ZS5zZW1hbnRpY3Ncblx0ICogKFNlZSByZWZsZWN0IG1ldGhvZCBvZiB0aGlzIGNsYXNzKVxuXHQgKi9cblx0cHVibGljIGFkZFVuaWZvcm1TZW1hbnRpY3Moa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcblx0XHR0aGlzLl9fdW5pZm9ybVNlbWFudGljc01hcC5zZXQoa2V5LCB2YWx1ZSk7XG5cdH1cblxuXHQvKipcblx0ICogSW5pdGlhbGl6ZSBhdHRyaWJ1dGVTZW1hbnRpY3Ncblx0ICovXG5cdHB1YmxpYyByZXNldEF0dHJpYnV0ZVNlbWFudGljcygpIHtcblx0XHR0aGlzLl9fYXR0cmlidXRlU2VtYW50aWNzTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXplIHVuaWZvcm1TZW1hbnRpY3Ncblx0ICovXG5cdHB1YmxpYyByZXNldFVuaWZvcm1TZW1hbnRpY3MoKSB7XG5cdFx0dGhpcy5fX3VuaWZvcm1TZW1hbnRpY3NNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFuYWx5emUgc2hhZGVyIGNvZGUgb2YgdGhlIHNoYWRlcml0eSBhbmQgZ2V0IGluZm9ybWF0aW9uIG9mIGF0dHJpYnV0ZSwgdmFyeWluZyBhbmQgdW5pZm9ybS5cblx0ICogVGhlIGluZm9ybWF0aW9uIGNhbiBiZSByZXRyaWV2ZWQgZnJvbSB0aGUgZ2V0IG1ldGhvZCBvZiB0aGlzIGluc3RhbmNlLlxuXHQgKlxuXHQgKiBUaGUgc2VtYW50aWMgcHJvcGVydHkgb2YgdGhlIFJlZmxlY3Rpb25BdHRyaWJ1dGUgaXMgYXNzaWduZWQgdG8gdGhlIHZhbHVlIG9mIHRoZSBzZW1hbnRpYyBpZlxuXHQgKiBpdCBpcyBzcGVjaWZpZWQgaW4gdGhlIGF0dHJpYnV0ZSBsaW5lIG9mIHRoZSBzaGFkZXIgY29kZS4gSWYgbm90LCB0aGUgQXR0cmlidXRlU2VtYW50aWNzTWFwXG5cdCAqIGlzIHNlYXJjaGVkIGZvciBtYXRjaGluZyBzZW1hbnRpY3MsIG9yIFVOS05PV04uIFRoZSBzYW1lIGFwcGxpZXMgdG8gdGhlIHNlbWFudGljIHByb3BlcnR5IG9mXG5cdCAqIFJlZmxlY3Rpb25Vbmlmb3JtLlxuXHQgKi9cblx0cHVibGljIHJlZmxlY3QoKSB7XG5cdFx0Y29uc3Qgc3BsaXR0ZWRTaGFkZXJDb2RlID0gdGhpcy5fX3NwbGl0dGVkU2hhZGVyQ29kZTtcblx0XHRjb25zdCBzaGFkZXJTdGFnZSA9IHRoaXMuX19zaGFkZXJTdGFnZTtcblxuXHRcdGZvciAoY29uc3Qgc2hhZGVyQ29kZUxpbmUgb2Ygc3BsaXR0ZWRTaGFkZXJDb2RlKSB7XG5cdFx0XHRjb25zdCBpc0F0dHJpYnV0ZUxpbmUgPSB0aGlzLl9fbWF0Y2hBdHRyaWJ1dGUoc2hhZGVyQ29kZUxpbmUsIHNoYWRlclN0YWdlKTtcblx0XHRcdGlmIChpc0F0dHJpYnV0ZUxpbmUpIHtcblx0XHRcdFx0dGhpcy5fX2FkZEF0dHJpYnV0ZShzaGFkZXJDb2RlTGluZSk7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBpc1ZhcnlpbmdMaW5lID0gdGhpcy5fX21hdGNoVmFyeWluZyhzaGFkZXJDb2RlTGluZSwgc2hhZGVyU3RhZ2UpO1xuXHRcdFx0aWYgKGlzVmFyeWluZ0xpbmUpIHtcblx0XHRcdFx0dGhpcy5fX2FkZFZhcnlpbmcoc2hhZGVyQ29kZUxpbmUsIHNoYWRlclN0YWdlKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGlzVW5pZm9ybUxpbmUgPSBzaGFkZXJDb2RlTGluZS5tYXRjaCgvXig/IVtcXC9dKVtcXHQgXSp1bmlmb3JtW1xcdCBdKy8pO1xuXHRcdFx0aWYgKGlzVW5pZm9ybUxpbmUpIHtcblx0XHRcdFx0dGhpcy5fX2FkZFVuaWZvcm0oc2hhZGVyQ29kZUxpbmUpO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIF9fc2V0RGVmYXVsdEF0dHJpYnV0ZUFuZFVuaWZvcm1TZW1hbnRpY3NNYXAoKSB7XG5cdFx0dGhpcy5fX2F0dHJpYnV0ZVNlbWFudGljc01hcC5zZXQoJ3Bvc2l0aW9uJywgJ1BPU0lUSU9OJyk7XG5cdFx0dGhpcy5fX2F0dHJpYnV0ZVNlbWFudGljc01hcC5zZXQoJ2NvbG9yJCcsICdDT0xPUl8wJyk7XG5cdFx0dGhpcy5fX2F0dHJpYnV0ZVNlbWFudGljc01hcC5zZXQoJ2NvbG9yXz8wJywgJ0NPTE9SXzAnKTtcblx0XHR0aGlzLl9fYXR0cmlidXRlU2VtYW50aWNzTWFwLnNldCgndGV4Y29vcmQkJywgJ1RFWENPT1JEXzAnKTtcblx0XHR0aGlzLl9fYXR0cmlidXRlU2VtYW50aWNzTWFwLnNldCgndGV4Y29vcmRfPzAnLCAnVEVYQ09PUkRfMCcpO1xuXHRcdHRoaXMuX19hdHRyaWJ1dGVTZW1hbnRpY3NNYXAuc2V0KCd0ZXhjb29yZF8/MScsICdURVhDT09SRF8xJyk7XG5cdFx0dGhpcy5fX2F0dHJpYnV0ZVNlbWFudGljc01hcC5zZXQoJ3RleGNvb3JkXz8yJywgJ1RFWENPT1JEXzInKTtcblx0XHR0aGlzLl9fYXR0cmlidXRlU2VtYW50aWNzTWFwLnNldCgnbm9ybWFsJywgJ05PUk1BTCcpO1xuXHRcdHRoaXMuX19hdHRyaWJ1dGVTZW1hbnRpY3NNYXAuc2V0KCd0YW5nZW50JywgJ1RBTkdFTlQnKTtcblx0XHR0aGlzLl9fYXR0cmlidXRlU2VtYW50aWNzTWFwLnNldCgnam9pbnQkJywgJ0pPSU5UU18wJyk7XG5cdFx0dGhpcy5fX2F0dHJpYnV0ZVNlbWFudGljc01hcC5zZXQoJ2JvbmUkJywgJ0pPSU5UU18wJyk7XG5cdFx0dGhpcy5fX2F0dHJpYnV0ZVNlbWFudGljc01hcC5zZXQoJ2pvaW50Xz8wJywgJ0pPSU5UU18wJyk7XG5cdFx0dGhpcy5fX2F0dHJpYnV0ZVNlbWFudGljc01hcC5zZXQoJ2JvbmVfPzAnLCAnSk9JTlRTXzAnKTtcblx0XHR0aGlzLl9fYXR0cmlidXRlU2VtYW50aWNzTWFwLnNldCgnd2VpZ2h0JCcsICdXRUlHSFRTXzAnKTtcblx0XHR0aGlzLl9fYXR0cmlidXRlU2VtYW50aWNzTWFwLnNldCgnd2VpZ2h0Xz8wJywgJ1dFSUdIVFNfMCcpO1xuXG5cdFx0dGhpcy5fX3VuaWZvcm1TZW1hbnRpY3NNYXAuc2V0KCd3b3JsZG1hdHJpeCcsICdXb3JsZE1hdHJpeCcpO1xuXHRcdHRoaXMuX191bmlmb3JtU2VtYW50aWNzTWFwLnNldCgnbm9ybWFsbWF0cml4JywgJ05vcm1hbE1hdHJpeCcpO1xuXHRcdHRoaXMuX191bmlmb3JtU2VtYW50aWNzTWFwLnNldCgndmlld21hdHJpeCcsICdWaWV3TWF0cml4Jyk7XG5cdFx0dGhpcy5fX3VuaWZvcm1TZW1hbnRpY3NNYXAuc2V0KCdwcm9qZWN0aW9ubWF0cml4JywgJ1Byb2plY3Rpb25NYXRyaXgnKTtcblx0XHR0aGlzLl9fdW5pZm9ybVNlbWFudGljc01hcC5zZXQoJ21vZGVsdmlld21hdHJpeCcsICdNb2RlbFZpZXdNYXRyaXgnKTtcblx0fVxuXG5cdHByaXZhdGUgX19tYXRjaEF0dHJpYnV0ZShzaGFkZXJDb2RlTGluZTogc3RyaW5nLCBzaGFkZXJTdGFnZTogU2hhZGVyU3RhZ2VTdHIpIHtcblx0XHRpZiAoc2hhZGVyU3RhZ2UgIT09ICd2ZXJ0ZXgnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiBzaGFkZXJDb2RlTGluZS5tYXRjaCgvXig/IVtcXC9dKVtcXHQgXSooYXR0cmlidXRlfGluKVtcXHQgXSsuKzsvKTtcblx0fVxuXG5cdHByaXZhdGUgX19hZGRBdHRyaWJ1dGUoc2hhZGVyQ29kZUxpbmU6IHN0cmluZykge1xuXHRcdGNvbnN0IHJlZmxlY3Rpb25BdHRyaWJ1dGU6IFJlZmxlY3Rpb25BdHRyaWJ1dGUgPSB7XG5cdFx0XHRuYW1lOiAnJyxcblx0XHRcdHR5cGU6ICdmbG9hdCcsXG5cdFx0XHRzZW1hbnRpYzogJ1VOS05PV04nXG5cdFx0fTtcblxuXHRcdGNvbnN0IG1hdGNoVHlwZSA9IHNoYWRlckNvZGVMaW5lLm1hdGNoKFJlZmxlY3Rpb24uYXR0cmlidXRlQW5kVmFyeWluZ1R5cGVSZWdFeHApO1xuXHRcdGlmIChtYXRjaFR5cGUpIHtcblx0XHRcdGNvbnN0IHR5cGUgPSBtYXRjaFR5cGVbMV07XG5cdFx0XHRyZWZsZWN0aW9uQXR0cmlidXRlLnR5cGUgPSB0eXBlIGFzIFZhclR5cGU7XG5cdFx0XHRjb25zdCBuYW1lID0gbWF0Y2hUeXBlWzJdO1xuXHRcdFx0cmVmbGVjdGlvbkF0dHJpYnV0ZS5uYW1lID0gbmFtZTtcblxuXHRcdFx0Y29uc3QgbWF0Y2hTZW1hbnRpYyA9IHNoYWRlckNvZGVMaW5lLm1hdGNoKFJlZmxlY3Rpb24uc2VtYW50aWNSZWdFeHApXG5cdFx0XHRpZiAobWF0Y2hTZW1hbnRpYykge1xuXHRcdFx0XHRyZWZsZWN0aW9uQXR0cmlidXRlLnNlbWFudGljID0gbWF0Y2hTZW1hbnRpY1sxXSBhcyBBdHRyaWJ1dGVTZW1hbnRpY3M7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5fX2F0dHJpYnV0ZVNlbWFudGljc01hcCkge1xuXHRcdFx0XHRcdGlmIChuYW1lLm1hdGNoKG5ldyBSZWdFeHAoa2V5LCAnaScpKSkge1xuXHRcdFx0XHRcdFx0cmVmbGVjdGlvbkF0dHJpYnV0ZS5zZW1hbnRpYyA9IHZhbHVlIGFzIEF0dHJpYnV0ZVNlbWFudGljcztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5fX2F0dHJpYnV0ZXMucHVzaChyZWZsZWN0aW9uQXR0cmlidXRlKTtcblx0fVxuXG5cdHByaXZhdGUgX19tYXRjaFZhcnlpbmcoc2hhZGVyQ29kZUxpbmU6IHN0cmluZywgc2hhZGVyU3RhZ2U6IFNoYWRlclN0YWdlU3RyKSB7XG5cdFx0aWYgKHNoYWRlclN0YWdlID09PSAndmVydGV4Jykge1xuXHRcdFx0cmV0dXJuIHNoYWRlckNvZGVMaW5lLm1hdGNoKC9eKD8hW1xcL10pW1xcdCBdKih2YXJ5aW5nfG91dClbXFx0IF0rLis7Lyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBzaGFkZXJDb2RlTGluZS5tYXRjaCgvXig/IVtcXC9dKVtcXHQgXSoodmFyeWluZ3xpbilbXFx0IF0rLis7Lyk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBfX2FkZFZhcnlpbmcoc2hhZGVyQ29kZUxpbmU6IHN0cmluZywgc2hhZGVyU3RhZ2U6IFNoYWRlclN0YWdlU3RyKSB7XG5cdFx0Y29uc3QgcmVmbGVjdGlvblZhcnlpbmc6IFJlZmxlY3Rpb25WYXJ5aW5nID0ge1xuXHRcdFx0bmFtZTogJycsXG5cdFx0XHR0eXBlOiAnZmxvYXQnLFxuXHRcdFx0aW5vdXQ6ICdpbidcblx0XHR9O1xuXG5cdFx0Y29uc3QgbWF0Y2hUeXBlID0gc2hhZGVyQ29kZUxpbmUubWF0Y2goUmVmbGVjdGlvbi5hdHRyaWJ1dGVBbmRWYXJ5aW5nVHlwZVJlZ0V4cCk7XG5cdFx0aWYgKG1hdGNoVHlwZSkge1xuXHRcdFx0Y29uc3QgdHlwZSA9IG1hdGNoVHlwZVsxXTtcblx0XHRcdHJlZmxlY3Rpb25WYXJ5aW5nLnR5cGUgPSB0eXBlIGFzIFZhclR5cGU7XG5cdFx0XHRjb25zdCBuYW1lID0gbWF0Y2hUeXBlWzJdO1xuXHRcdFx0cmVmbGVjdGlvblZhcnlpbmcubmFtZSA9IG5hbWU7XG5cdFx0XHRyZWZsZWN0aW9uVmFyeWluZy5pbm91dCA9IChzaGFkZXJTdGFnZSA9PT0gJ3ZlcnRleCcpID8gJ291dCcgOiAnaW4nO1xuXHRcdH1cblx0XHR0aGlzLl9fdmFyeWluZ3MucHVzaChyZWZsZWN0aW9uVmFyeWluZyk7XG5cdH1cblxuXHRwcml2YXRlIF9fYWRkVW5pZm9ybShzaGFkZXJDb2RlTGluZTogc3RyaW5nKSB7XG5cdFx0Y29uc3QgcmVmbGVjdGlvblVuaWZvcm06IFJlZmxlY3Rpb25Vbmlmb3JtID0ge1xuXHRcdFx0bmFtZTogJycsXG5cdFx0XHR0eXBlOiAnZmxvYXQnLFxuXHRcdFx0c2VtYW50aWM6ICdVTktOT1dOJ1xuXHRcdH07XG5cblx0XHRjb25zdCBtYXRjaFR5cGUgPSBzaGFkZXJDb2RlTGluZS5tYXRjaChSZWZsZWN0aW9uLnVuaWZvcm1UeXBlUmVnRXhwKTtcblx0XHRpZiAobWF0Y2hUeXBlKSB7XG5cdFx0XHRjb25zdCB0eXBlID0gbWF0Y2hUeXBlWzFdO1xuXHRcdFx0cmVmbGVjdGlvblVuaWZvcm0udHlwZSA9IHR5cGUgYXMgVmFyVHlwZTtcblx0XHRcdGNvbnN0IG5hbWUgPSBtYXRjaFR5cGVbMl07XG5cdFx0XHRyZWZsZWN0aW9uVW5pZm9ybS5uYW1lID0gbmFtZTtcblxuXHRcdFx0Y29uc3QgbWF0Y2hTZW1hbnRpY3MgPSBzaGFkZXJDb2RlTGluZS5tYXRjaChSZWZsZWN0aW9uLnNlbWFudGljUmVnRXhwKVxuXHRcdFx0aWYgKG1hdGNoU2VtYW50aWNzKSB7XG5cdFx0XHRcdHJlZmxlY3Rpb25Vbmlmb3JtLnNlbWFudGljID0gbWF0Y2hTZW1hbnRpY3NbMV0gYXMgVW5pZm9ybVNlbWFudGljcztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiB0aGlzLl9fdW5pZm9ybVNlbWFudGljc01hcCkge1xuXHRcdFx0XHRcdGlmIChuYW1lLm1hdGNoKG5ldyBSZWdFeHAoa2V5LCAnaScpKSkge1xuXHRcdFx0XHRcdFx0cmVmbGVjdGlvblVuaWZvcm0uc2VtYW50aWMgPSB2YWx1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5fX3VuaWZvcm1zLnB1c2gocmVmbGVjdGlvblVuaWZvcm0pO1xuXHR9XG59OyIsICJpbXBvcnQge1RlbXBsYXRlT2JqZWN0fSBmcm9tICcuLi90eXBlcy90eXBlJztcblxuLyoqXG4gKiBUaGlzIGNsYXNzIGVkaXRzIHRoZSBjb2RlIHByb3BlcnR5IG9mIGEgc2hhZGVyaXR5IG9iamVjdC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2hhZGVyRWRpdG9yIHtcblx0c3RhdGljIF9pbnNlcnREZWZpbml0aW9uKHNwbGl0dGVkU2hhZGVyQ29kZTogc3RyaW5nW10sIGRlZmluaXRpb246IHN0cmluZykge1xuXHRcdGNvbnN0IGRlZlN0ciA9IGRlZmluaXRpb24ucmVwbGFjZSgvI2RlZmluZVtcXHQgXSsvLCAnJyk7XG5cblx0XHRzcGxpdHRlZFNoYWRlckNvZGUudW5zaGlmdChgI2RlZmluZSAke2RlZlN0cn1gKTtcblx0fVxuXG5cdHN0YXRpYyBfZmlsbFRlbXBsYXRlKHNoYWRlckNvZGU6IHN0cmluZywgdGVtcGxhdGVPYmplY3Q6IFRlbXBsYXRlT2JqZWN0KSB7XG5cdFx0Y29uc3QgdGVtcGxhdGVTdHJpbmcgPSBzaGFkZXJDb2RlLnJlcGxhY2UoL1xcL1xcKltcXHQgXSpzaGFkZXJpdHk6W1xcdCBdKihAe1tcXHQgXSopKFxcUyspKFtcXHQgXSp9KVtcXHQgXSpcXCpcXC8vZywgJyR7dGhpcy4kMn0nKTtcblxuXHRcdGNvbnN0IHJlc3VsdENvZGUgPSBuZXcgRnVuY3Rpb24oXCJyZXR1cm4gYFwiICsgdGVtcGxhdGVTdHJpbmcgKyBcImA7XCIpLmNhbGwodGVtcGxhdGVPYmplY3QpO1xuXHRcdHJldHVybiByZXN1bHRDb2RlO1xuXHR9XG59IiwgImltcG9ydCB7U2hhZGVyVmVyc2lvbn0gZnJvbSAnLi4vdHlwZXMvdHlwZSc7XG5cbi8qKlxuICogVGhpcyBjbGFzcyBjb252ZXJ0cyB0aGUgY29kZSBwcm9wZXJ0eSBvZiBhIHNoYWRlcml0eSBvYmplY3QgdG8gdGhlIHNwZWNpZmllZCBmb3JtYXQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNoYWRlclRyYW5zZm9ybWVyIHtcblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIFRyYW5zbGF0ZSBhIEdMU0wgRVMzIHNoYWRlciBjb2RlIHRvIGEgR0xTTCBFUzEgc2hhZGVyIGNvZGVcblx0ICovXG5cdHN0YXRpYyBfdHJhbnNmb3JtVG9HTFNMRVMxKFxuXHRcdHNwbGl0dGVkU2hhZGVyQ29kZTogc3RyaW5nW10sXG5cdFx0aXNGcmFnbWVudFNoYWRlcjogYm9vbGVhbixcblx0XHRlbWJlZEVycm9yc0luT3V0cHV0OiBib29sZWFuXG5cdCkge1xuXHRcdHRoaXMuX19jb252ZXJ0T3JJbnNlcnRWZXJzaW9uR0xTTEVTMShzcGxpdHRlZFNoYWRlckNvZGUpO1xuXHRcdHRoaXMuX19yZW1vdmVFUzNRdWFsaWZpZXIoc3BsaXR0ZWRTaGFkZXJDb2RlLCBlbWJlZEVycm9yc0luT3V0cHV0KTtcblx0XHR0aGlzLl9fY29udmVydEluKHNwbGl0dGVkU2hhZGVyQ29kZSwgaXNGcmFnbWVudFNoYWRlcik7XG5cdFx0dGhpcy5fX2NvbnZlcnRPdXQoc3BsaXR0ZWRTaGFkZXJDb2RlLCBpc0ZyYWdtZW50U2hhZGVyLCBlbWJlZEVycm9yc0luT3V0cHV0KTtcblx0XHR0aGlzLl9fcmVtb3ZlUHJlY2lzaW9uRm9yRVMzKHNwbGl0dGVkU2hhZGVyQ29kZSk7XG5cdFx0dGhpcy5fX2NvbnZlcnRUZXh0dXJlRnVuY3Rpb25Ub0VTMShzcGxpdHRlZFNoYWRlckNvZGUsIGlzRnJhZ21lbnRTaGFkZXIsIGVtYmVkRXJyb3JzSW5PdXRwdXQpO1xuXHRcdGNvbnN0IHRyYW5zZm9ybWVkU3BsaXR0ZWRTaGFkZXJDb2RlID0gc3BsaXR0ZWRTaGFkZXJDb2RlO1xuXG5cdFx0cmV0dXJuIHRyYW5zZm9ybWVkU3BsaXR0ZWRTaGFkZXJDb2RlO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIFRyYW5zbGF0ZSBhIEdMU0wgRVMxIHNoYWRlciBjb2RlIHRvIGEgR0xTTCBFUzMgc2hhZGVyIGNvZGVcblx0ICovXG5cdHN0YXRpYyBfdHJhbnNmb3JtVG9HTFNMRVMzKHNwbGl0dGVkU2hhZGVyQ29kZTogc3RyaW5nW10sIGlzRnJhZ21lbnRTaGFkZXI6IGJvb2xlYW4pIHtcblx0XHR0aGlzLl9fY29udmVydE9ySW5zZXJ0VmVyc2lvbkdMU0xFUzMoc3BsaXR0ZWRTaGFkZXJDb2RlKTtcblx0XHR0aGlzLl9fY29udmVydEF0dHJpYnV0ZShzcGxpdHRlZFNoYWRlckNvZGUsIGlzRnJhZ21lbnRTaGFkZXIpO1xuXHRcdHRoaXMuX19jb252ZXJ0VmFyeWluZyhzcGxpdHRlZFNoYWRlckNvZGUsIGlzRnJhZ21lbnRTaGFkZXIpO1xuXHRcdHRoaXMuX19jb252ZXJ0VGV4dHVyZUN1YmUoc3BsaXR0ZWRTaGFkZXJDb2RlKTtcblx0XHR0aGlzLl9fY29udmVydFRleHR1cmUyRChzcGxpdHRlZFNoYWRlckNvZGUpO1xuXHRcdHRoaXMuX19jb252ZXJ0VGV4dHVyZTJEUHJvZChzcGxpdHRlZFNoYWRlckNvZGUpO1xuXHRcdHRoaXMuX19jb252ZXJ0VGV4dHVyZTNEKHNwbGl0dGVkU2hhZGVyQ29kZSk7XG5cdFx0dGhpcy5fX2NvbnZlcnRUZXh0dXJlM0RQcm9kKHNwbGl0dGVkU2hhZGVyQ29kZSk7XG5cdFx0Y29uc3QgdHJhbnNmb3JtZWRTcGxpdHRlZFNoYWRlckNvZGUgPSBzcGxpdHRlZFNoYWRlckNvZGU7XG5cblx0XHRyZXR1cm4gdHJhbnNmb3JtZWRTcGxpdHRlZFNoYWRlckNvZGU7XG5cdH1cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogVHJhbnNsYXRlIGEgR0xTTCBzaGFkZXIgY29kZSB0byBhIHNoYWRlciBjb2RlIG9mIHNwZWNpZmllZCBHTFNMIHZlcnNpb25cblx0ICovXG5cdHN0YXRpYyBfdHJhbnNmb3JtVG8oXG5cdFx0dmVyc2lvbjogU2hhZGVyVmVyc2lvbixcblx0XHRzcGxpdHRlZFNoYWRlckNvZGU6IHN0cmluZ1tdLFxuXHRcdGlzRnJhZ21lbnRTaGFkZXI6IGJvb2xlYW4sXG5cdFx0ZW1iZWRFcnJvcnNJbk91dHB1dDogYm9vbGVhblxuXHQpIHtcblx0XHRpZiAodmVyc2lvbi5tYXRjaCgvd2ViZ2wyfGVzMy9pKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX3RyYW5zZm9ybVRvR0xTTEVTMyhzcGxpdHRlZFNoYWRlckNvZGUsIGlzRnJhZ21lbnRTaGFkZXIpO1xuXHRcdH0gZWxzZSBpZiAodmVyc2lvbi5tYXRjaCgvd2ViZ2wxfGVzMS9pKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX3RyYW5zZm9ybVRvR0xTTEVTMShzcGxpdHRlZFNoYWRlckNvZGUsIGlzRnJhZ21lbnRTaGFkZXIsIGVtYmVkRXJyb3JzSW5PdXRwdXQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdJbnZhbGlkIFZlcnNpb24nKVxuXHRcdFx0cmV0dXJuIHNwbGl0dGVkU2hhZGVyQ29kZTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogSWYgdGhlIGZpcnN0IGxpbmUgY29udGFpbnMgdmVyc2lvbiBpbmZvcm1hdGlvbiwgb3ZlcndyaXRlIHRoZSBmaXJzdCBsaW5lIHdpdGggJyN2ZXJzaW9uIDEwMCcuXG5cdCAqIElmIG5vdCwgYWRkICcjdmVyc2lvbiAxMDAnIHRvIHRoZSBmaXJzdCBsaW5lLlxuXHQgKlxuXHQgKiBOb3RlOiBJZiB0aGUgZmlyc3QgbGluZSBpcyBjb21tZW50ZWQgb3V0IGFuZCB0aGUgdmVyc2lvbiBpbmZvcm1hdGlvbiBpcyB3cml0dGVuIGluIHRoZSBzZWNvbmQgb3IgbGF0ZXIgbGluZSxcblx0ICogdGhlIGFwcHJvcHJpYXRlIHZlcnNpb24gaW5mb3JtYXRpb24gd2lsbCBiZSBhZGRlZCB0byB0aGUgZmlyc3QgbGluZSBhbmQgdGhlIHVzZXItZGVmaW5lZCB2ZXJzaW9uIGluZm9ybWF0aW9uXG5cdCAqIGluIHRoZSBzZWNvbmQgb3IgbGF0ZXIgbGluZSB3aWxsIGJlIHJlbW92ZWQuXG5cdCAqL1xuXHRwcml2YXRlIHN0YXRpYyBfX2NvbnZlcnRPckluc2VydFZlcnNpb25HTFNMRVMxKHNwbGl0dGVkU2hhZGVyQ29kZTogc3RyaW5nW10pIHtcblx0XHRjb25zdCByZWcgPSAvXig/IVtcXC9dKVtcXHQgXSojW1xcdCBdKnZlcnNpb25bXFx0IF0rLiovO1xuXHRcdHRoaXMuX19yZW1vdmVGaXJzdE1hdGNoaW5nTGluZShzcGxpdHRlZFNoYWRlckNvZGUsIHJlZyk7XG5cblx0XHRzcGxpdHRlZFNoYWRlckNvZGUudW5zaGlmdCgnI3ZlcnNpb24gMTAwJyk7XG5cdH1cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogSWYgdGhlIGZpcnN0IGxpbmUgY29udGFpbnMgdmVyc2lvbiBpbmZvcm1hdGlvbiwgb3ZlcndyaXRlIHRoZSBmaXJzdCBsaW5lIHdpdGggJyN2ZXJzaW9uIDMwMCBlcycuXG5cdCAqIElmIG5vdCwgYWRkICcjdmVyc2lvbiAzMDAgZXMnIHRvIHRoZSBmaXJzdCBsaW5lLlxuXHQgKiBJbiBib3RoIGNhc2VzLCAnI2RlZmluZSBHTFNMX0VTMycgd2lsbCBiZSBpbnNlcnRlZCBpbiB0aGUgc2Vjb25kIGxpbmUuXG5cdCAqIFVzZSB0aGUgJyNkZWZpbmUgR0xTTF9FUzMnIGRpcmVjdGl2ZSBpZiB5b3Ugd2FudCB0byB3cml0ZSBhIHNoYWRlciBjb2RlIHRoYXQgd2lsbCBvbmx5IHJ1biBpbiB0aGUgY2FzZSBvZiB3ZWJnbDIuXG5cdCAqXG5cdCAqIE5vdGU6IElmIHRoZSBmaXJzdCBsaW5lIGlzIGNvbW1lbnRlZCBvdXQgYW5kIHRoZSB2ZXJzaW9uIGluZm9ybWF0aW9uIGlzIHdyaXR0ZW4gaW4gdGhlIHNlY29uZCBvciBsYXRlciBsaW5lLFxuXHQgKiB0aGUgYXBwcm9wcmlhdGUgdmVyc2lvbiBpbmZvcm1hdGlvbiB3aWxsIGJlIGFkZGVkIHRvIHRoZSBmaXJzdCBsaW5lIGFuZCB0aGUgdXNlci1kZWZpbmVkIHZlcnNpb24gaW5mb3JtYXRpb25cblx0ICogaW4gdGhlIHNlY29uZCBvciBsYXRlciBsaW5lIHdpbGwgYmUgcmVtb3ZlZC5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fY29udmVydE9ySW5zZXJ0VmVyc2lvbkdMU0xFUzMoc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSkge1xuXHRcdGNvbnN0IHJlZyA9IC9eKD8hW1xcL10pW1xcdCBdKiNbXFx0IF0qdmVyc2lvbltcXHQgXSsuKi87XG5cdFx0dGhpcy5fX3JlbW92ZUZpcnN0TWF0Y2hpbmdMaW5lKHNwbGl0dGVkU2hhZGVyQ29kZSwgcmVnKTtcblxuXHRcdHNwbGl0dGVkU2hhZGVyQ29kZS51bnNoaWZ0KCcjZGVmaW5lIEdMU0xfRVMzJyk7XG5cdFx0c3BsaXR0ZWRTaGFkZXJDb2RlLnVuc2hpZnQoJyN2ZXJzaW9uIDMwMCBlcycpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEZpbmQgdGhlICdpbicgcXVhbGlmaWVyIGluIHRoZSBzaGFkZXIgY29kZSBhbmQgcmVwbGFjZSBpdCB3aXRoIHRoZSBHTFNMIEVTMSBxdWFsaWZpZXIoJ2F0dHJpYnV0ZScgb3IgJ3ZhcnlpbmcnKVxuXHQgKiBUaGlzIG1ldGhvZCBkaXJlY3RseSByZXBsYWNlIHRoZSBlbGVtZW50cyBvZiB0aGUgc3BsaXR0ZWRTaGFkZXJDb2RlIHZhcmlhYmxlLlxuXHQgKi9cblx0cHJpdmF0ZSBzdGF0aWMgX19jb252ZXJ0SW4oc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSwgaXNGcmFnbWVudFNoYWRlcjogYm9vbGVhbikge1xuXHRcdGNvbnN0IHJlZyA9IC9eKD8hW1xcL10pW1xcdCBdKmluW1xcdCBdKygoaGlnaHB8bWVkaXVtcHxsb3dwfClbXFx0IF0qXFx3K1tcXHQgXSpcXHcrW1xcdCBdKjspLztcblxuXHRcdGxldCByZXBsYWNlRnVuYztcblx0XHRpZiAoaXNGcmFnbWVudFNoYWRlcikge1xuXHRcdFx0cmVwbGFjZUZ1bmMgPSBmdW5jdGlvbiAobWF0Y2g6IHN0cmluZywgcDE6IHN0cmluZykge1xuXHRcdFx0XHRyZXR1cm4gJ3ZhcnlpbmcgJyArIHAxO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXBsYWNlRnVuYyA9IGZ1bmN0aW9uIChtYXRjaDogc3RyaW5nLCBwMTogc3RyaW5nKSB7XG5cdFx0XHRcdHJldHVybiAnYXR0cmlidXRlICcgKyBwMTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLl9fcmVwbGFjZUxpbmUoc3BsaXR0ZWRTaGFkZXJDb2RlLCByZWcsIHJlcGxhY2VGdW5jKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBGaW5kIHRoZSBcIm91dFwiIHF1YWxpZmllciBpbiB0aGUgc2hhZGVyIGNvZGUgYW5kIG1vZGlmeSB0aGUgc2hhZGVyIGNvZGUuXG5cdCAqIElmIHRoZSBzaGFkZXIgc3RhZ2UgaXMgdmVydGV4LCB0aGUgXCJvdXRcIiBxdWFsaWZpZXJzIHdpbGwgYmUgcmVwbGFjZWQgYnkgXCJ2YXJ5aW5nXCIgcXVhbGlmaWVyLlxuXHQgKiBJZiB0aGUgc2hhZGVyIHN0YWdlIGlzIGZyYWdtZW50IGFuZCB0aGUgc2hhZGVyIGhhcyBcIm91dFwiIHF1YWxpZmllcnMsIHRoZSBcIm91dFwiIHF1YWxpZmllcnMgd2lsbFxuXHQgKiBiZSBkZWxldGVkIGFuZCB0aGUgdmFyaWFibGUgaXMgdXNlZCB0byBhc3NpZ24gYSB2YWx1ZSB0byBnbF9GcmFnQ29sb3IuXG5cdCAqIFRoaXMgbWV0aG9kIGRpcmVjdGx5IHJlcGxhY2UgdGhlIGVsZW1lbnRzIG9mIHRoZSBzcGxpdHRlZFNoYWRlckNvZGUgdmFyaWFibGUuXG5cdCAqL1xuXHRwcml2YXRlIHN0YXRpYyBfX2NvbnZlcnRPdXQoc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSwgaXNGcmFnbWVudFNoYWRlcjogYm9vbGVhbiwgZW1iZWRFcnJvcnNJbk91dHB1dDogYm9vbGVhbikge1xuXHRcdGlmIChpc0ZyYWdtZW50U2hhZGVyKSB7XG5cdFx0XHRjb25zdCB2YXJpYWJsZU5hbWUgPSB0aGlzLl9fcmVtb3ZlT3V0UXVhbGlmaWVyKHNwbGl0dGVkU2hhZGVyQ29kZSwgZW1iZWRFcnJvcnNJbk91dHB1dCk7XG5cdFx0XHRpZiAodmFyaWFibGVOYW1lID09IG51bGwpIHtcblx0XHRcdFx0Ly8gbm8gb3V0IHF1YWxpZmllclxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX19hZGRHTEZyYWdDb2xvcih2YXJpYWJsZU5hbWUsIHNwbGl0dGVkU2hhZGVyQ29kZSwgZW1iZWRFcnJvcnNJbk91dHB1dCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IHJlZyA9IC9eKD8hW1xcL10pW1xcdCBdKm91dFtcXHQgXSsoKGhpZ2hwfG1lZGl1bXB8bG93cHwpW1xcdCBdKlxcdytbXFx0IF0qXFx3K1tcXHQgXSo7KS87XG5cdFx0XHRjb25zdCByZXBsYWNlRnVuYyA9IGZ1bmN0aW9uIChtYXRjaDogc3RyaW5nLCBwMTogc3RyaW5nKSB7XG5cdFx0XHRcdHJldHVybiAndmFyeWluZyAnICsgcDE7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9fcmVwbGFjZUxpbmUoc3BsaXR0ZWRTaGFkZXJDb2RlLCByZWcsIHJlcGxhY2VGdW5jKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogVGhpcyBtZXRob2QgaXMgYSBwYXJ0IG9mIF9fY29udmVydE91dCBtZXRob2QuXG5cdCAqIFRoaXMgbWV0aG9kIGRlbGV0ZXMgdGhlIFwib3V0XCIgcXVhbGlmaWVycyBhbmQgYWRkcyB0aGUgbGluZSBmb3IgYXNzaWduaW5nIHRvIGdsX0ZyYWdDb2xvci5cblx0ICogSWYgdGhlIHNoYWRlciBkb2VzIG5vdCBoYXZlIHRoZSBcIm91dFwiIHF1YWxpZmllcnMsIHRoaXMgbWV0aG9kIGRvZXMgbm90aGluZy5cblx0ICovXG5cblx0cHJpdmF0ZSBzdGF0aWMgX19yZW1vdmVPdXRRdWFsaWZpZXIoc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSwgZW1iZWRFcnJvcnNJbk91dHB1dDogYm9vbGVhbikge1xuXHRcdGNvbnN0IHJlZyA9IC9eKD8hW1xcL10pW1xcdCBdKm91dFtcXHQgXSsoKGhpZ2hwfG1lZGl1bXB8bG93cHwpW1xcdCBdKlxcdytbXFx0IF0qKFxcdyspW1xcdCBdKjspLztcblxuXHRcdGxldCB2YXJpYWJsZU5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHNwbGl0dGVkU2hhZGVyQ29kZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgbWF0Y2ggPSBzcGxpdHRlZFNoYWRlckNvZGVbaV0ubWF0Y2gocmVnKTtcblx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRzcGxpdHRlZFNoYWRlckNvZGVbaV0gPSBtYXRjaFsxXTtcblx0XHRcdFx0dmFyaWFibGVOYW1lID0gbWF0Y2hbM107XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB2YXJpYWJsZU5hbWU7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBfX2FkZEdMRnJhZ0NvbG9yKHZhcmlhYmxlTmFtZTogc3RyaW5nLCBzcGxpdHRlZFNoYWRlckNvZGU6IHN0cmluZ1tdLCBlbWJlZEVycm9yc0luT3V0cHV0OiBib29sZWFuKSB7XG5cdFx0Y29uc3QgY2xvc2VCcmFja2V0UmVnID0gLyguKilcXH1bXFxuXFx0IF0qJC87XG5cdFx0Y29uc3QgcmV0dXJuUmVnID0gL1tcXG5cXHQgXSpyZXR1cm5bXFxuXFx0IF0qOy87XG5cdFx0Y29uc3QgbWFpbkZ1bmNTdGFydFJlZyA9IC8oXnxeKD8hW1xcL10pW1xcdFxcbiBdKyl2b2lkW1xcdFxcbiBdK21haW4oW1xcdFxcbiBdfFxcKHwkKS87XG5cdFx0Y29uc3QgZnJhZ0NvbG9yQ29kZSA9IGAgIGdsX0ZyYWdDb2xvciA9ICR7dmFyaWFibGVOYW1lfTtgO1xuXG5cdFx0bGV0IHNldEdsRnJhZ0NvbG9ySW5MYXN0TGluZSA9IGZhbHNlO1xuXHRcdGZvciAobGV0IGkgPSBzcGxpdHRlZFNoYWRlckNvZGUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdGNvbnN0IGxpbmUgPSBzcGxpdHRlZFNoYWRlckNvZGVbaV07XG5cdFx0XHRpZiAoIXNldEdsRnJhZ0NvbG9ySW5MYXN0TGluZSAmJiBsaW5lLm1hdGNoKGNsb3NlQnJhY2tldFJlZykpIHtcblx0XHRcdFx0Ly8gYWRkIGdsX0ZyYWdDb2xvciB0byBsYXN0IGxpbmUgb2YgbWFpbiBmdW5jdGlvblxuXHRcdFx0XHRzcGxpdHRlZFNoYWRlckNvZGVbaV0gPSBsaW5lLnJlcGxhY2UoY2xvc2VCcmFja2V0UmVnLCBgJDFcXG4ke2ZyYWdDb2xvckNvZGV9XFxufVxcbmApO1xuXHRcdFx0XHRzZXRHbEZyYWdDb2xvckluTGFzdExpbmUgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobGluZS5tYXRjaChyZXR1cm5SZWcpKSB7XG5cdFx0XHRcdC8vIGFkZCBnbF9GcmFnQ29sb3IganVzdCBiZWZvcmUgcmV0dXJuXG5cdFx0XHRcdHNwbGl0dGVkU2hhZGVyQ29kZS5zcGxpY2UoaSwgMCwgZnJhZ0NvbG9yQ29kZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChsaW5lLm1hdGNoKG1haW5GdW5jU3RhcnRSZWcpKSB7XG5cdFx0XHRcdC8vIGFkZCBnbF9GcmFnQ29sb3Igb25seSBpbiB0aGUgbWFpbiBmdW5jdGlvblxuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIXNldEdsRnJhZ0NvbG9ySW5MYXN0TGluZSkge1xuXHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gJ19fcmVtb3ZlT3V0UXVhbGlmaWVyOiBOb3QgZm91bmQgdGhlIGNsb3NpbmcgYnJhY2tldHMgZm9yIHRoZSBtYWluIGZ1bmN0aW9uJztcblx0XHRcdHRoaXMuX19vdXRFcnJvcihzcGxpdHRlZFNoYWRlckNvZGUsIHNwbGl0dGVkU2hhZGVyQ29kZS5sZW5ndGgsIGVycm9yTWVzc2FnZSwgZW1iZWRFcnJvcnNJbk91dHB1dCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEZpbmQgdGhlIHF1YWxpZmllciBmb3IgZXMzIG9ubHkgaW4gdGhlIHNoYWRlciBjb2RlIGFuZCByZW1vdmUgaXRcblx0ICogVGhpcyBtZXRob2QgZGlyZWN0bHkgcmVwbGFjZSB0aGUgZWxlbWVudHMgb2YgdGhlIHNwbGl0dGVkU2hhZGVyQ29kZSB2YXJpYWJsZS5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fcmVtb3ZlRVMzUXVhbGlmaWVyKHNwbGl0dGVkU2hhZGVyQ29kZTogc3RyaW5nW10sIGVtYmVkRXJyb3JzSW5PdXRwdXQ6IGJvb2xlYW4pIHtcblx0XHR0aGlzLl9fcmVtb3ZlVmFyeWluZ1F1YWxpZmllcihzcGxpdHRlZFNoYWRlckNvZGUsIGVtYmVkRXJyb3JzSW5PdXRwdXQpO1xuXHRcdHRoaXMuX19yZW1vdmVMYXlvdXQoc3BsaXR0ZWRTaGFkZXJDb2RlKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBGaW5kIHRoZSBcImZsYXRcIiBhbmQgXCJzbW9vdGhcIiBxdWFsaWZpZXIgaW4gdGhlIHNoYWRlciBjb2RlIGFuZCByZW1vdmUgaXRcblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fcmVtb3ZlVmFyeWluZ1F1YWxpZmllcihzcGxpdHRlZFNoYWRlckNvZGU6IHN0cmluZ1tdLCBlbWJlZEVycm9yc0luT3V0cHV0OiBib29sZWFuKSB7XG5cdFx0Y29uc3QgcmVnID0gL14oPyFbXFwvXSlbXFx0IF0qKGZsYXR8c21vb3RoKVtcXHQgXSooKGlufG91dClbXFx0IF0rLiopLztcblx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSAnX19yZW1vdmVWYXJ5aW5nUXVhbGlmaWVyOiBnbHNsIGVzMSBkb2VzIG5vdCBzdXBwb3J0IGZsYXQgcXVhbGlmaWVyJztcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc3BsaXR0ZWRTaGFkZXJDb2RlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRzcGxpdHRlZFNoYWRlckNvZGVbaV0gPSBzcGxpdHRlZFNoYWRlckNvZGVbaV0ucmVwbGFjZShyZWcsIChtYXRjaDogc3RyaW5nLCBwMTogc3RyaW5nLCBwMjogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdGlmIChwMSA9PT0gJ2ZsYXQnKSB7XG5cdFx0XHRcdFx0dGhpcy5fX291dEVycm9yKHNwbGl0dGVkU2hhZGVyQ29kZSwgaSArIDEsIGVycm9yTWVzc2FnZSwgZW1iZWRFcnJvcnNJbk91dHB1dCk7XG5cdFx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBwMjtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBGaW5kIHRoZSBcImxheW91dFwiIHF1YWxpZmllciBpbiB0aGUgc2hhZGVyIGNvZGUgYW5kIHJlbW92ZSBpdFxuXHQgKi9cblx0cHJpdmF0ZSBzdGF0aWMgX19yZW1vdmVMYXlvdXQoc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSkge1xuXHRcdGNvbnN0IHJlZyA9IC9eKD8hW1xcL10pW1xcdCBdKmxheW91dFtcXHQgXSpcXChbXFx0IF0qbG9jYXRpb25bXFx0IF0qXFw9W1xcdCBdKlxcZFtcXHQgXSpcXClbXFx0IF0rL2c7XG5cdFx0dGhpcy5fX3JlcGxhY2VMaW5lKHNwbGl0dGVkU2hhZGVyQ29kZSwgcmVnLCAnJyk7XG5cdH1cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogRmluZCB0aGUgXCJwcmVjaXNpb25cIiBxdWFsaWZpZXIgaW4gdGhlIHNoYWRlciBjb2RlIGFuZCByZW1vdmUgaXQgaWYgdGhlIFwicHJlY2lzaW9uXCIgcXVhbGlmaWVyIGlzIHZhbGlkIGZvciBvbmx5IEdMU0wgRVMzXG5cdCAqIFRoaXMgbWV0aG9kIGRpcmVjdGx5IHJlcGxhY2UgdGhlIGVsZW1lbnRzIG9mIHRoZSBzcGxpdHRlZFNoYWRlckNvZGUgdmFyaWFibGUuXG5cdCAqL1xuXHRwcml2YXRlIHN0YXRpYyBfX3JlbW92ZVByZWNpc2lvbkZvckVTMyhzcGxpdHRlZFNoYWRlckNvZGU6IHN0cmluZ1tdKSB7XG5cdFx0Y29uc3QgcmVnID0gL14oPyFbXFwvXSlbXFx0IF0qcHJlY2lzaW9uW1xcdCBdKyhoaWdocHxtZWRpdW1wfGxvd3ApW1xcdCBdKyhcXHcrKVtcXHQgXSo7LztcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc3BsaXR0ZWRTaGFkZXJDb2RlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCBtYXRjaCA9IHNwbGl0dGVkU2hhZGVyQ29kZVtpXS5tYXRjaChyZWcpO1xuXHRcdFx0aWYgKG1hdGNoICE9IG51bGwpIHtcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdG1hdGNoWzJdID09PSAnaW50JyB8fFxuXHRcdFx0XHRcdG1hdGNoWzJdID09PSAnZmxvYXQnIHx8XG5cdFx0XHRcdFx0bWF0Y2hbMl0gPT09ICdzYW1wbGVyMkQnIHx8XG5cdFx0XHRcdFx0bWF0Y2hbMl0gPT09ICdzYW1wbGVyQ3ViZSdcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0Ly8gdGhlc2UgcHJlY2lzaW9ucyBhcmUgc3VwcG9ydGVkIGluIGVzMVxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNwbGl0dGVkU2hhZGVyQ29kZS5zcGxpY2UoaS0tLCAxKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBGaW5kIHRoZSBcInRleHR1cmVcIiBhbmQgXCJ0ZXh0dXJlUHJvalwiIG1ldGhvZCBpbiB0aGUgc2hhZGVyIGNvZGUgYW5kXG5cdCAqIHJlcGxhY2UgaXQgd2l0aCB0aGUgR0xTTCBFUzEgbWV0aG9kKCd0ZXh0dXJlMkQnLCAndGV4dHVyZTJEJywgYW5kIHNvIG9uKVxuXHQgKiBUaGlzIG1ldGhvZCBkaXJlY3RseSByZXBsYWNlIHRoZSBlbGVtZW50cyBvZiB0aGUgc3BsaXR0ZWRTaGFkZXJDb2RlIHZhcmlhYmxlLlxuXHQgKi9cblx0cHJpdmF0ZSBzdGF0aWMgX19jb252ZXJ0VGV4dHVyZUZ1bmN0aW9uVG9FUzEoc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSwgaXNGcmFnbWVudFNoYWRlcjogYm9vbGVhbiwgZW1iZWRFcnJvcnNJbk91dHB1dDogYm9vbGVhbikge1xuXHRcdGNvbnN0IHNibCA9IHRoaXMuX19yZWdTeW1ib2xzKCk7XG5cdFx0Y29uc3QgcmVnVGV4dHVyZVByb2ogPSBuZXcgUmVnRXhwKGAoJHtzYmx9Kyl0ZXh0dXJlUHJvaihMb2R8KSgke3NibH0rKWAsICdnJyk7XG5cdFx0Y29uc3QgcmVnVGV4dHVyZSA9IG5ldyBSZWdFeHAoYCgke3NibH0rKXRleHR1cmUoTG9kfCkoJHtzYmx9KylgLCAnZycpO1xuXG5cdFx0bGV0IGFyZ3VtZW50U2FtcGxlck1hcDogTWFwPHN0cmluZywgc3RyaW5nPiB8IHVuZGVmaW5lZDtcblx0XHRjb25zdCB1bmlmb3JtU2FtcGxlck1hcCA9IHRoaXMuX19jcmVhdGVVbmlmb3JtU2FtcGxlck1hcChzcGxpdHRlZFNoYWRlckNvZGUsIGVtYmVkRXJyb3JzSW5PdXRwdXQpO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc3BsaXR0ZWRTaGFkZXJDb2RlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCBsaW5lID0gc3BsaXR0ZWRTaGFkZXJDb2RlW2ldO1xuXG5cdFx0XHRjb25zdCBtYXRjaFRleHR1cmVQcm9qID0gbGluZS5tYXRjaCgvdGV4dHVyZVByb2ooTG9kfClbXFx0IF0qXFwoW1xcdCBdKihcXHcrKSwvKTtcblx0XHRcdGlmIChtYXRjaFRleHR1cmVQcm9qKSB7XG5cdFx0XHRcdGFyZ3VtZW50U2FtcGxlck1hcCA9IGFyZ3VtZW50U2FtcGxlck1hcCA/PyB0aGlzLl9fY3JlYXRlQXJndW1lbnRTYW1wbGVyTWFwKFxuXHRcdFx0XHRcdHNwbGl0dGVkU2hhZGVyQ29kZSxcblx0XHRcdFx0XHRpLFxuXHRcdFx0XHRcdGVtYmVkRXJyb3JzSW5PdXRwdXRcblx0XHRcdFx0KTtcblxuXHRcdFx0XHRjb25zdCBpc0xvZE1ldGhvZCA9IG1hdGNoVGV4dHVyZVByb2pbMV0gPT09ICdMb2QnO1xuXHRcdFx0XHRjb25zdCBleHRlbnNpb25TdHIgPSBpc0ZyYWdtZW50U2hhZGVyICYmIGlzTG9kTWV0aG9kID8gYEVYVGAgOiBgYDtcblx0XHRcdFx0Y29uc3QgdmFyaWFibGVOYW1lID0gbWF0Y2hUZXh0dXJlUHJvalsyXTtcblx0XHRcdFx0Y29uc3Qgc2FtcGxlclR5cGUgPSBhcmd1bWVudFNhbXBsZXJNYXA/LmdldCh2YXJpYWJsZU5hbWUpID8/IHVuaWZvcm1TYW1wbGVyTWFwLmdldCh2YXJpYWJsZU5hbWUpO1xuXHRcdFx0XHRpZiAoc2FtcGxlclR5cGUgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGlmIChzYW1wbGVyVHlwZSA9PT0gJ3NhbXBsZXIyRCcpIHtcblx0XHRcdFx0XHRcdHNwbGl0dGVkU2hhZGVyQ29kZVtpXSA9IHNwbGl0dGVkU2hhZGVyQ29kZVtpXS5yZXBsYWNlKHJlZ1RleHR1cmVQcm9qLCBgJDF0ZXh0dXJlMkRQcm9qJDIke2V4dGVuc2lvblN0cn0kM2ApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSAnX19jb252ZXJ0VGV4dHVyZUZ1bmN0aW9uVG9FUzE6IGRvIG5vdCBzdXBwb3J0ICcgKyBzYW1wbGVyVHlwZSArICcgdHlwZSc7XG5cdFx0XHRcdFx0XHR0aGlzLl9fb3V0RXJyb3Ioc3BsaXR0ZWRTaGFkZXJDb2RlLCBpLCBlcnJvck1lc3NhZ2UsIGVtYmVkRXJyb3JzSW5PdXRwdXQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbWF0Y2hUZXh0dXJlID0gbGluZS5tYXRjaCgvdGV4dHVyZShMb2R8KVtcXHQgXSpcXChbXFx0IF0qKFxcdyspLC8pO1xuXHRcdFx0aWYgKG1hdGNoVGV4dHVyZSkge1xuXHRcdFx0XHRhcmd1bWVudFNhbXBsZXJNYXAgPSBhcmd1bWVudFNhbXBsZXJNYXAgPz8gdGhpcy5fX2NyZWF0ZUFyZ3VtZW50U2FtcGxlck1hcChcblx0XHRcdFx0XHRzcGxpdHRlZFNoYWRlckNvZGUsXG5cdFx0XHRcdFx0aSxcblx0XHRcdFx0XHRlbWJlZEVycm9yc0luT3V0cHV0XG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0Y29uc3QgaXNMb2RNZXRob2QgPSBtYXRjaFRleHR1cmVbMV0gPT09ICdMb2QnO1xuXHRcdFx0XHRjb25zdCBleHRlbnNpb25TdHIgPSBpc0ZyYWdtZW50U2hhZGVyICYmIGlzTG9kTWV0aG9kID8gYEVYVGAgOiBgYDtcblx0XHRcdFx0Y29uc3QgdmFyaWFibGVOYW1lID0gbWF0Y2hUZXh0dXJlWzJdO1xuXHRcdFx0XHRjb25zdCBzYW1wbGVyVHlwZSA9IGFyZ3VtZW50U2FtcGxlck1hcD8uZ2V0KHZhcmlhYmxlTmFtZSkgPz8gdW5pZm9ybVNhbXBsZXJNYXAuZ2V0KHZhcmlhYmxlTmFtZSk7XG5cdFx0XHRcdGlmIChzYW1wbGVyVHlwZSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0bGV0IHRleHR1cmVGdW5jOiBzdHJpbmc7XG5cdFx0XHRcdFx0aWYgKHNhbXBsZXJUeXBlID09PSAnc2FtcGxlcjJEJykge1xuXHRcdFx0XHRcdFx0dGV4dHVyZUZ1bmMgPSAndGV4dHVyZTJEJztcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHNhbXBsZXJUeXBlID09PSAnc2FtcGxlckN1YmUnKSB7XG5cdFx0XHRcdFx0XHR0ZXh0dXJlRnVuYyA9ICd0ZXh0dXJlQ3ViZSc7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRleHR1cmVGdW5jID0gJyc7XG5cdFx0XHRcdFx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSAnX19jb252ZXJ0VGV4dHVyZUZ1bmN0aW9uVG9FUzE6IGRvIG5vdCBzdXBwb3J0ICcgKyBzYW1wbGVyVHlwZSArICcgdHlwZSc7XG5cdFx0XHRcdFx0XHR0aGlzLl9fb3V0RXJyb3Ioc3BsaXR0ZWRTaGFkZXJDb2RlLCBpLCBlcnJvck1lc3NhZ2UsIGVtYmVkRXJyb3JzSW5PdXRwdXQpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICh0ZXh0dXJlRnVuYyAhPT0gJycpIHtcblx0XHRcdFx0XHRcdHNwbGl0dGVkU2hhZGVyQ29kZVtpXSA9IHNwbGl0dGVkU2hhZGVyQ29kZVtpXS5yZXBsYWNlKHJlZ1RleHR1cmUsIGAkMSR7dGV4dHVyZUZ1bmN9JDIke2V4dGVuc2lvblN0cn0kM2ApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaXNCbG9ja0VuZCA9ICEhbGluZS5tYXRjaCgvXFx9Lyk7XG5cdFx0XHRpZiAoaXNCbG9ja0VuZCkge1xuXHRcdFx0XHRhcmd1bWVudFNhbXBsZXJNYXAgPSB1bmRlZmluZWQ7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIFRoaXMgbWV0aG9kIGZpbmRzIHVuaWZvcm0gZGVjbGFyYXRpb25zIG9mIHNhbXBsZXIgdHlwZXMgaW4gdGhlIHNoYWRlciBhbmRcblx0ICogY3JlYXRlcyBhIG1hcCB3aXRoIHZhcmlhYmxlIG5hbWVzIGFzIGtleXMgYW5kIHR5cGVzIGFzIHZhbHVlcy5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fY3JlYXRlVW5pZm9ybVNhbXBsZXJNYXAoc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSwgZW1iZWRFcnJvcnNJbk91dHB1dDogYm9vbGVhbikge1xuXHRcdGNvbnN0IHVuaWZvcm1TYW1wbGVyTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzcGxpdHRlZFNoYWRlckNvZGUubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IGxpbmUgPSBzcGxpdHRlZFNoYWRlckNvZGVbaV07XG5cdFx0XHRjb25zdCBtYXRjaCA9IGxpbmUubWF0Y2goL14oPyFbXFwvXSlbXFx0IF0qdW5pZm9ybSpbXFx0IF0qKGhpZ2hwfG1lZGl1bXB8bG93cHwpW1xcdCBdKihzYW1wbGVyXFx3KylbXFx0IF0rKFxcdyspLyk7XG5cdFx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdFx0Y29uc3Qgc2FtcGxlclR5cGUgPSBtYXRjaFsyXTtcblx0XHRcdFx0Y29uc3QgbmFtZSA9IG1hdGNoWzNdO1xuXHRcdFx0XHRpZiAodW5pZm9ybVNhbXBsZXJNYXAuZ2V0KG5hbWUpKSB7XG5cdFx0XHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gJ19fY3JlYXRlVW5pZm9ybVNhbXBsZXJNYXA6IGR1cGxpY2F0ZSB2YXJpYWJsZSBuYW1lJztcblx0XHRcdFx0XHR0aGlzLl9fb3V0RXJyb3Ioc3BsaXR0ZWRTaGFkZXJDb2RlLCBpLCBlcnJvck1lc3NhZ2UsIGVtYmVkRXJyb3JzSW5PdXRwdXQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHVuaWZvcm1TYW1wbGVyTWFwLnNldChuYW1lLCBzYW1wbGVyVHlwZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB1bmlmb3JtU2FtcGxlck1hcDtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBUaGlzIG1ldGhvZCBmaW5kcyBzYW1wbGVyIHR5cGVzIGZyb20gdGhlIGZ1bmN0aW9uIGFyZ3VtZW50cyBhbmRcblx0ICogY3JlYXRlcyBhIG1hcCB3aXRoIHZhcmlhYmxlIG5hbWVzIGFzIGtleXMgYW5kIHR5cGVzIGFzIHZhbHVlcy5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fY3JlYXRlQXJndW1lbnRTYW1wbGVyTWFwKFxuXHRcdHNwbGl0dGVkU2hhZGVyQ29kZTogc3RyaW5nW10sXG5cdFx0bGluZUluZGV4OiBudW1iZXIsXG5cdFx0ZW1iZWRFcnJvcnNJbk91dHB1dDogYm9vbGVhblxuXHQpIHtcblx0XHRjb25zdCBhcmd1bWVudFNhbXBsZXJNYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG5cblx0XHRmb3IgKGxldCBpID0gbGluZUluZGV4OyBpID49IDA7IGktLSkge1xuXHRcdFx0Y29uc3QgbGluZSA9IHNwbGl0dGVkU2hhZGVyQ29kZVtpXTtcblxuXHRcdFx0Y29uc3QgaXNCbG9ja1N0YXJ0TGluZSA9ICEhbGluZS5tYXRjaCgvXFx7Lyk7XG5cdFx0XHRpZiAoIWlzQmxvY2tTdGFydExpbmUpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGJyYWNrZXRTZWN0aW9uQ29kZSA9IHRoaXMuX19nZXRCcmFja2V0U2VjdGlvbihzcGxpdHRlZFNoYWRlckNvZGUsIGkpO1xuXG5cdFx0XHRjb25zdCBpbm5lckJyYWNrZXRTZWN0aW9uQ29kZSA9IGJyYWNrZXRTZWN0aW9uQ29kZS5tYXRjaCgvLipcXCgoLiopXFwpLyk/LlsxXTtcblx0XHRcdGlmIChpbm5lckJyYWNrZXRTZWN0aW9uQ29kZSA9PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgdmFyaWFibGVDYW5kaWRhdGVzID0gaW5uZXJCcmFja2V0U2VjdGlvbkNvZGUuc3BsaXQoJywnKTtcblx0XHRcdGNvbnN0IHNhbXBsZXJUeXBlRGVmaW5pdGlvblJlZyA9IC9bXFxuXFx0IF0qKGhpZ2hwfG1lZGl1bXB8bG93cHwpW1xcblxcdCBdKihzYW1wbGVyXFx3KylbXFxuXFx0IF0qKFxcdyspW1xcblxcdCBdKi87XG5cblx0XHRcdGNvbnN0IGlzRnVuY3Rpb25CcmFja2V0ID0gISEodmFyaWFibGVDYW5kaWRhdGVzWzBdLm1hdGNoKHNhbXBsZXJUeXBlRGVmaW5pdGlvblJlZykgPz8gdmFyaWFibGVDYW5kaWRhdGVzWzBdLm1hdGNoKC9eW1xcblxcdCBdKiQvKSk7XG5cdFx0XHRpZiAoIWlzRnVuY3Rpb25CcmFja2V0KSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGNvbnN0IHZhcmlhYmxlQ2FuZGlkYXRlIG9mIHZhcmlhYmxlQ2FuZGlkYXRlcykge1xuXHRcdFx0XHRjb25zdCBzYW1wbGVyVmFyaWFibGVNYXRjaCA9IHZhcmlhYmxlQ2FuZGlkYXRlLm1hdGNoKHNhbXBsZXJUeXBlRGVmaW5pdGlvblJlZyk7XG5cdFx0XHRcdGlmIChzYW1wbGVyVmFyaWFibGVNYXRjaCA9PSBudWxsKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3Qgc2FtcGxlclR5cGUgPSBzYW1wbGVyVmFyaWFibGVNYXRjaFsyXTtcblx0XHRcdFx0Y29uc3QgbmFtZSA9IHNhbXBsZXJWYXJpYWJsZU1hdGNoWzNdO1xuXHRcdFx0XHRpZiAoYXJndW1lbnRTYW1wbGVyTWFwLmdldChuYW1lKSkge1xuXHRcdFx0XHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9ICdfX2NyZWF0ZUFyZ3VtZW50U2FtcGxlck1hcDogZHVwbGljYXRlIHZhcmlhYmxlIG5hbWUnO1xuXHRcdFx0XHRcdHRoaXMuX19vdXRFcnJvcihzcGxpdHRlZFNoYWRlckNvZGUsIGksIGVycm9yTWVzc2FnZSwgZW1iZWRFcnJvcnNJbk91dHB1dCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YXJndW1lbnRTYW1wbGVyTWFwLnNldChuYW1lLCBzYW1wbGVyVHlwZSk7XG5cdFx0XHR9XG5cblx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdHJldHVybiBhcmd1bWVudFNhbXBsZXJNYXA7XG5cdH1cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgcGFydCBlbmNsb3NlZCBpbiBicmFja2V0cyg9ICcoKScpLlxuXHQgKiBGb3IgZXhhbXBsZSwgeW91IGNhbiBnZXQgbGluZXMgdGhhdCBjb250YWluIGZ1bmN0aW9uIGFyZ3VtZW50cywgY29uZGl0aW9uYWwgZXhwcmVzc2lvbnMgZm9yIGlmIHN0YXRlbWVudHMsIGV0Yy5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fZ2V0QnJhY2tldFNlY3Rpb24oc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSwgYnJhY2tldEVuZEluZGV4OiBudW1iZXIpIHtcblx0XHRsZXQgYnJhY2tldFN0YXJ0SW5kZXggPSAwO1xuXHRcdGZvciAobGV0IGogPSBicmFja2V0RW5kSW5kZXg7IGogPj0gMDsgai0tKSB7XG5cdFx0XHRjb25zdCBsaW5lID0gc3BsaXR0ZWRTaGFkZXJDb2RlW2pdO1xuXHRcdFx0Y29uc3QgaXNCcmFja2V0U3RhcnRNYXRjaCA9ICEhbGluZS5tYXRjaCgvXFwoLyk7XG5cdFx0XHRpZiAoaXNCcmFja2V0U3RhcnRNYXRjaCkge1xuXHRcdFx0XHRicmFja2V0U3RhcnRJbmRleCA9IGo7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCBjb250YWluQnJhY2tldENvZGUgPSAnJztcblx0XHRmb3IgKGxldCBqID0gYnJhY2tldFN0YXJ0SW5kZXg7IGogPD0gYnJhY2tldEVuZEluZGV4OyBqKyspIHtcblx0XHRcdGNvbnRhaW5CcmFja2V0Q29kZSArPSBzcGxpdHRlZFNoYWRlckNvZGVbal07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvbnRhaW5CcmFja2V0Q29kZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBGaW5kIHRoZSAnYXR0cmlidXRlJyBxdWFsaWZpZXIgaW4gdGhlIHZlcnRleCBzaGFkZXIgY29kZSBhbmQgcmVwbGFjZSBpdCB3aXRoIHRoZSBHTFNMIEVTMyBxdWFsaWZpZXIoJ2luJylcblx0ICogVGhpcyBtZXRob2QgZGlyZWN0bHkgcmVwbGFjZSB0aGUgZWxlbWVudHMgb2YgdGhlIHNwbGl0dGVkU2hhZGVyQ29kZSB2YXJpYWJsZS5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fY29udmVydEF0dHJpYnV0ZShzcGxpdHRlZFNoYWRlckNvZGU6IHN0cmluZ1tdLCBpc0ZyYWdtZW50U2hhZGVyOiBib29sZWFuKSB7XG5cdFx0aWYgKGlzRnJhZ21lbnRTaGFkZXIpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCByZWcgPSAvXig/IVtcXC9dKVtcXHQgXSphdHRyaWJ1dGVbXFx0IF0rL2c7XG5cdFx0Y29uc3QgcmVwbGFjZVN0ciA9ICdpbiAnO1xuXG5cdFx0dGhpcy5fX3JlcGxhY2VMaW5lKHNwbGl0dGVkU2hhZGVyQ29kZSwgcmVnLCByZXBsYWNlU3RyKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBGaW5kIHRoZSAndmFyeWluZycgcXVhbGlmaWVyIGluIHRoZSBzaGFkZXIgY29kZSBhbmQgcmVwbGFjZSBpdCB3aXRoIHRoZSBHTFNMIEVTMyBxdWFsaWZpZXIoJ2luJyBvciAnb3V0Jylcblx0ICogVGhpcyBtZXRob2QgZGlyZWN0bHkgcmVwbGFjZSB0aGUgZWxlbWVudHMgb2YgdGhlIHNwbGl0dGVkU2hhZGVyQ29kZSB2YXJpYWJsZS5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fY29udmVydFZhcnlpbmcoc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSwgaXNGcmFnbWVudFNoYWRlcjogYm9vbGVhbikge1xuXHRcdGNvbnN0IHJlZyA9IC9eKD8hW1xcL10pW1xcdCBdKnZhcnlpbmdbXFx0IF0rL2c7XG5cdFx0Y29uc3QgcmVwbGFjZVN0ciA9IGlzRnJhZ21lbnRTaGFkZXIgPyAnaW4gJyA6ICdvdXQgJztcblxuXHRcdHRoaXMuX19yZXBsYWNlTGluZShzcGxpdHRlZFNoYWRlckNvZGUsIHJlZywgcmVwbGFjZVN0cik7XG5cdH1cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogRmluZCB0aGUgJ3RleHR1cmVDdWJlJyBtZXRob2QgaW4gdGhlIHNoYWRlciBjb2RlIGFuZCByZXBsYWNlIGl0IHdpdGggdGhlIEdMU0wgRVMzIG1ldGhvZCgndGV4dHVyZScpXG5cdCAqIFRoaXMgbWV0aG9kIGRpcmVjdGx5IHJlcGxhY2UgdGhlIGVsZW1lbnRzIG9mIHRoZSBzcGxpdHRlZFNoYWRlckNvZGUgdmFyaWFibGUuXG5cdCAqL1xuXHRwcml2YXRlIHN0YXRpYyBfX2NvbnZlcnRUZXh0dXJlQ3ViZShzcGxpdHRlZFNoYWRlckNvZGU6IHN0cmluZ1tdKSB7XG5cdFx0Y29uc3Qgc2JsID0gdGhpcy5fX3JlZ1N5bWJvbHMoKTtcblx0XHRjb25zdCByZWcgPSBuZXcgUmVnRXhwKGAoJHtzYmx9KykodGV4dHVyZUN1YmUpKCR7c2JsfSspYCwgJ2cnKTtcblx0XHRjb25zdCByZXBsYWNlU3RyID0gJ3RleHR1cmUnO1xuXG5cdFx0dGhpcy5fX3JlcGxhY2VMaW5lKHNwbGl0dGVkU2hhZGVyQ29kZSwgcmVnLCAnJDEnICsgcmVwbGFjZVN0ciArICckMycpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEZpbmQgdGhlICd0ZXh0dXJlMkQnIG1ldGhvZCBpbiB0aGUgc2hhZGVyIGNvZGUgYW5kIHJlcGxhY2UgaXQgd2l0aCB0aGUgR0xTTCBFUzMgbWV0aG9kKCd0ZXh0dXJlJylcblx0ICogVGhpcyBtZXRob2QgZGlyZWN0bHkgcmVwbGFjZSB0aGUgZWxlbWVudHMgb2YgdGhlIHNwbGl0dGVkU2hhZGVyQ29kZSB2YXJpYWJsZS5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fY29udmVydFRleHR1cmUyRChzcGxpdHRlZFNoYWRlckNvZGU6IHN0cmluZ1tdKSB7XG5cdFx0Y29uc3Qgc2JsID0gdGhpcy5fX3JlZ1N5bWJvbHMoKTtcblx0XHRjb25zdCByZWcgPSBuZXcgUmVnRXhwKGAoJHtzYmx9KykodGV4dHVyZTJEKSgke3NibH0rKWAsICdnJyk7XG5cdFx0Y29uc3QgcmVwbGFjZVN0ciA9ICd0ZXh0dXJlJztcblxuXHRcdHRoaXMuX19yZXBsYWNlTGluZShzcGxpdHRlZFNoYWRlckNvZGUsIHJlZywgJyQxJyArIHJlcGxhY2VTdHIgKyAnJDMnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBGaW5kIHRoZSAndGV4dHVyZTJEUHJvaicgbWV0aG9kIGluIHRoZSBzaGFkZXIgY29kZSBhbmQgcmVwbGFjZSBpdCB3aXRoIHRoZSBHTFNMIEVTMyBtZXRob2QoJ3RleHR1cmVQcm9qJylcblx0ICogVGhpcyBtZXRob2QgZGlyZWN0bHkgcmVwbGFjZSB0aGUgZWxlbWVudHMgb2YgdGhlIHNwbGl0dGVkU2hhZGVyQ29kZSB2YXJpYWJsZS5cblx0ICovXG5cdHByaXZhdGUgc3RhdGljIF9fY29udmVydFRleHR1cmUyRFByb2Qoc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSkge1xuXHRcdGNvbnN0IHNibCA9IHRoaXMuX19yZWdTeW1ib2xzKCk7XG5cdFx0Y29uc3QgcmVnID0gbmV3IFJlZ0V4cChgKCR7c2JsfSspKHRleHR1cmUyRFByb2opKCR7c2JsfSspYCwgJ2cnKTtcblx0XHRjb25zdCByZXBsYWNlU3RyID0gJ3RleHR1cmVQcm9qJztcblxuXHRcdHRoaXMuX19yZXBsYWNlTGluZShzcGxpdHRlZFNoYWRlckNvZGUsIHJlZywgJyQxJyArIHJlcGxhY2VTdHIgKyAnJDMnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBGaW5kIHRoZSAndGV4dHVyZTNEJyBtZXRob2QgaW4gdGhlIHNoYWRlciBjb2RlIGFuZCByZXBsYWNlIGl0IHdpdGggdGhlIEdMU0wgRVMzIG1ldGhvZCgndGV4dHVyZScpXG5cdCAqIFRoaXMgbWV0aG9kIGRpcmVjdGx5IHJlcGxhY2UgdGhlIGVsZW1lbnRzIG9mIHRoZSBzcGxpdHRlZFNoYWRlckNvZGUgdmFyaWFibGUuXG5cdCAqL1xuXHRwcml2YXRlIHN0YXRpYyBfX2NvbnZlcnRUZXh0dXJlM0Qoc3BsaXR0ZWRTaGFkZXJDb2RlOiBzdHJpbmdbXSkge1xuXHRcdGNvbnN0IHNibCA9IHRoaXMuX19yZWdTeW1ib2xzKCk7XG5cdFx0Y29uc3QgcmVnID0gbmV3IFJlZ0V4cChgKCR7c2JsfSspKHRleHR1cmUzRCkoJHtzYmx9KylgLCAnZycpO1xuXHRcdGNvbnN0IHJlcGxhY2VTdHIgPSAndGV4dHVyZSc7XG5cblx0XHR0aGlzLl9fcmVwbGFjZUxpbmUoc3BsaXR0ZWRTaGFkZXJDb2RlLCByZWcsICckMScgKyByZXBsYWNlU3RyICsgJyQzJyk7XG5cdH1cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogRmluZCB0aGUgJ3RleHR1cmUzRFByb2onIG1ldGhvZCBpbiB0aGUgc2hhZGVyIGNvZGUgYW5kIHJlcGxhY2UgaXQgd2l0aCB0aGUgR0xTTCBFUzMgbWV0aG9kKCd0ZXh0dXJlUHJvaicpXG5cdCAqIFRoaXMgbWV0aG9kIGRpcmVjdGx5IHJlcGxhY2UgdGhlIGVsZW1lbnRzIG9mIHRoZSBzcGxpdHRlZFNoYWRlckNvZGUgdmFyaWFibGUuXG5cdCAqL1xuXHRwcml2YXRlIHN0YXRpYyBfX2NvbnZlcnRUZXh0dXJlM0RQcm9kKHNwbGl0dGVkU2hhZGVyQ29kZTogc3RyaW5nW10pIHtcblx0XHRjb25zdCBzYmwgPSB0aGlzLl9fcmVnU3ltYm9scygpO1xuXHRcdGNvbnN0IHJlZyA9IG5ldyBSZWdFeHAoYCgke3NibH0rKSh0ZXh0dXJlM0RQcm9qKSgke3NibH0rKWAsICdnJyk7XG5cdFx0Y29uc3QgcmVwbGFjZVN0ciA9ICd0ZXh0dXJlUHJvaic7XG5cblx0XHR0aGlzLl9fcmVwbGFjZUxpbmUoc3BsaXR0ZWRTaGFkZXJDb2RlLCByZWcsICckMScgKyByZXBsYWNlU3RyICsgJyQzJyk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBfX3JlZ1N5bWJvbHMoKSB7XG5cdFx0cmV0dXJuIGBbIVwiIyQlJicoKVxcKlxcK1xcLVxcLixcXC86Ozw9Pj9AXFxbXFxcXFxcXV5gICsgJ2B7fH1+XFx0XFxuIF0nO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgX19yZXBsYWNlTGluZShzcGxpdHRlZFNoYWRlckNvZGU6IHN0cmluZ1tdLCByZWc6IFJlZ0V4cCwgcmVwbGFjZW1lbnQ6IGFueSkge1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc3BsaXR0ZWRTaGFkZXJDb2RlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRzcGxpdHRlZFNoYWRlckNvZGVbaV0gPSBzcGxpdHRlZFNoYWRlckNvZGVbaV0ucmVwbGFjZShyZWcsIHJlcGxhY2VtZW50KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBfX3JlbW92ZUZpcnN0TWF0Y2hpbmdMaW5lKHNwbGl0dGVkU2hhZGVyQ29kZTogc3RyaW5nW10sIHJlZzogUmVnRXhwKSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzcGxpdHRlZFNoYWRlckNvZGUubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChzcGxpdHRlZFNoYWRlckNvZGVbaV0ubWF0Y2gocmVnKSkge1xuXHRcdFx0XHRzcGxpdHRlZFNoYWRlckNvZGUuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBfX291dEVycm9yKFxuXHRcdHNwbGl0dGVkU2hhZGVyQ29kZTogc3RyaW5nW10sXG5cdFx0bGluZUluZGV4OiBudW1iZXIsXG5cdFx0ZXJyb3JNZXNzYWdlOiBzdHJpbmcsXG5cdFx0ZW1iZWRFcnJvcnNJbk91dHB1dDogYm9vbGVhblxuXHQpIHtcblx0XHRpZiAoZW1iZWRFcnJvcnNJbk91dHB1dCkge1xuXHRcdFx0Y29uc3Qgc2hhZGVyT3V0cHV0TWVzc2FnZSA9IGAvLyBsaW5lICR7bGluZUluZGV4fTogJHtlcnJvck1lc3NhZ2V9XFxuYDtcblx0XHRcdGNvbnN0IGNsb3NlQnJhY2tldFJlZyA9IC8oLiopXFx9W1xcblxcdCBdKiQvO1xuXHRcdFx0Zm9yIChsZXQgaSA9IHNwbGl0dGVkU2hhZGVyQ29kZS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRjb25zdCBsaW5lID0gc3BsaXR0ZWRTaGFkZXJDb2RlW2ldO1xuXHRcdFx0XHRpZiAobGluZS5tYXRjaChjbG9zZUJyYWNrZXRSZWcpKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoc3BsaXR0ZWRTaGFkZXJDb2RlW2ldID09PSBzaGFkZXJPdXRwdXRNZXNzYWdlKSB7XG5cdFx0XHRcdFx0Ly8gYXZvaWQgZHVwbGljYXRlIGVycm9yIG1lc3NhZ2Vcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Y29uc29sZS5lcnJvcihlcnJvck1lc3NhZ2UpO1xuXHRcdFx0c3BsaXR0ZWRTaGFkZXJDb2RlLnB1c2goc2hhZGVyT3V0cHV0TWVzc2FnZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpO1xuXHRcdH1cblx0fVxufVxuIiwgImltcG9ydCBSZWZsZWN0aW9uIGZyb20gJy4vUmVmbGVjdGlvbic7XG5pbXBvcnQge1NoYWRlcml0eU9iamVjdCwgU2hhZGVyU3RhZ2VTdHIsIFNoYWRlclZlcnNpb24sIFRlbXBsYXRlT2JqZWN0fSBmcm9tICcuLi90eXBlcy90eXBlJztcbmltcG9ydCBTaGFkZXJUcmFuc2Zvcm1lciBmcm9tICcuL1NoYWRlclRyYW5zZm9ybWVyJztcbmltcG9ydCBTaGFkZXJFZGl0b3IgZnJvbSAnLi9TaGFkZXJFZGl0b3InO1xuaW1wb3J0IFV0aWxpdHkgZnJvbSAnLi9VdGlsaXR5JztcbmltcG9ydCBTaGFkZXJpdHlPYmplY3RDcmVhdG9yIGZyb20gJy4vU2hhZGVyaXR5T2JqZWN0Q3JlYXRvcic7XG5pbXBvcnQgUHJlUHJvY2Vzc29yIGZyb20gJy4vUHJlUHJvY2Vzc29yJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2hhZGVyaXR5IHtcblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdC8vIHNoYWRlciB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbnNcblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblx0LyoqXG5cdCAqIFRyYW5zbGF0ZSBhIEdMU0wgRVMzIHNoYWRlciBjb2RlIHRvIGEgR0xTTCBFUzEgc2hhZGVyIGNvZGVcblx0ICogQHBhcmFtIG9iaiBTaGFkZXJpdHkgb2JqZWN0IHRvIHRyYW5zbGF0ZSB0byBnbHNsIGVzMVxuXHQgKiBAcGFyYW0gZW1iZWRFcnJvcnNJbk91dHB1dCBJZiB0cnVlLCB3aGVuIHRoZXJlIGlzIGFuIGVycm9yIGluIHRoZSBjb252ZXJzaW9uLFxuXHQgKiAgICB0aGUgZXJyb3IgYW5kIHRoZSBudW1iZXIgb2YgbGluZXMgYXJlIG91dHB1dCBhdCB0aGUgYm90dG9tIG9mIHRoZSByZXR1cm5cblx0ICogICAgdmFsdWUgU2hhZGVyaXR5T2JqZWN0LmNvZGUuIElmIGZhbHNlLCB0aHJvdyBhbiBlcnJvci5cblx0ICogQHJldHVybnMgU2hhZGVyaXR5T2JqZWN0IHdob3NlIGNvZGUgcHJvcGVydHkgaXMgdGhlIHNoYWRlciBjb2RlIGZvciBHTFNMIEVTMVxuXHQgKi9cblx0cHVibGljIHN0YXRpYyB0cmFuc2Zvcm1Ub0dMU0xFUzEob2JqOiBTaGFkZXJpdHlPYmplY3QsIGVtYmVkRXJyb3JzSW5PdXRwdXQgPSBmYWxzZSkge1xuXHRcdGNvbnN0IHNwbGl0dGVkU2hhZGVyQ29kZSA9IFV0aWxpdHkuX3NwbGl0QnlMaW5lRmVlZENvZGUob2JqLmNvZGUpO1xuXG5cdFx0Y29uc3QgdHJhbnNmb3JtZWRTcGxpdHRlZFNoYWRlckNvZGVcblx0XHRcdD0gU2hhZGVyVHJhbnNmb3JtZXIuX3RyYW5zZm9ybVRvR0xTTEVTMShcblx0XHRcdFx0c3BsaXR0ZWRTaGFkZXJDb2RlLFxuXHRcdFx0XHRvYmouaXNGcmFnbWVudFNoYWRlcixcblx0XHRcdFx0ZW1iZWRFcnJvcnNJbk91dHB1dFxuXHRcdFx0KTtcblx0XHRjb25zdCByZXN1bHRDb2RlID0gVXRpbGl0eS5fam9pblNwbGl0dGVkTGluZSh0cmFuc2Zvcm1lZFNwbGl0dGVkU2hhZGVyQ29kZSk7XG5cblx0XHRjb25zdCByZXN1bHRPYmo6IFNoYWRlcml0eU9iamVjdCA9IHtcblx0XHRcdGNvZGU6IHJlc3VsdENvZGUsXG5cdFx0XHRzaGFkZXJTdGFnZTogb2JqLnNoYWRlclN0YWdlLFxuXHRcdFx0aXNGcmFnbWVudFNoYWRlcjogb2JqLmlzRnJhZ21lbnRTaGFkZXIsXG5cdFx0fTtcblxuXHRcdHJldHVybiByZXN1bHRPYmo7XG5cdH1cblxuXHQvKipcblx0ICogVHJhbnNsYXRlIGEgR0xTTCBFUzEgc2hhZGVyIGNvZGUgdG8gYSBHTFNMIEVTMyBzaGFkZXIgY29kZVxuXHQgKi9cblx0cHVibGljIHN0YXRpYyB0cmFuc2Zvcm1Ub0dMU0xFUzMob2JqOiBTaGFkZXJpdHlPYmplY3QpIHtcblx0XHRjb25zdCBzcGxpdHRlZFNoYWRlckNvZGUgPSBVdGlsaXR5Ll9zcGxpdEJ5TGluZUZlZWRDb2RlKG9iai5jb2RlKTtcblxuXHRcdGNvbnN0IHRyYW5zZm9ybWVkU3BsaXR0ZWRTaGFkZXJDb2RlXG5cdFx0XHQ9IFNoYWRlclRyYW5zZm9ybWVyLl90cmFuc2Zvcm1Ub0dMU0xFUzMoc3BsaXR0ZWRTaGFkZXJDb2RlLCBvYmouaXNGcmFnbWVudFNoYWRlcik7XG5cdFx0Y29uc3QgcmVzdWx0Q29kZSA9IFV0aWxpdHkuX2pvaW5TcGxpdHRlZExpbmUodHJhbnNmb3JtZWRTcGxpdHRlZFNoYWRlckNvZGUpO1xuXG5cdFx0Y29uc3QgcmVzdWx0T2JqOiBTaGFkZXJpdHlPYmplY3QgPSB7XG5cdFx0XHRjb2RlOiByZXN1bHRDb2RlLFxuXHRcdFx0c2hhZGVyU3RhZ2U6IG9iai5zaGFkZXJTdGFnZSxcblx0XHRcdGlzRnJhZ21lbnRTaGFkZXI6IG9iai5pc0ZyYWdtZW50U2hhZGVyLFxuXHRcdH07XG5cblx0XHRyZXR1cm4gcmVzdWx0T2JqO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRyYW5zbGF0ZSBhIEdMU0wgc2hhZGVyIGNvZGUgdG8gYSBzaGFkZXIgY29kZSBvZiBzcGVjaWZpZWQgR0xTTCB2ZXJzaW9uXG5cdCAqL1xuXHRwdWJsaWMgc3RhdGljIHRyYW5zZm9ybVRvKHZlcnNpb246IFNoYWRlclZlcnNpb24sIG9iajogU2hhZGVyaXR5T2JqZWN0LCBlbWJlZEVycm9yc0luT3V0cHV0ID0gZmFsc2UpIHtcblx0XHRjb25zdCBzcGxpdHRlZFNoYWRlckNvZGUgPSBVdGlsaXR5Ll9zcGxpdEJ5TGluZUZlZWRDb2RlKG9iai5jb2RlKTtcblxuXHRcdGNvbnN0IHRyYW5zZm9ybWVkU3BsaXR0ZWRTaGFkZXJDb2RlXG5cdFx0XHQ9IFNoYWRlclRyYW5zZm9ybWVyLl90cmFuc2Zvcm1Ubyhcblx0XHRcdFx0dmVyc2lvbixcblx0XHRcdFx0c3BsaXR0ZWRTaGFkZXJDb2RlLFxuXHRcdFx0XHRvYmouaXNGcmFnbWVudFNoYWRlcixcblx0XHRcdFx0ZW1iZWRFcnJvcnNJbk91dHB1dFxuXHRcdFx0KTtcblx0XHRjb25zdCByZXN1bHRDb2RlID0gVXRpbGl0eS5fam9pblNwbGl0dGVkTGluZSh0cmFuc2Zvcm1lZFNwbGl0dGVkU2hhZGVyQ29kZSk7XG5cblx0XHRjb25zdCByZXN1bHRPYmo6IFNoYWRlcml0eU9iamVjdCA9IHtcblx0XHRcdGNvZGU6IHJlc3VsdENvZGUsXG5cdFx0XHRzaGFkZXJTdGFnZTogb2JqLnNoYWRlclN0YWdlLFxuXHRcdFx0aXNGcmFnbWVudFNoYWRlcjogb2JqLmlzRnJhZ21lbnRTaGFkZXIsXG5cdFx0fTtcblxuXHRcdHJldHVybiByZXN1bHRPYmo7XG5cdH1cblxuXHRwdWJsaWMgc3RhdGljIHByb2Nlc3NQcmFnbWEob2JqOiBTaGFkZXJpdHlPYmplY3QsIHJlbWFpbkRlZmluZTogYm9vbGVhbiwgZGVmaW5pdGlvbnM6IHN0cmluZ1tdID0gW10sIHN0YXJ0TGluZVN0cj86IHN0cmluZywgZW5kTGluZVN0cj86IHN0cmluZykge1xuXHRcdGNvbnN0IHNwbGl0dGVkU2hhZGVyQ29kZSA9IFV0aWxpdHkuX3NwbGl0QnlMaW5lRmVlZENvZGUob2JqLmNvZGUpO1xuXG5cdFx0Y29uc3QgdHJhbnNmb3JtZWRTcGxpdHRlZFNoYWRlckNvZGVcblx0XHRcdD0gUHJlUHJvY2Vzc29yLnByb2Nlc3Moc3BsaXR0ZWRTaGFkZXJDb2RlLCByZW1haW5EZWZpbmUsIGRlZmluaXRpb25zLCBzdGFydExpbmVTdHIsIGVuZExpbmVTdHIpO1xuXG5cdFx0Y29uc3QgcmVzdWx0Q29kZSA9IFV0aWxpdHkuX2pvaW5TcGxpdHRlZExpbmUodHJhbnNmb3JtZWRTcGxpdHRlZFNoYWRlckNvZGUpO1xuXG5cdFx0Y29uc3QgcmVzdWx0T2JqOiBTaGFkZXJpdHlPYmplY3QgPSB7XG5cdFx0XHRjb2RlOiByZXN1bHRDb2RlLFxuXHRcdFx0c2hhZGVyU3RhZ2U6IG9iai5zaGFkZXJTdGFnZSxcblx0XHRcdGlzRnJhZ21lbnRTaGFkZXI6IG9iai5pc0ZyYWdtZW50U2hhZGVyLFxuXHRcdH07XG5cblx0XHRyZXR1cm4gcmVzdWx0T2JqO1xuXHR9XG5cblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdC8vIHNoYWRlcml0eSBvYmplY3QgY3JlYXRpb24gZnVuY3Rpb25zXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYW4gaW5zdGFuY2UgdG8gY3JlYXRlIHNoYWRlcml0eSBvYmplY3QuXG5cdCAqL1xuXHRwdWJsaWMgc3RhdGljIGNyZWF0ZVNoYWRlcml0eU9iamVjdENyZWF0b3Ioc2hhZGVyU3RhZ2U6IFNoYWRlclN0YWdlU3RyKTogU2hhZGVyaXR5T2JqZWN0Q3JlYXRvciB7XG5cdFx0cmV0dXJuIG5ldyBTaGFkZXJpdHlPYmplY3RDcmVhdG9yKHNoYWRlclN0YWdlKTtcblx0fVxuXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQvLyBzaGFkZXIgZWRpdCBmdW5jdGlvbnNcblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblx0LyoqXG5cdCAqIEZpbmQgdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBwYXR0ZXJuIGluIHRoZSBzaGFkZXIgY29kZSBhbmQgcmVwbGFjZSBrZXkgdG8gdmFsdWVcblx0ICogQHBhcmFtIHRlbXBsYXRlT2JqZWN0IEFuIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIHN0cmluZyBiZWZvcmUgYW5kIGFmdGVyIHRoZSByZXBsYWNlbWVudFxuXHQgKiBUaGUga2V5IGNhbiBiZSBhIHN0cmluZyBvciBhbiBvYmplY3QuIElmIGFuIG9iamVjdCBpcyB1c2VkIGFzIHRoZSBrZXksXG5cdCAqIHRoZSBrZXkgaW4gdGhlIHBhdHRlcm4gb2Ygc2hhZGVyQ29kZSBtdXN0IGFsc28gbWF0Y2ggdGhlIG9iamVjdC5cblx0ICogRm9yIGV4YW1wbGUsIGlmIHRlbXBsYXRlT2JqZWN0IGlzXG5cdFx0e1xuXHRcdFx0c2FtcGxlIHtcblx0XHRcdFx0c2FtcGxlQTogMFxuXHRcdFx0fVxuXHRcdH1cblx0ICogdGhlbiB0aGUga2V5IGluIGEgc2hhZGVyIGNvZGUgaXMgc2FtcGxlLnNhbXBsZUEuXG5cdCAqL1xuXHQvLyBUaGUgdGVtcGxhdGUgcGF0dGVybiBpc1x0Lyogc2hhZGVyaXR5OiBAe2tleX0gKi9cblx0cHVibGljIHN0YXRpYyBmaWxsVGVtcGxhdGUob2JqOiBTaGFkZXJpdHlPYmplY3QsIGFyZzogVGVtcGxhdGVPYmplY3QpIHtcblx0XHRjb25zdCBjb3B5ID0gdGhpcy5fX2NvcHlTaGFkZXJpdHlPYmplY3Qob2JqKTtcblxuXHRcdGNvcHkuY29kZSA9IFNoYWRlckVkaXRvci5fZmlsbFRlbXBsYXRlKGNvcHkuY29kZSwgYXJnKTtcblxuXHRcdHJldHVybiBjb3B5O1xuXHR9XG5cblx0LyoqXG5cdCAqIEluc2VydCBkZWZpbmUgZGlyZWN0aXZlXG5cdCAqL1xuXHRwdWJsaWMgc3RhdGljIGluc2VydERlZmluaXRpb24ob2JqOiBTaGFkZXJpdHlPYmplY3QsIGRlZmluaXRpb246IHN0cmluZykge1xuXHRcdGNvbnN0IGNvcHkgPSB0aGlzLl9fY29weVNoYWRlcml0eU9iamVjdChvYmopO1xuXHRcdGNvbnN0IHNwbGl0dGVkU2hhZGVyQ29kZSA9IFV0aWxpdHkuX3NwbGl0QnlMaW5lRmVlZENvZGUob2JqLmNvZGUpO1xuXG5cdFx0U2hhZGVyRWRpdG9yLl9pbnNlcnREZWZpbml0aW9uKHNwbGl0dGVkU2hhZGVyQ29kZSwgZGVmaW5pdGlvbik7XG5cdFx0Y29weS5jb2RlID0gVXRpbGl0eS5fam9pblNwbGl0dGVkTGluZShzcGxpdHRlZFNoYWRlckNvZGUpO1xuXG5cdFx0cmV0dXJuIGNvcHk7XG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Ly8gcmVmbGVjdGlvbiBmdW5jdGlvbnNcblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhbiBpbnN0YW5jZSB0byBnZXQgdGhlIGF0dHJpYnV0ZSwgdmFyeWluZywgYW5kIHVuaWZvcm0gaW5mb3JtYXRpb24gZnJvbSBhIHNoYWRlciBjb2RlIG9mIHRoZSBzaGFkZXJpdHkuXG5cdCAqIFRvIGdldCB0aGVzZSBpbmZvcm1hdGlvbiwgeW91IG5lZWQgdG8gY2FsbCByZWZsZWN0aW9uLnJlZmxlY3QgbWV0aG9kLlxuXHQgKi9cblx0cHVibGljIHN0YXRpYyBjcmVhdGVSZWZsZWN0aW9uT2JqZWN0KG9iajogU2hhZGVyaXR5T2JqZWN0KTogUmVmbGVjdGlvbiB7XG5cdFx0Y29uc3Qgc3BsaXR0ZWRTaGFkZXJDb2RlID0gVXRpbGl0eS5fc3BsaXRCeUxpbmVGZWVkQ29kZShvYmouY29kZSk7XG5cblx0XHRjb25zdCByZWZsZWN0aW9uID0gbmV3IFJlZmxlY3Rpb24oc3BsaXR0ZWRTaGFkZXJDb2RlLCBvYmouc2hhZGVyU3RhZ2UpO1xuXHRcdHJldHVybiByZWZsZWN0aW9uO1xuXHR9XG5cblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdC8vIHByaXZhdGUgZnVuY3Rpb25zXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cdHByaXZhdGUgc3RhdGljIF9fY29weVNoYWRlcml0eU9iamVjdChvYmo6IFNoYWRlcml0eU9iamVjdCkge1xuXHRcdGNvbnN0IGNvcGllZE9iajogU2hhZGVyaXR5T2JqZWN0ID0ge1xuXHRcdFx0Y29kZTogb2JqLmNvZGUsXG5cdFx0XHRzaGFkZXJTdGFnZTogb2JqLnNoYWRlclN0YWdlLFxuXHRcdFx0aXNGcmFnbWVudFNoYWRlcjogb2JqLmlzRnJhZ21lbnRTaGFkZXIsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvcGllZE9iajtcblx0fVxufVxuIiwgImltcG9ydCB7XG5cdFNoYWRlckNvbnN0YW50VmFsdWVPYmplY3QsXG5cdFNoYWRlckV4dGVuc2lvbkJlaGF2aW9yLFxuXHRTaGFkZXJFeHRlbnNpb25PYmplY3QsXG5cdFNoYWRlcml0eU9iamVjdCxcblx0U2hhZGVyQ29uc3RhbnRWYWx1ZVZhclR5cGVFUzMsXG5cdFNoYWRlclByZWNpc2lvbk9iamVjdCxcblx0U2hhZGVyUHJlY2lzaW9uT2JqZWN0S2V5LFxuXHRTaGFkZXJTdGFnZVN0cixcblx0U2hhZGVyQXR0cmlidXRlT2JqZWN0LFxuXHRTaGFkZXJQcmVjaXNpb25UeXBlLFxuXHRTaGFkZXJBdHRyaWJ1dGVWYXJUeXBlLFxuXHRTaGFkZXJWYXJ5aW5nT2JqZWN0LFxuXHRTaGFkZXJWYXJ5aW5nSW50ZXJwb2xhdGlvblR5cGUsXG5cdFNoYWRlclZhcnlpbmdWYXJUeXBlLFxuXHRTaGFkZXJVbmlmb3JtT2JqZWN0LFxuXHRTaGFkZXJVbmlmb3JtVmFyVHlwZUVTMyxcblx0U2hhZGVyU3RydWN0RGVmaW5pdGlvbk9iamVjdCxcblx0U2hhZGVyU3RydWN0TWVtYmVyT2JqZWN0LFxuXHRTaGFkZXJDb25zdGFudFN0cnVjdFZhbHVlT2JqZWN0LFxuXHRTaGFkZXJVbmlmb3JtU3RydWN0T2JqZWN0LFxuXHRTaGFkZXJVbmlmb3JtQnVmZmVyT2JqZWN0LFxuXHRTaGFkZXJVQk9WYXJpYWJsZU9iamVjdCxcblx0U2hhZGVyRnVuY3Rpb25PYmplY3QsXG59IGZyb20gJy4uL3R5cGVzL3R5cGUnO1xuaW1wb3J0IFV0aWxpdHkgZnJvbSAnLi9VdGlsaXR5JztcblxuLyoqXG4gKiBUaGlzIGNsYXNzIGNyZWF0ZXMgYSBzaGFkZXJpdHkgb2JqZWN0LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTaGFkZXJpdHlPYmplY3RDcmVhdG9yIHtcblx0cHJpdmF0ZSBfX3NoYWRlclN0YWdlOiBTaGFkZXJTdGFnZVN0cjtcblx0cHJpdmF0ZSBfX2Z1bmN0aW9uSWRDb3VudCA9IDA7XG5cblx0cHJpdmF0ZSBfX2RlZmluZURpcmVjdGl2ZU5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIF9fZXh0ZW5zaW9uczogU2hhZGVyRXh0ZW5zaW9uT2JqZWN0W10gPSBbXTtcblx0cHJpdmF0ZSBfX2dsb2JhbFByZWNpc2lvbjogU2hhZGVyUHJlY2lzaW9uT2JqZWN0ID0ge1xuXHRcdGludDogJ2hpZ2hwJyxcblx0XHRmbG9hdDogJ2hpZ2hwJyxcblx0XHRzYW1wbGVyMkQ6ICdoaWdocCcsXG5cdFx0c2FtcGxlckN1YmU6ICdoaWdocCcsXG5cdFx0c2FtcGxlcjNEOiAnaGlnaHAnLFxuXHRcdHNhbXBsZXIyREFycmF5OiAnaGlnaHAnLFxuXHRcdGlzYW1wbGVyMkQ6ICdoaWdocCcsXG5cdFx0aXNhbXBsZXJDdWJlOiAnaGlnaHAnLFxuXHRcdGlzYW1wbGVyM0Q6ICdoaWdocCcsXG5cdFx0aXNhbXBsZXIyREFycmF5OiAnaGlnaHAnLFxuXHRcdHVzYW1wbGVyMkQ6ICdoaWdocCcsXG5cdFx0dXNhbXBsZXJDdWJlOiAnaGlnaHAnLFxuXHRcdHVzYW1wbGVyM0Q6ICdoaWdocCcsXG5cdFx0dXNhbXBsZXIyREFycmF5OiAnaGlnaHAnLFxuXHRcdHNhbXBsZXIyRFNoYWRvdzogJ2hpZ2hwJyxcblx0XHRzYW1wbGVyQ3ViZVNoYWRvdzogJ2hpZ2hwJyxcblx0XHRzYW1wbGVyMkRBcnJheVNoYWRvdzogJ2hpZ2hwJyxcblx0fTtcblx0cHJpdmF0ZSBfX3N0cnVjdERlZmluaXRpb25zOiBTaGFkZXJTdHJ1Y3REZWZpbml0aW9uT2JqZWN0W10gPSBbXTtcblx0cHJpdmF0ZSBfX2dsb2JhbENvbnN0YW50VmFsdWVzOiBTaGFkZXJDb25zdGFudFZhbHVlT2JqZWN0W10gPSBbXTtcblx0cHJpdmF0ZSBfX2dsb2JhbENvbnN0YW50U3RydWN0VmFsdWVzOiBTaGFkZXJDb25zdGFudFN0cnVjdFZhbHVlT2JqZWN0W10gPSBbXTtcblx0cHJpdmF0ZSBfX2F0dHJpYnV0ZXM6IFNoYWRlckF0dHJpYnV0ZU9iamVjdFtdID0gW107IC8vIGZvciB2ZXJ0ZXggc2hhZGVyIG9ubHlcblx0cHJpdmF0ZSBfX3ZhcnlpbmdzOiBTaGFkZXJWYXJ5aW5nT2JqZWN0W10gPSBbXTtcblx0cHJpdmF0ZSBfX3VuaWZvcm1zOiBTaGFkZXJVbmlmb3JtT2JqZWN0W10gPSBbXTtcblx0cHJpdmF0ZSBfX3VuaWZvcm1TdHJ1Y3RzOiBTaGFkZXJVbmlmb3JtU3RydWN0T2JqZWN0W10gPSBbXTtcblx0cHJpdmF0ZSBfX3VuaWZvcm1CdWZmZXJPYmplY3RzOiBTaGFkZXJVbmlmb3JtQnVmZmVyT2JqZWN0W10gPSBbXTtcblx0cHJpdmF0ZSBfX2Z1bmN0aW9uczogU2hhZGVyRnVuY3Rpb25PYmplY3RbXVtdID0gW107IC8vIGZpcnN0IGluZGV4IHJlcHJlc2VudCBkZXBlbmRlbmN5IGxldmVsXG5cdHByaXZhdGUgX19tYWluRnVuY3Rpb25Db2RlOiBzdHJpbmcgPSAndm9pZCBtYWluKCkge30nO1xuXHRwcml2YXRlIF9fb3V0cHV0Q29sb3JWYXJpYWJsZU5hbWU6IHN0cmluZyA9ICdyZW5kZXJUYXJnZXQwJzsgLy8gZm9yIGZyYWdtZW50IHNoYWRlciBvbmx5XG5cblx0Y29uc3RydWN0b3Ioc2hhZGVyU3RhZ2U6IFNoYWRlclN0YWdlU3RyKSB7XG5cdFx0dGhpcy5fX3NoYWRlclN0YWdlID0gc2hhZGVyU3RhZ2U7XG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Ly8gYWRkIHBhcmFtZXRlcnMgZnVuY3Rpb25zXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cdHB1YmxpYyBhZGREZWZpbmVEaXJlY3RpdmUoZGVmaW5lRGlyZWN0aXZlTmFtZTogc3RyaW5nKSB7XG5cdFx0Y29uc3QgaXNEdXBsaWNhdGUgPVxuXHRcdFx0dGhpcy5fX2RlZmluZURpcmVjdGl2ZU5hbWVzLnNvbWUobmFtZSA9PiBuYW1lID09PSBkZWZpbmVEaXJlY3RpdmVOYW1lKTtcblx0XHRpZiAoaXNEdXBsaWNhdGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignYWRkRGVmaW5lRGlyZWN0aXZlOiB0aGlzIGRlZmluZSBkaXJlY3RpdmUgaXMgYWxyZWFkeSBzZXQnKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9fZGVmaW5lRGlyZWN0aXZlTmFtZXMucHVzaChkZWZpbmVEaXJlY3RpdmVOYW1lKTtcblx0fVxuXG5cdHB1YmxpYyBhZGRFeHRlbnNpb24oZXh0ZW5zaW9uTmFtZTogc3RyaW5nLCBiZWhhdmlvcjogU2hhZGVyRXh0ZW5zaW9uQmVoYXZpb3IgPSAnZW5hYmxlJykge1xuXHRcdGNvbnN0IGlzRHVwbGljYXRlID1cblx0XHRcdHRoaXMuX19leHRlbnNpb25zLnNvbWUoZXh0ZW5zaW9uID0+IGV4dGVuc2lvbi5leHRlbnNpb25OYW1lID09PSBleHRlbnNpb25OYW1lKTtcblx0XHRpZiAoaXNEdXBsaWNhdGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignYWRkRXh0ZW5zaW9uOiB0aGlzIGV4dGVuc2lvbiBpcyBhbHJlYWR5IHNldCcpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX19leHRlbnNpb25zLnB1c2goe1xuXHRcdFx0ZXh0ZW5zaW9uTmFtZSxcblx0XHRcdGJlaGF2aW9yXG5cdFx0fSk7XG5cdH1cblxuXHQvLyBvbmx5IGRlZmluZSB0eXBlc1xuXHRwdWJsaWMgYWRkU3RydWN0RGVmaW5pdGlvbihzdHJ1Y3ROYW1lOiBzdHJpbmcsIG1lbWJlck9iamVjdHM6IFNoYWRlclN0cnVjdE1lbWJlck9iamVjdFtdKSB7XG5cdFx0Y29uc3QgaXNEdXBsaWNhdGUgPVxuXHRcdFx0dGhpcy5fX3N0cnVjdERlZmluaXRpb25zLnNvbWUoc3RydWN0RGVmaW5pdGlvbiA9PiBzdHJ1Y3REZWZpbml0aW9uLnN0cnVjdE5hbWUgPT09IHN0cnVjdE5hbWUpO1xuXHRcdGlmIChpc0R1cGxpY2F0ZSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihgYWRkU3RydWN0RGVmaW5pdGlvbjogZHVwbGljYXRlIHN0cnVjdCB0eXBlIG5hbWUgJHtzdHJ1Y3ROYW1lfWApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX19zdHJ1Y3REZWZpbml0aW9ucy5wdXNoKHtcblx0XHRcdHN0cnVjdE5hbWUsXG5cdFx0XHRtZW1iZXJPYmplY3RzLFxuXHRcdH0pO1xuXHR9XG5cblx0cHVibGljIGFkZEdsb2JhbENvbnN0YW50VmFsdWUodmFyaWFibGVOYW1lOiBzdHJpbmcsIHR5cGU6IFNoYWRlckNvbnN0YW50VmFsdWVWYXJUeXBlRVMzLCB2YWx1ZXM6IG51bWJlcltdKSB7XG5cdFx0Y29uc3QgaXNEdXBsaWNhdGUgPVxuXHRcdFx0dGhpcy5fX2dsb2JhbENvbnN0YW50VmFsdWVzLnNvbWUoZ2xvYmFsQ29uc3RhbnRWYWx1ZSA9PiBnbG9iYWxDb25zdGFudFZhbHVlLnZhcmlhYmxlTmFtZSA9PT0gdmFyaWFibGVOYW1lKTtcblx0XHRpZiAoaXNEdXBsaWNhdGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYGFkZEdsb2JhbENvbnN0YW50VmFsdWU6IGR1cGxpY2F0ZSB2YXJpYWJsZSBuYW1lICR7dmFyaWFibGVOYW1lfWApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGlzVmFsaWRDb21wb25lbnROdW1iZXIgPSBVdGlsaXR5Ll9pc1ZhbGlkQ29tcG9uZW50Q291bnQodHlwZSwgdmFsdWVzKTtcblx0XHRpZiAoIWlzVmFsaWRDb21wb25lbnROdW1iZXIpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYGFkZEdsb2JhbENvbnN0YW50VmFsdWU6IHRoZSBjb21wb25lbnQgY291bnQgb2YgJHt2YXJpYWJsZU5hbWV9IGlzIGludmFsaWRgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBpc0ludFR5cGUgPSBVdGlsaXR5Ll9pc0ludFR5cGUodHlwZSk7XG5cdFx0aWYgKGlzSW50VHlwZSkge1xuXHRcdFx0Y29uc3QgZXhpc3ROb25JbnRlZ2VyVmFsdWUgPSBTaGFkZXJpdHlPYmplY3RDcmVhdG9yLl9fZXhpc3ROb25JbnRlZ2VyVmFsdWUodmFsdWVzKTtcblx0XHRcdGlmIChleGlzdE5vbkludGVnZXJWYWx1ZSkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYGFkZEdsb2JhbENvbnN0YW50VmFsdWU6IG5vbi1pbnRlZ2VyIHZhbHVlIGlzIHNldCB0byAke3ZhcmlhYmxlTmFtZX1gKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLl9fZ2xvYmFsQ29uc3RhbnRWYWx1ZXMucHVzaCh7XG5cdFx0XHR2YXJpYWJsZU5hbWUsXG5cdFx0XHR0eXBlLFxuXHRcdFx0dmFsdWVzLFxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gbmVlZCB0byBkZWZpbmUgc3RydWN0IGJ5IHRoZSBhZGRTdHJ1Y3REZWZpbml0aW9uIG1ldGhvZFxuXHQvLyB2YWxpZGF0ZSB0aGF0IHRoZSBjb3JyZXNwb25kaW5nIHN0cnVjdHVyZSBpcyBkZWZpbmVkIGJ5IHRoZSBfX2NyZWF0ZUdsb2JhbENvbnN0YW50U3RydWN0VmFsdWVTaGFkZXJDb2RlIG1ldGhvZFxuXHRwdWJsaWMgYWRkR2xvYmFsQ29uc3RhbnRTdHJ1Y3RWYWx1ZShzdHJ1Y3ROYW1lOiBzdHJpbmcsIHZhcmlhYmxlTmFtZTogc3RyaW5nLCB2YWx1ZXM6IHtba2V5VmFyaWFibGVOYW1lOiBzdHJpbmddOiBudW1iZXJbXX0pIHtcblx0XHRjb25zdCBpc0R1cGxpY2F0ZSA9XG5cdFx0XHR0aGlzLl9fZ2xvYmFsQ29uc3RhbnRTdHJ1Y3RWYWx1ZXMuc29tZShzdHJ1Y3RWYWx1ZSA9PiBzdHJ1Y3RWYWx1ZS52YXJpYWJsZU5hbWUgPT09IHZhcmlhYmxlTmFtZSk7XG5cdFx0aWYgKGlzRHVwbGljYXRlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBhZGRHbG9iYWxDb25zdGFudFN0cnVjdFZhbHVlOiBkdXBsaWNhdGUgdmFyaWFibGUgbmFtZSAke3ZhcmlhYmxlTmFtZX1gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9fZ2xvYmFsQ29uc3RhbnRTdHJ1Y3RWYWx1ZXMucHVzaCh7XG5cdFx0XHR2YXJpYWJsZU5hbWUsXG5cdFx0XHRzdHJ1Y3ROYW1lLFxuXHRcdFx0dmFsdWVzLFxuXHRcdH0pO1xuXHR9XG5cblx0cHVibGljIGFkZEF0dHJpYnV0ZURlY2xhcmF0aW9uKFxuXHRcdHZhcmlhYmxlTmFtZTogc3RyaW5nLFxuXHRcdHR5cGU6IFNoYWRlckF0dHJpYnV0ZVZhclR5cGUsXG5cdFx0b3B0aW9ucz86IHtcblx0XHRcdHByZWNpc2lvbj86IFNoYWRlclByZWNpc2lvblR5cGUsXG5cdFx0XHRsb2NhdGlvbj86IG51bWJlcixcblx0XHR9XG5cdCkge1xuXHRcdGlmICh0aGlzLl9fc2hhZGVyU3RhZ2UgIT09ICd2ZXJ0ZXgnKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdhZGRBdHRyaWJ1dGU6IHRoaXMgbWV0aG9kIGlzIGZvciB2ZXJ0ZXggc2hhZGVyIG9ubHknKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBpc0R1cGxpY2F0ZSA9XG5cdFx0XHR0aGlzLl9fYXR0cmlidXRlcy5zb21lKGF0dHJpYnV0ZSA9PiBhdHRyaWJ1dGUudmFyaWFibGVOYW1lID09PSB2YXJpYWJsZU5hbWUpO1xuXHRcdGlmIChpc0R1cGxpY2F0ZSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihgYWRkQXR0cmlidXRlOiBkdXBsaWNhdGUgdmFyaWFibGUgbmFtZSAke3ZhcmlhYmxlTmFtZX1gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9fYXR0cmlidXRlcy5wdXNoKHtcblx0XHRcdHZhcmlhYmxlTmFtZSxcblx0XHRcdHR5cGUsXG5cdFx0XHRwcmVjaXNpb246IG9wdGlvbnM/LnByZWNpc2lvbixcblx0XHRcdGxvY2F0aW9uOiBvcHRpb25zPy5sb2NhdGlvbixcblx0XHR9KTtcblx0fVxuXG5cdHB1YmxpYyBhZGRWYXJ5aW5nRGVjbGFyYXRpb24oXG5cdFx0dmFyaWFibGVOYW1lOiBzdHJpbmcsXG5cdFx0dHlwZTogU2hhZGVyVmFyeWluZ1ZhclR5cGUsXG5cdFx0b3B0aW9ucz86IHtcblx0XHRcdHByZWNpc2lvbj86IFNoYWRlclByZWNpc2lvblR5cGUsXG5cdFx0XHRpbnRlcnBvbGF0aW9uVHlwZT86IFNoYWRlclZhcnlpbmdJbnRlcnBvbGF0aW9uVHlwZSxcblx0XHR9XG5cdCkge1xuXHRcdGNvbnN0IGlzRHVwbGljYXRlID1cblx0XHRcdHRoaXMuX192YXJ5aW5ncy5zb21lKHZhcnlpbmcgPT4gdmFyeWluZy52YXJpYWJsZU5hbWUgPT09IHZhcmlhYmxlTmFtZSk7XG5cdFx0aWYgKGlzRHVwbGljYXRlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBhZGRWYXJ5aW5nOiBkdXBsaWNhdGUgdmFyaWFibGUgbmFtZSAke3ZhcmlhYmxlTmFtZX1gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBpc0ludFR5cGUgPSBVdGlsaXR5Ll9pc0ludFR5cGUodHlwZSk7XG5cdFx0bGV0IGludGVycG9sYXRpb25UeXBlID0gb3B0aW9ucz8uaW50ZXJwb2xhdGlvblR5cGU7XG5cdFx0aWYgKGlzSW50VHlwZSAmJiBpbnRlcnBvbGF0aW9uVHlwZSAhPT0gJ2ZsYXQnKSB7XG5cdFx0XHRpZiAoaW50ZXJwb2xhdGlvblR5cGUgIT0gbnVsbCkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBhZGRWYXJ5aW5nOiB0aGUgaW50ZXJwb2xhdGlvblR5cGUgbXVzdCBiZSBmbGF0IGZvciBpbnRlZ2VyIHR5cGVzYCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgYWRkVmFyeWluZzogc2V0IHRoZSBpbnRlcnBvbGF0aW9uVHlwZSBvZiBpbnRlZ2VyIHR5cGVzIHRvIGZsYXQgdG8gYXZvaWQgY29tcGlsYXRpb24gZXJyb3JgKTtcblx0XHRcdFx0aW50ZXJwb2xhdGlvblR5cGUgPSAnZmxhdCc7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5fX3ZhcnlpbmdzLnB1c2goe1xuXHRcdFx0dmFyaWFibGVOYW1lLFxuXHRcdFx0dHlwZSxcblx0XHRcdHByZWNpc2lvbjogb3B0aW9ucz8ucHJlY2lzaW9uLFxuXHRcdFx0aW50ZXJwb2xhdGlvblR5cGUsXG5cdFx0fSk7XG5cdH1cblxuXHRwdWJsaWMgYWRkVW5pZm9ybURlY2xhcmF0aW9uKFxuXHRcdHZhcmlhYmxlTmFtZTogc3RyaW5nLFxuXHRcdHR5cGU6IFNoYWRlclVuaWZvcm1WYXJUeXBlRVMzLFxuXHRcdG9wdGlvbnM/OiB7XG5cdFx0XHRwcmVjaXNpb24/OiBTaGFkZXJQcmVjaXNpb25UeXBlLFxuXHRcdH1cblx0KSB7XG5cdFx0Y29uc3QgaXNEdXBsaWNhdGUgPVxuXHRcdFx0dGhpcy5fX3VuaWZvcm1zLnNvbWUodW5pZm9ybSA9PiB1bmlmb3JtLnZhcmlhYmxlTmFtZSA9PT0gdmFyaWFibGVOYW1lKTtcblx0XHRpZiAoaXNEdXBsaWNhdGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYGFkZFVuaWZvcm06IGR1cGxpY2F0ZSB2YXJpYWJsZSBuYW1lICR7dmFyaWFibGVOYW1lfWApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlID09PSAnYm9vbCcgJiYgb3B0aW9ucz8ucHJlY2lzaW9uICE9IG51bGwpIHtcblx0XHRcdGNvbnNvbGUud2FybihgYWRkVW5pZm9ybTogcmVtb3ZlIHRoZSBzcGVjaWZpY2F0aW9uIG9mIHByZWNpc2lvbiBmb3IgYm9vbCB0eXBlIHRvIGF2b2lkIGNvbXBpbGF0aW9uIGVycm9yYCk7XG5cdFx0XHRvcHRpb25zLnByZWNpc2lvbiA9IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHR0aGlzLl9fdW5pZm9ybXMucHVzaCh7XG5cdFx0XHR2YXJpYWJsZU5hbWUsXG5cdFx0XHR0eXBlLFxuXHRcdFx0cHJlY2lzaW9uOiBvcHRpb25zPy5wcmVjaXNpb24sXG5cdFx0fSk7XG5cdH1cblxuXHQvLyBuZWVkIHRvIGRlZmluZSBzdHJ1Y3QgYnkgdGhlIGFkZFN0cnVjdERlZmluaXRpb24gbWV0aG9kXG5cdHB1YmxpYyBhZGRVbmlmb3JtU3RydWN0RGVjbGFyYXRpb24oXG5cdFx0c3RydWN0TmFtZTogc3RyaW5nLFxuXHRcdHZhcmlhYmxlTmFtZTogc3RyaW5nXG5cdCkge1xuXHRcdGNvbnN0IGlzRHVwbGljYXRlID1cblx0XHRcdHRoaXMuX191bmlmb3JtU3RydWN0cy5zb21lKHVuaWZvcm1TdHJ1Y3QgPT4gdW5pZm9ybVN0cnVjdC52YXJpYWJsZU5hbWUgPT09IHZhcmlhYmxlTmFtZSk7XG5cdFx0aWYgKGlzRHVwbGljYXRlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBhZGRVbmlmb3JtU3RydWN0RGVjbGFyYXRpb246IGR1cGxpY2F0ZSB2YXJpYWJsZSBuYW1lICR7dmFyaWFibGVOYW1lfWApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX191bmlmb3JtU3RydWN0cy5wdXNoKHtcblx0XHRcdHZhcmlhYmxlTmFtZSxcblx0XHRcdHN0cnVjdE5hbWUsXG5cdFx0fSk7XG5cdH1cblxuXHQvLyBmb3IgZXMzXG5cdHB1YmxpYyBhZGRVbmlmb3JtQnVmZmVyT2JqZWN0RGVjbGFyYXRpb24oXG5cdFx0YmxvY2tOYW1lOiBzdHJpbmcsXG5cdFx0dmFyaWFibGVPYmplY3RzOiBTaGFkZXJVQk9WYXJpYWJsZU9iamVjdFtdLFxuXHRcdG9wdGlvbnM/OiB7XG5cdFx0XHRpbnN0YW5jZU5hbWU/OiBTaGFkZXJQcmVjaXNpb25UeXBlXG5cdFx0fVxuXHQpIHtcblx0XHRjb25zdCBpc0R1cGxpY2F0ZUJsb2NrTmFtZSA9XG5cdFx0XHR0aGlzLl9fdW5pZm9ybUJ1ZmZlck9iamVjdHMuc29tZSh1Ym8gPT4gdWJvLmJsb2NrTmFtZSA9PT0gYmxvY2tOYW1lKTtcblx0XHRpZiAoaXNEdXBsaWNhdGVCbG9ja05hbWUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYGFkZFVuaWZvcm1CdWZmZXJPYmplY3REZWNsYXJhdGlvbjogZHVwbGljYXRlIGJsb2NrIG5hbWUgJHtibG9ja05hbWV9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCB1Ym8gb2YgdGhpcy5fX3VuaWZvcm1CdWZmZXJPYmplY3RzKSB7XG5cdFx0XHRmb3IgKGNvbnN0IHVib1ZhcmlhYmxlT2JqZWN0IG9mIHViby52YXJpYWJsZU9iamVjdHMpIHtcblx0XHRcdFx0Zm9yIChjb25zdCB2YXJpYWJsZU9iamVjdCBvZiB2YXJpYWJsZU9iamVjdHMpIHtcblx0XHRcdFx0XHRpZiAodWJvVmFyaWFibGVPYmplY3QudmFyaWFibGVOYW1lID09PSB2YXJpYWJsZU9iamVjdC52YXJpYWJsZU5hbWUpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYGFkZFVuaWZvcm1CdWZmZXJPYmplY3REZWNsYXJhdGlvbjogZHVwbGljYXRlIHZhcmlhYmxlIG5hbWUgJHt2YXJpYWJsZU9iamVjdC52YXJpYWJsZU5hbWV9YCk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5fX3VuaWZvcm1CdWZmZXJPYmplY3RzLnB1c2goe1xuXHRcdFx0YmxvY2tOYW1lLFxuXHRcdFx0dmFyaWFibGVPYmplY3RzLFxuXHRcdFx0aW5zdGFuY2VOYW1lOiBvcHRpb25zPy5pbnN0YW5jZU5hbWUsXG5cdFx0fSk7XG5cdH1cblxuXHQvLyB0aGUgcmV0dXJuIHZhbHVlIElkIGlzIGEgdmFsdWUgdG8gZGVsZXRlIHRoZSBmdW5jdGlvblxuXHQvLyB0aGUgbWFpbiBmdW5jdGlvbiBpcyBkZWZpbmVkICh1cGRhdGVkKSBieSB0aGUgdXBkYXRlTWFpbkZ1bmN0aW9uIG1ldGhvZFxuXHRwdWJsaWMgYWRkRnVuY3Rpb25EZWZpbml0aW9uKFxuXHRcdGZ1bmN0aW9uQ29kZTogc3RyaW5nLFxuXHRcdG9wdGlvbnM/OiB7XG5cdFx0XHRkZXBlbmRlbmN5TGV2ZWw/OiBudW1iZXJcblx0XHR9XG5cdCkge1xuXHRcdGNvbnN0IGZ1bmN0aW9uSWQgPSB0aGlzLl9fZnVuY3Rpb25JZENvdW50Kys7XG5cblx0XHRjb25zdCBkZXBlbmRlbmN5TGV2ZWwgPSBvcHRpb25zPy5kZXBlbmRlbmN5TGV2ZWwgPz8gMDtcblx0XHR0aGlzLl9fZnVuY3Rpb25zW2RlcGVuZGVuY3lMZXZlbF0gPSB0aGlzLl9fZnVuY3Rpb25zW2RlcGVuZGVuY3lMZXZlbF0gPz8gW107XG5cdFx0dGhpcy5fX2Z1bmN0aW9uc1tkZXBlbmRlbmN5TGV2ZWxdLnB1c2goe1xuXHRcdFx0ZnVuY3Rpb25Db2RlLFxuXHRcdFx0ZnVuY3Rpb25JZFxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uSWQ7XG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Ly8gdXBkYXRlIHBhcmFtZXRlcnMgZnVuY3Rpb25zXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cdHB1YmxpYyB1cGRhdGVHbG9iYWxQcmVjaXNpb24ocHJlY2lzaW9uOiBTaGFkZXJQcmVjaXNpb25PYmplY3QpIHtcblx0XHRPYmplY3QuYXNzaWduKHRoaXMuX19nbG9iYWxQcmVjaXNpb24sIHByZWNpc2lvbik7XG5cdH1cblxuXHRwdWJsaWMgdXBkYXRlU3RydWN0RGVmaW5pdGlvbihzdHJ1Y3ROYW1lOiBzdHJpbmcsIG1lbWJlck9iamVjdHM6IFNoYWRlclN0cnVjdE1lbWJlck9iamVjdFtdKSB7XG5cdFx0Y29uc3QgbWF0Y2hlZEluZGV4ID1cblx0XHRcdHRoaXMuX19zdHJ1Y3REZWZpbml0aW9ucy5maW5kSW5kZXgoc3RydWN0RGVmaW5pdGlvbiA9PiBzdHJ1Y3REZWZpbml0aW9uLnN0cnVjdE5hbWUgPT09IHN0cnVjdE5hbWUpO1xuXHRcdGlmIChtYXRjaGVkSW5kZXggPT09IC0xKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGB1cGRhdGVTdHJ1Y3REZWZpbml0aW9uOiB0aGUgc3RydWN0IHR5cGUgbmFtZSAke3N0cnVjdE5hbWV9IGlzIG5vdCBleGlzdGApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX19zdHJ1Y3REZWZpbml0aW9uc1ttYXRjaGVkSW5kZXhdLm1lbWJlck9iamVjdHMgPSBtZW1iZXJPYmplY3RzO1xuXHR9XG5cblx0cHVibGljIHVwZGF0ZUdsb2JhbENvbnN0YW50VmFsdWUodmFyaWFibGVOYW1lOiBzdHJpbmcsIHZhbHVlczogbnVtYmVyW10pIHtcblx0XHRjb25zdCBtYXRjaGVkSW5kZXggPVxuXHRcdFx0dGhpcy5fX2dsb2JhbENvbnN0YW50VmFsdWVzLmZpbmRJbmRleChnbG9iYWxDb25zdGFudFZhbHVlID0+IGdsb2JhbENvbnN0YW50VmFsdWUudmFyaWFibGVOYW1lID09PSB2YXJpYWJsZU5hbWUpO1xuXHRcdGlmIChtYXRjaGVkSW5kZXggPT09IC0xKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oYHVwZGF0ZUdsb2JhbENvbnN0YW50VmFsdWU6IHRoZSB2YXJpYWJsZSBuYW1lICR7dmFyaWFibGVOYW1lfSBpcyBub3QgZXhpc3RgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCB0eXBlID0gdGhpcy5fX2dsb2JhbENvbnN0YW50VmFsdWVzW21hdGNoZWRJbmRleF0udHlwZTtcblxuXHRcdGNvbnN0IGlzVmFsaWRDb21wb25lbnROdW1iZXIgPSBVdGlsaXR5Ll9pc1ZhbGlkQ29tcG9uZW50Q291bnQodHlwZSwgdmFsdWVzKTtcblx0XHRpZiAoIWlzVmFsaWRDb21wb25lbnROdW1iZXIpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ3VwZGF0ZUdsb2JhbENvbnN0YW50VmFsdWU6IHRoZSBjb21wb25lbnQgY291bnQgaXMgaW52YWxpZCcpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGlzSW50VHlwZSA9IFV0aWxpdHkuX2lzSW50VHlwZSh0eXBlKTtcblx0XHRpZiAoaXNJbnRUeXBlKSB7XG5cdFx0XHRjb25zdCBleGlzdE5vbkludGVnZXJWYWx1ZSA9IFNoYWRlcml0eU9iamVjdENyZWF0b3IuX19leGlzdE5vbkludGVnZXJWYWx1ZSh2YWx1ZXMpO1xuXHRcdFx0aWYgKGV4aXN0Tm9uSW50ZWdlclZhbHVlKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgdXBkYXRlR2xvYmFsQ29uc3RhbnRWYWx1ZTogdGhlICR7dmFyaWFibGVOYW1lfSBoYXMgYSBub24taW50ZWdlciB2YWx1ZS5gKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLl9fZ2xvYmFsQ29uc3RhbnRWYWx1ZXNbbWF0Y2hlZEluZGV4XS52YWx1ZXMgPSB2YWx1ZXM7XG5cdH1cblxuXHRwdWJsaWMgdXBkYXRlR2xvYmFsQ29uc3RhbnRTdHJ1Y3RWYWx1ZSh2YXJpYWJsZU5hbWU6IHN0cmluZywgdmFsdWVzOiB7W2tleVZhcmlhYmxlTmFtZTogc3RyaW5nXTogbnVtYmVyW119KSB7XG5cdFx0Y29uc3QgbWF0Y2hlZEluZGV4ID1cblx0XHRcdHRoaXMuX19nbG9iYWxDb25zdGFudFN0cnVjdFZhbHVlcy5maW5kSW5kZXgoc3RydWN0VmFsdWUgPT4gc3RydWN0VmFsdWUudmFyaWFibGVOYW1lID09PSB2YXJpYWJsZU5hbWUpO1xuXHRcdGlmIChtYXRjaGVkSW5kZXggPT09IC0xKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGB1cGRhdGVHbG9iYWxDb25zdGFudFN0cnVjdFZhbHVlOiAgdGhlIHZhcmlhYmxlIG5hbWUgJHt2YXJpYWJsZU5hbWV9IGlzIG5vdCBleGlzdGApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX19nbG9iYWxDb25zdGFudFN0cnVjdFZhbHVlc1ttYXRjaGVkSW5kZXhdLnZhbHVlcyA9IHZhbHVlcztcblx0fVxuXG5cdHB1YmxpYyB1cGRhdGVNYWluRnVuY3Rpb24obWFpbkZ1bmN0aW9uQ29kZUlubmVyOiBzdHJpbmcpIHtcblx0XHR0aGlzLl9fbWFpbkZ1bmN0aW9uQ29kZSA9IG1haW5GdW5jdGlvbkNvZGVJbm5lcjtcblx0fVxuXG5cdC8vIHNwZWNpZnkgdGhlIG5hbWUgb2YgdGhlIG91dHB1dCBjb2xvciB2YXJpYWJsZSBmcm9tIHRoZSBtYWluIGZ1bmN0aW9uIGluIHRoZSBmcmFnbWVudCBzaGFkZXIuXG5cdC8vIHVzZXJzIGhhdmUgdG8gYXNzaWduIHRoZSByZXN1bHQgb2YgZnJhZ21lbnQgc2hhZGVyIGNhbGN1bGF0aW9uIHRvIHRoaXMgdmFyaWFibGUuXG5cdHB1YmxpYyB1cGRhdGVPdXRwdXRDb2xvclZhcmlhYmxlTmFtZShvdXRwdXRDb2xvclZhcmlhYmxlTmFtZTogc3RyaW5nKSB7XG5cdFx0aWYgKHRoaXMuX19zaGFkZXJTdGFnZSAhPT0gJ2ZyYWdtZW50Jykge1xuXHRcdFx0Y29uc29sZS5lcnJvcigndXBkYXRlT3V0cHV0Q29sb3JWYXJpYWJsZU5hbWU6IHRoaXMgbWV0aG9kIGlzIGZvciBmcmFnbWVudCBzaGFkZXIgb25seScpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChvdXRwdXRDb2xvclZhcmlhYmxlTmFtZS5sZW5ndGggPT09IDApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ3VwZGF0ZU91dHB1dENvbG9yVmFyaWFibGVOYW1lOiBpbnZhbGlkIG91dENvbG9yVmFyaWFibGVOYW1lJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5fX291dHB1dENvbG9yVmFyaWFibGVOYW1lID0gb3V0cHV0Q29sb3JWYXJpYWJsZU5hbWU7XG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Ly8gcmVtb3ZlIHBhcmFtZXRlcnMgZnVuY3Rpb25zXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cdHB1YmxpYyByZW1vdmVEZWZpbmVEaXJlY3RpdmUoZGVmaW5lRGlyZWN0aXZlTmFtZTogc3RyaW5nKSB7XG5cdFx0Y29uc3QgbWF0Y2hlZEluZGV4ID0gdGhpcy5fX2RlZmluZURpcmVjdGl2ZU5hbWVzLmluZGV4T2YoZGVmaW5lRGlyZWN0aXZlTmFtZSk7XG5cblx0XHRpZiAobWF0Y2hlZEluZGV4ID09PSAtMSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdyZW1vdmVkRGVmaW5lRGlyZWN0aXZlOiB0aGlzIGRlZmluZSBkaXJlY3RpdmUgaXMgbm90IGV4aXN0Jyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5fX2RlZmluZURpcmVjdGl2ZU5hbWVzLnNwbGljZShtYXRjaGVkSW5kZXgsIDEpO1xuXHR9XG5cblx0cHVibGljIHJlbW92ZUV4dGVuc2lvbihleHRlbnNpb25OYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBtYXRjaGVkSW5kZXggPVxuXHRcdFx0dGhpcy5fX2V4dGVuc2lvbnMuZmluZEluZGV4KGV4dGVuc2lvbiA9PiBleHRlbnNpb24uZXh0ZW5zaW9uTmFtZSA9PT0gZXh0ZW5zaW9uTmFtZSk7XG5cblx0XHRpZiAobWF0Y2hlZEluZGV4ID09PSAtMSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdyZW1vdmVFeHRlbnNpb246IHRoaXMgZXh0ZW5zaW9uIGlzIG5vdCBleGlzdCcpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX19leHRlbnNpb25zLnNwbGljZShtYXRjaGVkSW5kZXgsIDEpO1xuXHR9XG5cblx0cHVibGljIHJlbW92ZVN0cnVjdERlZmluaXRpb24oc3RydWN0TmFtZTogc3RyaW5nKSB7XG5cdFx0Y29uc3QgbWF0Y2hlZEluZGV4ID1cblx0XHRcdHRoaXMuX19zdHJ1Y3REZWZpbml0aW9ucy5maW5kSW5kZXgoc3RydWN0RGVmaW5pdGlvbiA9PiBzdHJ1Y3REZWZpbml0aW9uLnN0cnVjdE5hbWUgPT09IHN0cnVjdE5hbWUpO1xuXHRcdGlmIChtYXRjaGVkSW5kZXggPT09IC0xKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGByZW1vdmVTdHJ1Y3REZWZpbml0aW9uOiB0aGUgc3RydWN0IHR5cGUgbmFtZSAke3N0cnVjdE5hbWV9IGlzIG5vdCBleGlzdGApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX19zdHJ1Y3REZWZpbml0aW9ucy5zcGxpY2UobWF0Y2hlZEluZGV4LCAxKTtcblx0fVxuXG5cdHB1YmxpYyByZW1vdmVHbG9iYWxDb25zdGFudFZhbHVlKHZhcmlhYmxlTmFtZTogc3RyaW5nKSB7XG5cdFx0Y29uc3QgbWF0Y2hlZEluZGV4ID1cblx0XHRcdHRoaXMuX19nbG9iYWxDb25zdGFudFZhbHVlcy5maW5kSW5kZXgoZ2xvYmFsQ29uc3RhbnRWYWx1ZSA9PiBnbG9iYWxDb25zdGFudFZhbHVlLnZhcmlhYmxlTmFtZSA9PT0gdmFyaWFibGVOYW1lKTtcblx0XHRpZiAobWF0Y2hlZEluZGV4ID09PSAtMSkge1xuXHRcdFx0Y29uc29sZS53YXJuKGByZW1vdmVHbG9iYWxDb25zdGFudFZhbHVlOiB0aGUgdmFyaWFibGUgbmFtZSAke3ZhcmlhYmxlTmFtZX0gaXMgbm90IGV4aXN0YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5fX2dsb2JhbENvbnN0YW50VmFsdWVzLnNwbGljZShtYXRjaGVkSW5kZXgsIDEpO1xuXHR9XG5cblx0cHVibGljIHJlbW92ZUdsb2JhbENvbnN0YW50U3RydWN0VmFsdWUodmFyaWFibGVOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBtYXRjaGVkSW5kZXggPVxuXHRcdFx0dGhpcy5fX2dsb2JhbENvbnN0YW50U3RydWN0VmFsdWVzLmZpbmRJbmRleChzdHJ1Y3RWYWx1ZSA9PiBzdHJ1Y3RWYWx1ZS52YXJpYWJsZU5hbWUgPT09IHZhcmlhYmxlTmFtZSk7XG5cdFx0aWYgKG1hdGNoZWRJbmRleCA9PT0gLTEpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYHVwZGF0ZUdsb2JhbENvbnN0YW50U3RydWN0VmFsdWU6ICB0aGUgdmFyaWFibGUgbmFtZSAke3ZhcmlhYmxlTmFtZX0gaXMgbm90IGV4aXN0YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5fX2dsb2JhbENvbnN0YW50U3RydWN0VmFsdWVzLnNwbGljZShtYXRjaGVkSW5kZXgsIDEpO1xuXHR9XG5cblx0cHVibGljIHJlbW92ZUF0dHJpYnV0ZURlY2xhcmF0aW9uKHZhcmlhYmxlTmFtZTogc3RyaW5nKSB7XG5cdFx0Y29uc3QgbWF0Y2hlZEluZGV4ID1cblx0XHRcdHRoaXMuX19hdHRyaWJ1dGVzLmZpbmRJbmRleChhdHRyaWJ1dGUgPT4gYXR0cmlidXRlLnZhcmlhYmxlTmFtZSA9PT0gdmFyaWFibGVOYW1lKTtcblx0XHRpZiAobWF0Y2hlZEluZGV4ID09PSAtMSkge1xuXHRcdFx0Y29uc29sZS53YXJuKGByZW1vdmVBdHRyaWJ1dGU6IHRoZSB2YXJpYWJsZSBuYW1lICR7dmFyaWFibGVOYW1lfSBpcyBub3QgZXhpc3RgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9fYXR0cmlidXRlcy5zcGxpY2UobWF0Y2hlZEluZGV4LCAxKTtcblx0fVxuXG5cdHB1YmxpYyByZW1vdmVWYXJ5aW5nRGVjbGFyYXRpb24odmFyaWFibGVOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBtYXRjaGVkSW5kZXggPVxuXHRcdFx0dGhpcy5fX3ZhcnlpbmdzLmZpbmRJbmRleCh2YXJ5aW5nID0+IHZhcnlpbmcudmFyaWFibGVOYW1lID09PSB2YXJpYWJsZU5hbWUpO1xuXHRcdGlmIChtYXRjaGVkSW5kZXggPT09IC0xKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oYHJlbW92ZVZhcnlpbmc6IHRoZSB2YXJpYWJsZSBuYW1lICR7dmFyaWFibGVOYW1lfSBpcyBub3QgZXhpc3RgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9fdmFyeWluZ3Muc3BsaWNlKG1hdGNoZWRJbmRleCwgMSk7XG5cdH1cblxuXHRwdWJsaWMgcmVtb3ZlVW5pZm9ybURlY2xhcmF0aW9uKHZhcmlhYmxlTmFtZTogc3RyaW5nKSB7XG5cdFx0Y29uc3QgbWF0Y2hlZEluZGV4ID1cblx0XHRcdHRoaXMuX191bmlmb3Jtcy5maW5kSW5kZXgodW5pZm9ybSA9PiB1bmlmb3JtLnZhcmlhYmxlTmFtZSA9PT0gdmFyaWFibGVOYW1lKTtcblx0XHRpZiAobWF0Y2hlZEluZGV4ID09PSAtMSkge1xuXHRcdFx0Y29uc29sZS53YXJuKGByZW1vdmVVbmlmb3JtOiB0aGUgdmFyaWFibGUgbmFtZSAke3ZhcmlhYmxlTmFtZX0gaXMgbm90IGV4aXN0YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5fX3VuaWZvcm1zLnNwbGljZShtYXRjaGVkSW5kZXgsIDEpO1xuXHR9XG5cblx0cHVibGljIHJlbW92ZVVuaWZvcm1TdHJ1Y3REZWNsYXJhdGlvbih2YXJpYWJsZU5hbWU6IHN0cmluZykge1xuXHRcdGNvbnN0IG1hdGNoZWRJbmRleCA9XG5cdFx0XHR0aGlzLl9fdW5pZm9ybVN0cnVjdHMuZmluZEluZGV4KHVuaWZvcm1TdHJ1Y3QgPT4gdW5pZm9ybVN0cnVjdC52YXJpYWJsZU5hbWUgPT09IHZhcmlhYmxlTmFtZSk7XG5cdFx0aWYgKG1hdGNoZWRJbmRleCA9PT0gLTEpIHtcblx0XHRcdGNvbnNvbGUud2FybihgcmVtb3ZlVW5pZm9ybVN0cnVjdERlY2xhcmF0aW9uOiB0aGUgdmFyaWFibGUgbmFtZSAke3ZhcmlhYmxlTmFtZX0gaXMgbm90IGV4aXN0YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5fX3VuaWZvcm1TdHJ1Y3RzLnNwbGljZShtYXRjaGVkSW5kZXgsIDEpO1xuXHR9XG5cblx0cHVibGljIHJlbW92ZVVuaWZvcm1CdWZmZXJPYmplY3REZWNsYXJhdGlvbihibG9ja05hbWU6IHN0cmluZykge1xuXHRcdGNvbnN0IG1hdGNoZWRJbmRleCA9XG5cdFx0XHR0aGlzLl9fdW5pZm9ybUJ1ZmZlck9iamVjdHMuZmluZEluZGV4KHVibyA9PiB1Ym8uYmxvY2tOYW1lID09PSBibG9ja05hbWUpO1xuXHRcdGlmIChtYXRjaGVkSW5kZXggPT09IC0xKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oYHJlbW92ZVVuaWZvcm1TdHJ1Y3REZWNsYXJhdGlvbjogdGhlIHZhcmlhYmxlIG5hbWUgJHtibG9ja05hbWV9IGlzIG5vdCBleGlzdGApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX191bmlmb3JtQnVmZmVyT2JqZWN0cy5zcGxpY2UobWF0Y2hlZEluZGV4LCAxKTtcblx0fVxuXG5cdHB1YmxpYyByZW1vdmVGdW5jdGlvbkRlZmluaXRpb24oZnVuY3Rpb25JZDogbnVtYmVyKSB7XG5cdFx0dGhpcy5fX2ZpbGxFbXB0eUZ1bmN0aW9ucygpO1xuXG5cdFx0Ly8gaWQgaXMgdG9vIHNtYWxsIG9yIHRvbyBiaWdcblx0XHRpZiAoZnVuY3Rpb25JZCA8IDAgfHwgZnVuY3Rpb25JZCA+PSB0aGlzLl9fZnVuY3Rpb25JZENvdW50KSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3JlbW92ZUZ1bmN0aW9uRGVmaW5pdGlvbjogaW52YWxpZCBmdW5jdGlvbiBpZCcpXG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBmdW5jdGlvbk9iamVjdHMgb2YgdGhpcy5fX2Z1bmN0aW9ucykge1xuXHRcdFx0Y29uc3QgbWF0Y2hlZEluZGV4ID1cblx0XHRcdFx0ZnVuY3Rpb25PYmplY3RzLmZpbmRJbmRleChmdW5jdGlvbk9iamVjdCA9PiBmdW5jdGlvbk9iamVjdC5mdW5jdGlvbklkID09PSBmdW5jdGlvbklkKTtcblx0XHRcdGlmIChtYXRjaGVkSW5kZXggIT09IC0xKSB7XG5cdFx0XHRcdGZ1bmN0aW9uT2JqZWN0cy5zcGxpY2UobWF0Y2hlZEluZGV4LCAxKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnNvbGUud2FybihgcmVtb3ZlRnVuY3Rpb25EZWZpbml0aW9uOiBub3QgZm91bmQgdGhlIGZ1bmN0aW9uIG9mIGZ1bmN0aW9uSWQgJHtmdW5jdGlvbklkfWApO1xuXHR9XG5cblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdC8vIGNyZWF0ZSBzaGFkZXJpdHkgb2JqZWN0IGZ1bmN0aW9uXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cdHB1YmxpYyBjcmVhdGVTaGFkZXJpdHlPYmplY3QoKTogU2hhZGVyaXR5T2JqZWN0IHtcblx0XHRjb25zdCBzaGFkZXJpdHlPYmogPSB7XG5cdFx0XHRjb2RlOiB0aGlzLl9fY3JlYXRlU2hhZGVyQ29kZSgpLFxuXHRcdFx0c2hhZGVyU3RhZ2U6IHRoaXMuX19zaGFkZXJTdGFnZSxcblx0XHRcdGlzRnJhZ21lbnRTaGFkZXI6IHRoaXMuX19zaGFkZXJTdGFnZSA9PT0gJ2ZyYWdtZW50Jyxcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHNoYWRlcml0eU9iajtcblx0fVxuXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQvLyBwcml2YXRlIG1ldGhvZHNcblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblx0cHJpdmF0ZSBzdGF0aWMgX19leGlzdE5vbkludGVnZXJWYWx1ZSh2YWx1ZXM6IG51bWJlcltdKSB7XG5cdFx0Zm9yIChjb25zdCB2YWx1ZSBvZiB2YWx1ZXMpIHtcblx0XHRcdGlmICghTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIFRPRE86IGltcGxlbWVudCBzaGFkZXIgY29kZSBpbXBvcnQgZmVhdHVyZSAobG93IHByaW9yaXR5KVxuXHQvLyBwdWJsaWMgaW1wb3J0U2hhZGVyQ29kZShjb2RlOiBzdHJpbmcpIHt9XG5cblx0Ly8gbmVlZCB0byBhcHBseSBTaGFkZXJpdHkudHJhbnNmb3JtVG9HTFNMRVMxLCB0cmFuc2Zvcm1Ub0dMU0xFUzMgb3IgdHJhbnNmb3JtVG8gbWV0aG9kXG5cdHByaXZhdGUgX19jcmVhdGVTaGFkZXJDb2RlKCk6IHN0cmluZyB7XG5cdFx0dGhpcy5fX2ZpbGxFbXB0eUZ1bmN0aW9ucygpO1xuXG5cdFx0Y29uc3QgY29kZVxuXHRcdFx0PSBgI3ZlcnNpb24gMzAwIGVzXFxuXFxuYFxuXHRcdFx0KyB0aGlzLl9fY3JlYXRlRGVmaW5lRGlyZWN0aXZlU2hhZGVyQ29kZSgpXG5cdFx0XHQrIHRoaXMuX19jcmVhdGVFeHRlbnNpb25TaGFkZXJDb2RlKClcblx0XHRcdCsgdGhpcy5fX2NyZWF0ZUdsb2JhbFByZWNpc2lvblNoYWRlckNvZGUoKVxuXHRcdFx0KyB0aGlzLl9fY3JlYXRlU3RydWN0RGVmaW5pdGlvblNoYWRlckNvZGUoKVxuXHRcdFx0KyB0aGlzLl9fY3JlYXRlR2xvYmFsQ29uc3RhbnRWYWx1ZVNoYWRlckNvZGUoKVxuXHRcdFx0KyB0aGlzLl9fY3JlYXRlR2xvYmFsQ29uc3RhbnRTdHJ1Y3RWYWx1ZVNoYWRlckNvZGUoKVxuXHRcdFx0KyB0aGlzLl9fY3JlYXRlQXR0cmlidXRlRGVjbGFyYXRpb25TaGFkZXJDb2RlKClcblx0XHRcdCsgdGhpcy5fX2NyZWF0ZVZhcnlpbmdEZWNsYXJhdGlvblNoYWRlckNvZGUoKVxuXHRcdFx0KyB0aGlzLl9fY3JlYXRlT3V0cHV0Q29sb3JEZWNsYXJhdGlvblNoYWRlckNvZGUoKVxuXHRcdFx0KyB0aGlzLl9fY3JlYXRlVW5pZm9ybURlY2xhcmF0aW9uU2hhZGVyQ29kZSgpXG5cdFx0XHQrIHRoaXMuX19jcmVhdGVVbmlmb3JtU3RydWN0RGVjbGFyYXRpb25TaGFkZXJDb2RlKClcblx0XHRcdCsgdGhpcy5fX2NyZWF0ZVVuaWZvcm1CdWZmZXJPYmplY3RTaGFkZXJDb2RlKClcblx0XHRcdCsgdGhpcy5fX2NyZWF0ZUZ1bmN0aW9uRGVmaW5pdGlvblNoYWRlckNvZGUoKVxuXHRcdFx0KyB0aGlzLl9fY3JlYXRlTWFpbkZ1bmN0aW9uRGVmaW5pdGlvblNoYWRlckNvZGUoKTtcblxuXHRcdHJldHVybiBjb2RlO1xuXHR9XG5cblx0cHJpdmF0ZSBfX2ZpbGxFbXB0eUZ1bmN0aW9ucygpIHtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19mdW5jdGlvbnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMuX19mdW5jdGlvbnNbaV0gPSB0aGlzLl9fZnVuY3Rpb25zW2ldID8/IFtdO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgX19jcmVhdGVEZWZpbmVEaXJlY3RpdmVTaGFkZXJDb2RlKCk6IHN0cmluZyB7XG5cdFx0bGV0IHNoYWRlckNvZGUgPSAnJztcblx0XHRmb3IgKGNvbnN0IGRlZmluZURpcmVjdGl2ZU5hbWUgb2YgdGhpcy5fX2RlZmluZURpcmVjdGl2ZU5hbWVzKSB7XG5cdFx0XHRzaGFkZXJDb2RlICs9IGAjZGVmaW5lICR7ZGVmaW5lRGlyZWN0aXZlTmFtZX1cXG5gO1xuXHRcdH1cblxuXHRcdHJldHVybiBVdGlsaXR5Ll9hZGRMaW5lRmVlZENvZGVJZk5vdE51bGxTdHJpbmcoc2hhZGVyQ29kZSk7O1xuXHR9XG5cblx0cHJpdmF0ZSBfX2NyZWF0ZUV4dGVuc2lvblNoYWRlckNvZGUoKTogc3RyaW5nIHtcblx0XHRsZXQgc2hhZGVyQ29kZSA9ICcnO1xuXHRcdGZvciAoY29uc3QgZXh0ZW5zaW9uIG9mIHRoaXMuX19leHRlbnNpb25zKSB7XG5cdFx0XHRzaGFkZXJDb2RlICs9IGAjZXh0ZW5zaW9uICR7ZXh0ZW5zaW9uLmV4dGVuc2lvbk5hbWV9OiAke2V4dGVuc2lvbi5iZWhhdmlvcn1cXG5gO1xuXHRcdH1cblxuXHRcdHJldHVybiBVdGlsaXR5Ll9hZGRMaW5lRmVlZENvZGVJZk5vdE51bGxTdHJpbmcoc2hhZGVyQ29kZSk7XG5cdH1cblxuXHQvL1RPRE86IHJlbW92ZSBuZWVkbGVzcyBwcmVjaXNpb25zXG5cdHByaXZhdGUgX19jcmVhdGVHbG9iYWxQcmVjaXNpb25TaGFkZXJDb2RlKCk6IHN0cmluZyB7XG5cdFx0bGV0IHNoYWRlckNvZGUgPSAnJztcblx0XHRmb3IgKGNvbnN0IHR5cGUgaW4gdGhpcy5fX2dsb2JhbFByZWNpc2lvbikge1xuXHRcdFx0Y29uc3QgcHJlY2lzaW9uVHlwZSA9IHR5cGUgYXMgU2hhZGVyUHJlY2lzaW9uT2JqZWN0S2V5O1xuXHRcdFx0Y29uc3QgcHJlY2lzaW9uUXVhbGlmaWVyID0gdGhpcy5fX2dsb2JhbFByZWNpc2lvbltwcmVjaXNpb25UeXBlXTtcblxuXHRcdFx0c2hhZGVyQ29kZSArPSBgcHJlY2lzaW9uICR7cHJlY2lzaW9uUXVhbGlmaWVyfSAke3ByZWNpc2lvblR5cGV9O1xcbmA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFV0aWxpdHkuX2FkZExpbmVGZWVkQ29kZUlmTm90TnVsbFN0cmluZyhzaGFkZXJDb2RlKTtcblx0fVxuXG5cdHByaXZhdGUgX19jcmVhdGVTdHJ1Y3REZWZpbml0aW9uU2hhZGVyQ29kZSgpOiBzdHJpbmcge1xuXHRcdGxldCBzaGFkZXJDb2RlID0gJyc7XG5cdFx0Zm9yIChjb25zdCBzdHJ1Y3REZWZpbml0aW9uIG9mIHRoaXMuX19zdHJ1Y3REZWZpbml0aW9ucykge1xuXHRcdFx0c2hhZGVyQ29kZSArPSBgc3RydWN0ICR7c3RydWN0RGVmaW5pdGlvbi5zdHJ1Y3ROYW1lfSB7XFxuYDtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzdHJ1Y3REZWZpbml0aW9uLm1lbWJlck9iamVjdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc3QgdmFyaWFibGUgPSBzdHJ1Y3REZWZpbml0aW9uLm1lbWJlck9iamVjdHNbaV07XG5cblx0XHRcdFx0c2hhZGVyQ29kZSArPSBgICBgO1xuXHRcdFx0XHRpZiAodmFyaWFibGUucHJlY2lzaW9uICE9IG51bGwpIHtcblx0XHRcdFx0XHRzaGFkZXJDb2RlICs9IGAke3ZhcmlhYmxlLnByZWNpc2lvbn0gYDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNoYWRlckNvZGUgKz0gYCR7dmFyaWFibGUudHlwZX0gJHt2YXJpYWJsZS5tZW1iZXJOYW1lfTtcXG5gO1xuXHRcdFx0fVxuXG5cdFx0XHRzaGFkZXJDb2RlICs9IGB9O1xcbmA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFV0aWxpdHkuX2FkZExpbmVGZWVkQ29kZUlmTm90TnVsbFN0cmluZyhzaGFkZXJDb2RlKTtcblx0fVxuXG5cdHByaXZhdGUgX19jcmVhdGVHbG9iYWxDb25zdGFudFZhbHVlU2hhZGVyQ29kZSgpOiBzdHJpbmcge1xuXHRcdGxldCBzaGFkZXJDb2RlID0gJyc7XG5cdFx0Zm9yIChjb25zdCBnbG9iYWxDb25zdGFudFZhbHVlIG9mIHRoaXMuX19nbG9iYWxDb25zdGFudFZhbHVlcykge1xuXHRcdFx0Y29uc3QgdHlwZSA9IGdsb2JhbENvbnN0YW50VmFsdWUudHlwZTtcblx0XHRcdGNvbnN0IHZhcmlhYmxlTmFtZSA9IGdsb2JhbENvbnN0YW50VmFsdWUudmFyaWFibGVOYW1lO1xuXHRcdFx0Y29uc3QgdmFsdWUgPSBnbG9iYWxDb25zdGFudFZhbHVlLnZhbHVlcztcblxuXHRcdFx0c2hhZGVyQ29kZSArPSBgY29uc3QgJHt0eXBlfSAke3ZhcmlhYmxlTmFtZX0gPSAke3R5cGV9KGA7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHNoYWRlckNvZGUgKz0gdmFsdWVbaV0gKyAnLCAnO1xuXHRcdFx0fVxuXG5cdFx0XHRzaGFkZXJDb2RlID0gc2hhZGVyQ29kZS5yZXBsYWNlKC8sXFxzJC8sICcpO1xcbicpO1xuXHRcdH1cblxuXHRcdHJldHVybiBVdGlsaXR5Ll9hZGRMaW5lRmVlZENvZGVJZk5vdE51bGxTdHJpbmcoc2hhZGVyQ29kZSk7XG5cdH1cblxuXHRwcml2YXRlIF9fY3JlYXRlR2xvYmFsQ29uc3RhbnRTdHJ1Y3RWYWx1ZVNoYWRlckNvZGUoKTogc3RyaW5nIHtcblx0XHRsZXQgc2hhZGVyQ29kZSA9ICcnO1xuXHRcdGZvciAoY29uc3Qgc3RydWN0VmFsdWUgb2YgdGhpcy5fX2dsb2JhbENvbnN0YW50U3RydWN0VmFsdWVzKSB7XG5cdFx0XHRjb25zdCBtYXRjaGVkSW5kZXggPVxuXHRcdFx0XHR0aGlzLl9fc3RydWN0RGVmaW5pdGlvbnMuZmluZEluZGV4KGRlZmluaXRpb24gPT4gZGVmaW5pdGlvbi5zdHJ1Y3ROYW1lID09PSBzdHJ1Y3RWYWx1ZS5zdHJ1Y3ROYW1lKTtcblx0XHRcdGlmIChtYXRjaGVkSW5kZXggPT09IC0xKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYF9fY3JlYXRlR2xvYmFsQ29uc3RhbnRTdHJ1Y3RWYWx1ZVNoYWRlckNvZGU6IHRoZSBzdHJ1Y3QgdHlwZSAke3N0cnVjdFZhbHVlLnN0cnVjdE5hbWV9IGlzIG5vdCBkZWZpbmVkYCk7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRzaGFkZXJDb2RlICs9IGBjb25zdCAke3N0cnVjdFZhbHVlLnN0cnVjdE5hbWV9ICR7c3RydWN0VmFsdWUudmFyaWFibGVOYW1lfSA9ICR7c3RydWN0VmFsdWUuc3RydWN0TmFtZX0gKFxcbmA7XG5cblx0XHRcdGNvbnN0IHN0cnVjdERlZmluaXRpb24gPSB0aGlzLl9fc3RydWN0RGVmaW5pdGlvbnNbbWF0Y2hlZEluZGV4XTtcblx0XHRcdGlmIChzdHJ1Y3REZWZpbml0aW9uLm1lbWJlck9iamVjdHMubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhzdHJ1Y3RWYWx1ZS52YWx1ZXMpLmxlbmd0aCkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBfX2NyZWF0ZUdsb2JhbENvbnN0YW50U3RydWN0VmFsdWVTaGFkZXJDb2RlOiBJbnZhbGlkIG51bWJlciBvZiB2YXJpYWJsZXMgdGhhdCAke3N0cnVjdFZhbHVlLnZhcmlhYmxlTmFtZX0gaGFzYCk7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBoYXNTYW1wbGVyVHlwZSA9XG5cdFx0XHRcdHN0cnVjdERlZmluaXRpb24ubWVtYmVyT2JqZWN0cy5zb21lKG1lbWJlck9iamVjdCA9PiBVdGlsaXR5Ll9pc1NhbXBsZXJUeXBlKG1lbWJlck9iamVjdC50eXBlKSk7XG5cdFx0XHRpZiAoaGFzU2FtcGxlclR5cGUpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihgX19jcmVhdGVHbG9iYWxDb25zdGFudFN0cnVjdFZhbHVlU2hhZGVyQ29kZTogQ29uc3RhbnRTdHJ1Y3RWYWx1ZSAoJHtzdHJ1Y3RWYWx1ZS52YXJpYWJsZU5hbWV9KSBjYW5ub3QgaGF2ZSBzYW1wbGVyIHR5cGUgcGFyYW1ldGVyYCk7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHN0cnVjdERlZmluaXRpb24ubWVtYmVyT2JqZWN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCB2YXJpYWJsZU5hbWUgPSBzdHJ1Y3REZWZpbml0aW9uLm1lbWJlck9iamVjdHNbaV0ubWVtYmVyTmFtZTtcblx0XHRcdFx0Y29uc3QgdmFsdWUgPSBzdHJ1Y3RWYWx1ZS52YWx1ZXNbdmFyaWFibGVOYW1lXVxuXHRcdFx0XHRpZiAodmFsdWUgPT0gbnVsbCkge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYF9fY3JlYXRlR2xvYmFsQ29uc3RhbnRTdHJ1Y3RWYWx1ZVNoYWRlckNvZGU6ICR7c3RydWN0VmFsdWUudmFyaWFibGVOYW1lfSBkb2VzIG5vdCBoYXZlIHRoZSB2YWx1ZSBvZiAke3ZhcmlhYmxlTmFtZX1gKTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHR5cGUgPSBzdHJ1Y3REZWZpbml0aW9uLm1lbWJlck9iamVjdHNbaV0udHlwZTtcblx0XHRcdFx0Y29uc3QgaXNWYWxpZENvbXBvbmVudE51bWJlciA9IFV0aWxpdHkuX2lzVmFsaWRDb21wb25lbnRDb3VudCh0eXBlLCB2YWx1ZSk7XG5cdFx0XHRcdGlmICghaXNWYWxpZENvbXBvbmVudE51bWJlcikge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYF9fY3JlYXRlR2xvYmFsQ29uc3RhbnRTdHJ1Y3RWYWx1ZVNoYWRlckNvZGU6IHRoZSBjb21wb25lbnQgY291bnQgb2YgJHt2YXJpYWJsZU5hbWV9IGluICR7c3RydWN0VmFsdWUudmFyaWFibGVOYW1lfSBpcyBpbnZhbGlkYCk7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzaGFkZXJDb2RlICs9IGAgICR7dHlwZX0oYDtcblx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHNoYWRlckNvZGUgKz0gdmFsdWVbaV0gKyAnLCAnO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2hhZGVyQ29kZSA9IHNoYWRlckNvZGUucmVwbGFjZSgvLFxccyQvLCAnKSxcXG4nKTtcblx0XHRcdH1cblxuXHRcdFx0c2hhZGVyQ29kZSA9IHNoYWRlckNvZGUucmVwbGFjZSgvLFxcbiQvLCAnXFxuKTtcXG4nKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gVXRpbGl0eS5fYWRkTGluZUZlZWRDb2RlSWZOb3ROdWxsU3RyaW5nKHNoYWRlckNvZGUpO1xuXHR9XG5cblx0cHJpdmF0ZSBfX2NyZWF0ZUF0dHJpYnV0ZURlY2xhcmF0aW9uU2hhZGVyQ29kZSgpOiBzdHJpbmcge1xuXHRcdGxldCBzaGFkZXJDb2RlID0gJyc7XG5cdFx0Zm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgdGhpcy5fX2F0dHJpYnV0ZXMpIHtcblx0XHRcdGlmIChhdHRyaWJ1dGUubG9jYXRpb24gIT0gbnVsbCkge1xuXHRcdFx0XHRzaGFkZXJDb2RlICs9IGBsYXlvdXQgKGxvY2F0aW9uID0gJHthdHRyaWJ1dGUubG9jYXRpb259KSBgO1xuXHRcdFx0fVxuXG5cdFx0XHRzaGFkZXJDb2RlICs9IGBpbiBgO1xuXG5cdFx0XHRpZiAoYXR0cmlidXRlLnByZWNpc2lvbiAhPSBudWxsKSB7XG5cdFx0XHRcdHNoYWRlckNvZGUgKz0gYCR7YXR0cmlidXRlLnByZWNpc2lvbn0gYDtcblx0XHRcdH1cblxuXHRcdFx0c2hhZGVyQ29kZSArPSBgJHthdHRyaWJ1dGUudHlwZX0gJHthdHRyaWJ1dGUudmFyaWFibGVOYW1lfTtcXG5gO1xuXHRcdH1cblxuXHRcdHJldHVybiBVdGlsaXR5Ll9hZGRMaW5lRmVlZENvZGVJZk5vdE51bGxTdHJpbmcoc2hhZGVyQ29kZSk7XG5cdH1cblxuXHRwcml2YXRlIF9fY3JlYXRlVmFyeWluZ0RlY2xhcmF0aW9uU2hhZGVyQ29kZSgpOiBzdHJpbmcge1xuXHRcdGxldCBzaGFkZXJDb2RlID0gJyc7XG5cdFx0Zm9yIChjb25zdCB2YXJ5aW5nIG9mIHRoaXMuX192YXJ5aW5ncykge1xuXHRcdFx0aWYgKHZhcnlpbmcuaW50ZXJwb2xhdGlvblR5cGUgIT0gbnVsbCkge1xuXHRcdFx0XHRzaGFkZXJDb2RlICs9IGAke3ZhcnlpbmcuaW50ZXJwb2xhdGlvblR5cGV9IGA7XG5cdFx0XHR9XG5cblx0XHRcdHNoYWRlckNvZGUgKz0gdGhpcy5fX3NoYWRlclN0YWdlID09ICd2ZXJ0ZXgnID8gYG91dCBgIDogYGluIGA7XG5cblx0XHRcdGlmICh2YXJ5aW5nLnByZWNpc2lvbiAhPSBudWxsKSB7XG5cdFx0XHRcdHNoYWRlckNvZGUgKz0gYCR7dmFyeWluZy5wcmVjaXNpb259IGA7XG5cdFx0XHR9XG5cblx0XHRcdHNoYWRlckNvZGUgKz0gYCR7dmFyeWluZy50eXBlfSAke3ZhcnlpbmcudmFyaWFibGVOYW1lfTtcXG5gO1xuXHRcdH1cblxuXHRcdHJldHVybiBVdGlsaXR5Ll9hZGRMaW5lRmVlZENvZGVJZk5vdE51bGxTdHJpbmcoc2hhZGVyQ29kZSk7XG5cdH1cblxuXHQvL1RPRE86IHRyYW5zbGF0ZSB3aGVuIGdsc2wgZXMxXG5cdHByaXZhdGUgX19jcmVhdGVPdXRwdXRDb2xvckRlY2xhcmF0aW9uU2hhZGVyQ29kZSgpOiBzdHJpbmcge1xuXHRcdGlmICh0aGlzLl9fc2hhZGVyU3RhZ2UgIT09ICdmcmFnbWVudCcpIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cblx0XHRyZXR1cm4gYGxheW91dChsb2NhdGlvbiA9IDApIG91dCB2ZWM0ICR7dGhpcy5fX291dHB1dENvbG9yVmFyaWFibGVOYW1lfTtcXG5cXG5gO1xuXHR9XG5cblx0cHJpdmF0ZSBfX2NyZWF0ZVVuaWZvcm1EZWNsYXJhdGlvblNoYWRlckNvZGUoKTogc3RyaW5nIHtcblx0XHRsZXQgc2hhZGVyQ29kZSA9ICcnO1xuXHRcdGZvciAoY29uc3QgdW5pZm9ybSBvZiB0aGlzLl9fdW5pZm9ybXMpIHtcblx0XHRcdHNoYWRlckNvZGUgKz0gYHVuaWZvcm0gYDtcblxuXHRcdFx0aWYgKHVuaWZvcm0ucHJlY2lzaW9uICE9IG51bGwpIHtcblx0XHRcdFx0c2hhZGVyQ29kZSArPSBgJHt1bmlmb3JtLnByZWNpc2lvbn0gYDtcblx0XHRcdH1cblxuXHRcdFx0c2hhZGVyQ29kZSArPSBgJHt1bmlmb3JtLnR5cGV9ICR7dW5pZm9ybS52YXJpYWJsZU5hbWV9O1xcbmA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFV0aWxpdHkuX2FkZExpbmVGZWVkQ29kZUlmTm90TnVsbFN0cmluZyhzaGFkZXJDb2RlKTtcblx0fVxuXG5cdHByaXZhdGUgX19jcmVhdGVVbmlmb3JtU3RydWN0RGVjbGFyYXRpb25TaGFkZXJDb2RlKCk6IHN0cmluZyB7XG5cdFx0bGV0IHNoYWRlckNvZGUgPSAnJztcblx0XHRmb3IgKGNvbnN0IHVuaWZvcm1TdHJ1Y3Qgb2YgdGhpcy5fX3VuaWZvcm1TdHJ1Y3RzKSB7XG5cdFx0XHRjb25zdCBzdHJ1Y3ROYW1lID0gdW5pZm9ybVN0cnVjdC5zdHJ1Y3ROYW1lO1xuXG5cdFx0XHRjb25zdCBleGlzdFN0cnVjdERlZmluaXRpb24gPVxuXHRcdFx0XHR0aGlzLl9fc3RydWN0RGVmaW5pdGlvbnMuc29tZShkZWZpbml0aW9uID0+IGRlZmluaXRpb24uc3RydWN0TmFtZSA9PT0gc3RydWN0TmFtZSk7XG5cdFx0XHRpZiAoIWV4aXN0U3RydWN0RGVmaW5pdGlvbikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBfX2NyZWF0ZVVuaWZvcm1TdHJ1Y3REZWNsYXJhdGlvblNoYWRlckNvZGU6IHRoZSBzdHJ1Y3QgdHlwZSAke3N0cnVjdE5hbWV9IGlzIG5vdCBkZWZpbmVkYCk7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRzaGFkZXJDb2RlICs9IGB1bmlmb3JtICR7c3RydWN0TmFtZX0gJHt1bmlmb3JtU3RydWN0LnZhcmlhYmxlTmFtZX07XFxuYDtcblx0XHR9XG5cblx0XHRyZXR1cm4gVXRpbGl0eS5fYWRkTGluZUZlZWRDb2RlSWZOb3ROdWxsU3RyaW5nKHNoYWRlckNvZGUpO1xuXHR9XG5cblx0cHJpdmF0ZSBfX2NyZWF0ZVVuaWZvcm1CdWZmZXJPYmplY3RTaGFkZXJDb2RlKCk6IHN0cmluZyB7XG5cdFx0bGV0IHNoYWRlckNvZGUgPSAnJztcblx0XHRmb3IgKGNvbnN0IHVibyBvZiB0aGlzLl9fdW5pZm9ybUJ1ZmZlck9iamVjdHMpIHtcblx0XHRcdHNoYWRlckNvZGUgKz0gYGxheW91dCAoc3RkMTQwKSB1bmlmb3JtICR7dWJvLmJsb2NrTmFtZX0ge1xcbmA7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdWJvLnZhcmlhYmxlT2JqZWN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCB2YXJpYWJsZU9iaiA9IHViby52YXJpYWJsZU9iamVjdHNbaV07XG5cdFx0XHRcdHNoYWRlckNvZGUgKz0gYCAgJHt2YXJpYWJsZU9iai50eXBlfSAke3ZhcmlhYmxlT2JqLnZhcmlhYmxlTmFtZX07XFxuYDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHViby5pbnN0YW5jZU5hbWUgIT0gbnVsbCkge1xuXHRcdFx0XHRzaGFkZXJDb2RlICs9IGB9ICR7dWJvLmluc3RhbmNlTmFtZX07XFxuYDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNoYWRlckNvZGUgKz0gYH07XFxuYDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gVXRpbGl0eS5fYWRkTGluZUZlZWRDb2RlSWZOb3ROdWxsU3RyaW5nKHNoYWRlckNvZGUpO1xuXHR9XG5cblx0cHJpdmF0ZSBfX2NyZWF0ZUZ1bmN0aW9uRGVmaW5pdGlvblNoYWRlckNvZGUoKTogc3RyaW5nIHtcblx0XHRsZXQgc2hhZGVyQ29kZSA9ICcnO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2Z1bmN0aW9ucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgZnVuY3Rpb25PYmplY3RzID0gdGhpcy5fX2Z1bmN0aW9uc1tpXTtcblx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgZnVuY3Rpb25PYmplY3RzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdHNoYWRlckNvZGUgKz0gZnVuY3Rpb25PYmplY3RzW2pdLmZ1bmN0aW9uQ29kZSArIGBcXG5gO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBVdGlsaXR5Ll9hZGRMaW5lRmVlZENvZGVJZk5vdE51bGxTdHJpbmcoc2hhZGVyQ29kZSk7XG5cdH1cblxuXHRwcml2YXRlIF9fY3JlYXRlTWFpbkZ1bmN0aW9uRGVmaW5pdGlvblNoYWRlckNvZGUoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5fX21haW5GdW5jdGlvbkNvZGUgKyBgXFxuYDtcblx0fVxufVxuIiwgImltcG9ydCB7U2hhZGVyQXR0cmlidXRlVmFyVHlwZSwgU2hhZGVyQ29uc3RhbnRWYWx1ZVZhclR5cGVFUzMsIFNoYWRlclVuaWZvcm1WYXJUeXBlRVMzLCBTaGFkZXJWYXJ5aW5nVmFyVHlwZX0gZnJvbSAnLi4vdHlwZXMvdHlwZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFV0aWxpdHkge1xuXHRzdGF0aWMgX3NwbGl0QnlMaW5lRmVlZENvZGUoc291cmNlOiBzdHJpbmcpIHtcblx0XHRyZXR1cm4gc291cmNlLnNwbGl0KC9cXHJcXG58XFxuLyk7XG5cdH1cblxuXHRzdGF0aWMgX2pvaW5TcGxpdHRlZExpbmUoc3BsaXR0ZWRMaW5lOiBzdHJpbmdbXSkge1xuXHRcdHJldHVybiBzcGxpdHRlZExpbmUuam9pbignXFxuJyk7XG5cdH1cblxuXHRzdGF0aWMgX2FkZExpbmVGZWVkQ29kZUlmTm90TnVsbFN0cmluZyhzb3VyY2U6IHN0cmluZykge1xuXHRcdHJldHVybiBzb3VyY2UgPT09ICcnID8gc291cmNlIDogc291cmNlICsgJ1xcbic7XG5cdH1cblxuXHRzdGF0aWMgX2NvbXBvbmVudE51bWJlcihcblx0XHR0eXBlOiBTaGFkZXJDb25zdGFudFZhbHVlVmFyVHlwZUVTMyB8IFNoYWRlckF0dHJpYnV0ZVZhclR5cGUgfCBTaGFkZXJWYXJ5aW5nVmFyVHlwZSB8IFNoYWRlclVuaWZvcm1WYXJUeXBlRVMzXG5cdCkge1xuXHRcdGxldCBjb21wb25lbnROdW1iZXI7XG5cdFx0aWYgKFxuXHRcdFx0dHlwZSA9PT0gJ2Zsb2F0JyB8fCB0eXBlID09PSAnaW50JyB8fCB0eXBlID09PSAnYm9vbCcgfHwgdHlwZSA9PT0gJ3VpbnQnIHx8XG5cdFx0XHR0eXBlID09PSAnc2FtcGxlcjJEJyB8fCB0eXBlID09PSAnc2FtcGxlckN1YmUnIHx8IHR5cGUgPT09ICdzYW1wbGVyM0QnIHx8IHR5cGUgPT09ICdzYW1wbGVyMkRBcnJheScgfHxcblx0XHRcdHR5cGUgPT09ICdpc2FtcGxlcjJEJyB8fCB0eXBlID09PSAnaXNhbXBsZXJDdWJlJyB8fCB0eXBlID09PSAnaXNhbXBsZXIzRCcgfHwgdHlwZSA9PT0gJ2lzYW1wbGVyMkRBcnJheScgfHxcblx0XHRcdHR5cGUgPT09ICd1c2FtcGxlcjJEJyB8fCB0eXBlID09PSAndXNhbXBsZXJDdWJlJyB8fCB0eXBlID09PSAndXNhbXBsZXIzRCcgfHwgdHlwZSA9PT0gJ3VzYW1wbGVyMkRBcnJheScgfHxcblx0XHRcdHR5cGUgPT09ICdzYW1wbGVyMkRTaGFkb3cnIHx8IHR5cGUgPT09ICdzYW1wbGVyQ3ViZVNoYWRvdycgfHwgdHlwZSA9PT0gJ3NhbXBsZXIyREFycmF5U2hhZG93J1xuXHRcdCkge1xuXHRcdFx0Y29tcG9uZW50TnVtYmVyID0gMTtcblx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICd2ZWMyJyB8fCB0eXBlID09PSAnaXZlYzInIHx8IHR5cGUgPT09ICdidmVjMicgfHwgdHlwZSA9PT0gJ3V2ZWMyJykge1xuXHRcdFx0Y29tcG9uZW50TnVtYmVyID0gMjtcblx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICd2ZWMzJyB8fCB0eXBlID09PSAnaXZlYzMnIHx8IHR5cGUgPT09ICdidmVjMycgfHwgdHlwZSA9PT0gJ3V2ZWMzJykge1xuXHRcdFx0Y29tcG9uZW50TnVtYmVyID0gMztcblx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICd2ZWM0JyB8fCB0eXBlID09PSAnaXZlYzQnIHx8IHR5cGUgPT09ICdidmVjNCcgfHwgdHlwZSA9PT0gJ3V2ZWM0JyB8fCB0eXBlID09PSAnbWF0MicgfHwgdHlwZSA9PT0gJ21hdDJ4MicpIHtcblx0XHRcdGNvbXBvbmVudE51bWJlciA9IDQ7XG5cdFx0fSBlbHNlIGlmICh0eXBlID09PSAnbWF0MngzJyB8fCB0eXBlID09PSAnbWF0M3gyJykge1xuXHRcdFx0Y29tcG9uZW50TnVtYmVyID0gNjtcblx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICdtYXQyeDQnIHx8IHR5cGUgPT09ICdtYXQ0eDInKSB7XG5cdFx0XHRjb21wb25lbnROdW1iZXIgPSA4O1xuXHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ21hdDMnIHx8IHR5cGUgPT09ICdtYXQzeDMnKSB7XG5cdFx0XHRjb21wb25lbnROdW1iZXIgPSA5O1xuXHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ21hdDN4NCcgfHwgdHlwZSA9PT0gJ21hdDR4MycpIHtcblx0XHRcdGNvbXBvbmVudE51bWJlciA9IDEyO1xuXHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ21hdDQnIHx8IHR5cGUgPT09ICdtYXQ0eDQnKSB7XG5cdFx0XHRjb21wb25lbnROdW1iZXIgPSAxNjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gdW5rbm93biB0eXBlXG5cdFx0XHRjb21wb25lbnROdW1iZXIgPSAwO1xuXHRcdFx0Y29uc29sZS5lcnJvcignVXRpbGl0eS5fY29tcG9uZW50TnVtYmVyOiBkZXRlY3QgdW5rbm93biB0eXBlJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvbXBvbmVudE51bWJlcjtcblx0fVxuXG5cdHN0YXRpYyBfaXNJbnRUeXBlKFxuXHRcdHR5cGU6IFNoYWRlckNvbnN0YW50VmFsdWVWYXJUeXBlRVMzIHwgU2hhZGVyQXR0cmlidXRlVmFyVHlwZSB8IFNoYWRlclZhcnlpbmdWYXJUeXBlIHwgU2hhZGVyVW5pZm9ybVZhclR5cGVFUzNcblx0KSB7XG5cdFx0aWYgKFxuXHRcdFx0dHlwZSA9PT0gJ2ludCcgfHwgdHlwZSA9PT0gJ2l2ZWMyJyB8fCB0eXBlID09PSAnaXZlYzMnIHx8IHR5cGUgPT09ICdpdmVjNCcgfHxcblx0XHRcdHR5cGUgPT09ICd1aW50JyB8fCB0eXBlID09PSAndXZlYzInIHx8IHR5cGUgPT09ICd1dmVjMycgfHwgdHlwZSA9PT0gJ3V2ZWM0J1xuXHRcdCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRzdGF0aWMgX2lzVmFsaWRDb21wb25lbnRDb3VudChcblx0XHR0eXBlOiBTaGFkZXJDb25zdGFudFZhbHVlVmFyVHlwZUVTMyB8IFNoYWRlckF0dHJpYnV0ZVZhclR5cGUgfCBTaGFkZXJWYXJ5aW5nVmFyVHlwZSB8IFNoYWRlclVuaWZvcm1WYXJUeXBlRVMzLFxuXHRcdHZhbHVlczogbnVtYmVyW11cblx0KSB7XG5cdFx0Y29uc3QgdmFsaWRDb21wb25lbnRDb3VudCA9IFV0aWxpdHkuX2NvbXBvbmVudE51bWJlcih0eXBlKTtcblx0XHRpZiAodmFsaWRDb21wb25lbnRDb3VudCA9PT0gdmFsdWVzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHN0YXRpYyBfaXNTYW1wbGVyVHlwZShcblx0XHR0eXBlOiBTaGFkZXJDb25zdGFudFZhbHVlVmFyVHlwZUVTMyB8IFNoYWRlckF0dHJpYnV0ZVZhclR5cGUgfCBTaGFkZXJWYXJ5aW5nVmFyVHlwZSB8IFNoYWRlclVuaWZvcm1WYXJUeXBlRVMzXG5cdCkge1xuXHRcdGlmIChcblx0XHRcdHR5cGUgPT09ICdzYW1wbGVyMkQnIHx8IHR5cGUgPT09ICdzYW1wbGVyQ3ViZScgfHwgdHlwZSA9PT0gJ3NhbXBsZXIzRCcgfHwgdHlwZSA9PT0gJ3NhbXBsZXIyREFycmF5JyB8fFxuXHRcdFx0dHlwZSA9PT0gJ2lzYW1wbGVyMkQnIHx8IHR5cGUgPT09ICdpc2FtcGxlckN1YmUnIHx8IHR5cGUgPT09ICdpc2FtcGxlcjNEJyB8fCB0eXBlID09PSAnaXNhbXBsZXIyREFycmF5JyB8fFxuXHRcdFx0dHlwZSA9PT0gJ3VzYW1wbGVyMkQnIHx8IHR5cGUgPT09ICd1c2FtcGxlckN1YmUnIHx8IHR5cGUgPT09ICd1c2FtcGxlcjNEJyB8fCB0eXBlID09PSAndXNhbXBsZXIyREFycmF5JyB8fFxuXHRcdFx0dHlwZSA9PT0gJ3NhbXBsZXIyRFNoYWRvdycgfHwgdHlwZSA9PT0gJ3NhbXBsZXJDdWJlU2hhZG93JyB8fCB0eXBlID09PSAnc2FtcGxlcjJEQXJyYXlTaGFkb3cnXG5cdFx0KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwgIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCAiIiwgIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LnRzXCIpO1xuIiwgIiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtCQUFBLGNBQUEsZ0JBQUFBOztjQUFBO1lBQUEsQ0FBQTtBQXlFQSxZQUFBQyxTQUFBLFNBQUEsSUFBZSxZQUFBOzs7Ozs7Ozs7OztZQ3pFZixNQUFxQixhQUFZO2NBR3JCLE9BQU8sa0JBQWtCLFdBQWlCO0FBRTlDLHNCQUFNLG9CQUFvQjtBQUUxQixzQkFBTSxlQUFlO0FBRXJCLHNCQUFNLGtCQUFrQjtBQUd4QixvQkFBSSx1QkFBdUI7QUFHM0IsdUNBQXVCLHFCQUFxQixRQUFRLGNBQWMsQ0FBQyxHQUFHLFNBQVE7QUFDMUUseUJBQU8sS0FBSyxZQUFZLElBQUksSUFBSSxJQUFJLFNBQVM7Z0JBQ2pELENBQUM7QUFHRCx1Q0FBdUIscUJBQXFCLFFBQVEsaUJBQWlCLENB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
