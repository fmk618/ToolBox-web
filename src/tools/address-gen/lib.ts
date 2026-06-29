// 地址 / 身份生成器 —— 纯本地随机数据，无任何网络请求。
// 生成用于测试 / 占位的虚构身份与地址；城市·州·邮编为真实组合，其余随机拼装。
// 仅供开发测试与占位，请勿用于欺诈、伪造身份等非法用途。
// 出于安全考虑，不生成银行卡 / 信用卡号等支付凭据。

export type CountryCode = "US" | "SG" | "UK";

export const COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: "SG", label: "新加坡" },
  { code: "US", label: "美国" },
  { code: "UK", label: "英国" },
];

export interface FakeIdentity {
  country: string;
  name: string;
  gender: "男" | "女";
  title: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  zip: string;
  fullAddress: string;
  birthday: string;
  age: number;
  height: string;
  weight: string;
  bloodType: string;
  company: string;
  occupation: string;
  email: string;
  username: string;
  password: string;
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const num = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const digits = (n: number) => Array.from({ length: n }, () => num(0, 9)).join("");

const FIRST_M = ["James", "John", "Michael", "David", "Robert", "William", "Daniel", "Joseph", "Thomas", "Andrew", "Ryan", "Brandon", "Kevin", "Eric", "Justin", "Wei Jie", "Jun Hao", "Kai Xiang"];
const FIRST_F = ["Mary", "Jennifer", "Linda", "Patricia", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen", "Emily", "Ashley", "Amanda", "Megan", "Rachel", "Laura", "Hui Min", "Li Ying", "Xin Yi"];
const LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Lee", "Tan", "Lim", "Ng", "Wong", "Chua", "Goh"];

const ST_NAMES = ["Main", "Oak", "Pine", "Maple", "Cedar", "Elm", "Washington", "Lake", "Hill", "Park", "Sunset", "River", "Spring", "Highland", "Lincoln", "Franklin"];
const ST_SUFFIX = ["St", "Ave", "Blvd", "Rd", "Dr", "Ln", "Way", "Ct", "Pl"];
const COMPANIES = ["Globex", "Initech", "Umbrella", "Soylent", "Vandelay", "Hooli", "Acme", "Stark Industries", "Wayne Enterprises", "Pied Piper", "Cyberdyne", "Massive Dynamic"];
const OCCUPATIONS = ["Software Engineer", "Teacher", "Nurse", "Accountant", "Sales Manager", "Graphic Designer", "Marketing Specialist", "Consultant", "Project Manager", "Data Analyst", "Chef", "Electrician", "Pharmacist", "Architect", "Lawyer", "Civil Engineer"];
const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "proton.me"];
const BLOOD = ["O", "A", "B", "AB"];

const US_CITIES = [
  { city: "New York", region: "NY", zip: "10001" },
  { city: "Los Angeles", region: "CA", zip: "90001" },
  { city: "Chicago", region: "IL", zip: "60601" },
  { city: "Houston", region: "TX", zip: "77001" },
  { city: "Phoenix", region: "AZ", zip: "85001" },
  { city: "Philadelphia", region: "PA", zip: "19101" },
  { city: "San Diego", region: "CA", zip: "92101" },
  { city: "Seattle", region: "WA", zip: "98101" },
  { city: "Denver", region: "CO", zip: "80201" },
  { city: "Boston", region: "MA", zip: "02101" },
  { city: "Miami", region: "FL", zip: "33101" },
  { city: "Atlanta", region: "GA", zip: "30301" },
];
const US_AREA = ["212", "213", "312", "713", "602", "215", "619", "206", "303", "617", "305", "404"];

const SG_AREAS = [
  { area: "Ang Mo Kio Ave 3", region: "North-East", postalPrefix: "56" },
  { area: "Bedok North Rd", region: "East", postalPrefix: "46" },
  { area: "Tampines St 21", region: "East", postalPrefix: "52" },
  { area: "Jurong West St 41", region: "West", postalPrefix: "64" },
  { area: "Woodlands Dr 50", region: "North", postalPrefix: "73" },
  { area: "Yishun Ring Rd", region: "North", postalPrefix: "76" },
  { area: "Clementi Ave 2", region: "West", postalPrefix: "12" },
  { area: "Hougang Ave 8", region: "North-East", postalPrefix: "53" },
  { area: "Bukit Batok St 25", region: "West", postalPrefix: "65" },
  { area: "Serangoon North Ave 1", region: "North-East", postalPrefix: "55" },
];

const UK_CITIES = [
  { city: "London", region: "England", area: "SW1A" },
  { city: "Manchester", region: "England", area: "M1" },
  { city: "Birmingham", region: "England", area: "B1" },
  { city: "Leeds", region: "England", area: "LS1" },
  { city: "Glasgow", region: "Scotland", area: "G1" },
  { city: "Liverpool", region: "England", area: "L1" },
  { city: "Edinburgh", region: "Scotland", area: "EH1" },
  { city: "Cardiff", region: "Wales", area: "CF10" },
];
const UK_STREETS = ["High St", "Station Rd", "Church Ln", "Victoria Rd", "King St", "Queen St", "Mill Ln", "Park Ave"];
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function birthInfo(): { birthday: string; age: number } {
  const thisYear = new Date().getFullYear();
  const year = num(thisYear - 60, thisYear - 18);
  const month = num(1, 12);
  const day = num(1, 28);
  const age = thisYear - year;
  const birthday = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { birthday, age };
}

function makePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const ds = "23456789";
  const sym = "!@#$%&*";
  let p = pick([...upper]) + pick([...sym]);
  for (let i = 0; i < 8; i++) p += pick([...(lower + upper + ds)]);
  return p;
}

