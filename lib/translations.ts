// i18n translations for SoulSort V4
// Safe translation layer: UI copy can be translated, but canonical questions stay in English for LLMs

export type LanguageCode = 'en' | 'nl' | 'de' | 'fr' | 'es' | 'it' | 'pt'

export interface Translations {
  [key: string]: string | Translations
}

// Translation maps keyed by screenId/questionId and language code
const translations: Record<string, Record<LanguageCode, string>> = {
  // Onboarding Chat Questions (Dating Flow)
  'onboarding.q1': {
    en: 'What kind of behaviour drains you fastest, even if the other person means well?',
    nl: 'Wat zijn drie waarden die je probeert na te leven in je relaties?',
    de: 'Welche drei Werte versuchst du in deinen Beziehungen zu praktizieren?',
    fr: 'Quelles sont les trois valeurs que vous essayez de pratiquer dans vos relations?',
    es: '¿Cuáles son tres valores que intentas practicar en tus relaciones?',
    it: 'Quali sono tre valori che cerchi di praticare nelle tue relazioni?',
    pt: 'Quais são três valores que você tenta praticar em seus relacionamentos?',
  },
  'onboarding.q2': {
    en: 'After your last breakup, what\'s one thing you do differently now, even in early dating?',
    nl: 'Hoe ga je om met meningsverschillen of misverstanden?',
    de: 'Wie gehst du mit Meinungsverschiedenheiten oder Missverständnissen um?',
    fr: 'Comment aimez-vous naviguer dans les désaccords ou les malentendus?',
    es: '¿Cómo te gusta manejar los desacuerdos o malentendidos?',
    it: 'Come ti piace gestire i disaccordi o i malintesi?',
    pt: 'Como você gosta de lidar com desentendimentos ou mal-entendidos?',
  },
  'onboarding.q3': {
    en: 'If you realize you\'ve hurt someone you care about, what\'s your first move?',
    nl: 'Wat helpt je om je erotisch verbonden te voelen met iemand?',
    de: 'Was hilft dir, dich erotisch mit jemandem verbunden zu fühlen?',
    fr: 'Qu\'est-ce qui vous aide à vous sentir érotiquement connecté à quelqu\'un?',
    es: '¿Qué te ayuda a sentirte eróticamente conectado con alguien?',
    it: 'Cosa ti aiuta a sentirti eroticamente connesso con qualcuno?',
    pt: 'O que te ajuda a se sentir eroticamente conectado com alguém?',
  },
  'onboarding.q4': {
    en: 'What is something a partner can do to make you feel safe when you\'re tense or overwhelmed?',
    nl: 'Hoeveel vrijheid heb je nodig en zoek je in je romantische relaties en hoe ziet vrijheid er voor jou uit?',
    de: 'Wie viel Freiheit brauchst und suchst du in deinen romantischen Beziehungen und wie sieht Freiheit für dich aus?',
    fr: 'De combien de liberté avez-vous besoin et recherchez-vous dans vos relations romantiques et à quoi ressemble la liberté pour vous?',
    es: '¿Cuánta libertad necesitas y buscas en tus relaciones románticas y cómo se ve la libertad para ti?',
    it: 'Quanta libertà hai bisogno e cerchi nelle tue relazioni romantiche e come appare la libertà per te?',
    pt: 'Quanta liberdade você precisa e busca em seus relacionamentos românticos e como a liberdade parece para você?',
  },
  'onboarding.q5': {
    en: 'What helps you feel erotically connected, and what tends to shut that down?',
    nl: 'Hoe communiceer je grenzen, consent en veranderende behoeften in de loop van de tijd?',
    de: 'Wie kommunizierst du Grenzen, Zustimmung und sich im Laufe der Zeit verändernde Bedürfnisse?',
    fr: 'Comment communiquez-vous vos limites, le consentement et l\'évolution de vos besoins au fil du temps?',
    es: '¿Cómo comunicas tus límites, el consentimiento y los cambios en tus necesidades con el tiempo?',
    it: 'Come comunichi i confini, il consenso e i bisogni che cambiano nel tempo?',
    pt: 'Como você comunica limites, consentimento e necessidades que mudam ao longo do tempo?',
  },
  'onboarding.q6': {
    en: 'In relationships, where do you need autonomy, and where do you actually like closeness?',
    nl: 'Welk tempo voelt goed voor het opbouwen van emotionele en fysieke intimiteit?',
    de: 'Welches Tempo fühlt sich richtig an, damit emotionale und körperliche Intimität entstehen kann?',
    fr: 'Quel rythme vous semble juste pour construire l\'intimité émotionnelle et physique?',
    es: '¿Qué ritmo te parece adecuado para construir intimidad emocional y física?',
    it: 'Quale ritmo ti sembra giusto per costruire intimità emotiva e fisica?',
    pt: 'Que ritmo parece certo para construir intimidade emocional e física?',
  },
  'onboarding.q7': {
    en: 'How do you respond when you learn you crossed someone\'s boundary (even unintentionally)?',
    nl: 'Wat helpt je om je erotisch verbonden te voelen, en wat remt dat juist af?',
    de: 'Was hilft dir, dich erotisch verbunden zu fühlen, und was blockiert das eher?',
    fr: 'Qu\'est-ce qui vous aide à vous sentir érotiquement connecté, et qu\'est-ce qui a tendance à freiner cela?',
    es: '¿Qué te ayuda a sentirte eróticamente conectado y qué tiende a bloquear eso?',
    it: 'Cosa ti aiuta a sentirti eroticamente connesso e cosa tende invece a bloccarlo?',
    pt: 'O que ajuda você a se sentir eroticamente conectado e o que tende a bloquear isso?',
  },
  'onboarding.q8': {
    en: 'What do you think most people misunderstand about you?',
    nl: 'Hoe verhoud je je tot autonomie, vrijheid en exclusiviteit in een relatie?',
    de: 'Wie stehst du zu Autonomie, Freiheit und Exklusivität in einer Partnerschaft?',
    fr: 'Comment vous situez-vous par rapport à l\'autonomie, la liberté et l\'exclusivité en couple?',
    es: '¿Cómo te relacionas con la autonomía, la libertad y la exclusividad en pareja?',
    it: 'Come ti rapporti ad autonomia, libertà ed esclusività nella coppia?',
    pt: 'Como você se relaciona com autonomia, liberdade e exclusividade na parceria?',
  },
  'onboarding.q9': {
    en: 'When attraction starts to fade or plateau, what do you usually do?',
    nl: 'Op welk vlak groei je nu in relaties, en welke steun helpt je het meest?',
    de: 'Worin entwickelst du dich aktuell in Beziehungen, und welche Unterstützung hilft dir am meisten?',
    fr: 'Dans quels domaines grandissez-vous actuellement en relation, et quel soutien vous aide le plus?',
    es: '¿En qué estás creciendo actualmente en tus relaciones y qué apoyo te ayuda más?',
    it: 'In quale area stai crescendo nelle relazioni in questo momento e quale supporto ti aiuta di più?',
    pt: 'Em que área você está crescendo nos relacionamentos agora e qual apoio mais ajuda você?',
  },
  
  // BMNL Questions (all 11)
  'bmnl.q1': {
    en: 'Why do you want to join this event, and what do you understand about what it is?',
    nl: 'Waarom wil je deelnemen aan dit evenement en wat begrijp je ervan?',
    de: 'Warum möchtest du an dieser Veranstaltung teilnehmen und was verstehst du darüber?',
    fr: 'Pourquoi voulez-vous participer à cet événement et que comprenez-vous de ce que c\'est?',
    es: '¿Por qué quieres unirte a este evento y qué entiendes sobre qué es?',
    it: 'Perché vuoi partecipare a questo evento e cosa capisci di cosa si tratta?',
    pt: 'Por que você quer participar deste evento e o que você entende sobre o que é?',
  },
  'bmnl.q2': {
    en: 'Which Burning Man principle feels easiest for you to live by — and which one feels most challenging?',
    nl: 'Welk Burning Man-principe voelt het gemakkelijkst voor je om naar te leven — en welk voelt het meest uitdagend?',
    de: 'Welches Burning Man-Prinzip fühlt sich für dich am einfachsten zu leben — und welches am herausforderndsten?',
    fr: 'Quel principe de Burning Man vous semble le plus facile à vivre — et lequel vous semble le plus difficile?',
    es: '¿Qué principio de Burning Man te resulta más fácil de vivir — y cuál te resulta más desafiante?',
    it: 'Quale principio di Burning Man ti sembra più facile da vivere — e quale ti sembra più impegnativo?',
    pt: 'Qual princípio do Burning Man parece mais fácil para você viver — e qual parece mais desafiador?',
  },
  'bmnl.q3': {
    en: 'Have you attended Burning Man–inspired events before? If so, which ones?',
    nl: 'Heb je eerder Burning Man-geïnspireerde evenementen bijgewoond? Zo ja, welke?',
    de: 'Hast du schon einmal Burning Man-inspirierte Veranstaltungen besucht? Wenn ja, welche?',
    fr: 'Avez-vous déjà assisté à des événements inspirés de Burning Man? Si oui, lesquels?',
    es: '¿Has asistido a eventos inspirados en Burning Man antes? Si es así, ¿cuáles?',
    it: 'Hai mai partecipato a eventi ispirati a Burning Man? Se sì, quali?',
    pt: 'Você já participou de eventos inspirados no Burning Man antes? Se sim, quais?',
  },
  'bmnl.q4': {
    en: 'Burning Man environments can be intense. How do you respond when you\'re tired, overstimulated, or out of your comfort zone in a group?',
    nl: 'Burning Man-omgevingen kunnen intens zijn. Hoe reageer je als je moe, overprikkeld of buiten je comfortzone bent in een groep?',
    de: 'Burning Man-Umgebungen können intensiv sein. Wie reagierst du, wenn du müde, überreizt oder außerhalb deiner Komfortzone in einer Gruppe bist?',
    fr: 'Les environnements Burning Man peuvent être intenses. Comment réagissez-vous lorsque vous êtes fatigué, surstimulé ou hors de votre zone de confort dans un groupe?',
    es: 'Los entornos de Burning Man pueden ser intensos. ¿Cómo respondes cuando estás cansado, sobreestimulado o fuera de tu zona de confort en un grupo?',
    it: 'Gli ambienti Burning Man possono essere intensi. Come reagisci quando sei stanco, sovrastimolato o fuori dalla tua zona di comfort in un gruppo?',
    pt: 'Os ambientes do Burning Man podem ser intensos. Como você responde quando está cansado, superestimulado ou fora da sua zona de conforto em um grupo?',
  },
  'bmnl.q5': {
    en: 'Not all boundaries are explicit here. How do you act when you\'re unsure what\'s welcome or appropriate?',
    nl: 'Niet alle grenzen zijn hier expliciet. Hoe handel je als je niet zeker weet wat welkom of gepast is?',
    de: 'Nicht alle Grenzen sind hier explizit. Wie handelst du, wenn du unsicher bist, was willkommen oder angemessen ist?',
    fr: 'Toutes les limites ne sont pas explicites ici. Comment agissez-vous lorsque vous n\'êtes pas sûr de ce qui est bienvenu ou approprié?',
    es: 'No todos los límites son explícitos aquí. ¿Cómo actúas cuando no estás seguro de qué es bienvenido o apropiado?',
    it: 'Non tutti i confini sono espliciti qui. Come agisci quando non sei sicuro di cosa sia benvenuto o appropriato?',
    pt: 'Nem todos os limites são explícitos aqui. Como você age quando não tem certeza do que é bem-vindo ou apropriado?',
  },
  'bmnl.q6': {
    en: 'If someone gently challenges your behavior during the event, how do you respond?',
    nl: 'Als iemand je gedrag tijdens het evenement voorzichtig ter discussie stelt, hoe reageer je?',
    de: 'Wenn jemand dein Verhalten während der Veranstaltung sanft in Frage stellt, wie reagierst du?',
    fr: 'Si quelqu\'un remet doucement en question votre comportement pendant l\'événement, comment réagissez-vous?',
    es: 'Si alguien desafía suavemente tu comportamiento durante el evento, ¿cómo respondes?',
    it: 'Se qualcuno mette delicatamente in discussione il tuo comportamento durante l\'evento, come reagisci?',
    pt: 'Se alguém desafiar gentilmente seu comportamento durante o evento, como você responde?',
  },
  'bmnl.q7': {
    en: 'How do you respond when you learn something you did affected someone negatively (even unintentionally)?',
    nl: 'Hoe reageer je als je hoort dat iets wat je deed iemand negatief heeft beïnvloed (zelfs onbedoeld)?',
    de: 'Wie reagierst du, wenn du erfährst, dass etwas, das du getan hast, jemanden negativ beeinflusst hat (auch unbeabsichtigt)?',
    fr: 'Comment réagissez-vous lorsque vous apprenez que quelque chose que vous avez fait a affecté quelqu\'un négativement (même involontairement)?',
    es: '¿Cómo respondes cuando te enteras de que algo que hiciste afectó negativamente a alguien (incluso sin intención)?',
    it: 'Come reagisci quando scopri che qualcosa che hai fatto ha influenzato negativamente qualcuno (anche involontariamente)?',
    pt: 'Como você responde quando descobre que algo que fez afetou alguém negativamente (mesmo sem intenção)?',
  },
  'bmnl.q8': {
    en: 'How do you feel about there being expectations or standards of behaviour?',
    nl: 'Hoe voel je je over het feit dat er verwachtingen of gedragsstandaarden zijn?',
    de: 'Wie fühlst du dich darüber, dass es Erwartungen oder Verhaltensstandards gibt?',
    fr: 'Comment vous sentez-vous à propos du fait qu\'il y ait des attentes ou des normes de comportement?',
    es: '¿Cómo te sientes acerca de que haya expectativas o estándares de comportamiento?',
    it: 'Come ti senti riguardo al fatto che ci siano aspettative o standard di comportamento?',
    pt: 'Como você se sente sobre haver expectativas ou padrões de comportamento?',
  },
  'bmnl.q9': {
    en: 'Will you commit to one or two volunteer shifts during the event?',
    nl: 'Zul je je inzetten voor één of twee vrijwilligersdiensten tijdens het evenement?',
    de: 'Wirst du dich zu ein oder zwei Freiwilligenschichten während der Veranstaltung verpflichten?',
    fr: 'Vous engagerez-vous à effectuer un ou deux quarts de travail bénévole pendant l\'événement?',
    es: '¿Te comprometerás a hacer uno o dos turnos de voluntariado durante el evento?',
    it: 'Ti impegnerai a fare uno o due turni di volontariato durante l\'evento?',
    pt: 'Você se comprometerá a fazer um ou dois turnos de voluntariado durante o evento?',
  },
  'bmnl.q10': {
    en: 'What would you like to gift to the burn (time, skills, care, creativity)?',
    nl: 'Wat zou je graag willen geven aan de burn (tijd, vaardigheden, zorg, creativiteit)?',
    de: 'Was möchtest du dem Burn schenken (Zeit, Fähigkeiten, Fürsorge, Kreativität)?',
    fr: 'Qu\'aimeriez-vous offrir au burn (temps, compétences, soins, créativité)?',
    es: '¿Qué te gustaría regalar al burn (tiempo, habilidades, cuidado, creatividad)?',
    it: 'Cosa vorresti regalare al burn (tempo, abilità, cura, creatività)?',
    pt: 'O que você gostaria de presentear ao burn (tempo, habilidades, cuidado, criatividade)?',
  },
  'bmnl.q11': {
    en: 'What do you hope others will bring or offer — to you or to the community?',
    nl: 'Wat hoop je dat anderen zullen brengen of aanbieden — aan jou of aan de gemeenschap?',
    de: 'Was hoffst du, dass andere mitbringen oder anbieten werden — dir oder der Gemeinschaft?',
    fr: 'Qu\'espérez-vous que les autres apporteront ou offriront — à vous ou à la communauté?',
    es: '¿Qué esperas que otros traigan o ofrezcan — a ti o a la comunidad?',
    it: 'Cosa speri che gli altri portino o offrano — a te o alla comunità?',
    pt: 'O que você espera que outros tragam ou ofereçam — a você ou à comunidade?',
  },
  
  // UI Copy - Onboarding
  'ui.onboarding.title': {
    en: 'Create Your SoulSort Profile',
    nl: 'Maak je SoulSort-profiel',
    de: 'Erstelle dein SoulSort-Profil',
    fr: 'Créez votre profil SoulSort',
    es: 'Crea tu perfil SoulSort',
    it: 'Crea il tuo profilo SoulSort',
    pt: 'Crie seu perfil SoulSort',
  },
  'ui.onboarding.dealbreakers.title': {
    en: 'Check all boxes that would be dealbreakers for you in a partner:',
    nl: 'Vink alle vakjes aan die voor jou dealbreakers zouden zijn in een partner:',
    de: 'Markiere alle Kästchen, die für dich Dealbreaker in einem Partner wären:',
    fr: 'Cochez toutes les cases qui seraient des dealbreakers pour vous chez un partenaire:',
    es: 'Marca todas las casillas que serían dealbreakers para ti en una pareja:',
    it: 'Seleziona tutte le caselle che sarebbero dealbreaker per te in un partner:',
    pt: 'Marque todas as caixas que seriam dealbreakers para você em um parceiro:',
  },
  'ui.onboarding.preferences.title': {
    en: 'Use the sliders to select the spot that describes you best:',
    nl: 'Gebruik de schuifregelaars om de plek te selecteren die jou het beste beschrijft:',
    de: 'Verwende die Schieberegler, um die Stelle zu wählen, die dich am besten beschreibt:',
    fr: 'Utilisez les curseurs pour sélectionner l\'endroit qui vous décrit le mieux:',
    es: 'Usa los deslizadores para seleccionar el lugar que mejor te describe:',
    it: 'Usa i cursori per selezionare il punto che ti descrive meglio:',
    pt: 'Use os controles deslizantes para selecionar o ponto que melhor te descreve:',
  },
  'ui.onboarding.chat.intro': {
    en: 'I\'ll ask you {count} questions to understand what matters most to you in relationships.',
    nl: 'Ik zal je {count} vragen stellen om te begrijpen wat het belangrijkst voor je is in relaties.',
    de: 'Ich werde dir {count} Fragen stellen, um zu verstehen, was dir in Beziehungen am wichtigsten ist.',
    fr: 'Je vais vous poser {count} questions pour comprendre ce qui compte le plus pour vous dans les relations.',
    es: 'Te haré {count} preguntas para entender qué es lo más importante para ti en las relaciones.',
    it: 'Ti farò {count} domande per capire cosa conta di più per te nelle relazioni.',
    pt: 'Vou fazer {count} perguntas para entender o que é mais importante para você nos relacionamentos.',
  },
  'ui.onboarding.chat.placeholder': {
    en: 'Type your response...',
    nl: 'Typ je antwoord...',
    de: 'Gib deine Antwort ein...',
    fr: 'Tapez votre réponse...',
    es: 'Escribe tu respuesta...',
    it: 'Digita la tua risposta...',
    pt: 'Digite sua resposta...',
  },
  'ui.onboarding.chat.audio.hint': {
    en: 'You can answer in any language. Type or tap the mic to dictate.',
    nl: 'Je kunt in elke taal antwoorden. Typ of tik op de microfoon om te dicteren.',
    de: 'Du kannst in jeder Sprache antworten. Tippe oder tippe auf das Mikrofon, um zu diktieren.',
    fr: 'Vous pouvez répondre dans n\'importe quelle langue. Tapez ou appuyez sur le micro pour dicter.',
    es: 'Puedes responder en cualquier idioma. Escribe o toca el micrófono para dictar.',
    it: 'Puoi rispondere in qualsiasi lingua. Digita o tocca il microfono per dettare.',
    pt: 'Você pode responder em qualquer idioma. Digite ou toque no microfone para ditar.',
  },
  
  // UI Copy - Dashboard
  'ui.dashboard.title': {
    en: 'Your SoulSort Profile',
    nl: 'Je SoulSort-profiel',
    de: 'Dein SoulSort-Profil',
    fr: 'Votre profil SoulSort',
    es: 'Tu perfil SoulSort',
    it: 'Il tuo profilo SoulSort',
    pt: 'Seu perfil SoulSort',
  },
  'ui.dashboard.retake.prompt': {
    en: 'Just as you evolve, so does SoulSort. Answer our new and improved questions to go a layer deeper.',
    nl: 'Net zoals jij evolueert, evolueert SoulSort ook. Beantwoord onze nieuwe en verbeterde vragen om een laag dieper te gaan.',
    de: 'Genau wie du dich entwickelst, entwickelt sich auch SoulSort. Beantworte unsere neuen und verbesserten Fragen, um eine Schicht tiefer zu gehen.',
    fr: 'Tout comme vous évoluez, SoulSort évolue également. Répondez à nos questions nouvelles et améliorées pour aller plus en profondeur.',
    es: 'Así como evolucionas, SoulSort también evoluciona. Responde nuestras preguntas nuevas y mejoradas para ir una capa más profunda.',
    it: 'Proprio come evolvi, anche SoulSort evolve. Rispondi alle nostre domande nuove e migliorate per andare un livello più profondo.',
    pt: 'Assim como você evolui, o SoulSort também evolui. Responda nossas perguntas novas e melhoradas para ir uma camada mais profunda.',
  },
}

