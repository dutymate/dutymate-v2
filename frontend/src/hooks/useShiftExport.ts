import { useState } from 'react';
import { toast } from 'react-toastify';
import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx-js-style';
import { isHoliday } from '@/utils/dateUtils';

// xlsx-js-style를 위한 타입 정의
interface StyledCell {
  v: string | number;
  t: 's' | 'n';
  s?: {
    font?: {
      bold?: boolean;
      color?: { rgb: string };
      sz?: number;
      name?: string;
    };
    fill?: {
      fgColor: { rgb: string };
    };
    alignment?: {
      horizontal: 'left' | 'center' | 'right';
      vertical: 'top' | 'center' | 'bottom';
      wrapText?: boolean;
    };
    border?: {
      top?: { style: string; color: { rgb: string } };
      bottom?: { style: string; color: { rgb: string } };
      left?: { style: string; color: { rgb: string } };
      right?: { style: string; color: { rgb: string } };
    };
  };
}

/**
 * 근무표 내보내기 기능을 제공하는 hook
 */
export const useShiftExport = (year: number, month: number) => {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * 근무표를 이미지로 내보내는 기능
   * @param tableRef 근무표 테이블 요소에 대한 ref
   * @param selectedCell 현재 선택된 셀 상태
   * @param setSelectedCell 선택된 셀 상태를 변경하는 함수
   */
  const exportToImage = async (
    tableRef: HTMLElement | null,
    selectedCell: any,
    setSelectedCell: (cell: any) => void
  ) => {
    if (!tableRef) {
      toast.error('내보낼 근무표를 찾을 수 없습니다.');
      return;
    }

    // 이미 내보내기 중이면 중복 실행 방지
    if (isExporting) return;

    setIsExporting(true);
    const tempSelectedCell = selectedCell;
    setSelectedCell(null);

    try {
      const dataUrl = await toPng(tableRef, {
        quality: 1.0,
        pixelRatio: 2,
        width: tableRef.scrollWidth + 14.5,
        height: tableRef.scrollHeight + 5,
        backgroundColor: '#FFFFFF',
        style: {
          borderCollapse: 'collapse',
        },
      });

      const link = document.createElement('a');
      link.download = `듀티표_${year}년_${month}월.png`;
      link.href = dataUrl;
      link.click();

      toast.success('듀티표가 다운로드되었습니다.');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('듀티표 다운로드에 실패했습니다.');
    } finally {
      setSelectedCell(tempSelectedCell);
      setIsExporting(false);
    }
  };

  /**
   * 요일 이름을 가져오는 함수
   * @param year 년도
   * @param month 월
   * @param day 일
   * @returns 요일 이름 (일, 월, 화, 수, 목, 금, 토)
   */
  const getDayOfWeek = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return dayNames[dayOfWeek];
  };

  /**
   * 요일이 토요일인지 확인
   */
  const isSaturdayDay = (year: number, month: number, day: number): boolean => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 6; // 6: 토요일
  };

  /**
   * 요일이 일요일인지 확인
   */
  const isSundayDay = (year: number, month: number, day: number): boolean => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0; // 0: 일요일
  };

  /**
   * 요일별 배경색 가져오기
   */
  const getWeekendBgColor = (
    year: number,
    month: number,
    day: number
  ): string => {
    if (isHoliday(year, month, day) || isSundayDay(year, month, day)) {
      return 'FFEEEE'; // 일요일/공휴일 배경색
    } else if (isSaturdayDay(year, month, day)) {
      return 'EEEEFF'; // 토요일 배경색
    }
    return '';
  };

  /**
   * 근무 코드를 표시용 텍스트로 변환
   * @param dutyCode 근무 코드 (D, E, N, O, M, X)
   * @returns 표시용 텍스트
   */
  const formatDutyCode = (dutyCode: string): string => {
    if (dutyCode === 'O') return 'Off';
    return dutyCode;
  };

  /**
   * 근무표를 엑셀로 내보내는 기능
   * @param dutyData 간호사별 근무 데이터
   * @param duties 현재 근무 데이터
   * @param nurseDutyCounts 간호사별 근무 통계
   * @param daysInMonth 해당 월의 일수
   * @param wardName 병동 이름 (선택적)
   */
  const exportToExcel = (
    dutyData: { name: string; prevShifts: string }[],
    duties: string[][],
    nurseDutyCounts: any[],
    daysInMonth: number
  ) => {
    // 이미 내보내기 중이면 중복 실행 방지
    if (isExporting) return;

    setIsExporting(true);

    try {
      // 워크북 생성
      const wb = XLSX.utils.book_new();

      // 워크북 생성을 위한 준비

      // 데이터 배열 초기화
      const tableData: StyledCell[][] = [];

      // 타이틀 행 추가 (년월 근무표 타이틀만 모든 열을 병합하여 가운데 정렬)
      const titleText = `${year}년 ${month}월 근무표`;
      tableData.push([
        {
          v: titleText,
          t: 's',
          s: {
            font: { bold: true, sz: 18, name: 'Arial' },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'E2EFDA' } }, // 연한 녹색 배경
            border: {
              top: { style: 'medium', color: { rgb: '538135' } },
              bottom: { style: 'medium', color: { rgb: '538135' } },
              left: { style: 'medium', color: { rgb: '538135' } },
              right: { style: 'medium', color: { rgb: '538135' } },
            },
          },
        },
        ...Array(daysInMonth + 5).fill({ v: '', t: 's' } as StyledCell),
      ]);

      // 날짜 행 배열 생성
      const dateRowData: StyledCell[] = [
        {
          v: '날짜',
          t: 's',
          s: {
            font: { bold: true, name: 'Malgun Gothic', sz: 11 },
            fill: { fgColor: { rgb: 'D9D9D9' } }, // 좀 더 진한 회색 배경
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '404040' } },
              bottom: { style: 'thin', color: { rgb: '404040' } },
              left: { style: 'thin', color: { rgb: '404040' } },
              right: { style: 'thin', color: { rgb: '404040' } },
            },
          },
        },
      ];

      // 날짜 추가 (1일부터 월 말일까지)
      for (let i = 1; i <= daysInMonth; i++) {
        const cellStyle: StyledCell['s'] = {
          font: { bold: true, name: 'Malgun Gothic', sz: 11 },
          fill: { fgColor: { rgb: 'D9D9D9' } }, // 좀 더 진한 회색 배경
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '404040' } },
            bottom: { style: 'thin', color: { rgb: '404040' } },
            left: { style: 'thin', color: { rgb: '404040' } },
            right: { style: 'thin', color: { rgb: '404040' } },
          },
        };

        // 주말/공휴일인 경우 배경색 추가
        const bgColor = getWeekendBgColor(year, month, i);
        if (bgColor) {
          cellStyle.fill = { fgColor: { rgb: bgColor } };
        }

        dateRowData.push({ v: `${i}`, t: 's', s: cellStyle });
      }

      // 통계 열 제목 추가
      ['D', 'E', 'N', 'Off', 'M'].forEach((code) => {
        dateRowData.push({
          v: code,
          t: 's',
          s: {
            font: { bold: true, name: 'Malgun Gothic', sz: 11 },
            fill: { fgColor: { rgb: 'D9D9D9' } }, // 좀 더 진한 회색 배경
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '404040' } },
              bottom: { style: 'thin', color: { rgb: '404040' } },
              left: { style: 'thin', color: { rgb: '404040' } },
              right: { style: 'thin', color: { rgb: '404040' } },
            },
          },
        });
      });

      tableData.push(dateRowData);

      // 요일 행 배열 생성
      const dayOfWeekRowData: StyledCell[] = [
        {
          v: '요일',
          t: 's',
          s: {
            font: { bold: true, name: 'Malgun Gothic', sz: 11 },
            fill: { fgColor: { rgb: 'D9D9D9' } }, // 좀 더 진한 회색 배경
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '404040' } },
              bottom: { style: 'thin', color: { rgb: '404040' } },
              left: { style: 'thin', color: { rgb: '404040' } },
              right: { style: 'thin', color: { rgb: '404040' } },
            },
          },
        },
      ];

      // 각 날짜의 요일 추가
      for (let i = 1; i <= daysInMonth; i++) {
        const dayOfWeek = getDayOfWeek(year, month, i);
        const cellStyle: StyledCell['s'] = {
          font: { name: 'Malgun Gothic', sz: 10 },
          fill: { fgColor: { rgb: 'D9D9D9' } }, // 좀 더 진한 회색 배경
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '404040' } },
            bottom: { style: 'thin', color: { rgb: '404040' } },
            left: { style: 'thin', color: { rgb: '404040' } },
            right: { style: 'thin', color: { rgb: '404040' } },
          },
        };

        // 주말/공휴일인 경우 배경색 추가
        const bgColor = getWeekendBgColor(year, month, i);
        if (bgColor) {
          cellStyle.fill = { fgColor: { rgb: bgColor } };
        }

        dayOfWeekRowData.push({ v: dayOfWeek, t: 's', s: cellStyle });
      }

      // 통계 열에 빈 셀 추가
      for (let i = 0; i < 5; i++) {
        dayOfWeekRowData.push({
          v: '',
          t: 's',
          s: {
            font: { name: 'Malgun Gothic', sz: 10 },
            fill: { fgColor: { rgb: 'D9D9D9' } }, // 좀 더 진한 회색 배경
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '404040' } },
              bottom: { style: 'thin', color: { rgb: '404040' } },
              left: { style: 'thin', color: { rgb: '404040' } },
              right: { style: 'thin', color: { rgb: '404040' } },
            },
          },
        });
      }

      tableData.push(dayOfWeekRowData);

      // 간호사 근무 데이터 행 추가
      dutyData.forEach((nurse, nurseIndex) => {
        const rowData: StyledCell[] = [
          {
            v: nurse.name,
            t: 's',
            s: {
              font: { name: 'Malgun Gothic', sz: 10, bold: true }, // 이름 강조
              fill: { fgColor: { rgb: 'F2F2F2' } }, // 아주 연한 회색 배경
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: '404040' } },
                bottom: { style: 'thin', color: { rgb: '404040' } },
                left: { style: 'thin', color: { rgb: '404040' } },
                right: { style: 'thin', color: { rgb: '404040' } },
              },
            },
          },
        ];

        // 각 날짜별 근무 추가
        duties[nurseIndex].forEach((duty, dayIndex) => {
          const cellStyle: StyledCell['s'] = {
            font: { name: 'Malgun Gothic', sz: 10 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
            },
          };

          // 주말/공휴일인 경우 배경색 추가
          const bgColor = getWeekendBgColor(year, month, dayIndex + 1);
          if (bgColor) {
            cellStyle.fill = { fgColor: { rgb: bgColor } };
          }

          rowData.push({
            v: formatDutyCode(duty),
            t: 's',
            s: cellStyle,
          });
        });

        // 통계 열 추가
        ['D', 'E', 'N', 'O', 'M'].forEach((dutyType) => {
          rowData.push({
            v: nurseDutyCounts[nurseIndex]?.[dutyType] || 0,
            t: 'n',
            s: {
              font: { name: 'Malgun Gothic', sz: 10 },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } },
              },
            },
          });
        });

        tableData.push(rowData);
      });

      // 통계 행 앞에 2개의 빈 행 추가
      for (let i = 0; i < 2; i++) {
        const emptyRow: StyledCell[] = [
          {
            v: '',
            t: 's',
            s: {
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } },
              },
            },
          },
        ];

        // 날짜 칸 추가
        for (let j = 0; j < daysInMonth; j++) {
          const cellStyle: StyledCell['s'] = {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
            },
          };

          // 주말/공휴일인 경우 배경색 추가
          const bgColor = getWeekendBgColor(year, month, j + 1);
          if (bgColor) {
            cellStyle.fill = { fgColor: { rgb: bgColor } };
          }

          emptyRow.push({ v: '', t: 's', s: cellStyle });
        }

        // 통계 칸 추가
        for (let k = 0; k < 5; k++) {
          emptyRow.push({
            v: '',
            t: 's',
            s: {
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } },
              },
            },
          });
        }

        tableData.push(emptyRow);
      }

      // 통계 계산: 각 날짜별 근무 타입 카운트
      type DutyCount = {
        D: number;
        E: number;
        N: number;
        O: number;
        M: number;
        total: number;
      };

      const dutyCounts: DutyCount[] = [];
      for (let day = 0; day < daysInMonth; day++) {
        const counts: DutyCount = {
          D: 0,
          E: 0,
          N: 0,
          O: 0,
          M: 0,
          total: 0,
        };

        // 각 간호사의 해당 날짜 근무 집계
        duties.forEach((nurseShifts) => {
          const shift = nurseShifts[day];
          if (shift && ['D', 'E', 'N', 'O', 'M'].includes(shift)) {
            counts[shift as 'D' | 'E' | 'N' | 'O' | 'M']++;
            counts.total++;
          }
        });

        dutyCounts.push(counts);
      }

      // 통계 행 추가 (DAY, EVENING, NIGHT, OFF, TOTAL)
      const statLabels = ['DAY', 'EVENING', 'NIGHT', 'OFF', 'TOTAL'];
      const statTypes = ['D', 'E', 'N', 'O', 'total'];
      const statColors = ['318F3D', 'E55656', '532FC8', '726F5A', '000000']; // 녹색, 빨간색, 보라색, 회색, 검정색

      statLabels.forEach((label, index) => {
        const statType = statTypes[index] as 'D' | 'E' | 'N' | 'O' | 'total';
        const rowData: StyledCell[] = [
          {
            v: label,
            t: 's',
            s: {
              font: {
                bold: true,
                color: { rgb: statColors[index] },
                name: 'Malgun Gothic',
                sz: 10,
              },
              fill: { fgColor: { rgb: 'F2F2F2' } }, // 배경색 추가
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: '404040' } },
                bottom: { style: 'thin', color: { rgb: '404040' } },
                left: { style: 'thin', color: { rgb: '404040' } },
                right: { style: 'thin', color: { rgb: '404040' } },
              },
            },
          },
        ];

        // 각 날짜별 통계 추가
        dutyCounts.forEach((count, dayIndex) => {
          const cellStyle: StyledCell['s'] = {
            font: { name: 'Malgun Gothic', sz: 10 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '404040' } },
              bottom: { style: 'thin', color: { rgb: '404040' } },
              left: { style: 'thin', color: { rgb: '404040' } },
              right: { style: 'thin', color: { rgb: '404040' } },
            },
          };

          // 주말/공휴일인 경우 배경색 추가
          const bgColor = getWeekendBgColor(year, month, dayIndex + 1);
          if (bgColor) {
            cellStyle.fill = { fgColor: { rgb: bgColor } };
          }

          rowData.push({
            v: count[statType],
            t: 'n',
            s: cellStyle,
          });
        });

        // 빈 통계 칸 추가
        for (let i = 0; i < 5; i++) {
          rowData.push({
            v: '',
            t: 's',
            s: {
              font: { name: 'Malgun Gothic', sz: 10 },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: '404040' } },
                bottom: { style: 'thin', color: { rgb: '404040' } },
                left: { style: 'thin', color: { rgb: '404040' } },
                right: { style: 'thin', color: { rgb: '404040' } },
              },
            },
          });
        }

        tableData.push(rowData);
      });

      // 워크시트 생성
      const ws = XLSX.utils.aoa_to_sheet(tableData);

      // 셀 병합 설정
      if (!ws['!merges']) ws['!merges'] = [];

      // 타이틀 행 병합 (첫 번째 줄 전체 병합)
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: daysInMonth + 5 } } // 타이틀 행 전체 병합
      );

      // 컬럼 너비 설정
      ws['!cols'] = [
        { width: 12 }, // 이름 컬럼 (더 넓게 수정)
      ];

      // 날짜 컬럼들 (1~31일)
      for (let i = 0; i < daysInMonth; i++) {
        ws['!cols'].push({ width: 4.0 }); // 날짜 컬럼들을 좁게 설정
      }

      // 통계 컬럼들 (D, E, N, O, M)
      for (let i = 0; i < 5; i++) {
        ws['!cols'].push({ width: 4.0 }); // 통계 컬럼
      }

      // 행 높이 설정
      ws['!rows'] = [
        { hpt: 35 }, // 타이틀 행 (더 높게)
        { hpt: 22 }, // 날짜 행
        { hpt: 22 }, // 요일 행
      ];

      // 데이터 행들 (간호사별 근무 데이터)
      for (let i = 0; i < dutyData.length; i++) {
        ws['!rows'].push({ hpt: 18 }); // 데이터 행
      }

      // 통계 행들
      for (let i = 0; i < 5; i++) {
        ws['!rows'].push({ hpt: 18 }); // 통계 행
      }

      // 워크시트를 워크북에 추가
      XLSX.utils.book_append_sheet(wb, ws, `${year}년 ${month}월 근무표`);

      // 엑셀 파일 저장 및 다운로드
      XLSX.writeFile(wb, `간호사_근무표_${year}년_${month}월.xlsx`);

      toast.success('근무표가 엑셀로 다운로드되었습니다.');
    } catch (error) {
      console.error('Export to Excel error:', error);
      toast.error('엑셀 다운로드에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportToImage,
    exportToExcel,
  };
};
