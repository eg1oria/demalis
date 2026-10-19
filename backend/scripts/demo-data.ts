/** Публичные видео про отдых под Алматы — для тестовых объектов (seed и demo). */
export const DEMO_VIDEOS: Record<string, string> = {
  // YouTube Shorts — вертикальное
  'test-glemping-gornyy-vozdukh': 'https://www.youtube.com/shorts/6LXrqTEfWec',
  // Instagram Reels
  'test-a-frame-u-reki': 'https://www.instagram.com/reel/DeYTr5GoiJA/',
  // TikTok
  'test-dom-s-baney-turgen':
    'https://www.tiktok.com/@glamping_kaz/video/7124163804518206726',
  // Обычное видео YouTube — 16:9
  'test-shale-v-gorakh': 'https://www.youtube.com/watch?v=NmD2aNK7vE0',
};

/** Отзывы гостей с подтверждённой заявкой (тексты придуманы для проверки сайта). */
export const DEMO_REVIEWS: {
  slug: string;
  name: string;
  /** Заезд — столько дней назад, две ночи. */
  daysAgo: number;
  rating: number;
  text: string;
}[] = [
  {
    slug: 'test-glemping-gornyy-vozdukh',
    name: 'Айгерим Сапарова',
    daysAgo: 12,
    rating: 5,
    text: 'Отдыхали вдвоём на выходных. Купол тёплый, чан натопили к нашему приезду, вид на горы с кровати. Хозяева на связи, всё как на фото.',
  },
  {
    slug: 'test-glemping-gornyy-vozdukh',
    name: 'Ержан',
    daysAgo: 30,
    rating: 4,
    text: 'Место классное, тихо и чисто. Минус один — последний километр дороги без асфальта, на седане ехали медленно.',
  },
  {
    slug: 'test-a-frame-u-reki',
    name: 'Дана Ким',
    daysAgo: 20,
    rating: 5,
    text: 'Домик прямо у реки, ночью слышно только воду. Кухня есть всё необходимое, мангал и дрова дали. Приедем ещё зимой.',
  },
  {
    slug: 'test-dom-s-baney-turgen',
    name: 'Руслан Ахметов',
    daysAgo: 9,
    rating: 4,
    text: 'Были компанией из восьми человек. Баня отличная, дом просторный. Wi-Fi слабый, но мы и не за этим ехали.',
  },
];

/** Подтверждённая заявка без отзыва — для проверки формы гостя по ссылке. */
export const DEMO_INVITE = {
  slug: 'test-a-frame-u-reki',
  name: 'Асель Нурланова',
  daysAgo: 5,
};
