// Import realistic synthetic human avatars
import avatar1 from '@assets/generated_images/asian_male_professional_headshot.png';
import avatar2 from '@assets/generated_images/black_female_professional_headshot.png';
import avatar3 from '@assets/generated_images/caucasian_male_professional_headshot.png';
import avatar4 from '@assets/generated_images/south_asian_female_professional_headshot.png';
import avatar5 from '@assets/generated_images/hispanic_male_professional_headshot.png';
import avatar6 from '@assets/generated_images/east_asian_female_with_glasses_headshot.png';
import avatar7 from '@assets/generated_images/black_male_senior_professional_headshot.png';
import avatar8 from '@assets/generated_images/caucasian_female_professional_headshot.png';
import avatar9 from '@assets/generated_images/middle_eastern_male_professional_headshot.png';
import avatar10 from '@assets/generated_images/mixed-race_female_creative_professional.png';

const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8, avatar9, avatar10];

// Custom avatars for specific people
const customAvatars: Record<string, string> = {
  'Ian Pilon': 'https://pbs.twimg.com/profile_images/2006940793265606656/93QT6QTT_400x400.jpg',
  'Umesh Khanna': 'https://pbs.twimg.com/profile_images/1934350294642733056/qXErHn6w_400x400.jpg',
};

// Custom profile overrides for featured people (real data)
const customProfiles: Record<string, Partial<{
  role: string;
  location: string;
  social: { github: string; linkedin: string; twitter: string; website: string };
  narrative: string;
}>> = {
  'Umesh Khanna': {
    role: 'Talent Engineering',
    location: 'xAI',
    social: {
      github: 'github.com/umeshkhanna',
      linkedin: 'linkedin.com/in/umesh-khanna',
      twitter: '@forwarddeploy',
      website: 'forwarddeploy.com',
    },
    narrative: "@xai talent engineering | Forward deployed angels | University of Waterloo alumnus. Based in San Francisco, CA. Known for identifying and recruiting exceptional talent in the AI space.",
  },
};

