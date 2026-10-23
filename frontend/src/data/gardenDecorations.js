export const gardenDecorations = [
  { id: 'pathway', label: 'Pathway', iconAsset: '/icons/decorations/pathway.svg', width: 160, height: 48 },
  { id: 'fence', label: 'Fence', iconAsset: '/icons/decorations/fence.svg', width: 140, height: 48 },
  { id: 'bench', label: 'Bench', iconAsset: '/icons/decorations/bench.svg', width: 64, height: 48 },
  {
    id: 'flower-pot',
    label: 'Flower Pot',
    iconAsset: '/icons/decorations/flower-pot.svg',
    width: 48,
    height: 54,
  },
  { id: 'garden-light', label: 'Garden Light', iconAsset: '/icons/decorations/garden-light.svg', width: 40, height: 64 },
  { id: 'water-feature', label: 'Water Feature', iconAsset: '/icons/decorations/water-feature.svg', width: 72, height: 72 },
  { id: 'stepping-stones', label: 'Stepping Stones', iconAsset: '/icons/decorations/stepping-stones.svg', width: 144, height: 48 },
  { id: 'garden-arch', label: 'Garden Arch', iconAsset: '/icons/decorations/garden-arch.svg', width: 76, height: 96 },
  { id: 'tree', label: 'Tree', iconAsset: '/icons/decorations/deciduous-tree.svg', width: 96, height: 96 },
  { id: 'flower-bed', label: 'Flower Bed', iconAsset: '/icons/decorations/blossom.svg', width: 112, height: 80 },
  { id: 'shrub', label: 'Flowering Shrub', iconAsset: '/icons/decorations/flower.svg', width: 72, height: 72 },
];

export const gardenDecorationById = Object.fromEntries(
  gardenDecorations.map((decoration) => [decoration.id, decoration]),
);

export function getDecorationDimensions(decorationId) {
  const decoration = gardenDecorationById[decorationId];
  if (!decoration) return null;
  return { width: decoration.width, height: decoration.height };
}
