import { MessageSquare, ThumbsUp, MessageCircle, Plus, TrendingUp, Clock } from "lucide-react";

export function ForumPage() {
  const topics = [
    {
      id: 1,
      title: "Dicas para primeira semana de aula",
      author: "Maria Oliveira",
      category: "Dicas",
      replies: 24,
      likes: 18,
      lastActivity: "2 horas atrás",
      excerpt: "Gostaria de compartilhar algumas dicas que me ajudaram muito no início...",
    },
    {
      id: 2,
      title: "Como organizar tempo entre trabalho e estudos?",
      author: "João Pedro",
      category: "Discussão",
      replies: 15,
      likes: 12,
      lastActivity: "4 horas atrás",
      excerpt: "Trabalho durante o dia e estudo à noite, alguém tem dicas de organização?",
    },
    {
      id: 3,
      title: "Melhores recursos para aprender programação",
      author: "Ana Carolina",
      category: "Recursos",
      replies: 31,
      likes: 27,
      lastActivity: "1 dia atrás",
      excerpt: "Vou listar aqui os recursos que mais me ajudaram a aprender...",
    },
    {
      id: 4,
      title: "Lidar com ansiedade em época de provas",
      author: "Carlos Eduardo",
      category: "Bem-estar",
      replies: 19,
      likes: 22,
      lastActivity: "1 dia atrás",
      excerpt: "Queria compartilhar técnicas que me ajudam a lidar com a ansiedade...",
    },
  ];

  const categories = [
    { name: "Todos", count: 156, active: true },
    { name: "Dicas", count: 42, active: false },
    { name: "Discussão", count: 38, active: false },
    { name: "Recursos", count: 29, active: false },
    { name: "Bem-estar", count: 24, active: false },
    { name: "Dúvidas", count: 23, active: false },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Fórum de Discussão</h1>
          <p className="text-gray-600">
            Compartilhe experiências e tire dúvidas com a comunidade
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
          <Plus size={20} />
          Novo Tópico
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com Categorias */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium mb-4">Categorias</h3>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                    category.active
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span>{category.name}</span>
                  <span className={`text-sm ${category.active ? "text-blue-100" : "text-gray-500"}`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <h3 className="font-medium mb-4">Regras do Fórum</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Seja respeitoso com todos</li>
              <li>• Não compartilhe informações pessoais</li>
              <li>• Evite spam e conteúdo irrelevante</li>
              <li>• Use categorias apropriadas</li>
            </ul>
          </div>
        </div>

        {/* Lista de Tópicos */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                <TrendingUp size={18} />
                Mais Populares
              </button>
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Clock size={18} />
                Recentes
              </button>
            </div>
          </div>

          {/* Tópicos */}
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    {topic.author.split(" ").map(n => n[0]).join("")}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg hover:text-blue-600 transition-colors">
                      {topic.title}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap">
                      {topic.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{topic.excerpt}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>{topic.author}</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={16} />
                      {topic.replies} respostas
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={16} />
                      {topic.likes}
                    </span>
                    <span className="ml-auto">{topic.lastActivity}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Paginação */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-center gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Anterior
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">1</button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                3
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
