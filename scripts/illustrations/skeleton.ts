/**
 * Dựng hình người que 2D từ tư thế: thân xác định bằng hông + góc thân,
 * tay/chân bằng góc tuyệt đối (FK) hoặc điểm đích (IK 2 đoạn).
 *
 * Quy ước góc (độ, hệ tọa độ SVG, y hướng xuống): 0 = phải, 90 = xuống, -90 = lên, 180 = trái.
 * Hình mặc định nhìn ngang, mặt hướng sang phải.
 */

export type Vec = readonly [number, number];

export const CANVAS = { width: 200, height: 150 } as const;
/** Mặt sàn. */
export const FLOOR = 144;

// Tỉ lệ chọn để tư thế trồng chuối (tay + thân + chân = 129) vừa khung cao 150.
export const BONES = {
  torso: 37,
  neck: 8,
  head: 7.5,
  upperArm: 20,
  forearm: 19,
  thigh: 28,
  shin: 27,
  foot: 8,
} as const;

/** Nửa độ rộng vai/hông khi nhìn chính diện. */
const FRONT_SHOULDER = 11;
const FRONT_HIP = 6;

export type Limb = { to: Vec; bend?: 1 | -1 } | { angles: readonly [number, number] };
export type LegLimb = Limb & { foot?: number };

export type JointName =
  | "nearWrist"
  | "farWrist"
  | "nearAnkle"
  | "farAnkle"
  | "nearKnee"
  | "farKnee"
  | "hip"
  | "shoulder"
  | "neck";

export type Prop =
  | { type: "wall"; x: number }
  | { type: "chair"; x: number; width?: number; seat?: number; back?: "left" | "right" }
  | { type: "table"; x: number; width: number; top: number }
  | { type: "bar"; x: number; y: number }
  | { type: "door"; x: number; knob?: number }
  | { type: "block"; x: number; width: number; height: number }
  | { type: "band"; from: Vec | JointName; to: Vec | JointName }
  | { type: "towel"; from: Vec | JointName; to: Vec | JointName };

