
function EventCard({ event, index }) {
  const isEventPast = new Date(
    event.endAt || event.startAt
  ).getTime() < Date.now();

  const gradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)'
  ];

  const handleRSVP = async () => {
    try {
      await window.LandedAuth.toggleEventRegistration(event.id);
    } catch (error) {
      window.alert(error.message);
    }
  };

  const details = [
    new Date(event.startAt).toLocaleString(),
    event.location,
    event.eventType
  ].filter(Boolean);

  if (event.capacity !== null) {
    details.push(
      `${event.registeredCount} / ${event.capacity} registered`
    );
  }

  const isFull =
    !event.registered &&
    event.capacity !== null &&
    event.registeredCount >= event.capacity;

  return (
    <article className="event-card" data-type={event.eventType || 'Other'}>
      <div
        className="event-card-img"
        style={{ background: gradients[index % gradients.length] }}
      >
        <span className="event-pts-badge">
          {event.pointsAwarded > 0
            ? `+${event.pointsAwarded} pts`
            : 'Campus event'}
        </span>
      </div>

      <div className="event-card-body">
        <h2 className="event-card-title">{event.title}</h2>

        <div className="event-card-meta">
          {details.join(' · ')}
        </div>

        <button
          type="button"
          className={`btn btn-full event-rsvp-btn ${
            event.registered ? 'btn-gold' : 'btn-royal'
          }`}
          onClick={handleRSVP}
          disabled={isEventPast || isFull}
          aria-label={`${event.registered ? 'Cancel RSVP for' : 'RSVP for'} ${event.title}`}
        >
          {isEventPast
            ? 'Event ended'
            : event.registered
              ? '✓ RSVPed'
              : 'RSVP'}
        </button>
      </div>
    </article>
  );
}

export default EventCard;
