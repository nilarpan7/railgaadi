import json
import random

stations = [
    ("NDLS", "New Delhi", 28.6423, 77.2199, "Delhi"),
    ("BCT", "Mumbai Central", 18.9712, 72.8197, "Maharashtra"),
    ("CSTM", "Mumbai CST", 18.9398, 72.8355, "Maharashtra"),
    ("HWH", "Howrah Jn", 22.5839, 88.3428, "West Bengal"),
    ("MAS", "Chennai Central", 13.0827, 80.2707, "Tamil Nadu"),
    ("SBC", "Bangalore City", 12.9784, 77.5713, "Karnataka"),
    ("JP", "Jaipur Jn", 26.9196, 75.7878, "Rajasthan"),
    ("ADI", "Ahmedabad Jn", 23.0225, 72.5714, "Gujarat"),
    ("PUNE", "Pune Jn", 18.5285, 73.8742, "Maharashtra"),
    ("LKO", "Lucknow", 26.8467, 80.9462, "Uttar Pradesh"),
    ("BPL", "Bhopal Jn", 23.2687, 77.4133, "Madhya Pradesh"),
    ("AGC", "Agra Cantt", 27.1631, 78.0081, "Uttar Pradesh"),
    ("CNB", "Kanpur Central", 26.4534, 80.3495, "Uttar Pradesh"),
    ("ALD", "Prayagraj Jn", 25.4358, 81.8463, "Uttar Pradesh"),
    ("MGS", "Mughal Sarai Jn", 25.2838, 83.1189, "Uttar Pradesh"),
    ("BSB", "Varanasi Jn", 25.3176, 83.0236, "Uttar Pradesh"),
    ("PNBE", "Patna Jn", 25.6073, 85.0960, "Bihar"),
    ("GHY", "Guwahati", 26.1864, 91.7530, "Assam"),
    ("BBS", "Bhubaneswar", 20.2681, 85.8378, "Odisha"),
    ("SC", "Secunderabad Jn", 17.4334, 78.5033, "Telangana"),
    ("HYB", "Hyderabad", 17.3850, 78.4867, "Telangana"),
    ("KTR", "Kota Jn", 25.1793, 75.8577, "Rajasthan"),
    ("RTM", "Ratlam Jn", 23.3255, 75.0572, "Madhya Pradesh"),
    ("BRC", "Vadodara Jn", 22.3106, 73.1812, "Gujarat"),
    ("ST", "Surat", 21.2059, 72.8398, "Gujarat"),
    ("NZM", "Hazrat Nizamuddin", 28.5895, 77.2530, "Delhi"),
    ("GWL", "Gwalior Jn", 26.2182, 78.1828, "Madhya Pradesh"),
    ("JHS", "Jhansi Jn", 25.4432, 78.5685, "Uttar Pradesh"),
    ("BZA", "Vijayawada Jn", 16.5175, 80.6200, "Andhra Pradesh"),
    ("MYS", "Mysore Jn", 12.2958, 76.6394, "Karnataka"),
    ("TCR", "Thrissur", 10.5303, 76.2137, "Kerala"),
    ("TVC", "Trivandrum Central", 8.4875, 76.9525, "Kerala"),
    ("ERN", "Ernakulam Town", 9.9880, 76.2801, "Kerala"),
    ("MAQ", "Mangaluru Central", 12.8624, 74.8396, "Karnataka"),
    ("CLT", "Kozhikode", 11.2588, 75.7804, "Kerala"),
    ("CAN", "Kannur", 11.8745, 75.3704, "Kerala"),
    ("PGT", "Palakkad Jn", 10.7725, 76.6491, "Kerala"),
    ("CBE", "Coimbatore Jn", 11.0168, 76.9558, "Tamil Nadu"),
    ("ED", "Erode Jn", 11.3411, 77.7172, "Tamil Nadu"),
    ("SA", "Salem Jn", 11.6683, 78.1408, "Tamil Nadu"),
    ("KPD", "Katpadi Jn", 12.9691, 79.1389, "Tamil Nadu"),
    ("RU", "Renigunta Jn", 13.6338, 79.5222, "Andhra Pradesh"),
    ("GDR", "Gudur Jn", 14.1465, 79.8458, "Andhra Pradesh"),
    ("NLR", "Nellore", 14.4426, 79.9865, "Andhra Pradesh"),
    ("OGL", "Ongole", 15.5057, 80.0499, "Andhra Pradesh"),
    ("WL", "Warangal", 17.9818, 79.5888, "Telangana"),
    ("BPQ", "Balharshah", 19.8491, 79.3523, "Maharashtra"),
    ("NGP", "Nagpur", 21.1458, 79.0882, "Maharashtra"),
    ("ET", "Itarsi Jn", 22.6105, 77.7655, "Madhya Pradesh"),
    ("RKMP", "Rani Kamlapati", 23.2185, 77.4334, "Madhya Pradesh"),
    ("PRYJ", "Prayagraj Jn", 25.4358, 81.8463, "Uttar Pradesh"),
    ("DDU", "Pt. DD Upadhyaya Jn", 25.2838, 83.1189, "Uttar Pradesh"),
    ("GAYA", "Gaya Jn", 24.7955, 85.0064, "Bihar"),
    ("DHN", "Dhanbad Jn", 23.7915, 86.4304, "Jharkhand"),
    ("ASN", "Asansol Jn", 23.6739, 86.9524, "West Bengal"),
    ("BWN", "Barddhaman Jn", 23.2324, 87.8615, "West Bengal"),
    ("SDAH", "Sealdah", 22.5695, 88.3712, "West Bengal"),
    ("VSKP", "Visakhapatnam", 17.7292, 83.3015, "Andhra Pradesh"),
    ("KUR", "Khurda Road Jn", 20.1706, 85.6791, "Odisha"),
    ("KGP", "Kharagpur Jn", 22.3276, 87.3195, "West Bengal"),
    ("TATA", "Tatanagar Jn", 22.7758, 86.1950, "Jharkhand"),
    ("R", "Raipur Jn", 21.2514, 81.6296, "Chhattisgarh"),
    ("BSP", "Bilaspur Jn", 22.0805, 82.1487, "Chhattisgarh"),
    ("ROU", "Rourkela", 22.2173, 84.8722, "Odisha"),
    ("HTE", "Hatia", 23.3130, 85.3135, "Jharkhand"),
    ("RNC", "Ranchi", 23.3601, 85.3262, "Jharkhand"),
    ("DNR", "Danapur", 25.5901, 85.0450, "Bihar"),
    ("PPTA", "Patliputra Jn", 25.6420, 85.0877, "Bihar"),
    ("MFP", "Muzaffarpur Jn", 26.1194, 85.3912, "Bihar"),
    ("SPJ", "Samastipur Jn", 25.8659, 85.7876, "Bihar"),
    ("BJU", "Barauni Jn", 25.4379, 85.9961, "Bihar"),
    ("KIR", "Katihar Jn", 25.5463, 87.5684, "Bihar"),
    ("NJP", "New Jalpaiguri", 26.6853, 88.4357, "West Bengal"),
    ("NCB", "New Cooch Behar", 26.3382, 89.4674, "West Bengal"),
    ("NBQ", "New Bongaigaon", 26.4883, 90.5401, "Assam"),
    ("RNY", "Rangiya Jn", 26.4385, 91.6247, "Assam"),
    ("DBRG", "Dibrugarh", 27.4646, 94.9080, "Assam"),
    ("TSK", "Tinsukia", 27.4886, 95.3524, "Assam"),
    ("LMG", "Lumding Jn", 25.7505, 93.1764, "Assam"),
    ("SCL", "Silchar", 24.8329, 92.7932, "Assam"),
    ("AGTL", "Agartala", 23.8315, 91.2868, "Tripura"),
    ("DDN", "Dehradun", 30.3165, 78.0322, "Uttarakhand"),
    ("HW", "Haridwar", 29.9457, 78.1642, "Uttarakhand"),
    ("RK", "Roorkee", 29.8543, 77.8880, "Uttarakhand"),
    ("SRE", "Saharanpur Jn", 29.9679, 77.5458, "Uttar Pradesh"),
    ("UMB", "Ambala Cantt Jn", 30.3340, 76.8441, "Haryana"),
    ("CDG", "Chandigarh", 30.7333, 76.7794, "Chandigarh"),
    ("KLK", "Kalka", 30.8354, 76.9402, "Haryana"),
    ("LDH", "Ludhiana Jn", 30.9084, 75.8550, "Punjab"),
    ("JUC", "Jalandhar City", 31.3260, 75.5762, "Punjab"),
    ("ASR", "Amritsar Jn", 31.6340, 74.8723, "Punjab"),
    ("PTK", "Pathankot", 32.2687, 75.6483, "Punjab"),
    ("JAT", "Jammu Tawi", 32.7099, 74.8824, "Jammu and Kashmir"),
    ("UHP", "Udhampur", 32.9234, 75.1437, "Jammu and Kashmir"),
    ("SVDK", "SMVD Katra", 32.9901, 74.9332, "Jammu and Kashmir"),
    ("BDTS", "Bandra Terminus", 19.0601, 72.8404, "Maharashtra"),
    ("LTT", "Lokmanya Tilak Terminus", 19.0694, 72.8913, "Maharashtra"),
    ("DR", "Dadar Central", 19.0191, 72.8427, "Maharashtra"),
    ("TNA", "Thane", 19.1856, 72.9772, "Maharashtra"),
    ("KYN", "Kalyan Jn", 19.2384, 73.1293, "Maharashtra"),
    ("BSR", "Vasai Road", 19.3820, 72.8272, "Maharashtra"),
    ("VAPI", "Vapi", 20.3734, 72.9152, "Gujarat"),
    ("BL", "Valsad", 20.6139, 72.9348, "Gujarat"),
    ("NVS", "Navsari", 20.9501, 72.9268, "Gujarat"),
    ("BH", "Bharuch Jn", 21.7051, 72.9959, "Gujarat"),
    ("ANND", "Anand Jn", 22.5600, 72.9669, "Gujarat"),
    ("ND", "Nadiad Jn", 22.6953, 72.8631, "Gujarat"),
    ("SUNR", "Surendranagar", 22.7237, 71.6375, "Gujarat"),
    ("RJT", "Rajkot Jn", 22.3175, 70.8038, "Gujarat"),
    ("JAM", "Jamnagar", 22.4842, 70.0638, "Gujarat"),
    ("OKHA", "Okha", 22.4678, 69.0118, "Gujarat"),
    ("PBR", "Porbandar", 21.6425, 69.6015, "Gujarat"),
    ("BVC", "Bhavnagar Terminus", 21.7770, 72.1384, "Gujarat"),
    ("JU", "Jodhpur Jn", 26.2736, 73.0270, "Rajasthan"),
    ("BKN", "Bikaner Jn", 28.0163, 73.3171, "Rajasthan"),
    ("JSM", "Jaisalmer", 26.9056, 70.9169, "Rajasthan"),
    ("AII", "Ajmer Jn", 26.4516, 74.6366, "Rajasthan"),
    ("UDZ", "Udaipur City", 24.5772, 73.6961, "Rajasthan"),
    ("ABR", "Abu Road", 24.4789, 72.7842, "Rajasthan"),
    ("PNU", "Palanpur Jn", 24.1685, 72.3270, "Gujarat"),
    ("MS", "Chennai Egmore", 13.0784, 80.2609, "Tamil Nadu"),
    ("TBM", "Tambaram", 12.9272, 80.1116, "Tamil Nadu"),
    ("CGL", "Chengalpattu", 12.6934, 79.9765, "Tamil Nadu"),
    ("VM", "Villupuram Jn", 11.9388, 79.4990, "Tamil Nadu"),
    ("TPJ", "Tiruchchirappalli Jn", 10.8066, 78.6830, "Tamil Nadu"),
    ("MDU", "Madurai Jn", 9.9255, 78.1147, "Tamil Nadu"),
    ("TEN", "Tirunelveli Jn", 8.7288, 77.7088, "Tamil Nadu"),
    ("NCJ", "Nagercoil Jn", 8.1887, 77.4264, "Tamil Nadu"),
    ("CAPE", "Kanniyakumari", 8.0872, 77.5381, "Tamil Nadu"),
    ("KCVL", "Kochuveli", 8.5284, 76.8973, "Kerala"),
    ("QLN", "Kollam Jn", 8.8872, 76.5947, "Kerala"),
    ("KYJ", "Kayamkulam Jn", 9.1764, 76.5055, "Kerala"),
    ("ALLP", "Alappuzha", 9.4900, 76.3264, "Kerala"),
    ("KTYM", "Kottayam", 9.5855, 76.5361, "Kerala"),
    ("MAO", "Madgaon Jn", 15.2801, 73.9669, "Goa"),
    ("KRMI", "Karmali", 15.5186, 73.9231, "Goa"),
    ("RN", "Ratnagiri", 16.9946, 73.3275, "Maharashtra"),
    ("PNVL", "Panvel", 18.9902, 73.1166, "Maharashtra")
]

