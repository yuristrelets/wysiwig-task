export function createElement(tagName, className) {
  const element = document.createElement(tagName);

  element.className = className;

  return element;
}

export function isBlockNode(node) {
  // support some block nodes
  return /^(p|div|h[1-6])$/i.test(node.tagName);
}

export function getParentBlockNode(node, rootNode) {
  if (node === rootNode) {
    return null;
  }

  if (isBlockNode(node)) {
    return node;
  }

  return getParentBlockNode(node.parentNode, rootNode);
}

export function ensureContentWrapped(element, selection) {
  if (element.childNodes.length) return;

  const div = document.createElement('div');

  div.appendChild(document.createElement('br'));
  element.appendChild(div);

  const range = document.createRange();
  range.setStart(div, 0);
  range.setEnd(div, 0);

  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
