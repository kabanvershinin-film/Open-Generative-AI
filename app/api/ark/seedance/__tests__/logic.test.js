import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContent } from '../logic.js';

test('buildContent creates content for T2V prompt only', () => {
  const content = buildContent({
    prompt: 'cinematic driving scene',
  });

  assert.strictEqual(content.length, 1);
  assert.strictEqual(content[0].type, 'text');
  assert.strictEqual(content[0].text, 'cinematic driving scene');
});

test('buildContent creates content for text prompt with quotes (dialogs)', () => {
  const content = buildContent({
    prompt: '图片1 says "Привет! Как дела?". Then they smile.',
    image_url: 'https://cdn.example.com/character.jpg',
  });

  assert.strictEqual(content.length, 2);
  assert.strictEqual(content[1].type, 'text');
  assert.strictEqual(content[1].text, '图片1 says "Привет! Как дела?". Then they smile.');
});

test('buildContent creates content for I2V with one image', () => {
  const content = buildContent({
    prompt: 'animate this image',
    image_url: 'https://cdn.example.com/base.jpg',
  });

  assert.strictEqual(content.length, 2);
  assert.strictEqual(content[0].type, 'image_url');
  assert.strictEqual(content[0].image_url.url, 'https://cdn.example.com/base.jpg');
  assert.strictEqual(content[1].type, 'text');
  assert.strictEqual(content[1].text, 'animate this image');
});

test('buildContent maps top-level face asset to asset uri reference', () => {
  const content = buildContent({
    prompt: '图片1 is driving a car',
    image_url: { url: 'https://cdn.example.com/thumb.jpg', face_asset: 'asset://character1' },
    face_asset: 'asset://character1',
  });

  const imageItems = content.filter((item) => item.type === 'image_url');
  assert.strictEqual(imageItems.length, 1);
  assert.strictEqual(imageItems[0].image_url.url, 'asset://character1');
  assert.strictEqual(content[content.length - 1].type, 'text');
  assert.strictEqual(content[content.length - 1].text, '图片1 is driving a car');
});

test('buildContent keeps multiple asset uris as separate reference images', () => {
  const content = buildContent({
    prompt: '图片1和图片2一起说话',
    image_urls: [
      { url: 'asset://character1' },
      { url: 'asset://character2' },
    ],
  });

  const imageItems = content.filter((item) => item.type === 'image_url');
  assert.strictEqual(imageItems.length, 2);
  assert.deepStrictEqual(imageItems.map((item) => item.image_url.url), [
    'asset://character1',
    'asset://character2',
  ]);
});

test('buildContent handles up to 9 reference images', () => {
  const imageUrls = Array.from({ length: 9 }, (_, i) => `https://cdn.example.com/img${i + 1}.jpg`);
  const content = buildContent({
    prompt: 'use all these images as references',
    image_url: imageUrls[0],
    image_urls: imageUrls.slice(1),
  });

  assert.strictEqual(content.length, 10); // 9 images + prompt
  const imageItems = content.filter(c => c.type === 'image_url');
  assert.strictEqual(imageItems.length, 9);
  assert.strictEqual(imageItems[0].image_url.url, 'https://cdn.example.com/img1.jpg');
  assert.strictEqual(imageItems[8].image_url.url, 'https://cdn.example.com/img9.jpg');
  assert.strictEqual(content[9].type, 'text');
});

test('buildContent handles up to 3 reference videos', () => {
  const videoUrls = Array.from({ length: 3 }, (_, i) => `https://cdn.example.com/video${i + 1}.mp4`);
  const content = buildContent({
    prompt: 'use these video references',
    video_url: videoUrls[0],
    video_urls: videoUrls.slice(1),
  });

  assert.strictEqual(content.length, 4); // 3 videos + prompt
  const videoItems = content.filter(c => c.type === 'video_url');
  assert.strictEqual(videoItems.length, 3);
  assert.strictEqual(videoItems[0].video_url.url, 'https://cdn.example.com/video1.mp4');
  assert.strictEqual(videoItems[2].video_url.url, 'https://cdn.example.com/video3.mp4');
});

test('buildContent handles up to 3 reference audios', () => {
  const audioUrls = Array.from({ length: 3 }, (_, i) => `https://cdn.example.com/audio${i + 1}.mp3`);
  const content = buildContent({
    prompt: 'use these audio references',
    audio_url: audioUrls[0],
    audio_urls: audioUrls.slice(1),
  });

  assert.strictEqual(content.length, 4); // 3 audios + prompt
  const audioItems = content.filter(c => c.type === 'audio_url');
  assert.strictEqual(audioItems.length, 3);
  assert.strictEqual(audioItems[0].audio_url.url, 'https://cdn.example.com/audio1.mp3');
  assert.strictEqual(audioItems[2].audio_url.url, 'https://cdn.example.com/audio3.mp3');
});

