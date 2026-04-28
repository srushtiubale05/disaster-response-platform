export const SKILLS = [
  'First Aid', 'Medical', 'Cooking', 'Driving', 'Construction',
  'Teaching', 'Logistics', 'Communication', 'Water Sanitation', 'Counseling',
];

export const DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export const CATEGORIES = [
  { value: 'medical', label: 'Medical' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'food_distribution', label: 'Food Distribution' },
  { value: 'education', label: 'Education' },
  { value: 'water_sanitation', label: 'Water & Sanitation' },
  { value: 'general', label: 'General' },
];

export const SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const INDIA_LOCATIONS = [
  // Maharashtra
  { name: 'Hadapsar, Pune',      lat: 18.5018, lng: 73.9260 },
  { name: 'Kothrud, Pune',       lat: 18.5074, lng: 73.8077 },
  { name: 'Nashik',              lat: 19.9975, lng: 73.7898 },
  { name: 'Aurangabad',          lat: 19.8762, lng: 75.3433 },
  { name: 'Kolhapur',            lat: 16.7050, lng: 74.2433 },
  { name: 'Nagpur',              lat: 21.1458, lng: 79.0882 },
  { name: 'Thane',               lat: 19.2183, lng: 72.9781 },
  { name: 'Solapur',             lat: 17.6868, lng: 75.9064 },
  { name: 'Nanded',              lat: 19.1383, lng: 77.3210 },
  { name: 'Latur',               lat: 18.4088, lng: 76.5604 },
  // Delhi & NCR
  { name: 'New Delhi',           lat: 28.6139, lng: 77.2090 },
  { name: 'Noida',               lat: 28.5355, lng: 77.3910 },
  { name: 'Gurgaon',             lat: 28.4595, lng: 77.0266 },
  // Uttar Pradesh
  { name: 'Lucknow',             lat: 26.8467, lng: 80.9462 },
  { name: 'Varanasi',            lat: 25.3176, lng: 82.9739 },
  { name: 'Agra',                lat: 27.1767, lng: 78.0081 },
  // Bihar & Jharkhand
  { name: 'Patna',               lat: 25.5941, lng: 85.1376 },
  { name: 'Ranchi',              lat: 23.3441, lng: 85.3096 },
  // West Bengal
  { name: 'Kolkata',             lat: 22.5726, lng: 88.3639 },
  { name: 'Siliguri',            lat: 26.7271, lng: 88.3953 },
  // Odisha
  { name: 'Bhubaneswar',         lat: 20.2961, lng: 85.8245 },
  { name: 'Puri',                lat: 19.8135, lng: 85.8312 },
  // Andhra Pradesh & Telangana
  { name: 'Hyderabad',           lat: 17.3850, lng: 78.4867 },
  { name: 'Visakhapatnam',       lat: 17.6868, lng: 83.2185 },
  // Tamil Nadu
  { name: 'Chennai',             lat: 13.0827, lng: 80.2707 },
  { name: 'Madurai',             lat: 9.9252,  lng: 78.1198 },
  // Karnataka
  { name: 'Bengaluru',           lat: 12.9716, lng: 77.5946 },
  { name: 'Mysuru',              lat: 12.2958, lng: 76.6394 },
  // Kerala
  { name: 'Kochi',               lat: 9.9312,  lng: 76.2673 },
  { name: 'Thiruvananthapuram',  lat: 8.5241,  lng: 76.9366 },
  // Gujarat
  { name: 'Ahmedabad',           lat: 23.0225, lng: 72.5714 },
  { name: 'Surat',               lat: 21.1702, lng: 72.8311 },
  // Rajasthan
  { name: 'Jaipur',              lat: 26.9124, lng: 75.7873 },
  { name: 'Jodhpur',             lat: 26.2389, lng: 73.0243 },
  // Madhya Pradesh
  { name: 'Bhopal',              lat: 23.2599, lng: 77.4126 },
  { name: 'Indore',              lat: 22.7196, lng: 75.8577 },
  // Assam & Northeast
  { name: 'Guwahati',            lat: 26.1445, lng: 91.7362 },
  { name: 'Silchar',             lat: 24.8333, lng: 92.7789 },
  // Himachal & Uttarakhand
  { name: 'Shimla',              lat: 31.1048, lng: 77.1734 },
  { name: 'Dehradun',            lat: 30.3165, lng: 78.0322 },
  // Punjab & Haryana
  { name: 'Amritsar',            lat: 31.6340, lng: 74.8723 },
  { name: 'Chandigarh',          lat: 30.7333, lng: 76.7794 },
];

// Keep backward compat alias
export const MAHARASHTRA_LOCATIONS = INDIA_LOCATIONS;
