const GOOGLE_SHEET_ID = "1c4ZfuUy1QuDwH0SE6O_kLdYi4C_CYdzI3yevN5lsjLA";
const GOOGLE_SHEET_NAME = "Sheet1";

const fallbackStudents = [
  {
    nama: "Aisyah Putri",
    kelas: "XII IPA 1",
    nisn: "2023001001",
    linkIjazah: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/view?usp=sharing",
    linkTranskip: "https://drive.google.com/file/d/2BcDeFgHiJkLmNoPqRsTuVwXyZ9876543210/view?usp=sharing"
  },
  {
    nama: "Budi Santoso",
    kelas: "XII IPA 2",
    nisn: "2023001002",
    linkIjazah: "https://drive.google.com/file/d/2BcDeFgHiJkLmNoPqRsTuVwXyZ9876543210/view?usp=sharing",
    linkTranskip: "https://drive.google.com/file/d/3CdEfGhIjKlMnOpQrStUvWxYzAbCdefGhI/view?usp=sharing"
  },
  {
    nama: "Citra Lestari",
    kelas: "XII IPS 1",
    nisn: "2023001003",
    linkIjazah: "https://drive.google.com/file/d/3CdEfGhIjKlMnOpQrStUvWxYzAbCdefGhI/view?usp=sharing",
    linkTranskip: "https://drive.google.com/file/d/4DeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHi/view?usp=sharing"
  },
  {
    nama: "Dimas Pratama",
    kelas: "XII IPS 2",
    nisn: "2023001004",
    linkIjazah: "https://drive.google.com/file/d/4DeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHi/view?usp=sharing",
    linkTranskip: "https://drive.google.com/file/d/5EfGhIjKlMnOpQrStUvWxYzAbCdEfGhIj/view?usp=sharing"
  },
  {
    nama: "Eka Rahmawati",
    kelas: "XII Bahasa",
    nisn: "2023001005",
    linkIjazah: "https://drive.google.com/file/d/5EfGhIjKlMnOpQrStUvWxYzAbCdEfGhIj/view?usp=sharing",
    linkTranskip: "https://drive.google.com/file/d/6FgHiJkLmNoPqRsTuVwXyZaBcDeFgHi/view?usp=sharing"
  }
];

let students = [...fallbackStudents];

