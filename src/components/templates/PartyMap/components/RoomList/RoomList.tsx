import React from "react";
import "./RoomList.scss";

import { RoomData } from "types/RoomData";
import RoomCard from "../RoomCard";
import { eventHappeningNow } from "utils/time";

interface PropsType {
  startUtcSeconds: number;
  rooms: RoomData[];
  attendances: Record<string, number>;
  setSelectedRoom: (value: RoomData) => void;
}

const RoomList: React.FunctionComponent<PropsType> = ({
  startUtcSeconds,
  rooms,
  attendances,
  setSelectedRoom,
}) => {
  rooms = rooms.filter(
    (room) => room.on_list && eventHappeningNow(room, startUtcSeconds)
  );

  return (
    <>
      <div className="room-list-title">
        {`What's on now: ${rooms.length} rooms open`}
      </div>
      <div className="rooms-container">
        {rooms.map((room) => (
          <RoomCard
            key={room.title}
            startUtcSeconds={startUtcSeconds}
            room={room}
            attendance={attendances[room.title]}
            onClick={() => setSelectedRoom(room)}
          />
        ))}
      </div>
    </>
  );
};

export default RoomList;
