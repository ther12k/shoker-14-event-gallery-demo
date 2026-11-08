/**
 * Face clustering utilities (ported from the Supercamp SDIT gallery pipeline).
 *
 * Index-time faces carry a 128-d SFace embedding; this module clusters them
 * into person-like groups with average-linkage agglomerative clustering
 * (NN-chain, exact for reducible linkages) plus one domain rule: two clusters
 * that already contain faces from the same photo never merge — two different
 * children in one group shot are two different people.
 */

export interface FaceBoundingBox {
  /** Normalized 0..1 left coordinate */
  x: number;
  /** Normalized 0..1 top coordinate */
  y: number;
  /** Normalized 0..1 width */
  w: number;
  /** Normalized 0..1 height */
  h: number;
}

/** Metadata for one indexed face crop that is safe to expose to the browser */
export interface FaceCropRecord {
  faceId: string;
  fileId: string;
  photoTitle: string;
  category: string;
  session: number;
  time: string;
  fileName: string;
  box: FaceBoundingBox;
  cropUrl: string;
  /** Detector confidence 0..1 */
  detectionScore: number;
  /** Person group this face belongs to (filled by the clustering pass) */
  groupId: string;
}

/**
 * Private face record persisted server-side: everything the browser sees plus
 * the 128-dimensional SFace embedding. Never send descriptors to the client —
 * they are biometric data and only needed for clustering/matching.
 */
export interface IndexedFace extends Omit<FaceCropRecord, "groupId"> {
  descriptor: number[];
}

/**
 * Maximum Euclidean embedding distance for two faces to join the same group.
 * The Supercamp pipeline tuned 0.9 on a 440-photo library (3.4k faces):
 * 1.05+ over-merges similar uniformed children into mega-groups, 0.9 keeps
 * top clusters coherent while still linking one child across dozens of photos.
 */
export const FACE_CLUSTER_MAX_DISTANCE = 0.9;

/** Scales a vector to unit L2 norm so Euclidean distance relates to cosine distance */
export function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm < 1e-10) return vec.map(() => 0);
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

/** Plain Euclidean distance between two equal-length vectors */
export function euclideanDistance(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sumSq = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sumSq += d * d;
  }
  return Math.sqrt(sumSq);
}

export interface ChainMerge {
  a: number;
  b: number;
  /** Average-linkage distance between the two clusters at merge time */
  distance: number;
}

/**
 * Full agglomerative merge list via the Nearest-Neighbor-Chain algorithm
 * (exact for average linkage, O(n²)). Merges are NOT globally ascending, so
 * callers must not stop at the first merge above a threshold — replay the
 * whole list instead (scipy applies the same dendrogram-then-cut strategy).
 */
export function nnChainMerges(descriptors: number[][]): ChainMerge[] {
  const n = descriptors.length;
  if (n <= 1) return [];

  const dim = descriptors[0].length;
  const flat = new Float32Array(n * dim);
  for (let i = 0; i < n; i++) {
    const desc = descriptors[i];
    if (desc.length !== dim) {
      throw new Error("All descriptors must share the same dimension");
    }
    for (let d = 0; d < dim; d++) {
      flat[i * dim + d] = desc[d];
    }
  }

  const dist = new Float32Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let sumSq = 0;
      for (let d = 0; d < dim; d++) {
        const diff = flat[i * dim + d] - flat[j * dim + d];
        sumSq += diff * diff;
      }
      const d = Math.sqrt(sumSq);
      dist[i * n + j] = d;
      dist[j * n + i] = d;
    }
  }

  const sizes = new Float64Array(n).fill(1);
  const active = new Uint8Array(n).fill(1);
  let activeCount = n;
  const merges: ChainMerge[] = [];

  const chain: number[] = [];
  let cursor = 0;

  while (activeCount > 1) {
    if (chain.length === 0) {
      while (cursor < n && !active[cursor]) cursor++;
      if (cursor >= n) break;
      chain.push(cursor);
    }

    let mergeA = -1;
    let mergeB = -1;
    while (true) {
      const last = chain[chain.length - 1];
      let best = -1;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let j = 0; j < n; j++) {
        if (!active[j] || j === last) continue;
        const d = dist[last * n + j];
        if (d < bestDist) {
          bestDist = d;
          best = j;
        }
      }
      if (best === -1) break;

      // Mutual nearest neighbors only when best is the previous chain element
      if (chain.length >= 2 && best === chain[chain.length - 2]) {
        mergeA = best;
        mergeB = last;
        chain.length -= 2;
        break;
      }
      if (chain.includes(best)) {
        // Cycle without a mutual pair at the tail — restart from `best`
        chain.length = chain.indexOf(best);
      }
      chain.push(best);
    }

    if (mergeA === -1) {
      chain.length = 0;
      continue;
    }

    merges.push({ a: mergeA, b: mergeB, distance: dist[mergeA * n + mergeB] });

    const sizeA = sizes[mergeA];
    const sizeB = sizes[mergeB];
    for (let k = 0; k < n; k++) {
      if (!active[k] || k === mergeA || k === mergeB) continue;
      const dK =
        (sizeA * dist[mergeA * n + k] + sizeB * dist[mergeB * n + k]) /
        (sizeA + sizeB);
      dist[mergeA * n + k] = dK;
      dist[k * n + mergeA] = dK;
    }
    sizes[mergeA] = sizeA + sizeB;
    active[mergeB] = 0;
    activeCount--;
  }

  return merges;
}

