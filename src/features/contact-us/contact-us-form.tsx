'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CONTACT_US_QUESTIONS } from './schema'
import { useContactUs } from './useContactUs'

export default function ContactUsForm() {
  const t = useTranslations('ContactUs')
  const topics = CONTACT_US_QUESTIONS.map((value) => ({ value, label: t(`topics.${value}`) }))
  const { form, isSubmitting, onSubmit } = useContactUs()

  return (
    <form className="flex w-full flex-col gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="contactEmail"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t('email')}</FieldLabel>

              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="question"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t('topic')}</FieldLabel>

              <Select value={field.value} onValueChange={field.onChange} items={topics}>
                <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                  <SelectValue placeholder={t('topicPlaceholder')} />
                </SelectTrigger>

                <SelectContent>
                  {topics.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="message"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t('message')}</FieldLabel>

              <Textarea
                className="min-h-50"
                {...field}
                id={field.name}
                placeholder={t('messagePlaceholder')}
                rows={6}
                aria-invalid={fieldState.invalid}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full cursor-pointer" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('sending') : t('send')}
      </Button>
    </form>
  )
}
