import { getTranslations } from 'next-intl/server';
import { Emoji } from './ui';

export async function TextPage({ titleKey, bodyKey, emoji, children }: { titleKey: string; bodyKey: string; emoji: string; children?: React.ReactNode }) {
  const t = await getTranslations('pages');
  const paragraphs = t(bodyKey).split('\n').filter(Boolean);
  return (
    <div className="container max-w-3xl py-10 md:py-16">
      <Emoji name={emoji} size={72} />
      <h1 className="mt-4 font-display text-3xl font-black sm:text-4xl">{t(titleKey)}</h1>
      <div className="card mt-8 space-y-4 p-6 text-[17px] leading-relaxed text-ink-soft sm:p-10">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {children}
    </div>
  );
}
