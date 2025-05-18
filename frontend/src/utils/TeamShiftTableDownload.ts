import { toPng } from 'html-to-image';
import { toast } from 'react-toastify';

interface TeamShiftTableDownloadOptions {
  year: number;
  month: number;
  tableElement: HTMLElement;
  prefix?: string;
}

export const TeamShiftTableDownload = async ({
  year,
  month,
  tableElement,
  prefix = '듀티표',
}: TeamShiftTableDownloadOptions): Promise<boolean> => {
  try {
    // 테이블 요소 직접 찾기
    const table = tableElement.querySelector('table');

    if (!table) {
      toast.error('테이블 요소를 찾을 수 없습니다.');
      return false;
    }

    // 테이블만 클론하여 불필요한 요소 제거
    const clone = table.cloneNode(true) as HTMLTableElement;

    // 테이블 스타일 초기화 및 설정
    clone.style.width = 'auto';
    clone.style.height = 'auto';
    clone.style.borderCollapse = 'collapse';
    clone.style.borderSpacing = '0';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.backgroundColor = '#FFFFFF';

    // 모든 셀에 스타일 적용
    const cells = clone.querySelectorAll('th, td');
    cells.forEach((cell) => {
      const cellEl = cell as HTMLElement;
      cellEl.style.border = '1px solid #E5E7EB';

      // 주말 배경색 유지
      if (
        cellEl.classList.contains('bg-base-muted-30') ||
        cellEl.closest('tr')?.querySelector('.bg-base-muted-30')
      ) {
        cellEl.style.backgroundColor = '#f8f9fa';
      } else {
        cellEl.style.backgroundColor = '#FFFFFF';
      }

      // 셀 패딩 일관되게 설정
      cellEl.style.padding = '4px';
    });

    // 모든 행(tr)에 높이 명시적 설정
    const rows = clone.querySelectorAll('tr');
    rows.forEach((row) => {
      (row as HTMLElement).style.height = 'auto';
    });

    // 불필요한 속성 및 스타일 제거
    clone.removeAttribute('class');

    // 다운로드용 컨테이너 생성
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.display = 'inline-block';
    container.style.width = 'auto';
    container.style.height = 'auto';
    container.style.overflow = 'hidden';
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.backgroundColor = '#FFFFFF';
    container.appendChild(clone);
    document.body.appendChild(container);

    // 테이블 실제 크기 계산
    const rect = clone.getBoundingClientRect();

    // 이미지 생성 옵션
    const options = {
      quality: 1.0,
      pixelRatio: 2,
      width: rect.width,
      height: rect.height,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
      backgroundColor: '#FFFFFF',
      skipAutoScale: true,
    };

    // 이미지 생성
    const dataUrl = await toPng(clone, options);

    // 임시 요소 제거
    document.body.removeChild(container);

    // 다운로드
    const link = document.createElement('a');
    link.download = `${prefix}_${year}년_${month}월.png`;
    link.href = dataUrl;
    link.click();

    toast.success('듀티표가 다운로드되었습니다.');
    return true;
  } catch (error) {
    console.error('Download error:', error);
    toast.error('듀티표 다운로드에 실패했습니다.');
    return false;
  }
};
