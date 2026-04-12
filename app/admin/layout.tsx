import Link from 'next/link'

const NAV_LINKS = [
  { href: '/admin/hunt',        label: 'Hunt'        },
  { href: '/admin/teams',       label: 'Teams'       },
  { href: '/admin/queue',       label: 'Queue'       },
  { href: '/admin/leaderboard', label: 'Leaderboard' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray-900 text-white px-4 py-3 flex gap-6 text-sm">
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="hover:text-gray-300 transition-colors">
            {label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
