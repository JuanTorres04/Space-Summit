import { useEffect, useRef } from "react";

interface TypingBoxProps {
  target: string;
  typed: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TypingBox({
  target,
  typed,
  disabled,
  onChange,
}: TypingBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  return (
    <div className="typing-box" onClick={() => inputRef.current?.focus()}>
      <p className="passage" aria-hidden="true">
        {target.split("").map((char, i) => {
          let state = "pending";
          if (i < typed.length)
            state = typed[i] === char ? "correct" : "incorrect";
          else if (i === typed.length) state = "current";
          return (
            <span key={i} className={state}>
              {char}
            </span>
          );
        })}
      </p>
      <input
        ref={inputRef}
        className="typing-input"
        value={typed}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => e.preventDefault()}
        aria-label="Type the passage here"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </div>
  );
}
