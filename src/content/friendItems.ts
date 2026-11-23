/** One of the friend's items, waiting on the far side of a chasm. */
export interface FriendItem {
  /** What the feedback calls it, so it reads well after "your friend's". */
  name: string;
  /** Its picture's name in view/assets. */
  image: string;
}

/** One level's items, which share a theme so the trail feels different on each level. */
export interface LevelItems {
  theme: string;
  /** One item per chasm, in the order the chasms come in `levels`. */
  items: FriendItem[];
}

/**
 * The trail of markers the friend left, Level 1 first. Each chasm shows its own item, and no
 * two chasms share one, so a player can tell how far along the trail they are. #204 can show
 * them all again when the player finds their friend.
 */
export const friendItems: LevelItems[] = [
  {
    theme: 'candy',
    items: [
      { name: 'peppermint swirl', image: 'itemPeppermintSwirl' },
      { name: 'lollipop', image: 'itemLollipop' },
      { name: 'candy cane', image: 'itemCandyCane' },
    ],
  },
  {
    theme: 'foreign coins',
    items: [
      { name: 'Japanese 5-yen coin', image: 'item5YenCoin' },
      { name: 'Chinese cash coin', image: 'itemCashCoin' },
      { name: 'British 50p coin', image: 'item50pCoin' },
    ],
  },
  {
    theme: 'jewelry',
    items: [
      { name: 'silver ring', image: 'itemSilverRing' },
      { name: 'pearl necklace', image: 'itemPearlNecklace' },
      { name: 'heart locket', image: 'itemHeartLocket' },
    ],
  },
];
