interface Props {
  error: string;
  onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-command-canvas p-8 text-slate-100">
      <div className="command-panel max-w-lg border-red-900/60 bg-red-950/30 p-6 text-center">
        <p className="command-label text-red-300">Command center unavailable</p>
        <h2 className="mt-2 text-2xl font-black text-red-100">오류 발생</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">{error}</p>
        <button
          onClick={onRetry}
          className="focus-command mt-5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
          aria-label="재시도"
        >
          재시도
        </button>
      </div>
    </div>
  );
}
