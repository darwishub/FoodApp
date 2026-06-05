export interface NutritionData {
  foodName: string;
  servingSize: string;
  servingsPerContainer: string;
  calories: number;
  totalFat: { amount: string; dailyValue: number };
  saturatedFat: { amount: string; dailyValue: number };
  transFat: { amount: string };
  cholesterol: { amount: string; dailyValue: number };
  sodium: { amount: string; dailyValue: number };
  totalCarbohydrate: { amount: string; dailyValue: number };
  dietaryFiber: { amount: string; dailyValue: number };
  totalSugars: { amount: string };
  addedSugars: { amount: string; dailyValue: number };
  protein: { amount: string };
  vitaminD: { amount: string; dailyValue: number };
  calcium: { amount: string; dailyValue: number };
  iron: { amount: string; dailyValue: number };
  potassium: { amount: string; dailyValue: number };
}

interface NutritionLabelProps {
  data: NutritionData;
}

function Row({
  label,
  amount,
  dv,
  indent = false,
  bold = false,
  thick = false,
  thin = false,
}: {
  label: string;
  amount: string;
  dv?: number;
  indent?: boolean;
  bold?: boolean;
  thick?: boolean;
  thin?: boolean;
}) {
  return (
    <div
      className={`
        flex justify-between items-baseline py-[2px]
        ${thick ? "border-t-[8px] border-black" : thin ? "border-t border-black/20" : "border-t border-black/40"}
        ${indent ? "pl-4" : ""}
      `}
    >
      <span className={`text-[13px] ${bold ? "font-extrabold" : "font-normal"}`}>
        {label}{" "}
        <span className={`${bold ? "font-normal" : ""}`}>{amount}</span>
      </span>
      {dv !== undefined && (
        <span className="text-[13px] font-bold ml-2 whitespace-nowrap">{dv}%</span>
      )}
    </div>
  );
}

export default function NutritionLabel({ data }: NutritionLabelProps) {
  return (
    <div className="w-full max-w-[280px] mx-auto border-[3px] border-black p-2 font-['Arial',sans-serif] bg-white text-black">
      <h2 className="text-[32px] font-extrabold leading-none mb-0.5">Nutrition Facts</h2>

      <div className="text-[13px] border-t border-black/40 pt-0.5">
        <div className="flex justify-between">
          <span>{data.servingsPerContainer} servings per container</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Serving size</span>
          <span className="font-extrabold">{data.servingSize}</span>
        </div>
      </div>

      <div className="border-t-[12px] border-black mt-1 pt-0.5">
        <div className="flex justify-between items-baseline">
          <span className="text-[13px] font-extrabold">Amount Per Serving</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[13px] font-extrabold">Calories</span>
          <span className="text-[40px] font-extrabold leading-none">{data.calories}</span>
        </div>
      </div>

      <div className="border-t-[5px] border-black text-right text-[11px] font-bold pt-0.5 pb-0.5">
        % Daily Value*
      </div>

      <Row label="Total Fat" amount={data.totalFat.amount} dv={data.totalFat.dailyValue} bold />
      <Row label="Saturated Fat" amount={data.saturatedFat.amount} dv={data.saturatedFat.dailyValue} indent thin />
      <Row label="Trans Fat" amount={data.transFat.amount} indent thin />
      <Row label="Cholesterol" amount={data.cholesterol.amount} dv={data.cholesterol.dailyValue} bold thick />
      <Row label="Sodium" amount={data.sodium.amount} dv={data.sodium.dailyValue} bold />
      <Row label="Total Carbohydrate" amount={data.totalCarbohydrate.amount} dv={data.totalCarbohydrate.dailyValue} bold thick />
      <Row label="Dietary Fiber" amount={data.dietaryFiber.amount} dv={data.dietaryFiber.dailyValue} indent thin />
      <Row label="Total Sugars" amount={data.totalSugars.amount} indent thin />
      <div className="border-t border-black/20 flex justify-between items-baseline py-[2px] pl-8">
        <span className="text-[13px]">
          Includes {data.addedSugars.amount} Added Sugars
        </span>
        <span className="text-[13px] font-bold ml-2">{data.addedSugars.dailyValue}%</span>
      </div>
      <Row label="Protein" amount={data.protein.amount} bold thick />

      <div className="border-t-[8px] border-black pt-0.5 pb-0.5">
        <div className="grid grid-cols-2 gap-x-1 text-[11px]">
          <div className="border-b border-black/30 flex justify-between py-0.5">
            <span>Vitamin D {data.vitaminD.amount}</span>
            <span className="font-bold">{data.vitaminD.dailyValue}%</span>
          </div>
          <div className="border-b border-black/30 flex justify-between py-0.5">
            <span>Calcium {data.calcium.amount}</span>
            <span className="font-bold">{data.calcium.dailyValue}%</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Iron {data.iron.amount}</span>
            <span className="font-bold">{data.iron.dailyValue}%</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Potassium {data.potassium.amount}</span>
            <span className="font-bold">{data.potassium.dailyValue}%</span>
          </div>
        </div>
      </div>

      <div className="border-t-[3px] border-black pt-1 text-[9px] leading-tight">
        * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
      </div>
      <p className="text-[8px] text-gray-400 italic text-center mt-1">
        AI estimates · actual values may vary
      </p>
    </div>
  );
}
