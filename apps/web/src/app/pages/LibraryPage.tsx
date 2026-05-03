import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { BookOpen, Video, Headphones, FileText, Search, Filter } from "lucide-react";

export function LibraryPage() {
  const resources = [
    {
      title: "Técnicas de Estudo Eficazes",
      type: "Artigo",
      category: "Metodologia",
      duration: "10 min",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Como Fazer Anotações Cornell",
      type: "Vídeo",
      category: "Técnicas",
      duration: "15 min",
      icon: Video,
      color: "red",
    },
    {
      title: "Podcast: Gestão de Tempo para Estudantes",
      type: "Podcast",
      category: "Produtividade",
      duration: "45 min",
      icon: Headphones,
      color: "purple",
    },
    {
      title: "Guia Completo de Mapas Mentais",
      type: "E-book",
      category: "Ferramentas",
      duration: "30 min",
      icon: BookOpen,
      color: "green",
    },
    {
      title: "Técnicas de Memorização",
      type: "Artigo",
      category: "Cognição",
      duration: "12 min",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Organização de Cronograma de Estudos",
      type: "Vídeo",
      category: "Planejamento",
      duration: "20 min",
      icon: Video,
      color: "red",
    },
  ];

  const learningPaths = [
    {
      title: "Fundamentos de ADS",
      courses: 8,
      duration: "6 semanas",
      level: "Iniciante",
    },
    {
      title: "Desenvolvimento Web Completo",
      courses: 12,
      duration: "10 semanas",
      level: "Intermediário",
    },
    {
      title: "Estruturas de Dados Avançadas",
      courses: 6,
      duration: "4 semanas",
      level: "Avançado",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Biblioteca de Recursos</h1>
        <p className="text-gray-600">
          Materiais curados para apoiar seu desenvolvimento acadêmico
        </p>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar recursos..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={20} />
            Filtros
          </button>
        </div>
      </div>

      {/* Trilhas de Aprendizagem */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl mb-6">Trilhas de Aprendizagem</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {learningPaths.map((path, index) => (
            <div
              key={index}
              className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-blue-600" size={20} />
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    path.level === "Iniciante"
                      ? "bg-green-100 text-green-700"
                      : path.level === "Intermediário"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {path.level}
                </span>
              </div>
              <h3 className="font-medium mb-2">{path.title}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{path.courses} cursos</p>
                <p>{path.duration}</p>
              </div>
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
                Iniciar Trilha
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Recursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className={`h-2 bg-${resource.color}-600`}></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-${resource.color}-100 rounded-lg flex items-center justify-center`}>
                  <resource.icon className={`text-${resource.color}-600`} size={24} />
                </div>
                <span className="text-sm text-gray-500">{resource.duration}</span>
              </div>
              <h3 className="font-medium mb-2">{resource.title}</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {resource.type}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {resource.category}
                </span>
              </div>
              <button className="w-full text-blue-600 hover:text-blue-700 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                Acessar Recurso
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Banner Contribuir */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 text-white">
            <h2 className="text-2xl mb-4">Encontrou um recurso útil?</h2>
            <p className="mb-6">
              Compartilhe com a comunidade! Ajude outros estudantes sugerindo 
              artigos, vídeos ou podcasts que te ajudaram.
            </p>
            <button className="bg-white text-green-600 hover:bg-gray-100 px-6 py-3 rounded-lg transition-colors">
              Sugerir Recurso
            </button>
          </div>
          <div className="h-64 md:h-auto">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1767102060241-130cb9260718?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwcmVzb3VyY2VzJTIwbGVhcm5pbmd8ZW58MXx8fHwxNzczMzQwODY1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Biblioteca de recursos"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
