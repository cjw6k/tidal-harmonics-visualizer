import { useState, useCallback } from 'react';
import { CONSTITUENTS } from '@/data/constituents';

interface Question {
  type: 'period' | 'family' | 'doodson' | 'description' | 'speed';
  question: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

function generateQuestion(): Question {
  const constituents = Object.values(CONSTITUENTS);
  const types: Question['type'][] = ['period', 'family', 'doodson', 'description', 'speed'];
  const type = types[Math.floor(Math.random() * types.length)]!;
  const target = constituents[Math.floor(Math.random() * constituents.length)]!;

  switch (type) {
    case 'period': {
      const correct = `${target.period.toFixed(2)} hours`;
      const distractors = constituents
        .filter(c => c.symbol !== target.symbol)
        .map(c => `${c.period.toFixed(2)} hours`)
        .filter((v, i, a) => a.indexOf(v) === i && v !== correct);
      const options = shuffleArray([correct, ...shuffleArray(distractors).slice(0, 3)]);
      return {
        type: 'period',
        question: `What is the period of ${target.symbol} (${target.name})?`,
        correctAnswer: correct,
        options,
        explanation: `${target.symbol} has a period of ${target.period.toFixed(4)} hours, with an angular speed of ${target.speed.toFixed(4)}°/hour.`,
      };
    }

    case 'family': {
      const families = ['semidiurnal', 'diurnal', 'long-period', 'shallow-water', 'tertidiurnal'];
      const options = shuffleArray(families);
      return {
        type: 'family',
        question: `Which family does ${target.symbol} (${target.name}) belong to?`,
        correctAnswer: target.family,
        options,
        explanation: `${target.symbol} is a ${target.family} constituent. ${
          target.family === 'semidiurnal' ? 'Semidiurnal constituents have periods around 12 hours.' :
          target.family === 'diurnal' ? 'Diurnal constituents have periods around 24 hours.' :
          target.family === 'long-period' ? 'Long-period constituents have periods of days to months.' :
          target.family === 'shallow-water' ? 'Shallow-water constituents arise from nonlinear effects in coastal areas.' :
          'Tertidiurnal constituents have periods around 8 hours.'
        }`,
      };
    }

    case 'doodson': {
      const doodsonStr = `[${target.doodson.join(', ')}]`;
      const distractors = constituents
        .filter(c => c.symbol !== target.symbol)
        .map(c => `[${c.doodson.join(', ')}]`)
        .filter((v, i, a) => a.indexOf(v) === i && v !== doodsonStr);
      const options = shuffleArray([doodsonStr, ...shuffleArray(distractors).slice(0, 3)]);
      return {
        type: 'doodson',
        question: `What is the Doodson number for ${target.symbol}?`,
        correctAnswer: doodsonStr,
        options,
        explanation: `The Doodson number ${doodsonStr} encodes how ${target.symbol} depends on astronomical arguments: [T, s, h, p, N', p'] representing lunar time, Moon's longitude, Sun's longitude, lunar perigee, lunar node, and solar perigee.`,
      };
    }

    case 'description': {
      const correct = target.symbol;
      const distractors = constituents
        .filter(c => c.symbol !== target.symbol)
        .map(c => c.symbol);
      const options = shuffleArray([correct, ...shuffleArray(distractors).slice(0, 3)]);
      return {
        type: 'description',
        question: `Which constituent is described as "${target.name}"?`,
        correctAnswer: correct,
        options,
        explanation: `${target.symbol} (${target.name}): ${target.description.slice(0, 150)}...`,
      };
    }

    case 'speed': {
      const correct = `${target.speed.toFixed(2)}°/hour`;
      const distractors = constituents
        .filter(c => c.symbol !== target.symbol)
        .map(c => `${c.speed.toFixed(2)}°/hour`)
        .filter((v, i, a) => a.indexOf(v) === i && v !== correct);
      const options = shuffleArray([correct, ...shuffleArray(distractors).slice(0, 3)]);
      return {
        type: 'speed',
        question: `What is the angular speed of ${target.symbol}?`,
        correctAnswer: correct,
        options,
        explanation: `${target.symbol} moves at ${target.speed.toFixed(4)}°/hour, completing a full cycle in ${target.period.toFixed(2)} hours.`,
      };
    }
  }
}

export function ConstituentQuiz({ onClose }: { onClose: () => void }) {
  const [currentQuestion, setCurrentQuestion] = useState<Question>(() => generateQuestion());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    setShowExplanation(true);
    setTotalAnswered(prev => prev + 1);
    if (answer === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  }, [selectedAnswer, currentQuestion.correctAnswer]);

  const nextQuestion = useCallback(() => {
    setCurrentQuestion(generateQuestion());
    setSelectedAnswer(null);
    setShowExplanation(false);
  }, []);

  const resetQuiz = useCallback(() => {
    setScore(0);
    setTotalAnswered(0);
    nextQuestion();
  }, [nextQuestion]);

  const percentage = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Constituent Quiz</h2>
              <p className="text-sm text-slate-400">
                Score: {score}/{totalAnswered} ({percentage}%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Close quiz"
          >
            ✕
          </button>
        </div>

        {/* Question */}
        <div className="p-4">
          <div className="mb-4">
            <span className="inline-block px-2 py-1 rounded text-xs bg-blue-600/30 text-blue-300 mb-2">
              Question {totalAnswered + 1}
            </span>
            <p className="text-white text-lg">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-2 mb-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              const showResult = selectedAnswer !== null;

              let buttonStyle = 'bg-slate-700 hover:bg-slate-600 text-slate-200';
              if (showResult) {
                if (isCorrect) {
                  buttonStyle = 'bg-green-600/30 border-green-500 text-green-300';
                } else if (isSelected && !isCorrect) {
                  buttonStyle = 'bg-red-600/30 border-red-500 text-red-300';
                } else {
                  buttonStyle = 'bg-slate-700/50 text-slate-400';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-3 rounded-lg border-2 border-transparent text-left transition-all ${buttonStyle} ${
                    showResult && isCorrect ? 'border-green-500' : ''
                  } ${showResult && isSelected && !isCorrect ? 'border-red-500' : ''}`}
                >
                  <span className="font-mono mr-2 text-slate-400">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                  {showResult && isCorrect && <span className="ml-2">✓</span>}
                  {showResult && isSelected && !isCorrect && <span className="ml-2">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`p-3 rounded-lg mb-4 ${
              selectedAnswer === currentQuestion.correctAnswer
                ? 'bg-green-900/30 border border-green-700'
                : 'bg-amber-900/30 border border-amber-700'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? 'text-green-300'
                  : 'text-amber-300'
              }`}>
                {selectedAnswer === currentQuestion.correctAnswer ? '🎉 Correct!' : '💡 Learn More:'}
              </p>
              <p className="text-sm text-slate-300">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {selectedAnswer !== null && (
              <button
                onClick={nextQuestion}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Next Question →
              </button>
            )}
            {totalAnswered > 0 && (
              <button
                onClick={resetQuiz}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progress</span>
            <span>{totalAnswered} questions answered</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
              style={{ width: `${Math.min(totalAnswered * 10, 100)}%` }}
            />
          </div>
          {totalAnswered >= 10 && (
            <p className="text-center text-sm text-green-400 mt-2">
              🏆 Quiz completed! Final score: {percentage}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
