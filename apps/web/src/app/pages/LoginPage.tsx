import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, GraduationCap, User, Github } from "lucide-react";

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

export function LoginPage() {
  const navigate = useNavigate();
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(FALLBACK_VERSION);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Decisao B4 do plano: protótipo sem autenticacao.
    navigate("/dashboard");
  };

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="submit"
            className="w-full bg-[#003366] hover:bg-[#004080] text-white py-3 rounded-lg transition-colors"
            data-testid="login-submit"
          >
            Entrar
          </button>
          <p className="text-center text-xs text-[#6C757D]">
            Protótipo acadêmico sem autenticação real (decisão B4).
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
