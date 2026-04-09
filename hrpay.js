// ================= WINDOW ONLOAD =================
window.onload = function(){
showPage('page-home');
resetPayrollForm();
resetBPJS();
renderArchive();
};

function resetAll(){
resetPayrollForm();
resetBPJS();
resetSeveranceForm();
alert("Form berhasil di-reset");
resetFaktorUser();
}

// ================= NAVIGASI PAGE =================
const nav = document.getElementById("wrapernav");
const overlay = document.getElementById("overlay");
function openMenu(){
nav.classList.add("active");
overlay.classList.add("active");
}
function closeMenu(){
nav.classList.remove("active");
overlay.classList.remove("active");
}
let currentPage = null;

function showPage(id){
  const next = document.getElementById(id);
  const current = document.querySelector(".page.active");

  if(current === next) return;

  // animasi keluar
  if(current){
    current.classList.add("exit");
    current.classList.remove("active");

    setTimeout(() => {
      current.classList.remove("exit");
    }, 300);
  }

  // animasi masuk
  next.classList.add("active");

  // update title
  const title = next.getAttribute("data-title");
  if(title){
    document.getElementById("title").innerText = title;
  }

  closeMenu();
}

// ================= FORMAT ANGKA DLL =================
function fmt(el){
let val = el.value.replace(/\D/g,"");
el.value = val.replace(/\B(?=(\d{3})+(?!\d))/g,".");
}
function getNumber(id){
const el = document.getElementById(id);
if(!el || !el.value) return 0;
return Number(el.value.replace(/[^\d]/g,""));
}
function formatNum(x){
return Number(x||0).toLocaleString("id-ID");
}
function safe(text){
return String(text)
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;");
}

// ================= POPUP =================
let lastResult="";
function showPopup(html){
lastResult = html.replace(/<[^>]*>/g,"");
document.getElementById("popupContent").innerHTML = html;
document.getElementById("popup").classList.add("active");
}
function closePopup(){
document.getElementById("popup").classList.remove("active");
}
function copyResult(){
const temp = document.createElement("textarea");
temp.value = lastResult;
document.body.appendChild(temp);
temp.select();
document.execCommand("copy");
document.body.removeChild(temp);
alert("Hasil berhasil disalin");
}

// ================= ARCHIVE =================
const ARCHIVE_KEY = "HRPAY_ARCHIVE"; // key di localStorage
const ARCHIVE_MAX = 100;              // maksimal item archive
function saveToArchiveHTML(type, html, nama = "-", tanggal = null){
let archive = JSON.parse(localStorage.getItem(ARCHIVE_KEY)) || [];
const ts = tanggal ? new Date(tanggal).getTime() : Date.now();
const id = `${safe(nama).replace(/\s+/g,'_')}_${ts}`;
const item = {id,type,nama,html,timestamp: ts};
archive.unshift(item);
if(archive.length > ARCHIVE_MAX){
archive = archive.slice(0, ARCHIVE_MAX);
}
localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
}
function showArchivePopup(id){
let archive = JSON.parse(localStorage.getItem(ARCHIVE_KEY)) || [];
const item = archive.find(a => a.id.toString() === id.toString());
if(!item) return;
showPopup(item.html);
}
function deleteArchiveItem(id){
let archive = JSON.parse(localStorage.getItem(ARCHIVE_KEY)) || [];
archive = archive.filter(a => a.id.toString() !== id.toString());
localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
renderArchive();
}
function renderArchive(){
const listEl = document.getElementById("archiveList");
if(!listEl) return;
let archive = JSON.parse(localStorage.getItem(ARCHIVE_KEY)) || [];
const search = (document.getElementById("archiveSearch")?.value || "").toLowerCase();
const filtered = archive.filter(item =>
item.type.toLowerCase().includes(search) ||
item.html.toLowerCase().includes(search)
);
if(filtered.length === 0){
listEl.innerHTML = "<p style='font-size:12px;color:#555;'>Tidak ada archive.</p>";
return;
}
listEl.innerHTML = filtered.map(item => {
return `<div class="archive-item">
<span>${item.type} - ${item.nama} ${new Date(item.timestamp).toLocaleDateString("id-ID")}</span>
<button onclick="showArchivePopup('${item.id}')">View</button>
<button onclick="deleteArchiveItem('${item.id}')">Delete</button>
</div>`;
}).join("");
}
const searchInput = document.getElementById("archiveSearch");
if (searchInput) {
searchInput.addEventListener("input", () => {
renderArchive();
});
}

