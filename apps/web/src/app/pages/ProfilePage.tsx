import { User, Mail, Book, Calendar, Award, Settings, Bell, Trophy, TrendingUp } from "lucide-react";

export function ProfilePage() {
  const badges = [
    { name: "Primeira Semana", icon: "🎓", earned: true },
    { name: "5 Horas de Estudo", icon: "📚", earned: true },
    { name: "Meta Cumprida", icon: "🎯", earned: true },
    { name: "Mentor Ativo", icon: "👨‍🏫", earned: false },
    { name: "10 Posts no Fórum", icon: "💬", earned: false },
    { name: "Sequência 30 Dias", icon: "🔥", earned: false },
  ];

  const stats = [
    { label: "Horas de Estudo Total", value: "142h", icon: Book },
    { label: "Metas Cumpridas", value: "38", icon: Award },
    { label: "Dias Consecutivos", value: "12", icon: Calendar },
    { label: "Sessões de Mentoria", value: "5", icon: User },
  ];

  const pointsHistory = [
    { action: "Meta concluída", points: 50, date: "Hoje" },
    { action: "Sessão Pomodoro", points: 25, date: "Hoje" },
    { action: "Post no fórum", points: 10, date: "Ontem" },
    { action: "Avaliação de bem-estar", points: 15, date: "Ontem" },
  ];

  const totalPoints = 850;
  const nextBadgePoints = 1000;
  const pointsToNextBadge = nextBadgePoints - totalPoints;
  const progressPercentage = (totalPoints / nextBadgePoints) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-[#003366]">Meu Perfil</h1>
        <p className="text-[#6C757D]">Gerencie suas informações e preferências</p>
      </div>

      {/* Card de Pontuação */}
      <div className="bg-gradient-to-r from-[#003366] to-[#0066CC] rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Pontuação Total</h3>
              <p className="text-white/80 text-sm">Sistema de Gamificação</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{totalPoints}</div>
            <div className="text-white/80 text-sm">pontos</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso para próximo badge</span>
            <span>{pointsToNextBadge} pontos restantes</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Informações do Perfil */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-[#003366] rounded-full flex items-center justify-center text-white text-4xl">
              GM
            </div>
            <button className="mt-4 w-32 text-sm text-[#0066CC] hover:text-[#003366]">
              Alterar Foto
            </button>
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">Nome Completo</label>
                <input
                  type="text"
                  value="Gabriel Malheiros de Castro"
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">Matrícula</label>
                <input
                  type="text"
                  value="23110145"
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg bg-[#F5F7FA]"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">E-mail Institucional</label>
                <input
                  type="email"
                  value="gabriel.castro@aluno.faesa.br"
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">Curso</label>
                <input
                  type="text"
                  value="Análise e Desenvolvimento de Sistemas"
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg bg-[#F5F7FA]"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">Período</label>
                <input
                  type="text"
                  value="1º Período"
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg bg-[#F5F7FA]"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-[#6C757D] mb-1">CRA</label>
                <input
                  type="text"
                  value="8.5"
                  className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg bg-[#F5F7FA]"
                  readOnly
                />
              </div>
            </div>
            <button className="bg-[#003366] hover:bg-[#004080] text-white px-6 py-2 rounded-lg transition-colors">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas e Histórico de Pontos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estatísticas */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4 border border-[#003366]/10 text-center">
              <div className="w-10 h-10 bg-[#0066CC]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <stat.icon className="text-[#0066CC]" size={20} />
              </div>
              <div className="text-2xl font-semibold text-[#003366] mb-1">{stat.value}</div>
              <div className="text-xs text-[#6C757D]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Histórico de Pontos Recentes */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-[#0066CC]" size={20} />
            <h3 className="font-semibold text-[#003366]">Pontos Recentes</h3>
          </div>
          <div className="space-y-3">
            {pointsHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-[#003366]">{item.action}</div>
                  <div className="text-xs text-[#6C757D]">{item.date}</div>
                </div>
                <div className="font-semibold text-[#28A745]">+{item.points}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conquistas */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
        <div className="flex items-center gap-2 mb-6">
          <Award className="text-[#0066CC]" size={24} />
          <h2 className="text-xl text-[#003366]">Minhas Conquistas</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg text-center transition-all ${
                badge.earned
                  ? "bg-gradient-to-br from-[#FFD700]/20 to-[#FF8C00]/20 border-2 border-[#FFD700]/50"
                  : "bg-[#F5F7FA] opacity-50"
              }`}
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <div className="text-sm font-medium text-[#003366]">{badge.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="text-[#0066CC]" size={24} />
            <h2 className="text-xl text-[#003366]">Notificações</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Notificações por e-mail</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Lembretes de metas</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Atualizações do fórum</span>
              <input type="checkbox" className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Sessões de mentoria</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="text-[#0066CC]" size={24} />
            <h2 className="text-xl text-[#003366]">Preferências</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#6C757D] mb-2">Tema</label>
              <select className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none">
                <option>Claro</option>
                <option>Escuro</option>
                <option>Automático</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6C757D] mb-2">Idioma</label>
              <select className="w-full px-4 py-2 border border-[#003366]/20 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none">
                <option>Português (BR)</option>
                <option>English (US)</option>
              </select>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[#003366]">Perfil público</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0066CC] rounded" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}