const resultBody = document.getElementById("resultBody");
const searchForm = document.getElementById("searchForm");
const nisnInput = document.getElementById("nisnInput");
const statusMessage = document.getElementById("statusMessage");

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getValueFromRow(row, keys) {
  const normalized = {};

  Object.entries(row).forEach(([key, value]) => {
    normalized[normalizeKey(key)] = value;
  });

  for (const key of keys) {
    const value = normalized[normalizeKey(key)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function normalizeNisn(value) {
  if (value === null || value === undefined) return "";

  const text = String(value).trim();
  if (!text) return "";

  const numericText = text.replace(/,/g, "").replace(/\s+/g, "");

  if (/e/i.test(numericText)) {
    const parsed = Number(numericText);
    return Number.isFinite(parsed) ? String(Math.round(parsed)) : "";
  }

  const digitsOnly = numericText.replace(/[^\d]/g, "");
  return digitsOnly;
}

function isFileProtocol() {
  return typeof window !== "undefined" && window.location && window.location.protocol === "file:";
}

function extractSheetId(value) {
  if (!value) return "";

  const text = String(value).trim();
  if (!text) return "";

  const match = text.match(/\/spreadsheets\/d\/([A-Za-z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  const directIdMatch = text.match(/[A-Za-z0-9-_]{10,}/);
  return directIdMatch ? directIdMatch[0] : "";
}

function extractGoogleDriveFileId(value) {
  if (!value) return "";
  const text = String(value).trim();
  const match = text.match(/(?:\/d\/|id=)([A-Za-z0-9_-]{10,})/);
  return match ? match[1] : "";
}

function createOpenPdfLink(fileId) {
  return fileId ? `https://drive.google.com/file/d/${fileId}/view?usp=sharing` : "#";
}

function createDownloadPdfLink(fileId) {
  return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : "#";
}

function parseGoogleSheetData(rawText) {
  try {
    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      return [];
    }

    const jsonText = rawText.slice(start, end + 1);
    const parsed = JSON.parse(jsonText);

    if (!parsed || !parsed.table || !Array.isArray(parsed.table.rows)) {
      return [];
    }

    const rows = parsed.table.rows
      .map((row) => {
        if (!row || !Array.isArray(row.c)) return {};

        const obj = {};
        const cols = parsed.table.cols || [];

        cols.forEach((col, index) => {
          const key = col && col.label ? col.label : `col${index}`;
          const cell = row.c[index];
          obj[key] = cell && cell.v !== undefined ? cell.v : "";
        });

        return obj;
      })
      .filter((row) => row && Object.keys(row).length > 0);

    return rows
      .map((row) => {
        const nama = getValueFromRow(row, ["NAMA SISWA", "Nama Siswa", "nama", "Nama"]);
        const kelas = getValueFromRow(row, ["KELAS", "Kelas", "kelas", "Kelas Siswa"]);
        const rawNisn = getValueFromRow(row, ["NISN", "nisn", "NISN Siswa"]);
        const nisn = normalizeNisn(rawNisn);
        const linkIjazahValue = getValueFromRow(row, ["LINK IJAZAH", "Link Ijazah", "Link PDF", "Link PDF Ijazah", "Link Google Drive"]);
        const linkTranskipValue = getValueFromRow(row, ["LINK TRANSKIP", "Link Transkip", "Link PDF Transkip", "Transkip"]);

        const linkIjazah = extractGoogleDriveFileId(linkIjazahValue) || String(linkIjazahValue || "").trim();
        const linkTranskip = extractGoogleDriveFileId(linkTranskipValue) || String(linkTranskipValue || "").trim();

        if (!nisn && !nama && !kelas) {
          return null;
        }

        return {
          nama,
          kelas,
          nisn,
          linkIjazah,
          linkTranskip
        };
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

async function loadStudentsFromGoogleSheet() {
  const sheetId = extractSheetId(GOOGLE_SHEET_ID);

  if (isFileProtocol()) {
    students = [...fallbackStudents];
    updateStatus("Buka halaman ini melalui server lokal (misalnya http://localhost:8000) agar data Google Sheets bisa dimuat oleh browser.", "warning");
    renderRows([]);
    return;
  }

  if (!sheetId || sheetId === "PASTE_SHEET_ID_DISINI") {
    students = [...fallbackStudents];
    updateStatus("Data contoh sedang digunakan. Ganti Sheet ID atau link spreadsheet untuk data live.", "warning");
    renderRows([]);
    return;
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(GOOGLE_SHEET_NAME)}`;

  try {
    const response = await fetch(sheetUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Sheet tidak dapat diakses");
    }

    const rawText = await response.text();
    const parsedRows = parseGoogleSheetData(rawText);

    if (parsedRows.length > 0) {
      students = parsedRows;
      updateStatus("Data siswa berhasil dimuat dari Database", "success");
      return;
    }

    throw new Error("Format data tidak sesuai");
  } catch (error) {
    students = [...fallbackStudents];
    updateStatus("Gagal memuat Database, menggunakan data contoh.", "warning");
  }
}

function updateStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status-message";

  if (type) {
    statusMessage.classList.add(type);
  }
}

function renderRows(data) {
  if (!data.length) {
    resultBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Data tidak ditemukan. Silakan periksa kembali NISN yang dimasukkan.</td>
      </tr>
    `;
    return;
  }

  resultBody.innerHTML = data
    .map((student) => {
      const ijazahFileId = extractGoogleDriveFileId(student.linkIjazah || "") || String(student.linkIjazah || "").trim();
      const transkipFileId = extractGoogleDriveFileId(student.linkTranskip || "") || String(student.linkTranskip || "").trim();
      const openIjazahLink = createOpenPdfLink(ijazahFileId);
      const downloadIjazahLink = createDownloadPdfLink(ijazahFileId);
      const openTranskipLink = createOpenPdfLink(transkipFileId);
      const downloadTranskipLink = createDownloadPdfLink(transkipFileId);

      return `
        <tr>
          <td>${student.nama || "-"}</td>
          <td>${student.kelas || "-"}</td>
          <td>${student.nisn || "-"}</td>
          <td>
            <div class="action-buttons">
              <a class="btn btn-primary" href="${openIjazahLink}" target="_blank" rel="noopener noreferrer">Lihat PDF</a>
              <a class="btn btn-secondary" href="${downloadIjazahLink}" target="_blank" rel="noopener noreferrer">Unduh PDF</a>
            </div>
          </td>
          <td>
            <div class="action-buttons">
              <a class="btn btn-primary" href="${openTranskipLink}" target="_blank" rel="noopener noreferrer">Lihat PDF</a>
              <a class="btn btn-secondary" href="${downloadTranskipLink}" target="_blank" rel="noopener noreferrer">Unduh PDF</a>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function searchStudent(event) {
  event.preventDefault();

  const nisn = nisnInput.value.trim();

  if (!nisn) {
    updateStatus("Silakan masukkan NISN terlebih dahulu.", "error");
    renderRows([]);
    return;
  }

  const normalizedInput = normalizeNisn(nisn);
  const matchedStudents = students.filter((student) =>
    normalizeNisn(student.nisn) === normalizedInput
  );

  if (matchedStudents.length > 0) {
    updateStatus(`Data ditemukan untuk NISN ${nisn}.`, "success");
    renderRows(matchedStudents);
  } else {
    updateStatus(`NISN ${nisn} tidak ditemukan di database.`, "error");
    renderRows([]);
  }
}

searchForm.addEventListener("submit", searchStudent);

nisnInput.addEventListener("input", () => {
  if (!nisnInput.value.trim()) {
    updateStatus("Silakan masukkan NISN untuk mencari data siswa.");
    renderRows([]);
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  await loadStudentsFromGoogleSheet();
  renderRows([]);
});
