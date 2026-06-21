import type { MaterialKey } from "@/constants/colors";

/**
 * Authentic recycling/material photos supplied for Glean. Hosted on permanent
 * Rork attachment URLs so they're stable web links usable both in app code and
 * in seeded database rows (official posts, guides, demo listings).
 */
const BASE = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments";

export const PHOTOS = {
  /** Loose PET drink bottles (Pepsi/Lipton) in a bin. */
  plasticsLoose: `${BASE}/ru5gvuotnafg15vvsu5ex.jpeg`,
  /** A strapped bale of clear PET bottles. */
  plasticsBaledClear: `${BASE}/mi23haa1hldei9hrbmsl2.jpeg`,
  /** A strapped bale of mixed colourful plastics. */
  plasticsBaledMixed: `${BASE}/vp7xuhrx5knmvy357edk5.jpeg`,
  /** Sack of mixed textile-waste offcuts. */
  textiles: `${BASE}/l7l23k59dwzolzw1p56y2.jpeg`,
  /** Open landfill / dumpsite mountain. */
  landfill: `${BASE}/cmc1s79fvuqykrlbgk1xl.jpeg`,
  /** Stacked bales of plastic waste at a recovery site. */
  mixedBales: `${BASE}/iwkumvbi0kf2bv2qovb71.jpeg`,
  /** Pile of dried coconut husks (organic feedstock). */
  coconutHusks: `${BASE}/5ih81hakwd16ewgnq6pgf.jpeg`,
  /** A moulded charcoal briquette held in hand. */
  briquette: `${BASE}/62m9nsii2e17uozrdeevo.jpeg`,
  /** Glowing red-hot briquettes. */
  briquettesGlowing: `${BASE}/w1onmzqsodmf4vorc7zbz.jpeg`,
  /** Bright spiral metal turnings / swarf. */
  metalTurnings: `${BASE}/42w2kvibyh5erjuww97cg.jpeg`,
  /** Dark machined metal scrap turnings. */
  metalTurningsDark: `${BASE}/ilc9vqij1cvdeziccxeze.jpeg`,
  /** Heap of cast metal machine parts (pulleys). */
  metalParts: `${BASE}/6e3pwf3fxuwxn09y6tnc0.jpeg`,
  /** Galvanised steel pipe offcuts. */
  metalPipes: `${BASE}/0rihgtd29sqaeplbyck3w.jpeg`,
  /** Steel section offcuts in a crate. */
  steelOffcuts: `${BASE}/09btc9822z2bryo6f6ao1.jpeg`,
  /** Bundle of steel scrap bars. */
  steelBars: `${BASE}/m60arowrfyi1nwmry4thv.jpeg`,
  /** Recycled-plastic paver block made from melted film waste. */
  plasticPaver: `${BASE}/co8p5000gy9cdc7ef1an7.jpeg`,
  /** Sorted food / market waste in collection bins (compost feedstock). */
  foodWaste: `${BASE}/ljfcgrs1df6d1fhci3bfh.jpg`,
  /** Black soldier fly larvae reared on organic waste. */
  bsfLarvae: `${BASE}/h9cyu8l7csiimzmlvegui.jpg`,
  /** Cluster of clear PET drink bottles (studio shot). */
  petBottlesClear: `${BASE}/a5mhjucdsvqtjnvet2tur.jpeg`,
  /** LDPE vs HDPE plastics explainer — film, bags, jugs and bottles. */
  ldpeHdpe: `${BASE}/31tscacjq33mlmeedrsvk.jpg`,
  /** Coconut street vendors selling fresh coconuts (organic feedstock). */
  coconutVendors: `${BASE}/j7622kkvh20kv7qyhjwgs.jpg`,
  /** Hand holding mixed-colour shredded plastic regrind / flakes. */
  plasticFlakesMixed: `${BASE}/9cdbbrxoazk6yfxaxrd9i.jpeg`,
  /** Bin of clean single-resin blue plastic flakes / regrind. */
  plasticFlakesBlue: `${BASE}/78plnxvsxocze006706nw.webp`,
  /** Stacked bales of clear/mixed PET drink bottles. */
  petBalesStacked: `${BASE}/twcmembbltjimiwcdnhuu.jpeg`,
  /** Vendor holding a "say no to plastic" sign and a reusable bag. */
  reusableBags: `${BASE}/yrwkmqdts2gmsc2wc9yvj.jpg`,
  /** Flooded street in Accra with stranded vehicles. */
  floodAccra: `${BASE}/udtmkb50y4piao9621gkj.jpg`,
  /** Galamsey (illegal small-scale gold mining) site degrading land and water. */
  galamsey: `${BASE}/p1o2n27nwgsupo0wrl3a6.jpeg`,
} as const;

