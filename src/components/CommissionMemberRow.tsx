"use client";

import { useState } from "react";
import { updateCommissionMember, deleteCommissionMember } from "@/lib/actions";
import BotaoApagar from "@/components/admin/BotaoApagar";

type Member = {
  id: string;
  name: string;
  role: string;
  whatsapp: string | null;
  order: number;
  photoMime: string | null;
};

export default function CommissionMemberRow({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="cartao">
      <div className="flex items-center gap-3">
        {member.photoMime ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/comissao-foto/${member.id}`}
            alt={member.name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-unifique-light text-sm font-bold text-unifique">
            {member.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <p className="font-medium">{member.name}</p>
          <p className="text-sm text-gray-500">{member.role}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex min-h-[38px] items-center rounded-xl px-3 py-2 text-sm font-semibold text-unifique-blue transition hover:bg-unifique-light dark:hover:bg-white/5"
          >
            {editing ? "Fechar" : "Editar"}
          </button>
          <form action={deleteCommissionMember}>
            <input type="hidden" name="id" value={member.id} />
            <BotaoApagar mensagem="Tirar esta pessoa da página A Comissão?">Remover</BotaoApagar>
          </form>
        </div>
      </div>

      {editing && (
        <form
          action={updateCommissionMember}
          className="mt-3 space-y-3 border-t border-gray-100 pt-3"
        >
          <input type="hidden" name="id" value={member.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block">
                <span className="rotulo">Nome</span>
                <input
                  name="name"
                  defaultValue={member.name}
                  required
                  className="campo"
                />
              </label>
            </div>
            <div>
              <label className="block">
                <span className="rotulo">Função</span>
                <input
                  name="role"
                  defaultValue={member.role}
                  required
                  className="campo"
                />
              </label>
            </div>
            <div>
              <label className="block">
                <span className="rotulo">WhatsApp com DDD (ex: 47999998888)</span>
                <input
                  name="whatsapp"
                  defaultValue={member.whatsapp ?? ""}
                  className="campo"
                />
              </label>
            </div>
            <div>
              <label className="block">
                <span className="rotulo">Ordem de exibição (0 aparece primeiro)</span>
                <input
                  name="order"
                  type="number"
                  defaultValue={member.order}
                  className="campo"
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block">
                <span className="block text-xs font-medium text-gray-500">Trocar foto <span className="text-gray-400">(opcional, deixe em branco para manter)</span></span>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-unifique file:px-3 file:py-1.5 file:text-sm file:text-white"
                />
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="btn-primario"
          >
            Salvar alterações
          </button>
        </form>
      )}
    </div>
  );
}
