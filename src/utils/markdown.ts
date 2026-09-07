import { marked } from 'marked';
import hljs from 'highlight.js/lib/common';

const allowed = new Set(
    ('P H1 H2 H3 H4 H5 H6 UL OL LI PRE CODE BLOCKQUOTE STRONG EM DEL A IMG '
        + 'TABLE THEAD TBODY TR TH TD HR BR DETAILS SUMMARY INPUT').split(' '),
);
const images = import.meta.glob<string>('../../Lessons/**/*.{png,jpg,jpeg,gif,svg,webp}', {
    query: '?url',
    import: 'default',
});

function safeUrl(value: string, base: string | URL) {
    try {
        return new URL(value, base);
    } catch {
        return null;
    }
}
function decodedPath(value: string) {
    try {
        return decodeURI(value);
    } catch {
        return value;
    }
}
export async function renderMarkdown(source: string, directory: string) {
    const parsed = new DOMParser().parseFromString(await marked.parse(source), 'text/html');
    const imageLoads: Promise<void>[] = [];
    for (const element of Array.from(parsed.body.querySelectorAll('*'))) {
        if (!allowed.has(element.tagName)) {
            element.remove();
            continue;
        }
        const link = element.getAttribute('href');
        const image = element.getAttribute('src');
        const alt = element.getAttribute('alt');
        const title = element.getAttribute('title');
        const checked = element.hasAttribute('checked');
        for (const attribute of Array.from(element.attributes)) {
            element.removeAttribute(attribute.name);
        }
        if (title) {
            element.setAttribute('title', title);
        }
        if (element.tagName === 'INPUT') {
            element.setAttribute('type', 'checkbox');
            element.setAttribute('disabled', '');
            if (checked) {
                element.setAttribute('checked', '');
            }
        }
        if (element.tagName === 'A' && link) {
            const url = safeUrl(link, new URL(`../${directory}/`, location.href));
            if (url && ['http:', 'https:', 'mailto:'].includes(url.protocol)) {
                element.setAttribute('href', url.href);
                element.setAttribute('target', '_blank');
                element.setAttribute('rel', 'noopener noreferrer');
            }
        }
        if (element.tagName === 'IMG' && image) {
            const relative = safeUrl(image, `https://course.invalid/${directory}/`);
            const loader = relative && images[`../../${decodedPath(relative.pathname.slice(1))}`];
            if (loader && relative?.origin === 'https://course.invalid') {
                imageLoads.push(
                    loader().then((url) => {
                        element.setAttribute('src', url);
                    }),
                );
            } else if (/^https?:\/\//i.test(image)) {
                element.setAttribute('src', image);
            }
            if (alt) {
                element.setAttribute('alt', alt);
            }
            element.setAttribute('loading', 'lazy');
        }
    }
    await Promise.allSettled(imageLoads);
    for (const code of Array.from(parsed.body.querySelectorAll('pre code'))) {
        code.innerHTML = hljs.highlightAuto(code.textContent ?? '').value;
    }
    return parsed.body.innerHTML;
}
