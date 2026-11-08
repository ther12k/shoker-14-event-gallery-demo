import test from "node:test";
import assert from "node:assert/strict";
import {
  assignFaceClusters,
  buildFaceGroups,
  euclideanDistance,
  l2Normalize,
  nnChainMerges,
} from "./faceSearchUtils";

/* Three well-separated unit vectors: each "person" is a pair of near
   duplicates, plus a chain of medium-distance merges that must not stop at
   the first above-threshold merge. */
const A1 = l2Normalize([1, 0.01, 0]);
const A2 = l2Normalize([1, 0.02, 0]);
const B1 = l2Normalize([0.01, 1, 0]);
const B2 = l2Normalize([0.02, 1, 0]);
const C1 = l2Normalize([0, 0, 1]);
const C2 = l2Normalize([0, 0.01, 1]);

test("l2Normalize scales vectors to unit norm and euclideanDistance measures them", () => {
  const v = l2Normalize([3, 4]);
  assert.equal(euclideanDistance(v, l2Normalize([6, 8])), 0);
  assert.ok(Math.abs(euclideanDistance(v, [0, 0]) - 1) < 1e-6);
});

test("merge replay keeps merging below threshold even after a distant mutual pair", () => {
  const faces = [A1, B1, C1, C2, A2, B2].map((descriptor, i) => ({
    faceId: `f${i}`,
    fileId: `p${i}`,
    descriptor,
  }));
  const merges = nnChainMerges(faces.map((f) => f.descriptor));
  // all merges replayed, cutoff applied afterwards
  const clusterOf = assignFaceClusters(faces, merges, 0.5);
  assert.equal(new Set(clusterOf).size, 3);
});

test("assignFaceClusters separates distinct persons and joins similar faces", () => {
  const faces = [
    { faceId: "a1", fileId: "p1", descriptor: A1 },
    { faceId: "a2", fileId: "p2", descriptor: A2 },
    { faceId: "b1", fileId: "p3", descriptor: B1 },
    { faceId: "b2", fileId: "p4", descriptor: B2 },
    { faceId: "c1", fileId: "p5", descriptor: C1 },
  ];
  const merges = nnChainMerges(faces.map((f) => f.descriptor));
  const clusterOf = assignFaceClusters(faces, merges, 0.5);
  assert.equal(clusterOf[0], clusterOf[1]);
  assert.equal(clusterOf[2], clusterOf[3]);
  assert.notEqual(clusterOf[0], clusterOf[2]);
  assert.notEqual(clusterOf[4], clusterOf[0]);
});

test("assignFaceClusters never merges two faces from the same photo", () => {
  // Same person-like distance but both faces live in one photo → cannot link.
  const faces = [
    { faceId: "a1", fileId: "p1", descriptor: A1 },
    { faceId: "a2", fileId: "p1", descriptor: A2 },
    { faceId: "b1", fileId: "p2", descriptor: B1 },
    { faceId: "b2", fileId: "p2", descriptor: B2 },
  ];
  const merges = nnChainMerges(faces.map((f) => f.descriptor));
  const clusterOf = assignFaceClusters(faces, merges, 0.9);
  assert.equal(new Set(clusterOf).size, 4);
});

test("buildFaceGroups ranks largest group first with medoid representative and photoIds", () => {
  const faces = [
    { faceId: "a1", fileId: "p1", descriptor: A1 },
    { faceId: "a2", fileId: "p2", descriptor: A2 },
    { faceId: "b1", fileId: "p3", descriptor: B1 },
    { faceId: "c1", fileId: "p4", descriptor: C1 },
    { faceId: "c2", fileId: "p5", descriptor: C2 },
  ];
  const groups = buildFaceGroups(faces, 0.5);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].groupId, "grup-1");
  assert.equal(groups[0].faces.length, 2);
  assert.equal(groups[0].photoCount, 2);
  assert.equal(groups[0].photoIds.length, 2);
  assert.ok(groups.every((g) => g.faces.includes(g.representative)));
});
