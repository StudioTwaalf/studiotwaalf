import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <AdminSidebar />

      {/* Content area — offset by sidebar width */}
      <div className="flex-1 ml-56 min-h-screen bg-[#F5F4F2]">
        <main className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
