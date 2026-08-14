import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleApiAction } from "@/utils";
import { chatRoomRoute } from "@/constants/routes.constants";
import RoomService from "./room.service";
import { useRoomContext } from "./room.context";

const useRoom = () => {
  const navigate = useNavigate();
  const { addRoom, refetch } = useRoomContext();
  const [isLoadingStartConversation, setIsLoadingStartConversation] =
    useState(false);

  const startConversation = (otherUserId: string) => {
    void handleApiAction({
      action: () => RoomService.createDm(otherUserId),
      onSuccess: (result) => {
        const room = result?.data?.room;
        if (!room) return;
        addRoom(room);
        navigate(chatRoomRoute(room.id));
        void refetch();
      },
      setLoading: setIsLoadingStartConversation,
      errorMessage: "We could not start that conversation",
    });
  };

  return { startConversation, isLoadingStartConversation };
};

export default useRoom;
