import { useEffect, useRef } from 'react';
import { Canvas, FabricImage, IText } from 'fabric';

export default function StudioCanvas({
  activeSide,
  tshirtColor,
  artwork,
  textConfig,
  transform,
  onCanvasChange
}) {
  const canvasElementRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = new Canvas(canvasElementRef.current, {
      width: 360,
      height: 480,
      backgroundColor: '#f7f3ee',
      selection: true
    });

    fabricCanvasRef.current = canvas;
    onCanvasChange?.(canvas);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [onCanvasChange]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.backgroundColor = tshirtColor;
    canvas.renderAll();
  }, [tshirtColor]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((object) => canvas.remove(object));

    const applyText = () => {
      if (!textConfig.text.trim()) {
        canvas.renderAll();
        return;
      }

      const text = new IText(textConfig.text, {
        left: 180,
        top: 380,
        originX: 'center',
        fontFamily: textConfig.fontFamily,
        fontSize: textConfig.fontSize,
        fill: textConfig.color,
        opacity: transform.opacity
      });
      canvas.add(text);
      canvas.renderAll();
    };

    if (artwork) {
      FabricImage.fromURL(artwork).then((image) => {
        image.set({
          left: 180,
          top: 180,
          originX: 'center',
          originY: 'center',
          scaleX: transform.scale,
          scaleY: transform.scale,
          angle: transform.rotation,
          opacity: transform.opacity,
          flipX: transform.flipX
        });
        canvas.add(image);
        applyText();
      });
    } else {
      applyText();
    }
  }, [artwork, textConfig, transform, activeSide]);

  return (
    <div className="studio-grid rounded-[2rem] border border-black/8 bg-white/60 p-4">
      <canvas ref={canvasElementRef} className="mx-auto rounded-[1.5rem] shadow-2xl shadow-black/10" />
    </div>
  );
}
