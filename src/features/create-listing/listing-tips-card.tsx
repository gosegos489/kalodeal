import { Camera, Check, Lightbulb, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function ListingTipsCard() {
  const t = useTranslations('Workspace')

  return (
    <section className="bg-primary/5 border-primary/10 flex flex-col gap-4 rounded-2xl border p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Lightbulb className="text-primary size-4" /> {t('aLittleDetailGoesALongWay')}
      </h2>
      <ul className="text-muted-foreground flex flex-col gap-4 text-sm leading-relaxed">
        <li className="flex items-start gap-3">
          <Camera className="text-primary size-4 shrink-0" />
          <span>{t('useNaturalLightAndShowYourItemFromAFewDifferentAngles')}</span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="text-primary size-4 shrink-0" />
          <span>{t('includeTheBrandConditionAndAnySignsOfWear')}</span>
        </li>
        <li className="flex items-start gap-3">
          <ShieldCheck className="text-primary size-4 shrink-0" />
          <span>{t('keepPersonalDetailsOutOfYourPhotosAndDescription')}</span>
        </li>
      </ul>
    </section>
  )
}
