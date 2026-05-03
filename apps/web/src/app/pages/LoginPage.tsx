import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - em produção, integrar com SSO/OAuth
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003366] via-[#004080] to-[#0066CC] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#003366] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">F</span>
          </div>
          <h1 className="text-3xl mb-2 text-[#003366]">FAESA Acolhimento</h1>
          <p className="text-[#6C757D]">
            Sistema de Acolhimento Estudantil
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm mb-2 text-[#003366]">
              E-mail Institucional
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]" size={20} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#003366]/20 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none"
                placeholder="seu.email@aluno.faesa.br"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-2 text-[#003366]">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]" size={20} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#003366]/20 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#003366] hover:bg-[#004080] text-white py-3 rounded-lg transition-colors"
          >
            Entrar
          </button>

          <div className="text-center">
            <a href="#" className="text-sm text-[#0066CC] hover:underline">
              Primeiro acesso? Cadastre-se
            </a>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#003366]/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[#6C757D]">ou</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full border-2 border-[#0066CC] hover:bg-[#0066CC] hover:text-white text-[#003366] py-3 rounded-lg transition-colors"
          >
            Login via SSO Institucional
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-[#6C757D]">
          <p>Matrícula: 23110145</p>
          <p className="mt-1">Disciplina: Desenvolvimento de Aplicações Web II</p>
        </div>
      </div>
    </div>
  );
}