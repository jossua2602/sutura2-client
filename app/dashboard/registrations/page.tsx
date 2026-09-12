"use client";

import { useState, useEffect } from "react";

export default function RegistrationsPage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Bagong states para sa API data at loading indicator
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function para kunin ang data mula sa Laravel backend
  const fetchRegistrations = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/registrations");
      const data = await response.json();
      
      if (data.status === 'success') {
        setRegistrations(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // I-run ang fetch function pag-load ng page
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const openDetails = (shop: any) => {
    setSelectedShop(shop);
    setIsModalOpen(true);
    setRejectionReason("");
    setShowOtherInput(false);
  };

  const handleAction = async (shop_id: number, status: string, reason: string) => {
    try {
      // In-update ang URL para tugma sa route at ginamit ang shop_id
      const response = await fetch(`http://127.0.0.1:8000/api/admin/registrations/${shop_id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ status, reason }),
      });

      if (response.ok) {
        alert(`Application has been ${status}.`);
        setIsModalOpen(false);
        fetchRegistrations(); // Re-fetch para ma-update agad ang listahan sa UI
      } else {
        const errorData = await response.json();
        alert(`Failed to update status: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-[#F6F1ED] p-1 rounded-xl w-fit border border-[#D8CDC5]">
        {["Pending", "Approved", "Rejected"].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-[#A88A7B] text-white shadow-sm" : "text-[#8A7F78]"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[24px] border border-[#D8CDC5] p-6">
        <table className="w-full text-left">
          <tbody className="divide-y divide-[#D8CDC5]">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-8 text-[#8A7F78]">Loading applications...</td></tr>
            ) : registrations.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-[#8A7F78]">No shop registrations found.</td></tr>
            ) : (
              // Ginamit natin ang verification_status mula sa SHOP table
              registrations.filter(r => r.verification_status === activeTab).map((reg) => (
                <tr key={reg.shop_id} className="h-16">
                  <td className="text-sm font-medium">{reg.shop_name}</td>
                  <td className="text-sm text-[#8A7F78]">{reg.address}</td>
                  <td className="text-sm text-[#8A7F78]">
                    {reg.created_at ? new Date(reg.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="text-right">
                    <button onClick={() => openDetails(reg)} className="text-[#A88A7B] font-medium hover:underline">View Details</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    {/* Details Modal */}
      {isModalOpen && selectedShop && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg border border-[#D8CDC5] shadow-xl">
            <h2 className="text-2xl font-semibold mb-6">
              {selectedShop.verification_status === 'Pending' ? 'Review Application' : 'Application Details'}
            </h2>
            
            <div className="space-y-4 mb-8">
              <p><span className="font-semibold text-sm text-[#8A7F78]">Shop Name:</span> {selectedShop.shop_name}</p>
              <p><span className="font-semibold text-sm text-[#8A7F78]">Address:</span> {selectedShop.address}</p>
              <p><span className="font-semibold text-sm text-[#8A7F78]">Status:</span> 
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium 
                  ${selectedShop.verification_status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                    selectedShop.verification_status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                    'bg-orange-100 text-orange-700'}`}>
                  {selectedShop.verification_status}
                </span>
              </p>

              {/* Read-only Rejection Reason kung Rejected na */}
              {selectedShop.verification_status === 'Rejected' && selectedShop.rejection_reason && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                  <span className="font-semibold">Reason for Rejection:</span> {selectedShop.rejection_reason}
                </div>
              )}
              
              {/* Ipapakita lang ang dropdown kung Pending pa */}
              {selectedShop.verification_status === 'Pending' && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-[#8A7F78] mb-2">Select Rejection Reason (If rejecting):</label>
                  <select 
                    className="w-full p-3 border border-[#D8CDC5] rounded-xl text-sm focus:ring-2 focus:ring-[#A88A7B] focus:outline-none"
                    onChange={(e) => {
                      const val = e.target.value;
                      setShowOtherInput(val === 'Others');
                      setRejectionReason(val === 'Others' ? '' : val);
                    }}
                  >
                    <option value="">-- Select a reason --</option>
                    <option value="Incomplete Requirements">Incomplete Requirements</option>
                    <option value="Invalid Documents">Invalid Documents</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              )}

              {/* Dynamic Textbox para sa Others (lalabas lang kung Pending) */}
              {selectedShop.verification_status === 'Pending' && showOtherInput && (
                <div className="mt-4">
                  <textarea 
                    className="w-full p-3 border border-[#D8CDC5] rounded-xl text-sm focus:ring-2 focus:ring-[#A88A7B] focus:outline-none"
                    rows={3}
                    placeholder="Please specify the reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {/* Dynamic Buttons: Kung Pending, ipakita ang Approve/Reject. Kung hindi, Close button lang. */}
              {selectedShop.verification_status === 'Pending' ? (
                <>
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                  <button 
                    onClick={() => handleAction(selectedShop.shop_id, 'Rejected', rejectionReason)}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(selectedShop.shop_id, 'Approved', '')}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Approve
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-[#4A3F3A]"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}