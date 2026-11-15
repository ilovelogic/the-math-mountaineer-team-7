import type { Shop } from './levels';

/** What a shop says when the player walks up to it, and the words on its two buttons. */
export interface ShopOffer {
  text: string;
  accept: string;
  decline: string;
}

// The offer screen shows accept first, as the teal button on the left, and decline second,
// so these are the positions an offer's choice reports.
export const ACCEPT = 0;
export const DECLINE = 1;

/** Each shop's offer, worded as in the "Supply shop offer" and "Clothing shop offer" mockups. */
export const shopOffers: Record<Shop, ShopOffer> = {
  supplies: {
    text: 'Do you want to check if you can buy mountaineering supplies that would let you take a big shortcut?',
    accept: 'Yes, that would be great',
    decline: 'No thanks',
  },
  clothing: {
    text: 'Would you like to buy some fashionable outdoors clothes? They will increase your points.',
    accept: 'Yes, I would love to!',
    decline: 'No, I’ll keep going',
  },
};
// Optional documentation
// - import type { Shop }: imports only the type, which TypeScript uses for checking and then removes, so nothing from levels.ts is loaded at runtime.
// - Record<Shop, ShopOffer>: an object with exactly one ShopOffer for each shop name, so leaving a shop out or misspelling one doesn't compile.
