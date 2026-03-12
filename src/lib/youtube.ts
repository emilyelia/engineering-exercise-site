/**
 * YouTube Data API v3 — fetches all public uploads from the channel.
 * Called at build time by Astro; results are cached in module memory for the
 * duration of a single build so the API is only hit once per build.
 *
 * Required env var: YOUTUBE_API_KEY
 * Set it in Netlify → Site Settings → Environment Variables (never commit it).
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Config — update CHANNEL_HANDLE if you rename your channel
// ---------------------------------------------------------------------------
const CHANNEL_HANDLE = 'EngineeringExercise'; // without the @
const API_KEY = import.meta.env.YOUTUBE_API_KEY as string | undefined;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// Module-level cache so getChannelVideos() is only fetched once per build
let _cache: YouTubeVideo[] | null = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getUploadsPlaylistId(): Promise<string> {
  const url = new URL(`${YT_BASE}/channels`);
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('forHandle', CHANNEL_HANDLE);
  url.searchParams.set('key', API_KEY!);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube Channels API error: ${res.status} ${res.statusText}`);

  const data = await res.json() as {
    items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[]
  };

  if (!data.items?.length) {
    throw new Error(`Channel "@${CHANNEL_HANDLE}" not found. Check the handle and that your API key has access.`);
  }
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function fetchAllPlaylistItems(playlistId: string): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${YT_BASE}/playlistItems`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', API_KEY!);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`YouTube PlaylistItems API error: ${res.status} ${res.statusText}`);

    const data = await res.json() as {
      items?: {
        snippet: {
          title: string;
          description: string;
          publishedAt: string;
          resourceId: { videoId: string };
          thumbnails?: {
            maxres?: { url: string };
            high?: { url: string };
            medium?: { url: string };
            default?: { url: string };
          };
        }
      }[];
      nextPageToken?: string;
    };

    for (const item of data.items ?? []) {
      const s = item.snippet;
      // Skip private/deleted videos
      if (s.title === 'Private video' || s.title === 'Deleted video') continue;

      const thumbs = s.thumbnails ?? {};
      const thumbnail =
        thumbs.maxres?.url ??
        thumbs.high?.url ??
        thumbs.medium?.url ??
        thumbs.default?.url ??
        `https://img.youtube.com/vi/${s.resourceId.videoId}/hqdefault.jpg`;

      videos.push({
        id: s.resourceId.videoId,
        title: s.title,
        description: s.description ?? '',
        thumbnail,
        publishedAt: s.publishedAt,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return videos;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all public videos from the channel, newest first.
 * Returns [] if YOUTUBE_API_KEY is not set (so the site still builds locally).
 */
export async function getChannelVideos(): Promise<YouTubeVideo[]> {
  if (_cache) return _cache;

  if (!API_KEY) {
    console.warn(
      '\n[YouTube] ⚠  YOUTUBE_API_KEY is not set.\n' +
      '           Video pages will not be generated during this build.\n' +
      '           Add the key in Netlify → Site Settings → Environment Variables.\n'
    );
    return [];
  }

  try {
    const uploadsPlaylistId = await getUploadsPlaylistId();
    const videos = await fetchAllPlaylistItems(uploadsPlaylistId);

    _cache = videos.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    console.log(`[YouTube] Fetched ${_cache.length} videos from @${CHANNEL_HANDLE}`);
    return _cache;
  } catch (err) {
    console.error('[YouTube] Failed to fetch videos:', err);
    return [];
  }
}

/** Convenience: get a single video by ID without an extra API round-trip. */
export async function getVideoById(id: string): Promise<YouTubeVideo | null> {
  const videos = await getChannelVideos();
  return videos.find(v => v.id === id) ?? null;
}
