import { useState } from 'react';
import { toast } from 'react-toastify';
import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx';

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
   * 근무표를 엑셀로 내보내는 기능
   * @param dutyData 간호사별 근무 데이터
   * @param duties 현재 근무 데이터
   * @param nurseDutyCounts 간호사별 근무 통계
   * @param daysInMonth 해당 월의 일수
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
      // 데이터 변환: 테이블 데이터를 배열 형태로 정리
      const tableData = [];

      // 첫 번째 행: 컬럼 제목 추가
      const headerRow = [
        '이름',
        '이전 근무',
        ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}일`),
        'D',
        'E',
        'N',
        'O',
        'M',
      ];
      tableData.push(headerRow);

      // 데이터 행 추가
      dutyData.forEach((nurse, i) => {
        const rowData = [
          nurse.name, // 간호사 이름
          nurse.prevShifts, // 이전 근무
          ...duties[i], // 근무 정보
          nurseDutyCounts[i]?.D || 0,
          nurseDutyCounts[i]?.E || 0,
          nurseDutyCounts[i]?.N || 0,
          nurseDutyCounts[i]?.O || 0,
          nurseDutyCounts[i]?.M || 0,
        ];
        tableData.push(rowData);
      });

      // 워크북 생성 및 시트 추가
      const ws = XLSX.utils.aoa_to_sheet(tableData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '근무표');

      // 엑셀 파일 저장 및 다운로드
      XLSX.writeFile(wb, `근무표_${year}년_${month}월.xlsx`);

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
