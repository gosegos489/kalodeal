import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from 'react-email'

type ResetPasswordEmailProps = {
  verificationUrl: string
}

export default function ResetPasswordEmail({ verificationUrl }: ResetPasswordEmailProps) {
  const PROJECT_NAME = process.env.PROJECT_NAME ?? 'Kalodeal'

  return (
    <Html lang="en">
      <Head />

      <Preview>Reset your {PROJECT_NAME} password</Preview>

      <Body style={styles.body}>
        <Container style={styles.wrapper}>
          <Section style={styles.brandSection}>
            <Text style={styles.logo}>{PROJECT_NAME}</Text>
          </Section>

          <Section style={styles.card}>
            <Section style={styles.accentBar} />

            <Section style={styles.content}>
              <Text style={styles.badge}>PASSWORD RESET</Text>

              <Heading style={styles.heading}>Reset your password</Heading>

              <Text style={styles.text}>We received a request to reset the password for your {PROJECT_NAME} account.</Text>

              <Section style={styles.buttonSection}>
                <Button href={verificationUrl} style={styles.button}>
                  Reset password
                </Button>
              </Section>

              <Section style={styles.notice}>
                <Text style={styles.noticeText}>
                  For your security, this password reset link is only available for a limited time and can only be used once.
                </Text>
              </Section>

              <Hr style={styles.divider} />

              <Text style={styles.secondaryText}>Having trouble with the button?</Text>

              <Text style={styles.urlText}>
                Copy and paste this link into your browser:
                <br />
                <Link href={verificationUrl} style={styles.verificationLink}>
                  {verificationUrl}
                </Link>
              </Text>
            </Section>
          </Section>

          <Section style={styles.footerSection}>
            <Text style={styles.footer}>
              If you didn&apos;t request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </Text>

            <Text style={styles.footer}>
              Need help?{' '}
              <Link href="https://kalodeal.com/contact-us" style={styles.footerLink}>
                Contact {PROJECT_NAME} support
              </Link>
            </Text>

            <Text style={styles.copyright}>
              © {new Date().getFullYear()} {PROJECT_NAME}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#f8fafc',
    color: '#0a0a0a',
    fontFamily: 'Arial, Helvetica, sans-serif',
    margin: 0,
    padding: '48px 16px'
  },

  wrapper: {
    margin: '0 auto',
    maxWidth: '560px'
  },

  brandSection: {
    padding: '0 4px 20px'
  },

  logo: {
    color: '#0a0a0a',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    lineHeight: '28px',
    margin: 0
  },

  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e3e5e8',
    borderRadius: '16px',
    overflow: 'hidden'
  },

  accentBar: {
    backgroundColor: '#2663eb',
    height: '5px',
    width: '100%'
  },

  content: {
    padding: '36px 36px 32px'
  },

  badge: {
    backgroundColor: '#a2e636',
    borderRadius: '999px',
    color: '#171717',
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.7px',
    lineHeight: '16px',
    margin: '0 0 20px',
    padding: '6px 10px'
  },

  heading: {
    color: '#0a0a0a',
    fontSize: '30px',
    fontWeight: '700',
    letterSpacing: '-0.8px',
    lineHeight: '38px',
    margin: '0 0 16px'
  },

  text: {
    color: '#525252',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 28px'
  },

  buttonSection: {
    margin: '0 0 28px'
  },

  button: {
    backgroundColor: '#2663eb',
    borderRadius: '10px',
    color: '#fafafa',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '600',
    lineHeight: '20px',
    padding: '14px 24px',
    textDecoration: 'none'
  },

  notice: {
    backgroundColor: '#f7fde9',
    borderLeft: '3px solid #a2e636',
    borderRadius: '8px',
    padding: '14px 16px'
  },

  noticeText: {
    color: '#525252',
    fontSize: '13px',
    lineHeight: '20px',
    margin: 0
  },

  divider: {
    borderColor: '#e3e5e8',
    margin: '32px 0 24px'
  },

  secondaryText: {
    color: '#737373',
    fontSize: '13px',
    fontWeight: '600',
    lineHeight: '20px',
    margin: '0 0 6px'
  },

  urlText: {
    color: '#737373',
    fontSize: '12px',
    lineHeight: '19px',
    margin: 0
  },

  verificationLink: {
    color: '#2663eb',
    textDecoration: 'underline',
    wordBreak: 'break-all' as const
  },

  footerSection: {
    padding: '24px 16px 0',
    textAlign: 'center' as const
  },

  footer: {
    color: '#737373',
    fontSize: '12px',
    lineHeight: '19px',
    margin: '0 0 8px'
  },

  footerLink: {
    color: '#2663eb'
  },

  copyright: {
    color: '#a3a3a3',
    fontSize: '11px',
    lineHeight: '18px',
    margin: '16px 0 0'
  }
}
