import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Users, MessageCircle, Calendar, Star, Search } from "lucide-react";

export function MentorshipPage() {
  const mentors = [
    {
      name: "Ana Silva",
      course: "Análise e Desenvolvimento de Sistemas",
      period: "7º Período",
      cra: 8.5,
      specialties: ["Programação", "Estrutura de Dados"],
      rating: 4.9,
      sessions: 23,
    },
    {
      name: "Carlos Santos",
      course: "Engenharia de Software",
      period: "6º Período",
      cra: 8.2,
      specialties: ["Banco de Dados", "DevOps"],
      rating: 4.8,
      sessions: 18,
    },
    {
      name: "Mariana Costa",
      course: "Ciência da Computação",
      period: "8º Período",
      cra: 9.0,
      specialties: ["Algoritmos", "IA"],
      rating: 5.0,
      sessions: 31,
    },
  ];

  const myMentoringSessions = [
    {
      mentor: "Ana Silva",
      topic: "Estruturas de Dados Avançadas",
      date: "2026-03-16",
      time: "14:00",
      status: "scheduled",
    },
    {
      mentor: "Carlos Santos",
      topic: "Projeto de Banco de Dados",
      date: "2026-03-19",
      time: "10:00",
      status: "scheduled",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Sistema de Mentoria</h1>
        <p className="text-gray-600">
          Conecte-se com veteranos experientes para orientação acadêmica
        </p>
      </div>

      {/* Minhas Sessões */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="text-blue-600" size={24} />
          <h2 className="text-xl">Minhas Sessões Agendadas</h2>
        </div>
        <div className="space-y-4">
          {myMentoringSessions.map((session, index) => (
            <div key={index} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium mb-1">{session.topic}</h3>
                <p className="text-sm text-gray-600">
                  com {session.mentor}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <p className="text-gray-600">
                    {new Date(session.date).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-gray-900">{session.time}</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <MessageCircle size={18} />
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buscar Mentores */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl mb-6">Encontre um Mentor</h2>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por especialidade, curso ou nome..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                  {mentor.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <span className="text-sm text-gray-900">{mentor.rating}</span>
                </div>
              </div>

              <h3 className="font-medium mb-1">{mentor.name}</h3>
              <p className="text-sm text-gray-600 mb-1">{mentor.course}</p>
              <p className="text-sm text-gray-600 mb-3">{mentor.period} • CRA: {mentor.cra}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {mentor.specialties.map((specialty, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {specialty}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Users size={16} />
                <span>{mentor.sessions} sessões realizadas</span>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                Solicitar Mentoria
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Banner Torne-se Mentor */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 text-white">
            <h2 className="text-2xl mb-4">Seja um Mentor!</h2>
            <p className="mb-6">
              Compartilhe seu conhecimento e ajude calouros a terem sucesso. 
              Requisitos: 5º período ou superior com CRA ≥ 7,0.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Desenvolva habilidades de liderança
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Ganhe pontos e badges exclusivos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Faça networking com outros estudantes
              </li>
            </ul>
            <button className="bg-white text-purple-600 hover:bg-gray-100 px-6 py-3 rounded-lg transition-colors">
              Candidatar-se como Mentor
            </button>
          </div>
          <div className="h-64 md:h-auto">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1759755486391-d7bd120924f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW50b3JzaGlwJTIwY29udmVyc2F0aW9uJTIwZ3VpZGFuY2V8ZW58MXx8fHwxNzczMzQwODY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Mentoria"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
