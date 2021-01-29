import { tagToClassNameMap } from './constants';

const unSupportedTags = ['body', 'a', 'script', 'style', 'button', 'input'];

const exceptionTags = {
  img: '📺',
  video: '🎬',
  audio: '🎹',
};

export function sanitizeNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.tagName.toLowerCase();

    if (tagName in exceptionTags) {
      return document.createTextNode(exceptionTags[tagName]);
    }

    let newNode;

    if (unSupportedTags.includes(tagName)) {
      newNode = document.createDocumentFragment();
    } else {
      newNode = document.createElement(tagName);

      if (tagName in tagToClassNameMap) {
        newNode.className = tagToClassNameMap[tagName];
      }
    }

    [...node.childNodes].forEach((child) => newNode.appendChild(sanitizeNode(child)));

    return newNode;
  }

  return document.createDocumentFragment();
}
