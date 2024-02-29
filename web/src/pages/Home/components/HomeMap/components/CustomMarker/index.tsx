import { Get_Decorations_Via_City } from "@/graphql/queries/getDecorationsViaCity/types";
import { Get_Decorations_Via_Country } from "@/graphql/queries/getDecorationsViaCountry/types";
import { Get_Decorations_Via_Region } from "@/graphql/queries/getDecorationsViaRegion/types";
import { Decoration } from "@/lib/types";
import { Star } from "@phosphor-icons/react";

interface Props {
  decoration:
    | Get_Decorations_Via_City
    | Get_Decorations_Via_Region
    | Get_Decorations_Via_Country;
  activeDecoration:
    | Get_Decorations_Via_City
    | Get_Decorations_Via_Region
    | Get_Decorations_Via_Country
    | Decoration
    | undefined;
  setActiveDecoration: (
    activeDecoration:
      | Get_Decorations_Via_City
      | Get_Decorations_Via_Region
      | Get_Decorations_Via_Country
      | undefined
  ) => void;
}

export const CustomMarker = ({
  activeDecoration,
  decoration,
  setActiveDecoration,
}: Props) => {
  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden">
        <div
          className={`${
            decoration.id === activeDecoration?.id
              ? "flex items-center cursor-pointer font-bold text-lg bg-black text-white rounded-xl px-2 py-1 shadow-lg hover:scale-110 transition-all"
              : "flex items-center cursor-pointer font-bold text-lg bg-white text-black rounded-xl px-2 py-1 shadow-lg hover:scale-110 transition-all"
          } `}
          onMouseEnter={() => setActiveDecoration(decoration)}
          onMouseLeave={() => setActiveDecoration(undefined)}
          onClick={() => setActiveDecoration(decoration)}
        >
          <Star
            size={12}
            color={`${
              decoration.id === activeDecoration?.id ? "#FFFFFF" : "#3b403d"
            }`}
            weight="fill"
            className="mr-1"
          />
          {decoration.rating === 0 ? "New" : decoration.rating.toFixed(1)}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:block">
        <div
          className={`${
            decoration.id === activeDecoration?.id
              ? "flex items-center cursor-pointer font-bold bg-black text-white rounded-xl px-3 py-1 shadow-lg hover:scale-110 transition-all"
              : "flex items-center cursor-pointer font-bold bg-white text-black rounded-xl px-2 py-1 shadow-lg hover:scale-110 transition-all"
          } `}
          onMouseEnter={() => setActiveDecoration(decoration)}
          onMouseLeave={() => setActiveDecoration(undefined)}
          onClick={() => setActiveDecoration(decoration)}
        >
          <Star
            size={12}
            color={`${
              decoration.id === activeDecoration?.id ? "#FFFFFF" : "#3b403d"
            }`}
            weight="fill"
            className="mr-1"
          />
          {decoration.rating === 0 ? "New" : decoration.rating.toFixed(1)}
        </div>
      </div>
    </>
  );
};