const getAvatarUrl = (name: string) => {
  // Check for custom avatar first
  if (customAvatars[name]) {
    return customAvatars[name];
  }
  // Use name to deterministically pick an avatar
  const index = Math.abs(name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % avatars.length;
  return avatars[index];
};

const firstNames = ['Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Avery', 'Parker', 'Quinn', 'Skyler', 'Hiro', 'Suki', 'Zane', 'Lyra', 'Kael', 'Nova', 'Orion', 'Vega', 'Ryla', 'Jinx'];
const lastNames = ['Chen', 'Smith', 'Kim', 'Patel', 'Rivera', 'Zhang', 'Kowalski', 'Dubois', 'Silva', 'Tanaka', 'Sterling', 'Vance', 'Mercer', 'Steel', 'Frost', 'Shadow', 'Light', 'Byte', 'Cipher', 'Voss'];

const roles = ['1A Student', '1B Student', '2A Student', '2B Student', '3A Student', '3B Student', '4A Student', '4B Student'];
const companies = ['UWaterloo SE'];

const skillsList = ['React', 'Python', 'TensorFlow', 'Rust', 'Go', 'Kubernetes', 'Design Systems', 'NLP', 'Computer Vision', 'Smart Contracts', 'GraphQL', 'AWS'];

// Journey milestone templates for exceptional candidates
const milestoneTemplates = [
  { year: 2015, event: 'Founded first tech startup at age 19', category: 'founder' },
  { year: 2016, event: 'Organized the first blockchain hackathon in the region', category: 'leadership' },
  { year: 2017, event: 'Published groundbreaking research on distributed systems', category: 'research' },
  { year: 2018, event: 'Built a peer-to-peer network reaching 100K nodes', category: 'engineering' },
  { year: 2019, event: 'Led a team that shipped product to 1M users', category: 'leadership' },
  { year: 2020, event: 'Developed proprietary behavioral science software from scratch', category: 'innovation' },
  { year: 2021, event: 'Acquired by major tech company', category: 'founder' },
  { year: 2022, event: 'Keynote speaker at global AI conference', category: 'thought_leader' },
  { year: 2023, event: 'Launched AI platform with 80% efficiency gains over competitors', category: 'innovation' },
  { year: 2024, event: 'Published bestselling book on technology leadership', category: 'thought_leader' },
];

const exceptionalTraits = [
  'First-mover in emerging technology domains',
  'Pattern of identifying opportunities before mainstream adoption',
  'Track record of shipping products at scale',
  'Demonstrated ability to build and lead high-performing teams',
  'Cross-disciplinary expertise spanning technical and business domains',
  'Published author or recognized thought leader',
  'Built systems serving millions of users',
  'Pioneer in applying research methodologies to practical problems',
  'Consistent history of exceeding performance benchmarks',
  'Rare combination of deep technical skill and strategic vision',
];

const journeyNarratives = [
  "Distinguished themselves early by building production systems while peers were still learning fundamentals. Demonstrated a rare ability to see around corners, consistently positioning themselves at the forefront of emerging technology waves before they hit mainstream.",
  "Took an unconventional path—applying ethnographic research to engineering problems, leading to breakthrough products that competitors couldn't replicate. Their interdisciplinary approach became their signature advantage.",
  "Rose from contributor to leader by shipping what others said was impossible. Built systems that scaled 100x beyond original specs, earning trust that led to founding their own ventures.",
  "Became known as the person who makes things happen. Organized industry-first events, published influential work, and built networks that others only talk about. Their impact extends far beyond their direct work.",
  "Balanced extraordinary professional output with a demanding personal life, demonstrating time management and execution abilities that set them apart from typical high performers.",
];

// Define organizations with exact node counts
const organizations = [
  { name: 'UWaterloo SE', count: 633 },
];

// Keep locations for backward compatibility (maps to organization name)
const locations = organizations;

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomOrganization() {
  return randomItem(organizations).name;
}

export interface JourneyMilestone {
  year: number;
  event: string;
  category: 'founder' | 'leadership' | 'research' | 'engineering' | 'innovation' | 'thought_leader';
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
  clusterGroup: number;
  // New fields for journey/synthesis
  journey: {
    milestones: JourneyMilestone[];
    narrative: string;
    exceptionalTraits: string[];
  };
}

// Featured profiles - real people with synthetic data (to be updated later)
const featuredProfiles = [
  { name: 'Ian Pilon', location: 'UWaterloo SE', role: '4A Student' },
  { name: 'Amitav Krishna', location: 'UWaterloo SE', role: '3B Student' },
  { name: 'William Suriaputra', location: 'UWaterloo SE', role: '4B Student' },
  { name: 'Prabal Gupta', location: 'UWaterloo SE', role: '3A Student' },
  { name: 'Eden Chan', location: 'UWaterloo SE', role: '2B Student' },
  { name: 'Umesh Khanna', location: 'UWaterloo SE', role: '4A Student' },
];

function createFeaturedNode(profile: { name: string; location: string; role: string }, index: number): NodeData {
  const customProfile = customProfiles[profile.name];
  const effectiveLocation = customProfile?.location || profile.location;
  const locationIdx = locations.findIndex(l => l.name === effectiveLocation);
  const nameParts = profile.name.split(' ');
  const fn = nameParts[0];
  const ln = nameParts.slice(1).join('');
  
  // All featured profiles are exceptional with full milestones
  const shuffledMilestones = [...milestoneTemplates].sort(() => Math.random() - 0.5);
  const selectedMilestones = shuffledMilestones.slice(0, 6).sort((a, b) => a.year - b.year);
  
  const shuffledTraits = [...exceptionalTraits].sort(() => Math.random() - 0.5);
  const selectedTraits = shuffledTraits.slice(0, 4);

  const defaultSocial = {
    github: `github.com/${fn.toLowerCase()}${ln.toLowerCase()}`,
    linkedin: `linkedin.com/in/${fn.toLowerCase()}-${ln.toLowerCase()}`,
    twitter: `@${fn.toLowerCase()}_tech`,
    website: `${fn.toLowerCase()}.dev`,
  };

  return {
    id: `vip${index}`,
    name: profile.name,
    role: customProfile?.role || profile.role,
    company: effectiveLocation,
    img: getAvatarUrl(profile.name),
    exceptional: true,
    skills: Array.from({ length: 5 }, () => randomItem(skillsList)),
    psychographic: {
      openness: randomInt(85, 100),
      conscientiousness: randomInt(80, 100),
      extraversion: randomInt(60, 95),
      agreeableness: randomInt(70, 95),
      neuroticism: randomInt(10, 30),
      innovationScore: randomInt(92, 100),
      leadershipPotential: randomInt(85, 100),
    },
    social: customProfile?.social || defaultSocial,
    yearsExperience: randomInt(8, 20),
    location: effectiveLocation,
    clusterGroup: locationIdx >= 0 ? locationIdx : 0,
    journey: {
      milestones: selectedMilestones as JourneyMilestone[],
      narrative: customProfile?.narrative || randomItem(journeyNarratives),
      exceptionalTraits: selectedTraits,
    },
  };
}

export function generateGraphData() {
  const nodes: NodeData[] = [];
  const links: { source: string; target: string }[] = [];
  let nodeIndex = 0;

  // Add featured profiles first
  featuredProfiles.forEach((profile, idx) => {
    nodes.push(createFeaturedNode(profile, idx));
    nodeIndex++;
  });

  // Generate nodes for each organization with exact counts
  organizations.forEach((org, orgIndex) => {
    // Subtract featured profiles that belong to this org
    const featuredInOrg = featuredProfiles.filter(p => p.location === org.name).length;
    const nodesToGenerate = org.count - featuredInOrg;

    for (let i = 0; i < nodesToGenerate; i++) {
      const isExceptional = Math.random() > 0.85; // Top 15%
      const fn = randomItem(firstNames);
      const ln = randomItem(lastNames);

      // Generate journey data
      const numMilestones = isExceptional ? randomInt(4, 7) : randomInt(1, 3);
      const shuffledMilestones = [...milestoneTemplates].sort(() => Math.random() - 0.5);
      const selectedMilestones = shuffledMilestones.slice(0, numMilestones).sort((a, b) => a.year - b.year);
      
      const numTraits = isExceptional ? randomInt(3, 5) : randomInt(1, 2);
      const shuffledTraits = [...exceptionalTraits].sort(() => Math.random() - 0.5);
      const selectedTraits = shuffledTraits.slice(0, numTraits);

      const nodeName = `${fn} ${ln}`;
      nodes.push({
        id: `u${nodeIndex}`,
        name: nodeName,
        role: randomItem(roles),
        company: org.name,
        img: getAvatarUrl(nodeName),
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
        location: org.name,
        clusterGroup: orgIndex,
        journey: {
          milestones: selectedMilestones as JourneyMilestone[],
          narrative: isExceptional ? randomItem(journeyNarratives) : "Shows steady progression with consistent performance across core competencies.",
          exceptionalTraits: selectedTraits,
        },
      });
      nodeIndex++;
    }
  });

  // Build index of nodes by organization for faster link generation
  const nodesByOrg: Record<string, number[]> = {};
  nodes.forEach((node, idx) => {
    if (!nodesByOrg[node.location]) nodesByOrg[node.location] = [];
    nodesByOrg[node.location].push(idx);
  });

  // Generate Links - ensure every node has at least one connection
  const connectedNodes = new Set<string>();
  
  nodes.forEach((node, i) => {
    const numLinks = node.exceptional ? randomInt(1, 2) : 1;
    const orgNodes = nodesByOrg[node.location] || [];

    for (let j = 0; j < numLinks; j++) {
      let targetIndex;
      const stayInCluster = Math.random() > 0.05;

      if (stayInCluster && orgNodes.length > 1) {
        // Pick from same organization
        targetIndex = orgNodes[randomInt(0, orgNodes.length - 1)];
      } else {
        // Connect to anywhere
        targetIndex = randomInt(0, nodes.length - 1);
      }

      if (targetIndex !== i) {
        links.push({
          source: node.id,
          target: nodes[targetIndex].id,
        });
        connectedNodes.add(node.id);
        connectedNodes.add(nodes[targetIndex].id);
      }
    }
  });
  
  // Ensure orphan nodes get at least one connection
  nodes.forEach((node, i) => {
    if (!connectedNodes.has(node.id)) {
      const orgNodes = nodesByOrg[node.location] || [];
      let targetIndex = orgNodes.length > 1 
        ? orgNodes[randomInt(0, orgNodes.length - 1)]
        : randomInt(0, nodes.length - 1);
      if (targetIndex === i) targetIndex = (i + 1) % nodes.length;
      
      links.push({
        source: node.id,
        target: nodes[targetIndex].id,
      });
    }
  });

  // Add specific connections between named individuals
  const ianPilon = nodes.find(n => n.name === 'Ian Pilon');
  const umeshKhanna = nodes.find(n => n.name === 'Umesh Khanna');
  if (ianPilon && umeshKhanna) {
    links.push({
      source: ianPilon.id,
      target: umeshKhanna.id,
    });
  }

  return { nodes, links };
}