// ================= DEFAULT DAN RUMUS PAYROL =================
function resetPayrollForm(){
document.getElementById("nama").value = "";
document.getElementById("gapok").value = "";
document.getElementById("tunjangan").value = "";
document.getElementById("bonus").value = "";
document.getElementById("ptkpStatus").selectedIndex = 0;
document.getElementById("npwp").selectedIndex = 0;
}
function resetBPJS(){
document.getElementById("kespt").value = 4;
document.getElementById("kes").value = 1;

document.getElementById("jhtpt").value = 3.7;
document.getElementById("jht").value = 2;

document.getElementById("jppt").value  = 2;
document.getElementById("jp").value  = 1;

document.getElementById("maxkespt").value = "12000000";
document.getElementById("maxkes").value = "12000000";

document.getElementById("maxjhtpt").value = "";
document.getElementById("maxjht").value = "";

document.getElementById("maxjppt").value  = "11086300";
document.getElementById("maxjp").value  = "11086300";

fmt(document.getElementById("maxkespt"));
fmt(document.getElementById("maxkes"));

fmt(document.getElementById("maxjppt"));
fmt(document.getElementById("maxjp"));
}

function hitungPTKP(s){
 const PRIBADI=54000000, KAWIN=4500000, ANAK=4500000;
 let kawin=(s.startsWith("K")||s.startsWith("KI"))?KAWIN:0;
 let anak=s.match(/\d/)?Math.min(Number(s.match(/\d/)[0]),3):0;
 return PRIBADI+kawin+(anak*ANAK);
}

// ================== FUNCTION HITUNG PAYROLL ==================
function hitungPayroll() {
let nama = document.getElementById("nama").value || "-";
let gapok = getNumber("gapok");
if (gapok <= 0) {
alert("Gaji pokok wajib diisi");
return null;
}
let tunj = getNumber("tunjangan");
let bonus = getNumber("bonus");

let upahTetap = gapok + tunj;
let bruto = upahTetap + bonus;

// ===== BPJS Karyawan =====
let persenKes = parseFloat(document.getElementById("kes").value) || 0;
let persenJHT = parseFloat(document.getElementById("jht").value) || 0;
let persenJP = parseFloat(document.getElementById("jp").value) || 0;

let maxKes = getNumber("maxkes") || Infinity;
let maxJHT = getNumber("maxjht") || Infinity;
let maxJP = getNumber("maxjp") || Infinity;

let dasarKes = Math.min(upahTetap, maxKes);
let dasarJHT = Math.min(upahTetap, maxJHT);
let dasarJP = Math.min(upahTetap, maxJP);

let kesPot = dasarKes * (persenKes / 100);
let jhtPot = dasarJHT * (persenJHT / 100);
let jpPot = dasarJP * (persenJP / 100);

let totalBPJS = kesPot + jhtPot + jpPot;

// ===== BPJS Perusahaan =====
let persenKesPT = parseFloat(document.getElementById("kespt").value) || 0;
let persenJHTPT = parseFloat(document.getElementById("jhtpt").value) || 0;
let persenJPPT = parseFloat(document.getElementById("jppt").value) || 0;

let maxKesPT = getNumber("maxkespt") || Infinity;
let maxJHTPT = getNumber("maxjhtpt") || Infinity;
let maxJPPT = getNumber("maxjppt") || Infinity;

let dasarKesPT = Math.min(upahTetap, maxKesPT);
let dasarJHTPT = Math.min(upahTetap, maxJHTPT);
let dasarJPPT = Math.min(upahTetap, maxJPPT);

let kesPT = dasarKesPT * (persenKesPT / 100);
let jhtPT = dasarJHTPT * (persenJHTPT / 100);
let jpPT = dasarJPPT * (persenJPPT / 100);

// ===== JKK DAN JKM Perusahaan =====
let jkk = upahTetap * 0.0024;
let jkm = upahTetap * 0.003;

let persenAsuransi = parseFloat(document.getElementById("asuransiPT").value) || 0;
let asuransiPT = upahTetap * (persenAsuransi / 100);

let totalEmployerCost = kesPT + jhtPT + jpPT + jkk + jkm + asuransiPT;

// ===== Biaya Jabatan & Pajak =====
let biayaJabatan = Math.min(bruto * 0.05, 500000);
let iuranPensiun = jhtPot + jpPot;
let nettoPajak = bruto - biayaJabatan - iuranPensiun;

let ptkp = hitungPTKP(document.getElementById("ptkpStatus").value);
let pkp = Math.max(0, (nettoPajak * 12) - ptkp);
pkp = Math.floor(pkp / 1000) * 1000;

let npwpSelect = document.getElementById("npwp");
let npwpVal = parseFloat(npwpSelect.value) || 1;
let npwpText = npwpSelect.options[npwpSelect.selectedIndex].text;

let pphTahunan = 0;
if (pkp <= 60000000) pphTahunan = pkp * 0.05;
else if (pkp <= 250000000) pphTahunan = 60000000*0.05 + (pkp-60000000)*0.15;
else if (pkp <= 500000000) pphTahunan = 60000000*0.05 + 190000000*0.15 + (pkp-250000000)*0.25;
else if (pkp <= 5000000000) pphTahunan = 60000000*0.05 + 190000000*0.15 + 250000000*0.25 + (pkp-500000000)*0.30;
else pphTahunan = 60000000*0.05 + 190000000*0.15 + 250000000*0.25 + 4500000000*0.30 + (pkp-5000000000)*0.35;

let pphBulanan = (pphTahunan/12) * npwpVal;

let totalPotonganKaryawan = totalBPJS + pphBulanan;
let thp = bruto - totalPotonganKaryawan;
let totalCashOut = bruto + totalEmployerCost; // sama dengan thp + potongan + employer cost

return {
nama, gapok, tunj, bonus, bruto,
kesPot, jhtPot, jpPot, totalBPJS,
pphBulanan, thp, kesPT, jhtPT, jpPT,
jkk, jkm, asuransiPT, totalEmployerCost, totalCashOut,
npwpText, pkp
};
}

