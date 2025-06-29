// Fun default connection name generator

const adjectives: Record<string, string[]> = {
  a: ['Awesome', 'Amazing', 'Agile', 'Atomic', 'Astral', 'Alpine', 'Ancient', 'Amber'],
  b: ['Brave', 'Bold', 'Brilliant', 'Blazing', 'Bouncing', 'Bright', 'Breezy', 'Blissful'],
  c: ['Cool', 'Cosmic', 'Crystal', 'Clever', 'Cozy', 'Curious', 'Crimson', 'Charming'],
  d: ['Dynamic', 'Dazzling', 'Divine', 'Dreamy', 'Daring', 'Dancing', 'Digital', 'Delightful'],
  e: ['Epic', 'Electric', 'Elegant', 'Eternal', 'Emerald', 'Energetic', 'Enchanted', 'Exciting'],
  f: ['Fast', 'Fantastic', 'Fierce', 'Friendly', 'Funky', 'Fresh', 'Flying', 'Flaming'],
  g: ['Great', 'Golden', 'Glorious', 'Gentle', 'Groovy', 'Galactic', 'Gleaming', 'Graceful'],
  h: ['Happy', 'Heroic', 'Harmonious', 'Hypersonic', 'Heavenly', 'Honest', 'Hopeful', 'Hilarious'],
  i: ['Incredible', 'Infinite', 'Intelligent', 'Inspiring', 'Icy', 'Imaginative', 'Illustrious', 'Invincible'],
  j: ['Jolly', 'Joyful', 'Jazzy', 'Jumping', 'Jubilant', 'Jade', 'Jovial', 'Just'],
  k: ['Kind', 'Keen', 'Kinetic', 'Knightly', 'Kaleidoscopic', 'Key', 'Kingly', 'Knowing'],
  l: ['Lucky', 'Legendary', 'Luminous', 'Lively', 'Lovely', 'Lightning', 'Lavender', 'Laughing'],
  m: ['Mighty', 'Magic', 'Magnificent', 'Mystic', 'Merry', 'Majestic', 'Modern', 'Marvelous'],
  n: ['Nice', 'Noble', 'Neon', 'Nimble', 'Natural', 'Neat', 'Nocturnal', 'Novel'],
  o: ['Optimal', 'Oceanic', 'Orbital', 'Original', 'Outstanding', 'Opulent', 'Optimistic', 'Ornate'],
  p: ['Powerful', 'Perfect', 'Playful', 'Prismatic', 'Phoenix', 'Pleasant', 'Polished', 'Peaceful'],
  q: ['Quick', 'Quantum', 'Quiet', 'Quirky', 'Quality', 'Quaint', 'Quest', 'Quintessential'],
  r: ['Rapid', 'Royal', 'Radiant', 'Rainbow', 'Robust', 'Ruby', 'Roaring', 'Refined'],
  s: ['Super', 'Stellar', 'Swift', 'Shiny', 'Smooth', 'Sparkly', 'Serene', 'Spectacular'],
  t: ['Turbo', 'Terrific', 'Thundering', 'Tranquil', 'Titanium', 'Twinkling', 'Timeless', 'Triumphant'],
  u: ['Ultra', 'Ultimate', 'Unique', 'Universal', 'Upbeat', 'United', 'Unwavering', 'Uplifting'],
  v: ['Vibrant', 'Valiant', 'Velvet', 'Vivid', 'Victorious', 'Vanilla', 'Versatile', 'Visionary'],
  w: ['Wonderful', 'Wild', 'Wise', 'Whimsical', 'Winning', 'Warm', 'Wandering', 'Wholesome'],
  x: ['Xtra', 'Xenial', 'X-ray', 'Xtreme', 'Xquisite', 'Xotic', 'Xcellent', 'Xtraordinary'],
  y: ['Young', 'Youthful', 'Yellow', 'Yearning', 'Yielding', 'Yonder', 'Yes', 'Yearly'],
  z: ['Zen', 'Zesty', 'Zippy', 'Zealous', 'Zigzag', 'Zephyr', 'Zero', 'Zodiac']
}

