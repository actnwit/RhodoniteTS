export function checkFinished({ p, count, }) {
    if (p == null && count > 0) {
        p = document.createElement('p');
        p.setAttribute('id', 'rendered');
        p.innerText = 'Rendered.';
        document.body.appendChild(p);
    }
    return [p, count];
}
export function getProcessApproach(Rn) {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'uniform') {
        return Rn.ProcessApproach.Uniform;
    }
    else if (mode === 'datatexture') {
        return Rn.ProcessApproach.DataTexture;
    }
    else if (mode === 'webgpu') {
        return Rn.ProcessApproach.WebGPU;
    }
    else {
        return Rn.ProcessApproach.DataTexture; // Default
    }
}
//# sourceMappingURL=testHelpers.js.map