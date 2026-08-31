export default function ResetPasswordSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="bg-muted h-4 w-20 animate-pulse rounded" />
          <div className="bg-muted h-9 w-full animate-pulse rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-muted h-4 w-36 animate-pulse rounded" />
          <div className="bg-muted h-9 w-full animate-pulse rounded-md" />
        </div>
      </div>
      <div className="bg-muted h-9 w-full max-w-50 animate-pulse rounded-md" />
    </div>
  )
}
