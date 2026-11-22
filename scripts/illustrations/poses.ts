/**
 * Tư thế minh họa cho từng bài tập: mỗi bài 1–2 khung (bắt đầu / kết thúc).
 * Tọa độ theo khung 200×150, sàn ở y = FLOOR. Xem quy ước góc trong skeleton.ts.
 */
import { BONES, FLOOR, along, type Limb, type Pose, type Prop, type Vec } from "./skeleton";

const ANKLE = FLOOR - 4; // mắt cá khi bàn chân đặt phẳng
const WRIST = FLOOR - 3; // cổ tay chống sàn
const LEG = BONES.thigh + BONES.shin;
const ARM = BONES.upperArm + BONES.forearm;
const BODY = LEG + BONES.torso;
const BAR_Y = 16;

const asinDeg = (x: number) => (Math.asin(Math.max(-1, Math.min(1, x))) * 180) / Math.PI;

/** Đứng thẳng tại x, mặt hướng phải. */
function stand(x: number, arms: Limb = { angles: [95, 88] }, props?: Prop[]): Pose {
  return {
    hip: [x, ANKLE - LEG],
    torso: -90,
    arms: { near: arms },
    legs: { near: { to: [x, ANKLE] } },
    props,
  };
}

const shoulderOf = (p: Pose): Vec => along(p.hip, p.torso, BONES.torso);

/**
 * Thân thẳng một đường từ mắt cá tới vai (chống đẩy, plank…), vai ở độ cao `shoulderY`.
 * Mặc định cổ tay chống sàn ngay dưới vai.
 */
function plank(o: {
  ankle: Vec;
  shoulderY: number;
  wrist?: Vec;
  foot?: number;
  bend?: 1 | -1;
  far?: Limb;
  props?: Prop[];
}): Pose {
  const angle = asinDeg((o.shoulderY - o.ankle[1]) / BODY);
  const shoulder = along(o.ankle, angle, BODY);
  return {
    hip: along(o.ankle, angle, LEG),
    torso: angle,
    arms: {
      near: { to: o.wrist ?? [shoulder[0], WRIST], bend: o.bend ?? 1 },
      far: o.far,
    },
    legs: { near: { to: o.ankle, foot: o.foot ?? 100 } },
    props: o.props,
  };
}

/** Thân thẳng từ đầu gối (chống đẩy gối), cẳng chân nằm trên sàn. */
function kneePlank(knee: Vec, shoulderY: number, wrist?: Vec): Pose {
  const angle = asinDeg((shoulderY - knee[1]) / (BONES.thigh + BONES.torso));
  const hip = along(knee, angle, BONES.thigh);
  const shoulder = along(hip, angle, BONES.torso);
  return {
    hip,
    torso: angle,
    arms: { near: { to: wrist ?? [shoulder[0], WRIST], bend: 1 } },
    legs: { near: { angles: [angle + 180, 178], foot: -140 } },
  };
}

/** Treo xà; `shoulderY` nhỏ hơn = kéo người lên. Chân co ra sau để không chạm sàn. */
function hang(o: {
  x?: number;
  shoulderY?: number;
  legs?: Pose["legs"];
  neck?: number;
  props?: Prop[];
}): Pose {
  const x = o.x ?? 100;
  const shoulderY = o.shoulderY ?? BAR_Y + 2 + ARM;
  const pulled = shoulderY < BAR_Y + ARM - 4;
  const shoulderX = pulled ? x - 6 : x;
  return {
    hip: [shoulderX, shoulderY + BONES.torso],
    torso: -90,
    // Đầu hơi nhô ra trước để không bị cánh tay che.
    head: -76,
    neck: o.neck,
    arms: { near: { to: [x, BAR_Y + 2], bend: 1 } },
    legs: o.legs ?? { near: { angles: [95, 150], foot: 60 } },
    props: [{ type: "bar", x, y: BAR_Y }, ...(o.props ?? [])],
  };
}

