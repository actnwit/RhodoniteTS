void sdBox(in vec3 position, in vec3 size, out float outDistance) {
  vec3 q=abs(position)-size;
  outDistance = length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);
}
