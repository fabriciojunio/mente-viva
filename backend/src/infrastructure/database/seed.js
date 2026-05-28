'use strict';
const { db } = require('./db');

const TIPS = [
  { id: 1, text: 'Jogar 20 min/dia pode reduzir o risco de Alzheimer em até 25% em 20 anos! (Estudo ACTIVE, 2026)', category: 'science' },
  { id: 2, text: 'Exercícios de VELOCIDADE mental são os mais eficazes contra o declínio cognitivo!', category: 'science' },
  { id: 3, text: 'Caça-palavras exercita o córtex pré-frontal e a memória léxica — jogue todo dia!', category: 'science' },
  { id: 4, text: 'O cérebro mantém neuroplasticidade até os 90 anos — nunca é tarde para treinar!', category: 'motivation' },
  { id: 5, text: '10 semanas de treino digital podem rejuvenescer o cérebro em 10 anos! (McGill, 2024)', category: 'science' },
  { id: 6, text: 'Puzzles de palavras melhoram a memória de trabalho e a velocidade de raciocínio!', category: 'science' },
  { id: 7, text: 'Adultos que fazem palavras cruzadas regularmente têm função cerebral equivalente à de pessoas 10 anos mais jovens!', category: 'science' },
  { id: 8, text: 'Consistência importa mais que intensidade — jogue todo dia, mesmo que só 10 minutos!', category: 'motivation' },
  { id: 9, text: 'O treino cognitivo reduz o declínio de memória em 32% ao longo de 7 anos! (Rush University, 2024)', category: 'science' },
  { id: 10, text: 'Variar os jogos cria novas conexões neurais — explore todos os tipos!', category: 'tip' },
  { id: 11, text: 'Quase metade dos casos de demência podem ser prevenidos com estilo de vida saudável! (Lancet, 2024)', category: 'science' },
  { id: 12, text: 'Jogos de palavras fortalecem a memória semântica, a mais afetada no Alzheimer!', category: 'science' },
  { id: 13, text: 'Combine jogos cognitivos com caminhadas — os dois juntos são ainda mais eficazes!', category: 'tip' },
  { id: 14, text: 'Jogar regularmente melhora o humor, reduz estresse e aumenta a autoestima! 💕', category: 'motivation' },
  { id: 15, text: 'Seu cérebro agradece cada partida jogada! Continue assim! 🧠✨', category: 'motivation' },
];

db.seedTips(TIPS);
const { logger } = require('../../utils/logger');
logger.info(`Seed: ${TIPS.length} dicas inseridas`);
