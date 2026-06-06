/* eslint-disable */
// QR Code generator — точная реализация qrcode-generator (Kazuhiko Arase, MIT).
// EC level L. Возвращает матрицу модулей для рендера. (TS→JS port из creator-club)

// ── QRMath ───────────────────────────────────────────────────────
const QRMath = (() => {
  const EXP_TABLE = new Array(256);
  const LOG_TABLE = new Array(256);
  for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++)
    EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
  for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;
  return {
    glog(n) { if (n < 1) throw new Error('glog(' + n + ')'); return LOG_TABLE[n]; },
    gexp(n) { while (n < 0) n += 255; while (n >= 256) n -= 255; return EXP_TABLE[n]; },
  };
})();

// ── QRPolynomial ─────────────────────────────────────────────────
class QRPolynomial {
  constructor(num, shift) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  get(i) { return this.num[i]; }
  getLength() { return this.num.length; }
  multiply(e) {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++)
      for (let j = 0; j < e.getLength(); j++)
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
    return new QRPolynomial(num, 0);
  }
  mod(e) {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = this.num.slice();
    for (let i = 0; i < e.getLength(); i++)
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    return new QRPolynomial(num, 0).mod(e);
  }
}

// ── QRBitBuffer ──────────────────────────────────────────────────
class QRBitBuffer {
  constructor() { this.buffer = []; this.length = 0; }
  get(index) { return ((this.buffer[Math.floor(index / 8)] >>> (7 - index % 8)) & 1) === 1; }
  put(num, length) {
    for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1);
  }
  putBit(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    this.length++;
  }
}

// ── QRRSBlock (EC level L) — [count, totalCount, dataCount] версии 1..20 ──
const RS_BLOCK_TABLE_L = [
  [1, 26, 19], [1, 44, 34], [1, 70, 55], [1, 100, 80], [1, 134, 108],
  [2, 86, 68], [2, 98, 78], [2, 121, 97], [2, 146, 116], [2, 86, 68, 2, 87, 69],
  [4, 101, 81], [2, 116, 92, 2, 117, 93], [4, 133, 107], [3, 145, 115, 1, 146, 116],
  [5, 109, 87, 1, 110, 88], [5, 122, 98, 1, 123, 99], [1, 135, 107, 5, 136, 108],
  [5, 150, 120, 1, 151, 121], [3, 141, 113, 4, 142, 114], [3, 135, 107, 5, 136, 108],
];
function getRSBlocks(version) {
  const table = RS_BLOCK_TABLE_L[version - 1];
  const list = [];
  for (let i = 0; i < table.length; i += 3) {
    const count = table[i], totalCount = table[i + 1], dataCount = table[i + 2];
    for (let j = 0; j < count; j++) list.push({ totalCount, dataCount });
  }
  return list;
}

// ── QRUtil ───────────────────────────────────────────────────────
const PATTERN_POSITION_TABLE = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
  [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70],
  [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
];
const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

function bchDigit(data) { let digit = 0; while (data !== 0) { digit++; data >>>= 1; } return digit; }
function getBCHTypeInfo(data) {
  let d = data << 10;
  while (bchDigit(d) - bchDigit(G15) >= 0) d ^= G15 << (bchDigit(d) - bchDigit(G15));
  return ((data << 10) | d) ^ G15_MASK;
}
function getBCHTypeNumber(data) {
  let d = data << 12;
  while (bchDigit(d) - bchDigit(G18) >= 0) d ^= G18 << (bchDigit(d) - bchDigit(G18));
  return (data << 12) | d;
}
function getErrorCorrectPolynomial(ecLength) {
  let a = new QRPolynomial([1], 0);
  for (let i = 0; i < ecLength; i++) a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
  return a;
}
function getMask(i, j) { return (i + j) % 2 === 0; }

// ── QRCodeModel ──────────────────────────────────────────────────
const PAD0 = 0xec, PAD1 = 0x11;

