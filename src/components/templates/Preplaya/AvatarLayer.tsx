import React, { useEffect, useState, useRef } from "react";
import { WS_RELAY_URL /* JITSI_ROOM_NAME */ } from "secrets";
import $ from "jquery";
import "strophe.js";
import "strophejs-plugin-disco";
import "strophejs-plugin-caps";
import { useUser } from "hooks/useUser";
import {
  UserStateMap,
  HelloWsMessage,
  MessageType,
  BroadcastMessage,
  UserState,
  UpdateWsMessage,
} from "types/RelayMessage";
import { /* DEFAULT_JITSI_ROOM_NAME */ DEFAULT_WS_RELAY_URL } from "settings";
import { Avatar } from "./Avatar";
import { useSelector } from "hooks/useSelector";
import useConnectPartyGoers from "hooks/useConnectPartyGoers";
import { WithId } from "utils/id";
import UserProfileModal from "components/organisms/UserProfileModal";
import { User } from "types/User";

(window as any).jQuery = (window as any).$ = $;

// Jitsi init here for now, since this is the only place it's used currently
// const JitsiMeetJS = (window as any).JitsiMeetJS;
// JitsiMeetJS.init({});
// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.DEBUG);

interface PropsType {
  zoom: number;
  scale: number;
  translateX: number;
  translateY: number;
}

type SendFunc = (data: any, cb?: (err?: Error) => void) => void;

type VideoParticipant = {};

interface VideoMeeting {
  getParticipant(uid: string): VideoParticipant;
  subscribeParticipantMedia(uid: string): void;
  unsubscribeParticipantMedia(uid: string): void;
  join(): void;
  leave(): void;
}

const AvatarLayer: React.FunctionComponent<PropsType> = ({
  zoom,
  scale,
  translateX,
  translateY,
}) => {
  useConnectPartyGoers();

  const { user } = useUser();
  const [userStateMap, setUserStateMap] = useState<UserStateMap>({});
  const userStateMapRef = useRef(userStateMap);
  const wsSend = useRef<SendFunc>();
  const [videoMeeting, setVideoMeeting] = useState<VideoMeeting>();
  const videoMeetingRef = useRef(videoMeeting);
  const [selectedUserProfile, setSelectedUserProfile] = useState<
    WithId<User>
  >();

  const partygoers = useSelector((state) => state.firestore.ordered.partygoers);

  useEffect(() => {
    if (!user) return;
    setVideoMeeting(new JitsiMeeting(user.uid));
    videoMeetingRef.current?.join();

    const leave = () => videoMeetingRef.current?.leave();
    window.addEventListener("beforeunload", leave);
    window.addEventListener("unload", leave);
    return () => {
      leave();
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("unload", leave);
    };
  }, [user]);

  const sendUpdatedState = (state: UserState) => {
    if (!user || !wsSend.current) return;

    const update: UpdateWsMessage = {
      type: MessageType.Update,
      uid: user?.uid,
      update: state,
    };
    wsSend.current(JSON.stringify(update));
  };

  useEffect(() => {
    if (!user) return;

    const ws = new WebSocket(WS_RELAY_URL || DEFAULT_WS_RELAY_URL);

    ws.onopen = () => {
      const hello: HelloWsMessage = {
        type: MessageType.Hello,
        uid: user.uid,
      };
      ws.send(JSON.stringify(hello));
      wsSend.current = ws.send;
    };

    ws.onclose = () => {
      wsSend.current = undefined;
    };

    ws.onmessage = (data) => {
      try {
        const update = JSON.parse(data.data.toString()) as BroadcastMessage;
        const newUserStateMap = { ...userStateMapRef.current };
        for (const uid of Object.keys(update.updates)) {
          newUserStateMap[uid] = update.updates[uid];
        }
        setUserStateMap(newUserStateMap);
      } catch (err) {
        console.error(
          `Error ${err} receiving data from ws: ${data.data}; continuing`
        );
      }
    };
    return () => {
      ws.close();
      setUserStateMap({});
    };
  }, [user]);

  return (
    <div className="avatar-container">
      {Object.keys(userStateMap)
        .filter((uid) => !!partygoers.find((partygoer) => partygoer.id === uid))
        .map((uid) => {
          return (
            <Avatar
              user={partygoers.find((partygoer) => partygoer.id === uid)}
              state={userStateMap[uid]}
              me={user?.uid === uid}
              scale={scale}
              zoom={zoom}
              translateX={translateX}
              translateY={translateY}
              sendUpdatedState={sendUpdatedState}
              setSelectedUserProfile={setSelectedUserProfile}
            />
          );
        })}
      <UserProfileModal
        show={selectedUserProfile !== undefined}
        onHide={() => setSelectedUserProfile(undefined)}
        userProfile={selectedUserProfile}
      />
    </div>
  );
};

