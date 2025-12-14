import emojiData from './compact.raw.json'

type EmojiEntry = {
  unicode: string;
  label: string;
  hexcode: string;
  emoticon?: string | string[] | null;
  tags?: string[] | null;
};

export function searchEmojis(query: string, emojiData: EmojiEntry[]): EmojiEntry[] {
  if (!query || typeof query !== "string") return [];

  const q = query.trim().toLowerCase();

  return emojiData.filter((emoji) => {
    const labelMatch = emoji.label?.toLowerCase().includes(q);

    const tagMatch = emoji.tags?.some(
      (tag) => tag.toLowerCase().includes(q)
    );

    const unicodeMatch =
      emoji.unicode === query || emoji.unicode.includes(query);

    const hexMatch = emoji.hexcode?.toLowerCase().includes(q);

    const emoticonMatch = (() => {
      if (!emoji.emoticon) return false;

      if (typeof emoji.emoticon === "string") {
        return emoji.emoticon.toLowerCase().includes(q);
      }

      if (Array.isArray(emoji.emoticon)) {
        return emoji.emoticon.some((e) => e.toLowerCase().includes(q));
      }

      return false;
    })();

    return labelMatch || tagMatch || unicodeMatch || hexMatch || emoticonMatch;
  });
}
