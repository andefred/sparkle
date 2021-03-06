import InformationCard from "components/molecules/InformationCard";
import AuthenticationModal from "components/organisms/AuthenticationModal";
import WithNavigationBar from "components/organisms/WithNavigationBar";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import "firebase/storage";
import { useKeyedSelector, useSelector } from "hooks/useSelector";
import { useUser } from "hooks/useUser";
import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useFirestoreConnect } from "react-redux-firebase";
import {
  Link,
  Route,
  Switch,
  useLocation,
  useParams,
  useRouteMatch,
  useHistory,
} from "react-router-dom";
import { Venue } from "types/Venue";
import { VenueEvent } from "types/VenueEvent";
import { WithId } from "utils/id";
import {
  canHaveSubvenues,
  canBeDeleted,
  canHaveEvents,
  canHavePlacement,
} from "utils/venue";
import "./Admin.scss";
import AdminEvent from "./AdminEvent";
import AdminDeleteEvent from "./AdminDeleteEvent";
import { venuePlayaPreviewUrl } from "utils/url";
import { AdminVenuePreview } from "./AdminVenuePreview";
import { isCampVenue } from "types/CampVenue";
import { useQuery } from "hooks/useQuery";
import { VenueTemplate } from "types/VenueTemplate";
import VenueDeleteModal from "./Venue/VenueDeleteModal";
import { PlayaContainer } from "pages/Account/Venue/VenueMapEdition";
import {
  PLAYA_WIDTH_AND_HEIGHT,
  PLACEABLE_VENUE_TEMPLATES,
  PLAYA_IMAGE,
  PLAYA_VENUE_SIZE,
  PLAYA_VENUE_STYLES,
} from "settings";
import AdminEditComponent from "./AdminEditComponent";
import Fuse from "fuse.js";
import { VenueOwnersModal } from "./VenueOwnersModal";
import { dateEventTimeFormat } from "../../utils/time";

dayjs.extend(advancedFormat);

type VenueListProps = {
  selectedVenueId?: string;
  roomIndex?: number;
};

