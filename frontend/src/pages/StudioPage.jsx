import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FlipHorizontal, ImagePlus, Redo2, RotateCw, Save, Undo2, Wand2 } from 'lucide-react';
import SectionTitle from '../components/SectionTitle.jsx';
import StudioCanvas from '../components/StudioCanvas.jsx';
import TshirtPreview from '../components/TshirtPreview.jsx';
import { trendingPrompts } from '../data/prompts.js';
import { api } from '../lib/api.js';
import { useCart } from '../providers/CartProvider.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useToast } from '../providers/ToastProvider.jsx';

const fallbackColors = [
  { label: 'Black', value: '#111111' },
  { label: 'White', value: '#ffffff' },
  { label: 'Electric', value: '#265DFF' },
  { label: 'Crimson', value: '#E74646' }
];

const namedColorHex = {
  Black: '#111111',
  White: '#ffffff',
  'Off White': '#f4f1ea',
  Cobalt: '#265DFF',
  Crimson: '#E74646',
  Charcoal: '#2b2b2b',
  Stone: '#d3cec7',
  Forest: '#1b3b2a',
  Navy: '#0b1f3b',
  Graphite: '#4b4b4b'
};
const LOW_RESOLUTION_THRESHOLD = 1000;
const HISTORY_LIMIT = 40;

function toSwatches(colorNames) {
  const names = colorNames?.length ? colorNames : fallbackColors.map((entry) => entry.label);
  return names.map((name) => {
    const fallback = fallbackColors.find((entry) => entry.label === name);
    return {
      label: name,
      value: namedColorHex[name] || fallback?.value || '#ffffff'
    };
  });
}

