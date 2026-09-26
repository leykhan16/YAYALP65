import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function csvEscape(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCsv(filename, rows, columns) {
  if (!rows.length) return
  const header = columns.map((c) => csvEscape(c.label)).join(',')
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c.key])).join(',')).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
  triggerDownload(blob, filename)
}

export function exportExcel(filename, rows, columns) {
  if (!rows.length) return
  const data = rows.map((r) => {
    const out = {}
    columns.forEach((c) => { out[c.label] = r[c.key] ?? '' })
    return out
  })
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, filename)
}

export function exportPdf(filename, title, rows, columns) {
  if (!rows.length) return
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text(title, 14, 16)
  autoTable(doc, {
    startY: 22,
    head: [columns.map((c) => c.label)],
    body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [10, 18, 38] },
  })
  doc.save(filename)
}
