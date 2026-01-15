import avatarMale from '@assets/generated_images/cyberpunk_tech_professional_avatar_male.png';
import avatarFemale from '@assets/generated_images/cyberpunk_tech_professional_avatar_female.png';
import avatarAndro from '@assets/generated_images/cyberpunk_tech_professional_avatar_androgynous.png';

const avatars = [avatarMale, avatarFemale, avatarAndro];

const firstNames = ['Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Avery', 'Parker', 'Quinn', 'Skyler', 'Hiro', 'Suki', 'Zane', 'Lyra', 'Kael', 'Nova', 'Orion', 'Vega', 'Ryla', 'Jinx'];
const lastNames = ['Chen', 'Smith', 'Kim', 'Patel', 'Rivera', 'Zhang', 'Kowalski', 'Dubois', 'Silva', 'Tanaka', 'Sterling', 'Vance', 'Mercer', 'Steel', 'Frost', 'Shadow', 'Light', 'Byte', 'Cipher', 'Voss'];

const roles = ['Full Stack Developer', 'Data Scientist', 'AI Researcher', 'UX Designer', 'Product Manager', 'Cybersecurity Analyst', 'Blockchain Architect', 'Cloud Engineer'];
const companies = ['Google', 'OpenAI', 'Anthropic', 'Meta', 'Netflix', 'Stripe', 'Replit', 'SpaceX', 'Tesla', 'Nvidia', 'Stealth Startup', 'DAO Collective'];

const skillsList = ['React', 'Python', 'TensorFlow', 'Rust', 'Go', 'Kubernetes', 'Design Systems', 'NLP', 'Computer Vision', 'Smart Contracts', 'GraphQL', 'AWS'];

// Define locations with relative weights/masses
const locations = [
  { name: 'San Francisco', weight: 0.4 }, // 40%
  { name: 'New York', weight: 0.15 },     // 15%
  { name: 'London', weight: 0.1 },        // 10%
  { name: 'Waterloo', weight: 0.05 },     // 5%
  { name: 'Remote', weight: 0.15 },       // 15%
  { name: 'Tokyo', weight: 0.05 },        // 5%
  { name: 'Berlin', weight: 0.05 },       // 5%
  { name: 'Singapore', weight: 0.05 },    // 5%
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomLocation() {
  const rand = Math.random();
  let cumulativeWeight = 0;
  for (const loc of locations) {
    cumulativeWeight += loc.weight;
    if (rand < cumulativeWeight) {
      return loc.name;
    }
  }
  return locations[0].name; // Fallback
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
  clusterGroup: number; // For visualization coloring if needed
}

export function generateGraphData(count: number = 1000) {
  const nodes: NodeData[] = [];
  const links: { source: string; target: string }[] = [];

  // 1. Generate Nodes assigned to locations
  for (let i = 0; i < count; i++) {
    const isExceptional = Math.random() > 0.85; // Top 15%
    const fn = randomItem(firstNames);
    const ln = randomItem(lastNames);
    const location = getRandomLocation();
    
    // Assign a cluster group ID based on location index
    const locationIdx = locations.findIndex(l => l.name === location);

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
      location: location,
      clusterGroup: locationIdx,
    });
  }

  // 2. Generate Links (Prefer intra-cluster connections)
  // We'll iterate through nodes and connect them
  nodes.forEach((node, i) => {
    // Determine how many connections this node has
    // Exceptional nodes might have more connections
    const numLinks = node.exceptional ? randomInt(3, 8) : randomInt(1, 4);

    for (let j = 0; j < numLinks; j++) {
      let targetIndex;
      const stayInCluster = Math.random() > 0.05; // 95% chance to stay in cluster (increased from 85%)

      if (stayInCluster) {
        // Find a random node in the same location
        // This acts as a filter, so might be slow if we just loop. 
        // Optimization: pick random indices until we find one in same location.
        // Or better: Pre-group indices by location.
        
        // Simple approach for 1000 nodes: Just try 10 times to find a match, otherwise random
        let attempts = 0;
        do {
           targetIndex = randomInt(0, count - 1);
           attempts++;
        } while (nodes[targetIndex].location !== node.location && attempts < 20);
      } else {
        // Connect to anywhere (bridge between clusters)
        targetIndex = randomInt(0, count - 1);
      }

      if (targetIndex !== i) {
        // Check if link already exists (simple string check or just push and let graph handle dupes)
        // ForceGraph handles dupes usually, but cleaner to not have self-loops
        links.push({
          source: node.id,
          target: nodes[targetIndex].id,
        });
      }
    }
  });

  return { nodes, links };
}
