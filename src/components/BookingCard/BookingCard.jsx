import styles from './BookingCard.module.css'

function BookingCard() {
  return (
    <aside className={styles.card} aria-label="Reserve Evergreen Pine Family Lodge">
      <div className={styles.header}>
        <h3 className={styles.title}>
          Evergreen
          <br />
          Pine Family Lodge
        </h3>
        <button type="button" className={styles.editBtn} aria-label="Edit search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className={styles.dates}>
        <button type="button" className={styles.dateField}>
          <span className={styles.dateLabel}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Feb 11
          </span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button type="button" className={styles.dateField}>
          <span className={styles.dateLabel}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Mar 25
          </span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className={styles.times}>
        <div className={styles.timeField}>
          <span className={styles.timeLabel}>Check-in</span>
          <span className={styles.timeValue}>After 2:00 PM</span>
        </div>
        <div className={styles.timeField}>
          <span className={styles.timeLabel}>Check-out</span>
          <span className={styles.timeValue}>Until 12:00 PM</span>
        </div>
      </div>

      <div className={styles.priceRow}>
        <p className={styles.price}>
          $359<span className={styles.priceUnit}>/night</span>
        </p>
        <p className={styles.guests}>2&ndash;5 guests</p>
      </div>

      <button type="button" className={styles.reserveBtn}>
        Reserve
      </button>
    </aside>
  )
}

export default BookingCard
