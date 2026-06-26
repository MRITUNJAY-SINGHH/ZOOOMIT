import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (headers, dataRows, title, filename) => {
  const doc = new jsPDF();
  
  doc.text(title, 14, 15);
  
  doc.autoTable({
    head: [headers],
    body: dataRows,
    startY: 20,
    theme: 'grid',
  });

  doc.save(`${filename}.pdf`);
};