export default AvatarLayer;

class JitsiMeeting implements VideoMeeting {
  connection: any;
  room: any;
  uid: string;

  constructor(uid: string) {
    this.uid = uid;
  }

  getLocalParticipant(): VideoParticipant {
    // REVISIT: implement
    return {};
  }
  getParticipant(uid: string): VideoParticipant {
    return {};
  }
  subscribeParticipantMedia(uid: string): void {
    // REVISIT: implement
  }
  unsubscribeParticipantMedia(uid: string): void {
    // REVISIT: implement
  }
  join(): void {
    // REVISIT: implement
    // this.initConnection();
    // this.connection.connect();
  }
  leave(): void {
    // REVISIT: implement
    // if (this.room) {
    //   this.room.leave();
    //   this.room.off(JitsiMeetJS.events.conference.TRACK_ADDED, onTrackAdded);
    //   this.room.off(
    //     JitsiMeetJS.events.conference.TRACK_ADDED,
    //     onConferenceJoined
    //   );
    //   this.room.off(
    //     JitsiMeetJS.events.conference.TRACK_REMOVED,
    //     onTrackRemoved
    //   );
    // }
    // this.connection.disconnect();
    // this.connection.removeEventListener(
    //   JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    //   onConnectionEstablished
    // );
    // this.connection.removeEventListener(
    //   JitsiMeetJS.events.connection.CONNECTION_FAILED,
    //   onConnectionFailed
    // );
    // this.connection.removeEventListener(
    //   JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    //   onConnectionDisconnected
    // );
  }

  // initConnection(): void {
  //   this.onTrackAdded = (a: any, b: any, c: any) => {
  //     console.log("ontrackAdded", a, b, c);
  //   };
  //   const onConferenceJoined = (a: any, b: any, c: any) => {
  //     console.log("onConferenceJoined", a, b, c);
  //   };
  //   const onTrackRemoved = (a: any, b: any, c: any) => {
  //     console.log("onTrackRemoved", a, b, c);
  //   };

  //   const onConnectionEstablished = (a: any, b: any, c: any) => {
  //     console.log("onConnectionEstablished", a, b, c);
  //     const name = JITSI_ROOM_NAME || DEFAULT_JITSI_ROOM_NAME;
  //     this.room = this.connection.initJitsiConference(name, {
  //       openBridgeChannel: true,
  //     });
  //     this.room.join();
  //     this.room.setDisplayName(uid);
  //     const localTracks = this.room.getLocalTracks();
  //     console.log("local tracks", localTracks);
  //     this.room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onTrackAdded);
  //     this.room.on(
  //       JitsiMeetJS.events.conference.TRACK_ADDED,
  //       onConferenceJoined
  //     );
  //     this.room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, onTrackRemoved);
  //   };

  //   const onConnectionFailed = (err: any) => {
  //     console.error(`Jitsi connection failed. Error: ${err}`);
  //   };

  //   const onConnectionDisconnected = () => {
  //     console.log("Jitsi connection disconnected.");
  //   };
  //   this.connection = new JitsiMeetJS.JitsiConnection(null, null, {
  //     hosts: {
  //       domain: "meet.jit.si",
  //       muc: "conference.meet.jit.si",
  //       focus: "focus.meet.jit.si",
  //     },
  //     externalConnectUrl: "https://meet.jit.si/http-pre-bind",
  //     enableP2P: true,
  //     p2p: {
  //       enabled: true,
  //       preferH264: true,
  //       disableH264: true,
  //       useStunTurn: true,
  //     },
  //     useStunTurn: true,
  //     bosh: `https://meet.jit.si/http-bind?room=${DEFAULT_JITSI_ROOM_NAME}`,
  //     websocket: "wss://meet.jit.si/xmpp-websocket",
  //     clientNode: "http://jitsi.org/jitsimeet",
  //   });

  //   this.connection.addEventListener(
  //     JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
  //     onConnectionEstablished
  //   );
  //   this.connection.addEventListener(
  //     JitsiMeetJS.events.connection.CONNECTION_FAILED,
  //     onConnectionFailed
  //   );
  //   this.connection.addEventListener(
  //     JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
  //     onConnectionDisconnected
  //   );
  // }
}