test('buildContent handles total up to 12 files (images + videos + audios)', () => {
  const imageUrls = Array.from({ length: 8 }, (_, i) => `https://cdn.example.com/img${i + 1}.jpg`);
  const videoUrls = Array.from({ length: 2 }, (_, i) => `https://cdn.example.com/video${i + 1}.mp4`);
  const audioUrls = Array.from({ length: 2 }, (_, i) => `https://cdn.example.com/audio${i + 1}.mp3`);
  const content = buildContent({
    prompt: 'mix all references',
    image_url: imageUrls[0],
    image_urls: imageUrls.slice(1),
    video_url: videoUrls[0],
    video_urls: videoUrls.slice(1),
    audio_url: audioUrls[0],
    audio_urls: audioUrls.slice(1),
  });

  const imageItems = content.filter(c => c.type === 'image_url');
  const videoItems = content.filter(c => c.type === 'video_url');
  const audioItems = content.filter(c => c.type === 'audio_url');

  assert.strictEqual(imageItems.length, 8);
  assert.strictEqual(videoItems.length, 2);
  assert.strictEqual(audioItems.length, 2);
  assert.strictEqual(content.length, 13); // 12 refs + prompt
});

test('buildContent handles @ syntax in prompt (referencing media indices)', () => {
  const content = buildContent({
    prompt: '@image1 is the character, @video1 controls camera, @audio1 is background music',
    image_url: 'https://cdn.example.com/char.jpg',
    video_url: 'https://cdn.example.com/cam.mp4',
    audio_url: 'https://cdn.example.com/music.mp3',
  });

  assert.strictEqual(content.length, 4);
  assert.strictEqual(content[3].text, '@image1 is the character, @video1 controls camera, @audio1 is background music');
  assert.strictEqual(content[0].image_url.url, 'https://cdn.example.com/char.jpg');
  assert.strictEqual(content[1].video_url.url, 'https://cdn.example.com/cam.mp4');
  assert.strictEqual(content[2].audio_url.url, 'https://cdn.example.com/music.mp3');
});

test('buildContent handles multiple reference images', () => {
  const content = buildContent({
    prompt: 'create video with these references',
    image_url: 'https://cdn.example.com/img1.jpg',
    image_urls: ['https://cdn.example.com/img2.jpg', 'https://cdn.example.com/img3.jpg'],
  });

  assert.strictEqual(content.length, 4);
  assert.strictEqual(content[0].type, 'image_url');
  assert.strictEqual(content[1].type, 'image_url');
  assert.strictEqual(content[2].type, 'image_url');
  assert.strictEqual(content[3].type, 'text');
});

test('buildContent handles video reference', () => {
  const content = buildContent({
    prompt: 'edit this video',
    video_url: 'https://cdn.example.com/video.mp4',
  });

  assert.strictEqual(content.length, 2);
  assert.strictEqual(content[0].type, 'video_url');
  assert.strictEqual(content[1].type, 'text');
});

test('buildContent handles audio reference', () => {
  const content = buildContent({
    prompt: 'add this audio to video',
    audio_url: 'https://cdn.example.com/audio.mp3',
  });

  assert.strictEqual(content.length, 2);
  assert.strictEqual(content[0].type, 'audio_url');
  assert.strictEqual(content[1].type, 'text');
});

test('buildContent handles last image (end frame)', () => {
  const content = buildContent({
    prompt: 'interpolate from start to end',
    image_url: 'https://cdn.example.com/start.jpg',
    last_image_url: 'https://cdn.example.com/end.jpg',
  });

  assert.strictEqual(content.length, 3);
  assert.strictEqual(content[0].image_url.url, 'https://cdn.example.com/start.jpg');
  assert.strictEqual(content[1].image_url.url, 'https://cdn.example.com/end.jpg');
  assert.strictEqual(content[2].type, 'text');
});

test('buildContent handles all generation modes (Text-to-Video, Image-to-Video, Multimodal)', () => {
  // Test Text-to-Video (T2V)
  const t2vContent = buildContent({ prompt: 'just text' });
  assert.strictEqual(t2vContent.length, 1);

  // Test Image-to-Video (I2V)
  const i2vContent = buildContent({ prompt: 'animate this', image_url: 'https://cdn.example.com/img.jpg' });
  assert.strictEqual(i2vContent.length, 2);

  // Test Multimodal Reference (image + video + audio)
  const multimodalContent = buildContent({
    prompt: 'mix of everything',
    image_url: 'https://cdn.example.com/img.jpg',
    video_url: 'https://cdn.example.com/vid.mp4',
    audio_url: 'https://cdn.example.com/aud.mp3'
  });
  assert.strictEqual(multimodalContent.length, 4);
});
