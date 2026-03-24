const WELCOME_TEMPLATES = [
  (name: string, team: string) => `Welcome to the squad, ${name}! Let's make this season one for the books`,
  (name: string, team: string) => `${name} has joined ${team}! Another warrior in the dugout`,
  (name: string, team: string) => `Big welcome to ${name}! The team just got stronger`,
  (name: string, team: string) => `${name} is officially part of ${team}! Time to hit the ground running`,
  (name: string, team: string) => `Welcome aboard, ${name}! Can't wait to see you on the field`,
  (name: string, team: string) => `The squad grows! ${name} joins the ${team} family`,
  (name: string, team: string) => `${name} has entered the arena! Welcome to ${team}`,
  (name: string, team: string) => `New player alert! Welcome ${name} to the team`,
  (name: string, team: string) => `${name} just leveled up our roster! Welcome to the squad`,
  (name: string, team: string) => `Say hello to our newest member — ${name}! Let's go`,
];

export function getWelcomeMessage(playerName: string, teamName: string): string {
  const index = Math.floor(Math.random() * WELCOME_TEMPLATES.length);
  return WELCOME_TEMPLATES[index](playerName, teamName);
}

export function getWelcomeCaption(playerName: string, teamName: string): string {
  return `${getWelcomeMessage(playerName, teamName)} @${playerName} @Everyone`;
}
