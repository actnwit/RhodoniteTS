let worldMatrix = get_worldMatrix(u32(instance_ids.x));
let viewMatrix = get_viewMatrix(cameraSID);
let projectionMatrix = get_projectionMatrix(cameraSID);
output.position = projectionMatrix * viewMatrix * worldMatrix * position;