async function getResolutionWarning(file) {
  if (!file || !file.type.startsWith('image/')) return '';

  if (file.type === 'image/svg+xml') {
    const source = await file.text();
    const viewBox = source.match(/viewBox\s*=\s*['"]([^'"]+)['"]/i)?.[1];
    const widthRaw = source.match(/width\s*=\s*['"]([^'"]+)['"]/i)?.[1];
    const heightRaw = source.match(/height\s*=\s*['"]([^'"]+)['"]/i)?.[1];

    let width = Number.parseFloat(widthRaw || '');
    let height = Number.parseFloat(heightRaw || '');
    if ((!Number.isFinite(width) || !Number.isFinite(height)) && viewBox) {
      const parts = viewBox.trim().split(/\s+/);
      if (parts.length === 4) {
        width = Number.parseFloat(parts[2]);
        height = Number.parseFloat(parts[3]);
      }
    }

    if (Number.isFinite(width) && Number.isFinite(height)) {
      if (width < LOW_RESOLUTION_THRESHOLD || height < LOW_RESOLUTION_THRESHOLD) {
        return `Low resolution design (${Math.round(width)}x${Math.round(height)}). Print quality may be soft.`;
      }
    }
    return '';
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const size = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Unable to inspect image'));
      image.src = objectUrl;
    });

    if (size.width < LOW_RESOLUTION_THRESHOLD || size.height < LOW_RESOLUTION_THRESHOLD) {
      return `Low resolution design (${size.width}x${size.height}). Print quality may be soft.`;
    }
    return '';
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function StudioPage() {
  const location = useLocation();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(() => location.state?.product || null);
  const [preset, setPreset] = useState(() => location.state?.preset || null);
  const [prompt, setPrompt] = useState(trendingPrompts[0]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState('');
  const [activeSide, setActiveSide] = useState('front');
  const [selectedSize, setSelectedSize] = useState('M');
  const [tshirtColor, setTshirtColor] = useState(fallbackColors[0].value);
  const [tshirtColorName, setTshirtColorName] = useState(fallbackColors[0].label);
  const [transform, setTransform] = useState({
    x: 180,
    y: 205,
    scale: 0.55,
    rotation: 0,
    opacity: 1,
    flipX: false
  });
  const [textConfig, setTextConfig] = useState({
    x: 180,
    y: 245,
    text: '',
    fontFamily: 'Space Grotesk',
    fontSize: 28,
    color: '#080808'
  });
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveState, setSaveState] = useState('');
  const [historyStack, setHistoryStack] = useState([]);
  const [futureStack, setFutureStack] = useState([]);
  const historySyncRef = useRef(false);
  const latestSnapshotKeyRef = useRef('');

  const snapshot = useMemo(
    () => ({
      selectedArtwork,
      transform,
      textConfig
    }),
    [selectedArtwork, textConfig, transform]
  );

  useEffect(() => {
    setProduct(location.state?.product || null);
    setPreset(location.state?.preset || null);
  }, [location.key]);

  const swatches = useMemo(() => toSwatches(product?.colors), [product?.colors]);
  const availableSizes = useMemo(() => product?.sizes || ['S', 'M', 'L', 'XL'], [product?.sizes]);
  const basePrice = product?.basePrice ?? 799;
  const productName = product?.name ?? 'Studio Regular Tee';
  const productId = product?._id ?? 'black-tshirt';
  const productType = product?.category ?? 'Regular Fit';

  useEffect(() => {
    const preferredSize =
      preset?.size && availableSizes.includes(preset.size)
        ? preset.size
        : availableSizes.includes('M')
          ? 'M'
          : availableSizes[0] || 'M';
    setSelectedSize(preferredSize);
  }, [availableSizes, preset?.size]);

  useEffect(() => {
    const preferredSwatch = preset?.color ? swatches.find((swatch) => swatch.label === preset.color) : null;
    const blackSwatch = swatches.find((swatch) => swatch.label.toLowerCase() === 'black');
    const nextSwatch = preferredSwatch || blackSwatch || swatches[0] || fallbackColors[0];
    setTshirtColor(nextSwatch.value);
    setTshirtColorName(nextSwatch.label);
  }, [preset?.color, swatches]);

  const livePrice = useMemo(() => {
    const printAreaPrice = Math.round(transform.scale * 120);
    return basePrice + printAreaPrice;
  }, [basePrice, transform.scale]);

  const resetTransform = () => {
    setTransform({
      x: 180,
      y: 205,
      scale: 0.55,
      rotation: 0,
      opacity: 1,
      flipX: false
    });
  };

  const resetTextPlacement = () => {
    setTextConfig((current) => ({
      ...current,
      x: 180,
      y: 245
    }));
  };

  const handleGenerate = async () => {
    if (!user) {
      const message = 'Sign in to use the AI generator.';
      setSaveState(message);
      toast.info({ title: 'Sign in required', description: 'Log in to generate AI designs.' });
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
      toast.error({ title: 'Generation failed', description: error.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user) {
      const message = 'Sign in to upload artwork.';
      setSaveState(message);
      toast.info({ title: 'Sign in required', description: 'Log in to upload custom artwork.' });
      return;
    }

    setUploading(true);
    setSaveState('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const resolutionWarning = await getResolutionWarning(file);
      if (resolutionWarning) {
        setSaveState(resolutionWarning);
        toast.info({ title: 'Quality warning', description: resolutionWarning });
      }

      const data = await api('/uploads', {
        method: 'POST',
        body: formData
      });
      setSelectedArtwork(data.imageUrl);
      toast.success({ title: 'Upload complete', description: 'Artwork is ready on the canvas.' });
    } catch (error) {
      setSaveState(error.message);
      toast.error({ title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!historyStack.length) {
      const initial = { selectedArtwork, transform, textConfig };
      setHistoryStack([initial]);
      latestSnapshotKeyRef.current = JSON.stringify(initial);
    }
  }, [historyStack.length, selectedArtwork, textConfig, transform]);

  useEffect(() => {
    if (historySyncRef.current || !historyStack.length) return;

    const snapshotKey = JSON.stringify(snapshot);
    if (snapshotKey === latestSnapshotKeyRef.current) return;

    const timer = setTimeout(() => {
      setHistoryStack((current) => {
        const next = [...current, snapshot];
        if (next.length > HISTORY_LIMIT) {
          next.shift();
        }
        return next;
      });
      setFutureStack([]);
      latestSnapshotKeyRef.current = snapshotKey;
    }, 160);

    return () => clearTimeout(timer);
  }, [historyStack.length, snapshot]);

  const applySnapshot = (nextSnapshot) => {
    historySyncRef.current = true;
    setSelectedArtwork(nextSnapshot.selectedArtwork || '');
    setTransform(nextSnapshot.transform || transform);
    setTextConfig(nextSnapshot.textConfig || textConfig);
    latestSnapshotKeyRef.current = JSON.stringify(nextSnapshot);
    setTimeout(() => {
      historySyncRef.current = false;
    }, 0);
  };

  const undo = () => {
    if (historyStack.length < 2) return;
    const currentSnapshot = historyStack[historyStack.length - 1];
    const previousSnapshot = historyStack[historyStack.length - 2];
    setHistoryStack((current) => current.slice(0, -1));
    setFutureStack((current) => [currentSnapshot, ...current].slice(0, HISTORY_LIMIT));
    applySnapshot(previousSnapshot);
  };

  const redo = () => {
    if (!futureStack.length) return;
    const [nextSnapshot, ...remaining] = futureStack;
    setFutureStack(remaining);
    setHistoryStack((current) => [...current, nextSnapshot].slice(-HISTORY_LIMIT));
    applySnapshot(nextSnapshot);
  };

  const handleSaveDesign = async () => {
    if (!user || !selectedArtwork) {
      const message = 'Sign in and choose artwork before saving.';
      setSaveState(message);
      toast.info({ title: 'Missing info', description: 'Sign in and select artwork to save.' });
      return;
    }

    try {
      const data = await api('/designs', {
        method: 'POST',
        body: JSON.stringify({
          name: prompt || 'Custom Design',
          previewUrl: selectedArtwork,
          productType,
          color: tshirtColorName,
          canvasState: {
            front: { selectedArtwork, transform, textConfig },
            back: { selectedArtwork, transform, textConfig }
          }
        })
      });
      setUser((current) => (current ? { ...current, savedDesigns: data.savedDesigns } : current));
      setSaveState('Design saved to your dashboard.');
      toast.success({ title: 'Design saved', description: 'Find it in your dashboard anytime.' });
    } catch (error) {
      setSaveState(error.message);
      toast.error({ title: 'Save failed', description: error.message });
    }
  };

  const handleAddToCart = () => {
    if (!selectedArtwork) {
      const message = 'Select or upload artwork before adding to cart.';
      setSaveState(message);
      toast.info({ title: 'Select artwork', description: 'Upload or generate a design before checkout.' });
      return;
    }

    addItem({
      id: crypto.randomUUID(),
      productId,
      name: productName,
      quantity: 1,
      unitPrice: livePrice,
      previewUrl: selectedArtwork,
      variant: {
        size: selectedSize,
        color: tshirtColorName
      },
      customization: {
        prompt,
        frontCanvas: { selectedArtwork, transform, textConfig },
        backCanvas: { selectedArtwork, transform, textConfig },
        printArea: Math.round(transform.scale * 100)
      }
    });
    setSaveState('Added to cart.');
    toast.success({ title: 'Added to cart', description: `${productName} · Size ${selectedSize} · ${tshirtColorName}` });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="AI Studio"
        title="Prompt it. Place it. Print it."
        description="Generate or upload, then place it."
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
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-bold uppercase tracking-[0.2em] text-paper transition hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <Wand2 size={16} />
            {generating ? 'Generating...' : 'Generate Design'}
          </button>

          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 font-bold uppercase tracking-[0.2em]">
            <ImagePlus size={16} />
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleUpload} />
          </label>

          <div className="mt-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-black/45">Trending Prompts</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {trendingPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrompt(item)}
                  className="rounded-full border border-black/10 bg-paper px-4 py-2 text-left text-sm transition hover:-translate-y-0.5 active:scale-[0.98]"
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
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-black/45">{productType}</p>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-electric">Live Price ₹{livePrice}</p>
            </div>
          </div>

          <div className="grid items-center gap-6 xl:grid-cols-[1fr_280px]">
            <StudioCanvas
              activeSide={activeSide}
              tshirtColor={tshirtColor}
              artwork={selectedArtwork}
              textConfig={textConfig}
              transform={transform}
              onTransformChange={(next) => setTransform(next)}
              onTextConfigChange={(next) => setTextConfig((current) => ({ ...current, ...next }))}
            />
            <div className="flex justify-center">
              <TshirtPreview color={tshirtColor} artwork={selectedArtwork} title={`${activeSide} Preview`} size="small" template="studio" />
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
              className="rounded-full bg-accent-gradient px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-glow transition hover:-translate-y-0.5 active:scale-[0.99]"
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-black/45">Editing Tools</p>
              <p className="mt-2 font-display text-2xl font-bold">{productName}</p>
              <p className="mt-2 text-sm text-black/55">
                Tip: drag to move. Use mouse wheel to zoom selected artwork/text. Hold Shift + wheel to rotate.
              </p>
            </div>
            <Link to="/shop" className="mt-1 rounded-full border border-black/10 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition hover:-translate-y-0.5">
              Change
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={undo}
                disabled={historyStack.length < 2}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-45"
              >
                <span className="inline-flex items-center gap-1">
                  <Undo2 size={14} />
                  Undo
                </span>
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!futureStack.length}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-45"
              >
                <span className="inline-flex items-center gap-1">
                  <Redo2 size={14} />
                  Redo
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedArtwork('')}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]"
              >
                Remove artwork
              </button>
              <button
                type="button"
                onClick={resetTransform}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]"
              >
                Reset artwork
              </button>
              <button
                type="button"
                onClick={resetTextPlacement}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]"
              >
                Center text
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Size</p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${
                      selectedSize === size ? 'bg-ink text-paper' : 'border border-black/10 bg-white/90 hover:-translate-y-0.5'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

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
                max="1.8"
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
                {swatches.map((color) => (
                  <button
                    key={color.label}
                    type="button"
                    onClick={() => {
                      setTshirtColor(color.value);
                      setTshirtColorName(color.label);
                    }}
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
