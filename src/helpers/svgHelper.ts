import Handlebars from 'handlebars/runtime';

Handlebars.registerHelper('svg', function (src: string, options: any) {
  const className = options.hash.class ?? '';
  const isSvg = src.toLowerCase().endsWith('.svg') || src === '/public/globalImages/DefaultAvatar.svg';

  if (!isSvg) {
    return new Handlebars.SafeString(`<img src="${src}" class="${className}" alt="image" />`);
  }

  return new Handlebars.SafeString(`<div class="${className}" data-svg-src="${src}"></div>`);
});

export {};



export function inlineExternalSVGs(root: HTMLElement | Document = document) {
  const svgPlaceholders = root.querySelectorAll<HTMLElement>('[data-svg-src]');

  svgPlaceholders.forEach(async (el) => {
    const src = el.getAttribute('data-svg-src');
    if (!src) return;

    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svgText = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

      svg.removeAttribute('width');
      svg.removeAttribute('height');

      const className = el.getAttribute('class') ?? '';
      svg.setAttribute('class', className);
      svg.setAttribute('fill', 'currentColor');

      el.replaceWith(svg);
    } catch (err) {
      console.warn('Не удалось загрузить SVG:', src, err);
    }
  });
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((m) => {
    m.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        inlineExternalSVGs(node);
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });

inlineExternalSVGs();
