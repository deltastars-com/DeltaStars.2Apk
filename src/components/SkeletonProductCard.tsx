import React from 'react';

export function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-[3.5rem] shadow-lg overflow-hidden flex flex-col border border-gray-50 h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200" />
      
      <div className="p-10 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-4">
          <div className="h-3 w-20 bg-gray-200 rounded-full" />
          <div className="h-3 w-12 bg-gray-200 rounded-full" />
        </div>
        
        <div className="h-8 w-3/4 bg-gray-200 rounded-2xl mb-4" />
        
        {/* Details Skeleton */}
        <div className="mb-6 grid grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-[2rem] border border-gray-100">
          <div className="space-y-2">
            <div className="h-2 w-10 bg-gray-200 rounded-full" />
            <div className="h-4 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-10 bg-gray-200 rounded-full" />
            <div className="h-4 w-16 bg-gray-200 rounded-full" />
          </div>
        </div>

        <div className="h-16 w-full bg-gray-100 rounded-[3rem] mb-8" />
        
        <div className="flex justify-between items-center mt-auto">
          <div className="h-10 w-24 bg-gray-200 rounded-xl" />
          <div className="h-16 w-16 bg-gray-200 rounded-[2rem]" />
        </div>
      </div>
    </div>
  );
}
