import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

const STORAGE_KEY = "site-acolhimento.lgpd.aceite";
const TERMO_VERSAO = "1.0";

/**
 * Modal bloqueante de consentimento LGPD (RNF09 / decisão P7-a).
 * Exibido no primeiro acesso. Após o aceite, registra no `localStorage` e
 * persiste no banco via `POST /api/lgpd/consentimento`. Não reaparece.
 */
export function LgpdModal() {
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    try {
      const aceito = localStorage.getItem(STORAGE_KEY);
      if (!aceito) setAberto(true);
    } catch {
      setAberto(true);
    }
  }, []);

  async function aceitar() {
    setEnviando(true);
    try {
      await fetch("/api/lgpd/consentimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalidade: "uso_geral", versaoTermo: TERMO_VERSAO }),
      });
    } catch {
      // segue o fluxo: aceite local não bloqueado por falha de rede
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ versao: TERMO_VERSAO, registradoEm: new Date().toISOString() }),
      );
    } catch {
      // ambiente sem storage — modal não reabre porque o estado já é false
    }
    setEnviando(false);
    setAberto(false);
  }

  if (!aberto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lgpd-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="bg-card rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="text-primary" size={24} />
          </div>
          <h2 id="lgpd-titulo" className="text-xl font-semibold text-foreground">
            Termo de Consentimento — LGPD
          </h2>
        </div>
        <p className="text-sm text-foreground">
          O Site de Acolhimento FAESA coleta dados acadêmicos (matrícula, progresso de estudos,
          interações em fórum/mentoria) para personalizar a experiência e gerar relatórios
          institucionais <strong>anonimizados</strong>. Você pode revogar este consentimento a
          qualquer momento em &quot;Perfil &gt; Privacidade&quot;.
        </p>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
          <li>Base legal: consentimento (Art. 7º, I da Lei 13.709/2018).</li>
          <li>Finalidades: acolhimento, mentoria, gamificação e métricas agregadas.</li>
          <li>Compartilhamento com terceiros: nenhum.</li>
          <li>Versão do termo: {TERMO_VERSAO}.</li>
        </ul>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={aceitar}
            disabled={enviando}
            className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
          >
            {enviando ? "Registrando..." : "Li e concordo"}
          </button>
        </div>
      </div>
    </div>
  );
}
