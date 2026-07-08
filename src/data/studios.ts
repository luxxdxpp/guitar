export interface Room {
  name: string;
  capacity: number;
  pricePerHour: number;
  gear: string[];
}

export interface RentableInstrument {
  name: string;
  type: 'guitar' | 'bass' | 'keyboard' | 'other';
  pricePerHour: number;
  description: string;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  content: string;
  date: string;
}

export interface Studio {
  id: string;
  name: string;
  region: 'Hongdae' | 'Hapjeong' | 'Gangnam' | 'Sinchon' | 'Seongsu';
  address: string;
  tel: string;
  latitude: number;
  longitude: number;
  description: string;
  rating: number;
  reviewCount: number;
  advantages: string[];
  image: string;
  rooms: Room[];
  rentInstruments: RentableInstrument[];
  hasGuitarRental: boolean;
  reviews: Review[];
}

export const INITIAL_STUDIOS: Studio[] = [
  {
    id: 'studio-1',
    name: '뮤즈 합주실 (Muse Studio)',
    region: 'Hongdae',
    address: '서울특별시 마포구 와우산로29길 15 지하 1층',
    tel: '02-332-9876',
    latitude: 37.5558,
    longitude: 126.9245,
    description: '홍대입구역 7번 출구 도보 3분 거리의 최상의 장비와 방음을 자랑하는 홍대 대표 합주실입니다. 프로 밴드를 위한 고가의 튜브 앰프 및 고급 드럼 세트 완비.',
    rating: 4.8,
    reviewCount: 24,
    advantages: ['최고급 진공관 앰프', '역세권 도보 3분', '전문 사운드 튜닝', '기타 대여 품목 다양'],
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600&auto=format&fit=crop',
    hasGuitarRental: true,
    rooms: [
      {
        name: 'A룸 (대형)',
        capacity: 10,
        pricePerHour: 20000,
        gear: ['Marshall JCM2000', 'Fender Twin Reverb', 'Ampeg SVT-4PRO', 'Tama Starclassic', 'Yamaha S90XS'],
      },
      {
        name: 'B룸 (중형)',
        capacity: 6,
        pricePerHour: 15000,
        gear: ['Marshall DSL100', 'Vox AC30', 'Hartke LH1000', 'Pearl Decade', 'Kurzweil SP6'],
      },
      {
        name: 'C룸 (개인/소형)',
        capacity: 3,
        pricePerHour: 10000,
        gear: ['Fender Champion 100', 'Line6 Spider', 'Ashdown MAG300', 'Roland RD-88'],
      },
    ],
    rentInstruments: [
      { name: 'Fender Standard Stratocaster', type: 'guitar', pricePerHour: 2000, description: '오리지널 펜더의 청량한 싱글코일 톤' },
      { name: 'Gibson Les Paul Studio', type: 'guitar', pricePerHour: 3000, description: '묵직하고 따뜻한 깁슨 험버커 사운드' },
      { name: 'Fender Jazz Bass', type: 'bass', pricePerHour: 2000, description: '다양한 장르에 어울리는 베이스의 정석' },
      { name: 'Yamaha FG800 (어쿠스틱)', type: 'other', pricePerHour: 1000, description: '어쿠스틱 기타' },
    ],
    reviews: [
      { id: 'rev-1-1', user: '락앤롤정신', rating: 5, content: '장비 관리 상태가 서울 최고 수준입니다. 특히 펜더 트윈 리버브 앰프 관리가 환상적이네요. 펜더 스트랫 기타 대여해서 사용했는데 세팅도 잘 되어 있어서 감동했습니다.', date: '2026-06-15' },
      { id: 'rev-1-2', user: '베이스매니아', rating: 4, content: 'B룸 소리 균형이 엄청 좋습니다. 방음도 완벽해요. 다만 인기가 많아서 예약하기가 하늘의 별 따기입니다.', date: '2026-06-28' },
      { id: 'rev-1-3', user: '인디밴드A', rating: 5, content: '홍대에서 합주할 땐 무조건 여기로 와요. 기타를 깜빡하고 안 가져왔는데, 상태 좋은 일렉기타를 시간당 2000원에 빌려 쓸 수 있어서 너무 편했습니다. 사장님도 정말 친절해요!', date: '2026-07-03' },
    ],
  },
  {
    id: 'studio-2',
    name: '사운드 팩토리 합주실 (Sound Factory)',
    region: 'Hapjeong',
    address: '서울특별시 마포구 독막로3길 24 지하 2층',
    tel: '02-325-1102',
    latitude: 37.5489,
    longitude: 126.9185,
    description: '합정역 부근 인디 뮤지션들의 성지. 넓고 아늑한 피팅룸과 깔끔한 대기실이 장점이며, 빈티지한 악기들과 하이엔드 이펙터 대여 시스템이 구축되어 있습니다.',
    rating: 4.6,
    reviewCount: 18,
    advantages: ['아늑한 인테리어', '녹음실급 방음', '이펙터 무상 대여', '무료 와이파이 & 음료'],
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&auto=format&fit=crop',
    hasGuitarRental: true,
    rooms: [
      {
        name: 'Studio Master',
        capacity: 12,
        pricePerHour: 22000,
        gear: ['Mesa Boogie Dual Rectifier', 'Fender Hot Rod Deluxe', 'Markbass Little Mark III', 'DW Performance', 'Nord Stage 3'],
      },
      {
        name: 'Studio Live',
        capacity: 8,
        pricePerHour: 17000,
        gear: ['Marshall JVM410H', 'Orange CR120', 'Ampeg SVT-CL', 'Sonor AQ2', 'Yamaha CP88'],
      },
    ],
    rentInstruments: [
      { name: 'PRS SE Custom 24', type: 'guitar', pricePerHour: 2000, description: '전천후 범용 일렉기타의 최고봉' },
      { name: 'MusicMan StingRay Bass', type: 'bass', pricePerHour: 2000, description: '파워풀하고 펀치감 넘치는 슬랩 사운드' },
      { name: 'Fender Telecaster Standard', type: 'guitar', pricePerHour: 2000, description: '특유의 까랑까랑한 톤이 살아있는 텔레' },
    ],
    reviews: [
      { id: 'rev-2-1', user: '키보디스트K', rating: 5, content: '노드 스테이지 3 신디사이저가 기본으로 세팅되어 있는 룸이 있어서 너무 좋아요! 신디 터치감도 좋고 음색도 환상적입니다.', date: '2026-05-20' },
      { id: 'rev-2-2', user: '기타초보', rating: 4, content: '합정역이랑 가깝고 공간이 쾌적해요. 빌려주는 PRS 일렉기타 상태도 줄 높이가 잘 맞고 소리 잘 나옵니다. 강추합니다.', date: '2026-06-11' },
    ],
  },
  {
    id: 'studio-3',
    name: '비트홀 밴드 합주실 (Beat Hole)',
    region: 'Gangnam',
    address: '서울특별시 강남구 테헤란로8길 21 지하 1층',
    tel: '02-556-0410',
    latitude: 37.4982,
    longitude: 127.0322,
    description: '강남의 노른자 땅에 위치한 주차 가능 합주실! 쾌적하고 깔끔한 시설과 세련된 조명 디자인으로 유튜브 촬영이나 쇼케이스 예행 연습에도 적합합니다.',
    rating: 4.9,
    reviewCount: 31,
    advantages: ['무료 주차 제공', '세련된 조명 세팅', '모니터링 스피커 빵빵', '촬영 장비 대여 가능'],
    image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=600&auto=format&fit=crop',
    hasGuitarRental: true,
    rooms: [
      {
        name: 'Premium Red (유튜브 최적)',
        capacity: 15,
        pricePerHour: 25000,
        gear: ['Kemper Profiler PowerHead', 'Fender Custom Deluxe', 'Darkglass Microtubes 900', 'Tama Starclassic Exotic', 'Nord Piano 5'],
      },
      {
        name: 'Standard Blue',
        capacity: 7,
        pricePerHour: 18000,
        gear: ['Marshall JCM2000', 'Roland JC-120', 'Gallien-Krueger 700RB', 'Pearl Export', 'Roland FA-08'],
      },
    ],
    rentInstruments: [
      { name: 'Ibanez RG Standard', type: 'guitar', pricePerHour: 2500, description: '테크니컬 속주와 강한 메탈 배킹에 적합' },
      { name: 'Fender Precision Bass', type: 'bass', pricePerHour: 2000, description: '묵직하고 심플한 빈티지 저음 사운드' },
      { name: 'Taylor 114e (어쿠스틱)', type: 'other', pricePerHour: 2000, description: '고급스러운 톤의 명품 어쿠스틱 기타' },
    ],
    reviews: [
      { id: 'rev-3-1', user: '메탈러', rating: 5, content: '강남에서 이 정도 가성비와 주차를 다 잡은 곳은 여기밖에 없습니다. 캠퍼 프로파일러가 구비된 A룸 소리는 정말 혁신적이네요. 메탈 장르 연습에 끝내줍니다.', date: '2026-06-02' },
      { id: 'rev-3-2', user: '유튜버P', rating: 5, content: '조명이 이뻐서 연주 영상 찍을 때 너무 이쁘게 나와요. 무료 주차도 지원되어 멤버들이 정말 편하게 왔습니다. 일렉기타 대여 퀄리티도 대만족!', date: '2026-07-01' },
    ],
  },
  {
    id: 'studio-4',
    name: '신촌 톤팩토리 합주실 (Tone Factory)',
    region: 'Sinchon',
    address: '서울특별시 서대문구 신촌로 109 지하 1층',
    tel: '02-363-2210',
    latitude: 37.5562,
    longitude: 126.9368,
    description: '대학가 밴드 동아리들의 사랑방. 학생 할인 이벤트가 활발하며, 편안한 인테리어와 더불어 일렉기타 및 베이스 무료 대여(일부 기본 품목) 혜택이 주어집니다.',
    rating: 4.5,
    reviewCount: 42,
    advantages: ['학생 10% 추가 할인', '기타 무상 대여 혜택', '동아리 장기 대관 할인', '친절한 사장님'],
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=600&auto=format&fit=crop',
    hasGuitarRental: true,
    rooms: [
      {
        name: 'A룸 (큰방)',
        capacity: 8,
        pricePerHour: 14000,
        gear: ['Marshall DSL100H', 'Fender Champion', 'Ampeg PF500', 'Mapex Armory', 'Yamaha MX88'],
      },
      {
        name: 'B룸 (중방)',
        capacity: 6,
        pricePerHour: 11000,
        gear: ['Marshall MG100', 'Line 6 Catalyst', 'Hartke HD500', 'Tama Imperialstar', 'Kurzweil SP1'],
      },
    ],
    rentInstruments: [
      { name: 'Cort G250 일렉기타', type: 'guitar', pricePerHour: 0, description: '입문용 범용 기타 (무료 대여)' },
      { name: 'Dame Fall&Paul 베이스', type: 'bass', pricePerHour: 0, description: '입문용 슬랩 베이스 (무료 대여)' },
      { name: 'Epiphone Les Paul Standard', type: 'guitar', pricePerHour: 1500, description: '깁슨의 소리를 합리적으로 재현한 레스폴' },
    ],
    reviews: [
      { id: 'rev-4-1', user: '연세대스쿨밴드', rating: 5, content: '학생 할인을 쏠쏠하게 해주셔서 주말 동아리 합주는 꼭 여기서 합니다! 입문용 코트 기타랑 데임 베이스를 무료로 대여해주셔서 악기 없는 초보 멤버들도 참여하기 너무 좋았습니다.', date: '2026-05-18' },
      { id: 'rev-4-2', user: '통기타동아리', rating: 4, content: '가격이 엄청 착해요! 가성비 최고. 시설이 조금 연식이 있지만 사운드 밸런스 훌륭하고 무상 악기 렌탈 상태도 무난합니다.', date: '2026-06-25' },
    ],
  },
  {
    id: 'studio-5',
    name: '성수 헤르츠 합주실 (Seongsu Hertz)',
    region: 'Seongsu',
    address: '서울특별시 성동구 아차산로 84 지하 2층',
    tel: '02-466-0777',
    latitude: 37.5445,
    longitude: 127.0565,
    description: '최근 핫플레이스로 급부상한 성수동에 위치한 프리미엄 인더스트리얼 테마 합주실. 녹음 품질이 최상급이며, 고급 어쿠스틱 피아노가 구비된 클래식-밴드 융합 룸 완비.',
    rating: 4.7,
    reviewCount: 15,
    advantages: ['고품격 아날로그 감성', '멀티트랙 녹음 가능', '그랜드 피아노 보유', '성수동 핫플 인근'],
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
    hasGuitarRental: true,
    rooms: [
      {
        name: 'Hertz Recording (녹음 최적)',
        capacity: 12,
        pricePerHour: 28000,
        gear: ['Kemper PowerRack', 'Soldano SLO-100', 'Ampeg SVT-VR', 'DW Collector\'s Series', 'Nord Stage 3 88', 'YAMAHA U1 Upright'],
      },
      {
        name: 'Hertz Classic',
        capacity: 8,
        pricePerHour: 20000,
        gear: ['Vox AC30 Handwired', 'Fender Deluxe Reverb', 'Markbass Command', 'Sonor AQ1', 'Yamaha Clavinova'],
      },
    ],
    rentInstruments: [
      { name: 'Fender Custom Shop Stratocaster', type: 'guitar', pricePerHour: 5000, description: '하이엔드 프리미엄 커스텀샵의 감동' },
      { name: 'Sadowsky MetroExpress Bass', type: 'bass', pricePerHour: 3000, description: '모던 재즈 베이스의 정점 사도우스키' },
    ],
    reviews: [
      { id: 'rev-5-1', user: '싱어송라이터L', rating: 5, content: '그랜드 피아노 급 업라이트 피아노가 있어서 어쿠스틱하고 정교한 세션 작업에 최고였어요. 인더스트리얼 테마 인테리어도 진짜 힙하고 웅장합니다.', date: '2026-06-30' },
      { id: 'rev-5-2', user: '녹음러', rating: 4, content: '대관 후 멀티 트랙 음원 추출 요청했는데 노이즈 없이 너무 깨끗하게 잘 뽑혔어요. 대여하는 펜더 커스텀샵 일렉기타는 말해뭐해 명기입니다.', date: '2026-07-05' },
    ],
  },
];
