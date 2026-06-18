import test from 'node:test';
import assert from 'node:assert/strict';
import * as route from '../logic.js';

test('buildContent forms correct content with single image (pure I2V)', () => {
    const params = {
        prompt: 'a cat',
        image_url: 'http://example.com/img.jpg'
    };
    const content = route.buildContent(params);
    
    assert.strictEqual(content.length, 2);
    assert.strictEqual(content[0].type, 'image_url');
    assert.strictEqual(content[0].image_url.url, 'http://example.com/img.jpg');
    assert.strictEqual(content[0].role, 'first_frame'); // New: role is first_frame for pure I2V
    assert.strictEqual(content[1].type, 'text');
    assert.strictEqual(content[1].text, 'a cat');
});

test('buildContent handles last_image_url', () => {
    const params = {
        prompt: 'a cat',
        image_url: 'http://example.com/start.jpg',
        last_image_url: 'http://example.com/end.jpg'
    };
    const content = route.buildContent(params);
    
    // start image + end image + text
    assert.strictEqual(content.length, 3);
    assert.strictEqual(content[0].role, 'reference_image'); // Multimodal now because of last_frame
    assert.strictEqual(content[1].role, 'last_frame');
    assert.strictEqual(content[1].image_url.url, 'http://example.com/end.jpg');
});

test('buildContent handles multiple images and face_asset', () => {
    const params = {
        prompt: 'a cat',
        image_url: 'http://example.com/base.jpg',
        image_urls: ['http://example.com/ref.jpg'],
        face_asset: 'asset://character1'
    };
    const content = route.buildContent(params);
    
    // 2 images + 1 text
    assert.strictEqual(content.length, 3);
    
    // First image should have face_asset and role: reference_image
    assert.strictEqual(content[0].type, 'image_url');
    assert.strictEqual(content[0].face_asset, 'asset://character1');
    assert.strictEqual(content[0].role, 'reference_image');
    
    // Second image should also have role: reference_image
    assert.strictEqual(content[1].type, 'image_url');
    assert.strictEqual(content[1].role, 'reference_image');
});

test('buildContent handles video and audio references', () => {
    const params = {
        prompt: 'a cat',
        video_url: 'http://example.com/vid.mp4',
        audio_url: 'http://example.com/aud.mp3'
    };
    const content = route.buildContent(params);
    
    assert.strictEqual(content.length, 3);
    assert.strictEqual(content[0].type, 'video_url');
    assert.strictEqual(content[0].role, 'reference_video');
    assert.strictEqual(content[1].type, 'audio_url');
    assert.strictEqual(content[1].role, 'reference_audio');
});
