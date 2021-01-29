import { tagToClassNameMap, plainMimeType, htmlMimeType } from './constants';
import { sanitizeNode } from './sanitizeNode';
import { rangeToFragmentWithStyles } from './rangeToFragmentWithStyles';
import { createElement, isBlockNode, getParentBlockNode, ensureContentWrapped } from './utils';

const editorElement = document.querySelector('.edit-area');
const h1ButtonElement = document.querySelector('.head-1');
const h2ButtonElement = document.querySelector('.head-2');
const boldButtonElement = document.querySelector('.bold');
const italicButtonElement = document.querySelector('.italic');

editorElement.contentEditable = true;

function getEditorHighlight() {
  let selection = window.getSelection();
  let range = null;

  if (selection && selection.anchorNode) {
    if (!editorElement.contains(selection.anchorNode)) {
      selection = null;
    }
  }

  if (selection && selection.rangeCount) {
    range = selection.getRangeAt(0);
  }

  return {
    selection,
    range,
  };
}

function formatInline(tagName, className) {
  const { range } = getEditorHighlight();

  if (range) {
    if (!range.collapsed) {
      const node = createElement(tagName, className);

      node.appendChild(range.extractContents());
      range.insertNode(node);
    }

    editorElement.focus();
  }
}

function formatHeader(tagName, className) {
  const { range } = getEditorHighlight();

  if (range) {
    const node = createElement(tagName, className);

    if (range.collapsed) {
      // if there is no selected range
      // looking for closest parent block node and apply to entire node
      const { startOffset, startContainer } = range;
      const parentNode = getParentBlockNode(range.startContainer);

      if (parentNode) {
        range.selectNodeContents(parentNode);
        node.appendChild(range.extractContents());
        parentNode.replaceWith(node);
      } else {
        node.appendChild(range.startContainer);
        range.insertNode(node);
      }

      try {
        // and try restore cursor position
        range.setStart(startContainer, startOffset);
        range.setEnd(startContainer, startOffset);
      } catch (e) {
        range.selectNodeContents(node);
        range.collapse();
      }
    } else {
      [...range.extractContents().childNodes].forEach((child) => {
        // avoiding block nodes inside headers
        if (isBlockNode(child)) {
          node.appendChild(document.createTextNode(child.textContent));
        } else {
          node.appendChild(child);
        }
      });

      range.insertNode(node);
    }

    editorElement.focus();
  }
}

function selectionToClipboard(event, cutMode = false) {
  const { selection, range } = getEditorHighlight();

  if (range) {
    const result = document.createElement('div');
    result.appendChild(rangeToFragmentWithStyles(editorElement, range, cutMode));

    event.clipboardData.setData(plainMimeType, selection.toString());
    event.clipboardData.setData(htmlMimeType, result.innerHTML);
  }
}

// editor event handlers

editorElement.addEventListener('copy', (event) => {
  event.preventDefault();

  selectionToClipboard(event);
});

editorElement.addEventListener('cut', (event) => {
  event.preventDefault();

  selectionToClipboard(event, true);
});

editorElement.addEventListener('focus', () => {
  const { selection } = getEditorHighlight();

  ensureContentWrapped(editorElement, selection);
});

editorElement.addEventListener('input', () => {
  const { selection } = getEditorHighlight();

  ensureContentWrapped(editorElement, selection);
});

editorElement.addEventListener('drop', (event) => {
  event.preventDefault();
});

editorElement.addEventListener('paste', (event) => {
  event.preventDefault();

  const fragment = document.createDocumentFragment();
  const html = event.clipboardData.getData(htmlMimeType);

  if (html) {
    const { body } = new DOMParser().parseFromString(html, htmlMimeType);

    fragment.appendChild(sanitizeNode(body));
  } else {
    const text = event.clipboardData.getData(plainMimeType);

    if (!text) return;

    text.split(/\r?\n/).forEach((line) => {
      const div = document.createElement('div');

      div.textContent = line;

      fragment.appendChild(div);
    });
  }

  const { range } = getEditorHighlight();

  if (!range) return;

  if (!range.collapsed) range.deleteContents();

  range.insertNode(fragment);
  range.collapse();
});

// buttons event handlers

boldButtonElement.addEventListener('click', () => {
  formatInline('b', tagToClassNameMap.b);
});

italicButtonElement.addEventListener('click', () => {
  formatInline('i', tagToClassNameMap.i);
});

h1ButtonElement.addEventListener('click', () => {
  formatHeader('h1', tagToClassNameMap.h1);
});

h2ButtonElement.addEventListener('click', () => {
  formatHeader('h2', tagToClassNameMap.h2);
});
