window.CH = window.CH || {};

(function () {
  const LIP = "#8a3a2c";

  let uid = 0;

  function mix(a, b, p) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (n, sh) => Math.round(((n >> sh) & 255) * (1 - p) + ((pb >> sh) & 255) * p);
    return "#" + ((1 << 24) | (ch(pa, 16) << 16) | (ch(pa, 8) << 8) | ch(pa, 0)).toString(16).slice(1);
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const r = (v) => Math.round(v * 10) / 10;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let rr = (n >> 16) & 255;
    let gg = (n >> 8) & 255;
    let bb = n & 255;
    const target = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    rr = Math.round(rr + (target - rr) * p);
    gg = Math.round(gg + (target - gg) * p);
    bb = Math.round(bb + (target - bb) * p);
    return "#" + ((1 << 24) | (rr << 16) | (gg << 8) | bb).toString(16).slice(1);
  }

  function renderCharacter(c, opts = {}) {
    const id = "chr" + ++uid;
    const t = (k) => (c.face[k] ?? 50) / 100;
    const tone = CH.SKIN_TONES.find((s) => s.id === c.skin) || CH.SKIN_TONES.find((s) => s.id === "light");
    const { hex: SKIN, shade: SKIN_SHADE, neck: SKIN_NECK, outline: OUTLINE } = tone;
    const hair = CH.getColor(CH.HAIR_COLORS, c.hairColor);
    const hairDark = shade(hair, -0.35);
    const hairLight = shade(hair, 0.2);
    const eyeColor = CH.getColor(CH.EYE_COLORS, c.eyeColor);

    const cx = 200;
    const L = lerp(165, 215, t("headLength"));
    const wt = t("weight");
    // Curved so the 50% default reads as a lightly lined 30-year-old rather than middle-aged.
    const wr = t("wrinkles") ** 2.5;
    const W = lerp(62, 90, t("headWidth")) * lerp(0.92, 1.1, wt);
    const J = Math.min(W * 1.02, W * lerp(0.55, 0.95, t("jawWidth")) * lerp(0.9, 1.15, wt));
    const chinC = lerp(8, 26, t("chinSize"));
    const chinDrop = lerp(-6, 14, t("chinSize"));
    const base = 322;
    const top = base - L;
    const bottom = base + chinDrop;
    const y = (f) => top + f * L;
    const templeY = y(0.4);
    const jawY = y(0.78);
    const eyeY = y(0.5);

    const ns = lerp(0.75, 1.3, t("noseSize"));
    const noseY = y(0.69) + lerp(-14, 8, t("noseHeight"));
    const mouthY = noseY + Math.max(12 * ns + 9, (bottom - noseY) * 0.42);

    const nW = W * 0.46 * lerp(0.85, 1.35, wt);
    // The body is stretched horizontally with weight; nWb keeps the neckline aligned with the neck after scaling.
    const bodyScale = lerp(0.92, 1.1, wt);
    const nWb = nW / bodyScale;

    const headPath = [
      `M ${cx} ${top}`,
      `C ${cx + W * 0.56} ${top} ${cx + W} ${y(0.16)} ${cx + W} ${templeY}`,
      `C ${cx + W} ${y(0.6)} ${cx + J + (W - J) * 0.35} ${y(0.7)} ${cx + J} ${jawY}`,
      `C ${cx + J * 0.8} ${jawY + (bottom - jawY) * 0.6} ${cx + chinC * 1.6} ${bottom} ${cx} ${bottom}`,
      `C ${cx - chinC * 1.6} ${bottom} ${cx - J * 0.8} ${jawY + (bottom - jawY) * 0.6} ${cx - J} ${jawY}`,
      `C ${cx - J - (W - J) * 0.35} ${y(0.7)} ${cx - W} ${y(0.6)} ${cx - W} ${templeY}`,
      `C ${cx - W} ${y(0.16)} ${cx - W * 0.56} ${top} ${cx} ${top}`,
      "Z",
    ].join(" ");

    // Half-width of the face at a given height, sampled from the right side of headPath.
    const rightSide = [
      [[cx, top], [cx + W * 0.56, top], [cx + W, y(0.16)], [cx + W, templeY]],
      [[cx + W, templeY], [cx + W, y(0.6)], [cx + J + (W - J) * 0.35, y(0.7)], [cx + J, jawY]],
      [[cx + J, jawY], [cx + J * 0.8, jawY + (bottom - jawY) * 0.6], [cx + chinC * 1.6, bottom], [cx, bottom]],
    ];
    const outline = [];
    for (const [p0, p1, p2, p3] of rightSide) {
      for (let i = 0; i <= 30; i++) {
        const s = i / 30, u = 1 - s;
        const b = (k) => u * u * u * p0[k] + 3 * u * u * s * p1[k] + 3 * u * s * s * p2[k] + s * s * s * p3[k];
        outline.push([b(1), b(0) - cx]);
      }
    }
    const faceHalf = (yy) => {
      for (let i = 1; i < outline.length; i++) {
        const [y0, x0] = outline[i - 1];
        const [y1, x1] = outline[i];
        if (yy >= y0 && yy <= y1) return y1 === y0 ? x1 : x0 + ((yy - y0) / (y1 - y0)) * (x1 - x0);
      }
      return 0;
    };

    // Ears
    const es = lerp(0.75, 1.35, t("earSize"));
    const earRot = lerp(-4, 28, t("earAngle"));
    const earStretch = lerp(0.6, 1.25, t("earAngle"));
    const earX = W - 6;
    const earY = eyeY + 6;
    const earShape = `
      <path d="M -8 -22 C 10 -32 30 -26 28 -4 C 27 12 18 27 2 28 L -8 24 Z"
        fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      <path d="M 4 -14 C 16 -19 21 -9 19 1 C 17 10 12 15 6 17"
        fill="none" stroke="${SKIN_SHADE}" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`;
    const ears = `
      <g transform="translate(${r(cx + earX)} ${r(earY)}) rotate(${r(earRot)}) scale(${r(earStretch * es * 100) / 100} ${r(es * 100) / 100})">${earShape}</g>
      <g transform="translate(${r(cx - earX)} ${r(earY)}) scale(-1 1) rotate(${r(earRot)}) scale(${r(earStretch * es * 100) / 100} ${r(es * 100) / 100})">${earShape}</g>`;

    // Neck and clothing
    const neck = `
      <path d="M ${cx - nW} ${jawY} L ${cx - nW - 3} 390 L ${cx + nW + 3} 390 L ${cx + nW} ${jawY} Z" fill="${SKIN_NECK}" stroke="${OUTLINE}" stroke-width="2.5"/>
      <ellipse cx="${cx}" cy="${bottom + 4}" rx="${nW - 1}" ry="11" fill="${SKIN_SHADE}" opacity="0.7"/>`;

    const tunic = `
      <path d="M 26 480 L 28 438 C 34 396 74 370 128 358 C 150 353 ${cx - nWb - 14} 350 ${cx - nWb - 4} 352
               Q ${cx} 394 ${cx + nWb + 4} 352 C ${cx + nWb + 14} 350 250 353 272 358
               C 326 370 366 396 372 438 L 374 480 Z"
        fill="#ede6d6" stroke="#b7ab92" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M ${cx - 62} 357 L ${cx - 48} 355 L ${cx - 45} 480 L ${cx - 64} 480 Z" fill="#6d1a3f"/>
      <path d="M ${cx - 62} 357 L ${cx - 48} 355 L ${cx - 45} 480 L ${cx - 64} 480 Z" fill="none" stroke="#4d1029" stroke-width="1.5"/>
      <path d="M 70 410 C 80 430 84 455 86 480" fill="none" stroke="#d3c9b4" stroke-width="2.5" stroke-linecap="round"/>`;

    const togaD = `M ${cx + nWb - 4} 352 C 262 342 318 350 352 376 C 376 396 384 440 386 480 L 98 480
               C 136 448 184 404 ${cx + nWb - 10} 368 Z`;
    const band = `M 110 492 C 152 450 192 410 ${cx + nWb - 2} 370 Q ${cx + nWb + 12} 354 ${cx + nWb + 46} 346`;
    const toga = `
      <clipPath id="${id}-togaclip"><path d="${togaD}"/></clipPath>
      <path d="${togaD}" fill="url(#${id}-toga)"/>
      <g clip-path="url(#${id}-togaclip)">
        <path d="M 252 382 C 232 420 214 452 204 480" fill="none" stroke="#d9d2c3" stroke-width="3" stroke-linecap="round"/>
        <path d="M 292 372 C 278 410 266 450 262 480" fill="none" stroke="#d9d2c3" stroke-width="3" stroke-linecap="round"/>
        <path d="M 332 386 C 328 420 326 452 326 480" fill="none" stroke="#d9d2c3" stroke-width="3" stroke-linecap="round"/>
        <path d="${band}" fill="none" stroke="#b7ab92" stroke-width="22"/>
        <path d="${band}" fill="none" stroke="#fbf9f4" stroke-width="17"/>
        <path d="M 124 488 C 162 452 200 416 ${cx + nWb + 4} 380 Q ${cx + nWb + 18} 366 ${cx + nWb + 48} 358" fill="none" stroke="#e3dccd" stroke-width="3" stroke-linecap="round"/>
      </g>
      <path d="${togaD}" fill="none" stroke="#b7ab92" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 26 448 C 58 468 100 476 150 480 L 26 480 Z" fill="#f6f3ec" stroke="#b7ab92" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 40 462 C 70 474 96 478 120 480" fill="none" stroke="#d9d2c3" stroke-width="2.5" stroke-linecap="round"/>`;

    // Hair
    let hairFront = "";
    let shine = "";
    const sideBot = y(0.47);
    if (c.hair === "full") {
      const Wh = W + 7;
      const th = top - 9;
      const fy = (x) => y(0.2) + Math.pow((x - cx) / W, 2) * L * 0.1;
      const fx0 = cx - W + 11;
      const fx1 = cx + W - 11;
      const N = 8;
      const d = [
        `M ${cx - W + 7} ${r(sideBot - L * 0.035)}`,
        `L ${cx - W - 1} ${sideBot}`,
        `C ${cx - W - 6} ${y(0.38)} ${cx - Wh} ${y(0.25)} ${cx - Wh + 2} ${y(0.2)}`,
        `C ${cx - Wh + 4} ${y(0.04)} ${cx - Wh * 0.55} ${th} ${cx} ${th}`,
        `C ${cx + Wh * 0.55} ${th} ${cx + Wh - 4} ${y(0.04)} ${cx + Wh - 2} ${y(0.2)}`,
        `C ${cx + Wh} ${y(0.25)} ${cx + W + 6} ${y(0.38)} ${cx + W + 1} ${sideBot}`,
        `L ${cx + W - 7} ${r(sideBot - L * 0.035)}`,
        `L ${cx + W - 10} ${r(fy(fx1) + 4)}`,
        `L ${r(fx1)} ${r(fy(fx1))}`,
      ];
      let fringeRL = "";
      for (let i = N - 1; i >= 0; i--) {
        const xa = fx0 + ((fx1 - fx0) * (i + 1)) / N;
        const xb = fx0 + ((fx1 - fx0) * i) / N;
        const w = xa - xb;
        const xm = xb + w * 0.4;
        const tipY = fy(xm) + L * 0.05;
        fringeRL += ` Q ${r(xm + w * 0.35)} ${r(fy(xa) + 3)} ${r(xm)} ${r(tipY)}`;
        fringeRL += ` Q ${r(xb + w * 0.1)} ${r(tipY - 2)} ${r(xb)} ${r(fy(xb))}`;
      }
      d.push(fringeRL);
      d.push(`L ${cx - W + 10} ${r(fy(fx0) + 4)}`, "Z");

      let strands = "";
      for (const off of [-0.55, -0.25, 0.05, 0.35, 0.62]) {
        const x2 = cx + off * W;
        strands += `<path d="M ${r(cx + off * W * 0.3)} ${r(top + 4)} Q ${r(cx + off * W * 0.85)} ${r(y(0.08))} ${r(x2 - 4)} ${r(fy(x2) + L * 0.02)}"
          fill="none" stroke="${hairDark}" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>`;
      }
      hairFront = `
        <path d="${d.join(" ")}" fill="${hair}" stroke="${hairDark}" stroke-width="2.5" stroke-linejoin="round"/>
        ${strands}
        <path d="M ${r(cx - W * 0.45)} ${r(top + 8)} Q ${cx} ${r(top - 2)} ${r(cx + W * 0.3)} ${r(top + 6)}"
          fill="none" stroke="${hairLight}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`;
    } else {
      shine = `<ellipse cx="${r(cx - W * 0.32)}" cy="${r(top + L * 0.1)}" rx="${r(W * 0.24)}" ry="${r(L * 0.035)}"
        transform="rotate(-24 ${r(cx - W * 0.32)} ${r(top + L * 0.1)})" fill="#fff" opacity="0.35"/>`;
    }
    if (c.hair === "balding") {
      const patch = (s) => `
        <path d="M ${cx + s * (W + 3)} ${y(0.24)}
                 C ${cx + s * (W + 7)} ${y(0.32)} ${cx + s * (W + 6)} ${y(0.41)} ${cx + s * (W + 3)} ${sideBot}
                 L ${cx + s * (W - 8)} ${sideBot}
                 C ${cx + s * (W - 9)} ${y(0.39)} ${cx + s * (W - 11)} ${y(0.31)} ${cx + s * (W - 16)} ${y(0.26)}
                 Q ${cx + s * (W - 8)} ${y(0.22)} ${cx + s * (W + 3)} ${y(0.24)} Z"
          fill="${hair}" stroke="${hairDark}" stroke-width="2.2" stroke-linejoin="round"/>`;
      const wisps = [-0.18, 0.02, 0.2]
        .map(
          (o) =>
            `<path d="M ${r(cx + o * W - 8)} ${r(top + L * 0.03)} q ${r(6)} ${r(-6)} ${r(16)} ${r(-2)}"
              fill="none" stroke="${hair}" stroke-width="2" stroke-linecap="round" opacity="0.8"/>`
        )
        .join("");
      hairFront = patch(1) + patch(-1) + wisps;
    }

    // Beard
    let beard = "";
    if (c.beard !== "none") {
      const mY = mouthY;
      const outer = [
        `M ${cx - W + 1} ${sideBot}`,
        `C ${cx - W - 4} ${y(0.62)} ${cx - J - 8} ${y(0.72)} ${cx - J - 5} ${jawY + 4}`,
        `C ${cx - J * 0.85 - 6} ${jawY + (bottom - jawY) * 0.8 + 8} ${cx - chinC * 1.6 - 8} ${bottom + 16} ${cx} ${bottom + 18}`,
        `C ${cx + chinC * 1.6 + 8} ${bottom + 16} ${cx + J * 0.85 + 6} ${jawY + (bottom - jawY) * 0.8 + 8} ${cx + J + 5} ${jawY + 4}`,
        `C ${cx + J + 8} ${y(0.72)} ${cx + W + 4} ${y(0.62)} ${cx + W - 1} ${sideBot}`,
        `L ${cx + W - 10} ${sideBot}`,
        `C ${cx + W - 12} ${y(0.6)} ${cx + W * 0.6} ${noseY + 4} ${cx + 26} ${noseY + 10 * ns}`,
        `Q ${cx + 13} ${noseY + 6 * ns} ${cx} ${noseY + 11 * ns}`,
        `Q ${cx - 13} ${noseY + 6 * ns} ${cx - 26} ${noseY + 10 * ns}`,
        `C ${cx - W * 0.6} ${noseY + 4} ${cx - W + 12} ${y(0.6)} ${cx - W + 10} ${sideBot}`,
        "Z",
      ].join(" ");
      const hole = `M ${cx - 17} ${mY + 1} A 17 7 0 1 0 ${cx + 17} ${mY + 1} A 17 7 0 1 0 ${cx - 17} ${mY + 1} Z`;
      if (c.beard === "full") {
        let curls = "";
        for (const [fx, fy] of [[-0.55, 0.66], [0.55, 0.66], [-0.4, 0.82], [0.4, 0.82], [-0.15, 0.95], [0.15, 0.95]]) {
          const px = cx + fx * J;
          const py = jawY + (bottom - jawY) * fy;
          curls += `<path d="M ${r(px - 5)} ${r(py)} q 5 6 10 0" fill="none" stroke="${hairDark}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`;
        }
        beard = `<path d="${outer} ${hole}" fill="${hair}" fill-rule="evenodd" stroke="${hairDark}" stroke-width="2.5" stroke-linejoin="round"/>${curls}`;
      } else {
        beard = `<path d="${outer} ${hole}" fill="${hairDark}" fill-rule="evenodd" opacity="0.28" clip-path="url(#${id}-headclip)"/>`;
      }
    }

    // Eyes and brows
    const eS = lerp(0.85, 1.5, t("eyeSize"));
    const eA = lerp(-14, 14, t("eyeAngle"));
    const eX = W * 0.4;
    const narrow = t("eyeNarrow");
    const scleraRy = 9.5 * (narrow < 0.5 ? lerp(1.15, 1, narrow / 0.5) : 1);
    // Above 50% the upper lid descends, but stops short of the eye's midline so it never fully closes.
    const lidK = Math.max(0, (narrow - 0.5) / 0.5);
    const lidMid = lerp(-scleraRy * 0.85, -1.5, lidK);
    const lidCtrl = r(2 * lidMid - 1);
    const squint = lerp(-4.5, 4.5, t("squint"));
    const red = t("eyeRedness") ** 2.2;
    const sclera = mix("#ffffff", "#f3aea2", red * 0.75);
    const veins =
      red > 0.15
        ? `<path d="M -13 1 q 3 -1 5 0.5 q 2 1 3 -0.5 M -12.5 -2.5 q 3 0.5 4.5 -0.5 M 13 1.5 q -3 -1.5 -5 0 M 12.5 -2 q -2.5 1 -4.5 0.2 l -1.5 1"
            fill="none" stroke="#c0392b" stroke-width="0.8" stroke-linecap="round" opacity="${r(Math.min(1, (red - 0.15) * 1.6) * 100) / 100}"/>`
        : "";
    const eye = (x, rot, side) => `
      <g transform="translate(${r(x)} ${r(eyeY)}) rotate(${r(rot)}) scale(${r(eS * 100) / 100})">
        <ellipse rx="13" ry="${r(scleraRy)}" fill="${sclera}"/>
        <g clip-path="url(#${id}-eyeclip)">
          ${veins}
          <circle cx="${r(side * squint)}" cy="0.5" r="6.8" fill="${eyeColor}"/>
          <circle cx="${r(side * squint)}" cy="0.5" r="3.2" fill="#140c08"/>
          <circle cx="${r(side * squint + 2.4)}" cy="-2" r="1.8" fill="#fff"/>
          <path d="M -16 1 L -16 -25 L 16 -25 L 16 1 L 14.5 1 Q 0 ${lidCtrl} -14.5 1 Z" fill="${SKIN}"/>
        </g>
        <path d="M -13 0 A 13 ${r(scleraRy)} 0 0 0 13 0" fill="none" stroke="${OUTLINE}" stroke-width="2"/>
        <path d="M -14.5 1 Q 0 ${lidCtrl} 14.5 1" fill="none" stroke="#3a2016" stroke-width="3.2" stroke-linecap="round"/>
      </g>`;
    const fr = t("frown");
    // Below 50% the face smiles, above 50% it frowns; the smile is capped so it stays dignified.
    const frown = fr < 0.5 ? ((fr - 0.5) / 0.5) * 0.7 : (fr - 0.5) / 0.5;
    const browPath = `<path d="M -14 ${r(3 + frown * 7)} Q -2 ${r(-6 + frown * 2)} 16 ${r(-frown * 2)}" fill="none" stroke="${hairDark}" stroke-width="5.5" stroke-linecap="round"/>`;
    const browY = eyeY - 18 * eS + Math.max(0, frown) * 3 + lidK * 3;
    const eyes = `
      ${eye(cx + eX, -eA, 1)}
      ${eye(cx - eX, eA, -1)}
      <g transform="translate(${r(cx + eX)} ${r(browY)}) rotate(${r(-eA * 0.7)})">${browPath}</g>
      <g transform="translate(${r(cx - eX)} ${r(browY)}) rotate(${r(eA * 0.7)}) scale(-1 1)">${browPath}</g>`;

    // Nose
    const nose = `
      <g transform="translate(${cx} ${r(noseY)}) scale(${r(ns * 100) / 100})">
        <ellipse cx="1" cy="3" rx="8" ry="6" fill="${SKIN_SHADE}" opacity="0.3"/>
        <path d="M -8 3 Q -11 9 -5 9 Q 0 11.5 5 9 Q 11 9 8 3" fill="none" stroke="${OUTLINE}" stroke-width="2"
          vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
      </g>`;

    // Wrinkles fade in progressively: smile lines first, crow's feet and frown lines last.
    const fade = (th) => r(Math.min(1, Math.max(0, ((wr - th) / (1 - th)) * 1.4)) * 0.7 * 100) / 100;
    const wl = (d, o) => (o > 0 ? `<path d="${d}" fill="none" stroke="#b97a58" stroke-width="2" stroke-linecap="round" opacity="${o}"/>` : "");
    let wrinkles = "";
    for (const s of [-1, 1]) {
      const ex = cx + s * eX;
      const ox = ex + s * (13 * eS + 3);
      const smileMid = Math.min(11 * ns + 12, faceHalf(mouthY - 4) - 10);
      const smileEnd = Math.min(21, faceHalf(mouthY + 7) - 10);
      wrinkles += wl(`M ${r(cx + s * (11 * ns + 4))} ${r(noseY - 2)} Q ${r(cx + s * smileMid)} ${r(mouthY - 4)} ${r(cx + s * smileEnd)} ${r(mouthY + 7)}`, fade(0.05));
      wrinkles += wl(`M ${r(ex - 9 * eS)} ${r(eyeY + 12 * eS)} Q ${r(ex)} ${r(eyeY + 16 * eS)} ${r(ex + 9 * eS)} ${r(eyeY + 11 * eS)}`, fade(0.25));
      const crow = Math.max(0, Math.min(8, faceHalf(eyeY) - 5 - (ox - cx) * s));
      if (crow > 2) {
        const k = crow / 8;
        wrinkles += wl(
          `M ${r(ox)} ${r(eyeY - 3)} l ${r(s * 7 * k)} ${r(-3 * k)} M ${r(ox + s)} ${r(eyeY + 1)} l ${r(s * 8 * k)} 0 M ${r(ox)} ${r(eyeY + 5)} l ${r(s * 7 * k)} ${r(3 * k)}`,
          fade(0.5)
        );
      }
    }
    const fw = W * 0.36;
    wrinkles += wl(`M ${r(cx - fw)} ${r(browY - 11)} Q ${cx} ${r(browY - 15)} ${r(cx + fw)} ${r(browY - 11)}`, fade(0.35));
    wrinkles += wl(`M ${r(cx - fw * 0.8)} ${r(browY - 18)} Q ${cx} ${r(browY - 22)} ${r(cx + fw * 0.8)} ${r(browY - 18)}`, fade(0.6));
    wrinkles += wl(`M ${cx - 4} ${r(browY - 3)} l 1 8 M ${cx + 4} ${r(browY - 3)} l -1 8`, Math.max(fade(0.65), r(Math.max(0, frown) * 55) / 100));

    const lean = Math.max(0, (0.35 - wt) / 0.35);
    const hollows =
      lean > 0
        ? [-1, 1]
            .map(
              (s) =>
                `<path d="M ${r(cx + s * (faceHalf(noseY - 6) - 12))} ${r(noseY - 6)} Q ${r(cx + s * (faceHalf(noseY + 12) - 17))} ${r(noseY + 12)} ${r(cx + s * (faceHalf(mouthY + 6) - 11))} ${r(mouthY + 6)}"
                  fill="none" stroke="${SKIN_SHADE}" stroke-width="2.5" stroke-linecap="round" opacity="${r(lean * 0.8 * 100) / 100}"/>`
            )
            .join("")
        : "";

    // Mouth and chin
    const mCtrl = frown < 0 ? 7 - frown * 7 : 7 - frown * 13;
    const mL = mouthY + frown * 4;
    const mR = mouthY - 2 + frown * 5;
    const lipY = mouthY + 8 - Math.max(0, frown) * 3;
    const mouth = `
      <path d="M ${cx - 15} ${r(mL)} Q ${cx} ${r(mouthY + mCtrl)} ${cx + 16} ${r(mR)}" fill="none" stroke="${LIP}" stroke-width="3" stroke-linecap="round"/>
      <path d="M ${cx - 7} ${r(lipY)} Q ${cx} ${r(lipY + 3)} ${cx + 7} ${r(lipY)}" fill="none" stroke="${SKIN_SHADE}" stroke-width="2.5" stroke-linecap="round"/>`;
    const chinLine =
      t("chinSize") > 0.55 && c.beard !== "full"
        ? `<path d="M ${cx - chinC * 0.6} ${r(bottom - 9)} Q ${cx} ${r(bottom - 4)} ${cx + chinC * 0.6} ${r(bottom - 9)}" fill="none" stroke="${SKIN_SHADE}" stroke-width="2.5" stroke-linecap="round" opacity="${r((t("chinSize") - 0.5) * 1.6 * 100) / 100}"/>`
        : "";

    const background =
      opts.background === false
        ? ""
        : `<rect width="400" height="480" fill="url(#${id}-bg)"/>
           <circle cx="200" cy="215" r="165" fill="#000" opacity="0.08"/>`;

    return `<svg viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Portrait of your senator">
      <defs>
        <radialGradient id="${id}-bg" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stop-color="#b8432f"/>
          <stop offset="100%" stop-color="#6a1d15"/>
        </radialGradient>
        <linearGradient id="${id}-toga" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#e2dccd"/>
        </linearGradient>
        <clipPath id="${id}-headclip"><path d="${headPath}"/></clipPath>
        <clipPath id="${id}-eyeclip"><ellipse rx="13" ry="${r(scleraRy)}"/></clipPath>
      </defs>
      ${background}
      ${ears}
      ${neck}
      <g transform="translate(${cx} 0) scale(${r(bodyScale * 1000) / 1000} 1) translate(${-cx} 0)">
        ${tunic}
        ${toga}
      </g>
      <path d="${headPath}" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
      <g clip-path="url(#${id}-headclip)">
        ${hollows}
        ${chinLine}
        ${wrinkles}
      </g>
      ${shine}
      ${hairFront}
      ${beard}
      ${eyes}
      ${nose}
      ${mouth}
    </svg>`;
  }

  CH.renderCharacter = renderCharacter;
})();
