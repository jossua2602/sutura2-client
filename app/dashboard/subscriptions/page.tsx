"use client";

import { useState, useEffect } from "react";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

interface SubscriptionData {
  subscription_id: number; // BINAGO MULA sub_id
  shop_name: string;
  plan: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionData | null>(null);
  
  const [formData, setFormData] = useState({
    tier: "Basic",
    term: "Monthly",
    start_date: "",
    end_date: "",
    status: ""
  });

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/subscriptions");
        const data = await response.json();
        if (data.status === 'success') {
          setSubscriptions(data.data);
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === "term" || name === "start_date") {
      if (newFormData.start_date) {
        const startDate = new Date(newFormData.start_date);
        const endDate = new Date(startDate);
        
        if (newFormData.term === "Monthly") {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (newFormData.term === "Yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        newFormData.end_date = `${year}-${month}-${day}`;
      }
    }

    if (name === "term" || name === "start_date" || name === "end_date") {
      if (newFormData.end_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const computedEndDate = new Date(newFormData.end_date);
        
        const warningDate = new Date(today);
        warningDate.setDate(today.getDate() + 14);

        if (computedEndDate < today) {
          newFormData.status = "Overdue";
        } else if (computedEndDate <= warningDate) {
          newFormData.status = "Expiring";
        } else {
          newFormData.status = "Active";
        }
      }
    }

    setFormData(newFormData);
  };

  const openEditModal = (sub: SubscriptionData) => {
    setEditingSub(sub);
    const planParts = sub.plan.split(" (");
    const currentTier = planParts[0] || "Basic";
    const currentTerm = planParts[1] ? planParts[1].replace(")", "") : "Monthly";

    setFormData({
      tier: currentTier,
      term: currentTerm,
      start_date: sub.start_date,
      end_date: sub.end_date,
      status: sub.status
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    const payload = {
      plan: `${formData.tier} (${formData.term})`,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status
    };

    try {
      // BINAGO MULA sub_id
      const response = await fetch(`http://127.0.0.1:8000/api/admin/subscriptions/${editingSub.subscription_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        alert("Subscription updated successfully!");
        // BINAGO MULA sub_id
        setSubscriptions(subscriptions.map(sub => sub.subscription_id === editingSub.subscription_id ? result.data : sub));
        setIsModalOpen(false);
      } else {
        alert("Failed to update subscription.");
      }
    } catch (error) {
      alert("Something went wrong with the server.");
    }
  };

  const handleRemind = (shopName: string) => {
    alert(`Reminder notification queued for ${shopName}. They will receive an email shortly!`);
  };

  const activeCount = subscriptions.filter(sub => sub.status === 'Active').length;
  const expiringCount = subscriptions.filter(sub => sub.status === 'Expiring').length;
  const overdueCount = subscriptions.filter(sub => sub.status === 'Overdue').length;

  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${inter.className} relative`}>
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className={`${playfair.className} text-3xl text-[#4A3F3A] mb-2`}>
            Monitor Subscriptions
          </h1>
          <p className="text-[#8A7F78] text-sm">
            Track and manage active, expiring, and overdue platform subscriptions of tailoring shops.
          </p>
        </div>
        
        <button className="px-5 py-2.5 bg-white border border-[#D8CDC5] text-[#4A3F3A] text-sm font-medium rounded-xl hover:bg-[#F6F1ED] transition-colors shadow-sm">
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-[#D8CDC5] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-[#8A7F78] text-xs font-semibold uppercase tracking-wider mb-2">Active Plans</p>
          <h2 className={`${playfair.className} text-3xl text-emerald-600`}>{isLoading ? "..." : activeCount}</h2>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-[#D8CDC5] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-[#8A7F78] text-xs font-semibold uppercase tracking-wider mb-2">Expiring Soon</p>
          <h2 className={`${playfair.className} text-3xl text-amber-600`}>{isLoading ? "..." : expiringCount}</h2>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-[#D8CDC5] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-[#8A7F78] text-xs font-semibold uppercase tracking-wider mb-2">Overdue</p>
          <h2 className={`${playfair.className} text-3xl text-red-600`}>{isLoading ? "..." : overdueCount}</h2>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-[24px] border border-[#D8CDC5] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F6F1ED]/50 border-b border-[#D8CDC5]">
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">Shop Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">Subscription Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">End Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#8A7F78] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CDC5]">
              {isLoading ? (
                <tr key="loading">
                  <td colSpan={6} className="px-6 py-10 text-center text-[#8A7F78] text-sm animate-pulse">Loading subscriptions...</td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr key="empty">
                  <td colSpan={6} className="px-6 py-10 text-center text-[#8A7F78] text-sm">No subscriptions found.</td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  // BINAGO MULA sub_id
                  <tr key={sub.subscription_id} className="hover:bg-[#F6F1ED]/30 transition-colors">
                    <td className="px-6 py-5 text-sm font-medium text-[#4A3F3A]">{sub.shop_name}</td>
                    <td className="px-6 py-5 text-sm text-[#8A7F78]">{sub.plan}</td>
                    <td className="px-6 py-5 text-sm text-[#8A7F78]">{sub.start_date}</td>
                    <td className="px-6 py-5 text-sm text-[#8A7F78]">{sub.end_date}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                        sub.status === 'Expiring' ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right space-x-4">
                      {sub.status !== 'Active' && (
                        <button onClick={() => handleRemind(sub.shop_name)} className="text-sm font-medium text-[#A88A7B] hover:text-[#8E7265] transition-colors">
                          Remind
                        </button>
                      )}
                      <button onClick={() => openEditModal(sub)} className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-[#D8CDC5] overflow-hidden">
            <div className="bg-[#F6F1ED] px-6 py-4 border-b border-[#D8CDC5] flex justify-between items-center">
              <h3 className={`${playfair.className} text-xl text-[#4A3F3A]`}>Update Subscription</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8A7F78] hover:text-red-500 font-bold">✕</button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="mb-2">
                <p className="text-xs font-semibold text-[#8A7F78]">Shop Name</p>
                <p className="text-sm font-medium text-[#4A3F3A]">{editingSub.shop_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8A7F78] mb-1">Plan Tier</label>
                  <select name="tier" value={formData.tier} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#4A3F3A] focus:outline-none focus:border-[#A88A7B] focus:ring-1 focus:ring-[#A88A7B]">
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8A7F78] mb-1">Billing Cycle</label>
                  <select name="term" value={formData.term} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#4A3F3A] focus:outline-none focus:border-[#A88A7B] focus:ring-1 focus:ring-[#A88A7B]">
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8A7F78] mb-1">Start Date</label>
                  <input required type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#4A3F3A] focus:outline-none focus:border-[#A88A7B]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8A7F78] mb-1">End Date</label>
                  <input required type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} 
                    className="w-full px-4 py-2 bg-gray-200 border border-gray-200 rounded-lg text-sm text-[#8A7F78] focus:outline-none focus:border-[#A88A7B]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A7F78] mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-200 border border-gray-200 rounded-lg text-sm text-[#8A7F78] focus:outline-none focus:border-[#A88A7B] focus:ring-1 focus:ring-[#A88A7B]">
                  <option value="Active">Active</option>
                  <option value="Expiring">Expiring</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-[#8A7F78] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#A88A7B] rounded-lg hover:bg-[#8E7265] transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}