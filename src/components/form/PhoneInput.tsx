"use client";

// Campo de WhatsApp com máscara: (47) 99999-9999. Aceita colar "+55 47 ..."
// e avisa se faltar o DDD, antes de enviar (sem perder o resto do formulário).
export function formatarTelefone(valor: string): string {
  let d = valor.replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function validar(el: HTMLInputElement) {
  const n = el.value.replace(/\D/g, "").length;
  el.setCustomValidity(n === 0 || n >= 10 ? "" : "Informe o WhatsApp com DDD, ex: (47) 99999-9999");
}

export default function PhoneInput({
  name = "phone",
  className = "",
  required = true,
  placeholder = "(47) 99999-9999",
}: {
  name?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type="tel"
      name={name}
      required={required}
      inputMode="tel"
      autoComplete="tel-national"
      maxLength={16}
      placeholder={placeholder}
      className={className}
      onInput={(e) => {
        const el = e.currentTarget;
        el.value = formatarTelefone(el.value);
        validar(el);
      }}
      onBlur={(e) => validar(e.currentTarget)}
    />
  );
}
