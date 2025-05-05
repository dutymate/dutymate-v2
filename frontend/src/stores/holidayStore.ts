import { create } from 'zustand';
import { holidayService } from '@/services/holidayService';

interface Holiday {
  day: number;
  name: string;
  date: string;
}

interface HolidayCache {
  [key: string]: Holiday[]; // "2025-5" 형식의 키
}

interface HolidayState {
  holidayCache: HolidayCache;
  isLoading: boolean;
  error: string | null;
  fetchHolidays: (year: number, month: number) => Promise<void>;
  getHolidays: (year: number, month: number) => Holiday[] | null;
}

// 캐시 키 생성 함수
const getCacheKey = (year: number, month: number) => `${year}-${month}`;

// localStorage에서 캐시 데이터 로드
const loadCacheFromStorage = (): HolidayCache => {
  try {
    const cached = localStorage.getItem('holiday-cache');
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

// localStorage에 캐시 데이터 저장
const saveCacheToStorage = (cache: HolidayCache) => {
  try {
    localStorage.setItem('holiday-cache', JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save holiday cache:', error);
  }
};

export const useHolidayStore = create<HolidayState>((set, get) => ({
  holidayCache: loadCacheFromStorage(),
  isLoading: false,
  error: null,

  fetchHolidays: async (year: number, month: number) => {
    const cacheKey = getCacheKey(year, month);
    const { holidayCache } = get();

    // 캐시에 있으면 바로 반환
    if (holidayCache[cacheKey]) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await holidayService.getHolidays(year, month);
      const newCache = {
        ...holidayCache,
        [cacheKey]: response.holidays,
      };

      set({ holidayCache: newCache });
      saveCacheToStorage(newCache);
    } catch (error) {
      set({ error: '공휴일 정보를 불러오는데 실패했습니다.' });
    } finally {
      set({ isLoading: false });
    }
  },

  getHolidays: (year: number, month: number) => {
    const cacheKey = getCacheKey(year, month);
    return get().holidayCache[cacheKey] || null;
  },
}));
