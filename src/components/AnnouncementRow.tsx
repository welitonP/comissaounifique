"use client";

import { useState } from "react";
import { updateAnnouncement, deleteAnnouncement } from "@/lib/actions";
import PhotoField from "@/components/PhotoField";

type Announcement = {
  id: string;
  title: string;
  body: string;
  images: { id: string }[];
};

export default function AnnouncementRow({ announcement }: { announcement: Announcement }) {
  const [editing, setEditing] = useState(false);
  const a = announcement;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h2 className="font-semibold">{a.title}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{a.body}</p>
          {a.images.length > 0 && (
            <div className="mt-2 flex gap-2">
              {a.images.map((img) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={img.id}
                  src={`/api/imagens/${img.id}`}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-sm font-medium text-unifique-blue hover:underline"
          >
            {editing ? "Fechar" : "Editar"}
          </button>
          <form action={deleteAnnouncement}>
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Remover
            </button>
          </form>
        </div>
      </div>

      {editing && (
        <form
          action={updateAnnouncement}
          className="mt-3 space-y-3 border-t border-gray-100 pt-3"
        >
          <input type="hidden" name="id" value={a.id} />
          <div>
            <label className="block text-xs font-medium text-gray-500">Título</label>
            <input
              name="title"
              defaultValue={a.title}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Mensagem</label>
            <textarea
              name="body"
              defaultValue={a.body}
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          {a.images.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Fotos atuais <span className="font-normal text-gray-400">(marque para remover)</span>
              </label>
              <div className="mt-1 flex flex-wrap gap-3">
                {a.images.map((img) => (
                  <label key={img.id} className="relative cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/imagens/${img.id}`}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <span className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-white/90 px-1 text-[10px] font-medium text-red-600 shadow">
                      <input
                        type="checkbox"
                        name="removeImage"
                        value={img.id}
                        className="h-3 w-3"
                      />
                      remover
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <PhotoField />

          <button
            type="submit"
            className="rounded-lg bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
          >
            Salvar alterações
          </button>
        </form>
      )}
    </div>
  );
}
