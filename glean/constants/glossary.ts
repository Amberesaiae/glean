import type { MaterialKey } from "@/constants/colors";
import { PHOTOS, WEB_PHOTOS } from "@/constants/photos";

/**
 * Plain-language glossary of the materials and trade terms used across Glean.
 * Each entry pairs a real photo with a short, jargon-free definition so members
 * new to the recycling trade can quickly learn what PET, HDPE, bales, offcuts,
 * turnings and the rest actually are.
 */
export interface GlossaryTerm {
  id: string;
  term: string;
  /** Short tag shown on the card, e.g. a resin code or a one-word category. */
  tag?: string;
  material: MaterialKey;
  /** One-line summary shown on the card. */
  short: string;
  /** Full explanation shown in the detail sheet. */
  body: string;
  image: string;
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    id: "pet",
    term: "PET bottles",
    tag: "♳ PET / 1",
    material: "plastics",
    short: "Clear plastic drink bottles — the most recycled plastic.",
    body: "PET (polyethylene terephthalate, resin code 1) is the clear, lightweight plastic used for water and soft-drink bottles. It's the most valuable and widely recycled plastic: clean, sorted PET is baled, shredded into flake, washed and turned back into new bottles or polyester fibre. Keep caps and labels separate where buyers ask for it, and keep clear PET away from coloured plastic to fetch a better price.",
    image: PHOTOS.petBottlesClear,
  },
  {
    id: "hdpe",
    term: "HDPE",
    tag: "♴ HDPE / 2",
    material: "plastics",
    short: "Tough plastic from milk jugs, detergent & jerry cans.",
    body: "HDPE (high-density polyethylene, resin code 2) is the stiff, opaque plastic used for milk and juice jugs, detergent bottles, shampoo containers and jerry cans. It's strong and chemical-resistant, so recyclers prize it for making pipes, crates, buckets and new bottles. Natural (uncoloured) HDPE is worth more than mixed colours, so sort it where you can. It's often confused with LDPE (resin code 4) — the softer, flexible plastic used for bags and film.",
    image: PHOTOS.ldpeHdpe,
  },
  {
    id: "bale",
    term: "Bale",
    tag: "Form",
    material: "plastics",
    short: "Loose material pressed and strapped into a dense block.",
    body: "A bale is loose material — bottles, cardboard, plastic film or cans — compressed by a baling machine and strapped into a tight, stackable block. Baling slashes the volume so material is cheaper to store and transport, and buyers trade in bale weight. A clean, single-material bale (for example clear PET only) is worth far more than a mixed one.",
    image: PHOTOS.plasticsBaledClear,
  },
  {
    id: "flake",
    term: "Flake",
    tag: "Form",
    material: "plastics",
    short: "Washed plastic shredded into small chips ready to remelt.",
    body: "Flake is plastic that's been sorted, washed and shredded into small chips — the step between a bale of bottles and new plastic products. Clean, single-colour flake (especially clear PET) is a ready-to-use feedstock that processors melt down into pellets or spin into fibre, so it sells at a premium over unwashed material.",
    image: PHOTOS.plasticFlakesMixed,
  },
  {
    id: "turnings",
    term: "Turnings",
    tag: "Swarf",
    material: "metals",
    short: "Curly metal shavings cut off during machining.",
    body: "Turnings (also called swarf) are the curled metal shavings produced when steel, aluminium or brass is cut on a lathe or milling machine. They're sold by metal type and by how clean and dry they are — turnings soaked in cutting oil or mixed with other metals are downgraded. Workshops accumulate them fast, making them a steady recurring supply.",
    image: PHOTOS.metalTurnings,
  },
  {
    id: "offcuts",
    term: "Offcuts",
    tag: "Scrap",
    material: "metals",
    short: "Leftover end-pieces trimmed off when cutting to size.",
    body: "Offcuts are the leftover end-pieces trimmed away when sheet, bar or pipe is cut down to size — common in metal fabrication, carpentry and textiles. They're clean, single-material and predictable, which makes them easy to reuse or resell. Steel and aluminium offcuts go to foundries and fabricators; fabric offcuts go to makers of bags, patchwork and insulation.",
    image: PHOTOS.steelOffcuts,
  },
  {
    id: "scrap-metal",
    term: "Scrap metal",
    tag: "Metals",
    material: "metals",
    short: "Discarded metal parts and pieces sold for melting down.",
    body: "Scrap metal is any discarded metal — old machine parts, pulleys, pipes, bars and household items — collected to be melted and recast. It's split into ferrous (iron and steel, magnetic) and non-ferrous (aluminium, copper, brass, which are lighter and worth more). Sorting by type and removing non-metal attachments lifts the price you'll get.",
    image: PHOTOS.metalParts,
  },
  {
    id: "textile-offcuts",
    term: "Textile offcuts",
    tag: "Textiles",
    material: "textiles",
    short: "Fabric scraps left over from cutting and sewing.",
    body: "Textile offcuts are the fabric scraps left over when garments are cut and sewn — a major output of tailoring and garment workshops. Instead of going to landfill, they're reused for patchwork, quilting, bag-making, cleaning rags and stuffing, or shredded back into fibre. Sorting by fabric type and colour makes them far more useful to makers.",
    image: PHOTOS.textiles,
  },
  {
    id: "feedstock",
    term: "Feedstock",
    tag: "Organic",
    material: "organic",
    short: "Raw input material a process turns into something new.",
    body: "Feedstock is the raw input a process consumes to make a product — for recyclers it's the material going into the machine. Coconut husks, sawdust, crop residue and food waste are common organic feedstocks: dried, compressed and carbonised, they become briquettes, compost or biochar. Reliable, clean feedstock is the foundation of any circular business.",
    image: PHOTOS.coconutVendors,
  },
  {
    id: "briquette",
    term: "Briquette",
    tag: "Fuel",
    material: "organic",
    short: "Compressed waste shaped into a clean-burning fuel block.",
    body: "A briquette is organic waste — charcoal dust, sawdust, coconut husk or crop residue — compressed into a dense block that burns longer and cleaner than loose charcoal or firewood. Briquetting turns a disposal problem into an affordable cooking fuel and a sellable product, cutting both waste and pressure on forests.",
    image: PHOTOS.briquette,
  },
  {
    id: "landfill",
    term: "Landfill",
    tag: "Disposal",
    material: "other",
    short: "Where unsorted waste ends up — what Glean helps avoid.",
    body: "A landfill or dumpsite is where mixed, unsorted waste is buried or piled. It's the costly, polluting endpoint Glean exists to avoid: every bale, batch of flake or pile of offcuts traded here is material diverted from a dump and kept in the economy. Diversion rate — how much you keep out of landfill — is the core measure of impact.",
    image: PHOTOS.landfill,
  },
] as const;