/** Nằm ngửa, đầu bên phải; vai cố định, hông xác định bằng góc thân. */
function supine(o: {
  shoulder: Vec;
  torso: number;
  head?: number;
  arms: Pose["arms"];
  legs: Pose["legs"];
  props?: Prop[];
}): Pose {
  return {
    hip: along(o.shoulder, o.torso + 180, BONES.torso),
    torso: o.torso,
    head: o.head,
    arms: o.arms,
    legs: o.legs,
    props: o.props,
  };
}

function squat(x: number, arms: Limb = { angles: [-5, -5] }, props?: Prop[]): Pose {
  return {
    hip: [x - 20, 113],
    torso: -58,
    arms: { near: arms },
    legs: { near: { to: [x, ANKLE], bend: -1 } },
    props,
  };
}

// ---------- Chống đẩy ----------

const pushUpTop = plank({ ankle: [30, FLOOR - 8], shoulderY: WRIST - ARM });
const pushUpWrist: Vec = [shoulderOf(pushUpTop)[0] - 6, WRIST];
const pushUp = [
  plank({ ankle: [30, FLOOR - 8], shoulderY: WRIST - ARM, wrist: pushUpWrist }),
  plank({ ankle: [30, FLOOR - 8], shoulderY: WRIST - 14, wrist: pushUpWrist }),
];

const inclineTop = plank({ ankle: [44, FLOOR - 8], shoulderY: 110 - ARM, wrist: [118, 111] });
const chairFront: Prop = { type: "chair", x: 105, width: 28, seat: 30 };

const declineChair: Prop = { type: "chair", x: 8, width: 30, seat: 30 };
const declineWrist: Vec = [114, WRIST];

const pikeWrist: Vec = [130, WRIST];
const pikeAnkle: Vec = [60, FLOOR - 7];

const handstandWall: Prop = { type: "wall", x: 128 };
const handstandHold: Pose = {
  hip: [105, WRIST - ARM - BONES.torso],
  torso: 90,
  arms: { near: { to: [105, WRIST] } },
  legs: { near: { to: [124, 14], foot: -60 } },
  props: [handstandWall],
};

// ---------- Kéo ----------

const tableRow: Prop = { type: "table", x: 102, width: 92, top: 54 };
const tableEdge: Vec = [106, FLOOR - 54 + 2];
const invertedTable: Prop = { type: "table", x: 110, width: 86, top: 54 };
const invertedAnkle: Vec = [24, FLOOR - 6];
const invertedTop = plank({ ankle: invertedAnkle, shoulderY: 131, foot: -60, wrist: [0, 0] });
const invertedEdge: Vec = [shoulderOf(invertedTop)[0], FLOOR - 54 + 2];

const towelDoor: Prop = { type: "door", x: 150, knob: 52 };
const towelKnob: Vec = [154, FLOOR - 52];
const bandDoor: Prop = { type: "door", x: 160, knob: 84 };
const bandAnchor: Vec = [162, FLOOR - 84];

const pullTop = { shoulderY: BAR_Y + 8 };
const hangingLegs = { near: { angles: [95, 150], foot: 60 } } as const;

// ---------- Chân ----------

const splitFront: Vec = [118, ANKLE];
const splitBack: Vec = [80, ANKLE - 2];
const bulgarianChair: Prop = { type: "chair", x: 30, width: 28, seat: 30 };

const bridgeShoulder: Vec = [128, FLOOR - 5];
const bridgeAnkle: Vec = [70, ANKLE];
const thrustBlock: Prop = { type: "block", x: 128, width: 52, height: 30 };
const thrustShoulder: Vec = [131, FLOOR - 33];

const nordicBlock: Prop = { type: "block", x: 14, width: 40, height: 20 };
const nordicKnee: Vec = [74, FLOOR - 3];

// ---------- Bụng ----------

const supineShoulder: Vec = [128, FLOOR - 6];

