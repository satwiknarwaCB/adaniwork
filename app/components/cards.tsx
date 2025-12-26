"use client";

import { MagicCard } from "@/components/ui/magic-card";
import Link from "next/link";

const Cards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-3 max-w-7xl mx-auto">
      {/* Card 1 - Live */}
      <MagicCard className="p-6 rounded-xl shadow-lg bg-white dark:bg-[#171717] relative overflow-hidden">
        <div className="absolute right-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Live
          </span>
        </div>
        <h3 className="text-md font-bold mb-3 text-gray-900 dark:text-white">AGEL FY 25-26 Commissioning Portal</h3>
        <p className=" text-sm text-gray-600 dark:text-gray-300 mb-4">
          Here you can track the capacity of your energy sources in real-time and optimize your energy usage.
        </p>
        <button className="bg-linear-to-r from-[#0B74B0] to-[#75479C] text-white font-medium py-2 px-4 rounded-lg transition-all hover:from-[#0B74B0]/90 hover:to-[#75479C]/90 active:scale-95" onClick={() => window.location.href = '/application'}>
          Launch Application
        </button>
      </MagicCard>

      {/* Card 2 - Upcoming */}
      <MagicCard className="p-6 rounded-xl shadow-lg bg-white dark:bg-[#171717] relative overflow-hidden">
        <div className="absolute right-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            Upcoming
          </span>
        </div>
        <h3 className="text-md font-bold mb-3 text-gray-900 dark:text-white">Sustainability</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Commitment to sustainable practices that protect our environment for future generations.
        </p>
        <button className="mt-auto bg-linear-to-r from-[#0B74B0] to-[#75479C] text-white font-medium py-2 px-4 rounded-lg transition-all hover:from-[#0B74B0]/90 hover:to-[#75479C]/90 active:scale-95 opacity-50 cursor-not-allowed" disabled>
          Launch Application
        </button>
      </MagicCard>

      {/* Card 3 - Upcoming */}
      <MagicCard className="p-6 flex rounded-xl shadow-lg bg-white dark:bg-[#171717] relative overflow-hidden">
        <div className="absolute right-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            Upcoming
          </span>
        </div>
        <h3 className="text-md font-bold mb-3 text-gray-900 dark:text-white">Innovation</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Cutting-edge technology and research driving the future of energy and sustainability initiatives.
        </p>
        <button className="bg-linear-to-r from-[#0B74B0] to-[#75479C] text-white font-medium py-2 px-4 rounded-lg transition-all hover:from-[#0B74B0]/90 hover:to-[#75479C]/90 active:scale-95 opacity-50 cursor-not-allowed" disabled>
          Launch Application
        </button>
      </MagicCard>
    </div>
  );
};

export default Cards;