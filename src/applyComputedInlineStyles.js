import { tagToClassNameMap } from './constants';

// support only some style properties
const supportedStyleProps = [
  'color',
  'font-size',
  'font-style',
  'font-weight',
  'font-family',
  'font-variant',
  'text-transform',
  'text-decoration',
  'line-height',
];

export function applyComputedInlineStyles(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  if (node.tagName.toLowerCase() in tagToClassNameMap) {
    const computedStyle = window.getComputedStyle(node);

    supportedStyleProps.forEach((prop) => {
      node.style.setProperty(prop, computedStyle.getPropertyValue(prop));
    });
  }

  [...node.childNodes].forEach((child) => applyComputedInlineStyles(child));
}
