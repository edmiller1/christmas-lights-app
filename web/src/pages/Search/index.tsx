import { AppHeader, Footer } from "@/components";
import {
  GET_DECORATIONS_VIA_CITY,
  GET_DECORATIONS_VIA_COUNTRY,
  GET_DECORATIONS_VIA_REGION,
  GET_USER,
  SEARCH_FOR_DECORATIONS,
} from "@/graphql/queries";
import {
  GetDecorationsViaCity as GetDecorationsViaCityData,
  GetDecorationsViaCityArgs,
  Get_Decorations_Via_City,
} from "@/graphql/queries/getDecorationsViaCity/types";
import {
  GetDecorationsViaCountry as GetDecorationsViaCountryData,
  GetDecorationsViaCountryArgs,
  Get_Decorations_Via_Country,
} from "@/graphql/queries/getDecorationsViaCountry/types";
import {
  GetDecorationsViaRegion as GetDecorationsViaRegionData,
  GetDecorationsViaRegionArgs,
  Get_Decorations_Via_Region,
} from "@/graphql/queries/getDecorationsViaRegion/types";
import {
  GetUser as GetUserData,
  GetUserArgs,
} from "../../graphql/queries/getUser/types";
import {
  SearchForDecorations as SearchForDecorationsData,
  SearchForDecorationsArgs,
  Search_For_Decorations,
} from "@/graphql/queries/searchForDecorations/types";
import { useUserData } from "@/lib/hooks";
import { useQuery, useLazyQuery } from "@apollo/client";
import { useLocation } from "react-router-dom";
import { AppHeaderLoading } from "@/components/AppHeader/components";
import { useEffect, useState } from "react";
import {
  DecorationCard,
  DecorationsLoading,
  Pagi,
  SearchMap,
} from "./components";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const Search = () => {
  const currentUser = useUserData();
  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get("query");

  const [viewState, setViewState] = useState<any>();
  const [decorationCount, setDecorationCount] = useState<number>(0);
  const [searchedDecorations, setSearchedDecorations] = useState<
    | Search_For_Decorations[]
    | Get_Decorations_Via_City[]
    | Get_Decorations_Via_Country[]
    | Get_Decorations_Via_Region[]
    | undefined
  >();
  const [activeDecoration, setActiveDecoration] = useState<
    | Search_For_Decorations
    | Get_Decorations_Via_City
    | Get_Decorations_Via_Country
    | Get_Decorations_Via_Region
    | undefined
  >();
  const [activeDecorationIndex, setActiveDecorationIndex] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [
    getDecorationsViaCountry,
    { loading: getDecorationsViaCountryLoading },
  ] = useLazyQuery<GetDecorationsViaCountryData, GetDecorationsViaCountryArgs>(
    GET_DECORATIONS_VIA_COUNTRY,
    {
      onCompleted: (data) => {
        setSearchedDecorations(data.getDecorationsViaCountry);
      },
    }
  );

  const [getDecorationsViaCity, { loading: getDecorationsViaCityLoading }] =
    useLazyQuery<GetDecorationsViaCityData, GetDecorationsViaCityArgs>(
      GET_DECORATIONS_VIA_CITY,
      {
        onCompleted: (data) => {
          setSearchedDecorations(data.getDecorationsViaCity);
        },
      }
    );

  const [getDecorationsViaRegion, { loading: getDecorationsViaRegionLoading }] =
    useLazyQuery<GetDecorationsViaRegionData, GetDecorationsViaRegionArgs>(
      GET_DECORATIONS_VIA_REGION,
      {
        onCompleted: (data) => {
          setSearchedDecorations(data.getDecorationsViaRegion);
        },
      }
    );

  const {
    data: getUserData,
    loading: getUserLoading,
    refetch: refetchUser,
  } = useQuery<GetUserData, GetUserArgs>(GET_USER, {
    variables: { input: { id: currentUser ? currentUser.uid : "" } },
    skip: !currentUser,
  });

  const {
    loading: searchForDecorationsLoading,
    refetch: refetchSearchedDecorations,
  } = useQuery<SearchForDecorationsData, SearchForDecorationsArgs>(
    SEARCH_FOR_DECORATIONS,
    {
      variables: {
        input: {
          searchTerm: searchQuery ? searchQuery : "",
          skip: (pageNumber - 1) * 18,
        },
      },
      onCompleted: (data) => {
        setTotalPages(Math.ceil(data.searchForDecorations.count / 18));
        setDecorationCount(data.searchForDecorations.count);
        setSearchedDecorations(data.searchForDecorations.decorations);
        const newViewState = {
          latitude: data.searchForDecorations.decorations[0].latitude,
          longitude: data.searchForDecorations.decorations[0].longitude,
          zoom: 15,
          bearing: 0,
          pitch: 0,
        };
        setViewState(newViewState);
      },
    }
  );

  const user = getUserData?.getUser ? getUserData.getUser : null;

  const refetchUserData = () => {
    refetchUser();
  };

  const showPopup = (
    e: any,
    decoration:
      | Get_Decorations_Via_City
      | Get_Decorations_Via_Country
      | Get_Decorations_Via_Region
      | Search_For_Decorations
      | undefined
  ) => {
    e.originalEvent.stopPropagation();
    setActiveDecoration(decoration);
  };

  const closePopup = () => {
    if (activeDecoration) {
      setActiveDecoration(undefined);
      setActiveDecorationIndex(0);
    }
  };

  const refetchDecorations = (pageNumber: number) => {
    refetchSearchedDecorations({
      input: {
        searchTerm: searchQuery ? searchQuery : "",
        skip: (pageNumber - 1) * 18,
      },
    });
  };

  const previousPage = () => {
    if (pageNumber === 1) {
      return;
    } else {
      setPageNumber(pageNumber - 1);
      refetchDecorations(pageNumber - 1);
    }
  };

  const nextPage = () => {
    if (pageNumber === totalPages) {
      return;
    } else {
      setPageNumber(pageNumber + 1);
      refetchDecorations(pageNumber + 1);
    }
  };

  const getTotalPagesAsArray = (totalPages: number) => {
    const result = [];
    for (let i = 1; i <= totalPages; i++) {
      result.push(i);
    }
    return result;
  };

  useEffect(() => {
    if (viewState && viewState.zoom !== 15) {
      const getDecorationData = setTimeout(() => {
        if (viewState && viewState.zoom <= 6) {
          getDecorationsViaCountry({
            variables: {
              input: {
                latitude: viewState.latitude?.toString() as string,
                longitude: viewState.longitude?.toString() as string,
              },
            },
          });
        } else if (viewState && viewState.zoom > 6 && viewState.zoom <= 10) {
          getDecorationsViaRegion({
            variables: {
              input: {
                latitude: viewState.latitude?.toString() as string,
                longitude: viewState.longitude?.toString() as string,
              },
            },
          });
        } else {
          getDecorationsViaCity({
            variables: {
              input: {
                latitude: viewState.latitude?.toString() as string,
                longitude: viewState.longitude?.toString() as string,
              },
            },
          });
        }
      }, 1000);
      return () => clearTimeout(getDecorationData);
    }
  }, [viewState]);

  return (
    <>
      <div className="sm:hidden"></div>
      <div className="hidden sm:block">
        {getUserLoading ? (
          <AppHeaderLoading />
        ) : (
          <AppHeader user={user} searchQuery={searchQuery} />
        )}
        <div className="flex pt-16">
          <div className="w-3/5 px-5 py-3 min-h-[92.6vh]">
            {searchForDecorationsLoading ? (
              <div className="h-10 w-1/4 rounded-lg animate-pulse bg-gray-200 dark:bg-zinc-700"></div>
            ) : (
              <span className="font-semibold">
                Showing top results for: {searchQuery}
              </span>
            )}
            {getDecorationsViaCountryLoading ||
            getDecorationsViaRegionLoading ||
            getDecorationsViaCityLoading ||
            searchForDecorationsLoading ? (
              <DecorationsLoading />
            ) : (
              <>
                <div className="mt-5 grid grid-cols-3 gap-x-6 gap-y-10 mb-10">
                  {searchedDecorations?.map((decoration, index) => (
                    <DecorationCard
                      key={decoration.id}
                      currentUser={currentUser}
                      decoration={decoration}
                      decorations={searchedDecorations}
                      index={index}
                      refetchUserData={refetchUserData}
                      userFavourites={user?.favourites.map((item) => item.id)}
                    />
                  ))}
                </div>
                <Pagi
                  nextPage={nextPage}
                  pageNumber={pageNumber}
                  previousPage={previousPage}
                  setPageNumber={setPageNumber}
                  totalPages={totalPages}
                  visiblePages={3}
                />
              </>
            )}
          </div>
          <div className="w-2/5 fixed right-0 top-16 bottom-0">
            <SearchMap
              searchedDecorations={searchedDecorations}
              viewState={viewState}
              setViewState={setViewState}
              getDecorationsViaCountryLoading={getDecorationsViaCountryLoading}
              getDecorationsViaCityLoading={getDecorationsViaCityLoading}
              getDecorationsViaRegionLoading={getDecorationsViaRegionLoading}
              searchForDecorationsLoading={searchForDecorationsLoading}
              showPopup={showPopup}
              closePopup={closePopup}
              activeDecoration={activeDecoration}
              setActiveDecoration={setActiveDecoration}
              activeDecorationIndex={activeDecorationIndex}
              setActiveDecorationIndex={setActiveDecorationIndex}
              userFavourites={user?.favourites.map(
                (decoration) => decoration.id
              )}
            />
          </div>
        </div>
      </div>
    </>
  );
};