/** Union-find with path compression for merge replay */
class DisjointSet {
  parent: Int32Array;
  constructor(n: number) {
    this.parent = new Int32Array(n);
    for (let i = 0; i < n; i++) this.parent[i] = i;
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[rb] = ra;
  }
}

export interface ClusterableFace {
  faceId: string;
  fileId: string;
  descriptor: number[];
}

export interface FaceGroup<T extends { faceId: string } = FaceCropRecord> {
  /** Stable display id like "grup-1" (1 = largest group) */
  groupId: string;
  /** All face crops belonging to this group */
  faces: T[];
  /** Medoid face (closest to all other members) used as the group thumbnail */
  representative: T;
  /** Unique photo fileIds, ordered best-match first (closest face to the medoid) */
  photoIds: string[];
  /** Number of unique photos this group appears in */
  photoCount: number;
}

/**
 * Replays the full merge list, applying the distance cutoff plus one
 * cannot-link rule: two clusters that already contain faces from the same
 * photo never merge — different children in one group shot are different
 * people. Returns compact cluster indices aligned with the input array.
 * (Greedy approximation: skipped merges leave later linkage distances stale,
 * which is acceptable — see the Supercamp pipeline notes.)
 */
export function assignFaceClusters(
  faces: ClusterableFace[],
  merges: ChainMerge[],
  maxDistance: number
): number[] {
  const n = faces.length;
  if (n === 0) return [];

  const dsu = new DisjointSet(n);
  const photoSets = new Map<number, Set<string>>();
  for (let i = 0; i < n; i++) photoSets.set(i, new Set([faces[i].fileId]));

  for (const { a, b, distance } of merges) {
    if (distance > maxDistance) continue;
    const ra = dsu.find(a);
    const rb = dsu.find(b);
    if (ra === rb) continue;
    const photosA = photoSets.get(ra)!;
    const photosB = photoSets.get(rb)!;
    let sharePhoto = false;
    for (const id of photosB) {
      if (photosA.has(id)) {
        sharePhoto = true;
        break;
      }
    }
    if (sharePhoto) continue;
    dsu.union(ra, rb);
    const mergedRoot = dsu.find(ra);
    const mergedSet = photosA;
    for (const id of photosB) mergedSet.add(id);
    photoSets.set(mergedRoot, mergedSet);
    photoSets.delete(mergedRoot === ra ? rb : ra);
  }

  const remap = new Map<number, number>();
  const clusterOf = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const root = dsu.find(i);
    let id = remap.get(root);
    if (id === undefined) {
      id = remap.size;
      remap.set(root, id);
    }
    clusterOf[i] = id;
  }
  return clusterOf;
}

/**
 * Clusters indexed faces into person-like groups (Google Photos style),
 * ordered largest-first with stable display ids.
 */
export function buildFaceGroups<T extends ClusterableFace>(
  faces: T[],
  maxDistance: number = FACE_CLUSTER_MAX_DISTANCE
): FaceGroup<T>[] {
  if (faces.length === 0) return [];

  const merges = nnChainMerges(faces.map((f) => f.descriptor));
  const clusterOf = assignFaceClusters(faces, merges, maxDistance);

  const buckets = new Map<number, T[]>();
  faces.forEach((face, idx) => {
    const cluster = clusterOf[idx];
    const bucket = buckets.get(cluster);
    if (bucket) {
      bucket.push(face);
    } else {
      buckets.set(cluster, [face]);
    }
  });

  const groups: FaceGroup<T>[] = [];
  for (const members of buckets.values()) {
    let medoidIdx = 0;
    let medoidSum = Number.POSITIVE_INFINITY;
    for (let i = 0; i < members.length; i++) {
      let sum = 0;
      for (let j = 0; j < members.length; j++) {
        if (i === j) continue;
        sum += euclideanDistance(members[i].descriptor, members[j].descriptor);
      }
      if (sum < medoidSum) {
        medoidSum = sum;
        medoidIdx = i;
      }
    }
    const representative = members[medoidIdx];

    const bestByPhoto = new Map<string, number>();
    for (const member of members) {
      const d = euclideanDistance(member.descriptor, representative.descriptor);
      const existing = bestByPhoto.get(member.fileId);
      if (existing === undefined || d < existing) {
        bestByPhoto.set(member.fileId, d);
      }
    }
    const photoIds = Array.from(bestByPhoto.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([fileId]) => fileId);

    groups.push({
      groupId: "",
      faces: members,
      representative,
      photoIds,
      photoCount: photoIds.length,
    });
  }

  groups.sort(
    (a, b) =>
      b.faces.length - a.faces.length ||
      b.photoCount - a.photoCount ||
      a.representative.faceId.localeCompare(b.representative.faceId)
  );
  return groups.map((group, idx) => ({ ...group, groupId: `grup-${idx + 1}` }));
}
