const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const vegetableData = require('../../frontend/src/data/vegetablePlants.json');

const designsPath = path.join(__dirname, '..', 'data', 'garden-designs.json');
const validPlants = new Set([
    ...vegetableData.vegetablePlants.map(({ plant }) => plant.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')),
    'sunflower',
]);
const validDecorations = new Set([
    'pathway', 'fence', 'bench', 'flower-pot', 'garden-light', 'water-feature',
    'stepping-stones', 'garden-arch', 'tree', 'flower-bed', 'shrub',
]);
const validFloorTextures = new Set(['grass', 'soil', 'gravel', 'stone', 'wood']);
let writeQueue = Promise.resolve();

function invalidDesign(message) {
    const error = new Error(message);
    error.code = 'GARDEN_DESIGN_INVALID';
    return error;
}

function validateSnapshot(snapshot) {
    if (
        !snapshot
        || snapshot.version !== 1
        || !['warm', 'temperate', 'cold'].includes(snapshot.zone)
        || (snapshot.width !== undefined && (!Number.isFinite(snapshot.width) || snapshot.width < 1 || snapshot.width > 20))
        || (snapshot.length !== undefined && (!Number.isFinite(snapshot.length) || snapshot.length < 1 || snapshot.length > 20))
        || (snapshot.floorColor !== undefined && (typeof snapshot.floorColor !== 'string' || !/^#[\da-f]{6}$/i.test(snapshot.floorColor)))
        || (snapshot.floorTexture !== undefined && !validFloorTextures.has(snapshot.floorTexture))
        || !Array.isArray(snapshot.items)
        || snapshot.items.length > 500
    ) {
        throw invalidDesign('Garden design contains invalid settings or dimensions.');
    }

    const ids = new Set();
    for (const item of snapshot.items) {
        if (
            !item
            || (item.id !== undefined && (
                typeof item.id !== 'string'
                || !/^[\w-]{1,100}$/.test(item.id)
                || ids.has(item.id)
            ))
            || !Number.isFinite(item.x)
            || !Number.isFinite(item.y)
            || item.x < 0
            || item.y < 0
            || (item.rotation !== undefined && (!Number.isFinite(item.rotation) || item.rotation < 0 || item.rotation >= 360))
            || (item.rotationCentered !== undefined && typeof item.rotationCentered !== 'boolean')
        ) {
            throw invalidDesign('Garden design contains an invalid element.');
        }
        if (item.id !== undefined) ids.add(item.id);

        if (item.type === 'plant') {
            if (
                !validPlants.has(item.plant)
                || !Number.isFinite(item.spacing)
                || item.spacing < 0
                || item.spacing > 2000
                || (item.scale !== undefined && (!Number.isFinite(item.scale) || item.scale < 0.5 || item.scale > 2.5))
            ) {
                throw invalidDesign('Garden design contains an invalid plant.');
            }
        } else if (item.type === 'bed') {
            if (
                !['rect', 'circle'].includes(item.shape)
                || ((item.width !== undefined || item.height !== undefined)
                    && (!Number.isFinite(item.width) || !Number.isFinite(item.height)
                        || item.width <= 0 || item.height <= 0 || item.width > 2000 || item.height > 2000))
            ) {
                throw invalidDesign('Garden design contains invalid bed dimensions.');
            }
        } else if (item.type === 'decoration') {
            if (
                !validDecorations.has(item.decoration)
                || (item.scale !== undefined && (!Number.isFinite(item.scale) || item.scale < 0.5 || item.scale > 2.5))
            ) {
                throw invalidDesign('Garden design contains an invalid decoration.');
            }
        } else {
            throw invalidDesign('Garden design contains an unsupported element type.');
        }
    }
    return snapshot;
}

async function readStore() {
    try {
        const contents = await fs.readFile(designsPath, 'utf8');
        const parsed = JSON.parse(contents);
        if (!parsed || parsed.format !== 'botanica-garden-designs' || parsed.version !== 1 || !parsed.designs || typeof parsed.designs !== 'object' || Array.isArray(parsed.designs)) {
            throw new Error('Garden design storage has an unsupported format.');
        }
        for (const [name, snapshot] of Object.entries(parsed.designs)) {
            if (!name.trim() || name.length > 60) throw new Error('Garden design storage contains an invalid design name.');
            validateSnapshot(snapshot);
        }
        return parsed.designs;
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        throw error;
    }
}

async function writeStore(designs) {
    await fs.mkdir(path.dirname(designsPath), { recursive: true });
    const temporaryPath = `${designsPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    try {
        await fs.writeFile(temporaryPath, `${JSON.stringify({
            format: 'botanica-garden-designs',
            version: 1,
            designs,
        }, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
        await fs.rename(temporaryPath, designsPath);
    } catch (error) {
        try {
            await fs.rm(temporaryPath, { force: true });
        } catch (cleanupError) {
            console.error('Could not remove the temporary garden design file:', cleanupError);
        }
        throw error;
    }
}

function serializeWrite(operation) {
    const current = writeQueue.catch(() => {}).then(operation);
    writeQueue = current;
    return current;
}

async function listDesigns() {
    return readStore();
}

async function saveDesigns(designs) {
    if (!designs || typeof designs !== 'object' || Array.isArray(designs) || Object.keys(designs).length > 100) {
        throw invalidDesign('Garden designs must be an object containing at most 100 designs.');
    }
    for (const [name, snapshot] of Object.entries(designs)) {
        if (!name.trim() || name.length > 60) throw invalidDesign('Garden design names must be between 1 and 60 characters.');
        validateSnapshot(snapshot);
    }
    return serializeWrite(async () => {
        await readStore();
        await writeStore(designs);
        return designs;
    });
}

module.exports = {
    listDesigns,
    saveDesigns,
};