const nouns: Record<string, string[]> = {
  a: ['Aurora', 'Atlas', 'Arrow', 'Asteroid', 'Anchor', 'Avalanche', 'Atom', 'Adventure'],
  b: ['Bear', 'Bolt', 'Beacon', 'Blizzard', 'Bridge', 'Boulder', 'Butterfly', 'Breeze'],
  c: ['Comet', 'Crystal', 'Cloud', 'Cosmos', 'Cascade', 'Canyon', 'Cipher', 'Catalyst'],
  d: ['Dragon', 'Diamond', 'Dream', 'Dawn', 'Dolphin', 'Dynamo', 'Desert', 'Destiny'],
  e: ['Eagle', 'Echo', 'Eclipse', 'Ember', 'Engine', 'Explorer', 'Electron', 'Element'],
  f: ['Falcon', 'Fire', 'Forest', 'Fountain', 'Fox', 'Forge', 'Flame', 'Fortress'],
  g: ['Galaxy', 'Glacier', 'Griffin', 'Garden', 'Gem', 'Ghost', 'Gate', 'Guardian'],
  h: ['Hawk', 'Horizon', 'Hurricane', 'Harbor', 'Hero', 'Harmony', 'Haven', 'Hydra'],
  i: ['Ice', 'Infinity', 'Island', 'Ignition', 'Iris', 'Iron', 'Illusion', 'Impact'],
  j: ['Jaguar', 'Jet', 'Journey', 'Jungle', 'Jewel', 'Jupiter', 'Justice', 'Jazz'],
  k: ['Knight', 'Kraken', 'Key', 'Kingdom', 'Kite', 'Kernel', 'Kaleidoscope', 'Kinetic'],
  l: ['Lion', 'Lightning', 'Lake', 'Laser', 'Legend', 'Luna', 'Lighthouse', 'Lotus'],
  m: ['Mountain', 'Moon', 'Meteor', 'Matrix', 'Mirage', 'Mercury', 'Maze', 'Monarch'],
  n: ['Nova', 'Neptune', 'Nebula', 'Ninja', 'Night', 'Nexus', 'North', 'Nature'],
  o: ['Ocean', 'Oracle', 'Orbit', 'Oasis', 'Omega', 'Oak', 'Onyx', 'Odyssey'],
  p: ['Phoenix', 'Planet', 'Prism', 'Panther', 'Peak', 'Portal', 'Pulse', 'Paradise'],
  q: ['Quasar', 'Quest', 'Quantum', 'Quartz', 'Queen', 'Quake', 'Quick', 'Quarry'],
  r: ['Rocket', 'River', 'Rainbow', 'Raven', 'Ridge', 'Realm', 'Ruby', 'Radiance'],
  s: ['Star', 'Storm', 'Sky', 'Sphinx', 'Summit', 'Sword', 'Sapphire', 'Shadow'],
  t: ['Thunder', 'Tiger', 'Tornado', 'Titan', 'Tower', 'Tide', 'Temple', 'Twilight'],
  u: ['Universe', 'Unicorn', 'Unity', 'Umbrella', 'Utopia', 'Ultra', 'Uplink', 'Urban'],
  v: ['Vortex', 'Volcano', 'Valley', 'Voyager', 'Vertex', 'Viking', 'Vision', 'Vanguard'],
  w: ['Wolf', 'Wave', 'Wind', 'Wizard', 'Waterfall', 'Warrior', 'Winter', 'Whisper'],
  x: ['X-ray', 'Xerox', 'Xylophone', 'Xbox', 'X-factor', 'X-wing', 'Xenon', 'X-file'],
  y: ['Yeti', 'Yacht', 'Yard', 'Year', 'Yak', 'Yin', 'Yang', 'Yellow'],
  z: ['Zephyr', 'Zenith', 'Zero', 'Zodiac', 'Zone', 'Zebra', 'Zeppelin', 'Zigzag']
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function generateFunConnectionName(connectionString: string): string {
  try {
    const url = new URL(connectionString)
    const database = url.pathname.substring(1).toLowerCase()
    
    // Get the first letter of the database name
    const firstLetter = database.charAt(0) || 'd'
    
    // Get adjectives and nouns for this letter
    const adjectiveList = adjectives[firstLetter] || adjectives['d']
    const nounList = nouns[firstLetter] || nouns['d']
    
    // Pick random adjective and noun
    const adjective = getRandomElement(adjectiveList)
    const noun = getRandomElement(nounList)
    
    return `${adjective} ${noun}`
  } catch {
    // Fallback to a random default name
    const fallbackLetter = 'd'
    const adjective = getRandomElement(adjectives[fallbackLetter])
    const noun = getRandomElement(nouns[fallbackLetter])
    return `${adjective} ${noun}`
  }
}

// Optional: Keep track of used names to avoid duplicates in the same session
const usedNames = new Set<string>()

export function generateUniqueConnectionName(connectionString: string): string {
  let attempts = 0
  let name = generateFunConnectionName(connectionString)
  
  // Try up to 10 times to get a unique name
  while (usedNames.has(name) && attempts < 10) {
    name = generateFunConnectionName(connectionString)
    attempts++
  }
  
  // If we still have a duplicate after 10 attempts, add a number
  if (usedNames.has(name)) {
    let counter = 2
    while (usedNames.has(`${name} ${counter}`)) {
      counter++
    }
    name = `${name} ${counter}`
  }
  
  usedNames.add(name)
  return name
}