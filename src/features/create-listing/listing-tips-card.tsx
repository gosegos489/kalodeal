import { Camera, Check, Lightbulb, ShieldCheck } from 'lucide-react'

export function ListingTipsCard() {
  return (
    <section className="bg-primary/5 border-primary/10 flex flex-col gap-4 rounded-2xl border p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Lightbulb className="text-primary size-4" /> A little detail goes a long way
      </h2>
      <ul className="text-muted-foreground flex flex-col gap-4 text-sm leading-relaxed">
        <li className="flex items-start gap-3">
          <Camera className="text-primary size-4 shrink-0" />
          <span>Use natural light and show your item from a few different angles.</span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="text-primary size-4 shrink-0" />
          <span>Include the brand, condition and any signs of wear.</span>
        </li>
        <li className="flex items-start gap-3">
          <ShieldCheck className="text-primary size-4 shrink-0" />
          <span>Keep personal details out of your photos and description.</span>
        </li>
      </ul>
    </section>
  )
}
