import escudo from "@/assets/escudo.jpg.asset.json";
import equipo from "@/assets/equipo.jpg.asset.json";
import uniforme from "@/assets/uniforme.jpg.asset.json";
import cancha from "@/assets/cancha.jpg.asset.json";

export const BRAND = {
  name: "VIKINGOS FC",
  founded: "2017",
  league: "Liga de Veteranos · Escuela Modelo",
  city: "Mérida, Yucatán",
  crest: escudo.url,
  team: equipo.url,
  kit: uniforme.url,
  pitch: cancha.url,
};

export const POSITIONS = [
  "Portero",
  "Defensa",
  "Lateral",
  "Medio",
  "Extremo",
  "Delantero",
] as const;

export const REACTIONS = ["❤️", "😂", "🔥", "⚔️", "👏"] as const;
