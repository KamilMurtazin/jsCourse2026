import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('task Markdown rendering', () => {
    it('removes executable markup, event handlers, unsafe URLs and style leakage', async () => {
        const result = await renderMarkdown(
            '<script>alert(1)</script><style>body{display:none}</style><p onclick="alert(1)">text</p>'
                + '<a href="javascript:alert(1)">bad</a><iframe src="/"></iframe>',
            'Lessons/test',
        );
        const host = document.createElement('div');
        host.innerHTML = result;
        expect(host.querySelector('script,style,iframe,[onclick],[href]')).toBeNull();
        expect(host.textContent).toContain('text');
    });
    it('renders source code as text instead of injecting HTML', async () => {
        const result = await renderMarkdown(
            '```js\nconst html = "<img onerror=alert(1)>";\n```',
            'Lessons/test',
        );
        const host = document.createElement('div');
        host.innerHTML = result;
        expect(host.querySelector('pre code')?.textContent).toContain('<img onerror=alert(1)>');
        expect(host.querySelector('img')).toBeNull();
    });
    it('retains accessible external links and checked task lists', async () => {
        const result = await renderMarkdown('[Guide](https://example.com)\n\n- [x] done', 'Lessons/test');
        const host = document.createElement('div');
        host.innerHTML = result;
        expect(host.querySelector('a')?.rel).toBe('noopener noreferrer');
        expect(host.querySelector('input')?.checked).toBe(true);
        expect(host.querySelector('input')?.disabled).toBe(true);
    });
    it('does not fail the whole task for malformed links', async () => {
        await expect(renderMarkdown('<a href="http://[">link</a> text', 'Lessons/test')).resolves.toContain(
            'text',
        );
    });
    it('does not fail the whole task for a malformed image path', async () => {
        await expect(renderMarkdown('![image](./bad%path.png) text', 'Lessons/test')).resolves.toContain('text');
    });
});
