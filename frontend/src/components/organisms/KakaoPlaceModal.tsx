import { useEffect, useState } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';

declare global {
  interface Window {
    handleOverlayClick: () => void;
  }
}

interface KakaoPlaceModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (place: string) => void;
}

interface Marker {
  position: {
    lat: number;
    lng: number;
  };
  content: string;
}

const KakaoPlaceModal = ({ open, onClose, onSelect }: KakaoPlaceModalProps) => {
  // 1. 카카오맵 SDK 로딩
  const [loading] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
    libraries: ['services'],
  });

  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Marker | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pendingKeyword, setPendingKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 장소 검색 함수
  const searchPlaces = (keyword: string) => {
    if (!map || !window.kakao?.maps?.services?.Places) return;
    setIsSearching(true);
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const bounds = new window.kakao.maps.LatLngBounds();
        const newMarkers: Marker[] = [];
        for (let i = 0; i < data.length; i++) {
          newMarkers.push({
            position: {
              lat: Number(data[i].y),
              lng: Number(data[i].x),
            },
            content: data[i].place_name,
          });
          bounds.extend(
            new window.kakao.maps.LatLng(Number(data[i].y), Number(data[i].x))
          );
        }
        setMarkers(newMarkers);
        map.setBounds(bounds);
      } else {
        setMarkers([]);
      }
      setIsSearching(false);
    });
  };

  // Enter 키로 검색 실행
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchKeyword.trim()) {
      setPendingKeyword(searchKeyword.trim());
    }
  };

  // pendingKeyword가 바뀔 때만 검색 실행
  useEffect(() => {
    if (pendingKeyword && map) {
      searchPlaces(pendingKeyword);
    }
  }, [pendingKeyword, map]);

  // value prop이 바뀌면 input도 바꿔줌
  useEffect(() => {
    setSearchKeyword(searchKeyword);
  }, [searchKeyword]);

  // 1. 전역 함수 등록 (컴포넌트 바깥 or useEffect에서)
  window.handleOverlayClick = function () {
    alert('오버레이 클릭! (window 전역 함수)');
    // window.location.href = '/study';
  };

  // 2. DOM element 생성
  const content = document.createElement('div');
  content.innerHTML = `<button>이동</button>`;

  // 2. 이벤트 핸들러 등록
  const button = content.querySelector('button');
  if (button) {
    button.onclick = function () {
      alert('오버레이 클릭! (DOM element)');
      // window.location.href = '/study';
    };
  }

  // 3. 커스텀 오버레이 생성
  if (map && selectedPlace) {
    const overlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(
        selectedPlace.position.lat,
        selectedPlace.position.lng
      ),
      content: content,
    });
    overlay.setMap(map);
  }

  // 2. 로딩/에러 처리
  if (loading) return <div>불러오는 중...</div>;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-lg w-[90%] max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 검색 입력창 */}
        <div className="mb-4">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="장소를 검색하세요"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 지도 */}
        <div style={{ width: '100%', height: '450px' }}>
          <Map
            center={{
              lat: 37.566826,
              lng: 126.9786567,
            }}
            style={{
              width: '100%',
              height: '100%',
            }}
            level={3}
            onCreate={setMap}
          >
            {markers.map((marker) => (
              <MapMarker
                key={`marker-${marker.content}-${marker.position.lat},${marker.position.lng}`}
                position={marker.position}
                onClick={() => {
                  setSelectedPlace(marker);
                  onSelect(marker.content);
                }}
              >
                {selectedPlace && selectedPlace.content === marker.content && (
                  <div className="p-2 bg-white rounded-lg shadow-lg">
                    {marker.content}
                  </div>
                )}
              </MapMarker>
            ))}
          </Map>
        </div>

        {/* 로딩 상태 */}
        {isSearching && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-2">장소를 검색하는 중...</div>
            </div>
          </div>
        )}

        {/* 선택된 장소 정보 */}
        {selectedPlace && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-lg">{selectedPlace.content}</h3>
            <p className="text-sm text-gray-600">
              위도: {selectedPlace.position.lat.toFixed(6)}, 경도:{' '}
              {selectedPlace.position.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KakaoPlaceModal;
