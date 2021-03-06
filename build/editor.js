(() => {
  // src/constants.js
  var tagToClassNameMap = {
    b: "bold-text",
    strong: "bold-text",
    i: "italic-text",
    h1: "header1-text",
    h2: "header2-text"
  };
  var plainMimeType = "text/plain";
  var htmlMimeType = "text/html";

  // src/sanitizeNode.js
  var unSupportedTags = ["body", "a", "script", "style", "button", "input"];
  var exceptionTags = {
    img: "\u{1F4FA}",
    video: "\u{1F3AC}",
    audio: "\u{1F3B9}"
  };
  function sanitizeNode(node) {
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

  // src/applyComputedInlineStyles.js
  var supportedStyleProps = [
    "color",
    "font-size",
    "font-style",
    "font-weight",
    "font-family",
    "font-variant",
    "text-transform",
    "text-decoration",
    "line-height"
  ];
  function removeInlineStyles(node) {
    if (node.nodeType !== Node.ELEMENT_NODE)
      return;
    node.removeAttribute("style");
    [...node.childNodes].forEach((child) => removeInlineStyles(child));
  }
  function addComputedInlineStyles(node) {
    if (node.nodeType !== Node.ELEMENT_NODE)
      return;
    if (node.tagName.toLowerCase() in tagToClassNameMap) {
      const computedStyle = window.getComputedStyle(node);
      supportedStyleProps.forEach((prop) => {
        node.style.setProperty(prop, computedStyle.getPropertyValue(prop));
      });
    }
    [...node.childNodes].forEach((child) => applyComputedInlineStyles(child));
  }
  function applyComputedInlineStyles(node) {
    addComputedInlineStyles(node);
    setTimeout(() => removeInlineStyles(node), 0);
  }

  // src/utils.js
  function createElement(tagName, className) {
    const element = document.createElement(tagName);
    element.className = className;
    return element;
  }
  function isBlockNode(node) {
    return /^(p|div|h[1-6])$/i.test(node.tagName);
  }
  function getParentBlockNode(node, rootNode) {
    if (node === rootNode) {
      return null;
    }
    if (isBlockNode(node)) {
      return node;
    }
    return getParentBlockNode(node.parentNode, rootNode);
  }
  function ensureContentWrapped(element, selection) {
    if (element.childNodes.length)
      return;
    const div = document.createElement("div");
    div.appendChild(document.createElement("br"));
    element.appendChild(div);
    const range = document.createRange();
    range.setStart(div, 0);
    range.setEnd(div, 0);
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  // src/index.js
  var editorElement = document.querySelector(".edit-area");
  var h1ButtonElement = document.querySelector(".head-1");
  var h2ButtonElement = document.querySelector(".head-2");
  var boldButtonElement = document.querySelector(".bold");
  var italicButtonElement = document.querySelector(".italic");
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
      range
    };
  }
  function formatInline(tagName, className) {
    const {range} = getEditorHighlight();
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
    const {range} = getEditorHighlight();
    if (range) {
      const node = createElement(tagName, className);
      if (range.collapsed) {
        const {startOffset, startContainer} = range;
        const parentNode = getParentBlockNode(range.startContainer, editorElement);
        if (parentNode) {
          range.selectNodeContents(parentNode);
          node.appendChild(range.extractContents());
          parentNode.replaceWith(node);
        } else {
          node.appendChild(range.startContainer);
          range.insertNode(node);
        }
        try {
          range.setStart(startContainer, startOffset);
          range.setEnd(startContainer, startOffset);
        } catch (e) {
          range.selectNodeContents(node);
          range.collapse();
        }
      } else {
        node.appendChild(range.extractContents());
        range.insertNode(node);
      }
      editorElement.focus();
    }
  }
  editorElement.addEventListener("focus", () => {
    const {selection} = getEditorHighlight();
    ensureContentWrapped(editorElement, selection);
  });
  editorElement.addEventListener("input", () => {
    const {selection} = getEditorHighlight();
    ensureContentWrapped(editorElement, selection);
  });
  editorElement.addEventListener("drop", (event) => {
    event.preventDefault();
  });
  editorElement.addEventListener("copy", () => {
    applyComputedInlineStyles(editorElement);
  });
  editorElement.addEventListener("cut", () => {
    applyComputedInlineStyles(editorElement);
  });
  editorElement.addEventListener("paste", (event) => {
    event.preventDefault();
    const {range} = getEditorHighlight();
    if (!range)
      return;
    const fragment = document.createDocumentFragment();
    const html = event.clipboardData.getData(htmlMimeType);
    if (html) {
      const {body} = new DOMParser().parseFromString(html, htmlMimeType);
      fragment.appendChild(sanitizeNode(body));
    } else {
      const text = event.clipboardData.getData(plainMimeType);
      if (!text)
        return;
      text.split(/\r?\n/).forEach((line) => {
        const div = document.createElement("div");
        div.textContent = line;
        fragment.appendChild(div);
      });
    }
    if (!range.collapsed)
      range.deleteContents();
    range.insertNode(fragment);
    range.collapse();
  });
  boldButtonElement.addEventListener("click", () => {
    formatInline("b", tagToClassNameMap.b);
  });
  italicButtonElement.addEventListener("click", () => {
    formatInline("i", tagToClassNameMap.i);
  });
  h1ButtonElement.addEventListener("click", () => {
    formatHeader("h1", tagToClassNameMap.h1);
  });
  h2ButtonElement.addEventListener("click", () => {
    formatHeader("h2", tagToClassNameMap.h2);
  });
})();
