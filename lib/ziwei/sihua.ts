/**
 * 四化工具模块 — 年干 / 大限宫干 / 流年干 / 流月干 四化映射
 * 倪海厦《天纪》体系核心：
 *   本命四化 = 出生年天干四化（静态基础）
 *   大限四化 = 大限宫**宫干**的四化（十年动态）
 *   流年四化 = 当年年干的四化（一年动态）
 *   自化     = 某宫的宫干四化，其中被化星恰在本宫
 *   来因宫   = 某颗化星的"动力来源宫"
 */

import type { ZiweiChart, Palace, SiHua } from './types';
import { SI_HUA_TABLE, STEMS } from './constants';

// ─── 1) 由天干索引取四化四星 ───────────────────────────────────
export function getSiHuaByStem(stemIndex: number): Record<SiHua, string> {
  const arr = SI_HUA_TABLE[stemIndex];
  if (!arr) return { 禄: '', 权: '', 科: '', 忌: '' };
  return { 禄: arr[0], 权: arr[1], 科: arr[2], 忌: arr[3] };
}

/** 星名 → 四化类型（由某天干确定） */
export function buildStarSiHuaMap(stemIndex: number): Record<string, SiHua> {
  const arr = SI_HUA_TABLE[stemIndex];
  if (!arr) return {};
  return { [arr[0]]: '禄', [arr[1]]: '权', [arr[2]]: '科', [arr[3]]: '忌' };
}

// ─── 2) 公历年 → 年柱天干索引 ──────────────────────────────────
export function getYearStemIndex(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}

export function getYearBranchIndex(year: number): number {
  return ((year - 4) % 12 + 12) % 12;
}

// ─── 3) 大限四化：取大限宫的宫干 ────────────────────────────────
export function getDaXianSiHua(
  chart: ZiweiChart,
  dxIndex: number,
): { stemIndex: number; stemName: string; transforms: Record<SiHua, string> } | null {
  const dx = chart.daXians[dxIndex];
  if (!dx) return null;
  const dxPalace = chart.palaces.find(p => p.branch === dx.palaceBranch);
  if (!dxPalace) return null;
  const stemIndex = dxPalace.stem;
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 4) 流年四化 ──────────────────────────────────────────────
export function getLiuNianSiHua(year: number): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
} {
  const stemIndex = getYearStemIndex(year);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 5) 流月四化（五虎遁） ─────────────────────────────────────
/**
 * 流月天干（五虎遁：甲己年起丙寅、乙庚年起戊寅、丙辛年起庚寅、丁壬年起壬寅、戊癸年起甲寅）
 * month: 农历月 1-12
 */
export function getLiuYueStemIndex(yearStem: number, month: number): number {
  const startStemOfYin: Record<number, number> = {
    0: 2, 5: 2,    // 甲己 → 丙
    1: 4, 6: 4,    // 乙庚 → 戊
    2: 6, 7: 6,    // 丙辛 → 庚
    3: 8, 8: 8,    // 丁壬 → 壬
    4: 0, 9: 0,    // 戊癸 → 甲
  };
  const yinStem = startStemOfYin[yearStem] ?? 0;
  return (yinStem + ((month - 1) % 12) + 10) % 10;
}

export function getLiuYueSiHua(yearStem: number, month: number): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
} {
  const stemIndex = getLiuYueStemIndex(yearStem, month);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 6) 宫干自化检测 ──────────────────────────────────────────
export interface SelfSihua {
  siHua: SiHua;
  starName: string;
}

export function detectSelfSihua(palace: Palace): SelfSihua[] {
  const transforms = getSiHuaByStem(palace.stem);
  const found: SelfSihua[] = [];
  const palaceStarNames = new Set(palace.stars.map(s => s.name));
  (['禄', '权', '科', '忌'] as SiHua[]).forEach(sh => {
    const starName = transforms[sh];
    if (starName && palaceStarNames.has(starName)) {
      found.push({ siHua: sh, starName });
    }
  });
  return found;
}

// ─── 7) 来因宫追溯 ────────────────────────────────────────────
export function findIncomingPalaces(
  chart: ZiweiChart,
  starName: string,
  sihua: SiHua,
): Palace[] {
  const result: Palace[] = [];
  chart.palaces.forEach(p => {
    const transforms = getSiHuaByStem(p.stem);
    if (transforms[sihua] === starName) {
      result.push(p);
    }
  });
  return result;
}

/** 批量计算盘面所有宫位的自化列表 */
export function buildAllSelfSihua(chart: ZiweiChart): Record<number, SelfSihua[]> {
  const result: Record<number, SelfSihua[]> = {};
  chart.palaces.forEach(p => {
    const list = detectSelfSihua(p);
    if (list.length > 0) result[p.branch] = list;
  });
  return result;
}

// ─── 8) 综合覆盖（overlay）：多个四化层叠加后的效果 ──────────
export interface SiHuaOverlay {
  native?: SiHua;
  daXian?: SiHua;
  liuNian?: SiHua;
  liuYue?: SiHua;
}

export function buildOverlayForStar(
  starName: string,
  nativeMap: Record<string, SiHua>,
  daXianMap?: Record<string, SiHua>,
  liuNianMap?: Record<string, SiHua>,
  liuYueMap?: Record<string, SiHua>,
): SiHuaOverlay {
  return {
    native: nativeMap[starName],
    daXian: daXianMap?.[starName],
    liuNian: liuNianMap?.[starName],
    liuYue: liuYueMap?.[starName],
  };
}