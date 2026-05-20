interface Props {
  error: string;
  onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-lg border border-red-800 bg-red-950/50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-red-400">오류 발생</h2>
        <p className="mb-4 text-sm text-gray-300">{error}</p>
        <button
          onClick={onRetry}
          className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          aria-label="재시도"
        >
          재시도
        </button>
      </div>
    </div>
  );
}
