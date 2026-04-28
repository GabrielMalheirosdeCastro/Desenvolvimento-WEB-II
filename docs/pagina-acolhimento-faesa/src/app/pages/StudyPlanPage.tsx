import { Plus, Calendar, Target, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";

export function StudyPlanPage() {
  const [goals, setGoals] = useState([
    { id: 1, title: "Revisar Capítulo 3 de Cálculo", subject: "Cálculo I", deadline: "2026-03-15", completed: false },
    { id: 2, title: "Fazer exercícios de programação", subject: "Programação I", deadline: "2026-03-14", completed: true },
    { id: 3, title: "Ler artigos sobre estrutura de dados", subject: "Estrutura de Dados", deadline: "2026-03-16", completed: false },
    { id: 4, title: "Preparar apresentação de projeto", subject: "Engenharia de Software", deadline: "2026-03-18", completed: false },
  ]);

  const toggleGoal = (id: number) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  const weeklyStats = {
    totalGoals: 12,
    completed: 8,
    pending: 4,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Plano de Estudos</h1>
          <p className="text-gray-600">
            Organize suas metas e acompanhe seu progresso
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
          <Plus size={20} />
          Nova Meta
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg">Total de Metas</h3>
          </div>
          <p className="text-3xl">{weeklyStats.totalGoals}</p>
          <p className="text-sm text-gray-600 mt-1">Esta semana</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg">Concluídas</h3>
          </div>
          <p className="text-3xl text-green-600">{weeklyStats.completed}</p>
          <p className="text-sm text-gray-600 mt-1">{Math.round((weeklyStats.completed / weeklyStats.totalGoals) * 100)}% das metas</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Target className="text-yellow-600" size={20} />
            </div>
            <h3 className="text-lg">Pendentes</h3>
          </div>
          <p className="text-3xl text-yellow-600">{weeklyStats.pending}</p>
          <p className="text-sm text-gray-600 mt-1">Restantes</p>
        </div>
      </div>

      {/* Lista de Metas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl mb-6">Minhas Metas</h2>
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                goal.completed
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={() => toggleGoal(goal.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <h3
                    className={`font-medium mb-1 ${
                      goal.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {goal.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {goal.subject}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 size={18} className="text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendário de Estudos */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl mb-6">Calendário de Estudos</h2>
        <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-12 text-center">
          <Calendar className="mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600 mb-4">
            Calendário interativo com drag-and-drop será implementado aqui
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            Organizar Horários
          </button>
        </div>
      </div>
    </div>
  );
}