// ================= OUTPUT Tombol 1 (THP) =================
function calcPayrollTHP() {
let data = hitungPayroll();
if (!data) return;
let html = `
<table class="result-table">
<tr><td><b>Nama Karyawan</b></td><td><b>${safe(data.nama)}</b></td></tr>
<tr><td>Gaji Pokok</td><td>Rp ${formatNum(data.gapok)}</td></tr>
<tr><td>Tunjangan Tetap</td><td>Rp ${formatNum(data.tunj)}</td></tr>
<tr><td>Bonus / Insentif</td><td>Rp ${formatNum(data.bonus)}</td></tr>

<tr><th colspan="2">Potongan BPJS karyawan</th></tr>
<tr><td>BPJS Kesehatan</td><td>Rp ${formatNum(data.kesPot)}</td></tr>
<tr><td>BPJS JHT</td><td>Rp ${formatNum(data.jhtPot)}</td></tr>
<tr><td>BPJS JP</td><td>Rp ${formatNum(data.jpPot)}</td></tr>

<tr><th colspan="2">Perhitungan Pajak</th></tr>
<tr><td>Status NPWP</td><td>${safe(data.npwpText)}</td></tr>
<tr><td>Status PTKP</td><td>${safe(document.getElementById("ptkpStatus").value)}</td></tr>
<tr><td>PKP Tahunan</td><td>Rp ${formatNum(data.pkp)}</td></tr>
<tr><td>PPh Bulanan</td><td>Rp ${formatNum(data.pphBulanan)}</td></tr>

<tr><th colspan="2">Ringkas Perhitungan</th></tr>
<tr><td>Penghasilan Bruto</td><td>Rp ${formatNum(data.bruto)}</td></tr>
<tr><td>Potongan BPJS</td><td>Rp ${formatNum(data.totalBPJS)}</td></tr>
<tr><td>Potongan Pajak</td><td>Rp ${formatNum(data.pphBulanan)}</td></tr>

<tr><td><b>Take Home Pay</b></td><td><b>Rp ${formatNum(data.thp)}</b></td></tr>
</table>
<p style="font-size:12px;margin-top:8px;">
UU Ketenagakerjaan + PP Pengupahan + UU BPJS + UU PPh 21 + Permenaker/SE Dirjen Pajak.
</p>
`;

showPopup(html);
saveToArchiveHTML("THP", html, safe(data.nama), new Date().toISOString());
renderArchive();
}

