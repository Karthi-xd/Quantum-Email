export type Bit = 0 | 1;
export type Basis = '+' | '×';
export type Qubit = { bit: Bit; basis: Basis };

const randomBit = (): Bit => (Math.random() < 0.5 ? 0 : 1);
const randomBasis = (): Basis => (Math.random() < 0.5 ? '+' : '×');

export const generateQubits = (length: number): Qubit[] => {
  return Array.from({ length }, () => ({
    bit: randomBit(),
    basis: randomBasis(),
  }));
};

export const measureQubit = (qubit: Qubit, measureBasis: Basis): Bit => {
  if (qubit.basis === measureBasis) {
    return qubit.bit;
  }
  return randomBit();
};

export const bb84KeyExchange = (numQubits: number = 10) => {
  const aliceQubits = generateQubits(numQubits);
  const aliceBases = aliceQubits.map(q => q.basis);
  
  const bobBases = Array.from({ length: numQubits }, () => randomBasis());
  const bobMeasurements = aliceQubits.map((q, i) => measureQubit(q, bobBases[i]));
  
  const aliceBasesPublic = aliceBases.join('');
  const bobBasesPublic = bobBases.join('');
  
  const matchingIndices: number[] = [];
  for (let i = 0; i < numQubits; i++) {
    if (aliceBasesPublic[i] === bobBasesPublic[i]) {
      matchingIndices.push(i);
    }
  }
  
  const aliceKey = matchingIndices.map(i => aliceQubits[i].bit);
  const bobKey = matchingIndices.map(i => bobMeasurements[i]);
  
  const keyMatch = aliceKey.length > 0 && aliceKey.every((b, i) => b === bobKey[i]);
  
  return {
    aliceKey,
    bobKey,
    keyMatch,
    matchingBits: aliceKey.length,
  };
};

export const generateSharedKey = (length: number = 32): string => {
  const result = bb84KeyExchange(length);
  if (!result.keyMatch) {
    return generateSharedKey(length);
  }
  return result.bobKey.join('');
};

export const qkdEncrypt = (message: string, key: string): string => {
  const keyRepeated = key.repeat(Math.ceil(message.length / key.length));
  let encrypted = '';
  for (let i = 0; i < message.length; i++) {
    const msgChar = message.charCodeAt(i);
    const keyChar = keyRepeated.charCodeAt(i);
    const encryptedChar = msgChar ^ keyChar;
    encrypted += String.fromCharCode(encryptedChar);
  }
  return btoa(encrypted);
};

export const qkdDecrypt = (encrypted: string, key: string): string => {
  const decrypted = atob(encrypted);
  const keyRepeated = key.repeat(Math.ceil(decrypted.length / key.length));
  let result = '';
  for (let i = 0; i < decrypted.length; i++) {
    const encChar = decrypted.charCodeAt(i);
    const keyChar = keyRepeated.charCodeAt(i);
    const decryptedChar = encChar ^ keyChar;
    result += String.fromCharCode(decryptedChar);
  }
  return result;
};

export const simulateEavesdropping = (qubit: Qubit): { detected: boolean; measuredBit: Bit } => {
  const eveBasis = randomBasis();
  const measuredBit = measureQubit(qubit, eveBasis);
  const detected = qubit.basis !== eveBasis;
  return { detected, measuredBit };
};