const VenueList: React.FC<VenueListProps> = ({
  selectedVenueId,
  roomIndex,
}) => {
  const venues = useSelector((state) => state.firestore.ordered.venues);

  const topLevelVenues = useMemo(
    () => venues?.filter((v) => v.parentId === undefined) ?? [],
    [venues]
  );

  return (
    <>
      <div className="page-container-adminsidebar-title title">My Venues</div>
      <div className="page-container-adminsidebar-top">
        <Link to="/admin/venue/creation" className="btn btn-primary">
          Create a venue
        </Link>
      </div>
      <ul className="page-container-adminsidebar-venueslist">
        {topLevelVenues.map((venue, index) => (
          <li
            key={index}
            className={`${selectedVenueId === venue.id ? "selected" : ""} ${
              canHaveSubvenues(venue) ? "camp" : ""
            }`}
          >
            <Link to={`/admin/venue/${venue.id}`}>{venue.name}</Link>
            {isCampVenue(venue) && (
              <ul className="page-container-adminsidebar-subvenueslist">
                {venue.rooms.map((room, idx) => (
                  <li
                    key={idx}
                    className={`${idx === roomIndex ? "selected" : ""}`}
                  >
                    <Link to={`/admin/venue/${venue.id}?roomIndex=${idx}`}>
                      {room.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

type VenueDetailsProps = {
  venueId: string;
  roomIndex?: number;
};

type VenueDetailsPartProps = {
  venue: WithId<Venue>;
  roomIndex?: number;
  showCreateEventModal: boolean;
  setShowCreateEventModal: Function;
  editedEvent?: WithId<VenueEvent>;
  setEditedEvent?: Function;
};

const VenueDetails: React.FC<VenueDetailsProps> = ({ venueId, roomIndex }) => {
  const match = useRouteMatch();
  const location = useLocation();
  const { venues } = useKeyedSelector(
    (state) => ({
      venues: state.firestore.data.venues ?? {},
    }),
    ["venues"]
  );

  const venue = venues[venueId];
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [editedEvent, setEditedEvent] = useState<WithId<VenueEvent>>();

  if (!venue) {
    return <>{`Oops, seems we can't find your venue!`}</>;
  }

  const tabs = [{ url: `${match.url}`, label: "Venue Info" }];
  if (canHaveEvents(venue)) {
    tabs.push({ url: `${match.url}/events`, label: "Events" });
  }
  if (canHavePlacement(venue)) {
    tabs.push({ url: `${match.url}/placement`, label: "Placement & Editing" });
  }

  return (
    <>
      <div className="page-container-adminpanel-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.url}
            className={`page-container-adminpanel-tab ${
              location.pathname === tab.url ? "selected" : ""
            }`}
          >
            <Link to={tab.url}>{tab.label}</Link>
          </div>
        ))}
      </div>
      <div className="page-container-adminpanel-venuepage">
        <Switch>
          <Route
            path={`${match.url}/events`}
            render={() => (
              <EventsComponent
                venue={venue}
                showCreateEventModal={showCreateEventModal}
                setShowCreateEventModal={setShowCreateEventModal}
                editedEvent={editedEvent}
                setEditedEvent={setEditedEvent}
              />
            )}
            venue={venue}
          />
          <Route
            path={`${match.url}/placement`}
            render={() => <AdminEditComponent />}
            venue={venue}
          />
          <Route
            path={`${match.url}/Appearance`}
            render={() => <>Appearance Component</>}
          />
          <Route
            path={`${match.url}`}
            render={() => (
              <VenueInfoComponent
                venue={venue}
                roomIndex={roomIndex}
                showCreateEventModal={showCreateEventModal}
                setShowCreateEventModal={setShowCreateEventModal}
              />
            )}
          />
        </Switch>
      </div>
      <AdminEvent
        show={showCreateEventModal}
        onHide={() => {
          setShowCreateEventModal(false);
          setEditedEvent(undefined);
        }}
        venueId={venue.id}
        event={editedEvent}
        template={venue.template}
      />
    </>
  );
};

const VenueInfoComponent: React.FC<VenueDetailsPartProps> = ({
  venue,
  roomIndex,
  showCreateEventModal,
  setShowCreateEventModal,
}) => {
  const queryParams = useQuery();
  const manageUsers = !!queryParams.get("manageUsers");
  const { push } = useHistory();
  const onManageUsersModalHide = useCallback(() => push({ search: "" }), [
    push,
  ]);
  const history = useHistory();
  const match = useRouteMatch();
  const placementDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientWidth = placementDivRef.current?.clientWidth ?? 0;
    const clientHeight = placementDivRef.current?.clientHeight ?? 0;

    placementDivRef.current?.scrollTo(
      (venue.placement?.x ?? 0) - clientWidth / 2,
      (venue.placement?.y ?? 0) - clientHeight / 2
    );
  }, [venue]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedEvent, setEditedEvent] = useState<WithId<VenueEvent>>();
  const visitText =
    venue.template === VenueTemplate.themecamp ? "Visit camp" : "Visit venue";
  const editText =
    venue.template === VenueTemplate.themecamp ? "Edit camp" : "Edit venue";
  const deleteText =
    venue.template === VenueTemplate.themecamp ? "Delete camp" : "Delete venue";

  return (
    <>
      <div className="page-container-adminpanel-content">
        {/* after delete venue becomes {id: string} */}
        {venue.name && (
          <>
            <AdminVenuePreview
              venue={venue}
              containerStyle={{ marginTop: 20 }}
            />
            {PLACEABLE_VENUE_TEMPLATES.includes(venue.template) && (
              <>
                <h4
                  className="italic"
                  style={{ fontSize: "30px", textAlign: "center" }}
                >
                  How your experience appears on the playa
                </h4>
                <div className="container venue-entrance-experience-container">
                  <div
                    className="playa-container"
                    ref={placementDivRef}
                    style={{ width: "100%", height: 1000, overflow: "scroll" }}
                  >
                    <PlayaContainer
                      rounded
                      interactive={false}
                      resizable={false}
                      iconsMap={
                        venue.placement && venue.mapIconImageUrl
                          ? {
                              icon: {
                                width: PLAYA_VENUE_SIZE,
                                height: PLAYA_VENUE_SIZE,
                                top: venue.placement.y,
                                left: venue.placement.x,
                                url: venue.mapIconImageUrl,
                              },
                            }
                          : {}
                      }
                      coordinatesBoundary={PLAYA_WIDTH_AND_HEIGHT}
                      backgroundImage={PLAYA_IMAGE}
                      iconImageStyle={PLAYA_VENUE_STYLES.iconImage}
                      draggableIconImageStyle={
                        PLAYA_VENUE_STYLES.draggableIconImage
                      }
                      containerStyle={{
                        width: PLAYA_WIDTH_AND_HEIGHT,
                        height: PLAYA_WIDTH_AND_HEIGHT,
                      }}
                      venueId={venue.id}
                      otherIconsStyle={{ opacity: 0.4 }}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
      <div className="page-container-adminpanel-actions">
        {/* after delete venue becomes {id: string} */}
        {venue.name && (
          <>
            <Link
              to={venuePlayaPreviewUrl(venue.id)}
              target="_blank"
              rel="noopener noreferer"
              className="btn btn-primary btn-block"
            >
              {visitText}
            </Link>
            <Link
              to={`/admin/venue/edit/${venue.id}`}
              className="btn btn-block"
            >
              {editText}
            </Link>
            {canHaveSubvenues(venue) && (
              <Link
                to={`/admin/venue/rooms/${venue.id}`}
                className="btn btn-block"
              >
                Add a Room
              </Link>
            )}
            {isCampVenue(venue) && typeof roomIndex !== "undefined" && (
              <Link
                to={`/admin/venue/rooms/${venue.id}?roomIndex=${roomIndex}`}
                className="btn btn-block"
              >
                Edit Room
              </Link>
            )}
            {canBeDeleted(venue) && (
              <button
                role="link"
                className="btn btn-block btn-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                {deleteText}
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => {
                history.push(`${match.url}/events`);
                setShowCreateEventModal(true);
              }}
              style={{ marginBottom: 10, width: "100%" }}
            >
              Create an Event
            </button>
            <Link
              to={{ search: "manageUsers=true" }}
              className="btn btn-primary"
            >
              Manage Venue Owners
            </Link>
            {typeof roomIndex !== "number" && (
              <div>
                If you are looking to edit one of your rooms, please select the
                room in the left hand menu
              </div>
            )}
          </>
        )}
      </div>
      <VenueDeleteModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
        }}
        venue={venue}
      />
      <VenueOwnersModal
        visible={manageUsers}
        onHide={onManageUsersModalHide}
        venue={venue}
      />
      <AdminEvent
        show={showCreateEventModal}
        onHide={() => {
          setShowCreateEventModal(false);
          setEditedEvent(undefined);
        }}
        venueId={venue.id}
        event={editedEvent}
        template={venue.template}
      />
    </>
  );
};

const EventsComponent: React.FC<VenueDetailsPartProps> = ({
  venue,
  showCreateEventModal,
  setShowCreateEventModal,
  editedEvent,
  setEditedEvent,
}) => {
  useFirestoreConnect([
    {
      collection: "venues",
      doc: venue.id,
      subcollections: [{ collection: "events" }],
      orderBy: ["start_utc_seconds", "asc"],
      storeAs: "events",
    },
  ]);

  const events = useSelector((state) => state.firestore.ordered.events);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [filterPastEvents, setFilterPastEvents] = useState(false);
  const [filterText, setFilterText] = useState("");

  const upcomingEvents = useMemo(
    () =>
      filterPastEvents
        ? events?.filter(
            (ev) =>
              (ev.start_utc_seconds + ev.duration_minutes * 60) * 1000 >
              Date.now()
          )
        : events,
    [events, filterPastEvents]
  );

  const fuse = useMemo(
    () =>
      upcomingEvents
        ? new Fuse(upcomingEvents, { keys: ["name", "description", "host"] })
        : undefined,
    [upcomingEvents]
  );

  const filteredEvents = useMemo(() => {
    if (filterText === "") return upcomingEvents;
    const resultOfSearch: WithId<VenueEvent>[] | undefined = [];
    fuse && fuse.search(filterText).forEach((a) => resultOfSearch.push(a.item));
    return resultOfSearch;
  }, [fuse, filterText, upcomingEvents]);

  return (
    <>
      <div className="page-container-adminpanel-content">
        <div className="filter-event-section">
          <input
            name="Event search bar"
            className="input-block search-event-input"
            placeholder="Search for an event"
            onChange={(e) => setFilterText(e.target.value)}
            value={filterText}
          />
          <button
            className="btn btn-primary"
            onClick={() => setFilterPastEvents(!filterPastEvents)}
            style={{ marginBottom: 10 }}
          >
            {filterPastEvents
              ? "Show all the events"
              : "Only show upcoming events"}
          </button>
        </div>
        <div className="col-lg-6 col-12 oncoming-events">
          {filteredEvents && (
            <>
              {filteredEvents.map((venueEvent) => {
                const startingDate = new Date(
                  venueEvent.start_utc_seconds * 1000
                );
                const endingDate = new Date(
                  (venueEvent.start_utc_seconds +
                    60 * venueEvent.duration_minutes) *
                    1000
                );
                return (
                  <InformationCard title={venueEvent.name} key={venueEvent.id}>
                    <div className="date">
                      {`${dateEventTimeFormat(
                        startingDate
                      )}-${dateEventTimeFormat(endingDate)}
                      ${dayjs(startingDate).format("dddd MMMM Do")}`}
                    </div>
                    <div className="event-description">
                      {venueEvent.description}
                      {venueEvent.descriptions?.map((description, index) => (
                        <p key={index}>{description}</p>
                      ))}
                    </div>
                    <div className="button-container">
                      <div className="price-container">
                        {venueEvent.price > 0 && (
                          <>Individual tickets £{venueEvent.price / 100}</>
                        )}
                      </div>
                      <div className="event-payment-button-container">
                        <div>
                          <button
                            role="link"
                            className="btn btn-primary buy-tickets-button"
                            onClick={() => {
                              setEditedEvent && setEditedEvent(venueEvent);
                              setShowCreateEventModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            role="link"
                            className="btn btn-primary buy-tickets-button"
                            onClick={() => {
                              setEditedEvent && setEditedEvent(venueEvent);
                              setShowDeleteEventModal(true);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </InformationCard>
                );
              })}
            </>
          )}
        </div>
      </div>
      <div className="page-container-adminpanel-actions">
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateEventModal(true)}
        >
          Create an Event
        </button>
      </div>
      <AdminEvent
        show={showCreateEventModal}
        onHide={() => {
          setShowCreateEventModal(false);
          setEditedEvent && setEditedEvent(undefined);
        }}
        venueId={venue.id}
        event={editedEvent}
        template={venue.template}
      />
      <AdminDeleteEvent
        show={showDeleteEventModal}
        onHide={() => {
          setShowDeleteEventModal(false);
          setEditedEvent && setEditedEvent(undefined);
        }}
        venueId={venue.id}
        event={editedEvent}
      />
    </>
  );
};

const Admin: React.FC = () => {
  const { user } = useUser();
  const { venueId } = useParams();
  const queryParams = useQuery();
  const queryRoomIndexString = queryParams.get("roomIndex");
  const queryRoomIndex = queryRoomIndexString
    ? parseInt(queryRoomIndexString)
    : undefined;

  useFirestoreConnect([
    {
      collection: "venues",
      where: [["owners", "array-contains", user?.uid || ""]],
    },
  ]);

  return (
    <WithNavigationBar fullscreen>
      <div className="admin-dashboard">
        <AuthenticationModal show={!user} onHide={() => {}} showAuth="login" />
        <div className="page-container page-container_adminview">
          <div className="page-container-adminsidebar">
            <VenueList selectedVenueId={venueId} roomIndex={queryRoomIndex} />
          </div>
          <div className="page-container-adminpanel">
            {venueId ? (
              <VenueDetails venueId={venueId} roomIndex={queryRoomIndex} />
            ) : (
              <>Select a venue to see its details</>
            )}
          </div>
        </div>
      </div>
    </WithNavigationBar>
  );
};

export default Admin;
