export interface Team {
  name: string;
  coins: number;
  stars: number;
}

export const TEAM_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-600', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

export const defaultTeams = (): Team[] =>
  Array.from({ length: 6 }, (_, i) => ({ name: `Équipe ${i + 1}`, coins: 0, stars: 0 }));

/** Vérifie qu'une valeur lue (localStorage, fichier importé) ressemble bien à une liste d'équipes. */
export const parseTeams = (value: unknown): Team[] | null => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) return null;
  const teams: Team[] = [];
  for (const t of value) {
    if (!t || typeof t.name !== 'string' || typeof t.coins !== 'number' || typeof t.stars !== 'number') return null;
    teams.push({ name: t.name.slice(0, 30), coins: Math.max(0, t.coins), stars: Math.max(0, t.stars) });
  }
  return teams;
};
