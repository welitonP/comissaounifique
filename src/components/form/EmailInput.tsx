"use client";

// Campo de e-mail corporativo: confere na hora se é do domínio da empresa
// (ex: @redeunifique.com.br) e avisa antes de enviar. O servidor confere de novo.
export default function EmailInput({
  dominios,
  className,
  placeholder,
  ariaLabel,
}: {
  dominios: string[];
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const exemplo = `nome@${dominios[0]}`;
  const validar = (el: HTMLInputElement) => {
    const v = el.value.trim().toLowerCase();
    if (v !== el.value) el.value = v;
    const dominio = v.split("@")[1] || "";
    if (v && v.includes("@") && !dominios.includes(dominio)) {
      el.setCustomValidity(`Use o seu e-mail da Unifique (termina com @${dominios.join(" ou @")}).`);
    } else {
      el.setCustomValidity("");
    }
  };
  return (
    <input
      type="email"
      name="email"
      required
      maxLength={120}
      inputMode="email"
      autoComplete="email"
      autoCapitalize="none"
      spellCheck={false}
      placeholder={placeholder ?? exemplo}
      aria-label={ariaLabel}
      className={className}
      onInput={(e) => validar(e.currentTarget)}
      onBlur={(e) => validar(e.currentTarget)}
    />
  );
}