/**
 * Web-sourced, context-checked photos used where the 15 authentic photos can't
 * cover every card without repeating. Each is a verified, hotlinkable image that
 * matches the material it's grouped under, so the home list reads varied and
 * real instead of cycling the same few pictures.
 */
const U = "https://images.unsplash.com/photo-";
const Q = "?w=800&q=70&auto=format&fit=crop";
export const WEB_PHOTOS = {
  /** Recycled PET flakes / pellets. */
  petFlakes: `${U}1586013286823-5ba3576ea8d2${Q}`,
  /** Plastics being processed at a recycling facility. */
  plasticsFacility: `${U}1775673301865-11860d27573c${Q}`,
  /** Recycling centre sorting line. */
  recyclingCentre: `${U}1722482445685-91a6b17d5d02${Q}`,
  /** Mixed plastic containers / bottles. */
  plasticContainers: `${U}1721622248657-55b1c5ec1dbe${Q}`,
} as const;

export type PhotoKey = keyof typeof PHOTOS;

/**
 * Per-material photo sets. The fallback picker draws from these so listings
 * without their own photo still get a distinct, fitting image instead of the
 * same one repeating down the list.
 */
export const MATERIAL_PHOTO_SETS: Record<MaterialKey, readonly string[]> = {
  plastics: [
    PHOTOS.plasticsLoose,
    PHOTOS.plasticsBaledClear,
    PHOTOS.plasticsBaledMixed,
    PHOTOS.mixedBales,
    WEB_PHOTOS.petFlakes,
    WEB_PHOTOS.plasticsFacility,
    WEB_PHOTOS.recyclingCentre,
    WEB_PHOTOS.plasticContainers,
  ],
  metals: [
    PHOTOS.metalTurnings,
    PHOTOS.metalTurningsDark,
    PHOTOS.metalParts,
    PHOTOS.metalPipes,
    PHOTOS.steelOffcuts,
    PHOTOS.steelBars,
  ],
  organic: [
    PHOTOS.coconutHusks,
    PHOTOS.briquette,
    PHOTOS.briquettesGlowing,
  ],
  textiles: [PHOTOS.textiles],
  other: [PHOTOS.landfill, PHOTOS.mixedBales],
};

/** A fitting real cover photo for each material category (first of its set). */
export const MATERIAL_PHOTO: Record<MaterialKey, string> = {
  plastics: MATERIAL_PHOTO_SETS.plastics[0],
  organic: MATERIAL_PHOTO_SETS.organic[0],
  metals: MATERIAL_PHOTO_SETS.metals[0],
  textiles: MATERIAL_PHOTO_SETS.textiles[0],
  other: MATERIAL_PHOTO_SETS.other[0],
};

/** Stable string hash so a given seed always maps to the same image. */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Picks a fitting photo for a material, deterministically keyed off a stable
 * seed (e.g. a listing id) so the same listing always shows the same image and
 * the home list reads as varied rather than repeating one picture.
 */
export function pickMaterialPhoto(material: MaterialKey, seed: string): string {
  const set = MATERIAL_PHOTO_SETS[material] ?? MATERIAL_PHOTO_SETS.other;
  if (set.length === 0) return MATERIAL_PHOTO.other;
  return set[hashSeed(seed) % set.length];
}