export interface Pose {
  view?: "side" | "front";
  hip: Vec;
  /** Góc từ hông tới vai. */
  torso: number;
  /** Góc từ cổ tới đầu, mặc định trùng góc thân. */
  head?: number;
  /** Độ dài cổ (thu ngắn khi nhún vai). */
  neck?: number;
  arms: { near: Limb; far?: Limb };
  legs: { near: LegLimb; far?: LegLimb };
  props?: Prop[];
  /** Không vẽ sàn (bài treo xà vẫn vẽ sàn mặc định). */
  noFloor?: boolean;
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export const along = (p: Vec, angle: number, length: number): Vec => [
  p[0] + Math.cos(rad(angle)) * length,
  p[1] + Math.sin(rad(angle)) * length,
];

const angleTo = (a: Vec, b: Vec) => deg(Math.atan2(b[1] - a[1], b[0] - a[0]));
const distance = (a: Vec, b: Vec) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/**
 * IK hai đoạn: trả về [khớp giữa, điểm cuối]. Nếu đích ngoài tầm với, duỗi thẳng về phía đích.
 * `bend` = 1 xoay khớp giữa theo chiều kim đồng hồ so với đường gốc→đích, -1 ngược lại.
 */
export function solveTwoBone(
  root: Vec,
  target: Vec,
  a: number,
  b: number,
  bend: 1 | -1,
): [Vec, Vec] {
  const d = distance(root, target);
  const base = angleTo(root, target);
  if (d >= a + b - 1e-6) {
    const joint = along(root, base, a);
    return [joint, along(joint, base, b)];
  }
  const dd = Math.max(d, Math.abs(a - b) + 1e-3);
  const cos = (a * a + dd * dd - b * b) / (2 * a * dd);
  const offset = deg(Math.acos(Math.min(1, Math.max(-1, cos))));
  const joint = along(root, base + bend * offset, a);
  return [joint, target];
}

function solveLimb(root: Vec, limb: Limb, a: number, b: number): [Vec, Vec] {
  if ("angles" in limb) {
    const joint = along(root, limb.angles[0], a);
    return [joint, along(joint, limb.angles[1], b)];
  }
  return solveTwoBone(root, limb.to, a, b, limb.bend ?? 1);
}

export interface Skeleton {
  hip: Vec;
  shoulder: Vec;
  neck: Vec;
  head: Vec;
  near: { shoulder: Vec; elbow: Vec; wrist: Vec; hip: Vec; knee: Vec; ankle: Vec; toe: Vec };
  far: { shoulder: Vec; elbow: Vec; wrist: Vec; hip: Vec; knee: Vec; ankle: Vec; toe: Vec };
}

export function buildSkeleton(pose: Pose): Skeleton {
  const front = pose.view === "front";
  const shoulder = along(pose.hip, pose.torso, BONES.torso);
  const neck = along(shoulder, pose.head ?? pose.torso, pose.neck ?? BONES.neck);
  const head = along(neck, pose.head ?? pose.torso, BONES.head);

  // Nhìn chính diện: "near" là bên phải ảnh, "far" bên trái.
  const perp = pose.torso + 90;
  const side = (sign: 1 | -1) => ({
    shoulder: front ? along(shoulder, perp, sign * FRONT_SHOULDER) : shoulder,
    hip: front ? along(pose.hip, perp, sign * FRONT_HIP) : pose.hip,
  });

  const limbSet = (sign: 1 | -1, arm: Limb, leg: LegLimb) => {
    const s = side(sign);
    const [elbow, wrist] = solveLimb(s.shoulder, arm, BONES.upperArm, BONES.forearm);
    const [knee, ankle] = solveLimb(s.hip, leg, BONES.thigh, BONES.shin);
    const toe = along(ankle, leg.foot ?? 0, BONES.foot);
    return { shoulder: s.shoulder, elbow, wrist, hip: s.hip, knee, ankle, toe };
  };

  return {
    hip: pose.hip,
    shoulder,
    neck,
    head,
    near: limbSet(1, pose.arms.near, pose.legs.near),
    far: limbSet(-1, pose.arms.far ?? pose.arms.near, pose.legs.far ?? pose.legs.near),
  };
}

const fmt = (n: number) => Math.round(n * 10) / 10;
const pts = (...points: Vec[]) => points.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(" ");

function resolvePoint(sk: Skeleton, p: Vec | JointName): Vec {
  if (typeof p !== "string") return p;
  switch (p) {
    case "nearWrist":
      return sk.near.wrist;
    case "farWrist":
      return sk.far.wrist;
    case "nearAnkle":
      return sk.near.ankle;
    case "farAnkle":
      return sk.far.ankle;
    case "nearKnee":
      return sk.near.knee;
    case "farKnee":
      return sk.far.knee;
    case "hip":
      return sk.hip;
    case "shoulder":
      return sk.shoulder;
    case "neck":
      return sk.neck;
  }
}

function renderProp(prop: Prop, sk: Skeleton): string {
  switch (prop.type) {
    case "wall":
      return `<line class="prop" x1="${prop.x}" y1="4" x2="${prop.x}" y2="${FLOOR}"/>`;
    case "chair": {
      const w = prop.width ?? 26;
      const seatY = FLOOR - (prop.seat ?? 30);
      const backX = prop.back === "left" ? prop.x : prop.x + w;
      return [
        `<polyline class="prop" points="${pts([prop.x, FLOOR], [prop.x, seatY], [prop.x + w, seatY], [prop.x + w, FLOOR])}"/>`,
        prop.back
          ? `<line class="prop" x1="${backX}" y1="${seatY}" x2="${backX}" y2="${seatY - 28}"/>`
          : "",
      ].join("");
    }
    case "table": {
      const topY = FLOOR - prop.top;
      const x2 = prop.x + prop.width;
      return `<polyline class="prop" points="${pts([prop.x + 4, FLOOR], [prop.x + 4, topY], [x2 - 4, topY], [x2 - 4, FLOOR])}"/><line class="prop" x1="${prop.x}" y1="${topY}" x2="${x2}" y2="${topY}"/>`;
    }
    case "bar":
      return `<line class="prop" x1="${prop.x - 30}" y1="${prop.y}" x2="${prop.x + 30}" y2="${prop.y}"/><circle class="prop-fill" cx="${prop.x}" cy="${prop.y}" r="3.5"/>`;
    case "door": {
      const knobY = FLOOR - (prop.knob ?? 52);
      return `<rect class="prop" x="${prop.x}" y="14" width="40" height="${FLOOR - 14}"/><circle class="prop-fill" cx="${prop.x + 4}" cy="${knobY}" r="3"/>`;
    }
    case "block":
      return `<rect class="prop" x="${prop.x}" y="${FLOOR - prop.height}" width="${prop.width}" height="${prop.height}" rx="3"/>`;
    case "band":
    case "towel": {
      const a = resolvePoint(sk, prop.from);
      const b = resolvePoint(sk, prop.to);
      return `<line class="${prop.type}" x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}"/>`;
    }
  }
}

const STYLE = `
.fig{stroke:#1f2937;fill:none;stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.far{stroke:#9ca3af}
.head{fill:#1f2937}
.prop{stroke:#94a3b8;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.prop-fill{fill:#94a3b8}
.floor{stroke:#cbd5e1;stroke-width:2}
.band{stroke:#f97316;stroke-width:3;stroke-linecap:round}
.towel{stroke:#0ea5e9;stroke-width:4;stroke-linecap:round}
@media (prefers-color-scheme:dark){
.fig{stroke:#f3f4f6}.far{stroke:#6b7280}.head{fill:#f3f4f6}
.prop{stroke:#64748b}.prop-fill{fill:#64748b}.floor{stroke:#475569}
}`.replace(/\n/g, "");

export function renderPose(pose: Pose, title: string): string {
  const sk = buildSkeleton(pose);
  const front = pose.view === "front";
  const limb = (l: Skeleton["near"], cls: string) =>
    `<polyline class="${cls}" points="${pts(l.shoulder, l.elbow, l.wrist)}"/>` +
    `<polyline class="${cls}" points="${pts(l.hip, l.knee, l.ankle, l.toe)}"/>`;

  const torso = front
    ? `<polygon class="fig" points="${pts(sk.near.shoulder, sk.far.shoulder, sk.far.hip, sk.near.hip)}"/>`
    : `<polyline class="fig" points="${pts(sk.hip, sk.shoulder, sk.neck)}"/>`;
  const neck = front ? `<polyline class="fig" points="${pts(sk.shoulder, sk.neck)}"/>` : "";

  const body = [
    pose.noFloor
      ? ""
      : `<line class="floor" x1="4" y1="${FLOOR}" x2="${CANVAS.width - 4}" y2="${FLOOR}"/>`,
    ...(pose.props ?? [])
      .filter((p) => p.type !== "band" && p.type !== "towel")
      .map((p) => renderProp(p, sk)),
    limb(sk.far, front ? "fig" : "fig far"),
    torso,
    neck,
    `<circle class="head" cx="${fmt(sk.head[0])}" cy="${fmt(sk.head[1])}" r="${BONES.head}"/>`,
    limb(sk.near, "fig"),
    ...(pose.props ?? [])
      .filter((p) => p.type === "band" || p.type === "towel")
      .map((p) => renderProp(p, sk)),
  ];

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}" role="img">` +
    `<title>${title}</title><style>${STYLE}</style>${body.join("")}</svg>\n`
  );
}