train_data = [
    ("12952", "Mumbai Rajdhani", "NDLS", "BCT", "Rajdhani"),
    ("12301", "Howrah Rajdhani", "NDLS", "HWH", "Rajdhani"),
    ("12002", "Bhopal Shatabdi", "NDLS", "BPL", "Shatabdi"),
    ("12622", "Tamil Nadu Express", "NDLS", "MAS", "SuperFast"),
    ("12434", "Chennai Rajdhani", "NZM", "MAS", "Rajdhani"),
    ("22691", "Bangalore Rajdhani", "NZM", "SBC", "Rajdhani"),
    ("12627", "Karnataka Express", "NDLS", "SBC", "SuperFast"),
    ("12951", "Mumbai Rajdhani", "BCT", "NDLS", "Rajdhani"),
    ("12259", "Sealdah Duronto", "NDLS", "HWH", "Duronto"),
    ("12009", "Ahmedabad Shatabdi", "BCT", "ADI", "Shatabdi"),
    ("22436", "Vande Bharat Express", "NDLS", "BSB", "Vande Bharat"),
    ("20608", "Vande Bharat Express", "MYS", "MAS", "Vande Bharat"),
    ("20901", "Vande Bharat Express", "BCT", "GNC", "Vande Bharat"),
    ("20833", "Vande Bharat Express", "SC", "VSKP", "Vande Bharat"),
    ("12431", "Trivandrum Rajdhani", "NZM", "TVC", "Rajdhani"),
    ("12423", "Dibrugarh Rajdhani", "NDLS", "DBRG", "Rajdhani"),
    ("12437", "Secunderabad Rajdhani", "NZM", "SC", "Rajdhani"),
    ("12055", "Dehradun Janshatabdi", "NDLS", "DDN", "Janshatabdi"),
    ("12004", "Lucknow Shatabdi", "NDLS", "LKO", "Shatabdi"),
    ("12011", "Kalka Shatabdi", "NDLS", "KLK", "Shatabdi"),
    ("12015", "Ajmer Shatabdi", "NDLS", "AII", "Shatabdi"),
    ("12260", "Sealdah Duronto", "SDAH", "NDLS", "Duronto"),
    ("12267", "Ahmedabad Duronto", "BCT", "ADI", "Duronto"),
    ("12213", "Delhi Sarai Rohilla Duronto", "YPR", "DEE", "Duronto"),
    ("12909", "Bandra Garib Rath", "BDTS", "NZM", "Garib Rath"),
    ("12616", "Grand Trunk Express", "NDLS", "MAS", "Express"),
    ("12839", "Howrah Mail", "MAS", "HWH", "Mail"),
    ("16527", "Bangalore Express", "SBC", "MYS", "Express"),
    ("11019", "Konark Express", "CSTM", "BBS", "Express"),
    ("18047", "Amaravati Express", "HWH", "VSG", "Express"),
    ("12727", "Godavari Express", "VSKP", "HYB", "SuperFast"),
    ("12841", "Coromandel Express", "HWH", "MAS", "SuperFast"),
    ("12137", "Punjab Mail", "CSTM", "FZR", "Mail"),
    ("12625", "Kerala Express", "TVC", "NDLS", "SuperFast"),
    ("12801", "Purushottam Express", "PURI", "NDLS", "SuperFast"),
    ("12417", "Prayagraj Express", "PRYJ", "NDLS", "SuperFast"),
    ("12791", "Secunderabad Express", "SC", "PNBE", "Express"),
    ("12101", "Jnaneswari Express", "LTT", "HWH", "SuperFast"),
    ("11005", "Puducherry Express", "DR", "PDY", "Express"),
    ("12296", "Sanghamitra Express", "DNR", "SBC", "SuperFast")
]

