(() => {
  // ---------- Config ----------
  const GRID_ROWS = 12;
  const GRID_COLS = 12;
  const TURNS_TOTAL = 20;
  const START_LORDS = 3;
  const START_PEASANTS = 60;
  const HEX_STOCKPILE_CAPACITY = 200; // per owned hex
  const MONASTERY_COST = 100;
  const INFRA_COST = 50;
  const INFRA_CAP_INC = 100;
  const BREAD_CAP_MIN = 200;
  const BREAD_CAP_MAX = 500;
  const TEAM_KEYS = ["blue", "red", "green"];

  const COLORS = {
    blue: "#1d3ea6",   // deeper medieval blue
    red: "#7a1f1f",    // wine red
    green: "#2f5d2f",  // forest green
    neutral: "#d9cfb8",// aged parchment
    stroke: "#6a665f",
    selection: "#b68c40", // gilt gold
    company: "#222",
  };

  // ---------- DOM ----------
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const phaseDisplay = document.getElementById("phaseDisplay");
  const turnDisplay = document.getElementById("turnDisplay");
  const statusMsg = document.getElementById("statusMsg");
  const reportModal = document.getElementById("turnReportModal");
  const reportProduced = document.getElementById("reportProduced");
  const reportStarvation = document.getElementById("reportStarvation");
  const reportPlague = document.getElementById("reportPlague");
  const reportWar = document.getElementById("reportWar");
  const reportStolen = document.getElementById("reportStolen");
  const reportCloseBtn = document.getElementById("reportCloseBtn");
  const startingHelp = document.getElementById("startingHelp");
  const endPhaseBtn = document.getElementById("endPhaseBtn");
  const endTurnBtn = document.getElementById("endTurnBtn");
  const buildControls = document.getElementById("buildControls");
  const buildMonasteryBtn = document.getElementById("buildMonasteryBtn");
  const upgradeInfraBtn = document.getElementById("upgradeInfraBtn");
  const companyControls = document.getElementById("companyControls");
  const settleControls = document.getElementById("settleControls");
  const createCompanyBtn = document.getElementById("createCompanyBtn");
  const settleBtn = document.getElementById("settleBtn");
  const inputCompanyLords = document.getElementById("companyLords");
  const inputCompanyPeasants = document.getElementById("companyPeasants");
  // Realm indicators
  const stockpileSpan = document.getElementById("stockpile");
  const stockpileCapSpan = document.getElementById("stockpileCap");
  const peasantsTotalSpan = document.getElementById("peasantsTotal");
  const lordsTotalSpan = document.getElementById("lordsTotal");
  const vagabondsTotalSpan = document.getElementById("vagabondsTotal");
  const plagueStatusSpan = document.getElementById("plagueStatus");
  // Hex info
  const hexCoordSpan = document.getElementById("hexCoord");
  const hexOwnerSpan = document.getElementById("hexOwner");
  const hexBreadCapSpan = document.getElementById("hexBreadCap");
  const hexInfraCapSpan = document.getElementById("hexInfraCap");
  const hexPeasantsSpan = document.getElementById("hexPeasants");
  const hexLordsSpan = document.getElementById("hexLords");
  const hexMonasterySpan = document.getElementById("hexMonastery");
  const hexFreePeasantsSpan = document.getElementById("hexFreePeasants");
  const hexFreeLordsSpan = document.getElementById("hexFreeLords");
  const hexClericsSpan = document.getElementById("hexClerics");
  const hexClericCapSpan = document.getElementById("hexClericCap");
  const clergyControls = document.getElementById("clergyControls");
  const clericAssignCountInput = document.getElementById("clericAssignCount");
  const assignClericsBtn = document.getElementById("assignClericsBtn");

  // ---------- Canvas & Hex Geometry ----------
  function computeHexSize() {
    const w = canvas.width;
    const h = canvas.height;
    // Add extra margin space so hexes are fully in-frame
    const sizeByWidth = w / (Math.sqrt(3) * (GRID_COLS + 1.5));
    const sizeByHeight = h / (1.5 * GRID_ROWS + 1.5);
    return Math.floor(Math.min(sizeByWidth, sizeByHeight) * 0.98);
  }
  let HEX_SIZE = computeHexSize();
  window.addEventListener("resize", () => {
    // Keep canvas intrinsic size; CSS will scale
    HEX_SIZE = computeHexSize();
    draw();
  });

  function hexToPixel(r, c) {
    // pointy-top, odd-r offset
    const marginX = HEX_SIZE;
    const marginY = HEX_SIZE;
    const x = marginX + HEX_SIZE * Math.sqrt(3) * (c + 0.5 * (r & 1));
    const y = marginY + HEX_SIZE * (1.5 * r);
    return { x, y };
  }

  function polygonCorners(x, y) {
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const px = x + HEX_SIZE * Math.cos(angle);
      const py = y + HEX_SIZE * Math.sin(angle);
      corners.push({ x: px, y: py });
    }
    return corners;
  }

  function pointInHex(px, py, r, c) {
    // Rough bounding box test then polygon test
    const { x, y } = hexToPixel(r, c);
    const corners = polygonCorners(x, y);
    return pointInPolygon(px, py, corners);
  }

  function pointInPolygon(x, y, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi + 0.000001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function neighbors(r, c) {
    const results = [];
    const deltasEven = [[+1, 0], [0, +1], [-1, +1], [-1, 0], [-1, -1], [0, -1]];
    const deltasOdd = [[+1, 0], [+1, +1], [0, +1], [-1, 0], [0, -1], [+1, -1]];
    const deltas = (r & 1) ? deltasOdd : deltasEven;
    for (const [dc, dr] of deltas) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        results.push({ r: nr, c: nc });
      }
    }
    return results;
  }

  function offsetToCube(r, c) {
    // odd-r to cube
    const x = c - ((r - (r & 1)) >> 1);
    const z = r;
    const y = -x - z;
    return { x, y, z };
  }

  function hexDistance(r1, c1, r2, c2) {
    const a = offsetToCube(r1, c1);
    const b = offsetToCube(r2, c2);
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
  }

  // ---------- Data Structures ----------
  const cells = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({
        r, c,
        owner: null, // "blue" | "red" | "green" | null
        peasants: 0,
        lords: 0,
        peasantsSpent: 0,
        lordsSpent: 0,
        clerics: 0,
        breadCapBase: roundTo10(randInt(BREAD_CAP_MIN, BREAD_CAP_MAX)),
        infraCap: 0,
        monastery: 0,
        rebelHere: false,
      });
    }
    cells.push(row);
  }

  const teams = {
    blue: makeRealm("blue"),
    red: makeRealm("red"),
    green: makeRealm("green"),
  };

  function makeRealm(key) {
    return {
      key,
      color: COLORS[key],
      stockpile: 0,
      stockpileCap: 0,
      vagabonds: 0,
      plagueTurns: 0,
      companies: [], // {id, r, c, lords, peasants, moved}
      nextCompanyId: 1,
    };
  }

  const game = {
    turn: 1,
    phase: "starting", // "starting" | "movement" | "construction" | "ended"
    selection: null, // {type: "hex", r,c} | {type:"company", team, id}
    playerTeam: "blue",
    constructionUsed: false,
    startingDone: false,
    pendingClergyTransfer: null, // {fromR, fromC, count}
    lastBlueTurnStats: null,
    skipNextReport: false,
    blueWarDeathsThisTurn: 0, // Track battle deaths for Blue during movement
  };

  const rebels = []; // {r,c,lords,peasants,moved,occupationTurns:{hexKey:turns}}

  // ---------- Helpers ----------
  function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }
  function roundTo10(n) {
    return Math.round(n / 10) * 10;
  }
  function setStatus(msg) {
    statusMsg.textContent = msg || "";
  }
  function updatePhaseUI() {
    turnDisplay.textContent = String(game.turn);
    phaseDisplay.textContent =
      game.phase === "starting" ? "Starting" :
      game.phase === "movement" ? "Movement" :
      game.phase === "construction" ? "Construction" :
      "Ended";

    startingHelp.style.display = game.phase === "starting" ? "block" : "none";

    endPhaseBtn.disabled = !(game.phase === "movement" || game.phase === "construction");
    endTurnBtn.disabled = !(game.phase === "construction");

    buildControls.hidden = !(game.phase === "construction");
    companyControls.hidden = !(game.phase === "movement");
    settleControls.hidden = true; // toggled when company on neutral hex
    clergyControls.hidden = true;
  }

  function updateRealmUI() {
    const realm = teams[game.playerTeam];
    const totals = countRealmPopulation(realm.key);
    stockpileSpan.textContent = String(realm.stockpile);
    stockpileCapSpan.textContent = String(realm.stockpileCap);
    peasantsTotalSpan.textContent = String(totals.peasants);
    lordsTotalSpan.textContent = String(totals.lords);
    vagabondsTotalSpan.textContent = String(realm.vagabonds);
    plagueStatusSpan.textContent = realm.plagueTurns > 0 ? `${realm.plagueTurns} turns` : "None";
  }

  function updateHexUI(r, c) {
    if (r == null) {
      hexCoordSpan.textContent = "-";
      hexOwnerSpan.textContent = "-";
      hexBreadCapSpan.textContent = "-";
      hexInfraCapSpan.textContent = "0";
      hexPeasantsSpan.textContent = "0";
      hexLordsSpan.textContent = "0";
      hexMonasterySpan.textContent = "0";
      hexFreePeasantsSpan.textContent = "0";
      hexFreeLordsSpan.textContent = "0";
      hexClericsSpan.textContent = "0";
      hexClericCapSpan.textContent = "0";
      return;
    }
    const cell = cells[r][c];
    hexCoordSpan.textContent = `r${r},c${c}`;
    hexOwnerSpan.textContent = cell.owner ?? "Neutral";
    hexBreadCapSpan.textContent = String(cell.breadCapBase);
    hexInfraCapSpan.textContent = String(cell.infraCap);
    hexPeasantsSpan.textContent = String(cell.peasants);
    hexLordsSpan.textContent = String(cell.lords);
    hexMonasterySpan.textContent = String(cell.monastery);
    hexClericsSpan.textContent = String(cell.clerics);
    const clericCap = cell.monastery * 20;
    hexClericCapSpan.textContent = String(clericCap);
    const freeP = Math.max(0, cell.peasants - cell.peasantsSpent);
    const freeL = Math.max(0, cell.lords - cell.lordsSpent - cell.clerics);
    hexFreePeasantsSpan.textContent = String(freeP);
    hexFreeLordsSpan.textContent = String(freeL);
  }

  function countRealmPopulation(teamKey) {
    let peasants = 0, lords = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = cells[r][c];
        if (cell.owner === teamKey) {
          peasants += cell.peasants;
          lords += cell.lords;
        }
      }
    }
    const realm = teams[teamKey];
    for (const co of realm.companies) {
      peasants += co.peasants;
      lords += co.lords;
    }
    return { peasants, lords };
  }

  function computeStockpileCap(teamKey) {
    let owned = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (cells[r][c].owner === teamKey) owned++;
      }
    }
    return owned * HEX_STOCKPILE_CAPACITY;
  }

  function isOwnedBy(teamKey, r, c) {
    return cells[r][c].owner === teamKey;
  }

  function findHexUnderMouse(evt) {
    const rect = canvas.getBoundingClientRect();
    const mx = (evt.clientX - rect.left) * (canvas.width / rect.width);
    const my = (evt.clientY - rect.top) * (canvas.height / rect.height);
    // search nearby hexes by estimating r,c
    // coarse search
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (pointInHex(mx, my, r, c)) return { r, c };
      }
    }
    return null;
  }

  // ---------- Rendering ----------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.stroke;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = cells[r][c];
        const { x, y } = hexToPixel(r, c);
        const corners = polygonCorners(x, y);
        // Fill color by owner
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
        ctx.closePath();
        const baseColor = cell.owner ? COLORS[cell.owner] : COLORS.neutral;
        const effectiveCap = Math.min(500, cell.breadCapBase + cell.infraCap);
        ctx.fillStyle = cell.owner ? shadeByCap(baseColor, effectiveCap) : shadeNeutralByCap(effectiveCap);
        ctx.fill();
        // Decorative double stroke for medieval map look
        ctx.strokeStyle = "#886f47";
        ctx.stroke();
        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.stroke();

        // Selection highlight
        if (game.selection && game.selection.type === "hex" &&
            game.selection.r === r && game.selection.c === c) {
          ctx.strokeStyle = COLORS.selection;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      }
    }

    // Draw companies
    for (const k of TEAM_KEYS) {
      for (const co of teams[k].companies) {
        const { x, y } = hexToPixel(co.r, co.c);
        ctx.beginPath();
        // shield-like marker
        const radius = Math.max(6, HEX_SIZE * 0.25);
        ctx.arc(x, y - HEX_SIZE * 0.3, radius, 0, Math.PI * 2);
        ctx.fillStyle = tint(COLORS[k], 0.15);
        ctx.fill();
        ctx.strokeStyle = "#3d3022";
        ctx.stroke();

        ctx.fillStyle = "#111";
        ctx.font = "600 12px Spectral";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`L${co.lords}/P${co.peasants}`, x, y - HEX_SIZE * 0.05);

        // company selection
        if (game.selection && game.selection.type === "company" &&
            game.selection.team === k && game.selection.id === co.id) {
          ctx.beginPath();
          ctx.arc(x, y - HEX_SIZE * 0.3, Math.max(9, HEX_SIZE * 0.3), 0, Math.PI * 2);
          ctx.strokeStyle = COLORS.selection;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      }
    }

    // Draw rebels
    for (const rb of rebels) {
      const { x, y } = hexToPixel(rb.r, rb.c);
      ctx.beginPath();
      ctx.rect(x - HEX_SIZE * 0.25, y - HEX_SIZE * 0.65, HEX_SIZE * 0.5, HEX_SIZE * 0.3);
      ctx.fillStyle = "#2b1e14";
      ctx.fill();
      ctx.strokeStyle = "#b68c40";
      ctx.stroke();
      ctx.fillStyle = "#f5e6c8";
      ctx.font = "700 12px MedievalSharp, Spectral, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("R", x, y - HEX_SIZE * 0.5);
      ctx.fillStyle = "#111";
      ctx.font = "600 12px Spectral";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`L${rb.lords}/V${rb.peasants}`, x, y - HEX_SIZE * 0.3);
    }

    ctx.restore();
  }

  function tint(hex, amount) {
    const c = parseInt(hex.slice(1), 16);
    let r = (c >> 16) & 255;
    let g = (c >> 8) & 255;
    let b = c & 255;
    r = Math.min(255, Math.floor(r + (255 - r) * amount));
    g = Math.min(255, Math.floor(g + (255 - g) * amount));
    b = Math.min(255, Math.floor(b + (255 - b) * amount));
    return `rgb(${r},${g},${b})`;
  }

  function darken(rgbString, amount) {
    // rgbString assumed "rgb(r,g,b)"
    const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgbString);
    if (!m) return rgbString;
    let r = parseInt(m[1], 10);
    let g = parseInt(m[2], 10);
    let b = parseInt(m[3], 10);
    r = Math.max(0, Math.floor(r * (1 - amount)));
    g = Math.max(0, Math.floor(g * (1 - amount)));
    b = Math.max(0, Math.floor(b * (1 - amount)));
    return `rgb(${r},${g},${b})`;
  }

  function shadeByCap(baseHex, cap) {
    // Map 200..500 to light..dark
    const t = Math.max(0, Math.min(1, (cap - 200) / 300));
    const lightenAmt = 0.45 * (1 - t); // 0.45 -> 0
    const darkenAmt = 0.25 * t;        // 0 -> 0.25
    let c = tint(baseHex, lightenAmt);
    c = darken(c, darkenAmt);
    return c;
  }

  function shadeNeutralByCap(cap) {
    // Very light (near-white) yellow to bright golden yellow
    const t = Math.max(0, Math.min(1, (cap - 200) / 300));
    const hue = 48; // golden yellow
    const sat = 90 + Math.floor(10 * t); // 90% -> 100%
    const light = Math.floor(96 - (96 - 55) * t); // 96% -> 55%
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  // ---------- Game Flow ----------
  canvas.addEventListener("click", (evt) => {
    const hit = findHexUnderMouse(evt);
    if (!hit) return;
    const { r, c } = hit;
    const cell = cells[r][c];

    // Handle pending clergy transfer target selection (movement or construction)
    if (game.pendingClergyTransfer) {
      const { fromR, fromC, count } = game.pendingClergyTransfer;
      const src = cells[fromR][fromC];
      // Target must be owned by player and have a monastery
      if (cell.owner !== "blue" || cell.monastery <= 0) {
        setStatus("Choose one of your monastery hexes as destination.");
        return;
      }
      const cap = cell.monastery * 20;
      const room = Math.max(0, cap - cell.clerics);
      // Compute available from source
      const freeLordsAtSource = Math.max(0, src.lords - src.lordsSpent - src.clerics);
      let maxSend = freeLordsAtSource;
      // If moving to a different hex, ensure at least one lord remains in source
      if (!(fromR === r && fromC === c)) {
        maxSend = Math.min(maxSend, Math.max(0, src.lords - 1));
      }
      const toAssign = Math.min(Math.max(0, Math.floor(count || 0)), room, maxSend);
      if (toAssign <= 0) {
        setStatus("No valid lords to send or monastery is at capacity.");
        game.pendingClergyTransfer = null;
        updateHexUI(r, c);
        draw();
        return;
      }
      if (fromR === r && fromC === c) {
        // In-place assignment to local monastery: do not change lords, just clerics
        src.clerics += toAssign;
      } else {
        // Transfer to target monastery: move lords and assign as clerics
        src.lords -= toAssign;
        cell.lords += toAssign;
        cell.clerics += toAssign;
      }
      game.pendingClergyTransfer = null;
      game.selection = { type: "hex", r, c };
      setStatus(`Sent ${toAssign} lord${toAssign === 1 ? "" : "s"} to the monastery.`);
      updateRealmUI();
      updateHexUI(r, c);
      draw();
      return;
    }

    if (game.phase === "starting") {
      if (game.startingDone) return;
      choosePlayerStart(r, c);
      return;
    }

    // Movement selection logic
    if (game.phase === "movement") {
      // If clicking on a company of player, select it
      const playerCompaniesHere = teams.blue.companies.filter(co => co.r === r && co.c === c);
      if (playerCompaniesHere.length > 0) {
        const co = playerCompaniesHere[0];
        game.selection = { type: "company", team: "blue", id: co.id };
        updateHexUI(r, c);
        settleControls.hidden = !canSettleHere(teams.blue, co, r, c);
        setStatus("Company selected. Click a destination hex to move, or Settle.");
        draw();
        return;
      }

      // If a company is selected and click a destination -> move attempt
      if (game.selection && game.selection.type === "company") {
        const { team, id } = game.selection;
        const realm = teams[team];
        const co = realm.companies.find(x => x.id === id);
        if (!co) {
          game.selection = null;
          draw();
          return;
        }
        const destCell = cells[r][c];
        const insideRealm = cells[co.r][co.c].owner === team && destCell.owner === team;
        const isAdjacent = hexDistance(co.r, co.c, r, c) === 1;
        const destIsNeutral = !destCell.owner;
        const destIsEnemy = destCell.owner && destCell.owner !== team;
        // Check if dest borders your realm (for neutral or enemy hexes)
        let destBordersRealm = false;
        if (destIsNeutral || destIsEnemy) {
          const adj = neighbors(r, c);
          for (const n of adj) {
            if (cells[n.r][n.c].owner === team) {
              destBordersRealm = true;
              break;
            }
          }
        }
        if (co.moved) {
          // Allow unselecting by clicking elsewhere after movement is spent
          game.selection = { type: "hex", r, c };
          updateHexUI(r, c);
          settleControls.hidden = true;
          setStatus("This company has already moved. Selection changed to hex.");
          draw();
          return;
        }
        // Check if destination is reachable
        const canReach = insideRealm || ((destIsNeutral || destIsEnemy) && destBordersRealm) || isAdjacent;
        if (!canReach) {
          setStatus("Cannot reach that hex this turn.");
          return;
        }
        // Company vs rebel: company moves there, rebels vanish
        const rebelHere = rebelAt(r, c);
        if (rebelHere) {
          // Remove all rebels at this hex
          for (let i = rebels.length - 1; i >= 0; i--) {
            if (rebels[i].r === r && rebels[i].c === c) rebels.splice(i, 1);
          }
          // Move company there
          co.r = r;
          co.c = c;
          co.moved = true;
          settleControls.hidden = !canSettleHere(realm, co, r, c);
          setStatus("Rebel group eliminated. Company moved.");
          updateRealmUI();
          updateHexUI(r, c);
          draw();
          return;
        }
        // Company vs company battle
        const foundCoAtDest = companyAt(r, c);
        if (foundCoAtDest && foundCoAtDest.team !== team) {
          const defender = foundCoAtDest.company;
          const attacker = co;
          if (attacker.peasants > defender.peasants) {
            // Attacker wins: defender vanishes, attacker moves there
            if (foundCoAtDest.team === "blue") {
              game.blueWarDeathsThisTurn += defender.peasants;
            }
            teams[foundCoAtDest.team].companies = teams[foundCoAtDest.team].companies.filter(x => x.id !== defender.id);
            attacker.r = r;
            attacker.c = c;
            attacker.moved = true;
            game.selection = { type: "company", team, id: attacker.id };
            settleControls.hidden = !canSettleHere(realm, attacker, r, c);
            setStatus("Victory! Enemy company destroyed. You may settle this hex.");
            updateRealmUI();
            updateHexUI(r, c);
            draw();
            return;
          } else if (attacker.peasants < defender.peasants) {
            // Defender wins: attacker vanishes
            if (team === "blue") {
              game.blueWarDeathsThisTurn += attacker.peasants;
            }
            realm.companies = realm.companies.filter(x => x.id !== attacker.id);
            game.selection = null;
            setStatus("Defeat! Your company was destroyed.");
            updateRealmUI();
            updateHexUI(r, c);
            draw();
            return;
          } else {
            // Equal: both vanish
            if (foundCoAtDest.team === "blue") {
              game.blueWarDeathsThisTurn += defender.peasants;
            }
            if (team === "blue") {
              game.blueWarDeathsThisTurn += attacker.peasants;
            }
            teams[foundCoAtDest.team].companies = teams[foundCoAtDest.team].companies.filter(x => x.id !== defender.id);
            realm.companies = realm.companies.filter(x => x.id !== attacker.id);
            game.selection = null;
            setStatus("Mutual destruction! Both companies destroyed.");
            updateRealmUI();
            updateHexUI(r, c);
            draw();
            return;
          }
        }
        // Move anywhere inside realm, to a neutral/enemy hex that borders your realm, or one adjacent step otherwise
        if (insideRealm || ((destIsNeutral || destIsEnemy) && destBordersRealm) || isAdjacent) {
          co.r = r;
          co.c = c;
          co.moved = true;
          settleControls.hidden = !canSettleHere(realm, co, r, c);
          updateHexUI(r, c);
          setStatus("Company moved.");
          draw();
          return;
        } else {
          setStatus("Outside your realm, move is limited to one adjacent hex or enemy hexes bordering your realm.");
          return;
        }
      }

      // Otherwise, select hex
      game.selection = { type: "hex", r, c };
      updateHexUI(r, c);
      draw();
      // Toggle company creation visibility if owned and has pop
      if (cell.owner === "blue" && (cell.lords > 0 || cell.peasants > 0)) {
        companyControls.hidden = false;
        // Auto-adjust default company inputs to satisfy 1:20 ratio if possible
        const freeLords = Math.max(0, cell.lords - cell.lordsSpent - cell.clerics);
        const freePeasants = Math.max(0, cell.peasants - cell.peasantsSpent);
        const currentLords = Math.max(1, Math.floor(Number(inputCompanyLords.value || 1)));
        const minPeasants = 20 * currentLords;
        const suggestedPeasants = Math.max(20, Math.min(freePeasants, minPeasants));
        inputCompanyLords.value = String(Math.min(currentLords, Math.max(1, freeLords)));
        inputCompanyPeasants.value = String(suggestedPeasants);
      } else {
        companyControls.hidden = true;
      }
      // Toggle clergy controls in movement for any owned hex (choose monastery on next click)
      if (cell.owner === "blue") {
        clergyControls.hidden = false;
      } else {
        clergyControls.hidden = true;
      }
      settleControls.hidden = true;
      setStatus(`Hex selected.`);
      return;
    }

    if (game.phase === "construction") {
      game.selection = { type: "hex", r, c };
      updateHexUI(r, c);
      draw();
      setStatus("Select a construction action.");
      // Toggle clergy controls if owned and monastery exists
      if (cell.owner === "blue" && cell.monastery > 0) {
        clergyControls.hidden = false;
      } else {
        clergyControls.hidden = true;
      }
      return;
    }
  });

  endPhaseBtn.addEventListener("click", () => {
    if (game.phase === "movement") {
      game.phase = "construction";
      game.constructionUsed = false;
      setStatus("Construction phase: build/upgrade in one owned hex.");
    } else if (game.phase === "construction") {
      // Block manual phase change; endTurn handles
      setStatus("Use End Turn to proceed.");
    }
    updatePhaseUI();
    draw();
  });

  endTurnBtn.addEventListener("click", () => {
    if (game.phase !== "construction") return;
    // Resolve turn
    resolveTurn();
    // Show first turn report immediately (after resolving turn 1)
    if (game.turn === 1 && game.lastBlueTurnStats) {
      showReport(game.lastBlueTurnStats);
      game.skipNextReport = true; // avoid duplicate at next turn start
    }
    if (game.turn >= TURNS_TOTAL) {
      game.phase = "ended";
      setStatus("Game over. You survived if your realm still stands.");
      updatePhaseUI();
      draw();
      return;
    }
    // Next turn
    game.turn++;
    game.phase = "movement";
    resetCompaniesMovement();
    updatePhaseUI();
    updateRealmUI();
    draw();
    // Show Blue realm report starting on turn 2
    if (game.turn >= 2 && game.lastBlueTurnStats && !game.skipNextReport) {
      showReport(game.lastBlueTurnStats);
    }
    game.skipNextReport = false;
  });

  buildMonasteryBtn.addEventListener("click", () => {
    if (game.phase !== "construction" || game.constructionUsed) return;
    if (!game.selection || game.selection.type !== "hex") {
      setStatus("Select one of your hexes first.");
      return;
    }
    const { r, c } = game.selection;
    const cell = cells[r][c];
    if (cell.owner !== "blue") {
      setStatus("You can only build in your own hex.");
      return;
    }
    if (cell.monastery >= 3) {
      setStatus("Monastery is already at max level (3).");
      return;
    }
    const realm = teams.blue;
    if (realm.stockpile < MONASTERY_COST) {
      setStatus("Not enough bread to build/upgrade a monastery.");
      return;
    }
    cell.monastery += 1;
    realm.stockpile -= MONASTERY_COST;
    game.constructionUsed = true;
    setStatus(`Monastery is now level ${cell.monastery}.`);
    updateRealmUI();
    updateHexUI(r, c);
    draw();
  });

  upgradeInfraBtn.addEventListener("click", () => {
    if (game.phase !== "construction") return;
    if (!game.selection || game.selection.type !== "hex") {
      setStatus("Select one of your hexes first.");
      return;
    }
    const { r, c } = game.selection;
    const cell = cells[r][c];
    if (cell.owner !== "blue") {
      setStatus("You can only upgrade in your own hex.");
      return;
    }
    const realm = teams.blue;
    if (realm.stockpile < INFRA_COST) {
      setStatus("Not enough bread to upgrade agriculture.");
      return;
    }
    // Compute current effective cap and block if at max
    const currentCap = Math.min(500, cell.breadCapBase + cell.infraCap);
    if (currentCap >= 500) {
      setStatus("This hex has reached the maximum bread cap (500).");
      return;
    }
    // Increase by 100 but do not exceed 500 effective cap
    const maxInfraAllowed = Math.max(0, 500 - cell.breadCapBase);
    cell.infraCap = Math.min(maxInfraAllowed, cell.infraCap + INFRA_CAP_INC);
    realm.stockpile -= INFRA_COST;
    const newCap = Math.min(500, cell.breadCapBase + cell.infraCap);
    setStatus(`Agricultural capacity increased. Bread cap is now ${newCap}.`);
    updateRealmUI();
    updateHexUI(r, c);
    draw();
  });

  // Clergy assignment (staff lords into monastery capacity)
  assignClericsBtn.addEventListener("click", () => {
    if (!(game.phase === "movement" || game.phase === "construction")) {
      setStatus("Clergy can be assigned during Movement or Construction.");
      return;
    }
    if (!game.selection || game.selection.type !== "hex") {
      setStatus("Select a source hex you own.");
      return;
    }
    const { r, c } = game.selection;
    const cell = cells[r][c];
    if (cell.owner !== "blue") {
      setStatus("You can only send lords from your own hexes.");
      return;
    }
    const requested = Math.max(0, Math.floor(Number(clericAssignCountInput.value || 0)));
    if (requested <= 0) {
      setStatus("Enter how many lords to send.");
      return;
    }
    // Prepare pending transfer; target will be chosen on next click
    game.pendingClergyTransfer = { fromR: r, fromC: c, count: requested };
    setStatus("Choose a destination monastery hex.");
  });

  createCompanyBtn.addEventListener("click", () => {
    if (game.phase !== "movement") return;
    if (!game.selection || game.selection.type !== "hex") return;
    const { r, c } = game.selection;
    const cell = cells[r][c];
    if (cell.owner !== "blue") {
      setStatus("Select one of your hexes to create a company.");
      return;
    }
    if (cell.lords <= 1) {
      setStatus("Cannot create a company from a hex with only one lord.");
      return;
    }
    const freeLords = Math.max(0, cell.lords - cell.lordsSpent);
    const freePeasants = Math.max(0, cell.peasants - cell.peasantsSpent);
    const lords = Math.max(0, Math.floor(Number(inputCompanyLords.value || 0)));
    const peasants = Math.max(0, Math.floor(Number(inputCompanyPeasants.value || 0)));
    if (lords < 1 || peasants < 1) {
      setStatus("Company must include at least 1 lord and 1 peasant.");
      return;
    }
    if (lords > freeLords || peasants > freePeasants) {
      setStatus("Not enough population in this hex.");
      return;
    }
    // Enforce lords/peasants <= 1/20  => peasants >= 20*lords
    if (peasants < 20 * lords) {
      setStatus("Ratio violated: need at least 20 peasants per lord.");
      return;
    }
    // Ensure remaining hex keeps at least one lord
    const remLords = cell.lords - lords;
    const remPeasants = cell.peasants - peasants;
    if (remLords < 1) {
      setStatus("At least one lord must remain to rule the hex.");
      return;
    }
    // Ensure remaining hex lords/peasants <= 1/20 (if peasants exist)
    if (remPeasants < 20 * remLords) {
      setStatus("Hex would exceed 1:20 lords-to-peasants ratio after creating company.");
      return;
    }
    const realm = teams.blue;
    const co = {
      id: realm.nextCompanyId++,
      r, c,
      lords,
      peasants,
      moved: false,
    };
    realm.companies.push(co);
    cell.lords -= lords;
    cell.peasants -= peasants;
    setStatus("Company created.");
    updateHexUI(r, c);
    updateRealmUI();
    draw();
  });

  // Keep peasants input aligned to 1:20 when lords input changes
  inputCompanyLords.addEventListener("input", () => {
    const lords = Math.max(1, Math.floor(Number(inputCompanyLords.value || 1)));
    const minPeasants = 20 * lords;
    const currentPeasants = Math.max(0, Math.floor(Number(inputCompanyPeasants.value || 0)));
    if (currentPeasants < minPeasants) {
      inputCompanyPeasants.value = String(minPeasants);
    }
  });

  settleBtn.addEventListener("click", () => {
    if (!game.selection || game.selection.type !== "company") return;
    const { team, id } = game.selection;
    const realm = teams[team];
    const co = realm.companies.find(x => x.id === id);
    if (!co) return;
    const { r, c } = co;
    if (!canSettleHere(realm, co, r, c)) {
      setStatus("Cannot settle here.");
      return;
    }
    // Claim hex
    const cell = cells[r][c];
    // If settling on enemy hex (no opposing company present), replace old population:
    if (cell.owner && cell.owner !== team) {
      const oldOwner = cell.owner;
      const oldPeasants = cell.peasants;
      const toVagabonds = Math.floor(oldPeasants / 4);
      teams[oldOwner].vagabonds += toVagabonds;
      // Clear old population and clergy
      cell.lords = 0;
      cell.peasants = 0;
      cell.lordsSpent = 0;
      cell.peasantsSpent = 0;
      cell.clerics = 0;
    }
    cell.owner = team;
    cell.lords += co.lords;
    cell.peasants += co.peasants;
    // Settled population becomes spent (cannot be rallied later)
    cell.lordsSpent += co.lords;
    cell.peasantsSpent += co.peasants;
    // Update realm stockpile cap on next recompute
    // Disband company
    realm.companies = realm.companies.filter(x => x.id !== id);
    game.selection = { type: "hex", r, c };
    setStatus("Settled new hex.");
    recomputeAllStockpileCaps();
    updateRealmUI();
    updateHexUI(r, c);
    draw();
  });

  function canSettleHere(realm, co, r, c) {
    const cell = cells[r][c];
    // Can settle on enemy territory only if there is no opponent company in that hex
    if (cell.owner && cell.owner !== realm.key) {
      const occupier = companyAt(r, c);
      if (occupier && occupier.team !== realm.key) return false;
      return true;
    }
    // Allow settling on own already-settled hexes
    if (cell.owner === realm.key) return true;
    // Neutral: only if adjacent to at least one owned hex (must border realm)
    if (!cell.owner) {
      const adj = neighbors(r, c);
      for (const n of adj) {
        if (cells[n.r][n.c].owner === realm.key) return true;
      }
      return false;
    }
    return false;
  }

  function recomputeAllStockpileCaps() {
    for (const k of TEAM_KEYS) {
      teams[k].stockpileCap = computeStockpileCap(k);
      if (teams[k].stockpile > teams[k].stockpileCap) {
        teams[k].stockpile = teams[k].stockpileCap;
      }
    }
  }

  function resetCompaniesMovement() {
    for (const k of TEAM_KEYS) {
      for (const co of teams[k].companies) {
        co.moved = false;
      }
    }
  }

  // ---------- Starting placement ----------
  function choosePlayerStart(r, c) {
    const cell = cells[r][c];
    if (cell.owner) {
      setStatus("That hex is already taken.");
      return;
    }
    // Player start
    cell.owner = "blue";
    cell.lords = START_LORDS;
    cell.peasants = START_PEASANTS;
    // AI place
    const taken = [{ r, c }];
    placeAIStart("red", taken);
    placeAIStart("green", taken);

    // Setup stockpile caps
    recomputeAllStockpileCaps();
    updateRealmUI();
    updateHexUI(r, c);
    game.startingDone = true;
    game.phase = "movement";
    updatePhaseUI();
    draw();
    setStatus("Movement phase: create companies, move, and settle new hexes.");
  }

  function placeAIStart(teamKey, taken) {
    // Pick random hex at distance > 5 from all taken
    let tries = 0;
    while (tries < 10000) {
      const rr = randInt(0, GRID_ROWS - 1);
      const cc = randInt(0, GRID_COLS - 1);
      if (cells[rr][cc].owner) {
        tries++;
        continue;
      }
      let ok = true;
      for (const t of taken) {
        if (hexDistance(rr, cc, t.r, t.c) <= 5) {
          ok = false;
          break;
        }
      }
      if (ok) {
        cells[rr][cc].owner = teamKey;
        cells[rr][cc].lords = START_LORDS;
        cells[rr][cc].peasants = START_PEASANTS;
        taken.push({ r: rr, c: cc });
        return;
      }
      tries++;
    }
    // Fallback: any free hex
    for (let rr = 0; rr < GRID_ROWS; rr++) {
      for (let cc = 0; cc < GRID_COLS; cc++) {
        if (!cells[rr][cc].owner) {
          cells[rr][cc].owner = teamKey;
          cells[rr][cc].lords = START_LORDS;
          cells[rr][cc].peasants = START_PEASANTS;
          taken.push({ r: rr, c: cc });
          return;
        }
      }
    }
  }

  // ---------- Turn Resolution ----------
  function resolveTurn() {
    // AI acts in movement + construction phases in a simple way before resolution
    runAIMovement();
    runAIConstruction();

    // Production -> Feeding -> Reproduction -> Events
    const blueStats = { produced: 0, starvationDeaths: 0, plagueDeaths: 0, warDeaths: 0, stolen: 0 };
    for (const k of TEAM_KEYS) {
      const realm = teams[k];
      // Production
      const produced = produceBread(realm.key, k === "blue" ? blueStats : null);
      realm.stockpile = Math.min(realm.stockpile + produced, computeStockpileCap(realm.key));
      if (k === "blue") blueStats.produced = produced;
      // Feeding
      const feedRes = feedRealm(realm, produced);
      // Local famine per hex if stockpile ran dry
      if (feedRes.stockpileZero) {
        const starved = applyLocalFamine(realm);
        if (k === "blue") blueStats.starvationDeaths += starved;
      }
      // Plague effect if active
      if (realm.plagueTurns > 0) {
        const died = applyPlague(realm);
        if (k === "blue") blueStats.plagueDeaths += died;
        realm.plagueTurns--;
      }
      // Rebels may spawn after shortages alter ratios
      formRebelsIfAny(realm);
    }
    // Rebels move one hex
    moveRebels();
    // Merge stacks and age out rebels
    ageAndMergeRebels();
    // Reproduction happens after feeding and plague, on settled hexes (not companies).
    for (const k of TEAM_KEYS) {
      reproduceOnHexes(k);
    }
    // Check plague trigger conditions
    for (const k of TEAM_KEYS) {
      const realm = teams[k];
      const totals = countRealmPopulation(k);
      if (totals.peasants > 0 && realm.vagabonds > totals.peasants / 3 && realm.plagueTurns <= 0) {
        realm.plagueTurns = randInt(2, 4);
      }
    }
    // Process rebel occupation (unsettle hexes after 2 turns of rebel occupation)
    processRebelOccupation();
    // Reset construction usage
    game.constructionUsed = false;
    // Recompute caps
    recomputeAllStockpileCaps();
    updateRealmUI();
    setStatus("Turn resolved.");
    // Include war deaths from this turn's battles
    blueStats.warDeaths = game.blueWarDeathsThisTurn;
    game.blueWarDeathsThisTurn = 0;
    // Save Blue stats for next turn report
    game.lastBlueTurnStats = blueStats;
  }

  function produceBread(teamKey, statsForBlue) {
    let total = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = cells[r][c];
        if (cell.owner !== teamKey) continue;
        // Companies' peasants do not produce; only settled hex peasants produce
        let capBefore = Math.min(500, cell.breadCapBase + cell.infraCap);
        let cap = capBefore;
        // Rebel presence halves potential production
        if (rebels.some(rb => rb.r === r && rb.c === c)) {
          cap = Math.floor(cap / 2);
        }
        const producedBefore = Math.min(cell.peasants, capBefore);
        const produced = Math.min(cell.peasants, cap);
        if (teamKey === "blue" && statsForBlue) {
          const stolen = Math.max(0, producedBefore - produced);
          statsForBlue.stolen += stolen;
        }
        total += produced;
      }
    }
    return total;
  }

  function feedRealm(realm, producedThisTurn) {
    const totals = countRealmPopulation(realm.key);
    const totalPeasants = totals.peasants;
    const breadNeeded = Math.ceil(totalPeasants / 2);
    if (realm.stockpile >= breadNeeded) {
      realm.stockpile -= breadNeeded;
      return { stockpileZero: false };
    }
    // Consume what's left, stockpile runs dry
    realm.stockpile = 0;
    return { stockpileZero: true };
  }

  function producedOnHex(r, c) {
    const cell = cells[r][c];
    if (!cell.owner) return 0;
    let cap = Math.min(500, cell.breadCapBase + cell.infraCap);
    if (rebels.some(rb => rb.r === r && rb.c === c)) {
      cap = Math.floor(cap / 2);
    }
    return Math.min(cell.peasants, cap);
  }

  function applyLocalFamine(realm) {
    let totalDeaths = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = cells[r][c];
        if (cell.owner !== realm.key) continue;
        const produced = producedOnHex(r, c);
        const threshold = 2 * produced;
        if (cell.peasants > threshold) {
          const excess = cell.peasants - threshold;
          const deaths = Math.ceil(excess / 2);
          const toVagabonds = excess - deaths;
          cell.peasants -= (deaths + toVagabonds);
          realm.vagabonds += toVagabonds;
          totalDeaths += deaths;
        }
      }
    }
    return totalDeaths;
  }

  function removePeasantsFromRealm(teamKey, count) {
    // Remove from hexes first, then companies
    let remaining = count;
    for (let r = 0; r < GRID_ROWS && remaining > 0; r++) {
      for (let c = 0; c < GRID_COLS && remaining > 0; c++) {
        const cell = cells[r][c];
        if (cell.owner !== teamKey) continue;
        const take = Math.min(cell.peasants, remaining);
        cell.peasants -= take;
        remaining -= take;
      }
    }
    if (remaining > 0) {
      const realm = teams[teamKey];
      for (const co of realm.companies) {
        if (remaining <= 0) break;
        const take = Math.min(co.peasants, remaining);
        co.peasants -= take;
        remaining -= take;
      }
    }
  }

  function applyPlague(realm) {
    const totals = countRealmPopulation(realm.key);
    const toDie = Math.floor(totals.peasants * 0.2);
    if (toDie > 0) {
      removePeasantsFromRealm(realm.key, toDie);
    }
    return toDie;
  }

  function reproduceOnHexes(teamKey) {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = cells[r][c];
        if (cell.owner !== teamKey) continue;
        // Lords x1.5 (ceil), Peasants x2 (ceil)
        if (cell.lords > 0) cell.lords = Math.ceil(cell.lords * 1.5);
        if (cell.peasants > 0) cell.peasants = Math.ceil(cell.peasants * 2);
        // Spent baseline also grows with reproduction? No: spent represents locked settlers.
        // Keep spent values capped at totals.
        cell.lordsSpent = Math.min(cell.lordsSpent, cell.lords);
        cell.peasantsSpent = Math.min(cell.peasantsSpent, cell.peasants);
      }
    }
  }

  // ---------- Simple AI ----------
  function runAIMovement() {
    for (const k of ["red", "green"]) {
      const realm = teams[k];
      // Create more companies and prioritize frontier hexes
      const owned = allOwnedHexes(k);
      let candidates = owned.filter(pos => {
        const cell = cells[pos.r][pos.c];
        return cell.lords >= 2 && cell.peasants >= 20; // keep at least 1 lord behind
      });
      // Bring frontier (adjacent to neutral) to the front, then sort by peasants desc
      candidates = candidates.sort((a, b) => {
        const aFrontier = neighbors(a.r, a.c).some(n => !cells[n.r][n.c].owner);
        const bFrontier = neighbors(b.r, b.c).some(n => !cells[n.r][n.c].owner);
        if (aFrontier !== bFrontier) return aFrontier ? -1 : 1;
        const ap = cells[a.r][a.c].peasants;
        const bp = cells[b.r][b.c].peasants;
        return bp - ap;
      });
      const toCreate = Math.min(5, candidates.length);
      for (let i = 0; i < toCreate; i++) {
        const from = candidates[i];
        const cell = cells[from.r][from.c];
        // maintain 1:20 ratio and leave 1 lord
        if (cell.lords >= 2 && cell.peasants >= 20) {
          realm.companies.push({
            id: realm.nextCompanyId++,
            r: from.r, c: from.c,
            lords: 1,
            peasants: 20,
            moved: false,
          });
          cell.lords -= 1;
          cell.peasants -= 20;
        }
      }
      // Move each company towards nearest neutral hex (or attack enemies/rebels)
      for (const co of [...realm.companies]) {
        if (co.moved) continue;
        const target = findNearestNeutral(co.r, co.c);
        if (!target) continue;
        const insideRealm = cells[co.r][co.c].owner === k && cells[target.r][target.c].owner === k;
        if (insideRealm) {
          // teleport within realm (single move)
          const occ = companyAt(target.r, target.c);
          if (!occ || occ.team === k) {
            co.r = target.r;
            co.c = target.c;
            co.moved = true;
          }
        } else {
          // step one towards target
          const step = stepTowards(co.r, co.c, target.r, target.c);
          if (step) {
            // Check for rebels - move there and destroy them
            const rb = rebelAt(step.r, step.c);
            if (rb) {
              for (let i = rebels.length - 1; i >= 0; i--) {
                if (rebels[i].r === step.r && rebels[i].c === step.c) rebels.splice(i, 1);
              }
              co.r = step.r;
              co.c = step.c;
              co.moved = true;
              continue;
            }
            // Check for enemy company - fight!
            const occ = companyAt(step.r, step.c);
            if (occ && occ.team !== k) {
              const defender = occ.company;
              if (co.peasants > defender.peasants) {
                // AI wins: destroy defender, move there
                teams[occ.team].companies = teams[occ.team].companies.filter(x => x.id !== defender.id);
                co.r = step.r;
                co.c = step.c;
                co.moved = true;
              } else if (co.peasants < defender.peasants) {
                // AI loses: destroy attacker
                realm.companies = realm.companies.filter(x => x.id !== co.id);
              } else {
                // Equal: both destroyed
                teams[occ.team].companies = teams[occ.team].companies.filter(x => x.id !== defender.id);
                realm.companies = realm.companies.filter(x => x.id !== co.id);
              }
              continue;
            }
            // No obstacle - just move
            if (!occ) {
              co.r = step.r;
              co.c = step.c;
              co.moved = true;
            }
          }
        }
      }
      // Auto-settle if on neutral hex
      for (const co of [...realm.companies]) {
        const cell = cells[co.r][co.c];
        if (!cell.owner) {
          cell.owner = k;
          cell.lords += co.lords;
          cell.peasants += co.peasants;
          realm.companies = realm.companies.filter(x => x.id !== co.id);
        }
      }
    }
  }

  function runAIConstruction() {
    for (const k of ["red", "green"]) {
      const realm = teams[k];
      // Prefer infra if affordable, otherwise monastery
      const owned = allOwnedHexes(k);
      if (owned.length === 0) continue;
      const choice = owned[randInt(0, owned.length - 1)];
      const cell = cells[choice.r][choice.c];
      if (realm.stockpile >= INFRA_COST) {
        cell.infraCap += INFRA_CAP_INC;
        realm.stockpile -= INFRA_COST;
      } else if (realm.stockpile >= MONASTERY_COST) {
        cell.monastery += 1;
        realm.stockpile -= MONASTERY_COST;
      }
    }
  }

  function allOwnedHexes(teamKey) {
    const out = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (cells[r][c].owner === teamKey) out.push({ r, c });
      }
    }
    return out;
  }

  function findNearestNeutral(sr, sc) {
    let best = null, bestDist = Infinity;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (cells[r][c].owner) continue;
        const d = hexDistance(sr, sc, r, c);
        if (d < bestDist) {
          bestDist = d;
          best = { r, c };
        }
      }
    }
    return best;
  }

  function stepTowards(sr, sc, tr, tc) {
    // Choose adjacent that reduces distance
    const nbrs = neighbors(sr, sc);
    let best = null, bestDist = hexDistance(sr, sc, tr, tc);
    for (const n of nbrs) {
      const d = hexDistance(n.r, n.c, tr, tc);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    return best;
  }
 
  // ---------- Presence lookups ----------
  function companyAt(r, c) {
    for (const k of TEAM_KEYS) {
      const found = teams[k].companies.find(co => co.r === r && co.c === c);
      if (found) return { team: k, company: found };
    }
    return null;
  }
  function anyCompanyAt(r, c) {
    return !!companyAt(r, c);
  }
  function rebelAt(r, c) {
    return rebels.find(rb => rb.r === r && rb.c === c) || null;
  }

  // ---------- Init ----------
  updatePhaseUI();
  updateRealmUI();
  updateHexUI(null, null);
  draw();
  // Turn report modal handlers
  function showReport(stats) {
    if (!reportModal) return;
    reportProduced.textContent = String(stats.produced);
    reportStarvation.textContent = String(stats.starvationDeaths);
    reportPlague.textContent = String(stats.plagueDeaths);
    reportWar.textContent = String(stats.warDeaths || 0);
    reportStolen.textContent = String(stats.stolen);
    reportModal.hidden = false;
  }
  if (reportCloseBtn && reportModal) {
    reportCloseBtn.addEventListener("click", () => {
      reportModal.hidden = true;
    });
    reportModal.addEventListener("click", (e) => {
      if (e.target === reportModal) reportModal.hidden = true;
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && reportModal && !reportModal.hidden) {
      reportModal.hidden = true;
    }
  });

  // ---------- Rebels ----------
  function formRebelsIfAny(realm) {
    // Collect all rebel spawn points first
    const spawns = [];
    for (const co of realm.companies) {
      const maxLordsAllowed = Math.floor(co.peasants / 20);
      if (co.lords > maxLordsAllowed) {
        const excess = co.lords - maxLordsAllowed;
        spawns.push({ r: co.r, c: co.c, type: "company", ref: co, excessLords: excess });
      }
    }
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = cells[r][c];
        if (cell.owner !== realm.key) continue;
        const maxLordsAllowed = Math.floor(cell.peasants / 20);
        if (cell.lords > maxLordsAllowed) {
          const excess = cell.lords - maxLordsAllowed;
          spawns.push({ r, c, type: "hex", ref: cell, excessLords: excess });
        }
      }
    }
    if (spawns.length === 0) return;
    // Distribute vagabonds roughly equally among all new rebel groups
    const totalV = realm.vagabonds;
    const baseShare = Math.floor(totalV / spawns.length);
    let remainder = totalV % spawns.length;
    for (let i = 0; i < spawns.length; i++) {
      const s = spawns[i];
      const peasantsShare = baseShare + (i < remainder ? 1 : 0);
      // Create rebel
      rebels.push({
        r: s.r,
        c: s.c,
        lords: s.excessLords,
        peasants: peasantsShare,
        moved: false,
        ttl: 4,
      });
      // Remove lords from source
      if (s.type === "company") {
        s.ref.lords -= s.excessLords;
      } else {
        s.ref.lords -= s.excessLords;
      }
    }
    realm.vagabonds = 0;
  }

  function moveRebels() {
    for (const rb of rebels) {
      if (rb.moved) continue;
      const nbrs = neighbors(rb.r, rb.c);
      const allowed = nbrs.filter(n => !anyCompanyAt(n.r, n.c));
      if (allowed.length > 0) {
        const step = allowed[randInt(0, allowed.length - 1)];
        rb.r = step.r;
        rb.c = step.c;
        rb.moved = true;
        // Reset occupation counter when rebel moves to a new hex
        rb.occupationTurns = 0;
      }
    }
    // reset moved for next turn
    for (const rb of rebels) rb.moved = false;
  }

  function ageAndMergeRebels() {
    // Age by 1 turn; drop expired
    const aged = [];
    for (const rb of rebels) {
      const ttl = (rb.ttl == null ? 4 : rb.ttl) - 1;
      if (ttl <= 0) continue;
      aged.push({ ...rb, ttl, moved: false });
    }
    // Merge by hex
    const key = (r, c) => `${r},${c}`;
    const map = new Map();
    for (const rb of aged) {
      const k = key(rb.r, rb.c);
      const existing = map.get(k);
      if (!existing) {
        map.set(k, { ...rb });
      } else {
        existing.lords += rb.lords;
        existing.peasants += rb.peasants;
        existing.ttl = Math.max(existing.ttl, rb.ttl);
      }
    }
    // Replace rebels array
    rebels.length = 0;
    for (const v of map.values()) {
      rebels.push(v);
    }
  }

  function processRebelOccupation() {
    // Track occupation duration and unsettle hexes after 2 turns
    const toRemove = [];
    for (const rb of rebels) {
      const cell = cells[rb.r][rb.c];
      // Only track occupation on owned hexes
      if (cell.owner) {
        // Initialize occupation counter if not present
        if (rb.occupationTurns == null) rb.occupationTurns = 0;
        rb.occupationTurns++;
        // After 2 turns of occupation, unsettle the hex
        if (rb.occupationTurns >= 2) {
          cell.owner = null;
          cell.lords = 0;
          cell.peasants = 0;
          cell.lordsSpent = 0;
          cell.peasantsSpent = 0;
          cell.clerics = 0;
          // Rebel disbands after unsettling
          toRemove.push(rb);
        }
      } else {
        // Reset occupation counter if not on owned hex
        rb.occupationTurns = 0;
      }
    }
    // Remove disbanded rebels
    for (const rb of toRemove) {
      const idx = rebels.indexOf(rb);
      if (idx >= 0) rebels.splice(idx, 1);
    }
  }
})();


