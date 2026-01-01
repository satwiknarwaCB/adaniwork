"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const ShuffleHero = () => {
  return (
    <section className="w-full px-8 py-12 grid grid-cols-1 md:grid-cols-2 items-center gap-8 max-w-6xl mx-auto rounded-3xl overflow-hidden relative">
      <div className="p-8">
        {/* Adani Logo */}
        <div className="mb-6">
          <img 
            src="/logo.png" 
            alt="Adani Logo" 
            className="h-16 object-contain"
          />
        </div>
        <h1 className="text-4xl md:text-4xl lg:text-5xl font-extrabold mt-8 mb-6 text-gray-900 dark:text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] dark:drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]">
          Commissioning Execution Tracker Portal
        </h1>
      </div>
      <ShuffleGrid />
    </section>
  );
};

const shuffle = (array: any[]) => {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const squareData = [
  {
    id: 1,
    src: "/A1.jpg",
  },
  {
    id: 2,
    src: "/A2.jpg",
  },
  {
    id: 3,
    src: "/A3.jpg",
  },
  {
    id: 4,
    src: "/A4.jpg",
  },
  {
    id: 5,
    src: "/A5.jpg",
  },
  {
    id: 6,
    src: "/A6.jpg",
  },
  {
    id: 7,
    src: "/A7.jpg",
  },
  {
    id: 8,
    src: "/A8.jpg",
  },
  {
    id: 9,
    src: "/A9.jpg",
  },
  {
    id: 10,
    src: "/A10.jpg",
  },
  {
    id: 11,
    src: "/A11.jpg",
  },
  {
    id: 12,
    src: "/A12.jpg",
  },
  {
    id: 13,
    src: "/A13.jpg",
  },
  {
    id: 14,
    src: "/A14.jpg",
  },
  {
    id: 15,
    src: "/A15.jpg",
  },
  {
    id: 16,
    src: "/A16.jpg",
  },
];

const generateSquares = (shuffledData: any[]) => {
  return shuffledData.map((sq: { id: number; src: string }) => (
    <motion.div
      key={sq.id}
      layout
      transition={{ 
        duration: 0.7, 
        type: "spring", 
        bounce: 0.15,
        stiffness: 300,
        damping: 25
      }}
      className="w-full h-full rounded-xl overflow-hidden shadow-lg"
      style={{
        backgroundImage: `url(${sq.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "0.75rem"
      }}
      whileHover={{ 
        scale: 1.05, 
        zIndex: 1,
        transition: { duration: 0.3 } 
      }}
      layoutId={`square-${sq.id}`}
    />
  ));
};

const ShuffleGrid = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [shuffledData, setShuffledData] = useState<any[]>([]);

  useEffect(() => {
    // Initialize with shuffled data
    setShuffledData(shuffle([...squareData]));
    
    shuffleSquares();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const shuffleSquares = () => {
    setShuffledData(prev => shuffle([...prev]));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(shuffleSquares, 3500);
  };

  return (
    <div className="grid grid-cols-4 grid-rows-4 h-[450px] gap-3">
      {generateSquares(shuffledData)}
    </div>
  );
};

export default ShuffleHero;