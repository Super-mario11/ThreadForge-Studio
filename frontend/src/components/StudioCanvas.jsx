import { useEffect, useMemo, useRef } from "react";
import { Canvas, FabricImage, IText, Path, Rect } from "fabric";

const BASE_CANVAS_WIDTH = 360;
const BASE_CANVAS_HEIGHT = 480;
const MIN_CANVAS_WIDTH = 240;
const EDIT_SCALE_MIN = 0.2;
const EDIT_SCALE_MAX = 1.8;
const EDIT_ROTATION_STEP = 0.2;

const PRINT_ZONE = {
  x: 86,
  y: 140,
  width: 220,
  height: 160,
  rx: 24,
};
const SHIRT_SCALE = 1.5;

const SHIRT_OUTLINE = `
M110 90
Q140 60 170 80
L190 80
Q220 60 250 90
L290 140
Q275 160 250 125
L240 400
Q180 420 120 400
L110 125
Q85 160 70 140
Z
`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getZoneCenter = () => ({
  x: PRINT_ZONE.x + PRINT_ZONE.width / 2,
  y: PRINT_ZONE.y + PRINT_ZONE.height / 2,
});

const clampObjectInPrintZone = (object) => {
  if (!object) return;

  const halfWidth = (object.getScaledWidth?.() || 0) / 2;
  const halfHeight = (object.getScaledHeight?.() || 0) / 2;
  const minX = PRINT_ZONE.x + halfWidth;
  const maxX = PRINT_ZONE.x + PRINT_ZONE.width - halfWidth;
  const minY = PRINT_ZONE.y + halfHeight;
  const maxY = PRINT_ZONE.y + PRINT_ZONE.height - halfHeight;
  const center = getZoneCenter();

  object.set({
    left: minX <= maxX ? clamp(object.left ?? center.x, minX, maxX) : center.x,
    top: minY <= maxY ? clamp(object.top ?? center.y, minY, maxY) : center.y,
  });
  object.setCoords();
};

