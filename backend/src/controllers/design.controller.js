import { z } from 'zod';

const designSchema = z.object({
  name: z.string().min(2),
  previewUrl: z.string().url(),
  productType: z.string().min(2),
  color: z.string().min(2),
  canvasState: z.object({
    front: z.any(),
    back: z.any()
  })
});

export const saveDesign = async (req, res) => {
  const parsed = designSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid design data',
      details: parsed.error.flatten()
    });
  }

  req.user.savedDesigns.unshift(parsed.data);
  await req.user.save();

  res.status(201).json({ savedDesigns: req.user.savedDesigns });
};

export const getSavedDesigns = async (req, res) => {
  res.json({ savedDesigns: req.user.savedDesigns });
};
