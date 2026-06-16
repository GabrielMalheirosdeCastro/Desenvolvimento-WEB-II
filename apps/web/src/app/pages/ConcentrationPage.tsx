import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Clock, Play, Pause, RotateCcw, Wind, Heart } from "lucide-react";
import { useState, useEffect } from "react";

export function ConcentrationPage() {
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutos em segundos
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");

  // Exercicio de respiracao guiada 4-7-8 (client-side, RF04 / item H4).
  const fasesRespiracao = [
    { nome: "Inspire", instrucao: "Inspire pelo nariz", segundos: 4, escala: "scale-110" },
    { nome: "Segure", instrucao: "Segure a respiração", segundos: 7, escala: "scale-110" },
    { nome: "Expire", instrucao: "Expire pela boca", segundos: 8, escala: "scale-75" },
  ];
  const [respirando, setRespirando] = useState(false);
  const [faseIdx, setFaseIdx] = useState(0);
  const [segRestante, setSegRestante] = useState(fasesRespiracao[0].segundos);
  const [ciclos, setCiclos] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsRunning(false);
      // Aqui poderia adicionar notificação sonora
    }
    return () => clearInterval(interval);
  }, [isRunning, pomodoroTime]);

  // Ciclo da respiracao guiada: avanca de fase ao zerar a contagem.
  useEffect(() => {
    if (!respirando) return;
    const interval = setInterval(() => {
      setSegRestante((prev) => {
        if (prev > 1) return prev - 1;
        // Troca de fase; ao voltar para "Inspire" conta um ciclo completo.
        setFaseIdx((idxAtual) => {
          const proximo = (idxAtual + 1) % fasesRespiracao.length;
          if (proximo === 0) setCiclos((c) => c + 1);
          return proximo;
        });
        // Mantem em 1 ate o efeito de [faseIdx] recarregar a contagem da nova fase.
        return 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respirando]);

  // Recarrega a contagem sempre que a fase muda.
  useEffect(() => {
    setSegRestante(fasesRespiracao[faseIdx].segundos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faseIdx]);

  const faseAtual = fasesRespiracao[faseIdx];

  function alternarRespiracao() {
    if (respirando) {
      setRespirando(false);
      setFaseIdx(0);
      setSegRestante(fasesRespiracao[0].segundos);
      setCiclos(0);
    } else {
      setFaseIdx(0);
      setSegRestante(fasesRespiracao[0].segundos);
      setCiclos(0);
      setRespirando(true);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setPomodoroTime(mode === "work" ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: "work" | "break") => {
    setMode(newMode);
    setIsRunning(false);
    setPomodoroTime(newMode === "work" ? 25 * 60 : 5 * 60);
  };

  const techniques = [
    {
      title: "Técnica Pomodoro",
      description: "25 minutos de foco intenso seguidos de 5 minutos de pausa",
      icon: Clock,
      color: "blue",
    },
    {
      title: "Exercícios Respiratórios",
      description: "Técnicas de respiração para reduzir ansiedade e melhorar foco",
      icon: Wind,
      color: "green",
    },
    {
      title: "Mindfulness",
      description: "Práticas de atenção plena para aumentar concentração",
      icon: Heart,
      color: "purple",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-foreground">Exercícios de Concentração</h1>
        <p className="text-muted-foreground">
          Técnicas comprovadas para melhorar seu foco e produtividade
        </p>
      </div>

      {/* Timer Pomodoro */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl text-center mb-8">Timer Pomodoro</h2>
          
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => switchMode("work")}
              className={`px-6 py-2 rounded-lg transition-colors ${
                mode === "work"
                  ? "bg-white text-blue-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              Trabalho
            </button>
            <button
              onClick={() => switchMode("break")}
              className={`px-6 py-2 rounded-lg transition-colors ${
                mode === "break"
                  ? "bg-white text-blue-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              Pausa
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="text-7xl mb-4 font-mono">{formatTime(pomodoroTime)}</div>
            <p className="text-blue-100">
              {mode === "work" ? "Tempo de Foco" : "Tempo de Pausa"}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {isRunning ? (
                <>
                  <Pause size={20} />
                  Pausar
                </>
              ) : (
                <>
                  <Play size={20} />
                  Iniciar
                </>
              )}
            </button>
            <button
              onClick={resetTimer}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-colors"
            >
              <RotateCcw size={20} />
              Resetar
            </button>
          </div>
        </div>
      </div>

      {/* Técnicas Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {techniques.map((technique, index) => (
          <div key={index} className="bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div
              className={`w-12 h-12 bg-${technique.color}-100 rounded-lg flex items-center justify-center mb-4`}
            >
              <technique.icon className={`text-${technique.color}-600`} size={24} />
            </div>
            <h3 className="text-lg mb-2 text-foreground">{technique.title}</h3>
            <p className="text-muted-foreground mb-4">{technique.description}</p>
            <button className="text-primary hover:text-primary/80 transition-colors">
              Experimentar →
            </button>
          </div>
        ))}
      </div>

      {/* Seção de Mindfulness */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8">
            <h2 className="text-2xl mb-4 text-foreground">Exercício de Respiração 4-7-8</h2>
            {respirando ? (
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className={`w-40 h-40 rounded-full bg-blue-100 border-4 border-blue-500 flex items-center justify-center transition-transform duration-1000 ease-in-out ${faseAtual.escala}`}
                >
                  <div>
                    <div className="text-3xl font-mono text-blue-700">{segRestante}</div>
                    <div className="text-sm text-blue-600">{faseAtual.nome}</div>
                  </div>
                </div>
                <p className="mt-4 text-foreground">{faseAtual.instrucao}</p>
                <p className="mt-1 text-sm text-muted-foreground">Ciclos completos: {ciclos}</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600">1</span>
                  </div>
                  <p className="text-foreground">Inspire pelo nariz contando até 4</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600">2</span>
                  </div>
                  <p className="text-foreground">Segure a respiração contando até 7</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600">3</span>
                  </div>
                  <p className="text-foreground">Expire pela boca contando até 8</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={alternarRespiracao}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-colors"
            >
              {respirando ? "Parar Exercício" : "Iniciar Exercício Guiado"}
            </button>
          </div>
          <div className="h-64 md:h-auto">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1763575648841-8793ad446b89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBmb2N1c2VkJTIwY29uY2VudHJhdGlvbnxlbnwxfHx8fDE3NzMzMzg0NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Concentração e foco"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
