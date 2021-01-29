// support only some style properties
const supportedStyleProps = [
  'color',
  'font-size',
  'font-style',
  'font-variant',
  'font-weight',
  'font-family',
  'line-height',
  'text-decoration',
  'text-transform',
  'margin',
];

function applyComputedInlineStyles(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const computedStyle = window.getComputedStyle(node);

  supportedStyleProps.forEach((prop) => {
    node.style.setProperty(prop, computedStyle.getPropertyValue(prop));
  });

  [...node.childNodes].forEach((child) => applyComputedInlineStyles(child));
}

function removeInlineStyles(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  node.removeAttribute('style');

  [...node.childNodes].forEach((child) => removeInlineStyles(child));
}

export function rangeToFragmentWithStyles(rootNode, range, cutMode = false) {
  // temporarily add inline computed styles
  applyComputedInlineStyles(rootNode);

  const fragment = cutMode ? range.extractContents() : range.cloneContents();

  // and remove inline styles
  removeInlineStyles(rootNode);

  return fragment;
}
