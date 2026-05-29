import { useState, useEffect, useRef } from "react";

const ROLES = [
  { id: "detective", name: "Detective", icon: "🔍", desc: "Uncovers clues faster. +2 investigation.", hp: 90, sanity: 80, skill: "Investigate" },
  { id: "occultist", name: "Occultist", icon: "🕯️", desc: "Resists supernatural. +2 sanity saves.", hp: 75, sanity: 100, skill: "Ritual Ward" },
  { id: "medic", name: "Medic", icon: "💉", desc: "Heals party members. +2 healing.", hp: 85, sanity: 85, skill: "First Aid" },
  { id: "thief", name: "Thief", icon: "🗝️", desc: "Opens locked areas. +2 stealth.", hp: 80, sanity: 75, skill: "Pick Lock" },
];

const LOCATIONS = [
  "The Abandoned Asylum", "Blackwood Manor", "The Fog-Shrouded Isle", "The Cursed Cathedral"
];

const COLOR = {
  bg: "#0d0d1a", card: "#13131f", border: "#2a1a3a", accent: "#7c3aed",
  accent2: "#a855f7", text: "#e2d9f3", muted: "#8b7aa8", danger: "#ef4444",
  success: "#22c55e", warn: "#f59e0b", gold: "#fbbf24"
};

const S = {
  app: { minHeight: "100vh", background: COLOR.bg, color: COLOR.text, fontFamily: "'Georgia', serif", padding: "0" },
  card: { background: COLOR.card, border: `1px solid ${COLOR.border}`, borderRadius: 12, padding: "1rem" },
  btn: (variant = "primary") => ({
    background: variant === "primary" ? COLOR.accent : variant === "danger" ? "#7f1d1d" : "#1e1b2e",
    color: COLOR.text, border: `1px solid ${variant === "primary" ? COLOR.accent2 : COLOR.border}`,
    borderRadius: 8, padding: "0.55rem 1.1rem", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
    transition: "all 0.15s", letterSpacing: "0.03em"
  }),
  tag: (c) => ({ background: c + "22", color: c, border: `1px solid ${c}55`, borderRadius: 20, padding: "2px 10px", fontSize: 12 }),
  bar: (val, max, c) => ({
    height: 7, borderRadius: 4, background: "#1e1b2e", overflow: "hidden",
    "& > div": { width: `${(val / max) * 100}%`, background: c, height: "100%", borderRadius: 4, transition: "width 0.4s" }
  }),
  input: { background: "#0d0d1a", border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "0.55rem 0.9rem", color: COLOR.text, fontFamily: "inherit", fontSize: 13, width: "100%", boxSizing: "border-box" }
};

