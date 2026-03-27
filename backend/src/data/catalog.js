export const catalogProducts = [
  {
    name: 'Black T-Shirt',
    slug: 'black-tshirt',
    category: 'Regular Fit',
    description: 'Classic black t-shirt ready for custom printing.',
    basePrice: 799,
    colors: ['Black'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 100,
    imageUrl: '/black.png',
    featured: true,
    customizationAreas: {
      front: { width: 260, height: 320 },
      back: { width: 260, height: 320 }
    }
  },
  {
    name: 'White T-Shirt',
    slug: 'white-tshirt',
    category: 'Regular Fit',
    description: 'Classic white t-shirt ready for custom printing.',
    basePrice: 799,
    colors: ['White'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 95,
    imageUrl: '/white.png',
    featured: true,
    customizationAreas: {
      front: { width: 260, height: 320 },
      back: { width: 260, height: 320 }
    }
  }
];