// ================= OUTPUT Tombol 2 (CTC) =================
function calcPayrollCTC() {
let data = hitungPayroll();
if (!data) return;
let html = `
<table class="result-table">
<tr><td><b>Nama Karyawan</b></td><td><b>${safe(data.nama)}</b></td></tr>
<tr><td>Penghasilan Bruto</td><td>Rp ${formatNum(data.bruto)}</td></tr>
<tr><td>BPJS Karyawan</td><td>Rp ${formatNum(data.totalBPJS)}</td></tr>
<tr><td>Potongan Pajak</td><td>Rp ${formatNum(data.pphBulanan)}</td></tr>
<tr><td>THP Income</td><td>Rp ${formatNum(data.thp)}</td></tr>
<tr><th colspan="2">Employer cost</th></tr>
<tr><td>BPJS KES Company</td><td>Rp ${formatNum(data.kesPT)}</td></tr>
<tr><td>BPJS JHT Company</td><td>Rp ${formatNum(data.jhtPT)}</td></tr>
<tr><td>BPJS JP Company</td><td>Rp ${formatNum(data.jpPT)}</td></tr>
<tr><td>JKK 0.0024</td><td>Rp ${formatNum(data.jkk)}</td></tr>
<tr><td>JKM 0.003</td><td>Rp ${formatNum(data.jkm)}</td></tr>
<tr><td>Asuransi</td><td>Rp ${formatNum(data.asuransiPT)}</td></tr>

<tr><th colspan="2">Cost To Company</th></tr>
<tr><td><b>Total Employer Cost</b></td><td><b>Rp ${formatNum(data.totalEmployerCost)}</b></td></tr>
<tr><td><b>Total Cash Out Perusahaan</b></td><td><b>Rp ${formatNum(data.totalCashOut)}</b></td></tr>

</table>
<p style="font-size:12px;margin-top:8px;">
UU Ketenagakerjaan + PP Pengupahan + UU BPJS + UU PPh 21 + Permenaker/SE Dirjen Pajak.
</p>
`;

showPopup(html);
saveToArchiveHTML("CTC", html, safe(data.nama), new Date().toISOString());
renderArchive();
}

// ================= DEFAULT DAN RUMUS SEVERANCE =================
function resetSeveranceForm(){
  document.getElementById("sevNama").value = "";
  document.getElementById("sevUpah").value = "";
  document.getElementById("sevMasuk").value = "";
  document.getElementById("sevKeluar").value = "";

  document.getElementById("sevAlasan").value = "efisiensi"; // default

  document.getElementById("sevCuti").selectedIndex = 1;
  document.getElementById("sevHariKerja").selectedIndex = 1;
}

// Hitung masa kerja berdasarkan tanggal masuk dan keluar
function getMasaKerja(masuk, keluar){
const m=new Date(masuk+"T00:00:00");
const k=new Date(keluar+"T00:00:00");
let hari=Math.floor((k-m)/(1000*60*60*24)); // total hari
let tahun=Math.floor(hari/365); hari-=tahun*365;
let bulan=Math.floor(hari/30); hari-=bulan*30;
return {tahun,bulan,hari};
}

// Hitung jumlah bulan pesangon berdasarkan masa kerja
function getPesangon(th){
if(th <1) return 1;
if(th <2) return 2;
if(th <3) return 3;
if(th <4) return 4;
if(th <5) return 5;
if(th <6) return 6;
if(th <7) return 7;
if(th <8) return 8;
return 9;
}

// Hitung UPMK (uang pengganti masa kerja) berdasarkan masa kerja
function getUPMK(th){
let t = Math.floor(th);
if(t >= 24) return 10;
if(t >= 21) return 8;
if(t >= 18) return 7;
if(t >= 15) return 6;
if(t >= 12) return 5;
if(t >= 9)  return 4;
if(t >= 6)  return 3;
if(t >= 3)  return 2;
return 0;
}

// Default faktor PHK
const defaultFaktorMap = {
  efisiensi:0.5,
  merger:0.5,
  pailit:0.5,
  tutup_rugi:0.5,
  force:0.5,
  sakit:2,
  pensiun:1.75,
  meninggal:2,
  resign:0,
  mangkir:0,
  pelanggaran:0,
  kontrak_habis:0
};

// Faktor yang sedang dipakai (bisa diubah user)
let userFaktorMap = {...defaultFaktorMap};

// Fungsi dipanggil input user
function updateFaktor(alasan, value){
  let v = parseFloat(value);
  if(!isNaN(v)){
    userFaktorMap[alasan] = v;
  }
}

// Ambil faktor untuk perhitungan
function getFaktor(alasan){
  return userFaktorMap[alasan] ?? 1;
}

// Reset semua ke default
function resetFaktorUser(){
  userFaktorMap = {...defaultFaktorMap};
  // Reset semua input HTML
  for(const alasan in defaultFaktorMap){
    const el = document.getElementById(alasan);
    if(el) el.value = defaultFaktorMap[alasan];
  }
}

