// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/Clamp.glsl
var code = "void _clamp(in float value, in float min, in float max, out float outValue) {\n  outValue = clamp(value, min, max);\n}\nvoid _clamp(in vec2 value, in vec2 min, in vec2 max, out vec2 outValue) {\n  outValue = clamp(value, min, max);\n}\nvoid _clamp(in vec3 value, in vec3 min, in vec3 max, out vec3 outValue) {\n  outValue = clamp(value, min, max);\n}\nvoid _clamp(in vec4 value, in vec4 min, in vec4 max, out vec4 outValue) {\n  outValue = clamp(value, min, max);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Clamp_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Clamp_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvQ2xhbXAuZ2xzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwidm9pZCBfY2xhbXAoaW4gZmxvYXQgdmFsdWUsIGluIGZsb2F0IG1pbiwgaW4gZmxvYXQgbWF4LCBvdXQgZmxvYXQgb3V0VmFsdWUpIHtcXG4gIG91dFZhbHVlID0gY2xhbXAodmFsdWUsIG1pbiwgbWF4KTtcXG59XFxudm9pZCBfY2xhbXAoaW4gdmVjMiB2YWx1ZSwgaW4gdmVjMiBtaW4sIGluIHZlYzIgbWF4LCBvdXQgdmVjMiBvdXRWYWx1ZSkge1xcbiAgb3V0VmFsdWUgPSBjbGFtcCh2YWx1ZSwgbWluLCBtYXgpO1xcbn1cXG52b2lkIF9jbGFtcChpbiB2ZWMzIHZhbHVlLCBpbiB2ZWMzIG1pbiwgaW4gdmVjMyBtYXgsIG91dCB2ZWMzIG91dFZhbHVlKSB7XFxuICBvdXRWYWx1ZSA9IGNsYW1wKHZhbHVlLCBtaW4sIG1heCk7XFxufVxcbnZvaWQgX2NsYW1wKGluIHZlYzQgdmFsdWUsIGluIHZlYzQgbWluLCBpbiB2ZWM0IG1heCwgb3V0IHZlYzQgb3V0VmFsdWUpIHtcXG4gIG91dFZhbHVlID0gY2xhbXAodmFsdWUsIG1pbiwgbWF4KTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQXVkLGtCQUFjO0FBQVcsdUJBQW1CO0FBQTNnQixzQkFBQyxNQUE4ZCxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==
