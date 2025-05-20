import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
}

const baseKeywords = [
  'Dutymate',
  '듀티메이트',
  '듀메',
  '듀티표',
  '간호',
  '간호사',
  '수간호사',
  '평간호사',
  '스케줄링',
  '근무표',
  '근무 패턴',
  '자동 생성',
  '자동화',
  '병원',
  '병동',
  '의료',
  '데이',
  '이브닝',
  '나이트',
  '오프',
  '미드',
  '나오데',
  '교대 근무',
  '커뮤니티',
  '약속 잡기',
];

export const SEO = ({
  title = 'Dutymate',
  description = '간호사 업무의 효율성과 공정성을 높이는 근무표 자동 생성 서비스',
  keywords = baseKeywords.join(', '),
  ogImage = '/images/og-image.png',
  ogUrl = 'https://dutymate.net',
}: SEOProps) => {
  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph 메타 태그 */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" />

      {/* Twitter 카드 메타 태그 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};
