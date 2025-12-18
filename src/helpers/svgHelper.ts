import Handlebars from 'handlebars/runtime';

Handlebars.registerHelper('svg', function (src: string, options: any) {
    const className = options.hash.class ?? '';
    console.log(src);

    let isSvg = false;

    try {
        const url = new URL(src, window.location.origin);
        isSvg = url.pathname.toLowerCase().endsWith('.svg');
    } catch {
        isSvg = src.toLowerCase().endsWith('.svg');
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
