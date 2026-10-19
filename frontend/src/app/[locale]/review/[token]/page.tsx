import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { ReviewForm } from "@/components/review/ReviewForm";
import { PlacePhoto } from "@/components/site/PlacePhoto";
import type { Locale } from "@/i18n/routing";
import { apiOrNull } from "@/lib/api/client";
import type { Tables } from "@/lib/api/types";
import { placeName } from "@/lib/places/present";

type Invite = Pick<
  Tables<"reviews">,
  "status" | "author_name" | "stay_date"
> & {
  date_to: string | null;
  place: {
    name_ru: string;
    name_kk: string | null;
    slug: string | null;
    photo: string | null;
  };
};

const TOKEN = /^[\w-]{32}$/;

async function getInvite(token: string) {
  if (!TOKEN.test(token)) return null;
  return apiOrNull<Invite>(`/public/reviews/${token}`);
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/review/[token]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "ReviewForm",
  });
  // Личная ссылка гостя — не для поиска и не для чужих Referer.
  return {
    title: t("title"),
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

/** «Как вам отдых?» — отзыв по личной ссылке из WhatsApp. */
export default async function ReviewPage({
  params,
}: PageProps<"/[locale]/review/[token]">) {
  const { locale, token } = await params;
  setRequestLocale(locale as Locale);
  const invite = await getInvite(token);
  if (!invite) notFound();

  const t = await getTranslations("ReviewForm");
  const name = placeName(invite.place, locale);
  const dates = new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : "ru-RU", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  });
  const fmt = (iso: string) => dates.format(new Date(`${iso}T00:00:00Z`));
  const stay =
    invite.stay_date && invite.date_to
      ? `${fmt(invite.stay_date)} – ${fmt(invite.date_to)}`
      : null;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 pt-8 pb-16 md:pt-14">
        <div className="flex items-center gap-4">
          <div className="relative size-16 flex-none overflow-hidden rounded-xl">
            <PlacePhoto
              path={invite.place.photo ?? undefined}
              alt=""
              sizes="64px"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{name}</span>
            {stay && (
              <span className="text-sm text-text-muted">
                {t("stay", { dates: stay })}
              </span>
            )}
          </div>
        </div>
        <h1 className="mt-8 font-display text-[28px] leading-[1.1] font-medium tracking-[-0.04em] md:text-[36px]">
          {t("title")}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
          {t("lead")}
        </p>
        <div className="mt-6">
          {invite.status === "invited" ? (
            <ReviewForm
              token={token}
              name={invite.author_name}
              placeSlug={invite.place.slug}
            />
          ) : (
            <div
              role="status"
              className="flex flex-col gap-2 rounded-2xl bg-status-free-bg p-5"
            >
              <span className="text-lg font-medium text-status-block-title">
                {t("usedTitle")}
              </span>
              <p className="text-[15px] text-status-block-text">
                {t("sentText")}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
