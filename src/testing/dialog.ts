/**
 * jsdom doesn't implement HTMLDialogElement.showModal()/close(). This minimal stand-in toggles
 * `open` and fires `close` like a browser; real modal behaviour (Esc, focus trap, backdrop)
 * is verified in a real browser.
 */
export function polyfillDialog(): void {
  const proto = HTMLDialogElement.prototype;
  if (typeof proto.showModal !== 'function') {
    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (typeof proto.close !== 'function') {
    proto.close = function (this: HTMLDialogElement) {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
