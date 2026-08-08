// ============================================================
// 紫微斗数类型定义（Vercel 版，1:1 移植自原项目）
// ============================================================

export interface BirthInfo {
  year: number;        // 公历年
  month: number;       // 公历月 (1-12)
  day: number;         // 公历日
  hour: number;        // 时辰 branch index (0=子, 1=丑, ... 11=亥)
  gender: 'male' | 'female';
  name?: string;
  province?: string;   // 出生省份
  city?: string;       // 出生城市
  longitude?: number;  // 出生地经度（用于真太阳时校正）
}

export interface LunarInfo {
  lunarYear: number;
  lunarMonth: number;    // positive = normal, negative = leap month
  lunarDay: number;
  yearStem: number;      // 0-9 (甲乙丙丁戊己庚辛壬癸)
  yearBranch: number;    // 0-11 (子丑寅卯辰巳午未申酉戌亥)
  isLeapMonth: boolean;
}

export type SiHua = '禄' | '权' | '科' | '忌';

export interface Star {
  name: string;
  type: 'major' | 'minor' | 'lucky' | 'sha';
  siHua?: SiHua;
  brightness?: 'bright' | 'normal' | 'dim';
}

export interface SelfSihuaMark {
  siHua: SiHua;
  starName: string;
}

export interface Palace {
  branch: number;
  stem: number;
  name: string;
  stars: Star[];
  daXianAge?: [number, number];
  isCurrentDaXian?: boolean;
  isMingGong?: boolean;
  isShenGong?: boolean;
  selfSihua?: SelfSihuaMark[];
  oppositeBranch?: number;
  isEmpty?: boolean;
  borrowedFromBranch?: number;
  borrowedFromName?: string;
  borrowedStars?: string[];
}

export interface DaXian {
  startAge: number;
  endAge: number;
  palaceBranch: number;
  palaceName: string;
}

export interface ZiweiChart {
  birthInfo: BirthInfo;
  lunarInfo: LunarInfo;
  mingGongBranch: number;
  shenGongBranch: number;
  wuxingJu: number;
  wuxingJuName: string;
  ziweiPos: number;
  palaces: Palace[];
  daXians: DaXian[];
  currentAge: number;
  currentDaXianIndex: number;
}

// 解读消息（前端用）
export interface InterpretMessage {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean;  // user 消息被设为 hidden 时不显示但计入追问
  ts?: number;
}

// 主题 Tab 数据
export interface TabData {
  messages: InterpretMessage[];
  loaded: boolean;
}