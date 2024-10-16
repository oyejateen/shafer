import { nanoid } from 'nanoid';

const shortUrls = new Map<string, string>();

export const shortenUrl = (fileId: string): string => {
  const shortId = nanoid(8);
  const shortUrl = `${window.location.origin}/s/${shortId}`;
  shortUrls.set(shortId, fileId);
  return shortUrl;
};

export const expandUrl = (shortId: string): string | undefined => {
  return shortUrls.get(shortId);
};