export const poses: Record<string, Pose[]> = {
  // Đẩy ngang
  "wall-push-up": [
    plank({
      ankle: [62, ANKLE],
      shoulderY: ANKLE - BODY * Math.sin((62 * Math.PI) / 180),
      foot: 0,
      wrist: [146, 62],
      props: [{ type: "wall", x: 149 }],
    }),
    plank({
      ankle: [62, ANKLE],
      shoulderY: ANKLE - BODY * Math.sin((50 * Math.PI) / 180),
      foot: 0,
      wrist: [146, 64],
      props: [{ type: "wall", x: 149 }],
    }),
  ],
  "incline-push-up": [
    { ...inclineTop, props: [chairFront] },
    { ...plank({ ankle: [44, FLOOR - 8], shoulderY: 96, wrist: [118, 111] }), props: [chairFront] },
  ],
  "knee-push-up": [
    kneePlank([62, FLOOR - 3], WRIST - ARM, [114, WRIST]),
    kneePlank([62, FLOOR - 3], WRIST - 14, [114, WRIST]),
  ],
  "push-up": pushUp,
  "decline-push-up": [
    plank({
      ankle: [30, 106],
      shoulderY: WRIST - ARM,
      wrist: declineWrist,
      foot: 80,
      props: [declineChair],
    }),
    plank({
      ankle: [30, 106],
      shoulderY: WRIST - 14,
      wrist: declineWrist,
      foot: 80,
      props: [declineChair],
    }),
  ],
  "diamond-push-up": pushUp,
  "archer-push-up": [
    plank({
      ankle: [30, FLOOR - 8],
      shoulderY: WRIST - ARM,
      wrist: pushUpWrist,
      far: { to: [160, WRIST], bend: -1 },
    }),
    plank({
      ankle: [30, FLOOR - 8],
      shoulderY: WRIST - 16,
      wrist: pushUpWrist,
      far: { to: [162, WRIST], bend: -1 },
    }),
  ],
  "single-arm-push-up": [
    plank({
      ankle: [30, FLOOR - 8],
      shoulderY: WRIST - ARM,
      wrist: pushUpWrist,
      far: { angles: [160, -25] },
    }),
    plank({
      ankle: [30, FLOOR - 8],
      shoulderY: WRIST - 16,
      wrist: pushUpWrist,
      far: { angles: [175, -15] },
    }),
  ],

  // Đẩy dọc
  "pike-push-up": [
    {
      hip: [80, 84],
      torso: 48.6,
      arms: { near: { to: pikeWrist } },
      legs: { near: { to: pikeAnkle, foot: 70 } },
    },
    {
      hip: [95, 92],
      torso: 62,
      arms: { near: { to: pikeWrist, bend: 1 } },
      legs: { near: { to: pikeAnkle, foot: 70, bend: 1 } },
    },
  ],
  "elevated-pike-push-up": [
    {
      hip: [86, 68],
      torso: 76,
      arms: { near: { to: [98, WRIST] } },
      legs: { near: { to: [50, 108], foot: 100, bend: 1 } },
      props: [{ type: "chair", x: 20, width: 32, seat: 32 }],
    },
    {
      hip: [90, 80],
      torso: 70,
      arms: { near: { to: [98, WRIST], bend: 1 } },
      legs: { near: { to: [50, 108], foot: 100, bend: 1 } },
      props: [{ type: "chair", x: 20, width: 32, seat: 32 }],
    },
  ],
  "wall-handstand-hold": [handstandHold],
  "wall-handstand-push-up": [
    handstandHold,
    {
      hip: [107, 86],
      torso: 90,
      arms: { near: { to: [105, WRIST], bend: -1 } },
      legs: { near: { to: [124, 34], foot: -60 } },
      props: [handstandWall],
    },
  ],

  // Kéo ngang
  "towel-row": [
    {
      hip: along([132, ANKLE], -118, LEG),
      torso: -118,
      arms: { near: { to: towelKnob } },
      legs: { near: { to: [132, ANKLE] } },
      props: [towelDoor, { type: "towel", from: "nearWrist", to: towelKnob }],
    },
    {
      hip: along([132, ANKLE], -102, LEG),
      torso: -102,
      arms: { near: { to: [124, 64], bend: 1 } },
      legs: { near: { to: [132, ANKLE] } },
      props: [towelDoor, { type: "towel", from: "nearWrist", to: towelKnob }],
    },
  ],
  "band-row": [
    stand(80, { to: bandAnchor }, [bandDoor, { type: "band", from: "nearWrist", to: bandAnchor }]),
    stand(80, { to: [90, 68], bend: 1 }, [
      bandDoor,
      { type: "band", from: "nearWrist", to: bandAnchor },
    ]),
  ],
  "table-row-bent-knee": [
    supine({
      shoulder: [tableEdge[0], tableEdge[1] + ARM],
      torso: 6,
      arms: { near: { to: tableEdge } },
      legs: { near: { to: [44, ANKLE], foot: 180, bend: 1 } },
      props: [tableRow],
    }),
    supine({
      shoulder: [108, 104],
      torso: -19,
      arms: { near: { to: tableEdge, bend: -1 } },
      legs: { near: { to: [44, ANKLE], foot: 180, bend: 1 } },
      props: [tableRow],
    }),
  ],
  "inverted-row": [
    plank({
      ankle: invertedAnkle,
      shoulderY: 131,
      foot: -60,
      wrist: invertedEdge,
      props: [invertedTable],
    }),
    plank({
      ankle: invertedAnkle,
      shoulderY: 104,
      foot: -60,
      wrist: invertedEdge,
      bend: -1,
      props: [invertedTable],
    }),
  ],

  // Kéo dọc
  "dead-hang": [hang({})],
  "scapular-pull-up": [
    hang({ neck: 1, shoulderY: BAR_Y + 2 + ARM + 2 }),
    hang({ shoulderY: BAR_Y + ARM - 2 }),
  ],
  "negative-pull-up": [hang(pullTop), hang({})],
  "band-assisted-pull-up": [
    hang({ props: [{ type: "band", from: [100, BAR_Y], to: "nearKnee" }] }),
    hang({ ...pullTop, props: [{ type: "band", from: [100, BAR_Y], to: "nearKnee" }] }),
  ],
  "chin-up": [hang({}), hang(pullTop)],
  "pull-up": [hang({}), hang(pullTop)],

  // Squat
  "assisted-squat": [
    stand(104, { to: [128, 87] }, [{ type: "chair", x: 128, width: 26, seat: 30, back: "left" }]),
    {
      ...squat(104, { to: [128, 87], bend: 1 }),
      torso: -70,
      props: [{ type: "chair", x: 128, width: 26, seat: 30, back: "left" }],
    },
  ],
  "bodyweight-squat": [stand(100, { angles: [-5, -5] }), squat(100)],
  "split-squat": [
    {
      hip: [99, ANKLE - Math.sqrt(LEG ** 2 - 19 ** 2)],
      torso: -90,
      arms: { near: { angles: [100, 80] } },
      legs: { near: { to: splitFront }, far: { to: splitBack, foot: 30 } },
    },
    {
      hip: [97, 113],
      torso: -88,
      arms: { near: { angles: [100, 80] } },
      legs: {
        near: { to: splitFront, bend: -1 },
        far: { to: [76, ANKLE - 2], foot: 30, bend: -1 },
      },
    },
  ],
  "reverse-lunge": [
    stand(100, { angles: [100, 80] }),
    {
      hip: [96, 113],
      torso: -88,
      arms: { near: { angles: [100, 80] } },
      legs: {
        near: { to: [113, ANKLE], bend: -1 },
        far: { to: [62, ANKLE - 2], foot: 30, bend: -1 },
      },
    },
  ],
  "bulgarian-split-squat": [
    {
      hip: [102, ANKLE - Math.sqrt(LEG ** 2 - 8 ** 2)],
      torso: -88,
      arms: { near: { angles: [100, 80] } },
      legs: { near: { to: [110, ANKLE] }, far: { to: [58, 110], foot: 180, bend: -1 } },
      props: [bulgarianChair],
    },
    {
      hip: [96, 112],
      torso: -80,
      arms: { near: { angles: [100, 80] } },
      legs: { near: { to: [110, ANKLE], bend: -1 }, far: { to: [58, 110], foot: 180, bend: -1 } },
      props: [bulgarianChair],
    },
  ],
  "pistol-squat": [
    {
      ...stand(100, { angles: [-5, -5] }),
      legs: { near: { to: [100, ANKLE] }, far: { angles: [75, 85], foot: 0 } },
    },
    {
      hip: [86, 117],
      torso: -55,
      arms: { near: { angles: [-8, -8] } },
      legs: { near: { to: [100, ANKLE], bend: -1 }, far: { angles: [-4, -4], foot: -60 } },
    },
  ],

  // Hông
  "glute-bridge": [
    supine({
      shoulder: bridgeShoulder,
      torso: 4,
      head: -6,
      arms: { near: { angles: [178, 180] } },
      legs: { near: { to: bridgeAnkle, foot: 180, bend: 1 } },
    }),
    supine({
      shoulder: bridgeShoulder,
      torso: 35,
      head: 10,
      arms: { near: { angles: [178, 180] } },
      legs: { near: { to: bridgeAnkle, foot: 180, bend: 1 } },
    }),
  ],
  "single-leg-glute-bridge": [
    supine({
      shoulder: bridgeShoulder,
      torso: 4,
      head: -6,
      arms: { near: { angles: [178, 180] } },
      legs: {
        near: { angles: [228, 228], foot: 228 },
        far: { to: bridgeAnkle, foot: 180, bend: 1 },
      },
    }),
    supine({
      shoulder: bridgeShoulder,
      torso: 35,
      head: 10,
      arms: { near: { angles: [178, 180] } },
      legs: {
        near: { angles: [215, 215], foot: 215 },
        far: { to: bridgeAnkle, foot: 180, bend: 1 },
      },
    }),
  ],
  "hip-thrust": [
    supine({
      shoulder: thrustShoulder,
      torso: -30,
      head: -40,
      arms: { near: { to: [118, 128], bend: -1 } },
      legs: { near: { to: [72, ANKLE], foot: 180, bend: 1 } },
      props: [thrustBlock],
    }),
    supine({
      shoulder: thrustShoulder,
      torso: 0,
      head: -20,
      arms: { near: { to: [104, 116], bend: -1 } },
      legs: { near: { to: [70, ANKLE], foot: 180, bend: 1 } },
      props: [thrustBlock],
    }),
  ],
  "nordic-curl": [
    {
      hip: [nordicKnee[0], nordicKnee[1] - BONES.thigh],
      torso: -90,
      arms: { near: { angles: [80, -40] } },
      legs: { near: { angles: [90, 180], foot: -120 } },
      props: [nordicBlock],
    },
    {
      hip: along(nordicKnee, -42, BONES.thigh),
      torso: -42,
      arms: { near: { angles: [50, 20] } },
      legs: { near: { angles: [138, 180], foot: -120 } },
      props: [nordicBlock],
    },
  ],

  // Bụng
  "dead-bug": [
    supine({
      shoulder: supineShoulder,
      torso: 2,
      arms: { near: { angles: [-90, -90] } },
      legs: { near: { angles: [-90, 180], foot: 180 } },
    }),
    supine({
      shoulder: supineShoulder,
      torso: 2,
      arms: { near: { angles: [-8, -4] }, far: { angles: [-90, -90] } },
      legs: { near: { angles: [-90, 180], foot: 180 }, far: { angles: [178, 178], foot: 180 } },
    }),
  ],
  plank: [
    {
      ...plank({ ankle: [30, FLOOR - 7], shoulderY: WRIST - BONES.upperArm }),
      arms: { near: { angles: [90, 0] } },
    },
  ],
  "hollow-body-tuck": [
    supine({
      shoulder: [126, FLOOR - 14],
      torso: -12,
      head: -22,
      arms: { near: { angles: [168, 172] } },
      legs: { near: { angles: [-70, 175], foot: 180 } },
    }),
  ],
  "hollow-body": [
    supine({
      shoulder: [134, FLOOR - 15],
      torso: -14,
      head: -24,
      arms: { near: { angles: [-26, -26] } },
      legs: { near: { angles: [194, 194], foot: 194 } },
    }),
  ],
  "side-plank": [
    {
      ...plank({ ankle: [30, ANKLE], shoulderY: WRIST - BONES.upperArm, foot: 0 }),
      arms: { near: { angles: [90, 8] }, far: { angles: [-90, -90] } },
    },
  ],
  "hanging-knee-raise": [
    hang({ legs: hangingLegs }),
    hang({ legs: { near: { angles: [-12, 85], foot: 0 } } }),
  ],
  "hanging-leg-raise": [
    hang({ legs: hangingLegs }),
    hang({ legs: { near: { angles: [-4, -4], foot: -80 } } }),
  ],

  // Bổ trợ
  "band-pull-apart": [
    {
      view: "front",
      hip: [100, ANKLE - LEG],
      torso: -90,
      arms: { near: { to: [106, 66], bend: -1 }, far: { to: [94, 66], bend: 1 } },
      legs: { near: { to: [108, ANKLE], foot: 10 }, far: { to: [92, ANKLE], foot: 170 } },
      props: [{ type: "band", from: "farWrist", to: "nearWrist" }],
    },
    {
      view: "front",
      hip: [100, ANKLE - LEG],
      torso: -90,
      arms: { near: { angles: [0, 0] }, far: { angles: [180, 180] } },
      legs: { near: { to: [108, ANKLE], foot: 10 }, far: { to: [92, ANKLE], foot: 170 } },
      props: [{ type: "band", from: "farWrist", to: "nearWrist" }],
    },
  ],
  "band-shoulder-press": [
    {
      view: "front",
      hip: [100, ANKLE - LEG],
      torso: -90,
      arms: { near: { to: [122, 40], bend: 1 }, far: { to: [78, 40], bend: -1 } },
      legs: { near: { to: [108, ANKLE], foot: 10 }, far: { to: [92, ANKLE], foot: 170 } },
      props: [
        { type: "band", from: [108, FLOOR - 2], to: "nearWrist" },
        { type: "band", from: [92, FLOOR - 2], to: "farWrist" },
      ],
    },
    {
      view: "front",
      hip: [100, ANKLE - LEG],
      torso: -90,
      arms: { near: { to: [115, 8] }, far: { to: [85, 8] } },
      legs: { near: { to: [108, ANKLE], foot: 10 }, far: { to: [92, ANKLE], foot: 170 } },
      props: [
        { type: "band", from: [108, FLOOR - 2], to: "nearWrist" },
        { type: "band", from: [92, FLOOR - 2], to: "farWrist" },
      ],
    },
  ],
  "band-squat": [
    stand(100, { to: [107, 50], bend: 1 }, [
      { type: "band", from: [104, FLOOR - 2], to: "nearWrist" },
    ]),
    {
      ...squat(100),
      arms: { near: { to: [100, 86], bend: 1 } },
      props: [{ type: "band", from: [104, FLOOR - 2], to: "nearWrist" }],
    },
  ],
  "bench-dips": [
    {
      hip: [82, 107],
      torso: -90,
      arms: { near: { to: [80, 109] } },
      legs: { near: { to: [126, ANKLE], bend: -1 } },
      props: [{ type: "chair", x: 50, width: 30, seat: 34, back: "left" }],
    },
    {
      hip: [86, 124],
      torso: -90,
      arms: { near: { to: [80, 109], bend: 1 } },
      legs: { near: { to: [128, ANKLE], bend: -1 } },
      props: [{ type: "chair", x: 50, width: 30, seat: 34, back: "left" }],
    },
  ],
  superman: [
    {
      hip: [90, FLOOR - 5],
      torso: 0,
      arms: { near: { angles: [0, 0] } },
      legs: { near: { angles: [180, 180], foot: 180 } },
    },
    {
      hip: [90, FLOOR - 5],
      torso: -8,
      head: -16,
      arms: { near: { angles: [-14, -14] } },
      legs: { near: { angles: [188, 188], foot: 188 } },
    },
  ],
};
