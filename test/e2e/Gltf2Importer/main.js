import Rn from "../../../dist/rhodonite.mjs";

let p = null;

const load = async function(time){

  const importer = Rn.Gltf2Importer.getInstance();
  const response = await importer.import('../../../assets/gltf/2.0/Box/glTF/Box.gltf');

  if (p == null) {
    if (response != null) {
      const gl = document.getElementById('world').getContext('webgl');
      gl.clearColor(1, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    p = document.createElement('p');
    p.setAttribute("id", "rendered");
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }
}

document.body.onload = load;

