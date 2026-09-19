"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="reg-modal-title">
          <div className="w-full max-w-lg border border-border-line bg-bg-surface overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border-line bg-bg-sunken px-6 py-4">
              <h2 id="reg-modal-title" className="text-display text-xl text-text-ink">
                {selectedShop.verification_status === 'Pending' ? 'Review Application' : 'Application Details'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center text-text-ink-muted hover:text-text-ink">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-ink-muted">Shop name</p>
                  <p className="mt-0.5 text-sm text-text-ink">{selectedShop.shop_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-ink-muted">Address</p>
                  <p className="mt-0.5 text-sm text-text-ink">{selectedShop.address}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-ink-muted">Status</p>
                  <p className="mt-1">
                    <span className={`badge ${selectedShop.verification_status === 'Approved' ? 'badge-sage' : selectedShop.verification_status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {selectedShop.verification_status}
                    </span>
                  </p>
                </div>

                {/* Rejection reason (read-only if already rejected) */}
                {selectedShop.verification_status === 'Rejected' && selectedShop.rejection_reason && (
                  <div className="border-l-4 border-text-danger/40 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger">
                    <span className="font-semibold">Reason for rejection:</span> {selectedShop.rejection_reason}
                  </div>
                )}

                {/* Rejection reason picker (only for pending) */}
                {selectedShop.verification_status === 'Pending' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-text-ink-muted mb-1" htmlFor="reg-reject-reason">
                      Rejection reason <span className="normal-case font-normal text-text-ink-faint">(required only when rejecting)</span>
                    </label>
                    <select
                      id="reg-reject-reason"
                      className="min-h-10 w-full border border-border-line bg-bg-canvas px-3 text-sm text-text-ink outline-none focus:border-bg-taupe"
                      onChange={(e) => {
                        const val = e.target.value;
                        setShowOtherInput(val === 'Others');
                        setRejectionReason(val === 'Others' ? '' : val);
                      }}
                    >
                      <option value="">â€” Select a reason â€”</option>
                      <option value="Incomplete Requirements">Incomplete Requirements</option>
                      <option value="Invalid Documents">Invalid Documents</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                )}

                {selectedShop.verification_status === 'Pending' && showOtherInput && (
                  <textarea
                    className="w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm text-text-ink outline-none focus:border-bg-taupe"
                    rows={3}
                    placeholder="Specify the reasonâ€¦"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {selectedShop.verification_status === 'Pending' ? (
                  <>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 min-h-10 border border-border-line-strong text-sm font-semibold text-text-ink-muted hover:bg-bg-sunken">Cancel</button>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedShop.shop_id, 'Rejected', rejectionReason)}
                      className="flex-1 min-h-10 border border-text-danger/40 text-sm font-semibold text-text-danger hover:bg-[#f5e8e5]"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedShop.shop_id, 'Approved', '')}
                      className="flex-1 min-h-10 bg-text-sage text-sm font-semibold text-white hover:bg-[#6a7b66]"
                    >
                      Approve
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-full min-h-10 border border-border-line-strong text-sm font-semibold text-text-ink-muted hover:bg-bg-sunken">
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
