const RES_XML_TYPE = 0x0003;
const RES_STRING_POOL_TYPE = 0x0001;
const UTF8_FLAG = 0x0100;

function readUtf8String(buf, offset) {
  let cursor = offset;
  const charLenByte = buf.readUInt8(cursor++);
  if ((charLenByte & 0x80) !== 0) {
    cursor++;
  }
  let byteLen = buf.readUInt8(cursor++);
  if ((byteLen & 0x80) !== 0) {
    byteLen = ((byteLen & 0x7f) << 8) | buf.readUInt8(cursor++);
  }
  return buf.toString('utf8', cursor, cursor + byteLen);
}

function encodeUtf8String(text) {
  const utf8 = Buffer.from(text, 'utf8');
  const charLen = text.length;
  const header = [];
  if (charLen > 0x7f) {
    header.push(((charLen >> 8) & 0x7f) | 0x80, charLen & 0xff);
  } else {
    header.push(charLen);
  }
  if (utf8.length > 0x7f) {
    header.push(((utf8.length >> 8) & 0x7f) | 0x80, utf8.length & 0xff);
  } else {
    header.push(utf8.length);
  }
  return Buffer.concat([Buffer.from(header), utf8, Buffer.from([0])]);
}

function readUtf16String(buf, offset) {
  const first = buf.readUInt16LE(offset);
  let cursor = offset + 2;
  let charLen = first;
  if ((first & 0x8000) !== 0) {
    const second = buf.readUInt16LE(cursor);
    cursor += 2;
    charLen = ((first & 0x7fff) << 16) | second;
  }
  return buf.toString('utf16le', cursor, cursor + charLen * 2);
}

function encodeUtf16String(text) {
  const utf16 = Buffer.from(text, 'utf16le');
  const charLen = utf16.length / 2;
  let lenBuf;
  if (charLen > 0x7fff) {
    lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt16LE(((charLen >> 16) & 0x7fff) | 0x8000, 0);
    lenBuf.writeUInt16LE(charLen & 0xffff, 2);
  } else {
    lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(charLen, 0);
  }
  return Buffer.concat([lenBuf, utf16, Buffer.from([0, 0])]);
}

/**
 * Rewrites application ID, authority, permission, and share taskAffinity entries
 * inside a compiled Android binary {@code AndroidManifest.xml} string pool.
 */
