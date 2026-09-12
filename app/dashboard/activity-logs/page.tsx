"use client";

import { useState, useEffect } from "react";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

interface User {
  user_id: number;
  email: string;
  // idagdag ang iba pang user fields kung kailangan tulad ng first_name/last_name
}

interface ActivityLogData {
  log_id: number;
  user_id: number;
  action: string;
  table_name: string;
  record_id: number;
  details: string;
  created_at: string;
  user?: User; 
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/activity-logs");
        const result = await response.json();
        
        if (result.status === 'success') {
          setLogs(result.data);
        }
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Helper function para mas magandang basahin ang date at time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Helper para sa Action Badge color
  const getActionBadgeColor = (action: string) => {
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
    if (action.includes('CREATE')) return 'bg-emerald-100 text-emerald-700';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${inter.className}`}>
      
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className={`${playfair.className} text-3xl text-[#4A3F3A] mb-2`}>
            System Activity Logs
          </h1>
          <p className="text-[#8A7F78] text-sm">
            Monitor all administrative actions and system modifications for security and audit trailing.
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#FFFFFF] rounded-[24px] border border-[#D8CDC5] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F6F1ED]/50 border-b border-[#D8CDC5]">
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">Admin/User</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">Target Table (ID)</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CDC5]">
              {isLoading ? (
                <tr key="loading">
                  <td colSpan={5} className="px-6 py-10 text-center text-[#8A7F78] text-sm animate-pulse">
                    Loading system logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr key="empty">
                  <td colSpan={5} className="px-6 py-10 text-center text-[#8A7F78] text-sm">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-[#F6F1ED]/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#4A3F3A]">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A7F78]">
                      {log.user ? log.user.email : `User ID: ${log.user_id}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A7F78]">
                      <span className="font-medium text-[#4A3F3A]">{log.table_name}</span> (ID: {log.record_id})
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A7F78] max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}