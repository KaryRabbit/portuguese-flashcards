import { Volume2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { Card, ConjugationGroup } from '../flashcard-types';
import { isSpeechSupported, speak } from '../utils/speech';

type Row = { label: string; value: string };
type Tense = {
  id: string;
  label: string;
  mood: string;
  usageEn: string;
  usagePt: string;
  exampleEn: string;
  examplePt: string;
  rows: Row[];
};
type VerbKey = 'falar' | 'ser';

const VERB_LABELS: Record<VerbKey, string> = {
  falar: 'falar (regular)',
  ser: 'ser (irregular)',
};

const TENSES: Record<VerbKey, Tense[]> = {
  falar: [
    {
      id: 'indicativo-presente',
      label: 'Presente',
      mood: 'Indicativo',
      usageEn: 'habits, general truths, current states',
      usagePt: 'hábitos, verdades gerais, estados atuais',
      exampleEn: 'I speak Portuguese.',
      examplePt: 'Eu falo português.',
      rows: [
        { label: 'eu', value: 'falo' },
        { label: 'tu', value: 'falas' },
        { label: 'ele/ela/você', value: 'fala' },
        { label: 'nós', value: 'falamos' },
        { label: 'vós', value: 'falais' },
        { label: 'eles/elas/vocês', value: 'falam' },
      ],
    },
    {
      id: 'indicativo-perfeito',
      label: 'Pretérito Perfeito',
      mood: 'Indicativo',
      usageEn: 'completed action in the past',
      usagePt: 'ação concluída no passado',
      exampleEn: 'Yesterday I spoke with her.',
      examplePt: 'Ontem falei com ela.',
      rows: [
        { label: 'eu', value: 'falei' },
        { label: 'tu', value: 'falaste' },
        { label: 'ele/ela/você', value: 'falou' },
        { label: 'nós', value: 'falámos' },
        { label: 'vós', value: 'falastes' },
        { label: 'eles/elas/vocês', value: 'falaram' },
      ],
    },
    {
      id: 'indicativo-imperfeito',
      label: 'Pretérito Imperfeito',
      mood: 'Indicativo',
      usageEn: 'past habits, background context, ongoing past',
      usagePt: 'hábitos no passado, contexto, ação em curso',
      exampleEn: 'When I was a child, I used to talk a lot.',
      examplePt: 'Quando era criança, falava muito.',
      rows: [
        { label: 'eu', value: 'falava' },
        { label: 'tu', value: 'falavas' },
        { label: 'ele/ela/você', value: 'falava' },
        { label: 'nós', value: 'falávamos' },
        { label: 'vós', value: 'faláveis' },
        { label: 'eles/elas/vocês', value: 'falavam' },
      ],
    },
    {
      id: 'indicativo-mais-que-perfeito',
      label: 'Pretérito Mais-que-Perfeito (Simples)',
      mood: 'Indicativo',
      usageEn: 'action completed before another past action',
      usagePt: 'ação concluída antes de outra no passado',
      exampleEn: 'He had already spoken before the meeting.',
      examplePt: 'Ele já falara antes da reunião.',
      rows: [
        { label: 'eu', value: 'falara' },
        { label: 'tu', value: 'falaras' },
        { label: 'ele/ela/você', value: 'falara' },
        { label: 'nós', value: 'faláramos' },
        { label: 'vós', value: 'faláreis' },
        { label: 'eles/elas/vocês', value: 'falaram' },
      ],
    },
    {
      id: 'indicativo-futuro',
      label: 'Futuro',
      mood: 'Indicativo',
      usageEn: 'plans, predictions, promises',
      usagePt: 'planos, previsões, promessas',
      exampleEn: 'Tomorrow I will speak with you.',
      examplePt: 'Amanhã falarei contigo.',
      rows: [
        { label: 'eu', value: 'falarei' },
        { label: 'tu', value: 'falarás' },
        { label: 'ele/ela/você', value: 'falará' },
        { label: 'nós', value: 'falaremos' },
        { label: 'vós', value: 'falareis' },
        { label: 'eles/elas/vocês', value: 'falarão' },
      ],
    },
    {
      id: 'condicional',
      label: 'Condicional',
      mood: 'Indicativo',
      usageEn: 'hypotheses, polite requests',
      usagePt: 'hipóteses, pedidos educados',
      exampleEn: 'I would speak with him if I could.',
      examplePt: 'Eu falaria com ele, se pudesse.',
      rows: [
        { label: 'eu', value: 'falaria' },
        { label: 'tu', value: 'falarias' },
        { label: 'ele/ela/você', value: 'falaria' },
        { label: 'nós', value: 'falaríamos' },
        { label: 'vós', value: 'falaríeis' },
        { label: 'eles/elas/vocês', value: 'falariam' },
      ],
    },
    {
      id: 'subjuntivo-presente',
      label: 'Presente',
      mood: 'Conjuntivo',
      usageEn: 'wish, doubt, possibility (often after “que”)',
      usagePt: 'desejo, dúvida, possibilidade (muitas vezes após “que”)',
      exampleEn: 'I hope you speak with her.',
      examplePt: 'Espero que fales com ela.',
      rows: [
        { label: 'eu', value: 'fale' },
        { label: 'tu', value: 'fales' },
        { label: 'ele/ela/você', value: 'fale' },
        { label: 'nós', value: 'falemos' },
        { label: 'vós', value: 'faleis' },
        { label: 'eles/elas/vocês', value: 'falem' },
      ],
    },
    {
      id: 'subjuntivo-imperfeito',
      label: 'Pretérito Imperfeito',
      mood: 'Conjuntivo',
      usageEn: 'hypothetical or unlikely situations',
      usagePt: 'situações hipotéticas ou pouco prováveis',
      exampleEn: 'If you spoke more slowly, I would understand.',
      examplePt: 'Se falasses mais devagar, eu entenderia.',
      rows: [
        { label: 'eu', value: 'falasse' },
        { label: 'tu', value: 'falasses' },
        { label: 'ele/ela/você', value: 'falasse' },
        { label: 'nós', value: 'falássemos' },
        { label: 'vós', value: 'falásseis' },
        { label: 'eles/elas/vocês', value: 'falassem' },
      ],
    },
    {
      id: 'subjuntivo-futuro',
      label: 'Futuro',
      mood: 'Conjuntivo',
      usageEn: 'future condition/time (“se”, “quando”)',
      usagePt: 'condição/tempo no futuro (“se”, “quando”)',
      exampleEn: 'When you speak with him, tell me.',
      examplePt: 'Quando falares com ele, diz-me.',
      rows: [
        { label: 'eu', value: 'falar' },
        { label: 'tu', value: 'falares' },
        { label: 'ele/ela/você', value: 'falar' },
        { label: 'nós', value: 'falarmos' },
        { label: 'vós', value: 'falardes' },
        { label: 'eles/elas/vocês', value: 'falarem' },
      ],
    },
    {
      id: 'imperativo-afirmativo',
      label: 'Afirmativo',
      mood: 'Imperativo',
      usageEn: 'commands or instructions',
      usagePt: 'ordens ou instruções',
      exampleEn: 'Speak louder.',
      examplePt: 'Fala mais alto.',
      rows: [
        { label: 'tu', value: 'fala' },
        { label: 'você', value: 'fale' },
        { label: 'nós', value: 'falemos' },
        { label: 'vós', value: 'falai' },
        { label: 'vocês', value: 'falem' },
      ],
    },
    {
      id: 'imperativo-negativo',
      label: 'Negativo',
      mood: 'Imperativo',
      usageEn: 'negative commands',
      usagePt: 'proibições / ordens negativas',
      exampleEn: "Don't speak so fast.",
      examplePt: 'Não fales tão depressa.',
      rows: [
        { label: 'tu', value: 'não fales' },
        { label: 'você', value: 'não fale' },
        { label: 'nós', value: 'não falemos' },
        { label: 'vós', value: 'não faleis' },
        { label: 'vocês', value: 'não falem' },
      ],
    },
    {
      id: 'infinitivo-pessoal',
      label: 'Infinitivo Pessoal',
      mood: 'Formas Não Finitas',
      usageEn: 'infinitive with expressed subject',
      usagePt: 'infinitivo com sujeito expresso',
      exampleEn: "It's important for us to speak with the client.",
      examplePt: 'É importante falarmos com o cliente.',
      rows: [
        { label: 'eu', value: 'falar' },
        { label: 'tu', value: 'falares' },
        { label: 'ele/ela/você', value: 'falar' },
        { label: 'nós', value: 'falarmos' },
        { label: 'vós', value: 'falardes' },
        { label: 'eles/elas/vocês', value: 'falarem' },
      ],
    },
    {
      id: 'gerundio',
      label: 'Gerúndio',
      mood: 'Formas Não Finitas',
      usageEn: 'action in progress (EU-PT often uses “estar a + inf.”)',
      usagePt: 'ação em curso (EU-PT usa muito “estar a + inf.”)',
      exampleEn: 'Speaking more slowly, she understands.',
      examplePt: 'Falando mais devagar, ela entende.',
      rows: [{ label: 'forma', value: 'falando' }],
    },
    {
      id: 'participio',
      label: 'Particípio',
      mood: 'Formas Não Finitas',
      usageEn: 'compound tenses and passive voice',
      usagePt: 'tempos compostos e voz passiva',
      exampleEn: 'I have spoken with him.',
      examplePt: 'Tenho falado com ele.',
      rows: [{ label: 'forma', value: 'falado' }],
    },
  ],
  ser: [
    {
      id: 'indicativo-presente',
      label: 'Presente',
      mood: 'Indicativo',
      usageEn: 'habits, general truths, current states',
      usagePt: 'hábitos, verdades gerais, estados atuais',
      exampleEn: 'She is a doctor.',
      examplePt: 'Ela é médica.',
      rows: [
        { label: 'eu', value: 'sou' },
        { label: 'tu', value: 'és' },
        { label: 'ele/ela/você', value: 'é' },
        { label: 'nós', value: 'somos' },
        { label: 'vós', value: 'sois' },
        { label: 'eles/elas/vocês', value: 'são' },
      ],
    },
    {
      id: 'indicativo-perfeito',
      label: 'Pretérito Perfeito',
      mood: 'Indicativo',
      usageEn: 'completed action in the past',
      usagePt: 'ação concluída no passado',
      exampleEn: 'He was happy.',
      examplePt: 'Ele foi feliz.',
      rows: [
        { label: 'eu', value: 'fui' },
        { label: 'tu', value: 'foste' },
        { label: 'ele/ela/você', value: 'foi' },
        { label: 'nós', value: 'fomos' },
        { label: 'vós', value: 'fostes' },
        { label: 'eles/elas/vocês', value: 'foram' },
      ],
    },
    {
      id: 'indicativo-imperfeito',
      label: 'Pretérito Imperfeito',
      mood: 'Indicativo',
      usageEn: 'past habits, background context, ongoing past',
      usagePt: 'hábitos no passado, contexto, ação em curso',
      exampleEn: 'We were friends.',
      examplePt: 'Nós éramos amigos.',
      rows: [
        { label: 'eu', value: 'era' },
        { label: 'tu', value: 'eras' },
        { label: 'ele/ela/você', value: 'era' },
        { label: 'nós', value: 'éramos' },
        { label: 'vós', value: 'éreis' },
        { label: 'eles/elas/vocês', value: 'eram' },
      ],
    },
    {
      id: 'indicativo-mais-que-perfeito',
      label: 'Pretérito Mais-que-Perfeito (Simples)',
      mood: 'Indicativo',
      usageEn: 'action completed before another past action',
      usagePt: 'ação concluída antes de outra no passado',
      exampleEn: 'He had been the first to arrive.',
      examplePt: 'Ele fora o primeiro a chegar.',
      rows: [
        { label: 'eu', value: 'fora' },
        { label: 'tu', value: 'foras' },
        { label: 'ele/ela/você', value: 'fora' },
        { label: 'nós', value: 'fôramos' },
        { label: 'vós', value: 'fôreis' },
        { label: 'eles/elas/vocês', value: 'foram' },
      ],
    },
    {
      id: 'indicativo-futuro',
      label: 'Futuro',
      mood: 'Indicativo',
      usageEn: 'plans, predictions, promises',
      usagePt: 'planos, previsões, promessas',
      exampleEn: 'I will be on time.',
      examplePt: 'Serei pontual.',
      rows: [
        { label: 'eu', value: 'serei' },
        { label: 'tu', value: 'serás' },
        { label: 'ele/ela/você', value: 'será' },
        { label: 'nós', value: 'seremos' },
        { label: 'vós', value: 'sereis' },
        { label: 'eles/elas/vocês', value: 'serão' },
      ],
    },
    {
      id: 'condicional',
      label: 'Condicional',
      mood: 'Indicativo',
      usageEn: 'hypotheses, polite requests',
      usagePt: 'hipóteses, pedidos educados',
      exampleEn: 'I would be calmer.',
      examplePt: 'Eu seria mais calmo.',
      rows: [
        { label: 'eu', value: 'seria' },
        { label: 'tu', value: 'serias' },
        { label: 'ele/ela/você', value: 'seria' },
        { label: 'nós', value: 'seríamos' },
        { label: 'vós', value: 'seríeis' },
        { label: 'eles/elas/vocês', value: 'seriam' },
      ],
    },
    {
      id: 'subjuntivo-presente',
      label: 'Presente',
      mood: 'Conjuntivo',
      usageEn: 'wish, doubt, possibility (often after “que”)',
      usagePt: 'desejo, dúvida, possibilidade (muitas vezes após “que”)',
      exampleEn: 'I hope you are happy.',
      examplePt: 'Espero que sejas feliz.',
      rows: [
        { label: 'eu', value: 'seja' },
        { label: 'tu', value: 'sejas' },
        { label: 'ele/ela/você', value: 'seja' },
        { label: 'nós', value: 'sejamos' },
        { label: 'vós', value: 'sejais' },
        { label: 'eles/elas/vocês', value: 'sejam' },
      ],
    },
    {
      id: 'subjuntivo-imperfeito',
      label: 'Pretérito Imperfeito',
      mood: 'Conjuntivo',
      usageEn: 'hypothetical or unlikely situations',
      usagePt: 'situações hipotéticas ou pouco prováveis',
      exampleEn: 'If I were rich, I would travel.',
      examplePt: 'Se eu fosse rico, viajava.',
      rows: [
        { label: 'eu', value: 'fosse' },
        { label: 'tu', value: 'fosses' },
        { label: 'ele/ela/você', value: 'fosse' },
        { label: 'nós', value: 'fôssemos' },
        { label: 'vós', value: 'fôsseis' },
        { label: 'eles/elas/vocês', value: 'fossem' },
      ],
    },
    {
      id: 'subjuntivo-futuro',
      label: 'Futuro',
      mood: 'Conjuntivo',
      usageEn: 'future condition/time (“se”, “quando”)',
      usagePt: 'condição/tempo no futuro (“se”, “quando”)',
      exampleEn: 'When you go to Lisbon, let me know.',
      examplePt: 'Quando fores a Lisboa, avisa-me.',
      rows: [
        { label: 'eu', value: 'for' },
        { label: 'tu', value: 'fores' },
        { label: 'ele/ela/você', value: 'for' },
        { label: 'nós', value: 'formos' },
        { label: 'vós', value: 'fordes' },
        { label: 'eles/elas/vocês', value: 'forem' },
      ],
    },
    {
      id: 'imperativo-afirmativo',
      label: 'Afirmativo',
      mood: 'Imperativo',
      usageEn: 'commands or instructions',
      usagePt: 'ordens ou instruções',
      exampleEn: 'Be honest.',
      examplePt: 'Sê honesto.',
      rows: [
        { label: 'tu', value: 'sê' },
        { label: 'você', value: 'seja' },
        { label: 'nós', value: 'sejamos' },
        { label: 'vós', value: 'sede' },
        { label: 'vocês', value: 'sejam' },
      ],
    },
    {
      id: 'imperativo-negativo',
      label: 'Negativo',
      mood: 'Imperativo',
      usageEn: 'negative commands',
      usagePt: 'proibições / ordens negativas',
      exampleEn: "Don't be impatient.",
      examplePt: 'Não sejas impaciente.',
      rows: [
        { label: 'tu', value: 'não sejas' },
        { label: 'você', value: 'não seja' },
        { label: 'nós', value: 'não sejamos' },
        { label: 'vós', value: 'não sejais' },
        { label: 'vocês', value: 'não sejam' },
      ],
    },
    {
      id: 'infinitivo-pessoal',
      label: 'Infinitivo Pessoal',
      mood: 'Formas Não Finitas',
      usageEn: 'infinitive with expressed subject',
      usagePt: 'infinitivo com sujeito expresso',
      exampleEn: "It's better for us to be clear.",
      examplePt: 'É melhor sermos claros.',
      rows: [
        { label: 'eu', value: 'ser' },
        { label: 'tu', value: 'seres' },
        { label: 'ele/ela/você', value: 'ser' },
        { label: 'nós', value: 'sermos' },
        { label: 'vós', value: 'serdes' },
        { label: 'eles/elas/vocês', value: 'serem' },
      ],
    },
    {
      id: 'gerundio',
      label: 'Gerúndio',
      mood: 'Formas Não Finitas',
      usageEn: 'action in progress (EU-PT often uses “estar a + inf.”)',
      usagePt: 'ação em curso (EU-PT usa muito “estar a + inf.”)',
      exampleEn: "Being so, let's go.",
      examplePt: 'Sendo assim, vamos.',
      rows: [{ label: 'forma', value: 'sendo' }],
    },
    {
      id: 'participio',
      label: 'Particípio',
      mood: 'Formas Não Finitas',
      usageEn: 'compound tenses and passive voice',
      usagePt: 'tempos compostos e voz passiva',
      exampleEn: 'I have been patient.',
      examplePt: 'Tenho sido paciente.',
      rows: [{ label: 'forma', value: 'sido' }],
    },
  ],
};

interface ConjugationGuideProps {
  sessionCards: Card[];
}

export function ConjugationGuide({ sessionCards }: ConjugationGuideProps) {
  const [verb, setVerb] = useState<VerbKey>('falar');
  const [showUsageEn, setShowUsageEn] = useState<Set<string>>(new Set());
  const [showExampleEn, setShowExampleEn] = useState<Set<string>>(new Set());
  const tenses = useMemo(() => TENSES[verb], [verb]);

  const sessionVerbOptions = useMemo(() => {
    const byLabel = new Map<string, Card>();
    sessionCards
      .filter((c) => c.type.startsWith('verb') && c.conjugations)
      .forEach((c) => {
        const label = `${c.back} — ${c.front}`;
        byLabel.set(label, c);
      });
    return [...byLabel.entries()].map(([label, card]) => ({
      label,
      card,
    }));
  }, [sessionCards]);

  const [sessionQuery, setSessionQuery] = useState('');
  const selectedSessionCard = useMemo(() => {
    return sessionVerbOptions.find((o) => o.label === sessionQuery)?.card;
  }, [sessionQuery, sessionVerbOptions]);

  const toRows = (group: ConjugationGroup) => [
    { label: 'eu', value: group.eu },
    { label: 'tu', value: group.tu },
    { label: 'ele/ela/você', value: group.eleElaVoce },
    { label: 'nós', value: group.nos },
    { label: 'vós', value: group.vos },
    { label: 'eles/elas/vocês', value: group.elesElasVoces },
  ];

  return (
    <div className="card conjugation-guide">
      <div className="conjugation-header">
        <div>
          <h3 className="conjugation-title">Tempos Verbais (EU-PT)</h3>
          <div className="muted conjugation-subtitle">
            Exemplo completo de conjugação para estudo e referência.
          </div>
        </div>
        <div className="conjugation-controls">
          <label className="muted" htmlFor="verb-select">
            Verbo
          </label>
          <select
            id="verb-select"
            className="input"
            value={verb}
            onChange={(e) => setVerb(e.target.value as VerbKey)}
          >
            {Object.entries(VERB_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="tense-card session-lookup">
        <div className="tense-header">
          <div className="tense-mood">Sessão</div>
          <div className="tense-label">Conjugação do Verbo</div>
        </div>
        <div className="session-lookup-row">
          <div>
            <label className="muted" htmlFor="session-verb">
              Procurar verbo (da sessão)
            </label>
            <input
              id="session-verb"
              className="input"
              list="session-verb-list"
              placeholder="Escreve para procurar…"
              value={sessionQuery}
              onChange={(e) => setSessionQuery(e.target.value)}
            />
            <datalist id="session-verb-list">
              {sessionVerbOptions.map((o) => (
                <option key={o.label} value={o.label} />
              ))}
            </datalist>
          </div>
          <div className="muted session-help">
            Mostra apenas verbos com conjugação na sessão atual.
          </div>
        </div>

        {selectedSessionCard ? (
          <div className="session-tense-grid">
            {selectedSessionCard.conjugations?.present ? (
              <div className="session-tense">
                <div className="tense-label">Presente</div>
                <div className="tense-rows">
                  {toRows(selectedSessionCard.conjugations.present).map(
                    (row) => (
                      <div key={`present-${row.label}`} className="tense-row">
                        <div className="tense-pronoun">{row.label}</div>
                        <div className="tense-value">{row.value}</div>
                        {isSpeechSupported() ? (
                          <button
                            type="button"
                            className="btn icon-btn"
                            onClick={() => speak(row.value, 'pt-PT')}
                            title="Listen to pronunciation"
                          >
                            <Volume2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : null}

            {selectedSessionCard.conjugations?.past?.perfeito ? (
              <div className="session-tense">
                <div className="tense-label">Pretérito Perfeito</div>
                <div className="tense-rows">
                  {toRows(
                    selectedSessionCard.conjugations.past.perfeito
                  ).map((row) => (
                    <div key={`perfeito-${row.label}`} className="tense-row">
                      <div className="tense-pronoun">{row.label}</div>
                      <div className="tense-value">{row.value}</div>
                      {isSpeechSupported() ? (
                        <button
                          type="button"
                          className="btn icon-btn"
                          onClick={() => speak(row.value, 'pt-PT')}
                          title="Listen to pronunciation"
                        >
                          <Volume2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedSessionCard.conjugations?.past?.imperfeito ? (
              <div className="session-tense">
                <div className="tense-label">Pretérito Imperfeito</div>
                <div className="tense-rows">
                  {toRows(
                    selectedSessionCard.conjugations.past.imperfeito
                  ).map((row) => (
                    <div key={`imperfeito-${row.label}`} className="tense-row">
                      <div className="tense-pronoun">{row.label}</div>
                      <div className="tense-value">{row.value}</div>
                      {isSpeechSupported() ? (
                        <button
                          type="button"
                          className="btn icon-btn"
                          onClick={() => speak(row.value, 'pt-PT')}
                          title="Listen to pronunciation"
                        >
                          <Volume2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedSessionCard.conjugations?.future ? (
              <div className="session-tense">
                <div className="tense-label">Futuro</div>
                <div className="tense-rows">
                  {toRows(selectedSessionCard.conjugations.future).map(
                    (row) => (
                      <div key={`futuro-${row.label}`} className="tense-row">
                        <div className="tense-pronoun">{row.label}</div>
                        <div className="tense-value">{row.value}</div>
                        {isSpeechSupported() ? (
                          <button
                            type="button"
                            className="btn icon-btn"
                            onClick={() => speak(row.value, 'pt-PT')}
                            title="Listen to pronunciation"
                          >
                            <Volume2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="muted session-empty">
            Escolhe um verbo da sessão para ver as conjugações.
          </div>
        )}
      </section>

      <div className="tense-grid">
        {tenses.map((tense) => (
          <section key={tense.id} className="tense-card">
            <div className="tense-header">
              <div className="tense-mood">{tense.mood}</div>
              <div className="tense-label">{tense.label}</div>
            </div>
            <div className="tense-usage">
              <div className="tense-line">
                <span className="tense-usage-label">Uso:</span>
                <span>{tense.usagePt}</span>
                <button
                  type="button"
                  className="btn tiny-btn"
                  onClick={() =>
                    setShowUsageEn((prev) => {
                      const next = new Set(prev);
                      if (next.has(tense.id)) {
                        next.delete(tense.id);
                      } else {
                        next.add(tense.id);
                      }
                      return next;
                    })
                  }
                >
                  EN
                </button>
              </div>
              {showUsageEn.has(tense.id) ? (
                <div className="tense-line">
                  <span className="tense-usage-label">EN:</span>
                  <span>{tense.usageEn}</span>
                </div>
              ) : null}
            </div>
            <div className="tense-usage tense-example">
              <div className="tense-line">
                <span className="tense-usage-label">Ex:</span>
                <span>{tense.examplePt}</span>
                <button
                  type="button"
                  className="btn tiny-btn"
                  onClick={() =>
                    setShowExampleEn((prev) => {
                      const next = new Set(prev);
                      if (next.has(tense.id)) {
                        next.delete(tense.id);
                      } else {
                        next.add(tense.id);
                      }
                      return next;
                    })
                  }
                >
                  EN
                </button>
                {isSpeechSupported() ? (
                  <button
                    type="button"
                    className="btn icon-btn"
                    onClick={() => speak(tense.examplePt, 'pt-PT')}
                    title="Listen to example"
                  >
                    <Volume2 size={14} />
                  </button>
                ) : null}
              </div>
              {showExampleEn.has(tense.id) ? (
                <div className="tense-line">
                  <span className="tense-usage-label">EN:</span>
                  <span>{tense.exampleEn}</span>
                </div>
              ) : null}
            </div>
            <div className="tense-rows">
              {tense.rows.map((row) => (
                <div key={`${tense.id}-${row.label}`} className="tense-row">
                  <div className="tense-pronoun">{row.label}</div>
                  <div className="tense-value">{row.value}</div>
                  {isSpeechSupported() ? (
                    <button
                      type="button"
                      className="btn icon-btn"
                      onClick={() => speak(row.value, 'pt-PT')}
                      title="Listen to pronunciation"
                    >
                      <Volume2 size={16} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
