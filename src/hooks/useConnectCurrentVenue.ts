import { useParams } from "react-router-dom";
import { useFirestoreConnect } from "react-redux-firebase";
import getQueryParameters from "utils/getQueryParameters";

const useConnectCurrentVenue = () => {
  let { venueId } = useParams();
  if (!venueId) {
    venueId = getQueryParameters(window.location.search)?.venueId;
  }
  useFirestoreConnect([
    {
      collection: "venues",
      doc: venueId,
      storeAs: "currentVenue",
    },
  ]);

  useFirestoreConnect([
    {
      collection: "venues",
      doc: venueId,
      subcollections: [{ collection: "subvenues" }],
      storeAs: "currentSubVenues",
    },
  ]);

  useFirestoreConnect([
    {
      collection: "venues",
      where: [["parentId", "==", venueId]],
      storeAs: "currentChildVenues",
    },
  ]);
};

export default useConnectCurrentVenue;
