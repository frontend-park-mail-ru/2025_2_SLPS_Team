import Handlebars from 'handlebars/runtime';

Handlebars.registerHelper('svg', function (src: string, options: any) {
    const className = options.hash.class ?? '';

    let isSvg = false;


    const defaultAvatarPath = '/public/globalImages/DefaultAvatar.svg';
    if (src === defaultAvatarPath) {
        isSvg = true;
    } else {
        try {
            const url = new URL(src, window.location.origin);
            isSvg = url.pathname.toLowerCase().endsWith('.svg');
        } catch {
            isSvg = src.toLowerCase().endsWith('.svg');
        }
    }

    if (isSvg) {
        return new Handlebars.SafeString(`
            <svg class="${className}">
                <use href="${src}"></use>
            </svg>
        `);
    }

    return new Handlebars.SafeString(`
        <img src="${src}" class="${className}" alt="image" />
    `);
});

export {};


// svgHelper.ts
export function inlineExternalSVGs(root: HTMLElement | Document = document) {
  const svgUses = root.querySelectorAll<SVGUseElement>('svg use');

  svgUses.forEach(async (use) => {
    const href = use.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#')) return;

    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svgText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

      const parent = use.parentElement;
      if (!parent) return;

      parent.innerHTML = '';
      Array.from(svg.childNodes).forEach((child) => {
        parent.appendChild(child.cloneNode(true));
      });

      const className = parent.getAttribute('class') ?? '';
      parent.setAttribute('class', className);
      parent.removeAttribute('width');
      parent.removeAttribute('height');

    } catch (err) {
      console.warn('Не удалось загрузить SVG:', href, err);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => inlineExternalSVGs());
} else {
  inlineExternalSVGs();
}

