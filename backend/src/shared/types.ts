// Копия frontend/src/lib/api/types.ts — менять вместе.
// Строки таблиц в том виде, в каком их отдаёт API бэкенда (backend/prisma/schema.prisma).
// Даты без времени — "YYYY-MM-DD", моменты времени — ISO-строки.

export type DbEnums = {
  availability_status: 'free' | 'limited' | 'full';
  event_type: 'view' | 'whatsapp_click' | 'phone_click' | 'instagram_click';
  lead_status:
    'new' | 'sent_to_owner' | 'confirmed' | 'cancelled' | 'no_answer';
  payment_kind: 'pro' | 'promotion' | 'video' | 'leads' | 'other';
  place_direction:
    | 'gory_almaty'
    | 'talgar'
    | 'issyk_turgen'
    | 'kaskelen'
    | 'kapshagay'
    | 'charyn_kolsai'
    | 'drugoe';
  place_plan: 'free' | 'pro';
  place_status: 'draft' | 'published' | 'hidden';
  place_type:
    | 'glamping'
    | 'aframe'
    | 'house'
    | 'zona_otdyha'
    | 'banya_complex'
    | 'guesthouse';
  price_unit: 'per_night_unit' | 'per_person';
};

export type Enums<T extends keyof DbEnums> = DbEnums[T];

export type DbTables = {
  availability: {
    date: string;
    place_id: string;
    status: Enums<'availability_status'>;
    updated_at: string;
  };
  collections: {
    created_at: string;
    filters: string;
    id: string;
    intro_kk: string | null;
    intro_ru: string | null;
    published: boolean;
    slug: string;
    sort_order: number;
    title_kk: string | null;
    title_ru: string;
    updated_at: string;
  };
  events: {
    created_at: string;
    id: number;
    place_id: string;
    type: Enums<'event_type'>;
  };
  leads: {
    billable: boolean;
    comment: string | null;
    created_at: string;
    date_from: string | null;
    date_to: string | null;
    guests: number | null;
    id: string;
    name: string;
    phone: string;
    place_id: string;
    status: Enums<'lead_status'>;
  };
  owners: {
    created_at: string;
    id: string;
    language: string | null;
    last_report_month: string | null;
    link_code: string | null;
    name: string;
    phone: string | null;
    telegram_chat_id: number | null;
  };
  payments: {
    amount: number;
    comment: string | null;
    created_at: string;
    id: string;
    kind: Enums<'payment_kind'>;
    paid_at: string;
    place_id: string;
  };
  places: {
    address_text: string | null;
    capacity_max: number | null;
    created_at: string;
    description_kk: string | null;
    description_ru: string | null;
    direction: Enums<'place_direction'>;
    drive_minutes: number | null;
    featured_until: string | null;
    has_banya: boolean;
    has_bbq: boolean;
    has_chan: boolean;
    has_kitchen: boolean;
    has_pool: boolean;
    has_wifi: boolean;
    id: string;
    instagram_url: string | null;
    lat: number | null;
    lng: number | null;
    name_kk: string | null;
    name_ru: string;
    owner_id: string | null;
    pets_allowed: boolean;
    photos: string[];
    photos_permission: boolean;
    plan: Enums<'place_plan'>;
    price_from: number | null;
    price_unit: Enums<'price_unit'>;
    pro_reminded_for: string | null;
    pro_until: string | null;
    slug: string;
    status: Enums<'place_status'>;
    type: Enums<'place_type'>;
    updated_at: string;
    video_url: string | null;
    whatsapp_phone: string;
    winter_ok: boolean;
  };
};

export type Tables<T extends keyof DbTables> = DbTables[T];
