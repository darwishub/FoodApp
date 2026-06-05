export default function NutritionLabelSkeleton() {
  return (
    <div className="w-full max-w-[280px] mx-auto border-[3px] border-gray-200 p-2 animate-pulse bg-white">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="border-t border-gray-200 pt-1 space-y-1 mb-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
      <div className="border-t-[12px] border-gray-200 pt-1 mb-2">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
      <div className="border-t-[5px] border-gray-200 mb-2" />
      {[100, 80, 90, 70, 85, 75, 65, 80, 60].map((w, i) => (
        <div key={i} className="flex justify-between py-1 border-t border-gray-100">
          <div className={`h-3 bg-gray-200 rounded`} style={{ width: `${w}%` }} />
          <div className="h-3 bg-gray-200 rounded w-6 ml-2" />
        </div>
      ))}
      <div className="border-t-[8px] border-gray-200 mt-1 pt-1 grid grid-cols-2 gap-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="border-t-[3px] border-gray-200 mt-1 pt-1 space-y-1">
        <div className="h-2 bg-gray-200 rounded w-full" />
        <div className="h-2 bg-gray-200 rounded w-4/5" />
      </div>
    </div>
  );
}
