export default function ExportButtons({ onCsv, onExcel, onPdf }) {
  return (
    <div className="export-buttons">
      <button className="export-btn" onClick={onCsv}>CSV</button>
      <button className="export-btn" onClick={onExcel}>Excel</button>
      <button className="export-btn" onClick={onPdf}>PDF</button>
    </div>
  )
}
