'use strict';
/**
 * Proper Mock Data Seeder
 * Seeds a realistic Firestore database for demo/testing.
 *
 * Collections seeded:
 *   /users          — auth role lookup
 *   /volunteers     — volunteer profiles
 *   /needs          — disaster needs with urgency scores
 *   /tasks          — tasks linked to needs, with assigned volunteers
 *
 * Run: node seed.js --project disaster-response-app-f17ab
 *
 * WARNING: This will overwrite existing demo data.
 */

const admin = require('firebase-admin');
const { computeUrgencyScore } = require('./scoring');

const PROJECT_ID = process.argv[2] === '--project' ? process.argv[3] : 'disaster-response-app-f17ab';
admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

// ── Volunteer profiles ────────────────────────────────────────────────────────
const VOLUNTEERS = [
  { id: 'vol_01', name: 'Priya Sharma',    email: 'priya.sharma@demo.com',    lat: 18.5100, lng: 73.9200, skills: ['Medical', 'First Aid'],              availability: ['monday', 'wednesday', 'saturday'], reliabilityScore: 95, tasksCompleted: 12, tasksDeclined: 1 },
  { id: 'vol_02', name: 'Rahul Patil',     email: 'rahul.patil@demo.com',     lat: 18.5200, lng: 73.8500, skills: ['Driving', 'Logistics'],              availability: ['tuesday', 'thursday', 'sunday'],   reliabilityScore: 88, tasksCompleted: 8,  tasksDeclined: 2 },
  { id: 'vol_03', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@demo.com',  lat: 18.4900, lng: 73.9100, skills: ['Cooking', 'Logistics'],              availability: ['monday', 'friday', 'saturday'],    reliabilityScore: 100, tasksCompleted: 6, tasksDeclined: 0 },
  { id: 'vol_04', name: 'Amit Desai',     email: 'amit.desai@demo.com',      lat: 18.5300, lng: 73.9400, skills: ['Construction', 'Logistics'],         availability: ['wednesday', 'saturday', 'sunday'], reliabilityScore: 80, tasksCompleted: 5,  tasksDeclined: 2 },
  { id: 'vol_05', name: 'Kavita Joshi',   email: 'kavita.joshi@demo.com',    lat: 18.5050, lng: 73.8900, skills: ['Teaching', 'Counseling'],            availability: ['monday', 'tuesday', 'friday'],     reliabilityScore: 92, tasksCompleted: 10, tasksDeclined: 1 },
  { id: 'vol_06', name: 'Suresh Nair',    email: 'suresh.nair@demo.com',     lat: 18.4800, lng: 73.8700, skills: ['Medical', 'Water Sanitation'],       availability: ['thursday', 'saturday', 'sunday'],  reliabilityScore: 85, tasksCompleted: 7,  tasksDeclined: 2 },
  { id: 'vol_07', name: 'Meera Iyer',     email: 'meera.iyer@demo.com',      lat: 18.5150, lng: 73.9300, skills: ['Communication', 'Logistics'],        availability: ['monday', 'wednesday', 'friday'],   reliabilityScore: 90, tasksCompleted: 9,  tasksDeclined: 1 },
  { id: 'vol_08', name: 'Vikram Rao',     email: 'vikram.rao@demo.com',      lat: 18.5250, lng: 73.8600, skills: ['First Aid', 'Driving'],              availability: ['tuesday', 'saturday', 'sunday'],   reliabilityScore: 75, tasksCompleted: 4,  tasksDeclined: 2 },
  { id: 'vol_09', name: 'Anita Bhosale',  email: 'anita.bhosale@demo.com',   lat: 18.4950, lng: 73.9000, skills: ['Cooking', 'Teaching'],               availability: ['monday', 'thursday', 'saturday'],  reliabilityScore: 83, tasksCompleted: 6,  tasksDeclined: 2 },
  { id: 'vol_10', name: 'Deepak Wagh',    email: 'deepak.wagh@demo.com',     lat: 18.5350, lng: 73.9500, skills: ['Construction', 'Water Sanitation'],  availability: ['wednesday', 'friday', 'sunday'],   reliabilityScore: 78, tasksCompleted: 5,  tasksDeclined: 2 },
  { id: 'vol_11', name: 'Pooja Gaikwad',  email: 'pooja.gaikwad@demo.com',   lat: 18.5000, lng: 73.8800, skills: ['Medical', 'Counseling'],             availability: ['tuesday', 'thursday', 'saturday'], reliabilityScore: 97, tasksCompleted: 15, tasksDeclined: 0 },
  { id: 'vol_12', name: 'Nikhil Chavan',  email: 'nikhil.chavan@demo.com',   lat: 18.5180, lng: 73.9150, skills: ['Driving', 'Communication'],          availability: ['monday', 'friday', 'sunday'],      reliabilityScore: 70, tasksCompleted: 3,  tasksDeclined: 2 },
  { id: 'vol_13', name: 'Sunita Pawar',   email: 'sunita.pawar@demo.com',    lat: 18.4870, lng: 73.8950, skills: ['First Aid', 'Cooking'],              availability: ['wednesday', 'saturday', 'sunday'], reliabilityScore: 86, tasksCompleted: 7,  tasksDeclined: 1 },
  { id: 'vol_14', name: 'Rajesh Mane',    email: 'rajesh.mane@demo.com',     lat: 18.5280, lng: 73.8750, skills: ['Logistics', 'Construction'],         availability: ['tuesday', 'thursday', 'friday'],   reliabilityScore: 72, tasksCompleted: 4,  tasksDeclined: 2 },
  { id: 'vol_15', name: 'Lata Jadhav',    email: 'lata.jadhav@demo.com',     lat: 18.4920, lng: 73.8850, skills: ['Medical', 'First Aid', 'Counseling'], availability: ['monday', 'tuesday', 'friday'],    reliabilityScore: 98, tasksCompleted: 18, tasksDeclined: 0 },
];

// ── Needs data ────────────────────────────────────────────────────────────────
const NEEDS_DATA = [
  { area: 'Hadapsar, Pune',   lat: 18.5018, lng: 73.9260, category: 'medical',           severity: 'critical', reportedCount: 28, daysAgo: 0, description: 'Severe shortage of medicines. Many injured residents need immediate medical attention after flooding.' },
  { area: 'Kothrud, Pune',    lat: 18.5074, lng: 73.8077, category: 'food_distribution', severity: 'high',     reportedCount: 22, daysAgo: 1, description: 'Families displaced by landslide have no food. 200+ people in temporary shelter need daily meals.' },
  { area: 'Nashik',           lat: 19.9975, lng: 73.7898, category: 'shelter',           severity: 'high',     reportedCount: 18, daysAgo: 2, description: 'Flood waters damaged 40+ homes. Families sleeping in open. Need tarpaulins and temporary shelter.' },
  { area: 'Aurangabad',       lat: 19.8762, lng: 75.3433, category: 'water_sanitation',  severity: 'critical', reportedCount: 15, daysAgo: 1, description: 'Contaminated water supply after flooding. Risk of cholera outbreak. Need water purification.' },
  { area: 'Kolhapur',         lat: 16.7050, lng: 74.2433, category: 'medical',           severity: 'high',     reportedCount: 12, daysAgo: 3, description: 'Vaccination camp needed for children under 5. Polio risk elevated in flood-affected areas.' },
  { area: 'Solapur',          lat: 17.6868, lng: 75.9064, category: 'food_distribution', severity: 'medium',   reportedCount: 10, daysAgo: 4, description: 'Drought-affected village. Grain stocks depleted. 150 families need food rations.' },
  { area: 'Nanded',           lat: 19.1383, lng: 77.3210, category: 'education',         severity: 'medium',   reportedCount: 8,  daysAgo: 5, description: 'School building damaged. 300 students without classroom. Need temporary learning space.' },
  { area: 'Latur',            lat: 18.4088, lng: 76.5604, category: 'shelter',           severity: 'high',     reportedCount: 14, daysAgo: 2, description: 'Earthquake tremors damaged walls of 20 homes. Elderly residents need safe accommodation.' },
  { area: 'Amravati',         lat: 20.9320, lng: 77.7523, category: 'general',           severity: 'low',      reportedCount: 5,  daysAgo: 7, description: 'General relief needed for flood-affected families. Clothing, blankets, and basic supplies.' },
  { area: 'Dhule',            lat: 20.9042, lng: 74.7749, category: 'water_sanitation',  severity: 'high',     reportedCount: 9,  daysAgo: 3, description: 'Village well contaminated. 80 families without clean drinking water for 3 days.' },
  { area: 'Nagpur',           lat: 21.1458, lng: 79.0882, category: 'medical',           severity: 'medium',   reportedCount: 7,  daysAgo: 4, description: 'Dengue outbreak reported. Need medical volunteers for door-to-door awareness and treatment.' },
  { area: 'Sangli',           lat: 16.8524, lng: 74.5815, category: 'food_distribution', severity: 'high',     reportedCount: 16, daysAgo: 1, description: 'River flooding cut off village. 300 families stranded without food for 2 days.' },
];

// ── Tasks data (linked to needs, with volunteers assigned) ────────────────────
// These represent the full task lifecycle for demo purposes
const TASKS_DATA = [
  {
    id: 'task_01',
    linkedNeedIdx: 0, // Hadapsar medical
    title: 'Medical Relief Camp — Hadapsar',
    description: 'Set up emergency medical camp. Distribute medicines, provide first aid to flood victims.',
    requiredSkills: ['Medical', 'First Aid'],
    volunteersNeeded: 3,
    scheduledDate: daysFromNow(2),
    scheduledDay: dayName(2),
    status: 'completed',
    assignedVolunteers: ['vol_01', 'vol_06', 'vol_11'],
    confirmedVolunteers: ['vol_01', 'vol_06', 'vol_11'],
  },
  {
    id: 'task_02',
    linkedNeedIdx: 1, // Kothrud food
    title: 'Food Distribution — Kothrud Shelter',
    description: 'Distribute ration kits to 200+ displaced families at the community shelter.',
    requiredSkills: ['Cooking', 'Logistics'],
    volunteersNeeded: 2,
    scheduledDate: daysFromNow(1),
    scheduledDay: dayName(1),
    status: 'in_progress',
    assignedVolunteers: ['vol_03', 'vol_09'],
    confirmedVolunteers: ['vol_03', 'vol_09'],
  },
  {
    id: 'task_03',
    linkedNeedIdx: 2, // Nashik shelter
    title: 'Emergency Shelter Setup — Nashik',
    description: 'Distribute tarpaulins and help set up temporary shelters for flood-displaced families.',
    requiredSkills: ['Construction', 'Logistics'],
    volunteersNeeded: 4,
    scheduledDate: daysFromNow(3),
    scheduledDay: dayName(3),
    status: 'assigned',
    assignedVolunteers: ['vol_02', 'vol_04', 'vol_10', 'vol_14'],
    confirmedVolunteers: ['vol_02', 'vol_04'],
  },
  {
    id: 'task_04',
    linkedNeedIdx: 3, // Aurangabad water
    title: 'Water Purification Drive — Aurangabad',
    description: 'Deploy water purification kits and educate families on safe water practices.',
    requiredSkills: ['Water Sanitation', 'Communication'],
    volunteersNeeded: 2,
    scheduledDate: daysFromNow(1),
    scheduledDay: dayName(1),
    status: 'open',
    assignedVolunteers: ['vol_06', 'vol_07'],
    confirmedVolunteers: [],
  },
  {
    id: 'task_05',
    linkedNeedIdx: 5, // Solapur food
    title: 'Ration Distribution — Solapur Village',
    description: 'Deliver grain and food supplies to drought-affected families in Solapur.',
    requiredSkills: ['Driving', 'Logistics'],
    volunteersNeeded: 2,
    scheduledDate: daysFromNow(4),
    scheduledDay: dayName(4),
    status: 'open',
    assignedVolunteers: [],
    confirmedVolunteers: [],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function dayName(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function daysAgoTimestamp(n) {
  return admin.firestore.Timestamp.fromDate(new Date(Date.now() - n * 86400000));
}

// ── Seeder ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`\n🌱 Seeding Firestore project: ${PROJECT_ID}\n`);

  // ── 1. Seed volunteers ──────────────────────────────────────────────────────
  console.log('📋 Seeding volunteers...');
  for (const v of VOLUNTEERS) {
    const volDoc = {
      uid: v.id,
      name: v.name,
      email: v.email,
      phone: `+9190000${v.id.replace('vol_', '')}000`,
      address: 'India',
      lat: v.lat,
      lng: v.lng,
      skills: v.skills,
      availability: v.availability,
      reliabilityScore: v.reliabilityScore,
      tasksCompleted: v.tasksCompleted,
      tasksDeclined: v.tasksDeclined,
      isAvailable: true,
      fcmTokens: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('volunteers').doc(v.id).set(volDoc);
    await db.collection('users').doc(v.id).set({
      uid: v.id,
      role: 'volunteer',
      email: v.email,
      displayName: v.name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ ${v.name} (${v.skills.join(', ')}) — reliability ${v.reliabilityScore}%`);
  }

  // ── 2. Seed needs ───────────────────────────────────────────────────────────
  console.log('\n⚠️  Seeding needs...');
  const needIds = [];
  for (const n of NEEDS_DATA) {
    const createdAt = daysAgoTimestamp(n.daysAgo);
    const score = computeUrgencyScore({
      reportedCount: n.reportedCount,
      severity: n.severity,
      category: n.category,
      createdAt,
    });
    const ref = db.collection('needs').doc();
    const needDoc = {
      needId: ref.id,
      area: n.area,
      lat: n.lat,
      lng: n.lng,
      category: n.category,
      description: n.description,
      severity: n.severity,
      reportedCount: n.reportedCount,
      urgencyScore: score.total,
      scoreBreakdown: score.breakdown,
      status: 'open',
      createdAt,
      createdBy: 'seeder',
    };
    await ref.set(needDoc);
    needIds.push(ref.id);
    console.log(`  ✓ ${n.area} [${n.category}] → urgency ${score.total.toFixed(1)}/100`);
  }

  // ── 3. Seed tasks ───────────────────────────────────────────────────────────
  console.log('\n📌 Seeding tasks...');
  for (const t of TASKS_DATA) {
    const linkedNeed = NEEDS_DATA[t.linkedNeedIdx];
    const needId = needIds[t.linkedNeedIdx];

    const taskDoc = {
      taskId: t.id,
      linkedNeedId: needId,
      title: t.title,
      description: t.description,
      area: linkedNeed.area,
      lat: linkedNeed.lat,
      lng: linkedNeed.lng,
      requiredSkills: t.requiredSkills,
      volunteersNeeded: t.volunteersNeeded,
      suggestedVolunteers: [],
      assignedVolunteers: t.assignedVolunteers,
      confirmedVolunteers: t.confirmedVolunteers,
      status: t.status,
      scheduledDate: t.scheduledDate,
      scheduledDay: t.scheduledDay,
      createdBy: 'seeder',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(t.status === 'completed' ? { completedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
    };

    await db.collection('tasks').doc(t.id).set(taskDoc);

    // Mark linked need as task_created
    if (needId) {
      await db.collection('needs').doc(needId).update({ status: 'task_created' });
    }

    console.log(`  ✓ ${t.title} [${t.status}] → ${t.assignedVolunteers.length} assigned, ${t.confirmedVolunteers.length} confirmed`);
  }

  // ── 4. Summary ──────────────────────────────────────────────────────────────
  console.log('\n✅ Seeding complete!');
  console.log(`   ${VOLUNTEERS.length} volunteers`);
  console.log(`   ${NEEDS_DATA.length} needs`);
  console.log(`   ${TASKS_DATA.length} tasks`);
  console.log('\nTask status breakdown:');
  const statusCounts = {};
  TASKS_DATA.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  Object.entries(statusCounts).forEach(([s, c]) => console.log(`   ${s}: ${c}`));
  console.log('\nVolunteer flow demo:');
  console.log('   task_03 (Nashik Shelter) → vol_02 & vol_04 confirmed, vol_10 & vol_14 pending');
  console.log('   task_04 (Aurangabad Water) → vol_06 & vol_07 assigned, none confirmed yet');
  console.log('\nLogin with any volunteer email (password: demo1234) after running:');
  console.log('   firebase auth:import or create accounts manually in Firebase Console');

  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
