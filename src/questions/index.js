import { studentQuestions } from './studentQuestions';
import { softwareEngineerQuestions } from './softwareEngineerQuestions';
import { managerQuestions } from './managerQuestions';
import { doctorQuestions } from './doctorQuestions';
import { otherQuestions } from './otherQuestions';

export const questionSets = {
  student: studentQuestions,
  softwareEngineer: softwareEngineerQuestions,
  manager: managerQuestions,
  doctor: doctorQuestions,
  other: otherQuestions
}; 