type Row = Record<string, unknown>;

const sanitize = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r?\n|\r/g, " ").trim();
};

export const exportToCsv = (rows: Row[], filename: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const val = sanitize(row[key]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const exportToExcelXml = (rows: Row[], filename: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escapeXml = (val: string) =>
    val
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const rowsXml = [
    `<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join("")}</Row>`,
    ...rows.map(
      (row) =>
        `<Row>${headers
          .map((key) => `<Cell><Data ss:Type="String">${escapeXml(sanitize(row[key]))}</Data></Cell>`)
          .join("")}</Row>`,
    ),
  ].join("");

  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Report">
    <Table>${rowsXml}</Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
