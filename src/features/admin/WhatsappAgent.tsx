import { useState } from 'react';
import { useStore, botReply } from '../../lib/store';
import { PageHeader, Card, Button, Toggle } from '../../components/ui';
import type { WhatsappTemplate } from '../../lib/types';

// Agente de IA para WhatsApp: recordatorios de pago, avisos y respuestas del bot.
export default function WhatsappAgent() {
  const {
    currentStudio, updateWhatsapp, upsertWhatsappTemplate, deleteWhatsappTemplate,
    addKnowledge, removeKnowledge,
  } = useStore();
  const wa = currentStudio!.whatsapp;

  const [tplDraft, setTplDraft] = useState<WhatsappTemplate | null>(null);
  const [newKnow, setNewKnow] = useState('');
  const [chat, setChat] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    const reply = wa.botEnabled
      ? botReply(q, wa.knowledge)
      : 'El bot está desactivado. Un miembro del estudio responderá pronto.';
    setChat((c) => [...c, { from: 'user', text: q }, { from: 'bot', text: reply }]);
    setChatInput('');
  };

  return (
    <>
      <PageHeader title="WhatsApp IA" subtitle="Recordatorios de pago, avisos del estudio y respuestas automáticas del bot" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuración */}
        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-3">Configuración</h2>
          <label className="block mb-4">
            <span className="mb-1 block text-sm font-medium text-ink-soft">Número de WhatsApp (formato internacional, sin +)</span>
            <input
              className="input"
              placeholder="521234567890"
              value={wa.number}
              onChange={(e) => updateWhatsapp({ number: e.target.value.replace(/[^\d]/g, '') })}
            />
          </label>
          <div className="border-t border-cream-dark pt-2">
            <Toggle
              label="Bot con IA activo"
              description="Responde solo a los alumnos usando la base de conocimiento."
              checked={wa.botEnabled}
              onChange={(v) => updateWhatsapp({ botEnabled: v })}
            />
          </div>
          {wa.number && (
            <a
              href={`https://wa.me/${wa.number}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-brand font-medium"
            >
              Abrir chat de prueba: wa.me/{wa.number} ↗
            </a>
          )}
        </Card>

        {/* Base de conocimiento / retro */}
        <Card className="p-6">
          <h2 className="font-semibold text-ink mb-1">Retroalimentación del bot</h2>
          <p className="text-sm text-ink-faint mb-3">Enséñale respuestas para que conteste por sí solo.</p>
          <div className="space-y-2 max-h-44 overflow-y-auto mb-3">
            {wa.knowledge.map((k, i) => (
              <div key={i} className="flex items-start justify-between gap-2 rounded-lg bg-cream-dark/40 px-3 py-2 text-sm">
                <span className="text-ink-soft">{k}</span>
                <button onClick={() => removeKnowledge(i)} className="text-red-600 shrink-0">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Ej. El estacionamiento es gratuito." value={newKnow} onChange={(e) => setNewKnow(e.target.value)} />
            <Button onClick={() => { if (newKnow.trim()) { addKnowledge(newKnow.trim()); setNewKnow(''); } }}>Agregar</Button>
          </div>
        </Card>

        {/* Plantillas de mensajes */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Mensajes editables</h2>
            <Button onClick={() => setTplDraft({ id: 'new', label: '', text: '' })}>+ Nueva plantilla</Button>
          </div>
          <p className="text-sm text-ink-faint mb-3">Variables disponibles: {'{nombre}'}, {'{plan}'}, {'{fecha}'}, {'{hora}'}, {'{clase}'}, {'{estudio}'}.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {wa.templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-cream-dark p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{t.label}</p>
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => setTplDraft({ ...t })} className="text-brand font-medium">Editar</button>
                    <button onClick={() => deleteWhatsappTemplate(t.id)} className="text-red-600">✕</button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-ink-soft whitespace-pre-wrap">{t.text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Simulador del bot */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-ink mb-3">Prueba al bot</h2>
          <div className="rounded-xl bg-[#e7ded0]/40 border border-cream-dark p-4 h-56 overflow-y-auto space-y-2">
            {chat.length === 0 && <p className="text-sm text-ink-faint text-center mt-16">Escribe un mensaje para ver cómo responde el bot.</p>}
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === 'user' ? 'bg-brand text-cream' : 'bg-white text-ink border border-cream-dark'}`}>{m.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input className="input" placeholder="Escribe como si fueras un alumno…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
            <Button onClick={sendChat}>Enviar</Button>
          </div>
        </Card>
      </div>

      {tplDraft && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-ink mb-4">{tplDraft.id === 'new' ? 'Nueva plantilla' : 'Editar plantilla'}</h2>
            <label className="block mb-3">
              <span className="mb-1 block text-sm font-medium text-ink-soft">Nombre</span>
              <input className="input" value={tplDraft.label} onChange={(e) => setTplDraft({ ...tplDraft, label: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-soft">Mensaje</span>
              <textarea rows={4} className="input" value={tplDraft.text} onChange={(e) => setTplDraft({ ...tplDraft, text: e.target.value })} />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTplDraft(null)}>Cancelar</Button>
              <Button onClick={() => { if (tplDraft.label.trim()) { upsertWhatsappTemplate(tplDraft); setTplDraft(null); } }}>Guardar</Button>
            </div>
          </Card>
        </div>
      )}
      <style>{`.input{width:100%;border:1px solid #E8E3D6;border-radius:.75rem;padding:.6rem .8rem;background:#fff;outline:none}.input:focus{box-shadow:0 0 0 2px var(--brand-primary)}`}</style>
    </>
  );
}