stations_map = {s[0]: s for s in stations}

print('import type { Train, Station, LiveStatus, StationStatus } from \'@/types/train\';')
print('import type { RouteData, RouteStation } from \'@/types/route\';')
print('import type { WeatherData } from \'@/types/weather\';')
print('import type { ElevationPoint, ElevationProfile } from \'@/types/elevation\';')
print('import type { NearbyPlace } from \'@/types/nearby\';')
print('')
print('export const STATIONS: Record<string, Station> = {')
for s in stations:
    print(f"  {s[0]}: {{ code: '{s[0]}', name: '{s[1]}', lat: {s[2]}, lng: {s[3]}, state: '{s[4]}' }},")
print('};')
print('')
print('export const TRAINS: Train[] = [')
for t in train_data:
    if t[2] not in stations_map or t[3] not in stations_map:
        continue
    dep_h = random.randint(5, 23)
    dep_m = random.choice([0, 15, 30, 45])
    dur_h = random.randint(5, 35)
    dur_m = random.choice([0, 15, 30, 45])
    dist = random.randint(300, 2500)
    stops = random.randint(2, 25)
    arr_h = (dep_h + dur_h) % 24
    arr_m = (dep_m + dur_m) % 60
    if dep_m + dur_m >= 60:
        arr_h = (arr_h + 1) % 24
    
    print('  {')
    print(f"    id: '{t[0]}',")
    print(f"    number: '{t[0]}',")
    print(f"    name: '{t[1]}',")
    print(f"    source: STATIONS.{t[2]},")
    print(f"    destination: STATIONS.{t[3]},")
    print(f"    type: '{t[4]}',")
    print("    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],")
    print(f"    departureTime: '{dep_h:02d}:{dep_m:02d}',")
    print(f"    arrivalTime: '{arr_h:02d}:{arr_m:02d}',")
    print(f"    duration: '{dur_h}h {dur_m}m',")
    print(f"    totalDistance: {dist},")
    print(f"    numberOfStops: {stops},")
    print('  },')
print('];')
print('')
print('''
export function searchMockTrains(query: string): Train[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return TRAINS.filter(
    (t) =>
      t.number.includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.source.name.toLowerCase().includes(q) ||
      t.destination.name.toLowerCase().includes(q) ||
      t.source.code.toLowerCase().includes(q) ||
      t.destination.code.toLowerCase().includes(q)
  );
}

export const POPULAR_TRAINS = TRAINS.slice(0, 8);
''')
