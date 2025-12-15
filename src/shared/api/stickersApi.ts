import { API_BASE_URL } from './client';

export const getStickerPacks = () =>
  fetch(`${API_BASE_URL}/sticker-packs`, { credentials: 'include' })
    .then(r => r.json());

export const getPackStickers = (packId: number) =>
  fetch(`${API_BASE_URL}/sticker-packs/${packId}/stickers`, {
    credentials: 'include',
  }).then(r => r.json());
