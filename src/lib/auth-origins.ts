import type { BetterAuthOptions } from 'better-auth'

type AuthEnvironment = {
  NODE_ENV?: string
  VERCEL_URL?: string
  VERCEL_BRANCH_URL?: string
}

const devPreviewHost = 'kalodeal-git-dev-gosegos489-2941s-projects.vercel.app'
const projectDeploymentHost = /^kalodeal-[a-z0-9-]+-gosegos489-2941s-projects\.vercel\.app$/

export function getAuthOriginOptions(env: AuthEnvironment): Pick<BetterAuthOptions, 'baseURL'> {
  const development = env.NODE_ENV === 'development'
  const allowedHosts = ['kalodeal.com', devPreviewHost]

  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
    if (host && projectDeploymentHost.test(host)) allowedHosts.push(host)
  }
  if (development) allowedHosts.push('localhost:3000')

  return {
    baseURL: {
      allowedHosts: [...new Set(allowedHosts)],
      fallback: development ? 'http://localhost:3000' : 'https://kalodeal.com'
    }
  }
}
