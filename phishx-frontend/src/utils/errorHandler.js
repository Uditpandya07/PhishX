export const showErrorPopup = (message) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent('show-error-popup', { detail: { message } }));
  }
};
