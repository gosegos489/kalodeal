import { ContactUsForm } from '@/features/contact-us'

export default function ContactUsPage() {
  return (
    <section className="container flex items-center py-12 lg:py-20">
      <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">Contact us</p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">How can we help?</h1>

            <h2 className="text-muted-foreground text-lg leading-8">
              Have a question about KaloDeal? Send us a message and our team will get back to you as soon as possible.
            </h2>
          </div>
        </div>

        <div className="bg-card mx-auto flex w-full flex-col gap-6 rounded-xl border p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-semibold">Send us a message</p>

            <p className="text-muted-foreground text-sm">Fill out the form below and we&apos;ll be happy to help.</p>
          </div>

          <ContactUsForm />
        </div>
      </div>
    </section>
  )
}
