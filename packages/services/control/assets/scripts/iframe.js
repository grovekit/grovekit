
globalThis.qResizeIframe = (el) => {
  el.style.height = el.contentWindow.document.documentElement.scrollHeight + 'px';
}
