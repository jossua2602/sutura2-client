import { Playfair_Display, Inter } from "next/font/google";
import Link from "next/link";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-[#F6F1ED] flex ${inter.className}`}>
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#FFFFFF] border-r border-[#D8CDC5] flex flex-col shadow-sm">
      {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-[#D8CDC5]">
          <div className="flex items-center gap-2">
            {/* Scissors Icon */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-6 h-6 text-[#4A3F3A] transform -rotate-90"
            >
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
            
            {/* SUTURA Text */}
            <h1 className={`${playfair.className} text-2xl font-bold text-[#4A3F3A] tracking-widest uppercase mt-1`}>
              Sutura
            </h1>
          </div>
        </div>

       {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 mt-4">
          
          {/* Dashboard */}
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-[#A88A7B]/10 text-[#4A3F3A] rounded-xl font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </Link>

          {/* Manage Registrations */}
          <Link href="/dashboard/registrations" className="flex items-center gap-3 px-4 py-3 text-[#8A7F78] hover:bg-[#F6F1ED] hover:text-[#4A3F3A] rounded-xl font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Registrations
          </Link>

          {/* Monitor Subscriptions */}
          <Link href="/dashboard/subscriptions" className="flex items-center gap-3 px-4 py-3 text-[#8A7F78] hover:bg-[#F6F1ED] hover:text-[#4A3F3A] rounded-xl font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            Subscriptions
          </Link>

          {/* Manage Accounts */}
          <Link href="/dashboard/accounts" className="flex items-center gap-3 px-4 py-3 text-[#8A7F78] hover:bg-[#F6F1ED] hover:text-[#4A3F3A] rounded-xl font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Accounts
          </Link>

        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#D8CDC5]">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-[#8A7F78] hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        
        {/* Top Header */}
        <header className="h-20 bg-[#FFFFFF] border-b border-[#D8CDC5] flex items-center justify-between px-10 shadow-sm">
          <h2 className="text-xl font-medium text-[#4A3F3A]">Overview</h2>
          
      {/* User Profile & Notifications */}
          <div className="flex items-center gap-6">
            
        

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button className="w-10 h-10 rounded-full bg-[#F6F1ED] flex items-center justify-center text-[#8A7F78] hover:bg-[#EBE3DC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A88A7B] focus:ring-offset-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>

              {/* User Profile Avatar with Dropdown Badge */}
              <div className="relative cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-[#A88A7B] flex items-center justify-center text-white font-semibold text-lg shadow-sm group-hover:bg-[#8E7265] transition-colors">
                  J
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F6F1ED] rounded-full border-2 border-white flex items-center justify-center text-[#8A7F78] shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Dynamic Page Content (Dito papasok yung page.tsx) */}
        <div className="p-10 flex-1 overflow-auto">
          {children}
        </div>

      </main>

    </div>
  );
}