function Bar({ val, max, color }) {
  return (
    <div style={{ height: 7, borderRadius: 4, background: "#1e1b2e", overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, (val / max) * 100)}%`, background: color, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
    </div>
  );
}

function PlayerCard({ player, isCurrent }) {
  return (
    <div style={{ ...S.card, border: `1px solid ${isCurrent ? COLOR.accent2 : COLOR.border}`, opacity: player.hp <= 0 ? 0.5 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: "bold", color: isCurrent ? COLOR.accent2 : COLOR.text }}>{player.icon} {player.name}</span>
        <span style={S.tag(COLOR.accent)}>{player.role}</span>
      </div>
      <div style={{ fontSize: 11, color: COLOR.muted, marginBottom: 4 }}>HP {player.hp}/{player.maxHp}</div>
      <Bar val={player.hp} max={player.maxHp} color={COLOR.danger} />
      <div style={{ fontSize: 11, color: COLOR.muted, marginTop: 6, marginBottom: 4 }}>Sanity {player.sanity}/{player.maxSanity}</div>
      <Bar val={player.sanity} max={player.maxSanity} color={COLOR.accent} />
      {player.inventory?.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: COLOR.muted }}>
          <span style={{ color: COLOR.gold }}>Items: </span>{player.inventory.join(", ")}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400);
    return () => clearInterval(t);
  }, []);
  return <span style={{ color: COLOR.muted }}>{dots}</span>;
}

export default function App() {
  const [phase, setPhase] = useState("lobby"); // lobby | setup | game | dead | win
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [players, setPlayers] = useState([]);
  const [myIdx, setMyIdx] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [story, setStory] = useState([]);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [turn, setTurn] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [log, setLog] = useState([]);
  const [copyMsg, setCopyMsg] = useState("");
  const storyRef = useRef(null);
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [roleConfirmed, setRoleConfirmed] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState(false);

  useEffect(() => {
    if (storyRef.current) storyRef.current.scrollTop = storyRef.current.scrollHeight;
  }, [story, loading]);

  function genCode() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  function createRoom() {
    if (!hostName.trim()) return;
    const code = genCode();
    setRoomCode(code);
    setIsHost(true);
    setPendingPlayers([{ name: hostName.trim(), isHost: true }]);
    setPhase("setup");
  }

  function joinRoom() {
    if (!joinCode.trim() || !joinName.trim()) return;
    setRoomCode(joinCode.trim().toUpperCase());
    setIsHost(false);
    setJoinedRoom(true);
    setPendingPlayers(p => [...p, { name: joinName.trim(), isHost: false }]);
    setPhase("setup");
  }

  function copyCode() {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopyMsg("Copied!");
    setTimeout(() => setCopyMsg(""), 1800);
  }

  function confirmRole() {
    if (!selectedRole) return;
    const role = ROLES.find(r => r.id === selectedRole);
    const name = isHost ? hostName : joinName;
    const player = {
      name, role: role.name, icon: role.icon, skill: role.skill,
      hp: role.hp, maxHp: role.hp, sanity: role.sanity, maxSanity: role.sanity,
      inventory: [], id: Date.now()
    };
    const updatedPending = pendingPlayers.map((p, i) => {
      if ((isHost && p.isHost) || (!isHost && !p.isHost && p.name === name)) return { ...p, roleConfirmed: true, roleData: player };
      return p;
    });
    setPendingPlayers(updatedPending);
    setRoleConfirmed(true);
    const myPlayer = player;
    setMyIdx(isHost ? 0 : pendingPlayers.length - 1);
    setPlayers(prev => [...prev, myPlayer]);
  }

  function startGame() {
    if (players.length === 0) return;
    setPhase("game");
    setTurn(0);
    setChapter(1);
    generateOpening();
  }

  async function callClaude(prompt, systemPrompt) {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await resp.json();
    return data.content?.map(b => b.text || "").join("") || "";
  }

  async function generateOpening() {
    setLoading(true);
    const names = players.map(p => `${p.name} (${p.role})`).join(", ");
    const sys = `You are the narrator of a horror mystery RPG. Write atmospheric, short, gripping horror fiction. Always respond in JSON: {"story":"2-3 sentence narrative paragraph","choices":["choice 1","choice 2","choice 3"],"event":"brief event label"}. Choices must be specific actions. Make it tense and immersive.`;
    const prompt = `Setting: ${location}. Players: ${names}. Chapter 1 opening. Set the scene, describe arriving at the location at night. Give 3 choices for what the group does first.`;
    try {
      const raw = await callClaude(prompt, sys);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setStory([{ text: parsed.story, type: "narration", chapter: 1 }]);
      setChoices(parsed.choices);
      setLog([`📖 Chapter 1 begins at ${location}`]);
    } catch (e) {
      setStory([{ text: `The group arrives at ${location}. A cold wind howls as the gates creak open. Shadows move where they shouldn't...`, type: "narration", chapter: 1 }]);
      setChoices(["Search the entrance", "Look for another way in", "Call out into the darkness"]);
    }
    setLoading(false);
  }

  async function makeChoice(choice) {
    if (loading) return;
    const currentPlayer = players[turn % players.length];
    setStory(s => [...s, { text: `→ ${currentPlayer.name} chooses: "${choice}"`, type: "choice", player: currentPlayer.name }]);
    setChoices([]);
    setLoading(true);

    const context = story.slice(-3).map(s => s.text).join(" ");
    const stateDesc = players.map(p => `${p.name}(${p.role}, HP:${p.hp}/${p.maxHp}, Sanity:${p.sanity}/${p.maxSanity}, Items:[${p.inventory.join(",")}])`).join("; ");
    const sys = `You are the narrator of a horror mystery RPG. Respond in JSON: {"story":"2-3 sentence continuation","choices":["choice 1","choice 2","choice 3"],"hpChange":{"${currentPlayer.name}": -number or 0},"sanityChange":{"${currentPlayer.name}": -number or 0},"itemFound":"item name or null","event":"brief label","isEnding":false,"endingType":"survive|die|null","clue":"clue text or null"}. Be specific and scary. HP/sanity changes should be 0 or negative (5-20). Item found is optional.`;
    const prompt = `Chapter ${chapter}. Context: ${context}. Party state: ${stateDesc}. Action taken: "${choice}" by ${currentPlayer.name} (${currentPlayer.role}). Continue the story. Make consequences feel real. After 8+ turns, consider an ending. Current turn: ${Math.floor(turn / players.length) + 1}.`;

    try {
      const raw = await callClaude(prompt, sys);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setStory(s => [...s, { text: parsed.story, type: "narration", chapter }]);
      if (parsed.clue) setStory(s => [...s, { text: `🔍 Clue discovered: ${parsed.clue}`, type: "clue" }]);
      if (parsed.itemFound) {
        setStory(s => [...s, { text: `✨ ${currentPlayer.name} found: ${parsed.itemFound}!`, type: "item" }]);
        setPlayers(prev => prev.map(p => p.name === currentPlayer.name ? { ...p, inventory: [...p.inventory, parsed.itemFound] } : p));
        setLog(l => [...l, `🎒 ${currentPlayer.name} found ${parsed.itemFound}`]);
      }

      setPlayers(prev => prev.map(p => {
        let hp = p.hp + (parsed.hpChange?.[p.name] || 0);
        let san = p.sanity + (parsed.sanityChange?.[p.name] || 0);
        hp = Math.max(0, Math.min(p.maxHp, hp));
        san = Math.max(0, Math.min(p.maxSanity, san));
        return { ...p, hp, sanity: san };
      }));

      setLog(l => [...l, `⚡ ${parsed.event || "Something happened..."}`]);

      if (parsed.isEnding) {
        setChoices([]);
        setLoading(false);
        setTimeout(() => setPhase(parsed.endingType === "survive" ? "win" : "dead"), 1800);
        return;
      }

      const nextTurn = turn + 1;
      setTurn(nextTurn);
      if (nextTurn % (players.length * 2) === 0) setChapter(c => c + 1);
      setChoices(parsed.choices || ["Press forward", "Retreat", "Examine surroundings"]);
    } catch (e) {
      setStory(s => [...s, { text: "The darkness thickens. Something stirs nearby...", type: "narration" }]);
      setChoices(["Fight back", "Run!", "Hide and wait"]);
      setTurn(t => t + 1);
    }
    setLoading(false);
  }

  async function useSkill() {
    if (loading) return;
    const p = players[turn % players.length];
    const choice = `${p.name} uses their special skill: ${p.skill}!`;
    await makeChoice(choice);
  }

  const currentPlayer = players.length > 0 ? players[turn % players.length] : null;
  const allDead = players.length > 0 && players.every(p => p.hp <= 0);

  // LOBBY SCREEN
  if (phase === "lobby") return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🕯️</div>
        <h1 style={{ color: COLOR.accent2, margin: 0, fontSize: 22, letterSpacing: "0.08em", fontWeight: "bold" }}>NOKIELEN</h1>
        <p style={{ color: COLOR.muted, fontSize: 13, margin: "4px 0 0" }}>Horror Mystery RPG — Up to 4 Players</p>
      </div>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ ...S.card, marginBottom: "1rem" }}>
          <p style={{ color: COLOR.accent2, fontSize: 13, fontWeight: "bold", marginBottom: 10, marginTop: 0 }}>🏠 Create a Room</p>
          <input style={{ ...S.input, marginBottom: 8 }} placeholder="Your name" value={hostName} onChange={e => setHostName(e.target.value)} />
          <button style={{ ...S.btn("primary"), width: "100%" }} onClick={createRoom}>Create & Host</button>
        </div>
        <div style={{ ...S.card }}>
          <p style={{ color: COLOR.accent2, fontSize: 13, fontWeight: "bold", marginBottom: 10, marginTop: 0 }}>🔗 Join a Room</p>
          <input style={{ ...S.input, marginBottom: 8 }} placeholder="Your name" value={joinName} onChange={e => setJoinName(e.target.value)} />
          <input style={{ ...S.input, marginBottom: 8, textTransform: "uppercase" }} placeholder="Room code (e.g. AB12C)" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} />
          <button style={{ ...S.btn("secondary"), width: "100%" }} onClick={joinRoom}>Join Room</button>
        </div>
      </div>
      <p style={{ color: COLOR.muted, fontSize: 11, marginTop: "1.5rem", textAlign: "center" }}>Share your room code with up to 3 friends to play together</p>
    </div>
  );

  // SETUP SCREEN
  if (phase === "setup") return (
    <div style={{ ...S.app, padding: "1rem", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
        <span style={{ fontSize: 28 }}>🕯️</span>
        <h2 style={{ color: COLOR.accent2, margin: "4px 0 0", fontSize: 18 }}>Room: {roomCode}</h2>
        {isHost && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: COLOR.muted }}>Share code with friends:</span>
            <button style={{ ...S.btn("secondary"), fontSize: 11, padding: "3px 10px" }} onClick={copyCode}>
              {copyMsg || "Copy Code"}
            </button>
          </div>
        )}
      </div>

      {isHost && (
        <div style={{ ...S.card, marginBottom: "1rem" }}>
          <p style={{ color: COLOR.muted, fontSize: 12, margin: "0 0 8px" }}>Choose location:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {LOCATIONS.map(l => (
              <button key={l} style={{ ...S.btn(l === location ? "primary" : "secondary"), textAlign: "left", fontSize: 12 }} onClick={() => setLocation(l)}>
                {l === location ? "✓ " : ""}{l}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isHost && (
        <div style={{ ...S.card, marginBottom: "1rem" }}>
          <p style={{ color: COLOR.muted, fontSize: 13, margin: 0, textAlign: "center" }}>
            Waiting for host to configure the game...<br />
            <span style={{ color: COLOR.accent2, fontSize: 12 }}>Location: {location}</span>
          </p>
        </div>
      )}

      {!roleConfirmed ? (
        <div style={{ ...S.card, marginBottom: "1rem" }}>
          <p style={{ color: COLOR.accent2, fontSize: 13, fontWeight: "bold", margin: "0 0 10px" }}>Choose your role:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ROLES.map(r => (
              <div key={r.id} onClick={() => setSelectedRole(r.id)} style={{
                ...S.card, cursor: "pointer", border: `1px solid ${selectedRole === r.id ? COLOR.accent2 : COLOR.border}`,
                background: selectedRole === r.id ? "#1e1533" : COLOR.card, transition: "all 0.15s"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: 14, color: selectedRole === r.id ? COLOR.accent2 : COLOR.text }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: COLOR.muted }}>{r.desc}</div>
                    <div style={{ fontSize: 11, color: COLOR.muted, marginTop: 2 }}>
                      <span style={S.tag(COLOR.danger)}>HP {r.hp}</span>{" "}
                      <span style={S.tag(COLOR.accent)}>Sanity {r.sanity}</span>{" "}
                      <span style={S.tag(COLOR.gold)}>Skill: {r.skill}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button style={{ ...S.btn("primary"), width: "100%", marginTop: 12 }} onClick={confirmRole} disabled={!selectedRole}>
            Confirm Role
          </button>
        </div>
      ) : (
        <div style={{ ...S.card, marginBottom: "1rem", border: `1px solid ${COLOR.success}44` }}>
          <p style={{ color: COLOR.success, fontSize: 13, textAlign: "center", margin: 0 }}>
            ✓ Role confirmed! Waiting for {isHost ? "you to start the game" : "host to start the game..."}
          </p>
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span>{p.icon}</span>
              <span style={{ fontSize: 13, color: COLOR.text }}>{p.name}</span>
              <span style={S.tag(COLOR.accent)}>{p.role}</span>
            </div>
          ))}
        </div>
      )}

      {isHost && roleConfirmed && (
        <button style={{ ...S.btn("primary"), width: "100%", fontSize: 15, padding: "0.75rem" }} onClick={startGame}>
          ⚔️ Start Adventure ({players.length} player{players.length > 1 ? "s" : ""})
        </button>
      )}
    </div>
  );

  // ENDING SCREENS
  if (phase === "dead" || allDead) return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 12 }}>💀</div>
      <h2 style={{ color: COLOR.danger, fontSize: 24, margin: "0 0 8px" }}>The Darkness Wins</h2>
      <p style={{ color: COLOR.muted, fontSize: 14, maxWidth: 300 }}>
        The party has fallen. {location} claims more souls...
      </p>
      <button style={{ ...S.btn("primary"), marginTop: "1.5rem", fontSize: 14 }} onClick={() => { setPhase("lobby"); setPlayers([]); setStory([]); setChoices([]); setTurn(0); setRoleConfirmed(false); }}>
        Play Again
      </button>
    </div>
  );

  if (phase === "win") return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 12 }}>🌟</div>
      <h2 style={{ color: COLOR.gold, fontSize: 24, margin: "0 0 8px" }}>You Survived!</h2>
      <p style={{ color: COLOR.muted, fontSize: 14, maxWidth: 300 }}>
        The mystery of {location} has been unravelled. The party lives to tell the tale...
      </p>
      <button style={{ ...S.btn("primary"), marginTop: "1.5rem", fontSize: 14 }} onClick={() => { setPhase("lobby"); setPlayers([]); setStory([]); setChoices([]); setTurn(0); setRoleConfirmed(false); }}>
        Play Again
      </button>
    </div>
  );

  // MAIN GAME
  return (
    <div style={{ ...S.app, maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#0a0a14", borderBottom: `1px solid ${COLOR.border}`, padding: "0.65rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ color: COLOR.accent2, fontWeight: "bold", fontSize: 14 }}>🕯️ {location}</span>
          <span style={{ color: COLOR.muted, fontSize: 11, marginLeft: 8 }}>Ch.{chapter}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: COLOR.muted }}>Room: {roomCode}</span>
          {currentPlayer && <span style={S.tag(COLOR.accent2)}>{currentPlayer.icon} {currentPlayer.name}'s turn</span>}
        </div>
      </div>

      {/* Players row */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(players.length, 2)}, 1fr)`, gap: 6, padding: "0.6rem 0.8rem 0" }}>
        {players.map((p, i) => <PlayerCard key={p.id} player={p} isCurrent={i === turn % players.length} />)}
      </div>

      {/* Story */}
      <div ref={storyRef} style={{ flex: 1, overflowY: "auto", padding: "0.8rem", display: "flex", flexDirection: "column", gap: 8, minHeight: 180, maxHeight: 320 }}>
        {story.map((s, i) => (
          <div key={i} style={{
            background: s.type === "choice" ? "#1a1225" : s.type === "clue" ? "#1a2010" : s.type === "item" ? "#1a1a10" : COLOR.card,
            border: `1px solid ${s.type === "clue" ? "#22c55e33" : s.type === "item" ? "#fbbf2433" : COLOR.border}`,
            borderRadius: 8, padding: "0.6rem 0.8rem",
            color: s.type === "choice" ? COLOR.muted : s.type === "clue" ? COLOR.success : s.type === "item" ? COLOR.gold : COLOR.text,
            fontSize: s.type === "choice" ? 12 : 13, lineHeight: 1.65,
            borderLeft: s.type === "narration" ? `3px solid ${COLOR.accent}` : "none"
          }}>
            {s.chapter && s.type === "narration" && i === 0 && <div style={{ color: COLOR.accent2, fontSize: 11, marginBottom: 4 }}>— Chapter {s.chapter} —</div>}
            {s.text}
          </div>
        ))}
        {loading && (
          <div style={{ ...S.card, fontSize: 13, color: COLOR.muted, fontStyle: "italic" }}>
            The shadows whisper<Spinner />
          </div>
        )}
      </div>

      {/* Choices */}
      <div style={{ padding: "0.6rem 0.8rem", display: "flex", flexDirection: "column", gap: 7, borderTop: `1px solid ${COLOR.border}` }}>
        {!loading && choices.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: COLOR.muted, textAlign: "center" }}>
              {currentPlayer?.name}'s turn to decide:
            </div>
            {choices.map((c, i) => (
              <button key={i} style={{ ...S.btn("secondary"), textAlign: "left", fontSize: 12, lineHeight: 1.5, padding: "0.6rem 0.9rem" }} onClick={() => makeChoice(c)}>
                {["🔦", "🗡️", "👁️"][i] || "•"} {c}
              </button>
            ))}
            {currentPlayer && (
              <button style={{ ...S.btn("primary"), fontSize: 12, textAlign: "left" }} onClick={useSkill}>
                ⚡ Use Skill: {currentPlayer.skill} ({currentPlayer.name})
              </button>
            )}
          </>
        )}
        {loading && <div style={{ height: 36 }} />}
      </div>

      {/* Event Log */}
      {log.length > 0 && (
        <div style={{ borderTop: `1px solid ${COLOR.border}`, padding: "0.5rem 0.8rem", maxHeight: 70, overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: COLOR.muted, marginBottom: 3 }}>Event Log</div>
          {log.slice(-4).map((l, i) => (
            <div key={i} style={{ fontSize: 11, color: COLOR.muted, lineHeight: 1.5 }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
