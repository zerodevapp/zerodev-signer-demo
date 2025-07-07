import Link from 'next/link';

export default function Register() {
  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-xl font-bold">Register</h2>
      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-gray-700">Email</label>
          <input
            placeholder="Enter your email"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Continue
        </button>
      </form>
      <span className="text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-600 underline">
          Log in here.
        </Link>
      </span>
    </div>
  );
}
