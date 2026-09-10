import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from 'react-email'

type ResetPasswordEmailProps = {
  verificationUrl: string
}

export default function ResetPasswordEmail({ verificationUrl }: ResetPasswordEmailProps) {
  const PROJECT_NAME = process.env.PROJECT_NAME!

  return (
    <Html lang="en">
      <Head />

      <Preview>Reset your {PROJECT_NAME} password</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Reset your password</Heading>

          <Text style={styles.text}>We received a request to reset the password for your {PROJECT_NAME} account.</Text>

          <Section style={styles.buttonSection}>
            <Button href={verificationUrl} style={styles.button}>
              Reset password
            </Button>
          </Section>

          <Text style={styles.text}>This password reset link will expire after a limited time and can only be used once.</Text>

          <Hr style={styles.divider} />

          <Text style={styles.footer}>
            If you didn&apos;t request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </Text>

          <Text style={styles.footer}>
            Need help?
            <Link href="mailto:support@notifications.kalodeal.com" style={styles.link}>
              Contact {PROJECT_NAME} support
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#f7f8fb',
    color: '#0f172a',
    fontFamily: 'Arial, Helvetica, sans-serif',
    margin: 0,
    padding: '40px 16px'
  },

  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    margin: '0 auto',
    maxWidth: '560px',
    padding: '40px 32px'
  },

  heading: {
    color: '#0f172a',
    fontSize: '28px',
    fontWeight: '600',
    lineHeight: '36px',
    margin: '0 0 16px'
  },

  text: {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 24px'
  },

  buttonSection: {
    margin: '28px 0',
    textAlign: 'center' as const
  },

  button: {
    backgroundColor: '#4f46e5',
    borderRadius: '8px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '500',
    padding: '14px 24px',
    textDecoration: 'none'
  },

  divider: {
    borderColor: '#e2e8f0',
    margin: '32px 0 24px'
  },

  footer: {
    color: '#64748b',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '8px 0'
  },

  link: {
    color: '#4f46e5',
    textDecoration: 'underline'
  }
}