export function rewriteManifestPackage(axmlBuffer, targetPackage, sourcePackage = 'com.discord') {
  if (!targetPackage || targetPackage === sourcePackage) {
    return axmlBuffer;
  }

  const xmlType = axmlBuffer.readUInt16LE(0);
  const xmlHeaderSize = axmlBuffer.readUInt16LE(2);
  const xmlSize = axmlBuffer.readUInt32LE(4);
  if (xmlType !== RES_XML_TYPE || xmlSize !== axmlBuffer.length) {
    throw new Error('Unexpected AXML file header in AndroidManifest.xml');
  }

  const spOffset = xmlHeaderSize;
  const spType = axmlBuffer.readUInt16LE(spOffset);
  const spHeaderSize = axmlBuffer.readUInt16LE(spOffset + 2);
  const spSize = axmlBuffer.readUInt32LE(spOffset + 4);
  const stringCount = axmlBuffer.readUInt32LE(spOffset + 8);
  const styleCount = axmlBuffer.readUInt32LE(spOffset + 12);
  const flags = axmlBuffer.readUInt32LE(spOffset + 16);
  const stringsStart = axmlBuffer.readUInt32LE(spOffset + 20);
  const stylesStart = axmlBuffer.readUInt32LE(spOffset + 24);
  if (spType !== RES_STRING_POOL_TYPE) {
    throw new Error('Expected ResStringPool immediately after AXML header');
  }

  const isUtf8 = (flags & UTF8_FLAG) !== 0;
  const stringBase = spOffset + stringsStart;

  const exactAuthoritySet = new Set([
    `${sourcePackage}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`,
    `${sourcePackage}.SentryInitProvider`,
    `${sourcePackage}.SentryPerformanceProvider`,
    `${sourcePackage}.androidx-startup`,
    `${sourcePackage}.file-provider`,
    `${sourcePackage}.fileprovider`,
    `${sourcePackage}.firebaseinitprovider`,
    `${sourcePackage}.imagepickerprovider`,
    `${sourcePackage}.provider`,
    `${sourcePackage}.share`,
  ]);

  const encodedStrings = [];
  const newOffsets = Buffer.alloc(stringCount * 4);
  let cursor = 0;

  for (let i = 0; i < stringCount; i++) {
    const strOffset = axmlBuffer.readUInt32LE(spOffset + spHeaderSize + i * 4);
    let value = isUtf8
      ? readUtf8String(axmlBuffer, stringBase + strOffset)
      : readUtf16String(axmlBuffer, stringBase + strOffset);

    if (value === sourcePackage) {
      value = targetPackage;
    } else if (exactAuthoritySet.has(value)) {
      value = targetPackage + value.slice(sourcePackage.length);
    }

    newOffsets.writeUInt32LE(cursor, i * 4);
    const encoded = isUtf8 ? encodeUtf8String(value) : encodeUtf16String(value);
    encodedStrings.push(encoded);
    cursor += encoded.length;
  }

  const paddingLen = (4 - (cursor % 4)) % 4;
  if (paddingLen > 0) {
    encodedStrings.push(Buffer.alloc(paddingLen));
    cursor += paddingLen;
  }

  const newStringData = Buffer.concat(encodedStrings);
  const oldStringsEnd = styleCount > 0 ? spOffset + stylesStart : spOffset + spSize;
  const oldStringDataLen = oldStringsEnd - stringBase;
  const sizeDelta = newStringData.length - oldStringDataLen;

  const spPrefix = Buffer.from(axmlBuffer.subarray(spOffset, spOffset + spHeaderSize));
  const styleOffsetsLen = styleCount * 4;
  const preStringGap = axmlBuffer.subarray(
    spOffset + spHeaderSize + stringCount * 4,
    stringBase,
  );
  const styleData = axmlBuffer.subarray(oldStringsEnd, spOffset + spSize);
  const trailingXml = axmlBuffer.subarray(spOffset + spSize);

  spPrefix.writeUInt32LE(spSize + sizeDelta, 4);
  if (styleCount > 0 && stylesStart > 0) {
    spPrefix.writeUInt32LE(stylesStart + sizeDelta, 24);
  }

  const xmlHeader = Buffer.from(axmlBuffer.subarray(0, xmlHeaderSize));
  xmlHeader.writeUInt32LE(axmlBuffer.length + sizeDelta, 4);

  if (styleOffsetsLen === 0 && preStringGap.length !== 0) {
    return Buffer.concat([xmlHeader, spPrefix, newOffsets, preStringGap, newStringData, styleData, trailingXml]);
  }
  return Buffer.concat([xmlHeader, spPrefix, newOffsets, preStringGap, newStringData, styleData, trailingXml]);
}

const RES_TABLE_TYPE = 0x0002;
const RES_TABLE_PACKAGE_TYPE = 0x0200;
const ARSC_PACKAGE_NAME_BYTES = 256;

/**
 * Rewrites the fixed 256-byte UTF-16LE {@code ResTable_package.name} field inside
 * a compiled {@code resources.arsc} table without altering chunk sizes or offsets.
 */
export function rewriteArscPackage(arscBuffer, targetPackage, sourcePackage = 'com.discord') {
  if (!targetPackage || targetPackage === sourcePackage) {
    return arscBuffer;
  }
  if (targetPackage.length > 127) {
    throw new Error(`Target package name exceeds 127 UTF-16 characters: ${targetPackage}`);
  }

  const tableType = arscBuffer.readUInt16LE(0);
  const tableHeaderSize = arscBuffer.readUInt16LE(2);
  const tableSize = arscBuffer.readUInt32LE(4);
  if (tableType !== RES_TABLE_TYPE || tableSize !== arscBuffer.length) {
    throw new Error('Unexpected ARSC file header in resources.arsc');
  }

  const outBuffer = Buffer.from(arscBuffer);
  let pos = tableHeaderSize;

  while (pos + 8 <= outBuffer.length) {
    const chunkType = outBuffer.readUInt16LE(pos);
    const chunkSize = outBuffer.readUInt32LE(pos + 4);
    if (chunkSize < 8) {
      throw new Error(`Corrupt chunk size ${chunkSize} at offset ${pos} in resources.arsc`);
    }

    if (chunkType === RES_TABLE_PACKAGE_TYPE && pos + 12 + ARSC_PACKAGE_NAME_BYTES <= outBuffer.length) {
      const currentName = outBuffer
        .toString('utf16le', pos + 12, pos + 12 + ARSC_PACKAGE_NAME_BYTES)
        .split('\u0000')[0];
      if (currentName === sourcePackage) {
        outBuffer.fill(0, pos + 12, pos + 12 + ARSC_PACKAGE_NAME_BYTES);
        outBuffer.write(targetPackage, pos + 12, 'utf16le');
      }
    }

    pos += chunkSize;
  }

  return outBuffer;
}
