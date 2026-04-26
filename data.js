// ═══════════════════════════════════════════════
//  IDEAFORGE — DATA ENGINE
// ═══════════════════════════════════════════════

const CATEGORIES = [
  {
    id: "action",
    label: "Action",
    emoji: "⚔️",
    color: "#ff4757",
    glow: "#ff475740",
    bg: "linear-gradient(135deg, #ff4757, #c0392b)",
  },
  {
    id: "simulation",
    label: "Simulation",
    emoji: "🏗️",
    color: "#2ed573",
    glow: "#2ed57340",
    bg: "linear-gradient(135deg, #2ed573, #009432)",
  },
  {
    id: "fun",
    label: "Fun",
    emoji: "🎉",
    color: "#ffa502",
    glow: "#ffa50240",
    bg: "linear-gradient(135deg, #ffa502, #e67e22)",
  },
  {
    id: "rpg",
    label: "RPG",
    emoji: "🧙",
    color: "#a855f7",
    glow: "#a855f740",
    bg: "linear-gradient(135deg, #a855f7, #7c3aed)",
  },
  {
    id: "survival",
    label: "Survie",
    emoji: "🏕️",
    color: "#26de81",
    glow: "#26de8140",
    bg: "linear-gradient(135deg, #26de81, #20bf6b)",
  },
  {
    id: "puzzle",
    label: "Puzzle",
    emoji: "🧩",
    color: "#45aaf2",
    glow: "#45aaf240",
    bg: "linear-gradient(135deg, #45aaf2, #2980b9)",
  },
  {
    id: "horror",
    label: "Horreur",
    emoji: "💀",
    color: "#778ca3",
    glow: "#778ca340",
    bg: "linear-gradient(135deg, #4b6584, #2d3436)",
  },
  {
    id: "strategy",
    label: "Stratégie",
    emoji: "♟️",
    color: "#fd9644",
    glow: "#fd964440",
    bg: "linear-gradient(135deg, #fd9644, #e55039)",
  },
];