export default function StudioCanvas({
  tshirtColor,
  artwork,
  textConfig,
  transform,
  onCanvasChange,
  onTransformChange,
  onTextConfigChange,
}) {
  const containerRef = useRef(null);
  const canvasElementRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const shirtTemplateRef = useRef(null);
  const artworkRequestRef = useRef(0);
  const onTransformChangeRef = useRef(onTransformChange);
  const onTextConfigChangeRef = useRef(onTextConfigChange);
  const normalizedTransformRef = useRef(null);
  const normalizedTextConfigRef = useRef(null);

  const normalizedTransform = useMemo(() => {
    const center = getZoneCenter();
    return {
      x: typeof transform?.x === "number" ? transform.x : center.x,
      y: typeof transform?.y === "number" ? transform.y : center.y,
      scale: typeof transform?.scale === "number" ? transform.scale : 0.55,
      rotation:
        typeof transform?.rotation === "number" ? transform.rotation : 0,
      opacity: typeof transform?.opacity === "number" ? transform.opacity : 1,
      flipX: Boolean(transform?.flipX),
    };
  }, [transform]);

  const normalizedTextConfig = useMemo(() => {
    const center = getZoneCenter();
    return {
      x: typeof textConfig?.x === "number" ? textConfig.x : center.x,
      y: typeof textConfig?.y === "number" ? textConfig.y : center.y + 40,
      text: textConfig?.text ?? "",
      fontFamily: textConfig?.fontFamily ?? "Space Grotesk",
      fontSize:
        typeof textConfig?.fontSize === "number" ? textConfig.fontSize : 28,
      color: textConfig?.color ?? "#080808",
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
      backgroundColor: "#f7f3ee00",
      selection: true,
    });

    const shirt = new Path(SHIRT_OUTLINE, {
      left: 5,
      top: 10,
      scaleX: SHIRT_SCALE,
      scaleY: SHIRT_SCALE,
      fill: tshirtColor,
      stroke: "rgba(0, 0, 0, 0.14)",
      strokeWidth: 2,
      selectable: false,
      evented: false,
      hoverCursor: "default",
    });
    shirt.data = { role: "template" };
    shirtTemplateRef.current = shirt;
    canvas.add(shirt);

    const printZone = new Rect({
      left: PRINT_ZONE.x,
      top: PRINT_ZONE.y,
      width: PRINT_ZONE.width,
      height: PRINT_ZONE.height,
      rx: PRINT_ZONE.rx,
      ry: PRINT_ZONE.rx,
      fill: "#ffffff",
      stroke: "rgba(0, 0, 0, 0.08)",
      strokeWidth: 1.5,
      selectable: false,
      evented: false,
      hoverCursor: "default",
    });
    printZone.data = { role: "print-zone" };
    canvas.add(printZone);

    fabricCanvasRef.current = canvas;
    onCanvasChange?.(canvas);

    const syncArtwork = (object) => {
      if (!object?.data || object.data.role !== "artwork") return;
      if (typeof object.left !== "number" || typeof object.top !== "number")
        return;
      const current = normalizedTransformRef.current;
      if (!current) return;

      onTransformChangeRef.current?.({
        x: clamp(object.left, PRINT_ZONE.x, PRINT_ZONE.x + PRINT_ZONE.width),
        y: clamp(object.top, PRINT_ZONE.y, PRINT_ZONE.y + PRINT_ZONE.height),
        scale:
          typeof object.scaleX === "number" ? object.scaleX : current.scale,
        rotation:
          typeof object.angle === "number" ? object.angle : current.rotation,
        opacity:
          typeof object.opacity === "number" ? object.opacity : current.opacity,
        flipX: Boolean(object.flipX),
      });
    };

    const syncText = (object) => {
      if (!object?.data || object.data.role !== "text") return;
      if (typeof object.left !== "number" || typeof object.top !== "number")
        return;
      const current = normalizedTextConfigRef.current;
      if (!current) return;

      onTextConfigChangeRef.current?.({
        x: clamp(object.left, PRINT_ZONE.x, PRINT_ZONE.x + PRINT_ZONE.width),
        y: clamp(object.top, PRINT_ZONE.y, PRINT_ZONE.y + PRINT_ZONE.height),
        text: typeof object.text === "string" ? object.text : current.text,
        fontFamily: object.fontFamily || current.fontFamily,
        fontSize:
          typeof object.fontSize === "number"
            ? object.fontSize
            : current.fontSize,
        color: object.fill || current.color,
      });
    };

    const handleModified = (event) => {
      const target = event?.target || canvas.getActiveObject();
      if (target?.data?.role === "artwork" || target?.data?.role === "text") {
        clampObjectInPrintZone(target);
      }
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
      if (
        !target ||
        target?.data?.role === "template" ||
        target?.data?.role === "print-zone"
      )
        return;

      wheel.preventDefault();
      wheel.stopPropagation();

      if (wheel.shiftKey) {
        const nextRotation =
          (target.angle || 0) - wheel.deltaY * EDIT_ROTATION_STEP;
        target.rotate(nextRotation);
      } else {
        const currentScale =
          typeof target.scaleX === "number"
            ? target.scaleX
            : normalizedTransformRef.current?.scale || 0.55;
        const nextScale = clamp(
          currentScale - wheel.deltaY * 0.0015,
          EDIT_SCALE_MIN,
          EDIT_SCALE_MAX,
        );
        target.set({ scaleX: nextScale, scaleY: nextScale });
      }

      clampObjectInPrintZone(target);
      target.setCoords();
      syncArtwork(target);
      syncText(target);
      canvas.requestRenderAll();
    };

    canvas.on("object:modified", handleModified);
    canvas.on("object:moving", handleModified);
    canvas.on("object:scaling", handleModified);
    canvas.on("object:rotating", handleModified);
    canvas.on("text:changed", handleTextChanged);
    canvas.on("mouse:wheel", handleMouseWheel);

    const resize = () => {
      const container = containerRef.current;
      if (!container) return;

      const availableWidth = container.clientWidth;
      const targetWidth = Math.min(
        BASE_CANVAS_WIDTH,
        Math.max(MIN_CANVAS_WIDTH, availableWidth),
      );
      const zoom = targetWidth / BASE_CANVAS_WIDTH;

      canvas.setWidth(Math.round(BASE_CANVAS_WIDTH * zoom));
      canvas.setHeight(Math.round(BASE_CANVAS_HEIGHT * zoom));
      canvas.setZoom(zoom);
      canvas.calcOffset();
      canvas.requestRenderAll();
    };

    resize();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => resize());
    if (observer && containerRef.current)
      observer.observe(containerRef.current);

    return () => {
      observer?.disconnect();
      canvas.off("object:modified", handleModified);
      canvas.off("object:moving", handleModified);
      canvas.off("object:scaling", handleModified);
      canvas.off("object:rotating", handleModified);
      canvas.off("text:changed", handleTextChanged);
      canvas.off("mouse:wheel", handleMouseWheel);
      canvas.dispose();
      fabricCanvasRef.current = null;
      shirtTemplateRef.current = null;
    };
  }, [onCanvasChange]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const shirt = shirtTemplateRef.current;
    if (shirt) shirt.set("fill", tshirtColor);
    canvas.renderAll();
  }, [tshirtColor]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const existingArtwork =
      objects.find((object) => object?.data?.role === "artwork") || null;
    const existingText =
      objects.find((object) => object?.data?.role === "text") || null;

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
          originX: "center",
          originY: "center",
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
        hasControls: true,
      });
      nextText.data = { role: "text" };
      clampObjectInPrintZone(nextText);

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
      const image = await FabricImage.fromURL(artwork, {
        crossOrigin: "anonymous",
      }).catch(() => null);
      if (!image) return;
      if (requestId !== artworkRequestRef.current) return;

      if (existingArtwork) canvas.remove(existingArtwork);

      image.set({
        left: normalizedTransform.x,
        top: normalizedTransform.y,
        originX: "center",
        originY: "center",
        scaleX: normalizedTransform.scale,
        scaleY: normalizedTransform.scale,
        angle: normalizedTransform.rotation,
        opacity: normalizedTransform.opacity,
        flipX: normalizedTransform.flipX,
        selectable: true,
        hasControls: true,
      });
      image.data = { role: "artwork", src: artwork };
      clampObjectInPrintZone(image);
      canvas.add(image);
    };

    const updateArtworkProps = () => {
      const currentArtwork =
        canvas
          .getObjects()
          .find((object) => object?.data?.role === "artwork") || null;
      if (!currentArtwork || currentArtwork.data?.src !== artwork) return;

      currentArtwork.set({
        left: normalizedTransform.x,
        top: normalizedTransform.y,
        scaleX: normalizedTransform.scale,
        scaleY: normalizedTransform.scale,
        angle: normalizedTransform.rotation,
        opacity: normalizedTransform.opacity,
        flipX: normalizedTransform.flipX,
      });
      clampObjectInPrintZone(currentArtwork);
    };

    ensureText();
    if (existingArtwork && existingArtwork.data?.src === artwork) {
      updateArtworkProps();
    } else {
      void ensureArtwork();
    }

    canvas.requestRenderAll();
  }, [artwork, normalizedTextConfig, normalizedTransform]);

  return (
    <div
      ref={containerRef}
      className="studio-grid w-full rounded-[2rem] border border-black/8 bg-white/60 p-4"
    >
      <canvas
        ref={canvasElementRef}
        className="mx-auto block max-w-full rounded-[1.5rem] shadow-2xl shadow-black/10"
      />
    </div>
  );
}
