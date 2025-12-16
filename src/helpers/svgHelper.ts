// helpers/svgHelper.ts
import Handlebars from 'handlebars/runtime'; // <- очень важно!

Handlebars.registerHelper('svg', function (src: string, options: any) {
    const className = options.hash.class ?? '';
    return new Handlebars.SafeString(`
        <svg class="${className}">
            <use href="${src}"></use>
        </svg>
    `);
});

export {};