export function generateQR(text) {
  const data = Array.from(new TextEncoder().encode(text));

  let version = 1;
  for (; version <= 20; version++) {
    const blocks = getRSBlocks(version);
    let totalData = 0;
    for (const b of blocks) totalData += b.dataCount;
    const lenBits = version < 10 ? 8 : 16;
    const need = Math.ceil((4 + lenBits + data.length * 8) / 8);
    if (need <= totalData) break;
  }
  if (version > 20) throw new Error('Текст слишком длинный для QR');

  const rsBlocks = getRSBlocks(version);
  const buffer = new QRBitBuffer();
  buffer.put(4, 4);
  const lenBits = version < 10 ? 8 : 16;
  buffer.put(data.length, lenBits);
  for (const b of data) buffer.put(b, 8);

  let totalDataCount = 0;
  for (const b of rsBlocks) totalDataCount += b.dataCount;
  if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
  while (buffer.length % 8 !== 0) buffer.putBit(false);
  while (true) {
    if (buffer.length >= totalDataCount * 8) break;
    buffer.put(PAD0, 8);
    if (buffer.length >= totalDataCount * 8) break;
    buffer.put(PAD1, 8);
  }

  let offset = 0;
  let maxDcCount = 0, maxEcCount = 0;
  const dcdata = new Array(rsBlocks.length);
  const ecdata = new Array(rsBlocks.length);
  for (let r = 0; r < rsBlocks.length; r++) {
    const dcCount = rsBlocks[r].dataCount;
    const ecCount = rsBlocks[r].totalCount - dcCount;
    maxDcCount = Math.max(maxDcCount, dcCount);
    maxEcCount = Math.max(maxEcCount, ecCount);
    dcdata[r] = new Array(dcCount);
    for (let i = 0; i < dcCount; i++) dcdata[r][i] = 0xff & buffer.buffer[i + offset];
    offset += dcCount;
    const rsPoly = getErrorCorrectPolynomial(ecCount);
    const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
    const modPoly = rawPoly.mod(rsPoly);
    ecdata[r] = new Array(rsPoly.getLength() - 1);
    for (let i = 0; i < ecdata[r].length; i++) {
      const modIndex = i + modPoly.getLength() - ecdata[r].length;
      ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
    }
  }

  let totalCodeCount = 0;
  for (const b of rsBlocks) totalCodeCount += b.totalCount;
  const dataArr = new Array(totalCodeCount);
  let index = 0;
  for (let i = 0; i < maxDcCount; i++)
    for (let r = 0; r < rsBlocks.length; r++)
      if (i < dcdata[r].length) dataArr[index++] = dcdata[r][i];
  for (let i = 0; i < maxEcCount; i++)
    for (let r = 0; r < rsBlocks.length; r++)
      if (i < ecdata[r].length) dataArr[index++] = ecdata[r][i];

  const moduleCount = version * 4 + 17;
  const modules = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(null));

  const setupProbe = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || moduleCount <= col + c) continue;
        modules[row + r][col + c] =
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4);
      }
    }
  };
  setupProbe(0, 0); setupProbe(moduleCount - 7, 0); setupProbe(0, moduleCount - 7);

  const pos = PATTERN_POSITION_TABLE[version - 1];
  for (let i = 0; i < pos.length; i++)
    for (let j = 0; j < pos.length; j++) {
      const row = pos[i], col = pos[j];
      if (modules[row][col] !== null) continue;
      for (let r = -2; r <= 2; r++)
        for (let c = -2; c <= 2; c++)
          modules[row + r][col + c] =
            r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0);
    }

  for (let r = 8; r < moduleCount - 8; r++)
    if (modules[r][6] === null) modules[r][6] = r % 2 === 0;
  for (let c = 8; c < moduleCount - 8; c++)
    if (modules[6][c] === null) modules[6][c] = c % 2 === 0;

  const typeInfoBits = getBCHTypeInfo((1 << 3) | 0);
  for (let i = 0; i < 15; i++) {
    const mod = ((typeInfoBits >> i) & 1) === 1;
    if (i < 6) modules[i][8] = mod;
    else if (i < 8) modules[i + 1][8] = mod;
    else modules[moduleCount - 15 + i][8] = mod;
    if (i < 8) modules[8][moduleCount - i - 1] = mod;
    else if (i < 9) modules[8][15 - i - 1 + 1] = mod;
    else modules[8][15 - i - 1] = mod;
  }
  modules[moduleCount - 8][8] = true;

  if (version >= 7) {
    const bits = getBCHTypeNumber(version);
    for (let i = 0; i < 18; i++) {
      const mod = ((bits >> i) & 1) === 1;
      modules[Math.floor(i / 3)][i % 3 + moduleCount - 8 - 3] = mod;
      modules[i % 3 + moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  let inc = -1;
  let row = moduleCount - 1;
  let bitIndex = 7;
  let byteIndex = 0;
  for (let col = moduleCount - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        if (modules[row][col - c] === null) {
          let dark = false;
          if (byteIndex < dataArr.length)
            dark = ((dataArr[byteIndex] >>> bitIndex) & 1) === 1;
          if (getMask(row, col - c)) dark = !dark;
          modules[row][col - c] = dark;
          bitIndex--;
          if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
        }
      }
      row += inc;
      if (row < 0 || moduleCount <= row) { row -= inc; inc = -inc; break; }
    }
  }

  const out = modules.map((r) => r.map((v) => v === true));
  return { size: moduleCount, modules: out };
}
