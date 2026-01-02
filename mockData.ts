
import { User, Role, Incident, IncidentCategory, Severity, IncidentStatus } from './types';

export const CONTRACT_ADDRESS = '0x05228Bba13D6B2BeDF97a7aaA729a962Bd8971BF';

export const initialUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Mercer',
    email: 'alex.m@cecd.network',
    role: Role.OWNER,
    trustScore: 98,
    walletAddress: CONTRACT_ADDRESS,
    avatar: 'https://picsum.photos/seed/alex/200/200',
    location: 'New York, USA',
    lat: 40.7128,
    lng: -74.0060,
    skills: ['First Aid', 'Coordination', 'Strategy'],
    isVerified: true,
    status: 'Available'
  },
  {
    id: 'user-2',
    name: 'Sarah Jenkins',
    email: 'sarah.j@cecd.org',
    role: Role.VOLUNTEER,
    trustScore: 94,
    walletAddress: '0x4A2...8F92',
    avatar: 'https://picsum.photos/seed/sarah/200/200',
    location: 'London, UK',
    lat: 51.5074,
    lng: -0.1278,
    skills: ['Medic', 'Search & Rescue'],
    isVerified: true,
    status: 'Busy'
  },
  {
    id: 'user-3',
    name: 'Chen Wei',
    email: 'chen.w@community.net',
    role: Role.COMMUNITY_LEADER,
    trustScore: 88,
    walletAddress: '0x9B2...1C44',
    avatar: 'https://picsum.photos/seed/chen/200/200',
    location: 'Beijing, China',
    lat: 39.9042,
    lng: 116.4074,
    skills: ['Communication', 'Logistics'],
    isVerified: true,
    status: 'Available'
  },
  {
    id: 'user-4',
    name: 'Dmitri Volkov',
    email: 'dmitri.v@cecd.ru',
    role: Role.VOLUNTEER,
    trustScore: 91,
    walletAddress: '0x7E1...3D22',
    avatar: 'https://picsum.photos/seed/dmitri/200/200',
    location: 'Moscow, Russia',
    lat: 55.7558,
    lng: 37.6173,
    skills: ['Heavy Equipment', 'Winter Survival'],
    isVerified: true,
    status: 'Available'
  }
];

export const initialIncidents: Incident[] = [
  {
    id: 'INC-2025-001',
    title: 'Flash Flood - New York',
    description: 'Significant flooding reported in Manhattan subway systems and low-lying areas after extreme precipitation.',
    category: IncidentCategory.FLOOD,
    severity: Severity.CRITICAL,
    status: IncidentStatus.IN_PROGRESS,
    locationName: 'Manhattan, NYC',
    lat: 40.7128,
    lng: -74.0060,
    reporterId: 'user-1',
    timestamp: Date.now() - 3600000,
    assignedResponders: ['user-2'],
    blockNumber: 1950000,
    hash: '0x4a...v2b',
    confidenceScore: 0.98
  },
  {
    id: 'INC-2025-002',
    title: 'Blizzard Emergency - Moscow',
    description: 'Record-breaking snowfall causing gridlock and power outages in the northern sectors of Moscow.',
    category: IncidentCategory.STORM,
    severity: Severity.HIGH,
    status: IncidentStatus.REPORTED,
    locationName: 'Moscow, Russia',
    lat: 55.7558,
    lng: 37.6173,
    reporterId: 'user-4',
    timestamp: Date.now() - 7200000,
    assignedResponders: [],
    blockNumber: 1950012,
    hash: '0x5c...e21',
    confidenceScore: 0.95,
    isWhisperMode: true
  },
  {
    id: 'INC-2025-003',
    title: 'Wildfire Risk - Beijing Outskirts',
    description: 'High heat index and dry conditions reported in the hills north of Beijing. Immediate surveillance required.',
    category: IncidentCategory.FIRE,
    severity: Severity.MEDIUM,
    status: IncidentStatus.ACKNOWLEDGED,
    locationName: 'Beijing, China',
    lat: 39.9042,
    lng: 116.4074,
    reporterId: 'user-3',
    timestamp: Date.now() - 14400000,
    assignedResponders: [],
    blockNumber: 1950050,
    hash: '0xf3...a99',
    confidenceScore: 0.89
  }
];
