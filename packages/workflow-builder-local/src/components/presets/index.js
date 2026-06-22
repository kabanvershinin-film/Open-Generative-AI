export const presets = [
  {
    id: "empty-workflow",
    title: "Empty Workflow",
    description: "",
    icon: "plus",
    image: "",
    nodes: [],
    edges: []
  },
  {
    id: "image-generator",
    title: "Image Generator & Editor",
    description: "Simple text to image Generation and Editing with Wan 2.5",
    icon: "image",
    image: "https://cdn.muapi.ai/outputs/e53f9cb2caf947f790154dada58a426c.jpg",
    nodes: [
      {
        id: "text1",
        position: { x: -69, y: 22 },
        data: {
          selectedModel: {
            id: "text-passthrough",
            name: "Input Text"
          },
          formValues: {
            prompt: "Ultra-detailed cinematic portrait of a futuristic AI engineer inside a holographic command center. Floating transparent UI panels, glowing blue and violet data streams, reflective surfaces, soft rim lighting, shallow depth of field, realistic skin texture, high-end sci-fi film aesthetic, 8K resolution, photorealistic, dramatic contrast, clean futuristic design."
          },
          outputs: [
            {
              type: "text",
              value: "Ultra-detailed cinematic portrait of a futuristic AI engineer inside a holographic command center. Floating transparent UI panels, glowing blue and violet data streams, reflective surfaces, soft rim lighting, shallow depth of field, realistic skin texture, high-end sci-fi film aesthetic, 8K resolution, photorealistic, dramatic contrast, clean futuristic design."
            }
          ],
          resultUrl: "Ultra-detailed cinematic portrait of a futuristic AI engineer inside a holographic command center. Floating transparent UI panels, glowing blue and violet data streams, reflective surfaces, soft rim lighting, shallow depth of field, realistic skin texture, high-end sci-fi film aesthetic, 8K resolution, photorealistic, dramatic contrast, clean futuristic design."
        },
        type: "textNode"
      },
      {
        id: "image1",
        position: { x: 370, y: 250 },
        data: {
          selectedModel: {
            id: "wan2.5-text-to-image",
            name: "Wan 2.5 Text to Image",
          },
          formValues: {
            prompt: "Ultra-detailed cinematic portrait of a futuristic AI engineer inside a holographic command center. Floating transparent UI panels, glowing blue and violet data streams, reflective surfaces, soft rim lighting, shallow depth of field, realistic skin texture, high-end sci-fi film aesthetic, 8K resolution, photorealistic, dramatic contrast, clean futuristic design.",
            width: 1024,
            height: 1024,
          },
          outputs: [
            {
              type: "image_url",
              value: "https://cdn.muapi.ai/outputs/8c6c1863ae594cb99e82884f5d3de058.jpg"
            }
          ],
          resultUrl: "https://cdn.muapi.ai/outputs/8c6c1863ae594cb99e82884f5d3de058.jpg"
        },
        type: "imageNode"
      },
      {
        id: "text2",
        position: { x: 390, y: -235 },
        data: {
          selectedModel: {
            id: "text-passthrough",
            name: "Input Text"
          },
          formValues: {
            prompt: "Enhance the lighting to be more cinematic with stronger rim light and subtle volumetric fog. Increase contrast and depth, add more glowing holographic elements around the subject, slightly darken the background for focus, improve facial realism and sharpness, maintain photorealistic style and premium sci-fi mood."
          },
          outputs: [
            {
              type: "text",
              value: "Enhance the lighting to be more cinematic with stronger rim light and subtle volumetric fog. Increase contrast and depth, add more glowing holographic elements around the subject, slightly darken the background for focus, improve facial realism and sharpness, maintain photorealistic style and premium sci-fi mood."
            }
          ],
          resultUrl: "Enhance the lighting to be more cinematic with stronger rim light and subtle volumetric fog. Increase contrast and depth, add more glowing holographic elements around the subject, slightly darken the background for focus, improve facial realism and sharpness, maintain photorealistic style and premium sci-fi mood."
        },
        type: "textNode"
      },
      {
        id: "image2",
        position: { x: 835, y: 25 },
        data: {
          selectedModel: {
            id: "wan2.5-image-edit",
            name: "Wan 2.5 Image Edit",
          },
          formValues: {
            prompt: "Enhance the lighting to be more cinematic with stronger rim light and subtle volumetric fog. Increase contrast and depth, add more glowing holographic elements around the subject, slightly darken the background for focus, improve facial realism and sharpness, maintain photorealistic style and premium sci-fi mood.",
            images_list: [
              "https://cdn.muapi.ai/outputs/8c6c1863ae594cb99e82884f5d3de058.jpg"
            ],
            width: 2048,
            height: 2048,
          },
          outputs: [
            {
              type: "image_url",
              value: "https://cdn.muapi.ai/outputs/e53f9cb2caf947f790154dada58a426c.jpg"
            }
          ],
          resultUrl: "https://cdn.muapi.ai/outputs/e53f9cb2caf947f790154dada58a426c.jpg"
        },
        type: "imageNode"
      }
    ],
    edges: [
      {
        id: "e1-1",
        source: "text1",
        target: "image1",
        sourceHandle: "textOutput",
        targetHandle: "imageInput",
        style: { stroke: "#3b82f6", strokeWidth: 2 }
      },
      {
        id: "e1-2",
        source: "image1",
        target: "image2",
        sourceHandle: "imageOutput",
        targetHandle: "imageInput2",
        style: { stroke: "#22c55e", strokeWidth: 2 }
      },
      {
        id: "e1-3",
        source: "text2",
        target: "image2",
        sourceHandle: "textOutput",
        targetHandle: "imageInput",
        style: { stroke: "#3b82f6", strokeWidth: 2 }
      }
    ]
  },
  {
    id: "video-generator",
    title: "Video Generator",
    description: "Simple Video Generation with Seedance Lite",
    icon: "video",
    image: "https://cdn.muapi.ai/outputs/836c0912239f4f11a2ca333e26387152.jpg",
    nodes: [
      {
        id: "text1",
        position: { x: -9, y: 30 },
        data: {
          selectedModel: {
            id: "text-passthrough",
            name: "Input Text"
          },
          formValues: {
            prompt: "Animate the scene with slow cinematic camera movement, subtle parallax, and smooth forward motion. Holographic elements gently pulse and shift, light rays move naturally through fog, floating structures subtly rotate, ultra-smooth transitions, realistic motion blur, film-grade animation, cinematic pacing, premium tech showcase style."
          },
          outputs: [
            {
              type: "text",
              value: "Animate the scene with slow cinematic camera movement, subtle parallax, and smooth forward motion. Holographic elements gently pulse and shift, light rays move naturally through fog, floating structures subtly rotate, ultra-smooth transitions, realistic motion blur, film-grade animation, cinematic pacing, premium tech showcase style."
            }
          ],
          resultUrl: "Animate the scene with slow cinematic camera movement, subtle parallax, and smooth forward motion. Holographic elements gently pulse and shift, light rays move naturally through fog, floating structures subtly rotate, ultra-smooth transitions, realistic motion blur, film-grade animation, cinematic pacing, premium tech showcase style."
        },
        type: "textNode"
      },
      {
        id: "image1",
        position: { x: -14, y: -426 },
        data: {
          selectedModel: {
            id: "bytedance-seedream-v4.5",
            name: "Seedream v4.5",
          },
          formValues: {
            prompt: "Wide cinematic shot of a glowing futuristic city built from floating geometric shapes and holographic panels. Neon blue and purple lights, soft volumetric fog, reflective surfaces, dramatic sky, ultra-realistic lighting, depth of field, 8K detail, sci-fi cinematic style, symmetrical composition.",
            aspect_ratio: "1:1",
            quality: "high",
          },
          outputs: [
            {
              type: "image_url",
              value: "https://cdn.muapi.ai/outputs/836c0912239f4f11a2ca333e26387152.jpg"
            }
          ],
          resultUrl: "https://cdn.muapi.ai/outputs/836c0912239f4f11a2ca333e26387152.jpg"
        },
        type: "imageNode"
      },
      {
        id: "video1",
        position: { x: 624, y: -154 },
        data: {
          selectedModel: {
            id: "seedance-lite-i2v",
            name: "Seedance Lite I2V",
          },
          formValues: {
            prompt: "Animate the scene with slow cinematic camera movement, subtle parallax, and smooth forward motion. Holographic elements gently pulse and shift, light rays move naturally through fog, floating structures subtly rotate, ultra-smooth transitions, realistic motion blur, film-grade animation, cinematic pacing, premium tech showcase style.",
            image_url: "https://cdn.muapi.ai/outputs/836c0912239f4f11a2ca333e26387152.jpg",
            resolution: "720p",
            duration: 5,
            camera_fixed: false,
          },
          outputs: [
            {
              type: "video_url",
              value: "https://cdn.muapi.ai/outputs/6e1f813951b24868ad117ddca0aaa8ea.mp4"
            }
          ],
          resultUrl: "https://cdn.muapi.ai/outputs/6e1f813951b24868ad117ddca0aaa8ea.mp4"
        },
        type: "videoNode"
      }
    ],
    edges: [
      {
        id: "e1-1",
        source: "text1",
        target: "video1",
        sourceHandle: "textOutput",
        targetHandle: "videoInput",
        style: { stroke: "#3b82f6", strokeWidth: 2 }
      },
      {
        id: "e1-2",
        source: "image1",
        target: "video1",
        sourceHandle: "imageOutput",
        targetHandle: "videoInput2",
        style: { stroke: "#22c55e", strokeWidth: 2 }
      }
    ]
  },
  {
    id: "audio-generator",
    title: "Audio Generator",
    description: "Generate audio from text with Suno",
    icon: "audio",
    image: "https://images.unsplash.com/photo-1526512340740-9217d0159da9?q=80&w=500&auto=format&fit=crop",
    nodes: [
      {
        id: "text1",
        position: { x: -9, y: 30 },
        data: {
          selectedModel: {
            id: "text-passthrough",
            name: "Input Text"
          },
          formValues: {
            prompt: "Generate a cinematic ambient soundscape with deep atmospheric pads, soft evolving synth textures, subtle low-frequency pulses, and gentle high-end shimmer. The mood should feel futuristic, calm, and inspirational, suitable for a high-end AI product or cinematic workflow reveal. Clean mix, professional sound design, smooth transitions, no abrupt sounds."
          },
          outputs: [
            {
              type: "text",
              value: "Generate a cinematic ambient soundscape with deep atmospheric pads, soft evolving synth textures, subtle low-frequency pulses, and gentle high-end shimmer. The mood should feel futuristic, calm, and inspirational, suitable for a high-end AI product or cinematic workflow reveal. Clean mix, professional sound design, smooth transitions, no abrupt sounds."
            }
          ],
          resultUrl: "Generate a cinematic ambient soundscape with deep atmospheric pads, soft evolving synth textures, subtle low-frequency pulses, and gentle high-end shimmer. The mood should feel futuristic, calm, and inspirational, suitable for a high-end AI product or cinematic workflow reveal. Clean mix, professional sound design, smooth transitions, no abrupt sounds."
        },
        type: "textNode"
      },
      {
        id: "audio1",
        position: { x: 400, y: 100 },
        data: {
          selectedModel: {
            id: "suno-create-music",
            name: "Suno Create Music"
          },
          formValues: {
            prompt: "Generate a cinematic ambient soundscape with deep atmospheric pads, soft evolving synth textures, subtle low-frequency pulses, and gentle high-end shimmer. The mood should feel futuristic, calm, and inspirational, suitable for a high-end AI product or cinematic workflow reveal. Clean mix, professional sound design, smooth transitions, no abrupt sounds.",
            style: "Classical",
            style_weight: 0,
            vocal_gender: "male",
            weirdness_constraint: 0,
            audio_weight: 0,
            instrumental: true,
            model: "V5",
            negative_tags: null,
          },
          outputs: [
            {
              type: "audio_url",
              value: "https://cdn.muapi.ai/outputs/6a42f05895284e8687420843c749e11c.mp3"
            }
          ],
          resultUrl: "https://cdn.muapi.ai/outputs/6a42f05895284e8687420843c749e11c.mp3"
        },
        type: "audioNode"
      }
    ],
    edges: [
      {
        id: "e1-1",
        source: "text1",
        target: "audio1",
        sourceHandle: "textOutput",
        targetHandle: "audioInput2",
        style: { stroke: "#3b82f6", strokeWidth: 2 }
      }
    ]
  },
  {
    id: "captioning",
    title: "LLM Image Captioning",
    description: "Generate a prompt from an image with GPT-5",
    icon: "text",
    image: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg",
    nodes: [
      {
        id: "image1",
        position: { x: 0, y: 100 },
        data: {
          selectedModel: {
            id: "image-passthrough",
            name: "Input Image"
          },
          formValues: {
            image_url: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg"
          },
          outputs: [
            {
              type: "image_url",
              value: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg"
            }
          ],
          resultUrl: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg",
        },
        type: "imageNode"
      },
      {
        id: "text1",
        position: { x: 432, y: -110 },
        data: {
          selectedModel: {
            id: "gpt-5-nano",
            name: "GPT5 Nano"
          },
          formValues: {
            prompt: "Provide a detailed prompt of this image, capturing as many elements as possible. Include specifics about the colors, textures, any people or objects present, and the setting. Describe the atmosphere, any notable features or interactions, and the overall mood of the scene.",
            image_url: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg"
          },
          outputs: [
            {
              type: "text",
              value: "A cinematic sci‑fi cityscape at golden hour. A lone explorer stands on the edge of a jagged cliff, gazing out over a vast megacity that rises above a sea of low-lying clouds. The foreground cliff is dark, rough rock with cracks and tufts of green grass and small wildflowers along the edge. The explorer wears a rugged, modern space/terrain suit with a backpack and gear; their silhouette is a quiet, contemplative figure framed against the glowing city. The city below and around is a dense forest of skyscrapers of varying shapes and heights, all made of glass and metal. Neon accents run along many surfaces: turquoise and teal vertical lines glow along several towers, red and magenta edge lights highlight upper contours, and cyan geometric strips trace architectural grooves. The central cluster features a pair of towering, illuminated monoliths with bright cyan highlights and antennae that reach into the sky. Other buildings have curved, multi-tiered silhouettes and reflective façades that catch the sunset and neon alike. A veil of mist and fog hangs around the lower levels, softening edges and lending a dreamlike scale to the city.\n\nIn the sky, several sleek flying vehicles streak by, leaving luminous trails—white and pale yellow from some, magenta and purple from others—adding dynamic motion and depth. The trails glow against a sky that shifts from warm sunset golds and oranges near the horizon to cool deep blues higher up, with scattered, sunlit clouds that glow with a honeyed, amber tint. The sun is low on the left, casting long, warm rays across the cliff and creating a gentle rim light on the explorer, while the city glows with cooler neon against the fading daylight. The overall atmosphere is awe-inspiring, adventurous, and slightly otherworldly—a moment of solitary exploration at the edge of a technologically advanced but fragile-looking metropolis. \n\nSuggested prompt (condensed for reuse):\nHyperreal cinematic sci‑fi city at golden hour. A lone explorer in a rugged space/terrain suit stands on the edge of a jagged cliff, overlooking a megacity rising from a sea of clouds. Tall glass towers with teal/cyan neon lines and red/magenta edge lights dominate the skyline; central twin towers glow with cyan accents. A warm sunset gradient—gold, orange, pink—meets cool neon reflections on glass. Flying vehicles streak across the sky, leaving white, yellow, and magenta light trails. Foreground cliff is rough rock with sparse grasses; mist swirls around the lower city, hiding the bases. The mood is awe-inspiring, adventurous, and otherworldly, with a sense of solitary discovery. Ultra-detailed, 8k, cinematic concept art, 16:9, high dynamic range, volumetric fog, soft lens flare from the sun."
            }
          ],
          resultUrl: "A cinematic sci‑fi cityscape at golden hour. A lone explorer stands on the edge of a jagged cliff, gazing out over a vast megacity that rises above a sea of low-lying clouds. The foreground cliff is dark, rough rock with cracks and tufts of green grass and small wildflowers along the edge. The explorer wears a rugged, modern space/terrain suit with a backpack and gear; their silhouette is a quiet, contemplative figure framed against the glowing city. The city below and around is a dense forest of skyscrapers of varying shapes and heights, all made of glass and metal. Neon accents run along many surfaces: turquoise and teal vertical lines glow along several towers, red and magenta edge lights highlight upper contours, and cyan geometric strips trace architectural grooves. The central cluster features a pair of towering, illuminated monoliths with bright cyan highlights and antennae that reach into the sky. Other buildings have curved, multi-tiered silhouettes and reflective façades that catch the sunset and neon alike. A veil of mist and fog hangs around the lower levels, softening edges and lending a dreamlike scale to the city.\n\nIn the sky, several sleek flying vehicles streak by, leaving luminous trails—white and pale yellow from some, magenta and purple from others—adding dynamic motion and depth. The trails glow against a sky that shifts from warm sunset golds and oranges near the horizon to cool deep blues higher up, with scattered, sunlit clouds that glow with a honeyed, amber tint. The sun is low on the left, casting long, warm rays across the cliff and creating a gentle rim light on the explorer, while the city glows with cooler neon against the fading daylight. The overall atmosphere is awe-inspiring, adventurous, and slightly otherworldly—a moment of solitary exploration at the edge of a technologically advanced but fragile-looking metropolis. \n\nSuggested prompt (condensed for reuse):\nHyperreal cinematic sci‑fi city at golden hour. A lone explorer in a rugged space/terrain suit stands on the edge of a jagged cliff, overlooking a megacity rising from a sea of clouds. Tall glass towers with teal/cyan neon lines and red/magenta edge lights dominate the skyline; central twin towers glow with cyan accents. A warm sunset gradient—gold, orange, pink—meets cool neon reflections on glass. Flying vehicles streak across the sky, leaving white, yellow, and magenta light trails. Foreground cliff is rough rock with sparse grasses; mist swirls around the lower city, hiding the bases. The mood is awe-inspiring, adventurous, and otherworldly, with a sense of solitary discovery. Ultra-detailed, 8k, cinematic concept art, 16:9, high dynamic range, volumetric fog, soft lens flare from the sun.",
        },
        type: "textNode"
      },
      {
        id: "text2",
        position: { x: -2, y: -335 },
        data: {
          selectedModel: {
            id: "text-passthrough",
            name: "Input Text"
          },
          formValues: {
            prompt: "Provide a detailed prompt of this image, capturing as many elements as possible. Include specifics about the colors, textures, any people or objects present, and the setting. Describe the atmosphere, any notable features or interactions, and the overall mood of the scene."
          },
          outputs: [
            {
              type: "text",
              value: "Provide a detailed prompt of this image, capturing as many elements as possible. Include specifics about the colors, textures, any people or objects present, and the setting. Describe the atmosphere, any notable features or interactions, and the overall mood of the scene."
            }
          ],
          resultUrl: "Provide a detailed prompt of this image, capturing as many elements as possible. Include specifics about the colors, textures, any people or objects present, and the setting. Describe the atmosphere, any notable features or interactions, and the overall mood of the scene.",
        },
        type: "textNode"
      }
    ],
    edges: [
      {
        id: "e4-1",
        source: "image1",
        target: "text1",
        sourceHandle: "imageOutput",
        targetHandle: "textInput2",
        style: { stroke: "#22c55e", strokeWidth: 2 }
      },
      {
        id: "e4-2",
        source: "text2",
        target: "text1",
        sourceHandle: "textOutput",
        targetHandle: "textInput",
        style: { stroke: "#3b82f6", strokeWidth: 2 }
      }
    ]
  }
];

