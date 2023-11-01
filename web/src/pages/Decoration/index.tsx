import { useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@apollo/client";
import {
  EDIT_DECORATION,
  FAVOURITE_DECORATION,
  UNFAVOURITE_DECORATION,
} from "@/graphql/mutations";
import {
  EditDecoration as EditDecorationData,
  EditDecorationArgs,
} from "@/graphql/mutations/editDecoration/types";
import {
  FavouriteDecoration as FavouriteDecorationData,
  FavouriteDecorationArgs,
} from "@/graphql/mutations/favouriteDecoration/types";
import {
  UnfavouriteDecoration as UnfavouriteDecorationData,
  UnfavouriteDecorationArgs,
} from "@/graphql/mutations/unfavouriteDecoration/types";
import { GET_DECORATION, GET_USER } from "@/graphql/queries";
import {
  GetDecoration as GetDecorationData,
  GetDecorationArgs,
} from "@/graphql/queries/getDecoration/types";
import {
  GetUser as GetUserData,
  GetUserArgs,
} from "@/graphql/queries/getUser/types";
import { NotFound } from "..";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  DecorationLoading,
  DecorationMenu,
  DecorationRatings,
  DecorationUserMenu,
  EditDecorationModal,
  ImagesGrid,
  ImagesOverlay,
  RateButton,
  SaveButton,
  ShareDecoration,
  VerifiedPopOver,
} from "./components";
import {
  CaretLeft,
  CaretRight,
  CircleNotch,
  CircleWavyCheck,
  Heart,
  Share,
  ShootingStar,
  Star,
  WarningCircle,
} from "@phosphor-icons/react";
import { AppHeaderLoading } from "@/components/AppHeader/components";
import { AppHeader } from "@/components";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

