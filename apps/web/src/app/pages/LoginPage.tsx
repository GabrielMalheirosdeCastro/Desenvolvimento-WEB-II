import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { BookOpen, GraduationCap, User, Github, Mail, Lock, Loader2 } from "lucide-react";
import { AuthError, useAuth } from "../auth/AuthContext";

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

// Mensagens amigaveis por codigo de erro da API de auth.
const MENSAGENS_ERRO: Record<string, string> = {
  campos_obrigatorios: "Informe e-mail e senha.",
  email_invalido: "Use um e-mail institucional @faesa.br.",
  senha_invalida: "A senha deve ter entre 8 e 72 caracteres.",
  credenciais_invalidas: "E-mail ou senha incorretos.",
  auth_indisponivel: "Autenticação temporariamente indisponível. Tente mais tarde.",
  db_indisponivel: "Serviço temporariamente indisponível. Tente mais tarde.",
  erro_desconhecido: "Não foi possível entrar. Tente novamente.",
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(FALLBACK_VERSION);

  const destino =
    (location.state as { from?: string } | null)?.from || "/dashboard";

  useEffect(() => {
    let cancelled = false;
    fetch("/version")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: VersionInfo) => {
        if (!cancelled) setVersionInfo(data);
      })
      .catch(() => {
        // mantem fallback silenciosamente; tela ainda renderiza badge
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email.trim(), senha);
      navigate(destino, { replace: true });
    } catch (err) {
      const codigo = err instanceof AuthError ? err.codigo : "erro_desconhecido";
      setErro(MENSAGENS_ERRO[codigo] ?? MENSAGENS_ERRO.erro_desconhecido);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#003366] via-[#004080] to-[#0066CC] flex items-center justify-center p-4"
      data-testid="login-page"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#003366] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">F</span>
          </div>
          <h1 className="text-3xl mb-1 text-[#003366]">FAESA Acolhimento</h1>
          <p className="text-sm text-[#6C757D]">
            Sistema de Acolhimento Estudantil
          </p>
        </div>

        {/* Bloco obrigatorio pela regra 0.1 do plano:
            Disciplina, Docente, Aluno e Repositorio sempre visiveis. */}
        <dl
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6"
          data-testid="login-metadata"
        >
          <div className="flex items-start gap-2">
            <BookOpen size={18} className="text-[#0066CC] mt-0.5 shrink-0" />
            <div>
              <dt className="text-[#6C757D] text-xs uppercase tracking-wide">
                Disciplina
              </dt>
              <dd className="text-[#003366]" data-testid="meta-disciplina">
                Desenvolvimento de Aplicações Web II (D001508)
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GraduationCap size={18} className="text-[#0066CC] mt-0.5 shrink-0" />
            <div>
              <dt className="text-[#6C757D] text-xs uppercase tracking-wide">
                Docente
              </dt>
              <dd className="text-[#003366]" data-testid="meta-docente">
                Otávio Lube dos Santos
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User size={18} className="text-[#0066CC] mt-0.5 shrink-0" />
            <div>
              <dt className="text-[#6C757D] text-xs uppercase tracking-wide">
                Aluno
              </dt>
              <dd className="text-[#003366]" data-testid="meta-aluno">
                Gabriel Malheiros de Castro · 23110145
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Github size={18} className="text-[#0066CC] mt-0.5 shrink-0" />
            <div>
              <dt className="text-[#6C757D] text-xs uppercase tracking-wide">
                Repositório
              </dt>
              <dd
                className="text-[#003366] break-all"
                data-testid="meta-repositorio"
              >
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[#0066CC] hover:underline"
                >
                  GabrielMalheirosdeCastro/Desenvolvimento-WEB-II
                </a>
              </dd>
            </div>
          </div>
        </dl>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-[#003366] mb-1"
            >
              E-mail institucional
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]"
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
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-[#003366]/20 focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-[#003366]"
                data-testid="login-email"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="senha"
              className="block text-sm text-[#003366] mb-1"
            >
              Senha
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]"
                aria-hidden="true"
              />
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-[#003366]/20 focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-[#003366]"
                data-testid="login-senha"
              />
            </div>
          </div>

          {erro && (
            <p
              className="text-sm text-[#DC3545] bg-[#DC3545]/5 border border-[#DC3545]/20 rounded-lg px-3 py-2"
              role="alert"
              data-testid="login-erro"
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-[#003366] hover:bg-[#004080] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            data-testid="login-submit"
          >
            {enviando && <Loader2 size={18} className="animate-spin" />}
            {enviando ? "Entrando…" : "Entrar"}
          </button>

          <p className="text-center text-sm text-[#6C757D]">
            Primeiro acesso?{" "}
            <Link
              to="/ativar"
              className="text-[#0066CC] hover:underline"
              data-testid="login-link-ativar"
            >
              Ative sua conta
            </Link>
          </p>
        </form>

        {/* Badge oficial de validacao de redeploy (regra 0.1 do plano). */}
        <div
          className="mt-6 flex justify-center"
          data-testid="login-version-badge"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003366]/5 text-[#003366] text-xs font-mono border border-[#003366]/10">
            <span
              className="w-2 h-2 rounded-full bg-[#28A745]"
              aria-hidden="true"
            />
            {versionInfo.name} · v{versionInfo.version}
          </span>
        </div>
      </div>
    </div>
  );
}
