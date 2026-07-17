interface FullPageStatusProps {
  label: string;
}

export function FullPageStatus({ label }: FullPageStatusProps) {
  return (
    <main className="centered-page" id="main-content">
      <div className="loading-mark" aria-hidden="true" />
      <p role="status">{label}</p>
    </main>
  );
}
