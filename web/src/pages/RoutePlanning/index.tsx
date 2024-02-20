import React, { useEffect, useRef, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  GET_DECORATIONS_VIA_CITY,
  GET_DECORATIONS_VIA_COUNTRY,
  GET_DECORATIONS_VIA_REGION,
  GET_DECORATIONS_VIA_SEARCH,
  GET_USER,
} from "@/graphql/queries";
import {
  ADD_DECORATION_TO_ROUTE,
  CREATE_ROUTE,
  DELETE_ROUTE,
  FAVOURITE_DECORATION,
  REMOVE_DECORATION_FROM_ROUTE,
  UNFAVOURITE_DECORATION,
} from "@/graphql/mutations";
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
  GetDecorationsViaSearch as GetDecorationsViaSearchData,
  GetDecorationsViaSearchArgs,
  Get_Decorations_Via_Search,
} from "@/graphql/queries/getDecorationsViaSearch/types";
import {
  GetUser as GetUserData,
  GetUserArgs,
} from "@/graphql/queries/getUser/types";
import {
  FavouriteDecoration as FavouriteDecorationData,
  FavouriteDecorationArgs,
} from "@/graphql/mutations/favouriteDecoration/types";
import {
  UnfavouriteDecoration as UnfavouriteDecorationData,
  UnfavouriteDecorationArgs,
} from "@/graphql/mutations/unfavouriteDecoration/types";
import {
  CreateRoute as CreateRouteData,
  CreateRouteArgs,
} from "@/graphql/mutations/createRoute/types";
import {
  AddDecorationToRoute as AddDecorationToRouteData,
  AddDecorationToRouteArgs,
} from "@/graphql/mutations/addDecorationToRoute/types";
import {
  DeleteRoute as DeleteRouteData,
  DeleteRouteArgs,
} from "@/graphql/mutations/deleteRoute/types";
import {
  RemoveDecorationFromRoute as RemoveDecorationFromRouteData,
  RemoveDecorationfromRouteArgs,
} from "@/graphql/mutations/removeDecorationFromRoute/types";
import { Link, redirect, useNavigate } from "react-router-dom";
import { UserCircle } from "@phosphor-icons/react";
import {
  CreateRouteModal,
  DecorationPopup,
  DeleteRouteModal,
  RemoveDecorationModal,
  RouteDirections,
  RouteMap,
  RoutePlanningNav,
  SecondaryNav,
} from "./components";
import { MenuItems, ThemeToggle } from "@/components/AppHeader/components";
import { useUserData } from "@/lib/hooks";
import { auth } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Decoration, Route, Step, ViewState } from "@/lib/types";
import { MapRef } from "react-map-gl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";
import { MobileDecorationPopup } from "./components/MobileDecorationPopup";

const mbApiKey = import.meta.env.VITE_MAPBOX_API_KEY;

const initialViewState = {
  latitude: localStorage.getItem("latitude")
    ? localStorage.getItem("latitude")
    : -40.8536,
  longitude: localStorage.getItem("longitude")
    ? localStorage.getItem("longitude")
    : 155.4537,
  zoom: localStorage.getItem("latitude") ? 6 : 4,
  bearing: 0,
  pitch: 0,
};