const IDEA_PARTS = {
  action: {
    mechanic: ["combat au corps-à-corps", "tir en bullet-time", "esquive parkour", "combo multi-armes", "attaques de boss épiques"],
    setting: ["dystopie cyberpunk", "monde post-apo", "arène galactique", "jungle ancienne", "mégapole en guerre"],
    twist: ["où le temps ralentit à chaque kill", "mais ton ombre te trahit", "sous forme de pixel art 3D", "où les ennemis copient tes mouvements", "avec un système de karma"],
    subject: ["un mercenaire robot", "une guerrière fantôme", "un enfant surentraîné", "un dieu déchu", "un chasseur de primes temporel"],
  },
  simulation: {
    mechanic: ["gestion de ressources", "construction modulaire", "micromanagement d'habitants", "optimisation de chaînes", "diplomatie économique"],
    setting: ["ville sur un astéroïde", "biome sous-marin", "espace orbital", "ruches géantes", "train transcontinental"],
    twist: ["où les catastrophes sont aléatoires", "avec une météo dynamique qui change tout", "en temps réel accéléré", "où les citoyens ont une IA propre", "mais tu ne peux pas sauvegarder"],
    subject: ["un maire incompétent", "une IA de gestion", "une corporation galactique", "un ingénieur génial", "un bureaucrate borné"],
  },
  fun: {
    mechanic: ["mini-jeux absurdes", "physique chaotique", "coopération forcée", "timer explosif", "combats de poulets"],
    setting: ["parc d'attractions infernal", "cuisine géante", "carnaval maudit", "bureau de télétravail", "ferme délirante"],
    twist: ["avec des règles qui changent toutes les 30 secondes", "où tout le monde est ivre", "en vue isométrique cartoonesque", "où les boutons font le contraire", "avec un commentateur ridicule"],
    subject: ["4 colocataires incompatibles", "des pingouins ninjas", "une troupe de clowns", "des chefs cuisiniers enragés", "des hamsters cosmiques"],
  },
  rpg: {
    mechanic: ["système de classes fluide", "artisanat alchimique", "quêtes moralement ambiguës", "dialogues à conséquences", "magie liée aux émotions"],
    setting: ["royaume médiéval fracturé", "monde steampunk", "univers onirique", "planète-forêt mystique", "cité souterraine ancienne"],
    twist: ["où chaque choix modifie le monde entier", "avec un système de réputation entre factions", "mais le héros perd ses souvenirs progressivement", "où les monstres peuvent devenir alliés", "avec une mort permanente partielle"],
    subject: ["un mage amnésique", "une voleuse d'élite", "un forgeron devenu prophète", "un démon repenti", "un enfant porteur d'une prophétie"],
  },
  survival: {
    mechanic: ["gestion de faim/soif/chaleur", "craft d'urgence", "exploration roguelike", "construction de base", "piégeage de ressources"],
    setting: ["île volcanique instable", "toundra arctique", "forêt dense enchantée", "planète alien hostile", "bunker post-nucléaire"],
    twist: ["avec un cycle jour/nuit extrême", "où la faune évolue selon tes actions", "mais la carte rétrécit chaque heure", "avec une météo procédurale mortelle", "où tu joues avec un ami en coop asynchrone"],
    subject: ["un ingénieur échoué", "une exploratrice solitaire", "un groupe de survivants divisé", "une IA dans un corps humain", "un enfant perdu"],
  },
  puzzle: {
    mechanic: ["manipulation de lumière", "déformation de l'espace", "logique temporelle", "codes et chiffrements", "physique des liquides"],
    setting: ["musée interdimensionnel", "labyrinthe vivant", "cerveau d'une IA", "temple sous-marin", "bibliothèque infinie"],
    twist: ["où chaque solution ouvre de nouvelles questions", "avec une narration cachée dans les puzzles", "mais les règles ne sont jamais expliquées", "où le décor est lui-même un indice", "avec un timer psychologique invisible"],
    subject: ["un détective quantique", "une entité de lumière", "un archiviste fantôme", "une conscience piégée", "un enfant prodige"],
  },
  horror: {
    mechanic: ["tension atmosphérique", "gestion de la peur", "cache-cache mortel", "investigation", "survie sans combat"],
    setting: ["manoir victorien hanté", "hôpital psychiatrique abandonné", "forêt de nuit sans lune", "station spatiale silencieuse", "petite ville américaine des années 80"],
    twist: ["où la lumière est ton seul allié", "mais le monstre apprend de tes erreurs", "avec une narration non-linéaire", "où tu n'es jamais sûr de ce qui est réel", "avec un son spatial immersif"],
    subject: ["un journaliste maudit", "une famille dysfonctionnelle", "un enfant qui voit les morts", "un survivant amnésique", "un détective qui ne dort plus"],
  },
  strategy: {
    mechanic: ["contrôle de territoire", "arbre technologique", "alliances trahissables", "économie de guerre", "espionnage et contre-espionnage"],
    setting: ["ère médiévale renaissante", "galaxie en guerre froide", "cité-état antique", "planète colonisée", "monde parallèle"],
    twist: ["avec des leaders IA qui ont leur agenda", "où les ressources sont rares et non-renouvelables", "mais tu joues en temps réel pausable", "avec un brouillard de guerre permanent", "où chaque défaite laisse des cicatrices permanentes"],
    subject: ["un empire déclinant", "une faction rebelle technologique", "une alliance précaire de 4 peuples", "un seigneur de guerre isolé", "une civilisation en renaissance"],
  },
};

const CONNECTORS = [
  "Incarne", "Joue", "Dirige", "Explore", "Survie en tant que", "Deviens", "Guide"
];
const ACTIONS = [
  "dans un jeu de", "à travers un univers de", "dans un monde de", "au cœur d'un"
];

function generateIdea(categoryId) {
  const parts = IDEA_PARTS[categoryId];
  if (!parts) return null;

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const connector = pick(CONNECTORS);
  const subject = pick(parts.subject);
  const action = pick(ACTIONS);
  const mechanic = pick(parts.mechanic);
  const setting = pick(parts.setting);
  const twist = pick(parts.twist);

  return {
    short: `${connector} ${subject}`,
    full: `${connector} **${subject}** ${action} **${mechanic}** — dans **${setting}** ${twist}.`,
    mechanic,
    setting,
    twist,
    subject,
    category: categoryId,
    id: Date.now(),
    likes: 0,
    timestamp: new Date().toLocaleString("fr-FR"),
  };
}
