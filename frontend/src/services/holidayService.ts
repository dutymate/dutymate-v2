import axiosInstance from '@/lib/axios';

interface Holiday {
  day: number;
  name: string;
  date: string;
}

interface HolidayResponse {
  year: number;
  month: number;
  holidays: Holiday[];
}

export const holidayService = {
  /**
   * 특정 연월의 공휴일 정보를 조회합니다.
   */
  getHolidays: async (
    year: number,
    month: number
  ): Promise<HolidayResponse> => {
    const response = await axiosInstance.get<HolidayResponse>(
      `/holiday?year=${year}&month=${month}`
    );
    return response.data;
  },
};
