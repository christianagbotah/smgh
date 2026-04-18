import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <h1 className="text-[150px] md:text-[180px] font-black text-gray-200 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-smgh-green to-emerald-500 flex items-center justify-center shadow-xl shadow-smgh-green/20 rotate-6">
              <span className="text-white text-4xl font-bold">SMGH</span>
            </div>
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Sorry, the page you are looking for does not exist or has been moved. Let us take you back home.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-smgh-green hover:bg-smgh-green-dark text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg shadow-smgh-green/20 hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 hover:border-smgh-green hover:text-smgh-green px-8 py-3 rounded-full font-semibold transition-all"
          >
            View Events
          </Link>
        </div>
      </div>
    </div>
  )
}