const alasanLabel={
 efisiensi:"Efisiensi",
 merger:"Merger / Akuisisi",
 pailit:"Perusahaan Pailit",
 tutup_rugi:"Perusahaan Tutup Karena Rugi",
 force:"Force Majeure",
 sakit:"Sakit Berkepanjangan",
 pensiun:"Pensiun",
 meninggal:"Meninggal Dunia",
 resign:"Resign",
 mangkir:"Mangkir",
 pelanggaran:"Pelanggaran Berat",
 kontrak_habis:"Kontrak habis (PKWT)"
};
let hariKerja = document.getElementById("sevHariKerja").value || "6";
// ================== FUNCTION HITUNG SEVERANCE ==================
function calcSeverance(){
let nama = document.getElementById("sevNama").value || "-";
let upah = getNumber("sevUpah");
if(upah <= 0){
alert("Upah terakhir wajib diisi");
return;
}

let masuk = document.getElementById("sevMasuk").value;
let keluar = document.getElementById("sevKeluar").value;
let alasan = document.getElementById("sevAlasan").value;
let sisaCuti = parseFloat(document.getElementById("sevCuti").value) || 0;
let hariKerja = document.getElementById("sevHariKerja").value;

if(!masuk || !keluar){
alert("Tanggal wajib diisi");
return;
 }

if(new Date(keluar) < new Date(masuk)){
alert("Tanggal keluar tidak boleh lebih kecil dari tanggal masuk");
return;
}

const safeNama   = safe(nama);
const safeMasuk  = safe(masuk);
const safeKeluar = safe(keluar);
const safeAlasan = safe(alasanLabel[alasan] || alasan);
const safeUpah   = upah;

// ================= HITUNG MASA KERJA =================
let mk = getMasaKerja(masuk, keluar);
const thFull = mk.tahun + (mk.bulan/12) + (mk.hari/365);
const faktor = getFaktor(alasan);

// 🚨 FIX: kalau faktor 0 → semua 0
if(faktor === 0){
  const pes = 0;
  const upmk = 0;
  const cuti = 0;
  const hak = 0;
  const total = 0;
  const totalhak = 0;

  let html = `
  <table class="result-table">
    <tr><td>Nama Karyawan</td><td>${safeNama}</td></tr>
    <tr><td>Alasan PHK</td><td>${safeAlasan} (${faktor})</td></tr>

    <tr><th colspan="2">Hasil</th></tr>
    <tr><td colspan="2" style="color:red;text-align:center;">
      Tidak mendapatkan pesangon / UPMK / hak lainnya
    </td></tr>
  </table>
  `;

  showPopup(html);
  return;
}
// ================= PERHITUNGAN =================
const pembagi = (hariKerja === "6") ? 25 : 21;
const cuti = sisaCuti * upah / pembagi;

const pesBulan = getPesangon(thFull);
const pes = pesBulan * upah * faktor;
const upmk = getUPMK(thFull) * upah;
const hak = (pes + upmk) * 0.15;

const total = pes + upmk + cuti;
const totalhak = pes + upmk + cuti + hak;
    

// ================= OUTPUT SEVERANCE =================
 let html = `
<table class="result-table">

<tr><td>Nama Karyawan</td><td>${safeNama}</td></tr>
<tr><td>Tanggal Masuk</td><td>${safeMasuk}</td></tr>
<tr><td>Tanggal Keluar</td><td>${safeKeluar}</td></tr>
<tr><td>Masa Kerja</td><td>${mk.tahun} tahun ${mk.bulan} bulan ${mk.hari} hari</td></tr>
<tr><td>Upah Terakhir</td><td>Rp ${formatNum(safeUpah)}</td></tr>
<tr><td>Alasan PHK</td><td>${safeAlasan} (${faktor})</td></tr>

<tr><th colspan="2">Perhitungan Pesangon</th></tr>
<tr><td>Pesangon</td><td>${pesBulan} × Rp ${formatNum(safeUpah)} × ${faktor} = Rp ${formatNum(pes)}</td></tr>
<tr><td>UPMK</td><td>${getUPMK(thFull)} × Rp ${formatNum(safeUpah)} = Rp ${formatNum(upmk)}</td></tr>
<tr><td>Penggantian Sisa Cuti (${sisaCuti} hari)</td>
<td>${sisaCuti} × Rp ${formatNum(safeUpah)} ÷ ${pembagi} = Rp ${formatNum(cuti)}</td></tr>
<tr><td><b>Total Pesangon</b></td><td><b>Rp ${formatNum(total)}</b></td></tr>



</table>
<p style="font-size:12px;margin-top:8px;">
UU Ketenagakerjaan + PP 35/2021 + Permenaker/SE terkait PHK
</p>
`;

showPopup(html);
saveToArchiveHTML("SEV", html, safeNama, new Date().toISOString());
renderArchive();
}










