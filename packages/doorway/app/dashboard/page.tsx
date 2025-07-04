import { SessionStatus } from '../components/SessionStatus';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Doorway Dashboard
      </h1>
      <div className="min-w-[512px]">
        <SessionStatus />
      </div>
    </div>
  );
}
