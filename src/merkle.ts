// Off-chain Merkle tree builder matching the on-chain persistentHash logic
// in whistleblower.compact. Uses the REAL persistentHash from
// @midnight-ntwrk/compact-runtime so leaf/pair hashing is byte-identical
// to what the compiled circuit computes at proof time — no reimplementation,
// no risk of drift.

import { persistentHash, CompactTypeBytes } from '@midnight-ntwrk/compact-runtime';

const DEPTH = 8;

// Bytes<32> descriptor — same as _descriptor_2 in the compiled contract.
const Bytes32 = new CompactTypeBytes(32);

// Tuple<Bytes<32>, Bytes<32>> descriptor — replicates _tuple_1 / _descriptor_8
// exactly as generated in contract/managed/whistleblower/contract/index.js.
class BytesPairType {
  alignment() {
    return Bytes32.alignment().concat(Bytes32.alignment());
  }
  fromValue(value: unknown) {
    return [Bytes32.fromValue(value), Bytes32.fromValue(value)];
  }
  toValue(value: [Uint8Array, Uint8Array]) {
    return Bytes32.toValue(value[0]).concat(Bytes32.toValue(value[1]));
  }
}
const BytesPair = new BytesPairType();

/** Matches: const leaf = persistentHash<Bytes<32>>(secretIdentity); */
export function hashLeaf(secretIdentity: Uint8Array): Uint8Array {
  return persistentHash(Bytes32, secretIdentity);
}

/** Matches: persistentHash<[Bytes<32>, Bytes<32>]>([a, b]); */
export function hashPair(a: Uint8Array, b: Uint8Array): Uint8Array {
  return persistentHash(BytesPair, [a, b]);
}

export function buildMerkleTree(secretIdentities: Uint8Array[]): {
  root: Uint8Array;
  layers: Uint8Array[][];
} {
  const leaves = secretIdentities.map(hashLeaf);
  // Pad to 2^DEPTH with a fixed zero-leaf. NOTE: an all-zero 32-byte input
  // is itself a valid witness value, so anyone submitting an all-zero
  // secretIdentity would match a padding slot. For a real deployment,
  // use a domain-separated padding leaf instead (e.g. hash of a constant
  // sentinel) rather than raw zeros. Flagging this now so it doesn't slip
  // through silently.
  while (leaves.length < 2 ** DEPTH) leaves.push(new Uint8Array(32));

  const layers: Uint8Array[][] = [leaves];
  for (let d = 0; d < DEPTH; d++) {
    const prev = layers[layers.length - 1];
    const next: Uint8Array[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push(hashPair(prev[i], prev[i + 1]));
    }
    layers.push(next);
  }
  return { root: layers[DEPTH][0], layers };
}

export function getMerkleProof(
  layers: Uint8Array[][],
  leafIndex: number,
): { merklePath: Uint8Array[]; pathDirections: boolean[] } {
  const merklePath: Uint8Array[] = [];
  const pathDirections: boolean[] = [];
  let idx = leafIndex;
  for (let d = 0; d < DEPTH; d++) {
    const isRightNode = idx % 2 === 1;
    const siblingIdx = isRightNode ? idx - 1 : idx + 1;
    merklePath.push(layers[d][siblingIdx]);
    // Matches circuit semantics: pathDirections[i] ? [sibling, current] : [current, sibling]
    // true = "I am the right child, sibling goes first"
    pathDirections.push(isRightNode);
    idx = Math.floor(idx / 2);
  }
  return { merklePath, pathDirections };
}
