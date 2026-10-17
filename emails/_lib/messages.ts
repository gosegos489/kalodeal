import type { Locale } from '../../src/i18n/routing'

// Email-only messages: never included in next-intl's browser namespaces.
export type AuthEmailKind = 'verification' | 'reset'

export function getEmailLocale(value: unknown): Locale {
  return value === 'el' ? 'el' : 'en'
}

export function getAuthEmailMessages(value: unknown, projectName: string) {
  const messages = {
    en: {
      common: {
        buttonHelp: 'Having trouble with the button?',
        copyLink: 'Copy and paste this link into your browser:',
        needHelp: 'Need help?',
        support: `Contact ${projectName} support`
      },
      verification: {
        subject: 'Verify your KaloDeal email address',
        preview: `Verify your email address to get started with ${projectName}`,
        badge: 'EMAIL VERIFICATION',
        heading: 'Verify your email address',
        description: `You're almost there. Confirm your email address to finish creating your ${projectName} account.`,
        button: 'Verify email',
        notice: 'For your security, this verification link will only be available for a limited time.',
        security: `If you didn't create a ${projectName} account, you can safely ignore this email.`
      },
      reset: {
        subject: 'Reset your KaloDeal password',
        preview: `Reset your ${projectName} password`,
        badge: 'PASSWORD RESET',
        heading: 'Reset your password',
        description: `We received a request to reset the password for your ${projectName} account.`,
        button: 'Reset password',
        notice: 'For your security, this password reset link is only available for a limited time and can only be used once.',
        security: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged."
      }
    },
    el: {
      common: {
        buttonHelp: 'Δεν λειτουργεί το κουμπί;',
        copyLink: 'Αντιγράψτε και επικολλήστε τον παρακάτω σύνδεσμο στο πρόγραμμα περιήγησής σας:',
        needHelp: 'Χρειάζεστε βοήθεια;',
        support: `Επικοινωνήστε με την υποστήριξη του ${projectName}`
      },
      verification: {
        subject: 'Επιβεβαιώστε τη διεύθυνση email σας',
        preview: `Επιβεβαιώστε τη διεύθυνση email σας για να ξεκινήσετε στο ${projectName}`,
        badge: 'ΕΠΙΒΕΒΑΙΩΣΗ EMAIL',
        heading: 'Επιβεβαιώστε τη διεύθυνση email σας',
        description: `Ένα ακόμη βήμα! Επιβεβαιώστε τη διεύθυνση email σας για να ολοκληρώσετε τη δημιουργία του λογαριασμού σας στο ${projectName}.`,
        button: 'Επιβεβαίωση email',
        notice: 'Για την ασφάλειά σας, ο σύνδεσμος επιβεβαίωσης ισχύει μόνο για περιορισμένο χρονικό διάστημα.',
        security: `Αν δεν δημιουργήσατε λογαριασμό στο ${projectName}, μπορείτε να αγνοήσετε αυτό το email.`
      },
      reset: {
        subject: 'Επαναφορά κωδικού πρόσβασης',
        preview: `Επαναφορά του κωδικού πρόσβασής σας στο ${projectName}`,
        badge: 'ΕΠΑΝΑΦΟΡΑ ΚΩΔΙΚΟΥ',
        heading: 'Επαναφορά κωδικού πρόσβασης',
        description: `Λάβαμε αίτημα επαναφοράς του κωδικού πρόσβασης για τον λογαριασμό σας στο ${projectName}.`,
        button: 'Επαναφορά κωδικού',
        notice: 'Για την ασφάλειά σας, ο σύνδεσμος επαναφοράς ισχύει μόνο για περιορισμένο χρονικό διάστημα και μπορεί να χρησιμοποιηθεί μία φορά.',
        security: 'Αν δεν ζητήσατε επαναφορά κωδικού, μπορείτε να αγνοήσετε αυτό το email. Ο κωδικός πρόσβασής σας θα παραμείνει ο ίδιος.'
      }
    }
  }
  return messages[getEmailLocale(value)]
}
