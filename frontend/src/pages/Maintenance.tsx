import { SEO } from '@/components/SEO';

const Maintenance = () => {
  const maintenanceMessage =
    import.meta.env.VITE_MAINTENANCE_MESSAGE || '~ 점검 완료 시까지';

  return (
    <>
      <SEO
        title="시스템 점검 | Dutymate"
        description="원활한 서비스 제공을 위해 시스템 점검이 진행 중입니다."
      />
      <div className="min-h-screen bg-base-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-8">
          {/* Error Icon */}
          <div className="w-24 h-24 mx-auto bg-primary-bg rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-primary-dark"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Maintenance */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-base-foreground">
              시스템 점검 안내
            </h1>
            <div className="text-base text-base-foreground leading-relaxed space-y-3">
              <p>안녕하세요, 듀티메이트입니다.</p>
              <p>
                원활한 서비스 제공을 위해 시스템 점검이 진행 중입니다.
                <br />
                점검 동안 일부 기능이 일시적으로 제한될 수 있습니다.
              </p>
              <p>
                최대한 빠르게 작업을 마치고 정상적으로 서비스를 제공해드릴 수
                있도록 최선을 다하겠습니다.
              </p>
              <p>이용에 불편을 드려 진심으로 죄송합니다.</p>
            </div>
            <p className="text-base-foreground/70">{maintenanceMessage}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Maintenance;
