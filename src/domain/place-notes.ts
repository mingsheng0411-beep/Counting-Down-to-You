import type { LocalizedText } from "./types";

/**
 * Cities shown as small dots on the map for anyone to explore, besides the
 * couple's own two places.
 */
export const featuredCityIds = [
  "tokyo",
  "seoul",
  "shanghai",
  "beijing",
  "hongkong",
  "singapore",
  "bangkok",
  "dubai",
  "paris",
  "london",
  "rome",
  "newyork",
  "losangeles",
  "sydney",
];

/**
 * Short introductions written for this project, keyed by city id. They are
 * the fallback when the encyclopedia cannot be reached, which is the normal
 * case in mainland China, so the cities there are the ones covered.
 */
export const placeNotes: Record<string, LocalizedText> = {
  beijing: {
    zh: "北京是中国的首都，也是一座有三千多年建城史的古都。故宫、天坛、颐和园和城外的长城，与胡同里的日常生活挨在一起。秋天是这里最好的季节。",
    en: "Beijing is the capital of China and a city with more than three thousand years of history. The Forbidden City, the Temple of Heaven, the Summer Palace and the Great Wall beyond the city sit alongside everyday life in the hutong alleys. Autumn is its finest season.",
  },
  shanghai: {
    zh: "上海位于长江入海口，是中国人口最多的城市之一，也是重要的金融和航运中心。外滩的老建筑与对岸陆家嘴的高楼隔着黄浦江相望，梧桐树下的老街区适合慢慢走。",
    en: "Shanghai sits where the Yangtze meets the sea. It is one of China's most populous cities and a major centre of finance and shipping. The old buildings of the Bund face the towers of Lujiazui across the Huangpu River, and the plane-tree-lined old quarters are made for slow walks.",
  },
  guangzhou: {
    zh: "广州是广东省的省会，位于珠江三角洲，两千多年来一直是对外贸易的港口城市。这里是粤菜和早茶的故乡，气候温暖，一年四季都有花开。",
    en: "Guangzhou is the capital of Guangdong province on the Pearl River Delta, and has been a trading port for more than two thousand years. It is the home of Cantonese food and morning tea, with a warm climate and flowers in every season.",
  },
  shenzhen: {
    zh: "深圳与香港相邻，几十年间从边陲小镇发展成一座以科技和设计闻名的年轻城市。城市依山面海，公园和海岸线很多。",
    en: "Shenzhen, next to Hong Kong, grew within a few decades from a border town into a young city known for technology and design. It lies between hills and the sea, with plenty of parks and coastline.",
  },
  chengdu: {
    zh: "成都是四川省的省会，坐落在成都平原上，以悠闲的生活节奏、川菜和火锅闻名。这里也是大熊猫的故乡，茶馆和小巷是城市的日常。",
    en: "Chengdu, the capital of Sichuan province, sits on the Chengdu Plain and is known for its unhurried pace, Sichuan food and hotpot. It is also the home of the giant panda, and teahouses and lanes are part of daily life.",
  },
  hangzhou: {
    zh: "杭州是浙江省的省会，因西湖而闻名。湖边的山、茶园和寺庙离市区很近，龙井茶产自这里。春天和秋天来最舒服。",
    en: "Hangzhou, the capital of Zhejiang province, is famous for West Lake. Hills, tea fields and temples lie close to the centre, and Longjing tea comes from here. Spring and autumn are the most pleasant times to visit.",
  },
  wuhan: {
    zh: "武汉是湖北省的省会，长江和汉江在这里交汇，把城市分成武昌、汉口、汉阳三镇。黄鹤楼和东湖是最知名的去处，一碗热干面是当地人一天的开始。春天樱花盛开。",
    en: "Wuhan is the capital of Hubei province, where the Yangtze and Han rivers meet and divide the city into Wuchang, Hankou and Hanyang. The Yellow Crane Tower and East Lake are its best-known sights, and a bowl of hot dry noodles is how locals start the day. Cherry blossoms arrive in spring.",
  },
  xian: {
    zh: "西安是陕西省的省会，古称长安，是中国历史上多个朝代的都城，也是丝绸之路的起点。兵马俑、古城墙和大雁塔都在这里，面食种类很多。",
    en: "Xi'an, the capital of Shaanxi province and once called Chang'an, was the capital of several Chinese dynasties and the starting point of the Silk Road. The Terracotta Army, the old city wall and the Giant Wild Goose Pagoda are here, along with a great variety of noodles.",
  },
  chongqing: {
    zh: "重庆是中国西南的直辖市，建在长江和嘉陵江交汇处的山地上，道路和楼房高低错落。这里以火锅和夜景闻名，夏天很热。",
    en: "Chongqing is a municipality in southwest China built on hills where the Yangtze and Jialing rivers meet, with roads and buildings stacked at every height. It is known for hotpot and its night views, and summers are very hot.",
  },
  nanjing: {
    zh: "南京是江苏省的省会，位于长江下游，历史上多次作为都城。明城墙、中山陵和秦淮河是城市的标志，秋天满城梧桐变成金色。",
    en: "Nanjing, the capital of Jiangsu province on the lower Yangtze, has served as a capital many times in history. The Ming city wall, the Sun Yat-sen Mausoleum and the Qinhuai River are its landmarks, and in autumn its plane trees turn gold.",
  },
  hongkong: {
    zh: "香港位于珠江口东侧，由香港岛、九龙和新界组成，是重要的国际金融中心。维多利亚港两岸高楼密集，而城市的大部分土地其实是山和郊野公园。",
    en: "Hong Kong lies on the eastern side of the Pearl River estuary and is made up of Hong Kong Island, Kowloon and the New Territories. It is a major international financial centre. Towers crowd both sides of Victoria Harbour, yet most of its land is hills and country parks.",
  },
  macau: {
    zh: "澳门位于珠江口西侧，面积很小，中西文化在这里长期共处。老城区的教堂、庙宇和葡式街道被列入世界遗产，葡式蛋挞很有名。",
    en: "Macau lies on the western side of the Pearl River estuary. It is very small, and Chinese and Western cultures have long lived side by side here. The churches, temples and Portuguese-style streets of its old town are a World Heritage site, and its egg tarts are famous.",
  },
  taipei: {
    zh: "台北位于台湾岛北部的盆地里，四周环山。夜市小吃、街角的书店和近郊的温泉、山径是这座城市的特色，台北101是最显眼的地标。",
    en: "Taipei lies in a basin in the north of the island of Taiwan, ringed by hills. Night-market food, corner bookshops, and hot springs and trails close to the centre give the city its character, and Taipei 101 is its most visible landmark.",
  },
};
