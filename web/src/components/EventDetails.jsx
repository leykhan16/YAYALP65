import "./EventDetails.css";

const info = [
  {
    icon: "📅",
    label: "Dates",
    value: "25th & 26th September, 2026",
  },
  {
    icon: "🕗",
    label: "Red Carpet & Registration",
    value: "6:00 PM / 8:00 PM",
  },
  {
    icon: "📍",
    label: "Venue",
    value:
      "No. 1 Kadiri Street, behind Total Filling Station, by Fadeyi BRT Bus Stop, Fadeyi, Lagos.",
  },
  {
    icon: "📷",
    label: "Follow along",
    value: "@rccglp65yaya_ · #ANTICIPATE",
  },
];

export default function EventDetails() {
  return (
    <section id="details" className="details-section">
      <div className="container">
        <p className="eyebrow">Convention Details</p>
        <h2 className="section-title">Everything you need to know</h2>
        <div className="details-grid">
          {info.map((item) => (
            <div className="detail-card" key={item.label}>
              <span className="detail-icon">{item.icon}</span>
              <div>
                <h3>{item.label}</h3>
                <p>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
