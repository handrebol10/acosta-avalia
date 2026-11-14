import type { Assessment, Student } from './types'
import { newAssessment, uid } from './store'

/** Aluno fictício com duas avaliações, para explorar o app */
export function demoData(): { student: Student; assessments: Assessment[] } {
  const student: Student = {
    id: uid(),
    name: 'Aluno Exemplo',
    sex: 'M',
    birthDate: '1992-05-10',
    goal: 'Emagrecimento e ganho de massa muscular',
    notes: 'Aluno fictício criado para demonstração. Pode excluir quando quiser.',
    createdAt: new Date().toISOString(),
  }

  const a1 = newAssessment(student.id)
  a1.date = shiftDays(-120)
  a1.anamnese = { ...a1.anamnese, parq: Array(7).fill(false), activityLevel: 'leve', objective: 'Reduzir gordura abdominal', sleepHours: 6 }
  a1.vitals = { restingHr: 78, systolic: 128, diastolic: 84 }
  a1.anthro = {
    weight: 88.4,
    height: 178,
    circ: { pescoco: 39.5, ombro: 118, torax: 104, cintura: 94, abdomen: 99, quadril: 104, bracoD: 34, bracoE: 33.5, bracoContD: 36, bracoContE: 35.5, antebracoD: 29, antebracoE: 28.5, coxaD: 60, coxaE: 59.5, panturrilhaD: 39, panturrilhaE: 38.5 },
  }
  a1.body = { method: 'dobras', protocol: 'jp7', equation: 'siri', folds: { peitoral: 18, axilarMedia: 20, triceps: 15, subescapular: 22, abdominal: 30, suprailiaca: 24, coxa: 19 } }
  a1.fitness = { vo2Test: 'cooper', cooperDistance: 2150, pushups: 19, situps: 28, sitReach: 24 }
  a1.fms = { squat: 2, hurdle: 2, lunge: 2, shoulder: 1, aslr: 2, pushup: 2, rotary: 2 }
  a1.posture.findings = ['cabeca-anteriorizada', 'ombros-protusos', 'hiperlordose', 'anteversao']

  const a2 = newAssessment(student.id, a1)
  a2.date = shiftDays(-15)
  a2.anamnese = { ...a1.anamnese, activityLevel: 'moderado', sleepHours: 7 }
  a2.vitals = { restingHr: 68, systolic: 122, diastolic: 80 }
  a2.anthro = {
    weight: 84.1,
    height: 178,
    circ: { pescoco: 39, ombro: 119.5, torax: 103, cintura: 89, abdomen: 93.5, quadril: 101.5, bracoD: 34.5, bracoE: 34, bracoContD: 37, bracoContE: 36.5, antebracoD: 29.5, antebracoE: 29, coxaD: 59, coxaE: 58.5, panturrilhaD: 39, panturrilhaE: 38.5 },
  }
  a2.body.folds = { peitoral: 13, axilarMedia: 15, triceps: 12, subescapular: 17, abdominal: 22, suprailiaca: 17, coxa: 15 }
  a2.fitness = { vo2Test: 'cooper', cooperDistance: 2480, pushups: 27, situps: 36, sitReach: 28 }
  a2.fms = { squat: 2, hurdle: 2, lunge: 3, shoulder: 2, aslr: 2, pushup: 3, rotary: 2 }
  a2.posture.findings = ['cabeca-anteriorizada', 'hiperlordose']
  a2.notes = 'Boa evolução: redução de 5,5 cm de abdômen e melhora do condicionamento.'

  return { student, assessments: [a1, a2] }
}

function shiftDays(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