/**
 * Detect user's preferred language from browser
 * Falls back to 'en' if not supported
 */
export function detectLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en'
  
  const browserLang = navigator.language || navigator.languages?.[0] || 'en'
  const langCode = browserLang.split('-')[0].toLowerCase() as LanguageCode
  
  // Check if we support this language
  const supportedLanguages: LanguageCode[] = ['en', 'nl', 'de', 'fr', 'es', 'it', 'pt']
  return supportedLanguages.includes(langCode) ? langCode : 'en'
}

/**
 * Get translated string by key
 * @param key - Translation key (e.g., 'onboarding.q1', 'ui.dashboard.title')
 * @param lang - Language code (defaults to detected language)
 * @param params - Optional parameters for string interpolation (e.g., {count: 4})
 * @returns Translated string or key if not found
 */
export function t(
  key: string,
  lang?: LanguageCode,
  params?: Record<string, string | number>
): string {
  const language = lang || (typeof window !== 'undefined' ? detectLanguage() : 'en')
  const translation = translations[key]?.[language] || translations[key]?.['en'] || key
  
  // Simple string interpolation for params like {count}
  if (params) {
    return Object.entries(params).reduce(
      (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, String(paramValue)),
      translation
    )
  }
  
  return translation
}

/**
 * Get canonical English text (for LLM prompts)
 * Always returns English version regardless of user language
 */
export function getCanonicalText(key: string): string {
  return translations[key]?.['en'] || key
}

/**
 * Get all translations for a given key (useful for language switcher)
 */
export function getAllTranslations(key: string): Partial<Record<LanguageCode, string>> {
  return translations[key] || {}
}

