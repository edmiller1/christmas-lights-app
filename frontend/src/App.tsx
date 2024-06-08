import { AppHeader, DecorationCard, Footer } from "@/components";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { SIGN_IN } from "@/graphql/mutations";
import {
  GET_DECORATIONS_BY_CITY,
  GET_DECORATIONS_BY_RATING,
  GET_USER,
} from "@/graphql/queries";
import { GetDecorationsByCity as GetDecorationsByCityData } from "@/graphql/queries/getDecorationsByCity/types";
import { GetDecorationByRating as GetDecorationsByRatingData } from "@/graphql/queries/getDecorationsByRating/types";
import {
  GetUser as GetUserData,
  GetUserArgs,
  Get_User,
} from "@/graphql/queries/getUser/types";
import {
  SignIn as SignInData,
  SignInArgs,
} from "@/graphql/mutations/signIn/types";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { AppHeaderLoading } from "@/components/AppHeader/components";
import { ListBullets, MapTrifold, Plus } from "@phosphor-icons/react";
import { DecorationsLoading, HomeMap } from "./pages/Home/components";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "./components/ui/carousel";
import hero from "./assets/hero image.jpg";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";
import { Button } from "./components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";

const mbApiKey = import.meta.env.VITE_MAPBOX_API_KEY;

