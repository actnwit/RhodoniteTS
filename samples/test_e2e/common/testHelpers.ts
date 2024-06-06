export function checkFinished({
  p,
  count,
}: {
  p?: HTMLParagraphElement;
  count: number;
}): [HTMLParagraphElement | undefined, number] {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  return [p, count];
}

export function getProcessApproach(Rn: any) {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');

  if (mode === 'uniform') {
    return Rn.ProcessApproach.Uniform;
  } else if (mode === 'datatexture') {
    return Rn.ProcessApproach.DataTexture;
  } else if (mode === 'webgpu') {
    return Rn.ProcessApproach.WebGPU;
  } else {
    return Rn.ProcessApproach.DataTexture; // Default
  }
}

export function getGltfFilePath() {
  const params = new URLSearchParams(window.location.search);
  const gltfName = params.get('gltf');
  const gltfFormat = params.get('gltfformat');
  if (gltfName == null) {
    throw new Error('gltf parameter is not specified.');
  }
  if (gltfFormat == null) {
    throw new Error('glftformat parameter is not specified.');
  }

  const basePath = '../../../assets/gltf/glTF-Sample-Assets/Models';

  let gltfFilePath = `${basePath}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`;
  if (gltfFormat === 'glb') {
    gltfFilePath = `${basePath}/${gltfName}/glTF-Binary/${gltfName}.glb`;
  } else if (gltfFormat === 'gltf') {
    gltfFilePath = `${basePath}/${gltfName}/glTF/${gltfName}.gltf`;
  } else if (gltfFormat === 'embedded') {
    gltfFilePath = `${basePath}/${gltfName}/glTF-Embedded/${gltfName}.gltf`;
  } else if (gltfFormat === 'draco') {
    gltfFilePath = `${basePath}/${gltfName}/glTF-Draco/${gltfName}.gltf`;
  } else if (gltfFormat === 'quantized') {
    gltfFilePath = `${basePath}/${gltfName}/glTF-Quantized/${gltfName}.gltf`;
  } else if (gltfFormat === 'jpg-png') {
    gltfFilePath = `${basePath}/${gltfName}/glTF-JPG-PNG/${gltfName}.gltf`;
  } else if (gltfFormat === 'ktx-basisu') {
    gltfFilePath = `${basePath}/${gltfName}/glTF-KTX-BasisU/${gltfName}.gltf`;
  } else {
    throw new Error('Unknown gltf format.');
  }

  return gltfFilePath;
}
