
void branch(in bool condition, in float ifTrue, in float ifFalse, out float outValue) {
  outValue = condition ? ifTrue : ifFalse;
}

void branch(in bool condition, in int ifTrue, in int ifFalse, out int outValue) {
  outValue = condition ? ifTrue : ifFalse;
}

void branch(in bool condition, in vec2 ifTrue, in vec2 ifFalse, out vec2 outValue) {
  outValue = condition ? ifTrue : ifFalse;
}

void branch(in bool condition, in vec3 ifTrue, in vec3 ifFalse, out vec3 outValue) {
  outValue = condition ? ifTrue : ifFalse;
}

void branch(in bool condition, in vec4 ifTrue, in vec4 ifFalse, out vec4 outValue) {
  outValue = condition ? ifTrue : ifFalse;
}





