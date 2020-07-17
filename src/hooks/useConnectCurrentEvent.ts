import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";

const useConnectCurrentEvent = () => {
  const { venueId, eventId } = useParams();
  const { user } = useSelector((state: any) => ({
    user: state.user,
  }));

  useFirestoreConnect([
    {
      collection: "venues",
      doc: venueId,
      subcollections: [{ collection: "events", doc: eventId }],
      storeAs: "currentEvent",
    },
  ]);

  useFirestoreConnect([
    {
      collection: "purchases",
      where: [
        ["eventId", "==", eventId],
        ["userId", "==", user.uid],
        ["venueId", "==", venueId],
      ],
      storeAs: "eventPurchase",
    },
  ]);
};

export default useConnectCurrentEvent;
