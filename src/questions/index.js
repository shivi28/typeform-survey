import { studentQuestions } from './studentQuestions';
import { itProfessionalQuestions } from './itProfessionalQuestions';
import { doctorQuestions } from './doctorQuestions';
import { governmentEmployeeQuestions } from './governmentEmployeeQuestions';
import { otherQuestions } from './otherQuestions';

export const questionSets = {
  student: studentQuestions,
  itProfessional: itProfessionalQuestions,
  doctor: doctorQuestions,
  governmentEmployee: governmentEmployeeQuestions,
  other: otherQuestions
}; 