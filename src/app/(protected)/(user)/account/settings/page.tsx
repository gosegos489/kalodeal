import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} variant="outline" render={<Link href="/account/profile" />}>
              View profile
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Sign-in and account protection.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} variant="outline" render={<Link href="/account/security" />}>
              Security settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
