import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FlipHorizontal, ImagePlus, RotateCw, Save, Wand2 } from 'lucide-react';
import SectionTitle from '../components/SectionTitle.jsx';
import StudioCanvas from '../components/StudioCanvas.jsx';
import TshirtPreview from '../components/TshirtPreview.jsx';
import { trendingPrompts } from '../data/prompts.js';
import { api, API_URL } from '../lib/api.js';
import { useCart } from '../providers/CartProvider.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';

const colors = [
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#111111' },
  { label: 'Electric', value: '#265DFF' },
  { label: 'Crimson', value: '#E74646' }
];

export default function StudioPage() {
  const { user, setUser } = useAuth();
  const { addItem } = useCart();
  const [prompt, setPrompt] = useState(trendingPrompts[0]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState('');
  const [activeSide, setActiveSide] = useState('front');
  const [tshirtColor, setTshirtColor] = useState(colors[0].value);
  const [transform, setTransform] = useState({
    scale: 0.55,
    rotation: 0,
    opacity: 1,
    flipX: false
  });
  const [textConfig, setTextConfig] = useState({
    text: '',
    fontFamily: 'Space Grotesk',
    fontSize: 28,
    color: '#080808'
  });
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveState, setSaveState] = useState('');

  const livePrice = useMemo(() => {
    const printAreaPrice = Math.round(transform.scale * 12);
    return 29 + printAreaPrice;
  }, [transform.scale]);

  const handleGenerate = async () => {
    if (!user) {
      setSaveState('Sign in to use the AI generator.');
      return;
    }

    setGenerating(true);
    setSaveState('');

    try {
      const data = await api('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt })
      });
      setGeneratedImages(data.images);
      setSelectedArtwork(data.images[0] || '');
    } catch (error) {
      setSaveState(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user) {
      setSaveState('Sign in to upload artwork.');
      return;
    }

    setUploading(true);
    setSaveState('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      setSelectedArtwork(data.imageUrl);
    } catch (error) {
      setSaveState(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDesign = async () => {
    if (!user || !selectedArtwork) {
      setSaveState('Sign in and choose artwork before saving.');
      return;
    }

    try {
      const data = await api('/designs', {
        method: 'POST',
        body: JSON.stringify({
          name: prompt || 'Custom Design',
          previewUrl: selectedArtwork,
          productType: 'Regular Fit',
          color: tshirtColor,
          canvasState: {
            front: { selectedArtwork, transform, textConfig },
            back: { selectedArtwork, transform, textConfig }
          }
        })
      });
      setUser((current) => (current ? { ...current, savedDesigns: data.savedDesigns } : current));
      setSaveState('Design saved to your dashboard.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  const handleAddToCart = () => {
    if (!selectedArtwork) {
      setSaveState('Select or upload artwork before adding to cart.');
      return;
    }

    addItem({
      id: crypto.randomUUID(),
      productId: 'fallback-2',
      name: 'Studio Regular Tee',
      quantity: 1,
      unitPrice: livePrice,
      previewUrl: selectedArtwork,
      variant: {
        size: 'M',
        color: colors.find((entry) => entry.value === tshirtColor)?.label || 'White'
      },
      customization: {
        prompt,
        frontCanvas: { selectedArtwork, transform, textConfig },
        backCanvas: { selectedArtwork, transform, textConfig },
        printArea: Math.round(transform.scale * 100)
      }
    });
    setSaveState('Added to cart.');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="AI Studio"
        title="Prompt it. Place it. Print it."
        description="Generate artwork, upload your own files, and fine-tune placement on a live apparel mockup with minimal friction."
      />

      <div className="mt-10 grid gap-6 xl:grid-cols-[320px_1fr_320px]">
        <section className="rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-black/45">Prompt Lab</p>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="mt-4 h-36 w-full rounded-[1.5rem] border border-black/10 bg-paper px-4 py-4 outline-none"
            placeholder="Describe the print you want to generate"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-bold uppercase tracking-[0.2em] text-paper"
          >
            <Wand2 size={16} />
            {generating ? 'Generating...' : 'Generate Design'}
          </button>

          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 font-bold uppercase tracking-[0.2em]">
            <ImagePlus size={16} />
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} />
          </label>

          <div className="mt-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-black/45">Trending Prompts</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {trendingPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrompt(item)}
                  className="rounded-full border border-black/10 bg-paper px-4 py-2 text-left text-sm"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {generatedImages.map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedArtwork(image)}
                className={`block overflow-hidden rounded-[1.25rem] border ${
                  selectedArtwork === image ? 'border-electric' : 'border-black/8'
                }`}
              >
                <img src={image} alt="Generated variation" className="h-28 w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-[2rem] border border-black/8 bg-white/70 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 rounded-full border border-black/10 bg-paper p-1">
              {['front', 'back'].map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setActiveSide(side)}
                  className={`rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] ${
                    activeSide === side ? 'bg-ink text-paper' : 'text-black/55'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-electric">Live Price {livePrice} USD</p>
          </div>

          <div className="grid items-center gap-6 xl:grid-cols-[1fr_280px]">
            <StudioCanvas
              activeSide={activeSide}
              tshirtColor={tshirtColor}
              artwork={selectedArtwork}
              textConfig={textConfig}
              transform={transform}
            />
            <div className="flex justify-center">
              <TshirtPreview color={tshirtColor} artwork={selectedArtwork} title={`${activeSide} Preview`} size="small" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveDesign}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.2em]"
            >
              <Save size={16} />
              Save Design
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="rounded-full bg-electric px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white"
            >
              Add to Cart
            </button>
            <Link to="/cart" className="rounded-full border border-black/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em]">
              Go to Cart
            </Link>
          </div>
          {saveState ? <p className="text-sm text-black/60">{saveState}</p> : null}
        </section>

        <section className="rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-black/45">Editing Tools</p>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold"><RotateCw size={16} /> Rotate</span>
              <input
                type="range"
                min="-180"
                max="180"
                value={transform.rotation}
                onChange={(event) => setTransform((current) => ({ ...current, rotation: Number(event.target.value) }))}
                className="w-full"
              />
            </label>

            <label className="block">
              <span className="mb-2 text-sm font-semibold">Scale</span>
              <input
                type="range"
                min="0.2"
                max="1.2"
                step="0.05"
                value={transform.scale}
                onChange={(event) => setTransform((current) => ({ ...current, scale: Number(event.target.value) }))}
                className="w-full"
              />
            </label>

            <label className="block">
              <span className="mb-2 text-sm font-semibold">Opacity</span>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={transform.opacity}
                onChange={(event) => setTransform((current) => ({ ...current, opacity: Number(event.target.value) }))}
                className="w-full"
              />
            </label>

            <button
              type="button"
              onClick={() => setTransform((current) => ({ ...current, flipX: !current.flipX }))}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-paper px-5 py-3 text-sm font-bold uppercase tracking-[0.2em]"
            >
              <FlipHorizontal size={16} />
              Flip Horizontal
            </button>

            <div>
              <p className="mb-3 text-sm font-semibold">T-shirt Color</p>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color.label}
                    type="button"
                    onClick={() => setTshirtColor(color.value)}
                    className={`h-10 w-10 rounded-full border-2 ${
                      tshirtColor === color.value ? 'border-electric' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: color.value }}
                    aria-label={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Text Overlay</p>
              <input
                type="text"
                value={textConfig.text}
                onChange={(event) => setTextConfig((current) => ({ ...current, text: event.target.value }))}
                className="w-full rounded-2xl border border-black/10 bg-paper px-4 py-3 outline-none"
                placeholder="Add a slogan"
              />
              <select
                value={textConfig.fontFamily}
                onChange={(event) => setTextConfig((current) => ({ ...current, fontFamily: event.target.value }))}
                className="w-full rounded-2xl border border-black/10 bg-paper px-4 py-3 outline-none"
              >
                <option>Space Grotesk</option>
                <option>Manrope</option>
                <option>serif</option>
              </select>
              <input
                type="color"
                value={textConfig.color}
                onChange={(event) => setTextConfig((current) => ({ ...current, color: event.target.value }))}
                className="h-12 w-full rounded-2xl border border-black/10 bg-paper px-2 py-2"
              />
              <input
                type="range"
                min="14"
                max="72"
                value={textConfig.fontSize}
                onChange={(event) => setTextConfig((current) => ({ ...current, fontSize: Number(event.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
