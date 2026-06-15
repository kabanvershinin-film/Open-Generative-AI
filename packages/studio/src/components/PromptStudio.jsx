'use client';

import React, { useState } from 'react';

const CATEGORIES = [
  'Все',
  'Google Omni',
  'Seedance 2.0',
  'Flux 1.1',
  'Midjourney',
  'DALL-E 3',
  'Stable Diffusion',
  'Kling AI'
];

export default function PromptStudio({ apiKey }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');

  return (
    <div className="h-full w-full bg-[#0a0714] overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            База Промтов — Сапог AI
          </h1>
          <p className="text-white/40 text-lg max-w-2xl">
            Исследуйте лучшие промты для генерации изображений и видео. Копируйте, адаптируйте и создавайте свои шедевры.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Поиск по моделям и промтам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 bg-white/5 border border-purple-500/10 rounded-xl px-12 text-sm text-white focus:outline-none focus:border-purple-500/30 transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80 border border-purple-500/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State / Grid Placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[
            { model: 'Google Omni', prompt: 'Cinematic portrait of a futuristic cyberpunk warrior in a rain-soaked Neo-Tokyo street, neon lights reflecting in armor, 8k resolution, highly detailed' },
            { model: 'Seedance 2.0', prompt: 'A magical forest with glowing plants and floating islands, ethereal atmosphere, cinematic lighting, hyper-realistic' },
            { model: 'Flux 1.1', prompt: 'Architectural visualization of a modern minimalist villa by the ocean, sunset lighting, glass reflections, high-end design' },
            { model: 'Midjourney', prompt: 'Cute 3D character design of a small robot explorer, Pixar style, soft shadows, vibrant colors' },
            { model: 'DALL-E 3', prompt: 'A cozy coffee shop interior with plants and vintage furniture, warm sunlight streaming through windows, isometric view' },
            { model: 'Stable Diffusion', prompt: 'Epic landscape of a dragon flying over snow-capped mountains, dramatic clouds, fantasy art style' },
            { model: 'Kling AI', prompt: 'A futuristic electric car driving through a desert at night, long exposure light trails, sci-fi aesthetic' },
            { model: 'Google Omni', prompt: 'Close up of a human eye with a galaxy inside, cosmic reflection, surrealism, macro photography' },
          ].map((item, i) => (
            <div key={i} className="group bg-white/5 border border-purple-500/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300">
              <div className="aspect-[4/3] bg-purple-500/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0714] to-transparent opacity-60" />
                <span className="text-white/10 font-bold text-4xl">Prompt {i + 1}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase rounded border border-purple-500/20">
                    {activeCategory === 'Все' ? item.model : activeCategory}
                  </span>
                </div>
                <p className="text-sm text-white/60 line-clamp-3 mb-4 italic">
                  "{item.prompt}"
                </p>
                <div className="flex items-center justify-between">
                  <button className="text-xs font-bold text-[#d946ef] hover:underline flex items-center gap-1">
                    Копировать
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-1 text-white/20">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78v0z" />
                    </svg>
                    <span className="text-[10px]">1.2k</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
