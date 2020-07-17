import React from "react";
import "./EntranceExperience.scss";
import { updateTheme } from "pages/VenuePage/helpers";
import { useSelector } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";
import { useParams } from "react-router-dom";
import WithNavigationBar from "components/organisms/WithNavigationBar";
import InformationCard from "components/molecules/InformationCard";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { Venue } from "pages/VenuePage/VenuePage";
import { User } from "types/User";
import SecretPasswordForm from "components/molecules/SecretPasswordForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { VenueEvent } from "types/VenueEvent";
import EventPaymentButton from "components/molecules/EventPaymentButton";
import useConnectCurrentVenue from "hooks/useConnectCurrentVenue";

const JazzbarEntranceExperience = () => {
  const { venueId } = useParams();
  dayjs.extend(advancedFormat);

  useConnectCurrentVenue();

  useFirestoreConnect({
    collection: "venues",
    doc: venueId,
    subcollections: [{ collection: "events" }],
    storeAs: "venueEvents",
    orderBy: ["start_utc_seconds", "asc"],
  });

  const { venue, venueEvents } = useSelector((state: any) => ({
    venue: state.firestore.data.currentVenue,
    user: state.user,
    venueEvents: state.firestore.ordered.venueEvents,
  })) as { venue: Venue; user: User; venueEvents: VenueEvent[] };

  venue && updateTheme(venue);

  if (!venue) {
    return <>Loading...</>;
  }

  const nextVenueEventId = venueEvents && venueEvents[0].id;

  return (
    <>
      <WithNavigationBar>
        <div className="container venue-entrance-experience-container">
          <div
            className="header"
            style={{
              background: `linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.8) 2%,
            rgba(0, 0, 0, 0) 98%
          ), url(${venue.config.landingPageConfig.coverImageUrl}`,
              backgroundSize: "cover",
            }}
          >
            <div className="venue-host">
              <div className="host-icon-container">
                <img className="host-icon" src={venue.host.icon} alt="host" />
              </div>
              <div className="title">{venue.name}</div>
              <div className="subtitle">
                {venue.config.landingPageConfig.subtitle}
              </div>
            </div>
            <div className="secret-password-form-wrapper">
              <SecretPasswordForm />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-12 venue-presentation">
              {venue.config.landingPageConfig.presentation &&
                venue.config.landingPageConfig.presentation.map(
                  (paragraph: string, index: number) => (
                    <p
                      key={`venue-presentation-paragraph-${index}`}
                      className="presentation-paragraph"
                    >
                      {paragraph}
                    </p>
                  )
                )}
              <div>
                {venue.config.landingPageConfig.checkList &&
                  venue.config.landingPageConfig.checkList.map(
                    (checkListItem: string, index: number) => (
                      <div
                        key={`checklist-item-${index}`}
                        className="checklist-item"
                      >
                        <div className="check-icon-container">
                          <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <div>{checkListItem}</div>
                      </div>
                    )
                  )}
              </div>
            </div>
            <div className="col-lg-6 col-12 oncoming-events">
              <div className="upcoming-gigs-title">Upcoming gigs</div>
              {venueEvents &&
                venueEvents.map((venueEvent: VenueEvent) => {
                  const startingDate = new Date(
                    venueEvent.start_utc_seconds * 1000
                  );
                  const endingDate = new Date(
                    (venueEvent.start_utc_seconds +
                      60 * venueEvent.duration_minutes) *
                      1000
                  );
                  const isNextVenueEvent = venueEvent.id === nextVenueEventId;
                  return (
                    <InformationCard
                      title={venueEvent.name}
                      key={venueEvent.id}
                      className={`${!isNextVenueEvent ? "disabled" : ""}`}
                    >
                      <div className="date">
                        {`${dayjs(startingDate).format(
                          "ddd MMMM Do - Ha"
                        )}/${dayjs(endingDate).format("Ha")}`}
                      </div>
                      <div className="event-description">
                        {venueEvent.description}
                      </div>
                      {isNextVenueEvent && (
                        <div className="button-container">
                          <EventPaymentButton event={venueEvent} />
                        </div>
                      )}
                    </InformationCard>
                  );
                })}
            </div>
          </div>
        </div>
      </WithNavigationBar>
    </>
  );
};

export default JazzbarEntranceExperience;
