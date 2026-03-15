import { useEffect, useMemo, useRef } from 'react';
import { Canvas, FabricImage, IText, Path } from 'fabric';

const BASE_CANVAS_WIDTH = 360;
const BASE_CANVAS_HEIGHT = 480;
const MIN_CANVAS_WIDTH = 240;
const EDIT_SCALE_MIN = 0.2;
const EDIT_SCALE_MAX = 1.8;
const EDIT_ROTATION_STEP = 0.2;
const SHIRT_OUTLINE =
  'M95 70 L122 56 L150 72 L210 72 L238 56 L265 70 L302 120 L276 140 L260 108 L244 456 L116 456 L100 108 L84 140 L58 120 Z';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function StudioCanvas({
  activeSide,
  tshirtColor,
  artwork,
  textConfig,
  transform,
  onCanvasChange,
  onTransformChange,
  onTextConfigChange
}) {
  const containerRef = useRef(null);
  const canvasElementRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const tshirtTemplateRef = useRef(null);
  const artworkRequestRef = useRef(0);
  const onTransformChangeRef = useRef(onTransformChange);
  const onTextConfigChangeRef = useRef(onTextConfigChange);
  const normalizedTransformRef = useRef(null);
  const normalizedTextConfigRef = useRef(null);

  const normalizedTransform = useMemo(() => {
    return {
      x: typeof transform?.x === 'number' ? transform.x : BASE_CANVAS_WIDTH / 2,
      y: typeof transform?.y === 'number' ? transform.y : 180,
      scale: typeof transform?.scale === 'number' ? transform.scale : 0.55,
      rotation: typeof transform?.rotation === 'number' ? transform.rotation : 0,
      opacity: typeof transform?.opacity === 'number' ? transform.opacity : 1,
      flipX: Boolean(transform?.flipX)
    };
  }, [transform]);

  const normalizedTextConfig = useMemo(() => {
    return {
      x: typeof textConfig?.x === 'number' ? textConfig.x : BASE_CANVAS_WIDTH / 2,
      y: typeof textConfig?.y === 'number' ? textConfig.y : 380,
      text: textConfig?.text ?? '',
      fontFamily: textConfig?.fontFamily ?? 'Space Grotesk',
      fontSize: typeof textConfig?.fontSize === 'number' ? textConfig.fontSize : 28,
      color: textConfig?.color ?? '#080808'
    };
  }, [textConfig]);

  useEffect(() => {
    onTransformChangeRef.current = onTransformChange;
  }, [onTransformChange]);

  useEffect(() => {
    onTextConfigChangeRef.current = onTextConfigChange;
  }, [onTextConfigChange]);

  useEffect(() => {
    normalizedTransformRef.current = normalizedTransform;
  }, [normalizedTransform]);

  useEffect(() => {
    normalizedTextConfigRef.current = normalizedTextConfig;
  }, [normalizedTextConfig]);

  useEffect(() => {
    const canvas = new Canvas(canvasElementRef.current, {
      width: BASE_CANVAS_WIDTH,
      height: BASE_CANVAS_HEIGHT,
      backgroundColor: '#f7f3ee00',
      selection: true
    });

    const tshirtTemplate = new Path(SHIRT_OUTLINE, {
      left: 0,
      top: 0,
      fill: tshirtColor,
      stroke: 'rgba(0, 0, 0, 0.14)',
      strokeWidth: 2,
      selectable: false,
      evented: false,
      hoverCursor: 'default'
    });
    tshirtTemplate.data = { role: 'template' };
    tshirtTemplateRef.current = tshirtTemplate;
    canvas.add(tshirtTemplate);

    fabricCanvasRef.current = canvas;
    onCanvasChange?.(canvas);

    const syncArtwork = (object) => {
      if (!object?.data || object.data.role !== 'artwork') return;
      if (typeof object.left !== 'number' || typeof object.top !== 'number') return;
      const current = normalizedTransformRef.current;
      if (!current) return;

      const next = {
        x: clamp(object.left, 0, BASE_CANVAS_WIDTH),
        y: clamp(object.top, 0, BASE_CANVAS_HEIGHT),
        scale: typeof object.scaleX === 'number' ? object.scaleX : current.scale,
        rotation: typeof object.angle === 'number' ? object.angle : current.rotation,
        opacity: typeof object.opacity === 'number' ? object.opacity : current.opacity,
        flipX: Boolean(object.flipX)
      };

      onTransformChangeRef.current?.(next);
    };

    const syncText = (object) => {
      if (!object?.data || object.data.role !== 'text') return;
      if (typeof object.left !== 'number' || typeof object.top !== 'number') return;
      const current = normalizedTextConfigRef.current;
      if (!current) return;

      const next = {
        x: clamp(object.left, 0, BASE_CANVAS_WIDTH),
        y: clamp(object.top, 0, BASE_CANVAS_HEIGHT),
        text: typeof object.text === 'string' ? object.text : current.text,
        fontFamily: object.fontFamily || current.fontFamily,
        fontSize: typeof object.fontSize === 'number' ? object.fontSize : current.fontSize,
        color: object.fill || current.color
      };

      onTextConfigChangeRef.current?.(next);
    };

    const handleModified = (event) => {
      const target = event?.target || canvas.getActiveObject();
      syncArtwork(target);
      syncText(target);
    };

    const handleTextChanged = (event) => {
      const target = event?.target || canvas.getActiveObject();
      syncText(target);
    };

    const handleMouseWheel = (event) => {
      const wheel = event?.e;
      if (!wheel) return;
      const target = event?.target || canvas.getActiveObject();
      if (!target || target?.data?.role === 'template') return;

      wheel.preventDefault();
      wheel.stopPropagation();

      if (wheel.shiftKey) {
        const nextRotation = (target.angle || 0) - wheel.deltaY * EDIT_ROTATION_STEP;
        target.rotate(nextRotation);
      } else {
        const currentScale = typeof target.scaleX === 'number' ? target.scaleX : normalizedTransformRef.current?.scale || 0.55;
        const nextScale = clamp(currentScale - wheel.deltaY * 0.0015, EDIT_SCALE_MIN, EDIT_SCALE_MAX);
        target.set({ scaleX: nextScale, scaleY: nextScale });
      }

      target.setCoords();
      syncArtwork(target);
      syncText(target);
      canvas.requestRenderAll();
    };

    canvas.on('object:modified', handleModified);
    canvas.on('object:moving', handleModified);
    canvas.on('object:scaling', handleModified);
    canvas.on('object:rotating', handleModified);
    canvas.on('text:changed', handleTextChanged);
    canvas.on('mouse:wheel', handleMouseWheel);

    const resize = () => {
      const container = containerRef.current;
      if (!container) return;

      const availableWidth = container.clientWidth;
      const targetWidth = Math.min(BASE_CANVAS_WIDTH, Math.max(MIN_CANVAS_WIDTH, availableWidth));
      const zoom = targetWidth / BASE_CANVAS_WIDTH;

      canvas.setWidth(Math.round(BASE_CANVAS_WIDTH * zoom));
      canvas.setHeight(Math.round(BASE_CANVAS_HEIGHT * zoom));
      canvas.setZoom(zoom);
      canvas.calcOffset();
      canvas.requestRenderAll();
    };

    resize();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => resize());
    if (observer && containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer?.disconnect();
      canvas.off('object:modified', handleModified);
      canvas.off('object:moving', handleModified);
      canvas.off('object:scaling', handleModified);
      canvas.off('object:rotating', handleModified);
      canvas.off('text:changed', handleTextChanged);
      canvas.off('mouse:wheel', handleMouseWheel);
      canvas.dispose();
      fabricCanvasRef.current = null;
      tshirtTemplateRef.current = null;
    };
  }, [onCanvasChange]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const tshirtTemplate = tshirtTemplateRef.current;
    if (tshirtTemplate) {
      tshirtTemplate.set('fill', tshirtColor);
    }
    canvas.renderAll();
  }, [tshirtColor]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const existingArtwork = objects.find((object) => object?.data?.role === 'artwork') || null;
    const existingText = objects.find((object) => object?.data?.role === 'text') || null;

    const ensureText = () => {
      const hasText = Boolean(normalizedTextConfig.text.trim());
      if (!hasText && existingText) {
        canvas.remove(existingText);
        return;
      }

      if (!hasText) return;

      const nextText =
        existingText ||
        new IText(normalizedTextConfig.text, {
          left: normalizedTextConfig.x,
          top: normalizedTextConfig.y,
          originX: 'center',
          originY: 'center'
        });

      nextText.set({
        text: normalizedTextConfig.text,
        left: normalizedTextConfig.x,
        top: normalizedTextConfig.y,
        fontFamily: normalizedTextConfig.fontFamily,
        fontSize: normalizedTextConfig.fontSize,
        fill: normalizedTextConfig.color,
        opacity: normalizedTransform.opacity,
        editable: true,
        selectable: true,
        hasControls: true
      });
      nextText.data = { role: 'text', side: activeSide };

      if (!existingText) canvas.add(nextText);
    };

    const removeArtwork = () => {
      if (!existingArtwork) return;
      canvas.remove(existingArtwork);
    };

    const ensureArtwork = async () => {
      if (!artwork) {
        removeArtwork();
        return;
      }

      const requestId = ++artworkRequestRef.current;

      const image = await FabricImage.fromURL(artwork, { crossOrigin: 'anonymous' }).catch(() => null);
      if (!image) return;
      if (requestId !== artworkRequestRef.current) return;

      if (existingArtwork) {
        canvas.remove(existingArtwork);
      }

      image.set({
        left: normalizedTransform.x,
        top: normalizedTransform.y,
        originX: 'center',
        originY: 'center',
        scaleX: normalizedTransform.scale,
        scaleY: normalizedTransform.scale,
        angle: normalizedTransform.rotation,
        opacity: normalizedTransform.opacity,
        flipX: normalizedTransform.flipX,
        selectable: true,
        hasControls: true
      });
      image.data = { role: 'artwork', side: activeSide, src: artwork };

      canvas.add(image);
    };

    const updateArtworkProps = () => {
      const currentArtwork = canvas.getObjects().find((object) => object?.data?.role === 'artwork') || null;
      if (!currentArtwork) return;
      if (currentArtwork.data?.src !== artwork) {
        return;
      }

      currentArtwork.set({
        left: normalizedTransform.x,
        top: normalizedTransform.y,
        scaleX: normalizedTransform.scale,
        scaleY: normalizedTransform.scale,
        angle: normalizedTransform.rotation,
        opacity: normalizedTransform.opacity,
        flipX: normalizedTransform.flipX
      });
    };

    ensureText();
    if (existingArtwork && existingArtwork.data?.src === artwork) {
      updateArtworkProps();
    } else {
      void ensureArtwork();
    }

    canvas.requestRenderAll();
  }, [activeSide, artwork, normalizedTextConfig, normalizedTransform]);

  return (
    <div
      ref={containerRef}
      className="studio-grid w-full rounded-[2rem] border border-black/8 bg-white/60 p-4"
    >
      <canvas ref={canvasElementRef} className="mx-auto block max-w-full rounded-[1.5rem] shadow-2xl shadow-black/10" />
    </div>
  );
}
