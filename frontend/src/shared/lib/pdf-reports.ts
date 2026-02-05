import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


interface AttendanceRecord {
  employeeId: string;
  name: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: string;
}

interface LeaveRecord {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason?: string;
}

export const generateAttendanceReport = (
  records: AttendanceRecord[],
  reportDate: string
) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text("Attendance Report", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Date: ${reportDate}`, 105, 35, { align: "center" });

  // Summary
  const present = records.filter(r => r.status === "present").length;
  const absent = records.filter(r => r.status === "absent").length;
  const late = records.filter(r => r.status === "late").length;

  doc.setFontSize(10);
  doc.text(`Total: ${records.length} | Present: ${present} | Absent: ${absent} | Late: ${late}`, 105, 45, { align: "center" });

  // Table
  autoTable(doc, {
    startY: 55,
    head: [["#", "Employee ID", "Name", "Check In", "Check Out", "Hours", "Status"]],
    body: records.map((record, index) => [
      index + 1,
      record.employeeId,
      record.name,
      record.checkIn,
      record.checkOut,
      record.workHours,
      record.status === "present" ? "Present" : record.status === "absent" ? "Absent" : "Late"
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleString()}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  return doc;
};

export const generateLeavesReport = (
  records: LeaveRecord[],
  reportTitle: string = "Leave Requests Report"
) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text(reportTitle, 105, 20, { align: "center" });

  // Summary
  const approved = records.filter(r => r.status === "approved").length;
  const pending = records.filter(r => r.status === "pending").length;
  const rejected = records.filter(r => r.status === "rejected").length;
  const totalDays = records.filter(r => r.status === "approved").reduce((sum, r) => sum + r.days, 0);

  doc.setFontSize(10);
  doc.text(
    `Total Requests: ${records.length} | Approved: ${approved} | Pending: ${pending} | Rejected: ${rejected} | Total Days: ${totalDays}`,
    105, 35, { align: "center" }
  );

  // Table
  autoTable(doc, {
    startY: 45,
    head: [["#", "Employee", "Type", "Start Date", "End Date", "Days", "Status"]],
    body: records.map((record, index) => [
      index + 1,
      record.employeeName,
      record.leaveType,
      record.startDate,
      record.endDate,
      record.days,
      record.status === "approved" ? "Approved" : record.status === "pending" ? "Pending" : "Rejected"
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      5: { halign: "center" },
      6: { halign: "center" }
    }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleString()}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(`${filename}.pdf`);
};