function App() {
  const { getToken, isAuthenticated, user } = useKindeAuth();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<Get_User | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapLoading, setMapLoading] = useState<boolean>(false);
  const [currentPlace, setCurrentPlace] = useState<string>("");

  const [getUser, { loading: getUserLoading, refetch: refetchUser }] =
    useLazyQuery<GetUserData, GetUserArgs>(GET_USER, {
      variables: { input: { id: user?.id ? user.id : "" } },
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        setCurrentUser(data.getUser);
      },
    });

  const { data: decorationsByCityData, loading: decorationsByCityLoading } =
    useQuery<GetDecorationsByCityData>(GET_DECORATIONS_BY_CITY);

  const { data: decorationsByRatingData, loading: decorationsByRatingLoading } =
    useQuery<GetDecorationsByRatingData>(GET_DECORATIONS_BY_RATING);

  const decorationsByCity = decorationsByCityData?.getDecorationsByCity
    ? decorationsByCityData.getDecorationsByCity
    : null;

  const decorationsByRating = decorationsByRatingData?.getDecorationsByRating
    ? decorationsByRatingData.getDecorationsByRating
    : null;

  const [signIn] = useMutation<SignInData, SignInArgs>(SIGN_IN, {
    onCompleted: (data) => {
      if (localStorage.getItem("user")) {
        toast({
          variant: "default",
          title: "Signed in Successfully!",
        });
      }
      sessionStorage.setItem("token", data.signIn.token);
      localStorage.removeItem("user");
      getUser({ variables: { input: { id: data.signIn.id } } });
    },
  });

  const signInUser = async () => {
    const hasToken = (await getToken()) ?? "";
    if (hasToken) {
      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);

        const data = {
          input: {
            result: {
              id: user.id,
              name: `${user.given_name} ${user.family_name}`,
              email: user.email,
              photoURL: user.picture,
              token: (await getToken()) as string,
            },
          },
        };

        signIn({ variables: { input: data.input } });
      }
    }
    localStorage.removeItem("user");
  };

  const refetchUserData = () => {
    refetchUser();
  };

  const getCoords = async () => {
    if (navigator.geolocation) {
      await navigator.geolocation.getCurrentPosition((position) => {
        localStorage.setItem(
          "latitude",
          JSON.stringify(position.coords.latitude)
        );
        localStorage.setItem(
          "longitude",
          JSON.stringify(position.coords.longitude)
        );
      });

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${localStorage.getItem(
          "longitude"
        )},${localStorage.getItem("latitude")}.json?access_token=${mbApiKey}`
      );
      const jsonData = await response.json();
      const place = jsonData.features.find((item: any) =>
        item.id.includes("place")
      );
      setCurrentPlace(place.text);
    } else {
      return;
    }
  };

  const hasSession = async () => {
    const token = await getToken();
    if (!token) {
      sessionStorage.removeItem("token");
    }
  };

  useEffect(() => {
    getCoords();
  }, []);

  useEffect(() => {
    signInUser();
  }, [localStorage.getItem("user"), getToken()]);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (isAuthenticated && user && user.id && !userString) {
      getUser({ variables: { input: { id: user.id } } });
    }
  }, [user]);

  useEffect(() => {
    hasSession();
  }, [getToken]);

  if (decorationsByCityLoading || decorationsByRatingLoading) {
    return <DecorationsLoading />;
  }

  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden min-h-screen min-w-full">
        {getUserLoading ? (
          <AppHeaderLoading />
        ) : (
          <AppHeader
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
            currentPlace={currentPlace}
          />
        )}
        {showMap ? (
          <HomeMap
            setMapLoading={setMapLoading}
            userFavourites={currentUser?.favourites.map(
              (favourite) => favourite.id
            )}
          />
        ) : (
          <div className="z-10">
            <div className="absolute top-1/4 left-3 z-10 text-white text-center">
              <h1 className="text-2xl font-bold">
                Explore amazing Christmas decorations
              </h1>
              <h3 className="mt-10 text-lg">
                Search by name, city, address or explore via map
              </h3>
              <Link to={`/search?query=${currentPlace}`}>
                <h3 className="mt-10 underline">Explore now</h3>
              </Link>
            </div>
            <div className="relative">
              <Carousel
                plugins={[
                  Autoplay({
                    delay: 5000,
                  }),
                ]}
              >
                <CarouselContent>
                  {Array.from([1, 2, 3, 4]).map((item) => (
                    <CarouselItem key={item}>
                      <img
                        src={hero}
                        alt="image"
                        className="h-[28rem] brightness-75"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
            <div className="px-6 overflow-y-auto py-16">
              <h1 className="text-3xl font-bold">Explore Nearby Decorations</h1>
              {decorationsByCity && decorationsByCity.length > 0 ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 my-8">
                  {decorationsByCity.map((decoration, index) => (
                    <DecorationCard
                      key={decoration.id}
                      index={index}
                      isAuthenticated={isAuthenticated}
                      decoration={decoration}
                      decorations={decorationsByCity}
                      userFavourites={currentUser?.favourites.map(
                        (favourite) => favourite.id
                      )}
                      refetchUserData={refetchUserData}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              ) : null}
              <>
                {decorationsByRating && decorationsByRating.length > 0 ? (
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 my-8">
                    {decorationsByRating.map((decoration, index) => (
                      <DecorationCard
                        key={decoration.id}
                        index={index}
                        isAuthenticated={isAuthenticated}
                        decoration={decoration}
                        decorations={decorationsByRating}
                        userFavourites={currentUser?.favourites.map(
                          (favourite) => favourite.id
                        )}
                        refetchUserData={refetchUserData}
                        currentUser={currentUser}
                      />
                    ))}
                  </div>
                ) : null}
              </>
              <div className="w-full flex flex-col mt-20 mb-24">
                <div className="w-full">
                  <img
                    src="https://images.unsplash.com/photo-1543598098-622a5e218f43?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="image"
                    className="rounded-t-2xl h-[29rem] object-cover"
                  />
                </div>
                <div className="w-full h-full rounded-b-xl p-5 dark:bg-zinc-800">
                  <div className="flex items-center space-x-2">
                    <h2 className="flex text-3xl font-bold my-3">
                      Christmas Lights App
                      <Plus
                        color="#DC2626"
                        weight="bold"
                        size={28}
                        className="ml-2 mt-2"
                      />
                    </h2>
                  </div>
                  <h3 className="text-2xl my-3 font-semibold">
                    Explore and create more
                  </h3>
                  <p className="text-lg my-3 font-semibold">
                    Upload larger and more images, save more decorations, create
                    more routes and visit more decorations.
                  </p>
                  <Button className="mt-20 bg-ch-green hover:bg-ch-green-alt">
                    Get Premium
                  </Button>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold">FAQ's</h2>
                <div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        Where is Christmas Lights App available?
                      </AccordionTrigger>
                      <AccordionContent>
                        At this time, we are only available in Australia and New
                        Zealand. We do have plans for the future to expand to
                        other countries.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>
                        How much is Christmas Lights App premium?
                      </AccordionTrigger>
                      <AccordionContent>
                        Premium is currently $9 paid annually. This is due to
                        the service only being used mainly 2 months out of the
                        year.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>
                        Is the app free to use?
                      </AccordionTrigger>
                      <AccordionContent>
                        Yes! You can use the app for free, but there are
                        limitions to the number of decorations you can create,
                        save and the number of images you can upload.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>
          </div>
        )}
        {!showMap ? (
          <div className="fixed bottom-24 left-[41%] z-20">
            <button
              onClick={() => setShowMap(true)}
              className="flex items-center text-sm py-2 px-3 font-semibold rounded-full shadow-lg text-white bg-ch-green z-50 hover:scale-110 transition-all"
            >
              Map
              <MapTrifold
                size={24}
                weight="fill"
                color="#ffffff"
                className="ml-2"
              />
            </button>
          </div>
        ) : (
          <div className="fixed bottom-24 left-[41%] z-20">
            <button
              disabled={mapLoading}
              onClick={() => setShowMap(false)}
              className="flex items-center text-sm py-2 px-3 font-semibold rounded-full shadow-lg text-white bg-ch-green z-[98] hover:scale-110 transition-all"
            >
              List
              <ListBullets size={24} color="#ffffff" className="ml-2" />
            </button>
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden sm:block min-h-screen">
        {getUserLoading ? (
          <AppHeaderLoading />
        ) : (
          <AppHeader
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
            currentPlace={currentPlace}
          />
        )}
        {showMap ? (
          <HomeMap
            setMapLoading={setMapLoading}
            userFavourites={currentUser?.favourites.map(
              (favourite) => favourite.id
            )}
          />
        ) : (
          <div>
            <div className="absolute top-1/2 left-64 z-40 text-white text-center">
              <h1 className="text-6xl font-bold">
                Explore amazing Christmas decorations
              </h1>
              <h3 className="mt-10 text-2xl">
                Search by name, city, address or explore via map
              </h3>
              <Link to={`/search?query=${currentPlace}`}>
                <h3 className="mt-10 underline text-xl">Explore now</h3>
              </Link>
            </div>
            <div className="relative">
              <Carousel
                plugins={[
                  Autoplay({
                    delay: 5000,
                  }),
                ]}
              >
                <CarouselContent>
                  {Array.from([1, 2, 3, 4]).map((item) => (
                    <CarouselItem key={item}>
                      <img
                        src={hero}
                        alt="image"
                        className="h-full w-full brightness-75"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
            <div className="md:px-10 xl:px-24 2xl:px-32 py-12">
              <h1 className="text-4xl font-bold">Explore Nearby Decorations</h1>
              {decorationsByCity && decorationsByCity.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 xl:gap-x-8 gap-y-10 my-8">
                  {decorationsByCity.map((decoration, index) => (
                    <DecorationCard
                      key={decoration.id}
                      index={index}
                      isAuthenticated={isAuthenticated}
                      decoration={decoration}
                      decorations={decorationsByCity}
                      userFavourites={currentUser?.favourites.map(
                        (favourite) => favourite.id
                      )}
                      refetchUserData={refetchUserData}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              ) : null}
              <>
                {decorationsByRating && decorationsByRating.length > 0 ? (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 xl:gap-x-8 gap-y-10 my-8">
                    {decorationsByRating.map((decoration, index) => (
                      <DecorationCard
                        key={decoration.id}
                        index={index}
                        isAuthenticated={isAuthenticated}
                        decoration={decoration}
                        decorations={decorationsByRating}
                        userFavourites={currentUser?.favourites.map(
                          (favourite) => favourite.id
                        )}
                        refetchUserData={refetchUserData}
                        currentUser={currentUser}
                      />
                    ))}
                  </div>
                ) : null}
              </>
              <div className="w-full flex mt-20 mb-32">
                <div className="w-1/2 ">
                  <img
                    src="https://images.unsplash.com/photo-1543598098-622a5e218f43?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="image"
                    className="rounded-l-2xl h-[29rem] object-cover"
                  />
                </div>
                <div className="w-1/2 h-[29rem] rounded-r-xl px-24 py-10 dark:bg-zinc-800">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-3xl font-bold my-3">
                      Christmas Lights App Premium
                    </h2>
                    <Plus color="#DC2626" weight="bold" size={24} />
                  </div>
                  <h3 className="text-2xl my-3 font-semibold">
                    Explore and create more
                  </h3>
                  <p className="text-lg mr-32 my-3 font-semibold">
                    Upload larger and more images, save more decorations, create
                    more routes and visit more decorations.
                  </p>
                  <Button className="mt-20 bg-ch-green hover:bg-ch-green-alt">
                    Get Premium
                  </Button>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold">FAQ's</h2>
                <div className="mr-48">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        Where is Christmas Lights App available?
                      </AccordionTrigger>
                      <AccordionContent>
                        At this time, we are only available in Australia and New
                        Zealand. We do have plans for the future to expand to
                        other countries.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>
                        How much is Christmas Lights App premium?
                      </AccordionTrigger>
                      <AccordionContent>
                        Premium is currently $9 paid annually. This is due to
                        the service only being used mainly 2 months out of the
                        year.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>
                        Is the app free to use?
                      </AccordionTrigger>
                      <AccordionContent>
                        Yes! You can use the app for free, but there are
                        limitions to the number of decorations you can create,
                        save and the number of images you can upload.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showMap ? (
          <div className="fixed bottom-24 left-[47.5%] z-20">
            <button
              onClick={() => setShowMap(true)}
              className="flex items-center text-sm py-2 px-3 font-semibold rounded-full shadow-lg text-white bg-ch-green hover:scale-110 transition-all"
            >
              Map
              <MapTrifold
                size={24}
                weight="fill"
                color="#ffffff"
                className="ml-2"
              />
            </button>
          </div>
        ) : (
          <div className="fixed bottom-24 left-[47.5%] z-20">
            <button
              disabled={mapLoading}
              onClick={() => setShowMap(false)}
              className="flex items-center text-sm py-2 px-3 font-semibold rounded-full shadow-lg text-white bg-ch-green hover:scale-110 transition-all"
            >
              List
              <ListBullets size={24} color="#ffffff" className="ml-2" />
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default App;
