import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleApiAction } from "@/utils";
import { chatRoomRoute } from "@/constants/routes.constants";
import RoomService from "./room.service";
import { useRoomContext } from "./room.context";
import type { IUser } from "@/files/user/user.interface";

const useRoom = () => {
  const navigate = useNavigate();
  const { addPendingRoom, resolvePendingRoom, refetch } = useRoomContext();
  const [isLoadingStartConversation, setIsLoadingStartConversation] =
    useState(false);

  const startConversation = (user: IUser) => {
    const pendingId = addPendingRoom(user);
    void handleApiAction({
      action: () => RoomService.createDm(user.id),
      onSuccess: (result) => {
        const room = result?.data?.room;
        resolvePendingRoom(pendingId, room ?? null);
        if (!room) return;
        navigate(chatRoomRoute(room.id));
        void refetch();
      },
      onError: () => resolvePendingRoom(pendingId, null),
      setLoading: setIsLoadingStartConversation,
      errorMessage: "We could not start that conversation",
    });
  };

  return { startConversation, isLoadingStartConversation };
};

export default useRoom;
