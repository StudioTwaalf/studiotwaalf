import { loginAction } from './actions'

interface Props {
  searchParams: { error?: string; from?: string }
}

export default function AdminLoginPage({ searchParams }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Studio Twaalf — Enter your password</p>
          </div>

          {searchParams.error === 'invalid' && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              Incorrect password. Please try again.
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-lg
                         hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                         focus:ring-offset-2 transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
