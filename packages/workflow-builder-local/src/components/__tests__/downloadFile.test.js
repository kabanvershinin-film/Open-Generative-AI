import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const modulePath = '/workspace/packages/workflow-builder-local/src/components/file/downloadFile.js';

async function loadDownloadFileModule({ axiosDefault, toast, fetchImpl, windowObj, documentObj, consoleError }) {
    const source = await fs.readFile(modulePath, 'utf8');
    const transformed = source
        .replace('import axios from "axios";', '')
        .replace('import { toast } from "react-hot-toast";', '')
        .replace('export const downloadFile = async', 'const downloadFile = async');
    const factory = new Function(
        'axios',
        'toast',
        'fetch',
        'window',
        'document',
        'console',
        'Blob',
        `${transformed}\nreturn { downloadFile };`
    );

    return factory(
        axiosDefault,
        toast,
        fetchImpl,
        windowObj,
        documentObj,
        { error: consoleError ?? (() => {}) },
        Blob
    ).downloadFile;
}

test('downloadFile reports missing file url early', async () => {
    const toastCalls = [];
    const downloadFile = await loadDownloadFileModule({
        axiosDefault: { post: async () => { throw new Error('axios should not be called'); } },
        toast: { error: (message) => toastCalls.push(message) },
        fetchImpl: async () => { throw new Error('fetch should not be called'); },
        windowObj: { URL: { createObjectURL() {}, revokeObjectURL() {} } },
        documentObj: { body: { appendChild() {}, removeChild() {} }, createElement() { return { click() {} }; } },
    });

    await downloadFile();

    assert.deepStrictEqual(toastCalls, ['File URL not found']);
});

test('downloadFile fetches signed url and downloads blob', async () => {
    const appended = [];
    const removed = [];
    const clicked = [];
    const revoked = [];
    const toastCalls = [];
    const link = {
        href: '',
        download: '',
        click() {
            clicked.push({ href: this.href, download: this.download });
        },
    };

    const downloadFile = await loadDownloadFileModule({
        axiosDefault: {
            post: async (url, body) => {
                assert.strictEqual(url, '/api/workflow/cloudfront-signed-url');
                assert.deepStrictEqual(body, { url: 'https://cdn.example.com/file.mp4' });
                return { data: { signed_url: 'https://signed.example.com/file.mp4' } };
            },
        },
        toast: { error: (message) => toastCalls.push(message) },
        fetchImpl: async (url, options) => {
            assert.strictEqual(url, 'https://signed.example.com/file.mp4');
            assert.deepStrictEqual(options, { mode: 'cors' });
            return {
                blob: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'video/mp4' }),
            };
        },
        windowObj: {
            URL: {
                createObjectURL(blob) {
                    assert.ok(blob instanceof Blob);
                    return 'blob:test-url';
                },
                revokeObjectURL(url) {
                    revoked.push(url);
                },
            },
        },
        documentObj: {
            body: {
                appendChild(node) {
                    appended.push(node);
                },
                removeChild(node) {
                    removed.push(node);
                },
            },
            createElement(tag) {
                assert.strictEqual(tag, 'a');
                return link;
            },
        },
    });

    await downloadFile('https://cdn.example.com/file.mp4', 'result.mp4');

    assert.strictEqual(appended.length, 1);
    assert.strictEqual(removed.length, 1);
    assert.deepStrictEqual(clicked, [{ href: 'blob:test-url', download: 'result.mp4' }]);
    assert.deepStrictEqual(revoked, ['blob:test-url']);
    assert.deepStrictEqual(toastCalls, []);
});
