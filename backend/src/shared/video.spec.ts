import { describe, expect, it } from '@jest/globals';
import { parseVideo } from './video';

describe('parseVideo', () => {
  it('YouTube: обычные ссылки и Shorts', () => {
    expect(
      parseVideo('https://www.youtube.com/watch?v=abcDEF12345&t=3'),
    ).toMatchObject({
      provider: 'youtube',
      id: 'abcDEF12345',
      vertical: false,
      embedUrl:
        'https://www.youtube-nocookie.com/embed/abcDEF12345?autoplay=1&rel=0&playsinline=1',
      poster: 'https://i.ytimg.com/vi/abcDEF12345/hqdefault.jpg',
    });
    expect(parseVideo('https://youtu.be/abcDEF12345?si=x')?.id).toBe(
      'abcDEF12345',
    );
    expect(
      parseVideo('https://m.youtube.com/shorts/abcDEF12345'),
    ).toMatchObject({
      id: 'abcDEF12345',
      vertical: true,
    });
    expect(parseVideo('https://www.youtube.com/channel/UC123')).toBeNull();
    expect(parseVideo('https://youtu.be/short')).toBeNull();
  });

  it('Instagram: Reels и посты', () => {
    expect(
      parseVideo('https://www.instagram.com/reel/C1a2B3c4D5e/?igsh=x'),
    ).toMatchObject({
      provider: 'instagram',
      embedUrl: 'https://www.instagram.com/reel/C1a2B3c4D5e/embed/',
      vertical: true,
      poster: null,
    });
    expect(
      parseVideo('https://instagram.com/reels/C1a2B3c4D5e')?.embedUrl,
    ).toBe('https://www.instagram.com/reel/C1a2B3c4D5e/embed/');
    expect(
      parseVideo('https://www.instagram.com/p/C1a2B3c4D5e/')?.embedUrl,
    ).toBe('https://www.instagram.com/p/C1a2B3c4D5e/embed/');
    expect(
      parseVideo('https://www.instagram.com/dom.u.reki/reel/C1a2B3c4D5e/')
        ?.embedUrl,
    ).toBe('https://www.instagram.com/reel/C1a2B3c4D5e/embed/');
    expect(parseVideo('https://www.instagram.com/dom.u.reki/')).toBeNull();
  });

  it('TikTok: полная ссылка, короткая не разбирается', () => {
    expect(
      parseVideo(
        'https://www.tiktok.com/@glamping.kz/video/7301234567890123456?lang=ru',
      ),
    ).toMatchObject({
      provider: 'tiktok',
      id: '7301234567890123456',
      embedUrl:
        'https://www.tiktok.com/player/v1/7301234567890123456?autoplay=1&rel=0',
      vertical: true,
    });
    expect(parseVideo('https://vm.tiktok.com/ZMabc123/')).toBeNull();
  });

  it('мусор и чужие сайты — null', () => {
    expect(parseVideo('youtube')).toBeNull();
    expect(parseVideo('')).toBeNull();
    expect(parseVideo(null)).toBeNull();
    expect(parseVideo('javascript:alert(1)')).toBeNull();
    expect(parseVideo('https://vimeo.com/123456')).toBeNull();
  });
});
