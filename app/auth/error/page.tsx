import Link from "next/link"

export default function AuthError({
  searchParams: _searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center mb-8">
          <div className="error-icon-container">
            <svg className="icon-xl text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Only Bogner Pools employees with @bognerpools.com email addresses can access this resource site.
          </p>
          <div className="alert-error mb-6">
            <p className="alert-error-text">
              Please sign in with your company Google account.
            </p>
          </div>
          <Link
            href="/auth/signin"
            className="btn btn-primary btn-lg w-full"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}
