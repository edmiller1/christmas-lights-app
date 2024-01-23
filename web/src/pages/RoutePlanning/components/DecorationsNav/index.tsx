import { FadersHorizontal, Warning } from "@phosphor-icons/react";
import { DecorationCard, DecorationsLoading } from "..";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Get_Decorations_Via_City } from "@/graphql/queries/getDecorationsViaCity/types";
import { Get_Decorations_Via_Country } from "@/graphql/queries/getDecorationsViaCountry/types";
import { Get_Decorations_Via_Region } from "@/graphql/queries/getDecorationsViaRegion/types";
import { Decoration } from "@/lib/types";

interface Props {
  getDecorationsViaCountryLoading: boolean;
  getDecorationsViaCityLoading: boolean;
  getDecorationsViaRegionLoading: boolean;
  decorations:
    | Get_Decorations_Via_City[]
    | Get_Decorations_Via_Country[]
    | Get_Decorations_Via_Region[]
    | null;
  activeDecoration:
    | Get_Decorations_Via_City
    | Get_Decorations_Via_Country
    | Get_Decorations_Via_Region
    | Decoration
    | undefined;
  activeDecorationIndex: number;
  setActiveDecoration: (
    activeDecoration:
      | Get_Decorations_Via_City
      | Get_Decorations_Via_Country
      | Get_Decorations_Via_Region
      | Decoration
      | undefined
  ) => void;
  setActiveDecorationIndex: (activeDecorationIndex: number) => void;
  refs: any;
  userFavourites: Decoration[] | undefined;
  handleDecorationSelect: (
    decoration:
      | Get_Decorations_Via_City
      | Get_Decorations_Via_Country
      | Get_Decorations_Via_Region,
    index: number
  ) => void;
}

export const DecorationsNav = ({
  getDecorationsViaCityLoading,
  getDecorationsViaCountryLoading,
  getDecorationsViaRegionLoading,
  decorations,
  activeDecoration,
  activeDecorationIndex,
  handleDecorationSelect,
  refs,
  setActiveDecoration,
  setActiveDecorationIndex,
  userFavourites,
}: Props) => {
  return (
    <aside className="fixed bottom-0 left-20 top-0 w-96 overflow-y-auto border-r dark:border-black">
      <div className="fixed top-0 w-96 bg-zinc-800 p-8 dark:border-b dark:border-black">
        <h1 className="text-xl font-semibold">Decorations</h1>
        <div className="flex items-center space-x-4 my-5">
          <Input type="text" placeholder="Search Decorations" />
          <Button variant="outline">
            <FadersHorizontal
              size={16}
              weight="bold"
              className="text-ch-dark dark:text-ch-light"
            />
          </Button>
        </div>
      </div>
      {getDecorationsViaCityLoading ||
      getDecorationsViaCountryLoading ||
      getDecorationsViaRegionLoading ? (
        <DecorationsLoading />
      ) : decorations && decorations.length === 0 ? (
        <div className="mt-44 p-5 flex justify-center items-center text-center flex-col text-ch-red">
          <Warning size={32} />
          <span className="mt-3">
            Could not find any decorations in this area.
          </span>
          <span className="text-sm">
            Try searching for decorations above or using the map
          </span>
        </div>
      ) : (
        <div className="mt-44 grid grid-cols-1 gap-y-5 p-5 overflow-y-auto">
          {decorations?.map((decoration, index) => (
            <DecorationCard
              refs={refs}
              key={decoration.id}
              decoration={decoration}
              activeDecoration={activeDecoration}
              index={index}
              handleDecorationSelect={handleDecorationSelect}
              userFavourites={userFavourites?.map(
                (decoration) => decoration.id
              )}
            />
          ))}
        </div>
      )}
    </aside>
  );
};