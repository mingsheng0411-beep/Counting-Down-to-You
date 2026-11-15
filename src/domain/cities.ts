import type { City } from "./types";

type Row = [
  id: string,
  en: string,
  zh: string,
  country: string,
  lat: number,
  lng: number,
  timeZone: string,
];

/**
 * Built-in city catalogue for V0. V1 replaces the lookup with a geocoding
 * service; the City shape stays the same.
 */
const rows: Row[] = [
  // East Asia
  ["beijing", "Beijing", "北京", "CN", 39.9, 116.41, "Asia/Shanghai"],
  ["shanghai", "Shanghai", "上海", "CN", 31.23, 121.47, "Asia/Shanghai"],
  ["guangzhou", "Guangzhou", "广州", "CN", 23.13, 113.26, "Asia/Shanghai"],
  ["shenzhen", "Shenzhen", "深圳", "CN", 22.54, 114.06, "Asia/Shanghai"],
  ["chengdu", "Chengdu", "成都", "CN", 30.57, 104.07, "Asia/Shanghai"],
  ["hangzhou", "Hangzhou", "杭州", "CN", 30.27, 120.16, "Asia/Shanghai"],
  ["wuhan", "Wuhan", "武汉", "CN", 30.59, 114.31, "Asia/Shanghai"],
  ["xian", "Xi'an", "西安", "CN", 34.34, 108.94, "Asia/Shanghai"],
  ["chongqing", "Chongqing", "重庆", "CN", 29.56, 106.55, "Asia/Shanghai"],
  ["nanjing", "Nanjing", "南京", "CN", 32.06, 118.8, "Asia/Shanghai"],
  ["hongkong", "Hong Kong", "香港", "HK", 22.32, 114.17, "Asia/Hong_Kong"],
  ["macau", "Macau", "澳门", "MO", 22.2, 113.54, "Asia/Macau"],
  ["taipei", "Taipei", "台北", "TW", 25.03, 121.57, "Asia/Taipei"],
  ["tokyo", "Tokyo", "东京", "JP", 35.68, 139.69, "Asia/Tokyo"],
  ["osaka", "Osaka", "大阪", "JP", 34.69, 135.5, "Asia/Tokyo"],
  ["kyoto", "Kyoto", "京都", "JP", 35.01, 135.77, "Asia/Tokyo"],
  ["seoul", "Seoul", "首尔", "KR", 37.57, 126.98, "Asia/Seoul"],
  ["busan", "Busan", "釜山", "KR", 35.18, 129.08, "Asia/Seoul"],
  ["ulaanbaatar", "Ulaanbaatar", "乌兰巴托", "MN", 47.89, 106.91, "Asia/Ulaanbaatar"],
  // Southeast and South Asia
  ["singapore", "Singapore", "新加坡", "SG", 1.35, 103.82, "Asia/Singapore"],
  ["kualalumpur", "Kuala Lumpur", "吉隆坡", "MY", 3.14, 101.69, "Asia/Kuala_Lumpur"],
  ["bangkok", "Bangkok", "曼谷", "TH", 13.76, 100.5, "Asia/Bangkok"],
  ["hanoi", "Hanoi", "河内", "VN", 21.03, 105.85, "Asia/Ho_Chi_Minh"],
  ["hochiminh", "Ho Chi Minh City", "胡志明市", "VN", 10.82, 106.63, "Asia/Ho_Chi_Minh"],
  ["jakarta", "Jakarta", "雅加达", "ID", -6.21, 106.85, "Asia/Jakarta"],
  ["manila", "Manila", "马尼拉", "PH", 14.6, 120.98, "Asia/Manila"],
  ["delhi", "New Delhi", "新德里", "IN", 28.61, 77.21, "Asia/Kolkata"],
  ["mumbai", "Mumbai", "孟买", "IN", 19.08, 72.88, "Asia/Kolkata"],
  ["bangalore", "Bengaluru", "班加罗尔", "IN", 12.97, 77.59, "Asia/Kolkata"],
  ["karachi", "Karachi", "卡拉奇", "PK", 24.86, 67.01, "Asia/Karachi"],
  ["dhaka", "Dhaka", "达卡", "BD", 23.81, 90.41, "Asia/Dhaka"],
  ["kathmandu", "Kathmandu", "加德满都", "NP", 27.72, 85.32, "Asia/Kathmandu"],
  ["colombo", "Colombo", "科伦坡", "LK", 6.93, 79.86, "Asia/Colombo"],
  // Central and West Asia
  ["almaty", "Almaty", "阿拉木图", "KZ", 43.24, 76.89, "Asia/Almaty"],
  ["dubai", "Dubai", "迪拜", "AE", 25.2, 55.27, "Asia/Dubai"],
  ["doha", "Doha", "多哈", "QA", 25.29, 51.53, "Asia/Qatar"],
  ["riyadh", "Riyadh", "利雅得", "SA", 24.71, 46.68, "Asia/Riyadh"],
  ["telaviv", "Tel Aviv", "特拉维夫", "IL", 32.09, 34.78, "Asia/Jerusalem"],
  ["istanbul", "Istanbul", "伊斯坦布尔", "TR", 41.01, 28.98, "Europe/Istanbul"],
  // Europe
  ["london", "London", "伦敦", "GB", 51.51, -0.13, "Europe/London"],
  ["manchester", "Manchester", "曼彻斯特", "GB", 53.48, -2.24, "Europe/London"],
  ["edinburgh", "Edinburgh", "爱丁堡", "GB", 55.95, -3.19, "Europe/London"],
  ["dublin", "Dublin", "都柏林", "IE", 53.35, -6.26, "Europe/Dublin"],
  ["paris", "Paris", "巴黎", "FR", 48.86, 2.35, "Europe/Paris"],
  ["lyon", "Lyon", "里昂", "FR", 45.76, 4.84, "Europe/Paris"],
  ["berlin", "Berlin", "柏林", "DE", 52.52, 13.4, "Europe/Berlin"],
  ["munich", "Munich", "慕尼黑", "DE", 48.14, 11.58, "Europe/Berlin"],
  ["frankfurt", "Frankfurt", "法兰克福", "DE", 50.11, 8.68, "Europe/Berlin"],
  ["hamburg", "Hamburg", "汉堡", "DE", 53.55, 9.99, "Europe/Berlin"],
  ["amsterdam", "Amsterdam", "阿姆斯特丹", "NL", 52.37, 4.9, "Europe/Amsterdam"],
  ["brussels", "Brussels", "布鲁塞尔", "BE", 50.85, 4.35, "Europe/Brussels"],
  ["zurich", "Zurich", "苏黎世", "CH", 47.38, 8.54, "Europe/Zurich"],
  ["geneva", "Geneva", "日内瓦", "CH", 46.2, 6.14, "Europe/Zurich"],
  ["vienna", "Vienna", "维也纳", "AT", 48.21, 16.37, "Europe/Vienna"],
  ["madrid", "Madrid", "马德里", "ES", 40.42, -3.7, "Europe/Madrid"],
  ["barcelona", "Barcelona", "巴塞罗那", "ES", 41.39, 2.17, "Europe/Madrid"],
  ["lisbon", "Lisbon", "里斯本", "PT", 38.72, -9.14, "Europe/Lisbon"],
  ["rome", "Rome", "罗马", "IT", 41.9, 12.5, "Europe/Rome"],
  ["milan", "Milan", "米兰", "IT", 45.46, 9.19, "Europe/Rome"],
  ["athens", "Athens", "雅典", "GR", 37.98, 23.73, "Europe/Athens"],
  ["stockholm", "Stockholm", "斯德哥尔摩", "SE", 59.33, 18.07, "Europe/Stockholm"],
  ["copenhagen", "Copenhagen", "哥本哈根", "DK", 55.68, 12.57, "Europe/Copenhagen"],
  ["oslo", "Oslo", "奥斯陆", "NO", 59.91, 10.75, "Europe/Oslo"],
  ["helsinki", "Helsinki", "赫尔辛基", "FI", 60.17, 24.94, "Europe/Helsinki"],
  ["warsaw", "Warsaw", "华沙", "PL", 52.23, 21.01, "Europe/Warsaw"],
  ["prague", "Prague", "布拉格", "CZ", 50.08, 14.44, "Europe/Prague"],
  ["budapest", "Budapest", "布达佩斯", "HU", 47.5, 19.04, "Europe/Budapest"],
  ["moscow", "Moscow", "莫斯科", "RU", 55.76, 37.62, "Europe/Moscow"],
  ["saintpetersburg", "Saint Petersburg", "圣彼得堡", "RU", 59.93, 30.34, "Europe/Moscow"],
  ["kyiv", "Kyiv", "基辅", "UA", 50.45, 30.52, "Europe/Kiev"],
  ["reykjavik", "Reykjavik", "雷克雅未克", "IS", 64.15, -21.94, "Atlantic/Reykjavik"],
  // North America
  ["maryland", "Maryland", "马里兰", "US", 39.05, -76.9, "America/New_York"],
  ["newyork", "New York", "纽约", "US", 40.71, -74.01, "America/New_York"],
  ["boston", "Boston", "波士顿", "US", 42.36, -71.06, "America/New_York"],
  ["washington", "Washington, D.C.", "华盛顿", "US", 38.91, -77.04, "America/New_York"],
  ["philadelphia", "Philadelphia", "费城", "US", 39.95, -75.17, "America/New_York"],
  ["atlanta", "Atlanta", "亚特兰大", "US", 33.75, -84.39, "America/New_York"],
  ["miami", "Miami", "迈阿密", "US", 25.76, -80.19, "America/New_York"],
  ["chicago", "Chicago", "芝加哥", "US", 41.88, -87.63, "America/Chicago"],
  ["houston", "Houston", "休斯敦", "US", 29.76, -95.37, "America/Chicago"],
  ["dallas", "Dallas", "达拉斯", "US", 32.78, -96.8, "America/Chicago"],
  ["austin", "Austin", "奥斯汀", "US", 30.27, -97.74, "America/Chicago"],
  ["denver", "Denver", "丹佛", "US", 39.74, -104.99, "America/Denver"],
  ["phoenix", "Phoenix", "菲尼克斯", "US", 33.45, -112.07, "America/Phoenix"],
  ["losangeles", "Los Angeles", "洛杉矶", "US", 34.05, -118.24, "America/Los_Angeles"],
  ["sanfrancisco", "San Francisco", "旧金山", "US", 37.77, -122.42, "America/Los_Angeles"],
  ["sandiego", "San Diego", "圣迭戈", "US", 32.72, -117.16, "America/Los_Angeles"],
  ["seattle", "Seattle", "西雅图", "US", 47.61, -122.33, "America/Los_Angeles"],
  ["lasvegas", "Las Vegas", "拉斯维加斯", "US", 36.17, -115.14, "America/Los_Angeles"],
  ["honolulu", "Honolulu", "檀香山", "US", 21.31, -157.86, "Pacific/Honolulu"],
  ["toronto", "Toronto", "多伦多", "CA", 43.65, -79.38, "America/Toronto"],
  ["montreal", "Montreal", "蒙特利尔", "CA", 45.5, -73.57, "America/Toronto"],
  ["ottawa", "Ottawa", "渥太华", "CA", 45.42, -75.7, "America/Toronto"],
  ["vancouver", "Vancouver", "温哥华", "CA", 49.28, -123.12, "America/Vancouver"],
  ["calgary", "Calgary", "卡尔加里", "CA", 51.05, -114.07, "America/Edmonton"],
  ["mexicocity", "Mexico City", "墨西哥城", "MX", 19.43, -99.13, "America/Mexico_City"],
  // South America
  ["saopaulo", "São Paulo", "圣保罗", "BR", -23.55, -46.63, "America/Sao_Paulo"],
  ["riodejaneiro", "Rio de Janeiro", "里约热内卢", "BR", -22.91, -43.17, "America/Sao_Paulo"],
  ["buenosaires", "Buenos Aires", "布宜诺斯艾利斯", "AR", -34.6, -58.38, "America/Argentina/Buenos_Aires"],
  ["santiago", "Santiago", "圣地亚哥", "CL", -33.45, -70.67, "America/Santiago"],
  ["lima", "Lima", "利马", "PE", -12.05, -77.04, "America/Lima"],
  ["bogota", "Bogotá", "波哥大", "CO", 4.71, -74.07, "America/Bogota"],
  // Oceania
  ["sydney", "Sydney", "悉尼", "AU", -33.87, 151.21, "Australia/Sydney"],
  ["melbourne", "Melbourne", "墨尔本", "AU", -37.81, 144.96, "Australia/Melbourne"],
  ["brisbane", "Brisbane", "布里斯班", "AU", -27.47, 153.03, "Australia/Brisbane"],
  ["perth", "Perth", "珀斯", "AU", -31.95, 115.86, "Australia/Perth"],
  ["adelaide", "Adelaide", "阿德莱德", "AU", -34.93, 138.6, "Australia/Adelaide"],
  ["auckland", "Auckland", "奥克兰", "NZ", -36.85, 174.76, "Pacific/Auckland"],
  ["wellington", "Wellington", "惠灵顿", "NZ", -41.29, 174.78, "Pacific/Auckland"],
  // Africa
  ["cairo", "Cairo", "开罗", "EG", 30.04, 31.24, "Africa/Cairo"],
  ["johannesburg", "Johannesburg", "约翰内斯堡", "ZA", -26.2, 28.05, "Africa/Johannesburg"],
  ["capetown", "Cape Town", "开普敦", "ZA", -33.92, 18.42, "Africa/Johannesburg"],
  ["nairobi", "Nairobi", "内罗毕", "KE", -1.29, 36.82, "Africa/Nairobi"],
  ["lagos", "Lagos", "拉各斯", "NG", 6.52, 3.38, "Africa/Lagos"],
  ["casablanca", "Casablanca", "卡萨布兰卡", "MA", 33.57, -7.59, "Africa/Casablanca"],
  ["accra", "Accra", "阿克拉", "GH", 5.6, -0.19, "Africa/Accra"],
  ["addisababa", "Addis Ababa", "亚的斯亚贝巴", "ET", 9.03, 38.74, "Africa/Addis_Ababa"],
];

export const cities: City[] = rows.map(
  ([id, en, zh, country, lat, lng, timeZone]) => ({
    id,
    name: { en, zh },
    country,
    lat,
    lng,
    timeZone,
  }),
);

const byId = new Map(cities.map((city) => [city.id, city]));

export function getCity(id: string): City {
  const city = byId.get(id);
  if (!city) throw new Error(`Unknown city: ${id}`);
  return city;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s.,'-]/g, "");

/** Matches a query against city names in every language, prefix matches first. */
export function searchCities(query: string): City[] {
  const q = normalize(query);
  if (!q) return cities;
  const starts: City[] = [];
  const contains: City[] = [];
  for (const city of cities) {
    const names = [city.id, ...Object.values(city.name)].map((name) =>
      normalize(name ?? ""),
    );
    if (names.some((name) => name.startsWith(q))) starts.push(city);
    else if (names.some((name) => name.includes(q))) contains.push(city);
  }
  return [...starts, ...contains];
}
