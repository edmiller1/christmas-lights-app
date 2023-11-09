import { Request, Response } from "express";
import { prisma } from "../../../database";
import { Decoration, DecorationImage, User } from "@prisma/client";
import {
  AddViewArgs,
  CreateDecorationArgs,
  DeleteRatingArgs,
  EditDecorationArgs,
  EditRatingArgs,
  FavouriteDecorationArgs,
  GetDecorationArgs,
  RateDecorationArgs,
  ReportDecorationArgs,
  unfavouriteDecorationArgs,
} from "./types";
import { authorise, calculateRating } from "../../../lib/helpers";
import { Cloudinary } from "../../../lib/cloudinary";
import { Resend } from "resend";

const resend = new Resend("re_H1GDoBf9_Kwqwhasy8MZsLo6Tn3ej8bBc");

export const decorationResolvers = {
  Query: {
    getDecoration: async (
      _root: undefined,
      { input }: GetDecorationArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<Decoration> => {
      try {
        const decoration = await prisma.decoration.findFirst({
          where: {
            id: input.id,
          },
          include: {
            creator: true,
            ratings: true,
            images: true,
            views: true,
          },
        });

        if (!decoration) {
          throw new Error("Decoration cannot be found");
        }

        return decoration;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
  },
  Mutation: {
    createDecoration: async (
      _root: undefined,
      { input }: CreateDecorationArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<Decoration | null> => {
      try {
        let newDecoration = null;

        const user = await authorise(req);

        if (!user) {
          throw new Error("User cannot be found");
        }

        // const regex = /\b\d{1,5}\s[\w\s'&.-]+,\s[\w\s'&.-]+\b/;

        // const isAddress = regex.test(input.address);

        // if (!isAddress) {
        //   throw new Error("Address provided is not valid.");
        // }

        const images: { id: string; url: string }[] = [];

        for (const image of input.images) {
          const newImage = await Cloudinary.upload(image);
          images.push(newImage);
        }

        if (images.length > 0) {
          newDecoration = await prisma.decoration.create({
            data: {
              name: input.name,
              address: input.address,
              city: input.city,
              country: input.country,
              latitude: input.latitude,
              longitude: input.longitude,
              region: input.region,
              num_ratings: 0,
              num_views: 0,
              rating: 0,
              verification_submitted: false,
              verified: false,
              year: new Date().getFullYear().toString(),
              creator_id: user.id,
              images: {
                create: images,
              },
            },
          });
        }

        return newDecoration;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
    editDecoration: async (
      _root: undefined,
      { input }: EditDecorationArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<Decoration> => {
      try {
        const user = await authorise(req);

        if (!user) {
          throw new Error("User cannot be found");
        }

        const newImages: { id: string; url: string }[] = [];
        if (input.newImages) {
          for (const image of input.newImages) {
            const newImage = await Cloudinary.upload(image);
            newImages.push(newImage);
          }
        }

        if (input.deletedImages) {
          for (const image of input.deletedImages) {
            await Cloudinary.destroy(image.id);
          }
        }

        const updatedDecoration = await prisma.decoration.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            address: input.address,
            latitude: input.latitude,
            longitude: input.longitude,
            country: input.country,
            region: input.region,
            city: input.city,
            images: {
              create: newImages ? newImages : [],
              deleteMany: input.deletedImages ? input.deletedImages : [],
            },
          },
        });

        return updatedDecoration;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
    favouriteDecoration: async (
      _root: undefined,
      { input }: FavouriteDecorationArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<User> => {
      try {
        const user = await authorise(req);

        if (!user) {
          throw new Error("User cannot be found");
        }

        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            favourites: {
              connect: {
                id: input.id,
              },
            },
          },
        });

        return updatedUser;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
    unfavouriteDecoration: async (
      _root: undefined,
      { input }: unfavouriteDecorationArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<User> => {
      try {
        const user = await authorise(req);

        if (!user) {
          throw new Error("User cannot be found");
        }

        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            favourites: {
              disconnect: {
                id: input.id,
              },
            },
          },
        });

        return updatedUser;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
    addView: async (
      _root: undefined,
      { input }: AddViewArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<Decoration> => {
      try {
        const updatedDecoration = await prisma.decoration.update({
          where: {
            id: input.id,
          },
          data: {
            num_views: input.numViews + 1,
            views: {
              create: {},
            },
          },
        });

        return updatedDecoration;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
    rateDecoration: async (
      _root: undefined,
      { input }: RateDecorationArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<Decoration> => {
      try {
        const user = await authorise(req);

        if (!user) {
          throw new Error("User cannot be found");
        }

        const decoration = await prisma.decoration.findFirst({
          where: {
            id: input.id,
          },
        });

        if (!decoration) {
          throw new Error("Decoration doesn't exist");
        }

        await prisma.rating.create({
          data: {
            rating: input.rating,
            decoration_id: input.id,
            user_id: user.id,
          },
        });

        return decoration;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
    editRating: async (
      _root: undefined,
      { input }: EditRatingArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<User> => {
      try {
        const user = await authorise(req);

        if (!user) {
          throw new Error("User cannot be found");
        }

        await prisma.rating.update({
          where: {
            id: input.id,
          },
          data: {
            rating: input.rating,
          },
        });

        return user;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
    deleteRating: async (
      _root: undefined,
      { input }: DeleteRatingArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<User> => {
      try {
        const user = await authorise(req);

        if (!user) {
          throw new Error("User cannot be found");
        }

        await prisma.rating.delete({
          where: {
            id: input.id,
          },
        });

        return user;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
    reportDecoration: async (
      _root: undefined,
      { input }: ReportDecorationArgs,
      { _, req, res }: { _: undefined; req: Request; res: Response }
    ): Promise<Decoration> => {
      try {
        const user = await authorise(req);

        if (!user) {
          throw new Error("User canot be found");
        }

        const decoration = await prisma.decoration.findFirst({
          where: {
            id: input.id,
          },
        });

        if (!decoration) {
          throw new Error("Decoration cannot be found");
        }

        //Send email to CLA admin
        await resend.emails.send({
          from: "Acme <onboarding@resend.dev>",
          to: "edmiller.me@gmail.com",
          subject: "New Decoration Report",
          html: `<p>New Decoration Report</p>
          <p>Reported by: ${user.name}</p>
          <ul>
            <li>ID: ${user.id}</li>
            <li>Email: ${user.email}</li>
          </ul>
          <p>Reported Decoration:</p>
          <ul>
          <li>ID: ${decoration.id}</li>
          <li>Name: ${decoration.name}</li>
          <li>Address: ${decoration.address}</li>
          <li>ChristmasLightsApp link: http://localhost:3000/decoration/${
            decoration.id
          }/</li>
          </ul>
          <span>Reasons for Report</span>
          <ul>
          <li>${input.reportOptions.map((ro) => ro)}</li>
          </ul>
          <p>Additional Details:</p>
          <p>${input.additionalDetails}</p>
          `,
          text: "It Worked!!!",
          tags: [
            {
              name: "decoration_report",
              value: "decoration_report",
            },
          ],
        });

        return decoration;
      } catch (error) {
        throw new Error(`${error}`);
      }
    },
  },
  Decoration: {
    id: (decoration: Decoration): string => {
      return decoration.id;
    },
    rating: (decoration: Decoration): Promise<number> => {
      return calculateRating(decoration.id);
    },
  },
};
