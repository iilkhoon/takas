import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Emoji } from '@/components/ui';

export default function NotFound() {
  const t = useTranslations('pages');
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <div className="relative">
        <span className="font-display text-[9rem] font-black leading-none text-ink/[.06]">404</span>
        <Emoji name="magnifying_glass_tilted_left" size={110} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" />
      </div>
      <h1 className="mt-4 font-display text-3xl font-black">{t('notFoundTitle')}</h1>
      <p className="mt-2 max-w-md text-ink-soft">{t('notFoundSub')}</p>
      <Link href="/" className="btn btn-primary mt-8">{t('goHome')}</Link>
    </div>
  );
}
