import React, { useContext } from "react";
import { User } from "types/User";

import {
  ExperienceContext,
  Reactions,
  MessageToTheBandReaction,
} from "components/context/ExperienceContext";
import "./UserProfilePicture.scss";
import { DEFAULT_PROFILE_IMAGE } from "settings";
import { useSelector } from "hooks/useSelector";
import { WithId } from "utils/id";

type UserProfilePictureProp = {
  user: WithId<User>;
  setSelectedUserProfile: (user: WithId<User>) => void;
  imageSize: number;
  isAudioEffectDisabled?: boolean;
};

const UserProfilePicture: React.FC<UserProfilePictureProp> = ({
  user,
  setSelectedUserProfile,
  imageSize,
  isAudioEffectDisabled,
}) => {
  const experienceContext = useContext(ExperienceContext);
  const { muteReactions } = useSelector((state) => ({
    muteReactions: state.room.mute,
  }));

  const typedReaction = experienceContext?.reactions ?? [];

  const messagesToBand = typedReaction.find(
    (r) => r.reaction === "messageToTheBand" && r.created_by === user.id
  ) as MessageToTheBandReaction | undefined;

  return (
    <div className="profile-picture-container">
      <img
        onClick={() => setSelectedUserProfile(user)}
        key={user.id}
        className="profile-icon"
        src={user.pictureUrl || DEFAULT_PROFILE_IMAGE}
        title={user.partyName}
        alt={`${user.partyName} profile`}
        width={imageSize}
        height={imageSize}
      />
      {Reactions.map(
        (reaction) =>
          experienceContext &&
          experienceContext.reactions.find(
            (r) => r.created_by === user.id && r.reaction === reaction.type
          ) && (
            <div className="reaction-container">
              <span
                className={`reaction ${reaction.name}`}
                role="img"
                aria-label={reaction.ariaLabel}
              >
                {reaction.text}
              </span>
              {!muteReactions && !isAudioEffectDisabled && (
                <audio autoPlay loop>
                  <source src={reaction.audioPath} />
                </audio>
              )}
            </div>
          )
      )}
      {messagesToBand && (
        <div className="reaction-container">
          <div
            className="reaction messageToBand"
            role="img"
            aria-label="messageToTheBand"
          >
            {messagesToBand.text}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePicture;
