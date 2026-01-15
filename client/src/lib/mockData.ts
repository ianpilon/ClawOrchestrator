import avatarMale from '@assets/generated_images/cyberpunk_tech_professional_avatar_male.png';
import avatarFemale from '@assets/generated_images/cyberpunk_tech_professional_avatar_female.png';
import avatarAndro from '@assets/generated_images/cyberpunk_tech_professional_avatar_androgynous.png';

const avatars = [avatarMale, avatarFemale, avatarAndro];

const firstNames = ['Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Avery', 'Parker', 'Quinn', 'Skyler', 'Hiro', 'Suki', 'Zane', 'Lyra', 'Kael', 'Nova', 'Orion', 'Vega', 'Ryla', 'Jinx'];
const lastNames = ['Chen', 'Smith', 'Kim', 'Patel', 'Rivera', 'Zhang', 'Kowalski', 'Dubois', 'Silva', 'Tanaka', 'Sterling', 'Vance', 'Mercer', 'Steel', 'Frost', 'Shadow', 'Light', 'Byte', 'Cipher', 'Voss'];

const roles = ['Full Stack Developer', 'Data Scientist', 'AI Researcher', 'UX Designer', 'Product Manager', 'Cybersecurity Analyst', 'Blockchain Architect', 'Cloud Engineer'];
const companies = ['Google', 'OpenAI', 'Anthropic', 'Meta', 'Netflix', 'Stripe', 'Replit', 'SpaceX', 'Tesla', 'Nvidia', 'Stealth Startup', 'DAO Collective'];

const skillsList = ['React', 'Python', 'TensorFlow', 'Rust', 'Go', 'Kubernetes', 'Design Systems', 'NLP', 'Computer Vision', 'Smart Contracts', 'GraphQL', 'AWS'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface NodeData {
  id: string;
  name: string;
  role: string;
  company: string;
  img: string;
  exceptional: boolean;
  skills: string[];
  psychographic: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    innovationScore: number;
    leadershipPotential: number;
  };
  social: {
    github: string;
    linkedin: string;
    twitter: string;
    website: string;
  };
  yearsExperience: number;
  location: string;
}

export function generateGraphData(count: number = 1000) {
  const nodes: NodeData[] = [];
  const links: { source: string; target: string }[] = [];

  for (let i = 0; i < count; i++) {
    const isExceptional = Math.random() > 0.85; // Top 15%
    const fn = randomItem(firstNames);
    const ln = randomItem(lastNames);
    
    nodes.push({
      id: `u${i}`,
      name: `${fn} ${ln}`,
      role: randomItem(roles),
      company: randomItem(companies),
      img: randomItem(avatars),
      exceptional: isExceptional,
      skills: Array.from({ length: randomInt(3, 6) }, () => randomItem(skillsList)),
      psychographic: {
        openness: randomInt(60, 100),
        conscientiousness: randomInt(50, 100),
        extraversion: randomInt(20, 90),
        agreeableness: randomInt(40, 90),
        neuroticism: randomInt(10, 60),
        innovationScore: isExceptional ? randomInt(90, 100) : randomInt(50, 90),
        leadershipPotential: randomInt(10, 100),
      },
      social: {
        github: `github.com/${fn.toLowerCase()}${ln.toLowerCase()}`,
        linkedin: `linkedin.com/in/${fn.toLowerCase()}-${ln.toLowerCase()}`,
        twitter: `@${fn.toLowerCase()}_tech`,
        website: `${fn.toLowerCase()}.dev`,
      },
      yearsExperience: randomInt(1, 15),
      location: randomItem(['San Francisco', 'New York', 'London', 'Remote', 'Tokyo', 'Berlin', 'Singapore']),
    });

    // Create random connections (small world network ish)
    // Connect to 1-3 previous nodes to ensure connectivity without chaos
    if (i > 0) {
      const numLinks = randomInt(1, 3);
      for (let j = 0; j < numLinks; j++) {
        const targetIndex = randomInt(0, i - 1);
        links.push({
          source: `u${i}`,
          target: `u${targetIndex}`,
        });
      }
    }
  }

  // Add some "Super Connectors" (Hubs)
  const hubs = [0, 10, 50, 100];
  hubs.forEach(hubIdx => {
    if (hubIdx < count) {
      for (let k = 0; k < 20; k++) {
        const target = randomInt(0, count - 1);
        if (target !== hubIdx) {
           links.push({ source: `u${hubIdx}`, target: `u${target}` });
        }
      }
    }
  });

  return { nodes, links };
}
