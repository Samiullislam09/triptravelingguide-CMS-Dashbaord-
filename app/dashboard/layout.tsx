import Sidebar from "@/components/Sidebar";

// Shared shell for every /dashboard/* route: glass sidebar + scrollable main.
// Individual pages render only their own content (no Sidebar import needed).
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
