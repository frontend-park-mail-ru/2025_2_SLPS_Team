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


function fixExternalSVGForMobile() {
  if (window.innerWidth > 768) return;

  const svgUses = document.querySelectorAll<SVGUseElement>('svg use');

  svgUses.forEach(async (use) => {
    const href = use.getAttribute('href');
    if (!href) return;

    if (!href.startsWith('#')) {
      try {
        const res = await fetch(href);
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return;

        const parent = use.parentElement as unknown as SVGSVGElement;
        if (!parent) return;

        parent.innerHTML = '';
        Array.from(svg.childNodes).forEach((child) => {
          parent.appendChild(child.cloneNode(true));
        });
      } catch (e) {
        console.warn('Не удалось подгрузить SVG:', href, e);
      }
    }
  });
}

window.addEventListener('load', fixExternalSVGForMobile);
window.addEventListener('resize', fixExternalSVGForMobile);

