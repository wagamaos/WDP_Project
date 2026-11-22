
function EventCard({ event, index, onRSVP, currentUserEmail, onEdit, onDelete}) {
  const isEventPast = new Date(
    event.endAt || event.startAt
  ).getTime() < Date.now();

  const gradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)'
  ];

  const handleRSVP = () => {
    onRSVP(event.id);
  };

  const isOwner = event.createdBy === currentUserEmail;

  const eventDate = new Date(event.startAt).toLocaleString();

  const priceLabel =
    Number(event.price ?? 0) === 0
      ? 'Free'
      : `₩${Number(event.price).toLocaleString()}`;

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

        <div className="event-card-badges">
          <span
            className={`event-organiser-badge ${
              event.organiserType === 'Student Union'
                ? 'badge-gold'
                : 'badge-green'
            }`}
          >
            {event.organiserType || 'Campus Event'}
          </span>

          <span className="event-price-badge">
            {priceLabel}
          </span>
        </div>

        <h2 className="event-card-title">{event.title}</h2>

        <div className="event-card-details">
          <p>📅 {eventDate}</p>
          {event.location && <p>📍 {event.location}</p>}
          {event.eventType && <p>🏷️ {event.eventType}</p>}
          {event.capacity !== null && (
            <p>👥 {event.registeredCount} / {event.capacity} registered</p>
          )}
        </div>

        {isOwner && (
          <div className="event-manage-actions">
            <button
              type="button"
              className="event-btn event-btn-edit"
              onClick={() => onEdit(event)}
            >
              Edit
            </button>

            <button
              type="button"
              className="event-btn event-btn-delete"
              onClick={() => onDelete(event.id)}
            >
              Delete
            </button>
          </div>
        )}

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
