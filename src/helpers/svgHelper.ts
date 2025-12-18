import Handlebars from 'handlebars/runtime';

Handlebars.registerHelper('svg', function (src: string, options: any) {
    const className = options.hash.class ?? '';

    const isSvg = src.trim().toLowerCase().endsWith('.svg');

    if (isSvg) {
        return new Handlebars.SafeString(`
            <svg class="${className}">
                <use href="${src}"></use>
            </svg>
        `);
    } else {
        return new Handlebars.SafeString(`
            <img src="${src}" class="${className}" alt="image" />
        `);
    }
});

export {};
