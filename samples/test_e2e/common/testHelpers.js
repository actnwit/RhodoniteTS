export function checkFinished({ p, count, }) {
    if (p == null && count > 0) {
        p = document.createElement('p');
        p.setAttribute('id', 'rendered');
        p.innerText = 'Rendered.';
        document.body.appendChild(p);
    }
    return [p, count];
}
//# sourceMappingURL=testHelpers.js.map