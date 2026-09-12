"use client"; // Required for fetching data in client-side
import { useEffect, useState } from "react";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function TestConnection() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    // Kinukuha natin ang data mula sa Laravel server
    fetch("http://127.0.0.1:8000/api/test-connection")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => setMessage("Connection failed. Is Laravel running?"));
  }, []);

  return (
    <div className={`min-h-screen bg-[#F6F1ED] flex flex-col items-center justify-center p-4 ${inter.className}`}>
      <div className="w-full max-w-[420px] bg-[#FFFFFF] border border-[#D8CDC5] rounded-[24px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
        <h1 className={`${playfair.className} text-3xl font-bold text-[#4A3F3A] mb-6`}>
          API Test Status
        </h1>
        <p className={`text-sm font-medium px-4 py-3 rounded-xl border ${message.includes('successfully') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}