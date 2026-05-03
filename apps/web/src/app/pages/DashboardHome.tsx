import { Target, Clock, Flame, Award, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function DashboardHome() {
  const weekData = [
    { day: "Seg", hours: 4 },
    { day: "Ter", hours: 5 },
    { day: "Qua", hours: 3 },
    { day: "Qui", hours: 6 },
    { day: "Sex", hours: 4 },
    { day: "Sáb", hours: 2 },
    { day: "Dom", hours: 1 },
  ];

  const recentBadges = [
    { name: "Primeira Semana", icon: "🎓" },
    { name: "5 Horas de Estudo", icon: "📚" },
    { name: "Meta Cumprida", icon: "🎯" },
  ];

  const upcomingActivities = [
    { title: "Revisão de Cálculo I", date: "13/03", type: "Estudo", status: "pending" },
    { title: "Trabalho de Programação", date: "15/03", type: "Entrega", status: "pending" },
    { title: "Sessão de Mentoria", date: "16/03", type: "Mentoria", status: "scheduled" },
    { title: "Avaliação de Bem-estar", date: "18/03", type: "Questionário", status: "pending" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-[#003366]">Bem-vindo de volta, Gabriel! 👋</h1>
        <p className="text-[#6C757D]">
          Aqui está um resumo do seu progresso acadêmico
        </p>
      </div>

      {/* Cards de Progresso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#0066CC]/10 rounded-lg flex items-center justify-center">
              <Target className="text-[#0066CC]" size={24} />
            </div>
            <span className="text-2xl font-semibold text-[#003366]">85%</span>
          </div>
          <h3 className="text-lg mb-1 text-[#003366]">Metas da Semana</h3>
          <p className="text-sm text-[#6C757D]">6 de 7 concluídas</p>
          <div className="mt-3 w-full bg-[#F5F7FA] rounded-full h-2">
            <div className="bg-[#0066CC] h-2 rounded-full" style={{ width: "85%" }}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#28A745]/10 rounded-lg flex items-center justify-center">
              <Clock className="text-[#28A745]" size={24} />
            </div>
            <span className="text-2xl font-semibold text-[#003366]">25h</span>
          </div>
          <h3 className="text-lg mb-1 text-[#003366]">Horas de Estudo</h3>
          <p className="text-sm text-[#6C757D]">Esta semana</p>
          <p className="text-sm text-[#28A745] mt-2">↑ 15% vs. semana anterior</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#FF8C00]/10 rounded-lg flex items-center justify-center">
              <Flame className="text-[#FF8C00]" size={24} />
            </div>
            <span className="text-2xl font-semibold text-[#003366]">12</span>
          </div>
          <h3 className="text-lg mb-1 text-[#003366]">Sequência de Dias</h3>
          <p className="text-sm text-[#6C757D]">Dias consecutivos</p>
          <p className="text-sm text-[#FF8C00] mt-2">🔥 Continue assim!</p>
        </div>
      </div>

      {/* Gráfico de Horas de Estudo */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-[#0066CC]" size={24} />
          <h2 className="text-xl text-[#003366]">Horas de Estudo Semanal</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" />
            <XAxis dataKey="day" stroke="#6C757D" />
            <YAxis stroke="#6C757D" />
            <Tooltip />
            <Bar dataKey="hours" fill="#003366" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Atividades */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-[#0066CC]" size={24} />
            <h2 className="text-xl text-[#003366]">Próximas Atividades</h2>
          </div>
          <div className="space-y-4">
            {upcomingActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-[#F5F7FA] rounded-lg border border-[#003366]/5">
                <div className="flex-1">
                  <h4 className="font-medium text-[#003366]">{activity.title}</h4>
                  <p className="text-sm text-[#6C757D]">
                    {activity.date} • {activity.type}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === "scheduled"
                      ? "bg-[#28A745]/10 text-[#28A745]"
                      : "bg-[#FF8C00]/10 text-[#FF8C00]"
                  }`}
                >
                  {activity.status === "scheduled" ? "Agendado" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges Recentes */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-[#003366]/10">
          <div className="flex items-center gap-2 mb-6">
            <Award className="text-[#0066CC]" size={24} />
            <h2 className="text-xl text-[#003366]">Conquistas Recentes</h2>
          </div>
          <div className="space-y-4">
            {recentBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#0066CC]/10 to-[#28A745]/10 rounded-lg border border-[#0066CC]/20">
                <div className="text-4xl">{badge.icon}</div>
                <div>
                  <h4 className="font-medium text-[#003366]">{badge.name}</h4>
                  <p className="text-sm text-[#6C757D]">Desbloqueado recentemente</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full text-center text-[#0066CC] hover:text-[#003366] py-2 border border-[#0066CC] rounded-lg hover:bg-[#0066CC]/5 transition-colors font-medium">
            Ver Todas as Conquistas
          </button>
        </div>
      </div>
    </div>
  );
}