export const Decoration = () => {
  const navigate = useNavigate();
  const { decorationId } = useParams();
  const currentUser = useUser();
  const { toast } = useToast();

  const [editDecoration, { loading: editDecorationLoading }] = useMutation<
    EditDecorationData,
    EditDecorationArgs
  >(EDIT_DECORATION, {
    onCompleted(data) {
      toast({
        variant: "success",
        title: "Success 🎉",
        description: "Decoration edited successfully!",
      });
      setCurrentImage(decoration?.images[0]);
      setIsEditOpen(false);
      getDecorationRefetch({ input: { id: data.editDecoration.id } });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Oh oh!",
        description: `Failed to edit decoration. ${error}`,
      });
    },
  });

  const [favouriteDecoration, { loading: favouriteDecorationLoading }] =
    useMutation<FavouriteDecorationData, FavouriteDecorationArgs>(
      FAVOURITE_DECORATION,
      {
        onCompleted: (data) => {
          toast({
            variant: "success",
            title: "Success 🎉",
            description: "Decoration saved!",
          });
          getUserRefetch({ input: { id: data.favouriteDecoration.id } });
        },
      }
    );

  const [unfavouriteDecoration, { loading: unfavouriteDecorationLoading }] =
    useMutation<UnfavouriteDecorationData, UnfavouriteDecorationArgs>(
      UNFAVOURITE_DECORATION,
      {
        onCompleted: (data) => {
          toast({
            variant: "success",
            title: "Success 🎉",
            description: "Decoration removed from favourites!",
          });
          getUserRefetch({ input: { id: data.unfavouriteDecoration.id } });
        },
      }
    );

  const {
    data: getUserData,
    loading: getUserLoading,
    refetch: getUserRefetch,
  } = useQuery<GetUserData, GetUserArgs>(GET_USER, {
    variables: { input: { id: currentUser?.id ? currentUser.id : "" } },
  });

  const user = getUserData?.getUser ? getUserData.getUser : null;

  const {
    data: getDecorationData,
    loading: getDecorationLoading,
    error: getDecorationError,
    refetch: getDecorationRefetch,
  } = useQuery<GetDecorationData, GetDecorationArgs>(GET_DECORATION, {
    variables: { input: { id: decorationId! } },
    onCompleted: (data) => {
      setCurrentImage(data.getDecoration.images[0]);
    },
  });

  const decoration = getDecorationData?.getDecoration
    ? getDecorationData?.getDecoration
    : null;

  //Mobile
  const [showRatings, setShowRatings] = useState<boolean>(false);
  const [showShareOptions, setShowShareOptions] = useState<boolean>(false);

  //Desktop

  //Both
  const [showImageOverlay, setShowImageOverlay] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<
    { id: string; url: string } | undefined
  >();
  const [currentStep, setCurrentStep] = useState<number>(1);

  const getImageIndex = (id: string | undefined) => {
    const index = decoration?.images.findIndex((image) => image.id === id);
    return index! + 1;
  };

  const nextImage = () => {
    if (currentImage && decoration) {
      const currentImageIndex = decoration.images.indexOf(currentImage);
      if (currentImageIndex === decoration.images.length - 1) {
        setCurrentImage(decoration.images[0]);
      } else {
        setCurrentImage(decoration.images[currentImageIndex + 1]);
      }
    }
  };

  const prevImage = () => {
    if (currentImage && decoration) {
      const currentImageIndex = decoration.images.indexOf(currentImage);
      if (currentImageIndex === 0) {
        setCurrentImage(decoration.images[decoration.images.length - 1]);
      } else {
        setCurrentImage(decoration.images[currentImageIndex - 1]);
      }
    }
  };

  const updateDecoration = (
    id: string,
    address: string,
    city: string,
    country: string,
    deletedImages: { id: string; url: string }[],
    latitude: number,
    longitude: number,
    name: string,
    newImages: string[],
    region: string
  ) => {
    editDecoration({
      variables: {
        input: {
          address,
          city,
          country,
          id,
          latitude,
          longitude,
          name,
          region,
          deletedImages,
          newImages,
        },
      },
    });
  };

  const addtoFavourites = () => {
    favouriteDecoration({ variables: { input: { id: decorationId! } } });
  };

  const removeFromFavourites = () => {
    unfavouriteDecoration({ variables: { input: { id: decorationId! } } });
  };

  if (getDecorationError) {
    return <NotFound />;
  }

  if (getDecorationLoading) {
    return <DecorationLoading />;
  }

  return (
    <>
      {/* Both */}
      <EditDecorationModal
        isEditOpen={isEditOpen}
        setIsEditOpen={setIsEditOpen}
        decorationImages={decoration?.images}
        userPremium={user?.premium}
        decoration={decoration}
        updateDecoration={updateDecoration}
        editDecorationLoading={editDecorationLoading}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
      {/* Mobile */}
      <div className="min-h-screen sm:hidden">
        {showImageOverlay ? (
          <ImagesOverlay
            decorationImages={decoration?.images}
            setShowImageOverlay={setShowImageOverlay}
          />
        ) : null}
        {showRatings ? (
          <DecorationRatings
            setShowRatings={setShowRatings}
            rating={decoration?.rating}
            decorationId={decorationId}
            ratings={decoration?.ratings}
            numRatings={decoration?.num_ratings}
            userId={user?.id}
            decorationUserId={decoration?.creator_id}
          />
        ) : null}

        {showShareOptions ? (
          <ShareDecoration
            setShowShareOptions={setShowShareOptions}
            decorationImage={decoration?.images[0]}
            decorationName={decoration?.name}
            decorationCountry={decoration?.country}
            decorationCity={decoration?.city}
          />
        ) : null}
        <div className="relative">
          <button
            className="absolute left-3 top-3 px-1 py-1 bg-white rounded-full shadow-lg"
            onClick={() => navigate(-1)}
          >
            <CaretLeft size={24} color="#000000" weight="bold" />
          </button>
          {favouriteDecorationLoading || unfavouriteDecorationLoading ? (
            <button
              role="button"
              className="absolute right-3 top-3 px-1 py-1 bg-white rounded-full shadow-lg"
            >
              <CircleNotch
                size={24}
                color="#000000"
                weight="bold"
                className="animate-spin"
              />
            </button>
          ) : (
            <>
              {currentUser ? (
                <>
                  {user?.favourites.some(
                    (favourite) => favourite.id === decorationId
                  ) ? (
                    <button
                      role="button"
                      className="absolute right-3 top-3 px-1 py-1 bg-white rounded-full shadow-lg"
                      onClick={() =>
                        unfavouriteDecoration({
                          variables: { input: { id: decorationId! } },
                        })
                      }
                    >
                      <Heart size={24} weight="fill" className="text-ch-pink" />
                    </button>
                  ) : (
                    <button
                      role="button"
                      className="absolute right-3 top-3 px-1 py-1 bg-white rounded-full shadow-lg"
                      onClick={() =>
                        favouriteDecoration({
                          variables: { input: { id: decorationId! } },
                        })
                      }
                    >
                      <Heart size={24} color="#000000" weight="bold" />
                    </button>
                  )}
                </>
              ) : (
                <Link to="/signin">
                  <button
                    role="button"
                    className="absolute right-3 top-3 px-1 py-1 bg-white rounded-full shadow-lg"
                  >
                    <Heart size={24} color="#000000" weight="bold" />
                  </button>
                </Link>
              )}
            </>
          )}

          <button
            className="absolute right-16 top-3 px-1 py-1 bg-white rounded-full shadow-lg"
            onClick={() => setShowShareOptions(true)}
          >
            <Share size={24} color="#000000" weight="bold" />
          </button>
          <div className="absolute right-3 bottom-3 px-3 py-1 text-xs bg-zinc-800 rounded-full">
            {getImageIndex(currentImage?.id)} / {decoration?.images.length}
          </div>
          {decoration && decoration?.images.length > 1 ? (
            <>
              <button
                className="animate-fade-in absolute left-5 top-[45%] cursor-pointer rounded-full bg-black p-1 opacity-80 transition-all duration-100 hover:opacity-60 sm:hidden"
                onClick={prevImage}
              >
                <CaretLeft size={20} color="#FFFFFF" />
              </button>
              <button
                className="animate-fade-in absolute right-5 top-[45%] cursor-pointer rounded-full bg-black p-1 opacity-80 transition-all duration-100 hover:opacity-60 sm:hidden"
                onClick={nextImage}
              >
                <CaretRight size={20} color="#FFFFFF" />
              </button>
            </>
          ) : null}
          <img
            loading="lazy"
            src={currentImage?.url}
            alt="decoration image"
            className="h-64 w-full object-cover bg-ch-turquoise"
            onClick={() => setShowImageOverlay(true)}
          />
        </div>
        <div className="px-5 py-3">
          <div className="flex items-center space-x-2">
            <h1 className="font-semibold text-3xl">{decoration?.name}</h1>
            {decoration?.verified ? (
              <CircleWavyCheck size={24} color="#E23737" weight="fill" />
            ) : null}
          </div>
          <div className="flex items-center space-x-1 mt-2">
            <Star size={16} color="#ffffff" weight="fill" />
            <span>
              {decoration?.rating === 0 ? "New" : decoration?.rating.toFixed(1)}
            </span>
            &nbsp; &middot; &nbsp;
            <button
              role="button"
              className="underline"
              onClick={() => setShowRatings(true)}
            >
              {decoration?.num_ratings}{" "}
              {decoration?.num_ratings === 1 ? "rating" : "ratings"}
            </button>
            &nbsp; &middot; &nbsp;
            <span>{decoration?.num_views} views</span>
          </div>
          <div className="mt-2">
            <span>
              {decoration?.city}, {decoration?.country}
            </span>
          </div>
        </div>
        <Separator />
        {user?.id === decoration?.creator_id ? (
          <>
            {!decoration?.verified && !decoration?.verification_submitted ? (
              <div className="px-5 py-3 flex space-x-5">
                <WarningCircle
                  size={52}
                  color="#E23737"
                  weight="bold"
                  className="w-1/3"
                />
                <div className="flex flex-col text-sm space-y-2">
                  <p className="text-lg font-semibold">
                    Your decoration is not verified.
                  </p>
                  <p>
                    We make sure all decorations are verified for when users
                    visit decorations, they can guarantee that the decoration
                    actually exists.
                  </p>
                  <div className="text-sm">
                    You can submit your decoration for verification{" "}
                    <Link
                      to={`/verify-decoration/${decorationId}`}
                      className="text-ch-turquoise underline text-sm"
                    >
                      here
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <Separator />
        <div className="px-5 py-3 pb-10 rounded-lg">
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l-village+bc1919(${decoration?.longitude},${decoration?.latitude})/${decoration?.longitude},${decoration?.latitude},14,0,0/600x300@2x?attribution=true&logo=true&access_token=${
              import.meta.env.VITE_MAPBOX_API_KEY
            }`}
            alt={`Mapbox map of ${decoration?.longitude},${decoration?.latitude}`}
            className="rounded-lg"
          />
          <span className="text-sm">{decoration?.address}</span>
        </div>
        {/* Bottom nav */}
        <div className="fixed shadow w-full max-w-[560px] h-18 bottom-0 left-0 right-0 px-5 py-3 flex items-center justify-between dark:bg-zinc-900 dark:border-t dark:border-black">
          <div>
            <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
              Edit
            </Button>
          </div>
          <div>
            <Button>Delete</Button>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:block">
        {showImageOverlay ? (
          <ImagesOverlay
            decorationImages={decoration?.images}
            setShowImageOverlay={setShowImageOverlay}
          />
        ) : null}
        <div className="sm:flex sm:flex-col sm:mx-96 sm:pt-10">
          <h1 className="sm:text-3xl sm:font-semibold">{decoration?.name}</h1>
          <div className="sm:flex sm:justify-between items-center sm:font-semibold sm:text-sm sm:my-2">
            <div className="sm:flex">
              <div className="sm:flex sm:items-center">
                <Star size={16} weight="fill" className="sm:text-ch-light" />
                &nbsp;
                <span>{decoration?.rating.toFixed(1)}</span>
                &nbsp; &middot; &nbsp;
                <span
                  className="sm:underline sm:cursor-pointer"
                  // onClick={() => setViewRatingModalOpen(true)}
                >
                  {decoration?.num_ratings}{" "}
                  {decoration?.num_ratings === 1 ? "rating" : "ratings"}
                </span>
              </div>
              <span className="sm:mx-2">|</span>
              <div className="sm:flex sm:items-center">
                &nbsp;
                <span>{decoration?.num_views}</span>
                &nbsp;views
              </div>
              <span className="sm:mx-2">|</span>
              <span>
                {decoration?.city}, {decoration?.country}
              </span>
            </div>
            {user?.id === decoration?.creator_id ? (
              <div className="sm:mr-1 sm:flex">
                {!decoration?.verified &&
                !decoration?.verification_submitted ? (
                  <VerifiedPopOver decorationId={decorationId} />
                ) : null}
                <DecorationUserMenu setIsEditOpen={setIsEditOpen} />
              </div>
            ) : (
              <DecorationMenu />
            )}
          </div>
          {decoration?.images && decoration.images.length > 0 ? (
            <ImagesGrid
              decorationImages={decoration?.images}
              setShowImageOverlay={setShowImageOverlay}
            />
          ) : null}
          <div className="flex justify-end mt-2">
            <RateButton
              currentUser={currentUser}
              user={user}
              decorationId={decorationId}
            />
            <SaveButton
              currentUser={currentUser}
              user={user}
              decorationId={decorationId}
              addtoFavourites={addtoFavourites}
              removeFromFavourites={removeFromFavourites}
              favouriteDecorationLoading={favouriteDecorationLoading}
              unfavouriteDecorationLoading={unfavouriteDecorationLoading}
            />
            <Button variant="ghost">
              <Share size={20} className="text-ch-dark dark:text-ch-light" />
              <span className="ml-2">Share</span>
            </Button>
          </div>
          <div className="mt-5 mx-2">
            <h2 className="text-2xl font-bold">Location</h2>
            <div className="w-2/3 flex items-center">
              <h3 className="text-base mr-2 text-gray-600 dark:text-zinc-300">
                {decoration?.address}
              </h3>
              {decoration?.verified ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleWavyCheck
                        size={24}
                        color="#E23737"
                        weight="fill"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
            <div className="my-5 h-[26rem] w-full bg-gray-200 rounded-lg">
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l-village+bc1919(${decoration?.longitude},${decoration?.latitude})/${decoration?.longitude},${decoration?.latitude},14,0/1120x416@2x?access_token=pk.eyJ1Ijoic2hhbXB1cnJzIiwiYSI6ImNsZjdhcmJweDB5cGw0M212YnplaTFkNnkifQ.RRUvcHyfO7W0Pg4vOQ4UvA`}
                alt="static map"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
