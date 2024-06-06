const sanitize = str => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

let isTestTopPage = false;
if (parent != null && parent.location.href.indexOf('samples/#') !== -1) {
  isTestTopPage = true;
}

const a = document.createElement('a');

if (isTestTopPage) {
  a.innerText = 'Show this sample only';
  a.setAttribute('href', parent.location.href.replace('#', ''));
  a.setAttribute('target', '_parent');
} else {
  const chopLastSlash = document.location.href.replace(/\/$/, '');
  const newUri = chopLastSlash.replace(/samples\//, 'samples/#');
  a.innerText = 'Show Index';
  a.setAttribute('href', newUri);
}

document.body.insertBefore(a, document.body.firstChild);