export const RoutePlanning = () => {
  const { toast } = useToast();
  const currentUser = useUserData();
  const navigate = useNavigate();

  const mapRef = useRef<MapRef>();
  const dragDecoration = useRef<number>(0);
  const draggedOverDecoration = useRef<number>(0);

  //Toggles
  const [isDeleteRouteOpen, setIsDeleteRouteOpen] = useState<boolean>(false);
  const [isCreateRouteOpen, setIsCreateRouteOpen] = useState<boolean>(false);
  const [isRemoveDecorationOpen, setIsRemoveDecorationOpen] =
    useState<boolean>(false);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [showActiveDecoration, setShowActiveDecoration] =
    useState<boolean>(false);
  //Nav
  const [selectedIcon, setSelectedIcon] = useState<string>("map");

  const [userFavourites, setUserFavourites] = useState<
    Decoration[] | undefined
  >();
  const [decorations, setDecorations] = useState<
    | Get_Decorations_Via_City[]
    | Get_Decorations_Via_Country[]
    | Get_Decorations_Via_Region[]
    | Get_Decorations_Via_Search[]
    | null
  >(null);
  const [viewState, setViewState] = useState<ViewState>(initialViewState);
  const [activeDecoration, setActiveDecoration] = useState<
    | Get_Decorations_Via_City
    | Get_Decorations_Via_Country
    | Get_Decorations_Via_Region
    | Decoration
  >();
  const [activeDecorationIndex, setActiveDecorationIndex] = useState<number>(0);
  const [routeToDelete, setRouteToDelete] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [decorationToRemove, setDecorationToRemove] = useState<string>("");
  const [removalRoute, setRemovalRoute] = useState<string>("");

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeDecorations, setRouteDecorations] = useState<Decoration[] | null>(
    null
  );

  const [currentlyOnRoute, setCurrentlyOnRoute] = useState<boolean>(false);
  const [routeLayer, setRouteLayer] = useState<any>("");
  const [routeGeoJson, setRouteGeoJson] = useState<{
    type: string;
    coordinates: number[][];
  } | null>(null);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);
  const [fetchRouteError, setFetchRouteError] = useState<boolean>(false);
  const [routeDirections, setRouteDirections] = useState<Step[]>([]);

  const refs = decorations?.reduce((acc: any, value: any) => {
    acc[value.id] = React.createRef();
    return acc;
  }, {});

  const {
    data: getUserData,
    loading: getUserLoading,
    refetch: refetchUser,
  } = useQuery<GetUserData, GetUserArgs>(GET_USER, {
    variables: { input: { id: currentUser?.uid ? currentUser.uid : "" } },
    onCompleted: (data) => {
      setUserFavourites(data.getUser.favourites);
    },
  });

  const [
    getDecorationsViaCountry,
    { loading: getDecorationsViaCountryLoading },
  ] = useLazyQuery<GetDecorationsViaCountryData, GetDecorationsViaCountryArgs>(
    GET_DECORATIONS_VIA_COUNTRY,
    {
      onCompleted: (data) => {
        setDecorations(data.getDecorationsViaCountry);
      },
    }
  );

  const [getDecorationsViaCity, { loading: getDecorationsViaCityLoading }] =
    useLazyQuery<GetDecorationsViaCityData, GetDecorationsViaCityArgs>(
      GET_DECORATIONS_VIA_CITY,
      {
        onCompleted: (data) => {
          setDecorations(data.getDecorationsViaCity);
        },
      }
    );

  const [getDecorationsViaRegion, { loading: getDecorationsViaRegionLoading }] =
    useLazyQuery<GetDecorationsViaRegionData, GetDecorationsViaRegionArgs>(
      GET_DECORATIONS_VIA_REGION,
      {
        onCompleted: (data) => {
          setDecorations(data.getDecorationsViaRegion);
        },
      }
    );

  const [getDecorationsViaSearch, { loading: getDecorationsViaSearchLoading }] =
    useLazyQuery<GetDecorationsViaSearchData, GetDecorationsViaSearchArgs>(
      GET_DECORATIONS_VIA_SEARCH,
      {
        onCompleted: (data) => {
          setDecorations(data.getDecorationsViaSearch);
        },
      }
    );

  const [favouriteDecoration, { loading: favouriteDecorationLoading }] =
    useMutation<FavouriteDecorationData, FavouriteDecorationArgs>(
      FAVOURITE_DECORATION,
      {
        onCompleted: () => {
          refetchUser();
          toast({
            variant: "success",
            title: "Success 🎉",
            description: "Decoration added to favourites",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error 😬",
            description:
              "Failed to add decoration to favourites. Please try again.",
          });
        },
      }
    );

  const [unFavouriteDecoration, { loading: unFavouriteDecorationLoading }] =
    useMutation<UnfavouriteDecorationData, UnfavouriteDecorationArgs>(
      UNFAVOURITE_DECORATION,
      {
        onCompleted: () => {
          refetchUser();
          toast({
            variant: "success",
            title: "Success 🎉",
            description: "Decoration removed from favourites",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error 😬",
            description:
              "Failed to remove decoration to favourites. Please try again.",
          });
        },
      }
    );

  const [createRoute, { loading: createRouteLoading }] = useMutation<
    CreateRouteData,
    CreateRouteArgs
  >(CREATE_ROUTE, {
    onCompleted: () => {
      setIsCreateRouteOpen(false);
      refetchUser();
      toast({
        variant: "success",
        title: "Success 🎉",
        description: "Created a new route",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error 😬",
        description: "Failed to create a new route. Please try again.",
      });
    },
  });

  const [addDecorationToRoute, { loading: addDecorationToRouteLoading }] =
    useMutation<AddDecorationToRouteData, AddDecorationToRouteArgs>(
      ADD_DECORATION_TO_ROUTE,
      {
        onCompleted: () => {
          refetchUser();
          toast({
            variant: "success",
            title: "Success 🎉",
            description: "Decoration added to route.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error 😬",
            description: "Failed to add decoration to route. Please try again.",
          });
        },
      }
    );

  const [deleteRoute, { loading: deleteRouteLoading }] = useMutation<
    DeleteRouteData,
    DeleteRouteArgs
  >(DELETE_ROUTE, {
    onCompleted: () => {
      setIsDeleteRouteOpen(false);
      setIsEditing(false);
      refetchUser();
      toast({
        variant: "success",
        title: "Success 🎉",
        description: "Route deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error 😬",
        description: "Failed to delete route. Please try again.",
      });
    },
  });

  const [
    removeDecorationFromRoute,
    { loading: removeDecorationFromRouteLoading },
  ] = useMutation<RemoveDecorationFromRouteData, RemoveDecorationfromRouteArgs>(
    REMOVE_DECORATION_FROM_ROUTE,
    {
      onCompleted: () => {
        refetchUser();
        setIsRemoveDecorationOpen(false);
        toast({
          variant: "success",
          title: "Success 🎉",
          description: "Decoration removed from route.",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error 😬",
          description:
            "Failed to remove decoration from route. Please try again.",
        });
      },
    }
  );

  const searchForDecorations = (searchTerm: string) => {
    getDecorationsViaSearch({
      variables: { input: { searchTerm: searchTerm } },
    });
  };

  const addDecorationToARoute = (routeId: string, decorationId: string) => {
    addDecorationToRoute({
      variables: { input: { decorationId: decorationId, routeId: routeId } },
    });
  };

  const deleteARoute = (routeId: string) => {
    deleteRoute({ variables: { input: { routeId: routeId } } });
  };

  const openDeleteRouteModal = (routeId: string) => {
    setRouteToDelete(routeId);
    setIsDeleteRouteOpen(true);
  };

  const removeDecorationFromARoute = (
    routeId: string,
    decorationId: string
  ) => {
    removeDecorationFromRoute({
      variables: { input: { decorationId: decorationId, routeId: routeId } },
    });
  };

  const openRemoveDecorationModal = (decorationId: string, routeId: string) => {
    setDecorationToRemove(decorationId);
    setRemovalRoute(routeId);
    setIsRemoveDecorationOpen(true);
  };

  const createNewRoute = (name: string, decorationId: string | undefined) => {
    createRoute({
      variables: {
        input: {
          name: name,
          decorationId: decorationId ? decorationId : undefined,
        },
      },
    });
  };

  const addDecorationToFavourites = (decorationId: string) => {
    if (!currentUser) {
      toast({
        variant: "default",
        title: "Not currently signed in.",
        description: "Create an account to like decorations.",
        action: (
          <ToastAction altText="Sign Up" onClick={() => navigate("/signin")}>
            Sign Up
          </ToastAction>
        ),
      });
    } else {
      favouriteDecoration({ variables: { input: { id: decorationId } } });
    }
  };

  const removeDecorationFromFavourites = (decorationId: string) => {
    if (!currentUser) {
      toast({
        variant: "default",
        title: "Not currently signed in.",
        description: "Create an account to like decorations.",
        action: (
          <ToastAction altText="Sign Up" onClick={() => navigate("/signin")}>
            Sign Up
          </ToastAction>
        ),
      });
    } else {
      unFavouriteDecoration({ variables: { input: { id: decorationId } } });
    }
  };

  const signOut = async () => {
    await auth
      .signOut()
      .then(() => {
        sessionStorage.removeItem("token");
        toast({
          variant: "success",
          title: "Success 🎉",
          description: "Signed out successfully!",
        });
        redirect("/");
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Error 😬",
          description: "Failed to sign out. Please try again.",
        });
      });
  };

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    setRouteDecorations(route.decorations);
  };

  const handleSortRoute = () => {
    if (routeDecorations) {
      const routeDecorationsCopy = [...routeDecorations];
      const temp = routeDecorationsCopy[dragDecoration.current];
      routeDecorationsCopy[dragDecoration.current] =
        routeDecorationsCopy[draggedOverDecoration.current];
      routeDecorationsCopy[draggedOverDecoration.current] = temp;
      setRouteDecorations(routeDecorationsCopy);
    }
  };

  const changeRoute = (icon: string) => {
    setSelectedIcon(icon);
  };

  const handleScroll = (decorationId: string) => {
    refs[decorationId].current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleDecorationSelect = (
    decoration:
      | Get_Decorations_Via_City
      | Get_Decorations_Via_Country
      | Get_Decorations_Via_Region
      | Get_Decorations_Via_Search
      | Decoration,
    index: number
  ) => {
    mapRef.current?.flyTo({
      center: [decoration.longitude, decoration.latitude],
      zoom: 12,
      duration: 2000,
    });
    setActiveDecoration(decoration);
    setActiveDecorationIndex(index);
  };

  const discardRoute = () => {
    setIsCancelOpen(false);
    setIsCreateRouteOpen(false);
  };

  const getRouteData = async (coordinates: number[][] | undefined) => {
    const userLocation = [
      Number(localStorage.getItem("longitude")),
      Number(localStorage.getItem("latitude")),
    ];
    coordinates!.splice(0, 0, userLocation);
    console.log(coordinates);
    const result = coordinates?.map((coord) => coord.join(",")).join(";");
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${result}?geometries=geojson&access_token=${mbApiKey}&waypoints_per_route=true&steps=true`
    );
    const jsonData = await response.json();
    console.log(jsonData);
    if (jsonData.code === "NoRoute") {
      setFetchRouteError(true);
      toast({
        variant: "destructive",
        title: "Error 😬",
        description:
          "No route found for decorations and your current location. Make sure the decorations and your location are in the same area.",
      });
    } else {
      setFetchRouteError(false);
      const route = jsonData.routes[0];
      const newRouteLayer = {
        id: "route",
        type: "line",
        source: {
          type: "geojson",
          data: route.geometry,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#28a177",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      };

      const steps = jsonData.routes[0].legs.map((leg: any) => leg.steps);
      const combinedSteps = steps.reduce((result: any, currentArray: any) => {
        return result.concat(currentArray);
      }, []);
      console.log(combinedSteps);
      setRouteDistance(route.distance);
      setRouteDuration(route.duration);
      setRouteLayer(newRouteLayer);
      setRouteGeoJson(route.geometry);
      setRouteDirections(combinedSteps);
    }
  };

  const startRoute = () => {
    if (!fetchRouteError) {
      setCurrentlyOnRoute(true);
      mapRef.current?.flyTo({
        center: [
          Number(localStorage.getItem("longitude")),
          Number(localStorage.getItem("latitude")),
        ],
        zoom: 14,
        duration: 2000,
      });
    }
  };

  const selectStep = (location: number[]) => {
    mapRef.current?.flyTo({
      center: location as any,
      zoom: 17,
      duration: 2000,
    });
  };

  const endRoute = () => {
    setCurrentlyOnRoute(false);
    mapRef.current?.flyTo({
      center: [
        localStorage.getItem("longitude")
          ? Number(localStorage.getItem("longitude"))
          : 161.016257,
        localStorage.getItem("latitude")
          ? Number(localStorage.getItem("latitude"))
          : -37.715713,
      ],
      zoom: 8,
      duration: 2000,
    });
  };

  const getUserCoords = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        localStorage.setItem(
          "latitude",
          JSON.stringify(position.coords.latitude)
        );
        localStorage.setItem(
          "longitude",
          JSON.stringify(position.coords.longitude)
        );
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error 😬",
        description:
          "Couldn't get your location. Route Planning features requires location services. Please try again.",
      });
    }
  };

  // useEffect(() => {
  //   getUserCoords();
  // }, []);

  useEffect(() => {
    const getDecorationData = setTimeout(() => {
      if (viewState && viewState.zoom <= 6 && !currentlyOnRoute) {
        getDecorationsViaCountry({
          variables: {
            input: {
              latitude: viewState.latitude?.toString() as string,
              longitude: viewState.longitude?.toString() as string,
            },
          },
        });
      } else if (
        viewState &&
        viewState.zoom > 6 &&
        viewState.zoom <= 10 &&
        !currentlyOnRoute
      ) {
        getDecorationsViaRegion({
          variables: {
            input: {
              latitude: viewState.latitude?.toString() as string,
              longitude: viewState.longitude?.toString() as string,
            },
          },
        });
      } else if (!currentlyOnRoute) {
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
  }, [viewState]);

  useEffect(() => {
    if (activeDecoration) {
      setShowActiveDecoration(true);
    } else {
      setShowActiveDecoration(false);
    }
  }, [activeDecoration]);

  const user = getUserData?.getUser ? getUserData.getUser : null;

  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden h-screen w-full">
        <RoutePlanningNav
          changeRoute={changeRoute}
          selectedIcon={selectedIcon}
          user={user}
          activeDecoration={activeDecoration}
          decorations={decorations}
          getDecorationsViaCityLoading={getDecorationsViaCityLoading}
          getDecorationsViaCountryLoading={getDecorationsViaCountryLoading}
          getDecorationsViaRegionLoading={getDecorationsViaRegionLoading}
          getDecorationsViaSearchLoading={getDecorationsViaSearchLoading}
          handleDecorationSelect={handleDecorationSelect}
          refs={refs}
          searchForDecorations={searchForDecorations}
          userFavourites={user?.favourites}
          currentUser={currentUser}
          currentlyOnRoute={currentlyOnRoute}
          dragDecoration={dragDecoration}
          draggedOverDecoration={draggedOverDecoration}
          endRoute={endRoute}
          fetchRouteError={fetchRouteError}
          getRouteData={getRouteData}
          getUserLoading={getUserLoading}
          handleSelectRoute={handleSelectRoute}
          handleSortRoute={handleSortRoute}
          isEditing={isEditing}
          openDeleteRouteModal={openDeleteRouteModal}
          openRemoveDecorationModal={openRemoveDecorationModal}
          routeDecorations={routeDecorations}
          routeDistance={routeDistance}
          routeDuration={routeDuration}
          selectedRoute={selectedRoute}
          setIsCreateRouteOpen={setIsCreateRouteOpen}
          setIsEditing={setIsEditing}
          startRoute={startRoute}
          userRoutes={user?.routes}
          userHistory={user?.history}
        />
        <RouteMap
          setViewState={setViewState}
          viewState={viewState}
          decorations={decorations}
          activeDecoration={activeDecoration}
          setActiveDecoration={setActiveDecoration}
          activeDecorationIndex={activeDecorationIndex}
          setActiveDecorationIndex={setActiveDecorationIndex}
          getDecorationsViaCountryLoading={getDecorationsViaCountryLoading}
          getDecorationsViaCityLoading={getDecorationsViaCityLoading}
          getDecorationsViaRegionLoading={getDecorationsViaRegionLoading}
          mapRef={mapRef}
          handleScroll={handleScroll}
          currentlyOnRoute={currentlyOnRoute}
          routeLayer={routeLayer}
          routeGeoJson={routeGeoJson}
          routeDecorations={routeDecorations}
        />

        {currentlyOnRoute ? (
          <RouteDirections
            routeDistance={routeDistance}
            routeDuration={routeDuration}
            routeDirections={routeDirections}
            selectStep={selectStep}
          />
        ) : null}
      </div>

      {/* Desktop */}
      <div className="hidden sm:block sm:min-h-screen">
        <RoutePlanningNav
          changeRoute={changeRoute}
          selectedIcon={selectedIcon}
          user={user}
          activeDecoration={activeDecoration}
          decorations={decorations}
          getDecorationsViaCityLoading={getDecorationsViaCityLoading}
          getDecorationsViaCountryLoading={getDecorationsViaCountryLoading}
          getDecorationsViaRegionLoading={getDecorationsViaRegionLoading}
          getDecorationsViaSearchLoading={getDecorationsViaSearchLoading}
          handleDecorationSelect={handleDecorationSelect}
          refs={refs}
          searchForDecorations={searchForDecorations}
          userFavourites={user?.favourites}
          currentUser={currentUser}
          currentlyOnRoute={currentlyOnRoute}
          dragDecoration={dragDecoration}
          draggedOverDecoration={draggedOverDecoration}
          endRoute={endRoute}
          fetchRouteError={fetchRouteError}
          getRouteData={getRouteData}
          getUserLoading={getUserLoading}
          handleSelectRoute={handleSelectRoute}
          handleSortRoute={handleSortRoute}
          isEditing={isEditing}
          openDeleteRouteModal={openDeleteRouteModal}
          openRemoveDecorationModal={openRemoveDecorationModal}
          routeDecorations={routeDecorations}
          routeDistance={routeDistance}
          routeDuration={routeDuration}
          selectedRoute={selectedRoute}
          setIsCreateRouteOpen={setIsCreateRouteOpen}
          setIsEditing={setIsEditing}
          startRoute={startRoute}
          userRoutes={user?.routes}
          userHistory={user?.history}
        />
        {/* Secondary column */}
        <SecondaryNav
          activeDecoration={activeDecoration}
          activeDecorationIndex={activeDecorationIndex}
          decorations={decorations}
          setActiveDecoration={setActiveDecoration}
          setActiveDecorationIndex={setActiveDecorationIndex}
          selectedIcon={selectedIcon}
          getDecorationsViaCountryLoading={getDecorationsViaCountryLoading}
          getDecorationsViaCityLoading={getDecorationsViaCityLoading}
          getDecorationsViaRegionLoading={getDecorationsViaRegionLoading}
          handleDecorationSelect={handleDecorationSelect}
          refs={refs}
          userFavourites={user?.favourites}
          userRoutes={user?.routes}
          getUserLoading={getUserLoading}
          currentUser={currentUser}
          userHistory={user?.history}
          setIsCreateRouteOpen={setIsCreateRouteOpen}
          openDeleteRouteModal={openDeleteRouteModal}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          openRemoveDecorationModal={openRemoveDecorationModal}
          getRouteData={getRouteData}
          routeDuration={routeDuration}
          routeDistance={routeDistance}
          startRoute={startRoute}
          dragDecoration={dragDecoration}
          draggedOverDecoration={draggedOverDecoration}
          handleSortRoute={handleSortRoute}
          selectedRoute={selectedRoute}
          routeDecorations={routeDecorations}
          handleSelectRoute={handleSelectRoute}
          fetchRouteError={fetchRouteError}
          currentlyOnRoute={currentlyOnRoute}
          endRoute={endRoute}
          searchForDecorations={searchForDecorations}
          getDecorationsViaSearchLoading={getDecorationsViaSearchLoading}
          changeRoute={changeRoute}
        />

        {/* Main column */}
        <main className="ml-[29rem] w-[75.8vw] h-screen relative">
          <RouteMap
            setViewState={setViewState}
            viewState={viewState}
            decorations={decorations}
            activeDecoration={activeDecoration}
            setActiveDecoration={setActiveDecoration}
            activeDecorationIndex={activeDecorationIndex}
            setActiveDecorationIndex={setActiveDecorationIndex}
            getDecorationsViaCountryLoading={getDecorationsViaCountryLoading}
            getDecorationsViaCityLoading={getDecorationsViaCityLoading}
            getDecorationsViaRegionLoading={getDecorationsViaRegionLoading}
            mapRef={mapRef}
            handleScroll={handleScroll}
            currentlyOnRoute={currentlyOnRoute}
            routeLayer={routeLayer}
            routeGeoJson={routeGeoJson}
            routeDecorations={routeDecorations}
          />
          {currentlyOnRoute ? (
            <RouteDirections
              routeDistance={routeDistance}
              routeDuration={routeDuration}
              routeDirections={routeDirections}
              selectStep={selectStep}
            />
          ) : null}
        </main>
        <div className="absolute top-5 right-16 z-50 cursor-pointer">
          {currentUser ? (
            <MenuItems signOut={signOut} user={user} />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <UserCircle
                  size={40}
                  weight="fill"
                  className="cursor-pointer text-ch-dark"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mt-1 w-56" align="end" forceMount>
                <ThemeToggle />
                <Link to="/signin">
                  <DropdownMenuItem>Log in / Sign up</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {activeDecoration ? (
          <DecorationPopup
            activeDecoration={activeDecoration}
            setActiveDecoration={setActiveDecoration}
            userFavourites={user?.favourites.map((decoration) => decoration.id)}
            addDecorationToFavourites={addDecorationToFavourites}
            removeDecorationFromFavourites={removeDecorationFromFavourites}
            favouriteDecorationLoading={favouriteDecorationLoading}
            unFavouriteDecorationLoading={unFavouriteDecorationLoading}
            userRoutes={user?.routes}
            currentUser={currentUser}
            setIsCreateRouteOpen={setIsCreateRouteOpen}
            addDecorationToARoute={addDecorationToARoute}
            addDecorationToRouteLoading={addDecorationToRouteLoading}
            showActiveDecoration={showActiveDecoration}
            setShowActiveDecoration={setShowActiveDecoration}
          />
        ) : null}
        <CreateRouteModal
          isCreateRouteOpen={isCreateRouteOpen}
          isCancelOpen={isCancelOpen}
          setIsCancelOpen={setIsCancelOpen}
          discardRoute={discardRoute}
          createNewRoute={createNewRoute}
          activeDecoration={activeDecoration}
          createRouteLoading={createRouteLoading}
        />
        <DeleteRouteModal
          isDeleteRouteOpen={isDeleteRouteOpen}
          setIsDeleteRouteOpen={setIsDeleteRouteOpen}
          deleteARoute={deleteARoute}
          routeToDelete={routeToDelete}
          deleteRouteLoading={deleteRouteLoading}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
        <RemoveDecorationModal
          decorationToRemove={decorationToRemove}
          removalRoute={removalRoute}
          isRemoveDecorationOpen={isRemoveDecorationOpen}
          setIsRemoveDecorationOpen={setIsRemoveDecorationOpen}
          removeDecorationFromARoute={removeDecorationFromARoute}
          removeDecorationFromRouteLoading={removeDecorationFromRouteLoading}
        />
        <MobileDecorationPopup
          activeDecoration={activeDecoration}
          setActiveDecoration={setActiveDecoration}
          userFavourites={user?.favourites.map((decoration) => decoration.id)}
          addDecorationToFavourites={addDecorationToFavourites}
          removeDecorationFromFavourites={removeDecorationFromFavourites}
          favouriteDecorationLoading={favouriteDecorationLoading}
          unFavouriteDecorationLoading={unFavouriteDecorationLoading}
          userRoutes={user?.routes}
          currentUser={currentUser}
          setIsCreateRouteOpen={setIsCreateRouteOpen}
          addDecorationToARoute={addDecorationToARoute}
          addDecorationToRouteLoading={addDecorationToRouteLoading}
          showActiveDecoration={showActiveDecoration}
          setShowActiveDecoration={setShowActiveDecoration}
        />
      </div>
    </>
  );
};
