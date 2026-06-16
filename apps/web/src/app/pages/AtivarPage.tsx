import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  BookOpen,
  GraduationCap,
  User,
  Github,
  Mail,
  Lock,
  IdCard,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { primeiroNome } from "../auth/nome";

interface VersionInfo {
  name: string;
  version: string;
}

const FALLBACK_VERSION: VersionInfo = {
  name: "site-acolhimento-faesa",
  version: "0.0.0",
};

const REPO_URL =
  "https://github.com/GabrielMalheirosdeCastro/Desenvolvimento-WEB-II";

// Mensagens amigaveis por codigo de erro da API de ativacao.
const MENSAGENS_ERRO: Record<string, string> = {
  campos_obrigatorios: "Preencha matrícula, e-mail e senha.",
  email_invalido: "Use um e-mail institucional @faesa.br.",
  senha_invalida: "A senha deve ter entre 8 e 72 caracteres.",
  cadastro_nao_encontrado: "Matrícula e e-mail não conferem com nenhum cadastro.",
  conta_ja_ativada: "Esta conta já foi ativada. Faça login.",
  auth_indisponivel: "Ativação temporariamente indisponível. Tente mais tarde.",
  db_indisponivel: "Serviço temporariamente indisponível. Tente mais tarde.",
  falha_ativacao: "Não foi possível ativar a conta. Tente novamente.",
  erro_desconhecido: "Não foi possível ativar a conta. Tente novamente.",
};

export function AtivarPage() {
  const navigate = useNavigate();

  const [matricula, setMatricula] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [nomeReconhecido, setNomeReconhecido] = useState<string | null>(null);
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(FALLBACK_VERSION);

  useEffect(() => {
    let cancelled = false;
    fetch("/version")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: VersionInfo) => {
        if (!cancelled) setVersionInfo(data);
      })
      .catch(() => {
        // mantem fallback silenciosamente
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function lerErro(res: Response): Promise<string> {
    try {
      const j = await res.json();
      return typeof j?.error === "string" ? j.error : "erro_desconhecido";
    } catch {
      return "erro_desconhecido";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha !== confirma) {
      setErro("As senhas não coincidem.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/auth/ativar", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          matricula: matricula.trim(),
          email: email.trim(),
          senha,
        }),
      });
      if (!res.ok) {
        const codigo = await lerErro(res);
        setErro(MENSAGENS_ERRO[codigo] ?? MENSAGENS_ERRO.erro_desconhecido);
        return;
      }
      // Reconhece o nome do cadastro casado para confirmar a identidade na tela
      // de sucesso (mesmo nome que aparecera na saudacao do dashboard).
      try {
        const j = await res.json();
        if (typeof j?.nome === "string" && j.nome.trim()) {
          setNomeReconhecido(j.nome.trim());
        }
      } catch {
        // resposta sem corpo: segue com a mensagem generica.
      }
      setSucesso(true);
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch {
      setErro(MENSAGENS_ERRO.erro_desconhecido);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#003366] via-[#004080] to-[#0066CC] flex items-center justify-center p-4"
      data-testid="ativar-page"
    >
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 select-none">
            <span aria-hidden="true" className="text-3xl font-bold text-primary-foreground">F</span>
          </div>
          <h1 className="text-3xl mb-1 text-foreground">Ativar conta</h1>
          <p className="text-sm text-muted-foreground">
            Primeiro acesso — defina sua senha
          </p>
        </div>

        {/* Bloco obrigatorio pela regra 0.1 do plano. */}
        <dl
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6"
          data-testid="ativar-metadata"
        >
          <div className="flex items-start gap-2">
            <BookOpen size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                Disciplina
              </dt>
              <dd className="text-foreground">
                Desenvolvimento de Aplicações Web II (D001508)
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GraduationCap size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                Docente
              </dt>
              <dd className="text-foreground">Otávio Lube dos Santos</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                Aluno
              </dt>
              <dd className="text-foreground">
                Gabriel Malheiros de Castro · 23110145
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Github size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                Repositório
              </dt>
              <dd className="text-foreground break-all">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary hover:underline"
                >
                  GabrielMalheirosdeCastro/Desenvolvimento-WEB-II
                </a>
              </dd>
            </div>
          </div>
        </dl>

        {sucesso ? (
          <div
            className="flex flex-col items-center gap-2 text-success py-6"
            role="status"
            data-testid="ativar-sucesso"
          >
            <CheckCircle2 size={40} />
            <p className="text-foreground">
              {nomeReconhecido
                ? `Conta ativada, ${primeiroNome(nomeReconhecido)}! Redirecionando para o login…`
                : "Conta ativada! Redirecionando para o login…"}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            data-testid="ativar-form"
          >
            <div>
              <label htmlFor="matricula" className="block text-sm text-foreground mb-1">
                Matrícula institucional
              </label>
              <div className="relative">
                <IdCard
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="matricula"
                  name="matricula"
                  type="text"
                  required
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="00000000"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  data-testid="ativar-matricula"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-foreground mb-1">
                E-mail institucional
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.nome@faesa.br"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  data-testid="ativar-email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm text-foreground mb-1">
                Nova senha
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  data-testid="ativar-senha"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirma" className="block text-sm text-foreground mb-1">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="confirma"
                  name="confirma"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  data-testid="ativar-confirma"
                />
              </div>
            </div>

            {erro && (
              <p
                className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2"
                role="alert"
                data-testid="ativar-erro"
              >
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              data-testid="ativar-submit"
            >
              {enviando && <Loader2 size={18} className="animate-spin" />}
              {enviando ? "Ativando…" : "Ativar conta"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline"
                data-testid="ativar-link-login"
              >
                Faça login
              </Link>
            </p>
          </form>
        )}

        {/* Badge oficial de validacao de redeploy (regra 0.1 do plano). */}
        <div className="mt-6 flex justify-center" data-testid="ativar-version-badge">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-foreground text-xs font-mono border border-border">
            <span
              className="w-2 h-2 rounded-full bg-success"
              aria-hidden="true"
            />
            {versionInfo.name} · v{versionInfo.version}
          </span>
        </div>
      </div>
    </div>
  );
}
