interface LiveMessageProps {
  message: string;
}

export function LiveMessage({ message }: LiveMessageProps) {
  return (
    <p aria-live="polite" className={message ? "form-message is-error" : "form-message"}>
      {message}
    </p>
  );
}
