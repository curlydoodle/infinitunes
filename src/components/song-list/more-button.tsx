"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Play,
  Radio,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import type { LucideIcon } from "lucide-react";
import type { User } from "next-auth";
import type { MyPlaylist } from "@/lib/db/schema";
import type { Episode, Queue, Song } from "@/types";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "@/hooks/use-store";
import { addSongsToPlaylist } from "@/lib/db/queries";
import { currentlyInDev, getImageSrc } from "@/lib/utils";
import { AddToPlaylistDialog } from "../playlist/add-to-playlist-dialog";
import { ShareOptions } from "../share-options";
import { ShareSubMenu } from "../share-submenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { TileMoreLinks } from "./more-links";

type TileMoreButtonProps = {
  user?: User;
  item: Song | Episode | Queue;
  showAlbum: boolean;
  playlists?: MyPlaylist[];
};

type MenuItem = {
  label: string;
  onClick: () => void;
  hide?: boolean;
  icon: LucideIcon;
};

export function TileMoreButton(props: TileMoreButtonProps) {
  const { user, item, showAlbum, playlists } = props;

  const router = useRouter();

  const [traslateX, setTranslateX] = React.useState(0);
  const [isDialogOpen, setDialogOpen] = React.useState(false);

  const [, setIsPlayerInit] = useIsPlayerInit();
  const [initialQueue, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();

  function like() {
    currentlyInDev();
  }

  function play() {
    if (item.type === "episode") {
      currentlyInDev();
      return;
    }

    const songIndex = initialQueue.findIndex((q) => q.id === item.id);

    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
    } else {
      const {
        id,
        name,
        subtitle,
        type,
        url,
        image,
        artist_map: { featured_artists: artists },
        download_url,
      } = item as Song;

      const queue = {
        id,
        name,
        subtitle,
        type,
        url,
        image,
        artists,
        download_url,
      } satisfies Queue;

      setQueue([queue]);
      setCurrentIndex(0);
    }

    setIsPlayerInit(true);
  }

  function addToQueue() {
    if (item.type === "episode") {
      currentlyInDev();
      return;
    }

    let queue: Queue;

    if ("explicit" in item) {
      const {
        id,
        name,
        subtitle,
        type,
        url,
        image,
        artist_map: { featured_artists: artists },
        download_url,
      } = item;

      queue = {
        id,
        name,
        subtitle,
        type,
        url,
        image,
        artists,
        download_url,
      } satisfies Queue;
    } else {
      queue = item;
    }

    setQueue((q) => [...q, queue]);

    toast(`"${item.name}" added to queue`);
  }

  function togglePlaylistDialog() {
    if (user) {
      setDialogOpen(true);
    } else {
      router.push("/login");

      toast.info("Unable to perform action", {
        description: "You need to be logged in to add to playlist",
      });
    }
  }

  function addToPlaylist(id: string, name: string) {
    toast.promise(addSongsToPlaylist(id, [item.id]), {
      loading: "Adding songs to playlist...",
      success: `"${item.name}" added to "${name}" playlist`,
      error: (error) => error.message,
      finally: () => setDialogOpen(false),
    });
  }

  function playRadio() {
    currentlyInDev();
  }

  const menuItems: MenuItem[] = [
    {
      label: "Add To Favourite",
      onClick: like,
      icon: Heart,
    },
    {
      label: "Play Song Now",
      onClick: play,
      icon: Play,
    },
    {
      label: "Add to Queue",
      onClick: addToQueue,
      icon: ListOrdered,
    },
    {
      label: "Add To Playlist",
      onClick: togglePlaylistDialog,
      icon: ListMusic,
    },
    {
      label: "Play Radio",
      onClick: playRadio,
      icon: Radio,
    },
  ];

  return (
    <div>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger
            aria-label="More Options"
            className="focus-visible:outline-none"
          >
            <MoreVertical className="size-6 hover:text-primary" />
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <div className="flex items-center gap-2">
                <div className="relative aspect-square h-14 rounded-md">
                  <Image
                    src={getImageSrc(item.image, "low")}
                    alt={item.name}
                    fill
                    className="z-10 shrink-0 rounded-md"
                  />

                  <Skeleton className="absolute inset-0 size-full" />
                </div>

                <div className="flex flex-col truncate text-start">
                  <SheetTitle className="truncate">{item.name}</SheetTitle>

                  <SheetDescription className="truncate">
                    {item.subtitle}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Separator className="mb-2 mt-4" />

            <div
              className="relative flex flex-col gap-2 transition-transform duration-300"
              style={{ transform: `translateX(${traslateX}%)` }}
            >
              {menuItems
                .filter(({ hide }) => !hide)
                .map(({ icon: Icon, label, onClick }, i) => (
                  <button
                    key={i}
                    onClick={onClick}
                    className="flex h-8 items-center font-medium"
                  >
                    <Icon className="mr-2 size-5" />
                    {item.type === "song" ?
                      label
                    : label.replace("Song", "Episode")}
                  </button>
                ))}

              <button
                onClick={() => setTranslateX(-110)}
                className="flex h-8 items-center font-medium"
              >
                <Share2 className="mr-2 size-5" />
                Share
                <ChevronRight className="ml-auto size-5" />
              </button>

              <div className="absolute inset-y-0 left-[110%] flex min-w-full flex-col gap-4 bg-background">
                <button
                  onClick={() => setTranslateX(0)}
                  className="flex h-8 items-center font-medium"
                >
                  <ChevronLeft className="mr-2 size-5" />
                  Back
                </button>

                <Separator className="-my-2 mb-2" />

                <ShareOptions className="flex h-8 cursor-pointer items-center font-medium" />
              </div>

              <Separator />

              <TileMoreLinks
                type={item.type}
                itemUrl={item.url}
                albumUrl={"album_url" in item ? item.album_url : undefined}
                showAlbum={item.type === "song" ? showAlbum : false}
                primaryArtists={
                  "artists" in item ?
                    item.artists
                  : item.artist_map.primary_artists
                }
              />
            </div>

            <Separator className="my-4" />

            <SheetFooter className="sm:justify-center">
              <SheetClose>Cancel</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More Options"
            className="focus-visible:outline-none"
          >
            <MoreVertical className="size-6 hover:text-primary" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="left"
            align="start"
            className="*:cursor-pointer"
          >
            {menuItems
              .filter(({ hide }) => !hide)
              .map(({ icon: Icon, label, onClick }, i) => (
                <DropdownMenuItem key={i} onClick={onClick}>
                  <Icon className="mr-2 size-5" />
                  {item.type === "song" ?
                    label
                  : label.replace("Song", "Episode")}
                </DropdownMenuItem>
              ))}
            <ShareSubMenu />
            <DropdownMenuSeparator className="my-2" />
            <TileMoreLinks
              type={item.type}
              itemUrl={item.url}
              albumUrl={"album_url" in item ? item.album_url : undefined}
              showAlbum={showAlbum}
              isDropdownItem
              primaryArtists={
                "artists" in item ?
                  item.artists
                : item.artist_map.primary_artists
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!!user && (
        <AddToPlaylistDialog
          user={user}
          isDialogOpen={isDialogOpen}
          setDialogOpen={setDialogOpen}
          playlists={playlists}
          addToPlaylist={addToPlaylist}
        />
      )}
    </div>
  );
}
