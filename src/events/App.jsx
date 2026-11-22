
import { useEffect, useState } from 'react';
import EventCard from './components/EventCard.jsx';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const [data, user] = await Promise.all([
          window.LandedAuth.listEvents(),
          window.LandedAuth.getCurrentUser()
        ]);

        setEvents(data);
        setCurrentUser(user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Connect the HTML filters and search input
  useEffect(() => {
    const timeButtons = document.querySelectorAll('[data-filter]');
    const typeButtons = document.querySelectorAll('[data-type]');
    const searchInput = document.getElementById('events-search');

    function handleTimeClick(e) {
      setTimeFilter(e.currentTarget.dataset.filter);
      timeButtons.forEach(btn => {
        const active = btn === e.currentTarget;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active);
      });
    }

    function handleTypeClick(e) {
      setTypeFilter(e.currentTarget.dataset.type);
      typeButtons.forEach(btn =>
        btn.classList.toggle('active', btn === e.currentTarget)
      );
    }

    function handleSearch(e) {
      setSearchQuery(e.target.value);
    }

    timeButtons.forEach(btn =>
      btn.addEventListener('click', handleTimeClick)
    );
    typeButtons.forEach(btn =>
      btn.addEventListener('click', handleTypeClick)
    );
    searchInput?.addEventListener('input', handleSearch);

    return () => {
      timeButtons.forEach(btn =>
        btn.removeEventListener('click', handleTimeClick)
      );
      typeButtons.forEach(btn =>
        btn.removeEventListener('click', handleTypeClick)
      );
      searchInput?.removeEventListener('input', handleSearch);
    };
  }, []);

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>{error}</p>;

  const filteredEvents = events.filter(event => {
    const isPast =
      new Date(event.endAt || event.startAt).getTime() < Date.now();

    const matchesTime =
      timeFilter === 'upcoming' ? !isPast :
      timeFilter === 'past' ? isPast :
      timeFilter === 'owned' ? event.createdBy === currentUser?.email :
      event.registered === true;

    const price = Number(event.price ?? 0);

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'Student Union' &&
        event.organiserType === 'Student Union') ||
      (typeFilter === 'Student Run' &&
        event.organiserType === 'Student Run') ||
      (typeFilter === 'Free' && price === 0) ||
      (typeFilter === 'Charged' && price > 0);

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = [
      event.title,
      event.location,
      event.eventType,
      event.organiserType
    ].some(value =>
      String(value || '').toLowerCase().includes(query)
    );

    return matchesTime && matchesType && matchesSearch;
  });

  async function refreshEvents() {
    const updatedEvents = await window.LandedAuth.listEvents();
    setEvents(updatedEvents);
  }

  async function handleRSVP(eventId) {
    try {
      await window.LandedAuth.toggleEventRegistration(eventId);
      const updatedEvents = await window.LandedAuth.listEvents();
      setEvents(updatedEvents);
    } catch (error) {
      window.alert(error.message);
    }
  }

  function handleEdit(event) {
    setEditingEvent(event);
    setShowForm(true);
  }

  function handleDelete(eventId) {
    const event = events.find(item => item.id === eventId);
    setDeleteTarget(event);
  }

  async function confirmDelete() {
    try {
      await window.LandedAuth.deleteEvent(deleteTarget.id);
      await refreshEvents();
      setDeleteTarget(null);
    } catch (error) {
      window.alert(error.message);
    }
  }


  async function handleSaveEvent(e) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const details = {
      title: formData.get('title').trim(),
      startAt: new Date(formData.get('startAt')).toISOString(),
      location: formData.get('location').trim(),
      eventType: formData.get('eventType'),
      price: Number(formData.get('price')),
      capacity: formData.get('capacity') === ''
        ? null
        : Number(formData.get('capacity'))
    };

    try {
      if (editingEvent) {
        await window.LandedAuth.updateEvent(editingEvent.id, details);
      } else {
        await window.LandedAuth.createEvent(details);
      }

      await refreshEvents();
      setShowForm(false);
      setEditingEvent(null);
    } catch (error) {
      window.alert(error.message);
    }
  }

  const eventForm = (
    <form
      key={editingEvent?.id || 'new-event'}
      className="event-create-form"
      onSubmit={handleSaveEvent}
    >
      <h2>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>

      <label>
        Event Title *
        <input
          type="text"
          name="title"
          defaultValue={editingEvent?.title || ''}
          required
        />
      </label>

      <label>
        Date and Time *
        <input
          type="datetime-local"
          name="startAt"
          defaultValue={
            editingEvent?.startAt
              ? new Date(editingEvent.startAt).getFullYear() + '-' +
                String(new Date(editingEvent.startAt).getMonth() + 1).padStart(2, '0') + '-' +
                String(new Date(editingEvent.startAt).getDate()).padStart(2, '0') + 'T' +
                String(new Date(editingEvent.startAt).getHours()).padStart(2, '0') + ':' +
                String(new Date(editingEvent.startAt).getMinutes()).padStart(2, '0')
              : ''
          }
          required
        />
      </label>

      <label>
        Location *
        <input
          type="text"
          name="location"
          defaultValue={editingEvent?.location || ''}
          required
        />
      </label>

      <label>
        Category
        <select
          name="eventType"
          defaultValue={editingEvent?.eventType || 'Social'}
        >
          <option value="Social">Social</option>
          <option value="Orientation">Orientation</option>
          <option value="Career">Career</option>
          <option value="Academic">Academic</option>
          <option value="Sports">Sports</option>
          <option value="Other">Other</option>
        </select>
      </label>

      <label>
        Price (₩)
        <input
          type="number"
          name="price"
          min="0"
          defaultValue={editingEvent?.price ?? 0}
        />
      </label>

      <label>
        Registration Capacity
        <input
          type="number"
          name="capacity"
          min="1"
          placeholder="Leave blank for unlimited"
          defaultValue={editingEvent?.capacity ?? ''}
        />
      </label>

      <div className="event-form-actions">
        <button type="submit" className="event-btn event-btn-save">
          {editingEvent ? 'Save Changes' : 'Create Event'}
        </button>

        <button
          type="button"
          className="event-btn event-btn-cancel"
          onClick={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  
  return (
    <>
      <div className="events-create-section">
        <button
          type="button"
          className="btn btn-royal"
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
        >
          + Create Event
        </button>
      </div>

      {/* Create form stays at the top */}
      {showForm && !editingEvent && eventForm}

      {filteredEvents.length > 0 ? (
        filteredEvents.map((event, index) => (
          <div className="event-grid-item" key={event.id}>
            <EventCard
              event={event}
              index={index}
              onRSVP={handleRSVP}
              currentUserEmail={currentUser?.email}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {/* Edit form appears under its own card */}
            {showForm && editingEvent?.id === event.id && eventForm}

            {/* Delete confirmation appears under its own card */}
            {deleteTarget?.id === event.id && (
              <div className="event-delete-confirm">
                <h3>Delete this event?</h3>
                <p>
                  Are you sure you want to delete
                  <strong> {event.title}</strong>?
                </p>
                <p>This action cannot be undone.</p>

                <div className="event-form-actions">
                  <button
                    type="button"
                    className="event-btn event-btn-delete"
                    onClick={confirmDelete}
                  >
                    Yes, Delete
                  </button>

                  <button
                    type="button"
                    className="event-btn event-btn-cancel"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No events match your filters.</p>
      )}
    </>
  );

}

export default App;
