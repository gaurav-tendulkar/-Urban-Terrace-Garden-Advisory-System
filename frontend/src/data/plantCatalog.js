import vegetableData from './vegetablePlants.json';

function getPlantId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const plantProfiles = [
  ...vegetableData.vegetablePlants.map((profile) => ({
    ...profile,
    id: getPlantId(profile.plant),
  })),
  {
    id: 'sunflower',
    plant: 'Sunflower',
    detailsAvailable: false,
  },
];

export const plantProfileById = Object.fromEntries(
  plantProfiles.map((profile) => [profile.id, profile]),
);