export function generate(country: CountryCode): FakeIdentity {
  const female = Math.random() < 0.5;
  const first = pick(female ? FIRST_F : FIRST_M);
  const last = pick(LAST);
  const name = `${first} ${last}`;
  const gender: "男" | "女" = female ? "女" : "男";
  const title = female ? "Ms." : "Mr.";
  const { birthday, age } = birthInfo();
  const height = female
    ? `${num(155, 172)} cm`
    : `${num(165, 185)} cm`;
  const weight = female ? `${num(45, 68)} kg` : `${num(60, 90)} kg`;
  const bloodType = pick(BLOOD);
  const company = pick(COMPANIES);
  const occupation = pick(OCCUPATIONS);
  const sep = pick([".", "_", ""]);
  const email =
    `${first}${sep}${last}${num(1, 999)}`.toLowerCase().replace(/\s+/g, "") +
    "@" +
    pick(EMAIL_DOMAINS);
  const username = `${first}${last}${num(10, 99)}`.toLowerCase().replace(/\s+/g, "");
  const password = makePassword();

  const base = { name, gender, title, birthday, age, height, weight, bloodType, company, occupation, email, username, password };

  if (country === "SG") {
    const a = pick(SG_AREAS);
    const zip = a.postalPrefix + digits(4);
    const street = `Blk ${num(1, 899)} ${a.area}, #${num(1, 25)}-${num(1, 200)}`;
    return {
      ...base, country: "新加坡", phone: `+65 8${digits(3)} ${digits(4)}`,
      street, city: "Singapore", region: a.region, zip,
      fullAddress: `${street}, Singapore ${zip}`,
    };
  }
  if (country === "UK") {
    const c = pick(UK_CITIES);
    const zip = `${c.area} ${num(1, 9)}${pick([...LETTERS])}${pick([...LETTERS])}`;
    const street = `${num(1, 250)} ${pick(UK_STREETS)}`;
    return {
      ...base, country: "英国", phone: `+44 7${digits(3)} ${digits(6)}`,
      street, city: c.city, region: c.region, zip,
      fullAddress: `${street}, ${c.city}, ${zip}, UK`,
    };
  }
  // US
  const c = pick(US_CITIES);
  const street = `${num(100, 9899)} ${pick(ST_NAMES)} ${pick(ST_SUFFIX)}`;
  return {
    ...base, country: "美国", phone: `(${pick(US_AREA)}) ${digits(3)}-${digits(4)}`,
    street, city: c.city, region: c.region, zip: c.zip,
    fullAddress: `${street}, ${c.city}, ${c.region} ${c.zip}, USA`,
  };
}
