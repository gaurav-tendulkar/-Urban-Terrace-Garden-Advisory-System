import { getDecorationDimensions } from '../data/gardenDecorations.js';

export const MAX_BED_DIMENSION_PX = 2000;

export function getBedDimensions(item) {
  if (Number.isFinite(item.width) && Number.isFinite(item.height)) {
    return { width: item.width, height: item.height };
  }
  const size = item.shape === 'circle' ? 150 : 200;
  return {
    width: size,
    height: item.shape === 'circle' ? size : 100,
  };
}

export function getItemBaseDimensions(item) {
  if (item.type === 'bed') return getBedDimensions(item);
  if (item.type === 'decoration') {
    const baseDimensions = getDecorationDimensions(item.decoration) ?? { width: 40, height: 40 };
    const scale = Number.isFinite(item.scale) ? item.scale : 1;
    return { width: baseDimensions.width * scale, height: baseDimensions.height * scale };
  }
  const scale = Number.isFinite(item.scale) ? item.scale : 1;
  return { width: 40 * scale, height: 40 * scale };
}

export function getItemDimensions(item) {
  const dimensions = getItemBaseDimensions(item);
  const rotation = Number.isFinite(item.rotation) ? item.rotation : 0;
  const radians = (rotation * Math.PI) / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  const width = cosine * dimensions.width + sine * dimensions.height;
  const height = sine * dimensions.width + cosine * dimensions.height;
  return {
    width: width < 1e-10 ? 0 : width,
    height: height < 1e-10 ? 0 : height,
  };
}

export function hasValidBedDimensions(item) {
  const hasWidth = item.width !== undefined;
  const hasHeight = item.height !== undefined;
  if (!hasWidth && !hasHeight) return true;
  return hasWidth
    && hasHeight
    && Number.isFinite(item.width)
    && Number.isFinite(item.height)
    && item.width > 0
    && item.height > 0
    && item.width <= MAX_BED_DIMENSION_PX
    && item.height <= MAX_BED_DIMENSION_PX;
}
