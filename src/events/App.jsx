
import { useEffect, useState } from 'react';
import EventCard from './components/EventCard.jsx';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await window.LandedAuth.listEvents();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>{error}</p>;

  return (
        <>
            {events.map((event, index) => (
            <EventCard
                key={event.id}
                event={event}
                index={index}
            />
            ))}
        </>
    );
}

export default App;
